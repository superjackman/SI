/* Station Ud lab: labPrompt — switch the four parts of a brief on and off; irrelevant documents cost points (illustrative score). */
import type { Env } from '../../legacy/runtime';
import { bar, byId, fmt, tr } from '../kit';
import { BRIEF, briefScore, briefTokens, PARTS4, type Part4 } from '../logic';

export const LABS = [{ ids: ['labPrompt', 'prFlags', 'prDocs', 'prOut', 'prBar'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const LBL: Record<Part4, string> = { goal: t('目标', 'Goal'), background: t('背景', 'Background'), constraints: t('约束', 'Constraints'), acceptance: t('验收标准', 'Acceptance criteria') };
  const TXT: Record<Part4, string> = {
    goal: t('目标：把第 3 节改成给老板看的一页摘要。', 'Goal: turn section 3 into a one-page summary for my manager.'),
    background: t('背景：读者不懂技术，最关心成本和上线时间。', 'Background: the reader is non-technical and cares most about cost and launch date.'),
    constraints: t('约束：不改数据，不超过 300 字，保留原有小标题。', 'Constraints: do not change any figures, at most 300 words, keep the existing headings.'),
    acceptance: t('验收：开头一句话给结论；列出 3 个风险，每个带应对办法。', 'Acceptance: open with the conclusion in one sentence; list 3 risks, each with a mitigation.'),
  };
  const on = new Set<Part4>();
  const render = () => {
    const docs = +(byId<HTMLInputElement>(env, 'prDocs')?.value ?? 0);
    const dv = byId(env, 'prDocsV'); if (dv) dv.textContent = String(docs);
    const out = byId(env, 'prOut'), b = byId(env, 'prBar'); if (!out || !b) return;
    const score = briefScore(on, docs), tok = briefTokens(on, docs);
    const lines = [t('“帮我把报告弄好一点。”', '“Make my report a bit better.”'), ...PARTS4.filter((k) => on.has(k)).map((k) => TXT[k])];
    if (docs) lines.push(t(`（另外贴了 ${docs} 份无关文档，约 ${fmt(env, docs * BRIEF.docTokens)} 词元）`, `(plus ${docs} irrelevant document(s), about ${fmt(env, docs * BRIEF.docTokens)} tokens)`));
    const verdict = score >= 85 ? t('交代清楚了：它知道做什么、给谁看、不能碰什么、怎样算好。', 'A clear brief: it knows what to do, for whom, what not to touch and what “good” means.')
      : score >= 50 ? t('还缺几块：它得自己猜，猜错就要返工。', 'Some parts are missing: it has to guess, and wrong guesses mean rework.')
        : t('太含糊：它只能按最常见的理解去改，很可能不是你要的。', 'Too vague: it can only follow the most common reading, likely not what you want.');
    out.dataset.score = String(score);
    out.innerHTML = `<pre class="u-code">${lines.join('\n')}</pre><p>${t('预计效果分（示意）：', 'Expected quality (illustrative): ')}<b>${score}</b> / 100 · ${t('请求长度约', 'brief about')} ${fmt(env, tok)} ${t('词元', 'tokens')}</p><p>${verdict}</p>`;
    const useful = tok - docs * BRIEF.docTokens;
    bar(b, [['good', useful, t('有用的交代', 'Useful brief')], ['noise', docs * BRIEF.docTokens, t('无关文档', 'Irrelevant documents')]]);
    b.title = t('这次请求进入上下文的内容：绿色是有用的交代，灰色是无关文档', 'What this request puts into the context: green is useful brief, grey is irrelevant documents');
  };
  const lab = () => {
    const f = byId(env, 'prFlags'); if (!f) return;
    f.innerHTML = PARTS4.map((k) => `<label><input type="checkbox" data-k="${k}"> ${LBL[k]}</label>`).join('');
    f.addEventListener('change', (e) => { const i = e.target as HTMLInputElement, k = i.dataset.k as Part4 | undefined; if (!k) return; if (i.checked) on.add(k); else on.delete(k); render(); });
    byId(env, 'prDocs')?.addEventListener('input', render);
    render();
  };
  return { labs: [lab], eager: () => {} };
}
