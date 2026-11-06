/* R56 调查 → 推理 → 验证 micro-loop · the pilot stations' content (zh + en).
   One station = one main goal split into small goals. Each small goal: 🔍 调查 (what is left over + "what would you do?"
   three ways + why the wrong ways fail, like the researchers who hit those walls) → 💡 推理 (the station's existing
   layers; `ly` names the ones that carry this goal, `fr` an attention shot) → ✔ 验证 (predict, then reveal; then
   computed variant questions, vf/var.ts). Text marks as on the stage pages: **word**, `formula`, {#…} shared numbers. */
import type { VarK } from './nums';
import { ML_A } from './ml/a';
import { ML_B } from './ml/b';
import { ML_C } from './ml/c';
import { ML_D } from './ml/d';

type T = readonly [string, string];
export interface Goal {
  t: T; // the small goal, short
  pv: T; // 调查: what is left over (goal 1 also shows the previous station's question)
  q: T; // 你会怎么做？
  o: readonly [T, T, T];
  a: number; // the way that works
  why: readonly [T, T, T]; // per option: why this way fails (or works)
  rz: readonly T[]; // 推理: the chain in two or three lines
  ly: readonly number[]; // the layers that carry it
  fr?: number; // attention shot (1–7) on layer 2
  pr: { q: T; o: readonly [T, T, T]; a: number; why: T }; // 验证 ①: predict, then reveal
  vk: VarK; // 验证 ②: the variant questions
  nx: T; // what this goal leaves for the next one (or the station's way out)
}
export interface Ml { goal: T; min: number; pic: { e: string; t: T; s: T }; goals: readonly Goal[]; take: readonly [T, T, T]; tpic: T }

const PILOT: Record<string, Ml> = {
  '1': {
    goal: ['模型猜完一次，怎么用一个数说清“错了多少”？', 'After one guess, how do we say “how wrong” with one number?'], min: 6,
    pic: { e: '🌦️', t: ['天气预报员说“明天 90% 下雨”，结果大晴天。该罚多少？', 'The forecaster said “90% rain tomorrow”, and it was sunny. How big a penalty?'], s: ['说得越肯定、错得越离谱，罚得越狠。', 'The surer the wrong call, the bigger the penalty.'] },
    goals: [
      { t: ['差多少：MSE', 'How far off: MSE'],
        pv: ['先从最简单的开始：模型预测一个数（比如房价），和真实值比。', 'Start simple: the model predicts a number (say a house price) and we compare it with the truth.'],
        q: ['三次预测的误差是 −0.5、0、+0.5。一个数怎么概括“错了多少”？', 'Three predictions are off by −0.5, 0 and +0.5. One number for “how wrong”?'],
        o: [['直接把误差加起来', 'Add the errors up'], ['每个误差先平方，再取平均', 'Square each error, then average'], ['只看最大的那个误差', 'Look only at the biggest error']], a: 1,
        why: [['−0.5 + 0 + 0.5 = 0：正负抵消，看起来“完美”，其实三次里错了两次。这条路走不通。', '−0.5 + 0 + 0.5 = 0: plus and minus cancel, so it looks “perfect” though two of three missed. A dead end.'],
          ['平方后全是正数，不会抵消；再平均，就是**均方误差 MSE**。研究者最常用的第一把尺子。', 'Squares are all positive, so nothing cancels; averaging gives the **mean squared error, MSE**, the first ruler researchers reach for.'],
          ['只看一个，其他全忽略；而且“最大值”在两个误差一样大时会突然换人，坡度跳来跳去，没法顺着调。', 'It ignores all but one, and the “biggest” can suddenly switch between errors, so the slope jumps and you cannot tune smoothly.']],
        rz: [['正负会抵消 → 先平方，全变成正数。', 'Plus and minus cancel → square first, everything turns positive.'], ['大错要罚得更狠 → 平方正好让误差翻倍时罚分变 4 倍。', 'Big misses should cost more → squaring makes a doubled error cost 4 times as much.'], ['最后取平均：`MSE = (1/n) × Σ (y预测 − y真实)²`', 'Then average: `MSE = (1/n) × Σ (y_pred − y_true)²`']],
        ly: [3, 4],
        pr: { q: ['一个误差从 0.5 变成 1（翻倍），这一项的罚分变成几倍？', 'One error goes from 0.5 to 1 (doubles). How many times bigger is its penalty?'], o: [['2 倍', '2×'], ['4 倍', '4×'], ['不变', 'Same']], a: 1, why: ['0.5² = 0.25，1² = 1：翻倍的误差罚 4 倍，所以 MSE 特别在意大错。', '0.5² = 0.25, 1² = 1: a doubled error costs 4×, so MSE cares most about big misses.'] },
        vk: 'mse', nx: ['可是语言模型输出的不是一个数，而是每个字的概率。概率怎么罚？', 'But a language model outputs probabilities for every word, not a number. How do we penalise a probability?'] },
      { t: ['猜概率：交叉熵', 'Guessing odds: cross-entropy'],
        pv: ['语言模型给每个候选字一个概率，比如“蓝 62.5%”。答案揭晓后，怎么打罚分？', 'A language model gives every candidate word a probability, like “blue 62.5%”. Once the answer is known, how do we score it?'],
        q: ['预报员说“90% 下雨”，结果晴天。罚分看什么？', 'The forecaster said “90% rain”, and it was sunny. What does the penalty look at?'],
        o: [['只看对错：错了就罚 1 分', 'Right or wrong only: 1 point for a miss'], ['看他给真实结果（晴）几成把握，给得越少罚越重：罚分 = −ln p', 'Look at the probability he gave the real outcome (sun): the less, the bigger the penalty, −ln p'], ['用 MSE 算概率差', 'Use MSE on the probability gap']], a: 1,
        why: [['说 51% 和 99% 错了罚得一样：模型学不到“别太自信”，分数也不能顺着调。', 'Saying 51% or 99% and missing costs the same: the model never learns “don’t be so sure”, and there is no smooth slope to follow.'],
          ['p 越小罚分越大，p = 1 时罚分为 0。这就是**交叉熵**，也正好是“让真实结果的概率最大”（极大似然）。', 'The smaller p, the bigger the penalty; p = 1 costs 0. This is **cross-entropy**, and it is exactly “make the real outcome most likely” (maximum likelihood).'],
          ['能用，但错得离谱时坡度反而很小，学得很慢；交叉熵在越错的地方推得越用力。', 'It works a bit, but when badly wrong its slope gets tiny and learning crawls; cross-entropy pushes hardest where it is most wrong.']],
        rz: [['只看真实结果拿到的概率 p。', 'Look only at the probability p of what really happened.'], ['罚分 = −ln p：p = 1 → 0；p 越接近 0，罚分越冲向无穷大。', 'Penalty = −ln p: p = 1 → 0; as p nears 0 the penalty shoots up.'], ['所以越自信地答错，罚得越狠。', 'So a confident wrong answer costs the most.']],
        ly: [2, 4],
        pr: { q: ['p 从 0.5 降到 0.05（变成十分之一），罚分 −ln p 怎么变？', 'p drops from 0.5 to 0.05 (a tenth). What happens to −ln p?'], o: [['约加 2.3（每缩小 10 倍就加 ln 10）', 'It goes up by about 2.3 (ln 10 for every 10× smaller)'], ['变成 10 倍', 'It becomes 10×'], ['几乎不变', 'Barely changes']], a: 0, why: ['−ln 0.5 ≈ 0.69，−ln 0.05 ≈ 3.00：差 ln 10 ≈ 2.30。对数把“倍数”变成“加法”。', '−ln 0.5 ≈ 0.69, −ln 0.05 ≈ 3.00: a gap of ln 10 ≈ 2.30. The log turns “times” into “plus”.'] },
        vk: 'ce', nx: ['可是模型最后一层吐出的是可正可负的分数，不是概率。怎么变成概率？', 'But the model’s last layer gives scores that can be negative, not probabilities. How do they become probabilities?'] },
      { t: ['分数变概率：softmax', 'Scores to odds: softmax'],
        pv: ['模型给每个候选打的分数（logit）可正可负，加起来也不是 1。', 'The scores (logits) the model gives each candidate can be negative and don’t add up to 1.'],
        q: ['分数是 2 和 0。怎么把它们变成加起来 100% 的概率？', 'The scores are 2 and 0. How do you turn them into probabilities that add up to 100%?'],
        o: [['直接除以总和', 'Divide by the total'], ['先取 e 的指数变成正数，再除以总和', 'Take e to the power first (all positive), then divide by the total'], ['最大的设为 100%，其余 0', 'Give the biggest 100%, the rest 0']], a: 1,
        why: [['分数可能是负的：2 和 −2 加起来是 0，根本没法除。', 'Scores can be negative: 2 and −2 add up to 0, and you cannot divide by that.'],
          ['e 的任何次方都是正数，再除以总和就加起来 100%，分高的仍然占大头。这就是 **softmax**。', 'e to any power is positive; dividing by the total makes them add to 100%, and higher scores still get more. This is **softmax**.'],
          ['丢掉了“第二可能”的信息，而且分数稍微变一点结果就突然跳，没有坡度可以学。', 'It throws away “the runner-up”, and a tiny score change makes it jump, so there is no slope to learn from.']],
        rz: [['先取指数：e^分数，全变成正数，分高的放大得更多。', 'Exponentiate: e^score is always positive and stretches higher scores more.'], ['再除以总和：加起来正好 100%。', 'Divide by the total: they add up to exactly 100%.'], ['`softmax(xᵢ) = e^xᵢ ÷ Σ e^xⱼ`，然后交叉熵只看正确答案那一格。', '`softmax(xᵢ) = e^xᵢ ÷ Σ e^xⱼ`, then cross-entropy reads only the right answer’s share.']],
        ly: [2, 3, 4],
        pr: { q: ['所有分数都加 10，概率会怎么变？', 'Add 10 to every score. What happens to the probabilities?'], o: [['不变', 'Nothing'], ['都变大', 'All go up'], ['最大的那个更大', 'The top one grows']], a: 0, why: ['e^(x + 10) = e^x × e^10：分子分母都乘了 e^10，约掉了。softmax 只看分数之间的差。', 'e^(x + 10) = e^x × e^10: top and bottom both gain e^10, which cancels. softmax only sees the gaps between scores.'] },
        vk: 'sm2', nx: ['有了损失这把尺子，下一站：参数成千上万个，怎么让损失变小？', 'With the loss as a ruler, next stop: with thousands of parameters, how do we make it smaller?'] },
    ],
    take: [['预测一个数用 **MSE**：误差先平方再平均，大错罚得更狠。', 'Predicting a number: **MSE**, square the errors then average; big misses cost more.'], ['预测概率用**交叉熵**：罚分 = `−ln p(正确答案)`，越自信地错罚得越狠。', 'Predicting odds: **cross-entropy**, penalty = `−ln p(right answer)`; confident misses cost most.'], ['**softmax** 把任意分数变成加起来 100% 的概率：先取指数，再除以总和。', '**softmax** turns any scores into probabilities that add up to 100%: exponentiate, then divide by the total.']],
    tpic: ['🌦️ 天气预报员：说得越肯定、错得越离谱，罚得越狠。', '🌦️ The forecaster: the surer the wrong call, the bigger the penalty.'],
  },
  '2': {
    goal: ['参数有几十亿个，怎么把损失调到最小？', 'With billions of parameters, how do we push the loss to its lowest?'], min: 6,
    pic: { e: '🌫️', t: ['大雾里下山：看不到谷底，只摸得到脚下的坡。', 'Walking down a hill in thick fog: you can’t see the valley, only feel the slope under your feet.'], s: ['你在大雾的山上，看不见谷底，只能用脚试：哪边往下，就往那边迈一小步。', 'You can’t see the bottom; your feet tell you which way is down, so you take a small step that way.'] },
    goals: [
      { t: ['单个旋钮下山', 'One knob downhill'],
        pv: ['上一站有了“损失 L”这把尺子。现在 L 只依赖一个旋钮 w：{#gdL}。', 'The last stop gave us a ruler, the loss L. Now L depends on one knob, w: {#gdL}.'],
        q: ['雾里看不见谷底。最低点怎么找到？', 'The valley is hidden in fog. How is the lowest point found?'],
        o: [['把 w 从 −100 到 100 每隔 0.01 都试一遍', 'Try every w from −100 to 100 in steps of 0.01'], ['只看脚下的坡，往下坡走一小步，再看再走', 'Feel the slope underfoot, take a small step downhill, repeat'], ['直接解方程 dL/dw = 0', 'Solve dL/dw = 0 directly']], a: 1,
        why: [['1 个旋钮能行（2 万次）。但大模型有 10 亿个旋钮：所有组合要试“2 万的 10 亿次方”种，宇宙毁灭也算不完。', 'One knob works (20,000 tries). A big model has a billion knobs: “20,000 to the power of a billion” combinations, more than the universe could ever compute.'],
          ['只需要知道脚下的坡（导数），每一步都便宜，参数再多也能走。这就是**梯度下降**。', 'You only need the slope underfoot (the derivative); each step is cheap, however many parameters. This is **gradient descent**.'],
          ['只对简单式子行。深层网络的损失又弯又绕，根本列不出能解的方程，研究者也在这里碰过壁。', 'Only works for simple formulas. A deep network’s loss is far too tangled to solve on paper; researchers hit this wall too.']],
        rz: [['脚下的坡 = 导数：w 动一点点，L 变多少。', 'The slope underfoot = the derivative: how much L changes when w moves a little.'], ['坡往右下 → 往右走；坡往右上 → 往左走。所以永远朝“坡的反方向”迈。', 'Slope going down to the right → step right; going up → step left. Always step against the slope.'], ['`新w = 旧w − η × dL/dw`', '`new w = old w − η × dL/dw`']],
        ly: [1, 3],
        pr: { q: ['站在 w = 3（碗底 w = 2 的右边），坡是正还是负？该往哪走？', 'Standing at w = 3 (right of the bottom at w = 2): is the slope positive or negative? Which way?'], o: [['正，往左（w 变小）', 'Positive, go left (w gets smaller)'], ['负，往右', 'Negative, go right'], ['0，不动', 'Zero, stay']], a: 0, why: ['坡 = 2 × (3 − 2) = 2 > 0：往右是上坡，所以减去它，往左走。', 'Slope = 2 × (3 − 2) = 2 > 0: right is uphill, so subtract it and go left.'] },
        vk: 'gd1', nx: ['可是真实模型不止一个旋钮。两个旋钮时，坡往哪边？', 'But a real model has more than one knob. With two, which way is downhill?'] },
      { t: ['两个一起下山', 'Two knobs together'],
        pv: ['现在损失像一只碗：{#bowlL}，碗底在 (2, 1)。', 'Now the loss is a bowl: {#bowlL}, with the bottom at (2, 1).'],
        q: ['两个旋钮，你会怎么下山？', 'Two knobs: how would you go downhill?'],
        o: [['先只调 w1 调到最好，再调 w2', 'Tune w1 all the way first, then w2'], ['在同一点把两个方向的坡都量出来，合成一个方向，两个一起走', 'At one point, measure both slopes, combine them into one direction, move both together'], ['随便挑个方向试，变好就留下', 'Try a random direction; keep it if things improve']], a: 1,
        why: [['这叫坐标下降：在斜着的窄谷里会走“之”字，参数一多就慢得多。它不是梯度下降。', 'That is coordinate descent: in a slanted narrow valley it zig-zags, and with many parameters it gets much slower. It is not gradient descent.'],
          ['两个**偏导**排成一个向量就是**梯度**，指向上坡最快；减去它，两个参数同时改。', 'The two **partial derivatives** form a vector, the **gradient**, pointing uphill fastest; subtract it and both parameters change at once.'],
          ['在 10 亿维里随便挑，几乎总是挑到没用的方向，试一次还要算一整遍损失。', 'In a billion dimensions a random pick is almost always useless, and every try costs a full loss evaluation.']],
        rz: [['偏导 = 只动一个、别的不动时的坡。', 'A partial derivative = the slope when you move one knob and hold the rest.'], ['两个偏导排成梯度 ∇L = (∂L/∂w1, ∂L/∂w2)。', 'Together they make the gradient ∇L = (∂L/∂w1, ∂L/∂w2).'], ['`新(w1, w2) = 旧(w1, w2) − η × ∇L`：同一点算、一起改。', '`new (w1, w2) = old (w1, w2) − η × ∇L`: measured at one point, changed together.']],
        ly: [2, 4],
        pr: { q: ['在 (0, 0)，∂L/∂w1 = −4，∂L/∂w2 = −4。下一步两个参数怎么变？', 'At (0, 0), ∂L/∂w1 = −4 and ∂L/∂w2 = −4. How do the two parameters change next?'], o: [['都变大', 'Both grow'], ['w1 变大，w2 不动', 'w1 grows, w2 stays'], ['都变小', 'Both shrink']], a: 0, why: ['减去负的坡就是加：两个一起往碗底 (2, 1) 的方向走。', 'Subtracting a negative slope adds: both move together toward the bottom (2, 1).'] },
        vk: 'bowl', nx: ['方向有了。每一步迈多大？', 'The direction is settled. How big should each step be?'] },
      { t: ['步子多大', 'How big a step'],
        pv: ['`新w = 旧w − η × 坡度` 里的 η（学习率）决定每一步迈多远。', 'In `new w = old w − η × slope`, η (the learning rate) sets how far each step goes.'],
        q: ['学习率 η 怎么选？', 'How do you pick the learning rate η?'],
        o: [['越大越好，下山更快', 'The bigger the better: faster downhill'], ['越小越好，最稳', 'The smaller the better: safest'], ['适中，并看损失有没有稳定下降来调', 'Moderate, and adjust by watching whether the loss falls steadily']], a: 2,
        why: [['η = 1.1 时：{#gd11}，越跳越远，发散了。', 'With η = 1.1: {#gd11}, it jumps further out each time: it diverges.'],
          ['η = 0.001 要走几千步才到碗底：稳，但训练一次要贵很多倍。', 'With η = 0.001 it takes thousands of steps to reach the bottom: safe, but training costs many times more.'],
          ['每步把到碗底的距离乘以 (1 − 2η)：|1 − 2η| < 1 才会收敛。实际训练也是盯着损失曲线调 η。', 'Each step multiplies the distance to the bottom by (1 − 2η): it converges only if |1 − 2η| < 1. Real training also tunes η by watching the loss curve.']],
        rz: [['每步把离 2 的距离乘以 (1 − 2η)。', 'Each step multiplies the distance to 2 by (1 − 2η).'], ['η = 0.3：乘 0.4，平稳靠近；η = 1：乘 −1，原地来回；η = 1.1：乘 −1.2，发散。', 'η = 0.3: × 0.4, glides in; η = 1: × −1, bounces forever; η = 1.1: × −1.2, diverges.'], ['在 ③ 数字层拖一拖学习率，亲眼看它坏掉。', 'Drag the learning rate on layer ③ and watch it break.']],
        ly: [3],
        pr: { q: ['η = 1.0 在这条曲线上会怎样？', 'What does η = 1.0 do on this curve?'], o: [['平稳到 w = 2', 'Glides in to w = 2'], ['在两点之间来回跳，永远停不下', 'Bounces between two points forever'], ['越跳越远', 'Runs away']], a: 1, why: ['1 − 2 × 1 = −1：距离不变、方向来回翻，w = 0 → 4 → 0 → 4…', '1 − 2 × 1 = −1: same distance, side flips each time: w = 0 → 4 → 0 → 4…'] },
        vk: 'gdbig', nx: ['会调参数了。但线性模型本身能力有限，有些问题怎么调都学不会：下一站。', 'Now we can tune parameters. But a linear model itself is limited; some problems it can never learn: next stop.'] },
    ],
    take: [['参数多到不能一个个试，只能看**脚下的坡**往下走。', 'Too many parameters to try one by one: follow **the slope underfoot** downhill.'], ['坡 = 导数；朝坡的反方向迈：`新w = 旧w − η × 坡度`。', 'Slope = derivative; step against it: `new w = old w − η × slope`.'], ['很多参数时，每个方向的坡**一起算、一起改**（梯度）；步子 η 太大会发散。', 'With many parameters, every slope is **measured and applied together** (the gradient); too big an η diverges.']],
    tpic: ['🌫️ 大雾下山：看不见谷底，只摸脚下的坡。', '🌫️ Down a hill in fog: feel the slope underfoot.'],
  },
  '8a': {
    goal: ['“它很累”里的“它”指谁？让每个词自己找到和它有关的词。', 'In “it was tired”, who is “it”? Let every word find the words that matter to it.'], min: 7,
    pic: { e: '🎉', t: ['聚会上找人修电脑：你心里有需求，每个人挂着名牌，脑子里有本事。', 'At a party you need someone to fix a laptop: you have a need, everyone wears a name tag, and each has skills.'], s: ['需求和名牌越对得上，你就越听他的；最后的建议 = 大家的本事按“对得上的程度”混合。', 'The better a tag matches your need, the more you listen; the advice you end up with mixes everyone’s skills by how well they matched.'] },
    goals: [
      { t: ['打分：谁和我对得上', 'Score: who matches me'],
        pv: ['RNN 把整句话一点点压进一个向量，句子一长，前面的信息被挤掉，也没法并行。', 'An RNN squeezes the sentence into one vector bit by bit; long sentences push out the early words, and nothing runs in parallel.'],
        q: ['“小猫坐在垫子上，因为它很累。”“它”要知道自己指谁，怎么给句子里每个词打“相关分”？', '“The cat sat on the mat as it was tired.” For “it” to know who it is, how would you give every word a “relevance score”?'],
        o: [['按距离：越近越相关', 'By distance: closer means more related'], ['“它”拿需求向量 q 和每个词的名牌 k 做点积，对得上分就高', '“it” takes its need vector q and dots it with every word’s tag k; a good match scores high'], ['把整句压成一个向量再查', 'Squeeze the whole sentence into one vector, then look it up']], a: 1,
        why: [['“它”离“因为”最近，却指“小猫”：距离会骗人。', '“it” sits right next to “as” but means “the cat”: distance lies.'],
          ['点积 = 逐位相乘再相加：方向越一致，分越高。每个词都能直接看到任何一个词，所有位置还能同时算。', 'Dot product = multiply position by position and add: the more aligned, the higher. Every word sees every word directly, and all positions compute at once.'],
          ['这就是 RNN 的老办法：上一站的遗留问题，句子越长越记不住。', 'That is the old RNN way, the problem the last stop left open: the longer the sentence, the more it forgets.']],
        rz: [['每个词投影出三样：Q（我要找什么）、K（我能提供什么）、V（提供的内容）。', 'Each word projects three things: Q (what I look for), K (what I offer), V (the content).'], ['匹配分 = q · k：需求对名牌，逐位相乘再相加。', 'Match score = q · k: need against tag, multiply and add.'], ['看动画第 3、4 镜：“它”的探照灯扫过每个词，亮出分数。', 'See shots 3 and 4: the searchlight from “it” sweeps every word and shows the scores.']],
        ly: [1, 2], fr: 4,
        pr: { q: ['q = [1, 0]，k1 = [1, 0]，k2 = [0, 1]。哪个分高？', 'q = [1, 0], k1 = [1, 0], k2 = [0, 1]. Which scores higher?'], o: [['k1', 'k1'], ['k2', 'k2'], ['一样', 'The same']], a: 0, why: ['q·k1 = 1，q·k2 = 0：方向一致的名牌得高分，垂直的得 0。', 'q·k1 = 1, q·k2 = 0: a tag pointing the same way scores high; a perpendicular one scores 0.'] },
        vk: 'dot2', nx: ['分数有了。可以直接拿去 softmax 吗？', 'We have scores. Can they go straight into softmax?'] },
      { t: ['缩放：别让一家独占', 'Scale: no one takes all'],
        pv: ['向量维度 d_k 很大时（比如 64），点积会很大：{#attS0}。', 'When the vectors are wide (d_k = 64, say), dot products get big: {#attS0}.'],
        q: ['分数 {#attS0}，d_k = 64。进 softmax 之前，分数要不要先缩小？', 'Scores {#attS0}, d_k = 64. Before softmax, do the scores get smaller first?'],
        o: [['直接 softmax', 'Straight into softmax'], ['先除以 √d_k，把分数拉回正常范围，再 softmax', 'Divide by √d_k first to bring them back to a normal range, then softmax'], ['除以 d_k', 'Divide by d_k']], a: 1,
        why: [['softmax ≈ {#attSat}：几乎只看第一个词，其余词的梯度接近 0，学不动。', 'softmax ≈ {#attSat}: nearly all on the first word; the others get almost no gradient and stop learning.'],
          ['{#attK}，得 {#attS1}，softmax ≈ {#attW}：主次分明，但谁都没被饿死。', '{#attK} gives {#attS1}, softmax ≈ {#attW}: a clear favourite, but no word starves.'],
          ['除太多：16 ÷ 64 = 0.25，分数全挤在一起，谁都差不多，失去了区分。', 'Too much: 16 ÷ 64 = 0.25, so every score bunches up and nothing stands out.']],
        rz: [['d_k 维的点积，方差约是 d_k：维度越大，分数越大。', 'A d_k-wide dot product has variance about d_k: wider vectors, bigger scores.'], ['除以 √d_k，方差回到 1 左右，softmax 不会饱和。', 'Dividing by √d_k brings the variance back near 1, so softmax doesn’t saturate.'], ['看动画第 5 镜，再在 ③ 数字层拖一拖 d_k。', 'See shot 5, then drag d_k on layer ③.']],
        ly: [2, 3], fr: 5,
        pr: { q: ['不缩放时，d_k 越大，softmax 会更尖还是更平？', 'Without scaling, as d_k grows, does softmax get sharper or flatter?'], o: [['更尖（一家独占）', 'Sharper (one takes all)'], ['更平', 'Flatter'], ['不变', 'No change']], a: 0, why: ['维度越大点积越大，指数一放大，差距更悬殊，最大的那个独占。', 'Wider means bigger dot products; the exponent stretches the gaps, so the top one takes everything.'] },
        vk: 'scale', nx: ['权重有了。“它”的新意思从哪来？', 'We have the weights. Where does the new meaning of “it” come from?'] },
      { t: ['混合：按比例取大家的本事', 'Mix: take everyone’s skills by share'],
        pv: ['softmax 后，“它”对小猫、垫子、因为的权重约是 {#attW}。', 'After softmax, “it” weighs the cat, the mat and “as” at about {#attW}.'],
        q: ['有了权重，“它”的新表示怎么算？', 'With the weights, how is the new representation of “it” made?'],
        o: [['只取权重最大的那个词的 V', 'Take only the top-weighted word’s V'], ['按权重把所有词的 V 加权求和', 'Add up every word’s V, weighted'], ['把所有 V 直接相加', 'Add all the V’s as they are']], a: 1,
        why: [['这是普通 HashMap.get 的“硬查找”：不可导，没法训练，还丢掉了“垫子”那点信息。', 'That is a plain HashMap.get, a hard lookup: no slope to train with, and the bit about the mat is lost.'],
          ['**加权求和**：大头来自小猫，也带一点别的词。整个过程处处可导，可以用梯度下降训练。', 'A **weighted sum**: mostly the cat, a little of the others. Every step is differentiable, so gradient descent can train it.'],
          ['不分轻重：“因为”和“小猫”一样重要，等于没注意。', 'No weighting: “as” counts as much as “the cat”, which is no attention at all.']],
        rz: [['新表示 = Σ 权重ᵢ × Vᵢ：一次“软的查找”。', 'New representation = Σ weightᵢ × Vᵢ: a “soft lookup”.'], ['合起来就是 `softmax(Q × Kᵀ / √d_k) × V`。', 'Put together: `softmax(Q × Kᵀ / √d_k) × V`.'], ['看动画第 6 镜：V 按比例流进“它”。', 'See shot 6: V flows into “it” by its shares.']],
        ly: [2, 4], fr: 6,
        pr: { q: ['权重 [0.5, 0.5, 0]，V = [2, 4, 100]。输出是？', 'Weights [0.5, 0.5, 0], V = [2, 4, 100]. The output?'], o: [['3', '3'], ['106 ÷ 3 ≈ 35.3', '106 ÷ 3 ≈ 35.3'], ['100', '100']], a: 0, why: ['0.5 × 2 + 0.5 × 4 + 0 × 100 = 3：权重为 0 的词，V 再大也进不来。', '0.5 × 2 + 0.5 × 4 + 0 × 100 = 3: a word with weight 0 adds nothing, however big its V.'] },
        vk: 'mix', nx: ['一层注意力只够找一种关系，也还没有“自己消化”的步骤：下一站把它搭成完整的 Transformer。', 'One attention layer finds one kind of relation and has no “digest it” step yet: next stop builds the full Transformer.'] },
    ],
    take: [['每个词带三样：**Q** 我要找什么、**K** 我能提供什么、**V** 提供的内容。', 'Every word carries **Q** what I look for, **K** what I offer, **V** the content.'], ['匹配分 = `q · k`，先**除以 √d_k** 防止一家独占，再 softmax 成比例。', 'Match = `q · k`; **divide by √d_k** so no one takes all, then softmax into shares.'], ['新意思 = 大家的 V **按比例混合**：`softmax(Q × Kᵀ / √d_k) × V`。', 'New meaning = everyone’s V **mixed by share**: `softmax(Q × Kᵀ / √d_k) × V`.']],
    tpic: ['🎉 聚会找人：需求对名牌，按对得上的程度听大家的。', '🎉 The party: need against name tags, listen to each by how well they match.'],
  },
};
export const ML: Readonly<Record<string, Ml>> = { ...PILOT, ...ML_A, ...ML_B, ...ML_C, ...ML_D };
