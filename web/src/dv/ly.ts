/* R52 layered body on every derivation station: one screen of the idea, then the picture, the numbers,
   the formula, and the quiz. Unlabeled dots mark how far the page is open; nothing on screen names a teaching
   procedure. The depth switch 30 秒 / 5 分钟 / 深入 caps what can be shown (1 / 3 / 5) and is remembered in
   localStorage, as is how far each page has been opened. Nothing here navigates, so it never adds a history entry.
   A lazy chunk: loaded only when a station with `ly` is opened. */
import './ly.css';
import { tx, type L } from '../l4/txt';
import type { Ly, Stage } from './types';
import { fillDvText } from './nums';
import { D_SM4, fmt, softmax } from '../vf/calc';
import { LIFE_CAP, life } from './ill';
import { workedHtml } from './rail';
import { DEMO } from '../vf/data';
import { BRIDGE, CLOSE, LOOK, WHY } from './voice';
import { clipHtml } from './clip';

import { LY_DEPTH, depthGet, depthSet, okD, type Depth } from './prog';

export { LY_DEPTH, depthGet, depthSet, type Depth };
export const LY_OPEN = 'si.ly.open';
/** how many layers each depth can show */
export const DEPTH_MAX: Readonly<Record<Depth, number>> = { s: 1, m: 3, d: 5 };
/** the smallest depth that shows layer k */
export const depthFor = (k: number): Depth => (k <= 1 ? 's' : k <= 3 ? 'm' : 'd');
const openAll = (): Record<string, number> => { try { const v = JSON.parse(localStorage.getItem(LY_OPEN) || '{}') as unknown; return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, number>) : {}; } catch { return {}; } };
/** how many layers of `page` the reader has opened (1–5) */
export const openGet = (page: string) => { const n = Number(openAll()[page]); return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 1; };
const openSet = (page: string, n: number) => { const o = openAll(); o[page] = n; try { localStorage.setItem(LY_OPEN, JSON.stringify(o)); } catch { /* private mode */ } };
/** layers shown = what was opened, capped by the depth */
export const shown = (open: number, d: Depth) => Math.max(1, Math.min(open, DEPTH_MAX[d]));

const NAME: readonly (readonly [string, string])[] = [['类比', 'Analogy'], ['图', 'Picture'], ['数字', 'Numbers'], ['公式', 'Formula'], ['小测', 'Check']];
/** depth labels stay in the source so both languages name the same three depths, even though the switch is not on the page */
export const DLAB: Readonly<Record<Depth, readonly [string, string]>> = { s: ['30 秒', '30 sec'], m: ['5 分钟', '5 min'], d: ['深入', 'Deep'] };

type Mk = (s: string) => string;
const P = (xs: string[], mk: Mk, c = '') => xs.map((x) => `<p${c ? ` class="${c}"` : ''}>${mk(x)}</p>`).join('');
const MOT = new Set(['6', '7', '8b', '9', '12']);

/* ---------- the pictures (pure html; the attention one is an animation in ./att) ---------- */
function picSm(l: L, mk: Mk) {
  const z = (a: string, b: string) => tx([a, b], l), p = softmax(D_SM4), lab = l === 'zh' ? ['蓝', '绿', '红', '天'] : ['blue', 'green', 'red', 'sky'];
  const rows = D_SM4.map((v, i) => `<div class="ly-smr"><span class="ly-sml">${lab[i]}</span><span class="ly-c ly-q ly-sms">${fmt(v, 1)}</span><span class="ly-sma" aria-hidden="true">→</span><span class="ly-smb"><i style="width:${Math.max(2, Math.round(100 * p[i]!))}%"></i></span><span class="ly-c ly-k ly-smp">${fmt(100 * p[i]!, 1)}%</span></div>`).join('');
  // the penalty curve −ln p on p ∈ (0, 1], the three probabilities the page talks about marked
  const X = (q: number) => 8 + q * 284, Y = (v: number) => 8 + (1 - Math.min(v, 3.5) / 3.5) * 84;
  let c = ''; for (let k = 0; k <= 60; k++) { const q = 0.03 + (0.97 * k) / 60; c += `${k ? 'L' : 'M'}${X(q).toFixed(1)} ${Y(-Math.log(q)).toFixed(1)}`; }
  const pts = [[0.0536, 'var(--bad)'], [p[0]!, 'var(--highlight)'], [0.998, 'var(--good)']] as const;
  const svg = `<svg class="ly-pen" viewBox="0 0 300 100" role="img" aria-label="${z('罚分曲线：概率越小，罚分越大', 'Penalty curve: the smaller the probability, the bigger the penalty')}"><line x1="8" y1="92" x2="292" y2="92" stroke="var(--link)"/><line x1="8" y1="8" x2="8" y2="92" stroke="var(--link)"/><path d="${c}" fill="none" stroke="var(--link)" stroke-width="2.5"/>${pts.map(([q, col]) => `<circle cx="${X(q).toFixed(1)}" cy="${Y(-Math.log(q)).toFixed(1)}" r="5" fill="${col}"/>`).join('')}</svg>`;
  const leg = [[`{#p0}`, `{#ce0}`, 'r'], [`${fmt(100 * p[0]!, 1)}%`, '`−ln 0.625 ≈ 0.47`', 'q'], [`{#p1}`, `{#ce1}`, 'k']].map(([a, b, c2]) => {
    const body = mk(fillDvText(`p=${a} → ${z('罚分', 'penalty')} ${b}`, l));
    // keep the trailing number with the arrow so 360px never leaves a one-glyph last line
    return `<li><span class="ly-dot ly-${c2}" aria-hidden="true"></span><span class="nw">${body}</span></li>`;
  }).join('');
  return `<div class="ly-sm" role="group" aria-label="softmax"><div class="ly-smh"><span>${z('候选', 'Token')}</span><span class="ly-c ly-q">${z('分数', 'Score')}</span><span></span><span class="ly-c ly-k">${z('softmax 后的概率', 'Probability after softmax')}</span></div>${rows}</div>
<p class="ly-cap">${z('罚分 = −ln p（横轴：给正确答案的概率 p，纵轴：罚分）', 'Penalty = −ln p (across: the probability p of the right answer; up: the penalty)')}</p>${svg}<ul class="ly-leg">${leg}</ul>`;
}
function picBlk(l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  return `<div class="ly-blk" role="group" aria-label="${z('一个解码块', 'One decoder block')}"><div class="ly-bx">${z('输入：每个词一串数', 'In: one list of numbers per word')}</div>
<div class="ly-bs"><span class="ly-bn">${z('× N 层', '× N layers')}</span>
<div class="ly-br c">${z('归一化', 'Normalise')}</div><div class="ly-br q">${z('多头注意力：词和词交流', 'Multi-head attention: words talk')}<small class="ly-c ly-r">${z('位置：RoPE 旋转 q、k', 'Position: RoPE rotates q, k')}</small></div><div class="ly-ba">${z('⊕ 加回输入（残差）', '⊕ add back the input (residual)')}</div>
<div class="ly-br c">${z('归一化', 'Normalise')}</div><div class="ly-br k">${z('FFN：每个词各自消化', 'FFN: each word thinks alone')}</div><div class="ly-ba">${z('⊕ 加回（残差）', '⊕ add back (residual)')}</div></div>
<div class="ly-bx">${z('输出头 → 下一个词元的概率', 'Output head → probability of the next token')}</div></div>`;
}

/** break a programmer's note into indented pseudo-code lines instead of one paragraph */
const codeLines = (s: string) => {
  let out = '';
  let depth = 0;
  let brace = 0;
  const nl = () => { out += '\n' + '  '.repeat(brace); };
  for (const c of s) {
    if (c === '(' || c === '（' || c === '[' || c === '⟦') depth++;
    else if (c === ')' || c === '）' || c === ']' || c === '⟧') depth = Math.max(0, depth - 1);
    if (c === '{') { brace++; out += ' {'; nl(); continue; }
    if (c === '}') { brace = Math.max(0, brace - 1); nl(); out += '}'; nl(); continue; }
    if ((c === ';' || c === '；') && depth === 0) { out += c; nl(); continue; }
    if (c === ' ' && (out.endsWith('\n') || out.endsWith('  '))) continue;
    out += c;
  }
  return out.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim()).join('\n');
};
const norm = (s: string) => s.replace(/<[^>]+>/g, '').replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1').replace(/[`*]/g, '').replace(/\{#[^}]+\}/gi, '').replace(/\s+/g, '').replace(/[，。、：；！？,.!?:;“”"'（）()【】\-—–]/g, '');
const MOTIF = [/大雾/, /雾里/, /蒙着/, /下山/, /大碗/, /碗底/, /碗形/, /收音机/, /旋钮/, /纸条/, /罚分/, /天气预报/, /fog/i, /blindfold/i, /bowl/i];
const skipLine = (s: string) => /NumPy|数字层|看动画/.test(s) || s.includes('拖一') || s.includes('从图到') || (s.includes('同一件') && s.includes('写成图')) || s.includes('先自己');
const fxPlain = (s: string) => s.replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1').replace(/[`*]/g, '').replace(/\{#[^}]+\}/gi, '').replace(/\s+/g, ' ').trim();
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** what each displayed formula is doing, in that station's own story */
const LEAD: Record<string, readonly (readonly [string, string])[]> = {
  '0': [['要找的不是背下来的样本，而是一条带着旋钮的函数，没见过的输入也能算出预测。', 'What we want is not a memorised sample, but a function with knobs, so an unseen input still gets a prediction.']],
  P: [['语言模型每一步都在给下一个字分配可能性，而且这些可能性必须分完。', 'At every step a language model hands out chances for the next word, and those chances have to use up the whole share.'], ['后面要比一串数的中心落在哪、散得有多开，用的就是均值和方差。', 'Later we need where a list of numbers sits, and how spread out it is: that is the mean and the variance.']],
  '1': [['把可以是负数的分数收成加起来等于 1 的概率，靠的是 softmax。', 'Softmax is what turns scores that may be negative into probabilities that add up to 1.'], ['训练时只盯着正确答案那一格有多意外，损失就是它的负对数。', 'While training we watch only how surprising the correct answer was. The loss is the negative log of that probability.'], ['要预测的如果是一个数而不是一个类别，就改用预测和真实值之差的平方平均。', 'When the target is a number rather than a class, use the average of the squared gaps instead.']],
  '2': [['看不见谷底的时候，每一步只顺着脚下的坡挪一小段。', 'When the valley is out of sight, each step only moves a little way down the slope underfoot.'], ['旋钮不止一个时，每个方向的坡排成一个向量，那就是梯度。', 'With more than one knob, the slope in every direction lines up into a vector: the gradient.'], ['于是两个旋钮在同一步里一起改，而不是先改完一个再改另一个。', 'So both knobs move in the same step, rather than one finishing before the other starts.']],
  '3': [['只做旋转和缩放，弯的边界分不开；先线性变换，再弯一下。', 'Rotation and scaling alone cannot separate a bent boundary. Transform linearly, then bend.'], ['弯完之后，再用一层把新的表示收成最后的输出。', 'After the bend, one more layer turns that new representation into the output.']],
  '4': [['损失对更前面一层的影响，是上游传来的坡，乘上这一层自己的坡。', 'How the loss reaches an earlier layer is the slope arriving from upstream, times this layer’s own slope.'], ['残差把输入原样加回去，这样梯度里总有一条不会越乘越小的直路。', 'A residual adds the input back unchanged, so the gradient always has a path that does not shrink at every layer.']],
  '5': [['真的训练不会一次看完全部样本，而是一小批一小批地走，并用动量和自适应的步长。', 'Real training does not look at every sample at once. It walks in small batches, with momentum and a step size that adapts.']],
  '6': [['两个词有多像，就是它们在空间里的方向有多齐，用点积来量。', 'How alike two words are is how aligned their directions are, and the dot product measures that.'], ['用一个词去猜它周围会出现什么，最后仍把分数交给 softmax 变成概率。', 'Guessing which words show up around a given word still hands the scores to softmax to become probabilities.']],
  '7': [['该听谁、听多少，不是事先记死的权重，而是看着当前这句话现算出来的。', 'Whom to listen to, and how much, is not a weight stored in advance. It is computed from the sentence in front of us.']],
  '8a': [['“它”要确定指谁，就是拿自己的需求去对每个词的名牌，再按对上的程度把内容混进来。', 'To decide who “it” is, take its own request, match it against every word’s name tag, and mix their contents by how well they matched.']],
  '8b': [['一次看不过来，就把宽度切开，每一份各自看一遍，再拼回去。', 'When the width is too much to look at once, split it, let each piece look on its own, and join them back.'], ['交流得到的结果要加回原来的输入，原稿才不会在层与层之间丢掉。', 'What the words told each other is added back onto the original input, so the draft is not lost between layers.'], ['每个词再独自过一个小网络消化一遍，消化的结果同样加回输入。', 'Each word then passes alone through a small network, and that result is added back onto the input too.']],
  '9': [['预训练的损失，就是平均每一次猜下一个词时，那个词有多出乎意料。', 'The pre-training loss is how surprising the next word was, averaged over every guess.'], ['不想改已经训好的参数，只想把分布拧尖或拧平，就在 softmax 之前把分数除以温度。', 'To sharpen or flatten the distribution without touching the trained parameters, divide the scores by a temperature before softmax.']],
  E: [['把平均损失变回“相当于在几个候选里犹豫”，得到的数叫做困惑度。', 'Turn the average loss back into “torn among about this many candidates”, and that number is the perplexity.'], ['题到底做对了多少，是另一把尺子，用做对的次数除以总题数。', 'How many questions were actually right is a different ruler: correct answers divided by the number of questions.']],
  '10': [['两份回答谁更好，不去拟合一个绝对分数，而是拟合“A 胜过 B”的概率。', 'Which of two answers is better is not fit as an absolute score. It is fit as the probability that A beats B.']],
  '11': [['大矩阵冻住不动，只训练旁边那条又细又长的支路，把它加回原来的权重。', 'The big matrix stays frozen. Only the long thin side path is trained, and it is added back onto the original weights.'], ['每个数少写几位的时候，存下来的是一个整数，用的时候再乘上缩放。', 'When each number is stored with fewer bits, what is kept is an integer, scaled back up when it is used.']],
  '12': [['已经问过的词，名牌和内容可以留在缓存里，新词只算自己的一份。', 'Words already asked can keep their name tags and contents in a cache. A new word computes only its own share.']],
  '13': [['先找出和问题方向最像的几块资料。比的是方向而不是长度，所以用余弦。', 'First find the few notes whose direction is closest to the question. Direction, not length, is what cosine compares.']],
  '14': [['每一步都有一次失手的可能，步数一多，全程都做对的机会会掉得很快。', 'Every step has a chance of slipping. After enough steps, the chance that all of them succeed falls quickly.']],
  S: [['会改数据、会花钱的动作，不能让模型自己做完，得停下来等人点头。', 'An action that changes data or spends money cannot finish on its own. It stops until a person agrees.'], ['从外面读进来的文字是数据，不能把它当成一条新的系统指令去执行。', 'Text read in from outside is data. It must not be carried out as a new system instruction.']],
  '15a': [['扩散学的不是一步就画出整张图，而是认出这一步里被加进去的噪声。', 'Diffusion does not learn to draw the whole picture in one step. It learns to recognise the noise added at this step.'], ['一张图先切成小块，每块当成一个词，再和文字走同一套注意力。', 'An image is first cut into small patches. Each patch is a word, and then it shares the same attention as the text.']],
  '15b': [['同一道题多想几次，把出现最多的那个答案留下，往往比只想一次更稳。', 'Thinking through the same question several times and keeping the answer that shows up most is often steadier than one pass.'], ['窗口变长只说明这些词放得下，并不说明中间的那些词也被用到了。', 'A longer window only means the words fit. It does not mean the words in the middle were used.']],
  A: [['一个能用的应用不是另一个新模型，而是把预训练、检索、工具和多模态编排到一起。', 'A usable application is not another new model. It is pre-training, retrieval, tools and more than one modality, arranged together.']],
  '16': [['整条链走完以后，进度不看翻过多少页，而看一次只验证一个想法、并且连着做对。', 'After the whole chain, progress is not how many pages were turned. It is verifying one idea at a time, and getting it right twice.']],
};

/** one line that names every shorthand symbol with the picture already on the page */
const MAP: Record<string, readonly [string, string]> = {
  '0': ['简写里，x 是你给进去的那个数，θ 是那一排旋钮，y预测 是旋钮算出来的结果。旋钮两个也好，几十亿个也好，都叫 θ。', 'In the short line, x is the number you hand in, theta is the row of knobs, and the prediction is what the knobs produce. Two knobs or billions of them, they are still theta.'],
  P: ['简写里，P 是分到的那一份可能性，前文是已经听见的话，μ 是一排数的中心，方差是它们散得有多开。', 'In the short line, P is one share of the chance, the words already heard are the given part, mu is the centre of a row of numbers, and variance is how spread out they are.'],
  '1': ['简写里，p 是正确答案分到的那一份，罚分是它有多意外。要猜的是一个数时，就把每个差先平方再平均。', 'In the short line, p is the share given to the right answer, and the penalty is how surprising that share was. When the target is a number, square each gap and average them.'],
  '2': ['简写里，w 是脚下这一站，η 是这一步肯迈多远，∂L/∂w 是脚下的坡，∇L 是每个方向的坡排成的一排。新的一站等于旧的减去步子乘坡。', 'In the short line, w is the spot underfoot, eta is how far this step will go, the partial is the slope underfoot, and the gradient is those slopes lined up. The next spot is the old one minus the step times the slope.'],
  '3': ['简写里，W 和 b 都是旋钮。先乘再弯，弯完的结果才送去最后一排旋钮，收成一个数。', 'In the short line, W and b are knobs. Multiply, then bend, and only the bent result goes to the last row of knobs and comes out as one number.'],
  '4': ['简写里，坡是一层层乘回去的。残差把原稿原样加回去，所以总有一条坡不会越乘越小的直路。', 'In the short line, the slope is multiplied back layer by layer. A residual adds the original back unchanged, so one path of the slope never shrinks.'],
  '5': ['简写里，β 是上一小步还留着多少，g 是这一小袋估出来的坡，η 是这一步肯迈多远。每颗旋钮按自己最近的晃动来迈。', 'In the short line, beta is how much of the last little step is kept, g is the slope estimated from this small bag, and eta is how far this step will go. Each knob steps by its own recent wobble.'],
  '6': ['简写里，两排数对应位相乘再相加，就是它们的方向齐不齐。猜周围会出现什么，最后仍把分数收成加起来等于 1 的份额。', 'In the short line, multiplying matching places in two rows and adding says how aligned the directions are. Guessing the words around one word still turns the scores into shares that add to 1.'],
  '7': ['简写里，a 是每个词分到的份额，h 是那个词带着的内容。份额乘上内容再加起来，就是这一步听进来的东西。', 'In the short line, a is the share each word receives, and h is the content that word carries. Multiply share by content and add, and that is what this step took in.'],
  '8a': ['简写里，Q 是“它”自己的需求，K 是别的词的名牌，V 是那些词的内容。对上的程度决定从内容里取多少。', 'In the short line, Q is the request “it” carries, K is the other words’ name tags, and V is their content. How well they match decides how much content to take.'],
  '8b': ['简写里，每一头先各自看一遍，再拼回去。交流的结果和各自消化的结果，都加回原来的那一串数。', 'In the short line, each head looks on its own, then they join back. What they told each other, and what each one digested, is added back onto the original row of numbers.'],
  '9': ['简写里，损失是每一次猜下一个字有多意外，再平均。温度不拧已经学好的旋钮，只把份额拧尖或者拧平。', 'In the short line, the loss is how surprising each next-character guess was, then averaged. Temperature does not turn the learned knobs. It only sharpens or flattens the shares.'],
  E: ['简写里，把平均的意外变回“大约还在几个候选里犹豫”，那个数是困惑度。做对的次数除以总题数，是另一把尺子。', 'In the short line, turning the average surprise back into “still torn among about this many candidates” gives the perplexity. Correct answers divided by the number of questions is a different ruler.'],
  '10': ['简写里，σ 把两份奖励的差收成 0 到 1 的可能性。训练往人挑中的那一份靠，而不是去给这份回答打一个绝对分数。', 'In the short line, sigma folds the gap between two rewards into a chance from 0 to 1. Training leans toward the one a person picked, rather than giving the answer one absolute score.'],
  '11': ['简写里，大的那一块冻住，旁边细路 BA 上的旋钮才在拧，拧完加回去。每个数少记几位时，存的是一个整数，用的时候再乘上缩放。', 'In the short line, the big block stays frozen. Only the knobs on the thin side path BA turn, and they are added back. When each number keeps fewer bits, what is stored is an integer, scaled back up when it is used.'],
  '12': ['简写里，已经问过的词，名牌和内容留在本子上。本子有多厚，要看有多少层、多少头，以及每个数占几位。', 'In the short line, words already asked keep their name tags and contents in the notebook. How thick the notebook gets depends on how many floors, how many heads, and how many bits each number takes.'],
  '13': ['简写里，余弦比的是两排数的方向，不是它们有多长。问题是一排，资料块是一排，方向最齐的几块才放进提示。', 'In the short line, cosine compares the direction of two rows of numbers, not how long they are. The question is one row, each note is one row, and the closest directions go into the prompt.'],
  '14': ['简写里，每一步都有一次失手的可能。全程都做对，是把每一步的成功率连乘，步数一多就会掉得很快。', 'In the short line, every step can slip. Succeeding all the way means multiplying each step’s success, and after enough steps that chance falls quickly.'],
  S: ['简写里，会改数据、会花钱的动作要停下来等人点头。从外面读来的文字是资料，不是一条新的吩咐。', 'In the short line, an action that changes data or spends money stops until a person agrees. Text read in from outside is material, not a new order.'],
  '15a': ['简写里，ε 是这一步被加进去的噪声，θ 仍是那些旋钮。图先切成小块，每块当成一个词，再和文字走同一条路。', 'In the short line, epsilon is the noise added at this step, and theta is still the knobs. A picture is cut into small patches, each patch is treated as a word, and then it walks the same path as the text.'],
  '15b': ['简写里，同一道题多想几次，留下出现最多的那一个。窗口变长只说明这些词放得下，不说明中间那些词也被用到了。', 'In the short line, think the same question through several times and keep the answer that shows up most. A longer window only means the words fit. It does not mean the words in the middle were used.'],
  A: ['简写里，一个能用的应用不是再加一排新旋钮，而是把已经会的续写、检索、工具和这些窗口排好顺序。', 'In the short line, a usable application is not another row of new knobs. It is the continuation, the retrieval and the tools you already have, put in order with these windows.'],
  '16': ['简写里，进度不看翻过多少页。一次只核对一个想法，并且连着做对，才算这一站站住了。', 'In the short line, progress is not how many pages were turned. One idea is checked at a time, and it counts only when it comes out right twice in a row.'],
};

/** what the symbols mean in this station's story. No shared closer. */
const SYM: Record<string, readonly [string, string]> = {
  '0': ['收音机上，x 是你拧到的那一格，θ 是还在转的旋钮，y预测 是喇叭里此刻收出来的声音。样本教的是旋钮停在哪，没听过的台也用同一对去收。', 'On the radio, x is the mark you turned to, theta is the knobs still moving, and the prediction is the sound coming out of the speaker. The examples teach where the knobs stop; an unheard station uses the same pair.'],
  P: ['骰子上，每个朝向分到一份可能性，这些份数必须刚好分完。已知“今天晴”再问要不要带伞，就是在已经知道的前提下把剩下的可能性重新分一遍。', 'On the die, each face gets a share of the chance, and the shares have to use up the whole amount. Asking about an umbrella once you know it is sunny means sharing what is left again, given what you already know.'],
  '1': ['猜错的罚分看着正确答案有多意外：它越不像会发生，罚得越重。要预测的如果是一个数，就改看猜的和卷面上的差了多少，再把差平方平均。', 'The penalty for a wrong guess watches how surprising the right answer was: the less it looked likely, the heavier the fine. When the target is a number, look at how far the guess sits from the marked value, then average the squared gaps.'],
  '2': ['雾里看不见谷底。w 是你脚下这一站，η 是这一步肯迈多远，坡度告诉你该往上还是往下。新的一站等于旧的减去步长乘坡度，脚下的坡还在就按这个再走。', 'The valley is hidden in fog. w is the spot under your feet, eta is how far this step is willing to go, and the slope says whether to walk up or down. The next spot is the old one minus the step times the slope, and if the slope is still there you walk it again.'],
  '3': ['四个点对角站队，一条直线怎么切都有一个站错。先做旋转和缩放，再在中间弯一下，弯完的结果才送去最后一层，错队的点这才分开。', 'The four dots stand on the diagonals, and every straight cut leaves one on the wrong side. Rotate and scale first, then put a bend in the middle, and only the bent result goes on to the last layer, which is what finally splits the mismatched dots.'],
  '4': ['齿轮一环扣一环。损失对更前面那片的影响，是上游传来的坡乘上这一片自己的坡。残差把原稿原样加回去，这样总有一条不会越乘越小的直路。', 'The gears catch one another. How the loss reaches an earlier gear is the slope arriving from upstream times that gear’s own slope. A residual adds the original back unchanged, so there is always a path that does not shrink at every step.'],
  '5': ['仓库太大，不能一次扛起来。每一小袋样本估一次坡，动量把以前的坡攒着一起走，步长再按最近的晃动自己变，上百万条也走得动、走得稳。', 'The warehouse is too big to lift at once. Each small bag of examples estimates the slope once, momentum keeps the earlier slopes walking with you, and the step size changes itself from the recent wobble, so a million examples still move and stay steady.'],
  '6': ['两个词有多像，看它们在空间里的方向齐不齐，用对应位相乘再相加来量。用一个词去猜周围会出现什么，最后仍把分数收成加起来等于 1 的可能性。', 'How alike two words are is whether their directions line up, measured by multiplying matching positions and adding. Guessing which words show up around a given word still turns the scores into chances that add up to 1.'],
  '7': ['纸条太小，传远了开头就淡。该听谁、听多少，不是事先写死的，而是拿这句话里每个词的名牌现对一遍，再按对上的程度去听，听完才开口。', 'The note is too small, and the opening fades on a long trip. Whom to listen to, and how much, is not written down in advance. It is matched against every word’s name tag in this sentence, then heard by how well it matched, and only then does anyone speak.'],
  '8a': ['“它”要确定指谁，就拿自己的需求去对每个词的名牌，对上的程度决定从那一词的内容里取多少，再混成一个新的说法，这才是这一步的输出。', 'To decide who “it” points at, take its own request and match it against every word’s name tag. How well they match decides how much of that word’s content to take, and the pieces mix into a new wording, which is this step’s output.'],
  '8b': ['一层楼先开会。宽度一次看不过来，就切开，每一份各自看一种关系，再拼回去。会上说的和各自消化的，都加回原稿，原稿才不会在楼层之间丢掉。', 'One floor meets first. The width is too much to look at once, so it is cut, each piece watches one kind of relation, and they join back. What the meeting said, and what each person digested, is added back onto the draft so it is not lost between floors.'],
  '9': ['完形填空做到每一步都在猜下一个字，标签就是文本自己。损失是这些猜测平均有多出乎意料。不想改已经训好的参数，只想把分布拧尖或拧平，就在收成概率之前把分数除以温度。', 'The cloze goes so far that every step guesses the next word, and the text itself is the label. The loss is how surprising those guesses were, on average. To sharpen or flatten the shares without touching the trained knobs, divide the scores by a temperature before they become probabilities.'],
  E: ['同一套期末卷才比得了分。把平均的意外变回“相当于在几个候选里犹豫”，那个数是困惑度。题到底做对了多少，是另一把尺子：做对的次数除以总题数。', 'Scores can be compared only on the same final exam. Turn the average surprise back into “torn among about this many candidates”, and that number is the perplexity. How many questions were actually right is a different ruler: correct answers divided by the number of questions.'],
  '10': ['两份回答谁更好，不去拟合一个绝对分数，而是拟合“这份胜过那份”的可能性。奖励的差经过一个把实数收成 0 到 1 的函数，训练就往人偏好的那边靠。', 'Which of two answers is better is not fit as an absolute score. It is fit as the chance that this one beats that one. The gap in reward passes through a function that folds a real number into the range from 0 to 1, and training leans toward the side a person preferred.'],
  '11': ['大矩阵冻住。旁边那条又细又长的支路才在学，学完加回原来的权重。每个数少写几位的时候，存下来的是一个整数，用的时候再乘上缩放。', 'The big matrix stays frozen. Only the long thin side path is learning, and once it has learned it is added back onto the original weights. When each number is stored with fewer digits, what is kept is an integer, scaled back up when it is used.'],
  '12': ['已经问过的人，名牌和本事都留在本子上。新来的只算自己的一份，不必把前面的人重新打听一遍。本子变厚，是因为每一层、每一个头的名牌和内容都要占地方。', 'People already asked keep their name tags and their skills in the notebook. A newcomer computes only their own share, and does not ask about the earlier people again. The notebook thickens because every floor and every head’s tag and content take room.'],
  '13': ['书架上比的是方向，不是书有多厚。问题是你要找的那一页朝哪，资料是抽出来的那一页朝哪，余弦把点积再除掉两边的长度，免得更厚的那本只因更厚而得分高。', 'On the shelf we compare direction, not how thick a book is. The question is which way the page you want faces, the note is which way the page you pulled faces, and cosine takes the dot product and then divides out both lengths, so a thicker book does not win just by being thick.'],
  '14': ['工具箱里每一步都可能失手。步数一多，全程都做对的机会是把每一步的成功率连乘，掉得很快。所以长链条要有人看着，不能指望一步都不错。', 'Every tool in the box can slip. After enough steps, the chance that all of them succeed is the success of each step multiplied together, and it falls quickly. A long chain needs someone watching; it cannot be trusted to miss nothing.'],
  S: ['门关着。会付钱、会删除的动作停下来等人点头，只读的查询可以自己做。从门外塞进来的纸条是数据，不能把它当成老板的新吩咐去执行。', 'The gate stays shut. An action that pays or deletes stops until a person nods, while a read-only lookup can run alone. A note slipped in from outside is data. It must not be carried out as a new order from the boss.'],
  '15a': ['眼睛先被切成小方块，每块当成一个词，再和文字走同一条路。扩散学的不是一步画出整张图，而是认出这一步里被加进去的噪声，再一点点洗掉。', 'The eye is first cut into small squares. Each square is treated as a word, then it walks the same path as the text. Diffusion does not learn to draw the whole picture in one step. It learns to recognise the noise added at this step, and washes a little of it off.'],
  '15b': ['同一道题多想几次，想法一节比一节长，最后留下出现最多的那一节。窗口变长只说明这些词放得下，并不说明中间那些词也被用到了。', 'Think the same question through several times. Each thought is longer than the last, and what is kept is the one that shows up most. A longer window only means the words fit. It does not mean the words in the middle were used.'],
  A: ['桌上三个窗口同时开着：代码、文稿、屏幕。一个能用的应用不是再训一个新模型，而是把已经会的预训练、检索、工具和这些窗口编排到一起。', 'Three windows sit open on the desk: code, a page, a screen. A usable application is not another newly trained model. It is the pre-training, the retrieval and the tools you already have, arranged together with these windows.'],
  '16': ['整条链走完，进度不看翻过多少页。一次只核对一个想法，并且连着做对，才算这一站真的站住了。翻页本身不算学会，一次对两次才往下走。', 'After the whole chain, progress is not how many pages were turned. One idea is checked at a time, and it counts only when it comes out right twice in a row. Turning the page is not the same as having learned it; right twice is what lets you move on.'],
};

/** one chapter: picture, experiment and its step, the formula once, why the other ways fail, then code */
export function html(S: Stage & { ly: Ly }, page: string, l: L, mk: Mk, exK: string): string {
  void exK;
  const Y = S.ly;
  const key = page.replace(/^D\//, '');
  const mot = MOT.has(key) ? `<div class="ly-mot" data-mot="${key}"></div>` : '';
  const seen: string[] = [];
  const motifs = new Set<string>();
  const note = (s: string) => {
    const n = norm(s);
    if (n.length >= 8) seen.push(n);
    for (const r of MOTIF) if (r.test(s)) motifs.add(r.source);
  };
  const fresh = (s: string, motif: boolean) => {
    const n = norm(s);
    if (n.length >= 12) {
      for (const p of seen) {
        if (p === n) return false;
        const short = p.length < n.length ? p : n;
        const long = p.length < n.length ? n : p;
        if (short.length >= 18 && long.includes(short)) return false;
      }
    }
    if (motif) for (const r of MOTIF) if (r.test(s) && motifs.has(r.source)) return false;
    return true;
  };
  const keep = (s: string, motif: boolean) => {
    if (!s.trim() || skipLine(s)) return false;
    if (!fresh(s, motif)) return false;
    note(s);
    return true;
  };
  note(Y.hook);
  const an = Y.an.filter((x) => keep(x, true));
  const labeled = Y.pic === 'sm' || Y.pic === 'blk';
  const caps = labeled ? [] : Y.pc.filter((x) => keep(x, true));
  let stepSrc = '';
  const earlyTerm = /[θΘηΗ∇∂σΣλμαβ]|参数|拟合|梯度|向量|张量|权重|parameter|gradient|vector|tensor|\bweights?\b/i;
  if (key !== '2') for (const c of [...Y.num, ...S.x]) if (keep(c, false) && !earlyTerm.test(fxPlain(c))) { stepSrc = c; break; }
  for (const f of Y.fx) note(fxPlain(f));
  const whyParas = (WHY[key] ?? WHY['0']!).map((row) => tx(row, l));
  const codeLead = l === 'en'
    ? 'Written so a program can run the same step, it is the lines below.'
    : '交给程序去跑的时候，算的仍是上面这件事，只是换成它能执行的写法。';
  const code = codeLines(Y.jv).split('\n').map((line) => { const pad = line.match(/^ */)?.[0] ?? ''; return pad + mk(line); }).join('\n');
  const H = (zh: string, en: string) => `<h2 class="st-sec">${l === 'en' ? en : zh}</h2>`;
  const flow = (xs: string[]) => {
    const bits = xs.map((s) => s.trim()).filter(Boolean);
    const groups: string[][] = [];
    let cur: string[] = [];
    let len = 0;
    const flush = () => { if (cur.length) groups.push(cur); cur = []; len = 0; };
    for (const s of bits) {
      cur.push(s); len += [...s].length;
      if (cur.length >= 2 && len >= 80) flush();
    }
    if (cur.length) {
      if (groups.length && len < 60) groups[groups.length - 1]!.push(...cur);
      else groups.push(cur);
    }
    while (groups.length > 3) { const extra = groups.pop()!; groups[groups.length - 1]!.push(...extra); }
    return groups.map((g) => `<p>${g.map(mk).join('')}</p>`).join('');
  };
  const hasDemo = !!DEMO[`D/${key}`];
  const diagram = Y.pic === 'sm' ? picSm(l, mk) : Y.pic === 'blk' ? picBlk(l) : Y.pic === 'att' ? `<div class="ly-att" data-att="1"></div>` : '';
  const scene = Y.pic === 'sm' ? '' : life(key, l);
  const motWhere = key === '8b' ? 'diagram' : key === '9' || key === '12' ? 'exp' : 'scene';
  const putMot = (where: string) => mot && motWhere === where ? mot : '';
  const capHtml = LIFE_CAP[key] ? `<p class="ly-cap">${esc(tx(LIFE_CAP[key], l))}</p>` : P(caps, mk, 'ly-cap');
  const sceneFig = (scene || Y.pic === 'sm') ? `<div class="st-fig${LIFE_CAP[key] ? ' ly-tight' : ''}" data-fig="scene">${scene}${Y.pic === 'sm' ? diagram : ''}${capHtml}${putMot('scene')}</div>` : '';
  const diagramFig = diagram && Y.pic !== 'sm' ? `<div class="st-fig" data-fig="pic-${Y.pic}">${diagram}${putMot('diagram')}</div>` : '';
  const exp = `<div class="${hasDemo ? 'st-fig' : 'st-step'}" ${hasDemo ? 'data-fig="exp"' : ''}><div class="vf-slot" id="fig" data-vf-part="demo"></div>${workedHtml(key, l, stepSrc ? mk(stepSrc) : '')}${putMot('exp')}</div>`;
  const figure = sceneFig + diagramFig + exp;
  const mathish = (s: string) => /[=←≈→≠∑Σ∂√×÷]|softmax|log |σ\(/.test(s);
  const plainFx = Y.fx.map((f) => fxPlain(f)).filter(Boolean);
  const shownFx = plainFx.filter(mathish);
  const displayFx = shownFx.length ? shownFx : plainFx.slice(0, 1);
  const symFollow = tx(SYM[key] ?? SYM['0']!, l);
  const leadOf = (i: number) => {
    const rows = LEAD[key];
    const row = rows?.[Math.min(i, rows.length - 1)];
    return row ? tx(row, l) : symFollow;
  };
  const gloss = l === 'en'
    ? ' The symbols are not a new story. They are the picture above, written short.'
    : '符号不是新的一件事，只是把上面那幅画面写短。';
  const formulas = displayFx.map((f, i) => `<p>${esc(leadOf(i))}</p><p class="formula fx-line">${esc(fxPlain(f))}</p>`).join('')
    + `<p class="ly-map">${esc(tx(MAP[key] ?? MAP['0']!, l) + gloss)}</p>`;
  const KNOB: Record<string, string> = { '0': 'line', '2': 'line' };
  const NET: Record<string, string> = { '3': 'curve', '4': 'colors' };
  const GPT = new Set(['8a', '8b', '9']);
  const DRILL = new Set(['9', 'E', '10', '11', '12', '13', '14', 'S', '15a', '15b', 'A']);
  const lab = `${KNOB[key] ? `<div data-lab="knob" data-mode="${KNOB[key]}"></div>` : ''}${key === '2' ? `<div data-lab="bowl"></div>` : ''}${NET[key] ? `<div data-lab="net" data-mode="${NET[key]}"></div>` : ''}${key === '6' ? `<div data-lab="cloud"></div>` : ''}${GPT.has(key) ? `<div data-lab="gpt"></div>` : ''}${DRILL.has(key) ? `<div data-lab="drill"></div>` : ''}`;
  const lookText = tx(LOOK[key] ?? LOOK['0']!, l);
  const choiceText = tx(CLOSE[key] ?? CLOSE['0']!, l);
  const whyOpen = whyParas.map((s) => `<p class="ly-why">${mk(s)}</p>`).join('');
  const L5 = [
    `<div data-ask="by"></div>${H('这一步在做什么', 'What this step is doing')}<p class="ly-hook">${mk(Y.hook)}</p>${flow(an)}`,
    `${H('看一看', 'Look')}${figure}<p>${mk(lookText)}</p>${lab}<div data-ask="num"></div>`,
    `${H('记个简写', 'A short note')}<div class="ly-fx" id="formula">${formulas}</div><div class="st-q" data-vf-part="check" data-vf-i="0"></div>`,
    `${H('另外的办法为什么不行', 'Why the other ways fail')}${whyOpen}<div data-ask="pred"></div>`,
    `${H('换种办法会怎样', 'What if you chose another way')}<p>${mk(choiceText)}</p><div data-ask="choice"></div>${H('写成程序', 'As a program')}<p>${esc(codeLead)}</p><pre class="st-code" id="code"><code>${code}</code></pre><p class="ly-bridge">${esc(tx(BRIDGE[key] ?? BRIDGE['0']!, l))}</p>`,
  ];
  const secs = L5.map((b, k) => `<section class="ly-l" data-ly="${k + 1}"><h3 class="ly-h" tabindex="-1"></h3>${b}</section>`).join('');
  const clip = clipHtml(key, l === 'en' ? 'en' : 'zh', import.meta.env.BASE_URL || '/');
  return `<div class="ly" data-ly-page="${page}" lang="${l === 'en' ? 'en' : 'zh-CN'}">${clip}${secs}<div class="ly-nx"></div></div>`;
}

/** wire the layered body inside `host`: depth, 懂了 → next layer, the bar, the two 验证 parts, the pictures */
export function wire(host: HTMLElement, page: string, l: L) {
  const root = host.querySelector<HTMLElement>('.ly'); if (!root) return;
  const z = (a: string, b: string) => tx([a, b], l);
  let d = depthGet(), open = openGet(page);
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
  const draw = () => {
    const v = shown(open, d), max = DEPTH_MAX[d];
    root.dataset.depth = d; root.dataset.shown = '5';
    root.querySelectorAll<HTMLElement>('.ly-l').forEach((s) => { s.hidden = false; });
    root.querySelectorAll<HTMLElement>('[data-ly-d]').forEach((b) => { const on = b.dataset.lyD === d; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    root.querySelectorAll<HTMLElement>('[data-ly-go]').forEach((b) => {
      const k = Number(b.dataset.lyGo); b.className = k < v ? 'done' : k === v ? 'on' : k <= max ? 'off' : 'out';
      b.setAttribute('aria-label', `${tx(NAME[k - 1]!, l)}${k <= v ? z('，已展开', ', open') : k <= max ? '' : z('，在更深一档', ', in a deeper setting')}`);
      if (k === v) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    const nx = root.querySelector<HTMLElement>('.ly-nx');
    if (nx) nx.innerHTML = '';
  };
  const focus = (k: number) => { const h = root.querySelector<HTMLElement>(`.ly-l[data-ly="${k}"] .ly-h`); if (!h) return; h.focus({ preventScroll: true }); h.scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' }); };
  const openTo = (k: number) => { if (k > open) { open = k; openSet(page, k); } if (k > DEPTH_MAX[d]) { d = depthFor(k); depthSet(d); } draw(); focus(k); };
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ly-d],[data-ly-go],[data-ly-a]'); if (!b) return;
    if (b.dataset.lyD && okD(b.dataset.lyD)) { d = b.dataset.lyD; depthSet(d); if (DEPTH_MAX[d] > open) { open = DEPTH_MAX[d]; openSet(page, open); } draw(); return; }
    if (b.dataset.lyGo) { openTo(Number(b.dataset.lyGo)); return; }
    if (b.dataset.lyA === 'next') openTo(shown(open, d) + 1);
    else if (b.dataset.lyA === 'up') openTo(DEPTH_MAX[d] + 1);
  });
  draw();
  const demo = root.querySelector<HTMLElement>('[data-vf-part="demo"]');
  void import('../vf/ui').then(async (m) => {
    if (demo?.isConnected) m.mount(demo, page, l, undefined, 'demo');
    const ids = (await import('../vf/ids')).VF_Q[page] ?? [];
    let mythUsed = false;
    root.querySelectorAll<HTMLElement>('[data-vf-i]').forEach((slot) => {
      const id = ids[Number(slot.dataset.vfI)];
      if (!id || !slot.isConnected) { slot.remove(); return; }
      const myths = !mythUsed;
      mythUsed = true;
      m.mount(slot, page, l, undefined, 'check', { ids: [id], myths });
    });
  });
  const at = root.querySelector<HTMLElement>('[data-att]');
  if (at) void import('./att').then((m) => { if (at.isConnected) m.att(at, l); });
  const motEl = root.querySelector<HTMLElement>('[data-mot]');
  if (motEl) void import('./motion').then((m) => { if (motEl.isConnected) m.mount(motEl, motEl.dataset.mot ?? '', l); });
  const knob = root.querySelector<HTMLElement>('[data-lab="knob"]');
  if (knob) void import('./knob').then((m) => { if (knob.isConnected) m.mount(knob, knob.dataset.mode || 'line', l); });
  const bowl = root.querySelector<HTMLElement>('[data-lab="bowl"]');
  if (bowl) void import('./bowl').then((m) => { if (bowl.isConnected) m.mount(bowl, l); });
  const net = root.querySelector<HTMLElement>('[data-lab="net"]');
  if (net) void import('./net').then((m) => { if (net.isConnected) m.mount(net, net.dataset.mode || 'curve', l); });
  const cloud = root.querySelector<HTMLElement>('[data-lab="cloud"]');
  if (cloud) void import('./cloud').then((m) => { if (cloud.isConnected) m.mount(cloud, l); });
  const gpt = root.querySelector<HTMLElement>('[data-lab="gpt"]');
  if (gpt) void import('./gpt-ui').then((m) => { if (gpt.isConnected) m.mount(gpt, l); });
  const drill = root.querySelector<HTMLElement>('[data-lab="drill"]');
  if (drill) void import('./drill').then((m) => { if (drill.isConnected) m.mount(drill, page.slice(2), l); });
}
