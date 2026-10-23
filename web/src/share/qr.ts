/* R16: QR code drawn locally (uqr encoder, MIT, bundled into this lazy chunk only) — no external QR service, works
   offline and in mainland China. */
import { encode } from 'uqr';

/** module matrix (true = dark), with a 4-module quiet zone as the QR spec asks */
export function qrMatrix(text: string): boolean[][] {
  return encode(text, { ecc: 'M', border: 4 }).data;
}
/** RGBA pixels (black on white) of a matrix at `scale` px per module */
export function qrRGBA(m: boolean[][], scale: number): { w: number; data: Uint8ClampedArray } {
  const n = m.length, w = n * scale, d = new Uint8ClampedArray(w * w * 4).fill(255);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!m[y]?.[x]) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) { const i = ((y * scale + dy) * w + x * scale + dx) * 4; d[i] = d[i + 1] = d[i + 2] = 17; }
  }
  return { w, data: d };
}
/** PNG data URL: the QR code with the page title (and the site) underneath — what "save image" stores */
export function qrPNG(text: string, caption: string, sub: string): string {
  const m = qrMatrix(text), scale = Math.max(4, Math.floor(480 / m.length)), q = qrRGBA(m, scale);
  const c = document.createElement('canvas'), pad = 16, capH = 70;
  c.width = q.w + pad * 2; c.height = q.w + pad * 2 + capH;
  const g = c.getContext('2d'); if (!g) return '';
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.putImageData(new ImageData(q.data, q.w, q.w), pad, pad);
  g.textAlign = 'center'; g.fillStyle = '#1e1b4b';
  const font = '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",system-ui,sans-serif';
  g.font = `700 24px ${font}`; fit(g, caption, c.width - 32, c.width / 2, q.w + pad + 34);
  g.fillStyle = '#64748b'; g.font = `500 17px ${font}`; fit(g, sub, c.width - 32, c.width / 2, q.w + pad + 62);
  return c.toDataURL('image/png');
}
function fit(g: CanvasRenderingContext2D, s: string, max: number, x: number, y: number) {
  let t = s; while (t.length > 1 && g.measureText(t).width > max) t = t.slice(0, -2) + '…';
  g.fillText(t, x, y);
}
