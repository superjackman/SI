/* R15 plain-language layer for U (how to use an Agent: the overview of the ways of using it). No KaTeX here. */
import type { PStation } from './types';

const U: PStation = {
  cards: {
    c_U_0: {
      zh: `<p>Agent 就像一个<b>能动手的助手</b>，用法很多，但里面都是同一个东西。不同用法只差四件事：<b>谁叫它开工</b>、<b>它在哪儿干活</b>、<b>它能碰什么</b>、<b>你要不要在旁边看着</b>。</p>`,
      en: `<p>An Agent is like a <b>helper that can actually do things</b>. There are many ways to use it, but inside it is always the same thing. The ways differ in only four things: <b>who tells it to start</b>, <b>where it works</b>, <b>what it can touch</b>, and <b>whether you watch</b>.</p>`,
    },
    c_U_1: {
      zh: `<p>把八种用法按这四件事排成一张表，像<b>课程表</b>一样一眼能对比：哪种只能说话，哪种能改文件，哪种你得盯着，哪种交出去就行。</p>`,
      en: `<p>The eight ways are lined up in a table by those four things, so you can compare them at a glance like a <b>timetable</b>: which only talk, which can change files, which you must watch, and which you can just hand over.</p>`,
    },
    c_U_2: {
      zh: `<p>挑用法前先问自己四个问题：<b>要不要它动手？能不能检查做得对不对？是不是经常要做？做错了能不能撤回？</b>撤不回的事（发出去、删掉、付钱），一定要留一步让人点头。</p>`,
      en: `<p>Before choosing, ask four questions: <b>does it need to do things? Can you check whether it did them right? Is it something you do often? Can a mistake be undone?</b> For things that cannot be undone (sending, deleting, paying), always keep a step where a person says yes.</p>`,
    },
    labPick: {
      zh: `<p>勾选你的任务有哪些特点，看推荐哪种用法；勾上“有风险”，看答案怎么变（规则是简化的示意）。</p>`,
      en: `<p>Tick what your task is like and see which way of using an Agent is suggested; tick “risky” and see how the answer changes (the rules are a simplified illustration).</p>`,
    },
    c_U_3: {
      zh: `<p>给助手的<b>钥匙越多</b>（能做的事越多），就越要<b>有人看着</b>或者把它关在安全的小房间里。还有，小错会越积越多：每一步都有一点出错的机会，步数一多，全对的机会就小了很多，所以长任务中间要检查。</p>`,
      en: `<p>The <b>more keys</b> you give the helper (the more it can do), the more it needs <b>someone watching</b> or to be kept in a safe little room. Also, small mistakes add up: every step has a small chance of going wrong, and over many steps the chance of getting them all right shrinks a lot, so long tasks need checks along the way.</p>`,
    },
    c_U_m3: {
      keep: true,
      zh: `<p>想知道每种用法有哪些真实的产品、官网在哪，去“具体产品”那一站看。</p>`,
      en: `<p>To see which real products fit each way of using an Agent, and where their websites are, go to the “Products” stop.</p>`,
    },
  },
};
export default U;
