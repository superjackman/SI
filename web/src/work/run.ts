/* Fixed samples for the three starter projects. Nothing here calls a model or the network. */
export interface Note { id: string; zh: string; en: string }
export const NOTES: readonly Note[] = [
  { id: 'A', zh: '班车 7:40 从东门发车。', en: 'The shuttle leaves the east gate at 7:40.' },
  { id: 'B', zh: '会议室在 3 楼，钥匙在前台。', en: 'The meeting room is on floor 3. The key is at the front desk.' },
  { id: 'C', zh: '周五不开放打印机。', en: 'The printer is closed on Friday.' },
];
export interface KbQ { id: string; zh: string; en: string; note: string | null; zhA: string; enA: string }
export const KB_Q: readonly KbQ[] = [
  { id: 'bus', zh: '班车几点从东门发车？', en: 'What time does the shuttle leave the east gate?', note: 'A', zhA: '7:40。', enA: '7:40.' },
  { id: 'room', zh: '会议室在几楼？', en: 'Which floor is the meeting room on?', note: 'B', zhA: '3 楼。', enA: 'Floor 3.' },
  { id: 'food', zh: '食堂今天有什么菜？', en: 'What is on the cafeteria menu today?', note: null, zhA: '这三张纸条里没有这一句。', enA: 'None of the three notes says this.' },
];
export function kbAnswer(id: string) {
  const q = KB_Q.find((x) => x.id === id) ?? null;
  const note = q?.note ? NOTES.find((n) => n.id === q.note) ?? null : null;
  return { q, note };
}

export type AskChoice = 'ask' | 'skip' | 'yes' | 'no';
export interface AskState { asked: boolean; sent: boolean; failed: boolean }
/** `ask` stops and waits. `yes` sends only after a question. `skip` sends with no question. */
export function askStep(s: AskState, c: AskChoice): AskState {
  if (c === 'ask') return { asked: true, sent: false, failed: false };
  if (c === 'yes') return s.asked ? { asked: true, sent: true, failed: false } : s;
  if (c === 'no') return { asked: true, sent: false, failed: false };
  return { asked: false, sent: true, failed: true };
}
export const ASK0: AskState = { asked: false, sent: false, failed: false };

export type FareRule = 'bug' | 'ok' | 'wrong';
/** 起步 1 公里 3 元，之后每公里 2 元。 `bug` charges 2 for every km. `wrong` charges 3 for every km. */
export function fare(km: number, rule: FareRule): number {
  if (rule === 'bug') return km * 2;
  if (rule === 'wrong') return km * 3;
  return km <= 1 ? 3 : 3 + (km - 1) * 2;
}
export const FARE_CASES = [{ km: 1, want: 3 }, { km: 3, want: 7 }] as const;
export function fareTests(rule: FareRule) {
  return FARE_CASES.map((c) => { const got = fare(c.km, rule); return { km: c.km, want: c.want, got, ok: got === c.want }; });
}
