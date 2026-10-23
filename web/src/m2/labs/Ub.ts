/* Station Ub labs: labFan — one agent or a team of sub-agents (illustrative minutes/tokens); labCron — a routine's simulated week. */
import type { Env } from '../../legacy/runtime';
import { byId, fmt, tr } from '../kit';
import { cronWeek, FAN, fanPlan, type CronAct, type CronTrig } from '../logic';

export const LABS = [
  { ids: ['labFan', 'fnN', 'fnDep', 'fnLanes', 'fnStat'], hooks: [] as string[] },
  { ids: ['labCron', 'crTrig', 'crAct', 'crMode', 'crLog', 'crStat'], hooks: [] as string[] },
];

export function mount(env: Env) {
  const t = tr(env);
  const sel = (id: string) => byId<HTMLSelectElement>(env, id)?.value ?? '';
  const SCALE = 22; /* minutes across the track: the slowest plan is 4×4 + 3 handoffs + 1 merge = 20 */

  const fan = () => {
    const n = +sel('fnN') || 1, dep = !!byId<HTMLInputElement>(env, 'fnDep')?.checked;
    const p = fanPlan(n, dep), lanes = byId(env, 'fnLanes'), st = byId(env, 'fnStat'); if (!lanes || !st) return;
    const pct = (m: number) => ((m / SCALE) * 100).toFixed(2);
    /* start times: independent parts run back to back per lane; dependent parts run one after another across lanes, with a handoff between */
    const start: number[] = [];
    if (dep) for (let q = 0; q < FAN.parts; q++) start[q] = q * FAN.min + (n > 1 ? q * FAN.handoff : 0);
    else p.lanes.forEach((l) => l.forEach((q, j) => { start[q] = j * FAN.min; }));
    const end = Math.max(...start.map((s) => s + FAN.min));
    lanes.innerHTML = p.lanes.map((l, a) => `<div class="fn-lane"><b>${n === 1 ? t('一个 Agent', 'One agent') : t(`子 ${a + 1}`, `Sub ${a + 1}`)}</b><div class="fn-track">${
      dep && n > 1 && a > 0 ? `<span class="wait" style="left:0;width:${pct(start[l[0]!]!)}%">${t('等', 'wait')}</span>` : ''}${
      l.map((q) => `<span style="left:${pct(start[q]!)}%;width:${pct(FAN.min)}%">${q + 1}</span>`).join('')}${
      n > 1 && a === 0 ? `<span class="merge" style="left:${pct(end)}%;width:${pct(FAN.merge)}%" title="${t('汇总', 'merge')}">Σ</span>` : ''}</div></div>`).join('');
    st.dataset.min = String(p.minutes); st.dataset.tok = String(p.tokens); st.dataset.conf = String(p.conflicts);
    st.innerHTML = t(`耗时 <b>${p.minutes}</b> 分钟 · 总词元 <b>${fmt(env, p.tokens)}</b> · 合并冲突 <b>${p.conflicts}</b>（示意）`, `Time <b>${p.minutes}</b> min · total tokens <b>${fmt(env, p.tokens)}</b> · merge conflicts <b>${p.conflicts}</b> (illustrative)`)
      + (dep && n > 1 ? `<br><span class="u-warn-t">${t('相互依赖：后一个要等前一个，并行没省下时间，反而多了交接、词元和冲突。', 'Dependent parts: each waits for the last, so no time is saved, and handoffs add tokens and conflicts.')}</span>` : '');
  };

  const DAYS = env.lang === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const EV: Record<string, string> = {
    d: t('9:00 处理当天新来的邮件和工单', '9:00 handle the day’s new emails and tickets'),
    dTrap: t('9:00 处理当天的一批（混着一条陷阱：钓鱼邮件或看似重复的工单）', '9:00 handle the day’s batch (one trap inside: a phishing email or a look-alike ticket)'),
    m1: t('新邮件：客户询价', 'New email: a customer asks for a quote'), m2: t('新邮件：快递通知', 'New email: delivery notice'),
    mPhish: t('新邮件：冒充老板的钓鱼邮件（陷阱）', 'New email: phishing posing as your boss (trap)'), m3: t('新邮件：同事问进度', 'New email: a colleague asks for status'),
    m4: t('新邮件：会议改期', 'New email: meeting moved'), m5: t('新邮件：周末账单提醒', 'New email: weekend billing reminder'),
    i1: t('新工单 #101：登录失败', 'New ticket #101: login fails'), i2: t('新工单 #102：同 #101', 'New ticket #102: same as #101'),
    iNotDup: t('新工单 #104：看着像 #101，其实是另一个问题（陷阱）', 'New ticket #104: looks like #101, is a different problem (trap)'), i3: t('新工单 #105：同 #102', 'New ticket #105: same as #102'),
  };
  const DONE: Record<CronAct, string> = { digest: t('摘要已发给你', 'digest sent to you'), reply: t('已自动回复', 'replied automatically'), close: t('已处理（重复的关闭）', 'handled (duplicates closed)') };
  const cron = () => {
    const act = sel('crAct') as CronAct, w = cronWeek(sel('crTrig') as CronTrig, act, sel('crMode') as 'auto' | 'draft');
    const log = byId(env, 'crLog'), st = byId(env, 'crStat'); if (!log || !st) return;
    log.innerHTML = w.runs.map((r) => `<li class="${r.status === 'done' ? 'read' : r.status}" data-s="${r.status}">${DAYS[r.day]} · ${EV[r.ev]} → ${
      r.status === 'done' ? DONE[act] : r.status === 'wait' ? t('⏸ 草稿已备好，等你确认', '⏸ draft ready, waiting for you') : t('✗ 自动执行做错了，已经发出 / 生效，收不回', '✗ the automatic action was wrong and has already gone out; it cannot be undone')}</li>`).join('');
    st.dataset.done = String(w.done); st.dataset.wait = String(w.wait); st.dataset.bad = String(w.bad);
    st.innerHTML = t(`本周运行 ${w.runs.length} 次：自动完成 <b>${w.done}</b>，等你确认 <b>${w.wait}</b>，做错 <b>${w.bad}</b>（示意）`, `${w.runs.length} runs this week: done automatically <b>${w.done}</b>, waiting for you <b>${w.wait}</b>, wrong <b>${w.bad}</b> (illustrative)`);
  };
  const lab = (ids: string[], f: () => void) => () => { for (const id of ids) byId(env, id)?.addEventListener('change', f); f(); };
  return { labs: [lab(['fnN', 'fnDep'], fan), lab(['crTrig', 'crAct', 'crMode'], cron)], eager: () => {} };
}
