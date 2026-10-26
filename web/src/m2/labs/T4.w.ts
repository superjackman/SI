/* T4 lab (R31d): lab3dBlk — one Transformer block as a stack of glass plates. The Step button lights the next plate
   (a packet rises to it) and the sentence says what that layer does; after the top it starts again. The 2D picture
   (the same stack, flat) is drawn first and stays when 3D is not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { BLK, blkSay } from '../w3d3';
import type { BlkApi } from '../../three3d/blk';

export const LABS = [{ ids: ['lab3dBlk', 'bkBox', 'bkGo', 'bkSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'bkBox'), say = byId(env, 'bkSay'), btn = byId<HTMLButtonElement>(env, 'bkGo'), svg = box?.querySelector('svg');
    if (!box || !say || !btn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let k = -1;
    function draw2d() {
      let s = '';
      BLK.forEach((b, i) => {
        const y = 262 - i * 36, on = i === k, done = k >= 0 && i < k;
        s += `<rect x="20" y="${y - 13}" width="150" height="26" rx="8" fill="${on ? '#7c5cf0' : done ? '#ddd6fe' : '#eeebff'}" stroke="#c9c0f7"/>`
          + `<text x="184" y="${y + 5}" style="font-size:14px;font-weight:700;fill:${on ? '#4c1d95' : '#55526e'}">${t(b[0], b[1])}</text>`;
      });
      if (k >= 0) s += `<circle cx="95" cy="${262 - k * 36}" r="7" fill="#fff" stroke="#8b5cf6" stroke-width="3"/>`;
      svg!.innerHTML = s;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const label = () => { btn.innerHTML = k >= BLK.length - 1 ? `↺ ${t('从头再来', 'Start again')}` : `▶ ${t('下一层', 'Next layer')}`; };
    const show = () => { say.innerHTML = blkSay(k, L); label(); draw2d(); h3?.refresh(); };
    btn.addEventListener('click', () => { k = k >= BLK.length - 1 ? -1 : k + 1; show(); });
    show();
    const api: BlkApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, k: () => k };
    h3 = mount3d(env, box, () => import('../../three3d/blk'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { k: () => k, step: () => btn.click() };
  };
  return { labs: [go], eager: () => {} };
}
