/* K4 extension lab (M12, R24): labBatch — N examples, batch size B, E epochs → steps per epoch, last batch, total steps.
   The numbers are toy values the reader drags; the counting is ../cfbatch (unit-tested). */
import type { Env } from '../../legacy/runtime';
import { byId, fmt, setTxt, tr, wire } from '../kit';
import { plan } from '../cfbatch';

export const LABS = [{ ids: ['labBatch', 'bcN', 'bcB', 'bcE', 'bcD', 'bcBar', 'bcOut'], hooks: [] as string[] }];
const MAXB = 60;

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const out = byId(env, 'bcOut'), bar = byId(env, 'bcBar'), ck = byId<HTMLInputElement>(env, 'bcD'); if (!out || !bar || !ck) return;
    const v = wire(env, ['bcN', 'bcB', 'bcE'], draw);
    ck.addEventListener('change', draw);
    function draw() {
      const N = v('bcN'), B = v('bcB'), E = v('bcE'), drop = ck!.checked, r = plan(N, B, E, drop);
      setTxt(env, 'bcNv', String(N)); setTxt(env, 'bcBv', String(B)); setTxt(env, 'bcEv', String(E));
      const full = Math.floor(N / B), rest = N % B;
      const sizes = Array.from({ length: r.per }, (_, i) => (i < full ? B : rest));
      const shown = sizes.slice(0, MAXB);
      bar!.innerHTML = shown.map((s, i) => `<span class="bc-b${s < B ? ' short' : ''}" style="flex:${s} 0 0" title="${t(`第 ${i + 1} 批：${s} 个`, `Batch ${i + 1}: ${s}`)}"></span>`).join('')
        + (drop && rest ? `<span class="bc-b gone" style="flex:${rest} 0 0" title="${t(`丢掉 ${rest} 个`, `${rest} dropped`)}"></span>` : '')
        + (sizes.length > MAXB ? `<span class="bc-more">+${sizes.length - MAXB}</span>` : '');
      bar!.setAttribute('aria-label', t(`第 1 轮：${r.per} 批`, `Epoch 1: ${r.per} batches`));
      const f = (n: number) => fmt(env, n);
      out!.innerHTML = `<table><tbody>
<tr><td>${t('每轮步数', 'Steps per epoch')}</td><td class="n"><b data-k="per">${f(r.per)}</b></td><td>${drop ? `⌊${f(N)} ÷ ${f(B)}⌋` : `⌈${f(N)} ÷ ${f(B)}⌉`}</td></tr>
<tr><td>${t('最后一批', 'Last batch')}</td><td class="n"><b data-k="last">${r.per ? f(r.last) : '—'}</b></td><td>${rest && !drop ? t('不满一批', 'short') : rest && drop ? t(`丢掉 ${rest} 个`, `${rest} dropped`) : t('正好满', 'full')}</td></tr>
<tr><td>${t('总步数', 'Total steps')}</td><td class="n"><b data-k="total">${f(r.total)}</b></td><td>${f(r.per)} × ${f(E)}</td></tr>
<tr><td>${t('总共用到的样本次数', 'Examples processed')}</td><td class="n"><b data-k="seen">${f(r.seen)}</b></td><td>${t('每个样本每轮一次', 'each example once per epoch')}</td></tr>
</tbody></table>${r.per === 0 ? `<p class="k-bad" data-k="zero">${t('批比全部样本还大，又丢掉不满的一批：一步都走不了。', 'The batch is bigger than all the data and the short batch is dropped: not a single step.')}</p>` : ''}`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
