import { describe, expect, it } from 'vitest';
import { BPW, callCost, fitVerdict, KV_TOKEN_BYTES, kvGB, PRICES, weightsGB } from '../../src/m2/calc';

describe('R25 calculators', () => {
  const ds = PRICES.find((p) => p.id === 'dsf')!;
  it('API cost: deepseek-flash 1000 in + 500 out = 0.006 元', () => {
    expect(callCost(1000, 500, ds)).toBeCloseTo(0.006, 10);
  });
  it('cache hits only discount input', () => {
    // 1M input all from cache = 0.04, plus 0 output
    expect(callCost(1e6, 0, ds, 1)).toBeCloseTo(0.04, 10);
    expect(callCost(1e6, 1e6, ds, 0.5)).toBeCloseTo(1 + 0.02 + 8, 10);
  });
  it('no cache price → hit share ignored', () => {
    const q = PRICES.find((p) => p.id === 'qwen')!;
    expect(callCost(1e6, 0, q, 1)).toBeCloseTo(2, 10);
  });
  it('every preset has a price and an https link', () => {
    for (const p of PRICES) { expect(p.inP).toBeGreaterThan(0); expect(p.outP).toBeGreaterThan(p.inP); expect(p.url).toMatch(/^https:\/\//); }
  });
  it('weights: Llama-3.1-8B (8.03B) at Q4_K_M ≈ 4.58 GiB as in the llama.cpp table', () => {
    const gb = weightsGB(8.03, BPW.Q4_K_M);
    expect(gb).toBeCloseTo(4.913, 2);
    expect(gb * 1e9 / 2 ** 30).toBeCloseTo(4.58, 1);
    expect(weightsGB(8.03, BPW.F16) * 1e9 / 2 ** 30).toBeCloseTo(14.96, 1);
  });
  it('KV cache: Qwen3-8B 144 KiB per token; 32K tokens ≈ 4.83 GB', () => {
    expect(KV_TOKEN_BYTES).toBe(147456);
    expect(kvGB(32768)).toBeCloseTo(4.832, 2);
    expect(kvGB(4096)).toBeCloseTo(0.604, 2);
  });
  it('fit verdicts', () => {
    expect(fitVerdict(5, 16)).toBe('ok');
    expect(fitVerdict(14, 16)).toBe('tight');
    expect(fitVerdict(17, 16)).toBe('no');
  });
});
