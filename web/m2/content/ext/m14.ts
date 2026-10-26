/* M14 (R31): five more 3D stage cards, each the first thing on its stop (build.ts S3D_TOP moves it there):
   lab3dApi on Api (the ordering window), lab3dLoc on Loc (does the model fit in memory), lab3dSkl on Skl (plug tools
   into the robot), lab3dBld on Bld (the block robot and its two roads), lab3dDuo on U (together / on its own; Ua and Ub
   link to it). Same layout as M13: the stage, one sentence, at most one control, then one closed 「想知道为什么 ▾」 layer.
   Every number is the real one from calc.ts (the cost and memory calculators of those stops). */
import type { Page } from '../../lib';
import type { Ext } from './kit';
import { BPW, CHECKED, KV_TOKEN_BYTES, OVER_GB } from '../../../src/m2/calc';
import { API_IN, API_OUT, API_P, apiOne, apiSay, bldSay, duoSay, LOC_CTX, LOC_HAVE, LOC_P, LOC_Q, locSay, qName, sklSay, yuan } from '../../../src/m2/w3d2';

const L = (P: Page) => (P.t('zh', 'en') as 'zh' | 'en');
const box = (id: string, label: string, inner = '') => `<div class="s3d" id="${id}" tabindex="0" role="img" aria-label="${label}"><svg class="s3d-fb" viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>${inner}</div>`;
const tip = (s: string) => `<span class="s3d-tip" aria-hidden="true">${s}</span>`;
const say = (id: string, html: string, ctl = '') => `<div class="s3c-sheet"><p class="s3c-say" id="${id}" aria-live="polite">${html}</p>${ctl}</div>`;
const li = (a: string[]) => `<ul class="pts">${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
function fold(P: Page, o: { plain: string; out?: string; tryIt: string[]; how: [string, string[]]; note: string }) {
  const t = P.t;
  return `<details class="s3c-why"><summary><span>${t('想知道为什么', 'Want to know why')}</span><i aria-hidden="true">▾</i></summary><div class="s3c-in">
<p class="s3c-pl">🧒 ${o.plain}</p>${o.out ?? ''}
<p class="s3c-h">${t('👀 试试', '👀 Try this')}</p>${li(o.tryIt)}
<p class="s3c-h">${o.how[0]}</p>${li(o.how[1])}
<p class="s3c-note">ⓘ ${o.note}</p>
</div></details>`;
}
const opt = (cls: string, attrs: string, html: string, on = false) => `<button type="button" class="s3c-opt${cls ? ' ' + cls : ''}" ${attrs} aria-pressed="${on}">${html}</button>`;

/* ================= Api: the ordering window ================= */
function api(P: Page) {
  const t = P.t, one = yuan(apiOne());
  P.s3c('lab3dApi', t('3D 点菜窗口', '3D ordering window'),
    box('apBox', t('点菜窗口：你的程序把菜单递给云上的模型厨房，答案端回来，硬币记账', 'The ordering window: your program hands a menu to the model kitchen in the cloud, the answer comes back, coins keep the bill'))
    + say('apSay', apiSay(0, L(P)), `<div class="s3c-ctl one"><button type="button" class="s3c-go" id="apGo">📨 ${t('发送请求', 'Send request')}</button></div>`)
    + fold(P, {
      plain: t('API 像一个点菜窗口：你的程序把“菜单”（问题）递进去，厨房（平台上的模型）做好菜（回答）递出来，按份量（词元）记账。密钥就是你的会员卡，丢了别人就能刷你的钱。', 'An API is like an ordering window: your program passes in a “menu” (the question), the kitchen (the model on the platform) passes out the dish (the answer), and the bill goes by portion (tokens). The key is your membership card: lose it and others can spend your money.'),
      out: `<div id="apOut" class="s3d-out" aria-live="polite"></div>`,
      tryIt: [t(`按一次：多一枚硬币，账单加 ${one} 元。`, `Press once: one more coin, ${one} yuan more on the bill.`),
        t(`按 10 次：一共约 ${yuan(apiOne() * 10)} 元。问得越长、答得越长，花得越多。`, `Press 10 times: about ${yuan(apiOne() * 10)} yuan in all. Longer questions and answers cost more.`)],
      how: [t('🤔 图里的东西是什么', '🤔 What the picture shows'), [
        t('<b>笔记本</b> = 你的程序；<b>菜单卡</b> = 这次的问题；<b>金钥匙</b> = API 密钥，证明“是你在用、记你的账”。', '<b>Laptop</b> = your program; <b>menu card</b> = this question; <b>golden key</b> = the API key, which proves “it is you; bill me”.'),
        t('<b>发光的管子</b> = 网络；<b>云上的厨房</b> = 平台上的模型；<b>托盘上的卡</b> = 回答。', '<b>Glowing pipe</b> = the network; <b>kitchen in the cloud</b> = the model on the platform; <b>card on the tray</b> = the answer.'),
        t(`<b>一枚硬币</b> = 一次请求的钱：假设问题 ${API_IN} 个词元、回答 ${API_OUT} 个词元，按 ${API_P.zh} 的单价（每百万词元：输入 ${API_P.inP} 元、输出 ${API_P.outP} 元）算，约 ${one} 元。`, `<b>One coin</b> = the cost of one request: say ${API_IN} tokens in and ${API_OUT} tokens out at ${API_P.en} prices (per million tokens: ${API_P.inP} yuan in, ${API_P.outP} yuan out), about ${one} yuan.`)]],
      note: t(`单价来自官方价格页（${CHECKED} 查看），和本站费用计算器用的是同一份；实际以平台账单为准。`, `Prices from the official pricing page (checked ${CHECKED}), the same ones the cost calculator on this stop uses; the platform’s bill is final.`),
    }));
}

/* ================= Loc: does the model fit in memory? ================= */
function loc(P: Page) {
  const t = P.t, lg = L(P);
  const ctl = `<div class="s3c-ctl two"><label>${t('模型', 'Model')}<select id="l3M" aria-label="${t('模型大小和压缩档', 'Model size and compression')}">${LOC_P.map((p) => `<optgroup label="${p}B">${LOC_Q.map((q) => `<option value="${p}|${q}"${p === 8 && q === 'Q4_K_M' ? ' selected' : ''}>${p}B · ${qName(q, lg)}</option>`).join('')}</optgroup>`).join('')}</select></label></div>`;
  P.s3c('lab3dLoc', t('3D 内存装模型', '3D will the model fit'),
    box('l3Box', t('内存装模型：电脑机箱旁边一个透明的内存容器，彩色方块是模型权重，灰色方块是聊天记录', 'Will it fit: a see-through memory box next to a PC; coloured blocks are the model weights, grey blocks the chat history'))
    + say('l3Say', locSay(8, 'Q4_K_M', lg), ctl)
    + fold(P, {
      plain: t('本地跑模型像把厨师请到自己家：厨房（内存）要够大。模型越大、压缩得越少，占的地方越多；聊得越长，聊天记录也要占地方。', 'Running a model at home is like inviting a chef: the kitchen (memory) must be big enough. A bigger, less compressed model takes more room; a longer chat takes room too.'),
      out: `<div id="l3Out" class="s3d-out" aria-live="polite"></div>`,
      tryIt: [t('8B、4 位：约 7.1 GB，16 GB 装得下，还剩一大截。', '8B, 4-bit: about 7.1 GB; fits in 16 GB with plenty left.'),
        t('14B、8 位：约 18.0 GB，装不下。换成 4 位只要约 11.7 GB，就装得下了。', '14B, 8-bit: about 18.0 GB, does not fit. At 4-bit it needs only about 11.7 GB and fits.'),
        t('70B：怎么压缩都装不下 16 GB。', '70B: no compression gets it into 16 GB.')],
      how: [t('🤔 怎么算的（和下面的内存计算器同一个公式）', '🤔 How it is worked out (the same formula as the memory calculator below)'), [
        t(`<b>彩色方块 = 权重</b> = 参数量 × 每个参数的位数 ÷ 8。4 位、8 位、16 位分别是 llama.cpp 的 Q4_K_M（约 ${BPW.Q4_K_M} 位）、Q8_0（约 ${BPW.Q8_0} 位）、F16（${BPW.F16} 位）。`, `<b>Coloured blocks = weights</b> = parameters × bits per parameter ÷ 8. 4-bit, 8-bit and 16-bit are llama.cpp’s Q4_K_M (about ${BPW.Q4_K_M} bits), Q8_0 (about ${BPW.Q8_0} bits) and F16 (${BPW.F16} bits).`),
        t(`<b>灰色方块 = 聊天记录</b>（KV 缓存）：这里固定 ${LOC_CTX / 1024}K 词元，每个词元约 ${KV_TOKEN_BYTES / 1024} KB（按 Qwen3-8B 算，模型越大按比例越多），再加约 ${OVER_GB} GB 运行开销（示意）。`, `<b>Grey blocks = chat history</b> (KV cache): fixed here at ${LOC_CTX / 1024}K tokens, about ${KV_TOKEN_BYTES / 1024} KB per token (the Qwen3-8B shape, scaled with model size), plus about ${OVER_GB} GB overhead (illustrative).`),
        t(`<b>容器 = ${LOC_HAVE} GB 内存</b>。下面的条：绿 = 剩下至少两成；黄 = 装得下但很挤；红 = 装不下。`, `<b>The box = ${LOC_HAVE} GB of memory</b>. The bar: green = at least a fifth left; yellow = fits but tight; red = does not fit.`)]],
      note: t('想换上下文长度、内存大小或内存类型，用本页下面的“内存计算器”。结果是估算。', 'To change the context length, memory size or memory type, use the memory calculator further down this page. Results are estimates.'),
    }));
}

/* ================= Skl: plug tools into the robot ================= */
function skl(P: Page) {
  const t = P.t;
  const ctl = `<label class="s3c-sw"><span>${t('用之前先问我', 'Ask me before using')}</span><input type="checkbox" id="skAsk" role="switch" checked><i aria-hidden="true"></i></label>`;
  P.s3c('lab3dSkl', t('3D 给机器人插工具', '3D plug tools into the robot'),
    box('skBox', t('机器人和五张工具卡：文件、网页、日历、数据库、代码；点一张卡，线就插到机器人胸口', 'A robot and five tool cards: files, web, calendar, database, code; tap a card to plug its cable into the robot'), tip(t('👆 点一张工具卡', '👆 Tap a tool card')))
    + say('skSay', sklSay([], true, L(P)), ctl)
    + fold(P, {
      plain: t('给 AI 装技能像给手机装 App：先想清楚要它多会什么，再去正规的地方装，装的时候看它要哪些权限。', 'Adding skills to an AI is like installing apps on a phone: decide what you need, install from a proper store, and look at the permissions it asks for.'),
      tryIt: [t('点“文件”和“网页”：两根线插上，胸口亮绿灯“已连接”。再点一次就拔掉。', 'Tap “Files” and “Web”: two cables plug in and the chest shows a green “Connected”. Tap again to unplug.'),
        t('关掉“用之前先问我”：它会直接用连上的工具。碰文件、发东西、花钱的工具，最好一直开着。', 'Turn off “Ask me before using”: it uses the connected tools straight away. Keep it on for tools that touch files, send things or spend money.')],
      how: [t('🤔 卡片、线和插口是什么', '🤔 What the cards, cables and socket are'), [
        t('🔧 <b>工具</b> = 一段程序 + 一份说明书，模型按说明“点名”用它。每张卡就是一件工具。', '🔧 <b>Tool</b> = a program + a description; the model calls it by name. Each card is one tool.'),
        t('🔌 <b>MCP 服务器</b> = 插线板：一套工具按统一标准打包，哪个 Agent 都能插上。线和插口就是这个统一标准。', '🔌 <b>MCP server</b> = a power strip: a set of tools in one standard package any agent can plug in. The cables and socket are that standard.'),
        t('📦 <b>技能包</b> = 一个文件夹：步骤、模板、脚本，用到时才读。MCP 给 Agent 一只<b>手</b>，技能包给它一本<b>说明书</b>。', '📦 <b>Skill pack</b> = a folder of steps, templates and scripts, read only when needed. MCP gives the agent a <b>hand</b>; a skill pack gives it a <b>manual</b>.'),
        t('要它“动手碰东西” → MCP；要它“照着做法做” → 技能包；只是“同样的话” → 提示模板。', 'It must touch things → MCP; it must follow a method → a skill pack; it is just the same words → a prompt template.')]],
      note: t('装一个 MCP 服务器 = 给 Agent 一把钥匙。先看这把钥匙能开哪些门。', 'Installing an MCP server = handing the agent a key. First see which doors it opens.'),
    }));
}

/* ================= Bld: the block robot and its two roads ================= */
function bld(P: Page) {
  const t = P.t;
  const ctl = `<div class="s3c-ctl opt">${opt('', 'data-r="nocode"', `🧩 ${t('不写代码', 'No code')}`)}${opt('', 'data-r="code"', `⌨️ ${t('写代码', 'Code')}`)}</div>`;
  P.s3c('lab3dBld', t('3D 积木机器人', '3D block robot'),
    box('bdBox', t('积木机器人：模型、工具、记忆、说明四块积木拼成一个 Agent；旁边的路牌写着“不写代码”和“写代码”', 'A block robot: model, tools, memory and guide make one agent; a signpost points to “No code” and “Code”'))
    + say('bdSay', bldSay('', L(P)), ctl)
    + fold(P, {
      plain: t('搭 Agent 像做一个会自己查资料的小助理：它想一想，需要就去查（用工具），查到再想，直到能回答你。', 'Building an agent is like making a little assistant that looks things up: it thinks, looks something up if needed (a tool), thinks again, and answers when it can.'),
      tryIt: [t('点“不写代码”：路牌上那块亮起来。扣子、阿里云百炼、百度千帆、Dify、FastGPT、n8n 都是这条路。', 'Tap “No code”: that sign lights up. Coze, Model Studio, Qianfan, Dify, FastGPT and n8n are on this road.'),
        t('点“写代码”：用 SDK 自己写那个小循环，再看要不要 LangGraph、OpenAI Agents SDK 等框架。', 'Tap “Code”: write the small loop yourself with an SDK, then decide on LangGraph, the OpenAI Agents SDK or another framework.')],
      how: [t('🤔 四块积木是什么', '🤔 What the four blocks are'), [
        t('<b>模型</b>（脑袋）：负责想。<b>工具</b>（手）：查资料、读文件、跑程序。<b>记忆</b>（底座）：记住前面说过的话和资料。<b>说明</b>（身体）：告诉它是谁、该做什么、不能做什么。', '<b>Model</b> (head): does the thinking. <b>Tools</b> (hands): look things up, read files, run programs. <b>Memory</b> (base): keeps earlier words and notes. <b>Guide</b> (body, the instructions): who it is, what to do and what not to do.'),
        t('每个 Agent 里面都是同一个小循环：<b>模型想 → 要工具就跑工具 → 结果交回模型 → 再想</b>，直到能回答。两条路搭出来的都是它。', 'Every agent runs the same small loop: <b>the model thinks → runs a tool if needed → the result goes back → it thinks again</b>, until it can answer. Both roads build exactly this.')]],
      note: t('两条路的平台和框架都是真实的，详细对比在本页下面。', 'The platforms and frameworks on both roads are real; the full comparison is further down this page.'),
    }));
}

/* ================= U: together, or on its own ================= */
function duo(P: Page) {
  const t = P.t;
  /* R31b: the toggle is a capsule at the top inside the stage (no control row under it) */
  const cap = `<div class="s3c-cap" role="group" aria-label="${t('选一种用法', 'Pick a mode')}">${opt('', 'data-m="with"', `👥 ${t('一起干', 'Together')}`, true)}${opt('', 'data-m="solo"', `🤖 ${t('自己干', 'On its own')}`)}</div>`;
  P.s3c('lab3dDuo', t('3D 一起干 / 自己干', '3D together / on its own'),
    box('duBox', t('左边：人和机器人并排坐着一起干；右边：机器人自己干，人稍后再检查', 'Left: a person and a robot side by side, working together; right: the robot works alone and the person checks later'), cap).replace('role="img"', 'role="group"')
    + say('duSay', duoSay('with', L(P)))
    + fold(P, {
      plain: t('Agent 就像一个能动手的助手。用法只差四件事：谁叫它开工、它在哪儿干活、它能碰什么、你要不要在旁边看着。这里看的是最后一件。', 'An agent is like a helper that can actually do things. The ways to use it differ in only four things: who starts it, where it works, what it can touch, and whether you watch. This shows the last one.'),
      tryIt: [t('选“一起干”：像带着一个徒弟，你开口、你看着、关键步骤你点头。', 'Pick “Together”: like an apprentice at your side: you ask, you watch, you approve the key steps.'),
        t('选“自己干”：像把作业交给别人、你回头再检查。', 'Pick “On its own”: like handing a job to someone and checking it later.')],
      how: [t('🤔 自己干时靠什么保平安', '🤔 What keeps “on its own” safe'), [
        t('让它在不会弄坏东西的地方干活（隔离）。', 'It works somewhere it cannot break anything (isolation).'),
        t('交回来的东西能检查（比如一份改动清单、一份报告）。', 'What it hands back can be checked (a list of changes, a report).'),
        t('撤不回的那一步（合并、发送、付钱）由你来按。', 'The step that cannot be undone (merging, sending, paying) is left for you to press.')]],
      note: t('两种用法的具体产品和做法，见“一起干”和“自己干”两站。', 'Real products and how-tos for each mode are on the “Together” and “On its own” stops.'),
    }));
}

export const M14: Ext = {
  parts: {},
  cards: {},
  near: {
    Api: [{ after: 'c_Api_0', f: api }],
    Loc: [{ after: 'c_Loc_0', f: loc }],
    Skl: [{ after: 'c_Skl_0', f: skl }],
    Bld: [{ after: 'c_Bld_0', f: bld }],
    U: [{ after: 'c_U_0', f: duo }],
  },
  quiz: () => ({}),
};
/** every lab M14 adds, by station (tests read this) */
export const S3D_IDS2: Record<string, string[]> = { Api: ['lab3dApi'], Loc: ['lab3dLoc'], Skl: ['lab3dSkl'], Bld: ['lab3dBld'], U: ['lab3dDuo'] };
/** these cards go to the very top of their stop, like M13's */
export const S3D_TOP2: Record<string, string> = { Api: 'lab3dApi', Loc: 'lab3dLoc', Skl: 'lab3dSkl', Bld: 'lab3dBld', U: 'lab3dDuo' };
