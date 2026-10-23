/* extension cards for the legacy stations (M4–M6): shared types and small HTML helpers.
   build.ts injects each station's cards between <!--m2x--> markers so a re-run replaces them. */
import { esc, type Bi, type Page, type PopSpec, type T } from '../../lib';
import type { Q } from '../quiz';

export interface XPart { n: Bi; t: string; cat: string; train?: 'yes' | 'no' | 'part'; up?: string; dn?: string[]; use?: string[]; pop: (t: T) => PopSpec }
export interface Ext {
  parts: Record<string, XPart>;
  /** concept cards, inserted before the station's lab divider */
  cards: Record<string, (P: Page) => void>;
  /** extra labs, inserted after the station's own labs (before the quiz) */
  labs?: Record<string, (P: Page) => void>;
  quiz: (t: T) => Record<string, Q[]>;
}
/** a source line: verified links only (checked when the content was written) */
export const src = (P: Page, items: [string, string][]) => `<p class="k-src">${P.t('来源', 'Sources')}: ${items.map(([u, n]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${esc(n)}</a>`).join(' · ')}</p>`;
const DD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h8.5v11.5M8.5 13.5l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
/** the drill-down row legacy cards use (buttons go to another station; App.tsx handles data-ddgo) */
export const dd = (P: Page, ss: string[]) => `<div class="m-ddrow" role="group" aria-label="${P.t('下钻到更深一层', 'Drill down a level')}">${ss.map((s, i) => `<button class="dd-c${i ? '' : ' pri'}" data-ddgo="${s}" aria-label="${esc(P.t('下钻到：', 'Drill down to: ') + P.st(s))}" title="${esc(P.t('下钻到：', 'Drill down to: ') + P.st(s))}">${DD}<span>${esc(P.st(s))}</span></button>`).join('')}</div>`;
export const ul = (a: string[]) => `<ul class="pts">${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
/** an illustrative-numbers note (示意) */
export const demo = (P: Page, s: string) => `<p class="tag-note">${P.tag()} ${s}</p>`;
export const ST_MODEL = (t: T) => t('🔥 训练阶段决定的能力：靠数据和训练练出来，用的时候只读', '🔥 A trained capability: learned from data in training, read-only at use time');
export const ST_SYS = (t: T) => t('⚙️ 系统层做法：不改模型参数，靠外部流程和规则', '⚙️ A system-level practice: no model parameters change; it is outer process and rules');
export const ST_TRAIN = (t: T) => t('🔥 这是一个训练阶段：在这一步更新模型参数', '🔥 This is a training stage: model parameters are updated here');
