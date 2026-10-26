/* R30: the data and maths behind the three 3D scenes (word-vector space, attention beams, rolling down the loss valley).
   Pure functions, no DOM and no three.js, so the 2D fallbacks, the 3D views and the unit tests share one source. */

/* ---------- 1. word-vector space (T3) ---------- */
/** group: 0 people, 1 places, 2 animals (R30c: three tight clusters, like the reference sheet). Coordinates are made-up
    toy numbers (real models use thousands of dimensions): each group is a small clump of 4, the clumps sit far apart */
export const VWORDS: [zh: string, en: string, g: number, x: number, y: number, z: number][] = [
  ['国王', 'king', 0, -1.6, 1.5, 0.2], ['王子', 'prince', 0, -2.4, 1.2, -0.1], ['公主', 'princess', 0, -2.0, 0.6, 0.5], ['女王', 'queen', 0, -1.1, 0.7, 0.7],
  ['法国', 'France', 1, 1.4, 1.5, -0.2], ['巴黎', 'Paris', 1, 2.2, 1.6, -0.6], ['日本', 'Japan', 1, 1.5, 0.5, -0.3], ['东京', 'Tokyo', 1, 2.3, 0.7, -0.9],
  ['猫', 'cat', 2, -0.3, -1.3, 2.7], ['狗', 'dog', 2, 0.6, -1.1, 3.0], ['鱼', 'fish', 2, -0.1, -2.05, 2.4], ['鸟', 'bird', 2, 0.8, -1.95, 2.75],
];
export const VCOL = ['#b9a2f7', '#8b93f3', '#93c4f3']; // R30c: lavender, indigo, powder blue
export const vcol = (g: number): string => VCOL[g] ?? '#64748b';
export const VGROUP: [string, string][] = [['人物', 'people'], ['地方', 'places'], ['动物', 'animals']];
export const vdist = (a: number, b: number) => { const p = VWORDS[a]!, q = VWORDS[b]!; return Math.hypot(p[3] - q[3], p[4] - q[4], p[5] - q[5]); };
/** the k words closest to word i (straight-line distance in the 3D space), nearest first */
export function nearest(i: number, k = 3): number[] {
  return VWORDS.map((_, j) => j).filter((j) => j !== i).sort((a, b) => vdist(i, a) - vdist(i, b)).slice(0, k);
}

/* ---------- 2. attention beams (T4a): the same toy numbers as the 「我 爱 吃 苹果」 card (c_T4a_1) ---------- */
export const AWORDS: [string, string][] = [['我', 'I'], ['爱', 'love'], ['吃', 'eating'], ['苹果', 'apples']];
export const AQ = [[0.8, 0.0], [1.2, 0.3], [1.0, 0.5], [0.2, 2.0]];
export const AK = [[1.0, 0.1], [0.3, 0.6], [0.1, 1.2], [0.5, 0.4]];
/** how word i shares out its attention over words 0..i (later words are masked: it may only look back), each row sums to 1 */
export function attnRow(i: number): number[] {
  const sc = AK.map((k, j) => (j > i ? -Infinity : (AQ[i]![0]! * k[0]! + AQ[i]![1]! * k[1]!) / Math.SQRT2));
  const m = Math.max(...sc), e = sc.map((v) => (v === -Infinity ? 0 : Math.exp(v - m))), s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}
/** whole percentages, as the card shows them */
export const pct = (w: number) => Math.round(w * 100);

/* ---------- 3. rolling down the loss valley (T7) ---------- */
/** a long, narrow valley: loss L(a, b) = ½·(0.5·a² + 2.5·b²). Steep across (b), gentle along (a) */
export const VA = 0.5, VB = 2.5, START: [number, number] = [-3, 1.8], LR_MIN = 0.02, LR_MAX = 0.78, LR0 = 0.1, MAXSTEP = 80;
export const loss = (a: number, b: number) => 0.5 * (VA * a * a + VB * b * b);
export const grad = (a: number, b: number): [number, number] => [VA * a, VB * b];
/** gradient-descent points from START: p ← p − η·∇L, until the loss is tiny or MAXSTEP steps */
export function descend(eta: number, n = MAXSTEP): [number, number][] {
  const out: [number, number][] = [START];
  let [a, b] = START;
  for (let i = 0; i < n; i++) {
    const [ga, gb] = grad(a, b); a -= eta * ga; b -= eta * gb; out.push([a, b]);
    if (loss(a, b) < 0.005 || !Number.isFinite(a + b)) break;
  }
  return out;
}
/** smooth: every step keeps the same side; zigzag: steps jump across the valley floor and back; slow: still far after MAXSTEP */
export type Regime = 'slow' | 'smooth' | 'zigzag';
export function regime(eta: number): Regime {
  if (eta * VB > 1) return 'zigzag';
  const p = descend(eta); return loss(...p[p.length - 1]!) >= 0.005 ? 'slow' : 'smooth';
}
/** how many sign flips across the valley (b changes side) in a path: the "back and forth" count */
export const flips = (p: [number, number][]) => p.slice(1).filter((q, i) => Math.sign(q[1]) !== Math.sign(p[i]![1]) && q[1] !== 0).length;

/* ---------- R30b: the one sentence under each stage (shared by the page build and the labs, zh / en) ---------- */
type Lg = 'zh' | 'en';
const wv = (i: number, L: Lg) => VWORDS[i]![L === 'en' ? 1 : 0];
const wa = (i: number, L: Lg) => AWORDS[i]![L === 'en' ? 1 : 0];
export function vecSay(i: number, L: Lg): string {
  const n = nearest(i).map((j) => wv(j, L));
  return L === 'en' ? `Similar words live close: “<b>${wv(i, L)}</b>” sits by ${n[0]}, ${n[1]} and ${n[2]}.`
    : `意思越像，住得越近：“<b>${wv(i, L)}</b>”挨着${n.join('、')}。`;
}
export function attnSay(i: number, L: Lg): string {
  if (i === 0) return L === 'en' ? '“<b>I</b>” is the first word: nothing before it, so it looks only at itself.' : '“<b>我</b>”是第一个词，前面没有词，只看自己。';
  const r = attnRow(i), top = r.indexOf(Math.max(...r));
  return L === 'en' ? `“<b>${wa(i, L)}</b>” looks most at “${wa(top, L)}”: ${pct(r[top]!)}%.`
    : `“<b>${wa(i, L)}</b>”回头看，最在意“${wa(top, L)}”：${pct(r[top]!)}%。`;
}
export function valleySay(eta: number, L: Lg): string {
  const p = descend(eta), n = p.length - 1, rg = regime(eta);
  if (L === 'en') return rg === 'slow' ? `Too small: ${n} steps, still not at the bottom.` : rg === 'smooth' ? `Good steps: down in ${n} smooth steps.` : `Too big: it zigzags, ${n} steps to the bottom.`;
  return rg === 'slow' ? `步子太小：走了 ${n} 步还没到谷底。` : rg === 'smooth' ? `步子刚好：${n} 步平稳滚到谷底。` : `步子太大：在两边来回跳，${n} 步才到底。`;
}
