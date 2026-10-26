/* N lab (R31d): lab3dNet — one weight of a tiny network. The slider under the stage sets the weight of one line
   (hidden 1 → output A); the 3D view thickens or recolours that line and dims or brightens output A. The 2D picture
   (the same network, flat) is drawn first and stays when 3D is not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { NN_W0, nnOut, nnSay, pc } from '../w3d3';
import type { NnApi } from '../../three3d/nn';

export const LABS = [{ ids: ['lab3dNet', 'nnBox', 'nnW', 'nnWv', 'nnSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'nnBox'), say = byId(env, 'nnSay'), wIn = byId<HTMLInputElement>(env, 'nnW'), wv = byId(env, 'nnWv'), svg = box?.querySelector('svg');
    if (!box || !say || !wIn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let w = Number(wIn.value); if (!Number.isFinite(w)) w = NN_W0;
    const XS = [50, 160, 270], YS = [[95, 165, 235], [70, 135, 195, 260], [130, 205]];
    function draw2d() {
      const o = nnOut(w), neg = w < 0;
      let s = '';
      for (let l = 0; l < 2; l++) YS[l]!.forEach((a, i) => YS[l + 1]!.forEach((b, j) => {
        const on = l === 1 && i === 0 && j === 0;
        s += `<line x1="${XS[l]}" y1="${a}" x2="${XS[l + 1]}" y2="${b}" stroke="${on ? (neg ? '#ef6b4f' : '#6d4fe0') : '#cfc7f5'}" stroke-width="${on ? (1.5 + Math.abs(w) * 3).toFixed(1) : 1.5}"/>`;
      }));
      YS.forEach((ys, l) => ys.forEach((y, i) => { s += `<circle cx="${XS[l]}" cy="${y}" r="15" fill="#5b4fd6"${l === 2 && i === 0 ? ` stroke="#a78bfa" stroke-width="${(2 + o * 8).toFixed(1)}" stroke-opacity=".6"` : ''}/>`; }));
      [t('输入层', 'Input'), t('隐藏层', 'Hidden'), t('输出层', 'Output')].forEach((h, l) => { s += `<text x="${XS[l]}" y="34" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#6d63b8">${h}</text>`; });
      s += `<text x="${XS[2]}" y="${YS[2]![0]! - 26}" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#4338ca">${pc(o)}%</text>`;
      svg!.innerHTML = s;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const show = () => { if (wv) wv.textContent = w.toFixed(1).replace('-', '−'); say.innerHTML = nnSay(w, L); draw2d(); h3?.refresh(); };
    wIn.addEventListener('input', () => { w = Number(wIn.value); show(); });
    show();
    const api: NnApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, w: () => w };
    h3 = mount3d(env, box, () => import('../../three3d/nn'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { w: () => w, out: () => nnOut(w) };
  };
  return { labs: [go], eager: () => {} };
}
