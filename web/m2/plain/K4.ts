/* R15 plain-language layer for K4 (optimisation: steepest descent, learning rate, mini-batches, momentum and Adam). */
import type { PStation } from './types';
import { B } from './types';

const K4: PStation = {
  cards: {
    c_K4_0: {
      zh: `<p>训练模型，就像<b>蒙着眼睛下山</b>：看不见山脚在哪，但脚底能感觉到哪边往下最陡，于是朝那边迈一小步，再感觉、再迈一步。这里“山有多高”就是模型<b>错得有多厉害</b>（损失）。</p>
<p>这一站讲下山的几个窍门为什么管用：为什么朝最陡的方向走；每一步迈多大（学习率）；每次只看一小把题目来估计坡度（小批量）；以及把前几步的方向记在心里，走得更稳（动量和 Adam）。</p>`,
      en: `<p>Training a model is like <b>walking down a hill blindfolded</b>: you cannot see the bottom, but your feet can feel which way slopes down most steeply, so you take a small step that way, feel again, and step again. Here “how high you are” is <b>how wrong the model is</b> (the loss).</p>
<p>This stop explains why a few downhill tricks work: why you head the steepest way down; how big each step should be (the learning rate); why you can estimate the slope from a small handful of examples (mini-batches); and how remembering your last few steps makes the walk steadier (momentum and Adam).</p>`,
    },
    c_K4_1: {
      zh: `<p>站在山坡上，你可以朝<b>任何方向</b>迈一步。“坡度”（梯度）告诉你：朝每个方向走，高度变化有多快。它本身指向<b>上坡最陡</b>的方向，所以要下山，就朝它的<b>反方向</b>走。</p>
<p>这张卡片证明：在所有同样长的一小步里，正好朝反方向走，高度降得最快。证明要用一个小工具（柯西–施瓦茨不等式）：两串数“对应位置相乘再加起来”，结果的大小不会超过两串数各自“长度”的乘积。</p>`,
      en: `<p>Standing on a hillside, you could step in <b>any direction</b>. The “slope” (the gradient) tells you how fast the height changes in each direction. It points the <b>steepest way uphill</b>, so to go down you walk the <b>opposite way</b>.</p>
<p>This card proves that, among all small steps of the same length, the opposite way makes the height drop fastest. The proof uses a small tool (the Cauchy–Schwarz inequality): multiplying two lists of numbers position by position and adding up never gives something bigger than the two lists’ “lengths” multiplied together.</p>`,
      more: B(`“降得最快”只是在当前这一点附近、步子极小时成立（看的是变化率）。真实地形是弯的：步子一大，最陡方向不一定还是最好的方向，所以步子要足够小才保证损失真的变小。坡度为 0 的地方（比如谷底）就没有可走的下坡方向。`,
        `“Drops fastest” holds only right around the current point, for very small steps (it is about the rate of change). Real landscapes curve: with a big step the steepest direction need not stay the best one, which is why the step must be small enough to be sure the loss goes down. Where the slope is 0 (at the bottom of a valley, say) there is no downhill direction to take.`),
    },
    c_K4_2: {
      zh: `<p><b>学习率</b>就是“每一步迈多大”。太小：像蚂蚁挪步，走到天黑也到不了；太大：一步跨过山谷，落到对面更高的地方，然后越跳越远，这叫<b>发散</b>。</p>
<p>在最简单的“碗形”山谷里，可以把每一步精确算出来：步子小于某个界限，就一定能走到碗底；等于或超过它，就会来回跳个不停，甚至越跳越远。碗越陡，这个界限越小。</p>`,
      en: `<p>The <b>learning rate</b> is “how big each step is”. Too small, and you crawl like an ant, never arriving before dark; too big, and one step leaps across the valley to a higher spot on the other side, then the leaps get bigger and bigger. That is called <b>diverging</b>.</p>
<p>In the simplest “bowl-shaped” valley you can work out every step exactly: below a certain limit, the steps always reach the bottom of the bowl; at or above it, they bounce back and forth forever, or even fly further and further away. The steeper the bowl, the smaller the limit.</p>`,
      more: B(`这个界限只对完美的碗形（二次函数）精确成立。有很多方向时，界限由最陡的那个方向决定；真实的损失地形不是完美的碗，这里的界限只能当参考。`,
        `The limit is exact only for a perfect bowl (a quadratic function). With many directions, the limit is set by the steepest one; real loss landscapes are not perfect bowls, so the limit here is only a guide.`),
    },
    labGD: {
      zh: `<p>拖动滑块改变 η（读作“伊塔”，就是步子迈多大），看一个点在碗形曲线 f(x) = x² 上走 12 步：x₀ 是起点，a 表示碗有多陡（这里 a = 2）。看看步子多大时，它稳稳走到碗底，多大时开始乱跳。</p>`,
      en: `<p>Drag the slider to change η (say “eta”: how big each step is) and watch a point take 12 steps on the bowl-shaped curve f(x) = x². x₀ is the starting point, and a says how steep the bowl is (here a = 2). See which step sizes walk calmly to the bottom and which start bouncing wildly.</p>`,
    },
    c_K4_3: {
      zh: `<p>练习题可能有上百万道。如果每走一步都要把所有题做一遍再算坡度，就太慢了。办法是：每次<b>随机抽一小把</b>（比如 32 道），用它们来估计坡度。</p>
<p>就像<b>尝一勺汤</b>就知道咸不咸，用不着喝完一整锅。尝一勺会有点误差，但平均来说不偏不倚；抽得越多越准：多抽 4 倍，误差减一半。</p>`,
      en: `<p>There might be millions of practice examples. Working through all of them before every single step would be far too slow. Instead, each step <b>picks a small random handful</b> (say 32) and estimates the slope from those.</p>
<p>It is like <b>tasting one spoonful of soup</b> to tell if it is salty: you do not have to drink the whole pot. A spoonful can be a little off, but on average it is not tilted either way; the more you pick, the closer it gets: picking 4 times as many halves the error.</p>`,
      more: B(`“平均来说不偏不倚”是说估计的期望正好等于真正的坡度（无偏）。“误差”指估计值的标准差，它随抽取数量的平方根变小。这里的分析假设每次都是有放回、均匀地随机抽；不放回地抽，误差还会再小一点。`,
        `“Not tilted on average” means the estimate’s expected value equals the true slope exactly (it is unbiased). The “error” is the estimate’s standard deviation, which shrinks with the square root of the number picked. The analysis assumes each pick is uniform and with replacement; picking without replacement makes the error a little smaller still.`),
    },
    c_K4_4: {
      zh: `<p>用一小把题估计出的坡度会“抖”。<b>动量</b>像一个滚下山的球：它记得刚才往哪滚，偶尔的小颠簸互相抵消，一直朝同一方向的坡就越滚越快。</p>
<p><b>Adam</b> 更进一步，让每个“旋钮”（参数）有自己的步子：它记着每个旋钮最近的坡度一般有多大，然后按这个大小把步子调整一下，这样坡度特别大的旋钮不会一下子迈得太远，坡度很小的也不会几乎不动。刚开始时这些“记忆”是从 0 起步的，会偏小，所以还要按一个修正系数放大回来。</p>`,
      en: `<p>The slope estimated from a small handful “wobbles”. <b>Momentum</b> works like a ball rolling downhill: it remembers which way it was rolling, so the odd little bump cancels out, while a slope that keeps going the same way makes it roll faster and faster.</p>
<p><b>Adam</b> goes further and gives every “knob” (parameter) its own step size: it remembers how big each knob’s recent slopes usually are and adjusts the step by that size, so a knob with a huge slope does not leap too far at once, and one with a tiny slope does not barely move. At the start these “memories” begin at 0 and come out too small, so they are scaled back up by a correction factor.</p>`,
      more: B(`Adam 的步子大致与坡度的“尺度”无关，但并不完全固定。修正系数让记忆在“坡度的平均值不随时间变化”这个假设下平均来说不偏小。`,
        `Adam’s step is roughly independent of the slope’s “scale”, but it is not exactly fixed. The correction factor makes the memories not too small on average, under the assumption that the slopes’ average does not change over time.`),
    },
  },
  ctx: {
    '*': {
      'theta': B('模型所有的“旋钮”（参数）放在一起', 'all of the model’s “knobs” (parameters) together'),
      'eta': B('学习率：每一步迈多大', 'the learning rate: how big each step is'),
      'v:L': B('损失：模型错得有多厉害（就是“山有多高”）', 'the loss: how wrong the model is (the “height of the hill”)'),
      'v:g': B('坡度（梯度）的简写', 'short for the slope (the gradient)'),
    },
    c_K4_1: {
      'v:a': B('一串数（向量）', 'a list of numbers (a vector)'),
      'v:b': B('另一串数（向量）', 'another list of numbers (a vector)'),
      'v:s': B('任意一个数（可以是负数）', 'any number (it may be negative)'),
      'w:for every real': { ...B('不管它取哪个数，这句话都成立', 'whatever number it is, the statement holds'), r: B('“对每一个实数”', '“for every real”') },
      'v:u': B('一个方向：长度为 1 的一串数，只管指向哪边', 'a direction: a list of numbers of length 1 that only says which way'),
      'v:g@v:s,v:u': B('一个帮忙的函数：朝 u 方向走 s 那么远时的损失', 'a helper function: the loss after walking a distance s in direction u'),
      'v:i': B('编号：第几个旋钮', 'a label: which knob'),
      'v:o': B('“小 o”：比 η 还小得多的剩余部分，η 缩小时它缩得更快', '“little o”: a leftover far smaller than η, shrinking faster than η does'),
    },
    c_K4_2: {
      'v:f': B('碗形的山谷：位置在 x 时的高度', 'the bowl-shaped valley: the height at position x'),
      'v:x': B('现在站的位置（碗底在 0）', 'where you are standing now (the bottom of the bowl is at 0)'),
      'v:a': B('碗有多陡（一个大于 0 的数）', 'how steep the bowl is (a number above 0)'),
      'v:k': B('编号：走到第几步了', 'a label: which step you are on'),
      'rho': B('每走一步，位置都要乘上的那个固定的数', 'the fixed number the position is multiplied by at every step'),
      'v:H': B('一张数表：记着各个方向有多陡，以及方向之间怎么互相影响', 'a table of numbers: how steep each direction is, and how the directions affect each other'),
      'v:Q': B('一张数表，作用是把坐标转个角度，让各个方向互不影响', 'a table of numbers that turns the coordinates so the directions stop affecting each other'),
      'Lambda': B('只在对角线上有数的表：每个方向各自有多陡', 'a table with numbers only on its diagonal: how steep each direction is on its own'),
      'lambda': B('某一个方向有多陡', 'how steep one direction is'),
      'v:u': B('转过角度以后的新坐标', 'the new coordinates after turning'),
      'v:i': B('编号：第几个方向', 'a label: which direction'),
    },
    c_K4_3: {
      'v:N': B('练习题（样本）一共有几道', 'how many practice examples there are in all'),
      'v:B': B('每次抽几道题（批大小）', 'how many examples are picked each time (the batch size)'),
      'ell': B('在一道题上的损失', 'the loss on one example'),
      'v:i': B('编号：第几道题', 'a label: which example'),
      'v:b': B('编号：这一把里抽的第几下', 'a label: which pick in this handful'),
      'v:g': B('从这一小把题估计出来的坡度（帽子表示“估计值”）', 'the slope estimated from this handful (the hat means “an estimate”)'),
      'v:j': B('编号：第几个旋钮（坡度的第几个数）', 'a label: which knob (which number in the slope)'),
      'w:Var': B('方差：估计值通常偏离平均有多远（取平方后再平均）', 'variance: how far an estimate usually lands from its average (squared, then averaged)'),
      'w:uniform on': { ...B('从这些编号里随机抽一个，每个被抽中的机会一样', 'pick one of these labels at random, each equally likely'), r: B('“均匀地取自”', '“uniform on”') },
      'sigma': B('只用一道题估计时，坡度的抖动有多大（标准差）', 'how much the slope wobbles when estimated from a single example (the standard deviation)'),
      'v:X': B('一个随机的数', 'a random number'),
      'v:c': B('一个固定的数', 'a fixed number'),
    },
    c_K4_4: {
      'v:t': B('编号：走到第几步了', 'a label: which step you are on'),
      'v:i': B('编号：之前的第几步', 'a label: which earlier step'),
      'v:v': B('一份“记忆”：把过去的坡度累积起来（在 Adam 里，记的是坡度平方的平均）', 'a “memory” that piles up past slopes (in Adam it keeps the average of the squared slopes)'),
      'v:v@eta': B('动量的“记忆”：把过去的坡度累积起来，像球滚动的速度', 'momentum’s “memory”: past slopes piled up, like the speed of a rolling ball'),
      'v:v@v:m': B('第二份记忆：坡度平方的滑动平均，记着坡度一般有多大', 'the second memory: a running average of the squared slope, remembering how big the slope usually is'),
      'v:m': B('第一份记忆：坡度的滑动平均，记着最近大概往哪边走', 'the first memory: a running average of the slope, remembering roughly which way things have been going'),
      'beta': B('记忆保留多少：每一步旧记忆要乘上的数（比如 0.9 就是留九成）', 'how much memory is kept: the number the old memory is multiplied by each step (0.9 keeps nine tenths)'),
      'alpha': B('Adam 的步子大小（学习率）', 'Adam’s step size (its learning rate)'),
      'epsilon': B('一个极小的数，防止除以 0', 'a tiny number that prevents dividing by 0'),
    },
    kLR: {
      'v:f': B('碗形的山谷：位置在 x 时的高度', 'the bowl-shaped valley: the height at position x'),
      'v:x': B('现在站的位置（碗底在 0）', 'where you are standing now (the bottom of the bowl is at 0)'),
      'v:a': B('碗有多陡（一个大于 0 的数）', 'how steep the bowl is (a number above 0)'),
    },
  },
};
export default K4;
