/* R23 labEmbOut (T4b): the toy maths for "front dictionary vs back scoring table" on 我爱吃 → ?.
   Every number here is a made-up EXAMPLE (5 hand-labelled dimensions so children can read them); real models learn
   hundreds or thousands of unlabelled dimensions. The steps are the real ones: look up rows → add position → layers
   rewrite (causal attention + a small feed-forward rule, both with residual adds) → dot product of the LAST vector with
   every row of the output table → softmax with temperature → sample. Unit-tested in tests/unit/r23.test.ts. */
export type V = number[];
/** the 5 example dimensions: food-ness, action-ness, person-ness, object-ness, position */
export const DIMS: [string, string][] = [['像食物', 'food'], ['像动作', 'action'], ['像人', 'person'], ['像物品', 'object'], ['位置', 'position']];
/** the input sentence and its rows in the toy dictionary (embedding table) */
export const SENT: [string, string][] = [['我', 'I'], ['爱', 'love'], ['吃', 'eating']];
export const IDS = [0, 1, 2];
export const EMB: V[] = [
  [0, 0, 1, 0, 0], // 我
  [0.1, 0.6, 0.3, 0, 0], // 爱
  [0.3, 1, 0, 0, 0], // 吃
];
/** toy position information, added to the card (only the 5th dimension, so it is easy to see) */
export const POS = (i: number): V => [0, 0, 0, 0, 0.1 * (i + 1)];
/** the toy scoring table (output head): one row per candidate next word */
export const VOCAB: [string, string][] = [['苹果', 'apples'], ['米饭', 'rice'], ['面条', 'noodles'], ['西瓜', 'watermelon'], ['火锅', 'hotpot'], ['桌子', 'tables'], ['跑步', 'running'], ['书', 'books']];
export const OUT: V[] = [
  [1, 0, 0, 0.1, 0],
  [0.95, 0, 0, 0, 0],
  [0.9, 0.1, 0, 0, 0],
  [0.85, 0, 0, 0.15, 0],
  [0.8, 0.15, 0.1, 0, 0],
  [0, 0, 0, 1, 0],
  [0, 1, 0.1, 0, 0],
  [0.05, 0, 0, 0.9, 0],
];
export const dot = (a: V, b: V) => a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);
export const add = (a: V, b: V) => a.map((x, i) => x + (b[i] ?? 0));
export const scale = (a: V, k: number) => a.map((x) => x * k);
/** softmax with temperature T: divide every score by T, raise e to each, divide by the total */
export function softmax(s: number[], T = 1): number[] {
  const z = s.map((x) => x / T), m = Math.max(...z), e = z.map((x) => Math.exp(x - m)), t = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / t);
}
/** step 1: look up the rows and add position */
export const start = (): V[] => IDS.map((id, i) => add(EMB[id]!, POS(i)));
/** one toy layer on every position: causal attention (look only at itself and earlier words, weights = softmax of dot
    products), residual add, then the toy feed-forward rule, residual add */
export interface Layer { att: number[][]; xs: V[] }
export function layer(xs: V[], ffn: (h: V) => V): Layer {
  const att: number[][] = [];
  const mixed = xs.map((h, i) => {
    const w = softmax(xs.slice(0, i + 1).map((x) => dot(h, x)));
    att.push(w);
    return add(h, w.reduce((m, wj, j) => add(m, scale(xs[j]!, wj)), [0, 0, 0, 0, 0]));
  });
  return { att, xs: mixed.map((h) => add(h, ffn(h))) };
}
const relu = (x: number) => Math.max(0, x);
/** toy feed-forward rules (made up): layer 1 — "an action word after a person who loves → the next word is a thing to
    be acted on": move action-ness into food-ness; layer 2 — "after 爱吃 the thing is food, not furniture" */
export const FFN: ((h: V) => V)[] = [
  (h) => { const a = relu(h[1]! - 0.5); return [1.2 * a, -0.9 * a, -0.4 * relu(h[2]!), 0, 0]; },
  (h) => { const f = relu(h[0]!); return [0.5 * f, -0.4 * relu(h[1]!), -0.3 * relu(h[2]!), -0.5 * relu(h[3]!), 0]; },
];
/** all steps at once */
export function run(T = 1) {
  const x0 = start(), l1 = layer(x0, FFN[0]!), l2 = layer(l1.xs, FFN[1]!);
  const last = l2.xs[l2.xs.length - 1]!;
  const scores = OUT.map((r) => dot(last, r)), probs = softmax(scores, T);
  return { x0, l1, l2, last, trace: [x0[2]!, l1.xs[2]!, last], scores, probs };
}
/** sample an index from probabilities with a number u in [0, 1) */
export function pick(p: number[], u: number): number {
  let c = 0; for (let i = 0; i < p.length; i++) { c += p[i]!; if (u < c) return i; } return p.length - 1;
}
