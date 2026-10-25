/* R21: the onboarding rules — who counts as a first visitor, where "next" goes on each route, what the lab chip opens */
import { describe, it, expect } from 'vitest';
import { isFresh, nextStop, labsOf, ROUTE_S, welcomeKind, HSTEPS } from '../../src/onboard';
import fs from 'node:fs';
import { O, ROUTE, LABN } from '../../src/onboard/strings';
import { TABORDER } from '../../src/legacy/kb';

describe('isFresh', () => {
  it('a clean profile, or only the landing stop marked, is fresh', () => {
    expect(isFresh('T1', [], null, null, null)).toBe(true);
    expect(isFresh('T1', ['T1'], '{}', null, null)).toBe(true);
  });
  it('anything else is not', () => {
    expect(isFresh('T1', ['T2'], null, null, null)).toBe(false);
    expect(isFresh('T1', [], '{"T1":{"0":1}}', null, null)).toBe(false);
    expect(isFresh('T1', [], null, '1', null)).toBe(false);
    expect(isFresh('T1', [], null, null, '1')).toBe(false);
    expect(isFresh('T1', [], 'not json', null, null)).toBe(true);
  });
});

describe('nextStop', () => {
  const none = () => false;
  it('full route follows the tab order and ends at the last stop', () => {
    for (let i = 0; i < TABORDER.length - 1; i++) expect(nextStop(TABORDER[i]!, 'all', none)).toBe(TABORDER[i + 1]);
    expect(nextStop(TABORDER[TABORDER.length - 1]!, null, none)).toBeNull();
  });
  it('kids route keeps to its 6 stops', () => {
    expect(ROUTE_S).toEqual(['T1', 'T2', 'T3', 'T4a', 'T6', 'T7']);
    for (let i = 0; i < 5; i++) expect(nextStop(ROUTE_S[i]!, 'kid', none)).toBe(ROUTE_S[i + 1]);
    expect(nextStop('T7', 'kid', none)).toBeNull();
  });
  it('from off the route: the first route stop not lit yet', () => {
    expect(nextStop('K1', 'kid', (s) => s === 'T1' || s === 'T2')).toBe('T3');
    expect(nextStop('K1', 'kid', () => true)).toBe('T1');
  });
  it('every route stop is a real stop in the tab order, with a named lab', () => {
    for (const [S, lab] of ROUTE) { expect(TABORDER).toContain(S); expect(LABN[lab]?.zh).toBeTruthy(); expect(LABN[lab]?.en).toBeTruthy(); }
  });
});

describe('labsOf', () => {
  it('labs first, else the T1 demo, else none', () => {
    const d = document.createElement('div');
    d.innerHTML = '<div class="card" id="walkCard"></div>';
    expect(labsOf(d).map((e) => e.id)).toEqual(['walkCard']);
    d.innerHTML = '<div class="card lab" id="a"></div><div class="card lab" id="b"></div><div class="card" id="walkCard"></div>';
    expect(labsOf(d).map((e) => e.id)).toEqual(['a', 'b']);
    d.innerHTML = '<div class="card"></div>';
    expect(labsOf(d)).toEqual([]);
  });
});

describe('strings', () => {
  it('every string has zh and en; en has no Chinese', () => {
    for (const [k, v] of Object.entries(O)) { expect(v.zh, k).toBeTruthy(); expect(v.en, k).toBeTruthy(); expect(/[\u3400-\u9fff]/.test(v.en.replace(/<b>中<\/b>/g, '')), k).toBe(false); }
  });
});

describe('R27+ home page first visit', () => {
  it('a fresh visitor landing on H counts as fresh (H is never marked visited)', () => {
    expect(isFresh('H', [], null, null, null)).toBe(true);
    expect(isFresh('H', ['T2'], null, null, null)).toBe(false);
  });
  it('welcomeKind: home strip on H, R21 card on a stop, none for returning / dismissed / friend link / tour / later pages', () => {
    expect(welcomeKind('H', true, 'H', null, false, false)).toBe('home');
    expect(welcomeKind('T4a', true, 'T4a', null, false, false)).toBe('stop');
    expect(welcomeKind('H', false, 'H', null, false, false)).toBe(null);
    expect(welcomeKind('H', true, 'H', '1', false, false)).toBe(null);
    expect(welcomeKind('H', true, 'H', null, true, false)).toBe(null);
    expect(welcomeKind('H', true, 'H', null, false, true)).toBe(null);
    expect(welcomeKind('H', true, 'T1', null, false, false)).toBe(null);
  });
  it('the home coach marks cover what / where to start / doorways / header / bottom row, and point at real H parts', () => {
    expect(HSTEPS.map((s) => s[1])).toEqual(['h1', 'h2', 'h3', 'c1', 'c2', 'c3', 'h5']);
    for (const L of ['zh', 'en'] as const) {
      const h = JSON.parse(fs.readFileSync(`src/legacy/gen/st/H.${L}.json`, 'utf8')).html as string;
      for (const c of ['hm-t', 'hm-go', 'hm-door', 'dr-g', 'hm-s']) expect(h, c).toContain(c);
      expect(O.hwGo[L]).toContain(String(HSTEPS.length));
    }
  });
});
