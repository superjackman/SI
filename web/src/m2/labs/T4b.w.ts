/* T4b lab (R31d): lab3dScore — the model scores every word and picks the highest. The button picks (or puts the
   cards back); the 3D rack lights the winning card. The 2D picture (six bars) is drawn first and stays when 3D is
   not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { SCORE, bestScore, scoreSay } from '../w3d3';
import type { ScoreApi } from '../../three3d/score';

export const LABS = [{ ids: ['lab3dScore', 'scBox', 'scGo', 'scSay'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'scBox'), say = byId(env, 'scSay'), btn = byId<HTMLButtonElement>(env, 'scGo'), svg = box?.querySelector('svg');
    if (!box || !say || !btn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let picked = false;
    const best = bestScore();
    function draw2d() {
      let s = '';
      SCORE.forEach((w, i) => {
        const y = 40 + i * 42, me = picked && w === best;
        s += `<rect x="20" y="${y - 15}" width="280" height="30" rx="10" fill="${me ? '#7c5cf0' : '#fff'}" stroke="#d9d3fb"/>`
          + `<text x="34" y="${y + 5}" style="font-size:15px;font-weight:700;fill:${me ? '#fff' : '#2e2a5c'}">${t(w[0], w[1])}</text>`
          + `<rect x="130" y="${y - 6}" width="${(150 * w[2]).toFixed(0)}" height="12" rx="6" fill="${me ? '#fff' : '#8b7cf0'}" opacity="${(0.4 + w[2] * 0.6).toFixed(2)}"/>`;
      });
      svg!.innerHTML = s;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const show = () => {
      say.innerHTML = scoreSay(picked, L); draw2d(); h3?.refresh();
      btn.innerHTML = picked ? `↺ ${t('再看一次', 'Again')}` : `🏆 ${t('挑最高分', 'Pick the highest')}`;
    };
    btn.addEventListener('click', () => { picked = !picked; show(); });
    show();
    const api: ScoreApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, picked: () => picked };
    h3 = mount3d(env, box, () => import('../../three3d/score'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { picked: () => picked, pick: () => btn.click() };
  };
  return { labs: [go], eager: () => {} };
}
