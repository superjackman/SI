/* ⤵ drill badges on diagram boxes — port of the live markSvg: a part that has its own, deeper station gets a
   round badge at its 🔍 spot (the spot the English fitter already keeps clear of labels). Tapping it drills down. */
import { KB, PATH } from '../../legacy/kb';
import type { Lang } from '../../i18n/types';
import { tx } from '../../i18n/L';

const NS = 'http://www.w3.org/2000/svg';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

export function markSvg(svg: SVGSVGElement, st: string, lang: Lang): void {
  svg.querySelectorAll('.dd-b').forEach((x) => x.remove());
  svg.querySelectorAll<SVGGElement>('g.comp[data-id]').forEach((g) => {
    const id = g.dataset.id ?? '';
    const c = Object.prototype.hasOwnProperty.call(KB.C, id) ? KB.C[id] : undefined;
    g.classList.remove('has-dd');
    let z: SVGTextElement | null = null;
    g.querySelectorAll<SVGTextElement>(':scope>text').forEach((t) => { if ((t.textContent ?? '').includes('🔍')) z = t; });
    const zt = z as SVGTextElement | null;
    if (!zt || !c || !c.zoom || !PATH[c.zoom]) return;
    zt.classList.add('zm-h');
    if (c.zoom === st) return;
    const fs = +(zt.getAttribute('font-size') ?? '') || parseFloat(getComputedStyle(zt).fontSize) || 13;
    const x = +(zt.getAttribute('x') ?? 0), y = +(zt.getAttribute('y') ?? 0);
    const r = +(fs * 0.58).toFixed(2), cx = x, cy = +(y - fs * 0.37).toFixed(2), k = r / 8;
    const lab = tx('nav.drillTo', lang) + (KB.TABN[c.zoom]?.[lang] ?? c.zoom);
    const p = (dx: number, dy: number) => (cx + dx * k).toFixed(2) + ' ' + (cy + dy * k).toFixed(2);
    const h = '<rect class="dd-hit" x="' + (cx - 13) + '" y="' + (cy - 13) + '" width="26" height="26" rx="13" fill="#000" fill-opacity="0" pointer-events="all"/>' +
      '<circle class="dd-c0" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
      '<path class="dd-ic" d="M' + p(-4, -3.4) + ' H' + (cx + 1.2 * k).toFixed(2) + ' V' + (cy + 3.6 * k).toFixed(2) + ' M' + p(-1.5, 1.3) + ' L' + p(1.2, 4) + ' L' + p(3.9, 1.3) + '"/>';
    const b = document.createElementNS(NS, 'g');
    b.setAttribute('class', 'dd-b'); b.setAttribute('data-dd', c.zoom); b.setAttribute('data-ddid', id);
    b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0'); b.setAttribute('aria-label', lab);
    b.innerHTML = '<title>' + esc(lab) + '</title>' + h;
    g.appendChild(b); g.classList.add('has-dd');
  });
}
export function markAll(root: ParentNode, st: string, lang: Lang): void {
  root.querySelectorAll<SVGSVGElement>('svg').forEach((s) => { if (s.querySelector('g.comp')) markSvg(s, st, lang); });
}
