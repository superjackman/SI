/* Station Ub · Let it run alone */
import { arrow, code, comp, LEG, Page, svgOpen, zone, type StationOut } from '../lib';

export default function Ub(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  const sid = 'svgUb';
  let svg = svgOpen(sid, 374);
  svg += comp({ id: 'user', x: 95, y: 6, w: 190, h: 52, t: t('你交出任务', 'You hand it off'), s: [t('或定时器、事件', 'or a timer / event')], cat: 'io' }, L, nm('user'));
  svg += arrow(sid, 'M190 58 V78');
  svg += zone(3, 82, 374, 190);
  const it = (pid: string, y: number, a: string, b: string) => comp({ id: pid, x: 11, y, w: 358, h: 52, t: a, s: [b], fs: 14.5, cat: 'use' }, L, nm(pid));
  svg += it('uBg', 90, t('后台 / 云端 Agent', 'Background / cloud agent'), t('沙盒里干活，交回一个 PR', 'Works in a sandbox, returns a PR'));
  svg += it('uRoutine', 150, t('例程与自动化', 'Routines & automation'), t('到点或事件发生就自动跑', 'Runs on a schedule or an event'));
  svg += it('uMulti', 210, t('多 Agent 协作', 'Multi-agent team'), t('拆成几块并行，再汇总', 'Split into parts, run, merge'));
  svg += arrow(sid, 'M63 272 V300') + arrow(sid, 'M190 272 V300') + arrow(sid, 'M317 272 V300');
  const pr = (pid: string, x: number, cat: string, a: string, b: string) => comp({ id: pid, x, y: 304, w: 120, h: 62, t: a, s: [b], fs: 14, cat }, L, nm(pid));
  svg += pr('evalag', 3, 'agent', t('原理：评估', 'How: evaluation'), t('怎么算做对', 'What counts as right'));
  svg += pr('multi', 130, 'agent', t('原理：多 Agent', 'How: multi-agent'), t('谁拆、谁做、谁审', 'Split, do, review'));
  svg += pr('perm', 257, 'safe', t('原理：最小权限', 'How: least access'), t('不可逆的留给人', 'People do the risky step'));
  svg += '</svg>';
  const lg = LEG(t);

  P.card('c_Ub_0', 1, t('让它自己干：交出去，事后验收', 'Let it run alone: hand it off, check it later'), `
<p class="lead">${t('这一类用法里，Agent 没有人在旁边看着。所以安全不能靠“你随时喊停”，要靠三样东西：', 'Here nobody watches the agent as it works. Safety cannot rely on “you can stop it any time”; it relies on three things:')}</p>
<ol class="pts">
<li>${t('<b>隔离</b>：在沙盒、副本或分支里干活，碰不到真正重要的东西。', '<b>Isolation</b>: it works in a sandbox, a copy or a branch, away from anything that really matters.')}</li>
<li>${t(`<b>产出能检查</b>：交回 PR、报告、草稿，而不是直接生效；有 ${P.open('evalag')} 的办法（测试、清单）。`, `<b>Checkable output</b>: it hands back a PR, a report or a draft instead of acting directly, with a way to ${P.open('evalag')} it (tests, a checklist).`)}</li>
<li>${t(`<b>不可逆的一步留给人</b>：合并、发送、付款由你来按，见 ${P.open('perm')}。`, `<b>People take the irreversible step</b>: merging, sending, paying are yours to press; see ${P.open('perm')}.`)}</li>
</ol>`, { h2: true });

  P.card('c_Ub_1', 2, `☁️ ${code('use.bg', L)}`, `
<p>${t('你写好任务交出去，它在云端开一个隔离环境：拉一份代码、装依赖、改代码、跑测试，最后推到一个新分支并开一个合并请求（PR）。你可以同时开好几个，关掉电脑也照样跑。', 'You write the task and hand it off. It opens an isolated cloud environment: gets a copy of the code, installs dependencies, edits, runs tests, then pushes a new branch and opens a pull request (PR). You can run several at once, even with your computer off.')}</p>
<ul class="pts">
<li>${t('<b>适合</b>：说得清、有测试、不着急的活——修一个已知 bug、补测试、升级依赖、批量改名。', '<b>Good for</b>: clear, testable, non-urgent work: fix a known bug, add tests, upgrade a dependency, rename across files.')}</li>
<li>${t('<b>不适合</b>：要你频繁拍板的设计工作，或者没法验收的活。', '<b>Not for</b>: design work that needs frequent decisions, or work that cannot be checked.')}</li>
<li>${t(`<b>原理</b>：还是那个 ${P.open('loop')}，只是“你”换成了测试结果来判断对不对。`, `<b>How it works</b>: the same ${P.open('loop')}, with test results instead of you judging each step.`)}</li>
</ul>`);

  P.card('c_Ub_2', 2, `⏰ ${code('use.routine', L)}`, `
<p>${t('不用你开口：到点了（每天 9 点）或某件事发生了（来了新邮件、新工单、新提交），就按一段固定的提示词自动跑一遍。', 'Nobody has to ask: at a set time (9 am daily) or when something happens (a new email, ticket or commit), it runs a fixed prompt automatically.')}</p>
<p>${t(`举例 ${P.tag()}：每个工作日 9:00，读昨天新开的工单 → 分类、找出重复的 → 写一份摘要。`, `Example ${P.tag()}: every weekday at 9:00, read yesterday’s new tickets → sort them and find duplicates → write a summary.`)}</p>
<ul class="pts">
<li>${t('<b>先出草稿</b>：会“发出去”的步骤（回邮件、关工单）先只生成草稿，人看过再执行。', '<b>Draft first</b>: steps that send something out (reply, close a ticket) only produce a draft until a person approves.')}</li>
<li>${t('<b>幂等</b>：同一条数据跑两遍，效果也只算一次（比如先查“处理过没有”）。重试、补跑时才不会重复发送。', '<b>Idempotent</b>: running twice on the same item has the effect of once (e.g. check “already handled?” first), so retries and catch-up runs never send twice.')}</li>
<li>${t('<b>留日志</b>：每次跑了什么、用了哪些工具，都记下来，定期看一眼。', '<b>Keep logs</b>: record what each run did and which tools it used, and look at them regularly.')}</li>
</ul>`);

  P.card('c_Ub_3', 2, `👥 ${code('use.multi', L)}`, `
<p>${t(`一个 ${P.open('orch')} 把大任务拆开，派给几个 ${P.open('worker')} 各自去做，再由 ${P.open('critic')} 把关、汇总。每个子 Agent 有自己干净的上下文，只看自己那一块。`, `An ${P.open('orch')} splits a big task, sends parts to several ${P.open('worker')}s, and a ${P.open('critic')} checks and merges. Each sub-agent has its own clean context and sees only its part.`)}</p>
<p>${t(`算一笔账 ${P.tag()}：查 3 个方向的资料，每个 4 分钟。一个 Agent 依次查要 12 分钟；3 个并行查约 4 分钟，再加 1 分钟汇总。代价是用了 3 份上下文，花费更多。`, `A rough sum ${P.tag()}: research 3 directions, 4 minutes each. One agent in turn takes 12 minutes; 3 in parallel take about 4, plus 1 to merge. The cost: 3 contexts, so it costs more.`)}</p>
<ul class="pts">
<li>${t('<b>适合</b>：能拆成互不依赖的几块的活。', '<b>Good for</b>: work that splits into independent parts.')}</li>
<li>${t('<b>要点</b>：给每个执行者的任务要写完整，它看不到协调者的对话；最后一定要汇总、核对。', '<b>Key point</b>: give each worker a complete brief (it cannot see the coordinator’s chat), and always merge and check at the end.')}</li>
</ul>`);

  P.card('c_Ub_4', 2, t('🧠 为什么交回的是“PR”，而不是直接改好？', '🧠 Why hand back a PR instead of just changing things?'), `
<p>${t('没人盯着时，最怕的是“错误直接生效”。交回一个 PR，等于把所有改动放进一个可以审查、可以拒绝的盒子里：', 'With nobody watching, the worst risk is a mistake taking effect directly. A PR puts every change in a box that can be reviewed and rejected:')}</p>
<ul class="pts">
<li>${t('最坏的情况只是“不合并”，什么都没坏；', 'the worst case is “do not merge”, and nothing is broken;')}</li>
<li>${t('测试结果和 diff 一起摆在你面前，审查比自己从头做快得多；', 'test results and the diff are right in front of you, and reviewing is much faster than doing it yourself;')}</li>
<li>${t('“合并”这一步不可逆地改变主线，所以留给人来按。', '“merge” changes the main line for good, so a person presses it.')}</li>
</ul>
<p>${t('例程的“先出草稿”是同一个道理。', 'A routine’s “draft first” follows the same logic.')}</p>`);

  P.quiz();
  return {
    sub: t('交出去，它独立跑完，你事后验收。', 'Hand it off; it runs to the end; you check afterwards.'),
    one: t('后台 / 云端 Agent、例程与自动化、多 Agent 协作：没人在旁边看着，靠隔离、可检查的产出和人来按最后一步保证安全。', 'Background / cloud agents, routines and multi-agent teams: nobody watches, so safety comes from isolation, checkable output, and a person pressing the final button.'),
    why: t('说得清、能验收的活不需要你一直在场；把你的时间留给审查和拍板。', 'Clear, checkable work does not need you present the whole time; save your time for review and decisions.'),
    svg, legend: [lg.use as [string, string, string], lg.agent as [string, string, string], lg.safe as [string, string, string]],
  };
}
