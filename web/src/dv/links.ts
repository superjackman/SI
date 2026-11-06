/* R47 搭积木 / 推导之路 (#D): the bottom-up chain, stage 0 (one number) → 16 (recap).
   R48 一体两视角: CARD_DV below is THE one card ↔ stage table. Every other list (a stage's born / also-used cards,
   a card's back-link, the knowledge map) is derived from it, never written twice; tests/unit/r48-map.test.ts checks R1–R8.
   Tiny and shared: the lazy dv view, the card sheet and the map all use it. */
/* R51 stations: step 8 is split into 8a 注意力 and 8b 组装成 Transformer. A station has a key (its label and its route
   #D/<key>: '0'…'7', '8a', '8b', '9'…'16') and an index (its place in the arrays below). The old #D/8 opens 8a.
   Tables people edit (CARD_DV below, dv/nums.ts `st`) are written with the step numbers people read; 8a / 8b as strings. */
export const DV_KEY = ['0', '1', '2', '3', '4', '5', '6', '7', '8a', '8b', '9', '10', '11', '12', '13', '14', '15', '16'] as const;
export type DvKey = (typeof DV_KEY)[number];
/** a step as written in the tables: a plain number for an unsplit step, '8a' / '8b' for the two halves of step 8 */
export type SK = number | '8a' | '8b';
export const DV_N = DV_KEY.length;
/** station index of a key / step number (−1 when there is none) */
export const dvI = (k: SK | string): number => (DV_KEY as readonly string[]).indexOf(String(k));
/** the key (label, route) of station i */
export const dvK = (i: number): string => DV_KEY[i] ?? String(i);
/** the old single-step routes that now open a station (#D/8 → #D/8a) */
export const DV_ALIAS: Readonly<Record<string, string>> = { 'D/8': 'D/8a' };
const ix = (ks: readonly SK[]) => ks.map((k) => { const i = dvI(k); if (i < 0) throw new Error('no station ' + String(k)); return i; });
/** the pyramid layer each stage lands in (0 = the recap): reading the chain climbs the pyramid from layer 5 to layer 1 */
export const DV_LV = [5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 1, 0] as const;
/** a card's pyramid layer, from its id (KM 5 · K 4 · KC 3 · KB 2 · KA 1) */
export const cardLv = (k: string) => (k.startsWith('KM') ? 5 : k.startsWith('KC') ? 3 : k.startsWith('KB') ? 2 : k.startsWith('KA') ? 1 : 4);
/** card → [the stage it is born in (its one main stage), ...the later / earlier stages that use it again]; order = the stage's listing order.
    Written with step numbers (8a / 8b as strings); CARD_DV below is the same table as station indices. */
export const CARD_SK: Readonly<Record<string, readonly SK[]>> = {
  KM01: [0, 6], KC08: [0, '8b', 11],
  KM05: [1, 7], KM04: [1, 7, '8a', 9, 12], KM06: [1, 9], KM07: [1, 9, 10], K13: [1, 9],
  KM08: [2, 4], KM10: [2, 5],
  KM03: [3, 0, '8a'], K10: [3, '8b', 12],
  KM13: [5, 9], KM09: [4], KM11: [4, '8b'], K09: [4, '8b'], K14: [4, 2, 5],
  K03: [6, '8a', 13], KM02: [6, 7, '8a', 13],
  K16: [7, '8a'],
  K07: ['8a', 7, '8b'], K08: ['8a', 9], K12: ['8a', 1, 7], KM12: ['8a'],
  K01: ['8b', 16], K04: ['8b', 15], K05: ['8b', 4], K06: ['8b', 12], K11: ['8b', 9],
  KC01: [9, 10, 16], KC02: [9], KC03: [9, 6], KC04: [9], KC05: [9, 15], K02: [9, 6],
  KC06: [10], KC07: [10], KA02: [10, 13, 14],
  KC13: [11, 12], KC09: [12, 9], KC10: [12, 15], KC11: [12, 15], K15: [12, 9, 15], KC14: [12, 15],
  KB06: [13, 14], KC12: [13, 12, 15],
  KB01: [14], KB02: [14, 15], KB03: [14, 10], KB04: [14], KB05: [14, 12], KB07: [14, 9, 10], KB08: [14],
  KA01: [14, 16], KA03: [14], KA04: [14], KA05: [14, 10], KA06: [14], KA07: [15, 14],
};
export const CARD_DV: Readonly<Record<string, readonly number[]>> = Object.fromEntries(Object.entries(CARD_SK).map(([k, v]) => [k, ix(v)]));
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
/** the card a view switch came from: the stage page lights it up and scrolls to it once (sessionStorage) */
export const DV_FOCUS = 'si.dv.focus';
export const isDv = (id: string) => id === 'D' || id === 'D/map' || id in DV_ALIAS || (id.startsWith('D/') && dvI(id.slice(2)) >= 0);
/** short stage names (zh, en) for the map sheet and the card back-link; the lazy content repeats them (a unit test keeps them equal) */
export const DV_NM: readonly (readonly [string, string])[] = [
  ['用样本找函数', 'Learn a function from examples'], ['损失函数', 'Loss functions'], ['梯度下降', 'Gradient descent'], ['多层 + 非线性', 'Layers + non-linearity'],
  ['反向传播', 'Backpropagation'], ['训练工程', 'Training in practice'], ['词向量', 'Word vectors'], ['RNN + 注意力', 'RNN + attention'], ['注意力：谁和谁有关', 'Attention: who relates to whom'], ['组装成 Transformer', 'Building the Transformer'],
  ['预训练', 'Pre-training'], ['后训练：SFT、对齐与推理', 'Post-training: SFT + RL'], ['低成本适配', 'Cheap adaptation'], ['推理效率', 'Inference speed'], ['RAG', 'RAG'],
  ['工具与 Agent', 'Tools + agents'], ['多模态与前沿', 'Multimodal + frontier'], ['回顾', 'Recap'],
];
/** what each stage leaves open (zh, en) — the card sheet's 「它解决的问题」 is the step before its birth step; equal to the lazy content's `e` (unit test) */
export const DV_E: readonly (readonly [string, string])[] = [
  ['怎么判断参数好不好？', 'How do we tell good parameters from bad?'], ['怎么找到让损失最小的参数？', 'How do we find the parameters with the lowest loss?'], ['线性模型能力不够', 'A linear model is not powerful enough'], ['多层网络的梯度怎么求？', 'How do we get gradients through many layers?'], ['训练又慢又不稳，还会过拟合', 'Training is slow, unstable and overfits'], ['文字这类离散符号怎么输入？', 'How do discrete symbols like words go in?'], ['词义固定；序列怎么处理？', 'One fixed meaning per word; how to handle sequences?'], ['不能并行，长依赖仍然难', 'No parallelism; long-range links are still hard'], ['一层注意力还不够：怎么搭成能叠很多层的完整模型？', 'One attention layer is not enough: how do we build a full model that stacks many layers?'], ['用什么数据、多大规模去训练？', 'Trained on what data, at what scale?'], ['会续写，但不听指令、不安全', 'It continues text but won’t follow instructions or stay safe'], ['定制成本太高', 'Customising it costs too much'], ['生成慢，显存占用大', 'Generation is slow and memory-hungry'], ['知识过期，会产生幻觉', 'Knowledge goes stale; it hallucinates'], ['只会说，不会做', 'It can talk but not act'], ['只能处理文字，世界不只有文字', 'Text only — the world is more than text'], ['仍在发展中', 'Still moving'], ['', ''],
];
/* C12 canonical examples: the card that holds each stage's worked example. The stage page's ④ reuses its numbers
   (shared {#key} in dv/nums.ts) and shows these cards as chips. DV_EX_PTR = stages whose own example is different
   and only points to the card's example (no shared number). Step 16 is the recap: no example of its own. */
export const DV_EX: readonly (readonly string[])[] = [
  ['KC08'], ['KM07', 'K13', 'KM04'], ['KM10', 'K14', 'KM08'], ['K10'], ['KM09'], ['KM13'], ['KM02'], ['K16', 'KM04', 'KM12'],
  ['KM12'], ['KC08', 'K10'], ['KC04', 'K02', 'KC05'], ['KC07'], ['KC13'], ['K15', 'KC14', 'KC11'], ['KB06'], ['KB01'], ['KA07'], [],
];
export const DV_EX_PTR: Readonly<Record<number, string>> = {
  [dvI(0)]: 'y = 2x + 1 has two parameters; KC08 counts them in a real model',
  [dvI(3)]: 'hand-built XOR network; K10 is the same two-layer MLP inside a Transformer',
  [dvI(13)]: 'RAG retrieval example; KB06 retrieves from the user’s own notes',
  [dvI(14)]: 'tool-call chain with a confirm step; KB01 is the same loop stopping to ask the user',
};
