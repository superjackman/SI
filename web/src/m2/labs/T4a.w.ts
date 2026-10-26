/* T4a lab (R30, R30b): lab3dAttn — attention beams in 3D over 「我 爱 吃 苹果」 (the toy numbers of the card above).
   R30b: tap a word block, nothing else; the one sentence under the stage says what it cares about most. The 2D figure
   (word blocks with arcs as thick as the share) is drawn first and stays when 3D is not possible. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { attnRow, attnSay, AWORDS, pct } from '../w3d';
import type { AttnApi } from '../../three3d/attn';

export const LABS = [{ ids: ['lab3dAttn', 'a3Box', 'a3Say', 'a3Out'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'a3Box'), out = byId(env, 'a3Out'), say = byId(env, 'a3Say'), svg = box?.querySelector('svg');
    if (!box || !out || !say || !svg) return;
    let sel = AWORDS.length - 1;
    const L = env.lang === 'en' ? 'en' : 'zh';
    const word = (i: number) => (L === 'en' ? AWORDS[i]![1] : AWORDS[i]![0]);
    const X = (i: number) => 46 + i * 76, TOP = 190;
    function draw2d() {
      const row = attnRow(sel);
      let arcs = '', tags = '';
      row.forEach((w, j) => {
        if (j > sel || w <= 0) return;
        const sw = (2 + 14 * w).toFixed(1);
        tags += `<rect x="${X(j) - 24}" y="${TOP + 46}" width="48" height="24" rx="12" fill="#fff"/><text x="${X(j)}" y="${TOP + 63}" text-anchor="middle">${pct(w)}%</text>`;
        if (j === sel) arcs += `<circle cx="${X(sel)}" cy="${TOP - 24}" r="18" fill="none" stroke="#8b5cf6" stroke-width="${sw}" opacity=".8"/>`;
        else {
          const span = sel - j, a = X(sel) - 8, b = X(j) + 8, m = (a + b) / 2, lift = 30 + 24 * span;
          arcs += `<path d="M${a} ${TOP} Q${m} ${TOP - 2 * lift} ${b} ${TOP}" fill="none" stroke="#8b5cf6" stroke-width="${sw}" stroke-linecap="round" opacity=".8"/>`;
        }
      });
      const boxes = AWORDS.map((_, i) => `<g data-i="${i}" style="cursor:pointer"><rect data-i="${i}" x="${X(i) - 32}" y="${TOP}" width="64" height="38" rx="10" fill="${i === sel ? '#6366f1' : i > sel ? '#ece9f7' : '#c4b5fd'}"/><text data-i="${i}" x="${X(i)}" y="${TOP + 25}" text-anchor="middle" font-size="15" font-weight="700" style="fill:${i === sel ? '#fff' : i > sel ? '#a8a3bd' : '#312e81'}">${word(i)}</text></g>`).join('');
      svg!.innerHTML = `<ellipse cx="160" cy="${TOP + 30}" rx="150" ry="34" fill="#ede9fe"/>${arcs}${boxes}<g style="font-size:14px;font-weight:700;fill:#4338ca">${tags}</g>`;
    }
    function text() {
      const row = attnRow(sel);
      say!.innerHTML = attnSay(sel, L);
      out!.innerHTML = `<p>${t(`“<b data-k="sel">${word(sel)}</b>”在看：`, `“<b data-k="sel">${word(sel)}</b>” looks at: `)}<span data-k="row">${row.map((w, j) => (j > sel ? '' : `<span class="chip">${word(j)} <b>${pct(w)}%</b></span>`)).join('')}</span></p>`;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const pick = (i: number) => { if (i < 0 || i >= AWORDS.length || i === sel) return; sel = i; draw2d(); text(); h3?.refresh(); };
    svg.addEventListener('click', (e) => { const i = (e.target as Element).getAttribute?.('data-i'); if (i !== null && i !== undefined) pick(Number(i)); });
    box.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); pick((sel + d + AWORDS.length) % AWORDS.length);
    });
    draw2d(); text();
    const api: AttnApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, sel: () => sel, pick };
    h3 = mount3d(env, box, () => import('../../three3d/attn'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { pick, sel: () => sel, row: () => attnRow(sel).slice(0, sel + 1).map(pct) };
  };
  return { labs: [go], eager: () => {} };
}
