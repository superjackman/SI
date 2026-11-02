/* R46: in-site moves never add a browser history entry. Every page change rewrites the current entry
   (history.replaceState + a synthetic hashchange, so the one router in shell.ts still runs), so the phone's system
   Back leaves the site in one step, back to wherever the reader came from. The site's own controls (↑ up one level,
   ‹ 上一步, crumbs, ✕ close) move inside it. The pages visited are kept in a small per-tab stack (sessionStorage,
   so a refresh keeps it); `navBack` goes to the previous one, or to a fallback when there is none (a deep link). */
export const NAV_KEY = 'si.nav';
const MAX = 30;
type W = Pick<Window, 'location' | 'history' | 'dispatchEvent' | 'sessionStorage'>;

/** the page part of a hash: '#L4/tr/2~K05' → '#L4/tr/2' (a card on top is not a separate page) */
export const pageOf = (h: string) => { const p = (h || '').split('~')[0]!; return p && p !== '#' ? p : '#home'; };

const read = (w: W): string[] => { try { const v = JSON.parse(w.sessionStorage.getItem(NAV_KEY) || '[]') as unknown; return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []; } catch { return []; } };
const write = (w: W, s: string[]) => { try { w.sessionStorage.setItem(NAV_KEY, JSON.stringify(s.slice(-MAX))); } catch { /* private mode */ } };

let last: string | null = null, popping = false;
const full = (h: string) => (h && h !== '#' ? h : '#home');
const same = (a: string, b: string) => pageOf(a) === pageOf(b);

/** a fresh visit (not a reload / back-forward restore) starts with an empty stack */
export function navInit(w: W, navType?: string) {
  last = null; popping = false;
  if (navType === 'navigate') write(w, []);
}
/** called by the router on every route: remembers where we were (with its open card) when the page changes;
    moves that only open or close a card on the same page are not separate steps */
export function navNote(w: W, h: string) {
  const f = full(h);
  if (last !== null && !same(f, last) && !popping) { const s = read(w); if (!s.length || !same(s[s.length - 1]!, last)) s.push(last); else s[s.length - 1] = last; write(w, s); }
  popping = false; last = f;
}
/** go to hash h by rewriting the current history entry (no new entry); false when h is already the address */
export function navTo(w: W, h: string): boolean {
  if (w.location.hash === h) return false;
  try { w.history.replaceState(w.history.state, '', w.location.pathname + w.location.search + h); }
  catch { w.location.replace(h); return true; } // file: and the like: still no new entry
  w.dispatchEvent(new Event('hashchange'));
  return true;
}
const trim = (w: W, s: string[]) => { const cur = full(w.location.hash); while (s.length && same(s[s.length - 1]!, cur)) s.pop(); return s; };
/** the previous in-site view, or null */
export function navPrev(w: W): string | null { const s = trim(w, read(w)); return s.length ? s[s.length - 1]! : null; }
/** the site's own back: the previous in-site view (popped, its card reopened), else `fallback` */
export function navBack(w: W, fallback: string) {
  const s = trim(w, read(w)), to = s.pop() ?? fallback; write(w, s); popping = true;
  if (!navTo(w, to)) popping = false;
}
