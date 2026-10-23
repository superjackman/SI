/* pure maths behind the K1–K5 labs (unit-tested in tests/kmath.test.ts) */
export type Fn = 'sq' | 'sig' | 'sin';
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export const F: Record<Fn, { f: (x: number) => number; d: (x: number) => number }> = {
  sq: { f: (x) => x * x, d: (x) => 2 * x },
  sig: { f: sigmoid, d: (x) => sigmoid(x) * (1 - sigmoid(x)) },
  sin: { f: Math.sin, d: Math.cos },
};
export const HS = [1, 0.5, 0.1, 0.01, 0.001] as const;
/** forward-difference secant slope vs the true derivative */
export function secant(fn: Fn, x0: number, h: number) {
  const { f, d } = F[fn];
  const slope = (f(x0 + h) - f(x0)) / h, deriv = d(x0);
  return { slope, deriv, err: slope - deriv };
}

/** 2×2 matrix [[a,b],[c,d]] acting on column vectors */
export const det2 = (a: number, b: number, c: number, d: number) => a * d - b * c;
export const apply2 = (a: number, b: number, c: number, d: number, x: number, y: number): [number, number] => [a * x + b * y, c * x + d * y];

export const TS = [0.25, 0.5, 0.75, 1, 1.5, 2, 4] as const;
/** softmax with temperature, entropy H(p), cross-entropy −ln p_y and ∂L/∂z = (p − y)/T, all in nats */
export function softmaxT(z: number[], T: number, y: number) {
  const s = z.map((v) => v / T), mx = Math.max(...s);
  const e = s.map((v) => Math.exp(v - mx)), sum = e.reduce((a, b) => a + b, 0);
  const p = e.map((v) => v / sum);
  const H = -p.reduce((a, q) => a + (q > 0 ? q * Math.log(q) : 0), 0);
  const ce = -Math.log(p[y] ?? NaN);
  const grad = p.map((q, i) => (q - (i === y ? 1 : 0)) / T);
  return { p, H, ce, grad };
}

/** gradient descent on f(x) = (a/2)x² (default a = 2, i.e. x²): x_{k+1} = (1 − ηa)x_k */
export function gdPath(eta: number, x0 = 3, steps = 12, a = 2): number[] {
  const xs = [x0];
  for (let k = 0; k < steps; k++) xs.push(xs[k]! - eta * a * xs[k]!);
  return xs;
}
export type Regime = 'mono' | 'one' | 'osc' | 'cycle' | 'div';
/** classify by r = 1 − ηa (tolerant of slider float noise) */
export function regime(eta: number, a = 2): Regime {
  const r = 1 - eta * a, tol = 1e-9;
  if (Math.abs(r) < tol) return 'one';
  if (Math.abs(r + 1) < tol) return 'cycle';
  if (r > 0) return 'mono';
  return r > -1 ? 'osc' : 'div';
}

/** h = σ(w1·x), ŷ = w2·h, L = ½(ŷ − y)²: backprop vs central difference */
export function gcLoss(w1: number, w2: number, x = 1, y = 1) { const h = sigmoid(w1 * x), yh = w2 * h; return 0.5 * (yh - y) ** 2; }
export function gradCheck(w1: number, w2: number, x = 1, y = 1, eps = 1e-4) {
  const h = sigmoid(w1 * x), yh = w2 * h, g = yh - y, sp = h * (1 - h);
  const bp: [number, number] = [g * w2 * sp * x, g * h];
  const num: [number, number] = [
    (gcLoss(w1 + eps, w2, x, y) - gcLoss(w1 - eps, w2, x, y)) / (2 * eps),
    (gcLoss(w1, w2 + eps, x, y) - gcLoss(w1, w2 - eps, x, y)) / (2 * eps),
  ];
  const rel = bp.map((b, i) => { const n = num[i]!, den = Math.abs(b) + Math.abs(n); return den < 1e-12 ? 0 : Math.abs(b - n) / den; }) as [number, number];
  return { h, yh, L: 0.5 * g * g, sp, bp, num, rel };
}
