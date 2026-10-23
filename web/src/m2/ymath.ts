/* exact helpers for the R11 labs (beam search, perplexity, RoPE, LoRA, DPO, pass@k, LR schedule + clipping) */

/* ---- labBeam (T3): greedy vs beam search over a fixed two-step tree ---- */
export type Step = [string, number][];
export interface Tree { first: Step; next: Record<string, Step> }
export interface Beam { tokens: string[]; p: number }
/** beam search of width k over a two-level tree; width 1 is greedy decoding. Ties keep the earlier (tree-order) candidate. */
export function beam(tree: Tree, k: number): { kept1: Beam[]; cands: Beam[]; kept2: Beam[]; best: Beam } {
  if (k < 1) throw new Error('beam width must be ≥ 1');
  const top = (bs: Beam[]) => bs.map((b, i) => [b, i] as const).sort((a, b) => b[0].p - a[0].p || a[1] - b[1]).map((x) => x[0]);
  const kept1 = top(tree.first.map(([t, p]) => ({ tokens: [t], p }))).slice(0, k);
  const cands = top(kept1.flatMap((b) => (tree.next[b.tokens[0]!] ?? []).map(([t, p]) => ({ tokens: [...b.tokens, t], p: b.p * p }))));
  const kept2 = cands.slice(0, k);
  return { kept1, cands, kept2, best: kept2[0]! };
}
/** every complete two-step sequence, best first (what an exhaustive search would see) */
export function allPaths(tree: Tree): Beam[] { return beam(tree, tree.first.length).cands; }
/** illustrative tree (示意): the most likely first word leads to a weak continuation */
export const BEAM_TREE: Record<'zh' | 'en', Tree> = {
  zh: { first: [['猫', 0.5], ['狗', 0.4], ['鱼', 0.1]], next: { 猫: [['跑', 0.4], ['睡', 0.35], ['叫', 0.25]], 狗: [['叫', 0.9], ['跑', 0.05], ['睡', 0.05]], 鱼: [['游', 0.6], ['跳', 0.3], ['睡', 0.1]] } },
  en: { first: [['cat', 0.5], ['dog', 0.4], ['fish', 0.1]], next: { cat: [['runs', 0.4], ['sleeps', 0.35], ['meows', 0.25]], dog: [['barks', 0.9], ['runs', 0.05], ['sleeps', 0.05]], fish: [['swims', 0.6], ['jumps', 0.3], ['sleeps', 0.1]] } },
};

/* ---- labPpl (T3): perplexity = exp(average negative log-likelihood) ---- */
/** average cross-entropy in nats over the probabilities the model gave the actual next tokens */
export function nll(ps: number[]): number {
  if (!ps.length || ps.some((p) => !(p > 0 && p <= 1))) throw new Error('probabilities must be in (0, 1]');
  return 0 - ps.reduce((a, p) => a + Math.log(p), 0) / ps.length;
}
export const ppl = (ps: number[]) => Math.exp(nll(ps));

/* ---- labRope (T4a): rotary position embedding (RoFormer) ---- */
/** RoPE frequencies θ_i = base^(−2i/d), i = 0 … d/2 − 1 */
export const ropeThetas = (d: number, base = 10000) => Array.from({ length: d / 2 }, (_, i) => base ** (-(2 * i) / d));
/** rotate each consecutive pair (x_{2i}, x_{2i+1}) by pos·θ_i */
export function rope(x: number[], pos: number, th: number[]): number[] {
  if (x.length !== 2 * th.length) throw new Error('vector length must be 2 × number of frequencies');
  const o: number[] = [];
  th.forEach((t, i) => { const a = pos * t, c = Math.cos(a), s = Math.sin(a), u = x[2 * i]!, v = x[2 * i + 1]!; o.push(u * c - v * s, u * s + v * c); });
  return o;
}
export const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i]!, 0);
/** attention score between a query at position m and a key at position n after RoPE */
export const ropeScore = (q: number[], k: number[], m: number, n: number, th: number[]) => dot(rope(q, m, th), rope(k, n, th));

/* ---- labLora (T5): trainable parameters, full fine-tuning vs LoRA on one d×k weight ---- */
export function loraParams(d: number, k: number, r: number) { const full = d * k, lora = r * (d + k); return { full, lora, pct: (100 * lora) / full }; }

/* ---- labDpo (T7): the DPO loss for one preference pair ---- */
const softplus = (x: number) => (x > 0 ? x + Math.log1p(Math.exp(-x)) : Math.log1p(Math.exp(x)));
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
/** dw = log πθ(y_w|x) − log π_ref(y_w|x), dl = the same for the rejected answer */
export function dpo(dw: number, dl: number, beta: number) {
  const m = beta * (dw - dl);
  return { rw: beta * dw, rl: beta * dl, margin: m, loss: softplus(-m), weight: sigmoid(-m) };
}

/* ---- labPassK (T7): the unbiased pass@k estimator (Chen et al. 2021) ---- */
/** 1 − C(n−c, k) / C(n, k), computed as a stable product */
export function passAtK(n: number, c: number, k: number): number {
  if (!(n >= 1 && c >= 0 && c <= n && k >= 1 && k <= n)) throw new Error('need 0 ≤ c ≤ n and 1 ≤ k ≤ n');
  if (n - c < k) return 1;
  let q = 1;
  for (let i = n - c + 1; i <= n; i++) q *= 1 - k / i;
  return 1 - q;
}
/** the naive plug-in 1 − (1 − c/n)^k, for comparison */
export const passNaive = (n: number, c: number, k: number) => 1 - (1 - c / n) ** k;

/* ---- labSched (T7): linear warmup + cosine decay, and gradient-norm clipping ---- */
export function lrAt(t: number, T: number, W: number, peak: number, min: number): number {
  if (!(W >= 0 && W < T && t >= 0 && t <= T)) throw new Error('need 0 ≤ W < T and 0 ≤ t ≤ T');
  if (t < W) return (peak * t) / W;
  return min + 0.5 * (peak - min) * (1 + Math.cos((Math.PI * (t - W)) / (T - W)));
}
/** scale g so its L2 norm is at most c; returns the norm before and the clipped vector */
export function clipNorm(g: number[], c: number) {
  const norm = Math.hypot(...g), s = norm > c ? c / norm : 1;
  return { norm, scale: s, g: g.map((x) => x * s) };
}
