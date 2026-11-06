import { describe, expect, it } from 'vitest';
import { DV_KEY, dvI, isDv } from '../../src/dv/links';
import { ROUTES, routeNext, goalGet, goalSet } from '../../src/dv/routes';
import { CH } from '../../src/dv/ch';
import { QQ } from '../../src/vf/data';

describe('R52 routes + challenge', () => {
  it('five routes, every stop is a real station, in derivation order', () => {
    expect(ROUTES).toHaveLength(5);
    for (const r of ROUTES) {
      expect(r.st.length).toBeGreaterThan(3);
      const ix = r.st.map((k) => dvI(k));
      expect(ix.every((i) => i >= 0), r.id).toBe(true);
      for (let i = 1; i < ix.length; i++) expect(ix[i]!, r.id).toBeGreaterThan(ix[i - 1]!);
    }
  });
  it('routeNext prefers unmastered unread, then unmastered, then first', () => {
    const r = ROUTES[2]!; // derive
    expect(routeNext(r, new Set(), new Set())).toBe(String(r.st[0]));
    expect(routeNext(r, new Set([String(r.st[0])]), new Set([String(r.st[0])]))).toBe(String(r.st[1]));
    const all = new Set(r.st.map(String));
    expect(routeNext(r, all, all)).toBe(String(r.st[0]));
  });
  it('goal persists', () => {
    localStorage.clear();
    expect(goalGet()).toBeNull();
    goalSet('agent'); expect(goalGet()).toBe('agent');
  });
  it('D/routes and D/ch are dv routes; challenge questions exist', () => {
    expect(isDv('D/routes')).toBe(true);
    expect(isDv('D/ch')).toBe(true);
    expect(isDv('D/ch/2')).toBe(true);
    expect(isDv('D/ch/8a')).toBe(true);
    for (const [k, q] of Object.entries(CH)) {
      expect(DV_KEY.includes(k as never) || dvI(k) >= 0, k).toBe(true);
      expect(QQ[q], q).toBeTruthy();
    }
  });
});
