/* R38: the system explorer (the default page). Home = the 5 layers (layer 4 live); #L4… = the Transformer explorer.
   One screen: thin top bar, crumbs, the stage (three.js, or SVG without WebGL), the info card, hint, dots, and the
   round 地图 / 进度 / 下一步 buttons. Tapping a "+" box opens it in place; tapping the original box closes it. */
import './l4.css';
import '../lx/lx.css';
import { useApp } from '../store/app';
import { layout, type Desc, type Lay } from './layout';
import { FRAME, LAB, LAB_S, NODES, NODE_INFO, NODE_K, PLUS, RES, K_MATH, STEPN, UI, tx, type L, type Nd, type Tx } from './txt';
import { MY_DEFAULT, ORDER, Q, X_ORDER, hashOf, page, parse, validX, xHash, type Ans, type Ctx, type My, type Page } from './pages';
import type { Stage } from './scene3d';
import { LIVE, LX, LX_N, LX_SEL, isLx, layerOf, lxFrom, lxHash, lxPrev } from '../lx/ids';
import type { LxPg } from '../lx/types';
import type { Demo } from './tf/core';
import type { Trace } from './tf/model';
import { PATH, plan, QKEY, type QState } from '../px/qpath';
import { bump } from '../px/rec';

const LS = { get: <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } }, set: (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private */ } } };
const isPx = (id: string) => /^(P|R|S|Q)(\/[A-Za-z0-9.]+)?$/.test(id);
const pxNext = (id: string) => { const m = /^P\/([xq])(\d)$/.exec(id); if (m) return Number(m[2]) < 5 ? `#P/${m[1]}${Number(m[2]) + 1}` : m[1] === 'x' ? '#P/q1' : '#R'; return id === 'P' ? '#P/x1' : id === 'R' ? '#S' : id === 'Q' ? '#Q' : id === 'Q/done' ? '#P' : '#home'; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function start(doc: Document = document, win: Window = window) {
  if (doc.getElementById('l4')) return;
  const root = doc.createElement('div'); root.id = 'l4'; root.className = 'l4'; doc.body.appendChild(root);
  doc.documentElement.classList.add('l4-mode');
  root.innerHTML = `<header class="l4-top"><button type="button" class="l4-i" data-a="back"></button><div class="l4-tx" aria-live="polite"></div><button type="button" class="l4-i l4-lang" data-a="lang"></button></header>
<div class="l4-cr"><nav class="l4-crumb"></nav><button type="button" class="l4-mp" data-a="math"></button></div>
<main class="l4-main"><div class="l4-stg"></div><div class="l4-home" hidden></div></main>
<div class="l4-ent" hidden></div>
<section class="l4-info"></section>
<p class="l4-hint"></p><div class="l4-dots" aria-hidden="true"></div><div class="l4-qp" hidden></div>
<nav class="l4-nav"><button type="button" class="l4-r" data-a="map"></button><button type="button" class="l4-r" data-a="prog"></button><button type="button" class="l4-r pri" data-a="next"></button></nav>
<div class="l4-rot" aria-hidden="true"><div><b>⟲</b><p class="t"></p><p class="s"></p></div></div>`;
  const $ = <E extends HTMLElement>(s: string) => root.querySelector<E>(s)!;
  const stg = $('.l4-stg'), home = $('.l4-home'), info = $('.l4-info'), crumb = $('.l4-crumb'), mp = $('.l4-mp'), ent = $('.l4-ent'), hint = $('.l4-hint'), dots = $('.l4-dots'), txt = $('.l4-tx'), qp = $('.l4-qp');
  let lang: L = useApp.getState().lang === 'en' ? 'en' : 'zh';
  const T = (k: keyof typeof UI) => tx(UI[k] as Tx, lang);
  const lines0 = (() => { try { return JSON.parse(localStorage.getItem('si.l4.my.lines') || 'null') as string[] | null; } catch { return null; } })();
  const my: My = { lines: lines0 ?? MY_DEFAULT, prog: null, running: false, paused: false, ans: null, q: (lines0 ?? MY_DEFAULT)[0]!.split(/[→]/)[0]!, err: '', ready: !!localStorage.getItem('si.l4.my') };
  let d: Demo | null = null, u: { chars: string[]; tr: Trace } | null = null, a: Ans | null = null, tfm: typeof import('./tf/client') | null = null, myLoaded = false;
  let cur = 'home', pg: Page | null = null, sel: Nd | null = null, back = '#L4', S: Stage | null = null, stP: Promise<Stage> | null = null, lay: Lay | null = null;
  const seen = new Set<string>(LS.get<string[]>('si.l4.seen', [])), opened = new Set<string>(LS.get<string[]>('si.l4.cards', []));
  const flat = /[?&]fb=1/.test(win.location.search);
  let lp: LxPg | null = null, lxTok = 0;
  const H = (id: string) => (isLx(id) ? lxHash(id) : hashOf(id)), lxOn = (id: string) => isLx(id) && LIVE.includes(layerOf(id));
  const ctx = (): Ctx => ({ l: lang, d, u, a, my });

  /* ---------- the model (a lazy worker) ---------- */
  const tf = async () => (tfm ??= await import('./tf/client'));
  let loading = false;
  const load = async () => {
    if (loading) return; loading = true; const c = await tf();
    c.tf.on((p) => { my.prog = p; if (p.done) { my.running = false; my.ready = true; myLoaded = true; } if (cur === 'MY2') throttle(); });
    d = await c.tf.demo(); render(); u = await c.tf.trace(Q); a = await c.tf.answer(Q); root.dataset.ready = '1'; render();
  };
  /* while training, only the panel's progress parts change: keep the pause button node so a tap is never lost */
  const patchMy = () => { const pn = root.querySelector<HTMLElement>('.l4-pn[data-page="MY2"]'); if (!pn) return false;
    const tmp = document.createElement('div'); tmp.innerHTML = page(cur, ctx()).panel ?? ''; const o = pn.querySelector('.l4-row'), n = tmp.querySelector('.l4-row');
    if (o && n && o.innerHTML === n.innerHTML) n.replaceWith(o); pn.replaceChildren(...tmp.childNodes); return true; };
  let tq = 0; const throttle = () => { const now = Date.now(); if (now - tq > 180 || my.prog?.done) { tq = now; if (my.prog?.done || !patchMy()) render(); } };

  /* ---------- the stage ---------- */
  const stage = (): Promise<Stage> => (stP ??= (async () => {
    const m3 = flat ? null : await import('./scene3d');
    if (m3 && m3.webgl()) { try { S = m3.stage3d(stg, pick); root.dataset.gl = '3d'; return S; } catch { /* fall through */ } }
    const f = await import('./flat'); S = f.stageFlat(stg); root.dataset.gl = '2d'; return S;
  })());
  const pick = (n: Nd) => {
    if (!pg) return;
    if (pg.kind === 'x') { if (n === pg.sel || !PLUS.has(n)) { go(back); return; } go(xHash(n)); return; }
    if (PLUS.has(n)) { back = hashOf(cur); go(xHash(n)); return; }
    sel = sel === n ? null : n; drawInfo(); drawLabels();
  };
  const go = (h: string) => { if (win.location.hash === h) route(); else win.location.hash = h; };

  /* ---------- rendering ---------- */
  function drawTop(p: Page | null) {
    if (!p) { txt.innerHTML = `<b class="l4-tt">${T('title')}</b>`; return; }
    let s = Q, extra = '';
    if (p.top === 'tr') extra = '<span class="arr">→</span><span class="ch g">蓝</span>';
    else if (p.top.startsWith('us9:')) extra = `<span class="arr">→</span><span class="ch g">${esc(p.top.slice(4) || '?')}</span>`;
    else if (p.top === 'my') { const f = my.lines[0] ?? ''; s = f.split('→')[0] ?? f; }
    txt.innerHTML = `<span class="l4-chips">${Array.from(s).map((c) => `<span class="ch">${esc(c)}</span>`).join('')}${extra}</span>`;
  }
  function drawInfo() {
    if (!pg) return; const v = sel ? NODE_INFO[sel].map((t) => tx(t, lang)) : pg.info, k = sel ? NODE_K[sel] : pg.k;
    const ls: (keyof typeof UI)[] = ['what', 'parts', 'how', 'why'];
    info.innerHTML = `<div class="l4-ih"><b>${sel ? tx(LAB[sel], lang) : esc(pg.crumb[pg.crumb.length - 1]![0])}</b><button type="button" class="l4-kb" data-k="${k}">${T('kc')} ${k}</button></div><dl>${ls.map((x, i) => `<div><dt>${T(x)}</dt><dd>${esc(v[i]!)}</dd></div>`).join('')}</dl>`;
    const m = pg.math ?? K_MATH[k] ?? null; mp.hidden = !m; mp.textContent = T('math'); mp.dataset.k = m ?? ''; delete mp.dataset.go;
  }
  function drawLabels() {
    if (!pg || !lay) return; const L = lay;
    stg.querySelectorAll('.l4-lb,.l4-fl,.l4-rl,.l4-pn,.l4-tag,.l4-note').forEach((e) => e.remove());
    const add = (cls: string, x: number, y: number, w: number | null, hh: number | null, html: string, tag = 'div') => {
      const e = doc.createElement(tag); e.className = cls; Object.assign(e.style, { left: x + 'px', top: y + 'px', ...(w != null ? { width: w + 'px' } : {}), ...(hh != null ? { height: hh + 'px' } : {}) }); e.innerHTML = html; stg.appendChild(e); return e;
    };
    for (const n of NODES) {
      const b = L.box[n], st = sel === n && pg.kind !== 'x' ? 'sel' : pg.st[n];
      const e = add(`l4-lb st-${st}${PLUS.has(n) ? ' plus' : ''}`, b.x, b.y, b.w, b.h, `<span class="t">${tx(LAB[n], lang)}</span>${PLUS.has(n) ? '<i aria-hidden="true">+</i>' : ''}`, 'button');
      (e as HTMLButtonElement).type = 'button'; e.dataset.nd = n; e.setAttribute('aria-label', tx(LAB[n], lang) + (PLUS.has(n) ? ' +' : ''));
      if (PLUS.has(n)) e.setAttribute('aria-expanded', String(pg.sel === n));
      // never truncate: first a shorter name, then 12px (the floor), then tighter letters
      const t = e.querySelector<HTMLElement>('.t')!, over = () => t.scrollWidth > t.clientWidth + 0.5;
      if (over() && LAB_S[n]) t.textContent = tx(LAB_S[n]!, lang);
      if (over()) e.style.fontSize = '12px';
      if (over()) t.style.letterSpacing = '-0.04em';
      if (over()) e.dataset.tight = '1';
    }
    add(`l4-fl${pg.frameLit ? ' on' : ''}`, L.frame.x + 8, L.frame.y + 2, null, null, esc(pg.frameTag ?? tx(FRAME, lang)));
    if (L.mode === 'full') for (const r of L.res) { const e = add('l4-rl', L.xR + 3, (r[1]![1] + r[2]![1]) / 2, null, null, tx(RES, lang)); e.style.transform = 'translateY(-50%)'; }
    if (L.panel && pg.panel != null) { const P = L.panel; const e = add(`l4-pn${L.mode === 'xl' ? ' xl' : ''}`, P.x, P.y, P.w, P.h, pg.panel); e.dataset.page = pg.id; }
    const tx0 = L.frame.x + L.frame.w + 8, tw = L.W - 4 - tx0;
    for (const t of pg.tags) { const b = L.box[t.nd]; add('l4-tag', tx0, b.y + b.h / 2 - 11, tw, null, t.h); }
    if (pg.notes) { add('l4-note', tx0, L.box.out.y, tw, null, esc(pg.notes[0])); add('l4-note', tx0, L.box.tok.y, tw, null, esc(pg.notes[1])); }
  }
  async function drawStage() {
    if (!pg) return; stg.querySelectorAll(LX_SEL).forEach((e) => e.remove()); stg.querySelectorAll<HTMLElement>('.lx-gl').forEach((e) => { e.style.display = 'none'; }); if (S) S.el.style.display = '';
    const r = stg.getBoundingClientRect(); lay = layout(Math.round(r.width), Math.round(r.height), pg.mode);
    drawLabels(); const D: Desc = { lay, st: { ...pg.st, ...(sel && pg.kind !== 'x' ? { [sel]: 'sel' } : {}) }, back: pg.back, resOn: pg.resOn, frameLit: pg.frameLit, sel: pg.sel, flow: pg.flow };
    const s = await stage(); s.set(D);
  }
  function drawHome() {
    const lv = [0, 1, 2, 3, 4].map((i) => { const on = LIVE.includes(i + 1); return `<button type="button" class="l4-lv${on ? ' live' : ''}" data-go="#L${i + 1}" style="--w:${56 + i * 11}%"><span class="n">${tx(UI.lv[i]!, lang)}</span><b>${tx(UI.lvN[i]!, lang)}</b><span class="s">${on ? T('live') : T('soon')}</span></button>`; }).join('');
    const hr = (go: string, k: string, s: string, pri = false) => `<button type="button" class="l4-hr${pri ? ' pri' : ''}" data-go="${go}"><b>${k}</b><span>${s}</span></button>`;
    home.innerHTML = `<div class="l4-pyr">${lv}</div><div class="l4-hb">${hr('#L1', T('learn'), T('learnS'), true)}${hr('#P', tx(['练', 'Practice'], lang), tx(['实验和小测', 'Try & quiz'], lang))}${hr('#R', T('record'), T('recordS'))}${hr('#S', tx(['享', 'Share'], lang), tx(['做分享卡', 'Make a card'], lang))}</div><button type="button" class="l4-qk" data-go="#Q">⏱ ${tx(['10 分钟快速路径', '10-minute quick path'], lang)} · ${tx(['约 {m} 分钟', 'about {m} min'], lang).replace('{m}', String(Math.round(plan(lang).total / 60)))}</button>`;
  }
  function drawSoon(i: number) {
    home.innerHTML = `<div class="l4-soon"><p class="n">${tx(UI.lv[i]!, lang)}</p><h2>${tx(UI.lvN[i]!, lang)}</h2><p class="tag">${T('soon')}</p><p>${T('soonP')}</p><button type="button" class="l4-b gold" data-go="#L4">${T('goL4')}</button></div>`;
  }
  function render() {
    root.dataset.lang = lang; $('[data-a="lang"]').textContent = T('lang'); $('[data-a="lang"]').setAttribute('aria-label', T('langL'));
    $('[data-a="back"]').textContent = '‹'; $('[data-a="back"]').setAttribute('aria-label', T('back'));
    $('[data-a="map"]').innerHTML = `<b><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1.5 3.5 5.5 2l5 1.5 4-1.5v10.5l-4 1.5-5-1.5-4 1.5z M5.5 2v10.5 M10.5 3.5V14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></b><span>${T('map')}</span>`; $('[data-a="prog"]').innerHTML = `<b><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 8V2a6 6 0 0 1 5.2 9z" fill="currentColor"/></svg></b><span>${T('prog')}</span>`; $('[data-a="next"]').innerHTML = `<b>›</b><span>${T('next')}</span>`;
    $('.l4-rot .t').textContent = T('rot'); $('.l4-rot .s').textContent = T('rotS');
    const isL4 = cur === 'L4' || /^(TR|US|MY)\d$/.test(cur) || cur.startsWith('X:'), soon = /^L[1235]$/.test(cur) && !lxOn(cur);
    root.dataset.page = cur;
    if (lxOn(cur)) { pg = null; root.dataset.v = 'lx'; home.hidden = true; stg.hidden = false; void renderLx(); return; }
    if (isPx(cur)) { lxTok++; lp = null; pg = null; root.dataset.v = 'px'; home.hidden = false; stg.hidden = true; mp.hidden = true; info.innerHTML = ''; ent.hidden = true; hint.textContent = ''; dots.innerHTML = ''; if (S) S.el.style.display = 'none'; void renderPx(); return; }
    lxTok++; lp = null; root.dataset.v = isL4 ? 'l4' : soon ? 'soon' : 'home';
    home.hidden = isL4; stg.hidden = !isL4;
    if (!isL4) { pg = null; drawTop(null); crumb.innerHTML = soon ? `<a href="#home">${T('home')}</a><span>›</span><span>${tx(UI.lv[Number(cur[1]) - 1]!, lang)}</span>` : `<span>${T('home')}</span>`; mp.hidden = true; info.innerHTML = ''; ent.hidden = true; hint.textContent = soon ? '' : T('sub'); dots.innerHTML = '';
      if (soon) drawSoon(Number(cur[1]) - 1); else drawHome(); return; }
    if (!d) void load();
    pg = page(cur, ctx()); drawTop(pg);
    crumb.innerHTML = pg.crumb.map(([t, h], i) => (h ? `<a href="${h}">${esc(t)}</a>` : `<span${i === pg!.crumb.length - 1 ? ' class="cur"' : ''}>${esc(t)}</span>`)).join('<span class="sep">›</span>') + (pg.up ? ` <a class="l4-up" href="${pg.up}">${T('up')}</a>` : '');
    ent.hidden = !pg.ent; ent.innerHTML = pg.ent ? `<button type="button" class="l4-b" data-go="#L4/tr/1">${T('entTr')}</button><button type="button" class="l4-b" data-go="#L4/us/1">${T('entUs')}</button><button type="button" class="l4-b gold" data-go="#L4/my/1">${T('entMy')}</button>` : '';
    hint.textContent = pg.hint; dots.innerHTML = pg.dots ? Array.from({ length: pg.dots[0] }, (_, i) => `<i class="${i === pg!.dots![1] ? 'on' : i < pg!.dots![1] ? 'done' : ''}"></i>`).join('') : '';
    drawInfo(); void drawStage();
  }
  /* ---------- layers 1, 2, 3 and 5 (lazy, one chunk per layer) ---------- */
  const crumbs = (c: [string, string | null][], up: string | null = null) => c.map(([t, h], i) => (h ? `<a href="${h}">${esc(t)}</a>` : `<span${i === c.length - 1 ? ' class="cur"' : ''}>${esc(t)}</span>`)).join('<span class="sep">›</span>') + (up ? ` <a class="l4-up" href="${up}">${T('up')}</a>` : '');
  async function renderLx() {
    const id = cur, l = lang, tok = ++lxTok, v = await import('../lx/view'), p = await v.lxPage(id, l);
    if (tok !== lxTok) return; lp = p; delete root.dataset.lx; delete root.dataset.cmp;
    txt.innerHTML = p.top; crumb.innerHTML = crumbs(p.crumb);
    ent.hidden = !p.ent; ent.innerHTML = (p.ent ?? []).map(([t, h, g]) => `<button type="button" class="l4-b${g ? ' gold' : ''}" data-go="${h}">${esc(t)}</button>`).join('');
    hint.textContent = p.hint; dots.innerHTML = p.dots ? Array.from({ length: p.dots[0] }, (_, i) => `<i class="${i === p.dots![1] ? 'on' : i < p.dots![1] ? 'done' : ''}"></i>`).join('') : '';
    const ls: (keyof typeof UI)[] = ['what', 'parts', 'how', 'why'];
    info.innerHTML = `<div class="l4-ih"><b>${esc(p.ttl)}</b><button type="button" class="l4-kb" data-k="${p.k}">${T('kc')} ${p.k}</button></div><dl>${ls.map((x, i) => `<div><dt>${T(x)}</dt><dd>${esc(p.info[i]!)}</dd></div>`).join('')}</dl>`;
    const m = p.math ?? K_MATH[p.k] ?? null;
    if (p.mg) { mp.hidden = false; mp.textContent = p.mg[0]; mp.dataset.go = p.mg[1]; mp.dataset.k = ''; } else { mp.hidden = !m; mp.textContent = T('math'); mp.dataset.k = m ?? ''; delete mp.dataset.go; }
    stg.querySelectorAll('.l4-lb,.l4-fl,.l4-rl,.l4-pn,.l4-tag,.l4-note').forEach((e) => e.remove()); if (S) S.el.style.display = 'none';
    await v.lxDraw(root, stg, p, l, flat, (n) => { const h = lp?.go[n]; if (h) go(h); });
    if (tok === lxTok) root.dataset.lx = `${id}.${l}`;
  }
  /* ---------- 练 / 记 / 享 / 快速路径 (lazy) ---------- */
  let pxTok = 0;
  async function renderPx() {
    const id = cur, l = lang, tok = ++pxTok; delete root.dataset.px; const v = await import('../px/view'); if (tok !== pxTok) return;
    await v.px(id, { root, host: home, l, go, tf, seen, opened: new Set(LS.get<string[]>('si.l4.cards', [])), still: () => tok === pxTok && cur === id && lang === l,
      top: (h) => { txt.innerHTML = h; }, crumb: (c) => { crumb.innerHTML = crumbs(c); } });
  }
  const qGet = () => LS.get<QState | null>(QKEY, null), stopOf = (h: string) => { const i = parse(h).id; return lxFrom(i) ?? i; };
  function drawQp() {
    const q = qGet(), on = !!q?.on && !isPx(cur) && cur !== 'home'; qp.hidden = !on; hint.hidden = on; dots.hidden = on; if (!on) return;
    const p = plan(lang), j = PATH.findIndex(([h]) => stopOf(h) === cur), i = j >= 0 ? j : q!.i, left = p.sec.slice(i).reduce((a, b) => a + b, 0);
    qp.innerHTML = `<span>${tx(['快速路径 {i}/{n} · 还剩约 {m} 分钟', 'Quick path {i}/{n} · about {m} min left'], lang).replace('{i}', String(i + 1)).replace('{n}', String(PATH.length)).replace('{m}', String(Math.max(1, Math.round(left / 60))))}${j < 0 ? tx([' · 点「下一步」回到路径', ' · tap Next to rejoin'], lang) : ''}</span><b class="bar"><i style="width:${Math.round((i / PATH.length) * 100)}%"></i></b><button type="button" data-a="qx" aria-label="${tx(['退出快速路径', 'Leave the quick path'], lang)}">×</button>`;
  }
  /* ---------- sheets: card, map, progress ---------- */
  let cardFor = '';
  async function card(id: string | null) {
    root.querySelector('.l4-sheet')?.remove(); if (!id) { cardFor = ''; return; }
    const [k, p] = id.split('.') as [string, string | undefined]; opened.add(k); LS.set('si.l4.cards', [...opened]);
    const m = await import('./sheet'); cardFor = id;
    await m.openCard(root, lang, k, p === '2' ? 2 : 1, (s) => go(H(cur) + (s ? '~' + s : '')), `${location.origin}${location.pathname}?lang=${lang}${H(cur)}`);
  }
  function list(title: string, body: string) {
    root.querySelector('.l4-sheet')?.remove(); const e = doc.createElement('div'); e.className = 'l4-sheet l4-ms'; e.setAttribute('role', 'dialog'); e.setAttribute('aria-label', title);
    e.innerHTML = `<div class="l4-sin"><header class="l4-sh"><b class="l4-kn">${title}</b></header><div class="l4-sbody">${body}</div><footer class="l4-sf"><button type="button" class="l4-b" data-s="x">${T('close')}</button></footer></div>`;
    e.addEventListener('click', (ev) => { const t = ev.target as HTMLElement; if (t === e || t.closest('[data-s="x"]') || t.closest('a,[data-go]')) e.remove(); }); root.appendChild(e);
  }
  const li = (id: string, label: string) => `<a href="${H(id)}" class="${id === cur ? 'here' : seen.has(id) ? 'seen' : ''}">${esc(label)}${id === cur ? ` <em>${T('here')}</em>` : ''}</a>`;
  function mapSheet() {
    const sec = (t: string, ids: string[], ns: Tx[]) => `<h4>${esc(t)}</h4><div class="l4-ml">${ids.map((id, i) => li(id, tx(ns[i]!, lang))).join('')}</div>`;
    const xs = X_ORDER.map((p) => 'X:' + p), xn: Tx[] = [LAB.att, ['Q·K 打分', 'Q·K scores'], ['一个数', 'One number'], ['多头', 'Heads'], ['遮罩', 'Mask'], LAB.ffn, LAB.an1];
    const lxs = (n: 1 | 2 | 3 | 5) => LIVE.includes(n) ? sec(`${tx(UI.lv[n - 1]!, lang)} ${tx(UI.lvN[n - 1]!, lang)}`, LX[n], LX[n].map((id) => LX_N[id]!)) : '';
    const soonL = [1, 2, 3, 5].filter((n) => !LIVE.includes(n)).map((n) => `<a href="#L${n}">${tx(UI.lv[n - 1]!, lang)} ${tx(UI.lvN[n - 1]!, lang)} <em>${T('soon')}</em></a>`).join('');
    list(T('mapT'), `<div class="l4-ml">${li('home', T('home'))}${soonL}</div>` + lxs(1) + lxs(2) + lxs(3)
      + sec(T('L4'), ['L4'], [UI.whole as Tx]) + sec(T('trN'), ORDER.slice(1, 7), STEPN.tr) + sec(T('usN'), ORDER.slice(7, 16), STEPN.us) + sec(T('myN'), ORDER.slice(16), STEPN.my) + sec(T('xN'), xs, xn) + lxs(5));
  }
  /* ---------- routing ---------- */
  function route() {
    const r = parse(win.location.hash); let id = r.id; const lid = lxFrom(id);
    if (lid) id = LIVE.includes(layerOf(lid)) ? lid : 'L' + layerOf(lid);
    if (id.startsWith('X:') && !validX(id.slice(2))) id = 'L4';
    if (!(lid || id === 'home' || id === 'L4' || ORDER.includes(id) || id.startsWith('X:') || /^L[1235]$/.test(id) || isPx(id))) id = 'home';
    if (id !== cur) { sel = null; if (!id.startsWith('X:') && id !== 'home') back = H(id); }
    if (id === 'MY3' && my.ready && !myLoaded && !my.running) { myLoaded = true; void tf().then((c) => c.tf.loadMy()); }
    if (id !== cur) bump();
    const q = qGet(); if (q?.on) { const j = PATH.findIndex(([h]) => stopOf(h) === id); if (j >= 0 && j !== q.i) LS.set(QKEY, { ...q, i: j, max: Math.max(q.max, j) }); }
    cur = id; if (!isPx(id)) { seen.add(id); LS.set('si.l4.seen', [...seen]); } root.querySelector('.l4-ms')?.remove();
    render(); drawQp();
    const want = r.card && /^K[MABC]?\d\d(\.2)?$/.test(r.card) ? r.card : null; if (want !== cardFor || want) void card(want);
    doc.documentElement.dataset.l4 = `${cur}.${lang}`;
  }
  /* ---------- events ---------- */
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement, b = t.closest<HTMLElement>('button,[data-go]'); if (!b || !root.contains(b)) return;
    if (b.closest('.l4-sheet:not(.l4-ms)')) return;
    if (b.dataset.nd) { pick(b.dataset.nd as Nd); return; }
    if (b.dataset.lx) { const h = lp?.go[b.dataset.lx]; if (h) go(h); return; }
    if (b.dataset.go) { go(b.dataset.go); return; }
    if (b.dataset.k) { go(H(cur) + '~' + b.dataset.k); return; }
    if (b.dataset.act) { void act(b.dataset.act); return; }
    switch (b.dataset.a) {
      case 'back': if (isPx(cur)) go(/^P\/./.test(cur) ? '#P' : cur === 'Q/done' ? '#Q' : '#home'); else if (lxOn(cur)) go(lxPrev(cur)); else if (cur.startsWith('X:') && pg?.up) go(pg.up); else if (cur.startsWith('X:')) go(back); else if (cur === 'L4' || /^L\d$/.test(cur)) go('#home'); else if (cur === 'home') go('#home'); else { const i = ORDER.indexOf(cur); go(i > 0 ? hashOf(ORDER[i - 1]!) : '#L4'); } break;
      case 'lang': lang = lang === 'zh' ? 'en' : 'zh'; useApp.getState().setLang(lang); route(); break;
      case 'math': if (mp.dataset.k) go(H(cur) + '~' + mp.dataset.k); break;
      case 'map': mapSheet(); break;
      case 'prog': go('#R'); break;
      case 'qx': { const q = qGet(); if (q) LS.set(QKEY, { ...q, on: false }); drawQp(); break; }
      case 'next': { const q = qGet(); if (q?.on && !isPx(cur)) { const j = PATH.findIndex(([h]) => stopOf(h) === cur), n = j < 0 ? q.i : j + 1; if (n >= PATH.length) { go('#Q/done'); break; } const [h, c] = PATH[n]!; go(h + (c ? '~' + c : '')); break; } }
        if (isPx(cur)) { go(pxNext(cur)); break; }
        go(cur === 'home' ? '#L1' : lxOn(cur) ? lp?.next ?? '#L4' : /^L[1235]$/.test(cur) ? '#L4' : pg?.next ?? '#L4'); break;
    }
  });
  root.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement; if (t.dataset.my === 'lines') my.lines = t.value.split('\n'); else if (t.dataset.my === 'q') my.q = t.value;
  });
  async function act(x: string) {
    const c = await tf();
    if (x === 'my-add') { const ta = root.querySelector<HTMLTextAreaElement>('[data-my="lines"]'); if (ta) { ta.value = ta.value.replace(/\n*$/, '') + '\n'; my.lines = ta.value.split('\n'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } return; }
    if (x === 'my-train') {
      const { splitQA } = await import('./tf/model'); const ls = my.lines.map((s) => s.trim()).filter(Boolean);
      const tooLong = (s: string) => { const qa = splitQA(s); return !qa || Array.from(qa.q + qa.a).length > 24; }; // q + a + END must fit ctx 24 (+1 target)
      const bad = ls.find(tooLong);
      if (!ls.length || ls.length > 8 || bad) { my.err = bad ? (splitQA(bad) ? tx(['这一行超过 24 字：', 'This line is over 24 chars: '], lang) : tx(['这一行格式不对：', 'This line is not “question？→answer”: '], lang)) + bad : tx(['请写 1–8 题', 'Please write 1–8 lines'], lang); render(); return; }
      my.err = ''; my.lines = ls; my.ans = null; my.prog = null; my.running = true; my.paused = false; my.ready = false; myLoaded = true; my.q = ls[0]!.split('→')[0]!;
      c.rememberLines(ls, 300); const r = await c.tf.trainMy(ls, 300); if (r.error) { my.err = r.error; my.running = false; render(); return; }
      go('#L4/my/2'); return;
    }
    if (x === 'my-pause') { my.paused = true; await c.tf.pause(); render(); return; }
    if (x === 'my-resume') { my.paused = false; await c.tf.resume(); render(); return; }
    if (x === 'my-test') { if (!my.ready) { render(); return; } my.ans = await c.tf.answer(my.q, 'my'); render(); }
  }
  win.addEventListener('hashchange', route);
  let rz = 0; win.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (pg) void drawStage(); else if (lxOn(cur)) void renderLx(); }); });
  useApp.subscribe((s) => { const l: L = s.lang === 'en' ? 'en' : 'zh'; if (l !== lang) { lang = l; route(); } });
  route();
}
