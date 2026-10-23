/* Stop 11 (T8) progress card: the live renderProg grid and the "clear progress" button (#progReset). */
import type { Lang } from '../i18n/types';
import { TABORDER, tabn } from '../legacy/kb';
import { toast, visited } from '../nav';
import { answers, QUIZ_KEY } from './quiz';

const LSP = 'aiexp.v2.';
const put = (k: string, v: unknown) => { try { localStorage.setItem(LSP + k, JSON.stringify(v)); } catch { /* private mode */ } };
const t2 = (lang: Lang, zh: string, en: string) => (lang === 'en' ? en : zh);

export function renderProg(sec: HTMLElement, lang: Lang) {
  const el = sec.querySelector<HTMLElement>('#progDetail'); if (!el) return;
  const vis = visited(), ans = answers();
  el.innerHTML = '<div class="grid">' + TABORDER.map((k, i) => {
    const v = vis.includes(k), q = QUIZ_KEY[k]; let c = 0, d = 0;
    q?.forEach((r, j) => { const a = ans[k + '.' + j]; if (a != null) { d++; if (a === r) c++; } });
    return '<div class="mini" style="--c:' + (v ? '#16a34a' : '#94a3b8') + ';cursor:default"><b>' + (v ? '✅ ' : '○ ') + (i + 1) + '. ' + tabn(k, lang) + '</b><p>'
      + (q ? t2(lang, '测验：答对 ', 'Quiz: correct ') + c + ' / ' + q.length + (d < q.length ? t2(lang, '（还有 ', ' ( ') + (q.length - d) + t2(lang, ' 题没答）', ' unanswered)') : '') : t2(lang, '没有测验', 'No quiz'))
      + '</p><button class="btn" data-go="' + k + t2(lang, '" style="margin-top:6px;font-size:13px;padding:2px 10px">去这一站</button></div>', '" style="margin-top:6px;font-size:13px;padding:2px 10px">Go to this stop</button></div>');
  }).join('') + '</div>';
}

export function mountProgress(sec: HTMLElement, S: string, lang: Lang): () => void {
  if (S !== 'T8') return () => {};
  renderProg(sec, lang);
  const pr = sec.querySelector<HTMLElement>('#progReset');
  const onReset = () => {
    put('visited', [S]); put('quiz', {}); put('tourDone', 0);
    renderProg(sec, lang);
    document.dispatchEvent(new Event('si-progress'));
    toast(t2(lang, '进度和成绩已清空', 'Progress and scores cleared'));
  };
  const onProg = () => renderProg(sec, lang);
  pr?.addEventListener('click', onReset);
  document.addEventListener('si-progress', onProg);
  return () => { pr?.removeEventListener('click', onReset); document.removeEventListener('si-progress', onProg); };
}
