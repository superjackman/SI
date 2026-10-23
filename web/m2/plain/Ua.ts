/* R15 plain-language layer for Ua (working together with an Agent: you are there, it does the work). No KaTeX here. */
import type { PStation } from './types';

const Ua: PStation = {
  cards: {
    c_Ua_0: {
      zh: `<p>“一起干”就像<b>你带着一个徒弟</b>：你开口，你看着，它每做一步你都看得见，要紧的地方你点头它才做。四种用法里，它能碰的东西一个比一个多，所以越往后越要管好它的“钥匙”。</p>`,
      en: `<p>“Working together” is like <b>having an apprentice at your side</b>: you ask, you watch, you see every step, and it does the important things only after you say yes. Of the four ways, each can touch more than the one before, so the further down, the more carefully you manage its “keys”.</p>`,
    },
    c_Ua_1: {
      zh: `<p>对话助手就是<b>一问一答</b>：在网页或 App 里聊天，它能上网查一查、读你发的文件，但碰不到你的电脑和账号，所以最安全。聊得太久它会忘掉前面的内容；重要的数字和结论要自己再查一遍。</p>`,
      en: `<p>A chat assistant is <b>question and answer</b>: you chat in a web page or app; it can search the web and read files you send, but it cannot touch your computer or accounts, so it is the safest. In very long chats it forgets the early parts, and you should double-check important numbers and conclusions yourself.</p>`,
    },
    c_Ua_2: {
      zh: `<p>编辑器里的编程助手<b>住在你写代码的软件里</b>，能读整个项目。它可以帮你接着往下写、回答问题，也可以自己改好几个地方，最后把改动一条条摆出来，<b>你决定收不收</b>。改坏了还能退回去。</p>`,
      en: `<p>A coding helper in your editor <b>lives inside the program you write code in</b> and can read the whole project. It can continue what you are typing, answer questions, or change several places itself and then lay out every change for <b>you to accept or reject</b>. If it breaks something, you can go back.</p>`,
    },
    c_Ua_3: {
      zh: `<p>命令行里的编程助手几乎<b>什么都能做</b>，所以要像给孩子零花钱一样<b>分档给权限</b>：刚开始每一步都要问你；熟了以后改文件不用问、运行命令要问；全自动只在一台“坏了也没关系”的隔离机器上开。</p>`,
      en: `<p>A coding helper in the command line can do <b>almost anything</b>, so permissions are <b>given in levels</b>, like pocket money: at first it asks you at every step; later it may change files without asking but must ask before running commands; fully automatic only on an isolated machine where “breaking it doesn’t matter”.</p>`,
    },
    c_Ua_4: {
      zh: `<p>没有现成的接口时，就让助手<b>像人一样用电脑</b>：看一眼屏幕、点一下、打几个字、再看一眼。危险在于网页上可能藏着骗它的话（“忽略之前的指示……”），所以要在隔离的浏览器里用，付钱、发送、删除前先问你。</p>`,
      en: `<p>When there is no ready-made connection, the helper <b>uses the computer like a person</b>: look at the screen, click, type a little, look again. The danger is that a web page may hide words meant to trick it (“ignore previous instructions…”), so it should run in an isolated browser and ask you before paying, sending or deleting.</p>`,
    },
    labSession: {
      zh: `<p>看一个编程助手一圈一圈地改代码：换“权限档位”，看它要停下来问你几次；不让它跑测试，看它会不会太早说“做完了”（脚本和数字都是示意）。</p>`,
      en: `<p>Watch a coding helper change code round by round: switch the “permission level” and count how often it stops to ask you; turn off testing and see whether it says “done” too soon (the script and numbers are illustrative).</p>`,
    },
    labClick: {
      zh: `<p>看操作电脑的助手怎么根据截图点鼠标、打字：先走正常流程，再在邮件里藏一句坏指令，最后打开防护对比（网页和坐标都是示意）。</p>`,
      en: `<p>See how a computer-using helper clicks and types from screenshots: first the normal run, then hide a bad instruction in the email, and finally switch on protection to compare (the page and coordinates are illustrative).</p>`,
    },
  },
};
export default Ua;
