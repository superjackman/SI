/* R25 station Loc · 💻 running models on your own computer. Facts checked 2026-10-24 (see /workspace/si-r25-sources.md):
   llama.cpp quantize README (bits/weight and sizes for Llama-3.1-8B; memory ≈ disk), Ollama docs (localhost:11434/v1,
   OpenAI-compatible), LM Studio home page, vLLM docs, hf-mirror.com (HF_ENDPOINT), ModelScope, OSI Open Source AI
   Definition, Qwen3-8B config.json (KV per token). Model licences are not summarised: the site points to each model page. */
import { arrow, comp, LEG, Page, svgOpen, type StationOut } from '../lib';
import { src } from './ext/kit';
import { C as CF, jump, mem, one, tb, ti, tryit, ul } from './ext/m11';

export default function Loc(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  const sid = 'svgLoc';
  let svg = svgOpen(sid, 366);
  svg += comp({ id: 'lGguf', x: 40, y: 6, w: 300, h: 56, t: t('① 下载模型文件', '① Download a model file'), s: [t('魔搭 / 镜像站，常见 GGUF 格式', 'ModelScope / mirror, often GGUF')], cat: 'use' }, L, nm('lGguf'));
  svg += arrow(sid, 'M190 62 V80');
  svg += comp({ id: 'lMem', x: 40, y: 84, w: 300, h: 56, t: t('② 装进内存 / 显存', '② Load into memory / VRAM'), s: [t('参数 × 位数 + KV 缓存', 'params × bits + KV cache')], cat: 'llm' }, L, nm('lMem'));
  svg += arrow(sid, 'M190 140 V158');
  svg += comp({ id: 'lTool', x: 40, y: 162, w: 300, h: 56, t: t('③ 运行工具', '③ A runner'), s: ['Ollama · LM Studio · llama.cpp · vLLM'], cat: 'use', fs: 14 }, L, nm('lTool'));
  svg += arrow(sid, 'M130 218 V236 H96 V250') + arrow(sid, 'M250 218 V236 H284 V250');
  svg += comp({ id: 'lHub', x: 3, y: 254, w: 182, h: 60, t: t('④ 直接聊天', '④ Chat directly'), s: [t('窗口或命令行', 'app or terminal')], cat: 'use' }, L, nm('lHub'));
  svg += comp({ id: 'aCompat', x: 195, y: 254, w: 182, h: 60, t: t('④ 本地 API', '④ A local API'), s: [t('兼容 OpenAI 格式', 'OpenAI-compatible')], cat: 'use' }, L, nm('aCompat'));
  svg += `<text x="190" y="346" text-anchor="middle" font-size="13" fill="#475569">${t('全程不出你的电脑，不按词元付费', 'Nothing leaves your computer; no per-token bill')}</text>`;
  svg += '</svg>';
  const lg = LEG(t);

  P.card('c_Loc_0', 1, t('💻 本地跑模型：模型在你自己的电脑上算', '💻 Running locally: the model computes on your own computer'), `
<p class="lead">${t('“开放权重”的模型可以把文件下载下来，在自己的电脑或服务器上运行，不用联网调别人的 API。', 'Models with “open weights” can be downloaded and run on your own computer or server, without calling someone else’s API.')}</p>
${tb([t('', ''), t('好处', 'Upside'), t('代价', 'Cost')], [
    [t('隐私', 'Privacy'), t('资料不出你的电脑', 'your data stays on your machine'), t('—', '—')],
    [t('花费', 'Money'), t('不按词元付费', 'no per-token bill'), t('要够大的内存 / 显卡，耗电', 'needs enough memory / GPU, uses power')],
    [t('能力', 'Ability'), t('可离线、可随意改设置', 'works offline; every setting is yours'), t('电脑装得下的模型，通常比云端最大的模型弱', 'models that fit on a PC are usually weaker than the largest cloud models')],
    [t('维护', 'Upkeep'), t('版本自己定', 'you choose the version'), t('下载、更新、排错都靠自己', 'you download, update and fix it yourself')],
  ])}
<ol class="pts cf-ol">
<li>${t('先看电脑：显卡显存多大？内存多大？（苹果芯片看“统一内存”）', 'Check the computer: how much VRAM? How much RAM? (Apple silicon: “unified memory”)')}</li>
<li>${t('用下面的计算器估一下：选多大的模型、哪个量化档装得下。', 'Estimate with the calculator below: which model size and quantization fit.')}</li>
<li>${t('装一个运行工具：新手选 Ollama 或 LM Studio。', 'Install a runner: beginners pick Ollama or LM Studio.')}</li>
<li>${t('下载模型（国内可用魔搭或镜像站），运行、聊天。', 'Download a model (ModelScope or a mirror work in China), run it, chat.')}</li>
<li>${t('要接进程序：用工具提供的本地兼容接口，代码和调云端 API 几乎一样。', 'To use it from code: call the runner’s local compatible API; the code is almost the same as for a cloud API.')}</li>
</ol>
${tryit(P, jump(P, 'labMem', 'Loc', t('🧪 装得下吗', '🧪 Will it fit?'), true), jump(P, 'c_Loc_2', 'Loc', t('🧰 选工具', '🧰 Pick a runner')), jump(P, 'c_Uc_5', 'Uc', t('在 Agent 工具里接本地模型', 'Local models inside agent tools')))}`, { h2: true });

  P.card('c_Loc_1', 2, t('🧮 装得下吗：内存怎么估', '🧮 Will it fit: estimating memory'), `
<p>${t('模型运行时要占的内存，主要是两块：', 'A running model needs memory for two main things:')}</p>
${ul([
    t('<b>权重</b> ≈ 参数个数 × 每个参数用几位 ÷ 8（得到字节数）。“8B”就是 80 亿个参数；8 位 = 1 字节。', '<b>Weights</b> ≈ number of parameters × bits per parameter ÷ 8 (gives bytes). “8B” means 8 billion parameters; 8 bits = 1 byte.'),
    t('<b>KV 缓存</b>：模型记住前文用的“草稿纸”，<b>对话越长越大</b>。以 Qwen3-8B 为例（36 层 × 8 个 KV 头 × 128，16 位），每个词元约 144 KiB，32K 词元约 4.8 GB。', '<b>KV cache</b>: the model’s “scratch paper” for earlier text; <b>it grows with the conversation</b>. For Qwen3-8B (36 layers × 8 KV heads × 128, 16-bit), about 144 KiB per token, about 4.8 GB at 32K tokens.'),
    t('另外还要给运行工具和系统本身留出余量。', 'Leave some room too for the runner and the operating system.'),
  ])}
${tb([t('Llama-3.1-8B', 'Llama-3.1-8B'), t('每个参数', 'Bits per weight'), t('文件大小', 'File size')], [
    ['F16', '16', '14.96 GiB'],
    ['Q8_0', '8.50', '7.95 GiB'],
    ['Q4_K_M', '4.89', '4.58 GiB'],
  ])}
<p class="tag-note">${t('表中数字来自 llama.cpp 量化说明；GiB 是按 1024 进位的 GB，1 GiB ≈ 1.07 GB。', 'Figures from the llama.cpp quantization README; GiB counts in 1024s, 1 GiB ≈ 1.07 GB.')}</p>
${tb([t('内存类型', 'Memory type'), t('是什么', 'What it is'), t('跑模型时', 'For models')], [
    [t('显存（VRAM）', 'VRAM'), t('独立显卡上的内存', 'memory on a graphics card'), t('最快；模型放得进显存最好', 'fastest; best if the model fits here')],
    [t('内存（RAM）', 'RAM'), t('电脑主板上的内存', 'the computer’s main memory'), t('放得下也能跑，但用 CPU 算会慢很多；工具也可以一部分放显存、一部分放内存', 'works if it fits, but much slower on the CPU; runners can also split between VRAM and RAM')],
    [t('统一内存', 'Unified memory'), t('苹果芯片里 CPU 和 GPU 共用的一块', 'shared by CPU and GPU on Apple silicon'), t('GPU 能直接用；但系统和其他程序也要占一部分', 'the GPU can use it directly, but the system and apps need part of it')],
  ])}
${tryit(P, jump(P, 'labMem', 'Loc', t('🧪 内存计算器', '🧪 Memory calculator'), true), jump(P, 'quantCard', 'T5', t('量化原理', 'How quantization works')), jump(P, 'attnVCard', 'T5', t('KV 缓存原理', 'How the KV cache works')), jump(P, 'labKv', 'T5', t('显存计算器（原理版）', 'VRAM calculator (theory)')))}
${src(P, [['https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md', 'llama.cpp quantize README'], ['https://hf-mirror.com/Qwen/Qwen3-8B/blob/main/config.json', 'Qwen3-8B config.json']])}`);

  const tool = (n: string, url: string, who: string, how: string, api: string) => [`<a href="${url}" target="_blank" rel="noopener noreferrer"><b>${n}</b></a>`, who, how, api];
  P.card('c_Loc_2', 2, t('🧰 四个常用运行工具', '🧰 Four common runners'), `
${tb([t('工具', 'Runner'), t('适合谁', 'For'), t('怎么用', 'How'), t('本地接口', 'Local API')], [
    tool('Ollama', 'https://ollama.com', t('新手、想用命令行', 'beginners, command-line fans'), t('装好后一句 <code>ollama run 模型名</code> 就能聊', 'after install, <code>ollama run model-name</code> starts a chat'), t('有，兼容 OpenAI 格式：<code>http://localhost:11434/v1/</code>', 'yes, OpenAI-compatible: <code>http://localhost:11434/v1/</code>')),
    tool('LM Studio', 'https://lmstudio.ai', t('喜欢图形界面', 'prefer a window app'), t('桌面应用里搜索、下载、聊天；底层用 MLX 和 llama.cpp', 'search, download and chat in a desktop app; MLX and llama.cpp under the hood'), t('看官方文档', 'see its docs')),
    tool('llama.cpp', 'https://github.com/ggml-org/llama.cpp', t('想自己控制细节', 'want full control'), t('C/C++ 写的推理程序，读 GGUF 文件；自带量化工具', 'inference in C/C++ reading GGUF files; includes the quantize tool'), t('有，README 里有启动 OpenAI 兼容服务器的命令', 'yes, its README shows how to start an OpenAI-compatible server')),
    tool('vLLM', 'https://docs.vllm.ai/en/latest/', t('服务器、多人同时用', 'servers, many users at once'), t('部署在有显卡的服务器上，追求吞吐量', 'runs on GPU servers, built for throughput'), t('有，OpenAI 兼容的 API 服务器', 'yes, an OpenAI-compatible API server')),
  ])}
<p>${t('本地接口和云端 API 用同一种格式，所以上一站的 Python 代码只要把 <code>base_url</code> 改成 <code>http://localhost:11434/v1/</code>、模型名改成你下载的那个，就能改调本地模型（Ollama 不检查密钥，但 SDK 要求填一个，随便填即可）。', 'The local API uses the same format as cloud APIs, so the Python code from the API stop works with <code>base_url</code> set to <code>http://localhost:11434/v1/</code> and the model name of what you downloaded (Ollama does not check the key, but the SDK wants one, so any text will do).')}</p>
${tryit(P, jump(P, 'c_Api_4', 'Api', t('看那段 Python 代码', 'See that Python code')), jump(P, 'c_T5_1', 'T5', t('推理服务与批处理', 'Inference serving and batching')))}
${src(P, [['https://docs.ollama.com/api/openai-compatibility', 'Ollama OpenAI compatibility'], ['https://lmstudio.ai', 'LM Studio'], ['https://github.com/ggml-org/llama.cpp', 'llama.cpp'], ['https://docs.vllm.ai/en/latest/', 'vLLM docs']])}`);

  const fam = (n: string, who: string, org: string) => [`<b>${n}</b>`, who, `<a href="https://hf-mirror.com/${org}" target="_blank" rel="noopener noreferrer">${org} ↗</a>`];
  P.card('c_Loc_3', 2, t('📦 去哪下载、下载哪个', '📦 Where to download, and what'), `
${ul([
    t('<b>魔搭社区（ModelScope）</b>：国内的模型社区，常见开放模型都能找到，下载速度快。<a href="https://modelscope.cn/home" target="_blank" rel="noopener noreferrer">modelscope.cn ↗</a>', '<b>ModelScope</b>: a model community based in China with most common open models and fast downloads. <a href="https://modelscope.cn/home" target="_blank" rel="noopener noreferrer">modelscope.cn ↗</a>'),
    t('<b>HF-Mirror</b>：Hugging Face 的公益镜像站。用官方下载工具前设一个环境变量 <code>HF_ENDPOINT=https://hf-mirror.com</code>，下载就会走镜像。<a href="https://hf-mirror.com" target="_blank" rel="noopener noreferrer">hf-mirror.com ↗</a>', '<b>HF-Mirror</b>: a community mirror of Hugging Face. Set <code>HF_ENDPOINT=https://hf-mirror.com</code> before using the official download tool and downloads go through the mirror. <a href="https://hf-mirror.com" target="_blank" rel="noopener noreferrer">hf-mirror.com ↗</a>'),
    t('<b>运行工具自带的模型库</b>：Ollama、LM Studio 里可以直接搜索下载。', '<b>The runner’s own library</b>: Ollama and LM Studio can search and download directly.'),
  ])}
${tb([t('常见模型家族', 'Common families'), t('出自', 'From'), t('模型页', 'Model pages')], [
    fam(t('Qwen（通义千问）', 'Qwen'), t('阿里', 'Alibaba'), 'Qwen'),
    fam('DeepSeek', 'DeepSeek', 'deepseek-ai'),
    fam('GLM', t('智谱', 'Zhipu'), 'zai-org'),
    fam('Llama', 'Meta', 'meta-llama'),
    fam('Gemma', 'Google', 'google'),
    fam('Mistral', 'Mistral AI', 'mistralai'),
  ])}
${ul([
    t('同一家族有很多大小（如 1.5B、8B、32B……），先从电脑装得下的最大一档试。', 'Each family comes in many sizes (1.5B, 8B, 32B…); start with the largest that fits your computer.'),
    t('名字里带 Instruct / Chat 的是调教过、能对话的版本；带 Base 的是原始“续写”版，一般不直接拿来聊天。', 'Names with Instruct / Chat are tuned for conversation; Base is the raw “continue the text” version, usually not for chatting.'),
    t('<b>能不能商用、有什么条件，看模型页上的许可证</b>，各家不同。', '<b>Whether and how you may use it commercially is in the licence on the model page</b>; it differs by model.'),
  ])}`);

  P.card('c_Loc_4', 2, t('🏷️ 看懂文件名：GGUF 和 Q4_K_M', '🏷️ Reading file names: GGUF and Q4_K_M'), `
<p>${t('本地模型文件常长这样：<code>某模型-8B-Instruct-Q4_K_M.gguf</code>。拆开看：', 'Local model files often look like <code>some-model-8B-Instruct-Q4_K_M.gguf</code>. Taking it apart:')}</p>
${tb([t('片段', 'Part'), t('意思', 'Meaning')], [
    ['8B', t('80 亿个参数（B = billion，十亿）', '8 billion parameters (B = billion)')],
    ['Instruct', t('能对话的调教版', 'tuned for conversation')],
    ['Q4', t('量化：每个参数大约用 4 位多一点存（Q = quantized，量化）', 'quantized: about 4-and-a-bit bits per parameter (Q = quantized)')],
    ['K', t('llama.cpp 的 “k-quant” 量化方法', 'llama.cpp’s “k-quant” method')],
    ['M', t('同一档里的中号：S（小）< M（中）< L（大），越大越准、越占地方', 'the medium of that level: S < M < L; bigger is more accurate and takes more room')],
    ['.gguf', t('llama.cpp 用的模型文件格式，权重和必要信息装在一个文件里', 'the model file format llama.cpp uses: weights and the needed info in one file')],
  ])}
${ul([
    t('位数越少，文件越小、跑得越快，但答案质量会慢慢变差。llama.cpp 的说明里举例时常用 Q4_K_M。', 'Fewer bits: smaller and faster, with slowly declining answer quality. The llama.cpp README often uses Q4_K_M in its examples.'),
    t('例子（Llama-3.1-8B）：Q3_K_S 3.41 GiB < Q3_K_M 3.74 GiB < Q3_K_L 4.02 GiB。', 'Example (Llama-3.1-8B): Q3_K_S 3.41 GiB < Q3_K_M 3.74 GiB < Q3_K_L 4.02 GiB.'),
  ])}
${tryit(P, jump(P, 'quantCard', 'T5', t('量化：数字少用几位', 'Quantization: fewer bits per number'), true), jump(P, 'labQuant', 'T5', t('🧪 量化滑块', '🧪 Quantization slider')))}
${src(P, [['https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md', 'llama.cpp quantize README'], ['https://huggingface.co/docs/hub/gguf', 'GGUF (Hugging Face docs)']])}`);

  P.card('cfLocSize', 1, ti(P, '文件大小 vs 运行时占的内存', 'file size vs memory while running'),
    one(P, t('文件大小 ≈ 权重要占的内存（llama.cpp 说明里写明：内存和磁盘需求相同）。但运行时<b>还要加上 KV 缓存</b>，对话越长加得越多，再加上程序本身。', 'file size ≈ the memory the weights need (the llama.cpp README says memory and disk needs are the same). But while running you <b>add the KV cache</b>, which grows with the conversation, plus the program itself.'))
    + tb([t('对比', 'Compare'), t('文件大小', 'File size'), t('运行时内存', 'Memory while running')], [
      [t('包括', 'Includes'), t('权重', 'weights'), t('权重 + KV 缓存 + 程序', 'weights + KV cache + program')],
      [t('会不会变', 'Changes?'), t('固定', 'fixed'), t('随上下文长度变大', 'grows with context length')],
      [t('例子', 'Example'), t('Llama-3.1-8B Q4_K_M：4.58 GiB', 'Llama-3.1-8B Q4_K_M: 4.58 GiB'), t('再加 32K 词元的 KV（按 Qwen3-8B 的结构约 4.8 GB）就翻倍了', 'add 32K tokens of KV (about 4.8 GB with Qwen3-8B’s shape) and it doubles')],
    ])
    + mem(P, t('“文件 5 GB，我有 8 GB 显存” 不一定够：还要看上下文开多长。', '“The file is 5 GB and I have 8 GB of VRAM” may not be enough: it depends on the context length.')), CF);

  P.card('cfLocOpen', 1, ti(P, '开源 vs 开放权重', 'open source vs open weights'),
    one(P, t('“开放权重”只是把<b>训练好的参数文件</b>放出来给你下载；按开源促进会（OSI）的开源 AI 定义，“开源”还要求公开足够详细的<b>训练数据信息</b>和<b>训练、运行用的代码</b>。很多叫“开源模型”的其实是开放权重。', '“open weights” means only the <b>trained parameter files</b> are released for download; under the Open Source Initiative’s Open Source AI Definition, “open source” also requires sufficiently detailed <b>information about the training data</b> and the <b>code used to train and run it</b>. Many “open-source models” are really open-weights.'))
    + tb([t('对比', 'Compare'), t('开放权重', 'Open weights'), t('开源（OSI 定义）', 'Open source (OSI)')], [
      [t('能下载权重', 'Weights downloadable'), '✅', '✅'],
      [t('训练数据信息、训练代码', 'Training-data information, training code'), t('不一定', 'not necessarily'), '✅'],
      [t('使用条件', 'Terms of use'), t('看各自许可证，可能有限制', 'set by each licence; may restrict use'), t('使用 OSI 认可的条款', 'OSI-approved terms')],
    ])
    + mem(P, t('能下载 ≠ 开源 ≠ 随便商用。用之前看许可证。', 'Downloadable ≠ open source ≠ free for any commercial use. Read the licence first.'))
    + src(P, [['https://opensource.org/ai/open-source-ai-definition', 'OSI · The Open Source AI Definition']]), CF);

  P.labDivider();
  P.lab('labMem', t('内存计算器：这个模型我的电脑装得下吗', 'Memory calculator: will this model fit on my computer?'), t('权重按 llama.cpp 的位数算；KV 缓存按 Qwen3-8B 的结构按比例估，其他模型会不同；“够用 / 很紧”的线是示意。', 'Weights use llama.cpp bits per weight; the KV cache is scaled from Qwen3-8B’s shape and differs for other models; the “fits / tight” line is illustrative.'),
    [t('把“8B、Q4_K_M、32K”换成一个能比较的数字：多少 GB。', 'Turn “8B, Q4_K_M, 32K” into one comparable number: GB.'),
      t('看清是权重大，还是上下文（KV 缓存）大。', 'See whether the weights or the context (KV cache) dominate.')],
    `<div class="ctrls lc-g">
<label>${t('参数量（十亿，B）', 'Parameters (billions, B)')} <select id="lmP"><option value="1.5">1.5B</option><option value="4">4B</option><option value="8" selected>8B</option><option value="14">14B</option><option value="32">32B</option><option value="70">70B</option></select></label>
<label>${t('量化档', 'Quantization')} <select id="lmQ"><option value="F16">F16${t('（16 位）', ' (16-bit)')}</option><option value="Q8_0">Q8_0${t('（≈8.5 位）', ' (≈8.5 bits)')}</option><option value="Q4_K_M" selected>Q4_K_M${t('（≈4.9 位）', ' (≈4.9 bits)')}</option></select></label>
<label>${t('上下文长度（词元）', 'Context length (tokens)')} <select id="lmC"><option value="4096">4K</option><option value="8192" selected>8K</option><option value="32768">32K</option><option value="131072">128K</option></select></label>
<label>${t('你的内存', 'Your memory')} <select id="lmM"><option value="8">8 GB</option><option value="16" selected>16 GB</option><option value="24">24 GB</option><option value="32">32 GB</option><option value="64">64 GB</option></select></label>
<label>${t('内存类型', 'Memory type')} <select id="lmT"><option value="vram">${t('显卡显存（VRAM）', 'GPU VRAM')}</option><option value="uni">${t('苹果统一内存', 'Apple unified memory')}</option><option value="ram">${t('普通内存（RAM，用 CPU 算）', 'RAM (CPU)')}</option></select></label>
</div>
<div class="u-out" id="lmOut" aria-live="polite"></div>
<div class="u-bar" id="lmBar" role="img"></div>`,
    [t('8B、Q4_K_M、16 GB：把上下文从 8K 拉到 128K', '8B, Q4_K_M, 16 GB: raise the context from 8K to 128K'),
      t('换成 70B，看要多少内存', 'Switch to 70B and see how much memory it needs')]);

  P.quiz();
  return {
    sub: t('装得下吗、用什么工具、下载哪个文件。', 'Will it fit, which runner, which file.'),
    one: t('本地跑模型：把开放权重的模型文件下载到自己电脑上运行，资料不出门、不按词元付费，但要看内存装不装得下。', 'Running locally: download an open-weights model and run it on your own computer; data stays home and there is no per-token bill, but it must fit in memory.'),
    why: t('隐私、离线、想自己折腾，都会走到这一步。', 'Privacy, working offline, or wanting to tinker all lead here.'),
    svg, legend: [lg.use as [string, string, string], lg.llm as [string, string, string]],
  };
}
