/* T7 R14 lab: labChin — the Chinchilla parametric loss L(N, D) and its compute-optimal split under C ≈ 6ND
   (Hoffmann et al. 2022, approach 3 constants). Maths in ../zmath (unit-tested). */
import type { Env } from '../../legacy/runtime';
import { byId, num, setTxt, tr, wire } from '../kit';
import { big, chinLoss, chinOpt, isoLoss } from '../zmath';

export const LABS = [{ ids: ['labChin', 'chC', 'chOut'], hooks: [] as string[] }];
export const GOPHER_C = 5.76e23;
export const sci = (x: number) => { const e = Math.floor(Math.log10(x) + 1e-12); return `${num(x / 10 ** e, 2)}×10<sup>${String(e).replace('-', '−')}</sup>`; };

export function mount(env: Env) {
  const t = tr(env), lang = env.lang === 'en' ? 'en' : 'zh';
  const goChin = () => {
    const out = byId(env, 'chOut'); if (!out) return;
    let exact: number | null = null; // set by the Gopher button; any slider move goes back to 10^slider
    const v = wire(env, ['chC', 'chK'], draw);
    byId(env, 'chC')?.addEventListener('input', () => { exact = null; draw(); });
    byId(env, 'chG')?.addEventListener('click', () => { exact = GOPHER_C; const s = byId<HTMLInputElement>(env, 'chC'); if (s) s.value = '23.8'; draw(); });
    function draw() {
      const C = exact ?? 10 ** v('chC'), k = v('chK'), o = chinOpt(C);
      setTxt(env, 'chCv', exact ? 'log₁₀(5.76×10²³) ≈ 23.76' : num(v('chC'), 1)); setTxt(env, 'chKv', String(k).replace('-', '−'));
      const N = o.N * 2 ** k, D = C / (6 * N), L = chinLoss(N, D);
      const ks = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1), ls = ks.map((x) => isoLoss(C, o.N * 2 ** x));
      const lo = o.L, hi = Math.max(...ls), X = (x: number) => 30 + ((x + 4) / 8) * 280, Y = (y: number) => 96 - ((y - lo) / (hi - lo || 1)) * 84;
      const pts = ks.map((x, i) => `${X(x).toFixed(1)},${Y(ls[i]!).toFixed(1)}`).join(' ');
      const tick = (x: number, s: string) => `<text x="${X(x)}" y="113" text-anchor="middle" font-size="10" fill="#475569">${s}</text>`;
      out!.innerHTML = `<p>C = <b data-k="c">${sci(C)}</b> FLOPs</p>
<svg class="x-fig" viewBox="0 0 320 120" role="img" aria-label="${t('同一算力下损失随模型大小变化的曲线', 'Loss against model size at a fixed compute budget')}"><path d="M30 100H312M30 8V100" stroke="#94a3b8" fill="none"/><text x="4" y="14" font-size="10" fill="#475569">L</text>${tick(-4, '÷16')}${tick(0, 'N<tspan font-size="7">opt</tspan>')}${tick(4, '×16')}<polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="2"/><circle cx="${X(0)}" cy="${Y(lo).toFixed(1)}" r="4" fill="#16a34a"/><circle cx="${X(k)}" cy="${Y(L).toFixed(1)}" r="4.5" fill="none" stroke="#dc2626" stroke-width="2"/></svg>
<table><tbody><tr><th colspan="2">${t('最优（绿点）', 'Optimum (green dot)')}</th></tr>
<tr><td>${t('参数量', 'Parameters')} N<sub>opt</sub></td><td class="n"><b data-k="n">${big(o.N, lang)}</b></td></tr>
<tr><td>${t('训练 token', 'Training tokens')} D<sub>opt</sub></td><td class="n"><b data-k="d">${big(o.D, lang)}</b></td></tr>
<tr><td>${t('每个参数的 token 数', 'Tokens per parameter')} D/N</td><td class="n"><b data-k="r">${num(o.ratio, 1)}</b></td></tr>
<tr><td>${t('拟合损失', 'Fitted loss')} L</td><td class="n"><b data-k="l">${num(o.L, 3)}</b></td></tr>
<tr><th colspan="2">${t('你选的大小（红圈）', 'Your size (red ring)')} N = N<sub>opt</sub> × 2<sup>${String(k).replace('-', '−')}</sup></th></tr>
<tr><td>N / D</td><td class="n"><span data-k="yn">${big(N, lang)}</span> / <span data-k="yd">${big(D, lang)}</span></td></tr>
<tr><td>${t('拟合损失（比最优多）', 'Fitted loss (above optimum)')}</td><td class="n"><b data-k="yl">${num(L, 3)}</b> (+<span data-k="dl">${num(L - o.L, 4)}</span>)</td></tr></tbody></table>
<p class="tag-note">N<sub>opt</sub> ∝ C<sup><span data-k="a">${num(o.a, 3)}</span></sup>, D<sub>opt</sub> ∝ C<sup><span data-k="b">${num(o.b, 3)}</span></sup> · ${t('论文拟合出的公式，不是任何产品的实测。', 'The paper’s fitted formula, not a measurement of any product.')}</p>`;
    }
    draw();
  };
  return { labs: [goChin], eager: () => {} };
}
