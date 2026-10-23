/* Station K4 lab: labGD — 12 gradient-descent steps on f(x) = x²; the learning rate decides converge / oscillate / diverge. */
import type { Env } from '../../legacy/runtime';
import { byId, num, setTxt, tr, wire } from '../kit';
import { gdPath, regime } from '../kmath';

export const LABS = [{ ids: ['labGD', 'gdE', 'gdPlot', 'gdOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const svg = byId(env, 'gdPlot'), out = byId(env, 'gdOut'); if (!svg || !out) return;
    const v = wire(env, ['gdE'], draw);
    function draw() {
      const eta = Math.round(v('gdE') * 100) / 100; setTxt(env, 'gdEv', num(eta, 2));
      const xs = gdPath(eta), R = regime(eta), M = 4.5;
      const X = (x: number) => 160 + (x / M) * 145, Y = (y: number) => 185 - (y / (M * M)) * 165;
      const curve: string[] = []; for (let i = 0; i <= 90; i++) { const x = -M + i / 10; curve.push(`${X(x).toFixed(1)},${Y(x * x).toFixed(1)}`); }
      const vis = xs.filter((x) => Math.abs(x) <= M);
      svg!.innerHTML = `<line x1="10" y1="185" x2="310" y2="185" stroke="#cbd5e1"/><polyline points="${curve.join(' ')}" fill="none" stroke="#334155" stroke-width="2"/>
<polyline points="${vis.map((x) => `${X(x).toFixed(1)},${Y(x * x).toFixed(1)}`).join(' ')}" fill="none" stroke="#b45309" stroke-width="1.2" opacity=".7"/>
${vis.map((x, k) => `<circle cx="${X(x).toFixed(1)}" cy="${Y(x * x).toFixed(1)}" r="${k === 0 ? 5 : 3.5}" fill="${k === 0 ? '#15803d' : '#b45309'}"/>`).join('')}`;
      const MSG = {
        mono: [`k-ok`, t('单调收敛：每步都朝 0 靠近，不越过', 'Monotone convergence: each step moves towards 0 without overshooting')],
        one: [`k-ok`, t('一步到底：η = 1/a', 'Straight to the bottom in one step: η = 1/a')],
        osc: [`k-warn`, t('来回振荡但收敛', 'Oscillates but converges')],
        cycle: [`k-bad`, t('永远在 3 和 −3 之间跳：η = 2/a', 'Bounces between 3 and −3 forever: η = 2/a')],
        div: [`k-bad`, t('发散：越跳越远', 'Diverges: each jump lands further out')],
      }[R];
      const off = xs.length - vis.length;
      out!.innerHTML = `<p>r = 1 − 2η = <b>${num(1 - 2 * eta, 2)}</b> · <span class="${MSG[0]}" data-k="regime" data-r="${R}">${MSG[1]}</span></p>
<p>x₁₂ = <b data-k="x12">${Math.abs(xs[12]!) < 1e-4 ? num(xs[12]!, 8) : num(xs[12]!, 4)}</b>${off ? ` · ${t(`${off} 个点飞出了画面`, `${off} points left the plot`)}` : ''}</p>`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
