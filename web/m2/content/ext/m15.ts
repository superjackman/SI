/* M15 (R31d): the principles-line 3D stage cards, each the first thing on its stop (build.ts S3D_TOP3 moves it there),
   except lab3dNext on T3, which sits lower down (T3 already starts with the word-vector space). Same layout as M13 and
   M14: the stage, one sentence, at most one control, then one closed 「想知道为什么 ▾」 layer. All numbers are toy
   numbers from src/m2/w3d3.ts, and each card says so. */
import type { Page } from '../../lib';
import type { Ext } from './kit';
import { ANG0, ANG_MAX, ANG_MIN, LOOP, NEXT, PATCH, PATCH0, ROLL_MAX, ROLL_STEP, TEMP0, TEMP_MAX, TEMP_MIN, WAYS, diceSay, loopSay, matOf, matSay, n2, nextP, nextSay, patchSay } from '../../../src/m2/w3d3';
import { BLK, blkSay, MOE_TOK, SCORE, bestScore, moeSay, scoreSay, NN_B, NN_H, NN_V, NN_W0, NN_WMAX, NN_WMIN, nnOut, nnSay, pc } from '../../../src/m2/w3d3';

const L = (P: Page) => (P.t('zh', 'en') as 'zh' | 'en');
const box = (id: string, label: string, inner = '') => `<div class="s3d" id="${id}" tabindex="0" role="img" aria-label="${label}"><svg class="s3d-fb" viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>${inner}</div>`;
const say = (id: string, html: string, ctl = '') => `<div class="s3c-sheet"><p class="s3c-say" id="${id}" aria-live="polite">${html}</p>${ctl}</div>`;
const li = (a: string[]) => `<ul class="pts">${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
function fold(P: Page, o: { plain: string; out?: string; tryIt: string[]; how: [string, string[]]; note: string }) {
  const t = P.t;
  return `<details class="s3c-why"><summary><span>${t('想知道为什么', 'Want to know why')}</span><i aria-hidden="true">▾</i></summary><div class="s3c-in">
<p class="s3c-pl">🧒 ${o.plain}</p>${o.out ?? ''}
<p class="s3c-h">${t('👀 试试', '👀 Try this')}</p>${li(o.tryIt)}
<p class="s3c-h">${o.how[0]}</p>${li(o.how[1])}
<p class="s3c-note">ⓘ ${o.note}</p>
</div></details>`;
}
/** one slider row: label, range, value */
const slider = (id: string, label: string, aria: string, min: number, max: number, step: number, v: number, shown: string) =>
  `<div class="s3c-ctl lr"><label for="${id}">${label}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}" aria-label="${aria}"><b id="${id}v">${shown}</b></div>`;
/** one big button */
const go = (id: string, html: string) => `<div class="s3c-ctl one"><button type="button" class="s3c-go" id="${id}">${html}</button></div>`;
const m1 = (x: number) => x.toFixed(1).replace('-', '−');

/* ================= N: one weight of a tiny network ================= */
function net(P: Page) {
  const t = P.t;
  P.s3c('lab3dNet', t('3D 小小神经网络', '3D a tiny neural network'),
    box('nnBox', t('一个小神经网络：左边 3 个输入球，中间 4 个，右边 2 个输出球，球之间连着线；有一根线亮着', 'A tiny neural network: 3 input balls on the left, 4 in the middle, 2 output balls on the right, joined by lines; one line is lit'))
    + say('nnSay', nnSay(NN_W0, L(P)), slider('nnW', t('权重', 'Weight'), t('亮着的那根线的权重', 'The weight of the lit line'), NN_WMIN, NN_WMAX, 0.1, NN_W0, m1(NN_W0)))
    + fold(P, {
      plain: t('神经网络就是一堆小球（神经元）用线连起来。每根线上有一个数，叫<b>权重</b>：它决定前一个球的话，后一个球听进去多少。训练，就是把成千上万根线的权重慢慢调对。', 'A neural network is a lot of little balls (neurons) joined by lines. Each line carries a number called a <b>weight</b>: how much the next ball listens to the one before. Training means slowly tuning the weights of thousands of lines until they are right.'),
      tryIt: [t(`拖到 2：线变得最粗，输出亮到 ${pc(nnOut(2))}%。`, `Drag to 2: the line is thickest and the output glows at ${pc(nnOut(2))}%.`),
        t(`拖到 0：这根线不起作用，输出 ${pc(nnOut(0))}%。`, `Drag to 0: the line does nothing; output ${pc(nnOut(0))}%.`),
        t(`拖到 −2：线变成红色，把输出压到 ${pc(nnOut(-2))}%。`, `Drag to −2: the line turns red and pulls the output down to ${pc(nnOut(-2))}%.`)],
      how: [t('🤔 输出是怎么算出来的', '🤔 How the output is worked out'), [
        t(`中间 4 个球现在的值是 ${NN_H.join('、')}（示意）。`, `The 4 middle balls hold ${NN_H.join(', ')} right now (illustrative).`),
        t(`每个值 × 它那根线的权重，加起来，再加一个偏置 ${NN_B}。另外 3 根线的权重固定为 ${NN_V.slice(1).join('、')}。`, `Each value × the weight of its line, all added up, plus a bias of ${NN_B}. The other 3 weights are fixed at ${NN_V.slice(1).join(', ')}.`),
        t('最后用 sigmoid（一条 S 形的曲线）把结果变成 0% 到 100% 之间的数。', 'Finally a sigmoid (an S-shaped curve) turns the result into a number between 0% and 100%.')]],
      note: t('数字是编的小例子。下面的“一个神经元”实验可以把每一步算给你看。', 'The numbers are a made-up small example. The “one neuron” lab further down works through each step.'),
    }));
}

/* ================= T4: one Transformer block, layer by layer ================= */
function blk(P: Page) {
  const t = P.t;
  P.s3c('lab3dBlk', t('3D 一层层往上走', '3D up through the layers'),
    box('bkBox', t('一叠玻璃板，就是一个 Transformer 块：从下往上，词嵌入、位置编码、注意力、加和理齐、前馈网络、加和理齐、输出', 'A stack of glass plates is one Transformer block: from the bottom, embedding, position, attention, add and tidy, feed-forward, add and tidy, output'))
    + say('bkSay', blkSay(-1, L(P)), go('bkGo', `▶ ${t('下一层', 'Next layer')}`))
    + fold(P, {
      plain: t('一个 Transformer 块像一栋小楼：一句话从一楼进去，每层做一件小事，到顶楼再交给下一栋。大模型就是几十栋这样的楼叠起来。', 'A Transformer block is like a small building: a sentence comes in on the ground floor, each floor does one small job, and the top floor hands it to the next building. A big model stacks dozens of these.'),
      tryIt: [t('一直按“下一层”：看小光球从底层升到顶层。', 'Keep pressing “Next layer”: watch the glowing dot rise from the bottom to the top.'),
        t('停在“注意力”：这是每个词互相看一眼的地方，也是 Transformer 最有名的一层。', 'Stop at “Attention”: where the words look at each other, the best-known layer of a Transformer.')],
      how: [t('🤔 每一层在干嘛', '🤔 What each layer does'), BLK.map(([zh, en, a, b]) => t(`<b>${zh}</b>：${a}。`, `<b>${en}</b>: ${b}.`))],
      note: t('真实模型里，词嵌入和位置编码只在第一块之前做一次；这里为了看全，画在一起。', 'In a real model, embedding and position happen once, before the first block; they are drawn together here to show the whole road.'),
    }));
}

/* ================= T4b: score every word, pick the highest ================= */
function score(P: Page) {
  const t = P.t, b = bestScore();
  P.s3c('lab3dScore', t('3D 给每个词打分', '3D score every word'),
    box('scBox', t('一个玻璃架子上放着 6 张词卡：苹果、香蕉、汽车、小狗、蛋糕、书，每张卡上有一条分数光条；左边一道光代表模型此刻的想法', 'A glass rack holds 6 word cards: apple, banana, car, dog, cake, book, each with a glowing score bar; a beam on the left is what the model is thinking'))
    + say('scSay', scoreSay(false, L(P)), go('scGo', `🏆 ${t('挑最高分', 'Pick the highest')}`))
    + fold(P, {
      plain: t('句子是「我饿了，想吃一个红红的___」。模型走完所有层，手里有一个“想法”。它拿这个想法去和词表里每个词比一比，越像分越高，然后挑分最高的那个说出来。', 'The sentence is “I am hungry and want a red ___”. After all the layers, the model holds one “thought”. It compares that thought with every word it knows, the closer the higher the score, and says the top one.'),
      tryIt: [t(`按“挑最高分”：「${b[0]}」得 ${b[2].toFixed(2)} 分，跳出来。`, `Press “Pick the highest”: “${b[1]}” scores ${b[2].toFixed(2)} and pops out.`),
        t('看光条：「汽车」「书」几乎没光，和“红红的、能吃的”不沾边。', 'Look at the bars: “car” and “book” barely glow; they are not red things you eat.')],
      how: [t('🤔 6 个词的分数', '🤔 The 6 scores'), SCORE.map(([zh, en, s]) => t(`${zh}：${s.toFixed(2)}`, `${en}: ${s.toFixed(2)}`))],
      note: t('真实模型要给几万个词打分，再用 softmax 变成概率；有时也不总挑第一名，会带一点随机。分数是编的。', 'A real model scores tens of thousands of words and turns them into chances with softmax; it does not always take the top one. The scores are made up.'),
    }));
}

/* ================= T5: mixture of experts ================= */
function moe(P: Page) {
  const t = P.t;
  P.s3c('lab3dMoe', t('3D 每个词只找 2 位专家', '3D each word visits 2 experts'),
    box('moBox', t('左边一排词方块，中间一个路由器，右边 8 个彩色专家方块；当前的词只点亮其中 2 个专家', 'A row of word cubes on the left, a router in the middle, 8 coloured expert blocks on the right; the current word lights only 2 of them'))
    + say('moSay', moeSay(-1, L(P)), go('moGo', `${t('下一个词', 'Next word')} ▶`))
    + fold(P, {
      plain: t('MoE（混合专家）就像一家医院有 8 位医生。路由器像导诊台：每个词来了，只派给最合适的 2 位，其余 6 位休息。模型总共很大，但每个词只动用一小部分，所以又聪明又省电。', 'MoE (mixture of experts) is like a hospital with 8 doctors. The router is the front desk: each word is sent to the 2 best doctors and the other 6 rest. The whole model is big, but each word uses only a small part, so it is clever and cheap.'),
      tryIt: [t('连按 4 次：每个词点亮的专家都不一样。', 'Press 4 times: every word lights different experts.'),
        t('数一数：每次都只亮 2 个，从来不会 8 个一起亮。', 'Count: only 2 light up each time, never all 8.')],
      how: [t('🤔 这句话里，谁找了谁', '🤔 Who went to whom in this sentence'), MOE_TOK.map(([zh, en, [a, c]]) => t(`「${zh}」→ 专家 ${a}、${c}`, `“${en}” → experts ${a}, ${c}`))],
      note: t('真实的 MoE 模型可能有几十上百位专家，每个词常选 2～8 位；谁去哪位是路由器自己学出来的。这里的分配是编的。', 'A real MoE model may have dozens or hundreds of experts and each word usually picks 2 to 8; the router learns where to send each word. The choices here are made up.'),
    }));
}

/* ================= T2: the agent loop ================= */
function loop(P: Page) {
  const t = P.t;
  P.s3c('lab3dLoop', t('3D Agent 转一圈', '3D the agent loop'),
    box('lpBox', t('一个发光的圆环上有三站：模型（大脑）、工具箱、结果板；一颗小光球沿着圆环一站站地走，最后带着答案离开', 'A glowing ring with three stops: the model (a brain), a toolbox and a result board; a small glowing dot moves from stop to stop and finally leaves with the answer'))
    + say('lpSay', loopSay(-1, L(P)), go('lpGo', `▶ ${t('下一步', 'Next step')}`))
    + fold(P, {
      plain: t('Agent 就是“会自己动手的模型”。它先想一想缺什么，再用工具去查、去做，拿回结果再想，直到够了才回答你。这一圈可以转很多次。', 'An agent is a model that can do things itself. It thinks about what is missing, uses a tool to look it up or do it, reads the result and thinks again, and answers only when it has enough. It can go round many times.'),
      tryIt: [t('连按 5 次：小光球走完一整圈，再离开圆环去回答。', 'Press 5 times: the dot goes all the way round, then leaves the ring to answer.'),
        t('留意第 4 步：它回到了“模型”，又想了一次。', 'Watch step 4: it is back at the model, thinking again.')],
      how: [t('🤔 这一圈的 5 步', '🤔 The 5 steps of this loop'), LOOP.map(([zh, en]) => t(zh, en))],
      note: t('真实的 Agent 可能转十几圈，也会用搜索、写代码、读文件等很多工具。例子是编的。', 'A real agent may go round a dozen times and use many tools: search, code, files and more. The example is made up.'),
    }));
}

/* ================= K2: a matrix turns the grid ================= */
function grid(P: Page) {
  const t = P.t, [a, b, c, d] = matOf(ANG0);
  P.s3c('lab3dGrid', t('3D 矩阵让格子转起来', '3D a matrix turns the grid'),
    box('grBox', t('一块斜放的板子上有灰色方格；紫色的方格和两根箭头是被矩阵变过的样子，转了一个角度、也变大了一点', 'A tilted board with a grey grid; the purple grid and two arrows show it after the matrix: turned by an angle and a little bigger'))
    + say('grSay', matSay(ANG0, L(P)), slider('grA', t('转多少度', 'Turn'), t('矩阵转的角度', 'How far the matrix turns'), ANG_MIN, ANG_MAX, 5, ANG0, `${ANG0}°`))
    + fold(P, {
      plain: t('矩阵就是一张“变形说明书”：一组 4 个数，就能让整张方格纸一起转、一起拉大或压扁。格子里的每个点都按同一个规则搬家。', 'A matrix is a “change the shape” recipe: 4 numbers that turn, stretch or squash a whole sheet of squared paper at once. Every point on it moves by the same rule.'),
      tryIt: [t('拖到 0°：紫格子不转，只是比灰格子大一圈。', 'Drag to 0°: the purple grid does not turn, it is just bigger.'),
        t('拖到 90°：蓝箭头转到了原来紫箭头的方向。', 'Drag to 90°: the blue arrow now points where the purple one did.')],
      how: [t('🤔 这 4 个数是什么', '🤔 What the 4 numbers are'), [
        t(`${ANG0}° 时，矩阵是 [${n2(a)} ${n2(b)} ; ${n2(c)} ${n2(d)}]。`, `At ${ANG0}°, the matrix is [${n2(a)} ${n2(b)} ; ${n2(c)} ${n2(d)}].`),
        t('第一列是蓝箭头（原来指向右）变过去的位置，第二列是紫箭头（原来指向上）的。', 'The first column is where the blue arrow (pointing right) ends up; the second is the purple one (pointing up).')]],
      note: t('大模型里每一层都在做这种“乘一个矩阵”，只是格子有几千维，画不出来。', 'Every layer of a big model multiplies by matrices like this, but in thousands of dimensions that cannot be drawn.'),
    }));
}

/* ================= K3: dice and the bell ================= */
function dice3(P: Page) {
  const t = P.t;
  P.s3c('lab3dDice', t('3D 掷骰子，看规律', '3D roll dice, find the pattern'),
    box('dcBox', t('两颗骰子和一排 11 根柱子，柱子下面写着 2 到 12；每掷一次，两颗骰子点数之和那根柱子就长高一点，虚线是理论上该有的高度', 'Two dice and a row of 11 bars labelled 2 to 12; each roll makes the bar for the sum of the two dice a little taller; the dashed curve is how tall each should be'))
    + say('dcSay', diceSay(0, L(P)), go('dcGo', `🎲 ${t(`掷 ${ROLL_STEP} 次`, `Roll ${ROLL_STEP}×`)}`))
    + fold(P, {
      plain: t('每一次掷骰子都猜不准，可掷很多次以后，结果会排成一座中间高、两边低的“小山”。概率就是在乱七八糟里找到这种规律。', 'One roll is never predictable, but after many rolls the results form a hill: high in the middle, low at the sides. Probability is finding this kind of pattern in the mess.'),
      tryIt: [t(`一直按到 ${ROLL_MAX} 次：柱子越来越像虚线那座小山。`, `Keep pressing up to ${ROLL_MAX} rolls: the bars look more and more like the dashed hill.`),
        t('看两头：和是 2 或 12 的最少，因为只有一种掷法。', 'Look at the ends: 2 and 12 are rarest, since only one roll makes each.')],
      how: [t('🤔 为什么 7 最多', '🤔 Why 7 comes up most'), [
        t('两颗骰子一共有 36 种结果。', 'Two dice have 36 possible results.'),
        t(`凑出 7 有 ${WAYS[5]} 种（1+6、2+5、3+4…），凑出 2 只有 1 种（1+1）。`, `There are ${WAYS[5]} ways to make 7 (1+6, 2+5, 3+4…) but only 1 way to make 2 (1+1).`)]],
      note: t('骰子是电脑模拟的，每次打开页面结果都一样，方便对照。大模型挑词，也是在这种“可能性”里抽一个。', 'The dice are simulated and give the same results every time, so you can compare. A big model picks its next word by drawing from chances like these.'),
    }));
}

/* ================= T6: a picture becomes words ================= */
function patch(P: Page) {
  const t = P.t;
  P.s3c('lab3dPatch', t('3D 图片也能变成“词”', '3D a picture becomes “words”'),
    box('ptBox', t('左边是一张小猫的图片，被切成一块块方格，悬在空中；右边是一个大大的“猫”字和一个玻璃球，地上一圈圈光把它们连在一起', 'On the left a picture of a cat is cut into square patches floating in the air; on the right is the big word “cat” and a glass ball; rings of light on the floor join them'))
    + say('ptSay', patchSay(PATCH0, L(P)), slider('ptG', t('每边切几块', 'Cuts per side'), t('图片每边切成几块', 'How many patches per side'), PATCH[0]!, PATCH[PATCH.length - 1]!, 1, PATCH0, `${PATCH0}×${PATCH0}`))
    + fold(P, {
      plain: t('模型只认识“词”。为了看懂图片，它先把图片切成一小块一小块，每块都变成一串数字，就像一个“图片词”，再和文字放在一起读。', 'A model only understands “words”. To read a picture, it cuts the picture into small patches and turns each into a list of numbers, a kind of “picture word”, then reads them together with the text.'),
      tryIt: [t('拖到 4：切成 16 块，每块更小、更细。', 'Drag to 4: 16 smaller patches with more detail.'),
        t('拖到 2：只有 4 块，每块装的东西更多。', 'Drag to 2: only 4 patches, each holding more.')],
      how: [t('🤔 切得越多会怎样', '🤔 What more cuts means'), [
        t('块越多，看得越细，但要读的“词”也越多，算得更慢。', 'More patches see more detail, but there are more “words” to read, so it is slower.'),
        t('真实模型常把一张图切成几百块。', 'Real models often cut one picture into hundreds of patches.')]],
      note: t('图里的小猫是画出来的示意图。', 'The cat is a drawing, just to show the idea.'),
    }));
}

/* ================= T3: guess the next word ================= */
function next(P: Page) {
  const t = P.t, p1 = nextP(TEMP0), p0 = nextP(0.2), p2 = nextP(2);
  P.s3c('lab3dNext', t('3D 猜下一个词', '3D guess the next word'),
    box('nxBox', t('托盘上摆着词方块“小猫 坐 在 ？”，后面立着 4 根玻璃柱：垫子上、沙发上、地上、月亮上，柱子越高越可能被选中', 'A tray holds the word cubes “The cat sat on ?”; behind stand 4 glass bars: mat, sofa, floor, moon; the taller, the more likely'))
    + say('nxSay', nextSay(TEMP0, L(P)), slider('nxT', t('随机度', 'Randomness'), t('随机度（温度）', 'Randomness (temperature)'), TEMP_MIN, TEMP_MAX, 0.1, TEMP0, TEMP0.toFixed(1)))
    + fold(P, {
      plain: t('大模型说话，其实是一个词一个词地猜。每一步它都给所有可能的下一个词算一个可能性，再从里面挑一个。“随机度”管它挑得多大胆。', 'A big model talks by guessing one word at a time. At every step it gives each possible next word a chance, then picks one. “Randomness” sets how bold the pick is.'),
      tryIt: [t(`拖到 0.2：「垫子上」长到 ${pc(p0[0]!)}%，别的几乎为 0。`, `Drag to 0.2: “mat” grows to ${pc(p0[0]!)}% and the rest almost vanish.`),
        t(`拖到 2：「月亮上」也有 ${pc(p2[3]!)}%，回答会更有想象力，也更容易跑偏。`, `Drag to 2: even “moon” gets ${pc(p2[3]!)}%; answers are more creative but can go off track.`)],
      how: [t('🤔 随机度 1 时的可能性', '🤔 The chances at randomness 1'), NEXT.map(([zh, en], i) => t(`${zh}：${pc(p1[i]!)}%`, `${en}: ${pc(p1[i]!)}%`))],
      note: t('随机度的正式名字叫“温度”。数字是编的小例子。', 'The proper name for randomness is “temperature”. The numbers are a made-up example.'),
    }));
}

export const M15: Ext = {
  parts: {},
  cards: {},
  near: {
    N: [{ after: 'c_N_0', f: net }],
    T4: [{ after: 'c_T4_0', f: blk }],
    T4b: [{ after: 'c_T4b_0', f: score }],
    T5: [{ after: 'c_T5_0', f: moe }],
    T2: [{ after: 'c_T2_0', f: loop }],
    K2: [{ after: 'c_K2_0', f: grid }],
    K3: [{ after: 'c_K3_0', f: dice3 }],
    T6: [{ after: 'c_T6_0', f: patch }],
    T3: [{ after: 'c_T3_0', f: next }],
  },
  quiz: () => ({}),
};
/** every lab M15 adds, by station (tests read this) */
export const S3D_IDS3: Record<string, string[]> = { N: ['lab3dNet'], T4: ['lab3dBlk'], T4b: ['lab3dScore'], T5: ['lab3dMoe'], T2: ['lab3dLoop'], K2: ['lab3dGrid'], K3: ['lab3dDice'], T6: ['lab3dPatch'], T3: ['lab3dNext'] };
/** these go to the very top of their stop */
export const S3D_TOP3: Record<string, string> = { N: 'lab3dNet', T4: 'lab3dBlk', T4b: 'lab3dScore', T5: 'lab3dMoe', T2: 'lab3dLoop', K2: 'lab3dGrid', K3: 'lab3dDice', T6: 'lab3dPatch' };
