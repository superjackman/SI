/* R38: the model's message handler. Runs inside the Web Worker (worker.ts); falls back to the main thread when the
   browser has no module workers. Two models: "demo" (the 3 colour questions, trained on first open, deterministic)
   and "my" (the user's own lines, trained step by step with progress, pause and resume). */
import { CFG, Model, buildDict, examples, forward, step, lrAt, answer, pack, unpack, enc, SEP, type Dict, type Ex, type Trace, type Norms } from './model';

export const DEMO = ['天空是什么颜色？→蓝', '草是什么颜色？→绿', '火是什么颜色？→红'];
export const DEMO_STEPS = 200;
export interface Slot { D: Dict; M: Model; ex: Ex[]; lines: string[]; losses: number[]; done: number; total: number }
export type Req =
  | { op: 'demo' }
  | { op: 'trace'; which: 'demo' | 'my'; text: string }
  | { op: 'answer'; which: 'demo' | 'my'; q: string }
  | { op: 'my'; lines: string[]; steps: number; w?: Float32Array; losses?: number[] }
  | { op: 'pause' } | { op: 'resume' };
export interface Demo { chars: string[]; before: Trace; nb0: Norms; gn0: number; losses: number[]; after: Trace; n: number; lr: number; steps: number }
export interface Prog { kind: 'prog'; step: number; total: number; loss: number; nb: Norms; losses: number[]; chars: string[]; w?: Float32Array; done: boolean }

const slots: Partial<Record<'demo' | 'my', Slot>> = {};
let demo: Demo | null = null, timer: ReturnType<typeof setTimeout> | null = null, paused = false;

function newSlot(lines: string[], total: number): Slot {
  const D = buildDict(lines); const ex = examples(D, lines);
  return { D, M: new Model(CFG, D.chars.length), ex, lines, losses: [], done: 0, total };
}
export function makeDemo(): Demo {
  if (demo) return demo;
  const s = newSlot(DEMO, DEMO_STEPS), e = s.ex[0]!;
  const before = forward(s.M, e.ids, e.tgt, e.mask);
  let nb0: Norms | null = null, gn0 = 0;
  for (let i = 0; i < DEMO_STEPS; i++) { const r = step(s.M, s.ex, lrAt(i)); s.losses.push(r.loss); if (!i) { nb0 = r.nb; gn0 = r.gn; } }
  s.done = DEMO_STEPS; slots.demo = s;
  demo = { chars: s.D.chars, before, nb0: nb0!, gn0, losses: s.losses, after: forward(s.M, e.ids, e.tgt, e.mask), n: s.M.n, lr: lrAt(DEMO_STEPS), steps: DEMO_STEPS };
  return demo;
}
const slot = (w: 'demo' | 'my') => { if (w === 'demo') makeDemo(); return slots[w] ?? (makeDemo(), slots.demo!); };

export function handle(q: Req, post: (m: unknown) => void): unknown {
  switch (q.op) {
    case 'demo': return makeDemo();
    case 'trace': { const s = slot(q.which); const ids = enc(s.D, q.text).slice(0, CFG.ctx); return { chars: s.D.chars, tr: forward(s.M, ids.length ? ids : [0]) }; }
    case 'answer': { const s = slot(q.which); return { chars: s.D.chars, ...answer(s.M, s.D, q.q) }; }
    case 'pause': paused = true; return { paused };
    case 'resume': if (paused) { paused = false; run(post); } return { paused };
    case 'my': {
      if (timer) clearTimeout(timer); timer = null; paused = false;
      const s = newSlot(q.lines, q.steps); slots.my = s;
      if (!s.ex.length) return { error: 'empty' };
      if (q.w && q.w.length === s.M.n) { unpack(s.M, q.w); s.done = s.total; s.losses = q.losses ?? []; return { chars: s.D.chars, loaded: true, losses: s.losses }; }
      run(post); return { chars: s.D.chars, started: true, n: s.M.n, examples: s.ex.length };
    }
  }
  return null;
}
function run(post: (m: unknown) => void) {
  const s = slots.my; if (!s) return;
  const tick = () => {
    timer = null; if (paused) return;
    const t0 = Date.now(); let r: ReturnType<typeof step> | null = null;
    while (s.done < s.total && Date.now() - t0 < 40) { r = step(s.M, s.ex, lrAt(s.done)); s.losses.push(r.loss); s.done++; }
    const done = s.done >= s.total;
    if (r) post({ kind: 'prog', step: s.done, total: s.total, loss: r.loss, nb: r.nb, losses: s.losses.slice(), chars: s.D.chars, done, ...(done ? { w: pack(s.M) } : {}) } satisfies Prog);
    if (!done) timer = setTimeout(tick, 30);
  };
  timer = setTimeout(tick, 0);
}
export { SEP };
