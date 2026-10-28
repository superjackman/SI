/* R39: layer 5 — the maths behind each block. The map (L5) is the layer-4 blocks with a maths chip beside each;
   M1a–M8 are picture + text pages. Their pictures, tables and numbers are generated from the reference pages
   (every number computed by the reference script, nums.json); the one change is M6a's demo size, which is the
   real layer-4 model (7406 parameters) instead of 约 1 万. */
import type { L, Tx } from '../l4/txt';
import type { Dia, DEdge, DFrame, DLabel, DNode } from './geo';
import { lxNext } from './ids';
import type { LxPg } from './types';

interface MD { c: [string, string]; s: string; t: string; i: [string, string, string, string]; d: [number, number]; b: string; tr: boolean }
/** reference page code → layer-4 hash */
const BACK: Record<string, string> = { US3: '#L4/us/3', US8: '#L4/us/8', X1: '#L4/x/att', X2: '#L4/x/att.dot', X3: '#L4/x/att.dot.one', X5: '#L4/x/an1', TR4: '#L4/tr/4', TR5: '#L4/tr/5', TR6: '#L4/tr/6' };
/** page → knowledge card (KM01 vector … KM12 √d) */
const KM: Record<string, string> = {
  L5: 'KM01', M1a: 'KM01', M1b: 'KM01', M2a: 'KM02', M2b: 'KM02', M2c: 'KM02', M2d: 'KM12', M3a: 'KM03', M3b: 'KM03', M3c: 'KM03',
  M4a: 'KM04', M4b: 'KM05', M4c: 'KM04', M5a: 'KM07', M5b: 'KM05', M6a: 'KM08', M6b: 'KM08', M6c: 'KM10', M7a: 'KM09', M7b: 'KM09', M7c: 'KM09', M8: 'KM11',
};
const BOX: [string, Tx, Tx?][] = [
  ['out', ['下一个字的概率', 'Next-char probabilities'], ['下一个字的概率', 'Next-char probs']], ['sm', ['Softmax', 'Softmax']], ['lin', ['线性层', 'Linear layer']],
  ['an2', ['加 + 归一化', 'Add + normalise'], ['加 + 归一化', 'Add + norm']], ['ffn', ['前馈网络', 'Feed-forward']], ['an1', ['加 + 归一化', 'Add + normalise'], ['加 + 归一化', 'Add + norm']],
  ['att', ['带遮罩的多头注意力', 'Masked multi-head attention'], ['多头注意力', 'Attention']], ['emb', ['词向量 ⊕ 位置编码', 'Embedding ⊕ position'], ['词向量 ⊕ 位置', 'Embed ⊕ pos.']],
  ['tok', ['分词', 'Tokenize']], ['in', ['输入文字', 'Input text']],
];
/** the maths chips: [id, block, text, page] (reference L5-0) */
const TAG: [string, string, Tx, string][] = [
  ['g-out', 'out', ['M4 概率 · M5 交叉熵', 'M4 prob. · M5 x-entropy'], 'M5a'], ['g-sm', 'sm', ['M4 softmax', 'M4 softmax'], 'M4a'], ['g-lin', 'lin', ['M3 矩阵乘法', 'M3 matrix product'], 'M3b'],
  ['g-an2', 'an2', ['M8 归一化', 'M8 normalise'], 'M8'], ['g-ffn', 'ffn', ['M3 矩阵乘法', 'M3 matrix product'], 'M3b'], ['g-an1', 'an1', ['M8 归一化', 'M8 normalise'], 'M8'],
  ['g-att', 'att', ['M2 点积 · √d 缩放', 'M2 dot · √d scaling'], 'M2a'], ['g-at2', 'att', ['M3 矩阵 · M4 softmax', 'M3 matrix · M4 softmax'], 'M3c'], ['g-emb', 'emb', ['M1 向量', 'M1 vectors'], 'M1a'],
];
/** chip width from its text: CJK 12 px, the rest about 6.6 px, plus padding */
const tw = (s: string) => Math.ceil([...s].reduce((a, c) => a + (/[\u3000-\u9fff\uff00-\uffef]/.test(c) ? 12 : /[·⊕√]/.test(c) ? 7 : 6.6), 0) + 18);
export function dia5(l: L): Dia {
  const x1 = 10, x2 = 150, cx = (x1 + x2) / 2, bh = 22, g = 11, xt = 198, pos: Record<string, number> = {};
  const nodes: DNode[] = [], edges: DEdge[] = [], frames: DFrame[] = [], labels: DLabel[] = [];
  let y = 70; const fr: [number, number] = [0, 0];
  for (const [id] of BOX) {
    if (id === 'an2') { fr[0] = y - 4; y += 15; }
    pos[id] = y; y += bh + g;
    if (id === 'att') { fr[1] = y - g + 6; y += 8; }
  }
  frames.push({ id: 'blk', x: x1 - 6, y: fr[0], w: 186 - x1, h: fr[1] - fr[0], t: ['解码块 × 2', 'Decoder × 2'], tl: 2 });
  for (const [id, t, ts] of BOX) nodes.push({ id, x: x1, y: pos[id]!, w: x2 - x1, h: bh, t, ...(ts ? { ts } : {}), plus: id !== 'in' && id !== 'tok' && id !== 'out' });
  for (let i = 0; i + 1 < BOX.length; i++) { const a = BOX[i + 1]![0], b = BOX[i]![0]; edges.push({ id: 'e-' + a, d: `M${cx} ${pos[a]!} V${pos[b]! + bh}`, head: true }); }
  const res = (lo: string, hi: string, id: string) => {
    const ya = pos[lo]! + bh + 5, yb = pos[hi]! + bh / 2, xr = 166;
    edges.push({ id, d: `M${cx} ${ya} H${xr - 5} Q${xr} ${ya} ${xr} ${ya - 5} V${yb + 5} Q${xr} ${yb} ${xr - 5} ${yb} H${x2 + 1}`, head: true });
    labels.push({ x: xr + 9, y: (ya + yb) / 2, t: ['残差', 'resid.'], v: true, e: id });
  };
  res('att', 'an1', 'r1'); res('ffn', 'an2', 'r2');
  const T = (t: Tx) => t[l === 'zh' ? 0 : 1];
  for (const [id, b, t] of TAG) {
    const cy = pos[b]! + bh / 2 + (id === 'g-att' ? -11 : id === 'g-at2' ? 12 : 0), h = 19;
    nodes.push({ id, x: xt, y: cy - h / 2, w: Math.min(360 - 4 - xt, tw(T(t))), h, t, tag: '#5aa0ff' });
    if (id !== 'g-at2') edges.push({ id: 'd-' + id, d: `M${186} ${pos[b]! + bh / 2} H${xt}`, dash: true });
  }
  const ty = pos.tok! - 6;
  nodes.push({ id: 'trn', x: 194, y: ty, w: 162, h: 58, t: ['训练时还要（往回改）：', 'Training goes back:'], lines: [['训练时还要（往回改）：', 'Training goes back:'], ['M5 误差 → M7 链式法则', 'M5 error → M7 chain rule'], ['→ M6 梯度下降改参数', '→ M6 update params']] });
  return { x0: 0, y0: 64, x1: 360, y1: pos.in! + bh + 4, nodes, edges, frames, labels };
}

export async function page(id: string, l: L): Promise<LxPg> {
  const z = (a: string, b: string) => (l === 'zh' ? a : b);
  const L5c: [string, string | null] = [z('第5层 数学', 'Layer 5 Maths'), '#L5'];
  const chips = `<div class="lx-cps">${Array.from('天空是什么颜色？').map((c) => `<span class="c on">${c}</span>`).join('')}</div>`;
  if (id === 'L5') {
    const D = dia5(l), go: Record<string, string> = { trn: '#L5/M5a', in: '#L4', tok: '#L4', emb: '#L5/M1a', att: '#L5/M2a', an1: '#L5/M8', an2: '#L5/M8', ffn: '#L5/M3b', lin: '#L5/M3b', sm: '#L5/M4a', out: '#L5/M5a' };
    for (const [t, , , p] of TAG) go[t] = '#L5/' + p;
    return {
      id, mode: 'full', v: { dia: D, st: { trn: 'or' }, def: 'calm', edef: 'calm', np: true }, top: `<b class="lx-tt">${z('第5层：AI 背后的数学（数学地图）', 'Layer 5: the maths behind AI (map)')}</b>`,
      crumb: [[z('首页', 'Home'), '#home'], [z('第5层 数学', 'Layer 5 Maths'), null], [z('地图：每个数学点用在哪个块', 'Map: which maths each block uses'), null]], ttl: z('数学地图', 'Maths map'),
      info: [z('看清每个块背后用的是哪种数学', 'Shows the maths behind each block'), z('向量、矩阵、概率、导数 4 类，8 个点', 'Vectors, matrices, probability, derivatives: 4 kinds, 8 topics'),
        z('往上算用 M1–M4，往回改用 M5–M7', 'Going up uses M1–M4; going back uses M5–M7'), z('都是高中到大一的数学，够用就好', 'High-school to first-year maths: just enough')],
      k: KM.L5!, math: null, hint: z('点右边任一数学点进入；按顺序学点「下一步」', 'Tap any maths chip; or press Next to go in order'), dots: null, next: lxNext(id), panel: '', go,
    };
  }
  const d = ((await (l === 'zh' ? import('./m5-zh.json') : import('./m5-en.json'))).default as unknown as Record<string, MD>)[id]!;
  const TR = `<b class="lx-tt">${z('例题：天空是什么颜色？ → 蓝', 'Example: 天空是什么颜色？ (What colour is the sky?) → 蓝')}</b>`;
  return {
    id, mode: 'chart', v: null, top: d.tr ? TR : chips, crumb: [L5c, [d.c[0], null], [d.c[1], null]], ttl: d.c[1], info: d.i, k: KM[id]!, math: null,
    mg: [z(`回第4层 ${d.b} ›`, `Layer 4 ${d.b} ›`), BACK[d.b]!], hint: z('点「回第4层」看它用在哪一步', 'Tap “Layer 4” to see where it is used'), dots: d.d, next: lxNext(id),
    panel: d.t, chart: d.s, go: {},
  };
}
