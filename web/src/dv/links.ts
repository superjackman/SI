/* R47 搭积木 / 推导之路 (#D): the bottom-up chain, stage 0 (one number) → 16 (recap).
   R48 一体两视角: CARD_DV below is THE one card ↔ stage table. Every other list (a stage's born / also-used cards,
   a card's back-link, the knowledge map) is derived from it, never written twice; tests/unit/r48-map.test.ts checks R1–R8.
   Tiny and shared: the lazy dv view, the card sheet and the map all use it. */
export const DV_N = 17;
/** the pyramid layer each stage lands in (0 = the recap): reading the chain climbs the pyramid from layer 5 to layer 1 */
export const DV_LV = [5, 5, 5, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 2, 2, 1, 0] as const;
/** a card's pyramid layer, from its id (KM 5 · K 4 · KC 3 · KB 2 · KA 1) */
export const cardLv = (k: string) => (k.startsWith('KM') ? 5 : k.startsWith('KC') ? 3 : k.startsWith('KB') ? 2 : k.startsWith('KA') ? 1 : 4);
/** card → [the stage it is born in (its one main stage), ...the later / earlier stages that use it again]; order = the stage's listing order */
export const CARD_DV: Readonly<Record<string, readonly number[]>> = {
  KM01: [0, 6], KC08: [0, 8, 11],
  KM05: [1, 7], KM06: [1, 9], KM07: [1, 9, 10], K13: [1, 9],
  KM08: [2, 4], KM10: [2, 5],
  KM03: [3, 0, 8], K10: [3, 8, 12],
  KM09: [4], KM11: [4, 8], K09: [4, 8], K14: [4, 2, 5],
  K03: [6, 8, 13], KM02: [6, 7, 8, 13],
  KM04: [7, 8, 9, 12],
  K01: [8, 16], K04: [8, 15], K05: [8, 4], K06: [8, 12], K07: [8, 7], K08: [8, 9], K11: [8, 9], K12: [8, 1, 7], KM12: [8],
  KC01: [9, 10, 16], KC02: [9], KC03: [9, 6], KC04: [9], KC05: [9, 15], K02: [9, 6],
  KC06: [10], KC07: [10], KA02: [10, 13, 14],
  KC09: [12, 9], KC10: [12, 15], KC11: [12, 15], K15: [12, 9, 15],
  KB06: [13, 14], KC12: [13, 12, 15],
  KB01: [14], KB02: [14, 15], KB03: [14, 10], KB04: [14], KB05: [14, 12], KB07: [14, 9, 10], KB08: [14],
  KA01: [14, 16], KA03: [14], KA04: [14], KA05: [14, 10], KA06: [14],
};
const IDS = Object.keys(CARD_DV);
/** card → its birth stage (the card sheet's 「↑ 去推导之路 第 n 步」) */
export const DV_OF: Readonly<Record<string, number>> = Object.fromEntries(IDS.map((k) => [k, CARD_DV[k]![0]!]));
/** card → the other stages it shows up in again */
export const DV_ALSO: Readonly<Record<string, readonly number[]>> = Object.fromEntries(IDS.map((k) => [k, CARD_DV[k]!.slice(1)]));
/** per stage: the cards born there, the stage's own layer first (R2), then the table order */
export const DV_BORN: readonly (readonly string[])[] = Array.from({ length: DV_N }, (_, i) => {
  const b = IDS.filter((k) => DV_OF[k] === i); return [...b.filter((k) => cardLv(k) === DV_LV[i]), ...b.filter((k) => cardLv(k) !== DV_LV[i])];
});
/** per stage: cards born in another stage that this one uses again (本步也用到) */
export const DV_USES: readonly (readonly string[])[] = Array.from({ length: DV_N }, (_, i) => IDS.filter((k) => DV_ALSO[k]!.includes(i)));
/** per stage: every card it shows (born first, then the reused ones) */
export const DV_K: readonly (readonly string[])[] = DV_BORN.map((b, i) => [...b, ...DV_USES[i]!]);
/** 仅推导: stages (not the recap) whose layer has no card born there yet — the pyramid has nothing for them so far */
export const DV_SOLO: readonly number[] = DV_BORN.map((b, i) => (i < DV_N - 1 && !(b[0] && cardLv(b[0]) === DV_LV[i]) ? i : -1)).filter((i) => i >= 0);
export const DV_SEEN = 'si.dv.seen';
export const isDv = (id: string) => id === 'D' || /^D\/(\d|1[0-6])$/.test(id);
/** short stage names (zh, en) for the map sheet and the card back-link; the lazy content repeats them (a unit test keeps them equal) */
export const DV_NM: readonly (readonly [string, string])[] = [
  ['用样本找函数', 'Learn a function from examples'], ['损失函数', 'Loss functions'], ['梯度下降', 'Gradient descent'], ['多层 + 非线性', 'Layers + non-linearity'],
  ['反向传播', 'Backpropagation'], ['训练工程', 'Training in practice'], ['词向量', 'Word vectors'], ['RNN + 注意力', 'RNN + attention'], ['Transformer', 'Transformer'],
  ['预训练', 'Pre-training'], ['后训练：SFT、对齐与推理', 'Post-training: SFT, alignment + reasoning'], ['低成本适配', 'Cheap adaptation'], ['推理效率', 'Inference speed'], ['RAG', 'RAG'],
  ['工具与 Agent', 'Tools + agents'], ['多模态与前沿', 'Multimodal + frontier'], ['回顾', 'Recap'],
];
/** what each stage leaves open (zh, en) — the card sheet's 「它解决的问题」 is the step before its birth step; equal to the lazy content's `e` (unit test) */
export const DV_E: readonly (readonly [string, string])[] = [
  ['怎么判断参数好不好？', 'How do we tell good parameters from bad?'], ['怎么找到让损失最小的参数？', 'How do we find the parameters with the lowest loss?'], ['线性模型能力不够', 'A linear model is not powerful enough'], ['多层网络的梯度怎么求？', 'How do we get gradients through many layers?'], ['训练又慢又不稳，还会过拟合', 'Training is slow, unstable and overfits'], ['文字这类离散符号怎么输入？', 'How do discrete symbols like words go in?'], ['词义固定；序列怎么处理？', 'One fixed meaning per word; how to handle sequences?'], ['不能并行，长依赖仍然难', 'No parallelism; long-range links are still hard'], ['用什么数据、多大规模去训练？', 'Trained on what data, at what scale?'], ['会续写，但不听指令、不安全', 'It continues text but won’t follow instructions or stay safe'], ['定制成本太高', 'Customising it costs too much'], ['生成慢，显存占用大', 'Generation is slow and memory-hungry'], ['知识过期，会产生幻觉', 'Knowledge goes stale; it hallucinates'], ['只会说，不会做', 'It can talk but not act'], ['只能处理文字，世界不只有文字', 'Text only — the world is more than text'], ['仍在发展中', 'Still moving'], ['', ''],
];
