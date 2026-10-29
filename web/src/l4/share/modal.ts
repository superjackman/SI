/* R44 the one share dialog (lazy): a centred window over the dimmed page with the picture large in the middle —
   title + ✕, (optional chips / card picker), the preview, 竖版 9:16 / 方版 4:5, one meta line, ⬇ 保存图片 · ⤴ 分享,
   and 🔗 复制链接. Used by a card's ⤴ 分享 and by #S. `k` is the data attribute the buttons carry (data-m / data-px). */
import { tx, type L } from '../txt';
import type { Card } from '../c/kc';
import { cardData } from './card';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export interface DlgO { l: L; k: string; title: string; top?: string; fmt: 'story' | 'post'; meta: string; off?: boolean; empty?: string; extra?: string }
export function dlgHtml(o: DlgO) {
  const z = (a: string, b: string) => tx([a, b], o.l), d = o.off ? ' disabled' : '', a = (v: string) => `data-${o.k}="${v}"`;
  return `<div class="g-dlg" role="dialog" aria-modal="true" aria-label="${esc(o.title)}"><div class="g-dh"><b>${esc(o.title)}</b><button type="button" class="g-x" ${a('close')} aria-label="${esc(z('关闭', 'Close'))}">✕</button></div>${o.top ?? ''}
<div class="g-pv px-prev">${o.empty ? `<div class="g-em">${o.empty}</div>` : ''}</div>
<div class="g-seg" role="radiogroup">${(['story', 'post'] as const).map((f) => `<button type="button" role="radio" aria-checked="${o.fmt === f}" class="${o.fmt === f ? 'on' : ''}" ${a('fmt:' + f)}>${esc(f === 'story' ? z('竖版 9:16', 'Story 9:16') : z('方版 4:5', 'Post 4:5'))}</button>`).join('')}</div>
<p class="g-meta">${esc(o.meta)}</p>${o.extra ?? ''}
<div class="g-row"><button type="button" class="l4-b g-act" ${a('save')}${d}>⬇ ${esc(z('保存图片', 'Save image'))}</button><button type="button" class="l4-b g-act" ${a('share')}${d}>⤴ ${esc(z('分享', 'Share'))}</button></div>
<button type="button" class="l4-b g-act2" ${a('copy')}${d}>🔗 ${esc(z('复制链接', 'Copy link'))}</button><p class="g-st px-cp" aria-live="polite"></p></div>`;
}
type Nav = Navigator & { canShare?: (d: object) => boolean; share?: (d: object) => Promise<void> };
export function download(blob: Blob, url: string, name: string) { void blob; const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
/** the system share sheet with the picture; without it, the link is copied */
export async function shareOut(blob: Blob, name: string, link: string, text: string, st: HTMLElement | null, l: L) {
  const f = new File([blob], name, { type: 'image/png' }), nav = navigator as Nav;
  try { if (nav.canShare?.({ files: [f] }) && nav.share) { await nav.share({ files: [f], text, url: link }); return; } } catch { return; }
  await copyLink(link, st, l);
}
export async function copyLink(link: string, st: HTMLElement | null, l: L) {
  let ok = false; try { await navigator.clipboard.writeText(link); ok = true; } catch { /* no clipboard */ }
  if (st) st.textContent = ok ? `${tx(['已复制', 'Copied'], l)} · ${link}` : link;
}

/** a card's ⤴ 分享: the dialog over the card sheet; the QR and the link open the card's own page (/c/<id>.html) */
export async function cardShare(host: HTMLElement, l: L, id: string, c: Card) {
  host.querySelector('.g-modal')?.remove();
  const url = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}c/${id}.html?lang=${l}`;
  const D = await import('./draw'), d = cardData(l, id, c, url, tx(D.SITE_N, l));
  const m = document.createElement('div'); m.className = 'g-modal l4-shm'; host.appendChild(m);
  let fmt: 'story' | 'post' = 'story', blob: Blob | null = null, src = '', tok = 0;
  const close = () => { m.remove(); removeEventListener('keydown', key); if (src) URL.revokeObjectURL(src); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  const draw = async () => {
    const t = ++tok, [w, h] = fmt === 'story' ? [1080, 1920] : [1080, 1350];
    m.innerHTML = dlgHtml({ l, k: 'm', title: tx(['分享这张卡', 'Share this card'], l), fmt, meta: tx([`导出 ${w}×${h} 图片 · 扫码直达这张卡`, `Exports a ${w}×${h} image · the QR opens this card`], l) });
    m.querySelector<HTMLElement>('.g-x')?.focus({ preventScroll: true });
    const cv = D.draw(d, fmt), b = await D.png(cv); if (t !== tok || !m.isConnected) return;
    blob = b; if (src) URL.revokeObjectURL(src); src = URL.createObjectURL(b);
    const pv = m.querySelector<HTMLElement>('.g-pv')!;
    Object.assign(pv.dataset, { w: String(cv.width), h: String(cv.height), bytes: String(b.size), text: D.words(d), url, kind: 'card' });
    pv.innerHTML = `<img alt="${esc(c.n)}" src="${src}">`;
  };
  const name = () => `ai-explained-${id}-${fmt}.png`;
  m.addEventListener('click', (e) => {
    e.stopPropagation(); if (e.target === m) { close(); return; }
    const v = (e.target as HTMLElement).closest<HTMLElement>('[data-m]')?.dataset.m; if (!v) return; const st = m.querySelector<HTMLElement>('.g-st');
    if (v === 'close') close();
    else if (v.startsWith('fmt:')) { const f = v.slice(4) as 'story' | 'post'; if (f !== fmt) { fmt = f; void draw(); } }
    else if (v === 'save' && blob) download(blob, src, name());
    else if (v === 'share' && blob) void shareOut(blob, name(), url, `${d.name}: ${d.idea}`, st, l);
    else if (v === 'copy') void copyLink(url, st, l);
  });
  addEventListener('keydown', key); await draw();
}
