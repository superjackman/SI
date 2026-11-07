/* News and tools. Static JSON, lazy. Each item has its own hash.
   Weeks are kept: a new week does not drop an older one (see archive.ts). */
import { tx, type L } from '../l4/txt';
import { tx as cx } from '../i18n/L';
import { DV_NM, dvI } from '../dv/links';
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
const shareBtn = (kind: string, id: string, l: L) => `<button type="button" class="l4-b hb-sh" data-sh="${esc(kind)}:${esc(id)}">${esc(cx('share.item', l))}</button>`;
function goalLink(it: NewsItem, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  return `<p class="hb-r"><a href="#D/${it.goal}">${z(`第 ${it.goal} 站`, `Stop ${it.goal}`)} · ${esc(goalName(it.goal, it.gi, l))}</a></p>`;
}

function newsItem(it: NewsItem, l: L, checked: string, linked: boolean) {
  const z = (a: string, b: string) => tx([a, b], l);
  const body = esc(l === 'en' ? it.en : it.zh);
  const more = (l === 'en' ? it.more.en : it.more.zh).map((s) => `<p>${esc(s)}</p>`).join('');
  return `<article class="hm-card hb-item"><p class="hb-meta">${esc(it.date)} · ${esc(it.source)}</p><p>${linked ? `<a href="#news/${esc(it.id)}">${body}</a>` : body}</p>${more}${goalLink(it, l)}${readOf(it.st, l)}<p class="hb-src"><a href="${esc(it.url)}" target="_blank" rel="noopener">${z('来源', 'Source')}</a> · ${z(`核对 ${checked}`, `checked ${checked}`)}</p>${shareBtn('news', it.id, l)}</article>`;
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
  if (item) {
    const it = ws.flatMap((w) => w.items.map((x) => ({ ...x, week: w.week }))).find((x) => x.id === item);
    if (!it) return `<section class="hb"><p class="hm-n">${esc(cx('news.missing', l))}</p>${back}</section>`;
    return `<section class="hb"><p class="hb-meta"><a href="#news">${z('资讯', 'News')}</a> · ${esc(it.week)}</p>${newsItem(it, l, src.checked, false)}</section>`;
  }
  const nav = ws.length > 1 ? `<nav class="hb-arch" aria-label="${esc(cx('news.older', l))}">${ws.slice(1).map((w) => `<a class="hb-aw" href="#news/w/${esc(w.week)}">${esc(weekLead(1, w.week, ws.length, l))}</a>`).join('')}</nav>` : '';
  const blocks = ws.map((w, i) => {
    const items = w.items.map((it) => newsItem(it, l, src.checked, true)).join('');
    return `<h3 class="hb-cat">${esc(weekLead(i, w.week, ws.length, l))}</h3>${items}${i === 0 ? nav : ''}`;
  }).join('');
  return `<section class="hb">${blocks}</section>`;
}
export function newsHtml(l: L, item = ''): string {
  return newsFrom(news, l, item);
}

function toolCard(t: Tool, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  return `<article class="hm-card hb-item" data-tasks="${esc(t.tasks.join(' '))}"><b><a href="#tools/${t.id}">${esc(t.name)}</a></b><p>${esc(l === 'en' ? t.en : t.zh)}</p><p class="hb-meta">${esc(tx(t.free as [string, string], l))}</p><p>${esc(tx(t.cn as [string, string], l))}</p>${readOf(t.st, l)}<p class="hb-src"><a href="#D/${t.safe}">${z('安全', 'Safety')}</a> · <a href="${esc(t.url)}" target="_blank" rel="noopener">${z('官网', 'Site')}</a> · ${z(`核对 ${tools.checked}`, `checked ${tools.checked}`)}</p>${shareBtn('tools', t.id, l)}</article>`;
}
export function toolsHtml(l: L, item = ''): string {
  const z = (a: string, b: string) => tx([a, b], l);
  if (item && !item.startsWith('t/')) {
    const t = findTool(item);
    if (!t) return `<section class="hb"><p class="hm-n">${z('没有这个工具。', 'No such tool.')}</p><p><a href="${esc(toolsListHash())}">${z('回工具', 'Back to tools')}</a></p></section>`;
    return `<section class="hb"><p class="hb-meta"><a href="${esc(toolsListHash())}">${z('工具', 'Tools')}</a></p>${toolCard(t, l)}${guideDetail(guide, t.id, l)}</section>`;
  }
  const task = toolsTask(item);
  const chips = `<div class="hb-f" role="tablist">${(['all', ...TASKS] as const).map((id) => `<button type="button" role="tab" data-task="${id}" class="${id === task ? 'on' : ''}" aria-selected="${id === task}">${esc(id === 'all' ? z('全部', 'All') : tx(TASK[id], l))}</button>`).join('')}</div>`;
  const cards = tools.items.map((t) => {
    const hide = task !== 'all' && !t.tasks.includes(task as (typeof TASKS)[number]);
    return toolCard(t, l).replace('<article ', `<article ${hide ? 'hidden ' : ''}`);
  }).join('');
  return `<section class="hb"><p class="hm-n">${z('只列真实产品。首批选择指南写了适合谁、许可和部署。没有从中国大陆测过的，就写尚未实测。', 'Real products only. The first guide says who it suits, the license and what it takes to run. Where mainland China was not measured, it says so.')}</p>${guideLead(guide, l)}${chips}<div class="hb-list">${cards}</div></section>`;
}

/** wire the task filter; `go` writes the filter into the address */
export function wireTools(root: ParentNode, go?: (hash: string) => void) {
  const box = root.querySelector<HTMLElement>('.hb-f'); if (!box) return;
  box.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-task]'); if (!b) return;
    const id = b.dataset.task ?? 'all';
    const hash = toolsHash(id);
    if (go) { go(hash); return; }
    box.querySelectorAll<HTMLElement>('[data-task]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
    root.querySelectorAll<HTMLElement>('.hb-list [data-tasks]').forEach((card) => { card.hidden = id !== 'all' && !(card.dataset.tasks ?? '').split(' ').includes(id); });
  });
}
