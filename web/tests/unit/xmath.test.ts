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
