/* Station K5 lab: labGradCheck — backprop gradients of a 2-weight net vs central differences (ε = 1e-4). */
import type { Env } from '../../legacy/runtime';
import { byId, num, setTxt, tr, wire } from '../kit';
import { gradCheck } from '../kmath';

export const LABS = [{ ids: ['labGradCheck', 'gcW1', 'gcW2', 'gcOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const out = byId(env, 'gcOut'); if (!out) return;
    const v = wire(env, ['gcW1', 'gcW2'], draw);
    function draw() {
      const w1 = v('gcW1'), w2 = v('gcW2'); setTxt(env, 'gcW1v', num(w1)); setTxt(env, 'gcW2v', num(w2));
      const g = gradCheck(w1, w2), e = (x: number) => (x === 0 ? '0' : x.toExponential(1).replace('-', '−'));
      const ok = Math.max(...g.rel) < 1e-6;
      out!.innerHTML = `<p>h = ${num(g.h, 4)} · ŷ = ${num(g.yh, 4)} · L = ${num(g.L, 5)} · σ′ = h(1 − h) = <b data-k="sp">${num(g.sp, 4)}</b></p>
<table><tr><th></th><th>${t('反向传播', 'Backprop')}</th><th>${t('数值差分', 'Numerical')}</th><th>${t('相对误差', 'Rel. error')}</th></tr>
${(['∂L/∂w₁', '∂L/∂w₂'] as const).map((n, i) => `<tr><td>${n}</td><td class="n" data-k="bp${i}">${num(g.bp[i]!, 8)}</td><td class="n" data-k="num${i}">${num(g.num[i]!, 8)}</td><td class="n" data-k="rel${i}">${e(g.rel[i]!)}</td></tr>`).join('')}</table>
<p class="${ok ? 'k-ok' : 'k-bad'}" data-k="verdict">${ok ? t('一致：推导正确', 'They agree: the derivation is right') : t('不一致：推导有错', 'Mismatch: the derivation is wrong')}</p>`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
