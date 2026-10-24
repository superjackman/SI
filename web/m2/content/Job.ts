/* R26 station Job · 🤖 "I want AI to do tasks for me": a scenario picker (seven everyday jobs → kind of agent, with you
   or on its own, real products, cautions). Mainland products come from content/products.ts (checked 2026-10-23) plus
   three image/video products checked 2026-10-25 (/workspace/si-r26-sources.md). Overseas products are named only:
   no link, no account, payment or network-access instructions, by design. */
import { arrow, comp, LEG, Page, svgOpen, type StationOut } from '../lib';
import { src } from './ext/kit';
import { C as CF, jump, mem, one, tb, ti, tryit, ul } from './ext/m11';
import { PRODUCTS } from './products';

export const CHECKED_R26 = '2026-10-25';
type Bi2 = [string, string];
/** image / video products checked on 2026-10-25 (official site title and description) */
export const MEDIA: { n: string; ne: string; u: string; d: Bi2 }[] = [
  { n: '即梦AI', ne: 'Jimeng AI', u: 'https://jimeng.jianying.com', d: ['AI 绘画和 AI 视频创作。', 'AI drawing and AI video creation.'] },
  { n: '万相', ne: 'Wan', u: 'https://tongyi.aliyun.com/wan/', d: ['阿里巴巴通义旗下的 AI 创作平台：文生图、图生图、文生视频、图生视频、图像编辑。', 'Alibaba Tongyi’s AI creation platform: text-to-image, image-to-image, text-to-video, image-to-video, image editing.'] },
  { n: '海螺视频', ne: 'Hailuo Video', u: 'https://hailuoai.com', d: ['AI 视频生成。', 'AI video generation.'] },
];
/** the seven jobs: key, icon, name, kind of agent, with you / on its own, mainland products, overseas names, cautions */
export interface Scene { k: string; i: string; n: Bi2; kind: Bi2; mode: Bi2; p: string[]; os: string[]; c: Bi2[] }
export const SCENES: Scene[] = [
  { k: 'code', i: '💻', n: ['写代码', 'Write code'], kind: ['编辑器里的编程 Agent', 'A coding agent in your editor'],
    mode: ['🤝 陪你干：你看着它改每个文件；熟练后可以用“自己干”的模式（例如 TRAE 的 SOLO 模式）', '🤝 With you: you watch each file it edits; once confident, use an on-its-own mode (for example TRAE’s SOLO mode)'],
    p: ['TRAE', '通义灵码', 'CodeBuddy'], os: ['Cursor', 'GitHub Copilot', 'Claude Code', 'Codex'],
    c: [['在新分支或副本上让它改，不直接改正式代码。', 'Let it work on a new branch or a copy, never straight on the real code.'], ['改完跑测试，看懂了再合并。', 'Run the tests and understand the change before merging.'], ['别把密钥、密码贴进对话。', 'Never paste keys or passwords into the chat.']] },
  { k: 'office', i: '📝', n: ['办公写作', 'Office & writing'], kind: ['对话助手 + 办公 Agent', 'Chat assistant + office agent'],
    mode: ['🤝 陪你写：一段段改；🚀 办公 Agent 能自己读写你授权的文件夹，做完交给你', '🤝 With you: edit part by part; 🚀 an office agent reads and writes the folders you allow and hands back the result'],
    p: ['千问办公', 'WorkBuddy', '百度搭子', '豆包', 'Kimi'], os: [],
    c: [['只授权需要的那个文件夹。', 'Allow only the one folder it needs.'], ['公司文件先看公司规定能不能用 AI。', 'For work files, check your company’s rules on AI first.'], ['发出去之前自己读一遍。', 'Read it yourself before it goes out.']] },
  { k: 'research', i: '🔎', n: ['查资料调研', 'Research'], kind: ['AI 搜索 / 深度研究', 'AI search / deep research'],
    mode: ['🤝 AI 搜索陪你一问一答；🚀 深度研究会自己查很多网页，最后交一份报告', '🤝 AI search answers you question by question; 🚀 deep research reads many pages by itself and hands back a report'],
    p: ['秘塔AI搜索', 'Kimi', '千问'], os: ['Perplexity', 'Gemini', 'ChatGPT'],
    c: [['点开它给的引用，核对原文真的这么说。', 'Open the cited sources and check they really say that.'], ['看清资料的日期，旧消息可能已经变了。', 'Check the dates; old news may have changed.']] },
  { k: 'data', i: '📊', n: ['数据表格', 'Spreadsheets & data'], kind: ['办公 Agent（能读写表格文件）', 'Office agent (reads and writes spreadsheet files)'],
    mode: ['🚀 交代清楚要什么图、什么结论，它自己算、自己画，做完交给你', '🚀 Say which charts and conclusions you need; it calculates, draws and hands them back'],
    p: ['千问办公', 'WorkBuddy'], os: [],
    c: [['先备份原表，让它在副本上算。', 'Back up the original table and let it work on a copy.'], ['抽查几个数字，和原表对一对。', 'Spot-check a few numbers against the original.'], ['表里有别人的姓名、电话时，先删掉再上传。', 'Remove other people’s names and phone numbers before uploading.']] },
  { k: 'media', i: '🎨', n: ['做图做视频', 'Images & video'], kind: ['图像 / 视频生成工具', 'Image / video generators'],
    mode: ['🤝 你写描述（提示词），它出几张图或一段视频，你挑、再改描述', '🤝 You write a description (a prompt), it makes a few images or a clip, you pick and refine'],
    p: ['即梦AI', '万相', '海螺视频'], os: [],
    c: [['不用真人照片做假视频，不冒充别人。', 'No fake videos from real people’s photos; never impersonate anyone.'], ['要商用或发布时，先看平台的使用规则和版权说明。', 'Before commercial use or publishing, read the platform’s rules and rights terms.'], ['按要求标明“AI 生成”。', 'Label it “AI-generated” where required.']] },
  { k: 'routine', i: '⏰', n: ['自动化重复事', 'Automate repeat chores'], kind: ['定时任务 / 例程', 'Scheduled tasks / routines'],
    mode: ['🚀 自己干：设好时间和步骤，它按时跑，你看结果', '🚀 On its own: set the time and steps; it runs on schedule and you read the results'],
    p: ['千问办公', '扣子', 'WorkBuddy'], os: ['n8n'],
    c: [['发邮件、付款、删除这类撤不回的步骤，留给人来点“确认”。', 'Steps you cannot undo (sending email, paying, deleting) stay for a person to confirm.'], ['先手动跑几次，结果都对了再定时。', 'Run it by hand a few times; schedule it only when the results are right.']] },
  { k: 'tutor', i: '📚', n: ['学习辅导', 'Study help'], kind: ['对话助手', 'Chat assistant'],
    mode: ['🤝 陪你学：让它讲思路、出练习题、批改你的答案', '🤝 With you: it explains the steps, sets practice questions and marks your answers'],
    p: ['豆包', '千问', 'Kimi', 'DeepSeek', '腾讯元宝', '文心助手', '智谱清言'], os: [],
    c: [['让它讲思路，不要只抄答案。', 'Ask for the reasoning, not just the answer.'], ['它也会算错，答案要自己验算。', 'It also gets sums wrong; check answers yourself.'], ['小朋友请在家长陪同下用，不上传个人信息。', 'Children should use it with a parent and never upload personal details.']] },
];

export default function Job(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  const b = (x: Bi2) => (L === 'en' ? x[1] : x[0]);
  const sid = 'svgJob';
  let svg = svgOpen(sid, 330);
  svg += comp({ id: 'jHub', x: 40, y: 6, w: 300, h: 56, t: t('① 你想让它干的事', '① The job you want done'), s: [t('写代码、写文档、查资料……', 'code, documents, research…')], cat: 'use' }, L, nm('jHub'));
  svg += arrow(sid, 'M190 62 V80');
  svg += comp({ id: 'jPick', x: 40, y: 84, w: 300, h: 56, t: t('② 选：陪你干，还是自己干', '② Choose: with you or alone'), s: [t('越放手，越要说清楚', 'let go more, brief more')], cat: 'use' }, L, nm('jPick'));
  svg += arrow(sid, 'M130 140 V158 H96 V172') + arrow(sid, 'M250 140 V158 H284 V172');
  svg += comp({ id: 'uWith', x: 3, y: 176, w: 182, h: 60, t: t('🤝 陪你干', '🤝 With you'), s: [t('你看着，随时改', 'you watch and steer')], cat: 'use' }, L, nm('uWith'));
  svg += comp({ id: 'uSolo', x: 195, y: 176, w: 182, h: 60, t: t('🚀 自己干', '🚀 On its own'), s: [t('做完交结果', 'hands back a result')], cat: 'use' }, L, nm('uSolo'));
  svg += arrow(sid, 'M94 236 V250 H170 V264') + arrow(sid, 'M286 236 V250 H210 V264');
  svg += comp({ id: 'jCheck', x: 40, y: 268, w: 300, h: 56, t: t('③ 你来检查结果', '③ You check the result'), s: [t('核对、测试，再用', 'verify and test, then use')], cat: 'safe' }, L, nm('jCheck'));
  svg += '</svg>';
  const lg = LEG(t);

  P.card('c_Job_0', 1, t('🤖 让 AI 替你干活：先选对帮手', '🤖 Let AI do tasks for you: pick the right helper'), `
<p class="lead">${t('“Agent（智能体）”就是<b>会动手的 AI</b>：不只回答问题，还能读文件、改代码、上网查、按时做事。不同的事，适合不同的 Agent。', 'An “agent” is an <b>AI that acts</b>: it does not just answer, it reads files, edits code, searches the web and runs on a schedule. Different jobs suit different agents.')}</p>
<ol class="pts cf-ol">
<li>${t('<b>想清楚事情</b>：要它交回来什么（一段代码、一份报告、一张表、一张图）。', '<b>Name the job</b>: what should it hand back (code, a report, a table, a picture)?')}</li>
<li>${t('<b>选方式</b>：陪你一步步干，还是交代好让它自己干完。', '<b>Choose the mode</b>: step by step with you, or briefed and left to finish.')}</li>
<li>${t('<b>选产品</b>：下面的实验室按事情列出了国内能直接用的产品。', '<b>Pick a product</b>: the lab below lists products you can use in mainland China, by job.')}</li>
<li>${t('<b>检查结果</b>：它会出错，重要的东西你来把关。', '<b>Check the result</b>: it makes mistakes; you sign off anything that matters.')}</li>
</ol>
${tryit(P, jump(P, 'labJob', 'Job', t('🧪 按事情挑 Agent', '🧪 Pick an agent by task'), true), jump(P, 'c_Job_2', 'Job', t('怎么把事交代清楚', 'How to brief it')), jump(P, 'labPick', 'U', t('八种用法怎么选', 'Choosing among the eight modes')))}`, { h2: true });

  P.card('c_Job_1', 2, t('🤝 陪你干 vs 🚀 自己干', '🤝 With you vs 🚀 on its own'), `
${tb([t('对比', 'Compare'), t('🤝 陪你干', '🤝 With you'), t('🚀 自己干', '🚀 On its own')], [
    [t('你在做什么', 'What you do'), t('看着每一步，随时改', 'watch every step and steer'), t('交代清楚，等结果', 'brief it, wait for the result')],
    [t('适合', 'Good for'), t('第一次做、很重要、说不清要什么', 'first time, high stakes, not sure what you want'), t('做过很多次、能检查结果的事', 'jobs done many times whose results you can check')],
    [t('例子', 'Example'), t('在编辑器里一起改代码', 'editing code together in the editor'), t('每天早上自动整理一份新闻摘要', 'a news digest prepared every morning')],
    [t('要小心', 'Watch out'), t('别一直点“同意”不看', 'do not click “accept” without reading'), t('撤不回的步骤留给人确认', 'irreversible steps wait for a person')],
  ])}
${mem(P, t('放手越多，事前越要说清楚，事后越要检查。', 'The more you let go, the more you brief before and check after.'))}
${tryit(P, jump(P, 'c_Ua_0', 'Ua', t('跟它一起干', 'Work alongside it')), jump(P, 'c_Ub_0', 'Ub', t('让它自己干', 'Let it run alone')))}`);

  P.card('c_Job_2', 2, t('🗒️ 把事交代清楚：四句话', '🗒️ Brief it well: four lines'), `
<p>${t('不管用哪个产品，交代任务都可以按这四句来写：', 'Whatever the product, a brief can follow these four lines:')}</p>
${tb([t('写什么', 'Line'), t('例子（做一份周报）', 'Example (a weekly report)')], [
    [t('① 目标：要交回什么', '① Goal: what to hand back'), t('一页周报，三段：做了什么、问题、下周计划', 'a one-page report in three parts: done, problems, next week')],
    [t('② 资料：用哪些东西', '② Material: what to use'), t('这周的会议记录和任务表（附件）', 'this week’s meeting notes and task list (attached)')],
    [t('③ 规矩：哪些不能做', '③ Rules: what not to do'), t('不编数字；不确定的写“待确认”', 'no made-up numbers; write “to confirm” when unsure')],
    [t('④ 检查：怎样算做好', '④ Check: what “done” means'), t('每条都能在资料里找到出处', 'every point traceable to the material')],
  ])}
${tryit(P, jump(P, 'c_Ud_0', 'Ud', t('用得好：上下文与检查', 'Using it well: context and checks')))}`);

  P.card('c_Job_3', 2, t('🛡️ 交给 AI 之前：三条底线', '🛡️ Before you hand it over: three lines you do not cross'), `
${ul([
    t('<b>隐私</b>：密码、验证码、身份证号、银行卡号、别人的电话住址，不发给 AI。', '<b>Privacy</b>: passwords, codes, ID and bank card numbers, other people’s phones and addresses never go to an AI.'),
    t('<b>撤不回的事</b>：付款、发邮件、删文件、提交表单，最后一步自己点。', '<b>Irreversible steps</b>: paying, emailing, deleting files and submitting forms; you press the last button yourself.'),
    t('<b>检查</b>：数字对原表、引用点开看、代码跑测试；它说得越肯定，越要查。', '<b>Checking</b>: numbers against the source, citations opened, code tested; the surer it sounds, the more you check.'),
  ])}
${mem(P, t('AI 是很能干的实习生：能干，但要你签字。', 'An AI is a very capable intern: it gets work done, but you sign it off.'))}
${tryit(P, jump(P, 'riskCard', 'T2', t('Agent 的风险', 'Agent risks')), jump(P, 'labInj', 'T2', t('🧪 提示词注入', '🧪 Prompt injection')))}`);

  P.card('cfJobChat', 1, ti(P, '聊天助手 vs Agent', 'chat assistant vs agent'),
    one(P, t('聊天助手<b>会说</b>：给你一段文字，你自己去做；Agent <b>会做</b>：自己打开文件、跑命令、点网页，把事办完。', 'a chat assistant <b>talks</b>: it gives you text and you do the work; an agent <b>acts</b>: it opens files, runs commands and clicks through pages until the job is done.'))
    + tb([t('对比', 'Compare'), t('聊天助手', 'Chat assistant'), t('Agent', 'Agent')], [
      [t('交回来', 'Hands back'), t('一段回答', 'an answer'), t('做好的结果（文件、改好的代码）', 'finished work (files, edited code)')],
      [t('能动你的东西吗', 'Touches your things?'), t('不能', 'no'), t('能，在你允许的范围里', 'yes, within what you allow')],
      [t('风险', 'Risk'), t('说错', 'wrong answers'), t('说错 + 做错', 'wrong answers + wrong actions')],
    ])
    + mem(P, t('能动手的，就要先管好它能动哪里。', 'Anything that can act needs limits on what it can touch.'))
    + tryit(P, jump(P, 'cfAgentLlm', 'T2', t('大模型 vs Agent', 'LLM vs agent'))), CF);

  P.card('cfJobLook', 1, ti(P, '看起来对 vs 真的对', 'looks right vs is right'),
    one(P, t('模型很会写<b>像样的</b>答案：格式整齐、语气肯定、还带“引用”。但像样不等于正确，它可能编出不存在的数据和链接。', 'models are great at <b>plausible</b> answers: neat, confident, even with “citations”. Plausible is not correct; it can invent data and links that do not exist.'))
    + ul([
      t('数字：回到原表对一下。', 'Numbers: go back to the source table.'),
      t('引用：点开链接，看原文是不是这么说。', 'Citations: open the link and read what it really says.'),
      t('代码：跑一遍测试，看真的能用。', 'Code: run the tests and see that it works.'),
    ]), CF);

  /* the scenario picker: all seven panels are in the page (hidden but one), the lab only switches them */
  const prod = (n: string) => {
    const p = PRODUCTS.find((x) => x.n === n), m = MEDIA.find((x) => x.n === n);
    if (!p && !m) throw new Error('Job: unknown product ' + n);
    const name = L === 'en' ? (p ? p.ne ?? p.n : m!.ne) : n, u = p ? p.u : m!.u, d = p ? p.d[L] : b(m!.d);
    return `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${name}</a> · ${d}</li>`;
  };
  const panel = (s: Scene, k: number) => `<div class="pk-v" data-pv="${s.k}"${k ? ' hidden' : ''}>
<p class="pk-h"><b>${s.i} ${b(s.n)}</b> · ${t('用', 'Use')} <b>${b(s.kind)}</b></p>
<p>${b(s.mode)}</p>
<p><b>${t('国内可直接用的产品', 'Products available in mainland China')}</b></p>
<ul class="pk-p">${s.p.map(prod).join('')}</ul>
${s.os.length ? `<p class="tag-note">${t('海外同类：', 'Overseas peers: ')}${s.os.join(t('、', ', '))}${t('（只列名字，本站不介绍开通、付款和访问方式）', ' (names only; this site does not cover accounts, payment or access)')}</p>` : ''}
<p><b>${t('⚠️ 要小心', '⚠️ Take care')}</b></p>
<ul class="pk-c">${s.c.map((c) => `<li>${b(c)}</li>`).join('')}</ul>
</div>`;
  P.labDivider();
  P.lab('labJob', t('按事情挑 Agent：点一件你想让 AI 干的事', 'Pick an agent by task: tap a job you want done'),
    t(`产品信息来自各家官网（核对于 2026-10-23 和 ${CHECKED_R26}）；产品更新很快，用之前点链接看最新介绍。`, `Product facts from the official sites (checked 2026-10-23 and ${CHECKED_R26}); products change fast, so follow the link for the latest.`),
    [t('知道每件事该找哪种 Agent。', 'Know which kind of agent fits each job.'), t('记住每类事最该小心的地方。', 'Remember what to watch out for in each.')],
    `<div class="pk" id="pkJob" role="group" aria-label="${t('选一件事', 'Pick a job')}">${SCENES.map((s, k) => `<button type="button" class="pk-b" data-pk="${s.k}" aria-pressed="${k ? 'false' : 'true'}">${s.i} ${b(s.n)}</button>`).join('')}</div>
<div class="pk-out" id="pkJobOut" aria-live="polite">${SCENES.map(panel).join('')}</div>
${src(P, MEDIA.map((m) => [m.u, L === 'en' ? m.ne : m.n] as [string, string]))}`,
    [t('点“写代码”和“学习辅导”，比比哪个是陪你干、哪个能自己干', 'Tap “Write code” and “Study help”: which works with you, which can work alone?'),
      t('点“自动化重复事”，看哪一步必须留给人', 'Tap “Automate repeat chores” and find the step that stays with a person')]);

  P.quiz();
  return {
    sub: t('按事情选 Agent，陪你干还是自己干，再检查结果。', 'Pick an agent by task, with you or alone, then check the result.'),
    one: t('先说清要干的事，再选陪你干还是自己干，最后自己检查结果。', 'Say the job, choose with-you or on-its-own, then check the result yourself.'),
    why: t('同样叫 AI，能干的事差很多；选对帮手，省时也少出错。', 'Things called “AI” differ a lot; the right helper saves time and mistakes.'),
    svg, legend: [lg.use as [string, string, string], lg.safe as [string, string, string]],
  };
}
