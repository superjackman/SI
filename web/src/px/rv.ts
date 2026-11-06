/* R56 记忆: spaced review (1 / 3 / 7 days) + 错题本 (wrong book) + first-try accuracy, kept only in this browser.
   One entry per self-check question id (vf/data QQ): b = box (0 → due in 1 day, 1 → 3 days, 2 → 7 days, 3 = retired),
   due = local day number it comes back, t = day it was learned / last reviewed, w = latest answer wrong, f = first answer right.
   Tiny and text-free: the home card, the 今日复习 page, the 验证 blocks and the record page all read it. */
export const RV_KEY = 'si.rv';
export interface RvE { b: number; due: number; t: number; w: 0 | 1; f: 0 | 1 }
/** the local calendar day as a whole number (days since 1970 in local time) */
export const dayN = (t = Date.now()) => { const d = new Date(t); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
export const GAP = [1, 3, 7] as const;
export const rvAll = (): Record<string, RvE> => { try { const v = JSON.parse(localStorage.getItem(RV_KEY) || '{}') as unknown; return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, RvE>) : {}; } catch { return {}; } };
const save = (a: Record<string, RvE>) => { try { localStorage.setItem(RV_KEY, JSON.stringify(a)); } catch { /* private mode */ } };
/** record one answer to question `id` (right or wrong) on day `d`. A right answer on the station page does not take a
    question out of the wrong book: it comes back tomorrow, and only a right answer on the 今日复习 page (rev) clears it. */
export function rvAns(id: string, ok: boolean, d = dayN(), rev = false) {
  const a = rvAll(), e = a[id];
  if (!e) a[id] = ok ? { b: 0, due: d + GAP[0], t: d, w: 0, f: 1 } : { b: 0, due: d, t: d, w: 1, f: 0 };
  else if (!ok) { e.w = 1; e.b = 0; e.due = d; }
  else if (e.w) { if (rev) e.w = 0; e.b = 0; e.due = d + GAP[0]; e.t = d; }
  else if (e.due <= d) { e.b = Math.min(3, e.b + 1); e.due = e.b >= 3 ? d + 30 : d + GAP[e.b]!; e.t = d; }
  save(a);
}
export type Pick = { id: string; why: 'w' | 'due'; ago: number };
/** today's review: wrong ones that are back first, then the ones due (oldest due first); at most n */
export function rvPick(n = 3, d = dayN(), a = rvAll()): Pick[] {
  const es = Object.entries(a), w = es.filter(([, e]) => e.w && e.due <= d).sort((x, y) => x[1].due - y[1].due), due = es.filter(([, e]) => !e.w && e.due <= d).sort((x, y) => x[1].due - y[1].due);
  return [...w.map(([id, e]) => ({ id, why: 'w' as const, ago: d - e.t })), ...due.map(([id, e]) => ({ id, why: 'due' as const, ago: d - e.t }))].slice(0, n);
}
/** the wrong book: questions whose latest answer was wrong */
export const wrongIds = (a = rvAll()) => Object.keys(a).filter((k) => a[k]!.w);
/** ever wrong at least once (for the 错题清零 badge: had some, now none) */
export const everWrong = (a = rvAll()) => Object.values(a).some((e) => !e.f || e.w);
/** first-try accuracy over the questions answered at least once: n answered, p = % right at the first try */
export function firstTry(a = rvAll()) { const es = Object.values(a), n = es.length, r = es.filter((e) => e.f).length; return { n, r, p: n ? Math.round((100 * r) / n) : 0 }; }
/** the next day something comes back (for the empty card), or null */
export function rvNext(d = dayN(), a = rvAll()) { const ds = Object.values(a).filter((e) => e.b < 3 || e.w).map((e) => e.due).filter((x) => x > d); return ds.length ? Math.min(...ds) - d : null; }
