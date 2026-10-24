/* R26 plain-language layer for Skl (adding skills to an AI: tools, MCP servers, skill packs, prompt templates). */
import type { PStation } from './types';

const k = (zh: string, en: string) => ({ keep: true as const, zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
const p = (zh: string, en: string) => ({ zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
const Skl: PStation = {
  cards: {
    c_Skl_0: {
      zh: `<p class="pl-bd">📏 <b>这里讲</b>：工具、MCP 服务器、技能包、提示模板有什么不同，按事情怎么选，真实的目录在哪，怎么装、装之前看什么。<b>这里不讲</b>：怎么自己写 MCP 服务器（见“自己搭 Agent”）、海外服务怎么开通。</p>`
        + `<p>给 AI 装技能像<b>给手机装 App</b>：先想清楚要它多会什么，再去正规的应用商店装，装的时候看它要哪些权限。</p>`,
      en: `<p class="pl-bd">📏 <b>Covered here</b>: how tools, MCP servers, skill packs and prompt templates differ, which to pick for a job, where the real catalogues are, how to install, and what to check first. <b>Not covered</b>: writing your own MCP server (see “Build an agent”), or signing up for overseas services.</p>`
        + `<p>Adding skills to an AI is like <b>installing apps on a phone</b>: decide what you need, install from a proper store, and look at the permissions it asks for.</p>`,
    },
    c_Skl_1: p('要它<b>碰到东西</b>（文件、网页、地图）就装 MCP；要它<b>照着做法做</b>就装技能包；只是<b>每次说同样的话</b>，存个提示模板就够。',
      'If it must <b>touch things</b> (files, web pages, maps), install MCP; if it must <b>follow a method</b>, add a skill pack; if it is just <b>the same words each time</b>, save a prompt template.'),
    c_Skl_2: p('这里每一项都链到官方页面。像在<b>官方应用商店</b>挑 App：名字很像的陌生包不要装。',
      'Every entry links to its official page. Like shopping in <b>the official app store</b>: skip unknown look-alike packages.'),
    c_Skl_3: p('装 MCP 服务器其实就是<b>在设置里填一段配置</b>：起个名字、写怎么启动、写它能碰哪个文件夹。',
      'Installing an MCP server is really <b>filling a snippet into settings</b>: a name, how to start it, and which folder it may touch.'),
    c_Skl_4: p('装一个服务器等于<b>给 AI 一把钥匙</b>。先看钥匙能开哪些门：只给需要的文件夹，密钥不贴进对话。',
      'Installing a server is like <b>giving the AI a key</b>. See which doors it opens first: only the folders it needs, and no keys pasted into chats.'),
    cfSklMcpSkill: k('MCP 服务器是<b>手</b>，技能包是<b>说明书</b>。有手没说明书会乱做，有说明书没手做不了，常常两样一起用。',
      'An MCP server is a <b>hand</b>; a skill pack is a <b>manual</b>. A hand without a manual flails; a manual without a hand cannot act; they often go together.'),
    cfSklTpl: k('提示模板像<b>你随身带的便签</b>，每次自己贴上去；技能包像<b>放在 AI 书架上的手册</b>，它需要时自己去翻。',
      'A prompt template is like <b>a sticky note you carry</b> and paste each time; a skill pack is like <b>a manual on the AI’s shelf</b> that it opens when needed.'),
    labSkl: p('点一件你想让 AI 多会的事，看该装 MCP、技能包、提示模板还是工具，再看一个真实的例子。',
      'Tap something you want the AI to learn and see whether it needs MCP, a skill pack, a prompt template or a tool, with a real example.'),
  },
};
export default Skl;
