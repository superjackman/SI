import { afterEach, describe, expect, it } from 'vitest';
import { NAV_KEY, navBack, navInit, navNote, navPrev, navTo, pageOf } from '../../src/l4/hnav';

/* R46: in-site moves rewrite the history entry; the site's own back uses a per-tab stack */
describe('R46 in-site navigation without history entries', () => {
  let hits = 0; const on = () => { hits++; };
  afterEach(() => { sessionStorage.clear(); history.replaceState(null, '', '/'); removeEventListener('hashchange', on); hits = 0; });
  const follow = () => { addEventListener('hashchange', on); addEventListener('hashchange', () => navNote(window, location.hash)); };

  it('pageOf drops the card part', () => {
    expect(pageOf('#L4/tr/2~K05')).toBe('#L4/tr/2'); expect(pageOf('')).toBe('#home'); expect(pageOf('#')).toBe('#home');
  });
  it('navTo changes the hash, fires hashchange, and never grows history', () => {
    navInit(window, 'navigate'); addEventListener('hashchange', on);
    const n0 = history.length;
    expect(navTo(window, '#L1')).toBe(true); expect(navTo(window, '#L1/2')).toBe(true); expect(navTo(window, '#L1/2~KA01')).toBe(true);
    expect(location.hash).toBe('#L1/2~KA01'); expect(hits).toBe(3); expect(history.length).toBe(n0);
    expect(navTo(window, '#L1/2~KA01')).toBe(false); expect(hits).toBe(3);
  });
  it('navBack walks the visited pages, skips card-only moves, reopens the card that was open, then falls back', () => {
    navInit(window, 'navigate'); follow();
    navNote(window, '#home');
    navTo(window, '#L1'); navTo(window, '#L1/2'); navTo(window, '#L1/2~KA01'); navTo(window, '#L1/2'); navTo(window, '#L1/2~KA02'); navTo(window, '#S/KA02.p');
    expect(navPrev(window)).toBe('#L1/2~KA02');
    navBack(window, '#home'); expect(location.hash).toBe('#L1/2~KA02');
    navBack(window, '#home'); expect(location.hash).toBe('#L1');
    navBack(window, '#home'); expect(location.hash).toBe('#home');
    navBack(window, '#home'); expect(location.hash).toBe('#home');
    navTo(window, '#R'); navBack(window, '#home'); expect(location.hash).toBe('#home');
  });
  it('a deep link with no stack goes to the fallback; a fresh visit clears an old stack, a reload keeps it', () => {
    sessionStorage.setItem(NAV_KEY, JSON.stringify(['#L3']));
    navInit(window, 'reload'); expect(JSON.parse(sessionStorage.getItem(NAV_KEY)!)).toEqual(['#L3']);
    navInit(window, 'navigate'); expect(JSON.parse(sessionStorage.getItem(NAV_KEY)!)).toEqual([]);
    follow(); navNote(window, '#P/x1'); history.replaceState(null, '', '/#P/x1');
    navBack(window, '#home'); expect(location.hash).toBe('#home');
  });
});
