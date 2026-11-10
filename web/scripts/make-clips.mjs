/* Chinese “一分钟看懂” clips. Frames are drawn in the page, timed to the narration.
   English files are not generated. Output: <repo>/videos/zh/<key>.{mp4,vtt,jpg} */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const repo = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(repo, 'videos/zh');
mkdirSync(outDir, { recursive: true });

const INK = '#1c1915', NAVY = '#15202b', CARD = '#fffcf7', LINK = '#1a4a6b', GOOD = '#135636', MARK = '#5c3b12', LINE = '#d9d3c7', HL = '#7a3f06';

/** Plain narration. One idea, then the hand-off. No teaching-method talk. */
const SCRIPT = {
  '0': '有些事没法事先列成一张死表，比如下一个字该说什么。换个办法：先给一排能拧的旋钮，再用看见的例子把它们拧对。样本是几对输入和结果。旋钮拧对以后，没见过的数也能算。这一站先把这件事说清。下一站要说的是，下一个字有多大可能。',
  P: '下一个字不是一个死答案，而是每个候选有多大可能。每个可能从 0 到 1，全部加起来必须正好是 1。少了，说明还有可能没分出去。多了，就不叫一份完整的可能性。这一站把这件事说清。下一站用这个数来量，这次猜得有多离谱。',
  '1': '猜得越离谱，罚分应该越大。差一点和差很远，不能记成同一个错。把正确答案的可能性取对数再取负，可能性越小，罚分冲得越高。罚分收成一个能比较的数以后，才知道旋钮该往哪边拧。下一站要在看不见碗底的时候，顺着脚下的坡走。',
  '2': '碗底看不见的时候，不要把每颗旋钮从负一百试到正一百。脚下这一小块有个坡。顺着坡迈一小步，再看新的坡。两颗旋钮可以在同一步里一起改，而不是先拧完一颗再重算另一颗。步子太大，会荡过碗底。下一站要对付一条直线怎么切都切不开的点。',
  '3': '四个点分坐在对角上，一条直线怎么切都有一个站错队。中间放几颗神经元，每颗只弯一小段。右边把这几段加起来，才能贴住先升后降的点，也能把两种颜色分开。少了中间那一弯，叠多少层直线都还是一条直线。下一站要把谁让罚分变大，从最后一层传回最前面。',
  '4': '网络是函数套着函数。最后一层转了多少，可以反推前面每一层该怎么动。整条链的坡，是每一层的倍数连乘。只留下最后一层，前面的旋钮就再也听不到罚分。这就是把坡传回去。下一站要面对很多条数据，不能每一步都全部看完。',
  '5': '数据有上百万条的时候，每一步看完全部又慢又贵。每次只抽一小袋来估坡，便宜，还有一点噪声帮你离开坏坑。方向一直没变的坡，留住一部分，步子会越走越顺。练得太贴着练习册，新数据上反而变差。下一站要把一个词变成一排能比较方向的数。',
  '6': '猫和狗不该只是两个互不相干的编号。把每个词放成一排数，方向更齐的两个词，乘出来的数更大。猫离狗近，离汽车远。切词的时候，最常挨在一起的字先粘成一块。下一站要让后面的词还能回头看见开头。',
  '7': '一个词一个词往后传，开头那一点会越来越淡。句子一长，前面的意思就快没了。所以不要只靠往下传。每个词都应该能回头看整句，按对得上的程度取别人的内容。下一站就看，句中的“它”到底在看前面的哪个词。',
  '8a': '句子里的“它”不是去听最近的那个词。它拿自己的需求，去对每个词的名牌。对得上的，多取一点内容。对不上的，少取。小猫分到大头，垫子其次，旁边的“因为”虽然近，却分得很少。不先把分数缩小，几乎会只看见分数最大的那一个。下一站把这样的一层层楼叠起来。',
  '8b': '一层楼里先做三件事。词先互相看，对一下名牌。然后把原来的说法加回来，免得传着传着走样。最后每个词再各自消化。头变多的时候，每个头变窄，拼回去仍是原来的宽度。下一站用大段文字自己当答案，把这栋房子练起来。',
  '9': '“天空是蓝色的”这一句，同时在练好几道猜下一个字的题。答案就是文本里的下一个字，不用另外找人来标。开练时，正确的字只有很小的可能。练过以后，这份可能升上去。温度不拧已经学好的旋钮，只把这份分布拧尖或者拧平。下一站要分清，它是真的会了，还是只是很有把握地胡编。',
  E: '犹豫变少，只说明它更敢下判断。胡编也可以说得很有把握。所以不能只看这一个数，就说它更有用。换一套题量不同的卷子，做对的题数也不能直接比。要看的是，在同一张卷子上答对了多少。下一站让人指出哪一份回答更好。',
  '10': '模型先写出两份回答。人指出哪一份更好。旋钮按这个偏好挪，而不是按一个事先写死的标准答案。把两份的差直接当成概率会出错：差太大时，概率会超过 1。下一站要在不把整块都解开的情况下，给一个新任务留一条细路。',
  '11': '整块矩阵都解开再训练，省下的地方立刻还回去，每个新任务还要再存一整份。换成旁边一条细路：大块冻住，只拧这条细路，再加回原来的结果。路要接得回原来的宽度，输出的个数才对得上。下一站要让已经算过的内容不用每次从头再算。',
  '12': '已经问过的内容，记在本子上。下一步就不用把它们再算一遍。本子里要留下用来混合的那一部分，不能只留一半。每个数少记几位，本子会更薄，但不是消失。下一站要在开口之前，先从资料里找出相关的一段。',
  '13': '回答之前，先到资料里找。方向更齐的段落，更可能相关。只比乘出来的数、不看长度，更厚的那一页会因为更厚而得分高。找出相关的一段以后，再让模型根据这段来答，而不是凭空编。下一站让它在回答之外，还能去用一个外面的工具。',
  '14': '有的问题要先查、再算、再写下来。每一步都可能失手。步数一多，全程都做对的可能，是把每一步的成功率乘起来，掉得很快。会改掉东西的那一步，要等人点头。少掉一次确认，写入会在没人同意时发生。下一站要分清哪些动作必须停下来问。',
  S: '不是每个动作都要打断人。只读的查询，问一次就够烦。会改数据、会花钱、会发到外面的动作，必须停下来等点头。模型决定去调用，还不等于已经执行。下一站把一张图也切成小块，走和文字同一条路。',
  '15a': '一张图不能整张塞进原来只吃文字的那条路。先把它切成一样大的小块，每块当成一个词。小块的边要能铺满图的边。只数一条边，会把另一条边漏掉。切好以后，这些块和文字一起走。下一站要让它在很长的一段里少走神。',
  '15b': '窗口变长，不等于中间那段也被用到。长文档仍然可能在中段走神。同一个问题多写几份，留下它们一致的那份，比只取最大的一次更稳。取平均，又可能得到一个谁都没写过的数。下一站把检索、工具和这些窗口排成一个能交出去的顺序。',
  A: '一个能交出去的用法，不是再加一排新旋钮。它是把已经会的几件事排好：先检索，再调用工具，再续写，并且在会改东西的地方停下来问。每一步的成功率要乘在一起，不能在外面再乘一次步数。下一站回头把整条链核对一遍。',
  '16': '从一条直线走到能看图、能用工具，换过的是任务和数据。罚分往下走，旋钮跟着坡动，这一套没有换。重读的时候，一次只核对一个想法，并且连着做对，才知道这一站是站住了，还是只是眼熟。到这里，这条链就合上了。',
};

const MORE = {
  '0': '眼睛还能从三个点读出斜率是 2、截距是 1。样本一旦堆到很多条，每条又有很多个方向，眼睛就不够用，得让机器自己把旋钮停在该停的地方。拧的时候看的是差多少，不是把样本背下来。',
  P: '大模型算的也是这件事：已知前面的字，下一个字各有多大可能。只看谁最大，会漏掉其余那些加起来并不小的可能。先把全部可能性分完，再谈谁更像答案。',
  '1': '只记对或者错，模型就分不出勉强猜对和很有把握。罚分的形状一换，旋钮该拧的方向也会换。所以先把罚分说成一个数，下一站才有坡可以顺着走。',
  '2': '在碗边上，两颗旋钮的坡都指向碗底。减去一个负数，旋钮就变大。步子乘上学习率，是为了这一步小一点，不要一下冲过最低的那一圈。拖动画布，可以换个角度看这只碗。',
  '3': '线上的旋钮管这一段弯得多陡，圆圈里的旋钮管从哪里开始弯。单独一条弯贴不住这些先升后降的点，所以四段要一起加。右边那一列小方框，就是每一段，用加号叠进总曲线。',
  '4': '像一排齿轮：最后一片转了多少，可以反推前面每一片。带一个“小于 0 就当成 0”的弯时，坡还要再穿过这一层。弯在正的那一侧，才把前面的信号放过去。',
  '5': '等全部看完再动一次，一轮就只迈一步，既贵，也没有那一点噪声帮你离开坏坑。把一袋里有多少条，误说成走了多少步，数就会错。方向一致的时候，过去的坡先变轻，新的再叠上去。',
  '6': '切词时，语料里反复一起出现的字先粘成一块。猫和汽车的方向并不齐，不能因为词表很长，就说它们很像。点一下一个词，可以看见它离哪两个词最近。',
  '7': '三个词的分数先取指数，再除以总和，分到的重量才是一份完整的可能性。句子更长的时候，步数仍然顺着读，不能一步把所有词一起看完，那已经不是接力纸条能做到的事。',
  '8a': '按距离来听，它会去听最近的“因为”，而句子里它其实指向小猫。去掉缩小这一步，几乎全部注意力又会堆在分数最大的那一个词上。热的那一格，就是它看得最多的字。',
  '8b': '最早那篇论文把这样的一层叠了六层。六本身没有魔力，少一层多一层都可以试。每个头变窄，拼回去仍是原来的宽度，这一层才站得住。把头数乘回宽度，楼会无缘无故变宽。',
  '9': '只练最后一个字，前面的字就白读了。温度若被当成越高越聪明，拧平的分布会被误读成能力。温度不改已经学好的旋钮，只决定这一次抽得有多尖。',
  E: '同一张卷子才比得了分。困惑度下降，可能只是它更少犹豫。换一套题，做对的个数也不能直接比。先问这一次有没有答对，再问它有多犹豫。',
  '10': '两份分数一样的时候，不能说其中一份绝不可能更好。人点的那一下，是这一站的信号。旋钮按这个偏好挪，练的仍是原来那套往下走的办法。',
  '11': '支路若细到接不回原来的宽度，输出的个数会对不上。把整块一起解开，每个任务都要再存一整份，省下的地方就还回去了。细路是为了少拧、少存。',
  '12': '本子里要留下用来混合的内容。只留一半，下一步就缺了要混进去的那一块。每个数少记几位，本子大约再薄一截，答案仍从同一条路上出来。',
  '13': '休假那一章不该输给一篇更长的无关文档。先按方向比，再除掉长度的影响。找出的那段要真和问题有关，模型才是在用资料，而不是在凭空接话。',
  '14': '每一步都有失手的可能。二十步都做对，要把每一步的成功率乘起来，掉得很快。少掉一次确认，写入会在没人点头时发生。工具是帮手，不是自动执行的开关。',
  S: '只读的查询若也每次打断人，最小的权限就变成最大的麻烦。高风险的动作若一次都不问，模型决定去调用，就等于已经做了。该停的个数，并不等于动作的总数。',
  '15a': '小块的边和图的边要除得尽。把两边乘在一起，会得到比整条边还长的一串，小块铺不满。只数一条边，196 会变成 14。切好的小块，和文字走同一条路。',
  '15b': '五次里只取最大的那个数，会把只出现一次的偶然答案留下来。取平均，又可能得到一个谁都没写过的数。留下几份里一致的那一份，答得更稳。长窗口仍然要检查中间有没有被用到。',
  A: '四步都留下、一步都不丢掉，不相关的段落会混进回答，也更贵。检索留下多少，要看这一步还帮不帮忙。一个能交出去的用法，是把顺序排好，不是再加一排新旋钮。',
  '16': '重读时若把整条链当成必须一次背完，进度就又变回翻过多少页。一次只核对一个想法，并且连着做对，才知道这一站是站住了，还是只是眼熟。从直线到能看图、能用工具，这一套往下走的办法没有换。',
};

const AGAIN = {
  '0': '线靠近点的时候，罚分变小。离得远，罚分变大。所以这一站的旋钮，管的是斜率和从哪里起步。',
  P: '把剩下的可能性再平分，每个其余的候选才得到自己的一份。先用 1 减去已经占去的，再除以剩下的个数。',
  '1': '四个候选的分数有正有负。先取指数，全部变成正的，再除以总和，才是加起来等于 1 的可能性。',
  '2': '球从碗边滚下去，留下一串点，停在圈住的最低处。旋钮 w 和旋钮 b 标在碗底的两条边上，竖着的是罚分。',
  '3': '左边进一个数，中间四颗神经元各自弯出一小段，右边把它们加起来。这就是一个最小的人工神经网络。',
  '4': '三层各放大若干倍的时候，总的坡是这三个倍数乘起来，不是加起来。漏掉任何一层，前面的旋钮就少了一截信号。',
  '5': '练习册上的分还在涨、新数据上的分却掉下去，就是背下来了。要留一份没拿来拧旋钮的数据，专门用来决定什么时候停。',
  '6': '一排数的方向，比这排数有多长更要紧。猫和狗的方向更齐，所以它们乘出来的数，比猫和汽车更大。',
  '7': '开头的那一点如果已经淡得看不见，后面的词就接不上前面的意思。回头看，是为了把开头也留在这一步里。',
  '8a': '名牌对上了，就多取一点那个词的内容。对不上，就少取。混在一起的新说法，才是这一步交出去的结果。',
  '8b': '加回原稿，是留一条不会越乘越小的直路。各自消化，是每个词再单独过一遍，不跟别人混在这一步里。',
  '9': '开练的时候，正确的字只有很小的一份可能。练过一段以后，这份可能会升上去。看的就是这个数有没有上来。',
  E: '同一张卷子上，做对的比例才能拿来比。一份回答很坚决，仍然可能是编的。先看对不对，再看它有多犹豫。',
  '10': '偏好来自人的比较，不来自一张事先写死的标准答案。两份一样好的时候，不能把其中一份的可能写成 0 或 1。',
  '11': '细路的结果要加回原来的输出。只拧细路，是因为新任务不该把整块都重写一遍。',
  '12': '本子薄，下一步才快。薄的办法是少记几位、少留已经不用的部分，不是把要混合的内容丢掉。',
  '13': '相关的一段找错了，后面写得再顺也是答非所问。所以这一站先看找得准不准，再看写得像不像。',
  '14': '成功率要连乘。一步 0.9，二十步以后就不再是 0.9。会改掉别人数据的那一步，不能悄悄做完。',
  S: '该问的时候不问，是把决定当成了已经执行。不该问的时候次次问，人就没法把真有风险的那一下看清楚。',
  '15a': '小块铺满以后，每一块走的路和文字相同。图不再是另一套完全不同的算法，而是多出来的一串词。',
  '15b': '一致的那一份，比偶然最大的那一次更可信。窗口里的中段如果从来没被用到，把窗口加长也补不回来。',
  A: '顺序错了，检索、工具和续写会互相绊住。贵的那一步少做，不相关的段落少留，交出去的才是一个能用的结果。',
  '16': '一次只核对一个想法。连着做对，才算这一站站住了。眼熟和会做，不是同一件事。',
};
for (const k of Object.keys(SCRIPT)) SCRIPT[k] += (MORE[k] || '') + (AGAIN[k] || '');

const SCENE = {
  '0': 'knob', '1': 'pen', '2': 'bowl', '3': 'net', '4': 'chain', '5': 'bag',
  '6': 'cloud', '7': 'note', '8a': 'attn', '8b': 'stack', '9': 'next',
  P: 'dice', E: 'score', '10': 'pair', '11': 'side', '12': 'book', '13': 'find',
  '14': 'tool', S: 'stop', '15a': 'patch', '15b': 'window', A: 'order', '16': 'chain2',
};

const html = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:${CARD};font-family:"Noto Sans CJK SC","Source Han Sans SC",sans-serif}
svg{display:block;width:1280px;height:720px}
</style><svg id="s" viewBox="0 0 1280 720" width="1280" height="720"></svg>
<script>
const INK=${JSON.stringify(INK)}, NAVY=${JSON.stringify(NAVY)}, CARD=${JSON.stringify(CARD)}, LINK=${JSON.stringify(LINK)}, GOOD=${JSON.stringify(GOOD)}, MARK=${JSON.stringify(MARK)}, LINE=${JSON.stringify(LINE)}, HL=${JSON.stringify(HL)};
const esc = (s) => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function wrap(s) {
  const lines = [];
  let cur = '';
  for (const ch of s) {
    cur += ch;
    if ([...cur].length >= 18) { lines.push(cur); cur = ''; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}
function caption(s) {
  return wrap(s).map((line, i) => '<text x="80" y="' + (560 + i * 36) + '" fill="' + INK + '" font-size="28">' + esc(line) + '</text>').join('');
}
function knob(t) {
  const ang = (-140 + t * 200) * Math.PI / 180;
  const x = 280 + Math.sin(ang) * 70, y = 250 - Math.cos(ang) * 70;
  const pts = [[1,3],[2,5],[3,7]].map(([a,b]) => [760 + a * 70, 420 - b * 36]);
  const y0 = 420 - (t * 4) * 36, y1 = 420 - (t * 4 * 4) * 36;
  return '<circle cx="280" cy="250" r="90" fill="none" stroke="' + NAVY + '" stroke-width="8"/>'
    + '<line x1="280" y1="250" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + NAVY + '" stroke-width="8"/>'
    + '<line x1="760" y1="' + y0.toFixed(1) + '" x2="1040" y2="' + y1.toFixed(1) + '" stroke="' + LINK + '" stroke-width="6"/>'
    + pts.map(([px,py]) => '<circle cx="' + px + '" cy="' + py + '" r="10" fill="' + HL + '"/>').join('')
    + '<text x="80" y="120" fill="' + INK + '" font-size="36">拧旋钮，让线靠近点</text>';
}
function bowl(t) {
  const a = Math.PI * (1.15 - t * 0.7);
  const x = 640 + Math.cos(a) * 220, y = 430 - Math.sin(a) * 80;
  return '<path d="M280 460 Q640 560 1000 460" fill="none" stroke="' + LINK + '" stroke-width="8"/>'
    + '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="22" fill="' + HL + '"/>'
    + '<text x="80" y="120" fill="' + INK + '" font-size="36">顺着坡，走向碗底</text>';
}
function net(t) {
  const ys = [180, 280, 380, 480];
  const cols = [LINK, GOOD, HL, '#1e40af'];
  let s = '<text x="80" y="100" fill="' + INK + '" font-size="36">四小段弯，加起来</text>';
  s += '<circle cx="180" cy="330" r="28" fill="none" stroke="' + INK + '" stroke-width="4"/>';
  ys.forEach((y, i) => {
    s += '<line x1="180" y1="330" x2="460" y2="' + y + '" stroke="' + cols[i] + '" stroke-width="4"/>';
    s += '<line x1="460" y1="' + y + '" x2="760" y2="330" stroke="' + cols[i] + '" stroke-width="4"/>';
    s += '<circle cx="460" cy="' + y + '" r="26" fill="none" stroke="' + cols[i] + '" stroke-width="4"/>';
    const bend = 80 + i * 36 + Math.sin(t * 6 + i) * 16;
    s += '<path d="M860 ' + (y - 10) + ' q 40 ' + (-bend * t) + ' 120 0" fill="none" stroke="' + cols[i] + '" stroke-width="4"/>';
  });
  s += '<circle cx="760" cy="330" r="28" fill="none" stroke="' + INK + '" stroke-width="4"/>';
  return s;
}
function attn(t) {
  const words = ['小猫', '垫子', '因为', '它'];
  const w = [0.62, 0.28, 0.1, 0].map((v, i) => i === 3 ? 0 : v * t);
  let s = '<text x="80" y="120" fill="' + INK + '" font-size="36">“它”在看谁</text>';
  words.forEach((word, i) => {
    const y = 200 + i * 80;
    s += '<text x="200" y="' + (y + 28) + '" fill="' + INK + '" font-size="32">' + word + '</text>';
    s += '<rect x="360" y="' + y + '" width="' + (520 * (w[i] || 0.04)) + '" height="36" rx="8" fill="' + (i === 0 ? HL : LINK) + '"/>';
  });
  return s;
}
function stack(t) {
  let s = '<text x="80" y="120" fill="' + INK + '" font-size="36">一层楼：对名牌，加回原稿，再各自消化</text>';
  const names = ['各自消化', '加回原稿', '对一下名牌'];
  names.forEach((name, i) => {
    const show = t > i / 3;
    const y = 180 + i * 120;
    s += '<rect x="180" y="' + y + '" width="760" height="90" rx="12" fill="' + CARD + '" stroke="' + (show ? NAVY : LINE) + '" stroke-width="4"/>';
    s += '<text x="210" y="' + (y + 56) + '" fill="' + INK + '" font-size="32">' + name + '</text>';
  });
  return s;
}
const simple = {
  pen: '可能性越小，罚分越高',
  dice: '全部可能性加起来是 1',
  chain: '坡一层层乘回去',
  bag: '一小袋一小袋地走',
  cloud: '方向更齐，乘出来更大',
  note: '回头看整句，不要只往下传',
  next: '每一步都在猜下一个字',
  score: '更有把握，不等于答对了',
  pair: '人指出哪一份更好',
  side: '大块冻住，只拧旁边的细路',
  book: '问过的记在本子上',
  find: '先找出相关的一段',
  tool: '会改东西的那一步，要等人点头',
  stop: '会花钱、会改数据的，必须停下来问',
  patch: '图切成小块，再当词来走',
  window: '窗口变长，不等于中间也被用到',
  order: '检索、工具、续写，排好再交出去',
  chain2: '罚分往下走，旋钮跟着坡，这一套没换',
};
function draw(kind, t, sentence) {
  if (kind === 'knob') return knob(t);
  if (kind === 'bowl') return bowl(t);
  if (kind === 'net') return net(t);
  if (kind === 'attn') return attn(t);
  if (kind === 'stack') return stack(t);
  const title = simple[kind] || simple.chain2;
  const bar = 200 + 700 * t;
  return '<text x="80" y="180" fill="' + INK + '" font-size="40">' + esc(title) + '</text>'
    + '<rect x="80" y="280" width="' + bar + '" height="28" rx="8" fill="' + LINK + '"/>'
    + '<circle cx="' + (80 + bar) + '" cy="294" r="18" fill="' + HL + '"/>'
    + caption(sentence);
}
window.render = ({ kind, t, sentence }) => {
  document.getElementById('s').innerHTML = '<rect width="1280" height="720" fill="' + CARD + '"/>' + draw(kind, t, sentence) + caption(sentence);
};
</script>`;

function sentences(text) {
  return text.split(/(?<=。)/).map((s) => s.trim()).filter(Boolean);
}

function tts(text, mp3, vtt) {
  const r = spawnSync('edge-tts', ['--voice', 'zh-CN-XiaoxiaoNeural', '--rate=-35%', '--text', text, '--write-media', mp3, '--write-subtitles', vtt], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || 'edge-tts failed');
}

function cuesFromVtt(vtt, n) {
  const raw = readFileSync(vtt, 'utf8');
  const times = [...raw.matchAll(/(\d\d):(\d\d):(\d\d)\.(\d+)\s+-->\s+(\d\d):(\d\d):(\d\d)\.(\d+)/g)].map((m) => {
    const a = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
    const b = (+m[5]) * 3600 + (+m[6]) * 60 + (+m[7]) + (+m[8]) / 1000;
    return [a, b];
  });
  if (times.length >= n) {
    const groups = Array.from({ length: n }, (_, i) => {
      const a = Math.floor(i * times.length / n);
      const b = Math.floor((i + 1) * times.length / n) - 1;
      return [times[a][0], times[Math.max(a, b)][1]];
    });
    return groups;
  }
  return null;
}

function duration(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  return Number(r.stdout.trim());
}

const only = process.argv.slice(2);
const keys = only.length ? only : Object.keys(SCRIPT);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(html);

for (const key of keys) {
  const text = SCRIPT[key];
  if (!text) throw new Error('no script ' + key);
  const work = join(tmpdir(), 'si-clip-' + key);
  mkdirSync(work, { recursive: true });
  const mp3 = join(work, 'a.mp3');
  const vtt = join(work, 'a.vtt');
  tts(text, mp3, vtt);
  const lines = sentences(text);
  const dur = duration(mp3);
  let cues = cuesFromVtt(vtt, lines.length);
  if (!cues) {
    const weights = lines.map((s) => [...s].length);
    const sum = weights.reduce((a, b) => a + b, 0);
    let t = 0;
    cues = weights.map((w) => { const a = t; t += dur * w / sum; return [a, t]; });
  }
  const fps = 8;
  const n = Math.max(8, Math.ceil(dur * fps));
  const kind = SCENE[key] || 'chain2';
  for (let i = 0; i < n; i++) {
    const time = (i / fps);
    let si = cues.findIndex(([a, b]) => time >= a && time < b);
    if (si < 0) si = time >= cues[cues.length - 1][0] ? cues.length - 1 : 0;
    const [a, b] = cues[si];
    const local = b > a ? Math.min(1, (time - a) / (b - a)) : 0;
    await page.evaluate((arg) => window.render(arg), { kind, t: local, sentence: lines[si] });
    await page.screenshot({ path: join(work, String(i).padStart(4, '0') + '.png'), type: 'png' });
  }
  await page.screenshot({ path: join(outDir, key + '.jpg'), type: 'jpeg', quality: 70 });
  const mp4 = join(outDir, key + '.mp4');
  const ff = spawnSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', join(work, '%04d.png'), '-i', mp3,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'baseline', '-level', '3.1',
    '-b:v', '420k', '-maxrate', '520k', '-bufsize', '1040k',
    '-c:a', 'aac', '-b:a', '64k', '-shortest', '-movflags', '+faststart', mp4], { encoding: 'utf8' });
  if (ff.status !== 0) throw new Error(ff.stderr.split('\n').slice(-20).join('\n'));
  writeFileSync(join(outDir, key + '.vtt'), readFileSync(vtt));
  const size = spawnSync('stat', ['-c', '%s', mp4], { encoding: 'utf8' }).stdout.trim();
  console.log(key, dur.toFixed(1) + 's', (Number(size) / 1048576).toFixed(2) + 'MB');
}
await browser.close();
const manifest = { zh: keys.filter((k) => existsSync(join(outDir, k + '.mp4'))), en: [] };
writeFileSync(join(repo, 'web/src/dv/clips.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('manifest', manifest.zh.length);
