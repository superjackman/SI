import { describe, it, expect } from 'vitest';
import { NODES, LV, path, chain, kids, onLevel } from '../../src/w3/c/tree';
import { STATIONS, ZONES } from '../../src/w3/reg';
import * as R from '../../src/w3/rec';
import { qr } from '../../src/w3/share/qr';
/* R37: the knowledge tree, the learning record and the share card's QR code */
describe('knowledge tree', () => {
  it('maps every station onto one of six levels with a parent on the same or a higher level', () => {
    expect(LV).toHaveLength(6);
    expect(Object.keys(NODES).sort()).toEqual([...STATIONS].sort());
    for (const s of STATIONS) {
      const n = NODES[s]!; expect(n.lv).toBeGreaterThanOrEqual(0); expect(n.lv).toBeLessThan(6);
      if (s === 'T1') { expect(n.up).toBe(''); continue; }
      expect(NODES[n.up], s).toBeDefined(); expect(NODES[n.up]!.lv).toBeLessThanOrEqual(n.lv);
      expect(path(s)[0]).toBe('T1');
    }
  });
  it('"go deeper" never goes up and ends at the math from every zone', () => {
    for (const s of STATIONS) { const n = NODES[s]!; if (n.deep) expect(NODES[n.deep]!.lv, s).toBeGreaterThanOrEqual(n.lv); }
    for (const z of ZONES) { const c = chain(z.st[0]!); expect(NODES[c[c.length - 1]!]!.lv, z.id).toBe(5); }
    for (const s of STATIONS) expect(NODES[chain(s).at(-1)!]!.lv, s).toBe(5);
  });
  it('every level has stations, every text is two languages and short', () => {
    for (let l = 0; l < 6; l++) expect(onLevel(l, STATIONS).length).toBeGreaterThan(0);
    for (const n of Object.values(NODES)) for (const t of [n.co, n.why]) { expect(t[0]).not.toBe(t[1]); expect(t[0].length).toBeLessThanOrEqual(46); expect(t[1].length).toBeLessThanOrEqual(130); expect(/[?？]$/.test(t[0])).toBe(false); }
    expect(kids('T4').sort()).toEqual(['T4a', 'T4b', 'T5']);
  });
});
describe('learning record', () => {
  const t0 = new Date(2026, 9, 28, 10).getTime(), D = 864e5;
  it('status goes not started → seen → practised → mastered', () => {
    const r = R.empty(), d = new Set<string>();
    expect(R.status(r, 'T3', d)).toBe(0); R.seen(r, 'T3', t0); expect(R.status(r, 'T3', d)).toBe(1);
    R.answer(r, 'T3', 0, false, t0); expect(R.status(r, 'T3', d)).toBe(2); expect(r.mis).toEqual(['T3/0']);
    d.add('T3'); expect(R.status(r, 'T3', d)).toBe(3);
    R.answer(r, 'T3', 0, true, t0); R.answer(r, 'T3', 1, true, t0); expect(R.acc(r)).toEqual({ ok: 1, n: 2 }); expect(R.totals(r)).toEqual({ r: 2, w: 1 });
  });
  it('streak counts days in a row up to today or yesterday', () => {
    const r = R.empty(); R.seen(r, 'T1', t0 - 2 * D); R.seen(r, 'T1', t0 - D); expect(R.streak(r, t0)).toBe(2); R.lab(r, 'T1', t0); expect(R.streak(r, t0)).toBe(3);
    expect(R.streak(r, t0 + 3 * D)).toBe(0); expect(R.fix(null)).toEqual(R.empty()); expect(R.fix({ st: 3 })).toEqual(R.empty());
  });
});
describe('share QR code', () => {
  it('is a valid QR layout (size, finders, timing) for the deep link', () => {
    const m = qr('https://superjackman.github.io/SI/?lang=zh#T4a'), n = m.length;
    expect(n).toBe(33); expect(m.every((r) => r.length === n)).toBe(true);
    for (const [x, y] of [[0, 0], [n - 7, 0], [0, n - 7]] as [number, number][]) { expect(m[y]![x]).toBe(true); expect(m[y + 1]![x + 1]).toBe(false); expect(m[y + 3]![x + 3]).toBe(true); }
    for (let i = 8; i < n - 8; i++) { expect(m[6]![i]).toBe(i % 2 === 0); expect(m[i]![6]).toBe(i % 2 === 0); }
    expect(m[n - 8]![8]).toBe(true);
    expect(qr('x'.repeat(150)).length).toBe(49);
  });
});
