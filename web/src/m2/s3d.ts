/* R30: the light half of a 3D scene (no three.js here). A lab draws its 2D figure first; only when the scene box itself is
   on screen, the page is visible, WebGL works and the reader has not asked for reduced motion, it dynamic-imports the
   scene module (which pulls the separate three.js chunk) and lays the 3D canvas over the 2D figure. Leaving the box,
   hiding the page or leaving the stop stops the render loop and frees every geometry, material, texture and the renderer;
   coming back builds the scene again from the lab's state. Anything that fails leaves the 2D figure in place. */
import type { Env } from '../legacy/runtime';
import './s3d.css';

export interface View { update(): void; dispose(): void }
export type Maker<A> = (box: HTMLElement, api: A) => View;
export type Why = '' | 'nogl' | 'motion';
/** counters the tests read: views made / freed / alive, scene chunks requested */
export interface Stats { made: number; freed: number; live: number; loads: number; frames?: number }
export function stats(w: Window = window): Stats {
  const o = w as unknown as { __si3d?: Stats };
  return (o.__si3d ??= { made: 0, freed: 0, live: 0, loads: 0 });
}

let glMemo: boolean | null = null;
/** can this browser draw WebGL at all (probe once, then release the probe context) */
export function hasGL(doc: Document = document): boolean {
  if (glMemo !== null) return glMemo;
  try {
    const c = doc.createElement('canvas');
    const g = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    glMemo = !!g;
    g?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { glMemo = false; }
  return glMemo;
}
export const resetGLProbe = () => { glMemo = null; };
/** why the 2D figure stays: reduced motion asked for, or no WebGL; '' = 3D is fine */
export function why3d(w: Window = window): Why {
  try { if (w.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'motion'; } catch { /* old browsers */ }
  return hasGL(w.document) ? '' : 'nogl';
}

export interface Handle { refresh(): void; on(): boolean }
/** only one 3D scene runs at a time: starting one frees the one before (it shows its 2D figure until it is seen again) */
let current: { yield(): void } | null = null;
/** an animation switch (spin) turns itself off after a while, so a forgotten switch does not keep the phone busy */
export function autoOff(input: HTMLInputElement, ms: number, then: () => void, set: (f: () => void, ms: number) => number = (f, ms) => window.setTimeout(f, ms), clear: (id: number) => void = (id) => window.clearTimeout(id)) {
  let id = 0;
  const arm = () => { clear(id); id = 0; if (input.checked) id = set(() => { id = 0; if (input.checked) { input.checked = false; then(); } }, ms); };
  input.addEventListener('change', arm); arm();
  return () => clear(id);
}
/** R30b: on the first screen of a stop, size the stage so its card (stage, sentence, control, fold title) ends just above
    the bottom bar, whatever the height of the page head above it. The CSS height uses --s3k (the room kept for
    everything else) and stays between 240 px and 58% of the screen; a card that is not near the top keeps the default. */
export function fitStage(env: Env, box: HTMLElement): void {
  const card = box.closest<HTMLElement>('.s3c'), w = env.window;
  if (!card || !w) return;
  const fit = () => {
    const vh = w.innerHeight, r = card.getBoundingClientRect(); if (!vh || !r.height) return;
    const top = r.top + (w.scrollY || 0); if (top > vh * 0.5) return;
    const bar = env.document.getElementById('bnav'), bt = bar && bar.getClientRects().length ? bar.getBoundingClientRect().top : vh;
    /* the fold's title is the last thing that must show; padding below it may slip under the bar */
    const sum = card.querySelector('.s3c-why summary'), end = sum ? sum.getBoundingClientRect().bottom : r.bottom;
    const rest = end - r.top - box.getBoundingClientRect().height;
    card.style.setProperty('--s3k', `${Math.ceil(top + rest + Math.max(0, vh - bt) + 2)}px`);
  };
  fit(); env.requestAnimationFrame(fit); env.setTimeout(fit, 400); env.setTimeout(fit, 1500);
  /* the sentence under the stage is written by the lab and may wrap once fonts arrive: refit when the card or anything above it changes size
     (a refit that only changes the stage gives the same value again, so this settles at once) */
  const RO = (w as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
  if (RO) { const ro = new RO(() => fit()); ro.observe(card); for (let e = card.previousElementSibling; e; e = e.previousElementSibling) ro.observe(e); env.onDispose(() => ro.disconnect()); }
  void env.document.fonts?.ready.then(fit);
  /* phones resize the window when the address bar slides away while scrolling: refit only when the width changes */
  let lw = w.innerWidth; const onResize = () => { if (w.innerWidth !== lw) { lw = w.innerWidth; fit(); } };
  w.addEventListener('resize', onResize);
  env.onDispose(() => w.removeEventListener('resize', onResize));
}
/** wire one scene box. box carries data-s3d = idle | loading | on | off | fallback (and data-why when it falls back) */
export function mount3d<A>(env: Env, box: HTMLElement, load: () => Promise<{ make: Maker<A> }>, api: A): Handle {
  const S = stats();
  let view: View | null = null, inView = false, busy = false, dead = false, failed = false;
  const set = (s: string) => { box.dataset.s3d = s; };
  fitStage(env, box);
  const why = why3d();
  if (why) { box.dataset.why = why; set('fallback'); return { refresh: () => {}, on: () => false }; }
  set('idle');
  const me = { yield: () => { if (view) { free(); set('off'); } } };
  const free = () => {
    if (!view) return;
    try { view.dispose(); } catch (e) { console.error('[3d dispose]', e); }
    view = null; S.freed++; S.live--; box.classList.remove('s3d-on');
    if (current === me) current = null;
  };
  const want = () => !dead && !failed && inView && env.document.visibilityState !== 'hidden';
  const sync = () => {
    if (!want()) { if (view) { free(); set('off'); } return; }
    if (view || busy) return;
    busy = true; set('loading'); S.loads++;
    load().then((m) => {
      busy = false;
      if (!want() || view) { sync(); return; }
      if (current && current !== me) current.yield();
      view = m.make(box, api); S.made++; S.live++; current = me;
      box.classList.add('s3d-on'); set('on');
    }).catch((e) => {
      busy = false; failed = true; console.error('[3d load]', e);
      box.dataset.why = 'error'; set('fallback'); box.classList.remove('s3d-on');
    });
  };
  const IO = env.IntersectionObserver;
  if (IO) new IO((es) => { for (const e of es) inView = e.isIntersecting; sync(); }, { threshold: 0.1 }).observe(box);
  else { inView = true; sync(); }
  env.document.addEventListener('visibilitychange', sync);
  env.onDispose(() => { dead = true; free(); });
  return { refresh: () => view?.update(), on: () => !!view };
}
