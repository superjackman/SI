/* T3 lab (R31d): lab3dNext — guess the next word of 「小猫坐在___」. The randomness slider (temperature) evens the
   chances out or lets the top word tower. The 2D picture (four bars) is drawn first and stays when 3D is not
   possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { NEXT, TEMP0, nextP, nextSay, pc } from '../w3d3';
import type { NextApi } from '../../three3d/next';

export const LABS = [{ ids: ['lab3dNext', 'nxBox', 'nxT', 'nxTv', 'nxSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'nxBox'), say = byId(env, 'nxSay'), tIn = byId<HTMLInputElement>(env, 'nxT'), tv = byId(env, 'nxTv'), svg = box?.querySelector('svg');
    if (!box || !say || !tIn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let T = Number(tIn.value); if (!Number.isFinite(T)) T = TEMP0;
    function draw2d() {
      const p = nextP(T);
      let s = '';
      p.forEach((v, i) => {
        const x = 30 + i * 72, h = v * 200;
        s += `<rect x="${x}" y="${250 - h}" width="48" height="${h.toFixed(1)}" rx="8" fill="${i === 0 ? '#7c5cf0' : '#c4b5fd'}"/>`
          + `<text x="${x + 24}" y="${244 - h}" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#3b347a">${pc(v)}%</text>`
          + `<text x="${x + 24}" y="274" text-anchor="middle" style="font-size:14px;fill:#55526e">${t(NEXT[i]![0], NEXT[i]![1])}</text>`;
      });
      svg!.innerHTML = s;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const show = () => { if (tv) tv.textContent = T.toFixed(1); say.innerHTML = nextSay(T, L); draw2d(); h3?.refresh(); };
    tIn.addEventListener('input', () => { T = Number(tIn.value); show(); });
    show();
    const api: NextApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, t: () => T };
    h3 = mount3d(env, box, () => import('../../three3d/next'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { t: () => T, p: () => nextP(T) };
  };
  return { labs: [go], eager: () => {} };
}
