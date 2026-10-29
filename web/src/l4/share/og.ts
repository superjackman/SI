/* R42 OG / OG-K: the 1200×630 link-preview pictures (og.png for the site, og/<id>.png per card).
   Only scripts/og-cards.mjs imports this (in a browser, through Vite's dev server); the app never loads it. */
import { qr } from './qr';
import { fit, font, rr, wrap, type Data } from './draw';

const W = 1200, H = 630;
const LV: [string, string, string][] = [['第1层', '我怎么用 AI', '#0891b2'], ['第2层', 'AI 助手怎么工作', '#0d9488'], ['第3层', '大模型怎么得来', '#4f46e5'], ['第4层', 'Transformer 内部', '#2563eb'], ['第5层', '背后的数学', '#7c3aed']];
function base(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, W * 0.6, H); bg.addColorStop(0, '#16235f'); bg.addColorStop(0.6, '#0b1230'); bg.addColorStop(1, '#080d24'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.78, H * 0.45, 20, W * 0.78, H * 0.45, 520); glow.addColorStop(0, 'rgba(79,70,229,.28)'); glow.addColorStop(1, 'rgba(79,70,229,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.textBaseline = 'top'; return [cv, g];
}
/** og.png: the site — name, gold line, what it covers, and the five-layer pyramid */
export function site(ic: CanvasImageSource): HTMLCanvasElement {
  const [cv, g] = base();
  g.drawImage(ic, 64, 124, 104, 104);
  g.fillStyle = '#fff'; g.font = font(92, 900); g.fillText('大白话拆解 AI', 60, 248);
  g.fillStyle = '#ffd34d'; g.font = font(50, 800); g.fillText('一层层看懂 AI', 64, 362);
  g.fillStyle = '#c8d6ff'; g.font = font(29, 500); g.fillText('从「我怎么用」到 Transformer 内部和背后的数学', 64, 452); g.fillText('点一点就能看懂 · 不用会编程', 64, 496);
  LV.forEach(([n, t, c], i) => {
    const w = 250 + i * 40, x = 960 - w / 2, y = 112 + i * 66, bar = g.createLinearGradient(x, 0, x + w, 0);
    bar.addColorStop(0, c); bar.addColorStop(1, '#1e3a8a'); g.fillStyle = bar; rr(g, x, y, w, 52, 10); g.fill();
    g.font = font(25, 800); const a = g.measureText(n + ' ').width; g.font = font(25, 500); const b = g.measureText(t).width;
    g.fillStyle = '#fff'; g.font = font(25, 800); g.fillText(n, 960 - (a + b) / 2, y + 12); g.font = font(25, 500); g.fillText(t, 960 - (a + b) / 2 + a, y + 12);
  });
  return cv;
}
/** og/<id>.png: one card — layer chip, name, its one line, three points; the brand and a QR to the card on the right */
export function card(d: Data, ic: CanvasImageSource): HTMLCanvasElement {
  const [cv, g] = base(), M = 60, IW = 640;
  g.font = font(26, 800); const cw = g.measureText(d.lv).width + 32; g.fillStyle = d.lvC; rr(g, M, 46, cw, 46, 10); g.fill(); g.fillStyle = '#fff'; g.fillText(d.lv, M + 16, 54);
  let y = 112; g.fillStyle = '#fff'; { const [ls, z] = fit(g, d.name, IW, 1, 78, 46, 900); g.fillText(ls[0] ?? '', M, y); y += z * 1.25; }
  g.fillStyle = '#c8d6ff'; g.font = font(27, 500); for (const s of wrap(g, d.idea, IW, 2)) { g.fillText(s, M, y); y += 38; } y += 18;
  for (const p of d.pts.slice(0, 3)) {
    g.font = font(27, 600); const ls = wrap(g, p, IW - 56, 2), bh = 22 + ls.length * 36; if (y + bh > H - 40) break;
    rr(g, M, y, IW, bh, 12); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.fillStyle = '#ffd34d'; rr(g, M, y, 6, bh, 3); g.fill();
    g.fillStyle = '#fff'; ls.forEach((s, j) => g.fillText(s, M + 30, y + 11 + j * 36)); y += bh + 14;
  }
  const cx = 1010; g.drawImage(ic, cx - 58, 92, 116, 116);
  g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = font(34, 900); g.fillText(d.site, cx, 228); g.fillStyle = '#9fb3e6'; g.font = font(24, 500); g.fillText(d.sub, cx, 274);
  const m = qr(d.url), qs0 = 196, cell = Math.floor(qs0 / (m.length + 4)), qs = cell * (m.length + 4), qx = cx - qs / 2, qy = 318;
  rr(g, qx - 6, qy - 6, qs + 12, qs + 12, 14); g.fillStyle = '#fff'; g.fill(); g.fillStyle = '#111827';
  m.forEach((row, r) => row.forEach((on, c) => { if (on) g.fillRect(qx + (c + 2) * cell, qy + (r + 2) * cell, cell, cell); }));
  g.fillStyle = '#ffd34d'; g.font = font(22, 700); g.fillText(d.scan, cx, qy + qs + 20); g.textAlign = 'left';
  return cv;
}
