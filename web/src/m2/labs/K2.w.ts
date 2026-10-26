/* K2 lab (R31d): lab3dGrid — a matrix turns and stretches a whole grid. The slider sets the turn (the stretch stays
   1.3×). The 2D picture (both grids, flat) is drawn first and stays when 3D is not possible. */
import type { Env } from '../../legacy/runtime';
import { byId } from '../kit';
import { mount3d } from '../s3d';
import { ANG0, matOf, matSay } from '../w3d3';
import type { GridApi } from '../../three3d/grid';

export const LABS = [{ ids: ['lab3dGrid', 'grBox', 'grA', 'grAv', 'grSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const go = () => {
    const box = byId(env, 'grBox'), say = byId(env, 'grSay'), aIn = byId<HTMLInputElement>(env, 'grA'), av = byId(env, 'grAv'), svg = box?.querySelector('svg');
    if (!box || !say || !aIn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let d = Number(aIn.value); if (!Number.isFinite(d)) d = ANG0;
    function draw2d() {
      const [a, b, c, e] = matOf(d), U = 40, O = [160, 150];
      const P = (x: number, y: number, m = true) => { const X = m ? a * x + b * y : x, Y = m ? c * x + e * y : y; return `${(O[0]! + X * U).toFixed(1)},${(O[1]! - Y * U).toFixed(1)}`; };
      let s = '';
      for (let i = -3; i <= 3; i++) s += `<polyline points="${P(i, -3, false)} ${P(i, 3, false)}" stroke="#ddd8f3" fill="none"/><polyline points="${P(-3, i, false)} ${P(3, i, false)}" stroke="#ddd8f3" fill="none"/>`;
      for (let i = -2; i <= 2; i++) s += `<polyline points="${P(i, -2)} ${P(i, 2)}" stroke="#8b5cf6" fill="none" opacity=".7"/><polyline points="${P(-2, i)} ${P(2, i)}" stroke="#8b5cf6" fill="none" opacity=".7"/>`;
      s += `<polygon points="${P(0, 0)} ${P(1, 0)} ${P(1, 1)} ${P(0, 1)}" fill="#8b5cf6" opacity=".25"/>`;
      s += `<polyline points="${P(0, 0)} ${P(1, 0)}" stroke="#2563eb" stroke-width="4"/><polyline points="${P(0, 0)} ${P(0, 1)}" stroke="#7c3aed" stroke-width="4"/>`;
      svg!.innerHTML = s;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const show = () => { if (av) av.textContent = `${Math.round(d)}°`.replace('-', '−'); say.innerHTML = matSay(d, L); draw2d(); h3?.refresh(); };
    aIn.addEventListener('input', () => { d = Number(aIn.value); show(); });
    show();
    const api: GridApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, deg: () => d };
    h3 = mount3d(env, box, () => import('../../three3d/grid'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { deg: () => d, mat: () => matOf(d) };
  };
  return { labs: [go], eager: () => {} };
}
