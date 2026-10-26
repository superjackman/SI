/* T2 lab (R31d): lab3dLoop — the agent loop, step by step (model → tools → result → model → answer). The 2D picture
   (a ring with four stops) is drawn first and stays when 3D is not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { LOOP, LOOP_AT, loopSay } from '../w3d3';
import type { LoopApi } from '../../three3d/loop';

export const LABS = [{ ids: ['lab3dLoop', 'lpBox', 'lpGo', 'lpSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'lpBox'), say = byId(env, 'lpSay'), btn = byId<HTMLButtonElement>(env, 'lpGo'), svg = box?.querySelector('svg');
    if (!box || !say || !btn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let k = -1;
    const POS = { model: [160, 60], tools: [70, 210], result: [250, 210], answer: [285, 70] } as const;
    const NAME = { model: t('模型', 'Model'), tools: t('工具', 'Tools'), result: t('结果', 'Result'), answer: t('回答', 'Answer') };
    function draw2d() {
      const at = k < 0 ? 'model' : LOOP_AT[k]!;
      let s = '<circle cx="160" cy="160" r="95" fill="none" stroke="#a78bfa" stroke-width="5"/>';
      for (const [n, [x, y]] of Object.entries(POS)) {
        const on = n === at && k >= 0;
        s += `<rect x="${x - 34}" y="${y - 18}" width="68" height="36" rx="12" fill="${on ? '#7c5cf0' : '#fff'}" stroke="#c9c0f7"/><text x="${x}" y="${y + 5}" text-anchor="middle" style="font-size:14px;font-weight:700;fill:${on ? '#fff' : '#4c3fb0'}">${NAME[n as keyof typeof NAME]}</text>`;
      }
      svg!.innerHTML = s;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const show = () => {
      say.innerHTML = loopSay(k, L); draw2d(); h3?.refresh();
      btn.innerHTML = k >= LOOP.length - 1 ? `↺ ${t('再来一次', 'Again')}` : `▶ ${t('下一步', 'Next step')}`;
    };
    btn.addEventListener('click', () => { k = k >= LOOP.length - 1 ? -1 : k + 1; show(); });
    show();
    const api: LoopApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, k: () => k };
    h3 = mount3d(env, box, () => import('../../three3d/loop'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { k: () => k, step: () => btn.click() };
  };
  return { labs: [go], eager: () => {} };
}
