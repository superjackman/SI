import { lazy, Suspense, useEffect, useRef } from 'react';
import { NO } from './boot/noswipe';
import { TopBar } from './shell/TopBar';
import { BackFab, BottomNav, Crumb, Drawer, MoreSheet, Toast } from './shell/Nav';
import { Popup } from './shell/Popup';
import { Fullscreen } from './shell/Fullscreen';
import { StationView, preload } from './station/StationView';
import { useApp, initialNode } from './store/app';
import { fromURL, htmlLang } from './i18n/lang';
import { tx } from './i18n/L';
import { footer, back, closeInfo, drill, go, jumpTo, openAnywhere, openInfo, pendingScroll, scrollToEl, setCard, toast } from './nav';
import { isStation, part, tabn, TABORDER } from './legacy/kb';
import { parseHash } from './router/hash';
import { updHints } from './station/hydrate';
import { setZoom } from './shell/zoom';
import { startTour, tourStep, endTour } from './tour/api';

/** a card element id from a shared link (#S/<id>); scrollToEl ignores ids that are not on the page */
const cardId = (n: string) => /^[A-Za-z][\w-]{0,79}$/.test(n);
const Tour = lazy(() => import('./tour/Tour'));
/** 🔥 training mode on a Transformer stop: mount the lazy training panel after the diagram */
function syncTrain() {
  const s = useApp.getState();
  if (s.mode !== 'train' || !s.station.startsWith('T4') || document.documentElement.dataset.siShown !== `${s.station}.${s.lang}`) return;
  const sec = document.getElementById(s.station); if (!sec) return;
  void import('./station/train').then((m) => m.mountTrain(sec, s.station, s.lang)).catch(() => { /* chunk failure is handled by the recovery hook */ });
}

/** the live page's delegated clicks (same order) — content markup carries data-go / data-open / data-jump … */
function onDocClickCapture(e: MouseEvent) {
  const t = e.target as Element | null; if (!t || !t.closest) return;
  const b = t.closest('[data-dback]');
  if (b) { e.preventDefault(); e.stopPropagation(); back(); return; }
  const d = t.closest<HTMLElement>('[data-ddgo]');
  if (d && !d.closest('#modalBox')) { e.preventDefault(); e.stopPropagation(); drill(d.dataset.ddgo ?? '', {}); return; }
  /* live: zoom-note buttons and 🎬 start buttons are capture-phase too */
  const zs = t.closest<HTMLElement>('[data-zset]'); if (zs) { setZoom(+(zs.dataset.zset ?? 3) as 1 | 2 | 3); return; }
  const tb = t.closest<HTMLElement>('[data-tour]'); if (tb) { startTour(); return; }
}
function onDocClick(e: MouseEvent) {
  const t = e.target as Element | null; if (!t || !t.closest) return;
  if (t.closest('#modalBox,#mDrawer,#moreSheet,#bnav,#topbar,#dgFull,#symSheet')) {
    /* shell layers handle their own clicks; crumb + content are below */
    if (!t.closest('#modalBox')) return;
  }
  /* R15: a symbol in a "What the symbols mean" list opens the glossary sheet at that symbol (lazy chunk) */
  const sy = t.closest<HTMLElement>('[data-sym]');
  if (sy) { e.preventDefault(); const L = useApp.getState().lang; void import('./sym/sheet').then((m) => m.openSym(sy.dataset.sym ?? '*', L)).catch(() => { /* chunk failure is handled by the recovery hook */ }); return; }
  const sj = t.closest<HTMLElement>('[data-sj]');
  if (sj) { e.preventDefault(); const sec = sj.dataset.sp ?? ''; jumpTo(sj.dataset.sj ?? '', sec); return; } /* R12: jumpTo switches station first and scrolls once it has rendered */
  const jb = t.closest<HTMLElement>('[data-jump]'); if (jb) { jumpTo(jb.dataset.jump ?? '', jb.dataset.lv); return; }
  const z = t.closest<HTMLElement>('[data-zoom]'); if (z) { closeInfo(); go(z.dataset.zoom ?? ''); return; }
  const g = t.closest<HTMLElement>('[data-go]'); if (g) { closeInfo(); go(g.dataset.go ?? ''); return; }
  const o = t.closest<HTMLElement>('[data-open]'); if (o) { openAnywhere(o.dataset.open ?? ''); return; }
  const cc = t.closest<HTMLElement>('.cc-h'); if (cc) { const c = cc.closest<HTMLElement>('.card'); if (c) setCard(c, c.classList.contains('cc-closed')); return; }
  const meta = t.closest<HTMLElement>('.cc-meta'); if (meta) { const c = meta.closest<HTMLElement>('.card'); if (c) setCard(c, c.classList.contains('cc-closed')); return; }
  const bn = t.closest<HTMLElement>('.banner'); if (bn && window.matchMedia('(max-width: 760px)').matches) bn.classList.toggle('open');
  const el = t.closest<HTMLElement>('.comp[data-id],.mini[data-id]'); if (el && el.dataset.id) openInfo(el.dataset.id);
  setTimeout(() => { const s = document.querySelector('.level.active'); if (s) updHints(s); }, 60);
}
function onKey(e: KeyboardEvent) {
  const a = document.activeElement as HTMLElement | null;
  if ((e.key === 'Enter' || e.key === ' ') && a) {
    const dd = a.closest?.<HTMLElement>('.dd-b'); if (dd) { e.preventDefault(); e.stopPropagation(); drill(dd.dataset.dd ?? '', { src: dd.dataset.ddid ?? '' }); return; }
    if (a.matches?.('.comp') && a.dataset.id) { e.preventDefault(); openInfo(a.dataset.id); }
  }
  const s = useApp.getState();
  if (e.key === 'Escape') {
    if (s.searchOpen) s.set({ searchOpen: false }); else if (s.sheetOpen) s.set({ sheetOpen: false });
    else if (s.tour != null && !s.popup && !s.full && !s.drawerOpen) endTour(false);
    return;
  }
  /* ← → step the tour while it is on (live stepPage), not while typing or in a layer */
  const typing = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable);
  if (s.tour != null && !typing && !s.popup && !s.full && !s.sheetOpen && !s.drawerOpen && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); tourStep(e.key === 'ArrowRight' ? 1 : -1); }
}

export function App() {
  const lang = useApp((s) => s.lang), S = useApp((s) => s.station), searchOpen = useApp((s) => s.searchOpen);
  useEffect(() => {
    document.documentElement.lang = htmlLang(lang);
    document.title = tx('doc.prefix', lang) + tabn(S, lang) + tx('doc.suffix', lang);
    document.body.dataset.page = S;
  }, [lang, S]);
  const mode = useApp((s) => s.mode), touring = useApp((s) => s.tour != null);
  useEffect(() => { const c = document.body.classList; c.toggle('mode-use', mode === 'use'); c.toggle('mode-train', mode === 'train'); syncTrain(); }, [mode]);
  useEffect(() => { document.body.classList.toggle('in-T4', S.startsWith('T4')); }, [S]);
  useEffect(() => { document.addEventListener('si-station-shown', syncTrain); return () => document.removeEventListener('si-station-shown', syncTrain); }, []);
  useEffect(() => { document.body.classList.toggle('search-open', searchOpen); }, [searchOpen]);
  /* language switch: close full screen (like the live re-instantiation), say so */
  const prevLang = useRef(lang);
  useEffect(() => {
    if (prevLang.current === lang) return;
    prevLang.current = lang;
    useApp.getState().set({ full: null });
    toast(tx('lang.toast', lang));
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    document.addEventListener('click', onDocClickCapture, true);
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey, true);
    /* hash changes from links / the address bar */
    const onHash = () => {
      /* a lang token in the new hash switches language (not saved), like the live lang.js */
      const l = fromURL(location);
      if (l && l !== useApp.getState().lang) { document.documentElement.lang = htmlLang(l); useApp.getState().set({ lang: l, langSource: 'url' }); }
      const r = parseHash(location.hash), moved = isStation(r.station) && r.station !== useApp.getState().station;
      if (moved) go(r.station as string, false);
      if (r.node && part(r.node)) openInfo(r.node);
      else if (r.node && cardId(r.node)) { if (moved) pendingScroll.v = r.node; else scrollToEl(r.node); } };
    addEventListener('hashchange', onHash);
    /* deep link to a part: #T3/llm */
    go(useApp.getState().station, false);
    if (initialNode && part(initialNode)) setTimeout(() => openInfo(initialNode as string), 300);
    /* R16: deep link to a card (what the share button links when scrolled down): #T5/labGradCheck */
    else if (initialNode && cardId(initialNode)) pendingScroll.v = initialNode;
    /* swipe left / right between stations (outside diagrams and controls), like live */
    let x0: number | null = null, y0 = 0, t0 = 0, ok = false;
    const m = document.querySelector('main');
    const ts = (e: TouchEvent) => { const p = e.touches[0]; if (e.touches.length !== 1 || !p) { x0 = null; return; } ok = !(e.target as Element).closest(NO); x0 = p.clientX; y0 = p.clientY; t0 = Date.now(); };
    const te = (e: TouchEvent) => {
      const p = e.changedTouches[0]; if (x0 == null || !ok || !p) return; if (useApp.getState().tour != null) { x0 = null; return; } const dx = p.clientX - x0, dy = p.clientY - y0; x0 = null;
      if (Date.now() - t0 > 650 || Math.abs(dx) < 90 || Math.abs(dy) > Math.abs(dx) * 0.45) return;
      const s = useApp.getState(), i = TABORDER.indexOf(s.station) + (dx < 0 ? 1 : -1), k = TABORDER[i]; if (!k) return;
      go(k); toast((dx < 0 ? tx('nav.nextStop', s.lang) : tx('nav.prevStop', s.lang)) + tabn(k, s.lang));
    };
    m?.addEventListener('touchstart', ts, { passive: true }); m?.addEventListener('touchend', te, { passive: true });
    let rs = 0; const onRs = () => { clearTimeout(rs); rs = window.setTimeout(() => { const s = document.querySelector('.level.active'); if (s) updHints(s); document.querySelectorAll<HTMLElement & { __v?: { apply(): void } }>('.level .m-vw').forEach((h) => h.__v?.apply()); }, 120); };
    addEventListener('resize', onRs);
    return () => {
      document.removeEventListener('click', onDocClickCapture, true); document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey, true);
      removeEventListener('hashchange', onHash); removeEventListener('resize', onRs); m?.removeEventListener('touchstart', ts); m?.removeEventListener('touchend', te);
    };
  }, []);
  /* warm the neighbours once the current station is up */
  useEffect(() => {
    const f = () => { const i = TABORDER.indexOf(S); [TABORDER[i + 1], TABORDER[i - 1]].forEach((k) => k && preload(k, lang)); };
    document.addEventListener('si-station-ready', f, { once: true }); return () => document.removeEventListener('si-station-ready', f);
  }, [S, lang]);
  return (
    <>
      <div id="shellMain" className="shell-main">
        <TopBar />
        <Crumb />
        <main><StationView /></main>
        <footer dangerouslySetInnerHTML={{ __html: footer[lang] }} />
      </div>
      <BottomNav />
      <MoreSheet />
      <Fullscreen />
      <Drawer />
      <BackFab />
      <Toast />
      <Popup />
      {touring ? <Suspense fallback={null}><Tour /></Suspense> : null}
    </>
  );
}
