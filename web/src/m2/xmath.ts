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
