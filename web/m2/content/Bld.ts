/* R26 station Bld · 🛠 "I want to build my own agent": road 1 no-code / low-code platforms, road 2 code (an
   OpenAI-compatible SDK + a tool-calling loop, then frameworks), a "which road" picker, the minimal agent loop (links T2)
   and workflow vs agent. Facts checked 2026-10-25 (/workspace/si-r26-sources.md); no prices, stars or licence claims. */
import { arrow, comp, LEG, Page, svgOpen, type StationOut } from '../lib';
import { src } from './ext/kit';
import { C as CF, jump, mem, one, tb, ti, tryit, ul } from './ext/m11';
import { CHECKED_R26 } from './Job';

type Bi2 = [string, string];
/** road 1: platforms [name, en name, what, how you run it, link] */
export const PLAT: [string, string, Bi2, Bi2, string][] = [
  ['扣子', 'Coze', ['字节跳动的智能体平台，拖拽搭建；开源版叫 Coze Studio。', 'ByteDance’s agent platform, built by drag and drop; the open-source edition is Coze Studio.'], ['网页直接用；Coze Studio 可自己部署', 'use it on the web; Coze Studio can be self-hosted'], 'https://www.coze.cn'],
  ['阿里云百炼', 'Alibaba Cloud Model Studio', ['三种应用：智能体（零代码）、工作流（低代码）、高代码应用（Python）。', 'Three app types: agent (no code), workflow (low code), high-code app (Python).'], ['阿里云上直接用', 'on Alibaba Cloud'], 'https://help.aliyun.com/zh/model-studio/application-introduction'],
  ['百度千帆', 'Baidu Qianfan', ['百度的大模型服务及 Agent 开发平台。', 'Baidu’s model service and agent development platform.'], ['百度智能云上直接用', 'on Baidu AI Cloud'], 'https://cloud.baidu.com/doc/qianfan/index.html'],
  ['Dify', 'Dify', ['开源平台：搭智能体、工作流、聊天机器人，发布成网页或 API。', 'Open-source platform for agents, workflows and chatbots, published as web apps or APIs.'], ['Dify Cloud，或用 Docker Compose 自己部署', 'Dify Cloud, or self-host with Docker Compose'], 'https://docs.dify.ai'],
  ['FastGPT', 'FastGPT', ['AI Agent 应用开发平台：知识库问答、可视化工作流、工具调用。', 'An AI agent app platform: knowledge-base Q&A, visual workflows, tool calling.'], ['在线版，或自己部署', 'hosted, or self-hosted'], 'https://doc.fastgpt.cn/zh-CN/guide/getting-started'],
  ['n8n', 'n8n', ['工作流自动化：把几百个应用串起来，中间可以放 AI Agent 节点。', 'Workflow automation linking many apps, with AI agent nodes in the middle.'], ['可自己部署', 'self-hostable'], 'https://docs.n8n.io/build/integrate-ai'],
];
/** road 2: code frameworks [name, what, link] */
export const FW: [string, Bi2, string][] = [
  ['OpenAI Python SDK', ['最基础：自己写循环。很多国内平台兼容这种接口。', 'The basics: write the loop yourself. Many platforms in China accept this interface.'], 'https://github.com/openai/openai-python'],
  ['LangChain / LangGraph', ['常用框架；LangGraph 用“图”来画步骤和分支。', 'A popular framework; LangGraph draws steps and branches as a graph.'], 'https://docs.langchain.com'],
  ['LlamaIndex', ['擅长接自己的资料（RAG）。', 'Strong at connecting your own documents (RAG).'], 'https://github.com/run-llama/llama_index'],
  ['OpenAI Agents SDK', ['智能体、工具、护栏、交接；可以接很多家模型。', 'Agents, tools, guardrails, handoffs; works with many model providers.'], 'https://openai.github.io/openai-agents-python/'],
  ['Qwen-Agent', ['通义千问团队的 Agent 框架。', 'The Qwen team’s agent framework.'], 'https://github.com/QwenLM/Qwen-Agent'],
  ['AgentScope', ['阿里开源的多智能体框架。', 'Alibaba’s open-source multi-agent framework.'], 'https://github.com/agentscope-ai/agentscope'],
  ['MCP SDK', ['把你的工具做成 MCP 服务器，给别的 Agent 用（Python、TypeScript 等）。', 'Turn your tools into an MCP server other agents can use (Python, TypeScript and more).'], 'https://modelcontextprotocol.io/docs/sdk'],
];
/** the "which road" picker */
export const ROAD: { k: string; i: string; n: Bi2; r: Bi2; p: Bi2 }[] = [
  { k: 'fast', i: '⚡', n: ['不会写代码，想今天就做出来', 'No code, want it today'], r: ['🧩 路线一：零代码平台', '🧩 Road 1: no-code platform'], p: ['扣子、阿里云百炼（智能体）、百度千帆', 'Coze, Alibaba Cloud Model Studio (agent), Baidu Qianfan'] },
  { k: 'flow', i: '🔁', n: ['步骤固定，要串好几个应用', 'Fixed steps across several apps'], r: ['🧩 路线一：工作流', '🧩 Road 1: workflow'], p: ['n8n、Dify 工作流、百炼工作流', 'n8n, Dify workflows, Model Studio workflows'] },
  { k: 'own', i: '🏠', n: ['资料只能放在自己的服务器', 'Data must stay on my own server'], r: ['🧩 路线一：自己部署的开源平台', '🧩 Road 1: a self-hosted open-source platform'], p: ['Dify、FastGPT、n8n、Coze Studio', 'Dify, FastGPT, n8n, Coze Studio'] },
  { k: 'code', i: '🧑‍💻', n: ['会写 Python / JavaScript', 'I write Python / JavaScript'], r: ['⌨️ 路线二：写代码', '⌨️ Road 2: code'], p: ['先用 SDK 写下面这个循环，再看要不要 LangGraph、Agents SDK 等框架', 'write the loop below with an SDK first, then decide on LangGraph, the Agents SDK or another framework'] },
  { k: 'share', i: '🔌', n: ['我有工具想给别的 Agent 用', 'I have tools others’ agents should use'], r: ['⌨️ 路线二：写一个 MCP 服务器', '⌨️ Road 2: write an MCP server'], p: ['MCP SDK（Python、TypeScript 等）', 'the MCP SDK (Python, TypeScript and more)'] },
];
export const LOOP_PY = [
  '# pip install openai   ·   BASE_URL / API_KEY / MODEL 从你用的平台文档里抄',
  'import os, json',
  'from openai import OpenAI',
  'ai = OpenAI(base_url=os.environ["BASE_URL"], api_key=os.environ["API_KEY"])',
  '',
  'def get_weather(city):            # 你自己的工具（这里是假数据）',
  '    return city + "：晴，20°C"',
  '',
  'tools = [{"type": "function", "function": {',
  '    "name": "get_weather", "description": "查某个城市的天气",',
  '    "parameters": {"type": "object",',
  '        "properties": {"city": {"type": "string"}}, "required": ["city"]}}}]',
  '',
  'msgs = [{"role": "user", "content": "北京今天要带伞吗？"}]',
  'for step in range(5):             # 最多 5 轮，防止停不下来',
  '    r = ai.chat.completions.create(model=os.environ["MODEL"],',
  '                                   messages=msgs, tools=tools)',
  '    m = r.choices[0].message',
  '    if not m.tool_calls:           # 不要工具了 → 这就是答案',
  '        print(m.content); break',
  '    msgs.append(m)',
  '    for c in m.tool_calls:         # 模型点名的工具，由你的程序来跑',
  '        args = json.loads(c.function.arguments)',
  '        msgs.append({"role": "tool", "tool_call_id": c.id,',
  '                     "content": get_weather(**args)})',
];
const EN: Record<string, string> = {
  '从你用的平台文档里抄': 'copy them from your platform’s docs', '你自己的工具（这里是假数据）': 'your own tool (fake data here)',
  '"：晴，20°C"': '": sunny, 20°C"', '查某个城市的天气': 'Get the weather for a city', '北京今天要带伞吗？': 'Do I need an umbrella in Beijing today?',
  '最多 5 轮，防止停不下来': 'at most 5 rounds so it always stops', '不要工具了 → 这就是答案': 'no tool needed → this is the answer',
  '模型点名的工具，由你的程序来跑': 'your program runs the tool the model asked for',
};

export default function Bld(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  const b = (x: Bi2) => (L === 'en' ? x[1] : x[0]);
  const a = (u: string, n: string) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${n}</a>`;
  const sid = 'svgBld';
  let svg = svgOpen(sid, 412);
  svg += comp({ id: 'user', x: 40, y: 6, w: 300, h: 56, t: t('① 用户提问', '① The user asks'), s: [t('“北京要带伞吗？”', '“Umbrella in Beijing?”')], cat: 'use' }, L, nm('user'));
  svg += arrow(sid, 'M190 62 V80');
  svg += comp({ id: 'llm', x: 40, y: 84, w: 300, h: 56, t: t('② 模型想：要不要用工具？', '② Model: need a tool?'), s: [t('要 → 点名工具；不要 → 回答', 'yes → name a tool; no → answer')], cat: 'llm' }, L, nm('llm'));
  svg += arrow(sid, 'M130 140 V158 H96 V172') + arrow(sid, 'M250 140 V158 H284 V172');
  svg += comp({ id: 'tools', x: 3, y: 176, w: 182, h: 60, t: t('③ 要：程序跑工具', '③ Yes: run the tool'), s: [t('查天气、读文件', 'weather, files')], cat: 'agent' }, L, nm('tools'));
  svg += comp({ id: 'answer', x: 195, y: 176, w: 182, h: 60, t: t('④ 不要：给出答案', '④ No: answer'), s: [t('循环结束', 'the loop ends')], cat: 'use' }, L, nm('answer'));
  svg += arrow(sid, 'M94 236 V254');
  svg += comp({ id: 'toolres', x: 3, y: 258, w: 182, h: 60, t: t('结果交回模型', 'Result to model'), s: [t('再回到第 ② 步', 'back to step ②')], cat: 'agent' }, L, nm('toolres'));
  svg += arrow(sid, 'M94 318 V336');
  svg += comp({ id: 'bHub', x: 3, y: 340, w: 374, h: 66, t: t('你要搭的，就是这个循环', 'What you build is this loop'), s: [t('平台帮你画好，或者自己写', 'a platform draws it, or you code it')], cat: 'use' }, L, nm('bHub'));
  svg += '</svg>';
  const lg = LEG(t);

  P.card('c_Bld_0', 1, t('🛠 自己搭一个 Agent：两条路', '🛠 Build your own agent: two roads'), `
<p class="lead">${t('每个 Agent 里面都是同一个小循环：<b>模型想 → 要工具就跑工具 → 结果交回模型 → 再想</b>，直到能回答。你可以用平台“拖”出这个循环，也可以自己写代码。', 'Every agent runs the same small loop: <b>the model thinks → runs a tool if needed → the result goes back → it thinks again</b>, until it can answer. You can drag this loop together on a platform or write it in code.')}</p>
${tb([t('路线', 'Road'), t('适合谁', 'For'), t('代表', 'Examples')], [
    [t('🧩 一：零代码 / 低代码平台', '🧩 1: no-code / low-code platform'), t('不写代码，拖拽、填表就能做', 'no coding; drag and fill in forms'), t('扣子、阿里云百炼、百度千帆、Dify、FastGPT、n8n', 'Coze, Model Studio, Qianfan, Dify, FastGPT, n8n')],
    [t('⌨️ 二：写代码', '⌨️ 2: code'), t('会一点 Python / JavaScript，要完全自己控制', 'some Python / JavaScript, full control'), t('SDK + 循环；LangGraph、OpenAI Agents SDK、MCP SDK 等', 'SDK + loop; LangGraph, OpenAI Agents SDK, MCP SDK and others')],
  ])}
${tryit(P, jump(P, 'labBld', 'Bld', t('🧪 我该走哪条路', '🧪 Which road for me'), true), jump(P, 'c_T2_1', 'T2', t('一步步看 Agent 循环', 'Step through the agent loop')), jump(P, 'c_Bld_2', 'Bld', t('最小的代码版', 'The smallest code version')))}`, { h2: true });

  P.card('c_Bld_1', 2, t('🧩 路线一：零代码 / 低代码平台', '🧩 Road 1: no-code / low-code platforms'), `
<p>${t(`下面信息来自官网和官方文档，<b>核对于 ${CHECKED_R26}</b>。`, `From the official sites and docs, <b>checked ${CHECKED_R26}</b>.`)}</p>
<table class="gl stack"><thead><tr><th>${t('平台', 'Platform')}</th><th>${t('是什么', 'What')}</th><th>${t('怎么用', 'How to run')}</th></tr></thead><tbody>${PLAT.map(([n, ne, d, h, u]) => `<tr><td data-label="${t('平台', 'Platform')}">${a(u, L === 'en' ? ne : n)}</td><td data-label="${t('是什么', 'What')}">${b(d)}</td><td data-label="${t('怎么用', 'How to run')}">${b(h)}</td></tr>`).join('')}</tbody></table>
<p>${t('通常的步骤：选模型 → 写“它是谁、要做什么” → 加工具或知识库 → 自己试 10 个问题 → 发布成网页、小程序或 API。', 'The usual steps: pick a model → write who it is and what it does → add tools or a knowledge base → try 10 questions yourself → publish as a web page, mini-program or API.')}</p>
${src(P, [['https://github.com/coze-dev/coze-studio', 'Coze Studio'], ['https://dify.ai', 'Dify']])}`);

  const code = LOOP_PY.map((x) => { let y = x; if (L === 'en') for (const [z, e] of Object.entries(EN)) y = y.replace(z, e); return y.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }).join('\n');
  P.card('c_Bld_2', 2, t('⌨️ 路线二：25 行代码的 Agent 循环', '⌨️ Road 2: an agent loop in 25 lines'), `
<p>${t('很多大模型平台都兼容 OpenAI 的接口格式。用它的 Python 包，就能写出最小的 Agent：', 'Many model platforms accept the OpenAI interface format. With its Python package you can write the smallest agent:')}</p>
<pre class="u-code"><code>${code}</code></pre>
${ul([
    t('<code>tools</code>：工具的说明书（名字、做什么、要什么参数）。模型只看说明书，不会自己跑程序。', '<code>tools</code>: the tool’s description (name, purpose, inputs). The model reads it; it never runs code itself.'),
    t('<code>tool_calls</code>：模型说“请帮我调用这个工具”。真正去跑的是你的程序。', '<code>tool_calls</code>: the model asking “please call this tool”. Your program does the running.'),
    t('<code>"role": "tool"</code>：把工具结果交回模型，它再想下一步。', '<code>"role": "tool"</code>: hands the result back so the model can think again.'),
    t('<code>range(5)</code>：给循环设上限，防止它一直转、一直花钱。', '<code>range(5)</code>: a cap so it cannot loop (and spend) forever.'),
  ])}
<p><b>${t('循环写熟了，再看框架：', 'Once the loop makes sense, look at frameworks:')}</b></p>
${tb([t('框架', 'Framework'), t('特点', 'What it is good at')], FW.map(([n, d, u]) => [a(u, n), b(d)]))}
${src(P, [['https://help.aliyun.com/zh/model-studio/qwen-function-calling', t('阿里云百炼：Function Calling', 'Model Studio: function calling')], ['https://docs.bigmodel.cn/cn/guide/capabilities/function-calling', t('智谱：函数调用', 'Zhipu: function calling')]])}`);

  P.card('c_Bld_3', 2, t('✅ 上线前：先给它“考试”', '✅ Before launch: give it an exam'), `
${ul([
    t('<b>准备 10 个真实问题</b>，写下你期望的答案，每次改动后都跑一遍。', '<b>Collect 10 real questions</b> with the answers you expect; rerun them after every change.'),
    t('<b>给步数设上限</b>（像上面的 5 轮），超时就停。', '<b>Cap the steps</b> (like the 5 rounds above) and stop on timeout.'),
    t('<b>记日志</b>：每轮模型说了什么、调了什么工具。出错时能查。', '<b>Keep logs</b>: what the model said and which tools it called each round, so you can debug.'),
    t('<b>设花费上限</b>：每次调用都按 token 收费。', '<b>Set a spending cap</b>: every call is billed by tokens.'),
    t('<b>要它答你自己的资料</b>，用 RAG（先查资料、再回答）。', '<b>To answer from your own documents</b>, use RAG (look things up, then answer).'),
  ])}
${tryit(P, jump(P, 'labCost', 'Api', t('🧪 算算要花多少钱', '🧪 Work out the cost')), jump(P, 'ragCard', 'T2', t('RAG 是什么', 'What RAG is')), jump(P, 'labRag', 'T2', t('🧪 试试 RAG', '🧪 Try RAG')))}`);

  P.card('cfBldFlow', 1, ti(P, '工作流 vs Agent', 'workflow vs agent'),
    one(P, t('<b>工作流</b>是你画好的固定路线：第一步做什么、第二步做什么，每次都一样；<b>Agent</b> 是模型自己决定下一步做什么。', 'a <b>workflow</b> is a fixed route you draw: step one, step two, the same every time; an <b>agent</b> lets the model decide the next step itself.'))
    + tb([t('对比', 'Compare'), t('工作流', 'Workflow'), t('Agent', 'Agent')], [
      [t('谁决定下一步', 'Who picks the next step'), t('你事先画好', 'you, in advance'), t('模型临场决定', 'the model, on the fly')],
      [t('好处', 'Strength'), t('稳定、好检查、省钱', 'predictable, easy to check, cheaper'), t('能应付没想到的情况', 'handles the unexpected')],
      [t('坏处', 'Weakness'), t('遇到新情况就卡住', 'stuck on new cases'), t('可能绕远路、出错、多花钱', 'may wander, err or overspend')],
    ])
    + mem(P, t('步骤能写清楚，就先用工作流；真的需要随机应变，再换 Agent。', 'If you can write the steps down, start with a workflow; switch to an agent only when it must improvise.')), CF);

  P.labDivider();
  P.lab('labBld', t('我该走哪条路？点最像你的一句', 'Which road? Tap the line most like you'),
    t(`平台和框架都链到官方页面（核对于 ${CHECKED_R26}）。`, `Platforms and frameworks link to their official pages (checked ${CHECKED_R26}).`),
    [t('按自己的情况选路线。', 'Choose a road for your situation.'), t('知道每条路先看哪几个产品。', 'Know which products to look at first.')],
    `<div class="pk" id="pkBld" role="group" aria-label="${t('选一句', 'Pick one')}">${ROAD.map((r, k) => `<button type="button" class="pk-b" data-pk="${r.k}" aria-pressed="${k ? 'false' : 'true'}">${r.i} ${b(r.n)}</button>`).join('')}</div>
<div class="pk-out" id="pkBldOut" aria-live="polite">${ROAD.map((r, k) => `<div class="pk-v" data-pv="${r.k}"${k ? ' hidden' : ''}><p class="pk-h">${t('走', 'Take')} <b>${b(r.r)}</b></p><p>${t('先看：', 'Start with: ')}${b(r.p)}</p></div>`).join('')}</div>`,
    [t('点“步骤固定”，再读上面的“工作流 vs Agent”', 'Tap “Fixed steps”, then read “workflow vs agent” above'),
      t('点“会写 Python”，把上面的 25 行代码读一遍', 'Tap “I write Python” and read the 25 lines above')]);

  P.quiz();
  return {
    sub: t('拖拽平台或写代码，搭的都是同一个循环。', 'No-code or code: the same think → tool loop.'),
    one: t('不会代码用平台拖，会代码用 SDK 写循环；步骤固定就用工作流。', 'No code: drag it on a platform; code: write the loop with an SDK; fixed steps: use a workflow.'),
    why: t('懂了这个循环，看任何 Agent 产品都知道它在干什么。', 'Once you know the loop, you understand what any agent product does.'),
    svg, legend: [lg.use as [string, string, string], lg.llm as [string, string, string], lg.agent as [string, string, string]],
  };
}
