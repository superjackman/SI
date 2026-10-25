/* R22 bottom bar (lazy chunk; the bar itself is Nav.tsx → Dock): what the 🧪 / ✅ / 下一站 buttons do, the badges on
   ✅ / ✨ / 🧪, and the plain rules behind them (unit-tested). Reuses the R21 route (onboard) and R20 progress (viral). */
import { go, hooks, openCollapsed, scrollToEl, toast } from '../../nav';
import { useApp } from '../../store/app';
import { TABORDER, tabn } from '../../legacy/kb';
import { tx } from '../../i18n/L';
import type { Lang } from '../../i18n/types';
import { labsOf, nextStop, openLab, route, ROUTE_S, type Route } from '../../onboard';
import { ROUTE } from '../../onboard/strings';
import { progress } from '../../viral/prog';
import { fill } from '../../viral/strings';
import { D } from './strings';
import './dock.css';

/* ---- pure rules ---- */
/** 🧪: the kids' route plays its one lab; one lab opens at once; several → a list; none → a plain toast */
export function pickLab(S: string, r: Route, labs: string[]): { open: string } | { list: true } | { none: true } {
  const ri = r === 'kid' ? ROUTE_S.indexOf(S) : -1, rl = ri >= 0 ? ROUTE[ri]![1] : null;
  if (rl && labs.includes(rl)) return { open: rl };
  if (!labs.length) return { none: true };
  return labs.length === 1 ? { open: labs[0]! } : { list: true };
}
/** ✨ badge: lit X/22, or k/6 of the kids' route */
export function progBadge(lit: (s: string) => boolean, r: Route, total = TABORDER.length): { n: string; rt: boolean; k: number; x: number } {
  const x = TABORDER.filter(lit).length, k = ROUTE_S.filter(lit).length;
  return r === 'kid' ? { n: `${k}/${ROUTE_S.length}`, rt: true, k, x } : { n: `${x}/${total}`, rt: false, k, x };
}
/** the part of the page you are reading: the last one whose top is above the line under the top bar */
export function curIdx(tops: (number | null)[], line: number): number {
  let c = 0; tops.forEach((t, i) => { if (t != null && t <= line) c = i; }); return c;
}

/* ---- the page ---- */
export const sec = () => document.querySelector<HTMLElement>('section.level.active');
const litFn = () => { const p = progress(); return (s: string) => !!p.stops.find((x) => x.S === s)?.lit; };
const title = (e: Element) => (e.querySelector(':scope>h2,:scope>h3')?.textContent ?? '').replace(/\s+/g, ' ').trim();
export interface Item { el: HTMLElement; t: string; k: 'pl' | 'dg' | 'card' | 'lab' | 'quiz' | 'hand' }
/** 📑: the parts of this stop in page order — the plain opening, the diagram, every card, "where next" */
export function tocItems(s: HTMLElement, L: Lang): Item[] {
  const out: Item[] = [];
  for (const e of Array.from(s.children) as HTMLElement[]) {
    const c = e.classList;
    if (c.contains('pl-top')) out.push({ el: e, t: e.querySelector('.pl-tag')?.textContent?.trim() || D.plain[L], k: 'pl' });
    else if (c.contains('m-stage')) out.push({ el: e, t: D.stage[L], k: 'dg' });
    else if (c.contains('card')) { const t = title(e); if (t) out.push({ el: e, t, k: c.contains('lab') ? 'lab' : c.contains('quiz') ? 'quiz' : 'card' }); }
    else if (c.contains('m-hand')) out.push({ el: e, t: e.querySelector('.mh-t')?.textContent?.trim() || D.hand[L], k: 'hand' });
  }
  return out;
}
export const labTitle = (e: HTMLElement) => title(e).replace(/^🧪\s*/, '');
/** scroll to a part of the page (opens it if folded; shows it if the detail level hid it) */
export function jumpEl(el: HTMLElement) {
  if (el.id) { scrollToEl(el.id); return; }
  hooks.ensureVisible(el); openCollapsed(el);
  window.setTimeout(() => window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - 70), behavior: 'smooth' }), 30);
}
export const quizOf = (s: ParentNode | null) => s?.querySelector<HTMLElement>('.card.quiz[id^="quiz"]') ?? null;

/* ---- the buttons ---- */
export function act(k: string) {
  const s = useApp.getState(), S = s.station, L = s.lang, x = sec();
  if (k === 'quiz') { const q = quizOf(x); if (q) scrollToEl(q.id); else toast(D.noQuiz[L]); return; }
  if (k === 'lab') {
    const p = pickLab(S, route(), x ? labsOf(x).map((e) => e.id) : []);
    if ('open' in p) openLab(p.open); else if ('list' in p) s.set({ sheetOpen: 'lab' }); else toast(D.noLab[L]);
    return;
  }
  if (k === 'next') {
    const n = nextStop(S, route(), litFn());
    if (n) { go(n); toast(tx('nav.nextStop', L) + tabn(n, L)); } else s.set({ sheetOpen: 'next' });
  }
}

/* ---- badges (data-n / data-st: attributes React does not manage, so its className updates never wipe them) ---- */
export function badges(x: HTMLElement, S: string, L: Lang): () => void {
  const draw = () => {
    const b = (k: string) => document.querySelector<HTMLElement>(`#bnav [data-bn="${k}"]`);
    const lit = litFn(), r = route(), g = progBadge(lit, r);
    const pb = b('prog');
    if (pb) {
      pb.dataset.n = g.n; pb.dataset.st = g.rt ? 'rt' : '';
      pb.setAttribute('aria-label', tx('dk.progA', L) + ' · ' + fill(D.lit[L], { x: g.x, t: TABORDER.length }) + (g.rt ? ' · ' + fill(D.rH[L], { k: g.k }) : ''));
    }
    /* 下一站 says where it goes (screen readers, long press): the next stop on your route */
    const nb = b('next'), nx = nextStop(S, r, lit);
    if (nb) nb.setAttribute('aria-label', tx('dk.nextA', L) + (nx ? ' · ' + tabn(nx, L) : ''));
    const qb = b('quiz'), q = !!quizOf(x), ok = q && lit(S);
    if (qb) {
      qb.dataset.st = !q ? 'off' : ok ? 'ok' : '';
      if (ok) qb.dataset.n = '✓'; else delete qb.dataset.n;
      qb.setAttribute('aria-label', q ? tx('dk.quizA', L) + (ok ? ' · ' + D.quizLit[L] : '') : D.noQuiz[L]);
    }
    const lb = b('lab'), n = labsOf(x).length;
    if (lb) {
      lb.dataset.st = n ? '' : 'off';
      if (n > 1) lb.dataset.n = String(n); else delete lb.dataset.n;
      lb.setAttribute('aria-label', n ? tx('dk.labA', L) : D.noLab[L]);
    }
  };
  draw();
  document.addEventListener('si-progress', draw); document.addEventListener('si-route', draw);
  return () => { document.removeEventListener('si-progress', draw); document.removeEventListener('si-route', draw); };
}
