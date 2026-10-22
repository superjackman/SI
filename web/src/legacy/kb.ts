/* Light knowledge base extracted from the live page (scripts/legacy/extract.mjs → gen/kb.json). */
import raw from './gen/kb.json';
import type { Bi, Lang } from '../i18n/types';

export interface Part { n: Bi; cat: string; train: string; t: string; up?: string; zoom?: string; links?: [string, Bi][] }
export interface KBShape { C: Record<string, Part>; TABN: Record<string, Bi>; PATH: Record<string, string[]>; TABORDER: string[]; footer: Bi }
export const KB = raw as unknown as KBShape;
export const TABORDER = KB.TABORDER;
export const PATH = KB.PATH;
export const isStation = (s: string | null | undefined): s is string => !!s && Object.prototype.hasOwnProperty.call(PATH, s);
export const tabn = (s: string, l: Lang): string => KB.TABN[s]?.[l] ?? s;
export const part = (id: string): Part | undefined => (Object.prototype.hasOwnProperty.call(KB.C, id) ? KB.C[id] : undefined);
let kidsIdx: Record<string, string[]> | null = null;
export function kids(id: string): string[] {
  if (!kidsIdx) { kidsIdx = {}; for (const [k, c] of Object.entries(KB.C)) if (c.up) (kidsIdx[c.up] ||= []).push(k); }
  return kidsIdx[id] ?? [];
}
/** station icons (live: drawer / bottom bar) and drawer groups */
export const ICON: Record<string, string> = { T1: '🏠', T2: '🤖', T3: '🧠', N: '🕸️', T4: '🧩', T4a: '👀', T4b: '📚', T5: '⚡', T6: '🖼️', T7: '🏋️', T8: '🗺️' };
export const GRP: [string, Bi, string[]][] = [
  ['🔭', { zh: '宏观：应用与 Agent', en: 'Macro: apps & agents' }, ['T1', 'T2']],
  ['🗺️', { zh: '中观：大模型', en: 'Meso: the LLM' }, ['T3']],
  ['🔬', { zh: '微观：模型内部', en: 'Micro: inside the model' }, ['N', 'T4', 'T4a', 'T4b', 'T5']],
  ['🧭', { zh: '专题与速查', en: 'Topics & reference' }, ['T6', 'T7', 'T8']],
];
/** bottom-bar group of each station (live GROUP) */
export const GROUP: Record<string, string> = { T1: 'T1', T2: 'T2', T3: 'T3', N: 'more', T4: 'T4', T4a: 'T4', T4b: 'T4', T5: 'more', T6: 'more', T7: 'more', T8: 'more' };
