/* Bld lab (R31): lab3dBld — a robot built from four bricks and a signpost 「不写代码 / 写代码」. Two big buttons (or a tap on
   a board in 3D, or the 2D picture) pick a road; the chosen board lights up and the sentence under the stage says what
   that road means. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { BLD_PARTS, bldSay, type Road } from '../w3d2';
import type { BldApi } from '../../three3d/bld';

export const LABS = [{ ids: ['lab3dBld', 'bdBox', 'bdSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'bdBox'), say = byId(env, 'bdSay'), svg = box?.querySelector('svg');
    const card = box?.closest('.card');
    if (!box || !say || !svg || !card) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    const btns = [...card.querySelectorAll<HTMLButtonElement>('.s3c-opt[data-r]')];
    let road: Road = '';
    const C = Object.fromEntries(BLD_PARTS.map(([id, zh, en, c]) => [id, [t(zh, en), c]])) as Record<string, [string, string]>;
    function draw2d() {
      const blk = (x: number, y: number, w: number, h: number, id: string, dark = true) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${C[id]![1]}"/><text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" style="font-size:14px;font-weight:700;fill:${dark ? '#fff' : '#3b2a05'}">${C[id]![0]}</text>`;
      const sign = (r: Road, y: number, s: string) => { const on = road === r, off = !!road && !on; return `<g data-r="${r}" style="cursor:pointer;opacity:${off ? 0.5 : 1}"><path d="M206 ${y} h88 l18 18 l-18 18 h-88 z" fill="${on ? '#f0c58c' : '#e2b47a'}" stroke="${on ? '#7c3aed' : 'none'}" stroke-width="3"/><text x="252" y="${y + 23}" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#5b3d1a">${s}</text></g>`; };
      svg!.innerHTML = `<rect x="30" y="250" width="160" height="16" rx="5" fill="#b8b6c8"/>`
        + blk(55, 196, 110, 50, 'mem', false) + blk(60, 120, 100, 74, 'ins') + blk(18, 120, 40, 70, 'tools') + blk(162, 120, 40, 70, 'tools') + blk(52, 40, 116, 76, 'model')
        + `<rect x="246" y="40" width="10" height="226" rx="4" fill="#a9743f"/>` + sign('nocode', 70, `🧩 ${t('不写代码', 'No code')}`) + sign('code', 140, `⌨️ ${t('写代码', 'Code')}`);
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const set = (r: Road) => {
      road = r;
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.r === r)));
      say.innerHTML = bldSay(r, L); draw2d(); h3?.refresh();
    };
    btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.r as Road)));
    svg.addEventListener('click', (e) => { const g = (e.target as Element).closest?.('[data-r]'); if (g) set(g.getAttribute('data-r') as Road); });
    draw2d();
    const api: BldApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, road: () => road, set };
    h3 = mount3d(env, box, () => import('../../three3d/bld'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { set, road: () => road };
  };
  return { labs: [go], eager: () => {} };
}
