/* R38 layer 4: a real, hand-written GPT-style decoder-only Transformer (no libraries).
   Post-LN like the figure ("add + norm" after each sub-layer): x = LN(x + Attn(x)); x = LN(x + FFN(x)).
   Causal mask, learned position embedding, Linear -> Softmax on top. Manual backprop, AdamW, deterministic seed.
   Every intermediate number is kept in the Trace so the explorer can show it (nothing on screen is hard-coded). */
export type Arr = Float32Array | Float64Array;
export interface Cfg { d: number; H: number; L: number; ctx: number; F: number; seed: number; f64?: boolean }
export const CFG: Cfg = { d: 16, H: 2, L: 2, ctx: 24, F: 64, seed: 7 };

/* ---------- character dictionary, built from the user's own lines ---------- */
export const END = '⏎'; // id 0: "end of answer"
export interface Dict { chars: string[]; ix: Record<string, number> }
export const SEP = '？';
export function buildDict(lines: string[]): Dict {
  const chars = [END];
  for (const l of lines) for (const c of Array.from(l)) if (c !== '→' && !chars.includes(c)) chars.push(c);
  const ix: Record<string, number> = {}; chars.forEach((c, i) => { ix[c] = i; });
  return { chars, ix };
}
export const enc = (D: Dict, s: string) => Array.from(s).filter((c) => c in D.ix).map((c) => D.ix[c]!);
/** "question？→answer" or "question？answer" -> {q, a} */
export function splitQA(line: string): { q: string; a: string } | null {
  const t = line.replace(/\s+/g, '');
  let k = t.indexOf('→'); if (k < 0) k = t.indexOf('->') >= 0 ? t.indexOf('->') : -1;
  let q: string, a: string;
  if (k >= 0) { q = t.slice(0, k); a = t.slice(k + (t[k] === '→' ? 1 : 2)); } else { const s = t.indexOf(SEP); if (s < 0) return null; q = t.slice(0, s + 1); a = t.slice(s + 1); }
  q = q.replace(/[?？]$/, '') + SEP; a = a.replace(/[?？]/g, '');
  if (q.length < 2 || !a) return null;
  return { q, a };
}

/* ---------- deterministic random numbers ---------- */
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

/* ---------- parameters ---------- */
export interface Param { name: string; w: Arr; g: Arr; m: Arr; v: Arr; mat: boolean }
/** which box of the figure a parameter belongs to (for the per-box gradient sizes) */
export type Box = 'emb' | 'att' | 'an1' | 'ffn' | 'an2' | 'lin';
export const boxOf = (name: string): Box => name.startsWith('tok') || name.startsWith('pos') ? 'emb' : name.startsWith('W.') || name.startsWith('b.') ? 'lin'
  : /\.(ln1)/.test(name) ? 'an1' : /\.(ln2)/.test(name) ? 'an2' : /\.(W1|b1|W2|b2)$/.test(name) ? 'ffn' : 'att';
export class Model {
  cfg: Cfg; V: number; ps: Param[] = []; P: Record<string, Param> = {}; t = 0; A: Float32ArrayConstructor | Float64ArrayConstructor;
  constructor(cfg: Cfg, V: number) {
    this.cfg = cfg; this.V = V; this.A = cfg.f64 ? Float64Array : Float32Array;
    const r = rng(cfg.seed), { d, F } = cfg;
    const add = (name: string, n: number, std: number, one = false, mat = true) => {
      const w = new this.A(n); for (let i = 0; i < n; i++) w[i] = one ? 1 : std ? gauss(r) * std : 0;
      const p = { name, w, g: new this.A(n), m: new this.A(n), v: new this.A(n), mat }; this.ps.push(p); this.P[name] = p;
    };
    add('tok', V * d, 0.5, false, false); add('pos', cfg.ctx * d, 0.3, false, false);
    const s = 1 / Math.sqrt(d);
    for (let l = 0; l < cfg.L; l++) {
      for (const x of ['Wq', 'Wk', 'Wv', 'Wo']) add(`L${l}.${x}`, d * d, s);
      for (const x of ['bq', 'bk', 'bv', 'bo']) add(`L${l}.${x}`, d, 0, false, false);
      add(`L${l}.ln1g`, d, 0, true, false); add(`L${l}.ln1b`, d, 0, false, false);
      add(`L${l}.W1`, d * F, s); add(`L${l}.b1`, F, 0, false, false);
      add(`L${l}.W2`, F * d, 1 / Math.sqrt(F)); add(`L${l}.b2`, d, 0, false, false);
      add(`L${l}.ln2g`, d, 0, true, false); add(`L${l}.ln2b`, d, 0, false, false);
    }
    add('W.out', d * V, s); add('b.out', V, 0, false, false);
  }
  get n() { return this.ps.reduce((a, p) => a + p.w.length, 0); }
}

/* ---------- ops (row-major) ---------- */
type AC = Float32ArrayConstructor | Float64ArrayConstructor;
function lin(A: AC, X: Arr, n: number, k: number, W: Arr, b: Arr, m: number): Arr {
  const Y = new A(n * m);
  for (let i = 0; i < n; i++) { const yo = i * m, xo = i * k; for (let j = 0; j < m; j++) Y[yo + j] = b[j]!;
    for (let p = 0; p < k; p++) { const x = X[xo + p]!; if (x === 0) continue; const wo = p * m; for (let j = 0; j < m; j++) Y[yo + j] = Y[yo + j]! + (x * W[wo + j]!); } }
  return Y;
}
function linB(A: AC, dY: Arr, X: Arr, n: number, k: number, W: Arr, m: number, dW: Arr, db: Arr): Arr {
  const dX = new A(n * k);
  for (let i = 0; i < n; i++) { const yo = i * m, xo = i * k;
    for (let j = 0; j < m; j++) db[j] = db[j]! + (dY[yo + j]!);
    for (let p = 0; p < k; p++) { const wo = p * m, x = X[xo + p]!; let s = 0;
      for (let j = 0; j < m; j++) { const dy = dY[yo + j]!; s += dy * W[wo + j]!; dW[wo + j] = dW[wo + j]! + (x * dy); } dX[xo + p] = s; } }
  return dX;
}
export interface LNc { xh: Arr; rs: Arr }
function ln(A: AC, X: Arr, n: number, d: number, g: Arr, b: Arr): { y: Arr; c: LNc } {
  const y = new A(n * d), xh = new A(n * d), rs = new A(n);
  for (let i = 0; i < n; i++) { const o = i * d; let mu = 0; for (let j = 0; j < d; j++) mu += X[o + j]!; mu /= d;
    let v = 0; for (let j = 0; j < d; j++) { const t = X[o + j]! - mu; v += t * t; } v /= d; const r = 1 / Math.sqrt(v + 1e-5); rs[i] = r;
    for (let j = 0; j < d; j++) { const h = (X[o + j]! - mu) * r; xh[o + j] = h; y[o + j] = h * g[j]! + b[j]!; } }
  return { y, c: { xh, rs } };
}
function lnB(A: AC, dY: Arr, c: LNc, n: number, d: number, g: Arr, dg: Arr, db: Arr): Arr {
  const dX = new A(n * d);
  for (let i = 0; i < n; i++) { const o = i * d; let m1 = 0, m2 = 0;
    for (let j = 0; j < d; j++) { const dy = dY[o + j]!; dg[j] = dg[j]! + (dy * c.xh[o + j]!); db[j] = db[j]! + (dy); const e = dy * g[j]!; m1 += e; m2 += e * c.xh[o + j]!; }
    m1 /= d; m2 /= d; for (let j = 0; j < d; j++) dX[o + j] = c.rs[i]! * (dY[o + j]! * g[j]! - m1 - c.xh[o + j]! * m2); }
  return dX;
}

/* ---------- forward, keeping every number ---------- */
export interface LT {
  x: Arr; q: Arr; k: Arr; v: Arr; S: Arr[]; W: Arr[]; heads: Arr; att: Arr; sum1: Arr; n1: Arr; c1: LNc;
  pre: Arr; act: Arr; ff: Arr; sum2: Arr; n2: Arr; c2: LNc;
}
export interface Trace { ids: number[]; T: number; tok: Arr; pos: Arr; x0: Arr; layers: LT[]; logits: Arr; probs: Arr; loss?: number; tgt?: number[]; mask?: number[] }
export function forward(M: Model, ids: number[], tgt?: number[], mask?: number[]): Trace {
  const { d, H, L, F } = M.cfg, A = M.A, P = M.P, T = ids.length, V = M.V, dh = d / H, sc = 1 / Math.sqrt(dh);
  const tok = new A(T * d), pos = new A(T * d), x0 = new A(T * d);
  for (let t = 0; t < T; t++) for (let j = 0; j < d; j++) { const a = P.tok!.w[ids[t]! * d + j]!, b = P.pos!.w[t * d + j]!; tok[t * d + j] = a; pos[t * d + j] = b; x0[t * d + j] = a + b; }
  let x = x0; const layers: LT[] = [];
  for (let l = 0; l < L; l++) {
    const p = (s: string) => P[`L${l}.${s}`]!.w;
    const q = lin(A, x, T, d, p('Wq'), p('bq'), d), k = lin(A, x, T, d, p('Wk'), p('bk'), d), v = lin(A, x, T, d, p('Wv'), p('bv'), d);
    const heads = new A(T * d), S: Arr[] = [], W: Arr[] = [];
    for (let h = 0; h < H; h++) { const s = new A(T * T), w = new A(T * T), ho = h * dh;
      for (let i = 0; i < T; i++) { let mx = -Infinity;
        for (let j = 0; j <= i; j++) { let z = 0; for (let e = 0; e < dh; e++) z += q[i * d + ho + e]! * k[j * d + ho + e]!; z *= sc; s[i * T + j] = z; if (z > mx) mx = z; }
        let z = 0; for (let j = 0; j <= i; j++) { const ex = Math.exp(s[i * T + j]! - mx); w[i * T + j] = ex; z += ex; }
        for (let j = 0; j <= i; j++) w[i * T + j] = w[i * T + j]! / (z);
        for (let e = 0; e < dh; e++) { let o = 0; for (let j = 0; j <= i; j++) o += w[i * T + j]! * v[j * d + ho + e]!; heads[i * d + ho + e] = o; } }
      S.push(s); W.push(w); }
    const att = lin(A, heads, T, d, p('Wo'), p('bo'), d);
    const sum1 = new A(T * d); for (let i = 0; i < T * d; i++) sum1[i] = x[i]! + att[i]!;
    const { y: n1, c: c1 } = ln(A, sum1, T, d, p('ln1g'), p('ln1b'));
    const pre = lin(A, n1, T, d, p('W1'), p('b1'), F), act = new A(T * F); for (let i = 0; i < T * F; i++) act[i] = pre[i]! > 0 ? pre[i]! : 0;
    const ff = lin(A, act, T, F, p('W2'), p('b2'), d);
    const sum2 = new A(T * d); for (let i = 0; i < T * d; i++) sum2[i] = n1[i]! + ff[i]!;
    const { y: n2, c: c2 } = ln(A, sum2, T, d, p('ln2g'), p('ln2b'));
    layers.push({ x, q, k, v, S, W, heads, att, sum1, n1, c1, pre, act, ff, sum2, n2, c2 });
    x = n2;
  }
  const logits = lin(A, x, T, d, P['W.out']!.w, P['b.out']!.w, V), probs = new A(T * V);
  for (let t = 0; t < T; t++) { let mx = -Infinity; for (let j = 0; j < V; j++) mx = Math.max(mx, logits[t * V + j]!); let z = 0;
    for (let j = 0; j < V; j++) { const e = Math.exp(logits[t * V + j]! - mx); probs[t * V + j] = e; z += e; } for (let j = 0; j < V; j++) probs[t * V + j] = probs[t * V + j]! / (z); }
  const tr: Trace = { ids, T, tok, pos, x0, layers, logits, probs };
  if (tgt) { let s = 0, c = 0; for (let t = 0; t < T; t++) { if (mask && !mask[t]) continue; s += -Math.log(Math.max(probs[t * V + tgt[t]!]!, 1e-12)); c++; } tr.loss = s / Math.max(c, 1); tr.tgt = tgt; if (mask) tr.mask = mask; }
  return tr;
}

/* ---------- backward: adds d(loss)*scale into every p.g ---------- */
export function backward(M: Model, tr: Trace, scale = 1) {
  const { d, H, L, F } = M.cfg, A = M.A, P = M.P, T = tr.T, V = M.V, dh = d / H, sc = 1 / Math.sqrt(dh), mask = tr.mask;
  let cnt = 0; for (let t = 0; t < T; t++) if (!mask || mask[t]) cnt++;
  const dl = new A(T * V);
  for (let t = 0; t < T; t++) { if (mask && !mask[t]) continue; for (let j = 0; j < V; j++) dl[t * V + j] = tr.probs[t * V + j]! * scale / cnt; dl[t * V + tr.tgt![t]!] = dl[t * V + tr.tgt![t]!]! - (scale / cnt); }
  const xL = L ? tr.layers[L - 1]!.n2 : tr.x0;
  let dx = linB(A, dl, xL, T, d, P['W.out']!.w, V, P['W.out']!.g, P['b.out']!.g);
  for (let l = L - 1; l >= 0; l--) {
    const t = tr.layers[l]!, p = (s: string) => P[`L${l}.${s}`]!;
    const dS2 = lnB(A, dx, t.c2, T, d, p('ln2g').w, p('ln2g').g, p('ln2b').g);           // n2 = LN(sum2)
    const dAct = linB(A, dS2, t.act, T, F, p('W2').w, d, p('W2').g, p('b2').g);          // sum2 = n1 + ff
    const dPre = new A(T * F); for (let i = 0; i < T * F; i++) dPre[i] = t.pre[i]! > 0 ? dAct[i]! : 0;
    const dN1 = linB(A, dPre, t.n1, T, d, p('W1').w, F, p('W1').g, p('b1').g);
    for (let i = 0; i < T * d; i++) dN1[i] = dN1[i]! + (dS2[i]!);                                     // residual
    const dS1 = lnB(A, dN1, t.c1, T, d, p('ln1g').w, p('ln1g').g, p('ln1b').g);           // n1 = LN(sum1)
    const dH = linB(A, dS1, t.heads, T, d, p('Wo').w, d, p('Wo').g, p('bo').g);           // sum1 = x + att
    const dq = new A(T * d), dk = new A(T * d), dv = new A(T * d);
    for (let h = 0; h < H; h++) { const W = t.W[h]!, ho = h * dh;
      for (let i = 0; i < T; i++) { const dA = new A(i + 1); let dot = 0;
        for (let j = 0; j <= i; j++) { let s = 0; for (let e = 0; e < dh; e++) { s += dH[i * d + ho + e]! * t.v[j * d + ho + e]!; dv[j * d + ho + e] = dv[j * d + ho + e]! + (W[i * T + j]! * dH[i * d + ho + e]!); } dA[j] = s; dot += s * W[i * T + j]!; }
        for (let j = 0; j <= i; j++) { const ds = W[i * T + j]! * (dA[j]! - dot) * sc;
          for (let e = 0; e < dh; e++) { dq[i * d + ho + e] = dq[i * d + ho + e]! + (ds * t.k[j * d + ho + e]!); dk[j * d + ho + e] = dk[j * d + ho + e]! + (ds * t.q[i * d + ho + e]!); } } } }
    const dX = linB(A, dq, t.x, T, d, p('Wq').w, d, p('Wq').g, p('bq').g);
    const dXk = linB(A, dk, t.x, T, d, p('Wk').w, d, p('Wk').g, p('bk').g), dXv = linB(A, dv, t.x, T, d, p('Wv').w, d, p('Wv').g, p('bv').g);
    for (let i = 0; i < T * d; i++) dX[i] = dX[i]! + (dXk[i]! + dXv[i]! + dS1[i]!);
    dx = dX;
  }
  for (let t = 0; t < T; t++) for (let j = 0; j < d; j++) { P.tok!.g[tr.ids[t]! * d + j] = P.tok!.g[tr.ids[t]! * d + j]! + (dx[t * d + j]!); P.pos!.g[t * d + j] = P.pos!.g[t * d + j]! + (dx[t * d + j]!); }
}

/* ---------- AdamW with clipping; returns the gradient size per box (before the step) ---------- */
export type Norms = Record<Box, number>;
export function adamw(M: Model, lr: number, wd = 0.01, clip = 1) {
  M.t++; const b1 = 0.9, b2 = 0.99, eps = 1e-8; let n2 = 0; const nb: Norms = { emb: 0, att: 0, an1: 0, ffn: 0, an2: 0, lin: 0 };
  for (const p of M.ps) { let s = 0; for (let i = 0; i < p.g.length; i++) s += p.g[i]! * p.g[i]!; n2 += s; nb[boxOf(p.name)] += s; }
  const gn = Math.sqrt(n2), cs = gn > clip ? clip / gn : 1, c1 = 1 - b1 ** M.t, c2 = 1 - b2 ** M.t;
  for (const p of M.ps) { const dec = p.mat ? wd : 0;
    for (let i = 0; i < p.w.length; i++) { const g = p.g[i]! * cs; p.m[i] = b1 * p.m[i]! + (1 - b1) * g; p.v[i] = b2 * p.v[i]! + (1 - b2) * g * g;
      p.w[i] = p.w[i]! - (lr * ((p.m[i]! / c1) / (Math.sqrt(p.v[i]! / c2) + eps) + dec * p.w[i]!)); p.g[i] = 0; } }
  for (const k of Object.keys(nb) as Box[]) nb[k] = Math.sqrt(nb[k]);
  return { gn, nb };
}

/* ---------- examples: the loss only counts the answer (from "？" on) and the end mark ---------- */
export interface Ex { ids: number[]; tgt: number[]; mask: number[]; q: string; a: string }
export function examples(D: Dict, lines: string[], ctx = CFG.ctx): Ex[] {
  const out: Ex[] = [];
  for (const l of lines) { const qa = splitQA(l); if (!qa) continue;
    const qi = enc(D, qa.q), ai = enc(D, qa.a), all = [...qi, ...ai, 0].slice(0, ctx + 1);
    const ids = all.slice(0, -1), tgt = all.slice(1), mask = tgt.map((_, t) => (t >= qi.length - 1 ? 1 : 0));
    out.push({ ids, tgt, mask, q: qa.q, a: qa.a }); }
  return out;
}
export const lrAt = (step: number, base = 0.004, warm = 10) => base * Math.min(1, (step + 1) / warm);
export function step(M: Model, batch: Ex[], lr: number) {
  let loss = 0; let last: Trace | null = null;
  for (const e of batch) { const tr = forward(M, e.ids, e.tgt, e.mask); loss += tr.loss!; backward(M, tr, 1 / batch.length); last = tr; }
  const o = adamw(M, lr); return { loss: loss / batch.length, gn: o.gn, nb: o.nb, last: last! };
}
/** greedy answer for a question; returns each step's top choices */
export function answer(M: Model, D: Dict, q: string, max = 6) {
  const qq = q.replace(/\s+/g, '').replace(/[?？]$/, '') + SEP; const ids = enc(D, qq); const steps: { top: [number, number][] }[] = []; let out = '';
  for (let s = 0; s < max && ids.length < M.cfg.ctx; s++) {
    const tr = forward(M, ids), o = (ids.length - 1) * M.V, row = Array.from(tr.probs.subarray(o, o + M.V)) as number[];
    const top = row.map((p, i) => [i, p] as [number, number]).sort((a, b) => b[1] - a[1]).slice(0, 4); steps.push({ top });
    const nx = top[0]![0]; if (nx === 0) break; ids.push(nx); out += D.chars[nx];
  }
  return { q: qq, out, steps, unknown: Array.from(qq).filter((c) => !(c in D.ix)) };
}
export function pack(M: Model): Float32Array { const o = new Float32Array(M.n); let k = 0; for (const p of M.ps) { o.set(p.w, k); k += p.w.length; } return o; }
export function unpack(M: Model, b: Float32Array) { let k = 0; for (const p of M.ps) { p.w.set(b.subarray(k, k + p.w.length)); k += p.w.length; } }
/** train from scratch (deterministic): returns the loss after every step */
export function trainAll(M: Model, ex: Ex[], steps: number, onStep?: (i: number, r: ReturnType<typeof step>) => void) {
  const ls: number[] = [];
  for (let i = 0; i < steps; i++) { const r = step(M, ex, lrAt(i)); ls.push(r.loss); onStep?.(i, r); }
  return ls;
}
