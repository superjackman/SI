/* This calendar week, from real local records only.
   A station counts as mastered this week only when we saw it become mastered and wrote that day (si.mst).
   Practice is answers, quizzes, experiments and station checks dated this week. Page views do not count. */
import { tx } from '../l4/txt';
import { DV_NM, dvI } from '../dv/links';
import { masteredSt, seenSt } from '../dv/prog';
import { pathOf, routeNext } from '../dv/routes';
import { day, log, streak } from './rec';
import { dayN, rvAll } from './rv';

export const MST_KEY = 'si.mst';
export function mstGet(): Record<string, string> {
  try {
    const v = JSON.parse(localStorage.getItem(MST_KEY) || '{}') as unknown;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    const o: Record<string, string> = {};
    for (const [k, d] of Object.entries(v)) if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && dvI(k) >= 0) o[k] = d;
    return o;
  } catch { return {}; }
}
/** Monday 00:00 local through next Monday, as YYYY-MM-DD (end exclusive). */
export function weekSpan(now = Date.now()) {
  const d = new Date(now), wd = d.getDay(), back = wd === 0 ? 6 : wd - 1;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { from: day(start.getTime()), to: day(end.getTime()) };
}
/** call with the mastered set from before the write. The first day we notice a station is kept. */
export function noteMastered(prev: ReadonlySet<string>, now = Date.now()) {
  const cur = masteredSt(), book = mstGet(), d = day(now);
  let ch = false;
  for (const k of cur) if (!prev.has(k) && !book[k]) { book[k] = d; ch = true; }
  if (ch) { try { localStorage.setItem(MST_KEY, JSON.stringify(book)); } catch { /* private mode */ } }
}
export function masteredThisWeek(now = Date.now()) {
  const { from, to } = weekSpan(now);
  return Object.entries(mstGet()).filter(([, ds]) => ds >= from && ds < to).map(([k]) => k).sort((a, b) => dvI(a) - dvI(b));
}
export function practiceCount(now = Date.now()) {
  const { from, to } = weekSpan(now);
  const start = new Date(`${from}T00:00:00`).getTime(), end = new Date(`${to}T00:00:00`).getTime();
  let n = 0;
  for (const e of log()) if ((e.k === 'ans' || e.k === 'quiz' || e.k === 'exp') && e.t >= start && e.t < end) n++;
  const a = dayN(start), b = dayN(end - 1);
  for (const e of Object.values(rvAll())) if (e.t >= a && e.t <= b) n++;
  return n;
}
export interface WeekModel { empty: boolean; mastered: string[]; practice: number; streak: number; next: string }
export function weekModel(now = Date.now()): WeekModel {
  const mastered = masteredThisWeek(now), practice = practiceCount(now), sk = streak(now);
  const r = pathOf();
  return { empty: mastered.length === 0 && practice === 0, mastered, practice, streak: sk, next: routeNext(r, masteredSt(), seenSt()) };
}
export const stName = (k: string, l: 'zh' | 'en') => tx(DV_NM[dvI(k)] ?? [k, k], l);
