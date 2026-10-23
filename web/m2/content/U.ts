/* Station U · Using agents (overview) */
import { arrow, code, comp, LEG, note, Page, svgOpen, zone, type StationOut } from '../lib';

export default function U(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  /* ---------- diagram: hub → two families (columns) → two cross-cutting hubs → principle (T1 app) ---------- */
  const id = 'U';
  const col = (x: number, y0: number, items: [string, string, string][]) => items.map(([pid, a, b], i) => comp({ id: pid, x, y: y0 + i * 58, w: 166, h: 50, t: a, s: [b], fs: 14.5, cat: 'use' }, L, nm(pid))).join('');
  let svg = svgOpen('svg' + id, 572);
  svg += zone(3, 152, 182, 236) + zone(195, 152, 182, 236);
  svg += comp({ id: 'uHub', x: 95, y: 6, w: 190, h: 56, t: t('怎么用 Agent', 'Using agents'), s: [t('同一个 Agent，多种用法', 'One agent, many ways')], cat: 'use' }, L, nm('uHub'));
  svg += arrow('svg' + id, 'M170 62 V74 H94 V84') + arrow('svg' + id, 'M210 62 V74 H286 V84');
  svg += comp({ id: 'uWith', x: 3, y: 88, w: 182, h: 58, t: t('跟它一起干', 'Work alongside it'), s: [t('你在旁边，逐步确认', 'You watch each step')], zoom: true, cat: 'use' }, L, nm('uWith'));
  svg += comp({ id: 'uSolo', x: 195, y: 88, w: 182, h: 58, t: t('让它自己干', 'Let it run alone'), s: [t('交出去，事后验收', 'Hand off, check later')], zoom: true, cat: 'use' }, L, nm('uSolo'));
  svg += col(11, 160, [
    ['uChat', t('对话助手', 'Chat assistant'), t('一问一答，最安全', 'Ask & answer; safest')],
    ['uIde', t('编辑器 Agent', 'Editor agent'), t('看 diff，逐个接受', 'Review each diff')],
    ['uCli', t('命令行 Agent', 'Command-line agent'), t('终端里跑，按档放权', 'Access by level')],
    ['uCua', t('操作电脑 Agent', 'Computer-use agent'), t('看屏幕，点和输入', 'Sees screen, clicks')],
  ]);
  svg += col(203, 160, [
    ['uBg', t('后台 / 云端 Agent', 'Background agent'), t('沙盒里干，交回 PR', 'Sandbox; returns a PR')],
    ['uRoutine', t('例程与自动化', 'Routines'), t('定时或事件触发', 'On a schedule or event')],
    ['uMulti', t('多 Agent 协作', 'Multi-agent team'), t('拆开并行，再汇总', 'Split, run, merge')],
  ]);
  svg += note(286, 352, t('下面两件，', 'The two below')) + note(286, 370, t('两边都用得上 ↓', 'serve both sides ↓'));
  svg += comp({ id: 'uKit', x: 3, y: 404, w: 182, h: 58, t: t('给它装本事', 'Extend it'), s: [t('工具 · MCP · Skills', 'Tools · MCP · skills')], zoom: true, cat: 'use' }, L, nm('uKit'));
  svg += comp({ id: 'uWell', x: 195, y: 404, w: 182, h: 58, t: t('用得好', 'Use it well'), s: [t('说清楚 · 管上下文', 'Clear brief · context')], zoom: true, cat: 'use' }, L, nm('uWell'));
  svg += arrow('svg' + id, 'M94 462 V478 H178 V496') + arrow('svg' + id, 'M286 462 V478 H202 V496');
  svg += comp({ id: 'app', x: 65, y: 500, w: 250, h: 62, t: t('原理：Agent 应用层', 'How it works: agent app'), s: [t('大模型 + 工具 + 循环', 'LLM + tools + loop')], zoom: true, cat: 'agent' }, L, nm('app'));
  svg += '</svg>';
  const lg = LEG(t);

  /* ---------- cards ---------- */
  P.card('c_U_0', 1, t('同一个 Agent，为什么有这么多种用法？', 'One agent: why so many ways to use it?'), `
<p class="lead">${t(`所有用法的底层都是同一个东西：${P.open('app', 'Agent')} = 大模型 + 工具 + ${P.open('loop', '循环')}。区别只在外面这一层的四件事：`, `Underneath, every way of using it is the same thing: an ${P.open('app', 'agent')} = LLM + tools + a ${P.open('loop', 'loop')}. The difference is only four things in the outer layer:`)}</p>
<ul class="pts">
<li><b>${code('use.col.trigger', L)}</b>${t('：你开口，还是定时器 / 事件 / 别的 Agent。', ': you, or a timer / an event / another agent.')}</li>
<li><b>${code('use.col.where', L)}</b>${t('：网页里、你的电脑上，还是云端的隔离环境。', ': a web page, your computer, or an isolated cloud environment.')}</li>
<li><b>${code('use.col.can', L)}</b>${t('：只能说话，还是能改文件、跑命令、点网页、发消息。', ': only talk, or also edit files, run commands, click pages, send messages.')}</li>
<li><b>${code('use.col.you', L)}</b>${t('：每一步都看（一起干），还是只验收结果（自己干）。', ': watch every step (alongside), or only check the result (alone).')}</li>
</ul>
<p>${t(`点图里的方块看每种用法；带 🔍 的可以往下钻到子站。最下面的 ${P.open('app')} 连到“原理”那一侧：${P.go('T2')} 站讲它内部怎么转。`, `Tap a box in the diagram to see each one; boxes with 🔍 lead down to a sub-stop. The ${P.open('app')} box at the bottom links to the “how it works” side: the ${P.go('T2')} stop shows how it runs inside.`)}</p>`, { h2: true });

  const rows: [string, string, string, string, string, string][] = [
    ['uChat', 'use.chat', t('你', 'You'), t('网页 / App', 'Web / app'), t('说话；少量内置工具', 'Talk; a few built-in tools'), t('每句都看', 'Read every reply')],
    ['uIde', 'use.ide', t('你', 'You'), t('你的电脑（编辑器）', 'Your computer (editor)'), t('读写项目文件、跑命令', 'Read/write project files, run commands'), t('看 diff 再接受', 'Review diffs, then accept')],
    ['uCli', 'use.cli', t('你（或脚本）', 'You (or a script)'), t('终端：本机或远程', 'Terminal: local or remote'), t('文件、命令、git', 'Files, commands, git'), t('设权限档位，关键步确认', 'Set the permission level, confirm key steps')],
    ['uCua', 'use.cua', t('你', 'You'), t('隔离的浏览器 / 虚拟机', 'An isolated browser / VM'), t('点击、输入、滚动', 'Click, type, scroll'), t('盯着，付款发送前确认', 'Watch; confirm before paying or sending')],
    ['uBg', 'use.bg', t('你交出任务', 'You hand off a task'), t('云端沙盒', 'A cloud sandbox'), t('一份代码副本', 'A copy of the code'), t('审 PR 再合并', 'Review the PR, then merge')],
    ['uRoutine', 'use.routine', t('定时器 / 事件', 'A timer / an event'), t('云端或服务器', 'Cloud or a server'), t('事先给定的工具', 'Tools fixed in advance'), t('看报告和例外', 'Read reports and exceptions')],
    ['uMulti', 'use.multi', t('协调者 Agent', 'A coordinator agent'), t('多个独立上下文', 'Several separate contexts'), t('各自分到的那块', 'Each its own part'), t('看汇总结果', 'Check the merged result')],
    ['uKit', 'use.skill', t('（给上面任何一种加）', '(added to any of the above)'), t('同上', 'Same as above'), t('新的动作和做法', 'New actions and know-how'), t('只装可信的', 'Install only trusted ones')],
  ];
  const th = ['use.col.name', 'use.col.trigger', 'use.col.where', 'use.col.can', 'use.col.you'] as const;
  const head = `<tr>${th.map((k) => `<th>${code(k, L)}</th>`).join('')}</tr>`;
  const body = rows.map(([pid, k, a, b, c, d]) => `<tr><td><a data-open="${pid}">${code(k as 'use.chat', L)}</a></td><td data-label="${code('use.col.trigger', L)}">${a}</td><td data-label="${code('use.col.where', L)}">${b}</td><td data-label="${code('use.col.can', L)}">${c}</td><td data-label="${code('use.col.you', L)}">${d}</td></tr>`).join('');
  P.card('c_U_1', 2, t('八种用法，一张表看懂', 'Eight ways to use it, in one table'), `
<p>${t('按上面四件事，把常见用法排一排（点名字看详情）：', 'The common ways, laid out by the four things above (tap a name for details):')}</p>
<table class="gl stack u-tab"><tbody>${head}${body}</tbody></table>`);

  P.card('c_U_2', 2, t('怎么选：先问任务四个问题', 'How to choose: four questions about the task'), `
<ol class="pts">
<li>${t('<b>要不要动手？</b>只是问问题、写段文字 → 对话助手就够了。', '<b>Does it need to act?</b> Just asking or writing → a chat assistant is enough.')}</li>
<li>${t('<b>目标清不清楚、能不能验收？</b>清楚且有测试 → 可以交给后台 Agent；还要边做边改 → 跟它一起干。', '<b>Is the goal clear and checkable?</b> Clear with tests → hand it to a background agent; still taking shape → work alongside it.')}</li>
<li>${t('<b>是不是反复要做？</b>每天 / 每次有新数据都要做 → 写成例程。', '<b>Does it repeat?</b> Every day / whenever new data arrives → make it a routine.')}</li>
<li>${t('<b>做错了能不能撤回？</b>发出去、删掉、付钱这类不可逆的事 → 一定留一步人工确认。', '<b>Can a mistake be undone?</b> Sending, deleting, paying are irreversible → always keep a human confirmation step.')}</li>
</ol>
<p>${t('下面的实验把这四个问题做成了勾选框，可以看看不同任务会落到哪种用法。', 'The lab below turns these questions into checkboxes so you can see where different tasks land.')}</p>`);

  P.labDivider();
  P.lab('labPick', t('帮我选用法：勾选任务特点，看推荐', 'Pick a way: tick the task’s traits, see the advice'), t(`规则是简化的教学版（${code('use.demo', L)}），真实选择还要看你手上有什么工具。`, `The rules are a simplified teaching version (${code('use.demo', L)}); real choices also depend on the tools you have.`),
    [t('先看任务，再挑工具：同一个 Agent，用错了方式，要么太慢，要么太冒险。', 'Look at the task before picking the tool: the same agent used the wrong way is either too slow or too risky.'),
      t('“有风险”这一项会改变答案：不可逆的动作永远要留一步人工确认。', 'The “risky” trait changes the answer: irreversible actions always keep a human confirmation step.')],
    `<div class="ctrls" id="pkPre" role="group" aria-label="${t('示例任务', 'Example tasks')}"></div>
<div class="u-checks" id="pkFeat" role="group" aria-label="${t('任务特点', 'Task traits')}"></div>
<div class="u-out" id="pkOut" aria-live="polite"></div>`,
    [t('点“周报”示例，再勾上“有风险”，看推荐怎么变', 'Tap the “weekly report” example, then tick “risky” and watch the advice change'),
      t('只勾“要改代码”和“清楚、可验收、不急”，看它推荐哪种', 'Tick only “edits code” and “clear, checkable, not urgent”; see what it recommends')]);

  P.card('c_U_3', 2, t('🧠 底层逻辑：权限 × 监督', '🧠 The logic underneath: access × oversight'), `
<p>${t('所有用法其实都在同一张图上找位置：横轴是<b>给它多大权限</b>，纵轴是<b>你盯得多紧</b>。权限越大，越需要监督或隔离。', 'Every way of using it sits on one chart: across is <b>how much access it gets</b>, up is <b>how closely you watch</b>. The more access, the more oversight or isolation it needs.')}</p>
<ul class="pts">
<li>${t(`<b>可逆 vs 不可逆</b>：改了文件可以撤回（git、检查点）；发出去的邮件、删掉的数据、付掉的钱撤不回。不可逆的那一步留给人，见 ${P.open('perm')}。`, `<b>Reversible vs irreversible</b>: file edits can be undone (git, checkpoints); a sent email, deleted data or a payment cannot. Leave the irreversible step to a person; see ${P.open('perm')}.`)}</li>
<li>${t('<b>最小权限</b>：只给完成这件事需要的权限，任务结束就收回。', '<b>Least privilege</b>: grant only what the task needs, and take it back afterwards.')}</li>
<li>${t(`<b>小错会累积</b>：假设每一步有 95% 的把握，连续 20 步全对的概率只有 0.95²⁰ ≈ 36% ${P.tag()}。所以长任务要有中途检查（测试、确认），见 ${P.open('guard')}。`, `<b>Small errors add up</b>: if each step is 95% reliable, all 20 steps go right only 0.95²⁰ ≈ 36% of the time ${P.tag()}. Long tasks need checks along the way (tests, confirmations); see ${P.open('guard')}.`)}</li>
</ul>`);

  P.quiz();
  P.card('c_U_m3', 2, t('具体产品与链接（待补）', 'Specific products and links (coming)'), `
<p>${t('【M3 占位 · 待补】具体产品与链接：各类用法对应的具体产品、版本和官方链接，在 M3 补充。', '[M3 placeholder · to be added] Specific products and links: the products, versions and official links for each way of using agents will be added in M3.')}</p>`, { cls: 'm3ph', noMap: true });

  return {
    sub: t('同一个 Agent，八种用法；差别只在四件事。', 'One agent, eight ways to use it; they differ in four things.'),
    one: t('从“你怎么用它”的角度看 Agent：谁来发起、在哪里跑、能动什么、你要不要盯着。每种用法都能往下钻到原理那一侧。', 'Agents seen from “how you use them”: who starts it, where it runs, what it can touch, and whether you watch. Each way links down to how it works.'),
    why: t('先知道“能怎么用”，再看“为什么能这样用”，学原理时就有了挂钩。', 'Knowing how it can be used first gives the principles something to hang on.'),
    svg, legend: [lg.use as [string, string, string], lg.agent as [string, string, string]],
  };
}
