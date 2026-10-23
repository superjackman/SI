/* R15 plain-language layer for T2 (Agent: the program loop that lets a large model actually do things). No formulas here.
   Cards with live controls or clickable diagrams are keep (the plain line goes on top, the card stays usable). */
import type { PStation } from './types';
import { B } from './types';

const T2: PStation = {
  cards: {
    c_T2_0: {
      zh: `<p>大模型就像一个<b>只会动嘴、不会动手</b>的聪明人：它能想、能写，但自己上不了网，也按不了按钮。<b>Agent</b> 是陪在它身边的小助手程序：大模型说“去查一下天气”，助手就真的去查，再把结果念给它听，它再想下一步。这样一圈一圈转，直到事情办完。</p>`,
      en: `<p>A large model is like a clever person who <b>can talk but has no hands</b>: it can think and write, but it cannot go online or press a button by itself. An <b>Agent</b> is the helper program at its side: when the model says “go and check the weather”, the helper really does it and reads the result back; then the model decides the next step. Round and round, until the job is done.</p>`,
    },
    c_T2_1: {
      keep: true,
      zh: `<p>按“下一步”，跟着助手一圈一圈地走：看一看、想一想、动手、看结果，再想。上面图里正在干活的方块会亮起来。</p>`,
      en: `<p>Press “Next” and follow the helper round by round: look, think, act, see the result, think again. The box that is working lights up in the picture above.</p>`,
    },
    toolCard: {
      keep: true,
      zh: `<p>大模型“用工具”，其实只是<b>填了一张表</b>：写清楚要用哪个工具、填什么内容。真正去做事的是程序；程序会先检查这张表填得对不对，填错了就退回去让它重填。下面可以改一改这张表试试。</p>`,
      en: `<p>When a large model “uses a tool”, it really just <b>fills in a form</b>: which tool, and what to put in it. A program does the actual work, and it first checks the form; if something is wrong, it hands it back to be filled in again. Try editing the form below.</p>`,
    },
    ragCard: {
      keep: true,
      zh: `<p>大模型记不住你家的私事，也不知道今天的新闻。办法像<b>开卷考试</b>：先从资料里翻出最相关的几段，夹在问题旁边一起交给它，它就能照着资料回答，还能说出出处。</p>`,
      en: `<p>A large model cannot remember your private papers or today’s news. The trick is like an <b>open-book test</b>: first find the few most relevant passages, put them next to the question, and hand both over; then it can answer from the material and say where the answer came from.</p>`,
    },
    c_T2_2: {
      zh: `<p>大事要<b>拆成小步</b>，就像做蛋糕：先买材料，再搅面糊，最后才能烤。有的步骤必须等前一步做完才能做，比如先知道会不会下雨，才知道要不要提醒带伞。</p>`,
      en: `<p>A big job is <b>split into small steps</b>, like baking a cake: buy the ingredients, mix the batter, and only then bake. Some steps must wait for an earlier one: you need to know whether it will rain before deciding to remind someone about an umbrella.</p>`,
    },
    c_T2_3: {
      keep: true,
      zh: `<p>同一个大模型，换上不同的“工作说明”和工具，就能扮演不同的角色，像一个小组里有人干活、有人检查。但人多不一定更好：传话会漏信息，也更花钱。</p>`,
      en: `<p>The same large model, given different “job descriptions” and tools, can play different roles, like a team where one person works and another checks. More is not always better, though: passing messages loses details, and it costs more.</p>`,
    },
    c_T2_4: {
      keep: true,
      zh: `<p>MCP 就像<b>统一的插座</b>：以前每个应用要给每个工具单独做一根线；有了统一插座，工具做一个插头、应用装一个插座，就都能连上。</p>`,
      en: `<p>MCP is like a <b>standard power socket</b>: before, every app needed its own special cable for every tool; with a standard socket, each tool makes one plug and each app fits one socket, and they all connect.</p>`,
    },
    riskCard: {
      keep: true,
      zh: `<p>助手会真的动手，所以要<b>装好门锁</b>：只给它干这件事需要的最少权限；发邮件、付钱这类重要的事，先问你。网页里也可能藏着骗它的坏话，下面的小实验可以看看防护开和关有什么不同。</p>`,
      en: `<p>The helper really acts, so it needs <b>good locks</b>: give it only the permissions this job needs, and ask you first before anything important, like sending email or paying. A web page might even hide words meant to trick it; the small experiment below shows the difference the protection makes.</p>`,
    },
    c_T2_5: {
      zh: `<p>为什么要“走一步、看一步”？一次就把复杂的事做对很难，但每走一步都能看到结果：出错了能发现、能改。就像走迷宫，碰到墙就换条路。代价是每转一圈都要再问一次大模型，更慢也更花钱，所以要设上限，必要时让人来接手。</p>`,
      en: `<p>Why “take a step, then look”? Getting a complicated job right in one go is hard, but after each step you see the result, so mistakes get noticed and fixed, like turning around in a maze when you hit a wall. The cost: every round asks the model again, which is slower and costs more, so there is a limit, and a person can take over when needed.</p>`,
    },
    xStruct: {
      zh: `<p>程序只看得懂格式整齐的表。所以大模型每写一小块字（token），都会先把<b>不合格式的选项划掉</b>，只在合格的里面挑，像填空题只能填数字的格子里不让写字。</p>`,
      en: `<p>Programs only understand neatly formatted forms. So each time the model writes a small piece of text (a token), the <b>options that break the format are crossed out</b> first and it picks only from the rest, like a box on a form that only accepts numbers.</p>`,
      more: B(`被划掉的选项概率直接变成 0，剩下的重新换算成加起来等于 1 的机会再抽。格式对了不代表内容对：城市名照样可能写错。`,
        `The crossed-out options get probability 0, and the rest are rescaled so their chances add up to 1 again before picking. A correct format does not mean correct content: the city name can still be wrong.`),
    },
    xRerank: {
      zh: `<p>找资料分两步，像<b>先海选、再决赛</b>：第一步用快办法从一大堆里挑出几十条可能有用的；第二步用更细心但更慢的办法，一条条和问题对照着重新排名，只把最前面几条交给大模型，并要求它注明出处。</p>`,
      en: `<p>Finding material happens in two rounds, like <b>auditions and then a final</b>: first a fast method picks a few dozen possibly useful pieces from a huge pile; then a slower, more careful method reads each one against the question and re-ranks them, and only the top few go to the model, which must say where its answer came from.</p>`,
    },
    xA2a: {
      zh: `<p>MCP 让助手接上<b>工具</b>；A2A 让助手和<b>别的助手</b>说话：互相介绍自己会干什么、分派任务、取回结果，就像两家公司的接待员对接工作，彼此不用知道对方内部怎么干。</p>`,
      en: `<p>MCP connects a helper to <b>tools</b>; A2A lets a helper talk to <b>other helpers</b>: say what each can do, hand out tasks, and collect results, like receptionists at two companies passing work along without knowing how the other company works inside.</p>`,
    },
    labAgent: {
      zh: `<p>选一个任务，按“下一步”，看助手怎么一圈圈干活；关掉某个工具或让它出错，看它怎么换办法。</p>`,
      en: `<p>Pick a task and press “Next” to watch the helper work round by round; switch a tool off or make it fail, and see how it finds another way.</p>`,
    },
    labInj: {
      zh: `<p>网页里藏了一句骗 AI 的坏话。一道道打开防护，看哪一道门能把坏事拦下来。</p>`,
      en: `<p>A web page hides a sentence meant to trick the AI. Switch the protections on one by one and see which gate stops the harm.</p>`,
    },
    labRag: {
      zh: `<p>问一个问题，看程序先翻出哪几段资料，再让模型照着回答；关掉“查资料”，看它只能瞎猜。</p>`,
      en: `<p>Ask a question, see which passages are found first, and how the model answers from them; switch the lookup off and watch it have to guess.</p>`,
    },
  },
};
export default T2;
