/* R40: the learning record (记), kept only in this browser (localStorage). Pages seen and cards opened already live in
   si.l4.seen / si.l4.cards; this adds quiz answers, experiment runs, the quick path and a per-day activity count. */
export type Ev =
  | { k: 'quiz'; t: number; lv: number; right: number; total: number }
  | { k: 'ans'; t: number; id: string; ok: boolean }
  | { k: 'exp'; t: number; id: string; v: string }
  | { k: 'path'; t: number; sec: number }
  | { k: 'share'; t: number; id: string };
const KEY = 'si.px.log', DAYS = 'si.px.days', MAX = 400;
const get = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const set = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
/** the local calendar day, YYYY-MM-DD */
export const day = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const log = (): Ev[] => get<Ev[]>(KEY, []);
export const days = (): Record<string, number> => get<Record<string, number>>(DAYS, {});
/** count one action on today */
export function bump(t = Date.now()) { const d = days(), k = day(t); d[k] = (d[k] ?? 0) + 1; const ks = Object.keys(d).sort(); while (ks.length > 120) delete d[ks.shift()!]; set(DAYS, d); }
export function add(e: Ev) { const l = log(); l.push(e); if (l.length > MAX) l.splice(0, l.length - MAX); set(KEY, l); bump(e.t); }
/** answered questions, right answers (each question's latest answer counts once) */
export function answers(l = log()) {
  const last = new Map<string, boolean>(); let n = 0, r = 0;
  for (const e of l) if (e.k === 'ans') { n++; if (e.ok) r++; last.set(e.id, e.ok); }
  return { n, r, uniq: last.size, uniqR: [...last.values()].filter(Boolean).length };
}
/** the last 7 days, oldest first: [YYYY-MM-DD, count] */
export function week(now = Date.now(), d = days()): [string, number][] {
  return Array.from({ length: 7 }, (_, i) => { const k = day(now - (6 - i) * 864e5); return [k, d[k] ?? 0] as [string, number]; });
}
/** consecutive active days ending today (or yesterday, if today has nothing yet) */
export function streak(now = Date.now(), d = days()) {
  let i = d[day(now)] ? 0 : 1, n = 0; while (d[day(now - i * 864e5)]) { n++; i++; } return n;
}
