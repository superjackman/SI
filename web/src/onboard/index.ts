/* R21 onboarding (lazy chunk, loaded by viral/late.ts after a stop is up; nothing here is in the first load):
   - first visit: a welcome card above the page head (what this is, 3 steps, start the tour, pick a route); never a pop-up,
     × or any button dismisses it for good; ☰ menu → 「👋 新手入门」 shows it again
   - the kids' route (6 stops, each "read 🧒 → 1 lab → quiz") or the full route (all stops)
   - a row under the 🧒 opening: route k/6 · 🧪 labs on this page · ✨ lit n/22 · next stop; and a next-stop line after the quiz
   - one-time coach marks for the header (skippable, no mask: the page stays usable), then one-time tips next to a ⤵ button,
     a 🔒 只读 badge and the dot strip when they first come into view
   - first visit only: text labels under the header icons
   All text here is our own (strings.ts); stop names come from the KB and are set as text. */
import { go, jumpTo, visited } from '../nav';
import { TABORDER, tabn } from '../legacy/kb';
import type { Lang } from '../i18n/types';
import { startTour } from '../tour/api';
import { useApp } from '../store/app';
import { progress, stopQuiz } from '../viral/prog';
import { ev } from '../viral/copy';
import { fill } from '../viral/strings';
import { closeDrawer } from '../shell/drawer';
import { IC } from '../shell/common';
import { isR28 } from '../shell/r28';
import { O, ROUTE, LABN } from './strings';
import './onboard.css';

/* ---- storage ---- */
const LS = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const LSset = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
export const K = { onb: 'aiexp.v2.onb', route: 'aiexp.v2.route', coach: 'aiexp.v2.coach', tips: 'aiexp.v2.obtips', tour: 'aiexp.v2.tourDone', quiz: 'aiexp.v2.quiz', vis: 'aiexp.v2.visited' } as const;
export type Route = 'kid' | 'all' | null;
export const route = (): Route => { const r = LS(K.route); return r === 'kid' || r === 'all' ? r : null; };
export const ROUTE_S = ROUTE.map((r) => r[0]);
/** pick a route; the bottom bar's ✨ badge listens (R22) */
export const setRoute = (r: 'kid' | 'all') => { LSset(K.route, r); document.dispatchEvent(new Event('si-route')); };
const tipsDone = (): string[] => { try { const a: unknown = JSON.parse(LS(K.tips) ?? '[]'); return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : []; } catch { return []; } };
const tipDone = (k: string) => { const a = tipsDone(); if (!a.includes(k)) LSset(K.tips, JSON.stringify(a.concat(k))); };

/* ---- pure rules (unit-tested) ---- */
/** a first visit: no stop opened but this one, no quiz answer, no tour, welcome card never dismissed */
export function isFresh(S: string, vis: string[], quiz: string | null, onb: string | null, tourDone: string | null): boolean {
  let answered = false; try { const q: unknown = JSON.parse(quiz ?? '{}'); answered = !!q && typeof q === 'object' && Object.keys(q).length > 0; } catch { /* broken = none */ }
  return !onb && !tourDone && !answered && vis.every((v) => v === S);
}
/** where "next" goes: the kids' route keeps to its 6 stops (from off the route: its first stop not lit yet); else the tab order */
export function nextStop(S: string, r: Route, lit: (s: string) => boolean): string | null {
  if (r === 'kid') {
    const i = ROUTE_S.indexOf(S);
    if (i >= 0) return ROUTE_S[i + 1] ?? null;
    return ROUTE_S.find((s) => !lit(s)) ?? ROUTE_S[0]!;
  }
  const i = TABORDER.indexOf(S); return TABORDER[i + 1] ?? null; /* from the home page H (not a numbered stop): the first stop */
}
/** the hands-on parts of a stop: its labs (T1 has none, but its 🎬 walk-through demo plays the same role) */
export const labsOf = (sec: ParentNode): HTMLElement[] => {
  const l = [...sec.querySelectorAll<HTMLElement>('.card.lab[id]')];
  if (l.length) return l;
  const w = sec.querySelector<HTMLElement>('#walkCard'); return w ? [w] : [];
};

/* ---- module state (one stop is mounted at a time) ---- */
let fresh: boolean | null = null, first: string | null = null;
let cur: { sec: HTMLElement; S: string; L: Lang; draw: () => void } | null = null;
const st = () => useApp.getState();
const litNow = () => { const p = progress(); return (s: string) => !!p.stops.find((x) => x.S === s)?.lit; };
const el = <T extends keyof HTMLElementTagNameMap>(tag: T, cls: string, text?: string) => { const e = document.createElement(tag); e.className = cls; if (text != null) e.textContent = text; return e; };
const btn = (cls: string, text: string, on: () => void, ch?: string) => { const b = el('button', cls, text); b.type = 'button'; if (ch) b.dataset.ob = ch; b.onclick = on; return b; };
/** open a lab (or the T1 demo): scroll there, open it if folded, and start it (labs start on focus inside, runtime.ts) */
export function openLab(id: string) {
  jumpTo(id);
  const c = document.getElementById(id);
  const f = c?.querySelector<HTMLElement>('input[id],select[id],textarea[id],button');
  if (c?.classList.contains('lab')) f?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
}

/** add the rows without the browser's scroll anchoring moving the page: a scroll position saved earlier (↩ back from a
    drill-down, reload) was measured with the rows in place, so the restored spot is already right */
function noAnchor(fn: () => void) {
  const h = document.documentElement.style, b = document.body.style;
  h.overflowAnchor = b.overflowAnchor = 'none';
  fn();
  void document.body.offsetHeight;
  requestAnimationFrame(() => { h.overflowAnchor = b.overflowAnchor = ''; });
}

/* ---- bubbles (coach marks and tips): fixed, no mask, one at a time ---- */
let bub: { el: HTMLElement; off: () => void } | null = null;
const killBub = () => { if (!bub) return; bub.off(); bub.el.remove(); bub = null; document.querySelectorAll('.ob-hl').forEach((e) => e.classList.remove('ob-hl')); };
function bubble(targets: Element[], html: string, acts: HTMLElement[], cls = '', onGone?: () => void): HTMLElement {
  killBub();
  const b = el('div', 'ob-bub ' + cls); b.setAttribute('role', 'dialog'); b.setAttribute('aria-live', 'polite');
  const p = el('p', 'ob-bt'); p.innerHTML = html; /* our own strings only */
  const r = el('div', 'ob-ba'); r.append(...acts);
  b.append(p, r); document.body.append(b);
  targets.forEach((t) => t.classList.add('ob-hl'));
  let raf = 0;
  const place = () => {
    raf = 0;
    const rs = targets.map((t) => t.getBoundingClientRect()).filter((q) => q.width || q.height);
    if (!rs.length) { killBub(); onGone?.(); return; }
    const top = Math.min(...rs.map((q) => q.top)), l = Math.min(...rs.map((q) => q.left)), rt = Math.max(...rs.map((q) => q.right));
    /* header targets: clear the whole top bar, so the first-visit labels under the icons stay readable */
    const tb = targets.some((t) => t.closest('#topbar')) ? document.getElementById('topbar')?.getBoundingClientRect().bottom ?? 0 : 0;
    const bot = Math.max(tb, ...rs.map((q) => q.bottom));
    if (bot < 0 || top > innerHeight) { killBub(); onGone?.(); return; }
    const w = b.offsetWidth, h = b.offsetHeight, cx = (l + rt) / 2;
    const x = Math.max(8, Math.min(innerWidth - w - 8, cx - w / 2));
    const below = bot + 12 + h < innerHeight - 8 || top - 12 - h < 8;
    const y = below ? bot + 12 : top - 12 - h;
    b.style.transform = `translate(${Math.round(x)}px,${Math.round(Math.max(8, y))}px)`;
    b.classList.toggle('up', !below);
    b.style.setProperty('--ax', Math.round(Math.max(16, Math.min(w - 16, cx - x))) + 'px');
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(place); };
  place();
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req);
  bub = { el: b, off: () => { cancelAnimationFrame(raf); removeEventListener('scroll', req); removeEventListener('resize', req); } };
  return b;
}

/* ---- coach marks (header) ---- */
const STEPS0: [string, keyof typeof O][] = [['#mMenu', 'c1'], ['#mPrev,#tbWhere,#mNext', 'c2'], ['#mSearch,#mShare,#mLang', 'c3'], ['#crumb .chips', 'c4'], ['#bnav', 'c5']];
/** R27+: the home page's coach marks: what this is → where to start (🎬 / 🧒) → the six doorways → header (menu, change stop/swipe, find/share/lang) → bottom row */
export const HSTEPS: [string, keyof typeof O][] = [['.hm-t', 'h1'], ['.hm-go', 'h2'], ['.hm-door .dr-g', 'h3'], ['#mMenu', 'c1'], ['#tbWhere', 'hc2'], ['#mSearch,#mShare,#mLang', 'c3'], ['#bnav', 'h5']];
/** R28 skeleton: the same walk-through for the calmer header / bottom bar (no ‹ ›, no EN, 3 items at the bottom) */
const STEPS28: [string, keyof typeof O][] = [['#mMenu', 'n1'], ['#tbWhere', 'n2'], ['#mSearch,#mShare', 'n3'], ['#crumb .cb-up', 'n4'], ['#bnav', 'n5']];
export const HSTEPS28: [string, keyof typeof O][] = [['.hm-t', 'h1'], ['.hm-door .dr-g', 'n6'], ['.hm-go', 'n7'], ['#mMenu', 'n1'], ['#mSearch,#mShare', 'n3']];
/** which first-visit card a page shows: the home page its slim strip, a stop the R21 card; none on a friend's link
    (its banner is why they came), during the tour, once dismissed, or after the first page of the visit */
export function welcomeKind(S: string, fresh: boolean, first: string | null, onb: string | null, tourOn: boolean, banner: boolean): 'home' | 'stop' | null {
  if (!fresh || S !== first || onb || tourOn || banner) return null;
  return S === 'H' ? 'home' : 'stop';
}
const shown = (e: Element | null): e is HTMLElement => !!e && (e as HTMLElement).getClientRects().length > 0;
let coachOn = false;
export function coach(L: Lang, i = 0, STEPS = STEPS0) {
  if (st().tour != null) return;
  if (STEPS === STEPS0 && isR28(st().station)) STEPS = STEPS28;
  if (i >= STEPS.length) { killBub(); coachOn = false; LSset(K.coach, '1'); ev('coach-done'); tipsKick(); return; }
  const [q, k] = STEPS[i]!, ts = q.split(',').map((s) => document.querySelector(s)).filter(shown);
  if (!ts.length) { coach(L, i + 1, STEPS); return; }
  coachOn = true;
  if (i === STEPS.length - 1 && scrollY > 0) window.scrollTo({ top: 0 });
  else if (STEPS !== STEPS0 && STEPS !== STEPS28 && !ts[0]!.closest('#topbar,#bnav')) { const r = ts[0]!.getBoundingClientRect(); if (r.top < 60 || r.top > innerHeight * 0.6) window.scrollTo({ top: Math.max(0, scrollY + r.top - 90) }); }
  const skip = btn('ob-b', O.cSkip[L], () => { killBub(); coachOn = false; LSset(K.coach, '1'); ev('coach-skip'); tipsKick(); }, 'coach-skip');
  const last = i === STEPS.length - 1;
  const nx = btn('ob-b pri', last ? O.cOk[L] : O.cNext[L] + ` (${i + 1}/${STEPS.length})`, () => coach(L, i + 1, STEPS), 'coach-next');
  bubble(ts, O[k][L], last ? [nx] : [skip, nx], 'coach', () => { coachOn = false; });
  requestAnimationFrame(() => nx.focus({ preventScroll: true }));
}
const coachOnce = (L: Lang) => { if (!LS(K.coach)) coach(L); else tipsKick(); };

/* ---- one-time tips next to things in the pictures ---- */
let tipsKick = () => {};
function tips(sec: HTMLElement, L: Lang): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const want: [string, string, keyof typeof O][] = [['dd', '.dd-b', 'tDd'], ['ro', '.badge.b-use', 'tRo'], ['dots', '.pn-dots', 'tDots']];
  const vis = new Map<Element, boolean>();
  let calm = 0, tm3 = 0; /* after a tip closes, the next one waits 15 s: one hint at a time, not a chain */
  const ready = () => Date.now() >= calm && !coachOn && !bub && st().tour == null && !sec.querySelector('.ob-wel') && !document.body.classList.contains('dw-open') && !document.getElementById('siFsAsk');
  const io = new IntersectionObserver((es) => { es.forEach((e) => vis.set(e.target, e.intersectionRatio >= 0.99)); check(); }, { threshold: [0, 0.99] });
  const pending = () => want.filter(([k]) => !tipsDone().includes(k));
  const watch = () => { io.disconnect(); for (const [, q] of pending()) sec.querySelectorAll(q).forEach((e) => io.observe(e)); };
  let tm = 0, tm2 = 0;
  const check = () => {
    if (!ready()) return;
    for (const [k, q, s] of pending()) {
      const t = [...sec.querySelectorAll(q)].find((e) => vis.get(e) && e.getBoundingClientRect().top > 70);
      if (!t) continue;
      /* counts as seen once tapped or on screen for 1.5 s (scrolled past sooner: it comes back next time) */
      ev('tip-' + k);
      const rest = () => { calm = Date.now() + 15000; clearTimeout(tm3); tm3 = window.setTimeout(check, 15050); };
      const x = btn('ob-b pri', O.tX[L], () => { tipDone(k); clearTimeout(tm); clearTimeout(tm2); killBub(); rest(); watch(); }, 'tip-x');
      bubble([t], O[s][L], [x], 'tip', () => { clearTimeout(tm); clearTimeout(tm2); rest(); watch(); });
      clearTimeout(tm); clearTimeout(tm2);
      tm2 = window.setTimeout(() => tipDone(k), 1500);
      tm = window.setTimeout(() => { killBub(); watch(); }, 12000);
      return;
    }
  };
  watch();
  tipsKick = () => { watch(); };
  const t2 = window.setTimeout(watch, 800); /* diagrams draw their badges a moment after mount */
  return () => { clearTimeout(tm); clearTimeout(tm2); clearTimeout(tm3); clearTimeout(t2); io.disconnect(); tipsKick = () => {}; };
}

/* ---- text labels under the header icons (first visit only) ---- */
const HL: [string, keyof typeof O][] = [['#mMenu', 'hMenu'], ['#mPrev', 'hPrev'], ['#mNext', 'hNext'], ['#mSearch', 'hFind'], ['#mShare', 'hShare'], ['#mLang', 'hLang']];
let hlOff: (() => void) | null = null;
function hdrLabels(L: Lang) {
  hlOff?.();
  const tb = document.getElementById('topbar'); if (!tb) return;
  const row = el('div', 'ob-tl'); row.setAttribute('aria-hidden', 'true');
  const sp = HL.map(([q, k]) => { const s = el('span', '', O[k][L]); s.dataset.for = q; row.append(s); return s; });
  tb.append(row);
  const place = () => {
    const tr = tb.getBoundingClientRect();
    /* centred under its icon, but kept 4 px inside the bar and 6 px apart (long en words at the right edge push left) */
    const v = sp.map((s) => {
      const b = document.querySelector(s.dataset.for!); const r = b?.getBoundingClientRect(); s.hidden = !r || !r.width;
      const hw = s.offsetWidth / 2; return { s, hw, c: r && r.width ? Math.max(4 + hw, Math.min(tr.width - 4 - hw, r.left + r.width / 2 - tr.left)) : NaN };
    }).filter((x) => !Number.isNaN(x.c));
    for (let i = v.length - 2; i >= 0; i--) { const a = v[i]!, n = v[i + 1]!; a.c = Math.min(a.c, n.c - n.hw - 6 - a.hw); }
    v.forEach((x) => { x.s.style.left = Math.round(x.c) + 'px'; });
  };
  place(); requestAnimationFrame(place);
  addEventListener('resize', place);
  hlOff = () => { removeEventListener('resize', place); row.remove(); hlOff = null; };
}

/* ---- welcome card ---- */
let doorBack = () => {};
function welcome(sec: HTMLElement, S: string, L: Lang, again = false) {
  doorBack(); sec.querySelector('.ob-wel')?.remove();
  const c = el('section', 'ob-wel'); c.setAttribute('aria-labelledby', 'obWelT');
  const h = el('h2', '', O.wTitle[L]); h.id = 'obWelT';
  const x = btn('vr-x ob-x', '', () => done('x'), 'onb-x'); x.innerHTML = IC.x; x.setAttribute('aria-label', O.wClose[L]); x.title = O.wClose[L];
  const lead = el('p', 'ob-lead', O.wLead[L]);
  const ol = el('ol', 'ob-steps'); for (const k of ['w1', 'w2', 'w3'] as const) { const li = el('li', ''); li.innerHTML = O[k][L]; ol.append(li); }
  const tour = btn('ob-b pri big', O.wTour[L], () => { done('tour'); startTour(); }, 'onb-tour');
  const pk = el('p', 'ob-pk', O.wPick[L]);
  const rr = el('div', 'ob-rr');
  rr.append(btn('ob-b', O.wKid[L], () => { setRoute('kid'); done('kid'); }, 'onb-kid'), btn('ob-b', O.wAll[L], () => { setRoute('all'); done('all'); }, 'onb-all'));
  const why = el('p', 'ob-why', O.rWhy[L]);
  const bt = btn('ob-lnk', O.wBtns[L], () => done('btns'), 'onb-btns');
  /* R25: on T1 the "I want to…" doorways stand in for the route picker (their 🧠 door picks a route), so the first
     screen has one block, not two; they go back to their place under the page head when the card closes */
  const door = sec.querySelector<HTMLElement>('.m-door'), mark = door?.previousSibling ?? null;
  if (door) { c.append(x, h, lead, ol, tour, door, bt); door.addEventListener('click', onDoor); } else c.append(x, h, lead, ol, tour, pk, rr, why, bt);
  function onDoor(e: Event) { if ((e.target as Element).closest?.('button')) done('door'); }
  doorBack = () => { if (!door || !c.contains(door)) return; door.removeEventListener('click', onDoor); if (mark?.parentNode) mark.parentNode.insertBefore(door, mark.nextSibling); else sec.querySelector('.pl-top')?.before(door); doorBack = () => {}; };
  const ph = sec.querySelector('.pagehead'); if (ph) ph.before(c); else sec.prepend(c);
  ev(again ? 'onb-reopen' : 'onb-show');
  function done(how: string) {
    LSset(K.onb, '1'); ev('onb-' + how); doorBack(); c.remove();
    if (how === 'door') { setTimeout(() => coachOnce(L), 600); return; } /* the door's own click (App.tsx) goes on to its stop or route */
    if (how === 'kid') { const r = ROUTE_S.includes(S) ? null : nextStop(S, 'kid', litNow()); if (r) { go(r); setTimeout(() => coachOnce(L), 600); return; } }
    cur?.draw();
    if (how === 'tour') return; /* coach marks follow when the tour ends */
    if (how === 'btns') coach(L); else coachOnce(L);
  }
}

/* ---- R27+: the home page's first-visit strip (one slim row under the one-liner; the doorways stay on the first screen) ---- */
function homeWelcome(sec: HTMLElement, L: Lang, again = false) {
  sec.querySelector('.ob-wel')?.remove();
  const c = el('section', 'ob-wel ob-hw'); c.setAttribute('aria-labelledby', 'obHwT');
  const p = el('p', 'ob-hwt', O.hwT[L]); p.id = 'obHwT';
  const x = btn('vr-x ob-x', '', () => done('x'), 'onb-x'); x.innerHTML = IC.x; x.setAttribute('aria-label', O.hwClose[L]); x.title = O.hwClose[L];
  const r28 = isR28('H'), go1 = btn('ob-b pri', (r28 ? O.hwGo5 : O.hwGo)[L], () => { done('btns'); window.scrollTo({ top: 0 }); coach(L, 0, r28 ? HSTEPS28 : HSTEPS); }, 'onb-btns');
  c.append(p, x, go1);
  const at = sec.querySelector('.hm-s'); if (at) at.after(c); else sec.prepend(c);
  ev(again ? 'onb-reopen' : 'onb-show');
  function done(how: string) { LSset(K.onb, '1'); ev('onb-' + how); c.remove(); if (how === 'x') tipsKick(); }
  return c;
}

/* ---- the row under the plain opening + the line after the quiz ---- */
function rows(sec: HTMLElement, S: string, L: Lang): { draw: () => void; off: () => void } {
  /* chips right under the page head (above the 🧒 opening); the next-stop link right after the 🧒 opening */
  const ph = sec.querySelector('.pagehead'), pl = sec.querySelector('.pl-top');
  const row = el('div', 'ob-row'); row.setAttribute('role', 'group');
  const pan = el('div', 'ob-rp'); pan.hidden = true; pan.id = 'obRp';
  const n1 = el('div', 'ob-n1');
  noAnchor(() => {
    let at: Element | null = ph; while (at?.nextElementSibling?.classList.contains('vr-ban')) at = at.nextElementSibling; /* link banners stay first */
    if (at) at.after(row, pan); else sec.prepend(row, pan);
    (pl ?? pan).after(n1);
  });
  const qc = sec.querySelector<HTMLElement>('.card.quiz[id^="quiz"]');
  const qn = qc ? el('div', 'ob-qn') : null;
  if (qc && qn) (qc.nextElementSibling?.classList.contains('vr-q') ? qc.nextElementSibling : qc).after(qn);
  const labs = labsOf(sec);
  /* R28: the labs and the lit count live in the bottom bar (目录 / 进度) and the next stop is its 下一站 — this row keeps
     only the kids' route (its chip and its lab), so it is empty, and hidden, for everyone else */
  const r28 = isR28(S);
  const draw = () => {
    const r = route(), ri = r === 'kid' ? ROUTE_S.indexOf(S) : -1, lit = litNow(), p = progress(), nx = nextStop(S, r, lit);
    row.replaceChildren();
    if (r === 'kid') {
      if (ri >= 0) {
        const b = btn('ob-c rt', fill(O.rChip[L], { k: ri + 1 }) + ' ▾', () => { pan.hidden = !pan.hidden; b.setAttribute('aria-expanded', String(!pan.hidden)); if (!pan.hidden) ev('ob-route'); }, 'route');
        b.setAttribute('aria-expanded', String(!pan.hidden)); b.setAttribute('aria-controls', 'obRp'); row.append(b);
      } else row.append(btn('ob-c rt', O.rBack[L] + ' ›', () => { ev('ob-route-back'); go(nx!); }, 'route-back'));
    }
    const lab = ri >= 0 ? ROUTE[ri]![1] : labs[0]?.id;
    if (lab && document.getElementById(lab) && (!r28 || ri >= 0)) {
      const t = ri >= 0 ? fill(O.try[L], { lab: LABN[lab]![L] }) : labs[0]!.id === 'walkCard' ? O.demo[L] : labs.length === 1 ? O.lab1[L] : fill(O.labs[L], { n: labs.length });
      row.append(btn('ob-c lab', t + ' ›', () => { ev('ob-lab'); openLab(lab); }, 'lab'));
    }
    if (!r28) row.append(btn('ob-c lit', fill(O.lit[L], { n: p.lit }), () => { ev('ob-lit'); void import('../viral/cards').then((m) => m.openProgress()); }, 'lit'));
    row.hidden = !row.childElementCount;
    n1.replaceChildren();
    if (nx && !r28) n1.append(btn('ob-c nx', fill(r === 'kid' ? O.nextR[L] : O.next[L], { stop: tabn(nx, L) }), () => { ev('ob-next'); go(nx); }, 'next'));
    /* route panel */
    pan.replaceChildren();
    if (r === 'kid') {
      pan.append(el('p', 'ob-rh', O.rHead[L]));
      const ol = el('ol', 'ob-rl');
      ROUTE_S.forEach((s) => {
        const li = el('li', s === S ? 'on' : lit(s) ? 'ok' : '');
        const b = btn('', '', () => { if (s !== S) go(s); else pan.hidden = true; }, 'route-go');
        b.append(el('i', '', s === S ? '●' : lit(s) ? '✓' : String(ROUTE_S.indexOf(s) + 1)), el('span', '', tabn(s, L)), el('small', '', LABN[ROUTE[ROUTE_S.indexOf(s)]![1]]![L]));
        if (s === S) b.setAttribute('aria-current', 'step');
        li.append(b); ol.append(li);
      });
      pan.append(ol, el('p', 'ob-why', O.rWhy[L]), btn('ob-lnk', O.rAll[L], () => { setRoute('all'); ev('ob-route-all'); pan.hidden = true; draw(); }, 'route-all'));
    } else pan.hidden = true;
    /* after the quiz */
    if (qn) {
      qn.replaceChildren();
      const [, d, n] = stopQuiz(S), done = n > 0 && d === n;
      const left = ROUTE_S.filter((s) => !lit(s));
      if (r === 'kid' && ri === ROUTE_S.length - 1 && done) {
        if (!left.length) qn.append(el('p', '', O.rEnd[L]), btn('ob-b pri', O.rGoAll[L], () => { setRoute('all'); ev('ob-route-end'); const t = TABORDER.find((s) => !lit(s)); if (t) go(t); else draw(); }, 'route-end'));
        else qn.append(el('p', '', fill(O.rLeft[L], { n: left.length })), btn('ob-b pri', tabn(left[0]!, L) + ' ›', () => go(left[0]!), 'route-left'));
      } else {
        qn.append(el('p', '', done ? O.qDone[L] : O.qNext[L]));
        if (nx) qn.append(btn('ob-b pri', fill(r === 'kid' ? O.nextR[L] : O.next[L], { stop: tabn(nx, L) }), () => { ev('ob-qnext'); go(nx); }, 'qnext'));
      }
    }
  };
  draw();
  /* the stop you are on counts as opened once you answer its quiz (the landing stop is not marked by go()) — runs
     before the other si-progress listeners (window capture) so their counts agree */
  const onP = () => { const v = visited(); if (!v.includes(S)) LSset(K.vis, JSON.stringify(v.concat(S))); };
  const onP2 = () => draw();
  addEventListener('si-progress', onP, true); document.addEventListener('si-progress', onP2); document.addEventListener('si-route', onP2);
  return { draw, off: () => { removeEventListener('si-progress', onP, true); document.removeEventListener('si-progress', onP2); document.removeEventListener('si-route', onP2); row.remove(); pan.remove(); n1.remove(); qn?.remove(); } };
}

/* ---- the menu entry that shows the welcome card again ---- */
function dwEntry(L: Lang) {
  const d = document.getElementById('mDrawer'); if (!d) return;
  let b = document.getElementById('obDw') as HTMLButtonElement | null;
  if (!b) {
    b = btn('ob-dw', '', () => closeDrawer(() => { const c = cur; if (!c) return; if (c.S === 'H') homeWelcome(c.sec, c.L, true); else welcome(c.sec, c.S, c.L, true); window.scrollTo({ top: 0 }); }), 'onb-menu');
    b.id = 'obDw';
    const h = d.querySelector('.dw-head'); if (h) h.after(b); else d.prepend(b);
  }
  b.textContent = O.dw[L];
}

export function mountOnboard(sec: HTMLElement, S: string, L: Lang): () => void {
  if (fresh === null) { fresh = isFresh(S, visited(), LS(K.quiz), LS(K.onb), LS(K.tour)); first = S; }
  /* R27: no route row on the home page H (it has its own first-visit strip, homeWelcome) */
  const R = S === 'H' ? { draw: () => undefined, off: () => undefined } : rows(sec, S, L);
  cur = { sec, S, L, draw: R.draw };
  dwEntry(L);
  const crumb = document.querySelector<HTMLElement>('#crumb .chips'); if (crumb && !isR28(S)) crumb.dataset.ob = O.crumb[L]; else if (crumb) delete crumb.dataset.ob;
  /* arriving on a friend's link (challenge / lab banner): the banner is why they came — no welcome card on top of it
     (the ☰ entry still has it), only the header labels */
  const wk = welcomeKind(S, !!fresh, first, LS(K.onb), st().tour != null, !!sec.querySelector('.vr-ban'));
  if (wk === 'home') homeWelcome(sec, L); else if (wk === 'stop') welcome(sec, S, L);
  if (fresh && S === first) hdrLabels(L); else hlOff?.();
  /* R27: a first visitor on the home page gets the coach marks once they pick a doorway or the kids' route (the 🎬 tour has its own hook below) */
  const hd = (e: Event) => { if (!(e.target as Element).closest?.('.hm-door button, .hm-go [data-route]')) return; sec.removeEventListener('click', hd); sec.querySelector('.ob-hw')?.remove(); LSset(K.onb, '1'); if (LS(K.coach)) return; ev('onb-door'); setTimeout(() => coachOnce(cur?.L ?? L), 600); };
  if (S === 'H' && fresh && S === first && !LS(K.onb)) sec.addEventListener('click', hd);
  const offT = tips(sec, L);
  /* coach marks after the tour (started from the welcome card or the menu) ends */
  const unsub = useApp.subscribe((s, p) => { if (p.tour != null && s.tour == null && fresh) setTimeout(() => coachOnce(cur?.L ?? L), 400); if (s.tour != null) { const w = sec.querySelector('.ob-wel'); if (w) { LSset(K.onb, '1'); doorBack(); w.remove(); } killBub(); } });
  return () => { sec.removeEventListener('click', hd); unsub(); offT(); R.off(); doorBack(); sec.querySelector('.ob-wel')?.remove(); if (bub?.el.classList.contains('tip')) killBub(); if (bub && !document.body.contains(bub.el)) bub = null; if (cur?.sec === sec) cur = null; };
}
