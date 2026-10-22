/* Tour panel (live #tour, mobile layout): header with step / ‹why› toggle / ×, 15 dots, title, text, the "why" and
   the part chips (data-open / data-jump, handled by the page's delegated clicks), ◀ / ▶. Lazy chunk with its data. */
import { useEffect, useState } from 'react';
import { useApp } from '../store/app';
import type { Lang } from '../i18n/types';
import { go, openCollapsed } from '../nav';
import { IC } from '../shell/common';
import { clearHl, endTour, tourGo } from './api';

interface Step { p: string; ids: string[]; lab: string | null; n: string; t: string; d: string; w: string; f: string }
interface TourData { ui: { why: string; collapse: string; next: string; done: string; dots: string[]; x: string; prev: string; aria: string }; steps: Step[] }
const data = import.meta.glob<TourData>('../legacy/gen/tour.*.json', { import: 'default' });
let moreOpen = false;
const SVGNS = 'http://www.w3.org/2000/svg';
const tbH = () => document.getElementById('topbar')?.offsetHeight ?? 52;
const bnH = () => document.getElementById('bnav')?.offsetHeight ?? 58;

/** light up the step's parts on its station; returns whether anything was found */
function highlight(s: Step): boolean {
  const sec = document.getElementById(s.p); if (!sec) return false;
  let first = false;
  s.ids.forEach((id) => sec.querySelectorAll<HTMLElement | SVGElement>(`[data-id="${CSS.escape(id)}"]`).forEach((el) => {
    if (el.closest('.zhide')) return;
    if (el.namespaceURI === SVGNS) { if (!el.classList.contains('run')) { el.classList.add('run'); el.dataset.tourrun = '1'; } }
    else el.classList.add('tour-hl');
    first = true;
  }));
  return first;
}
/** live __mTourFocus: bring the highlighted diagram parts (or the first card) into view above the tour panel */
function focus(ids: string[], sec: HTMLElement) {
  const stage = sec.querySelector(':scope>.m-stage'); let els: Element[] = [];
  if (stage) ids.forEach((id) => stage.querySelectorAll(`.comp[data-id="${CSS.escape(id)}"]`).forEach((e) => els.push(e)));
  if (!els.length) {
    const all: Element[] = [];
    ids.forEach((id) => sec.querySelectorAll(`[data-id="${CSS.escape(id)}"]`).forEach((e) => { if (!e.closest('.zhide')) all.push(e); }));
    const a0 = all[0]; if (!a0) return;
    openCollapsed(a0);
    const card = a0.closest('.card'); els = all.filter((e) => card && card.contains(e)); if (!els.length) els = [a0];
  }
  const host = els[0]?.closest<HTMLElement & { __v?: { reset(a?: boolean): void } }>('.m-vw'); host?.__v?.reset(false);
  let top = Infinity, bot = -Infinity;
  els.forEach((e) => { const r = e.getBoundingClientRect(); if (!r.width && !r.height) return; top = Math.min(top, r.top); bot = Math.max(bot, r.bottom); });
  if (top === Infinity) return;
  const tp = document.getElementById('tour'), avail = window.innerHeight - tbH() - (tp ? tp.offsetHeight : 0) - bnH() - 28;
  let y = window.pageYOffset + top - tbH() - 14;
  if (bot - top < avail) y -= Math.min(60, (avail - (bot - top)) / 3);
  window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
}

export default function Tour() {
  const i = useApp((s) => s.tour), lang = useApp((s) => s.lang);
  const [D, setD] = useState<{ lang: Lang; d: TourData } | null>(null);
  const [more, setMore] = useState(moreOpen);
  useEffect(() => {
    let ok = true; const f = data[`../legacy/gen/tour.${lang}.json`];
    void f?.().then((d) => { if (ok) setD({ lang, d }); });
    return () => { ok = false; };
  }, [lang]);
  const d = D && D.lang === lang ? D.d : null;
  const s = d && i != null ? d.steps[i] : null;
  useEffect(() => {
    if (!s) return;
    if (useApp.getState().station !== s.p) go(s.p, false);
    clearHl();
    let raf = 0;
    const run = () => {
      if (document.documentElement.dataset.siShown !== `${s.p}.${lang}`) return false;
      clearHl();
      if (highlight(s)) { const sec = document.getElementById(s.p); raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => { if (sec) focus(s.ids, sec); }); }); }
      return true;
    };
    /* a station shown afresh mounts its labs after it is shown; a lab that resets its diagram on start (the T2 agent
       walkthrough clears every .run) would put out the step's parts. Live keeps a visited station's labs running, so its
       parts stay lit: light them again once the labs are in (no re-scroll). */
    let mo: MutationObserver | null = null, moT = 0;
    const relight = (e: Event) => {
      if (document.documentElement.dataset.siReady !== `${s.p}.${lang}`) return;
      /* live: a station's labs start on its first visit only (they may clear the step's parts then); on a revisit the
         page is as it was, parts stay lit. Here the labs start on every visit, so only a revisit is protected. */
      if (!(e as CustomEvent<{ again?: boolean }>).detail?.again) return;
      const sec = document.getElementById(s.p); if (!sec) return;
      /* labs start lazily just after this (first frame / when in view): for a short while, put back a part whose .run a
         starting lab removed. After that a lab the reader taps may clear it, as on live. */
      mo?.disconnect(); clearTimeout(moT);
      mo = new MutationObserver((ms) => ms.forEach((m) => { const g = m.target as SVGElement; if (g.dataset.tourrun && !g.classList.contains('run')) g.classList.add('run'); }));
      mo.observe(sec, { subtree: true, attributes: true, attributeFilter: ['class'] });
      moT = window.setTimeout(() => mo?.disconnect(), 1500);
    };
    document.addEventListener('si-station-ready', relight);
    const f = () => { if (run()) document.removeEventListener('si-station-shown', f); };
    if (!run()) document.addEventListener('si-station-shown', f);
    return () => { document.removeEventListener('si-station-shown', f); document.removeEventListener('si-station-ready', relight); mo?.disconnect(); clearTimeout(moT); cancelAnimationFrame(raf); };
  }, [s, lang]);
  useEffect(() => () => clearHl(), []);
  if (!d || !s || i == null) return null;
  const last = i === d.steps.length - 1;
  return (
    <div id="tour" className={'open' + (more ? ' more' : '')} role="dialog" aria-label={d.ui.aria} aria-live="polite">
      <div className="tour-h"><span id="tourN">{s.n}</span>
        <button type="button" className="tour-tog" aria-expanded={more ? 'true' : 'false'} onClick={() => { moreOpen = !more; setMore(!more); }}>{more ? d.ui.collapse : d.ui.why}</button>
        <button className="icon-btn" id="tourX" aria-label={d.ui.x} onClick={() => endTour(false)}>×</button>
      </div>
      <div className="tour-dots" id="tourDots">
        {d.ui.dots.map((t, k) => <i key={k} data-ti={k} title={t} className={k < i ? 'd' : k === i ? 'c' : undefined} onClick={() => tourGo(k)} />)}
      </div>
      <h4 id="tourT">{s.t}</h4>
      <p id="tourD">{s.d}</p>
      <div className="tour-why" id="tourW" dangerouslySetInnerHTML={{ __html: s.w }} />
      <div className="tour-f" id="tourF" dangerouslySetInnerHTML={{ __html: s.f }} />
      <div className="row tour-btns">
        <button className="btn ib" id="tourPrev" aria-label={d.ui.prev} title={d.ui.prev} disabled={i === 0} onClick={() => tourGo(i - 1)} dangerouslySetInnerHTML={{ __html: IC.prev }} />
        <button className="btn primary" id="tourNext" onClick={() => tourGo(i + 1)}>{last ? d.ui.done : d.ui.next}</button>
      </div>
    </div>
  );
}
