/* T7 lab (R30, R30b): lab3dValley — gradient descent as a ball rolling down a loss valley (three.js, loaded only when the
   stage is on screen). The learning rate η sets the step (the one slider under the stage, with a round ▶); ↺ in the stage
   puts the ball back; the one sentence says how the steps go. The 2D figure (the
   valley seen from above: rings of equal height and the path) is drawn first and stays when 3D is not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, num, tr } from '../kit';
import { mount3d, why3d } from '../s3d';
import { descend, flips, loss, LR0, regime, valleySay } from '../w3d';
import type { ValleyApi } from '../../three3d/valley';

export const LABS = [{ ids: ['lab3dValley', 'vlBox', 'vlLr', 'vlPlay', 'vlReset', 'vlSay', 'vlOut'], hooks: [] as string[] }];
const STEP_MS = 160;

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'vlBox'), out = byId(env, 'vlOut'), sayEl = byId(env, 'vlSay'), lr = byId<HTMLInputElement>(env, 'vlLr'), lrv = byId(env, 'vlLrv');
    const play = byId<HTMLButtonElement>(env, 'vlPlay'), reset = byId<HTMLButtonElement>(env, 'vlReset'), svg = box?.querySelector('svg');
    if (!box || !out || !sayEl || !lr || !play || !reset || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let eta = Number(lr.value) || LR0, path = descend(eta), k = 0, playing = false, raf = 0, last = 0;
    const X = (a: number) => 160 + a * 34, Y = (b: number) => 150 + b * 50;
    const rings = [0.25, 1, 2.25, 4, 6.25, 9].map((c) => `<ellipse cx="160" cy="120" rx="${(2 * Math.sqrt(c) * 34).toFixed(1)}" ry="${(Math.sqrt(c / 1.25) * 50).toFixed(1)}" fill="${c < 1.5 ? '#c4b5fd' : 'none'}" fill-opacity=".35" stroke="#a78bfa" stroke-width="1.4"/>`).join('');
    function draw2d() {
      const pts = path.slice(0, k + 1).map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(' '), q = path[k]!;
      svg!.innerHTML = `${rings}<circle cx="160" cy="150" r="5" fill="#4338ca"/>`
        + `<text x="160" y="176" text-anchor="middle" style="fill:#312e81;font-size:14px;font-weight:700;paint-order:stroke;stroke:#f5f3ff;stroke-width:4px">${t('最低点', 'lowest point')}</text>`
        + `<polyline points="${pts}" fill="none" stroke="#4338ca" stroke-width="2" stroke-linejoin="round" opacity=".7"/>`
        + `<circle cx="${X(q[0]).toFixed(1)}" cy="${Y(q[1]).toFixed(1)}" r="9" fill="#8b5cf6" stroke="#fff" stroke-width="3"/>`;
    }
    function text() {
      const n = path.length - 1, q = path[k]!, rg = regime(eta);
      const now = t(`第 <b data-k="step">${k}</b> / ${n} 步 · 高度（损失 L）= <b data-k="loss">${num(loss(q[0], q[1]), 3)}</b>`, `Step <b data-k="step">${k}</b> / ${n} · height (loss L) = <b data-k="loss">${num(loss(q[0], q[1]), 3)}</b>`);
      const say = rg === 'slow' ? t(`步子太小：走了 ${n} 步还没到谷底，太慢了。`, `Steps too small: after ${n} steps it is still not at the bottom. Too slow.`)
        : rg === 'smooth' ? t(`步子合适：${n} 步走到谷底，一路平稳往下。`, `Good step size: it reaches the bottom in ${n} steps, rolling steadily down.`)
          : t(`步子偏大：小球在山谷两边来回跳（跳过去 ${flips(path)} 次），${n} 步才到谷底。再大一点就会冲出山谷。`, `Steps on the big side: the ball jumps from one side of the valley to the other (${flips(path)} times) and needs ${n} steps to reach the bottom. A bit bigger and it flies out of the valley.`);
      out!.innerHTML = `<p>${now}</p><p data-k="regime" data-r="${rg}">${say}</p>`;
      sayEl!.innerHTML = valleySay(eta, L);
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const show = () => { draw2d(); text(); h3?.refresh(); };
    const label = () => { play.innerHTML = `<span aria-hidden="true">${playing ? '❚❚' : '▶'}</span>`; play.setAttribute('aria-label', playing ? t('暂停', 'Pause') : t('播放', 'Play')); play.classList.toggle('on', playing); };
    const stop = () => { playing = false; if (raf) env.cancelAnimationFrame(raf); raf = 0; label(); };
    const frame = (ts: number) => {
      raf = 0; if (!playing) return;
      if (!last) last = ts;
      if (ts - last >= STEP_MS) { last = ts; k++; show(); }
      if (k >= path.length - 1) { stop(); return; }
      raf = env.requestAnimationFrame(frame);
    };
    play.addEventListener('click', () => {
      if (playing) { stop(); return; }
      if (k >= path.length - 1) k = 0;
      /* reduced motion: no rolling, show the whole walk at once */
      if (why3d() === 'motion') { k = path.length - 1; show(); return; }
      playing = true; last = 0; label(); show(); raf = env.requestAnimationFrame(frame);
    });
    reset.addEventListener('click', () => { stop(); k = 0; show(); });
    lr.addEventListener('input', () => {
      eta = Number(lr.value); if (lrv) lrv.textContent = String(eta);
      stop(); path = descend(eta); k = 0; show();
    });
    label(); show();
    const api: ValleyApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, path: () => path, at: () => k };
    h3 = mount3d(env, box, () => import('../../three3d/valley'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { eta: () => eta, k: () => k, n: () => path.length - 1, playing: () => playing };
  };
  return { labs: [go], eager: () => {} };
}
