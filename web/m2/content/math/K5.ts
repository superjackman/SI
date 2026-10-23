/* Station K5 · Math · Derivations & proofs: backprop, softmax+CE gradient, √dₖ scaling, residual gradients, policy gradient */
import type { Page, StationOut } from '../../lib';
import { M, m } from '../../tex';
import { KCAT } from './K1';
import { kDiagram, kLegend, proof } from './kit';

const r = String.raw;
const src = (items: [string, string][], lbl: string) => `<p class="k-src">${lbl}: ${items.map(([u, n]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${n}</a>`).join(' · ')}</p>`;

export default function K5(P: Page): StationOut {
  const { t } = P;
  const svg = kDiagram(P, 'svgK5', [
    { h: 52, boxes: [{ id: 'kBP', col: 'c', t: t('反向传播推导', 'Backprop'), s: [t('逐层的链式法则', 'Chain rule per layer')] }] },
    { h: 56, boxes: [{ id: 'kSCE', col: 'l', t: t('梯度 p − y', 'Gradient p − y'), s: ['softmax + CE'] }, { id: 'kRes', col: 'r', t: t('残差的梯度', 'Residual grad'), s: [t('恒等通路', 'Identity path')] }] },
    { h: 56, boxes: [{ id: 'kSqrt', col: 'a', t: t('√dₖ 缩放', '√dₖ scaling'), s: [t('防饱和', 'No saturation')] }, { id: 'kPG', col: 'b', t: t('策略梯度', 'Policy grad.'), s: ['∇log π'] }, { id: 'residual', col: 'e', t: t('用在：残差', 'Used: residual'), s: ['x + F(x)'] }] },
    { h: 52, boxes: [{ id: 'score', col: 'a', t: t('用在：打分', 'Used: scores'), s: ['QKᵀ'] }, { id: 'rl', col: 'b', t: t('用在：强化', 'Used: RL'), s: [t('后训练', 'Post-training')] }] },
  ], [['kBP', 'kSCE'], ['kBP', 'kRes'], ['kSCE', 'kSqrt'], ['kSCE', 'kPG'], ['kRes', 'residual'], ['kSqrt', 'score'], ['kPG', 'rl']], KCAT);

  P.card('c_K5_0', 1, t('把模型里最重要的几条公式，从头推一遍', 'Derive the model’s most important formulas from scratch'), `
<p class="lead">${t(`前四站准备好了工具，这里把它们用在真正的模型上：${P.open('kBP')}、输出层的${P.open('kSCE')}、注意力的${P.open('kSqrt')}、${P.open('kRes')}，以及后训练用到的${P.open('kPG')}。每条都逐步证明，并注明假设。`, `The first four stops built the tools; here they are applied to the real model: ${P.open('kBP')}, the output layer’s ${P.open('kSCE')}, attention’s ${P.open('kSqrt')}, ${P.open('kRes')}, and the ${P.open('kPG')} used in post-training. Each is proved step by step with its assumptions stated.`)}</p>`, { h2: true });

  P.card('c_K5_1', 2, t('🔁 反向传播：两层网络的完整推导', '🔁 Backpropagation: the full derivation for two layers'), `
<p>${t(`网络：输入 ${m('x')}，激活函数 ${m(r`\varphi`)} 逐元素作用，损失 ${m(r`L=\ell(z^{(2)})`)}。`, `The network: input ${m('x')}, an activation ${m(r`\varphi`)} applied element-wise, loss ${m(r`L=\ell(z^{(2)})`)}.`)}</p>
${M(r`z^{(1)}=W^{(1)}x+b^{(1)},\quad h=\varphi\big(z^{(1)}\big),\quad z^{(2)}=W^{(2)}h+b^{(2)}`)}
<p>${t(`记“误差信号” ${m(r`\delta^{(2)}=\partial L/\partial z^{(2)}`)}、${m(r`\delta^{(1)}=\partial L/\partial z^{(1)}`)}（与 ${m('z')} 同形状的向量）。`, `Write the “error signals” ${m(r`\delta^{(2)}=\partial L/\partial z^{(2)}`)} and ${m(r`\delta^{(1)}=\partial L/\partial z^{(1)}`)} (vectors shaped like ${m('z')}).`)}</p>
${proof(P, t('逐步推导', 'Step-by-step derivation'), [
    [M(r`\frac{\partial L}{\partial W^{(2)}_{ij}}=\delta^{(2)}_i\,h_j,\qquad \frac{\partial L}{\partial b^{(2)}_i}=\delta^{(2)}_i`), t(`${m(r`z^{(2)}_i=\sum_k W^{(2)}_{ik}h_k+b^{(2)}_i`)}；${m(r`W^{(2)}_{ij}`)} 只出现在 ${m(r`z^{(2)}_i`)} 里，系数是 ${m('h_j')}（链式法则）。`, `${m(r`z^{(2)}_i=\sum_k W^{(2)}_{ik}h_k+b^{(2)}_i`)}; ${m(r`W^{(2)}_{ij}`)} appears only in ${m(r`z^{(2)}_i`)}, with coefficient ${m('h_j')} (chain rule).`)],
    [M(r`\frac{\partial L}{\partial h_k}=\sum_i \delta^{(2)}_i\,W^{(2)}_{ik}=\Big(\big(W^{(2)}\big)^{\mathsf T}\delta^{(2)}\Big)_k`), t(`${m('h_k')} 通过每个 ${m(r`z^{(2)}_i`)} 影响 L，各路径相加（多元链式法则）；即雅可比的转置（线性代数站）。`, `${m('h_k')} reaches L through every ${m(r`z^{(2)}_i`)}; add over the paths (multivariable chain rule). This is the transposed Jacobian (Linear algebra stop).`)],
    [M(r`\delta^{(1)}_k=\frac{\partial L}{\partial h_k}\,\varphi'\big(z^{(1)}_k\big)\ \Longrightarrow\ \delta^{(1)}=\Big(\big(W^{(2)}\big)^{\mathsf T}\delta^{(2)}\Big)\odot\varphi'\big(z^{(1)}\big)`), t(`${m('h_k')} 只依赖 ${m(r`z^{(1)}_k`)}（逐元素激活），单条路径的链式法则；${m(r`\odot`)} 是逐元素乘法。`, `${m('h_k')} depends only on ${m(r`z^{(1)}_k`)} (element-wise activation): a single-path chain rule; ${m(r`\odot`)} is element-wise multiplication.`)],
    [M(r`\nabla_{W^{(1)}}L=\delta^{(1)}x^{\mathsf T},\qquad \nabla_{b^{(1)}}L=\delta^{(1)}`), t('与第 1 步完全相同的论证，把 h 换成 x。', 'Exactly the argument of step 1, with x in place of h.')],
    [M(r`\delta^{(l)}=\Big(\big(W^{(l+1)}\big)^{\mathsf T}\delta^{(l+1)}\Big)\odot\varphi'\big(z^{(l)}\big),\qquad \nabla_{W^{(l)}}L=\delta^{(l)}\big(h^{(l-1)}\big)^{\mathsf T}`), t(`任意层数：对层数从后往前归纳，每一步重复第 2–4 步（${m(r`h^{(0)}=x`)}）。`, `Any depth: induct from the last layer backwards, repeating steps 2–4 each time (${m(r`h^{(0)}=x`)}).`)],
  ])}
<p>${t(`关键在于 ${m(r`\delta^{(l)}`)} 由 ${m(r`\delta^{(l+1)}`)} 一次矩阵乘法得到，前一层的结果被重复利用，所以一次反向传播的计算量和一次前向传播同一量级，而不是每个参数单独算一遍。这就是 Rumelhart、Hinton 与 Williams 1986 年在《自然》上发表的算法。`, `The key is that ${m(r`\delta^{(l)}`)} comes from ${m(r`\delta^{(l+1)}`)} by one matrix product, reusing the later layer’s work, so one backward pass costs the same order as one forward pass instead of one pass per parameter. This is the algorithm Rumelhart, Hinton and Williams published in Nature in 1986.`)}</p>
${src([['https://www.nature.com/articles/323533a0', 'Rumelhart, Hinton &amp; Williams, Nature 323 (1986)']], t('来源', 'Source'))}`);

  P.lab('labGradCheck', t('反向传播 vs 数值梯度：亲手验证推导', 'Backprop vs numerical gradient: check the derivation yourself'),
    t('一个最小网络：h = σ(w₁x)，ŷ = w₂h，L = ½(ŷ − y)²，x = 1、y = 1 固定（示意），两种方法都是精确计算。', 'A minimal network: h = σ(w₁x), ŷ = w₂h, L = ½(ŷ − y)², with x = 1 and y = 1 fixed (illustrative); both methods are computed exactly.'),
    [t('推导对不对，可以用数值差分检验：两种方法算出的梯度应该几乎一样。真实框架的开发者也这样测试。', 'A derivation can be checked numerically: both methods should give almost the same gradient. Framework developers test this way too.')],
    `<div class="k-ctl">
<label>w₁ = <b id="gcW1v">0.5</b><input type="range" id="gcW1" min="-3" max="3" step="0.25" value="0.5"></label>
<label>w₂ = <b id="gcW2v">1.5</b><input type="range" id="gcW2" min="-3" max="3" step="0.25" value="1.5"></label></div>
<div id="gcOut" class="k-out" aria-live="polite"></div>`,
    [t('任意设 w₁、w₂：两列的数字在小数点后 7 位以内一致（相对误差约 10⁻⁸ 或更小）。', 'Set any w₁, w₂: the two columns agree to about 7 decimal places (relative error around 10⁻⁸ or less).'),
      t('看 σ′ = h(1 − h) 一行：w₁ = 0 时是 0.25；拉到 ±3 只剩约 0.045。传给 w₁ 的梯度都要乘这个因子，这就是饱和造成梯度变小的原因。', 'Watch the σ′ = h(1 − h) row: 0.25 at w₁ = 0, only about 0.045 at ±3. Every gradient reaching w₁ is multiplied by this factor; that is how saturation shrinks gradients.')]);

  P.card('c_K5_2', 2, t('🎯 softmax + 交叉熵的梯度为什么是 p − y', '🎯 Why the softmax + cross-entropy gradient is p − y'), `
<p>${t(`输出分数 ${m('z')}，${m(r`p=\operatorname{softmax}(z)`)}，目标分布 ${m('y')}（${m(r`y_k\ge0,\ \sum_k y_k=1`)}，独热是特例），损失 ${m(r`L=-\sum_k y_k\log p_k`)}。`, `Output scores ${m('z')}, ${m(r`p=\operatorname{softmax}(z)`)}, target distribution ${m('y')} (${m(r`y_k\ge0,\ \sum_k y_k=1`)}; one-hot is a special case), loss ${m(r`L=-\sum_k y_k\log p_k`)}.`)}</p>
${proof(P, M(r`\frac{\partial L}{\partial z_i}=p_i-y_i`), [
    [M(r`\log p_k=z_k-\log\sum_j e^{z_j}`), t('softmax 的定义取对数。', 'Take the log of the softmax definition.')],
    [M(r`\frac{\partial\log p_k}{\partial z_i}=\delta_{ki}-\frac{e^{z_i}}{\sum_j e^{z_j}}=\delta_{ki}-p_i`), t(`${m(r`\delta_{ki}`)} 在 k = i 时为 1，否则为 0；第二项用链式法则对 ${m(r`\log\sum_j e^{z_j}`)} 求导。`, `${m(r`\delta_{ki}`)} is 1 when k = i and 0 otherwise; the second term is the chain rule on ${m(r`\log\sum_j e^{z_j}`)}.`)],
    [M(r`\frac{\partial L}{\partial z_i}=-\sum_k y_k(\delta_{ki}-p_i)=-y_i+p_i\sum_k y_k=p_i-y_i`), t(`求和中只有 k = i 一项含 δ，且 ${m(r`\sum_k y_k=1`)}。`, `Only the k = i term of the sum has the δ, and ${m(r`\sum_k y_k=1`)}.`)],
  ])}
<p>${t(`顺带得到 softmax 的雅可比：${m(r`\partial p_k/\partial z_i=p_k(\delta_{ki}-p_i)`)}（由 ${m(r`\partial p_k/\partial z_i=p_k\,\partial\log p_k/\partial z_i`)}）。梯度 ${m('p-y')} 每个分量都在 −1 到 1 之间：模型错得越离谱，梯度越大，不会因为输出饱和而消失。`, `As a by-product, the softmax Jacobian is ${m(r`\partial p_k/\partial z_i=p_k(\delta_{ki}-p_i)`)} (from ${m(r`\partial p_k/\partial z_i=p_k\,\partial\log p_k/\partial z_i`)}). Every entry of ${m('p-y')} lies between −1 and 1: the more wrong the model, the larger the gradient, and it does not vanish because the output saturated.`)}</p>`);

  P.card('c_K5_3', 2, t('📏 注意力为什么除以 √dₖ', '📏 Why attention divides by √dₖ'), `
${M(r`\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\Big(\frac{QK^{\mathsf T}}{\sqrt{d_k}}\Big)V`)}
<p>${t(`原论文的解释：假设查询 ${m('q')} 和键 ${m('k')} 的各分量是独立随机变量，均值 0、方差 1。`, `The original paper’s explanation: assume the components of a query ${m('q')} and a key ${m('k')} are independent random variables with mean 0 and variance 1.`)}</p>
${proof(P, t(`${m(r`\operatorname{Var}(q\cdot k)=d_k`)}，缩放后方差为 1`, `${m(r`\operatorname{Var}(q\cdot k)=d_k`)}; after scaling the variance is 1`), [
    [M(r`\mathbb E[q_ik_i]=\mathbb E[q_i]\,\mathbb E[k_i]=0`), t('独立变量乘积的期望等于期望的乘积。', 'For independent variables the expectation of a product is the product of expectations.')],
    [M(r`\operatorname{Var}(q_ik_i)=\mathbb E[q_i^2k_i^2]-0^2=\mathbb E[q_i^2]\,\mathbb E[k_i^2]=1\cdot 1=1`), t(`${m(r`\operatorname{Var}=\mathbb E[X^2]-\mu^2`)}；独立；均值为 0 时 ${m(r`\mathbb E[q_i^2]=\operatorname{Var}(q_i)=1`)}。`, `${m(r`\operatorname{Var}=\mathbb E[X^2]-\mu^2`)}; independence; with mean 0, ${m(r`\mathbb E[q_i^2]=\operatorname{Var}(q_i)=1`)}.`)],
    [M(r`\operatorname{Var}\Big(\sum_{i=1}^{d_k}q_ik_i\Big)=\sum_{i=1}^{d_k}1=d_k`), t('各项相互独立，方差相加（概率站）。', 'The terms are independent, so variances add (Probability stop).')],
    [M(r`\operatorname{Var}\Big(\frac{q\cdot k}{\sqrt{d_k}}\Big)=\frac{d_k}{d_k}=1`), t(`${m(r`\operatorname{Var}(cX)=c^2\operatorname{Var}(X)`)}。`, `${m(r`\operatorname{Var}(cX)=c^2\operatorname{Var}(X)`)}.`)],
  ])}
<p>${t(`为什么方差大不好？例如 ${m(r`d_k=64`)} 时，不缩放的分数标准差是 8，分数之间相差几十很常见，softmax 几乎把全部概率给一个位置（示意）。此时由上一张卡的雅可比 ${m(r`p_k(\delta_{ki}-p_i)`)}：若某个 ${m(r`p_m\approx1`)}、其余 ${m(r`\approx0`)}，每一项里都有一个接近 0 的因子，梯度几乎消失，模型很难学。除以 ${m(r`\sqrt{d_k}`)} 把分数拉回标准差 1 左右。`, `Why is a large variance bad? With ${m(r`d_k=64`)}, unscaled scores have standard deviation 8, gaps of tens between scores are common, and softmax gives almost all the probability to one position (illustrative). By the Jacobian ${m(r`p_k(\delta_{ki}-p_i)`)} from the previous card, if one ${m(r`p_m\approx1`)} and the rest ${m(r`\approx0`)}, every entry has a factor near 0, the gradient almost vanishes and learning stalls. Dividing by ${m(r`\sqrt{d_k}`)} brings the scores back to a standard deviation around 1.`)}</p>
${src([['https://arxiv.org/abs/1706.03762', 'Vaswani et al., Attention Is All You Need (arXiv 1706.03762), §3.2.1']], t('来源', 'Source'))}`);

  P.card('c_K5_4', 2, t('🛤️ 残差连接：梯度永远有一条直达通路', '🛤️ Residual connections: the gradient always has a direct path'), `
<p>${t(`${P.open('residual')}把一层写成 ${m('y=x+F(x)')}。它的雅可比是 ${m(r`I+J_F`)}（${m('I')} 是单位矩阵）。${m('L')} 层堆起来，由链式法则：`, `A ${P.open('residual')} writes a layer as ${m('y=x+F(x)')}. Its Jacobian is ${m(r`I+J_F`)} (${m('I')} is the identity). Stack ${m('L')} of them and the chain rule gives:`)}</p>
${M(r`\frac{\partial x_L}{\partial x_0}=(I+J_L)(I+J_{L-1})\cdots(I+J_1)`)}
${proof(P, t(`展开后一定含有单独的 ${m('I')}：${m(r`\prod_{l}(I+J_l)=I+R_L`)}，${m(r`R_L`)} 的每一项都至少含一个 ${m('J')}`, `The expansion always contains a bare ${m('I')}: ${m(r`\prod_{l}(I+J_l)=I+R_L`)}, where every term of ${m(r`R_L`)} contains at least one ${m('J')}`), [
    [t(`${m('L=1')}：${m(r`I+J_1`)}，取 ${m(r`R_1=J_1`)}。`, `${m('L=1')}: ${m(r`I+J_1`)}, with ${m(r`R_1=J_1`)}.`), t('归纳起点。', 'Base case.')],
    [M(r`(I+J_{L+1})(I+R_L)=I+\underbrace{R_L+J_{L+1}+J_{L+1}R_L}_{R_{L+1}}`), t(`展开；${m(r`R_{L+1}`)} 的每一项都含有某个 ${m('J')}。`, `Expand; every term of ${m(r`R_{L+1}`)} contains some ${m('J')}.`)],
  ])}
<p>${t(`所以梯度 ${m(r`\nabla_{x_0}L=\big(I+R_L\big)^{\mathsf T}\nabla_{x_L}L`)} 里总有一项 ${m(r`\nabla_{x_L}L`)} 原样传回第一层，不经过任何一层的缩放。对比没有残差的堆叠，梯度是 ${m('L')} 个雅可比的乘积：如果每层把梯度缩小一半，20 层后只剩 ${m(r`0.5^{20}\approx 9.5\times10^{-7}`)}（示意）。这条直达通路是 ResNet 能训练上百层、Transformer 每个子层都套残差的原因之一。`, `So the gradient ${m(r`\nabla_{x_0}L=\big(I+R_L\big)^{\mathsf T}\nabla_{x_L}L`)} always contains the term ${m(r`\nabla_{x_L}L`)} passed back to the first layer untouched by any layer’s scaling. Compare a plain stack, where the gradient is a product of ${m('L')} Jacobians: if each layer halves it, after 20 layers only ${m(r`0.5^{20}\approx 9.5\times10^{-7}`)} is left (illustrative). This direct path is one reason ResNets train with over a hundred layers and every Transformer sub-layer is wrapped in a residual.`)}</p>
${src([['https://arxiv.org/abs/1512.03385', 'He et al., Deep Residual Learning (arXiv 1512.03385)']], t('来源', 'Source'))}`);

  P.card('c_K5_5', 2, t('🎮 策略梯度：只知道“好不好”，也能求梯度', '🎮 Policy gradient: a gradient from nothing but “good or bad”'), `
<p>${t(`${P.open('rl')}里，模型（策略 ${m(r`\pi_\theta`)}）对提示 ${m('x')} 生成回答 ${m('y')}，得到奖励 ${m('R(y)')}——比如答案对了给 1、错了给 0。奖励本身不可导，但它的期望可导。目标：`, `In ${P.open('rl')} the model (policy ${m(r`\pi_\theta`)}) answers a prompt ${m('x')} with ${m('y')} and receives a reward ${m('R(y)')}, say 1 if the answer is right and 0 if not. The reward itself is not differentiable, but its expectation is. The objective:`)}</p>
${M(r`J(\theta)=\mathbb E_{y\sim\pi_\theta(\cdot\mid x)}\big[R(y)\big]=\sum_y \pi_\theta(y\mid x)\,R(y)`)}
${proof(P, t('对数导数技巧（REINFORCE）', 'The log-derivative trick (REINFORCE)'), [
    [M(r`\nabla_\theta J=\sum_y R(y)\,\nabla_\theta\pi_\theta(y\mid x)`), t('R 不依赖 θ；对有限求和逐项求导。', 'R does not depend on θ; differentiate the finite sum term by term.')],
    [M(r`\nabla_\theta\pi_\theta=\pi_\theta\,\nabla_\theta\log\pi_\theta`), t(`${m(r`(\log f)'=f'/f`)}，两边乘 f（${m(r`\pi_\theta>0`)}）。`, `${m(r`(\log f)'=f'/f`)}; multiply by f (${m(r`\pi_\theta>0`)}).`)],
    [M(r`\nabla_\theta J=\sum_y\pi_\theta(y\mid x)\,R(y)\,\nabla_\theta\log\pi_\theta(y\mid x)=\mathbb E_{y\sim\pi_\theta}\big[R(y)\,\nabla_\theta\log\pi_\theta(y\mid x)\big]`), t('代入，求和重新写成期望。', 'Substitute and read the sum as an expectation.')],
    [M(r`\nabla_\theta\log\pi_\theta(y\mid x)=\sum_{t}\nabla_\theta\log\pi_\theta(y_t\mid x,y_{<t})`), t('回答的概率是逐词条件概率的乘积（概率站），取对数变成求和。', 'An answer’s probability is the product of word-by-word conditionals (Probability stop); the log turns it into a sum.')],
  ])}
${proof(P, t(`减去基线 ${m('b')} 不改变期望`, `Subtracting a baseline ${m('b')} keeps it unbiased`), [
    [M(r`\mathbb E_{y\sim\pi_\theta}\big[b\,\nabla_\theta\log\pi_\theta\big]=b\sum_y\nabla_\theta\pi_\theta(y\mid x)=b\,\nabla_\theta\sum_y\pi_\theta(y\mid x)=b\,\nabla_\theta 1=0`), t(`${m('b')} 不依赖 ${m('y')}（可以依赖 ${m('x')}）；同上的技巧反过来用；概率之和恒为 1。`, `${m('b')} does not depend on ${m('y')} (it may depend on ${m('x')}); the same trick in reverse; probabilities always sum to 1.`)],
  ])}
<p>${t(`所以可以用 ${m(r`(R(y)-b)\,\nabla_\theta\log\pi_\theta(y\mid x)`)} 做无偏估计；选一个接近平均奖励的 ${m('b')}（比如同一题多次采样的平均分）能大幅减小方差。直观理解：比平均好的回答，提高它每个词的概率；比平均差的，降低。最后一层是 softmax 时，${m(r`\nabla_z\log\pi(a)=e_a-p`)}——正是上面 p − y 的相反数。`, `So ${m(r`(R(y)-b)\,\nabla_\theta\log\pi_\theta(y\mid x)`)} is an unbiased estimate, and a ${m('b')} near the average reward (for instance the mean score of several samples for the same prompt) cuts the variance a lot. Intuitively: raise the probability of every word in answers better than average, lower it for worse ones. With a softmax last layer, ${m(r`\nabla_z\log\pi(a)=e_a-p`)}, exactly the negative of p − y above.`)}</p>
${src([['https://doi.org/10.1007/BF00992696', 'Williams, Machine Learning 8:229–256 (1992)']], t('来源', 'Source'))}`, { closed: true });

  P.quiz();
  return {
    sub: t('反向传播 → p − y → √dₖ → 残差 → 策略梯度：模型关键公式的完整推导。', 'Backprop → p − y → √dₖ → residuals → policy gradient: full derivations of the model’s key formulas.'),
    one: t('本站把前四站的工具用在真实模型上，逐步推导反向传播、输出层梯度、注意力缩放、残差梯度和策略梯度，并注明每条的假设和出处。', 'Applies the first four stops’ tools to the real model, deriving backprop, the output-layer gradient, attention scaling, residual gradients and the policy gradient step by step, with assumptions and sources.'),
    why: t('这些推导解释了模型为什么这样设计：不是拍脑袋，而是为了让梯度好好流动。', 'These derivations explain why the model is designed as it is: not by whim, but to keep gradients flowing.'),
    svg, legend: kLegend(t),
  };
}
