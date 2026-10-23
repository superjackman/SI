/* Station Uc · Extend it */
import { arrow, comp, LEG, Page, svgOpen, type StationOut } from '../lib';

export default function Uc(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  const sid = 'svgUc';
  let svg = svgOpen(sid, 288);
  const col = (pid: string, x: number, a: string, b: string, c: string) => comp({ id: pid, x, y: 6, w: 118, h: 76, t: a, s: [b, c], fs: 15, cat: 'use' }, L, nm(pid));
  svg += col('uTool', 3, t('工具', 'Tools'), t('多一个', 'One more'), t('能做的动作', 'action'));
  svg += col('uMcp', 131, 'MCP', t('接上别人', 'Plug in tools'), t('做好的工具', 'others built'));
  svg += col('uSkill', 259, 'Skills', t('一包', 'A pack of'), t('做法说明', 'know-how'));
  svg += arrow(sid, 'M62 82 V128') + arrow(sid, 'M190 82 V128') + arrow(sid, 'M318 82 V128');
  svg += comp({ id: 'ctxwin', x: 3, y: 132, w: 374, h: 60, t: t('原理：上下文窗口', 'How: the context window'), s: [t('它们的说明都要先放进这里', 'Their descriptions must fit in here first')], cat: 'llm' }, L, nm('ctxwin'));
  svg += arrow(sid, 'M190 192 V216');
  svg += comp({ id: 'think', x: 65, y: 220, w: 250, h: 62, t: t('原理：大模型决定', 'How: the LLM decides'), s: [t('读说明，挑一个来用', 'Reads them, picks one')], cat: 'llm' }, L, nm('think'));
  svg += '</svg>';
  const lg = LEG(t);

  P.card('c_Uc_0', 1, t('不换模型，也能多会几样', 'Teach it more without changing the model'), `
<p class="lead">${t('模型会什么，训练时就定了。要它做新的事，最便宜的办法是在外面“递说明书、接手脚”。三种方式：', 'What a model knows is fixed at training time. The cheapest way to make it do new things is to hand it manuals and hands from outside. Three ways:')}</p>
<ul class="pts">
<li>${P.open('uTool')}${t('：给它一个新动作（查库存、发消息）。', ': give it a new action (check stock, send a message).')}</li>
<li>${P.open('uMcp')}${t('：用一个开放协议，接上别人已经做好的一整套工具和数据。', ': plug in whole sets of tools and data others have built, through one open protocol.')}</li>
<li>${P.open('uSkill')}${t('：给它一包“这类事该怎么做”的说明（可带脚本），用到时才读。', ': hand it a pack of “how to do this kind of task” instructions (scripts optional), read only when needed.')}</li>
</ul>
<p>${t(`三者有个共同代价：它们的说明都要放进 ${P.open('ctxwin')}，模型才知道有这些东西可用。`, `All three share one cost: their descriptions must go into the ${P.open('ctxwin')} before the model knows they exist.`)}</p>`, { h2: true });

  P.card('c_Uc_1', 2, t('🔧 工具：一份说明书 + 一段程序', '🔧 Tools: a manual plus a program'), `
<p>${t('一个工具由开发者写好两样东西：给模型看的<b>说明书</b>（名字、用途、参数格式），和真正干活的<b>程序</b>。比如：', 'A tool is two things a developer writes: a <b>manual</b> for the model (name, purpose, parameter format) and the <b>program</b> that does the work. For example:')} ${P.tag()}</p>
<pre class="json u-code">{
  "name": "check_stock",
  "description": "${t('查询某个商品的库存数量', 'Look up the stock count of a product')}",
  "parameters": {
    "type": "object",
    "properties": { "sku": { "type": "string" } },
    "required": ["sku"]
  }
}</pre>
<p>${t(`模型需要时输出 <code>{"name":"check_stock","arguments":{"sku":"A-102"}}</code> 这样的文字，程序检查参数、调用真实接口，再把结果作为文字送回去。细节在 ${P.open('schema')} 和 ${P.open('toolres')}。`, `When needed, the model writes text like <code>{"name":"check_stock","arguments":{"sku":"A-102"}}</code>; the program checks the arguments, calls the real system and sends the result back as text. Details in ${P.open('schema')} and ${P.open('toolres')}.`)}</p>
<p>${t('写好工具的要点：名字一看就懂、说明写清什么时候用、参数尽量少；只读的和会改东西的分开，后者加确认。', 'Good tools: obvious names, a description that says when to use it, few parameters; keep read-only tools apart from ones that change things, and add confirmation to the latter.')}</p>`);

  P.card('c_Uc_2', 2, t('🔌 MCP：工具的“通用插座”', '🔌 MCP: a universal socket for tools'), `
<p>${t('MCP（模型上下文协议）是 2024 年底提出的开放协议。以前每个 AI 应用要单独对接每个工具（N 个应用 × M 个工具）；有了统一协议，应用和工具各实现一次就能互相连上（N + M）。', 'MCP (Model Context Protocol) is an open protocol proposed in late 2024. Before it, each AI app had to integrate each tool separately (N apps × M tools); with one protocol, each side implements it once and they connect (N + M).')}</p>
<ul class="pts">
<li>${t(`<b>三个角色</b>：${P.open('mcphost')}（你在用的 AI 应用）为每个服务器开一个 ${P.open('mcpclient')}，连到 ${P.open('mcpserver')}。`, `<b>Three roles</b>: the ${P.open('mcphost')} (the AI app you use) opens one ${P.open('mcpclient')} per server, connected to an ${P.open('mcpserver')}.`)}</li>
<li>${t('<b>服务器提供三类东西</b>：工具（能做的动作）、资源（能读的数据）、提示模板（现成的用法）。', '<b>A server offers three kinds of things</b>: tools (actions), resources (data to read) and prompts (ready-made templates).')}</li>
<li>${t('<b>两种连法</b>：服务器在本机时用标准输入输出（stdio）；在远程时走 HTTP。', '<b>Two ways to connect</b>: standard input/output (stdio) when the server runs locally; HTTP when it is remote.')}</li>
</ul>
<p>${t(`<b>安全</b>：装一个服务器，就是信任它的代码和它能访问的一切；它返回的内容也可能带着 ${P.open('inject')}。只装来源可信的，看清它要的权限。`, `<b>Safety</b>: installing a server means trusting its code and everything it can reach, and what it returns may carry a ${P.open('inject')}. Install only trusted ones, and check the access they ask for.`)}</p>`);

  P.card('c_Uc_3', 2, t('📦 Skills：按需加载的“做法说明”', '📦 Skills: know-how loaded on demand'), `
<p>${t('一个技能就是一个文件夹：里面一份 SKILL.md 写着“这类事怎么做”，开头有名字和一句话简介；还可以放脚本、模板。', 'A skill is a folder: a SKILL.md file says how to do a kind of task, starting with a name and a one-line description; it may also hold scripts and templates.')}</p>
<ol class="pts">
<li>${t('<b>平时</b>：上下文里只有每个技能的名字 + 简介，几十个词元一条。', '<b>Normally</b>: only each skill’s name and description sit in the context, a few dozen tokens each.')}</li>
<li>${t('<b>用到时</b>：Agent 判断当前任务和某个技能相关，才读入完整说明，需要的话运行里面的脚本。', '<b>When relevant</b>: the agent decides a skill fits the task, then reads the full instructions and runs its scripts if needed.')}</li>
</ol>
<table class="gl stack"><tbody><tr><th></th><th>${t('工具', 'Tool')}</th><th>Skill</th></tr>
<tr><td>${t('给它什么', 'What it adds')}</td><td data-label="${t('工具', 'Tool')}">${t('一个动作（手）', 'An action (hands)')}</td><td data-label="Skill">${t('一套做法（经验）', 'A way of working (know-how)')}</td></tr>
<tr><td>${t('平时占上下文', 'Context when idle')}</td><td data-label="${t('工具', 'Tool')}">${t('完整说明书', 'The full manual')}</td><td data-label="Skill">${t('只有名字 + 简介', 'Name + description only')}</td></tr>
<tr><td>${t('谁执行', 'Who runs it')}</td><td data-label="${t('工具', 'Tool')}">${t('应用程序', 'The app')}</td><td data-label="Skill">${t('Agent 照着做，可调用已有工具', 'The agent follows it, using existing tools')}</td></tr>
</tbody></table>`);

  P.labDivider();
  P.lab('labCtxLoad', t('说明书占了多少上下文？', 'How much context do the manuals take?'), t(`词元数都是${t('示意', 'illustrative')}的整数，真实数字取决于模型和说明的写法。`, `All token counts are illustrative round numbers; real ones depend on the model and how descriptions are written.`),
    [t('每个扩展都要先“自我介绍”，介绍写在上下文里，装得越多越挤。', 'Every extension must introduce itself first, in the context; the more you install, the more crowded it gets.'),
      t('按需加载（先只放名字和一句话，用到再读全文）是 Skills 和不少工具系统省地方的办法。', 'Loading on demand (name and one line first, full text when used) is how skills and many tool systems save room.')],
    `<div class="ctrls">
<label>${t('装了几个扩展', 'Extensions installed')} <select id="clN"><option value="3">3</option><option value="10" selected>10</option><option value="30">30</option></select></label>
<label>${t('加载方式', 'Loading')} <select id="clMode"><option value="all">${t('全部塞进去', 'Put everything in')}</option><option value="lazy">${t('按需加载', 'Load on demand')}</option></select></label>
</div>
<div class="u-bar" id="clBar" role="img"></div>
<div class="u-legend" id="clLeg"></div>
<p class="u-stat" id="clStat" aria-live="polite"></p>
<div class="row" style="gap:6px;margin:6px 0"><button class="btn primary" id="clCall">${t('调用一次工具', 'Call a tool once')}</button><button class="btn" id="clReset">${t('重置', 'Reset')}</button></div>
<pre class="json u-code" id="clOut" hidden></pre>`,
    [t('选 30 个、全部塞进去，看说明书占掉多少', 'Pick 30, put everything in, and see how much the manuals take'),
      t('换成“按需加载”再比一比', 'Switch to “load on demand” and compare'),
      t('按需加载时点“调用一次工具”，看完整说明是什么时候才读进来的', 'With on-demand loading, tap “Call a tool once” and see when the full manual comes in')]);

  P.quiz();
  return {
    sub: t('工具、MCP、Skills：不换模型，多会几样。', 'Tools, MCP, skills: new abilities without a new model.'),
    one: t('工具给它新动作，MCP 让它接上别人做好的工具，Skills 给它按需加载的做法说明。它们的说明都要占上下文。', 'Tools give it new actions, MCP plugs in tools others built, and skills give it know-how loaded on demand. All their descriptions take context.'),
    why: t('改模型又贵又慢；在外面给它说明书和手脚，当天就能用上。', 'Changing the model is slow and costly; manuals and hands from outside work the same day.'),
    svg, legend: [lg.use as [string, string, string], lg.llm as [string, string, string]],
  };
}
