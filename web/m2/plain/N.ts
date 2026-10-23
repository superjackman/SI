/* R15 plain-language layer for N (neural networks: from one neuron to the training loop). No KaTeX here; the labs whose
   controls are letters (w, b, x, z, A/B/C) say what each letter means in their plain line. */
import type { PStation } from './types';
import { B } from './types';

const N: PStation = {
  cards: {
    c_N_0: {
      zh: `<p>神经网络是用很多个<b>小零件</b>搭起来的。每个零件只会一件事：把几个数各乘一个“重要程度”再加起来，然后过一道“开关”。成千上万个这样的零件一层层叠起来，就能做很复杂的事。</p>
<p>它的本事是<b>练出来</b>的：先猜一个答案，看错了多少，算出每个旋钮该往哪边拧，拧一点点，再来一遍。</p>`,
      en: `<p>A neural network is built from lots of <b>tiny parts</b>. Each part does one thing: multiply a few numbers by how “important” each is, add them up, and pass the result through a “switch”. Stack thousands of these parts in layers and they can do very complicated things.</p>
<p>Its skill is <b>practised</b>: guess an answer, see how wrong it is, work out which way each knob should turn, turn it a little, and go again.</p>`,
    },
    c_N_1: {
      zh: `<p>一句话记住每个零件：<b>神经元</b>是最小的零件；很多神经元并排是一<b>层</b>；很多层叠起来是<b>网络</b>。<b>损失</b>是“错了多少”的一个分数；<b>反向传播</b>从错误往回查，算出每个旋钮的“责任”；<b>学习率</b>是每次拧多大。</p>`,
      en: `<p>Remember each part in one line: a <b>neuron</b> is the smallest part; many neurons side by side make a <b>layer</b>; many layers stacked make a <b>network</b>. The <b>loss</b> is one score for “how wrong”; <b>backpropagation</b> traces back from the mistake to work out each knob’s “share of the blame”; the <b>learning rate</b> is how far each knob is turned each time.</p>`,
    },
    labNeuron: {
      zh: `<p>一个神经元就像一次<b>投票</b>：x₁、x₂ 是两个输入，w₁、w₂ 是每个输入的票有多重，b（偏置）是门槛。拖动它们，看分界线怎么转、怎么挪。</p>`,
      en: `<p>One neuron is like a <b>vote</b>: x₁ and x₂ are two inputs, w₁ and w₂ say how much each input’s vote counts, and b (the bias) is the bar to clear. Drag them and watch the dividing line turn and move.</p>`,
    },
    labAct: {
      zh: `<p>“开关”（激活函数）把直线掰弯。z 是送进开关的数。看看不同开关的形状；层数叠多了，有的开关会让“该怎么改”的信号越传越弱。</p>`,
      en: `<p>The “switch” (the activation function) bends straight lines. z is the number going into the switch. Compare the shapes; with many layers stacked, some switches make the “how to fix it” signal fade away as it is passed back.</p>`,
    },
    labGraph: {
      zh: `<p>一步一步看一次训练：x 是输入，w 是权重，b 是偏置。先往前算出答案和错误 L，再往回算出 w 和 b 各该改多少，最后改一点点。</p>`,
      en: `<p>Watch one round of training step by step: x is the input, w the weight, b the bias. First work forward to the answer and the error L, then work back to how much w and b should each change, then change them a little.</p>`,
    },
    labOpt: {
      zh: `<p>看三种“下山走法”在同一块地形上比赛：普通的一步一步走、带惯性的走法（动量）、会自己调步子的走法（Adam）。也试试步子太大会怎样。</p>`,
      en: `<p>Watch three ways of “walking downhill” race on the same ground: plain step by step, walking with momentum, and a walk that adjusts its own step size (Adam). Also try what happens when the steps are too big.</p>`,
    },
    c_N_2: {
      zh: `<p>练习题要分成三份，像学校里的<b>作业、小测和期末考</b>：作业用来学；小测用来看学得怎么样、该什么时候停；期末考只在最后考一次，看真本事。每次只拿一小叠作业来改进，全部做完一遍叫一<b>轮</b>。</p>`,
      en: `<p>The examples are split three ways, like <b>homework, quizzes and the final exam</b>: homework is for learning; quizzes check progress and say when to stop; the final is taken only once, at the end, to show real skill. Each improvement uses a small stack of homework; going through all of it once is one <b>epoch</b>.</p>`,
    },
    c_N_3: {
      zh: `<p>信号要一层一层传下去，像<b>传话游戏</b>：每个人说话都大声一点，传几十个人以后就成了吼叫；每人都小声一点，最后就听不见了。所以开始时要把旋钮设成合适的大小，每层还要把“音量”调回正常。</p>`,
      en: `<p>Signals pass from layer to layer like a game of <b>telephone</b>: if everyone speaks a bit louder, after dozens of people it becomes shouting; if everyone speaks a bit softer, it fades to nothing. So the knobs start at sensible sizes, and each layer turns the “volume” back to normal.</p>`,
    },
    labTiny: {
      zh: `<p>训练一个小网络把两种点分开。神经元太少学不会；太多、数据又少，它会把杂音都背下来，换新题就错。看看什么时候该停下来。</p>`,
      en: `<p>Train a small network to separate two kinds of dots. Too few neurons and it cannot learn; too many with little data and it memorises the noise, then fails on new points. See when it is time to stop.</p>`,
    },
    c_N_4: {
      zh: `<p>只会<b>死记硬背</b>的学生，换一道新题就不会了。“正则化”就是各种防背题的办法：让旋钮别拧得太极端、练习时随机让一部分神经元休息、小测变差就停、多给些不同的练习题。</p>`,
      en: `<p>A student who only <b>memorises answers</b> is stuck on a new question. “Regularisation” is the set of tricks against memorising: keep the knobs from going to extremes, let some neurons rest at random during practice, stop when the quiz scores get worse, and give more varied examples.</p>`,
    },
    c_N_5: {
      zh: `<p>看图片的网络用一块<b>小放大镜</b>在图上到处滑：同一块放大镜在哪儿都找同样的图案，比如一道边、一个角。一层层往上拼：边 → 纹理 → 零件 → 整个东西。这样要学的数字少得多，猫在左上还是右下都认得出来。</p>`,
      en: `<p>A network for pictures slides a <b>small magnifying glass</b> all over the image: the same glass looks for the same pattern everywhere, like an edge or a corner. Layer by layer the patterns build up: edges → textures → parts → whole things. That means far fewer numbers to learn, and a cat is recognised whether it is top-left or bottom-right.</p>`,
    },
    c_N_6: {
      zh: `<p>老式的循环网络像<b>一个人读书</b>：一个词一个词地读，读过的都塞进一个小本子里，读到后面，前面的就记不清了，也没法几个人同时读。Transformer 让所有词一起读，任意两个词都能直接“对话”，所以快得多，也记得住远处的内容。</p>`,
      en: `<p>Older recurrent networks are like <b>one person reading a book</b>: word by word, squeezing everything into one small notebook, so by the end the beginning is fuzzy, and nobody can share the reading. A Transformer reads all the words at once, and any two words can “talk” directly, so it is much faster and remembers far-away parts.</p>`,
    },
    labVec: {
      zh: `<p>每个词是图上的一个点，意思近的词挨得近。A − B + C 是“从 A 出发，减掉 B 的意思，加上 C 的意思”，看箭头落在哪个词旁边（坐标是摆出来的示意）。</p>`,
      en: `<p>Each word is a dot on the map, and words with similar meanings sit close together. A − B + C means “start at A, take away B’s meaning, add C’s”; see which word the arrow lands next to (the positions are an illustrative layout).</p>`,
    },
    c_N_7: {
      zh: `<p>神经网络的想法已经有<b>八十多年</b>了。很多点子很早就有，2012 年以后突然变强，是因为三样东西终于凑齐：海量的数据、够快的显卡，以及让很深的网络也能练起来的小窍门。</p>`,
      en: `<p>The idea of neural networks is <b>over eighty years</b> old. Many of the ideas came early; they suddenly got strong after 2012 because three things finally came together: huge amounts of data, fast enough graphics chips, and tricks that let very deep networks train.</p>`,
    },
    xGen: {
      zh: `<p>怎么让网络<b>画出新东西</b>？一种办法是先学会把图压缩成几个数再还原；然后随便挑几个数，就能还原出一张新图。另一种办法像<b>造假币的和验钞的比赛</b>：一个网络造图，另一个网络分辨真假，两边一起越练越强。</p>`,
      en: `<p>How can a network <b>make new things</b>? One way: learn to squeeze a picture into a few numbers and rebuild it; then pick some numbers at random and rebuild a brand-new picture. Another is like a <b>contest between a forger and a bank teller</b>: one network makes pictures, the other tells real from fake, and both get better together.</p>`,
      more: B(`“随便挑几个数”要加条件：只有像 VAE 那样训练时专门把这些数的分布拉向一个标准形状，随便挑出来的数才大多能还原成像样的图；普通的自编码器做不到。造假和验钞的比赛也可能失衡，造图的一方会只会画同一张图（模式坍塌）。`,
        `“Pick some numbers at random” needs a condition: only when training deliberately pulls those numbers towards a standard shape, as a VAE does, do random picks mostly rebuild into decent pictures; a plain autoencoder cannot. The forger-and-teller contest can also get out of balance, so the forger ends up drawing the same picture every time (mode collapse).`),
    },
  },
};
export default N;
