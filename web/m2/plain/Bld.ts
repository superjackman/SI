/* R26 plain-language layer for Bld (building your own agent). */
import type { PStation } from './types';

const k = (zh: string, en: string) => ({ keep: true as const, zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
const p = (zh: string, en: string) => ({ zh: `<p>${zh}</p>`, en: `<p>${en}</p>` });
const Bld: PStation = {
  cards: {
    c_Bld_0: {
      zh: `<p class="pl-bd">📏 <b>这里讲</b>：搭 Agent 的两条路（零代码平台、写代码），每条路有哪些真实的平台和框架，最小的 Agent 循环长什么样，上线前怎么测。<b>这里不讲</b>：怎么训练模型、各平台的价格、海外服务怎么开通。</p>`
        + `<p>搭 Agent 像<b>做一个会自己查资料的小助理</b>：它想一想，需要就去查（用工具），查到再想，直到能回答你。</p>`,
      en: `<p class="pl-bd">📏 <b>Covered here</b>: the two roads to an agent (no-code platforms, code), the real platforms and frameworks on each, what the smallest agent loop looks like, and how to test before launch. <b>Not covered</b>: training models, platform prices, or signing up for overseas services.</p>`
        + `<p>Building an agent is like <b>making a little assistant that looks things up</b>: it thinks, looks something up if needed (a tool), thinks again, and answers when it can.</p>`,
    },
    c_Bld_1: p('零代码平台像<b>搭积木</b>：选模型、写说明、加工具和资料，拼好就能发布，不用写一行代码。',
      'A no-code platform is like <b>building with blocks</b>: pick a model, write instructions, add tools and documents, and publish without a line of code.'),
    c_Bld_2: p('写代码时，模型只会说“请帮我用这个工具”，<b>真正去跑工具的是你的程序</b>；跑完把结果交回去，它再想下一步。',
      'In code, the model only says “please use this tool”; <b>your program actually runs it</b>, hands back the result, and the model thinks again.'),
    c_Bld_3: p('上线前像<b>考驾照</b>：准备 10 道题反复考，限制最多走几步、最多花多少钱，并把每一步记下来。',
      'Before launch it is like <b>a driving test</b>: 10 questions asked again and again, a limit on steps and spending, and a log of every step.'),
    cfBldFlow: k('工作流像<b>公交车</b>：路线固定、准时、便宜；Agent 像<b>出租车</b>：司机自己挑路，灵活，但可能绕路、更贵。',
      'A workflow is like <b>a bus</b>: fixed route, on time, cheap; an agent is like <b>a taxi</b>: the driver picks the way, flexible, but may detour and costs more.'),
    labBld: p('点最像你的一句话，看该走零代码平台还是写代码，先看哪些产品。',
      'Tap the line most like you to see whether to take a no-code platform or code, and which products to look at first.'),
  },
};
export default Bld;
