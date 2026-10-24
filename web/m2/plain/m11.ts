/* R23 plain openings for the "⚠️ 容易混淆" cards (m2/content/ext/m11.ts). keep: the comparison stays visible under it. */
import type { PCard } from './types';

const k = (zh: string, en: string): PCard => ({ keep: true, zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
export const CF_PLAIN: Record<string, Record<string, PCard>> = {
  T4b: {
    cfEmbOut: k('模型里有两张很像的大表，一张在最前面，一张在最后面。<b>前面那张像字典</b>：拿词去查，查到一张写满数字的“名片”。<b>后面那张像打分表</b>：拿模型最后想出来的那串数，去和每个词比一比，看谁最像，像的就可能是下一个词。一个是“词 → 数”，一个是“数 → 词”。',
      'The model has two big, similar-looking tables, one at the very front and one at the very end. <b>The front one is like a dictionary</b>: look a word up and you get a “name card” full of numbers. <b>The back one is like a score sheet</b>: take the numbers the model finally came up with and compare them with every word; the most alike is likely the next word. One is “word → numbers”, the other “numbers → word”.'),
    cfQkOut: k('注意力和最后的打分，用的是<b>同一招</b>：比一比两串数像不像。不同在于：注意力是回头看句子里<b>已经有的词</b>，把有用的信息拿过来；最后的打分是在<b>整本词表</b>里找一个最合适的词，接到句子后面。',
      'Attention and the final scoring use <b>the same trick</b>: checking how alike two lists of numbers are. The difference: attention looks back at the words <b>already in the sentence</b> and takes useful information from them; the final scoring searches <b>the whole vocabulary</b> for the best word to put next.'),
    labEmbOut: k('一步一步点下去：先查名片，再看名片怎么被改，再打分、变成百分比，最后抽一个词。',
      'Tap through it step by step: look up the cards, watch them get rewritten, score, turn scores into percentages, and finally draw a word.'),
    cfLogitProb: k('打分表先给每个词一个<b>分数</b>，分数可以是任何数；再用 softmax 把分数换成<b>百分比</b>，加起来正好 100%。分数是“原始成绩”，概率是“抽中的机会”。',
      'The scoring table first gives every word a <b>score</b>, which can be any number; softmax then turns the scores into <b>percentages</b> that add up to exactly 100%. A score is the “raw mark”; a probability is “the chance of being drawn”.'),
  },
  T4a: {
    cfQKV: k('每个词准备三张卡：<b>Q</b> 写着“我在找什么”，<b>K</b> 写着“我是什么样的”，<b>V</b> 写着“我能给你什么”。拿 Q 和别人的 K 比，比上了，就把对方的 V 拿过来一点。',
      'Every word prepares three cards: <b>Q</b> says “what I am looking for”, <b>K</b> says “what I am like”, <b>V</b> says “what I can give you”. Compare your Q with others’ K; where they match, take a bit of their V.'),
  },
  T4: {
    cfAttnFfn: k('一个 Transformer 块里有两件事：<b>注意力</b>是大家开会互相传话；<b>前馈网络</b>是散会后每人回座位自己想。一个“看别人”，一个“想自己”。',
      'A Transformer block does two things: <b>attention</b> is everyone in a meeting passing notes; the <b>feed-forward network</b> is each one back at their desk thinking alone. One “looks at others”, the other “thinks for itself”.'),
  },
  T3: {
    cfEmbPos: k('进模型前，每个词元带上两样东西：<b>它是谁</b>（词嵌入，查字典得到），和<b>它排第几</b>（位置信息）。同一个字放在不同位置，“是谁”不变，“排第几”变了。',
      'Before going in, every token carries two things: <b>who it is</b> (the embedding, from the dictionary) and <b>which place it is in</b> (position). Put the same word in a different place: “who” stays, “which place” changes.'),
    cfTok: k('模型读文字时，先用分词器把句子切成小块，这些小块叫<b>词元</b>。一块可能是一个字，也可能是半个词或一整个词，和我们平时说的“字”“词”不一样。',
      'Before reading, the model uses a tokenizer to cut the sentence into small chunks called <b>tokens</b>. A chunk may be one character, half a word or a whole word, which is not the same as what we normally call a “character” or a “word”.'),
    cfParamTok: k('“7B”是模型<b>脑子里有多少个数</b>（70 亿个），“128K”是它<b>一次能看多少个词元</b>。一个是脑子多大，一个是桌子多大。',
      '“7B” is <b>how many numbers are in the model’s brain</b> (7 billion); “128K” is <b>how many tokens it can look at in one go</b>. One is how big the brain is, the other how big the desk is.'),
    cfTrainUse: k('<b>训练</b>是上学：做题、对答案、改正，脑子里的数会变。<b>使用</b>是考试：只答题，不改脑子里的数。你和它聊天就是在“考试”。',
      '<b>Training</b> is going to school: do problems, check answers, correct mistakes; the numbers in its brain change. <b>Using it</b> is the exam: just answer, no changes inside. Chatting with it is an “exam”.'),
    cfTempTopP: k('挑下一个词时有两个旋钮：<b>温度</b>决定“只爱第一名，还是谁都给机会”；<b>top-p</b> 决定“先把哪些词赶出候选名单”。',
      'Two knobs control the next-word pick: <b>temperature</b> decides “favour first place, or give everyone a chance”; <b>top-p</b> decides “which words get kicked off the candidate list first”.'),
  },
  T7: {
    cfStages: k('大模型像学生上三段学：先<b>自己读遍图书馆</b>（预训练），再<b>跟老师做例题</b>（微调），最后<b>按老师打分改进</b>（偏好对齐）。三段都在改脑子里的数。',
      'A model goes through three stages of school: first <b>reading the whole library alone</b> (pretraining), then <b>doing worked examples with a teacher</b> (fine-tuning), then <b>improving from the teacher’s grades</b> (preference tuning). All three change the numbers in its brain.'),
  },
  T2: {
    cfAgentLlm: k('大模型像一个只会说话的大脑；<b>Agent</b> 是给它配上手脚的程序：大脑说“去查天气”，程序真的去查，再把结果告诉大脑。',
      'The model is like a brain that can only talk; the <b>agent</b> is the program that gives it hands and feet: the brain says “check the weather”, the program really checks it and tells the brain the result.'),
    cfCtxMem: k('模型只能看见<b>这一次</b>放在它面前的文字（上下文）。“记忆”和“查资料”是把东西存在外面，要用时再摆到它面前；只有“微调”才是真正把东西学进脑子里。',
      'The model can only see the text placed in front of it <b>this time</b> (the context). “Memory” and “looking things up” keep material outside and put it in front of it when needed; only “fine-tuning” really learns it into the brain.'),
  },
  N: {
    cfParamAct: k('<b>参数（权重）</b>是模型学会以后记在本子上的数；<b>激活值</b>是做一道题时写在草稿纸上的数，做完就扔；<b>激活函数</b>是一条固定的规则，比如“负数一律变 0”。',
      '<b>Parameters (weights)</b> are the numbers the model wrote in its notebook after learning; <b>activations</b> are the numbers on scrap paper while solving one problem, thrown away afterwards; an <b>activation function</b> is a fixed rule, such as “every negative becomes 0”.'),
  },
  T5: {
    cfMoeParams: k('MoE 模型像一家有很多专家的医院：所有专家都得<b>有位置坐</b>（总参数占显存），但每个病人只<b>看其中几位</b>（激活参数决定算多少）。',
      'An MoE model is like a hospital with many specialists: every specialist needs <b>a seat</b> (total parameters take memory), but each patient only <b>sees a few</b> (active parameters set the compute).'),
  },
};
