/* R33 pilot: the all-3D shell, behind ?w=3d (the default site is unchanged). Its own lazy chunk; three.js comes later
   with the first scene. The screen is only: a thin top bar (menu, search, share; back and breadcrumb dots once you are
   inside), the 3D stage filling the middle, one sentence with page dots, and three round buttons (map, progress, next).
   No page scrolls: one page is one idea; swipe sideways or tap the dots. Details live in the scene: tap a thing for its
   glass bubble, the lightbulb for "why", the magnifier to go deeper. Only one scene is alive; leaving a page or hiding
   the tab frees it. No WebGL, reduced motion or ?fb=1: the same pages drawn flat (buttons and an SVG). */
import { useApp } from '../store/app';
import { why3d } from '../m2/s3d';
import { IC } from './icons';
import { ATT, DOORS, PEDS, UI, ORDER, attnSay, dotInfo, key, nextOf, t, type Item, type L, type Page } from './text';
import type { P3, SApi } from '../three3d/p3/base';
import './pilot.css';

type Mod = { make(box: HTMLElement, api: SApi): P3; ready?(): Promise<unknown> };
const LOAD: Record<Page, () => Promise<Mod>> = { home: () => import('../three3d/p3/island'), zone: () => import('../three3d/p3/room'), attn: () => import('../three3d/p3/attn'), dot: () => import('../three3d/p3/dot') };
const SEEN = 'si.p3d.seen';
export interface PState { p: Page; i: number }
export function readState(search: string): PState {
  const q = new URLSearchParams(search), p = q.get('p'), i = Number(q.get('i') ?? 0) || 0;
  if (p === 'zone') return { p, i: Math.max(0, Math.min(5, i)) };
  if (p === 'dot' || p === 'attn') return { p, i: 0 };
  return { p: 'home', i: 0 };
}
export function stateURL(loc: { pathname: string; search: string; hash: string }, s: PState): string {
  const q = new URLSearchParams(loc.search); q.set('w', '3d');
  if (s.p === 'home') q.delete('p'); else q.set('p', s.p);
  if (s.p === 'zone' && s.i) q.set('i', String(s.i)); else q.delete('i');
  return `${loc.pathname}?${q.toString().replace(/%3D/g, '=')}${loc.hash}`;
}
/** the classic stop's address (the same path without the pilot flags) */
export function classicURL(loc: { pathname: string; search: string }, station: string): string {
  const q = new URLSearchParams(loc.search); for (const k of ['w', 'p', 'i', 'fb']) q.delete(k);
  const s = q.toString(); return `${loc.pathname}${s ? '?' + s : ''}${station === 'H' ? '' : '#' + station}`;
}

export function start(doc: Document = document, win: Window = window) {
  if (doc.getElementById('p3')) return;
  const flat = !!why3d(win) || /[?&]fb=1/.test(win.location.search);
  const root = doc.createElement('div'); root.id = 'p3'; root.className = 'p3'; doc.body.appendChild(root);
  doc.documentElement.classList.add('p3-mode');
  root.innerHTML = `<div class="p3-top" role="toolbar"><button type="button" class="p3-i" data-act="menu"></button><button type="button" class="p3-i p3-back" data-act="back" hidden></button>
<div class="p3-crumb"></div><button type="button" class="p3-i" data-act="search"></button><button type="button" class="p3-i" data-act="share"></button></div>
<div class="p3-stage" id="p3s" role="main"></div>
<div class="p3-foot"><div class="p3-cap"><div class="p3-dots" role="tablist"></div><p class="p3-say" aria-live="polite"></p></div>
<label class="p3-len" hidden><input type="range" min="14" max="34" value="28"><i aria-hidden="true"></i></label>
<nav class="p3-bot"><button type="button" class="p3-r" data-act="map"></button><button type="button" class="p3-r" data-act="prog"></button><button type="button" class="p3-r pri" data-act="next"></button></nav></div>
<div class="p3-sheet" hidden></div><div class="p3-toast" role="status" hidden></div>`;
  const $ = <E extends HTMLElement>(s: string) => root.querySelector<E>(s)!;
  const stg = $('#p3s'), lenIn = $<HTMLInputElement>('.p3-len input'), say = $('.p3-say'), dots = $('.p3-dots'), crumb = $('.p3-crumb'), sheet = $('.p3-sheet'), toast = $('.p3-toast');
  let lang: L = useApp.getState().lang as L, S = readState(win.location.search), view: P3 | null = null, kind: Page | null = null;
  let foc: number | null = null, why = false, seq = 0;
  const T = (x: { zh: string; en: string }) => t(x, lang);
  const icons = () => {
    for (const [a, ic, lab] of [['menu', IC.menu, UI.menu], ['back', IC.back, UI.back], ['search', IC.search, UI.search], ['share', IC.share, UI.share], ['map', IC.map, UI.map], ['prog', IC.prog, UI.progress], ['next', IC.next, UI.next]] as const) {
      const b = $(`[data-act=${a}]`); b.innerHTML = ic; b.setAttribute('aria-label', T(lab)); b.title = T(lab);
    }
    lenIn.setAttribute('aria-label', T(UI.len));
    root.lang = lang === 'en' ? 'en' : 'zh-CN';
  };
  const seen = (): string[] => { try { return JSON.parse(win.localStorage.getItem(SEEN) ?? '[]') as string[]; } catch { return []; } };
  const mark = () => { const s = new Set(seen()); s.add(key(S.p, S.i)); try { win.localStorage.setItem(SEEN, JSON.stringify([...s])); } catch { /* private */ } };
  const items = (): Item[] => (S.p === 'home' ? DOORS : S.p === 'zone' ? PEDS : []);
  /* ---------- the bubble: in the scene (3D) or over the flat page ---------- */
  const bubbleHTML = (name: string, text: string, w: boolean) => `<div class="p3b-in${text ? '' : ' tools'}">` + (text ? `<button type="button" class="p3x" data-act="close" aria-label="${T(UI.close)}">${IC.close}</button>` : '')
    + (name ? `<b>${name}</b>` : '') + (text ? `<p>${text}</p>` : '')
    + `<div class="p3b-row"><button type="button" class="p3o${w ? ' on' : ''}" data-act="why" aria-pressed="${w}">${IC.bulb}<span>${T(UI.why)}</span></button>`
    + `<button type="button" class="p3o" data-act="deep">${IC.zoom}<span>${T(UI.deeper)}</span></button></div></div>`;
  const showBubble = () => {
    let html: string | null = null;
    if (S.p === 'dot') html = bubbleHTML('', '', why); // the dot page keeps its picture clear: "why" swaps the sentence below
    else if (S.p === 'attn') { root.dataset.bub = why ? 'why' : ''; root.querySelectorAll('[data-act=why]').forEach((b) => { b.setAttribute('aria-pressed', String(why)); b.classList.toggle('on', why); }); caption(); return; } // v3: its own lightbulb; "why" swaps the sentence below
    else if (foc !== null) { const it = items()[foc]!; html = bubbleHTML(T(it.name), T(why ? it.why : it.say), why); }
    root.dataset.bub = html ? (why ? 'why' : 'on') : '';
    if (view) view.bubble(html);
    else { let fb = stg.querySelector<HTMLElement>('.p3b.flat'); if (!html) fb?.remove(); else { if (!fb) { fb = doc.createElement('div'); fb.className = 'p3b flat'; fb.setAttribute('role', 'dialog'); stg.appendChild(fb); } fb.innerHTML = html; } }
    caption();
  };
  const caption = () => {
    const open = root.dataset.bub && S.p !== 'dot' && S.p !== 'attn';
    if (S.p === 'attn') root.dataset.word = String(foc ?? ATT.start);
    say.textContent = S.p === 'home' ? T(UI.home) : S.p === 'dot' ? T(why ? UI.dotWhy : UI.dot) : S.p === 'attn' ? (why ? T(UI.attnWhy) : attnSay(foc ?? ATT.start, lang)) : S.i === 0 ? T(UI.zone) : T(PEDS[S.i - 1]!.say);
    say.classList.toggle('dim', !!open);
  };
  /* ---------- pages ---------- */
  const chrome = () => {
    const depth = S.p === 'home' ? 0 : S.p === 'zone' ? 1 : S.p === 'attn' ? 2 : 3;
    $('.p3-back').hidden = depth === 0;
    const label = depth === 0 ? T(UI.title) : depth === 1 ? T(UI.zoneName) : depth === 2 ? T(UI.attnName) : T(UI.dotName);
    ($('.p3-len') as HTMLElement).hidden = S.p !== 'dot' || flat;
    crumb.innerHTML = (depth ? `<span class="p3-cd" aria-hidden="true">${[0, 1, 2, 3].slice(0, depth + 1).map((k) => `<i${k === depth ? ' class="on"' : ''}></i>`).join('')}</span>` : '') + `<b>${label}</b>`;
    const n = S.p === 'zone' ? 6 : 0;
    dots.innerHTML = Array.from({ length: n }, (_, k) => `<button type="button" role="tab" class="p3-dot${k === S.i ? ' on' : ''}" data-act="dot" data-i="${k}" aria-selected="${k === S.i}" aria-label="${T(UI.pages).replace('{i}', String(k + 1)).replace('{n}', String(n))}"></button>`).join('');
    dots.hidden = !n; root.dataset.page = key(S.p, S.i);
  };
  const api = (): SApi => ({
    lang, raf: (f) => win.requestAnimationFrame(f), caf: (id) => win.cancelAnimationFrame(id),
    pick: (k) => onPick(k), swipe: (d) => onSwipe(d),
    dot: (ax, az, bx, by) => { const d = dotInfo(ax, az, bx, by); root.dataset.dot = String(d.dot); root.dataset.deg = String(d.deg); },
  });
  const free = () => { if (view) { try { view.dispose(); } catch (e) { console.error('[p3 dispose]', e); } view = null; kind = null; } };
  const build = async () => {
    const my = ++seq;
    if (flat) { drawFlat(); showBubble(); root.dataset.ready = '1'; root.dataset.mode = 'flat'; return; }
    if (kind !== S.p) {
      free(); stg.innerHTML = ''; root.dataset.ready = '';
      try {
        const m = await LOAD[S.p](); await m.ready?.(); if (my !== seq) return;
        view = m.make(stg, api()); kind = S.p;
      } catch (e) { console.error('[p3 load]', e); drawFlat(); root.dataset.mode = 'flat'; root.dataset.ready = '1'; return; }
    }
    root.dataset.mode = '3d';
    focusNow(true);
    win.setTimeout(() => { if (my === seq) root.dataset.ready = '1'; }, 950);
  };
  const focusNow = (now = false) => {
    if (view) {
      if (S.p === 'zone') view.focus(S.i ? S.i - 1 : null, now);
      else if (S.p === 'dot') { view.focus(0, now); view.input(+lenIn.value / 10); }
      else if (S.p === 'attn') view.focus(foc ?? ATT.start, now);
      else view.focus(foc, now);
    }
    showBubble();
  };
  const go = (s: PState, push = true) => {
    const same = s.p === S.p;
    S = s; foc = s.p === 'attn' ? ATT.start : null; why = false;
    if (push) try { win.history.pushState({ p3: 1 }, '', stateURL(win.location, S)); } catch { /* file: */ }
    chrome(); mark(); caption();
    if (same && view) focusNow(); else void build();
  };
  const onPick = (k: number) => {
    closeSheet();
    if (S.p === 'dot') return;
    if (S.p === 'attn') { if (k < 0) return; foc = k; view?.focus(k); if (!view) drawFlat(); caption(); return; } // v3: a word lights its arcs
    if (k < 0) { foc = null; why = false; if (S.p === 'home') view?.focus(null); showBubble(); return; }
    if (S.p === 'zone' && S.i !== k + 1) { go({ p: 'zone', i: k + 1 }); foc = k; showBubble(); return; }
    foc = k; why = false;
    if (view) view.focus(k); showBubble();
  };
  const onSwipe = (d: number) => { if (S.p === 'zone') { const i = S.i + d; if (i >= 0 && i <= 5) go({ p: 'zone', i }); } };
  const deeper = () => {
    const dest = S.p === 'dot' ? 'K2' : S.p === 'attn' ? 'p3d:dot' : foc !== null ? items()[foc]!.deeper : '';
    if (!dest) return;
    if (dest === 'p3d:zone') go({ p: 'zone', i: 0 });
    else if (dest === 'p3d:dot') go({ p: 'dot', i: 0 });
    else if (dest === 'p3d:attn') go({ p: 'attn', i: 0 });
    else win.location.assign(classicURL(win.location, dest));
  };
  const up = () => go(S.p === 'dot' ? { p: 'attn', i: 0 } : S.p === 'attn' ? { p: 'zone', i: 2 } : { p: 'home', i: 0 });
  /* ---------- flat (2D) pages ---------- */
  const EMO = ['🔌', '💻', '🤖', '🧰', '🛠', '🧠'], PEMO = ['🔤', '➰', '🗼', '⛰', '🎲'];
  function drawFlat() {
    stg.classList.add('p3-flat');
    const keep = stg.querySelector('.p3b.flat');
    if (S.p === 'dot') {
      stg.innerHTML = `<p class="p3-fbn">${T(UI.fallback)}</p><svg class="p3-dsvg" viewBox="-125 -128 265 172" role="img" aria-label="${T(UI.dotName)}"></svg><label class="p3-rng"><span>${T(UI.dotName)}</span><input type="range" min="10" max="170" value="53" aria-label="°"></label>`;
      const svg = stg.querySelector('svg')!, inp = stg.querySelector('input')!;
      const draw = () => {
        const a = (+inp.value * Math.PI) / 180, L0 = 120, bx = Math.cos(a) * 110, by = -Math.sin(a) * 110, d = dotInfo(L0, 0, bx, -by);
        const sh = `<line x1="0" y1="8" x2="${bx.toFixed(1)}" y2="8" stroke="${bx >= 0 ? '#22c55e' : '#f97316'}" stroke-width="9" stroke-linecap="round" opacity=".8"/>`;
        svg.innerHTML = `<path d="M0 0 L36 0 A36 36 0 0 0 ${(Math.cos(a) * 36).toFixed(1)} ${(-Math.sin(a) * 36).toFixed(1)}Z" fill="#c4b5fd" opacity=".5"/>${sh}
<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${bx.toFixed(1)}" y2="8" stroke="#f59e0b" stroke-dasharray="4 4"/>
<line x1="0" y1="0" x2="${L0}" y2="0" stroke="#8b5cf6" stroke-width="6" stroke-linecap="round"/><line x1="0" y1="0" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="#3b82f6" stroke-width="6" stroke-linecap="round"/>
<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="9" fill="#a78bfa"/><text x="${(Math.cos(a / 2) * 52 - 10).toFixed(1)}" y="${(-Math.sin(a / 2) * 52 + 5).toFixed(1)}">${d.deg}°</text>
<text x="${(bx / 2 - 20).toFixed(1)}" y="30">${T(UI.shadow)} ${(bx / 40).toFixed(1)}</text>`;
        root.dataset.deg = String(d.deg);
      };
      inp.addEventListener('input', draw); draw();
    } else if (S.p === 'attn') {
      /* v4: no picture: the sentence, the words as a row of buttons and the scores as plain text */
      const k = foc ?? ATT.start, w = ATT.words[lang], row = ATT.score[k]!;
      stg.innerHTML = `<p class="p3-fbn">${T(UI.fallback)}</p><p class="p3-sent">${T(ATT.sentence)}</p>`
        + `<div class="p3-wds">${w.map((x, j) => `<button type="button" class="p3-wd${j === k ? ' on' : ''}" data-pick="${j}">${x}</button>`).join('')}</div>`
        + `<p class="p3-pcs">${w.map((x, j) => (j === k ? '' : `<span class="p3-pc">${x} ${row[j]}%</span>`)).join('')}</p>`;
      root.dataset.word = String(k);
    } else if (S.p === 'home' || S.p === 'zone') {
      /* v4: no picture: a grid of cards, one per thing */
      const list = items(), em = S.p === 'home' ? EMO : PEMO;
      stg.innerHTML = `<p class="p3-fbn">${T(UI.fallback)}</p><div class="p3-grid">${list.map((it, k) => `<button type="button" class="p3-card${(S.p === 'zone' ? S.i - 1 : foc) === k ? ' on' : ''}" data-pick="${k}"><span aria-hidden="true">${em[k]}</span><b>${T(it.name)}</b></button>`).join('')}</div>`;
    }
    if (keep) stg.appendChild(keep);
  }
  /* v3: the dot page's length slider (the reference's slider with its glass dial) */
  lenIn.addEventListener('input', () => { root.dataset.len = lenIn.value; view?.input(+lenIn.value / 10); });
  stg.dataset.padt = '62'; // the stage runs full screen under the top bar: a bubble stays below it
  /* ---------- sheets: menu, search, progress ---------- */
  const closeSheet = () => { sheet.hidden = true; sheet.innerHTML = ''; root.dataset.sheet = ''; };
  const openSheet = (kindS: string, html: string) => { sheet.innerHTML = `<div class="p3-sh-in"><button type="button" class="p3x" data-act="sclose" aria-label="${T(UI.close)}">${IC.close}</button>${html}</div>`; sheet.hidden = false; root.dataset.sheet = kindS; };
  const allPages = () => ORDER.map((o) => ({ ...o, name: o.p === 'home' ? T(UI.title) : o.p === 'dot' ? T(UI.dotName) : o.p === 'attn' ? T(UI.attnName) : o.i ? T(PEDS[o.i - 1]!.name) : T(UI.zoneName) }));
  const pageRow = (o: { p: Page; i: number; name: string }, s: Set<string>) => `<button type="button" class="p3-row" data-act="goto" data-p="${o.p}" data-i="${o.i}"><span class="p3-ok${s.has(key(o.p, o.i)) ? ' on' : ''}">${s.has(key(o.p, o.i)) ? IC.check : ''}</span>${o.name}</button>`;
  const progress = () => { const s = new Set(seen()), all = allPages(), n = all.filter((o) => s.has(key(o.p, o.i))).length;
    openSheet('prog', `<h2>${T(UI.progress)} · ${T(UI.seen)} ${n} / ${all.length}</h2><div class="p3-bar"><i style="width:${Math.round((n / all.length) * 100)}%"></i></div><div class="p3-list">${all.map((o) => pageRow(o, s)).join('')}</div>`); };
  const menu = () => openSheet('menu', `<h2>${T(UI.menu)}</h2><div class="p3-list">${DOORS.map((d, k) => `<button type="button" class="p3-row" data-act="door" data-i="${k}"><span aria-hidden="true">${EMO[k]}</span>${T(d.name)}</button>`).join('')}</div>
<div class="p3-two"><button type="button" class="p3-btn" data-act="lang">${T(UI.lang)}</button><button type="button" class="p3-btn" data-act="classic">${T(UI.classic)}</button></div>`);
  const search = () => {
    openSheet('search', `<h2>${T(UI.search)}</h2><input class="p3-q" type="search" placeholder="${T(UI.find)}" aria-label="${T(UI.find)}"><div class="p3-list p3-res"></div>`);
    const q = sheet.querySelector<HTMLInputElement>('.p3-q')!, res = sheet.querySelector('.p3-res')!;
    const all = [...DOORS.map((d, k) => ({ d, go: `door:${k}` })), ...PEDS.map((d, k) => ({ d, go: `zone:${k + 1}` })), { d: { name: UI.attnName, say: UI.attn } as Item, go: 'attn:0' }, { d: { name: UI.dotName, say: UI.dot } as Item, go: 'dot:0' }];
    const run = () => { const s = q.value.trim().toLowerCase(); res.innerHTML = all.filter((o) => !s || (T(o.d.name) + T(o.d.say)).toLowerCase().includes(s)).map((o) => `<button type="button" class="p3-row" data-act="hit" data-go="${o.go}"><b>${T(o.d.name)}</b></button>`).join(''); };
    q.addEventListener('input', run); run();
  };
  const share = async () => {
    const url = win.location.href, nav = win.navigator as Navigator & { share?: (d: object) => Promise<void> };
    try { if (nav.share) { await nav.share({ title: T(UI.title), url }); return; } await nav.clipboard.writeText(url); } catch { /* cancelled */ }
    toast.textContent = T(UI.copied); toast.hidden = false; win.setTimeout(() => { toast.hidden = true; }, 1600);
  };
  /* ---------- one click handler for everything ---------- */
  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-pick]'); if (!el) return;
    if (el.dataset.pick !== undefined && !el.dataset.act) { onPick(+el.dataset.pick); return; }
    const a = el.dataset.act;
    if (a === 'why') { why = !why; showBubble(); }
    else if (a === 'deep') deeper();
    else if (a === 'close') { why = false; if (S.p !== 'dot') { foc = null; if (S.p === 'home') view?.focus(null); } showBubble(); }
    else if (a === 'back') up();
    else if (a === 'map') { closeSheet(); go({ p: 'home', i: 0 }); }
    else if (a === 'next') { closeSheet(); go(nextOf(S.p, S.i)); }
    else if (a === 'prog') progress();
    else if (a === 'menu') menu();
    else if (a === 'search') search();
    else if (a === 'share') void share();
    else if (a === 'sclose') closeSheet();
    else if (a === 'dot') go({ p: 'zone', i: +(el.dataset.i ?? 0) });
    else if (a === 'goto') { closeSheet(); go({ p: el.dataset.p as Page, i: +(el.dataset.i ?? 0) }); }
    else if (a === 'door') { closeSheet(); const k = +(el.dataset.i ?? 0); if (S.p !== 'home') go({ p: 'home', i: 0 }); onPick(k); }
    else if (a === 'hit') { closeSheet(); const [p, n] = (el.dataset.go ?? '').split(':'); if (p === 'door') { if (S.p !== 'home') go({ p: 'home', i: 0 }); onPick(+n!); } else go({ p: p as Page, i: +n! }); }
    else if (a === 'lang') { closeSheet(); lang = lang === 'zh' ? 'en' : 'zh'; useApp.getState().setLang(lang); icons(); chrome(); free(); void build(); }
    else if (a === 'classic') win.location.assign(classicURL(win.location, 'H'));
  });
  root.addEventListener('keydown', (e) => { const el = e.target as HTMLElement; if ((e.key === 'Enter' || e.key === ' ') && el.dataset.pick !== undefined && el.getAttribute('role') === 'button') { e.preventDefault(); onPick(+el.dataset.pick); } });
  win.addEventListener('popstate', () => { const s = readState(win.location.search); if (s.p !== S.p || s.i !== S.i) go(s, false); });
  /* a hidden tab frees the scene; coming back builds it again */
  doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'hidden') { free(); } else if (!view && !flat) void build(); });
  (win as unknown as { __p3?: unknown }).__p3 = { state: () => ({ ...S, foc, why, live: !!view }), where: (i: number) => view?.where(i) ?? null, orbit: () => view?.orbit() ?? null, go };
  icons(); chrome(); mark(); caption(); void build();
}
