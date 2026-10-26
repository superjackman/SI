/* Skl lab (R31): lab3dSkl — plug tools into the robot. Tap a tool card (3D, or the 2D picture, or keys 1-5 on the stage)
   to plug or unplug it; one switch 「用之前先问我」. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { SKL_TOOLS, sklSay } from '../w3d2';
import type { SklApi } from '../../three3d/skl';

export const LABS = [{ ids: ['lab3dSkl', 'skBox', 'skSay', 'skAsk'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'skBox'), say = byId(env, 'skSay'), ask = byId<HTMLInputElement>(env, 'skAsk'), svg = box?.querySelector('svg');
    if (!box || !say || !ask || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    const on: number[] = [];
    const XY: [number, number][] = [[46, 70], [274, 60], [46, 190], [274, 140], [274, 222]];
    function draw2d() {
      const any = on.length > 0;
      svg!.innerHTML = `<ellipse cx="160" cy="272" rx="74" ry="16" fill="#ddd5fb"/><rect x="118" y="40" width="84" height="66" rx="26" fill="#f4f3fb" stroke="#ddd6fe"/><rect x="128" y="54" width="64" height="36" rx="16" fill="#1f2050"/><circle cx="148" cy="72" r="6" fill="#c4b5fd"/><circle cx="172" cy="72" r="6" fill="#c4b5fd"/>`
        + `<rect x="114" y="116" width="92" height="146" rx="28" fill="#f4f3fb" stroke="#ddd6fe"/><rect x="132" y="142" width="56" height="46" rx="8" fill="${any ? '#22c55e' : '#25264d'}"/>`
        + XY.map(([x, y], i) => {
          const s = x < 160 ? 1 : -1, ex = x + s * 38, isOn = on.includes(i);
          const wire = isOn ? `<path d="M${ex} ${y + 14} C${ex + s * 20} ${y + 60} ${160 - s * 40} ${170} ${150 + (i - 2) * 5} 166" fill="none" stroke="#8b5cf6" stroke-width="4"/>` : `<path d="M${ex} ${y + 14} l${-s * 4} 20" stroke="#a5a0c8" stroke-width="3"/><rect x="${ex - s * 4 - 5}" y="${y + 32}" width="10" height="12" rx="3" fill="#8b7cf6"/>`;
          return `${wire}<g data-i="${i}" style="cursor:pointer"><rect x="${x - 40}" y="${y - 20}" width="80" height="40" rx="8" fill="#fff" stroke="${isOn ? '#8b5cf6' : '#e4e0f5'}" stroke-width="${isOn ? 3 : 1.5}"/><text x="${x}" y="${y + 5}" text-anchor="middle" style="font-size:14px">${SKL_TOOLS[i]![1]} ${t(SKL_TOOLS[i]![2], SKL_TOOLS[i]![3])}</text></g>`;
        }).join('')
        + (any ? `<rect x="116" y="196" width="88" height="24" rx="12" fill="#22c55e"/><text x="160" y="213" text-anchor="middle" style="fill:#fff;font-size:14px;font-weight:700">${t('已连接', 'Connected')}</text>` : '')
        + (ask!.checked ? `<rect x="122" y="8" width="76" height="24" rx="12" fill="#fff"/><text x="160" y="25" text-anchor="middle" style="font-size:14px">✋ ${t('先问你', 'Asks first')}</text>` : '');
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const sync = () => { draw2d(); say!.innerHTML = sklSay(on, ask!.checked, L); h3?.refresh(); };
    const pick = (i: number) => { const k = on.indexOf(i); if (k >= 0) on.splice(k, 1); else { on.push(i); on.sort((a, b) => a - b); } sync(); };
    svg.addEventListener('click', (e) => { const g = (e.target as Element).closest?.('[data-i]'); if (g) pick(+g.getAttribute('data-i')!); });
    box.addEventListener('keydown', (e) => { const k = +(e as KeyboardEvent).key; if (k >= 1 && k <= 5) pick(k - 1); });
    ask.addEventListener('change', sync);
    draw2d();
    const api: SklApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, on: () => on.slice(), ask: () => ask!.checked, pick };
    h3 = mount3d(env, box, () => import('../../three3d/skl'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { pick, on: () => on.slice(), ask: (v: boolean) => { ask!.checked = v; sync(); } };
  };
  return { labs: [go], eager: () => {} };
}
