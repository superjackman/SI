/* R52 learning routes (metro lines): five goal paths that reuse the same 23 stations in derivation order.
   Data only — the #D/routes view and the home chooser read this. Kept tiny so it can ship in the first chunk. */
import { DV_KEY, dvI, type SK } from './links';

export const GOAL_KEY = 'si.goal';
export type GoalId = 'use' | 'model' | 'derive' | 'agent' | 'interview';

export interface Route {
  id: GoalId;
  /** zh / en short name */
  n: readonly [string, string];
  /** one-line why */
  s: readonly [string, string];
  /** accent colour (line colour on the metro map) */
  c: string;
  /** stations in derivation order (subset of DV_KEY) */
  st: readonly SK[];
}

/** the five goal routes from the viral audit (参考图 5) */
export const ROUTES: readonly Route[] = [
  { id: 'use', n: ['会用 AI', 'Use AI'], s: ['提示、工具、安全确认：先会用再谈原理', 'Prompts, tools, confirmations: use it first'], c: 'var(--link)',
    st: [0, 9, 10, 13, 14, 'S', 'A', 16] },
  { id: 'model', n: ['看懂大模型', 'Understand LLMs'], s: ['从词向量到 Transformer 到预训练、后训练', 'From word vectors to Transformers to pre/post-training'], c: 'var(--link)',
    st: [6, 7, '8a', '8b', 9, 'E', 10, 11, 12, 16] },
  { id: 'derive', n: ['从零推导', 'Derive from zero'], s: ['概率 → 损失 → 梯度 → 网络 → 注意力，整条数学链', 'Probability → loss → gradient → net → attention'], c: 'var(--link)',
    st: [0, 'P', 1, 2, 3, 4, 5, 6, 7, '8a', '8b', 9, 16] },
  { id: 'agent', n: ['做 Agent', 'Build agents'], s: ['RAG、工具、规划、多模态、安全、应用实战', 'RAG, tools, planning, multimodal, safety, apps'], c: 'var(--good)',
    st: [9, 13, 14, 'S', '15a', '15b', 'A', 16] },
  { id: 'interview', n: ['面试冲刺', 'Interview sprint'], s: ['高频考点：损失、梯度、注意力、LoRA、KV 缓存、对齐', 'High-frequency: loss, gradient, attention, LoRA, KV, alignment'], c: 'var(--highlight)',
    st: [1, 2, '8a', '8b', 9, 10, 11, 12, 16] },
];

export const routeOf = (id: string | null | undefined) => ROUTES.find((r) => r.id === id) ?? null;
export const goalGet = (): GoalId | null => {
  try { const v = localStorage.getItem(GOAL_KEY); return ROUTES.some((r) => r.id === v) ? (v as GoalId) : null; } catch { return null; }
};
export const goalSet = (id: GoalId) => { try { localStorage.setItem(GOAL_KEY, id); } catch { /* private mode */ } };
/** the walk to follow: the route the learner picked, otherwise the 23 stations in order */
export interface Path { id: GoalId | null; n: readonly [string, string]; s: readonly [string, string]; c: string; st: readonly (SK | string)[]; chosen: boolean }
export const FULL_PATH: Path = {
  id: null,
  n: ['23 站', '23 stops'],
  s: ['从第 0 站按顺序走到回顾', 'From stop 0 through the recap, in order'],
  c: 'var(--highlight)',
  st: DV_KEY,
  chosen: false,
};
export const pathOf = (): Path => {
  const id = goalGet();
  const r = id ? routeOf(id) : null;
  return r ? { id: r.id, n: r.n, s: r.s, c: r.c, st: r.st, chosen: true } : FULL_PATH;
};
/** next stop: one that was opened but not finished, then the first not finished, else the first */
export const routeNext = (r: { st: readonly (SK | string)[] }, mastered: ReadonlySet<string>, seen: ReadonlySet<string>): string => {
  for (const k of r.st) { const key = String(k); if (seen.has(key) && !mastered.has(key)) return key; }
  for (const k of r.st) { const key = String(k); if (!mastered.has(key)) return key; }
  return String(r.st[0]!);
};
export const routeIx = (r: Route) => r.st.map((k) => dvI(k)).filter((i) => i >= 0);
