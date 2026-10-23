import { describe, expect, it } from 'vitest';
import { majority } from '../../src/m2/xmath';

describe('majority vote (labVote)', () => {
  it('matches hand-computed values', () => {
    expect(majority(0.6, 1)).toBeCloseTo(0.6, 12);
    expect(majority(0.6, 3)).toBeCloseTo(0.648, 12); // 3·0.36·0.4 + 0.216
    expect(majority(0.7, 5)).toBeCloseTo(0.83692, 12);
  });
  it('p = 0.5 stays at 0.5 for any odd N', () => { for (const N of [1, 3, 5, 9, 31]) expect(majority(0.5, N)).toBeCloseTo(0.5, 12); });
  it('is monotone in N: up for p > 0.5, down for p < 0.5', () => {
    for (let N = 1; N < 31; N += 2) {
      expect(majority(0.6, N + 2)).toBeGreaterThan(majority(0.6, N));
      expect(majority(0.4, N + 2)).toBeLessThan(majority(0.4, N));
    }
  });
  it('is symmetric: P(p) + P(1−p) = 1', () => { for (const p of [0.05, 0.3, 0.55, 0.95]) expect(majority(p, 7) + majority(1 - p, 7)).toBeCloseTo(1, 12); });
  it('rejects even N', () => { expect(() => majority(0.6, 4)).toThrow(); });
});

import { changed, maxPool, POOL_MAP, shiftRight } from '../../src/m2/xmath';
describe('max pooling (labPool)', () => {
  it('2×2 stride 2 keeps the window maxima and records where they came from', () => {
    const m = [[1, 5, 0, 2], [3, 4, 7, 1], [0, 0, 1, 1], [9, 0, 1, 2]];
    const { out, sw } = maxPool(m, 2, 2);
    expect(out).toEqual([[5, 7], [9, 2]]);
    expect(sw).toEqual([[1, 6], [12, 15]]);
  });
  it('output size follows floor((H − k) / s) + 1 and bad sizes throw', () => {
    expect(maxPool(POOL_MAP, 2, 2).out.length).toBe(4);
    expect(maxPool(POOL_MAP, 3, 2).out.length).toBe(3);
    expect(() => maxPool(POOL_MAP, 9, 2)).toThrow();
  });
  it('the lab numbers: shift 1 changes 18/64 input cells but 2/16 pooled; shift 2 moves the pooled map by one cell', () => {
    const base = maxPool(POOL_MAP, 2, 2).out;
    expect(changed(POOL_MAP, shiftRight(POOL_MAP, 1)) * 64).toBe(18);
    expect(changed(base, maxPool(shiftRight(POOL_MAP, 1), 2, 2).out) * 16).toBe(2);
    expect(maxPool(shiftRight(POOL_MAP, 2), 2, 2).out).toEqual(shiftRight(base, 1));
    expect(changed(base, base)).toBe(0);
  });
});
