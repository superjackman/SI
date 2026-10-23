/* R15 plain-language layer for T3 (the large model: a "guess the next word" machine). No formulas here; the labs whose
   controls are letters (T, k, p, N) say what each letter means in their plain line. */
import type { PStation } from './types';
import { B } from './types';

const T3: PStation = {
  cards: {
    c_T3_0: {
      zh: `<p>大模型其实在玩<b>词语接龙</b>：你给它一个开头，它猜“下一个词最可能是什么”，接上去，再猜下一个……一个词一个词地把整段话写出来。上面的图就是它肚子里的流水线：文字从左边进去，右边出来的是“每个词有多大可能是下一个”。</p>`,
      en: `<p>A large model is really playing a <b>word-chain game</b>: you give it a beginning, it guesses “what is the most likely next word”, adds it, then guesses the next… writing a whole passage one word at a time. The picture above is the assembly line inside it: text goes in on the left, and out on the right comes “how likely each word is to be next”.</p>`,
    },
    c_T3_1: {
      keep: true,
      zh: `<p>你来当裁判：模型给每个候选词打了分，按分数抽一个接上去，看句子怎么长出来（分数是编好的示例）。</p>`,
      en: `<p>You be the referee: the model has scored each candidate word; draw one by its score and watch the sentence grow (the scores are a made-up example).</p>`,
    },
    c_T3_2: {
      zh: `<p>流水线上每一站各干一件小事：先把句子<b>切成小块</b>，每块换成一个编号；每个编号查出一串代表意思的数字；再记上“排第几个”；然后经过几十层反复加工，让每个词都“读懂”整句话；最后给每个可能的下一个词打分，换成机会大小，抽一个接上去。</p>`,
      en: `<p>Each stop on the line does one small job: <b>cut the sentence into pieces</b> and give each a number; look up a list of numbers that stands for each piece’s meaning; note “which position it is in”; pass through dozens of layers that let every word “understand” the whole sentence; and finally score every possible next word, turn the scores into chances, and draw one.</p>`,
    },
    whyL1: {
      zh: `<p>为什么这样设计？最大的好处是：“猜下一个词”的练习题<b>到处都是</b>。任何一段文字，遮住后面一个词，就是一道自带答案的题，不用人来出题、改卷。为了猜得准，模型不得不学会语法、常识和一些推理。</p>`,
      en: `<p>Why this design? The biggest win is that “guess the next word” exercises are <b>everywhere</b>: cover the next word in any piece of text and you have a question with its own answer, with nobody needed to write or mark it. To guess well, the model is forced to pick up grammar, facts and some reasoning.</p>`,
      more: B(`“学会推理”要打个折扣：模型学到的是文字里常见的规律，也包括里面的错误和偏见；光靠猜下一个词到底能学会多少推理，研究者还在争论。聊天模型通常还要再经过额外训练才会听话。`,
        `“Picks up reasoning” needs a caveat: the model learns the patterns common in text, errors and biases included, and how much reasoning next-word guessing alone can teach is still debated. Chat models usually need extra training before they follow instructions well.`),
    },
    c_T3_3: {
      keep: true,
      zh: `<p>模型不认识字，只认识编号。所以先把句子<b>切成小块</b>，像切蛋糕：常见的词整块切，少见的拆碎一点。在下面打几个字试试看。</p>`,
      en: `<p>A model does not know letters, only numbers. So a sentence is first <b>cut into pieces</b>, like a cake: common words stay whole, rare ones are cut smaller. Type something below and see.</p>`,
    },
    c_T3_4: {
      keep: true,
      zh: `<p>模型一次能看的字数有上限，像一扇<b>窗户</b>：话太长，最早的部分就挪出窗外，它就“看不见”了。拖动滑块改变窗户大小试试。</p>`,
      en: `<p>A model can only look at so much text at once, like a <b>window</b>: when the conversation gets too long, the oldest part slides out of view and it can no longer “see” it. Drag the slider to change the window size.</p>`,
    },
    c_T3_5: {
      keep: true,
      zh: `<p>大模型是分好几个阶段“上学”教出来的，像先上小学打基础、再学规矩、再参加考试练习。点图里的方块看每个阶段学什么。</p>`,
      en: `<p>A large model is taught in several stages of “school”: first the basics, then the rules, then practice tests. Tap the boxes in the picture to see what each stage teaches.</p>`,
    },
    c_T3_6: {
      keep: true,
      zh: `<p>MoE 就像一家医院有很多位<b>专科医生</b>，门口有个分诊台：每个词只被送去看其中一两位，不用所有医生都出马。医生总数多了，但每个词花的力气没多多少。</p>`,
      en: `<p>MoE is like a hospital with many <b>specialist doctors</b> and a front desk that sends each patient on: each word sees only one or two of them, not every doctor. There are more doctors in total, but each word costs little more effort.</p>`,
    },
    xReason: {
      zh: `<p>有的模型会<b>先打草稿再回答</b>，就像做数学题先写步骤：慢一点、费字数，但多步的数学题、写程序、做计划会准很多。查个事实、改写句子这种简单事，直接答就够了。</p>`,
      en: `<p>Some models <b>write a rough draft before answering</b>, like writing out the steps of a maths problem: slower and wordier, but much more accurate on multi-step maths, code and planning. For simple jobs like looking up a fact or rewording a sentence, answering straight away is enough.</p>`,
    },
    xHalluc: {
      zh: `<p>“幻觉”就是模型<b>一本正经地说错话</b>。原因之一：只见过一两次的冷门事实本来就记不牢，它只好挑一个“听起来像”的；原因之二：很多考试答错和说“不知道”一样得 0 分，等于鼓励它瞎猜。办法有：先查资料、标出处、再核对一遍，以及允许它说“我不确定”。这些能减少，但不能完全消除。</p>`,
      en: `<p>A “hallucination” is when the model <b>says something wrong with a straight face</b>. One reason: rare facts it saw once or twice are hard to remember, so it picks something that “sounds right”. Another: many tests give 0 points both for a wrong answer and for “I don’t know”, which rewards guessing. Fixes: look things up first, cite sources, double-check, and allow “I’m not sure”. These reduce it, but cannot remove it completely.</p>`,
    },
    xIcl: {
      zh: `<p>在问题前面放几个<b>例子</b>，模型就能照着做，像老师先做两道示范题。模型本身一点没变，例子只在这一次对话里起作用。</p>`,
      en: `<p>Put a few <b>examples</b> in front of the question and the model follows them, like a teacher working two sample problems first. The model itself does not change at all; the examples only count in this one conversation.</p>`,
    },
    xDecode: {
      zh: `<p>每一步都挑最好的词，整句不一定最好，就像下棋只看眼前一步可能会输。<b>束搜索</b>同时留着几条候选句，最后挑整句最好的那条。<b>困惑度</b>是给模型的打分：它越能猜中真正的下一个词，这个数就越小。</p>`,
      en: `<p>Picking the best word at every step does not always give the best sentence, just as only thinking one move ahead in chess can lose the game. <b>Beam search</b> keeps several candidate sentences at once and picks the best whole one at the end. <b>Perplexity</b> scores the model: the better it guesses the real next word, the smaller the number.</p>`,
    },
    labTok: {
      zh: `<p>打一句话，看它被切成哪些小块（token）：颜色告诉你每块是整词、碎片，还是只能按字节硬拆。</p>`,
      en: `<p>Type a sentence and see the pieces (tokens) it is cut into; the colours show whether each piece is a whole word, a fragment, or had to be split into raw bytes.</p>`,
    },
    labBpe: {
      zh: `<p>从单个字母开始，每次把最常挨在一起的两块粘成一块，一步步“长”出一本词表。</p>`,
      en: `<p>Start from single letters, and each time glue together the two pieces that sit side by side most often, growing a vocabulary step by step.</p>`,
    },
    labNext: {
      zh: `<p>你来挑下一个词。T 是“温度”：越高越爱冒险，越低越保守；top-k 只留前 k 名；top-p 只留加起来够 p 这么多机会的前几名。</p>`,
      en: `<p>You pick the next word. T is the “temperature”: higher means more adventurous, lower more careful; top-k keeps only the top k words; top-p keeps only the top words whose chances add up to p.</p>`,
    },
    labVote: {
      zh: `<p>让模型把同一道题想 N 遍再投票。p 是想一遍就答对的机会。看看想得越多是不是总越好（这里的数字是示意）。</p>`,
      en: `<p>Let the model think about the same question N times, then vote. p is the chance that one try is right. See whether more tries always help (the numbers here are illustrative).</p>`,
    },
    labBeam: {
      zh: `<p>k 是同时留着几条候选句。k = 1 就是每步只挑眼前最好的；把 k 调成 2，看结果会不会更好。</p>`,
      en: `<p>k is how many candidate sentences are kept at once. k = 1 means always taking the best word right now; set k to 2 and see whether the result gets better.</p>`,
    },
    labPpl: {
      zh: `<p>p 是模型给“真正的下一个词”的机会。拖动四个 p，看困惑度怎么变：只要有一个猜得很差，数字就会冲上去。</p>`,
      en: `<p>p is the chance the model gave to the real next word. Drag the four p sliders and watch the perplexity: one really bad guess is enough to push the number up.</p>`,
    },
  },
};
export default T3;
