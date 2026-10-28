/* R39: draws a page of layers 1, 2, 3 or 5 into the stage: the three.js (or SVG) diagram, then the DOM labels
   on top (≥ 12 px, never cut: short name → 12 px → tighter letters), the edge and frame labels and the panel,
   which shrinks its text (never below 12 px) until it fits without scrolling. */
import type { L, Tx } from '../l4/txt';
import { geo, type G } from './geo';
import { LX_SEL, layerOf } from './ids';
import type { LxStage } from './scene';
import type { LxPg } from './types';

export async function lxPage(id: string, l: L): Promise<LxPg> {
  const n = layerOf(id), m = n <= 2 ? await import('./p1') : n === 3 ? await import('./p3') : await import('./p5');
  return m.page(id, l);
}
let S: LxStage | null = null, stP: Promise<LxStage> | null = null, host: HTMLElement | null = null;
async function stage(stg: HTMLElement, flat: boolean, pick: (id: string) => void, root: HTMLElement): Promise<LxStage> {
  if (host !== stg) { S?.dispose(); S = null; stP = null; host = stg; }
  return (stP ??= (async () => {
    const m = flat ? null : await import('./scene');
    if (m && m.webgl()) { try { S = m.lxStage3d(stg, pick); root.dataset.lxgl = '3d'; return S; } catch { /* fall through */ } }
    const f = await import('./flat'); S = f.lxFlat(stg); root.dataset.lxgl = '2d'; return S;
  })());
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** shrink a box's text until it stops scrolling (12 px floor), then tighten the line height */
export function fit(e: HTMLElement, from = 12.5) {
  const over = () => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1;
  let f = from; e.style.fontSize = f + 'px';
  while (over() && f > 12) { f = Math.max(12, f - 0.25); e.style.fontSize = f + 'px'; }
  if (over()) e.style.lineHeight = '1.3'; if (over()) e.style.lineHeight = '1.2'; if (over()) e.dataset.tight = '1';
  return !over();
}

export async function lxDraw(root: HTMLElement, stg: HTMLElement, pg: LxPg, l: L, flat: boolean, pick: (id: string) => void): Promise<void> {
  stg.querySelectorAll(LX_SEL).forEach((e) => e.remove());
  const bb = stg.getBoundingClientRect(), W = Math.round(bb.width), H = Math.round(bb.height), T = (t: Tx) => t[l === 'zh' ? 0 : 1];
  const add = (cls: string, x: number, y: number, w: number | null, h: number | null, html: string, tag = 'div') => {
    const e = document.createElement(tag); e.className = cls; Object.assign(e.style, { left: x + 'px', top: y + 'px', ...(w != null ? { width: w + 'px' } : {}), ...(h != null ? { height: h + 'px' } : {}) });
    e.innerHTML = html; stg.appendChild(e); return e;
  };
  if (pg.mode === 'chart' || !pg.v) {
    const s = await stage(stg, flat, pick, root); s.el.style.display = 'none';
    const ch = add('l4-pn xl lx-pn lx-ch', 6, 4, W - 12, null, pg.chart ?? ''); ch.dataset.page = pg.id;
    const tp = add('l4-pn lx-pn', 6, 0, W - 12, null, pg.panel); tp.dataset.page = pg.id;
    /* the text keeps its natural height; the picture gets the rest and scales down as a whole (never below 0.6) */
    let max = Math.max(Math.round(H * 0.45), H - tp.offsetHeight - 14);
    /* short screens: the text first goes to its tightest readable setting, then the pictures shrink */
    if (ch.offsetHeight > max) { Object.assign(tp.style, { fontSize: '12px', lineHeight: '1.3' }); max = Math.max(Math.round(H * 0.45), H - tp.offsetHeight - 14); }
    const svs = [...ch.querySelectorAll<SVGSVGElement>('svg.lx-svg')], exs = [...ch.children].filter((e): e is HTMLElement => e instanceof HTMLElement && !e.querySelector('svg') && !!e.querySelector('table, .ib'));
    if (ch.offsetHeight > max && svs.length + exs.length) {
      const sh = [...svs, ...exs].reduce((a, v) => a + v.getBoundingClientRect().height, 0), k = Math.max(0.6, (sh - (ch.offsetHeight - max)) / sh);
      svs.forEach((v) => { v.style.width = v.getBoundingClientRect().width * k + 'px'; });
      exs.forEach((e) => { e.style.zoom = String(k); });
    }
    if (ch.offsetHeight > max && !root.dataset.cmp) { root.dataset.cmp = '1'; return lxDraw(root, stg, pg, l, flat, pick); } /* last resort: a tighter info box gives the stage more room */
    if (ch.offsetHeight > max) { ch.style.height = max + 'px'; fit(ch); }
    const y = Math.min(Math.round(ch.offsetHeight), max) + 10;
    tp.style.top = y + 'px'; /* the text box hugs its text; it only gets a fixed height (and fitting) when room is short */
    if (tp.offsetHeight > H - y - 4) { tp.style.height = H - y - 4 + 'px'; fit(tp); }
    return;
  }
  const draw = (k: number) => drawK(stg, pg, W, H, k, T, add);
  const clear = () => stg.querySelectorAll(LX_SEL).forEach((e) => e.remove());
  let k = 1, r = draw(1);
  while (!r.ok && k > 0.75) { const r2 = (clear(), draw(k - 0.06)); if (r2.tight && !r.tight) { clear(); r = draw(k); break; } k -= 0.06; r = r2; }
  if (!r.ok) stg.querySelectorAll<HTMLElement>('.lx-pn[data-tight]').forEach((e) => { e.style.overflowY = 'auto'; });
  const g = r.g;
  const s = await stage(stg, flat, pick, root); s.el.style.display = ''; s.set(g);
}
function drawK(stg: HTMLElement, pg: LxPg, W: number, H: number, k: number, T: (t: Tx) => string, add: (cls: string, x: number, y: number, w: number | null, h: number | null, html: string, tag?: string) => HTMLElement): { g: G; ok: boolean; tight: boolean } {
  const g: G = geo(pg.v!, W, H, pg.mode, pg.px ?? 170, k), D = pg.v!.dia; let tight = false, ok = true; void stg;
  for (const n of g.nodes) {
    const d = D.nodes.find((q) => q.id === n.id)!, two = !!d.s || !!d.lines;
    const html = d.lines ? d.lines.map((t, i) => `<span class="${i ? 's' : 't'}">${esc(T(t))}</span>`).join('') : `<span class="t">${esc(T(d.t))}</span>${d.s ? `<span class="s">${esc(T(d.s))}</span>` : ''}`;
    const st = d.tag ? 'tag' : n.st, e = add(`l4-lb lx-lb st-${st}${n.plus ? ' plus' : ''}${two ? ' two' : ''}${d.pill ? ' pill' : ''}`, n.x, n.y, n.w, n.h, html + (n.plus ? `<i aria-hidden="true">${d.minus ? '−' : '+'}</i>` : ''), 'button');
    (e as HTMLButtonElement).type = 'button'; e.dataset.lx = n.id; e.setAttribute('aria-label', T(d.t) + (d.s ? ' ' + T(d.s) : '') + (n.plus ? ' +' : ''));
    if (d.tag) e.style.setProperty('--tc', d.tag);
    if (n.plus) e.setAttribute('aria-expanded', String(n.st === 'sel'));
    if (n.h * 1 < 22) e.style.fontSize = '12px';
    e.querySelectorAll<HTMLElement>('.t,.s').forEach((t, i) => {
      const over = () => t.scrollWidth > t.clientWidth + 0.5;
      if (over()) t.style.fontSize = '12px'; if (over()) t.style.letterSpacing = '-0.04em';
      if (over() && i === 0 && d.ts) { t.textContent = T(d.ts); t.style.letterSpacing = ''; if (over()) t.style.letterSpacing = '-0.04em'; }
      if (over()) { e.dataset.tight = '1'; tight = true; }
    });
  }
  for (const f of D.frames) {
    const gf = g.frames.find((q) => q.id === f.id)!, on = gf.st === 'lit' || gf.st === 'sel', go = pg.go[f.id];
    const e = add(`lx-fl${on ? ' on' : ''}${f.tl ? '' : ' c'}`, f.tl ? gf.x + (f.tl === 2 ? 4 : 8) : gf.x, gf.y + 2, f.tl ? null : gf.w, null, esc(T(f.t)), go ? 'button' : 'div');
    if (go) { (e as HTMLButtonElement).type = 'button'; e.dataset.lx = f.id; }
    if (e.scrollHeight > e.clientHeight + 1) e.style.lineHeight = e.scrollHeight + 'px'; /* a fallback glyph (×) can sit taller than the line */
    if (f.tl && e.offsetWidth > gf.w - 8) { if (f.ts) e.textContent = T(f.ts); if (e.offsetWidth > gf.w - 8) e.style.letterSpacing = '-0.06em'; }
  }
  for (const b of g.labels) {
    const e = add(`lx-el st-${b.st}${b.c ? ' ' + b.c : ''}${b.v ? ' v' : ''}`, b.x, b.y, null, null, esc(T(b.t)));
    e.style.transform = b.v ? 'translate(-50%, -50%)' : `translate(${b.a === 'start' ? 0 : b.a === 'end' ? -100 : -50}%, -78%)`;
  }
  if (g.panel) {
    const P = g.panel, e = add(`l4-pn lx-pn${pg.xl ? ' xl' : ''}`, P.x, P.y, P.w, P.h, pg.panel); e.dataset.page = pg.id;
    if (pg.mode === 'full') { e.style.height = 'auto'; e.style.maxHeight = `${P.h}px`; }
    ok = fit(e);
  }
  return { g, ok, tight };
}
