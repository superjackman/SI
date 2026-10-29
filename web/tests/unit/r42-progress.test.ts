import { describe, expect, it } from 'vitest';
import k from '../../src/l4/c/k-zh.json';
import k1 from '../../src/l4/c/k1-zh.json';
import k3 from '../../src/l4/c/k3-zh.json';
import { CARD_N, cardLayer, layerPages, layerStats, pageLayer, pageName } from '../../src/l4/progress';

describe('R42 progress', () => {
  it('card counts per layer match the card files', () => {
    const ids = [...Object.keys(k), ...Object.keys(k1), ...Object.keys(k3)].filter((x) => /^K[MABC]?\d\d$/.test(x));
    expect([1, 2, 3, 4, 5].map((n) => ids.filter((x) => cardLayer(x) === n).length)).toEqual([...CARD_N]);
  });
  it('layer page totals', () => {
    expect([1, 2, 3, 4, 5].map((n) => layerPages(n).length)).toEqual([7, 8, 13, 26, 22]);
    for (const n of [1, 2, 3, 4, 5]) for (const p of layerPages(n)) expect(pageLayer(p)).toBe(n);
  });
  it('stats and names', () => {
    const s = layerStats(['L1', 'L1-1', 'US5', 'X:att'], ['KA01', 'K05']);
    expect(s[0]).toMatchObject({ s: 2, t: 7, c: 1, ct: 6 }); expect(s[3]).toMatchObject({ s: 2, t: 26, c: 1 });
    expect(pageName('US5', 'zh')).toBe('⑤注意力'); expect(pageName('M2b', 'zh')).toBe('②对应相乘再相加'); expect(pageName('L4', 'zh')).toBe('全貌');
    for (const n of [1, 2, 3, 4, 5]) for (const p of layerPages(n)) { expect(pageName(p, 'zh')).not.toMatch(/^(X:|[A-Z]+\d)/); expect(pageName(p, 'en').length).toBeGreaterThan(1); }
  });
});
