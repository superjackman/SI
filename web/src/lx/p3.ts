/* R39: layer 3 — how a large language model is trained once and then used for every question. Texts follow the
   reference pages; the percentages there are marked 示例数字 (example numbers). The demo size on 「模型参数」 is the
   real layer-4 model (CFG, the three demo lines): 14 chars with END, d = 16, 2 layers, 7406 numbers. */
import type { L, Tx } from '../l4/txt';
import type { Dia, DEdge, DFrame, DLabel, DNode, St, View } from './geo';
import { lxNext } from './ids';
import type { LxPg } from './types';

export const TRN = ['t1', 't2', 't3', 't4', 't5'] as const, USN = ['u1', 'u2', 'u3', 'u4', 'u5'] as const;
type B = (typeof TRN)[number] | 'par' | (typeof USN)[number];
const ALL: B[] = [...TRN, 'par', ...USN];
const PL = new Set<string>(['t2', 't3', 't4', 't5', 'par', 'u2', 'u3', 'u4']);
/** box labels: [full, short] — the short one is used only when the full one does not fit at 12 px */
const LAB: Record<B, [Tx, Tx]> = {
  t1: [['海量文字', 'Mass text'], ['海量文字', 'Mass text']],
  t2: [['生成分词字典', 'Build the token dictionary'], ['生成分词字典', 'Dictionary']],
  t3: [['预训练：猜下一个字', 'Pre-training: guess the next char'], ['预训练：猜字', 'Pre-training']],
  t4: [['微调：学会回答', 'Fine-tuning: learn to answer'], ['微调：学回答', 'Fine-tuning']],
  t5: [['对齐：更有用更安全', 'Alignment: more helpful, safer'], ['对齐：更有用', 'Alignment']],
  par: [['模型参数＝一大堆数字', 'Parameters = a huge pile of numbers'], ['模型参数', 'Parameters']],
  u1: [['你的文字进来', 'Your text comes in'], ['你的文字进来', 'Your text in']],
  u2: [['分词（同一本字典）', 'Tokenize (same dictionary)'], ['分词（同字典）', 'Tokenize']],
  u3: [['Transformer 计算', 'Transformer computes'], ['Transformer', 'Transformer']],
  u4: [['得到下一个字', 'Get the next char'], ['得到下一个字', 'Next char']],
  u5: [['接到末尾，再来一轮', 'Append it, go round again'], ['接到末尾', 'Append, again']],
};
const SUB: Record<'par' | 'u3', [string, Tx, Tx][]> = {
  par: [['p1', ['词向量表（字典×d）', 'Embeddings (dict × d)'], ['词向量表', 'Embeddings']], ['p2', ['各层权重 × N 层', 'Layer weights × N'], ['各层权重', 'Layer weights']], ['p3', ['输出表（d×字典）', 'Output (d × dict)'], ['输出表', 'Output table']]],
  u3: [['x1', ['查词向量 ⊕ 位置', 'Embed ⊕ position'], ['词向量 ⊕ 位置', 'Embed ⊕ pos.']], ['x2', ['解码块 × N 层', 'Decoder × N'], ['解码块 × N', 'Decoder × N']], ['x3', ['线性层 + Softmax', 'Linear + Softmax'], ['线性 + Softmax', 'Lin. + Softmax']]],
};
const FR: Record<'t' | 'u', Tx> = { t: ['训练：只做一次，很贵', 'Training: done once, costly'], u: ['使用：每次提问都走一遍', 'Use: runs for every question'] };
const FRS: Record<'t' | 'u', Tx> = { t: ['训练：只做一次，很贵', 'Training: once, costly'], u: ['使用：每次提问都走一遍', 'Use: every question'] };
type M3 = 'full' | 'left' | 'cmp';
const LAY: Record<M3, { x1: number; x2: number; y0: number; bh: number; g: number; hdr: number; mid: number }> = {
  full: { x1: 64, x2: 296, y0: 68, bh: 21, g: 4, hdr: 21, mid: 4 },
  left: { x1: 24, x2: 164, y0: 68, bh: 21, g: 6, hdr: 23, mid: 12 },
  cmp: { x1: 24, x2: 164, y0: 66, bh: 18, g: 4, hdr: 22, mid: 8 },
};
/** the layer-3 diagram (training frame → parameters → use frame), optionally with one box opened in place */
export function dia3(mode: M3, exp?: 'par' | 'u3'): Dia {
  const L = LAY[mode], { x1, x2, bh, g } = L, cx = (x1 + x2) / 2, pos: Record<string, [number, number]> = {}, fr: Record<string, [number, number]> = {};
  const nodes: DNode[] = [], edges: DEdge[] = [], frames: DFrame[] = [], labels: DLabel[] = [];
  let y = L.y0;
  const put = (n: B) => { const h = n === exp ? bh + SUB[exp].length * (bh + 3) + 6 : bh; pos[n] = [y, y + h]; y += h + g; };
  fr.t = [y, 0]; y += L.hdr; for (const n of TRN) put(n); fr.t[1] = y - g + 5; y += L.mid + 5;
  put('par'); y += L.mid - g;
  fr.u = [y, 0]; y += L.hdr; for (const n of USN) put(n); fr.u[1] = y - g + 5; const end = y - g + 5;
  for (const k of ['t', 'u'] as const) frames.push({ id: k, x: x1 - 14, y: fr[k]![0], w: x2 - x1 + 28, h: fr[k]![1] - fr[k]![0], t: FR[k], ts: FRS[k], tl: mode === 'full' ? true : 2 });
  for (const n of ALL) {
    const [y0, y1] = pos[n]!, [t, s2] = LAB[n], o = n === exp, ts: Tx = s2; /* the short label only when the full one does not fit even at 12 px with tighter letters */
    nodes.push({ id: n, x: x1, y: y0, w: x2 - x1, h: o ? bh : y1 - y0, t, ts, plus: PL.has(n), ...(o ? { minus: true } : {}) });
    if (o) {
      frames.push({ id: 'xf', x: x1 - 3, y: y0 - 3, w: x2 - x1 + 6, h: y1 - y0 + 3, t: ['', ''] });
      SUB[exp].forEach(([id, st, ss], i) => nodes.push({ id, x: x1 + 8, y: y0 + bh + 3 + i * (bh + 3), w: x2 - x1 - 16, h: bh, t: st, ts: ss }));
    }
  }
  for (const seq of [[...TRN, 'par'], [...USN]] as B[][]) for (let i = 0; i + 1 < seq.length; i++) {
    const a = seq[i]!, b = seq[i + 1]!; edges.push({ id: 'e-' + a, d: `M${cx} ${pos[a]![1]} V${pos[b]![0]}` });
  }
  const xR = x2 + 9, ya = exp === 'par' ? pos.par![0] + bh / 2 : (pos.par![0] + pos.par![1]) / 2, yb = (exp === 'u3' ? pos.u3![0] + bh / 2 : (pos.u3![0] + pos.u3![1]) / 2);
  edges.push({ id: 'rd', d: `M${x2} ${ya} H${xR - 6} Q${xR} ${ya} ${xR} ${ya + 6} V${yb - 6} Q${xR} ${yb} ${xR - 6} ${yb} H${x2 + 1}`, gold: true, dash: true });
  labels.push({ x: xR + 8, y: (ya + yb) / 2, t: ['读参数', 'reads'], v: true, e: 'rd' });
  const xL = x1 - 7, la = (pos.u5![0] + pos.u5![1]) / 2, lb = (pos.u1![0] + pos.u1![1]) / 2;
  edges.push({ id: 'lp', d: `M${x1} ${la} H${xL + 5} Q${xL} ${la} ${xL} ${la - 5} V${lb + 5} Q${xL} ${lb} ${xL + 5} ${lb} H${x1 - 1}` });
  return { x0: mode === 'full' ? 0 : 4, y0: L.y0 - 2, x1: mode === 'full' ? 360 : xR + 16, y1: end + 2, nodes, edges, frames, labels };
}
/** states like the reference: earlier steps 'pass', the current one lit, the rest dim */
function lit(n: B): Record<string, St> {
  const seq: B[] = (TRN as readonly B[]).includes(n) || n === 'par' ? [...TRN, 'par'] : [...USN], d: Record<string, St> = {}, i = seq.indexOf(n);
  for (const x of ALL) d[x] = 'dim';
  seq.forEach((x, j) => { d[x] = j < i ? 'pass' : j === i ? 'lit' : 'dim'; });
  return d;
}
/** the parameters box is gold when it is calm or passed (reference) */
const gold = (s: Record<string, St>) => { if (!s.par || s.par === 'calm' || s.par === 'pass') s.par = 'gold'; return s; };
function view(dia: Dia, st: Record<string, St>, o: { flow?: B[]; read?: boolean; loop?: boolean; fr?: 't' | 'u'; conn?: string } = {}): View {
  const est: Record<string, St> = {}, f = o.flow ?? [], fl: string[] = [];
  for (const e of dia.edges) if (e.id.startsWith('e-')) {
    const a = e.id.slice(2) as B, seq: B[] = [...TRN, 'par', ...USN], b = seq[seq.indexOf(a) + 1]!;
    if (f.includes(a) && f.includes(b)) { est[e.id] = 'lit'; fl.push(e.id); }
  }
  est.rd = o.read ? 'lit' : 'pass'; est.lp = o.loop ? 'lit' : 'pass'; if (o.loop) fl.push('lp'); if (o.read) fl.push('rd');
  const s = gold({ ...st }); s.t = o.fr === 't' ? 'lit' : 'calm'; s.u = o.fr === 'u' ? 'lit' : 'calm';
  return { dia, st: s, def: 'calm', est, edef: 'calm', flow: fl, ...(o.conn ? { conn: o.conn } : {}) };
}

export function page(id: string, l: L): LxPg {
  const z = (a: string, b: string) => (l === 'zh' ? a : b), EX = `<span class="l4-ex">${z('示例数字', 'example')}</span>`;
  const pill = (t: string, go: string, c = '') => `<button type="button" class="lx-pl${c}" data-go="${go}">${t}</button>`, L4 = pill(z('进入第4层 ›', 'Go to layer 4 ›'), '#L4', ' gold');
  const lk = (t: string, go: string) => `<button type="button" class="lk" data-go="${go}">${t}</button>`;
  const bars = (a: [string, number][]) => `<div class="bars">${a.map(([k, v]) => `<b>${k}</b><span><i style="width:${v}%"></i></span><em>${v}%</em>`).join('')}</div>`;
  const ib = (h: string) => `<div class="ib">${h}</div>`, sub = (h: string) => `<div class="sub">${h}</div>`, dv = (h: string) => `<div>${h}</div>`, hl = (h: string) => `<span class="hl">${h}</span>`;
  const chips = (out = '？', extra = '') => `<div class="lx-cps">${Array.from('天空是什么颜色？').map((c) => `<span class="c on">${c}</span>`).join('')}${extra}<i>→</i><span class="c out">${out}</span></div>`;
  const TT = `<b class="lx-tt">${z('训练例句：天空是蓝色的。', 'Training sentence: 天空是蓝色的。 (The sky is blue.)')}</b>`;
  const tr = /^T\d$/.test(id), us = /^U\d$/.test(id);
  const L3c: [string, string | null] = [z('第3层 大模型原理', 'Layer 3 How an LLM works'), '#L3'];
  const crumb: [string, string | null][] = id === 'L3' ? [[z('首页', 'Home'), '#home'], [L3c[0], null]]
    : tr ? [L3c, [z('看它怎么训练', 'Training'), id === 'T1' ? null : '#L3/T1']] : us ? [L3c, [z('看它怎么使用', 'Use'), id === 'U1' ? null : '#L3/U1']] : [L3c];
  const p: LxPg = { id, mode: 'left', v: null, top: TT, crumb, ttl: '', info: ['', '', '', ''], k: 'KC01', math: null, hint: z('点带 + 的块可就地展开', 'Tap a box with + to open it here'),
    dots: null, next: lxNext(id), panel: '', xl: true, px: 194, go: {} };
  const set = (name: string, v: View, k: string, info: [string, string, string, string], panel: string, dots: [number, number] | null) => {
    p.v = v; p.k = k; p.info = info; p.panel = panel; p.dots = dots; p.ttl = name; p.crumb.push([name, null]);
  };
  const Lf = dia3('left');
  p.go = { t: '#L3/T1', u: '#L3/U1', t1: '#L3/T1', t2: '#L3/T2', t3: '#L3/T3', t4: '#L3/T4', t5: '#L3/T5', par: '#L3/P', u1: '#L3/U1', u2: '#L3/U2', u3: '#L3/X', u4: '#L3/U4', u5: '#L3/U5' };
  const TOPU = chips();
  switch (id) {
    case 'L3': p.mode = 'full'; p.xl = false; p.top = `<b class="lx-tt">${z('大模型：先训练，再使用', 'The LLM: train first, then use')}</b>`; p.math = '';
      p.ent = [[z('看它怎么训练', 'How it trains'), '#L3/T1'], [z('看它怎么使用', 'How it is used'), '#L3/U1'], [z('进入第4层 ›', 'Layer 4 ›'), '#L4', true]];
      set(z('全貌', 'Overview'), { ...view(dia3('full'), {}), np: true }, 'KC01', [z('读一段字，接着写出下一个字', 'Reads text, writes the next char'), z('训练五步 → 模型参数 → 使用五步', 'Five training steps → parameters → five use steps'), z('训练造出参数，使用时读参数来算', 'Training makes the parameters; use reads them to compute'), z('先用海量文字学，再教它答问题', 'Learn from mass text first, then learn to answer')], '', [5, -1]); break;
    case 'T1':
      set(z('①海量文字', '① Mass text'), view(Lf, lit('t1'), { fr: 't', conn: 't1' }), 'KC02', [z('给模型准备学习材料', 'Prepares what the model learns from'), z('网页、书、百科、代码等 + 清洗', 'Web, books, encyclopaedias, code… + cleaning'), z('收集 → 去重 → 过滤 → 定配比', 'Collect → de-duplicate → filter → set the mix'), z('模型学到的就是数据里的规律', 'The model learns the patterns in the data')],
        `<h4>${z('① 海量文字', '① Mass text')}</h4>${sub(z('来源：网页、书、百科、论文、代码、对话…', 'Sources: web pages, books, encyclopaedias, papers, code, dialogue…'))}${dv(z('先清洗：', 'Clean it first:'))}`
        + ib(`<div><span class="hl">${z('保留', 'Keep')}</span> 天空是蓝色的。</div><div><span class="or">${z('重复', 'Repeat')}</span> <span class="sub">天空是蓝色的。</span></div><div><span class="or">${z('广告', 'Ad')}</span> <span class="sub">点击领红包!!!</span></div>`) + EX
        + dv(z('还要过滤乱码、有害内容和个人隐私。', 'Also filter out garbled text, harmful content and private data.')) + `<div class="hl">${z('GPT-3 训练时用了约 3000 亿个 token。', 'GPT-3 was trained on about 300 billion tokens.')}</div>` + sub(z('量大、种类多、质量好，学到的规律才可靠。', 'Large, varied and clean: only then are the patterns reliable.')), [5, 0]); break;
    case 'T2':
      set(z('②生成分词字典', '② Build the dictionary'), view(Lf, lit('t2'), { fr: 't', flow: ['t1', 't2'], conn: 't2' }), 'KC03', [z('定下「文字↔编号」对照表', 'Fixes a “text ↔ number” table'), z('字典 + 合并规则 + 特殊符号', 'Dictionary + merge rules + special symbols'), z('常挨着的片段合并，逐步扩充', 'Pieces often side by side merge; it grows'), z('字典不会太大，句子也不会太长', 'Neither the dictionary nor sentences get too long')],
        `<h4>${z('② 生成分词字典', '② Build the token dictionary')}</h4>${sub(z('常用算法 BPE：', 'Common algorithm, BPE:'))}${dv(z('1. 先拆成单个字', '1. Split into single chars'))}${dv(z('2. 哪两块最常挨着，就合成一块加进字典', '2. The two pieces most often side by side merge into one, added to the dictionary'))}${dv(z('3. 重复，直到字典够大', '3. Repeat until it is big enough'))}`
        + `<div class="ib mono">天空是蓝色的<br>→ 天空|是|蓝色|的<br>→ 812 15 3301 9</div>${EX}${dv(z('GPT-2 的字典约 5 万个。', 'GPT-2’s dictionary has about 50 thousand.'))}${sub(z('训练和使用必须用同一本字典。', 'Training and use must share one dictionary.'))}${dv(lk(z('细节见第4层 ›', 'Details in layer 4 ›'), '#L4/tr/2'))}`, [5, 1]); break;
    case 'T3':
      set(z('③预训练：猜下一个字', '③ Pre-training'), view(Lf, { ...lit('t3'), par: 'lit' }, { fr: 't', conn: 't3' }), 'KC04', [z('在海量文字里练「猜下一个字」', 'Practise “guess the next char” on mass text'), z('文字 + Transformer + 误差 + 改参数', 'Text + Transformer + error + parameter changes'), z('猜→算误差→传回去改，重复', 'Guess → error → send it back, change; repeat'), z('答案在原文里，不用人工标注', 'The answer is in the text; no labels needed')],
        `<h4>${z('③ 预训练', '③ Pre-training')}</h4>${dv(z('遮住下一个字让它猜：', 'Hide the next char and let it guess:'))}${ib(`天空是 → ${hl('？')}`)}${sub(z('刚开始（参数随机）：', 'At first (random parameters):'))}${bars([['蓝', 3], ['红', 2]])}${sub(z('练了很多遍以后：', 'After much practice:'))}${bars([['蓝', 70], ['红', 4]])}${EX}`
        + dv(z(`答案就是原文的下一个字，${hl('不用人来标注')}。`, `The answer is the text’s own next char: ${hl('no human labels')}.`)) + dv(z('猜错 → 算误差 → 改参数，在海量文字上重复。', 'Wrong guess → error → change the parameters, repeated over mass text.')) + dv(lk(z('每一步细节见第4层 ›', 'Each step in layer 4 ›'), '#L4/tr/3')), [5, 2]); break;
    case 'T4':
      set(z('④微调：学会回答', '④ Fine-tuning'), view(Lf, { ...lit('t4'), par: 'lit' }, { fr: 't', conn: 't4' }), 'KC06', [z('让模型学会听指令、好好回答', 'Teaches it to follow instructions and answer well'), z('预训练参数 + 人写的问答样例', 'Pre-trained parameters + human-written Q&A examples'), z('用样例继续训练，参数小幅调整', 'Train on the examples; small parameter changes'), z('知识已有，只需教它怎么回答', 'The knowledge is there; it only learns to answer')],
        `<h4>${z('④ 微调（SFT）', '④ Fine-tuning (SFT)')}</h4>${sub(z('只预训练的模型只会「续写」：', 'A pre-trained-only model just “continues”:'))}${ib(`天空是什么颜色？<br><span class="or">草是什么颜色？…</span>`)}${EX}${dv(z('用人写的问答样例再训练：', 'Train again on human-written Q&amp;A examples:'))}`
        + ib(z(`用户：天空是什么颜色？<br>助手：${hl('通常是蓝色。')}`, `User: 天空是什么颜色？<br>Assistant: ${hl('通常是蓝色。')} (usually blue)`)) + dv(z('方法还是猜下一个字，通常只算「回答」部分的误差。', 'Still “guess the next char”, usually counting the error on the answer only.')) + sub(z('样例比预训练少得多。', 'Far fewer examples than in pre-training.')), [5, 3]); break;
    case 'T5':
      set(z('⑤对齐：更有用更安全', '⑤ Alignment'), view(Lf, { ...lit('t5'), par: 'lit' }, { fr: 't', flow: ['t5', 'par'], conn: 't5' }), 'KC07', [z('让回答更有用、诚实、无害', 'More helpful, honest and harmless answers'), z('人的排序 + 打分模型 + 强化学习', 'Human rankings + a scoring model + RL'), z('人比较→学打分→朝高分改', 'People compare → learn to score → aim high'), z('比较两个回答，比写标准答案容易', 'Comparing is easier than writing the answer')],
        `<h4>${z('⑤ 对齐（RLHF）', '⑤ Alignment (RLHF)')}</h4>${dv(z('同一个问题，两个回答：', 'One question, two answers:'))}${ib(z('A：蓝色，阳光里的蓝光被空气散射得多。<br>B：不知道，自己查。', 'A: Blue — air scatters more of the blue in sunlight.<br>B: Don’t know, look it up.'))}`
        + dv(z(`人来选：${hl('A 更好')}`, `People pick: ${hl('A is better')}`)) + dv(z('1. 训练「打分模型」学人的喜好', '1. Train a “scoring model” on their choices')) + bars([['A', 82], ['B', 15]]) + EX + dv(z('2. 让模型多写高分回答（强化学习）', '2. Make the model write high scorers more (RL)')) + sub(z('目标：有用、诚实、无害', 'Aim: helpful, honest, harmless')), [5, 4]); break;
    case 'L3-P': p.top = `<b class="lx-tt">${z('模型参数：训练造出来，使用时读取', 'Parameters: made in training, read in use')}</b>`; p.hint = z('点「−」收起；点任一行可看它在第4层的位置', 'Tap “−” to close; tap a row to see it in layer 4');
      p.go = { ...p.go, par: '#L3', p1: '#L4/us/3', p2: '#L4/us/5', p3: '#L4/us/8' };
      set(z('模型参数（就地展开）', 'Parameters (opened)'), view(dia3('cmp', 'par'), { ...Object.fromEntries(ALL.map((x) => [x, 'dim' as St])), par: 'sel', u3: 'calm', xf: 'sel' }, { read: true, conn: 'par' }), 'KC08', [z('存下训练学到的全部「知识」', 'Stores all the “knowledge” training learned'), z('词向量表 + 各层权重 + 输出表', 'Embedding table + layer weights + output table'), z('训练时被改，使用时被读取', 'Changed in training, read in use'), z('规则写不完，让数字自己学出来', 'Too many rules to write; numbers learn them')],
        `<h4>${z('模型参数里有什么', 'What is in the parameters')}</h4>${dv(z(`${hl('词向量表')}：每个字一行数字`, `${hl('Embedding table')}: a row of numbers per char`))}${dv(z(`${hl('各层权重')}：注意力、前馈网络等，每层一套`, `${hl('Layer weights')}: attention, feed-forward…, a set per layer`))}${dv(z(`${hl('输出表')}：给每个字打分`, `${hl('Output table')}: scores every char`))}`
        + ib(z('本演示（第4层）：14 个字（含结束符）、每字 16 个数、2 层，共 7406 个数', 'This demo (layer 4): 14 chars (with END), 16 numbers each, 2 layers: 7406 numbers in all')) + dv(z(`GPT-3：约 ${hl('1750 亿')}个数`, `GPT-3: about ${hl('175 billion')} numbers`)) + sub(z('训练时一直在改；用的时候只读不改。', 'Changed all through training; in use, only read.')) + L4, [5, -1]); break;
    case 'U1': p.top = TOPU;
      set(z('①你的文字进来', '① Your text comes in'), view(Lf, lit('u1'), { fr: 'u', conn: 'u1' }), 'KC10', [z('交给模型接着往下写的起点', 'Where the model starts writing on'), z('你的话 + 之前的对话（上下文）', 'Your words + the earlier chat (context)'), z('从使用流程最上面进入', 'Enters at the top of the use steps'), z('模型只会做一件事：猜下一个字', 'The model does one thing: guess the next char')],
        `<h4>${z('① 你的文字进来', '① Your text comes in')}</h4>${dv(z('你输入：', 'You type:'))}${ib('天空是什么颜色？')}${dv(z('连同之前的对话，一起放进「上下文窗口」。', 'With the earlier chat, it goes into the “context window”.'))}${sub(z('窗口有上限，例如 GPT-3 是 2048 个 token；超出的部分模型看不到。', 'The window has a cap, e.g. 2048 tokens for GPT-3; the model can’t see beyond it.'))}`
        + dv(z('训练已经结束，', 'Training is over:')) + `<div class="hl">${z('参数现在固定不变。', 'the parameters are now fixed.')}</div>`, [5, 0]); break;
    case 'U2': p.top = TOPU;
      set(z('②分词', '② Tokenize'), view(Lf, lit('u2'), { fr: 'u', flow: ['u1', 'u2'], conn: 'u2' }), 'KC03', [z('把字切开，换成字典编号', 'Cuts the text, swaps in dictionary numbers'), z('训练时生成的字典 + 切分规则', 'The dictionary from training + cutting rules'), z('按合并规则切，再查编号', 'Cut by the merge rules, then look up numbers'), z('编号要和训练时完全一致', 'Numbers must match training exactly')],
        `<h4>${z('② 分词', '② Tokenize')}</h4>${dv(z(`${hl('依据')}：训练第②步那本字典`, `${hl('Uses')}: the dictionary from training step ②`))}<div class="tks mono">${([['天空', 812], ['是', 15], ['什么', 203], ['颜色', 977], ['？', 31]] as const).map(([a, b]) => `<span>${a}</span><span>→ ${b}</span>`).join('')}</div>${EX}`
        + dv(z('常用词整块切，少见的拆成小块。', 'Common words stay whole; rare ones split into pieces.')) + sub(z('字典换了，编号就全对不上。', 'Change the dictionary and no number matches.')), [5, 1]); break;
    case 'U3': p.top = TOPU;
      set(z('③Transformer 用参数计算', '③ Compute with parameters'), view(Lf, { ...lit('u3'), par: 'lit' }, { fr: 'u', flow: ['u1', 'u2', 'u3'], read: true, conn: 'u3' }), 'KC08', [z('把编号算成每个字的分数', 'Turns the numbers into a score per char'), z('词向量表 + 多个解码块 + 输出表', 'Embedding table + decoder blocks + output table'), z('逐层加工，每层都读对应的参数', 'Layer by layer, each reads its own parameters'), z('层层叠加，能理解复杂上下文', 'Stacked layers grasp complex context')],
        `<h4>${z('③ 用参数计算', '③ Compute with parameters')}</h4>${dv(z(`1. 编号 → 查${hl('词向量表')}`, `1. Numbers → look up the ${hl('embedding table')}`))}${dv(z(`2. 穿过 N 个${hl('解码块')}，每块里字和字互相「看」`, `2. Through N ${hl('decoder blocks')}; in each, chars “look at” each other`))}${dv(z(`3. 用${hl('输出表')}给字典里每个字打分`, `3. The ${hl('output table')} scores every char in the dictionary`))}`
        + ib(z('黄色虚线：每一步都在读取「模型参数」', 'Gold line: every step reads the parameters')) + dv(z('GPT-3 有 96 个解码块。', 'GPT-3 has 96 decoder blocks.')) + sub(z('点「Transformer 计算」可就地展开。', 'Tap “Transformer” to open it here.')) + L4, [5, 2]); break;
    case 'L3-X': p.top = TOPU; p.hint = z('点「−」收起；点「进入第4层」看完整架构图', 'Tap “−” to close; “Go to layer 4” for the full diagram');
      p.crumb = [L3c, [z('使用', 'Use'), '#L3/U1']]; p.go = { ...p.go, u3: '#L3/U3', x1: '#L4/us/3', x2: '#L4/us/5', x3: '#L4/us/8' };
      set(z('Transformer 计算（就地展开）', 'Transformer (opened)'), view(dia3('cmp', 'u3'), { ...Object.fromEntries(ALL.map((x) => [x, 'dim' as St])), u1: 'pass', u2: 'pass', u3: 'sel', par: 'lit', x2: 'lit', xf: 'sel' }, { read: true, conn: 'u3' }), 'KC09', [z('把一串编号算成下一个字的概率', 'Turns the numbers into next-char odds'), z('词向量、解码块 × N、打分输出', 'Embeddings, decoder blocks × N, scoring'), z('从下往上逐层加工，最后打分', 'Bottom up, layer by layer, then scores'), z('第4层用标准架构图逐块讲', 'Layer 4 explains each block on the standard diagram')],
        `<h4>${z('Transformer 里面', 'Inside the Transformer')}</h4>${dv(z('1. 编号查词向量，加上位置', '1. Numbers look up embeddings, plus position'))}${dv(z(`2. ${hl('解码块')}：注意力让字互相看，前馈网络再加工；重复 N 层`, `2. ${hl('Decoder block')}: attention lets chars see each other, then a feed-forward net; N times`))}${dv(z('3. 线性层打分，Softmax 变成概率', '3. A linear layer scores, Softmax makes odds'))}`
        + sub(z('外面整套流程仍然可见；这里只是把一个块打开。', 'The whole flow stays in view; one box is just opened.')) + dv(z('每个部件的完整架构图在第4层：', 'The full diagram of every part is in layer 4:')) + L4, [5, 2]); break;
    case 'U4': p.top = chips('蓝');
      set(z('④得到下一个字', '④ The next char'), view(Lf, lit('u4'), { fr: 'u', flow: ['u1', 'u2', 'u3', 'u4'], conn: 'u4' }), 'KC11', [z('从所有字里选出下一个字', 'Picks the next char from all of them'), z('概率 + 选字规则（温度等）', 'Odds + a picking rule (temperature…)'), z('最高的直接选，或按概率抽', 'Take the top, or draw by the odds'), z('既要准，也要能有变化', 'Accurate, yet able to vary')],
        `<h4>${z('④ 得到下一个字', '④ Get the next char')}</h4>${dv(z('分数变成概率：', 'Scores become odds:'))}${bars([['蓝', 84], ['绿', 10], ['红', 6]])}${EX}${dv(z('怎么选：', 'How to pick:'))}${dv(z(`· 总选最高 → ${hl('蓝')}`, `· Always the top → ${hl('蓝')} (blue)`))}${dv(z('· 按概率抽 → 偶尔选到别的', '· Draw by the odds → now and then another'))}${dv(z('· 温度越低越稳，越高越多样', '· Lower temperature steadier, higher more varied'))}`
        + dv(lk(z('选法细节见第4层 ›', 'Picking in layer 4 ›'), '#L4/us/9')), [5, 3]); break;
    case 'U5': p.top = chips('？', '<span class="c g">蓝</span>');
      set(z('⑤接到末尾，再来一轮', '⑤ Append and go again'), view(Lf, lit('u5'), { fr: 'u', flow: ['u1', 'u2', 'u3', 'u4', 'u5'], loop: true, conn: 'u5' }), 'KC09', [z('一个字一个字写完整段回答', 'Writes the whole answer char by char'), z('选出的字 + 原来的文字 + 停止规则', 'The picked char + the text so far + a stop rule'), z('追加到末尾，再走①到④', 'Append it, run ① to ④ again'), z('每步都只做擅长的「猜下一个字」', 'Each step does what it is best at: the next char')],
        `<h4>${z('⑤ 接到末尾，再来一轮', '⑤ Append it, go round again')}</h4>${dv(z('把「蓝」接到末尾，整串再走一遍：', 'Put “蓝” at the end and run the whole string again:'))}${([[1, '？', '蓝'], [2, '蓝', '色'], [3, '蓝色', '。'], [4, '色。', z('结束', 'END')]] as const).map(([i, a, b]) => ib(`${z(`第${i}轮`, `Round ${i}`)}：…${a} → ${hl(b)}`)).join('')}`
        + dv(z('遇到「结束」符号，或到长度上限就停。', 'It stops at the END symbol or the length cap.')) + sub(z('左边亮线：回到第①步。前面算过的部分可以缓存，不重算。', 'Left line: back to step ①. Earlier work can be cached, not redone.')), [5, 4]); break;
  }
  if (us || id === 'L3-X') p.go = { ...p.go };
  return p;
}
