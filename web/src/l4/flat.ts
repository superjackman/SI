/* R38: 2D fallback used only when the browser has no WebGL. Same geometry as the 3D stage, drawn as SVG. */
import { flowPath, STY, type Desc } from './layout';
import { NODES, PLUS } from './txt';
import type { Stage } from './scene3d';

const NS = 'http://www.w3.org/2000/svg';
export function stageFlat(host: HTMLElement): Stage {
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'l4-gl l4-flat'); host.prepend(svg);
  return {
    el: svg as unknown as HTMLCanvasElement,
    set(D: Desc) {
      const L = D.lay; svg.setAttribute('width', String(L.W)); svg.setAttribute('height', String(L.H)); svg.setAttribute('viewBox', `0 0 ${L.W} ${L.H}`);
      const f = L.frame, ac = D.back ? '#ff9a3c' : '#6f9cff', rc = D.resOn ? '#8fe3ff' : '#4f72c8'; let s = '';
      s += `<defs><marker id="l4h" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${ac}"/></marker>`;
      s += `<marker id="l4r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${rc}"/></marker></defs>`;
      s += `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="10" fill="${D.frameLit ? '#10224e8c' : '#08123059'}" stroke="${D.frameLit ? '#9cc8ff' : '#4a66b8'}" ${D.frameLit ? '' : 'stroke-dasharray="5 4"'}/>`;
      for (const a of L.arrows) {
        const dim = D.st[a.lo] === 'dim' || D.st[a.hi] === 'dim';
        s += D.back ? `<line x1="${a.x}" y1="${a.y2 + 1}" x2="${a.x}" y2="${a.y1 - 2}" stroke="${ac}" stroke-width="2" opacity="${dim ? 0.35 : 0.9}" marker-end="url(#l4h)"/>`
          : `<line x1="${a.x}" y1="${a.y1 - 1}" x2="${a.x}" y2="${a.y2 + 2}" stroke="${ac}" stroke-width="2" opacity="${dim ? 0.35 : 0.9}" marker-end="url(#l4h)"/>`;
      }
      for (const r of L.res) s += `<polyline points="${r.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${rc}" stroke-width="${D.resOn ? 2 : 1.5}" marker-end="url(#l4r)"/>`;
      for (const n of NODES) {
        const b = L.box[n], c = STY[D.st[n]];
        s += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="8" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"${c.glow > 0.5 ? ` style="filter:drop-shadow(0 0 6px ${c.stroke})"` : ''}/>`;
        if (PLUS.has(n)) s += `<circle cx="${b.x + b.w - 11}" cy="${b.y + b.h / 2}" r="7" fill="${D.st[n] === 'dim' ? '#1a2850' : '#2a56d6'}"/>`;
      }
      if (D.sel && L.panel) { const b = L.box[D.sel], y = b.y + b.h / 2;
        s += `<line x1="${b.x + b.w}" y1="${y}" x2="${L.panel.x}" y2="${y}" stroke="#8fe3ff" stroke-width="3" style="filter:drop-shadow(0 0 4px #8fe3ff)"/><circle cx="${L.panel.x}" cy="${y}" r="4" fill="#d6f6ff"/>`; }
      if (D.flow) { const p = flowPath(L, D.flow.a, D.flow.b), [a, b] = D.flow.back ? [p[1]!, p[0]!] : [p[0]!, p[1]!];
        s += `<circle r="5" fill="${D.flow.back ? '#ffb060' : '#bfe6ff'}"><animateMotion dur="2.2s" repeatCount="indefinite" path="M${a[0]} ${a[1]}L${b[0]} ${b[1]}"/></circle>`; }
      svg.innerHTML = s;
    },
    dispose() { svg.remove(); },
  };
}
