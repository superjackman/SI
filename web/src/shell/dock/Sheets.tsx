/* R22: the sheets behind the bottom bar (📑 contents, 🧪 pick a lab, ✨ progress, the last-stop sheet) and the ☰ menu's
   🗺️ map & icons sheet (what was left of the old 更多 sheet). Lazy chunk: nothing here is in the first load. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp, type Sheet } from '../../store/app';
import { useT } from '../../i18n/L';
import type { Lang } from '../../i18n/types';
import { TABORDER, tabn } from '../../legacy/kb';
import { go, jumpTo, toast, visited } from '../../nav';
import { svgHtml } from '../common';
import { Tree } from '../Tree';
import { quizScore } from '../../station/quiz';
import { labsOf, openLab, route, ROUTE_S, setRoute } from '../../onboard';
import { O, ROUTE, LABN } from '../../onboard/strings';
import { progress } from '../../viral/prog';
import { fill } from '../../viral/strings';
import { curIdx, jumpEl, labTitle, progBadge, sec, tocItems } from './index';
import { D } from './strings';

const cards = () => import('../../viral/cards');
const prog = (cert = false) => { void cards().then((m) => m.openProgress(cert), () => undefined); };

function Toc({ L, close }: { L: Lang; close: () => void }) {
  const items = useMemo(() => { const x = sec(); return x ? tocItems(x, L) : []; }, [L]);
  const line = (document.getElementById('topbar')?.offsetHeight ?? 52) + 90;
  const cur = curIdx(items.map((i) => (i.el.offsetParent ? i.el.getBoundingClientRect().top : null)), line);
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => { ref.current?.querySelector('.on')?.scrollIntoView({ block: 'nearest' }); }, []);
  return (
    <>
      <p className="sh-small dk-tip">{D.tocTip[L]}</p>
      <ol className="dk-list" id="dkToc" ref={ref}>
        {items.map((it, i) => (
          <li key={i}><button type="button" className={'dk-it k-' + it.k + (i === cur ? ' on' : '')} aria-current={i === cur ? 'location' : undefined} onClick={() => { close(); jumpEl(it.el); }}>
            <i aria-hidden="true">{i + 1}</i><b>{it.t}</b>{i === cur ? <small>{D.here[L]}</small> : null}
          </button></li>
        ))}
      </ol>
    </>
  );
}

function Labs({ L, S, close }: { L: Lang; S: string; close: () => void }) {
  const x = sec(), labs = x ? labsOf(x) : [], r = route(), ri = r === 'kid' ? ROUTE_S.indexOf(S) : -1, rl = ri >= 0 ? ROUTE[ri]![1] : null;
  const ls = rl ? [...labs.filter((e) => e.id === rl), ...labs.filter((e) => e.id !== rl)] : labs;
  return (
    <>
      <p className="sh-small dk-tip">{D.labTip[L]}</p>
      <ol className="dk-list" id="dkLabs">
        {ls.map((e, i) => (
          <li key={e.id}><button type="button" className="dk-it k-lab" data-lab={e.id} onClick={() => { close(); openLab(e.id); }}>
            <i aria-hidden="true">🧪</i><b>{labTitle(e)}</b>{e.id === rl || (i === 0 && rl) ? <small className="rt">{D.rLab[L]}</small> : null}
          </button></li>
        ))}
      </ol>
    </>
  );
}

function RouteList({ L, S, lit, close }: { L: Lang; S: string; lit: (s: string) => boolean; close: () => void }) {
  return (
    <ol className="ob-rl dk-rl">
      {ROUTE_S.map((s, i) => (
        <li key={s} className={s === S ? 'on' : lit(s) ? 'ok' : undefined}><button type="button" data-ob="route-go" aria-current={s === S ? 'step' : undefined} onClick={() => { close(); if (s !== S) go(s); }}>
          <i>{s === S ? '●' : lit(s) ? '✓' : i + 1}</i><span>{tabn(s, L)}</span><small>{LABN[ROUTE[i]![1]]![L]}</small>
        </button></li>
      ))}
    </ol>
  );
}

function Prog({ L, S, close }: { L: Lang; S: string; close: () => void }) {
  const t = useT();
  const [, setV] = useState(0);
  useEffect(() => { const f = () => setV((v) => v + 1); document.addEventListener('si-progress', f); document.addEventListener('si-route', f); return () => { document.removeEventListener('si-progress', f); document.removeEventListener('si-route', f); }; }, []);
  const p = progress(), lit = (s: string) => !!p.stops.find((x) => x.S === s)?.lit, r = route(), g = progBadge(lit, r);
  const vis = visited(), n = TABORDER.filter((k) => vis.includes(k)).length, q = quizScore();
  const ptxt = t('sh.viewed') + n + ' / ' + TABORDER.length + t('sh.quizC') + q[0] + ' / ' + q[2] + (q[1] < q[2] ? t('sh.answered') + ' ' + q[1] + t('sh.answeredEnd') : '');
  return (
    <>
      <div className="sh-sec dk-big"><b id="dkLit">✨ {fill(D.lit[L], { x: p.lit, t: p.total })}</b>
        <div className="sh-prog"><div className="prog-bar"><i id="shProgBar" style={{ width: (p.lit / p.total * 100) + '%' }} /></div><div id="shProgTxt" className="sh-small">{ptxt}</div></div>
        <p className="sh-small">{D.how[L]}</p>
      </div>
      {r === 'kid' ? <div className="sh-sec"><div className="sh-lbl" id="dkRh">{fill(D.rH[L], { k: g.k })}</div><RouteList L={L} S={S} lit={lit} close={close} /></div> : null}
      <div className="sh-sec dk-acts">
        {p.cert ? <button type="button" className="btn wide primary" id="dkCert" data-share-ch="cert" onClick={() => { close(); prog(true); }}>{D.certGo[L]}</button> : <p className="sh-small" id="dkLeft">{fill(D.certLeft[L], { n: p.total - p.lit })}</p>}
        <button type="button" className={'btn wide' + (p.cert ? '' : ' primary')} id="shProgCard" data-share-ch="progress" onClick={() => { close(); prog(); }}>🏅 {t('sh.pcard')}</button>
        <button type="button" className="btn wide" id="shProgDetail" onClick={() => { close(); jumpTo('progCard', 'T8'); }}>{t('sh.detail')}</button>
        <button type="button" className="ob-lnk dk-rt" id="dkRoute" onClick={() => setRoute(r === 'kid' ? 'all' : 'kid')}>{r === 'kid' ? O.rAll[L] : O.rKid[L]}</button>
      </div>
    </>
  );
}

function Last({ L, S, close, set }: { L: Lang; S: string; close: () => void; set: (s: Sheet) => void }) {
  const p = progress(), lit = (s: string) => !!p.stops.find((x) => x.S === s)?.lit, r = route();
  if (r === 'kid' && ROUTE_S.indexOf(S) === ROUTE_S.length - 1) {
    const left = ROUTE_S.filter((s) => !lit(s));
    return (
      <div className="dk-acts">
        <p className="dk-p">{left.length ? fill(O.rLeft[L], { n: left.length }) : O.rEnd[L]}</p>
        {left.length
          ? <button type="button" className="btn wide primary" id="dkGo" onClick={() => { close(); go(left[0]!); }}>{tabn(left[0]!, L)} ›</button>
          : <button type="button" className="btn wide primary" id="dkGo" onClick={() => { setRoute('all'); close(); const k = TABORDER.find((s) => !lit(s)); if (k) go(k); else toast(D.lastH[L]); }}>{O.rGoAll[L]}</button>}
        <button type="button" className="btn wide" id="dkSeeProg" onClick={() => set('prog')}>{D.seeProg[L]}</button>
      </div>
    );
  }
  return (
    <div className="dk-acts">
      <p className="dk-p">{D.lastT[L]}</p>
      {p.cert ? <button type="button" className="btn wide primary" id="dkCert" data-share-ch="cert" onClick={() => { close(); prog(true); }}>{D.certGo[L]}</button> : null}
      <button type="button" className={'btn wide' + (p.cert ? '' : ' primary')} id="dkSeeProg" onClick={() => set('prog')}>{D.seeProg[L]}</button>
      <button type="button" className="btn wide" id="dkFirst" onClick={() => { close(); go(TABORDER[0]!, 'top'); }}>{D.toFirst[L]}</button>
    </div>
  );
}

function More({ L, S, close }: { L: Lang; S: string; close: () => void }) {
  const t = useT(), mode = useApp((s) => s.mode), set = useApp((s) => s.set);
  const [sc, setSc] = useState<typeof import('../sheetContent') | null>(null);
  useEffect(() => { void import('../sheetContent').then((m) => setSc(m), () => undefined); }, []);
  const [mapOn, setMapOn] = useState(false);
  /* the learning map's links: a stop, or a card on a stop, then the sheet closes */
  const onTree = (e: React.MouseEvent) => {
    const el = e.target as Element, sj = el.closest<HTMLElement>('[data-sj]'), g = el.closest<HTMLElement>('[data-go]');
    if (sj) { e.preventDefault(); const sp = sj.dataset.sp ?? S; close(); if (sp !== useApp.getState().station) go(sp, false); jumpTo(sj.dataset.sj ?? ''); return; }
    if (g) { e.preventDefault(); close(); go(g.dataset.go ?? S); }
  };
  return (
    <>
      <div className="sh-sec"><div className="sh-lbl">{t('mode.which')}</div>
        <div id="slotMode"><div className="mode" id="mode" title={t('mode.title')}>
          {(['use', 'train'] as const).map((m) => <button key={m} type="button" data-mode={m} className={mode === m ? 'active' : undefined} onClick={() => set({ mode: m })}>{t(m === 'use' ? 'mode.use' : 'mode.train')}</button>)}
        </div></div>
        <p className="sh-small">{t('mode.small')}</p>
        <div id="slotBanner">{sc?.BANNERS.map((b) => <div key={b.id} className={'banner ' + b.cls} id={b.id} role="note" dangerouslySetInnerHTML={{ __html: b[L] }} />)}</div>
      </div>
      <div className="sh-sec"><div className="sh-lbl">{t('sh.legend')}</div><p className="ic-leg" dangerouslySetInnerHTML={{ __html: sc ? sc.LEGEND[L] : '' }} /></div>
      <div className="sh-sec"><details className="sh-map" id="shMap" onToggle={(e) => setMapOn((e.target as HTMLDetailsElement).open)}><summary>{t('sh.map')}</summary>
        <div id="slotTree" onClick={onTree}><Tree active={mapOn} /></div>
      </details></div>
    </>
  );
}

export default function Sheets({ k }: { k: Sheet }) {
  const t = useT();
  const L = useApp((s) => s.lang), S = useApp((s) => s.station), set = useApp((s) => s.set);
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLDivElement>(null), S0 = useRef(S);
  const close = () => set({ sheetOpen: false });
  useEffect(() => {
    const back = document.activeElement;
    document.body.classList.add('sheet-open');
    const r = requestAnimationFrame(() => { setOn(true); ref.current?.focus({ preventScroll: true }); });
    return () => { cancelAnimationFrame(r); document.body.classList.remove('sheet-open'); if (back instanceof HTMLElement && back.isConnected && back.closest('#bnav')) back.focus({ preventScroll: true }); };
  }, []);
  /* a new stop closes the sheet (its contents belong to the old one) */
  useEffect(() => { if (S !== S0.current) close(); }, [S]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { ref.current?.scrollTo({ top: 0 }); }, [k]);
  const r = route(), last = k === 'next' && r === 'kid' && ROUTE_S.indexOf(S) === ROUTE_S.length - 1;
  const head = { toc: D.tocH, lab: D.labH, prog: D.progH, next: last ? D.rEndH : D.lastH, more: D.moreH }[k][L];
  return (
    <>
      <div id="dkSheet" ref={ref} className={'sheet dk-sheet' + (on ? ' open' : '')} data-k={k} role="dialog" aria-modal="true" aria-label={head} tabIndex={-1}>
        <div className="sh-grip" aria-hidden="true"><i /></div>
        <div className="sh-head"><b>{head}</b><button type="button" className="icon-btn sh-x" aria-label={t('ui.close')} title={t('ui.close')} onClick={close} {...svgHtml('x')} /></div>
        {k === 'toc' ? <Toc L={L} close={close} /> : k === 'lab' ? <Labs L={L} S={S} close={close} /> : k === 'prog' ? <Prog L={L} S={S} close={close} /> : k === 'next' ? <Last L={L} S={S} close={close} set={(x) => set({ sheetOpen: x })} /> : <More L={L} S={S} close={close} />}
      </div>
    </>
  );
}
