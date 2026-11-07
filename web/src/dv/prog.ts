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
/** minutes per station at each depth (30 秒 · 5 分钟 · 深入 ≈ 12 分钟). Depth still only caps how much text opens. */
export const DEPTH_MIN: Readonly<Record<Depth, number>> = { s: 0.5, m: 5, d: 12 };
/** a route's time: stations × depth, rounded to whole minutes (at least 1) */
export const routeMin = (n: number, d: Depth) => Math.max(1, Math.round(n * DEPTH_MIN[d]));
/** one small goal: a choice, the explanation, a prediction, and two numbers. The picture on the way in is the extra minute. */
export const SUB_MIN = 4;
export const stationMin = (goals: number) => 1 + Math.max(0, goals) * SUB_MIN;
/** 读过: station keys; older plain step numbers 8 → 8a + 8b, 15 → 15a + 15b */
export const seenSt = (): Set<string> => {
  let v: unknown = []; try { v = JSON.parse(localStorage.getItem(DV_SEEN) || '[]'); } catch { /* bad json */ }
  if (!Array.isArray(v)) return new Set();
  return new Set(v.flatMap((x): string[] => typeof x === 'number' ? (x === 8 ? ['8a', '8b'] : x === 15 ? ['15a', '15b'] : [String(x)]) : typeof x === 'string' ? [x] : []).filter((k) => dvI(k) >= 0));
};
/* R56/R57 调查 → 推理 → 验证 micro-loop: every station has small goals; a small goal is mastered after two
   right answers in a row on its 验证 questions. State per page in si.ml: { m: 0/1 per goal, k: run of right answers,
   v: variant index, g: current goal, s: 'i' | 'r' | 'v' step, p: picked 调查 option per goal (−1 none) } */
export const ML_KEY = 'si.ml';
/** stations with the micro-loop and how many small goals each has. Every station on the 23-stop route. */
export const ML_G: Readonly<Record<string, number>> = {
  '0': 3, P: 3, '1': 3, '2': 3, '3': 3, '4': 3, '5': 3, '6': 3, '7': 3, '8a': 3, '8b': 3,
  '9': 3, E: 3, '10': 3, '11': 3, '12': 4, '13': 3, '14': 3, S: 3, '15a': 3, '15b': 3, A: 5, '16': 3,
};
/** minutes for a list of stations, from how many small goals each one has */
export const pathMin = (st: readonly (string | number)[]) => st.reduce<number>((s, k) => s + stationMin(ML_G[String(k)] ?? 3), 0);
export interface MlS { m: number[]; k: number[]; v: number[]; g: number; s: 'i' | 'r' | 'v'; p: number[]; f?: number[]; c?: number[]; w?: number[][] }
const rows = (a: unknown, n: number): number[][] => Array.from({ length: n }, (_, i) => (Array.isArray(a) && Array.isArray((a as unknown[])[i]) ? ((a as number[][])[i]!).filter((x) => typeof x === 'number') : []));
export const mlAll = (): Record<string, MlS> => { try { const v = JSON.parse(localStorage.getItem(ML_KEY) || '{}') as unknown; return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, MlS>) : {}; } catch { return {}; } };
export const mlGet = (k: string): MlS => {
  const n = ML_G[k] ?? 0, z = () => Array.from({ length: n }, () => 0), o = mlAll()[k], arr = (a: unknown, d: number) => Array.from({ length: n }, (_, i) => (Array.isArray(a) && typeof a[i] === 'number' ? (a[i] as number) : d));
  if (!o || typeof o !== 'object') return { m: z(), k: z(), v: z(), g: 0, s: 'i', p: z().map(() => -1), c: z(), w: rows(null, n) };
  return { m: arr(o.m, 0), k: arr(o.k, 0), v: arr(o.v, 0), g: Number.isInteger(o.g) && o.g >= 0 && o.g < n ? o.g : 0, s: o.s === 'r' || o.s === 'v' ? o.s : 'i', p: arr(o.p, -1), c: arr(o.c, 0), w: rows(o.w, n) };
};
export const mlSet = (k: string, v: MlS) => { const a = mlAll(); a[k] = v; try { localStorage.setItem(ML_KEY, JSON.stringify(a)); } catch { /* private mode */ } };
/** small goals mastered on station k: [done, total] */
export const mlDone = (k: string): [number, number] => { const n = ML_G[k] ?? 0; return [mlGet(k).m.filter((x) => x === 1).length, n]; };
/** 掌握: a station whose self-check questions are all answered right, or (micro-loop stations) whose small goals are all mastered */
export const masteredSt = (d = vfDone()): Set<string> => new Set(DV_KEY.filter((k) => { const q = VF_Q['D/' + k] ?? []; if (q.length > 0 && q.every((id) => d.has(id))) return true; const [a, b] = mlDone(k); return b > 0 && a === b; }));
/** per pyramid layer 1–5: [mastered, stations] (the recap station, layer 0, is not in a layer) */
export const layerMastery = (m: ReadonlySet<string>) => [1, 2, 3, 4, 5].map((n) => { const ks = DV_KEY.filter((_, i) => DV_LV[i] === n); return [ks.filter((k) => m.has(k)).length, ks.length] as const; });
