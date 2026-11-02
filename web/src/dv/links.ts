/* R47 搭积木 / 推导之路 (#D): the bottom-up chain, stage 0 (one number) → 16 (recap).
   Tiny and shared: the lazy dv view uses it, and the card sheet uses DV_OF for its 「在推导之路里」 back-link. */
export const DV_N = 17;
/** the pyramid layer each stage lands in (0 = the recap): reading the chain climbs the pyramid from layer 5 to layer 1 */
export const DV_LV = [5, 5, 5, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 2, 2, 1, 0] as const;
/** the site's cards each stage leans on (first = the main one) */
export const DV_K: readonly (readonly string[])[] = [
  ['KM01', 'KM03'], ['KM07', 'KM06', 'KM05', 'K13'], ['KM10', 'KM08'], ['KM03', 'K10'], ['KM09', 'K14', 'K09', 'KM11'], ['K14', 'KM10'],
  ['K03', 'KM02', 'KM01'], ['KM04', 'K07'], ['K01', 'K07', 'KM12', 'K06', 'K04', 'K08', 'K10', 'K09', 'K11'],
  ['KC04', 'K02', 'KC05', 'KC02', 'K13'], ['KC06', 'KC07'], ['KC08'], ['KC09', 'KC10'], ['KB06', 'KC12'], ['KA04', 'KB01', 'KA03', 'KA05'], ['KA02', 'KC11'], ['K01', 'KC01', 'KA01'],
];
/** card → the stage that explains where it came from (the first stage that lists it) */
export const DV_OF: Readonly<Record<string, number>> = (() => { const o: Record<string, number> = {}; DV_K.forEach((ks, i) => { if (i < DV_N - 1) for (const k of ks) if (!(k in o)) o[k] = i; }); return o; })();
export const DV_SEEN = 'si.dv.seen';
export const isDv = (id: string) => id === 'D' || /^D\/(\d|1[0-6])$/.test(id);
/** short stage names (zh, en) for the map sheet and the card back-link; the lazy content repeats them (a unit test keeps them equal) */
export const DV_NM: readonly (readonly [string, string])[] = [
  ['用样本找函数', 'Learn a function from examples'], ['损失函数', 'Loss functions'], ['梯度下降', 'Gradient descent'], ['多层 + 非线性', 'Layers + non-linearity'],
  ['反向传播', 'Backpropagation'], ['训练工程', 'Training in practice'], ['词向量', 'Word vectors'], ['RNN + 注意力', 'RNN + attention'], ['Transformer', 'Transformer'],
  ['预训练', 'Pre-training'], ['对齐与推理', 'Alignment + reasoning'], ['低成本适配', 'Cheap adaptation'], ['推理效率', 'Inference speed'], ['RAG', 'RAG'],
  ['工具与 Agent', 'Tools + agents'], ['多模态与前沿', 'Multimodal + frontier'], ['回顾', 'Recap'],
];
