import type { Lang } from './types';
/* Port of build/mobile/i18n/lang.js — same rules, same storage key, so old links and saved choices keep working.
   Priority: ?lang= / #lang= in the URL > saved (localStorage aiexp.lang) > navigator.language.
   A URL language is NOT saved; a manual switch saves it and rewrites the URL lang with history.replaceState. */
export const STORAGE_KEY = 'aiexp.lang';
const TOK = /(^|[?&#;/!])lang=([^&#;?/]*)/i;
const TOKG = /(^|[?&#;/!])lang=[^&#;?/]*/gi;

export function norm(v: string | null | undefined): Lang | null {
  if (v == null) return null;
  let s = String(v).replace(/\+/g, ' ');
  try { s = decodeURIComponent(s); } catch { /* keep raw */ }
  s = s.trim().toLowerCase().replace(/_/g, '-');
  if (/^(en|eng|english)(-[a-z0-9]+)*$/.test(s)) return 'en';
  if (/^(zh|zho|chi|cn|chs|cht|chinese)(-[a-z0-9]+)*$/.test(s) || /^(中文|简体中文|繁體中文|汉语|漢語)$/.test(s)) return 'zh';
  return null;
}
export function find(s: string | null | undefined): Lang | null {
  const m = TOK.exec(s || '');
  return m ? norm(m[2]) : null;
}
export interface LocLike { search: string; hash: string; pathname: string }
export const fromURL = (loc: LocLike): Lang | null => find(loc.search) || find(loc.hash);

export function saved(): Lang | null {
  try { const v = localStorage.getItem(STORAGE_KEY); return v === 'zh' || v === 'en' ? v : null; } catch { return null; }
}
export function browser(langs: readonly string[] | undefined = typeof navigator !== 'undefined' ? navigator.languages : undefined): Lang {
  const first = langs && langs.length ? langs[0] : (typeof navigator !== 'undefined' ? navigator.language : 'zh');
  return /^zh/i.test(String(first || 'zh')) ? 'zh' : 'en';
}
export function initialLang(loc: LocLike = location): { lang: Lang; source: 'url' | 'saved' | 'browser' } {
  const u = fromURL(loc);
  if (u) return { lang: u, source: 'url' };
  const s = saved();
  if (s) return { lang: s, source: 'saved' };
  return { lang: browser(), source: 'browser' };
}
/** URL with every lang token rewritten to l (adds ?lang=l when there is none). Path, other params and hash kept. */
export function urlWithLang(loc: LocLike, l: Lang): string {
  let had = false;
  const q0 = loc.search || '';
  const q = q0.replace(TOKG, (_m, p: string) => { had = true; return p + 'lang=' + l; });
  const h = (loc.hash || '').replace(TOKG, (_m, p: string) => { had = true; return p + 'lang=' + l; });
  const qq = had ? q : q ? q + (/[?&]$/.test(q) ? '' : '&') + 'lang=' + l : '?lang=' + l;
  return loc.pathname + qq + h;
}
export function htmlLang(l: Lang): string { return l === 'en' ? 'en' : 'zh-CN'; }
