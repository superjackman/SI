/* R39: the page ids, hashes and order of layers 1, 2, 3 and 5 (small: it ships in the first-load chunk; the pages
   themselves are lazy, one chunk per layer). Hashes: #L1, #L1/3; #L3, #L3/T2, #L3/U4, #L3/P, #L3/X; #L5, #L5/M2b. */
import type { Tx } from '../l4/txt';

export const LX: Record<1 | 2 | 3 | 5, string[]> = {
  1: ['L1', 'L1-1', 'L1-2', 'L1-3', 'L1-4', 'L1-5', 'L1-6'],
  2: ['L2', 'L2-1', 'L2-2', 'L2-3', 'L2-4', 'L2-5', 'L2-6', 'L2-7'],
  3: ['L3', 'T1', 'T2', 'T3', 'T4', 'T5', 'L3-P', 'U1', 'U2', 'U3', 'L3-X', 'U4', 'U5'],
  5: ['L5', 'M1a', 'M1b', 'M2a', 'M2b', 'M2c', 'M2d', 'M3a', 'M3b', 'M3c', 'M4a', 'M4b', 'M4c', 'M5a', 'M5b', 'M6a', 'M6b', 'M6c', 'M7a', 'M7b', 'M7c', 'M8'],
};
export const LX_ALL = [...LX[1], ...LX[2], ...LX[3], ...LX[5]];
const SET = new Set(LX_ALL);
export const isLx = (id: string) => SET.has(id);
export function layerOf(id: string): 1 | 2 | 3 | 5 {
  if (/^L1/.test(id)) return 1; if (/^L2/.test(id)) return 2; if (/^(L3|T\d|U\d)/.test(id)) return 3; return 5;
}
export function lxHash(id: string): string {
  if (/^L\d$/.test(id)) return '#' + id;
  if (/^L[12]-\d$/.test(id)) return '#' + id.replace('-', '/');
  if (id === 'L3-P') return '#L3/P'; if (id === 'L3-X') return '#L3/X';
  return `#L${layerOf(id)}/${id}`;
}
/** the raw id from the L4 hash parser ('L1/3', 'L3/T2', 'L5/M1a') → page id, or null */
export function lxFrom(raw: string): string | null {
  const m = /^L([1235])(?:\/(\w+))?$/.exec(raw); if (!m) return null;
  const n = Number(m[1]) as 1 | 2 | 3 | 5, s = m[2];
  const id = !s ? 'L' + n : n <= 2 && /^\d$/.test(s) ? `L${n}-${s}` : n === 3 && (s === 'P' || s === 'X') ? 'L3-' + s : s;
  return SET.has(id) && layerOf(id) === n ? id : null;
}
/** the next page in reading order (the last page of a layer leads into the next layer) */
export function lxNext(id: string): string {
  const n = layerOf(id), o = LX[n], i = o.indexOf(id);
  if (i < o.length - 1) return lxHash(o[i + 1]!);
  return n === 1 ? '#L2' : n === 2 ? '#L3' : n === 3 ? '#L4' : '#home';
}
export function lxPrev(id: string): string {
  const n = layerOf(id), o = LX[n], i = o.indexOf(id);
  return i > 0 ? lxHash(o[i - 1]!) : '#home';
}
/** short names for the map sheet */
export const LX_N: Record<string, Tx> = {
  L1: ['全貌', 'Overview'], 'L1-1': ['①你说需求', '① You ask'], 'L1-2': ['②它拆步骤', '② It plans steps'], 'L1-3': ['③调工具', '③ It calls tools'], 'L1-4': ['④把结果告诉你', '④ It reports back'],
  'L1-5': ['展开：AI 助手', 'Open: AI assistant'], 'L1-6': ['展开：工具箱', 'Open: toolbox'],
  L2: ['全貌', 'Overview'], 'L2-1': ['①感知', '① Perceive'], 'L2-2': ['②规划', '② Plan'], 'L2-3': ['③调工具', '③ Call a tool'], 'L2-4': ['④观察结果', '④ Observe'], 'L2-5': ['⑤记忆', '⑤ Remember'],
  'L2-6': ['展开：大模型', 'Open: the LLM'], 'L2-7': ['展开：记忆', 'Open: memory'],
  L3: ['全貌', 'Overview'], T1: ['①海量文字', '① Mass text'], T2: ['②生成分词字典', '② Build the dictionary'], T3: ['③预训练', '③ Pre-training'], T4: ['④微调', '④ Fine-tuning'], T5: ['⑤对齐', '⑤ Alignment'],
  'L3-P': ['展开：模型参数', 'Open: parameters'], U1: ['①你的文字进来', '① Your text comes in'], U2: ['②分词', '② Tokenize'], U3: ['③用参数计算', '③ Compute with parameters'],
  'L3-X': ['展开：Transformer', 'Open: Transformer'], U4: ['④得到下一个字', '④ The next char'], U5: ['⑤接到末尾，再来一轮', '⑤ Append and go again'],
  L5: ['数学地图', 'Maths map'], M1a: ['M1 ①一串数字就是一个箭头', 'M1 ① Numbers are an arrow'], M1b: ['M1 ②意思接近，箭头也接近', 'M1 ② Close meaning, close arrows'],
  M2a: ['M2 ①两个箭头有多对齐', 'M2 ① How aligned are two arrows'], M2b: ['M2 ②对应相乘再相加', 'M2 ② Multiply pairs, add'], M2c: ['M2 ③越大越相似，垂直为 0', 'M2 ③ Bigger = more alike; 0 = perpendicular'], M2d: ['M2 ④除以 √d 缩放', 'M2 ④ Divide by √d'],
  M3a: ['M3 ①向量叠成表格', 'M3 ① Vectors stacked into a table'], M3b: ['M3 ②行乘列得到一个格子', 'M3 ② Row × column = one cell'], M3c: ['M3 ③一次把所有字都算完', 'M3 ③ All chars in one go'],
  M4a: ['M4 ①原始分数，可正可负', 'M4 ① Raw scores, + or −'], M4b: ['M4 ②先变成正数 eˣ', 'M4 ② Make them positive: eˣ'], M4c: ['M4 ③除以总和变百分比', 'M4 ③ Divide by the total'],
  M5a: ['M5 ①正确答案猜了多少', 'M5 ① Odds on the right answer'], M5b: ['M5 ②误差 ＝ −ln 概率', 'M5 ② Error = −ln odds'],
  M6a: ['M6 ①误差像山谷', 'M6 ① The error is a valley'], M6b: ['M6 ②坡度告诉你往哪边走', 'M6 ② The slope shows the way'], M6c: ['M6 ③一步步下山', 'M6 ③ Step by step downhill'],
  M7a: ['M7 ①一层层传动', 'M7 ① Layer drives layer'], M7b: ['M7 ②总影响等于各层相乘', 'M7 ② Total = product of layers'], M7c: ['M7 ③反向传播', 'M7 ③ Backpropagation'],
  M8: ['M8 均值、方差、层归一化', 'M8 Mean, variance, LayerNorm'],
};
/** the layers whose pages are built (the rest show 即将上线) */
export const LIVE: readonly number[] = [1, 2, 3, 4, 5];
/** DOM pieces the lx view adds to the stage */
export const LX_SEL = '.lx-lb,.lx-el,.lx-fl,.lx-pn,.lx-cp';
