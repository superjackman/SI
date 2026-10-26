/* U lab (R31): lab3dDuo — together, or on its own. One capsule toggle at the top inside the stage (R31b) (or a tap on either half of the
   3D stage, or of the 2D picture) picks the mode; that half is bright, the other is washed out. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { duoSay, type Duo } from '../w3d2';
import type { DuoApi } from '../../three3d/duo';

export const LABS = [{ ids: ['lab3dDuo', 'duBox', 'duSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'duBox'), say = byId(env, 'duSay'), svg = box?.querySelector('svg');
    const card = box?.closest('.card');
    if (!box || !say || !svg || !card) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    const btns = [...card.querySelectorAll<HTMLButtonElement>('.s3c-opt[data-m]')];
    let mode: Duo = 'with';
    function draw2d() {
      const bot = (x: number, y: number) => `<rect x="${x}" y="${y}" width="44" height="38" rx="14" fill="#f4f3fb"/><rect x="${x + 7}" y="${y + 9}" width="30" height="18" rx="8" fill="#1f2050"/><circle cx="${x + 16}" cy="${y + 18}" r="3" fill="#c4b5fd"/><circle cx="${x + 28}" cy="${y + 18}" r="3" fill="#c4b5fd"/><rect x="${x + 4}" y="${y + 40}" width="36" height="40" rx="12" fill="#f4f3fb"/>`;
      const man = (x: number, y: number, c: string) => `<circle cx="${x}" cy="${y}" r="16" fill="#f1c6a4"/><path d="M${x - 16} ${y - 4} a16 16 0 0 1 32 0 z" fill="#3a2a22"/><rect x="${x - 24}" y="${y + 18}" width="48" height="56" rx="18" fill="${c}"/>`;
      svg!.innerHTML = `<rect x="0" y="0" width="160" height="300" fill="#fbe2c4"/><rect x="160" y="0" width="160" height="300" fill="#1f2858"/>`
        + `<g data-m="with" style="cursor:pointer;opacity:${mode === 'with' ? 1 : 0.45}">${man(52, 120, '#3b4fa8')}${bot(92, 112)}<rect x="10" y="196" width="140" height="10" rx="4" fill="#c99462"/></g>`
        + `<g data-m="solo" style="cursor:pointer;opacity:${mode === 'solo' ? 1 : 0.45}">${man(268, 100, '#25306b')}${bot(196, 120)}<rect x="170" y="196" width="140" height="10" rx="4" fill="#4b4570"/><text x="252" y="76" text-anchor="middle" style="font-size:14px;fill:#fff">${t('稍后检查', 'Check it later')} 🕘</text></g>`;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const set = (m: Duo) => {
      mode = m;
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
      say.innerHTML = duoSay(m, L); draw2d(); h3?.refresh();
    };
    btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.m as Duo)));
    svg.addEventListener('click', (e) => { const g = (e.target as Element).closest?.('[data-m]'); if (g) set(g.getAttribute('data-m') as Duo); });
    draw2d();
    const api: DuoApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, mode: () => mode, set };
    h3 = mount3d(env, box, () => import('../../three3d/duo'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { set, mode: () => mode };
  };
  return { labs: [go], eager: () => {} };
}
