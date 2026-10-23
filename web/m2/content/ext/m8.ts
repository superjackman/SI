/* M8 (R11 coherence audit, gaps 1–7): decoding (greedy vs beam) and perplexity on T3, rotary position embedding on T4a,
   LoRA parameter counts on T5, DPO, pass@k and the warmup + cosine schedule with gradient clipping on T7.
   Each gap gets a short card, a popup and an interactive lab; the maths is in src/m2/ymath.ts and unit-tested.
   Facts are from the cited abstracts (re-read 2026-10-23); illustrative numbers are tagged 示意. */
import type { Page, T } from '../../lib';
import { src, ul, type Ext } from './kit';

type L2 = [string, string];
const A = {
  beam: ['https://arxiv.org/abs/1702.01806', 'Freitag & Al-Onaizan 2017, Beam Search Strategies for Neural Machine Translation (arXiv 1702.01806)'] as L2,
  slp: ['https://web.stanford.edu/~jurafsky/slp3/3.pdf', 'Jurafsky & Martin, Speech and Language Processing (3rd ed. draft), ch. 3 N-gram Language Models'] as L2,
  rope: ['https://arxiv.org/abs/2104.09864', 'Su et al. 2021, RoFormer: Enhanced Transformer with Rotary Position Embedding (arXiv 2104.09864)'] as L2,
  lora: ['https://arxiv.org/abs/2106.09685', 'Hu et al. 2021, LoRA: Low-Rank Adaptation of Large Language Models (arXiv 2106.09685)'] as L2,
  dpo: ['https://arxiv.org/abs/2305.18290', 'Rafailov et al. 2023, Direct Preference Optimization (arXiv 2305.18290)'] as L2,
  codex: ['https://arxiv.org/abs/2107.03374', 'Chen et al. 2021, Evaluating Large Language Models Trained on Code (arXiv 2107.03374)'] as L2,
  sgdr: ['https://arxiv.org/abs/1608.03983', 'Loshchilov & Hutter 2016, SGDR: Stochastic Gradient Descent with Warm Restarts (arXiv 1608.03983)'] as L2,
  warm: ['https://arxiv.org/abs/1706.02677', 'Goyal et al. 2017, Accurate, Large Minibatch SGD (arXiv 1706.02677)'] as L2,
  clip: ['https://arxiv.org/abs/1211.5063', 'Pascanu et al. 2013, On the difficulty of training Recurrent Neural Networks (arXiv 1211.5063)'] as L2,
};
const S = (P: Page, items: L2[]) => src(P, items);
/** a jump to a lab on the same station (the page-map mechanism) */
const go = (P: Page, id: string, label: string) => `<p class="tryit"><b>${P.t('🧪 动手试试：', '🧪 Try it: ')}</b><button class="btn primary" data-sj="${id}" data-sp="${P.S}">${label}</button></p>`;
const rng = (id: string, label: string, min: number, max: number, step: number, v: number) => `<label>${label} = <b id="${id}v">${v}</b><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;

export const M8: Ext = {
  parts: {
    xbeam: {
      n: { zh: '贪心解码与束搜索', en: 'Greedy decoding and beam search' }, t: 'T3', cat: 'llm', train: 'no', up: 'sample',
      pop: (t) => ({
        role: t('不随机采样时，怎么从“每一步的概率”拼出整句话：每步只挑最好的一个（贪心），或者同时保留几条候选（束搜索）。', 'Without random sampling, how to build a whole sentence from per-step probabilities: take the single best word each step (greedy), or keep several candidates at once (beam search).'),
        status: t('⚙️ 解码策略：在推理时选词的方法，不改模型参数。', '⚙️ A decoding strategy: how words are picked at inference time; no parameters change.'),
        does: [t('整句的概率 = 每一步所选词概率的乘积。', 'A sentence’s probability is the product of the chosen words’ probabilities.'), t('束宽 k：每一步只保留总概率最高的 k 条前缀；k = 1 就是贪心。', 'Beam width k: after each step keep only the k prefixes with the highest total probability; k = 1 is greedy.')],
        how: [t('下方“束搜索”实验室：把束宽从 1 调到 2，看最终句子怎么变。', 'In the beam-search lab below, move the width from 1 to 2 and watch the final sentence change.')],
        why: t('第一步最好的词，后面不一定接得好；多留几条候选，能找到整体概率更高的句子。', 'The best first word may lead nowhere good; keeping a few candidates can find a sentence with higher overall probability.'),
        eff: t('Freitag & Al-Onaizan 2017 让每一步的候选数按分数变化：德英、中英翻译的解码最多快 43%，翻译质量不降。', 'Freitag & Al-Onaizan 2017 let the number of candidates vary with their scores at each step: up to 43% faster decoding for German–English and Chinese–English with no loss of translation quality.'),
        lim: t('束搜索也只是近似：束宽有限时仍可能错过整体最优；对开放式对话，大家更常用带温度的采样。', 'Beam search is still an approximation: with a finite width it can miss the overall best; for open-ended chat, sampling with a temperature is more common.'),
      }),
    },
    xppl: {
      n: { zh: '困惑度（perplexity）', en: 'Perplexity' }, t: 'T3', cat: 'llm', train: 'no', up: 'loss',
      pop: (t) => ({
        role: t('衡量语言模型“猜下一个词有多没把握”的常用指标：越低越好。', 'A common measure of how unsure a language model is about the next word: lower is better.'),
        status: t('📏 评估指标：在一段测试文本上算出来，不改模型。', '📏 An evaluation metric: computed on test text; the model is unchanged.'),
        does: [t('对文本里每个真实的下一个词，取模型给它的概率 p。', 'For each actual next word in the text, take the probability p the model gave it.'), t('困惑度 = exp(平均的 −ln p)，也就是 e 的“平均交叉熵”次方。', 'Perplexity = exp(average of −ln p), i.e. e to the power of the average cross-entropy.')],
        how: [t('下方“困惑度”实验室：拖动 4 个词的概率，看困惑度怎么变。', 'In the perplexity lab below, drag the probabilities of four words and watch the perplexity.')],
        why: t('直观含义：困惑度为 V，相当于每一步在 V 个词里平均地瞎猜。', 'Intuition: a perplexity of V is as unsure as guessing uniformly among V words at every step.'),
        eff: t('它和训练用的交叉熵损失是同一个量换了个形式，所以训练损失下降，困惑度就下降。', 'It is the training cross-entropy loss in another form, so as training loss falls, perplexity falls.'),
        lim: t('只能在同一个分词器、同一份测试文本上比较；分词不同，数字不能直接比。困惑度低也不等于回答更有用。', 'Only comparable with the same tokenizer and test text; different tokenizers make the numbers incomparable. Low perplexity does not mean more useful answers.'),
      }),
    },
    xrope: {
      n: { zh: '旋转位置编码（RoPE）', en: 'Rotary position embedding (RoPE)' }, t: 'T4a', cat: 'llm', train: 'no', up: 'pos',
      pop: (t) => ({
        role: t('一种把“词在第几个位置”放进注意力的方法：按位置把 Q 和 K 转一个角度。', 'A way to put “which position is this word in” into attention: rotate Q and K by an angle that depends on position.'),
        status: t('⚙️ 固定的运算：旋转角度由公式给出，没有要训练的参数。', '⚙️ A fixed operation: the rotation angles come from a formula; nothing to train.'),
        does: [t('把向量两两分组，第 i 组在位置 m 转 m·θᵢ，θᵢ = 10000^(−2i/d)。', 'Split the vector into pairs; pair i at position m is rotated by m·θᵢ, with θᵢ = 10000^(−2i/d).'), t('Q 在位置 m、K 在位置 n 时，打分只取决于 m − n：相对距离。', 'With Q at position m and K at position n, the score depends only on m − n: the relative distance.')],
        how: [t('下方 RoPE 实验室：把两个位置同时往后挪，看分数是否不变。', 'In the RoPE lab below, shift both positions together and check that the score stays the same.')],
        why: t('“隔了几个词”往往比“在第几个词”更重要；旋转让这件事自动出现在点积里。', '“How many words apart” often matters more than “at which word”; rotation makes that appear in the dot product automatically.'),
        eff: t('RoFormer 论文的摘要说：RoPE 用旋转矩阵编码绝对位置，同时在自注意力里带上显式的相对位置依赖。', 'The RoFormer abstract says RoPE encodes absolute position with a rotation matrix while building explicit relative-position dependency into self-attention.'),
        lim: t('训练时没见过的长度上效果会变差，所以长上下文模型常要调整 θ 的底数或做插值。', 'It degrades on lengths not seen in training, so long-context models often adjust the base of θ or interpolate.'),
      }),
    },
    xpassk: {
      n: { zh: 'pass@k 评测', en: 'pass@k evaluation' }, t: 'T7', cat: 'llm', train: 'no', up: 'xeval',
      pop: (t) => ({
        role: t('代码题的常用分数：让模型答 k 次，只要有一次通过测试就算做对，问这种事发生的概率。', 'A common score for coding problems: let the model try k times; it counts as solved if any attempt passes the tests. pass@k is the chance of that.'),
        status: t('📏 评估指标：不改模型。', '📏 An evaluation metric; the model is unchanged.'),
        does: [t('每题采样 n 个答案（n ≥ k），数出通过的 c 个。', 'Sample n answers per problem (n ≥ k) and count the c that pass.'), t('无偏估计：pass@k = 1 − C(n−c, k) / C(n, k)，再对所有题取平均。', 'Unbiased estimate: pass@k = 1 − C(n−c, k) / C(n, k), averaged over problems.')],
        how: [t('下方 pass@k 实验室：改 n、c、k，对比无偏估计和“直接代入”的结果。', 'In the pass@k lab below, change n, c and k and compare the unbiased estimate with the naive plug-in.')],
        why: t('直接用 1 − (1 − c/n)^k 会系统性偏低；Chen 等人给出了上面这个无偏的算法。', 'Plugging in 1 − (1 − c/n)^k is systematically low; Chen et al. gave the unbiased estimator above.'),
        eff: t('Codex 论文：在 HumanEval 上 Codex 单次能解 28.8% 的题；每题采样 100 次时能解 70.2%。', 'Codex paper: on HumanEval, Codex solves 28.8% of problems in one try, and 70.2% with 100 samples per problem.'),
        lim: t('k 越大分数越好看，但实际使用时你得知道哪一次是对的；测试用例不全时，“通过”也不等于正确。', 'Bigger k looks better, but in practice you must know which attempt is right; with incomplete tests, “passes” does not mean correct.'),
      }),
    },
    xsched: {
      n: { zh: '学习率预热、余弦衰减与梯度裁剪', en: 'LR warmup, cosine decay and gradient clipping' }, t: 'T7', cat: 'llm', train: 'part', up: 'backprop',
      pop: (t) => ({
        role: t('大模型训练里让步子“先小、再大、最后慢慢变小”，并且不让单步更新爆掉的三件常用工具。', 'Three common tools in LLM training: steps that start small, grow, then shrink slowly, and a cap so no single update blows up.'),
        status: t('⚙️ 训练配置：是人定的规则（超参数），本身不被训练。', '⚙️ Training configuration: rules people set (hyperparameters); not learned themselves.'),
        does: [t('预热：前 W 步把学习率从 0 线性升到峰值。', 'Warmup: over the first W steps, raise the learning rate linearly from 0 to its peak.'), t('余弦衰减：之后按半个余弦从峰值降到最小值。', 'Cosine decay: then lower it from the peak to a minimum along half a cosine.'), t('梯度裁剪：梯度长度超过阈值 c 时，按比例缩到 c，方向不变。', 'Gradient clipping: if the gradient’s length exceeds a threshold c, scale it down to c, keeping its direction.')],
        how: [t('下方实验室：改预热步数，拖动当前步，再调裁剪阈值。', 'In the lab below, change the warmup length, drag the current step, then adjust the clipping threshold.')],
        why: t('刚开始参数是随机的，大步子容易冲飞；后期小步子才能稳稳落到低处。', 'At the start the weights are random and big steps can overshoot; late small steps settle into a low point.'),
        eff: t('余弦衰减出自 SGDR（Loshchilov & Hutter）；渐进预热见 Goyal 等人 2017；按范数裁剪梯度见 Pascanu 等人 2013。', 'Cosine decay comes from SGDR (Loshchilov & Hutter); gradual warmup from Goyal et al. 2017; gradient-norm clipping from Pascanu et al. 2013.'),
        lim: t('峰值、预热长度、裁剪阈值都要试出来，没有通用的最佳值；下面实验室里的数字是示意。', 'The peak, warmup length and threshold must be tuned; there is no universal best value. The lab’s numbers are illustrative.'),
      }),
    },
  },
  cards: {
    T3: (P: Page) => {
      const t = P.t;
      P.card('xDecode', 2, t('🎯 怎么挑词、怎么打分：束搜索与困惑度', '🎯 Picking words and scoring the model: beam search and perplexity'),
        `<p class="lead">${t(`模型每一步只给出“下一个词的概率”。${P.open('xbeam')}决定怎么把它们拼成句子；${P.open('xppl')}衡量这些概率准不准。`, `The model only gives next-word probabilities at each step. ${P.open('xbeam')} decides how to string them into a sentence; ${P.open('xppl')} measures how good those probabilities are.`)}</p>
${ul([t('<b>贪心</b>：每步取最可能的词。快，但可能“开局好、结局差”。', '<b>Greedy</b>: take the most likely word each step. Fast, but a good start can lead to a poor finish.'),
    t('<b>束搜索</b>：每步保留总概率最高的 k 条前缀，最后取最好的一条。', '<b>Beam search</b>: keep the k prefixes with the highest total probability each step, then take the best.'),
    t('<b>困惑度</b> = exp(平均 −ln p)。模型给真实下一个词的概率越高，困惑度越低。', '<b>Perplexity</b> = exp(average −ln p). The higher the probability given to the actual next words, the lower the perplexity.')])}
${go(P, 'labBeam', t('贪心 vs 束搜索', 'Greedy vs beam'))}${go(P, 'labPpl', t('算困惑度', 'Compute perplexity'))}
${S(P, [A.beam, A.slp])}`, { closed: true });
    },
    T4a: (P: Page) => {
      const t = P.t;
      P.card('xRope', 2, t('🌀 位置怎么进注意力：旋转位置编码 RoPE', '🌀 How position gets into attention: rotary embedding (RoPE)'),
        `<p class="lead">${t(`注意力的打分本身不知道词的先后。${P.open('xrope')}在打分前按位置把 Q、K 各转一个角度。`, `Attention scores alone don’t know word order. ${P.open('xrope')} rotates Q and K by a position-dependent angle before scoring.`)}</p>
${ul([t('第 i 组的角速度 θᵢ = 10000^(−2i/d)：前几组转得快，后几组转得慢。', 'Pair i turns at θᵢ = 10000^(−2i/d): early pairs turn fast, later pairs slowly.'),
    t('两个向量都转过之后再点积，结果只和两者的距离 m − n 有关。', 'After both vectors are rotated, their dot product depends only on the distance m − n.')])}
${go(P, 'labRope', t('验证“只看距离”', 'Check “distance only”'))}
${S(P, [A.rope])}`, { closed: true });
    },
    T7: (P: Page) => {
      const t = P.t;
      P.card('xTrainKit', 2, t('🧰 训练与评测的三个常用算式：DPO、学习率曲线、pass@k', '🧰 Three everyday formulas in training and evaluation: DPO, the LR schedule, pass@k'),
        `<p class="lead">${t(`${P.open('dpo')}、${P.open('xsched')}、${P.open('xpassk')}：都能用一行公式写清楚，下面各有一个实验室。`, `${P.open('dpo')}, ${P.open('xsched')} and ${P.open('xpassk')}: each fits in one line of maths, and each has a lab below.`)}</p>
${ul([t('<b>DPO</b>：损失 = −log σ(β[(log π<sub>θ</sub>(y<sub>w</sub>) − log π<sub>ref</sub>(y<sub>w</sub>)) − (log π<sub>θ</sub>(y<sub>l</sub>) − log π<sub>ref</sub>(y<sub>l</sub>))])。论文摘要称：只用一个简单的分类损失，就能解决标准的 RLHF 问题。', '<b>DPO</b>: loss = −log σ(β[(log π<sub>θ</sub>(y<sub>w</sub>) − log π<sub>ref</sub>(y<sub>w</sub>)) − (log π<sub>θ</sub>(y<sub>l</sub>) − log π<sub>ref</sub>(y<sub>l</sub>))]). Its abstract says it solves the standard RLHF problem with only a simple classification loss.'),
    t('<b>学习率</b>：线性预热到峰值，再余弦衰减到最小值；梯度长度超过阈值就按比例缩小。', '<b>Learning rate</b>: linear warmup to a peak, then cosine decay to a minimum; gradients longer than a threshold are scaled down.'),
    t('<b>pass@k</b> = 1 − C(n−c, k)/C(n, k)：n 次采样里有 c 次通过时，随便抽 k 次至少一次通过的概率。', '<b>pass@k</b> = 1 − C(n−c, k)/C(n, k): with c of n samples passing, the chance that k drawn at random include at least one pass.')])}
${go(P, 'labDpo', 'DPO')}${go(P, 'labSched', t('学习率曲线', 'LR schedule'))}${go(P, 'labPassK', 'pass@k')}
${S(P, [A.dpo, A.sgdr, A.warm, A.clip, A.codex])}`, { closed: true });
    },
  },
  labs: {
    T3: (P: Page) => {
      const t = P.t;
      P.lab('labBeam', t('贪心 vs 束搜索：开局最好 ≠ 整句最好', 'Greedy vs beam: the best start ≠ the best sentence'),
        t('这棵两步的“下一个词”概率树是示意；搜索过程和整句概率（各步概率相乘）是精确计算。', 'The two-step next-word probability tree is illustrative; the search and the sentence probabilities (products of step probabilities) are exact.'),
        [t('束宽 1 就是贪心解码。把束宽调大，等于同时多保留几条候选。', 'Width 1 is greedy decoding. A larger width keeps more candidates alive at once.')],
        `<div class="k-ctl">${rng('bmK', t('束宽 k', 'Beam width k'), 1, 3, 1, 1)}</div>
<div id="bmOut" class="k-out" aria-live="polite"></div>`,
        [t('k = 1：先选“猫”（0.5），整句只有 0.5 × 0.4 = 0.2。', 'k = 1: it picks “cat” (0.5) first, and the sentence ends at 0.5 × 0.4 = 0.2.'),
          t('k = 2：同时留下“狗”（0.4），“狗 叫”= 0.4 × 0.9 = 0.36 胜出。', 'k = 2: “dog” (0.4) is kept too, and “dog barks” = 0.4 × 0.9 = 0.36 wins.')]);
      P.lab('labPpl', t('困惑度：概率越准，数字越小', 'Perplexity: better probabilities, smaller number'),
        t('一句 4 个词，滑块是模型给每个真实下一个词的概率（示意）；困惑度是精确计算。', 'A 4-word sentence; each slider is the probability the model gave the actual next word (illustrative). The perplexity is exact.'),
        [t('困惑度 = exp(平均 −ln p)。一个很低的 p 会把平均拉得很高。', 'Perplexity = exp(average −ln p). One very low p drags the average up a lot.')],
        `<div class="k-ctl">${[0.9, 0.6, 0.3, 0.8].map((v, i) => rng('pp' + (i + 1), t(`第 ${i + 1} 个词的 p`, `p of word ${i + 1}`), 0.01, 1, 0.01, v)).join('')}
<p><button type="button" class="btn" id="ppU">${t('全部设为 1/4（4 选 1 瞎猜）', 'Set all to 1/4 (a blind 1-in-4 guess)')}</button></p></div>
<div id="ppOut" class="k-out" aria-live="polite"></div>`,
        [t('全部设为 1/4：困惑度正好是 4，等于“每步在 4 个词里瞎猜”。', 'Set all to 1/4: perplexity is exactly 4, like guessing among 4 words each step.'),
          t('把第 3 个词拖到 0.01，其他都是 1：困惑度约 3.16。', 'Drag word 3 to 0.01 with the others at 1: perplexity is about 3.16.')]);
    },
    T4a: (P: Page) => {
      const t = P.t;
      P.lab('labRope', t('RoPE：两个位置一起挪，分数不变', 'RoPE: shift both positions, the score stays'),
        t('4 维的 Q、K 数值是示意；旋转（θ = 1 和 0.01，即 d = 4 时的 10000^(−2i/d)）和点积是精确计算。', 'The 4-dimensional Q and K values are illustrative; the rotation (θ = 1 and 0.01, i.e. 10000^(−2i/d) for d = 4) and the dot product are exact.'),
        [t('打分只依赖 m − n：所以模型学到的是“隔几个词”，而不是“在第几个词”。', 'The score depends only on m − n, so the model learns “how far apart”, not “at which word”.')],
        `<div class="k-ctl">${rng('rpM', t('Q 的位置 m', 'Q position m'), 0, 20, 1, 5)}${rng('rpN', t('K 的位置 n', 'K position n'), 0, 20, 1, 2)}${rng('rpS', t('一起往后挪 s', 'Shift both by s'), 0, 20, 1, 0)}</div>
<div id="rpOut" class="k-out" aria-live="polite"></div>`,
        [t('只拖“一起往后挪”：两行分数始终相同。', 'Drag only the shift: the two scores stay identical.'),
          t('让 m = n：分数等于不旋转时的普通点积。', 'Set m = n: the score equals the plain, unrotated dot product.')]);
    },
    T5: (P: Page) => {
      const t = P.t;
      P.lab('labLora', t('LoRA：要训练的参数少了多少？', 'LoRA: how many fewer parameters to train?'),
        t('矩阵大小是常见的量级（示意）；参数个数是精确计算。', 'The matrix sizes are typical magnitudes (illustrative); the parameter counts are exact.'),
        [t('原权重 W 是 d × k，冻结不动；只训练 B（d × r）和 A（r × k），更新量是 BA。', 'The original d × k weight W is frozen; only B (d × r) and A (r × k) are trained, and the update is BA.')],
        `<div class="k-ctl"><label>d = <select id="loD"><option>1024</option><option selected>4096</option><option>8192</option></select></label><label>k = <select id="loK"><option>1024</option><option selected>4096</option><option>8192</option></select></label>${rng('loR', t('秩 r', 'Rank r'), 1, 64, 1, 8)}</div>
<div id="loOut" class="k-out" aria-live="polite"></div>`,
        [t('d = k = 4096、r = 8：全量 16,777,216 个，LoRA 只要 65,536 个（0.39%）。', 'd = k = 4096, r = 8: 16,777,216 in full, only 65,536 with LoRA (0.39%).'),
          t('LoRA 论文摘要：对 GPT-3 175B，可训练参数减少到约万分之一，显存需求减少到约三分之一。', 'LoRA abstract: for GPT-3 175B, trainable parameters drop by 10,000 times and GPU memory by 3 times.')]);
    },
    T7: (P: Page) => {
      const t = P.t;
      P.lab('labDpo', t('DPO：一对回答的损失怎么算', 'DPO: the loss for one pair of answers'),
        t('对数概率的变化量是示意；损失、隐式奖励和梯度权重是精确计算。', 'The log-probability changes are illustrative; the loss, implicit rewards and gradient weight are exact.'),
        [t('Δ 指“当前模型比参考模型更偏爱这个回答多少”（对数概率之差）。好回答的 Δ 比差回答的大得越多，损失越小。', 'Δ is how much more the current model favours an answer than the reference model does (a log-probability difference). The more the preferred answer’s Δ exceeds the rejected one’s, the lower the loss.')],
        `<div class="k-ctl">${rng('dpW', t('好回答的 Δ', 'Δ of preferred'), -2, 2, 0.1, 0.5)}${rng('dpL', t('差回答的 Δ', 'Δ of rejected'), -2, 2, 0.1, -0.5)}${rng('dpB', 'β', 0.1, 1, 0.1, 0.1)}</div>
<div id="dpOut" class="k-out" aria-live="polite"></div>`,
        [t('两个 Δ 相等：损失是 ln 2 ≈ 0.6931，梯度权重 0.5。', 'Equal Δs: the loss is ln 2 ≈ 0.6931 and the gradient weight is 0.5.'),
          t('把差距拉大：权重 σ(−间隔) 变小，已经分清的样本对更新的贡献变少。', 'Widen the gap: the weight σ(−margin) shrinks, so pairs already told apart contribute less to the update.')]);
      P.lab('labSched', t('学习率曲线与梯度裁剪', 'The learning-rate curve and gradient clipping'),
        t('总步数 1000、峰值 3×10⁻⁴、最小 3×10⁻⁵、梯度 (3, 4, 12) 都是示意；曲线和裁剪是精确计算。', 'The 1000 total steps, peak 3×10⁻⁴, minimum 3×10⁻⁵ and gradient (3, 4, 12) are illustrative; the curve and the clipping are exact.'),
        [t('预热：η·t/W；之后：η_min + ½(η − η_min)(1 + cos(π(t − W)/(T − W)))。', 'Warmup: η·t/W; after: η_min + ½(η − η_min)(1 + cos(π(t − W)/(T − W))).'), t('裁剪：‖g‖ > c 时 g ← g · c/‖g‖。', 'Clipping: if ‖g‖ > c then g ← g · c/‖g‖.')],
        `<div class="k-ctl">${rng('scW', t('预热步数 W', 'Warmup steps W'), 0, 300, 50, 100)}${rng('scT', t('当前步 t', 'Current step t'), 0, 1000, 10, 550)}${rng('scC', t('裁剪阈值 c', 'Clip threshold c'), 1, 20, 1, 5)}</div>
<div id="scOut" class="k-out" aria-live="polite"></div>`,
        [t('W = 100、t = 550：正好在衰减段中点，学习率 = (峰值 + 最小值)/2 = 1.65×10⁻⁴。', 'W = 100, t = 550: exactly halfway through the decay, so the rate is (peak + min)/2 = 1.65×10⁻⁴.'),
          t('梯度长度是 13：c 小于 13 时被缩短，c ≥ 13 时原样通过。', 'The gradient’s length is 13: below c = 13 it is shortened; at c ≥ 13 it passes unchanged.')]);
      P.lab('labPassK', t('pass@k：多试几次，做对的概率', 'pass@k: the chance of solving it in k tries'),
        t('n、c 是示意的采样结果；pass@k 和对比值是精确计算。', 'n and c are illustrative sampling results; pass@k and the comparison are exact.'),
        [t('无偏估计 1 − C(n−c, k)/C(n, k)：从 n 个样本里不放回地抽 k 个，全都没通过的概率再取补。', 'Unbiased estimate 1 − C(n−c, k)/C(n, k): draw k of the n samples without replacement; one minus the chance all of them fail.')],
        `<div class="k-ctl">${rng('pkN', t('每题采样数 n', 'Samples per problem n'), 1, 100, 1, 20)}${rng('pkC', t('其中通过 c', 'Passing c'), 0, 100, 1, 4)}${rng('pkK', 'k', 1, 100, 1, 5)}</div>
<div id="pkOut" class="k-out" aria-live="polite"></div>`,
        [t('n = 20、c = 4、k = 5：无偏估计 ≈ 0.7183，直接代入 1 − 0.8⁵ = 0.6723 偏低。', 'n = 20, c = 4, k = 5: the unbiased estimate is ≈ 0.7183; the plug-in 1 − 0.8⁵ = 0.6723 is low.'),
          t('让 n − c < k：至少一个通过是必然的，pass@k = 1。', 'Make n − c < k: at least one pass is certain, so pass@k = 1.')]);
    },
  },
  quiz: (t: T) => ({
    T3: [[t('束宽 k = 1 的束搜索等于什么？', 'Beam search with width k = 1 is the same as what?'),
      [t('随机采样', 'Random sampling'), t('贪心解码：每步取最可能的词', 'Greedy decoding: take the most likely word each step'), t('穷举所有句子', 'Trying every sentence'), t('温度为 2 的采样', 'Sampling at temperature 2')], 1,
      t('每步只留一条前缀，就是每步都选当前概率最高的词。', 'Keeping one prefix per step means always choosing the currently most likely word.')]],
    T4a: [[t('用了 RoPE 之后，位置 m 的 Q 和位置 n 的 K 的打分取决于什么？', 'With RoPE, what does the score between Q at position m and K at position n depend on?'),
      [t('只取决于 m', 'Only m'), t('只取决于 m − n（以及 Q、K 本身）', 'Only m − n (and Q, K themselves)'), t('只取决于句子总长', 'Only the sentence length'), t('与位置无关', 'Not on position at all')], 1,
      t('两个旋转角度之差是 (m − n)θ，所以点积只看相对距离。', 'The two rotation angles differ by (m − n)θ, so the dot product only sees relative distance.')]],
    T7: [[t('每题采样 n = 10 次、有 c = 1 次通过，pass@1 的无偏估计是多少？', 'With n = 10 samples per problem and c = 1 passing, what is the unbiased pass@1?'),
      ['0.01', '0.1', '0.5', '1'], 1,
      t('k = 1 时公式化简为 c/n = 1/10。', 'For k = 1 the formula reduces to c/n = 1/10.')]],
  }),
};
