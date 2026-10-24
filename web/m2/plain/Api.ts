/* R25 plain-language layer for Api (calling a model from your own program). No KaTeX here. */
import type { PStation } from './types';

const k = (zh: string, en: string) => ({ keep: true as const, zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
const Api: PStation = {
  cards: {
    c_Api_0: {
      zh: `<p class="pl-bd">📏 <b>这里讲</b>：怎么用国内平台的 API 让程序调模型、密钥怎么保管、钱怎么算。<b>这里不讲</b>：怎么访问或注册境外平台。</p>`
        + `<p>API 像一个<b>点菜窗口</b>：你的程序把“菜单”（问题）递进去，厨房（平台上的模型）做好菜（回答）递出来，按份量（词元）记账。<b>密钥</b>就是你的会员卡，丢了别人就能刷你的钱。</p>`,
      en: `<p class="pl-bd">📏 <b>Covered here</b>: calling a model from your program through a platform’s API, keeping the key safe, and what it costs. <b>Not covered</b>: how to reach or sign up for overseas platforms.</p>`
        + `<p>An API is like a <b>takeaway window</b>: your program passes in the order (the question), the kitchen (the model on the platform) passes out the dish (the answer), and you pay by portion (tokens). The <b>key</b> is your membership card: lose it and someone else spends your money.</p>`,
    },
    c_Api_1: {
      zh: `<p>国内不少平台都卖“按用量付费”的模型调用。下面的表只列官网写着的价格，<b>价格会变，以官网为准</b>。“¥/百万词元”就是每用一百万个词元付多少钱。</p>`,
      en: `<p>Many platforms sell pay-as-you-go model calls. The table lists only prices shown on the official sites; <b>prices change, so the official site wins</b>. “¥ per million tokens” is the price for every million tokens used.</p>`,
    },
    c_Api_2: {
      zh: `<p>密钥像<b>家门钥匙</b>：放在兜里（环境变量），不要挂在门上（写进代码、放在网页里、发到群里）。给每个项目配一把，再设一个“每月最多花多少”。</p>`,
      en: `<p>The key is like a <b>house key</b>: keep it in your pocket (an environment variable), never hang it on the door (in code, on a web page, in a chat). Give each project its own key and set a monthly spending cap.</p>`,
    },
    c_Api_3: {
      zh: `<p>很多平台都听得懂<b>同一种“点菜格式”</b>（OpenAI 兼容格式）。换平台时，只改三样：<b>地址</b>、<b>密钥</b>、<b>模型名</b>。问题放在 messages 里，按“谁说的”排好：system 是规矩，user 是你，assistant 是它。</p>`,
      en: `<p>Many platforms understand <b>the same “order format”</b> (the OpenAI-compatible format). To switch, change three things: the <b>address</b>, the <b>key</b> and the <b>model name</b>. The question goes in messages, labelled by who said it: system is the rules, user is you, assistant is the model.</p>`,
    },
    c_Api_4: {
      zh: `<p>第一次调用，就是在命令行里<b>发一封固定格式的信</b>。成功会收到回答和用量；收到 401 是密钥不对，402 一般是余额不够，429 是请求太快，等一下再试。</p>`,
      en: `<p>The first call is <b>sending a letter in a fixed format</b> from the command line. On success you get the answer and the usage; 401 means a wrong key, 402 usually means no balance, and 429 means too fast, so wait and retry.</p>`,
    },
    c_Api_5: {
      zh: `<p>钱 = 你发过去的字数（输入词元）× 输入价 + 它写回来的字数（输出词元）× 输出价。<b>输出更贵</b>；同样的开头重复发，可能按更便宜的“缓存价”算。</p>`,
      en: `<p>Cost = what you send (input tokens) × input price + what it writes back (output tokens) × output price. <b>Output costs more</b>; sending the same start again may be billed at a cheaper “cache” price.</p>`,
    },
    cfApiInOut: k('读（输入）比写（输出）便宜：读一页书很快，写一页要一个字一个字地想。所以同一个模型，<b>输出价通常是输入价的好几倍</b>。',
      'Reading (input) is cheaper than writing (output): reading a page is quick, writing one means thinking word by word. So for the same model <b>output usually costs several times more</b>.'),
    cfApiCache: k('就像老师批改作业：前面和上次<b>一模一样</b>的部分已经看过，直接打勾，只按便宜价算；从第一个不一样的字开始，才按正常价算。',
      'Like a teacher marking homework: the part <b>identical</b> to last time was already read, so it gets a quick tick at a cheap price; from the first different word on, the normal price applies.'),
    labCost: {
      zh: `<p>选一个模型，拖动滑块填“发多少、回多少、发几次”，看一个月大概花多少钱。</p>`,
      en: `<p>Pick a model and drag the sliders for how much you send, how much comes back and how many calls, to see a rough monthly cost.</p>`,
    },
  },
};
export default Api;
