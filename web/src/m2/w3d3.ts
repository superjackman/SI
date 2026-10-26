/* R31d: the data and the one sentence under the stage of the principles-line 3D scenes (N small network, T4 block
   stack, T4b scoring rack, T5 experts, T2 agent loop, K2 grid, K3 dice, T6 picture patches, T3 next word). Pure
   functions, no DOM and no three.js, shared by the 2D fallbacks, the 3D views, the cards and the unit tests.
   All numbers are toy numbers (said so in each card's fold). */
type Lang = 'zh' | 'en';
const T = (L: Lang, zh: string, en: string) => (L === 'en' ? en : zh);
const f1 = (x: number) => (Math.abs(x) < 0.05 ? '0' : x.toFixed(1)).replace('-', '−');
export const sig = (x: number) => 1 / (1 + Math.exp(-x));

/* ---------- N: one weight of a tiny network (3 in, 4 hidden, 2 out) ---------- */
export const NN_IN = [1, 0.5, 0.8];
/** hidden activations (fixed: the toy inputs through fixed first-layer weights) */
export const NN_H = [0.9, 0.4, 0.6, 0.3];
/** weights into output A; the first one is the weight on the slider */
export const NN_V = [0.7, 0.3, -0.4, 0.2], NN_B = -0.3, NN_W0 = 0.7, NN_WMIN = -2, NN_WMAX = 2;
/** output A (0..1) when the highlighted line (hidden 1 → A) has weight w */
export const nnOut = (w: number) => sig(NN_B + NN_H.reduce((s, h, i) => s + h * (i === 0 ? w : NN_V[i]!), 0));
export const pc = (x: number) => Math.round(x * 100);
export function nnSay(w: number, L: Lang): string {
  const p = pc(nnOut(w)), s = f1(w);
  if (Math.abs(w) < 0.05) return T(L, `权重 0：这根线不起作用（输出 <b>${p}%</b>）。`, `Weight 0: no effect (<b>${p}%</b>).`);
  return w > 0 ? T(L, `权重 ${s}：线越粗，输出越亮（<b>${p}%</b>）。`, `Weight ${s}: output glows <b>${p}%</b>.`)
    : T(L, `权重 ${s}：负的，把输出往下压（<b>${p}%</b>）。`, `Weight ${s}: output falls, <b>${p}%</b>.`);
}

/* ---------- T4: the layers of one Transformer block, bottom to top ---------- */
export const BLK: [string, string, string, string][] = [
  ['词嵌入', 'Embedding', '每个词变成一串数', 'each word becomes a list of numbers'],
  ['位置编码', 'Position', '记下每个词排第几', 'note where each word stands'],
  ['注意力', 'Attention', '每个词看看别的词', 'each word looks at the others'],
  ['加和·理齐', 'Add & tidy', '加回原来的数，再理整齐', 'add back the input, tidy up'],
  ['前馈网络', 'Feed-forward', '每个词自己再想一想', 'each word thinks on its own'],
  ['加和·理齐', 'Add & tidy', '再加回、再理整齐', 'add back and tidy again'],
  ['输出', 'Output', '交给下一块，最后出答案', 'on to the next block'],
];
export function blkSay(k: number, L: Lang): string {
  if (k < 0) return T(L, '按一下，看一句话一层层往上走。', 'Tap: send a sentence up the layers.');
  const b = BLK[Math.min(k, BLK.length - 1)]!;
  return T(L, `第 ${k + 1} 层「${b[0]}」：${b[2]}。`, `Layer ${k + 1}, ${b[1]}: ${b[3]}.`);
}

/* ---------- T4b: score every word, pick the highest ---------- */
/** the sentence is 「我饿了，想吃一个红红的___」; toy scores (0..1) */
export const SCORE: [string, string, number][] = [['苹果', 'apple', 0.92], ['香蕉', 'banana', 0.41], ['汽车', 'car', 0.05], ['小狗', 'dog', 0.08], ['蛋糕', 'cake', 0.55], ['书', 'book', 0.06]];
export const bestScore = () => SCORE.reduce((a, b) => (b[2] > a[2] ? b : a));
export function scoreSay(picked: boolean, L: Lang): string {
  if (!picked) return T(L, '每个词都打个分，越亮分越高。', 'Brighter bar = higher score.');
  const b = bestScore();
  return T(L, `「${b[0]}」得 <b>${b[2].toFixed(2)}</b> 分最高，就选它！`, `“${b[1]}” wins with <b>${b[2].toFixed(2)}</b>!`);
}

/* ---------- T5: mixture of experts ---------- */
export const MOE_TOK: [string, string, [number, number]][] = [['小猫', 'cat', [2, 5]], ['坐在', 'sat', [1, 7]], ['垫子', 'mat', [5, 8]], ['上面', 'on', [3, 6]]];
export const MOE_N = 8;
export function moeSay(i: number, L: Lang): string {
  if (i < 0) return T(L, '按一下，看每个词只找 2 位专家。', 'Tap: each word visits only 2 experts.');
  const [zh, en, [a, b]] = MOE_TOK[i % MOE_TOK.length]!;
  return T(L, `「${zh}」只找专家 ${a} 和 ${b}，其余 6 位休息。`, `“${en}” → experts ${a} and ${b}; 6 rest.`);
}

/* ---------- T2: the agent loop ---------- */
/** where the glowing dot is at each step: 0 model, 1 tools, 2 result, 3 model, 4 answer */
export const LOOP_AT = ['model', 'tools', 'result', 'model', 'answer'] as const;
export const LOOP: [string, string][] = [
  ['模型想：“得先查一下明天的天气。”', 'Model: “I need the weather.”'],
  ['用工具：打开天气网站查一查。', 'Tool: check a weather site.'],
  ['拿结果：明天晴，25 度。', 'Result: sunny, 25 °C.'],
  ['模型再想：“信息够了，可以回答。”', 'Model: “Enough to answer.”'],
  ['回答：明天晴天，记得防晒！', 'Answer: sunny, wear sunscreen!'],
];
export function loopSay(k: number, L: Lang): string {
  if (k < 0) return T(L, '按一下，看 Agent 怎么一步步干活。', 'Tap to watch the agent work.');
  const s = LOOP[Math.min(k, LOOP.length - 1)]!;
  return T(L, `第 ${k + 1} 步 · ${s[0]}`, `Step ${k + 1} · ${s[1]}`);
}

/* ---------- K2: a matrix turns and stretches the grid ---------- */
export const MAT_S = 1.3, ANG0 = 30, ANG_MIN = -90, ANG_MAX = 90;
/** the matrix [[a, b], [c, d]] = stretch × turn by deg */
export function matOf(deg: number): [number, number, number, number] {
  const r = (deg * Math.PI) / 180, c = MAT_S * Math.cos(r), s = MAT_S * Math.sin(r);
  return [c, -s, s, c];
}
export const n2 = (x: number) => (Math.abs(x) < 0.005 ? '0.00' : x.toFixed(2)).replace('-', '−');
export function matSay(deg: number, L: Lang): string {
  const d = String(Math.round(deg)).replace('-', '−');
  if (Math.round(deg) === 0) return T(L, `转 0°：格子只放大 ${MAT_S} 倍，没有转。`, `0°: the grid just grows ${MAT_S}×.`);
  return T(L, `转 ${d}°：整张格子和箭头一起转、一起变大。`, `${d}°: grid and arrows turn and grow.`);
}

/* ---------- K3: roll two dice, count the sums ---------- */
/** a small fixed pseudo-random sequence, so a page and its tests see the same rolls */
export function dice(n: number, seed = 27): [number, number][] {
  let s = seed >>> 0; /* mulberry32 */
  const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return 1 + Math.floor((((t ^ (t >>> 14)) >>> 0) / 2 ** 32) * 6); };
  const out: [number, number][] = []; for (let i = 0; i < n; i++) out.push([r(), r()]); return out;
}
export const ROLL_STEP = 10, ROLL_MAX = 200;
/** counts of the sums 2..12 after n rolls (index 0 = sum 2) */
export function sumCounts(n: number): number[] { const c = new Array(11).fill(0) as number[]; for (const [a, b] of dice(n)) c[a + b - 2]!++; return c; }
/** how many ways two dice make each sum, out of 36 */
export const WAYS = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
export function diceSay(n: number, L: Lang): string {
  if (n <= 0) return T(L, '按一下，掷两颗骰子 10 次，看和是几。', 'Tap to roll two dice 10 times.');
  const c = sumCounts(n), m = Math.max(...c), i = c.indexOf(m);
  return T(L, `掷了 ${n} 次：和是 ${i + 2} 的最多（${m} 次）。`, `${n} rolls: ${i + 2} came up most (${m}×).`);
}

/* ---------- T6: a picture cut into patches, next to the word ---------- */
export const PATCH = [2, 3, 4], PATCH0 = 3;
export function patchSay(g: number, L: Lang): string {
  return T(L, `切成 ${g * g} 块：每块变成一个“词”，和“猫”放一起。`, `${g * g} patches, each a “word” like “cat”.`);
}

/* ---------- T3: guess the next word ---------- */
/** 「小猫坐在___」: base chances at randomness 1 */
export const NEXT: [string, string, number][] = [['垫子上', 'mat', 0.47], ['沙发上', 'sofa', 0.28], ['地上', 'floor', 0.16], ['月亮上', 'moon', 0.09]];
export const TEMP0 = 1, TEMP_MIN = 0.2, TEMP_MAX = 2;
/** chances (sum 1) at randomness (temperature) t: softmax(ln p / t) */
export function nextP(t: number): number[] {
  const z = NEXT.map(([, , p]) => Math.log(p) / t), m = Math.max(...z), e = z.map((x) => Math.exp(x - m)), s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}
export function nextSay(t: number, L: Lang): string {
  const p = nextP(t), top = pc(p[0]!), s = t.toFixed(1);
  if (t < 0.6) return T(L, `随机度 ${s}：几乎总选「垫子上」（<b>${top}%</b>）。`, `Randomness ${s}: “mat” wins <b>${top}%</b>.`);
  if (t > 1.4) return T(L, `随机度 ${s}：几个词差不多，答案更多样。`, `Randomness ${s}: closer, more variety.`);
  return T(L, `随机度 ${s}：最可能选「垫子上」（<b>${top}%</b>）。`, `Randomness ${s}: “mat” leads, <b>${top}%</b>.`);
}
