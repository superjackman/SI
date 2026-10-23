/* R19: source tags on every shared link (from=<channel>), the landing read + strip, the router ignoring from=,
   the one-line takeaways for the share card, and the card's line breaking. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { shareURL, withFrom, FROM_OK } from '../../src/share/url';
import { landing } from '../../src/analytics';
import { parseHash, navURL } from '../../src/router/hash';
import { TAKEAWAY } from '../../src/share/takeaway';
import { tokens, wrap, wrapURL } from '../../src/share/card';
import { TABORDER } from '../../src/legacy/kb';

const O = 'https://superjackman.github.io/SI/';
const loc = (search: string, hash: string) => ({ origin: 'https://superjackman.github.io', pathname: '/SI/', search, hash });

describe('withFrom', () => {
  it('puts from=<tag> in the query, before the hash; keeps ?lang and other params', () => {
    expect(withFrom(O + '?lang=zh#T4', 'wechat')).toBe(O + '?lang=zh&from=wechat#T4');
    expect(withFrom(O + '?utm=x&lang=en#T5/labGradCheck', 'copy')).toBe(O + '?utm=x&lang=en&from=copy#T5/labGradCheck');
    expect(withFrom(O, 'card')).toBe(O + '?from=card');
  });
  it('replaces an earlier from=, lower-cases, ignores invalid tags', () => {
    expect(withFrom(O + '?from=weibo&lang=zh#T1', 'X')).toBe(O + '?lang=zh&from=x#T1');
    expect(withFrom(O + '?lang=zh#T1', 'a b')).toBe(O + '?lang=zh#T1');
    expect(withFrom(O + '?lang=zh#T1', '')).toBe(O + '?lang=zh#T1');
    expect(FROM_OK.test('v2ex')).toBe(true); expect(FROM_OK.test('-x')).toBe(false); expect(FROM_OK.test('x'.repeat(25))).toBe(false);
  });
  it('shareURL drops an incoming from= (a re-share gets its own tag), keeps v/_r dropping', () => {
    expect(shareURL(loc('?from=zhihu&v=1&lang=en', '#T3'), 'en', { station: 'T3' })).toBe(O + '?lang=en#T3');
    expect(withFrom(shareURL(loc('?from=zhihu', '#T3'), 'zh', { station: 'T3' }), 'qq')).toBe(O + '?lang=zh&from=qq#T3');
  });
});

describe('landing(): source tag on arrival', () => {
  const L = (search: string, hash: string) => landing({ pathname: '/SI/', search, hash });
  it('reads ?from= (manual tags too) and strips only that token', () => {
    for (const t of ['zhihu', 'xhs', 'v2ex', 'bilibili', 'wechat', 'card', 'copy']) expect(L(`?from=${t}`, '#T3')).toEqual({ from: t, clean: '/SI/#T3' });
    expect(L('?lang=en&from=Weibo&v=abc', '#K1')).toEqual({ from: 'weibo', clean: '/SI/?lang=en&v=abc#K1' });
    expect(L('?from=card&lang=zh', '#T5/labGradCheck')).toEqual({ from: 'card', clean: '/SI/?lang=zh#T5/labGradCheck' });
  });
  it('reads a from= in the hash (hand-typed links) and keeps the route', () => {
    expect(L('', '#T3&from=xhs')).toEqual({ from: 'xhs', clean: '/SI/#T3' });
    expect(L('', '#from=v2ex&T5')).toEqual({ from: 'v2ex', clean: '/SI/#T5' });
    expect(L('?lang=en', '#from=zhihu')).toEqual({ from: 'zhihu', clean: '/SI/?lang=en' });
    expect(L('', '#T3?from=zhihu')).toEqual({ from: 'zhihu', clean: '/SI/#T3' });
  });
  it('invalid tags are not recorded but still stripped; no tag → nothing to do', () => {
    expect(L('?from=%3Cscript%3E', '#T1')).toEqual({ from: null, clean: '/SI/#T1' });
    expect(L('?from=', '#T1')).toEqual({ from: null, clean: '/SI/#T1' });
    expect(L('?lang=zh', '#T1')).toEqual({ from: null, clean: null });
    expect(L('?platform=x', '#T1').from).toBeNull();
  });
});

describe('router ignores from=', () => {
  it('#T3&from=x routes to T3; #from=x&T3 too; lang= still skipped', () => {
    expect(parseHash('#T3&from=x').station).toBe('T3');
    expect(parseHash('#from=x&T3').station).toBe('T3');
    expect(parseHash('#lang=en&from=x&T4a').station).toBe('T4a');
    expect(parseHash('#T3?from=zhihu').station).toBe('T3');
  });
  it('navURL: a from= in the hash moves into the query (before #) instead of being dropped by the route rewrite', () => {
    const N = (search: string, hash: string, S = 'T3') => navURL({ pathname: '/SI/', search, hash }, S, 'zh');
    expect(N('', '#T3?from=zhihu')).toBe('/SI/?from=zhihu#T3');
    expect(N('?lang=zh', '#T3&from=xhs')).toBe('/SI/?lang=zh&from=xhs#T3');
    expect(N('', '#from=v2ex&T2', 'T2')).toBe('/SI/?from=v2ex#T2');
    expect(N('?lang=zh&from=bilibili', '#T3')).toBe('#T3'); // already before the hash: plain route rewrite
    expect(N('?from=a', '#T3?from=b')).toBe('#T3'); // the query tag wins
    expect(N('', '#T4', 'T4')).toBe('#T4');
    expect(N('', '#T4&lang=en', 'T5')).toBe('#T5&lang=zh');
  });
});

describe('count(): the first page view carries the tag as a campaign, plus evt-from-<tag> once', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); history.replaceState(null, '', '/'); });
  it('?from=bilibili → q=?campaign=bilibili&ref=bilibili on the first hit, evt-from-bilibili once, address bar cleaned', async () => {
    const srcs: string[] = [];
    vi.stubGlobal('Image', class { onload: unknown; onerror: unknown; set src(v: string) { srcs.push(v); } });
    history.replaceState(null, '', '/SI/?lang=en&from=bilibili#T3');
    vi.resetModules();
    const a = await import('../../src/analytics');
    expect(location.pathname + location.search + location.hash).toBe('/SI/?lang=en#T3');
    a.count('en', 'T3', 'Tokens'); a.count('en', 'T4', 'Attention');
    expect(srcs.length).toBe(3);
    const u0 = new URL(srcs[0]!), u1 = new URL(srcs[1]!), u2 = new URL(srcs[2]!);
    expect(u0.searchParams.get('p')).toBe('/en/T3');
    expect(u0.searchParams.get('q')).toBe('?campaign=bilibili&ref=bilibili');
    expect(u1.searchParams.get('p')).toBe('evt-from-bilibili');
    expect(u2.searchParams.get('p')).toBe('/en/T4'); expect(u2.searchParams.get('q')).toBeNull();
  });
  it('no tag → no q, no from event', async () => {
    const srcs: string[] = [];
    vi.stubGlobal('Image', class { onload: unknown; onerror: unknown; set src(v: string) { srcs.push(v); } });
    history.replaceState(null, '', '/SI/?lang=zh#T1');
    vi.resetModules();
    const a = await import('../../src/analytics');
    a.count('zh', 'T1', 'x');
    expect(srcs.length).toBe(1); expect(new URL(srcs[0]!).searchParams.get('q')).toBeNull();
  });
});

describe('share-card takeaways', () => {
  it('one plain line for every stop, zh and en', () => {
    for (const S of TABORDER) {
      const t = TAKEAWAY[S]; expect(t, S).toBeTruthy();
      expect(t!.zh.length, S).toBeGreaterThan(8); expect(t!.zh.length, S).toBeLessThanOrEqual(60);
      expect(t!.en.length, S).toBeGreaterThan(20); expect(t!.en.length, S).toBeLessThanOrEqual(170);
      expect(/[\u4e00-\u9fff]/.test(t!.zh), S).toBe(true); expect(/[\u4e00-\u9fff]/.test(t!.en), S).toBe(false);
      expect(/[$\\]/.test(t!.zh + t!.en), S).toBe(false); // no TeX on a picture
    }
    expect(Object.keys(TAKEAWAY).sort()).toEqual([...TABORDER].sort());
  });
});

describe('card line breaking', () => {
  const g = { measureText: (s: string) => ({ width: [...s].reduce((w, c) => w + (/[\u3000-\u9fff\uff00-\uffef]/.test(c) ? 10 : 6), 0) }) } as unknown as Pick<CanvasRenderingContext2D, 'measureText'>;
  it('CJK: closing punctuation never starts a line, opening never ends one', () => {
    const ls = wrap(g, '你对 AI 说一句话，背后有六层像餐厅一样接力干活：有人点菜、有人安排。', 100);
    for (const l of ls) { expect(/^[，。、：；！？）」』]/.test(l), l).toBe(false); expect(/[（「『]$/.test(l), l).toBe(false); }
    expect(ls.join('').replace(/\s/g, '')).toBe('你对AI说一句话，背后有六层像餐厅一样接力干活：有人点菜、有人安排。');
  });
  it('Latin: breaks between words, and only splits a word longer than the line', () => {
    const ls = wrap(g, 'Each word goes back to its desk to think', 60);
    for (const l of ls) expect(g.measureText(l).width).toBeLessThanOrEqual(60);
    expect(ls.join(' ')).toBe('Each word goes back to its desk to think');
    const long = wrap(g, 'Supercalifragilistic', 60);
    expect(long.length).toBeGreaterThan(1); expect(long.join('')).toBe('Supercalifragilistic');
    expect(tokens('a b').length).toBeGreaterThan(0);
  });
  it('URL: wraps after / ? & # = where possible and loses nothing', () => {
    const u = 'https://superjackman.github.io/SI/?lang=en&from=card#K3';
    const ls = wrapURL(g, u, 120);
    expect(ls.join('')).toBe(u);
    for (const l of ls) expect(g.measureText(l).width).toBeLessThanOrEqual(120);
    expect(ls.slice(0, -1).every((l) => /[/?&#=.]$/.test(l) || l.length >= 18)).toBe(true);
  });
});
