/* M6 (gap audit A6, F1–F3, G): regularisation on T7; real-time voice, document/screenshot understanding, image editing
   and video understanding on T6; copyright, privacy, AI-content labelling and regulation on T1. Facts are from the cited
   abstracts or the official texts (read this session); anything illustrative is tagged 示意. Not legal advice. */
import type { Page, T } from '../../lib';
import { demo, src, ST_MODEL, ST_SYS, ST_TRAIN, ul, type Ext } from './kit';

type L2 = [string, string];
const A = {
  drop: ['https://jmlr.org/papers/v15/srivastava14a.html', 'Srivastava et al. 2014, Dropout (JMLR 15)'] as L2,
  adamw: ['https://arxiv.org/abs/1711.05101', 'Loshchilov & Hutter 2017, Decoupled Weight Decay Regularization (arXiv 1711.05101)'] as L2,
  moshi: ['https://arxiv.org/abs/2410.00037', 'Défossez et al. 2024, Moshi (arXiv 2410.00037)'] as L2,
  whisper: ['https://arxiv.org/abs/2212.04356', 'Radford et al. 2022, Whisper (arXiv 2212.04356)'] as L2,
  donut: ['https://arxiv.org/abs/2111.15664', 'Kim et al. 2021, Donut: OCR-free Document Understanding (arXiv 2111.15664)'] as L2,
  llava: ['https://arxiv.org/abs/2304.08485', 'Liu et al. 2023, Visual Instruction Tuning / LLaVA (arXiv 2304.08485)'] as L2,
  ip2p: ['https://arxiv.org/abs/2211.09800', 'Brooks et al. 2022, InstructPix2Pix (arXiv 2211.09800)'] as L2,
  vllama: ['https://arxiv.org/abs/2306.02858', 'Zhang et al. 2023, Video-LLaMA (arXiv 2306.02858)'] as L2,
  cacGen: ['https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm', '国家网信办等 2023，《生成式人工智能服务管理暂行办法》'] as L2,
  cacLab: ['https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm', '国家网信办等 2025，《人工智能生成合成内容标识办法》'] as L2,
  pipl: ['https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm', '《中华人民共和国个人信息保护法》（网信办网站全文）'] as L2,
  eu50: ['https://artificialintelligenceact.eu/article/50/', 'EU AI Act, Article 50 (artificialintelligenceact.eu, unofficial consolidated text)'] as L2,
  usco: ['https://www.copyright.gov/ai/', 'U.S. Copyright Office, Copyright and Artificial Intelligence'] as L2,
};
const enName: Record<string, string> = {
  [A.cacGen[0]]: 'CAC et al. 2023, Interim Measures for Generative AI Services (Chinese)',
  [A.cacLab[0]]: 'CAC et al. 2025, Measures for Labelling AI-Generated Content (Chinese)',
  [A.pipl[0]]: 'Personal Information Protection Law of the PRC (Chinese full text, CAC site)',
};
const S = (P: Page, items: L2[]) => src(P, items.map(([u, n]) => [u, P.t(n, enName[u] ?? n)] as L2));

export const M6: Ext = {
  parts: {
    xreg: {
      n: { zh: '正则化：dropout、权重衰减、早停', en: 'Regularisation: dropout, weight decay, early stopping' }, t: 'T7', cat: 'trn', train: 'yes', up: 'backprop',
      pop: (t) => ({
        role: t('防止模型把训练数据“背下来”（过拟合），让它在没见过的数据上也好用。', 'Stops the model memorising its training data (overfitting) so it also works on data it has not seen.'),
        status: ST_TRAIN(t),
        does: [t('dropout：训练时随机关掉一部分神经元，逼网络不依赖某几个“搭档”。', 'Dropout: randomly switch off some units during training so the network cannot rely on particular partners.'), t('权重衰减：每一步把权重往 0 拉一点，偏好更简单的解。', 'Weight decay: pull the weights a little towards zero every step, preferring simpler solutions.'), t('早停：盯着验证集的误差，它开始上升就停下，用最好的那一版。', 'Early stopping: watch the validation error and stop when it starts rising, keeping the best checkpoint.')],
        how: [t('用 Adam 类优化器时，用“解耦”的权重衰减（AdamW），而不是把 L2 项加进损失。', 'With Adam-style optimisers, use decoupled weight decay (AdamW) rather than adding an L2 term to the loss.'), t('学习率与过拟合实验室里可以直接看到：训练误差一直降，验证误差先降后升。', 'In the learning-rate and overfitting lab you can see it directly: training error keeps falling while validation error falls and then rises.')],
        why: t('参数越多越容易记住训练集里的噪声；正则化给“记噪声”加了成本。', 'The more parameters, the easier it is to memorise noise in the training set; regularisation makes memorising noise costly.'),
        eff: t('dropout 论文在视觉、语音识别、文档分类、计算生物学上都显著减少了过拟合；AdamW 让 Adam 的泛化明显变好，权重衰减和学习率的最优值也不再互相牵制。', 'The dropout paper substantially reduced overfitting across vision, speech recognition, document classification and computational biology; AdamW clearly improved Adam’s generalisation and decoupled the best weight decay from the learning rate.'),
        lim: t('太强会欠拟合；数据量极大的预训练里过拟合相对少见，dropout 常被调小甚至关掉。', 'Too strong and the model underfits; in very large pre-training runs overfitting is less common, and dropout is often reduced or turned off.'),
      }),
    },
    xvoice: {
      n: { zh: '实时语音：级联 vs 端到端全双工', en: 'Real-time voice: cascade vs end-to-end full duplex' }, t: 'T6', cat: 'mm', train: 'no', up: 'audenc',
      pop: (t) => ({
        role: t('让 AI 像打电话一样实时对话：能边听边说、被打断、听出语气。', 'Lets an AI hold a phone-like conversation in real time: listen while speaking, be interrupted, hear tone of voice.'),
        status: ST_MODEL(t),
        does: [t('级联：语音识别 → 文字大模型 → 语音合成，三段接力。', 'Cascade: speech recognition → text LLM → speech synthesis, a three-stage relay.'), t('端到端：一个模型直接吃语音 token、吐语音 token，自己和用户的声音是两路并行的流。', 'End-to-end: one model takes speech tokens in and puts speech tokens out, with its own voice and the user’s as two parallel streams.')],
        how: [t('要可控、好调试、方便换模型：用级联。要低延迟、能插话、保留语气：用端到端。', 'For control, easy debugging and swappable models: cascade. For low latency, interruptions and preserved tone: end-to-end.')],
        why: t('级联里文字是中间层，语气、笑声等非文字信息会丢；按“轮流说话”切分，处理不了插话和重叠。', 'In a cascade, text is the middle layer, so tone, laughter and other non-verbal cues are lost; splitting into turns cannot handle interruptions or overlap.'),
        eff: t('Moshi 论文指出级联有好几秒的延迟；它是全双工的端到端语音模型，理论延迟 160 毫秒，实际约 200 毫秒。', 'The Moshi paper notes cascades add several seconds of latency; Moshi, a full-duplex end-to-end speech model, reaches 160 ms in theory and about 200 ms in practice.'),
        lim: t('端到端模型更难插入检索、工具和内容审核；级联的每一段都可以单独换成更强的模型。', 'End-to-end models make it harder to slot in retrieval, tools and moderation; each stage of a cascade can be swapped for a stronger model on its own.'),
      }),
    },
    xdoc: {
      n: { zh: '文档与截图理解（OCR、版面、表格）', en: 'Document and screenshot understanding (OCR, layout, tables)' }, t: 'T6', cat: 'mm', train: 'no', up: 'vit',
      pop: (t) => ({
        role: t('让模型读懂发票、PDF、表格和屏幕截图：不只认字，还要知道哪是标题、哪是表头、哪是按钮。', 'Lets a model read invoices, PDFs, tables and screenshots: not just the characters, but which part is a title, a header or a button.'),
        status: ST_MODEL(t),
        does: [t('传统流水线：OCR 引擎先认字和位置，再交给下游模型理解。', 'Classic pipeline: an OCR engine reads the characters and positions, then a downstream model interprets them.'), t('免 OCR：视觉编码器直接看整页图片，输出结构化结果（如 JSON）。', 'OCR-free: a vision encoder looks at the whole page image and outputs a structured result (such as JSON).'), t('多模态大模型：图片切块 → 视觉编码 → 投影进语言模型，直接按指令回答。', 'Multimodal LLMs: image patches → vision encoder → projected into the language model, which answers the instruction directly.')],
        how: [t('长文档先按页处理；表格让模型输出 Markdown 或 JSON，再用代码核对合计。', 'Process long documents page by page; ask for tables as Markdown or JSON and check totals with code.'), t('电脑操作 Agent 看截图找按钮，靠的也是这种能力。', 'Computer-use agents rely on this same skill to find buttons in screenshots.')],
        why: t('先 OCR 再理解，会有额外开销，换语言、换版式不灵活，OCR 的错误还会一路传下去。', 'OCR-then-understand adds cost, adapts poorly to new languages and layouts, and propagates OCR errors downstream.'),
        eff: t('Donut 论文用一个不依赖 OCR 的 Transformer 直接读文档图片，在多个文档理解任务上达到当时最好的水平。', 'The Donut paper read document images with a Transformer that needs no OCR and reached state-of-the-art results on several document-understanding tasks.'),
        lim: t('小字、手写、模糊截图仍容易认错；数字一定要复核。', 'Small print, handwriting and blurry screenshots are still misread; always double-check numbers.'),
      }),
    },
    xedit: {
      n: { zh: '图像编辑与视频理解', en: 'Image editing and video understanding' }, t: 'T6', cat: 'gen', train: 'no', up: 'gimg',
      pop: (t) => ({
        role: t('按一句话改图（“把天空换成晚霞”），以及看懂一段视频在发生什么。', 'Edits an image from one sentence (“make the sky a sunset”), and understands what is happening in a video.'),
        status: ST_MODEL(t),
        does: [t('图像编辑：扩散模型同时以原图和文字指令为条件，生成修改后的图。', 'Image editing: a diffusion model is conditioned on both the original image and the text instruction and generates the edited image.'), t('视频理解：把若干帧编码后按时间顺序交给语言模型，有的还同时听音轨。', 'Video understanding: encode a set of frames, hand them to the language model in time order, and sometimes the audio track as well.')],
        how: [t('编辑时一次只改一件事，改完对比原图；视频问答时问清时间段，比如“第 2 分钟发生了什么”。', 'Edit one thing at a time and compare with the original; for video questions, name the time range, such as “what happens in minute 2”.')],
        why: t('用户想要的往往是“在原图上改一点”，从零生成很难保住其余部分。', 'Users usually want a small change to an existing image; generating from scratch rarely preserves the rest.'),
        eff: t('InstructPix2Pix 用语言模型和文生图模型合成大量“原图—指令—结果”样例来训练，推理时一次前向就能改完，只要几秒，不需要逐张微调。', 'InstructPix2Pix trained on a large set of image–instruction–result examples synthesised with a language model and a text-to-image model; at inference it edits in one forward pass, in seconds, with no per-image fine-tuning.'),
        lim: t('视频只能抽帧看，帧之间的细节会漏；编辑可能顺手改了不该改的地方。', 'Video is seen through sampled frames, so details between frames are missed; edits can change things they should have left alone.'),
      }),
    },
    xcomply: {
      n: { zh: '合规：版权、隐私、AI 内容标识', en: 'Compliance: copyright, privacy, AI-content labelling' }, t: 'T1', cat: 'infra', train: 'no', up: 'app',
      pop: (t) => ({
        role: t('用 AI 生成和发布内容时要守的规则：训练数据和输出的版权、个人信息保护、给 AI 生成内容加标识。', 'The rules for generating and publishing with AI: copyright in training data and outputs, personal-information protection, and labelling AI-generated content.'),
        status: ST_SYS(t),
        does: [t('标识：国内《人工智能生成合成内容标识办法》要求显式标识（用户能直接看到或听到的提示）和隐式标识（写进文件元数据的信息），2025 年 9 月 1 日起施行。', 'Labelling: China’s Measures for Labelling AI-Generated Content require explicit labels (notices users can see or hear) and implicit labels (information written into file metadata), in force since 1 September 2025.'), t('隐私：《个人信息保护法》要求目的明确、最小必要；处理敏感个人信息要单独同意。', 'Privacy: the Personal Information Protection Law requires a clear purpose and minimum necessary collection; sensitive personal information needs separate consent.'), t('版权：国内暂行办法要求训练数据有合法来源、不得侵害知识产权；生成内容能否受版权保护，各地仍在形成规则。', 'Copyright: China’s interim measures require lawfully sourced training data that does not infringe IP; whether generated output is protected is still being settled in different jurisdictions.')],
        how: [t('别把身份证号、病历、客户名单等敏感信息贴进公共 AI 服务；发布 AI 生成的图、音、视频时用平台的标识功能。', 'Don’t paste ID numbers, medical records or customer lists into public AI services; use the platform’s labelling feature when publishing AI-generated images, audio or video.')],
        why: t('AI 能低成本地大量生成以假乱真的内容，也会接触大量个人数据，规则用来保护公众和权利人。', 'AI can cheaply mass-produce convincing fakes and touches a lot of personal data; the rules protect the public and rights holders.'),
        eff: t('标识办法规定任何组织和个人不得恶意删除、篡改、伪造、隐匿标识。', 'The labelling measures forbid anyone to maliciously remove, alter, forge or hide the labels.'),
        lim: t('这里只是概览，不是法律意见；规则在快速变化，具体以官方最新文本为准。', 'This is an overview, not legal advice; the rules change quickly, so check the latest official texts.'),
      }),
    },
  },
  cards: {
    T7: (P: Page) => {
      const t = P.t;
      P.card('xReg', 2, t('🧯 正则化：别让模型把训练题背下来', '🧯 Regularisation: don’t let the model memorise the training set'),
        `<p class="lead">${t(`${P.open('xreg')}：训练误差低不等于学会了，要看没见过的数据。`, `${P.open('xreg')}: low training error doesn’t mean it learned; check on unseen data.`)}</p>
${ul([t('<b>dropout</b>：训练时随机“关掉”一部分神经元（连同它们的连接），防止神经元之间过度相互依赖；测试时用完整网络、把权重相应缩小，相当于把许多“瘦网络”平均起来。', '<b>Dropout</b>: during training, randomly drop units along with their connections so they cannot co-adapt too much; at test time use the full network with scaled-down weights, which approximates averaging many thinned networks.'),
    t('<b>权重衰减</b>：每一步把权重往 0 拉一点。对 SGD 它和 L2 正则等价，但对 Adam 不等价，所以要用“解耦”的写法：AdamW。', '<b>Weight decay</b>: pull weights a little towards zero each step. For SGD it equals L2 regularisation, but not for Adam, hence the decoupled form: AdamW.'),
    t('<b>早停</b>：验证集误差开始上升就停下，保留最好的检查点。', '<b>Early stopping</b>: stop when validation error starts to rise and keep the best checkpoint.')])}
<p>${t('在下方“学习率与过拟合”实验室里，把多项式阶数调高、看验证误差先降后升，那个拐点就是早停该停的地方。', 'In the learning-rate and overfitting lab below, raise the polynomial degree and watch validation error fall then rise: that turning point is where early stopping would stop.')}</p>
${S(P, [A.drop, A.adamw])}`, { closed: true });
    },
    T6: (P: Page) => {
      const t = P.t;
      P.card('xVoice', 2, t('🎙️ 实时语音 Agent：级联还是端到端', '🎙️ Real-time voice agents: cascade or end-to-end'),
        `<p class="lead">${t(`${P.open('xvoice')}：打电话式的对话，难点是延迟和插话。`, `${P.open('xvoice')}: in phone-style conversation, the hard parts are latency and interruptions.`)}</p>
<table class="x-mask"><thead><tr><th></th><th>${t('级联', 'Cascade')}</th><th>${t('端到端全双工', 'End-to-end full duplex')}</th></tr></thead><tbody>
<tr><th>${t('流程', 'Flow')}</th><td>${t('语音识别 → 大模型 → 语音合成', 'speech recognition → LLM → speech synthesis')}</td><td>${t('语音 token 进，语音 token 出', 'speech tokens in, speech tokens out')}</td></tr>
<tr><th>${t('延迟', 'Latency')}</th><td>${t('好几秒（论文所述）', 'several seconds (per the paper)')}</td><td>${t('Moshi：理论 160 ms，实际约 200 ms', 'Moshi: 160 ms theoretical, ~200 ms in practice')}</td></tr>
<tr><th>${t('插话 / 重叠', 'Barge-in')}</th><td>${t('要按轮次切分，处理不好', 'split into turns; handled poorly')}</td><td>${t('双方是两路并行的流', 'two parallel streams')}</td></tr>
<tr><th>${t('语气、笑声', 'Tone, laughter')}</th><td>${t('转成文字时丢失', 'lost when turned into text')}</td><td>${t('保留在语音 token 里', 'kept in the speech tokens')}</td></tr>
<tr><th>${t('可控性', 'Control')}</th><td>${t('每段可单独替换、审核', 'each stage can be swapped and checked')}</td><td>${t('更难插入工具和审核', 'harder to add tools and moderation')}</td></tr></tbody></table>
<p>${t('级联里的“耳朵”常用 Whisper 这类识别模型：它用 68 万小时多语言、多任务的数据训练，不微调就能在标准测试上接近有监督模型。', 'The “ears” of a cascade are often a recognition model such as Whisper: trained on 680,000 hours of multilingual, multitask data, it approaches supervised results on standard benchmarks with no fine-tuning.')}</p>
${S(P, [A.moshi, A.whisper])}`, { closed: true });
      P.card('xDoc', 2, t('📄 读文档和截图：OCR、版面、表格', '📄 Reading documents and screenshots: OCR, layout, tables'),
        `<p class="lead">${t(`${P.open('xdoc')}：从“认字”到“看懂这一页”。`, `${P.open('xdoc')}: from reading characters to understanding the page.`)}</p>
<ol class="x-steps"><li><b>${t('传统 OCR 流水线', 'Classic OCR pipeline')}</b>：${t('先认字和坐标，再让下游模型理解。错误会一路传下去。', 'read characters and coordinates first, then interpret downstream. Errors propagate.')}</li>
<li><b>${t('免 OCR 的文档模型', 'OCR-free document models')}</b>：${t('直接看整页图片，输出结构化结果（Donut）。', 'look at the whole page image and output a structured result (Donut).')}</li>
<li><b>${t('多模态大模型', 'Multimodal LLMs')}</b>：${t('视觉编码器 + 投影层接上语言模型，按指令回答（LLaVA 的做法）。', 'a vision encoder plus projector feeds a language model that follows instructions (the LLaVA recipe).')}</li></ol>
${ul([t('<b>表格</b>：让模型输出 Markdown 或 JSON，再用代码核对行数和合计。', '<b>Tables</b>: ask for Markdown or JSON, then check row counts and totals with code.'),
    t('<b>截图</b>：电脑操作 Agent 靠它找按钮和输入框。', '<b>Screenshots</b>: computer-use agents use it to find buttons and input boxes.'),
    t('<b>风险</b>：小字、手写、模糊图容易认错，金额和日期一定复核。', '<b>Risk</b>: small print, handwriting and blur are misread; always re-check amounts and dates.')])}
${S(P, [A.donut, A.llava])}`, { closed: true });
      P.card('xEdit', 2, t('🖌️ 按一句话改图，看懂一段视频', '🖌️ Edit an image from one sentence; understand a video'),
        `<p class="lead">${t(`${P.open('xedit')}：生成之外，“改”和“看”同样常用。`, `${P.open('xedit')}: besides generating, editing and watching are just as common.`)}</p>
${ul([t('<b>指令式图像编辑</b>：InstructPix2Pix 把原图和文字指令一起作为扩散模型的条件。训练数据由语言模型和文生图模型合成，推理时一次前向、几秒就能改完。', '<b>Instruction-based image editing</b>: InstructPix2Pix conditions a diffusion model on both the original image and the text instruction. Its training data was synthesised with a language model and a text-to-image model; at inference it edits in one forward pass, in seconds.'),
    t('<b>视频理解</b>：抽帧编码，再按时间顺序交给语言模型；Video-LLaMA 还同时接入音频，要解决“画面怎么随时间变化”和“声画怎么对齐”两个问题。', '<b>Video understanding</b>: encode sampled frames and pass them to the language model in time order; Video-LLaMA also takes in audio, tackling how scenes change over time and how sound and picture line up.'),
    t('<b>用法提示</b>：一次只改一件事；问视频时说清时间段。', '<b>Tips</b>: change one thing at a time; name the time range when asking about a video.')])}
${S(P, [A.ip2p, A.vllama])}`, { closed: true });
    },
    T1: (P: Page) => {
      const t = P.t;
      P.card('xComply', 2, t('⚖️ 用 AI 要守的规矩：版权、隐私、内容标识', '⚖️ Rules for using AI: copyright, privacy, content labels'),
        `<p class="lead">${t(`${P.open('xcomply')}：概览，不是法律意见；以官方最新文本为准。`, `${P.open('xcomply')}: an overview, not legal advice; check the latest official texts.`)}</p>
${ul([t('<b>国内总规则</b>：《生成式人工智能服务管理暂行办法》2023 年 8 月 15 日起施行，适用于向境内公众提供生成式 AI 服务；要求训练数据和基础模型来源合法、不侵害知识产权，涉及个人信息要取得同意或符合法定情形。', '<b>China’s main rules</b>: the Interim Measures for Generative AI Services took effect on 15 August 2023 and cover generative AI services offered to the public in China; training data and base models must be lawfully sourced and not infringe IP, and personal information needs consent or another legal basis.'),
    t('<b>内容标识</b>：《人工智能生成合成内容标识办法》2025 年 9 月 1 日起施行。显式标识是用户能明显感知的文字、声音、图形提示；隐式标识写在文件元数据里，包含内容属性、服务提供者名称或编码、内容编号等。用户发布生成内容时应主动声明并使用平台的标识功能。', '<b>Content labels</b>: the Measures for Labelling AI-Generated Content took effect on 1 September 2025. Explicit labels are text, sound or graphic notices users can clearly perceive; implicit labels sit in file metadata and include the content attribute, the provider’s name or code, and a content ID. Users publishing generated content should declare it and use the platform’s labelling feature.'),
    t('<b>个人信息</b>：《个人信息保护法》（2021 年 11 月 1 日起施行）要求目的明确、最小必要；敏感个人信息（如生物识别、医疗健康、金融账户、行踪轨迹）要单独同意；对个人权益有重大影响的自动化决策，个人有权要求说明。', '<b>Personal information</b>: the Personal Information Protection Law (in force since 1 November 2021) requires a clear purpose and minimum necessary collection; sensitive information (such as biometrics, health, financial accounts, whereabouts) needs separate consent; for automated decisions with a major effect on a person, they can ask for an explanation.'),
    t('<b>欧盟</b>：《人工智能法》第 50 条要求让人知道自己在和 AI 交互，生成的音频、图像、视频、文字要以机器可读的方式标记，深度伪造要披露；按第 113 条自 2026 年 8 月 2 日起适用。', '<b>EU</b>: Article 50 of the AI Act requires telling people they are interacting with an AI system, marking generated audio, image, video and text in a machine-readable way, and disclosing deep fakes; under Article 113 it applies from 2 August 2026.'),
    t('<b>版权</b>：AI 生成内容能否获得版权、用作品训练是否合理，各国仍在讨论。美国版权局分几部分发布了专题报告（数字复制品、可版权性、训练）。', '<b>Copyright</b>: whether AI output can be copyrighted, and whether training on works is permissible, is still debated. The U.S. Copyright Office has published a report in parts (digital replicas, copyrightability, training).')])}
<div class="m-code"><code>${t('[AI 生成] 本图片由人工智能生成', '[AI-generated] This image was generated by AI')}</code></div>
${demo(P, t('上面是显式标识大致的样子（示意）；具体位置和形式按办法和国家标准执行。', 'The line above shows roughly what an explicit label looks like (illustrative); exact placement and form follow the measures and national standards.'))}
${S(P, [A.cacGen, A.cacLab, A.pipl, A.eu50, A.usco])}`, { closed: true });
    },
  },
  quiz: (t: T) => ({
    T7: [[t('训练误差一直在降，验证误差却开始上升。这时最合适的做法是？', 'Training error keeps falling, but validation error has started rising. What is the best move?'),
      [t('继续训练，越久越好', 'Keep training; longer is better'), t('早停，或加强正则化（如 dropout、权重衰减）', 'Stop early, or strengthen regularisation (such as dropout or weight decay)'), t('把学习率调到最大', 'Turn the learning rate to the maximum'), t('删掉验证集', 'Delete the validation set')], 1,
      t('这是过拟合的典型信号：模型开始背训练集里的噪声。', 'This is the classic sign of overfitting: the model has started memorising noise in the training set.')]],
    T6: [[t('用户想在 AI 说话时随时插话、还希望 AI 听出语气，哪种语音方案更合适？', 'A user wants to interrupt the AI at any moment and wants it to hear tone of voice. Which voice design fits better?'),
      [t('级联：语音识别 → 大模型 → 语音合成', 'Cascade: speech recognition → LLM → speech synthesis'), t('端到端全双工语音模型', 'An end-to-end full-duplex speech model'), t('只用语音合成', 'Speech synthesis only'), t('先转成文字，再让用户打字', 'Transcribe and ask the user to type')], 1,
      t('端到端模型把双方的声音作为两路并行的流，延迟低，语气也不会在转文字时丢掉。', 'End-to-end models treat both voices as parallel streams, with low latency, and tone is not lost by converting to text.')]],
    T1: [[t('按国内的标识办法，写在图片文件元数据里、用户一般看不到的 AI 生成信息叫什么？', 'Under China’s labelling measures, what is the AI-generation information written into an image file’s metadata, usually invisible to users, called?'),
      [t('显式标识', 'An explicit label'), t('隐式标识', 'An implicit label'), t('水印广告', 'A watermark ad'), t('用户协议', 'A user agreement')], 1,
      t('显式标识是用户能明显感知的提示；隐式标识写在文件数据（如元数据）里。', 'Explicit labels are notices users can clearly perceive; implicit labels are written into the file data, such as metadata.')]],
  }),
};
