/* Station Api lab: labCost — per call / per day / per month cost from official per-million-token prices (calc.ts). */
import type { Env } from '../../legacy/runtime';
import { bar, byId, tr, wire } from '../kit';
import { CHECKED, PRICES, callCost } from '../calc';

export const LABS = [{ ids: ['labCost', 'ckModel', 'ckIn', 'ckOut', 'ckN', 'ckHit', 'ckOut2', 'ckBar'], hooks: [] as string[] }];

/** money with enough decimals to be readable for tiny amounts */
const yuan = (x: number) => (x === 0 ? '0' : x < 0.01 ? x.toPrecision(2) : x < 100 ? x.toFixed(2) : Math.round(x).toLocaleString('zh-CN'));

export function mount(env: Env) {
  const t = tr(env);
  const lab = () => {
    const sel = byId<HTMLSelectElement>(env, 'ckModel'); if (!sel) return;
    if (!sel.options.length) sel.innerHTML = PRICES.map((p) => `<option value="${p.id}">${env.lang === 'en' ? p.en : p.zh}</option>`).join('');
    const render = () => {
      const p = PRICES.find((x) => x.id === sel.value) ?? PRICES[0]!;
      const v = (id: string) => Math.max(0, Number(byId<HTMLInputElement>(env, id)?.value ?? 0) || 0);
      const inT = v('ckIn'), outT = v('ckOut'), n = v('ckN'), hit = v('ckHit') / 100;
      const hv = byId(env, 'ckHitV'); if (hv) hv.textContent = Math.round(hit * 100) + '%';
      const h = p.hitP == null ? 0 : hit;
      const cIn = (inT * (1 - h) * p.inP) / 1e6, cHit = (inT * h * (p.hitP ?? 0)) / 1e6, cOut = (outT * p.outP) / 1e6;
      const one = callCost(inT, outT, p, hit), day = one * n, month = day * 30;
      const out = byId(env, 'ckOut2'), b = byId(env, 'ckBar'); if (!out || !b) return;
      bar(b, [['in', cIn, t('输入', 'Input')], ['hit', cHit, t('缓存命中输入', 'Cached input')], ['outp', cOut, t('输出', 'Output')]]);
      out.dataset.month = month.toFixed(6);
      out.innerHTML = `<p>${t('一次', 'One call')} ≈ <b>${yuan(one)} ${t('元', 'yuan')}</b> · ${t('一天', 'per day')} ≈ <b>${yuan(day)} ${t('元', 'yuan')}</b> · ${t('一个月（30 天）', 'per month (30 days)')} ≈ <b class="lc-big">${yuan(month)} ${t('元', 'yuan')}</b></p>`
        + `<p class="u-legend"><span><i class="in"></i>${t('输入', 'Input')} ${yuan(cIn)}</span><span><i class="hit"></i>${t('缓存命中', 'Cache hit')} ${yuan(cHit)}</span><span><i class="outp"></i>${t('输出', 'Output')} ${yuan(cOut)}</span></p>`
        + `<p class="lc-note">${t('单价（元 / 百万词元）', 'Price (yuan per million tokens)')}${t('：', ': ')}${t('输入', 'input')} ${p.inP}${p.hitP != null ? ` · ${t('命中', 'hit')} ${p.hitP}` : ` · ${t('计算器里没录这家的缓存价，按普通输入算', 'no cache price entered here; billed as normal input')}`} · ${t('输出', 'output')} ${p.outP}${t('。', '. ')}${t(`核对于 ${CHECKED}`, `Checked ${CHECKED}`)}${t('，', ', ')}<a href="${p.url}" target="_blank" rel="noopener noreferrer">${t('官方价格页', 'official pricing')} ↗</a></p>`;
    };
    wire(env, ['ckModel', 'ckIn', 'ckOut', 'ckN', 'ckHit'], render);
    render();
  };
  return { labs: [lab], eager: () => {} };
}
