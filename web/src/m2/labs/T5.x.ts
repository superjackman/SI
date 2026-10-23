/* T5 extension lab (M8, R11 gap 6): labLora — trainable parameters of full fine-tuning (d·k) vs LoRA (r(d + k)). */
import type { Env } from '../../legacy/runtime';
import { byId, fmt, num, setTxt, tr, wire } from '../kit';
import { loraParams } from '../ymath';

export const LABS = [{ ids: ['labLora', 'loR', 'loOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const out = byId(env, 'loOut'); if (!out) return;
    const v = wire(env, ['loD', 'loK', 'loR'], draw);
    function draw() {
      const d = v('loD'), k = v('loK'), r = v('loR'), p = loraParams(d, k, r);
      setTxt(env, 'loRv', String(r));
      out!.innerHTML = `<table><tbody><tr><td>${t('全量微调', 'Full fine-tuning')} d × k</td><td class="n"><b data-k="full">${fmt(env, p.full)}</b></td></tr>
<tr><td>LoRA r × (d + k)</td><td class="n"><b data-k="lora">${fmt(env, p.lora)}</b></td></tr>
<tr><td>${t('占比', 'Share')}</td><td class="n"><b data-k="pct">${num(p.pct, 4)}%</b></td></tr></tbody></table>
<div class="lo-bar" aria-hidden="true"><span style="width:${Math.max(0.5, Math.min(100, p.pct)).toFixed(2)}%"></span></div>`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
