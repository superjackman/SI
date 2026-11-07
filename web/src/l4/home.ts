/* R53 the home page (参考图 1–4, /workspace/si-home-redesign.md). A lazy chunk drawn into the explorer's home area.
   First visit: value line → the live 天空是？ temperature demo → 我想 [路线 ▾]，每站 [深度 ▾] → the one gold button →
   the five routes as chips. Returning (any station read or any question right): 继续上次 card (metro bar of the route,
   gold 继续学习) → 我的掌握 (ring = stations mastered, 5 layer bars) → 挑战一个朋友 once a station is mastered.
   Below, for both: five routes on one 23-station axis, 两种看法 (pyramid / derivation), 今天的挑战, footer.
   No names, no greeting, no invented numbers: everything comes from this browser's localStorage. Every move is a
   data-go handled by the shell (history.replaceState, src/l4/hnav.ts); choosing a route or depth never navigates. */
import './home.css';
import { tx, type L, type Tx } from './txt';
import { ROUTES, goalGet, goalSet, pathOf, routeNext, routeOf, type GoalId, type Route } from '../dv/routes';
import { DV_KEY, DV_LV, DV_N, DV_NM, dvI } from '../dv/links';
import { ML_G, depthGet, depthSet, jvGet, jvSet, masteredSt, mlDone, pathMin, seenSt, stationMin, type Depth } from '../dv/prog';
import { weekModel } from '../px/week';
import { VF_Q, vfDone } from '../vf/ids';
import { softmax } from '../vf/calc';
import { rvAll, rvNext, rvPick, wrongIds } from '../px/rv';
import { tx as cx } from '../i18n/L';
import { ratioHtml } from './ratios';
import type { Code } from '../i18n/codes';
import toolsJson from '../hub/tools.json';
import newsJson from '../hub/news.json';

export interface HomeApi { l: L; root: HTMLElement; go: (h: string) => void; redraw: () => void; pane?: 'learn' | 'news' | 'tools'; item?: string }
/** the route the learner actually picked; empty storage has none, and the walk is the 23 stations */
export const goalNow = (): Route | null => routeOf(goalGet());
/** returning = something learned in this browser (a station read or a question right); a chosen route alone is not */
export const isBack = () => seenSt().size > 0 || vfDone().size > 0;
/** the 天空是？ demo (示意 scores), softmax with temperature T */
export const SKY = [2, 0.8, 0.1] as const;
export const skyP = (T: number) => softmax(SKY, T);
/** today's challenge: one of the stations with a choice question, the same every reader sees on that local day */
export const dayNo = (t = Date.now()) => { const d = new Date(t); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
export const pickDay = <T>(pool: readonly T[], t = Date.now()) => pool[dayNo(t) % pool.length]!;
/** returning home: this week, from the real local record, and one step that can be finished */
export function weekBlock(l: L): string {
  const m = weekModel();
  const body = m.empty
    ? `<p>${esc(cx('week.empty', l))}</p>`
    : `<p>${esc(cx('week.master', l))} ${m.mastered.length} · ${esc(cx('week.practice', l))} ${m.practice}</p>`;
  return `<section class="hm-card hm-wk" data-week="${m.empty ? 'empty' : 'on'}"><h2>${esc(cx('week.home', l))}</h2>${body}<a class="hm-lk" href="#R">${esc(cx('week.open', l))}</a></section>`;
}
const DLAB: Readonly<Record<Depth, Tx>> = { s: ['30 秒', '30 sec'], m: ['算清数', 'Work the numbers'], d: ['深入', 'Deep'] };
const DSUB: Readonly<Record<Depth, Tx>> = { s: ['一句一幅', 'Line + picture'], m: ['把数算清', 'The numbers'], d: ['连式子', 'Formulas'] };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const stN = (k: string, l: L) => tx(DV_NM[dvI(k)] ?? [k, k], l);
export function home(host: HTMLElement, A: HomeApi) {
  const pane0 = A.pane ?? 'learn';
  if (pane0 !== 'learn') {
    host.innerHTML = `<div class="hm" data-hub="${pane0}"><div data-pane="${pane0}"></div></div>`;
    void hubTab(host, A, pane0, A.item ?? '');
    return;
  }
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  const p = pathOf(), seen = seenSt(), vd = vfDone(), m = masteredSt(vd), back = isBack();
  const nxt = routeNext(p, m, seen);
  const startBtn = (label: string) => `<button type="button" class="hm-cta" data-fwd="1" data-go="#D/${nxt}">${label} ›</button>`;
  const pos = dvI(nxt) + 1, goalsN = ML_G[nxt] ?? 0, got = mlDone(nxt)[0];
  const left = seen.has(nxt)
    ? z(`打开过，还差 ${Math.max(0, goalsN - got)} 个小目标。`, `Opened. ${Math.max(0, goalsN - got)} parts left.`)
    : z(`还没开始，一共 ${goalsN} 个小目标。`, `Not started. ${goalsN} parts.`);
  const frac = z(`第 ${pos}/${DV_N} 站`, `${pos}/${DV_N}`);
  const typical = stationMin(3);
  const LAY: { n: number; zh: string; en: string; dz: string; de: string }[] = [
    { n: 5, zh: '背后的数学', en: 'The maths behind it', dz: '用样本找函数 → 训练工程。向量、点积、矩阵、softmax、损失、梯度。', de: 'A function you can tune, through to training.' },
    { n: 4, zh: 'Transformer 内部', en: 'Inside a Transformer', dz: '词向量 → 组装成 Transformer。注意力、前馈、残差。', de: 'Word vectors through a Transformer. Attention, feed-forward, residuals.' },
    { n: 3, zh: '大模型怎么得来', en: 'How a model is made', dz: '预训练 → 推理效率。海量文字 → 分词 → 预训练 → 微调 → 对齐。', de: 'Pre-training through inference. Text, tokens, tuning, alignment.' },
    { n: 2, zh: 'AI 助手怎么工作', en: 'How an assistant works', dz: 'RAG、工具与 Agent、安全。', de: 'RAG, tools and agents, safety.' },
    { n: 1, zh: '我怎么用 AI', en: 'How I use AI', dz: '多模态、推理模型与长上下文、应用实战。', de: 'Multimodal, long context, a real job.' },
    { n: 0, zh: '回顾', en: 'Recap', dz: '五层走完之后，把整条链串起来。', de: 'After the five layers, the chain in one place.' },
  ];
  const layers = LAY.map((g) => {
    const ks = DV_KEY.filter((_, i) => DV_LV[i] === g.n);
    const first = ks[0] ?? '0';
    return `<a class="hm-layer${g.n === 5 ? ' start' : ''}" href="#D/${first}"><span class="idx">${g.n || '·'}</span><span><b>${esc(z(g.zh, g.en))}</b><i>${esc(z(g.dz, g.de))}</i></span><span class="cnt">${z(`${ks.length} 站`, `${ks.length} stops`)}</span></a>`;
  }).join('');
  const path = `<section class="hm-path" aria-labelledby="path-h"><h2 id="path-h">${z('学习路径', 'The path')}</h2><p class="hm-n">${z('五层按推导顺序往下走，另有回顾 1 站。', 'Five rows in derivation order, plus one recap.')}</p>${layers}</section>`;
  const hero = !back
    ? `<section class="hm-hero"><p class="hm-k">${z(`自底向上 · 零基础 · 三题的站约 ${typical} 分钟`, `Bottom up · no prior knowledge · about ${typical} min for a three-part stop`)}</p>
<h1 class="hm-h">${z('从一个数学函数出发，搭到大模型、安全与应用', 'From one function, up to models, safety and use')}</h1>
<p class="hm-s">${z(`${DV_N} 站。每一步都在解决上一步留下的问题：先把概率、损失和梯度说清楚，再搭到 Transformer、Agent，以及能用的应用。`, `${DV_N} stops. Each one answers what the previous one left open.`)}</p>
<div class="hm-act">${startBtn(z(`从「${stN(nxt, l)}」开始`, `Start with “${stN(nxt, l)}”`))}<p class="hm-pos">${frac}</p></div></section>${path}`
    : `<section class="hm-card hm-go"><div class="hm-gh"><span>${z('继续上次', 'Pick up where you left off')}</span><em>${frac}</em></div>
<h2 class="hm-gt">${esc(stN(nxt, l))}</h2><p class="hm-gs">${left}</p>
<div class="hm-act">${startBtn(z('继续学习', 'Keep learning'))}</div>${ratioHtml(l)}</section>`;
  host.innerHTML = `<div class="hm" lang="${l === 'en' ? 'en' : 'zh-CN'}" data-st="${back ? 'back' : 'first'}">${hero}</div>`;
  A.root.dataset.hm = `${back ? 'back' : 'first'}.${l}`;
}

async function hubTab(host: HTMLElement, A: HomeApi, which: 'learn' | 'news' | 'tools', item = '') {
  host.querySelectorAll<HTMLElement>('[data-h^="tab:"]').forEach((b) => { const on = b.dataset.h === `tab:${which}`; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  const hm = host.querySelector<HTMLElement>('.hm'); if (hm) hm.dataset.hub = which;
  for (const name of ['learn', 'news', 'tools'] as const) { const el = host.querySelector<HTMLElement>(`:scope > [data-pane="${name}"], .hm > [data-pane="${name}"]`); if (el) el.hidden = name !== which; }
  if (which === 'learn') return;
  const pane = host.querySelector<HTMLElement>(`.hm > [data-pane="${which}"]`); if (!pane) return;
  pane.innerHTML = `<p class="hm-n">${A.l === 'en' ? 'Loading…' : '加载中…'}</p>`;
  const hub = await import('../hub/view'); if (!pane.isConnected) return;
  pane.innerHTML = which === 'news' ? hub.newsHtml(A.l, item) : hub.toolsHtml(A.l, item);
  if (which === 'tools') {
    const sc = host.closest<HTMLElement>('.l4-home');
    const saveScroll = () => { try { sessionStorage.setItem('si.tools.scroll', location.hash + '\n' + String(sc?.scrollTop ?? 0)); } catch { /* private mode */ } };
    hub.wireTools(pane, (h) => {
      saveScroll();
      if (location.hash === h) return;
      history.pushState(history.state, '', location.pathname + location.search + h);
      dispatchEvent(new Event('hashchange'));
    });
    try {
      const [h, y] = (sessionStorage.getItem('si.tools.scroll') || '').split('\n');
      if (sc && h === location.hash && y) requestAnimationFrame(() => { sc.scrollTop = Number(y); });
    } catch { /* private mode */ }
    pane.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a[href^="#tools/"]')) saveScroll();
    });
  }
  pane.dataset.ready = '1';
}

/** R56 今日复习 on the returning home: 3 questions back on the 1 / 3 / 7-day rhythm, wrong ones first */
const ST_OF = (() => { const o: Record<string, string> = {}; for (const [p, ids] of Object.entries(VF_Q)) if (p.startsWith('D/')) for (const id of ids) o[id] = p.slice(2); return o; })();
export function rvCard(l: L) {
  const z = (a: string, b: string) => tx([a, b], l), ps = rvPick(3), any = Object.keys(rvAll()).length, nx = rvNext(), wb = wrongIds().length;
  const li = ps.map((p) => { const k = ST_OF[p.id] ?? ''; return `<li><span class="${p.why === 'w' ? 'w' : ''}">${p.why === 'w' ? z('上次错', 'Missed') : p.ago <= 0 ? z('今天学', 'Today') : z(`${p.ago} 天前学`, `${p.ago} d ago`)}</span><b>${esc(k ? stN(k, l) : p.id)}</b></li>`; }).join('');
  const body = ps.length ? `<ol class="hm-rvl">${li}</ol><button type="button" class="hm-cta2" data-go="#R/rv">${z(`开始回想 ${ps.length} 题`, `Recall ${ps.length} now`)} ›</button>`
    : `<p class="hm-n">${any ? (nx ? z(`今天没有到期的题，下一批 ${nx} 天后回来。`, `Nothing due today; the next ones come back in ${nx} day${nx === 1 ? '' : 's'}.`) : z('今天没有到期的题。', 'Nothing due today.')) : z('做对的题会在 1、3、7 天后回来考你，做错的会先回来。', 'Questions you get right come back after 1, 3 and 7 days; wrong ones come back first.')}</p>`;
  return `<div class="hm-sec"><b>${z('今日复习', 'Today’s review')}</b>${wb ? `<span class="hm-wb">${z(`错题本 ${wb}`, `Wrong book ${wb}`)}</span>` : ''}</div><section class="hm-card hm-rv">${body}</section>`;
}
export function skyBars(p: readonly number[], l: L) {
  const lab = l === 'en' ? ['blue', 'grey', 'white'] : ['蓝', '灰', '白'];
  return p.map((v, i) => `<div class="hm-bar"><span>${lab[i]}</span><span class="hm-bt"><i style="width:${Math.max(2, Math.round(100 * v))}%"></i></span><b>${Math.round(100 * v)}%</b></div>`).join('');
}

/* 今天的挑战 + (returning) 挑战一个朋友: the questions and the shared-number text are a lazy chunk */
export function sheet(A: HomeApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  A.root.querySelector('.hm-sh')?.remove();
  const el = document.createElement('div'); el.className = 'l4-sheet hm-sh'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', z('调整我的学法', 'Adjust how I learn'));
  const draw = () => {
    const d = depthGet(), r = goalNow(), jv = jvGet();
    el.innerHTML = `<div class="l4-sin"><header class="l4-sh"><b class="l4-kn">${z('调整我的学法', 'Adjust how I learn')}</b><span class="hm-shm">${z('随时可改 · 只存在本机', 'Change anytime · kept on this device')}</span></header><div class="l4-sbody">
<h3 class="hm-sht">${z('每站学多深', 'How deep at each stop')}</h3><div class="hm-dep" role="radiogroup" aria-label="${z('每站学多深', 'How deep at each stop')}">${(['s', 'm', 'd'] as const).map((k) => `<button type="button" role="radio" aria-checked="${k === d}" class="${k === d ? 'on' : ''}" data-s="d:${k}"><b>${esc(tx(DLAB[k], l))}</b><span>${esc(tx(DSUB[k], l))}</span></button>`).join('')}</div>
<h3 class="hm-sht">${z('为了什么学', 'What for')}</h3><div class="hm-gl" role="radiogroup" aria-label="${z('为了什么学', 'What for')}">${ROUTES.map((x) => `<button type="button" role="radio" aria-checked="${r?.id === x.id}" class="${r?.id === x.id ? 'on' : ''}" data-s="g:${x.id}" style="--c:${x.c}"><i aria-hidden="true"></i><span><b>${esc(tx(x.n, l))}</b><small>${z(`${x.st.length} 站`, `${x.st.length} stops`)} · ${z(`约 ${pathMin(x.st)} 分钟`, `about ${pathMin(x.st)} min`)}</small></span><em aria-hidden="true"></em></button>`).join('')}</div>
<div class="l4-srow hm-jv"><span>${z('我是程序员', 'I’m a programmer')}<small>${z('类比优先用代码说（注意力 ≈ 软的 HashMap.get）', 'Analogies in code first (attention ≈ a soft HashMap.get)')}</small></span><button type="button" class="l4-sw${jv ? ' on' : ''}" role="switch" aria-checked="${jv}" aria-label="${z('我是程序员', 'I’m a programmer')}" data-s="jv"><i></i></button></div>
</div><footer class="l4-sf"><button type="button" class="hm-cta" data-s="go">${z('按这条路线开始', 'Start this route')} ›</button></footer></div>`;
  };
  const close = () => { el.remove(); removeEventListener('keydown', key); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  el.addEventListener('click', (e) => {
    e.stopPropagation(); const t = e.target as HTMLElement; if (t === el) { close(); return; }
    const s = t.closest<HTMLElement>('[data-s]')?.dataset.s; if (!s) return;
    if (s.startsWith('d:')) { depthSet(s.slice(2) as Depth); draw(); A.redraw(); }
    else if (s.startsWith('g:')) { goalSet(s.slice(2) as GoalId); draw(); A.redraw(); }
    else if (s === 'jv') { jvSet(!jvGet()); draw(); }
    else if (s === 'go') { const picked = goalNow(); const walk = picked ?? pathOf(); if (picked) goalSet(picked.id); close(); A.go(`#D/${routeNext(walk, masteredSt(), seenSt())}`); }
  });
  addEventListener('keydown', key); draw(); A.root.appendChild(el);
  el.querySelector<HTMLElement>('.hm-dep .on')?.focus({ preventScroll: true });
}

/** The checked date written in the news and tools files. Same string on the static page. */
export function checkedOn(): string {
  return toolsJson.checked === newsJson.checked ? toolsJson.checked : `${newsJson.checked} / ${toolsJson.checked}`;
}
/** Who maintains this, how a number gets onto the page, and how to send a correction. */
export function aboutPage(host: HTMLElement, l: L) {
  const t = (c: Code) => cx(c, l);
  host.innerHTML = `<div class="hm hm-about" lang="${l === 'en' ? 'en' : 'zh-CN'}"><p><a href="#home">${esc(t('about.back'))}</a></p><h1>${esc(t('about.title'))}</h1>
<section class="hm-card"><h2>${esc(t('about.whoT'))}</h2><p>${esc(t('about.who'))}</p><p><a href="https://github.com/superjackman/SI" target="_blank" rel="noopener">superjackman/SI</a></p></section>
<section class="hm-card"><h2>${esc(t('about.checkT'))}</h2><p>${esc(t('about.check'))}</p><p class="hm-n">${esc(t('about.when').replace('{d}', checkedOn()))}</p></section>
<section class="hm-card"><h2>${esc(t('about.fixT'))}</h2><p>${esc(t('about.fix'))}</p><p><a href="https://github.com/superjackman/SI/issues" target="_blank" rel="noopener">${esc(t('about.issue'))}</a></p></section></div>`;
}
