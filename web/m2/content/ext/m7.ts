/* M7 (gap audit A10, A11, B8, B9, C2, D14): pooling and the feature hierarchy on T7 (+ labPool); autoencoders, VAEs and
   GANs on N; interpretability on T4b; other sequence architectures and mixed precision / FlashAttention on T5; A2A on T2.
   Facts are from the cited abstracts or official pages (read this session); anything illustrative is tagged 示意. */
import type { Page, T } from '../../lib';
import { dd, demo, src, ST_MODEL, ST_SYS, ul, type Ext } from './kit';

type L2 = [string, string];
const A = {
  zf: ['https://arxiv.org/abs/1311.2901', 'Zeiler & Fergus 2013, Visualizing and Understanding Convolutional Networks (arXiv 1311.2901)'] as L2,
  vae: ['https://arxiv.org/abs/1312.6114', 'Kingma & Welling 2013, Auto-Encoding Variational Bayes (arXiv 1312.6114)'] as L2,
  gan: ['https://arxiv.org/abs/1406.2661', 'Goodfellow et al. 2014, Generative Adversarial Nets (arXiv 1406.2661)'] as L2,
  probe: ['https://arxiv.org/abs/1610.01644', 'Alain & Bengio 2016, Linear classifier probes (arXiv 1610.01644)'] as L2,
  sae: ['https://arxiv.org/abs/2309.08600', 'Cunningham et al. 2023, Sparse Autoencoders Find Highly Interpretable Features in Language Models (arXiv 2309.08600)'] as L2,
  mamba: ['https://arxiv.org/abs/2312.00752', 'Gu & Dao 2023, Mamba (arXiv 2312.00752)'] as L2,
  jamba: ['https://arxiv.org/abs/2403.19887', 'Lieber et al. 2024, Jamba (arXiv 2403.19887)'] as L2,
  llada: ['https://arxiv.org/abs/2502.09992', 'Nie et al. 2025, Large Language Diffusion Models (arXiv 2502.09992)'] as L2,
  mp: ['https://arxiv.org/abs/1710.03740', 'Micikevicius et al. 2017, Mixed Precision Training (arXiv 1710.03740)'] as L2,
  bf16: ['https://arxiv.org/abs/1905.12322', 'Kalamkar et al. 2019, A Study of BFLOAT16 for Deep Learning Training (arXiv 1905.12322)'] as L2,
  fp8: ['https://arxiv.org/abs/2209.05433', 'Micikevicius et al. 2022, FP8 Formats for Deep Learning (arXiv 2209.05433)'] as L2,
  flash: ['https://arxiv.org/abs/2205.14135', 'Dao et al. 2022, FlashAttention (arXiv 2205.14135)'] as L2,
  a2a: ['https://a2a-protocol.org/latest/', 'A2A Protocol (official site)'] as L2,
  lf: ['https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents', 'Linux Foundation press release, 23 June 2025'] as L2,
};
const S = (P: Page, items: L2[]) => src(P, items);

/* A11: encoder → z → decoder, and G vs D; plain shapes, text ≥ 12px at 360 px */
const genSvg = (t: T) => {
  const box = (x: number, y: number, w: number, s: string, f: string) => `<rect x="${x}" y="${y}" width="${w}" height="34" rx="7" fill="${f}" stroke="#94a3b8"/><text x="${x + w / 2}" y="${y + 22}" text-anchor="middle" font-size="13">${s}</text>`;
  const ar = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#475569" stroke-width="1.6" marker-end="url(#xgA)"/>`;
  return `<svg class="x-fig" viewBox="0 0 340 196" role="img" aria-label="${t('自编码器与 GAN 的结构示意', 'Autoencoder and GAN structure')}"><defs><marker id="xgA" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="#475569"/></marker></defs>
<text x="4" y="14" font-size="12" font-weight="700">${t('自编码器 / VAE', 'Autoencoder / VAE')}</text>
${box(4, 24, 52, 'x', '#f1f5f9')}${ar(56, 41, 72, 41)}${box(74, 24, 78, t('编码器', 'Encoder'), '#e0e7ff')}${ar(152, 41, 168, 41)}${box(170, 24, 40, 'z', '#fef3c7')}${ar(210, 41, 226, 41)}${box(228, 24, 78, t('解码器', 'Decoder'), '#e0e7ff')}${ar(306, 41, 318, 41)}<text x="330" y="46" text-anchor="middle" font-size="13">x′</text>
<text x="190" y="76" text-anchor="middle" font-size="11" fill="#475569">${t('z 很小：逼它压缩；VAE 让 z 服从分布', 'small z forces compression; a VAE makes z a distribution')}</text>
<text x="4" y="108" font-size="12" font-weight="700">GAN</text>
${box(4, 118, 52, t('噪声 z', 'noise z'), '#fef3c7')}${ar(56, 135, 72, 135)}${box(74, 118, 92, t('生成器 G', 'Generator G'), '#dcfce7')}${ar(166, 135, 196, 150)}
${box(4, 158, 162, t('真实数据', 'Real data'), '#f1f5f9')}${ar(166, 175, 196, 162)}${box(198, 140, 100, t('判别器 D', 'Discrim. D'), '#fee2e2')}${ar(298, 157, 312, 157)}<text x="326" y="153" text-anchor="middle" font-size="11">${t('真', 'real')}</text><text x="326" y="167" text-anchor="middle" font-size="11">${t('假', 'fake')}</text>
</svg>`;
};
/* B8: one feature's activation over a short sentence (illustrative numbers) */
const featSvg = (t: T) => {
  const toks = ['I', 'don', '’', 't', 'know', 'it', '’', 's', 'fine'], act = [0.02, 0.05, 0.94, 0.1, 0.03, 0.04, 0.88, 0.12, 0.02];
  const W = 36;
  return `<svg class="x-fig" viewBox="0 0 340 104" role="img" aria-label="${t('一个特征在各个词元上的激活（示意）', 'One feature’s activation on each token (illustrative)')}">
${toks.map((s, i) => { const h = Math.round(act[i]! * 60), x = 8 + i * W; return `<rect x="${x}" y="${68 - h}" width="${W - 8}" height="${h}" rx="3" fill="${act[i]! > 0.5 ? '#f59e0b' : '#cbd5e1'}"/><text x="${x + (W - 8) / 2}" y="86" text-anchor="middle" font-size="13">${s}</text>`; }).join('')}
<text x="8" y="101" font-size="11" fill="#475569">${t('柱高 = 这个“撇号特征”的激活强度（示意）', 'bar height = how strongly the “apostrophe feature” fires (illustrative)')}</text></svg>`;
};

export const M7: Ext = {
  parts: {
    xpool: {
      n: { zh: '池化与特征层级（CNN）', en: 'Pooling and the feature hierarchy (CNN)' }, t: 'T7', cat: 'llm', train: 'part', up: 'arch',
      pop: (t) => ({
        role: t('卷积网络里把特征图“缩小、保留最强信号”的一步；层层叠起来，网络从边缘看到纹理、部件，再到整个物体。', 'The step in a convolutional network that shrinks a feature map while keeping the strongest signals; stacked up, the network goes from edges to textures, parts and whole objects.'),
        status: t('⚙️ 池化本身没有参数，是固定的运算；它前面的卷积核是训练出来的。', '⚙️ Pooling itself has no parameters; it is a fixed operation. The convolution kernels before it are learned.'),
        does: [t('最大池化：在每个小窗口里只留最大值，特征图变小。', 'Max pooling: keep only the largest value in each small window, so the feature map shrinks.'), t('一层的典型顺序：卷积 → ReLU → （可选）最大池化。', 'A typical layer: convolution → ReLU → (optional) max pooling.')],
        how: [t('下方“池化”实验室里把输入平移一格或两格，看池化后的结果变了多少。', 'In the pooling lab below, shift the input by one or two cells and see how much the pooled result changes.')],
        why: t('物体在图里挪动一点，答案不该变；缩小特征图也让后面的层看到更大的范围、算得更少。', 'An object moving slightly in the picture shouldn’t change the answer; shrinking the map also lets later layers see a wider area for less compute.'),
        eff: t('Zeiler & Fergus 把各层特征还原成图像：第 2 层是角和边缘、颜色的组合，第 3 层是纹理，第 4 层是更具体的部件（如狗脸），第 5 层是整个物体；小的平移让第 1 层变化很大，但顶层变化小得多。', 'Zeiler & Fergus projected each layer’s features back to images: layer 2 shows corners and edge/colour conjunctions, layer 3 textures, layer 4 class-specific parts (such as dog faces), and layer 5 whole objects; small translations change layer 1 a lot but the top layers much less.'),
        lim: t('最大池化不可逆，丢掉了“最大值具体在哪”的信息（论文里要记下这些位置才能还原）；挪动超过一个窗口，结果也会跟着挪。', 'Max pooling is not invertible: it discards exactly where the maximum was (the paper records those locations to reconstruct); a shift larger than a window moves the result too.'),
      }),
    },
    xgen: {
      n: { zh: '自编码器、VAE 与 GAN', en: 'Autoencoders, VAEs and GANs' }, t: 'N', cat: 'gen', train: 'yes', up: 'nNet', dn: ['vae'],
      pop: (t) => ({
        role: t('今天图像生成模型的“前传”：学会把数据压缩成少量数字，或者学会凭空造出像真的一样的样本。', 'The prequel to today’s image generators: learn to compress data into a few numbers, or learn to produce samples that look real.'),
        status: ST_MODEL(t),
        does: [t('自编码器：编码器把输入压成一个很小的 z，解码器再还原；还原得越像越好。', 'Autoencoder: an encoder squeezes the input into a small z and a decoder reconstructs it; the closer the better.'), t('VAE：编码器输出一个分布，从中采样 z = μ + σ·ε（重参数化），这样能一起用梯度训练；训练目标 = 还原误差 + 让 z 的分布贴近标准正态的 KL 项。', 'VAE: the encoder outputs a distribution and samples z = μ + σ·ε (the reparameterisation trick) so everything trains with gradients; the objective is reconstruction error plus a KL term pulling z towards a standard normal.'), t('GAN：生成器 G 从噪声造样本，判别器 D 判断真假，两者对抗训练。', 'GAN: a generator G makes samples from noise, a discriminator D judges real or fake, and the two train against each other.')],
        how: [t('想看它在今天的图像生成里扮演什么角色，下钻到多模态与生成一站的 VAE 弹窗。', 'To see its role in today’s image generation, drill down to the VAE popup on the multimodal and generation station.')],
        why: t('直接学“图像长什么样”的概率太难；压缩到少量数字、或者让两个网络互相较劲，都绕开了这个难点。', 'Learning the probability of “what images look like” directly is too hard; compressing to a few numbers, or pitting two networks against each other, sidesteps it.'),
        eff: t('GAN 论文证明：理论最优时生成分布等于真实分布，判别器处处输出 1/2；论文自己的比喻是“造假币的人对警察”。', 'The GAN paper proves that at the optimum the generated distribution equals the data distribution and the discriminator outputs 1/2 everywhere; its own analogy is counterfeiters versus police.'),
        lim: t('GAN 训练要让 G 和 D 保持同步，否则 G 会把很多不同的噪声都变成同一个样本（模式坍塌）；它也不给出明确的概率。', 'A GAN must keep G and D in sync, or G maps many noise vectors to the same sample (mode collapse); it gives no explicit probability either.'),
      }),
    },
    xinterp: {
      n: { zh: '可解释性：探针与特征', en: 'Interpretability: probes and features' }, t: 'T4b', cat: 'llm', train: 'no', up: 'act',
      pop: (t) => ({
        role: t('回答“模型内部到底学到了什么”：从中间层的数字里读出概念。', 'Answers “what has the model actually learned inside?” by reading concepts out of the numbers in its middle layers.'),
        status: t('🔍 研究工具：在训练好的模型上做分析，不改变模型本身。', '🔍 A research tool: analyses a trained model without changing it.'),
        does: [t('线性探针：在某一层的激活上单独训练一个最简单的线性分类器，看那层“读得出”什么。', 'Linear probe: train a separate simple linear classifier on one layer’s activations to see what that layer makes readable.'), t('稀疏自编码器（SAE）：把一层的激活拆成很多“特征”，每次只有少数几个亮起来，每个特征更接近一个单一概念。', 'Sparse autoencoder (SAE): break a layer’s activations into many “features”, only a few active at a time, each closer to a single concept.')],
        how: [t('探针只说明信息“在那里”，不说明模型真的用了它；要下结论还要做干预实验。', 'A probe shows information is there, not that the model uses it; conclusions need intervention experiments.')],
        why: t('单个神经元常常同时对好几种无关的东西有反应（多义性），直接看神经元很难读懂。', 'Single neurons often respond to several unrelated things (polysemanticity), so reading neurons directly is hard.'),
        eff: t('探针论文发现特征的线性可分性随层数加深而单调增加。SAE 论文学到的特征比神经元以及 PCA、ICA 等方法更好解释、更“单义”，比如一个专门响应撇号的特征。', 'The probe paper found that linear separability of features increases monotonically with depth. The SAE paper’s features were more interpretable and monosemantic than neurons, PCA or ICA, for example a feature that fires on apostrophes.'),
        lim: t('SAE 还原不完美：论文里用 SAE 的重建替换 Pythia-70M 第 2 层后，在 Pile 上的困惑度从 25 升到 40。', 'SAE reconstruction is imperfect: in the paper, swapping in the SAE’s reconstruction at layer 2 of Pythia-70M raised perplexity on the Pile from 25 to 40.'),
      }),
    },
    xssm: {
      n: { zh: '其他架构：Mamba、混合结构、扩散语言模型', en: 'Other architectures: Mamba, hybrids, diffusion LMs' }, t: 'T5', cat: 'llm', train: 'no', up: 'longctx',
      pop: (t) => ({
        role: t('Transformer 之外正在探索的序列模型：想在长文本上更省、更快，或者换一种生成方式。', 'Sequence models being explored beyond the Transformer: cheaper and faster on long text, or generating in a different way.'),
        status: ST_MODEL(t),
        does: [t('Mamba（选择性状态空间模型）：用一个固定大小的状态逐个读入词元，状态更新的参数随输入变化，能决定记住或忘掉什么。', 'Mamba (selective state-space model): reads tokens one by one into a fixed-size state whose update parameters depend on the input, so it can choose what to keep or forget.'), t('混合结构（Jamba）：Transformer 层和 Mamba 层交替，部分层再加 MoE。', 'Hybrids (Jamba): interleave Transformer and Mamba layers, adding MoE in some of them.'), t('扩散语言模型（LLaDA）：先把文字遮住，再一步步预测被遮住的词元，而不是从左到右一个个写。', 'Diffusion language models (LLaDA): mask the text, then predict the masked tokens step by step instead of writing left to right.')],
        how: [t('先看你在意什么：超长上下文的吞吐和显存，还是生成方式本身。', 'Start from what you care about: throughput and memory on very long contexts, or the generation process itself.')],
        why: t('自注意力的计算量随长度平方增长，生成时还要存 KV 缓存；固定大小的状态没有这个负担。', 'Self-attention compute grows with the square of the length, and generation needs a KV cache; a fixed-size state has neither burden.'),
        eff: t('Mamba 论文：计算随序列长度线性增长，生成吞吐约为 Transformer 的 5 倍，Mamba-3B 胜过同尺寸 Transformer、与两倍尺寸的相当。Jamba 论文：一张 80GB GPU 放得下，上下文最长测到 256K。LLaDA 论文：8B 模型在上下文学习上与 LLaMA3 8B 相当。', 'Mamba paper: compute grows linearly with length, generation throughput is about 5× a Transformer’s, and Mamba-3B beats same-size Transformers and matches ones twice its size. Jamba paper: fits on one 80 GB GPU and was tested up to 256K tokens. LLaDA paper: its 8B model is competitive with LLaMA3 8B at in-context learning.'),
        lim: t('这些都是论文结果；Mamba 论文自己也说只在较小规模上验证过，更大规模是否一样好尚待证明。', 'These are paper results; the Mamba paper itself notes it was evaluated only at smaller scales, and larger scales are unproven.'),
      }),
    },
    xprec: {
      n: { zh: '混合精度（BF16、FP8）与 FlashAttention', en: 'Mixed precision (BF16, FP8) and FlashAttention' }, t: 'T5', cat: 'infra', train: 'part', up: 'quant',
      pop: (t) => ({
        role: t('让训练和推理更快、更省显存的两类底层技巧：用更短的数字算，和更聪明地搬数据。', 'Two low-level tricks that make training and inference faster and lighter on memory: compute with shorter numbers, and move data more cleverly.'),
        status: ST_SYS(t),
        does: [t('混合精度：权重、激活、梯度用 16 位存和算，同时保留一份 32 位的主权重来累加更新；FP16 要做损失缩放防止小梯度变成 0。', 'Mixed precision: store and compute weights, activations and gradients in 16 bits while keeping a 32-bit master copy of the weights for the updates; FP16 needs loss scaling so small gradients don’t become 0.'), t('BF16：表示范围和 FP32 一样，和 FP32 互转简单，一般不用重新调超参数。', 'BF16: the same range as FP32 and simple conversion to and from it, so hyperparameters usually need no re-tuning.'), t('FP8：两种 8 位格式，E4M3（4 位指数、3 位尾数）和 E5M2（5 位指数、2 位尾数）。', 'FP8: two 8-bit formats, E4M3 (4 exponent bits, 3 mantissa bits) and E5M2 (5 exponent bits, 2 mantissa bits).'), t('FlashAttention：把注意力分块放进 GPU 片上的高速 SRAM 里算，少读写显存（HBM），结果是精确的，不是近似。', 'FlashAttention: compute attention in tiles inside the GPU’s fast on-chip SRAM, with fewer reads and writes to HBM; the result is exact, not approximate.')],
        how: [t('和本站的量化实验室对照：量化压的是存下来的数字，混合精度压的是计算时的数字。', 'Compare with the quantization lab on this station: quantization shrinks stored numbers, mixed precision shrinks the numbers used in computation.')],
        why: t('大模型训练常常卡在显存和数据搬运上，而不只是算力。', 'Large-model training is often limited by memory and data movement, not just raw compute.'),
        eff: t('混合精度论文：显存占用减少近一半。FlashAttention 论文：GPT-2（序列长 1K）训练提速 3 倍，BERT-large 端到端快 15%。FP8 论文：在多种 CNN、RNN 和 Transformer 上，不改超参数就达到 16 位训练的效果。', 'Mixed-precision paper: memory use nearly halved. FlashAttention paper: 3× faster GPT-2 training (sequence length 1K) and 15% faster end-to-end BERT-large. FP8 paper: matches 16-bit training on a range of CNNs, RNNs and Transformers without changing hyperparameters.'),
        lim: t('要硬件支持对应的数据格式；位数越少，越要注意溢出和精度损失。', 'It needs hardware support for the formats; the fewer the bits, the more care over overflow and lost precision.'),
      }),
    },
    xa2a: {
      n: { zh: 'A2A：Agent 之间的通信协议', en: 'A2A: the agent-to-agent protocol' }, t: 'T2', cat: 'agent', train: 'no', up: 'multi',
      pop: (t) => ({
        role: t('让不同团队、不同框架做的 Agent 互相发现、分派任务、交回结果。', 'Lets agents built by different teams and frameworks discover each other, delegate tasks and return results.'),
        status: ST_SYS(t),
        does: [t('MCP 管“Agent 和工具”之间；A2A 管“Agent 和 Agent”之间。官网说两者互补，不是竞争。', 'MCP covers agent-to-tool; A2A covers agent-to-agent. The official site says they are complementary, not competitors.'), t('对方 Agent 是“黑盒”：不用共享内部记忆、工具或私有逻辑也能协作。', 'The other agent stays opaque: they collaborate without sharing internal memory, tools or proprietary logic.')],
        how: [t('一个 Agent 用 MCP 装好自己的工具，再用 A2A 和别的 Agent 协作。', 'An agent uses MCP for its own tools and A2A to work with other agents.')],
        why: t('Agent 越来越多、来自不同厂商，没有共同语言就只能一对一地写对接代码。', 'As agents multiply across vendors, without a common language every pair needs its own integration code.'),
        eff: t('2025 年 6 月 23 日，Linux 基金会宣布成立 Agent2Agent 协议项目，由中立的开源基金会托管。', 'On 23 June 2025 the Linux Foundation announced the Agent2Agent protocol project, hosted by a neutral open-source foundation.'),
        lim: t('协议只解决“怎么说话”，不解决“该不该信”：跨组织的身份、权限和计费仍要另外设计。', 'A protocol settles how agents talk, not whether to trust them: identity, permissions and billing across organisations still need design.'),
      }),
    },
  },
  cards: {
    T7: (P: Page) => {
      const t = P.t;
      P.card('xPool', 2, t('🔲 池化与特征层级：从边缘到物体', '🔲 Pooling and the feature hierarchy: from edges to objects'),
        `<p class="lead">${t(`${P.open('xpool')}：卷积找特征，池化把特征图缩小，一层层叠起来越看越“整体”。`, `${P.open('xpool')}: convolutions find features, pooling shrinks the map, and stacking layers sees ever larger wholes.`)}</p>
<ol class="x-steps"><li><b>${t('卷积 + ReLU', 'Convolution + ReLU')}</b>：${t('小卷积核在图上滑动，输出“哪里有这种图案”的特征图。', 'small kernels slide over the image and output a map of where a pattern appears.')}</li>
<li><b>${t('最大池化', 'Max pooling')}</b>：${t('每个小窗口只留最大值。图变小，物体挪一点也不容易影响结果。', 'keep only the largest value per small window. The map shrinks, and small shifts matter less.')}</li>
<li><b>${t('层层叠加', 'Stack layers')}</b>：${t('Zeiler & Fergus 的可视化：第 2 层角和边缘组合 → 第 3 层纹理 → 第 4 层部件（如狗脸）→ 第 5 层整个物体。', 'Zeiler & Fergus’s visualisations: layer 2 corners and edge combinations → layer 3 textures → layer 4 parts (such as dog faces) → layer 5 whole objects.')}</li></ol>
<p>${t('他们的模型用的是 3×3、步长 2 的最大池化；下面的实验室用更简单的 2×2、步长 2。', 'Their model used 3×3 max pooling with stride 2; the lab below uses the simpler 2×2 with stride 2.')}</p>
${S(P, [A.zf])}`, { closed: true });
    },
    N: (P: Page) => {
      const t = P.t;
      P.card('xGen', 2, t('🎭 自编码器、VAE、GAN：生成模型的前传', '🎭 Autoencoders, VAEs, GANs: the prequel to generative models'),
        `<p class="lead">${t(`${P.open('xgen')}：两种思路——压缩再还原，或者两个网络对着练。`, `${P.open('xgen')}: two ideas: compress then reconstruct, or train two networks against each other.`)}</p>
${genSvg(t)}
${ul([t('<b>VAE</b>：编码器输出均值 μ 和标准差 σ，取 z = μ + σ·ε（ε 是标准正态噪声），梯度就能穿过采样。目标 = 还原误差 + 一个 KL 项，把 z 的分布拉向标准正态，于是随便采一个 z 也能解码出像样的东西。', '<b>VAE</b>: the encoder outputs a mean μ and standard deviation σ, and z = μ + σ·ε (ε is standard normal noise), so gradients pass through the sampling. The objective is reconstruction error plus a KL term pulling z towards a standard normal, so any sampled z decodes to something plausible.'),
    t('<b>GAN</b>：G 想骗过 D，D 想分清真假。理论最优时 G 的分布等于真实分布，D 只能猜 1/2。', '<b>GAN</b>: G tries to fool D, D tries to tell real from fake. At the theoretical optimum G’s distribution equals the data’s and D can only guess 1/2.'),
    t('<b>风险</b>：GAN 的 G 和 D 失去同步，G 会把很多噪声都变成同一张图（模式坍塌）。', '<b>Risk</b>: if G and D fall out of sync, G turns many noise vectors into the same image (mode collapse).')])}
${dd(P, ['T6'])}
${S(P, [A.vae, A.gan])}`, { closed: true });
    },
    T4b: (P: Page) => {
      const t = P.t;
      P.card('xInterp', 2, t('🔬 模型内部学到了什么：探针与特征', '🔬 What did the model learn inside? Probes and features'),
        `<p class="lead">${t(`${P.open('xinterp')}：神经元常常“一身多职”，要换个角度读。`, `${P.open('xinterp')}: neurons often do several jobs at once, so we read them another way.`)}</p>
${ul([t('<b>线性探针</b>：拿某一层的激活，单独训练一个线性分类器（不改原模型）。越深的层，特征越容易被线性分开。', '<b>Linear probes</b>: take one layer’s activations and train a separate linear classifier (the model is untouched). Deeper layers make features more linearly separable.'),
    t('<b>稀疏自编码器</b>：把一层的激活拆成很多特征，每次只亮少数几个。拆出来的特征比单个神经元好懂得多。', '<b>Sparse autoencoders</b>: split a layer’s activations into many features with only a few active at once. The features are far easier to read than single neurons.')])}
${featSvg(t)}
${demo(P, t('上图数值是示意；SAE 论文确实报告了一个响应撇号的特征。', 'The values above are illustrative; the SAE paper does report a feature that fires on apostrophes.'))}
${S(P, [A.probe, A.sae])}`, { closed: true });
    },
    T5: (P: Page) => {
      const t = P.t;
      P.card('xSsm', 2, t('🧬 Transformer 之外：Mamba、混合结构、扩散语言模型', '🧬 Beyond the Transformer: Mamba, hybrids, diffusion LMs'),
        `<p class="lead">${t(`${P.open('xssm')}：都还在探索中，下面是各自论文报告的结果。`, `${P.open('xssm')}: all still being explored; below are what their papers report.`)}</p>
<table class="x-mask"><thead><tr><th></th><th>${t('核心想法', 'Core idea')}</th><th>${t('论文结果', 'Paper result')}</th></tr></thead><tbody>
<tr><th>Mamba</th><td>${t('固定大小的状态，更新随输入变化', 'a fixed-size state with input-dependent updates')}</td><td>${t('长度线性；生成吞吐约 5 倍', 'linear in length; ~5× generation throughput')}</td></tr>
<tr><th>Jamba</th><td>${t('Transformer 层 + Mamba 层 + MoE', 'Transformer + Mamba layers + MoE')}</td><td>${t('单张 80GB GPU；测到 256K 上下文', 'one 80 GB GPU; tested to 256K context')}</td></tr>
<tr><th>LLaDA</th><td>${t('遮住再逐步还原，不按从左到右', 'mask then restore, not left to right')}</td><td>${t('8B 与 LLaMA3 8B 相当（上下文学习）', '8B on par with LLaMA3 8B (in-context learning)')}</td></tr></tbody></table>
${S(P, [A.mamba, A.jamba, A.llada])}`, { closed: true });
      P.card('xPrec', 2, t('⚡ 混合精度与 FlashAttention：更短的数，更少的搬运', '⚡ Mixed precision and FlashAttention: shorter numbers, less data movement'),
        `<p class="lead">${t(`${P.open('xprec')}：两招都不改模型结构，只改“怎么算”。`, `${P.open('xprec')}: neither changes the model’s structure, only how it is computed.`)}</p>
<table class="x-mask"><thead><tr><th>${t('格式', 'Format')}</th><th>${t('位数', 'Bits')}</th><th>${t('要点', 'Key point')}</th></tr></thead><tbody>
<tr><th>FP32</th><td>32</td><td>${t('主权重常用它来累加更新', 'often used for the master weights')}</td></tr>
<tr><th>FP16</th><td>16</td><td>${t('范围小，要做损失缩放', 'small range; needs loss scaling')}</td></tr>
<tr><th>BF16</th><td>16</td><td>${t('范围和 FP32 一样', 'same range as FP32')}</td></tr>
<tr><th>FP8</th><td>8</td><td>E4M3 / E5M2</td></tr></tbody></table>
${ul([t('<b>FlashAttention</b>：注意力分块算，尽量待在 GPU 片上的高速 SRAM 里，少读写显存。结果精确。论文报告 GPT-2（长 1K）训练快 3 倍。', '<b>FlashAttention</b>: compute attention in tiles that stay in the GPU’s fast on-chip SRAM, with fewer reads and writes to HBM. The result is exact. The paper reports 3× faster GPT-2 training (length 1K).')])}
${S(P, [A.mp, A.bf16, A.fp8, A.flash])}`, { closed: true });
    },
    T2: (P: Page) => {
      const t = P.t;
      P.card('xA2a', 2, t('🤝 A2A：Agent 和 Agent 怎么说话', '🤝 A2A: how agents talk to agents'),
        `<p class="lead">${t(`${P.open('xa2a')}：MCP 接工具，A2A 接别的 Agent。`, `${P.open('xa2a')}: MCP connects tools; A2A connects other agents.`)}</p>
<table class="x-mask"><thead><tr><th></th><th>MCP</th><th>A2A</th></tr></thead><tbody>
<tr><th>${t('连接谁', 'Connects')}</th><td>${t('Agent ↔ 工具、数据', 'agent ↔ tools, data')}</td><td>${t('Agent ↔ Agent', 'agent ↔ agent')}</td></tr>
<tr><th>${t('对方', 'Other side')}</th><td>${t('暴露工具说明', 'exposes tool descriptions')}</td><td>${t('黑盒，不共享内部', 'opaque; internals stay private')}</td></tr>
<tr><th>${t('典型动作', 'Typical act')}</th><td>${t('调用一个工具', 'call a tool')}</td><td>${t('发现对方、分派任务、取回结果', 'discover, delegate, collect results')}</td></tr></tbody></table>
<p>${t('治理：2025 年 6 月 23 日 Linux 基金会宣布托管 Agent2Agent 协议项目。开放标准由中立基金会托管，任何公司都能参与，不由单一厂商说了算。', 'Governance: on 23 June 2025 the Linux Foundation announced it would host the Agent2Agent protocol project. A neutral foundation hosting an open standard means any company can take part and no single vendor decides alone.')}</p>
${S(P, [A.a2a, A.lf])}`, { closed: true });
    },
  },
  labs: {
    T7: (P: Page) => {
      const t = P.t;
      P.lab('labPool', t('池化：挪一格，结果变不变？', 'Pooling: shift by one, does the result change?'),
        t('8×8 特征图里的数值是示意；池化（2×2、步长 2）和“变了多少格”是精确计算。', 'The 8×8 feature-map values are illustrative; the pooling (2×2, stride 2) and the count of changed cells are computed exactly.'),
        [t('池化窗口里只要最大值还在同一个窗口，平移就不影响输出，这是 CNN 对小位移不敏感的来源之一。', 'As long as the maximum stays in the same window, a shift doesn’t change the output: one source of a CNN’s tolerance to small shifts.')],
        `<div class="k-ctl"><label>${t('向右平移', 'Shift right by')} = <b id="plSv">0</b><input type="range" id="plS" min="0" max="2" step="1" value="0"></label></div>
<div id="plOut" class="k-out" aria-live="polite"></div>`,
        [t('平移 1 格：原图 64 格里有 18 格变了，池化后的 16 格只变了 2 格。', 'Shift by 1: 18 of the 64 input cells change, but only 2 of the 16 pooled cells.'),
          t('平移 2 格（正好一个窗口）：池化结果整体也挪了一格。池化只能容忍比窗口小的挪动。', 'Shift by 2 (exactly one window): the pooled map moves by a cell as well. Pooling only tolerates shifts smaller than the window.')]);
    },
  },
  quiz: (t: T) => ({
    N: [[t('VAE 里写成 z = μ + σ·ε 的“重参数化”，主要是为了什么？', 'What is the VAE’s reparameterisation z = μ + σ·ε mainly for?'),
      [t('让模型更小', 'To make the model smaller'), t('让梯度能穿过随机采样，用反向传播训练', 'To let gradients pass through the random sampling so backprop can train it'), t('去掉解码器', 'To remove the decoder'), t('让 z 只能取整数', 'To make z an integer')], 1,
      t('把随机性挪到与参数无关的 ε 上，μ 和 σ 就能正常求梯度。', 'Moving the randomness into ε, which has no parameters, lets μ and σ get gradients normally.')]],
    T4b: [[t('稀疏自编码器（SAE）在可解释性研究里解决的主要问题是？', 'What main problem do sparse autoencoders solve in interpretability?'),
      [t('单个神经元常对多种无关概念有反应，难以读懂', 'Single neurons respond to several unrelated concepts, which makes them hard to read'), t('模型太慢', 'The model is too slow'), t('训练数据太少', 'Too little training data'), t('分词出错', 'Tokenisation errors')], 0,
      t('SAE 把激活拆成稀疏的特征，每个特征更接近一个单一概念。', 'An SAE splits activations into sparse features, each closer to a single concept.')]],
    T5: [[t('FlashAttention 为什么快？', 'Why is FlashAttention fast?'),
      [t('它近似计算注意力，丢掉一部分精度', 'It approximates attention and loses some accuracy'), t('它分块计算，减少 GPU 显存（HBM）的读写，结果仍然精确', 'It computes in tiles and cuts reads and writes to GPU memory (HBM), and the result is still exact'), t('它删掉了一半的注意力头', 'It removes half the attention heads'), t('它只看最近 100 个词元', 'It only looks at the last 100 tokens')], 1,
      t('瓶颈常在数据搬运；FlashAttention 是精确算法，省的是 IO。', 'The bottleneck is often data movement; FlashAttention is exact and saves IO.')]],
    T2: [[t('MCP 和 A2A 的分工是？', 'How do MCP and A2A divide the work?'),
      [t('两者是竞争关系，只能选一个', 'They compete; pick one'), t('MCP 连接 Agent 与工具，A2A 连接 Agent 与 Agent', 'MCP connects agents to tools; A2A connects agents to agents'), t('A2A 只用于语音', 'A2A is only for voice'), t('MCP 用来训练模型', 'MCP is for training models')], 1,
      t('官网说两者互补：Agent 用 MCP 装工具，用 A2A 和其他 Agent 协作。', 'The official site calls them complementary: an agent uses MCP for tools and A2A to work with other agents.')]],
  }),
};
