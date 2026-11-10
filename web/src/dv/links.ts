/* R47 搭积木 / 推导之路 (#D): the bottom-up chain.
   R48 一体两视角: CARD_DV below is THE one card ↔ stage table. Every other list is derived from it.
   R51 stations: step 8 split into 8a / 8b.
   R52 stations: add P (概率), E (评估), S (安全), A (应用); split 15 into 15a / 15b → 23 stations.
   A station has a key (label + route #D/<key>) and an index. Old #D/8 → 8a, #D/15 → 15a. */
export const DV_KEY = ['0', 'P', '1', '2', '3', '4', '5', '6', '7', '8a', '8b', '9', 'E', '10', '11', '12', '13', '14', 'S', '15a', '15b', 'A', '16'] as const;
export type DvKey = (typeof DV_KEY)[number];
/** a step as written in the tables: a plain number, or 'P'|'E'|'S'|'A'|'8a'|'8b'|'15a'|'15b' */
export type SK = number | 'P' | 'E' | 'S' | 'A' | '8a' | '8b' | '15a' | '15b';
export const DV_N = DV_KEY.length;
export const dvI = (k: SK | string): number => (DV_KEY as readonly string[]).indexOf(String(k));
export const dvK = (i: number): string => DV_KEY[i] ?? String(i);
/** visible position, 1–23. Hashes stay on the key (`#D/2`). */
export const posOf = (k: SK | string): number => dvI(k) + 1;
export const posLabel = (i: number, l: 'zh' | 'en' = 'zh'): string => (l === 'en' ? `${i + 1}/${DV_N}` : `第 ${i + 1}/${DV_N} 站`);
/** the old single-step routes that now open a station */
export const DV_ALIAS: Readonly<Record<string, string>> = { 'D/8': 'D/8a', 'D/15': 'D/15a' };
const ix = (ks: readonly SK[]) => ks.map((k) => { const i = dvI(k); if (i < 0) throw new Error('no station ' + String(k)); return i; });
/** the pyramid layer each stage lands in (0 = the recap) */
export const DV_LV = [5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 1, 1, 1, 0] as const;
export const cardLv = (k: string) => (k.startsWith('KM') ? 5 : k.startsWith('KC') ? 3 : k.startsWith('KB') ? 2 : k.startsWith('KA') ? 1 : 4);
/** card → [birth stage, ...also-used]; tokenization→6, sampling→9 (R52 prerequisite fixes) */
export const CARD_SK: Readonly<Record<string, readonly SK[]>> = {
  KM01: [0, 6], KC08: [0, '8b', 11], KM14: ['P', 1, 9],
  KM05: [1, 7], KM04: [1, 7, '8a', 9, 12], KM06: [1, 9], KM07: [1, 9, 10], K13: [1, 9],
  KM08: [2, 4], KM10: [2, 5],
  KM03: [3, 0, '8a'], K10: [3, '8b', 12],
  KM13: [5, 9], KM09: [4], KM11: [4, '8b'], K09: [4, '8b'], K14: [4, 2, 5],
  K03: [6, '8a', 13], KM02: [6, 7, '8a', 13], K02: [6, 9], KC03: [6, 9],
  K16: [7, '8a'],
  K07: ['8a', 7, '8b'], K08: ['8a', 9], K12: ['8a', 1, 7], KM12: ['8a'],
  K01: ['8b', 16], K04: ['8b', '15a'], K05: ['8b', 4], K06: ['8b', 12], K11: ['8b', 9],
  KC01: [9, 10, 16], KC02: [9], KC04: [9], KC05: [9, '15b'], K15: [9, 12, '15b'], KC09: [9, 12],
  KC15: ['E', 10, 14],
  KC06: [10], KC07: [10], KA02: [10, 13, 14],
  KC13: [11, 12], KC10: [12, '15b'], KC11: [12, '15b'], KC14: [12, '15b'],
  KB06: [13, 14], KC12: [13, 12, '15b'],
  KB01: [14], KB02: [14, '15a'], KB03: [14, 10], KB04: [14], KB05: [14, 12], KB07: [14, 9, 10], KB08: [14],
  KA01: [14, 16], KA03: [14], KA04: [14], KA05: [14, 10], KA06: [14],
  KB09: ['S', 14],
  KA07: ['15a', 14],
  KA09: ['15b', 'A'],
  KA08: ['A', 14],
};
export const CARD_DV: Readonly<Record<string, readonly number[]>> = Object.fromEntries(Object.entries(CARD_SK).map(([k, v]) => [k, ix(v)]));
const IDS = Object.keys(CARD_DV);
export const DV_OF: Readonly<Record<string, number>> = Object.fromEntries(IDS.map((k) => [k, CARD_DV[k]![0]!]));
export const DV_ALSO: Readonly<Record<string, readonly number[]>> = Object.fromEntries(IDS.map((k) => [k, CARD_DV[k]!.slice(1)]));
export const DV_BORN: readonly (readonly string[])[] = Array.from({ length: DV_N }, (_, i) => {
  const b = IDS.filter((k) => DV_OF[k] === i); return [...b.filter((k) => cardLv(k) === DV_LV[i]), ...b.filter((k) => cardLv(k) !== DV_LV[i])];
});
export const DV_USES: readonly (readonly string[])[] = Array.from({ length: DV_N }, (_, i) => IDS.filter((k) => DV_ALSO[k]!.includes(i)));
export const DV_K: readonly (readonly string[])[] = DV_BORN.map((b, i) => [...b, ...DV_USES[i]!]);
export const DV_SOLO: readonly number[] = DV_BORN.map((b, i) => (i < DV_N - 1 && !(b[0] && cardLv(b[0]) === DV_LV[i]) ? i : -1)).filter((i) => i >= 0);
export const DV_SEEN = 'si.dv.seen';
/** the station last opened in this browser (`#D/<key>`) */
export const DV_AT = 'si.dv.at';
export const DV_FOCUS = 'si.dv.focus';
export const isDv = (id: string) => id === 'D' || id === 'D/map' || id === 'D/routes' || id === 'D/ch' || id.startsWith('D/ch/') || id in DV_ALIAS || (id.startsWith('D/') && dvI(id.slice(2)) >= 0);
export const DV_NM: readonly (readonly [string, string])[] = [
  ['用样本找函数', 'Learn a function from examples'],
  ['概率基础', 'Probability basics'],
  ['损失函数', 'Loss functions'],
  ['梯度下降', 'Gradient descent'],
  ['多层 + 非线性', 'Layers + non-linearity'],
  ['反向传播', 'Backpropagation'],
  ['训练工程', 'Training in practice'],
  ['词向量', 'Word vectors'],
  ['RNN + 注意力', 'RNN + attention'],
  ['注意力：谁和谁有关', 'Attention: who relates to whom'],
  ['组装成 Transformer', 'Building the Transformer'],
  ['预训练', 'Pre-training'],
  ['评估', 'Evaluation'],
  ['后训练：SFT、对齐与推理', 'Post-training: SFT + align'],
  ['低成本适配', 'Cheap adaptation'],
  ['推理效率', 'Inference speed'],
  ['RAG', 'RAG'],
  ['工具与 Agent', 'Tools + agents'],
  ['安全', 'Safety'],
  ['多模态', 'Multimodal'],
  ['推理模型与长上下文', 'Reasoning models + long context'],
  ['应用实战', 'Applications'],
  ['回顾', 'Recap'],
];
export const DV_E: readonly (readonly [string, string])[] = [
  ['怎么用概率描述“下一个字”？', 'How do we describe “the next word” with probability?'],
  ['怎么判断参数好不好？', 'How do we tell good parameters from bad?'],
  ['怎么找到让损失最小的参数？', 'How do we find the parameters with the lowest loss?'],
  ['线性模型能力不够', 'A linear model is not powerful enough'],
  ['多层网络的梯度怎么求？', 'How do we get gradients through many layers?'],
  ['训练又慢又不稳，还会过拟合', 'Training is slow, unstable and overfits'],
  ['文字这类离散符号怎么输入？', 'How do discrete symbols like words go in?'],
  ['词义固定；序列怎么处理？', 'One fixed meaning per word; how to handle sequences?'],
  ['不能并行，长依赖仍然难', 'No parallelism; long-range links are still hard'],
  ['一层注意力还不够：怎么搭成能叠很多层的完整模型？', 'One attention layer is not enough: how do we build a full model that stacks many layers?'],
  ['用什么数据、多大规模去训练？', 'Trained on what data, at what scale?'],
  ['训好了，怎么知道它有多强、哪里还不行？', 'Once trained, how do we know how strong it is and where it fails?'],
  ['会续写，但不听指令、不安全', 'It continues text but won’t follow instructions or stay safe'],
  ['定制成本太高', 'Customising it costs too much'],
  ['生成慢，显存占用大', 'Generation is slow and memory-hungry'],
  ['知识过期，会产生幻觉', 'Knowledge goes stale; it hallucinates'],
  ['只会说，不会做', 'It can talk but not act'],
  ['会做事了，但会被骗、越权、泄漏', 'It can act, but can be tricked, over-privileged, or leak'],
  ['只能处理文字，世界不只有文字', 'Text only — the world is more than text'],
  ['回答时怎么多想一会？长文怎么接住？', 'How to think longer at answer time? How to handle long text?'],
  ['这些能力现在都用在哪？', 'Where are these abilities used today?'],
  ['仍在发展中', 'Still moving'],
  ['', ''],
];
export const DV_EX: readonly (readonly string[])[] = [
  ['KC08'], ['KM14'], ['KM07', 'K13', 'KM04'], ['KM10', 'K14', 'KM08'], ['K10'], ['KM09'], ['KM13'], ['KM02', 'K02'], ['K16', 'KM04', 'KM12'],
  ['KM12'], ['KC08', 'K10'], ['KC04', 'K15', 'KC05'], ['KC15'], ['KC07'], ['KC13'], ['KC14'], ['KB06'], ['KB01'], ['KB09'], ['KA07'], ['KA09'], ['KA08'], [],
];
export const DV_EX_PTR: Readonly<Record<number, string>> = {
  [dvI('E')]: 'evaluation benchmarks are qualitative here; KC15 explains the rulers without a shared arithmetic example',
  [dvI('S')]: 'safety is about procedures and permissions; KB09 has no shared arithmetic example with the stage',
  [dvI(0)]: 'y = 2x + 1 has two parameters; KC08 counts them in a real model',
  [dvI(3)]: 'hand-built XOR network; K10 is the same two-layer MLP inside a Transformer',
  [dvI(13)]: 'RAG retrieval example; KB06 retrieves from the user’s own notes',
  [dvI(14)]: 'tool-call chain with a confirm step; KB01 is the same loop stopping to ask the user',
  [dvI('15b')]: 'multi-agent roles are qualitative; KA08/KA09 describe coordination without a shared arithmetic example',
  [dvI('A')]: 'hands-on apps are qualitative; KA08 is the same agent shape without a shared arithmetic example',
};
