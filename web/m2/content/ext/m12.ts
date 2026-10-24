/* M12 (R24): the second round of "⚠️ 容易混淆" cards, now also on the generated maths (K*) and use (U*) stations
   (build.ts emits a generated station's "near" items from its own Page, right after the anchor card), plus labBatch on
   K4 (N examples, batch B, E epochs → steps). Everything here is definitions or worked arithmetic; the example numbers
   are labelled as examples. Helpers are shared with M11. Every card has a plain opening in m2/plain/m12.ts. */
import type { Page } from '../../lib';
import type { Ext } from './kit';
import { C, jump, mem, ol, one, tb, ti, tri, tryit, ul } from './m11';

/* ================= K1: derivative vs partial derivative vs gradient ================= */
function k1(P: Page) {
  const t = P.t;
  P.card('cfDerivGrad', 1, ti(P, '导数 vs 偏导数 vs 梯度', 'derivative vs partial derivative vs gradient'),
    one(P, t('<b>导数</b>：只有一个输入时，“输入动一点，输出跟着动多少”，是<b>一个数</b>。<b>偏导数</b>：有很多输入时，只动其中<b>一个</b>、别的按住不动，得到的那个数。<b>梯度</b>：把每个输入的偏导数<b>排成一排</b>，是<b>一串数</b>（向量）。',
      'a <b>derivative</b>: with one input, “nudge the input, how much does the output move”; it is <b>one number</b>. A <b>partial derivative</b>: with many inputs, nudge just <b>one</b> and hold the others still; again one number. The <b>gradient</b>: all the partial derivatives <b>lined up</b>; it is <b>a list of numbers</b> (a vector).'))
    + tri([
      { h: t('📈 导数', '📈 Derivative'), li: [
        [t('输入：', 'Inputs: '), t('1 个（x）', 'one (x)')],
        [t('得到：', 'Gives: '), t('1 个数，写作 f′(x)', 'one number, written f′(x)')],
        [t('例：', 'Example: '), t('f(x) = x²，在 x = 3 处 f′(3) = 2×3 = 6：x 多走一点点，输出大约多走 6 倍', 'f(x) = x²; at x = 3, f′(3) = 2×3 = 6: a tiny step in x moves the output about 6 times as much')],
      ] },
      { h: t('🧭 偏导数', '🧭 Partial derivative'), li: [
        [t('输入：', 'Inputs: '), t('很多个，<b>只看其中一个</b>', 'many; <b>look at just one</b>')],
        [t('得到：', 'Gives: '), t('每个输入各 1 个数，写作 ∂f/∂x（∂ 读作“偏”）', 'one number per input, written ∂f/∂x (∂ is read “partial”)')],
        [t('例：', 'Example: '), t('f(x, y) = x²y，在 (1, 2) 处：∂f/∂x = 2xy = 4，∂f/∂y = x² = 1', 'f(x, y) = x²y at (1, 2): ∂f/∂x = 2xy = 4, ∂f/∂y = x² = 1')],
      ] },
      { h: t('⛰️ 梯度', '⛰️ Gradient'), li: [
        [t('输入：', 'Inputs: '), t('很多个，<b>全都看</b>', 'many; <b>all of them</b>')],
        [t('得到：', 'Gives: '), t('一串数（向量），写作 ∇f（∇ 读作“del”或“梯度”）', 'a list of numbers (a vector), written ∇f (∇ is read “del” or “grad”)')],
        [t('例：', 'Example: '), t('同一个 f 在 (1, 2) 处：∇f = (4, 1)，指向“上升最快”的方向', 'the same f at (1, 2): ∇f = (4, 1), pointing the way uphill is steepest')],
      ] },
    ])
    + ul([
      t('只有一个输入时，三者是一回事：偏导数就是导数，梯度就是只有一个数的那一排。', 'With a single input the three coincide: the partial derivative is the derivative, and the gradient is a list with one number.'),
      t('训练时的“输入”是模型的<b>全部参数</b>（可以有几十亿个），所以损失对参数的梯度也有几十亿个数，每个数告诉对应的那个参数该往哪边调。', 'In training the “inputs” are <b>all the model’s parameters</b> (possibly billions), so the gradient of the loss has billions of numbers, one telling each parameter which way to move.'),
    ])
    + mem(P, t('导数和偏导数是<b>一个数</b>，梯度是<b>一串数</b>；梯度的每一格，就是一个偏导数。', 'a derivative and a partial derivative are <b>one number</b>; a gradient is <b>a list</b>, and each entry of it is one partial derivative.'))
    + tryit(P, jump(P, 'labSecant', 'K1', t('🧪 割线变切线', '🧪 Secant to tangent'), true), jump(P, 'c_K4_1', 'K4', t('为什么沿负梯度走', 'Why step against the gradient'))),
    C);
}

/* ================= K2: dot product vs cosine similarity; vector vs matrix vs tensor ================= */
function k2Dot(P: Page) {
  const t = P.t;
  P.card('cfDotCos', 1, ti(P, '点积 vs 余弦相似度', 'dot product vs cosine similarity'),
    one(P, t('<b>点积</b>同时受“方向像不像”和“有多长”影响；<b>余弦相似度</b>是把两个向量都缩成长度 1 以后再算点积，<b>只看方向</b>，结果一定在 −1 到 1 之间。',
      'the <b>dot product</b> depends on both “do they point the same way” and “how long are they”; <b>cosine similarity</b> shrinks both vectors to length 1 first and then takes the dot product, so it <b>only sees direction</b> and always lands between −1 and 1.'))
    + tb([t('对比', 'Compare'), t('点积 a·b', 'Dot product a·b'), t('余弦相似度 cos θ', 'Cosine similarity cos θ')], [
      [t('怎么算', 'How'), t('对应位置相乘，再全部加起来', 'multiply matching entries, add them all up'), t('点积 ÷（a 的长度 × b 的长度）', 'dot product ÷ (length of a × length of b)')],
      [t('范围', 'Range'), t('任意大小，可正可负', 'any size, positive or negative'), t('−1 到 1：1 同向，0 垂直，−1 反向', '−1 to 1: 1 same way, 0 at right angles, −1 opposite')],
      [t('向量变长 2 倍', 'Vector made 2× longer'), t('结果也变 2 倍', 'the result doubles too'), t('<b>不变</b>', '<b>unchanged</b>')],
      [t('常见用处', 'Typical use'), t('注意力的 Q·K 打分、输出层打分（长度也算信息）', 'attention’s Q·K scores, the output layer’s scores (length carries information too)'), t('比较两段文字的向量像不像（检索、找近义词）', 'comparing two text vectors (retrieval, finding near-synonyms)')],
    ])
    + `<p><b>${t('例（举例的数字）：', 'Example (made-up numbers):')}</b>${t('a = (1, 0)，b = (3, 0)，c = (1, 1)。a·b = 3，a·c = 1，看起来 b 更“像” a；但余弦相似度 cos(a, b) = 3 ÷ (1×3) = 1，cos(a, c) = 1 ÷ (1×√2) ≈ 0.71。b 只是更长，方向和 a 完全一样。',
      'a = (1, 0), b = (3, 0), c = (1, 1). a·b = 3 and a·c = 1, so b looks “more like” a; but the cosine similarities are cos(a, b) = 3 ÷ (1×3) = 1 and cos(a, c) = 1 ÷ (1×√2) ≈ 0.71. b is simply longer, pointing exactly the same way as a.')}</p>`
    + mem(P, t('两个向量长度都是 1 时，点积 = 余弦相似度；否则点积还掺着“长度”。', 'when both vectors have length 1, dot product = cosine similarity; otherwise the dot product also mixes in length.'))
    + tryit(P, jump(P, 'c_K2_1', 'K2', t('点积的几何意义', 'What the dot product means geometrically')), jump(P, 'c_K5_3', 'K5', t('注意力为什么除以 √dₖ', 'Why attention divides by √dₖ'))),
    C);
}
function k2Ten(P: Page) {
  const t = P.t;
  P.card('cfTensor', 1, ti(P, '向量 vs 矩阵 vs 张量', 'vector vs matrix vs tensor'),
    one(P, t('都是“一堆排好的数”，区别是<b>排成几个方向</b>：向量排成一行（1 个方向），矩阵排成表格（行和列，2 个方向），张量是任意多个方向的统称。',
      'all are “numbers laid out in order”; the difference is <b>how many directions</b> they are laid out in: a vector is a row (1 direction), a matrix is a table (rows and columns, 2 directions), and tensor is the general name for any number of directions.'))
    + tri([
      { h: t('➡️ 向量（1 个方向）', '➡️ Vector (1 direction)'), li: [
        [t('样子：', 'Looks like: '), t('(0.2, −1.3, 0.7, …) 一行数', '(0.2, −1.3, 0.7, …), one row of numbers')],
        [t('形状：', 'Shape: '), t('长度 d，比如 768', 'length d, e.g. 768')],
        [t('模型里：', 'In a model: '), t('一个词元的那串数（GPT-2 小模型是 768 个数）', 'the numbers for one token (768 in GPT-2 small)')],
      ] },
      { h: t('🧮 矩阵（2 个方向）', '🧮 Matrix (2 directions)'), li: [
        [t('样子：', 'Looks like: '), t('一张表，有行有列', 'a table with rows and columns')],
        [t('形状：', 'Shape: '), t('行数 × 列数，比如 50257 × 768', 'rows × columns, e.g. 50257 × 768')],
        [t('模型里：', 'In a model: '), t('词嵌入表、每一层的权重 W', 'the embedding table, each layer’s weights W')],
      ] },
      { h: t('🧊 张量（任意个方向）', '🧊 Tensor (any number)'), li: [
        [t('样子：', 'Looks like: '), t('一摞表格，或者更多层', 'a stack of tables, or more levels')],
        [t('形状：', 'Shape: '), t('比如 批大小 × 句子长度 × 向量长度 = 32 × 1024 × 768（举例）', 'e.g. batch × sentence length × width = 32 × 1024 × 768 (an example)')],
        [t('模型里：', 'In a model: '), t('一次送进去的一整批句子；一张彩色图片是 高 × 宽 × 3', 'a whole batch of sentences at once; a colour image is height × width × 3')],
      ] },
    ])
    + ul([
      t('“张量”是统称：一个数可以看成 0 个方向的张量，向量是 1 个方向的张量，矩阵是 2 个方向的张量。PyTorch 这类工具里，所有数据都叫 tensor。', '“Tensor” is the umbrella word: a single number is a tensor with 0 directions, a vector has 1, a matrix 2. In tools like PyTorch, all data is called a tensor.'),
      t('数学和物理里“张量”还有更严格的定义（和坐标变换有关）；机器学习里说张量，一般就只是“多维数组”。', 'In maths and physics “tensor” has a stricter meaning (tied to how coordinates change); in machine learning it usually just means “multi-dimensional array”.'),
    ])
    + mem(P, t('数一数要几个编号才能找到一个数：1 个是向量，2 个（第几行第几列）是矩阵，3 个及以上一般就叫张量。', 'count how many indices you need to point at one number: 1 is a vector, 2 (row and column) a matrix, 3 or more is usually just called a tensor.'))
    + tryit(P, jump(P, 'c_K2_2', 'K2', t('矩阵乘法', 'Matrix multiplication'))),
    C);
}

/* ================= K3: loss vs accuracy; cross-entropy vs KL ================= */
function k3Loss(P: Page) {
  const t = P.t;
  P.card('cfLossAcc', 1, ti(P, '损失 vs 准确率', 'loss vs accuracy'),
    one(P, t('<b>损失</b>看“正确答案拿到了多少概率”，是一个连续变化的数，越小越好，训练就是让它变小；<b>准确率</b>只看“第一名猜对没有”，是对 / 错的比例，越大越好，主要给人看。',
      '<b>loss</b> looks at “how much probability did the right answer get”; it changes smoothly, smaller is better, and training pushes it down. <b>Accuracy</b> only asks “was the top guess right”; it is a share of right / wrong, bigger is better, and is mainly for people to read.'))
    + tb([t('对比', 'Compare'), t('损失（交叉熵）', 'Loss (cross-entropy)'), t('准确率', 'Accuracy')], [
      [t('一道题怎么算', 'Per question'), t('−log（正确答案的概率）', '−log(probability of the right answer)'), t('第一名 = 正确答案就算 1，否则 0', '1 if the top guess is the right answer, else 0')],
      [t('好的方向', 'Good direction'), t('越小越好，最小是 0', 'smaller is better, 0 at best'), t('越大越好，最大是 100%', 'bigger is better, 100% at best')],
      [t('能不能直接拿来训练', 'Can you train on it directly'), t('能：概率稍微变一点，损失就跟着变一点，可以求梯度', 'yes: nudge a probability and the loss moves a little, so it has a gradient'), t('不能：概率稍微变一点，对 / 错通常不变，梯度几乎处处是 0', 'no: a small nudge usually leaves right / wrong unchanged, so the gradient is 0 almost everywhere')],
      [t('谁看', 'Who reads it'), t('优化器（训练程序）', 'the optimizer (training code)'), t('人（报告、排行榜）', 'people (reports, leaderboards)')],
    ])
    + `<p><b>${t('例（举例的数字）：', 'Example (made-up numbers):')}</b>${t('两次预测里正确的词都是第一名，准确率都是 100%。但一次它拿到 40% 的概率，损失 −ln 0.4 ≈ 0.92；另一次拿到 90%，损失 −ln 0.9 ≈ 0.11。损失看得出“更有把握”，准确率看不出。',
      'In two predictions the right word comes first both times, so accuracy is 100% both times. But once it gets 40% probability, loss −ln 0.4 ≈ 0.92; the other time 90%, loss −ln 0.9 ≈ 0.11. Loss sees “more confident”; accuracy cannot.')}</p>`
    + mem(P, t('训练盯着损失往下走，汇报时再看准确率；两者通常一起变好，但不一定同步。', 'training follows the loss downhill; reports look at accuracy. They usually improve together, but not always in step.'))
    + tryit(P, jump(P, 'labSoftmax', 'K3', t('🧪 softmax、熵与交叉熵', '🧪 Softmax, entropy and cross-entropy'), true), jump(P, 'c_K5_2', 'K5', t('为什么梯度是 p − y', 'Why the gradient is p − y'))),
    C);
}
function k3Kl(P: Page) {
  const t = P.t;
  P.card('cfCeKl', 1, ti(P, '交叉熵 vs KL 散度', 'cross-entropy vs KL divergence'),
    one(P, t('<b>交叉熵</b> = 用模型的猜测 q 去对付真实情况 p 时，平均有多“惊讶”；<b>KL 散度</b> = 其中<b>多出来的那一部分</b>，也就是“因为猜得不准才多出来的惊讶”。两者只差一个和模型无关的数：交叉熵 = 熵 + KL。',
      '<b>cross-entropy</b> = how “surprised” you are on average when you meet the truth p with the model’s guess q; the <b>KL divergence</b> = <b>the extra part</b> of that, the surprise that comes only from guessing wrong. They differ by a number that does not depend on the model: cross-entropy = entropy + KL.'))
    + tb([t('对比', 'Compare'), t('交叉熵 H(p, q)', 'Cross-entropy H(p, q)'), t('KL 散度 D<sub>KL</sub>(p‖q)', 'KL divergence D<sub>KL</sub>(p‖q)')], [
      [t('意思', 'Meaning'), t('总的平均惊讶程度', 'total average surprise'), t('比“完美猜测”多出来的惊讶', 'surprise beyond a perfect guess')],
      [t('最小是多少', 'Smallest value'), t('H(p)：真实情况本身的熵（本来就有的不确定）', 'H(p): the entropy of the truth itself (uncertainty that is there anyway)'), t('0：当且仅当 q = p', '0, exactly when q = p')],
      [t('对称吗', 'Symmetric?'), t('不对称', 'no'), t('不对称：D<sub>KL</sub>(p‖q) 一般 ≠ D<sub>KL</sub>(q‖p)，所以它不算真正的“距离”', 'no: D<sub>KL</sub>(p‖q) ≠ D<sub>KL</sub>(q‖p) in general, so it is not a true “distance”')],
      [t('常见用处', 'Typical use'), t('语言模型的训练损失', 'the training loss of language models'), t('衡量两个分布差多远：如 RLHF 里不让新模型离原模型太远', 'how far apart two distributions are, e.g. keeping a model close to its original in RLHF')],
    ])
    + `<p><b>${t('例（举例的数字）：', 'Example (made-up numbers):')}</b>${t('真实 p = (50%, 50%)，模型 q = (80%, 20%)。熵 H(p) = ln 2 ≈ 0.693；交叉熵 = −(0.5 ln 0.8 + 0.5 ln 0.2) ≈ 0.916；KL ≈ 0.916 − 0.693 = 0.223。',
      'Truth p = (50%, 50%), model q = (80%, 20%). Entropy H(p) = ln 2 ≈ 0.693; cross-entropy = −(0.5 ln 0.8 + 0.5 ln 0.2) ≈ 0.916; KL ≈ 0.916 − 0.693 = 0.223.')}</p>`
    + ul([
      t('训练语言模型时，真实答案只有一个词（它的概率是 100%），这时 H(p) = 0，交叉熵和 KL <b>正好相等</b>。', 'When training a language model the truth is one word (probability 100%), so H(p) = 0 and cross-entropy and KL are <b>exactly equal</b>.'),
      t('符号：p 是真实分布，q 是模型给的分布，ln 是自然对数，单位是 nat。', 'Symbols: p is the true distribution, q the model’s, ln the natural log; the unit is the nat.'),
    ])
    + mem(P, t('交叉熵 = 本来就有的不确定（熵）+ 猜错多付的代价（KL）。模型只能减少后一项。', 'cross-entropy = the uncertainty that is there anyway (entropy) + the price of guessing wrong (KL). A model can only shrink the second part.'))
    + tryit(P, jump(P, 'c_K3_4', 'K3', t('交叉熵 = 熵 + KL 的证明', 'Proof that cross-entropy = entropy + KL')), jump(P, 'labSoftmax', 'K3', t('🧪 动手算交叉熵', '🧪 Compute cross-entropy'))),
    C);
}

/* ================= K4: learning rate vs gradient; batch vs epoch vs step (+ labBatch) ================= */
function k4Lr(P: Page) {
  const t = P.t;
  P.card('cfLrGrad', 1, ti(P, '学习率 vs 梯度', 'learning rate vs gradient'),
    one(P, t('<b>梯度</b>是每一步<b>算出来</b>的：告诉你往哪边是上坡、坡有多陡；<b>学习率</b>是人<b>事先定好</b>的一个数：决定沿着下坡方向迈多大一步。一步的走法 = 学习率 × 梯度，再取反方向。',
      'the <b>gradient</b> is <b>computed</b> at every step: it says which way is uphill and how steep; the <b>learning rate</b> is a number people <b>set in advance</b>: how big a stride to take downhill. One step = learning rate × gradient, in the opposite direction.'))
    + tb([t('对比', 'Compare'), t('梯度 g', 'Gradient g'), t('学习率 η', 'Learning rate η')], [
      [t('从哪来', 'Where from'), t('用当前参数和这批数据<b>算出来</b>（反向传播）', '<b>computed</b> from the current parameters and this batch (backpropagation)'), t('人<b>设定</b>的超参数，可按计划随时间变化', 'a hyperparameter people <b>choose</b>; it may follow a schedule over time')],
      [t('是什么', 'What it is'), t('一串数，每个参数一个', 'a list of numbers, one per parameter'), t('通常就一个数（如 0.001）', 'usually one number (e.g. 0.001)')],
      [t('管什么', 'Controls'), t('方向和陡峭程度', 'direction and steepness'), t('步子大小', 'stride length')],
      [t('每一步都变吗', 'Changes every step?'), t('会，位置一变它就变', 'yes, it changes whenever the position does'), t('不会自己变，除非你设了计划', 'not by itself, unless you set a schedule')],
    ])
    + `<p><b>${t('例（举例的数字）：', 'Example (made-up numbers):')}</b>${t('更新规则 θ ← θ − η·g（θ 是参数，← 表示“换成”）。某个参数的梯度 g = 4，学习率 η = 0.1，这一步它就减少 0.1 × 4 = 0.4。梯度翻倍，步子也翻倍；学习率太大，会一步跨过谷底。',
      'The update θ ← θ − η·g (θ is a parameter, ← means “replace with”). If one parameter’s gradient is g = 4 and the learning rate is η = 0.1, this step lowers it by 0.1 × 4 = 0.4. Double the gradient and the step doubles; too large a learning rate jumps right over the valley.')}</p>`
    + mem(P, t('梯度是<b>地图上的箭头</b>（每走一步重新看），学习率是<b>你的步幅</b>（自己定）。', 'the gradient is <b>the arrow on the map</b> (re-read at every step); the learning rate is <b>your stride</b> (your choice).'))
    + tryit(P, jump(P, 'labGD', 'K4', t('🧪 拖动学习率看收敛', '🧪 Drag the learning rate'), true)),
    C);
}
function k4Batch(P: Page) {
  const t = P.t;
  P.card('cfBatch', 1, ti(P, 'batch vs epoch vs step', 'batch vs epoch vs step'),
    one(P, t('<b>batch（批）</b>是一次拿来算梯度的<b>一小叠样本</b>；<b>step（步）</b>是用一批样本<b>更新一次参数</b>；<b>epoch（轮）</b>是把整个训练集<b>从头到尾用完一遍</b>。一轮里有多少步 = 样本数 ÷ 批大小（除不尽就向上取整）。',
      'a <b>batch</b> is <b>a small pile of examples</b> used for one gradient; a <b>step</b> is <b>one parameter update</b> made with one batch; an <b>epoch</b> is <b>one full pass</b> over the whole training set. Steps per epoch = examples ÷ batch size (rounded up if it does not divide).'))
    + tri([
      { h: t('📦 batch（批）', '📦 Batch'), li: [
        [t('是什么：', 'What: '), t('一小叠样本，个数叫批大小 B', 'a small pile of examples; how many is the batch size B')],
        [t('像：', 'Like: '), t('老师一次批改的一叠作业', 'the stack of homework a teacher marks in one go')],
        [t('例：', 'Example: '), t('B = 32：每次拿 32 个样本', 'B = 32: take 32 examples each time')],
      ] },
      { h: t('👣 step（步）', '👣 Step'), li: [
        [t('是什么：', 'What: '), t('算一次平均梯度、改一次参数', 'compute one average gradient, update the parameters once')],
        [t('像：', 'Like: '), t('改完一叠作业，讲评一次', 'one round of feedback after a stack is marked')],
        [t('例：', 'Example: '), t('1 批 → 1 步（不考虑梯度累积）', '1 batch → 1 step (ignoring gradient accumulation)')],
      ] },
      { h: t('🔁 epoch（轮）', '🔁 Epoch'), li: [
        [t('是什么：', 'What: '), t('训练集里每个样本都用过一次', 'every training example used once')],
        [t('像：', 'Like: '), t('把整本练习册做完一遍', 'working through the whole workbook once')],
        [t('例：', 'Example: '), t('1000 个样本、B = 32：一轮 = ⌈1000 ÷ 32⌉ = 32 步（最后一批只有 8 个）', '1000 examples, B = 32: one epoch = ⌈1000 ÷ 32⌉ = 32 steps (the last batch has only 8)')],
      ] },
    ])
    + ul([
      t('⌈ ⌉ 表示“向上取整”：31.25 取成 32。有的程序会丢掉最后那批不满的，这时一轮就是 31 步。', '⌈ ⌉ means “round up”: 31.25 becomes 32. Some programs drop the last, short batch, and then one epoch is 31 steps.'),
      t('常见做法：每轮开头把数据打乱，再切成批，所以一轮里每个样本正好用一次，但每轮的分组都不同。', 'A common practice: shuffle the data at the start of each epoch, then cut it into batches, so each example is used exactly once per epoch, in different groups every time.'),
      t('“梯度累积”是例外：攒几批的梯度再更新一次，这时几批才算一步。', '“Gradient accumulation” is the exception: gradients from several batches are added up before one update, so several batches make one step.'),
      t('大模型的训练数据极多，常常只过一轮左右，所以大家更常说“训练了多少步、多少词元”，而不是多少轮。', 'Large models see so much data that they often make only about one pass, so people talk about “how many steps / tokens”, not epochs.'),
    ])
    + mem(P, t('批是<b>一叠</b>，步是<b>改一次</b>，轮是<b>做完一本</b>。总步数 = 每轮步数 × 轮数。', 'a batch is <b>a pile</b>, a step is <b>one update</b>, an epoch is <b>the whole book once</b>. Total steps = steps per epoch × epochs.'))
    + tryit(P, jump(P, 'labBatch', 'K4', t('🧪 算一算有几步', '🧪 Count the steps'), true), jump(P, 'c_N_2', 'N', t('小批量与训练 / 验证 / 测试', 'Mini-batches and train / val / test'))),
    C);
  P.lab('labBatch', t('batch / epoch / step 计数器', 'Batch / epoch / step counter'),
    t('样本数、批大小和轮数都是<b>举例用的玩具数字</b>，你可以随便拖；算法和真实训练程序一样。', 'The number of examples, the batch size and the number of epochs are <b>made-up toy numbers</b>; drag them freely. The counting is the same as in real training code.'),
    [t('每轮步数 = ⌈N ÷ B⌉（⌈ ⌉ 向上取整）；勾选“丢掉最后不满的一批”时 = ⌊N ÷ B⌋（⌊ ⌋ 向下取整）。', 'Steps per epoch = ⌈N ÷ B⌉ (⌈ ⌉ rounds up); with “drop the last short batch” ticked it is ⌊N ÷ B⌋ (⌊ ⌋ rounds down).'),
      t('下面的色条是第 1 轮：每一格是一批，宽度按批里的样本数画。', 'The strip below is epoch 1: each block is one batch, drawn as wide as the number of examples in it.')],
    `<div class="k-ctl"><label>${t('样本数 N', 'Examples N')} = <b id="bcNv">1000</b><input type="range" id="bcN" min="100" max="5000" step="100" value="1000"></label>
<label>${t('批大小 B', 'Batch size B')} = <b id="bcBv">32</b><input type="range" id="bcB" min="8" max="512" step="8" value="32"></label>
<label>${t('轮数 E', 'Epochs E')} = <b id="bcEv">3</b><input type="range" id="bcE" min="1" max="10" step="1" value="3"></label>
<label class="bc-ck"><input type="checkbox" id="bcD"> ${t('丢掉最后不满的一批', 'Drop the last short batch')}</label></div>
<div id="bcBar" class="bc-bar" role="img" aria-label="${t('第 1 轮的分批', 'Batches of epoch 1')}"></div>
<div id="bcOut" class="k-out" aria-live="polite"></div>`,
    [t('默认 N = 1000、B = 32：一轮 32 步，最后一批只有 8 个；勾上“丢掉”，变成 31 步，每轮少用 8 个样本。', 'Default N = 1000, B = 32: 32 steps per epoch, the last batch only 8; tick “drop” and it becomes 31 steps, leaving 8 examples out each epoch.'),
      t('把 B 拖到最右（512）：一轮只有 2 步（512 + 488）。批越大，每轮步数越少。', 'Drag B all the way right (512): only 2 steps per epoch (512 + 488). The bigger the batch, the fewer steps per epoch.'),
      t('把 E 从 1 拖到 10：总步数跟着乘 10，每轮步数不变。', 'Drag E from 1 to 10: the total steps multiply by 10; steps per epoch stay the same.')]);
}

/* ================= K5: backpropagation vs gradient descent ================= */
function k5(P: Page) {
  const t = P.t;
  P.card('cfBackGd', 1, ti(P, '反向传播 vs 梯度下降', 'backpropagation vs gradient descent'),
    one(P, t('<b>反向传播</b>负责<b>算出</b>梯度：用链式法则，从损失往回一层层算出每个参数的偏导数；<b>梯度下降</b>负责<b>用</b>梯度：按“参数 − 学习率 × 梯度”改参数。一个是“量坡度”，一个是“迈步子”。',
      '<b>backpropagation</b> <b>computes</b> the gradient: with the chain rule it works backwards from the loss, layer by layer, to every parameter’s partial derivative; <b>gradient descent</b> <b>uses</b> it: parameter − learning rate × gradient. One “measures the slope”, the other “takes the step”.'))
    + tb([t('对比', 'Compare'), t('反向传播', 'Backpropagation'), t('梯度下降（及 Adam 等优化器）', 'Gradient descent (and optimizers like Adam)')], [
      [t('做什么', 'Does'), t('算梯度', 'computes gradients'), t('用梯度改参数', 'updates parameters with them')],
      [t('靠什么', 'Relies on'), t('链式法则，从后往前', 'the chain rule, back to front'), t('更新规则：θ ← θ − η·g', 'an update rule: θ ← θ − η·g')],
      [t('改参数吗', 'Changes parameters?'), t('<b>不改</b>，只算出数', '<b>no</b>, it only produces numbers'), t('<b>改</b>', '<b>yes</b>')],
      [t('可以换吗', 'Swappable?'), t('换优化器时它不变', 'stays the same when you change optimizer'), t('SGD、动量、Adam 都是这一步的不同做法', 'SGD, momentum and Adam are different versions of this step')],
    ])
    + ol([
      t('<b>前向</b>：输入一批数据，一层层算到输出，得到损失。', '<b>Forward</b>: feed a batch through the layers to the output and get the loss.'),
      t('<b>反向传播</b>：从损失往回算，得到每个参数的梯度。', '<b>Backpropagation</b>: work back from the loss to get every parameter’s gradient.'),
      t('<b>更新</b>：优化器（梯度下降、Adam……）用梯度改参数。这三件事合起来是训练的一步。', '<b>Update</b>: the optimizer (gradient descent, Adam, …) changes the parameters using the gradients. These three together make one training step.'),
    ])
    + mem(P, t('反向传播<b>只算不改</b>，梯度下降<b>拿来就改</b>。', 'backpropagation <b>computes, never changes</b>; gradient descent <b>takes the result and changes</b>.'))
    + tryit(P, jump(P, 'c_K4_4', 'K4', t('动量与 Adam', 'Momentum and Adam')), jump(P, 'c_K1_3', 'K1', t('链式法则', 'The chain rule'))),
    C);
}

/* ================= Uc: tools vs MCP vs Skills ================= */
function uc(P: Page) {
  const t = P.t;
  P.card('cfToolMcpSkill', 1, ti(P, '工具 vs MCP vs Skills', 'tools vs MCP vs Skills'),
    one(P, t('<b>工具</b>是 Agent 能做的<b>一个动作</b>（一份说明书 + 一段程序）；<b>MCP</b> 是把工具（和资料）<b>接进来的统一插座</b>，本身不是一个动作；<b>Skills</b> 是一份<b>“这类事怎么做”的做法说明</b>，用到时才读进来，照着做时往往会用到工具。',
      'a <b>tool</b> is <b>one action</b> the agent can take (a manual plus a program); <b>MCP</b> is <b>the standard socket</b> that plugs tools (and data) in, not an action itself; a <b>Skill</b> is <b>written know-how for a kind of task</b>, read in only when needed, and following it often means using tools.'))
    + tri([
      { h: t('🔧 工具', '🔧 Tool'), li: [
        [t('像：', 'Like: '), t('一把螺丝刀（手）', 'a screwdriver (hands)')],
        [t('是什么：', 'What: '), t('名字 + 用途 + 参数格式，和真正干活的程序', 'a name, purpose and parameter format, plus the program that does the work')],
        [t('谁执行：', 'Who runs it: '), t('应用程序，按模型填好的参数去调', 'the app, with the arguments the model filled in')],
      ] },
      { h: t('🔌 MCP', '🔌 MCP'), li: [
        [t('像：', 'Like: '), t('墙上的标准插座', 'a standard wall socket')],
        [t('是什么：', 'What: '), t('一个开放协议：MCP 服务器提供工具、资源、提示模板，任何支持 MCP 的应用都能连', 'an open protocol: an MCP server offers tools, resources and prompts, and any MCP-capable app can connect')],
        [t('解决：', 'Solves: '), t('不用每个应用对每个工具单独对接（N × M → N + M）', 'no per-app, per-tool integration (N × M → N + M)')],
      ] },
      { h: t('📦 Skills', '📦 Skills'), li: [
        [t('像：', 'Like: '), t('一本操作手册（经验）', 'a how-to manual (know-how)')],
        [t('是什么：', 'What: '), t('一个文件夹：SKILL.md 写步骤，可附脚本、模板', 'a folder: SKILL.md with the steps, maybe scripts and templates')],
        [t('平时占多少：', 'Idle cost: '), t('只有名字 + 一句话简介；用到时才读全文', 'only the name and a one-line description; the full text is read when needed')],
      ] },
    ])
    + ul([
      t('三者可以叠在一起：一个 Skill 写着“先用 A 工具查，再用 B 工具改”，而 A、B 是通过 MCP 服务器接进来的。', 'They stack: a Skill says “look it up with tool A, then change it with tool B”, and A and B arrive through an MCP server.'),
      t('MCP 服务器带来的工具，每一个的说明书平时都在上下文里；装太多会挤占上下文。', 'Every tool an MCP server brings keeps its manual in the context all the time; installing too many crowds the context.'),
    ])
    + mem(P, t('工具是<b>手</b>，MCP 是<b>插座</b>，Skill 是<b>手册</b>。', 'a tool is <b>a hand</b>, MCP is <b>the socket</b>, a Skill is <b>the manual</b>.'))
    + tryit(P, jump(P, 'labCtxLoad', 'Uc', t('🧪 说明书占了多少上下文', '🧪 How much context the manuals take'), true), jump(P, 'c_Uc_4', 'Uc', t('装 MCP 前的清单', 'Checklist before installing MCP'))),
    C);
}

/* ================= Ua: chat assistant vs coding agent ================= */
function ua(P: Page) {
  const t = P.t;
  P.card('cfChatCode', 1, ti(P, '对话助手 vs 编程 Agent', 'chat assistant vs coding agent'),
    one(P, t('背后可以是<b>同一个大模型</b>，区别在于<b>手能伸多远</b>：对话助手在网页 / App 里<b>回答你</b>，改动要你自己去做；编程 Agent 在编辑器或命令行里，能<b>自己读项目、改文件、跑命令和测试</b>，最后把改动交给你审。',
      'the <b>same model</b> can sit behind both; the difference is <b>how far its hands reach</b>. A chat assistant <b>answers you</b> in a web page or app and you make the changes yourself; a coding agent, in your editor or terminal, <b>reads the project, edits files, runs commands and tests</b> itself, then hands the changes to you to review.'))
    + tb([t('对比', 'Compare'), t('💬 对话助手', '💬 Chat assistant'), t('🧑‍💻 编程 Agent', '🧑‍💻 Coding agent')], [
      [t('在哪用', 'Where'), t('网页、手机 App', 'a web page, a phone app'), t('代码编辑器、命令行', 'the code editor, the terminal')],
      [t('能看到什么', 'What it sees'), t('你贴进来的内容、上传的文件', 'what you paste in, files you upload'), t('整个项目的文件，加上规则文件', 'the whole project’s files, plus a rules file')],
      [t('能做什么', 'What it can do'), t('回答；内置的搜索、跑一小段代码', 'answer; built-in search, running a short snippet'), t('改多个文件、运行命令、跑测试、再改', 'edit many files, run commands, run tests, fix again')],
      [t('交出来的', 'What you get'), t('一段回答（代码要你复制过去）', 'an answer (you copy any code over)'), t('一组改动（diff），你逐个接受或拒绝', 'a set of changes (diffs) you accept or reject')],
      [t('你要做的检查', 'What you check'), t('核对事实、数字和出处', 'facts, numbers and sources'), t('看 diff、看测试结果；别让它碰不该碰的', 'the diffs and test results; keep it away from what it should not touch')],
    ])
    + mem(P, t('对话助手<b>动嘴</b>，编程 Agent <b>动手</b>；能动手，就更要检查它动了什么。', 'a chat assistant <b>talks</b>; a coding agent <b>acts</b>, and the more it can act, the more you check what it did.'))
    + tryit(P, jump(P, 'labSession', 'Ua', t('🧪 看一次编程会话', '🧪 Watch a coding session'), true), jump(P, 'cfAgentLlm', 'T2', t('大模型 vs Agent', 'LLM vs agent'))),
    C);
}

/* ================= N: training vs validation vs test set; overfitting vs underfitting ================= */
function nSplit(P: Page) {
  const t = P.t;
  P.card('cfSplit', 1, ti(P, '训练集 vs 验证集 vs 测试集', 'training vs validation vs test set'),
    one(P, t('<b>训练集</b>用来<b>学</b>（会改参数）；<b>验证集</b>用来<b>挑设置、决定何时停</b>（只看不学）；<b>测试集</b>留到<b>最后考一次</b>，看真本事。三份数据不能混。',
      'the <b>training set</b> is for <b>learning</b> (it changes the parameters); the <b>validation set</b> is for <b>choosing settings and when to stop</b> (looked at, never learned from); the <b>test set</b> is kept for <b>one final exam</b> to see the real skill. The three must not mix.'))
    + tri([
      { h: t('📚 训练集', '📚 Training set'), li: [
        [t('像：', 'Like: '), t('作业', 'homework')],
        [t('用来：', 'Used for: '), t('算损失和梯度、更新参数', 'computing loss and gradients, updating parameters')],
        [t('看几次：', 'Seen: '), t('每一轮都用', 'every epoch')],
      ] },
      { h: t('📝 验证集', '📝 Validation set'), li: [
        [t('像：', 'Like: '), t('小测', 'quizzes')],
        [t('用来：', 'Used for: '), t('比较学习率、模型大小等设置；验证损失变差就早停', 'comparing settings such as learning rate or size; stop early when validation loss gets worse')],
        [t('看几次：', 'Seen: '), t('反复看，但不拿来更新参数', 'often, but never used to update parameters')],
      ] },
      { h: t('🎓 测试集', '🎓 Test set'), li: [
        [t('像：', 'Like: '), t('期末考', 'the final exam')],
        [t('用来：', 'Used for: '), t('最后报告一个可信的成绩', 'reporting one trustworthy score at the end')],
        [t('看几次：', 'Seen: '), t('原则上只看一次', 'in principle, once')],
      ] },
    ])
    + ul([
      t('为什么验证集和测试集要分开：用验证集挑了很多次设置以后，设置已经“偏向”验证集，它的分数会偏乐观；测试集没被挑过，才可信。', 'Why validation and test are separate: after many rounds of picking settings on the validation set, the choices lean towards it and its score is optimistic; the untouched test set stays trustworthy.'),
      t('70% / 15% / 15% 只是常见的举例比例，不是规定。评测题混进训练数据（数据污染）会让测试分数虚高。', '70% / 15% / 15% is only a common example split, not a rule. Test questions leaking into training data (contamination) inflate the test score.'),
    ])
    + mem(P, t('作业用来学，小测用来调，期末只考一次。', 'homework to learn, quizzes to tune, one final exam.'))
    + tryit(P, jump(P, 'labTiny', 'N', t('🧪 训练一个小网络（看早停）', '🧪 Train a tiny network (early stopping)'), true), jump(P, 'xEval', 'T7', t('排行榜与数据污染', 'Leaderboards and contamination'))),
    C);
}
function nFit(P: Page) {
  const t = P.t;
  P.card('cfFit', 1, ti(P, '过拟合 vs 欠拟合', 'overfitting vs underfitting'),
    one(P, t('<b>欠拟合</b>：连作业都做不好，训练集上的损失也高，是“没学会”；<b>过拟合</b>：作业做得很好，新题却不会，训练损失低、验证损失高，是“死记硬背”。',
      '<b>underfitting</b>: it cannot even do the homework, so the training loss is high too; it “has not learned”. <b>Overfitting</b>: homework is great but new questions fail, so training loss is low and validation loss high; it “memorised”.'))
    + tb([t('对比', 'Compare'), t('欠拟合', 'Underfitting'), t('过拟合', 'Overfitting')], [
      [t('训练损失', 'Training loss'), t('<b>高</b>', '<b>high</b>'), t('<b>低</b>', '<b>low</b>')],
      [t('验证损失', 'Validation loss'), t('也高（和训练差不多）', 'also high (close to training)'), t('明显比训练高，而且可能越训越高', 'clearly higher than training, and may rise as training goes on')],
      [t('像', 'Like'), t('还没学会的学生', 'a student who has not learned yet'), t('只会背原题的学生', 'a student who only memorised the past papers')],
      [t('常见原因', 'Common causes'), t('模型太小、训练太短、学习率不合适', 'model too small, too little training, a poor learning rate'), t('模型相对数据太大、数据太少、训练太久', 'model too big for the data, too little data, training too long')],
      [t('常见办法', 'Common fixes'), t('换大一点的模型、多训一会儿、调学习率', 'a bigger model, train longer, tune the learning rate'), t('更多 / 更多样的数据、L2、dropout、早停', 'more / more varied data, L2, dropout, early stopping')],
    ])
    + mem(P, t('先看训练损失：高就是欠拟合；训练低、验证高，就是过拟合。', 'look at training loss first: high means underfitting; low training but high validation means overfitting.'))
    + tryit(P, jump(P, 'labTiny', 'N', t('🧪 小网络：过拟合与早停', '🧪 Tiny network: overfitting and early stopping'), true), jump(P, 'labFit', 'T7', t('🧪 拟合一条曲线', '🧪 Fit a curve'))),
    C);
}

/* ================= T6: diffusion vs autoregressive ================= */
function t6(P: Page) {
  const t = P.t;
  P.card('cfDiffAr', 1, ti(P, '扩散 vs 自回归', 'diffusion vs autoregressive'),
    one(P, t('<b>自回归</b>是<b>一块一块往后接</b>：每次根据前面已有的，猜下一个 token；<b>扩散</b>是<b>整张一起慢慢变清楚</b>：从一团随机噪声开始，每一步把整张图（或它的潜空间表示）去掉一点噪声。',
      '<b>autoregressive</b> means <b>adding one piece at a time</b>: each time, guess the next token from everything before it. <b>Diffusion</b> means <b>the whole thing sharpening together</b>: start from random noise and, at every step, remove a little noise from the entire image (or its latent version).'))
    + tb([t('对比', 'Compare'), t('✍️ 自回归', '✍️ Autoregressive'), t('🖼️ 扩散', '🖼️ Diffusion')], [
      [t('每一步做什么', 'Each step'), t('多出<b>一个</b> token', 'adds <b>one</b> token'), t('<b>整张</b>都改一点（去一点噪声）', 'changes <b>everything</b> a little (removes some noise)')],
      [t('从哪开始', 'Starts from'), t('提示词（已有的内容）', 'the prompt (what is already there)'), t('随机噪声（加上提示词作为条件）', 'random noise (with the prompt as a condition)')],
      [t('一共几步', 'How many steps'), t('要生成几个 token 就几步', 'one per token generated'), t('事先定好的去噪步数（常见几十步，也有压缩到几步的），和图有多大无关', 'a preset number of denoising steps (often dozens, some squeezed to a few), not tied to image size')],
      [t('改得了前面吗', 'Can it revise earlier parts?'), t('已经写出的 token 不再改', 'tokens already written stay'), t('每一步都能改整张', 'every step can revise the whole')],
      [t('最常见于', 'Most common for'), t('文字（大语言模型）', 'text (large language models)'), t('图片、视频', 'images, video')],
    ])
    + ul([
      t('这是两种<b>生成方式</b>，不是两种内容：图片也能切成 token 用自回归一块块生成，文字也有人用扩散来做；还有把两者混在一起的做法。', 'These are two <b>ways of generating</b>, not two kinds of content: images can be cut into tokens and generated autoregressively, text has been tried with diffusion, and some systems mix both.'),
    ])
    + mem(P, t('自回归像<b>接龙</b>，一个接一个；扩散像<b>擦雾玻璃</b>，整面一起擦清楚。', 'autoregressive is like <b>a word chain</b>, one after another; diffusion is like <b>wiping a fogged window</b>, the whole pane at once.'))
    + tryit(P, jump(P, 'labDiff', 'T6', t('🧪 扩散去噪游乐场', '🧪 Diffusion playground'), true), jump(P, 'genText', 'T6', t('生成·文字：自回归', 'Generating text: autoregressive'))),
    C);
}

export const M12: Ext = {
  parts: {},
  cards: {},
  near: {
    K1: [{ after: 'c_K1_4', f: k1 }],
    K2: [{ after: 'c_K2_1', f: k2Dot }, { after: 'c_K2_2', f: k2Ten }],
    K3: [{ after: 'c_K3_4', f: k3Loss }, { after: 'c_K3_5', f: k3Kl }],
    K4: [{ after: 'c_K4_2', f: k4Lr }, { after: 'c_K4_3', f: k4Batch }],
    K5: [{ after: 'c_K5_1', f: k5 }],
    Uc: [{ after: 'c_Uc_3', f: uc }],
    Ua: [{ after: 'c_Ua_2', f: ua }],
    N: [{ after: 'c_N_2', f: nSplit }, { after: 'c_N_4', f: nFit }],
    T6: [{ after: 'genImg', f: t6 }],
  },
  quiz: () => ({}),
};
/** every card / lab id M12 adds, by station (tests and the audit list read this) */
export const CF2_IDS: Record<string, string[]> = {
  K1: ['cfDerivGrad'], K2: ['cfDotCos', 'cfTensor'], K3: ['cfLossAcc', 'cfCeKl'], K4: ['cfLrGrad', 'cfBatch', 'labBatch'], K5: ['cfBackGd'],
  Uc: ['cfToolMcpSkill'], Ua: ['cfChatCode'], N: ['cfSplit', 'cfFit'], T6: ['cfDiffAr'],
};
