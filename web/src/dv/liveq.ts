/* The check after a demo. The question, the right option and each wrong line use the
   numbers on screen right now (slider, angle, count, or the life/diagram side). */
import { attW, D_ATT, D_DK, D_SM, fmt, gdKind, softmax } from '../vf/calc';
import { CAP } from './morph';

type T = readonly [string, string];
export interface LiveQ {
  q: T;
  o: readonly [T, T, T];
  a: number;
  why: readonly [T, T, T];
  sig: string;
}
export interface DemoSnap {
  eta: number; n: number; T: number; dk: number; pred: number; ang: number;
  layer: number; rank: number; len: number; hit: number;
}

const num = (v: number, d = 0) => {
  const s = Math.abs(v).toFixed(d).replace(/\.?0+$/, '');
  return (v < 0 ? '−' : '') + (s || '0');
};
const pair = (s: string): T => [s, s];

/** one wrong tap records only that choice; the right tap opens every line */
export function takePick(a: number, wrongs: readonly number[], solved: boolean, i: number): { wrongs: number[]; solved: boolean } {
  if (solved || wrongs.includes(i) || i < 0 || i > 2) return { wrongs: [...wrongs], solved };
  if (i === a) return { wrongs: [...wrongs], solved: true };
  return { wrongs: [...wrongs, i], solved: false };
}
/** which explanations are on screen: only the misses so far, or every line once it is right */
export const shownWhys = (n: number, wrongs: readonly number[], solved: boolean) => (solved ? [...Array(n).keys()] : [...wrongs]);

function place(correct: T, alts: readonly T[], salt: number): { o: [T, T, T]; a: number } {
  const pool: T[] = [correct];
  for (const w of alts) {
    if (pool.some((p) => p[0] === w[0])) continue;
    pool.push(w);
    if (pool.length === 3) break;
  }
  let k = 2;
  while (pool.length < 3) { pool.push([`${correct[0]} + ${k}`, `${correct[1]} + ${k}`]); k += 1; }
  const a = ((salt % 3) + 3) % 3;
  const rest = pool.slice(1);
  const o: T[] = [];
  let r = 0;
  for (let i = 0; i < 3; i++) o.push(i === a ? pool[0]! : rest[r++]!);
  return { o: [o[0]!, o[1]!, o[2]!], a };
}

function pack(q: T, correct: T, okWhy: T, alts: readonly { t: T; why: T }[], salt: number, sig: string): LiveQ {
  const { o, a } = place(correct, alts.map((x) => x.t), salt);
  const why = o.map((opt, i) => (i === a ? okWhy : alts.find((x) => x.t[0] === opt[0])?.why ?? okWhy)) as [T, T, T];
  return { q, o, a, why, sig };
}

const KINDS = ['slow', 'ok', 'osc', 'stuck', 'div'] as const;
const KIND: Record<(typeof KINDS)[number], T> = {
  slow: ['步子太小：走得很慢', 'Too small: very slow'],
  ok: ['平稳靠近 w = 2', 'Glides in to w = 2'],
  osc: ['来回跳，但在收敛', 'Zig-zags, but converges'],
  stuck: ['在两点之间原地来回', 'Bounces between two points forever'],
  div: ['越跳越远：发散', 'Runs away: diverges'],
};

function fromDemo(k: string, s: DemoSnap): LiveQ | null {
  if (k === 'gd') {
    const eta = s.eta, n = Math.round(s.n), kind = gdKind(eta), f = num(1 - 2 * eta, 2);
    const alts = KINDS.filter((id) => id !== kind).map((id) => ({
      t: KIND[id],
      why: [`「${KIND[id][0]}」是另一种步子。η = ${fmt(eta, 2)} 时每步乘 ${f}。`, `“${KIND[id][1]}” is a different step. At η = ${fmt(eta, 2)} each step multiplies by ${f}.`] as T,
    }));
    return pack(
      [`学习率 η = ${fmt(eta, 2)}，走 ${n} 步。画面上是哪一种？`, `Rate η = ${fmt(eta, 2)}, ${n} steps. Which line is on screen?`],
      KIND[kind],
      [`η = ${fmt(eta, 2)}，每步乘 (1 − 2η) = ${f}，所以是这一种。`, `η = ${fmt(eta, 2)}, each step multiplies by (1 − 2η) = ${f}, so this is the one.`],
      alts, Math.round(eta * 100), `gd:${fmt(eta, 2)}:${kind}`,
    );
  }
  if (k === 'mse') {
    const pred = s.pred, gap = pred - 5, pen = gap * gap, show = num(pen, 2);
    const alts = [num(Math.abs(gap), 2), num(gap, 2), num(pred, 1), num(pen + 1, 2)].filter((x) => x !== show).map((x) => ({
      t: pair(x),
      why: [`${x} 不是 (预测 − 5)²。预测现在是 ${num(pred, 1)}，真实值是 5。`, `${x} is not (prediction − 5)². The prediction is ${num(pred, 1)} and the true value is 5.`] as T,
    }));
    return pack(
      [`预测值拖到 ${num(pred, 1)}，真实值是 5。(预测 − 5)² = ？`, `Prediction dragged to ${num(pred, 1)}, true value 5. (prediction − 5)² = ?`],
      pair(show),
      [`差是 ${num(gap, 1)}，平方后是 ${show}。画面上的罚分就是它。`, `The gap is ${num(gap, 1)}; squared it is ${show}. That is the penalty on screen.`],
      alts, Math.round(pred * 2), `mse:${num(pred, 1)}:${show}`,
    );
  }
  if (k === 'xor') {
    const ang = Math.round(s.ang);
    const correct: T = [`${ang}° 这条直线切不开`, `At ${ang}° the line still cannot separate them`];
    return pack(
      [`直线角度 ${ang}°。四个角切得开吗？`, `The line is at ${ang}°. Can it separate the four corners?`],
      correct,
      [`${ang}° 也是一条直线。两个颜色在四个角上，总会切错一个。`, `${ang}° is still one straight line. Two colours on four corners, so one corner is always on the wrong side.`],
      [
        { t: [`${ang}° 刚好能切开`, `At ${ang}° it separates them`], why: [`把 ${ang}° 当成能切开了。四个角两种颜色，一条直线切不开。`, `That treats ${ang}° as a clean cut. Two colours on four corners: one line cannot separate them.`] },
        { t: ['只有 45° 才切得开', 'Only 45° can separate them'], why: [`换角度不会变成分得开。你现在是 ${ang}°，一样切不开。`, `Another angle does not start separating them. You are at ${ang}°, and it still fails.`] },
      ],
      ang, `xor:${ang}`,
    );
  }
  if (k === 'bp') {
    const layer = Math.max(0, Math.min(3, Math.round(s.layer))), g = 8 / 2 ** layer, show = num(g, 2);
    const alts = [0, 1, 2, 3].filter((i) => i !== layer).map((i) => num(8 / 2 ** i, 2)).filter((x) => x !== show).map((x) => ({
      t: pair(x),
      why: [`${x} 是别的层。高亮在第 ${layer} 层，坡度是 ${show}。`, `${x} is another layer. The highlight is on layer ${layer}, and the slope is ${show}.`] as T,
    }));
    return pack(
      [`高亮在第 ${layer} 层。这一层的坡度是多少？`, `The highlight is on layer ${layer}. What is the slope there?`],
      pair(show),
      [`第 ${layer} 层大约是 8 ÷ 2^${layer} = ${show}。`, `Layer ${layer} is about 8 ÷ 2^${layer} = ${show}.`],
      alts, layer + 1, `bp:${layer}:${show}`,
    );
  }
  if (k === 'emb') {
    const ang = Math.round(s.ang), dot = Math.cos((ang * Math.PI) / 180), show = num(dot, 2);
    const alts = ['1', '0', num(-dot, 2), num(dot + 0.5, 2)].filter((x) => x !== show).map((x) => ({
      t: pair(x),
      why: [`${x} 不是 ${ang}° 的余弦。画面上的点积是 ${show}。`, `${x} is not the cosine of ${ang}°. The dot product on screen is ${show}.`] as T,
    }));
    return pack(
      [`夹角拖到 ${ang}°。点积是多少？`, `The angle is dragged to ${ang}°. What is the dot product?`],
      pair(show),
      [`${ang}° 的余弦是 ${show}。方向越齐，这个数越接近 1。`, `The cosine of ${ang}° is ${show}. The more the directions agree, the nearer this is to 1.`],
      alts, ang, `emb:${ang}:${show}`,
    );
  }
  if (k === 'att') {
    const idx = Math.max(0, Math.min(D_DK.length - 1, Math.round(s.dk)));
    const dk = D_DK[idx] ?? 64, p = attW(D_ATT, dk), shown = p.map((v) => fmt(100 * v, 1) + '%');
    const words: T[] = [['词 1', 'word 1'], ['词 2', 'word 2'], ['词 3', 'word 3']];
    const alts = [1, 2].map((i) => ({
      t: [`${words[i]![0]} ${shown[i]}`, `${words[i]![1]} ${shown[i]}`] as T,
      why: [`那是${words[i]![0]}。d_k = ${dk} 时，词 1 是 ${shown[0]}。`, `That is ${words[i]![1]}. At d_k = ${dk}, word 1 is ${shown[0]}.`] as T,
    }));
    return pack(
      [`d_k = ${dk}。词 1 的注意力是多少？`, `d_k = ${dk}. What is word 1’s attention?`],
      [`词 1 ${shown[0]}`, `word 1 ${shown[0]}`],
      [`d_k = ${dk}，分数 [${D_ATT.join(', ')}] ÷ √${dk} 之后，词 1 是 ${shown[0]}。`, `At d_k = ${dk}, scores [${D_ATT.join(', ')}] ÷ √${dk}, word 1 is ${shown[0]}.`],
      alts, dk, `att:${dk}:${shown[0]}`,
    );
  }
  if (k === 'sm') {
    const Tm = s.T, p = softmax(D_SM, Tm), shown = p.map((v) => fmt(100 * v, 1) + '%');
    const lab: T[] = [['蓝', 'blue'], ['绿', 'green'], ['红', 'red']];
    const alts = [1, 2].map((i) => ({
      t: [`${lab[i]![0]} ${shown[i]}`, `${lab[i]![1]} ${shown[i]}`] as T,
      why: [`那是${lab[i]![0]}的份额。T = ${fmt(Tm, 1)} 时蓝是 ${shown[0]}。`, `That is ${lab[i]![1]}’s share. At T = ${fmt(Tm, 1)} blue is ${shown[0]}.`] as T,
    }));
    return pack(
      [`温度 T = ${fmt(Tm, 1)}。蓝的概率是多少？`, `Temperature T = ${fmt(Tm, 1)}. What is blue’s probability?`],
      [`蓝 ${shown[0]}`, `blue ${shown[0]}`],
      [`T = ${fmt(Tm, 1)} 时蓝是 ${shown[0]}。温度只改尖平，不改谁最高。`, `At T = ${fmt(Tm, 1)} blue is ${shown[0]}. Temperature only sharpens or flattens; it does not change who leads.`],
      alts, Math.round(Tm * 10), `sm:${fmt(Tm, 1)}:${shown[0]}`,
    );
  }
  if (k === 'lora') {
    const r = Math.max(1, Math.round(s.rank)), side = 2 * 4096 * r, full = 4096 * 4096, half = 4096 * r;
    const comma = (n: number) => n.toLocaleString('en-US');
    return pack(
      [`秩 r = ${r}。支路要训练的个数 2 × 4096 × r = ？`, `Rank r = ${r}. How many numbers train on the side path, 2 × 4096 × r?`],
      pair(comma(side)),
      [`r = ${r}，2 × 4096 × ${r} = ${comma(side)}。黄条是这条支路。`, `r = ${r}, so 2 × 4096 × ${r} = ${comma(side)}. The yellow bar is that side path.`],
      [
        { t: pair(comma(full)), why: [`${comma(full)} 是整块矩阵 4096 × 4096。r = ${r} 时要训练的是黄条 ${comma(side)}。`, `${comma(full)} is the whole matrix, 4096 × 4096. At r = ${r} the part that trains is the yellow bar, ${comma(side)}.`] },
        { t: pair(comma(half)), why: [`少了一个 2。r = ${r} 时是 2 × 4096 × r = ${comma(side)}，不是 ${comma(half)}。`, `The 2 is missing. At r = ${r} it is 2 × 4096 × r = ${comma(side)}, not ${comma(half)}.`] },
      ],
      r, `lora:${r}:${side}`,
    );
  }
  if (k === 'kv') {
    const len = Math.max(1, Math.round(s.len)), tri = (len * (len + 1)) / 2, extra = len * len + 3;
    return pack(
      [`已经生成 ${len} 个词。有缓存，要新算几次？`, `${len} tokens so far. With a cache, how many new computations?`],
      pair(String(len)),
      [`有缓存只算新词，一共 ${len} 次。`, `With a cache you compute only the new tokens: ${len} in all.`],
      [
        { t: pair(String(tri === len ? tri + 5 : tri)), why: [`那是没有缓存、从 1 加到 ${len} 的次数。有缓存是 ${len}。`, `That is the no-cache sum from 1 to ${len}. With a cache it is ${len}.`] },
        { t: pair(String(extra)), why: [`${extra} 把每个词又乘了一遍。有缓存、已经生成 ${len} 个时，新算的是 ${len} 次。`, `${extra} multiplies every token again. With a cache and ${len} tokens so far, the new work is ${len}.`] },
      ],
      len, `kv:${len}`,
    );
  }
  if (k === 'rag') {
    const hit = Math.max(0, Math.min(3, Math.round(s.hit)));
    const scores = [0.2, 0.85, 0.4, 0.55].map((v, i) => (i === hit ? Math.min(0.95, v + 0.1) : v));
    const win = scores.indexOf(Math.max(...scores));
    const block = (i: number): T => [`第 ${i + 1} 块`, `chunk ${i + 1}`];
    const others = [0, 1, 2, 3].filter((i) => i !== win);
    return pack(
      [`问题偏向第 ${hit + 1} 块。哪一块进提示词？`, `The query leans toward chunk ${hit + 1}. Which chunk goes into the prompt?`],
      block(win),
      [`偏向第 ${hit + 1} 块。最高的是第 ${win + 1} 块，进提示词的是它。`, `The lean is chunk ${hit + 1}. The highest is chunk ${win + 1}, and that one goes into the prompt.`],
      [
        { t: block(others[0]!), why: [`第 ${others[0]! + 1} 块不是最高。偏向第 ${hit + 1} 块时，最高的是第 ${win + 1} 块。`, `Chunk ${others[0]! + 1} is not the highest. Leaning toward chunk ${hit + 1}, the highest is chunk ${win + 1}.`] },
        { t: ['四块一样高', 'All four tie'], why: [`四块不一样高。偏向第 ${hit + 1} 块时，第 ${win + 1} 块仍然最高。`, `The four are not tied. Leaning toward chunk ${hit + 1}, chunk ${win + 1} is still the highest.`] },
      ],
      hit + 1, `rag:${hit}:${win}`,
    );
  }
  return null;
}

function fromMorph(key: string, m: number): LiveQ | null {
  const cap = CAP[key]; if (!cap) return null;
  const x = Math.max(0, Math.min(1, m)), pct = Math.round(x * 100), atMath = x >= 0.5;
  const life: T = [cap[0], cap[1]], math: T = [cap[2], cap[3]];
  const neither: T = ['两边说的是同一句', 'Both sides say the same line'];
  const o: [T, T, T] = [life, math, neither];
  const a = atMath ? 1 : 0;
  const why: [T, T, T] = [
    atMath
      ? [`「${life[0]}」是生活画面那一头。滑块在 ${pct}%，已经过半。`, `“${life[1]}” is the life picture. The slider is at ${pct}%, past halfway.`]
      : [`滑块在 ${pct}%，还停在生活画面。画上就是这句。`, `The slider is at ${pct}%, still on the life picture. That line is what it shows.`],
    atMath
      ? [`滑块在 ${pct}%，看的是式子。图上就是这句。`, `The slider is at ${pct}%, on the diagram. That line is what it shows.`]
      : [`「${math[0]}」要等滑块过一半才出现。你现在在 ${pct}%。`, `“${math[1]}” shows up past halfway. You are at ${pct}%.`],
    [`生活画面和式子不是同一句。滑块在 ${pct}%。`, `The life picture and the diagram do not say the same line. The slider is at ${pct}%.`],
  ];
  return {
    q: [`滑块在 ${pct}%。现在这幅画在说哪句？`, `The slider is at ${pct}%. Which line is this picture saying?`],
    o, a, why, sig: `morph:${key}:${atMath ? 'math' : 'life'}:${pct}`,
  };
}

/** numeric demo wins when this station has one; otherwise the life/diagram slider */
export function liveQ(key: string, morph: number | null, demo: { k: string; s: DemoSnap } | null): LiveQ | null {
  if (demo) {
    const q = fromDemo(demo.k, demo.s);
    if (q) return q;
  }
  if (morph != null) return fromMorph(key, morph);
  return null;
}
