/* shared building blocks for the K (math) stations: the stacked diagram, proofs, worked examples */
import { arrow, comp, Page, svgOpen, type T } from '../../lib';

type Col = 'c' | 'l' | 'r' | 'w' | 'a' | 'b' | 'e';
export interface KBox { id: string; col: Col; t: string; s?: string[] }
const GEO: Record<Col, [number, number]> = { c: [95, 190], l: [3, 182], r: [195, 182], w: [40, 300], a: [3, 120], b: [130, 120], e: [257, 120] };
const GAP = 26;

/** rows of tappable boxes, top to bottom; arrows only join adjacent rows (vertical, or one elbow in the gap) so no line crosses a box */
export function kDiagram(P: Page, sid: string, rows: { h: number; boxes: KBox[] }[], links: [string, string][], cat: (id: string) => string) {
  const pos: Record<string, { x: number; y: number; w: number; h: number; row: number }> = {};
  let y = 6;
  rows.forEach((r, i) => { for (const b of r.boxes) { const [x, w] = GEO[b.col]; pos[b.id] = { x, y, w, h: r.h, row: i }; } y += r.h + GAP; });
  const H = y - GAP + 6;
  let s = svgOpen(sid, H);
  const outN: Record<string, number> = {};
  for (const [a, b] of links) {
    const A = pos[a], B = pos[b];
    if (!A || !B) throw new Error(`kDiagram ${sid}: unknown box ${a}→${b}`);
    if (B.row !== A.row + 1) throw new Error(`kDiagram ${sid}: ${a}→${b} must join adjacent rows`);
    outN[a] = (outN[a] ?? 0) + 1;
  }
  for (const [a, b] of links) {
    const A = pos[a]!, B = pos[b]!;
    const acx = A.x + A.w / 2, bcx = B.x + B.w / 2;
    const off = outN[a]! > 1 ? Math.max(-A.w / 4, Math.min(A.w / 4, bcx - acx)) : (Math.abs(bcx - acx) < A.w / 2 ? bcx - acx : 0);
    const sx = acx + off, y1 = A.y + A.h, y2 = B.y - 4, mid = y1 + GAP / 2;
    s += arrow(sid, Math.abs(sx - bcx) < 1 ? `M${sx} ${y1} V${y2}` : `M${sx} ${y1} V${mid} H${bcx} V${y2}`);
  }
  for (const r of rows) for (const b of r.boxes) { const p = pos[b.id]!; s += comp({ id: b.id, x: p.x, y: p.y, w: p.w, h: p.h, t: b.t, s: b.s ?? [], cat: cat(b.id), fs: 15 }, P.L, P.name(b.id)); }
  return s + '</svg>';
}
export const kLegend = (t: T): [string, string, string][] => [['#b45309', '#fef3c7', t('数学', 'Math')], ['#4338ca', '#e0e7ff', t('模型里用到它的地方', 'Where the model uses it')]];

/** a step-by-step proof: each step is [statement, reason] */
export function proof(P: Page, title: string, steps: [string, string][], end = true) {
  const t = P.t;
  return `<div class="pf"><p class="pf-h">📝 ${title}</p><ol class="pf-s">${steps.map(([s, why]) => `<li><div class="pf-st">${s}</div>${why ? `<div class="pf-why">${t('理由：', 'Why: ')}${why}</div>` : ''}</li>`).join('')}</ol>${end ? `<p class="pf-end">${t('证毕', 'Q.E.D.')} ∎</p>` : ''}</div>`;
}
/** a worked example; demo=true marks illustrative numbers with the 示意 tag */
/** a worked example; `title` is HTML (it may hold inline math from m()), so it is not escaped */
export const ex = (P: Page, title: string, body: string, demo = false) => `<div class="kex"><p class="kex-h">✏️ ${title}${demo ? ' ' + P.tag() : ''}</p>${body}</div>`;
