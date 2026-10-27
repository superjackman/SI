import { describe, expect, it } from 'vitest';
import { ATT, DOORS, PEDS, UI, ORDER, attnSay, dotInfo, key, nextOf } from '../../src/pilot3d/text';
import { classicURL, readState, stateURL } from '../../src/pilot3d/boot';

describe('R33 pilot: texts', () => {
  it('has the 6 doors and 5 pedestals in zh and en', () => {
    expect(DOORS.map((d) => d.id)).toHaveLength(6);
    expect(PEDS).toHaveLength(5);
    for (const it of [...DOORS, ...PEDS]) for (const f of ['name', 'say', 'why'] as const) { expect(it[f].zh.trim()).not.toBe(''); expect(it[f].en.trim()).not.toBe(''); }
    for (const v of Object.values(UI)) { expect(v.zh).not.toBe(''); expect(v.en).not.toBe(''); }
  });
  it('the T1 door goes deeper into the pilot, the attention pedestal to the attention page', () => {
    expect(DOORS.some((d) => d.deeper === 'p3d:zone')).toBe(true);
    expect(PEDS.some((d) => d.deeper === 'p3d:attn')).toBe(true);
  });
  it('dotInfo: the shadow times the length, the angle, the sign', () => {
    const a = dotInfo(3, 0, 0, 2); expect(a.dot).toBe(0); expect(a.deg).toBe(90);
    const b = dotInfo(3, 0, 2, 0); expect(b.dot).toBe(6); expect(b.deg).toBe(0); expect(b.shadow).toBeCloseTo(2);
    const c = dotInfo(3, 0, -1, 1); expect(c.dot).toBe(-3); expect(c.deg).toBe(135); expect(c.sign).toBeLessThan(0);
  });
  it('next walks every page once and wraps', () => {
    const seen = new Set<string>(); let s = ORDER[0]!;
    for (let k = 0; k < ORDER.length; k++) { seen.add(key(s.p, s.i)); s = nextOf(s.p, s.i); }
    expect(seen.size).toBe(9); expect(seen.has('attn')).toBe(true); expect(s).toEqual(ORDER[0]);
  });
});
describe('R33 pilot: addresses', () => {
  const loc = { pathname: '/SI/next/', search: '?lang=en&w=3d&p=zone&i=3', hash: '' };
  it('reads and clamps the page', () => {
    expect(readState(loc.search)).toEqual({ p: 'zone', i: 3 });
    expect(readState('?w=3d&p=zone&i=9')).toEqual({ p: 'zone', i: 5 });
    expect(readState('?w=3d&p=nope')).toEqual({ p: 'home', i: 0 });
  });
  it('writes the page back and keeps the language', () => {
    expect(stateURL(loc, { p: 'dot', i: 0 })).toBe('/SI/next/?lang=en&w=3d&p=dot');
    expect(stateURL(loc, { p: 'home', i: 0 })).toBe('/SI/next/?lang=en&w=3d');
  });
  it('the classic stop drops the pilot flags', () => {
    expect(classicURL(loc, 'T3')).toBe('/SI/next/?lang=en#T3');
    expect(classicURL({ pathname: '/SI/next/', search: '?w=3d' }, 'H')).toBe('/SI/next/');
  });
});
describe('R33 pilot v4: real 3D scenes (no painted stage)', () => {
  it('v3 attention: four words, a square score table, the strongest look named in both languages', () => {
    for (const l of ['zh', 'en'] as const) expect(ATT.words[l]).toHaveLength(4);
    expect(ATT.score).toHaveLength(4);
    ATT.score.forEach((r, k) => { expect(r).toHaveLength(4); expect(r[k]).toBe(0); for (const v of r) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); } });
    expect(ATT.score[ATT.start]).toEqual([34, 92, 0, 78]); // the reference chips: 92% / 78% / 34%
    expect(attnSay(2, 'en')).toContain('love'); expect(attnSay(2, 'zh')).toContain('爱');
  });
  it('v4 attention: the word blocks sit side by side, centred, and each arc runs from one block top to another', async () => {
    const { blocks, arc } = await import('../../src/three3d/p3/attn');
    for (const l of ['zh', 'en'] as const) {
      const B = blocks(ATT.words[l]); expect(B).toHaveLength(4);
      for (let k = 1; k < 4; k++) expect(B[k]!.x - B[k]!.w / 2).toBeGreaterThan(B[k - 1]!.x + B[k - 1]!.w / 2 + 0.05);
      expect(B[0]!.x - B[0]!.w / 2 + (B[3]!.x + B[3]!.w / 2)).toBeCloseTo(0);
      for (const b of B) { expect(b.w).toBeGreaterThanOrEqual(0.56); expect(b.w).toBeLessThanOrEqual(1); }
      const c = arc(B, 0, 3), p0 = c.getPoint(0), p1 = c.getPoint(1), m = c.getPoint(0.5);
      expect(p0.x).toBeCloseTo(B[0]!.x); expect(p1.x).toBeCloseTo(B[3]!.x); expect(m.y).toBeGreaterThan(p0.y + 0.3);
      expect(arc(B, 0, 3).getPoint(0.5).y).toBeGreaterThan(arc(B, 0, 1).getPoint(0.5).y); // a longer reach rises higher
    }
  });
  it('v4 dot: the pink arrow starts within the slider range and on the other side of the lavender one', async () => {
    const { AV, B0, LEN } = await import('../../src/three3d/p3/dot');
    expect(B0.len).toBeGreaterThanOrEqual(LEN.min); expect(B0.len).toBeLessThanOrEqual(LEN.max);
    expect(AV.deg).toBeGreaterThan(90); expect(B0.deg).toBeLessThan(90);
  });
});
