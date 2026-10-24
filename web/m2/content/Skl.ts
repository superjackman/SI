/* R26 station Skl · 🧰 "I want to add skills to an AI": tools vs MCP servers vs skill packs vs prompt templates by task,
   a catalogue of real MCP servers and skills (official links, checked 2026-10-25, /workspace/si-r26-sources.md), how an
   install works, and the safety rules. No star counts, prices or licence details; nothing about overseas accounts. */
import { arrow, comp, LEG, Page, svgOpen, type StationOut } from '../lib';
import { src } from './ext/kit';
import { C as CF, jump, mem, one, tb, ti, tryit, ul } from './ext/m11';
import { CHECKED_R26 } from './Job';

type Bi2 = [string, string];
/** the catalogue: category → [name, what it does, official link] */
export const CAT: { k: string; i: string; n: Bi2; e: [string, Bi2, string][] }[] = [
  { k: 'file', i: '📁', n: ['文件和文档', 'Files & documents'], e: [
    ['Filesystem', ['MCP 官方参考服务器：读写你指定的文件夹（只能动列出来的文件夹）。', 'Official reference server: reads and writes the folders you list (and only those).'], 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem'],
    ['Git', ['MCP 官方参考服务器：查看、搜索、操作本地 Git 仓库。', 'Official reference server: read, search and work with a local Git repository.'], 'https://github.com/modelcontextprotocol/servers/tree/main/src/git'],
    ['MarkItDown', ['微软开源：把 Word、PPT、Excel、PDF 等转成 Markdown，带 MCP 服务器。', 'Microsoft open source: turns Word, PowerPoint, Excel, PDF and more into Markdown; includes an MCP server.'], 'https://github.com/microsoft/markitdown'],
  ] },
  { k: 'web', i: '🌐', n: ['网页和浏览器', 'Web pages & browsers'], e: [
    ['Fetch', ['MCP 官方参考服务器：抓取网页内容。官方提醒：它能访问内网地址，有安全风险。', 'Official reference server: fetches web pages. Its README warns it can reach internal network addresses, a security risk.'], 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch'],
    ['Playwright MCP', ['微软：让 Agent 打开网页、点击、填表。', 'Microsoft: lets an agent open pages, click and fill in forms.'], 'https://github.com/microsoft/playwright-mcp'],
    ['Chrome DevTools MCP', ['Chrome 团队：给编程 Agent 用的开发者工具（调试、看性能）。', 'Chrome team: DevTools for coding agents (debugging, performance).'], 'https://github.com/ChromeDevTools/chrome-devtools-mcp'],
  ] },
  { k: 'code', i: '🧑‍💻', n: ['写代码', 'Coding'], e: [
    ['GitHub MCP Server', ['GitHub 官方：查仓库、议题、拉取请求。', 'GitHub’s official server: repositories, issues, pull requests.'], 'https://github.com/github/github-mcp-server'],
    ['Context7', ['Upstash：给 Agent 查最新的编程库文档。', 'Upstash: up-to-date library docs for coding agents.'], 'https://github.com/upstash/context7'],
  ] },
  { k: 'map', i: '🗺️', n: ['地图和出行', 'Maps & travel'], e: [
    ['高德地图 MCP Server', ['地理编码、天气、步行 / 驾车 / 公交路线、周边搜索等；要先申请 Key。', 'Geocoding, weather, walking / driving / transit routes, nearby search; needs a key.'], 'https://lbs.amap.com/api/mcp-server/summary'],
    ['百度地图 MCP', ['百度地图开放平台的 MCP 服务。', 'Baidu Maps open platform’s MCP service.'], 'https://lbsyun.baidu.com/faq/api?title=mcpserver/base'],
  ] },
  { k: 'data', i: '🗄️', n: ['数据和笔记', 'Data & notes'], e: [
    ['MCP Toolbox for Databases', ['Google 开源：让 Agent 查数据库。', 'Google open source: database access for agents.'], 'https://github.com/googleapis/mcp-toolbox'],
    ['Supabase MCP', ['Supabase 官方：管理 Supabase 数据库项目。', 'Supabase’s official server for Supabase projects.'], 'https://github.com/supabase/mcp'],
    ['Notion MCP', ['Notion 官方：读写 Notion 页面。', 'Notion’s official server: read and write Notion pages.'], 'https://github.com/makenotion/notion-mcp-server'],
  ] },
  { k: 'skill', i: '📦', n: ['技能包（Skills）', 'Skill packs (Skills)'], e: [
    ['Agent Skills', ['技能包的开放格式：一个文件夹 + 一份 SKILL.md（写着名字和什么时候用）。', 'The open format for skills: a folder with a SKILL.md (its name and when to use it).'], 'https://agentskills.io'],
    ['anthropics/skills', ['示例技能：做 Word、PDF、PPT、Excel，写新技能、写 MCP 服务器等；仓库说明是用于演示和学习。', 'Example skills: Word, PDF, PowerPoint and Excel files, writing new skills and MCP servers; the repo says it is for demonstration and learning.'], 'https://github.com/anthropics/skills'],
  ] },
  { k: 'find', i: '🔍', n: ['去哪找更多', 'Where to find more'], e: [
    ['MCP Registry', ['MCP 官方目录。', 'The official MCP directory.'], 'https://registry.modelcontextprotocol.io'],
    ['魔搭 MCP 广场', ['魔搭社区（ModelScope）的 MCP 目录。', 'ModelScope’s MCP directory.'], 'https://modelscope.cn/mcp'],
    ['awesome-mcp-servers', ['社区整理的清单：只当线索，装之前回到项目官方页核对。', 'A community list: leads only; check the project’s own page before installing.'], 'https://github.com/punkpeye/awesome-mcp-servers'],
  ] },
];
/** the "which add-on" picker: job → add-on, why, an example from the catalogue */
export const NEED: { k: string; i: string; n: Bi2; a: Bi2; why: Bi2; ex: Bi2 }[] = [
  { k: 'files', i: '📁', n: ['读写电脑里的文件', 'Read and write my files'], a: ['🔌 MCP 服务器', '🔌 MCP server'], why: ['要真的打开你的文件，得有一只“手”。', 'Opening your files needs a “hand”.'], ex: ['Filesystem（只给它一个文件夹）', 'Filesystem (give it one folder)'] },
  { k: 'web', i: '🌐', n: ['打开网页、点按钮', 'Open pages and click'], a: ['🔌 MCP 服务器', '🔌 MCP server'], why: ['要操作浏览器，得接一个会开网页的服务器。', 'Driving a browser needs a server that can open pages.'], ex: ['Playwright MCP', 'Playwright MCP'] },
  { k: 'map', i: '🗺️', n: ['查路线、天气', 'Routes and weather'], a: ['🔌 MCP 服务器', '🔌 MCP server'], why: ['数据在地图公司那里，要通过它们的服务去查。', 'The data lives with the map company; you query their service.'], ex: ['高德地图 MCP Server', 'Amap MCP Server'] },
  { k: 'doc', i: '📄', n: ['按固定格式做 PPT / 表格', 'Slides / sheets in a set format'], a: ['📦 技能包', '📦 Skill pack'], why: ['它缺的是“做法”：步骤、模板、检查清单。', 'What it lacks is the method: steps, templates, a checklist.'], ex: ['anthropics/skills 里的 pptx / xlsx', 'pptx / xlsx in anthropics/skills'] },
  { k: 'tone', i: '💬', n: ['每次用同一套话', 'Same wording every time'], a: ['📝 提示模板', '📝 Prompt template'], why: ['只是每次都要说的那几句话，存成模板复制就行。', 'It is just lines you repeat; save them as a template and paste.'], ex: ['“你是我的周报助手，按三段写……”', '“You are my weekly-report helper; write three parts…”'] },
  { k: 'calc', i: '🧮', n: ['算个数、查个时间', 'Do a sum, check the time'], a: ['🔧 工具', '🔧 Tool'], why: ['一个小函数就够了；很多 Agent 已经自带。', 'One small function is enough; many agents already have it.'], ex: ['Time（MCP 官方参考服务器）', 'Time (official MCP reference server)'] },
];
export const FS_CFG = [
  '{',
  '  "mcpServers": {',
  '    "filesystem": {',
  '      "command": "npx",',
  '      "args": ["-y", "@modelcontextprotocol/server-filesystem",',
  '               "/Users/你的名字/Desktop/给AI的文件夹"]',
  '    }',
  '  }',
  '}',
];

export default function Skl(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  const b = (x: Bi2) => (L === 'en' ? x[1] : x[0]);
  const a = (u: string, n: string) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${n}</a>`;
  const sid = 'svgSkl';
  let svg = svgOpen(sid, 410);
  svg += comp({ id: 'sHub', x: 40, y: 6, w: 300, h: 56, t: t('① 想让它多会一件事', '① You want one more ability'), s: [t('先问：缺“手”还是缺“方法”', 'ask: a hand, or a method?')], cat: 'use' }, L, nm('sHub'));
  svg += arrow(sid, 'M130 62 V80 H96 V94') + arrow(sid, 'M250 62 V80 H284 V94');
  svg += comp({ id: 'uMcp', x: 3, y: 98, w: 182, h: 60, t: t('🔌 缺手：MCP', '🔌 A hand: MCP'), s: [t('读文件、开网页', 'files, web pages')], cat: 'use' }, L, nm('uMcp'));
  svg += comp({ id: 'uSkill', x: 195, y: 98, w: 182, h: 60, t: t('📦 缺方法：技能包', '📦 A method: skills'), s: [t('步骤、模板', 'steps, templates')], cat: 'use' }, L, nm('uSkill'));
  svg += arrow(sid, 'M94 158 V172 H170 V186') + arrow(sid, 'M286 158 V172 H210 V186');
  svg += comp({ id: 'sCat', x: 40, y: 190, w: 300, h: 56, t: t('② 从官方来源找', '② Find it at the source'), s: [t('官方目录、公司自己的仓库', 'official registry, vendor repos')], cat: 'use' }, L, nm('sCat'));
  svg += arrow(sid, 'M190 246 V264');
  svg += comp({ id: 'sPerm', x: 40, y: 268, w: 300, h: 56, t: t('③ 看权限，只给需要的', '③ Grant only what it needs'), s: [t('哪个文件夹、能不能写', 'which folder, read or write')], cat: 'safe' }, L, nm('sPerm'));
  svg += arrow(sid, 'M190 324 V342');
  svg += comp({ id: 'tools', x: 40, y: 346, w: 300, h: 56, t: t('④ 写进配置，先试小事', '④ Add to config, try small'), s: [t('Agent 多了一样新工具', 'the agent gains a tool')], cat: 'agent' }, L, nm('tools'));
  svg += '</svg>';
  const lg = LEG(t);

  P.card('c_Skl_0', 1, t('🧰 给 AI 装技能：缺“手”还是缺“方法”', '🧰 Add skills to an AI: a hand or a method?'), `
<p class="lead">${t('Agent 本来只会“说”。想让它多会一件事，有四种加法：', 'An agent can only talk at first. To teach it one more thing there are four add-ons:')}</p>
${tb([t('加法', 'Add-on'), t('像什么', 'Like'), t('一句话', 'In one line')], [
    [t('🔧 工具', '🔧 Tool'), t('一件小工具', 'a single gadget'), t('一段程序 + 一份说明书，模型按说明“点名”用它', 'a program + a description; the model calls it by name')],
    [t('🔌 MCP 服务器', '🔌 MCP server'), t('插线板', 'a power strip'), t('一套工具按统一标准打包，哪个 Agent 都能插上', 'a set of tools in one standard package any agent can plug in')],
    [t('📦 技能包（Skill）', '📦 Skill pack'), t('一本做法说明', 'a how-to booklet'), t('一个文件夹：步骤、模板、脚本，用到时才读', 'a folder of steps, templates and scripts, read only when needed')],
    [t('📝 提示模板', '📝 Prompt template'), t('一张便签', 'a sticky note'), t('每次都要说的话，存下来复制', 'lines you always say, saved to paste')],
  ])}
${tryit(P, jump(P, 'labSkl', 'Skl', t('🧪 这件事该装哪种', '🧪 Which one for this job'), true), jump(P, 'cfToolMcpSkill', 'Uc', t('工具 vs MCP vs Skills', 'Tools vs MCP vs Skills')), jump(P, 'c_Skl_2', 'Skl', t('真实目录', 'The real catalogue')))}`, { h2: true });

  P.card('c_Skl_1', 2, t('🧭 按要做的事选：用哪种加法', '🧭 Choose by the job: which add-on'), `
${tb([t('你想让它…', 'You want it to…'), t('用', 'Use'), t('例子', 'Example')], NEED.map((n) => [`${n.i} ${b(n.n)}`, b(n.a), b(n.ex)]))}
${mem(P, t('要它“动手碰东西” → MCP；要它“照着做法做” → 技能包；只是“同样的话” → 提示模板。', 'It must touch things → MCP; it must follow a method → a skill pack; it is just the same words → a prompt template.'))}`);

  const catHtml = CAT.map((c) => `<div class="sk-cat" data-cat="${c.k}"><p class="pk-h"><b>${c.i} ${b(c.n)}</b></p><ul class="pk-p">${c.e.map(([n, d, u]) => `<li>${a(u, L === 'en' && n === '高德地图 MCP Server' ? 'Amap MCP Server' : L === 'en' && n === '百度地图 MCP' ? 'Baidu Maps MCP' : L === 'en' && n === '魔搭 MCP 广场' ? 'ModelScope MCP directory' : n)} · ${b(d)}</li>`).join('')}</ul></div>`).join('');
  P.card('c_Skl_2', 2, t('📚 真实的 MCP 服务器和技能包（按用途）', '📚 Real MCP servers and skill packs (by use)'), `
<p>${t(`每一项都链到官方页面或官方仓库，<b>核对于 ${CHECKED_R26}</b>。项目会改名、搬家、停更，装之前点开再看一眼。`, `Every entry links to its official page or repository, <b>checked ${CHECKED_R26}</b>. Projects get renamed, moved or abandoned, so look again before installing.`)}</p>
<div class="sk-cats" id="skCats">${catHtml}</div>
<p class="tag-note">${t('MCP 官方仓库里还有 Everything（测试用）、Memory、Sequential Thinking、Time 等参考服务器；原来的 GitHub、Slack、SQLite 等旧版已移进归档仓库，不再维护。', 'The official MCP repository also has reference servers such as Everything (for testing), Memory, Sequential Thinking and Time; the old GitHub, Slack, SQLite and similar servers moved to an archive repository and are no longer maintained.')}</p>
${src(P, [['https://github.com/modelcontextprotocol/servers', t('MCP 参考服务器', 'MCP reference servers')], ['https://registry.modelcontextprotocol.io', 'MCP Registry']])}`);

  const code = (x: string[]) => `<pre class="u-code"><code>${x.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace('你的名字', L === 'en' ? 'yourname' : '你的名字').replace('给AI的文件夹', L === 'en' ? 'for-ai' : '给AI的文件夹')}</code></pre>`;
  P.card('c_Skl_3', 2, t('🔩 装一个 MCP 服务器：其实是改一段配置', '🔩 Installing an MCP server: really just a config snippet'), `
<p>${t('多数 Agent（编辑器、桌面助手）都有一个“MCP 设置”，填进一段这样的配置：', 'Most agents (editors, desktop assistants) have an “MCP settings” place where you add a snippet like this:')}</p>
${code(FS_CFG)}
${ul([
    t('<code>"filesystem"</code>：你给它起的名字。', '<code>"filesystem"</code>: the name you give it.'),
    t('<code>"command"</code> 和 <code>"args"</code>：Agent 用什么命令把这个服务器跑起来（<code>npx</code> 会自动下载 Node.js 包）。', '<code>"command"</code> and <code>"args"</code>: how the agent starts the server (<code>npx</code> downloads the Node.js package).'),
    t('最后那个路径：<b>只允许它碰的文件夹</b>。只写一个专门给 AI 的文件夹。', 'The last path: <b>the only folder it may touch</b>. List one folder set aside for the AI.'),
    t('技能包更简单：把技能文件夹（里面有 SKILL.md）放进 Agent 说明里写的技能目录。', 'Skill packs are simpler: put the skill folder (with its SKILL.md) in the skills folder your agent’s docs name.'),
  ])}
<p>${t('每个产品放配置的位置不一样，以它自己的文档为准。', 'Each product keeps this config in a different place; follow its own docs.')}</p>
${src(P, [['https://modelcontextprotocol.io/docs/develop/connect-local-servers', t('MCP：连接本地服务器', 'MCP: connect local servers')], ['https://code.visualstudio.com/docs/copilot/customization/mcp-servers', t('VS Code 的 MCP 设置', 'MCP servers in VS Code')], ['https://agentskills.io', 'Agent Skills']])}`);

  P.card('c_Skl_4', 2, t('🛡️ 装之前：权限、来源、密钥', '🛡️ Before installing: access, source, secrets'), `
${tb([t('检查', 'Check'), t('怎么做', 'How')], [
    [t('🔑 权限', '🔑 Access'), t('只给需要的文件夹；只读够用就别给写；打开“动手前先问我”', 'only the folders it needs; read-only if that is enough; switch on “ask before acting”')],
    [t('🏷️ 来源', '🏷️ Source'), t('从官方目录或公司自己的仓库装；名字很像的陌生包不装', 'install from the official registry or the vendor’s repository; skip look-alike unknown packages')],
    [t('🤫 密钥', '🤫 Secrets'), t('服务要的 Key 放环境变量；不贴进对话、不上传到网上', 'keys go in environment variables; never pasted into chats or uploaded')],
    [t('🕳️ 坏指令', '🕳️ Hidden instructions'), t('网页和文件里可能藏着骗 Agent 的话（提示注入）；能上网又能动文件时更要小心', 'pages and files can hide text that tricks the agent (prompt injection); be extra careful when it can both browse and touch files')],
  ])}
${mem(P, t('装一个 MCP 服务器 = 给 Agent 一把钥匙。先看这把钥匙能开哪些门。', 'Installing an MCP server = handing the agent a key. First see which doors it opens.'))}
${tryit(P, jump(P, 'c_Uc_4', 'Uc', t('装之前的清单', 'The pre-install checklist')), jump(P, 'labInj', 'T2', t('🧪 提示词注入', '🧪 Prompt injection')))}
${src(P, [['https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices', t('MCP 安全建议', 'MCP security best practices')]])}`);

  P.card('cfSklMcpSkill', 1, ti(P, 'MCP 服务器 vs 技能包', 'MCP server vs skill pack'),
    one(P, t('MCP 服务器给 Agent 一只<b>手</b>（能碰到外面的东西）；技能包给它一本<b>说明书</b>（知道该怎么做）。很多时候两样一起用：技能包里写着“用某个工具做某一步”。', 'an MCP server gives the agent a <b>hand</b> (it can reach outside things); a skill pack gives it a <b>manual</b> (it knows how). Often they work together: the skill says “use this tool for this step”.'))
    + tb([t('对比', 'Compare'), t('MCP 服务器', 'MCP server'), t('技能包', 'Skill pack')], [
      [t('里面是', 'Contains'), t('一段一直在跑的程序', 'a running program'), t('文字说明 + 模板 + 可选脚本', 'text + templates + optional scripts')],
      [t('给 Agent', 'Gives the agent'), t('新的动作', 'new actions'), t('新的做法', 'new methods')],
      [t('风险在', 'Risk'), t('它能碰到的东西', 'what it can touch'), t('里面的脚本会不会乱来', 'whether its scripts misbehave')],
    ])
    + tryit(P, jump(P, 'cfToolMcpSkill', 'Uc', t('三者完整对比', 'The full three-way comparison'))), CF);

  P.card('cfSklTpl', 1, ti(P, '技能包 vs 提示模板', 'skill pack vs prompt template'),
    one(P, t('提示模板是<b>你</b>每次复制进去的一段话；技能包是放在 Agent 那里、<b>它自己</b>在需要时翻开的说明，还能带模板和脚本。', 'a prompt template is text <b>you</b> paste in each time; a skill pack sits with the agent and <b>it</b> opens it when needed, and it can carry templates and scripts.'))
    + ul([
      t('只用几次、就几句话：提示模板就够。', 'A few uses, a few lines: a template is enough.'),
      t('步骤多、要文件模板、很多人一起用：做成技能包。', 'Many steps, file templates, shared by many people: make a skill pack.'),
    ]), CF);

  P.labDivider();
  P.lab('labSkl', t('这件事该装哪种本事？点一件事看看', 'Which add-on fits? Tap a job'),
    t(`例子都在上面的目录里（核对于 ${CHECKED_R26}）。`, `Every example is in the catalogue above (checked ${CHECKED_R26}).`),
    [t('分清“缺手”和“缺方法”。', 'Tell “needs a hand” from “needs a method”.'), t('知道从哪里找真实的服务器和技能。', 'Know where to find real servers and skills.')],
    `<div class="pk" id="pkSkl" role="group" aria-label="${t('选一件事', 'Pick a job')}">${NEED.map((n, k) => `<button type="button" class="pk-b" data-pk="${n.k}" aria-pressed="${k ? 'false' : 'true'}">${n.i} ${b(n.n)}</button>`).join('')}</div>
<div class="pk-out" id="pkSklOut" aria-live="polite">${NEED.map((n, k) => `<div class="pk-v" data-pv="${n.k}"${k ? ' hidden' : ''}><p class="pk-h">${t('用', 'Use')} <b>${b(n.a)}</b></p><p>${b(n.why)}</p><p>${t('例子：', 'Example: ')}<b>${b(n.ex)}</b></p></div>`).join('')}</div>`,
    [t('点“读写电脑里的文件”和“按固定格式做 PPT”，比比为什么一个是 MCP、一个是技能包', 'Tap “Read and write my files” and “Slides in a set format”: why is one MCP and the other a skill?'),
      t('点“每次用同一套话”，想想你自己有没有这样的话', 'Tap “Same wording every time” and think of lines you repeat')]);

  P.quiz();
  return {
    sub: t('工具、MCP、技能包、提示模板：按事情选，装之前看权限。', 'Tools, MCP, skill packs, prompt templates: choose by job, check access first.'),
    one: t('缺“手”装 MCP 服务器，缺“方法”装技能包；从官方来源装，只给需要的权限。', 'Missing a hand: an MCP server; missing a method: a skill pack; install from official sources with only the access needed.'),
    why: t('装对了，Agent 能连上你的文件和网上的服务；装错了，等于把钥匙交给陌生人。', 'The right add-on connects the agent to your files and services; the wrong one hands your keys to a stranger.'),
    svg, legend: [lg.use as [string, string, string], lg.safe as [string, string, string], lg.agent as [string, string, string]],
  };
}
