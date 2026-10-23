/* exact helpers for the extension labs (M4–M6) */
/** P(majority of N independent chains is correct), N odd, each chain correct with probability p; wrong chains all agree (worst case for voting) */
export function majority(p: number, N: number): number {
  if (N < 1 || N % 2 === 0) throw new Error('N must be odd and ≥ 1');
  let s = 0, c = 1; // c = C(N, k), built up from k = 0
  for (let k = 0; k <= N; k++) {
    if (k > 0) c = (c * (N - k + 1)) / k;
    if (2 * k > N) s += c * p ** k * (1 - p) ** (N - k);
  }
  return s;
}

/* labPool (T7, gap audit A10): max pooling over a small feature map */
export type Grid = number[][];
/** k×k max pooling with stride s (no padding); also returns the "switches" (where each max came from, row-major index) */
export function maxPool(m: Grid, k: number, s: number): { out: Grid; sw: number[][] } {
  const H = m.length, W = m[0]?.length ?? 0;
  if (k < 1 || s < 1 || k > H || k > W) throw new Error('bad pool size');
  const oh = Math.floor((H - k) / s) + 1, ow = Math.floor((W - k) / s) + 1, out: Grid = [], sw: number[][] = [];
  for (let i = 0; i < oh; i++) {
    out.push([]); sw.push([]);
    for (let j = 0; j < ow; j++) {
      let best = -Infinity, at = -1;
      for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) { const r = i * s + a, c = j * s + b, v = m[r]![c]!; if (v > best) { best = v; at = r * W + c; } }
      out[i]!.push(best); sw[i]!.push(at);
    }
  }
  return { out, sw };
}
/** shift a map right by d columns, filling with 0 */
export const shiftRight = (m: Grid, d: number): Grid => m.map((row) => row.map((_, c) => (c - d >= 0 ? row[c - d]! : 0)));
/** share of cells whose value differs between two equal-sized maps */
export function changed(a: Grid, b: Grid): number {
  let n = 0, d = 0;
  a.forEach((row, i) => row.forEach((v, j) => { n++; if (v !== b[i]![j]) d++; }));
  return n ? d / n : 0;
}
/** the illustrative 8×8 "edge detector" output used by labPool: a short diagonal stroke and a vertical stroke */
export const POOL_MAP: Grid = (() => {
  const m: Grid = Array.from({ length: 8 }, () => Array(8).fill(0) as number[]);
  const pts: [number, number, number][] = [[1, 0, 9], [2, 2, 7], [3, 3, 6], [4, 4, 8], [5, 5, 5], [1, 6, 4], [2, 6, 6], [6, 6, 3], [6, 2, 2]];
  for (const [r, c, v] of pts) m[r]![c] = v;
  return m;
})();
