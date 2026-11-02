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
  /** stage pages (D/n) that must use it */
  st: number[];
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
  // ── step 8 · KC08 parameter count, K10 FFN width ──
  p12: {
    zh: '约 `12 × d²` 个参数（注意力 `4 × d²` + 前馈 `8 × d²`）',
    en: 'about `12 × d²` parameters (attention `4 × d²` + feed-forward `8 × d²`)',
    ap: ['粗算，不含词向量表', 'rough, embeddings not counted'],
    cards: ['KC08'], st: [8],
    ban: [/\b(12|4|8)\s*[·×*]?\s*d²/],
  },
  ffn: {
    zh: '约 4 倍', en: 'about 4×',
    ap: ['常见值，各模型不同', 'typical, varies by model'],
    cards: ['K10'], st: [8],
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
  // ── steps 7 and 8 · KM12 one attention example ──
  attS0: {
    zh: '[16, 8, 0]', en: '[16, 8, 0]',
    cards: ['KM12'], st: [8],
    ban: [/\[16,\s*8,\s*0\]|\[8,\s*4,\s*0\]/],
  },
  attK: {
    zh: '`d_k = 64`，除以 `√64 = 8`', en: '`d_k = 64`, divide by `√64 = 8`',
    cards: ['KM12'], st: [8],
    ban: [/√\s*64|d_k\s*=\s*64/],
  },
  attSat: {
    zh: '[0.9997, 0.0003, 0.0000]', en: '[0.9997, 0.0003, 0.0000]',
    cards: ['KM12'], st: [8],
    ban: [/0\.9997|98\.17\s*%/],
  },
  attS1: {
    zh: '[2, 1, 0]', en: '[2, 1, 0]',
    cards: ['KM12'], st: [7, 8],
    ban: [/\[2,\s*1,\s*0\]|\[1,\s*0\.5,\s*0\]/],
  },
  attW: {
    zh: '[0.665, 0.245, 0.090]', en: '[0.665, 0.245, 0.090]',
    cards: ['KM12'], st: [7, 8],
    ban: [/0\.665|0\.245|50\.6\s*%/],
  },
  // ── step 12 · K15 / K12 temperature, KC14 KV cache ──
  tS: {
    zh: '4.1 / 1.3 / 1.0', en: '4.1 / 1.3 / 1.0',
    cards: ['K15', 'K12'], st: [12],
    ban: [/4\.1\s*\/\s*1\.3/],
  },
  t1: {
    zh: '90% / 5.5% / 4.1%', en: '90% / 5.5% / 4.1%',
    cards: ['K15', 'K12'], st: [12],
    ban: [/5\.5\s*%/],
  },
  t05: {
    zh: '99.4% / 0.4% / 0.2%', en: '99.4% / 0.4% / 0.2%',
    cards: ['K15'], st: [12],
    ban: [/99\.4\s*%/],
  },
  t2: {
    zh: '69% / 17% / 15%', en: '69% / 17% / 15%',
    cards: ['K15'], st: [12],
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
    cards: ['KA07'], st: [15],
    ban: [/14\s*×\s*14\s*=\s*196/],
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
