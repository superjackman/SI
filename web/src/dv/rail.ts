/* Station frame: sticky outline (drawer on a phone) and a live worked step.
   The step follows the demo sliders already on the page. No second forward button. */
import { tx, type L } from '../l4/txt';
import { DV_KEY, DV_LV, DV_NM, posLabel } from './links';
import { fmt, gdL, gdSeq } from '../vf/calc';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

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
      const num = String(j + 1);
      return `<a class="stn ${cls}" href="#D/${k}"${j === i ? ' aria-current="true"' : ''}><span class="k">${num}</span><span class="nm">${esc(name)}</span></a>`;
    }).join('');
    const head = zh ? (g.n ? `第 ${g.n} 层 · ${g.zh}` : g.zh) : g.en;
    return `<section class="grp"><h2>${head}</h2>${items}</section>`;
  }).join('');
  const here = tx(DV_NM[i] ?? ['', ''], l);
  return `<aside class="st-out"><button type="button" class="st-tog" aria-expanded="false">${esc(posLabel(i, zh ? 'zh' : 'en'))}</button><nav aria-label="${zh ? '23 站' : '23 stops'}"><p class="pos st-pos"><span>${zh ? '路径位置' : 'Place'}</span><strong>${esc(posLabel(i, zh ? 'zh' : 'en'))}</strong><em>${esc(here)}</em></p>${groups}</nav></aside>`;
}

/** The one worked step, placed directly under the experiment. Station 2 follows the gradient sliders. */
export function workedHtml(key: string, l: L, stepHtml: string): string {
  if (key === '2') {
    const zh = l !== 'en';
    const row = (k: string, lab: string, v: string) => `<div><span>${lab}</span> <b data-k="${k}">${v}</b></div>`;
    return `<div class="st-live" data-rail="gd">${row('w0', zh ? '脚下这一站' : 'spot underfoot', '0')}${row('slope', zh ? '坡' : 'slope', '−4')}${row('eta', zh ? '这一步迈多远' : 'how far this step', '0.30')}${row('w1', zh ? '新的一站' : 'next spot', '1.20')}<div>${zh ? '罚分' : 'penalty'} <b data-k="L0">4.50</b> → <b data-k="L1">1.14</b></div></div>`;
  }
  return `<div class="st-live" data-rail="text"><p data-k="step">${stepHtml}</p></div>`;
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
  paint();
  const timer = window.setInterval(() => { if (host.querySelector('[data-vs="eta"]')) { paint(); window.clearInterval(timer); } }, 250);
  window.setTimeout(() => window.clearInterval(timer), 4000);
}
