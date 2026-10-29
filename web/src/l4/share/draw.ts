/* R38: the share-card drawing, the explorer's knowledge-card share image. */
import { qr } from './qr';
import type { Tx } from '../txt';

export const SITE = 'https://superjackman.github.io/SI/';
export const SITE_N: Tx = ['大白话拆解 AI', 'AI, explained plainly'];
export type Fmt = 'story' | 'post';
export const SIZE: Record<Fmt, [number, number]> = { story: [1080, 1920], post: [1080, 1350] };
export interface Data { site: string; url: string; lv: string; lvC: string; path: string; icon: string; name: string; idea: string; parts: { n: string; s: string }[]; co: string; why: string; head: string; badge: string; scan: string; how: string; whyT: string; pts: string[]; sub: string }
export const words = (d: Data) => [d.head, d.name, d.idea, ...d.pts].filter(Boolean).join('\n');

export const FONT = 'system-ui,-apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Noto Sans CJK SC",sans-serif';
const tok = (s: string) => s.match(/[\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F](?:[，。、：；！？）」』”’,.!?:;)]*)|[^\s\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F]+\s*|\s+/g) ?? [];
export function wrap(g: CanvasRenderingContext2D, s: string, w: number, max = 9): string[] {
  const out: string[] = []; let cur = '';
  for (const t of tok(s)) {
    if (g.measureText(cur + t).width <= w || !cur) { cur += t; continue; }
    out.push(cur.trimEnd()); cur = t.trimStart();
  }
  if (cur.trim()) out.push(cur.trimEnd());
  if (out.length > max) { out.length = max; out[max - 1] = out[max - 1]!.replace(/.{0,2}$/, '…'); }
  return out;
}
/** the largest size (down to `min`) at which `s` fits in `max` lines without cutting */
export function fit(g: CanvasRenderingContext2D, s: string, w: number, max: number, px: number, min: number, wt: number): [string[], number] {
  for (let z = px; z > min; z -= 4) { g.font = font(z, wt); const r = wrap(g, s, w, 99); if (r.length <= max) return [r, z]; }
  g.font = font(min, wt); return [wrap(g, s, w, max), min];
}
export function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export const font = (px: number, wt = 700) => `${wt} ${px}px ${FONT}`;
/** draw a card (R42: the dark knowledge card — layer tag, name, one line, 3 points, brand + QR); returns the canvas */
export function draw(d: Data, fmt: Fmt, doc: Document = document): HTMLCanvasElement {
  const [W, H] = SIZE[fmt], cv = doc.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!, k = fmt === 'story' ? 1 : 0.82, M = 80, IW = W - 2 * M;
  const bg = g.createLinearGradient(0, 0, W * 0.4, H); bg.addColorStop(0, '#16235f'); bg.addColorStop(0.6, '#0b1230'); bg.addColorStop(1, '#080d24');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.14; g.strokeStyle = d.lvC; g.lineWidth = 30; g.beginPath(); g.arc(W - 110, 170, 220, 0, 7); g.stroke(); g.globalAlpha = 1;
  g.textBaseline = 'top'; let y = M + 10 * k;
  /* the layer chip */
  g.font = font(44 * k, 800); const cw = g.measureText(d.lv).width + 52; rr(g, M, y, cw, 72 * k, 18); g.fillStyle = d.lvC; g.fill();
  g.fillStyle = '#fff'; g.fillText(d.lv, M + 26, y + 13 * k); y += 110 * k;
  /* one honest line (a real milestone, or the "in one line" opener) */
  if (d.head) { g.fillStyle = '#ffd34d'; g.font = font(48 * k, 800); for (const s of wrap(g, `${d.badge} ${d.head}`.trim(), IW, 2)) { g.fillText(s, M, y); y += 64 * k; } y += 14 * k; }
  /* the name and its one line */
  g.fillStyle = '#ffffff'; { const [ls, z] = fit(g, d.name, IW, 2, 108 * k, 64 * k, 900); for (const s of ls) { g.fillText(s, M, y); y += z * 1.17; } } y += 6 * k;
  g.fillStyle = '#c8d6ff'; g.font = font(46 * k, 600); for (const s of wrap(g, d.idea, IW, fmt === 'story' ? 4 : 3)) { g.fillText(s, M, y); y += 64 * k; } y += 34 * k;
  /* three points, gold rule on the left */
  const qS = fmt === 'story' ? 330 : 270, foot = qS + 40;
  for (const p of d.pts.slice(0, 3)) {
    g.font = font(50 * k, 700); const ls = wrap(g, p, IW - 80, 3), bh = (40 + ls.length * 66) * k;
    if (y + bh > H - M - foot) break;
    rr(g, M, y, IW, bh, 22); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.fillStyle = '#ffd34d'; rr(g, M, y, 12, bh, 6); g.fill();
    g.fillStyle = '#ffffff'; ls.forEach((s, j) => g.fillText(s, M + 48, y + (22 + j * 66) * k)); y += bh + 24 * k;
  }
  /* brand at the bottom left, QR at the bottom right */
  const m = qr(d.url), cell = Math.floor(qS / (m.length + 8)), qs = cell * (m.length + 8), qx = W - M - qs, qy = H - M - qs;
  rr(g, qx - 12, qy - 12, qs + 24, qs + 24, 28); g.fillStyle = '#ffffff'; g.fill();
  g.fillStyle = '#111827'; m.forEach((row, r) => row.forEach((on, c) => { if (on) g.fillRect(qx + (c + 4) * cell, qy + (r + 4) * cell, cell, cell); }));
  const tw = qx - 50 - M; let ty = qy + qs - (66 + 56 + 44) * k;
  g.fillStyle = '#ffffff'; g.fillText(fit(g, d.site, tw, 1, 58 * k, 36 * k, 900)[0][0] ?? '', M, ty); ty += 72 * k;
  g.fillStyle = '#9fb3e6'; g.font = font(42 * k, 600); g.fillText(wrap(g, d.sub, tw, 1)[0] ?? '', M, ty); ty += 58 * k;
  g.fillStyle = '#ffd34d'; g.font = font(32 * k, 700); g.fillText(wrap(g, d.scan, tw, 1)[0] ?? '', M, ty);
  return cv;
}
export const png = (cv: HTMLCanvasElement) => new Promise<Blob>((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'));
