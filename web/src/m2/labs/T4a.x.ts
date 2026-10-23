/* T4a extension lab (M8, R11 gap 2): labRope — rotary position embedding on an illustrative 4-d query and key;
   the score depends only on m − n. Maths in ../ymath (unit-tested). */
import type { Env } from '../../legacy/runtime';
import { byId, num, setTxt, tr, wire } from '../kit';
import { dot, ropeScore, ropeThetas } from '../ymath';

export const LABS = [{ ids: ['labRope', 'rpM', 'rpOut'], hooks: [] as string[] }];
export const ROPE_Q = [1, 0.5, 0.8, -0.2], ROPE_K = [0.6, 0.9, -0.3, 0.7];

export function mount(env: Env) {
  const t = tr(env), th = ropeThetas(4);
  const go = () => {
    const out = byId(env, 'rpOut'); if (!out) return;
    const v = wire(env, ['rpM', 'rpN', 'rpS'], draw);
    function draw() {
      const m = v('rpM'), n = v('rpN'), s = v('rpS');
      setTxt(env, 'rpMv', String(m)); setTxt(env, 'rpNv', String(n)); setTxt(env, 'rpSv', String(s));
      const a = ropeScore(ROPE_Q, ROPE_K, m, n, th), b = ropeScore(ROPE_Q, ROPE_K, m + s, n + s, th);
      out!.innerHTML = `<table><tbody><tr><td>q·k ${t('（位置', '(positions')} ${m}, ${n})</td><td class="n"><b data-k="a">${num(a)}</b></td></tr>
<tr><td>q·k ${t('（位置', '(positions')} ${m + s}, ${n + s})</td><td class="n"><b data-k="b">${num(b)}</b></td></tr>
<tr><td>${t('不旋转的点积', 'Plain dot product')}</td><td class="n" data-k="plain">${num(dot(ROPE_Q, ROPE_K))}</td></tr></tbody></table>
<p>m − n = <b data-k="d">${num(m - n)}</b> · ${t('两行相同', 'Rows equal')}: <b data-k="eq">${num(a, 9) === num(b, 9) ? t('是', 'yes') : t('否', 'no')}</b></p>`;
    }
    draw();
  };
  return { labs: [go], eager: () => {} };
}
