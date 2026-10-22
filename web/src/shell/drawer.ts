/* Side drawer open/close with a history entry (live openDrawer / closeDrawer): opening pushes {mDrawer:1} so the
   phone's back gesture closes the drawer instead of leaving the page; closing from the UI pops that entry and runs
   the follow-up action after popstate (or after 450 ms if the browser never fires it). */
import { useApp } from '../store/app';

let pushed = false, pend: (() => void) | null = null, tmr = 0;
const st = () => useApp.getState();
const hide = () => st().set({ drawerOpen: false });

export function openDrawer() {
  if (st().drawerOpen) return;
  st().set({ drawerOpen: true, sheetOpen: false, searchOpen: false, popup: null, cardStack: [], full: null });
  try { if (!(history.state as { mDrawer?: number } | null)?.mDrawer) history.pushState({ mDrawer: 1 }, '', location.href); pushed = true; } catch { pushed = false; }
}
export function closeDrawer(after?: () => void) {
  if (!st().drawerOpen) { after?.(); return; }
  hide();
  if (pushed) {
    pushed = false; pend = after ?? null; clearTimeout(tmr);
    tmr = window.setTimeout(() => { const f = pend; pend = null; f?.(); }, 450);
    try { history.back(); } catch { /* ignore */ }
  } else after?.();
}
export const toggleDrawer = () => { if (st().drawerOpen) closeDrawer(); else openDrawer(); };
if (typeof window !== 'undefined') addEventListener('popstate', () => {
  if (st().drawerOpen) { pushed = false; hide(); }
  const f = pend; pend = null; clearTimeout(tmr); f?.();
});
