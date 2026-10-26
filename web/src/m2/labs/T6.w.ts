/* T6 lab (R31d): lab3dPatch — a picture is cut into patches, and each patch becomes one "word" beside the word 「猫」.
   The slider picks 2, 3 or 4 patches per side. The 2D picture (the cut grid and the word) is drawn first and stays
   when 3D is not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { PATCH0, patchSay } from '../w3d3';
import type { PatchApi } from '../../three3d/patch';

export const LABS = [{ ids: ['lab3dPatch', 'ptBox', 'ptG', 'ptGv', 'ptSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'ptBox'), say = byId(env, 'ptSay'), gIn = byId<HTMLInputElement>(env, 'ptG'), gv = byId(env, 'ptGv'), svg = box?.querySelector('svg');
    if (!box || !say || !gIn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let g = Number(gIn.value); if (!Number.isFinite(g)) g = PATCH0;
    function draw2d() {
      const S = 150, x0 = 20, y0 = 70, s = S / g;
      let o = `<rect x="${x0}" y="${y0}" width="${S}" height="${S}" rx="8" fill="#fbbf24"/><circle cx="${x0 + 52}" cy="${y0 + 65}" r="9" fill="#065f46"/><circle cx="${x0 + 98}" cy="${y0 + 65}" r="9" fill="#065f46"/>`;
      for (let i = 1; i < g; i++) o += `<line x1="${x0 + i * s}" y1="${y0}" x2="${x0 + i * s}" y2="${y0 + S}" stroke="#fff" stroke-width="4"/><line x1="${x0}" y1="${y0 + i * s}" x2="${x0 + S}" y2="${y0 + i * s}" stroke="#fff" stroke-width="4"/>`;
      o += `<text x="245" y="170" text-anchor="middle" style="font-size:56px;font-weight:900;fill:#6d28d9">${t('猫', 'cat')}</text>`;
      svg!.innerHTML = o;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const show = () => { if (gv) gv.textContent = `${g}×${g}`; say.innerHTML = patchSay(g, L); draw2d(); h3?.refresh(); };
    gIn.addEventListener('input', () => { g = Number(gIn.value); show(); });
    show();
    const api: PatchApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, g: () => g };
    h3 = mount3d(env, box, () => import('../../three3d/patch'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { g: () => g, n: () => g * g };
  };
  return { labs: [go], eager: () => {} };
}
