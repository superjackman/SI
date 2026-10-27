/* R33 pilot: every word of the all-3D pilot (zh / en) and its page model. Pure data, no DOM, so the tests can read it.
   One page = one idea: a scene, one sentence under it, and things in the scene to tap. */
export type L = 'zh' | 'en';
export type T2 = { zh: string; en: string };
export interface Item { id: string; name: T2; say: T2; why: T2; deeper: string }
/** the six "I want to…" doors, one building each on the home island (deeper: the classic stop, or a pilot page) */
export const DOORS: Item[] = [
  { id: 'Api', name: { zh: '调 API', en: 'Call API' },
    say: { zh: '像在商店买东西：发一个请求，按用的字数付钱。', en: 'Like a shop: send a request, pay for the words you use.' },
    why: { zh: '你的程序把问题发到模型公司的电脑，它把答案发回来。价签就是价格：用多少字，收多少钱。', en: 'Your program sends the question to the model maker’s computer and gets the answer back. The price tag: you pay per word.' }, deeper: 'Api' },
  { id: 'Loc', name: { zh: '本地跑', en: 'Run local' },
    say: { zh: '把模型下载到自己电脑上跑，芯片和内存要够大。', en: 'Download a model and run it on your own computer.' },
    why: { zh: '模型越大，要的内存越多。显卡里的芯片算得快，不联网也能用。', en: 'A bigger model needs more memory. The graphics chip does the sums fast, even offline.' }, deeper: 'Loc' },
  { id: 'Job', name: { zh: '找 Agent', en: 'Find agent' },
    say: { zh: '按你要做的事，挑一个会替你动手的 AI 助手。', en: 'Pick an AI helper that does the job for you.' },
    why: { zh: 'Agent 不只是聊天：它会自己查资料、点网页、写文件，一步步把事做完。', en: 'An agent does more than chat: it looks things up, clicks, writes files, step by step.' }, deeper: 'Job' },
  { id: 'Skl', name: { zh: '装技能', en: 'Skills' },
    say: { zh: '给 AI 插上技能卡片，它就能查天气、读文件、连软件。', en: 'Plug skill cards into an AI so it can check the weather, read files, use apps.' },
    why: { zh: '每张卡片教 AI 一个新本事。MCP 就像统一的插卡口，哪家的卡都能插。', en: 'Each card teaches one new trick. MCP is the one card slot every card fits.' }, deeper: 'Skl' },
  { id: 'Bld', name: { zh: '搭 Agent', en: 'Build agent' },
    say: { zh: '像搭积木一样，把模型、工具和步骤拼成你自己的 Agent。', en: 'Snap a model, tools and steps together like blocks: your own agent.' },
    why: { zh: '大脑（模型）+ 手（工具）+ 记事本（记忆）+ 流程，拼好就能反复替你干活。', en: 'Brain (model) + hands (tools) + notebook (memory) + steps = a helper that works again and again.' }, deeper: 'Bld' },
  { id: 'T1', name: { zh: '懂原理', en: 'How it works' },
    say: { zh: '走进原理塔，用积木、箭头和小球看懂 AI 为什么行。', en: 'Step into the tower: blocks, arrows and balls show why AI works.' },
    why: { zh: 'AI 的本事来自很多简单的步骤：把字变成数字、比一比、叠很多层、从错误里学。', en: 'AI is many simple steps: turn words into numbers, compare, stack layers, learn from mistakes.' }, deeper: 'p3d:zone' },
];
/** the five glass pedestals of the principles zone */
export const PEDS: Item[] = [
  { id: 'tok', name: { zh: '词积木', en: 'Word blocks' },
    say: { zh: 'AI 先把一句话切成一块块小积木，每块变成一串数字。', en: 'AI cuts a sentence into small blocks; each block becomes a list of numbers.' },
    why: { zh: '电脑只认数字，所以每个词都换成一串数字。意思相近的词，数字也相近。', en: 'Computers only know numbers, so every word becomes numbers. Similar words get similar numbers.' }, deeper: 'T3' },
  { id: 'att', name: { zh: '注意力箭头', en: 'Attention' },
    say: { zh: '读到一个词时，AI 用箭头去看别的词，箭头越粗看得越认真。', en: 'Reading a word, AI looks at the other words; a thicker arrow means a closer look.' },
    why: { zh: '“苹果”要看“吃”才知道是水果。箭头多粗，看两个词的“方向”有多一致，这就是点积。', en: '“apple” looks at “eat” to know it is a fruit. How thick the arrow is = how much two words point the same way: the dot product.' }, deeper: 'p3d:attn' },
  { id: 'lay', name: { zh: '层层塔', en: 'Layer tower' },
    say: { zh: '同样的步骤叠很多层，每一层都把理解往前推一点。', en: 'The same step is stacked many times; each layer understands a bit more.' },
    why: { zh: '下面的层看字和词，上面的层看意思和语气，像盖楼一样一层层变聪明。', en: 'Low layers see letters and words, high layers see meaning and tone, like floors of a building.' }, deeper: 'T4' },
  { id: 'val', name: { zh: '误差山谷', en: 'Error valley' },
    say: { zh: '训练就像小球往山谷底滚：越往下，猜错越少。', en: 'Training is a ball rolling into a valley: the lower it gets, the fewer mistakes.' },
    why: { zh: '高度就是“错了多少”。每一步都朝最陡的下坡走一小步，走多了就到谷底。', en: 'Height = how wrong it is. Each step goes a little way down the steepest slope until the bottom.' }, deeper: 'T7' },
  { id: 'dice', name: { zh: '加重骰子', en: 'Loaded dice' },
    say: { zh: 'AI 说下一个字，像掷一个加了重量的骰子：机会大的字更常出现。', en: 'Picking the next word is like a loaded die: likely words come up more often.' },
    why: { zh: '每个字都有一个机会，加起来是 100%。“温度”高，骰子更随意；温度低，更稳。', en: 'Every word has a chance; they add up to 100%. High “temperature” = a wilder die, low = steadier.' }, deeper: 'K3' },
];
export type Page = 'home' | 'zone' | 'attn' | 'dot';
export const UI = {
  title: { zh: '大白话拆解 AI', en: 'AI, explained plainly' },
  home: { zh: '探索 AI 宇宙！', en: 'Explore the AI Universe!' },
  zone: { zh: '探索核心', en: 'Explore the Core' },
  core: { zh: '分层核心', en: 'Layered Core' },
  attnName: { zh: '注意力怎么工作', en: 'How Attention Works' },
  attn: { zh: '点一个词：亮起的弧线连着它在看的词，数字越大看得越认真。', en: 'Tap a word: glowing arcs reach the words it looks at; a bigger number is a closer look.' },
  attnWhy: { zh: '每个词都拿自己的箭头和别的词比方向：越同向（点积越大），看得越认真。', en: 'Each word compares its arrow with the others: the more they point the same way (a bigger dot product), the closer it looks.' },
  zoneName: { zh: '懂原理', en: 'How it works' },
  dotName: { zh: '点积', en: 'Dot product' },
  dot: { zh: '拖动小球，看看角度怎样投下影子。', en: 'Drag the dot to explore how angles create shadows.' },
  dotWhy: { zh: '点积 = 粉箭头在淡紫箭头上的影子长 × 淡紫箭头长。同向最大，垂直是 0，反向变负数。', en: 'Dot product = the pink arrow’s shadow on the lavender one × the lavender length. Biggest when they agree, 0 at a right angle, negative when opposite.' },
  len: { zh: '粉箭头长度', en: 'Pink arrow length' },
  shadow: { zh: '影子', en: 'shadow' },
  menu: { zh: '菜单', en: 'Menu' }, search: { zh: '搜索', en: 'Search' }, share: { zh: '分享', en: 'Share' }, back: { zh: '返回', en: 'Back' },
  map: { zh: '地图', en: 'Map' }, progress: { zh: '进度', en: 'Progress' }, next: { zh: '下一页', en: 'Next' },
  why: { zh: '为什么', en: 'Why' }, deeper: { zh: '再深入', en: 'Go deeper' }, close: { zh: '关闭', en: 'Close' },
  classic: { zh: '回到经典版', en: 'Classic version' }, lang: { zh: 'English', en: '中文' },
  copied: { zh: '链接已复制', en: 'Link copied' },
  seen: { zh: '看过', en: 'Seen' }, find: { zh: '找一个想法…', en: 'Find an idea…' },
  pages: { zh: '第 {i} / {n} 页', en: 'Page {i} of {n}' },
  fallback: { zh: '这台设备不能显示 3D，下面是平面版。', en: 'This device can’t show 3D; here is the flat version.' },
} satisfies Record<string, T2>;
export const t = (x: T2, l: L) => x[l];
/** the dot product of two floor arrows and what to say about it (rounded to one decimal) */
export function dotInfo(ax: number, az: number, bx: number, bz: number) {
  const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz), d = ax * bx + az * bz;
  const cos = la && lb ? d / (la * lb) : 0, deg = Math.round((Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI);
  return { dot: Math.round(d * 10) / 10, deg, shadow: la ? d / la : 0, sign: Math.abs(cos) < 0.035 ? 0 : Math.sign(d) };
}
/** R33 v3: the attention page (the reference "How Attention Works"): one sentence on four glass blocks; each word looks
    at the others with a score (how much their arrows agree). Row = the word you tap, column = the word it looks at. */
export const ATT = {
  words: { zh: ['我', '爱', '吃', '苹果'], en: ['I', 'love', 'eating', 'apples'] },
  sentence: { zh: '我爱吃苹果。', en: 'I love eating apples.' },
  score: [[0, 71, 28, 22], [64, 0, 85, 57], [34, 92, 0, 78], [21, 49, 88, 0]],
  /** the first thing on the page: "eating" lit, as in the reference */
  start: 2,
};
/** what the tapped word does, in a short line: "eating" looks hardest at "love" */
export function attnSay(k: number, l: L): string {
  const row = ATT.score[k]!, w = ATT.words[l], best = row.indexOf(Math.max(...row));
  return l === 'en' ? `“${w[k]}” looks hardest at “${w[best]}”` : `「${w[k]}」最认真看「${w[best]}」`;
}
/** every page of the pilot in reading order: the island, the hall overview, its 5 pedestals, attention, the dot product */
export const ORDER: { p: Page; i: number }[] = [{ p: 'home', i: 0 }, ...[0, 1, 2, 3, 4, 5].map((i) => ({ p: 'zone' as Page, i })), { p: 'attn', i: 0 }, { p: 'dot', i: 0 }];
export const key = (p: Page, i: number) => (p === 'zone' ? `zone${i}` : p);
export function nextOf(p: Page, i: number) { const k = ORDER.findIndex((o) => o.p === p && o.i === i); return ORDER[(k + 1) % ORDER.length]!; }
