/* R37: the knowledge tree. The 27 stations sit on six levels, from what you see and do (L0) down to the math drawn as
   shapes (L5). Every station has one parent (the bigger thing it is a part of), a "go deeper" station on a lower level
   (so ⬇ from anywhere ends at the math), and two lines written from its own idea page: how its parts work together, and
   why they must. Pure data (no DOM), its own lazy chunk; texts are 'zh|en' like the zone files. */
import { x, type S } from './types';
import type { Tx } from '../reg';

export interface Lv { n: Tx; s: Tx; c: string }
/** the six levels, top (the user's view) to bottom (math) */
export const LV: Lv[] = ([
  ['你看到的|What you see', '你用 AI 做事的样子|How you use AI', '#8b5cf6'],
  ['系统的部件|The parts', '一个 Agent 由哪些部分组成|What an agent is made of', '#6366f1'],
  ['大模型整体|The model', '模型怎么读、怎么学|How the model reads and learns', '#3b82f6'],
  ['模型的结构|Its structure', '模型由什么搭起来|What the model is built from', '#ec4899'],
  ['内部机制|Inner workings', '每一块里面怎么算|How each block computes', '#14b8a6'],
  ['数学 · 图形|Math as shapes', '用箭头、山坡和骰子看懂计算|Arrows, slopes and dice', '#f59e0b'],
] as [S, S, string][]).map(([n, s, c]) => ({ n: x(n), s: x(s), c }));

type Raw = [lv: number, up: string, deep: string, co: S, why: S];
const RAW: Record<string, Raw> = {
  T1: [0, '', 'T2', '你说话 → App 收下 → Agent 拆成小步 → 大模型猜词|You talk → the app takes it → the agent splits it into steps → the model guesses words', '每层只会一件事，叠起来才能把一句话变成做完的事。|Each layer does one job; only stacked together do they turn a sentence into work done.'],
  U: [0, 'T1', 'T2', '先定权限 → 选“一起干”或“自己干” → 检查结果|Set what it may touch → work together or let it work alone → check the result', '权限管住风险，方式决定你看多少，检查兜底。|Permissions limit the risk, the way decides how much you watch, the check catches mistakes.'],
  Ua: [0, 'U', 'T2', '你在聊天框说 → 它在文档或命令窗口里改 → 你马上看|You say it in the chat → it edits in your document or command window → you look right away', '小步改、马上看，错了也能当场改回来。|Small steps you see at once can be fixed on the spot.'],
  Ub: [0, 'U', 'T2', '你交代 → 云端助手在隔开的地方做 → 交作业给你检查|You hand it over → a cloud helper works in a separate space → it hands in its work for you to check', '你不在旁边，只能靠隔开的地方和“交作业”保证安全和质量。|You are not watching, so the separate space and the hand-in keep it safe and good.'],
  Ud: [0, 'U', 'T2', '要做什么 + 给材料 + 怎样算好 → 它做 → 你检查|What you want + the material + what good looks like → it works → you check', '少说一件，它就只能猜；猜错了要靠检查发现。|Leave one out and it has to guess; checking catches the wrong guesses.'],
  Up: [0, 'T1', 'Api', '看能做什么 → 看数据去哪 → 看花多少钱 → 挑一个|What it can do → where your data goes → what it costs → pick one', '只看一点会挑错：本事、隐私和价钱要一起比。|One point alone misleads; ability, privacy and price must be weighed together.'],
  Job: [0, 'T1', 'Skl', '只要答案用聊天助手，要动手用 Agent，要天天做就定时|Answers → a chat helper; hands-on → an agent; every day → a timer', '事情不同，要的帮手就不同；再用底线管住花钱、删和发。|Different jobs need different helpers; the bottom lines guard money, deleting and sending.'],
  T8: [0, 'T1', 'T3', '应用 → Agent → 模型 → 零件 → 训练 → 算力|App → agent → model → parts → training → computing', '每一层都靠下面一层：串起来才看得懂整个 AI。|Each layer stands on the one below; linked up they explain the whole of AI.'],
  T2: [1, 'T1', 'T3', '想 → 做 → 看，转一圈又一圈|Think → act → look, round and round', '模型只会写字，工具才会动手；看了结果才知道下一步。|The model only writes, tools act, and seeing the result decides the next step.'],
  Uc: [1, 'T2', 'T3', '技能卡给步骤 → MCP 插口接上 → 工具动手|A skill card gives the steps → the MCP socket connects → the tool does it', '有手没方法会乱做，有方法没插口就接不上。|Hands without a method fumble; a method without a socket cannot connect.'],
  Skl: [1, 'T2', 'T3', '技能（方法）定先做什么 → 工具（手）去碰文件和网页|The skill (method) decides what to do first → the tool (hand) touches files and pages', '方法和手分开，才能只给它需要的权限。|Keeping the method and the hands apart lets you give only the access it needs.'],
  Bld: [1, 'T2', 'T3', '模型（大脑）想 → 工具（手）做 → 看结果，再想|The model (brain) thinks → the tool (hand) acts → look at the result, think again', '少了大脑不会选，少了手做不了，少了循环只走一步。|No brain, no choice; no hands, no action; no loop, only one step.'],
  Api: [1, 'T2', 'T3', '程序带着钥匙发请求 → 大电脑上的模型算 → 回信，按词块收钱|Your program sends a request with its key → the model runs on a big computer → a reply comes back, priced by tokens', '钥匙证明是你，请求说清要什么，词块决定价钱。|The key proves it is you, the request says what you want, the tokens set the price.'],
  Loc: [1, 'T2', 'T3', '模型装进内存 → 显卡计算 → 在你电脑上回答|The model loads into memory → the graphics chip computes → it answers on your computer', '内存装不下就跑不了，显卡慢回答就慢。|If it does not fit in memory it cannot run; a slow chip gives slow answers.'],
  T3: [2, 'T2', 'T4', '切成词块 → 给每个可能的词打分 → 挑一个接上，再猜|Cut into tokens → score every possible next word → pick one, add it, guess again', '它一次只猜一个词，接起来才成一整段回答。|It guesses one word at a time; chained together they make a whole answer.'],
  T6: [2, 'T3', 'T4', '图片和声音切成小块 → 和字块排成一行 → 模型一起读|Pictures and sound are cut into pieces → lined up with text pieces → the model reads them together', '模型只会读一排小块，所以图和声音也要先变成小块。|The model only reads a row of pieces, so pictures and sound must become pieces too.'],
  T7: [2, 'T3', 'N', '读书 → 学做题 → 听评价，猜错了就调一调|Read → practise answers → hear feedback; adjust after each wrong guess', '读书学会说话，做题学会回答，评价学会答得好。|Reading teaches language, examples teach answering, feedback teaches answering well.'],
  N: [3, 'T3', 'K1', '神经元把数字加起来 → 够大就亮 → 一层传给下一层|A neuron adds up numbers → lights up if the sum is big enough → passes it on to the next layer', '一个开关太简单，很多层连起来才能认出复杂的东西。|One switch is too simple; many layers together can recognise complex things.'],
  T4: [3, 'T3', 'T4a', '先看看别人（注意力）→ 再自己想（小网络）→ 一块块叠上去|Look at the others (attention) → think alone (a small network) → block after block', '看别人得到上下文，自己想用上知识，叠起来理解越来越深。|Looking gives context, thinking uses knowledge, stacking deepens the understanding.'],
  T4a: [4, 'T4', 'K2', '提问去比每张名片 → 配上了就拿走对方的内容|Each question is compared with every name card → where they match, the content is taken', '提问说要找什么，名片说“我是什么”，内容才是要拿的东西。|The question says what to look for, the card says what each word is, the content is what gets taken.'],
  T4b: [4, 'T4', 'K3', '每个词想一想 → 加回原来的信息 → 给下一个词打分|Each word thinks → the result is added back → every possible next word is scored', '加回去不丢原来的信息，打了分才能挑出下一个词。|Adding back keeps the original; the scores let it choose the next word.'],
  T5: [4, 'T4', 'K3', '每个词只找两个专家，算过的存起来，数字存短一点|Each word visits only two experts; past work is kept; numbers are stored shorter', '不让每一部分每次都算一遍，才能又快又省。|Not making every part compute every time is what makes it fast and cheap.'],
  K1: [5, 'N', 'K4', '放大曲线 → 几乎是直的 → 量出陡度 → 一节套一节相乘|Zoom into a curve → it is almost straight → measure the steepness → links multiply', '知道每一处有多陡，才知道往哪边走错误会变小。|Knowing how steep each spot is tells which way makes the error smaller.'],
  K2: [5, 'T4a', 'K5', '向量是箭头 → 点积是影子 → 矩阵把整张格子拉、转|A vector is an arrow → the dot product is a shadow → a matrix stretches and turns the whole grid', '模型里的词都是箭头：比方向和变形状就是它在算的东西。|Words in the model are arrows: comparing directions and reshaping grids is what it computes.'],
  K3: [5, 'T4b', 'K5', '分数变成概率 → 全部加起来是 1 → 量一量有多意外|Scores become chances → all chances add up to 1 → measure how surprising', '变成概率才能挑词，量意外才知道猜得像不像。|Chances let it pick a word; surprise tells how good the guess was.'],
  K4: [5, 'T7', 'K5', '看哪边往下 → 走一步（步子 = 学习率）→ 再看|See which way is down → take a step (step size = learning rate) → look again', '步子太大会跳过谷底，太小走不到。|Too big a step jumps over the bottom; too small never gets there.'],
  K5: [5, 'K1', '', '数字往前走过每块石头 → 错误从最后一块往回传 → 每块各自调|Numbers go forward over each stone → the error goes back from the last → each stone adjusts', '往回传，才能告诉很深处的每一块该改多少。|Passing it back is how every deep stone learns how much to change.'],
};
export interface Node { s: string; lv: number; up: string; deep: string; co: Tx; why: Tx }
export const NODES: Record<string, Node> = Object.fromEntries(Object.entries(RAW).map(([s, [lv, up, deep, co, why]]) => [s, { s, lv, up, deep, co: x(co), why: x(why) }]));
export const node = (s: string): Node | undefined => NODES[s];
/** the stations on one level, in the classic order of `order` */
export const onLevel = (lv: number, order: string[]) => order.filter((s) => NODES[s]?.lv === lv);
/** the tree children of a station */
export const kids = (s: string) => Object.values(NODES).filter((n) => n.up === s).map((n) => n.s);
/** the path from the root (T1) down to s */
export function path(s: string): string[] { const out: string[] = []; for (let k: string | undefined = s; k && out.length < 30; k = NODES[k]?.up) out.unshift(k); return out; }
/** following ⬇ from s: the chain of deeper stations down to the math */
export function chain(s: string): string[] { const out = [s]; for (let k = NODES[s]?.deep; k && out.length < 30; k = NODES[k]?.deep) out.push(k); return out; }
