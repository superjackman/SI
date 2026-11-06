/* News and tools for the home panes. Static JSON, lazy. Readership uses the same mastery ledger as the stations. */
import { tx, type L } from '../l4/txt';
import { DV_NM, dvI } from '../dv/links';
import { masteredSt } from '../dv/prog';
import news from './news.json';
import tools from './tools.json';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const stN = (k: string, l: L) => tx(DV_NM[dvI(k)] ?? [k, k], l);
const CAT: Record<string, readonly [string, string]> = {
  read: ['查资料', 'Look things up'],
  code: ['写代码', 'Write code'],
  local: ['在自己电脑上跑', 'Run on your own computer'],
};

function readOf(st: string[], l: L) {
  const m = masteredSt(), got = st.filter((k) => m.has(k)).length;
  const z = (a: string, b: string) => tx([a, b], l);
  const links = st.map((k) => `<a href="#D/${k}">${esc(stN(k, l))}</a>`).join(z('、', ', '));
  return `<p class="hb-r">${z(`读懂度 ${got}/${st.length}`, `Read ${got}/${st.length}`)} · ${links}</p>`;
}

export function newsHtml(l: L): string {
  const z = (a: string, b: string) => tx([a, b], l);
  const items = news.items.map((it) => `<article class="hm-card hb-item"><p class="hb-meta">${esc(it.date)} · ${esc(it.source)}</p><p>${esc(l === 'en' ? it.en : it.zh)}</p>${readOf(it.st, l)}<p class="hb-src"><a href="${esc(it.url)}" target="_blank" rel="noopener">${z('来源', 'Source')}</a> · ${z(`核对 ${news.checked}`, `checked ${news.checked}`)}</p></article>`).join('');
  return `<section class="hb"><p class="hm-n">${z(`本周 ${news.week} 起。每条都有来源和日期，没有排行。`, `This week, from ${news.week}. Each item has a source and a date. No ranking.`)}</p>${items}</section>`;
}

export function toolsHtml(l: L): string {
  const z = (a: string, b: string) => tx([a, b], l);
  const groups = ['read', 'code', 'local'].map((cat) => {
    const cards = tools.items.filter((t) => t.cat === cat).map((t) => `<article class="hm-card hb-item"><b>${esc(t.name)}</b><p>${esc(l === 'en' ? t.en : t.zh)}</p><p class="hb-meta">${esc(tx(t.free as [string, string], l))}</p><p>${esc(tx(t.cn as [string, string], l))}</p>${readOf(t.st, l)}<p class="hb-src"><a href="#D/${t.safe}">${z('安全', 'Safety')}</a> · <a href="${esc(t.url)}" target="_blank" rel="noopener">${z('官网', 'Site')}</a> · ${z(`核对 ${tools.checked}`, `checked ${tools.checked}`)}</p></article>`).join('');
    return `<h3 class="hb-cat">${esc(tx(CAT[cat]!, l))}</h3>${cards}`;
  }).join('');
  return `<section class="hb"><p class="hm-n">${z('只列真实产品。能不能在中国打开，按核对日的官网情况写，之后可能变。', 'Real products only. Whether the site opens in China is as of the checked date, and can change.')}</p>${groups}</section>`;
}
