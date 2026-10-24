/* R24 labBatch (K4) maths: how many steps one epoch takes for N examples in batches of B. Pure and unit-tested. */
export interface BatchPlan { per: number; last: number; total: number; seen: number; dropped: number }
/** N examples, batch size B, E epochs; drop = throw away the last, smaller batch (many data loaders offer this) */
export function plan(N: number, B: number, E: number, drop = false): BatchPlan {
  const full = Math.floor(N / B), rest = N % B;
  const per = drop || rest === 0 ? full : full + 1;
  const last = rest === 0 ? B : drop ? B : rest;
  const used = drop ? full * B : N;
  return { per, last, total: per * E, seen: used * E, dropped: drop ? rest : 0 };
}
