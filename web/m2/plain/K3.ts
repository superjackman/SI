/* R15 plain-language layer for K3 (probability: distributions, Bayes, softmax, entropy, KL). */
import type { PStation } from './types';
import { B } from './types';

const K3: PStation = {
  cards: {
    c_K3_0: {
      zh: `<p>AI 说话，其实是在一遍遍“<b>猜下一个词</b>”。它不只猜一个，而是给每个可能的词一个<b>机会大小</b>（概率）：比如“今天天气真___”，“好”占七成、“热”占两成、别的词分剩下的一成（示意）。</p>
<p>这一站讲三件事：机会大小怎么算、模型打的分数怎么变成机会（softmax）、怎么给“猜得有多差”打分（交叉熵）。训练，就是让这个“差”的分数越来越小。</p>`,
      en: `<p>When an AI talks, it is really <b>guessing the next word</b>, again and again. It does not guess just one: it gives every possible word a <b>chance</b> (a probability). For “The weather today is so ___”, “nice” might get 70%, “hot” 20%, and all the other words share the last 10% (illustrative).</p>
<p>This stop covers three things: how chances work, how the model’s scores become chances (softmax), and how to score “how badly it guessed” (cross-entropy). Training means making that “badness” score smaller and smaller.</p>`,
    },
    c_K3_1: {
      zh: `<p>掷一颗骰子，1 到 6 每个数的机会都是六分之一；所有机会<b>加起来正好是 1</b>（也就是 100%）。这样一张“每种结果各有多少机会”的表，叫<b>分布</b>。</p>
<p><b>期望</b>就是“玩很多很多次，平均能得到多少”：骰子的期望是 3.5（虽然一次也掷不出 3.5）。<b>方差</b>说的是“每次的结果离平均值有多分散”：数字跳得越厉害，方差越大。</p>`,
      en: `<p>Roll a die: each number from 1 to 6 has a one-in-six chance, and all the chances <b>add up to exactly 1</b> (that is, 100%). A table like this, “how much chance each result has”, is called a <b>distribution</b>.</p>
<p>The <b>expected value</b> is “what you get on average if you play many, many times”: for a die it is 3.5 (even though no single roll can give 3.5). The <b>variance</b> says how spread out the results are around that average: the more the numbers jump around, the bigger it is.</p>`,
      more: B(`方差量的是“离平均值的距离的平方”的平均，所以它的单位是原来单位的平方；开根号得到的标准差才和原来的单位一样。期望可以拆开相加，不需要两个东西互不影响；但“方差可以相加”只在两者互相独立（更准确地说，不相关）时才成立。`,
        `The variance averages the squared distance from the average, so its unit is the original unit squared; its square root, the standard deviation, has the original unit. Expected values can always be added, even when two things affect each other; but variances add only when the two are independent (more exactly, uncorrelated).`),
    },
    c_K3_2: {
      zh: `<p><b>条件概率</b>：知道了一件事以后，另一件事的机会会变。比如“地上湿了”这件事发生后，“刚下过雨”的机会就变大了。</p>
<p><b>贝叶斯公式</b>帮你把“知道了 B，A 的机会”和“知道了 A，B 的机会”互相换算。一个有名的例子（示意）：一种病很少见，检测又偶尔误报，那么就算检测结果是阳性，真得病的机会也可能只有六分之一，因为健康的人多得多，误报的人数反而更多。</p>
<p>语言模型算的正是条件概率：“已经知道前面这些词，下一个词是什么”的机会。</p>`,
      en: `<p><b>Conditional probability</b>: once you know one thing, the chance of another can change. Once you know “the ground is wet”, the chance that “it just rained” goes up.</p>
<p><b>Bayes’ rule</b> converts between “the chance of A once we know B” and “the chance of B once we know A”. A famous example (illustrative): a disease is rare and the test sometimes gives false alarms, so even after a positive test the chance of really being ill can be only about one in six, because there are so many more healthy people that the false alarms outnumber the real cases.</p>
<p>A language model computes exactly such chances: “given the words so far, what comes next?”</p>`,
    },
    c_K3_3: {
      zh: `<p>模型给每个候选词打一个<b>分数</b>，分数可正可负，加起来也不是 1，还不能当机会用。<b>softmax</b> 是一台“换算机”：分数越高，分到的机会越大；而且换算后每个机会都大于 0，加起来正好是 1。</p>
<p>有个有趣的性质：所有分数<b>同时加上同一个数</b>，换出来的机会完全不变，就像全班每人都加 5 分，名次不变。</p>
<p>“<b>温度</b>”是一个旋钮：调低，机会几乎全给最高分的词（回答更确定）；调高，机会分得更平均（回答更随机）。</p>`,
      en: `<p>The model gives every candidate word a <b>score</b>. Scores can be negative and do not add up to 1, so they are not chances yet. <b>Softmax</b> is a “converter”: the higher the score, the bigger the chance, and afterwards every chance is above 0 and they add up to exactly 1.</p>
<p>A neat fact: <b>add the same number to every score</b> and the chances do not change at all, like giving everyone in a class 5 extra points: the ranking stays the same.</p>
<p>The <b>temperature</b> is a knob: turn it down and almost all the chance goes to the top-scoring word (more certain answers); turn it up and the chances even out (more random answers).</p>`,
      more: B(`“加同一个数不变”是因为 softmax 只看分数之间的差；但如果把所有分数乘上同一个数，结果就会变，这正是温度在做的事。名次不变的比喻也只说明了“谁大谁小”不变，而 softmax 不只保持名次，连机会的具体比例也完全不变。`,
        `“Adding the same number changes nothing” because softmax only looks at differences between scores; multiplying every score by the same number does change the result, which is exactly what temperature does. The class-ranking picture only shows that the order is kept; softmax keeps more than that: even the exact ratios of the chances stay the same.`),
    },
    labSoftmax: {
      zh: `<p>自己给三个候选词打分（z₁、z₂、z₃ 就是第 1、2、3 个词的分数），拖动温度 T，看分数怎么变成机会，以及“猜得有多差”（损失）怎么跟着变。</p>`,
      en: `<p>Give three candidate words your own scores (z₁, z₂, z₃ are the scores of words 1, 2 and 3), drag the temperature T, and watch the scores turn into chances and the “how badly it guessed” number (the loss) change with them.</p>`,
    },
    c_K3_4: {
      zh: `<p><b>熵</b>量的是“有多难猜”或“有多意外”：天天晴天的地方，明天晴天一点也不意外；天气乱变的地方，结果就很难猜，熵就大。越不可能的事发生了，越让人惊讶。</p>
<p><b>交叉熵</b>：用模型的猜法去面对真实答案时，平均有多惊讶。如果正确的词模型只给了很小的机会，它就会很“惊讶”，损失就大；给的机会越大，损失越小，给满 100% 时损失是 0。训练语言模型用的就是它。</p>`,
      en: `<p><b>Entropy</b> measures how hard something is to guess, or how surprising it is: where it is sunny every day, a sunny tomorrow is no surprise; where the weather keeps changing, it is hard to guess and the entropy is high. The less likely something is, the more surprising it is when it happens.</p>
<p><b>Cross-entropy</b> is how surprised the model is, on average, when its guesses meet the real answers. If the model gave the right word only a small chance, it is very “surprised” and the loss is big; the more chance it gave, the smaller the loss, and at 100% the loss is 0. This is what language models are trained on.</p>`,
      more: B(`“惊讶程度”在数学里有精确的值：一件机会为 p 的事发生，惊讶程度是 −log p；熵是它的平均。交叉熵总是不小于熵，多出来的部分就是下一张卡的 KL 散度。`,
        `“Surprise” has an exact value in maths: when something with chance p happens, the surprise is −log p, and entropy is its average. Cross-entropy is never smaller than entropy; the extra part is the KL divergence on the next card.`),
    },
    c_K3_5: {
      zh: `<p><b>KL 散度</b>量的是：两种猜法（两个分布）差得有多远。它就像“用错地图多走的冤枉路”：用对的地图，冤枉路是 0；地图越错，多走的路越多，但永远不会是负的。</p>
<p>这张卡证明它永远 ≥ 0，而且只有两种猜法完全一样时才等于 0。训练时常用它当“绳子”，拉着新模型别离原来的模型太远。</p>`,
      en: `<p>The <b>KL divergence</b> measures how far apart two ways of guessing (two distributions) are. Think of it as “the extra distance you walk with the wrong map”: with the right map it is 0; the worse the map, the more extra walking, but it is never negative.</p>
<p>This card proves it is always ≥ 0, and equals 0 only when the two ways of guessing are exactly the same. In training it is often used as a “leash” that stops a new model from drifting too far from the original one.</p>`,
      more: B(`KL 散度不是真正的“距离”：从 p 看 q 和从 q 看 p，结果一般不一样。“冤枉路”的比喻对应的是信息论里的意思：用按 q 设计的编码去记录其实按 p 出现的结果，平均每个结果多用的长度。`,
        `KL divergence is not a true distance: measured from p to q and from q to p it usually gives different answers. The “wrong map” picture matches its meaning in information theory: the average extra length per result when you use a code designed for q to record results that really follow p.`),
    },
  },
  ctx: {
    '*': {
      'v:x': B('一个可能出现的结果（比如骰子掷出的点数）', 'one possible result (such as the number a die shows)'),
      'v:p': B('“真实的”猜测：每个结果出现的机会有多大', 'the “real” guess: how likely each result is'),
      'v:p@fx,v:x': B('p(x)：结果 x 出现的机会有多大（0 到 1 之间）', 'p(x): how likely result x is (between 0 and 1)'),
      'v:q': B('另一种猜测：拿来和 p 比较、或者去模仿 p 的那一个', 'the other guess: the one compared with p, or trying to match p'),
      'v:e': '=euler',
      'w:KL': B('KL 散度：量一量两种猜测差了多少', 'KL divergence: measures how far apart two guesses are'),
      'v:D': B('“差多少”的记号，下标 KL 说明是哪一种量法', 'a sign for “how different”; the label KL says which way of measuring'),
      'v:H': B('熵：平均有多“意外”（结果越难猜，它越大）', 'entropy: how “surprised” you are on average (the harder to guess, the bigger)'),
      'v:H@v:q': B('H(p)：p 自己的平均意外；H(p, q)：结果按 p 出现、却按 q 去猜时的平均意外', 'H(p): p’s own average surprise; H(p, q): the average surprise when results follow p but you guess with q'),
      'v:n': B('一共有几种可能的结果', 'how many possible results there are'),
    },
    c_K3_1: {
      'v:X': B('一个“随机的数”：还没掷的骰子，掷完才知道是几', 'a “random number”: like a die not yet thrown; you only know it after the throw'),
      'v:Y': B('另一个随机的数', 'another random number'),
      'v:U': B('一个随机的数（和 V 互不影响）', 'a random number (not affecting V)'),
      'v:V': B('另一个随机的数（和 U 互不影响）', 'another random number (not affecting U)'),
      'v:a': B('一个固定的数（不随机）', 'a fixed number (not random)'),
      'v:b': B('另一个固定的数', 'another fixed number'),
      'v:c': B('一个固定的数，用来放大或缩小', 'a fixed number that scales things up or down'),
      'mu': B('平均值：掷很多很多次以后，结果的平均', 'the average: what the results average out to over very many throws'),
      'w:Var': B('方差：结果离平均值通常有多远（取平方后再平均）', 'variance: how far results usually land from the average (squared, then averaged)'),
    },
    c_K3_2: {
      'v:A': B('一件事（比如“生病了”）', 'one event (such as “is ill”)'),
      'v:B': B('另一件事（比如“检测结果是阳性”）', 'another event (such as “the test is positive”)'),
      'v:P': B('一件事发生的机会有多大（0 到 1 之间）', 'how likely an event is (between 0 and 1)'),
      'v:D': B('“真的生病了”这件事', 'the event “really is ill”'),
      'v:x': B('一句话里的一个词（第几个由下标说）', 'one word in a sentence (the label says which)'),
      'v:t': B('编号：第几个词', 'a label: which word'),
      'v:n': B('这句话一共有几个词', 'how many words the sentence has'),
    },
    c_K3_3: {
      'v:z': B('打分：模型给每个选项打的原始分（可以是负数）', 'scores: the raw score the model gives each option (can be negative)'),
      'v:p': B('变成的“机会”：每个选项被选中的可能性', 'the resulting “chances”: how likely each option is to be picked'),
      'v:i': B('编号：第几个选项', 'a label: which option'),
      'v:j': B('编号：用来把所有选项挨个数一遍', 'a label used to go through every option'),
      'v:c': B('给所有分数加上的同一个数', 'the same number added to every score'),
      'v:a': B('任意一个数', 'any number'),
      'v:b': B('任意另一个数', 'any other number'),
      'v:T': B('温度：调节“有多确定”的旋钮，越小越确定，越大越平均', 'temperature: a knob for “how sure”; smaller means surer, bigger means more even'),
    },
    c_K3_4: {
      'v:y': B('正确答案', 'the correct answer'),
      'w:onehot': B('“只有一个是对的”的猜测：正确答案的机会是 1，其余都是 0', 'the guess “only one is right”: the correct answer gets chance 1, all others 0'),
      'sub@w:onehot': B('右下角的 y：正确答案是哪一个', 'the small y at the lower right: which answer is correct'),
    },
    c_K3_5: {
      'v:t': B('一个大于 0 的数（证明里临时用的名字）', 'a number above 0 (a temporary name in the proof)'),
      'v:g': B('一个帮忙的函数，用来证明那个不等式', 'a helper function used to prove the inequality'),
      'v:u': B('“完全平均”的猜测：每个结果的机会都一样', 'the “perfectly even” guess: every result equally likely'),
    },
    kProb: {
      'v:X': B('一个“随机的数”：还没掷的骰子，掷完才知道是几', 'a “random number”: like a die not yet thrown; you only know it after the throw'),
    },
    kBayes: {
      'v:A': B('一件事（比如“生病了”）', 'one event (such as “is ill”)'),
      'v:B': B('另一件事（比如“检测结果是阳性”）', 'another event (such as “the test is positive”)'),
      'v:P': B('一件事发生的机会有多大（0 到 1 之间）', 'how likely an event is (between 0 and 1)'),
    },
    kSoft: {
      'v:z': B('打分：模型给每个选项打的原始分', 'scores: the raw score the model gives each option'),
      'v:p': B('变成的“机会”：每个选项被选中的可能性', 'the resulting “chances”: how likely each option is to be picked'),
      'v:i': B('编号：第几个选项', 'a label: which option'),
      'v:j': B('编号：用来把所有选项挨个数一遍', 'a label used to go through every option'),
    },
  },
};
export default K3;
