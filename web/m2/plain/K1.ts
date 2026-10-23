/* R15 plain-language layer for K1 (calculus: limits, derivatives, the chain rule, gradients). */
import type { PStation } from './types';
import { B } from './types';

const K1: PStation = {
  d: true,
  cards: {
    c_K1_0: {
      zh: `<p>训练 AI，就像同时拧收音机上成千上万个小旋钮，想让“错误”（<a data-open="nLoss">损失</a>）越来越小。可每个旋钮该往左拧还是往右拧？</p>
<p><b>导数</b>就是答案：它告诉你“这个旋钮动一点点，错误会变多少”，就像告诉你脚下的坡朝哪边、有多陡。往下坡的方向走，错误就变小。</p>
<p>这一站一步步讲：<a data-open="kLim">极限</a>（越来越靠近）→ <a data-open="kDer">导数</a>（坡有多陡）→ <a data-open="kChain">链式法则</a>（一环套一环）→ <a data-open="kGrad">梯度</a>（很多旋钮一起看）。</p>`,
      en: `<p>Training an AI is like turning thousands of little knobs on a radio at once, trying to make the “mistakes” (the <a data-open="nLoss">loss</a>) smaller and smaller. But which way should each knob turn?</p>
<p>The <b>derivative</b> is the answer: it says “if this knob moves a tiny bit, how much do the mistakes change?”, like telling you which way the ground slopes under your feet and how steep it is. Walk downhill and the mistakes shrink.</p>
<p>Step by step, this stop covers: <a data-open="kLim">limits</a> (getting closer and closer) → <a data-open="kDer">derivatives</a> (how steep) → <a data-open="kChain">the chain rule</a> (links in a chain) → <a data-open="kGrad">gradients</a> (many knobs at once).</p>`,
    },
    c_K1_1: {
      zh: `<p>想象你朝一面墙走，每次走剩下距离的一半：越来越近，越来越近……“<b>极限</b>”说的就是：这样一直靠近下去，最后会靠近哪里。</p>
<p>关键是：极限只看“<b>靠近</b>”的时候，不看“<b>正好到达</b>”的那一刻。所以有些式子在那一点上算不出来（比如会变成 0 除以 0），却照样有极限。</p>
<p>例子：把 h 变得很小很小，(1+h)²−1 再除以 h，结果是 2+h，会越来越接近 2。</p>`,
      en: `<p>Imagine walking towards a wall, each time covering half of the distance that is left: closer, closer, closer… A <b>limit</b> asks: if you keep getting closer like this, where do you end up near?</p>
<p>The key point: a limit only looks at what happens while you get <b>close</b>, not at the moment you <b>arrive</b>. So a formula can fail at that exact point (it might turn into 0 divided by 0) and still have a limit.</p>
<p>Example: make h very, very small; (1+h)²−1, divided by h, is 2+h, which gets closer and closer to 2.</p>`,
      more: B(`ε-δ 定义把“越来越近”说精确：不管你要求误差小于多小的正数 ε，总能找到一个距离 δ，只要 x 离 a 比 δ 近（但不等于 a），f(x) 离 L 就比 ε 近。“走一半”只是帮助想象的比喻，不是定义本身。`,
        `The ε-δ definition makes “closer and closer” exact: however small a positive error ε you demand, there is a distance δ so that whenever x is within δ of a (but not equal to a), f(x) is within ε of L. “Walking half the way” is only a picture to help, not the definition itself.`),
    },
    c_K1_2: {
      zh: `<p><b>导数</b>就是“<b>坡有多陡</b>”。在曲线上取两个点连一条线（割线），量它的斜率；再让第二个点一点点靠近第一个点，这条线最后贴在曲线上（切线），它的斜率就是导数。</p>
<p>例子：y = x² 这条曲线，在 x = 3 的地方，坡的陡度（斜率）是 6：x 再多走一丁点，y 大约多走 6 倍那么多。</p>
<p>下面还有一张常用函数的“导数表”，每一条都有证明。</p>`,
      en: `<p>A <b>derivative</b> is “<b>how steep the slope is</b>”. Join two points on a curve with a line (a secant) and measure its slope; now slide the second point closer and closer to the first, until the line just touches the curve (a tangent). That slope is the derivative.</p>
<p>Example: on the curve y = x², at x = 3 the slope is 6: if x moves on a tiny bit, y moves about 6 times as much.</p>
<p>Below there is also a table of derivatives of common functions, each with a proof.</p>`,
      more: B(`导数不一定处处存在：比如 ReLU 在 x = 0 处有个尖角，左右两边的陡度不一样，所以那一点没有导数；深度学习框架在那里约定取 0。“多走 6 倍”也只在 x 的变化非常小时才近似成立。`,
        `A derivative does not always exist: ReLU has a sharp corner at x = 0, where the slopes on the left and right differ, so there is no derivative there; deep-learning frameworks simply use 0 at that point. “About 6 times as much” is only approximately true when the change in x is very small.`),
    },
    c_K1_3: {
      zh: `<p><b>链式法则</b>：像一串齿轮。第一个齿轮转 1 圈，第二个转 2 圈；第二个转 1 圈，第三个转 3 圈。那第一个转 1 圈，第三个转几圈？2 × 3 = 6 圈（示意）。</p>
<p>函数一个套一个的时候也一样：每一环“变化有多快”<b>乘起来</b>，就是整条链的变化有多快。神经网络就是很多层套在一起，<a data-open="nBp">反向传播</a>就是用这个办法，从最后一层往前，一层层把导数乘回去。</p>`,
      en: `<p>The <b>chain rule</b> is like a row of gears. When the first gear turns once, the second turns twice; when the second turns once, the third turns 3 times. So when the first turns once, how many times does the third turn? 2 × 3 = 6 (illustrative).</p>
<p>Functions inside functions work the same way: <b>multiply</b> how fast each link changes, and you get how fast the whole chain changes. A neural network is many layers inside each other, and <a data-open="nBp">backpropagation</a> uses exactly this, going backwards from the last layer and multiplying the derivatives as it goes.</p>`,
      more: B(`准确地说：要求每一环都可导，而且外面那个函数的导数要在“里面算出来的结果” g(x) 处取，不是在 x 处取：(f∘g)′(x) = f′(g(x))·g′(x)。齿轮的比例是固定的，而一般函数每个地方的“倍数”可能不一样。`,
        `More exactly: every link must have a derivative, and the outer function’s derivative is taken at the inner result g(x), not at x: (f∘g)′(x) = f′(g(x))·g′(x). Gears have a fixed ratio, while for most functions the ratio can be different at every point.`),
    },
    c_K1_4: {
      zh: `<p>一个东西由好几个旋钮一起决定时，就<b>一次只动一个</b>旋钮，其他的都先不动，看结果变多快——这叫“<b>偏导数</b>”。</p>
<p>把每个旋钮的偏导数排成一串，就是“<b>梯度</b>”。想象你蒙着眼站在山坡上：梯度指向往上最陡的方向，往它的<b>反方向</b>迈一小步，就是下山最快的一步。训练 AI 就是一遍遍这样迈小步。</p>
<p>如果从输入到结果有好几条路，就把每条路的影响<b>加起来</b>。</p>`,
      en: `<p>When something depends on several knobs, <b>move just one knob at a time</b>, keep the others still, and see how fast the result changes: that is a <b>partial derivative</b>.</p>
<p>Put every knob’s partial derivative in a list and you have the <b>gradient</b>. Imagine standing blindfolded on a hillside: the gradient points the steepest way up, so a small step the <b>opposite way</b> is the quickest step down. Training an AI repeats such small steps again and again.</p>
<p>If there are several roads from an input to the result, <b>add up</b> the effect along each road.</p>`,
      more: B(`梯度只描述“脚下这一小块”的坡：走远了坡可能就变了，所以每次只迈一小步（步子大小叫学习率），走完再重新算。往反方向走保证的是“小步走时下降最快”，不保证一定走到最低的地方。`,
        `The gradient only describes the slope right where you stand: further away the slope may change, so each step is small (its size is the learning rate) and the gradient is worked out again after it. Going the opposite way gives the fastest drop for a small step; it does not promise to reach the lowest point.`),
    },
    c_K1_5: {
      zh: `<p>地球是圆的，可你站在操场上，看地面却是平的。曲线也一样：<b>放大到很近</b>，它看起来就像一条直线，这条直线的斜率就是导数。所以“x 动一点点，结果大约变化 导数×那一点点”。</p>
<p><b>积分</b>反过来：把曲线下面的面积切成很多细条，每条近似成长方形，再全部加起来。求导和积分互相“抵消”，就像先 +3 再 −3 回到原来的数。</p>`,
      en: `<p>The Earth is round, yet when you stand on a playground the ground looks flat. Curves are like that too: <b>zoom in close enough</b> and a curve looks like a straight line, whose slope is the derivative. So “if x moves a tiny bit, the result changes by about derivative × that tiny bit”.</p>
<p>An <b>integral</b> goes the other way: cut the area under a curve into many thin strips, treat each as a rectangle, and add them all up. Derivatives and integrals undo each other, like adding 3 and then taking 3 away gets you back where you started.</p>`,
      more: B(`“互相抵消”指微积分基本定理：f 连续时，d/dx ∫ₐˣ f(t) dt = f(x)。反过来，对导数积分会多出一个常数，所以“抵消”只是大致的说法。训练里的期望 𝔼[ℓ] 是对所有可能的数据求平均，实际上算不完，只能用一小批（mini-batch）数据去估计。`,
        `“Undo each other” is the fundamental theorem of calculus: when f is continuous, d/dx ∫ₐˣ f(t) dt = f(x). Going the other way, integrating a derivative leaves an extra constant, so “undo” is only roughly true. In training, the expected loss 𝔼[ℓ] averages over all possible data, which can never be computed in full, so it is estimated from a small batch (mini-batch).`),
    },
    labSecant: {
      zh: `<p>拖动 h，让它越来越小，看那条连两个点的线怎么慢慢贴到曲线上，它的斜率又怎么越来越接近导数。</p>`,
      en: `<p>Drag h smaller and smaller and watch the line through two points settle onto the curve, while its slope gets closer and closer to the derivative.</p>`,
    },
  },
  ctx: {
    '*': {
      'v:x': B('输入的数', 'the input number'),
      'v:f': B('一个函数：吃进一个数、吐出一个数的“机器”', 'a function: a “machine” that takes in a number and gives back a number'),
      'v:h': B('一小步：一个很小、但不等于 0 的数', 'a small step: a tiny number that is not 0'),
      'v:e': '=euler',
      sigma: B('sigmoid 函数：把任何数压到 0 和 1 之间', 'the sigmoid function: squeezes any number into the range 0 to 1'),
    },
    c_K1_1: {
      'v:a': B('x 要去靠近的那个数', 'the number x gets close to'),
      'v:L': B('f(x) 最后靠近的那个数（极限值）', 'the number f(x) ends up close to (the limit)'),
      epsilon: B('你允许的误差：随便挑一个正数，多小都行', 'the error you allow: pick any positive number, as small as you like'),
      delta: B('x 离 a 要多近：只要比 δ 还近，误差就小于 ε', 'how close x must be to a: any closer than δ and the error is below ε'),
    },
    c_K1_2: {
      'v:n': B('任意一个次方数（比如 2、3）', 'any power (such as 2 or 3)'),
      'v:u': B('临时起的名字：u = 1 + e⁻ˣ', 'a temporary name: u = 1 + e⁻ˣ'),
      fx: B('把 x 放进函数得到的结果', 'the result of putting x into a function'),
      'fx@sigma': B('把 x 放进函数得到的结果，比如 σ(x)。注意 σ′ = σ(1−σ) 是简写：意思是 σ(x) 乘以 (1 − σ(x))，不是把 1−σ 放进 σ', 'the result of putting x into a function, e.g. σ(x). Note σ′ = σ(1−σ) is shorthand for σ(x) times (1 − σ(x)); it does not put 1−σ into σ'),
    },
    c_K1_3: {
      'v:g': B('第一台机器（先做）', 'the first machine (applied first)'),
      'v:f': B('第二台机器（后做）', 'the second machine (applied next)'),
      'v:u': B('第一台机器的结果，临时起名 u = g(x)', 'the first machine’s result, called u = g(x)'),
      'v:k': B('一小步的变化：第一台机器的结果变了多少', 'a small change: how much the first machine’s result moved'),
      'v:k@v:u,v:g': B('u 变化的那一小步：k = g(x+h) − g(x)', 'the small change in u: k = g(x+h) − g(x)'),
      phi: B('临时帮忙的函数：两点连线的斜率；当 k = 0 时，规定它等于那一点的导数', 'a helper function: the slope between two points; when k = 0 it is set to the derivative at that point'),
      'phi@prime,v:u': B('临时帮忙的函数：两点连线的斜率，k = 0 时规定它等于 f′(u)', 'a helper function: the slope between two points, set to f′(u) when k = 0'),
      'v:y': B('神经元的输出', 'the neuron’s output'),
      'v:w': B('权重：要调的旋钮', 'the weight: the knob being tuned'),
      'v:b': B('偏置：另一个旋钮', 'the bias: another knob'),
      'v:z': B('中间结果：先算出来、再交给下一步的数', 'the in-between result: worked out first, then handed to the next step'),
      'v:z@v:w,v:b': B('中间结果 z = wx + b', 'the in-between result z = wx + b'),
    },
    c_K1_4: {
      'v:x': B('输入：可以是一串数 (x₁,…,xₙ)，也可以是单独一个数', 'the input: a list of numbers (x₁,…,xₙ), or a single number'),
      'v:n': B('输入一共有几个数', 'how many input numbers there are'),
      'v:i': B('编号：第几个输入', 'a label: which input'),
      sub: B('右下角的编号：第 1 个、第 2 个……输入', 'the lowered label: the 1st, 2nd, … input'),
      'sub@v:i': B('x₁、xᵢ：第 1 个、第 i 个输入', 'x₁, xᵢ: the 1st input, the i-th input'),
      'v:y': B('第二个输入', 'a second input'),
      'v:z': B('最后的结果 z，它通过 u 和 v 两条路随 x 变化', 'the final result z, which changes with x along two roads, through u and v'),
      'v:u': B('第一条路上的中间结果', 'the in-between result on the first road'),
      'v:v': B('第二条路上的中间结果', 'the in-between result on the second road'),
    },
    c_K1_5: {
      'v:o': B('“小 o”：比 h 还小得多的剩余部分，h 缩小时它缩得比 h 还快', '“little o”: a leftover far smaller than h, shrinking faster than h does'),
      'v:a': B('从哪里开始累加', 'where the adding up starts'),
      'v:t': B('累加时沿途经过的位置（只是一个临时名字）', 'the positions passed while adding up (just a temporary name)'),
      ell: B('损失：模型在例子 x 上错了多少', 'the loss: how wrong the model is on example x'),
      'v:p': B('p(x)：例子 x 出现的机会有多大', 'p(x): how likely example x is'),
    },
    /* popups (the K1 cards' “learn more” windows) */
    kLim: { 'v:a': B('x 要去靠近的那个数', 'the number x gets close to') },
    kChain: { 'v:g': B('第一台机器（先做）', 'the first machine (applied first)'), 'v:f': B('第二台机器（后做）', 'the second machine (applied next)') },
    kInt: { 'v:a': B('从哪里开始累加', 'where the adding up starts'), 'v:t': B('累加时沿途经过的位置（只是一个临时名字）', 'the positions passed while adding up (just a temporary name)') },
  },
};
export default K1;
