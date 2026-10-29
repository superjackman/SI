/* R42: per-layer progress (pages seen / cards opened) and the "recently seen" trail, shared by the home card, the map
   and the record page. Small and dependency-light: it ships in the first-load chunk. */
import { LX, LX_N, isLx, layerOf } from '../lx/ids';
import { ORDER, X_ORDER } from './pages';
import { LAB, STEPN, UI, tx, type L, type Tx } from './txt';

export const RECENT_KEY = 'si.l4.recent';
export type Seen = { id: string; t: number; k: 'p' | 'c' };
/** every page of a layer, in reading order (layer 4 = the 19 walk pages + the 7 zoom pages) */
export function layerPages(n: number): string[] {
  if (n === 4) return [...ORDER, ...X_ORDER.map((p) => 'X:' + p)];
  return LX[n as 1 | 2 | 3 | 5] ?? [];
}
export const pageLayer = (id: string): number => (isLx(id) ? layerOf(id) : id === 'L4' || /^(TR|US|MY)\d$/.test(id) || id.startsWith('X:') ? 4 : 0);
/** cards per layer (checked against the card files by a unit test) */
export const CARD_N = [6, 8, 12, 15, 12] as const;
export const cardLayer = (k: string) => (k.startsWith('KA') ? 1 : k.startsWith('KB') ? 2 : k.startsWith('KC') ? 3 : k.startsWith('KM') ? 5 : 4);
export function layerStats(seen: Iterable<string>, cards: Iterable<string> = []) {
  const s = new Set(seen), c = new Set(cards);
  return [1, 2, 3, 4, 5].map((n) => { const ps = layerPages(n); return { n, s: ps.filter((p) => s.has(p)).length, t: ps.length, c: [...c].filter((k) => cardLayer(k) === n).length, ct: CARD_N[n - 1]! }; });
}
const get = (): Seen[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as Seen[]; } catch { return []; } };
export const recent = get;
export function pushRecent(id: string, k: 'p' | 'c', t = Date.now()) {
  const l = get().filter((e) => !(e.id === id && e.k === k)); l.push({ id, t, k }); if (l.length > 30) l.splice(0, l.length - 30);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(l)); } catch { /* private mode */ }
}
/** the last page the reader was on (not home, not the practice pages) */
export const lastPage = (): Seen | null => [...get()].reverse().find((e) => e.k === 'p' && pageLayer(e.id) > 0) ?? null;
const XN0: Record<string, Tx> = { att: LAB.att, 'att.dot': ['Q·K 打分', 'Q·K scores'], 'att.dot.one': ['一个数', 'One number'], 'att.heads': ['多头', 'Heads'], 'att.mask': ['遮罩', 'Mask'], ffn: LAB.ffn, an1: LAB.an1 };
/** a page's short name for people (never its code) */
export function pageName(id: string, l: L): string {
  if (isLx(id)) return tx(LX_N[id] ?? [id, id], l).replace(/^M\d\s+/, '');
  if (id === 'L4') return tx(UI.whole, l);
  const m = /^(TR|US|MY)(\d)$/.exec(id); if (m) return tx(STEPN[m[1]!.toLowerCase() as 'tr' | 'us' | 'my'][Number(m[2]) - 1]!, l);
  if (id.startsWith('X:')) return tx(XN0[id.slice(2)] ?? LAB[id.slice(2) as keyof typeof LAB] ?? ['', ''], l);
  return id;
}
export const LCOL = ['#0891b2', '#0d9488', '#4f46e5', '#2563eb', '#7c3aed'] as const;
export const lvTag = (n: number, l: L) => `<span class="l4-lt" style="--c:${LCOL[n - 1]}">${tx(UI.lv[n - 1]!, l)}</span>`;
export const pbar = (s: number, t: number, n: number) => `<span class="l4-pb" style="--c:${LCOL[n - 1]}"><i style="width:${t ? Math.round((100 * s) / t) : 0}%"></i></span>`;
