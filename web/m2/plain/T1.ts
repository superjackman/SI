/* R15 plain-language layer for T1 (home: the whole picture). No formulas on this station. */
import type { PStation } from './types';

const T1: PStation = {
  cards: {
    c_T1_0: {
      zh: `<p>你对 AI 说一句话，它背后其实有<b>六层</b>在接力干活，就像一家餐厅：有人点菜、有人安排、有人掌勺、有人采购。</p>
<ul class="pts"><li><b>你</b>：说出想要什么。</li><li><b>Agent 应用</b>：小管家，安排先做什么、后做什么，还会帮你去查、去点按钮。</li><li><b>大模型</b>：大脑，负责“想”和“写”。</li><li><b>多模态</b>：眼睛、耳朵和画笔，让它能看图、听声音、画画。</li><li><b>训练</b>：上学，大脑的本事是提前学出来的。</li><li><b>算力</b>：发电站和厨房，让这一切真的跑起来。</li></ul>
<p>点下面图里的任意方块，就能看到它是干什么的。</p>`,
      en: `<p>When you say one sentence to an AI, <b>six layers</b> pass the job along behind it, like a restaurant where someone orders, someone plans, someone cooks and someone buys the food.</p>
<ul class="pts"><li><b>You</b>: say what you want.</li><li><b>Agent app</b>: the helper that plans what to do first and next, and goes off to look things up or press buttons for you.</li><li><b>Large model</b>: the brain that does the “thinking” and “writing”.</li><li><b>Multimodal</b>: eyes, ears and a paintbrush, so it can see pictures, hear sounds and draw.</li><li><b>Training</b>: school; the brain learned its skills in advance.</li><li><b>Compute</b>: the power station and the kitchen that make it all actually run.</li></ul>
<p>Tap any box in the picture below to see what it does.</p>`,
    },
    walkCard: {
      keep: true,
      zh: `<p>跟着一个例子走一遍：“帮我查明天杭州天气，要下雨就提醒我带伞。”按<b>播放</b>，上面图里正在干活的那一层会变成<b>黄色</b>。例子里的工具和天气数据都是编的（示例数据）。</p>`,
      en: `<p>Follow one example all the way: “Check tomorrow’s weather in Hangzhou and remind me to take an umbrella if it rains.” Press <b>Play</b>: the layer that is working lights up <b>yellow</b> in the picture above. The tools and weather data in the example are made up (example data).</p>`,
    },
    c_T1_1: {
      zh: `<p>每一层用一句话记住：</p>
<ul class="pts"><li>你的一句话：一切的开头。</li><li>Agent 应用：会动手的小管家。</li><li>大模型：读一段字，再一小块一小块地往下写。</li><li>多模态：把图片和声音变成大模型能读的小块，或者反过来。</li><li>训练：先读海量文字打基础，再学规矩。</li><li>算力：成千上万块显卡（GPU）一起算。</li></ul>
<p>这里的“小块”叫 <b>token</b>：大模型读写文字时用的最小单位，大概一个字或半个词那么大。</p>`,
      en: `<p>Remember each layer in one sentence:</p>
<ul class="pts"><li>Your sentence: where everything starts.</li><li>Agent app: a helper that can actually do things.</li><li>Large model: reads some text, then writes what comes next, one small piece at a time.</li><li>Multimodal: turns pictures and sounds into pieces the model can read, or back again.</li><li>Training: first reads a huge amount of text to learn the basics, then learns the rules.</li><li>Compute: thousands of graphics chips (GPUs) working together.</li></ul>
<p>Those “small pieces” are called <b>tokens</b>: the smallest units the model reads and writes, roughly a short word or part of a word.</p>`,
      more: {
        zh: `token 不一定正好是一个字：可能是一个字、一个词的一部分、一个标点，具体怎么切由每个模型的“分词器”决定。`,
        en: `A token is not always exactly one word: it can be a whole word, part of a word, or a punctuation mark. Each model’s tokenizer decides how text is cut up.`,
      },
    },
    c_T1_2: {
      zh: `<p>为什么要分好几层？就像学校里有老师、厨师、司机，<b>各干各最擅长的事</b>：大模型擅长“想”（读懂你的话、决定下一步），普通程序擅长“做”（一字不差地执行、连上别的系统、检查有没有权限）。</p>
<p>分开以后，换一个更好的模型、加一个新工具、重新训练一次，都不用把别的层推倒重来。</p>
<p>不过也有代价：步骤越多，越容易有一步出错，也越花时间。</p>`,
      en: `<p>Why split it into layers? Like a school with teachers, cooks and drivers, <b>each does what it is best at</b>: the large model is good at “thinking” (understanding you, deciding the next step), and ordinary programs are good at “doing” (following instructions exactly, connecting to other systems, checking permissions).</p>
<p>Because they are separate, you can swap in a better model, add a new tool or retrain, without rebuilding the other layers.</p>
<p>There is a cost: the more steps, the more chances that one step goes wrong, and the longer it takes.</p>`,
    },
    xComply: {
      zh: `<p>用 AI 也要守规矩，就像过马路要看红绿灯：</p>
<ul class="pts"><li><b>版权</b>：别人写的书、画的画、拍的照片受法律保护；AI 能不能拿它们来学、AI 做出来的东西算谁的，各个国家还在讨论。</li><li><b>隐私</b>：用别人的名字、照片、电话这类个人信息，一般要先经过本人同意（法律另有规定的情况除外）。</li><li><b>标出来</b>：AI 做出来的图片、视频、文字，发出去时要标明“这是 AI 生成的”。</li></ul>
<p>这里只是大概介绍，不是法律意见；真要用，以官方最新的规定为准。</p>`,
      en: `<p>Using AI comes with rules, like checking the traffic lights before crossing the road:</p>
<ul class="pts"><li><b>Copyright</b>: books, drawings and photos made by others are protected by law; whether AI may learn from them, and who owns what AI makes, is still being discussed in each country.</li><li><b>Privacy</b>: using someone’s personal details, such as their name, photo or phone number, generally needs their consent first (unless the law says otherwise).</li><li><b>Label it</b>: pictures, videos and text made by AI should say “made by AI” when you share them.</li></ul>
<p>This is only an overview, not legal advice; always check the latest official rules.</p>`,
    },
  },
};
export default T1;
