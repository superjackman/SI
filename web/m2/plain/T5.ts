/* R15 plain-language layer for T5 (MoE and efficient architectures: same skill, cheaper). No KaTeX here; the LoRA lab's
   letters (W, A, B, d, k, r) are explained in its plain line. */
import type { PStation } from './types';
import { B } from './types';

const T5: PStation = {
  cards: {
    c_T5_0: {
      zh: `<p>这一站讲的是<b>省钱的窍门</b>：怎么让大模型算得更便宜、更快，还能读更长的文章。就像开餐馆：请很多专科厨师但每道菜只叫一两位、提前备好半成品、用小一号的盘子装、让学徒先试做再由大厨把关。</p>`,
      en: `<p>This stop is about <b>ways to save</b>: making large models cheaper and faster to run, and able to read longer texts. Like running a restaurant: hire many specialist cooks but call only one or two per dish, prepare ingredients in advance, use smaller plates, and let an apprentice try first while the head chef checks.</p>`,
    },
    moeCard: {
      keep: true,
      zh: `<p>MoE 像一排<b>专科医生加一个分诊台</b>：每个词只派给几位医生（k 位），其他医生不用出手，所以省力气。但医生们都得在岗等着，所以省的是计算，不省存放的地方。分诊台还容易偏心，要额外罚它，让大家都有活干。</p>`,
      en: `<p>MoE is like a row of <b>specialist doctors with a front desk</b>: each word is sent to only a few doctors (k of them) and the rest do nothing, which saves effort. But every doctor must still be on duty, so it saves computing, not storage space. The front desk also tends to play favourites, so it is penalised to keep everyone busy.</p>`,
    },
    attnVCard: {
      keep: true,
      zh: `<p>写下一个字时，要回头看前面所有的字。把前面每个字的“标签卡和内容卡”<b>存起来</b>（KV 缓存），就不用每次都重算，像把算好的草稿留着。但存的东西很占地方，所以让好几组“提问”共用一份卡（分组查询），能省很多。</p>`,
      en: `<p>To write the next word, the model looks back at every earlier word. <b>Saving</b> each earlier word’s “key and value cards” (the KV cache) means no recomputing every time, like keeping your finished working-out. But the saved cards take a lot of room, so several groups of “questions” share one set of cards (grouped-query attention), which saves a lot.</p>`,
    },
    quantCard: {
      keep: true,
      zh: `<p>量化就像<b>用更粗的尺子</b>量东西：本来量到毫米，现在只量到厘米。每个数少用几位，模型变小、读得更快；但尺子太粗，误差就大了。点不同的位数看看。</p>`,
      en: `<p>Quantisation is like measuring with a <b>coarser ruler</b>: millimetres become centimetres. Each number uses fewer bits, so the model gets smaller and faster to read; but if the ruler is too coarse, the errors grow. Try different bit counts.</p>`,
    },
    loraCard: {
      keep: true,
      zh: `<p>想教大模型一门新本事，不用改动它的全部数字：LoRA 在旁边<b>贴一块很瘦的补丁</b>，只训练补丁。补丁越“瘦”（r 越小），要学的数字越少。拖动滑块看看能省多少。</p>`,
      en: `<p>To teach a large model a new skill you need not change all its numbers: LoRA <b>sticks a very thin patch</b> beside them and trains only the patch. The thinner the patch (the smaller r), the fewer numbers there are to learn. Drag the sliders to see how much is saved.</p>`,
      more: B(`补丁不总是够用：要大幅改变模型能力的任务，可能还是全部重新调更好；r 取多大主要靠经验。`,
        `A patch is not always enough: for tasks that change the model’s abilities a lot, adjusting everything may still be better, and the choice of r is mostly a matter of experience.`),
    },
    specCard: {
      keep: true,
      zh: `<p>投机解码像<b>学徒先写、大厨批改</b>：小模型飞快地猜几个词，大模型一次把这几个全检查完（一次查几个和查一个差不多快）。猜对的直接收下，第一个猜错的地方由大模型改正。按“走一轮”看看。</p>`,
      en: `<p>Speculative decoding is like an <b>apprentice drafting and the head chef correcting</b>: a small model quickly guesses a few words, and the large model checks them all at once (checking several takes about as long as one). Correct guesses are kept, and the first wrong one is fixed by the large model. Press “Run a round” to see.</p>`,
    },
    c_T5_1: {
      zh: `<p>把模型放到网上给很多人用，就像开一家<b>快餐店</b>：把好几个人的单子凑在一起做（批处理），一次拿出材料就能做一大批；做好的半成品留着复用。快多少、省多少，要看机器、模型和客人多少，所以这里不给具体倍数。</p>`,
      en: `<p>Serving a model to many people online is like running a <b>fast-food kitchen</b>: several people’s orders are cooked together (batching), so one trip for the ingredients feeds a whole batch, and ready-made parts are reused. How much faster or cheaper depends on the machines, the model and how many customers there are, so no exact figures are given here.</p>`,
    },
    xSsm: {
      zh: `<p>Transformer 不是唯一的做法。有的新设计像<b>边读边记小本子</b>，本子大小固定，读多长都不会越来越慢；有的把两种做法混着用；还有的像拼图，先遮住一些词再一点点补回来。这些都还在探索中。</p>`,
      en: `<p>The Transformer is not the only way. Some new designs are like <b>keeping a fixed-size notebook while reading</b>, so longer texts do not slow them down; some mix two approaches; others work like a jigsaw, hiding some words and filling them back in bit by bit. All of these are still being explored.</p>`,
    },
    xPrec: {
      zh: `<p>两个不改模型、只改“怎么算”的窍门：一是<b>把数写短一点</b>（用更少的位数），算得快、占地小；二是把注意力<b>分成小块</b>在显卡里最快的那一小块地方算完，少来回搬东西，结果一点不差。</p>`,
      en: `<p>Two tricks that change only “how to calculate”, not the model: first, <b>write numbers shorter</b> (with fewer bits), which is faster and takes less room; second, <b>split attention into small tiles</b> and finish each in the graphics chip’s fastest little memory, moving data back and forth less, with exactly the same result.</p>`,
    },
    labMoe: {
      zh: `<p>调专家有几位、每个词派给几位（k），开关“负载均衡”，看看派单会不会越来越偏心（规则是编的简化模拟）。</p>`,
      en: `<p>Set how many experts there are, how many each word goes to (k), and switch load balancing on or off; see whether the dispatching gets more and more lopsided (a simplified simulation with made-up rules).</p>`,
    },
    labKv: {
      zh: `<p>算一算：模型本身加上“存起来的前文”，一张显卡装不装得下？试着加长文章、多加几位同时使用的人（配置是示例）。</p>`,
      en: `<p>Work it out: will the model plus the “saved earlier text” fit on the graphics cards? Try longer texts and more people using it at once (the settings are an example).</p>`,
    },
    labQuant: {
      zh: `<p>拖动“位数”，看尺子变粗后数字被量成什么样；混进一个特别大的数，再打开“分组”，看看有什么不同（数字是示例）。</p>`,
      en: `<p>Drag the “bits” slider and see what the numbers become with a coarser ruler; mix in one very large number, then switch on “groups”, and see the difference (the numbers are an example).</p>`,
    },
    labLora: {
      zh: `<p>W 是原来那张大表（d 行、k 列），不动它；只训练两张瘦表 B（d 行、r 列）和 A（r 行、k 列）。r 越小，要训练的数字越少。</p>`,
      en: `<p>W is the original big table (d rows, k columns), left untouched; only two thin tables are trained: B (d rows, r columns) and A (r rows, k columns). The smaller r is, the fewer numbers there are to train.</p>`,
    },
  },
};
export default T5;
