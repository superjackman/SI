/* Loc lab (R31): lab3dLoc — will the model fit in 16 GB. One dropdown (size × compression, e.g. “8B · 4-bit”); the numbers are the
   memory calculator's (w3d2.locFit). */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { gb, locFit, locSay, LOC_HAVE, qName } from '../w3d2';
import type { Quant } from '../calc';
import type { LocApi } from '../../three3d/loc';

export const LABS = [{ ids: ['lab3dLoc', 'l3Box', 'l3Say', 'l3M', 'l3Out'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'l3Box'), say = byId(env, 'l3Say'), sm = byId<HTMLSelectElement>(env, 'l3M'), out = byId(env, 'l3Out'), svg = box?.querySelector('svg');
    if (!box || !say || !sm || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    const get = () => { const [p, q] = sm.value.split('|'); return { p: +p!, q: q as Quant }; };
    function draw2d() {
      const { p, q } = get(), f = locFit(p, q), s = 200 / LOC_HAVE, k = f.need > LOC_HAVE * 1.35 ? (LOC_HAVE * 1.35) / f.need : 1;
      const wh = f.w * s * k, gh = (f.kv + f.ov) * s * k, top = 250 - 200;
      const cols = ['#34d399', '#60a5fa', '#a78bfa'], n = Math.max(1, Math.min(5, Math.round(wh / 36)));
      let y = 250, blocks = '';
      for (let i = 0; i < n; i++) { const h = wh / n; y -= h; blocks += `<rect x="176" y="${y + 1}" width="76" height="${Math.max(2, h - 2)}" rx="5" fill="${y < top ? '#f87171' : cols[i % 3]}"/>`; }
      y -= gh; blocks += `<rect x="176" y="${y + 1}" width="76" height="${Math.max(2, gh - 2)}" rx="5" fill="${y < top ? '#f87171' : '#c9c6d6'}"/>`;
      const r = Math.min(f.need / f.have, 1.3), mx = 30 + (r / 1.3) * 260;
      svg!.innerHTML = `<rect x="22" y="70" width="100" height="186" rx="10" fill="#2b2d42"/><circle cx="72" cy="120" r="22" fill="none" stroke="#a78bfa" stroke-width="5"/><circle cx="72" cy="190" r="22" fill="none" stroke="#a78bfa" stroke-width="5"/>`
        + `<rect x="166" y="${top}" width="96" height="204" rx="14" fill="#efeaff" stroke="#c4b5fd" stroke-width="2"/>${blocks}<line x1="160" x2="268" y1="${top}" y2="${top}" stroke="#7c6cf0" stroke-width="3"/>`
        + `<text x="214" y="${top - 8}" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#4338ca">${LOC_HAVE} GB ${t('内存', 'memory')}</text>`
        + `<rect x="30" y="272" width="160" height="12" rx="6" fill="#4ade80"/><rect x="190" y="272" width="40" height="12" rx="0" fill="#facc15"/><rect x="230" y="272" width="60" height="12" rx="6" fill="#f87171"/><circle cx="${mx}" cy="278" r="9" fill="#fff" stroke="#4338ca" stroke-width="3"/>`;
    }
    function text() {
      const { p, q } = get(), f = locFit(p, q);
      say!.innerHTML = locSay(p, q, L);
      if (out) out.innerHTML = `<p>${t(`${p}B、${qName(q, L)}：权重 <b data-k="w">${gb(f.w)}</b> GB + 聊天记录 <b data-k="kv">${gb(f.kv)}</b> GB + 开销 ${gb(f.ov)} GB = <b data-k="need">${gb(f.need)}</b> GB（内存 ${LOC_HAVE} GB）。`, `${p}B, ${qName(q, L)}: weights <b data-k="w">${gb(f.w)}</b> GB + chat history <b data-k="kv">${gb(f.kv)}</b> GB + overhead ${gb(f.ov)} GB = <b data-k="need">${gb(f.need)}</b> GB (memory ${LOC_HAVE} GB).`)}</p>`;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    const on = () => { draw2d(); text(); h3?.refresh(); };
    sm.addEventListener('change', on);
    draw2d(); text();
    const api: LocApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, get };
    h3 = mount3d(env, box, () => import('../../three3d/loc'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { set: (p: number, q: Quant) => { sm.value = `${p}|${q}`; on(); }, fit: () => locFit(get().p, get().q) };
  };
  return { labs: [go], eager: () => {} };
}
