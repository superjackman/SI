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

/* ---- Up (M3 products): the list filter ---- */
export interface ProdFilter { g: string; cn: boolean; os: boolean }
export interface ProdItem { g: readonly string[]; cn: boolean; os?: boolean }
export const prodVisible = (p: ProdItem, f: ProdFilter) => (f.g === 'all' || p.g.includes(f.g)) && (!f.cn || p.cn) && (!f.os || !!p.os);
/** unique products shown under a filter (a product listed under several ways counts once) */
export const prodCount = (ps: readonly (ProdItem & { n: string })[], f: ProdFilter) => new Set(ps.filter((p) => prodVisible(p, f)).map((p) => p.n)).size;

/* ---------- labClick: screenshot → action, with an instruction hidden in the page ---------- */
/** a target on the mock page (percent coordinates of the click point) */
export const CLICK_AT = { mail: [50, 30], pdf: [30, 62], save: [78, 88], fwd: [52, 88], to: [50, 18], send: [84, 18] } as const;
export type ClickKey = keyof typeof CLICK_AT;
export interface ClickStep { key: string; at?: ClickKey; kind: 'act' | 'read' | 'ask' | 'ok' | 'bad' }
/** inject: the email holds hidden text telling the agent to forward the mail; guard: page text is data, and sending needs your OK */
export function clickSteps(inject: boolean, guard: boolean): ClickStep[] {
  const s: ClickStep[] = [{ key: 'shot', kind: 'read' }, { key: 'openMail', at: 'mail', kind: 'act' }, { key: 'shot2', kind: 'read' }];
  if (inject && !guard) return [...s, { key: 'obey', kind: 'read' }, { key: 'fwd', at: 'fwd', kind: 'act' }, { key: 'typeTo', at: 'to', kind: 'act' }, { key: 'send', at: 'send', kind: 'act' }, { key: 'leaked', kind: 'bad' }];
  if (inject) s.push({ key: 'ignore', kind: 'read' });
  return [...s, { key: 'pdf', at: 'pdf', kind: 'act' }, { key: 'save', at: 'save', kind: 'act' }, { key: inject ? 'doneFlag' : 'done', kind: 'ok' }];
}

/* ---------- labFan: one agent or a team (illustrative minutes and tokens) ---------- */
export const FAN = { parts: 4, min: 4, tok: 20000, brief: 5000, merge: 1, handoff: 1, ctx: 10000 } as const;
export interface FanPlan { lanes: number[][]; minutes: number; tokens: number; conflicts: number }
/** split FAN.parts research parts over n agents; dep: each part needs the previous one's result, so they run one after another */
export function fanPlan(n: number, dep: boolean): FanPlan {
  const lanes: number[][] = Array.from({ length: n }, () => []);
  for (let p = 0; p < FAN.parts; p++) (lanes[p % n] as number[]).push(p);
  const team = n > 1;
  const work = dep ? FAN.parts * FAN.min : Math.ceil(FAN.parts / n) * FAN.min;
  const handoffs = dep && team ? FAN.parts - 1 : 0;
  const minutes = work + handoffs * FAN.handoff + (team ? FAN.merge : 0);
  const tokens = FAN.parts * FAN.tok + (team ? n * FAN.brief : 0) + (dep && team ? handoffs * FAN.ctx : 0);
  return { lanes, minutes, tokens, conflicts: dep && team ? n - 1 : 0 };
}

/* ---------- labCron: a routine's week ---------- */
export type CronTrig = 'daily' | 'mail' | 'issue';
export type CronAct = 'digest' | 'reply' | 'close';
export interface CronRun { day: number; ev: string; status: 'done' | 'wait' | 'bad' }
/** day 0 = Monday. Events are fixed; each trigger has one trap: Wednesday's daily batch holds a phishing email or a look-alike issue, one email is phishing, one issue is not really a duplicate. */
export const CRON_TRAPS = new Set(['dTrap', 'mPhish', 'iNotDup']);
export const CRON_EVENTS: Record<CronTrig, [number, string][]> = {
  daily: [[0, 'd'], [1, 'd'], [2, 'dTrap'], [3, 'd'], [4, 'd']],
  mail: [[0, 'm1'], [1, 'm2'], [2, 'mPhish'], [2, 'm3'], [4, 'm4'], [5, 'm5']],
  issue: [[0, 'i1'], [1, 'i2'], [3, 'iNotDup'], [4, 'i3']],
};
/** digest only tells you, so it always runs; reply / close reach other people: "draft" waits for you, "auto" acts, and acting on a trap event is a mistake */
export const cronIrreversible = (a: CronAct) => a !== 'digest';
export function cronWeek(trig: CronTrig, act: CronAct, mode: 'auto' | 'draft'): { runs: CronRun[]; done: number; wait: number; bad: number } {
  const runs = CRON_EVENTS[trig].map(([day, ev]): CronRun => {
    if (!cronIrreversible(act)) return { day, ev, status: 'done' };
    if (mode === 'draft') return { day, ev, status: 'wait' };
    return { day, ev, status: CRON_TRAPS.has(ev) ? 'bad' : 'done' };
  });
  const c = (s: CronRun['status']) => runs.filter((r) => r.status === s).length;
  return { runs, done: c('done'), wait: c('wait'), bad: c('bad') };
}
