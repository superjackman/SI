/* R26: the parts (popup cards) of the 🤖 Job, 🧰 Skl and 🛠 Bld stations. Facts as in content/Job.ts, Skl.ts, Bld.ts
   (sources: /workspace/si-r26-sources.md, checked 2026-10-25). */
import type { T } from '../lib';
import type { M2Part } from './parts';

const tJob = (t: T): [string, string, string] => ['labJob', 'Job', t('🧪 按事情挑 Agent', '🧪 Pick an agent by task')];
const tSkl = (t: T): [string, string, string] => ['labSkl', 'Skl', t('🧪 这件事该装哪种本事', '🧪 Which add-on fits this job')];
const tBld = (t: T): [string, string, string] => ['labBld', 'Bld', t('🧪 走哪条路搭 Agent', '🧪 Which road to build on')];

export const R26_PARTS: Record<string, M2Part> = {
  jHub: {
    n: { zh: '让 AI 替你干活（总览）', en: 'Let AI do tasks (overview)' }, t: 'Job', up: 'uHub', zoom: 'Job', dn: ['loop', 'tools'],
    pop: (t) => ({
      role: t('先说清要干的事，再挑合适的 Agent，最后检查它交回来的东西。', 'Say what the job is, pick a fitting agent, then check what it hands back.'),
      tryit: tJob(t),
      does: [t('把七类常见的事（写代码、写文档、查资料、做表格、做图视频、定时重复、学习）对上合适的产品。', 'Matches seven common jobs (code, writing, research, spreadsheets, images and video, repeating chores, study) with fitting products.')],
      how: [t('想清事情 → 选“陪你干”还是“自己干” → 选产品 → 给资料和要求 → 检查结果。', 'Name the job → choose “with you” or “on its own” → pick a product → give material and rules → check the result.')],
      why: t('同样叫 AI，能做的事差很多；选对了省一半力气。', 'Things called “AI” differ a lot; the right pick saves half the effort.'),
      eff: t('重复、繁琐、要查很多资料的事最划算。', 'Pays off most on repetitive, fiddly or research-heavy jobs.'),
      lim: t('它会出错，也会编；重要的结果一定要你自己核对。', 'It makes mistakes and can make things up; check anything that matters yourself.'),
    }),
  },
  jPick: {
    n: { zh: '按事情选 Agent', en: 'Pick an agent by task' }, t: 'Job', up: 'jHub', dn: ['plan'],
    pop: (t) => ({
      role: t('同一件事，先决定 AI 是“陪你一步步干”还是“领了任务自己干完”。', 'For one job, first decide: should the AI work step by step with you, or take the task and finish it alone?'),
      tryit: tJob(t),
      does: [t('陪你干：你看着每一步，随时改（编辑器、对话）。自己干：交代清楚后它自己跑，最后交结果（后台、定时任务）。', 'With you: you watch every step and steer (editor, chat). On its own: once briefed it runs and hands back a result (background, scheduled).')],
      how: [t('新手、重要的事：先选陪你干；熟悉了、能检查结果的重复事：再放手。', 'New to it or it matters: start with “with you”; for repeat jobs you can check, let go.')],
      why: t('放手越多，越要事先说清楚、事后检查。', 'The more you let go, the more you must brief first and check after.'),
      eff: t('选对方式，少返工。', 'The right mode means less rework.'),
      lim: t('产品更新很快，同一个产品可能两种都支持。', 'Products change fast; one product may offer both.'),
    }),
  },
  jCheck: {
    n: { zh: '检查它的产出', en: 'Check its output' }, t: 'Job', up: 'jHub', dn: ['guard'],
    pop: (t) => ({
      role: t('AI 交回来的东西，像同学的作业：要你批改了才算数。', 'What the AI hands back is like a classmate’s homework: it counts only after you mark it.'),
      tryit: tJob(t),
      does: [t('代码跑测试；数字对原表；引用点开原文；图片视频看有没有侵权和错字。', 'Run tests on code; compare numbers with the source table; open cited sources; check images and video for errors and rights.')],
      how: [t('先在副本或新分支上让它改；不把密码、身份证号、公司机密发给它。', 'Let it work on a copy or a new branch; never send it passwords, ID numbers or company secrets.')],
      why: t('模型会“一本正经地说错”，而且看起来很像对的。', 'A model can be confidently wrong, and it looks right.'),
      eff: t('检查几分钟，能挡住大部分错误。', 'A few minutes of checking stops most errors.'),
      lim: t('你不懂的领域，很难查出错；这时找懂的人看。', 'In a field you do not know, errors are hard to spot; ask someone who does.'),
    }),
  },
  sHub: {
    n: { zh: '给 AI 装技能（总览）', en: 'Add skills to an AI (overview)' }, t: 'Skl', up: 'uKit', zoom: 'Skl', dn: ['mcp', 'tools'],
    pop: (t) => ({
      role: t('按“要它多会什么”挑四种加法之一：工具、MCP 服务器、技能包、提示模板。', 'Choose one of four add-ons by what you want it to gain: a tool, an MCP server, a skill pack or a prompt template.'),
      tryit: tSkl(t),
      does: [t('工具和 MCP 让它能“动手”（读文件、查地图、开网页）；技能包和提示模板教它“怎么做”。', 'Tools and MCP let it act (read files, look up maps, open pages); skill packs and prompt templates teach it how.')],
      how: [t('找官方来源 → 看要哪些权限 → 照说明装（多数是改一段配置）→ 先用一件小事试。', 'Find the official source → see what access it needs → install as documented (usually a config snippet) → try one small job.')],
      why: t('Agent 本来只会说话，装上这些才能连上你的文件和网上的服务。', 'An agent can only talk until you add these; then it can reach your files and online services.'),
      eff: t('装一次，以后每次都能用。', 'Install once, use every time.'),
      lim: t('装得越多，它能动的东西越多，风险也越大。', 'The more you install, the more it can touch, and the bigger the risk.'),
    }),
  },
  sCat: {
    n: { zh: 'MCP 服务器和技能目录', en: 'Catalogue of MCP servers and skills' }, t: 'Skl', up: 'sHub', dn: ['mcpserver'],
    pop: (t) => ({
      role: t('按用途分好类的真实 MCP 服务器和技能包，每个都带官方链接。', 'Real MCP servers and skill packs sorted by use, each with its official link.'),
      tryit: tSkl(t),
      does: [t('文件、网页、代码仓库、地图、文档、数据库、搜索……一类一类列出来。', 'Files, web pages, code repositories, maps, documents, databases, search: listed by kind.')],
      how: [t('先看官方的：MCP 官方目录（Registry）、各公司自己的仓库；社区清单只当线索。', 'Start from official sources: the MCP Registry and each company’s own repository; community lists are leads only.')],
      why: t('同名的假冒包也有；从官方链接装最稳。', 'Look-alike fake packages exist; installing from the official link is safest.'),
      eff: t('不用自己写，接上就能用。', 'No code to write: plug it in and use it.'),
      lim: t('目录只是核对当天的样子；项目会改名、搬家、停更。', 'The catalogue shows the day it was checked; projects get renamed, moved or abandoned.'),
    }),
  },
  sPerm: {
    n: { zh: '装之前先看权限', en: 'Check access before installing' }, t: 'Skl', up: 'sHub', dn: ['perm', 'inject'],
    pop: (t) => ({
      role: t('装一个 MCP 服务器，等于给 Agent 一把钥匙；先看这把钥匙能开哪些门。', 'Installing an MCP server hands the agent a key; first see which doors it opens.'),
      tryit: tSkl(t),
      does: [t('只给需要的文件夹、只读就别给写、密钥放环境变量、陌生来源不装。', 'Only the folders it needs, read-only unless writing is needed, keys in environment variables, no unknown sources.')],
      how: [t('看说明里的“权限 / 安全”一节；在 Agent 里打开“每次动手前先问我”。', 'Read the “permissions / security” section; switch on “ask me before each action” in the agent.')],
      why: t('网页和文件里可能藏着坏指令（提示注入），会骗 Agent 用你的钥匙干坏事。', 'Web pages and files can hide bad instructions (prompt injection) that trick the agent into misusing your keys.'),
      eff: t('权限越小，出事时损失越小。', 'The smaller the access, the smaller the damage.'),
      lim: t('再小心也不是零风险；重要账号别交给它。', 'Careful is not zero risk; keep important accounts away from it.'),
    }),
  },
  bHub: {
    n: { zh: '自己搭 Agent（总览）', en: 'Build your own agent (overview)' }, t: 'Bld', up: 'app', zoom: 'Bld', dn: ['loop', 'orch'],
    pop: (t) => ({
      role: t('两条路：在平台上拖拖拽拽（无代码 / 低代码），或者写代码（SDK + 工具调用循环）。', 'Two roads: drag and drop on a platform (no-code / low-code), or write code (an SDK plus a tool-calling loop).'),
      tryit: tBld(t),
      does: [t('把“大模型 + 工具 + 循环 + 知识库”拼成一个能替你办事的小程序。', 'Assembles “model + tools + loop + knowledge base” into a small program that gets things done.')],
      how: [t('先用一句话写清它要干什么 → 选路 → 接模型 → 加工具和资料 → 测十个例子 → 发布。', 'Write its job in one sentence → choose a road → connect a model → add tools and material → test ten examples → publish.')],
      why: t('现成产品不合适时，自己搭能刚好贴合你的流程和资料。', 'When ready-made products do not fit, your own build fits your process and data.'),
      eff: t('平台路几小时能跑起来；代码路最灵活。', 'The platform road runs within hours; the code road is the most flexible.'),
      lim: t('要自己负责测试、费用和安全。', 'Testing, cost and safety are now your job.'),
    }),
  },
  bFlow: {
    n: { zh: '无代码 / 低代码平台', en: 'No-code / low-code platforms' }, t: 'Bld', up: 'bHub', dn: ['plan', 'retr'],
    pop: (t) => ({
      role: t('在网页画布上拖“节点”连成流程：模型、知识库、工具、判断，不用写代码。', 'Drag “nodes” on a web canvas into a flow: model, knowledge base, tools, decisions; no code.'),
      tryit: tBld(t),
      does: [t('Dify、扣子、FastGPT、n8n、百度千帆、阿里云百炼都能这样搭，并发布成网页或接口。', 'Dify, Coze, FastGPT, n8n, Baidu Qianfan and Alibaba Cloud Bailian all work this way and publish as a web page or an API.')],
      how: [t('建应用 → 选模型 → 上传资料做知识库 → 加工具 → 预览测试 → 发布。', 'Create an app → pick a model → upload material as a knowledge base → add tools → preview and test → publish.')],
      why: t('最快做出能用的东西，适合先验证想法。', 'The fastest way to something usable; good for testing an idea.'),
      eff: t('Dify、FastGPT、n8n、扣子开源版（Coze Studio）还能装在自己的服务器上。', 'Dify, FastGPT, n8n and the open-source Coze Studio can also run on your own server.'),
      lim: t('平台没有的功能就做不了；搬家到别的平台要重搭。', 'What the platform lacks you cannot do; moving platforms means rebuilding.'),
    }),
  },
  bCode: {
    n: { zh: '写代码搭（SDK + 循环）', en: 'Build in code (SDK + loop)' }, t: 'Bld', up: 'bHub', dn: ['loop', 'schema', 'toolres'],
    pop: (t) => ({
      role: t('用 OpenAI 兼容的 SDK 发请求，自己写“模型要工具 → 程序去执行 → 把结果还给模型”的循环。', 'Send requests with an OpenAI-compatible SDK and write the loop yourself: model asks for a tool → program runs it → result goes back to the model.'),
      tryit: tBld(t),
      does: [t('二三十行代码就能做出最小的 Agent；框架（LangGraph、OpenAI Agents SDK、LlamaIndex）帮你管多步和多 Agent。', 'Twenty or thirty lines make a minimal agent; frameworks (LangGraph, OpenAI Agents SDK, LlamaIndex) handle many steps and many agents.')],
      how: [t('定义工具（名字、说明、参数）→ 发请求带上工具 → 有 tool_calls 就执行、回填 → 没有就输出答案。', 'Define tools (name, description, parameters) → send them with the request → if there are tool_calls, run and return them → otherwise print the answer.')],
      why: t('想完全控制每一步、接自己的系统，就写代码。', 'For full control of every step and your own systems, write code.'),
      eff: t('最灵活；能写测试、记日志、限次数。', 'Most flexible; you can test, log and cap the steps.'),
      lim: t('要会编程；循环要设最多几步，防止一直转、一直花钱。', 'You need to code; cap the loop’s steps so it cannot spin and spend forever.'),
    }),
  },
};
