/* R34: the all-3D site — routes, the station content and the shell's pure helpers */
import { describe, it, expect } from 'vitest';
import { parseRoute, routeHash, ZONES, STATIONS, EMBLEM, zoneOf, nextSt } from '../../src/w3/reg';
import { content } from '../../src/w3/c';
import { LABS } from '../../src/w3/lab';
import { PROPS } from '../../src/w3/sc/kit';
import { pagesOf, kindOf, order, classicURL } from '../../src/w3/shell';
import { W } from '../../src/w3/text';

describe('R34 routes', () => {
  it('parses the hash forms', () => {
    expect(parseRoute('')).toEqual({ v: 'home' });
    expect(parseRoute('#map')).toEqual({ v: 'map' });
    expect(parseRoute('#welcome')).toEqual({ v: 'welcome' });
    expect(parseRoute('#z2/3')).toEqual({ v: 'zone', z: 2, i: 3 });
    expect(parseRoute('#T1')).toEqual({ v: 'st', s: 'T1', p: 0 });
    expect(parseRoute('#T4a/2')).toEqual({ v: 'st', s: 'T4a', p: 2 });
    expect(parseRoute('#T3/llm')).toEqual({ v: 'st', s: 'T3', p: 0 }); // the classic node form
    expect(parseRoute('#T2&lang=en')).toEqual({ v: 'st', s: 'T2', p: 0 });
    expect(parseRoute('#/K1')).toEqual({ v: 'st', s: 'K1', p: 0 });
    expect(parseRoute('#nope')).toEqual({ v: 'home' });
    expect(parseRoute('', '?w=3d&p=attn')).toEqual({ v: 'st', s: 'T4a', p: 2 });
  });
  it('round-trips every route', () => {
    for (const s of STATIONS) for (const p of [0, 2]) { const r = { v: 'st' as const, s, p }; expect(parseRoute(routeHash(r))).toEqual(r); }
    for (const z of ZONES) expect(parseRoute(routeHash({ v: 'zone', z: z.n, i: 1 }))).toEqual({ v: 'zone', z: z.n, i: 1 });
  });
  it('has 27 stations in 5 zones, each with an emblem, and nextSt wraps', () => {
    expect(STATIONS.length).toBe(27); expect(ZONES.length).toBe(5);
    expect(ZONES.flatMap((z) => z.st).sort()).toEqual([...STATIONS].sort());
    for (const s of STATIONS) { expect(PROPS).toContain(EMBLEM[s]); expect(zoneOf(s).st).toContain(s); }
    expect(nextSt(STATIONS[26]!)).toBe(STATIONS[0]);
  });
  it('classic links drop the 3D flags and keep the station', () => {
    expect(classicURL({ pathname: '/SI/', search: '?w=3d&lang=en' }, 'T1')).toBe('/SI/?lang=en&classic=1#T1');
    expect(classicURL({ pathname: '/SI/', search: '' }, 'H')).toBe('/SI/?classic=1');
  });
});

describe('R34 station content', () => {
  for (const s of STATIONS) it(`${s}: ideas, a known experiment, 2-3 questions, zh + en`, async () => {
    const c = await content(s);
    expect(c.ideas.length).toBeGreaterThanOrEqual(2);
    for (const i of c.ideas) {
      expect(i.say[0] && i.say[1]).toBeTruthy(); expect(i.say[0]).not.toBe(i.say[1]);
      expect(i.things.length).toBeGreaterThanOrEqual(1); expect(i.things.length).toBeLessThanOrEqual(3);
      for (const t of i.things) { expect(PROPS).toContain(t.p); for (const x of [t.n, t.s, t.w]) expect(x[0] && x[1]).toBeTruthy(); }
    }
    expect(Object.keys(LABS)).toContain(c.lab.k);
    expect(c.lab.say[0] && c.lab.say[1] && c.lab.why[0] && c.lab.why[1]).toBeTruthy();
    expect(c.quiz.length).toBeGreaterThanOrEqual(2); expect(c.quiz.length).toBeLessThanOrEqual(3);
    for (const q of c.quiz) {
      expect(q.o.length).toBeGreaterThanOrEqual(2); expect(q.o.length).toBeLessThanOrEqual(3);
      expect(q.a).toBeGreaterThanOrEqual(0); expect(q.a).toBeLessThan(q.o.length);
      expect(q.q[1] && q.hint[0] && q.hint[1]).toBeTruthy();
      for (const o of q.o) expect(o[0] && o[1]).toBeTruthy();
    }
    expect(c.done[0] && c.done[1]).toBeTruthy();
    expect(pagesOf(c)).toBe(c.ideas.length + 3);
    expect(kindOf(c, 0)).toBe('ideas'); expect(kindOf(c, c.ideas.length)).toBe('lab');
    expect(kindOf(c, c.ideas.length + 1)).toBe('quiz'); expect(kindOf(c, c.ideas.length + 2)).toBe('reward');
  });
});

describe('R34 shell helpers', () => {
  it('shuffles answer blocks as a permutation, and not always the same way', () => {
    const seen = new Set<string>();
    for (let s = 1; s < 40; s++) { const o = order(3, s); expect([...o].sort()).toEqual([0, 1, 2]); seen.add(o.join()); }
    expect(seen.size).toBeGreaterThan(2);
  });
  it('every shell word has zh and en', () => { for (const [k, v] of Object.entries(W)) { expect(v[0], k).toBeTruthy(); expect(v[1], k).toBeTruthy(); } });
});
