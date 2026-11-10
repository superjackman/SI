/* A one-layer, one-head causal Transformer, small enough to train in the browser.
   Ideas only from the public teaching models (nanoGPT / minGPT); this file is original.
   Matrix slots are allocated to exact sizes; indexed access is checked by tests/unit/lab.test.ts. */
// @ts-nocheck

export interface Net {
  V: number; D: number; T: number;
  E: number[][]; P: number[][];
  Wq: number[][]; Wk: number[][]; Wv: number[][]; Wo: number[][];
  Wout: number[][];
}

const rand = (s: number) => (Math.random() * 2 - 1) * s;
const mat = (r: number, c: number, s: number) => Array.from({ length: r }, () => Array.from({ length: c }, () => rand(s)));
const zeros = (r: number, c: number) => Array.from({ length: r }, () => new Array(c).fill(0));

export function makeNet(V: number, D = 16, T = 16): Net {
  const s = 0.08;
  return { V, D, T, E: mat(V, D, s), P: mat(T, D, s), Wq: mat(D, D, s), Wk: mat(D, D, s), Wv: mat(D, D, s), Wo: mat(D, D, s), Wout: mat(D, V, s) };
}

const clip = (g: number) => Math.max(-2, Math.min(2, g));

/** One full-batch step on a single sequence. Returns the mean next-character loss. */
export function trainStep(net: Net, ids: number[], lr: number): number {
  const { D, V } = net;
  const L = Math.min(ids.length, net.T);
  if (L < 2) return 0;
  const x = ids.slice(0, L).map((id, t) => net.E[id].map((e, d) => e + net.P[t][d]));
  const mul = (rows: number[][], W: number[][]) => rows.map((row) => W[0].map((_, j) => row.reduce((s, v, i) => s + v * W[i][j], 0)));
  const q = mul(x, net.Wq), k = mul(x, net.Wk), v = mul(x, net.Wv);
  const scale = Math.sqrt(D);
  const att: number[][] = [];
  for (let t = 0; t < L; t++) {
    let m = -1e9; const s: number[] = [];
    for (let j = 0; j <= t; j++) { let dot = 0; for (let d = 0; d < D; d++) dot += q[t][d] * k[j][d]; s[j] = dot / scale; if (s[j] > m) m = s[j]; }
    let z = 0; const a = new Array(L).fill(0);
    for (let j = 0; j <= t; j++) { a[j] = Math.exp(s[j] - m); z += a[j]; }
    for (let j = 0; j <= t; j++) a[j] /= z;
    att.push(a);
  }
  const ctx = att.map((a) => { const c = new Array(D).fill(0); for (let j = 0; j < L; j++) if (a[j]) for (let d = 0; d < D; d++) c[d] += a[j] * v[j][d]; return c; });
  const ao = mul(ctx, net.Wo);
  const y = x.map((row, t) => row.map((val, d) => val + ao[t][d]));
  const logits = mul(y, net.Wout);
  const N = L - 1;
  const prob: number[][] = [];
  let loss = 0;
  const dLog = zeros(L, V);
  for (let t = 0; t < N; t++) {
    let m = -1e9; for (const s of logits[t]) if (s > m) m = s;
    let z = 0; const p = logits[t].map((s) => { const e = Math.exp(s - m); z += e; return e; });
    for (let i = 0; i < V; i++) p[i] /= z;
    prob.push(p);
    const target = ids[t + 1];
    loss += -Math.log(Math.max(1e-8, p[target]));
    for (let i = 0; i < V; i++) dLog[t][i] = (p[i] - (i === target ? 1 : 0)) / N;
  }
  loss /= N;
  const dY = zeros(L, D), dWout = zeros(D, V);
  for (let t = 0; t < N; t++) for (let d = 0; d < D; d++) for (let i = 0; i < V; i++) {
    dWout[d][i] += y[t][d] * dLog[t][i];
    dY[t][d] += dLog[t][i] * net.Wout[d][i];
  }
  const dX = dY.map((row) => row.slice());
  const dCtx = zeros(L, D), dWo = zeros(D, D);
  for (let t = 0; t < N; t++) for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) {
    dWo[i][j] += ctx[t][i] * dY[t][j];
    dCtx[t][i] += dY[t][j] * net.Wo[i][j];
  }
  const dAtt = zeros(L, L), dV = zeros(L, D);
  for (let t = 0; t < N; t++) for (let j = 0; j <= t; j++) for (let d = 0; d < D; d++) {
    dAtt[t][j] += dCtx[t][d] * v[j][d];
    dV[j][d] += att[t][j] * dCtx[t][d];
  }
  const dScore = zeros(L, L);
  for (let t = 0; t < N; t++) {
    let dot = 0; for (let j = 0; j <= t; j++) dot += att[t][j] * dAtt[t][j];
    for (let j = 0; j <= t; j++) dScore[t][j] = att[t][j] * (dAtt[t][j] - dot) / scale;
  }
  const dQ = zeros(L, D), dK = zeros(L, D);
  for (let t = 0; t < N; t++) for (let j = 0; j <= t; j++) for (let d = 0; d < D; d++) {
    dQ[t][d] += dScore[t][j] * k[j][d];
    dK[j][d] += dScore[t][j] * q[t][d];
  }
  const apply = (rows: number[][], W: number[][], dRows: number[][], upto: number) => {
    const dW = zeros(D, D);
    for (let t = 0; t < upto; t++) for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) {
      dW[i][j] += rows[t][i] * dRows[t][j];
      dX[t][i] += dRows[t][j] * W[i][j];
    }
    return dW;
  };
  const dWq = apply(x, net.Wq, dQ, N);
  const dWk = apply(x, net.Wk, dK, L);
  const dWv = apply(x, net.Wv, dV, L);
  const sink = (W: number[][], dW: number[][]) => { for (let i = 0; i < W.length; i++) for (let j = 0; j < W[0].length; j++) W[i][j] -= lr * clip(dW[i][j]); };
  sink(net.Wq, dWq); sink(net.Wk, dWk); sink(net.Wv, dWv); sink(net.Wo, dWo); sink(net.Wout, dWout);
  for (let t = 0; t < L; t++) for (let d = 0; d < D; d++) {
    const g = clip(dX[t][d]);
    net.E[ids[t]][d] -= lr * g;
    net.P[t][d] -= lr * g;
  }
  return loss;
}

export function forwardAttn(net: Net, ids: number[]): { logits: number[]; att: number[][] } {
  const { D } = net;
  const L = Math.min(ids.length, net.T);
  const x = ids.slice(0, L).map((id, t) => net.E[id].map((e, d) => e + net.P[t][d]));
  const mul = (rows: number[][], W: number[][]) => rows.map((row) => W[0].map((_, j) => row.reduce((s, v, i) => s + v * W[i][j], 0)));
  const q = mul(x, net.Wq), k = mul(x, net.Wk), v = mul(x, net.Wv);
  const scale = Math.sqrt(D);
  const att: number[][] = [];
  for (let t = 0; t < L; t++) {
    let m = -1e9; const s: number[] = [];
    for (let j = 0; j <= t; j++) { let dot = 0; for (let d = 0; d < D; d++) dot += q[t][d] * k[j][d]; s[j] = dot / scale; if (s[j] > m) m = s[j]; }
    let z = 0; const a = new Array(L).fill(0);
    for (let j = 0; j <= t; j++) { a[j] = Math.exp(s[j] - m); z += a[j]; }
    for (let j = 0; j <= t; j++) a[j] /= z || 1;
    att.push(a);
  }
  const ctx = att.map((a) => { const c = new Array(D).fill(0); for (let j = 0; j < L; j++) for (let d = 0; d < D; d++) c[d] += a[j] * v[j][d]; return c; });
  const y = x.map((row, t) => row.map((val, d) => val + mul([ctx[t]], net.Wo)[0][d]));
  const logits = mul([y[L - 1]], net.Wout)[0];
  return { logits, att };
}

export function sampleNext(logits: number[], temp: number): number {
  const t = Math.max(0.05, temp);
  let m = -1e9; for (const s of logits) if (s > m) m = s;
  const w = logits.map((s) => Math.exp((s - m) / t));
  let z = w.reduce((a, b) => a + b, 0), r = Math.random() * z;
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return w.length - 1;
}

/** Public-domain lines (李白《静夜思》) plus short original sentences. */
export const CORPUS = '床前明月光疑是地上霜举头望明月低头思故乡今天天气真好我们去公园走路妈妈说明天早点起床吃饭小明把杯子放在桌上';

export function alphabet(text = CORPUS): { chars: string[]; id: Map<string, number> } {
  const chars = [...new Set([...text])];
  return { chars, id: new Map(chars.map((c, i) => [c, i])) };
}

export function windows(text: string, id: Map<string, number>, T: number): number[][] {
  const ids = [...text].map((c) => id.get(c)!).filter((n) => n != null);
  const out: number[][] = [];
  for (let i = 0; i + 2 <= ids.length; i += 4) out.push(ids.slice(i, i + T));
  return out.length ? out : [ids.slice(0, T)];
}
