/* Extra drag pictures: loss, XOR, shrinking gradients, word angle, LoRA rank, KV cache, RAG hit.
   Each one can be paused. Loaded with the quiz chunk, not on first paint. */
import { tx, type L } from '../l4/txt';
import type { DemoK } from './data';
import type { DemoS } from './ui';

const EXTRA = ['mse', 'xor', 'bp', 'emb', 'lora', 'kv', 'rag'] as const;
export type ExtraK = (typeof EXTRA)[number];
export const isExtra = (k: DemoK): k is ExtraK => (EXTRA as readonly string[]).includes(k);
const TITLE: Record<ExtraK, readonly [string, string]> = {
  mse: ['差的平方', 'Squared gap'],
  xor: ['一条线切不开', 'One line fails'],
  bp: ['坡度逐层变小', 'The slope shrinks'],
  emb: ['两个方向', 'Two directions'],
  lora: ['秩和参数量', 'Rank and parameter count'],
  kv: ['记过的不用重算', 'Stored values are not recomputed'],
  rag: ['哪一块最像', 'Which chunk is closest'],
};
export const extraTitle = (k: ExtraK) => TITLE[k];

const num = (v: number, d = 0) => { const s = Math.abs(v).toFixed(d).replace(/\.?0+$/, ''); return (v < 0 ? '−' : '') + (s || '0'); };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function extraCtl(k: DemoK, s: DemoS, l: L): string | null {
  if (!isExtra(k)) return null;
  const z = (a: string, b: string) => tx([a, b], l);
  const sl = (key: string, lab: string, a: number, b: number, st: number, v: number, out: string) =>
    `<label class="vf-sl"><span>${esc(lab)}</span><input type="range" data-vs="${key}" min="${a}" max="${b}" step="${st}" value="${v}" aria-label="${esc(lab)}"><output>${out}</output></label>`;
  const play = s.play ? 1 : 0;
  const btn = `<button type="button" class="l4-b ui-sec" data-vs="play" aria-pressed="${play ? 'true' : 'false'}">${play ? z('暂停', 'Pause') : z('播放', 'Play')}</button>`;
  const pred = s.pred ?? 4, ang = s.ang ?? 40, layer = s.layer ?? 0, rank = s.rank ?? 4, len = s.len ?? 4, hit = s.hit ?? 1;
  if (k === 'mse') return sl('pred', z('预测值', 'Prediction'), 0, 10, 0.5, pred, num(pred, 1)) + btn;
  if (k === 'xor') return sl('ang', z('直线角度', 'Line angle'), 15, 75, 1, ang, num(ang) + '°') + btn;
  if (k === 'bp') return sl('layer', z('层', 'Layer'), 0, 3, 1, layer, num(layer)) + btn;
  if (k === 'emb') return sl('ang', z('夹角', 'Angle'), 0, 180, 5, ang, num(ang) + '°') + btn;
  if (k === 'lora') return sl('rank', z('秩 r', 'Rank r'), 1, 32, 1, rank, num(rank)) + btn;
  if (k === 'kv') return sl('len', z('已生成的词', 'Tokens so far'), 1, 8, 1, len, num(len)) + btn;
  return sl('hit', z('问题偏向', 'Query leans toward'), 0, 3, 1, hit, num(hit)) + btn;
}

function svg(body: string) {
  return `<svg class="vf-plot" viewBox="0 0 300 120" aria-hidden="true">${body}</svg>`;
}

export function extraOut(k: ExtraK, s: DemoS, l: L): string {
  const z = (a: string, b: string) => tx([a, b], l);
  const frame = s.frame ?? 0;
  if (k === 'mse') {
    const pred = s.pred ?? 4, gap = pred - 5, pen = gap * gap;
    const x = 20 + (pred / 10) * 260;
    return `${svg(`<line x1="20" y1="90" x2="280" y2="90" stroke="var(--link)"/><circle cx="150" cy="90" r="6" fill="var(--good-bg)"/><circle cx="${x.toFixed(1)}" cy="90" r="6" fill="var(--navy)"/><rect x="20" y="${(70 - Math.min(60, pen * 4)).toFixed(1)}" width="16" height="${Math.min(60, pen * 4).toFixed(1)}" fill="var(--bad-bg)"/>`)}<p class="vf-o">${z(`真实值 5 · (预测 − 5)² = ${num(pen, 2)}`, `True value 5 · (prediction − 5)² = ${num(pen, 2)}`)}</p><p class="vf-n">${z('差先平方，大的错罚得更狠。', 'Square the gap. A big miss costs more.')}</p>`;
  }
  if (k === 'xor') {
    const ang = ((s.ang ?? 40) * Math.PI) / 180;
    const pts: [number, number, number][] = [[70, 30, 0], [210, 30, 1], [70, 96, 1], [210, 96, 0]];
    const dx = Math.cos(ang) * 120, dy = Math.sin(ang) * 70;
    const dots = pts.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c ? 'var(--good-bg)' : 'var(--bad)'}"/>`).join('');
    return `${svg(`${dots}<line x1="${150 - dx}" y1="${66 - dy}" x2="${150 + dx}" y2="${66 + dy}" stroke="var(--highlight)" stroke-width="2" stroke-dasharray="4 3"/>`)}<p class="vf-n">${z('四个角两种颜色。一条直线总会切错一个角。', 'Two colours on four corners. A straight line always mis-cuts one corner.')}</p>`;
  }
  if (k === 'bp') {
    const layer = Math.round(s.layer ?? (s.play ? frame % 4 : 0));
    const bars = [0, 1, 2, 3].map((i) => { const h = 72 / 2 ** i; return `<rect x="${30 + i * 68}" y="${100 - h}" width="40" height="${h}" rx="4" fill="${i === layer ? 'var(--navy)' : 'var(--link)'}"/>`; }).join('');
    const g = 8 / 2 ** layer;
    return `${svg(bars)}<p class="vf-o">${z(`第 ${layer} 层的坡度`, `Slope at layer ${layer}`)} = ${num(g, 2)}</p><p class="vf-n">${z('每过一层大约减半。播放时高亮的层会往后走。', 'Each layer about halves it. While playing, the highlight steps back.')}</p>`;
  }
  if (k === 'emb') {
    const ang = ((s.ang ?? 40) * Math.PI) / 180, dot = Math.cos(ang);
    const x2 = 70 + Math.cos(ang) * 90, y2 = 90 - Math.sin(ang) * 70;
    return `${svg(`<line x1="70" y1="90" x2="200" y2="90" stroke="var(--highlight)" stroke-width="3"/><line x1="70" y1="90" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--good)" stroke-width="3"/>`)}<p class="vf-o">${z('夹角', 'Angle')} ${num(s.ang ?? 40)}° · ${z('点积', 'dot')} = ${num(dot, 2)}</p><p class="vf-n">${z('方向越齐，点积越接近 1。', 'The closer the directions, the nearer the dot product is to 1.')}</p>`;
  }
  if (k === 'lora') {
    const r = s.rank ?? 4, d = 4096, side = 2 * d * r, full = d * d, pct = (100 * side) / full;
    const w = Math.max(4, Math.min(260, pct * 8));
    return `${svg(`<rect x="20" y="30" width="260" height="22" rx="4" fill="var(--link)"/><rect x="20" y="68" width="${w.toFixed(1)}" height="22" rx="4" fill="var(--navy)"/>`)}<p class="vf-o">2 × 4096 × r = ${side.toLocaleString('en-US')} · ${num(pct, 2)}%</p><p class="vf-n">${z('黄条是要训练的支路，蓝条是整块矩阵。秩越小，黄条越短。', 'Yellow is the side path that trains. Blue is the whole matrix. A smaller rank makes the yellow bar shorter.')}</p>`;
  }
  if (k === 'kv') {
    const len = Math.round(s.len ?? 4), step = s.play ? (frame % len) + 1 : len;
    const cells = Array.from({ length: len }, (_, i) => `<rect x="${16 + i * 34}" y="40" width="26" height="36" rx="4" fill="${i < step - 1 ? 'var(--good-bg)' : i === step - 1 ? 'var(--highlight)' : 'var(--link)'}"/>`).join('');
    const tri = (len * (len + 1)) / 2;
    return `${svg(cells)}<p class="vf-o">${z('有缓存', 'With a cache')} ${len} · ${z('没有缓存', 'Without one')} ${tri}</p><p class="vf-n">${z('绿色是已经记过的。播放时只新算当前这个词。', 'Green is already stored. While playing, only the current token is computed.')}</p>`;
  }
  const hit = Math.round(s.hit ?? 1);
  const scores = [0.2, 0.85, 0.4, 0.55].map((v, i) => (i === hit ? Math.min(0.95, v + 0.1) : v));
  const bars = scores.map((v, i) => `<rect x="${24 + i * 70}" y="${100 - v * 70}" width="36" height="${v * 70}" rx="4" fill="${i === scores.indexOf(Math.max(...scores)) ? 'var(--highlight)' : 'var(--link)'}"/>`).join('');
  return `${svg(bars)}<p class="vf-n">${z('最高的那一块进提示词。参数不用改。', 'The highest chunk goes into the prompt. No parameter changes.')}</p>`;
}
