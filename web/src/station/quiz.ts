/* Per-stop quiz — native port of the live renderQuiz + its delegated click handler (same markup, strings, option
   order and storage: localStorage aiexp.v2.quiz {"T3.1": 2}). The questions are one shared lazy chunk per language
   (gen/quiz.<lang>.json); the answer key (gen/qkey.json, tiny) feeds the progress text without loading them. */
import type { Lang } from '../i18n/types';
import { tabn } from '../legacy/kb';
import { toast } from '../nav';
import QKEY from '../legacy/gen/qkey.json';
import { CODES } from '../i18n/codes';

export type Q = [string, string[], number, string];
export type QZ = Record<string, Q[]>;
const data = import.meta.glob<QZ>('../legacy/gen/quiz.*.json', { import: 'default' });
export const loadQuiz = (lang: Lang): Promise<QZ> => data[`../legacy/gen/quiz.${lang}.json`]?.() ?? Promise.resolve({});
export const QUIZ_KEY: Record<string, number[]> = QKEY.key;

const LSK = 'aiexp.v2.quiz';
export function answers(): Record<string, number> {
  try { const v = JSON.parse(localStorage.getItem(LSK) || '{}') as unknown; return v && typeof v === 'object' ? (v as Record<string, number>) : {}; } catch { return {}; }
}
const save = (a: Record<string, number>) => { try { localStorage.setItem(LSK, JSON.stringify(a)); } catch { /* private mode */ } };
/** live quizScore(): [correct, answered, total] over all stops */
export function quizScore(): [number, number, number] {
  const a = answers(); let c = 0, d = 0, t = 0;
  for (const [k, key] of Object.entries(QUIZ_KEY)) key.forEach((r, i) => { t++; const x = a[k + '.' + i]; if (x != null) { d++; if (x === r) c++; } });
  return [c, d, t];
}
/** live v2rng / perm: the option order is fixed per question */
function rng(seed: number) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
export function perm(n: number, seed: number) { const a: number[] = []; for (let i = 0; i < n; i++) a.push(i); const r = rng(seed + 1); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i] as number; a[i] = a[j] as number; a[j] = t; } return a; }
const t2 = (l: Lang, zh: string, en: string) => (l === 'en' ? en : zh);

export function renderQuiz(root: ParentNode, sec: string, lang: Lang, QZ: QZ) {
  const el = root.querySelector<HTMLElement>('#quiz' + sec), qs = QZ[sec]; if (!el || !qs) return;
  const ans = answers(); let c = 0, d = 0;
  const h = qs.map((q, i) => {
    const k = sec + '.' + i, a = ans[k], done = a != null; if (done) { d++; if (a === q[2]) c++; }
    const p = perm(q[1].length, i * 7 + sec.length * 3);
    return '<div class="qz' + (done ? ' done' : '') + '"><p class="q">Q' + (i + 1) + '. ' + q[0] + '</p><div class="opts">' + p.map((o) => {
      const cls = done ? (o === q[2] ? ' right' : o === a ? ' wrong' : '') : '';
      return '<button class="opt' + cls + '" data-q="' + k + '" data-o="' + o + '"' + (done ? ' aria-disabled="true"' : '') + '>' + (done && o === q[2] ? '✅ ' : done && o === a ? '❌ ' : '') + q[1][o] + '</button>';
    }).join('') + '</div><div class="exp">💡 <b>' + (done ? (a === q[2] ? t2(lang, '答对了！', 'Correct!') : t2(lang, '正确答案是“', 'The correct answer is “') + q[1][q[2]] + t2(lang, '”。', '”.')) : '') + t2(lang, '</b>设计动机：', '</b>Design rationale: ') + q[3] + '</div></div>';
  }).join('');
  el.innerHTML = t2(lang, '<h3>❓ 小测验：', '<h3>❓ Quiz: ') + tabn(sec, lang) + '</h3><p class="plain pl-q">' + CODES['quiz.lead'][lang] + '</p>' + t2(lang, '<p class="qsum">本页 ', '<p class="qsum">This page: ') + qs.length + t2(lang, ' 题，已答 ', ' questions, answered ') + d + t2(lang, ' 题，答对 ', ' , correct ') + c
    + t2(lang, ' 题。每题答完会解释“当初为什么这样设计”。</p>', ' . Each answer explains “why it was designed this way”.</p>') + h + '<div class="row"><button class="btn" data-qreset="' + sec + t2(lang, '">重做本页测验</button></div>', '">Redo this quiz</button></div>');
  const t = document.createElement('span'); t.className = 'zl zq'; t.textContent = t2(lang, '❓ 小测验', '❓ Quiz'); el.insertBefore(t, el.firstChild);
}

/** render the stop's quiz and handle answers / "redo" inside it; returns dispose */
export async function mountQuiz(sec: HTMLElement, S: string, lang: Lang): Promise<() => void> {
  if (!QUIZ_KEY[S] || !sec.querySelector('#quiz' + S)) return () => {};
  const QZ = await loadQuiz(lang);
  renderQuiz(sec, S, lang, QZ);
  const onClick = (e: Event) => {
    const t = e.target as Element | null; if (!t?.closest) return;
    const o = t.closest<HTMLElement>('.opt[data-q]');
    if (o) {
      const k = o.dataset.q ?? '', ans = answers(); if (ans[k] != null) return;
      ans[k] = +(o.dataset.o ?? 0); save(ans);
      const s = k.split('.')[0] ?? '';
      renderQuiz(sec, s, lang, QZ); document.dispatchEvent(new Event('si-progress'));
      const q = QZ[s]?.[+(k.split('.')[1] ?? 0)];
      toast(q && ans[k] === q[2] ? t2(lang, '✅ 答对了！', '✅ Correct!') : t2(lang, '❌ 再看看解释', '❌ Check the explanation'));
      return;
    }
    const r = t.closest<HTMLElement>('[data-qreset]');
    if (r) { const s = r.dataset.qreset ?? '', ans = answers(); Object.keys(ans).forEach((k) => { if (k.split('.')[0] === s) delete ans[k]; }); save(ans); renderQuiz(sec, s, lang, QZ); document.dispatchEvent(new Event('si-progress')); }
  };
  sec.addEventListener('click', onClick);
  return () => sec.removeEventListener('click', onClick);
}
