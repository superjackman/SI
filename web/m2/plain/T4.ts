/* R15 plain-language layer for T4 (one Transformer block). No formulas here. */
import type { PStation } from './types';
import { B } from './types';

const T4: PStation = {
  cards: {
    c_T4_0: {
      zh: `<p>大模型的中间，是很多个<b>一模一样的“块”</b>摞在一起，像一摞积木。每块积木里只做两件事：先让词和词<b>互相看一看</b>（注意力），再让每个词<b>自己想一想</b>（前馈网络）。每做完一件，都把新想法加到原来的想法上，再把“音量”调匀。</p>`,
      en: `<p>In the middle of a large model sit many <b>identical “blocks”</b> stacked up like building bricks. Each brick does just two things: first the words <b>look at each other</b> (attention), then each word <b>thinks on its own</b> (the feed-forward network). After each, the new idea is added onto the old one and the “volume” is evened out.</p>`,
    },
    c_T4_1: {
      zh: `<p>块里的四个零件，一句话记住：<b>注意力</b>是词和词交换消息；<b>前馈网络</b>是每个词各自用学到的知识想一想；<b>残差</b>是在原稿上写批注，原稿不丢；<b>归一化</b>是把数字调回差不多的大小。</p>`,
      en: `<p>The four parts of a block in one line each: <b>attention</b> is words swapping messages; the <b>feed-forward network</b> is each word thinking with what it has learned; the <b>residual</b> is writing notes on the original draft without losing it; <b>normalisation</b> brings the numbers back to a similar size.</p>`,
    },
    c_T4_2: {
      zh: `<p>把每个词想成一个人，一群人一起读一句话：先<b>开个短会</b>，听听相关的人怎么说；散会后<b>各自回座位</b>想一想。这样“开会 + 想一想”重复几十轮，每个人对整句话就懂得越来越深。</p>`,
      en: `<p>Picture each word as a person, and a group reading one sentence together: first a <b>short meeting</b> to hear what the relevant people say; then <b>everyone goes back to their desk</b> to think. Repeat “meet + think” dozens of times and each person understands the whole sentence more and more deeply.</p>`,
    },
    c_T4_3: {
      zh: `<p>为什么每个零件都少不了？<b>注意力</b>让离得很远的词也能一步“对上话”；<b>前馈网络</b>能做“如果……就……”这样的加工，光靠注意力只会搬运和混合；<b>残差</b>像一条直通的滑梯，让“该怎么改”的信号从最后一层顺利传回第一层；<b>归一化</b>防止数字越滚越大或越缩越小。</p>`,
      en: `<p>Why is every part needed? <b>Attention</b> lets even far-apart words “talk” in one step; the <b>feed-forward network</b> can do “if this, then that” processing, while attention alone only moves and mixes information; the <b>residual</b> is like a straight slide that lets the “how to fix it” signal travel cleanly from the last layer back to the first; <b>normalisation</b> stops numbers from snowballing or shrinking away.</p>`,
      more: B(`这些都是常见的解释，不是严格证明：比如“知识主要存在前馈网络里”是研究中的观察；归一化为什么这么有效，学界还有好几种说法。`,
        `These are common explanations, not strict proofs: for instance “knowledge is mainly stored in the feed-forward network” is a research observation, and there are still several competing accounts of why normalisation works so well.`),
    },
    labBlock: {
      zh: `<p>自己搭一摞积木：打开或关掉残差、归一化、前馈网络，叠几十层，看信号会不会越变越大（爆炸）或越变越小（消失）。这是简化模拟，不是真模型。</p>`,
      en: `<p>Build your own stack: switch the residual, normalisation and feed-forward network on or off, stack dozens of layers, and see whether the signal blows up or fades away. This is a simplified simulation, not a real model.</p>`,
    },
  },
};
export default T4;
