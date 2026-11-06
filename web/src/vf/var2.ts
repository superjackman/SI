/* R57 variant questions for every station past the 1 / 2 / 8a pilot. Same shape as vf/var.ts: a number set from
   dv/nums.ts VAR goes in, a computed answer and the common wrong paths come out. Entry 0 matches the station's own
   self-check when BASE2 names one. No attention shot here — only station 8a has that animation. */
import type { VarK } from '../dv/nums';
import { dot, norm, softmax } from './calc';

type T = readonly [string, string];
type Mis = { v: number; why: T; lab: T; ly: number };
export type Q2 = { q: T; a: number; d: number; tol: number; u?: T; mis: Mis[]; w: T };
const f = (v: number, d = 2) => { const s = Math.abs(v).toFixed(d).replace(/\.?0+$/, ''); return (v < 0 ? '−' : '') + (s === '' ? '0' : s); };
const ln = Math.log;
const sigm = (x: number) => 1 / (1 + Math.exp(-x));
const relu = (z: number) => Math.max(0, z);
const uniq = (a: number, tol: number, ms: Mis[]): Mis[] => {
  const o: Mis[] = [];
  for (const m of ms) {
    if (!Number.isFinite(m.v) || Math.abs(m.v - a) <= tol) continue;
    if (o.some((x) => Math.abs(x.v - m.v) <= tol)) continue;
    o.push(m);
  }
  return o;
};
const box = (name: string, q: T, a: number, d: number, tol: number, w: T, mis: Mis[], u?: T): Q2 => {
  const m = uniq(a, tol, mis);
  if (!m.length) throw new Error('variant has no distinct mistake: ' + name + ' / ' + q[0]);
  return u ? { q, a, d, tol, u, w, mis: m } : { q, a, d, tol, w, mis: m };
};
const M = (v: number, why: T, lab: T, ly: number): Mis => ({ v, why, lab, ly });
const xor = (x1: number, x2: number) => { const h1 = relu(x1 + x2), h2 = relu(x1 + x2 - 1); return { h1, h2, y: h1 - 2 * h2 }; };
const bpOf = (x: number, w1: number, w2: number, t: number) => {
  const h = relu(w1 * x), y = w2 * h, gy = 2 * (y - t);
  return { h, y, gy, gw2: gy * h, gw1: h > 0 ? gy * w2 * x : 0 };
};
const mom3v = (g: number) => { let v = 0; for (let i = 0; i < 3; i++) v = 0.9 * v + g; return v; };
const maj = (xs: readonly number[]) => {
  const c = new Map<number, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  let best = xs[0]!, n = 0;
  for (const [k, v] of c) if (v > n) { best = k; n = v; }
  return best;
};

export const extraG: Partial<Record<VarK, (p: readonly number[]) => Q2>> = {
  wlin: ([x1, y1, x2, y2]) => {
    const a = (y2! - y1!) / (x2! - x1!);
    return box('wlin', [`从样本 (${f(x1!, 0)}, ${f(y1!, 0)}) 到 (${f(x2!, 0)}, ${f(y2!, 0)})，直线的斜率 w = ？`, `From (${f(x1!, 0)}, ${f(y1!, 0)}) to (${f(x2!, 0)}, ${f(y2!, 0)}), the slope w = ?`],
      a, 0, 0.05, [`\`w = (${f(y2!, 0)} − ${f(y1!, 0)}) ÷ (${f(x2!, 0)} − ${f(x1!, 0)})\``, `\`w = (${f(y2!, 0)} − ${f(y1!, 0)}) ÷ (${f(x2!, 0)} − ${f(x1!, 0)})\``],
      [M(y2! - y1!, ['只减了 y，忘了除以 x 走了多远。', 'You subtracted the y values and forgot to divide by how far x moved.'], ['斜率 = Δy ÷ Δx', 'slope = Δy ÷ Δx'], 4),
        M((x2! - x1!) / (y2! - y1!), ['x 和 y 弄反了：斜率是 y 的变化除以 x 的变化。', 'x and y are swapped: slope is the change in y over the change in x.'], ['谁除以谁', 'Which divides which'], 3),
        M(y2! / x2!, ['你用终点的 y 除以终点的 x。截距不一定是 0，这样算不到斜率。', 'You divided the end y by the end x. The intercept need not be 0, so that is not the slope.'], ['两点才能定斜率', 'Two points fix the slope'], 1)]);
  },
  blin: ([w, x, y]) => {
    const a = y! - w! * x!;
    return box('blin', [`\`y = ${f(w!)} × x + b\` 经过 (${f(x!, 0)}, ${f(y!, 0)})。b = ？`, `\`y = ${f(w!)} × x + b\` passes through (${f(x!, 0)}, ${f(y!, 0)}). b = ?`],
      a, 0, 0.05, [`\`${f(y!, 0)} = ${f(w!)} × ${f(x!, 0)} + b\``, `\`${f(y!, 0)} = ${f(w!)} × ${f(x!, 0)} + b\``],
      [M(y! + w! * x!, ['你把 w×x 加回去了。b 要从 y 里减掉 w×x。', 'You added w×x back. b is y minus w×x.'], ['移项求 b', 'Rearrange for b'], 4),
        M(w! * x!, ['这是 w×x，不是截距。', 'That is w×x, not the intercept.'], ['b 是截距', 'b is the intercept'], 1),
        M(y! / w!, ['你用 y 除以 w 了。把点代进方程再解 b。', 'You divided y by w. Put the point into the equation and solve for b.'], ['代入一个点', 'Plug in one point'], 3)]);
  },
  ylin: ([w, x, b]) => {
    const a = w! * x! + b!;
    return box('ylin', [`w = ${f(w!)}、b = ${f(b!)}。没见过的 x = ${f(x!, 0)}，预测 y = ？`, `w = ${f(w!)}, b = ${f(b!)}. For a new x = ${f(x!, 0)}, predicted y = ?`],
      a, 0, 0.05, [`\`y = ${f(w!)} × ${f(x!, 0)} + ${f(b!)}\``, `\`y = ${f(w!)} × ${f(x!, 0)} + ${f(b!)}\``],
      [M(w! * x!, ['少加了截距 b。', 'The intercept b is missing.'], ['y = w×x + b', 'y = w×x + b'], 4),
        M(w! + x! + b!, ['你把三个数加起来了。w 是乘在 x 上的。', 'You added the three numbers. w multiplies x.'], ['先乘后加', 'Multiply, then add'], 3),
        M(x! + b!, ['w 没乘上去。', 'w never multiplied x.'], ['w 是斜率', 'w is the slope'], 1)]);
  },
  psum: ([a, b, c, d]) => {
    const s = a! + b! + c! + d!;
    return box('psum', [`四个候选的概率 ${f(a!)}、${f(b!)}、${f(c!)}、${f(d!)} 加起来 = ？`, `Probabilities ${f(a!)}, ${f(b!)}, ${f(c!)}, ${f(d!)} sum to ?`],
      s, 2, 0.006, [`\`${f(a!)} + ${f(b!)} + ${f(c!)} + ${f(d!)}\``, `\`${f(a!)} + ${f(b!)} + ${f(c!)} + ${f(d!)}\``],
      [M(a! + b! + c!, ['漏了最后一个。', 'The last one is missing.'], ['全部加起来', 'Add all of them'], 4),
        M(a! * b! * c! * d!, ['你乘起来了。可能性是加起来，不是乘起来。', 'You multiplied. Possibilities add, they do not multiply into the total.'], ['加，不是乘', 'Add, don’t multiply'], 1),
        M(s / 4, ['你取了平均。题目问的是总和。', 'You took the average. The question asks for the sum.'], ['总和，不是平均', 'The sum, not the mean'], 3)]);
  },
  crest: ([p, n]) => {
    const a = (1 - p!) / (n! - 1);
    return box('crest', [`${f(n!, 0)} 个候选，最大的占 ${f(p!)}。其余平分剩下的，每个 = ？（保留 3 位小数）`, `${f(n!, 0)} candidates; the favourite takes ${f(p!)}. Each of the others, sharing the rest equally, = ? (3 decimals)`],
      a, 3, 0.001, [`\`(1 − ${f(p!)}) ÷ ${f(n! - 1, 0)}\``, `\`(1 − ${f(p!)}) ÷ ${f(n! - 1, 0)}\``],
      [M(1 - p!, ['剩下的没再平分。', 'You did not share the rest.'], ['剩下的再平分', 'Share what is left'], 4),
        M(p! / n!, ['你把最大的那个除以总数了。', 'You divided the favourite by the count.'], ['先用 1 去减', 'Subtract from 1 first'], 3),
        M(1 / n!, ['你当成大家一样大了。', 'You treated every candidate as equal.'], ['不是均匀分布', 'Not a uniform split'], 1)]);
  },
  mean3: ([a, b, c]) => {
    const s = a! + b! + c!;
    return box('mean3', [`${f(a!)}、${f(b!)}、${f(c!)} 的均值 = ？（保留 2 位小数）`, `The mean of ${f(a!)}, ${f(b!)}, ${f(c!)} = ? (2 decimals)`],
      s / 3, 2, 0.006, [`\`(${f(a!)} + ${f(b!)} + ${f(c!)}) ÷ 3\``, `\`(${f(a!)} + ${f(b!)} + ${f(c!)}) ÷ 3\``],
      [M(s, ['加完忘了除以 3。', 'You added them and forgot to divide by 3.'], ['均值要除以个数', 'A mean divides by the count'], 4),
        M(Math.max(a!, b!, c!), ['你取了最大的那个。均值是中心，不是极端。', 'You took the largest. The mean is the centre, not the extreme.'], ['中心，不是最大', 'The centre, not the max'], 1),
        M(Math.min(a!, b!, c!), ['你取了最小的那个。', 'You took the smallest.'], ['三个都要算', 'All three count'], 3)]);
  },
  xoh: ([x1, x2]) => {
    const h = xor(x1!, x2!);
    return box('xoh', [`XOR 小网络：\`h2 = ReLU(${f(x1!, 0)} + ${f(x2!, 0)} − 1)\`。h2 = ？`, `The XOR net: \`h2 = ReLU(${f(x1!, 0)} + ${f(x2!, 0)} − 1)\`. h2 = ?`],
      h.h2, 0, 0.05, [`\`ReLU(${f(x1! + x2! - 1, 0)})\``, `\`ReLU(${f(x1! + x2! - 1, 0)})\``],
      [M(h.h1, ['这是 h1（两个输入直接相加），题目问的是 h2。', 'That is h1, the plain sum. The question asks for h2.'], ['h2 先减 1', 'h2 subtracts 1 first'], 3),
        M(h.y, ['这是最后的 y，不是 h2。', 'That is the final y, not h2.'], ['先算隐藏层', 'The hidden layer first'], 4),
        M(x1! + x2!, ['你没做 ReLU，也没减 1。', 'No ReLU, and you did not subtract 1.'], ['ReLU(z) = max(0, z)', 'ReLU(z) = max(0, z)'], 1)]);
  },
  xoy: ([x1, x2]) => {
    const h = xor(x1!, x2!);
    return box('xoy', [`同一网络，输入 (${f(x1!, 0)}, ${f(x2!, 0)}) 时 y = h1 − 2×h2 = ？`, `Same net, input (${f(x1!, 0)}, ${f(x2!, 0)}): y = h1 − 2×h2 = ?`],
      h.y, 0, 0.05, [`\`h1 = ${f(h.h1, 0)}\`，\`h2 = ${f(h.h2, 0)}\`，\`y = ${f(h.h1, 0)} − 2 × ${f(h.h2, 0)}\``, `\`h1 = ${f(h.h1, 0)}\`, \`h2 = ${f(h.h2, 0)}\`, \`y = ${f(h.h1, 0)} − 2 × ${f(h.h2, 0)}\``],
      [M(h.h2, ['你停在 h2 了。y 还要把 h2 乘 2 再从 h1 里减去。', 'You stopped at h2. y still subtracts twice h2 from h1.'], ['y = h1 − 2×h2', 'y = h1 − 2×h2'], 4),
        M(h.h1, ['你只报了 h1。负的那一路（h2）还没减。', 'You reported only h1. The negative path, h2, is still missing.'], ['两条隐藏路', 'Both hidden paths'], 3),
        M(2 * h.h1, ['你把 h1 翻倍了，没有减去 2×h2。', 'You doubled h1 and never subtracted 2×h2.'], ['减的是 2×h2', 'Subtract 2×h2'], 1)]);
  },
  relu1: ([z]) => box('relu1', [`\`ReLU(${f(z!)})\` = ？`, `\`ReLU(${f(z!)})\` = ?`],
    relu(z!), 1, 0.05, ['负数变 0，正数原样留下。', 'Negatives become 0; positives stay as they are.'],
    [M(z!, ['负数也放过去了。ReLU 会把小于 0 的切掉。', 'You let a negative through. ReLU cuts off anything below 0.'], ['ReLU 切掉负数', 'ReLU cuts negatives'], 4),
      M(Math.abs(z!), ['你取了绝对值。ReLU 不是把负号翻正，是把负数变成 0。', 'You took the absolute value. ReLU does not flip the sign; it turns negatives into 0.'], ['不是绝对值', 'Not the absolute value'], 1),
      M(0, ['正数也被你变成 0 了。ReLU 只切负数。', 'You zeroed a positive number too. ReLU only cuts negatives.'], ['正数原样通过', 'Positives pass through'], 3)]),
  chn: ([a, b, c]) => box('chn', [`三层各放大 ${f(a!)}、${f(b!)}、${f(c!)} 倍。dL/dx = ？`, `Three layers scale by ${f(a!)}, ${f(b!)} and ${f(c!)}. dL/dx = ?`],
    a! * b! * c!, 1, 0.05, [`\`${f(a!)} × ${f(b!)} × ${f(c!)}\``, `\`${f(a!)} × ${f(b!)} × ${f(c!)}\``],
    [M(a! + b! + c!, ['你加起来了。链式法则是把每一层的倍数乘起来。', 'You added them. The chain rule multiplies each layer’s factor.'], ['连乘，不是相加', 'Multiply, don’t add'], 4),
      M(a! * b!, ['漏了最后一层。', 'The last layer is missing.'], ['每一层都要乘', 'Every layer multiplies'], 3),
      M(a! * b! / c!, ['最后一层你做成了除法。它也是乘上去的。', 'You divided by the last factor. It multiplies too.'], ['三层都是乘法', 'All three are multiplications'], 1)]),
  bp2: ([x, w1, w2, t]) => {
    const b = bpOf(x!, w1!, w2!, t!);
    return box('bp2', [`\`y = w2 × ReLU(w1 × x)\`，x = ${f(x!, 0)}、w1 = ${f(w1!, 0)}、w2 = ${f(w2!, 0)}、t = ${f(t!, 0)}。dL/dw2 = ？`, `\`y = w2 × ReLU(w1 × x)\`, x = ${f(x!, 0)}, w1 = ${f(w1!, 0)}, w2 = ${f(w2!, 0)}, t = ${f(t!, 0)}. dL/dw2 = ?`],
      b.gw2, 0, 0.1, [`\`dL/dy = ${f(b.gy, 0)}\`，再乘 h = ${f(b.h, 0)}\``, `\`dL/dy = ${f(b.gy, 0)}\`, then times h = ${f(b.h, 0)}\``],
      [M(b.gy, ['你停在 dL/dy，忘了再乘这一层的 h。', 'You stopped at dL/dy and forgot to multiply by this layer’s h.'], ['dL/dw2 = dL/dy × h', 'dL/dw2 = dL/dy × h'], 4),
        M(b.gw1, ['这是 dL/dw1。题目问的是 w2。', 'That is dL/dw1. The question asks for w2.'], ['看清是哪个旋钮', 'Which knob'], 3),
        M(b.y - t!, ['你只算了 y − t，损失的导数还有一个 2，并且要乘上 h。', 'You stopped at y − t. The loss derivative still has a 2, and then times h.'], ['平方损失的导数', 'Derivative of the squared loss'], 1)]);
  },
  bp1: ([x, w1, w2, t]) => {
    const b = bpOf(x!, w1!, w2!, t!);
    return box('bp1', [`\`y = w2 × ReLU(w1 × x)\`，x = ${f(x!, 0)}、w1 = ${f(w1!, 0)}、w2 = ${f(w2!, 0)}、t = ${f(t!, 0)}。dL/dw1 = ？`, `\`y = w2 × ReLU(w1 × x)\`, x = ${f(x!, 0)}, w1 = ${f(w1!, 0)}, w2 = ${f(w2!, 0)}, t = ${f(t!, 0)}. dL/dw1 = ?`],
      b.gw1, 0, 0.1, [`\`dL/dh = ${f(b.gy * w2!, 0)}\`，h > 0 所以再乘 x = ${f(x!, 0)}\``, `\`dL/dh = ${f(b.gy * w2!, 0)}\`; h > 0, so times x = ${f(x!, 0)}\``],
      [M(b.gw2, ['这是 dL/dw2。问的是更前面的 w1，梯度还要再传一层。', 'That is dL/dw2. w1 is further forward; the gradient still has one layer to cross.'], ['再传过 ReLU', 'On through the ReLU'], 4),
        M(b.h, ['你停在前向的 h。反向要的是梯度，不是激活值。', 'You stopped at the forward h. Backprop wants the gradient, not the activation.'], ['梯度不是激活值', 'A gradient is not an activation'], 1),
        M(t!, ['这是目标 t，不是梯度。', 'That is the target t, not a gradient.'], ['从损失往回', 'Back from the loss'], 3)]);
  },
  epoch: ([n, b]) => box('epoch', [`${f(n!, 0)} 条样本、批大小 ${f(b!, 0)}。一轮约更新多少次？`, `${f(n!, 0)} samples, batch ${f(b!, 0)}. About how many updates per epoch?`],
    n! / b!, 0, 10, [`\`${f(n!, 0)} ÷ ${f(b!, 0)}\``, `\`${f(n!, 0)} ÷ ${f(b!, 0)}\``],
    [M(n! / (b! * 2), ['批大小用大了一倍，更新次数就少了一半。', 'You doubled the batch, so you halved the updates.'], ['样本数 ÷ 批大小', 'samples ÷ batch'], 4),
      M(b!, ['你报了批大小本身。要的是一轮能走多少步。', 'You reported the batch size. The question wants how many steps an epoch takes.'], ['一轮有多少步', 'How many steps in an epoch'], 3),
      M(n! / b! * 2, ['你把批大小缩小了一倍。', 'You halved the batch size.'], ['分母是批大小', 'The batch is the divisor'], 1)]),
  mom3: ([g]) => {
    const v1 = g!, v2 = 0.9 * v1 + g!, v3 = mom3v(g!);
    return box('mom3', [`动量 0.9，坡度一直是 ${f(g!)}。从 v = 0 走 3 步，v = ？（保留 2 位小数）`, `Momentum 0.9, gradient always ${f(g!)}. From v = 0, v after 3 steps = ? (2 decimals)`],
      v3, 2, 0.006, [`\`v = 0.9 × v + ${f(g!)}\`，连做 3 次`, `\`v = 0.9 × v + ${f(g!)}\`, three times`],
      [M(v2, ['你少走了一步，停在第 2 步。', 'You stopped a step early, at step 2.'], ['连做 3 次', 'Three steps'], 3),
        M(3 * g!, ['你把三次坡度直接加起来了，动量每次还要乘 0.9。', 'You added the three gradients raw. Momentum multiplies the past by 0.9 each time.'], ['v = βv + g', 'v = βv + g'], 4),
        M(v1, ['这只是第 1 步。', 'That is only step 1.'], ['从 0 走到第 3 步', 'From 0 to step 3'], 1)]);
  },
  gap: ([tr, va]) => box('gap', [`训练准确率 ${f(tr!, 0)}%、验证准确率 ${f(va!, 0)}%。差多少个百分点？`, `Training accuracy ${f(tr!, 0)}%, validation ${f(va!, 0)}%. The gap in percentage points = ?`],
    tr! - va!, 0, 0.5, [`\`${f(tr!, 0)} − ${f(va!, 0)}\``, `\`${f(tr!, 0)} − ${f(va!, 0)}\``],
    [M(tr!, ['你只报了训练准确率。差距是两者相减。', 'You reported only the training accuracy. The gap is the difference.'], ['两者相减', 'Subtract the two'], 4),
      M(va!, ['你只报了验证准确率。', 'You reported only the validation accuracy.'], ['训练 − 验证', 'train − validation'], 3),
      M((tr! + va!) / 2, ['你取了平均。过拟合看的是落差，不是平均分。', 'You took the average. Overfitting is the drop, not the average score.'], ['落差才是信号', 'The drop is the signal'], 1)]),
  emb: ([v, d]) => box('emb', [`词表 ${f(v!, 0)}，嵌入维度 ${f(d!, 0)}。一个词要存多少个数？`, `A vocab of ${f(v!, 0)} and embedding width ${f(d!, 0)}. How many numbers does one word store?`],
    d!, 0, 0.5, ['嵌入之后，一个词就是这么多维的一串数。', 'After the embedding, one word is a list that long.'],
    [M(v!, ['你还停在 one-hot：维度等于词表大小。嵌入把每个词收成一小串。', 'You stayed with one-hot, where the width is the vocab size. An embedding shrinks each word to a short list.'], ['稠密的一小串', 'A short dense list'], 1),
      M(v! * d!, ['这是整张嵌入表。题目问的是一个词。', 'That is the whole embedding table. The question asks about one word.'], ['一个词，不是整张表', 'One word, not the table'], 4),
      M(1, ['一个数只是 one-hot 里那个 1 的位置，没有“像不像”的信息。', 'A single number is just where the 1 sits in a one-hot. It cannot say “how alike”.'], ['one-hot 看不出像不像', 'one-hot cannot show likeness'], 3)]),
  dotw: ([a, b, c, d]) => box('dotw', [`词向量 [${f(a!)}, ${f(b!)}] · [${f(c!)}, ${f(d!)}] = ？`, `Word vectors [${f(a!)}, ${f(b!)}] · [${f(c!)}, ${f(d!)}] = ?`],
    a! * c! + b! * d!, 1, 0.06, [`\`${f(a!)} × ${f(c!)} + ${f(b!)} × ${f(d!)}\``, `\`${f(a!)} × ${f(c!)} + ${f(b!)} × ${f(d!)}\``],
    [M(a! + b! + c! + d!, ['你把四个数加起来了。点积是逐位相乘再相加。', 'You added all four numbers. A dot product multiplies position by position, then adds.'], ['逐位相乘再相加', 'Multiply, then add'], 4),
      M(a! * c!, ['只乘了第一位。', 'Only the first position.'], ['每一位都要乘', 'Every position'], 3),
      M(a! * b! + c! * d!, ['你把每个向量自己乘自己了，不是两个向量对应位相乘。', 'You multiplied inside each vector, not across the two vectors.'], ['对应位相乘', 'Matching positions'], 1)]),
  dot3: ([a, b, c, d, e, g]) => box('dot3', [`[${f(a!)}, ${f(b!)}, ${f(c!)}] · [${f(d!)}, ${f(e!)}, ${f(g!)}] = ？`, `[${f(a!)}, ${f(b!)}, ${f(c!)}] · [${f(d!)}, ${f(e!)}, ${f(g!)}] = ?`],
    a! * d! + b! * e! + c! * g!, 2, 0.006, [`\`${f(a!)}×${f(d!)} + ${f(b!)}×${f(e!)} + ${f(c!)}×${f(g!)}\``, `\`${f(a!)}×${f(d!)} + ${f(b!)}×${f(e!)} + ${f(c!)}×${f(g!)}\``],
    [M(a! * d!, ['只乘了第一位。', 'Only the first position.'], ['三维都要乘', 'All three positions'], 3),
      M(a! + b! + c! + d! + e! + g!, ['你把六个数加起来了。', 'You added all six numbers.'], ['点积不是相加', 'A dot product is not a sum'], 1),
      M(a! * d! + b! * e!, ['漏了第三位。', 'The third position is missing.'], ['三位都算', 'All three count'], 4)]),
  seqn: ([n]) => box('seqn', [`一句话 ${f(n!, 0)} 个词。RNN 要依次算多少步，才读得完？`, `A sentence of ${f(n!, 0)} words. How many steps must an RNN take, one after another, to read it?`],
    n!, 0, 0.1, ['RNN 读一个词才更新一次记忆，不能同时读。', 'An RNN updates its memory once per word; it cannot read them all at once.'],
    [M(1, ['那是注意力：所有位置可以同时算。RNN 做不到。', 'That is attention: every position at once. An RNN cannot.'], ['RNN 不能并行', 'An RNN cannot run in parallel'], 1),
      M(n! * (n! - 1) / 2, ['你配了对。RNN 是顺着读，不是两两比较。', 'You counted pairs. An RNN reads in order; it does not compare every pair.'], ['顺着读', 'Read in order'], 2),
      M(n! - 1, ['少了一步。n 个词就要更新 n 次记忆。', 'One step short. n words means n updates of the memory.'], ['一词一步', 'One word, one step'], 4)]),
  halv: ([n]) => box('halv', [`开头那个词的影响每步约减半。${f(n!, 0)} 步之后还剩几成？（保留 4 位小数）`, `The first word’s influence about halves each step. After ${f(n!, 0)} steps, what fraction is left? (4 decimals)`],
    0.5 ** n!, 4, 0.0001, [`\`0.5^${f(n!, 0)}\``, `\`0.5^${f(n!, 0)}\``],
    [M(0.5 * n!, ['你用乘法代替了乘方。每步都是再乘 0.5，不是加一次 0.5。', 'You multiplied instead of using a power. Each step multiplies by 0.5 again.'], ['每步再乘 0.5', 'Multiply by 0.5 again'], 4),
      M(0.5 ** (n! - 1), ['少衰减了一步。', 'You decayed one step too few.'], ['走满 n 步', 'All n steps'], 3),
      M(1, ['你当成完全没衰减。纸条传得越远，开头越淡。', 'You treated it as no decay. The further the note travels, the fainter the start.'], ['长依赖会淡', 'Long range fades'], 1)]),
  smw: ([a, b, c]) => {
    const p = softmax([a!, b!, c!]);
    return box('smw', [`三个词打分 ${f(a!)}、${f(b!)}、${f(c!)}。softmax 后第一个的权重 = ？（保留 3 位小数）`, `Three words scored ${f(a!)}, ${f(b!)}, ${f(c!)}. After softmax, the first weight = ? (3 decimals)`],
      p[0]!, 3, 0.005, [`先取 e 的指数，再除以三个的总和`, `Exponentiate, then divide by the sum of the three`],
      [M(p[1]!, ['这是第二个词的权重。', 'That is the second word’s weight.'], ['问的是第一个', 'The question asks for the first'], 3),
        M(1 / 3, ['你当成三个一样大。分数不一样，权重就不一样。', 'You treated the three as equal. Different scores, different weights.'], ['softmax 拉开差距', 'softmax stretches the gaps'], 1),
        M(a!, ['你直接把分数当权重了。权重要先取指数，再归一化，而且加起来是 1。', 'You used the raw score as the weight. Exponentiate, then normalise; weights sum to 1.'], ['分数还不是权重', 'A score is not yet a weight'], 4)]);
  },
  hd: ([d, h]) => box('hd', [`模型宽 d = ${f(d!, 0)}，分成 ${f(h!, 0)} 个头。每个头的 q、k 是多少维？`, `Width d = ${f(d!, 0)}, split into ${f(h!, 0)} heads. How wide is each head’s q and k?`],
    d! / h!, 0, 0.1, [`\`${f(d!, 0)} ÷ ${f(h!, 0)}\``, `\`${f(d!, 0)} ÷ ${f(h!, 0)}\``],
    [M(d! * h!, ['多头不是把维度乘上头数。是把 d 平均切开。', 'Multi-head does not multiply the width by the head count. It cuts d into equal parts.'], ['切开，不是复制', 'Cut, don’t copy'], 1),
      M(d! - h!, ['你相减了。每个头的宽度是 d ÷ h。', 'You subtracted. Each head is d ÷ h wide.'], ['d ÷ h', 'd ÷ h'], 4),
      M(h!, ['你报了头的个数。问的是每个头多宽。', 'You reported how many heads. The question asks how wide each one is.'], ['每个头多宽', 'How wide each head is'], 3)]),
  pmill: ([d]) => box('pmill', [`d = ${f(d!, 0)}。一个解码块约 \`12 × d²\` 个参数，合多少百万？（保留 1 位小数）`, `d = ${f(d!, 0)}. One decoder block has about \`12 × d²\` parameters. How many million? (1 decimal)`],
    (12 * d! * d!) / 1e6, 1, 0.15, [`\`12 × ${f(d!, 0)} × ${f(d!, 0)} ÷ 1,000,000\``, `\`12 × ${f(d!, 0)} × ${f(d!, 0)} ÷ 1,000,000\``],
    [M((4 * d! * d!) / 1e6, ['你只算了注意力那 \`4 × d²\`，漏了前馈的 \`8 × d²\`。', 'You counted only attention’s \`4 × d²\` and missed the feed-forward \`8 × d²\`.'], ['注意力 4，前馈 8', 'attention 4, feed-forward 8'], 4),
      M((8 * d! * d!) / 1e6, ['你只算了前馈。一块里注意力和前馈都有。', 'You counted only the feed-forward. A block has both.'], ['两样都要加', 'Add both'], 3),
      M((d! * d!) / 1e6, ['少乘了 12。一块大约是 12 个 d²。', 'The 12 is missing. A block is about 12 copies of d².'], ['约 12 × d²', 'about 12 × d²'], 1)]),
  res: ([x, fx]) => box('res', [`残差：x = ${f(x!, 0)}，这一层算出 F(x) = ${f(fx!, 0)}。送去下一层的是？`, `Residual: x = ${f(x!, 0)}, and this layer computes F(x) = ${f(fx!, 0)}. What goes to the next layer?`],
    x! + fx!, 0, 0.1, [`\`x + F(x) = ${f(x!, 0)} + ${f(fx!, 0)}\``, `\`x + F(x) = ${f(x!, 0)} + ${f(fx!, 0)}\``],
    [M(x! * fx!, ['你乘起来了。残差是在原稿上加批注：x + F(x)。', 'You multiplied. A residual adds a note on the original: x + F(x).'], ['加，不是乘', 'Add, don’t multiply'], 4),
      M(fx!, ['你把原稿扔了，只留了这一层的新结果。梯度就没有那条直通路。', 'You threw away the original and kept only the new result. The straight path for the gradient is gone.'], ['原稿要留下', 'Keep the original'], 1),
      M(x! - fx!, ['你相减了。残差是相加。', 'You subtracted. A residual adds.'], ['x + F(x)', 'x + F(x)'], 3)]),
  ntok: ([n]) => box('ntok', [`一句话 ${f(n!, 0)} 个词元。一次前向同时练几道“猜下一个”？`, `A sentence of ${f(n!, 0)} tokens. How many “guess the next one” questions does one forward pass train?`],
    n! - 1, 0, 0.1, ['每个位置猜它后面那个；最后一个后面没有字。', 'Each position guesses the one after it; nothing follows the last.'],
    [M(n!, ['最后一个词元后面没有字，不能再出一道题。', 'Nothing follows the last token, so it is not another question.'], ['n 个词元，n−1 道题', 'n tokens, n−1 questions'], 4),
      M(n! - 2, ['你多减了 1。', 'You subtracted one too many.'], ['只减去最后一个', 'Only the last one drops out'], 3),
      M(1, ['不是只练最后一个字。因果遮罩让每个位置同时猜自己的下一个。', 'Not only the last word. The causal mask lets every position guess its own next one.'], ['每个位置都在练', 'Every position trains'], 1)]),
  ppl: ([k]) => box('ppl', [`平均损失 L = ln ${f(k!, 0)}。困惑度 e^L = ？`, `Mean loss L = ln ${f(k!, 0)}. Perplexity e^L = ?`],
    k!, 0, 0.05, [`\`e^(ln ${f(k!, 0)}) = ${f(k!, 0)}\``, `\`e^(ln ${f(k!, 0)}) = ${f(k!, 0)}\``],
    [M(ln(k!), ['你停在 ln 上了。困惑度是 e 的 L 次方，和 ln 互为反运算。', 'You stopped at ln. Perplexity is e to the power L, which undoes ln.'], ['困惑度 = e^L', 'perplexity = e^L'], 4),
      M(k! * k!, ['你把候选数平方了。', 'You squared the candidate count.'], ['e 的 ln k 次方就是 k', 'e to the ln k is k'], 3),
      M(1 / k!, ['你取了倒数。困惑度是“平均在几个里犹豫”，k 个就是 k。', 'You took the reciprocal. Perplexity is “torn between how many”, and k of them is k.'], ['犹豫的个数', 'How many it is torn between'], 1)]),
  pplE: ([k]) => box('pplE', [`评估时平均损失 L = ln ${f(k!, 0)}。困惑度 = ？`, `At eval time the mean loss is L = ln ${f(k!, 0)}. Perplexity = ?`],
    k!, 0, 0.05, [`\`e^(ln ${f(k!, 0)}) = ${f(k!, 0)}\``, `\`e^(ln ${f(k!, 0)}) = ${f(k!, 0)}\``],
    [M(ln(k!), ['这是损失本身，不是困惑度。', 'That is the loss itself, not the perplexity.'], ['再取 e^L', 'Then take e^L'], 4),
      M(k! * k!, ['平方了。', 'Squared.'], ['e^(ln k) = k', 'e^(ln k) = k'], 3),
      M(1 / k!, ['取了倒数。', 'Reciprocal.'], ['困惑度是个数', 'Perplexity is a count'], 1)]),
  tmp: ([a, b, c, t]) => {
    const pct = (T: number) => 100 * softmax([a!, b!, c!], T)[0]!;
    const raw = (100 * a!) / (a! + b! + c!);
    const other = t === 1 ? 2 : 1;
    return box('tmp', [`分数 ${f(a!)}、${f(b!)}、${f(c!)}，温度 T = ${f(t!)}。第一个的概率约百分之几？（取整）`, `Scores ${f(a!)}, ${f(b!)}, ${f(c!)}, temperature T = ${f(t!)}. The first probability in percent? (whole number)`],
      pct(t!), 0, 0.6, [`分数先除以 T，再 softmax`, `Divide the scores by T, then softmax`],
      [M(pct(other), [`你用了 T = ${f(other, 0)}。温度是先把分数除以 T，再 softmax。`, `You used T = ${f(other, 0)}. Temperature divides the scores by T, then softmax.`], ['先除以 T', 'Divide by T first'], 4),
        M(raw, ['你没取指数，直接用分数占比。', 'You skipped the exponential and used the raw share of the scores.'], ['softmax 先取指数', 'softmax exponentiates first'], 3),
        M(100 * softmax([a!, b!, c!], t!)[1]!, ['这是第二个候选。', 'That is the second candidate.'], ['问的是第一个', 'The first one'], 1)],
      ['%', '%']);
  },
  acc: ([r, n]) => box('acc', [`${f(n!, 0)} 道题做对 ${f(r!, 0)} 道。准确率是百分之几？`, `${f(r!, 0)} right out of ${f(n!, 0)}. Accuracy in percent = ?`],
    (100 * r!) / n!, 0, 0.5, [`\`${f(r!, 0)} ÷ ${f(n!, 0)}\``, `\`${f(r!, 0)} ÷ ${f(n!, 0)}\``],
    [M(r!, ['你报了做对的题数，还没换成百分数。', 'You reported how many were right, not the percent.'], ['做对 ÷ 总数', 'right ÷ total'], 4),
      M(n!, ['你报了总题数。', 'You reported the total.'], ['分母是总题数', 'The total is the divisor'], 3),
      M(r! / n!, ['这是比例，不是百分数。还要乘 100。', 'That is the fraction, not the percent. Times 100.'], ['百分数要 ×100', 'Percent means ×100'], 1)]),
  clean: ([n, k]) => box('clean', [`测试集 ${f(n!, 0)} 题，有 ${f(k!, 0)} 题泄漏进了训练集。还剩多少道干净的？`, `${f(n!, 0)} test items, ${f(k!, 0)} of them leaked into training. How many are still clean?`],
    n! - k!, 0, 0.1, [`\`${f(n!, 0)} − ${f(k!, 0)}\``, `\`${f(n!, 0)} − ${f(k!, 0)}\``],
    [M(n!, ['你没扣掉泄漏的。那些题的分数不可信。', 'You did not remove the leaked ones. Their scores cannot be trusted.'], ['泄漏的要扣掉', 'Drop the leaked ones'], 1),
      M(k!, ['你报了泄漏的题数。问的是还干净的。', 'You reported how many leaked. The question asks how many are still clean.'], ['干净 = 总数 − 泄漏', 'clean = total − leaked'], 4),
      M(n! + k!, ['你加起来了。泄漏是从测试里污染出去的，不是新题。', 'You added. Leaked items are contaminated test items, not new ones.'], ['相减', 'Subtract'], 3)]),
  sig: ([ra, rb]) => {
    const z = ra! - rb!;
    return box('sig', [`奖励 r_A = ${f(ra!)}，r_B = ${f(rb!)}。\`P(A 优于 B) = σ(r_A − r_B)\` = ？（保留 2 位小数）`, `Rewards r_A = ${f(ra!)}, r_B = ${f(rb!)}. \`P(A beats B) = σ(r_A − r_B)\` = ? (2 decimals)`],
      sigm(z), 2, 0.006, [`\`σ(${f(z)}) = 1 ÷ (1 + e^(−${f(z)}))\``, `\`σ(${f(z)}) = 1 ÷ (1 + e^(−${f(z)}))\``],
      [M(z, ['你停在分数差上了，还没套进 σ。', 'You stopped at the score gap and never applied σ.'], ['差还要经过 σ', 'The gap still goes through σ'], 4),
        M(sigm(ra!) - sigm(rb!), ['你分别套了 σ 再相减。σ 套在“差”上，不是两个 σ 相减。', 'You applied σ to each score and subtracted. σ wraps the difference, not the other way around.'], ['σ 套在差上', 'σ wraps the gap'], 3),
        M(rb! === 0 ? ra! + 1 : ra! / rb!, ['你把两个分数做了除法。要比的是差。', 'You divided the two scores. What gets compared is the gap.'], ['看 r_A − r_B', 'Look at r_A − r_B'], 1)]);
  },
  sige: ([ra, rb]) => box('sige', [`两个回答得分都是 ${f(ra!)}。P(A 优于 B) = ？`, `Both answers score ${f(ra!)}. P(A beats B) = ?`],
    sigm(ra! - rb!), 1, 0.05, ['分数一样，差是 0，σ(0) = 0.5。', 'Equal scores, gap 0, σ(0) = 0.5.'],
    [M(0, ['差是 0，但概率不是 0。一样好的时候，各有一半机会被选中。', 'The gap is 0, but the probability is not 0. Equally good means a half chance each.'], ['σ(0) = 1/2', 'σ(0) = 1/2'], 4),
      M(1, ['不是“一定选 A”。分数没分出高低。', 'Not “certainly A”. The scores did not pick a winner.'], ['分不出高低就是 0.5', 'No winner means 0.5'], 1),
      M(ra!, ['你把奖励分数当成了概率。概率要经过 σ。', 'You used the reward as the probability. The probability goes through σ.'], ['奖励还不是概率', 'A reward is not a probability'], 3)]),
  rkl: ([r, beta, kl]) => box('rkl', [`奖励 r = ${f(r!)}，KL 惩罚系数 β = ${f(beta!)}，KL = ${f(kl!)}。目标 r − β×KL = ？`, `Reward r = ${f(r!)}, KL weight β = ${f(beta!)}, KL = ${f(kl!)}. The objective r − β×KL = ?`],
    r! - beta! * kl!, 2, 0.006, [`\`${f(r!)} − ${f(beta!)} × ${f(kl!)}\``, `\`${f(r!)} − ${f(beta!)} × ${f(kl!)}\``],
    [M(r! - kl!, ['β 没乘上去。惩罚是 β 倍的 KL，不是整个 KL。', 'β never multiplied. The penalty is β times the KL, not the whole KL.'], ['惩罚 = β×KL', 'penalty = β×KL'], 4),
      M(r! + beta! * kl!, ['你把惩罚加上去了。目标是奖励减去它，免得跑得太远。', 'You added the penalty. The objective subtracts it, so the model cannot run too far.'], ['是减去，不是加上', 'Subtract, don’t add'], 1),
      M(r!, ['KL 那一项整项丢了。', 'The whole KL term is missing.'], ['别离原模型太远', 'Don’t drift too far'], 3)]),
  loraN: ([d, r]) => box('loraN', [`${f(d!, 0)} × ${f(d!, 0)} 的矩阵，LoRA 秩 r = ${f(r!, 0)}。B 是 ${f(d!, 0)}×${f(r!, 0)}，A 是 ${f(r!, 0)}×${f(d!, 0)}。要训练多少个数？`, `A ${f(d!, 0)} × ${f(d!, 0)} matrix, LoRA rank r = ${f(r!, 0)}. B is ${f(d!, 0)}×${f(r!, 0)}, A is ${f(r!, 0)}×${f(d!, 0)}. How many numbers are trained?`],
    2 * d! * r!, 0, 0.5, [`\`${f(d!, 0)} × ${f(r!, 0)} + ${f(r!, 0)} × ${f(d!, 0)}\``, `\`${f(d!, 0)} × ${f(r!, 0)} + ${f(r!, 0)} × ${f(d!, 0)}\``],
    [M(d! * r!, ['你只算了一个小矩阵。B 和 A 都要训练。', 'You counted only one small matrix. Both B and A train.'], ['B 和 A 都算', 'Count both B and A'], 4),
      M(d! * d!, ['这是冻住的 W。LoRA 不训练它。', 'That is the frozen W. LoRA does not train it.'], ['W 冻住', 'W stays frozen'], 1),
      M(r! * r!, ['这只是 r×r 的一小块，不是 B 和 A。', 'That is a tiny r×r block, not B and A.'], ['B 是 d×r，A 是 r×d', 'B is d×r, A is r×d'], 3)]),
  qgb: ([bill, bits]) => box('qgb', [`${f(bill! * 10, 0)} 亿个参数，每个用 ${f(bits!, 0)} 位存。约多少 GB？（保留 1 位小数）`, `${f(bill!, 0)} billion parameters at ${f(bits!, 0)} bits each. About how many GB? (1 decimal)`],
    (bill! * bits!) / 8, 1, 0.1, [`\`${f(bill!, 0)} × ${f(bits!, 0)} ÷ 8\``, `\`${f(bill!, 0)} × ${f(bits!, 0)} ÷ 8\``],
    [M(bill! * bits!, ['你把“位”当成了“字节”。8 位才是 1 字节。', 'You treated bits as bytes. 8 bits make 1 byte.'], ['先换成字节', 'Turn bits into bytes'], 4),
      M(bill! * 2, ['这是 16 位（FP16）的体积，不一定是这道题的位数。', 'That is the 16-bit (FP16) size, which may not be this question’s bit width.'], ['按题目的位数', 'Use this question’s bit width'], 1),
      M((bill! * bits!) / 4, ['你除以 4 了。1 字节是 8 位。', 'You divided by 4. A byte is 8 bits.'], ['÷ 8', '÷ 8'], 3)],
    ['GB', 'GB']),
  loraf: ([d, r]) => box('loraf', [`d = ${f(d!, 0)}，r = ${f(r!, 0)}。LoRA 要训练的个数占整块矩阵的百分之多少？（保留 2 位小数）`, `d = ${f(d!, 0)}, r = ${f(r!, 0)}. LoRA’s trained numbers are what percent of the full matrix? (2 decimals)`],
    (100 * 2 * r!) / d!, 2, 0.006, [`\`2 × ${f(r!, 0)} ÷ ${f(d!, 0)} × 100\``, `\`2 × ${f(r!, 0)} ÷ ${f(d!, 0)} × 100\``],
    [M((100 * r!) / d!, ['少了一个小矩阵，只算了一半。', 'One of the two small matrices is missing: you counted half.'], ['B 和 A 都占一份', 'Both B and A count'], 4),
      M(100, ['那是把整个 W 都拿去训练。LoRA 只动支路。', 'That would be training all of W. LoRA only trains the side path.'], ['只占一小条', 'Only a thin slice'], 1),
      M(r! / d!, ['这是比例，不是百分数，而且少了那个 2。', 'That is a fraction, not a percent, and the 2 is missing.'], ['百分数 ×100', 'Percent means ×100'], 3)]),
  kvb: ([L, h, d, by]) => {
    const full = 2 * L! * h! * d! * by!;
    return box('kvb', [`${f(L!, 0)} 层、${f(h!, 0)} 个 KV 头、头维度 ${f(d!, 0)}、每个数 ${f(by!, 0)} 字节。每个词元的 KV 缓存是多少字节？`, `${f(L!, 0)} layers, ${f(h!, 0)} KV heads, head size ${f(d!, 0)}, ${f(by!, 0)} bytes each. Bytes of KV cache per token = ?`],
      full, 0, 1, [`\`2 × ${f(L!, 0)} × ${f(h!, 0)} × ${f(d!, 0)} × ${f(by!, 0)}\``, `\`2 × ${f(L!, 0)} × ${f(h!, 0)} × ${f(d!, 0)} × ${f(by!, 0)}\``],
      [M(full / 2, ['少了那个 2。K 和 V 各存一份。', 'The 2 is missing. K and V are each stored.'], ['K 一份，V 一份', 'One for K, one for V'], 4),
        M(2 * L! * d! * by!, ['KV 头数没乘。每个头都有自己的 K、V。', 'The KV-head count never multiplied. Every head has its own K and V.'], ['乘上头数', 'Times the head count'], 3),
        M(d! * by!, ['这只是一个头里一个向量的一个数的量级，不是整段缓存。', 'That is one number in one head, not the whole cache.'], ['层、头、K/V 都要算', 'Layers, heads, K and V'], 1)]);
  },
  tri: ([n]) => box('tri', [`生成 ${f(n!, 0)} 个词元，不用缓存时第 t 步要重算 t 个词元。一共算多少次？`, `Generate ${f(n!, 0)} tokens. Without a cache, step t recomputes t tokens. How many in total?`],
    (n! * (n! + 1)) / 2, 0, 0.5, [`\`${f(n!, 0)} × ${f(n! + 1, 0)} ÷ 2\``, `\`${f(n!, 0)} × ${f(n! + 1, 0)} ÷ 2\``],
    [M(n! * n!, ['你用了 n²。1+2+…+n 是 n×(n+1)/2。', 'You used n². 1+2+…+n is n×(n+1)/2.'], ['首尾配对', 'Pair the ends'], 4),
      M((n! * (n! - 1)) / 2, ['你少加了最后一次（第 n 步要算 n 个）。', 'You dropped the last step, which recomputes n tokens.'], ['加到 n，不是 n−1', 'Up to n, not n−1'], 3),
      M(n!, ['这是有缓存时的次数：每步只算新的那一个。', 'That is with a cache: each step computes only the new token.'], ['没缓存要重算前面', 'No cache recomputes the past'], 1)]),
  gqr: ([h1, h2]) => box('gqr', [`KV 头从 ${f(h1!, 0)} 个改成共用 ${f(h2!, 0)} 个。缓存变成原来的几分之几？（用小数）`, `KV heads go from ${f(h1!, 0)} to ${f(h2!, 0)} shared. The cache becomes what fraction of before? (a decimal)`],
    h2! / h1!, 2, 0.006, [`\`${f(h2!, 0)} ÷ ${f(h1!, 0)}\``, `\`${f(h2!, 0)} ÷ ${f(h1!, 0)}\``],
    [M(h1! - h2!, ['你相减了。缓存和头数成正比，看的是倍数。', 'You subtracted. The cache is proportional to the head count, so look at the ratio.'], ['看倍数', 'Look at the ratio'], 4),
      M(h1! / h2!, ['分子分母反了。变少了，分数应该小于 1。', 'Numerator and denominator are swapped. It got smaller, so the fraction is below 1.'], ['新 ÷ 旧', 'new ÷ old'], 3),
      M(h1! * h2!, ['你乘起来了。', 'You multiplied.'], ['是除法', 'It is a division'], 1)]),
  cosr: ([a, b, c, d]) => {
    const u = [a!, b!], v = [c!, d!], dp = dot(u, v), ans = dp / (norm(u) * norm(v));
    return box('cosr', [`问题向量 [${f(a!)}, ${f(b!)}]，块向量 [${f(c!)}, ${f(d!)}]。余弦相似度 = ？`, `Question [${f(a!)}, ${f(b!)}], chunk [${f(c!)}, ${f(d!)}]. Cosine similarity = ?`],
      ans, 2, 0.006, ['点积 ÷ 两个长度的乘积。', 'Dot product ÷ the product of the lengths.'],
      [M(dp, ['你停在点积。余弦还要除掉两个长度，免得长向量只因“更长”而得分高。', 'You stopped at the dot product. Cosine still divides by both lengths, so a longer vector does not win just by being long.'], ['除掉长度', 'Divide out the lengths'], 4),
        M(b! * d!, ['只乘了第二位。', 'Only the second position.'], ['两位都要', 'Both positions'], 3),
        M(a! + b! + c! + d!, ['你把四个数加起来了。', 'You added all four numbers.'], ['不是相加', 'Not a sum'], 1)]);
  },
  dsim: ([hi, lo]) => box('dsim', [`两块资料的相似度 ${f(hi!)} 和 ${f(lo!)}。高的比低的高出多少？`, `Two chunks score ${f(hi!)} and ${f(lo!)}. How much higher is the winner?`],
    hi! - lo!, 2, 0.006, [`\`${f(hi!)} − ${f(lo!)}\``, `\`${f(hi!)} − ${f(lo!)}\``],
    [M(hi! + lo!, ['你加起来了。要的是差距。', 'You added them. The question wants the gap.'], ['高的减去低的', 'Higher minus lower'], 4),
      M(hi! * lo!, ['你乘起来了。', 'You multiplied.'], ['相减', 'Subtract'], 3),
      M(hi!, ['你只报了较高的那个分数，没和另一个比。', 'You reported only the higher score, with no comparison.'], ['要和另一块比', 'Compare with the other chunk'], 1)]),
  dropk: ([n, k]) => box('dropk', [`检索到 ${f(n!, 0)} 块，只把最像的 ${f(k!, 0)} 块放进提示词。有多少块没放进去？`, `${f(n!, 0)} chunks retrieved; only the top ${f(k!, 0)} go into the prompt. How many are left out?`],
    n! - k!, 0, 0.1, [`\`${f(n!, 0)} − ${f(k!, 0)}\``, `\`${f(n!, 0)} − ${f(k!, 0)}\``],
    [M(n!, ['你全放进去了。太长的提示又贵又吵。', 'You kept all of them. A huge prompt is expensive and noisy.'], ['只留 top-k', 'Keep only top-k'], 1),
      M(k!, ['这是留下的块数。问的是没留下的。', 'That is how many you kept. The question asks how many you left out.'], ['总数 − 留下的', 'total − kept'], 4),
      M(n! + k!, ['你加起来了。', 'You added.'], ['相减', 'Subtract'], 3)]),
  pow: ([p, n]) => box('pow', [`每步成功率 ${f(100 * p!, 0)}%，连续 ${f(n!, 0)} 步都成功的概率 = ？（保留 2 位小数）`, `Each step succeeds ${f(100 * p!, 0)}% of the time. All ${f(n!, 0)} succeed with probability? (2 decimals)`],
    p! ** n!, 2, 0.006, [`\`${f(p!)}^${f(n!, 0)}\``, `\`${f(p!)}^${f(n!, 0)}\``],
    [M(p! * n!, ['你用步数去乘概率了。独立的步要连乘，也就是乘方。', 'You multiplied the probability by the step count. Independent steps multiply, which is a power.'], ['连乘 = 乘方', 'Multiply = a power'], 4),
      M(1 - p!, ['这是一步失败的概率，不是 n 步都成功。', 'That is one step failing, not all n succeeding.'], ['问的是全部成功', 'All of them succeed'], 1),
      M(1 - (1 - p!) * n!, ['你用直线去估了。步数一多，这个估法会变成负数，而概率不会。', 'You used a straight-line estimate. Over many steps it goes negative, and a probability cannot.'], ['要用乘方', 'Use the power'], 3)]),
  mcp: ([m, n]) => box('mcp', [`${f(m!, 0)} 个应用、${f(n!, 0)} 个工具。不用统一协议要接 ${f(m!, 0)}×${f(n!, 0)} 条线；用了只接 ${f(m!, 0)}+${f(n!, 0)} 条。省下多少条？`, `${f(m!, 0)} apps and ${f(n!, 0)} tools. Without a shared protocol that is ${f(m!, 0)}×${f(n!, 0)} wires; with one, ${f(m!, 0)}+${f(n!, 0)}. How many wires are saved?`],
    m! * n! - (m! + n!), 0, 0.1, [`\`${f(m! * n!, 0)} − ${f(m! + n!, 0)}\``, `\`${f(m! * n!, 0)} − ${f(m! + n!, 0)}\``],
    [M(m! * n!, ['这是没统一之前的线，还没减去统一之后的。', 'That is the wire count before sharing. You have not subtracted the shared one.'], ['旧的减去新的', 'old minus new'], 4),
      M(m! + n!, ['这是统一之后还要接的，不是省下的。', 'That is what you still connect after sharing, not what you saved.'], ['省下的 = 旧 − 新', 'saved = old − new'], 3),
      M(m! * n! + m! + n!, ['你把两种接法加起来了。', 'You added the two ways of wiring.'], ['是少接了多少', 'How many fewer'], 1)]),
  freen: ([n, ask]) => box('freen', [`一轮里 ${f(n!, 0)} 次工具调用，其中 ${f(ask!, 0)} 次必须先问人。有几次不用问就能执行？`, `A round has ${f(n!, 0)} tool calls, ${f(ask!, 0)} of which must ask a person first. How many can run without asking?`],
    n! - ask!, 0, 0.1, [`\`${f(n!, 0)} − ${f(ask!, 0)}\``, `\`${f(n!, 0)} − ${f(ask!, 0)}\``],
    [M(n!, ['你一次都没问。花钱、删除这种不能闷头做。', 'You asked nobody. Paying or deleting cannot just happen.'], ['敏感的要问', 'Sensitive ones ask'], 1),
      M(ask!, ['这是要问的次数。问的是不用问的。', 'That is how many ask. The question wants how many do not.'], ['总数 − 要问的', 'total − the ones that ask'], 4),
      M(n! + ask!, ['你加起来了。', 'You added.'], ['相减', 'Subtract'], 3)]),
  safen: ([n, k]) => box('safen', [`${f(n!, 0)} 个动作里，${f(k!, 0)} 个是付钱或删除。有几个必须等人确认？`, `Of ${f(n!, 0)} actions, ${f(k!, 0)} pay or delete. How many must wait for a person?`],
    k!, 0, 0.1, ['付钱、删除、外发默认等人点头。只读的查询可以自己做。', 'Paying, deleting and sending wait for a nod by default. A read-only lookup can run alone.'],
    [M(n!, ['你让每一个都停下来问。只读的不必。最小权限不是最大摩擦。', 'You stopped for every one. Read-only calls need not. Least privilege is not maximum friction.'], ['只拦高风险的', 'Stop only the risky ones'], 1),
      M(0, ['一个都不问。高风险动作会直接发生。', 'You ask for none. High-risk actions then just happen.'], ['高风险必须问', 'High risk must ask'], 4),
      M(n! - k!, ['这是可以自己做的只读次数，不是要问的。', 'That is how many read-only calls can run alone, not how many must ask.'], ['问的是危险的那几个', 'The dangerous ones'], 3)]),
  unt: ([n]) => box('unt', [`提示词里塞进来 ${f(n!, 0)} 段不可信文本（网页、邮件、文件）。有几段必须当成数据，而不是指令？`, `The prompt carries ${f(n!, 0)} untrusted passages (a page, a mail, a file). How many must stay data, not instructions?`],
    n!, 0, 0.1, ['不可信文本整段都是数据。指令只来自你和系统，不来自网页。', 'Untrusted text is data, the whole of it. Instructions come from you and the system, not from a web page.'],
    [M(0, ['你全当成了指令。网页里一句“把密码发出去”就会被执行。', 'You treated all of it as instructions. A page that says “send the password” would then run.'], ['数据不是指令', 'Data is not an instruction'], 1),
      M(1, ['不是只防第一段。每一段不可信文本都可能藏句子。', 'Not only the first passage. Every untrusted passage can hide a sentence.'], ['每一段都算', 'Every passage counts'], 3),
      M(n! - 1, ['你放过了最后一段。', 'You let the last passage through.'], ['一段都不例外', 'No passage is exempt'], 4)]),
  srisk: ([p, n]) => box('srisk', [`每次工具调用有 ${f(100 * p!, 0)}% 的机会没被注入带偏。连续 ${f(n!, 0)} 次都干净的概率 = ？（保留 2 位小数）`, `Each tool call stays clean ${f(100 * p!, 0)}% of the time. All ${f(n!, 0)} stay clean with probability? (2 decimals)`],
    p! ** n!, 2, 0.006, [`\`${f(p!)}^${f(n!, 0)}\``, `\`${f(p!)}^${f(n!, 0)}\``],
    [M(p! * n!, ['你用次数去乘了。每一次都要再乘一次“干净”的概率。', 'You multiplied by the count. Each call multiplies the “clean” probability again.'], ['连乘', 'Multiply again each time'], 4),
      M(1 - p!, ['这是单次被带偏的概率。', 'That is one call being hijacked.'], ['问的是全部干净', 'All of them clean'], 1),
      M(1 - p! ** n!, ['这是“至少有一次被带偏”。题目问的是全部干净。', 'That is “hijacked at least once”. The question asks for all clean.'], ['全部干净 = p^n', 'all clean = p^n'], 3)]),
  vitp: ([img, p]) => box('vitp', [`${f(img!, 0)} × ${f(img!, 0)} 的图，切成 ${f(p!, 0)} × ${f(p!, 0)} 的小块。有多少个视觉词元？`, `A ${f(img!, 0)} × ${f(img!, 0)} image cut into ${f(p!, 0)} × ${f(p!, 0)} patches. How many visual tokens?`],
    (img! / p!) ** 2, 0, 0.1, [`\`(${f(img!, 0)} ÷ ${f(p!, 0)})²\``, `\`(${f(img!, 0)} ÷ ${f(p!, 0)})²\``],
    [M(img! / p!, ['这是一条边上有几块。图是二维的，还要再平方。', 'That is how many along one edge. An image is two-dimensional, so square it.'], ['边长再平方', 'Square the edge count'], 4),
      M((img! / p!) * 2, ['你把两条边加起来了，不是格子数。', 'You added the two edges, which is not the number of cells.'], ['是格子，不是周长', 'Cells, not the perimeter'], 3),
      M(p! * p!, ['你平方了小块的边长，不是一行能排几块。', 'You squared the patch size, not how many patches fit along a side.'], ['先做 图 ÷ 小块', 'image ÷ patch first'], 1)]),
  side: ([img, p]) => box('side', [`同一张 ${f(img!, 0)} 的图，小块边长 ${f(p!, 0)}。一条边上有几块？`, `Same image of side ${f(img!, 0)}, patch side ${f(p!, 0)}. How many patches along one edge?`],
    img! / p!, 0, 0.1, [`\`${f(img!, 0)} ÷ ${f(p!, 0)}\``, `\`${f(img!, 0)} ÷ ${f(p!, 0)}\``],
    [M((img! / p!) ** 2, ['这是整张图的块数。题目只问一条边。', 'That is the whole image. The question asks for one edge.'], ['一条边先别平方', 'One edge, don’t square yet'], 3),
      M(img! * p!, ['你乘起来了。一条边是除法：图的边 ÷ 小块的边。', 'You multiplied. One edge is a division: image side ÷ patch side.'], ['是除法', 'It is a division'], 4),
      M(p!, ['你报了小块的边长，不是能排几块。', 'You reported the patch size, not how many fit.'], ['图 ÷ 小块', 'image ÷ patch'], 1)]),
  nse: ([pred, truth]) => {
    const e = pred! - truth!;
    return box('nse', [`扩散模型预测的噪声是 ${f(pred!)}，真正加进去的是 ${f(truth!)}。这一项的平方误差 = ？`, `The diffusion model predicts noise ${f(pred!)}; the noise that was added is ${f(truth!)}. This squared error = ?`],
      e * e, 2, 0.006, [`\`(${f(pred!)} − ${f(truth!)})²\``, `\`${f(pred!)} − ${f(truth!)})²\``],
      [M(Math.abs(e), ['你取了绝对值。扩散的损失是平方，大错罚得更狠。', 'You took the absolute value. The diffusion loss squares, so a big miss costs more.'], ['要平方', 'Square it'], 4),
        M(e, ['差本身可能是负的，损失不能是负的。先平方。', 'The raw gap can be negative, and a loss cannot. Square it.'], ['平方后才是损失', 'The loss is the square'], 1),
        M(pred! * truth!, ['你乘起来了。要的是差的平方。', 'You multiplied. The loss wants the squared gap.'], ['差，再平方', 'Gap, then square'], 3)]);
  },
  vote: (xs) => {
    const a = maj(xs);
    const counts = new Map<number, number>();
    for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
    const times = counts.get(a)!;
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    return box('vote', [`同一道题采样 5 次得到 [${xs.map((x) => f(x, 0)).join(', ')}]。多数投票的答案 = ？`, `Five samples of one problem give [${xs.map((x) => f(x, 0)).join(', ')}]. Majority vote answers?`],
      a, 0, 0.1, [`${f(a, 0)} 出现 ${f(times, 0)} 次，比其他都多`, `${f(a, 0)} appears ${f(times, 0)} times, more than the others`],
      [M(Math.max(...xs), ['你取了最大的数。投票看出现次数，不看数值大小。', 'You took the largest number. A vote counts how often, not how big.'], ['看出现次数', 'Count how often'], 1),
        M(Math.min(...xs), ['你取了最小的。', 'You took the smallest.'], ['不是比大小', 'Not a contest of size'], 3),
        M(mean, ['你取了平均。这些是离散的答案，平均可能根本没人说过。', 'You averaged. These are discrete answers; the average may be something nobody said.'], ['取出现最多的那个', 'Take the one said most'], 4),
        M(times, ['这是它出现了几次，不是它的值。', 'That is how many times it appeared, not its value.'], ['答案是那个数', 'The answer is the number'], 2)]);
  },
  winx: ([a, b]) => box('winx', [`窗口从 ${f(a!, 0)}K 扩到 ${f(b!, 0)}K。长度变成几倍？`, `The window grows from ${f(a!, 0)}K to ${f(b!, 0)}K. How many times longer?`],
    b! / a!, 0, 0.1, [`\`${f(b!, 0)} ÷ ${f(a!, 0)}\``, `\`${f(b!, 0)} ÷ ${f(a!, 0)}\``],
    [M(b! - a!, ['你相减了。问的是倍数。', 'You subtracted. The question asks for how many times.'], ['新 ÷ 旧', 'new ÷ old'], 4),
      M(a! * b!, ['你乘起来了。', 'You multiplied.'], ['是除法', 'It is a division'], 3),
      M(a!, ['你报了原来的长度。', 'You reported the old length.'], ['和旧的比', 'Compare with the old one'], 1)]),
  mid: ([n, a, b]) => box('mid', [`一篇 ${f(n!, 0)} 的材料，模型通常只用得好开头 ${f(a!, 0)} 和结尾 ${f(b!, 0)}。中间有多少用得弱？`, `A text of length ${f(n!, 0)}. The model usually uses the first ${f(a!, 0)} and the last ${f(b!, 0)} well. How much of the middle is weakly used?`],
    n! - a! - b!, 0, 0.1, [`\`${f(n!, 0)} − ${f(a!, 0)} − ${f(b!, 0)}\``, `\`${f(n!, 0)} − ${f(a!, 0)} − ${f(b!, 0)}\``],
    [M(a! + b!, ['这是用得好的两头。问的是中间那一段。', 'That is the two ends, which are used well. The question asks for the middle.'], ['总长减去两头', 'Length minus both ends'], 4),
      M(n!, ['你当成整篇都用得弱。两头通常是用得到的。', 'You treated the whole text as weak. The ends are usually used.'], ['两头要留下', 'Keep the ends'], 1),
      M(a!, ['你只报了开头。', 'You reported only the start.'], ['开头、结尾都要减', 'Subtract both ends'], 3)]),
  loopn: ([p, n]) => box('loopn', [`改代码的循环有 ${f(n!, 0)} 步（检索、改、跑测试……），每步成功率 ${f(100 * p!, 0)}%。全部走通的概率 = ？（保留 2 位小数）`, `A fix loop of ${f(n!, 0)} steps (retrieve, edit, run tests…), each succeeding ${f(100 * p!, 0)}% of the time. All of them succeed with probability? (2 decimals)`],
    p! ** n!, 2, 0.006, [`\`${f(p!)}^${f(n!, 0)}\``, `\`${f(p!)}^${f(n!, 0)}\``],
    [M(p! * n!, ['你用步数去乘了。每一步都要再乘一次成功率。', 'You multiplied by the step count. Each step multiplies the success rate again.'], ['连乘', 'Multiply each step'], 4),
      M(p!, ['这是一步的成功率，不是整段循环。', 'That is one step, not the whole loop.'], ['整段都要成功', 'The whole loop'], 1),
      M(1 - (1 - p!) * n!, ['直线估出来的。步数一多它会小于 0，概率不会。', 'A straight-line estimate. Over many steps it goes below 0, and a probability cannot.'], ['用乘方', 'Use the power'], 3)]),
  dropa: ([n, k]) => box('dropa', [`研究助手检索到 ${f(n!, 0)} 段，只把最相关的 ${f(k!, 0)} 段写进回答的上下文。丢掉多少段？`, `A research assistant retrieves ${f(n!, 0)} passages and keeps the ${f(k!, 0)} most relevant in the context. How many are dropped?`],
    n! - k!, 0, 0.1, [`\`${f(n!, 0)} − ${f(k!, 0)}\``, `\`${f(n!, 0)} − ${f(k!, 0)}\``],
    [M(n!, ['全塞进上下文，又贵又容易把不相关的写进去。', 'Stuffing all of them into the context is expensive, and the irrelevant ones leak into the answer.'], ['只留最相关的', 'Keep only the most relevant'], 1),
      M(k!, ['这是留下的。问的是丢掉的。', 'That is how many you kept. The question asks how many you dropped.'], ['检索到的 − 留下的', 'retrieved − kept'], 4),
      M(n! * k!, ['你乘起来了。', 'You multiplied.'], ['相减', 'Subtract'], 3)]),
  vita: ([img, p]) => box('vita', [`屏幕截图 ${f(img!, 0)} × ${f(img!, 0)}，切成 ${f(p!, 0)} × ${f(p!, 0)}。有多少个视觉词元送进模型？`, `A screenshot ${f(img!, 0)} × ${f(img!, 0)}, cut into ${f(p!, 0)} × ${f(p!, 0)}. How many visual tokens go into the model?`],
    (img! / p!) ** 2, 0, 0.1, [`\`(${f(img!, 0)} ÷ ${f(p!, 0)})²\``, `\`(${f(img!, 0)} ÷ ${f(p!, 0)})²\``],
    [M(img! / p!, ['这是一条边。截图是一张二维的图。', 'That is one edge. A screenshot is a two-dimensional image.'], ['再平方', 'Then square'], 4),
      M(img! / p! * 2, ['两条边相加不是块数。', 'Adding the two edges is not the cell count.'], ['是格子数', 'The number of cells'], 3),
      M(p!, ['你报了小块边长。', 'You reported the patch size.'], ['图 ÷ 小块，再平方', 'image ÷ patch, then square'], 1)]),
  upd: ([w, g, e]) => box('upd', [`w = ${f(w!)}，梯度 ${f(g!)}，学习率 ${f(e!)}。更新后 w = ？`, `w = ${f(w!)}, gradient ${f(g!)}, learning rate ${f(e!)}. w after the update = ?`],
    w! - e! * g!, 2, 0.006, [`\`${f(w!)} − ${f(e!)} × ${f(g!)}\``, `\`${f(w!)} − ${f(e!)} × ${f(g!)}\``],
    [M(w! + e! * g!, ['你往坡的方向走了。更新是减去学习率乘梯度。', 'You stepped with the slope. The update subtracts learning-rate times gradient.'], ['减去，不是加上', 'Subtract, don’t add'], 1),
      M(w! - g!, ['学习率没乘。步子被你走成了整段坡度。', 'The learning rate never multiplied. You stepped the whole gradient.'], ['步子 = η × 梯度', 'step = η × gradient'], 4),
      M(w! - e!, ['梯度没乘。你只减了学习率。', 'The gradient never multiplied. You only subtracted the learning rate.'], ['乘的是梯度', 'Multiply by the gradient'], 3)]),
  ceu: ([p]) => box('ceu', [`${f(1 / p!, 0)} 个候选一视同仁，正确答案的概率是 ${f(p!)}。交叉熵 \`−ln ${f(p!)}\` = ？（保留 2 位小数）`, `${f(1 / p!, 0)} candidates, all equal, so the right one has probability ${f(p!)}. Cross-entropy \`−ln ${f(p!)}\` = ? (2 decimals)`],
    -ln(p!), 2, 0.006, [`\`−ln ${f(p!)}\``, `\`−ln ${f(p!)}\``],
    [M(ln(p!), ['少了负号。p < 1 时 ln p 是负的，罚分要翻成正的。', 'The minus is missing. For p < 1, ln p is negative; the penalty flips it positive.'], ['罚分 = −ln p', 'penalty = −ln p'], 4),
      M(-Math.log10(p!), ['你用了以 10 为底的对数。这里是自然对数 ln。', 'You used log base 10. This is the natural log, ln.'], ['ln 是自然对数', 'ln is the natural log'], 3),
      M(1 - p!, ['罚分不是 1 − p。p 越接近 0，罚分要冲向无穷大。', 'The penalty is not 1 − p. As p nears 0 it has to shoot up.'], ['越错越陡', 'Steeper the more wrong'], 1)]),
  pplR: ([k]) => box('pplR', [`完全不会时，模型在 ${f(k!, 0)} 个候选里均匀猜。困惑度 = ？`, `Knowing nothing, the model guesses uniformly among ${f(k!, 0)} candidates. Perplexity = ?`],
    k!, 0, 0.05, [`均匀时 L = ln ${f(k!, 0)}，\`e^L = ${f(k!, 0)}\``, `Uniformly, L = ln ${f(k!, 0)}, \`e^L = ${f(k!, 0)}\``],
    [M(ln(k!), ['这是损失，不是困惑度。', 'That is the loss, not the perplexity.'], ['困惑度 = e^L', 'perplexity = e^L'], 4),
      M(1 / k!, ['这是每个候选的概率，不是困惑度。', 'That is each candidate’s probability, not the perplexity.'], ['犹豫的个数', 'How many it is torn between'], 1),
      M(k! - 1, ['你减了 1。均匀猜 k 个，困惑度就是 k。', 'You subtracted 1. Uniform over k means perplexity k.'], ['就是 k', 'It is k'], 3)]),
  moe: ([n, k]) => box('moe', [`${f(n!, 0)} 个专家，每次只用 ${f(k!, 0)} 个。参加计算的占百分之几？`, `${f(n!, 0)} experts, and only ${f(k!, 0)} run. What percent joins the computation?`],
    (100 * k!) / n!, 0, 0.6, [`\`${f(k!, 0)} ÷ ${f(n!, 0)}\``, `\`${f(k!, 0)} ÷ ${f(n!, 0)}\``],
    [M(k!, ['这是选中的个数，不是百分比。', 'That is how many were picked, not the percent.'], ['个数和百分比', 'A count and a percent'], 1),
      M(n! - k!, ['这是没被选中的个数。', 'That is how many were not picked.'], ['睡着的那些', 'The ones asleep'], 3),
      M((100 * n!) / k!, ['分子分母反了。', 'Numerator and denominator are swapped.'], ['选中 ÷ 总数', 'picked ÷ total'], 4)]),
  dist: ([t, s]) => box('dist', [`老师 ${f(t!, 0)}，学生 ${f(s!, 0)}。学生是老师的百分之几？`, `Teacher ${f(t!, 0)}, student ${f(s!, 0)}. What percent of the teacher is the student?`],
    (100 * s!) / t!, 0, 0.6, [`\`${f(s!, 0)} ÷ ${f(t!, 0)}\``, `\`${f(s!, 0)} ÷ ${f(t!, 0)}\``],
    [M(t! - s!, ['这是两者的差，不是学生占老师的比例。', 'That is the gap, not the student’s share of the teacher.'], ['差和比例', 'A gap and a share'], 1),
      M(t!, ['这是老师自己的大小。', 'That is the teacher’s own size.'], ['学生更小', 'The student is smaller'], 3),
      M(s! / t!, ['差了 100 倍：问的是百分比。', 'Short by 100: the question asks for a percent.'], ['百分比', 'Percent'], 4)]),
  syn: ([h, m]) => box('syn', [`人写 ${f(h!, 0)} 道，模型写 ${f(m!, 0)} 道。模型写的占百分之几？`, `${f(h!, 0)} written by people, ${f(m!, 0)} by a model. What percent did the model write?`],
    (100 * m!) / (h! + m!), 0, 0.6, [`\`${f(m!, 0)} ÷ (${f(h!, 0)} + ${f(m!, 0)})\``, `\`${f(m!, 0)} ÷ (${f(h!, 0)} + ${f(m!, 0)})\``],
    [M((100 * m!) / h!, ['分母只用了人写的题。两种要加在一起。', 'The denominator used only the human questions. Add both kinds.'], ['分母是全部', 'The denominator is the whole'], 4),
      M(h!, ['这是人写的道数。', 'That is how many people wrote.'], ['问的是模型写的那一份', 'The question asks for the model’s share'], 1),
      M(100, ['100% 表示全部都是模型写的。这里还有人写的。', '100% would mean the model wrote all of them. People wrote some too.'], ['不是全部', 'Not the whole'], 3)]),
};

/** self-checks that entry 0 of a new pool reproduces */
export const BASE2: Partial<Record<VarK, string>> = {
  wlin: 's0a', blin: 's0b', psum: 'sp1', mean3: 'm11a', xoh: 's3a', xoy: 's3b', chn: 's4a', bp2: 's4b', bp1: 's4c',
  epoch: 's5a', mom3: 's5b', dotw: 's6a', dot3: 's6b', smw: 's7a', hd: 's8d', pmill: 's8b', ntok: 's9c', ppl: 's9a',
  pplE: 'se1', tmp: 's12c', sig: 's10a', sige: 's10b', loraN: 's11a', qgb: 's11b', kvb: 's12a', tri: 's12b',
  cosr: 's13a', pow: 's14a', vitp: 's15a', vote: 's15c', upd: 'k14a', ceu: 's16b',
};
