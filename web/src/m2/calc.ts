/* R25: pure calculators for the 🔌 API (labCost) and 💻 offline (labMem) stations. Prices are 元 per million tokens as
   listed on each vendor's official pricing page (checked 2026-10-24, see /workspace/si-r25-sources.md); bits/weight are the
   llama.cpp quantize README figures for Llama-3.1-8B; the KV figure is computed from Qwen3-8B's published config.json
   (36 layers × 8 KV heads × head_dim 128, 16-bit). Only imported from labs, so it lands in a lazy chunk. */

export type Price = { id: string; zh: string; en: string; inP: number; hitP: number | null; outP: number; url: string };
export const CHECKED = '2026-10-24';
export const PRICES: Price[] = [
  { id: 'dsf', zh: 'DeepSeek · deepseek-flash（高峰时段）', en: 'DeepSeek · deepseek-flash (peak hours)', inP: 2, hitP: 0.04, outP: 8, url: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing' },
  { id: 'dsp', zh: 'DeepSeek · deepseek-v4-pro', en: 'DeepSeek · deepseek-v4-pro', inP: 9, hitP: 0.3, outP: 27, url: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing' },
  { id: 'glm', zh: '智谱 · GLM-5.3', en: 'Zhipu · GLM-5.3', inP: 8, hitP: 2, outP: 28, url: 'https://docs.bigmodel.cn/cn/guide/start/pricing' },
  { id: 'glmf', zh: '智谱 · GLM-5.3-Flash', en: 'Zhipu · GLM-5.3-Flash', inP: 0.8, hitP: 0.23, outP: 2.8, url: 'https://docs.bigmodel.cn/cn/guide/start/pricing' },
  { id: 'qwen', zh: '百炼 · qwen3.7-plus（≤256K 不思考）', en: 'Alibaba · qwen3.7-plus (≤256K, thinking off)', inP: 2, hitP: null, outP: 8, url: 'https://help.aliyun.com/zh/model-studio/model-pricing' },
  { id: 'db', zh: '火山方舟 · doubao-seed-2.1-lite', en: 'Volcano Ark · doubao-seed-2.1-lite', inP: 0.8, hitP: 0.16, outP: 2.7, url: 'https://www.volcengine.com/docs/82379/1544106' },
  { id: 'ernie', zh: '百度千帆 · ERNIE-5.1（≤32k）', en: 'Baidu Qianfan · ERNIE-5.1 (≤32k)', inP: 4, hitP: null, outP: 18, url: 'https://cloud.baidu.com/doc/qianfan/s/wmh4sv6ya' },
  { id: 'hy', zh: '腾讯混元 · Hunyuan-a13b', en: 'Tencent Hunyuan · Hunyuan-a13b', inP: 0.5, hitP: null, outP: 2, url: 'https://cloud.tencent.com/document/product/1729/97731' },
  { id: 'mm', zh: 'MiniMax · M3.1-Flash', en: 'MiniMax · M3.1-Flash', inP: 1, hitP: 0.1, outP: 4, url: 'https://platform.minimaxi.com/docs/pricing/overview' },
];

/** 元 for one call: input tokens (a share `hit` of them served from cache) + output tokens; prices per million tokens */
export function callCost(inTok: number, outTok: number, p: { inP: number; hitP: number | null; outP: number }, hit = 0) {
  const h = p.hitP == null ? 0 : Math.min(1, Math.max(0, hit));
  return (inTok * (1 - h) * p.inP + inTok * h * (p.hitP ?? 0) + outTok * p.outP) / 1e6;
}

/** llama.cpp bits per weight (Llama-3.1-8B, quantize README) */
export const BPW = { F16: 16, Q8_0: 8.5008, Q4_K_M: 4.8944 } as const;
export type Quant = keyof typeof BPW;
/** bytes of KV cache per token for Qwen3-8B at 16 bits: 2 (K and V) × 36 layers × 8 KV heads × 128 × 2 bytes */
export const KV_TOKEN_BYTES = 2 * 36 * 8 * 128 * 2;
/** weights in GB (10^9 bytes): parameters (billions) × bits per weight ÷ 8 */
export const weightsGB = (paramsB: number, bpw: number) => (paramsB * bpw) / 8;
/** KV cache in GB for `ctx` tokens; scaled by `kvScale` (1 = the Qwen3-8B shape) */
export const kvGB = (ctx: number, kvScale = 1) => (ctx * KV_TOKEN_BYTES * kvScale) / 1e9;
/** the verdict when `need` GB must fit in `have` GB: 'ok' (≥ 20% left), 'tight' (fits, < 20% left), 'no' */
export function fitVerdict(need: number, have: number): 'ok' | 'tight' | 'no' {
  if (need > have) return 'no';
  return have - need >= have * 0.2 ? 'ok' : 'tight';
}
