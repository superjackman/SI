/* 复习, 我的, 搜索, 设置. Pages, not overlays. */
import { tx, type L } from './txt';
import { useApp } from '../store/app';
import { animOn, clearRecord, setAnim } from '../store/prefs';
import { ratioHtml } from './ratios';
import { keepHtml, wireKeep } from '../px/keep';
import { rvPick, wrongIds } from '../px/rv';
import { DV_NM, dvI, posLabel } from '../dv/links';
import { stOf } from '../px/mem';
import { grouped, search, whyOf, type Entry, type Kind } from '../search/query';
import { tx as cx } from '../i18n/L';
import type { Code } from '../i18n/codes';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const KIND: Record<Kind, Code> = {
  st: 'search.kind.st', card: 'search.kind.card', news: 'search.kind.news', tool: 'search.kind.tool', work: 'search.kind.work',
};

let index: Promise<Entry[]> | null = null;
function loadIndex(): Promise<Entry[]> {
  const base = location.pathname.replace(/[^/]*$/, '');
  return (index ??= fetch(`${base}search.json`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Entry[]>; }).catch((e) => { index = null; throw e; }));
}

function settingsHtml(l: L, ask: boolean): string {
  const z = (a: string, b: string) => tx([a, b], l);
  const dark = document.documentElement.dataset.theme === 'dark';
  const on = animOn();
  return `<div class="hm hm-desk"><p class="hm-k">${z('设置', 'Settings')}</p><h1 class="hm-h">${z('设置', 'Settings')}</h1>
<div class="set-row"><b>${z('语言', 'Language')}</b><div class="pills"><button type="button" class="pill${l === 'zh' ? ' on' : ''}" data-v="zh">中文</button><button type="button" class="pill${l === 'en' ? ' on' : ''}" data-v="en">English</button></div></div>
<div class="set-row"><b>${z('外观', 'Appearance')}</b><div><button type="button" class="pill${dark ? '' : ' on'}" data-v="theme">${dark ? z('深色', 'Dark') : z('纸色', 'Paper')}</button><p class="hm-n">${z('纸色是默认。深色只在这里打开。', 'Paper is the default. Dark is only switched on here.')}</p></div></div>
<div class="set-row"><b>${z('动画', 'Animation')}</b><div><button type="button" class="pill${on ? ' on' : ''}" data-v="anim">${on ? z('开', 'On') : z('关', 'Off')}</button><p class="hm-n">${z('关掉后画面不再动。', 'Off: nothing moves.')}</p></div></div>
<div class="set-row"><b>${z('学习记录', 'Learning record')}</b><div><button type="button" class="pill" data-v="clr">${z('清除学习记录', 'Clear learning record')}</button>
${ask ? `<p class="hm-n">${z('看过的站和小测答题会删掉，不能恢复。', 'Stops you have opened and quiz answers are deleted for good.')}</p><div class="pills"><button type="button" class="pill" data-v="no">${z('取消', 'Cancel')}</button><button type="button" class="pill on" data-v="yes">${z('清除', 'Clear')}</button></div>` : ''}
</div></div>
<p><a class="hm-cta" href="#home">${z('完成，回学习', 'Done, back to learning')}</a></p></div>`;
}

function wireSettings(host: HTMLElement, redraw: () => void) {
  if (host.dataset.set === '1') return;
  host.dataset.set = '1';
  host.addEventListener('click', (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>('[data-v]')?.dataset.v;
    if (!v) return;
    if (v === 'zh' || v === 'en') { useApp.getState().setLang(v); redraw(); return; }
    if (v === 'theme') {
      const next = document.documentElement.dataset.theme === 'dark' ? '' : 'dark';
      if (next) document.documentElement.dataset.theme = next; else delete document.documentElement.dataset.theme;
      try { localStorage.setItem('si.theme', next || 'light'); } catch { /* private */ }
    } else if (v === 'anim') setAnim(!animOn());
    else if (v === 'clr') host.dataset.ask = '1';
    else if (v === 'no') host.dataset.ask = '';
    else if (v === 'yes') { clearRecord(); host.dataset.ask = ''; }
    else return;
    host.innerHTML = settingsHtml(useApp.getState().lang === 'en' ? 'en' : 'zh', host.dataset.ask === '1');
  });
}

async function paintSearch(host: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const q = new URLSearchParams(location.search).get('q') ?? '';
  host.innerHTML = `<div class="hm hm-desk si-page"><p class="hm-k">${z('搜索', 'Search')}</p><h1 class="hm-h">${esc(q || z('搜索', 'Search'))}</h1><p class="hm-n si-st">${z('加载中…', 'Loading…')}</p><div class="si-res"></div></div>`;
  const st = host.querySelector<HTMLElement>('.si-st')!, box = host.querySelector<HTMLElement>('.si-res')!;
  try {
    const rows = await loadIndex();
    if (!host.isConnected) return;
    if (!q.trim()) { st.textContent = z('输入一个词，例如梯度。', 'Type a word, for example gradient.'); return; }
    const hits = search(rows, q);
    if (!hits.length) { st.textContent = z('没有找到。', 'Nothing found.'); return; }
    st.textContent = '';
    box.innerHTML = grouped(hits).map((g) => `<section><h2 class="hm-n">${esc(cx(KIND[g.kind], l))}</h2>${g.hits.map((h) => {
      const title = l === 'en' ? h.en : h.zh;
      const why = whyOf(h, q);
      return `<a class="si-hit" href="${esc(h.hash)}"><b>${esc(title)}</b><span>${esc(cx(`search.why.${why.k}` as Code, l))}</span></a>`;
    }).join('')}</section>`).join('');
  } catch {
    if (host.isConnected) st.textContent = z('目录没有载入。', 'The index did not load.');
  }
}

async function paintReview(host: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const picks = rvPick(1);
  const wb = wrongIds().length;
  if (!picks.length) {
    host.innerHTML = `<div class="hm hm-desk"><p class="hm-k">${z('复习', 'Review')}</p><h1 class="hm-h">${z('今天没有要复习的题', 'Nothing to review today')}</h1><p class="hm-s">${z('做对的题会在 1、3、7 天后回来。', 'Questions you get right come back after 1, 3 and 7 days.')}</p><a class="hm-cta" href="#home">${z('回学习', 'Back to learning')}</a></div>`;
    return;
  }
  const p = picks[0]!, k = stOf(p.id);
  const name = k && dvI(k) >= 0 ? tx(DV_NM[dvI(k)] ?? [k, k], l) : p.id;
  const where = k && dvI(k) >= 0 ? posLabel(dvI(k), l === 'en' ? 'en' : 'zh') : '';
  host.innerHTML = `<div class="hm hm-desk"><p class="hm-k">${z(`复习 · 错题本 ${wb} 题`, `Review · wrong book ${wb}`)}</p><h1 class="hm-h">${z('今天的 1 题', 'Today’s one question')}</h1><p class="hm-s">${esc(where)} · ${esc(name)}</p><div class="vf-slot" data-vf-page="review"></div></div>`;
  const slot = host.querySelector<HTMLElement>('.vf-slot');
  if (!slot) return;
  const ui = await import('../vf/ui');
  if (!slot.isConnected) return;
  ui.mount(slot, 'R/rv', l, undefined, undefined, { ids: [p.id], rev: true });
}

export function paint(host: HTMLElement, id: string, l: L, root: HTMLElement, redraw: () => void) {
  if (id === 'settings') {
    host.innerHTML = settingsHtml(l, host.dataset.ask === '1');
    wireSettings(host, redraw);
    return;
  }
  if (id === 'search') { void paintSearch(host, l); return; }
  if (id === 'review') { void paintReview(host, l); return; }
  host.innerHTML = `<div class="hm hm-desk"><p class="hm-k">${tx(['我的', 'Me'], l)}</p><h1 class="hm-h">${tx(['进度', 'Progress'], l)}</h1>${ratioHtml(l)}<p class="hm-n">${tx(['读过是打开过的站。做过是交过答案的站。答对是做对的题。掌握是这一站的题都做对，或小目标都点亮。', 'Read: stops opened. Tried: stops with an answer. Right: questions correct. Mastered: every question on the stop is right, or every small goal is lit.'], l)}</p>${keepHtml(l)}</div>`;
  wireKeep(host, l, root);
}
