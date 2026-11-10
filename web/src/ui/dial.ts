/* Linear dials. Value follows the pointer's travel from the press point (dx − dy),
   never the angle around the knob, so passing the centre cannot reverse the direction. */
const PX = 180;

export function dialSens(min: number, max: number): number {
  const span = max - min;
  return span === 0 ? 0 : span / PX;
}

export function dialFromDrag(start: number, dx: number, dy: number, min: number, max: number): number {
  const v = start + (dx - dy) * dialSens(min, max);
  return Math.min(max, Math.max(min, v));
}

/** 0° is up. A larger value turns the needle clockwise, in step with the number. */
export function dialAngle(v: number, min: number, max: number): number {
  const t = max === min ? 0 : (v - min) / (max - min);
  return -140 + Math.min(1, Math.max(0, t)) * 280;
}

export function dialNeedle(cx: number, cy: number, len: number, v: number, min: number, max: number) {
  const ang = dialAngle(v, min, max) * Math.PI / 180;
  return { x2: cx + Math.sin(ang) * len, y2: cy - Math.cos(ang) * len };
}

/** Radius, in viewBox units, of a hit target at least 32 CSS pixels across. */
export function dialHitRadius(viewW: number, clientW: number, visual: number): number {
  const scale = clientW > 0 && viewW > 0 ? clientW / viewW : 1;
  return Math.max(visual, 16 / scale);
}

export function dialText(v: number): string {
  return v.toFixed(2);
}

export interface DialSpec {
  min: number;
  max: number;
  step?: number;
  get: () => number;
  set: (n: number) => void;
  anchor?: () => Element | null;
}

let tip: HTMLDivElement | null = null;
let tipTimer = 0;

function showTip(el: Element, text: string) {
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'dial-read';
    document.body.appendChild(tip);
  }
  const r = el.getBoundingClientRect();
  const left = Math.min(Math.max(8, r.right + 8), Math.max(8, window.innerWidth - 72));
  tip.style.left = `${left}px`;
  tip.style.top = `${r.top + r.height / 2}px`;
  tip.textContent = text;
}

function hideTip() {
  window.clearTimeout(tipTimer);
  tip?.remove();
  tip = null;
}

function stepOf(spec: DialSpec): number {
  if (spec.step && spec.step > 0) return spec.step;
  return (spec.max - spec.min) / 40;
}

function nudge(spec: DialSpec, dir: number) {
  const step = stepOf(spec);
  const next = Math.min(spec.max, Math.max(spec.min, spec.get() + dir * step));
  spec.set(next);
  const at = spec.anchor?.() ?? null;
  if (at) showTip(at, dialText(next));
  window.clearTimeout(tipTimer);
  tipTimer = window.setTimeout(() => { if (!document.body.classList.contains('dial-drag')) hideTip(); }, 700);
}

const blockSel = (e: Event) => e.preventDefault();

function armDrag() {
  document.body.classList.add('dial-drag');
  document.body.style.userSelect = 'none';
  document.body.style.setProperty('-webkit-user-select', 'none');
  document.addEventListener('selectstart', blockSel);
}

function disarmDrag() {
  document.body.classList.remove('dial-drag');
  document.body.style.userSelect = '';
  document.body.style.removeProperty('-webkit-user-select');
  document.removeEventListener('selectstart', blockSel);
  hideTip();
}

/** Pointer, wheel and arrow keys for one stable element (a slider, or an svg that keeps its knobs). */
export function bindDials(root: Element, resolve: (target: Element) => DialSpec | null): void {
  if ((root as HTMLElement).dataset.dialBound) return;
  (root as HTMLElement).dataset.dialBound = '1';
  root.classList.add('dial');
  let drag: { id: number; x: number; y: number; start: number; spec: DialSpec } | null = null;

  const place = (spec: DialSpec, v: number) => {
    const at = spec.anchor?.();
    if (at) showTip(at, dialText(v));
  };

  root.addEventListener('pointerdown', (ev) => {
    if (!(ev instanceof PointerEvent) || ev.button !== 0 || drag) return;
    const spec = resolve(ev.target as Element);
    if (!spec) return;
    ev.preventDefault();
    (root as Element & { setPointerCapture?: (id: number) => void }).setPointerCapture?.(ev.pointerId);
    const at = spec.anchor?.() ?? (ev.target as Element).closest('[data-i], input');
    if (at && 'focus' in at) (at as HTMLElement).focus({ preventScroll: true });
    armDrag();
    drag = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, start: spec.get(), spec };
    place(spec, spec.get());
  });

  root.addEventListener('pointermove', (ev) => {
    if (!(ev instanceof PointerEvent) || !drag || ev.pointerId !== drag.id) return;
    ev.preventDefault();
    const cap = root as Element & { setPointerCapture?: (id: number) => void };
    if (!cap.hasPointerCapture?.(ev.pointerId)) cap.setPointerCapture?.(ev.pointerId);
    const v = dialFromDrag(drag.start, ev.clientX - drag.x, ev.clientY - drag.y, drag.spec.min, drag.spec.max);
    drag.spec.set(v);
    place(drag.spec, v);
  });

  const end = (ev: Event) => {
    if (!drag) return;
    if (ev instanceof PointerEvent && ev.pointerId !== drag.id) return;
    if (ev.type === 'lostpointercapture' && ev instanceof PointerEvent && ev.buttons > 0) return;
    drag = null;
    disarmDrag();
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  root.addEventListener('lostpointercapture', end);

  root.addEventListener('wheel', (ev) => {
    if (!(ev instanceof WheelEvent)) return;
    const spec = resolve(ev.target as Element);
    if (!spec) return;
    ev.preventDefault();
    const dir = ev.deltaY > 0 || ev.deltaX > 0 ? -1 : ev.deltaY < 0 || ev.deltaX < 0 ? 1 : 0;
    if (!dir) return;
    nudge(spec, dir);
  }, { passive: false });

  root.addEventListener('keydown', (ev) => {
    if (!(ev instanceof KeyboardEvent)) return;
    const spec = resolve(ev.target as Element);
    if (!spec) return;
    const dir = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0;
    if (!dir) return;
    ev.preventDefault();
    nudge(spec, dir);
  });
}

function rangeSpec(input: HTMLInputElement): DialSpec {
  const min = Number(input.min);
  const max = Number(input.max);
  const step = Number(input.step);
  const lo = Number.isFinite(min) ? min : 0;
  const hi = Number.isFinite(max) ? max : 100;
  return {
    min: lo,
    max: hi,
    ...(step > 0 ? { step } : {}),
    get: () => input.valueAsNumber,
    set: (n) => {
      const s = step > 0 ? step : 0;
      const snapped = s ? Math.round(n / s) * s : n;
      const next = Math.min(hi, Math.max(lo, snapped));
      input.value = String(Number(next.toFixed(6)));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    anchor: () => input,
  };
}

export function bindRange(input: HTMLInputElement): void {
  input.dataset.drag = 'range';
  bindDials(input, () => rangeSpec(input));
}

/** A press-and-drag that is not a number knob: lock the pointer, do not select text,
    and report travel from the press point. `value` is what an e2e reads back. */
export function bindOrbit(el: HTMLElement, o: { value: () => number; begin?: () => void; move: (dx: number, dy: number) => void }): void {
  if (el.dataset.dragBound) return;
  el.dataset.dragBound = '1';
  el.dataset.drag = el.dataset.drag || 'orbit';
  el.classList.add('dial');
  let drag: { id: number; x: number; y: number } | null = null;
  const sync = () => { el.dataset.v = String(o.value()); };
  sync();
  el.addEventListener('pointerdown', (ev) => {
    if (!(ev instanceof PointerEvent) || ev.button !== 0 || drag) return;
    ev.preventDefault();
    el.setPointerCapture?.(ev.pointerId);
    o.begin?.();
    armDrag();
    drag = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
    sync();
  });
  el.addEventListener('pointermove', (ev) => {
    if (!(ev instanceof PointerEvent) || !drag || ev.pointerId !== drag.id) return;
    ev.preventDefault();
    if (!el.hasPointerCapture?.(ev.pointerId)) el.setPointerCapture?.(ev.pointerId);
    o.move(ev.clientX - drag.x, ev.clientY - drag.y);
    sync();
  });
  const end = (ev: Event) => {
    if (!drag) return;
    if (ev instanceof PointerEvent && ev.pointerId !== drag.id) return;
    if (ev.type === 'lostpointercapture' && ev instanceof PointerEvent && ev.buttons > 0) return;
    drag = null;
    disarmDrag();
    sync();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
}

/** Hover tilt and other presses that must not select text. Keeps the caller's own move handler. */
export function guardPointer(el: HTMLElement, value: () => number): void {
  if (el.dataset.dragBound) return;
  el.dataset.dragBound = '1';
  el.dataset.drag = el.dataset.drag || 'tilt';
  el.classList.add('dial');
  let id = -1;
  const sync = () => { el.dataset.v = String(value()); };
  sync();
  el.addEventListener('pointerdown', (ev) => {
    if (!(ev instanceof PointerEvent) || ev.button !== 0) return;
    el.setPointerCapture?.(ev.pointerId);
    armDrag();
    id = ev.pointerId;
    sync();
  });
  el.addEventListener('pointermove', () => { if (id >= 0) sync(); });
  const end = (ev: Event) => {
    if (id < 0) return;
    if (ev instanceof PointerEvent && ev.pointerId !== id) return;
    if (ev.type === 'lostpointercapture' && ev instanceof PointerEvent && ev.buttons > 0) return;
    id = -1;
    disarmDrag();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
}

let installed = false;

/** Every range on the page, including ones added later, uses the same drag. */
export function installDials(doc: Document = document): void {
  if (installed || !doc.body) return;
  installed = true;
  const scan = (root: ParentNode) => {
    root.querySelectorAll?.('input[type="range"]').forEach((el) => {
      if (el instanceof HTMLInputElement) bindRange(el);
    });
  };
  scan(doc);
  new MutationObserver((recs) => {
    for (const r of recs) r.addedNodes.forEach((n) => {
      if (!(n instanceof Element)) return;
      if (n instanceof HTMLInputElement && n.type === 'range') bindRange(n);
      scan(n);
    });
  }).observe(doc.body, { childList: true, subtree: true });
}
