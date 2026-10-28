/* R40: the achievement share card (成就卡): the learner's real record (cards opened, right answers, days in a row),
   the knowledge point they learned last, and the QR code. No quiz questions, no made-up numbers. */
import { qr } from '../l4/share/qr';
import { SIZE, font, rr, wrap, type Fmt } from '../l4/share/draw';
export interface Ach { site: string; url: string; title: string; big: string; stats: string; last: string; lastN: string; lastIdea: string; invite: string; scan: string }
export const achWords = (a: Ach) => [a.title, a.big, a.stats, a.last && `${a.last}: ${a.lastN}`, a.lastIdea, a.invite].filter(Boolean).join('\n');
export function drawAch(a: Ach, fmt: Fmt, doc: Document = document): HTMLCanvasElement {
  const [W, H] = SIZE[fmt], cv = doc.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!, k = fmt === 'story' ? 1 : 0.8, M = 64, IW = W - 2 * M;
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b1640'); bg.addColorStop(0.55, '#16245c'); bg.addColorStop(1, '#050a1a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.16; g.strokeStyle = '#ffd77a'; g.lineWidth = 26; g.beginPath(); g.arc(W - 130, 190, 220, 0, 7); g.stroke(); g.globalAlpha = 1;
  g.textBaseline = 'top'; let y = M;
  g.fillStyle = '#ffe08a'; g.font = font(40 * k, 800); g.fillText('◆ ' + a.site, M, y); y += 90 * k;
  g.fillStyle = '#ffffff'; g.font = font(60 * k, 900); for (const s of wrap(g, a.title, IW, 2)) { g.fillText(s, M, y); y += 76 * k; } y += 40 * k;
  /* a pyramid of five layers (the site's map), drawn, not a picture */
  const py = y, ph = 300 * k; for (let i = 0; i < 5; i++) { const w = IW * (0.36 + i * 0.16), h = ph / 5 - 10, x = (W - w) / 2, yy = py + i * (ph / 5);
    rr(g, x, yy, w, h, 14); g.fillStyle = ['#7c3aed', '#4f46e5', '#2563eb', '#0d9488', '#0891b2'][i]!; g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1; }
  y = py + ph + 50 * k;
  g.fillStyle = '#ffe08a'; g.font = font(78 * k, 900); for (const s of wrap(g, a.big, IW, 2)) { g.fillText(s, M, y); y += 96 * k; }
  g.fillStyle = '#e6eeff'; g.font = font(44 * k, 700); for (const s of wrap(g, a.stats, IW, 2)) { g.fillText(s, M, y); y += 60 * k; } y += 30 * k;
  if (a.lastN) {
    g.font = font(34 * k, 600); const il = wrap(g, a.lastIdea, IW - 56, fmt === 'story' ? 3 : 2), bh = (120 + il.length * 48) * k;
    rr(g, M, y, IW, bh, 30); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#3a63d0'; g.stroke();
    g.fillStyle = '#9cc8ff'; g.font = font(30 * k, 700); g.fillText(a.last, M + 28, y + 22 * k);
    g.fillStyle = '#ffffff'; g.font = font(42 * k, 900); g.fillText(wrap(g, a.lastN, IW - 56, 1)[0] ?? '', M + 28, y + 62 * k);
    g.fillStyle = '#d6e4ff'; g.font = font(34 * k, 600); il.forEach((s, j) => g.fillText(s, M + 28, y + (116 + j * 48) * k)); y += bh + 30 * k;
  }
  g.fillStyle = '#8fe3ff'; g.font = font(48 * k, 800); g.fillText(a.invite, M, y);
  const m = qr(a.url), q = fmt === 'story' ? 330 : 250, cell = Math.floor(q / (m.length + 8)), qs = cell * (m.length + 8), qx = W - M - qs, qy = H - M - qs;
  rr(g, qx - 12, qy - 12, qs + 24, qs + 24, 28); g.fillStyle = '#ffffff'; g.fill();
  g.fillStyle = '#111827'; m.forEach((row, r) => row.forEach((on, c) => { if (on) g.fillRect(qx + (c + 4) * cell, qy + (r + 4) * cell, cell, cell); }));
  const tw = qx - 40 - M; let ty = qy + 10; g.fillStyle = '#ffffff'; g.font = font(44 * k, 900); for (const s of wrap(g, a.site, tw, 2)) { g.fillText(s, M, ty); ty += 56 * k; }
  g.font = font(32 * k, 700); g.fillStyle = '#ffe08a'; for (const s of wrap(g, a.scan, tw, 2)) { g.fillText(s, M, ty); ty += 44 * k; }
  g.font = font(26 * k, 600); g.fillStyle = '#9cb4ec'; g.fillText('superjackman.github.io/SI', M, ty + 6);
  return cv;
}
