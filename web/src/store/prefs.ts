/* R41b: user settings kept in this browser. Animation: 'si.anim' = '1' on / '0' off; unset = follow the system
   "reduce motion" setting. html[data-anim] mirrors it for CSS; the 3D scenes listen to the 'si-anim' event. */
export const ANIM_KEY = 'si.anim';
/** everything 「清除学习记录」 removes: pages seen, cards opened, quiz / experiment / share log, daily activity, quick path */
export const REC_KEYS = ['si.l4.seen', 'si.l4.cards', 'si.px.log', 'si.px.days', 'si.px.q'] as const;
const sys = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
export function animOn(): boolean {
  let v: string | null = null; try { v = localStorage.getItem(ANIM_KEY); } catch { /* private mode */ }
  return v === '1' ? true : v === '0' ? false : !sys();
}
export function applyAnim(doc: Document = document) { doc.documentElement.dataset.anim = animOn() ? 'on' : 'off'; }
export function setAnim(on: boolean) {
  try { localStorage.setItem(ANIM_KEY, on ? '1' : '0'); } catch { /* private mode */ }
  applyAnim(); dispatchEvent(new Event('si-anim'));
}
export function clearRecord() { for (const k of REC_KEYS) { try { localStorage.removeItem(k); } catch { /* private mode */ } } }
