/* Station Loc lab: labMem — will this model fit? weights (llama.cpp bits/weight) + KV cache (Qwen3-8B shape, scaled). */
import type { Env } from '../../legacy/runtime';
import { bar, byId, tr, wire } from '../kit';
import { BPW, fitVerdict, kvGB, weightsGB, type Quant } from '../calc';

export const LABS = [{ ids: ['labMem', 'lmP', 'lmQ', 'lmC', 'lmM', 'lmT', 'lmOut', 'lmBar'], hooks: [] as string[] }];
/** runtime overhead in GB (illustrative) */
const OVER = 1;

export function mount(env: Env) {
  const t = tr(env);
  const lab = () => {
    const out = byId(env, 'lmOut'), b = byId(env, 'lmBar'); if (!out || !b) return;
    const val = (id: string) => byId<HTMLSelectElement>(env, id)?.value ?? '';
    const render = () => {
      const pB = Number(val('lmP')) || 8, q = (val('lmQ') || 'Q4_K_M') as Quant, ctx = Number(val('lmC')) || 8192, have = Number(val('lmM')) || 16, ty = val('lmT') || 'vram';
      const w = weightsGB(pB, BPW[q] ?? BPW.Q4_K_M), kv = kvGB(ctx, pB / 8), need = w + kv + OVER;
      const v = fitVerdict(need, have);
      bar(b, [['w', w, t('权重', 'Weights')], ['kv', kv, t('KV 缓存', 'KV cache')], ['ov', OVER, t('运行开销', 'Overhead')], ['free', Math.max(0, have - need), t('剩余', 'Free')]], Math.max(have, need));
      const g = (x: number) => x.toFixed(1);
      const V = { ok: t('✅ 装得下', '✅ Fits'), tight: t('⚠️ 很紧：能装下，但几乎没有余量', '⚠️ Tight: it fits with almost no room left'), no: t('❌ 装不下', '❌ Does not fit') }[v];
      const tip = v === 'no'
        ? t('试试：换更小的模型、更低的量化档，或者把上下文调短。', 'Try a smaller model, a lower quantization level, or a shorter context.')
        : ty === 'ram' ? t('用 CPU 和普通内存能跑，但通常比显卡慢很多。', 'It runs on CPU and RAM, but usually much slower than on a GPU.')
          : ty === 'uni' ? t('统一内存由系统、其他程序和显卡共用，实际能给模型的比总数少。', 'Unified memory is shared with the system and other apps, so the model gets less than the total.')
            : t('显存放不下时，工具可以把一部分放到内存里，但会变慢。', 'If VRAM runs out, runners can spill part into RAM, but it slows down.');
      out.dataset.verdict = v;
      out.innerHTML = `<p>${t('大约需要', 'Needs about')} <b class="lc-big">${g(need)} GB</b> ${t('，你有', '; you have')} <b>${have} GB</b> → <b>${V}</b></p>`
        + `<p class="u-legend"><span><i class="w"></i>${t('权重', 'Weights')} ${g(w)}</span><span><i class="kv"></i>${t('KV 缓存', 'KV cache')} ${g(kv)}</span><span><i class="ov"></i>${t('运行开销（示意）', 'Overhead (illustrative)')} ${OVER}</span></p>`
        + `<p class="lc-note">${t(`权重 = ${pB} × 10 亿 × ${BPW[q]} 位 ÷ 8。`, `Weights = ${pB} billion × ${BPW[q]} bits ÷ 8.`)}${tip}</p>`;
      out.classList.toggle('warn', v !== 'ok');
    };
    wire(env, ['lmP', 'lmQ', 'lmC', 'lmM', 'lmT'], render);
    render();
  };
  return { labs: [lab], eager: () => {} };
}
