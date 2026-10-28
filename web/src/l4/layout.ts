/* R38: where everything sits on the L4 stage, in CSS px (y down). Pure, so it is unit-tested and shared by the
   three.js scene, the 2D fallback and the DOM labels. Modes: full (the whole diagram, centred), left (diagram on the
   left, a step panel on the right), xl (diagram squeezed further left, a glowing connector into the drill panel). */
import { NODES, type Nd } from './txt';

export type Mode = 'full' | 'left' | 'xl';
export type St = 'calm' | 'lit' | 'pass' | 'dim' | 'back' | 'sel';
export interface Rect { x: number; y: number; w: number; h: number }
export interface Lay {
  W: number; H: number; mode: Mode; bh: number; g: number; cx: number; x1: number; x2: number; xR: number;
  box: Record<Nd, Rect>; frame: Rect; panel: Rect | null;
  /** up-arrows between neighbours: from the top of `lo` to the bottom of `hi` */
  arrows: { lo: Nd; hi: Nd; x: number; y1: number; y2: number }[];
  /** the two residual lanes (polylines, last point = arrow head into the box's right edge) */
  res: [number, number][][];
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function layout(W: number, H: number, mode: Mode): Lay {
  /* vertical: 10 boxes, 9 gaps, the frame's label strip (18) and bottom pad (6) */
  const u = (H - 12 - 24) / (10 + 9 * 0.42);
  let bh = clamp(u, 22, 34), g = clamp(u * 0.42, 8, 16);
  if (10 * bh + 9 * g + 24 > H - 12) { g = 6; bh = Math.max(18, (H - 12 - 24 - 9 * g) / 10); }
  bh = Math.round(bh); g = Math.round(g);
  const total = 10 * bh + 9 * g + 24, y0 = Math.round(6 + Math.max(0, (H - 12 - total) / 2));
  let x1: number, x2: number, xR: number, fx1: number, fx2: number, panel: Rect | null = null;
  if (mode === 'full') {
    const bw = Math.round(Math.min(220, W * 0.6)); x1 = Math.round((W - bw) / 2 - 10); x2 = x1 + bw; xR = x2 + 18; fx1 = x1 - 16; fx2 = xR + 26;
  } else if (mode === 'left') {
    x1 = 10; x2 = Math.round(W * 0.42); xR = x2 + 12; fx1 = 4; fx2 = xR + 10;
    panel = { x: fx2 + 10, y: 6, w: W - 6 - (fx2 + 10), h: H - 12 };
  } else {
    x1 = 6; x2 = Math.round(W * 0.385); xR = x2 + 10; fx1 = 2; fx2 = xR + 9;
    panel = { x: fx2 + 22, y: 6, w: W - 6 - (fx2 + 22), h: H - 12 };
  }
  const box = {} as Record<Nd, Rect>; let y = y0, ftop = 0, fbot = 0;
  for (const b of [...NODES].reverse()) {
    if (b === 'an2') { ftop = y; y += 18; }
    box[b] = { x: x1, y, w: x2 - x1, h: bh }; y += bh;
    if (b === 'att') { y += 6; fbot = y; }
    y += g;
  }
  const cx = (x1 + x2) / 2;
  const arrows = NODES.slice(0, -1).map((lo, i) => { const hi = NODES[i + 1]!; return { lo, hi, x: cx, y1: box[lo].y, y2: box[hi].y + bh }; });
  const mid = (b: Nd) => box[b].y + bh / 2;
  const lane = (yb: number, ty: number): [number, number][] => [[cx, yb], [xR, yb], [xR, ty], [x2, ty]];
  const res = [lane(box.att.y + bh + 3.5, mid('an1')), lane((box.an1.y + box.ffn.y + bh) / 2, mid('an2'))];
  return { W, H, mode, bh, g, cx, x1, x2, xR, box, frame: { x: fx1, y: ftop, w: fx2 - fx1, h: fbot - ftop }, panel, arrows, res };
}

/** everything a renderer needs for one screen */
export interface Desc {
  lay: Lay; st: Record<Nd, St>; back: boolean; resOn: boolean; frameLit: boolean; sel: Nd | null;
  /** travelling light from the bottom of `a` to the top of `b` (or back down when `back`) */
  flow: { a: Nd; b: Nd; back?: boolean } | null;
}
/** the centre-line path from the bottom of `a` up to the top of `b` */
export function flowPath(L: Lay, a: Nd, b: Nd): [number, number][] {
  const ia = NODES.indexOf(a), ib = NODES.indexOf(b), lo = Math.min(ia, ib), hi = Math.max(ia, ib);
  return [[L.cx, L.box[NODES[lo]!].y + L.bh], [L.cx, L.box[NODES[hi]!].y]];
}
/** state map helpers */
export const all = (s: St): Record<Nd, St> => Object.fromEntries(NODES.map((n) => [n, s])) as Record<Nd, St>;
export function litUpto(b: Nd): Record<Nd, St> {
  const k = NODES.indexOf(b); return Object.fromEntries(NODES.map((n, i) => [n, i < k ? 'pass' : i === k ? 'lit' : 'dim'])) as Record<Nd, St>;
}
export const STY: Record<St, { fill: string; stroke: string; text: string; glow: number }> = {
  calm: { fill: '#0c1a3d', stroke: '#3f6fff', text: '#e6eeff', glow: 0.25 },
  lit: { fill: '#1c3f9e', stroke: '#9cc8ff', text: '#ffffff', glow: 0.85 },
  pass: { fill: '#0f2250', stroke: '#5a86e0', text: '#d6e4ff', glow: 0.18 },
  dim: { fill: '#091026', stroke: '#2c3e6a', text: '#93a3c8', glow: 0 },
  back: { fill: '#3b1f0a', stroke: '#ff9a3c', text: '#ffe6cc', glow: 0.7 },
  sel: { fill: '#2350c8', stroke: '#d6ecff', text: '#ffffff', glow: 1 },
};
