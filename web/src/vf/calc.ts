/* R50 验证优化 · the pure maths behind the self-checks and the three slider demos. Every answer a question shows is
   computed here (from the same inputs as the shared number table, dv/nums.ts) and tests/unit/r50-vf.test.ts checks the
   results against that table, so a question can never drift from the cards and the stage pages. */
/** gradient descent on L(w) = (w − c)² + m from w0: [w0, w1, …, wn] */
export const gdSeq = (eta: number, n: number, w0 = 0, c = 2): number[] => { const w = [w0]; for (let i = 0; i < n; i++) { const v = w[i]!; w.push(v - eta * 2 * (v - c)); } return w; };
export const gdL = (w: number, c = 2, m = 0.5) => (w - c) ** 2 + m;
/** softmax with temperature T (subtracts the max first, like real code) */
export function softmax(x: readonly number[], T = 1): number[] { const m = Math.max(...x), e = x.map((v) => Math.exp((v - m) / T)), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); }
/** attention weights: softmax(scores / √d_k) */
export const attW = (raw: readonly number[], dk: number) => softmax(raw.map((v) => v / Math.sqrt(dk)));
export const sigma = (x: number) => 1 / (1 + Math.exp(-x));
export const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, v, i) => s + v * b[i]!, 0);
export const mse = (p: readonly number[], y: readonly number[]) => p.reduce((s, v, i) => s + (v - y[i]!) ** 2, 0) / p.length;
export const relu = (z: number) => Math.max(0, z);
/** momentum v = β·v + g over a run of gradients: [v1, v2, …] */
export const momentum = (g: readonly number[], b = 0.9) => { let v = 0; return g.map((x) => (v = b * v + x)); };
export const norm = (a: readonly number[]) => Math.sqrt(dot(a, a));
export const cos = (a: readonly number[], b: readonly number[]) => dot(a, b) / (norm(a) * norm(b));
/** the demo inputs, the same as the table: KM10 curve, K15 scores, KM12 / step 8 scores */
/** the step-7 softmax example scores (= NUM smS) */
export const D_SM4 = [2, 1, 0.1, -0.5] as const;
export const D_SM = [4.1, 1.3, 1.0] as const, D_ATT = [16, 8, 0] as const, D_DK = [1, 4, 16, 64, 256] as const;
/** how a gradient-descent run on the KM10 curve behaves: each step multiplies the distance to 2 by (1 − 2η) */
export const gdKind = (eta: number): 'slow' | 'ok' | 'osc' | 'stuck' | 'div' => { const f = 1 - 2 * eta; return Math.abs(f) > 1 + 1e-9 ? 'div' : Math.abs(Math.abs(f) - 1) < 1e-9 ? 'stuck' : f < 0 ? 'osc' : eta < 0.1 ? 'slow' : 'ok'; };
/** parse what a reader typed: full-width digits, − / – minus, Chinese decimal marks, thousands commas, a % sign */
export function parseNum(s: string): number | null {
  const t = s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[−–—]/g, '-').replace(/[．。]/g, '.').replace(/[,，\s%％]/g, '').replace(/^\+/, '');
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/.test(t)) return null;
  const v = Number(t); return Number.isFinite(v) ? v : null;
}
/** a number the way the site prints it: fixed decimals, − for minus, thousands separated by commas */
export const fmt = (v: number, d: number) => { const [a, b] = Math.abs(v).toFixed(d).split('.') as [string, string?], z = Number(a) === 0 && !/[1-9]/.test(b ?? '');
  return (v < 0 && !z ? '−' : '') + a.replace(/\B(?=(\d{3})+$)/g, ',') + (b ? '.' + b : ''); };
