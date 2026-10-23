/* Station U lab: labPick — tick a task's traits and see which way of using an agent fits (illustrative rules). */
import type { Env } from '../../legacy/runtime';
import { byId, name, tr } from '../kit';
import { PICK_PRESETS, PICK_TRAITS, pickWay, type Trait, type Way } from '../logic';

export const LABS = [{ ids: ['labPick', 'pkPre', 'pkFeat', 'pkOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const TRAIT: Record<Trait, string> = {
    q: t('只是问答或写文字，不碰文件', 'Just answers or writing; touches no files'),
    code: t('要改代码或文件', 'Edits code or files'),
    term: t('要跑命令、装依赖', 'Needs commands or installs'),
    gui: t('只能在网页或图形界面里操作', 'Only doable in a web page or app screen'),
    clear: t('清楚、可验收、不急', 'Clear, checkable, not urgent'),
    sched: t('定时重复', 'Repeats on a schedule'),
    split: t('能拆成几块并行', 'Splits into parallel parts'),
    risk: t('有风险：不可逆（发邮件、付款、删数据）', 'Risky: irreversible (send email, pay, delete data)'),
  };
  const PRE: Record<string, string> = {
    ask: t('问个概念', 'Ask about a concept'), fix: t('修一个报错', 'Fix an error'), report: t('每周发周报', 'Weekly report'),
    flight: t('网上订机票', 'Book a flight online'), tests: t('给 20 个模块补测试', 'Add tests to 20 modules'),
  };
  const WHY: Record<Way, string> = {
    uChat: t('不碰文件和账号，问答、写作、分析最省事。', 'Touches no files or accounts; simplest for questions, writing and analysis.'),
    uIde: t('改代码时你在旁边看着，每处改动都能当场审查、撤回。', 'You watch while it edits; every change can be reviewed and undone on the spot.'),
    uCli: t('能跑命令、装依赖、跑测试；用权限档位控制它哪些步骤要问你。', 'It can run commands, install and test; permission levels decide which steps ask you.'),
    uCua: t('没有接口可用时，它像人一样看屏幕、点按钮；慢一些，也更要防网页里的注入。', 'With no API to call, it looks at the screen and clicks like a person; slower, and page text may carry injections.'),
    uBg: t('任务清楚又不急，就交给后台在隔离环境里做，交回 PR 由你审。', 'Clear and not urgent: hand it to a background agent in isolation; it returns a PR for you to review.'),
    uRoutine: t('定时自动跑；没人盯着，所以要有日志，并且能安全地重跑。', 'Runs on a schedule; nobody watches, so it needs logs and must be safe to re-run.'),
    uMulti: t('几块互不依赖，就让几个 Agent 并行，各自上下文更干净。', 'Independent parts can run in parallel agents, each with a cleaner context.'),
  };
  const CONFIRM: Partial<Record<Way, string>> = {
    uRoutine: t('先出草稿，人看过再发出去。', 'Produce a draft; a person approves before it goes out.'),
    uCua: t('付款、提交这一步停下来等你确认。', 'Stop and wait for you at the pay / submit step.'),
  };
  const on = new Set<Trait>();
  const render = () => {
    const out = byId(env, 'pkOut'), feat = byId(env, 'pkFeat'); if (!out || !feat) return;
    feat.querySelectorAll<HTMLInputElement>('input[data-k]').forEach((i) => { i.checked = on.has(i.dataset.k as Trait); });
    if (!on.size) { out.innerHTML = `<p>${t('先点一个示例，或勾选任务特点。', 'Tap an example or tick some traits first.')}</p>`; out.dataset.way = ''; return; }
    const r = pickWay(on);
    out.dataset.way = r.way;
    out.innerHTML = `<p class="u-rec">${t('推荐：', 'Recommended: ')}<a data-open="${r.way}"><b>${name(env, r.way)}</b></a></p><p>${WHY[r.way]}</p>`
      + (r.confirm ? `<p class="u-confirm">⚠️ ${t('有不可逆的一步：', 'There is an irreversible step: ')}${CONFIRM[r.way] ?? t('交回 PR 或草稿，最后一步由你来做。', 'return a PR or draft; the last step is yours.')}</p>` : '');
  };
  const pick = () => {
    const pre = byId(env, 'pkPre'), feat = byId(env, 'pkFeat'); if (!pre || !feat) return;
    pre.innerHTML = `<span>${t('示例：', 'Examples: ')}</span>` + Object.keys(PRE).map((k) => `<button type="button" class="btn" data-pre="${k}">${PRE[k]}</button>`).join('');
    feat.innerHTML = PICK_TRAITS.map((k) => `<label><input type="checkbox" data-k="${k}"> ${TRAIT[k]}</label>`).join('');
    pre.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-pre]'); if (!b) return;
      on.clear(); (PICK_PRESETS[b.dataset.pre ?? ''] ?? []).forEach((k) => on.add(k)); render();
    });
    feat.addEventListener('change', (e) => {
      const i = e.target as HTMLInputElement; const k = i.dataset.k as Trait | undefined; if (!k) return;
      if (i.checked) on.add(k); else on.delete(k); render();
    });
    render();
  };
  return { labs: [pick], eager: () => {} };
}
