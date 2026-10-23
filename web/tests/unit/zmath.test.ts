import { describe, expect, it } from 'vitest';
import { applyMerge, big, bpeEncode, BPE_CORPUS, CHIN, chinLoss, chinOpt, cleanWord, flops, isoLoss, learnBpe, pairCounts } from '../../src/m2/zmath';

describe('Chinchilla parametric loss (Hoffmann et al. 2022, appendix D.2 eq. 10)', () => {
  it('uses the published constants', () => expect(CHIN).toEqual({ E: 1.69, A: 406.4, B: 410.7, alpha: 0.34, beta: 0.28 }));
  it('L(N, D) = E + A/N^α + B/D^β exactly', () => {
    expect(chinLoss(70e9, 1.4e12)).toBeCloseTo(1.69 + 406.4 / 70e9 ** 0.34 + 410.7 / 1.4e12 ** 0.28, 12);
    expect(chinLoss(70e9, 1.4e12)).toBeCloseTo(1.93665, 4);
    expect(chinLoss(1, 1)).toBeCloseTo(1.69 + 406.4 + 410.7, 9);
    expect(() => chinLoss(0, 1)).toThrow();
  });
  it('closed-form exponents and G', () => {
    const o = chinOpt(1e21);
    expect(o.a).toBeCloseTo(0.28 / 0.62, 12); expect(o.b).toBeCloseTo(0.34 / 0.62, 12);
    expect(o.a + o.b).toBeCloseTo(1, 12);
    expect(o.G).toBeCloseTo(1.34471064277253, 10);
  });
  it('the optimum spends exactly the budget, C = 6ND', () => {
    for (const C of [1e19, 5.76e23, 1e26]) { const o = chinOpt(C); expect(flops(o.N, o.D) / C).toBeCloseTo(1, 10); }
  });
  it('known values (rounded constants): Gopher budget 5.76e23 → ≈32.19 B params, ≈2.982 T tokens, L ≈ 1.93075', () => {
    const o = chinOpt(5.76e23);
    expect(o.N / 1e9).toBeCloseTo(32.19, 1); expect(o.D / 1e12).toBeCloseTo(2.982, 2);
    expect(o.ratio).toBeCloseTo(92.6, 0); expect(o.L).toBeCloseTo(1.93075, 4);
    const p = chinOpt(1e21); expect(p.N / 1e9).toBeCloseTo(1.824, 2); expect(p.D / 1e9).toBeCloseTo(91.36, 1); expect(p.L).toBeCloseTo(2.32888, 4);
    const q = chinOpt(1e24); expect(q.N / 1e9).toBeCloseTo(41.30, 1); expect(q.L).toBeCloseTo(1.91120, 4);
  });
  it('the closed form is the minimum of the isoFLOP slice', () => {
    const C = 5.76e23, o = chinOpt(C);
    for (const f of [0.5, 0.9, 0.99, 1.01, 1.1, 2, 16]) expect(isoLoss(C, o.N * f)).toBeGreaterThan(o.L);
    expect(isoLoss(C, o.N)).toBeCloseTo(o.L, 12);
  });
  it('10× compute multiplies N by 10^a and D by 10^b', () => {
    const a = chinOpt(1e22), b = chinOpt(1e23);
    expect(b.N / a.N).toBeCloseTo(10 ** (0.28 / 0.62), 9); expect(b.D / a.D).toBeCloseTo(10 ** (0.34 / 0.62), 9);
    expect(10 ** (0.28 / 0.62)).toBeCloseTo(2.83, 2); expect(10 ** (0.34 / 0.62)).toBeCloseTo(3.53, 2);
  });
  it('formats big counts', () => {
    expect(big(chinOpt(5.76e23).N, 'en')).toBe('32.2 B'); expect(big(chinOpt(5.76e23).N, 'zh')).toBe('322 亿');
    expect(big(chinOpt(5.76e23).D, 'en')).toBe('2.98 T'); expect(big(chinOpt(5.76e23).D, 'zh')).toBe('2.98 万亿');
    expect(big(1.5e6, 'en')).toBe('1.5 M'); expect(big(15000, 'zh')).toBe('1.5 万'); expect(big(12, 'en')).toBe('12');
  });
});

describe('BPE (Sennrich et al. 2016, Algorithm 1)', () => {
  it('corpus is the paper’s', () => expect(BPE_CORPUS).toEqual([['low', 5], ['lower', 2], ['newest', 6], ['widest', 3]]));
  it('learns exactly the merges of the reference code, in order', () => {
    const R = learnBpe(10);
    expect(R.merges.map((p) => p.join('+'))).toEqual(['e+s', 'es+t', 'est+_', 'l+o', 'lo+w', 'n+e', 'ne+w', 'new+est_', 'low+_', 'w+i']);
    expect(R.steps.slice(0, 10).map((s) => s.counts.find((c) => c[0][0] === s.best![0] && c[0][1] === s.best![1])![1])).toEqual([9, 9, 9, 7, 7, 6, 6, 6, 5, 3]);
    expect(R.words.map(([s, f]) => [s.join(' '), f])).toEqual([['low_', 5], ['low e r _', 2], ['newest_', 6], ['wi d est_', 3]]);
    expect(R.steps[10]!.best).toBeNull();
  });
  it('base vocabulary in first-seen order, growing by one per merge', () => {
    const R = learnBpe(10);
    expect(R.base).toEqual(['l', 'o', 'w', '_', 'e', 'r', 'n', 's', 't', 'i', 'd']);
    expect(R.vocab.length).toBe(21);
    expect(R.vocab.slice(11)).toEqual(['es', 'est', 'est_', 'lo', 'low', 'ne', 'new', 'newest_', 'low_', 'wi']);
  });
  it('initial pair counts (step 0)', () => {
    const c = Object.fromEntries(learnBpe(0).steps[0]!.counts.map(([p, n]) => [p.join('+'), n]));
    expect(c).toEqual({ 'l+o': 7, 'o+w': 7, 'w+_': 5, 'w+e': 8, 'e+r': 2, 'r+_': 2, 'n+e': 6, 'e+w': 6, 'e+s': 9, 's+t': 9, 't+_': 9, 'w+i': 3, 'i+d': 3, 'd+e': 3 });
  });
  it('ties go to the first-seen pair', () => {
    expect(learnBpe(1, [['ab', 1], ['cd', 1]]).merges).toEqual([['a', 'b']]);
    expect(learnBpe(1, [['cd', 1], ['ab', 1]]).merges).toEqual([['c', 'd']]);
  });
  it('merges are non-overlapping, left to right', () => {
    expect(applyMerge(['a', 'a', 'a'], ['a', 'a'])).toEqual(['aa', 'a']);
    expect(pairCounts([[['a', 'a', 'a'], 2]])).toEqual([[['a', 'a'], 4]]);
  });
  it('encodes new words with the learned merges', () => {
    const m = learnBpe(10).merges;
    expect(bpeEncode('lowest', m)).toEqual(['low', 'est_']);
    expect(bpeEncode('newer', m)).toEqual(['new', 'e', 'r', '_']);
    expect(bpeEncode('lowest', m.slice(0, 3))).toEqual(['l', 'o', 'w', 'est_']);
    expect(bpeEncode('lowest', [])).toEqual(['l', 'o', 'w', 'e', 's', 't', '_']);
    expect(bpeEncode('quiz', m)).toEqual(['q', 'u', 'i', 'z', '_']);
  });
  it('cleans typed input', () => { expect(cleanWord(' Low-est! ')).toBe('lowest'); expect(cleanWord('a'.repeat(30)).length).toBe(16); expect(cleanWord('词')).toBe(''); });
});
