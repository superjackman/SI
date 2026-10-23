/* Station K3 lab: labSoftmax — scores → probabilities (with temperature), entropy, cross-entropy and its gradient. */
import type { Env } from '../../legacy/runtime';
import { byId, num, setTxt, tr, wire } from '../kit';
import { softmaxT, TS } from '../kmath';

export const LABS = [{ ids: ['labSoftmax', 'smZ0', 'smZ1', 'smZ2', 'smT', 'smY', 'smOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const out = byId(env, 'smOut'); if (!out) return;
    const v = wire(env, ['smZ0', 'smZ1', 'smZ2', 'smT', 'smY'], draw);
    function draw() {
      const z = [v('smZ0'), v('smZ1'), v('smZ2')], T = TS[v('smT')] ?? 1, y = v('smY');
      z.forEach((x, i) => setTxt(env, `smZ${i}v`, num(x))); setTxt(env, 'smTv', num(T));
      const r = softmaxT(z, T, y);
      out!.innerHTML = `<table><tr><th>${t('词', 'Word')}</th><th>z</th><th>p</th><th>∂L/∂z</th></tr>${z.map((x, i) => `<tr${i === y ? ' style="font-weight:700"' : ''}><td>${i + 1}${i === y ? ' ✓' : ''}</td><td class="n">${num(x)}</td>
<td class="n" data-k="p${i}"><span style="display:inline-block;height:8px;width:${Math.round(r.p[i]! * 60)}px;background:#4338ca;border-radius:2px;margin-right:4px"></span>${num(r.p[i]!, 3)}</td><td class="n" data-k="g${i}">${num(r.grad[i]!, 3)}</td></tr>`).join('')}</table>
<p>${t('熵', 'Entropy')} H(p) = <b data-k="H">${num(r.H, 3)}</b> ${t('（最大 ln 3 ≈ 1.099）', '(max ln 3 ≈ 1.099)')} · ${t('交叉熵损失', 'Cross-entropy loss')} −ln p<sub>y</sub> = <b data-k="ce">${num(r.ce, 3)}</b></p>`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
