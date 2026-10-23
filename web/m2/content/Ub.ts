/* Station Ub · Let it run alone */
import { arrow, code, comp, LEG, Page, svgOpen, zone, type StationOut } from '../lib';
import { dd, src } from './ext/kit';

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

  P.card('c_Ub_5', 2, t('🤔 什么时候才值得上多 Agent？', '🤔 When is a multi-agent setup worth it?'), `
${dd(P, ['T2'])}
<p>${t('多 Agent 听起来更强，但研究给出的结论更冷静：', 'Multi-agent sounds stronger, but the research is more sober:')}</p>
<ul class="pts">
<li>${t('UC Berkeley 等的 <b>MAST</b> 研究标注了 7 个多 Agent 框架的 1642 条运行记录，归纳出 3 大类、14 种失败方式：<b>系统设计问题</b>、<b>Agent 之间配合失调</b>、<b>任务验证不足</b>。在 7 个开源多 Agent 系统上，失败率在 41% 到 86.7% 之间，相对单 Agent 或“多跑几次挑最好”的基线，提升常常很小。', 'The <b>MAST</b> study (UC Berkeley and others) annotated 1642 traces from 7 multi-agent frameworks and found 14 failure modes in 3 groups: <b>system design issues</b>, <b>inter-agent misalignment</b> and <b>task verification</b>. On 7 open-source multi-agent systems, failure rates ran from 41% to 86.7%, and gains over single-agent or best-of-N baselines were often small.')}</li>
<li>${t('一家模型公司介绍自家研究系统的工程文章写到：Agent 用的词元大约是普通聊天的 4 倍，多 Agent 系统大约 15 倍；需要所有 Agent 共享同一份上下文、彼此依赖很多的任务（例如大多数写代码的活）不太适合多 Agent。', 'An AI lab’s engineering post on its research system says that agents use about 4× the tokens of chat and multi-agent systems about 15×, and that tasks where all agents need the same context or have many dependencies (such as most coding) are a poor fit.')}</li>
</ul>
<div class="u-dec">
<div class="u-good"><b>${t('值得一试', 'Worth trying')}</b>${t('能拆成<b>互不依赖</b>的几块、每块要读很多资料（比如分头调研几个方向）；任务的价值高到值得多花词元。', 'The work splits into <b>independent</b> parts that each need a lot of reading (say, researching several directions); the task is valuable enough to justify the extra tokens.')}</div>
<div class="u-bad"><b>${t('先别用', 'Not yet')}</b>${t('步骤之间环环相扣、要共用同一份上下文；一个 Agent 加好的提示词和工具就能做完；没法检查结果对不对。', 'Steps depend on each other and share one context; one agent with good prompts and tools can finish it; there is no way to check the result.')}</div>
</div>
<p>${t(`真要用，就针对 MAST 的三类失败下手：角色和分工写清楚；规定什么时候算“做完”；最后加一个独立的 ${P.open('critic')} 核对结果。MAST 作者的案例里，给一个开源多 Agent 框架加一步高层目标核对，成功率提高了 15.6%。`, `If you do, target MAST’s three groups: write clear roles; define when the job counts as done; add an independent ${P.open('critic')} to check the result at the end. In the MAST authors’ case study, adding a high-level objective check to one open-source framework raised success by 15.6%.`)}</p>
${src(P, [['https://arxiv.org/abs/2503.13657', 'Cemri et al. 2025 · Why Do Multi-Agent LLM Systems Fail? (MAST)'], ['https://www.anthropic.com/research/multi-agent-research-system', 'How we built our multi-agent research system']])}`);

  P.card('c_Ub_6', 2, t('🔎 “深度研究”是怎么做出来的', '🔎 How “deep research” works'), `
<p>${t(`很多 AI 产品有“深度研究”功能：你提一个问题，它花几分钟到几十分钟，自己搜、自己读，交回一份带引用的报告。具体做法各家不同，下面是一家模型公司公开的一种做法（见来源）（${P.open('orch')} + ${P.open('worker')}）：`, `Many AI products have a “deep research” mode: you ask a question and it spends minutes searching and reading on its own, then returns a cited report. Each vendor does it differently; below is one approach an AI lab has published (see sources) (an ${P.open('orch')} plus ${P.open('worker')}s):`)}</p>
<ol class="u-flow">
<li><b class="uf-t">${t('规划', 'Plan')}</b>${t('主 Agent 想清楚怎么查，把计划存进记忆（上下文太长时也不会丢）。', 'The lead agent works out an approach and saves the plan to memory, so it survives a long context.')}</li>
<li><b class="uf-t">${t('并行搜索', 'Search in parallel')}</b>${t('派出几个子 Agent，各查一个方向；先用宽泛的搜索词，再逐步收窄。', 'It spawns subagents, one per direction; each starts with broad queries, then narrows.')}</li>
<li><b class="uf-t">${t('读与判断', 'Read and judge')}</b>${t('子 Agent 每拿到一批结果就想一想：够不够、靠不靠谱、下一步搜什么。', 'After each batch of results, a subagent thinks: is this enough, is it reliable, what next?')}</li>
<li class="uf-loop"><b class="uf-t">${t('汇总，不够就再查', 'Merge, and loop if needed')}</b>${t('主 Agent 汇总各方发现，判断还要不要继续研究；需要就再派一轮。', 'The lead merges the findings and decides whether more research is needed; if so, another round goes out.')}</li>
<li><b class="uf-t">${t('标注引用', 'Cite')}</b>${t('专门的一步把报告里的每个说法对应到来源。', 'A dedicated step matches each claim in the report to its source.')}</li>
</ol>
<p>${t('这篇文章给出的经验：简单查事实用 1 个 Agent、3 到 10 次工具调用就够；做比较用 2 到 4 个子 Agent；复杂研究才用 10 个以上。他们的人工测试还发现，Agent 容易偏爱搜索排名高的“内容农场”，而不是权威来源。', 'The post’s rules of thumb: a simple fact needs 1 agent and 3–10 tool calls; a comparison 2–4 subagents; only complex research uses more than 10. Their human testers also found agents favouring SEO content farms over authoritative sources.')}</p>
<p>${t('所以拿到报告后要<b>抽查引用</b>：点开几个链接，看原文是不是真这么说、来源是不是一手的。', 'So when the report arrives, <b>spot-check the citations</b>: open a few links and see whether the source really says that, and whether it is a primary source.')}</p>
${src(P, [['https://www.anthropic.com/research/multi-agent-research-system', 'How we built our multi-agent research system']])}`);

  P.card('c_Ub_7', 2, t('🛤️ 工作流还是 Agent？同一件事做两遍', '🛤️ Workflow or agent? The same job done both ways'), `
<p>${t('一篇常被引用的工程文章这样定义：<b>工作流</b>是用事先写好的代码路径来编排模型和工具；<b>Agent</b> 是让模型自己决定流程和用什么工具。拿同一件事比一比：', 'A widely cited engineering post defines them: a <b>workflow</b> orchestrates the model and tools through predefined code paths; an <b>agent</b> lets the model direct its own process and tool use. Compare the same job both ways:')}</p>
<p>${t(`任务 ${P.tag()}：每周把客户反馈整理成一份周报。`, `Task ${P.tag()}: turn each week’s customer feedback into a weekly report.`)}</p>
<div class="u-dec">
<div><b>${t('🛤️ 工作流做法', '🛤️ As a workflow')}</b>${t('程序固定地走：① 导出本周反馈 → ② 模型逐条分类 → ③ 模型写摘要 → ④ 套模板生成周报。每一步做什么是写死的，每次都一样，出错了也容易定位是哪一步。', 'The code always runs: ① export this week’s feedback → ② the model labels each item → ③ the model writes a summary → ④ fill a template. Each step is fixed, every run is the same, and a failure is easy to pin to one step.')}</div>
<div><b>${t('🤖 Agent 做法', '🤖 As an agent')}</b>${t('给它目标和工具（查反馈库、查工单、搜索、写文档），让它自己决定查什么、查几轮。遇到“某个功能突然被大量吐槽”，它可以自己去翻相关工单找原因。更灵活，但步数、花费和结果每次都可能不同。', 'Give it the goal and tools (feedback store, tickets, search, docs) and let it decide what to look up and for how many rounds. If one feature suddenly draws many complaints, it can dig through the related tickets for the cause. More flexible, but the steps, cost and result can differ every run.')}</div>
</div>
<p>${t('文章的建议：先找<b>最简单</b>的办法，真有需要才加复杂度。步骤能事先定下来的明确任务，用工作流更可预测、更稳定；步数没法预先知道的开放问题，才轮到 Agent，代价是更高的延迟和花费。', 'The article’s advice: find the <b>simplest</b> solution first and add complexity only when needed. For well-defined tasks whose steps can be fixed in advance, workflows are more predictable and consistent; agents suit open-ended problems where the number of steps can’t be predicted, at the price of more latency and cost.')}</p>
${src(P, [['https://www.anthropic.com/research/building-effective-agents', 'Building effective agents']])}`);

  P.labDivider();
  P.lab('labFan', t('一个 vs 一群：拆给几个子 Agent', 'One vs a team: how many sub-agents'), t(`分钟和词元都是示意数字（${code('use.demo', L)}）：4 块调研，每块 4 分钟、2 万词元；每个子 Agent 的任务说明 5 千词元，汇总 1 分钟。`, `Minutes and tokens are made up (${code('use.demo', L)}): 4 research parts, 4 minutes and 20k tokens each; each sub-agent’s brief costs 5k tokens, merging takes 1 minute.`),
    [t('并行省的是时间，不是花费：每多一个子 Agent，就多一份任务说明和一份上下文。', 'Parallel work saves time, not money: each extra sub-agent adds a brief and a context of its own.'),
      t(`子任务互相依赖时，后一个要等前一个的结果，并行就退化成排队，还多了交接和冲突。见 ${P.open('uMulti')}。`, `When parts depend on each other, each waits for the last, so “parallel” turns into a queue with extra handoffs and conflicts. See ${P.open('uMulti')}.`)],
    `<div class="ctrls">
<label>${t('子 Agent 数', 'Sub-agents')} <select id="fnN"><option value="1">1</option><option value="2">2</option><option value="4" selected>4</option></select></label>
<label><input type="checkbox" id="fnDep"> ${t('子任务相互依赖', 'Parts depend on each other')}</label>
</div>
<div class="fn-lanes" id="fnLanes"></div>
<p class="u-stat" id="fnStat"></p>`,
    [t('从 1 拨到 4，看耗时和总词元各往哪边走', 'Go from 1 to 4 and watch which way time and total tokens move'),
      t('勾选“相互依赖”，再比较 1 个和 4 个', 'Tick “depend on each other”, then compare 1 and 4')]);

  P.lab('labCron', t('做一个例程：模拟一周', 'Build a routine: simulate a week'), t(`事件是编的（${code('use.demo', L)}）；每种触发里都混着一条“陷阱”。`, `The events are made up (${code('use.demo', L)}); each trigger hides one “trap”.`),
    [t('只把结果告诉你的动作（发摘要）可以放心自动跑；会碰到别人的动作（回复、关闭）一旦做错就收不回。', 'Actions that only tell you (a digest) are safe to automate; actions that reach other people (reply, close) cannot be taken back once wrong.'),
      t('“先出草稿”把不可逆的一步留给人：慢一点，但陷阱会被你拦下。', '“Draft first” leaves the irreversible step to a person: slower, but you catch the trap.')],
    `<div class="ctrls">
<label>${t('触发', 'Trigger')} <select id="crTrig"><option value="daily">${t('每个工作日 9:00', 'Weekdays at 9:00')}</option><option value="mail">${t('来了新邮件', 'A new email')}</option><option value="issue">${t('来了新工单', 'A new ticket')}</option></select></label>
<label>${t('动作', 'Action')} <select id="crAct"><option value="digest">${t('写摘要发给我', 'Send me a digest')}</option><option value="reply">${t('自动回复对方', 'Reply to the sender')}</option><option value="close">${t('判断重复并关闭', 'Close duplicates')}</option></select></label>
<label>${t('执行方式', 'Mode')} <select id="crMode"><option value="auto">${t('自动执行', 'Run automatically')}</option><option value="draft" selected>${t('先出草稿，等我确认', 'Draft first, wait for me')}</option></select></label>
</div>
<ol class="u-log" id="crLog" aria-live="polite"></ol>
<p class="u-stat" id="crStat"></p>`,
    [t('动作选“自动回复”，在两种执行方式之间切换，看陷阱那天发生了什么', 'Pick “Reply to the sender” and switch between the modes; see what happens on the trap day'),
      t('动作换成“写摘要”，为什么就不用等你确认了？', 'Switch to “Send me a digest”: why does nothing wait for you now?')]);

  P.quiz();
  return {
    sub: t('交出去，它独立跑完，你事后验收。', 'Hand it off; it runs to the end; you check afterwards.'),
    one: t('后台 / 云端 Agent、例程与自动化、多 Agent 协作：没人在旁边看着，靠隔离、可检查的产出和人来按最后一步保证安全。', 'Background / cloud agents, routines and multi-agent teams: nobody watches, so safety comes from isolation, checkable output, and a person pressing the final button.'),
    why: t('说得清、能验收的活不需要你一直在场；把你的时间留给审查和拍板。', 'Clear, checkable work does not need you present the whole time; save your time for review and decisions.'),
    svg, legend: [lg.use as [string, string, string], lg.agent as [string, string, string], lg.safe as [string, string, string]],
  };
}
