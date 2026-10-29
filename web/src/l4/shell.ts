/* R38: the system explorer (the default page). Home = the 5 layers (layer 4 live); #L4… = the Transformer explorer.
   One screen: thin top bar, crumbs, the stage (three.js, or SVG without WebGL), the info card, hint, dots, and the
   round 地图 / 进度 / 下一步 buttons. Tapping a "+" box opens it in place; tapping the original box closes it. */
import './l4.css';
import '../lx/lx.css';
import { useApp } from '../store/app';
import { layout, type Desc, type Lay } from './layout';
import { FRAME, LAB, LAB_S, NODES, NODE_INFO, NODE_K, PLUS, RES, K_MATH, STEPN, UI, tx, type L, type Nd, type Tx } from './txt';
import { MY_DEFAULT, ORDER, Q, fixLines, X_ORDER, hashOf, page, parse, validX, xHash, type Ans, type Ctx, type My, type Page } from './pages';
import type { Stage } from './scene3d';
import { LIVE, LX, LX_N, LX_SEL, isLx, layerOf, lxFrom, lxHash, lxPrev } from '../lx/ids';
import type { LxPg } from '../lx/types';
import type { Demo } from './tf/core';
import type { Trace } from './tf/model';
import { PATH, plan, QKEY, type QState } from '../px/qpath';
import { bump } from '../px/rec';
import { applyAnim } from '../store/prefs';
import { normCrumb } from './crumb';
import { gramOn } from './gram';
import type { Step } from '../px/view';
import { lastPage, layerStats, lvTag, pageLayer, pageName, pbar, pushRecent } from './progress';

const LS = { get: <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } }, set: (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private */ } } };
const isPx = (id: string) => /^(P|R|S|Q)(\/[A-Za-z0-9.]+)?$/.test(id);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function start(doc: Document = document, win: Window = window) {
  if (doc.getElementById('l4')) return;
  const root = doc.createElement('div'); root.id = 'l4'; root.className = 'l4'; doc.body.appendChild(root);
  doc.documentElement.classList.add('l4-mode'); applyAnim(doc);
  root.innerHTML = `<header class="l4-top"><button type="button" class="l4-i" data-a="back"></button><div class="l4-tx" aria-live="polite"></div><button type="button" class="l4-i l4-menu" data-a="menu" aria-haspopup="dialog"></button><button type="button" class="l4-i l4-gear" data-a="set"></button><button type="button" class="l4-i l4-lang" data-a="lang"></button></header>
<div class="l4-cr"><nav class="l4-crumb"></nav><button type="button" class="l4-mp" data-a="math"></button></div><div class="l4-qp" hidden></div>
<main class="l4-main"><div class="l4-stg"></div><div class="l4-home" hidden></div></main>
<div class="l4-ent" hidden></div>
<section class="l4-info"></section>
<p class="l4-hint"></p><div class="l4-dots" aria-hidden="true"></div>
<nav class="l4-nav g-nav" hidden></nav>
<div class="l4-rot" aria-hidden="true"><div><b>⟲</b><p class="t"></p><p class="s"></p></div></div>`;
  const $ = <E extends HTMLElement>(s: string) => root.querySelector<E>(s)!;
  gramOn(root);
  const nav = $('.l4-nav'), stg = $('.l4-stg'), home = $('.l4-home'), info = $('.l4-info'), crumb = $('.l4-crumb'), mp = $('.l4-mp'), ent = $('.l4-ent'), hint = $('.l4-hint'), dots = $('.l4-dots'), txt = $('.l4-tx'), qp = $('.l4-qp');
  let lang: L = useApp.getState().lang === 'en' ? 'en' : 'zh';
  const T = (k: keyof typeof UI) => tx(UI[k] as Tx, lang);
  const lines0 = (() => { try { return JSON.parse(localStorage.getItem('si.l4.my.lines') || 'null') as string[] | null; } catch { return null; } })();
  const my: My = { lines: lines0 ?? MY_DEFAULT, prog: null, running: false, paused: false, ans: null, q: (lines0 ?? MY_DEFAULT)[0]!.split(/[→]/)[0]!, err: '', ready: !!localStorage.getItem('si.l4.my') };
  let d: Demo | null = null, u: { chars: string[]; tr: Trace } | null = null, a: Ans | null = null, tfm: typeof import('./tf/client') | null = null, myLoaded = false;
  let cur = 'home', pg: Page | null = null, sel: Nd | null = null, back = '#L4', S: Stage | null = null, stP: Promise<Stage> | null = null, lay: Lay | null = null;
  const seen = new Set<string>(LS.get<string[]>('si.l4.seen', [])), opened = new Set<string>(LS.get<string[]>('si.l4.cards', []));
  const flat = /[?&]fb=1/.test(win.location.search);
  let lp: LxPg | null = null, lxTok = 0, pxStep: Step | null = null, stepNow: Step | null = null;
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
  /* the info box like the reference: four rows, a tall gold 知识卡 button on the right (the card id is in its label) */
  const infoHtml = (v: readonly string[], k: string, ls: (keyof typeof UI)[]) => `<dl>${ls.map((x, i) => `<div><dt>${T(x)}</dt><dd>${esc(v[i]!)}</dd></div>`).join('')}</dl><button type="button" class="l4-kb" data-k="${k}" aria-label="${T('kcT')} ${k}"><span>${T('kc')}</span></button>`;
  function drawTop(p: Page | null) {
    if (!p) { txt.innerHTML = `<b class="l4-tt l4-brand">${T('brand')}<span class="l4-bsub">${T('title')}</span></b>`; return; }
    /* like the reference: a title on the overview, the worked example while training, the live question (→ ?) elsewhere */
    const tt = p.kind === 'l4' ? T('topL4') : p.kind === 'tr' ? T('topTr') : p.kind === 'my' ? T('topMy') : '';
    if (tt) { txt.innerHTML = `<b class="l4-tt">${esc(tt)}</b>`; return; }
    const out = p.top.startsWith('us9:') ? p.top.slice(4) || '?' : '?';
    txt.innerHTML = `<span class="l4-chips">${Array.from(Q).map((c) => `<span class="ch">${esc(c)}</span>`).join('')}<span class="arr">→</span><span class="ch g">${esc(out)}</span></span>`;
  }
  function drawInfo() {
    if (!pg) return; const v = sel ? NODE_INFO[sel].map((t) => tx(t, lang)) : pg.info, k = sel ? NODE_K[sel] : pg.k;
    const ls: (keyof typeof UI)[] = ['what', 'parts', 'how', 'why'];
    info.innerHTML = infoHtml(v, k, ls);
    const m = pg.kind === 'l4' || pg.kind === 'my' ? null : pg.math ?? K_MATH[k] ?? null; mp.hidden = !m; mp.textContent = T('math').replace(/\s*›$/, ''); mp.className = 'l4-mp g-info'; mp.dataset.k = m ?? ''; delete mp.dataset.go;
  }
  function drawLabels() {
    if (!pg || !lay) return; const L = lay;
    stg.querySelectorAll('.l4-lb,.l4-fl,.l4-rl,.l4-pn,.l4-tag,.l4-note').forEach((e) => e.remove());
    const add = (cls: string, x: number, y: number, w: number | null, hh: number | null, html: string, tag = 'div') => {
      const e = doc.createElement(tag); e.className = cls; Object.assign(e.style, { left: x + 'px', top: y + 'px', ...(w != null ? { width: w + 'px' } : {}), ...(hh != null ? { height: hh + 'px' } : {}) }); e.innerHTML = html; stg.appendChild(e); return e;
    };
    for (const n of NODES) {
      const b = L.box[n], st = sel === n && pg.kind !== 'x' ? 'sel' : pg.st[n];
      const e = add(`l4-lb st-${st}${PLUS.has(n) ? ' plus' : ''}`, b.x, b.y, b.w, b.h, `<span class="t">${tx(LAB[n], lang)}</span>${PLUS.has(n) ? '<i class="g-bdg" aria-hidden="true">›</i>' : ''}`, 'button');
      (e as HTMLButtonElement).type = 'button'; e.dataset.nd = n; e.setAttribute('aria-label', tx(LAB[n], lang) + (PLUS.has(n) ? tx(['，进入细节页', ', opens its page'], lang) : ''));
      if (PLUS.has(n)) e.setAttribute('aria-expanded', String(pg.sel === n));
      // never truncate: keep the full name if 12px (the floor) with tighter letters fits, as the reference does; else a shorter name
      const t = e.querySelector<HTMLElement>('.t')!, over = () => t.scrollWidth > t.clientWidth + 0.5;
      if (over()) e.style.fontSize = '12px';
      if (over()) { t.style.letterSpacing = '-0.04em'; e.dataset.tight = '1'; }
      if (over() && LAB_S[n]) { t.textContent = tx(LAB_S[n]!, lang); t.style.letterSpacing = ''; if (over()) t.style.letterSpacing = '-0.04em'; }
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
    const lv = [0, 1, 2, 3, 4].map((i) => { const on = LIVE.includes(i + 1); return `<button type="button" class="l4-lv${on ? ' live' : ''}" data-go="#L${i + 1}" style="--w:${56 + i * 11}%"><span class="n">${tx(UI.lv[i]!, lang)}</span><b>${tx(UI.lvN[i]!, lang)}</b>${on ? '' : `<span class="s">${T('soon')}</span>`}<i class="g-bdg" aria-hidden="true">›</i></button>`; }).join('');
    const hr = (go: string, k: string, s: string, pri = false) => `<button type="button" class="l4-hr${pri ? ' pri' : ''}" data-go="${go}"><b>${k}</b><span>${s}</span><i class="g-bdg" aria-hidden="true">›</i></button>`;
    home.innerHTML = `<div class="l4-pyr">${lv}</div><div class="l4-hb">${hr('#L1', T('learn'), T('learnS'), true)}${hr('#P', tx(['练', 'Practice'], lang), tx(['实验和小测', 'Try & quiz'], lang))}${hr('#R', T('record'), T('recordS'))}${hr('#S', tx(['享', 'Share'], lang), tx(['做分享卡', 'Make cards'], lang))}</div>${goCard()}`;
  }
  /* R42 G1 / G1b: a first visit gets the quick path; a returning reader gets 继续上次 with that layer's progress */
  function goCard() {
    const last = lastPage();
    if (!last) return `<div class="l4-go"><div class="r"><b>${tx(['从这里开始', 'Start here'], lang)}</b><span class="m">${tx(['第一次来？', 'First visit?'], lang)}</span></div>`
      + `<p>⏱ ${tx(['10 分钟快速路径 · 12 站，走一遍五层，外加 2 张知识卡', '10-minute quick path · 12 stops through all five layers, plus 2 cards'], lang)}</p>`
      + `<button type="button" class="l4-b gold big" data-go="#Q">${tx(['开始快速路径 ›', 'Start the quick path ›'], lang)}</button></div>`;
    const n = pageLayer(last.id), st = layerStats(seen)[n - 1]!;
    return `<div class="l4-go"><div class="r"><b>${tx(['继续上次', 'Pick up where you left off'], lang)}</b></div>`
      + `<div class="r l">${lvTag(n, lang)}<span>${esc(pageName(last.id, lang))} · ${tx([`看过 ${st.s}/${st.t} 页`, `${st.s}/${st.t} pages seen`], lang)}</span></div>${pbar(st.s, st.t, n)}`
      + `<div class="r"><button type="button" class="l4-b gold big" data-go="${H(last.id)}">${tx(['继续 ›', 'Continue ›'], lang)}</button><button type="button" class="l4-b sm" data-go="#Q">${tx(['10 分钟路径 ›', '10-min path ›'], lang)}</button></div></div>`;
  }
  function drawSoon(i: number) {
    home.innerHTML = `<div class="l4-soon"><p class="n">${tx(UI.lv[i]!, lang)}</p><h2>${tx(UI.lvN[i]!, lang)}</h2><p class="tag">${T('soon')}</p><p>${T('soonP')}</p><button type="button" class="l4-b gold" data-go="#L4">${T('goL4')}</button></div>`;
  }
  function render() {
    root.dataset.lang = lang; $('[data-a="lang"]').textContent = T('lang'); $('[data-a="lang"]').setAttribute('aria-label', T('langL'));
    $('[data-a="set"]').textContent = '⚙'; $('[data-a="set"]').setAttribute('aria-label', tx(['设置', 'Settings'], lang)); $('[data-a="back"]').textContent = '↑'; $('[data-a="back"]').setAttribute('aria-label', tx(['返回上一级', 'Up one level'], lang));
    $('[data-a="menu"]').textContent = '☰'; $('[data-a="menu"]').setAttribute('aria-label', tx(['地图和进度', 'Map and progress'], lang));
    $('.l4-rot .t').textContent = T('rot'); $('.l4-rot .s').textContent = T('rotS');
    const isL4 = cur === 'L4' || /^(TR|US|MY)\d$/.test(cur) || cur.startsWith('X:'), soon = /^L[1235]$/.test(cur) && !lxOn(cur);
    root.dataset.page = cur;
    if (lxOn(cur)) { pg = null; root.dataset.v = 'lx'; home.hidden = true; stg.hidden = false; void renderLx(); return; }
    if (isPx(cur)) { pxStep = null; lxTok++; lp = null; pg = null; root.dataset.v = 'px'; home.hidden = false; stg.hidden = true; mp.hidden = true; info.innerHTML = ''; ent.hidden = true; hint.textContent = ''; dots.innerHTML = ''; if (S) S.el.style.display = 'none'; void renderPx(); return; }
    lxTok++; lp = null; root.dataset.v = isL4 ? 'l4' : soon ? 'soon' : 'home';
    home.hidden = isL4; stg.hidden = !isL4;
    if (!isL4) { pg = null; drawTop(null); crumb.innerHTML = soon ? `<a href="#home">${T('home')}</a><span>›</span><span>${tx(UI.lv[Number(cur[1]) - 1]!, lang)}</span>` : `<span>${T('home')}</span>`; mp.hidden = true; info.innerHTML = ''; ent.hidden = true; hint.textContent = soon ? '' : T('sub'); dots.innerHTML = '';
      if (soon) drawSoon(Number(cur[1]) - 1); else drawHome(); return; }
    if (!d) void load();
    pg = page(cur, ctx()); drawTop(pg);
    crumb.innerHTML = crumbs(pg.crumb);
    ent.hidden = !pg.ent; ent.innerHTML = pg.ent ? `<button type="button" class="l4-b" data-go="#L4/tr/1">${T('entTr')}</button><button type="button" class="l4-b" data-go="#L4/us/1">${T('entUs')}</button><button type="button" class="l4-b" data-go="#L4/my/1">${T('entMy')}</button>` : '';
    hint.textContent = pg.hint; endB(); dots.innerHTML = pg.dots ? Array.from({ length: pg.dots[0] }, (_, i) => `<i class="${i === pg!.dots![1] ? 'on' : i < pg!.dots![1] ? 'done' : ''}"></i>`).join('') : '';
    drawInfo(); drawNav(); void drawStage();
  }
  /* ---------- layers 1, 2, 3 and 5 (lazy, one chunk per layer) ---------- */
  function crumbs(c0: [string, string | null][]) { return normCrumb(c0, lang).map(([t, h], i, c) => (h ? `<a href="${h}">${esc(t)}</a>` : `<span${i === c.length - 1 ? ' class="cur"' : ''}>${esc(t)}</span>`)).join('<span class="sep">›</span>'); }
  async function renderLx() {
    const id = cur, l = lang, tok = ++lxTok, v = await import('../lx/view'), p = await v.lxPage(id, l);
    if (tok !== lxTok) return; lp = p; delete root.dataset.lx; delete root.dataset.cmp;
    txt.innerHTML = p.top; crumb.innerHTML = crumbs(p.crumb);
    ent.hidden = !p.ent; ent.innerHTML = (p.ent ?? []).map(([t, h, g]) => `<button type="button" class="l4-b${g ? ' gold' : ''}" data-go="${h}">${esc(t)}</button>`).join('');
    hint.textContent = p.hint; endB(); dots.innerHTML = p.dots ? Array.from({ length: p.dots[0] }, (_, i) => `<i class="${i === p.dots![1] ? 'on' : i < p.dots![1] ? 'done' : ''}"></i>`).join('') : '';
    const ls: (keyof typeof UI)[] = ['what', 'parts', 'how', 'why'];
    info.innerHTML = infoHtml(p.info, p.k, ls);
    const m = p.math ?? K_MATH[p.k] ?? null;
    if (p.mg) { mp.hidden = false; mp.textContent = p.mg[0].replace(/\s*›$/, ''); mp.className = 'l4-mp g-jump'; mp.dataset.go = p.mg[1]; mp.dataset.k = ''; } else { mp.hidden = !m; mp.textContent = T('math').replace(/\s*›$/, ''); mp.className = 'l4-mp g-info'; mp.dataset.k = m ?? ''; delete mp.dataset.go; }
    stg.querySelectorAll('.l4-lb,.l4-fl,.l4-rl,.l4-pn,.l4-tag,.l4-note').forEach((e) => e.remove()); if (S) S.el.style.display = 'none';
    drawNav();
    await v.lxDraw(root, stg, p, l, flat, (n) => { const h = lp?.go[n]; if (h) go(h); });
    if (tok === lxTok) { drawNav(); root.dataset.lx = `${id}.${l}`; }
  }
  /* ---------- 练 / 记 / 享 / 快速路径 (lazy) ---------- */
  let pxTok = 0;
  async function renderPx() {
    const id = cur, l = lang, tok = ++pxTok; delete root.dataset.px; const v = await import('../px/view'); if (tok !== pxTok) return;
    await v.px(id, { root, host: home, l, go, tf, seen, opened: new Set(LS.get<string[]>('si.l4.cards', [])), still: () => tok === pxTok && cur === id && lang === l,
      top: (h) => { txt.innerHTML = h; }, crumb: (c) => { crumb.innerHTML = crumbs(c); }, step: (s: Step | null) => { if (tok === pxTok) { pxStep = s; drawNav(); } } });
  }
  const qGet = () => LS.get<QState | null>(QKEY, null), stopOf = (h: string) => { const i = parse(h).id; return lxFrom(i) ?? i; };
  /* R42 the last page of each layer ends with 「✓ 第n层「…」看完了」 + the layer quiz + the next layer (layer 5: home / progress) */
  const END: Record<string, number> = { 'L1-6': 1, 'L2-7': 2, 'L3-X': 3, 'X:att.mask': 4, M8: 5 };
  const endB = () => {
    const n = END[cur]; hint.classList.toggle('l4-end', !!n); if (!n) return;
    hint.innerHTML = `<b>✓ ${tx(['第{n}层「{t}」看完了', 'Layer {n} “{t}” done'], lang).replace('{n}', String(n)).replace('{t}', tx(UI.lvN[n - 1]!, lang))}${n === 5 ? `<span> · ${tx(['五层都走完了', 'all five layers done'], lang)}</span>` : ''}</b>`
      + `<span class="r"><button type="button" class="l4-b g-act2" data-go="#P/q${n}">${tx(['做第{n}层小测（{q} 题）', 'Layer {n} quiz ({q})'], lang).replace('{n}', String(n)).replace('{q}', '4')}</button></span>`;
    dots.innerHTML = '';
  };
  const qOn = () => !!qGet()?.on && !isPx(cur) && cur !== 'home';
  function drawQp() {
    const q = qGet(), on = qOn(); qp.hidden = !on; hint.hidden = on; dots.hidden = on; root.dataset.q = on ? '1' : '';
    drawNav(); if (!on) return;
    const p = plan(lang), j = PATH.findIndex(([h]) => stopOf(h) === cur), i = j >= 0 ? j : q!.i, left = p.sec.slice(i).reduce((a, b) => a + b, 0);
    qp.innerHTML = `<b>⏱ ${tx(['快速路径', 'Quick path'], lang)}</b><span class="n">${tx(['第 {i}/{n} 站', 'Stop {i}/{n}'], lang).replace('{i}', String(i + 1)).replace('{n}', String(PATH.length))}</span><b class="bar"><i style="width:${Math.round(((i + 1) / PATH.length) * 100)}%"></i></b><span class="m">${j < 0 ? tx(['点「下一站」回到路径', 'Tap Next stop to rejoin'], lang) : tx(['还剩约 {m} 分钟', 'about {m} min left'], lang).replace('{m}', String(Math.max(1, Math.round(left / 60))))}</span><button type="button" data-a="qx" aria-label="${tx(['退出快速路径', 'Leave the quick path'], lang)}">×</button>`;
  }
  function qNext() { const q = qGet()!, j = PATH.findIndex(([h]) => stopOf(h) === cur), n = j < 0 ? q.i : j + 1; if (n >= PATH.length) { go('#Q/done'); return; } const [h, c] = PATH[n]!; go(h + (c ? '~' + c : '')); }

  /* ---------- R44 the one step bar 「‹ 上一步 · ●○○ n/N · 下一步 ›」 (hubs have none) ---------- */
  const Z = (a: string, b: string) => tx([a, b], lang);
  const goStop = (k: number) => { const [h, c] = PATH[k]!; go(h + (c ? '~' + c : '')); };
  function stepOf(): Step | null {
    if (qOn()) {
      const q = qGet()!, j = PATH.findIndex(([h]) => stopOf(h) === cur), i = j >= 0 ? j : q.i;
      return { n: PATH.length, i, pv: Z('上一站', 'Prev stop'), nx: j === PATH.length - 1 ? Z('完成', 'Finish') : Z('下一站', 'Next stop'), prev: i > 0 ? () => goStop(j >= 0 ? i - 1 : i) : null, next: qNext, dot: goStop };
    }
    if (isPx(cur)) return pxStep;
    const n = END[cur], nx = n ? (n < 5 ? Z(`去第${n + 1}层`, `On to layer ${n + 1}`) : Z('回首页', 'Home')) : undefined, nh = n ? (n < 5 ? `#L${n + 1}` : '#home') : null;
    if (lxOn(cur)) {
      if (!lp || lp.id !== cur) return null;
      const ds = lp.dots && lp.dots[1] >= 0 ? lp.dots : null, k = LX[layerOf(cur)].indexOf(cur);
      return { n: ds?.[0] ?? 0, i: ds?.[1] ?? 0, prev: (ds ? ds[1] > 0 : k > 0) ? lxPrev(cur) : null, next: nh ?? lp.next, nx, dot: ds ? (x) => void lxDot(x) : null };
    }
    if (!pg || cur === 'L4') return null;
    const ds = pg.dots;
    if (cur.startsWith('X:')) {
      const xi = X_ORDER.indexOf(cur.slice(2));
      return { n: ds?.[0] ?? 0, i: ds?.[1] ?? 0, prev: xi > 0 ? xHash(X_ORDER[xi - 1]!) : null, next: nh ?? pg.next, nx, dot: ds ? (x) => go(xHash(X_ORDER[x]!)) : null };
    }
    const seq = ORDER.filter((o) => o.slice(0, 2) === cur.slice(0, 2)), si = seq.indexOf(cur);
    return { n: seq.length, i: si, prev: si > 0 ? hashOf(seq[si - 1]!) : null, next: pg.next, dot: (x) => go(hashOf(seq[x]!)) };
  }
  /** a dot on an lx page: the page with that step number in the same run of numbered pages */
  async function lxDot(x: number) {
    const v = await import('../lx/view'), o = LX[layerOf(cur)], l = lang, ps = await Promise.all(o.map((id) => v.lxPage(id, l)));
    const k = o.indexOf(cur), N = lp?.dots?.[0]; let a = k, b = k;
    const same = (i: number, j: number) => { const p = ps[i]?.dots, q = ps[j]?.dots; return !!p && !!q && p[0] === N && q[0] === N && q[1] >= p[1]; };
    while (a > 0 && same(a - 1, a)) a--; while (b < o.length - 1 && same(b, b + 1)) b++;
    for (let i = a; i <= b; i++) if (ps[i]!.dots![1] === x) { go(lxHash(o[i]!)); return; }
  }
  function drawNav() {
    const s = (stepNow = stepOf()); nav.hidden = !s; root.dataset.nav = s ? '1' : ''; if (!s) { nav.innerHTML = ''; return; }
    const pv = s.pv ?? Z('上一步', 'Back'), nx = s.nx ?? Z('下一步', 'Next'), many = s.n > 8;
    const dt = s.n ? `<span class="g-dots${many ? ' many' : ''}">${Array.from({ length: s.n }, (_, k) => `<button type="button" data-a="dot" data-i="${k}" class="${k === s.i ? 'on' : k < s.i ? 'd' : ''}" aria-label="${esc(Z(`第 ${k + 1} 步`, `Step ${k + 1}`))}"${k === s.i ? ' aria-current="step"' : ''}${s.dot ? '' : ' disabled'}></button>`).join('')}</span><span class="g-n">${esc(s.lab ?? '')}${s.i + 1} / ${s.n}</span>` : '';
    nav.innerHTML = `<button type="button" class="g-prev" data-a="prev"${s.prev ? '' : ' disabled'}>‹ ${esc(pv)}</button><span class="g-mid">${dt}</span><button type="button" class="g-next" data-a="next"${s.next ? '' : ' disabled'}>${esc(nx)} ›</button>`;
  }
  const run = (f: string | (() => void) | null | undefined) => { if (typeof f === 'string') go(f); else f?.(); };
  /** ↑ goes up exactly one level */
  function upOf(): string {
    if (isPx(cur)) return /^P\/./.test(cur) ? '#P' : cur === 'Q/done' ? '#Q' : '#home';
    if (lxOn(cur)) return /^L\d$/.test(cur) ? '#home' : '#L' + layerOf(cur);
    if (cur.startsWith('X:')) return pg?.up ?? back;
    if (/^(TR|US|MY)\d$/.test(cur)) return '#L4';
    return '#home';
  }

  /* ---------- sheets: card, map, progress ---------- */
  let cardFor = '';
  async function card(id: string | null) {
    root.querySelector('.l4-sheet:not(.l4-set)')?.remove(); if (!id) { cardFor = ''; return; }
    const [k, p] = id.split('.') as [string, string | undefined]; pushRecent(k, 'c'); opened.add(k); LS.set('si.l4.cards', [...opened]);
    const m = await import('./sheet'); cardFor = id;
    const j = qOn() ? PATH.findIndex(([h, c]) => c === k && stopOf(h) === cur) : -1;
    await m.openCard(root, lang, k, p === '2' ? 2 : 1, (s) => go(H(cur) + (s ? '~' + s : '')), `${location.origin}${location.pathname}?lang=${lang}${H(cur)}`, j >= 0 ? { i: j + 1, n: PATH.length, next: qNext } : undefined);
  }
  function list(title: string, body: string, tabs?: [string, string][], alt?: string) {
    root.querySelector('.l4-sheet:not(.l4-set)')?.remove(); const e = doc.createElement('div'); e.className = 'l4-sheet l4-ms'; e.setAttribute('role', 'dialog'); e.setAttribute('aria-label', title);
    e.innerHTML = `<div class="l4-sin"><header class="l4-sh"><b class="l4-kn">${title}</b></header><div class="l4-sbody">${tabs ? `<div class="g-seg" role="tablist">${tabs.map(([k, t], i) => `<button type="button" role="tab" data-t="${k}" class="${i ? '' : 'on'}" aria-selected="${!i}">${esc(t)}</button>`).join('')}</div>` : ''}<div class="l4-mb">${body}</div></div><footer class="l4-sf"><button type="button" class="l4-b" data-s="x">${T('close')}</button></footer></div>`;
    e.addEventListener('click', (ev) => {
      const t = ev.target as HTMLElement, tb = t.closest<HTMLElement>('[data-t]');
      if (tb && tabs) { e.querySelectorAll('[data-t]').forEach((x) => { x.classList.toggle('on', x === tb); x.setAttribute('aria-selected', String(x === tb)); }); e.querySelector('.l4-mb')!.innerHTML = (tb.dataset.t === tabs[0]![0] ? body : alt) ?? ''; return; }
      const g = t.closest<HTMLElement>('[data-go]'); if (g) { e.remove(); go(g.dataset.go!); return; }
      if (t === e || t.closest('[data-s="x"]') || t.closest('a')) e.remove();
    }); root.appendChild(e);
  }
  const li = (id: string, label: string) => `<a href="${H(id)}" class="${id === cur ? 'here' : seen.has(id) ? 'seen' : ''}">${esc(label)}${id === cur ? ` <em>${T('here')}</em>` : ''}</a>`;
  function mapSheet() {
    const stats = layerStats(seen), lh = (n: number) => { const x = stats[n - 1]!; return `<h4 class="l4-mh">${esc(`${tx(UI.lv[n - 1]!, lang)} ${tx(UI.lvN[n - 1]!, lang)}`)}${pbar(x.s, x.t, n)}<span class="m">${x.s === x.t ? tx(['看完 ✓', 'All seen ✓'], lang) : tx([`看过 ${x.s}/${x.t}`, `${x.s}/${x.t} seen`], lang)}</span></h4>`; };
    const sec = (t: string, ids: string[], ns: Tx[], n = 0) => `${n ? lh(n) : `<h4>${esc(t)}</h4>`}<div class="l4-ml">${ids.map((id, i) => li(id, tx(ns[i]!, lang))).join('')}</div>`;
    const xs = X_ORDER.map((p) => 'X:' + p), xn: Tx[] = [LAB.att, ['Q·K 打分', 'Q·K scores'], ['一个数', 'One number'], ['多头', 'Heads'], ['遮罩', 'Mask'], LAB.ffn, LAB.an1];
    const lxs = (n: 1 | 2 | 3 | 5) => LIVE.includes(n) ? sec('', LX[n], LX[n].map((id) => [tx(LX_N[id]!, 'zh').replace(/^M\d\s+/, ''), tx(LX_N[id]!, 'en').replace(/^M\d\s+/, '')] as Tx), n) : '';
    const soonL = [1, 2, 3, 5].filter((n) => !LIVE.includes(n)).map((n) => `<a href="#L${n}">${tx(UI.lv[n - 1]!, lang)} ${tx(UI.lvN[n - 1]!, lang)} <em>${T('soon')}</em></a>`).join('');
    const opened = new Set(LS.get<string[]>('si.l4.cards', [])), ps = layerStats(seen, opened);
    const prog = `<div class="l4-mpg">${ps.map((x) => `<div class="rw">${lvTag(x.n, lang)}${pbar(x.s, x.t, x.n)}<span class="m">${esc(tx([`看过 ${x.s}/${x.t} 页 · 卡 ${x.c}/${x.ct}`, `${x.s}/${x.t} pages · ${x.c}/${x.ct} cards`], lang))}</span></div>`).join('')}<button type="button" class="l4-b g-jump" data-go="#R">${tx(['看完整学习进度', 'See full progress'], lang)}</button></div>`;
    list(T('mapT'), `<div class="l4-ml">${li('home', T('home'))}${soonL}</div>` + lxs(1) + lxs(2) + lxs(3)
      + sec('', ['L4'], [UI.whole as Tx], 4) + sec(T('trN'), ORDER.slice(1, 7), STEPN.tr) + sec(T('usN'), ORDER.slice(7, 16), STEPN.us) + sec(T('myN'), ORDER.slice(16), STEPN.my) + sec(T('xN'), xs, xn) + lxs(5), [['map', T('map')], ['prog', T('prog')]], prog);
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
    if (id !== cur && pageLayer(id)) pushRecent(id, 'p');
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
      case 'back': go(upOf()); break;
      case 'prev': run(stepNow?.prev); break;
      case 'next': run(stepNow?.next); break;
      case 'dot': stepNow?.dot?.(Number(b.dataset.i)); break;
      case 'menu': mapSheet(); break;
      case 'lang': lang = lang === 'zh' ? 'en' : 'zh'; useApp.getState().setLang(lang); route(); break;
      case 'math': if (mp.dataset.k) go(H(cur) + '~' + mp.dataset.k); break;
      case 'set': void import('./settings').then((m) => { const s = m.openSettings(root, { lang: () => lang, setLang: (l) => { lang = l; useApp.getState().setLang(l); route(); s.redraw(); }, anim: () => { if (pg) void drawStage(); else if (lxOn(cur)) void renderLx(); },
        cleared: () => { seen.clear(); opened.clear(); render(); } }); }); break;
      case 'qx': { const q = qGet(); if (q) LS.set(QKEY, { ...q, on: false }); drawQp(); break; }
    }
  });
  root.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement; if (t.dataset.my === 'lines') { myFix(t as unknown as HTMLTextAreaElement); my.lines = t.value.split('\n'); } else if (t.dataset.my === 'q') my.q = t.value;
  });
  /* R42: half-width ? and -> (=>, :) are fixed in place, with a one-line notice */
  function myFix(ta: HTMLTextAreaElement) {
    const f = fixLines(ta.value); if (!f.fixed.length) return;
    const pos = ta.selectionStart ?? ta.value.length, d = ta.value.length - f.text.length; ta.value = f.text; const q = Math.max(0, pos - d); ta.setSelectionRange(q, q);
    my.fix = tx([`✓ 第 ${f.fixed.join('、')} 行的半角符号已帮你改成「？」「→」`, `✓ Line ${f.fixed.join(', ')}: half-width marks changed to “？” and “→”`], lang);
    const n = root.querySelector<HTMLElement>('[data-my="fix"]'); if (n) { n.textContent = my.fix; n.hidden = false; }
  }
  function myIns(txt: string, line: boolean) {
    const ta = root.querySelector<HTMLTextAreaElement>('[data-my="lines"]'); if (!ta) return;
    if (line) ta.value = ta.value.replace(/\n*$/, '') + (ta.value.trim() ? '\n' : '') + txt;
    else { const a = ta.selectionStart ?? ta.value.length, b = ta.selectionEnd ?? a; ta.value = ta.value.slice(0, a) + txt + ta.value.slice(b); ta.setSelectionRange(a + txt.length, a + txt.length); }
    my.lines = ta.value.split('\n'); ta.focus();
  }
  async function act(x: string) {
    if (x === 'my-arrow') { myIns('→', false); return; }
    if (x === 'my-ex') { myIns(tx(['太阳是什么颜色？→红', '太阳是什么颜色？→红'], lang), true); return; }
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
  /* R42 first visit: the 3-step welcome (lazy), only when the visit starts on the home page */
  if (cur === 'home' && !LS.get<string | null>('si.onb', null)) void import('./onb').then((m) => {
    const o = m.showOnb(root, lang, () => void import('../px/view').then((v) => v.qStart(go)));
    useApp.subscribe((st) => { const l: L = st.lang === 'en' ? 'en' : 'zh'; if (root.contains(root.querySelector('.l4-ob'))) o.redraw(l); });
  }).catch(() => { /* optional */ });
}
