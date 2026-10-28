/* R39: the generic diagram engine shared by layers 1, 2, 3 and 5. A diagram is boxes, frames, arrows (SVG path
   strings, absolute M/L/H/V/C/Q) and small labels in 360-wide design units; this file turns one into screen
   geometry for a stage of W × H px. Pure, so it is unit-tested and shared by the three.js stage, the SVG fallback
   and the DOM labels. */
import type { Tx } from '../l4/txt';

export type St = 'calm' | 'lit' | 'pass' | 'dim' | 'sel' | 'or' | 'gold';
export interface DNode {
  id: string; x: number; y: number; w: number; h: number; t: Tx; s?: Tx; ts?: Tx;
  /** "+" = opens in place; pill = rounded status chip; tag = a coloured maths chip (L5) */
  plus?: boolean; pill?: boolean; tag?: string; go?: string; lines?: Tx[];
  /** an opened "+" box shows "−" */
  minus?: boolean;
}
export interface DEdge { id: string; d: string; dash?: boolean; head?: boolean; gold?: boolean }
export interface DLabel { x: number; y: number; t: Tx; a?: 'start' | 'middle' | 'end'; e?: string; v?: boolean; c?: string }
export interface DFrame { id: string; x: number; y: number; w: number; h: number; t: Tx; ts?: Tx; tl?: boolean | 2 }
export interface Dia { x0: number; y0: number; x1: number; y1: number; nodes: DNode[]; edges: DEdge[]; labels: DLabel[]; frames: DFrame[] }
export interface View {
  dia: Dia; st?: Record<string, St>; def?: St; est?: Record<string, St>; edef?: St;
  /** a glowing connector from this node into the panel (the box that was opened in place) */
  conn?: string; flow?: string[]; tagH?: number;
  /** full mode without a panel under the diagram (the overview of layer 3) */
  np?: boolean;
}
export type Mode = 'full' | 'left' | 'chart';
export interface Rect { x: number; y: number; w: number; h: number }
export interface GNode extends Rect { id: string; st: St; r: number; plus: boolean; tag?: string | undefined }
export interface GEdge { id: string; pts: [number, number][]; st: St; dash: boolean; head: boolean; gold: boolean }
export interface GFrame extends Rect { id: string; st: St }
export interface G {
  W: number; H: number; s: number; nodes: GNode[]; edges: GEdge[]; frames: GFrame[]; panel: Rect | null;
  conn: { x1: number; x2: number; y: number } | null; flow: [number, number][][];
  labels: { x: number; y: number; t: Tx; a: 'start' | 'middle' | 'end'; st: St; v: boolean; c?: string | undefined }[];
}

/* ---------- SVG path → points ---------- */
export function sample(d: string, step = 4): [number, number][] {
  const tk = d.match(/[MLHVCQZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []; const out: [number, number][] = [];
  let i = 0, x = 0, y = 0, cmd = '';
  const num = () => Number(tk[i++]);
  const push = (px: number, py: number) => { out.push([px, py]); x = px; y = py; };
  while (i < tk.length) {
    if (/[A-Za-z]/.test(tk[i]!)) cmd = tk[i++]!.toUpperCase();
    if (cmd === 'M') { push(num(), num()); cmd = 'L'; }
    else if (cmd === 'L') push(num(), num());
    else if (cmd === 'H') push(num(), y);
    else if (cmd === 'V') push(x, num());
    else if (cmd === 'C' || cmd === 'Q') {
      const p = cmd === 'C' ? [num(), num(), num(), num(), num(), num()] : [num(), num(), num(), num()];
      const [x0, y0] = [x, y], ex = p[p.length - 2]!, ey = p[p.length - 1]!;
      const n = Math.max(4, Math.ceil(Math.hypot(ex - x0, ey - y0) / step));
      for (let k = 1; k <= n; k++) {
        const t = k / n, u = 1 - t;
        if (cmd === 'C') push(u * u * u * x0 + 3 * u * u * t * p[0]! + 3 * u * t * t * p[2]! + t * t * t * ex, u * u * u * y0 + 3 * u * u * t * p[1]! + 3 * u * t * t * p[3]! + t * t * t * ey);
        else push(u * u * x0 + 2 * u * t * p[0]! + t * t * ex, u * u * y0 + 2 * u * t * p[1]! + t * t * ey);
      }
    } else if (cmd === 'Z') { if (out.length) push(out[0]![0], out[0]![1]); }
    else i++;
  }
  return out;
}

/** edge state defaults like the reference drawings: calm/pass pages keep arrows calm, lit pages dim the rest */
const edgeDef = (v: View): St => v.edef ?? (!v.def || v.def === 'calm' || v.def === 'pass' ? v.def ?? 'calm' : 'dim');

/** k < 1 shrinks the diagram to give the panel more room */
export function geo(v: View, W: number, H: number, mode: Mode, px = 170, k = 1): G {
  const D = v.dia, dw = D.x1 - D.x0, dh = D.y1 - D.y0;
  const s0 = mode === 'full' ? Math.min(W / 360, (H - (v.np ? 6 : 120)) / dh, 1.2) : Math.min(W / 360, (H - 6) / dh, 1.2), s = s0 * k;
  const ox = mode === 'full' ? (W - dw * s) / 2 - D.x0 * s : 4 - D.x0 * s, oy = 4 - D.y0 * s;
  const X = (x: number) => ox + x * s, Y = (y: number) => oy + y * s, def = v.def ?? 'calm', ed = edgeDef(v);
  const nodes: GNode[] = D.nodes.map((n) => ({ id: n.id, x: X(n.x), y: Y(n.y), w: n.w * s, h: n.h * s, st: v.st?.[n.id] ?? (n.tag ? 'calm' : def), r: n.pill || n.tag ? (n.h * s) / 2 : Math.min(8, (n.h * s) / 2.4), plus: !!n.plus, tag: n.tag }));
  const edges: GEdge[] = D.edges.map((e) => ({ id: e.id, pts: sample(e.d).map(([a, b]) => [X(a), Y(b)] as [number, number]), st: v.est?.[e.id] ?? ed, dash: !!e.dash, head: e.head !== false, gold: !!e.gold }));
  const frames: GFrame[] = D.frames.map((f) => ({ id: f.id, x: X(f.x), y: Y(f.y), w: f.w * s, h: f.h * s, st: v.st?.[f.id] ?? (def === 'dim' ? 'dim' : 'calm') }));
  const labels = D.labels.map((l) => ({ x: X(l.x), y: Y(l.y), t: l.t, a: l.a ?? 'middle', st: l.e ? v.est?.[l.e] ?? ed : ed, v: !!l.v, c: l.c }));
  const bottom = Y(D.y1);
  let panel: Rect | null = null;
  if (mode === 'full' && !v.np) { const w = Math.min(W - 12, 344 * s0); panel = { x: Math.max(6, (W - w) / 2), y: bottom + 6, w, h: H - bottom - 10 }; }
  else if (mode === 'left') { const x = ox + px * s; panel = { x, y: 4, w: W - x - 6, h: H - 8 }; }
  let conn: G['conn'] = null;
  if (v.conn && panel && mode === 'left') { const n: Rect | undefined = nodes.find((q) => q.id === v.conn) ?? frames.find((q) => q.id === v.conn); if (n) conn = { x1: n.x + n.w, x2: panel.x, y: n.y + n.h / 2 }; }
  const flow = (v.flow ?? []).map((id) => edges.find((e) => e.id === id)?.pts ?? []).filter((p) => p.length > 1);
  return { W, H, s, nodes, edges, frames, panel, conn, flow, labels };
}

/** colours per state (plates, outlines, label text) */
export const STY: Record<St, { fill: string; stroke: string; glow: number }> = {
  calm: { fill: '#0b1636', stroke: '#3f6fff', glow: 0 },
  pass: { fill: '#0b1636', stroke: '#34509a', glow: 0 },
  lit: { fill: '#1c3f9e', stroke: '#9cc8ff', glow: 0.55 },
  sel: { fill: '#2350c8', stroke: '#d6ecff', glow: 0.8 },
  dim: { fill: '#091026', stroke: '#24345c', glow: 0 },
  or: { fill: '#3b1f0a', stroke: '#ff9a3c', glow: 0.45 },
  gold: { fill: '#1f1806', stroke: '#d6a840', glow: 0.25 },
};
export const ACOL: Record<St, string> = { calm: '#5f86d8', lit: '#8fe3ff', pass: '#4a6ab8', dim: '#2a3c6c', sel: '#8fe3ff', or: '#ff9a3c', gold: '#ffd27a' };
