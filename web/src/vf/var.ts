/* R56 变式题 + 答错回炉: one generator per kind turns a number set from the shared table (dv/nums.ts VAR) into a
   question with a computed answer and its common wrong answers. Each wrong answer names the exact layer (and, on the
   attention station, the animation shot) that explains the step that was missed. Text marks as on the stage pages. */
import { VAR, type VarK } from '../dv/nums';
import { dot, mse, softmax } from './calc';

type T = readonly [string, string];
/** a common mistake: the value it produces, what went wrong, where to look again (layer 1–5, optional shot 1–7) */
export interface Mis { v: number; why: T; lab: T; ly: number; fr?: number }
export interface VarQ { q: T; a: number; d: number; tol: number; u?: T; mis: Mis[]; w: T }
const f = (v: number, d = 2) => { const s = Math.abs(v).toFixed(d).replace(/\.?0+$/, ''); return (v < 0 ? '−' : '') + (s === '' ? '0' : s); };
const ln = Math.log;
/** the base self-check question each kind's entry 0 equals (vf/data QQ id), if any */
export const BASE: Readonly<Partial<Record<VarK, string>>> = { mse: 's1a', ce: 's1b', sm2: 's1d', gd1: 's2a', bowl: 's2d', gdbig: 's2c', scale: 's8a' };
const gdStep = (w: number, e: number) => w - e * 2 * (w - 2);
const G: Record<VarK, (p: readonly number[]) => VarQ> = {
  mse: (p) => ({ q: [`预测 ${p.map((x) => f(x)).join('、')}，真实 3、5、7。MSE = ？（保留 3 位小数）`, `Predictions ${p.map((x) => f(x)).join(', ')}; true values 3, 5, 7. MSE = ? (3 decimals)`],
    a: mse(p, [3, 5, 7]), d: 3, tol: 0.004, w: ['先算每个误差的平方，再加起来除以 3。', 'Square each error, add them, divide by 3.'],
    mis: [{ v: mse(p, [3, 5, 7]) * 3, why: ['你把平方加起来了，但忘了除以 3 取平均。', 'You added the squares but forgot to divide by 3.'], lab: ['MSE 的“M”：取平均', 'The “M” in MSE: the mean'], ly: 4 },
      { v: p.reduce((s, x, i) => s + (x - [3, 5, 7][i]!), 0) / 3, why: ['你直接平均了误差：正负抵消了。要先平方。', 'You averaged the raw errors: plus and minus cancel. Square first.'], lab: ['为什么要平方', 'Why square'], ly: 1 },
      { v: p.reduce((s, x, i) => s + Math.abs(x - [3, 5, 7][i]!), 0) / 3, why: ['你取了绝对值的平均；MSE 要的是平方。', 'You averaged absolute values; MSE squares them.'], lab: ['平方误差', 'Squared error'], ly: 3 }] }),
  ce: ([p]) => ({ q: [`模型给正确答案的概率是 ${f(p!)}，交叉熵损失 \`−ln ${f(p!)}\` = ？（保留 2 位小数）`, `The model gives the right answer probability ${f(p!)}. Cross-entropy loss \`−ln ${f(p!)}\` = ? (2 decimals)`],
    a: -ln(p!), d: 2, tol: 0.006, w: [`\`−ln ${f(p!)} ≈ ${f(-ln(p!))}\``, `\`−ln ${f(p!)} ≈ ${f(-ln(p!))}\``],
    mis: [{ v: ln(p!), why: ['少了负号：ln p 在 p < 1 时是负数，罚分要取反。', 'The minus sign is missing: ln p is negative for p < 1; the penalty flips it.'], lab: ['罚分 = −ln p', 'Penalty = −ln p'], ly: 4 },
      { v: -Math.log10(p!), why: ['你用了以 10 为底的对数；这里是自然对数 ln。', 'You used log base 10; this is the natural log, ln.'], lab: ['ln 是自然对数', 'ln is the natural log'], ly: 4 },
      { v: 1 - p!, why: ['罚分不是 1 − p：越接近 0，罚分要冲向无穷大。', 'The penalty is not 1 − p: as p nears 0 it must shoot up.'], lab: ['罚分曲线', 'The penalty curve'], ly: 2 }] }),
  sm2: ([a, b]) => { const p = softmax([a!, b!]); return { q: [`只有两个候选，分数是 ${f(a!)} 和 ${f(b!)}。softmax 后，第一个的概率是百分之几？（保留 1 位小数）`, `Two candidates, scores ${f(a!)} and ${f(b!)}. After softmax, the first one’s probability in percent? (1 decimal)`],
    a: 100 * p[0]!, d: 1, tol: 0.2, u: ['%', '%'], w: [`\`e^${f(a!)} ÷ (e^${f(a!)} + e^${f(b!)})\``, `\`e^${f(a!)} ÷ (e^${f(a!)} + e^${f(b!)})\``],
    mis: [...(a! + b! !== 0 ? [{ v: (100 * a!) / (a! + b!), why: ['你直接用分数相除了：要先取 e 的指数，再除以总和。', 'You divided the raw scores: take e to the power first, then divide by the total.'] as T, lab: ['softmax 第一步：取指数', 'softmax step 1: exponentiate'] as T, ly: 2 }] : []),
      { v: 100 * p[1]!, why: ['这是第二个候选的概率；题目问的是第一个。', 'That is the second candidate; the question asks for the first.'], lab: ['分数 → 概率', 'Scores → probabilities'], ly: 3 }] }; },
  gd1: ([w, e]) => { const s = 2 * (w! - 2); return { q: [`在 {#gdL} 上，现在站在 w = ${f(w!)}，η = ${f(e!)}。走 1 步后 w = ？`, `On {#gdL}, you stand at w = ${f(w!)} with η = ${f(e!)}. After 1 step, w = ?`],
    a: gdStep(w!, e!), d: 2, tol: 0.006, w: [`坡度 \`2 × (${f(w!)} − 2) = ${f(s)}\`；\`新w = ${f(w!)} − ${f(e!)} × (${f(s)})\``, `Slope \`2 × (${f(w!)} − 2) = ${f(s)}\`; \`new w = ${f(w!)} − ${f(e!)} × (${f(s)})\``],
    mis: [{ v: w! + e! * s, why: ['你往上坡走了：坡度为负时，减去它 w 才会变大。', 'You walked uphill: when the slope is negative, subtracting it makes w bigger.'], lab: ['坡的正负 → 往哪走', 'The slope’s sign → which way'], ly: 1 },
      { v: w! - e! * (w! - 2), why: ['坡度少了因子 2：(w − 2)² 的导数是 2 × (w − 2)。', 'The slope is missing the 2: the derivative of (w − 2)² is 2 × (w − 2).'], lab: ['算坡度', 'Working out the slope'], ly: 3 },
      { v: w! - s, why: ['少乘了学习率 η：每步只迈 η 倍的坡度。', 'You forgot the learning rate η: each step is η times the slope.'], lab: ['新w = 旧w − η × 坡度', 'new w = old w − η × slope'], ly: 4 }] }; },
  bowl: ([a, b]) => ({ q: [`在 {#bowlL} 上，点 (w1, w2) = (${f(a!)}, ${f(b!)}) 处，∂L/∂w2 = ？`, `On {#bowlL}, at (w1, w2) = (${f(a!)}, ${f(b!)}): ∂L/∂w2 = ?`],
    a: 4 * (b! - 1), d: 1, tol: 0.06, w: [`w1 不动，只看 \`2 × (w2 − 1)²\`：导数 \`4 × (${f(b!)} − 1)\``, `Hold w1; only \`2 × (w2 − 1)²\` matters: derivative \`4 × (${f(b!)} − 1)\``],
    mis: [{ v: 2 * (b! - 1), why: ['那一项前面还有个 2：`2 × (w2 − 1)²` 的导数是 `4 × (w2 − 1)`。', 'That term has a 2 in front: the derivative of `2 × (w2 − 1)²` is `4 × (w2 − 1)`.'], lab: ['偏导：只动一个', 'Partial: move one only'], ly: 4 },
      { v: 4 * (1 - b!), why: ['符号反了：w2 比 1 小时，坡是负的。', 'The sign is flipped: below 1 the slope is negative.'], lab: ['坡的方向', 'The slope’s direction'], ly: 2 },
      ...(a! !== b! || a! !== 0 ? [{ v: 2 * (a! - 2), why: ['这是 ∂L/∂w1（东西方向）；题目问的是 w2（南北方向）。', 'That is ∂L/∂w1 (east–west); the question asks for w2 (north–south).'] as T, lab: ['两个方向的坡', 'The two slopes'] as T, ly: 2 }] : [])] }),
  gdbig: ([w, e]) => { const s = 2 * (w! - 2), n = gdStep(w!, e!); return { q: [`同一条曲线 {#gdL}，η = ${f(e!)}，从 w = ${f(w!)} 走 1 步，w = ？`, `Same curve {#gdL}, η = ${f(e!)}, one step from w = ${f(w!)}: w = ?`],
    a: n, d: 2, tol: 0.006, w: [`\`${f(w!)} − ${f(e!)} × (${f(s)})\`：离 2 的距离从 ${f(Math.abs(w! - 2))} 变成 ${f(Math.abs(n - 2))}`, `\`${f(w!)} − ${f(e!)} × (${f(s)})\`: the distance to 2 goes from ${f(Math.abs(w! - 2))} to ${f(Math.abs(n - 2))}`],
    mis: [{ v: w! + e! * s, why: ['你往上坡走了：要减去 η × 坡度。', 'You walked uphill: subtract η × slope.'], lab: ['坡的正负 → 往哪走', 'The slope’s sign → which way'], ly: 1 },
      { v: w! - e! * (w! - 2), why: ['坡度少了因子 2。', 'The slope is missing the 2.'], lab: ['算坡度', 'Working out the slope'], ly: 3 }] }; },
  dot2: ([a, b, c, d]) => ({ q: [`q = [${f(a!)}, ${f(b!)}]，k = [${f(c!)}, ${f(d!)}]，匹配分 q·k = ？`, `q = [${f(a!)}, ${f(b!)}], k = [${f(c!)}, ${f(d!)}]: match score q·k = ?`],
    a: dot([a!, b!], [c!, d!]), d: 2, tol: 0.006, w: [`\`${f(a!)} × ${f(c!)} + ${f(b!)} × ${f(d!)}\``, `\`${f(a!)} × ${f(c!)} + ${f(b!)} × ${f(d!)}\``],
    mis: [{ v: a! + b! + c! + d!, why: ['你把四个数都加起来了：点积是逐位相乘，再相加。', 'You added all four numbers: a dot product multiplies position by position, then adds.'], lab: ['需求 · 名牌 = 匹配分', 'need · tag = match score'], ly: 2, fr: 4 },
      { v: a! * c!, why: ['只乘了第一位：每一位都要乘，再加起来。', 'Only the first position: multiply every position, then add.'], lab: ['点积：逐位相乘再相加', 'Dot product: multiply, then add'], ly: 3 }] }),
  scale: ([s, k]) => ({ q: [`点积 ${f(s!)}，\`d_k = ${f(k!)}\`，缩放后的分数 = ？`, `A dot product of ${f(s!)}; \`d_k = ${f(k!)}\`. The scaled score = ?`],
    a: s! / Math.sqrt(k!), d: 2, tol: 0.006, w: [`\`${f(s!)} ÷ √${f(k!)} = ${f(s!)} ÷ ${f(Math.sqrt(k!))}\``, `\`${f(s!)} ÷ √${f(k!)} = ${f(s!)} ÷ ${f(Math.sqrt(k!))}\``],
    mis: [{ v: s! / k!, why: ['除多了：除的是 √d_k，不是 d_k。', 'Divided too much: divide by √d_k, not d_k.'], lab: ['÷ √d_k，防止一家独占', '÷ √d_k so no word takes everything'], ly: 2, fr: 5 },
      { v: s!, why: ['没有缩放：分数直接进 softmax 会“一家独占”。', 'No scaling: raw scores into softmax let one word take everything.'], lab: ['为什么要缩放', 'Why scale'], ly: 2, fr: 5 },
      { v: s! * Math.sqrt(k!), why: ['乘反了：是除以 √d_k。', 'Multiplied instead: divide by √d_k.'], lab: ['公式里的 / √d_k', 'The / √d_k in the formula'], ly: 4 }] }),
  mix: ([w1, w2, w3, v1, v2, v3]) => { const w = [w1!, w2!, w3!], v = [v1!, v2!, v3!], top = w.indexOf(Math.max(...w)); return {
    q: [`注意力权重 [${w.map((x) => f(x)).join(', ')}]，三个词的 V（各取一维）是 [${v.map((x) => f(x)).join(', ')}]。“它”拿到的新值 = ？`, `Attention weights [${w.map((x) => f(x)).join(', ')}]; the three words’ V (one dimension each) is [${v.map((x) => f(x)).join(', ')}]. The new value for “it” = ?`],
    a: dot(w, v), d: 2, tol: 0.006, w: [`\`${w.map((x, i) => `${f(x)} × ${f(v[i]!)}`).join(' + ')}\``, `\`${w.map((x, i) => `${f(x)} × ${f(v[i]!)}`).join(' + ')}\``],
    mis: [{ v: v.reduce((s2, x) => s2 + x, 0), why: ['你把 V 直接加起来了：要按权重混合。', 'You added the V values: mix them by the weights.'], lab: ['按比例混合 V', 'Mix V by the shares'], ly: 2, fr: 6 },
      { v: v.reduce((s2, x) => s2 + x, 0) / 3, why: ['你取了平均：每个词的分量不一样，要用权重。', 'You took the plain average: each word counts by its weight.'], lab: ['按比例混合 V', 'Mix V by the shares'], ly: 2, fr: 6 },
      { v: v[top]!, why: ['你只取了权重最大的那个：这是“硬查找”，注意力是把大家按比例混合。', 'You took only the top-weighted word: that is a hard lookup; attention mixes everyone by share.'], lab: ['软的 HashMap.get', 'A soft HashMap.get'], ly: 1 }] }; },
};
/** variant `i` (wraps around) of kind `k` */
export const varQ = (k: VarK, i: number): VarQ => { const L = VAR[k], n = L.length; return G[k](L[((i % n) + n) % n]!); };
export const varN = (k: VarK) => VAR[k].length;
/** which mistake (if any) a wrong answer matches */
export const misOf = (q: VarQ, v: number) => q.mis.find((m) => Math.abs(m.v - q.a) > q.tol && Math.abs(v - m.v) <= q.tol + 1e-9) ?? null;
