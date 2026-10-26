/* R31: the data and the one sentence under the stage of the five new 3D scenes (Api ordering window, Loc memory box,
   Skl robot and tool cards, Bld block robot, U together / on its own). Pure functions, no DOM and no three.js, so the
   2D fallbacks, the 3D views, the cards and the unit tests share one source. Every number comes from calc.ts (the same
   figures as the API cost and memory calculators on those stops); nothing here is made up. */
import { BPW, callCost, fitVerdict, kvGB, OVER_GB, PRICES, weightsGB, type Quant } from './calc';

type Lang = 'zh' | 'en';
const T = (L: Lang, zh: string, en: string) => (L === 'en' ? en : zh);

/* ---------- 1. Api: one request through the ordering window ---------- */
/** a sample request: 1,000 tokens in (the question) and 500 tokens out (the answer), on the first price of calc.ts */
export const API_IN = 1000, API_OUT = 500;
export const API_P = PRICES[0]!;
/** 元 for one sample request (deepseek-flash, peak hours: 2 元 in / 8 元 out per million tokens -> 0.006 元) */
export const apiOne = () => callCost(API_IN, API_OUT, API_P);
export const apiTotal = (n: number) => n * apiOne();
export const yuan = (x: number) => x.toFixed(3);
/** one request in the 3D view: card flies (0-API_SEND), the model thinks (to API_BACK), the answer comes back (to 1); seconds */
export const API_DUR = 1.8, API_SEND = 0.36, API_BACK = 0.62;
/** the sentence under the stage; while a request is on its way it says where it is (phase 'send' | 'think'), the total only once it is back */
export function apiSay(n: number, L: Lang, phase?: 'send' | 'think'): string {
  if (phase === 'send') return T(L, '请求发出…菜单正沿着管子送去模型。', 'Request sent… the menu travels down the pipe.');
  if (phase === 'think') return T(L, '模型在想…答案马上回来。', 'The model is thinking… the answer is on its way.');
  if (n <= 0) return T(L, '按一下，程序就把问题递给模型。', 'Tap to send your question to the model.');
  return T(L, `第 ${n} 次：答案回来了，共约 <b>${yuan(apiTotal(n))} 元</b>。`, `Call ${n}: answer back, ~<b>${yuan(apiTotal(n))} yuan</b> in total.`);
}

/* ---------- 2. Loc: does the model fit in memory? (the labMem formula, with its default context and memory) ---------- */
export const LOC_P = [1.5, 4, 8, 14, 32, 70] as const;
export const LOC_Q: Quant[] = ['Q4_K_M', 'Q8_0', 'F16'];
export const LOC_CTX = 8192, LOC_HAVE = 16;
export interface LocFit { w: number; kv: number; ov: number; need: number; have: number; v: 'ok' | 'tight' | 'no' }
export function locFit(pB: number, q: Quant): LocFit {
  const w = weightsGB(pB, BPW[q]), kv = kvGB(LOC_CTX, pB / 8), need = w + kv + OVER_GB;
  return { w, kv, ov: OVER_GB, need, have: LOC_HAVE, v: fitVerdict(need, LOC_HAVE) };
}
export const gb = (x: number) => (x >= 100 ? x.toFixed(0) : x.toFixed(1));
export const qName = (q: Quant, L: Lang) => ({ Q4_K_M: T(L, '4 位', '4-bit'), Q8_0: T(L, '8 位', '8-bit'), F16: T(L, '16 位', '16-bit') }[q]);
export function locSay(pB: number, q: Quant, L: Lang): string {
  const f = locFit(pB, q), n = gb(f.need);
  if (f.v === 'ok') return T(L, `约需 <b>${n} GB</b>，16 GB 内存装得下 ✅`, `Needs ~<b>${n} GB</b>: fits in 16 GB ✅`);
  if (f.v === 'tight') return T(L, `约需 <b>${n} GB</b>，装得下，但很挤 ⚠️`, `Needs ~<b>${n} GB</b>: only just fits ⚠️`);
  return T(L, `约需 <b>${n} GB</b>，16 GB 装不下 ❌`, `Needs ~<b>${n} GB</b>: won't fit in 16 GB ❌`);
}

/* ---------- 3. Skl: plug tools into the robot ---------- */
export const SKL_TOOLS: [id: string, icon: string, zh: string, en: string][] = [
  ['files', '📁', '文件', 'Files'], ['web', '🌐', '网页', 'Web'], ['cal', '📅', '日历', 'Calendar'], ['db', '🗄️', '数据库', 'Database'], ['code', '⌨️', '代码', 'Code'],
];
export function sklSay(on: number[], ask: boolean, L: Lang): string {
  if (!on.length) return T(L, '点一张工具卡，把它插到机器人身上。', 'Tap a tool card to plug it into the robot.');
  const names = on.map((i) => T(L, SKL_TOOLS[i]![2], SKL_TOOLS[i]![3]));
  const list = on.length > 3 ? T(L, `${on.length} 个工具`, `${on.length} tools`) : names.join(T(L, '、', ', '));
  return ask ? T(L, `已连接${list}。每次用之前先问你。`, `Connected: ${list}. Asks before each use.`)
    : T(L, `已连接${list}。它会直接用，不再问你。`, `Connected: ${list}. Uses them without asking.`);
}

/* ---------- 4. Bld: four blocks make an agent; two roads to build one ---------- */
export const BLD_PARTS: [id: string, zh: string, en: string, color: string][] = [
  ['model', '模型', 'Model', '#8b5cf6'], ['tools', '工具', 'Tools', '#22c55e'], ['mem', '记忆', 'Memory', '#f5c33b'], ['ins', '说明', 'Guide', '#3b82f6'],
];
export type Road = '' | 'nocode' | 'code';
export function bldSay(r: Road, L: Lang): string {
  if (r === 'nocode') return T(L, '不写代码：在平台上拖一拖、填一填就搭好。', 'No code: drag and fill in forms on a platform.');
  if (r === 'code') return T(L, '写代码：自己写那个小循环，想怎么改都行。', 'Code: write the small loop yourself.');
  return T(L, '四块积木拼成一个 Agent。你想怎么搭？', 'Four blocks make an agent. Pick a way.');
}

/* ---------- 5. U: together, or on its own ---------- */
export type Duo = 'with' | 'solo';
export function duoSay(m: Duo, L: Lang): string {
  return m === 'with' ? T(L, '一起干：你在旁边看，要紧的一步你点头。', 'Together: you watch and OK each key step.')
    : T(L, '自己干：它独自做完，你回来检查结果。', 'On its own: it works alone; you check later.');
}
