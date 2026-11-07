/* R38: the system explorer (the default page). Home = the 5 layers (layer 4 live); #L4… = the Transformer explorer.
   One screen: thin top bar, crumbs, the stage (three.js, or SVG without WebGL), the info card, hint, dots, and the
   round 地图 / 进度 / 下一步 buttons. Tapping a "+" box opens it in place; tapping the original box closes it. */
import './l4.css';
import './portal.css';
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
import { LBG, LCOL, layerStats, lvTag, pageLayer, pbar, pushRecent } from './progress';
import { navInit, navNote, navTo } from './hnav';
import { DV_ALIAS, DV_N, DV_NM, dvI, dvK, isDv, posLabel } from '../dv/links';
import { layerMastery, masteredSt } from '../dv/prog';

const LS = { get: <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } }, set: (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private */ } } };
const isPx = (id: string) => /^(P|R|S|Q|W)(\/[A-Za-z0-9.]+)?$/.test(id) || isDv(id);
const isHub = (id: string) => id === 'news' || id.startsWith('news/') || id === 'tools' || id.startsWith('tools/');
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function start(doc: Document = document, win: Window = window) {
  if (doc.getElementById('l4')) return;
  const root = doc.createElement('div'); root.id = 'l4'; root.className = 'l4'; doc.body.appendChild(root);
  doc.documentElement.classList.add('l4-mode'); applyAnim(doc);
  try { const th = localStorage.getItem('si.theme'); if (th === 'dark') doc.documentElement.dataset.theme = 'dark'; } catch { /* private mode */ }
  root.innerHTML = `<header class="l4-top"><button type="button" class="l4-i" data-a="back"></button><a class="pt-brand" href="#home"><b>SI</b><span class="pt-name"></span></a><nav class="pt-links" aria-label="主导航"><a href="#home" data-pt="learn">学习</a><a href="#tools" data-pt="tools">工具</a><a href="#news" data-pt="news">资讯</a><a href="#W" data-pt="work">项目</a></nav><div class="l4-tx" aria-live="polite"></div><form class="pt-search" role="search"><input class="pt-q" type="search" enterkeyhint="search" autocomplete="off"></form><nav class="pt-more" aria-label="学习入口"><a href="#map" data-pt="map">地图</a><a href="#P" data-pt="prac">练习</a><a href="#R" data-pt="me">我的</a></nav><button type="button" class="l4-i l4-menu" data-a="menu" aria-haspopup="dialog"></button><button type="button" class="l4-i l4-gear" data-a="set"></button><button type="button" class="l4-i l4-lang" data-a="lang"></button></header>
<div class="l4-cr"><nav class="l4-crumb"></nav><button type="button" class="l4-mp" data-a="math"></button></div><div class="l4-qp" hidden></div>
<main class="l4-main"><div class="l4-stg"></div><div class="l4-home" hidden><div class="l4-body"></div><footer class="pt-foot" hidden></footer></div></main>
<div class="l4-ent" hidden></div>
<section class="l4-info"></section>
<p class="l4-hint"></p><div class="l4-dots" aria-hidden="true"></div>
<nav class="l4-nav g-nav" hidden></nav>
<nav class="l4-tabs" hidden></nav>
<div class="l4-rot" aria-hidden="true"><div><b>⟲</b><p class="t"></p><p class="s"></p></div></div>`;
  const $ = <E extends HTMLElement>(s: string) => root.querySelector<E>(s)!;
  gramOn(root);
  const nav = $('.l4-nav'), tabs = $('.l4-tabs'), stg = $('.l4-stg'), pageScroll = $('.l4-home'), home = $('.l4-body'), info = $('.l4-info'), crumb = $('.l4-crumb'), mp = $('.l4-mp'), ent = $('.l4-ent'), hint = $('.l4-hint'), dots = $('.l4-dots'), txt = $('.l4-tx'), qp = $('.l4-qp');
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
  /* R46: in-site moves rewrite the current history entry (src/l4/hnav.ts), so the system Back leaves the site */
  const go = (h: string) => { if (!navTo(win, h)) route(); };

  /* ---------- rendering ---------- */
  /* the info box like the reference: four rows, a tall gold 知识卡 button on the right (the card id is in its label) */
  const infoHtml = (v: readonly string[], k: string, ls: (keyof typeof UI)[]) => `<dl>${ls.map((x, i) => `<div><dt>${T(x)}</dt><dd>${esc(v[i]!)}</dd></div>`).join('')}</dl><button type="button" class="l4-kb" data-k="${k}" aria-label="${T('kcT')} ${k}"><span>${T('kc')}</span></button>`;
  function drawTop(p: Page | null) {
    if (!p) { txt.innerHTML = `<span class="l4-logo" aria-hidden="true">AI</span><b class="l4-tt l4-brand">${T('brand')}<span class="l4-bsub">${T('title')}</span></b>`; return; }
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
  /* R53 the home page is its own lazy chunk (./home); the old pyramid home is now the 地图 tab (#map) */
  let hmTok = 0;
  function drawHome() {
    const t = ++hmTok, l = lang; delete root.dataset.hm;
    if (cur === 'about') { void import('./home').then((m) => { if (t !== hmTok || cur !== 'about' || lang !== l) return; m.aboutPage(home, l); }); return; }
    const pane = cur.startsWith('tools') ? 'tools' as const : cur.startsWith('news') ? 'news' as const : 'learn' as const;
    const item = cur.includes('/') ? cur.slice(cur.indexOf('/') + 1) : '';
    void import('./home').then((m) => { if (t !== hmTok || (cur !== 'home' && !isHub(cur)) || lang !== l) return; m.home(home, { l, root, go, pane, item, redraw: () => { if (cur === 'home' || isHub(cur)) drawHome(); } }); }).catch(() => { /* offline: the shell still works */ });
  }
  /* R54 地图 tab: the five layers as a plain list, macro (how I use it) at the top → micro (the maths) at the bottom.
     The pyramid is the knowledge structure (each layer opens the one above), not a shape: equal-width rows, no trapezoids. */
  const LV_SUB: Tx[] = [['你说需求 → 它拆步骤、调工具、交回结果', 'You ask → it plans, calls tools, reports back'], ['感知、规划、调工具、观察、记忆', 'Perceive, plan, call tools, observe, remember'], ['海量文字 → 分词 → 预训练 → 微调 → 对齐', 'Text → tokens → pre-training → tuning → alignment'], ['注意力、前馈、残差，一个字一个字地生成', 'Attention, feed-forward, residuals, one token at a time'], ['向量、点积、矩阵、softmax、损失、梯度', 'Vectors, dot product, matrices, softmax, loss, gradients']];
  function drawMap() {
    const st = layerStats(seen, opened), lm = layerMastery(masteredSt());
    const lv = [0, 1, 2, 3, 4].map((i) => { const on = LIVE.includes(i + 1), x = st[i]!, [ma, mt] = lm[i]!;
      return `<li><button type="button" class="l4-lv${on ? ' live' : ''}" data-go="#L${i + 1}" style="--c:${LCOL[i]};--cb:${LBG[i]}"><span class="q" aria-hidden="true">${i + 1}</span><span class="t"><span class="n">${tx(UI.lv[i]!, lang)}${i === 0 ? ` · ${tx(['最宏观', 'big picture'], lang)}` : i === 4 ? ` · ${tx(['最微观', 'the details'], lang)}` : ''}</span><b>${tx(UI.lvN[i]!, lang)}</b><span class="d">${tx(LV_SUB[i]!, lang)}</span><span class="m">${tx([`${x.ct} 张卡 · ${mt} 站 · 掌握 ${ma}/${mt}`, `${x.ct} cards · ${mt} stops · ${ma}/${mt} mastered`], lang)}${on ? '' : ` · ${T('soon')}`}</span>${pbar(ma, mt, i + 1)}</span><i class="g-bdg" aria-hidden="true">›</i></button>${i < 4 ? `<span class="l4-lvj" aria-hidden="true">${tx(['↓ 拆开看', '↓ open it up'], lang)}</span>` : ''}</li>`; }).join('');
    /* R47 the bottom-up way in: the ground under layer 5 — 23 stations from one function up to an agent */
    const bu = `<button type="button" class="l4-bu g-rj" data-go="#D"><span class="ic" aria-hidden="true">↑</span><span class="t"><b>${tx(['自底向上 · 推导之路', 'Bottom-up: the derivation path'], lang)}</b><span>${tx(['23 站：从一个数学函数搭到 Agent 与应用', '23 stations from one function to agents and apps'], lang)}</span></span></button>`;
    const ln = (go: string, t: Tx, s: Tx, a = '') => `<button type="button" class="l4-ml2"${a ? ` data-a="${a}"` : ` data-go="${go}"`}><b>${tx(t, lang)}</b><span>${tx(s, lang)}</span><i class="g-bdg" aria-hidden="true">›</i></button>`;
    home.innerHTML = `<div class="l4-mapw"><h2 class="l4-mh2">${tx(['自顶向下 · 五层结构', 'Top-down: five layers'], lang)}</h2><p class="l4-msub">${tx(['从宏观到微观：每一层都是把上一层拆开来看。点某一层，进去细看。', 'From the big picture to the details: each layer opens up the one above. Tap a layer to look inside.'], lang)}</p><ol class="l4-pyr">${lv}</ol>${bu}<div class="l4-mls">`
      + ln('#D/map', ['知识地图', 'Knowledge map'], ['5 层 × 23 站，两个坐标一起看', '5 layers × 23 stops on one grid'])
      + ln('#D/routes', ['五条学习路线', 'Five learning routes'], ['同一批站，按目标选一条', 'The same stops; pick one for your goal'])
      + ln('#Q', ['10 分钟快速路径', '10-minute quick path'], ['走一遍五层', 'Once through all five layers'])
      + ln('#S', ['做分享卡', 'Make share cards'], ['把一张知识卡做成图片', 'Turn a card into an image'])
      + ln('', ['全部页面和进度', 'Every page and progress'], ['目录、看过的页、每层进度', 'Contents, pages seen, progress per layer'], 'menu') + '</div></div>';
  }
  function drawSoon(i: number) {
    home.innerHTML = `<div class="l4-soon"><p class="n">${tx(UI.lv[i]!, lang)}</p><h2>${tx(UI.lvN[i]!, lang)}</h2><p class="tag">${T('soon')}</p><p>${T('soonP')}</p><button type="button" class="l4-b gold" data-go="#L4">${T('goL4')}</button></div>`;
  }
  function paintPortal() {
    const zh = lang !== 'en';
    const name = root.querySelector<HTMLElement>('.pt-name'); if (name) name.textContent = zh ? '大白话拆解 AI' : 'AI, explained plainly';
    const lab: Record<string, string> = zh
      ? { learn: '学习', tools: '工具', news: '资讯', work: '项目', map: '地图', prac: '练习', me: '我的' }
      : { learn: 'Learn', tools: 'Tools', news: 'News', work: 'Projects', map: 'Map', prac: 'Practice', me: 'Me' };
    root.querySelectorAll<HTMLAnchorElement>('[data-pt]').forEach((a) => {
      const k = a.dataset.pt || '';
      a.textContent = lab[k] || a.textContent;
      const on = k === 'learn' ? cur === 'home' || cur.startsWith('D') || cur.startsWith('L')
        : k === 'tools' ? cur === 'tools' || cur.startsWith('tools/')
        : k === 'news' ? cur === 'news' || cur.startsWith('news/')
        : k === 'work' ? cur === 'W' || cur.startsWith('W/')
        : k === 'map' ? cur === 'map'
        : k === 'prac' ? cur === 'P' || cur.startsWith('P/')
        : k === 'me' ? cur === 'R' || cur.startsWith('R/')
        : false;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const q = root.querySelector<HTMLInputElement>('.pt-q');
    if (q) { q.placeholder = zh ? '搜索站、工具、资讯' : 'Search stops, tools, news'; q.setAttribute('aria-label', q.placeholder); }
    const nav = root.querySelector('nav.pt-links'); if (nav) nav.setAttribute('aria-label', zh ? '主导航' : 'Main');
    const foot = root.querySelector<HTMLElement>('.pt-foot');
    const showFoot = cur === 'home' || cur === 'about' || cur === 'news' || cur.startsWith('news/') || cur === 'tools' || cur.startsWith('tools/') || cur === 'W' || cur.startsWith('W/');
    if (foot) {
      foot.hidden = !showFoot;
      foot.innerHTML = zh
        ? `<div><h2>关于</h2><p>这个站由 GitHub 仓库 superjackman/SI 的所有者维护。</p><p><button type="button" data-a="menu">目录</button></p></div><div><h2>来源说明</h2><p>站里的数字来自同一张数表。资讯和工具写出来源、日期和核对日。没有写进这张表或来源里的数，页面上就不出现。</p></div><div><h2>更新时间</h2><p>资讯与工具目录核对于 2026-11-06。工具对照核对于 2026-11-07。</p></div>`
        : `<div><h2>About</h2><p>This site is maintained by the owner of the GitHub repository superjackman/SI.</p><p><button type="button" data-a="menu">Contents</button></p></div><div><h2>Sources</h2><p>Numbers come from one table. News and tools name a source, a date and the day they were checked.</p></div><div><h2>Updated</h2><p>News and the tool list were checked on 2026-11-06. The tool comparison was checked on 2026-11-07.</p></div>`;
    }
  }
  function render() {
    root.dataset.lang = lang; $('[data-a="lang"]').textContent = T('lang'); $('[data-a="lang"]').setAttribute('aria-label', T('langL'));
    paintPortal();
    $('[data-a="set"]').textContent = '⚙'; $('[data-a="set"]').setAttribute('aria-label', tx(['设置', 'Settings'], lang)); $('[data-a="back"]').textContent = '↑'; $('[data-a="back"]').setAttribute('aria-label', tx(['返回上一级', 'Up one level'], lang));
    $('[data-a="menu"]').textContent = '☰'; $('[data-a="menu"]').setAttribute('aria-label', tx(['地图和进度', 'Map and progress'], lang));
    $('.l4-rot .t').textContent = T('rot'); $('.l4-rot .s').textContent = T('rotS');
    const isL4 = cur === 'L4' || /^(TR|US|MY)\d$/.test(cur) || cur.startsWith('X:'), soon = /^L[1235]$/.test(cur) && !lxOn(cur);
    root.dataset.page = cur; drawTabs();
    if (lxOn(cur)) { pg = null; root.dataset.v = 'lx'; pageScroll.hidden = true; stg.hidden = false; void renderLx(); return; }
    if (isPx(cur)) { pxStep = null; lxTok++; lp = null; pg = null; root.dataset.v = 'px'; pageScroll.hidden = false; stg.hidden = true; mp.hidden = true; info.innerHTML = ''; ent.hidden = true; hint.textContent = ''; dots.innerHTML = ''; if (S) S.el.style.display = 'none'; void renderPx(); return; }
    lxTok++; lp = null; root.dataset.v = isL4 ? 'l4' : soon ? 'soon' : 'home';
    pageScroll.hidden = isL4; stg.hidden = !isL4;
    if (!isL4) { pg = null; drawTop(null); crumb.innerHTML = soon ? `<a href="#home">${T('home')}</a><span>›</span><span>${tx(UI.lv[Number(cur[1]) - 1]!, lang)}</span>` : `<span>${T('home')}</span>`; mp.hidden = true; info.innerHTML = ''; ent.hidden = true; hint.textContent = soon || cur === 'home' || isHub(cur) || cur === 'map' ? '' : T('sub'); dots.innerHTML = '';
      if (soon) drawSoon(Number(cur[1]) - 1); else if (cur === 'map') drawMap(); else drawHome(); return; }
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
    const id = cur, l = lang, tok = ++pxTok; delete root.dataset.px; const v = isDv(id) ? { px: (await import('../dv/view')).dv } : await import('../px/view'); if (tok !== pxTok) return;
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
  const qOn = () => !!qGet()?.on && !isPx(cur) && cur !== 'home' && cur !== 'map';
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
  /* R53 the 4 bottom tabs, only on the four top-level pages; a tab is a data-go, so it never adds a history entry */
  const TABS: [string, string, Tx, string][] = [
    ['home', '#home', ['学习', 'Learn'], '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>'],
    ['map', '#map', ['地图', 'Map'], '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7l3 9M16 7l-3 9M8.5 6h7"/>'],
    ['P', '#P', ['练习', 'Practice'], '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>'],
    ['R', '#R', ['我的', 'Me'], '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>'],
  ];
  function drawTabs() {
    const on = TABS.some(([id]) => id === cur) || isHub(cur) || cur === 'about'; tabs.hidden = !on; root.dataset.tabs = on ? '1' : ''; if (!on) { tabs.innerHTML = ''; return; }
    tabs.setAttribute('aria-label', tx(['主导航', 'Main'], lang));
    const homeOn = cur === 'home' || cur === 'about' || isHub(cur);
    tabs.innerHTML = TABS.map(([id, h, t, ic]) => { const here = id === 'home' ? homeOn : id === cur; return `<button type="button" data-go="${h}"${here ? ' class="on" aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg><span>${tx(t, lang)}</span></button>`; }).join('');
  }
  function drawNav() {
    const s = (stepNow = stepOf()); nav.hidden = !s; root.dataset.nav = s ? '1' : ''; if (!s) { nav.innerHTML = ''; return; }
    const pv = s.pv ?? Z('上一步', 'Back'), nx = s.nx ?? Z('下一步', 'Next'), many = s.n > 8, b = s.z0 ? 0 : 1;
    const dotLab = (k: number) => s.keys ? Z(`第 ${k + 1}/${s.n} 站`, `${k + 1}/${s.n}`) : Z(`第 ${k + b} 步`, `Step ${k + b}`);
    const dt = s.n ? `<span class="g-dots${many ? ' many' : ''}">${Array.from({ length: s.n }, (_, k) => `<button type="button" data-a="dot" data-i="${k}" class="${k === s.i ? 'on' : k < s.i ? 'd' : ''}" aria-label="${esc(dotLab(k))}"${k === s.i ? ' aria-current="step"' : ''}${s.dot ? '' : ' disabled'}></button>`).join('')}</span><span class="g-n">${s.txt != null ? esc(s.txt) : `${esc(s.lab ?? '')}${s.keys?.[s.i] ?? s.i + b} / ${s.keys?.[s.n - 1] ?? s.n - 1 + b}`}</span>` : '';
    const nxBtn = s.hold ? '<span></span>' : `<button type="button" class="g-next" data-a="next"${s.next ? '' : ' disabled'}>${esc(nx)} ›</button>`;
    nav.innerHTML = `<button type="button" class="g-prev" data-a="prev"${s.prev ? '' : ' disabled'}>‹ ${esc(pv)}</button><span class="g-mid">${dt}</span>${nxBtn}`;
  }
  const run = (f: string | (() => void) | null | undefined) => { if (typeof f === 'string') go(f); else f?.(); };
  /** ↑ goes up exactly one level */
  function upOf(): string {
    if (isPx(cur)) return /^[PDW]\/./.test(cur) ? '#' + cur[0] : cur === 'Q/done' ? '#Q' : '#home';
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
    const lm = layerMastery(masteredSt());
    const prog = `<div class="l4-mpg">${ps.map((x) => { const [ma, mt] = lm[x.n - 1]!; return `<div class="rw">${lvTag(x.n, lang)}${pbar(ma, mt, x.n)}<span class="m">${esc(tx([`掌握 ${ma}/${mt} 站`, `${ma}/${mt} stops mastered`], lang))}</span></div>`; }).join('')}<button type="button" class="l4-b g-jump" data-go="#R">${tx(['看完整学习进度', 'See full progress'], lang)}</button></div>`;
    const onSt = /^D\/(?!map$|routes$|ch)/.test(cur), td = root.dataset.topdown || '#map';
    const vsw = onSt ? `<div class="g-seg dv-vsw" role="radiogroup" aria-label="${tx(['换个角度看', 'Another angle'], lang)}"><button type="button" role="radio" aria-checked="false" data-go="${td}">${tx(['自顶向下·看结构', 'Top-down · structure'], lang)}</button><button type="button" role="radio" aria-checked="true" class="on">${tx(['自底向上·看推导', 'Bottom-up · derivation'], lang)}</button></div>` : '';
    list(T('mapT'), vsw + `<div class="l4-ml">${li('home', T('home'))}${soonL}</div>` + lxs(1) + lxs(2) + lxs(3)
      + sec('', ['L4'], [UI.whole as Tx], 4) + sec(T('trN'), ORDER.slice(1, 7), STEPN.tr) + sec(T('usN'), ORDER.slice(7, 16), STEPN.us) + sec(T('myN'), ORDER.slice(16), STEPN.my) + sec(T('xN'), xs, xn) + lxs(5)
      + `<h4>${esc(tx(['自底向上 · 推导之路', 'Bottom-up · derivation path'], lang))}</h4><div class="l4-ml">${li('D', tx(['链路总览', 'The whole chain'], lang))}${li('D/routes', tx(['五条学习路线', 'Five learning routes'], lang))}${li('D/map', tx(['知识地图 · 两个坐标', 'Knowledge map · both axes'], lang))}${DV_NM.slice(0, DV_N).map((nm, i) => li(`D/${dvK(i)}`, `${posLabel(i, lang === 'en' ? 'en' : 'zh')} · ${tx(nm, lang)}`)).join('')}</div>`, [['map', T('map')], ['prog', T('prog')]], prog);
  }
  /* ---------- routing ---------- */
  function route() {
    const sp = new URLSearchParams(win.location.search);
    if (sp.has('fa') && sp.has('fm')) {
      const h = win.location.hash, m = /^#D\/(?!ch\/)([^/?#]+)$/.exec(h), cq = sp.get('cq') || (m ? m[1] : '');
      if (cq && dvI(cq) >= 0 && !/^#D\/ch\//.test(h)) { navTo(win, `#D/ch/${cq}`); return; }
    }
    const r = parse(win.location.hash); let id = r.id; const lid = lxFrom(id);
    /* R51: an old single-step link (#D/8) opens the station that replaced it, rewriting the address (no new entry) */
    const al = DV_ALIAS[id]; if (al) { navTo(win, `#${al}${r.card ? '~' + r.card : ''}`); return; }
    if (lid) id = LIVE.includes(layerOf(lid)) ? lid : 'L' + layerOf(lid);
    if (id.startsWith('X:') && !validX(id.slice(2))) id = 'L4';
    if (!(lid || id === 'home' || id === 'about' || isHub(id) || id === 'map' || id === 'L4' || ORDER.includes(id) || id.startsWith('X:') || /^L[1235]$/.test(id) || isPx(id))) id = 'home';
    if (id !== cur) { sel = null; if (!id.startsWith('X:') && id !== 'home') back = H(id); }
    if (id === 'MY3' && my.ready && !myLoaded && !my.running) { myLoaded = true; void tf().then((c) => c.tf.loadMy()); }
    if (id !== cur) bump();
    const q = qGet(); if (q?.on) { const j = PATH.findIndex(([h]) => stopOf(h) === id); if (j >= 0 && j !== q.i) LS.set(QKEY, { ...q, i: j, max: Math.max(q.max, j) }); }
    if (id !== cur && pageLayer(id)) pushRecent(id, 'p');
    navNote(win, win.location.hash || '#home');
    if (id !== cur) pageScroll.scrollTop = 0;
    cur = id; if (!isPx(id)) { seen.add(id); LS.set('si.l4.seen', [...seen]); } root.querySelector('.l4-ms')?.remove();
    render(); drawQp();
    const want = r.card && /^K[MABC]?\d\d(\.2)?$/.test(r.card) ? r.card : null; if (want !== cardFor || want) void card(want);
    doc.documentElement.dataset.l4 = `${cur}.${lang}`;
  }
  /* ---------- events ---------- */
  root.addEventListener('submit', (e) => {
    const f = (e.target as HTMLElement).closest?.('.pt-search'); if (!f) return;
    e.preventDefault();
    const box = root.querySelector<HTMLInputElement>('.pt-q');
    const typed = box?.value ?? '';
    void import('../search/ui').then((m) => { m.openSearch(root, lang, box); const inp = root.querySelector<HTMLInputElement>('.si-q'); if (inp && typed) { inp.value = typed; inp.dispatchEvent(new Event('input', { bubbles: true })); } });
  });
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    /* R46: in-site #links (crumbs, the map) also replace the history entry instead of adding one (no root.contains:
       the map sheet removes itself before this runs; a click reaching this listener came from inside root) */
    const an = t.closest<HTMLAnchorElement>('a[href^="#"]'), me = e as MouseEvent;
    if (an && !an.target && !me.ctrlKey && !me.metaKey && !me.shiftKey && !me.altKey) { e.preventDefault(); go(an.getAttribute('href')!); return; }
    const b = t.closest<HTMLElement>('button,[data-go]'); if (!b || !root.contains(b)) return;
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
  const nt = (() => { try { return (win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type; } catch { return undefined; } })();
  navInit(win, nt);
  win.addEventListener('hashchange', route);
  let rz = 0; win.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (pg) void drawStage(); else if (lxOn(cur)) void renderLx(); }); });
  useApp.subscribe((s) => { const l: L = s.lang === 'en' ? 'en' : 'zh'; if (l !== lang) { lang = l; route(); } });
  route();
  /* R53: no first-visit popup; depth and goal live in the home page's one-line chooser (./home sheet) */
}
