/* Station K4 · Math · Optimization: steepest descent, learning rate and convergence, SGD, momentum and Adam */
import type { Page, StationOut } from '../../lib';
import { M, m } from '../../tex';
import { KCAT } from './K1';
import { ex, kDiagram, kLegend, proof } from './kit';

const r = String.raw;

export default function K4(P: Page): StationOut {
  const { t } = P;
  const svg = kDiagram(P, 'svgK4', [
    { h: 52, boxes: [{ id: 'kGD', col: 'c', t: t('梯度下降', 'Gradient descent'), s: [t('沿负梯度走一步', 'Step against the gradient')] }] },
    { h: 56, boxes: [{ id: 'kLR', col: 'l', t: t('学习率', 'Learning rate'), s: [t('步子多大', 'How big a step')] }, { id: 'kSGD', col: 'r', t: t('随机梯度', 'Stochastic GD'), s: [t('小批量估计', 'Mini-batch estimate')] }] },
    { h: 56, boxes: [{ id: 'nLr', col: 'l', t: t('用在：学习率设置', 'Used: LR setting'), s: [t('训练超参数', 'Hyperparameter')] }, { id: 'kAdam', col: 'r', t: t('动量与 Adam', 'Momentum, Adam'), s: [t('平滑噪声', 'Smooth the noise')] }] },
    { h: 52, boxes: [{ id: 'nOpt', col: 'r', t: t('用在：优化器', 'Used: optimizer'), s: [t('训练循环', 'Training loop')] }] },
  ], [['kGD', 'kLR'], ['kGD', 'kSGD'], ['kLR', 'nLr'], ['kSGD', 'kAdam'], ['kAdam', 'nOpt']], KCAT);

  P.card('c_K4_0', 1, t('训练就是一步步下山', 'Training is walking downhill, one step at a time'), `
<p class="lead">${t(`${P.open('nLoss')}是一片有上亿个维度的“地形”。${P.open('kGD')}每次沿最陡的下坡方向走一小步；${P.open('kLR')}决定步子多大；${P.open('kSGD')}用一小批数据估计坡度；${P.open('kAdam')}把有噪声的坡度平滑一下。本站证明这些做法为什么成立。`, `The ${P.open('nLoss')} is a landscape with hundreds of millions of dimensions. ${P.open('kGD')} takes a small step along the steepest way down; the ${P.open('kLR')} sets the step size; ${P.open('kSGD')} estimates the slope from a small batch; ${P.open('kAdam')} smooths that noisy slope. This stop proves why each of these works.`)}</p>`, { h2: true });

  P.card('c_K4_1', 2, t('⛰️ 为什么沿负梯度走：最陡下降', '⛰️ Why step against the gradient: steepest descent'), `
${M(r`\theta\ \leftarrow\ \theta-\eta\,\nabla L(\theta)`)}
<p>${t(`${m(r`\eta>0`)} 是学习率。为什么偏偏是负梯度方向？先证明一个工具。`, `${m(r`\eta>0`)} is the learning rate. Why exactly the negative gradient? First a tool.`)}</p>
${proof(P, t(`柯西–施瓦茨不等式：${m(r`|a\cdot b|\le\|a\|\,\|b\|`)}`, `Cauchy–Schwarz: ${m(r`|a\cdot b|\le\|a\|\,\|b\|`)}`), [
    [t(`${m('b=0')} 时两边都是 0。下面设 ${m(r`b\neq 0`)}。`, `If ${m('b=0')} both sides are 0. Assume ${m(r`b\neq 0`)} from here on.`), ''],
    [M(r`0\le\|a-sb\|^2=\|a\|^2-2s\,(a\cdot b)+s^2\|b\|^2\quad\text{for every real } s`), t('平方和非负；用点积的双线性展开。', 'A squared length is non-negative; expand with bilinearity.')],
    [t(`这是 ${m('s')} 的二次函数（${m(r`\|b\|^2>0`)}），始终 ≥ 0，所以判别式 ≤ 0：${m(r`4(a\cdot b)^2-4\|a\|^2\|b\|^2\le 0`)}。`, `This is a quadratic in ${m('s')} (with ${m(r`\|b\|^2>0`)}) that is never negative, so its discriminant is ≤ 0: ${m(r`4(a\cdot b)^2-4\|a\|^2\|b\|^2\le 0`)}.`), t('若判别式 > 0，二次函数会有两个实根，在两根之间取负值。', 'A positive discriminant would give two real roots with negative values between them.')],
    [M(r`|a\cdot b|\le\|a\|\,\|b\|`), t('移项，两边开方。', 'Rearrange and take square roots.')],
  ])}
${proof(P, t(`负梯度是下降最快的方向`, `The negative gradient is the direction of fastest decrease`), [
    [t(`取单位方向 ${m('u')}（${m(r`\|u\|=1`)}），令 ${m(r`g(s)=L(\theta+su)`)}。沿 ${m('u')} 的变化率是`, `Take a unit direction ${m('u')} (${m(r`\|u\|=1`)}) and let ${m(r`g(s)=L(\theta+su)`)}. The rate of change along ${m('u')} is`) + M(r`g'(0)=\sum_i\frac{\partial L}{\partial\theta_i}\,u_i=\nabla L\cdot u`), t('多元链式法则：每个 θᵢ 以速度 uᵢ 变化。', 'Multivariable chain rule: each θᵢ moves at speed uᵢ.')],
    [M(r`\nabla L\cdot u\ \ge\ -\|\nabla L\|\,\|u\|=-\|\nabla L\|`), t('柯西–施瓦茨。', 'Cauchy–Schwarz.')],
    [t(`当 ${m(r`\nabla L\neq 0`)}，取 ${m(r`u=-\nabla L/\|\nabla L\|`)} 时 ${m(r`\nabla L\cdot u=-\|\nabla L\|`)}，恰好取到下界。`, `When ${m(r`\nabla L\neq 0`)}, the choice ${m(r`u=-\nabla L/\|\nabla L\|`)} gives ${m(r`\nabla L\cdot u=-\|\nabla L\|`)}, hitting the bound.`), t('直接代入。', 'Substitute.')],
  ])}
<p>${t(`而且步子足够小时一定下降：由线性近似（微积分站）${m(r`L(\theta-\eta g)=L(\theta)-\eta\|g\|^2+o(\eta)`)}，其中 ${m(r`g=\nabla L\neq 0`)}，所以小的 ${m(r`\eta>0`)} 让损失严格变小。`, `And a small enough step always goes down: by the linear approximation (Calculus stop), ${m(r`L(\theta-\eta g)=L(\theta)-\eta\|g\|^2+o(\eta)`)} with ${m(r`g=\nabla L\neq 0`)}, so a small ${m(r`\eta>0`)} strictly lowers the loss.`)}</p>`);

  P.card('c_K4_2', 2, t('🎚️ 学习率：太小太慢，太大就发散', '🎚️ Learning rate: too small is slow, too large diverges'), `
<p>${t(`用最简单的地形看清楚：${m(r`f(x)=\tfrac{a}{2}x^2`)}（${m('a>0')}），最低点在 ${m('x=0')}，${m("f'(x)=ax")}。`, `The simplest landscape makes it clear: ${m(r`f(x)=\tfrac{a}{2}x^2`)} with ${m('a>0')}, minimum at ${m('x=0')}, ${m("f'(x)=ax")}.`)}</p>
${proof(P, t(`梯度下降收敛当且仅当 ${m(r`0<\eta<2/a`)}`, `Gradient descent converges iff ${m(r`0<\eta<2/a`)}`), [
    [M(r`x_{k+1}=x_k-\eta\,a\,x_k=(1-\eta a)\,x_k`), t('代入更新公式。', 'Substitute into the update.')],
    [M(r`x_k=(1-\eta a)^k\,x_0`), t('对 k 归纳。', 'Induction on k.')],
    [t(`对 ${m(r`x_0\neq 0`)}，${m(r`x_k\to 0`)} 当且仅当 ${m(r`|1-\eta a|<1`)}。`, `For ${m(r`x_0\neq 0`)}, ${m(r`x_k\to 0`)} iff ${m(r`|1-\eta a|<1`)}.`), t(`${m(r`|\rho|<1`)} 时 ${m(r`\rho^k\to 0`)}；${m(r`|\rho|=1`)} 时 ${m(r`|\rho^k|=1`)}；${m(r`|\rho|>1`)} 时 ${m(r`|\rho^k|\to\infty`)}。`, `${m(r`\rho^k\to 0`)} when ${m(r`|\rho|<1`)}; ${m(r`|\rho^k|=1`)} when ${m(r`|\rho|=1`)}; ${m(r`|\rho^k|\to\infty`)} when ${m(r`|\rho|>1`)}.`)],
    [M(r`-1<1-\eta a<1\iff 0<\eta a<2\iff 0<\eta<\frac{2}{a}`), t('解不等式（a > 0）。', 'Solve the inequality (a > 0).')],
  ])}
<ul class="pts">
<li>${t(`${m(r`0<\eta<1/a`)}：每步同向缩小，平稳收敛。`, `${m(r`0<\eta<1/a`)}: shrinks the same side every step, a smooth approach.`)}</li>
<li>${t(`${m(r`\eta=1/a`)}：一步到达最低点。`, `${m(r`\eta=1/a`)}: lands on the minimum in one step.`)}</li>
<li>${t(`${m(r`1/a<\eta<2/a`)}：来回跳但越跳越小，仍收敛。`, `${m(r`1/a<\eta<2/a`)}: bounces from side to side but shrinks, still converges.`)}</li>
<li>${t(`${m(r`\eta\ge 2/a`)}：原地来回跳（等号）或越跳越远（发散）。`, `${m(r`\eta\ge 2/a`)}: bounces forever (equality) or further and further out (divergence).`)}</li>
</ul>
<p>${t(`多维的二次函数 ${m(r`f(x)=\tfrac12 x^{\mathsf T}Hx`)}（${m('H')} 对称正定）同理：把 ${m('H')} 对角化 ${m(r`H=Q\Lambda Q^{\mathsf T}`)}，在坐标 ${m(r`u=Q^{\mathsf T}x`)} 下每个分量独立地按 ${m(r`u_i\leftarrow(1-\eta\lambda_i)u_i`)} 更新，所以条件是 ${m(r`\eta<2/\lambda_{\max}`)}：最陡的那个方向决定了学习率的上限。`, `A many-dimensional quadratic ${m(r`f(x)=\tfrac12 x^{\mathsf T}Hx`)} (${m('H')} symmetric positive definite) works the same way: diagonalise ${m(r`H=Q\Lambda Q^{\mathsf T}`)}; in the coordinates ${m(r`u=Q^{\mathsf T}x`)} each entry updates on its own as ${m(r`u_i\leftarrow(1-\eta\lambda_i)u_i`)}, so the condition is ${m(r`\eta<2/\lambda_{\max}`)}: the steepest direction caps the learning rate.`)}</p>`);

  P.lab('labGD', t('学习率与收敛：在 f(x)=x² 上走 12 步', 'Learning rate and convergence: 12 steps on f(x) = x²'),
    t('地形取 f(x)=x²（a=2），起点 x₀=3；每一步都是精确计算。', 'The landscape is f(x) = x² (a = 2), starting at x₀ = 3; every step is computed exactly.'),
    [t('上面的证明说临界值是 2/a = 1；在这里拖过 1，亲眼看收敛变成发散。', 'The proof says the threshold is 2/a = 1; drag past 1 and watch convergence turn into divergence.')],
    `<div class="k-ctl"><label>η = <b id="gdEv">0.2</b><input type="range" id="gdE" min="0.05" max="1.2" step="0.05" value="0.2"></label></div>
<svg id="gdPlot" class="k-plot" viewBox="0 0 320 200" role="img" aria-label="${t('抛物线和每一步的位置', 'The parabola and the position after each step')}"></svg>
<div id="gdOut" class="k-out" aria-live="polite"></div>`,
    [t('η=0.5：一步到底（η=1/a）。', 'η = 0.5: one step to the bottom (η = 1/a).'),
      t('η=0.8：左右来回跳，但越来越近。', 'η = 0.8: bounces left and right but closes in.'),
      t('η=1：在 3 和 −3 之间永远跳；η=1.05 起越跳越远。', 'η = 1: bounces between 3 and −3 forever; from η = 1.05 it flies off.')]);

  P.card('c_K4_3', 2, t('🎰 随机梯度：用一小批数据估计坡度', '🎰 Stochastic gradient: estimating the slope from a small batch'), `
<p>${t(`完整的损失是全部 ${m('N')} 个样本的平均 ${m(r`L=\frac1N\sum_{i=1}^{N}\ell_i`)}，算一次完整梯度太贵。${P.open('nBatch')}的做法是：每步随机抽 ${m('B')} 个样本（这里按有放回、均匀抽样分析），用它们的平均梯度代替：`, `The full loss is the average over all ${m('N')} examples, ${m(r`L=\frac1N\sum_{i=1}^{N}\ell_i`)}, and its exact gradient is too expensive. ${P.open('nBatch')} instead draws ${m('B')} examples at random each step (analysed here as uniform sampling with replacement) and uses their average gradient:`)}</p>
${M(r`\hat g=\frac1B\sum_{b=1}^{B}\nabla\ell_{i_b},\qquad i_b\ \text{uniform on}\ \{1,\dots,N\}`)}
${proof(P, t(`无偏，且方差按 ${m('1/B')} 下降`, `Unbiased, with variance falling as ${m('1/B')}`), [
    [M(r`\mathbb E\big[\nabla\ell_{i_b}\big]=\sum_{i=1}^{N}\frac1N\nabla\ell_i=\nabla L`), t('每个样本被抽中的概率是 1/N；求导和有限求和可交换。', 'Each example is drawn with probability 1/N; differentiation commutes with a finite sum.')],
    [M(r`\mathbb E[\hat g]=\frac1B\sum_{b=1}^{B}\nabla L=\nabla L`), t('期望的线性。', 'Linearity of expectation.')],
    [M(r`\operatorname{Var}(\hat g_j)=\frac{1}{B^2}\sum_{b=1}^{B}\operatorname{Var}\big(\partial_j\ell_{i_b}\big)=\frac{\sigma_j^2}{B}`), t(`对每个分量 ${m('j')}：${m(r`\operatorname{Var}(cX)=c^2\operatorname{Var}(X)`)}，独立抽样时方差相加（概率站），${m(r`\sigma_j^2`)} 是单个样本梯度的方差。`, `For each entry ${m('j')}: ${m(r`\operatorname{Var}(cX)=c^2\operatorname{Var}(X)`)}, and independent draws add variances (Probability stop); ${m(r`\sigma_j^2`)} is the variance of one example’s gradient.`)],
  ])}
<p>${t(`所以噪声的标准差按 ${m(r`1/\sqrt B`)} 下降：批大小翻 4 倍，噪声只减半。（无放回抽样时方差再乘 ${m(r`\frac{N-B}{N-1}`)}，更小一点。）`, `So the noise’s standard deviation falls as ${m(r`1/\sqrt B`)}: a 4× larger batch only halves the noise. (Sampling without replacement multiplies the variance by ${m(r`\frac{N-B}{N-1}`)}, slightly smaller.)`)}</p>`);

  P.card('c_K4_4', 2, t('🚀 动量与 Adam：把噪声平均掉，每个参数自己定步长', '🚀 Momentum and Adam: average out the noise, give each parameter its own step'), `
<p>${t('动量把过去的梯度累积起来，噪声的方向互相抵消、一致的方向越走越快：', 'Momentum accumulates past gradients, so noisy directions cancel and consistent ones speed up:')}</p>
${M(r`v_t=\beta v_{t-1}+g_t,\qquad \theta_t=\theta_{t-1}-\eta\,v_t`)}
<p>${t('Adam（Kingma 与 Ba，2014）同时追踪梯度的滑动平均 m 和梯度平方的滑动平均 v，并做“偏差修正”：', 'Adam (Kingma and Ba, 2014) tracks a moving average m of the gradient and v of its square, and applies a “bias correction”:')}</p>
${M(r`\begin{aligned}m_t&=\beta_1 m_{t-1}+(1-\beta_1)\,g_t\\ v_t&=\beta_2 v_{t-1}+(1-\beta_2)\,g_t^2\\ \hat m_t&=\frac{m_t}{1-\beta_1^t},\quad \hat v_t=\frac{v_t}{1-\beta_2^t}\\ \theta_t&=\theta_{t-1}-\alpha\,\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}\end{aligned}`)}
<p>${t(`所有运算按分量进行。论文给出的默认值：${m(r`\alpha=0.001,\ \beta_1=0.9,\ \beta_2=0.999,\ \epsilon=10^{-8}`)}。除以 ${m(r`\sqrt{\hat v}`)} 让每个参数的步长大致与梯度的尺度无关。`, `Everything is element-wise. The paper’s defaults are ${m(r`\alpha=0.001,\ \beta_1=0.9,\ \beta_2=0.999,\ \epsilon=10^{-8}`)}. Dividing by ${m(r`\sqrt{\hat v}`)} makes each parameter’s step roughly independent of its gradient’s scale.`)}</p>
${proof(P, t(`为什么要除以 ${m(r`1-\beta_1^t`)}`, `Why divide by ${m(r`1-\beta_1^t`)}`), [
    [M(r`m_t=(1-\beta_1)\sum_{i=1}^{t}\beta_1^{\,t-i}\,g_i`), t(`从 ${m('m_0=0')} 开始把递推式展开（对 t 归纳）。`, `Unroll the recursion from ${m('m_0=0')} (induction on t).`)],
    [M(r`\mathbb E[m_t]=\mathbb E[g]\,(1-\beta_1)\sum_{i=1}^{t}\beta_1^{\,t-i}`), t(`假设梯度的期望不随时间变化，${m(r`\mathbb E[g_i]=\mathbb E[g]`)}；期望的线性。`, `Assume the gradient’s expectation does not change over time, ${m(r`\mathbb E[g_i]=\mathbb E[g]`)}; linearity.`)],
    [M(r`(1-\beta_1)\sum_{i=1}^{t}\beta_1^{\,t-i}=(1-\beta_1)\,\frac{1-\beta_1^{t}}{1-\beta_1}=1-\beta_1^{t}`), t('等比数列求和。', 'Geometric series.')],
    [M(r`\mathbb E\Big[\frac{m_t}{1-\beta_1^t}\Big]=\mathbb E[g]`), t(`所以修正后无偏。${m('v_t')} 同理。`, `So the corrected estimate is unbiased. The same holds for ${m('v_t')}.`)],
  ])}
${ex(P, t('第 1 步', 'Step 1'), `<p>${t(`${m('t=1')} 时 ${m(r`m_1=0.1\,g_1`)}，偏向 0；除以 ${m(r`1-0.9=0.1`)} 后 ${m(r`\hat m_1=g_1`)}，恰好是第一个梯度。`, `At ${m('t=1')}, ${m(r`m_1=0.1\,g_1`)} is biased towards 0; dividing by ${m(r`1-0.9=0.1`)} gives ${m(r`\hat m_1=g_1`)}, exactly the first gradient.`)}</p>`)}
<p>${t('AdamW（Loshchilov 与 Hutter）把权重衰减从梯度里拿出来，直接作用在参数上（“解耦”），是目前训练大模型常见的优化器。', 'AdamW (Loshchilov and Hutter) takes weight decay out of the gradient and applies it directly to the parameters (“decoupled”); it is a common optimizer for training large models today.')}</p>
<p class="k-src">${t('来源', 'Sources')}: <a href="https://arxiv.org/abs/1412.6980" target="_blank" rel="noopener noreferrer">Kingma &amp; Ba, Adam (arXiv 1412.6980)</a> · <a href="https://arxiv.org/abs/1711.05101" target="_blank" rel="noopener noreferrer">Loshchilov &amp; Hutter, Decoupled Weight Decay Regularization (arXiv 1711.05101)</a></p>`, { closed: true });

  P.quiz();
  return {
    sub: t('最陡下降 → 学习率 → 小批量 → Adam：训练循环每一步的数学。', 'Steepest descent → learning rate → mini-batches → Adam: the math of every training step.'),
    one: t('本站证明负梯度是最陡下降方向、学习率的收敛条件、小批量梯度无偏且方差按 1/B 下降，以及 Adam 偏差修正的来历。', 'Proves that the negative gradient is the steepest descent direction, the learning-rate convergence condition, that mini-batch gradients are unbiased with variance falling as 1/B, and where Adam’s bias correction comes from.'),
    why: t('调参时遇到的“发散”“噪声大”“学习率怎么设”，答案都在这里。', 'The answers to “it diverged”, “too noisy” and “what learning rate?” are all here.'),
    svg, legend: kLegend(t),
  };
}
