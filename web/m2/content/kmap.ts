/* R12: the knowledge map at the top of the home page (T1) — the whole spine from "how to use an agent" down to the maths,
   one row per layer, every row and sub-item a link to its station. build.ts renders it between <!--m2k--> markers right
   under T1's page head; the lab / card counts are computed there from the generated pages (never typed in here).
   One-liners paraphrase each station's own subtitle (pg-s). */
import type { Bi } from '../lib';

export interface KLayer { ic: string; n: Bi; learn: Bi; st: string[] }
const b = (zh: string, en: string): Bi => ({ zh, en });

export const KMAP: KLayer[] = [
  { ic: '🛠️', n: b('怎么用 Agent', 'Using agents'), learn: b('同一个 Agent，几种用法差在哪', 'One agent, several ways to use it'), st: ['U', 'Ua', 'Ub', 'Uc', 'Ud'] },
  { ic: '🗂️', n: b('具体产品', 'Products'), learn: b('按用法找产品，附官方链接', 'Products by way of use, with official links'), st: ['Up'] },
  { ic: '🏠', n: b('应用全景', 'App overview'), learn: b('你说一句话，背后有六层接力', 'Six layers relay one sentence'), st: ['T1'] },
  { ic: '🤖', n: b('Agent 机制', 'Agent mechanics'), learn: b('大模型 + 一个循环程序', 'An LLM plus a loop program'), st: ['T2'] },
  { ic: '🧠', n: b('大模型', 'LLM'), learn: b('一台“猜下一个词”的机器', 'A “guess the next word” machine'), st: ['T3'] },
  { ic: '🧩', n: b('Transformer', 'Transformer'), learn: b('每块两步：注意力，再前馈', 'Each block: attention, then feed-forward'), st: ['T4', 'T4a', 'T4b'] },
  { ic: '🕸️', n: b('神经网络与高效架构', 'Neural nets & efficiency'), learn: b('加权求和 + 激活层层叠；MoE 更省', 'Weighted sums + activations, stacked; MoE saves'), st: ['N', 'T5'] },
  { ic: '🖼️', n: b('多模态与生成', 'Multimodal & generative'), learn: b('看图、听声、画画靠同一招', 'Seeing, hearing, drawing: one trick'), st: ['T6'] },
  { ic: '🏋️', n: b('训练与强化学习', 'Training & RL'), learn: b('本事不是写出来的，是练出来的', 'Skills are trained, not written'), st: ['T7'] },
  { ic: '∑', n: b('数学基础', 'Math foundations'), learn: b('上面每个公式从哪来，一步步推', 'Where every formula above comes from'), st: ['K1', 'K2', 'K3', 'K4', 'K5'] },
];
/** side entry, not a layer: the reference station (map + glossary) */
export const KSIDE = { st: 'T8', ic: '🗺️', jumps: [['c_T8_0', b('全景关系图', 'Big-picture map')], ['c_T8_1', b('术语表', 'Glossary')]] as [string, Bi][] };
