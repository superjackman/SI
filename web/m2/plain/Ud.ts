/* R15 plain-language layer for Ud (using an Agent well: clear tasks, tidy context, checking, safety). No KaTeX here. */
import type { PStation } from './types';
import { B } from './types';

const Ud: PStation = {
  cards: {
    c_Ud_0: {
      zh: `<p>助手<b>只看得到你给它的东西</b>，猜不到你心里没说出来的要求。就像请人帮忙买菜，只说“买点菜”和说清“买什么、给谁吃、预算多少、几点前送到”，结果差很多。</p>`,
      en: `<p>The helper <b>only sees what you give it</b>; it cannot guess what you meant but did not say. Like asking someone to shop for you: “get some food” versus “what to buy, who it is for, the budget, and when to deliver” gives very different results.</p>`,
    },
    c_Ud_1: {
      zh: `<p>交代任务时说清四件事：<b>要什么结果、有什么背景、哪些不能碰、怎样算做完</b>。再给一个例子，往往比多写几段要求更管用。复杂的活先让它写计划，你看过再动手。</p>`,
      en: `<p>When giving a task, make four things clear: <b>the result you want, the background, what must not be touched, and what counts as done</b>. Adding one example often helps more than extra paragraphs. For complex jobs, have it write a plan first and check it before it starts.</p>`,
    },
    c_Ud_2: {
      zh: `<p>助手的“桌面”（上下文）<b>大小有限</b>，堆得越满，要紧的东西越容易被埋住。所以：一个话题开一个对话；告诉它文件在哪，而不是把整篇贴进来；和任务无关的材料拿走。</p>`,
      en: `<p>The helper’s “desk” (its context) is <b>limited in size</b>, and the fuller it gets, the easier it is for important things to get buried. So: one topic per chat; tell it where a file is rather than pasting the whole thing; and take away material unrelated to the task.</p>`,
      more: B(`研究发现，很多模型对长文中间部分的信息用得更差，开头和结尾更容易被用上；这是普遍倾向，各模型程度不同。`,
        `Research found that many models make worse use of information in the middle of a long text than at its start or end; this is a general tendency that varies between models.`),
    },
    c_Ud_3: {
      zh: `<p>它说“做完了”不等于真做完了。先让它<b>自己检查一遍</b>（跑测试、对照要求），你再<b>抽查要紧的地方</b>：数字、引用、日期、要发出去的内容。看证据，不只听它说。</p>`,
      en: `<p>“Done” from the helper does not mean really done. First have it <b>check its own work</b> (run tests, compare with the requirements), then <b>spot-check the important parts</b> yourself: numbers, quotes, dates and anything to be sent out. Look at the evidence, not just what it says.</p>`,
    },
    c_Ud_4: {
      zh: `<p>几个好习惯：<b>钥匙从少给起</b>，用完收回；发送、删除、付钱一定自己点头；它读进来的网页和邮件可能藏着坏指令；<b>不要把密码贴进对话</b>。</p>`,
      en: `<p>A few good habits: <b>start with few keys</b> and take them back afterwards; always approve sending, deleting and paying yourself; web pages and emails it reads may hide bad instructions; and <b>never paste passwords into the chat</b>.</p>`,
    },
    c_Ud_5: {
      zh: `<p>交回来的东西像<b>交上来的作业</b>，要按清单批改：代码看测试是不是真的通过了，报告点开几个出处核对，表格对一对合计，要发出去的内容检查收件人。不合格就退回并写清哪条没过。</p>`,
      en: `<p>What comes back is like <b>homework handed in</b>, to be marked against a checklist: for code, check the tests really passed; for reports, open a few sources; for tables, check the totals; for anything to be sent, check the recipients. If it fails, send it back and say which item failed.</p>`,
    },
    labPrompt: {
      zh: `<p>把“说清楚”的四件事一个个打开，看效果分怎么变；再多塞几份无关文档，看分数会不会掉（分数是示意的教学打分）。</p>`,
      en: `<p>Switch on the four parts of “making it clear” one by one and watch the score change; then add some unrelated documents and see whether the score drops (the score is an illustrative teaching score).</p>`,
    },
  },
};
export default Ud;
