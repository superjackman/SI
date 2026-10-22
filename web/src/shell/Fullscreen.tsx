import { recover } from '../boot/stale';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/app';
import { useT, tx } from '../i18n/L';
import { tabn } from '../legacy/kb';
import { Viewer } from '../ui/diagram/Viewer';
import { fitAndMark } from '../station/hydrate';
import { drill, openInfo } from '../nav';
import { layer } from './common';
import type { Lang } from '../i18n/types';

type Wide = Record<string, { vb: string; html: string }>;
const wides = import.meta.glob<Wide>('../legacy/gen/st/*.wide.json', { import: 'default' });
const NS = 'http://www.w3.org/2000/svg';

function cardTitle(dg: HTMLElement, S: string, lang: Lang) {
  if (dg.closest('.m-stage')) return tabn(S, lang) + tx('fs.diagram', lang);
  const c = dg.closest('.card'); const h = c?.querySelector(':scope>h2,:scope>h3');
  return h ? (h.textContent ?? '').replace(/\s*(示例数据|示意|玩具).*$/, '').replace(/\s+(Sample data|Illustrative|Toy)\b.*$/, '').trim() : tabn(S, lang);
}
/** full-screen diagram: portrait shows the phone layout, landscape the original wide layout (live dgFull) */
export function Fullscreen() {
  const t = useT();
  const full = useApp((s) => s.full), lang = useApp((s) => s.lang), set = useApp((s) => s.set);
  const host = useRef<HTMLDivElement>(null), pRef = useRef<HTMLSpanElement>(null);
  const V = useRef<Viewer | null>(null);
  const FS = useRef<{ svg: SVGSVGElement | null; ph: Comment | null; orig: boolean }>({ svg: null, ph: null, orig: false });
  const [info, setInfo] = useState({ title: '', hint: '' });

  useEffect(() => {
    if (!host.current) return;
    const v = new Viewer(host.current, { full: true, onChange: (vv) => { if (pRef.current) pRef.current.textContent = Math.round(vv.s * 100) + '%'; }, onTap: (id) => openInfo(id), onDrill: (to, src) => drill(to, { src }) });
    V.current = v; return () => v.destroy();
  }, []);

  useEffect(() => {
    const h = host.current; const v = V.current;
    if (!full || !h || !v) return;
    let alive = true;
    const restoreDom = () => {
      const f = FS.current;
      if (f.svg) { if (f.orig) f.svg.remove(); else if (f.ph) { f.svg.style.width = ''; f.svg.style.height = ''; f.svg.style.transform = ''; f.ph.parentNode?.insertBefore(f.svg, f.ph); f.ph.remove(); } }
      FS.current = { svg: null, ph: null, orig: false };
    };
    const fit = () => {
      const g = h.querySelector('svg'); if (!g) return;
      const vb = g.viewBox.baseVal, W = h.clientWidth, H = h.clientHeight, a = vb.width / vb.height;
      let bw: number, bh: number; if (W / H > a) { bh = H; bw = H * a; } else { bw = W; bh = W / a; }
      if (!FS.current.orig && vb.height / vb.width > H / W) { bw = W; bh = W / a; }
      v.fw = bw; v.fh = bh; g.style.width = bw + 'px'; g.style.height = bh + 'px'; v.s = 1; v.tx = 0; v.ty = 0; v.apply();
    };
    const show = async () => {
      const dg = full.host; const svg = dg.querySelector('svg'); if (!svg) return;
      restoreDom();
      /* the training-mode panel is not part of the station snapshot: its original comes with the panel data */
      const W = await (dg.closest('#trainPanel')
        ? import('../station/train').then((m) => m.trainOrig(lang)).catch((e: unknown) => { void recover(e); return {} as Wide; })
        : wides[`../legacy/gen/st/${full.station}.${lang}.wide.json`]?.().catch((e: unknown) => { void recover(e); return {} as Wide; }) ?? Promise.resolve({} as Wide));
      if (!alive) return;
      const land = window.innerWidth > window.innerHeight, O = W[svg.id];
      if (land && O) {
        const c = document.createElementNS(NS, 'svg'); c.setAttribute('viewBox', O.vb); c.setAttribute('class', 'fs-orig');
        const tmp = document.createElementNS(NS, 'svg'); tmp.innerHTML = O.html;
        /* mirror live state: highlighted parts, recoloured nodes */
        const on = new Set([...svg.querySelectorAll<SVGElement>('.comp.run[data-id]')].map((g) => g.dataset.id));
        tmp.querySelectorAll<SVGElement>('.comp[data-id]').forEach((g) => { if (on.has(g.dataset.id)) g.classList.add('run'); });
        tmp.querySelectorAll('[id]').forEach((e) => { const l = document.getElementById(e.id); if (l && svg.contains(l)) ['class', 'fill', 'stroke'].forEach((a) => { const x = l.getAttribute(a); if (x != null) e.setAttribute(a, x); }); });
        c.innerHTML = tmp.innerHTML.replace(/\sid="([^"]+)"/g, ' id="$1__fs"').replace(/url\(#([^)]+)\)/g, 'url(#$1__fs)');
        h.appendChild(c); FS.current = { svg: c, ph: null, orig: true };
        fitAndMark(h, full.station, lang);
      } else {
        const ph = document.createComment('dg'); svg.parentNode?.insertBefore(ph, svg); svg.style.transform = ''; h.appendChild(svg);
        FS.current = { svg, ph, orig: false };
      }
      setInfo({ title: cardTitle(dg, full.station, lang), hint: FS.current.orig ? tx('fs.hintWide', lang) : O ? tx('fs.hintTurn', lang) : tx('fs.hint', lang) });
      requestAnimationFrame(fit);
      setTimeout(() => document.querySelector<HTMLElement>('#dgFull .fs-x')?.focus({ preventScroll: true }), 60);
    };
    void show();
    document.body.classList.add('fs-open');
    let rt = 0; let wasLand = window.innerWidth > window.innerHeight;
    const onResize = () => { clearTimeout(rt); rt = window.setTimeout(() => { const land = window.innerWidth > window.innerHeight; if (land !== wasLand) { wasLand = land; void show(); } else fit(); }, 150); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !useApp.getState().popup) { e.stopPropagation(); set({ full: null }); } };
    addEventListener('resize', onResize); document.addEventListener('keydown', onKey, true);
    return () => {
      alive = false; clearTimeout(rt); removeEventListener('resize', onResize); document.removeEventListener('keydown', onKey, true);
      restoreDom(); document.body.classList.remove('fs-open');
      (full.host as HTMLElement & { __v?: Viewer }).__v?.reset();
      full.host.parentElement?.querySelector<HTMLElement>('[data-vz=full]')?.focus({ preventScroll: true });
    };
  }, [full, lang, set]);

  const open = !!full;
  return (
    <div id="dgFull" className={open ? 'open' : undefined} role="dialog" aria-modal="true" aria-label={t('fs.label')} {...layer(open)}>
      <div className="fs-bar" onClick={(e) => {
        const b = (e.target as Element).closest<HTMLElement>('[data-fz]'); if (!b) return; const k = b.dataset.fz, v = V.current;
        if (k === 'close') set({ full: null }); else if (k === 'reset') v?.reset(true); else v?.step(k === 'in' ? 1.5 : 1 / 1.5);
      }}>
        <b id="fsT">{info.title}</b>
        <button className="vz" data-fz="out" aria-label={t('fs.out')}>−</button>
        <span className="vp" id="fsP" ref={pRef}>100%</span>
        <button className="vz" data-fz="in" aria-label={t('fs.in')}>{lang === 'en' ? '+' : '＋'}</button>
        <button className="vz" data-fz="reset" aria-label={t('fs.reset')}>⟲</button>
        <button className="vz fs-x" data-fz="close" aria-label={t('fs.exit')}>×</button>
      </div>
      <div className="fs-host m-vw" id="fsHost" ref={host} />
      <div className="fs-hint" id="fsHint">{info.hint}</div>
    </div>
  );
}
