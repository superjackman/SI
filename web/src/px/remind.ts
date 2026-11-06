/* Review reminder. No server: a banner when something is due, and an optional browser notification.
   The schedule lives in localStorage. A granted permission fires at most once per local day. */
import { tx, type L } from '../l4/txt';
import { dayN, rvPick } from './rv';

export const BELL_KEY = 'si.rv.bell';
export interface Bell { on: 0 | 1; last: number; hideAsk: number }
const empty = (): Bell => ({ on: 0, last: 0, hideAsk: 0 });
export function bellGet(): Bell {
  try {
    const v = JSON.parse(localStorage.getItem(BELL_KEY) || '') as Partial<Bell>;
    if (!v || typeof v !== 'object') return empty();
    return { on: v.on === 1 ? 1 : 0, last: Number(v.last) || 0, hideAsk: Number(v.hideAsk) || 0 };
  } catch { return empty(); }
}
export function bellSet(b: Bell) { try { localStorage.setItem(BELL_KEY, JSON.stringify(b)); } catch { /* private mode */ } }
export const dueN = () => rvPick(99).length;

/** the banner above the home panes. Empty when nothing is due. */
export function bellBanner(l: L): string {
  const n = dueN(); if (!n) return '';
  const z = (a: string, b: string) => tx([a, b], l), b = bellGet(), asked = b.hideAsk === dayN() || b.on === 1;
  const ask = asked ? '' : `<button type="button" class="l4-b sm" data-h="bell">${z('打开提醒', 'Turn on reminders')}</button>`;
  return `<section class="hm-card hm-bell" data-bell="1"><b>${z(`今天有 ${n} 道复习到期`, `${n} review${n === 1 ? '' : 's'} due today`)}</b><div class="px-row">${ask}<button type="button" class="l4-b gold" data-go="#R/rv">${z('去复习', 'Review')} ›</button></div></section>`;
}

/** if permission was granted, notify once on the day something is due */
export function bellPing(l: L) {
  const n = dueN(); if (!n) return;
  const b = bellGet(); if (!b.on || b.last === dayN()) return;
  const N = typeof Notification === 'undefined' ? undefined : Notification;
  if (!N || N.permission !== 'granted') return;
  const z = (a: string, b2: string) => tx([a, b2], l);
  try { new N(z('大白话拆解 AI', 'AI, explained plainly'), { body: z(`今天有 ${n} 道复习到期`, `${n} review${n === 1 ? '' : 's'} due today`) }); bellSet({ ...b, last: dayN() }); } catch { /* blocked */ }
}

export async function bellAsk(l: L): Promise<'ok' | 'no'> {
  const N = typeof Notification === 'undefined' ? undefined : Notification;
  if (!N) { bellSet({ ...bellGet(), hideAsk: dayN() }); return 'no'; }
  let p: NotificationPermission = N.permission;
  if (p === 'default') { try { p = await N.requestPermission(); } catch { p = 'denied'; } }
  const b = bellGet();
  if (p === 'granted') { bellSet({ on: 1, last: 0, hideAsk: dayN() }); bellPing(l); return 'ok'; }
  bellSet({ ...b, on: 0, hideAsk: dayN() }); return 'no';
}
