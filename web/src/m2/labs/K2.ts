/* Station K2 lab: labMat — a 2×2 matrix maps the unit square to a parallelogram whose signed area is det. */
import type { Env } from '../../legacy/runtime';
import { byId, num, setTxt, tr, wire } from '../kit';
import { apply2, det2 } from '../kmath';

export const LABS = [{ ids: ['labMat', 'matA', 'matB', 'matC', 'matD', 'matPlot', 'matOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const svg = byId(env, 'matPlot'), out = byId(env, 'matOut'); if (!svg || !out) return;
    const ids = ['matA', 'matB', 'matC', 'matD'], v = wire(env, ids, draw);
    function draw() {
      const [a, b, c, d] = ids.map(v) as [number, number, number, number];
      ids.forEach((id, i) => setTxt(env, id + 'v', num([a, b, c, d][i]!)));
      const S = 26, P = (x: number, y: number) => `${(160 + x * S).toFixed(1)},${(120 - y * S).toFixed(1)}`;
      const sq: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const img = sq.map(([x, y]) => apply2(a, b, c, d, x, y)), D = det2(a, b, c, d);
      const fill = D > 0 ? '#dbeafe' : D < 0 ? '#fee2e2' : '#f3f4f6', stroke = D > 0 ? '#1d4ed8' : D < 0 ? '#dc2626' : '#6b7280';
      let g = ''; for (let k = -6; k <= 6; k++) g += `<line x1="${160 + k * S}" y1="5" x2="${160 + k * S}" y2="235" stroke="#f1f5f9"/>`;
      for (let k = -4; k <= 4; k++) g += `<line x1="5" y1="${120 - k * S}" x2="315" y2="${120 - k * S}" stroke="#f1f5f9"/>`;
      svg!.innerHTML = `${g}<line x1="5" y1="120" x2="315" y2="120" stroke="#cbd5e1"/><line x1="160" y1="5" x2="160" y2="235" stroke="#cbd5e1"/>
<polygon points="${sq.map(([x, y]) => P(x, y)).join(' ')}" fill="none" stroke="#94a3b8" stroke-dasharray="4 3"/>
<polygon points="${img.map(([x, y]) => P(x, y)).join(' ')}" fill="${fill}" fill-opacity=".8" stroke="${stroke}" stroke-width="2"/>
<line x1="160" y1="120" x2="${P(a, c).split(',')[0]}" y2="${P(a, c).split(',')[1]}" stroke="#b45309" stroke-width="3"/>
<line x1="160" y1="120" x2="${P(b, d).split(',')[0]}" y2="${P(b, d).split(',')[1]}" stroke="#4338ca" stroke-width="3"/>`;
      const kind = D === 0 ? `<span class="k-bad">${t('行列式为 0：压成线或点，不可逆', 'Determinant 0: collapsed to a line or point, not invertible')}</span>`
        : D < 0 ? `<span class="k-warn">${t('行列式为负：图形翻转了', 'Negative determinant: the shape is flipped')}</span>`
          : `<span class="k-ok">${t('行列式为正：方向保持', 'Positive determinant: orientation kept')}</span>`;
      out!.innerHTML = `<table><tr><td><span style="color:#b45309">■</span> ${t('第一列 Ae₁', 'Column 1, Ae₁')}</td><td class="n">(${num(a)}, ${num(c)})</td></tr>
<tr><td><span style="color:#4338ca">■</span> ${t('第二列 Ae₂', 'Column 2, Ae₂')}</td><td class="n">(${num(b)}, ${num(d)})</td></tr>
<tr><td>det = ad − bc</td><td class="n" data-k="det">${num(D)}</td></tr><tr><td>${t('面积 |det|', 'Area |det|')}</td><td class="n" data-k="area">${num(Math.abs(D))}</td></tr></table><p>${kind}</p>`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
