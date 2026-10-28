/* R38: every L4 screen — states, info card, panel — built from the real model's numbers (nothing hard-coded). */
import type { Demo, Prog } from './tf/core';
import type { Trace } from './tf/model';
import { all, litUpto, type Mode, type St } from './layout';
import { FRAME2, LAB, NODE_INFO, NODE_K, STEPN, UI, isNd, tx, type Info, type L, type Nd, type Tx } from './txt';

export type Ans = { chars: string[]; q: string; out: string; steps: { top: [number, number][] }[]; unknown: string[] };
export interface My { lines: string[]; prog: Prog | null; running: boolean; paused: boolean; ans: Ans | null; q: string; err: string; ready: boolean }
export interface Ctx { l: L; d: Demo | null; u: { chars: string[]; tr: Trace } | null; a: Ans | null; my: My }
export interface Page {
  id: string; kind: 'l4' | 'tr' | 'us' | 'my' | 'x'; crumb: [string, string | null][]; top: string; mode: Mode; st: Record<Nd, St>;
  back: boolean; resOn: boolean; frameLit: boolean; frameTag: string | null; sel: Nd | null; flow: { a: Nd; b: Nd; back?: boolean } | null;
  info: [string, string, string, string]; k: string; math: string | null; hint: string; dots: [number, number] | null; panel: string | null;
  tags: { nd: Nd; h: string }[]; notes: [string, string] | null; ent: boolean; next: string; up: string | null;
}
export const Q = '天空是什么颜色？';
export const X_ORDER = ['att', 'att.dot', 'att.dot.one', 'att.heads', 'att.mask', 'ffn', 'an1'];
const XN: Record<string, Tx> = { att: LAB.att, 'att.dot': ['Q·K 打分', 'Q·K scores'], 'att.dot.one': ['一个数', 'One number'], 'att.heads': ['多头', 'Heads'], 'att.mask': ['遮罩', 'Mask'] };
const XI: Record<string, Info> = {
  att: NODE_INFO.att,
  'att.dot': [['每两个字之间打个分', 'Scores every pair of chars'], ['每个头一张 8 × 8 分数表', 'An 8 × 8 table per head'], ['每格 = Q · K ÷ √8', 'Each cell = Q · K ÷ √8'], ['分数越高，越该关注', 'Higher score, more attention']],
  'att.dot.one': [['一个分数是怎么算出来的', 'How one score is made'], ['Q 的 8 个数、K 的 8 个数', '8 numbers of Q, 8 of K'], ['对应相乘、相加，再 ÷ √8', 'Multiply pairs, add, ÷ √8'], ['÷ √8 防止分数太大', '÷ √8 keeps scores from blowing up']],
  'att.heads': [['同时从几个角度去看', 'Looks from several angles at once'], ['2 个头，每头 8 维', '2 heads, 8 numbers each'], ['各算各的，再拼成 16 个数', 'Each works alone, then they join'], ['不同的头抓不同的关系', 'Heads catch different relations']],
  'att.mask': [['不许偷看后面的字', 'No peeking at later chars'], ['一张遮罩表', 'A mask table'], ['后面的格子分数设为 −∞', 'Later cells get −∞'], ['训练和使用时条件一致', 'Training matches real use']],
};
const XK: Record<string, string> = { att: 'K06', 'att.dot': 'K07', 'att.dot.one': 'K07', 'att.heads': 'K06', 'att.mask': 'K08' };
const XM: Record<string, string> = { 'att.dot.one': 'KM02' };
const PI: Record<string, Info> = {
  L4: [['读一段字，猜下一个字', 'Reads text, guesses the next char'], ['分词、词向量、2 个解码块、输出层', 'Tokenize, embed, 2 decoder blocks, output'], ['从下往上一层层加工', 'Processed layer by layer, bottom up'], ['一次一个字，循环写成整段', 'One char at a time, looped into text']],
  TR1: [['准备「问题 → 答案」例题', 'Prepare question → answer examples'], ['3 道颜色题', '3 colour questions'], ['每题拆成「看前面 → 猜下一个」', 'Each becomes “see before → guess next”'], ['模型只能从例子里学', 'It can only learn from examples']],
  TR2: [['把字换成编号', 'Turns chars into numbers'], ['字典：{V} 个字（含结束符）', 'Dictionary: {V} chars (with END)'], ['每个字查字典得编号', 'Each char looks up its number'], ['计算机只会算数字', 'Computers only do numbers']],
  TR3: [['看模型一开始猜成什么样', 'See the first, random guess'], ['随机的初始参数', 'Random starting parameters'], ['输入一路往上算到概率', 'Input goes up to the odds'], ['先有猜测，才能谈改进', 'A guess first, then improve it']],
  TR4: [['量出猜得有多错', 'Measures how wrong it is'], ['误差 = −ln(正确字的概率)', 'Error = −ln(odds of the right char)'], ['概率越小，误差越大', 'Lower odds, bigger error'], ['一个数就能指明改进方向', 'One number points the way']],
  TR5: [['算出每个参数该改多少', 'Works out each parameter’s change'], ['反向传播（链式法则）', 'Backpropagation (chain rule)'], ['误差从顶上一层层往回传', 'The error flows back down'], ['一次算出所有参数的方向', 'All directions in one pass']],
  TR6: [['改参数，再来一遍', 'Update, and go again'], ['AdamW 优化器，学习率 {lr}', 'AdamW optimiser, rate {lr}'], ['重复 {n} 步，误差越来越小', '{n} steps, the error shrinks'], ['小步多次，稳定地变好', 'Many small steps, steady gains']],
  US1: [['把问题交给模型', 'Hand the question over'], ['8 个字：天空是什么颜色？', '8 chars: 天空是什么颜色？'], ['从最底下进入', 'It enters at the bottom'], ['模型只会接着往下写', 'It can only continue text']],
  US2: [['字 → 编号', 'Chars → numbers'], ['和训练时同一本字典', 'The same dictionary as training'], ['8 个字 → 8 个编号', '8 chars → 8 numbers'], ['编号才能去查表', 'Numbers can look up tables']],
  US3: [['编号 → 一串数字', 'Number → a row of numbers'], ['词向量表 {V} × 16', 'Embedding table {V} × 16'], ['每个编号取出 16 个数', 'Each number fetches 16 values'], ['意思相近的字，数字也相近', 'Similar chars get similar rows']],
  US4: [['告诉模型字的先后', 'Tells the model the order'], ['位置向量表 24 × 16', 'Position table 24 × 16'], ['字的 16 个数 + 位置的 16 个数', 'Char row + position row'], ['注意力本身不分先后', 'Attention alone ignores order']],
  US5: NODE_INFO.att,
  US6: [['每个字自己再加工一遍', 'Each char is refined alone'], ['16 → 64 → 16', '16 → 64 → 16'], ['放大，ReLU 去掉负数，缩回', 'Widen, ReLU drops negatives, shrink'], ['能学更复杂的规律', 'Can learn more complex rules']],
  US7: [['同样的结构再来一遍', 'The same structure again'], ['第2个解码块，参数不同', 'Block 2, its own parameters'], ['输入是第1块的输出', 'Its input is block 1’s output'], ['叠得越多，理解越深', 'More blocks, deeper reading']],
  US8: [['给每个字打分，变成概率', 'Scores every char, makes odds'], ['线性层 16 × {V} + Softmax', 'Linear 16 × {V} + Softmax'], ['最后一个字的 16 个数 → {V} 个概率', 'Last char’s 16 numbers → {V} odds'], ['概率才能比较、能挑选', 'Odds can be compared and picked']],
  US9: [['选出下一个字', 'Picks the next char'], ['取概率最高的字', 'Take the most likely char'], ['接到后面再猜，直到「结束」', 'Append and repeat until END'], ['一次一个字地写', 'Writes one char at a time']],
  MY1: [['出你自己的题', 'Write your own questions'], ['每行「问题？→答案」', 'One “question？→answer” per line'], ['只认识题里出现过的字', 'Knows only chars in your lines'], ['模型只认识见过的字', 'It only knows what it has seen']],
  MY2: [['看你的模型学起来', 'Watch your model learn'], ['同一个模型，新的参数', 'Same model, fresh parameters'], ['前向算误差，反向改参数', 'Forward for error, back to update'], ['误差下降说明在学', 'A falling error means learning']],
  MY3: [['考考你的模型', 'Test your model'], ['你刚训练的参数', 'The parameters you just trained'], ['输入问题，看它选的字', 'Ask, see which chars it picks'], ['没见过的问法容易答错', 'Unseen wording often fails']],
};
const PK: Record<string, string> = { L4: 'K01', TR1: 'K13', TR2: 'K02', TR3: 'K12', TR4: 'K13', TR5: 'K14', TR6: 'K14', US1: 'K15', US2: 'K02', US3: 'K03', US4: 'K04', US5: 'K06', US6: 'K10', US7: 'K05', US8: 'K11', US9: 'K15', MY1: 'K14', MY2: 'K14', MY3: 'K15' };

/* ---------- number formatting ---------- */
const mi = (s: string) => s.replace(/-/g, '−');
export const f2 = (x: number) => mi(x.toFixed(2));
export const pc = (p: number) => { const v = p * 100; return (v >= 99.95 ? v.toFixed(2) : v < 0.05 ? v.toFixed(2) : v.toFixed(1)) + '%'; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const chn = (c: string, l: L) => (c === '⏎' ? tx(UI.end, l) : esc(c));
const row = (a: ArrayLike<number>, o: number, n = 3) => Array.from({ length: n }, (_, j) => f2(a[o + j]!)).join(', ') + ', …';
const EX = (l: L) => `<span class="l4-ex">${tx(UI.ex, l)}</span>`;
const bars = (items: [string, number][], _l: L, gold = -1) => `<div class="l4-bars">${items.map(([c, p], i) => `<div class="l4-bar${i === gold ? ' g' : ''}"><span class="c">${c}</span><i style="width:${Math.max(2, Math.round(p * 100))}%"></i><span class="v">${pc(p)}</span></div>`).join('')}</div>`;
/** a small inner pipeline, drawn bottom → top like the big diagram (items: [label, hash | null, gold?]) */
const flow = (items: [string, string | null, boolean?][]) => `<div class="l4-flw">${[...items].reverse().map(([t, hs, g], i) => (i ? '<i aria-hidden="true">↑</i>' : '') + (hs ? `<button type="button" class="l4-fb${g ? ' gold' : ''}" data-go="${hs}">${t}<span>+</span></button>` : `<span class="l4-fb">${t}</span>`)).join('')}</div>`;
const sub = (s: string) => `<p class="l4-sub">${s}</p>`;
const h = (s: string) => `<h4 class="l4-ph">${s}</h4>`;
const top = (probs: ArrayLike<number>, o: number, V: number, n: number) => Array.from({ length: V }, (_, i) => [i, probs[o + i]!] as [number, number]).sort((a, b) => b[1] - a[1]).slice(0, n);
function topBars(tr: Trace, chars: string[], pos: number, n: number, l: L, mark?: number) {
  const V = chars.length, t = top(tr.probs, pos * V, V, n), rest = 1 - t.reduce((s, x) => s + x[1], 0);
  const items: [string, number][] = t.map(([i, p]) => [chn(chars[i]!, l), p]); items.push([tx(UI.other, l), Math.max(0, rest)]);
  return bars(items, l, mark == null ? -1 : t.findIndex((x) => x[0] === mark));
}
const curve = (ls: number[], w = 150, hh = 56) => {
  if (!ls.length) return ''; const mx = Math.max(...ls), mn = Math.min(0, ...ls), n = Math.max(1, ls.length - 1);
  const pts = ls.map((v, i) => `${((i / n) * (w - 4) + 2).toFixed(1)},${(hh - 3 - ((v - mn) / (mx - mn || 1)) * (hh - 8)).toFixed(1)}`).join(' ');
  return `<svg class="l4-curve" viewBox="0 0 ${w} ${hh}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#ffb060" stroke-width="2"/></svg>`;
};
function arcs(chars: string[], ids: number[], W: ArrayLike<number>, T: number, qi: number, n: number, l: L, col = '#8fe3ff') {
  const cw = 18, w = T * cw, base = 34; const t = Array.from({ length: qi + 1 }, (_, j) => [j, W[qi * T + j]!] as [number, number]).sort((a, b) => b[1] - a[1]).slice(0, n);
  let s = ''; for (const [j, p] of t) { if (j === qi) continue; const x1 = j * cw + cw / 2, x2 = qi * cw + cw / 2, hh = 6 + (qi - j) * 3;
    s += `<path d="M${x2} ${base - 12}Q${(x1 + x2) / 2} ${base - 12 - hh * 1.6} ${x1} ${base - 12}" fill="none" stroke="${col}" stroke-width="${(1 + p * 4).toFixed(1)}" opacity=".9"/>`; }
  s += ids.slice(0, T).map((id, j) => `<text x="${j * cw + cw / 2}" y="${base + 2}" text-anchor="middle" font-size="13" fill="${j === qi ? '#ffd77a' : '#e6eeff'}">${esc(chars[id]!)}</text>`).join('');
  return { svg: `<svg class="l4-arc" viewBox="0 0 ${w} ${base + 6}" aria-hidden="true">${s}</svg>`, t: t.map(([j, p]) => `「${chn(chars[ids[j]!]!, l)}」${pc(p)}`).join(' · ') };
}
/** the sharper of the two layer-0 heads at the question mark */
export function pickHead(tr: Trace, qi: number) {
  const L0 = tr.layers[0]!, T = tr.T; let best = 0, bv = -1;
  for (let hh = 0; hh < L0.W.length; hh++) { let m = 0; for (let j = 0; j < qi; j++) m = Math.max(m, L0.W[hh]![qi * T + j]!); if (m > bv) { bv = m; best = hh; } }
  return best;
}
/** the key position with the highest score for the question mark (excluding itself) */
export function pickKey(tr: Trace, hh: number, qi: number) { const S = tr.layers[0]!.S[hh]!, T = tr.T; let b = 0; for (let j = 0; j < qi; j++) if (S[qi * T + j]! > S[qi * T + b]!) b = j; return b; }
export function dot(tr: Trace, hh: number, qi: number, kj: number) {
  const L0 = tr.layers[0]!, d = 16, dh = 8, o = hh * dh, pr: [number, number, number][] = []; let s = 0;
  for (let e = 0; e < dh; e++) { const a = L0.q[qi * d + o + e]!, b = L0.k[kj * d + o + e]!; pr.push([a, b, a * b]); s += a * b; }
  return { pr, sum: s, score: s / Math.sqrt(dh) };
}

const fill = (s: string, d: Demo | null) => s.replace('{V}', String(d?.chars.length ?? 14)).replace('{lr}', d ? String(+d.lr.toFixed(4)) : '0.004').replace('{n}', String(d?.steps ?? 200));
const inf = (x: Info, c: Ctx) => x.map((t) => fill(tx(t, c.l), c.d)) as [string, string, string, string];

/* ---------- routing ---------- */
export function parse(hash: string): { id: string; card: string | null } {
  const raw = decodeURIComponent(hash.replace(/^#/, '')); const [p, card] = raw.split('~') as [string, string | undefined];
  const m = /^L4\/(tr|us|my)\/(\d)$/.exec(p); if (m) return { id: m[1]!.toUpperCase() + m[2], card: card ?? null };
  const x = /^L4\/x\/([a-z0-9.]+)$/.exec(p); if (x) return { id: 'X:' + x[1], card: card ?? null };
  return { id: p || 'home', card: card ?? null };
}
export const hashOf = (id: string) => (id === 'home' ? '#home' : id === 'L4' ? '#L4' : id.startsWith('X:') ? `#L4/x/${id.slice(2)}` : /^(TR|US|MY)\d$/.test(id) ? `#L4/${id.slice(0, 2).toLowerCase()}/${id.slice(2)}` : '#' + id);
export const ORDER = ['L4', 'TR1', 'TR2', 'TR3', 'TR4', 'TR5', 'TR6', 'US1', 'US2', 'US3', 'US4', 'US5', 'US6', 'US7', 'US8', 'US9', 'MY1', 'MY2', 'MY3'];
export const validX = (p: string) => X_ORDER.includes(p) || isNd(p.split('.')[0] ?? '') && !p.includes('.') && ['tok', 'emb', 'an2', 'lin', 'sm'].includes(p);
export const xHash = (p: string) => `#L4/x/${p}`;

/* ---------- pages ---------- */
const base = (c: Ctx, id: string, kind: Page['kind']): Page => ({
  id, kind, crumb: [['Transformer', '#L4']], top: '', mode: 'left', st: all('pass'), back: false, resOn: false, frameLit: false, frameTag: null, sel: null, flow: null,
  info: inf(PI[id] ?? PI.L4!, c), k: PK[id] ?? 'K01', math: null, hint: tx(UI.hintS, c.l), dots: null, panel: null, tags: [], notes: null, ent: false, next: '#L4', up: null,
});
const wait = (c: Ctx) => `<p class="l4-wait">${tx(UI.load, c.l)}</p>`;

export function page(id: string, c: Ctx): Page {
  const l = c.l, T = (k: keyof typeof UI) => tx(UI[k] as Tx, l), d = c.d;
  if (id === 'L4') { const p = base(c, 'L4', 'l4'); p.mode = 'full'; p.st = all('calm'); p.crumb = [['Transformer', null], [T('whole'), null]]; p.hint = T('hint0'); p.ent = true; p.next = '#L4/tr/1'; return p; }
  if (id.startsWith('X:')) return xpage(id.slice(2), c);
  const kind = id.slice(0, 2).toLowerCase() as 'tr' | 'us' | 'my', n = Number(id.slice(2)), p = base(c, id, kind);
  const ix = ORDER.indexOf(id); p.next = ix >= 0 && ix < ORDER.length - 1 ? hashOf(ORDER[ix + 1]!) : '#L4';
  const steps = STEPN[kind]; p.dots = [steps.length, n - 1];
  p.crumb = [['Transformer', '#L4'], [tx(kind === 'tr' ? UI.trN : kind === 'us' ? UI.usN : UI.myN, l), null], [tx(steps[n - 1]!, l), null]];
  if (kind === 'tr') {
    p.top = 'tr';
    if (!d) { p.panel = wait(c); p.st = all('dim'); return p; }
    const tr = d.before, ch = d.chars, V = ch.length, qi = 7, blue = d.chars.indexOf('蓝');
    if (n === 1) { p.st = litUpto('in'); p.panel = h(tx(['3 道例题', '3 examples'], l)) + `<ol class="l4-ol">${['天空是什么颜色？→蓝', '草是什么颜色？→绿', '火是什么颜色？→红'].map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` + sub(tx(['先拿第 1 题来演示：看到「天空是什么颜色？」，要猜出「蓝」，再猜「结束」。', 'We demo line 1: after 天空是什么颜色？ it must guess 蓝, then END.'], l)); }
    if (n === 2) { p.st = { ...litUpto('tok'), in: 'lit' };
      p.panel = h(tx([`字典（${V} 个字）`, `Dictionary (${V} chars)`], l)) + `<div class="l4-dict">${ch.map((x, i) => `<span><b>${chn(x, l)}</b>${i}</span>`).join('')}</div>` + h(tx(['分词', 'Tokenized'], l)) + `<p class="l4-ids">${tr.ids.slice(0, 8).join(' ')} <span class="l4-gold">→ ${blue}</span></p>` + sub(tx(['答案「蓝」= ' + blue + '，结束符 = 0。', 'Answer 蓝 = ' + blue + ', END = 0.'], l)); }
    if (n === 3) { p.st = { ...all('pass'), out: 'lit' }; p.flow = { a: 'in', b: 'out' };
      p.panel = h(tx(['看到「？」后的第一次猜测', 'First guess after ？'], l)) + EX(l) + topBars(tr, ch, qi, 3, l) + sub(tx([`正确答案「蓝」只占 <b class="l4-o">${pc(tr.probs[qi * V + blue]!)}</b>：参数还是随机的。`, `The right answer 蓝 gets only <b class="l4-o">${pc(tr.probs[qi * V + blue]!)}</b>: the parameters are random.`], l)); }
    if (n === 4) { const pb = tr.probs[qi * V + blue]!; p.st = { ...all('pass'), out: 'back' };
      p.panel = h(tx(['误差（损失）', 'The error (loss)'], l)) + EX(l) + bars([[tx(['猜「蓝」', 'guess 蓝'], l), pb], [tx(['正确', 'target'], l), 1]], l, 1)
        + `<p class="l4-f">−ln(${pb.toFixed(4)}) = <b class="l4-o">${(-Math.log(pb)).toFixed(2)}</b></p>` + sub(tx([`概率越接近 100%，误差越接近 0。这一题（答案 + 结束符）平均误差 ${tr.loss!.toFixed(2)}。`, `Closer to 100% means closer to 0. This line’s average (answer + END) is ${tr.loss!.toFixed(2)}.`], l)); }
    if (n === 5) { p.st = all('back'); p.back = true; p.flow = { a: 'in', b: 'out', back: true }; p.panel = null; p.resOn = false;
      const nb = d.nb0, tag = (x: number) => `${tx(['该改多少', 'change'], l)} <b>${x.toFixed(2)}</b>`;
      p.tags = ([['lin', nb.lin], ['an2', nb.an2], ['ffn', nb.ffn], ['an1', nb.an1], ['att', nb.att], ['emb', nb.emb]] as [Nd, number][]).map(([nd, v]) => ({ nd, h: tag(v) }));
      p.notes = [tx([`误差 ${tr.loss!.toFixed(2)} 从顶上出发，往回传 ↓`, `Error ${tr.loss!.toFixed(2)} starts at the top, flows back ↓`], l), tx([`第 1 步：所有参数的梯度大小 ${d.gn0.toFixed(2)}（真实数字）`, `Step 1: gradient size of all parameters ${d.gn0.toFixed(2)} (real)`], l)]; }
    if (n === 6) { const a = d.after; p.flow = { a: 'in', b: 'out' };
      p.panel = h(tx([`误差曲线（${d.steps} 步）`, `Error curve (${d.steps} steps)`], l)) + EX(l) + curve(d.losses) + `<p class="l4-f">${d.losses[0]!.toFixed(2)} → <b>${d.losses[d.losses.length - 1]!.toFixed(3)}</b></p>`
        + `<p class="l4-f">p(蓝) ${pc(tr.probs[qi * V + blue]!)} → <b class="l4-gold">${pc(a.probs[qi * V + blue]!)}</b></p><p class="l4-fm">${tx(['新 = 旧 − 学习率 × 该改多少', 'new = old − rate × change'], l)}</p>` + sub(tx([`共 ${d.n.toLocaleString()} 个参数，每步一起改一点。`, `${d.n.toLocaleString()} parameters, all nudged every step.`], l)); }
    return p;
  }
  if (kind === 'us') {
    p.top = 'us'; const order: Nd[] = ['in', 'tok', 'emb', 'emb', 'att', 'ffn', 'an2', 'sm', 'out']; p.st = litUpto(order[n - 1]!);
    if (n === 7) { p.st = { ...litUpto('an2'), att: 'lit', an1: 'lit', ffn: 'lit', an2: 'lit' }; p.frameLit = true; p.resOn = true; p.frameTag = tx(FRAME2, l); }
    if (n === 8) p.st = { ...litUpto('sm'), lin: 'lit' };
    if (n === 9) { p.st = { ...all('pass'), in: 'lit', out: 'lit' }; p.flow = { a: 'in', b: 'out' }; p.next = '#L4/my/1'; }
    if (n === 5) p.resOn = false;
    const u = c.u; if (!u) { p.panel = wait(c); return p; }
    const tr = u.tr, ch = u.chars, V = ch.length, qi = tr.T - 1, L0 = tr.layers[0]!, L1 = tr.layers[1]!;
    if (n === 1) p.panel = h(tx(['输入', 'Input'], l)) + `<p class="l4-big">${esc(Q)}</p>` + sub(tx(['模型要做的只有一件事：猜「？」后面的下一个字。', 'Its only job: guess the char after ？.'], l)) + sub(tx(['顶上这行字一直不变；下面亮起的块，就是这一步在用的部件。', 'The text on top stays; the lit boxes are the parts in use now.'], l));
    if (n === 2) p.panel = h(tx(['分词', 'Tokenized'], l)) + `<div class="l4-tk">${tr.ids.map((i) => `<span><b>${esc(ch[i]!)}</b>${i}</span>`).join('')}</div>` + sub(tx(['8 个字 → 8 个编号。', '8 chars → 8 numbers.'], l)) + sub(tx(['<b>依据</b>：训练时建好的字典，一个字一个编号。大模型用 BPE 等方法，把常见的词拼成一块。', '<b>Based on</b> the dictionary built in training, one number per char. Big models use BPE and the like, merging common words into one piece.'], l));
    if (n === 3) p.panel = h(tx(['查词向量表', 'Embedding lookup'], l)) + EX(l) + [0, 1, qi].map((i) => `<p class="l4-v"><b>${esc(ch[tr.ids[i]!]!)}</b> [${row(tr.tok, i * 16)}]</p>`).join('') + sub(tx(['每个字 16 个数，是训练学出来的。', '16 numbers per char, learned in training.'], l));
    if (n === 4) p.panel = h(tx(['加位置编码（「天」，第 1 位）', 'Add position (天, slot 1)'], l)) + EX(l) + `<p class="l4-v">${tx(['字', 'char'], l)} [${row(tr.tok, 0)}]</p><p class="l4-v">+ ${tx(['位置', 'pos'], l)} [${row(tr.pos, 0)}]</p><p class="l4-v">= [${row(tr.x0, 0)}]</p>` + sub(tx(['同一个字放在不同位置，得到不同的数，所以「天空」和「空天」不一样。', 'Same char, different slot, different numbers: 天空 ≠ 空天.'], l));
    if (n === 5) { const hh = pickHead(tr, qi), a = arcs(ch, tr.ids, L0.W[hh]!, tr.T, qi, 4, l);
      p.panel = h(tx([`「？」看前面（第 1 块，头 ${hh + 1}）`, `？ looks back (block 1, head ${hh + 1})`], l)) + EX(l) + a.svg + `<p class="l4-sub">${a.t}</p>` + sub(tx(['线越粗，分到的百分比越多。遮罩让它只能看前面的字。', 'Thicker line, bigger share. The mask lets it see only earlier chars.'], l)) + `<div class="l4-row">${([['att.heads', ['多头', 'Heads']], ['att.mask', ['遮罩', 'Mask']]] as [string, Tx][]).map(([x, t]) => `<button type="button" class="l4-b l4-plus" data-go="${xHash(x)}">${tx(t, l)} <span>+</span></button>`).join('')}</div>`; }
    if (n === 6) { let on = 0; for (let j = 0; j < 64; j++) if (L0.act[qi * 64 + j]! > 0) on++;
      p.panel = h(tx(['前馈网络（「？」）', 'Feed-forward (？)'], l)) + EX(l) + `<p class="l4-f">16 → 64 → 16</p><p class="l4-f">${tx(['64 个里', 'of 64,'], l)} <b class="l4-gold">${on}</b> ${tx(['个被激活（>0）', 'are active (>0)'], l)}</p>` + sub(tx(['ReLU 把负数变成 0，只留下有用的。', 'ReLU turns negatives into 0.'], l)) + sub(tx(['注意力：字和字交流；前馈：每个字自己消化。', 'Attention: chars talk to each other. Feed-forward: each char digests alone.'], l)); }
    if (n === 7) p.panel = h(tx(['第 2 块：新 = 原来的 + 改进', 'Block 2: new = old + change'], l)) + EX(l) + `<p class="l4-v">${tx(['原来', 'old'], l)} [${row(L1.x, qi * 16)}]</p><p class="l4-v">+ ${tx(['注意力', 'attn'], l)} [${row(L1.att, qi * 16)}]</p><p class="l4-v">= [${row(L1.sum1, qi * 16)}]</p>` + sub(tx(['结构一样，参数是另一套。', 'Same structure, its own parameters.'], l));
    if (n === 8) { const t = top(tr.probs, qi * V, V, 1)[0]!; p.panel = h(tx(['「？」后面的下一个字', 'Next after ？'], l)) + EX(l) + topBars(tr, ch, qi, 3, l, t[0]) + sub(tx([`线性层先给 ${V} 个字打原始分（最高 ${f2(tr.logits[qi * V + t[0]]!)}），Softmax 再变成概率。`, `Linear gives ${V} raw scores (top ${f2(tr.logits[qi * V + t[0]]!)}); Softmax makes odds.`], l)); }
    if (n === 9) { const a = c.a; if (!a) { p.panel = wait(c); return p; } const s0 = a.steps[0]!.top[0]!, s1 = a.steps[1]?.top[0];
      p.top = 'us9:' + (a.out || '');
      p.panel = h(tx(['选出下一个字', 'The pick'], l)) + EX(l) + `<p class="l4-big">「<b class="l4-gold">${chn(a.chars[s0[0]]!, l)}</b>」 ${pc(s0[1])}</p>` + (s1 ? sub(tx([`接上后再猜：「${chn(a.chars[s1[0]]!, l)}」${pc(s1[1])}${s1[0] === 0 ? '，停止。' : '。'}`, `Then: ${chn(a.chars[s1[0]]!, l)} ${pc(s1[1])}${s1[0] === 0 ? ', stop.' : '.'}`], l)) : '') + `<p class="l4-fm">${esc(Q)}<b class="l4-gold">${esc(a.out)}</b></p>` + sub(tx(['一次一个字：选出的字接到末尾，再从最底下算一遍，直到选出「结束」。', 'One char at a time: append the pick, run again from the bottom, until END.'], l)); }
    return p;
  }
  /* my */
  p.top = 'my'; const m = c.my;
  if (n === 1) { p.st = litUpto('in');
    p.panel = h(tx(['每行一题：问题？→答案', 'One per line: question？→answer'], l)) + `<textarea class="l4-ta" data-my="lines" rows="5" aria-label="${tx(['我的训练题', 'My lines'], l)}">${esc(m.lines.join('\n'))}</textarea>`
      + `<div class="l4-row"><button type="button" class="l4-b" data-act="my-add">${tx(['添加一题', 'Add a line'], l)}</button><button type="button" class="l4-b gold" data-act="my-train">${tx(['开始训练', 'Train'], l)}</button></div>` + (m.err ? `<p class="l4-err">${esc(m.err)}</p>` : '') + sub(tx(['至少一题；最多 8 题，每题 24 字以内。', '1–8 lines, up to 24 chars each.'], l)); }
  if (n === 2) { const g = m.prog; p.flow = g && !g.done ? { a: 'in', b: 'out', back: g.step % 2 === 1 } : null;
    p.st = g && !g.done ? all(g.step % 2 ? 'back' : 'lit') : all('pass'); p.back = !!(g && !g.done && g.step % 2);
    p.panel = !g ? h(tx(['还没开始训练', 'Not trained yet'], l)) + `<div class="l4-row"><button type="button" class="l4-b gold" data-go="#L4/my/1">${tx(['去写题', 'Write lines'], l)}</button></div>`
      : h(tx([`第 ${g.step} / ${g.total} 步`, `Step ${g.step} / ${g.total}`], l)) + EX(l) + `<div class="l4-pbar"><i style="width:${Math.round((g.step / g.total) * 100)}%"></i></div>` + curve(g.losses) + `<p class="l4-f">${tx(['误差', 'error'], l)} ${g.losses[0]!.toFixed(2)} → <b class="l4-o">${g.loss.toFixed(3)}</b></p>`
        + `<div class="l4-row">${g.done ? `<button type="button" class="l4-b gold" data-go="#L4/my/3">${tx(['去测一测 ›', 'Test it ›'], l)}</button>` : `<button type="button" class="l4-b" data-act="${m.paused ? 'my-resume' : 'my-pause'}">${m.paused ? tx(['继续', 'Resume'], l) : tx(['暂停', 'Pause'], l)}</button>`}</div>`; }
  if (n === 3) { p.st = m.ans ? { ...all('pass'), in: 'lit', out: 'lit' } : litUpto('in'); p.next = '#L4';
    const a = m.ans;
    p.panel = h(tx(['问它一个问题', 'Ask it'], l)) + `<input class="l4-in" data-my="q" value="${esc(m.q)}" aria-label="${tx(['问题', 'Question'], l)}"><div class="l4-row"><button type="button" class="l4-b gold" data-act="my-test">${tx(['测一测', 'Ask'], l)}</button></div>`
      + (!m.ready ? sub(tx(['先训练一个模型（第①步）。', 'Train a model first (step ①).'], l)) : '')
      + (a ? `<p class="l4-big">${tx(['回答', 'Answer'], l)}：<b class="l4-gold">${esc(a.out) || '—'}</b></p>` + bars(a.steps[0]!.top.slice(0, 3).map(([i, q]) => [chn(a.chars[i]!, l), q] as [string, number]), l, 0) + (a.unknown.length ? `<p class="l4-err">${tx(['没见过的字：', 'Unknown chars: '], l)}${esc(a.unknown.join(' '))}</p>` : '') : ''); }
  return p;
}

function xpage(path: string, c: Ctx): Page {
  const l = c.l, nd = path.split('.')[0] as Nd, p = base(c, 'X:' + path, 'x'); p.mode = 'xl'; p.sel = nd; p.st = { ...all('pass'), [nd]: 'sel' };
  p.info = inf(XI[path] ?? NODE_INFO[nd], c); p.k = XK[path] ?? NODE_K[nd]; p.math = XM[path] ?? null; p.hint = tx(UI.hintX, l);
  const xi = X_ORDER.indexOf(path); p.dots = xi >= 0 ? [X_ORDER.length, xi] : null; p.next = xi >= 0 && xi < X_ORDER.length - 1 ? xHash(X_ORDER[xi + 1]!) : '#L4';
  const segs = path.split('.'); p.crumb = [['Transformer', '#L4']]; if (['att', 'an1', 'ffn', 'an2'].includes(nd)) p.crumb.push([tx(['解码块', 'Decoder block'], l), null]);
  segs.forEach((_, i) => { const sp = segs.slice(0, i + 1).join('.'); p.crumb.push([tx(XN[sp] ?? LAB[nd], l), i < segs.length - 1 ? xHash(sp) : null]); });
  p.up = segs.length > 1 ? xHash(segs.slice(0, -1).join('.')) : null;
  if (nd === 'an1' || nd === 'an2') p.resOn = true;
  const u = c.u; if (!u) { p.panel = wait(c); return p; }
  const tr = u.tr, ch = u.chars, V = ch.length, qi = tr.T - 1, L0 = tr.layers[0]!, hh = pickHead(tr, qi), kj = pickKey(tr, hh, qi), H = (s: string) => h(s) + EX(l);
  switch (path) {
    case 'att': p.panel = h(tx(['Q、K、V 三个角色', 'Q, K and V'], l)) + `<div class="l4-qkv"><p><b class="q">Q</b>${tx(['提问：我要找什么', 'what I need'], l)}</p><p><b class="k">K</b>${tx(['被比对：我有什么', 'what I have'], l)}</p><p><b class="v">V</b>${tx(['内容：真正被拿走的', 'what is taken'], l)}</p></div>`
      + h(tx(['里面（从下往上算）', 'Inside (bottom → top)'], l)) + flow([[tx(['算出 Q、K、V', 'Make Q, K, V'], l), null], [tx(['Q·K 打分', 'Q·K scores'], l), xHash('att.dot'), true], [tx(['遮罩：挡住后面的字', 'Mask later chars'], l), xHash('att.mask')], [tx(['Softmax 成百分比', 'Softmax → shares'], l), null], [tx(['按百分比混合 V', 'Mix V by shares'], l), null], [tx(['拼接 2 个头', 'Join the 2 heads'], l), xHash('att.heads')]]); break;
    case 'att.dot': { const S = L0.S[hh]!, T = tr.T; let mx = 0.01; for (let i = 0; i < T; i++) for (let j = 0; j <= i; j++) mx = Math.max(mx, Math.abs(S[i * T + j]!));
      let g = `<div class="l4-grid" style="grid-template-columns:14px repeat(${T},1fr)"><span></span>${tr.ids.map((i) => `<span class="hd">${esc(ch[i]!)}</span>`).join('')}`;
      for (let i = 0; i < T; i++) { g += `<span class="hd">${esc(ch[tr.ids[i]!]!)}</span>`; for (let j = 0; j < T; j++) { const v = S[i * T + j]!, on = j <= i, a = on ? Math.abs(v) / mx : 0;
        const st = on ? `background:${v >= 0 ? `rgba(80,150,255,${(0.15 + 0.85 * a).toFixed(2)})` : `rgba(255,140,60,${(0.15 + 0.7 * a).toFixed(2)})`}` : '';
        g += i === qi && j === kj ? `<button type="button" class="cell gold" data-go="${xHash('att.dot.one')}" style="${st}" aria-label="${f2(v)}">+</button>` : `<span class="cell${on ? '' : ' m'}" style="${st}"></span>`; } }
      g += '</div>';
      p.panel = H(tx([`分数表（第 1 块，头 ${hh + 1}）`, `Scores (block 1, head ${hh + 1})`], l)) + g + sub(tx([`蓝＝正分，橙＝负分，灰＝被遮住。黄框：「？」问「${esc(ch[tr.ids[kj]!]!)}」= <b>${f2(S[qi * T + kj]!)}</b>`, `Blue = positive, orange = negative, grey = masked. Gold: ？ asks ${esc(ch[tr.ids[kj]!]!)} = <b>${f2(S[qi * T + kj]!)}</b>`], l)); p.hint = tx(UI.hintX2, l); break; }
    case 'att.dot.one': { const r = dot(tr, hh, qi, kj), W = L0.W[hh]![qi * tr.T + kj]!;
      p.panel = H(tx([`「？」的 Q · 「${esc(ch[tr.ids[kj]!]!)}」的 K`, `Q of ？ · K of ${esc(ch[tr.ids[kj]!]!)}`], l)) + `<table class="l4-tb"><tbody>${r.pr.map(([a, b, x]) => `<tr><td>${f2(a)}</td><td>×</td><td>${f2(b)}</td><td>=</td><td>${f2(x)}</td></tr>`).join('')}</tbody></table>`
        + `<p class="l4-f">${tx(['相加', 'sum'], l)} ${f2(r.sum)} ÷ √8 = <b class="l4-gold">${f2(r.score)}</b></p>` + sub(tx([`这一行 Softmax 后，「${esc(ch[tr.ids[kj]!]!)}」分到 ${pc(W)}。`, `After Softmax over the row, ${esc(ch[tr.ids[kj]!]!)} gets ${pc(W)}.`], l)); p.hint = tx(UI.hintX3, l); break; }
    case 'att.heads': p.panel = H(tx(['2 个头，各看各的', '2 heads, each its own view'], l)) + [0, 1].map((k) => { const a = arcs(ch, tr.ids, L0.W[k]!, tr.T, qi, 3, l, k ? '#ffb060' : '#8fe3ff'); return `<p class="l4-ph2">${tx(['头', 'Head'], l)} ${k + 1}</p>${a.svg}<p class="l4-sub">${a.t}</p>`; }).join('') + sub(tx(['两个头各得 8 个数，拼成 16 个。', '8 numbers each, joined into 16.'], l)); break;
    case 'att.mask': { const T = tr.T; let g = `<div class="l4-grid" style="grid-template-columns:14px repeat(${T},1fr)"><span></span>${tr.ids.map((i) => `<span class="hd">${esc(ch[i]!)}</span>`).join('')}`;
      for (let i = 0; i < T; i++) { g += `<span class="hd">${esc(ch[tr.ids[i]!]!)}</span>`; for (let j = 0; j < T; j++) g += `<span class="cell${j <= i ? ' ok' : ' m'}${i === 4 ? ' r' : ''}"></span>`; } g += '</div>';
      p.panel = h(tx(['谁能看谁', 'Who can see whom'], l)) + g + `<p class="l4-lg"><i class="ok"></i>${tx(['能看', 'visible'], l)}<i class="m"></i>${tx(['被挡住', 'masked'], l)}</p>` + sub(tx([`写到「${esc(ch[tr.ids[4]!]!)}」（第 5 行）时，只能看「${esc(tr.ids.slice(0, 5).map((i) => ch[i]).join(''))}」。灰格分数设为 −∞，Softmax 后为 0%。`, `At ${esc(ch[tr.ids[4]!]!)} (row 5) it sees only ${esc(tr.ids.slice(0, 5).map((i) => ch[i]).join(''))}. Grey = −∞ → 0%.`], l)); break; }
    case 'ffn': { let on = 0; for (let j = 0; j < 64; j++) if (L0.act[qi * 64 + j]! > 0) on++;
      p.panel = H(tx(['「？」在第 1 块的前馈网络', '？ in block 1’s feed-forward'], l)) + flow([[tx(['一个字的 16 个数', 'One char: 16 numbers'], l), null], [tx(['线性放大 16 → 64', 'Linear up 16 → 64'], l), null], [tx(['ReLU：负数变 0', 'ReLU: negatives → 0'], l), null], [tx(['线性缩回 64 → 16', 'Linear down 64 → 16'], l), null]]) + `<p class="l4-f">ReLU：${tx(['64 个里', 'of 64,'], l)} <b class="l4-gold">${on}</b> ${tx(['个 >0，其余变 0', 'are >0, the rest become 0'], l)}</p>` + `<p class="l4-v">${tx(['输出', 'out'], l)} [${row(L0.ff, qi * 16, 2)}]</p>` + sub(tx(['每个字单独算，互不干扰。', 'Each char on its own.'], l)); break; }
    case 'an1': case 'an2': { const Lx = nd === 'an1' ? L0 : tr.layers[0]!, a = nd === 'an1' ? Lx.att : Lx.ff, inp = nd === 'an1' ? Lx.x : Lx.n1, s = nd === 'an1' ? Lx.sum1 : Lx.sum2, c1 = nd === 'an1' ? Lx.c1 : Lx.c2, o = qi * 16;
      let mu = 0, sd = 0; for (let j = 0; j < 16; j++) mu += s[o + j]!; mu /= 16; for (let j = 0; j < 16; j++) sd += (s[o + j]! - mu) ** 2; sd = Math.sqrt(sd / 16);
      p.panel = H(tx(['加 + 归一化（「？」，第 1 块）', 'Add + Norm (？, block 1)'], l)) + h(tx(['① 残差相加', '① Add (residual)'], l)) + `<p class="l4-v">${tx(['输入', 'in'], l)} [${row(inp, o, 2)}]</p><p class="l4-v">+ ${tx(['改进', 'change'], l)} [${row(a, o, 2)}]</p><p class="l4-v">= [${row(s, o, 2)}]</p>` + sub(tx(['原来的信息原样留着，只加上改进。', 'The input is kept; only the change is added.'], l))
        + h(tx(['② 归一化', '② Norm'], l)) + `<p class="l4-f">${tx(['均值', 'mean'], l)} ${f2(mu)} · ${tx(['标准差', 'sd'], l)} ${f2(sd)}</p><p class="l4-v">→ [${row(c1.xh, o, 2)}]</p>` + sub(tx(['变成均值 0、标准差 1，再乘可学的缩放。', 'To mean 0, sd 1, then a learned scale.'], l)); break; }
    case 'tok': p.panel = h(tx([`字典（${V} 个字）`, `Dictionary (${V} chars)`], l)) + `<div class="l4-dict">${ch.map((x, i) => `<span><b>${chn(x, l)}</b>${i}</span>`).join('')}</div>` + `<p class="l4-ids">${esc(Q)} → ${tr.ids.join(' ')}</p>`; break;
    case 'emb': p.panel = H(tx(['两张表', 'Two tables'], l)) + `<p class="l4-f">${tx([`词向量表 ${V} × 16`, `Embedding ${V} × 16`], l)}</p><p class="l4-v"><b>${esc(ch[tr.ids[0]!]!)}</b> [${row(tr.tok, 0)}]</p><p class="l4-f">${tx(['位置表 24 × 16', 'Position 24 × 16'], l)}</p><p class="l4-v">#1 [${row(tr.pos, 0)}]</p><p class="l4-v">⊕ = [${row(tr.x0, 0)}]</p>`; break;
    case 'lin': { const t = top(tr.logits, qi * V, V, 5); p.panel = H(tx(['原始分（「？」）', 'Raw scores (？)'], l)) + `<table class="l4-tb"><tbody>${t.map(([i, z]) => `<tr><td>${chn(ch[i]!, l)}</td><td>${f2(z)}</td></tr>`).join('')}</tbody></table>` + sub(tx([`16 个数 × 16 × ${V} 的表 + 偏置 = ${V} 个分数。`, `16 numbers × a 16 × ${V} table + bias = ${V} scores.`], l)); break; }
    case 'sm': { const t = top(tr.logits, qi * V, V, 3), zm = t[0]![1]; let tot = 0; for (let i = 0; i < V; i++) tot += Math.exp(tr.logits[qi * V + i]! - zm);
      p.panel = H('Softmax') + `<table class="l4-tb"><tbody>${t.map(([i, z]) => `<tr><td>${chn(ch[i]!, l)}</td><td>e<sup>${f2(z - zm)}</sup></td><td>=${Math.exp(z - zm).toFixed(3)}</td><td>${pc(Math.exp(z - zm) / tot)}</td></tr>`).join('')}</tbody></table>` + sub(tx([`每个分数先减去最高分再取 eˣ（结果不变），除以总和 ${tot.toFixed(3)}。`, `Subtract the top score, take eˣ (same result), divide by the total ${tot.toFixed(3)}.`], l)); break; }
  }
  return p;
}
export const MY_DEFAULT = ['天空是什么颜色？→蓝', '草地是什么颜色？→绿', '夜晚是什么颜色？→黑'];
