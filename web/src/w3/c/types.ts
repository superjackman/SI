/* R34: the words of every station (zh / en, plain enough for a child), in a compact form: each text is 'zh|en'.
   A station = idea pages (a sentence and 2-3 modelled things to tap, each with what it is and why), one experiment,
   2-3 quiz questions (answered by tapping or dragging a glass block in the 3D scene) and a reward line. */
import type { Tx } from '../reg';
export type S = string; // 'zh|en'
export type RawThing = [prop: string, name: S, say: S, why: S];
export type RawIdea = [say: S, things: RawThing[]];
export type RawQ = [q: S, opts: S[], right: number, hint: S];
export interface RawSt { i: RawIdea[]; lab: [kind: string, say: S, why: S, opt?: Record<string, unknown>]; q: RawQ[]; d: S }
export interface Thing { p: string; n: Tx; s: Tx; w: Tx }
export interface Idea { say: Tx; things: Thing[] }
export interface Q { q: Tx; o: Tx[]; a: number; hint: Tx }
export interface Lab { k: string; say: Tx; why: Tx; opt: Record<string, unknown> }
export interface StC { ideas: Idea[]; lab: Lab; quiz: Q[]; done: Tx }
export const x = (s: S): Tx => { const k = s.indexOf('|'); return k < 0 ? [s, s] : [s.slice(0, k), s.slice(k + 1)]; };
export function cook(r: RawSt): StC {
  return {
    ideas: r.i.map(([say, th]) => ({ say: x(say), things: th.map(([p, n, s, w]) => ({ p, n: x(n), s: x(s), w: x(w) })) })),
    lab: { k: r.lab[0], say: x(r.lab[1]), why: x(r.lab[2]), opt: r.lab[3] ?? {} },
    quiz: r.q.map(([q, o, a, h]) => ({ q: x(q), o: o.map(x), a, hint: x(h) })),
    done: x(r.d),
  };
}
