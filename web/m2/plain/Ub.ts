/* R15 plain-language layer for Ub (letting an Agent work on its own: hand it over, check the result later). No KaTeX here. */
import type { PStation } from './types';
import { B } from './types';

const Ub: PStation = {
  cards: {
    c_Ub_0: {
      zh: `<p>“让它自己干”就像<b>把作业交给别人做、你回头再检查</b>。没人在旁边看着，所以要靠三样东西保平安：让它在<b>不会弄坏东西的地方</b>干活；交回来的东西<b>能检查</b>；<b>撤不回的那一步</b>（合并、发送、付钱）由你来按。</p>`,
      en: `<p>“Letting it work on its own” is like <b>handing a job to someone and checking it later</b>. Nobody is watching, so three things keep it safe: it works <b>somewhere it cannot break anything</b>; what it hands back <b>can be checked</b>; and <b>the step that cannot be undone</b> (merging, sending, paying) is left for you to press.</p>`,
    },
    c_Ub_1: {
      zh: `<p>后台助手像<b>请人在另一间屋子里干活</b>：你写好任务交出去，它在网上的一台单独机器里改代码、跑测试，最后交回一份“改动清单”（PR）等你看。适合说得清、能检查、不着急的活。</p>`,
      en: `<p>A background helper is like <b>someone working in another room</b>: you write the task and hand it over; it changes code and runs tests on a separate online machine, then hands back a “list of changes” (a PR) for you to review. Good for jobs that are clear, checkable and not urgent.</p>`,
    },
    c_Ub_2: {
      zh: `<p>例程就像<b>定好的闹钟</b>：到点了或者来了新邮件，助手就按写好的说明自动做一遍。会“发出去”的事先只写草稿，人看过再发；同一件事做两遍也只算一次；每次做了什么都记下来。</p>`,
      en: `<p>A routine is like <b>an alarm clock you set</b>: at a set time or when a new email arrives, the helper runs through written instructions by itself. Anything that “goes out” is drafted first and sent only after a person checks it; doing the same thing twice still counts once; and every run is written down.</p>`,
    },
    c_Ub_3: {
      zh: `<p>多个助手合作像<b>小组作业</b>：组长把大题拆开，分给几个组员各做一块，最后有人检查、汇总。几个人同时做，<b>时间省了，但花费更多</b>；给组员的任务要写清楚，因为他们听不到组长和你说过的话。</p>`,
      en: `<p>Several helpers working together is like a <b>group project</b>: the leader splits the big task, gives each member a piece, and someone checks and combines the results at the end. Working at the same time <b>saves time but costs more</b>; each member’s task must be written out fully, because they cannot hear what the leader and you discussed.</p>`,
    },
    c_Ub_4: {
      zh: `<p>为什么交回“改动清单”而不是直接改好？就像<b>作文先给老师看</b>，不直接贴到墙上：最坏的情况只是“不用”，什么都没坏；改动和测试结果摆在一起，检查比自己重做快得多。</p>`,
      en: `<p>Why hand back a “list of changes” instead of changing things directly? Like <b>showing your essay to the teacher</b> before pinning it on the wall: at worst it is simply not used and nothing breaks, and with the changes and test results side by side, checking is much faster than redoing it.</p>`,
    },
    c_Ub_5: {
      zh: `<p>人多不一定力量大。研究发现，好几个助手一起干活时<b>常常配合不好</b>，失败的不少，比一个助手强不了多少，花费却多很多。只有能拆成互不相干的几块、每块要读很多资料的活，才值得试。</p>`,
      en: `<p>More hands do not always help. Research found that several helpers working together <b>often coordinate badly</b>; many runs fail, they are often not much better than one helper, and they cost a lot more. Only jobs that split into independent pieces, each needing lots of reading, are worth trying.</p>`,
    },
    c_Ub_6: {
      zh: `<p>“深度研究”像<b>派几个同学分头去图书馆查资料</b>：一个人定计划，几个人各查一个方向，回来汇总，不够再查一轮，最后把每句话标上出处。拿到报告后要自己点开几个出处看看，原文是不是真这么说。</p>`,
      en: `<p>“Deep research” is like <b>sending several classmates to the library to look things up</b>: one makes the plan, a few each search one direction, they come back and combine what they found, search again if needed, and finally mark every statement with its source. When you get the report, open a few sources yourself to check the original really says that.</p>`,
    },
    c_Ub_7: {
      zh: `<p>“工作流”像<b>照着菜谱做菜</b>，每一步都写死了，每次都一样，出错也好找；“Agent”像<b>请厨师自己看着办</b>，更灵活，但每次花的时间和结果可能不同。能先写好步骤的事，用菜谱更稳。</p>`,
      en: `<p>A “workflow” is like <b>cooking from a recipe</b>: every step is fixed, it is the same each time, and mistakes are easy to find. An “Agent” is like <b>letting the chef decide</b>: more flexible, but the time and result may differ each time. If the steps can be written down in advance, the recipe is steadier.</p>`,
      more: B(`这是一篇工程文章给的建议，不是硬性规定；很多真实系统是两者混着用。`,
        `This is advice from an engineering article, not a hard rule; many real systems mix the two.`),
    },
    labFan: {
      zh: `<p>把一个调研任务分给 1 到 4 个子助手，看花的时间和用掉的词元各往哪边变；勾上“相互依赖”再比一比（数字都是示意）。</p>`,
      en: `<p>Split one research task among 1 to 4 sub-helpers and see which way the time and the tokens used move; tick “depend on each other” and compare again (all numbers are illustrative).</p>`,
    },
    labCron: {
      zh: `<p>自己做一个例程，模拟一周：选什么时候开工、做什么、是直接做还是先出草稿，看藏着的“陷阱”那天会发生什么（事件是示意）。</p>`,
      en: `<p>Build a routine and simulate a week: choose when it starts, what it does, and whether it acts directly or drafts first, then see what happens on the day of the hidden “trap” (the events are illustrative).</p>`,
    },
  },
};
export default Ub;
