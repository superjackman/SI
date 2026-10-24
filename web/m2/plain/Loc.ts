/* R25 plain-language layer for Loc (running open-weights models on your own computer). No KaTeX here. */
import type { PStation } from './types';

const k = (zh: string, en: string) => ({ keep: true as const, zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
const Loc: PStation = {
  cards: {
    c_Loc_0: {
      zh: `<p class="pl-bd">📏 <b>这里讲</b>：自己电脑能跑多大的模型、用什么工具、去哪下载、文件名怎么看。<b>这里不讲</b>：怎么训练模型、怎么访问境外网站。</p>`
        + `<p>本地跑模型像<b>把厨师请到自己家</b>：食材（资料）不出门，不按份收钱；但厨房（内存）要够大，厨师的手艺一般比大饭店（云端最大的模型）差一些。</p>`,
      en: `<p class="pl-bd">📏 <b>Covered here</b>: how big a model your computer can run, which tools to use, where to download, how to read file names. <b>Not covered</b>: training models, or reaching overseas sites.</p>`
        + `<p>Running locally is like <b>inviting a chef to your home</b>: the ingredients (your data) never leave, and there is no per-dish bill; but the kitchen (memory) must be big enough, and the chef is usually not as good as a top restaurant (the largest cloud models).</p>`,
    },
    c_Loc_1: {
      zh: `<p>模型要整个<b>搬进内存</b>才能跑。大小 ≈ 参数个数 × 每个参数几位 ÷ 8，再加上聊天记录占的“草稿纸”（KV 缓存）。80 亿参数压到 4 位多，大约 5 GB。</p>`,
      en: `<p>The model has to be <b>loaded into memory</b> to run. Size ≈ number of parameters × bits each ÷ 8, plus the “scratch paper” the chat uses (the KV cache). 8 billion parameters at a little over 4 bits is about 5 GB.</p>`,
    },
    c_Loc_2: {
      zh: `<p>跑模型的工具像<b>播放器</b>，模型文件像<b>电影</b>。新手先用 Ollama（命令行）或 LM Studio（有界面）；它们还能在本机开一个和云端一样格式的接口。</p>`,
      en: `<p>A runner is like a <b>video player</b> and the model file like a <b>film</b>. Beginners start with Ollama (command line) or LM Studio (a desktop app); both can open a local API in the same format as the cloud ones.</p>`,
    },
    c_Loc_3: {
      zh: `<p>去哪下载？国内可以用<b>魔搭社区</b>，或者 <b>hf-mirror 镜像</b>。挑“Instruct”（会聊天）版本，用之前看一眼<b>许可证</b>，看能不能商用。</p>`,
      en: `<p>Where to download? In China, use <b>ModelScope</b> or the <b>hf-mirror</b> mirror. Pick the “Instruct” (chat) version, and check the <b>licence</b> before use to see whether commercial use is allowed.</p>`,
    },
    c_Loc_4: {
      zh: `<p>模型文件名像<b>商品标签</b>：8B 是“有多大”，Instruct 是“会聊天”，Q4_K_M 是“压缩到几位、哪种压法、中号”，.gguf 是“什么格式”。</p>`,
      en: `<p>A model file name is like a <b>product label</b>: 8B is “how big”, Instruct is “chats well”, Q4_K_M is “how many bits, which method, medium size”, and .gguf is “which format”.</p>`,
    },
    cfLocSize: k('下载的文件只是“菜谱”；真做菜时还要摆盘子、放草稿（KV 缓存）。所以<b>运行时占的内存比文件大</b>，对话越长越大。',
      'The downloaded file is only the “recipe”; actually cooking needs plates and scratch space (the KV cache). So <b>memory while running is bigger than the file</b>, and grows with the chat.'),
    cfLocOpen: k('<b>开放权重</b>是“成品菜可以带走”；<b>开源</b>（按 OSI 的定义）还要把“菜谱和食材来源”（数据信息和代码）也公开。能不能商用，两种都要看许可证。',
      '<b>Open weights</b> means “you can take the dish home”; <b>open source</b> (by the OSI definition) also publishes “the recipe and where ingredients came from” (data information and code). Either way, the licence decides commercial use.'),
    labMem: {
      zh: `<p>选模型大小、压缩档、对话长度和你的电脑内存，看装不装得下。</p>`,
      en: `<p>Choose the model size, the compression level, the chat length and your computer’s memory, and see whether it fits.</p>`,
    },
  },
};
export default Loc;
