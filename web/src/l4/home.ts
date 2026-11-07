/* R53 the home page (参考图 1–4, /workspace/si-home-redesign.md). A lazy chunk drawn into the explorer's home area.
   First visit: value line → the live 天空是？ temperature demo → 我想 [路线 ▾]，每站 [深度 ▾] → the one gold button →
   the five routes as chips. Returning (any station read or any question right): 继续上次 card (metro bar of the route,
   gold 继续学习) → 我的掌握 (ring = stations mastered, 5 layer bars) → 挑战一个朋友 once a station is mastered.
   Below, for both: five routes on one 23-station axis, 两种看法 (pyramid / derivation), 今天的挑战, footer.
   No names, no greeting, no invented numbers: everything comes from this browser's localStorage. Every move is a
   data-go handled by the shell (history.replaceState, src/l4/hnav.ts); choosing a route or depth never navigates. */
import './home.css';
import { UI, tx, type L, type Tx } from './txt';
import { ROUTES, goalGet, goalSet, pathOf, routeNext, routeOf, type GoalId, type Route } from '../dv/routes';
import { CARD_SK, DV_KEY, DV_LV, DV_N, DV_NM, dvI, posLabel } from '../dv/links';
import { ML_G, SUB_MIN, depthGet, depthSet, jvGet, jvSet, layerMastery, masteredSt, mlDone, pathMin, seenSt, stationMin, type Depth } from '../dv/prog';
import { soAll } from '../px/mem';
import { noteMastered, weekModel } from '../px/week';
import { VF_Q, order, vfAdd, vfDone } from '../vf/ids';
import { fmt, softmax } from '../vf/calc';
import { LBG, LCOL } from './progress';
import { rvAll, rvNext, rvPick, wrongIds } from '../px/rv';
import { bellAsk, bellBanner, bellPing } from '../px/remind';
import { tx as cx } from '../i18n/L';
import type { Code } from '../i18n/codes';
import toolsJson from '../hub/tools.json';
import newsJson from '../hub/news.json';
import worksJson from '../work/works.json';

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
const nCards = Object.keys(CARD_SK).length;

const recapLinks = (l: L) => {
  const z = (a: string, b: string) => tx([a, b], l), mset = masteredSt(), so = soAll();
  const ns = [1, 2, 3, 4, 5].filter((n) => { const ks = DV_KEY.filter((_, i) => DV_LV[i] === n); return ks.length > 0 && ks.every((k) => mset.has(k)) && !so[String(n)]; });
  if (!ns.length) return '';
  return `<p class="hm-n hm-so">${ns.map((n) => `<a href="#R/so${n}">${z(`第 ${n} 层可以排个序`, `Order layer ${n}`)}</a>`).join(' · ')}</p>`;
};

export function home(host: HTMLElement, A: HomeApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  const d = depthGet(), r = goalNow(), p = pathOf(), seen = seenSt(), vd = vfDone(), m = masteredSt(vd), back = isBack();
  const nxt = routeNext(p, m, seen), mins = (st: readonly (string | number)[]) => z(`约 ${pathMin(st)} 分钟`, `about ${pathMin(st)} min`);
  const rMeta = p.chosen
    ? `${esc(tx(p.n, l))} · ${z(`${p.st.length} 站`, `${p.st.length} stops`)} · ${mins(p.st)}`
    : `${z(`${DV_N} 站`, `${DV_N} stops`)} · ${mins(p.st)}`;
  const pickName = r ? tx(r.n, l) : z('23 站', '23 stops');
  const chooser = `<p class="hm-pick">${z('我想', 'I want to')} <button type="button" class="hm-dd" data-h="sheet" aria-haspopup="dialog">${esc(pickName)} <i aria-hidden="true">▾</i></button>${z('，深度', ', depth')} <button type="button" class="hm-dd" data-h="sheet" aria-haspopup="dialog">${esc(tx(DLAB[d], l))} <i aria-hidden="true">▾</i></button></p>`;
  const startBtn = (label: string) => `<button type="button" class="hm-cta" data-fwd="1" data-go="#D/${nxt}">${label} ›</button>`;

  /* ---------- the top: first visit or returning ---------- */
  let top: string;
  const pos = dvI(nxt) + 1, goalsN = ML_G[nxt] ?? 0, got = mlDone(nxt)[0];
  const left = seen.has(nxt)
    ? z(`打开过，还差 ${Math.max(0, goalsN - got)} 个小目标。`, `Opened. ${Math.max(0, goalsN - got)} parts left.`)
    : z(`还没开始，一共 ${goalsN} 个小目标。`, `Not started. ${goalsN} parts.`);
  const frac = p.chosen ? `${esc(tx(p.n, l))} ${p.st.filter((k) => m.has(String(k))).length}/${p.st.length}` : z(`第 ${pos}/${DV_N} 站`, `${pos}/${DV_N}`);
  const weeks = [...newsJson.weeks].sort((a, b) => (a.week < b.week ? 1 : -1));
  const week0 = weeks[0]!;
  const newsCol = `<aside class="hm-news" id="news"><h2>${z('本周资讯', 'This week')}</h2><p class="hm-n">${esc(week0.week)} ${z('起。每条都有来源和日期，没有排行。', 'on. Each item names a source and a date. There is no ranking.')}<br>${z(`核对 ${newsJson.checked}。`, `Checked ${newsJson.checked}.`)}</p>${week0.items.slice(0, 5).map((it) => {
    const goal = it.goal ?? '';
    const i = dvI(goal);
    const rel = i >= 0 ? `<p class="rel"><a href="#D/${esc(goal)}">${esc(posLabel(i, l === 'en' ? 'en' : 'zh'))} · ${esc(stN(goal, l))}</a></p>` : '';
    return `<article><p class="when">${esc(it.date)} · ${esc(it.source)}</p><p>${esc(l === 'en' ? it.en : it.zh)}</p>${rel}</article>`;
  }).join('')}</aside>`;
  const LAY: { n: number; zh: string; en: string; dz: string; de: string }[] = [
    { n: 5, zh: '背后的数学', en: 'The maths behind it', dz: '用样本找函数 → 训练工程。向量、点积、矩阵、softmax、损失、梯度。', de: 'A function you can tune, through to training.' },
    { n: 4, zh: 'Transformer 内部', en: 'Inside a Transformer', dz: '词向量 → 组装成 Transformer。注意力、前馈、残差，一个字一个字地生成。', de: 'Word vectors through a Transformer. Attention, feed-forward, residuals.' },
    { n: 3, zh: '大模型怎么得来', en: 'How a model is made', dz: '预训练 → 推理效率。海量文字 → 分词 → 预训练 → 微调 → 对齐。', de: 'Pre-training through inference. Text, tokens, tuning, alignment.' },
    { n: 2, zh: 'AI 助手怎么工作', en: 'How an assistant works', dz: 'RAG、工具与 Agent、安全。感知、规划、调工具、观察、记忆。', de: 'RAG, tools and agents, safety.' },
    { n: 1, zh: '我怎么用 AI', en: 'How I use AI', dz: '多模态、推理模型与长上下文、应用实战。', de: 'Multimodal, long context, a real job.' },
    { n: 0, zh: '回顾', en: 'Recap', dz: '五层走完之后，把整条链串起来。', de: 'After the five layers, the chain in one place.' },
  ];
  const layers = LAY.map((g) => {
    const ks = DV_KEY.filter((_, i) => DV_LV[i] === g.n);
    const first = ks[0] ?? '0';
    return `<a class="hm-layer${g.n === 5 ? ' start' : ''}" href="#D/${first}"><span class="idx">${g.n || '·'}</span><span><b>${esc(z(g.zh, g.en))}</b><i>${esc(z(g.dz, g.de))}</i></span><span class="cnt">${z(`${ks.length} 站`, `${ks.length} stops`)}</span></a>`;
  }).join('');
  const path = `<section class="hm-path" aria-labelledby="path-h"><h2 id="path-h">${z('学习路径', 'The path')}</h2><p class="hm-n">${z('五层等宽排列，按推导顺序往下走。另有回顾 1 站。合计 23 站。', 'Five equal rows, in derivation order, plus one recap. 23 stops.')}</p>${layers}</section>`;
  const byTask = (id: string, title: [string, string]) => {
    const rows = toolsJson.items.filter((t) => t.tasks.includes(id)).slice(0, 3);
    if (!rows.length) return '';
    return `<div class="hm-task"><h3>${z(title[0], title[1])}</h3><ul>${rows.map((t) => `<li><b><a href="#tools/${esc(t.id)}">${esc(t.name)}</a></b><span>${esc(l === 'en' ? t.en : t.zh)}</span></li>`).join('')}</ul></div>`;
  };
  const feat = `<section class="hm-feat"><h2>${z('按任务找工具', 'Tools by task')}</h2><p class="hm-n">${z(`下面是目录里的原句。没有评分，也没有排行。核对 ${toolsJson.checked}。`, `The lines below are from the directory. No scores and no ranking. Checked ${toolsJson.checked}.`)}</p>${byTask('code', ['写代码', 'Write code'])}${byTask('read', ['查资料', 'Look things up'])}${byTask('local', ['本机跑模型', 'Run a model locally'])}</section>`;
  const works = `<section class="hm-works" id="works"><h2>${z('项目', 'Projects')}</h2><p class="hm-n">${z('三个能做完的作品。都写在页面上，不是联网模型，也不要密钥。', 'Three projects that finish on the page. A fixed sample, not a live model, and no key.')}</p><ul>${worksJson.items.map((it) => { const line = (l === 'en' ? it.expect[1] : it.expect[0]) ?? ''; return `<li><b><a href="#W/${esc(it.id)}">${esc(l === 'en' ? it.en : it.zh)}</a></b><span>${esc(line)}</span></li>`; }).join('')}</ul></section>`;
  if (!back) {
    const sky = skyP(1), typical = stationMin(3);
    top = `<div class="hm-fold"><div><section class="hm-hero"><p class="hm-k">${z(`自底向上 · 推导之路 · 零基础 · 三题的站约 ${typical} 分钟`, `Bottom up · no prior knowledge · about ${typical} min for a three-part stop`)}</p>
<h1 class="hm-h">${z('从一个数学函数出发，搭到大模型、安全与应用', 'From one function, up to models, safety and use')}</h1>
<p class="hm-s">${z(`${DV_N} 站。每一步都在解决上一步留下的问题：先把概率、损失和梯度说清楚，再搭到 Transformer、Agent，以及能用的应用。`, `${DV_N} stops. Each one answers what the previous one left open.`)}</p>
<div class="hm-act">${startBtn(z(`从「${stN(nxt, l)}」开始`, `Start with “${stN(nxt, l)}”`))}<p class="hm-pos">${z(`第 ${pos}/${DV_N} 站`, `${pos}/${DV_N}`)}</p></div></section>${path}</div>${newsCol}</div>
${feat}${works}
<section class="hm-card hm-demo" data-hm="demo"><div class="hm-dh"><b>${z('天空是', 'The sky is')} <span class="hm-q">？</span></b><span class="hm-chip">${z('拖一拖', 'Drag')} · ${z('温度', 'temp')} <output>1.0</output></span></div>
<div class="hm-bars">${skyBars(sky, l)}</div>
<label class="hm-sl"><span>${z('温度 T', 'Temp T')}</span><input type="range" min="0.2" max="3" step="0.1" value="1" data-h="T" aria-label="${z('温度', 'Temperature')}"></label>
<p class="hm-n">${z('AI 每次只做一件事：给每个候选字打分，再挑一个。（示意数字）', 'AI does one thing at a time: score every candidate word, then pick one. (illustrative numbers)')}</p></section>
${chooser}
<div class="hm-meta"><span>${rMeta}</span><a href="#map">${z('先看整张地图', 'See the whole map first')} ›</a></div>
<div class="hm-sec"><b>${z('也可以换一条路线', 'Or pick another route')}</b><button type="button" class="hm-lk" data-h="routes">${z('全部', 'All')} ›</button></div>
<div class="hm-chips" role="radiogroup" aria-label="${z('路线', 'Route')}">${ROUTES.map((x) => `<button type="button" role="radio" aria-checked="${r?.id === x.id}" class="hm-rc${r?.id === x.id ? ' on' : ''}" data-h="goal:${x.id}" style="--c:${x.c}"><i aria-hidden="true"></i><b>${esc(tx(x.n, l))}</b><span>${z(`${x.st.length} 站`, `${x.st.length} stops`)}${r?.id === x.id ? z(' · 已选', ' · chosen') : ''}</span></button>`).join('')}</div>
${Object.keys(rvAll()).length ? rvCard(l) : ''}`;
  } else {
    const metro = p.st.map((k) => { const key = String(k), c = m.has(key) ? 'done' : key === nxt ? 'cur' : seen.has(key) ? 'seen' : ''; const lab = p.st.length > 12 ? '' : `<span>${dvI(key) + 1}</span>`; return `<li class="${c}"><i aria-hidden="true"></i>${lab}</li>`; }).join('');
    const ls = layerMastery(m), mm = m.size;
    const C = 2 * Math.PI * 34, ring = `<svg class="hm-ring" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="34" fill="none" stroke="#1d2d5c" stroke-width="8"/><circle cx="42" cy="42" r="34" fill="none" stroke="#ffd77a" stroke-width="8" stroke-linecap="round" stroke-dasharray="${((C * mm) / DV_N).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 42 42)"/></svg>`;
    const bars = ls.map(([s, t], i) => `<li><span class="hm-sq" style="--cb:${LBG[i]}" title="${esc(tx(UI.lvN[i]!, l))}" aria-label="${esc(tx(UI.lv[i]!, l))}">${i + 1}</span><span class="hm-pb" style="--c:${LCOL[i]}"><i style="width:${t ? Math.round((100 * s) / t) : 0}%"></i></span><span class="hm-pn">${s}/${t}</span></li>`).join('');
    top = `<div class="hm-fold"><div><section class="hm-card hm-go"><div class="hm-gh"><span>${z('继续上次', 'Pick up where you left off')}</span><em>${frac}</em></div>
<h2 class="hm-gt">${esc(stN(nxt, l))}</h2><p class="hm-gs">${left}</p>
<ol class="hm-metro" style="--c:${p.c}" aria-label="${esc(tx(p.n, l))}">${metro}</ol>
${startBtn(z('继续学习', 'Keep learning'))}</section>
${recapLinks(l)}
${weekBlock(l)}
${chooser}
<div class="hm-sec"><b>${z('我的掌握', 'What I’ve mastered')}</b><a class="hm-lk" href="#R">${z('学习记录', 'Learning record')} ›</a></div>
<section class="hm-card hm-mst"><div class="hm-rw">${ring}<p><b>${mm}</b><span>/ ${z(`${DV_N} 站`, `${DV_N} stops`)}</span></p></div><ul class="hm-lvb">${bars}</ul>
<p class="hm-n hm-mn">${z(`答对 ${vd.size} 题 · 读过 ${seen.size} 站 · 掌握＝这一站的题都做对了`, `${vd.size} right · ${seen.size} stops read · mastered = every question on that stop is right`)}</p></section>
${rvCard(l)}
<div class="hm-chf" data-hm="chf" hidden></div></div>${newsCol}</div>${feat}${works}`;
  }

  /* ---------- below: routes on one axis, 两种看法, today's challenge ---------- */
  const X = (i: number) => 6 + (i * 288) / (DV_N - 1);
  const rail = (x: Route) => { const ix = x.st.map((k) => dvI(k)), a = Math.min(...ix), b = Math.max(...ix);
    return `<svg class="hm-rail" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true"><line x1="${X(a)}" y1="8" x2="${X(b)}" y2="8" stroke="${x.c}" stroke-width="3"/>${x.st.map((k) => { const i = dvI(k), on = m.has(String(k)); return `<circle cx="${X(i).toFixed(1)}" cy="8" r="4.2" fill="${on ? x.c : '#0a1532'}" stroke="${x.c}" stroke-width="2"/>`; }).join('')}</svg>`; };
  const LM: readonly [string, Tx][] = [['P', ['概率', 'Prob.']], ['2', ['梯度', 'Grad.']], ['8a', ['注意力', 'Attn']], ['10', ['后训练', 'Post-train']], ['13', ['RAG', 'RAG']], ['16', ['回顾', 'Recap']]];
  const marks = LM.map(([k, t], j) => { const i = dvI(k), pc = (X(i) / 300) * 100; return `<span class="${j % 2 ? 'lo' : ''}${i === DV_N - 1 ? ' end' : ''}" style="${i === DV_N - 1 ? 'right:0' : `left:${pc.toFixed(1)}%`}">${esc(tx(t, l))}</span>`; }).join('');
  const rts = ROUTES.map((x) => `<article class="hm-rt${r?.id === x.id ? ' on' : ''}" style="--c:${x.c}"><div class="hm-rh"><b>${esc(tx(x.n, l))}</b><span>${z(`${x.st.length} 站`, `${x.st.length} stops`)} · ${mins(x.st)}</span>${r?.id === x.id ? `<em>${z('当前', 'Current')}</em>` : `<button type="button" class="hm-lk" data-h="goal:${x.id}">${z('换这条', 'Switch')} ›</button>`}</div><p>${esc(tx(x.s, l))}</p>${rail(x)}</article>`).join('');
  /* R54 five equal rows (a layered list, macro → micro), not a pyramid shape */
  const pyr = [0, 1, 2, 3, 4].map((i) => `<i style="background:${LCOL[i]}"></i>`).join('');
  const cols = Array.from({ length: DV_N }, (_, i) => `<i style="height:${18 + (i * 82) / (DV_N - 1)}%"></i>`).join('');
  const below = `<section class="hm-routes" data-hm="routes"><div class="hm-sec"><b>${z('五条路线，同一批站', 'Five routes, the same stops')}</b><a class="hm-lk" href="#D/routes">${z('地铁图', 'Metro map')} ›</a></div>
<p class="hm-n">${z(`横着是 ${DV_N} 站（按推导顺序），每条线只停它需要的站。时长按每站的小目标算：一个小目标 ${SUB_MIN} 分钟，进站再加 1 分钟。`, `Across: the ${DV_N} stops in derivation order; each line stops only where it needs to. Time follows the parts: ${SUB_MIN} min for one part, plus 1 min to come in.`)}</p>
${rts}<div class="hm-lm" aria-hidden="true">${marks}</div></section>
<div class="hm-sec"><b>${z('同一套知识，两种看法', 'One body of knowledge, two views')}</b></div>
<div class="hm-two"><a class="hm-card hm-v" href="#map"><span class="hm-pyr" aria-hidden="true">${pyr}</span><b>${z('看结构', 'By structure')} <span class="hm-sqb">${z('5 层', '5 layers')}</span></b><span>${z(`从“我怎么用”拆到“背后的数学”，${nCards} 张卡`, `From “how I use it” down to “the maths behind it”; ${nCards} cards`)}</span></a>
<a class="hm-card hm-v" href="#D"><span class="hm-cols" aria-hidden="true">${cols}</span><b>${z('看推导', 'By derivation')} <span class="hm-rdb">${z(`${DV_N} 站`, `${DV_N} stops`)}</span></b><span>${z('从一个函数一步步搭到 Agent，每步解决一个问题', 'From one function up to agents, one problem per step')}</span></a></div>
<p class="hm-n hm-c">${z('两边随时互相跳：每张卡都写着它在第几站诞生', 'Jump between them anytime: every card says the stop where it is born')}</p>
<div class="hm-sec"><b>${esc(cx('home.ask', l))}</b></div>
<section class="hm-card hm-ch" data-hm="ch"><p class="hm-n">${z('题目加载中…', 'Loading the question…')}</p></section>
<footer class="hm-ft"><a href="https://github.com/superjackman/SI" target="_blank" rel="noopener">GitHub</a><span aria-hidden="true">·</span><button type="button" data-a="lang">${l === 'zh' ? 'EN' : '中文'}</button><span aria-hidden="true">·</span><a href="https://github.com/superjackman/SI/issues" target="_blank" rel="noopener">${z('反馈', 'Feedback')}</a></footer><p class="hm-ft2"><a href="#W">${esc(cx('home.works', l))}</a><span aria-hidden="true"> · </span><a href="#about">${esc(cx('about.title', l))}</a></p>`;

  const pane0 = A.pane ?? 'learn';
  const tab = (id: 'learn' | 'news' | 'tools', name: string) => `<button type="button" role="tab" class="${pane0 === id ? 'on' : ''}" data-h="tab:${id}" aria-selected="${pane0 === id}">${name}</button>`;
  const tabs = `<div class="hm-hub" role="tablist" aria-label="${z('入口', 'Entries')}">${tab('learn', z('学', 'Learn'))}${tab('news', z('查资讯', 'News'))}${tab('tools', z('找工具', 'Tools'))}</div><button type="button" class="hm-find" data-h="find">${z('搜索', 'Search')}</button>`;
  host.innerHTML = `<div class="hm" lang="${l === 'en' ? 'en' : 'zh-CN'}" data-st="${back ? 'back' : 'first'}" data-hub="${pane0}">${tabs}<div data-pane="learn"${pane0 === 'learn' ? '' : ' hidden'}>${top}${below}</div><div data-pane="news"${pane0 === 'news' ? '' : ' hidden'}></div><div data-pane="tools"${pane0 === 'tools' ? '' : ' hidden'}></div></div>`;
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
    else if (h === 'bell') void bellAsk(l).then(() => { const b = host.querySelector<HTMLElement>('[data-bell]'); if (b) b.outerHTML = bellBanner(l); });
    else if (h === 'find') void import('../search/ui').then((m) => m.openSearch(A.root, l, b));
    else if (h === 'ask') { const ch = $('[data-hm="ch"]'); ch?.scrollIntoView({ block: 'center' }); ch?.querySelector<HTMLElement>('.hm-op')?.focus(); }
    else if (h.startsWith('tab:')) { const which = h.slice(4); A.go(which === 'news' ? '#news' : which === 'tools' ? '#tools' : '#home'); }
    else if (h.startsWith('goal:')) { goalSet(h.slice(5) as GoalId); A.redraw(); }
    else if (h === 'routes') $('[data-hm="routes"]')?.scrollIntoView({ block: 'start' });
  });
  void challenge(host, A, m);
  bellPing(l);
  if (pane0 !== 'learn') void hubTab(host, A, pane0, A.item ?? '');
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
  pane.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-sh]'); if (!b?.dataset.sh) return;
    e.preventDefault(); e.stopPropagation();
    const [kind, id] = b.dataset.sh.split(':');
    if (kind && id) void import('../hub/share').then((m) => m.openItem(A.root, A.l, kind, id));
  });
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
async function challenge(host: HTMLElement, A: HomeApi, m: ReadonlySet<string>) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  const [{ QQ }, { CH }, { fillDvText }] = await Promise.all([import('../vf/data'), import('../dv/ch'), import('../dv/nums')]);
  const box = host.querySelector<HTMLElement>('[data-hm="ch"]'); if (!box?.isConnected) return;
  const pool = DV_KEY.filter((k) => CH[k] && QQ[CH[k]!]?.o), k = pickDay(pool), id = CH[k]!, Q = QQ[id]!, t = (s: Tx) => esc(fillDvText(tx(s, l), l));
  const solved = () => vfDone().has(id);
  const draw = (fb = '') => {
    const ok = solved();
    box.innerHTML = `<p class="hm-chk">${z(posLabel(dvI(k), 'zh'), posLabel(dvI(k), 'en'))} · ${esc(stN(k, l))} · ${z('30 秒', '30 sec')}</p><p class="hm-chq">${t(Q.q)}</p>
<div class="hm-ops">${order(id, Q.o!.length).map((i) => `<button type="button" class="hm-op${ok && i === Q.a ? ' ok' : ''}" data-o="${i}"${ok ? ' aria-disabled="true"' : ''}>${t(Q.o![i]!)}</button>`).join('')}</div>
<p class="hm-fb" role="status" aria-live="polite">${fb || (ok ? z('✓ 答对了', '✓ Right') : '')}</p>
<div class="hm-chr"><span class="hm-n">${ok ? z('可以生成一张题卡发给朋友', 'Make a card for a friend') : z('答对后可以生成题卡发给朋友', 'Get it right to make a card for a friend')}</span>${ok ? `<button type="button" class="hm-out" data-go="#D/ch/${k}">${z('挑战朋友', 'Challenge a friend')} ›</button>` : ''}</div>`;
  };
  draw();
  box.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-o]'); if (!b || solved()) return;
    const i = Number(b.dataset.o);
    if (i === Q.a) { const prev = masteredSt(); vfAdd(id); noteMastered(prev); draw(); } else { draw(`✗ ${z('再想想：', 'Not quite: ')}${t(Q.h)}`); box.querySelector(`[data-o="${i}"]`)?.classList.add('bad'); }
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
