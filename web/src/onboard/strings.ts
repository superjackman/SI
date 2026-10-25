/* R21 onboarding: its own words (lazy chunk; nothing here is in the first load). Plain words a primary-school pupil can
   read. {x} placeholders are filled by fill() (viral/strings). */
import type { Bi } from '../i18n/types';
import { TABORDER } from '../legacy/kb';

export const O = {
  /* welcome card (first visit) */
  wTitle: { zh: '👋 欢迎来到「大白话拆解 AI」', en: '👋 Welcome to “AI in Plain Words”' },
  wLead: { zh: '这里用大白话和小实验，带你看懂：你对 AI 说一句话，它是怎么听懂、再把事情做完的。不用会编程，跟着点就行。', en: 'Plain words and small hands-on labs show you what happens when you say one sentence to an AI: how it understands and gets the job done. No coding needed, just tap along.' },
  w1: { zh: '<b>看导览</b>：15 步带你走一圈，先认个路。', en: '<b>Take the tour</b>: 15 steps around the site, so you know the way.' },
  w2: { zh: '<b>点方块</b>：图里每个方块都能点开，看它是干什么的。', en: '<b>Tap the boxes</b>: every box in a picture opens and tells you what it does.' },
  w3: { zh: '<b>做小测</b>：每站做完小测就点亮一站，{NS} 站全亮有奖状。', en: '<b>Do the quiz</b>: finish a stop’s quiz to light it up. Light all {NS} for a certificate.' },
  wTour: { zh: '🎬 开始导览（15 步）', en: '🎬 Start the tour (15 steps)' },
  wPick: { zh: '或者选一条路线：', en: 'Or pick a route:' },
  wKid: { zh: '🧒 小学生路线\n6\u00a0站', en: '🧒 Kids’ route\n6\u00a0stops' },
  wAll: { zh: '🗺 完整路线\n{NS}\u00a0站', en: '🗺 Full route\n{NS}\u00a0stops' },
  wBtns: { zh: '👀 先认识一下按钮', en: '👀 Show me the buttons first' },
  wClose: { zh: '关闭欢迎卡（菜单里的「👋 新手入门」可以再打开）', en: 'Close the welcome card (open it again with “👋 Getting started” in the menu)' },
  /* the menu entry that opens it again */
  dw: { zh: '👋 新手入门：怎么学、按钮怎么用', en: '👋 Getting started: how to learn, what the buttons do' },
  /* the row under the plain opening */
  rChip: { zh: '🧒 路线 {k}/6', en: '🧒 Route {k}/6' },
  rBack: { zh: '🧒 回到路线', en: '🧒 Back to the route' },
  rHead: { zh: '🧒 小学生路线：6 站，每站「读大白话 → 玩 1 个实验 → 做小测」', en: '🧒 Kids’ route: 6 stops. At each one: read the plain words → play 1 lab → do the quiz' },
  rWhy: { zh: '为什么是这 6 站：从「AI 能帮你干什么」走到「它是怎么学会的」，每站都有一个好玩、不用算数的实验。数学站和细节站以后再看。', en: 'Why these 6: they go from “what AI can do for you” to “how it learned”, and each has a fun lab with no maths. The maths and detail stops can wait.' },
  rAll: { zh: '换成完整路线（{NS} 站）', en: 'Switch to the full route ({NS} stops)' },
  rKid: { zh: '换成小学生路线（6 站）', en: 'Switch to the kids’ route (6 stops)' },
  labs: { zh: '🧪 这页有 {n} 个实验', en: '🧪 {n} labs on this page' },
  lab1: { zh: '🧪 这页有 1 个实验', en: '🧪 1 lab on this page' },
  demo: { zh: '🎬 这页有 1 个动手演示', en: '🎬 1 hands-on demo on this page' },
  try: { zh: '🧪 先玩：{lab}', en: '🧪 Play first: {lab}' },
  lit: { zh: '✨ 已点亮 {n}/{NS}', en: '✨ Lit {n}/{NS}' },
  next: { zh: '下一站：{stop} ›', en: 'Next: {stop} ›' },
  nextR: { zh: '路线下一站：{stop} ›', en: 'Next on the route: {stop} ›' },
  qNext: { zh: '做完上面的小测，这一站就点亮了。', en: 'Finish the quiz above and this stop lights up.' },
  qDone: { zh: '✅ 这一站点亮了！', en: '✅ This stop is lit!' },
  rEnd: { zh: '🎉 6 站路线走完啦！你已经知道 AI 是怎么听懂一句话、怎么学会的了。想看更多？', en: '🎉 You finished the 6-stop route! You now know how AI understands a sentence and how it learned. Want more?' },
  rLeft: { zh: '路线还差 {n} 站没点亮：', en: '{n} route stops are not lit yet:' },
  rGoAll: { zh: '🗺 走完整路线 ›', en: '🗺 Try the full route ›' },
  /* coach marks */
  cNext: { zh: '下一个', en: 'Next' },
  cOk: { zh: '知道了', en: 'Got it' },
  cSkip: { zh: '跳过', en: 'Skip' },
  c1: { zh: '☰ <b>菜单</b>：{NS} 站都在这里，还有导览、全屏 ⛶、「👋 新手入门」、看得多细、地图和图标。', en: '☰ <b>Menu</b>: all {NS} stops, plus the tour, full screen ⛶, “👋 Getting started”, how much detail, the map and icons.' },
  c2: { zh: '‹ › <b>换站</b>：去上一站 / 下一站。在页面上左右滑也行。中间的小圆点告诉你在第几站。', en: '‹ › <b>Change stop</b>: previous / next. Swiping left or right on the page works too. The small dots show which stop you are on.' },
  c3: { zh: '🔍 <b>找词</b>　⤴ <b>分享</b>给朋友　<b>EN</b> 换成英文（再点换回中文）。', en: '🔍 <b>Find a word</b>　⤴ <b>Share</b> with a friend　<b>中</b> switch to Chinese (tap again for English).' },
  c5: { zh: '最下面这一排管<b>这一页</b>：📑 目录 跳到某一段，🧪 实验 去动手玩，✅ 小测 做题，✨ 进度 看点亮了几站，下一站 › 接着往下走。', en: 'The bottom row is for <b>this page</b>: 📑 Contents jumps to a part, 🧪 Labs to play, ✅ Quiz to answer, ✨ Progress shows stops lit, Next › moves on.' },
  c4: { zh: '这一排是<b>小路标</b>：⌂ 是现在这一站，↓ 后面是可以往里钻、看得更细的站。', en: 'This row is a <b>signpost</b>: ⌂ is this stop, and after ↓ come the stops that look closer inside it.' },
  /* one-time tips next to things in the pictures */
  tDd: { zh: '⤵ 带这个圆钮的方块，里面还有一整站。点圆钮就钻进去，点「↩」回来。', en: 'A box with this ⤵ button has a whole stop inside. Tap the button to go in, and “↩” to come back.' },
  tRo: { zh: '🔒 只读：你在用 AI 的时候，这块里的数字不会变，只有训练时才改。照样可以点开看！', en: '🔒 Read-only: while you use the AI, the numbers in this box do not change; only training changes them. You can still tap it to look!' },
  tDots: { zh: '按住这排小圆点左右滑，会显示站名；松手就去那一站。', en: 'Press and slide along these dots to see stop names; let go to jump there.' },
  tX: { zh: '知道了', en: 'Got it' },
  /* text labels under the header icons (first visit only) */
  hMenu: { zh: '菜单', en: 'Menu' },
  hPrev: { zh: '上一站', en: 'Back' },
  hNext: { zh: '下一站', en: 'Next' },
  hFind: { zh: '找词', en: 'Find' },
  hShare: { zh: '分享', en: 'Share' },
  hLang: { zh: '英文', en: 'Chinese' },
  /* R27+: the first-visit card on the home page H (one slim strip, so the doorways stay on the first screen) + its coach marks */
  hwT: { zh: '👋 第一次来？花 30 秒认一下：这是什么、从哪开始、怎么操作。', en: '👋 First time here? 30 seconds: what this is, where to start, how it works.' },
  hwGo: { zh: '👀 带我认一遍（7 步）', en: '👀 Show me (7 steps)' },
  hwClose: { zh: '关闭（菜单里的「👋 新手入门」可以再看）', en: 'Close (see it again with “👋 Getting started” in the menu)' },
  h1: { zh: '<b>这是什么</b>：用大白话、图和小实验，一层层看懂 AI——怎么用、怎么搭、为什么行。不用会编程。', en: '<b>What this is</b>: plain words, pictures and small labs that explain AI layer by layer: how to use it, how to build with it, why it works. No coding needed.' },
  h2: { zh: '<b>从哪开始</b>：没想好就点 🎬 跟着一句话走一遍；给孩子看就走 🧒 小学生路线（6 站）。', en: '<b>Where to start</b>: not sure? Tap 🎬 to follow one sentence all the way. For children, take the 🧒 kids’ route (6 stops).' },
  h3: { zh: '<b>或者按需要选</b>：6 个「我想…」各通往一个专区，专区里再 ⬇ 往下钻到细节站，⬆ 回上一层。', en: '<b>Or pick by need</b>: each of the 6 “I want to…” doors leads to a zone; inside it, ⬇ drills down to detail stops and ⬆ goes back up.' },
  h5: { zh: '<b>怎么操作</b>：进了站，最下面一排是 📑 目录、🧪 实验（动手玩）、✅ 小测（做完点亮一站）、✨ 进度、下一站 ›。图里的方块都能点开看。', en: '<b>How it works</b>: inside a stop, the bottom row has 📑 Contents, 🧪 Labs (hands-on), ✅ Quiz (finish it to light the stop), ✨ Progress and Next ›. Every box in a picture can be tapped.' },
  /* the chip row's title */
  crumb: { zh: '路标', en: 'Signpost' },
} satisfies Record<string, Bi>;

/** the kids' route: the stop and the one lab to play there. Why these: see O.rWhy. */
export const ROUTE: [string, string][] = [['T1', 'walkCard'], ['T2', 'labAgent'], ['T3', 'labNext'], ['T4a', 'labAttn'], ['T6', 'labDiff'], ['T7', 'labGw']];
/** short names for the route labs (the lab cards' own titles are long) */
export const LABN: Record<string, Bi> = {
  walkCard: { zh: '跟着一句话走一遍', en: 'Follow one sentence all the way' },
  labAgent: { zh: 'Agent 沙盒', en: 'Agent sandbox' },
  labNext: { zh: '接龙大师', en: 'Next-word master' },
  labAttn: { zh: '注意力游乐场', en: 'Attention playground' },
  labDiff: { zh: 'AI 画画游乐场', en: 'AI drawing playground' },
  labGw: { zh: '强化学习迷宫', en: 'Reward maze' },
};
/* R25/R26: the station count follows TABORDER (27 with 🔌 Api, 💻 Loc, 🤖 Job, 🧰 Skl and 🛠 Bld) */
for (const v of Object.values(O) as Bi[]) { if (v && typeof v.zh === 'string') { v.zh = v.zh.split('{NS}').join(String(TABORDER.length)); v.en = v.en.split('{NS}').join(String(TABORDER.length)); } }
