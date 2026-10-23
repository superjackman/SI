/* r10 M2 labs: labClick (Ua), labFan and labCron (Ub) — pure logic */
import { describe, expect, it } from 'vitest';
import { CLICK_AT, clickSteps, cronWeek, CRON_EVENTS, cronIrreversible, FAN, fanPlan, type CronAct, type CronTrig } from '../../src/m2/logic';

describe('labClick', () => {
  const keys = (i: boolean, g: boolean) => clickSteps(i, g).map((s) => s.key);
  it('normal run saves the invoice and never forwards', () => {
    expect(keys(false, false)).toEqual(['shot', 'openMail', 'shot2', 'pdf', 'save', 'done']);
    expect(keys(false, true)).toEqual(keys(false, false));
  });
  it('a hidden instruction without defences leaks the invoice', () => {
    const s = clickSteps(true, false);
    expect(s.map((x) => x.key)).toContain('send');
    expect(s.at(-1)).toEqual({ key: 'leaked', kind: 'bad' });
    expect(s.map((x) => x.key)).not.toContain('save');
  });
  it('with defences the page text is ignored, the task completes, and the user is warned', () => {
    const k = keys(true, true);
    expect(k).toContain('ignore');
    expect(k).not.toContain('send');
    expect(k.at(-1)).toBe('doneFlag');
  });
  it('every click step has an on-screen coordinate inside the page', () => {
    for (const [i, g] of [[0, 0], [1, 0], [1, 1]]) for (const s of clickSteps(!!i, !!g)) {
      expect(s.kind === 'act').toBe(!!s.at);
      if (s.at) for (const v of CLICK_AT[s.at]) { expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(100); }
    }
  });
});

describe('labFan', () => {
  it('independent parts: more agents → less time, more tokens, no conflicts', () => {
    const [a, b, c] = [1, 2, 4].map((n) => fanPlan(n, false));
    expect([a!.minutes, b!.minutes, c!.minutes]).toEqual([16, 9, 5]);
    expect(a!.tokens).toBe(FAN.parts * FAN.tok);
    expect(b!.tokens).toBeGreaterThan(a!.tokens); expect(c!.tokens).toBeGreaterThan(b!.tokens);
    expect([a!.conflicts, b!.conflicts, c!.conflicts]).toEqual([0, 0, 0]);
  });
  it('dependent parts: the parallel gain disappears and the team is slower', () => {
    const one = fanPlan(1, true), four = fanPlan(4, true);
    expect(one.minutes).toBe(16);
    expect(four.minutes).toBeGreaterThan(one.minutes);
    expect(four.minutes).toBe(20);
    expect(four.conflicts).toBe(3);
    expect(four.tokens).toBeGreaterThan(fanPlan(4, false).tokens);
  });
  it('every part lands in exactly one lane', () => {
    for (const n of [1, 2, 4]) { const p = fanPlan(n, false); expect(p.lanes).toHaveLength(n); expect(p.lanes.flat().sort()).toEqual([0, 1, 2, 3]); }
  });
});

describe('labCron', () => {
  const T: CronTrig[] = ['daily', 'mail', 'issue'], A: CronAct[] = ['digest', 'reply', 'close'];
  it('each trigger has exactly one trap and events within the week', () => {
    for (const tr of T) {
      expect(CRON_EVENTS[tr].filter(([, e]) => /Trap|Phish|NotDup/.test(e))).toHaveLength(1);
      for (const [d] of CRON_EVENTS[tr]) { expect(d).toBeGreaterThanOrEqual(0); expect(d).toBeLessThan(7); }
    }
  });
  it('a digest only informs you: it always runs, nothing waits, nothing goes wrong', () => {
    expect(cronIrreversible('digest')).toBe(false);
    for (const tr of T) for (const m of ['auto', 'draft'] as const) { const w = cronWeek(tr, 'digest', m); expect([w.wait, w.bad]).toEqual([0, 0]); expect(w.done).toBe(w.runs.length); }
  });
  it('irreversible actions: draft-first waits on every run; auto gets the trap wrong', () => {
    for (const tr of T) for (const a of A.filter(cronIrreversible)) {
      const d = cronWeek(tr, a, 'draft'), x = cronWeek(tr, a, 'auto');
      expect(d.wait).toBe(d.runs.length); expect(d.bad).toBe(0);
      expect(x.bad).toBe(1); expect(x.done).toBe(x.runs.length - 1); expect(x.wait).toBe(0);
    }
  });
});
