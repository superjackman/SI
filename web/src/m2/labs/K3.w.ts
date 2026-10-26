/* K3 lab (R31d): lab3dDice — roll two dice 10 times per tap and watch the sums 2..12 pile up into a hump around 7.
   The 2D picture (the bar chart) is drawn first and stays when 3D is not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { ROLL_MAX, ROLL_STEP, WAYS, diceSay, sumCounts } from '../w3d3';
import type { DiceApi } from '../../three3d/dice';

export const LABS = [{ ids: ['lab3dDice', 'dcBox', 'dcGo', 'dcSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'dcBox'), say = byId(env, 'dcSay'), btn = byId<HTMLButtonElement>(env, 'dcGo'), svg = box?.querySelector('svg');
    if (!box || !say || !btn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let n = 0;
    function draw2d() {
      const c = sumCounts(n), u = 200 / Math.max(3, ...c, (n * 6) / 36);
      let s = '';
      c.forEach((v, i) => {
        const x = 22 + i * 26, h = Math.max(2, v * u);
        s += `<rect x="${x}" y="${250 - h}" width="20" height="${h.toFixed(1)}" rx="4" fill="#8b5cf6"/><text x="${x + 10}" y="272" text-anchor="middle" style="font-size:14px;fill:#55526e">${i + 2}</text>`;
      });
      if (n > 0) s += `<polyline fill="none" stroke="#7c3aed" stroke-dasharray="4 4" stroke-width="2" points="${WAYS.map((w, i) => `${32 + i * 26},${(250 - ((n * w) / 36) * u).toFixed(1)}`).join(' ')}"/>`;
      svg!.innerHTML = s;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const show = () => {
      say.innerHTML = diceSay(n, L); draw2d(); h3?.refresh();
      btn.innerHTML = n >= ROLL_MAX ? `↺ ${t('清空重来', 'Start over')}` : `🎲 ${t(`掷 ${ROLL_STEP} 次`, `Roll ${ROLL_STEP}×`)}`;
    };
    btn.addEventListener('click', () => { n = n >= ROLL_MAX ? 0 : n + ROLL_STEP; show(); });
    show();
    const api: DiceApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, n: () => n };
    h3 = mount3d(env, box, () => import('../../three3d/dice'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { n: () => n, roll: () => btn.click() };
  };
  return { labs: [go], eager: () => {} };
}
