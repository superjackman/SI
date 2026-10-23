/* M4 (gap audit B1–B5): reasoning / test-time compute, hallucination, in-context learning (T3); structured output, embeddings + reranking (T2). */
import type { Page, T } from '../../lib';
import { dd, demo, src, ST_MODEL, ST_SYS, ul, type Ext } from './kit';

const A = {
  cot: ['https://arxiv.org/abs/2201.11903', 'Wei et al. 2022, Chain-of-Thought Prompting (arXiv 2201.11903)'] as [string, string],
  sc: ['https://arxiv.org/abs/2203.11171', 'Wang et al. 2022, Self-Consistency (arXiv 2203.11171)'] as [string, string],
  r1: ['https://arxiv.org/abs/2501.12948', 'DeepSeek-AI 2025, DeepSeek-R1 (arXiv 2501.12948)'] as [string, string],
  hal: ['https://arxiv.org/abs/2509.04664', 'Kalai et al. 2025, Why Language Models Hallucinate (arXiv 2509.04664)'] as [string, string],
  rag: ['https://arxiv.org/abs/2005.11401', 'Lewis et al. 2020, Retrieval-Augmented Generation (arXiv 2005.11401)'] as [string, string],
  gpt3: ['https://arxiv.org/abs/2005.14165', 'Brown et al. 2020, Language Models are Few-Shot Learners (arXiv 2005.14165)'] as [string, string],
  guide: ['https://arxiv.org/abs/2307.09702', 'Willard & Louf 2023, Efficient Guided Generation (arXiv 2307.09702)'] as [string, string],
  tf: ['https://arxiv.org/abs/2302.04761', 'Schick et al. 2023, Toolformer (arXiv 2302.04761)'] as [string, string],
  rr: ['https://arxiv.org/abs/1901.04085', 'Nogueira & Cho 2019, Passage Re-ranking with BERT (arXiv 1901.04085)'] as [string, string],
};

const tryVote = (t: T): [string, string, string] => ['labVote', 'T3', t('🧪 多想几遍再投票（大模型）', '🧪 Think several times, then vote (LLM)')];

export const M4: Ext = {
  parts: {
    xreason: {
      n: { zh: '推理模型（先想再答）', en: 'Reasoning models (think, then answer)' }, t: 'T3', cat: 'llm', train: 'yes', dn: ['rlvr'],
      pop: (t) => ({
        role: t('回答前先生成一段“草稿式”的思考（思维链），再给最终答案；多花推理时的计算换更高的正确率。', 'Before answering, the model writes a draft-like chain of thought and then the final answer: spending more compute at inference time to get more answers right.'),
        status: ST_MODEL(t), tryit: tryVote(t),
        does: [t('把一步到位的“直接答”改成“先写中间步骤，再答”。', 'Turns a one-shot direct answer into “write the intermediate steps, then answer”.'), t('思考用的 token 也要算钱、算时间：这就是“推理时计算”（test-time compute）。', 'The thinking tokens cost money and time too: this is test-time compute.')],
        how: [t('给难题（数学、代码、多步规划）开启思考或提高思考预算；简单问答关掉，省钱省时间。', 'Turn thinking on, or raise its budget, for hard problems (maths, code, multi-step planning); turn it off for simple questions to save cost and time.'), t('想要更稳：多采样几条思路，再按最终答案投票（自洽性）。', 'For more robustness, sample several lines of reasoning and vote on the final answer (self-consistency).')],
        why: t('每生成一个 token，模型做的计算量大致固定；难题一步算不完，把中间结果写出来就等于给了它更多步计算和一块“草稿纸”。', 'Each generated token gets a roughly fixed amount of computation; a hard problem does not fit in one step, so writing intermediate results gives the model more steps and a scratchpad.'),
        eff: t('研究发现：用可自动判对错的题（数学答案、代码测试）做强化学习，模型会自己学会更长、会检查和回头修改的思考过程。', 'Research found that reinforcement learning on automatically checkable tasks (maths answers, code tests) teaches models to produce longer reasoning that checks and revises itself.'),
        lim: t('思考更长不等于一定更对；思考过程本身也可能出错或与最终答案不一致。成本和延迟随思考 token 增加。', 'Longer thinking is not automatically more correct; the reasoning itself can be wrong or not match the final answer. Cost and latency grow with thinking tokens.'),
      }),
    },
    xhalluc: {
      n: { zh: '幻觉：原因与对策', en: 'Hallucination: causes and fixes' }, t: 'T3', cat: 'llm', train: 'no', dn: ['memory'],
      pop: (t) => ({
        role: t('模型说出流畅、像真的、但其实错误或编造的内容。', 'The model says something fluent and plausible that is actually wrong or made up.'),
        status: t('⚙️ 一种现象，不是一个部件：来自训练方式和使用方式', '⚙️ A behaviour, not a component: it comes from how models are trained and used'),
        does: [t('原因①：模型学的是“像不像”，罕见事实（只出现过一次的生日、冷门论文）本来就难记准。', 'Cause 1: the model learns what text looks plausible; rare facts (a birthday seen once, an obscure paper) are inherently hard to get right.'), t('原因②：很多评测只给“答对”记分，“不知道”记 0 分，等于奖励瞎猜。', 'Cause 2: many evaluations only score correct answers and give “I don’t know” zero, which rewards guessing.')],
        how: [t('给依据：先检索再回答（RAG），要求引用来源。', 'Give it evidence: retrieve before answering (RAG) and require citations.'), t('能验证就验证：跑代码、查数据库、让另一个步骤核对。', 'Verify what can be verified: run the code, query the database, have another step check.'), t('允许并鼓励说“不确定”。', 'Allow, and reward, “I’m not sure”.')],
        why: t('生成就是按概率接龙：只要错误说法和正确说法在模型看来“差不多像”，它就可能选错，而且语气同样自信。', 'Generation is probabilistic continuation: whenever a wrong claim looks about as plausible as the right one, the model may pick it, in the same confident tone.'),
        eff: t('检索把正确事实放进上下文，引用让人能核对，验证把错误挡在输出之前，拒答则把“瞎猜”换成“承认不知道”。', 'Retrieval puts the right fact in context, citations let people check, verification catches errors before output, and refusal swaps guessing for admitting uncertainty.'),
        lim: t('这些办法只能降低幻觉，不能消除；检索到的资料本身也可能错。', 'These measures reduce hallucination; they do not eliminate it, and retrieved material can itself be wrong.'),
      }),
    },
    xicl: {
      n: { zh: '上下文学习（few-shot）', en: 'In-context learning (few-shot)' }, t: 'T3', cat: 'llm', train: 'no', dn: ['ctxwin'],
      pop: (t) => ({
        role: t('不改参数，只在提示词里放几个“输入→输出”例子，模型就能照着做新任务。', 'Without changing any parameters, put a few input→output examples in the prompt and the model follows the pattern on a new task.'),
        status: t('⚙️ 用法层：不改模型参数，例子只存在于这一次的上下文里', '⚙️ Usage layer: no parameters change; the examples live only in this request’s context'),
        does: [t('0 个例子叫 zero-shot，1 个叫 one-shot，几个叫 few-shot。', 'No examples is zero-shot, one is one-shot, a few is few-shot.'), t('例子告诉模型：任务是什么、格式长什么样、边界情况怎么处理。', 'The examples show what the task is, what the format looks like and how edge cases are handled.')],
        how: [t('例子要覆盖不同情况，格式统一，最后留一个空位让它填。', 'Make examples cover different cases with one consistent format, and end with an empty slot for it to fill.'), t('例子多了占上下文、也会被模型过度模仿；固定的大量规则更适合写成说明或做微调。', 'Many examples eat context and get over-imitated; a large fixed rule set is better written as instructions or done with fine-tuning.')],
        why: t('预训练语料里充满了“先给例子再出题”的文本，模型学会了从上下文里归纳规律并接着写。', 'Pre-training text is full of “examples first, then a new case”, so the model learned to infer a pattern from context and continue it.'),
        eff: t('GPT-3 论文系统地测了 zero / one / few-shot：模型越大，从例子里“现学”的能力越强。', 'The GPT-3 paper measured zero-, one- and few-shot systematically: larger models got better at learning from the examples on the spot.'),
        lim: t('“学到的”东西对话结束就消失；例子的顺序、措辞都会影响结果。', 'What it “learns” is gone when the request ends; the order and wording of the examples affect results.'),
      }),
    },
    xstruct: {
      n: { zh: '结构化输出与约束解码', en: 'Structured output and constrained decoding' }, t: 'T2', cat: 'agent', train: 'no', up: 'tools', dn: ['schema'],
      pop: (t) => ({
        role: t('让模型的输出严格符合某种格式（比如一段合法 JSON），程序才能直接读。', 'Makes the model’s output follow a format exactly (such as valid JSON) so a program can read it directly.'),
        status: ST_SYS(t),
        does: [t('工具调用的参数、表格抽取、分类标签，都需要机器可读的固定格式。', 'Tool-call arguments, table extraction and classification labels all need a fixed machine-readable format.'), t('约束解码：每一步只允许“按格式规则还合法”的 token，其余 token 的概率直接置 0。', 'Constrained decoding: at each step only tokens that keep the output valid under the format rules are allowed; the others get probability 0.')],
        how: [t('给出 JSON Schema 或语法，再打开服务端的结构化输出 / 约束解码选项。', 'Supply a JSON Schema or grammar and switch on the server’s structured-output / constrained-decoding option.'), t('格式保证了，内容仍要校验：字段值可能合法但错误。', 'The format is guaranteed, the content still needs checking: a field can be valid and still wrong.')],
        why: t('只靠提示词说“请输出 JSON”时，模型偶尔会漏括号、多写解释；把格式规则变成每一步的“可选 token 名单”就从根上堵住了这类错误。', 'With only “please output JSON” in the prompt, the model sometimes drops a bracket or adds commentary; turning the format into a per-step allow-list of tokens rules this out at the root.'),
        eff: t('格式规则可以编译成一个有限状态机或语法分析器：当前状态决定下一个合法 token 集合，查表就能得到掩码，额外开销很小。', 'The format can be compiled into a finite-state machine or parser: the current state determines the set of legal next tokens, a lookup gives the mask, and the overhead is small.'),
        lim: t('过严的格式会迫使模型在“想说的”和“允许说的”之间妥协，可能降低内容质量。', 'An over-strict format forces the model to compromise between what it would say and what it may say, which can lower content quality.'),
      }),
    },
    xrerank: {
      n: { zh: '嵌入召回 + 重排序', en: 'Embedding recall + reranking' }, t: 'T2', cat: 'agent', train: 'no', up: 'memory', dn: ['vemb', 'retr'],
      pop: (t) => ({
        role: t('先用嵌入向量快速捞出一批候选（召回），再用更精细的模型给候选重新排序，最后把最相关的几段交给大模型并标注出处。', 'First fetch a batch of candidates quickly with embeddings (recall), then reorder them with a finer model (rerank), and finally give the top few to the LLM with their sources.'),
        status: ST_SYS(t),
        does: [t('召回：问题和文档各自变成向量，比相似度，从海量文档里快速取前几十条。', 'Recall: the question and documents are each embedded and compared by similarity, quickly taking the top few dozen from a large collection.'), t('重排：把“问题 + 一段候选”一起读进一个交叉编码器，打一个相关度分数。', 'Rerank: a cross-encoder reads “question + one candidate” together and outputs a relevance score.')],
        how: [t('召回取多一些（比如几十条），重排后只留最前面几条进上下文。', 'Recall generously (say a few dozen), then keep only the top few after reranking.'), t('回答时要求标注引用了哪一段，方便核对。', 'Ask the answer to cite which passage it used, so it can be checked.')],
        why: t('嵌入模型把问题和文档分开编码，可以提前算好、检索极快，但看不到两者之间逐词的对应；交叉编码器一起读，判断准，但每对都要现算，只能用在少量候选上。', 'An embedding model encodes question and document separately, so documents can be pre-computed and search is very fast, but it cannot see word-by-word matches between the two; a cross-encoder reads them together and judges better, but must run per pair, so it only fits a small candidate set.'),
        eff: t('两段式把“快”和“准”拆给两个模型：粗筛保证不漏，精排保证靠前的真的相关。', 'The two stages split speed and accuracy between two models: the coarse pass avoids missing things, the fine pass makes the top results truly relevant.'),
        lim: t('召回阶段漏掉的文档，重排也救不回来；切块方式会直接影响两步的效果。', 'A document missed at recall cannot be rescued by reranking; how the text is chunked directly affects both stages.'),
      }),
    },
  },
  cards: {
    T3: (P: Page) => {
      const t = P.t;
      P.card('xReason', 2, t('🤔 推理模型：先想再答，用“推理时计算”换正确率', '🤔 Reasoning models: think before answering, trading test-time compute for accuracy'),
        `<p class="lead">${t(`${P.open('xreason')}在给答案前先写一段思考。两种方式对比：`, `A ${P.open('xreason')} writes out its thinking before the answer. Compare the two modes:`)}</p>
${ul([t('<b>直接答</b>：问题 → 答案。快、便宜，适合查事实、改写、闲聊。', '<b>Direct</b>: question → answer. Fast and cheap; fine for facts, rewriting, chat.'),
    t('<b>先想再答</b>：问题 → 草稿（中间步骤、检查、回头改）→ 答案。慢、费 token，但多步数学、代码、规划明显更准。', '<b>Think first</b>: question → draft (intermediate steps, checks, revisions) → answer. Slower and uses more tokens, but clearly better on multi-step maths, code and planning.')])}
<p>${t('为什么有效：每生成一个 token，模型的计算量大致固定；把中间结果写出来，等于给难题更多步计算和一块草稿纸。最早的做法是在提示词里给“带步骤的例子”（思维链提示）；后来用可自动判对错的题做强化学习，让模型自己学会长而会自查的思考，这就是 T7 里的“可验证奖励”。', 'Why it works: each generated token gets a roughly fixed amount of computation; writing intermediate results gives a hard problem more steps and a scratchpad. It started as prompting with worked examples (chain-of-thought prompting); later, reinforcement learning on automatically checkable problems taught models long, self-checking reasoning on their own: the “verifiable rewards” in T7.')}</p>
<p>${t('另一种花推理时计算的方法：同一题采样多条思路，按最终答案投票（自洽性）。下面的实验室可以算出投票到底有多大用，以及什么时候反而有害。', 'Another way to spend test-time compute: sample several lines of reasoning for the same question and vote on the final answer (self-consistency). The lab below computes how much voting helps, and when it hurts.')}</p>
${dd(P, ['T7'])}${src(P, [A.cot, A.sc, A.r1])}`, { closed: true });
      P.card('xHalluc', 2, t('🫥 幻觉：为什么会一本正经地说错，以及怎么压住它', '🫥 Hallucination: why models confidently say wrong things, and how to curb it'),
        `<p class="lead">${t(`${P.open('xhalluc')}不是偶然的“故障”，而是接龙生成的自然结果。`, `${P.open('xhalluc')} is not a random glitch; it follows naturally from generation by continuation.`)}</p>
${ul([t('<b>学的时候</b>：只出现过一两次的事实（某人的生日、冷门论文的标题）本来就记不准，模型只能挑一个“看起来像”的。', '<b>In training</b>: facts seen only once or twice (someone’s birthday, an obscure paper’s title) can’t be learned reliably, so the model picks something that looks right.'),
    t('<b>考的时候</b>：很多评测“答对得分、说不知道得 0 分”，这和学生考试一样鼓励瞎猜。', '<b>In evaluation</b>: many benchmarks score “correct = point, I don’t know = zero”, which, like a student’s exam, rewards guessing.')])}
<p><b>${t('四种对策，按“把错误挡在哪里”排列：', 'Four fixes, by where they stop the error:')}</b></p>
${ul([t('① 检索（RAG）：先查资料放进上下文，让答案有依据。', '1. Retrieval (RAG): put looked-up material in context so the answer has a basis.'),
    t('② 引用：要求标出用了哪一段，读者能核对。', '2. Citation: require it to mark which passage it used, so readers can check.'),
    t('③ 验证：跑代码、查数据库、另起一步核对，再输出。', '3. Verification: run the code, query the database or add a checking step before output.'),
    t('④ 拒答：允许并奖励“我不确定”。', '4. Refusal: allow, and reward, “I’m not sure”.')])}
<p>${t(`这些只能降低、不能消除幻觉。检索怎么做见 Agent 站的 ${P.open('memory')}。`, `These reduce hallucination; they don’t eliminate it. For how retrieval works, see ${P.open('memory')} on the Agent stop.`)}</p>
${dd(P, ['T2'])}${src(P, [A.hal, A.rag])}`, { closed: true });
      P.card('xIcl', 2, t('📎 上下文学习：在提示词里放几个例子，它就会了', '📎 In-context learning: put a few examples in the prompt and it picks the task up'),
        `<p class="lead">${t(`${P.open('xicl')}：参数一个都不改，例子只活在这一次的${P.open('ctxwin')}里。`, `${P.open('xicl')}: not a single parameter changes; the examples live only in this request’s ${P.open('ctxwin')}.`)}</p>
<div class="m-code"><code>${t('苹果 → 水果<br>菠菜 → 蔬菜<br>香蕉 → 水果<br>黄瓜 → ', 'apple → fruit<br>spinach → vegetable<br>banana → fruit<br>cucumber → ')}</code></div>
<p>${t('三个例子之后留一个空位，模型最可能接的是“蔬菜”：它从例子里看出了任务（分类）和格式（一个词）。', 'After three examples there is an empty slot, and the most likely continuation is “vegetable”: the examples showed the task (classify) and the format (one word).')}</p>
${ul([t('zero-shot：只有说明；one-shot：一个例子；few-shot：几个例子。', 'Zero-shot: instructions only; one-shot: one example; few-shot: a few.'),
    t('什么时候改用微调：规则很多、很固定、每次都要用，例子塞不下或太贵。', 'When to fine-tune instead: the rules are many, fixed and needed every time, so examples don’t fit or cost too much.')])}
${src(P, [A.gpt3])}`, { closed: true });
    },
    T2: (P: Page) => {
      const t = P.t;
      P.card('xStruct', 2, t('🧾 结构化输出：让每个 token 都“合法”', '🧾 Structured output: keep every token legal'),
        `<p class="lead">${t(`Agent 调工具时，参数必须是程序读得懂的格式。${P.open('xstruct')}在每一步给词表盖一层“掩码”。`, `When an agent calls a tool, the arguments must be machine-readable. ${P.open('xstruct')} puts a mask over the vocabulary at every step.`)}</p>
<p>${t('例：格式要求 {"city": 字符串}，已经生成了 <code>{"city": </code>。', 'Example: the format is {"city": string}, and <code>{"city": </code> has been generated so far.')}</p>
<table class="x-mask"><tr><th>${t('候选 token', 'Candidate token')}</th><th>${t('合法？', 'Legal?')}</th></tr>
<tr><td><code>"</code></td><td>✅ ${t('字符串必须以引号开始', 'a string must start with a quote')}</td></tr>
<tr><td><code>}</code></td><td>❌ ${t('值还没写', 'the value is missing')}</td></tr>
<tr><td><code>42</code></td><td>❌ ${t('要的是字符串，不是数字', 'a string is required, not a number')}</td></tr>
<tr><td><code>${t('好的', 'Sure')}</code></td><td>❌ ${t('JSON 里不能夹解释', 'no commentary inside JSON')}</td></tr></table>
<p>${t('非法 token 的概率直接置 0，剩下的重新归一化后再采样。格式规则可以编译成有限状态机或语法分析器，每一步查一下“当前状态允许哪些 token”，开销很小。', 'Illegal tokens get probability 0, the rest are renormalised and sampled. The format can be compiled into a finite-state machine or parser; each step looks up which tokens the current state allows, at small cost.')}</p>
<p>${t(`和${P.open('schema')}的关系：说明书告诉模型“有哪些参数”，约束解码保证“写出来一定合格式”。模型本身也通过训练学会了什么时候该调用工具。`, `How it relates to the ${P.open('schema')}: the description tells the model which arguments exist, constrained decoding guarantees the output is well-formed. Models also learn in training when to call a tool at all.`)}</p>
${demo(P, t('格式合法 ≠ 内容正确：城市名仍可能写错，要另外校验。', 'Valid format ≠ correct content: the city can still be wrong, so validate it separately.'))}
${src(P, [A.guide, A.tf])}`, { closed: true });
      P.card('xRerank', 2, t('🎯 召回 → 重排 → 引用：检索的两段式', '🎯 Recall → rerank → cite: two-stage retrieval'),
        `<p class="lead">${t(`${P.open('xrerank')}：在${P.open('retr')}之后再加一道精排。`, `${P.open('xrerank')}: add a fine-ranking pass after ${P.open('retr')}.`)}</p>
<ol class="x-steps"><li><b>${t('召回', 'Recall')}</b>：${t(`问题和文档分别由${P.open('vemb')}变成向量，在向量库里比相似度，取前几十条。快，因为文档向量早就算好了。`, `the ${P.open('vemb')} turns the question and documents into vectors separately; compare similarity in the vector store and take the top few dozen. Fast, because document vectors are pre-computed.`)}</li>
<li><b>${t('重排', 'Rerank')}</b>：${t('交叉编码器把“问题 + 一段候选”拼在一起读，输出一个相关度分数，重新排序。准，因为能看到逐词对应；慢，所以只用在几十条候选上。', 'a cross-encoder reads “question + one candidate” together, outputs a relevance score and reorders. Accurate, because it sees word-by-word matches; slow, so it only runs on a few dozen candidates.')}</li>
<li><b>${t('引用', 'Cite')}</b>：${t('只把最前面几段放进上下文，要求回答标注出处。', 'only the top few passages go into the context, and the answer must cite its sources.')}</li></ol>
${demo(P, t('“几十条”“几段”是常见做法的量级，具体数字要按文档和预算调。', '“A few dozen” and “a few” are typical orders of magnitude; tune the numbers to your documents and budget.'))}
${src(P, [A.rr, A.rag])}`, { closed: true });
    },
  },
  labs: {
    T3: (P: Page) => {
      const t = P.t;
      P.lab('labVote', t('多想几遍再投票：推理时计算值不值', 'Think several times and vote: is test-time compute worth it?'),
        t('单条思路的正确率和每条的 token 数是你设的示意数字；投票后的正确率是精确计算（假设各条思路相互独立，错的都错成同一个答案，这是对投票最不利的情况）。', 'Single-chain accuracy and tokens per chain are illustrative numbers you set; the voted accuracy is computed exactly (assuming independent chains whose wrong answers all agree, the worst case for voting).'),
        [t('自洽性（多采样再投票）是最容易算清楚的一种推理时计算：成本线性增长，收益可以精确算出来。', 'Self-consistency (sample several times, then vote) is the form of test-time compute whose benefit can be computed exactly while its cost grows linearly.')],
        `<div class="k-ctl">
<label>${t('单条思路正确率 p', 'Single-chain accuracy p')} = <b id="voPv">0.6</b><input type="range" id="voP" min="0.05" max="0.95" step="0.05" value="0.6"></label>
<label>${t('采样条数 N', 'Chains N')} = <b id="voNv">5</b><input type="range" id="voN" min="1" max="31" step="2" value="5"></label>
<label>${t('每条 token 数', 'Tokens per chain')} = <b id="voLv">800</b><input type="range" id="voL" min="100" max="4000" step="100" value="800"></label></div>
<div id="voOut" class="k-out" aria-live="polite"></div>`,
        [t('p = 0.6，把 N 从 1 拉到 31：正确率一路涨，但每多一倍 token，涨幅越来越小。', 'With p = 0.6, move N from 1 to 31: accuracy keeps rising, but each doubling of tokens buys less.'),
          t('把 p 调到 0.4 再加 N：投票反而更差。多数票只会放大“多数”，模型本来就偏错时，多想几遍没用。', 'Set p to 0.4 and raise N: voting gets worse. A majority vote amplifies the majority; if the model leans wrong, thinking more times doesn’t help.'),
          t('p = 0.5 时无论 N 多大都是 0.5：投票创造不出信息。', 'At p = 0.5 the result stays 0.5 for any N: voting cannot create information.')]);
    },
  },
  quiz: (t: T) => ({
    T3: [[t('“推理时计算”（test-time compute）指的是？', 'What does “test-time compute” mean?'),
      [t('训练时多用几块 GPU', 'Using more GPUs during training'), t('回答时多花计算（更长的思考、多采样再投票）换更好的答案', 'Spending more compute when answering (longer thinking, sampling several times and voting) for better answers'), t('把模型参数调得更大', 'Making the model larger'), t('压缩模型以加速', 'Compressing the model to run faster')], 1,
      t('参数不变，花在“这一次回答”上的计算变多：写更长的思维链，或多条思路投票。', 'The parameters stay the same; more compute goes into this one answer: a longer chain of thought, or voting over several chains.')]],
    T2: [[t('检索里为什么先用嵌入召回、再用交叉编码器重排，而不是全部用交叉编码器？', 'In retrieval, why recall with embeddings first and rerank with a cross-encoder, instead of using the cross-encoder for everything?'),
      [t('交叉编码器要对每个“问题 + 文档”对现算，太慢，只适合少量候选', 'A cross-encoder must run on every question–document pair, which is too slow except for a few candidates'), t('交叉编码器不能处理中文', 'Cross-encoders can’t handle Chinese'), t('嵌入模型更准', 'Embedding models are more accurate'), t('重排是为了省存储', 'Reranking saves storage')], 0,
      t('嵌入可提前算好、检索快但粗；交叉编码器一起读、准但每对都要算。两段式各取所长。', 'Embeddings are pre-computed and fast but coarse; a cross-encoder reads both together, accurate but per pair. The two stages combine their strengths.')]],
  }),
};
