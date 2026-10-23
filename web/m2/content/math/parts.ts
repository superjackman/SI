/* K1–K5 math layer: stations, parts (popup cards) and the drill links from the model stations (N, T4, T4a, T7) down to the math. */
import type { Bi, PopSpec, T } from '../../lib';
import { m } from '../../tex';

export interface KPartSpec { n: Bi; t: string; up?: string; use?: string[]; pop: (t: T) => PopSpec }

export const KSTATIONS: Record<string, Bi> = {
  K1: { zh: '数学 · 微积分', en: 'Math · Calculus' },
  K2: { zh: '数学 · 线性代数', en: 'Math · Linear algebra' },
  K3: { zh: '数学 · 概率与信息', en: 'Math · Probability & information' },
  K4: { zh: '数学 · 优化', en: 'Math · Optimization' },
  K5: { zh: '数学 · 推导与证明', en: 'Math · Derivations & proofs' },
};
const BASE = ['T1', 'T2', 'T3', 'N'];
export const KPATHS: Record<string, string[]> = Object.fromEntries(Object.keys(KSTATIONS).map((s) => [s, [...BASE, s]]));

/** legacy part → the math stations that explain it (shown as "∑ math" drill chips at the top of its popup) */
export const MATH_LINKS: Record<string, string[]> = {
  nCg: ['K1'], nAct: ['K1'], nBp: ['K5', 'K1'], backprop: ['K5'], nLayer: ['K2'], nEmb: ['K2'], wq: ['K2'],
  score: ['K2', 'K5'], asoft: ['K3', 'K5'], nLoss: ['K3'], loss: ['K3'], kl: ['K3'],
  nUpd: ['K4'], nOpt: ['K4'], nLr: ['K4'], nBatch: ['K4'], residual: ['K5'], rl: ['K5'],
};

const ST = (t: T) => t('📐 数学基础：不是一个部件，而是部件背后的计算规则', '📐 Math foundation: not a component, but the rule behind the computation');
const tryK = (lab: string, S: string, zh: string, en: string) => (t: T): [string, string, string] => [lab, S, t(zh, en)];
const trySec = tryK('labSecant', 'K1', '🧪 割线变切线（微积分）', '🧪 Secant to tangent (Calculus)');
const tryMat = tryK('labMat', 'K2', '🧪 拉动一个 2×2 矩阵（线性代数）', '🧪 Drag a 2×2 matrix (Linear algebra)');
const trySm = tryK('labSoftmax', 'K3', '🧪 softmax 与交叉熵（概率与信息）', '🧪 Softmax and cross-entropy (Probability)');
const tryGd = tryK('labGD', 'K4', '🧪 学习率与收敛（优化）', '🧪 Learning rate and convergence (Optimization)');
const tryGc = tryK('labGradCheck', 'K5', '🧪 反向传播 vs 数值梯度（推导与证明）', '🧪 Backprop vs numerical gradient (Derivations)');

export const KPARTS: Record<string, KPartSpec> = {
  /* ---------- K1 calculus ---------- */
  kLim: {
    n: { zh: '极限', en: 'Limit' }, t: 'K1', use: ['nCg'],
    pop: (t) => ({
      role: t(`当 ${m('x')} 越来越靠近 ${m('a')} 时，${m('f(x)')} 越来越靠近哪个数。`, `The value ${m('f(x)')} gets arbitrarily close to as ${m('x')} gets close to ${m('a')}.`),
      status: ST(t), tryit: trySec(t),
      does: [t('给“无限靠近”一个精确的说法，导数、积分都建立在它上面。', 'Gives “arbitrarily close” a precise meaning; derivatives and integrals are built on it.')],
      how: [t('导数就是“割线斜率在 h→0 时的极限”。', 'A derivative is the limit of the secant slope as h → 0.')],
      why: t('只看“等于多少”不够：0/0 这种式子在那一点没有值，但它附近的值可能稳定地趋向一个数。', 'Looking only at the value is not enough: an expression like 0/0 has no value at that point, yet nearby values may settle towards a number.'),
      eff: t('ε-δ 定义把“靠近”变成可以检验的不等式，所以结论可以严格证明。', 'The ε-δ definition turns “close” into inequalities that can be checked, so results can be proved rigorously.'),
      lim: t('极限可能不存在（比如左右两侧趋向不同的数）。', 'A limit may not exist (e.g. the two sides approach different numbers).'),
    }),
  },
  kDer: {
    n: { zh: '导数', en: 'Derivative' }, t: 'K1', up: 'kLim', use: ['nAct', 'nBp'],
    pop: (t) => ({
      role: t(`函数在一点的瞬时变化率：输入动一点点，输出大约动多少倍。`, 'The instantaneous rate of change: if the input moves a little, how many times as much the output moves.'),
      status: ST(t), tryit: trySec(t),
      does: [t(`定义：${m('f\'(x)=\\lim_{h\\to 0}\\frac{f(x+h)-f(x)}{h}')}。`, `Definition: ${m('f\'(x)=\\lim_{h\\to 0}\\frac{f(x+h)-f(x)}{h}')}.`), t('几何上是切线的斜率。', 'Geometrically it is the slope of the tangent line.')],
      how: [t(`训练时看“损失对某个参数的导数”：正的就把参数调小，负的就调大。`, 'In training, look at the derivative of the loss with respect to a parameter: if positive, decrease the parameter; if negative, increase it.')],
      why: t(`导数给出局部的线性近似 ${m('f(x+h)\\approx f(x)+f\'(x)\\,h')}，复杂的函数在一小步里可以当直线处理。`, `The derivative gives the local linear approximation ${m('f(x+h)\\approx f(x)+f\'(x)\\,h')}: within a small step a complicated function behaves like a line.`),
      eff: t('这个近似的误差比 h 小得多（当 h→0），所以小步调参能可靠地让损失下降。', 'The error of this approximation shrinks faster than h (as h → 0), so small parameter steps reliably lower the loss.'),
      lim: t('ReLU 在 0 点没有导数；框架约定在那一点用 0（或另一个次梯度）。', 'ReLU has no derivative at 0; frameworks use 0 there by convention (or another subgradient).'),
    }),
  },
  kChain: {
    n: { zh: '链式法则', en: 'Chain rule' }, t: 'K1', up: 'kDer', use: ['nCg', 'nBp'],
    pop: (t) => ({
      role: t(`复合函数的导数等于各层导数相乘：${m('(f\\circ g)\'(x)=f\'(g(x))\\,g\'(x)')}。`, `The derivative of a composition is the product of the layers’ derivatives: ${m('(f\\circ g)\'(x)=f\'(g(x))\\,g\'(x)')}.`),
      status: ST(t), tryit: tryGc(t),
      does: [t('神经网络是一层套一层的复合函数，链式法则把整体导数拆成每层的小导数。', 'A neural network is a composition of layers; the chain rule splits the overall derivative into small per-layer ones.')],
      how: [t('反向传播 = 从损失开始，沿计算图倒着把这些小导数乘过去。', 'Backpropagation = start from the loss and multiply these small derivatives backwards through the computation graph.')],
      why: t('每一层只需要知道自己的局部导数，不需要知道整个网络长什么样。', 'Each layer only needs its own local derivative, not the shape of the whole network.'),
      eff: t('有严格证明（见本站），所以按层相乘得到的就是精确梯度，不是近似。', 'It is proved rigorously (see this stop), so multiplying layer by layer gives the exact gradient, not an approximation.'),
      lim: t('很多层的导数连乘，可能越乘越小（梯度消失）或越乘越大（梯度爆炸）。', 'Multiplying many layers’ derivatives can shrink the product (vanishing gradients) or blow it up (exploding gradients).'),
    }),
  },
  kGrad: {
    n: { zh: '偏导数与梯度', en: 'Partial derivatives & gradient' }, t: 'K1', up: 'kDer', use: ['nUpd'],
    pop: (t) => ({
      role: t(`多个输入时，对每个输入分别求导（其余不动），排成一个向量 ${m('\\nabla f')}。`, `With several inputs, differentiate with respect to each one (holding the rest fixed) and stack the results into a vector ${m('\\nabla f')}.`),
      status: ST(t), tryit: tryGd(t),
      does: [t('梯度指向函数上升最快的方向，长度是那个方向的变化率。', 'The gradient points in the direction of fastest increase; its length is the rate of change in that direction.')],
      how: [t('梯度下降沿 −∇L 走一小步；大模型有上千亿个参数，梯度就是上千亿维的向量。', 'Gradient descent takes a small step along −∇L; a large model has hundreds of billions of parameters, so the gradient has that many entries.')],
      why: t('一个参数一个参数地试太慢；梯度一次给出所有方向的信息。', 'Trying one parameter at a time is far too slow; the gradient gives every direction at once.'),
      eff: t('“最快上升方向”可以用柯西-施瓦茨不等式证明（见“优化”站）。', 'The “fastest increase” claim is proved with the Cauchy–Schwarz inequality (see the Optimization stop).'),
      lim: t('梯度只描述附近一小块；离得远了，函数可能完全不同。', 'The gradient only describes a small neighbourhood; further away the function can look entirely different.'),
    }),
  },
  kInt: {
    n: { zh: '积分', en: 'Integral' }, t: 'K1', up: 'kLim', use: ['nLoss'],
    pop: (t) => ({
      role: t('把很多很小的量加起来的极限，几何上是曲线下的面积。', 'The limit of adding up many tiny pieces; geometrically, the area under a curve.'),
      status: ST(t),
      does: [t('连续随机变量的概率和期望都是积分。', 'Probabilities and expectations of continuous random variables are integrals.')],
      how: [t('训练的目标“在所有数据上的平均损失”就是期望，可以写成积分或求和。', 'The training objective “average loss over all data” is an expectation, written as an integral or a sum.')],
      why: t(`微积分基本定理：${m('\\frac{d}{dx}\\int_a^x f(t)\\,dt=f(x)')}（f 连续时），积分和求导互为逆运算。`, `Fundamental theorem of calculus: ${m('\\frac{d}{dx}\\int_a^x f(t)\\,dt=f(x)')} (for continuous f); integration and differentiation undo each other.`),
      eff: t('实践中用样本平均来估计这个积分（小批量），不需要真的算出来。', 'In practice the integral is estimated with a sample average (a mini-batch); it is never computed exactly.'),
      lim: t('本站只讲用到的部分，不展开积分技巧。', 'This stop covers only what is needed; integration techniques are left out.'),
    }),
  },
  /* ---------- K2 linear algebra ---------- */
  kVec: {
    n: { zh: '向量与点积', en: 'Vectors & dot product' }, t: 'K2', use: ['nEmb', 'score'],
    pop: (t) => ({
      role: t(`一串数就是一个向量；两个向量的点积 ${m('a\\cdot b=\\sum_i a_i b_i')} 衡量它们有多“同向”。`, `A list of numbers is a vector; the dot product ${m('a\\cdot b=\\sum_i a_i b_i')} measures how much two vectors point the same way.`),
      status: ST(t), tryit: tryMat(t),
      does: [t(`${m('a\\cdot b=\\lVert a\\rVert\\,\\lVert b\\rVert\\cos\\theta')}：同向为正、垂直为 0、反向为负。`, `${m('a\\cdot b=\\lVert a\\rVert\\,\\lVert b\\rVert\\cos\\theta')}: positive when aligned, 0 when perpendicular, negative when opposite.`)],
      how: [t('词向量的相似度、注意力里的 Q·K 打分，都是点积。', 'Word-vector similarity and the Q·K score in attention are both dot products.')],
      why: t('点积只需要乘加，硬件做得极快，又恰好有“夹角”的几何含义。', 'A dot product is only multiply-adds, which hardware does extremely fast, and it has the geometric meaning of an angle.'),
      eff: t('证明见本站：由余弦定理和展开 ‖a−b‖² 两种写法对比得到。', 'Proof on this stop: compare the law of cosines with the expansion of ‖a−b‖².'),
      lim: t('点积受长度影响；只想比方向时用余弦相似度（先除以长度）。', 'The dot product depends on length; to compare direction only, use cosine similarity (divide by the lengths first).'),
    }),
  },
  kMat: {
    n: { zh: '矩阵乘法', en: 'Matrix multiplication' }, t: 'K2', up: 'kVec', use: ['nLayer', 'wq'],
    pop: (t) => ({
      role: t(`${m('(AB)_{ij}=\\sum_k A_{ik}B_{kj}')}：第 i 行和第 j 列做点积。`, `${m('(AB)_{ij}=\\sum_k A_{ik}B_{kj}')}: the dot product of row i with column j.`),
      status: ST(t), tryit: tryMat(t),
      does: [t(`一层全连接就是 ${m('y=Wx+b')}；矩阵把一个向量变成另一个向量（线性变换）。`, `A fully connected layer is ${m('y=Wx+b')}; a matrix maps one vector to another (a linear map).`)],
      how: [t('形状规则：(m×n)(n×p) = m×p，中间的 n 必须对上。', 'Shape rule: (m×n)(n×p) = m×p; the inner n must match.')],
      why: t('把很多点积排成一次矩阵乘，GPU 可以并行算完；大模型的大部分计算量就是矩阵乘。', 'Batching many dot products into one matrix multiplication lets a GPU compute them in parallel; most of an LLM’s compute is matrix multiplication.'),
      eff: t('(m×n)(n×p) 需要 m·n·p 次乘加，计算量可以提前算准。', '(m×n)(n×p) takes m·n·p multiply-adds, so the cost is known in advance.'),
      lim: t('一般 AB ≠ BA，顺序不能随便换。', 'In general AB ≠ BA; the order matters.'),
    }),
  },
  kDet: {
    n: { zh: '线性变换与行列式', en: 'Linear maps & determinant' }, t: 'K2', up: 'kMat',
    pop: (t) => ({
      role: t(`2×2 矩阵把单位正方形变成平行四边形，面积乘上 ${m('|\\det A|=|ad-bc|')}。`, `A 2×2 matrix turns the unit square into a parallelogram whose area is multiplied by ${m('|\\det A|=|ad-bc|')}.`),
      status: ST(t), tryit: tryMat(t),
      does: [t('行列式为 0：平面被压成一条线（或一个点），信息丢失，矩阵不可逆。', 'Determinant 0: the plane is squashed onto a line (or a point); information is lost and the matrix has no inverse.')],
      how: [t('拖动实验里的四个数，看正方形怎样被拉伸、旋转、翻转。', 'Drag the four numbers in the lab and watch the square stretch, rotate and flip.')],
      why: t('矩阵的两列就是两个基向量被送到的位置，整个平面跟着它们一起变。', 'The two columns are where the two basis vectors land; the whole plane follows them.'),
      eff: t('“看列向量”这一个直觉，就能读懂任何 2×2 矩阵做了什么。', 'This one intuition, “look at the columns”, explains what any 2×2 matrix does.'),
      lim: t('高维时无法画图，但“列向量是基向量的去处”仍然成立。', 'In high dimensions it cannot be drawn, but “the columns are where the basis vectors go” still holds.'),
    }),
  },
  kJac: {
    n: { zh: '转置与雅可比矩阵', en: 'Transpose & Jacobian' }, t: 'K2', up: 'kMat', use: ['nBp'],
    pop: (t) => ({
      role: t(`向量函数的所有偏导排成的矩阵 ${m('J_{ij}=\\partial y_i/\\partial x_j')}；梯度往回传时要乘它的转置。`, `The matrix of all partial derivatives of a vector function, ${m('J_{ij}=\\partial y_i/\\partial x_j')}; gradients flow back through its transpose.`),
      status: ST(t), tryit: tryGc(t),
      does: [t(`对 ${m('y=Wx')}，雅可比就是 ${m('W')}，于是 ${m('\\nabla_x L=W^{\\top}\\nabla_y L')}。`, `For ${m('y=Wx')} the Jacobian is ${m('W')}, so ${m('\\nabla_x L=W^{\\top}\\nabla_y L')}.`)],
      how: [t('反向传播里每一层做的就是“乘转置”。', 'Every layer in backpropagation does exactly this “multiply by the transpose”.')],
      why: t('链式法则在多维时变成雅可比矩阵相乘。', 'In many dimensions the chain rule becomes a product of Jacobians.'),
      eff: t('只需要“雅可比的转置乘一个向量”，不必把巨大的雅可比矩阵真的存下来。', 'Only “Jacobian-transpose times a vector” is needed; the huge Jacobian is never stored.'),
      lim: t('本站的证明只用下标求和，不涉及张量记号。', 'The proofs here use index sums only, no tensor notation.'),
    }),
  },
  /* ---------- K3 probability & information ---------- */
  kProb: {
    n: { zh: '概率分布与期望', en: 'Distributions & expectation' }, t: 'K3', use: ['asoft'],
    pop: (t) => ({
      role: t(`每种结果一个概率，全部加起来等于 1；期望 ${m('\\mathbb{E}[X]=\\sum_x x\\,p(x)')} 是按概率加权的平均。`, `One probability per outcome, summing to 1; the expectation ${m('\\mathbb{E}[X]=\\sum_x x\\,p(x)')} is the probability-weighted average.`),
      status: ST(t), tryit: trySm(t),
      does: [t('大模型每一步输出的就是“下一个词元”的概率分布。', 'At every step an LLM outputs a probability distribution over the next token.')],
      how: [t('方差 Var(X)=E[X²]−(E[X])² 衡量离散程度；独立变量的方差可以相加（√dₖ 缩放要用）。', 'Variance Var(X) = E[X²] − (E[X])² measures spread; variances of independent variables add (used for the √dₖ scaling).')],
      why: t('语言本来就有不确定性：同一句话后面可以接很多个词。', 'Language is inherently uncertain: many words can follow the same text.'),
      eff: t('期望是线性的：E[aX+bY]=aE[X]+bE[Y]，不需要独立，所以很多推导能一步完成。', 'Expectation is linear: E[aX+bY] = aE[X] + bE[Y], with no independence needed, which makes many derivations one step long.'),
      lim: t('本站只讲离散情形；连续情形把求和换成积分。', 'This stop covers the discrete case; for continuous variables sums become integrals.'),
    }),
  },
  kBayes: {
    n: { zh: '条件概率与贝叶斯', en: 'Conditional probability & Bayes' }, t: 'K3', up: 'kProb',
    pop: (t) => ({
      role: t(`${m('P(A\\mid B)=\\frac{P(B\\mid A)\\,P(A)}{P(B)}')}：看到证据 B 之后，A 的可能性怎样更新。`, `${m('P(A\\mid B)=\\frac{P(B\\mid A)\\,P(A)}{P(B)}')}: how the probability of A updates after seeing evidence B.`),
      status: ST(t),
      does: [t('概率的链式法则 P(x₁…xₙ)=∏P(xₜ|x₍<ₜ₎) 正是“逐词预测”的数学形式。', 'The probability chain rule P(x₁…xₙ) = ∏ P(xₜ | x₍<ₜ₎) is exactly the math of next-token prediction.')],
      how: [t('先验 × 似然，再归一化。', 'Prior × likelihood, then normalise.')],
      why: t('两种方式写同一个联合概率 P(A∩B)，一除就得到贝叶斯公式。', 'Write the same joint probability P(A∩B) two ways and divide.'),
      eff: t('它能纠正直觉：本站的检测例子里，阳性者真正患病的概率只有约 17%。', 'It corrects intuition: in this stop’s test example, a positive result means only about 17% chance of being ill.'),
      lim: t('结果依赖先验；先验估错，后验也会错。', 'The result depends on the prior; a wrong prior gives a wrong posterior.'),
    }),
  },
  kSoft: {
    n: { zh: 'softmax', en: 'Softmax' }, t: 'K3', up: 'kProb', use: ['asoft'],
    pop: (t) => ({
      role: t(`把任意一组分数 ${m('z')} 变成概率：${m('p_i=e^{z_i}/\\sum_j e^{z_j}')}。`, `Turns any scores ${m('z')} into probabilities: ${m('p_i=e^{z_i}/\\sum_j e^{z_j}')}.`),
      status: ST(t), tryit: trySm(t),
      does: [t('结果都为正、加起来等于 1，分数越高概率越大。', 'All results are positive, sum to 1, and higher scores get higher probability.')],
      how: [t('输出层给每个词元一个分数，softmax 变成概率；注意力里把打分变成权重。', 'The output layer scores every token and softmax turns the scores into probabilities; in attention it turns scores into weights.')],
      why: t('所有分数加同一个常数，结果不变（本站有证明）；所以实际计算时先减去最大值，避免 e 的指数溢出。', 'Adding the same constant to every score changes nothing (proved on this stop), so implementations subtract the maximum first to avoid overflow.'),
      eff: t('和交叉熵配合时，梯度化简成 p − y（见“推导与证明”）。', 'Combined with cross-entropy the gradient simplifies to p − y (see Derivations & proofs).'),
      lim: t('分数差得很大时输出接近 0/1，梯度几乎为 0（饱和）。', 'When scores differ a lot the output is nearly 0/1 and the gradient almost vanishes (saturation).'),
    }),
  },
  kEnt: {
    n: { zh: '熵与交叉熵', en: 'Entropy & cross-entropy' }, t: 'K3', up: 'kProb', use: ['nLoss', 'loss'],
    pop: (t) => ({
      role: t(`熵 ${m('H(p)=-\\sum p\\log p')} 衡量不确定性；交叉熵 ${m('H(p,q)=-\\sum p\\log q')} 衡量“用 q 去猜 p”有多差。`, `Entropy ${m('H(p)=-\\sum p\\log p')} measures uncertainty; cross-entropy ${m('H(p,q)=-\\sum p\\log q')} measures how badly q predicts p.`),
      status: ST(t), tryit: trySm(t),
      does: [t('语言模型的损失就是交叉熵：正确词元概率的负对数 −log q(正确词元)。', 'The language-model loss is cross-entropy: the negative log probability of the correct token, −log q(correct).')],
      how: [t('正确词元的概率从 0.5 提到 0.9，损失从 0.69 降到 0.11（自然对数）。', 'Raising the correct token’s probability from 0.5 to 0.9 lowers the loss from 0.69 to 0.11 (natural log).')],
      why: t('H(p,q)=H(p)+KL(p‖q)：数据的熵是固定的，降低交叉熵就是让模型分布靠近数据分布。', 'H(p,q) = H(p) + KL(p‖q): the data’s entropy is fixed, so lowering cross-entropy moves the model towards the data distribution.'),
      eff: t('对数把连乘的概率变成相加，长文本也能稳定计算。', 'The log turns products of probabilities into sums, so long texts stay numerically stable.'),
      lim: t('交叉熵低不等于回答正确有用，只表示“像训练数据”。', 'Low cross-entropy does not mean answers are correct or useful, only that they resemble the training data.'),
    }),
  },
  kKL: {
    n: { zh: 'KL 散度', en: 'KL divergence' }, t: 'K3', up: 'kEnt', use: ['kl'],
    pop: (t) => ({
      role: t(`${m('\\mathrm{KL}(p\\Vert q)=\\sum p\\log\\frac{p}{q}')}：两个分布差多远，永远 ≥ 0，相等时为 0。`, `${m('\\mathrm{KL}(p\\Vert q)=\\sum p\\log\\frac{p}{q}')}: how far apart two distributions are; always ≥ 0, and 0 only when they are equal.`),
      status: ST(t),
      does: [t('RLHF 里用 KL 约束新模型不要离原模型太远。', 'In RLHF a KL penalty keeps the new model from drifting too far from the original.')],
      how: [t('它不对称：KL(p‖q) 一般不等于 KL(q‖p)。', 'It is not symmetric: KL(p‖q) usually differs from KL(q‖p).')],
      why: t('“≥ 0”由不等式 ln t ≤ t − 1 一步得到（本站有完整证明）。', '“≥ 0” follows in one step from ln t ≤ t − 1 (full proof on this stop).'),
      eff: t('因为 KL ≥ 0，均匀分布的熵 log n 是所有 n 种结果分布中最大的。', 'Because KL ≥ 0, the uniform distribution’s entropy log n is the largest of any distribution over n outcomes.'),
      lim: t('q 在 p>0 的地方为 0 时，KL 为无穷大。', 'If q is 0 where p > 0, the KL is infinite.'),
    }),
  },
  /* ---------- K4 optimization ---------- */
  kGD: {
    n: { zh: '梯度下降', en: 'Gradient descent' }, t: 'K4', use: ['nUpd', 'backprop'],
    pop: (t) => ({
      role: t(`反复执行 ${m('\\theta\\leftarrow\\theta-\\eta\\,\\nabla L(\\theta)')}，一步步让损失变小。`, `Repeat ${m('\\theta\\leftarrow\\theta-\\eta\\,\\nabla L(\\theta)')} to lower the loss step by step.`),
      status: ST(t), tryit: tryGd(t),
      does: [t('训练神经网络几乎都用它的某种变体（SGD、动量、Adam）。', 'Almost every neural network is trained with a variant of it (SGD, momentum, Adam).')],
      how: [t('梯度由反向传播算出；学习率 η 决定每步走多远。', 'Backpropagation computes the gradient; the learning rate η sets the step size.')],
      why: t('在所有长度相同的小步里，−∇L 方向让损失下降得最快（本站用柯西-施瓦茨证明）。', 'Among all small steps of the same length, the −∇L direction lowers the loss fastest (proved on this stop with Cauchy–Schwarz).'),
      eff: t('只要步子够小且梯度不为 0，每步损失都会下降。', 'As long as the step is small enough and the gradient is non-zero, every step lowers the loss.'),
      lim: t('只保证走向“附近的低处”，不保证全局最优。', 'It only heads to a nearby low point, with no guarantee of the global minimum.'),
    }),
  },
  kLR: {
    n: { zh: '学习率与收敛', en: 'Learning rate & convergence' }, t: 'K4', up: 'kGD', use: ['nLr'],
    pop: (t) => ({
      role: t(`步长 ${m('\\eta')} 太小走得慢，太大会来回震荡甚至发散。`, `With too small a step ${m('\\eta')} progress is slow; too large and it oscillates or diverges.`),
      status: ST(t), tryit: tryGd(t),
      does: [t(`对二次函数 ${m('f(x)=\\tfrac{a}{2}x^2')}，当且仅当 ${m('0<\\eta<2/a')} 时收敛（本站有证明）。`, `For the quadratic ${m('f(x)=\\tfrac{a}{2}x^2')} it converges if and only if ${m('0<\\eta<2/a')} (proved on this stop).`)],
      how: [t('实际训练常先“预热”逐渐加大学习率，再慢慢衰减。', 'Real training often warms the learning rate up first, then decays it slowly.')],
      why: t('曲率越大（a 越大），允许的步长越小；多维时由最陡的方向决定上限。', 'The higher the curvature (larger a), the smaller the allowed step; in many dimensions the steepest direction sets the limit.'),
      eff: t('这个结论可以直接在实验里验证：把 η 拖过 2/a，轨迹立刻发散。', 'You can check it in the lab: drag η past 2/a and the path diverges at once.'),
      lim: t('真实损失不是二次函数，这只是局部近似下的结论。', 'Real losses are not quadratic; this holds only under the local approximation.'),
    }),
  },
  kSGD: {
    n: { zh: '随机梯度（小批量）', en: 'Stochastic gradient (mini-batch)' }, t: 'K4', up: 'kGD', use: ['nBatch'],
    pop: (t) => ({
      role: t('每步只用一小批样本估计梯度，而不是全部数据。', 'Each step estimates the gradient from a small batch of examples instead of all the data.'),
      status: ST(t),
      does: [t('均匀随机抽样时，小批量梯度的期望等于全量梯度（无偏）。', 'With uniform random sampling the mini-batch gradient’s expectation equals the full gradient (unbiased).')],
      how: [t('批大小 B 越大，估计越稳：独立抽样时方差按 1/B 缩小。', 'The larger the batch B, the steadier the estimate: with independent sampling the variance shrinks as 1/B.')],
      why: t('总损失是各样本损失的平均，梯度是线性的，所以平均的梯度等于梯度的平均。', 'The total loss is the average of per-example losses, and the gradient is linear, so the gradient of the average is the average of the gradients.'),
      eff: t('用很小的代价得到方向大致正确的一步，整体比全量梯度快得多。', 'It gets a roughly right step at a tiny cost, which is much faster overall than full-batch gradients.'),
      lim: t('噪声让轨迹抖动；学习率通常要随训练衰减。', 'The noise makes the path jittery; the learning rate is usually decayed during training.'),
    }),
  },
  kAdam: {
    n: { zh: '动量与 Adam', en: 'Momentum & Adam' }, t: 'K4', up: 'kGD', use: ['nOpt'],
    pop: (t) => ({
      role: t('动量把过去的梯度累积起来；Adam 再按每个参数梯度的大小自动调步长。', 'Momentum accumulates past gradients; Adam also scales each parameter’s step by the size of its gradients.'),
      status: ST(t),
      does: [t('Adam 论文给出的默认值：α=0.001，β₁=0.9，β₂=0.999，ε=10⁻⁸。', 'Defaults given in the Adam paper: α = 0.001, β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸.')],
      how: [t('大模型训练常用 AdamW：把权重衰减从梯度里分离出来单独做。', 'LLM training commonly uses AdamW, which applies weight decay separately from the gradient.')],
      why: t('不同参数的梯度大小可以差几个数量级，统一的学习率很难兼顾。', 'Gradient sizes can differ by orders of magnitude between parameters; one learning rate cannot suit them all.'),
      eff: t('偏差修正（除以 1−βᵗ）让前几步的估计不偏小（本站有推导）。', 'Bias correction (dividing by 1 − βᵗ) keeps the early estimates from being too small (derived on this stop).'),
      lim: t('Adam 要为每个参数多存两份状态（m 和 v），占显存。', 'Adam stores two extra numbers per parameter (m and v), which costs memory.'),
    }),
  },
  /* ---------- K5 derivations & proofs ---------- */
  kBP: {
    n: { zh: '反向传播推导', en: 'Backprop derivation' }, t: 'K5', use: ['nBp', 'backprop'],
    pop: (t) => ({
      role: t('把链式法则按层倒着用，一次反向计算就得到所有参数的梯度。', 'Apply the chain rule layer by layer backwards; one backward pass gives every parameter’s gradient.'),
      status: ST(t), tryit: tryGc(t),
      does: [t(`每层两条公式：${m('\\partial L/\\partial W=\\delta\\,x^{\\top}')}，${m('\\partial L/\\partial x=W^{\\top}\\delta')}。`, `Two formulas per layer: ${m('\\partial L/\\partial W=\\delta\\,x^{\\top}')} and ${m('\\partial L/\\partial x=W^{\\top}\\delta')}.`)],
      how: [t('前向时把每层的输入存下来，反向时用。', 'Store each layer’s input in the forward pass and reuse it in the backward pass.')],
      why: t('损失是一个数、参数有很多个：从输出往回算，每个中间结果只算一次。', 'The loss is one number and there are many parameters: going backwards from the output computes each intermediate result once.'),
      eff: t('反向每层两次矩阵乘、前向一次，所以一次训练步大约是前向的 3 倍计算量。', 'The backward pass does two matrix multiplications per layer versus one forward, so a training step costs about 3× a forward pass.'),
      lim: t('要存前向的中间结果，显存随层数和序列长度增长。', 'Forward intermediates must be kept, so memory grows with depth and sequence length.'),
    }),
  },
  kSCE: {
    n: { zh: 'softmax + 交叉熵的梯度 p−y', en: 'Softmax + CE gradient p − y' }, t: 'K5', up: 'kBP', use: ['nLoss', 'asoft'],
    pop: (t) => ({
      role: t(`对分数 ${m('z')} 的梯度就是“预测概率 − 正确答案”：${m('\\nabla_z L=p-y')}。`, `The gradient with respect to the scores ${m('z')} is “predicted probabilities − correct answer”: ${m('\\nabla_z L=p-y')}.`),
      status: ST(t), tryit: trySm(t),
      does: [t('正确词元的分数被往上推（p−1<0），其余被往下压（p>0），力度等于它的概率。', 'The correct token’s score is pushed up (p − 1 < 0) and the others down (p > 0), each in proportion to its probability.')],
      how: [t('这就是反向传播在输出层的起点 δ。', 'It is the starting δ of backpropagation at the output layer.')],
      why: t('softmax 的指数和交叉熵的对数正好抵消，留下最简单的形式。', 'The exponential in softmax and the log in cross-entropy cancel, leaving the simplest possible form.'),
      eff: t('梯度每个分量都在 (−1, 1) 之间，数值稳定。', 'Every component lies in (−1, 1), so it is numerically stable.'),
      lim: t('前提是 y 的各分量加起来等于 1（独热标签或概率标签）。', 'It assumes the entries of y sum to 1 (one-hot or soft labels).'),
    }),
  },
  kSqrt: {
    n: { zh: '注意力的 √dₖ 缩放', en: 'Attention’s √dₖ scaling' }, t: 'K5', up: 'kBP', use: ['score'],
    pop: (t) => ({
      role: t(`打分除以 ${m('\\sqrt{d_k}')}，让点积的方差回到 1，softmax 不至于饱和。`, `Dividing the scores by ${m('\\sqrt{d_k}')} brings the dot product’s variance back to 1, so softmax does not saturate.`),
      status: ST(t),
      does: [t('若 q、k 各分量独立、均值 0、方差 1，则 q·k 的方差为 dₖ（Transformer 原论文脚注里的论证）。', 'If the components of q and k are independent with mean 0 and variance 1, q·k has variance dₖ (the argument in a footnote of the original Transformer paper).')],
      how: [t('dₖ=64 时标准差是 8，除以 √64=8 后回到 1。', 'With dₖ = 64 the standard deviation is 8; dividing by √64 = 8 brings it back to 1.')],
      why: t('分数越分散，softmax 越接近独热，梯度 p(1−p) 越接近 0。', 'The more spread out the scores, the closer softmax is to one-hot and the closer the gradient p(1 − p) is to 0.'),
      eff: t('缩放后训练初期注意力权重不会一开始就“锁死”在一个位置上。', 'After scaling, attention weights do not lock onto one position at the start of training.'),
      lim: t('“独立、方差 1”是简化假设，用来说明量级，不是精确描述。', '“Independent, variance 1” is a simplifying assumption that explains the magnitude, not an exact description.'),
    }),
  },
  kRes: {
    n: { zh: '残差连接的梯度', en: 'Gradient through residuals' }, t: 'K5', up: 'kBP', use: ['residual'],
    pop: (t) => ({
      role: t(`${m('y=x+F(x)')} 的雅可比是 ${m('I+\\partial F/\\partial x')}，梯度总有一条“直通”的路。`, `The Jacobian of ${m('y=x+F(x)')} is ${m('I+\\partial F/\\partial x')}, so the gradient always has a straight-through path.`),
      status: ST(t),
      does: [t('即使每层 F 的导数很小，梯度也不会在深层网络里乘到消失。', 'Even if each layer’s F has a small derivative, the gradient does not multiply away to nothing in a deep network.')],
      how: [t('Transformer 每个子层都包在残差里：x + 注意力(x)、x + 前馈(x)。', 'Every Transformer sub-layer is wrapped in a residual: x + attention(x), x + FFN(x).')],
      why: t('把连乘展开：∏(I+Jₗ) = I + ΣJₗ + …，第一项 I 原样把梯度送回去。', 'Expand the product: ∏(I + Jₗ) = I + ΣJₗ + …; the first term I passes the gradient back unchanged.'),
      eff: t('ResNet（2015）用它训练了上百层的网络。', 'ResNet (2015) used it to train networks with over a hundred layers.'),
      lim: t('残差解决的是“梯度传不回去”，不保证每层都学到有用的东西。', 'Residuals solve “gradients cannot get back”, not whether each layer learns something useful.'),
    }),
  },
  kPG: {
    n: { zh: '策略梯度', en: 'Policy gradient' }, t: 'K5', up: 'kBP', use: ['rl', 'rlvr'],
    pop: (t) => ({
      role: t(`${m('\\nabla_\\theta J=\\mathbb{E}\\big[R\\,\\nabla_\\theta\\log\\pi_\\theta(\\tau)\\big]')}：奖励高的输出，提高它的概率。`, `${m('\\nabla_\\theta J=\\mathbb{E}\\big[R\\,\\nabla_\\theta\\log\\pi_\\theta(\\tau)\\big]')}: raise the probability of outputs that earned high reward.`),
      status: ST(t),
      does: [t('奖励不可导（比如“答案对不对”），也能得到梯度。', 'It gives a gradient even when the reward is not differentiable (e.g. “is the answer right?”).')],
      how: [t('采样一些回答 → 打分 → 用 (R − b)·∇log π 更新；b 是基线（如同组平均分）。', 'Sample some answers → score them → update with (R − b)·∇log π, where b is a baseline (e.g. the group’s average score).')],
      why: t('关键一步是 ∇π = π·∇log π（对数导数技巧），把“对分布求导”变成“对样本求平均”。', 'The key step is ∇π = π·∇log π (the log-derivative trick), which turns “differentiate a distribution” into “average over samples”.'),
      eff: t('减去基线不改变期望（本站证明），但能显著降低方差。', 'Subtracting a baseline leaves the expectation unchanged (proved on this stop) but can cut the variance a lot.'),
      lim: t('方差大、需要很多样本；最早系统提出的是 Williams 1992 的 REINFORCE。', 'It is high-variance and needs many samples; it was first set out systematically as REINFORCE (Williams, 1992).'),
    }),
  },
};
