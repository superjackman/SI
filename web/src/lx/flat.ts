/* R39: the 2D fallback (no WebGL): the same geometry as SVG. */
import { animOn } from '../store/prefs';
import { ACOL, STY, type G } from './geo';
import type { LxStage } from './scene';

const NS = 'http://www.w3.org/2000/svg';
export function lxFlat(host: HTMLElement): LxStage {
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'l4-gl l4-flat lx-gl'); host.prepend(svg);
  return {
    el: svg as unknown as HTMLElement,
    set(D: G) {
      svg.setAttribute('width', String(D.W)); svg.setAttribute('height', String(D.H)); svg.setAttribute('viewBox', `0 0 ${D.W} ${D.H}`);
      let s = '<defs>' + Object.entries({ ...ACOL, g0: '#8a7440', g1: '#ffd27a' }).map(([k, c]) => `<marker id="lxm-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('') + '</defs>';
      for (const f of D.frames) { const on = f.st === 'lit' || f.st === 'sel'; s += `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="10" fill="#0a173680" stroke="${on ? '#9cc8ff' : f.st === 'dim' ? '#24345c' : '#3a5cc0'}" ${on ? '' : 'stroke-dasharray="5 3"'}/>`; }
      for (const e of D.edges) {
        const k = e.gold ? (e.st === 'lit' ? 'g1' : 'g0') : e.st, col = e.gold ? (e.st === 'lit' ? '#ffd27a' : '#8a7440') : ACOL[e.st], on = e.st === 'lit' || e.st === 'or';
        const pts = e.pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
        if (on) s += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="6" opacity=".25"/>`;
        s += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="${on ? 2.4 : 1.4}"${e.dash ? ' stroke-dasharray="3 3"' : ''}${e.head ? ` marker-end="url(#lxm-${k})"` : ''}/>`;
      }
      for (const n of D.nodes) {
        const c = n.tag ? { fill: '#0d1f4a', stroke: n.tag, glow: 0 } : STY[n.st];
        s += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.r}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"${c.glow > 0.4 ? ` style="filter:drop-shadow(0 0 6px ${c.stroke})"` : ''}/>`;
        if (n.plus) s += `<circle cx="${n.x + n.w - 11}" cy="${n.y + n.h / 2}" r="7" fill="${n.st === 'dim' ? '#1a2850' : '#2a56d6'}"/>`;
      }
      if (D.conn) s += `<line x1="${D.conn.x1}" y1="${D.conn.y}" x2="${D.conn.x2}" y2="${D.conn.y}" stroke="#8fe3ff" stroke-width="3" style="filter:drop-shadow(0 0 4px #8fe3ff)"/><circle cx="${D.conn.x2}" cy="${D.conn.y}" r="4" fill="#d6f6ff"/>`;
      for (const p of D.flow) s += animOn() ? `<circle r="5" fill="#bfe6ff"><animateMotion dur="2.2s" repeatCount="indefinite" path="M${p.map((q) => q.map((v) => v.toFixed(1)).join(' ')).join('L')}"/></circle>` : `<circle r="5" cx="${p[0]![0].toFixed(1)}" cy="${p[0]![1].toFixed(1)}" fill="#bfe6ff"/>`;
      svg.innerHTML = s;
    },
    dispose() { svg.remove(); },
  };
}
