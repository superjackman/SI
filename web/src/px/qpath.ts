/* R40: 10 分钟快速路径 — a fixed walk through the explorer, macro → micro, one or two stops per layer and two cards.
   The time is computed from the real text of each stop (qtime.json is written by tests/unit/r40-px.test.ts from the
   pages and cards themselves, and that test fails if the text changes without regenerating it):
   reading speed = IReST standard texts (Trauzettel-Klosinski et al. 2012): Chinese 255 chars/min, English 228 words/min,
   plus a fixed LOOK seconds per page to look at the diagram and tap on. */
import QT from './qtime.json';
import type { L } from '../l4/txt';
export const ZH_CPM = 255, EN_WPM = 228, LOOK = 12;
/** [hash, card shown on top (page 1) or null] */
export const PATH: [string, string | null][] = [
  ['#L1', null], ['#L1/3', 'KA04'], ['#L2', null], ['#L2/4', null], ['#L3', null], ['#L3/T3', null], ['#L3/U4', null],
  ['#L4', null], ['#L4/us/5', 'K06'], ['#L4/us/9', null], ['#L5', null], ['#L5/M2b', null],
];
/** reading units of a text: CJK characters + other words (zh), or words (en) */
export function units(s: string, l: L) {
  if (l === 'en') return (s.match(/[A-Za-z0-9][A-Za-z0-9'’.\-]*/g) ?? []).length + Array.from(s).filter((c) => /[\u3400-\u9fff]/.test(c)).length;
  return Array.from(s).filter((c) => /[\u3400-\u9fff]/.test(c)).length + (s.match(/[A-Za-z0-9][A-Za-z0-9'’.\-]*/g) ?? []).length;
}
export const secs = (u: number, l: L) => (u / (l === 'en' ? EN_WPM : ZH_CPM)) * 60;
export interface QTime { units: number[]; sec: number[] }
/** seconds per stop (reading + LOOK) and the total, from the generated table */
export function plan(l: L) { const t = (QT as Record<L, QTime>)[l]; return { sec: t.sec, total: t.sec.reduce((a, b) => a + b, 0), units: t.units }; }
export const QKEY = 'si.px.q';
export interface QState { on: boolean; i: number; t0: number; max: number }
