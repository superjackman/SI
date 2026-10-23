/* M10 (R14, the two deferred labs): labChin on T7 — the Chinchilla parametric loss and its compute-optimal split, placed
   right after the scaling-laws card; labBpe on T3 — byte-pair-encoding merges on the corpus of Algorithm 1 of Sennrich
   et al., placed right after the tokenizer lab. Both have a popup; the maths is in src/m2/zmath.ts and unit-tested.
   Constants and the corpus were re-read from the papers on 2026-10-23 (arXiv 2203.15556 v1 appendix D.2 eq. 10 and
   eq. 4; arXiv 1508.07909 Algorithm 1). */
import type { Page } from '../../lib';
import { src, type Ext } from './kit';

type L2 = [string, string];
export const A10 = {
  chin: ['https://arxiv.org/abs/2203.15556', 'Hoffmann et al. 2022, Training Compute-Optimal LLMs (arXiv 2203.15556)'] as L2,
  repl: ['https://arxiv.org/abs/2404.10102', 'Besiroglu et al. 2024, Chinchilla Scaling: A replication attempt (arXiv 2404.10102)'] as L2,
  bpe: ['https://arxiv.org/abs/1508.07909', 'Sennrich et al. 2016, Neural Machine Translation of Rare Words with Subword Units (arXiv 1508.07909)'] as L2,
};
const rng = (id: string, label: string, min: number, max: number, step: number, v: number) => `<label>${label} = <b id="${id}v">${v}</b><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;

/** labChin: inserted on T7 right after the xScale card (see M10.near) */
function labChin(P: Page) {
  const t = P.t;
  P.lab('labChin', t('Chinchilla 规模公式：给定算力，模型该多大、数据该多少', 'Chinchilla scaling: for a compute budget, how big a model and how much data'),
    t('这是论文用约 400 次训练拟合出的公式（L(N, D) 的第 3 种方法），不是对任何产品或模型的实测；损失的单位是论文数据上的 nats/token。公式和最优解是精确计算。', 'This is the formula the paper fitted to its ~400 training runs (its approach 3, a model of L(N, D)), not a measurement of any product or model; the loss is in nats per token on the paper’s data. The formula and the optimum are computed exactly.'),
    [t(`${P.open('xchin')}：L(N, D) = E + A/N<sup>α</sup> + B/D<sup>β</sup>，E = 1.69，A = 406.4，B = 410.7，α = 0.34，β = 0.28（论文附录 D.2 式 10）。`, `${P.open('xchin')}: L(N, D) = E + A/N<sup>α</sup> + B/D<sup>β</sup> with E = 1.69, A = 406.4, B = 410.7, α = 0.34, β = 0.28 (the paper’s appendix D.2, eq. 10).`),
      t('训练算力 C ≈ 6ND。在 C 固定时求 L 的最小值：N<sub>opt</sub> = G·(C/6)<sup>a</sup>，D<sub>opt</sub> = (C/6)<sup>b</sup>/G，a = β/(α+β)，b = α/(α+β)（式 4）。', 'Training compute C ≈ 6ND. Minimising L at fixed C gives N<sub>opt</sub> = G·(C/6)<sup>a</sup> and D<sub>opt</sub> = (C/6)<sup>b</sup>/G with a = β/(α+β), b = α/(α+β) (eq. 4).')],
    `<div class="k-ctl">${rng('chC', t('算力 log₁₀ C（FLOPs）', 'Compute log₁₀ C (FLOPs)'), 19, 26, 0.1, 23.8)}
<p><button type="button" class="btn" id="chG">${t('设为 Gopher 的算力 5.76×10²³', 'Use Gopher’s budget 5.76×10²³')}</button></p>
${rng('chK', t('模型大小 = 最优值 × 2^k，k', 'Model size = optimum × 2^k, k'), -4, 4, 1, 0)}</div>
<div id="chOut" class="k-out" aria-live="polite"></div>`,
    [t('点“Gopher 的算力”：公式给出约 322 亿参数、约 2.98 万亿 token、损失 ≈ 1.931。论文图 4 对同一算力给出约 400 亿，表 3（方法 1）给出 670 亿参数、1.5 万亿 token：几种方法本身就不完全一致。', 'Tap “Gopher’s budget”: the formula gives about 32.2 B parameters, about 2.98 T tokens and a loss of ≈ 1.931. For the same budget the paper’s Figure 4 projects about 40 B, and its Table 3 (approach 1) 67 B parameters on 1.5 T tokens: the methods themselves do not fully agree.'),
      t('把 k 拖到 ±4：同样的算力，模型太大（数据太少）或太小（数据太多），损失都更高。曲线的最低点就是最优解。', 'Drag k to ±4: with the same compute, a model that is too big (too little data) or too small (too much data) both give a higher loss. The lowest point of the curve is the optimum.'),
      t('算力每多 10 倍，最优参数量乘 10<sup>0.452</sup> ≈ 2.83，数据量乘 10<sup>0.548</sup> ≈ 3.53：两者差不多同步增长。', 'Each 10× more compute multiplies the optimal parameters by 10<sup>0.452</sup> ≈ 2.83 and the data by 10<sup>0.548</sup> ≈ 3.53: the two grow almost in step.')]);
}
/** labBpe: inserted on T3 right after the tokenizer lab labTok (see M10.near) */
function labBpe(P: Page) {
  const t = P.t;
  P.lab('labBpe', t('BPE 分词：一步步合并出词表', 'BPE tokenization: build a vocabulary merge by merge'),
    t('语料是论文算法 1 里的 4 个英文词和次数（low×5、lower×2、newest×6、widest×3），“_” 表示词尾（论文里写作 &lt;/w&gt;）。合并过程是精确计算，和论文的参考代码逐步一致。', 'The corpus is the four English words and counts of the paper’s Algorithm 1 (low×5, lower×2, newest×6, widest×3); “_” marks the end of a word (the paper writes &lt;/w&gt;). The merges are computed exactly and match the paper’s reference code step by step.'),
    [t(`${P.open('xbpe')}：从单个字母开始；每一步数出所有相邻两块出现的次数（乘上词频），把最多的一对合成一个新词元，加进词表。`, `${P.open('xbpe')}: start from single letters; at each step count every adjacent pair (times the word’s frequency) and merge the most frequent pair into one new token added to the vocabulary.`),
      t('次数相同时取最先出现的一对（和参考代码里 Python 的 max 一样）。切分新词时，按学到的先后顺序依次套用这些合并。', 'Ties go to the pair seen first (as Python’s max does in the reference code). To split a new word, apply the learned merges in the order they were learned.')],
    `<div class="k-ctl">${rng('bpK', t('已合并次数', 'Merges done'), 0, 10, 1, 0)}
<p class="bp-nav"><button type="button" class="btn" id="bpPrev">${t('◀ 退一步', '◀ Back')}</button><button type="button" class="btn primary" id="bpNext">${t('合并下一对 ▶', 'Next merge ▶')}</button></p>
<label>${t('输入一个英文词（只取字母）', 'Type an English word (letters only)')}<input type="text" id="bpW" value="lowest" maxlength="24" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="latin"></label></div>
<div id="bpOut" class="k-out" aria-live="polite"></div>`,
    [t('一路点“合并下一对”：前三步是 e+s、es+t、est+_，因为 newest 和 widest 一共出现 9 次。', 'Keep tapping “Next merge”: the first three are e+s, es+t, est+_, because newest and widest occur 9 times in total.'),
      t('合并 10 次后输入 lowest：切成 low | est_ 两个词元，虽然语料里从没出现过这个词。', 'After 10 merges type lowest: it splits into low | est_, two tokens, even though the word never appeared in the corpus.'),
      t('输入含 q、z 这类语料里没有的字母：它们只能保持单个字符（这里标成虚框）。真实分词器从字节开始，所以任何文字都能切。', 'Type a word with letters the corpus lacks, such as q or z: they stay single characters (dashed here). Real tokenizers start from bytes, so any text can be split.')]);
}

export const M10: Ext = {
  parts: {
    xchin: {
      n: { zh: 'Chinchilla 规模公式', en: 'Chinchilla scaling formula' }, t: 'T7', cat: 'trn', train: 'no', up: 'xscale',
      pop: (t) => ({
        role: t('一条拟合出来的公式：输入参数量 N 和训练 token 数 D，估计训练后的损失；再加上算力约束，就能算出“同样的算力，模型该多大”。', 'A fitted formula: give it the parameter count N and the training tokens D and it estimates the loss after training; add the compute constraint and it tells you how big the model should be for a budget.'),
        status: t('📐 论文拟合出的经验模型：用来规划训练，不是任何产品的实测，也不是模型里的部件。', '📐 An empirical model fitted in a paper: for planning training; not a measurement of any product and not a part of a model.'),
        tryit: ['labChin', 'T7', t('拖动算力看最优解', 'Drag the budget, see the optimum')],
        does: [t('L(N, D) = E + A/N<sup>α</sup> + B/D<sup>β</sup>：E 是数据本身的不确定性，后两项是“模型不够大”和“数据不够多”带来的额外损失。', 'L(N, D) = E + A/N<sup>α</sup> + B/D<sup>β</sup>: E is the uncertainty in the data itself; the other two terms are the extra loss from a model that is too small and from too little data.'),
          t('论文拟合值：E = 1.69，A = 406.4，B = 410.7，α = 0.34，β = 0.28。', 'The paper’s fitted values: E = 1.69, A = 406.4, B = 410.7, α = 0.34, β = 0.28.')],
        how: [t('在 C ≈ 6ND 下求最小值，得到 N<sub>opt</sub> ∝ C<sup>0.452</sup>、D<sub>opt</sub> ∝ C<sup>0.548</sup>（用这些四舍五入后的常数；论文表 2 给出 0.46 和 0.54）。', 'Minimising under C ≈ 6ND gives N<sub>opt</sub> ∝ C<sup>0.452</sup> and D<sub>opt</sub> ∝ C<sup>0.548</sup> (with these rounded constants; the paper’s Table 2 lists 0.46 and 0.54).')],
        why: t('两项额外损失一个随 N 下降、一个随 D 下降，而算力把 N×D 固定住了：把算力全给一边，另一边的损失就降不下来，所以最优点在中间。', 'One extra-loss term falls with N and the other with D, while the budget fixes N×D: give all the compute to one side and the other term stays high, so the optimum lies in between.'),
        eff: t('论文据此训练了 Chinchilla：用和 Gopher 相同的算力，700 亿参数、1.4 万亿 token，在大量任务上都比 2800 亿参数的 Gopher 好。', 'The paper used this to train Chinchilla: with Gopher’s compute, 70 B parameters on 1.4 T tokens, and it beat the 280 B Gopher on a wide range of tasks.'),
        lim: t('它只描述论文的数据和训练设置；三种方法给出的最优解并不相同。Besiroglu 等人 2024 年复现时发现这组拟合值和论文前两种方法不一致，并给出了修正。现在很多模型为了推理便宜，故意用比“最优”多得多的数据训练小模型。', 'It describes only the paper’s data and training setup, and its three methods give different optima. Besiroglu et al. 2024 tried to replicate it and found these fitted values inconsistent with the paper’s first two methods, and gave a corrected fit. Many current models deliberately train a smaller model on far more data than “optimal” to make inference cheaper.'),
      }),
    },
    xbpe: {
      n: { zh: 'BPE 字节对编码', en: 'BPE (byte-pair encoding)' }, t: 'T3', cat: 'tok', train: 'no', up: 'tokenizer',
      pop: (t) => ({
        role: t('最常见的分词器训练方法：从单个字符开始，反复把最常一起出现的两块合成一个新词元，直到词表够大。', 'The most common way to build a tokenizer: start from single characters and keep merging the pair that occurs together most often into a new token until the vocabulary is big enough.'),
        status: t('⚙️ 在训练模型之前、用语料统计一次得到的规则；模型训练时不再改变。', '⚙️ Rules computed once from a corpus before the model is trained; they do not change during model training.'),
        tryit: ['labBpe', 'T3', t('一步步合并', 'Merge step by step')],
        does: [t('学习：统计相邻两块的次数，合并最多的一对，记下这条合并规则，重复。', 'Learn: count adjacent pairs, merge the most frequent pair, record that merge rule, repeat.'),
          t('使用：把新文本拆成字符，按学到的顺序依次套用合并规则。', 'Use: split new text into characters and apply the merge rules in the order they were learned.')],
        how: [t('词表大小 = 起始字符数 + 合并次数，是人定的超参数；常见的大模型词表在几万到几十万之间。', 'Vocabulary size = number of starting characters + number of merges, a hyperparameter people choose; large models commonly use tens of thousands to a few hundred thousand.')],
        why: t('常见词变成一个词元，生僻词拆成几个常见片段：既不会有“没见过的词”，序列也不会像按字母切那么长。', 'Common words become one token and rare words split into a few common pieces: no word is ever unknown, and sequences stay much shorter than letter by letter.'),
        eff: t('Sennrich 等人把它用于神经机器翻译，用子词单元处理罕见词，在 WMT 15 英德、英俄翻译上比查词典的基线最多高 1.1 和 1.3 BLEU。', 'Sennrich et al. used it for neural machine translation, handling rare words as subword units, and improved over a dictionary back-off baseline by up to 1.1 and 1.3 BLEU on WMT 15 English→German and English→Russian.'),
        lim: t('切法只看频率，不懂意思，所以数字、中文和少见语言常被切得很碎，同样内容要花更多词元。', 'The splits follow frequency, not meaning, so numbers, Chinese and less common languages are often cut into many pieces and cost more tokens for the same content.'),
      }),
    },
  },
  cards: {},
  near: { T7: [{ after: 'xScale', f: labChin }], T3: [{ after: 'labTok', f: labBpe }] },
  quiz: () => ({}),
};
/** the line the xScale card uses to point at labChin, and the source line both labs cite */
export const chinGo = (P: Page) => `<p class="tryit"><b>${P.t('🧪 动手试试：', '🧪 Try it: ')}</b><button class="btn primary" data-sj="labChin" data-sp="T7">${P.t('Chinchilla 规模公式', 'The Chinchilla formula')}</button></p>`;
export const srcChin = (P: Page) => src(P, [A10.chin, A10.repl]);
export const srcBpe = (P: Page) => src(P, [A10.bpe]);
