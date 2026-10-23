/* R11 labs: exact values for the pure maths behind labBeam, labPpl, labRope, labLora, labDpo, labPassK, labSched */
import { describe, expect, it } from 'vitest';
import { allPaths, beam, BEAM_TREE, clipNorm, dpo, loraParams, lrAt, nll, passAtK, passNaive, ppl, rope, ropeScore, ropeThetas } from '../../src/m2/ymath';

describe('beam search', () => {
  const T = BEAM_TREE.en;
  it('greedy (width 1) takes the locally best word and ends at 0.5 × 0.4 = 0.2', () => {
    const r = beam(T, 1);
    expect(r.best.tokens).toEqual(['cat', 'runs']);
    expect(r.best.p).toBeCloseTo(0.2, 12);
  });
  it('width 2 keeps cat and dog and finds dog barks = 0.4 × 0.9 = 0.36', () => {
    const r = beam(T, 2);
    expect(r.kept1.map((b) => b.tokens[0])).toEqual(['cat', 'dog']);
    expect(r.cands).toHaveLength(6);
    expect(r.kept2.map((b) => b.tokens.join(' '))).toEqual(['dog barks', 'cat runs']);
    expect(r.best.p).toBeCloseTo(0.36, 12);
  });
  it('width 3 equals exhaustive search here; zh tree has the same numbers', () => {
    expect(beam(T, 3).best.tokens).toEqual(['dog', 'barks']);
    expect(allPaths(T)).toHaveLength(9);
    expect(allPaths(T).reduce((a, b) => a + b.p, 0)).toBeCloseTo(1, 12);
    expect(beam(BEAM_TREE.zh, 1).best.p).toBeCloseTo(0.2, 12);
    expect(beam(BEAM_TREE.zh, 2).best.tokens).toEqual(['狗', '叫']);
    expect(() => beam(T, 0)).toThrow();
  });
});
describe('perplexity', () => {
  it('is exp of the mean negative log probability', () => {
    expect(ppl([0.5, 0.5, 0.5, 0.5])).toBeCloseTo(2, 12);
    expect(ppl([0.25, 1])).toBeCloseTo(2, 12);
    expect(nll([1, 1])).toBe(0);
    expect(ppl([0.9, 0.6, 0.3, 0.8])).toBeCloseTo(Math.exp(-(Math.log(0.9) + Math.log(0.6) + Math.log(0.3) + Math.log(0.8)) / 4), 12);
  });
  it('a uniform guess over V words gives perplexity V', () => { for (const V of [2, 10, 50000]) expect(ppl(Array(5).fill(1 / V))).toBeCloseTo(V, 6); });
  it('rejects p outside (0, 1]', () => { expect(() => nll([0])).toThrow(); expect(() => nll([])).toThrow(); });
});
describe('RoPE', () => {
  const th = ropeThetas(4);
  it('θ_i = 10000^(−2i/d)', () => { expect(th[0]).toBe(1); expect(th[1]).toBeCloseTo(0.01, 15); expect(ropeThetas(8)[1]).toBeCloseTo(0.1, 15); });
  it('rotation keeps length and at position 0 changes nothing', () => {
    const x = [1, 0.5, 0.8, -0.2];
    expect(rope(x, 0, th)).toEqual(x);
    expect(Math.hypot(...rope(x, 7, th))).toBeCloseTo(Math.hypot(...x), 12);
  });
  it('score depends only on m − n', () => {
    const q = [1, 0.5, 0.8, -0.2], k = [0.6, 0.9, -0.3, 0.7];
    for (const [m, n, s] of [[5, 2, 3], [0, 4, 10], [9, 9, 1]] as const) expect(ropeScore(q, k, m + s, n + s, th)).toBeCloseTo(ropeScore(q, k, m, n, th), 12);
    expect(ropeScore(q, k, 3, 3, th)).toBeCloseTo(q.reduce((a, x, i) => a + x * k[i]!, 0), 12);
    expect(ropeScore([1, 0], [1, 0], 3, 1, [1])).toBeCloseTo(Math.cos(2), 12);
  });
});
describe('LoRA', () => {
  it('r(d + k) instead of d·k', () => {
    expect(loraParams(4096, 4096, 8)).toEqual({ full: 16777216, lora: 65536, pct: 0.390625 });
    expect(loraParams(1024, 4096, 1).lora).toBe(5120);
  });
});
describe('DPO', () => {
  it('equal log-ratio change gives loss ln 2 and weight 1/2', () => { const r = dpo(0.7, 0.7, 0.1); expect(r.loss).toBeCloseTo(Math.LN2, 12); expect(r.weight).toBe(0.5); });
  it('margin β(dw − dl); loss = log(1 + e^(−margin))', () => {
    const r = dpo(1, -1, 0.5);
    expect(r.margin).toBe(1); expect(r.rw).toBe(0.5); expect(r.rl).toBe(-0.5);
    expect(r.loss).toBeCloseTo(Math.log(1 + Math.exp(-1)), 12);
    expect(r.weight).toBeCloseTo(1 / (1 + Math.E), 12);
    expect(dpo(-2, 2, 1).loss).toBeCloseTo(Math.log(1 + Math.exp(4)), 12);
  });
});
describe('pass@k', () => {
  it('matches 1 − C(n−c,k)/C(n,k)', () => {
    expect(passAtK(10, 1, 1)).toBeCloseTo(0.1, 12);
    expect(passAtK(10, 1, 5)).toBeCloseTo(0.5, 12);
    expect(passAtK(10, 2, 5)).toBeCloseTo(1 - 56 / 252, 12);
    expect(passAtK(5, 3, 3)).toBe(1);
    expect(passAtK(10, 0, 3)).toBe(0);
    expect(passAtK(200, 20, 1)).toBeCloseTo(0.1, 12);
  });
  it('the naive plug-in differs', () => { expect(passNaive(10, 2, 5)).toBeCloseTo(0.67232, 12); expect(() => passAtK(5, 6, 1)).toThrow(); });
});
describe('warmup + cosine, clipping', () => {
  it('ramps linearly, peaks at W, halfway at the middle, min at T', () => {
    expect(lrAt(0, 1000, 100, 3e-4, 3e-5)).toBe(0);
    expect(lrAt(50, 1000, 100, 3e-4, 3e-5)).toBeCloseTo(1.5e-4, 15);
    expect(lrAt(100, 1000, 100, 3e-4, 3e-5)).toBeCloseTo(3e-4, 15);
    expect(lrAt(550, 1000, 100, 3e-4, 3e-5)).toBeCloseTo(1.65e-4, 15);
    expect(lrAt(1000, 1000, 100, 3e-4, 3e-5)).toBeCloseTo(3e-5, 15);
    expect(lrAt(10, 100, 0, 1, 0)).toBeCloseTo(0.5 * (1 + Math.cos(Math.PI * 0.1)), 12);
  });
  it('clips the L2 norm and keeps the direction', () => {
    const r = clipNorm([3, 4], 1);
    expect(r.norm).toBe(5); expect(r.scale).toBe(0.2); expect(r.g[0]).toBeCloseTo(0.6, 12); expect(r.g[1]).toBeCloseTo(0.8, 12);
    expect(clipNorm([3, 4], 10).g).toEqual([3, 4]);
  });
});
