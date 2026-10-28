/* R34: the all-3D site's shell (the default view). Every page is a three.js scene: the home island of five zones, a zone
   hall, a station's idea stands, its experiment, its quiz and its medal, the progress map; one scene is alive at a time and
   is disposed when the page changes or the tab hides. Routes live in the hash (reg.parseRoute), so "#T1" links work. */
import { useApp } from '../store/app';
import { why3d } from '../m2/s3d';
import { IC } from '../pilot3d/icons';
import '../pilot3d/pilot.css';
import './w3.css';
import { ZONES, STATIONS, EMBLEM, zoneOf, stName, stIcon, nextSt, tx, parseRoute, routeHash, routeSt, type L, type Tx, type Route } from './reg';
import { content, peek } from './c';
import { x, type StC } from './c/types';
import type { P3 } from '../three3d/p3/base';
import type { Note } from './note';
import { W } from './text';
import type { View, WApi, Mod } from './sc/world';

const DONE = 'si.w3.done', SEEN = 'si.w3.seen', HI = 'si.w3.hi';
type AnyMod = Mod<unknown>;
const SC: Record<string, () => Promise<AnyMod>> = {
  hall: () => import('./sc/hall') as unknown as Promise<AnyMod>, stand: () => import('./sc/stand') as unknown as Promise<AnyMod>,
  quiz: () => import('./sc/quiz') as unknown as Promise<AnyMod>, reward: () => import('./sc/reward') as unknown as Promise<AnyMod>,
  map: () => import('./sc/map') as unknown as Promise<AnyMod>,
};
const ZEMB = ['robot', 'letters', 'brain', 'globe', 'grid'];
const ZSKY: [string, string, string] = ['#c9bdf2', '#e0d6fa', '#f4effd'];
/** the pages of a station: its ideas, then the experiment, the quiz and the medal */
export const pagesOf = (c: StC) => c.ideas.length + 3;
export type Kind = 'ideas' | 'lab' | 'quiz' | 'reward';
export function kindOf(c: StC, p: number): Kind { const n = c.ideas.length; return p < n ? 'ideas' : p === n ? 'lab' : p === n + 1 ? 'quiz' : 'reward'; }
/** a fixed shuffle of the answer blocks (the right one is not always in the same place) */
export function order(n: number, seed: number): number[] { const o = Array.from({ length: n }, (_, k) => k); let s = seed * 9301 + 49297; for (let k = n - 1; k > 0; k--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (k + 1)); [o[k], o[j]] = [o[j]!, o[k]!]; } return o; }
/** the classic page's address for a station */
export function classicURL(loc: { pathname: string; search: string }, station: string): string {
  const q = new URLSearchParams(loc.search); for (const k of ['w', 'p', 'i', 'fb']) q.delete(k); q.set('classic', '1');
  return `${loc.pathname}?${q.toString()}${station === 'H' ? '' : '#' + station}`;
}

export function start(doc: Document = document, win: Window = window) {
  if (doc.getElementById('p3')) return;
  const qs = win.location.search, flat = !!why3d(win) || /[?&]fb=1/.test(qs);
  const root = doc.createElement('div'); root.id = 'p3'; root.className = 'p3 w3'; doc.body.appendChild(root);
  doc.documentElement.classList.add('p3-mode');
  root.innerHTML = `<div class="p3-top" role="toolbar"><button type="button" class="p3-i" data-act="menu"></button><button type="button" class="p3-i p3-back" data-act="back" hidden></button>
<div class="p3-crumb"></div><button type="button" class="p3-i" data-act="search"></button><button type="button" class="p3-i" data-act="share"></button></div>
<div class="p3-stage" id="p3s" role="main"></div>
<div class="p3-foot"><div class="p3-cap"><div class="p3-dots" role="tablist"></div><div class="w3-cr"><button type="button" class="w3-bulb" data-act="why" hidden></button><p class="p3-say" aria-live="polite"></p></div></div>
<label class="p3-len w3-len" hidden><span></span><input type="range"><i aria-hidden="true"></i></label>
<nav class="p3-bot"><button type="button" class="p3-r" data-act="map"></button><button type="button" class="p3-r" data-act="prog"></button><button type="button" class="p3-r pri" data-act="next"></button></nav></div>
<div class="p3-sheet" hidden></div><div class="p3-toast" role="status" hidden></div>`;
  const $ = <E extends HTMLElement>(s: string) => root.querySelector<E>(s)!;
  const stg = $('#p3s'), len = $<HTMLLabelElement>('.w3-len'), lenIn = $<HTMLInputElement>('.w3-len input'), say = $('.p3-say'), bulb = $('.w3-bulb'), dots = $('.p3-dots'), crumb = $('.p3-crumb'), sheet = $('.p3-sheet'), toast = $('.p3-toast');
  let lang: L = (useApp.getState().lang === 'en' ? 'en' : 'zh'), R: Route = parseRoute(win.location.hash, qs), view: View | null = null, vkey = '';
  let foc: number | null = null, why = false, seq = 0, C: StC | null = null, labOK = false, labSay = '';
  let qi = 0, qo: number[] = [], qBusy = false, qWrong = 0;
  /* R36: what the finger last pressed (stage px), which parts a tap already explained, which things this idea page has shown */
  let px = -1, py = -1, cardAt = -1, tapN = 0, TE: typeof import('./c/t') | null = null;
  const tapSeen = new Set<number>(), ideaSeen = new Set<number>();
  const ls = { get: <T>(k: string, d: T): T => { try { const v = win.localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } }, set: (k: string, v: unknown) => { try { win.localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } } };
  if (R.v === 'home' && !ls.get(HI, 0) && !win.location.hash) R = { v: 'welcome' };
  const T = (x: Tx) => tx(x, lang);
  const done = () => new Set(ls.get<string[]>(DONE, []));
  const markDone = (s: string) => { const d = done(); d.add(s); ls.set(DONE, [...d]); };
  const markSeen = () => { if (R.v !== 'st') return; const s = new Set(ls.get<string[]>(SEEN, [])); s.add(`${R.s}/${R.p}`); ls.set(SEEN, [...s]); };
  const icons = () => {
    for (const [a, ic, lab] of [['menu', IC.menu, W.menu], ['back', IC.back, W.back], ['search', IC.search, W.search], ['share', IC.share, W.share], ['map', IC.map, W.mapN], ['prog', IC.prog, W.progress], ['next', IC.next, W.nextP]] as const) {
      const b = $(`[data-act=${a}]`); b.innerHTML = ic; b.setAttribute('aria-label', T(lab)); b.title = T(lab);
    }
    bulb.innerHTML = IC.bulb; bulb.setAttribute('aria-label', T(W.why)); bulb.title = T(W.why);
    root.lang = lang === 'en' ? 'en' : 'zh-CN';
  };
  const kind = (): Kind | '' => (R.v === 'st' && C ? kindOf(C, R.p) : '');
  const st = () => (R.v === 'st' ? R.s : '');
  /* ---------- the bubble and the caption ---------- */
  const bubbleHTML = (name: string, text: string, btns: string) => `<div class="p3b-in"><button type="button" class="p3x" data-act="close" aria-label="${T(W.close)}">${IC.close}</button>`
    + (name ? `<b>${name}</b>` : '') + (text ? `<p>${text}</p>` : '') + `<div class="p3b-row">${btns}</div></div>`;
    const bGo = (lab: Tx, act: string, ic = IC.zoom) => `<button type="button" class="p3o" data-act="${act}">${ic}<span>${T(lab)}</span></button>`;
  const zDone = (z: number) => ZONES[z]!.st.filter((s) => done().has(s)).length;
  const bubble = (): string | null => {
    if (foc === null) return null;
    if (R.v === 'home' || R.v === 'welcome') { const z = ZONES[foc]!; return bubbleHTML(`${z.icon} ${T(z.name)}`, `${z.st.length} ${T(W.stations)} · ${T(W.done)} ${zDone(foc)}`, bGo(W.enter, 'enter', IC.next)); }
    if (R.v === 'zone') { const s = ZONES[R.z - 1]!.st[foc]; if (!s) return null; const c = peek(s); return bubbleHTML(`${stIcon(s)} ${stName(s, lang)}`, c ? T(c.ideas[0]!.say) : '', bGo(W.enter, 'enter', IC.next)); }
    if (kind() === 'ideas' && C && R.v === 'st') { const th = C.ideas[R.p]!.things[foc]; if (!th) return null; return bubbleHTML(T(th.n), `${T(th.s)}</p><p class="w3-w">${T(th.w)}</p><p class="w3-try">🔬 ${T(W.tryLab)}${T(C.lab.say)}`, bGo(W.deeper, 'deep')); }
    return null;
  };
  const showBubble = () => {
    const html = bubble();
    root.dataset.bub = html ? (why ? 'why' : 'on') : '';
    if (view) view.bubble(html);
    else { let fb = stg.querySelector<HTMLElement>('.p3b.flat'); if (!html) fb?.remove(); else { if (!fb) { fb = doc.createElement('div'); fb.className = 'p3b flat'; fb.setAttribute('role', 'dialog'); stg.appendChild(fb); } fb.innerHTML = html; } }
    if (foc !== null && kind() === 'ideas') ideaSeen.add(foc);
    caption(); nt?.redo();
  };
  const caption = () => {
    const k = kind();
    let s = '';
    if (R.v === 'home' || R.v === 'welcome') s = T(W.home); // the welcome card already says hello
    else if (R.v === 'map') s = T(W.map);
    else if (R.v === 'zone') s = T(W.zone);
    else if (!C) s = T(W.loading);
    else if (k === 'ideas') s = T(C.ideas[(R as { p: number }).p]!.say);
    else if (k === 'lab') s = why ? T(C.lab.why) : labSay || T(C.lab.say);
    else if (k === 'quiz') { const q = C.quiz[qi]!; s = why ? '💡 ' + T(q.hint) : `${T(W.quizOf).replace('{i}', String(qi + 1)).replace('{n}', String(C.quiz.length))} · ${T(q.q)}`; }
    else if (k === 'reward') s = '🏅 ' + T(C.done);
    say.textContent = s;
    say.classList.remove('dim'); // R35: the hint stays fully readable while a bubble is open (it was faded to 45%)
    bulb.hidden = !(k === 'lab' || k === 'quiz'); bulb.classList.toggle('on', why); bulb.setAttribute('aria-pressed', String(why));
    teach();
  };
  /* R36: the look / learned line under the top bar: what to look at first, then (once every thing was opened, or the lab works) one line of what was learned */
  const look = doc.createElement('p'); look.className = 'w3-lk'; look.setAttribute('aria-live', 'polite'); look.hidden = true; root.appendChild(look);
  function teach() {
    const k = kind(), t = TE && R.v === 'st' && !flat ? TE.TEACH[R.s] : undefined;
    let s = '';
    if (t && C && R.v === 'st' && k === 'ideas') {
      const th = C.ideas[R.p]!.things, got = th.every((_, i) => ideaSeen.has(i));
      s = got ? '✅ ' + T(W.learned) + T(x(t[R.p === 0 ? 2 : 3])) : '👀 ' + T(W.lookIdea).replace('{n}', th.map((h) => T(h.n)).join(lang === 'en' ? ', ' : '、'));
    } else if (t && k === 'lab') s = labOK ? '✅ ' + T(W.learned) + T(x(t[1])) : '👀 ' + T(x(t[0]));
    if (look.textContent !== s) { look.textContent = s; look.hidden = !s; look.classList.toggle('ok', s.startsWith('✅')); }
    const pt = String(s ? Math.max(62, Math.round(look.getBoundingClientRect().bottom + 4 - stg.getBoundingClientRect().top)) : 62);
    if (stg.dataset.padt !== pt) { stg.dataset.padt = pt; nt?.redo(); }
  }
  /* ---------- chrome: the crumb, the dots, the slider, the next button ---------- */
  const chrome = () => {
    const depth = R.v === 'home' || R.v === 'welcome' ? 0 : R.v === 'map' || R.v === 'zone' ? 1 : 2;
    $('.p3-back').hidden = depth === 0;
    const label = R.v === 'st' ? `${stIcon(R.s)} ${stName(R.s, lang)}` : R.v === 'zone' ? `${ZONES[R.z - 1]!.icon} ${T(ZONES[R.z - 1]!.name)}` : R.v === 'map' ? T(W.mapN) : T(W.title);
    crumb.innerHTML = (depth ? `<span class="p3-cd" aria-hidden="true">${[0, 1, 2].slice(0, depth + 1).map((k) => `<i${k === depth ? ' class="on"' : ''}></i>`).join('')}</span>` : '') + `<b>${label}</b>`;
    const n = R.v === 'st' && C ? pagesOf(C) : 0, p = R.v === 'st' ? R.p : 0;
    /* R35: real tabs with words (Idea 1, Idea 2, Lab, Quiz, Medal), 36 px tall, instead of tiny dots and emoji */
    const tab = (k: number) => (C && k >= C.ideas.length ? T([W.tLab, W.tQuiz, W.tMedal][k - C.ideas.length]!) : T(W.tIdea).replace('{i}', String(k + 1)));
    dots.innerHTML = Array.from({ length: n }, (_, k) => `<button type="button" role="tab" class="p3-dot w3-tab${k === p ? ' on' : ''}" data-act="dot" data-i="${k}" aria-selected="${k === p}" aria-label="${tab(k)} · ${T(W.pages).replace('{i}', String(k + 1)).replace('{n}', String(n))}">${tab(k)}</button>`).join('');
    dots.hidden = !n;
    root.dataset.page = R.v === 'st' ? `${R.s}/${R.p}` : R.v === 'zone' ? `z${R.z}/${R.i}` : R.v;
    root.dataset.kind = kind() || R.v;
    const k = kind(), nx = $('[data-act=next]');
    nx.classList.toggle('w3-glow', (k === 'lab' && labOK) || k === 'reward');
    nx.hidden = k === 'quiz';
    const sl = view?.slider;
    len.hidden = !sl || flat;
    if (sl) { lenIn.min = String(sl.min); lenIn.max = String(sl.max); lenIn.step = String(sl.step ?? 1); lenIn.value = String(sl.val); len.querySelector('span')!.textContent = sl.label; lenIn.setAttribute('aria-label', sl.label); }
    doc.title = (R.v === 'st' ? stName(R.s, lang) + ' · ' : '') + T(W.title);
  };
  /* ---------- the scene for this page ---------- */
  const api = (): WApi => ({
    lang, raf: (f) => win.requestAnimationFrame(f), caf: (id) => win.cancelAnimationFrame(id),
    pick: (k) => onPick(k), swipe: () => { /* the drag orbits */ },
    dot: (ax, az, bx, by) => { root.dataset.dot = (ax * bx + az * by).toFixed(1); },
    say: (s) => { labSay = s; caption(); },
    done: () => { if (labOK) return; labOK = true; root.dataset.lab = 'done'; chrome(); teach(); },
    note: (k, v) => { root.dataset[k] = String(v); },
  });
  const free = () => { freeNotes(); closeCard(); if (view) { try { view.dispose(); } catch (e) { console.error('[w3 dispose]', e); } view = null; vkey = ''; } };
  const sceneKey = () => (R.v === 'home' || R.v === 'welcome' ? 'home' : R.v === 'map' ? 'map' : R.v === 'zone' ? `z${R.z}` : `${R.s}/${R.p}`) + ':' + lang;
  const quizOpts = () => { const q = C!.quiz[qi]!; qo = order(q.o.length, STATIONS.indexOf(st()) * 7 + qi + 1); return qo.map((j) => T(q.o[j]!)); };
  const make = async (): Promise<View> => {
    const d = done();
    if (R.v === 'home' || R.v === 'welcome') return (await SC.hall!()).make(stg, api(), { emb: ZEMB, names: ZONES.map((z) => T(z.name)), done: ZONES.map((_, k) => zDone(k) === ZONES[k]!.st.length), color: '#8b5cf6', sky: ZSKY, seed: 11 });
    if (R.v === 'map') return (await SC.map!()).make(stg, api(), { names: ZONES.map((z) => T(z.name)), cols: ZONES.map((z) => z.color), done: ZONES.map((z) => z.st.map((s) => d.has(s))), sky: ZSKY });
    if (R.v === 'zone') { const z = ZONES[R.z - 1]!; return (await SC.hall!()).make(stg, api(), { emb: z.st.map((s) => EMBLEM[s] ?? 'orb'), names: z.st.map((s) => stName(s, lang)), done: z.st.map((s) => d.has(s)), color: z.color, sky: z.sky, seed: R.z }); }
    const z = zoneOf(R.s), c = C!, k = kindOf(c, R.p), base = { color: z.color, sky: z.sky };
    if (k === 'ideas') return (await SC.stand!()).make(stg, api(), { ...base, things: c.ideas[R.p]!.things.map((t) => ({ p: t.p, n: T(t.n) })), seed: R.p + 1 });
    if (k === 'lab') { const { labMod } = await import('./lab'); return (await labMod(c.lab.k)).make(stg, api(), { ...base, opt: c.lab.opt }); }
    if (k === 'quiz') return (await SC.quiz!()).make(stg, api(), { ...base, opts: quizOpts() });
    return (await SC.reward!()).make(stg, api(), { ...base, cols: STATIONS.map((s) => zoneOf(s).color), done: STATIONS.map((s) => d.has(s)), now: STATIONS.indexOf(R.s) });
  };
  const build = async () => {
    const my = ++seq;
    if (R.v === 'st' && !C) { try { C = await content(R.s); } catch (e) { console.error('[w3 content]', e); } if (my !== seq) return; if (R.v === 'st' && R.p >= pagesOf(C!)) R = { ...R, p: 0 }; chrome(); }
    if (flat) { free(); if (C && kind() === 'quiz') quizOpts(); drawFlat(); showBubble(); root.dataset.ready = '1'; root.dataset.mode = 'flat'; return; }
    const key = sceneKey();
    if (key !== vkey || !view) {
      free(); stg.innerHTML = ''; stg.classList.remove('p3-flat'); root.dataset.ready = '';
      try { const v = await make(); if (my !== seq) { v.dispose(); return; } view = v; vkey = key; }
      catch (e) { console.error('[w3 load]', e); drawFlat(); root.dataset.mode = 'flat'; root.dataset.ready = '1'; return; }
      welcomeCard(); if (kind() === 'reward') stg.insertAdjacentHTML('beforeend', rewardBtns()); chrome();
      void mountNotes(my);
    }
    root.dataset.mode = '3d';
    focusNow(true);
    win.setTimeout(() => { if (my === seq) root.dataset.ready = '1'; }, 950);
  };
  const focusNow = (now = false) => {
    if (view) { if (R.v === 'zone') view.focus(R.i ? R.i - 1 : null, now); else view.focus(foc, now); }
    showBubble();
  };
  const enterPage = () => { foc = R.v === 'zone' && R.i ? R.i - 1 : null; why = false; labOK = false; labSay = ''; qi = 0; qBusy = false; qWrong = 0; root.dataset.lab = ''; root.dataset.q = ''; tapSeen.clear(); ideaSeen.clear(); };
  const go = (r: Route, push = true) => {
    const stChanged = r.v !== 'st' || R.v !== 'st' || r.s !== R.s;
    const sameScene = R.v === 'zone' && r.v === 'zone' && r.z === R.z;
    if (stChanged) C = r.v === 'st' ? peek(r.s) ?? null : null;
    R = r; enterPage();
    if (r.v === 'welcome') ls.set(HI, 1);
    if (push) try { const h = routeHash(r); win.history.pushState({ w3: 1 }, '', win.location.pathname + win.location.search + (h || '#')); } catch { /* file: */ }
    useApp.setState({ station: routeSt(r) });
    markSeen(); chrome(); caption();
    if (sameScene && view) focusNow(); else { root.dataset.ready = ''; void build(); } // not ready until the new page is built
  };
  const up = () => go(R.v === 'st' ? { v: 'zone', z: zoneOf(R.s).n, i: zoneOf(R.s).st.indexOf(R.s) + 1 } : { v: 'home' });
  const nextOf = (): Route => {
    if (R.v === 'home' || R.v === 'welcome') return { v: 'zone', z: foc !== null ? foc + 1 : 1, i: 0 };
    if (R.v === 'map') return { v: 'home' };
    if (R.v === 'zone') { const z = ZONES[R.z - 1]!, d = done(); const s = R.i ? z.st[R.i - 1]! : z.st.find((x) => !d.has(x)) ?? z.st[0]!; return { v: 'st', s, p: 0 }; }
    if (C && R.p + 1 < pagesOf(C)) return { v: 'st', s: R.s, p: R.p + 1 };
    return { v: 'st', s: nextSt(R.s), p: 0 };
  };
  /* ---------- R35: teaching callouts and the info card ---------- */
  let nt: { redo(): void; free(): void; near(x: number, y: number): { k: number; card: { t: string; p: string; tr?: string } } | null } | null = null;
  const card = doc.createElement('div'); card.className = 'w3-card'; card.setAttribute('role', 'dialog'); card.hidden = true; root.appendChild(card);
  function freeNotes() { nt?.free(); nt = null; }
  function closeCard() { if (card.hidden) return; card.hidden = true; root.dataset.card = ''; nt?.redo(); }
  const openCard = (c: { t: string; p: string; tr?: string }) => {
    card.innerHTML = `<button type="button" class="p3x" data-act="cclose" aria-label="${T(W.close)}">${IC.close}</button><b>${c.t}</b><p>${c.p}</p>${c.tr ? `<p class="w3-try">👉 ${c.tr}</p>` : ''}`;
    card.hidden = false; root.dataset.card = '1'; cardAt = tapN; nt?.redo();
  };
  const mountNotes = async (my: number) => {
    const v = view as unknown as P3 | null; if (!v || typeof v.proj !== 'function') return;
    const k = kind();
    const [{ notes }, N, Te] = await Promise.all([import('./note'), import('./c/n'), import('./c/t'), R.v === 'zone' ? content(ZONES[R.z - 1]!.st[0]!).catch(() => null) : null]);
    if (my !== seq || view !== (v as unknown as View)) return;
    TE = Te; teach();
    const lb = (i: number) => stg.querySelector<HTMLElement>(`.p3l[data-pick="${i}"]`) ?? undefined;
    const cook = (r: [string, string, string, string, string]) => ({ at: r[0], b: T(x(r[1])), s: T(x(r[2])), card: { t: T(x(r[1])), p: T(x(r[3])), tr: T(x(r[4])) } });
    let list: Note[] = [];
    if (R.v === 'home' || R.v === 'welcome') list = [...ZONES.map((z, i) => ({ at: `a${i}`, b: `${z.icon} ${T(z.name)}`, s: T(x(N.ZONE_S[i]!)), pick: i, el: lb(i) })), cook(N.HOME_N)];
    else if (R.v === 'zone') { const z = ZONES[R.z - 1]!; list = [...z.st.map((s, i) => { const c = peek(s); return { at: `a${i}`, b: `${stIcon(s)} ${stName(s, lang)}`, s: c ? T(c.ideas[0]!.say) : '', pick: i, el: lb(i) }; }), cook(N.zoneNote(R.z - 1, z.st.length))]; }
    else if (R.v === 'map') list = N.MAP_N.map(cook);
    else if (C && k === 'ideas') list = C.ideas[R.p]!.things.map((t, i) => ({ at: `a${i}`, b: T(t.n), s: T(t.s), pick: i, el: lb(i) }));
    else if (C && k === 'lab') list = N.labNotes(R.s).map(cook);
    else if (k === 'quiz') list = Te.QUIZ_N.map(cook);
    else if (C && R.v === 'st' && k === 'reward') list = Te.MEDAL_N(Te.TEACH[R.s]?.[1] ?? '|').map(cook);
    /* R36: every station on the carousel gets a short tag while its own name is hidden (at the sides), so all of them can be tapped and read */
    if (R.v === 'home' || R.v === 'welcome') list.push(...ZONES.map((z, i) => ({ at: `s${i}`, b: `${z.icon} ${T(z.name)}`, s: '', pick: i })));
    else if (R.v === 'zone') list.push(...ZONES[R.z - 1]!.st.map((s, i) => ({ at: `s${i}`, b: `${stIcon(s)} ${stName(s, lang)}`, s: '', pick: i })));
    list = list.filter((n) => !('el' in n) || n.el);
    if (!list.length) return;
    const foot = $('.p3-foot');
    nt = notes(stg, v, list, { open: (c) => openCard(c), info: T(W.info), foot: () => Math.min(foot.getBoundingClientRect().top, len.hidden ? Infinity : len.getBoundingClientRect().top) - stg.getBoundingClientRect().top });
  };
  /* ---------- taps ---------- */
  const onPick = (k: number) => {
    closeSheet();
    const kd = kind();
    if (root.dataset.card === '1') { if (cardAt === tapN) return; closeCard(); if (kd !== 'lab') return; } // a tap anywhere closes the info card first
    if (kd === 'lab') { view?.set?.({ pick: k }); tapInfo(); return; } // a label tap (canvas taps reach tapInfo from pointerup)
    if (kd === 'quiz') { answer(k); return; }
    if (kd === 'reward') return;
    if (R.v === 'map') { if (k >= 0) go({ v: 'zone', z: k + 1, i: 0 }); return; }
    if (k < 0) { foc = null; why = false; if (R.v !== 'zone') view?.focus(null); showBubble(); return; }
    if (R.v === 'zone') { if (R.i !== k + 1) go({ v: 'zone', z: R.z, i: k + 1 }); else showBubble(); return; }
    foc = k; why = false; if (view) view.focus(k); showBubble();
  };
  /* R36: in a lab, a tap on a 3D part also opens that part's card the first time (what is this?); the ⓘ dot keeps working after */
  const tapInfo = () => {
    if (!nt || px < 0 || kind() !== 'lab') return;
    if (root.dataset.card === '1') { if (cardAt === tapN) return; closeCard(); }
    if (wasOpen) return; // a tap that closed a card only closes it
    const h = nt.near(px, py); if (!h || tapSeen.has(h.k)) return;
    tapSeen.add(h.k); openCard(h.card);
  };
  let pt0 = 0, wasOpen = false;
  root.addEventListener('pointerdown', () => { tapN++; }, true); // the tap that opens a card does not also close it
  stg.addEventListener('pointerdown', (e) => { wasOpen = root.dataset.card === '1'; const b = stg.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; pt0 = win.performance.now(); }, true);
  stg.addEventListener('pointerup', (e) => { // a short tap on the canvas (not a drag, not a label) in a lab
    if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
    const b = stg.getBoundingClientRect();
    if (Math.hypot(e.clientX - b.left - px, e.clientY - b.top - py) < 10 && win.performance.now() - pt0 < 600) win.setTimeout(tapInfo, 0);
  }, true);
  const answer = (k: number) => {
    if (!C || qBusy || k < 0 || k >= qo.length) return;
    const q = C.quiz[qi]!;
    if (qo[k] === q.a) {
      qBusy = true; why = false; root.dataset.q = 'ok';
      view?.set?.({ ok: k }); say.textContent = '⭐ ' + T(W.right) + ' ' + T(q.why);
      if (!view) drawFlat();
      win.setTimeout(() => {
        qBusy = false; root.dataset.q = '';
        if (!C || kind() !== 'quiz') return;
        if (qi + 1 < C.quiz.length) { qi++; qWrong = 0; const o = quizOpts(); view?.set?.({ q: o }); if (!view) drawFlat(); caption(); }
        else { markDone(st()); go({ v: 'st', s: st(), p: R.v === 'st' ? R.p + 1 : 0 }); }
      }, flat ? 500 : 2600); // R35: time to read why it is right
    } else {
      qWrong++; why = true; root.dataset.q = 'bad'; view?.set?.({ bad: k }); caption();
      say.textContent = '💡 ' + T(q.hint) + ' · ' + T(W.again);
      if (!view) drawFlat();
    }
  };
  /* ---------- the welcome card (over the home island) ---------- */
  function welcomeCard() {
    stg.querySelector('.w3-wel')?.remove();
    if (R.v !== 'welcome') return;
    const el = doc.createElement('div'); el.className = 'w3-wel'; el.setAttribute('role', 'dialog');
    el.innerHTML = `<b>${T(W.title)}</b><p>${T(W.welcome)}</p><p class="w3-sm">${T(W.wel2)}</p><button type="button" class="p3-btn w3-go" data-act="start">${T(W.start)}</button>`;
    stg.appendChild(el);
  }
  /* ---------- flat (no WebGL / reduced data) pages: the same flow as cards and buttons ---------- */
  function drawFlat() {
    stg.classList.add('p3-flat');
    const keep = stg.querySelector('.p3b.flat'), d = done();
    const card = (k: number, icon: string, name: string, on = false, ok = false) => `<button type="button" class="p3-card${on ? ' on' : ''}" data-pick="${k}"><span aria-hidden="true">${icon}</span><b>${name}</b>${ok ? `<i class="w3-ok">${IC.check}</i>` : ''}</button>`;
    let h = `<p class="p3-fbn">${T(W.fallback)}</p>`;
    const kd = kind();
    if (R.v === 'home' || R.v === 'welcome') h += `<div class="p3-grid">${ZONES.map((z, k) => card(k, z.icon, T(z.name), foc === k, zDone(k) === z.st.length)).join('')}</div>`;
    else if (R.v === 'map') h += `<div class="p3-grid">${ZONES.map((z, k) => card(k, z.icon, `${T(z.name)} ${zDone(k)}/${z.st.length}`)).join('')}</div>`;
    else if (R.v === 'zone') h += `<div class="p3-grid">${ZONES[R.z - 1]!.st.map((s, k) => card(k, stIcon(s), stName(s, lang), R.v === 'zone' && R.i === k + 1, d.has(s))).join('')}</div>`;
    else if (C && kd === 'ideas') h += `<div class="p3-grid">${C.ideas[(R as { p: number }).p]!.things.map((t, k) => card(k, '•', T(t.n), foc === k)).join('')}</div>`;
    else if (C && kd === 'lab') h += `<div class="w3-fl"><p>${T(W.noLab)}</p><p><b>${T(C.lab.say)}</b></p><p>💡 ${T(C.lab.why)}</p></div>`;
    else if (C && kd === 'quiz') h += `<div class="w3-fl"><p><b>${T(C.quiz[qi]!.q)}</b></p></div><div class="p3-grid">${qo.map((j, k) => card(k, ['A', 'B', 'C', 'D'][k]!, T(C!.quiz[qi]!.o[j]!))).join('')}</div>`;
    else if (C && kd === 'reward') h += `<div class="w3-fl"><p class="w3-medal">🏅</p><p><b>${T(C.done)}</b></p><p>${d.size} / ${STATIONS.length}</p></div>`;
    if (kd === 'reward') h += rewardBtns();
    stg.innerHTML = h; if (keep) stg.appendChild(keep);
    welcomeCard();
  }
  const rewardBtns = () => `<div class="p3-two w3-rb"><button type="button" class="p3-btn" data-act="map">${T(W.mapb)}</button><button type="button" class="p3-btn" data-act="again">${T(W.retry)}</button><button type="button" class="p3-btn w3-go" data-act="next">${T(W.next)}</button></div>`;
  lenIn.addEventListener('input', () => { root.dataset.len = lenIn.value; view?.input(+lenIn.value); });
  stg.dataset.padt = '62';
  /* ---------- sheets: menu, search, progress ---------- */
  const closeSheet = () => { sheet.hidden = true; sheet.innerHTML = ''; root.dataset.sheet = ''; };
  const openSheet = (k: string, html: string) => { sheet.innerHTML = `<div class="p3-sh-in"><button type="button" class="p3x" data-act="sclose" aria-label="${T(W.close)}">${IC.close}</button>${html}</div>`; sheet.hidden = false; root.dataset.sheet = k; };
  const stRow = (s: string, d: Set<string>) => `<button type="button" class="p3-row" data-act="goto" data-h="#${s}"><span class="p3-ok${d.has(s) ? ' on' : ''}">${d.has(s) ? IC.check : ''}</span>${stIcon(s)} ${stName(s, lang)}</button>`;
  const progress = () => {
    const d = done(), n = STATIONS.filter((s) => d.has(s)).length;
    openSheet('prog', `<h2>${T(W.progress)} · ${n} / ${STATIONS.length}${n === STATIONS.length ? ' · ' + T(W.allDone) : ''}</h2><div class="p3-bar"><i style="width:${Math.round((n / STATIONS.length) * 100)}%"></i></div>
<button type="button" class="p3-btn" data-act="map">${T(W.mapb)}</button><div class="p3-list">${ZONES.map((z) => `<h3>${z.icon} ${T(z.name)}</h3>` + z.st.map((s) => stRow(s, d)).join('')).join('')}</div>`);
  };
  const menu = () => openSheet('menu', `<h2>${T(W.menu)}</h2><div class="p3-list">${ZONES.map((z) => `<button type="button" class="p3-row" data-act="goto" data-h="#${z.id}"><span aria-hidden="true">${z.icon}</span>${T(z.name)}</button>`).join('')}
<button type="button" class="p3-row" data-act="goto" data-h="#map"><span aria-hidden="true">🗺️</span>${T(W.mapN)}</button><button type="button" class="p3-row" data-act="goto" data-h="#welcome"><span aria-hidden="true">👋</span>${T(W.start)}</button></div>
<div class="p3-two"><button type="button" class="p3-btn" data-act="lang">${T(W.lang)}</button><button type="button" class="p3-btn" data-act="classic">${T(W.classic)}</button></div>`);
  const search = () => {
    openSheet('search', `<h2>${T(W.search)}</h2><input class="p3-q" type="search" placeholder="${T(W.find)}" aria-label="${T(W.find)}"><div class="p3-list p3-res"></div>`);
    const q = sheet.querySelector<HTMLInputElement>('.p3-q')!, res = sheet.querySelector('.p3-res')!;
    const run = () => {
      const s = q.value.trim().toLowerCase(), hits: string[] = [];
      for (const z of ZONES) if (!s || T(z.name).toLowerCase().includes(s)) hits.push(`<button type="button" class="p3-row" data-act="goto" data-h="#${z.id}"><span aria-hidden="true">${z.icon}</span><b>${T(z.name)}</b></button>`);
      for (const id of STATIONS) {
        const c = peek(id), name = stName(id, lang);
        let at = -1;
        if (s && c) c.ideas.forEach((i, k) => { if (at < 0 && (T(i.say) + i.things.map((t) => T(t.n) + T(t.s)).join(' ')).toLowerCase().includes(s)) at = k; });
        if (s && c && at < 0 && (T(c.lab.say) + ' ' + T(c.lab.why)).toLowerCase().includes(s)) at = c.ideas.length; // the experiment page
        if (!s || name.toLowerCase().includes(s) || id.toLowerCase() === s || at >= 0) hits.push(`<button type="button" class="p3-row" data-act="goto" data-h="#${id}${at > 0 ? '/' + at : ''}"><span aria-hidden="true">${stIcon(id)}</span><b>${name}</b>${at >= 0 && c ? `<small>${T(c.ideas[at]?.say ?? c.lab.say)}</small>` : ''}</button>`);
      }
      res.innerHTML = hits.join('');
    };
    q.addEventListener('input', run); run();
    /* the station words load on demand (one chunk per zone), then the search runs again */
    void Promise.all(ZONES.map((z) => content(z.st[0]!))).then(() => { if (root.dataset.sheet === 'search') run(); }).catch(() => { /* names only */ });
    win.setTimeout(() => q.focus(), 50);
  };
  const share = async () => {
    const url = win.location.href, nav = win.navigator as Navigator & { share?: (d: object) => Promise<void> };
    try { if (nav.share) { await nav.share({ title: doc.title, url }); return; } await nav.clipboard.writeText(url); } catch { /* cancelled */ }
    toast.textContent = T(W.copied); toast.hidden = false; win.setTimeout(() => { toast.hidden = true; }, 1600);
  };
  /* ---------- one click handler for everything ---------- */
  root.addEventListener('click', (e) => {
    if (root.dataset.card === '1' && !(e.target as HTMLElement).closest('.w3-card')) {
      if (cardAt === tapN) return; // the tap that just opened it
      closeCard(); if (kind() !== 'lab') return; // in a lab the same tap still works the experiment
    }
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-pick]'); if (!el) return;
    if (el.dataset.pick !== undefined && !el.dataset.act) { onPick(+el.dataset.pick); return; }
    const a = el.dataset.act;
    if (a === 'why') { why = !why; showBubble(); }
    else if (a === 'deep') { if (C && R.v === 'st') go({ v: 'st', s: R.s, p: kind() === 'lab' ? R.p + 1 : C.ideas.length }); }
    else if (a === 'cclose') closeCard();
    else if (a === 'close') { why = false; foc = null; if (R.v !== 'zone') view?.focus(null); showBubble(); }
    else if (a === 'enter') { closeSheet(); if (R.v === 'home' || R.v === 'welcome') go({ v: 'zone', z: (foc ?? 0) + 1, i: 0 }); else if (R.v === 'zone' && R.i) go({ v: 'st', s: ZONES[R.z - 1]!.st[R.i - 1]!, p: 0 }); }
    else if (a === 'back') { closeSheet(); up(); }
    else if (a === 'map') { closeSheet(); go({ v: 'map' }); }
    else if (a === 'next') { closeSheet(); go(nextOf()); }
    else if (a === 'again') { if (R.v === 'st') go({ v: 'st', s: R.s, p: 0 }); }
    else if (a === 'start') { ls.set(HI, 1); go({ v: 'home' }); }
    else if (a === 'prog') progress();
    else if (a === 'menu') menu();
    else if (a === 'search') search();
    else if (a === 'share') void share();
    else if (a === 'sclose') closeSheet();
    else if (a === 'dot') { if (R.v === 'st') go({ v: 'st', s: R.s, p: +(el.dataset.i ?? 0) }); }
    else if (a === 'goto') { closeSheet(); go(parseRoute(el.dataset.h ?? '')); }
    else if (a === 'lang') { closeSheet(); lang = lang === 'zh' ? 'en' : 'zh'; useApp.getState().setLang(lang); icons(); chrome(); free(); void build(); }
    else if (a === 'classic') { try { win.localStorage.setItem('si.view', 'classic'); } catch { /* private */ } win.location.assign(classicURL(win.location, R.v === 'st' ? R.s : 'H')); }
  });
  root.addEventListener('keydown', (e) => { const el = e.target as HTMLElement; if ((e.key === 'Enter' || e.key === ' ') && el.dataset.pick !== undefined && el.getAttribute('role') === 'button') { e.preventDefault(); onPick(+el.dataset.pick); } });
  const onNav = () => { const r = parseRoute(win.location.hash, ''); if (routeHash(r) !== routeHash(R)) go(r, false); };
  win.addEventListener('popstate', onNav); win.addEventListener('hashchange', onNav);
  /* a hidden tab frees the scene; coming back builds it again */
  doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'hidden') free(); else if (!view && !flat) void build(); });
  (win as unknown as { __w3?: unknown }).__w3 = {
    state: () => ({ r: R, kind: kind(), foc, why, live: !!view, qi, right: C && kind() === 'quiz' ? qo.indexOf(C.quiz[qi]!.a) : -1, lab: labOK, wrong: qWrong }),
    near: (nx: number, ny: number) => nt?.near(nx, ny)?.card.t ?? null,
    where: (i: number) => view?.where(i) ?? null, orbit: () => view?.orbit() ?? null, go, view: () => view,
  };
  if (R.v === 'welcome') ls.set(HI, 1);
  useApp.setState({ station: routeSt(R) });
  icons(); markSeen(); chrome(); caption(); void build();
}
