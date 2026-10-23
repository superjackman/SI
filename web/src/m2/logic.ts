/* Pure logic of the M2 labs (unit-tested in tests/unit/m2-labs.test.ts). All numbers are illustrative teaching values. */

/* ---------- labPick: task traits -> recommended way of using an agent ---------- */
export const PICK_TRAITS = ['q', 'code', 'term', 'gui', 'clear', 'sched', 'split', 'risk'] as const;
export type Trait = (typeof PICK_TRAITS)[number];
export type Way = 'uChat' | 'uIde' | 'uCli' | 'uCua' | 'uBg' | 'uRoutine' | 'uMulti';
/** first matching rule wins; "risk" never changes the way, it adds a human-confirmation step */
export function pickWay(f: ReadonlySet<Trait>): { way: Way; confirm: boolean } {
  const has = (k: Trait) => f.has(k);
  let way: Way;
  if (has('sched')) way = 'uRoutine';
  else if (has('split') && (has('code') || has('clear'))) way = 'uMulti';
  else if (has('clear') && (has('code') || has('term'))) way = 'uBg';
  else if (has('gui')) way = 'uCua';
  else if (has('term')) way = 'uCli';
  else if (has('code')) way = 'uIde';
  else way = 'uChat';
  return { way, confirm: has('risk') };
}
export const PICK_PRESETS: Record<string, Trait[]> = {
  ask: ['q'],
  fix: ['code'],
  report: ['q', 'sched'],
  flight: ['gui', 'risk'],
  tests: ['code', 'clear', 'split'],
};

/* ---------- labSession: a scripted coding session under a permission level ---------- */
export type Perm = 'ask' | 'edit' | 'auto';
export type Kind = 'read' | 'edit' | 'cmd' | 'done';
export interface Step { kind: Kind; key: string }
export function sessionSteps(test: boolean): Step[] {
  const s: Step[] = [{ kind: 'read', key: 'readSrc' }, { kind: 'read', key: 'readTest' }, { kind: 'edit', key: 'editSrc' }];
  if (test) s.push({ kind: 'edit', key: 'addTest' }, { kind: 'cmd', key: 'runTest' }, { kind: 'done', key: 'doneOk' });
  else s.push({ kind: 'done', key: 'doneUnverified' });
  return s;
}
/** reading is always allowed; "ask" stops for edits and commands, "edit" only for commands, "auto" never */
export const needsAsk = (p: Perm, k: Kind) => (k === 'edit' && p === 'ask') || (k === 'cmd' && p !== 'auto');

/* ---------- labCtxLoad: how much of the window the extension manuals take ---------- */
export const CTX = { window: 32000, sys: 1000, chat: 2000, full: 400, brief: 30 } as const;
export function ctxLoad(n: number, mode: 'all' | 'lazy', called: boolean) {
  const tools = mode === 'all' ? n * CTX.full : n * CTX.brief;
  const loaded = mode === 'lazy' && called ? CTX.full : 0;
  const used = CTX.sys + tools + loaded + CTX.chat;
  const manual = tools + loaded;
  return { sys: CTX.sys, tools, loaded, chat: CTX.chat, free: CTX.window - used, manual, pct: Math.round((manual / CTX.window) * 1000) / 10, warn: manual / CTX.window > 0.25 };
}

/* ---------- labPrompt: the four things of a brief ---------- */
export const BRIEF = { base: 10, goal: 30, background: 25, constraints: 15, acceptance: 20, perDoc: 12, docTokens: 3000, briefTokens: 60 } as const;
export type Part4 = 'goal' | 'background' | 'constraints' | 'acceptance';
export const PARTS4: Part4[] = ['goal', 'background', 'constraints', 'acceptance'];
export function briefScore(on: ReadonlySet<Part4>, docs: number) {
  let s: number = BRIEF.base;
  for (const k of PARTS4) if (on.has(k)) s += BRIEF[k];
  s -= docs * BRIEF.perDoc;
  return Math.max(0, Math.min(100, s));
}
export const briefTokens = (on: ReadonlySet<Part4>, docs: number) => 20 + on.size * BRIEF.briefTokens + docs * BRIEF.docTokens;
