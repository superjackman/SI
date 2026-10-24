import { Fragment, useEffect, useRef, useState } from 'react';
import { useApp } from '../store/app';
import { useShallow } from 'zustand/react/shallow';
import { tx, useT, useTx } from '../i18n/L';
import { GRP, GROUP, ICON, PATH, TABORDER, tabn } from '../legacy/kb';
import { canBack, go, jumpTo, toast, visited } from '../nav';
import { layer, svgHtml } from './common';
import { closeDrawer } from './drawer';
import { setZoom } from './zoom';
import { Tree } from './Tree';
import { quizScore } from '../station/quiz';
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

const BN: [string, string, { zh: string; en: string }][] = [
  ['T1', '🏠', { zh: '应用', en: 'App' }], ['T2', '🤖', { zh: 'Agent', en: 'Agent' }], ['T3', '🧠', { zh: '大模型', en: 'LLM' }], ['T4', '🧩', { zh: 'Transformer', en: 'Transformer' }],
];
const MORE_LBL: Record<string, { zh: string; en: string }> = { N: { zh: '入门', en: 'Basics' }, T5: { zh: 'MoE', en: 'MoE' }, T6: { zh: '多模态', en: 'Multimodal' }, T7: { zh: '训练', en: 'Training' }, T8: { zh: '速查', en: 'Reference' }, U: { zh: '用法', en: 'Usage' }, Ua: { zh: '一起干', en: 'Together' }, Ub: { zh: '自己干', en: 'Solo' }, Uc: { zh: '装本事', en: 'Extend' }, Ud: { zh: '用得好', en: 'Use well' }, Up: { zh: '产品', en: 'Products' }, K1: { zh: '微积分', en: 'Calculus' }, K2: { zh: '线代', en: 'Lin. alg.' }, K3: { zh: '概率', en: 'Probability' }, K4: { zh: '优化', en: 'Optimize' }, K5: { zh: '证明', en: 'Proofs' } };
export function BottomNav() {
  const t = useT(), tx = useTx();
  const S = useApp((s) => s.station), sh = useApp((s) => s.sheetOpen), set = useApp((s) => s.set);
  const g = GROUP[S];
  const close = { popup: null, cardStack: [], searchOpen: false, full: null };
  return (
    <nav id="bnav" aria-label={t('nav.main')}>
      {BN.map(([k, ic, lb]) => {
        const on = !sh && g === k;
        return (
          <button key={k} data-bn={k} className={on ? 'on' : undefined} aria-current={on ? 'page' : 'false'}
            onClick={() => { set({ ...close, sheetOpen: false }); if (g === k && S === k) window.scrollTo({ top: 0, behavior: 'smooth' }); else go(k); }}>
            <i aria-hidden="true">{ic}</i><span>{tx(lb)}</span>
          </button>
        );
      })}
      <button data-bn="more" className={sh || g === 'more' ? 'on' : undefined} aria-controls="moreSheet" aria-expanded={sh ? 'true' : 'false'}
        onClick={() => set({ ...close, sheetOpen: !sh })}>
        <i aria-hidden="true">⋯</i><span>{g === 'more' && !sh ? tx(MORE_LBL[S] ?? { zh: tabn(S, 'zh').slice(0, 4), en: tabn(S, 'en').slice(0, 4) }) : t('nav.more')}</span>
      </button>
    </nav>
  );
}

const SUB: Record<string, { zh: string; en: string }> = {
  U: { zh: '对话、编程、后台、例程、MCP、提示词', en: 'Chat, coding, background, routines, MCP, prompts' },
  N: { zh: '神经元、反向传播、梯度下降', en: 'Neurons, backprop, gradient descent' }, T5: { zh: 'MoE、KV 缓存、量化、LoRA', en: 'MoE, KV cache, quantization, LoRA' },
  T6: { zh: '看图、听声、画画、做视频', en: 'See, hear, draw, make video' }, T7: { zh: '预训练、微调、强化学习', en: 'Pretraining, fine-tuning, RL' }, T8: { zh: '关系总图、术语表、进度', en: 'Overall map, glossary, progress' },
};
/** live sheet progress text: "已看 n / N 站 · 测验答对 c / Q（已答 d）" (N, Q from TABORDER / the quiz key) */
function useProgress(active: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => { const f = () => setV((x) => x + 1); document.addEventListener('si-progress', f); return () => document.removeEventListener('si-progress', f); }, []);
  useEffect(() => { if (active) setV((x) => x + 1); }, [active]);
  return v;
}
const ModeBtns = () => {
  const t = useT(), mode = useApp((s) => s.mode), set = useApp((s) => s.set);
  return (
    <div className="mode" id="mode" title={t('mode.title')}>
      {(['use', 'train'] as const).map((m) => <button key={m} data-mode={m} className={mode === m ? 'active' : undefined} onClick={() => set({ mode: m })}>{t(m === 'use' ? 'mode.use' : 'mode.train')}</button>)}
    </div>
  );
};
/** 更多 sheet — all live sections: stops, language, phase, detail level, progress, icon guide, prev/next, progress card, learning map */
export function MoreSheet() {
  const t = useT(), tx = useTx();
  const open = useApp((s) => s.sheetOpen), lang = useApp((s) => s.lang), S = useApp((s) => s.station), zoom = useApp((s) => s.zoom), set = useApp((s) => s.set), setLang = useApp((s) => s.setLang);
  useEffect(() => { document.body.classList.toggle('sheet-open', open); }, [open]);
  useProgress(open);
  const [mapOn, setMapOn] = useState(false);
  /* banners + icon guide are lazy (R17 first-load budget): fetched when the sheet first opens */
  const [sc, setSc] = useState<typeof import('./sheetContent') | null>(null);
  useEffect(() => { if (open && !sc) void import('./sheetContent').then((m) => setSc(m), () => undefined); }, [open, sc]);
  const i = TABORDER.indexOf(S);
  const close = () => set({ sheetOpen: false });
  const pick = (k: string) => { close(); go(k); };
  const step = (d: number) => { close(); if (tourStep(d)) return; const k = TABORDER[i + d]; if (k) go(k); };
  const vis = visited(), n = TABORDER.filter((k) => vis.includes(k)).length, q = quizScore();
  const ptxt = t('sh.viewed') + n + ' / ' + TABORDER.length + t('sh.quizC') + q[0] + ' / ' + q[2] + (q[1] < q[2] ? t('sh.answered') + ' ' + q[1] + t('sh.answeredEnd') : '');
  /* the learning map's links: a stop, or a card on a stop (live [data-sj] handler), then the sheet closes */
  const onTree = (e: React.MouseEvent) => {
    const el = e.target as Element, sj = el.closest<HTMLElement>('[data-sj]'), g = el.closest<HTMLElement>('[data-go]');
    if (sj) { e.preventDefault(); const sp = sj.dataset.sp ?? S; close(); if (sp !== useApp.getState().station) go(sp, false); jumpTo(sj.dataset.sj ?? ''); return; }
    if (g) { e.preventDefault(); pick(g.dataset.go ?? S); }
  };
  return (
    <>
      <div id="sheetMask" className={open ? 'open' : undefined} onClick={close} />
      <div id="moreSheet" className={'sheet' + (open ? ' open' : '')} role="dialog" aria-modal="true" aria-label={t('nav.more')} {...layer(open)}>
        <div className="sh-grip" aria-hidden="true"><i /></div>
        <div className="sh-head"><b>⋯ {t('nav.more')}</b><button className="icon-btn sh-x" aria-label={t('ui.close')} title={t('ui.close')} onClick={close} {...svgHtml('x')} /></div>
        <div className="sh-sec"><div className="sh-lbl">{t('sh.stops')}</div>
          <div className="sh-st" id="shStations">
            {['U', 'N', 'T5', 'T6', 'T7', 'T8'].map((k) => (
              <button key={k} type="button" className={'st-b' + (k === S ? ' on' : '')} data-st={k} onClick={() => pick(k)}><i aria-hidden="true">{ICON[k]}</i><b>{tabn(k, lang)}</b><small>{SUB[k] ? tx(SUB[k]) : ''}</small></button>
            ))}
            <div className="st-all">{TABORDER.map((k, j) => <button key={k} type="button" className={'chip' + (k === S ? ' on' : '')} data-st={k} onClick={() => pick(k)}>{j + 1}. {tabn(k, lang)}</button>)}</div>
          </div>
        </div>
        <div className="sh-sec"><div className="sh-lbl">{t('sh.lang')}</div>
          <div className="sh-lang" role="group" aria-label="Language">
            {(['zh', 'en'] as const).map((l) => <button key={l} type="button" className={'btn' + (lang === l ? ' on' : '')} data-setlang={l} lang={l === 'zh' ? 'zh-CN' : 'en'} aria-pressed={lang === l} onClick={() => setLang(l)}>{l === 'zh' ? '中文' : 'English'}</button>)}
          </div>
        </div>
        <div className="sh-sec"><button type="button" className="btn wide" id="shShare" onClick={() => { close(); openShare(); }}><span {...svgHtml('share')} />{t('share.title')}</button></div>
        <div className="sh-sec"><div className="sh-lbl">{t('mode.which')}</div>
          <div id="slotMode"><ModeBtns /></div>
          <p className="sh-small">{t('mode.small')}</p>
          <div id="slotBanner">{sc?.BANNERS.map((b) => <div key={b.id} className={'banner ' + b.cls} id={b.id} role="note" dangerouslySetInnerHTML={{ __html: b[lang] }} />)}</div>
        </div>
        <div className="sh-sec"><div className="sh-lbl">{t('zoom.level')}</div>
          <div id="slotZoom"><div className="zoom" id="zoom" role="group" aria-label={t('zoom.level')}>
            {([1, 2, 3] as const).map((z) => <button key={z} data-z={z} className={zoom === z ? 'active' : undefined} onClick={() => setZoom(z, true)}>{t(`zoom.${z}`)}</button>)}
          </div></div>
          <p className="sh-small">{t('zoom.small')}</p>
        </div>
        <div className="sh-sec"><div className="sh-lbl">{t('sh.prog')}</div><div className="sh-prog"><div className="prog-bar"><i id="shProgBar" style={{ width: (n / TABORDER.length * 100) + '%' }} /></div><div id="shProgTxt" className="sh-small">{ptxt}</div></div></div>
        <div className="sh-sec"><div className="sh-lbl">{t('sh.legend')}</div><p className="ic-leg" dangerouslySetInnerHTML={{ __html: sc ? sc.LEGEND[lang] : '' }} /></div>
        <div className="sh-sec sh-pn">
          <button className="btn" id="shPrev" disabled={i <= 0} onClick={() => step(-1)}><span {...svgHtml('prev')} />{t('sh.prev')}</button>
          <button className="btn primary" id="shNext" disabled={i >= TABORDER.length - 1} onClick={() => step(1)}>{t('sh.next')}<span {...svgHtml('next')} /></button>
        </div>
        <div className="sh-sec"><button className="btn wide" id="shProgDetail" onClick={() => { close(); jumpTo('progCard', 'T8'); }}>{t('sh.detail')}</button>
          <button className="btn wide" id="shProgCard" data-share-ch="progress" onClick={() => { close(); void import('../viral/cards').then((m) => m.openProgress(), () => undefined); }}>{t('sh.pcard')}</button></div>
        <div className="sh-sec"><details className="sh-map" id="shMap" onToggle={(e) => setMapOn((e.target as HTMLDetailsElement).open)}><summary>{t('sh.map')}</summary>
          <div id="slotTree" onClick={onTree}><Tree active={open && mapOn} /></div>
        </details></div>
      </div>
    </>
  );
}

/** live mTour: close the other layers, then start / exit the tour */
export function mTourClick() {
  useApp.getState().set({ full: null, sheetOpen: false, searchOpen: false, popup: null, cardStack: [] });
  toggleTour();
}
/** left drawer: all stations grouped macro → micro, progress, phase, language, search, tour (live r3 drawer) */
export function Drawer() {
  const t = useT(), tx = useTx();
  const open = useApp((s) => s.drawerOpen), lang = useApp((s) => s.lang), S = useApp((s) => s.station), mode = useApp((s) => s.mode), touring = useApp((s) => s.tour != null), set = useApp((s) => s.set), setLang = useApp((s) => s.setLang);
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
        <nav id="dwList" aria-label={tx({ zh: '站点：宏观 → 微观', en: 'Stops: macro → micro' })}>
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
          <div className="dw-row" role="group" aria-label="Language"><div className="dw-seg">
            {(['zh', 'en'] as const).map((l) => <button key={l} type="button" data-setlang={l} lang={l === 'zh' ? 'zh-CN' : 'en'} className={lang === l ? 'on' : undefined} aria-pressed={lang === l} onClick={() => { if (l !== lang) closeDrawer(() => setLang(l)); }}>{l === 'zh' ? '中文' : 'English'}</button>)}
          </div></div>
          <div className="dw-row">
            <button type="button" className="dw-act" id="dwSearch" onClick={() => closeDrawer(() => set({ searchOpen: true }))}><i {...svgHtml('search')} /><span>{t('search.parts')}</span></button>
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
