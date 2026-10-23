/* Adapter that runs the live page's lab code (lifted into gen/islands/<S>.js by scripts/legacy/islands.mjs)
   inside the React app. Each station mount gets its own sandbox: listeners on window/document, timers,
   intervals and animation frames are tracked and removed on dispose (station change, language switch).
   Labs start lazily like on the live page: when they come near the viewport (rootMargin 50%) or on the
   first interaction inside their card. */
import type { Lang } from '../i18n/types';
import { KB } from './kb';

type Bi = { zh: string; en: string };
export interface IslandModule {
  LABS: { ids: string[]; hooks: string[] }[];
  mount: (env: Env) => { labs: Array<() => void>; eager: () => void };
}
export interface Shell {
  go: (s: string) => void;
  openInfo: (id: string) => void;
  openAnywhere: (id: string) => void;
  jumpTo: (id: string, lv?: string) => void;
  closeInfo: () => void;
  toast: (m: string) => void;
}
export interface Env extends Shell {
  window: Window; document: Document; lang: Lang; C: Record<string, unknown>;
  setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout; setInterval: typeof setInterval; clearInterval: typeof clearInterval;
  requestAnimationFrame: typeof requestAnimationFrame; cancelAnimationFrame: typeof cancelAnimationFrame;
  IntersectionObserver: typeof IntersectionObserver | undefined;
  updProg: () => void; noop: () => void;
  rt: Record<string, unknown>;
}
/* one island per station: the live page's lifted labs (gen/islands/<S>.js) and the hand-written M2 labs (m2/labs/<S>.ts) */
/* extension labs on a legacy station (m2/labs/<S>.x.ts) are merged with that station's island: their LABS come after the island's */
const loaders: Record<string, () => Promise<IslandModule>> = {};
const parts: Record<string, Array<[string, () => Promise<IslandModule>]>> = {};
for (const [k, f] of Object.entries({ ...import.meta.glob<IslandModule>('./gen/islands/*.js'), ...import.meta.glob<IslandModule>('../m2/labs/*.ts') })) {
  const n = k.replace(/^.*\/|\.(js|ts)$/g, '');
  (parts[n.split('.')[0] as string] ??= []).push([n, f]);
}
const merge = (ms: IslandModule[]): IslandModule => ({
  LABS: ms.flatMap((m) => m.LABS),
  mount(env) {
    const r = ms.map((m) => m.mount(env));
    return { labs: r.flatMap((x) => x.labs), eager: () => r.forEach((x) => x.eager()) };
  },
});
for (const [S, fs] of Object.entries(parts)) {
  fs.sort((a, b) => a[0].length - b[0].length);
  loaders[S] = fs.length === 1 ? (fs[0] as [string, () => Promise<IslandModule>])[1] : () => Promise.all(fs.map(([, f]) => f())).then(merge);
}
/* the labs' translation keys: one shared chunk for all stations (R4; was a copy inside every station chunk) */
const labI18n = () => import('./gen/lab-i18n.json').then((m) => m.default as Record<string, Bi>);
export const hasIsland = (s: string) => Object.prototype.hasOwnProperty.call(loaders, s);

/* live runtime.js helpers, per language (same code) */
const ALT: Record<string, string> = {};
const EN_STOP = ['the', 'a', 'an', 'is', 'are', 'was', 'of', 'to', 'in', 'on', 'at', 'and', 'or', 'for', 'with', 'what', 'how', 'many', 'much', 'does', 'do', 'can', 'i', 'you', 'it', 'my', 'me', 'by', 'be', 'per', 'each', 'your', 'there', 'have', 'has', 'get', 'up', 'any'];
function makeRt(lang: Lang, I18N: Record<string, Bi>) {
  const en = lang === 'en';
  const _t = (k: string) => { const e = I18N[k]; if (!e) { console.warn('[i18n] missing', k); return k; } ALT[e.zh] = e.en; ALT[e.en] = e.zh; return en ? e.en : e.zh; };
  const _t2 = (zh: string, enS: string) => { ALT[zh] = enS; ALT[enS] = zh; return en ? enS : zh; };
  const __enStem = (w: string) => { w = String(w).toLowerCase(); return w.length > 3 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w; };
  return {
    _t, _t2, __alt: (s: string) => ALT[s] || '',
    __join: (a: string[]) => (en ? a.join(' ').replace(/\s+([,.!?;:])/g, '$1').replace(/\s{2,}/g, ' ').trim() : a.join('')),
    __EN_STOP: EN_STOP, __enStem,
    __enWords: (s: string) => (String(s).match(/[A-Za-z]+|\d+/g) || []).map(__enStem),
  };
}
/** the live C, as the labs see it (names in the current language) */
function liveC(lang: Lang) {
  const out: Record<string, unknown> = {};
  for (const [k, c] of Object.entries(KB.C)) out[k] = { ...c, n: c.n[lang] };
  return out;
}

type Hook = { render?: () => void; train?: (n: number) => void };
const N_LABS = ['__labNeuron', '__labAct', '__labGraph', '__labOpt', '__labTiny', '__labVec'];
const REDRAW: Record<string, (w: Record<string, Hook | undefined>) => void> = {
  N: (w) => N_LABS.forEach((k) => { try { w[k]?.render?.(); } catch (e) { console.error(e); } }),
  T4: (w) => w.__labBlock?.render?.(),
  T5: (w) => w.__labQuant?.render?.(),
  T7: (w) => w.__labFit?.train?.(0),
};

export interface Islands { dispose(): void; started(): number[]; start(idx: number[]): void; runAll(): void }

export async function mountIslands(S: string, root: HTMLElement, lang: Lang, shell: Shell): Promise<Islands | null> {
  if (!hasIsland(S)) return null;
  const load = loaders[S] as () => Promise<IslandModule>;
  const [mod, I18N] = await Promise.all([load(), labI18n()]);
  const off: Array<() => void> = [];
  const timers = new Set<number>(), ivs = new Set<number>(), rafs = new Set<number>();
  const observers: IntersectionObserver[] = [];
  /* labs that watch their own visibility (N) get observers that are disconnected on dispose */
  const TrackedIO = typeof IntersectionObserver === 'undefined' ? undefined : class extends IntersectionObserver {
    constructor(cb: IntersectionObserverCallback, o?: IntersectionObserverInit) { super((e, ob) => { if (!dead) cb(e, ob); }, o); observers.push(this); }
  };
  let dead = false;
  const track = (target: EventTarget) => (t: string, f: EventListenerOrEventListenerObject, o?: boolean | AddEventListenerOptions) => {
    target.addEventListener(t, f, o); off.push(() => target.removeEventListener(t, f, o));
  };
  const bind = <T extends object>(obj: T, over: Record<string | symbol, unknown>) => new Proxy(obj, {
    get(t, p) {
      if (p in over) return over[p as string];
      const v = Reflect.get(t, p, t) as unknown;
      return typeof v === 'function' && !/^[A-Z]/.test(String(p)) ? (v as (...a: unknown[]) => unknown).bind(t) : v;
    },
    set(t, p, v) { return Reflect.set(t, p, v, t); },
    has(t, p) { return p in over || p in t; },
  });
  const env: Env = {
    ...shell,
    lang,
    C: liveC(lang),
    window: null as unknown as Window,
    document: bind(document, { addEventListener: track(document), removeEventListener: document.removeEventListener.bind(document) }),
    setTimeout: ((f: () => void, ms?: number, ...a: unknown[]) => { const id = window.setTimeout(() => { timers.delete(id); if (!dead) (f as (...x: unknown[]) => void)(...a); }, ms); timers.add(id); return id; }) as unknown as typeof setTimeout,
    clearTimeout: ((id: number) => { timers.delete(id); window.clearTimeout(id); }) as typeof clearTimeout,
    setInterval: ((f: () => void, ms?: number) => { const id = window.setInterval(() => { if (!dead) f(); }, ms); ivs.add(id); return id; }) as unknown as typeof setInterval,
    clearInterval: ((id: number) => { ivs.delete(id); window.clearInterval(id); }) as typeof clearInterval,
    requestAnimationFrame: (f) => { const id = window.requestAnimationFrame((ts) => { rafs.delete(id); if (!dead) f(ts); }); rafs.add(id); return id; },
    cancelAnimationFrame: (id) => { rafs.delete(id); window.cancelAnimationFrame(id); },
    IntersectionObserver: TrackedIO,
    updProg: () => {}, noop: () => {},
    rt: makeRt(lang, I18N),
  };
  env.window = bind(window, {
    addEventListener: track(window), removeEventListener: window.removeEventListener.bind(window),
    setTimeout: env.setTimeout, clearTimeout: env.clearTimeout, setInterval: env.setInterval, clearInterval: env.clearInterval,
    requestAnimationFrame: env.requestAnimationFrame, cancelAnimationFrame: env.cancelAnimationFrame,
    IntersectionObserver: TrackedIO,
  }) as Window;

  const { labs, eager } = mod.mount(env);
  const done = new Set<number>();
  const els = (i: number) => (mod.LABS[i]?.ids ?? []).map((id) => root.querySelector<HTMLElement>('#' + CSS.escape(id))).filter((e): e is HTMLElement => !!e);
  const hooks: string[] = [];
  const run = (i: number) => {
    if (dead || done.has(i)) return;
    done.add(i);
    els(i).forEach((e) => io?.unobserve(e));
    try { labs[i]?.(); } catch (e) { console.error(`[lab ${S}#${i}]`, e); }
  };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    for (const en of es) if (en.isIntersecting) mod.LABS.forEach((b, i) => { if (b.ids.includes((en.target as HTMLElement).id)) run(i); });
  }, { rootMargin: '50% 0px 50% 0px' }) : null;
  const hit = (i: number, t: Node) => els(i).some((e) => (e.closest('.card') || e).contains(t));
  const onAct = (e: Event) => { const t = e.target as Node | null; if (!t || t.nodeType !== 1) return; mod.LABS.forEach((_, i) => { if (!done.has(i) && hit(i, t)) run(i); }); };
  const ACT = ['pointerdown', 'touchstart', 'mousedown', 'click', 'focusin', 'input', 'change', 'keydown'];
  ACT.forEach((n) => document.addEventListener(n, onAct, true));
  off.push(() => ACT.forEach((n) => document.removeEventListener(n, onAct, true)));

  mod.LABS.forEach((b, i) => {
    if (!els(i).length) { run(i); return; }
    /* window hooks other code calls (e.g. __labTok): calling one starts its lab first */
    b.hooks.forEach((h) => {
      try {
        Object.defineProperty(window, h, {
          configurable: true, enumerable: true,
          get() { run(i); const d = Object.getOwnPropertyDescriptor(window, h); if (d?.get) { delete (window as unknown as Record<string, unknown>)[h]; return undefined; } return (window as unknown as Record<string, unknown>)[h]; },
          set(v) { Object.defineProperty(window, h, { value: v, writable: true, configurable: true, enumerable: true }); },
        });
        hooks.push(h);
      } catch { /* ignore */ }
    });
    if (!io) run(i); else els(i).forEach((e) => io.observe(e));
  });
  /* live builds the diagram viewers after its start-up script, so fills that start-up code paints on diagram shapes
     (T4b's FFN circles) are not visible on live until the first interaction; keep the snapshot's paint for eager code */
  const paint = [...root.querySelectorAll<SVGElement>('.diagram svg [id]')].map((e) => [e, e.getAttribute('fill'), e.getAttribute('stroke')] as const);
  try { eager(); } catch (e) { console.error(`[eager ${S}]`, e); }
  for (const [e, f, k] of paint) { if (f === null) e.removeAttribute('fill'); else e.setAttribute('fill', f); if (k === null) e.removeAttribute('stroke'); else e.setAttribute('stroke', k); }
  /* live go() wrapper: REDRAW[L] runs on the next tick, reading the labs' window hooks (which starts those labs) */
  const redraw = REDRAW[S];
  if (redraw) env.setTimeout(() => { try { redraw(window as unknown as Record<string, Hook | undefined>); } catch (e) { console.error(`[redraw ${S}]`, e); } }, 0);

  return {
    started: () => [...done],
    start: (idx) => idx.forEach(run),
    runAll: () => mod.LABS.forEach((_, i) => run(i)),
    dispose() {
      dead = true;
      io?.disconnect();
      observers.splice(0).forEach((o) => o.disconnect());
      off.splice(0).forEach((f) => f());
      timers.forEach((i) => window.clearTimeout(i)); ivs.forEach((i) => window.clearInterval(i)); rafs.forEach((i) => window.cancelAnimationFrame(i));
      for (const h of hooks) delete (window as unknown as Record<string, unknown>)[h];
    },
  };
}
