/* R38: main-thread side of the model. A lazy module Web Worker when available, else the same code in this thread. */
import type { Req, Demo, Prog } from './core';
import type { Trace } from './model';

type Ans = { chars: string[]; q: string; out: string; steps: { top: [number, number][] }[]; unknown: string[] };
let send: ((q: Req) => Promise<unknown>) | null = null;
const listeners = new Set<(p: Prog) => void>();
const emit = (m: unknown) => { const p = m as Prog; if (p && p.kind === 'prog') { if (p.done && p.w) saveMy(p); listeners.forEach((f) => f(p)); } };
function boot() {
  if (send) return send;
  let w: Worker | null = null;
  try { w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }); } catch { w = null; }
  if (w) {
    let n = 0; const wait = new Map<number, (r: unknown) => void>(); const ww = w;
    let ok = true;
    ww.onmessage = (e: MessageEvent<{ id?: number; r?: unknown; ev?: unknown }>) => { if (e.data.ev) emit(e.data.ev); else if (e.data.id != null) { wait.get(e.data.id)?.(e.data.r); wait.delete(e.data.id); } };
    ww.onerror = () => { ok = false; ww.terminate(); local(); wait.forEach((f, id) => { wait.delete(id); void f({ error: 'worker' }); }); };
    send = (q) => ok ? new Promise((res) => { const id = ++n; wait.set(id, res); ww.postMessage({ id, q }); }) : local()(q);
  } else local();
  return send!;
}
let loc: ((q: Req) => Promise<unknown>) | null = null;
function local() { if (!loc) { const m = import('./core'); loc = (q) => m.then((c) => c.handle(q, emit)); send = loc; } return loc; }

export const tf = {
  demo: () => boot()({ op: 'demo' }) as Promise<Demo>,
  trace: (text: string, which: 'demo' | 'my' = 'demo') => boot()({ op: 'trace', which, text }) as Promise<{ chars: string[]; tr: Trace }>,
  answer: (q: string, which: 'demo' | 'my' = 'demo') => boot()({ op: 'answer', which, q }) as Promise<Ans>,
  trainMy: (lines: string[], steps: number) => boot()({ op: 'my', lines, steps }) as Promise<{ chars?: string[]; started?: boolean; error?: string; examples?: number }>,
  loadMy: () => { const m = readMy(); return m ? boot()({ op: 'my', lines: m.lines, steps: m.steps, w: m.w, losses: m.losses }) as Promise<{ loaded?: boolean; chars?: string[] }> : Promise.resolve(null); },
  pause: () => boot()({ op: 'pause' }), resume: () => boot()({ op: 'resume' }),
  on: (f: (p: Prog) => void) => { listeners.add(f); return () => listeners.delete(f); },
};

/* the user's trained model is kept in localStorage (weights as base64 Float32, ~45 KB) */
const KEY = 'si.l4.my';
function b64(a: Float32Array) { const u = new Uint8Array(a.buffer.slice(0)); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); }
function unb64(s: string) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Float32Array(u.buffer); }
let pending: { lines: string[]; steps: number } | null = null;
export function rememberLines(lines: string[], steps: number) { pending = { lines, steps }; try { localStorage.setItem(KEY + '.lines', JSON.stringify(lines)); } catch { /* */ } }
function saveMy(p: Prog) { if (!pending || !p.w) return; try { localStorage.setItem(KEY, JSON.stringify({ ...pending, w: b64(p.w), losses: p.losses.filter((_, i) => i % 2 === 0 || i === p.losses.length - 1) })); } catch { /* full */ } }
export function readMy(): { lines: string[]; steps: number; w: Float32Array; losses: number[] } | null {
  try { const j = JSON.parse(localStorage.getItem(KEY) || 'null') as { lines: string[]; steps: number; w: string; losses: number[] } | null; return j ? { ...j, w: unb64(j.w) } : null; } catch { return null; }
}
export function savedLines(): string[] | null { try { return JSON.parse(localStorage.getItem(KEY + '.lines') || 'null') as string[] | null; } catch { return null; } }
