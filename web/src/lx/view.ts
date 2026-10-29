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

/** the scale at which this picture's smallest label is just 12 px, relative to its current size */
function svgFloor(v: SVGSVGElement): number {
  const w = v.getBoundingClientRect().width, vb = v.viewBox.baseVal, fs = Math.min(...[...v.querySelectorAll('text')].map((t) => parseFloat(getComputedStyle(t).fontSize)));
  return vb && vb.width && w && isFinite(fs) ? 12.05 * vb.width / (fs * w) : 0.6;
}
/** whatever the final size, no label of this picture is drawn under 12 px */
export function svgMin12(v: SVGSVGElement): void {
  const m = v.getScreenCTM(), s = m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 1; if (!s) return;
  v.querySelectorAll<SVGTextElement>('text').forEach((t) => { const f = parseFloat(getComputedStyle(t).fontSize); if (f * s < 12) t.style.fontSize = (12.05 / s).toFixed(2) + 'px'; });
}

export async function lxDraw(root: HTMLElement, stg: HTMLElement, pg: LxPg, l: L, flat: boolean, pick: (id: string) => void): Promise<void> {
  stg.querySelectorAll(LX_SEL).forEach((e) => e.remove()); delete stg.dataset.scr; stg.scrollTop = 0;
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
    /* R42b: pictures shrink only while their smallest label stays at 12 px or more (tables and boxes never shrink: their text is 12 px already) */
    if (ch.offsetHeight > max && svs.length) {
      const sh = svs.reduce((a, v) => a + v.getBoundingClientRect().height, 0), fl = Math.min(1, Math.max(0.6, ...svs.map(svgFloor)));
      const k = Math.max(fl, (sh - (ch.offsetHeight - max)) / sh);
      if (k < 1) svs.forEach((v) => { v.style.width = v.getBoundingClientRect().width * k + 'px'; });
    }
    svs.forEach(svgMin12);
    if (ch.offsetHeight > max && !root.dataset.cmp) { root.dataset.cmp = '1'; return lxDraw(root, stg, pg, l, flat, pick); } /* a tighter info box gives the stage more room */
    void exs;
    const y = Math.round(ch.offsetHeight) + 10;
    tp.style.top = y + 'px';
    /* still too tall: nothing gets squeezed below 12 px — the stage scrolls instead (picture first, text under it) */
    if (y + tp.offsetHeight > H - 4) { stg.dataset.scr = '1'; add('lx-pn lx-sp', 0, y + tp.offsetHeight, 1, 8, ''); }
    return;
  }
  let Hd = H; const draw = (k: number, dy = 0) => drawK(stg, pg, W, Hd, k, T, add, dy);
  const clear = () => stg.querySelectorAll(LX_SEL).forEach((e) => e.remove());
  let k = 1, r = draw(1);
  /* R42b: a box too small for its 12 px text first gets a tighter info box, then a taller, scrolling stage — never clipped or squeezed labels */
  if (cramped(stg) && !root.dataset.cmp) { root.dataset.cmp = '1'; return lxDraw(root, stg, pg, l, flat, pick); }
  for (let i = 0; i < 12 && cramped(stg); i++) { const w0 = r.g.nodes[0]?.w; const H0 = Hd; Hd = Math.round(Hd * 1.08); clear(); r = draw(1); if (r.g.nodes[0]?.w === w0) { Hd = H0; clear(); r = draw(1); break; } }
  while (!r.ok && k > 0.75 && Hd === H) { const r2 = (clear(), draw(k - 0.06)); if ((r2.tight && !r.tight) || cramped(stg)) { clear(); r = draw(k); break; } k -= 0.06; r = r2; }
  /* R42b: text still too long for its box — a taller, scrolling stage rather than a box that scrolls inside */
  for (let i = 0; i < 6 && !r.ok; i++) { Hd = Math.round(Hd * 1.06); clear(); r = draw(k); }
  if (Hd > H) { stg.dataset.scr = '1'; add('lx-pn lx-sp', 0, Hd, 1, 4, ''); }
  if (!r.ok) stg.querySelectorAll<HTMLElement>('.lx-pn[data-tight]').forEach((e) => { e.style.overflowY = 'auto'; });
  /* R42 L*-0: the overview panel hugs its text, so the slack it leaves goes half above and half below the diagram
     and the panel sits on the bottom edge, right over the info box (no dead gap) */
  if (pg.mode === 'full' && r.g.panel && r.ok) {
    const pe = stg.querySelector<HTMLElement>('.lx-pn'), slack = pe ? r.g.panel.h - pe.offsetHeight : 0;
    if (slack > 8) { clear(); const r2 = draw(k, Math.round(slack / 2)); const p2 = stg.querySelector<HTMLElement>('.lx-pn');
      if (r2.ok && p2) { r = r2; p2.style.top = Math.round(Hd - 4 - p2.offsetHeight) + 'px'; } else { clear(); r = draw(k); } }
  }
  const g = r.g;
  const s = await stage(stg, flat, pick, root); s.el.style.display = ''; s.set(g);
}
/** a diagram label whose 12 px text no longer fits its box (too short or too narrow) */
function cramped(stg: HTMLElement): boolean {
  return [...stg.querySelectorAll<HTMLElement>('.lx-lb')].some((e) => {
    const sp = [...e.querySelectorAll<HTMLElement>('.t,.s')], need = e.classList.contains('two') ? sp.reduce((a, t) => a + t.offsetHeight, 0) : Math.max(0, ...sp.map((t) => t.offsetHeight));
    return need > e.clientHeight + 1 || sp.some((t) => t.scrollWidth > t.clientWidth + 0.5);
  }) || !!stg.querySelector('.lx-fl[data-over]') || clash(stg);
}
/** two diagram texts (box, frame title, edge label) drawn over each other */
function clash(stg: HTMLElement): boolean {
  const ink = (e: HTMLElement) => { if (e.classList.contains('lx-lb')) return e.getBoundingClientRect(); const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect(); };
  const R = [...stg.querySelectorAll<HTMLElement>('.lx-lb,.lx-fl,.lx-el')].map(ink);
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
    const a = R[i]!, b = R[j]!; if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) return true;
  }
  return false;
}
function drawK(stg: HTMLElement, pg: LxPg, W: number, H: number, k: number, T: (t: Tx) => string, add: (cls: string, x: number, y: number, w: number | null, h: number | null, html: string, tag?: string) => HTMLElement, dy = 0): { g: G; ok: boolean; tight: boolean } {
  const g: G = geo(pg.v!, W, H, pg.mode, pg.px ?? 170, k, dy), D = pg.v!.dia; let tight = false, ok = true; void stg;
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
    if (f.tl && e.offsetWidth > gf.w - 14) { if (f.ts) e.textContent = T(f.ts); if (e.offsetWidth > gf.w - 14) e.style.letterSpacing = '-0.06em'; if (e.offsetWidth > gf.w - 4) e.dataset.over = '1'; }
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
