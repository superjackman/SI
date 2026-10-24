/* R20 progress: which stops are lit, and whether the certificate is earned. Uses what the site already stores:
   the stops opened (aiexp.v2.visited, nav.ts markVisited) and the quiz answers (aiexp.v2.quiz, station/quiz.ts).
   Rule (stated on the card sheet): a stop is lit when it was opened and its quiz is finished (every question answered;
   a stop without a quiz lights up when opened). The certificate needs all stops lit and at least 60 % of all quiz
   answers right — answering is not enough on its own, and "Redo this quiz" lets anyone improve. */
import { TABORDER } from '../legacy/kb';
import { visited } from '../nav';
import { answers, QUIZ_KEY } from '../station/quiz';

export const PASS = 0.6;
export interface StopState { S: string; opened: boolean; done: boolean; lit: boolean; c: number; n: number }
export interface Prog { stops: StopState[]; lit: number; total: number; correct: number; questions: number; cert: boolean }
export function progress(vis: string[] = visited(), ans: Record<string, number> = answers()): Prog {
  let correct = 0, questions = 0;
  const stops = TABORDER.map((S) => {
    const key = QUIZ_KEY[S] ?? [], opened = vis.includes(S); let c = 0, d = 0;
    key.forEach((r, j) => { const a = ans[S + '.' + j]; if (a != null) { d++; if (a === r) c++; } });
    correct += c; questions += key.length;
    const done = d === key.length;
    return { S, opened, done, lit: opened && done, c, n: key.length };
  });
  const lit = stops.filter((s) => s.lit).length;
  return { stops, lit, total: TABORDER.length, correct, questions, cert: lit === TABORDER.length && correct >= Math.ceil(PASS * questions) };
}
/** this stop's quiz: [correct, answered, questions] */
export function stopQuiz(S: string, ans: Record<string, number> = answers()): [number, number, number] {
  const key = QUIZ_KEY[S] ?? []; let c = 0, d = 0;
  key.forEach((r, j) => { const a = ans[S + '.' + j]; if (a != null) { d++; if (a === r) c++; } });
  return [c, d, key.length];
}
const LS = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const LSset = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
/** the day the certificate was first earned (kept, so the date does not change on every visit) */
export function doneDate(p: Prog, now = new Date()): string | null {
  if (!p.cert) { try { localStorage.removeItem('si.done'); } catch { /* private mode */ } return null; }
  const s = LS('si.done');
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  LSset('si.done', d); return d;
}
export const fmtDate = (d: string, L: 'zh' | 'en') => {
  const [y, m, dd] = d.split('-').map(Number) as [number, number, number];
  return L === 'en' ? `${dd} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${y}` : `${y} 年 ${m} 月 ${dd} 日`;
};
export { LS, LSset };
