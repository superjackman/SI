/* T7 extension lab (M7, gap audit A10): labPool — 2×2 max pooling (stride 2) over an illustrative 8×8 feature map,
   shifted right by 0–2 cells. Exact counts of changed cells before and after pooling. */
import type { Env } from '../../legacy/runtime';
import { byId, setTxt, tr, wire } from '../kit';
import { changed, maxPool, POOL_MAP, shiftRight, type Grid } from '../xmath';

export const LABS = [{ ids: ['labPool', 'plS', 'plOut'], hooks: [] as string[] }];

const grid = (m: Grid, cls: string, hot?: Set<number>) => `<table class="pl-g ${cls}">${m.map((row, i) => `<tr>${row.map((v, j) => `<td${v ? ` class="${hot?.has(i * row.length + j) ? 'on sw' : 'on'}"` : ''}>${v || ''}</td>`).join('')}</tr>`).join('')}</table>`;

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const out = byId(env, 'plOut'); if (!out) return;
    const v = wire(env, ['plS'], draw);
    function draw() {
      const d = v('plS'), base = maxPool(POOL_MAP, 2, 2).out, m = shiftRight(POOL_MAP, d), p = maxPool(m, 2, 2);
      setTxt(env, 'plSv', String(d));
      const raw = Math.round(changed(POOL_MAP, m) * 64), pooled = Math.round(changed(base, p.out) * 16);
      const hot = new Set(p.sw.flat().filter((k) => m[Math.floor(k / 8)]![k % 8]! > 0));
      out!.innerHTML = `<div class="pl-row"><figure>${grid(m, 'in', hot)}<figcaption>${t('输入 8×8（框 = 被选中的最大值）', 'Input 8×8 (outlined = chosen maxima)')}</figcaption></figure>
<figure>${grid(p.out, 'out')}<figcaption>${t('池化后 4×4', 'Pooled 4×4')}</figcaption></figure></div>
<p>${t('输入变了', 'Input cells changed')}: <b data-k="raw">${raw}</b> / 64 · ${t('池化后变了', 'Pooled cells changed')}: <b data-k="pooled">${pooled}</b> / 16</p>
<p data-k="verdict">${d === 0 ? t('没有平移：这是基准。', 'No shift: this is the baseline.') : d === 1 ? t('挪 1 格：大多数最大值还在原来的窗口里，池化结果几乎不变。', 'Shift by 1: most maxima stay in their window, so the pooled map barely changes.') : t('挪 2 格 = 一整个窗口：池化结果也整体挪了一格。', 'Shift by 2 = one whole window: the pooled map moves by one cell too.')}</p>`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
