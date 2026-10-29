/* R38: the L4 explorer's words, zh / en. Knowledge-card text lives in c/k-*.json (lazy); this file holds the screen. */
export type L = 'zh' | 'en';
export type Tx = readonly [string, string];
export const tx = (x: Tx, l: L) => (l === 'en' ? x[1] : x[0]);

/** the standard decoder-only Transformer, bottom to top */
export const NODES = ['in', 'tok', 'emb', 'att', 'an1', 'ffn', 'an2', 'lin', 'sm', 'out'] as const;
export type Nd = (typeof NODES)[number];
export const isNd = (s: string): s is Nd => (NODES as readonly string[]).includes(s);
export const LAB: Record<Nd, Tx> = {
  in: ['输入文字', 'Input text'], tok: ['分词', 'Tokenize'], emb: ['词向量 ⊕ 位置编码', 'Embed ⊕ position'],
  att: ['带遮罩的多头注意力', 'Masked attention'], an1: ['加 + 归一化', 'Add + Norm'], ffn: ['前馈网络', 'Feed-forward'],
  an2: ['加 + 归一化', 'Add + Norm'], lin: ['线性层', 'Linear'], sm: ['Softmax', 'Softmax'], out: ['下一个字的概率', 'Next-char odds'],
};
/** shorter names for when the diagram is compressed to the left and the full name does not fit (same meaning) */
export const LAB_S: Partial<Record<Nd, Tx>> = {
  att: ['遮罩多头注意力', 'Masked attn'], emb: ['词向量⊕位置', 'Embed ⊕ pos'], out: ['下个字概率', 'Next odds'], in: ['输入文字', 'Input'],
  tok: ['分词', 'Tokenize'], ffn: ['前馈网络', 'Feed-fwd'], an1: ['加+归一化', 'Add+Norm'], an2: ['加+归一化', 'Add+Norm'],
};
/** boxes with a "+": tapping opens them in place */
export const PLUS: ReadonlySet<Nd> = new Set<Nd>(['tok', 'emb', 'att', 'an1', 'ffn', 'an2', 'lin', 'sm']);
export const FRAME: Tx = ['解码块 × 2', 'Decoder block × 2'];
export const FRAME2: Tx = ['解码块 · 第2遍', 'Decoder block · pass 2'];
export const RES: Tx = ['残差', 'Res.']; // vertical lane label; 'Residual' does not fit between the two lanes at 12px
/** the knowledge card for each box */
export const NODE_K: Record<Nd, string> = { in: 'K15', tok: 'K02', emb: 'K03', att: 'K06', an1: 'K09', ffn: 'K10', an2: 'K09', lin: 'K11', sm: 'K12', out: 'K12' };
/** 看数学: the L5 maths card each knowledge card leads to */
export const K_MATH: Record<string, string> = {
  K01: 'KM03', K02: 'KM01', K03: 'KM01', K04: 'KM01', K05: 'KM11', K06: 'KM03', K07: 'KM02', K08: 'KM04', K09: 'KM11',
  K10: 'KM03', K11: 'KM03', K12: 'KM04', K13: 'KM07', K14: 'KM09', K15: 'KM06',
  /* layer 3 (R39): only the cards whose idea rests on one maths card */
  KC01: 'KM06', KC04: 'KM07', KC05: 'KM05', KC08: 'KM03', KC09: 'KM04', KC10: 'KM02', KC11: 'KM04',
};
export type Info = readonly [Tx, Tx, Tx, Tx];
export const NODE_INFO: Record<Nd, Info> = {
  in: [['交给模型接着往下写的一段字', 'The text the model continues'], ['一串字：天空是什么颜色？', 'A string: 天空是什么颜色？'], ['从最底下进入，一路往上走', 'Enters at the bottom, goes up'], ['模型只做一件事：猜下一个字', 'It only guesses the next char']],
  tok: [['把字切开，换成字典编号', 'Splits text into dictionary numbers'], ['字典 + 切分规则（大模型用 BPE）', 'Dictionary + split rule (BPE in big models)'], ['编号拿去「词向量表」里查', 'The numbers look up the embedding table'], ['和训练时同一本字典，前后一致', 'Same dictionary as in training']],
  emb: [['用一串数字表示字和它的位置', 'Numbers for a char and its position'], ['词向量表 + 位置向量表', 'Embedding table + position table'], ['查出字的一行，加上位置的一行', 'Char row + position row, added'], ['注意力不分先后，要补上顺序', 'Attention ignores order; add it']],
  att: [['每个字去前面的字那里拿信息', 'Each char gathers info from earlier ones'], ['Q 提问、K 被比对、V 是内容', 'Q asks, K is matched, V is content'], ['按相关度分百分比，再混合内容', 'Relevance → percent → mix content'], ['字的意思要看上下文才能确定', 'Meaning depends on context']],
  an1: [['保住原信息，让数字不乱跑', 'Keeps the input, keeps numbers in range'], ['残差（加回输入）+ 层归一化', 'Residual add + layer norm'], ['注意力、前馈后面各跟一个', 'One after attention, one after FFN'], ['层叠多了也稳定，训练更容易', 'Deep stacks stay stable']],
  ffn: [['把每个字的信息再提炼一遍', 'Refines each char’s information'], ['放大层、激活函数、缩回层', 'Expand, activation, shrink'], ['放大 4 倍 → 去掉没用的 → 缩回', '×4 wider → drop negatives → shrink'], ['激活函数让它能学复杂规律', 'The activation allows complex rules']],
  an2: [['保住原信息，让数字不乱跑', 'Keeps the input, keeps numbers in range'], ['残差（加回输入）+ 层归一化', 'Residual add + layer norm'], ['注意力、前馈后面各跟一个', 'One after attention, one after FFN'], ['层叠多了也稳定，训练更容易', 'Deep stacks stay stable']],
  lin: [['给字典里每个字打一个原始分', 'Gives every dictionary char a raw score'], ['一张 16 × 14 的权重表', 'A 16 × 14 weight table'], ['最后一个字的 16 个数乘这张表', 'Last char’s 16 numbers × the table'], ['一次乘法就给所有字打完分', 'One multiply scores every char']],
  sm: [['把分数变成加起来 100% 的概率', 'Turns scores into odds that sum to 100%'], ['eˣ，再除以总和', 'eˣ, then divide by the sum'], ['每个分数取 eˣ，再除以总和', 'Take eˣ of each, divide by the total'], ['都变正数，高分更突出', 'All positive; high scores stand out']],
  out: [['每个字是下一个字的可能性', 'How likely each char comes next'], ['14 个百分比，加起来 100%', '14 percentages adding to 100%'], ['选最高的，接回输入再猜', 'Pick the top one, append, repeat'], ['一次一个字，循环写成整段', 'One char at a time, looping']],
};
export const UI = {
  title: ['一层层看懂 AI', 'AI, layer by layer'], sub: ['点任意一层往里看', 'Tap a layer to look inside'],
  soon: ['即将上线', 'Coming soon'], live: ['已上线', 'Live'],
  lv: [['第1层', 'Layer 1'], ['第2层', 'Layer 2'], ['第3层', 'Layer 3'], ['第4层', 'Layer 4'], ['第5层', 'Layer 5']] as Tx[],
  lvN: [['我怎么用 AI', 'How I use AI'], ['AI 助手怎么工作', 'How an AI assistant works'], ['大模型怎么得来', 'How a big model is made'], ['Transformer 内部', 'Inside a Transformer'], ['背后的数学', 'The maths behind it']] as Tx[],
  learn: ['学', 'Learn'], record: ['记', 'Record'],
  learnS: ['从第1层开始', 'Start at layer 1'], recordS: ['学习记录', 'Your record'],
  map: ['地图', 'Map'], prog: ['进度', 'Progress'], next: ['下一步', 'Next'], back: ['返回', 'Back'], home: ['首页', 'Home'],
  math: ['看数学 ›', 'See the maths ›'], kc: ['知识卡', 'Card'], kcT: ['知识卡', 'Knowledge card'], cont: ['（续）›', '(cont.) ›'], prev: ['‹ 上页', '‹ Page 1'],
  shareB: ['分享', 'Share'], close: ['关闭', 'Close'], rot: ['竖着看更清楚', 'Best in portrait'], rotS: ['请把手机转回竖屏', 'Please turn your phone upright'],
  what: ['做什么用', 'What for'], parts: ['由什么构成', 'Made of'], how: ['怎么配合', 'How it works'], why: ['为什么这么设计', 'Why so'],
  s1: ['① 名字', '① Name'], s2: ['② 用来做什么', '② What it is for'], s3: ['③ 内部由哪些部分构成', '③ What it is made of'], s4: ['④ 运行原理', '④ How it works'], s5: ['⑤ 为什么这么设计', '⑤ Why it is designed so'],
  litNote: ['亮的＝本卡讲的部分', 'Lit = what this card covers'],
  entTr: ['看它怎么训练', 'Watch it train'], entUs: ['看它怎么使用', 'Watch it answer'], entMy: ['我的训练题', 'Train your own'],
  hint0: ['点带 + 的块可就地展开', 'Tap a box with + to open it here'], hintX: ['点带 + 的块可就地展开；点左侧原图收起', 'Tap + to open; tap the left diagram to close'],
  hintX3: ['已到最底层；点「看数学」进第5层', 'The bottom; tap “See the maths” for layer 5'], hintX2: ['点黄框格子继续展开', 'Tap the gold cell to go deeper'],
  hintS: ['点「下一步」继续', 'Tap Next to go on'], up: ['‹ 上一级', '‹ Up'],
  ex: ['真实数字', 'Real numbers'], exN: ['本站模型现算', 'computed live by this site’s model'],
  load: ['模型正在训练（约 1 秒）…', 'Training the model (about 1 s)…'],
  progT: ['我的进度', 'My progress'], seen: ['看过', 'Seen'], cards: ['知识卡', 'Cards opened'],
  mapT: ['地图', 'Map'], here: ['你在这里', 'You are here'],
  trN: ['看它怎么训练', 'How it trains'], usN: ['看它怎么使用', 'How it answers'], myN: ['我的训练题', 'Train your own'], xN: ['就地下钻', 'Look inside'],
  soonP: ['这一层正在制作，先去看第4层吧。', 'This layer is being built. Try layer 4 first.'], goL4: ['去第4层', 'Go to layer 4'],
  L4: ['第4层 Transformer', 'Layer 4 Transformer'], whole: ['全貌', 'Overview'],
  topL4: ['Transformer：一堆字变成下一个字', 'Transformer: text → next char'], topTr: ['例题：天空是什么颜色？ → 蓝', 'Example: 天空是什么颜色？ → 蓝'], topMy: ['我的训练题：自己出题、训练、测试', 'Your own: write, train, test'],
  lang: ['EN', '中'], langL: ['Switch to English', '切换到中文'], end: ['结束', 'END'], other: ['其他字', 'Others'],
} satisfies Record<string, Tx | Tx[]>;
export const STEPN = {
  tr: [['①准备例题', '① Examples'], ['②建字典、分词', '② Dictionary'], ['③先随机猜一次', '③ First guess'], ['④算误差', '④ The error'], ['⑤把误差传回去', '⑤ Pass it back'], ['⑥改参数、重复很多遍', '⑥ Update, repeat']] as Tx[],
  us: [['①输入一段字', '① Input'], ['②分词', '② Tokenize'], ['③查词向量表', '③ Embedding'], ['④加位置编码', '④ Position'], ['⑤注意力', '⑤ Attention'], ['⑥前馈网络', '⑥ Feed-forward'], ['⑦第二个解码块', '⑦ Block 2'], ['⑧线性层 + Softmax', '⑧ Linear + Softmax'], ['⑨选出下一个字', '⑨ Pick a char']] as Tx[],
  my: [['①写题', '① Write'], ['②训练中', '② Training'], ['③自己测', '③ Test']] as Tx[],
};
