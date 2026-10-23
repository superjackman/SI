/* Station Ud · Use it well */
import { arrow, comp, LEG, Page, svgOpen, type StationOut } from '../lib';
import { src } from './ext/kit';

export default function Ud(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  const sid = 'svgUd';
  let svg = svgOpen(sid, 328);
  svg += comp({ id: 'user', x: 95, y: 6, w: 190, h: 52, t: t('你的一句话', 'Your request'), s: [t('它只看得到这些', 'All it can see')], cat: 'io' }, L, nm('user'));
  svg += arrow(sid, 'M190 58 V78');
  svg += comp({ id: 'uPrompt', x: 40, y: 82, w: 300, h: 60, t: t('把任务说清楚', 'A clear task brief'), s: [t('目标 · 背景 · 约束 · 验收', 'Goal · context · limits · done')], cat: 'use' }, L, nm('uPrompt'));
  svg += arrow(sid, 'M190 142 V164');
  svg += comp({ id: 'uCtx', x: 40, y: 168, w: 300, h: 60, t: t('管好上下文', 'Managing context'), s: [t('放相关的，拿走无关的', 'Keep what matters, drop the rest')], cat: 'use' }, L, nm('uCtx'));
  svg += arrow(sid, 'M150 228 V244 H94 V258') + arrow(sid, 'M230 228 V244 H286 V258');
  svg += comp({ id: 'ctxwin', x: 3, y: 262, w: 182, h: 60, t: t('原理：上下文窗口', 'How: context window'), s: [t('能装多少', 'How much fits')], cat: 'llm' }, L, nm('ctxwin'));
  svg += comp({ id: 'think', x: 195, y: 262, w: 182, h: 60, t: t('原理：大模型思考', 'How: the LLM thinks'), s: [t('只用你给的信息', 'Uses only what it gets')], cat: 'llm' }, L, nm('think'));
  svg += '</svg>';
  const lg = LEG(t);

  P.card('c_Ud_0', 1, t('同一个 Agent，交代得好坏，结果差很多', 'Same agent, very different results'), `
<p class="lead">${t('模型只能看到你给它的东西，看不到你脑子里没说出来的要求。所以好用的关键在你这一侧：', 'The model sees only what you give it, never the requirements you kept in your head. So the key is on your side:')}</p>
<ul class="pts">
<li>${P.open('uPrompt')}${t('：目标、背景、约束、验收标准，四件事说全。', ': state all four: goal, background, constraints, acceptance.')}</li>
<li>${P.open('uCtx')}${t('：给相关的，拿走无关的。', ': give what is relevant, remove what is not.')}</li>
<li>${t('先计划再动手、结果自己验证、守住安全习惯。', 'Plan before acting, verify results yourself, keep safe habits.')}</li>
</ul>`, { h2: true });

  P.card('c_Ud_1', 2, t('✍️ 说清楚四件事', '✍️ Say four things clearly'), `
<table class="gl stack"><tbody><tr><th>${t('要说的', 'Say')}</th><th>${t('意思', 'Meaning')}</th></tr>
<tr><td>${t('🎯 目标', '🎯 Goal')}</td><td data-label="${t('意思', 'Meaning')}">${t('要什么结果（而不是“弄好一点”）', 'The result you want (not “make it better”)')}</td></tr>
<tr><td>${t('📎 背景', '📎 Background')}</td><td data-label="${t('意思', 'Meaning')}">${t('材料在哪、给谁看、试过什么', 'Where the material is, who it is for, what was tried')}</td></tr>
<tr><td>${t('🚫 约束', '🚫 Constraints')}</td><td data-label="${t('意思', 'Meaning')}">${t('哪些不能碰、不能做', 'What must not be touched or done')}</td></tr>
<tr><td>${t('✅ 验收', '✅ Acceptance')}</td><td data-label="${t('意思', 'Meaning')}">${t('怎样算完成、它自己怎么检查', 'What counts as done, and how it can check')}</td></tr>
</tbody></table>
<div class="u-cmp"><p class="u-bad">${t('❌ “帮我把报告弄好一点。”', '❌ “Make my report a bit better.”')}</p>
<p class="u-good">${t('✅ “把 docs/q3-report.md 改成给管理层看的一页摘要（目标）。读者没时间看细节，关心的是成本和风险（背景）。不要改任何数字（约束）。完成标准：不超过 300 字，开头三句话说清结论（验收）。”', '✅ “Turn docs/q3-report.md into a one-page summary for management (goal). Readers have no time for detail; they care about cost and risk (background). Do not change any numbers (constraint). Done means: under 250 words, and the first three sentences state the conclusion (acceptance).”')}</p></div>
<p>${t(`再加一招：给一个例子，往往比多写三段要求更管用。复杂任务先让它写<b>计划</b>，你看过再让它动手——这正对应 ${P.open('think')} 里“先想清楚再做”。`, `One more trick: an example often works better than three more paragraphs of rules. For complex tasks, have it write a <b>plan</b> and approve it before it acts, matching the “think first” in ${P.open('think')}.`)}</p>`);

  P.card('c_Ud_2', 2, t('🧹 管好上下文', '🧹 Manage the context'), `
<p>${t(`模型每一步只能看到 ${P.open('ctxwin')} 里的东西，按 ${P.open('tokenizer')} 切出来的词元计数。窗口有上限，而且装得越多，关键信息越容易被淹没：研究发现，很多模型对长上下文<b>中间</b>部分的信息利用得更差（开头和结尾更容易被用上）。这是一种普遍倾向，各模型程度不同。`, `At each step the model sees only what is in the ${P.open('ctxwin')}, counted in tokens cut by the ${P.open('tokenizer')}. The window has a limit, and the more it holds, the easier key facts get buried: studies found many models use information in the <b>middle</b> of a long context less well than at the start or end. It is a common tendency, stronger in some models than others.`)}</p>
<ul class="pts">
<li>${t('<b>一个话题一个对话</b>：换话题就开新对话；聊太久就让它写个摘要，带到新对话里。', '<b>One topic per chat</b>: new topic, new chat; when a chat runs long, have it write a summary and carry that over.')}</li>
<li>${t('<b>给路径，不贴全文</b>：告诉 Agent 文件在哪，让它自己读需要的部分。', '<b>Give paths, not whole files</b>: tell the agent where files are and let it read what it needs.')}</li>
<li>${t('<b>去掉无关材料</b>：多贴的文档不只是浪费，还会把它带偏。', '<b>Remove irrelevant material</b>: extra documents do not just waste room, they can lead it astray.')}</li>
</ul>`);

  P.card('c_Ud_3', 2, t('🔍 结果要验证', '🔍 Verify the result'), `
<ul class="pts">
<li>${t('<b>让它自己先查一遍</b>：要求它跑测试、对照验收标准逐条检查，并说明哪里没把握。', '<b>Have it check first</b>: ask it to run tests, go through the acceptance criteria one by one, and say where it is unsure.')}</li>
<li>${t('<b>你再抽查关键处</b>：数字、引用、日期、对外发出的内容。', '<b>Then spot-check the key parts</b>: numbers, sources, dates, anything going out.')}</li>
<li>${t('<b>“说完成了”不等于完成了</b>：模型可能很有把握地说错话，看证据（测试结果、diff、原文出处）。', '<b>“It says done” is not done</b>: models can be confidently wrong; look at evidence (test results, diffs, original sources).')}</li>
</ul>`);

  P.card('c_Ud_4', 2, t('🛡️ 安全习惯', '🛡️ Safe habits'), `
<ul class="pts">
<li>${t('权限从小开始，够用就好；任务完了就收回。', 'Start with little access, just enough; take it back when the task is done.')}</li>
<li>${t('发送、删除、付款这类不可逆的动作，坚持人工确认。', 'Keep human confirmation for irreversible actions: sending, deleting, paying.')}</li>
<li>${t(`它读进来的网页、邮件、文件都可能藏着 ${P.open('inject')}；读外部内容的 Agent，不要同时给它发送和删除的权限。`, `Web pages, emails and files it reads may hide a ${P.open('inject')}; an agent that reads outside content should not also hold send and delete rights.`)}</li>
<li>${t('不要把密码、密钥直接贴进对话。', 'Never paste passwords or keys into the chat.')}</li>
</ul>`);

  P.card('c_Ud_5', 2, t('📋 验收清单：交回来的东西怎么验', '📋 An acceptance checklist for what comes back'), `
<p>${t('验收标准最好在<b>交任务时</b>就写好，而不是看到结果再想。按产出类型，常用的检查项：', 'Write the acceptance criteria <b>when you hand the task off</b>, not after you see the result. Common checks by type of output:')}</p>
<table class="gl stack"><thead><tr><th>${t('产出', 'Output')}</th><th>${t('至少检查', 'Check at least')}</th></tr></thead><tbody>
<tr><td>${t('代码 / PR', 'Code / PR')}</td><td data-label="${t('至少检查', 'Check at least')}">${t('测试真的跑过并通过（看日志，不只看它说）；看 diff，有没有改了任务以外的文件；有没有删测试、跳过检查来“过关”。', 'Tests really ran and passed (read the log, not just its word); read the diff for files outside the task; check it didn’t delete tests or skip checks to “pass”.')}</td></tr>
<tr><td>${t('报告 / 研究', 'Report / research')}</td><td data-label="${t('至少检查', 'Check at least')}">${t('抽几条引用点开原文核对；来源是不是一手、权威的；有没有漏掉你要求的问题；日期和数字对不对。', 'Open a few citations and compare with the source; are sources primary and authoritative; did it skip any question you asked; are dates and numbers right.')}</td></tr>
<tr><td>${t('数据 / 表格', 'Data / tables')}</td><td data-label="${t('至少检查', 'Check at least')}">${t('总行数、合计和原始数据对得上；随机抽几行回到原始数据核对；空值和异常值怎么处理的。', 'Row counts and totals match the source; pick a few random rows and trace them back; how blanks and outliers were handled.')}</td></tr>
<tr><td>${t('要发出去的内容', 'Anything going out')}</td><td data-label="${t('至少检查', 'Check at least')}">${t('收件人、称呼、附件对不对；有没有不该外传的信息；由你本人按“发送”。', 'Right recipients, names and attachments; nothing that shouldn’t leave; you press “send” yourself.')}</td></tr>
</tbody></table>
<ul class="u-chk">
<li>${t('它说“没把握”的地方，你都看过了。', 'You looked at every place it said it was unsure about.')}</li>
<li>${t('结果能复现：换个时间再跑，或你自己照着做一遍，结论一致。', 'The result reproduces: a rerun, or you following the steps, gives the same conclusion.')}</li>
<li>${t('不合格就退回，写清楚哪一条没过，而不是自己悄悄改掉。', 'If it fails, send it back saying which item failed, rather than quietly fixing it yourself.')}</li>
</ul>
<p>${t('参考：一家模型公司评估自家研究 Agent 时，用的评分维度是事实准确、引用准确、完整性、来源质量和工具使用效率。', 'For reference: one AI lab, evaluating its research agents, scored factual accuracy, citation accuracy, completeness, source quality and tool efficiency.')}</p>
${src(P, [['https://www.anthropic.com/research/multi-agent-research-system', 'How we built our multi-agent research system']])}`);

  P.labDivider();
  P.lab('labPrompt', t('四件事开关：同一个请求，交代得越清楚越好', 'The four switches: the clearer the brief, the better'), t(`“预计效果分”是${t('示意', 'illustrative')}的教学打分，不是真实模型的测量。`, `The “expected quality” score is an illustrative teaching score, not a measurement of a real model.`),
    [t('把“说清楚”拆成四个开关，一个个打开，看哪一项最关键。', 'Split “say it clearly” into four switches and turn them on one by one to see which matters most.'),
      t('多贴无关文档会扣分：上下文不是越多越好。', 'Extra irrelevant documents cost points: more context is not always better.')],
    `<p class="u-task">${t('原始请求：“帮我把报告弄好一点。”', 'Original request: “Make my report a bit better.”')}</p>
<div class="u-checks" id="prFlags" role="group" aria-label="${t('四件事', 'The four things')}"></div>
<div class="ctrls"><label>${t('顺手多贴的无关文档', 'Irrelevant documents pasted in')} <input type="range" id="prDocs" min="0" max="3" value="0"><b id="prDocsV">0</b></label></div>
<div class="u-out" id="prOut" aria-live="polite"></div>
<p class="u-cap">${t('这次请求放进上下文的内容：有用的交代 vs 无关文档（示意）', 'What this request puts into the context: useful brief vs irrelevant documents (illustrative)')}</p>
<div class="u-bar" id="prBar" role="img"></div>`,
    [t('只打开“目标”，再只打开“验收”，比一比哪个提升多', 'Turn on only “goal”, then only “acceptance”, and compare'),
      t('四个全开，再把无关文档拉到 3，看分数和下面的组成条怎么变', 'Turn all four on, then drag irrelevant documents to 3; watch the score and the bar below')]);

  P.quiz();
  return {
    sub: t('说清楚、管好上下文、自己验证。', 'Brief clearly, manage context, verify.'),
    one: t('同一个 Agent，交代得清不清楚、上下文干不干净，结果差很多：四件事说全、给相关的、先计划、再验证、守住安全习惯。', 'With the same agent, results swing on how clearly you brief it and how clean the context is: say the four things, give what is relevant, plan, verify, keep safe habits.'),
    why: t('模型只看得到你给的东西；这些习惯都在帮它“看到对的东西”。', 'The model only sees what you give it; these habits all help it see the right things.'),
    svg, legend: [lg.use as [string, string, string], lg.llm as [string, string, string]],
  };
}
