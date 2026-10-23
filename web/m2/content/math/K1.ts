/* Station K1 · Math · Calculus: limits, derivatives, chain rule, partial derivatives / gradient, integral */
import type { Page, StationOut } from '../../lib';
import { M, m } from '../../tex';
import { ex, kDiagram, kLegend, proof } from './kit';

const r = String.raw;
export const KCAT = (id: string) => (id.startsWith('k') ? 'math' : 'llm');

export default function K1(P: Page): StationOut {
  const { t } = P;
  const svg = kDiagram(P, 'svgK1', [
    { h: 52, boxes: [{ id: 'kLim', col: 'c', t: t('极限', 'Limit'), s: [t('无限靠近', 'Arbitrarily close')] }] },
    { h: 56, boxes: [{ id: 'kDer', col: 'l', t: t('导数', 'Derivative'), s: [t('瞬时变化率', 'Rate of change')] }, { id: 'kInt', col: 'r', t: t('积分', 'Integral'), s: [t('无数小块相加', 'Sum of tiny pieces')] }] },
    { h: 56, boxes: [{ id: 'kChain', col: 'l', t: t('链式法则', 'Chain rule'), s: [t('导数相乘', 'Multiply derivatives')] }, { id: 'kGrad', col: 'r', t: t('偏导与梯度', 'Gradient'), s: [t('多个输入', 'Many inputs')] }] },
    { h: 52, boxes: [{ id: 'nCg', col: 'l', t: t('用在：计算图', 'Used in: graph'), s: [t('反向传播', 'Backprop')] }, { id: 'nUpd', col: 'r', t: t('用在：更新参数', 'Used in: update'), s: [t('梯度下降', 'Gradient descent')] }] },
  ], [['kLim', 'kDer'], ['kLim', 'kInt'], ['kDer', 'kChain'], ['kDer', 'kGrad'], ['kChain', 'nCg'], ['kGrad', 'nUpd']], KCAT);

  P.card('c_K1_0', 1, t('训练 = 让损失变小；导数告诉你往哪边调', 'Training = make the loss smaller; the derivative says which way'), `
<p class="lead">${t(`神经网络训练时只问一个问题：每个参数往哪边调一点点，${P.open('nLoss')}会变小？答案就是导数。本站从极限讲起，一直讲到多输入时的${P.open('kGrad')}，每个结论都给出证明。`, `Training a neural network keeps asking one question: which way should each parameter move a little so that the ${P.open('nLoss')} gets smaller? The answer is the derivative. This stop starts from limits and goes up to the ${P.open('kGrad')} for many inputs, with a proof for every result.`)}</p>
<ul class="pts">
<li>${P.open('kLim')} → ${P.open('kDer')}${t('：变化率的精确定义。', ': the precise definition of a rate of change.')}</li>
<li>${P.open('kChain')}${t(`：一层套一层的函数怎么求导——这就是${P.open('nBp')}的数学核心。`, `: differentiating functions nested inside each other, the mathematical core of ${P.open('nBp')}.`)}</li>
<li>${P.open('kGrad')}${t('：上亿个参数同时求导，指出下降的方向。', ': differentiating with respect to millions of parameters at once, pointing downhill.')}</li>
</ul>`, { h2: true });

  P.card('c_K1_1', 2, t('📏 极限：“无限靠近”的精确说法', '📏 Limits: “arbitrarily close”, made precise'), `
<p>${t(`直观地说，${m(r`\lim_{x\to a} f(x)=L`)} 的意思是：只要 ${m('x')} 离 ${m('a')} 足够近（但不等于 ${m('a')}），${m('f(x)')} 就离 ${m('L')} 要多近有多近。写成不等式就是 ε-δ 定义：`, `Intuitively, ${m(r`\lim_{x\to a} f(x)=L`)} means: once ${m('x')} is close enough to ${m('a')} (but not equal to it), ${m('f(x)')} is as close to ${m('L')} as you like. As inequalities, this is the ε-δ definition:`)}</p>
${M(r`\forall \varepsilon>0,\ \exists \delta>0:\quad 0<|x-a|<\delta \ \Longrightarrow\ |f(x)-L|<\varepsilon`)}
<p>${t(`注意 ${m('0<|x-a|')}：极限只看 ${m('a')} 附近，不看 ${m('a')} 这一点本身。所以即使 ${m('f(a)')} 没有定义（比如 0/0），极限也可以存在。`, `Note the ${m('0<|x-a|')}: a limit looks only near ${m('a')}, never at ${m('a')} itself, so it can exist even when ${m('f(a)')} is undefined (such as 0/0).`)}</p>
${ex(P, t('例：一个 0/0 型的极限', 'Example: a 0/0 limit'), `${M(r`\lim_{h\to 0}\frac{(1+h)^2-1}{h}=2`)}` + proof(P, t('证明', 'Proof'), [
    [t(`当 ${m(r`h\neq 0`)} 时，${m(r`\frac{(1+h)^2-1}{h}=\frac{2h+h^2}{h}=2+h`)}。`, `For ${m(r`h\neq 0`)}, ${m(r`\frac{(1+h)^2-1}{h}=\frac{2h+h^2}{h}=2+h`)}.`), t('展开平方后约去 h（h≠0 才能约）。', 'Expand the square and cancel h (allowed because h ≠ 0).')],
    [t(`于是 ${m(r`\left|\frac{(1+h)^2-1}{h}-2\right|=|h|`)}。`, `Hence ${m(r`\left|\frac{(1+h)^2-1}{h}-2\right|=|h|`)}.`), t('上一步的结果减去 2。', 'Subtract 2 from the previous result.')],
    [t(`任给 ${m(r`\varepsilon>0`)}，取 ${m(r`\delta=\varepsilon`)}。当 ${m(r`0<|h|<\delta`)} 时，误差 ${m(r`|h|<\varepsilon`)}。`, `Given any ${m(r`\varepsilon>0`)}, choose ${m(r`\delta=\varepsilon`)}. Whenever ${m(r`0<|h|<\delta`)}, the error is ${m(r`|h|<\varepsilon`)}.`), t('正好满足 ε-δ 定义。', 'This is exactly the ε-δ definition.')],
  ]))}`);

  P.card('c_K1_2', 2, t('📈 导数：割线斜率的极限', '📈 Derivative: the limit of secant slopes'), `
<p>${t('连接曲线上两点 x 和 x+h 的直线叫割线，它的斜率是平均变化率。让 h 趋向 0，割线变成切线：', 'The line through the points at x and x+h is a secant; its slope is the average rate of change. As h → 0 the secant becomes the tangent:')}</p>
${M(r`f'(x)=\lim_{h\to 0}\frac{f(x+h)-f(x)}{h}`)}
${proof(P, t(`例：${m(r`(x^2)'=2x`)}`, `Example: ${m(r`(x^2)'=2x`)}`), [
    [m(r`\frac{(x+h)^2-x^2}{h}=\frac{2xh+h^2}{h}=2x+h\quad(h\neq 0)`), t('代入定义，展开后约去 h。', 'Substitute into the definition, expand, cancel h.')],
    [m(r`\lim_{h\to 0}(2x+h)=2x`), t('同上一张卡的例子：与 2x 的差就是 |h|。', 'As in the previous card: the difference from 2x is exactly |h|.')],
  ])}
<p>${t('神经网络里常见的导数（括号里是用在哪里）：', 'Derivatives that appear in neural networks (and where):')}</p>
<table class="gl stack ktab"><tbody><tr><th>${t('函数', 'Function')}</th><th>${t('导数', 'Derivative')}</th></tr>
<tr><td>${m('x^n')}</td><td data-label="${t('导数', 'Derivative')}">${m('n\\,x^{n-1}')}</td></tr>
<tr><td>${m('e^x')}</td><td data-label="${t('导数', 'Derivative')}">${m('e^x')} ${t('（softmax）', '(softmax)')}</td></tr>
<tr><td>${m(r`\ln x`)}</td><td data-label="${t('导数', 'Derivative')}">${m(r`1/x`)} ${t('（交叉熵）', '(cross-entropy)')}</td></tr>
<tr><td>${m(r`\sigma(x)=\frac{1}{1+e^{-x}}`)}</td><td data-label="${t('导数', 'Derivative')}">${m(r`\sigma(x)\,(1-\sigma(x))`)}</td></tr>
<tr><td>${m(r`\tanh x`)}</td><td data-label="${t('导数', 'Derivative')}">${m(r`1-\tanh^2 x`)}</td></tr>
<tr><td>${m(r`\mathrm{ReLU}(x)=\max(0,x)`)}</td><td data-label="${t('导数', 'Derivative')}">${t(`${m('x>0')} 时 1，${m('x<0')} 时 0；${m('x=0')} 处不可导，框架约定取 0`, `1 for ${m('x>0')}, 0 for ${m('x<0')}; not differentiable at ${m('x=0')}, where frameworks use 0`)}</td></tr>
</tbody></table>
${proof(P, t(`sigmoid 的导数 ${m(r`\sigma'=\sigma(1-\sigma)`)}`, `The sigmoid derivative ${m(r`\sigma'=\sigma(1-\sigma)`)}`), [
    [m(r`\sigma(x)=(1+e^{-x})^{-1}`), t('改写成幂的形式。', 'Rewrite as a power.')],
    [m(r`\sigma'(x)=-(1+e^{-x})^{-2}\cdot(-e^{-x})=\frac{e^{-x}}{(1+e^{-x})^2}`), t(`外层 ${m('u^{-1}')} 的导数是 ${m('-u^{-2}')}，内层 ${m('1+e^{-x}')} 的导数是 ${m('-e^{-x}')}，用链式法则（下一张卡）相乘。`, `The outer ${m('u^{-1}')} has derivative ${m('-u^{-2}')}, the inner ${m('1+e^{-x}')} has derivative ${m('-e^{-x}')}; multiply them by the chain rule (next card).`)],
    [m(r`1-\sigma(x)=\frac{1+e^{-x}-1}{1+e^{-x}}=\frac{e^{-x}}{1+e^{-x}}`), t('通分。', 'Common denominator.')],
    [m(r`\sigma'(x)=\frac{1}{1+e^{-x}}\cdot\frac{e^{-x}}{1+e^{-x}}=\sigma(x)\,(1-\sigma(x))`), t('把第 2 步拆成两个因子，分别是 σ 和 1−σ。', 'Split step 2 into two factors: σ and 1 − σ.')],
  ])}
<p class="note">${t('推论：σ′ 最大只有 1/4（在 x=0 处，σ=1/2）。反向传播经过每一层 sigmoid，梯度都要乘上这个不超过 1/4 的因子；除非权重把它放大回来，层数一多梯度就越乘越小——这是早期深层网络“梯度消失”的一个原因。', 'Consequence: σ′ is at most 1/4 (at x = 0, where σ = 1/2). Backpropagating through each sigmoid layer multiplies the gradient by this factor of at most 1/4; unless the weights scale it back up, many layers make the gradient ever smaller, one reason early deep networks suffered from vanishing gradients.')}</p>`);

  P.card('c_K1_3', 2, t('🔗 链式法则（附完整证明）', '🔗 The chain rule (with full proof)'), `
<p>${t(`若 ${m('g')} 在 ${m('x')} 可导、${m('f')} 在 ${m('g(x)')} 可导，则`, `If ${m('g')} is differentiable at ${m('x')} and ${m('f')} is differentiable at ${m('g(x)')}, then`)}</p>
${M(r`(f\circ g)'(x)=f'\big(g(x)\big)\cdot g'(x)`)}
${proof(P, t('证明', 'Proof'), [
    [t(`记 ${m('u=g(x)')}。定义辅助函数：${m(r`\varphi(k)=\frac{f(u+k)-f(u)}{k}`)}（${m(r`k\neq 0`)}），${m(r`\varphi(0)=f'(u)`)}。`, `Let ${m('u=g(x)')}. Define a helper: ${m(r`\varphi(k)=\frac{f(u+k)-f(u)}{k}`)} for ${m(r`k\neq 0`)}, and ${m(r`\varphi(0)=f'(u)`)}.`), t(`${m('f')} 在 ${m('u')} 可导，正是说 ${m(r`\lim_{k\to 0}\varphi(k)=f'(u)=\varphi(0)`)}，即 φ 在 0 处连续。`, `${m('f')} being differentiable at ${m('u')} says exactly ${m(r`\lim_{k\to 0}\varphi(k)=f'(u)=\varphi(0)`)}, i.e. φ is continuous at 0.`)],
    [t(`对任意 ${m('k')}（包括 ${m('k=0')}）都有 ${m(r`f(u+k)-f(u)=\varphi(k)\,k`)}。`, `For every ${m('k')} (including ${m('k=0')}): ${m(r`f(u+k)-f(u)=\varphi(k)\,k`)}.`), t('k≠0 时由 φ 的定义；k=0 时两边都是 0。', 'For k ≠ 0 by the definition of φ; for k = 0 both sides are 0.')],
    [t(`取 ${m(r`k=g(x+h)-g(x)`)}，代入得 ${m(r`f(g(x+h))-f(g(x))=\varphi(k)\,\big(g(x+h)-g(x)\big)`)}。`, `Take ${m(r`k=g(x+h)-g(x)`)}; substituting gives ${m(r`f(g(x+h))-f(g(x))=\varphi(k)\,\big(g(x+h)-g(x)\big)`)}.`), t('因为 u+k = g(x+h)。', 'Because u + k = g(x+h).')],
    [M(r`\frac{f(g(x+h))-f(g(x))}{h}=\varphi(k)\cdot\frac{g(x+h)-g(x)}{h}`), t('两边除以 h≠0。', 'Divide both sides by h ≠ 0.')],
    [t(`当 ${m(r`h\to 0`)}：${m('g')} 可导因而连续，所以 ${m(r`k\to 0`)}，${m(r`\varphi(k)\to f'(u)`)}；右边第二个因子 ${m(r`\to g'(x)`)}。`, `As ${m(r`h\to 0`)}: ${m('g')} is differentiable, hence continuous, so ${m(r`k\to 0`)} and ${m(r`\varphi(k)\to f'(u)`)}; the second factor ${m(r`\to g'(x)`)}.`), t('φ 在 0 连续；乘积的极限等于极限的乘积。', 'φ is continuous at 0; the limit of a product is the product of the limits.')],
    [m(r`(f\circ g)'(x)=f'(g(x))\,g'(x)`), t('左边正是复合函数导数的定义。', 'The left side is the definition of the derivative of the composition.')],
  ])}
<p class="note">${t('为什么要绕一个 φ？直接写 “乘以 k/k” 不行：k=g(x+h)−g(x) 可能在 h≠0 时等于 0，那就除以 0 了。φ 正是为了处理这种情况。', 'Why the detour through φ? Simply “multiplying by k/k” fails: k = g(x+h) − g(x) can be 0 even when h ≠ 0, which would divide by zero. φ handles exactly that case.')}</p>
${ex(P, t('例：一个神经元', 'Example: one neuron'), `<p>${t(`${m(r`y=\sigma(wx+b)`)}。外层 ${m(r`\sigma`)}，内层 ${m('z=wx+b')}，${m(r`\partial z/\partial w=x`)}：`, `${m(r`y=\sigma(wx+b)`)}. Outer ${m(r`\sigma`)}, inner ${m('z=wx+b')}, with ${m(r`\partial z/\partial w=x`)}:`)}</p>${M(r`\frac{\partial y}{\partial w}=\sigma(z)\,\big(1-\sigma(z)\big)\cdot x`)}`)}`);

  P.card('c_K1_4', 2, t('🧭 偏导数与梯度：很多个输入', '🧭 Partial derivatives and the gradient: many inputs'), `
<p>${t(`函数有多个输入 ${m(r`x=(x_1,\dots,x_n)`)} 时，固定其余输入、只让 ${m('x_i')} 变化求导，叫偏导数 ${m(r`\partial f/\partial x_i`)}。把它们排成向量就是梯度：`, `When a function has several inputs ${m(r`x=(x_1,\dots,x_n)`)}, differentiating in ${m('x_i')} alone with the others held fixed gives the partial derivative ${m(r`\partial f/\partial x_i`)}. Stacked into a vector they form the gradient:`)}</p>
${M(r`\nabla f(x)=\Big(\frac{\partial f}{\partial x_1},\ \dots,\ \frac{\partial f}{\partial x_n}\Big)`)}
${ex(P, t('例', 'Example'), `${M(r`f(x,y)=x^2y\ \Longrightarrow\ \nabla f=\big(2xy,\ x^2\big)`)}<p>${t('对 x 求导时把 y 当常数，对 y 求导时把 x² 当常数。', 'Treat y as a constant when differentiating in x, and x² as a constant when differentiating in y.')}</p>`)}
<p>${t('<b>多元链式法则</b>：若 z=f(u,v)，而 u、v 都依赖 x，则（f 可微时）', '<b>Multivariable chain rule</b>: if z = f(u, v) and both u and v depend on x, then (for differentiable f)')}</p>
${M(r`\frac{dz}{dx}=\frac{\partial f}{\partial u}\frac{du}{dx}+\frac{\partial f}{\partial v}\frac{dv}{dx}`)}
<p>${t(`也就是“每条路径的导数相乘，所有路径相加”。在${P.open('nCg')}里，一个值被多处使用时，反向传播要把各处传回来的梯度<b>相加</b>，原因就在这里。`, `That is: multiply along each path, then add over all paths. In the ${P.open('nCg')}, when a value is used in several places, backpropagation <b>adds</b> the gradients coming back from each use; this is why.`)}</p>
<p>${t(`梯度为什么是“上升最快的方向”？证明要用柯西-施瓦茨不等式，放在 ${P.go('K4')} 站。`, `Why is the gradient the direction of fastest increase? The proof uses the Cauchy–Schwarz inequality and is on the ${P.go('K4')} stop.`)}</p>`);

  P.card('c_K1_5', 2, t('📐 线性近似与积分', '📐 Linear approximation and the integral'), `
<p>${t('导数的定义可以改写成“一阶近似”：', 'The definition of the derivative can be rewritten as a first-order approximation:')}</p>
${M(r`f(x+h)=f(x)+f'(x)\,h+o(h)`)}
<p>${t(`其中 ${m('o(h)')} 表示比 ${m('h')} 更快趋于 0 的误差（${m(r`o(h)/h\to 0`)}）。这正是定义本身：把 ${m(r`\frac{f(x+h)-f(x)}{h}-f'(x)`)} 乘以 h 就是误差项。梯度下降每走一小步，靠的就是这个近似。`, `Here ${m('o(h)')} is an error that vanishes faster than ${m('h')} (${m(r`o(h)/h\to 0`)}). It is just the definition restated: multiply ${m(r`\frac{f(x+h)-f(x)}{h}-f'(x)`)} by h and you get the error term. Every small gradient-descent step relies on this approximation.`)}</p>
<p>${t(`<b>积分</b>是“分成很多小块再相加”的极限，几何上是曲线下的面积。微积分基本定理（f 连续时）说它和求导互为逆运算：`, `The <b>integral</b> is the limit of “cut into many small pieces and add them up”, geometrically the area under a curve. The fundamental theorem of calculus (for continuous f) says it undoes differentiation:`)}</p>
${M(r`\frac{d}{dx}\int_a^x f(t)\,dt=f(x)`)}
<p>${t(`在机器学习里，积分主要以“期望”的身份出现：连续分布下的平均损失 ${m(r`\mathbb{E}[\ell]=\int \ell(x)\,p(x)\,dx`)}。实际训练从不真的算这个积分，而是用一小批样本的平均来估计它（见 ${P.go('K4')}）。`, `In machine learning integrals show up mainly as expectations: the average loss under a continuous distribution, ${m(r`\mathbb{E}[\ell]=\int \ell(x)\,p(x)\,dx`)}. Training never computes this integral; it estimates it with the average over a mini-batch (see ${P.go('K4')}).`)}</p>`, { closed: true });

  P.labDivider();
  P.lab('labSecant', t('割线变切线：h 越小，越接近导数', 'Secant to tangent: the smaller h, the closer to the derivative'),
    t('函数和数值都是真实计算的，曲线只截取 −3 到 3 一段。', 'The functions and numbers are computed exactly; the plot shows only −3 to 3.'),
    [t('导数是一个极限，最好的理解方式是亲眼看着 h 变小。', 'A derivative is a limit; the best way to understand it is to watch h shrink.'),
      t('同时显示割线斜率、真实导数和二者之差，误差随 h 缩小的速度一目了然。', 'Secant slope, true derivative and their difference are shown together, so you see how fast the error shrinks with h.')],
    `<div class="k-ctl"><label>${t('函数', 'Function')} <select id="secF"><option value="sq">x²</option><option value="sig">σ(x)</option><option value="sin">sin x</option></select></label>
<label>x₀ = <b id="secXv">1</b><input type="range" id="secX" min="-2" max="2" step="0.5" value="1"></label>
<label>h = <b id="secHv">1</b><input type="range" id="secH" min="0" max="4" step="1" value="0"></label></div>
<svg id="secPlot" class="k-plot" viewBox="0 0 320 200" role="img" aria-label="${t('函数曲线、割线和切线', 'Function curve, secant and tangent')}"></svg>
<div id="secOut" class="k-out" aria-live="polite"></div>`,
    [t('选 x²、x₀=1，把 h 从 1 拖到 0.001：割线斜率是 2+h，误差正好等于 h。', 'Pick x², x₀ = 1, drag h from 1 to 0.001: the secant slope is 2 + h, so the error equals h exactly.'),
      t('选 σ(x)、x₀=0：导数是 1/4，这是 sigmoid 导数的最大值。', 'Pick σ(x), x₀ = 0: the derivative is 1/4, the largest the sigmoid derivative ever gets.')]);
  P.quiz();
  return {
    sub: t('极限 → 导数 → 链式法则 → 梯度：训练时“往哪边调参数”的数学。', 'Limits → derivatives → chain rule → gradient: the math of “which way to move each parameter”.'),
    one: t('本站讲神经网络训练用到的微积分，每个结论给出逐步证明；数学公式在本机渲染，不依赖外部服务。', 'The calculus used to train neural networks, with a step-by-step proof for each result; formulas are rendered locally with no external service.'),
    why: t('只记公式容易忘，看懂证明才知道它什么时候成立、什么时候不成立。', 'Memorised formulas fade; following the proof tells you when a result holds and when it does not.'),
    svg, legend: kLegend(t),
  };
}
