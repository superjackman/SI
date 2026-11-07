/* Station frame: sticky outline (drawer on a phone) and a live worked step.
   The step follows the demo sliders already on the page. No second forward button. */
import { tx, type L } from '../l4/txt';
import { DV_KEY, DV_LV, DV_N, DV_NM, dvI, posLabel } from './links';
import { UI } from '../l4/txt';
import { fmt, gdL, gdSeq } from '../vf/calc';
import type { Dv } from './types';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const plain = (s: string) => s.replace(/`/g, '').replace(/\*\*/g, '').replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1').replace(/\{#[a-z0-9]+\}/gi, '').replace(/\s+/g, ' ').trim();

const LAYERS: { n: number; zh: string; en: string }[] = [
  { n: 5, zh: '背后的数学', en: 'The maths behind it' },
  { n: 4, zh: 'Transformer 内部', en: 'Inside a Transformer' },
  { n: 3, zh: '大模型怎么得来', en: 'How a big model is made' },
  { n: 2, zh: 'AI 助手怎么工作', en: 'How an AI assistant works' },
  { n: 1, zh: '我怎么用 AI', en: 'How I use AI' },
  { n: 0, zh: '回顾', en: 'Recap' },
];

export function outlineHtml(i: number, l: L, seen: ReadonlySet<string>, mastered: ReadonlySet<string>): string {
  const zh = l !== 'en';
  const groups = LAYERS.map((g) => {
    const rows = DV_KEY.map((k, j) => ({ k, j })).filter(({ j }) => DV_LV[j] === g.n);
    if (!rows.length) return '';
    const items = rows.map(({ k, j }) => {
      const name = tx(DV_NM[j] ?? [k, k], l);
      const cls = j === i ? 'now' : mastered.has(k) ? 'done' : seen.has(k) ? 'seen' : '';
      if (j > i && !seen.has(k) && !mastered.has(k)) return `<span class="stn ${cls}"><span class="k">${esc(k)}</span><span class="nm">${esc(name)}</span></span>`;
      return `<a class="stn ${cls}" href="#D/${k}"${j === i ? ' aria-current="true"' : ''}><span class="k">${esc(k)}</span><span class="nm">${esc(name)}</span></a>`;
    }).join('');
    const count = rows.length;
    const head = zh ? (g.n ? `第 ${g.n} 层 · ${g.zh}` : g.zh) : g.en;
    return `<section class="grp"><h2>${head} · ${count}</h2>${items}</section>`;
  }).join('');
  return `<aside class="st-out"><button type="button" class="st-tog" aria-expanded="false">${esc(posLabel(i, zh ? 'zh' : 'en'))}</button><nav aria-label="${zh ? '23 站' : '23 stops'}"><p class="pos"><span>${zh ? '路径位置' : 'Place'}</span><strong>${esc(posLabel(i, zh ? 'zh' : 'en'))}</strong></p>${groups}</nav></aside>`;
}

function fxLine(S: Dv['st'][number]): string {
  const raw = S.ly?.fx?.[0] || S.f[0] || '';
  return plain(raw);
}

export function railHtml(key: string, S: Dv['st'][number], l: L): string {
  const zh = l !== 'en', i = dvI(key);
  const prev = i > 0 ? DV_NM[i - 1] : null, next = i < DV_N - 1 ? DV_NM[i + 1] : null;
  const formula = fxLine(S) || (zh ? '这一站的式子在正文里。' : 'The formula is in the page.');
  const live = key === '2'
    ? `<div class="st-live" data-rail="gd"><div>旧 w = <b data-k="w0">0</b></div><div>∂L/∂w = <b data-k="slope">−4</b></div><div>η = <b data-k="eta">0.30</b></div><div>新 w = <b data-k="w1">1.20</b></div><div>L <b data-k="L0">4.50</b> → <b data-k="L1">1.14</b></div></div>`
    : `<div class="st-live" data-rail="text"><p data-k="step">${esc(plain(S.x[0] || S.ly?.num?.[0] || S.h || ''))}</p></div>`;
  const from = prev ? (zh ? `从${posLabel(i - 1, 'zh')}来。${plain(prev[0])}` : `From ${posLabel(i - 1, 'en')}. ${prev[1]}`) : (zh ? '起点。' : 'The start.');
  const to = next ? (zh ? `通向${posLabel(i + 1, 'zh')}。${plain(S.e || next[0])}` : `On to ${posLabel(i + 1, 'en')}. ${plain(S.e || next[1])}`) : (zh ? '这一站是回顾。' : 'This stop is the recap.');
  const lvN = DV_LV[i] ?? 0;
  const layer = lvN ? tx(UI.lv[lvN - 1]!, l) : (zh ? '回顾' : 'Recap');
  const tabs = `<nav class="st-tabs" aria-label="${zh ? '这一站的段落' : 'Parts of this stop'}"><a href="#life">${zh ? '生活画面' : 'Scene'}</a><a href="#fig">${zh ? '图' : 'Picture'}</a><a href="#formula">${zh ? '公式' : 'Formula'}</a><a href="#code">${zh ? '代码' : 'Code'}</a></nav>`;
  return `<aside class="st-side">${tabs}<h2>${zh ? '公式' : 'Formula'}</h2><p class="formula">${esc(formula)}</p><h2>${zh ? '算一步' : 'One step'}</h2>${live}<h2>${zh ? '前后' : 'Around it'}</h2><ul class="conn"><li>${esc(from)}</li><li>${esc(to)}</li></ul><p class="st-layer">${esc(layer)}</p></aside>`;
}

export function railWire(host: ParentNode, key: string) {
  host.querySelectorAll<HTMLButtonElement>('.st-tog').forEach((b) => {
    if (b.dataset.wired) return; b.dataset.wired = '1';
    b.addEventListener('click', () => {
      const open = host.querySelector('.st-out')?.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  if (key !== '2') return;
  const box = host.querySelector<HTMLElement>('[data-rail="gd"]'); if (!box) return;
  const set = (k: string, v: string) => { const n = box.querySelector(`[data-k="${k}"]`); if (n) n.textContent = v; };
  const paint = () => {
    const etaEl = host.querySelector<HTMLInputElement>('[data-dm="gd"] input[data-vs="eta"]');
    const nEl = host.querySelector<HTMLInputElement>('[data-dm="gd"] input[data-vs="n"]');
    const eta = etaEl ? Number(etaEl.value) : 0.3;
    const step = nEl ? Math.max(1, Math.round(Number(nEl.value))) : 1;
    const seq = gdSeq(eta, step);
    const w0 = seq[seq.length - 2] ?? 0;
    const w1 = seq[seq.length - 1] ?? w0;
    const slope = 2 * (w0 - 2);
    set('w0', fmt(w0, 2));
    set('slope', fmt(slope, 2));
    set('eta', fmt(eta, 2));
    set('w1', fmt(w1, 2));
    set('L0', fmt(gdL(w0), 2));
    set('L1', fmt(gdL(w1), 2));
  };
  host.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t instanceof HTMLInputElement && t.closest('[data-dm="gd"]')) paint();
  });
  const watch = new MutationObserver(() => paint());
  const root = host instanceof HTMLElement ? host : null;
  if (root) watch.observe(root, { childList: true, subtree: true });
  paint();
}
