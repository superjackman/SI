/* T3 extension lab (M4, gap audit B1): labVote — self-consistency, i.e. sample N chains and take the majority answer. Exact binomial maths. */
import type { Env } from '../../legacy/runtime';
import { byId, fmt, num, setTxt, tr, wire } from '../kit';
import { majority } from '../xmath';

export const LABS = [{ ids: ['labVote', 'voP', 'voN', 'voL', 'voOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const out = byId(env, 'voOut'); if (!out) return;
    const v = wire(env, ['voP', 'voN', 'voL'], draw);
    function draw() {
      const p = v('voP'), N = v('voN'), Lt = v('voL');
      setTxt(env, 'voPv', num(p, 2)); setTxt(env, 'voNv', String(N)); setTxt(env, 'voLv', fmt(env, Lt));
      const acc = majority(p, N), Ns = [1, 3, 5, 9, 15, 31];
      const verdict = p > 0.5 ? t('p > 0.5：多投几票会更准，但收益递减。', 'p > 0.5: more votes help, with diminishing returns.')
        : p < 0.5 ? t('p < 0.5：投票会把错误放大，越投越差。', 'p < 0.5: voting amplifies the error; more votes make it worse.')
          : t('p = 0.5：投票没有帮助。', 'p = 0.5: voting does not help.');
      out!.innerHTML = `<p>${t('投票后正确率', 'Voted accuracy')} = <b data-k="acc">${num(acc, 3)}</b> · ${t('总 token', 'Total tokens')} = <b data-k="tok">${fmt(env, N * Lt)}</b></p>
<table><tr><th>N</th><th>${t('正确率', 'Accuracy')}</th><th>${t('总 token', 'Tokens')}</th></tr>${Ns.map((n) => { const a = majority(p, n); return `<tr${n === N ? ' style="font-weight:700"' : ''}><td class="n">${n}</td><td class="n"><span style="display:inline-block;height:8px;width:${Math.round(a * 60)}px;background:#4338ca;border-radius:2px;margin-right:4px"></span>${num(a, 3)}</td><td class="n">${fmt(env, n * Lt)}</td></tr>`; }).join('')}</table>
<p data-k="verdict">${verdict}</p>`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
