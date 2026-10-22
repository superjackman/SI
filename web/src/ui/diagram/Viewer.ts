/* Pan / zoom viewer for diagrams — TypeScript port of the live page's Viewer (same gestures and numbers):
   pinch (two pointers) and double-tap zoom 1×–4×, drag to pan when zoomed (vertical drag past the edge scrolls the page),
   Ctrl+wheel zoom, single tap on a part opens it (after the double-tap window), tap on a ⤵ badge drills down.
   `full` = the full-screen host: the drawing is sized by the caller (fw/fh) and can always be dragged. */
export interface ViewerOpts {
  full?: boolean;
  onChange?: (v: Viewer) => void;
  onTap?: (id: string) => void;
  onDrill?: (to: string, src: string) => void;
}
const MAXS = 4;
const tbH = () => document.getElementById('topbar')?.offsetHeight ?? 52;
const bnH = () => document.getElementById('bnav')?.offsetHeight ?? 58;
type Pt = { x: number; y: number };

export class Viewer {
  s = 1; tx = 0; ty = 0; atx = 0; aty = 0;
  fw = 0; fh = 0; sup = 0;
  private pts: Record<number, Pt> = {};
  private start: Pt | null = null;
  private pin: { d: number; c: Pt; s: number; tx: number; ty: number } | null = null;
  private moved = false; private lastTap = 0; private lx = 0; private ly = 0;
  private tapT = 0; private at = 0; private att = false;
  private off: Array<() => void> = [];

  constructor(readonly host: HTMLElement, readonly o: ViewerOpts = {}) {
    (host as HTMLElement & { __v?: Viewer }).__v = this;
    host.classList.add('m-vw');
    const on = <K extends keyof HTMLElementEventMap>(t: K, f: (e: HTMLElementEventMap[K]) => void, opt?: AddEventListenerOptions | boolean) => {
      host.addEventListener(t, f as EventListener, opt); this.off.push(() => host.removeEventListener(t, f as EventListener, opt));
    };
    on('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      const k = this.ids();
      if (k.length === 1) { this.start = { x: e.clientX, y: e.clientY }; this.moved = false; }
      if (k.length === 2) { const a = this.pts[k[0]!]!, b = this.pts[k[1]!]!; this.pin = { d: dist(a, b), c: mid(a, b), s: this.s, tx: this.tx, ty: this.ty }; this.moved = true; host.classList.add('gest'); }
      this.attach();
    });
    on('gesturestart' as keyof HTMLElementEventMap, (e) => e.preventDefault());
    on('touchmove', (e) => { if (e.touches.length > 1 && e.cancelable) e.preventDefault(); }, { passive: false });
    on('click', (e) => this.click(e), true);
    on('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); this.zoomAt(e.clientX, e.clientY, this.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
  }
  svg(): SVGSVGElement | null { return this.host.querySelector('svg'); }
  private geo() {
    const g = this.svg(), host = this.host;
    if (!g) return { bw: 1, bh: 1, ox: 0, oy: 0 };
    if (this.o.full) return { bw: this.fw || 1, bh: this.fh || 1, ox: 0, oy: 0 };
    const gr = g.getBoundingClientRect(), hr = host.getBoundingClientRect();
    return { bw: g.clientWidth || host.clientWidth, bh: g.clientHeight || host.clientHeight, ox: gr.left - hr.left - host.clientLeft - this.atx, oy: gr.top - hr.top - host.clientTop - this.aty };
  }
  apply(): void {
    const g = this.svg(); if (!g) return;
    const G = this.geo(), W = this.host.clientWidth, H = this.host.clientHeight, cw = G.bw * this.s, ch = G.bh * this.s;
    if (cw <= W + 0.5) this.tx = (W - cw) / 2 - G.ox; else this.tx = Math.min(-G.ox, Math.max(W - cw - G.ox, this.tx));
    if (ch <= H + 0.5) this.ty = (H - ch) / 2 - G.oy; else this.ty = Math.min(-G.oy, Math.max(H - ch - G.oy, this.ty));
    g.style.transformOrigin = '0 0';
    const clr = this.s === 1 && !this.o.full && Math.abs(this.tx) < 0.5 && Math.abs(this.ty) < 0.5;
    g.style.transform = clr ? '' : `translate(${this.tx.toFixed(1)}px,${this.ty.toFixed(1)}px) scale(${this.s.toFixed(3)})`;
    this.atx = clr ? 0 : +this.tx.toFixed(1); this.aty = clr ? 0 : +this.ty.toFixed(1);
    const z = this.s > 1.001;
    this.host.classList.toggle('zoomed', z);
    this.host.style.touchAction = z || this.o.full ? 'none' : 'pan-y';
    this.o.onChange?.(this);
  }
  private clampS(s: number) { return Math.max(1, Math.min(MAXS, s)); }
  zoomAt(cx: number, cy: number, ns: number, anim?: boolean): void {
    const r = this.host.getBoundingClientRect(), G = this.geo(); ns = this.clampS(ns);
    const px = (cx - r.left - G.ox - this.tx) / this.s, py = (cy - r.top - G.oy - this.ty) / this.s;
    this.s = ns; this.tx = cx - r.left - G.ox - px * ns; this.ty = cy - r.top - G.oy - py * ns; this.anim(anim); this.apply();
  }
  private anim(on?: boolean) { if (!on) return; this.host.classList.add('anim'); clearTimeout(this.at); this.at = window.setTimeout(() => this.host.classList.remove('anim'), 260); }
  private center(): Pt {
    const r = this.host.getBoundingClientRect();
    let top = Math.max(r.top, tbH()), bot = Math.min(r.bottom, innerHeight - (this.o.full ? 0 : bnH()));
    if (bot <= top) { top = r.top; bot = r.bottom; }
    return { x: r.left + r.width / 2, y: (top + bot) / 2 };
  }
  step(f: number): void { const c = this.center(); this.zoomAt(c.x, c.y, this.s * f, true); }
  reset(anim?: boolean): void { this.s = 1; this.tx = 0; this.ty = 0; this.sup = 0; this.anim(anim); this.apply(); }
  private dbl(x: number, y: number) { if (this.s > 1.001) this.reset(true); else this.zoomAt(x, y, 2.2, true); }
  private ids() { return Object.keys(this.pts).map(Number); }
  private move = (e: PointerEvent) => {
    const p = this.pts[e.pointerId]; if (!p) return;
    const lx = p.x, ly = p.y; p.x = e.clientX; p.y = e.clientY; const k = this.ids();
    if (k.length >= 2 && this.pin) {
      const a = this.pts[k[0]!]!, b = this.pts[k[1]!]!, d = dist(a, b), c = mid(a, b), r = this.host.getBoundingClientRect(), G = this.geo();
      const ns = this.clampS(this.pin.s * d / Math.max(10, this.pin.d));
      const px = (this.pin.c.x - r.left - G.ox - this.pin.tx) / this.pin.s, py = (this.pin.c.y - r.top - G.oy - this.pin.ty) / this.pin.s;
      this.s = ns; this.tx = c.x - r.left - G.ox - px * ns; this.ty = c.y - r.top - G.oy - py * ns; this.apply();
      if (e.cancelable) e.preventDefault(); return;
    }
    if (k.length === 1 && this.start) {
      const dx = e.clientX - this.start.x, dy = e.clientY - this.start.y;
      if (Math.abs(dx) + Math.abs(dy) > 8) this.moved = true;
      if (this.s > 1.001 || this.o.full) {
        const want = this.ty + (e.clientY - ly); this.tx += e.clientX - lx; this.ty = want; this.apply();
        const left = want - this.ty; if (!this.o.full && Math.abs(left) > 0.5) scrollBy(0, -left);
        if (e.cancelable) e.preventDefault();
      }
    }
  };
  private up = (e: PointerEvent) => {
    if (!this.pts[e.pointerId]) return; delete this.pts[e.pointerId]; const k = this.ids();
    if (k.length < 2 && this.pin) { this.pin = null; this.host.classList.remove('gest'); if (this.s < 1.04) this.reset(true); }
    if (k.length === 1) { const p = this.pts[k[0]!]!; this.start = { x: p.x, y: p.y }; }
    if (!k.length) { this.start = null; if (this.moved) this.sup = Date.now(); this.detach(); }
  };
  private attach() { if (this.att) return; this.att = true; addEventListener('pointermove', this.move, { passive: false }); addEventListener('pointerup', this.up); addEventListener('pointercancel', this.up); }
  private detach() { this.att = false; removeEventListener('pointermove', this.move); removeEventListener('pointerup', this.up); removeEventListener('pointercancel', this.up); }
  private click(e: MouseEvent) {
    e.stopPropagation();
    if (this.sup && Date.now() - this.sup < 450) { e.preventDefault(); return; }
    const t = e.target as Element | null;
    const dd = t?.closest?.('.dd-b') as SVGGElement | null;
    if (dd) { e.preventDefault(); clearTimeout(this.tapT); this.lastTap = 0; this.o.onDrill?.(dd.dataset.dd || '', dd.dataset.ddid || ''); return; }
    const now = Date.now();
    if (now - this.lastTap < 330 && Math.hypot(e.clientX - this.lx, e.clientY - this.ly) < 40) { clearTimeout(this.tapT); this.lastTap = 0; this.dbl(e.clientX, e.clientY); return; }
    this.lastTap = now; this.lx = e.clientX; this.ly = e.clientY;
    const comp = t?.closest?.('.comp[data-id]') as SVGGElement | null;
    clearTimeout(this.tapT);
    if (comp) {
      const id = comp.dataset.id || '';
      comp.classList.add('tapped'); setTimeout(() => comp.classList.remove('tapped'), 300);
      this.tapT = window.setTimeout(() => { this.lastTap = 0; this.o.onTap?.(id); }, 300);
    }
  }
  destroy(): void { this.detach(); this.off.forEach((f) => f()); this.off = []; clearTimeout(this.tapT); clearTimeout(this.at); }
}
function dist(a: Pt, b: Pt) { return Math.hypot(a.x - b.x, a.y - b.y); }
function mid(a: Pt, b: Pt): Pt { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
