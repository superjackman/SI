/* R15 plain-language layer for T7 (training and reinforcement learning). No KaTeX here; the labs whose controls use
   letters (ε, γ, α, N, D, C, k, Δ, β, W, t, c, n) say what each letter is in their plain line. */
import type { PStation } from './types';
import { B } from './types';

const T7: PStation = {
  cards: {
    c_T7_0: {
      keep: true,
      zh: `<p>模型的本事不是一条条写进去的，是<b>练出来的</b>，就像学说话：先听大量的话自己琢磨（自学），再照着老师的示范练（模仿），最后做对了有表扬、做错了要改（奖励）。点图里的方块看每一段。</p>`,
      en: `<p>A model’s skills are not written in rule by rule; they are <b>practised</b>, like learning to talk: first listen to a huge amount and work things out yourself (self-study), then copy a teacher’s examples (imitation), and finally get praise when right and corrections when wrong (rewards). Tap the boxes to see each stage.</p>`,
    },
    nnCard: {
      keep: true,
      zh: `<p>神经网络像一台<b>有很多旋钮的机器</b>：放进数字，吐出数字。一开始旋钮是乱拧的，每做错一道题，就算出每个旋钮该往哪边拧一点点，练很多遍就准了。下面可以调一个“小格子”（神经元）的旋钮，也可以看整台机器学着画分界线。</p>`,
      en: `<p>A neural network is like a <b>machine with lots of knobs</b>: numbers go in, numbers come out. At first the knobs are set at random; after each wrong answer we work out which way to turn each knob a tiny bit, and after lots of practice it gets accurate. Below you can turn the knobs of one “little cell” (a neuron) and watch the whole machine learn to draw a dividing line.</p>`,
      more: B(`“往哪边拧”是用反向传播算出来的；它保证往附近的下坡走，但不保证走到最低点。`,
        `“Which way to turn” is worked out by backpropagation; it guarantees heading downhill nearby, but not reaching the very lowest point.`),
    },
    c_T7_1: {
      zh: `<p>自学的窍门是<b>自己给自己出题</b>：把一句话的后半截遮住，猜被遮住的词，答案就在原文里，不用老师批改。一篇文章能出成百上千道这样的题。</p>`,
      en: `<p>The trick of self-study is <b>setting your own questions</b>: cover the end of a sentence and guess the hidden word; the answer is in the original text, so no teacher is needed to mark it. One article gives hundreds or thousands of such questions.</p>`,
    },
    c_T7_2: {
      zh: `<p>照着示范学，就像<b>抄写范文</b>：人写好“问题 → 好回答”，模型照着学回答的格式和习惯，比如什么时候该去查天气。</p>`,
      en: `<p>Learning from examples is like <b>copying model essays</b>: people write “question → good answer”, and the model learns the format and habits of answering, such as when it should go and look up the weather.</p>`,
    },
    rlCard: {
      keep: true,
      zh: `<p>强化学习像<b>训练小狗</b>：做对了给零食，做错了没有，它慢慢就知道怎么做最划算。下面的小机器人在迷宫里乱走，到终点加分、掉坑扣分，每走一步也扣一点。ε 是“多爱乱试”，γ 是“多看重以后的分”，α 是“每次改多少”。</p>`,
      en: `<p>Reinforcement learning is like <b>training a puppy</b>: a treat when it gets it right, nothing when it doesn’t, and it slowly learns what pays off. Below, a little robot wanders a maze: points for reaching the goal, points lost for falling in a pit, and a small cost for every step. ε is “how much it likes to try random moves”, γ is “how much it values later points”, and α is “how much it changes each time”.</p>`,
    },
    rlhfCard: {
      keep: true,
      zh: `<p>“好回答”很难写成规则，但人很容易<b>比较两个回答哪个更好</b>。把很多这样的比较教给一个“评委模型”，再让大模型去讨评委喜欢，同时拉着它别跑偏太远。你来当一次标注员，点你更喜欢的回答。</p>`,
      en: `<p>A “good answer” is hard to write down as rules, but people can easily <b>compare two answers and pick the better one</b>. Many such comparisons train a “judge model”, and the large model then learns to please the judge while being held back from drifting too far. Be the labeller: tap the answer you prefer.</p>`,
      more: B(`模型可能学会讨好评委（啰嗦、显得自信但不一定对），这叫奖励投机。数学、代码这类能自动判对错的题，可以直接用“对不对”当奖励。`,
        `The model may learn to please the judge (wordy, confident-sounding but not necessarily right), which is called reward hacking. For maths and code, where answers can be checked automatically, “right or wrong” itself can be the reward.`),
    },
    c_T7_3: {
      zh: `<p>练出大模型要两样“燃料”：<b>很多很多好的练习材料</b>，和<b>很多很多台算得快的机器</b>。一般来说越多越好，但好处会越来越小，这是试出来的规律，不是定律。</p>`,
      en: `<p>Training a large model takes two “fuels”: <b>huge amounts of good practice material</b> and <b>huge numbers of fast machines</b>. Generally more is better, but the gains get smaller; this is a pattern found by experiment, not a law.</p>`,
    },
    xPar: {
      zh: `<p>一台机器装不下、也算不完，就<b>分给很多台机器</b>：可以每台都做同样的事、分不同的题（像全班同时做不同的卷子）；也可以把一个大活切开，每台做一部分（像流水线）。</p>`,
      en: `<p>When one machine can neither hold nor finish the job, it is <b>shared among many machines</b>: each can do the same work on different questions (like a class doing different test papers at once), or one big job can be cut up with each machine doing a part (like an assembly line).</p>`,
    },
    xData: {
      zh: `<p>练习材料像<b>淘米</b>：从网上抓来的文字很多但很杂，要去掉广告和重复的、挑出写得好的，再按比例混好。也可以让已有的模型帮忙编一些练习题。</p>`,
      en: `<p>Preparing practice material is like <b>washing rice</b>: text grabbed from the web is plentiful but messy, so ads and repeats are removed, well-written text is picked out, and everything is mixed in the right proportions. Existing models can also help write extra practice questions.</p>`,
    },
    xAgentRl: {
      zh: `<p>让 AI 学“把事办成”：给它一个真实的任务（比如修好一段程序），它自己查、改、试，<b>测试通过就有奖励</b>。和迷宫里的小机器人是一个道理，只是迷宫换成了真任务。</p>`,
      en: `<p>Teaching an AI to “get the job done”: give it a real task (such as fixing a piece of code); it looks around, edits and tries, and <b>gets a reward when the tests pass</b>. Same idea as the maze robot, with the maze replaced by a real task.</p>`,
    },
    xSafety: {
      zh: `<p>除了在应用外面加护栏，训练时也要教模型<b>守规矩</b>：请人专门扮坏人来找漏洞，把找到的问题拿去再练；或者写一份原则清单，让模型照着原则检查、改正自己的回答。坏人的招数会不断翻新，所以两层保护都要有。</p>`,
      en: `<p>Besides guard rails around the app, training also teaches the model to <b>follow the rules</b>: people play the bad guy on purpose to find gaps, and the problems found are used for more practice; or a list of principles is written and the model checks and fixes its own answers against it. Bad actors keep inventing new tricks, so both layers of protection are needed.</p>`,
    },
    xEval: {
      zh: `<p>排行榜分数像<b>考试成绩</b>：如果考题提前泄露进了练习材料，分数就会虚高；考法不同，分数也不同。最靠谱的办法是用你自己的一小套真实任务考一考。</p>`,
      en: `<p>Leaderboard scores are like <b>exam results</b>: if the questions leaked into the practice material, the scores are inflated, and different exam rules give different scores. The most reliable way is to test with a small set of your own real tasks.</p>`,
    },
    xScale: {
      zh: `<p>人们发现一个规律：模型越大、材料越多、机器越多，错误就<b>按一个很稳的比例</b>往下降，所以能先用小模型试，再估计大模型会怎样。花同样的钱，模型大小和材料多少最好一起长。</p>`,
      en: `<p>People found a pattern: as models, material and machines grow, the error falls <b>at a very steady rate</b>, so small models can be tried first to estimate how big ones will do. For the same money, model size and amount of material should grow together.</p>`,
      more: B(`这个规律预测的是错误率，不直接告诉你某个本事什么时候出现，也不算用模型时的花费。`,
        `The pattern predicts the error, not when a particular skill will appear, and it leaves out the cost of using the model.`),
    },
    xReg: {
      zh: `<p>只会背题的学生，换一套题就不会了。防止模型<b>死记硬背</b>的办法有：练的时候随机让一部分“格子”休息、让旋钮别拧得太大，以及在“没见过的题”上成绩开始变差时就停。</p>`,
      en: `<p>A pupil who only memorises answers fails on a new test. Ways to stop a model <b>learning by rote</b>: randomly rest some “cells” during practice, keep the knobs from being turned too far, and stop as soon as the score on “unseen questions” starts getting worse.</p>`,
    },
    xPool: {
      zh: `<p>看图时，先找小图案（边、角），再把图<b>缩小一点、每一小块只留最明显的</b>，一层层往上，就能从边和角认出纹理、部件，最后认出整个物体。东西挪一点点位置，也不太影响结果。</p>`,
      en: `<p>When looking at a picture, small patterns (edges, corners) are found first, then the picture is <b>shrunk a little, keeping only the strongest signal in each small patch</b>. Layer by layer, edges and corners lead to textures, parts and finally whole objects. Moving something slightly hardly changes the result.</p>`,
    },
    xTrainKit: {
      zh: `<p>三个训练和打分时常用的小算式，下面各有一个实验室：怎么按“A 比 B 好”来调模型；练习时<b>步子先慢慢放大、再慢慢收小</b>；以及“多试几次，至少做对一次”的概率怎么算。</p>`,
      en: `<p>Three small formulas often used in training and scoring, each with a lab below: how to adjust a model from “A is better than B”; making the <b>step size grow slowly, then shrink slowly</b> during practice; and how to work out the chance of “at least one right in several tries”.</p>`,
    },
    labChin: {
      zh: `<p>N 是模型大小（参数个数），D 是练习材料多少（词数），C 是用掉的算力，L 是错误（损失），k 让模型比最优值大或小几倍。拖动看看同样的算力下怎么分最划算（公式来自论文，不是对产品的实测）。</p>`,
      en: `<p>N is the model size (number of parameters), D is the amount of practice material (words), C is the computing used, L is the error (loss), and k makes the model a few times bigger or smaller than the best size. Drag to see the best way to split the same computing (the formula is from a paper, not a measurement of any product).</p>`,
    },
    labFit: {
      zh: `<p>用一条曲线去穿过蓝点：曲线太简单穿不好，太复杂会把乱抖也背下来；步子（学习率）太大会飞出去。看橙色的“没见过的题”误差什么时候开始变大（示例数据）。</p>`,
      en: `<p>Fit a curve through the blue dots: too simple a curve misses them, too complex a curve memorises the wobbles too, and too big a step (learning rate) flies off. Watch when the orange “unseen questions” error starts to grow (example data).</p>`,
    },
    labGw: {
      zh: `<p>自己摆墙、陷阱和饼干，看小机器人怎么学。ε 是“多爱乱试”，γ 是“多看重以后的分”。放块饼干在起点旁边，看它会不会只顾刷分不去终点。</p>`,
      en: `<p>Place walls, traps and cookies yourself and watch the robot learn. ε is “how much it likes to try random moves”, γ is “how much it values later points”. Put a cookie near the start and see whether it just farms points instead of going to the goal.</p>`,
    },
    labPool: {
      zh: `<p>把一张小图往右挪几格，看缩小后的结果变了多少：挪得比小窗口少，结果几乎不变（数值是示意）。</p>`,
      en: `<p>Shift a small picture a few squares to the right and see how much the shrunk result changes: shifts smaller than the little window barely change it (the values are illustrative).</p>`,
    },
    labDpo: {
      zh: `<p>Δ 是“现在的模型比原来更偏爱这个回答多少”。好回答的 Δ 比差回答的大得越多，损失越小；β 控制这个差距有多“值钱”（数值是示意）。</p>`,
      en: `<p>Δ is “how much more the current model prefers this answer than the original did”. The more the good answer’s Δ exceeds the bad answer’s, the smaller the loss; β sets how much that gap “counts” (the values are illustrative).</p>`,
    },
    labSched: {
      zh: `<p>W 是“热身”多少步，t 是现在第几步，c 是梯度最长允许多长。看步子大小（学习率）先升后降，太长的梯度被按比例截短（数值是示意）。</p>`,
      en: `<p>W is how many “warm-up” steps there are, t is the current step, and c is the longest gradient allowed. Watch the step size (learning rate) rise then fall, and too-long gradients get scaled down (the values are illustrative).</p>`,
    },
    labPassK: {
      zh: `<p>每道题让模型答 n 次，其中 c 次对了；随便挑 k 次，至少有一次对的概率是多少（n、c 是示意）。</p>`,
      en: `<p>The model answers each question n times and c of them are right; if you pick k of those answers at random, what is the chance at least one is right (n and c are illustrative)?</p>`,
    },
  },
};
export default T7;
