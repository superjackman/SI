/* K1–K5 math labs: the pure maths must match the closed forms the cards and observations claim. */
import { describe, expect, it } from 'vitest';
import { secant, HS, det2, apply2, softmaxT, TS, gdPath, regime, gradCheck, sigmoid } from '../../src/m2/kmath';
import { brk } from '../../m2/tex';

describe('K1 secant', () => {
  it('x² at x₀=1: forward slope is exactly 2 + h', () => { for (const h of HS) expect(secant('sq', 1, h).err).toBeCloseTo(h, 9); });
  it('σ′(0) = 1/4 and is the maximum of σ′', () => {
    expect(secant('sig', 0, 1e-3).deriv).toBe(0.25);
    for (let x = -4; x <= 4; x += 0.25) expect(sigmoid(x) * (1 - sigmoid(x))).toBeLessThanOrEqual(0.25);
  });
  it('error shrinks with h for every function', () => {
    for (const fn of ['sq', 'sig', 'sin'] as const) for (const x of [-2, -0.5, 1, 2]) {
      expect(Math.abs(secant(fn, x, 0.001).err)).toBeLessThan(Math.abs(secant(fn, x, 1).err) + 1e-12);
      expect(Math.abs(secant(fn, x, 0.001).err)).toBeLessThan(1.1e-3);
    }
  });
});

describe('K2 matrices', () => {
  it('determinant claims of the observations', () => {
    expect(det2(1, 2, 0.5, 1)).toBe(0);
    expect(det2(1.5, 0, 0, 1)).toBe(1.5);
    expect(det2(0.5, 1.5, 1, 0)).toBe(-det2(1.5, 0.5, 0, 1));
  });
  it('columns are the images of e₁ and e₂', () => {
    expect(apply2(1, 2, 3, 4, 1, 0)).toEqual([1, 3]);
    expect(apply2(1, 2, 3, 4, 0, 1)).toEqual([2, 4]);
  });
});

describe('K3 softmax', () => {
  it('sums to 1, shift invariant, gradient = (p − y)/T and sums to 0', () => {
    for (const T of TS) {
      const a = softmaxT([2, 1, 0], T, 0), b = softmaxT([4, 3, 2], T, 0);
      expect(a.p.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 12);
      a.p.forEach((q, i) => expect(q).toBeCloseTo(b.p[i]!, 12));
      expect(a.grad.reduce((x, y) => x + y, 0)).toBeCloseTo(0, 12);
      expect(a.grad[0]).toBeLessThan(0);
      expect(a.ce).toBeCloseTo(-Math.log(a.p[0]!), 12);
    }
  });
  it('gradient matches a numerical derivative of the cross-entropy', () => {
    const z = [0.5, -1, 2], T = 1.5, y = 1, e = 1e-6;
    const g = softmaxT(z, T, y).grad;
    z.forEach((_, i) => { const zp = [...z], zm = [...z]; zp[i]! += e; zm[i]! -= e; expect((softmaxT(zp, T, y).ce - softmaxT(zm, T, y).ce) / (2 * e)).toBeCloseTo(g[i]!, 6); });
  });
  it('T=4 is near uniform (entropy close to ln 3); T=0.25 is near one-hot', () => {
    expect(Math.log(3) - softmaxT([2, 1, 0], 4, 0).H).toBeLessThan(0.05);
    expect(softmaxT([2, 1, 0], 0.25, 0).p[0]).toBeGreaterThan(0.98);
  });
});

describe('K4 gradient descent on x²', () => {
  it('regimes switch at 0.5 and 1 = 2/a', () => {
    expect(regime(0.2)).toBe('mono'); expect(regime(0.5)).toBe('one'); expect(regime(0.8)).toBe('osc');
    expect(regime(1)).toBe('cycle'); expect(regime(1.05)).toBe('div');
    expect(regime(0.05 * 20)).toBe('cycle'); expect(regime(0.05 * 10)).toBe('one');
  });
  it('paths match the observations', () => {
    expect(gdPath(0.5)[1]).toBe(0);
    const c = gdPath(1); expect(c[1]).toBe(-3); expect(c[2]).toBe(3);
    const o = gdPath(0.8); expect(Math.sign(o[1]!)).toBe(-1); expect(Math.abs(o[12]!)).toBeLessThan(Math.abs(o[1]!));
    expect(Math.abs(gdPath(1.05)[12]!)).toBeGreaterThan(3);
    gdPath(0.35).forEach((x, k) => expect(x).toBeCloseTo(3 * 0.3 ** k, 12));
  });
});

describe('K5 gradient check', () => {
  it('backprop agrees with central differences to ~1e-8 over the whole slider grid', () => {
    let worst = 0;
    for (let i = -12; i <= 12; i++) for (let j = -12; j <= 12; j++) {
      const g = gradCheck(i / 4, j / 4);
      g.bp.forEach((b, k) => expect(Math.abs(b - g.num[k]!)).toBeLessThan(1e-8));
      worst = Math.max(worst, ...g.rel);
    }
    expect(worst).toBeLessThan(1e-6);
  });
  it('σ′ factor is 0.25 at w₁=0 and about 0.045 at ±3', () => {
    expect(gradCheck(0, 1).sp).toBe(0.25);
    expect(gradCheck(3, 1).sp).toBeCloseTo(0.0452, 4);
    expect(gradCheck(-3, 1).sp).toBeCloseTo(0.0452, 4);
  });
});

describe('brk (line-broken display math)', () => {
  it('splits at top-level relations only', () => {
    expect(brk(String.raw`a=\frac{b=c}{d}\le e`)).toBe(String.raw`\begin{aligned}a&=\frac{b=c}{d}\\&\le e\end{aligned}`);
    expect(brk(String.raw`\left(a=b\right)`)).toBeNull();
    expect(brk(String.raw`\begin{aligned}a&=b\end{aligned}`)).toBeNull();
  });
  it('splits at \\quad into gathered lines and puts the left side alone in fine mode', () => {
    expect(brk(String.raw`x=1\quad y=2`)).toBe(String.raw`\begin{gathered}\begin{aligned}x&=1\end{aligned}\\\begin{aligned}y&=2\end{aligned}\end{gathered}`);
    expect(brk(String.raw`L=a+b+c+d`, true)).toBe(String.raw`\begin{aligned}&L\\&\quad =a+b\\&\qquad +c+d\end{aligned}`);
  });
});
describe('brk keeps brackets whole', () => {
  it('never splits inside ( ) or [ ]', () => {
    expect(brk(String.raw`P(x=1)`)).toBeNull();
    expect(brk(String.raw`L=a^2b^2+c^2d^2-(ad-bc)^2`, true)).toBe(String.raw`\begin{aligned}&L\\&\quad =a^2b^2+c^2d^2\\&\qquad -(ad-bc)^2\end{aligned}`);
  });
});
