/* T7 extension labs (M8, R11 gaps 1, 7, 5): labDpo — the DPO loss for one pair; labSched — linear warmup + cosine decay
   and gradient-norm clipping; labPassK — the unbiased pass@k estimator. Maths in ../ymath (unit-tested). */
import type { Env } from '../../legacy/runtime';
import { byId, num, setTxt, tr, wire } from '../kit';
import { clipNorm, dpo, lrAt, passAtK, passNaive } from '../ymath';

export const LABS = [
  { ids: ['labDpo', 'dpW', 'dpOut'], hooks: [] as string[] },
  { ids: ['labSched', 'scW', 'scOut'], hooks: [] as string[] },
  { ids: ['labPassK', 'pkN', 'pkOut'], hooks: [] as string[] },
];
export const SCHED = { T: 1000, peak: 3e-4, min: 3e-5, g: [3, 4, 12] };
const sci = (x: number) => { if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x)) + 1e-12); return `${num(x / 10 ** e, 3)}×10<sup>${String(e).replace('-', '−')}</sup>`; };

export function mount(env: Env) {
  const t = tr(env);
  const goDpo = () => {
    const out = byId(env, 'dpOut'); if (!out) return;
    const v = wire(env, ['dpW', 'dpL', 'dpB'], draw);
    function draw() {
      const w = v('dpW'), l = v('dpL'), b = v('dpB'), r = dpo(w, l, b);
      setTxt(env, 'dpWv', num(w, 1)); setTxt(env, 'dpLv', num(l, 1)); setTxt(env, 'dpBv', num(b, 1));
      out!.innerHTML = `<table><tbody><tr><td>${t('隐式奖励（好 / 差）', 'Implicit reward (preferred / rejected)')} βΔ</td><td class="n">${num(r.rw)} / ${num(r.rl)}</td></tr>
<tr><td>${t('间隔', 'Margin')} β(Δ<sub>w</sub> − Δ<sub>l</sub>)</td><td class="n"><b data-k="m">${num(r.margin)}</b></td></tr>
<tr><td>${t('损失', 'Loss')} −log σ(${t('间隔', 'margin')})</td><td class="n"><b data-k="loss">${num(r.loss)}</b></td></tr>
<tr><td>${t('梯度权重', 'Gradient weight')} σ(−${t('间隔', 'margin')})</td><td class="n"><b data-k="w">${num(r.weight)}</b></td></tr></tbody></table>`;
    }
    draw();
  };
  const goSched = () => {
    const out = byId(env, 'scOut'); if (!out) return;
    const v = wire(env, ['scW', 'scT', 'scC'], draw);
    function draw() {
      const W = v('scW'), s = v('scT'), c = v('scC'), { T, peak, min, g } = SCHED;
      setTxt(env, 'scWv', String(W)); setTxt(env, 'scTv', String(s)); setTxt(env, 'scCv', String(c));
      const X = (x: number) => 8 + (x / T) * 304, Y = (y: number) => 104 - (y / peak) * 92;
      const pts = Array.from({ length: 101 }, (_, i) => i * 10).map((x) => `${X(x).toFixed(1)},${Y(lrAt(x, T, W, peak, min)).toFixed(1)}`).join(' ');
      const lr = lrAt(s, T, W, peak, min), k = clipNorm(g, c);
      out!.innerHTML = `<svg class="x-fig" viewBox="0 0 320 120" role="img" aria-label="${t('学习率随步数变化的曲线', 'Learning rate against step')}"><path d="M8 104H312M8 8V104" stroke="#94a3b8" fill="none"/><polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="2"/>${W ? `<path d="M${X(W).toFixed(1)} 8V104" stroke="#f59e0b" stroke-dasharray="3 3"/>` : ''}<circle cx="${X(s).toFixed(1)}" cy="${Y(lr).toFixed(1)}" r="4.5" fill="#dc2626"/></svg>
<p>${t('第', 'Step')} ${s}${t(' 步', '')}${t('：学习率', ': learning rate')} = <b data-k="lr">${sci(lr)}</b> <span data-k="phase">${s < W ? t('（预热中）', '(warming up)') : t('（余弦衰减）', '(cosine decay)')}</span></p>
<p>‖g‖ = <b data-k="norm">${num(k.norm)}</b> · ${t('缩放', 'scale')} = <b data-k="scale">${num(k.scale)}</b> · ${t('裁剪后', 'clipped')} g = (<span data-k="g">${k.g.map((x) => num(x, 3)).join(', ')}</span>)</p>`;
    }
    draw();
  };
  const goPassK = () => {
    const out = byId(env, 'pkOut'); if (!out) return;
    const v = wire(env, ['pkN', 'pkC', 'pkK'], draw);
    function draw() {
      const n = v('pkN'), cEl = byId<HTMLInputElement>(env, 'pkC'), kEl = byId<HTMLInputElement>(env, 'pkK');
      if (cEl) cEl.max = String(n); if (kEl) kEl.max = String(n);
      const c = Math.min(v('pkC'), n), k = Math.min(v('pkK'), n);
      if (cEl && Number(cEl.value) !== c) cEl.value = String(c); if (kEl && Number(kEl.value) !== k) kEl.value = String(k);
      setTxt(env, 'pkNv', String(n)); setTxt(env, 'pkCv', String(c)); setTxt(env, 'pkKv', String(k));
      out!.innerHTML = `<table><tbody><tr><td>${t('无偏估计', 'Unbiased')} 1 − C(n−c, k)/C(n, k)</td><td class="n"><b data-k="pk">${num(passAtK(n, c, k))}</b></td></tr>
<tr><td>${t('直接代入', 'Plug-in')} 1 − (1 − c/n)<sup>k</sup></td><td class="n"><b data-k="naive">${num(passNaive(n, c, k))}</b></td></tr></tbody></table>`;
    }
    draw();
  };
  return { labs: [goDpo, goSched, goPassK], eager: () => {} };
}
