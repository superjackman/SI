/* R34 zone 4 "Topics & reference": T6, T7, T8 */
import type { RawSt } from './types';
export const Z: Record<string, RawSt> = {
  T6: {
    i: [
      ['AI 也能看图、听声音：先把它们也切成小块。|AI can see pictures and hear sounds too: first cut them into small pieces.', [
        ['frame', '图片切块|Picture patches', '一张图被切成很多小方块。|A picture is cut into many small squares.', '每个方块就像一个“词块”。|Each square works like a word token.'],
        ['wave', '声音切片|Sound slices', '声音被切成很短很短的一段段。|Sound is cut into very short slices.', '一段段排好，模型就能“听”。|Lined up, the model can “listen”.'],
        ['letters', '排成一行|In one row', '图块、声音块、字块排在一起，模型一起读。|Picture, sound and word pieces line up and are read together.', '所以它能边看图边回答问题。|That is how it answers questions about a picture.'],
      ]],
      ['画图的 AI 反过来：从一团“雪花”里慢慢擦出一幅画。|Picture-making AI works backwards: it slowly wipes a picture out of fuzzy snow.', [
        ['cloud', '一团雪花|Fuzzy snow', '一开始是一片乱乱的点。|It starts as random dots.', '模型每次擦掉一点乱点。|Each step the model removes a little fuzz.'],
        ['frame', '慢慢变清楚|Slowly clearer', '擦很多次以后，画就出现了。|After many steps, the picture appears.', '你的文字告诉它往哪个方向擦。|Your words tell it which way to wipe.'],
        ['magnet', '图和字配对|Match picture and words', '它学过很多“图 + 说明”的配对。|It learned from many picture-plus-caption pairs.', '所以能知道“红色的猫”长什么样。|So it knows what “a red cat” looks like.'],
      ]],
    ],
    lab: ['patch', '点这幅画，看它被切成小方块，再排成一行给模型读。|Tap the picture: it is cut into squares and lined up for the model to read.', '图片的小方块和文字的词块一样，模型都能读。|Picture squares work like word tokens; the model reads both.'],
    q: [
      ['模型怎么“看”一张图？|How does a model “see” a picture?', ['把图切成小方块来读|Cuts it into squares and reads them', '用真的眼睛|With real eyes', '闻一闻|Smells it'], 0, '想想图片切块。|Think of picture patches.'],
      ['画图 AI 一开始是什么？|What does picture-making AI start from?', ['一团乱乱的雪花点|Random fuzzy dots', '一张照片|A photo', '一本书|A book'], 0, '它从雪花里擦出画。|It wipes a picture out of the snow.'],
    ],
    d: '你知道 AI 怎么看图听声了！|You know how AI sees and hears!',
  },
  T7: {
    i: [
      ['模型是练出来的，分三步：读书、学做题、听评价。|A model is trained in three steps: read, practise, get feedback.', [
        ['book', '读很多书|Read lots', '先读海量文字，玩猜下一个词。|First it reads tons of text, guessing the next word.', '不用老师批改，书自己就有答案。|No teacher needed: the text holds the answers.'],
        ['clipboard', '学做题|Practise', '再看很多“问题 + 好回答”的例子。|Then it studies many question-and-good-answer examples.', '这样它学会好好回答问题。|So it learns to answer helpfully.'],
        ['star', '听评价|Feedback', '人给回答打分，好的多做，坏的少做。|People rate answers; good ones are done more, bad ones less.', '像小狗做对了得到奖励。|Like a puppy getting a treat for doing it right.'],
      ]],
      ['训练要很多数据和很多电脑。|Training needs lots of data and lots of computers.', [
        ['valley', '往谷底走|Downhill', '每次猜错，就往“错得少”的方向挪一步。|Each mistake moves it a step toward fewer mistakes.', '走了几百万步，才练好。|It takes millions of steps.'],
        ['chip', '很多芯片|Many chips', '几千个芯片一起算好几个月。|Thousands of chips work together for months.', '所以训练一个大模型很贵。|That is why training a big model is expensive.'],
        ['funnel', '好数据|Good data', '数据要干净、要多样。|Data must be clean and varied.', '吃进去的是什么，学出来就是什么。|What goes in is what comes out.'],
      ]],
    ],
    lab: ['valley', '拖动滑块选步子大小，点小球走一步：看它能不能走到谷底。|Choose a step size, then tap the ball: can it reach the bottom?', '步子太小走得慢，太大会跳过谷底。|Too small is slow; too big jumps over the bottom.'],
    q: [
      ['训练的第一步是什么？|What is the first step of training?', ['读海量文字猜下一个词|Read lots of text and guess the next word', '直接上线|Go live straight away', '唱歌|Sing'], 0, '先读书。|Read first.'],
      ['“听评价”像什么？|Feedback training is like…', ['小狗做对得到奖励|A puppy getting a treat', '睡觉|Sleeping', '关机|Shutting down'], 0, '好的多做，坏的少做。|More of the good, less of the bad.'],
    ],
    d: '你知道模型怎么练成的了！|You know how a model is trained!',
  },
  T8: {
    i: [
      ['把学过的串起来：从你说的话，到芯片里的计算。|Connect everything: from your words to the chips’ sums.', [
        ['globe', '全景图|The big map', '应用 → Agent → 模型 → 零件 → 训练 → 算力。|App → agent → model → parts → training → computing.', '每一层都靠下一层撑着。|Each floor rests on the one below.'],
        ['letters', '词块|Token', '模型读写的最小一块。|The smallest piece a model reads or writes.', '价钱、长度都按它算。|Prices and lengths are counted in tokens.'],
        ['eye', '注意力|Attention', '词和词互相看一看。|Words looking at each other.', '这是 Transformer 的核心。|The heart of the Transformer.'],
      ]],
      ['常用词速查：记住这几个就够用了。|Quick words: knowing these few is enough.', [
        ['robot', 'Agent|Agent', '会用工具、一步步干活的 AI。|An AI that uses tools and works step by step.', '想、做、看，一圈一圈。|Think, act, look, round and round.'],
        ['valley', '训练|Training', '猜错就调，往谷底走。|Adjust after mistakes, walking downhill.', '要很多数据和电脑。|Needs lots of data and computers.'],
        ['plug', 'MCP|MCP', '给 AI 接工具的统一插口。|One common plug for AI tools.', '哪家的工具都能插。|Tools from anyone fit.'],
      ]],
    ],
    lab: ['sort', '把每个词放回它所在的层：上面用的，还是下面原理？|Put each word back in its place: the using side or the inside?', '上面是怎么用，下面是为什么行。|Top is how to use it; bottom is why it works.',
      { bins: ['怎么用|Using it', '原理|How it works'], items: [['plug', 'MCP 插口|MCP plug', 0], ['eye', '注意力|Attention', 1], ['robot', 'Agent|Agent', 0], ['valley', '梯度下降|Gradient descent', 1]] }],
    q: [
      ['从上到下，哪个顺序对？|Top to bottom, which order is right?', ['应用 → 模型 → 算力|App → model → computing', '算力 → 应用 → 模型|Computing → app → model', '模型 → 算力 → 应用|Model → computing → app'], 0, '每一层靠下一层撑着。|Each floor rests on the one below.'],
      ['“词块”是什么？|What is a token?', ['模型读写的最小一块|The smallest piece a model reads or writes', '一种饼干|A cookie', '一个网站|A website'], 0, '价钱和长度都按它算。|Prices and lengths count tokens.'],
      ['MCP 是用来干嘛的？|What is MCP for?', ['给 AI 接工具|Plugging tools into AI', '训练模型|Training models', '画画|Drawing'], 0, '统一的插口。|One common plug.'],
    ],
    d: '你把整张地图都串起来了！|You connected the whole map!',
  },
};
