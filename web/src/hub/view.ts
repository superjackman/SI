/* News and tools. Static JSON, lazy. Each item has its own hash.
   Weeks are kept: a new week does not drop an older one (see archive.ts). */
import { tx, type L } from '../l4/txt';
import { DV_NM, dvI } from '../dv/links';
import { ML } from '../dv/mld';
import { masteredSt } from '../dv/prog';
import news from './news.json';
import tools from './tools.json';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const stN = (k: string, l: L) => tx(DV_NM[dvI(k)] ?? [k, k], l);
type NewsItem = (typeof news.weeks)[number]['items'][number];
type Tool = (typeof tools.items)[number];
export const TASKS = ['write', 'read', 'code', 'draw', 'local'] as const;
const TASK: Record<(typeof TASKS)[number], readonly [string, string]> = {
  write: ['写作', 'Writing'],
  read: ['查资料', 'Look things up'],
  code: ['编程', 'Code'],
  draw: ['做图', 'Pictures'],
  local: ['本地跑', 'Run locally'],
};
const weeks = () => [...news.weeks].sort((a, b) => (a.week < b.week ? 1 : -1));
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
  return `<p class="hb-r"><a href="#D/${it.goal}">${z(`第 ${it.goal} 站`, `Stop ${it.goal}`)} · ${esc(goalName(it.goal, it.gi, l))}</a></p>`;
}

export function newsHtml(l: L, item = ''): string {
  const z = (a: string, b: string) => tx([a, b], l);
  if (item) {
    const it = findNews(item);
    if (!it) return `<section class="hb"><p class="hm-n">${z('这条资讯不在存档里。', 'That item is not in the archive.')}</p><p><a href="#news">${z('回资讯', 'Back to news')}</a></p></section>`;
    const more = (l === 'en' ? it.more.en : it.more.zh).map((s) => `<p>${esc(s)}</p>`).join('');
    return `<section class="hb"><p class="hb-meta"><a href="#news">${z('资讯', 'News')}</a> · ${esc(it.week)}</p><article class="hm-card hb-item"><p class="hb-meta">${esc(it.date)} · ${esc(it.source)}</p><p>${esc(l === 'en' ? it.en : it.zh)}</p>${more}${goalLink(it, l)}${readOf(it.st, l)}<p class="hb-src"><a href="${esc(it.url)}" target="_blank" rel="noopener">${z('来源', 'Source')}</a> · ${z(`核对 ${news.checked}`, `checked ${news.checked}`)}</p></article></section>`;
  }
  const blocks = weeks().map((w, i) => {
    const items = w.items.map((it) => `<article class="hm-card hb-item"><p class="hb-meta">${esc(it.date)} · ${esc(it.source)}</p><p><a href="#news/${it.id}">${esc(l === 'en' ? it.en : it.zh)}</a></p>${goalLink(it, l)}${readOf(it.st, l)}<p class="hb-src"><a href="${esc(it.url)}" target="_blank" rel="noopener">${z('来源', 'Source')}</a> · ${z(`核对 ${news.checked}`, `checked ${news.checked}`)}</p></article>`).join('');
    const h = i === 0 ? z(`本周 ${w.week} 起。每条都有来源和日期，没有排行。往期留在下面，不覆盖。`, `This week, from ${w.week}. Each item has a source and a date. No ranking. Older weeks stay below.`) : z(`往期 · ${w.week}`, `Archive · ${w.week}`);
    return `<h3 class="hb-cat">${esc(h)}</h3>${items}`;
  }).join('');
  return `<section class="hb">${blocks}</section>`;
}

function toolCard(t: Tool, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  return `<article class="hm-card hb-item" data-tasks="${esc(t.tasks.join(' '))}"><b><a href="#tools/${t.id}">${esc(t.name)}</a></b><p>${esc(l === 'en' ? t.en : t.zh)}</p><p class="hb-meta">${esc(tx(t.free as [string, string], l))}</p><p>${esc(tx(t.cn as [string, string], l))}</p>${readOf(t.st, l)}<p class="hb-src"><a href="#D/${t.safe}">${z('安全', 'Safety')}</a> · <a href="${esc(t.url)}" target="_blank" rel="noopener">${z('官网', 'Site')}</a> · ${z(`核对 ${tools.checked}`, `checked ${tools.checked}`)}</p></article>`;
}
export function toolsHtml(l: L, item = ''): string {
  const z = (a: string, b: string) => tx([a, b], l);
  if (item) {
    const t = findTool(item);
    if (!t) return `<section class="hb"><p class="hm-n">${z('没有这个工具。', 'No such tool.')}</p><p><a href="#tools">${z('回工具', 'Back to tools')}</a></p></section>`;
    return `<section class="hb"><p class="hb-meta"><a href="#tools">${z('工具', 'Tools')}</a></p>${toolCard(t, l)}</section>`;
  }
  const chips = `<div class="hb-f" role="tablist">${(['all', ...TASKS] as const).map((id) => `<button type="button" role="tab" data-task="${id}" class="${id === 'all' ? 'on' : ''}" aria-selected="${id === 'all'}">${esc(id === 'all' ? z('全部', 'All') : tx(TASK[id], l))}</button>`).join('')}</div>`;
  const cards = tools.items.map((t) => toolCard(t, l)).join('');
  return `<section class="hb"><p class="hm-n">${z('只列真实产品。能不能在中国打开，按核对日的官网情况写，之后可能变。', 'Real products only. Whether the site opens in China is as of the checked date, and can change.')}</p>${chips}<div class="hb-list">${cards}</div></section>`;
}

/** wire the task filter; called after the pane is in the document */
export function wireTools(root: ParentNode) {
  const box = root.querySelector<HTMLElement>('.hb-f'); if (!box) return;
  box.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-task]'); if (!b) return;
    const id = b.dataset.task ?? 'all';
    box.querySelectorAll<HTMLElement>('[data-task]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
    root.querySelectorAll<HTMLElement>('.hb-list [data-tasks]').forEach((card) => { card.hidden = id !== 'all' && !(card.dataset.tasks ?? '').split(' ').includes(id); });
  });
}
