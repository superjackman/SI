/* R15 plain-language layer for K5 (derivations: backprop, p − y, √dₖ, residuals, policy gradient). */
import type { PStation } from './types';
import { B } from './types';

const K5: PStation = {
  cards: {
    c_K5_0: {
      zh: `<p>前面几站学的工具（坡度、链式法则、机会大小、数表），在这里拿来解释<b>真实模型里最重要的几条公式</b>。就像学会了加减乘除，现在去算一笔真正的账。</p>
<p>每一条都一步一步证明，并写清楚它需要什么前提。看懂了这些，就知道模型为什么要这样设计：不是拍脑袋，而是为了让“该怎么调”的消息能顺利传到每个旋钮。</p>`,
      en: `<p>The tools from the last few stops (slopes, the chain rule, chances, tables of numbers) are used here to explain <b>the most important formulas in real models</b>. It is like learning to add and multiply, then doing some real sums.</p>
<p>Each one is proved step by step, with its assumptions spelled out. Once you follow them, you see why models are built the way they are: not by guesswork, but so that the “how to adjust” message reaches every knob.</p>`,
    },
    c_K5_1: {
      zh: `<p>网络是一条<b>一层接一层的流水线</b>。最后算出错了多少，就要知道每个旋钮该往哪拧、拧多少。</p>
<p><b>反向传播</b>就像<b>从终点往回传话</b>：最后一层先算出“错误里有多少该我负责”，再按连线的粗细（权重）把这份责任分给前一层，一层一层往回传。每一层都直接用上后一层算好的结果，所以往回算一遍的工作量，和正着算一遍差不多，不用每个旋钮各算一遍。</p>`,
      en: `<p>A network is <b>an assembly line, one layer after another</b>. Once you know how wrong the final answer is, you need to know which way, and how far, to turn every knob.</p>
<p><b>Backpropagation</b> is like <b>passing a message back from the finish line</b>: the last layer works out “how much of the error is my fault”, then shares that blame with the layer before it according to how thick each connection is (the weights), and so on back, layer by layer. Each layer reuses what the layer after it already worked out, so going backwards costs about as much as going forwards once, instead of a separate calculation for every knob.</p>`,
      more: B(`“该负的责任”准确地说是损失对每一层中间结果的偏导数（叫“误差信号”）。“工作量差不多”是说同一个量级（相差一个常数倍），不是完全相等。`,
        `The “blame” is, precisely, the partial derivative of the loss with respect to each layer’s in-between result (called the “error signal”). “About as much work” means the same order of magnitude (within a constant factor), not exactly equal.`),
    },
    labGradCheck: {
      zh: `<p>一个最小的网络：w₁、w₂ 是两个旋钮（权重），x 是输入，y 是正确答案，h 是中间结果，ŷ（y 戴帽子）是模型的输出，L 是损失，σ 是把数压到 0 和 1 之间的函数。拖动 w₁、w₂，比一比两列数字：一列用推导出的公式算坡度，另一列用“把旋钮挪一点点，看损失变了多少”硬算出来。</p>`,
      en: `<p>The smallest network: w₁ and w₂ are two knobs (weights), x is the input, y the correct answer, h the in-between result, ŷ (y with a hat) the model’s output, L the loss, and σ a function that squeezes numbers to between 0 and 1. Drag w₁ and w₂ and compare the two columns: one works out the slope with the derived formula, the other by brute force: “nudge the knob a tiny bit and see how much the loss changes”.</p>`,
    },
    c_K5_2: {
      zh: `<p>模型给每个词打分，softmax 把分数变成机会，交叉熵给“猜得多差”打分。这里有一个特别简洁的结果：每个分数该怎么调，就看<b>“模型给的机会 − 正确答案的机会”</b>。</p>
<p>比如（示意）正确的词模型只给了 0.3 的机会：0.3 − 1 = −0.7，坡度是负的，往下坡走就是把这个词的分数<b>调高</b>；一个错误的词给了 0.2：0.2 − 0 = 0.2，就把它的分数<b>调低</b>。错得越离谱，调得越多；只要还没猜对，这个差就不会因为分数很极端而变成 0。</p>`,
      en: `<p>The model scores every word, softmax turns the scores into chances, and cross-entropy scores “how badly it guessed”. The result is strikingly simple: how to adjust each score is just <b>“the model’s chance − the correct answer’s chance”</b>.</p>
<p>For example (illustrative), if the model gives the correct word only a 0.3 chance: 0.3 − 1 = −0.7, a negative slope, so walking downhill <b>raises</b> that word’s score; a wrong word given 0.2: 0.2 − 0 = 0.2, so its score is <b>lowered</b>. The worse the mistake, the bigger the adjustment; as long as the guess is not right yet, this difference does not shrink to 0 just because the scores are extreme.</p>`,
      more: B(`“正确答案的机会”可以是一张只有一个 1、其余都是 0 的表（独热），也可以是任何加起来等于 1 的分布，结论都成立。每个差都在 −1 到 1 之间。`,
        `“The correct answer’s chance” can be a table with a single 1 and 0 everywhere else (one-hot), or any distribution that adds up to 1; the result holds either way. Every difference lies between −1 and 1.`),
    },
    c_K5_3: {
      zh: `<p>注意力里，每个词拿自己的一串数（<b>查询</b>）去和别的词的一串数（<b>键</b>）“对应相乘再加起来”，得到一个配对分数。数串越长，加起来的项越多，分数就越容易变得特别大或特别小，就像<b>抛 64 次硬币</b>（正面 +1、反面 −1）的总分，比只抛 1 次波动大得多。</p>
<p>分数差得太远，softmax 会把几乎全部机会给一个词，其他词几乎学不到东西。所以先<b>除以“长度的平方根”</b>，把波动拉回正常大小。</p>`,
      en: `<p>In attention, each word takes its own list of numbers (the <b>query</b>) and multiplies it position by position with another word’s list (the <b>key</b>), adding everything up into a match score. The longer the lists, the more terms get added, and the more easily the score becomes very large or very small, just as the total from <b>tossing 64 coins</b> (heads +1, tails −1) swings far more than a single toss.</p>
<p>When scores are too far apart, softmax hands nearly all the chance to one word, and the others hardly learn anything. So the score is first <b>divided by the square root of the length</b>, bringing the swings back to normal size.</p>`,
      more: B(`这是原论文的解释，基于一个假设：两串数里的每个数都是互相独立、平均为 0、方差为 1 的随机数。真实模型不一定严格满足这个假设，所以它说明的是“为什么要缩放”，而不是一个精确保证。`,
        `This is the original paper’s explanation, which assumes every number in both lists is an independent random number with average 0 and variance 1. Real models need not satisfy that exactly, so it explains why scaling helps rather than guaranteeing anything precise.`),
    },
    c_K5_4: {
      zh: `<p><b>残差连接</b>：每一层不是把输入整个“换掉”，而是在原来的基础上<b>加一点修改</b>：输出 = 输入 + 修改量。就像改作文时在原稿上批注，而不是每次重写一遍。</p>
<p>好处在往回传话的时候：总有一条<b>直达的路</b>，消息可以原封不动地从最后一层传回第一层。没有这条路时，每一层都可能把消息打个折，比如（示意）每层打五折，20 层以后几乎什么都不剩了。</p>`,
      en: `<p>A <b>residual connection</b>: each layer does not replace its input outright; it <b>adds a small change</b> on top: output = input + change. Like marking up a draft essay instead of rewriting it from scratch every time.</p>
<p>The payoff comes when the message travels back: there is always a <b>direct road</b> on which the message goes from the last layer back to the first unchanged. Without it, every layer can shrink the message; if (illustrative) each layer halves it, after 20 layers almost nothing is left.</p>`,
      more: B(`“原封不动”是说梯度里总有一项不经过任何一层的缩放直接传回；其余各项仍然会被各层改变，所以整个梯度并不保证不变。`,
        `“Unchanged” means the gradient always contains one term that comes straight back without being scaled by any layer; the other terms are still changed by the layers, so the gradient as a whole is not guaranteed to stay the same.`),
    },
    c_K5_5: {
      zh: `<p>训练模型做题时，有时只知道<b>“答对给 1 分，答错给 0 分”</b>，不知道“差多少”。这种分数本身没法求坡度。</p>
<p>办法是：让模型答很多次，<b>答得好的回答，就把它每个词的机会调高一点；答得差的，就调低一点</b>。更聪明的做法是和<b>平均分</b>比：比平均好的才调高，比平均差的就调低，这样学得更稳。</p>`,
      en: `<p>When training a model on problems, sometimes all you know is <b>“1 point if right, 0 if wrong”</b>, not “how far off”. A score like that has no slope on its own.</p>
<p>The trick: let the model answer many times; <b>for answers that did well, raise the chance of each of their words a little; for answers that did badly, lower it</b>. Smarter still is to compare with the <b>average score</b>: raise only what beats the average and lower what falls below it, which makes learning steadier.</p>`,
      more: B(`准确地说，被优化的是“平均能得多少分”（期望奖励），它对旋钮是可以求导的。减去平均分（基线）不改变梯度的期望，只是减小它的抖动（方差）；基线可以依赖题目，但不能依赖这一次的回答本身。`,
        `Precisely, what gets optimised is “the score you get on average” (the expected reward), which can be differentiated with respect to the knobs. Subtracting the average (a baseline) leaves the gradient’s expected value unchanged and only reduces its wobble (variance); the baseline may depend on the problem, but not on this particular answer.`),
    },
  },
  ctx: {
    '*': {
      'v:L': B('损失：模型错得有多厉害', 'the loss: how wrong the model is'),
      'v:e': '=euler',
      'theta': B('模型所有的“旋钮”（参数）放在一起', 'all of the model’s “knobs” (parameters) together'),
    },
    c_K5_1: {
      'v:x': B('输入的一串数', 'the input: a list of numbers'),
      'v:W': B('权重：一张数表，记着每条连线有多粗', 'the weights: a table of numbers saying how thick each connection is'),
      'v:b': B('偏置：每个输出各自再加上的一个数', 'the bias: one extra number added to each output'),
      'v:z': B('加权求和以后的中间结果（还没经过激活函数）', 'the in-between result after the weighted sum (before the activation function)'),
      'v:h': B('经过激活函数以后的中间结果（隐藏层）', 'the in-between result after the activation function (the hidden layer)'),
      'phi': B('激活函数：把每个数分别“掰弯”一下的函数', 'the activation function: bends each number on its own'),
      'ell': B('把最后的结果变成损失的那个函数', 'the function that turns the final result into the loss'),
      'delta': B('误差信号：损失对这一层中间结果的偏导数，也就是“这一层该负多少责任”', 'the error signal: the partial derivative of the loss with respect to this layer’s in-between result, i.e. “how much blame this layer carries”'),
      'v:i': B('编号：这一层的第几个输出', 'a label: which output of this layer'),
      'v:j': B('编号：输入的第几个数', 'a label: which input number'),
      'v:k': B('编号：中间结果的第几个数', 'a label: which in-between number'),
      'v:l': B('编号：第几层', 'a label: which layer'),
      'sup': { ...B('右上角带括号的数字或字母表示“第几层”，不是次方', 'a raised number or letter in brackets says “which layer”; it is not a power'), r: B('“第……层”（右上角带括号的小字）', '“layer …” (the raised label in brackets)') },
    },
    c_K5_2: {
      'v:z': B('打分：模型给每个词打的原始分', 'scores: the raw score the model gives each word'),
      'v:p': B('softmax 变出来的机会', 'the chances that softmax produces'),
      'v:y': B('正确答案的机会分布（独热时，只有正确的那个是 1）', 'the correct answer’s chances (for one-hot, only the right one is 1)'),
      'v:i': B('编号：要调的是第几个分数', 'a label: which score is being adjusted'),
      'v:k': B('编号：用来把所有词挨个数一遍', 'a label used to go through every word'),
      'v:j': B('编号：用来把所有词挨个数一遍', 'a label used to go through every word'),
      'delta': B('克罗内克 δ：两个编号相同时是 1，不同时是 0', 'the Kronecker δ: 1 when the two labels are the same, 0 when they differ'),
    },
    c_K5_3: {
      'w:Attention': B('注意力：每个词按配对分数，从别的词那里取信息', 'attention: each word takes information from the others according to the match scores'),
      'v:Q': B('查询表：每个词的“想找什么”排成一张表', 'the query table: each word’s “what am I looking for”, stacked into a table'),
      'v:K': B('键表：每个词的“能提供什么”排成一张表', 'the key table: each word’s “what can I offer”, stacked into a table'),
      'v:V': B('值表：每个词真正交出去的内容', 'the value table: what each word actually hands over'),
      'v:q': B('查询：一个词的一串数，代表“想找什么”', 'a query: one word’s list of numbers meaning “what am I looking for”'),
      'v:k': B('键：一个词的一串数，代表“能提供什么”', 'a key: one word’s list of numbers meaning “what can I offer”'),
      'v:k@v:d': B('键：代表“能提供什么”的一串数；写在 d 的右下角时只是说“键的”', 'a key: a list of numbers meaning “what can I offer”; at the lower right of d it just means “of the keys”'),
      'v:d': B('一个查询或键有几个数（它的长度）', 'how many numbers a query or key has (its length)'),
      'v:i': B('编号：第几个数', 'a label: which number in the list'),
      'v:m': B('编号：拿到几乎全部机会的那个位置', 'a label: the position that gets nearly all the chance'),
      'v:p': B('softmax 给出的机会', 'the chances softmax gives'),
      'delta': B('克罗内克 δ：两个编号相同时是 1，不同时是 0', 'the Kronecker δ: 1 when the two labels are the same, 0 when they differ'),
      'mu': B('平均值', 'the average'),
      'v:X': B('一个随机的数', 'a random number'),
      'v:c': B('一个固定的数', 'a fixed number'),
      'w:Var': B('方差：结果离平均值通常有多远（取平方后再平均）', 'variance: how far results usually land from the average (squared, then averaged)'),
    },
    c_K5_4: {
      'v:x': B('进入一层的数（右下角写着已经经过了几层）', 'the numbers going into a layer (the label at the lower right says how many layers they have passed)'),
      'v:y': B('这一层的输出', 'this layer’s output'),
      'v:F': B('这一层算出来的“修改量”', 'the “change” this layer works out'),
      'v:I': B('单位矩阵：什么都不改变的数表，相当于乘 1', 'the identity matrix: a table that changes nothing, like multiplying by 1'),
      'v:J': B('雅可比：一张数表，记着一层的修改量对输入有多敏感', 'the Jacobian: a table saying how sensitive a layer’s change is to its input'),
      'v:L': B('一共堆了多少层', 'how many layers are stacked'),
      'v:L@nabla': B('这里有两种身份：写在右下角时是层数，单独写时是损失', 'two roles here: at the lower right it is the number of layers; on its own it is the loss'),
      'v:R': B('展开以后，除了单独那一项以外剩下的所有项', 'everything left after expanding, apart from the lone single term'),
      'v:l': B('编号：第几层', 'a label: which layer'),
    },
    c_K5_5: {
      'pi': { ...B('策略：就是模型本身，给每个可能的回答一个机会大小（这里不是圆周率）', 'the policy: the model itself, giving every possible answer a chance (not the circle number here)'), r: B('“派”', '“pi”') },
      'v:x': B('提示：给模型的题目', 'the prompt: the problem given to the model'),
      'v:y': B('模型生成的回答', 'the answer the model produces'),
      'v:R': B('奖励：给这个回答打的分（比如对了 1、错了 0）', 'the reward: the score this answer gets (say 1 if right, 0 if wrong)'),
      'v:J': B('目标：平均能得多少分（期望奖励）', 'the goal: the score you get on average (the expected reward)'),
      'v:b': B('基线：拿来比较的平均分', 'the baseline: the average score used for comparison'),
      'v:t': B('编号：回答里的第几个词', 'a label: which word of the answer'),
      'v:f': B('任意一个大于 0 的函数', 'any function that is above 0'),
      'v:a': B('被选中的那个词', 'the word that was picked'),
      'v:e': B('独热：只在被选中的位置是 1、其余都是 0 的一串数', 'one-hot: a list of numbers that is 1 at the picked position and 0 everywhere else'),
      'v:z': B('打分：最后一层给每个词的原始分', 'scores: the raw score the last layer gives each word'),
      'v:p': B('softmax 给出的机会', 'the chances softmax gives'),
      'cdot': { ...B('这里的点是占位：表示“任意一个回答”', 'the dot is a placeholder here: “any answer”'), r: B('“点”（占位）', '“dot” (a placeholder)') },
    },
    kBP: {
      'delta': B('误差信号：损失对这一层输出的偏导数（“这一层该负多少责任”）', 'the error signal: the partial derivative of the loss with respect to this layer’s output (“how much blame it carries”)'),
      'v:W': B('权重：一张数表，记着每条连线有多粗', 'the weights: a table of numbers saying how thick each connection is'),
      'v:x': B('这一层的输入', 'this layer’s input'),
    },
    kSCE: {
      'v:z': B('打分：模型给每个词打的原始分', 'scores: the raw score the model gives each word'),
      'v:p': B('softmax 变出来的机会', 'the chances that softmax produces'),
      'v:y': B('正确答案的机会分布', 'the correct answer’s chances'),
    },
    kSqrt: {
      'v:d': B('一个查询或键有几个数（它的长度）', 'how many numbers a query or key has (its length)'),
      'v:k@v:d': B('写在 d 的右下角，意思是“键的”', 'at the lower right of d it means “of the keys”'),
    },
    kRes: {
      'v:x': B('进入这一层的数', 'the numbers going into this layer'),
      'v:y': B('这一层的输出', 'this layer’s output'),
      'v:F': B('这一层算出来的“修改量”', 'the “change” this layer works out'),
      'v:I': B('单位矩阵：什么都不改变的数表，相当于乘 1', 'the identity matrix: a table that changes nothing, like multiplying by 1'),
    },
    kPG: {
      'pi': { ...B('策略：就是模型本身，给每个可能的回答一个机会大小（这里不是圆周率）', 'the policy: the model itself, giving every possible answer a chance (not the circle number here)'), r: B('“派”', '“pi”') },
      'tau': B('一整段回答：模型一步一步做出的选择', 'one whole answer: the choices the model makes step by step'),
      'v:R': B('奖励：给这段回答打的分', 'the reward: the score this answer gets'),
      'v:J': B('目标：平均能得多少分（期望奖励）', 'the goal: the score you get on average (the expected reward)'),
    },
  },
};
export default K5;
