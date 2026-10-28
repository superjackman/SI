/* R34: the map of the all-3D site. Pure data (no DOM, no three.js), shared by the shell, the scenes and the tests.
   Five zones (the classic drawer groups), 27 stations in the classic order; each station has idea pages, one experiment,
   a quiz and a reward page. Routes live in the hash so the static SEO pages' "#T1" links open the right station. */
import { GRP, TABORDER, tabn, ICON } from '../legacy/kb';
export type L = 'zh' | 'en';
/** [zh, en] */
export type Tx = [string, string];
export const tx = (x: Tx, l: L) => (l === 'en' ? x[1] : x[0]);
export interface Zone { id: string; n: number; icon: string; name: Tx; st: string[]; color: string; sky: [string, string, string] }
const ZC: [string, [string, string, string]][] = [
  ['#8b5cf6', ['#c4bbee', '#ddd5f8', '#f1ecfc']],
  ['#3b82f6', ['#b9cdf3', '#d6e3fa', '#eef3fd']],
  ['#ec4899', ['#e9bfe0', '#f3d8ee', '#fbeef8']],
  ['#14b8a6', ['#b6e3dc', '#d3f0eb', '#edf9f7']],
  ['#f59e0b', ['#f0d9ad', '#f7e8cc', '#fcf5e8']],
];
export const ZONES: Zone[] = GRP.map(([icon, name, st], k) => ({ id: `z${k + 1}`, n: k + 1, icon, name: [name.zh, name.en], st, color: ZC[k]![0], sky: ZC[k]![1] }));
export const STATIONS: string[] = TABORDER.slice();
export const isSt = (s: string) => STATIONS.includes(s);
export const zoneOf = (s: string): Zone => ZONES.find((z) => z.st.includes(s)) ?? ZONES[0]!;
export const stName = (s: string, l: L) => tabn(s, l);
export const stIcon = (s: string) => ICON[s] ?? '•';
export const nextSt = (s: string) => STATIONS[(STATIONS.indexOf(s) + 1) % STATIONS.length]!;
/** the emblem modelled for each station (its pedestal in the zone hall, its pillar on the map) */
export const EMBLEM: Record<string, string> = {
  T1: 'layers', U: 'robot', Ua: 'duo', Ub: 'rocket', Uc: 'toolbox', Ud: 'target', Up: 'shelf', Api: 'plug', Loc: 'laptop', Job: 'clipboard',
  Skl: 'cards', Bld: 'blocks', T2: 'loop', T3: 'letters', N: 'net', T4: 'tower', T4a: 'eye', T4b: 'scale', T5: 'split', T6: 'frame',
  T7: 'dumbbell', T8: 'globe', K1: 'slope', K2: 'grid', K3: 'dice', K4: 'valley', K5: 'stairs',
};

/* ---------- routes ---------- */
export type Route =
  | { v: 'home' } | { v: 'welcome' } | { v: 'map' }
  /** R37: the three areas: learn (the knowledge tree), practice (experiments, quizzes, the record), share (cards) */
  | { v: 'learn' } | { v: 'practice' } | { v: 'share'; s?: string }
  | { v: 'zone'; z: number; i: number }
  | { v: 'st'; s: string; p: number };
/** '#T1', '#T1/3', '#z2', '#z2/4', '#map', '#welcome', '' (also the classic forms '#T3/llm', '#T2&lang=en', '#/T3') */
export function parseRoute(hash: string, search = ''): Route {
  const h = decodeURIComponent(hash.replace(/^#!?\/?/, '')).split(/[&;?]/)[0]!;
  const [a = '', b = ''] = h.split('/');
  if (a === 'map') return { v: 'map' };
  if (a === 'welcome') return { v: 'welcome' };
  if (a === 'learn' || a === 'practice') return { v: a };
  if (a === 'share') return isSt(b) ? { v: 'share', s: b } : { v: 'share' };
  const z = /^z([1-5])$/.exec(a);
  if (z) return { v: 'zone', z: +z[1]!, i: Math.max(0, Math.min(40, Number(b) || 0)) };
  if (isSt(a)) return { v: 'st', s: a, p: /^\d+$/.test(b) ? Math.min(+b, 20) : 0 };
  /* the R33 pilot's addresses (?w=3d&p=zone|attn|dot) */
  const q = new URLSearchParams(search), p = q.get('p');
  if (p === 'zone') return { v: 'zone', z: 3, i: 0 };
  if (p === 'attn') return { v: 'st', s: 'T4a', p: 2 };
  if (p === 'dot') return { v: 'st', s: 'T4b', p: 2 };
  return { v: 'home' };
}
export function routeHash(r: Route): string {
  if (r.v === 'home') return '';
  if (r.v === 'map' || r.v === 'welcome' || r.v === 'learn' || r.v === 'practice') return `#${r.v}`;
  if (r.v === 'share') return r.s ? `#share/${r.s}` : '#share';
  if (r.v === 'zone') return `#z${r.z}${r.i ? '/' + r.i : ''}`;
  return `#${r.s}${r.p ? '/' + r.p : ''}`;
}
/** the station (for analytics, the title and the "classic version" link) a route belongs to */
export const routeSt = (r: Route) => (r.v === 'st' ? r.s : 'H');
