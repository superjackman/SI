/* R13: the home diagram (T1) as one full-stack picture, from you at the top down to the maths at the bottom.
   This file holds the content (box texts, rows, connections) and a small layout engine that turns it into the svgT1
   markup for the phone view (380 wide) and the landscape full-screen view (1000 wide). The engine only draws straight
   or right-angled lines: the "supports" lines from the maths run in the side gutters, nested so that none of them
   cross, and m2/dgcheck.ts proves no line passes through a box and no label leaves its box. */
import type { Bi } from '../lib';
import { esc } from '../lib';

type Lang = 'zh' | 'en';
/** box text: [title, ...sub lines] per language */
type BT = { zh: string[]; en: string[] };
const b = (zh: string[], en: string[]): BT => ({ zh, en });

export const TXT: Record<string, BT> = {
  user: b(['🙋 用户的一句话', '“帮我查明天杭州天气', '并加个带伞提醒”'], ['🙋 The user’s request', '“Check tomorrow’s weather in', 'Hangzhou, add an umbrella reminder”']),
  uHub: b(['怎么用 Agent', '四种用法总览'], ['Using agents', 'the four ways']),
  uProd: b(['具体产品', '按用法找产品'], ['Products', 'by way of use']),
  uWith: b(['跟它一起干', '你看着、随时改'], ['Work with it', 'you watch and steer']),
  uSolo: b(['让它自己干', '交代完就放手'], ['Let it run', 'hand off, check later']),
  uKit: b(['给它装本事', '工具 · 技能 · MCP'], ['Extend it', 'tools · skills · MCP']),
  uWell: b(['把它用好', '上下文 · 提示 · 验收'], ['Use it well', 'context, prompts']),
  app: b(['Agent 应用', '把模型变成能干活的程序'], ['Agent app', 'turns the model into a working program']),
  plan: b(['规划', '拆成小步骤'], ['Planning', 'small steps']),
  tools: b(['工具调用', '输出 JSON', '程序去执行'], ['Tool calls', 'JSON out,', 'code runs it']),
  memory: b(['记忆 / RAG', '查资料、记偏好'], ['Memory', 'RAG, notes']),
  loop: b(['Agent 循环', '想→做→看→再想'], ['Agent loop', 'think → act → look']),
  guard: b(['权限与安全', '写操作要确认', '防提示注入'], ['Guardrails', 'confirm writes,', 'block injection']),
  llm: b(['大模型 LLM', '猜下一个词的机器'], ['LLM', 'a next-word guessing machine']),
  sample: b(['采样', '抽一个接上去'], ['Sampling', 'pick one']),
  lmhead: b(['输出打分层', '给每个词打分'], ['LM head', 'scores words']),
  ctxwin: b(['上下文窗口', '一次能看多少'], ['Context', 'what it sees']),
  tokenizer: b(['分词器', '文字 → token'], ['Tokenizer', 'text → tokens']),
  embed: b(['词嵌入表', 'token → 向量'], ['Embeddings', 'token → vector']),
  blocks: b(['Transformer 块', '× 几十层，一层层加工'], ['Transformer blocks', '× dozens of layers']),
  attn: b(['注意力', '词与词互相看'], ['Attention', 'mixes tokens']),
  ffn: b(['前馈网络', '逐词加工'], ['FFN', 'per token']),
  addnorm: b(['残差+归一化', '稳住数值'], ['Add & norm', 'keeps it stable']),
  nnHub: b(['神经网络基础', '加权求和 + 激活'], ['Neural nets', 'sum + activation']),
  moe: b(['MoE 专家混合', '每次只算几个专家'], ['MoE', 'only a few experts run']),
  nNeuron: b(['神经元', '加权求和'], ['Neuron', 'weighted sum']),
  nAct: b(['激活函数', '非线性开关'], ['Activation', 'a bend']),
  nFwd: b(['前向计算', '逐层算到输出'], ['Forward', 'layer by layer']),
  router: b(['路由器', '挑选专家'], ['Router', 'picks experts']),
  expert: b(['专家', '一组前馈网络'], ['Experts', 'small FFNs']),
  gqa: b(['分组注意力', '共享 K/V 缓存'], ['GQA', 'shared K/V']),
  mmenc: b(['多模态编解码', '把图片、声音变成 token，或变回来'], ['Multimodal encode/decode', 'images & sound ↔ tokens']),
  vit: b(['视觉编码器', '图片 → token'], ['Vision enc.', 'image→tokens']),
  audenc: b(['音频编码器', '声音 → token'], ['Audio enc.', 'sound→tokens']),
  projector: b(['投影层', '对齐到词向量'], ['Projector', '→ word space']),
  gimg: b(['图片生成', '扩散去噪'], ['Image generation', 'diffusion']),
  gaud: b(['音频生成', '声学 token'], ['Audio generation', 'audio tokens']),
  trainsys: b(['训练体系', '预训练 → 微调 → 对齐'], ['Training', 'pretrain → fine-tune → align']),
  pretrain: b(['预训练', '海量文本猜下一个词'], ['Pretraining', 'guess the next word']),
  sft: b(['监督微调', '照示范学按指令回答'], ['Fine-tuning (SFT)', 'learn from examples']),
  pref: b(['偏好对齐', '人类比较 · RLHF/DPO'], ['Preference tuning', 'RLHF / DPO']),
  rlvr: b(['推理强化学习', '可自动判分的奖励'], ['Reasoning RL', 'auto-graded rewards']),
  backprop: b(['反向传播', '算出每个参数的梯度'], ['Backprop', 'a gradient per weight']),
  nOpt: b(['优化器', 'SGD / Adam 更新参数'], ['Optimizer', 'SGD / Adam updates']),
  nLr: b(['学习率', '每步改多少'], ['Learning rate', 'step size']),
  loss: b(['损失函数', '交叉熵：猜错了多少'], ['Loss', 'cross-entropy:', 'how wrong it was']),
  infra: b(['算力与服务', 'GPU 集群 · 推理服务'], ['Compute & serving', 'GPUs · inference']),
  serve: b(['推理服务', '调度、流式返回'], ['Serving', 'schedule, stream']),
  kvcache: b(['KV 缓存', '前文不用重算'], ['KV cache', 'no recompute']),
  batch: b(['批处理', '很多请求一起算'], ['Batching', 'many requests at once']),
  quant: b(['量化', '数字少用几位'], ['Quantization', 'fewer bits']),
  mK1: b(['微积分', '导数 · 链式法则'], ['Calculus', 'chain rule']),
  mK2: b(['线性代数', '向量 · 矩阵乘'], ['Linear algebra', 'vectors · matmul']),
  mK3: b(['概率与信息', 'softmax · 交叉熵'], ['Probability', 'softmax · entropy']),
  mK4: b(['优化', '梯度下降 · Adam'], ['Optimization', 'descent · Adam']),
  mK5: b(['推导与证明', '反向传播 · √dₖ'], ['Derivations', 'backprop · √dₖ']),
  tRef: b(['🗺️ 速查：全景关系图 · 术语表'], ['🗺️ Reference: big map · glossary']),
};

interface Row { ids: string[]; w?: number }
interface Band { k: string; t: Bi; fill: string; m: Row[]; wd?: Row[] }
const R = (...ids: string[]): Row => ({ ids });
const K = (id: string): Row => ({ ids: [id], w: 132 });
export const BANDS: Band[] = [
  { k: 'you', t: { zh: '① 你 · 怎么用它', en: '① You · how you use it' }, fill: '#f0fdf4',
    m: [R('user'), R('uHub', 'uProd'), R('uWith', 'uSolo'), R('uKit', 'uWell')], wd: [R('user'), R('uHub', 'uWith', 'uSolo', 'uKit', 'uWell', 'uProd')] },
  { k: 'app', t: { zh: '② 应用层（普通代码，不训练）', en: '② App layer (plain code)' }, fill: '#fdf4ff',
    m: [R('app'), R('plan', 'tools', 'memory'), R('loop', 'guard')], wd: [R('app'), R('plan', 'tools', 'memory', 'loop', 'guard')] },
  { k: 'llm', t: { zh: '③ 大模型（负责“想”和“写”）', en: '③ The model (thinks and writes)' }, fill: '#eef2ff',
    m: [R('llm'), R('sample', 'lmhead', 'ctxwin'), R('tokenizer', 'embed')], wd: [R('llm'), R('sample', 'lmhead', 'ctxwin', 'tokenizer', 'embed')] },
  { k: 'tf', t: { zh: '④ 模型内部：Transformer', en: '④ Inside the model: Transformer' }, fill: '#f5f3ff',
    m: [R('blocks'), R('attn', 'ffn', 'addnorm')] },
  { k: 'nn', t: { zh: '⑤ 块由什么搭成', en: '⑤ What the blocks are made of' }, fill: '#f0fdfa',
    m: [R('nnHub', 'moe'), R('nNeuron', 'nAct', 'nFwd'), R('router', 'expert', 'gqa')], wd: [R('nnHub', 'moe'), R('nNeuron', 'nAct', 'nFwd', 'router', 'expert', 'gqa')] },
  { k: 'mm', t: { zh: '⑥ 侧支：看图、听声、生成', en: '⑥ Side branch: images, sound, generation' }, fill: '#fdf2f8',
    m: [R('mmenc'), R('vit', 'audenc', 'projector'), R('gimg', 'gaud')], wd: [R('mmenc'), R('vit', 'audenc', 'gimg', 'gaud', 'projector')] },
  { k: 'trn', t: { zh: '⑦ 训练：本事从哪来', en: '⑦ Training: where skills come from' }, fill: '#f7fee7',
    m: [R('trainsys'), R('pretrain', 'sft'), R('pref', 'rlvr'), R('backprop', 'nOpt'), R('nLr', 'loss')], wd: [R('trainsys'), R('pretrain', 'sft', 'pref', 'rlvr'), R('backprop', 'nOpt'), R('nLr', 'loss')] },
  { k: 'hw', t: { zh: '⑧ 底层：算力与服务', en: '⑧ Bottom: compute & serving' }, fill: '#f1f5f9',
    m: [R('infra'), R('serve', 'kvcache'), R('batch', 'quant')], wd: [R('infra'), R('serve', 'kvcache', 'batch', 'quant')] },
  { k: 'math', t: { zh: '⑨ 数学基础', en: '⑨ Math foundations' }, fill: '#fffbeb',
    m: [K('mK1'), K('mK2'), K('mK3'), K('mK4'), K('mK5')] },
];
/** the reference box under the last band */
export const TAIL = 'tRef';

/** the "supports" lines in the side gutters: lvl 0 is the track nearest the boxes; on each side an outer track's span
    must contain the inner one's (checked), so no two lines cross */
export interface GEdge { from: string; to: string; side: 'L' | 'R'; lvl: number; cls: string; lab: BT; at: 'from' | 'gap' }
export const GEDGES: GEdge[] = [
  { from: 'mK1', to: 'backprop', side: 'L', lvl: 0, cls: 'sup', lab: b(['链式法则', '→ 反向传播'], ['chain rule', '→ backprop']), at: 'from' },
  { from: 'mK2', to: 'attn', side: 'L', lvl: 1, cls: 'sup', lab: b(['矩阵乘', '→ 注意力'], ['matmul', '→ attention']), at: 'from' },
  { from: 'mK3', to: 'sample', side: 'L', lvl: 2, cls: 'sup', lab: b(['softmax', '→ 采样'], ['softmax', '→ sampling']), at: 'from' },
  { from: 'mK3', to: 'loss', side: 'R', lvl: 0, cls: 'sup', lab: b(['交叉熵', '→ 损失'], ['cross-entropy', '→ loss']), at: 'from' },
  { from: 'mK4', to: 'nOpt', side: 'R', lvl: 1, cls: 'sup', lab: b(['梯度下降', '→ 优化器'], ['descent', '→ optimizer']), at: 'from' },
  { from: 'mK5', to: 'rlvr', side: 'R', lvl: 2, cls: 'sup', lab: b(['策略梯度', '→ 强化学习'], ['policy gradient', '→ RL']), at: 'from' },
  { from: 'projector', to: 'embed', side: 'R', lvl: 0, cls: 'mmx', lab: b(['侧支：图像、声音向量接进词嵌入 ↗'], ['Side branch: image & sound vectors join the embeddings ↗']), at: 'gap' },
];
/** the short arrows between neighbouring bands (index = the gap under band i) */
export const GAPS: Record<number, { a: ('d' | 'u')[]; t: Bi }> = {
  0: { a: ['d'], t: { zh: '⬇ 你的话交给 Agent 应用', en: '⬇ your words go to the agent app' } },
  1: { a: ['d', 'u'], t: { zh: '⬇ 提示（文字） ⬆ 回答 / 工具调用', en: '⬇ prompt  ⬆ answer / tool call' } },
  2: { a: ['u'], t: { zh: '⬆ 大模型 = Transformer 块叠几十层', en: '⬆ the LLM = dozens of Transformer blocks' } },
  3: { a: ['u'], t: { zh: '⬆ 每块都由神经网络层搭成', en: '⬆ each block is built from neural layers' } },
  5: { a: ['u'], t: { zh: '⬆ 训练离线练出上面所有 🔥 权重', en: '⬆ training makes all the 🔥 weights above' } },
  6: { a: ['u'], t: { zh: '⬆ GPU 跑训练，也跑每一次推理', en: '⬆ GPUs run training and every answer' } },
  7: { a: [], t: { zh: '⬇ 数学：橙线标明它撑起上面哪一块', en: '⬇ Math: each orange line says what it holds up' } },
};

/* ---------- text width estimate (used for layout and by the checker) ---------- */
const wide = (c: string) => /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F\u2018-\u201D\u2190-\u21FF\u2B06\u2B07\u2197]/.test(c);
const emoji = (c: string) => (c.codePointAt(0) ?? 0) > 0x1F000;
export function textW(s: string, fs: number, bold = false): number {
  let w = 0;
  for (const c of s) w += emoji(c) ? fs * 1.2 : wide(c) ? fs : c === ' ' ? fs * 0.27 : /[A-Z]/.test(c) ? fs * (bold ? 0.66 : 0.62) : /[il.,:;'’()/·]/.test(c) ? fs * 0.3 : fs * (bold ? 0.56 : 0.52);
  return w;
}

/* ---------- layout ---------- */
export interface Geo { kind: 'box' | 'band'; id: string; x: number; y: number; w: number; h: number }
export interface Kb { C: Record<string, { n: Bi; cat: string; train?: string; zoom?: string } | undefined>; PATH: Record<string, unknown> }
const LH1 = 20, LH = 17, PAD = 22, ZPAD = 10, TPAD = 6, GAP = 34, ROWG = 14, HEAD = 30, BOT = 10, COLG = 8;

export function render(L: Lang, mode: 'm' | 'w', kb: Kb): { vb: string; inner: string; svg: string } {
  const W = mode === 'm' ? 380 : 1000, BX = 22, BW = W - 2 * BX, IX = BX + 6, IW = BW - 12;
  const trackX = (side: 'L' | 'R', lvl: number) => (side === 'L' ? 16 - 6 * lvl : W - 16 + 6 * lvl);
  const out: string[] = [], box = new Map<string, Geo>(), rowOf = new Map<string, string[]>();
  const nLines = (id: string) => { const t = TXT[id]; if (!t) throw new Error('t1 diagram: no text for ' + id); return Math.max(t.zh.length, t.en.length); };
  const part = (id: string) => { const c = kb.C[id]; if (!c) throw new Error('t1 diagram: unknown part ' + id); return c; };
  const hasZoom = (id: string) => { const z = part(id).zoom; return !!z && z !== 'T1' && !!kb.PATH[z]; };
  const badge = (id: string) => part(id).train === 'yes' || part(id).train === 'part';
  const boxH = (id: string) => { const n = nLines(id); return (n > 1 ? 14 + LH1 + LH * (n - 2) : 14) + PAD + (hasZoom(id) ? ZPAD : 0) + (badge(id) ? TPAD : 0); };
  let y = 8;
  const bandGeo: Geo[] = [];
  const comps: string[] = [];
  BANDS.forEach((B, bi) => {
    const rows = (mode === 'w' && B.wd) || B.m;
    const y0 = y; let ry = y0 + HEAD + ((rows[0] as Row).ids.some(badge) ? 10 : 0);
    for (const r of rows) {
      const h = Math.max(...r.ids.map(boxH));
      const n = r.ids.length, w = r.w ? Math.min(r.w, IW) : (IW - COLG * (n - 1)) / n;
      const x0 = r.w ? W / 2 - w / 2 : IX;
      r.ids.forEach((id, i) => { if (box.has(id)) throw new Error('t1 diagram: duplicate box ' + id); box.set(id, { kind: 'box', id, x: +(x0 + i * (w + COLG)).toFixed(2), y: ry, w: +w.toFixed(2), h }); rowOf.set(id, r.ids); });
      ry += h + ROWG;
    }
    const h = ry - ROWG + BOT - y0;
    bandGeo.push({ kind: 'band', id: B.k, x: BX, y: y0, w: BW, h });
    out.push(`<rect class="band" data-band="${B.k}" x="${BX}" y="${y0}" width="${BW}" height="${h}" rx="16" fill="${B.fill}" stroke="#e2e8f0"></rect><text class="lbl" x="${BX + 10}" y="${y0 + 19}" font-size="13" font-weight="700">${esc(B.t[L])}</text>`);
    void bi;
    y = y0 + h + GAP;
  });
  // the reference box under the bands
  { const h = boxH(TAIL); box.set(TAIL, { kind: 'box', id: TAIL, x: IX, y: y - GAP + 14, w: IW, h }); y = y - GAP + 14 + h + 10; }
  const H = Math.ceil(y);

  /* boxes */
  for (const [id, g] of box) {
    const c = part(id), t = TXT[id]![L], cx = +(g.x + g.w / 2).toFixed(2), z = hasZoom(id);
    const n = t.length, blk = n > 1 ? 14 + LH1 + LH * (n - 2) : 14, tp = badge(id) ? TPAD : 0, avail = g.h - (z ? ZPAD : 0) - tp;
    let by = +(g.y + tp + (avail - blk) / 2 + 11).toFixed(1);
    let o = `<g class="comp cat-${c.cat}" data-id="${id}" data-train="${c.train ?? 'no'}" tabindex="0" role="button" aria-label="${esc(c.n[L])}"><rect class="main" x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="12"></rect>`;
    t.forEach((s, i) => { if (i) by = +(by + (i === 1 ? LH1 : LH)).toFixed(1); o += i ? `<text class="s" x="${cx}" y="${by}">${esc(s)}</text>` : `<text class="t" style="font-size:15px" x="${cx}" y="${by}">${esc(s)}</text>`; });
    if (z) o += `<text x="${+(g.x + g.w - 14).toFixed(2)}" y="${g.y + g.h - 8}" font-size="13" text-anchor="middle" class="zm-h">🔍</text>`;
    if (c.train === 'yes' || c.train === 'part') {
      const bt = L === 'en' ? ['🔥 Updated in training', '🔒 Read-only'] : ['🔥 训练时更新', '🔒 只读'];
      o += `<g class="badge b-train"><rect x="${cx - 50}" y="${g.y - 11}" width="100" height="20" rx="10" fill="#f97316"></rect><text x="${cx}" y="${g.y + 3}">${bt[0]}</text></g><g class="badge b-use"><rect x="${cx - 34}" y="${g.y - 11}" width="68" height="20" rx="10" fill="#0ea5e9"></rect><text x="${cx}" y="${g.y + 3}">${bt[1]}</text></g>`;
    }
    comps.push(o + '</g>');
  }

  /* arrows between neighbouring bands */
  const arrows: string[] = [], labels: string[] = [];
  bandGeo.forEach((g, i) => {
    const s = GAPS[i]; if (!s) return;
    const nx = bandGeo[i + 1]; if (!nx) return;
    const top = g.y + g.h, bot = nx.y, ax = 44;
    s.a.forEach((d, k) => { const x = ax + k * 12; arrows.push(`<path class="arrow" d="M${x} ${d === 'd' ? top + 2 : bot - 2} V${d === 'd' ? bot - 3 : top + 3}" marker-end="url(#ahT1)"></path>`); });
    const lx = s.a.length ? ax + 12 * s.a.length + 6 : BX + 10;
    labels.push(`<text class="lbl" x="${lx}" y="${+((top + bot) / 2 + 4.5).toFixed(1)}" font-size="12.5" fill="#334155">${esc(s.t[L])}</text>`);
  });

  /* the gutter lines */
  for (const e of GEDGES) {
    const a = box.get(e.from), z = box.get(e.to);
    if (!a || !z) throw new Error(`t1 diagram: edge ${e.from}→${e.to} has a missing end`);
    for (const [id, g] of [[e.from, a], [e.to, z]] as const) {
      const r = rowOf.get(id)!, edge = e.side === 'L' ? r[0] : r[r.length - 1];
      if (edge !== id) throw new Error(`t1 diagram (${mode}): ${id} must be the ${e.side === 'L' ? 'leftmost' : 'rightmost'} box in its row for edge ${e.from}→${e.to}`);
      void g;
    }
    const tx = trackX(e.side, e.lvl), ay = +(a.y + a.h / 2).toFixed(1), zy = +(z.y + z.h / 2).toFixed(1);
    const ax = e.side === 'L' ? a.x : a.x + a.w, zx = e.side === 'L' ? z.x - 1 : z.x + z.w + 1;
    arrows.push(`<path class="arrow ${e.cls}" data-from="${e.from}" data-to="${e.to}" d="M${ax} ${ay} H${tx} V${zy} H${zx}" marker-end="url(#${e.cls === 'mmx' ? 'amT1' : 'asT1'})"></path>`);
    const lab = e.lab[L], col = e.cls === 'mmx' ? '#9d174d' : '#92400e';
    if (e.at === 'from') {
      const lx = +((e.side === 'L' ? (tx + ax) : (ax + tx)) / 2).toFixed(1);
      lab.forEach((s, i) => labels.push(`<text class="elab" x="${lx}" y="${+(i ? ay + 13 : ay - 5).toFixed(1)}" font-size="11" text-anchor="middle" fill="${col}">${esc(s)}</text>`));
    } else {
      // in the gap right under the source's band, right-aligned next to the track
      const bg = bandGeo.find((g) => a.y >= g.y && a.y < g.y + g.h)!, prev = bandGeo[bandGeo.indexOf(bg) - 1]!;
      const gy = (prev.y + prev.h + bg.y) / 2 + 4;
      labels.push(`<text class="elab" x="${BX + BW - 6}" y="${+gy.toFixed(1)}" font-size="11" text-anchor="end" fill="${col}">${esc(lab[0] as string)}</text>`);
    }
  }
  const mk = (id: string, c: string) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"></path></marker>`;
  const defs = `<defs><marker id="ahT1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"></path></marker><marker id="arT1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#d97706"></path></marker>${mk('asT1', '#d97706')}${mk('amT1', '#db2777')}</defs>`;
  const inner = defs + out.join('') + arrows.join('') + comps.join('') + labels.join('');
  const vb = `0 0 ${W} ${H}`;
  return { vb, inner, svg: `<svg id="svgT1" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" data-m="1">${inner}</svg>` };
}

/** the legend under the diagram */
const LEG: [string, string, string, Bi][] = [
  ['io', 'var(--io)', 'var(--io-f)', { zh: '输入/输出', en: 'Input/output' }],
  ['use', '#15803d', '#dcfce7', { zh: '怎么用', en: 'Ways of use' }],
  ['agent', '#a21caf', '#fae8ff', { zh: 'Agent 应用层', en: 'Agent app' }],
  ['safe', '#dc2626', '#fee2e2', { zh: '权限与安全', en: 'Guardrails' }],
  ['llm', '#4338ca', '#e0e7ff', { zh: '大模型', en: 'LLM' }],
  ['tok', 'var(--tok)', 'var(--tok-f)', { zh: '分词', en: 'Tokenization' }],
  ['emb', 'var(--emb)', 'var(--emb-f)', { zh: '嵌入', en: 'Embedding' }],
  ['out', 'var(--out)', 'var(--out-f)', { zh: '输出/损失', en: 'Output/loss' }],
  ['blk', 'var(--blk)', 'var(--blk-f)', { zh: 'Transformer 块', en: 'Transformer block' }],
  ['attn', 'var(--attn)', 'var(--attn-f)', { zh: '注意力', en: 'Attention' }],
  ['ffn', 'var(--ffn)', 'var(--ffn-f)', { zh: '前馈网络', en: 'Feed-forward' }],
  ['norm', 'var(--norm)', 'var(--norm-f)', { zh: '归一化', en: 'Norm' }],
  ['nn', '#0d9488', '#ccfbf1', { zh: '神经网络', en: 'Neural net' }],
  ['moe', '#0891b2', '#cffafe', { zh: 'MoE / 高效架构', en: 'MoE / efficiency' }],
  ['mm', '#db2777', '#fce7f3', { zh: '多模态编码', en: 'Multimodal' }],
  ['gen', '#7e22ce', '#faf5ff', { zh: '生成（解码）', en: 'Generation' }],
  ['trn', '#65a30d', '#ecfccb', { zh: '训练体系', en: 'Training' }],
  ['infra', '#475569', '#e2e8f0', { zh: '算力与服务', en: 'Compute' }],
  ['math', '#b45309', '#fef3c7', { zh: '数学基础', en: 'Math' }],
];
export function legend(L: Lang): string {
  const used = new Set<string>();
  return `<div class="legend" id="legendT1">${LEG.filter(([k]) => !used.has(k) && used.add(k)).map(([, c, f, n]) => `<span><i style="--c:${c};--f:${f}"></i>${esc(n[L])}</span>`).join('')}<span><i class="ln" style="--c:#d97706"></i>${L === 'en' ? 'orange line = the math that holds up a box' : '橙线 = 数学撑起哪一块'}</span><span><i class="dash"></i>${L === 'en' ? 'dashed box = fixed computation, no learnable numbers' : '虚线框 = 固定计算/结果，没有可学习的数字'}</span></div>`;
}
