/* R15 plain-language layer for T8 (the overview map, glossary table, progress and lab index). Only the glossary table
   (c_T8_1) has KaTeX: one short formula per maths entry, so its symbols get meanings below. */
import type { PStation } from './types';
import { B } from './types';

const T8: PStation = {
  cards: {
    c_T8_0: {
      keep: true,
      zh: `<p>这是整个网站的<b>一张大地图</b>：从上到下大致是“用 AI 做事 → 模型 → 模型里的零件 → 看图听声 → 怎么练出来 → 用什么机器跑”。点任何一个方块看它是什么，还能跳到讲它的那一站。</p>`,
      en: `<p>This is <b>one big map</b> of the whole site: from top to bottom, roughly “getting things done with AI → the model → the parts inside it → seeing and hearing → how it is trained → the machines it runs on”. Tap any box to see what it is and jump to the stop that explains it.</p>`,
    },
    c_T8_1: {
      keep: true,
      zh: `<p>这是一本<b>小词典</b>：所有零件按所在的站排好，每个配一句话。忘了某个词，就来这里查；点名字看详情，点“所在页”直接跳过去。</p>`,
      en: `<p>This is a <b>little dictionary</b>: every part is listed by the stop it belongs to, each with one sentence. Forgot a word? Look it up here; tap a name for details, or the page link to jump there.</p>`,
    },
    progCard: {
      keep: true,
      zh: `<p>这里记着<b>你走过哪些站、测验答对几题</b>，像一张集章卡。它只存在这台设备的浏览器里，不会上传。</p>`,
      en: `<p>This records <b>which stops you have visited and how many quiz questions you got right</b>, like a stamp card. It is stored only in this device’s browser and is never uploaded.</p>`,
    },
    labIndex: {
      keep: true,
      zh: `<p>全站所有<b>可以自己动手玩的实验</b>都在这里，每个写着在哪一站。点一个就过去。</p>`,
      en: `<p>All the <b>hands-on experiments</b> on the site are listed here, each with the stop it lives on. Tap one to go there.</p>`,
    },
  },
  /* every inline formula of the glossary table shares one symbol list (the card's "symbols in this text" list), so a letter
     used in several rows says what it means in each row */
  ctx: {
    c_T8_1: {
      'v:x': B('“极限”“链式法则”“雅可比”几行：输入的数；“期望”那行：X 可能取到的某个结果；“残差”那行：进入这一层的那串数', 'limit, chain-rule and Jacobian rows: the input number; expectation row: one result X could be; residual rows: the numbers going into the layer'),
      'v:a': B('“极限”那行：x 要靠近的数；“点积”那行：一个向量（一串数）；“行列式”那行：2×2 表格左上角的数', 'limit row: the number x gets close to; dot-product row: a vector (a list of numbers); determinant row: the top-left number of the 2×2 table'),
      'v:b': B('“点积”那行：另一个向量；“行列式”那行：表格右上角的数', 'dot-product row: another vector; determinant row: the top-right number of the table'),
      'v:c': B('“行列式”那行：2×2 表格左下角的数', 'determinant row: the bottom-left number of the 2×2 table'),
      'v:d': B('“行列式”那行：表格右下角的数；dₖ（“√dₖ 缩放”那行）：每张标签卡里有几个数', 'determinant row: the bottom-right number of the table; dₖ (the √dₖ row): how many numbers are on each key card'),
      'v:k': B('“矩阵乘法”那行：编号，把第 k 个和第 k 个相乘再全部加起来；dₖ 里的 k 指 key（标签卡）', 'matrix-product row: a counter, multiply item k with item k and add them all up; the k in dₖ stands for key (the key card)'),
      'v:i': B('编号：第几个（矩阵里是第几行，softmax 里是第几个词）', 'a counter: which one (the row in a matrix, the word in softmax)'),
      'v:j': B('编号：第几个（矩阵里是第几列，softmax 里把每个词 j 都加起来）', 'a counter: which one (the column in a matrix; in softmax, add up over every word j)'),
      'v:f': B('一个函数：吃进数、吐出数的“机器”（“链式法则”那行是外面那层）', 'a function: a “machine” that takes in and gives back numbers (the outer one in the chain-rule row)'),
      'v:g': B('“链式法则”那行：里面那层函数（先算的那台机器）', 'chain-rule row: the inner function (the machine that runs first)'),
      'v:y': B('“雅可比”那行：机器吐出的数；“p − y”那行：正确答案（对的词是 1，其余是 0）；“残差”那行：这一层的结果', 'Jacobian row: the numbers the machine gives back; p − y row: the right answer (1 for the correct word, 0 for the rest); residual row: the layer’s result'),
      'v:J': B('“雅可比”那行：每个输出对每个输入有多敏感的一张表；“策略梯度”那行：平均能拿多少奖励', 'Jacobian row: a table of how sensitive each output is to each input; policy-gradient row: the average reward we get'),
      'v:A': B('“矩阵”几行：一张数字表；“贝叶斯”那行：一件我们关心的事', 'matrix rows: a table of numbers; Bayes row: an event we care about'),
      'v:B': B('“矩阵乘法”那行：另一张数字表；“贝叶斯”那行：我们看到的证据', 'matrix-product row: another table of numbers; Bayes row: the evidence we see'),
      'v:X': B('一个随机的结果，比如掷骰子掷出几点', 'a random result, such as what a dice roll shows'),
      'v:p': B('机会：每种结果（或每个词）各有多大机会，0 到 1 之间，全部加起来是 1；“p − y”那行是模型猜的机会', 'chances: how likely each result (or word) is, between 0 and 1, adding up to 1; in the p − y row, the model’s guessed chances'),
      'v:q': B('拿来猜 p 的另一组机会（模型猜的）', 'another set of chances used to guess p (the model’s guess)'),
      'v:z': B('分数：每个候选词一个，可正可负', 'the scores: one per candidate word, can be positive or negative'),
      'v:e': '=euler',
      'v:H': B('H(p)：熵，结果有多难猜；H(p, q)：交叉熵，用 q 去猜 p 有多差', 'H(p): entropy, how hard the result is to guess; H(p, q): cross-entropy, how bad guessing p with q is'),
      'v:L': B('损失：猜得有多差的一个数，越小越好', 'the loss: one number for how bad the guesses are; smaller is better'),
      'v:P': B('P(…)：括号里的事发生的机会', 'P(…): the chance of what is in the brackets'),
      'v:R': B('奖励：这次输出得了多少分', 'the reward: how many points this output scored'),
      'v:F': B('这一层自己算出来的那部分', 'the part this layer works out itself'),
      'v:I': B('单位矩阵：对角线是 1、其余是 0，相当于“原样不动”', 'the identity matrix: 1 on the diagonal, 0 elsewhere, i.e. “leave it unchanged”'),
      eta: B('学习率：每一步迈多大', 'the learning rate: how big each step is'),
      theta: B('模型的全部参数（所有旋钮）', 'all the model’s parameters (every knob)'),
      tau: B('模型的一次完整输出（一串词或一串动作）', 'one complete output of the model (a string of words or actions)'),
      pi: { ...B('策略：就是模型本身，给每个可能的输出一个机会大小（这里不是圆周率）', 'the policy: the model itself, giving every possible output a chance (not the circle number here)'), r: B('“派”', '“pi”') },
      'w:KL': B('KL 散度：两个机会分布差多远（相等时是 0）', 'KL divergence: how far apart two sets of chances are (0 when equal)'),
    },
  },
};
export default T8;
