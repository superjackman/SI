/* R13: geometry checks for a generated diagram svg (used by m2/build.ts, which refuses to write a bad diagram, and by
   the unit tests): boxes do not overlap, no line passes through a box it does not start or end at, no two lines cross,
   free labels stay inside the picture and off boxes and lines, and (Chinese) box labels fit inside their box and clear
   of the 🔍 drill spot. Text widths are estimated (textW); the browser test re-checks with real fonts. */
import { textW } from './content/t1dg';

export interface R { x: number; y: number; w: number; h: number }
export interface Box extends R { id: string; badge?: R; lines: { s: string; x: number; y: number; fs: number; bold: boolean }[]; zoom?: { x: number; y: number } }
export interface Seg { x1: number; y1: number; x2: number; y2: number; e: number; from?: string | undefined; to?: string | undefined }
export interface Lab { s: string; x: number; y: number; fs: number; anchor: string }
const num = (s: string | undefined) => +(s ?? 'NaN');
const attr = (tag: string, a: string) => new RegExp(`\\s${a}="([^"]*)"`).exec(tag)?.[1];
const unesc = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

export function parse(svg: string) {
  const vb = (attr(svg.slice(0, 300), 'viewBox') ?? '').split(' ').map(Number);
  const boxes: Box[] = [], segs: Seg[] = [], labs: Lab[] = [];
  const comps = [...svg.matchAll(/<g class="comp[^"]*" data-id="([^"]+)"[^>]*>([\s\S]*?)<\/g>(?=<g class="comp|<text|<\/svg>|$)/g)];
  let rest = svg;
  for (const m of comps) {
    const body = m[2] as string, r = /<rect class="main"[^>]*>/.exec(body)?.[0] ?? '';
    const bx: Box = { id: m[1] as string, x: num(attr(r, 'x')), y: num(attr(r, 'y')), w: num(attr(r, 'width')), h: num(attr(r, 'height')), lines: [] };
    for (const t of body.split(/<g class="badge/)[0]!.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)) {
      const tag = t[1] as string, s = unesc(t[2] as string);
      if (s.includes('🔍')) { bx.zoom = { x: num(attr(tag, 'x')), y: num(attr(tag, 'y')) }; continue; }
      const st = /font-size:([\d.]+)px/.exec(tag)?.[1], isT = /class="t"/.test(tag);
      bx.lines.push({ s, x: num(attr(tag, 'x')), y: num(attr(tag, 'y')), fs: st ? +st : isT ? 17 : 12.5, bold: isT });
    }
    const bt = /<g class="badge b-train"><rect([^>]*)>/.exec(body)?.[1];
    if (bt) bx.badge = { x: num(attr(bt, 'x')), y: num(attr(bt, 'y')), w: num(attr(bt, 'width')), h: num(attr(bt, 'height')) };
    boxes.push(bx);
    rest = rest.replace(m[0], '');
  }
  let e = 0;
  for (const p of rest.matchAll(/<path class="arrow[^"]*"([^>]*)>/g)) {
    const tag = p[1] as string, d = attr(tag, 'd') ?? '', from = attr(tag, 'data-from'), to = attr(tag, 'data-to');
    let x = 0, y = 0;
    for (const c of d.matchAll(/([MHVL])\s*([\d.\-]+)(?:\s+([\d.\-]+))?/g)) {
      const k = c[1], a = +(c[2] as string), bb = c[3] !== undefined ? +(c[3] as string) : NaN;
      const nx = k === 'H' ? a : k === 'V' ? x : a, ny = k === 'H' ? y : k === 'V' ? a : bb;
      if (k !== 'M') segs.push({ x1: x, y1: y, x2: nx, y2: ny, e, from, to });
      x = nx; y = ny;
    }
    e++;
  }
  for (const t of rest.matchAll(/<text class="(?:lbl|elab)"([^>]*)>([^<]*)<\/text>/g)) {
    const tag = t[1] as string;
    labs.push({ s: unesc(t[2] as string), x: num(attr(tag, 'x')), y: num(attr(tag, 'y')), fs: num(attr(tag, 'font-size')), anchor: attr(tag, 'text-anchor') ?? 'start' });
  }
  return { W: vb[2] ?? 0, H: vb[3] ?? 0, boxes, segs, labs };
}

const hit = (a: R, b: R, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
const segBox = (s: Seg, r: R) => { const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2); return hit({ x, y, w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1) }, r); };
const shrink = (r: R, k: number): R => ({ x: r.x + k, y: r.y + k, w: r.w - 2 * k, h: r.h - 2 * k });
const labR = (l: Lab): R => { const w = textW(l.s, l.fs), x = l.anchor === 'middle' ? l.x - w / 2 : l.anchor === 'end' ? l.x - w : l.x; return { x, y: l.y - l.fs * 0.85, w, h: l.fs * 1.1 }; };
function cross(a: Seg, b: Seg) {
  const av = a.x1 === a.x2, bv = b.x1 === b.x2;
  if (av === bv) { // parallel: overlapping collinear segments count as crossing
    if (av) return a.x1 === b.x1 && Math.max(Math.min(a.y1, a.y2), Math.min(b.y1, b.y2)) < Math.min(Math.max(a.y1, a.y2), Math.max(b.y1, b.y2));
    return a.y1 === b.y1 && Math.max(Math.min(a.x1, a.x2), Math.min(b.x1, b.x2)) < Math.min(Math.max(a.x1, a.x2), Math.max(b.x1, b.x2));
  }
  const v = av ? a : b, h = av ? b : a;
  return v.x1 >= Math.min(h.x1, h.x2) && v.x1 <= Math.max(h.x1, h.x2) && h.y1 >= Math.min(v.y1, v.y2) && h.y1 <= Math.max(v.y1, v.y2);
}

/** returns a list of problems (empty = clean); textFit checks box labels by estimate (Chinese; English is fitted at run time) */
export function check(svg: string, textFit: boolean): string[] {
  const { W, H, boxes, segs, labs } = parse(svg), bad: string[] = [];
  boxes.forEach((a, i) => boxes.slice(i + 1).forEach((c) => { if (hit(a, c, 3)) bad.push(`boxes overlap: ${a.id} / ${c.id}`); }));
  for (const bx of boxes) if (bx.x < 0 || bx.y < 0 || bx.x + bx.w > W || bx.y + bx.h > H) bad.push('box outside the picture: ' + bx.id);
  for (const s of segs) for (const bx of boxes) {
    const end = bx.id === s.from || bx.id === s.to;
    if (segBox(s, end ? shrink(bx, 1.5) : shrink(bx, -1))) bad.push(`line ${s.from ?? '(gap)'}→${s.to ?? ''} passes through ${bx.id}`);
  }
  segs.forEach((a, i) => segs.slice(i + 1).forEach((c) => { if (a.e !== c.e && cross(a, c)) bad.push(`lines cross: ${a.from ?? 'gap'}→${a.to ?? ''} / ${c.from ?? 'gap'}→${c.to ?? ''}`); }));
  for (const l of labs) {
    const r = labR(l);
    if (r.x < 1 || r.x + r.w > W - 1 || r.y < 0 || r.y + r.h > H) bad.push('label leaves the picture: ' + l.s);
    for (const bx of boxes) if (hit(r, bx)) bad.push(`label "${l.s}" covers box ${bx.id}`);
    for (const s of segs) if (segBox(s, shrink(r, 0.5))) bad.push(`label "${l.s}" sits on a line`);
  }
  for (const bx of boxes) if (bx.badge) {
    for (const o of boxes) if (o !== bx && hit(bx.badge, o)) bad.push(`badge of ${bx.id} covers box ${o.id}`);
    for (const l of labs) if (hit(bx.badge, labR(l))) bad.push(`badge of ${bx.id} covers label "${l.s}"`);
  }
  labs.forEach((a, i) => labs.slice(i + 1).forEach((c) => { if (hit(labR(a), labR(c))) bad.push(`labels overlap: ${a.s} / ${c.s}`); }));
  if (textFit) for (const bx of boxes) {
    const zr: R | null = bx.zoom ? { x: bx.zoom.x - 13 * 0.7, y: bx.zoom.y - 13 * 0.95, w: 13 * 1.4, h: 13 * 1.15 } : null;
    for (const t of bx.lines) {
      const w = textW(t.s, t.fs, t.bold), r: R = { x: t.x - w / 2, y: t.y - t.fs * 0.8, w, h: t.fs * 1.02 };
      if (r.x < bx.x + 6 || r.x + r.w > bx.x + bx.w - 6 || r.y < bx.y + 3 || r.y + r.h > bx.y + bx.h - 3) bad.push(`text "${t.s}" does not fit box ${bx.id}`);
      if (zr && hit(r, zr)) bad.push(`text "${t.s}" touches the 🔍 spot of ${bx.id}`);
    }
  }
  return bad;
}
