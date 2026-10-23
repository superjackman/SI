/* R15 plain-language layer for T4b (feed-forward, residual, normalisation, output scores and softmax). No KaTeX here. */
import type { PStation } from './types';

const T4b: PStation = {
  cards: {
    c_T4b_0: {
      keep: true,
      zh: `<p>开完会，每个词<b>回座位自己想一想</b>：先把自己的一串数放大成很多个“小探测器”，每个探测器只认一种模式；一道“开关”只让认出东西的探测器亮着；最后把亮着的信号汇总，缩回原来的长度。下面可以选一个词，一步步看（数字是示例）。</p>`,
      en: `<p>After the meeting, each word <b>goes back to its desk to think</b>: its list of numbers is first blown up into lots of little “detectors”, each recognising one pattern; a “switch” keeps lit only the detectors that found something; then the lit signals are added up and shrunk back to the original length. Pick a word below and follow it step by step (the numbers are an example).</p>`,
    },
    c_T4b_1: {
      zh: `<p><b>残差</b>就像在原稿上<b>贴便利贴</b>：每一层只写一点修改意见贴上去，原稿一直都在。这样就算叠几十层，最初的意思也不会丢；训练时“该怎么改”的信号也能顺着这条直路传回前面。</p>`,
      en: `<p>The <b>residual</b> is like <b>sticking notes on the original draft</b>: each layer only adds a small note, and the draft is always kept. So even after dozens of layers the original meaning is not lost, and during training the “how to fix it” signal can travel back along this straight road.</p>`,
    },
    c_T4b_2: {
      zh: `<p><b>归一化</b>就像每轮讨论后把大家的<b>音量调到差不多</b>，免得有人越喊越响、有人小到听不见。数字的大小稳住了，后面的计算和训练就不容易失控。</p>`,
      en: `<p><b>Normalisation</b> is like setting everyone’s <b>volume to about the same</b> after each round of discussion, so nobody keeps getting louder or fades to a whisper. With the sizes of the numbers kept steady, the later steps and the training are much less likely to go wild.</p>`,
    },
    c_T4b_3: {
      keep: true,
      zh: `<p>走完所有层以后，要决定下一个词。办法是拿最后那串数，和词表里<b>每个词的“名片”</b>比一比，越像的分数越高；然后把分数换成加起来正好 100% 的机会。点图里的方块看每一步。</p>`,
      en: `<p>After all the layers, the next word has to be chosen. The last list of numbers is compared with <b>each word’s “name card”</b> in the vocabulary; the more alike, the higher the score. Then the scores are turned into chances that add up to exactly 100%. Tap the boxes in the picture to see each step.</p>`,
    },
    tieCard: {
      zh: `<p>入口有一张表，把每个词变成一串数；出口有一张表，给每个词打分。两张表<b>长得一模一样</b>，干的活却相反，像同一本字典，一个用来“查意思”，一个用来“找词”。可以共用一张，省地方；也可以分开，更灵活。</p>`,
      en: `<p>At the entrance a table turns each word into a list of numbers; at the exit a table scores each word. The two tables <b>have exactly the same shape</b> but opposite jobs, like one dictionary used once to “look up a meaning” and once to “find a word”. They can share one table to save space, or stay separate for more freedom.</p>`,
    },
    dotCard: {
      keep: true,
      zh: `<p>为什么“比一比像不像”就能选对词？一开始全是乱的，比出来的分数纯属巧合。是<b>训练</b>让它变准的：每次猜错，就把正确词的名片往“现在的想法”那边拉一点，把猜错的推开一点。练上亿次后，想法和该接的词就对齐了。拖动下面的滑块试试（数字是示例）。</p>`,
      en: `<p>Why does “comparing how alike they are” pick the right word? At first everything is random and the scores are pure chance. <b>Training</b> makes them right: after each wrong guess, the correct word’s card is pulled a little towards the “current idea”, and the wrong ones are pushed away. After hundreds of millions of rounds, ideas and the words that should follow line up. Drag the sliders below to try (the numbers are an example).</p>`,
    },
    c_T4b_4: {
      keep: true,
      zh: `<p>“温度”是一个旋钮：调低，模型更保守，几乎总选第一名；调高，更爱冒险，冷门的词也有机会。改改分数和温度，看机会怎么变。</p>`,
      en: `<p>The “temperature” is a knob: turn it down and the model plays safe, nearly always taking the top word; turn it up and it gets adventurous, giving rare words a chance too. Change the scores and the temperature and watch the chances move.</p>`,
    },
    xInterp: {
      zh: `<p>模型里面学到了什么？一个神经元常常<b>身兼好几职</b>，单看它看不懂。研究者有两种“读心术”：一种是在旁边另外训练一个小判断器，看某一层里藏着什么信息；另一种是把一层拆成很多个小特征，每次只亮几个，这些特征比单个神经元好懂得多。</p>`,
      en: `<p>What has the model learned inside? A single neuron often <b>does several jobs at once</b>, so looking at it alone tells you little. Researchers use two kinds of “mind reading”: train a small separate judge to see what information a layer holds, or split a layer into many small features of which only a few light up at a time; those features are far easier to understand than single neurons.</p>`,
    },
  },
};
export default T4b;
