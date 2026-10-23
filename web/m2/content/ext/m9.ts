/* M9 (R13): the home diagram (T1) now shows the whole stack, from you down to the maths. These parts are the boxes that
   had no part of their own yet: the products stop (Up), the neural-net basics header (N), the reference stop (T8) and one
   box per math stop (K1–K5). Each one opens a short popup and carries a drill-down (zoom) to its station. */
import type { T } from '../../lib';
import type { Ext, XPart } from './kit';

const SYS = (t: T) => t('🧭 导航零件：这一格代表一整站，点 ⤵ 进入', '🧭 A navigation box: it stands for a whole station; tap ⤵ to go in');
const MATH = (t: T) => t('📐 数学基础：不是模型里的零件，是上面各层公式的来源', '📐 A math foundation: not a part inside the model, but where the formulas above come from');

const K = (n: [string, string], zoom: string, role: [string, string], does: [string, string][], why: [string, string], eff: [string, string], lim: [string, string]): XPart => ({
  n: { zh: n[0], en: n[1] }, t: 'T1', cat: 'math', train: 'no', zoom,
  pop: (t) => ({
    role: t(...role), status: MATH(t),
    does: does.map((d) => t(...d)),
    how: [t('点框右下角的 ⤵ 进入这一站，每个公式都有一步步的推导和可以拖动的小实验。', 'Tap the ⤵ at the box’s lower right to open this station: every formula has a step-by-step derivation and a small lab you can drag.'), t('图里橙色的线标出它撑起了上面哪一块。', 'The orange line in the diagram shows which box above it holds up.')],
    why: t(...why), eff: t(...eff), lim: t(...lim),
  }),
});

export const M9: Ext = {
  parts: {
    uProd: {
      n: { zh: '具体产品', en: 'Products' }, t: 'T1', cat: 'use', train: 'no', up: 'uHub', zoom: 'Up', dn: ['app', 'llm'],
      pop: (t) => ({
        role: t('按“怎么用”给常见的 Agent 产品分好类，每个都附官方链接。', 'Common agent products, grouped by the way you use them, each with its official link.'), status: SYS(t),
        does: [t('同一种用法下有哪些产品，一眼看完。', 'See at a glance which products fit each way of use.'), t('链接都指向官方页面，在新标签页打开。', 'Links go to the official pages and open in a new tab.')],
        how: [t('点 ⤵ 进入“具体产品”站，用筛选按钮按用法过滤。', 'Tap ⤵ to open the Products station and filter by way of use.')],
        why: t('先想清楚“怎么用”，再挑产品：产品名会变，用法的分类不常变。', 'Decide how you want to use it first, then pick a product: product names change, the ways of use change less.'),
        eff: t('按用法分类，换了新产品也能马上知道它属于哪一类、该怎么用。', 'Grouping by use means a new product slots into a known category and you already know how to use it.'),
        lim: t('产品功能和价格经常变化，以官方页面为准。', 'Features and prices change often; the official pages are the reference.'),
      }),
    },
    nnHub: {
      n: { zh: '神经网络基础', en: 'Neural-net basics' }, t: 'T1', cat: 'nn', train: 'yes', zoom: 'N',
      pop: (t) => ({
        role: t('Transformer 里的每一层都是神经网络：很多“加权求和 + 激活”的小零件层层叠起来。', 'Every layer inside a Transformer is a neural network: many small “weighted sum + activation” parts stacked in layers.'),
        status: t('🔥 里面的权重是训练出来的，用的时候只读', '🔥 Its weights are learned in training and read-only at use time'),
        does: [t('神经元：输入乘权重再相加，加上偏置。', 'A neuron multiplies its inputs by weights, adds them up and adds a bias.'), t('激活函数：给结果加一道非线性的开关，层叠起来才能表达复杂的规律。', 'An activation function adds a non-linear switch, so stacked layers can express complex patterns.'), t('训练循环：前向计算 → 损失 → 反向传播 → 更新，重复很多次。', 'The training loop: forward pass → loss → backprop → update, repeated many times.')],
        how: [t('点 ⤵ 进入“神经网络入门”站，从一个神经元开始动手算。', 'Tap ⤵ to open Neural Network Basics and start by computing one neuron by hand.')],
        why: t('没有激活函数，再多层也只等于一层线性变换；加了非线性，层数才有意义。', 'Without activations, any number of layers collapses into one linear map; the non-linearity is what makes depth useful.'),
        eff: t('同一套“加权求和 + 激活 + 梯度下降”，换数据就能学会不同的任务。', 'The same “weighted sum + activation + gradient descent” recipe learns different tasks from different data.'),
        lim: t('这里讲的是原理；真实模型的层数和参数量大得多。', 'This is the principle; real models have far more layers and parameters.'),
      }),
    },
    tRef: {
      n: { zh: '速查与全景图', en: 'Reference & map' }, t: 'T1', cat: 'io', train: 'no', zoom: 'T8',
      pop: (t) => ({
        role: t('所有零件的关系图和术语表，外加你的学习进度和每个实验的入口。', 'The relationship map and glossary of all the parts, plus your progress and an entry to every lab.'), status: SYS(t),
        does: [t('术语表列出每个零件，点一下就打开它的卡片。', 'The glossary lists every part; tap one to open its card.'), t('全景关系图按层画出零件之间的联系。', 'The big-picture map draws how the parts connect, layer by layer.')],
        how: [t('点 ⤵ 进入“速查与全景图”站。', 'Tap ⤵ to open the Reference & map station.')],
        why: t('学到后面容易忘了前面的词，集中放一处方便回查。', 'Later stations reuse earlier terms; one place to look them up saves hunting.'),
        eff: t('每个词都能一步回到讲它的那一站。', 'Every term is one tap away from the station that explains it.'),
        lim: t('速查只给一句话解释，细节在各站里。', 'The reference gives one line each; the details are in the stations.'),
      }),
    },
    mK1: K(['微积分', 'Calculus'], 'K1', ['极限 → 导数 → 链式法则 → 梯度：训练时“往哪边调参数”的数学。', 'Limits → derivatives → chain rule → gradient: the math of “which way to move each parameter”.'],
      [['导数：输入动一点点，输出跟着变多少。', 'A derivative: how much the output moves when the input moves a little.'], ['链式法则：一串函数套起来，导数一段段相乘——反向传播就是它。', 'The chain rule: for nested functions, multiply the derivatives piece by piece; backprop is exactly this.']],
      ['训练要知道“每个参数往哪边调、调多少”，答案就是损失对参数的导数（梯度）。', 'Training needs to know which way and how far to move each parameter; the answer is the derivative (gradient) of the loss.'],
      ['有了梯度，几十亿个参数可以同时按各自的方向调。', 'With gradients, billions of parameters can each move in their own direction at once.'],
      ['导数只描述“附近一小步”，步子太大就不准。', 'A derivative only describes a small step nearby; big steps make it inaccurate.']),
    mK2: K(['线性代数', 'Linear algebra'], 'K2', ['向量 → 矩阵 → 行列式 → 雅可比：模型里“一层”到底算了什么。', 'Vectors → matrices → determinant → Jacobian: what one “layer” actually computes.'],
      [['词向量、隐藏状态都是向量；一层网络就是“矩阵乘向量”。', 'Word vectors and hidden states are vectors; one network layer is “matrix times vector”.'], ['注意力里的 Q、K、V 和打分 QKᵀ 全是矩阵乘法。', 'Attention’s Q, K, V and the score QKᵀ are all matrix multiplications.']],
      ['矩阵乘法能一次把很多数的加权求和算完，正好对上神经网络的结构。', 'Matrix multiplication does many weighted sums in one go, which is exactly a neural layer.'],
      ['GPU 专门为大矩阵乘法优化，所以模型能做得这么大。', 'GPUs are built for large matrix multiplications, which is why models can be this large.'],
      ['这里只讲用得到的部分，不是完整的线性代数课。', 'Only the parts the model uses are covered, not a full linear-algebra course.']),
    mK3: K(['概率与信息', 'Probability & information'], 'K3', ['分布 → softmax → 交叉熵 → KL：模型怎么表达“不确定”，又怎么被打分。', 'Distributions → softmax → cross-entropy → KL: how a model expresses uncertainty and how it is scored.'],
      [['softmax 把打分变成一组加起来等于 1 的概率，采样就从这里抽词。', 'Softmax turns scores into probabilities that sum to 1; sampling draws the next word from them.'], ['交叉熵衡量“正确答案被给了多大概率”，就是训练时的损失。', 'Cross-entropy measures how much probability the right answer got; it is the training loss.']],
      ['语言本来就有很多种合理的下一个词，用概率表达比只给一个答案更贴切。', 'Language has many reasonable next words; probabilities describe that better than a single answer.'],
      ['最小化交叉熵，等于让模型给真实文本的概率尽量高。', 'Minimising cross-entropy is the same as making the model give real text as high a probability as possible.'],
      ['概率高不等于事实正确：模型学的是文本的统计规律。', 'High probability is not the same as true: the model learns statistical patterns of text.']),
    mK4: K(['优化', 'Optimization'], 'K4', ['最陡下降 → 学习率 → 小批量 → Adam：训练循环每一步的数学。', 'Steepest descent → learning rate → mini-batches → Adam: the math of every training step.'],
      [['梯度下降：沿梯度的反方向走一小步，损失就下降。', 'Gradient descent: step against the gradient and the loss goes down.'], ['学习率决定每步走多远；Adam 按历史梯度给每个参数调步长。', 'The learning rate sets the step size; Adam adapts each parameter’s step from its past gradients.']],
      ['损失像一片起伏的地形，最陡的下坡方向就是负梯度。', 'The loss is like a landscape; the steepest way down is the negative gradient.'],
      ['小批量数据估计梯度，又快又够准，能在海量数据上训练。', 'Mini-batches estimate the gradient quickly and well enough to train on huge datasets.'],
      ['学习率太大会发散、太小会很慢，要调。', 'Too large a learning rate diverges, too small is slow; it has to be tuned.']),
    mK5: K(['推导与证明', 'Derivations & proofs'], 'K5', ['反向传播 → p − y → √dₖ → 残差 → 策略梯度：模型关键公式的完整推导。', 'Backprop → p − y → √dₖ → residuals → policy gradient: full derivations of the model’s key formulas.'],
      [['反向传播、softmax + 交叉熵的梯度 p − y，一步步推出来。', 'Backprop and the softmax + cross-entropy gradient p − y, derived step by step.'], ['策略梯度：强化学习怎么在没有标准答案时也能算出更新方向。', 'The policy gradient: how reinforcement learning gets an update direction without a reference answer.']],
      ['上面各站用到的公式，在这里都能找到“为什么是这样”。', 'Every formula used in the stations above has its “why” here.'],
      ['推导看懂了，就知道每个设计（比如除以 √dₖ、残差）解决什么问题。', 'Once the derivations make sense, you can see what each design choice (dividing by √dₖ, residuals) fixes.'],
      ['推导用了简化的记号，省略了工程细节。', 'The derivations use simplified notation and leave out engineering details.']),
  },
  cards: {},
  quiz: () => ({}),
};
