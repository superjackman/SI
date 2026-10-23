/* Stop 11 (T8) progress card: the live renderProg grid and the "clear progress" button (#progReset). */
import type { Lang } from '../i18n/types';
import { TABORDER, tabn } from '../legacy/kb';
import { toast, visited } from '../nav';
import { tx } from '../i18n/L';
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

/** R12: home-page knowledge map — mark visited stations and show "seen n/m" per layer (from the same visited list) */
export function markKmap(sec: HTMLElement, lang: Lang) {
  const v = visited();
  sec.querySelectorAll<HTMLElement>('.km-l[data-km]').forEach((li) => {
    const st = (li.dataset.km ?? '').split(' '), n = st.filter((k) => v.includes(k)).length;
    li.querySelectorAll<HTMLElement>('.km-x[data-go]').forEach((b) => b.classList.toggle('v', v.includes(b.dataset.go ?? '')));
    li.querySelector('.km-p')?.remove();
    if (n && li.dataset.km !== 'T1') { const p = document.createElement('span'); p.className = 'km-p'; p.textContent = '✓ ' + tx('km.seen', lang) + ' ' + n + '/' + st.length; li.querySelector('.km-n')?.insertBefore(p, li.querySelector('.km-c')); }
  });
}

export function mountProgress(sec: HTMLElement, S: string, lang: Lang): () => void {
  if (S === 'T1') { markKmap(sec, lang); const on = () => markKmap(sec, lang); document.addEventListener('si-progress', on); return () => document.removeEventListener('si-progress', on); }
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
