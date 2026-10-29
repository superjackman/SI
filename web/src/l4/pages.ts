/* R38: every L4 screen — states, info card, panel — built from the real model's numbers (nothing hard-coded). */
import type { Demo, Prog } from './tf/core';
import type { Trace } from './tf/model';
import { all, litUpto, type Mode, type St } from './layout';
import { FRAME2, LAB, NODE_INFO, NODE_K, STEPN, UI, isNd, tx, type Info, type L, type Nd, type Tx } from './txt';

export type Ans = { chars: string[]; q: string; out: string; steps: { top: [number, number][] }[]; unknown: string[] };
export interface My { lines: string[]; prog: Prog | null; running: boolean; paused: boolean; ans: Ans | null; q: string; err: string; ready: boolean; fix?: string }
export interface Ctx { l: L; d: Demo | null; u: { chars: string[]; tr: Trace } | null; a: Ans | null; my: My }
export interface Page {
  id: string; kind: 'l4' | 'tr' | 'us' | 'my' | 'x'; crumb: [string, string | null][]; top: string; mode: Mode; st: Record<Nd, St>;
  back: boolean; resOn: boolean; frameLit: boolean; frameTag: string | null; sel: Nd | null; flow: { a: Nd; b: Nd; back?: boolean } | null;
  info: [string, string, string, string]; k: string; math: string | null; hint: string; dots: [number, number] | null; panel: string | null;
  tags: { nd: Nd; h: string }[]; notes: [string, string] | null; ent: boolean; next: string; up: string | null;
}
export const Q = '天空是什么颜色？';
export const X_ORDER = ['att', 'att.dot', 'att.dot.one', 'att.heads', 'att.mask', 'ffn', 'an1'];
const XN: Record<string, Tx> = { att: ['多头注意力', 'Attention'], 'att.dot': ['点积', 'Dot product'], 'att.dot.one': ['一个数', 'One number'], 'att.heads': ['多个头', 'Heads'], 'att.mask': ['遮罩', 'Mask'] };
const XI: Record<string, Info> = {
  att: [['算出每个字该从谁拿多少信息', 'How much each char takes from which'], ['Q/K/V、点积、遮罩、百分比、混合', 'Q/K/V, dot product, mask, shares, mix'], ['从下往上 6 步，每个头各算一遍', '6 steps bottom → top, once per head'], ['多个头能同时看不同的关系', 'Several heads see different relations']],
  'att.dot': [['给每两个字的相关度打分', 'Scores how related each pair is'], ['两串数字：Q 和 K', 'Two rows of numbers: Q and K'], ['对应相乘再相加，排成 {T}×{T} 表', 'Multiply pairs, add: a {T}×{T} table'], ['两串数方向越一致，分数越高', 'The more they point alike, the higher']],
  'att.dot.one': [['最底层的一步：算出一个分数', 'The very bottom: one score'], ['几次乘法 + 一次加法', 'A few multiplies + one sum'], ['乘加后除以 √d，再进 Softmax', 'Multiply-add, ÷ √d, then Softmax'], ['不除的话数太大，概率走极端', 'Without ÷ √d the odds go extreme']],
  'att.heads': [['同时从几个角度找信息', 'Looks from several angles at once'], ['2 个头，各自一套 Q/K/V', '2 heads, each its own Q/K/V'], ['各头结果拼起来，再合成一串', 'Join the heads, merge into one row'], ['一个头只看一种关系，多个才全面', 'One head, one relation; more see more']],
  'att.mask': [['让每个字只看自己和前面的字', 'Each char sees only itself and earlier'], ['一张遮挡表：右上角全挡住', 'A mask table: top-right all blocked'], ['被挡住的分数变成 0%', 'Blocked scores become 0%'], ['生成时看不到后面，训练要一致', 'No future when writing; train the same']],
};
const XK: Record<string, string> = { att: 'K06', 'att.dot': 'K07', 'att.dot.one': 'K07', 'att.heads': 'K06', 'att.mask': 'K08' };
const XM: Record<string, string> = { 'att.dot.one': 'KM02' };
const PI: Record<string, Info> = {
  L4: [['把一段字变成「下一个字」的概率', 'Turns text into odds for the next char'], ['分词、词向量、2个解码块、输出打分', 'Tokenize, embed, 2 decoder blocks, scoring'], ['从下往上依次加工，最后打分', 'Bottom → top, then score'], ['可并行，远处的字也能直接相连', 'Parallel; far chars connect directly']],
  TR1: [['给模型提供「题目→答案」来学', 'Gives the model question → answer to learn'], ['问题文字 + 正确答案（3 道题）', 'Question + right answer (3 lines)'], ['先只用到最底下的「输入文字」', 'Only the bottom “Input text” is used'], ['没有例子，模型就无从学起', 'No examples, nothing to learn from']],
  TR2: [['把文字变成电脑能算的编号', 'Turns text into numbers a computer can use'], ['字典（字↔编号）+ 分词规则', 'Dictionary (char ↔ number) + split rule'], ['统计题里所有字，逐个编号', 'Collect every char, number each'], ['模型只会算数字，不认识字', 'The model does numbers, not chars']],
  TR3: [['得到模型现在的猜测（前向）', 'Gets the model’s current guess (forward)'], ['所有块从下往上依次参与', 'Every box takes part, bottom → top'], ['每块加工完交给上一块，最后打分', 'Each box hands up; the top scores'], ['参数还是随机的，所以猜得很平均', 'Random parameters, so the guess is flat']],
  TR4: [['用一个数说清猜错了多少', 'One number says how wrong it was'], ['模型给的概率 + 正确答案「蓝」', 'The model’s odds + the right answer 蓝'], ['只看「蓝」：−ln({pb})≈{lo}', 'Only 蓝 counts: −ln({pb}) ≈ {lo}'], ['交叉熵＝最大似然，标准统一', 'Cross-entropy = max likelihood, one rule']],
  TR5: [['算出每个参数该改多少', 'Works out each parameter’s change'], ['误差从顶部出发，经过每一块', 'The error starts at the top, through every box'], ['上一块的改动量决定下一块的', 'Each box’s change sets the next one down'], ['链式法则：倒推一遍就算出全部', 'Chain rule: one pass back gets them all']],
  TR6: [['把参数往误差变小的方向挪', 'Moves parameters to shrink the error'], ['梯度 × 学习率 ＝ 这一步改多少', 'Gradient × rate = this step’s change'], ['前向→算误差→传回→改，循环', 'Forward → error → back → update, loop'], ['每次一小步，{n} 步后就学会', 'Small steps; learned after {n}']],
  US1: [['交给模型接着往下写的起点', 'Where the model starts writing from'], ['一段字：天空是什么颜色？', 'Text: 天空是什么颜色？'], ['从最底下进入，一路往上走', 'Enters at the bottom, goes up'], ['模型只做一件事：猜下一个字', 'It only guesses the next char']],
  US2: [['把字切开，换成字典编号', 'Splits text into dictionary numbers'], ['字典 + 切分规则（大模型用BPE）', 'Dictionary + split rule (BPE in big models)'], ['编号拿去「词向量表」里查', 'The numbers look up the embedding table'], ['和训练时同一本字典，前后一致', 'Same dictionary as in training']],
  US3: [['用一串数字表示一个字的意思', 'A row of numbers for a char’s meaning'], ['词向量表：每个编号一行数字', 'Embedding table: one row per number'], ['按编号查表，每个字取一行', 'Look up by number, one row per char'], ['意思相近的字，学出来也相近', 'Similar chars learn similar rows']],
  US4: [['告诉模型每个字排第几', 'Tells the model each char’s place'], ['位置向量：每个位置一串数字', 'Position vectors: a row per place'], ['词向量和位置向量逐个相加', 'Char row + position row, number by number'], ['注意力本身不分先后，要补顺序', 'Attention ignores order; add it']],
  US5: NODE_INFO.att,
  US6: [['把拿到的信息逐字再加工一遍', 'Refines what each char gathered'], ['放大层、激活函数、缩回层', 'Expand, activation, shrink'], ['注意力管交流，前馈管消化', 'Attention talks, feed-forward digests'], ['只有加权平均不够，要非线性', 'Weighted averages are not enough']],
  US7: [['再深加工一遍，理解得更深', 'Another pass, deeper reading'], ['同样的结构，参数不同', 'Same structure, other parameters'], ['残差带着原信息，每块只加改进', 'The residual carries the input; boxes add'], ['层多了信息不丢，训练也稳', 'Deep stacks lose nothing, train stably']],
  US8: [['给字典里每个字打分、变概率', 'Scores every char, makes odds'], ['线性层（打分）+ Softmax', 'Linear (scores) + Softmax'], ['只用最后一个字「？」来打分', 'Only the last char ？ is scored'], ['分数换成加起来 100% 的概率', 'Scores become odds summing to 100%']],
  US9: [['选出下一个字「蓝」', 'Picks the next char 蓝'], ['概率表 + 选字规则（温度等）', 'The odds + a pick rule (temperature…)'], ['把「蓝」接到末尾，再猜下一个', 'Append 蓝, guess the next'], ['一次一个字，循环写成整段', 'One char at a time, looped into text']],
  MY1: [['写你想让模型学的题和答案', 'Write what you want it to learn'], ['问题 + 答案，若干道', 'Questions + answers, a few lines'], ['开始训练时自动建字典', 'The dictionary is built when training starts'], ['亲手训练一次，最容易弄懂', 'Training one yourself makes it click']],
  MY2: [['在你手机里真的训练模型', 'Really trains a model on your phone'], ['前向、算误差、传回去、改参数', 'Forward, error, back, update'], ['亮蓝＝往上算，橙色＝往回传', 'Blue = going up, orange = going back'], ['误差往下掉，就是它在学会', 'A falling error means it is learning']],
  MY3: [['检验模型到底学会了没有', 'Checks whether it really learned'], ['你训练出的参数 + 你的问题', 'Your trained parameters + your question'], ['只往上走一遍，不再改参数', 'One pass up, no more updates'], ['它只背下你给的几句，没见过的字会自信地瞎猜', 'It only memorised your lines; unseen chars get a confident guess']],
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

const pb0 = (d: Demo | null) => (d ? d.before.probs[7 * d.chars.length + d.chars.indexOf('蓝')]! : 0);
const fill = (s: string, d: Demo | null) => s.replace('{V}', String(d?.chars.length ?? 14)).replace('{lr}', d ? String(+d.lr.toFixed(4)) : '0.004').replace('{n}', String(d?.steps ?? 200)).replace(/\{T\}/g, '8')
  .replace('{pb}', d ? pc(pb0(d)) : '…').replace('{lo}', d ? (-Math.log(pb0(d))).toFixed(1) : '…');
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
  id, kind, crumb: [[tx(UI.lv[3]!, c.l), '#L4']], top: '', mode: 'left', st: all('pass'), back: false, resOn: false, frameLit: false, frameTag: null, sel: null, flow: null,
  info: inf(PI[id] ?? PI.L4!, c), k: PK[id] ?? 'K01', math: null, hint: tx(UI.hint0, c.l), dots: null, panel: null, tags: [], notes: null, ent: false, next: '#L4', up: null,
});
const wait = (c: Ctx) => `<p class="l4-wait">${tx(UI.load, c.l)}</p>`;

function page0(id: string, c: Ctx): Page {
  const l = c.l, T = (k: keyof typeof UI) => tx(UI[k] as Tx, l), d = c.d;
  if (id === 'L4') { const p = base(c, 'L4', 'l4'); p.mode = 'full'; p.st = all('calm'); p.crumb = [[T('home'), '#home'], [T('L4'), null], [T('whole'), null]]; p.hint = T('hint0'); p.ent = true; p.next = '#L4/tr/1'; return p; }
  if (id.startsWith('X:')) return xpage(id.slice(2), c);
  const kind = id.slice(0, 2).toLowerCase() as 'tr' | 'us' | 'my', n = Number(id.slice(2)), p = base(c, id, kind);
  const ix = ORDER.indexOf(id); p.next = ix >= 0 && ix < ORDER.length - 1 ? hashOf(ORDER[ix + 1]!) : '#L4';
  const steps = STEPN[kind]; p.dots = [steps.length, n - 1];
  p.crumb = [[tx(UI.lv[3]!, l), '#L4'], [tx(kind === 'tr' ? UI.trN : kind === 'us' ? UI.usN : UI.myN, l), null], [tx(steps[n - 1]!, l), null]];
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
        + `<p class="l4-f">${tx(['「蓝」这一格：', 'The 蓝 cell: '], l)}−ln(${pb.toFixed(4)}) = <b class="l4-o">${(-Math.log(pb)).toFixed(2)}</b></p>`
        + `<p class="l4-f">${tx(['第 1 题的误差 = ', 'Line 1’s error = '], l)}<b class="l4-o">${tr.loss!.toFixed(2)}</b></p>` + sub(tx(['第 1 题要猜两格：「蓝」和「结束」，误差取两格的平均。概率越接近 100%，误差越接近 0。', 'Line 1 has two cells to guess, 蓝 and END; its error is their average. Closer to 100% means closer to 0.'], l)); }
    if (n === 5) { p.st = all('back'); p.back = true; p.flow = { a: 'in', b: 'out', back: true }; p.panel = null; p.resOn = false;
      const nb = d.nb0, tag = (x: number) => `${tx(['该改多少', 'change'], l)} <b>${x.toFixed(2)}</b>`;
      p.tags = ([['lin', nb.lin], ['an2', nb.an2], ['ffn', nb.ffn], ['an1', nb.an1], ['att', nb.att], ['emb', nb.emb]] as [Nd, number][]).map(([nd, v]) => ({ nd, h: tag(v) }));
      p.notes = [tx([`误差 ${tr.loss!.toFixed(2)} 从顶上出发，往回传 ↓`, `Error ${tr.loss!.toFixed(2)} starts at the top, flows back ↓`], l), tx([`第 1 步：所有参数的梯度大小 ${d.gn0.toFixed(2)}（真实数字）`, `Step 1: gradient size of all parameters ${d.gn0.toFixed(2)} (real)`], l)]; }
    if (n === 6) { const a = d.after; p.flow = { a: 'in', b: 'out' };
      p.panel = h(tx([`误差曲线（${d.steps} 步）`, `Error curve (${d.steps} steps)`], l)) + EX(l) + curve(d.losses) + `<p class="l4-f">${tx(['3 题平均误差<br>', '3-line avg: '], l)}${d.losses[0]!.toFixed(2)} → <b>${d.losses[d.losses.length - 1]!.toFixed(3)}</b></p>`
        + `<p class="l4-f">p(蓝) ${pc(tr.probs[qi * V + blue]!)} → <b class="l4-gold">${pc(a.probs[qi * V + blue]!)}</b></p><p class="l4-fm">${tx(['新 = 旧 − 学习率 × 该改多少', 'new = old − rate·change'], l)}</p>` + sub(tx([`共 ${d.n.toLocaleString()} 个参数，每步一起改一点。`, `${d.n.toLocaleString()} params, every step.`], l))
        + `<p class="l4-sub l4-yel">${tx([`口径不同：这里是 3 道题一起平均；上一步「算误差」的 ${tr.loss!.toFixed(2)} 只算第 1 题。`, `(“The error” ${tr.loss!.toFixed(2)}: line 1 only)`], l)}</p>`; }
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
      + `<p class="l4-ok" data-my="fix"${m.fix ? '' : ' hidden'}>${esc(m.fix ?? '')}</p>`
      + `<div class="l4-row l4-my1"><button type="button" class="l4-b" data-act="my-arrow">${tx(['插入 →', 'Insert →'], l)}</button><span class="l4-mute">${tx(['格式：问题→答案', 'Format: question→answer'], l)}</span></div>`
      + `<button type="button" class="l4-b l4-exb" data-act="my-ex">${tx(['＋ 加一行例子', '＋ Add example'], l)}</button>`
      + `<div class="l4-row"><button type="button" class="l4-b" data-act="my-add">${tx(['添加一题', 'Add a line'], l)}</button><button type="button" class="l4-b gold" data-act="my-train">${tx(['开始训练', 'Train'], l)}</button></div>` + (m.err ? `<p class="l4-err">${esc(m.err)}<br>${tx(['正确示例：天空是什么颜色？→蓝', 'Correct example: 天空是什么颜色？→蓝'], l)}</p>` : '') + sub(tx(['1–8 题，每题 24 字以内。', '1–8 lines, up to 24 chars each.'], l)); }
  if (n === 2) { const g = m.prog; p.flow = g && !g.done ? { a: 'in', b: 'out', back: g.step % 2 === 1 } : null;
    p.st = g && !g.done ? all(g.step % 2 ? 'back' : 'lit') : all('pass'); p.back = !!(g && !g.done && g.step % 2);
    p.panel = !g ? h(tx(['还没开始训练', 'Not trained yet'], l)) + `<div class="l4-row"><button type="button" class="l4-b gold" data-go="#L4/my/1">${tx(['去写题', 'Write lines'], l)}</button></div>`
      : h(tx([`第 ${g.step} / ${g.total} 步`, `Step ${g.step} / ${g.total}`], l)) + EX(l) + `<div class="l4-pbar"><i style="width:${Math.round((g.step / g.total) * 100)}%"></i></div>` + curve(g.losses) + `<p class="l4-f">${tx(['误差', 'error'], l)} ${g.losses[0]!.toFixed(2)} → <b class="l4-o">${g.loss.toFixed(3)}</b></p>`
        + `<div class="l4-row">${g.done ? `<button type="button" class="l4-b gold" data-go="#L4/my/3">${tx(['去测一测 ›', 'Test it ›'], l)}</button>` : `<button type="button" class="l4-b" data-act="${m.paused ? 'my-resume' : 'my-pause'}">${m.paused ? tx(['继续', 'Resume'], l) : tx(['暂停', 'Pause'], l)}</button>`}</div>`; }
  if (n === 3) { p.st = m.ans ? { ...all('pass'), in: 'lit', out: 'lit' } : litUpto('in'); p.next = '#L4';
    const a = m.ans;
    p.panel = h(tx(['问它一个问题', 'Ask it'], l)) + `<input class="l4-in" data-my="q" value="${esc(m.q)}" aria-label="${tx(['问题', 'Question'], l)}"><div class="l4-row"><button type="button" class="l4-b gold" data-act="my-test">${tx(['测一测', 'Ask'], l)}</button></div>`
      + (!m.ready ? sub(tx(['先训练一个模型（第①步）。', 'Train a model first (step ①).'], l)) : '')
      + (a ? `<p class="l4-big">${tx(['回答', 'Answer'], l)}：<b class="l4-gold">${esc(a.out) || '—'}</b></p>` + bars(a.steps[0]!.top.slice(0, 3).map(([i, q]) => [chn(a.chars[i]!, l), q] as [string, number]), l, 0) + (a.unknown.length ? unseen(a, m.lines.filter((x) => x.trim()).length, l) : '') : ''); }
  return p;
}
/** the panel opens with the step's title, as in the reference; a first heading that carries a real number stays below it */
export function page(id: string, c: Ctx): Page {
  const p = page0(id, c); if (p.kind !== 'tr' && p.kind !== 'us' && p.kind !== 'my') return p;
  const ph = PH[p.kind][Number(id.slice(2)) - 1]; const m0 = p.panel ? /^<h4 class="l4-ph">(.*?)<\/h4>/.exec(p.panel) : null;
  if (ph && m0) p.panel = h(tx(ph, c.l)) + (/\d/.test(m0[1]!) ? `<p class="l4-stp">${m0[1]}</p>` : '') + p.panel!.slice(m0[0].length);
  return p;
}
const PH: Record<'tr' | 'us' | 'my', Tx[]> = {
  tr: [['① 准备例题', '① Examples'], ['② 建字典、分词', '② Dictionary, tokens'], ['③ 先随机猜一次', '③ A first random guess'], ['④ 算误差', '④ The error'], ['⑤ 把误差传回去', '⑤ Pass the error back'], ['⑥ 改参数、重复很多遍', '⑥ Update, repeat many times']],
  us: [['① 输入一段字', '① Some text in'], ['② 分词', '② Tokenize'], ['③ 查词向量表', '③ Embedding lookup'], ['④ 加位置编码', '④ Add position'], ['⑤ 注意力：向前要信息', '⑤ Attention: ask earlier chars'], ['⑥ 前馈网络：各自加工', '⑥ Feed-forward: each alone'], ['⑦ 第二个解码块', '⑦ The second block'], ['⑧ 线性层 + Softmax', '⑧ Linear + Softmax'], ['⑨ 选出下一个字，接回输入', '⑨ Pick a char, append it']],
  my: [['① 写自己的训练题', '① Write your own lines'], ['② 训练中', '② Training'], ['③ 自己测一测', '③ Test it yourself']],
};

function xpage(path: string, c: Ctx): Page {
  const l = c.l, nd = path.split('.')[0] as Nd, p = base(c, 'X:' + path, 'x'); p.mode = 'xl'; p.sel = nd; p.st = { ...all('pass'), [nd]: 'sel' };
  p.info = inf(XI[path] ?? NODE_INFO[nd], c); p.k = XK[path] ?? NODE_K[nd]; p.math = XM[path] ?? null; p.hint = tx(UI.hintX, l);
  const xi = X_ORDER.indexOf(path); p.dots = xi >= 0 ? [X_ORDER.length, xi] : null; p.next = xi >= 0 && xi < X_ORDER.length - 1 ? xHash(X_ORDER[xi + 1]!) : '#L4';
  const segs = path.split('.'); p.crumb = [[tx(UI.lv[3]!, l), '#L4']]; if (['att', 'an1', 'ffn', 'an2'].includes(nd)) p.crumb.push([tx(['解码块', 'Decoder block'], l), null]);
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
      p.panel = H(tx(['点积：两两打分', 'Dot: score pairs'], l)) + `<div class="l4-pipe">${(['Q', 'K', 'V', ['点积', 'Dot'], ['遮罩', 'Mask'], ['百分比', '%'], ['混合', 'Mix'], ['拼接', 'Join']] as (string | Tx)[]).map((t, i) => `<span${i === 3 ? ' class="on"' : ''}>${typeof t === 'string' ? t : tx(t, l)}</span>`).join('')}</div>` + sub(tx([`第 1 块头 ${hh + 1} 里：行＝提问的字，列＝被问的字`, `Block 1, head ${hh + 1}: rows ask, columns are asked`], l)) + g + sub(tx([`蓝＝正分，橙＝负分，右上灰色＝遮罩挡住的。黄框：「？」问「${esc(ch[tr.ids[kj]!]!)}」= <b>${f2(S[qi * T + kj]!)}</b>`, `Blue +, orange −, grey top-right = masked. Gold: ？ asks ${esc(ch[tr.ids[kj]!]!)} = <b>${f2(S[qi * T + kj]!)}</b>`], l)); p.hint = tx(UI.hintX2, l); break; }
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

/** R42: half-width input fixed while typing — ? → ？ and ->, =>, : → → (a colon only when the line has no arrow yet) */
export function fixLine(line: string): string {
  let t = line.replace(/\?/g, '？').replace(/-+>|=+>/g, '→');
  if (!t.includes('→')) t = t.replace(/[:：]/, '→');
  return t;
}
export function fixLines(text: string): { text: string; fixed: number[] } {
  const out: number[] = []; const ls = text.split('\n').map((x, i) => { const y = fixLine(x); if (y !== x) out.push(i + 1); return y; });
  return { text: ls.join('\n'), fixed: out };
}
/** R42: MY3's honest warning when the question has characters the model never saw — built from the real answer */
function unseen(a: Ans, n: number, l: L): string {
  const t = a.steps[0]?.top[0]; const ch = t ? a.chars[t[0]]! : ''; const p = t ? pc(t[1]) : '';
  const u = a.unknown.map((x) => `「${esc(x)}」`).join('');
  const lead = t && t[0] === 0 ? tx([`它干脆选了「结束」（${p}），等于没答出来。`, `It simply picked END (${p}): no answer at all. `], l)
    : tx([`最高的「${esc(ch)}」${p}看着很笃定，其实是蒙的。`, `The top pick “${esc(ch)}” at ${p} looks sure, but it is a guess. `], l);
  return `<div class="l4-warn"><b>${tx([`⚠ ${u}它没学过，上面是在瞎猜`, `⚠ It never saw ${u}: the above is a guess`], l)}</b><br>${lead}${tx([`只背了 ${n} 句的模型就是这样；大模型要海量数据，正是为此。`, `A model that memorised ${n} lines does this; big models need mass data for exactly this reason.`], l)}`
    + `<div class="l4-row"><button type="button" class="l4-b" data-go="#L4/my/3~KC05">${tx(['规模定律 ›', 'Scaling laws ›'], l)}</button><button type="button" class="l4-b" data-go="#L4/my/3~KC12">${tx(['幻觉 ›', 'Hallucination ›'], l)}</button></div></div>`;
}
