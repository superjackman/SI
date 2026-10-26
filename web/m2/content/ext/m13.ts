/* M13 (R30, R30b): three 3D scenes (three.js, loaded only when the scene box is on screen; m2/labs/<S>.w.ts):
   lab3dVec on T3 (word-vector space), lab3dAttn on T4a (attention beams), lab3dValley on T7 (rolling down the loss valley).
   R30b: each is a "one-screen stage" at the very top of its stop (build.ts moves it there): the stage itself, one
   sentence and at most one control, then everything else in one closed 「想知道为什么 ▾」 layer, in words a primary-school
   child can follow (every symbol said in words). Each stage first holds a 2D figure that stays when 3D is not possible.
   All numbers are toy numbers and labelled so (inside the layer). */
import type { Page } from '../../lib';
import type { Ext } from './kit';
import { attnSay, LR0, LR_MAX, LR_MIN, VCOL, VGROUP, valleySay, vecSay } from '../../../src/m2/w3d';

const L = (P: Page) => (P.t('zh', 'en') as 'zh' | 'en');
const box = (id: string, label: string, inner = '') => `<div class="s3d" id="${id}" tabindex="0" role="img" aria-label="${label}"><svg class="s3d-fb" viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>${inner}</div>`;
const tip = (s: string) => `<span class="s3d-tip" aria-hidden="true">${s}</span>`;
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

/* ================= T3: word-vector space ================= */
function vec(P: Page) {
  const t = P.t;
  P.s3c('lab3dVec', t('3D 词向量空间', '3D word-vector space'),
    box('v3Box', t('词向量空间：每个词是一个彩色小球', 'Word-vector space: each word is a coloured ball'), tip(t('👆 点一个球', '👆 Tap a ball')))
    + say('v3Say', vecSay(0, L(P)))
    + fold(P, {
      plain: t('每个词都能变成一串数，一串数就能画成空间里的一个小球。意思越像的词，球挨得越近。', 'Every word can be turned into a list of numbers, and a list of numbers can be drawn as a ball in space. The more alike two words mean, the closer their balls sit.'),
      out: `<div class="s3d-leg">${VGROUP.map((g, i) => `<span><i style="background:${VCOL[i]}"></i>${t(g[0], g[1])}</span>`).join('')}</div><div id="v3Out" class="s3d-out" aria-live="polite"></div>`,
      tryIt: [t('点“国王”：最近的是王子、公主、女王，都是王室的人。', 'Tap “king”: the nearest are prince, princess and queen, all royal people.'),
        t('点“巴黎”：邻居是法国、东京、日本，都是地方。', 'Tap “Paris”: its neighbours are France, Tokyo and Japan, all places.'),
        t('左右拖一拖：从正面看挨着的球，转过去可能离得很远。', 'Drag sideways: balls that look close from the front can be far apart when you turn.')],
      how: [t('🤔 为什么这样画', '🤔 Why it is drawn like this'), [
        t('“近”怎么算：在两个球之间拉一根直线，线越短就越近。点一个球，它最近的 3 个邻居保持亮色，其余的变淡。', 'How “close” is measured: draw a straight line between two balls; the shorter the line, the closer. Tap a ball: its 3 nearest neighbours stay bright, the rest fade.'),
        t('真模型给每个词几千个数（几千个方向），画不出来；这里只用 3 个数，好让你看得见。三根带箭头的淡紫色轴 X、Y、Z 就是这 3 个方向。', 'A real model gives each word thousands of numbers (thousands of directions), too many to draw; here each word has just 3, so you can see them. The three faint purple arrows X, Y and Z are those 3 directions.')]],
      note: t('小球的位置是编的玩具数字，不是真模型算出来的。', 'The ball positions are made-up toy numbers, not from a real model.'),
    }));
}

/* ================= T4a: attention beams ================= */
function attn(P: Page) {
  const t = P.t;
  P.s3c('lab3dAttn', t('3D 注意力光束', '3D attention beams'),
    box('a3Box', t('注意力光束：四个词块，光束越粗表示看得越多', 'Attention beams: four word blocks; a thicker beam means more attention'), tip(t('👆 点一个词块', '👆 Tap a word block')))
    + say('a3Say', attnSay(3, L(P)))
    + fold(P, {
      plain: t('模型读到一个词时，会回头看前面的词，找对理解自己最有用的那个。光束越粗，越在意那个词。', 'When the model reads a word, it looks back at the words before it to find the ones that help most. The thicker the beam, the more it cares about that word.'),
      out: `<div id="a3Out" class="s3d-out" aria-live="polite"></div>`,
      tryIt: [t('点“苹果”：最粗的光束连到“吃”（49%）。“吃”和“苹果”关系最紧。', 'Tap “apples”: the thickest beam goes to “eating” (49%): those two belong together most.'),
        t('点“我”：只有一个圈回到自己，100%，因为它前面没有词。', 'Tap “I”: just one loop back to itself, 100%, because no word comes before it.'),
        t('点“爱”：62% 看“我”、38% 看自己，加起来还是 100%。', 'Tap “love”: 62% on “I” and 38% on itself, still 100% in all.')],
      how: [t('🤔 为什么这样画', '🤔 Why it is drawn like this'), [
        t('从一个词出发的所有光束加起来正好是 100%（100% 就是“全部”）。', 'All beams from one word add up to exactly 100% (100% means “all of it”).'),
        t('后面的词是灰色的：模型是一个词一个词往后写的，写到这里时后面的词还没出现，所以看不到。', 'Later words are grey: the model writes one word after another, so when it is here the later words do not exist yet and cannot be seen.'),
        t('百分比怎么来（好奇再看）：每个词有一张“提问卡”（我想找什么）和一张“标签卡”（我是什么），每张卡上 2 个数。把两张卡的数对应相乘再加起来得到分数，再除以 √2（√ 读作“根号”，√2 约等于 1.41），最后用 softmax（一种把一串分数变成加起来正好 100% 的方法）。', 'Where the shares come from (if you are curious): each word has a “query card” (what am I looking for) and a “key card” (what am I), 2 numbers on each. Multiply the two cards number by number and add up to get a score, divide by √2 (√ is “square root”; √2 is about 1.41), then apply softmax (a way to turn a list of scores into shares that add up to exactly 100%).')]],
      note: t('数字和上面“动手看”卡片里的一样，是编的小例子，不是真模型的数字。', 'The numbers are the same as in the “try it” card above: a made-up small example, not a real model’s numbers.'),
    }));
}

/* ================= T7: rolling down the loss valley ================= */
function valley(P: Page) {
  const t = P.t;
  /* R30c: one row: label, slider, value, Play, Reset (↺ moved out of the stage). English "Learning rate" is long, so
     there the label and value share a small first line and the slider gets the whole width of the second. */
  const ctl = `<div class="${'s3c-ctl lr'}"><label for="vlLr">${t('学习率', 'Learning rate')}</label><input type="range" id="vlLr" min="${LR_MIN}" max="${LR_MAX}" step="0.02" value="${LR0}" aria-label="${t('学习率（每一步迈多大）', 'Learning rate (how big each step is)')}"><b id="vlLrv">${LR0}</b>`
    + `<button type="button" class="s3c-play" id="vlPlay" aria-label="${t('播放', 'Play')}"><span aria-hidden="true">▶</span></button>`
    + `<button type="button" class="s3c-reset" id="vlReset" aria-label="${t('重来', 'Reset')}" title="${t('重来', 'Reset')}"><span aria-hidden="true">↺</span></button></div>`;
  P.s3c('lab3dValley', t('3D 滚下山谷', '3D rolling down the valley'),
    box('vlBox', t('损失山谷：小球顺着坡往下滚', 'The loss valley: a ball rolling downhill'))
    + say('vlSay', valleySay(LR0, L(P)), ctl)
    + fold(P, {
      plain: t('模型学习就像小球下山：山越高 = 错得越多，最低的地方 = 错得最少。学习率就是每一步迈多大。', 'A model learning is like a ball going downhill: higher = more wrong, the lowest spot = least wrong. The learning rate is how big each step is.'),
      out: `<div id="vlOut" class="s3d-out" aria-live="polite"></div>`,
      tryIt: [t('学习率 0.1：一路平稳滚到谷底，要 60 步。', 'Learning rate 0.1: it rolls steadily to the bottom in 60 steps.'),
        t('学习率 0.3：同样平稳，只要 19 步。步子大一点，走得快。', 'Learning rate 0.3: just as steady, in only 19 steps. Bigger steps, faster.'),
        t('学习率 0.5 以上：小球在山谷两边来回跳；拉到 0.78 要跳 66 步才停下。步子太大反而更慢。', 'Learning rate 0.5 or more: the ball jumps from side to side; at 0.78 it takes 66 jumping steps to settle. Steps that are too big end up slower.'),
        t('学习率 0.02：80 步还在半山腰。步子太小也不行。', 'Learning rate 0.02: after 80 steps it is still halfway down. Steps that are too small do not work either.')],
      how: [t('🤔 图里的东西是什么', '🤔 What the picture shows'), [
        t('<b>高度 = 损失 L</b>：模型错得有多离谱。越低越好，谷底就是错得最少的地方。', '<b>Height = loss L</b>: how wrong the model is. Lower is better; the bottom is where it is least wrong.'),
        t('<b>小球的位置</b> = 两个旋钮 a、b 的值。真模型有几十亿个旋钮，画不出来，但道理一样。', '<b>Where the ball is</b> = the values of two knobs, a and b. A real model has billions of knobs and cannot be drawn, but the idea is the same.'),
        t('<b>小箭头</b>指向下坡。<b>坡度</b>（也叫梯度）= 脚下有多陡、往哪边是上坡。半透明的小球是前几步走过的地方。', 'The <b>small arrow</b> points downhill. The <b>slope</b> (also called the gradient) = how steep it is underfoot and which way is uphill. The see-through balls are where the last steps were.'),
        t('每一步：新位置 = 旧位置 − 学习率 × 坡度（“−”就是往下坡走）。学习率常写成希腊字母 η，读作“伊塔”。', 'Each step: new place = old place − learning rate × slope (the “−” means go downhill). The learning rate is often written as the Greek letter η, said “AY-ta”.'),
        t('这个山谷的公式：L = ½ ×（0.5 × a² + 2.5 × b²）。½ 是一半，a² 是 a 乘 a。', 'This valley’s formula: L = ½ × (0.5 × a² + 2.5 × b²). ½ means half, and a² means a times a.')]],
      note: t('山谷的形状是编的玩具例子（只有 2 个旋钮）。', 'The valley is a made-up toy example (just 2 knobs).'),
    }));
}

export const M13: Ext = {
  parts: {},
  cards: {},
  near: {
    T3: [{ after: 'whyL1', f: vec }],
    T4a: [{ after: 'c_T4a_1', f: attn }],
    T7: [{ after: 'nnCard', f: valley }],
  },
  quiz: () => ({}),
};
/** every lab M13 adds, by station (tests read this) */
export const S3D_IDS: Record<string, string[]> = { T3: ['lab3dVec'], T4a: ['lab3dAttn'], T7: ['lab3dValley'] };
/** R30b: these cards go to the very top of their stop (build.ts, after the page head and its level strip) */
export const S3D_TOP: Record<string, string> = { T3: 'lab3dVec', T4a: 'lab3dAttn', T7: 'lab3dValley' };
