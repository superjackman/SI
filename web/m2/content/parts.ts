/* M2 parts: names, ownership, drill links and their popup cards (both languages). */
import type { Bi, PopSpec, T } from '../lib';
import { CODES } from '../../src/i18n/codes';
import { R25_PARTS } from './r25parts';

export interface M2Part { n: Bi; t: string; up?: string; zoom?: string; dn?: string[]; pop: (t: T) => PopSpec }
const C = (k: keyof typeof CODES): Bi => ({ zh: CODES[k].zh, en: CODES[k].en });

export const STATIONS: Record<string, Bi> = {
  U: { zh: '怎么用 Agent', en: 'Using agents' },
  Ua: { zh: '跟它一起干', en: 'Work alongside it' },
  Ub: { zh: '让它自己干', en: 'Let it run alone' },
  Uc: { zh: '给它装本事', en: 'Extend it' },
  Ud: { zh: '用得好', en: 'Use it well' },
  Up: { zh: '具体产品', en: 'Products' },
  Api: { zh: 'API 调模型', en: 'Model APIs' },
  Loc: { zh: '本地跑模型', en: 'Run models locally' },
};
export const PATHS: Record<string, string[]> = { U: ['T1', 'U'], Ua: ['T1', 'U', 'Ua'], Ub: ['T1', 'U', 'Ub'], Uc: ['T1', 'U', 'Uc'], Ud: ['T1', 'U', 'Ud'], Up: ['T1', 'U', 'Up'], Api: ['T1', 'Api'], Loc: ['T1', 'Loc'] };

const tryPick = (t: T): [string, string, string] => ['labPick', 'U', t('🧪 帮我选用法（怎么用 Agent）', '🧪 Pick a way to use it (Using agents)')];
const trySess = (t: T): [string, string, string] => ['labSession', 'Ua', t('🧪 一次编程会话（跟它一起干）', '🧪 A coding session (Work alongside it)')];
const tryCtx = (t: T): [string, string, string] => ['labCtxLoad', 'Uc', t('🧪 说明书占了多少上下文（给它装本事）', '🧪 How much context the manuals take (Extend it)')];
const tryPr = (t: T): [string, string, string] => ['labPrompt', 'Ud', t('🧪 四件事开关（用得好）', '🧪 The four-things switches (Use it well)')];

export const PARTS: Record<string, M2Part> = {
  uHub: {
    n: { zh: '怎么用 Agent（总览）', en: 'Using agents (overview)' }, t: 'U', up: 'app', zoom: 'U', dn: ['loop', 'guard'],
    pop: (t) => ({
      role: t('同一个 Agent（大模型 + 工具 + 循环），可以有很多种用法；差别只在四件事。', 'The same agent (LLM + tools + loop) can be used in many ways; they differ in only four things.'),
      tryit: tryPick(t),
      does: [
        t('<b>谁来发起</b>：你亲自开口，还是定时器 / 事件 / 另一个 Agent。', '<b>Who starts it</b>: you, or a timer / an event / another agent.'),
        t('<b>在哪里跑</b>：网页里、你的电脑上，还是云端的隔离环境。', '<b>Where it runs</b>: in a web page, on your computer, or in an isolated cloud environment.'),
        t('<b>能动什么</b>：只能说话，还是能改文件、跑命令、点网页。', '<b>What it can touch</b>: only talk, or also edit files, run commands, click web pages.'),
        t('<b>要不要你盯着</b>：每一步都看，还是只看最后的结果。', '<b>How closely you watch</b>: every step, or only the final result.'),
      ],
      how: [
        t('先看任务：要不要动手？多久做一次？能不能检查结果？做错了能不能撤回？', 'Look at the task first: does it need actions? How often? Can the result be checked? Can a mistake be undone?'),
        t('再从“跟它一起干”和“让它自己干”两大类里挑一种；需要新本事就“装扩展”。', 'Then pick from “work alongside it” or “let it run alone”; add an extension when it needs a new ability.'),
      ],
      why: t('底层都是同一个循环：模型想下一步 → 程序执行工具 → 结果再给模型。变的只是外面那层：谁按开始、给它多大权限、谁来把关。', 'Underneath it is always the same loop: the model decides the next step → the program runs a tool → the result goes back to the model. Only the outer layer changes: who presses start, how much access it gets, who checks.'),
      eff: t('用这四个问题看任何新产品，都能很快知道它属于哪一类、该怎么放心地用。', 'With these four questions you can place any new product quickly and know how to use it safely.'),
      lim: t('分类是为了讲清楚，真实产品常常横跨几类（比如对话助手也能跑后台任务）。', 'The categories are for explanation; real products often span several (a chat assistant may also run background tasks).'),
    }),
  },
  uWith: {
    n: { zh: '跟它一起干', en: 'Work alongside it' }, t: 'U', up: 'uHub', zoom: 'Ua', dn: ['loop'],
    pop: (t) => ({
      role: t('你在旁边：它每做一步你都看得见，关键步骤要你点头。', 'You sit beside it: you see every step, and key steps wait for your OK.'),
      tryit: trySess(t),
      does: [
        t('包括：对话助手、编辑器里的编程 Agent、命令行编程 Agent、浏览器 / 电脑操作 Agent。', 'Includes: chat assistants, coding agents in the editor, command-line coding agents, browser / computer-use agents.'),
        t('它在你眼前一圈圈地跑：读、改、试，再把结果给你看。', 'It runs its loop in front of you: read, change, try, then show you the result.'),
      ],
      how: [
        t('目标不太清楚、需要边做边调整的活，适合这一类。', 'Good for work whose goal is still fuzzy and needs adjusting as you go.'),
        t('权限从小开始：先让它“只读 + 每步都问”，熟悉后再放宽。', 'Start with little access: “read-only, ask every step”, then widen it as you learn how it behaves.'),
      ],
      why: t('你在场，错误能在第一步就被拦下，不会一路滚大。', 'With you present, a mistake is caught at the first step instead of snowballing.'),
      eff: t('风险低、反馈快；代价是要占用你的注意力。', 'Low risk and fast feedback; the cost is your attention.'),
      lim: t('你一离开它就停下等你；长任务更适合“让它自己干”。', 'When you leave it stops and waits; long tasks fit “let it run alone” better.'),
    }),
  },
  uSolo: {
    n: { zh: '让它自己干', en: 'Let it run alone' }, t: 'U', up: 'uHub', zoom: 'Ub', dn: ['evalag', 'multi'],
    pop: (t) => ({
      role: t('你把任务交出去，它在隔离环境里独立跑完，你事后看结果。', 'You hand the task over, it runs to the end in an isolated environment, and you review the result afterwards.'),
      does: [
        t('包括：后台 / 云端 Agent、例程与自动化、多 Agent 协作。', 'Includes: background / cloud agents, routines & automation, multi-agent teams.'),
        t('它交回来的是可以检查的东西：一个分支、一份报告、一封草稿。', 'What it hands back can be checked: a branch, a report, a draft.'),
      ],
      how: [
        t('适合：目标清楚、有办法验收、不急着要的活。', 'Good for: clear goals, a way to check the result, no rush.'),
        t('交回来的结果，合并 / 发送之前一定要你审过。', 'Review whatever comes back before it is merged or sent.'),
      ],
      why: t('没人盯着时，安全靠的是“隔离 + 产出可检查 + 不可逆的事留给人”。', 'With nobody watching, safety comes from isolation, checkable output, and leaving irreversible steps to a person.'),
      eff: t('可以同时开很多个，晚上睡觉时也在干活。', 'You can run many at once, even while you sleep.'),
      lim: t('任务说不清、没有测试或验收办法时，它很可能交回一个“看着对、其实错”的结果。', 'If the task is vague or cannot be checked, it may hand back something that looks right but is wrong.'),
    }),
  },
  uKit: {
    n: { zh: '给它装本事', en: 'Extend it' }, t: 'U', up: 'uHub', zoom: 'Uc', dn: ['tools', 'mcp'],
    pop: (t) => ({
      role: t('不换模型，也能让它多会几样：接工具、连 MCP 服务器、装 Skills。', 'Without changing the model you can teach it more: add tools, connect MCP servers, install skills.'),
      tryit: tryCtx(t),
      does: [
        t('<b>工具</b>：让它多一个能做的动作（查、改、发）。', '<b>Tools</b>: give it one more action it can take (look up, change, send).'),
        t('<b>MCP</b>：一个开放协议，让任何应用用同一种方式接上别人做好的工具。', '<b>MCP</b>: an open protocol so any app can plug in tools others have built, the same way.'),
        t('<b>Skills</b>：一包“做法说明 + 可选脚本”，用到时才加载。', '<b>Skills</b>: a pack of “how-to instructions + optional scripts”, loaded only when needed.'),
      ],
      how: [
        t('只装你信得过、真正用得上的；每装一个都想想“它能动什么”。', 'Install only what you trust and really need; for each one ask “what can it touch?”'),
      ],
      why: t('模型的知识和能力是训练时定下的；要它做新的事，最便宜的办法是在外面给它“接手脚”和“递说明书”。', 'A model’s knowledge and abilities are fixed at training time; the cheapest way to make it do new things is to give it hands and manuals from outside.'),
      eff: t('同一个模型，接上不同扩展，就能变成不同岗位的助手。', 'The same model, with different extensions, becomes an assistant for a different job.'),
      lim: t('每个扩展的说明都要占上下文，装太多反而让它挑错工具；扩展也是新的安全入口。', 'Every extension’s description takes context; too many make it pick the wrong tool. Each extension is also a new way in for attacks.'),
    }),
  },
  uWell: {
    n: { zh: '把它用好', en: 'Use it well' }, t: 'U', up: 'uHub', zoom: 'Ud', dn: ['ctx', 'think'],
    pop: (t) => ({
      role: t('同一个 Agent，交代得清不清楚、上下文干不干净，结果差很多。', 'With the same agent, results differ a lot depending on how clearly you brief it and how clean its context is.'),
      tryit: tryPr(t),
      does: [
        t('把任务说清楚：目标、背景、不许做什么、怎样算完成。', 'State the task clearly: goal, background, what not to do, what counts as done.'),
        t('管好上下文：给相关的、去掉无关的；换话题就开新对话。', 'Manage context: give what is relevant, drop what is not; new topic, new chat.'),
        t('先计划后动手；结果自己验证；守住安全习惯。', 'Plan before acting; verify the result yourself; keep safe habits.'),
      ],
      how: [t('在“用得好”这一站有四件事开关的实验，可以亲手比一比。', 'The “Use it well” stop has a lab with the four switches so you can compare yourself.')],
      why: t('模型只能看到你给它的东西，它不知道你脑子里没说出来的要求。', 'The model only sees what you give it; it cannot know requirements you did not say.'),
      eff: t('交代清楚 + 上下文干净，返工次数明显变少。', 'A clear brief and clean context mean far fewer redo rounds.'),
      lim: t('这些是经验做法，不是保证；关键结果仍要你自己核对。', 'These are good practices, not guarantees; still check key results yourself.'),
    }),
  },
  uChat: {
    n: C('use.chat'), t: 'Ua', up: 'uWith', dn: ['loop', 'memory', 'ctxwin'],
    pop: (t) => ({
      role: t('在网页或 App 里一问一答；能力最小、最安全，也是最常见的用法。', 'Ask and answer in a web page or app; the least access, the safest, and the most common use.'),
      tryit: tryPick(t),
      does: [
        t('能说话、写东西、讲解、出主意。', 'Talks, writes, explains, suggests.'),
        t('常带几样工具：联网搜索、跑一小段代码、读你上传的文件。', 'Often has a few tools: web search, running a small piece of code, reading files you upload.'),
        t('有的会记住你跨对话的偏好（“记忆”），通常可以查看和删除。', 'Some remember your preferences across chats (“memory”), which you can usually view and delete.'),
      ],
      how: [
        t('把它当“很能干但会出错的同事”：重要的数字、引用、结论要核对。', 'Treat it as a capable colleague who makes mistakes: check important numbers, sources and conclusions.'),
        t('一个话题一个对话；聊太长时开新对话，把要点贴过去。', 'One topic per chat; when a chat gets very long, start a new one and paste in the key points.'),
      ],
      why: t('它不碰你的电脑和账号，出错最多是“说错话”，所以最适合入门和日常提问。', 'It does not touch your computer or accounts; the worst case is a wrong answer, which makes it the best place to start.'),
      eff: t('不用任何设置，打开就能用。', 'No setup: open it and use it.'),
      lim: t('它看不到你的项目和文件（除非你贴进来）；对话越长，早先的内容越可能被挤出上下文窗口。', 'It cannot see your project or files unless you paste them in; in a long chat, early content may fall out of the context window.'),
    }),
  },
  uIde: {
    n: C('use.ide'), t: 'Ua', up: 'uWith', dn: ['loop', 'tools'],
    pop: (t) => ({
      role: t('住在代码编辑器里：能读你的项目、改文件、跑命令，你看着改动一项项确认。', 'Lives in your code editor: reads your project, edits files, runs commands, while you review and accept each change.'),
      tryit: trySess(t),
      does: [
        t('<b>补全</b>：你打字时，它猜下面几行。', '<b>Completion</b>: as you type, it guesses the next lines.'),
        t('<b>对话</b>：选中代码问它“这段在干嘛”“帮我改成…”。', '<b>Chat</b>: select code and ask “what does this do?” or “change it to…”.'),
        t('<b>Agent 模式</b>：给它一个任务，它自己找文件、改多处、跑测试，最后给你看改动（diff）。', '<b>Agent mode</b>: give it a task; it finds files, edits several places, runs tests, then shows you the changes (a diff).'),
      ],
      how: [
        t('逐个看 diff 再接受；不满意可以回到之前的检查点（很多工具会自动存）。', 'Read each diff before accepting; roll back to an earlier checkpoint if needed (many tools save them automatically).'),
        t('在项目里放一份“规则文件”：代码风格、怎么跑测试、哪些目录别碰，每次都会被读进去。', 'Keep a project rules file: code style, how to run tests, which folders not to touch; it is read in every time.'),
      ],
      why: t('改代码的风险集中在“改了什么”；让每一处改动都以 diff 的形式过你的眼，最省心。', 'The risk in code changes is “what changed”; having every change pass your eyes as a diff is the simplest safeguard.'),
      eff: t('它干体力活，你做判断；有测试的项目效果最好。', 'It does the legwork, you make the calls; works best in projects with tests.'),
      lim: t('它只知道上下文里的东西：项目很大时，可能没读到关键文件就动手了。', 'It only knows what is in its context: in a large project it may start before reading the key file.'),
    }),
  },
  uCli: {
    n: C('use.cli'), t: 'Ua', up: 'uWith', dn: ['perm'],
    pop: (t) => ({
      role: t('在终端里跑的编程 Agent：能读写文件、执行命令、用 git；靠“权限档位”控制它能自己做多少。', 'A coding agent in the terminal: reads and writes files, runs commands, uses git; a permission level decides how much it does on its own.'),
      tryit: trySess(t),
      does: [
        t('和编辑器里的 Agent 本事差不多，但更容易放到远程服务器、脚本和流水线里用。', 'Much like the editor agent, but easier to use on remote servers, in scripts and pipelines.'),
        t('常见三档：<b>每步都问</b> → <b>允许改文件、命令要问</b> → <b>完全自动</b>。', 'Three common levels: <b>ask every step</b> → <b>allow edits, ask before commands</b> → <b>fully automatic</b>.'),
      ],
      how: [
        t('平时用前两档；“完全自动”只在隔离环境（容器、虚拟机、一次性机器）里开。', 'Use the first two levels day to day; turn on “fully automatic” only in isolation (a container, a VM, a throwaway machine).'),
        t('可以给命令设白名单：比如允许跑测试，但删除、推送、联网要问。', 'Allow-list commands: e.g. tests run freely, but delete, push and network access ask first.'),
      ],
      why: t('命令行能做的事几乎没有边界（删文件、改配置、发请求），所以权限是这类工具的核心设计。', 'The command line can do almost anything (delete files, change settings, send requests), so permissions are the core design of these tools.'),
      eff: t('档位让你按信任程度放权：越熟悉的活，放得越开。', 'Levels let you grant access by trust: the more familiar the job, the more you let go.'),
      lim: t('在你的真实电脑上开“完全自动”，一条错误命令就可能造成无法撤回的损失。', 'Fully automatic on your real computer: one wrong command can cause damage you cannot undo.'),
    }),
  },
  uCua: {
    n: C('use.cua'), t: 'Ua', up: 'uWith', dn: ['inject', 'perm'],
    pop: (t) => ({
      role: t('像人一样操作网页或电脑：看截图 / 页面结构，然后点击、输入、滚动。', 'Operates web pages or a computer like a person: looks at screenshots / the page structure, then clicks, types, scrolls.'),
      does: [
        t('每一圈：截图（或读取页面的无障碍结构）→ 模型决定点哪里、输什么 → 程序执行 → 再截图。', 'Each round: take a screenshot (or read the page’s accessibility tree) → the model decides where to click or what to type → the program does it → screenshot again.'),
        t('用在没有接口（API）、只能用界面操作的系统上。', 'Used on systems that have no API and can only be operated through the screen.'),
      ],
      how: [
        t('在隔离的浏览器或虚拟机里跑；尽量不要登录你的重要账号。', 'Run it in an isolated browser or VM; avoid logging in to important accounts.'),
        t('付款、发送、删除之前必须停下来让你确认。', 'Payments, sending and deleting must stop and wait for your confirmation.'),
      ],
      why: t('界面是给人看的，信息多、变化快；让模型一步一看，是没有接口时的通用办法。', 'Screens are made for people and change often; letting the model look before each step is the general fallback when there is no API.'),
      eff: t('几乎什么网站和软件都能操作。', 'It can operate almost any website or program.'),
      lim: t('慢、容易点错；网页上的文字可能藏着“提示词注入”，把它带去做别的事。', 'Slow and error-prone; text on a page may hide a prompt injection that steers it to do something else.'),
    }),
  },
  uBg: {
    n: C('use.bg'), t: 'Ub', up: 'uSolo', dn: ['loop', 'evalag'],
    pop: (t) => ({
      role: t('把任务交给云端：它在一份代码副本里独立干活，最后交回一个分支或合并请求（PR）。', 'Hand the task to the cloud: it works alone on a copy of the code and hands back a branch or a pull request (PR).'),
      does: [
        t('每个任务一个隔离的沙盒：装依赖、改代码、跑测试，都碰不到你的电脑。', 'Each task gets an isolated sandbox: installing, editing, testing never touch your computer.'),
        t('可以同时开好几个，互不干扰。', 'You can run several at once without interference.'),
      ],
      how: [
        t('写清楚：要改什么、怎样算完成（例如“这几个测试要通过”）。', 'Write down what to change and what counts as done (e.g. “these tests must pass”).'),
        t('收到 PR 后像审同事的代码一样审：看 diff、看测试结果，再决定合并。', 'Review the PR as you would a colleague’s: read the diff and test results, then decide whether to merge.'),
      ],
      why: t('“副本 + 分支 + 审查”让它可以放手去试：最坏结果只是你不合并。', '“Copy + branch + review” lets it try freely: the worst case is that you do not merge.'),
      eff: t('把排队的小活批量交出去，你只花审查的时间。', 'Hand off a queue of small jobs; you only spend review time.'),
      lim: t('前提是任务说得清、有测试；需要频繁拍板的活不适合。', 'Needs a clear task and tests; jobs that need frequent decisions do not fit.'),
    }),
  },
  uRoutine: {
    n: C('use.routine'), t: 'Ub', up: 'uSolo', dn: ['perm'],
    pop: (t) => ({
      role: t('不用你开口：到点了或者某件事发生时，Agent 按固定的提示词自动跑一遍。', 'No need to ask: on a schedule or when something happens, the agent runs a fixed prompt automatically.'),
      does: [
        t('触发方式：定时（每天 9 点）或事件（来了新邮件、新的工单、代码有新提交）。', 'Triggers: a schedule (9 am daily) or an event (a new email, a new ticket, a new commit).'),
        t('每次都是“固定提示词 + 固定工具 + 新数据”。', 'Each run is “fixed prompt + fixed tools + new data”.'),
      ],
      how: [
        t('产出要能检查：留日志、写成报告或草稿。', 'Make the output checkable: keep logs, write a report or a draft.'),
        t('不可逆的动作（发出去、删掉、付钱）先只出草稿，人看过再执行。', 'Irreversible actions (sending, deleting, paying) produce a draft first; a person approves before they happen.'),
        t('让它“幂等”：同一件事跑两遍，结果也只算一次（比如先查有没有做过）。', 'Make it idempotent: running twice on the same thing has the effect of once (e.g. check whether it was already done).'),
      ],
      why: t('没有人在旁边，所以必须把“出错时能发现、能撤回”设计进去。', 'Nobody is beside it, so “spot and undo mistakes” has to be designed in.'),
      eff: t('重复的活交出去，你只看结果和例外。', 'Repetitive work runs by itself; you look only at results and exceptions.'),
      lim: t('提示词或数据变了它不会自己察觉；要定期看日志，确认它还在按预期工作。', 'It will not notice if the prompt or data drifts; check the logs regularly.'),
    }),
  },
  uMulti: {
    n: C('use.multi'), t: 'Ub', up: 'uSolo', dn: ['multi', 'orch', 'worker', 'critic'],
    pop: (t) => ({
      role: t('一个“协调者”把大任务拆开，派给几个“执行者”并行做，再由“审查者”把关、汇总。', 'A coordinator splits a big task, sends parts to several workers in parallel, and a reviewer checks and merges the results.'),
      does: [
        t('每个子 Agent 有自己独立的上下文，只看自己那一块。', 'Each sub-agent has its own context and only sees its part.'),
        t('适合能拆成互不依赖的几块的活：比如同时查几个方向的资料。', 'Fits work that splits into independent parts, e.g. researching several directions at once.'),
      ],
      how: [
        t('给每个执行者的任务要写完整：它看不到协调者的对话。', 'Give each worker a complete brief: it cannot see the coordinator’s conversation.'),
        t('最后一定要有一步“汇总 + 核对”。', 'Always end with a “merge and check” step.'),
      ],
      why: t('一个上下文窗口装不下所有材料；拆开后每个子 Agent 的上下文都更干净，还能并行。', 'One context window cannot hold everything; split up, each sub-agent’s context is cleaner, and they run in parallel.'),
      eff: t('大任务更快，各块的质量也更好。', 'Big tasks finish faster, and each part is done better.'),
      lim: t('更费钱（多份上下文、多次调用）；各块互相依赖时，协调成本会吃掉好处。', 'Costs more (several contexts, more calls); when parts depend on each other, coordination eats the benefit.'),
    }),
  },
  uTool: {
    n: { zh: '工具（函数调用）', en: 'Tools (function calling)' }, t: 'Uc', up: 'uKit', dn: ['tools', 'schema', 'toolres'],
    pop: (t) => ({
      role: t('一个工具 = 名字 + 用途说明 + 参数格式；模型按说明书输出 JSON，程序去真正执行。', 'A tool = a name + what it is for + a parameter format; the model writes JSON per the manual and the program actually runs it.'),
      tryit: tryCtx(t),
      does: [
        t('说明书放进上下文，模型才知道有这个工具、该怎么填参数。', 'The manual goes into the context so the model knows the tool exists and how to fill in the parameters.'),
        t('执行结果再变成文字送回模型，它接着想下一步。', 'The result comes back to the model as text, and it decides the next step.'),
      ],
      how: [
        t('名字和说明写清楚、参数尽量少；只读工具和会改东西的工具分开。', 'Clear names and descriptions, few parameters; keep read-only tools apart from tools that change things.'),
      ],
      why: t('模型只会输出文字；约定一种程序能检查的格式，文字就能驱动任何软件。', 'The model only outputs text; agree on a format a program can check, and text can drive any software.'),
      eff: t('参数错了，程序能直接把错误回给模型让它改。', 'If a parameter is wrong, the program sends the error back for the model to fix.'),
      lim: t('工具越多，说明书越占地方，模型越容易选错。', 'More tools mean longer manuals and more wrong picks.'),
    }),
  },
  uMcp: {
    n: { zh: 'MCP（模型上下文协议）', en: 'MCP (Model Context Protocol)' }, t: 'Uc', up: 'uKit', dn: ['mcp', 'mcphost', 'mcpclient', 'mcpserver'],
    pop: (t) => ({
      role: t('2024 年底提出的开放协议：让任何 AI 应用用同一种方式接上别人做好的工具和数据。', 'An open protocol proposed in late 2024: any AI app can plug in tools and data that others have built, in one standard way.'),
      tryit: tryCtx(t),
      does: [
        t('三个角色：<b>宿主</b>（你用的 AI 应用）→ 为每个服务器开一个 <b>客户端</b> → 连到 <b>服务器</b>。', 'Three roles: the <b>host</b> (the AI app you use) → opens one <b>client</b> per server → connected to a <b>server</b>.'),
        t('服务器可以提供三类东西：<b>工具</b>（能做的动作）、<b>资源</b>（能读的数据）、<b>提示模板</b>。', 'A server can offer three kinds of things: <b>tools</b> (actions), <b>resources</b> (data to read) and <b>prompt templates</b>.'),
        t('连接方式：本机用标准输入输出（stdio），远程用 HTTP。', 'Transports: standard input/output (stdio) locally, HTTP for remote servers.'),
      ],
      how: [
        t('在应用的设置里添加服务器，然后在对话里直接用它的工具。', 'Add a server in the app’s settings, then use its tools right in the chat.'),
        t('只连来源可信的服务器；看清它要哪些权限。', 'Connect only servers you trust, and check which permissions they ask for.'),
      ],
      why: t('以前每个应用和每个工具都要单独对接（N×M）；有了统一协议，各做一次就行（N+M）。', 'Before, every app had to integrate every tool separately (N×M); with one protocol, each side does it once (N+M).'),
      eff: t('一个服务器写好，所有支持 MCP 的应用都能用。', 'Write a server once and every MCP-capable app can use it.'),
      lim: t('服务器返回的内容可能带着提示词注入；装一个服务器就等于信任它的代码和它能访问的东西。', 'Server output may carry prompt injections; installing a server means trusting its code and everything it can reach.'),
    }),
  },
  uSkill: {
    n: { zh: 'Skills（技能包）', en: 'Skills (skill packs)' }, t: 'Uc', up: 'uKit', dn: ['tools', 'ctx'],
    pop: (t) => ({
      role: t('一个文件夹：一份“怎么做某类事”的说明（加上可选的脚本和模板）；平时只露出名字和一句话简介。', 'A folder: instructions for “how to do a kind of task” (plus optional scripts and templates); normally only its name and one-line description are shown.'),
      tryit: tryCtx(t),
      does: [
        t('平时：上下文里只放每个技能的名字 + 简介，很省地方。', 'Normally: only each skill’s name and description sit in the context, which takes little room.'),
        t('用到时：Agent 再读入完整说明，需要的话运行里面的脚本。', 'When needed: the agent reads the full instructions and runs the scripts if needed.'),
      ],
      how: [
        t('把你反复交代的做法（报告格式、发布流程）写成技能，以后不用每次重说。', 'Turn instructions you keep repeating (report format, release steps) into a skill so you never re-explain them.'),
        t('里面的脚本会被执行：只装来源可信的。', 'Its scripts get executed: install only skills from trusted sources.'),
      ],
      why: t('工具给的是“手”（能做什么动作），技能给的是“经验”（该怎么做）；按需加载，装很多也不怎么占上下文。', 'Tools give hands (actions); skills give know-how (how to do it). Loaded on demand, many skills take little context.'),
      eff: t('同一套做法可以在团队里复用，结果更一致。', 'The same way of working is reused across a team, so results are more consistent.'),
      lim: t('简介写得不好，Agent 就不知道什么时候该用它；技能不会让模型学会它本来不懂的知识。', 'With a poor description the agent will not know when to use it; a skill does not teach the model things it fundamentally lacks.'),
    }),
  },
  uPrompt: {
    n: { zh: '把任务说清楚', en: 'A clear task brief' }, t: 'Ud', up: 'uWell', dn: ['think', 'ctx'],
    pop: (t) => ({
      role: t('好的委托说清四件事：目标、背景、不许做什么、怎样算完成。', 'A good brief states four things: the goal, the background, what not to do, and what counts as done.'),
      tryit: tryPr(t),
      does: [
        t('<b>目标</b>：要的是什么结果，而不是“弄好一点”。', '<b>Goal</b>: the result you want, not “make it better”.'),
        t('<b>背景</b>：材料在哪、给谁看、已经试过什么。', '<b>Background</b>: where the material is, who it is for, what was tried.'),
        t('<b>约束</b>：哪些不能碰、不能做。', '<b>Constraints</b>: what must not be touched or done.'),
        t('<b>验收标准</b>：它自己怎么检查做对了。', '<b>Acceptance</b>: how it can check that it got it right.'),
      ],
      how: [
        t('给一个例子，往往比写三段要求更管用。', 'One example often works better than three paragraphs of requirements.'),
        t('复杂任务先让它写计划，你看过再动手。', 'For complex tasks, have it write a plan first and approve it before it acts.'),
      ],
      why: t('模型会用“最常见的理解”填补你没说的部分，而那往往不是你想要的。', 'The model fills gaps with the most common interpretation, which is often not what you meant.'),
      eff: t('说清楚一次，省下好几轮返工。', 'Saying it clearly once saves several rounds of redo.'),
      lim: t('写得再好也不能保证结果正确，验收还是要做。', 'Even a perfect brief does not guarantee a correct result; still check it.'),
    }),
  },
  uCtx: {
    n: { zh: '管好上下文', en: 'Managing context' }, t: 'Ud', up: 'uWell', dn: ['ctxwin', 'tokenizer'],
    pop: (t) => ({
      role: t('上下文是一张大小有限的工作台：放相关的，拿走无关的。', 'The context is a workbench of limited size: put on what is relevant, take off what is not.'),
      tryit: tryPr(t),
      does: [
        t('模型每一步只能看到上下文窗口里的东西（按词元计数）。', 'At each step the model only sees what is inside the context window (counted in tokens).'),
        t('研究发现：很多模型对长上下文中间部分的信息利用得更差。', 'Studies found many models make worse use of information in the middle of a long context.'),
      ],
      how: [
        t('一个话题一个对话；聊太久就开新的，带上摘要。', 'One topic per chat; when it runs long, start fresh with a summary.'),
        t('给文件路径或链接，让 Agent 自己去读需要的部分，而不是整份贴进来。', 'Give file paths or links so the agent reads only what it needs, instead of pasting whole files.'),
      ],
      why: t('窗口有上限，而且东西越多，关键信息越容易被淹没。', 'The window has a limit, and the more it holds, the easier key information gets buried.'),
      eff: t('上下文越干净，回答越准、越省钱。', 'Cleaner context means more accurate and cheaper answers.'),
      lim: t('窗口多大、中间内容被忽略得多严重，各模型差别很大。', 'Window sizes and how badly middle content is ignored vary a lot between models.'),
    }),
  },
};

Object.assign(PARTS, R25_PARTS);

/** "up to how it is used" links added to existing T1/T2/T3 parts */
export const USE_LINKS: Record<string, string[]> = {
  user: ['uHub'], loop: ['uHub'], tools: ['uTool'], mcp: ['uMcp'], multi: ['uMulti'], guard: ['uCli', 'uCua', 'uRoutine'],
  perm: ['uCli'], inject: ['uCua'], memory: ['uChat', 'uCtx'], ctxwin: ['uCtx'], evalag: ['uBg'],
  llm: ['aApi', 'lHub'], quant: ['lGguf'], serve: ['lTool'],
};
