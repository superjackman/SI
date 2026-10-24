/* R24 plain openings for the second round of "⚠️ 容易混淆" cards (m2/content/ext/m12.ts). keep: the comparison stays visible under it. */
import type { PCard } from './types';

const k = (zh: string, en: string): PCard => ({ keep: true, zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
export const CF2_PLAIN: Record<string, Record<string, PCard>> = {
  K1: {
    cfDerivGrad: k('想象你在调一台有很多旋钮的机器。只有一个旋钮时，“拧一点，结果变多少”就是<b>导数</b>。有很多旋钮时，只拧其中一个、别的不动，变多少就是这个旋钮的<b>偏导数</b>。把每个旋钮的偏导数写成一排，就是<b>梯度</b>。',
      'Imagine a machine with many knobs. With one knob, “turn it a little, how much does the result change” is the <b>derivative</b>. With many knobs, turn just one and leave the rest: that change is the knob’s <b>partial derivative</b>. Write every knob’s partial derivative in a row and you have the <b>gradient</b>.'),
  },
  K2: {
    cfDotCos: k('两支箭头比一比像不像。<b>点积</b>既看方向，也看箭头有多长：一样的方向，箭头越长分数越大。<b>余弦相似度</b>先把两支箭头都剪成一样长，再比，所以只看方向。',
      'Compare two arrows. The <b>dot product</b> looks at both direction and length: same direction, longer arrows, bigger score. <b>Cosine similarity</b> first trims both arrows to the same length, then compares, so only direction counts.'),
    cfTensor: k('一行数叫<b>向量</b>，像一排座位；一张有行有列的表叫<b>矩阵</b>，像整个教室的座位表；好几张表摞在一起（或者更多层）就叫<b>张量</b>，像整栋楼每间教室的座位表。',
      'A row of numbers is a <b>vector</b>, like one row of seats; a table with rows and columns is a <b>matrix</b>, like a classroom’s seating plan; several tables stacked up (or more levels) is a <b>tensor</b>, like the seating plans of every classroom in the building.'),
  },
  K3: {
    cfLossAcc: k('考试时，<b>准确率</b>只问“答对没有”。<b>损失</b>还问“你有多确定”：答对了但心里没底，损失还不小；答对又很有把握，损失才小。训练要用损失，因为它能一点点变好，准确率只会跳着变。',
      'In a test, <b>accuracy</b> only asks “right or wrong?”. <b>Loss</b> also asks “how sure were you?”: right but unsure still costs something; right and confident costs little. Training uses loss because it can improve little by little, while accuracy only jumps.'),
    cfCeKl: k('天气本来就说不准，这份“说不准”谁也去不掉。<b>交叉熵</b>是你按自己的猜法，总共有多意外；<b>KL 散度</b>只算“因为你猜得不准，<b>多出来</b>的那部分意外”。猜得和真实一样准，KL 就是 0。',
      'Weather is uncertain anyway, and nobody can remove that part. <b>Cross-entropy</b> is how surprised you are in total with your own guesses; the <b>KL divergence</b> counts only the <b>extra</b> surprise caused by guessing wrong. Guess exactly like reality and KL is 0.'),
  },
  K4: {
    cfLrGrad: k('下山时，<b>梯度</b>像脚下的坡：告诉你哪边低、有多陡，每走一步都要重新看。<b>学习率</b>是你自己定的步子大小。坡陡、步子大，一步就走得远。',
      'Walking downhill, the <b>gradient</b> is the slope under your feet: which way is lower and how steep, re-checked at every step. The <b>learning rate</b> is the stride you choose. Steep slope and long stride means one big step.'),
    cfBatch: k('一本练习册有 1000 道题。每次拿 32 道来做、对完答案改一次，这一叠叫一<b>批</b>，改一次叫一<b>步</b>；整本做完一遍叫一<b>轮</b>。所以一轮要 32 步（最后一叠只有 8 道）。',
      'A workbook has 1000 questions. Each time you do 32, check them and adjust once: that pile is a <b>batch</b> and the adjustment a <b>step</b>; finishing the whole book once is an <b>epoch</b>. So one epoch takes 32 steps (the last pile has only 8).'),
    labBatch: k('拖动三个滑块：一共几道题、一次做几道、做几遍，看看一共要改几次。',
      'Drag the three sliders: how many questions, how many at a time, how many passes, and see how many updates that makes.'),
  },
  K5: {
    cfBackGd: k('<b>反向传播</b>像量坡度：从结果往回查，算出每个旋钮该往哪边拧、拧多少。<b>梯度下降</b>像真的去拧：按算出来的结果，把每个旋钮拧一点。先量，再拧。',
      '<b>Backpropagation</b> is measuring the slope: trace back from the result to work out which way, and how much, each knob should turn. <b>Gradient descent</b> is actually turning them a little by those numbers. Measure first, then turn.'),
  },
  Uc: {
    cfToolMcpSkill: k('<b>工具</b>像一把螺丝刀，能干一件具体的事；<b>MCP</b> 像墙上的标准插座，各种工具都能插上来用；<b>Skill</b> 像一本操作手册，写着“这种活怎么干”，要干的时候才翻开。',
      'A <b>tool</b> is like a screwdriver: it does one specific job. <b>MCP</b> is like a standard wall socket that all kinds of tools can plug into. A <b>Skill</b> is like a how-to manual for a kind of job, opened only when that job comes up.'),
  },
  Ua: {
    cfChatCode: k('<b>对话助手</b>像电话那头的老师傅：你问，他告诉你怎么改，动手的是你。<b>编程 Agent</b> 像请师傅上门：他自己打开你的项目、改文件、试一试能不能用，最后把改了哪些给你看，由你点头。',
      'A <b>chat assistant</b> is like an expert on the phone: you ask, they tell you what to change, and you do it. A <b>coding agent</b> is like the expert coming over: they open your project, edit the files, try it out, then show you what changed and you approve.'),
  },
  N: {
    cfSplit: k('题目分三份：<b>作业</b>拿来学，<b>小测</b>用来看学得怎么样、该不该停，<b>期末考</b>最后只考一次。期末题不能提前看，不然分数就不算数了。',
      'Split the questions three ways: <b>homework</b> to learn from, <b>quizzes</b> to check progress and decide when to stop, and <b>one final exam</b> at the end. You must not peek at the final, or the score means nothing.'),
    cfFit: k('<b>欠拟合</b>像还没学会：作业都错一堆。<b>过拟合</b>像死记硬背：作业全对，换一道新题就不会。看作业和小测的成绩差多少，就知道是哪一种。',
      '<b>Underfitting</b> is not having learned yet: lots of homework wrong. <b>Overfitting</b> is rote memorising: all homework right, but a new question fails. The gap between homework and quiz scores tells you which.'),
  },
  T6: {
    cfDiffAr: k('写文章是<b>一个字一个字往后写</b>，这是自回归。扩散画图像<b>擦起雾的玻璃</b>：一开始全是雪花点，每一步把整面玻璃都擦清楚一点，最后出现一张图。',
      'Writing goes <b>one word after another</b>: that is autoregressive. Diffusion draws like <b>wiping a fogged window</b>: it starts as pure static, and every step clears the whole pane a little until a picture appears.'),
  },
};
