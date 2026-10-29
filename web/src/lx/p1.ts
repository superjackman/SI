/* R39: layers 1 and 2 — how you use an AI assistant, and the agent loop inside it. Texts follow the reference
   pages; the train times and habits are marked 示例数据 (example data). */
import type { L, Tx } from '../l4/txt';
import type { Dia, DNode, St, View } from './geo';
import { lxNext } from './ids';
import type { LxPg } from './types';

const N = (id: string, x: number, y: number, w: number, h: number, t: Tx, o: Partial<DNode> = {}): DNode => ({ id, x, y, w, h, t, ...o });
/* ---------- layer 1 ---------- */
const TB: Tx = ['工具箱 +', 'Toolbox +'], YOU: Tx = ['你', 'You'], AG: Tx = ['AI 助手', 'AI assistant'], CF: Tx = ['需你确认', 'Your OK'];
const TL: [string, Tx, Tx][] = [['t1', ['查车次', 'Find trains'], ['查车次', 'Trains']], ['t2', ['下单', 'Book'], ['下单', 'Book']], ['t3', ['付款', 'Pay'], ['付款', 'Pay']]];
function l1(mode: 'full' | 'left'): Dia {
  if (mode === 'full') return {
    x0: 0, y0: 66, x1: 360, y1: 268,
    frames: [{ id: 'tf', x: 252, y: 76, w: 102, h: 190, t: TB }],
    nodes: [N('you', 8, 118, 58, 84, YOU, { s: ['用户', 'User'] }), N('ag', 118, 112, 100, 96, AG, { s: ['Agent', 'Agent'], ts: ['AI 助手', 'Assistant'], plus: true }),
      ...TL.map(([id, t, ts], i) => N(id, 260, 98 + i * 48, 86, 34, t, { ts, plus: true })), N('cf', 266, 238, 74, 20, CF, { pill: true })],
    edges: [{ id: 'a1', d: 'M66 142 H114' }, { id: 'a4', d: 'M118 186 H70' }, { id: 'a2', d: 'M150 112 C150 84 188 84 188 108' },
      { id: 'a3', d: 'M218 150 C238 150 236 115 256 115' }, { id: 'a3b', d: 'M218 162 H256' }, { id: 'a3c', d: 'M218 172 C238 172 236 211 256 211' }],
    labels: [{ x: 91, y: 134, t: ['①说需求', '① ask'], e: 'a1' }, { x: 92, y: 202, t: ['④告诉你', '④ report'], e: 'a4' }, { x: 169, y: 80, t: ['②拆步骤', '② plan steps'], e: 'a2' }, { x: 184, y: 228, t: ['③调工具 →', '③ use tools →'], e: 'a3' }],
  };
  return {
    x0: 0, y0: 66, x1: 160, y1: 414,
    frames: [{ id: 'tf', x: 8, y: 238, w: 146, h: 176, t: TB }],
    nodes: [N('you', 44, 72, 70, 34, YOU), N('ag', 14, 140, 136, 62, AG, { s: ['Agent', 'Agent'], plus: true }),
      ...TL.map(([id, t, ts], i) => N(id, 22, 262 + i * 40, 118, 32, t, { ts, plus: true })), N('cf', 44, 386, 74, 20, CF, { pill: true })],
    edges: [{ id: 'a1', d: 'M66 106 V136' }, { id: 'a4', d: 'M94 140 V110' }, { id: 'a3', d: 'M82 202 V234' }],
    labels: [{ x: 60, y: 126, t: ['①说需求', '① ask'], a: 'end', e: 'a1' }, { x: 100, y: 126, t: ['④告诉你', '④ report'], a: 'start', e: 'a4' }, { x: 90, y: 224, t: ['③调工具', '③ tools'], a: 'start', e: 'a3' }],
  };
}
/* ---------- layer 2 ---------- */
function l2(mode: 'full' | 'left'): Dia {
  if (mode === 'full') return {
    x0: 0, y0: 70, x1: 360, y1: 294, frames: [],
    nodes: [N('you', 8, 76, 60, 28, YOU), N('per', 130, 74, 100, 34, ['感知', 'Perceive']), N('mem', 10, 136, 92, 34, ['记忆', 'Memory'], { plus: true }),
      N('pla', 258, 136, 92, 34, ['规划', 'Plan']), N('llm', 122, 124, 116, 72, ['大模型', 'The LLM'], { s: ['LLM · 大脑', 'LLM · the brain'], plus: true }),
      N('obs', 20, 222, 104, 34, ['观察结果', 'Observe']), N('too', 236, 222, 104, 34, ['调工具', 'Call a tool'], { ts: ['调工具', 'Tool'], plus: true }),
      N('done', 20, 268, 104, 24, ['完成 → 回复你', 'Done → reply'], { pill: true }), N('svc', 236, 268, 104, 24, ['票务服务（外部）', 'Ticket service'], { ts: ['票务服务', 'Tickets'], pill: true })],
    edges: [{ id: 'in', d: 'M68 88 H127' }, { id: 'r1', d: 'M230 91 C290 91 304 108 304 133' }, { id: 'r2', d: 'M304 170 C304 192 288 198 288 219' }, { id: 'r3', d: 'M236 239 H127' },
      { id: 'r4', d: 'M72 222 C72 200 56 192 56 173' }, { id: 'r5', d: 'M56 136 C56 112 90 101 127 101' },
      { id: 's1', d: 'M180 108 V121', dash: true }, { id: 's2', d: 'M238 153 H255', dash: true }, { id: 's3', d: 'M210 196 L232 218', dash: true }, { id: 's4', d: 'M128 222 L148 199', dash: true }, { id: 's5', d: 'M102 158 H119', dash: true },
      { id: 'sv', d: 'M296 256 V265' }, { id: 'sv2', d: 'M280 268 V259' }, { id: 'dn', d: 'M72 256 V265' }],
    labels: [],
  };
  return {
    x0: 0, y0: 68, x1: 160, y1: 372, frames: [],
    nodes: [N('you', 54, 72, 52, 24, YOU), N('per', 40, 106, 80, 32, ['感知', 'Perceive']), N('pla', 4, 164, 66, 32, ['规划', 'Plan']), N('mem', 92, 164, 66, 32, ['记忆', 'Memory'], { ts: ['记忆', 'Mem.'], plus: true }),
      N('llm', 32, 216, 96, 58, ['大模型', 'The LLM'], { s: ['LLM', 'LLM'], plus: true }), N('too', 4, 300, 70, 32, ['调工具', 'Tool'], { plus: true }), N('obs', 84, 300, 74, 32, ['观察结果', 'Observe']),
      N('svc', 4, 346, 70, 24, ['票务服务', 'Tickets'], { pill: true }), N('done', 84, 346, 74, 24, ['回复你', 'Reply'], { pill: true })],
    edges: [{ id: 'in', d: 'M80 96 V103' }, { id: 'r1', d: 'M40 122 C24 122 24 140 24 161' }, { id: 'r2', d: 'M14 196 V297' }, { id: 'r3', d: 'M74 316 H81' }, { id: 'r4', d: 'M146 300 V199' },
      { id: 'r5', d: 'M136 164 C136 140 130 122 123 122' }, { id: 's1', d: 'M80 138 V213', dash: true }, { id: 'sv', d: 'M39 332 V343' }, { id: 'dn', d: 'M121 332 V343' }],
    labels: [],
  };
}

const pill = (t: string, go?: string, c = '') => go ? `<button type="button" class="lx-pl${c}" data-go="${go}">${t}</button>` : `<span class="lx-pl${c}">${t}</span>`;
export function page(id: string, l: L): LxPg {
  const z = (a: string, b: string) => (l === 'zh' ? a : b), EX = `<span class="l4-ex">${z('示例数字', 'example')}</span>`, EXD = `<span class="l4-ex">${z('示例数据', 'example data')}</span>`;
  const one = id.startsWith('L1'), hint0 = z('点带 + 的块可就地展开', 'Tap a box with + to open it here'), hintX = z('点带 + 的块可就地展开；点左侧原图收起', 'Tap + to open; tap the left diagram to close');
  const crumb: [string, string | null][] = [[z('首页', 'Home'), '#home'], one ? [z('第1层 我怎么用 AI', 'Layer 1 How I use AI'), id === 'L1' ? null : '#L1'] : [z('第2层 AI 助手怎么工作', 'Layer 2 How an AI assistant works'), id === 'L2' ? null : '#L2']];
  const p: LxPg = { id, mode: 'full', v: null, top: `<b class="lx-tt">${z('你：「帮我订明天去上海的高铁」', 'You: “Book me a fast train to Shanghai tomorrow”')}</b>`, crumb, ttl: '', info: ['', '', '', ''],
    k: 'KA01', math: null, hint: hint0, dots: null, next: lxNext(id), panel: '', xl: true, go: {} };
  const set = (name: string, v: View, k: string, info: [string, string, string, string], panel: string, dots: [number, number] | null) => {
    p.v = v; p.k = k; p.info = info; p.panel = panel; p.dots = dots; p.ttl = name; p.crumb.push([name, null]);
  };
  const S = (o: Record<string, St>) => o;
  if (one) {
    const F = l1('full'), Lf = l1('left');
    const base: Record<string, string> = { you: '#L1/1', ag: '#L1/5', tf: '#L1/6', t1: '#L1/6', t2: '#L1/6', t3: '#L1/6', cf: '#L1/4' };
    p.go = { ...base };
    switch (id) {
      case 'L1': p.xl = false;
        set(z('全貌', 'Overview'), { dia: F, st: S({ cf: 'or' }) }, 'KA01', [z('替你把一句话变成办完的事', 'Turns one sentence into a finished job'), z('你、AI 助手、工具箱三部分', 'You, the AI assistant and a toolbox'), z('你说→它拆→调工具→回报你', 'You ask → it plans → uses tools → reports'), z('会说还要会做，才能真正办事', 'Talking is not enough; it must also act')],
          `<h4>${z('一句话，助手替你办完', 'One sentence, and the assistant gets it done')}</h4><div>${z('你只说一句话，助手就会：①听懂 → ②拆步骤 → ③调工具查票、下单 → ④把结果告诉你。付款前一定先问你。', 'You say one sentence and the assistant: ① understands → ② splits it into steps → ③ uses tools to find and book tickets → ④ tells you the result. It always asks you before paying.')}</div>`
          + `<div class="lx-row">${pill(z('▶ 播放 4 步', '▶ Play the 4 steps'), '#L1/1')}${pill(z('AI 助手 +', 'AI assistant +'), '#L1/5')}${pill(z('工具箱 +', 'Toolbox +'), '#L1/6')}</div><div class="sub">${z('没运行时看全貌；播放时只亮正在用的部分。', 'At rest you see the whole; while playing only the part in use lights up.')}</div>`, [4, -1]); break;
      case 'L1-1':
        set(z('①你说需求', '① You ask'), { dia: F, def: 'dim', st: S({ you: 'lit', ag: 'lit' }), est: S({ a1: 'lit' }), flow: ['a1'] }, 'KA02', [z('听懂你要什么，整理成任务', 'Understand what you want; write it up as a task'), z('你的话 + 日期、位置等背景', 'Your words + context such as date and place'), z('缺的信息先补全或反问你', 'Missing details are filled in or asked'), z('理解错了，后面每步都会错', 'A wrong reading spoils every later step')],
          `<h4>${z('① 你说需求：先听懂', '① You ask: first, understand')}</h4><div>${z('助手把这句话整理成一张任务单：', 'The assistant turns the sentence into a task sheet:')}</div><div class="ib g2"><div>${z('要做：订高铁票', 'Do: book a train ticket')}</div><div>${z('到达：上海', 'To: Shanghai')}</div><div>${z('日期：明天→算出几号', 'Date: tomorrow → work out the date')}</div><div class="or">${z('出发：没说', 'From: not said')}</div></div>`
          + `<div>${z('出发地没说：用你常住的城市，或者<span class="hl">反问你</span>，不乱猜。', 'No starting city: use the city you usually live in, or <span class="hl">ask you</span>; never guess.')}</div>`, [4, 0]); break;
      case 'L1-2':
        set(z('②它拆步骤', '② It plans steps'), { dia: F, def: 'dim', st: S({ ag: 'lit' }), est: S({ a2: 'lit' }), flow: ['a2'] }, 'KA03', [z('把大任务拆成能做的小步', 'Split a big job into doable steps'), z('一张有先后顺序的步骤清单', 'An ordered list of steps'), z('按顺序做，出意外就调整', 'Work in order; adjust when something goes wrong'), z('小步骤才能对上具体的工具', 'Only small steps match a concrete tool')],
          `<h4>${z('② 拆成小步骤', '② Split into small steps')}</h4><div class="g2"><div>${z('1. 查明天去上海的车次', '1. Find tomorrow’s trains to Shanghai')}</div><div>${z('2. 按你的习惯挑一班', '2. Pick one to suit your habits')}</div><div>${z('3. 下单占座', '3. Book a seat')}</div><div class="or">${z('4. 付款前问你确认', '4. Ask you before paying')}</div><div>${z('5. 告诉你结果', '5. Tell you the result')}</div></div>`
          + `<div class="sub">${z('每一步都小到能用一个工具完成；查不到票就回到第 2 步换一班。', 'Each step is small enough for one tool; no tickets → back to step 2 for another train.')}</div>`, [4, 1]); break;
      case 'L1-3':
        set(z('③调工具', '③ It uses tools'), { dia: F, def: 'dim', st: S({ ag: 'lit', tf: 'lit', t1: 'lit', t2: 'lit', t3: 'dim', cf: 'or' }), est: S({ a3: 'lit', a3b: 'lit', a3c: 'lit' }), flow: ['a3', 'a3b'] }, 'KA04', [z('让助手真正动手去办事', 'Let the assistant actually do things'), z('查车次、下单、付款等工具', 'Tools: find trains, book, pay…'), z('助手填好参数，程序去执行', 'It fills in the inputs; a program runs it'), z('大模型只会写字，办事靠工具', 'A model only writes text; tools do the work')],
          `<h4>${z('③ 调工具：真的去查、去下单', '③ Use tools: really search, really book')}</h4><div>${z('助手填好参数，让程序去调「查车次」：', 'The assistant fills in the inputs and has a program call “find trains”:')}</div><div class="ib mono">${z('查车次(到达=上海, 日期=明天)', 'find_trains(to=Shanghai, date=tomorrow)')}</div>`
          + `<div>${z('拿回结果：08:00、09:30 两班有票', 'Result: seats on the 08:00 and 09:30 trains')} ${EXD}</div><div>${z('再调「下单」占座；<span class="or">「付款」要等你确认。</span>', 'Then “book” holds a seat; <span class="or">“pay” waits for your OK.</span>')}</div>`, [4, 2]); break;
      case 'L1-4':
        set(z('④把结果告诉你', '④ It reports back'), { dia: F, def: 'dim', st: S({ you: 'lit', ag: 'lit', t3: 'dim', cf: 'or' }), est: S({ a4: 'lit' }), flow: ['a4'] }, 'KA05', [z('把办到哪了清楚地告诉你', 'Tell you clearly how far it got'), z('结果说明 + 需你确认的事', 'The result + what needs your OK'), z('你确认后，它才去付款', 'Only after you confirm does it pay'), z('花钱、不可撤回的事要人把关', 'Spending and undoable steps need a human')],
          `<h4>${z('④ 把结果告诉你', '④ Tell you the result')}</h4><div class="bub">${z('已为你占好明天 08:00 去上海的二等座。确认后我再付款。', 'I’ve held a second-class seat on tomorrow’s 08:00 to Shanghai. I’ll pay once you confirm.')} ${EXD}</div>`
          + `<div class="lx-row">${pill(z('确认付款', 'Confirm and pay'), undefined, ' or')}${pill(z('换一班', 'Another train'))}</div><div class="sub">${z('花钱、不能撤回的事，由你点确认才做。', 'Anything that spends money or can’t be undone waits for your tap.')}</div>`, [4, 3]); break;
      case 'L1-5': p.mode = 'left'; p.hint = hintX; p.go = { ...base, ag: '#L1', you: '#L1', t1: '#L1/6', t2: '#L1/6', t3: '#L1/6', cf: '#L1' };
        set(z('展开：AI 助手', 'Open: AI assistant'), { dia: Lf, def: 'pass', st: S({ ag: 'sel', cf: 'or' }), conn: 'ag' }, 'KA06', [z('看清助手由哪些部件组成', 'See what the assistant is made of'), z('大模型、规划、工具、记忆、循环', 'Model, planning, tools, memory, loop'), z('大模型想，工具做，记忆记', 'The model thinks, tools act, memory remembers'), z('各管一件事，单独升级也方便', 'One job each; easy to upgrade one part')],
          `<h4>${z('AI 助手 · 里面', 'Inside the AI assistant')}</h4><div class="cb hlb" data-go="#L2/6"><b>${z('大模型 +', 'The model +')}</b><div>${z('大脑：听懂、思考、定下一步', 'The brain: understands, thinks, picks the next step')}</div></div>`
          + `<div class="cb"><b>${z('规划', 'Planning')}</b><div>${z('把目标拆成一步步', 'Splits the goal into steps')}</div></div><div class="cb" data-go="#L1/6"><b>${z('工具箱 +', 'Toolbox +')}</b><div>${z('手：查车次、下单、付款', 'Hands: find trains, book, pay')}</div></div>`
          + `<div class="cb" data-go="#L2/7"><b>${z('记忆 +', 'Memory +')}</b><div>${z('记住对话和你的习惯', 'Remembers the chat and your habits')}</div></div><div class="cb"><b>${z('循环控制', 'Loop control')}</b><div>${z('一步步执行，判断何时停', 'Runs step by step; decides when to stop')}</div></div>`
          + `<div class="sub">${z('点「大模型」看它们怎么一起转起来：', 'Tap “The model” to see them work together:')}</div>${pill(z('进入第2层 ›', 'Go to layer 2 ›'), '#L2')}`, [4, -1]); break;
      case 'L1-6': { p.mode = 'left'; p.hint = hintX; p.go = { ...base, tf: '#L1', t1: '#L1', t2: '#L1', t3: '#L1', you: '#L1', cf: '#L1' };
        const row = (n: string, a: string, r: string, c = '') => `<div class="cb"><b>${n}</b><span class="sub">${z(`（${a}）`, ` (${a})`)}</span><div class="${c}">→ ${r}</div></div>`;
        set(z('展开：工具箱', 'Open: toolbox'), { dia: Lf, def: 'pass', st: S({ tf: 'sel', t1: 'lit', t2: 'lit', t3: 'lit', cf: 'or' }), conn: 'tf' }, 'KA04', [z('给助手一双能办事的手', 'Give the assistant hands that get things done'), z('每个工具：名字、说明、参数', 'Each tool: a name, a description, inputs'), z('助手选工具填参数，程序执行', 'It picks a tool and fills inputs; a program runs it'), z('说明写清楚，模型才会用对', 'Clear descriptions let the model use them right')],
          `<h4>${z('工具箱 · 里面', 'Inside the toolbox')}</h4><div class="sub">${z('每个工具＝名字 + 说明 + 要填的参数', 'Each tool = name + description + inputs to fill')}</div>`
          + row(z('查车次', 'Find trains'), z('出发, 到达, 日期', 'from, to, date'), z('车次和余票', 'trains and free seats')) + row(z('下单', 'Book'), z('车次, 座位, 乘客', 'train, seat, passenger'), z('订单号', 'order number'))
          + row(z('付款', 'Pay'), z('订单号', 'order number'), z('先等你确认', 'waits for your OK first'), 'or') + row(z('搜网页', 'Web search'), z('关键词', 'keywords'), z('网页摘要', 'page summaries')) + row(z('日历', 'Calendar'), z('时间, 事项', 'time, item'), z('设好提醒', 'a reminder set'))
          + `<div>${z('助手读这些说明，决定用哪个、填什么。', 'The assistant reads these to decide which to use and what to fill in.')}</div>`, [4, -1]); break; }
    }
    return p;
  }
  const F = l2('full'), Lf = l2('left');
  const base: Record<string, string> = { you: '#L2/1', per: '#L2/1', pla: '#L2/2', too: '#L2/3', svc: '#L2/3', obs: '#L2/4', done: '#L2/4', mem: '#L2/7', llm: '#L2/6' };
  p.go = { ...base };
  const ask = (s: string) => `<span class="hl">${s}</span>`;
  switch (id) {
    case 'L2': p.xl = false;
      set(z('全貌', 'Overview'), { dia: F }, 'KB01', [z('让大模型一步步把事办完', 'Let the model finish a job step by step'), z('大模型 + 感知规划工具观察记忆', 'The model + perceive, plan, tools, observe, memory'), z('想一步、做一步、看结果再想', 'Think a step, do a step, look, think again'), z('一次想不全，要边做边看', 'You can’t think of everything at once')],
        `<h4>${z('Agent：围着大模型转的循环', 'An agent: a loop around the model')}</h4><div>${z('感知 → 规划 → 调工具 → 观察结果 → 记忆，再回到感知，转到任务完成为止。虚线：每一步都要问中间的大模型。', 'Perceive → plan → call a tool → observe → remember, then back to perceive, round and round until the job is done. Dashed lines: every step asks the model in the middle.')}</div>`
        + `<div class="lx-row">${pill(z('▶ 播放一轮', '▶ Play one round'), '#L2/1')}${pill(z('大模型 +', 'The LLM +'), '#L2/6')}${pill(z('记忆 +', 'Memory +'), '#L2/7')}</div>`, [5, -1]); break;
    case 'L2-1':
      set(z('①感知', '① Perceive'), { dia: F, def: 'dim', st: S({ you: 'lit', per: 'lit', llm: 'lit' }), est: S({ in: 'lit', s1: 'lit' }), flow: ['in'] }, 'KB02', [z('把这次要用的信息收集齐', 'Gather everything this round needs'), z('你的话、日期位置、历史对话', 'Your words, date and place, earlier chat'), z('拼成一段文字交给大模型', 'Joined into one text for the model'), z('大模型只能看到给它的文字', 'The model sees only the text it is given')],
        `<h4>${z('① 感知：把信息读进来', '① Perceive: read the information in')}</h4><div class="g2a">${ask(z('你的话', 'Your words'))}<span>${z('帮我订明天去上海的高铁', 'Book me a fast train to Shanghai tomorrow')}</span>${ask(z('环境', 'Context'))}<span>${z('今天几号、你在哪个城市', 'Today’s date, the city you are in')}</span>${ask(z('记忆', 'Memory'))}<span>${z('之前的对话、你的习惯', 'Earlier chat, your habits')}</span></div>`
        + `<div>${z('全部拼成一段文字，交给大模型。', 'All of it is joined into one text and handed to the model.')}</div>`, [5, 0]); break;
    case 'L2-2':
      set(z('②规划', '② Plan'), { dia: F, def: 'dim', st: S({ pla: 'lit', llm: 'lit' }), est: S({ r1: 'lit', s2: 'lit' }), flow: ['r1'] }, 'KB03', [z('决定下一步具体做什么', 'Decide exactly what to do next'), z('大模型写出的想法和行动', 'A thought and an action, written by the model'), z('先想清原因，再写要调的工具', 'First the reason, then the tool to call'), z('先想再做，比直接做更少出错', 'Thinking first makes fewer mistakes')],
        `<h4>${z('② 规划：大模型想下一步', '② Plan: the model picks the next step')}</h4><div class="ib"><div>${ask(z('想法：', 'Thought: '))}${z('还不知道有哪些车次，先查。', 'I don’t know the trains yet; look them up first.')}</div><div>${ask(z('行动：', 'Action: '))}<span class="mono">${z('查车次(到达=上海, 日期=明天)', 'find_trains(to=Shanghai, date=tomorrow)')}</span></div></div>`
        + `<div class="sub">${z('它写出的只是一段格式固定的文字，还没有真的去查。', 'It only writes fixed-format text; nothing is looked up yet.')}</div>`, [5, 1]); break;
    case 'L2-3':
      set(z('③调工具', '③ Call a tool'), { dia: F, def: 'dim', st: S({ too: 'lit', svc: 'lit' }), est: S({ r2: 'lit', sv: 'lit', sv2: 'lit' }), flow: ['r2'] }, 'KA04', [z('把计划变成一次真实操作', 'Turn the plan into a real action'), z('Agent 程序 + 外部工具接口', 'The agent program + outside tool interfaces'), z('按模型写的名字和参数去调用', 'Calls the name and inputs the model wrote'), z('真实结果比模型凭空猜可靠', 'Real results beat the model’s guesses')],
        `<h4>${z('③ 调工具：程序真的去做', '③ Call a tool: a program really does it')}</h4><div>${z('Agent 程序读到「行动」，按名字找到「查车次」工具，带着参数去请求票务服务。', 'The agent program reads the “action”, finds the “find trains” tool by name and sends the inputs to the ticket service.')}</div>`
        + `<div>${z('返回：08:00、09:30 两班有票', 'Back: seats on the 08:00 and 09:30 trains')} ${EXD}</div><div class="sub">${z('动手的是程序，不是大模型本身。', 'A program does the work, not the model itself.')}</div>`, [5, 2]); break;
    case 'L2-4':
      set(z('④观察结果', '④ Observe'), { dia: F, def: 'dim', st: S({ obs: 'lit', llm: 'lit', done: 'dim' }), est: S({ r3: 'lit', s4: 'lit' }), flow: ['r3'] }, 'KB04', [z('看结果，判断是否完成', 'Look at the result; is the job done?'), z('工具返回结果 + 大模型判断', 'The tool’s result + the model’s judgement'), z('没完成就再转一轮', 'Not done → one more round'), z('按真实结果随时调整计划', 'Adjust the plan to real results')],
        `<h4>${z('④ 观察结果：做完了吗？', '④ Observe: is it done?')}</h4><div>${z('工具结果写回给大模型，它再判断：', 'The tool’s result goes back to the model, which judges:')}</div><div class="ib">${z('有票了，但还没下单 →', 'Seats found, but not booked →')} ${ask(z('没完成，再转一轮', 'not done, go round again'))}</div>`
        + `<div>${z('最多转 10 轮，超出就停下来问你', 'At most 10 rounds; beyond that it stops and asks you')} ${EX}</div>`, [5, 3]); break;
    case 'L2-5':
      set(z('⑤记忆', '⑤ Remember'), { dia: F, def: 'dim', st: S({ mem: 'lit', per: 'pass' }), est: S({ r4: 'lit', r5: 'lit' }), flow: ['r4', 'r5'] }, 'KB05', [z('让有用的信息下次还能用', 'Keep useful facts for next time'), z('短期记忆 + 长期记忆', 'Short-term + long-term memory'), z('存下来，下轮感知时再读回', 'Stored, then read back at the next perceive'), z('大模型自己记不住之前的事', 'The model itself can’t remember the past')],
        `<h4>${z('⑤ 记忆：把有用的记下来', '⑤ Memory: write down what is useful')}</h4><div>${ask(z('短期：', 'Short-term: '))}${z('这次对话的每一步都留着（查到的车次）', 'every step of this chat is kept (the trains found)')}</div><div>${ask(z('长期：', 'Long-term: '))}${z('「常从北京出发」「喜欢靠窗」存起来', '“usually leaves from Beijing”, “likes a window seat” are saved')} ${EXD}</div>`
        + `<div>${z('下一轮感知时，相关记忆会被一起读进来。', 'At the next perceive, the relevant memories are read in too.')}</div>`, [5, 4]); break;
    case 'L2-6': { p.mode = 'left'; p.hint = hintX; p.go = { ...base, llm: '#L2', you: '#L2', per: '#L2', pla: '#L2', too: '#L2/3', obs: '#L2', svc: '#L2', done: '#L2' };
      const stp = (t: string, h = false) => `<div class="cb c${h ? ' hlb' : ''}">${t}</div><i>↑</i>`;
      set(z('展开：大模型', 'Open: the LLM'), { dia: Lf, def: 'pass', st: S({ llm: 'sel' }), conn: 'llm' }, 'KB07', [z('理解、思考、写出下一步', 'Understand, think, write the next step'), z('分词、词向量、多层、打分', 'Tokens, vectors, layers, scores'), z('一次猜一个字，连成一段话', 'Guesses one char at a time, building a text'), z('海量文字里学到语言和常识', 'Learned language and common sense from vast text')],
        `<h4>${z('大模型 · 里面', 'Inside the LLM')}</h4><div class="sub">${z('从下往上算：', 'Computed bottom to top:')}</div><div class="lx-flw"><div class="cb c gold">${z('下一个字（再接回去）', 'Next char (fed back)')}</div><i>↑</i>`
        + stp(z('输出打分', 'Output scores')) + stp(z('Transformer 多层', 'Transformer layers'), true) + stp(z('词向量', 'Word vectors')) + stp(z('分词', 'Tokenize')) + `<div class="cb c">${z('感知拼好的那段文字', 'Text from Perceive')}</div></div>`
        + `<div>${z('一次一个字（词），写出「想法」和「行动」。', 'Char by char (word by word), it writes the “thought” and “action”.')}</div>${pill(z('进入第3层 ›', 'Go to layer 3 ›'), '#L3')}`, [5, -1]); break; }
    case 'L2-7': p.mode = 'left'; p.hint = hintX; p.go = { ...base, mem: '#L2', you: '#L2', per: '#L2', pla: '#L2', obs: '#L2', svc: '#L2', done: '#L2' };
      set(z('展开：记忆', 'Open: memory'), { dia: Lf, def: 'pass', st: S({ mem: 'sel' }), conn: 'mem' }, 'KB06', [z('分清现在用和以后用的信息', 'Separate what is needed now from later'), z('上下文窗口 + 外部记忆库', 'The context window + an outside memory store'), z('用时检索相关几条放回上下文', 'Fetch the few relevant items back into context'), z('窗口有限，不能什么都塞进去', 'The window is limited; not everything fits')],
        `<h4>${z('记忆 · 里面', 'Inside memory')}</h4><div class="cb hlb"><b>${z('短期记忆＝上下文窗口', 'Short-term = context window')}</b><div>${z('这次对话的全部文字，每轮整段交给大模型。有长度上限，太长就删减或总结。', 'This chat’s full text, sent to the model each round. Length is capped; too long → cut or summarised.')}</div></div>`
        + `<div class="cb"><b>${z('长期记忆＝外部记忆库', 'Long-term = outside store')}</b><div>${z('存在数据库里，跨对话保留。', 'In a database, kept across chats.')}</div></div><div class="lx-dn">${z('↓ 按意思检索最相关的几条', '↓ fetch the closest few by meaning')}</div>`
        + `<div class="cb"><b>${z('放回上下文', 'Back into context')}</b><div>${z('和你的话一起交给大模型（检索增强，RAG）', 'given to the model with your words (RAG)')}</div></div><div class="sub">${z('例：找出「喜欢靠窗」，选座时就用上', 'E.g. finds “likes a window seat” to pick a seat')} ${EXD}</div>`, [5, -1]); break;
  }
  return p;
}
