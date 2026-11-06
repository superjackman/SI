// R4 · one shared number table. Cards (web/src/l4/c/*.json) and stage pages
// (web/src/dv/zh.ts, en.ts) write {#key} instead of the number; kc.ts and
// dv/view.ts fill it in from here, so both sides always show the same value.
// Values are plain text; `x` marks a formula. `ap` = approximate / empirical:
// the filled text gets an "≈ label" chip on cards and on stage pages.
// tests/unit/r49-nums.test.ts fails if a page hard-codes one of these numbers
// (see `ban`) instead of using the placeholder.

export type Num = {
  zh: string;
  en: string;
  ap?: [string, string];
  /** cards that must use it */
  cards: string[];
  /** stage pages (D/n) that must use it, as step keys (8a / 8b for the two halves of step 8) */
  st: (number | 'P' | 'E' | 'S' | 'A' | '8a' | '8b' | '15a' | '15b')[];
  /** hard-coded spellings that must not appear outside this table */
  ban: RegExp[];
};

export const NUM = {
  // ── step 9 · KC05 scaling laws ──
  c6nd: {
    zh: '`C ≈ 6 × N × D` 次浮点运算',
    en: '`C ≈ 6 × N × D` floating-point operations',
    ap: ['粗略估算', 'rough estimate'],
    cards: ['KC05'], st: [9],
    ban: [/6\s*[·×*]?\s*N\s*[·×*]?\s*D\b/],
  },
  chN: {
    zh: '700 亿（70B）参数', en: '70 billion (70B) parameters',
    cards: ['KC05'], st: [9],
    ban: [/700\s*亿|\b70\s*B\b|70 billion/],
  },
  chD: {
    zh: '1.4 万亿（1.4T）词元', en: '1.4 trillion (1.4T) tokens',
    cards: ['KC05'], st: [9],
    ban: [/1\.4\s*(万亿|T\b|trillion)/],
  },
  ch20: {
    zh: '约每参数 20 个词元', en: 'about 20 tokens per parameter',
    ap: ['经验比例', 'rule of thumb'],
    cards: ['KC05'], st: [9],
    ban: [/每个?参数.{0,3}20|20\s*个?\s*(token|词元)\s*每|20 tokens per/],
  },
  // ── step 8b · KC08 parameter count, K10 FFN width ──
  p12: {
    zh: '约 `12 × d²` 个参数（注意力 `4 × d²` + 前馈 `8 × d²`）',
    en: 'about `12 × d²` parameters (attention `4 × d²` + feed-forward `8 × d²`)',
    ap: ['粗算，不含词向量表', 'rough, embeddings not counted'],
    cards: ['KC08'], st: ['8b'],
    ban: [/\b(12|4|8)\s*[·×*]?\s*d²/],
  },
  ffn: {
    zh: '约 4 倍', en: 'about 4×',
    ap: ['常见值，各模型不同', 'typical, varies by model'],
    cards: ['K10'], st: ['8b'],
    ban: [/(?<![\d.])4\s*倍|(?<![\d.])4×/],
  },
  // ── step 11 · KC13 LoRA and quantisation ──
  loraF: {
    zh: '4096 × 4096 = 16,777,216', en: '4096 × 4096 = 16,777,216',
    cards: ['KC13'], st: [11],
    ban: [/16,?777,?216/],
  },
  lora: {
    zh: '2 × 4096 × 8 = 65,536 个，约 0.39%', en: '2 × 4096 × 8 = 65,536, about 0.39%',
    cards: ['KC13'], st: [11],
    ban: [/65,?536|0\.39\s*%/],
  },
  q7b: {
    zh: '16 位（FP16）约 14 GB，8 位约 7 GB，4 位（INT4）约 3.5 GB',
    en: '16 bits (FP16) ≈ 14 GB, 8 bits ≈ 7 GB, 4 bits (INT4) ≈ 3.5 GB',
    ap: ['只算参数，另有少量缩放值', 'parameters only, plus a few scale values'],
    cards: ['KC13'], st: [11],
    ban: [/\b14\s*GB|\b3\.5\s*GB|(?<![\d.])7\s*GB/],
  },
  // ── steps 7 and 8a · KM12 one attention example ──
  attS0: {
    zh: '[16, 8, 0]', en: '[16, 8, 0]',
    cards: ['KM12'], st: ['8a'],
    ban: [/\[16,\s*8,\s*0\]|\[8,\s*4,\s*0\]/],
  },
  attK: {
    zh: '`d_k = 64`，除以 `√64 = 8`', en: '`d_k = 64`, divide by `√64 = 8`',
    cards: ['KM12'], st: ['8a'],
    ban: [/√\s*64|d_k\s*=\s*64/],
  },
  attSat: {
    zh: '[0.9997, 0.0003, 0.0000]', en: '[0.9997, 0.0003, 0.0000]',
    cards: ['KM12'], st: ['8a'],
    ban: [/0\.9997|98\.17\s*%/],
  },
  attS1: {
    zh: '[2, 1, 0]', en: '[2, 1, 0]',
    cards: ['KM12'], st: [7, '8a'],
    ban: [/\[2,\s*1,\s*0\]|\[1,\s*0\.5,\s*0\]/],
  },
  attW: {
    zh: '[0.665, 0.245, 0.090]', en: '[0.665, 0.245, 0.090]',
    cards: ['KM12'], st: [7, '8a'],
    ban: [/0\.665|0\.245|50\.6\s*%/],
  },
  // ── step 12 · K15 / K12 temperature, KC14 KV cache ──
  tS: {
    zh: '4.1 / 1.3 / 1.0', en: '4.1 / 1.3 / 1.0',
    cards: ['K15', 'K12'], st: [9],
    ban: [/4\.1\s*\/\s*1\.3/],
  },
  t1: {
    zh: '90% / 5.5% / 4.1%', en: '90% / 5.5% / 4.1%',
    cards: ['K15', 'K12'], st: [9],
    ban: [/5\.5\s*%/],
  },
  t05: {
    zh: '99.4% / 0.4% / 0.2%', en: '99.4% / 0.4% / 0.2%',
    cards: ['K15'], st: [9],
    ban: [/99\.4\s*%/],
  },
  t2: {
    zh: '69% / 17% / 15%', en: '69% / 17% / 15%',
    cards: ['K15'], st: [9],
    ban: [/\b69\s*%/],
  },
  kvS: {
    zh: '32 层、d = 4096、4096 个词元、每个数 2 字节',
    en: '32 layers, d = 4096, 4096 tokens, 2 bytes per number',
    cards: ['KC14'], st: [12],
    ban: [/32\s*层、\s*d\s*=\s*4096|32 layers, d = 4096/],
  },
  kv: {
    zh: '2 × 32 × 4096 × 4096 × 2 ≈ 2 GB', en: '2 × 32 × 4096 × 4096 × 2 ≈ 2 GB',
    cards: ['KC14'], st: [12],
    ban: [/4096\s*×\s*4096\s*×\s*2|(?<![\d.])2\s*GB/],
  },
  kv100: {
    zh: '1 + 2 + … + 100 = 5050', en: '1 + 2 + … + 100 = 5050',
    cards: ['KC14'], st: [12],
    ban: [/5050/],
  },
  // ── step 15 · KA07 image patches ──
  vit: {
    zh: '`(224 / 16) × (224 / 16) = 14 × 14 = 196`', en: '`(224 / 16) × (224 / 16) = 14 × 14 = 196`',
    cards: ['KA07'], st: ['15a'],
    ban: [/14\s*×\s*14\s*=\s*196/],
  },
  // ── C12 · canonical examples: the card holds it, the stage page reuses it ──
  // step 1 · KM07 / K13 this site's real model on 「天空是什么颜色？」
  p0: {
    zh: '5.4%', en: '5.4%',
    cards: ['KM07', 'K13', 'KC04', 'KC11'], st: [1, 9],
    ban: [/5\.4\s*%/],
  },
  p1: {
    zh: '99.8%', en: '99.8%',
    cards: ['K13', 'KC04', 'KC11', 'K12', 'KC01'], st: [1, 9],
    ban: [/99\.8\s*%/],
  },
  ce0: {
    zh: '`−ln 0.0536 ≈ 2.93`', en: '`−ln 0.0536 ≈ 2.93`',
    cards: ['KM07', 'K13'], st: [1],
    ban: [/0\.0536|≈\s*2\.93/],
  },
  ce1: {
    zh: '≈ 0.002', en: '≈ 0.002',
    cards: ['K13'], st: [1],
    ban: [/≈\s*0\.002\b/],
  },
  // step 2 · KM10 gradient descent on one curve, K14 one parameter update
  gdL: {
    zh: '`L(w) = (w − 2)² + 0.5`', en: '`L(w) = (w − 2)² + 0.5`',
    cards: ['KM10', 'KM08'], st: [2],
    ban: [/\(w\s*−\s*[23]\)²/],
  },
  gd03: {
    zh: 'w = 0.00, 1.20, 1.68, 1.87, 1.95…', en: 'w = 0.00, 1.20, 1.68, 1.87, 1.95…',
    cards: ['KM10'], st: [2],
    ban: [/1\.20,\s*1\.68/, /w = 0\.6；|w = 0\.6;/],
  },
  gd11: {
    zh: 'w = 0.00, 4.40, −0.88, 5.46, −2.15', en: 'w = 0.00, 4.40, −0.88, 5.46, −2.15',
    cards: ['KM10'], st: [2],
    ban: [/4\.40,\s*−0\.88/, /6\.6\s*→\s*−1\.32/],
  },
  upd: {
    zh: '`0.50 − 0.1 × 0.20 = 0.48`', en: '`0.50 − 0.1 × 0.20 = 0.48`',
    cards: ['K14'], st: [2],
    ban: [/(新|new) w = 0\.48|0\.50\s*−\s*0\.1\s*×\s*0\.20/],
  },
  // step 2 · KM08 two parameters: the bowl, the gradient vector, one simultaneous update
  bowlL: {
    zh: '`L(w1, w2) = (w1 − 2)² + 2 × (w2 − 1)²`', en: '`L(w1, w2) = (w1 − 2)² + 2 × (w2 − 1)²`',
    cards: ['KM08'], st: [2],
    ban: [/\(w1\s*−\s*2\)²/],
  },
  bowlG: {
    zh: '`∂L/∂w1 = 2 × (0 − 2) = −4`，`∂L/∂w2 = 4 × (0 − 1) = −4`，梯度 = (−4, −4)',
    en: '`∂L/∂w1 = 2 × (0 − 2) = −4`, `∂L/∂w2 = 4 × (0 − 1) = −4`, gradient = (−4, −4)',
    cards: ['KM08'], st: [2],
    ban: [/\(−4,\s*−4\)/],
  },
  bowlS: {
    zh: 'η = 0.1：(w1, w2) = (0, 0) → (0.4, 0.4) → (0.72, 0.64)，L = 6 → 3.28 → 1.90',
    en: 'η = 0.1: (w1, w2) = (0, 0) → (0.4, 0.4) → (0.72, 0.64), L = 6 → 3.28 → 1.90',
    cards: ['KM08'], st: [2],
    ban: [/\(0\.72,\s*0\.64\)/, /3\.28\s*→\s*1\.90/],
  },
  // step 4 · KM09 chain rule
  bp: {
    zh: '`dL/dx = 0.5 × 3 × 2 = 3`', en: '`dL/dx = 0.5 × 3 × 2 = 3`',
    cards: ['KM09'], st: [4],
    ban: [/0\.5\s*×\s*3\s*×\s*2/],
  },
  // step 5 · KM13 momentum
  mom: {
    zh: 'v = 1, 1.9, 2.71, 3.44', en: 'v = 1, 1.9, 2.71, 3.44',
    cards: ['KM13'], st: [5],
    ban: [/2\.71,\s*3\.44/],
  },
  // step 6 · KM02 dot product
  dot: {
    zh: '`3 × 2 + 1 × 2.5 = 8.5`', en: '`3 × 2 + 1 × 2.5 = 8.5`',
    cards: ['KM02'], st: [6],
    ban: [/3\s*×\s*2\s*\+\s*1\s*×\s*2\.5/],
  },
  // step 7 · K16 RNN fading memory, KM04 softmax
  rnn: {
    zh: 'h = 0.76 → 0.36 → 0.18 → 0.09', en: 'h = 0.76 → 0.36 → 0.18 → 0.09',
    cards: ['K16'], st: [7],
    ban: [/0\.76\s*→\s*0\.36/],
  },
  smS: {
    zh: '2.0 / 1.0 / 0.1 / −0.5', en: '2.0 / 1.0 / 0.1 / −0.5',
    cards: ['KM04', 'KM14'], st: ['P', 1, 7],
    ban: [/2\.0[、,]\s*(绿\s*)?1\.0[、,]\s*(红\s*)?0\.1/, /2\.0 \/ 1\.0 \/ 0\.1/],
  },
  smP: {
    zh: '62.5% / 23.0% / 9.4% / 5.1%', en: '62.5% / 23.0% / 9.4% / 5.1%',
    cards: ['KM04', 'KM14'], st: ['P', 1, 7],
    ban: [/62\.5\s*%|23\.0\s*%|9\.3\s*%/],
  },
  // step 9 · K02 BPE merges
  bpe: {
    zh: '语料有 low、lower、lowest：“l o”最常见，合并成“lo”；再合并“lo w”成“low”；lowest 最后切成 low + est',
    en: 'the corpus has low, lower, lowest: “l o” is most common, merge to “lo”; then “lo w” to “low”; lowest ends up as low + est',
    cards: ['K02'], st: [6],
    ban: [/“lo w”/],
  },
  // step 10 · KC07 reward model
  rAB: {
    zh: 'r_A = 1.5、r_B = 0.5', en: 'r_A = 1.5, r_B = 0.5',
    cards: ['KC07'], st: [10],
    ban: [/r_[AB]\s*=\s*1\.5|8\.2\s*(分|points)/],
  },
  bt: {
    zh: 'P(A 优于 B) = σ(1.5 − 0.5) = σ(1.0) ≈ 0.73', en: 'P(A beats B) = σ(1.5 − 0.5) = σ(1.0) ≈ 0.73',
    cards: ['KC07'], st: [10],
    ban: [/σ\(1\.0\)/],
  },
} satisfies Record<string, Num>;
/** lookup by any string key */
export const NUMS: Record<string, Num> = NUM;

export type Lang = 'zh' | 'en';
const RE = /\{#(\w+)\}/g;

function val(k: string): Num {
  const n = NUMS[k];
  if (!n) throw new Error('unknown number {#' + k + '}');
  return n;
}

/** card HTML: `x` → formula span, ap → ≈ chip */
export function fillCardText(s: string, l: Lang): string {
  if (!s.includes('{#')) return s;
  return s.replace(RE, (_, k: string) => {
    const n = val(k);
    const v = n[l].replace(/`([^`]+)`/g, '<span class="formula">$1</span>');
    return n.ap ? v + ' <span class="ap">≈ ' + n.ap[l === 'zh' ? 0 : 1] + '</span>' : v;
  });
}

/** stage text (rendered by dv/view mk): keep `x`, ap → {~label} */
export function fillDvText(s: string, l: Lang): string {
  if (!s.includes('{#')) return s;
  return s.replace(RE, (_, k: string) => {
    const n = val(k);
    return n.ap ? n[l] + ' {~' + n.ap[l === 'zh' ? 0 : 1] + '}' : n[l];
  });
}

/** deep-map every string in a JSON-like value */
export function deepFill<T>(v: T, f: (s: string) => string): T {
  if (typeof v === 'string') return f(v) as unknown as T;
  if (Array.isArray(v)) return v.map((x) => deepFill(x, f)) as unknown as T;
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = deepFill(x, f);
    return o as T;
  }
  return v;
}

/** keys used in a string */
export function numKeys(s: string): string[] {
  return [...s.matchAll(RE)].map((m) => m[1]!);
}

/* R56 变式题 (variant questions): the number sets the 验证 step draws from, one list per kind. Entry 0 is always the
   station's own example (the same numbers as the base self-check named in vf/var.ts), the rest are new numbers.
   tests/unit/r56-ml.test.ts recomputes every answer and checks entry 0 against the base question. */
export const VAR = {
  /** predictions vs the true values 3, 5, 7 → MSE */
  mse: [[2.5, 5, 7.5], [2, 5, 8], [3, 4, 7], [3.5, 5.5, 6], [4, 5, 6]],
  /** the probability given to the right answer → −ln p */
  ce: [[0.5], [0.25], [0.8], [0.1], [0.9]],
  /** two scores → softmax % of the first */
  sm2: [[2, 0], [1, 0], [3, 1], [0.5, 0], [2, 1]],
  /** (w0, η) on L(w) = (w − 2)² + 0.5 → w after one step */
  gd1: [[0, 0.3], [1.2, 0.3], [3, 0.25], [4, 0.1], [-1, 0.2]],
  /** (w1, w2) on L = (w1 − 2)² + 2 × (w2 − 1)² → ∂L/∂w2 */
  bowl: [[0.4, 0.4], [0, 0], [1, 0.5], [2, 1.5], [0.5, 2]],
  /** (w0, η) with a big step → w after one step */
  gdbig: [[0, 1.1], [1, 1.2], [3, 1.1], [0, 1.0], [4, 1.05]],
  /** q = (a, b), k = (c, d) → q·k */
  dot2: [[3, 1, 2, 2.5], [1, 2, 3, 1], [2, -1, 1, 3], [0.5, 4, 2, 1], [1, 1, 4, -3]],
  /** (dot product, d_k) → scaled score */
  scale: [[16, 64], [8, 16], [12, 9], [24, 64], [6, 4]],
  /** weights (3) then values (3) → the mixed value Σ w × v */
  mix: [[0.5, 0.25, 0.25, 2, 4, 8], [0.7, 0.2, 0.1, 10, 0, 5], [0.6, 0.3, 0.1, 1, 2, 3], [0.25, 0.25, 0.5, 8, 4, 2], [0.8, 0.1, 0.1, 5, 10, 0]],
  /* R57: one pool per new station goal. Entry 0 is that station’s own self-check when vf/var.ts BASE names one. */
  /** (x1, y1, x2, y2) → slope (y2−y1)/(x2−x1) */
  wlin: [[1, 3, 2, 5], [1, 3, 3, 7], [0, 1, 2, 7], [1, 0, 4, 6], [2, 1, 6, 13]],
  /** (w, x, y) → intercept y − w·x */
  blin: [[2, 1, 3], [2, 2, 5], [3, 2, 8], [4, 1, 6], [2, 3, 9]],
  /** (w, x, b) → prediction w·x + b */
  ylin: [[2, 4, 1], [3, 2, 1], [2, 5, 1], [4, 3, 2], [5, 1, 2]],
  /** four probabilities → their sum */
  psum: [[0.5, 0.2, 0.2, 0.1], [0.4, 0.4, 0.4, 0.4], [0.2, 0.2, 0.2, 0.2], [0.9, 0.2, 0.2, 0.1], [0.1, 0.1, 0.1, 0.1]],
  /** (top probability, how many candidates) → each of the others */
  crest: [[0.7, 4], [0.5, 4], [0.4, 3], [0.82, 4], [0.25, 5]],
  /** three numbers → their mean */
  mean3: [[1.5, 1, 6], [2, 5, 8], [3, 3, 9], [10, 0, 5], [4, 1, 7]],
  /** (x1, x2) → h2 = ReLU(x1 + x2 − 1) */
  xoh: [[1, 1], [2, 1], [3, 0], [4, 1], [2, 2]],
  /** (x1, x2) → y = h1 − 2·h2 on the hand-built XOR net */
  xoy: [[0, 1], [1, 1], [2, 2], [1, 0], [3, 1]],
  /** one number → ReLU */
  relu1: [[-2], [1.5], [-0.5], [3], [-4]],
  /** three factors → their product (chain rule) */
  chn: [[2, 3, 0.5], [2, 4, 0.5], [1, 5, 2], [4, 2, 0.5], [5, 2, 0.5]],
  /** (x, w1, w2, t) → dL/dw2 on y = w2·ReLU(w1·x), L = (y−t)² */
  bp2: [[1, 2, 3, 5], [1, 2, 4, 5], [2, 1, 3, 4], [1, 3, 2, 4], [1, 4, 2, 5]],
  /** same net → dL/dw1 */
  bp1: [[1, 2, 3, 5], [1, 2, 4, 5], [2, 1, 3, 4], [1, 3, 2, 4], [1, 4, 2, 5]],
  /** (samples, batch) → updates per epoch */
  epoch: [[1000000, 256], [500000, 100], [1000000, 500], [2000000, 128], [800000, 200]],
  /** constant gradient g, momentum 0.9, three steps → v */
  mom3: [[1], [2], [0.5], [3], [1.5]],
  /** (train %, val %) → the gap */
  gap: [[99, 70], [95, 80], [90, 60], [100, 75], [88, 70]],
  /** (vocab size, embedding dim) → numbers stored for one word */
  emb: [[50000, 300], [30000, 256], [100000, 768], [32000, 512], [8000, 128]],
  /** two 2-d word vectors → dot product */
  dotw: [[3, 1, 2, 2.5], [1, 2, 3, 1], [2, -1, 1, 3], [0.5, 4, 2, 1], [1, 1, 4, -3]],
  /** two 3-d vectors → dot product */
  dot3: [[0.8, 0.1, 0.6, 0.7, 0.2, 0.5], [0.5, 0.5, 0.5, 0.5, 0.5, 0.5], [0.2, 0.3, 0.4, 0.5, 0.6, 0.7], [1, 2, 3, 1, 1, 1], [0.9, 0.1, 0.2, 0.4, 0.5, 0.6]],
  /** sentence length → RNN steps that cannot run at once */
  seqn: [[8], [6], [10], [4], [12]],
  /** steps of “halve each time” → fraction left */
  halv: [[4], [2], [3], [5], [6]],
  /** three scores → softmax weight of the first */
  smw: [[2, 1, 0], [3, 1, 0], [4, 1, 0], [2, 0, -1], [1, 0, -2]],
  /** (model dim, heads) → per-head width */
  hd: [[512, 8], [768, 12], [1024, 8], [256, 8], [4096, 32]],
  /** model dim → millions of parameters in one block, about 12·d² */
  pmill: [[4096], [1024], [512], [2048], [768]],
  /** (x, F(x)) → residual output x + F(x) */
  res: [[5, 2], [4, 1], [8, 1], [3, 4], [7, 2]],
  /** token count → next-token questions in one forward pass */
  ntok: [[6], [8], [4], [10], [16]],
  /** perplexity e^(ln k) = k */
  ppl: [[4], [2], [10], [8], [5]],
  /** same perplexity, tied to the evaluation station’s question */
  pplE: [[4], [2], [8], [5], [10]],
  /** (score, score, score, temperature) → first probability in percent */
  tmp: [[4.1, 1.3, 1, 1], [4.1, 1.3, 1, 0.5], [4.1, 1.3, 1, 2], [3, 1, 0, 1], [2, 0.5, 0, 1.5]],
  /** (right, total) → accuracy in percent */
  acc: [[8, 10], [7, 10], [18, 20], [3, 5], [9, 10]],
  /** (items, leaked) → clean items left */
  clean: [[20, 5], [50, 10], [10, 2], [40, 15], [8, 1]],
  /** (rA, rB) → σ(rA − rB) */
  sig: [[1.5, 0.5], [2, 1], [1, 0], [0.5, -0.5], [3, 1]],
  /** equal rewards → σ(0) */
  sige: [[1.2, 1.2], [0, 0], [2, 2], [0.5, 0.5], [3, 3]],
  /** (reward, β, KL) → r − β·KL */
  rkl: [[1.4, 0.1, 2], [2, 0.5, 1], [3, 0.2, 5], [0.8, 0.1, 3], [2.5, 0.4, 1]],
  /** (d, r) → LoRA numbers trained, 2·d·r */
  loraN: [[4096, 8], [1024, 4], [768, 8], [512, 16], [2048, 8]],
  /** (billions of parameters, bits) → gigabytes */
  qgb: [[7, 4], [7, 8], [7, 16], [13, 4], [70, 4]],
  /** (d, r) → LoRA as a percent of the full matrix */
  loraf: [[4096, 8], [1024, 8], [768, 4], [512, 8], [2048, 16]],
  /** (layers, KV heads, head dim, bytes) → bytes of cache per token */
  kvb: [[32, 32, 128, 2], [32, 8, 128, 2], [24, 8, 128, 2], [32, 32, 64, 2], [16, 8, 64, 2]],
  /** n → 1+…+n */
  tri: [[100], [10], [20], [50], [8]],
  /** (old KV heads, new KV heads) → new cache as a fraction of the old */
  gqr: [[32, 8], [32, 4], [16, 4], [64, 8], [32, 16]],
  /** two 2-d vectors → cosine similarity (retrieval) */
  cosr: [[1, 0, 0.6, 0.8], [3, 4, 6, 8], [1, 2, 2, 1], [0, 1, 1, 0], [2, 0, 1, 1]],
  /** (higher similarity, lower) → the gap */
  dsim: [[0.82, 0.31], [0.9, 0.2], [0.6, 0.4], [0.75, 0.25], [0.88, 0.4]],
  /** (chunks, kept) → how many are left out */
  dropk: [[5, 2], [8, 3], [6, 1], [10, 4], [4, 1]],
  /** (success per step, steps) → probability every step works */
  pow: [[0.95, 20], [0.99, 20], [0.9, 10], [0.8, 5], [0.95, 10]],
  /** (apps, tools) → connections saved by MCP: M·N − (M+N) */
  mcp: [[6, 4], [5, 5], [8, 3], [10, 2], [7, 3]],
  /** (calls, confirms) → calls that run without asking */
  freen: [[4, 1], [6, 2], [5, 1], [8, 3], [3, 1]],
  /** (actions, risky ones) → how many need a person */
  safen: [[5, 2], [6, 1], [8, 3], [4, 1], [7, 2]],
  /** untrusted chunks → how many must stay data, not instructions */
  unt: [[4], [6], [3], [8], [5]],
  /** (chance a call stays clean, calls) → chance the whole trace stays clean */
  srisk: [[0.9, 8], [0.9, 5], [0.8, 4], [0.95, 6], [0.9, 10]],
  /** (image side, patch side) → visual tokens */
  vitp: [[224, 16], [224, 14], [224, 32], [256, 16], [336, 14]],
  /** (image side, patch side) → patches along one edge */
  side: [[224, 16], [224, 14], [224, 32], [112, 16], [256, 16]],
  /** (predicted noise, true noise) → squared error */
  nse: [[0.2, 0.5], [0.7, 0.2], [0.9, 0.4], [0.3, 0.9], [1.2, 0.4]],
  /** five samples → the majority value */
  vote: [[12, 12, 15, 12, 9], [7, 7, 7, 3, 9], [3, 3, 9, 3, 1], [6, 2, 6, 6, 9], [4, 4, 7, 4, 1]],
  /** (short window, long window) in K → how many times longer */
  winx: [[4, 128], [4, 32], [2, 32], [8, 128], [4, 64]],
  /** (length, strong at the start, strong at the end) → weakly used middle */
  mid: [[100, 20, 20], [80, 10, 10], [50, 10, 10], [200, 40, 40], [128, 16, 16]],
  /** a fix loop: (success per step, steps) */
  loopn: [[0.9, 4], [0.95, 4], [0.8, 5], [0.9, 6], [0.99, 3]],
  /** passages kept vs retrieved */
  dropa: [[12, 3], [8, 2], [20, 5], [6, 2], [15, 4]],
  /** a screenshot cut into patches */
  vita: [[224, 16], [224, 32], [112, 16], [256, 16], [336, 16]],
  /** (w, gradient, learning rate) → w after one update */
  upd: [[0.5, 0.2, 0.1], [0.5, 0.4, 0.1], [1, 0.5, 0.2], [0.2, 0.2, 0.5], [2, 3, 0.1]],
  /** probability of the right token when every candidate is equal → −ln p */
  ceu: [[0.25], [0.5], [0.1], [0.2], [0.8]],
  /** perplexity of a uniform  k-way guess */
  pplR: [[4], [2], [8], [10], [5]],
  /** (experts, top-k) → percent of experts that run */
  moe: [[8, 2], [8, 1], [16, 2], [64, 8], [4, 2]],
  /** (teacher size, student size) → student as a percent of the teacher */
  dist: [[100, 10], [100, 25], [70, 7], [50, 5], [100, 40]],
  /** (human-written, model-written) → percent that the model wrote */
  syn: [[80, 20], [50, 50], [90, 10], [60, 40], [100, 25]],
} as const;
export type VarK = keyof typeof VAR;
