/* R35: teaching callouts. Short notes pinned to parts of the 3D scene (projected every frame, so they follow the orbit),
   each with a thin leader line to its part and a pulsing ring on the part itself (the "tap me" sign). Every frame they
   are laid out again: above their part if there is room, else pushed up, else below, else shrunk to the title, else
   hidden, never over each other, over a label, under the top bar or into the bottom bar. A note either opens the shell's
   info card (lab, map) or picks its thing (idea stands, zones), which opens that thing's bubble. Loaded lazily. */
import type { P3 } from '../three3d/p3/base';

export interface Card { t: string; p: string; tr?: string }
export interface Note {
  /** the scene mark it points at (see P3.mark) */
  at: string;
  /** the title and the short text */
  b: string; s?: string;
  /** what a tap opens: the info card, or a pick of thing k */
  card?: Card; pick?: number;
  /** follow the visibility of label k (a turning carousel shows only its front labels) */
  tie?: number;
  /** adopt this element (an existing label button) instead of making one */
  el?: HTMLElement | undefined;
}
interface Live { n: Note; el: HTMLElement; bx: HTMLElement; line: HTMLElement; dot: HTMLElement; w: number; h: number; small: boolean }
type R4 = [number, number, number, number];
const hit = (a: R4, b: R4, m = 4) => a[0] < b[0] + b[2] + m && b[0] < a[0] + a[2] + m && a[1] < b[1] + b[3] + m && b[1] < a[1] + a[3] + m;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function notes(box: HTMLElement, v: P3, list: Note[], o: { open(c: Card, from: HTMLElement): void; foot(): number; info: string }) {
  const layer = document.createElement('div'); layer.className = 'w3n-layer'; layer.setAttribute('aria-hidden', 'false'); box.appendChild(layer);
  const inner = (n: Note) => `<b>${esc(n.b)}</b>${n.s ? `<small>${esc(n.s)}</small>` : ''}<i class="w3n-i" aria-hidden="true">i</i>`;
  const live: Live[] = list.map((n, k) => {
    let el: HTMLElement, bx: HTMLElement;
    if (n.el) { el = n.el; bx = el.firstElementChild as HTMLElement; bx.innerHTML = inner(n); el.classList.add('w3n'); delete el.dataset.clamp; }
    else {
      el = document.createElement('button'); (el as HTMLButtonElement).type = 'button'; el.className = 'w3n w3n-x'; bx = el;
      el.innerHTML = inner(n); el.dataset.note = String(k);
      if (n.pick !== undefined) el.dataset.pick = String(n.pick);
      else if (n.card) el.addEventListener('click', (e) => { e.stopPropagation(); o.open(n.card!, el); });
      layer.appendChild(el);
    }
    el.setAttribute('aria-label', `${n.b}${n.s ? ': ' + n.s : ''} · ${o.info}`);
    /* the marker on the part itself: a 44 px tap target with a pulsing ⓘ, doing what the note does */
    const line = document.createElement('i'); line.className = 'w3n-l';
    const dot = document.createElement('button'); dot.type = 'button'; dot.className = 'w3n-d'; dot.innerHTML = '<i aria-hidden="true">i</i>';
    dot.setAttribute('aria-label', `${n.b} · ${o.info}`);
    if (n.pick !== undefined) dot.dataset.pick = String(n.pick);
    else if (n.card) dot.addEventListener('click', (e) => { e.stopPropagation(); o.open(n.card!, el); });
    layer.prepend(line); layer.appendChild(dot);
    return { n, el, bx, line, dot, w: 0, h: 0, small: false };
  });
  let W = 0, H = 0;
  const hide = (l: Live) => { l.el.classList.add('w3n-off'); l.line.hidden = true; l.dot.hidden = true; };
  const size = (l: Live, small: boolean) => {
    if (l.w && l.small === small) return;
    l.small = small; l.el.classList.toggle('w3n-s', small); l.w = l.bx.offsetWidth; l.h = l.bx.offsetHeight;
  };
  const lay = () => {
    const bw = box.clientWidth, bh = box.clientHeight;
    if (bw !== W || bh !== H) { W = bw; H = bh; live.forEach((l) => { l.w = 0; }); }
    const top = (Number(box.dataset.padt) || 0) + 4, bot = Math.min(bh, o.foot()) - 6;
    const shut = box.querySelector('.p3b:not([hidden])') || box.closest('[data-card="1"]') || box.querySelector('.w3-wel');
    const B = box.getBoundingClientRect();
    /* labels that are not notes stay readable: the notes go round them */
    const used: R4[] = [];
    box.querySelectorAll<HTMLElement>('.s3t:not(.w3n):not([hidden])>span').forEach((s) => { const r = s.getBoundingClientRect(); if (r.width && getComputedStyle(s).opacity !== '0') used.push([r.left - B.left, r.top - B.top, r.width, r.height]); });
    const tags = used.slice();
    /* where each part is on screen this frame; the ⓘ markers are kept clear so a note never covers one */
    const pts = live.map((l) => {
      const n = l.n, at = v.mark(n.at);
      if (shut || !at || (n.el && n.el.hidden)) return null;
      if (n.tie !== undefined) { const t = box.querySelector<HTMLElement>(`.p3l[data-pick="${n.tie}"]`); if (!t || t.hidden) return null; }
      const [ax, a0, front] = v.proj(at);
      /* a marker never sits on a name tag: it moves up just clear of it */
      let ay = a0;
      for (let i = 0; i < 4; i++) { const t = tags.find((r) => ax > r[0] - 11 && ax < r[0] + r[2] + 11 && ay > r[1] - 11 && ay < r[1] + r[3] + 11); if (!t) break; ay = t[1] - 12; }
      return !front || ax < 0 || ax > W || ay < top || ay > bot ? null : [ax, ay] as const;
    });
    pts.forEach((p) => { if (p) used.push([p[0] - 11, p[1] - 11, 22, 22]); });
    for (const [k, l] of live.entries()) {
      const n = l.n, pt = pts[k];
      if (!pt) { hide(l); continue; }
      const [ax, ay] = pt;
      let spot: R4 | null = null;
      for (const small of n.s ? [false, true] : [false]) {
        size(l, small);
        const w = l.w, h = l.h, x = Math.max(6, Math.min(W - 6 - w, ax - w / 2));
        const ys: number[] = [];
        for (let y = ay - 18 - h; y >= top; y -= 10) ys.push(y);
        for (let y = ay + 18; y + h <= bot; y += 10) ys.push(y);
        for (const y of ys) { const r: R4 = [x, y, w, h]; if (!used.some((u) => hit(u, r))) { spot = r; break; } }
        if (spot) break;
      }
      if (!spot) { hide(l); continue; }
      used.push(spot);
      const [x, y, w, h] = spot;
      l.el.classList.remove('w3n-off');
      l.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      /* the leader: from the note's nearest edge to the part */
      const lx = Math.max(x + 12, Math.min(x + w - 12, ax)), ly = y + h / 2 < ay ? y + h : y;
      const dx = ax - lx, dy = ay - ly, len = Math.hypot(dx, dy);
      l.line.hidden = len < 4; l.line.style.width = `${len.toFixed(1)}px`;
      l.line.style.transform = `translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px) rotate(${Math.atan2(dy, dx).toFixed(3)}rad)`;
      l.dot.hidden = false; l.dot.style.transform = `translate(${ax.toFixed(1)}px,${ay.toFixed(1)}px)`;
    }
  };
  v.onDraw(lay); v.redraw();
  return {
    /** lay out again (the bubble or the card opened or closed) */
    redo() { v.redraw(); },
    free() { v.onDraw(null); layer.remove(); live.forEach((l) => { if (l.n.el) { l.el.classList.remove('w3n', 'w3n-off', 'w3n-s'); l.el.style.transform = ''; } }); },
  };
}
