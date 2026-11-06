/* R53 the home page (参考图 1–4, /workspace/si-home-redesign.md). A lazy chunk drawn into the explorer's home area.
   First visit: value line → the live 天空是？ temperature demo → 我想 [路线 ▾]，每站 [深度 ▾] → the one gold button →
   the five routes as chips. Returning (any station read or any question right): 继续上次 card (metro bar of the route,
   gold 继续学习) → 我的掌握 (ring = stations mastered, 5 layer bars) → 挑战一个朋友 once a station is mastered.
   Below, for both: five routes on one 23-station axis, 两种看法 (pyramid / derivation), 今天的挑战, footer.
   No names, no greeting, no invented numbers: everything comes from this browser's localStorage. Every move is a
   data-go handled by the shell (history.replaceState, src/l4/hnav.ts); choosing a route or depth never navigates. */
import './home.css';
import { UI, tx, type L, type Tx } from './txt';
import { ROUTES, goalGet, goalSet, routeNext, routeOf, type GoalId, type Route } from '../dv/routes';
import { CARD_SK, DV_KEY, DV_N, DV_NM, dvI } from '../dv/links';
import { depthGet, depthSet, jvGet, jvSet, layerMastery, masteredSt, routeMin, seenSt, type Depth } from '../dv/prog';
import { VF_Q, order, vfAdd, vfDone } from '../vf/ids';
import { fmt, softmax } from '../vf/calc';
import { LBG, LCOL } from './progress';

export interface HomeApi { l: L; root: HTMLElement; go: (h: string) => void; redraw: () => void }
/** 看懂大模型 by default (it starts at 词向量) */
export const DEF_GOAL: GoalId = 'model';
export const goalNow = (): Route => routeOf(goalGet()) ?? routeOf(DEF_GOAL)!;
/** returning = something learned in this browser (a station read or a question right); a chosen route alone is not */
export const isBack = () => seenSt().size > 0 || vfDone().size > 0;
/** the 天空是？ demo (示意 scores), softmax with temperature T */
export const SKY = [2, 0.8, 0.1] as const;
export const skyP = (T: number) => softmax(SKY, T);
/** today's challenge: one of the stations with a choice question, the same every reader sees on that local day */
export const dayNo = (t = Date.now()) => { const d = new Date(t); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
export const pickDay = <T>(pool: readonly T[], t = Date.now()) => pool[dayNo(t) % pool.length]!;
const DLAB: Readonly<Record<Depth, Tx>> = { s: ['30 秒', '30 sec'], m: ['5 分钟', '5 min'], d: ['深入', 'Deep'] };
const DSUB: Readonly<Record<Depth, Tx>> = { s: ['一句话 + 一张图', 'One line + one picture'], m: ['类比 + 图 + 数字 + 1 题', 'Analogy + picture + numbers + 1 quiz'], d: ['公式 + 推导 + 小测', 'Formulas + derivation + check'] };
const CIRC = ['①', '②', '③', '④', '⑤'], LYN: readonly Tx[] = [['类比', 'Analogy'], ['图', 'Picture'], ['数字', 'Numbers'], ['公式', 'Formula'], ['小测', 'Check']];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const stN = (k: string, l: L) => tx(DV_NM[dvI(k)] ?? [k, k], l);
const openOf = (page: string) => { try { const n = Number((JSON.parse(localStorage.getItem('si.ly.open') || '{}') as Record<string, unknown>)[page]); return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 0; } catch { return 0; } };
const nCards = Object.keys(CARD_SK).length;

export function home(host: HTMLElement, A: HomeApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  const d = depthGet(), r = goalNow(), seen = seenSt(), vd = vfDone(), m = masteredSt(vd), back = isBack();
  const nxt = routeNext(r, m, seen), mins = (n: number) => z(`约 ${routeMin(n, d)} 分钟`, `about ${routeMin(n, d)} min`);
  const rMeta = (x: Route) => `${esc(tx(x.n, l))} · ${z(`${x.st.length} 站`, `${x.st.length} stops`)} · ${mins(x.st.length)}`;
  const chooser = `<p class="hm-pick">${z('我想', 'I want to')} <button type="button" class="hm-dd" data-h="sheet" aria-haspopup="dialog">${esc(tx(r.n, l))} <i aria-hidden="true">▾</i></button>${z('，每站', ', each stop')} <button type="button" class="hm-dd" data-h="sheet" aria-haspopup="dialog">${esc(tx(DLAB[d], l))} <i aria-hidden="true">▾</i></button></p>`;

  /* ---------- the top: first visit or returning ---------- */
  let top: string;
  if (!back) {
    const p = skyP(1);
    top = `<section class="hm-hero"><p class="hm-k">${z('零基础 · 每站 5 分钟 · 不用注册', 'No prior knowledge · 5 min per stop · no sign-up')}</p>
<h1 class="hm-h">${z('从一道小学算术，', 'From grade-school arithmetic')}<span>${z('一路搭到 ChatGPT', 'all the way to ChatGPT')}</span></h1>
<p class="hm-s">${z(`${DV_N} 站讲透 AI 是怎么“想”出下一个字的，每一站都能自己动手算一遍。`, `${DV_N} stops on how AI “thinks up” the next word, and every stop lets you work it out yourself.`)}</p></section>
<section class="hm-card hm-demo" data-hm="demo"><div class="hm-dh"><b>${z('天空是', 'The sky is')} <span class="hm-q">？</span></b><span class="hm-chip">${z('拖一拖', 'Drag')} · ${z('温度', 'temp')} <output>1.0</output></span></div>
<div class="hm-bars">${skyBars(p, l)}</div>
<label class="hm-sl"><span>${z('温度 T', 'Temp T')}</span><input type="range" min="0.2" max="3" step="0.1" value="1" data-h="T" aria-label="${z('温度', 'Temperature')}"></label>
<p class="hm-n">${z('AI 每次只做一件事：给每个候选字打分，再挑一个。（示意数字）', 'AI does one thing at a time: score every candidate word, then pick one. (illustrative numbers)')}</p></section>
${chooser}
<button type="button" class="hm-cta" data-go="#D/${nxt}">${z(`从「${stN(nxt, l)}」开始`, `Start with “${stN(nxt, l)}”`)} ›</button>
<div class="hm-meta"><span>${rMeta(r)}</span><a href="#map">${z('先看整张地图', 'See the whole map first')} ›</a></div>
<div class="hm-sec"><b>${z('也可以换一条路线', 'Or pick another route')}</b><button type="button" class="hm-lk" data-h="routes">${z('全部', 'All')} ›</button></div>
<div class="hm-chips" role="radiogroup" aria-label="${z('路线', 'Route')}">${ROUTES.map((x) => `<button type="button" role="radio" aria-checked="${x.id === r.id}" class="hm-rc${x.id === r.id ? ' on' : ''}" data-h="goal:${x.id}" style="--c:${x.c}"><i aria-hidden="true"></i><b>${esc(tx(x.n, l))}</b><span>${z(`${x.st.length} 站`, `${x.st.length} stops`)}${x.id === r.id ? z(' · 已选', ' · chosen') : ''}</span></button>`).join('')}</div>`;
  } else {
    const done = r.st.filter((k) => m.has(String(k))).length, page = `D/${nxt}`, op = openOf(page), q = VF_Q[page] ?? [], qLeft = q.filter((id) => !vd.has(id)).length;
    const where = op ? z(`上次看到 ${CIRC[op - 1]} ${tx(LYN[op - 1]!, 'zh')}，还差 ${5 - op} 层`, `Last at ${CIRC[op - 1]} ${tx(LYN[op - 1]!, 'en')}, ${5 - op} layer${5 - op === 1 ? '' : 's'} to go`) : z('这一站还没开始', 'Not started yet');
    const how = qLeft ? z(`，读完做对 ${qLeft} 道小测就算掌握。`, `; get ${qLeft} quiz question${qLeft === 1 ? '' : 's'} right to master it.`) : z('。', '.');
    const metro = r.st.map((k) => { const key = String(k), c = m.has(key) ? 'done' : key === nxt ? 'cur' : seen.has(key) ? 'seen' : ''; return `<li class="${c}"><i aria-hidden="true"></i><span>${key}</span></li>`; }).join('');
    const ls = layerMastery(m), mm = m.size;
    const C = 2 * Math.PI * 34, ring = `<svg class="hm-ring" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="34" fill="none" stroke="#1d2d5c" stroke-width="8"/><circle cx="42" cy="42" r="34" fill="none" stroke="#ffd77a" stroke-width="8" stroke-linecap="round" stroke-dasharray="${((C * mm) / DV_N).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 42 42)"/></svg>`;
    const bars = ls.map(([s, t], i) => `<li><span class="hm-sq" style="--cb:${LBG[i]}" title="${esc(tx(UI.lvN[i]!, l))}" aria-label="${esc(tx(UI.lv[i]!, l))}">${i + 1}</span><span class="hm-pb" style="--c:${LCOL[i]}"><i style="width:${t ? Math.round((100 * s) / t) : 0}%"></i></span><span class="hm-pn">${s}/${t}</span></li>`).join('');
    top = `<section class="hm-card hm-go"><div class="hm-gh"><span>${z('继续上次', 'Pick up where you left off')} · ${esc(tx(DLAB[d], l))}</span><em>${esc(tx(r.n, l))} ${done}/${r.st.length}</em></div>
<h2 class="hm-gt">${esc(stN(nxt, l))}</h2><p class="hm-gs">${where}${how}</p>
<ol class="hm-metro" style="--c:${r.c}" aria-label="${esc(tx(r.n, l))}">${metro}</ol>
<button type="button" class="hm-cta" data-go="#D/${nxt}">${z('继续学习', 'Keep learning')} ›</button></section>
${chooser}
<div class="hm-sec"><b>${z('我的掌握', 'What I’ve mastered')}</b><a class="hm-lk" href="#R">${z('学习记录', 'Learning record')} ›</a></div>
<section class="hm-card hm-mst"><div class="hm-rw">${ring}<p><b>${mm}</b><span>/ ${z(`${DV_N} 站`, `${DV_N} stops`)}</span></p></div><ul class="hm-lvb">${bars}</ul>
<p class="hm-n hm-mn">${z(`答对 ${vd.size} 题 · 读过 ${seen.size} 站 · 掌握＝该站小测全对`, `${vd.size} right · ${seen.size} stops read · mastered = every quiz on the stop right`)}</p></section>
<div class="hm-chf" data-hm="chf" hidden></div>`;
  }

  /* ---------- below: routes on one axis, 两种看法, today's challenge ---------- */
  const X = (i: number) => 6 + (i * 288) / (DV_N - 1);
  const rail = (x: Route) => { const ix = x.st.map((k) => dvI(k)), a = Math.min(...ix), b = Math.max(...ix);
    return `<svg class="hm-rail" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true"><line x1="${X(a)}" y1="8" x2="${X(b)}" y2="8" stroke="${x.c}" stroke-width="3"/>${x.st.map((k) => { const i = dvI(k), on = m.has(String(k)); return `<circle cx="${X(i).toFixed(1)}" cy="8" r="4.2" fill="${on ? x.c : '#0a1532'}" stroke="${x.c}" stroke-width="2"/>`; }).join('')}</svg>`; };
  const LM: readonly [string, Tx][] = [['P', ['概率', 'Prob.']], ['2', ['梯度', 'Grad.']], ['8a', ['注意力', 'Attn']], ['10', ['后训练', 'Post-train']], ['13', ['RAG', 'RAG']], ['16', ['回顾', 'Recap']]];
  const marks = LM.map(([k, t], j) => { const i = dvI(k), pc = (X(i) / 300) * 100; return `<span class="${j % 2 ? 'lo' : ''}${i === DV_N - 1 ? ' end' : ''}" style="${i === DV_N - 1 ? 'right:0' : `left:${pc.toFixed(1)}%`}">${esc(tx(t, l))}</span>`; }).join('');
  const rts = ROUTES.map((x) => `<article class="hm-rt${x.id === r.id ? ' on' : ''}" style="--c:${x.c}"><div class="hm-rh"><b>${esc(tx(x.n, l))}</b><span>${z(`${x.st.length} 站`, `${x.st.length} stops`)} · ${mins(x.st.length)}</span>${x.id === r.id ? `<em>${z('当前', 'Current')}</em>` : `<button type="button" class="hm-lk" data-h="goal:${x.id}">${z('换这条', 'Switch')} ›</button>`}</div><p>${esc(tx(x.s, l))}</p>${rail(x)}</article>`).join('');
  /* R54 five equal rows (a layered list, macro → micro), not a pyramid shape */
  const pyr = [0, 1, 2, 3, 4].map((i) => `<i style="background:${LCOL[i]}"></i>`).join('');
  const cols = Array.from({ length: DV_N }, (_, i) => `<i style="height:${18 + (i * 82) / (DV_N - 1)}%"></i>`).join('');
  const below = `<section class="hm-routes" data-hm="routes"><div class="hm-sec"><b>${z('五条路线，同一批站', 'Five routes, the same stops')}</b><a class="hm-lk" href="#D/routes">${z('地铁图', 'Metro map')} ›</a></div>
<p class="hm-n">${z(`横着是 ${DV_N} 站（按推导顺序），每条线只停它需要的站；时长按「${tx(DLAB[d], 'zh')}」深度估算。`, `Across: the ${DV_N} stops in derivation order; each line stops only where it needs to. Times at the “${tx(DLAB[d], 'en')}” depth.`)}</p>
${rts}<div class="hm-lm" aria-hidden="true">${marks}</div></section>
<div class="hm-sec"><b>${z('同一套知识，两种看法', 'One body of knowledge, two views')}</b></div>
<div class="hm-two"><a class="hm-card hm-v" href="#map"><span class="hm-pyr" aria-hidden="true">${pyr}</span><b>${z('看结构', 'By structure')} <span class="hm-sqb">${z('5 层', '5 layers')}</span></b><span>${z(`从“我怎么用”拆到“背后的数学”，${nCards} 张卡`, `From “how I use it” down to “the maths behind it”; ${nCards} cards`)}</span></a>
<a class="hm-card hm-v" href="#D"><span class="hm-cols" aria-hidden="true">${cols}</span><b>${z('看推导', 'By derivation')} <span class="hm-rdb">${z(`${DV_N} 站`, `${DV_N} stops`)}</span></b><span>${z('从一个函数一步步搭到 Agent，每步解决一个问题', 'From one function up to agents, one problem per step')}</span></a></div>
<p class="hm-n hm-c">${z('两边随时互相跳：每张卡都写着它在第几站诞生', 'Jump between them anytime: every card says the stop where it is born')}</p>
<div class="hm-sec"><b>${z('今天的挑战', 'Today’s challenge')}</b></div>
<section class="hm-card hm-ch" data-hm="ch"><p class="hm-n">${z('题目加载中…', 'Loading the question…')}</p></section>
<footer class="hm-ft"><a href="https://github.com/superjackman/SI" target="_blank" rel="noopener">GitHub</a><span aria-hidden="true">·</span><button type="button" data-a="lang">${l === 'zh' ? 'EN' : '中文'}</button><span aria-hidden="true">·</span><a href="https://github.com/superjackman/SI/issues" target="_blank" rel="noopener">${z('反馈', 'Feedback')}</a></footer>`;

  host.innerHTML = `<div class="hm" lang="${l === 'en' ? 'en' : 'zh-CN'}" data-st="${back ? 'back' : 'first'}">${top}${below}</div>`;
  const $ = <E extends HTMLElement>(s: string) => host.querySelector<E>(s);

  /* the temperature demo: plain arithmetic on input, nothing moves by itself */
  $<HTMLInputElement>('[data-h="T"]')?.addEventListener('input', (e) => {
    const T = Number((e.target as HTMLInputElement).value), o = $('.hm-demo output'), b = $('.hm-bars');
    if (o) o.textContent = fmt(T, 1); if (b) b.innerHTML = skyBars(skyP(T), l);
  });
  for (const ev of ['touchstart', 'touchmove'] as const) $('.hm-sl')?.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
  host.querySelector('.hm')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-h]'); if (!b) return; const h = b.dataset.h!;
    if (h === 'sheet') sheet(A);
    else if (h.startsWith('goal:')) { goalSet(h.slice(5) as GoalId); A.redraw(); }
    else if (h === 'routes') $('[data-hm="routes"]')?.scrollIntoView({ block: 'start' });
  });
  void challenge(host, A, m);
}

export function skyBars(p: readonly number[], l: L) {
  const lab = l === 'en' ? ['blue', 'grey', 'white'] : ['蓝', '灰', '白'];
  return p.map((v, i) => `<div class="hm-bar"><span>${lab[i]}</span><span class="hm-bt"><i style="width:${Math.max(2, Math.round(100 * v))}%"></i></span><b>${Math.round(100 * v)}%</b></div>`).join('');
}

/* 今天的挑战 + (returning) 挑战一个朋友: the questions and the shared-number text are a lazy chunk */
async function challenge(host: HTMLElement, A: HomeApi, m: ReadonlySet<string>) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  const [{ QQ }, { CH }, { fillDvText }] = await Promise.all([import('../vf/data'), import('../dv/ch'), import('../dv/nums')]);
  const box = host.querySelector<HTMLElement>('[data-hm="ch"]'); if (!box?.isConnected) return;
  const pool = DV_KEY.filter((k) => CH[k] && QQ[CH[k]!]?.o), k = pickDay(pool), id = CH[k]!, Q = QQ[id]!, t = (s: Tx) => esc(fillDvText(tx(s, l), l));
  const solved = () => vfDone().has(id);
  const draw = (fb = '') => {
    const ok = solved();
    box.innerHTML = `<p class="hm-chk">${z(`第 ${k} 站`, `Stop ${k}`)} · ${esc(stN(k, l))} · ${z('30 秒', '30 sec')}</p><p class="hm-chq">${t(Q.q)}</p>
<div class="hm-ops">${order(id, Q.o!.length).map((i) => `<button type="button" class="hm-op${ok && i === Q.a ? ' ok' : ''}" data-o="${i}"${ok ? ' aria-disabled="true"' : ''}>${t(Q.o![i]!)}</button>`).join('')}</div>
<p class="hm-fb" role="status" aria-live="polite">${fb || (ok ? z('✓ 答对了', '✓ Right') : '')}</p>
<div class="hm-chr"><span class="hm-n">${ok ? z('可以生成一张题卡发给朋友', 'Make a card for a friend') : z('答对后可以生成题卡发给朋友', 'Get it right to make a card for a friend')}</span>${ok ? `<button type="button" class="hm-out" data-go="#D/ch/${k}">${z('挑战朋友', 'Challenge a friend')} ›</button>` : ''}</div>`;
  };
  draw();
  box.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-o]'); if (!b || solved()) return;
    const i = Number(b.dataset.o);
    if (i === Q.a) { vfAdd(id); draw(); } else { draw(`✗ ${z('再想想：', 'Not quite: ')}${t(Q.h)}`); box.querySelector(`[data-o="${i}"]`)?.classList.add('bad'); }
  });
  /* 挑战一个朋友: only once a station with a challenge question is mastered; the latest such station */
  const cf = host.querySelector<HTMLElement>('[data-hm="chf"]'), mk = [...DV_KEY].reverse().find((s) => m.has(s) && CH[s]);
  if (cf && mk) { cf.hidden = false; cf.innerHTML = `<section class="hm-card hm-fr"><div><b>${z('挑战一个朋友', 'Challenge a friend')}</b><span>${z(`用你掌握的「${stN(mk, l)}」出一题，看他能不能答对`, `Set a question from “${stN(mk, l)}”, which you’ve mastered`)}</span></div><button type="button" class="hm-out" data-go="#D/ch/${mk}">${z('出题', 'Set it')} ›</button></section>`; }
  if (host.isConnected) A.root.dataset.hm = `${host.querySelector<HTMLElement>('.hm')?.dataset.st}.${l}`;
}

/* 调整我的学法: the bottom sheet. Depth and route save at once (and redraw the home behind); 我是程序员 opens the code
   analogy on every station; 按这条路线开始 goes to the route's next stop. Esc / the dim backdrop close it. */
export function sheet(A: HomeApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  A.root.querySelector('.hm-sh')?.remove();
  const el = document.createElement('div'); el.className = 'l4-sheet hm-sh'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', z('调整我的学法', 'Adjust how I learn'));
  const draw = () => {
    const d = depthGet(), r = goalNow(), jv = jvGet();
    el.innerHTML = `<div class="l4-sin"><header class="l4-sh"><b class="l4-kn">${z('调整我的学法', 'Adjust how I learn')}</b><span class="hm-shm">${z('随时可改 · 只存在本机', 'Change anytime · kept on this device')}</span></header><div class="l4-sbody">
<h3 class="hm-sht">${z('每站学多深', 'How deep at each stop')}</h3><div class="hm-dep" role="radiogroup" aria-label="${z('每站学多深', 'How deep at each stop')}">${(['s', 'm', 'd'] as const).map((k) => `<button type="button" role="radio" aria-checked="${k === d}" class="${k === d ? 'on' : ''}" data-s="d:${k}"><b>${esc(tx(DLAB[k], l))}</b><span>${esc(tx(DSUB[k], l))}</span></button>`).join('')}</div>
<h3 class="hm-sht">${z('为了什么学', 'What for')}</h3><div class="hm-gl" role="radiogroup" aria-label="${z('为了什么学', 'What for')}">${ROUTES.map((x) => `<button type="button" role="radio" aria-checked="${x.id === r.id}" class="${x.id === r.id ? 'on' : ''}" data-s="g:${x.id}" style="--c:${x.c}"><i aria-hidden="true"></i><span><b>${esc(tx(x.n, l))}</b><small>${z(`${x.st.length} 站`, `${x.st.length} stops`)} · ${z(`约 ${routeMin(x.st.length, d)} 分钟`, `about ${routeMin(x.st.length, d)} min`)}</small></span><em aria-hidden="true"></em></button>`).join('')}</div>
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
    else if (s === 'go') { const r = goalNow(); goalSet(r.id); close(); A.go(`#D/${routeNext(r, masteredSt(), seenSt())}`); }
  });
  addEventListener('keydown', key); draw(); A.root.appendChild(el);
  el.querySelector<HTMLElement>('.hm-dep .on')?.focus({ preventScroll: true });
}
