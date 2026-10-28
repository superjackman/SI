/* R37: a small QR code maker for the share cards (byte mode, error correction level M, versions 1-40), drawn locally:
   no network, no library. The classic algorithm (ISO/IEC 18004) as in Project Nayuki's reference QR generator. */
const ECC_M = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
const BLK_M = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];
const raw = (v: number) => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
const dataCw = (v: number) => Math.floor(raw(v) / 8) - ECC_M[v]! * BLK_M[v]!;
const mul = (x: number, y: number) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 255; };
function rsDiv(n: number): number[] { const r = new Array<number>(n).fill(0); r[n - 1] = 1; let root = 1; for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { r[j] = mul(r[j]!, root); if (j + 1 < n) r[j]! ^= r[j + 1]!; } root = mul(root, 2); } return r; }
function rsRem(d: number[], div: number[]): number[] { const r = div.map(() => 0); for (const b of d) { const f = b ^ r.shift()!; r.push(0); div.forEach((c, i) => { r[i]! ^= mul(c, f); }); } return r; }
const bit = (x: number, i: number) => ((x >>> i) & 1) !== 0;
const align = (v: number): number[] => { if (v === 1) return []; const n = Math.floor(v / 7) + 2, step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, out = [6]; for (let p = v * 4 + 10; out.length < n; p -= step) out.splice(1, 0, p); return out; };
/** the QR matrix (true = dark) for a text, smallest version that fits */
export function qr(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  let v = 1; for (; v <= 40; v++) if (4 + (v <= 9 ? 8 : 16) + bytes.length * 8 <= dataCw(v) * 8) break;
  if (v > 40) throw new Error('qr: too long');
  const bits: number[] = []; const put = (x: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((x >>> i) & 1); };
  put(4, 4); put(bytes.length, v <= 9 ? 8 : 16); bytes.forEach((b) => put(b, 8));
  const cap = dataCw(v) * 8; put(0, Math.min(4, cap - bits.length)); put(0, (8 - (bits.length % 8)) % 8);
  for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
  const data: number[] = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  /* split into blocks, add the error correction, interleave */
  const nb = BLK_M[v]!, ecl = ECC_M[v]!, rawCw = Math.floor(raw(v) / 8), nShort = nb - (rawCw % nb), shortLen = Math.floor(rawCw / nb), div = rsDiv(ecl), blocks: number[][] = [];
  for (let i = 0, k = 0; i < nb; i++) { const d = data.slice(k, k + shortLen - ecl + (i < nShort ? 0 : 1)); k += d.length; const e = rsRem(d, div); if (i < nShort) d.push(0); blocks.push(d.concat(e)); }
  const cw: number[] = []; for (let i = 0; i < blocks[0]!.length; i++) blocks.forEach((b, j) => { if (i !== shortLen - ecl || j >= nShort) cw.push(b[i]!); });
  /* the function patterns */
  const N = v * 4 + 17, M = Array.from({ length: N }, () => new Array<boolean>(N).fill(false)), F = Array.from({ length: N }, () => new Array<boolean>(N).fill(false));
  const set = (x: number, y: number, d: boolean) => { M[y]![x] = d; F[y]![x] = true; };
  for (let i = 0; i < N; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [N - 4, 3], [3, N - 4]] as const) for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy; if (x >= 0 && x < N && y >= 0 && y < N) set(x, y, d !== 2 && d !== 4); }
  const al = align(v), L = al.length;
  for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) { if ((i === 0 && j === 0) || (i === 0 && j === L - 1) || (i === L - 1 && j === 0)) continue; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(al[i]! + dx, al[j]! + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
  const fmt = (mask: number) => {
    const d = (0 << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); const b = ((d << 10) | r) ^ 0x5412;
    for (let i = 0; i <= 5; i++) set(8, i, bit(b, i)); set(8, 7, bit(b, 6)); set(8, 8, bit(b, 7)); set(7, 8, bit(b, 8)); for (let i = 9; i < 15; i++) set(14 - i, 8, bit(b, i));
    for (let i = 0; i < 8; i++) set(N - 1 - i, 8, bit(b, i)); for (let i = 8; i < 15; i++) set(8, N - 15 + i, bit(b, i)); set(8, N - 8, true);
  };
  fmt(0);
  if (v >= 7) { let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25); const b = (v << 12) | r; for (let i = 0; i < 18; i++) { const a = N - 11 + (i % 3), c = Math.floor(i / 3); set(a, c, bit(b, i)); set(c, a, bit(b, i)); } }
  /* the data, in the zigzag */
  let i = 0;
  for (let right = N - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (let vert = 0; vert < N; vert++) for (let j = 0; j < 2; j++) { const x = right - j, upw = ((right + 1) & 2) === 0, y = upw ? N - 1 - vert : vert; if (!F[y]![x] && i < cw.length * 8) { M[y]![x] = bit(cw[i >>> 3]!, 7 - (i & 7)); i++; } } }
  /* the mask with the lowest penalty */
  const inv = (k: number, x: number, y: number) => [(x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0, (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, ((x * y) % 2) + ((x * y) % 3) === 0, (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (((x + y) % 2) + ((x * y) % 3)) % 2 === 0][k]!;
  const apply = (k: number) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!F[y]![x] && inv(k, x, y)) M[y]![x] = !M[y]![x]; };
  const pen = () => {
    let p = 0, dark = 0;
    for (let a = 0; a < N; a++) for (const row of [true, false]) { let run = 1; for (let b = 1; b < N; b++) { const c = row ? M[a]![b] : M[b]![a], q = row ? M[a]![b - 1] : M[b - 1]![a]; if (c === q) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
    for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) { const c = M[y]![x]; if (c === M[y]![x + 1] && c === M[y + 1]![x] && c === M[y + 1]![x + 1]) p += 3; }
    for (const r of M) for (const c of r) if (c) dark++;
    return p + Math.floor(Math.abs(dark * 20 - N * N * 10) / (N * N)) * 10;
  };
  let best = 0, bp = Infinity;
  for (let k = 0; k < 8; k++) { apply(k); fmt(k); const p = pen(); if (p < bp) { bp = p; best = k; } apply(k); }
  apply(best); fmt(best);
  return M;
}
