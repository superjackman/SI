/* R26 plain-language layer for Job (letting AI do tasks for you). */
import type { PStation } from './types';

const k = (zh: string, en: string) => ({ keep: true as const, zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
const p = (zh: string, en: string) => ({ zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
const Job: PStation = {
  cards: {
    c_Job_0: {
      zh: `<p class="pl-bd">📏 <b>这里讲</b>：七类常见的事（写代码、办公写作、查资料、表格、做图做视频、定时做事、学习）各找哪种 AI，国内能直接用哪些产品，要小心什么。<b>这里不讲</b>：海外产品怎么开通、付款或访问。</p>`
        + `<p>找 AI 干活像<b>请帮手</b>：先说清要干什么，再决定是你在旁边看着，还是交代好让它自己干，最后你来验收。</p>`,
      en: `<p class="pl-bd">📏 <b>Covered here</b>: which kind of AI fits seven everyday jobs (code, office writing, research, spreadsheets, images and video, scheduled chores, study), which products work in mainland China, and what to watch out for. <b>Not covered</b>: signing up for, paying for or reaching overseas products.</p>`
        + `<p>Getting AI to work is like <b>hiring a helper</b>: say what the job is, decide whether you watch or let it work alone, then check the result yourself.</p>`,
    },
    c_Job_1: p('<b>陪你干</b>像教练在旁边带着你；<b>自己干</b>像把事交给快递员，送到了你再开箱检查。没把握的事先陪着干。',
      '<b>With you</b> is like a coach at your side; <b>on its own</b> is like handing a parcel to a courier and checking it when it arrives. When unsure, work alongside it first.'),
    c_Job_2: p('交代任务像<b>给外卖写备注</b>：要什么、用什么、别放什么、怎样算做好。写清楚四句，结果就好很多。',
      'Briefing is like <b>writing a note on a food order</b>: what you want, what to use, what to leave out, what counts as done. Four clear lines make a big difference.'),
    c_Job_3: p('三条底线：<b>私密信息不给</b>、<b>撤不回的最后一步自己点</b>、<b>结果自己查</b>。',
      'Three lines: <b>keep private details back</b>, <b>press the last irreversible button yourself</b>, <b>check the result yourself</b>.'),
    cfJobChat: k('聊天助手像<b>给你菜谱的朋友</b>，Agent 像<b>直接下厨的厨师</b>。厨师能做更多，也能把厨房弄乱，所以要先说好能用哪些东西。',
      'A chat assistant is like <b>a friend who hands you a recipe</b>; an agent is like <b>a chef who cooks</b>. The chef does more and can also mess up the kitchen, so agree first what it may use.'),
    cfJobLook: k('AI 的答案像<b>包装很漂亮的盒子</b>：包装好看不等于里面对。数字、引用、代码，都要打开看一眼。',
      'An AI answer is like <b>a beautifully wrapped box</b>: nice wrapping does not mean the contents are right. Open and check numbers, citations and code.'),
    labJob: p('点一件你想让 AI 干的事，看该找哪种 Agent、国内有哪些产品、要小心什么。',
      'Tap a job you want done to see which kind of agent fits, which products are available in mainland China, and what to watch out for.'),
  },
};
export default Job;
