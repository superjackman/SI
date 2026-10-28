/* R35: teaching callouts for every experiment, pinned to named points of the 3D scene (lab marks).
   Each: [mark, title, short line on the callout, card text, "try this"] — all 'zh|en'.
   Loaded lazily with w3/note.ts, never on first paint. */
import type { S } from './types';
export type RawNote = [mark: string, t: S, s: S, p: S, tr: S];
const LAYERS_APP: RawNote[] = [
  ['top', '最上层：App|Top: the app', '你在这里说话|Where you talk', '你看到的聊天窗口就是最上面这层 App。你的一句话从这里进去。|The chat window you see is the top floor, the app. Your sentence goes in here.', '点小球，看它从顶层出发。|Tap the ball and watch it leave the top floor.'],
  ['bot', '最底层：算力|Bottom: computing', '芯片在这里干重活|Chips do the heavy work', '最底下是算力：成千上万块芯片在算数字。每一层只做自己的事，合起来帮你干活。|At the bottom is computing: thousands of chips crunching numbers. Each floor does its own job; together they do your work.', '数一数，小球一共经过几层？|Count how many floors the ball passes.'],
  ['ball', '你的一句话|Your sentence', '走下去，再带答案回来|Goes down, comes back answered', '小球就是你的问题：一层层往下传，到底后再一层层带着答案回来。每层只把它交给下一层，谁也不用懂全部。|The ball is your question: it is passed down floor by floor, then carried back up with the answer. Each floor only hands it on; no floor has to know everything.', '一直点，直到小球回到顶层。|Keep tapping until the ball is back on top.'],
];
const N: Record<string, RawNote[]> = {
  T1: LAYERS_APP,
  U: [
    ['b0', '一起干|Together', '要紧、难检查的事|Important, hard to check', '要紧又难检查的事（比如写给老板的信、付钱），你要陪着它一步步看。出了错代价大，所以每一步都要你点头。|Important jobs that are hard to check (an email to the boss, paying) need you beside it, step by step. A mistake would be costly, so each step waits for your OK.', '把“帮我付钱”拖进这个盒子。|Drag “Pay for me” into this box.'],
    ['b1', '自己干|Alone', '简单、好检查的事|Simple, easy to check', '简单又好检查的事（整理照片、每天总结新闻），可以放手让它自己干。就算做错了，你看一眼就能发现、很容易改。|Simple jobs that are easy to check (sorting photos, a daily news summary) can be handed off. Even if it slips, one glance spots it and it is easy to fix.', '把“整理照片文件夹”放进来。|Put “Sort a photo folder” here.'],
    ['item', '一件事|A job', '拖它去一个盒子|Drag it to a box', '每个小东西是一件要做的事。先问自己：它要紧吗？做完好检查吗？两个答案合起来，就知道该放哪个盒子。|Each object is a job. Ask: is it important? Is the result easy to check? The two answers together tell you which box.', '拖错了也没关系，它会弹回来。|A wrong drop just bounces back.'],
  ],
  Ua: [
    ['s0', '它做一步|It does a step', 'AI 先动手|The AI acts first', '一起干的时候，AI 每次只做一小步，不会一口气做完。做完一步就停下来，等你看过再继续。|Working together, the AI does one small step at a time, not everything at once. After each step it stops and waits for you before going on.', '点小球，看它走到下一块石头。|Tap the ball: it moves to the next stone.'],
    ['s1', '你看一眼|You look', '每一圈你都检查|You check every round', '每一圈都有你在看，所以出错能马上改。你说“这里改短点”，下一圈它就照着改。|You check every round, so mistakes get fixed right away. Say “make this part shorter” and the next round does it.', '数数转几圈文章才改好。|Count the rounds until the essay is done.'],
    ['flag', '目标|The goal', '文章改好了|A polished essay', '圈中间的旗子是目标：每转一圈就离它近一点。一来一回好几圈，比一次写完更容易写好。|The flag in the middle is the goal: every round brings it closer. Several back-and-forth rounds beat writing it all in one go.', '一直点到出现“改好了”。|Keep tapping until it says done.'],
  ],
  Ub: [
    ['b1', '放手给它|Hand it off', '步骤清楚、能自动检查|Clear and checkable', '步骤清楚、能自动检查的事（整理邮件、给代码补测试）最适合放手。它做完，检查程序会告诉你对不对，你不用盯着。|Clear jobs that can be checked automatically (tidying email, adding tests) are best handed off. When it finishes, a check tells you if it is right; you need not watch.', '把“给代码补测试”放进来。|Put “Add tests to code” here.'],
    ['b0', '陪着它|Stay with it', '大事、私事你来定|Big or personal: you decide', '买房这种大决定、回复好朋友这种私事，要你自己把关。这些事很难用规则检查对错，结果只有你能判断。|Big decisions like buying a house, or personal things like replying to a friend, need you in charge. No rule can check these; only you can judge the result.', '把“决定买哪套房”放进来。|Put “Choose a house to buy” here.'],
  ],
  Uc: [
    ['sock', '插口|The socket', '工具卡插在这里|Tool cards plug in here', '机器人胸口的圆环是插口。每插一张卡，它就会做一件新事。|The ring on the robot is a socket. Each card plugged in adds one new thing it can do.', '点一张卡，看它飞进插口。|Tap a card and watch it fly into the socket.'],
    ['card', '工具卡|A tool card', '搜索、文件、日历、邮件|Search, files, calendar, email', '每张卡是一个工具：插上“搜索”它能上网找资料，插上“日历”它能帮你约时间。模型本身不会上网、不会看日历，是工具让它能做到。|Each card is a tool: “Search” lets it look things up, “Calendar” lets it book times. The model alone cannot browse or read a calendar; tools make that possible.', '四张都插上，看底下的字怎么变。|Plug in all four and read the line below.'],
  ],
  Ud: [
    ['pads', '四件事|The four things', '目标·材料·标准·禁忌|Goal, material, good, avoid', '说清四件事：要做什么、给什么材料、怎样算好、不要什么。说了几件，就亮几颗小球。|Say four things: the goal, the material, what good looks like, what to avoid. Each one you say lights a ball.', '把滑块拖到 4。|Drag the slider to 4.'],
    ['star', '结果的星星|The result star', '说得越清楚越亮|Clearer words, brighter star', '星星代表结果的好坏：说得越清楚，它做得越好。它猜不到你没说的事，所以少说一件，结果就差一点。|The star stands for the result: the clearer you are, the better it works. It cannot guess what you leave out, so each missing thing costs quality.', '比一比 1 件和 4 件时星星的大小。|Compare the star at 1 and at 4.'],
  ],
  Up: [
    ['b0', '聊天出主意|Chat & ideas', '只会说|Only talks', '有的产品只会聊天：回答问题、出点子。最后要你自己去照着做。|Some products only chat: answer questions and give ideas. You still do the work yourself afterwards.', '把“想生日派对点子”放进来。|Put “Party ideas” here.'],
    ['b1', '动手干活|Does the work', '还会动手|Also acts', '有的产品还能动手：替你订票、改好代码再测试。这类产品就是 Agent：它会用工具，一步步把事做完。|Some can also act: book a ticket, fix code and test it. These are agents: they use tools to finish the job step by step.', '把“替你订车票”放进来。|Put “Book a train ticket” here.'],
  ],
  Api: [
    ['big', '大模型|Big model', '更聪明，也更贵|Smarter, costs more', '用 API 时按字数付钱：字越多，硬币越多。大模型每个字更贵。|With an API you pay by the word: more words, more coins. A big model costs more per word.', '把滑块拖到最大，数数硬币。|Drag the slider to the max and count the coins.'],
    ['small', '小模型|Small model', '同样的字，更便宜|Same words, cheaper', '简单的活换小模型来做，就便宜很多。难的活再交给大模型，这样又好又省钱。|Give simple jobs to a smaller model and it costs much less. Save the big model for hard jobs: good results, lower bill.', '看左右两堆硬币差多少。|See how much the two piles differ.'],
    ['book', '要处理的文字|The text', '字数决定费用|Length sets the price', '这本书代表你发给它和它写回来的文字，都按字数算钱。所以长长的资料、长长的回答都会更贵。|The book stands for the words you send and it writes back; both are counted. So long documents and long answers both cost more.', '拖动滑块，看两堆硬币一起长高。|Drag the slider: both piles grow.'],
  ],
  Loc: [
    ['box', '16GB 内存|16 GB of memory', '模型要装得下|The model must fit', '在自己电脑上跑模型，要先把它装进内存。压缩后大约每 10 亿个数字要 0.6GB。|To run a model on your own computer it must fit in memory: a squeezed model needs about 0.6 GB per billion numbers.', '找到刚好装不下的那个大小。|Find the size that just stops fitting.'],
    ['lap', '你的电脑|Your computer', '不用上网也能用|Works offline', '模型在本机跑，资料不出你的电脑；代价是只能用装得下的模型。没网也能用，也不用按次付费。|A local model keeps your data on your machine; the catch is it must fit. It works offline, with no per-use fee.', '拖到 7（70 亿），读读要多少 GB。|Drag to 7 (billion) and read the GB.'],
  ],
  Job: [
    ['b0', '聊天助手|Chat assistant', '只要一个答案|You just need an answer', '只要答案（解释一个词、取个队名），用聊天助手就够了。它说完，事情还是你自己去做。|If you just need an answer (explain a word, name a team), a chat assistant is enough. After it answers, you still do the task.', '把“取个队名”放进来。|Put “Name a team” here.'],
    ['b1', 'Agent|Agent', '要它动手做事|You need action', '要动手做事（给 100 个文件改名、比价并下单），用 Agent。它会自己用工具、一步步做完，再把结果给你看。|If something has to be done (rename 100 files, compare and order), use an agent. It uses tools step by step and shows you the result.', '把“把 100 个文件改名”放进来。|Put “Rename 100 files” here.'],
  ],
  Skl: [
    ['sock', '技能插口|Skill socket', '学会一种做法|Learns a way of working', '工具给它手，技能卡教它怎么用手：比如先查三处再回答。同一套工具，换一张技能卡，做事的方法就不一样。|Tools give it hands; a skill card teaches it how to use them, e.g. check three sources first. Same tools, different skill card, a different way of working.', '点一张技能卡插进去。|Tap a skill card to plug it in.'],
    ['card', '技能卡|A skill card', '写周报、查资料、检查安全…|Reports, research, safety…', '每张卡是一套写好的步骤，插上后它就按这套方法做事。写好一次，以后每次都能照着做，不用再重复交代。|Each card is a written-down method; once plugged in, it works that way. Write it once and it is followed every time, no repeating yourself.', '插上“检查安全”，读读它多了什么本事。|Plug in “Safety check” and read the new power.'],
  ],
  Bld: [
    ['s0', '想一步|Think', '先想下一步做什么|Plan the next step', 'Agent 先想：下一步要干什么。它看着目标和已经做过的事来决定。|First the agent thinks: what is the next step? It decides from the goal and what it has already done.', '点小球，从“想”开始。|Tap the ball to start at Think.'],
    ['s1', '用工具|Use a tool', '真的去做|Actually do it', '再用工具去做，比如搜索、读文件。工具的结果会交回给它，下一步接着想。|Then it uses a tool, such as search or reading a file. The tool’s result comes back to it for the next think.', '看小球走到工具石头。|Watch the ball reach the tool stone.'],
    ['s2', '看结果|Look', '离目标更近了吗？|Closer to the goal?', '最后看结果，不够就再转一圈。每转一圈就离目标更近一步。|Last it looks at the result and loops again if needed. Each round gets closer to the goal.', '数数几圈能找到答案。|Count the rounds to the answer.'],
  ],
  T2: [
    ['s1', '工具单|Tool note', '模型写的“请帮我查”|The model’s request', '模型自己上不了网。它写一张工具单：“查明天天气”。|The model can’t go online itself. It writes a tool note: “get tomorrow’s weather”.', '点小球，看工具单被写出来。|Tap the ball to see the note written.'],
    ['s2', '程序去做|The program acts', '拿到“晴 25°”|Gets “sunny 25°”', '真正去查的是程序，查到的结果再交回给模型。模型自己不会上网，它只会写出要做什么。|The program does the lookup and hands the result back to the model. The model cannot go online itself; it only writes what to do.', '再点一下，看结果回来。|Tap again to see the result come back.'],
    ['s0', '先想|Think first', '模型负责想|The model plans', '模型只负责想和写单子，程序负责去做。这张单子写明用哪个工具、要什么参数。|The model thinks and writes the note; the program does the work. The note says which tool to use and with what inputs.', '一圈走完，读读最后的回答。|Finish a round and read the reply.'],
  ],
  T3: [
    ['row', '长出来的句子|The growing sentence', '一次加一个词|One word at a time', '模型每次只猜下一个词，接在后面，句子就一点点长出来。新加的词又成了下一次猜的依据，一直到写完。|The model guesses only the next word and adds it; the sentence grows bit by bit. Each new word becomes part of the next guess, until it is done.', '点骰子三次，读完整句。|Tap the dice three times and read the sentence.'],
    ['bars', '每个词的分|Word scores', '分高更常被选|Higher scores win more', '柱子是候选词的分：分高的词更常被选中，但不一定每次都选它。分数先变成概率，再按概率抽一个词。|The bars are scores for candidate words: high scores are picked more often, but not every time. The scores become chances, then one word is drawn by chance.', '重来几次，看看会不会选到“很冷”。|Try again a few times: does “is cold” ever win?'],
    ['dice', '骰子|The dice', '带一点随机|A bit of chance', '挑词时有一点随机，所以同一个问题会得到不同的回答。随机少一点，回答更稳；多一点，回答更有新意。|Picking words has a little chance in it, so the same question can get different answers. Less chance gives steadier answers; more gives fresher ones.', '点骰子。|Tap the dice.'],
  ],
  N: [
    ['in', '输入|Inputs', '下雨、有云、刮风|Rain, clouds, wind', '每个输入是 1（有）或 0（没有）。这里有三个输入：下雨、有云、刮风。|Each input is 1 (yes) or 0 (no). There are three inputs here: rain, cloud, wind.', '看哪个输入在发亮。|See which input is lit.'],
    ['n', '神经元 Σ|Neuron Σ', '输入 × 重要程度，再相加|Inputs × importance, added', '神经元把每个输入乘上它的“重要程度”，再全部加起来。重要的输入乘的数大，不重要的乘的数小。|The neuron multiplies each input by its importance and adds them all up. Important inputs get a big number, unimportant ones a small one.', '把“下雨”的重要程度调大。|Turn up the importance of rain.'],
    ['bulb', '输出：带伞|Output: umbrella', '够大就亮|Lights when big enough', '加起来的数够大，灯泡就亮，意思是“带伞”。不够大灯就不亮。调重要程度，就能改变它什么时候亮。|If the sum is big enough the bulb lights: “take an umbrella”. Otherwise it stays dark. Changing the importances changes when it lights.', '让灯泡在下雨天亮起来。|Make the bulb light on a rainy day.'],
  ],
  T4: [
    ['bot', '块 1：看看|Block 1: look', '先看看别的词|Looks at other words', '每一块先“看看”：这个词去看句子里的其他词（注意力）。然后再“想想”：把看到的东西消化一下（前馈网络）。|Each block first “looks”: the word checks the other words (attention). Then it “thinks”: it digests what it saw (the feed-forward network).', '点小球，看它进第一块。|Tap the ball into the first block.'],
    ['top', '猜下一个词|Guess the next word', '最后一步|The final step', '一块一块往上，词的意思越来越清楚，最上面用它来猜下一个词。大模型就是把这样的块叠很多层。|Block by block the word’s meaning gets clearer; at the top it is used to guess the next word. A big model is just many of these blocks stacked up.', '一直点到顶。|Keep tapping to the top.'],
    ['ball', '一个词|A word', '一路往上走|Travels up', '小球是一个词。每块“看看”之后还会“想想”，把看到的整理好。|The ball is a word. After each “look”, a block “thinks” and tidies what it saw.', '数数一共几块。|Count the blocks.'],
  ],
  T4a: [
    ['w0', '一个词|A word', '点它看它在意谁|Tap to see who it cares about', '点一个词，线会连到它最在意的词：线越亮，关系越近。每个词都这样看别的词，再把看到的意思加到自己身上。|Tap a word and lines reach the words it cares about: brighter means closer. Every word does this, then mixes what it saw into its own meaning.', '点“苹果”。|Tap “apples”.'],
    ['arc', '亮的线|Bright lines', '注意力的大小|How much attention', '“苹果”最认真看“吃”：它想知道自己被怎么了。所以模型知道这里的苹果是吃的水果，不是手机。|“apples” looks hardest at “eating”: it wants to know what happens to it. So the model knows this apple is a fruit being eaten, not a phone.', '比一比两个词的连线亮度。|Compare the lines of two words.'],
  ],
  T4b: [
    ['pa', '紫色箭头|Purple arrow', '固定不动|Stays put', '紫色箭头是一个词的“问题”。粉色箭头的影子落在它上面。|The purple arrow is one word’s “question”; the pink arrow’s shadow falls on it.', '看影子从哪里开始。|See where the shadow starts.'],
    ['pb', '粉色箭头|Pink arrow', '拖它转圈|Drag it around', '两个箭头越同向，点积越大；垂直时为零；反向时是负的。这个数就是点积，它量的是两个方向有多像。|The more they agree, the bigger the dot product; zero when square, negative when opposite. That number is the dot product; it measures how alike two directions are.', '拖到和紫色垂直，看分数变成 0。|Drag it square to purple: the score hits 0.'],
    ['o', '起点|The start', '两箭头同一起点|Both start here', '影子越长，分越高：这就是注意力打分的方法。一个词的“问题”箭头和另一个词的“答案”箭头越同向，分就越高。|The longer the shadow, the higher the score: that is how attention scores words. The more one word’s question arrow agrees with another’s key arrow, the higher the score.', '拖到反方向，看分数变负。|Point it the other way: the score goes negative.'],
  ],
  T5: [
    ['tok', '一个词|A word', '点它出发|Tap to send it', '每个词都要找专家处理。专家就是一个个小网络，各有擅长的事。|Every word goes to experts to be processed. Experts are small networks, each good at different things.', '点“小猫”。|Tap “kitten”.'],
    ['gate', '门卫|The gatekeeper', '决定去哪两个专家|Picks two experts', '门卫看这个词，挑两个最合适的专家。门卫也是学出来的：它学会了什么词该找谁。|The gatekeeper looks at the word and picks the two best experts. The gatekeeper is learned too: it learns which word goes to whom.', '看“加法”被送去哪里。|See where “plus” goes.'],
    ['ex', '专家们|The experts', '其他的可以休息|The rest can rest', '每个词只去两个专家那里，其他专家休息，所以又大又省力。这种做法叫“混合专家”（MoE）。|Each word visits only two experts while the rest rest, so the model is big but cheap to run. This is called a mixture of experts (MoE).', '数数每次亮几个专家。|Count how many light up each time.'],
  ],
  T6: [
    ['pic', '一幅画|A picture', '切成小方块|Cut into squares', '点这幅画，它被切成 4×4 共 16 个小方块。每个小方块会变成一串数字，就像一个词块。|Tap the picture: it is cut into 4×4 = 16 squares. Each square becomes a list of numbers, just like a word token.', '点画。|Tap the picture.'],
    ['row', '排成一行|In a row', '像读词一样读|Read like words', '小方块排成一行交给模型：图片的小方块和文字的词块一样，模型都能读。所以同一个模型能一边看图一边读字。|The squares are lined up for the model: picture squares work like word tokens. That is how one model can look at pictures and read words together.', '数数一行有几块。|Count the squares in the row.'],
  ],
  T7: [
    ['ball', '小球|The ball', '它想走到谷底|Wants the bottom', '谷底代表错误最小。小球每次往下坡走一步。|The bottom means the smallest error; the ball steps downhill each time.', '点小球走一步。|Tap the ball to step.'],
    ['bot', '谷底|The bottom', '错误最小的地方|Least error', '步子太小走得慢，太大会跳过谷底。这一步有多大，叫学习率。|Too small is slow; too big jumps over the bottom. How big the step is is called the learning rate.', '把步子拖到最大再走。|Max the step and try.'],
  ],
  T8: [
    ['b0', '怎么用|Using it', '上面一层|The top side', '上面是怎么用：比如 Agent、MCP 插口。学会用，就能马上让 AI 帮你做事。|The top side is how to use it: agents, MCP plugs. Knowing how to use it lets AI help you right away.', '把“Agent”放进来。|Put “Agent” here.'],
    ['b1', '原理|How it works', '下面一层|The inside', '下面是为什么行：比如注意力、梯度下降。懂了原理，才知道它什么时候会出错。|The inside is why it works: attention, gradient descent. Knowing why it works tells you when it may fail.', '把“注意力”放进来。|Put “Attention” here.'],
  ],
  K1: [
    ['ball', '切线|The tangent', '粉色线贴着曲线|Pink line touches the curve', '小球处的粉色线叫切线，它有多斜，就是这里的陡度（导数）。切线越陡，这里的坡就越陡。|The pink line at the ball is the tangent; its slope is the steepness here (the derivative). The steeper the tangent, the steeper the hill here.', '拖小球，看陡度数字变。|Drag the ball and watch the number.'],
    ['bot', '谷底|The bottom', '陡度是 0|Steepness 0', '在谷底，切线是平的，陡度是 0。所以找最低点，就是找陡度为 0 的地方。|At the bottom the tangent is flat and the steepness is 0. So finding the lowest point means finding where the steepness is 0.', '把小球拖到最低点。|Drag the ball to the lowest point.'],
  ],
  K2: [
    ['red', '红箭头 (1,0)|Red arrow (1,0)', '这里不动|Stays put', '矩阵 [1 k; 0 1] 把 (1,0) 送到 (1,0)，所以红箭头不动。矩阵的第一列就是红箭头被送到的地方。|The matrix [1 k; 0 1] sends (1,0) to (1,0), so red stays. The first column of the matrix is where red goes.', '拖滑块时盯着红箭头。|Watch red while you drag.'],
    ['grn', '绿箭头 (0,1)|Green arrow (0,1)', '变成 (k,1)|Becomes (k,1)', '(0,1) 被送到 (k,1)，所以绿箭头往旁边倒。矩阵的第二列就是绿箭头被送到的地方；k 越大倒得越多。|(0,1) goes to (k,1), so green leans over. The second column is where green goes; the bigger k, the more it leans.', '把 k 拖到 1。|Drag k to 1.'],
    ['grid', '整张格子|The whole grid', '同一个规则|One rule', '格子里每一个点都按同一个规则移动，所以直线还是直线。只要知道两个箭头去哪，就知道整张格子怎么变。|Every point of the grid moves by the same rule, so straight lines stay straight. Knowing where the two arrows go tells you how the whole grid moves.', '看灰色旧格子和紫色新格子。|Compare the grey and purple grids.'],
  ],
  K3: [
    ['dice', '两颗骰子|Two dice', '加起来是 2 到 12|Sums 2 to 12', '每次扔两颗，把点数加起来，那根柱子就长高一点。扔得越多，柱子的形状越接近真正的概率。|Each roll adds the two dice; that sum’s bar grows. The more rolls, the closer the bars get to the true chances.', '多扔几次。|Roll many times.'],
    ['b7', '7 的柱子|The 7 bar', '最常出现|Most common', '和是 7 的组合最多（6 种），所以 7 最常出现。36 种结果里有 6 种是 7，概率是 1/6。|Seven has the most combinations (6), so it comes up most. 6 of the 36 outcomes make 7: a chance of 1/6.', '扔 30 次，看 7 是不是最高。|Roll 30 times: is 7 the tallest?'],
    ['b2', '2 的柱子|The 2 bar', '只有 1 种|Only one way', '和是 2 只有 1+1 一种组合，所以很少出现。概率只有 1/36，和 12 一样少。|A sum of 2 needs 1+1, only one way, so it is rare. Its chance is only 1/36, as rare as 12.', '和 7 比一比。|Compare it with 7.'],
  ],
  K4: [
    ['ball', '小球|The ball', '每步按学习率走|Steps by the learning rate', '学习率就是步子大小。合适的步子，几步就能到谷底。|The learning rate is the step size. A good one reaches the bottom in a few steps.', '点小球走一步。|Tap the ball to step.'],
    ['bot', '谷底|The bottom', '太大会冲过去|Too big overshoots', '太大的步子会冲过谷底，在两边跳来跳去。所以学习率要选得刚刚好。|Too big a step overshoots and bounces between the sides. So the learning rate has to be just right.', '把学习率拖到最大试试。|Max the learning rate.'],
  ],
  K5: [
    ['fwd', '往前|Forward', '数字一路乘过去|Multiplies along', '往前走时，数字每过一块石头就乘上那里的数：1 × 2 × 3 × 0.5 = 3。最后得到的就是输出。|Going forward, the number is multiplied at each stone: 1 × 2 × 3 × 0.5 = 3. What comes out at the end is the output.', '点“往前”三次。|Tap Forward three times.'],
    ['back', '往回|Back', '错误一块块传回|Error comes home', '往回传时，每块石头的陡度乘在一起：这就是链式法则。训练神经网络时，就是这样算出每个参数该怎么改。|Going back, each stone’s steepness multiplies: the chain rule. Training a neural network uses exactly this to find how to change each weight.', '走完再点“往回”。|Then tap Back.'],
    ['m0', '每块的陡度|Each stone’s factor', '×2、×3、×0.5|×2, ×3, ×0.5', '这些数是每一段的陡度，往前往回都用它们。往回时把它们乘起来：2 × 3 × 0.5 = 3。|These are the steepness of each hop, used both ways. Going back they multiply: 2 × 3 × 0.5 = 3.', '算一算往回到起点是几。|Work out the value back at the start.'],
  ],
};
export const labNotes = (id: string): RawNote[] => N[id] ?? [];
/** home: what each zone teaches (one short line per zone, in order) */
export const ZONE_S: string[] = [
  '用 AI 做事：App、Agent、工具|Using AI: apps, agents, tools',
  '大模型怎么一个词一个词地写|How a model writes word by word',
  '神经元、注意力、专家|Neurons, attention, experts',
  '看图、学习、分清用法和原理|Pictures, learning, use vs. inside',
  '导数、矩阵、概率、链式法则|Slopes, matrices, chance, chain rule',
];
/** the map: what the pillars and the bridges mean */
export const MAP_N: RawNote[] = [
  ['pil', '小柱子 = 一个站|Pillar = a station', '金色 = 测验做完了|Gold = quiz done', '每个小岛是一个区，岛上每根小柱子是一个站。做完一个站的测验，它的柱子就变成金色。|Each island is a zone and each pillar on it is a station. Finish a station’s quiz and its pillar turns gold.', '点一个岛，进去学一个站。|Tap an island to go in and learn a station.'],
  ['br', '发光的桥|Glowing bridges', '建议的学习顺序|The suggested order', '桥按顺序连起五个区：先远看怎么用，再近看大模型，再进模型内部，最后是专题和数学。可以按桥的顺序走，也可以直接跳去想看的区。|The bridges join the five zones in order: how to use AI first, then the model, then its insides, then topics and maths. Follow the bridges in order, or jump straight to any zone.', '从左下第一个岛开始。|Start at the first island, bottom left.'],
];
/** home and zone pages: one note on how to explore, beside the station notes */
export const HOME_N: RawNote = ['base', 'ⓘ 怎么逛|How to explore', '一共 5 个区|5 zones in all', '五个区从“怎么用 AI”一路讲到“背后的数学”。左右拖动转圈，点区的名字看介绍，再点“进入”。|Five zones run from using AI to the maths behind it. Drag to turn the ring, tap a zone’s name for its intro, then Enter.', '往左拖一下，看下一个区。|Drag left once to see the next zone.'];
export const zoneNote = (i: number, n: number): RawNote => ['base', 'ⓘ 这个区|About this zone', `${n} 个站 · 想法→实验→测验|${n} station${n > 1 ? 's' : ''} · ideas → lab → quiz`,
  `${ZONE_S[i]!.split('|')[0]}。每个站先看 3D 想法，再动手做实验，最后做测验。|${ZONE_S[i]!.split('|')[1]}. Each station: 3D ideas, a hands-on lab, then a quiz.`,
  n > 1 ? '左右拖动转圈，点一个站的名字。|Drag to turn the ring and tap a station’s name.' : '点这个站的名字，再点“进入”。|Tap the station’s name, then Enter.'];
