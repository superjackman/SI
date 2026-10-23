/* Station K1 lab: labSecant — the secant slope (f(x₀+h) − f(x₀))/h approaches f′(x₀) as h shrinks. */
import type { Env } from '../../legacy/runtime';
import { byId, num, setTxt, tr, wire } from '../kit';
import { F, HS, secant, type Fn } from '../kmath';

export const LABS = [{ ids: ['labSecant', 'secF', 'secX', 'secH', 'secPlot', 'secOut'], hooks: [] as string[] }];
const YR: Record<Fn, [number, number]> = { sq: [-1, 9.5], sig: [-0.1, 1.1], sin: [-1.25, 1.25] };

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const sel = byId<HTMLSelectElement>(env, 'secF'), svg = byId(env, 'secPlot'), out = byId(env, 'secOut');
    if (!sel || !svg || !out) return;
    const v = wire(env, ['secF', 'secX', 'secH'], draw);
    function draw() {
      const fn = (sel!.value as Fn) in F ? (sel!.value as Fn) : 'sq', x0 = v('secX'), h = HS[v('secH')] ?? 1;
      setTxt(env, 'secXv', num(x0)); setTxt(env, 'secHv', num(h, 3));
      const { f, d } = F[fn], [y0, y1] = YR[fn];
      const X = (x: number) => 20 + ((x + 3) / 6) * 290, Y = (y: number) => 185 - ((y - y0) / (y1 - y0)) * 170;
      const pts: string[] = []; for (let i = 0; i <= 120; i++) { const x = -3 + i / 20; pts.push(`${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`); }
      const s = secant(fn, x0, h), line = (k: number, x1: number, y1v: number) => `x1="${X(-3)}" y1="${Y(y1v + k * (-3 - x1)).toFixed(1)}" x2="${X(3)}" y2="${Y(y1v + k * (3 - x1)).toFixed(1)}"`;
      svg!.innerHTML = `<defs><clipPath id="secClip"><rect x="20" y="15" width="290" height="170"/></clipPath></defs>
<line x1="20" y1="${Y(0)}" x2="310" y2="${Y(0)}" stroke="#d1d5db"/><line x1="${X(0)}" y1="15" x2="${X(0)}" y2="185" stroke="#d1d5db"/>
<g clip-path="url(#secClip)"><polyline points="${pts.join(' ')}" fill="none" stroke="#334155" stroke-width="2"/>
<line ${line(d(x0), x0, f(x0))} stroke="#15803d" stroke-width="1.5" stroke-dasharray="5 4"/>
<line ${line(s.slope, x0, f(x0))} stroke="#b45309" stroke-width="2"/></g>
<circle cx="${X(x0)}" cy="${Y(f(x0))}" r="4" fill="#15803d"/><circle cx="${X(x0 + h)}" cy="${Y(f(x0 + h))}" r="4" fill="#b45309"/>
<text x="24" y="12" font-size="12" fill="#b45309">${t('— 割线', '— secant')}</text><text x="110" y="12" font-size="12" fill="#15803d">${t('- - 切线', '- - tangent')}</text>`;
      out!.innerHTML = `<table><tr><td>${t('割线斜率', 'Secant slope')}</td><td class="n" data-k="slope">${num(s.slope, 6)}</td></tr>
<tr><td>${t('导数 f′(x₀)', 'Derivative f′(x₀)')}</td><td class="n" data-k="deriv">${num(s.deriv, 6)}</td></tr>
<tr><td>${t('误差', 'Error')}</td><td class="n" data-k="err">${num(s.err, 6)}</td></tr></table>`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
