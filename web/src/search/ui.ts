/* Header search. The index is a build artifact (search.json), fetched the first time the
   dialog opens and kept in memory, so later queries work offline. */
import './search.css';
import { tx } from '../i18n/L';
import type { Code } from '../i18n/codes';
import type { L } from '../l4/txt';
import { grouped, search, whyOf, type Entry, type Kind } from './query';

const KIND: Record<Kind, Code> = {
  st: 'search.kind.st', card: 'search.kind.card', news: 'search.kind.news', tool: 'search.kind.tool', work: 'search.kind.work',
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

let cache: Promise<Entry[]> | null = null;
/** tests reset the in-memory index between cases */
export function clearSearchCache() { cache = null; }
function loadIndex(): Promise<Entry[]> {
  const base = location.pathname.replace(/[^/]*$/, '');
  return (cache ??= fetch(`${base}search.json`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Entry[]>; }).catch((e) => { cache = null; throw e; }));
}

export function openSearch(host: HTMLElement, l: L, back?: HTMLElement | null) {
  host.querySelector('.si-find')?.remove();
  const el = document.createElement('div');
  el.className = 'l4-sheet si-find';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', tx('search.title', l));
  el.innerHTML = `<div class="l4-sin"><header class="l4-sh"><b class="l4-kn">${esc(tx('search.title', l))}</b><button type="button" class="g-x" data-si="x" aria-label="${esc(tx('ui.close', l))}">✕</button></header>
<div class="l4-sbody"><input class="si-q" type="search" enterkeyhint="search" autocomplete="off" aria-label="${esc(tx('search.ph', l))}" placeholder="${esc(tx('search.ph', l))}">
<p class="si-st" role="status">${esc(tx('search.hint', l))}</p><div class="si-res"></div></div></div>`;
  const close = () => { el.remove(); removeEventListener('keydown', key); back?.focus(); };
  const links = () => [...el.querySelectorAll<HTMLAnchorElement>('.si-hit')];
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const list = links();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLAnchorElement);
    e.preventDefault();
    const next = e.key === 'ArrowDown' ? (list[i + 1] ?? list[0]) : (list[i <= 0 ? list.length - 1 : i - 1]);
    next?.focus();
  };
  const st = el.querySelector<HTMLElement>('.si-st')!;
  const box = el.querySelector<HTMLElement>('.si-res')!;
  const input = el.querySelector<HTMLInputElement>('.si-q')!;
  let rows: Entry[] | null = null, tok = 0;
  const paint = (q: string) => {
    if (!rows) return;
    const hits = search(rows, q);
    if (!q.trim()) { box.innerHTML = ''; st.textContent = tx('search.hint', l); return; }
    if (!hits.length) { box.innerHTML = ''; st.textContent = tx('search.empty', l); return; }
    st.textContent = '';
    box.innerHTML = grouped(hits).map((g) => `<section class="si-g"><h3>${esc(tx(KIND[g.kind], l))}</h3>${g.hits.map((h) => {
      const title = l === 'en' ? h.en : h.zh;
      const extra = l === 'en' ? h.e : h.z;
      const why = whyOf(h, q);
      const reason = tx(`search.why.${why.k}` as Code, l) + (why.alias ? (l === 'zh' ? `：${why.alias}` : `: ${why.alias}`) : '');
      return `<a class="si-hit" href="${esc(h.hash)}"><span class="si-k">${esc(tx(KIND[h.kind], l))}</span><b>${esc(title)}</b><span class="si-why">${esc(reason)}</span>${extra ? `<small>${esc(extra)}</small>` : ''}</a>`;
    }).join('')}</section>`).join('');
  };
  input.addEventListener('input', () => {
    const q = input.value, t = ++tok;
    if (!rows) { st.textContent = tx('search.loading', l); void loadIndex().then((r) => { rows = r; if (t === tok && el.isConnected) paint(input.value); }).catch(() => { if (t === tok && el.isConnected) { st.textContent = tx('search.fail', l); box.innerHTML = ''; } }); return; }
    paint(q);
  });
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === el || t.closest('[data-si="x"]')) { close(); return; }
    if (t.closest('a[href^="#"]')) close();
  });
  addEventListener('keydown', key);
  host.appendChild(el);
  input.focus({ preventScroll: true });
}
