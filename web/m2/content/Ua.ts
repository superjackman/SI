/* Station Ua · Work alongside it */
import { arrow, code, comp, LEG, note, Page, svgOpen, zone, type StationOut } from '../lib';

export default function Ua(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  const sid = 'svgUa';
  let svg = svgOpen(sid, 346);
  svg += comp({ id: 'user', x: 95, y: 6, w: 190, h: 52, t: t('你的一句话', 'Your request'), s: [t('你就在旁边', 'You stay right there')], cat: 'io' }, L, nm('user'));
  svg += arrow(sid, 'M190 58 V78');
  svg += zone(3, 82, 374, 150);
  const it = (pid: string, x: number, y: number, a: string, b: string) => comp({ id: pid, x, y, w: 174, h: 62, t: a, s: [b], fs: 14.5, cat: 'use' }, L, nm(pid));
  svg += it('uChat', 11, 90, t('对话助手', 'Chat assistant'), t('一问一答', 'Ask and answer'));
  svg += it('uIde', 195, 90, t('编辑器 Agent', 'Editor agent'), t('看 diff 再接受', 'Accept after the diff'));
  svg += it('uCli', 11, 162, t('命令行 Agent', 'Command-line agent'), t('按档位放权', 'Access by level'));
  svg += it('uCua', 195, 162, t('操作电脑 Agent', 'Computer-use agent'), t('看屏幕，点和输入', 'Sees screen, clicks'));
  svg += arrow(sid, 'M94 232 V272') + arrow(sid, 'M286 232 V272');
  svg += note(190, 258, t('底层都一样', 'Same underneath'));
  svg += comp({ id: 'loop', x: 3, y: 276, w: 182, h: 62, t: t('原理：Agent 循环', 'How: the agent loop'), s: [t('想 → 做 → 看结果', 'Think → act → check')], cat: 'agent' }, L, nm('loop'));
  svg += comp({ id: 'guard', x: 195, y: 276, w: 182, h: 62, t: t('原理：权限与安全', 'How: access & safety'), s: [t('关键步骤要你点头', 'Key steps need your OK')], cat: 'safe' }, L, nm('guard'));
  svg += '</svg>';
  const lg = LEG(t);

  P.card('c_Ua_0', 1, t('跟它一起干：你在场，它动手', 'Work alongside it: you are there, it does the work'), `
<p class="lead">${t('这一类用法的共同点：<b>你开口、你看着、关键步骤你点头</b>。Agent 在你眼前一圈一圈地转，每一圈做了什么都看得见。', 'What these have in common: <b>you start it, you watch, you approve key steps</b>. The agent runs its loop in front of you, and you can see what each round did.')}</p>
<ul class="pts">
<li>${P.open('uChat')}${t('：只说话，最安全。', ': only talks; the safest.')}</li>
<li>${P.open('uIde')}${t('：在你的项目里改代码。', ': edits code in your project.')}</li>
<li>${P.open('uCli')}${t('：在终端里改文件、跑命令。', ': edits files and runs commands in a terminal.')}</li>
<li>${P.open('uCua')}${t('：像人一样操作网页和软件。', ': operates web pages and programs like a person.')}</li>
</ul>
<p>${t(`它们能动的东西从少到多，所以越往下，越要用好 ${P.open('perm')}。原理都在 ${P.go('T2')} 站的 ${P.open('loop')}。`, `They can touch more and more as you go down the list, so ${P.open('perm')} matters more. The principle is the ${P.open('loop')} at the ${P.go('T2')} stop.`)}</p>`, { h2: true });

  P.card('c_Ua_1', 2, `💬 ${code('use.chat', L)}`, `
<p>${t('在网页或 App 里一问一答。它通常带几样内置工具（联网搜索、跑一小段代码、读你上传的文件），但碰不到你的电脑和账号。', 'Ask and answer in a web page or app. It usually has a few built-in tools (web search, running a short piece of code, reading files you upload), but it cannot reach your computer or accounts.')}</p>
<ul class="pts">
<li>${t(`<b>记忆</b>：有的会跨对话记住你的偏好；这和 ${P.open('memory')} 是一回事——先存起来，需要时再取回放进上下文。`, `<b>Memory</b>: some remember your preferences across chats; it is the same idea as ${P.open('memory')}: store it, then fetch it back into the context when needed.`)}</li>
<li>${t(`<b>长对话会“忘”</b>：${P.open('ctxwin')}有上限，聊得太久，早先的内容会被截掉或压缩成摘要。`, `<b>Long chats “forget”</b>: the ${P.open('ctxwin')} has a limit; in a very long chat, early content is cut off or squeezed into a summary.`)}</li>
<li>${t('<b>要核对</b>：重要的数字、引用和结论，自己再查一遍。', '<b>Check it</b>: verify important numbers, sources and conclusions yourself.')}</li>
</ul>`);

  P.card('c_Ua_2', 2, `🧑‍💻 ${code('use.ide', L)}`, `
<p>${t('住在代码编辑器里，能读你的整个项目。常见三种模式，从“它建议”到“它动手”：', 'Lives in your code editor and can read your whole project. Three common modes, from “it suggests” to “it acts”:')}</p>
<ol class="pts">
<li>${t('<b>补全</b>：你打字，它猜接下来几行，按一下键接受。', '<b>Completion</b>: as you type, it guesses the next lines; one key accepts.')}</li>
<li>${t('<b>对话</b>：选中代码问它，回答里的改动你手动应用。', '<b>Chat</b>: select code and ask; you apply the suggested change yourself.')}</li>
<li>${t(`<b>Agent 模式</b>：给一个任务，它自己找文件、改多处、跑测试，最后把所有改动摆成 diff 让你逐个接受或拒绝。`, `<b>Agent mode</b>: give it a task; it finds files, edits several places, runs tests, then lays out all changes as diffs for you to accept or reject one by one.`)}</li>
</ol>
<ul class="pts">
<li>${t('<b>检查点</b>：很多工具会在每次改动前存一份，改坏了能一键回去。', '<b>Checkpoints</b>: many tools save a snapshot before each change, so you can go back in one step.')}</li>
<li>${t('<b>规则文件</b>：在项目里写一份说明（代码风格、怎么跑测试、哪些目录别碰），每次对话都会被读进上下文，不用你每次重复。', '<b>Rules file</b>: a note in the project (code style, how to run tests, which folders not to touch) that is read into the context every time, so you never repeat it.')}</li>
</ul>`);

  P.card('c_Ua_3', 2, `⌨️ ${code('use.cli', L)}`, `
<p>${t('在终端里跑，本事和编辑器里的差不多，但更容易放到远程服务器、脚本和流水线里。因为终端几乎什么都能做，核心设计就是<b>权限档位</b>：', 'Runs in a terminal. Much like the editor agent, but easier to use on remote servers, in scripts and pipelines. Because a terminal can do almost anything, the core design is <b>permission levels</b>:')}</p>
<table class="gl stack"><tbody><tr><th>${t('档位', 'Level')}</th><th>${t('它自己能做', 'Does on its own')}</th><th>${t('适合', 'Good for')}</th></tr>
<tr><td>${t('① 每步都问', '① Ask every step')}</td><td data-label="${t('它自己能做', 'Does on its own')}">${t('只读', 'Read only')}</td><td data-label="${t('适合', 'Good for')}">${t('刚开始用、陌生项目', 'Starting out, unfamiliar projects')}</td></tr>
<tr><td>${t('② 改文件不问，命令要问', '② Edits free, commands ask')}</td><td data-label="${t('它自己能做', 'Does on its own')}">${t('读写文件', 'Read and write files')}</td><td data-label="${t('适合', 'Good for')}">${t('日常开发（文件改动可以用 git 撤回）', 'Daily work (file edits can be undone with git)')}</td></tr>
<tr><td>${t('③ 完全自动', '③ Fully automatic')}</td><td data-label="${t('它自己能做', 'Does on its own')}">${t('一切', 'Everything')}</td><td data-label="${t('适合', 'Good for')}">${t('只在隔离环境里（容器、虚拟机、一次性机器）', 'Only in isolation (a container, a VM, a throwaway machine)')}</td></tr>
</tbody></table>
<p>${t(`这就是 ${P.open('perm')} 的落地：权限给到够用为止，删除、推送、联网这类动作单独设成“要问”。`, `This is ${P.open('perm')} in practice: grant just enough, and set delete, push and network access to “ask” separately.`)}</p>`);

  P.card('c_Ua_4', 2, `🖱️ ${code('use.cua', L)}`, `
<p>${t('没有接口（API）可调用时，就让 Agent 像人一样看屏幕、点鼠标、敲键盘。每一圈：', 'When there is no API to call, the agent looks at the screen and clicks and types like a person. Each round:')}</p>
<ol class="pts">
<li>${t('截一张图（或读取页面的无障碍结构树）放进上下文；', 'take a screenshot (or read the page’s accessibility tree) into the context;')}</li>
<li>${t('模型决定下一步：点哪里、输入什么；', 'the model decides the next step: where to click, what to type;')}</li>
<li>${t('程序执行这个动作，再截图，看结果对不对。', 'the program performs it, takes another screenshot and checks the result.')}</li>
</ol>
<p>${t(`风险在于：网页上的文字会进入上下文，里面可能藏着 ${P.open('inject')}（“忽略之前的指示，去把…发给…”）。所以要在隔离的浏览器或虚拟机里跑，付款、发送、删除前停下来让你确认。`, `The risk: text on a page goes into the context and may hide a ${P.open('inject')} (“ignore your instructions and send … to …”). So run it in an isolated browser or VM, and have it stop for your confirmation before paying, sending or deleting.`)}</p>`);

  P.labDivider();
  P.lab('labSession', t('一次编程会话：看它一圈圈改代码', 'A coding session: watch it fix code round by round'), t(`脚本是写好的（${code('use.demo', L)}），步骤对应 Agent 循环的 ①–⑥；测试数字是编的。`, `The script is pre-written (${code('use.demo', L)}); steps map to the agent loop ①–⑥; the test numbers are made up.`),
    [t('一起干的关键是“你在场”：权限档位决定它哪些步骤要停下来等你。', 'Working alongside means you are present: the permission level decides which steps stop and wait for you.'),
      t('“跑测试”是它自己检查结果的办法；不跑测试，它可能带着 bug 说“完成了”。', 'Running tests is how it checks its own work; without them it may report “done” with a bug still in place.')],
    `<div class="ctrls">
<label>${t('权限档位', 'Permission level')} <select id="ssPerm"><option value="ask">${t('① 每步都问', '① Ask every step')}</option><option value="edit" selected>${t('② 改文件不问，命令要问', '② Edits free, commands ask')}</option><option value="auto">${t('③ 完全自动', '③ Fully automatic')}</option></select></label>
<label><input type="checkbox" id="ssTest" checked> ${t('让它跑测试', 'Let it run tests')}</label>
</div>
<p class="u-task">${t('任务：“下单时数量是 0 会报 500 错误，改成返回 400，并补一个测试。”', 'Task: “An order with quantity 0 returns a 500 error; make it return 400, and add a test.”')}</p>
<div class="u-warn" id="ssWarn" hidden>${t('⚠️ 完全自动只应在隔离环境里开：这里是演示，没关系；在你的真实电脑上，一条错误命令可能无法撤回。', '⚠️ Fully automatic belongs only in isolation: fine in this demo, but on your real computer one wrong command may be impossible to undo.')}</div>
<div class="row" style="gap:6px;margin:6px 0"><button class="btn primary" id="ssNext">${t('下一步 ▶', 'Next ▶')}</button><button class="btn" id="ssAuto">${t('自动运行', 'Auto-run')}</button><button class="btn" id="ssReset">${t('重置', 'Reset')}</button></div>
<div class="u-ask" id="ssAsk" hidden><span id="ssAskT"></span> <button class="btn primary" id="ssYes">${t('允许', 'Allow')}</button><button class="btn" id="ssNo">${t('拒绝', 'Reject')}</button></div>
<ol class="u-log" id="ssLog" aria-live="polite"></ol>
<p class="u-stat" id="ssStat"></p>`,
    [t('把档位换成“每步都问”，数一数你要点几次“允许”', 'Switch to “ask every step” and count how many times you tap “Allow”'),
      t('取消“让它跑测试”，看它是不是太早说“完成了”', 'Untick “Let it run tests” and see whether it says “done” too early'),
      t('在“运行测试”那一步点“拒绝”，看它怎么收尾', 'Tap “Reject” at the “run tests” step and see how it wraps up')]);

  P.quiz();
  return {
    sub: t('你在旁边看着，它一步步动手。', 'You watch; it does the work step by step.'),
    one: t('对话助手、编辑器里的编程 Agent、命令行 Agent、操作电脑的 Agent：你开口、你看着、关键步骤你点头。', 'Chat assistants, coding agents in the editor, command-line agents and computer-use agents: you start it, you watch, you approve key steps.'),
    why: t('目标还在变、需要你随时拍板的活，最适合“一起干”：错误在第一步就能被你拦下。', 'Work whose goal is still moving and needs your decisions fits “alongside” best: you catch a mistake at the first step.'),
    svg, legend: [lg.use as [string, string, string], lg.agent as [string, string, string], lg.safe as [string, string, string]],
  };
}
