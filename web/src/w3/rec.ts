/* R37: my learning record (outside the knowledge tree): per station whether I saw it, did its experiment and how its
   quiz went, which questions I got wrong, and the days I learned (for the streak). One localStorage key, si.w3.rec;
   "mastered" stays the existing si.w3.done (the whole quiz finished). Pure functions + a tiny store, no DOM. */
export interface StRec { seen?: number; lab?: number; r?: number; w?: number }
export interface Rec { st: Record<string, StRec>; days: string[]; mis: string[]; first: Record<string, number> }
export type Status = 0 | 1 | 2 | 3; // not started, seen, practised, mastered
export const KEY = 'si.w3.rec';
export const empty = (): Rec => ({ st: {}, days: [], mis: [], first: {} });
export function fix(v: unknown): Rec {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<Rec>;
  return { st: o.st && typeof o.st === 'object' ? o.st : {}, days: Array.isArray(o.days) ? o.days.slice(-400) : [], mis: Array.isArray(o.mis) ? o.mis.slice(-200) : [], first: o.first && typeof o.first === 'object' ? o.first : {} };
}
export const day = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const touch = (r: Rec, now: number) => { const d = day(now); if (r.days[r.days.length - 1] !== d && !r.days.includes(d)) r.days.push(d); };
const at = (r: Rec, s: string) => (r.st[s] ??= {});
export function seen(r: Rec, s: string, now: number) { const x = at(r, s); x.seen = (x.seen ?? 0) + 1; touch(r, now); }
export function lab(r: Rec, s: string, now: number) { const x = at(r, s); x.lab = (x.lab ?? 0) + 1; touch(r, now); }
/** a quiz answer: question qi of station s right or wrong; a first try is remembered for the accuracy line */
export function answer(r: Rec, s: string, qi: number, ok: boolean, now: number) {
  const x = at(r, s), k = `${s}/${qi}`;
  if (ok) x.r = (x.r ?? 0) + 1; else { x.w = (x.w ?? 0) + 1; if (!r.mis.includes(k)) r.mis.push(k); }
  if (!(k in r.first)) r.first[k] = ok ? 1 : 0;
  if (ok && r.first[k] === 1) r.mis = r.mis.filter((m) => m !== k);
  touch(r, now);
}
export function status(r: Rec, s: string, done: Set<string>): Status {
  if (done.has(s)) return 3; const x = r.st[s]; if (!x) return 0; if (x.lab || x.r || x.w) return 2; return x.seen ? 1 : 0;
}
/** days in a row up to today (or yesterday, so the streak is not lost before today's lesson) */
export function streak(r: Rec, now: number): number {
  const has = new Set(r.days); let t = now; if (!has.has(day(t))) t -= 864e5;
  let n = 0; while (has.has(day(t)) && n < 999) { n++; t -= 864e5; } return n;
}
/** first-try accuracy: right / asked */
export function acc(r: Rec): { ok: number; n: number } { const v = Object.values(r.first); return { ok: v.filter((x) => x === 1).length, n: v.length }; }
export const totals = (r: Rec) => Object.values(r.st).reduce<{ r: number; w: number }>((a, x) => ({ r: a.r + (x.r ?? 0), w: a.w + (x.w ?? 0) }), { r: 0, w: 0 });
