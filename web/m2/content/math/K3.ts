/* Station K3 · Math · Probability & information: distributions, expectation/variance, Bayes, softmax, entropy, cross-entropy, KL */
import type { Page, StationOut } from '../../lib';
import { M, m } from '../../tex';
import { KCAT } from './K1';
import { ex, kDiagram, kLegend, proof } from './kit';

const r = String.raw;

export default function K3(P: Page): StationOut {
  const { t } = P;
  const svg = kDiagram(P, 'svgK3', [
    { h: 52, boxes: [{ id: 'kProb', col: 'c', t: t('概率分布', 'Distribution'), s: [t('非负，和为 1', 'Non-negative, sums to 1')] }] },
    { h: 56, boxes: [{ id: 'kBayes', col: 'l', t: t('条件概率', 'Conditional'), s: [t('贝叶斯公式', 'Bayes’ rule')] }, { id: 'kSoft', col: 'r', t: 'softmax', s: [t('分数 → 概率', 'Scores → probabilities')] }] },
    { h: 56, boxes: [{ id: 'kEnt', col: 'r', t: t('熵与交叉熵', 'Cross-entropy'), s: [t('惊讶程度', 'Surprise')] }] },
    { h: 56, boxes: [{ id: 'kKL', col: 'l', t: t('KL 散度', 'KL divergence'), s: [t('两个分布差多远', 'Distance-like gap')] }, { id: 'nLoss', col: 'r', t: t('用在：损失函数', 'Used: the loss'), s: [t('训练目标', 'Training target')] }] },
    { h: 52, boxes: [{ id: 'kl', col: 'l', t: t('用在：KL 惩罚', 'Used: KL penalty'), s: [t('对齐训练', 'Alignment')] }] },
  ], [['kProb', 'kBayes'], ['kProb', 'kSoft'], ['kSoft', 'kEnt'], ['kEnt', 'kKL'], ['kEnt', 'nLoss'], ['kKL', 'kl']], KCAT);

  P.card('c_K3_0', 1, t('语言模型输出的是概率；训练它，就是让概率更准', 'A language model outputs probabilities; training makes them more accurate'), `
<p class="lead">${t(`模型每一步给出“下一个词是什么”的${P.open('kProb')}；最后一步用${P.open('kSoft')}把分数变成概率；训练时用${P.open('kEnt')}衡量它猜得多差。本站把这些概念定义清楚，并证明它们的关键性质。`, `At every step a model gives a ${P.open('kProb')} over the next word; ${P.open('kSoft')} turns scores into those probabilities; training measures how badly it guessed with ${P.open('kEnt')}. This stop defines each idea and proves its key properties.`)}</p>`, { h2: true });

  P.card('c_K3_1', 2, t('🎲 分布、期望与方差', '🎲 Distributions, expectation and variance'), `
<p>${t(`离散分布给每个结果一个概率 ${m(r`p(x)\ge 0`)}，且 ${m(r`\sum_x p(x)=1`)}。随机变量 ${m('X')} 的期望和方差是：`, `A discrete distribution gives each outcome a probability ${m(r`p(x)\ge 0`)} with ${m(r`\sum_x p(x)=1`)}. The expectation and variance of a random variable ${m('X')} are:`)}</p>
${M(r`\mathbb E[X]=\sum_x x\,p(x),\qquad \operatorname{Var}(X)=\mathbb E\big[(X-\mu)^2\big],\ \ \mu=\mathbb E[X]`)}
<p>${t(`期望是线性的：${m(r`\mathbb E[aX+bY]=a\,\mathbb E[X]+b\,\mathbb E[Y]`)}（把求和拆开即可，不需要独立）。`, `Expectation is linear, ${m(r`\mathbb E[aX+bY]=a\,\mathbb E[X]+b\,\mathbb E[Y]`)} (split the sum; no independence needed).`)}</p>
${proof(P, m(r`\operatorname{Var}(X)=\mathbb E[X^2]-\mu^2`), [
    [M(r`\mathbb E\big[(X-\mu)^2\big]=\mathbb E\big[X^2-2\mu X+\mu^2\big]`), t('展开平方。', 'Expand the square.')],
    [M(r`=\mathbb E[X^2]-2\mu\,\mathbb E[X]+\mu^2=\mathbb E[X^2]-2\mu^2+\mu^2=\mathbb E[X^2]-\mu^2`), t(`期望的线性，${m(r`\mu`)} 是常数，${m(r`\mathbb E[X]=\mu`)}。`, `Linearity of expectation; ${m(r`\mu`)} is a constant and ${m(r`\mathbb E[X]=\mu`)}.`)],
  ])}
${proof(P, t(`${m('X')}、${m('Y')} 独立时 ${m(r`\operatorname{Var}(X+Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)`)}`, `For independent ${m('X')}, ${m('Y')}: ${m(r`\operatorname{Var}(X+Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)`)}`), [
    [M(r`\operatorname{Var}(X+Y)=\mathbb E\big[(X-\mu_X+Y-\mu_Y)^2\big]`), t('定义，期望的线性。', 'Definition and linearity.')],
    [M(r`=\operatorname{Var}(X)+\operatorname{Var}(Y)+2\,\mathbb E\big[(X-\mu_X)(Y-\mu_Y)\big]`), t('展开平方。', 'Expand the square.')],
    [M(r`\mathbb E\big[(X-\mu_X)(Y-\mu_Y)\big]=\mathbb E[X-\mu_X]\;\mathbb E[Y-\mu_Y]=0\cdot 0=0`), t(`独立时 ${m(r`\mathbb E[UV]=\mathbb E[U]\,\mathbb E[V]`)}（联合概率等于概率的乘积，求和可以拆开）。`, `Under independence ${m(r`\mathbb E[UV]=\mathbb E[U]\,\mathbb E[V]`)} (the joint probability factorises, so the sum splits).`)],
  ])}
<p>${t(`再加上 ${m(r`\operatorname{Var}(cX)=c^2\operatorname{Var}(X)`)}，就能推出两个常用结论：小批量梯度的噪声随批大小下降（见`, `Together with ${m(r`\operatorname{Var}(cX)=c^2\operatorname{Var}(X)`)} this gives two results used later: mini-batch gradient noise falls with batch size (see`)} ${P.go('K4', t('优化站', 'Optimization'))}${t('），以及注意力为什么除以 √dₖ（见', '), and why attention divides by √dₖ (see')} ${P.go('K5', t('推导与证明站', 'Derivations'))}${t('）。', ').')}</p>`);

  P.card('c_K3_2', 2, t('🔍 条件概率与贝叶斯公式', '🔍 Conditional probability and Bayes’ rule'), `
<p>${t(`已知 ${m('B')} 发生时 ${m('A')} 的概率：`, `The probability of ${m('A')} given that ${m('B')} happened:`)}</p>
${M(r`P(A\mid B)=\frac{P(A\cap B)}{P(B)},\qquad P(B)>0`)}
${proof(P, t('贝叶斯公式', 'Bayes’ rule'), [
    [M(r`P(A\cap B)=P(A\mid B)\,P(B)=P(B\mid A)\,P(A)`), t('条件概率的定义写两遍（分别以 B、A 为条件）。', 'The definition written twice, conditioning on B and on A.')],
    [M(r`P(A\mid B)=\frac{P(B\mid A)\,P(A)}{P(B)}`), t('两边除以 P(B)。', 'Divide by P(B).')],
    [M(r`P(B)=P(B\mid A)P(A)+P(B\mid \bar A)P(\bar A)`), t(`${m('A')} 和“非 ${m('A')}”把所有情况分成两块，${m('B')} 的概率是两块之和。`, `${m('A')} and “not ${m('A')}” split all cases in two; the probability of ${m('B')} is the sum over both.`)],
  ])}
${ex(P, t('例：检测阳性，真的有病的概率', 'Example: a positive test, and the chance of really being ill'), `<p>${t('设患病率 1%，有病时 99% 测出阳性，没病时也有 5% 误报。', 'Say 1% of people are ill, the test is positive for 99% of the ill, and it falsely flags 5% of the healthy.')}</p>
${M(r`P(D\mid +)=\frac{0.99\times 0.01}{0.99\times 0.01+0.05\times 0.99}=\frac{0.0099}{0.0594}\approx 16.7\%`)}
<p>${t('只有约六分之一！因为健康的人多得多，误报的绝对数量反而更大。', 'Only about one in six, because there are so many more healthy people that the false alarms outnumber the true ones.')}</p>`, true)}
<p>${t(`语言模型算的就是条件概率：给定前文，下一个词的分布 ${m(r`P(x_t\mid x_{<t})`)}。把定义反复使用就得到概率的链式法则，整句话的概率等于逐词条件概率的乘积：`, `A language model computes exactly a conditional probability: the next word given the text so far, ${m(r`P(x_t\mid x_{<t})`)}. Applying the definition repeatedly gives the chain rule of probability: a whole sentence’s probability is the product of the word-by-word conditionals:`)}</p>
${M(r`P(x_1,\dots,x_n)=\prod_{t=1}^{n}P(x_t\mid x_1,\dots,x_{t-1})`)}
<p>${t(`（对 ${m('n')} 归纳：${m(r`P(x_{1..n})=P(x_n\mid x_{1..n-1})\,P(x_{1..n-1})`)}，正是条件概率的定义。）`, `(Induction on ${m('n')}: ${m(r`P(x_{1..n})=P(x_n\mid x_{1..n-1})\,P(x_{1..n-1})`)} is just the definition of conditional probability.)`)}</p>`);

  P.card('c_K3_3', 2, t('🔢 softmax：把任意分数变成概率', '🔢 Softmax: turning any scores into probabilities'), `
<p>${t(`模型最后输出每个词一个分数（logit）${m('z_i')}，可正可负。softmax 把它们变成概率：`, `A model’s last layer gives each word a score (logit) ${m('z_i')}, positive or negative. Softmax turns them into probabilities:`)}</p>
${M(r`p_i=\operatorname{softmax}(z)_i=\frac{e^{z_i}}{\sum_{j} e^{z_j}}`)}
<p>${t(`显然 ${m(r`p_i>0`)}、${m(r`\sum_i p_i=1`)}，而且分数越大概率越大（${m(r`e^z`)} 单调递增）。`, `Clearly ${m(r`p_i>0`)} and ${m(r`\sum_i p_i=1`)}, and a larger score gives a larger probability (${m(r`e^z`)} is increasing).`)}</p>
${proof(P, t(`平移不变：所有分数同时加 ${m('c')}，概率不变`, `Shift invariance: adding ${m('c')} to every score changes nothing`), [
    [M(r`\frac{e^{z_i+c}}{\sum_j e^{z_j+c}}=\frac{e^{c}\,e^{z_i}}{e^{c}\sum_j e^{z_j}}=\frac{e^{z_i}}{\sum_j e^{z_j}}`), t(`${m(r`e^{a+b}=e^ae^b`)}，分子分母约去 ${m(r`e^c`)}。`, `${m(r`e^{a+b}=e^ae^b`)}; cancel ${m(r`e^c`)} top and bottom.`)],
  ])}
<p>${t(`实际计算时取 ${m(r`c=-\max_j z_j`)}，指数最大是 ${m('e^0=1')}，不会溢出。`, `In practice one takes ${m(r`c=-\max_j z_j`)}, so the largest exponential is ${m('e^0=1')} and nothing overflows.`)}</p>
<p>${t(`温度 ${m('T')}：用 ${m('z/T')} 代替 ${m('z')}。${m('T')} 越小，最大分数的概率越接近 1（更确定）；${m('T')} 越大越接近均匀（更随机）。理由：${m(r`p_i/p_j=e^{(z_i-z_j)/T}`)}，当 ${m(r`z_i>z_j`)} 时，${m(r`T\to 0`)} 让比值趋于无穷，${m(r`T\to\infty`)} 让比值趋于 1。注意力里的${P.open('asoft')}也是同一个函数。`, `Temperature ${m('T')}: use ${m('z/T')} instead of ${m('z')}. A smaller ${m('T')} pushes the top score’s probability towards 1 (more certain); a larger one pushes towards uniform (more random). Reason: ${m(r`p_i/p_j=e^{(z_i-z_j)/T}`)}; for ${m(r`z_i>z_j`)}, ${m(r`T\to 0`)} sends the ratio to infinity and ${m(r`T\to\infty`)} sends it to 1. The ${P.open('asoft')} in attention is the same function.`)}</p>`);

  P.lab('labSoftmax', t('softmax、熵与交叉熵', 'Softmax, entropy and cross-entropy'),
    t('三个候选词的分数由你设定，其余数值都是精确计算（自然对数，单位 nat）。', 'You set the scores of three candidate words; everything else is computed exactly (natural log, in nats).'),
    [t('把分数、温度、概率、损失和梯度放在一起看，就能理解训练每一步在做什么。', 'Seeing scores, temperature, probabilities, loss and gradient side by side shows what each training step does.')],
    `<div class="k-ctl">
<label>z₁ = <b id="smZ0v">2</b><input type="range" id="smZ0" min="-4" max="4" step="0.5" value="2"></label>
<label>z₂ = <b id="smZ1v">1</b><input type="range" id="smZ1" min="-4" max="4" step="0.5" value="1"></label>
<label>z₃ = <b id="smZ2v">0</b><input type="range" id="smZ2" min="-4" max="4" step="0.5" value="0"></label>
<label>T = <b id="smTv">1</b><input type="range" id="smT" min="0" max="6" step="1" value="3"></label>
<label>${t('正确答案', 'Correct answer')} <select id="smY"><option value="0">1</option><option value="1">2</option><option value="2">3</option></select></label></div>
<div id="smOut" class="k-out" aria-live="polite"></div>`,
    [t('把三个分数都加 2：概率完全不变（平移不变）。', 'Add 2 to all three scores: the probabilities do not move (shift invariance).'),
      t('把 T 调到 0.25：几乎全部概率给了最大分数；调到 4：接近均匀，熵接近 ln 3 ≈ 1.099。', 'Set T to 0.25: almost all probability goes to the top score; set it to 4: nearly uniform, entropy close to ln 3 ≈ 1.099.'),
      t('看梯度列：它正好等于 (p − y)/T，正确答案那一项为负（分数该升），其余为正。', 'Look at the gradient column: it is exactly (p − y)/T; negative for the correct answer (its score should rise), positive for the rest.')]);

  P.card('c_K3_4', 2, t('📉 熵与交叉熵：模型有多“惊讶”', '📉 Entropy and cross-entropy: how “surprised” the model is'), `
<p>${t(`结果 ${m('x')} 的信息量（惊讶程度）是 ${m(r`-\log p(x)`)}：越不可能的事发生，越惊讶。熵是平均惊讶程度；交叉熵是“真实分布为 ${m('p')}、却用 ${m('q')} 去预测”时的平均惊讶程度：`, `The information (surprise) of an outcome ${m('x')} is ${m(r`-\log p(x)`)}: the less likely, the more surprising. Entropy is the average surprise; cross-entropy is the average surprise when the truth is ${m('p')} but you predict with ${m('q')}:`)}</p>
${M(r`H(p)=-\sum_x p(x)\log p(x),\qquad H(p,q)=-\sum_x p(x)\log q(x)`)}
<p>${t(`约定 ${m(r`0\log 0=0`)}。用自然对数单位是 nat，用以 2 为底的对数单位是 bit。训练语言模型时，真实答案是一个确定的词 ${m('y')}（独热分布），交叉熵就变成`, `By convention ${m(r`0\log 0=0`)}. With natural logs the unit is the nat; with base-2 logs it is the bit. When training a language model the true answer is one definite word ${m('y')} (a one-hot distribution), so cross-entropy becomes`)}</p>
${M(r`H(\text{onehot}_y,\,q)=-\log q(y)`)}
<p>${t(`这就是${P.open('nLoss')}：正确词的概率越高，损失越小；${m('q(y)=1')} 时为 0。`, `This is the ${P.open('nLoss')}: the higher the probability of the correct word, the smaller the loss, reaching 0 when ${m('q(y)=1')}.`)}</p>
${proof(P, t(`交叉熵 = 熵 + KL：${m(r`H(p,q)=H(p)+D_{\mathrm{KL}}(p\,\|\,q)`)}`, `Cross-entropy = entropy + KL: ${m(r`H(p,q)=H(p)+D_{\mathrm{KL}}(p\,\|\,q)`)}`), [
    [M(r`-\sum_x p\log q=-\sum_x p\log p+\sum_x p\,(\log p-\log q)`), t('加一项再减一项。', 'Add and subtract the same term.')],
    [M(r`=H(p)+\sum_x p(x)\log\frac{p(x)}{q(x)}=H(p)+D_{\mathrm{KL}}(p\,\|\,q)`), t('第二项正是 KL 散度的定义（下一张卡）。', 'The second term is the definition of the KL divergence (next card).')],
  ])}
<p>${t(`${m('H(p)')} 只取决于数据，与模型无关，所以“最小化交叉熵”和“最小化 KL”是同一件事：让模型分布 ${m('q')} 靠近数据分布 ${m('p')}。`, `${m('H(p)')} depends only on the data, not on the model, so “minimise cross-entropy” and “minimise KL” are the same goal: bring the model’s ${m('q')} close to the data’s ${m('p')}.`)}</p>`);

  P.card('c_K3_5', 2, t('📐 KL 散度：为什么它永远 ≥ 0', '📐 KL divergence: why it is never negative'), `
${M(r`D_{\mathrm{KL}}(p\,\|\,q)=\sum_{x:\,p(x)>0} p(x)\log\frac{p(x)}{q(x)}`)}
<p>${t(`若某个 ${m(r`p(x)>0`)} 的地方 ${m('q(x)=0')}，KL 为 ${m(r`+\infty`)}。下面证明其余情况。`, `If ${m('q(x)=0')} somewhere that ${m(r`p(x)>0`)}, the KL is ${m(r`+\infty`)}. The proof below covers every other case.`)}</p>
${proof(P, t(`引理：${m(r`\ln t\le t-1`)}（${m(r`t>0`)}），等号仅当 ${m('t=1')}`, `Lemma: ${m(r`\ln t\le t-1`)} for ${m(r`t>0`)}, with equality only at ${m('t=1')}`), [
    [t(`令 ${m(r`g(t)=t-1-\ln t`)}，则 ${m(r`g'(t)=1-1/t`)}。`, `Let ${m(r`g(t)=t-1-\ln t`)}; then ${m(r`g'(t)=1-1/t`)}.`), t('求导。', 'Differentiate.')],
    [t(`${m(r`0<t<1`)} 时 ${m(r`g'<0`)}，${m(r`t>1`)} 时 ${m(r`g'>0`)}，所以 ${m('g')} 在 ${m('t=1')} 取唯一最小值 ${m('g(1)=0')}。`, `${m(r`g'<0`)} for ${m(r`0<t<1`)} and ${m(r`g'>0`)} for ${m(r`t>1`)}, so ${m('g')} has its unique minimum ${m('g(1)=0')} at ${m('t=1')}.`), t('先减后增。', 'Decreasing, then increasing.')],
  ])}
${proof(P, t(`吉布斯不等式：${m(r`D_{\mathrm{KL}}(p\,\|\,q)\ge 0`)}，等号当且仅当 ${m('p=q')}`, `Gibbs’ inequality: ${m(r`D_{\mathrm{KL}}(p\,\|\,q)\ge 0`)}, with equality iff ${m('p=q')}`), [
    [M(r`-D_{\mathrm{KL}}=\sum_{p(x)>0} p(x)\ln\frac{q(x)}{p(x)}\le\sum_{p(x)>0} p(x)\Big(\frac{q(x)}{p(x)}-1\Big)`), t(`对每一项用引理，${m(r`t=q(x)/p(x)`)}（这里 ${m(r`q(x)>0`)}）。`, `Apply the lemma to each term with ${m(r`t=q(x)/p(x)`)} (here ${m(r`q(x)>0`)}).`)],
    [M(r`=\sum_{p(x)>0} q(x)-\sum_{p(x)>0}p(x)\le 1-1=0`), t(`${m('q')} 在部分结果上的和不超过 1，${m('p')} 在这些结果上的和正好是 1。`, `${m('q')} summed over some outcomes is at most 1; ${m('p')} summed over its support is exactly 1.`)],
    [t(`等号要求每一项都取等号，即所有 ${m(r`p(x)>0`)} 处 ${m('q(x)=p(x)')}，并且 ${m('q')} 在其余地方为 0，也就是 ${m('p=q')}。`, `Equality needs every step to be tight: ${m('q(x)=p(x)')} wherever ${m(r`p(x)>0`)}, and ${m('q')} zero elsewhere, i.e. ${m('p=q')}.`), t('引理的等号条件。', 'The lemma’s equality condition.')],
  ])}
${proof(P, t(`推论：${m('n')} 个结果的分布，熵最大为 ${m(r`\ln n`)}（均匀分布时取到）`, `Corollary: a distribution on ${m('n')} outcomes has entropy at most ${m(r`\ln n`)}, reached by the uniform one`), [
    [M(r`D_{\mathrm{KL}}(p\,\|\,u)=\sum p\ln p-\sum p\ln\tfrac1n=\ln n-H(p)`), t(`取 ${m('q=u')}，均匀分布 ${m(r`u(x)=1/n`)}。`, `Take ${m('q=u')}, the uniform distribution ${m(r`u(x)=1/n`)}.`)],
    [M(r`\ln n-H(p)\ge 0\ \Longrightarrow\ H(p)\le\ln n`), t('吉布斯不等式，等号当且仅当 p = u。', 'Gibbs’ inequality; equality iff p = u.')],
  ])}
<p>${t(`KL 不对称：一般 ${m(r`D_{\mathrm{KL}}(p\|q)\neq D_{\mathrm{KL}}(q\|p)`)}，所以它不是真正的距离。对齐训练里的${P.open('kl')}用它限制新模型别离参考模型太远。`, `KL is not symmetric: in general ${m(r`D_{\mathrm{KL}}(p\|q)\neq D_{\mathrm{KL}}(q\|p)`)}, so it is not a true distance. The ${P.open('kl')} in alignment training uses it to keep the new model from drifting too far from a reference model.`)}</p>`, { closed: true });

  P.quiz();
  return {
    sub: t('分布 → softmax → 交叉熵 → KL：模型怎么表达“不确定”，又怎么被打分。', 'Distributions → softmax → cross-entropy → KL: how a model expresses uncertainty and how it is scored.'),
    one: t('本站讲语言模型用到的概率与信息论，并逐步证明方差公式、贝叶斯公式、softmax 平移不变、交叉熵分解和 KL ≥ 0。', 'The probability and information theory a language model uses, with step-by-step proofs of the variance identities, Bayes’ rule, softmax shift invariance, the cross-entropy decomposition and KL ≥ 0.'),
    why: t('理解损失函数和对齐训练里的 KL，都离不开这几条。', 'You need these to understand the loss function and the KL term in alignment training.'),
    svg, legend: kLegend(t),
  };
}
