/* R14: exact helpers for the two deferred labs.
   labChin (T7): the Chinchilla parametric loss L(N, D) = E + A/N^α + B/D^β (Hoffmann et al. 2022, arXiv 2203.15556,
   eq. 10 in appendix D.2: E = 1.69, A = 406.4, B = 410.7, α = 0.34, β = 0.28) and its compute-optimal split under
   C ≈ 6ND (eq. 4: N_opt = G(C/6)^a, D_opt = G⁻¹(C/6)^b, G = (αA/(βB))^(1/(α+β)), a = β/(α+β), b = α/(α+β)).
   labBpe (T3): byte-pair-encoding merges learned exactly like Algorithm 1 of Sennrich et al. 2016 (arXiv 1508.07909). */

/* ---- labChin ---- */
export const CHIN = { E: 1.69, A: 406.4, B: 410.7, alpha: 0.34, beta: 0.28 } as const;
export type Chin = { E: number; A: number; B: number; alpha: number; beta: number };
/** the fitted loss (nats per token) of a model with N parameters trained on D tokens */
export function chinLoss(N: number, D: number, k: Chin = CHIN): number {
  if (!(N > 0 && D > 0)) throw new Error('N and D must be positive');
  return k.E + k.A / N ** k.alpha + k.B / D ** k.beta;
}
/** training compute in FLOPs, C ≈ 6ND (Kaplan et al. 2020, used by the paper) */
export const flops = (N: number, D: number) => 6 * N * D;
/** the compute-optimal N and D for a budget of C FLOPs (closed form, eq. 4) */
export function chinOpt(C: number, k: Chin = CHIN) {
  if (!(C > 0)) throw new Error('C must be positive');
  const s = k.alpha + k.beta, G = ((k.alpha * k.A) / (k.beta * k.B)) ** (1 / s), a = k.beta / s, b = k.alpha / s;
  const N = G * (C / 6) ** a, D = (C / 6) ** b / G;
  return { G, a, b, N, D, L: chinLoss(N, D, k), ratio: D / N };
}
/** the loss along a fixed budget C (an "isoFLOP" slice): D = C/(6N) */
export const isoLoss = (C: number, N: number, k: Chin = CHIN) => chinLoss(N, C / (6 * N), k);

/* ---- labBpe ---- */
/** the training corpus of Algorithm 1 (word → count); "_" marks the end of a word (the paper's </w>) */
export const BPE_CORPUS: [string, number][] = [['low', 5], ['lower', 2], ['newest', 6], ['widest', 3]];
export const EOW = '_';
export type Pair = [string, string];
export interface BpeStep { counts: [Pair, number][]; best: Pair | null; words: [string[], number][] }
const split = (w: string) => [...w, EOW];
/** apply one merge to a symbol list (left to right, non-overlapping) */
export function applyMerge(sym: string[], [a, b]: Pair): string[] {
  const o: string[] = [];
  for (let i = 0; i < sym.length; i++) if (sym[i] === a && sym[i + 1] === b) { o.push(a + b); i++; } else o.push(sym[i]!);
  return o;
}
/** adjacent-pair counts weighted by word frequency, in first-seen order (like get_stats) */
export function pairCounts(words: [string[], number][]): [Pair, number][] {
  const m = new Map<string, [Pair, number]>();
  for (const [s, f] of words) for (let i = 0; i + 1 < s.length; i++) {
    const k = s[i] + '\u0000' + s[i + 1], e = m.get(k);
    if (e) e[1] += f; else m.set(k, [[s[i]!, s[i + 1]!], f]);
  }
  return [...m.values()];
}
/** learn up to n merges; ties go to the pair seen first (Python's max over the insertion-ordered dict in Algorithm 1) */
export function learnBpe(n: number, corpus: [string, number][] = BPE_CORPUS) {
  let words: [string[], number][] = corpus.map(([w, f]) => [split(w), f]);
  const base: string[] = [];
  for (const [s] of words) for (const c of s) if (!base.includes(c)) base.push(c);
  const merges: Pair[] = [], steps: BpeStep[] = [];
  for (let i = 0; i <= n; i++) {
    const counts = pairCounts(words);
    let best: [Pair, number] | null = null;
    for (const e of counts) if (!best || e[1] > best[1]) best = e;
    steps.push({ counts, best: i < n && best ? best[0] : null, words });
    if (i === n || !best) break;
    merges.push(best[0]);
    words = words.map(([s, f]) => [applyMerge(s, best![0]), f]);
  }
  return { base, merges, steps, vocab: [...base, ...merges.map(([a, b]) => a + b)], words };
}
/** tokenize one word with the learned merges, applied in the order they were learned */
export function bpeEncode(word: string, merges: Pair[]): string[] {
  let s = split(word);
  for (const m of merges) s = applyMerge(s, m);
  return s;
}
/** keep what the lab accepts as a word: lower-case latin letters only, at most 16 of them */
export const cleanWord = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '').slice(0, 16);

/** a large count in words-of-magnitude, 3 significant digits: en 32.2 B / 2.98 T, zh 322 亿 / 2.98 万亿 */
export function big(x: number, lang: 'zh' | 'en'): string {
  const u: [number, string][] = lang === 'en' ? [[1e12, ' T'], [1e9, ' B'], [1e6, ' M'], [1e3, ' k']] : [[1e12, ' 万亿'], [1e8, ' 亿'], [1e4, ' 万']];
  for (const [v, s] of u) if (x >= v) return String(Number((x / v).toPrecision(3))) + s;
  return String(Number(x.toPrecision(3)));
}
