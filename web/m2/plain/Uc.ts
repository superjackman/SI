/* R15 plain-language layer for Uc (giving an Agent new skills: tools, MCP, Skills, local models). No KaTeX here. */
import type { PStation } from './types';

const Uc: PStation = {
  cards: {
    c_Uc_0: {
      zh: `<p>模型会什么，练好时就定了。想让它多会几样，最省事的办法是<b>递给它说明书、给它装上“手脚”</b>，就像给手机装 App。有三种装法：一个个装工具、接上一整套别人做好的工具（MCP）、给它一包“做法说明”（Skills）。代价是：说明书都要占它的“桌面”（上下文）。</p>`,
      en: `<p>What a model knows is fixed once it is trained. The easiest way to make it do more is to <b>hand it instruction sheets and give it “hands”</b>, like installing apps on a phone. There are three ways: add tools one by one, plug in a whole set someone else built (MCP), or give it a pack of “how-to notes” (Skills). The cost: every instruction sheet takes up room on its “desk” (the context).</p>`,
    },
    c_Uc_1: {
      zh: `<p>一个工具就是<b>一张说明书加一段程序</b>。说明书告诉模型“我叫什么、能做什么、要填哪些信息”；模型想用时写一张“申请单”，程序检查后去真正干活，再把结果告诉模型。说明书要写得一看就懂。</p>`,
      en: `<p>A tool is <b>an instruction sheet plus a program</b>. The sheet tells the model “my name, what I do, what details to fill in”; when the model wants it, it writes a “request form”, the program checks it, does the real work, and reports the result back. The sheet should be easy to understand at a glance.</p>`,
    },
    c_Uc_2: {
      zh: `<p>MCP 像<b>统一的插座</b>：以前每个 AI 应用都要给每个工具单独做一个插头；有了统一插座，工具做一次、应用做一次，就都能插上。但插上一个陌生的插头，就等于信任它，所以只装来源可靠的。</p>`,
      en: `<p>MCP is like a <b>standard socket</b>: before, every AI app needed a separate plug for every tool; with a standard socket, each tool and each app does the work once and they all fit together. But plugging in an unknown plug means trusting it, so only install ones from sources you trust.</p>`,
    },
    c_Uc_3: {
      zh: `<p>一个技能包像<b>一本放在书架上的做法手册</b>：平时只露出书名和一句简介，很省地方；遇到相关的活，助手才把整本拿下来照着做，里面还可以带现成的小程序。</p>`,
      en: `<p>A skill pack is like <b>a how-to manual on a shelf</b>: normally only its title and a one-line summary show, which takes little room; when a related job comes up, the helper takes the whole manual down and follows it, and it can include ready-made small programs.</p>`,
    },
    c_Uc_4: {
      zh: `<p>装一个 MCP 服务器之前，像<b>让陌生人进家门前</b>那样问几句：是谁做的？它要干什么？能看到我的哪些东西？每次用都会问我吗？钥匙是不是给得最少？它读的内容会不会藏着坏指令？</p>`,
      en: `<p>Before installing an MCP server, ask a few questions as you would <b>before letting a stranger into your home</b>: who made it? What will it do? What of mine can it see? Will it ask me every time? Is it given as few keys as possible? Could what it reads hide bad instructions?</p>`,
    },
    c_Uc_5: {
      zh: `<p>有些模型可以<b>下载到自己的电脑上</b>跑，资料不用离开这台机器，没网也能用。代价是：电脑的内存决定能跑多大的模型，速度一般比不上云端，更新和安全也得自己管。在自己电脑上跑也不等于一定更安全。</p>`,
      en: `<p>Some models can be <b>downloaded and run on your own computer</b>, so your data never leaves the machine and it works offline. The costs: your computer’s memory limits how big a model you can run, it is usually slower than the cloud, and you must handle updates and security yourself. Running locally does not automatically mean safer.</p>`,
    },
    labCtxLoad: {
      zh: `<p>装的扩展越多，说明书就越占“桌面”。对比“全部塞进去”和“用到再拿”，看各占多少地方（词元数是示意）。</p>`,
      en: `<p>The more extensions you install, the more “desk” their instruction sheets take. Compare “put everything in” with “fetch when needed” and see how much room each takes (the token counts are illustrative).</p>`,
    },
  },
};
export default Uc;
