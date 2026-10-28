/* R38: the share-card drawing, the explorer's knowledge-card share image. */
import { qr } from './qr';
import type { Tx } from '../txt';

export const SITE = 'https://superjackman.github.io/SI/';
export const SITE_N: Tx = ['大白话拆解 AI', 'AI, explained plainly'];
export type Fmt = 'story' | 'post';
export const SIZE: Record<Fmt, [number, number]> = { story: [1080, 1920], post: [1080, 1350] };
export interface Data { site: string; url: string; lv: string; lvC: string; path: string; icon: string; name: string; idea: string; parts: { n: string; s: string }[]; co: string; why: string; head: string; badge: string; scan: string; how: string; whyT: string }
export const words = (d: Data) => [d.head, d.name, d.idea, ...d.parts.map((p) => `${p.n}: ${p.s}`), d.co, d.why].filter(Boolean).join('\n');

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
export function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export const font = (px: number, wt = 700) => `${wt} ${px}px ${FONT}`;
/** draw a card; returns the canvas */
export function draw(d: Data, fmt: Fmt, doc: Document = document): HTMLCanvasElement {
  const [W, H] = SIZE[fmt], cv = doc.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!, k = fmt === 'story' ? 1 : 0.8, M = 64, IW = W - 2 * M;
  /* the background: the level's colour fading to white, two soft rings */
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, d.lvC); bg.addColorStop(0.42, '#f5f0ff'); bg.addColorStop(1, '#ffffff');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.18; g.strokeStyle = '#ffffff'; g.lineWidth = 28; g.beginPath(); g.arc(W - 120, 160, 210, 0, 7); g.stroke(); g.beginPath(); g.arc(90, H * 0.36, 130, 0, 7); g.stroke(); g.globalAlpha = 1;
  let y = M;
  /* the site name */
  g.fillStyle = '#ffffff'; g.font = font(40 * k, 800); g.textBaseline = 'top'; g.fillText('◆ ' + d.site, M, y); y += 64 * k;
  /* a milestone line */
  if (d.head) {
    g.font = font(64 * k, 900); const hl = wrap(g, `${d.badge} ${d.head}`.trim(), IW, 2);
    for (const s of hl) { g.fillText(s, M, y); y += 80 * k; } y += 10 * k;
  }
  /* the white panel */
  const top = y + 10 * k; rr(g, M - 24, top, IW + 48, H - top - (fmt === 'story' ? 470 : 330) * k, 44); g.fillStyle = 'rgba(255,255,255,.96)'; g.shadowColor = 'rgba(76,29,149,.25)'; g.shadowBlur = 40; g.fill(); g.shadowBlur = 0;
  y = top + 40 * k;
  /* the level chip and the path */
  g.font = font(32 * k, 800); const cw = g.measureText(d.lv).width + 44; rr(g, M, y, cw, 54 * k, 27 * k); g.fillStyle = d.lvC; g.fill();
  g.fillStyle = '#fff'; g.fillText(d.lv, M + 22, y + 10 * k); y += 70 * k;
  g.font = font(28 * k, 600); g.fillStyle = '#6b5b95'; for (const s of wrap(g, d.path, IW, 2)) { g.fillText(s, M, y); y += 38 * k; } y += 14 * k;
  /* the station */
  g.fillStyle = '#2e1065'; g.font = font(76 * k, 900); for (const s of wrap(g, `${d.icon} ${d.name}`, IW, 2)) { g.fillText(s, M, y); y += 90 * k; } y += 4 * k;
  g.font = font(44 * k, 700); g.fillStyle = '#3b0764'; for (const s of wrap(g, d.idea, IW, fmt === 'story' ? 4 : 3)) { g.fillText(s, M, y); y += 60 * k; } y += 22 * k;
  /* the parts as boxes with arrows between them (top to bottom on a story, left to right on a post) */
  const n = d.parts.length;
  if (fmt === 'story') {
    for (let i = 0; i < n; i++) {
      const p = d.parts[i]!; g.font = font(30, 600); const sl = wrap(g, p.s, IW - 70, 2), bh = 70 + sl.length * 40;
      rr(g, M, y, IW, bh, 28); g.fillStyle = '#f3e8ff'; g.fill(); g.lineWidth = 4; g.strokeStyle = d.lvC; g.stroke();
      g.fillStyle = d.lvC; g.beginPath(); g.arc(M + 34, y + 38, 14, 0, 7); g.fill();
      g.fillStyle = '#3b0764'; g.font = font(38, 800); g.fillText(p.n, M + 62, y + 18);
      g.font = font(30, 600); g.fillStyle = '#4c1d95'; sl.forEach((s, j) => g.fillText(s, M + 62, y + 66 + j * 40));
      y += bh;
      if (i + 1 < n) { const cx = W / 2; g.fillStyle = d.lvC; g.fillRect(cx - 4, y + 4, 8, 26); g.beginPath(); g.moveTo(cx - 20, y + 28); g.lineTo(cx + 20, y + 28); g.lineTo(cx, y + 50); g.closePath(); g.fill(); y += 56; }
    }
  } else if (n) {
    const gap = 46, bw = (IW - gap * (n - 1)) / n; let bh = 0; g.font = font(30, 800);
    const ls = d.parts.map((p) => wrap(g, p.n, bw - 28, 3)); bh = 34 + Math.max(...ls.map((l) => l.length)) * 38;
    d.parts.forEach((_, i) => {
      const bx = M + i * (bw + gap); rr(g, bx, y, bw, bh, 24); g.fillStyle = '#f3e8ff'; g.fill(); g.lineWidth = 4; g.strokeStyle = d.lvC; g.stroke();
      g.fillStyle = '#3b0764'; g.font = font(30, 800); ls[i]!.forEach((s, j) => { g.textAlign = 'center'; g.fillText(s, bx + bw / 2, y + 18 + j * 38); }); g.textAlign = 'left';
      if (i + 1 < n) { const ax = bx + bw + 6, ay = y + bh / 2; g.fillStyle = d.lvC; g.beginPath(); g.moveTo(ax, ay - 16); g.lineTo(ax + gap - 12, ay); g.lineTo(ax, ay + 16); g.closePath(); g.fill(); }
    });
    y += bh;
  }
  y += 26 * k;
  /* how and why */
  const box = (lab: string, s: string, c: string, bgc: string, max: number) => {
    g.font = font(32 * k, 600); const sl = wrap(g, s, IW - 48, max), bh = (64 + sl.length * 44) * k;
    rr(g, M, y, IW, bh, 26); g.fillStyle = bgc; g.fill();
    g.fillStyle = c; g.font = font(28 * k, 800); g.fillText(lab, M + 24, y + 16 * k);
    g.font = font(32 * k, 600); g.fillStyle = '#1f2937'; sl.forEach((t, j) => g.fillText(t, M + 24, y + (56 + j * 44) * k)); y += bh + 16 * k;
  };
  box('🔗 ' + d.how, d.co, '#0f766e', '#e6fbf7', fmt === 'story' ? 3 : 2);
  box('💡 ' + d.whyT, d.why, '#a16207', '#fff7e0', fmt === 'story' ? 3 : 2);
  /* the QR code and the address at the bottom */
  const m = qr(d.url), q = (fmt === 'story' ? 330 : 250), cell = Math.floor(q / (m.length + 8)), qs = cell * (m.length + 8), qx = W - M - qs, qy = H - M - qs;
  rr(g, qx - 12, qy - 12, qs + 24, qs + 24, 28); g.fillStyle = '#ffffff'; g.fill();
  g.fillStyle = '#111827'; m.forEach((row, r) => row.forEach((on, c) => { if (on) g.fillRect(qx + (c + 4) * cell, qy + (r + 4) * cell, cell, cell); }));
  const tx0 = M, tw = qx - 40 - M;
  g.fillStyle = '#3b0764'; g.font = font(44 * k, 900); let ty = qy + 10; for (const s of wrap(g, d.site, tw, 2)) { g.fillText(s, tx0, ty); ty += 56 * k; }
  g.font = font(32 * k, 700); g.fillStyle = '#6d28d9'; for (const s of wrap(g, d.scan, tw, 2)) { g.fillText(s, tx0, ty); ty += 44 * k; }
  g.font = font(26 * k, 600); g.fillStyle = '#6b7280'; g.fillText('superjackman.github.io/SI', tx0, ty + 6);
  return cv;
}
export const png = (cv: HTMLCanvasElement) => new Promise<Blob>((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'));
