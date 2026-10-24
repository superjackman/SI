import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useApp } from '../store/app';
import { useShallow } from 'zustand/react/shallow';
import { tx, useT, useTx } from '../i18n/L';
import { GRP, ICON, PATH, TABORDER, tabn } from '../legacy/kb';
import { canBack, go, toast, visited } from '../nav';
import { layer, svgHtml } from './common';
import { closeDrawer } from './drawer';
import { setZoom } from './zoom';
import { toggleTour, tourStep } from '../tour/api';

/** breadcrumb chips from PATH, children as ↓ chips, ↩ when a drill can be undone (live renderCrumb) */
export function Crumb() {
  const t = useT();
  const lang = useApp((s) => s.lang), S = useApp((s) => s.station);
  useApp((s) => s.drill);
  const p = PATH[S] ?? [];
  const ks = TABORDER.filter((k) => { const q = PATH[k] ?? []; return q.length === p.length + 1 && q[p.length - 1] === S; });
  const top = useApp.getState().drill.at(-1);
  const bl = top && canBack() ? t('nav.backTo') + tabn(top.from, lang) : null;
  return (
    <div className="crumb" id="crumb">
      <div className="chips" role="navigation" aria-label={t('nav.crumb')}>
        {bl ? <><button type="button" className="cb-back" data-dback="" aria-label={bl} title={bl} {...svgHtml('back')} /><i className="sep" aria-hidden="true">|</i></> : null}
        {p.map((k, i) => {
          const last = i === p.length - 1, lab = (i === 0 ? '⌂ ' : '') + tabn(k, lang);
          return (
            <Fragment key={k}>
              {i ? <i className="sep" aria-hidden="true">›</i> : null}
              {last ? <b className="chip on" aria-current="page">{lab}</b> : <button type="button" className="chip" data-go={k}>{lab}</button>}
            </Fragment>
          );
        })}
        {ks.length ? <i className="sep dn" aria-hidden="true">↓</i> : null}
        {ks.map((k) => <button key={k} type="button" className="chip down" data-go={k}>{tabn(k, lang)}</button>)}
      </div>
    </div>
  );
}

/** R16: ⛶ full screen toggle in the ☰ menu (where the API is missing it shows the add-to-home-screen tip) */
const fsOn = () => !!(document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement);
/* no state: the drawer re-renders whenever it opens, which is the only time this button is seen */
function FsBtn() {
  const t = useT(), on = fsOn(), l = t(on ? 'pfs.exit' : 'pfs.enter');
  return <button type="button" id="fsBtn" className="icon-btn dw-x dw-fs" aria-label={l} title={l} aria-pressed={on} onClick={() => { void import('../boot/fs').then((m) => m.toggleFS()).catch(() => toast(t('st.loadfail'))); closeDrawer(); }} {...svgHtml('fs')} />;
}

/** R16: share the current page — the panel (and its QR encoder) is a lazy chunk loaded on the first tap */
export const openShare = () => { void import('../share/panel').then((m) => m.openShare()).catch(() => toast(tx('st.loadfail', useApp.getState().lang))); };

/** R22 bottom bar: what to do on this page. Taps load ./dock (the jumps, badges) or the lazy sheets (./dock/Sheets) */
const DockSheets = lazy(() => import('./dock/Sheets'));
const DK = ['toc', 'lab', 'quiz', 'prog', 'next'] as const;
const DKI: Record<string, string> = { toc: '📑', lab: '🧪', quiz: '✅', prog: '✨' };
export function dock(k: string) {
  const s = useApp.getState(), o = { popup: null, cardStack: [], searchOpen: false, full: null };
  /* the button that owns the open sheet closes it; any other button switches straight to its own action */
  if (s.sheetOpen === k) { s.set({ ...o, sheetOpen: false }); return; }
  if (k === 'toc' || k === 'prog') { s.set({ ...o, sheetOpen: k }); return; }
  s.set({ ...o, sheetOpen: false });
  if (k === 'next' && tourStep(1)) return; /* during the tour 下一站 steps it, as the old sheet's ▶ did */
  void import('./dock').then((m) => m.act(k), () => toast(tx('st.loadfail', s.lang)));
}
export function Dock() {
  const t = useT();
  const S = useApp((s) => s.station), sh = useApp((s) => s.sheetOpen);
  return (
    <>
      <nav id="bnav" aria-label={t('nav.main')}>
        {DK.map((k) => (
          <button key={k === 'lab' || k === 'quiz' ? k + S : k} type="button" data-bn={k} className={sh === k ? 'on' : undefined} aria-label={t(`dk.${k}A`)} onClick={() => dock(k)}>
            {DKI[k] ? <i aria-hidden="true">{DKI[k]}</i> : <i aria-hidden="true" {...svgHtml('next')} />}<span>{t(`dk.${k}`)}</span>
          </button>
        ))}
      </nav>
      <div id="sheetMask" onClick={() => useApp.getState().set({ sheetOpen: false })} />
      {sh ? <Suspense fallback={null}><DockSheets k={sh} /></Suspense> : null}
    </>
  );
}

/** live mTour: close the other layers, then start / exit the tour */
export function mTourClick() {
  useApp.getState().set({ full: null, sheetOpen: false, searchOpen: false, popup: null, cardStack: [] });
  toggleTour();
}
/** left drawer: all stations grouped macro → micro, progress, phase, detail level, language, my progress, map & icons,
    search, tour (live r3 drawer; R22: the old 更多 sheet's extras live here now) */
export function Drawer() {
  const t = useT(), tx = useTx();
  const open = useApp((s) => s.drawerOpen), lang = useApp((s) => s.lang), S = useApp((s) => s.station), mode = useApp((s) => s.mode), zoom = useApp((s) => s.zoom), touring = useApp((s) => s.tour != null), set = useApp((s) => s.set), setLang = useApp((s) => s.setLang);
  const ref = useRef<HTMLElement>(null);
  const last = useRef<Element | null>(null);
  const [v, setV] = useState<string[]>([]);
  useEffect(() => {
    document.body.classList.toggle('dw-open', open);
    if (open) {
      setV(visited()); last.current = document.activeElement;
      setTimeout(() => { ref.current?.focus({ preventScroll: true }); ref.current?.querySelector('.dw-it.on')?.scrollIntoView({ block: 'nearest' }); }, 60);
    } else if (last.current instanceof HTMLElement && last.current !== document.body) { last.current.focus({ preventScroll: true }); last.current = null; }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); closeDrawer(); } };
    document.addEventListener('keydown', k, true); return () => document.removeEventListener('keydown', k, true);
  }, [open]);
  /* swipe left closes; the drawer follows the finger */
  const sw = useRef<{ x0: number | null; y0: number; dx: number; t0: number; hz: boolean | null }>({ x0: null, y0: 0, dx: 0, t0: 0, hz: null });
  const close = () => closeDrawer();
  const n = TABORDER.filter((k) => v.includes(k)).length;
  return (
    <>
      <div id="mDrawerMask" className={open ? 'open' : undefined} onClick={close} />
      <aside id="mDrawer" ref={ref} className={open ? 'open' : undefined} role="dialog" aria-modal="true" aria-label={t('nav.allStops')} tabIndex={-1} {...layer(open)}
        onTouchStart={(e) => { const s = sw.current; const p = e.touches[0]; if (e.touches.length !== 1 || !p) return; s.x0 = p.clientX; s.y0 = p.clientY; s.dx = 0; s.t0 = Date.now(); s.hz = null; }}
        onTouchMove={(e) => { const s = sw.current; const p = e.touches[0]; if (s.x0 == null || !p || !ref.current) return; const mx = p.clientX - s.x0, my = p.clientY - s.y0; if (s.hz == null && Math.abs(mx) + Math.abs(my) > 8) s.hz = Math.abs(mx) > Math.abs(my); if (!s.hz) return; s.dx = Math.min(0, mx); ref.current.style.transition = 'none'; ref.current.style.transform = `translateX(${s.dx}px)`; }}
        onTouchEnd={() => { const s = sw.current; if (s.x0 == null || !ref.current) return; s.x0 = null; ref.current.style.transition = ''; const vv = -s.dx / Math.max(1, Date.now() - s.t0); ref.current.style.transform = ''; if (s.hz && (s.dx < -70 || (s.dx < -30 && vv > 0.5))) close(); }}>
        <div className="dw-head"><b>🧭 {t('nav.allStops')}</b><span className="dw-pt" id="dwProgTxt">✓ {n} / {TABORDER.length}</span><FsBtn /><button type="button" className="icon-btn dw-x" aria-label={t('ui.close')} title={t('ui.close')} onClick={close} {...svgHtml('x')} /></div>
        <div className="dw-prog" aria-hidden="true"><i id="dwProgBar" style={{ width: (n / TABORDER.length * 100) + '%' }} /></div>
        <nav id="dwList" aria-label={tx({ zh: '站点：远看 → 细看', en: 'Stops: macro → micro' })}>
          {GRP.map(([ic, name, ks]) => {
            const seen = ks.filter((k) => v.includes(k)).length, base = Math.min(...ks.map((k) => PATH[k]?.length ?? 0));
            return (
              <div className="dw-g" key={ic}>
                <div className="dw-gh"><i aria-hidden="true">{ic}</i><span>{tx(name)}</span><small>{seen}/{ks.length}</small></div>
                <ul>{ks.map((k) => {
                  const i = TABORDER.indexOf(k), on = k === S, vs = v.includes(k), d = (PATH[k]?.length ?? 0) - base;
                  const st = on ? t('nav.current') : vs ? t('nav.seen') : '';
                  return (
                    <li key={k}><button type="button" className={'dw-it' + (on ? ' on' : '') + (vs ? ' v' : '') + (d > 0 ? ' sub' : '')} data-dw={k} aria-current={on ? 'page' : undefined} aria-label={`${i + 1}. ${tabn(k, lang)}${st}`}
                      onClick={() => closeDrawer(() => { if (k !== useApp.getState().station) go(k); else window.scrollTo({ top: 0, behavior: 'smooth' }); })}>
                      <span className="dw-n">{i + 1}</span><i aria-hidden="true">{ICON[k]}</i><b>{tabn(k, lang)}</b><span className="dw-s" aria-hidden="true">{on ? '●' : vs ? '✓' : ''}</span>
                    </button></li>
                  );
                })}</ul>
              </div>
            );
          })}
        </nav>
        <div className="dw-tools">
          <div className="dw-row" role="group" aria-label={t('mode.which')}><div className="dw-seg">
            {(['use', 'train'] as const).map((m) => <button key={m} type="button" data-dwmode={m} className={mode === m ? 'on' : undefined} aria-pressed={mode === m} onClick={() => set({ mode: m })}>{t(m === 'use' ? 'mode.use' : 'mode.train')}</button>)}
          </div></div>
          <div className="dw-row" role="group" aria-label={t('zoom.level')}><div className="dw-seg" id="zoom">
            {([1, 2, 3] as const).map((z) => <button key={z} type="button" data-z={z} className={zoom === z ? 'on' : undefined} aria-pressed={zoom === z} onClick={() => setZoom(z, true)}>{t(`zoom.${z}`)}</button>)}
          </div></div>
          <div className="dw-row" role="group" aria-label="Language"><div className="dw-seg">
            {(['zh', 'en'] as const).map((l) => <button key={l} type="button" data-setlang={l} lang={l === 'zh' ? 'zh-CN' : 'en'} className={lang === l ? 'on' : undefined} aria-pressed={lang === l} onClick={() => { if (l !== lang) closeDrawer(() => setLang(l)); }}>{l === 'zh' ? '中文' : 'English'}</button>)}
          </div></div>
          <div className="dw-row">
            <button type="button" className="dw-act" id="dwProg" onClick={() => closeDrawer(() => set({ sheetOpen: 'prog' }))}><i aria-hidden="true">✨</i><span>{t('dw.prog')}</span></button>
            <button type="button" className="dw-act" id="dwMore" onClick={() => closeDrawer(() => set({ sheetOpen: 'more' }))}><i aria-hidden="true">🗺️</i><span>{t('dw.more')}</span></button>
          </div>
          <div className="dw-row">
            <button type="button" className="dw-act" id="dwSearch" aria-label={t('search.parts')} onClick={() => closeDrawer(() => set({ searchOpen: true }))}><i {...svgHtml('search')} /><span>{t('dw.search')}</span></button>
            <button type="button" className={'dw-act' + (touring ? ' on' : '')} id="mTour" aria-pressed={touring} aria-label={t(touring ? 'tour.exit' : 'tour.start')} onClick={() => closeDrawer(mTourClick)}><i aria-hidden="true">🎬</i><span>{t(touring ? 'tour.exit' : 'tour.tour')}</span></button>
          </div>
        </div>
      </aside>
    </>
  );
}

/** floating ↩ when the crumb's ↩ is scrolled away (live #mBackF) */
export function BackFab() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const st = useApp(useShallow((s) => [s.drill, s.popup, s.drawerOpen, s.full, s.sheetOpen, s.station] as const));
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const upd = () => { if (raf) return; raf = requestAnimationFrame(() => {
      raf = 0; const s = useApp.getState();
      const cb = document.querySelector('#crumb .cb-back'), r = cb?.getBoundingClientRect(), tb = document.getElementById('topbar')?.offsetHeight ?? 52;
      setShow(canBack() && !(r && r.bottom > tb + 2 && r.top < window.innerHeight) && !s.popup && !s.drawerOpen && !s.full && !s.sheetOpen);
    }); };
    upd(); addEventListener('scroll', upd, { passive: true });
    return () => { removeEventListener('scroll', upd); cancelAnimationFrame(raf); };
  }, st); // eslint-disable-line react-hooks/exhaustive-deps
  const top = useApp.getState().drill.at(-1);
  const lab = top ? t('nav.backTo') + tabn(top.from, lang) : (lang === 'en' ? 'Back' : '返回');
  return <button type="button" id="mBackF" className="m-backf" data-dback="" hidden={!show} aria-label={lab} title={lab} {...svgHtml('back')} />;
}

export function Toast() {
  const toast = useApp((s) => s.toast);
  const [txt, setTxt] = useState('');
  useEffect(() => { if (toast) setTxt(toast.text); }, [toast]);
  return <div id="toast" role="status" className={toast ? 'show' : undefined}>{txt}</div>;
}
