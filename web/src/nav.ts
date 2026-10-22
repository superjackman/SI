/* Navigation actions shared by the shell, the station views and the lab adapter.
   Same rules as the live page: go / drill (⤵, remembered so ↩ can return) / back, popups with a card stack. */
import { useApp } from './store/app';
import { isStation, KB, part, tabn } from './legacy/kb';
import { tx } from './i18n/L';
import { hashFor } from './router/hash';

const st = () => useApp.getState();
const LSK = 'aiexp.v2.visited';
export function visited(): string[] {
  try { const v = JSON.parse(localStorage.getItem(LSK) || '[]') as unknown; return Array.isArray(v) ? (v as string[]) : []; } catch { return []; }
}
function markVisited(L: string) {
  const v = visited(); if (v.includes(L)) return; v.push(L);
  try { localStorage.setItem(LSK, JSON.stringify(v)); } catch { /* private mode */ }
}
let toastT = 0;
export function toast(text: string) {
  window.clearTimeout(toastT);
  st().set({ toast: { text, n: (st().toast?.n ?? 0) + 1 } });
  toastT = window.setTimeout(() => st().set({ toast: null }), 2200);
}
let inDrill = 0;
/** scroll target after the next station render: 'top' | number | element id | null (keep) */
export const pendingScroll: { v: 'top' | 'main' | number | string | null } = { v: null };

export function go(L: string, scroll: boolean | 'top' = true) {
  if (!isStation(L)) return;
  const s = st();
  if (!inDrill && s.drill.length) { const t = s.drill[s.drill.length - 1]; if (t && L !== t.to && L !== s.station) s.set({ drill: [] }); }
  markVisited(L);
  pendingScroll.v = scroll === 'top' ? 'top' : scroll ? 'main' : null;
  try { history.replaceState(history.state, '', hashFor(L, s.lang, location.hash)); } catch { /* ignore */ }
  st().set({ station: L, navSeq: s.navSeq + 1, full: null });
}
export function drill(to: string, o: { open?: string | null; src?: string } = {}) {
  const s = st();
  if (!isStation(to) || to === s.station) return;
  const drillS = [...s.drill, { from: s.station, to, y: window.pageYOffset, open: o.open ?? null }].slice(-12);
  inDrill++;
  try { s.set({ drill: drillS, popup: null, cardStack: [], full: null }); go(to, 'top'); } finally { inDrill--; }
  if (o.src) pendingFlash.v = o.src;
  toast('⤵ ' + tabn(to, s.lang) + tx('nav.drillToast', s.lang));
}
export const pendingFlash: { v: string | null } = { v: null };
export function canBack() { const s = st(); const t = s.drill[s.drill.length - 1]; return !!(t && t.to === s.station); }
export function back() {
  const s = st(); const e = s.drill[s.drill.length - 1]; if (!e) return;
  st().set({ toast: null, drill: s.drill.slice(0, -1), popup: null, cardStack: [], full: null });
  inDrill++;
  try { if (e.from !== s.station) go(e.from, false); } finally { inDrill--; }
  pendingScroll.v = e.y || 0;
  if (e.open && part(e.open)) window.setTimeout(() => openInfo(e.open as string), 30);
}
export function openInfo(id: string, keepStack = false) {
  if (!part(id)) return;
  const s = st();
  s.set({ popup: { id, tab: 0 }, cardStack: keepStack ? s.cardStack : [], searchOpen: false });
}
export function closeInfo() { if (st().popup) st().set({ popup: null, cardStack: [] }); }
function inCur(id: string) { const sec = document.getElementById(st().station); return !!sec?.querySelector(`[data-id="${CSS.escape(id)}"]`); }
export function openAnywhere(id: string) { const c = part(id); if (!c) return; if (!inCur(id)) go(c.t, false); openInfo(id); }
export function jumpTo(id: string, lv?: string) {
  closeInfo();
  if (lv && st().station !== lv) { go(lv, false); pendingScroll.v = id; return; }
  scrollToEl(id);
}
/** set by the detail-level module (avoids an import cycle) */
export const hooks: { ensureVisible: (el: Element | null) => void } = { ensureVisible: () => {} };
export function scrollToEl(id: string) {
  const el = document.getElementById(id); if (!el) return;
  hooks.ensureVisible(el);
  openCollapsed(el);
  window.setTimeout(() => {
    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - 70), behavior: 'smooth' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }, 30);
}
/** open the collapsed cards / details around an element (live ccOpen) */
export function openCollapsed(el: Element) {
  let n: Element | null = el;
  while (n && n !== document.body) {
    if (n.classList.contains('cc-closed')) setCard(n as HTMLElement, true);
    if (n.tagName === 'DETAILS' && !(n as HTMLDetailsElement).open) (n as HTMLDetailsElement).open = true;
    n = n.parentElement;
  }
}
export function setCard(c: HTMLElement, open: boolean) {
  c.classList.toggle('cc-closed', !open);
  c.querySelector(':scope>h2>.cc-h,:scope>h3>.cc-h')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) window.setTimeout(() => c.querySelectorAll('.m-vw').forEach((h) => (h as HTMLElement & { __v?: { apply(): void } }).__v?.apply()), 0);
}
/** from inside a popup: open another card (↩ returns); a card on another station goes there first */
export function openFromCard(k: string) {
  const s = st(); const cur = s.popup?.id; const c = part(k); if (!c || !cur || k === cur) return;
  const stack = [...s.cardStack, cur].slice(-20);
  if (!inCur(k) && c.t !== s.station) {
    const d = [...s.drill, { from: s.station, to: c.t, y: window.pageYOffset, open: cur, ph: true }];
    inDrill++; try { s.set({ drill: d }); go(c.t, false); } finally { inDrill--; }
  }
  st().set({ popup: { id: k, tab: 0 }, cardStack: stack });
}
export function cardBack() {
  const s = st(); const pv = s.cardStack[s.cardStack.length - 1]; if (!pv) return;
  const te = s.drill[s.drill.length - 1];
  if (te && te.ph && te.open === pv && te.to === s.station) {
    inDrill++; try { s.set({ drill: s.drill.slice(0, -1) }); go(te.from, false); } finally { inDrill--; }
    pendingScroll.v = te.y || 0;
  }
  st().set({ popup: { id: pv, tab: 0 }, cardStack: s.cardStack.slice(0, -1) });
}
/** a [data-jump] inside a popup remembers where it came from (live) */
export function jumpFromCard(id: string, lv: string) {
  const s = st(); const cur = s.popup?.id ?? null;
  inDrill++;
  try { s.set({ drill: [...s.drill, { from: s.station, to: lv || s.station, y: window.pageYOffset, open: cur }] }); jumpTo(id, lv); } finally { inDrill--; }
}
export const footer = KB.footer;
