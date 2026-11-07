/* News and tools. Static JSON, lazy. Each item has its own hash.
   Weeks are kept: a new week does not drop an older one (see archive.ts). */
import { tx, type L } from '../l4/txt';
import { tx as cx } from '../i18n/L';
import { DV_NM, dvI, posLabel } from '../dv/links';
import { ML } from '../dv/mld';
import { masteredSt } from '../dv/prog';
import news from './news.json';
import tools from './tools.json';
import guide from './guide.json';
import { guideDetail, guideLead } from '../../scripts/guide-html.mjs';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const stN = (k: string, l: L) => tx(DV_NM[dvI(k)] ?? [k, k], l);
export interface NewsRow {
  id: string; date: string; zh: string; en: string; url: string; source: string;
  st: string[]; goal: string; gi: number; more: { zh: readonly string[]; en: readonly string[] };
}
type NewsItem = NewsRow;
type Tool = (typeof tools.items)[number];
export const TASKS = ['write', 'read', 'code', 'draw', 'local'] as const;
const TASK_SET = new Set<string>(TASKS);
/** `#tools` or `#tools/t/code`. The filter is the address, so refresh and back/forward keep it. */
export function toolsTask(item: string): string {
  const m = /^t\/([a-z]+)$/.exec(item);
  return m && TASK_SET.has(m[1]!) ? m[1]! : 'all';
}
export function toolsHash(task: string): string {
  return !task || task === 'all' ? '#tools' : `#tools/t/${task}`;
}
/** the list the reader left, including its filter, so a tool page can return there */
export function toolsListHash(): string {
  try {
    const h = (sessionStorage.getItem('si.tools.scroll') || '').split('\n')[0] || '';
    if (h === '#tools' || /^#tools\/t\/(write|read|code|draw|local)$/.test(h)) return h;
  } catch { /* private mode */ }
  return '#tools';
}
const TASK: Record<(typeof TASKS)[number], readonly [string, string]> = {
  write: ['写作', 'Writing'],
  read: ['查资料', 'Look things up'],
  code: ['编程', 'Code'],
  draw: ['做图', 'Pictures'],
  local: ['本地跑', 'Run locally'],
};
const weeks = () => [...news.weeks].sort((a, b) => (a.week < b.week ? 1 : -1));
/** heading for week i of n. The “older weeks stay below” line is only true when an older week is actually rendered. */
export function weekLead(i: number, week: string, n: number, l: L): string {
  if (i > 0) return tx([`往期 · ${week}`, `Archive · ${week}`], l);
  const base = tx([`本周 ${week} 起。每条都有来源和日期，没有排行。`, `This week, from ${week}. Each item has a source and a date. No ranking.`], l);
  return n > 1 ? base + tx(['往期留在下面，不覆盖。', ' Older weeks stay below.'], l) : base;
}
export const findNews = (id: string) => weeks().flatMap((w) => w.items.map((it) => ({ ...it, week: w.week }))).find((it) => it.id === id) ?? null;
export const findTool = (id: string) => tools.items.find((t) => t.id === id) ?? null;

function goalName(k: string, i: number, l: L) {
  const g = ML[k]?.goals[i];
  return g ? tx(g.t, l) : stN(k, l);
}
function readOf(st: string[], l: L) {
  const m = masteredSt(), got = st.filter((k) => m.has(k)).length;
  const z = (a: string, b: string) => tx([a, b], l);
  const links = st.map((k) => `<a href="#D/${k}">${esc(stN(k, l))}</a>`).join(z('、', ', '));
  return `<p class="hb-r">${z(`读懂度 ${got}/${st.length}`, `Read ${got}/${st.length}`)} · ${links}</p>`;
}
function goalLink(it: NewsItem, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  return `<p class="hb-r"><a href="#D/${it.goal}">${z(dvI(it.goal) >= 0 ? posLabel(dvI(it.goal), 'zh') : it.goal, dvI(it.goal) >= 0 ? posLabel(dvI(it.goal), 'en') : it.goal)} · ${esc(goalName(it.goal, it.gi, l))}</a></p>`;
}

function newsItem(it: NewsItem, l: L, checked: string, linked: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const body = esc(l === 'en' ? it.en : it.zh);
  const more = linked ? '' : (l === 'en' ? it.more.en : it.more.zh).map((s) => `<p>${esc(s)}</p>`).join('');
  return `<article class="hm-card hb-item" id="n-${esc(it.id)}"><p class="hb-meta">${esc(it.date)} · ${esc(it.source)}</p><p>${linked ? `<a href="#news/${esc(it.id)}">${body}</a>` : body}</p>${more}${goalLink(it, l)}${readOf(it.st, l)}<p class="hb-src"><a href="${esc(it.url)}" target="_blank" rel="noopener">${z('来源', 'Source')}</a> · ${z(`核对 ${checked}`, `checked ${checked}`)}</p></article>`;
}
function newsOpen(it: NewsItem, l: L, checked: string) {
  const z = (a: string, b: string) => tx([a, b], l);
  const more = (l === 'en' ? it.more.en : it.more.zh).map((s) => `<p>${esc(s)}</p>`).join('');
  return `<article class="hb-open" data-news-open="${esc(it.id)}"><h2>${esc(l === 'en' ? it.en : it.zh)}</h2>${more}${goalLink(it, l)}<p class="hb-src"><a href="${esc(it.url)}" target="_blank" rel="noopener">${z('来源', 'Source')}</a> · ${z(`核对 ${checked}`, `checked ${checked}`)}</p></article>`;
}
/** `src` is the weeks file. Older weeks are a list only when there is more than one. */
export function newsFrom(src: { checked: string; weeks: { week: string; items: NewsItem[] }[] }, l: L, item = ''): string {
  const z = (a: string, b: string) => tx([a, b], l);
  const ws = [...src.weeks].sort((a, b) => (a.week < b.week ? 1 : -1));
  const back = `<p><a href="#news">${esc(cx('news.back', l))}</a></p>`;
  if (item.startsWith('w/')) {
    const id = item.slice(2), i = ws.findIndex((w) => w.week === id);
    if (i < 0) return `<section class="hb"><p class="hm-n">${esc(cx('news.noWeek', l))}</p>${back}</section>`;
    const w = ws[i]!, head = ws.length > 1 && i > 0 ? weekLead(i, w.week, ws.length, l) : tx([`本周 ${w.week} 起。每条都有来源和日期，没有排行。`, `This week, from ${w.week}. Each item has a source and a date. No ranking.`], l);
    const items = w.items.map((it) => newsItem(it, l, src.checked, true)).join('');
    return `<section class="hb"><p class="hb-meta"><a href="#news">${z('资讯', 'News')}</a></p><h3 class="hb-cat">${esc(head)}</h3>${items}</section>`;
  }
  const openId = item && !item.startsWith('w/') ? item : ws[0]?.items[0]?.id ?? '';
  if (item && !item.startsWith('w/')) {
    const it = ws.flatMap((w) => w.items).find((x) => x.id === item);
    if (!it) return `<section class="hb"><p class="hm-n">${esc(cx('news.missing', l))}</p>${back}</section>`;
  }
  const nav = ws.length > 1 ? `<nav class="hb-arch" aria-label="${esc(cx('news.older', l))}">${ws.slice(1).map((w) => `<a class="hb-aw" href="#news/w/${esc(w.week)}">${esc(weekLead(1, w.week, ws.length, l))}</a>`).join('')}</nav>` : '';
  const blocks = ws.map((w, i) => {
    const items = w.items.map((it) => newsItem(it, l, src.checked, true)).join('');
    return `<h3 class="hb-cat">${esc(weekLead(i, w.week, ws.length, l))}</h3>${items}${i === 0 ? nav : ''}`;
  }).join('');
  const opened = ws.flatMap((w) => w.items).find((x) => x.id === openId);
  return `<section class="hb">${blocks}${opened ? newsOpen(opened, l, src.checked) : ''}</section>`;
}
export function newsHtml(l: L, item = ''): string {
  return newsFrom(news, l, item);
}

function facets(t: Tool) {
  const free = tx(t.free as [string, string], 'en').toLowerCase() + ' ' + (t.free as [string, string])[0];
  const lic = /mit/i.test(free) ? 'mit' : /apache/i.test(free) ? 'apache' : 'other';
  const cn = (t.cn as [string, string])[0];
  const host = cn.includes('尚未实测') ? 'unmeasured' : (t.zh.startsWith('开源') || cn.includes('GitHub')) ? 'oss' : 'hosted';
  return { lic, host };
}
function toolCard(t: Tool, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const f = facets(t);
  return `<article class="hm-card hb-item" data-tasks="${esc(t.tasks.join(' '))}" data-lic="${f.lic}" data-host="${f.host}"><b><a href="#tools/${t.id}">${esc(t.name)}</a></b><p>${esc(l === 'en' ? t.en : t.zh)}</p><p class="hb-meta">${esc(tx(t.free as [string, string], l))}</p><p>${esc(tx(t.cn as [string, string], l))}</p>${readOf(t.st, l)}<p class="hb-src"><a href="#D/${t.safe}">${z('安全', 'Safety')}</a> · <a href="${esc(t.url)}" target="_blank" rel="noopener">${z('官网', 'Site')}</a> · ${z(`核对 ${tools.checked}`, `checked ${tools.checked}`)}</p></article>`;
}
export function toolsHtml(l: L, item = ''): string {
  const z = (a: string, b: string) => tx([a, b], l);
  if (item && !item.startsWith('t/')) {
    const t = findTool(item);
    if (!t) return `<section class="hb"><p class="hm-n">${z('没有这个工具。', 'No such tool.')}</p><p><a href="${esc(toolsListHash())}">${z('回工具', 'Back to tools')}</a></p></section>`;
    const back = toolsListHash();
    const rel = t.st.map((k) => `<a href="#D/${k}">${esc(dvI(k) >= 0 ? posLabel(dvI(k), l === 'en' ? 'en' : 'zh') : k)} · ${esc(stN(k, l))}</a>`).join(z('，', ', '));
    return `<section class="hb hb-plain"><p class="hb-meta"><a href="${esc(back)}">${z('工具', 'Tools')}</a> · ${esc(t.name)}</p><h1 class="st-h">${esc(t.name)}</h1><p class="st-nar">${esc(l === 'en' ? t.en : t.zh)}</p><div class="hm-ratio"><p>${esc(tx(t.free as [string, string], l))}</p><p>${esc(tx(t.cn as [string, string], l))}</p><p class="hb-meta">${z(`核对 ${tools.checked}`, `checked ${tools.checked}`)}</p></div><p>${z('和课程的关系：', 'In the course: ')}${rel}</p><p><a href="${esc(t.url)}" target="_blank" rel="noopener">${z('打开官网', 'Open the site')}</a></p><a class="hm-cta" href="${esc(back)}">${z('回工具列表', 'Back to tools')}</a>${guideDetail(guide, t.id, l)}</section>`;
  }
  const task = toolsTask(item);
  const taskBtns = (['all', ...TASKS] as const).map((id) => `<button type="button" role="tab" data-task="${id}" class="${id === task ? 'on' : ''}" aria-selected="${id === task}">${esc(id === 'all' ? z('全部', 'All') : tx(TASK[id], l))}</button>`).join('');
  const licBtns = ([['all', z('全部', 'All')], ['mit', 'MIT'], ['apache', 'Apache 2.0'], ['other', z('其他写法', 'Other')]] as const).map(([id, name]) => `<button type="button" data-lic="${id}" class="${id === 'all' ? 'on' : ''}" aria-pressed="${id === 'all'}">${esc(name)}</button>`).join('');
  const hostBtns = ([['all', z('全部', 'All')], ['oss', z('开源，可自行部署', 'Open source, you host it')], ['hosted', z('托管网站', 'A hosted site')], ['unmeasured', z('尚未实测', 'Not measured')]] as const).map(([id, name]) => `<button type="button" data-host="${id}" class="${id === 'all' ? 'on' : ''}" aria-pressed="${id === 'all'}">${esc(name)}</button>`).join('');
  const chips = `<div class="hb-f"><h2>${z('按任务', 'By task')}</h2><div role="tablist">${taskBtns}</div><h2>${z('按许可', 'By license')}</h2><div>${licBtns}</div><h2>${z('开源与托管', 'Source and hosting')}</h2><div>${hostBtns}</div></div>`;
  const cards = tools.items.map((t) => {
    const hide = task !== 'all' && !t.tasks.includes(task as (typeof TASKS)[number]);
    return toolCard(t, l).replace('<article ', `<article ${hide ? 'hidden ' : ''}`);
  }).join('');
  const local = guide.groups.find((g) => g.id === 'local') ?? guide.groups[0];
  const COLS = ['Ollama', 'llama.cpp', 'vLLM'] as const;
  const phrase = (zh: string, en: string) => (l === 'en' ? en : zh);
  const ROWS: { zh: string; en: string; cell: Record<string, readonly [string, string]> }[] = [
    { zh: '谁负责跑模型', en: 'Who runs the model', cell: { Ollama: ['命令 ollama run gemma4:e2b', 'ollama run gemma4:e2b'], 'llama.cpp': ['llama cli 或 llama serve', 'llama cli or llama serve'], vLLM: ['一次挂一个模型', 'one model at a time'] } },
    { zh: '许可', en: 'License', cell: { Ollama: ['LICENSE 是 MIT', 'LICENSE files for Ollama and llama.cpp are MIT'], 'llama.cpp': ['LICENSE 是 MIT', 'LICENSE files for Ollama and llama.cpp are MIT'], vLLM: ['LICENSE 是 Apache 2.0', 'LICENSE is Apache 2.0'] } },
    { zh: '机器要求', en: 'Machine', cell: { Ollama: ['建议 8 GB 可用显存', '8 GB of VRAM'], 'llama.cpp': ['—', '—'], vLLM: ['Linux 和 Python 3.11 到 3.14', 'Linux and Python 3.11 through 3.14'] } },
  ];
  const cmp = local ? `<aside class="hb-cmp"><h2>${z('同一任务对照', 'Same task')}</h2><p class="hb-meta">${esc(tx(local.task as [string, string], l))} · ${z('不是评分。', 'No score.')} ${z(`核对 ${guide.checked}`, `checked ${guide.checked}`)}</p><table><thead><tr><th></th>${COLS.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${ROWS.map((r) => `<tr><th>${z(r.zh, r.en)}</th>${COLS.map((c) => `<td>${esc(phrase(...(r.cell[c] ?? ['—', '—'])))}</td>`).join('')}</tr>`).join('')}</tbody></table><details><summary>${z('指南原句', 'The guide’s sentences')}</summary>${local.diffs.map((d) => `<p>${esc(l === 'en' ? d.en : d.zh)}</p>`).join('')}</details></aside>` : '';
  return `<section class="hb"><p class="hm-n">${z('只列真实产品。首批选择指南写了适合谁、许可和部署。没有从中国大陆测过的，就写尚未实测。', 'Real products only. The first guide says who it suits, the license and what it takes to run. Where mainland China was not measured, it says so.')}</p>${guideLead(guide, l)}<div class="hb-desk">${chips}<div class="hb-list">${cards}</div>${cmp}</div></section>`;
}

/** wire the task filter; `go` writes the filter into the address */
export function wireTools(root: ParentNode, go?: (hash: string) => void) {
  const box = root.querySelector<HTMLElement>('.hb-f'); if (!box) return;
  const paint = () => {
    const taskOn = box.querySelector<HTMLElement>('[data-task].on')?.dataset.task ?? 'all';
    const lic = box.querySelector<HTMLElement>('[data-lic].on')?.dataset.lic ?? 'all';
    const host = box.querySelector<HTMLElement>('[data-host].on')?.dataset.host ?? 'all';
    root.querySelectorAll<HTMLElement>('.hb-list [data-tasks]').forEach((card) => {
      const tasks = (card.dataset.tasks ?? '').split(' ');
      card.hidden = (taskOn !== 'all' && !tasks.includes(taskOn)) || (lic !== 'all' && card.dataset.lic !== lic) || (host !== 'all' && card.dataset.host !== host);
    });
  };
  box.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-task],[data-lic],[data-host]'); if (!b) return;
    if (b.dataset.task) {
      const id = b.dataset.task ?? 'all';
      const hash = toolsHash(id);
      if (go) { go(hash); return; }
      box.querySelectorAll<HTMLElement>('[data-task]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
      paint(); return;
    }
    const key = b.dataset.lic ? 'lic' : 'host';
    box.querySelectorAll<HTMLElement>(`[data-${key}]`).forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    paint();
  });
}
