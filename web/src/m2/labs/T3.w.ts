/* T3 lab (R30, R30b): lab3dVec — the word-vector space in 3D (three.js, loaded only when the stage is on screen).
   R30b: tap a ball, nothing else; the one sentence under the stage says who its neighbours are. The 2D figure (the first
   two directions, seen from the front) is drawn first and stays when 3D is not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { nearest, VCOL, vecSay, VWORDS } from '../w3d';
import type { VecApi } from '../../three3d/vec';

export const LABS = [{ ids: ['lab3dVec', 'v3Box', 'v3Say', 'v3Out'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'v3Box'), out = byId(env, 'v3Out'), say = byId(env, 'v3Say'), svg = box?.querySelector('svg');
    if (!box || !out || !say || !svg) return;
    let sel = 0;
    const L = env.lang === 'en' ? 'en' : 'zh';
    const word = (i: number) => (L === 'en' ? VWORDS[i]![1] : VWORDS[i]![0]);
    const X = (x: number) => 160 + x * 48, Y = (y: number) => 150 - y * 44;
    function draw2d() {
      const nb = nearest(sel), s = VWORDS[sel]!;
      const dots = VWORDS.map((w, i) => {
        const on = i === sel, n = nb.includes(i), r = on ? 17 : 14;
        return `<circle data-i="${i}" cx="${X(w[3])}" cy="${Y(w[4])}" r="${r}" fill="${VCOL[w[2]]}" opacity="${on || n ? 1 : 0.5}" style="cursor:pointer"/>`
          + (on ? `<circle cx="${X(w[3])}" cy="${Y(w[4])}" r="${r + 6}" fill="none" stroke="#fff" stroke-width="3"/>` : '');
      }).join('');
      const w = word(sel), lw = 20 + w.length * (L === 'en' ? 9 : 16), lx = Math.min(Math.max(X(s[3]), lw / 2 + 4), 316 - lw / 2), ly = Y(s[4]) - 46 < 4 ? Y(s[4]) + 24 : Y(s[4]) - 46;
      svg!.innerHTML = `<line x1="16" y1="150" x2="304" y2="150" stroke="#a78bfa" opacity=".35"/><line x1="160" y1="14" x2="160" y2="286" stroke="#a78bfa" opacity=".35"/>${dots}`
        + `<rect x="${lx - lw / 2}" y="${ly}" width="${lw}" height="26" rx="13" fill="#fff"/><text x="${lx}" y="${ly + 18}" text-anchor="middle" font-size="15" font-weight="700" style="fill:#312e81">${w}</text>`;
    }
    function text() {
      say!.innerHTML = vecSay(sel, L);
      out!.innerHTML = `<p>${t(`“<b data-k="sel">${word(sel)}</b>”最近的 3 个邻居：`, `The 3 nearest neighbours of “<b data-k="sel">${word(sel)}</b>”: `)}<span data-k="near">${nearest(sel).map((j) => `<span class="chip">${word(j)}</span>`).join('')}</span></p>`;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const pick = (i: number) => { if (i < 0 || i === sel) return; sel = i; draw2d(); text(); h3?.refresh(); };
    svg.addEventListener('click', (e) => { const i = (e.target as Element).getAttribute?.('data-i'); if (i !== null && i !== undefined) pick(Number(i)); });
    box.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); pick((sel + d + VWORDS.length) % VWORDS.length);
    });
    draw2d(); text();
    const api: VecApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, sel: () => sel, near: () => nearest(sel), pick };
    h3 = mount3d(env, box, () => import('../../three3d/vec'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { pick, sel: () => sel, near: () => nearest(sel).map(word) };
  };
  return { labs: [go], eager: () => {} };
}
