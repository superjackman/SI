/* R53 the reader's progress and learning preferences, tiny and text-free so the home page can read them without
   loading a station: depth (30 秒 / 5 分钟 / 深入), the 我是程序员 switch, stations read, stations mastered (every
   self-check on the station answered right), and how long a route takes at a depth. */
import { DV_KEY, DV_LV, DV_SEEN, dvI } from './links';
import { VF_Q, vfDone } from '../vf/ids';

export const LY_DEPTH = 'si.ly.depth', LY_JV = 'si.ly.jv';
export type Depth = 's' | 'm' | 'd';
export const okD = (v: unknown): v is Depth => v === 's' || v === 'm' || v === 'd';
export const depthGet = (): Depth => { try { const v = localStorage.getItem(LY_DEPTH); return okD(v) ? v : 'm'; } catch { return 'm'; } };
export const depthSet = (d: Depth) => { try { localStorage.setItem(LY_DEPTH, d); } catch { /* private mode */ } };
/** 我是程序员: open the 「换个说法」 code analogy by default */
export const jvGet = () => { try { return localStorage.getItem(LY_JV) === '1'; } catch { return false; } };
export const jvSet = (on: boolean) => { try { localStorage.setItem(LY_JV, on ? '1' : '0'); } catch { /* private mode */ } };
/** minutes per station at each depth (30 秒 · 5 分钟 · 深入 ≈ 12 分钟) */
export const DEPTH_MIN: Readonly<Record<Depth, number>> = { s: 0.5, m: 5, d: 12 };
/** a route's time: stations × depth, rounded to whole minutes (at least 1) */
export const routeMin = (n: number, d: Depth) => Math.max(1, Math.round(n * DEPTH_MIN[d]));
/** 读过: station keys; older plain step numbers 8 → 8a + 8b, 15 → 15a + 15b */
export const seenSt = (): Set<string> => {
  let v: unknown = []; try { v = JSON.parse(localStorage.getItem(DV_SEEN) || '[]'); } catch { /* bad json */ }
  if (!Array.isArray(v)) return new Set();
  return new Set(v.flatMap((x): string[] => typeof x === 'number' ? (x === 8 ? ['8a', '8b'] : x === 15 ? ['15a', '15b'] : [String(x)]) : typeof x === 'string' ? [x] : []).filter((k) => dvI(k) >= 0));
};
/** 掌握: a station whose self-check questions are all answered right */
export const masteredSt = (d = vfDone()): Set<string> => new Set(DV_KEY.filter((k) => { const q = VF_Q['D/' + k] ?? []; return q.length > 0 && q.every((id) => d.has(id)); }));
/** per pyramid layer 1–5: [mastered, stations] (the recap station, layer 0, is not in a layer) */
export const layerMastery = (m: ReadonlySet<string>) => [1, 2, 3, 4, 5].map((n) => { const ks = DV_KEY.filter((_, i) => DV_LV[i] === n); return [ks.filter((k) => m.has(k)).length, ks.length] as const; });
