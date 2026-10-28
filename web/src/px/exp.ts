/* R40: the maths of the 实验 (experiments). Everything here is computed, nothing is a stored result:
   x1 steps: chance a plan of n steps all succeed, with and without check-and-redo, plus a seeded simulation;
   x2 memory: retrieval by character/word overlap (cosine of count vectors);
   x3/x4 use the trained model's real logits and attention scores (softmax with temperature / a nudged score);
   x5 √d: the spread of q·k for random vectors and how peaked softmax gets, with and without ÷√d. */
/** a small deterministic random generator (mulberry32) */
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function softmax(z: number[], T = 1): number[] { const s = z.map((v) => v / T), m = Math.max(...s), e = s.map((v) => Math.exp(v - m)), n = e.reduce((a, b) => a + b, 0); return e.map((v) => v / n); }

/* ---------- x1: steps ---------- */
export function steps(p: number, n: number, runs = 1000, seed = 1) {
  const once = p ** n, redo = (1 - (1 - p) ** 2) ** n, r = rng(seed); let a = 0, b = 0;
  for (let i = 0; i < runs; i++) { let okA = true, okB = true; for (let s = 0; s < n; s++) { const x = r() < p; if (!x) okA = false; if (!x && !(r() < p)) okB = false; } if (okA) a++; if (okB) b++; }
  return { once, redo, simOnce: a, simRedo: b, runs };
}

/* ---------- x2: memory retrieval ---------- */
const CJK = /[\u3400-\u9fff]/;
/** count vector: Chinese → single chars and pairs; other text → lower-case words */
export function bag(s: string): Map<string, number> {
  const m = new Map<string, number>(), add = (k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  const cj = Array.from(s).filter((c) => CJK.test(c)); cj.forEach(add); for (let i = 0; i + 1 < cj.length; i++) add(cj[i]! + cj[i + 1]!);
  for (const w of s.toLowerCase().replace(/[\u3400-\u9fff]/g, ' ').match(/[a-z0-9]+/g) ?? []) if (!STOP.has(w)) add(w.replace(/(ing|ed|es|s)$/, '') || w);
  return m;
}
const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'for', 'me', 'my', 'i', 'is', 'on', 'in', 'at', 'and', 'it', 'by', 'with', 'please', 'you', 'can']);
export function cosine(a: Map<string, number>, b: Map<string, number>) {
  let d = 0, na = 0, nb = 0; for (const [k, v] of a) { na += v * v; const w = b.get(k); if (w) d += v * w; } for (const v of b.values()) nb += v * v;
  return na && nb ? d / Math.sqrt(na * nb) : 0;
}
export function retrieve(q: string, notes: string[], top = 2) {
  const qb = bag(q), sc = notes.map((n, i) => ({ i, s: cosine(qb, bag(n)) })).sort((x, y) => y.s - x.s || x.i - y.i);
  return { all: sc, top: sc.filter((x) => x.s > 0).slice(0, top).map((x) => x.i) };
}

/* ---------- x3: temperature sampling over real probabilities ---------- */
export function sample(p: number[], n: number, seed: number) { const r = rng(seed), c = p.map(() => 0); for (let i = 0; i < n; i++) { let u = r(), j = 0; while (j < p.length - 1 && u >= p[j]!) { u -= p[j]!; j++; } c[j]!++; } return c; }

/* ---------- x5: ÷√d ---------- */
export function gauss(r: () => number) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
/** for random q, k (each number mean 0, variance 1): the spread of q·k and of q·k/√d, and the average top weight of a
    softmax over `keys` keys, both ways */
export function sqrtD(d: number, trials = 300, keys = 8, seed = 7) {
  const r = rng(seed + d); let s1 = 0, s2 = 0, n = 0, top1 = 0, top2 = 0;
  for (let t = 0; t < trials; t++) {
    const q = Array.from({ length: d }, () => gauss(r)), z: number[] = [];
    for (let k = 0; k < keys; k++) { let dot = 0; for (let e = 0; e < d; e++) dot += q[e]! * gauss(r); z.push(dot); s1 += dot * dot; s2 += (dot * dot) / d; n++; }
    top1 += Math.max(...softmax(z)); top2 += Math.max(...softmax(z.map((v) => v / Math.sqrt(d))));
  }
  return { sd: Math.sqrt(s1 / n), sdS: Math.sqrt(s2 / n), top: top1 / trials, topS: top2 / trials };
}
