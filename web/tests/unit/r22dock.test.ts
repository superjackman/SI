/* R22: the bottom bar's rules — which lab 🧪 opens, what ✨ shows, which part of the page 📑 marks "you are here",
   what the contents list is made of, and that every word is in both languages */
import { describe, it, expect } from 'vitest';
import { pickLab, progBadge, curIdx, tocItems } from '../../src/shell/dock';
import { D } from '../../src/shell/dock/strings';
import { ROUTE, O } from '../../src/onboard/strings';
import { ROUTE_S } from '../../src/onboard';
import { TABORDER } from '../../src/legacy/kb';
import { CODES } from '../../src/i18n/codes';

describe('🧪 pickLab', () => {
  it('kids’ route: the route lab even when the stop has several', () => {
    const [S, lab] = ROUTE[1]!;
    expect(pickLab(S, 'kid', ['x', lab, 'y'])).toEqual({ open: lab });
  });
  it('full route: one lab opens, several → a list, none → a plain message', () => {
    const [S, lab] = ROUTE[1]!;
    expect(pickLab(S, 'all', ['x', lab, 'y'])).toEqual({ list: true });
    expect(pickLab('T1', 'all', ['walkCard'])).toEqual({ open: 'walkCard' });
    expect(pickLab('T8', 'all', [])).toEqual({ none: true });
    expect(pickLab('T8', 'kid', [])).toEqual({ none: true });
  });
  it('kids’ route on a stop off the route behaves like the full route', () => {
    expect(pickLab('T5', 'kid', ['a', 'b'])).toEqual({ list: true });
  });
});

describe('✨ progBadge', () => {
  const lit = (xs: string[]) => (s: string) => xs.includes(s);
  it('full route: lit X / 22', () => {
    expect(progBadge(lit([]), 'all')).toMatchObject({ n: `0/${TABORDER.length}`, rt: false });
    expect(progBadge(lit(['T1', 'T2', 'K5']), 'all')).toMatchObject({ n: `3/${TABORDER.length}`, x: 3 });
  });
  it('kids’ route: k / 6 of the route stops only', () => {
    expect(progBadge(lit([ROUTE_S[0]!, ROUTE_S[1]!, 'K5']), 'kid')).toMatchObject({ n: `2/${ROUTE_S.length}`, rt: true, k: 2, x: 3 });
  });
});

describe('📑 curIdx', () => {
  it('marks the last part whose top has passed the line; hidden parts never count', () => {
    expect(curIdx([200, 900, 1600], 150)).toBe(0);
    expect(curIdx([-500, 100, 900], 150)).toBe(1);
    expect(curIdx([-900, null, -100, 400], 150)).toBe(2);
    expect(curIdx([], 150)).toBe(0);
  });
});

describe('📑 tocItems', () => {
  it('lists the plain opening, the diagram, every titled card (lab / quiz kind) and "where next", in page order', () => {
    const s = document.createElement('section');
    s.innerHTML = '<div class="pagehead"><h1>x</h1></div><div class="pl-top"><span class="pl-tag">🧒 先用大白话说</span></div>'
      + '<div class="m-stage"></div><div class="card" id="c_0"><h3>📖 One</h3></div><div class="card"></div>'
      + '<div class="card lab" id="lab1"><h3>🧪 Play</h3></div><div class="card quiz" id="quizT9"><h2>✅ Quiz</h2></div>'
      + '<nav class="m-hand"><b class="mh-t">🧭 接下来去哪</b></nav>';
    const it = tocItems(s, 'zh');
    expect(it.map((i) => [i.k, i.t])).toEqual([['pl', '🧒 先用大白话说'], ['dg', D.stage.zh], ['card', '📖 One'], ['lab', '🧪 Play'], ['quiz', '✅ Quiz'], ['hand', '🧭 接下来去哪']]);
  });
});

describe('words', () => {
  it('every bottom-bar word has zh and en, and en has no Chinese', () => {
    for (const [k, v] of Object.entries(D)) { expect(v.zh, k).toBeTruthy(); expect(v.en, k).toBeTruthy(); expect(/[\u4e00-\u9fff]/.test(v.en), k).toBe(false); }
    for (const k of ['toc', 'lab', 'quiz', 'prog', 'next'] as const) {
      const c = CODES[`dk.${k}` as keyof typeof CODES], a = CODES[`dk.${k}A` as keyof typeof CODES];
      expect(c.zh.length, k).toBeLessThanOrEqual(3); expect(c.en.length, k).toBeLessThanOrEqual(8); expect(a.en, k).toBeTruthy();
    }
    expect(O.c5.en).toContain('Contents');
  });
});
