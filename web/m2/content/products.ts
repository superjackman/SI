/* M3: real products for each way of using agents (station Up). Every name, link and one-line description was checked
   against the official site on 2026-10-23 (see /workspace notes in the R8 report). No prices, free tiers or version
   numbers on purpose: they change too often. office = office-task agent (files, slides, sheets, scheduled jobs) per its official page or, for Doubao Pro, a news report (R10). os = open source or open standard (as the official page says). ne = English-page name (pinyin or translation; the Chinese name stays in brackets). cn = run by a mainland company / mainland site; x = overseas site
   (whether it opens from mainland China was not checked). Edit the data here, then run: npm run m2 */
import type { Bi } from '../lib';

export const VERIFIED = '2026-10-23';
export type Group = 'uChat' | 'uIde' | 'uCli' | 'uCua' | 'uBg' | 'uRoutine' | 'uMulti' | 'uKit' | 'app';
export const GROUPS: Group[] = ['uChat', 'uIde', 'uCli', 'uCua', 'uBg', 'uRoutine', 'uMulti', 'uKit', 'app'];
export interface Product { n: string; ne?: string; v: Bi; g: Group[]; u: string; cn: boolean; d: Bi; os?: boolean; research?: boolean; office?: boolean }
const b = (zh: string, en: string): Bi => ({ zh, en });

export const PRODUCTS: Product[] = [
  /* chat assistants */
  { n: 'ChatGPT', v: b('OpenAI', 'OpenAI'), g: ['uChat'], research: true, u: 'https://chatgpt.com', cn: false, d: b('对话助手。官方帮助页说明：原来的 agent 模式已下线，长的多步任务改用 ChatGPT Work。深度研究会先给出研究计划让你修改，最后交回带引用、可下载的报告。', 'Chat assistant. Its help page says the old agent mode is retired; long multi-step tasks now use ChatGPT Work. Deep research first proposes a plan you can edit, then returns a cited, downloadable report.') },
  { n: 'Claude', v: b('Anthropic', 'Anthropic'), g: ['uChat'], u: 'https://claude.com', cn: false, d: b('对话助手；网页、桌面和手机都能用。', 'Chat assistant on web, desktop and mobile.') },
  { n: 'Gemini', v: b('Google', 'Google'), g: ['uChat'], research: true, u: 'https://gemini.google.com', cn: false, d: b('Google 的 AI 助理：写作、规划、头脑风暴。Deep Research 会先列研究计划，再自动浏览大量网页（可选你的邮箱和云盘），写成多页报告。', 'Google’s AI assistant: writing, planning, brainstorming. Deep Research drafts a research plan, browses many sites (and, if you choose, your mail and Drive) and writes a multi-page report.') },
  { n: 'Grok', v: b('SpaceXSI（原 xAI，2026 年并入 SpaceX）', 'SpaceXSI (formerly xAI, merged into SpaceX in 2026)'), g: ['uChat'], u: 'https://grok.com', cn: false, d: b('对话、生成图片、写代码，并能实时查网页和 X。', 'Chat, images, code, with real-time answers from the web and X.') },
  { n: 'Microsoft Copilot', v: b('微软', 'Microsoft'), g: ['uChat'], u: 'https://copilot.microsoft.com', cn: false, d: b('微软的对话助手：创作、学习、解决问题。', 'Microsoft’s chat assistant for creating, learning and solving problems.') },
  { n: '豆包', ne: 'Doubao', v: b('字节跳动', 'ByteDance'), g: ['uChat', 'uCua'], office: true, u: 'https://www.doubao.com', cn: true, d: b('字节跳动旗下 AI 助手：问答、写作、翻译、编程。据北京日报报道，2026-06-24 上线的专业版有“办公任务模式”：可操作本地电脑和浏览器、调用 Skills、跑定时任务。', 'ByteDance’s AI assistant: Q&A, writing, translation, coding. Per a Beijing Daily report, the Pro version launched 2026-06-24 adds an office-task mode that can operate your computer and browser, use Skills and run scheduled tasks.') },
  { n: '千问', ne: 'Qianwen', v: b('阿里巴巴', 'Alibaba'), g: ['uChat'], u: 'https://www.qianwen.com', cn: true, d: b('阿里官方 AI 助手（原通义 App）：AI 搜索、网页总结、PPT、录音纪要。', 'Alibaba’s official AI assistant: AI search, page summaries, slides, meeting notes.') },
  { n: 'Kimi', v: b('月之暗面', 'Moonshot AI'), g: ['uChat'], research: true, office: true, u: 'https://www.kimi.com', cn: true, d: b('对话助手；官网介绍有智能体集群并行执行任务，侧栏有深度研究、PPT、文档和定时任务。', 'Chat assistant; the site describes swarms of agents running tasks in parallel, and its sidebar offers deep research, slides, documents and scheduled tasks.') },
  { n: 'DeepSeek', v: b('深度求索', 'DeepSeek'), g: ['uChat'], u: 'https://www.deepseek.com', cn: true, os: true, d: b('开源大模型公司；官网可进入对话和 API。', 'Open-weight model maker; the site leads to chat and the API.') },
  { n: '腾讯元宝', ne: 'Tencent Yuanbao', v: b('腾讯', 'Tencent'), g: ['uChat'], u: 'https://yuanbao.tencent.com', cn: true, d: b('腾讯的全能 AI 助手：聊天、写作、搜索、读文档。', 'Tencent’s all-in-one AI assistant: chat, writing, search, documents.') },
  { n: '文心助手', ne: 'Wenxin Assistant', v: b('百度', 'Baidu'), g: ['uChat'], u: 'https://wenxin.baidu.com', cn: true, d: b('百度的 AI 助手（yiyan.baidu.com 现跳转到这里）。', 'Baidu’s AI assistant (yiyan.baidu.com now redirects here).') },
  { n: '智谱清言', ne: 'Zhipu Qingyan', v: b('智谱', 'Zhipu AI'), g: ['uChat'], u: 'https://chatglm.cn', cn: true, d: b('基于 GLM 大模型的助手，官网定位是能调用工具办成事的 Agent。', 'Assistant on GLM models, pitched as an agent that uses tools to get things done.') },
  /* office agents (R10) */
  { n: '千问办公', ne: 'Qianwen Office (QwenWork)', v: b('阿里巴巴', 'Alibaba'), g: ['uCua', 'uRoutine'], office: true, u: 'https://qwenwork.cn', cn: true, d: b('AI 办公平台：数据分析、PPT、视频、网页；有桌面端和网页端，可接钉钉，支持连接器、定时任务和浏览器自动操作。', 'AI office platform: data analysis, slides, video, web pages; desktop and web apps, DingTalk integration, connectors, scheduled tasks and browser automation.') },
  { n: 'WorkBuddy', v: b('腾讯', 'Tencent'), g: ['uCua', 'uBg'], office: true, u: 'https://www.workbuddy.cn', cn: true, d: b('AI 办公工作台：把任务拆开自己执行，读写你授权的文件夹；云端任务关掉客户端也能继续跑。', 'AI office workbench: breaks a task down and carries it out, reading and writing folders you authorise; cloud tasks keep running after you close the app.') },
  { n: '百度搭子', ne: 'DuMate', v: b('百度', 'Baidu'), g: ['uCua'], office: true, u: 'https://www.dumate.cn', cn: true, d: b('桌面办公 Agent：在本地沙箱里干活，按文件夹授权，危险操作要你二次确认。', 'Desktop office agent: works in a local sandbox with folder-level permissions and asks you to confirm risky actions.') },
  /* research */
  { n: 'Perplexity', v: b('Perplexity', 'Perplexity'), g: ['uChat'], research: true, u: 'https://www.perplexity.ai', cn: false, d: b('带来源引用的 AI 搜索问答。', 'AI search answers with cited sources.') },
  { n: 'Gemini Notebook', v: b('Google', 'Google'), g: ['uChat'], research: true, u: 'https://notebook.google.com', cn: false, d: b('原名 NotebookLM，2026-07-16 改名；基于你上传的资料做研究和笔记。', 'Formerly NotebookLM, renamed 2026-07-16; research and notes grounded in your own sources.') },
  { n: 'Elicit', v: b('Elicit', 'Elicit'), g: ['uChat'], research: true, u: 'https://elicit.com', cn: false, d: b('面向研究的 AI：综合论文证据、梳理现状。', 'AI for research: synthesise evidence from papers.') },
  { n: '秘塔AI搜索', ne: 'Metaso AI Search', v: b('秘塔科技', 'Metaso'), g: ['uChat'], research: true, u: 'https://metaso.cn', cn: true, d: b('无广告的 AI 搜索，可上传文件、生成幻灯片。', 'Ad-free AI search; upload files, make slides.') },
  /* editor agents */
  { n: 'Cursor', v: b('Anysphere', 'Anysphere'), g: ['uIde'], u: 'https://cursor.com', cn: false, d: b('以 Agent 为核心的代码编辑器。', 'A code editor built around agents.') },
  { n: 'GitHub Copilot', v: b('GitHub（微软）', 'GitHub (Microsoft)'), g: ['uIde', 'uCli', 'uBg'], u: 'https://github.com/features/copilot', cn: false, d: b('在编辑器、终端、桌面里用；可以从一个 issue 一路做到 PR。', 'Works in the editor, terminal and desktop; can go from an issue to a pull request.') },
  { n: 'Google Antigravity', v: b('Google', 'Google'), g: ['uIde', 'uCli'], u: 'https://antigravity.google', cn: false, d: b('Google 的 Agent 开发平台：有桌面应用、IDE、命令行和 SDK。', 'Google’s agent development platform: a desktop app, an IDE, a CLI and an SDK.') },
  { n: 'Devin Desktop', v: b('Cognition', 'Cognition'), g: ['uIde'], u: 'https://devin.ai/desktop', cn: false, d: b('原 Windsurf（windsurf.com 现跳转到这里）；在编辑器里管理本地和云端 Agent。', 'Formerly Windsurf (windsurf.com redirects here); manage local and cloud agents from the editor.') },
  { n: 'TRAE', v: b('字节跳动', 'ByteDance'), g: ['uIde'], u: 'https://www.trae.cn', cn: true, d: b('AI IDE，有 IDE 模式和 SOLO 模式（AI 主导规划执行）；国际版是 trae.ai。', 'AI IDE with an IDE mode and a SOLO mode where the AI plans and executes; the international site is trae.ai.') },
  { n: '通义灵码', ne: 'Tongyi Lingma', v: b('阿里云', 'Alibaba Cloud'), g: ['uIde'], u: 'https://lingma.aliyun.com', cn: true, d: b('编码助手：代码生成、问答、多文件修改、编程智能体。', 'Coding assistant: generation, Q&A, multi-file edits, a coding agent.') },
  { n: 'Qoder', v: b('阿里巴巴', 'Alibaba'), g: ['uIde'], u: 'https://qoder.com', cn: false, d: b('阿里推出的 Agent 编程平台（自主开发 IDE）。', 'Alibaba’s agentic coding platform (an autonomous-development IDE).') },
  { n: 'CodeBuddy', v: b('腾讯云', 'Tencent Cloud'), g: ['uIde'], u: 'https://www.codebuddy.cn', cn: true, d: b('腾讯云代码助手：基于混元代码模型，对话、补全、诊断。', 'Tencent Cloud’s coding assistant on Hunyuan code models: chat, completion, diagnosis.') },
  { n: 'Cline', v: b('Cline', 'Cline'), g: ['uIde'], u: 'https://cline.bot', cn: false, os: true, d: b('开源编程 Agent：Plan / Act 两种模式，支持 MCP。', 'Open-source coding agent with Plan / Act modes and MCP.') },
  { n: 'Replit', v: b('Replit', 'Replit'), g: ['uIde', 'uBg'], u: 'https://replit.com', cn: false, d: b('在浏览器里做应用：它的 Agent 帮你写代码，内置登录、数据库和托管，可接 100 多种集成。', 'Build apps in the browser: its Agent writes the code, with built-in auth, database and hosting and 100+ integrations.') },
  /* command-line agents */
  { n: 'Claude Code', v: b('Anthropic', 'Anthropic'), g: ['uCli', 'uIde'], u: 'https://claude.com/product/claude-code', cn: false, d: b('在终端和 IDE 里用的编程 Agent：读代码库、改文件、跑命令。', 'Coding agent in the terminal and IDE: reads the codebase, edits files, runs commands.') },
  { n: 'Codex', v: b('OpenAI', 'OpenAI'), g: ['uCli', 'uIde', 'uBg'], u: 'https://openai.com/codex', cn: false, d: b('编程 Agent：命令行、IDE 扩展和云端都能用，包含在 ChatGPT 套餐里。', 'Coding agent in a CLI, an IDE extension and the cloud; included with ChatGPT plans.') },
  { n: 'Gemini CLI', v: b('Google', 'Google'), g: ['uCli'], u: 'https://github.com/google-gemini/gemini-cli', cn: false, os: true, d: b('开源的终端 Agent。', 'Open-source terminal agent.') },
  { n: 'OpenCode', v: b('OpenCode', 'OpenCode'), g: ['uCli'], u: 'https://opencode.ai', cn: false, os: true, d: b('开源编程 Agent。', 'Open-source coding agent.') },
  { n: 'Aider', v: b('Aider', 'Aider'), g: ['uCli'], u: 'https://aider.chat', cn: false, d: b('终端里的 AI 结对编程。', 'AI pair programming in your terminal.') },
  /* computer / browser use */
  { n: 'Claude in Chrome', v: b('Anthropic', 'Anthropic'), g: ['uCua'], u: 'https://claude.com/claude-in-chrome', cn: false, d: b('Chrome 扩展：在你已登录的浏览器里读页面、点击、填表；付费档可用。', 'Chrome extension that reads pages, clicks and fills forms in your signed-in browser; paid plans.') },
  { n: 'Comet', v: b('Perplexity', 'Perplexity'), g: ['uCua'], u: 'https://www.perplexity.ai/comet', cn: false, d: b('带 AI 助手的浏览器，Mac、Windows、iOS、Android。', 'A browser with a built-in AI assistant for Mac, Windows, iOS and Android.') },
  { n: 'Manus', v: b('Butterfly Effect（蝴蝶效应）', 'Butterfly Effect'), g: ['uCua', 'uBg'], u: 'https://manus.im', cn: false, d: b('通用 Agent：不止给答案，还能执行任务、自动化工作流。', 'General agent that goes beyond answers: it carries out tasks and automates workflows.') },
  { n: 'Browser Use', v: b('Browser Use', 'Browser Use'), g: ['uCua'], u: 'https://github.com/browser-use/browser-use', cn: false, os: true, d: b('开源 Python 库，让 Agent 操作浏览器；另有云服务。', 'Open-source Python library for browser agents, plus a cloud service.') },
  { n: 'OpenClaw', v: b('OpenClaw', 'OpenClaw'), g: ['uCua'], u: 'https://openclaw.ai', cn: false, os: true, d: b('跑在你自己电脑上的开源助手，从聊天软件里下指令。', 'Open-source assistant running on your machine, driven from chat apps.') },
  /* background / cloud */
  { n: 'Devin', v: b('Cognition', 'Cognition'), g: ['uBg'], u: 'https://devin.ai', cn: false, d: b('自主软件工程师：云端并行跑多个 Agent。', 'Autonomous software engineer: parallel cloud agents.') },
  /* routines and workflows */
  { n: 'n8n', v: b('n8n', 'n8n'), g: ['uRoutine'], u: 'https://n8n.io', cn: false, d: b('工作流自动化平台，可自部署（fair-code 许可，不算严格意义的开源）。', 'Workflow automation; can be self-hosted (fair-code licence, not strictly open source).') },
  { n: 'Zapier', v: b('Zapier', 'Zapier'), g: ['uRoutine'], u: 'https://zapier.com', cn: false, d: b('连接 9000 多个应用的自动化与 Agent 平台。', 'Automation and agents across 9,000+ apps.') },
  { n: 'Make', v: b('Make', 'Make'), g: ['uRoutine'], u: 'https://www.make.com', cn: false, d: b('可视化的 AI 工作流自动化。', 'Visual AI workflow automation.') },
  /* multi-agent frameworks */
  { n: 'LangGraph', v: b('LangChain', 'LangChain'), g: ['uMulti'], u: 'https://www.langchain.com/langgraph', cn: false, d: b('Agent 编排框架。', 'Agent orchestration framework.') },
  { n: 'CrewAI', v: b('CrewAI', 'CrewAI'), g: ['uMulti'], u: 'https://crewai.com', cn: false, d: b('多 Agent 平台。', 'Multi-agent platform.') },
  { n: 'OpenAI Agents SDK', v: b('OpenAI', 'OpenAI'), g: ['uMulti'], u: 'https://github.com/openai/openai-agents-python', cn: false, os: true, d: b('轻量的多 Agent 工作流框架（Python）。', 'Lightweight multi-agent workflow framework (Python).') },
  { n: 'ADK', v: b('Google', 'Google'), g: ['uMulti'], u: 'https://adk.dev', cn: false, d: b('Agent Development Kit：搭多 Agent 系统。', 'Agent Development Kit for multi-agent systems.') },
  { n: 'Microsoft Agent Framework', v: b('微软', 'Microsoft'), g: ['uMulti'], u: 'https://github.com/microsoft/agent-framework', cn: false, os: true, d: b('构建、编排、部署 Agent 和多 Agent 工作流（Python / .NET）。', 'Build, orchestrate and deploy agents and multi-agent workflows (Python / .NET).') },
  { n: 'AgentScope', v: b('阿里巴巴', 'Alibaba'), g: ['uMulti'], u: 'https://github.com/agentscope-ai/agentscope', cn: false, os: true, d: b('开源 Agent 框架，强调可观察、可理解。', 'Open-source agent framework focused on being observable and understandable.') },
  /* extensions and standards */
  { n: 'MCP', v: b('AAIF（Linux 基金会）', 'AAIF (Linux Foundation)'), g: ['uKit'], u: 'https://modelcontextprotocol.io', cn: false, os: true, d: b('Model Context Protocol：给 Agent 接工具和数据的开放协议。', 'Model Context Protocol: an open protocol for connecting tools and data to agents.') },
  { n: 'Agent Skills', v: b('AAIF（Linux 基金会）', 'AAIF (Linux Foundation)'), g: ['uKit'], u: 'https://agentskills.io', cn: false, os: true, d: b('给 Agent 装新本事的标准格式（技能包）。', 'A standard format for giving agents new skills.') },
  { n: 'AGENTS.md', v: b('AAIF（Linux 基金会）', 'AAIF (Linux Foundation)'), g: ['uKit'], u: 'https://agents.md', cn: false, os: true, d: b('写给编程 Agent 看的项目说明文件（“给 Agent 的 README”）。', 'A project guide file for coding agents (“a README for agents”).') },
  { n: 'A2A', v: b('AAIF（Linux 基金会）', 'AAIF (Linux Foundation)'), g: ['uKit', 'uMulti'], u: 'https://a2a-protocol.org', cn: false, os: true, d: b('Agent 之间互相发现、通信的开放标准，由 Google 发起。', 'Open standard for agents to discover and talk to each other, started by Google.') },
  { n: 'AAIF', v: b('Linux 基金会', 'Linux Foundation'), g: ['uKit'], u: 'https://aaif.io', cn: false, d: b('Agentic AI Foundation：托管 MCP、AGENTS.md、A2A、Agent Skills 等项目的中立基金会。', 'Agentic AI Foundation: neutral home of MCP, AGENTS.md, A2A, Agent Skills and more.') },
  /* build your own agent */
  { n: 'Dify', v: b('LangGenius', 'LangGenius'), g: ['app'], u: 'https://dify.ai', cn: false, d: b('在一张画布上搭 Agent 工作流、知识库和工具；可云上或自部署。', 'Build agent workflows, knowledge pipelines and tools on one canvas; cloud or self-hosted.') },
  { n: '扣子', ne: 'Coze', v: b('字节跳动', 'ByteDance'), g: ['app', 'uChat', 'uBg'], office: true, u: 'https://www.coze.cn', cn: true, d: b('AI 办公助手和智能体开发平台；原“扣子空间”（space.coze.cn 现跳转到这里）。官方文档说明：可在扣子云电脑里运行 Agent，不依赖本机在线；支持 Skills 和 MCP。海外版是 coze.com。', 'AI office assistant and agent-building platform; formerly “Coze Space” (space.coze.cn now redirects here). Its docs say agents can run in a Coze cloud PC without your own computer online, with Skills and MCP. The international site is coze.com.') },
  { n: '阿里云百炼', ne: 'Alibaba Cloud Bailian', v: b('阿里云', 'Alibaba Cloud'), g: ['app'], u: 'https://www.aliyun.com/product/bailian', cn: true, d: b('企业级大模型服务与应用开发平台。', 'Enterprise model service and app-building platform.') },
  { n: '腾讯云智能体开发平台', ne: 'Tencent Cloud Agent Development Platform', v: b('腾讯云', 'Tencent Cloud'), g: ['app'], u: 'https://cloud.tencent.com/product/adp', cn: true, d: b('企业智能体平台：RAG、工作流、多 Agent。', 'Enterprise agent platform: RAG, workflows, multi-agent.') },
  { n: 'Claude Agent SDK', v: b('Anthropic', 'Anthropic'), g: ['app'], u: 'https://code.claude.com/docs/en/agent-sdk/overview', cn: false, d: b('把 Claude Code 当作库来用，搭自己的 Agent。', 'Use Claude Code as a library to build your own agents.') },
  { n: 'Mastra', v: b('Mastra', 'Mastra'), g: ['app'], u: 'https://mastra.ai', cn: false, d: b('TypeScript 的 Agent 框架：记忆、工具、MCP。', 'TypeScript agent framework: memory, tools, MCP.') },
  { n: 'LlamaIndex', v: b('LlamaIndex', 'LlamaIndex'), g: ['app'], u: 'https://www.llamaindex.ai', cn: false, d: b('面向文档的 Agent 与解析工具。', 'Agents and parsing for documents.') },
  { n: 'Qwen-Agent', v: b('阿里巴巴（通义千问团队）', 'Alibaba (Qwen team)'), g: ['app'], u: 'https://github.com/QwenLM/Qwen-Agent', cn: false, os: true, d: b('基于千问模型的 Agent 框架：函数调用、MCP、代码解释器、RAG。', 'Agent framework on Qwen models: function calling, MCP, code interpreter, RAG.') },
];
