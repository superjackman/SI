/* R15 plain-language layer for T6 (multimodal: seeing, hearing and generating pictures, sound, video and 3D). No KaTeX here. */
import type { PStation } from './types';
import { B } from './types';

const T6: PStation = {
  cards: {
    c_T6_0: {
      keep: true,
      zh: `<p>大模型本来只认识文字。要让它看图、听声，就先把图片和声音<b>翻译成它认识的“小积木”</b>（和文字一样的一串编号或一串数字），再一起交给它。要它画画、说话时，再把积木拼回图片和声音。点图里的方块看每一步。</p>`,
      en: `<p>A large model only knows text at first. To let it see pictures and hear sounds, we first <b>translate them into “building blocks” it knows</b> (a string of numbers, just like text), then hand them over together. To make it draw or speak, the blocks are assembled back into pictures and sound. Tap the boxes in the diagram to see each step.</p>`,
      more: B(`生成那一侧不一定是“接龙出积木”：图片和视频常用扩散（从噪点一步步变清楚），只是同样在一串数字上做。`,
        `The generating side is not always “chaining blocks one by one”: pictures and video often use diffusion (turning noise clearer step by step), which still works on strings of numbers.`),
    },
    mmVis: {
      keep: true,
      zh: `<p>看图时，先把图片像<b>切豆腐块</b>一样切成很多小方块，每块变成一串数字，再请大模型一起读。块切得小，细节清楚，但块数多、算得慢。点下面的块大小试试。</p>`,
      en: `<p>To look at a picture, it is first <b>cut into little squares like tofu</b>; each square becomes a string of numbers, and the large model reads them together. Small squares keep detail but there are more of them, so it is slower. Try the square sizes below.</p>`,
    },
    mmAud: {
      keep: true,
      zh: `<p>声音录下来是一长串上上下下的数字，看着很乱。把它拆成“<b>有哪些高音、低音，各有多响</b>”（频谱），就像把一杯混合果汁分回各种水果，一下就清楚了。调两个音的高低和音量，听一听、看一看。</p>`,
      en: `<p>Recorded sound is a long, messy string of up-and-down numbers. Splitting it into “<b>which high and low notes are there, and how loud each is</b>” (a spectrum) is like separating a mixed juice back into its fruits: suddenly it is clear. Change the two notes’ pitch and loudness, then listen and look.</p>`,
    },
    mmClip: {
      keep: true,
      zh: `<p>这是一个<b>连连看</b>：给模型很多“图片 + 它的说明”，让配对的图和话靠近，不配对的离远。练多了，“橘猫睡觉”这句话就会落在橘猫睡觉的照片旁边。按“训练一步”看表格怎么变。</p>`,
      en: `<p>This is a <b>matching game</b>: give the model many “picture + its caption” pairs, pull matching pictures and words together and push non-matching ones apart. After lots of practice, the words “ginger cat sleeping” land next to photos of a sleeping ginger cat. Press “train one step” to see the table change.</p>`,
    },
    genText: {
      keep: true,
      zh: `<p>写文字就是前面讲过的<b>词语接龙</b>：一次接一个。图片、声音变成积木之后，也能用同样的办法一块一块接出来。</p>`,
      en: `<p>Writing text is the <b>word-chain game</b> from earlier: one word at a time. Once pictures and sounds are turned into blocks, they can be chained out block by block in the same way.</p>`,
    },
    genImg: {
      keep: true,
      zh: `<p>画图像<b>擦起雾的玻璃</b>：从一团雪花点开始，按文字提示一点点擦清楚，每一步只擦一点，最后出现一张新图。拖动滑块看从清楚到全是雪花点、再变回来。</p>`,
      en: `<p>Drawing a picture is like <b>wiping a fogged-up window</b>: start from a mess of static, follow the text prompt and wipe a little clearer each step, until a new picture appears. Drag the slider to go from clear to pure static and back.</p>`,
      more: B(`真正的模型并不知道原图，每一步只是猜“噪点长什么样”再减掉一点，所以画出的是一张全新的图；这里的演示为了直观，用了已知的原图。`,
        `A real model does not know any original picture; each step it only guesses “what the noise looks like” and removes a bit, so it draws a brand-new picture. This demo uses a known picture just to make it easy to see.`),
    },
    genAud: {
      keep: true,
      zh: `<p>让模型说话、唱歌，就是把“听声音”倒过来：先写出“<b>声音积木</b>”或频谱，再交给声码器还原成能播放的声音。模仿别人的声音必须经过本人同意。</p>`,
      en: `<p>Making a model speak or sing is “hearing” run backwards: it first writes out “<b>sound blocks</b>” or a spectrum, then a vocoder turns them back into sound you can play. Copying someone’s voice needs that person’s permission.</p>`,
    },
    genVid: {
      keep: true,
      zh: `<p>视频就是一张张连着放的图。如果每张单独画，同一只猫可能这张白、下张黄，画面会闪。所以要让<b>所有画面一起商量着画</b>。点按钮对比两种做法。</p>`,
      en: `<p>A video is many pictures shown one after another. If each is drawn separately, the same cat might be white in one and ginger in the next, and the picture flickers. So <b>all the frames are drawn together, “talking to each other”</b>. Press the buttons to compare the two ways.</p>`,
    },
    gen3d: {
      keep: true,
      zh: `<p>一个立体的东西，<b>从哪个角度看都要说得通</b>。常见做法是先画出同一个东西的几张不同角度的图，再像拼模型一样拼成立体的。拖动滑块转一转这个小雪人。</p>`,
      en: `<p>A 3D object has to <b>make sense from every angle</b>. A common way is to draw several pictures of the same thing from different angles, then assemble them into a solid shape like building a model. Drag the slider to turn the little snowman.</p>`,
    },
    xVoice: {
      zh: `<p>和 AI 打电话有两种做法：一种是<b>“听写—思考—朗读”三个人接力</b>，每一段都能单独换和检查，但慢一些，语气也会丢；另一种是<b>一个人直接听、直接说</b>，快、能插话，但更难加检查。</p>`,
      en: `<p>There are two ways to talk to an AI on the phone: a <b>relay of three helpers, “write down, think, read aloud”</b>, where each part can be swapped and checked but it is slower and loses tone of voice; or <b>one helper who listens and speaks directly</b>, faster and able to handle interruptions, but harder to add checks to.</p>`,
    },
    xDoc: {
      zh: `<p>让 AI 读文件和截图，不只是<b>认字</b>，还要看懂哪里是标题、哪里是表格、按钮在哪。小字、手写和模糊的图容易认错，所以金额和日期一定要自己再核对。</p>`,
      en: `<p>Having an AI read documents and screenshots is not just <b>recognising letters</b>; it must also understand where the headings, tables and buttons are. Small print, handwriting and blurry pictures are easy to misread, so always double-check amounts and dates yourself.</p>`,
    },
    xEdit: {
      zh: `<p>除了画新图，AI 还能<b>按你一句话改图</b>（“把天空改成晚霞”），也能看懂一段视频。小窍门：一次只让它改一件事；问视频时说清是哪一段。</p>`,
      en: `<p>Besides drawing new pictures, AI can <b>edit a picture from one sentence</b> (“make the sky a sunset”) and understand a video clip. Tips: ask for one change at a time, and say which part of the video you mean.</p>`,
    },
    labDiff: {
      zh: `<p>选一个图案，调“去噪步数”（擦几遍）和“引导强度”（多听提示词的话），看结果怎么变（去噪器是用公式假装的示意模拟）。</p>`,
      en: `<p>Pick a picture, set the “denoising steps” (how many wipes) and the “guidance strength” (how closely it follows the prompt), and see how the result changes (the denoiser is faked with a formula, a simplified simulation).</p>`,
    },
  },
};
export default T6;
