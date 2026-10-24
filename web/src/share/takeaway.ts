/* R19 share card: one plain-language line per stop — what "I just learned" means there. Written for a primary-school
   reader and kept to one idea; most are shortened from the stop's own plain opening (m2/plain/<stop>.ts, first card).
   Lives in the lazy share-card chunk only. The unit guard checks all 22 stops have both languages. */
import type { Bi } from '../i18n/types';

export const TAKEAWAY: Record<string, Bi> = {
  T1: { zh: '你对 AI 说一句话，背后有六层像餐厅一样接力干活：有人点菜、有人安排、有人掌勺、有人采购。', en: 'One sentence to an AI sets six layers to work, like a restaurant: someone orders, someone plans, someone cooks, someone buys the food.' },
  T2: { zh: '大模型只会动嘴不会动手；Agent 给它配上工具，它就能上网、点按钮，真的把事办成。', en: 'A large model can talk but has no hands; an Agent gives it tools, so it can go online, press buttons and get things done.' },
  T3: { zh: '大模型在玩词语接龙：猜“下一个词最可能是什么”，接上去，再猜下一个。', en: 'A large model plays a word-chain game: guess the most likely next word, add it, then guess again.' },
  N: { zh: '神经网络是很多小零件搭起来的：每个零件把数字加一加、乘一乘，再决定要不要往下传。', en: 'A neural network is built from tiny parts: each one adds and multiplies some numbers, then decides whether to pass them on.' },
  T4: { zh: '大模型的中间是很多个一模一样的“块”，像积木一样一层层摞起来。', en: 'The middle of a large model is many identical “blocks”, stacked up like building bricks.' },
  T4a: { zh: '注意力像在图书馆找书：拿着问题对标签，越对得上的书，就读得越认真。', en: 'Attention is like finding books in a library: match your question to each label, and read the best matches most carefully.' },
  T4b: { zh: '每个词回到座位自己想一想：一群“小探测器”各认一种模式，认出来的才亮灯。', en: 'Each word goes back to its desk to think: lots of little “detectors” each look for one pattern, and only the ones that find it light up.' },
  T5: { zh: '省钱的窍门：每次只请几位“专家”干活，让大模型算得更便宜、更快，还能读更长的文章。', en: 'Ways to save: only a few “experts” work each time, so a large model runs cheaper and faster and can read longer texts.' },
  T6: { zh: '大模型本来只认识文字；把图片和声音也变成一串串数字，它就能看图、听声。', en: 'A large model only knows text at first; turn pictures and sounds into numbers too, and it can see and hear.' },
  T7: { zh: '模型的本事是练出来的：先大量自学，再照着老师模仿，最后做对有表扬、做错要改。', en: 'A model’s skills are practised: first lots of self-study, then copying a teacher, and finally praise when right and corrections when wrong.' },
  T8: { zh: '一张大地图：用 AI 做事 → 模型 → 模型里的零件 → 看图听声 → 怎么练出来 → 用什么机器跑。', en: 'One big map: getting things done with AI → the model → its parts → seeing and hearing → how it is trained → the machines it runs on.' },
  U: { zh: 'Agent 像一个能动手的助手：用法很多，里面其实都是同一个东西。', en: 'An Agent is like a helper that can actually do things: many ways to use it, one thing inside.' },
  Ua: { zh: '和 Agent 一起干，就像带一个徒弟：每一步你都看得见，要紧的事你点头它才做。', en: 'Working with an Agent is like having an apprentice: you see every step, and it does the important things only after you say yes.' },
  Ub: { zh: '让 Agent 自己干，就像把作业交给别人做：交代清楚，回头再认真检查。', en: 'Letting an Agent work alone is like handing a job to someone: explain it clearly, then check it carefully later.' },
  Uc: { zh: '模型会什么，练好时就定了；装上工具和技能，它就能学会新本事。', en: 'What a model knows is fixed once it is trained; give it tools and skills, and it can do new things.' },
  Ud: { zh: '助手只看得到你给它的东西：把要求说清楚、材料给全，交回来的活要对着清单检查。', en: 'The helper only sees what you give it: say clearly what you want, give it everything it needs, and check the result against a list.' },
  Up: { zh: '一本按用途分好类的 AI 产品目录，每个都附官网链接和一句话介绍。', en: 'A catalogue of AI products sorted by use, each with its official website and a one-line description.' },
  Api: { zh: 'API 让程序替你问模型：密钥像钱包要藏好，按输入、输出的词元数付钱。', en: 'An API lets your program ask the model for you: guard the key like a wallet, and pay by input and output tokens.' },
  Loc: { zh: '模型能下载到自己电脑上跑：先算内存装不装得下，再挑工具和文件。', en: 'Models can run on your own computer: first check that it fits in memory, then pick a runner and a file.' },
  Job: { zh: '找 AI 干活像请帮手：先说清要干什么，选陪你干还是自己干，最后自己验收。', en: 'Getting AI to work is like hiring a helper: say what the job is, choose with-you or on-its-own, then check the result yourself.' },
  Skl: { zh: '缺“手”装 MCP 服务器，缺“方法”装技能包；从官方来源装，只给需要的权限。', en: 'Missing a hand: an MCP server; missing a method: a skill pack. Install from official sources and grant only what it needs.' },
  Bld: { zh: '每个 Agent 都是一个小循环：模型想、程序跑工具、结果交回去再想；用平台拖或者自己写都行。', en: 'Every agent is a small loop: the model thinks, your program runs a tool, the result goes back; drag it on a platform or write it yourself.' },
  K1: { zh: '训练 AI 就像拧成千上万个小旋钮；导数告诉我们每个旋钮往哪边拧，错误会变小。', en: 'Training an AI is like turning thousands of little knobs; derivatives tell us which way to turn each one so the mistakes get smaller.' },
  K2: { zh: '电脑不认识字，只认识数：一个词就是一串数，矩阵就是一次把很多数一起变一变。', en: 'Computers only understand numbers: a word becomes a list of numbers, and a matrix changes many numbers at once.' },
  K3: { zh: 'AI 说话是在一遍遍“猜下一个词”，概率就是给每个可能的词打分：机会有多大。', en: 'When an AI talks it is guessing the next word again and again; probability scores how likely each word is.' },
  K4: { zh: '训练模型像蒙着眼睛下山：感觉哪边最陡，就往那边迈一小步，再感觉、再迈。', en: 'Training a model is like walking down a hill blindfolded: feel which way is steepest, take a small step, feel again, step again.' },
  K5: { zh: '用前面学的坡度、链式法则、机会大小和数表，看懂真实模型里最重要的几条公式。', en: 'Slopes, the chain rule, chances and tables of numbers from earlier stops explain the most important formulas in real models.' },
};
