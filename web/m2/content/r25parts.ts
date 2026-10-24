/* R25: the parts (popup cards) of the 🔌 Api and 💻 Loc stations. Facts as in content/Api.ts and content/Loc.ts. */
import type { T } from '../lib';
import type { M2Part } from './parts';

const tryCost = (t: T): [string, string, string] => ['labCost', 'Api', t('🧪 费用计算器（API 调模型）', '🧪 Cost calculator (Model APIs)')];
const tryMem = (t: T): [string, string, string] => ['labMem', 'Loc', t('🧪 内存计算器（本地跑模型）', '🧪 Memory calculator (Run models locally)')];

export const R25_PARTS: Record<string, M2Part> = {
  aApi: {
    n: { zh: 'API 调模型（总览）', en: 'Model APIs (overview)' }, t: 'Api', up: 'app', zoom: 'Api', dn: ['llm', 'tokenizer'],
    pop: (t) => ({
      role: t('API 让你的程序代替你去问模型：发文字过去，收回复回来。', 'An API lets your program ask the model for you: send text, get a reply.'),
      tryit: tryCost(t),
      does: [
        t('程序带上密钥，把请求发到平台的接口地址。', 'The program attaches a key and sends the request to the platform’s address.'),
        t('平台上的模型算完，把回复和用量（词元数）一起发回来。', 'The platform’s model replies, along with the usage (token counts).'),
      ],
      how: [t('注册平台 → 建密钥 → 查地址、模型名、价格 → 发第一个请求 → 设用量上限。', 'Sign up → create a key → find the address, model name and price → first request → set a spending limit.')],
      why: t('想把模型接进自己的网站、脚本、工具，就要走 API。', 'To put a model into your own site, script or tool, you use an API.'),
      eff: t('不用自己买显卡，按用量付费。', 'No GPU to buy; pay for what you use.'),
      lim: t('资料要发到平台；要联网；用多了按词元计费。', 'Your data goes to the platform; it needs the network; heavy use costs per token.'),
    }),
  },
  aKey: {
    n: { zh: 'API 密钥', en: 'API key' }, t: 'Api', up: 'aApi', dn: ['serve'],
    pop: (t) => ({
      role: t('一串证明“是你在用、记你的账”的字符，等于钱包。', 'A string that proves “it is you; bill me”: effectively your wallet.'),
      tryit: tryCost(t),
      does: [t('请求头里带上它，平台才会回答并扣费。', 'Put it in the request header and the platform answers and bills you.')],
      how: [
        t('只放环境变量或服务器的密钥管理里，程序运行时读。', 'Keep it only in an environment variable or the server’s secret store; read it at run time.'),
        t('不写进代码、不放网页前端、不贴进聊天。', 'Never in code, never in front-end code, never pasted into a chat.'),
      ],
      why: t('谁拿到密钥，谁就能用你的钱。', 'Whoever holds the key spends your money.'),
      eff: t('设用量上限，每个项目一把密钥，泄露时损失可控。', 'With a spending limit and one key per project, a leak stays contained.'),
      lim: t('泄露后只能在控制台删掉重建，已花的钱一般追不回。', 'After a leak you can only delete and recreate it; money already spent is usually gone.'),
    }),
  },
  aCompat: {
    n: { zh: 'OpenAI 兼容格式', en: 'OpenAI-compatible format' }, t: 'Api', up: 'aApi', dn: ['ctxwin'],
    pop: (t) => ({
      role: t('很多平台（和本地工具）接受同一种请求格式，同一段代码改三处就能换平台。', 'Many platforms (and local runners) accept the same request format; the same code moves by changing three things.'),
      tryit: tryCost(t),
      does: [
        t('改 base_url（地址）、api_key（密钥）、model（模型名）。', 'Change base_url (address), api_key (key) and model (name).'),
        t('messages 是一串“谁说了什么”：system、user、assistant。', 'messages is a list of “who said what”: system, user, assistant.'),
      ],
      how: [t('先看平台文档是否写明兼容；没写的按它自己的文档来。', 'Check that the platform documents compatibility; otherwise follow its own docs.')],
      why: t('格式统一，换平台、换本地模型都很省事。', 'One format makes switching platforms or going local easy.'),
      eff: t('Ollama、vLLM 等本地工具也提供这种接口。', 'Local runners such as Ollama and vLLM offer it too.'),
      lim: t('“兼容”通常只覆盖常用功能，细节参数各家不同。', '“Compatible” usually covers the common features; details differ.'),
    }),
  },
  aPrice: {
    n: { zh: '按词元计费', en: 'Paying by tokens' }, t: 'Api', up: 'aApi', dn: ['tokenizer', 'ctxwin'],
    pop: (t) => ({
      role: t('账单 = 输入词元 × 输入价 + 输出词元 × 输出价，单价按每百万词元标。', 'Bill = input tokens × input price + output tokens × output price, priced per million tokens.'),
      tryit: tryCost(t),
      does: [
        t('输出通常比输入贵几倍。', 'Output usually costs several times more than input.'),
        t('开头和之前请求相同的输入，可能按便宜的“缓存命中价”算。', 'Input whose start matches an earlier request may be billed at a cheaper “cache hit” price.'),
      ],
      how: [t('看回复里的 usage：prompt_tokens 和 completion_tokens。', 'Read usage in the reply: prompt_tokens and completion_tokens.')],
      why: t('模型按词元读写，算力也按词元花。', 'The model reads and writes tokens, and spends compute per token.'),
      eff: t('删无关资料、要求简短回答、不变的内容放前面，都能省钱。', 'Dropping irrelevant material, asking for short answers and putting fixed content first all save money.'),
      lim: t('同一段话在不同模型里的词元数不同，估算只是估算。', 'The same text has different token counts on different models; estimates are estimates.'),
    }),
  },
  lHub: {
    n: { zh: '本地跑模型（总览）', en: 'Running locally (overview)' }, t: 'Loc', up: 'app', zoom: 'Loc', dn: ['quant', 'kvcache', 'serve'],
    pop: (t) => ({
      role: t('把开放权重的模型下载到自己电脑上运行：资料不出门，不按词元付费。', 'Download an open-weights model and run it yourself: data stays home, no per-token bill.'),
      tryit: tryMem(t),
      does: [
        t('运行工具把模型文件装进内存，在你的电脑上算。', 'A runner loads the model file into memory and computes on your machine.'),
        t('可以直接聊天，也可以开一个本地接口给程序用。', 'Chat directly, or open a local API for your programs.'),
      ],
      how: [t('看内存 → 估大小 → 装工具 → 下载模型 → 运行。', 'Check memory → estimate size → install a runner → download → run.')],
      why: t('隐私、离线、想自己折腾的时候用它。', 'For privacy, offline work, or tinkering.'),
      eff: t('不联网也能用，设置都由你定。', 'Works offline; every setting is yours.'),
      lim: t('电脑装得下的模型通常比云端最大的模型弱，下载和维护靠自己。', 'Models that fit a PC are usually weaker than the largest cloud ones; upkeep is on you.'),
    }),
  },
  lMem: {
    n: { zh: '内存估算', en: 'Memory estimate' }, t: 'Loc', up: 'lHub', dn: ['quant', 'kvcache'],
    pop: (t) => ({
      role: t('运行时内存 ≈ 参数 × 位数 ÷ 8 + KV 缓存 + 程序本身。', 'Memory while running ≈ parameters × bits ÷ 8 + KV cache + the program.'),
      tryit: tryMem(t),
      does: [
        t('权重：8B 模型用 Q4_K_M 约 4.6 GiB（llama.cpp 数据）。', 'Weights: an 8B model at Q4_K_M is about 4.6 GiB (llama.cpp figures).'),
        t('KV 缓存随对话变长而变大。', 'The KV cache grows as the conversation grows.'),
      ],
      how: [t('显存最快；放不下时工具可以分一部分到内存，但会变慢。', 'VRAM is fastest; if it does not fit, runners can spill into RAM, but it slows down.')],
      why: t('装不下就跑不起来，或者慢得没法用。', 'If it does not fit, it will not run, or will be too slow to use.'),
      eff: t('先算一下，少走下载几十 GB 再删掉的弯路。', 'A quick estimate saves downloading tens of GB for nothing.'),
      lim: t('不同模型结构不同，KV 缓存只能粗估。', 'Model shapes differ, so the KV cache is only a rough estimate.'),
    }),
  },
  lTool: {
    n: { zh: '本地运行工具', en: 'Local runners' }, t: 'Loc', up: 'lHub', dn: ['serve', 'quant'],
    pop: (t) => ({
      role: t('把模型文件跑起来的程序：Ollama、LM Studio、llama.cpp、vLLM。', 'Programs that run model files: Ollama, LM Studio, llama.cpp, vLLM.'),
      tryit: tryMem(t),
      does: [
        t('Ollama：命令行，本地接口 localhost:11434，兼容 OpenAI 格式。', 'Ollama: command line, local API on localhost:11434, OpenAI-compatible.'),
        t('LM Studio：图形界面；llama.cpp：C/C++ 底层引擎；vLLM：服务器上的高吞吐引擎。', 'LM Studio: a desktop app; llama.cpp: the C/C++ engine; vLLM: a high-throughput server engine.'),
      ],
      how: [t('新手先用 Ollama 或 LM Studio。', 'Beginners start with Ollama or LM Studio.')],
      why: t('它们负责加载、量化文件、调度显卡，你只管用。', 'They load files, handle quantized formats and drive the GPU, so you just use it.'),
      eff: t('开本地兼容接口后，调云端 API 的代码改个地址就能用。', 'With a local compatible API, cloud API code works after changing the address.'),
      lim: t('各工具支持的文件格式和功能不完全一样。', 'Runners differ in supported file formats and features.'),
    }),
  },
  lGguf: {
    n: { zh: '模型文件与量化档', en: 'Model files and quant levels' }, t: 'Loc', up: 'lHub', dn: ['quant'],
    pop: (t) => ({
      role: t('文件名里的 8B、Q4_K_M、.gguf 分别是参数量、量化档和文件格式。', 'In a file name, 8B, Q4_K_M and .gguf are the size, the quantization level and the format.'),
      tryit: tryMem(t),
      does: [
        t('Q4 ≈ 每个参数 4 位多；K 是 llama.cpp 的 k-quant 方法；S/M/L 是同档的小中大。', 'Q4 ≈ about 4 bits per parameter; K is llama.cpp’s k-quant method; S/M/L are small/medium/large in that level.'),
        t('GGUF 是 llama.cpp 的模型文件格式。', 'GGUF is llama.cpp’s model file format.'),
      ],
      how: [t('国内可从魔搭或 hf-mirror 镜像下载。', 'In China, download from ModelScope or the hf-mirror mirror.')],
      why: t('位数越少，文件越小、越快，质量慢慢下降。', 'Fewer bits: smaller and faster, with slowly declining quality.'),
      eff: t('同一个模型，Q4_K_M 文件大约只有 F16 的三分之一。', 'For the same model, Q4_K_M is roughly a third of the F16 size.'),
      lim: t('能不能商用看模型页上的许可证。', 'Commercial use depends on the licence on the model page.'),
    }),
  },
};
