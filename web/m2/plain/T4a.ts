/* R15 plain-language layer for T4a (attention: how each word decides whom to look at). No KaTeX here; the RoPE lab's
   letters (m, n, s) are explained in its plain line. */
import type { PStation } from './types';
import { B } from './types';

const T4a: PStation = {
  cards: {
    c_T4a_0: {
      zh: `<p>注意力就像在<b>图书馆找书</b>：你手里拿着一个问题（提问卡 Q），去对照每本书书脊上的标签（标签卡 K），哪本越对得上，就越认真读那本书的内容（内容卡 V）。每个词都这样去“找”句子里的其他词。</p>`,
      en: `<p>Attention is like <b>finding books in a library</b>: you hold a question (the query card Q), compare it with the label on each book’s spine (the key card K), and the better a book matches, the more carefully you read its contents (the value card V). Every word “searches” the other words of the sentence this way.</p>`,
    },
    c_T4a_1: {
      keep: true,
      zh: `<p>点一个词，看它把注意力分给了谁：比例越大，它从那个词那里拿的消息就越多。数字是编的小例子。</p>`,
      en: `<p>Tap a word to see how it shares out its attention: the bigger the share, the more it takes from that word. The numbers are a small made-up example.</p>`,
    },
    c_T4a_2: {
      zh: `<p>一个人看问题只有一种眼光，所以注意力里有<b>很多组</b>同时在看（多头），每组用自己的眼光，最后把大家看到的拼起来。</p>`,
      en: `<p>One person sees things only one way, so attention has <b>many groups</b> looking at once (multiple heads), each with its own eyes, and what they all see is put together at the end.</p>`,
      more: B(`常说“有的头盯语法、有的头盯指代”，这只是比喻：各头怎么分工是训练中自己形成的，很多头并不好解释。`,
        `People say “some heads watch grammar, some watch who ‘it’ refers to”, but that is only a picture: how the heads divide the work forms by itself during training, and many heads are hard to explain.`),
    },
    c_T4a_3: {
      zh: `<p>为什么这么设计？要分三张卡，是因为“我在找什么”“我怎么被找到”“被找到后我交出什么”是三件不同的事。对得上的程度用<b>对应位置相乘再加起来</b>来算；卡片越长这个数越大，所以要先缩小一些，免得比例一边倒。还要<b>遮住后面的词</b>：任务是猜下一个词，偷看就等于抄答案。</p>`,
      en: `<p>Why this design? There are three cards because “what am I looking for”, “how can I be found” and “what do I hand over once found” are three different things. How well two cards match is worked out by <b>multiplying position by position and adding up</b>; longer cards give bigger numbers, so the result is scaled down first to keep the shares from being lopsided. The <b>later words are covered up</b>: the job is to guess the next word, and peeking would be copying the answer.</p>`,
    },
    xRope: {
      zh: `<p>注意力本身分不清词的先后。RoPE 的办法像<b>拧钟表的指针</b>：排在第几个，就把卡片转多大的角度。两张卡都转过之后再比，结果只和它们<b>隔了几个词</b>有关，和它们排在第几个无关。</p>`,
      en: `<p>Attention on its own cannot tell which word comes first. RoPE’s trick is like <b>turning the hands of a clock</b>: the later a word sits, the further its card is turned. After both cards are turned, comparing them depends only on <b>how many words apart</b> they are, not on where they sit.</p>`,
    },
    labAttn: {
      zh: `<p>换几个词、开关“只看前面”、改改有几组在看，再点热力图的一行，看那个词在看谁（模式是按规则编的）。</p>`,
      en: `<p>Swap some words, switch “look back only” on and off, change how many groups are looking, and tap a row of the heat map to see whom that word is looking at (the patterns are made up by rule).</p>`,
    },
    labRope: {
      zh: `<p>m 是提问卡排在第几个，n 是标签卡排在第几个，s 是把两个一起往后挪几格。挪 s 时分数不变，因为它们之间的距离 m − n 没变。</p>`,
      en: `<p>m is the query card’s position, n the key card’s position, and s moves both along by the same amount. Moving s leaves the score unchanged, because the gap m − n between them stays the same.</p>`,
    },
  },
};
export default T4a;
