/* T5 lab (R31d): lab3dMoe — a mixture of experts. Each tap sends the next word of 「小猫坐在垫子上面」 to the router,
   which lights only two of the eight experts. The 2D picture (router and 8 boxes) is drawn first and stays when 3D is
   not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { MOE_N, MOE_TOK, moeSay } from '../w3d3';
import type { MoeApi } from '../../three3d/moe';

export const LABS = [{ ids: ['lab3dMoe', 'moBox', 'moGo', 'moSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'moBox'), say = byId(env, 'moSay'), btn = byId<HTMLButtonElement>(env, 'moGo'), svg = box?.querySelector('svg');
    if (!box || !say || !btn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let i = -1;
    function draw2d() {
      const on = i >= 0 ? MOE_TOK[i % MOE_TOK.length]! : null;
      let s = `<rect x="20" y="120" width="80" height="60" rx="12" fill="#fff" stroke="#c9c0f7"/><text x="60" y="155" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#4c3fb0">${t('路由器', 'Router')}</text>`;
      if (on) s += `<text x="60" y="105" text-anchor="middle" style="font-size:16px;font-weight:700;fill:#2e2a5c">${t(on[0], on[1])}</text>`;
      for (let k = 1; k <= MOE_N; k++) {
        const x = 150 + ((k - 1) % 4) * 42, y = k <= 4 ? 80 : 180, lit = !!on && on[2].includes(k);
        if (lit) s += `<line x1="100" y1="150" x2="${x}" y2="${y + 20}" stroke="#8b5cf6" stroke-width="3"/>`;
        s += `<rect x="${x}" y="${y}" width="34" height="40" rx="7" fill="${lit ? '#7c5cf0' : on ? '#e4e1f0' : '#c4b5fd'}"/><text x="${x + 17}" y="${y + 26}" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#fff">${k}</text>`;
      }
      svg!.innerHTML = s;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const show = () => { say.innerHTML = moeSay(i, L); draw2d(); h3?.refresh(); };
    btn.addEventListener('click', () => { i = (i + 1) % MOE_TOK.length; show(); });
    show();
    const api: MoeApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, i: () => i };
    h3 = mount3d(env, box, () => import('../../three3d/moe'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { i: () => i, next: () => btn.click() };
  };
  return { labs: [go], eager: () => {} };
}
