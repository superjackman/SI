/* R25 station Api · 🔌 calling models through an API. Every figure was checked on the vendor's official page on
   2026-10-24 (see /workspace/si-r25-sources.md); vendors whose page could not be read show a link only. Overseas
   vendors are named only: no account, payment or network-access instructions, by design. */
import { arrow, comp, LEG, Page, svgOpen, type StationOut } from '../lib';
import { src } from './ext/kit';
import { C as CF, jump, mem, one, tb, ti, tryit, ul } from './ext/m11';
import { CHECKED, PRICES } from '../../src/m2/calc';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const CURL = [
  '# 1) 把密钥放进环境变量（只在你自己的电脑上）',
  '#    macOS / Linux：',
  'export DEEPSEEK_API_KEY="sk-……"',
  '#    Windows PowerShell：',
  '#    $env:DEEPSEEK_API_KEY="sk-……"',
  '',
  '# 2) 发一个请求',
  'curl https://api.deepseek.com/chat/completions \\',
  '  -H "Content-Type: application/json" \\',
  '  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \\',
  '  -d \'{"model": "deepseek-flash",',
  '       "messages": [{"role": "user", "content": "你好"}]}\'',
];
export const PY = [
  '# pip install openai   （OpenAI 官方 Python 库，也能连兼容的平台）',
  'import os',
  'from openai import OpenAI',
  '',
  'client = OpenAI(',
  '    api_key=os.environ["DEEPSEEK_API_KEY"],  # 从环境变量读，不写死在代码里',
  '    base_url="https://api.deepseek.com",      # 换平台 = 换这个地址 + 换模型名',
  ')',
  'r = client.chat.completions.create(',
  '    model="deepseek-flash",',
  '    messages=[{"role": "user", "content": "你好"}],',
  ')',
  'print(r.choices[0].message.content)  # 回复',
  'print(r.usage)                       # 这次用了多少词元（按这个算钱）',
];
const enCode = (a: string[]) => a.map((l) => l
  .replace('# 1) 把密钥放进环境变量（只在你自己的电脑上）', '# 1) Put the key in an environment variable (on your own computer only)')
  .replace('#    Windows PowerShell：', '#    Windows PowerShell:').replace('#    macOS / Linux：', '#    macOS / Linux:')
  .replace('# 2) 发一个请求', '# 2) Send one request').replace('"你好"', '"Hello"')
  .replace('# pip install openai   （OpenAI 官方 Python 库，也能连兼容的平台）', '# pip install openai   (OpenAI’s Python library; it also talks to compatible platforms)')
  .replace('# 从环境变量读，不写死在代码里', '# read from the environment, never hard-coded')
  .replace('# 换平台 = 换这个地址 + 换模型名', '# switch platform = change this address + the model name')
  .replace('# 回复', '# the reply').replace('# 这次用了多少词元（按这个算钱）', '# tokens used this time (what you pay for)'));

export default function Api(P: Page): StationOut {
  const { t, L } = P;
  const nm = (id: string) => P.name(id);
  const sid = 'svgApi';
  let svg = svgOpen(sid, 384);
  svg += comp({ id: 'aApi', x: 70, y: 6, w: 240, h: 56, t: t('① 你的程序', '① Your program'), s: [t('脚本 / 网站后端 / 小工具', 'script / web back end / tool')], cat: 'use' }, L, nm('aApi'));
  svg += arrow(sid, 'M190 62 V80');
  svg += comp({ id: 'aKey', x: 70, y: 84, w: 240, h: 56, t: t('② 带上密钥（API Key）', '② Attach the key (API key)'), s: [t('证明“是你在用、记你的账”', 'proves “it is you; bill me”')], cat: 'safe' }, L, nm('aKey'));
  svg += arrow(sid, 'M190 140 V158');
  svg += comp({ id: 'aCompat', x: 40, y: 162, w: 300, h: 56, t: t('③ 发到平台的接口地址', '③ Send to the platform’s address'), s: [t('多数平台兼容同一种格式', 'most accept the same format')], cat: 'use' }, L, nm('aCompat'));
  svg += arrow(sid, 'M190 218 V236');
  svg += comp({ id: 'llm', x: 70, y: 240, w: 240, h: 56, t: t('④ 大模型在云端算', '④ The model runs in the cloud'), s: [t('读词元、写词元', 'reads and writes tokens')], cat: 'llm' }, L, nm('llm'));
  svg += arrow(sid, 'M190 296 V314');
  svg += comp({ id: 'aPrice', x: 40, y: 318, w: 300, h: 60, t: t('⑤ 回复 + 账单', '⑤ Reply + bill'), s: [t('按输入、输出的词元数计费', 'priced by input and output tokens')], cat: 'use' }, L, nm('aPrice'));
  svg += '</svg>';
  const lg = LEG(t);
  const per = t('元 / 百万词元', 'yuan (CNY) per million tokens');
  const chk = t(`核对于 ${CHECKED}`, `checked ${CHECKED}`);

  P.card('c_Api_0', 1, t('🔌 API：让你的程序直接问模型', '🔌 APIs: let your program ask the model'), `
<p class="lead">${t('在网页上和模型聊天，是“你”在问；用 API（应用程序接口），是“你写的程序”在问。程序发一段文字过去，平台上的模型算完把回复发回来，按用了多少“词元”记账。', 'Chatting on a web page, <i>you</i> ask; with an API (application programming interface), <i>your program</i> asks. It sends text, the platform’s model replies, and you are billed by the number of “tokens” used.')}</p>
<ol class="pts cf-ol">
<li>${t('在一个模型平台注册，开通 API，充值或领取额度。', 'Sign up on a model platform, enable its API, add credit or use a free quota.')}</li>
<li>${t('在平台控制台创建一个 <b>API 密钥</b>，马上存进环境变量（下面讲）。', 'Create an <b>API key</b> in the platform’s console and put it straight into an environment variable (see below).')}</li>
<li>${t('查文档里的三样东西：<b>接口地址</b>（base_url）、<b>模型名</b>、<b>价格</b>。', 'Find three things in its docs: the <b>address</b> (base_url), the <b>model name</b>, the <b>price</b>.')}</li>
<li>${t('用 curl 或 Python 发第一个请求，看回复和用量（usage）。', 'Send a first request with curl or Python; look at the reply and the usage.')}</li>
<li>${t('设好用量上限和提醒，再接进你的程序。', 'Set a spending limit and alerts, then wire it into your program.')}</li>
</ol>
${tryit(P, jump(P, 'c_Api_4', 'Api', t('🚀 第一次调用', '🚀 First call'), true), jump(P, 'labCost', 'Api', t('🧪 算算要花多少钱', '🧪 Work out the cost')), jump(P, 'c_T3_3', 'T3', t('词元是什么', 'What a token is')))}`, { h2: true });

  const row = (zh: string, en: string, model: string, price: string, compat: string, url: string) =>
    `<tr><td><b>${t(zh, en)}</b></td><td data-label="${t('举例模型', 'Example model')}">${model}</td><td data-label="${t('输入 / 输出', 'Input / output')}">${price}</td><td data-label="${t('兼容 OpenAI 格式', 'OpenAI-compatible')}">${compat}</td><td data-label="${t('官方页面', 'Official page')}"><a href="${url}" target="_blank" rel="noopener noreferrer">${t('价格页', 'Pricing')} ↗</a></td></tr>`;
  const Y = t('✅ 文档写明', '✅ documented'), Q = t('看文档', 'see docs');
  const pp = (id: string) => { const p = PRICES.find((x) => x.id === id)!; return `${p.inP} / ${p.outP}${p.hitP != null ? `<br><small>${t('缓存命中输入', 'cached input')} ${p.hitP}</small>` : ''}`; };
  P.card('c_Api_1', 2, t('🏪 国内常见的模型平台', '🏪 Common model platforms in China'), `
<p>${t(`价格单位：${per}。下面的数字都来自各家官方价格页，<b>${chk}</b>；价格常调，用之前请点链接再看一眼。`, `Prices in ${per}. Every number below is from the vendor’s official pricing page, <b>${chk}</b>; prices change often, so click through before you rely on them.`)}</p>
<table class="gl stack"><thead><tr><th>${t('平台', 'Platform')}</th><th>${t('举例模型', 'Example model')}</th><th>${t('输入 / 输出', 'Input / output')}</th><th>${t('兼容 OpenAI 格式', 'OpenAI-compatible')}</th><th>${t('官方页面', 'Official page')}</th></tr></thead><tbody>
${row('DeepSeek', 'DeepSeek', 'deepseek-flash<br><small>' + t('上下文 1M；高峰价，闲时半价', '1M context; peak price, off-peak half') + '</small>', pp('dsf'), Y, 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing')}
${row('智谱（GLM）', 'Zhipu (GLM)', 'GLM-5.3<br><small>' + t('上下文 1M', '1M context') + '</small>', pp('glm'), Y, 'https://docs.bigmodel.cn/cn/guide/start/pricing')}
${row('阿里云百炼（通义千问）', 'Alibaba Model Studio (Qwen)', 'qwen3.7-plus<br><small>' + t('输入 ≤256K、北京、不思考模式', 'input ≤256K, Beijing, non-thinking') + '</small>', pp('qwen'), Y, 'https://help.aliyun.com/zh/model-studio/model-pricing')}
${row('火山方舟（豆包）', 'Volcano Ark (Doubao)', 'doubao-seed-2.1-lite', pp('db'), Q, 'https://www.volcengine.com/docs/82379/1544106')}
${row('百度千帆（文心）', 'Baidu Qianfan (ERNIE)', 'ERNIE-5.1<br><small>' + t('输入 ≤32k', 'input ≤32k') + '</small>', pp('ernie'), Y, 'https://cloud.baidu.com/doc/qianfan/s/wmh4sv6ya')}
${row('腾讯混元', 'Tencent Hunyuan', 'Hunyuan-a13b<br><small>' + t('页面提示正迁往 TokenHub', 'page notes a move to TokenHub') + '</small>', pp('hy'), Q, 'https://cloud.tencent.com/document/product/1729/97731')}
${row('MiniMax', 'MiniMax', 'MiniMax-M3.1-Flash<br><small>' + t('上下文 1M', '1M context') + '</small>', pp('mm'), Y, 'https://platform.minimaxi.com/docs/pricing/overview')}
${row('月之暗面（Kimi）', 'Moonshot (Kimi)', 'K3<br><small>' + t('上下文 1,048,576 词元', '1,048,576-token context') + '</small>', t('页面由脚本生成，未能核对，请看官网', 'page is script-rendered and could not be checked; see the site'), Q, 'https://platform.kimi.com/docs/pricing/chat')}
${row('硅基流动（聚合平台）', 'SiliconFlow (aggregator)', t('一个密钥调很多开放模型', 'one key for many open models'), t('各模型价格不同，请看官网', 'varies by model; see the site'), Q, 'https://www.siliconflow.cn/pricing')}
</tbody></table>
<p class="tag-note">${t('海外也有 OpenAI、Anthropic、Google 等厂商。本站<b>不介绍</b>如何开通海外账号、付款或访问方式。', 'Overseas vendors include OpenAI, Anthropic and Google. This site does <b>not</b> cover opening overseas accounts, paying for them, or how to reach them.')}</p>
<p>${t('怎么挑：先看<b>要做的事</b>（聊天、写代码、看图），再看<b>上下文长度</b>够不够、<b>价格</b>、<b>速度</b>和<b>稳定性</b>。小任务先选便宜的“Flash / lite”档试，不够再升级。', 'How to choose: start from <b>the job</b> (chat, code, images), then check that the <b>context length</b> is enough, the <b>price</b>, the <b>speed</b> and the <b>reliability</b>. Try the cheap “Flash / lite” tier first and move up only if it falls short.')}</p>`);

  P.card('c_Api_2', 2, t('🔑 密钥：像家门钥匙一样保管', '🔑 Keys: guard them like your house key'), `
<p>${t('谁拿到你的密钥，谁就能<b>用你的钱</b>调模型。所以只有一条路：<b>密钥放在环境变量（或服务器的密钥管理）里，程序运行时去读</b>。', 'Whoever has your key can call models <b>on your money</b>. So there is one rule: <b>keep the key in an environment variable (or the server’s secret store) and read it at run time</b>.')}</p>
${tb([t('放在哪', 'Where'), t('行不行', 'OK?'), t('为什么', 'Why')], [
    [t('环境变量 / .env 文件（已写进 .gitignore）', 'Environment variable / a .env file (listed in .gitignore)'), '✅', t('只在你的电脑或服务器上，不进代码仓库', 'stays on your computer or server, never in the code repository')],
    [t('写死在代码里', 'Hard-coded in the code'), '❌', t('代码一上传或分享，密钥就跟着出去了', 'once the code is uploaded or shared, the key goes with it')],
    [t('网页前端代码（浏览器里跑的 JS）', 'Front-end code (JavaScript in the browser)'), '❌', t('任何访问者按 F12 就能看到', 'any visitor can see it with F12')],
    [t('发到聊天群、截图、问 AI 时贴进去', 'Pasted into a group chat, a screenshot, or an AI chat'), '❌', t('收不回来', 'you cannot take it back')],
  ])}
${ul([
    t('网页要用模型？让<b>你自己的后端</b>拿着密钥去调，浏览器只和你的后端说话。', 'A web page needs the model? Let <b>your own back end</b> hold the key and call it; the browser only talks to your back end.'),
    t('在平台上设<b>用量上限</b>和余额提醒；不同项目用不同的密钥，坏了只停一个。', 'Set a <b>spending limit</b> and balance alerts on the platform; use a separate key per project so one leak stops one project.'),
    t('怀疑泄露：<b>立刻在控制台删除这把密钥</b>，再建一把新的。', 'Suspect a leak: <b>delete that key in the console at once</b>, then create a new one.'),
  ])}
${mem(P, t('密钥 = 钱包。只进环境变量，不进代码、不进浏览器、不进聊天。', 'A key = your wallet. Environment variables only: never in code, the browser or a chat.'))}`);

  P.card('c_Api_3', 2, t('🔁 OpenAI 兼容格式：换个地址就能换平台', '🔁 The OpenAI-compatible format: change the address, change the platform'), `
<p>${t('很多平台照着 OpenAI 的接口格式做了一份“兼容版”。好处是：<b>同一段代码</b>，只改三处就能换平台：', 'Many platforms offer a “compatible” version of OpenAI’s API format. The upside: <b>the same code</b> moves to another platform by changing three things:')}</p>
${tb([t('改什么', 'Change'), t('是什么', 'What it is'), t('例子', 'Example')], [
    ['base_url', t('平台的接口地址', 'the platform’s address'), '<code>https://api.deepseek.com</code>'],
    ['api_key', t('这个平台发给你的密钥', 'the key this platform gave you'), t('从环境变量读', 'read from an environment variable')],
    ['model', t('这个平台上的模型名', 'the model name on this platform'), '<code>deepseek-flash</code>'],
  ])}
<p>${t('请求里最重要的是 <code>messages</code>：一串“谁说了什么”。<code>role</code> 是说话的人：<code>system</code>（给模型定规矩）、<code>user</code>（用户）、<code>assistant</code>（模型之前的回答）。模型<b>不记得上一次请求</b>，想接着聊就要把之前的对话一起发过去，这些都占上下文、都算钱。', 'The key part of a request is <code>messages</code>: a list of “who said what”. <code>role</code> is the speaker: <code>system</code> (sets rules for the model), <code>user</code>, <code>assistant</code> (the model’s earlier answers). The model <b>does not remember the last request</b>; to continue a chat you send the earlier turns again, and they take up context and cost money.')}</p>
<p>${t('官方文档写明兼容 OpenAI 格式的（截至核对日）：DeepSeek、智谱、阿里云百炼（compatible-mode 地址）、百度千帆、MiniMax；本地的 Ollama 和 vLLM 也提供这种接口（见“本地跑模型”站）。其他平台请以各自文档为准。', 'Documented as OpenAI-compatible (as of the check date): DeepSeek, Zhipu, Alibaba Model Studio (its compatible-mode address), Baidu Qianfan, MiniMax; locally, Ollama and vLLM offer it too (see the “Run models locally” stop). For other platforms, follow their own docs.')}</p>
${tryit(P, jump(P, 'c_T3_4', 'T3', t('上下文窗口：为什么会“忘”', 'Context window: why it “forgets”')), jump(P, 'c_Loc_2', 'Loc', t('本地的兼容接口', 'Local compatible APIs')))}
${src(P, [['https://api-docs.deepseek.com/zh-cn/', 'DeepSeek API'], ['https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope', t('百炼 OpenAI 兼容', 'Model Studio OpenAI compatibility')], ['https://docs.bigmodel.cn/cn/guide/develop/openai/introduction', t('智谱 OpenAI 兼容', 'Zhipu OpenAI compatibility')]])}`);

  const code = (a: string[]) => `<pre class="u-code"><code>${esc((L === 'en' ? enCode(a) : a).join('\n'))}</code></pre>`;
  P.card('c_Api_4', 2, t('🚀 第一次调用：curl 和 Python', '🚀 Your first call: curl and Python'), `
<p>${t('以 DeepSeek 为例（换平台就按上一张卡改三处）。<code>sk-……</code> 换成你自己的密钥，<b>只在自己电脑的终端里</b>设置。', 'Using DeepSeek as the example (for another platform, change the three things from the card above). Replace <code>sk-……</code> with your own key, set <b>only in your own computer’s terminal</b>.')}</p>
<p><b>${t('A. 命令行（curl）', 'A. Command line (curl)')}</b></p>
${code(CURL)}
<p><b>${t('B. Python', 'B. Python')}</b></p>
${code(PY)}
${ul([
    t('<code>$DEEPSEEK_API_KEY</code> 里的 <code>$</code> 意思是“取这个环境变量的值”，密钥本身不出现在命令里。', 'The <code>$</code> in <code>$DEEPSEEK_API_KEY</code> means “use this environment variable’s value”, so the key itself is not in the command.'),
    t('回来的 <code>usage</code> 里有 <code>prompt_tokens</code>（输入词元）和 <code>completion_tokens</code>（输出词元），账单就按这两个数算。', 'The returned <code>usage</code> has <code>prompt_tokens</code> (input) and <code>completion_tokens</code> (output); the bill uses these two numbers.'),
    t('报 401：密钥不对或没读到；报 402 / 余额不足：先充值；报 429：太快了，等一下再试。', '401: wrong key or not read; 402 / insufficient balance: add credit; 429: too fast, wait and retry.'),
  ])}
${src(P, [['https://api-docs.deepseek.com/zh-cn/', t('DeepSeek 快速开始', 'DeepSeek quick start')]])}`);

  P.card('c_Api_5', 2, t('💰 怎么算钱：词元 × 单价', '💰 How you pay: tokens × price'), `
<p>${t('账单 = 输入词元数 × 输入单价 + 输出词元数 × 输出单价（单价按“每百万词元”标）。', 'Bill = input tokens × input price + output tokens × output price (prices are “per million tokens”).')}</p>
${ul([
    t('<b>词元（token）</b>是模型读写的小块，一个汉字、一个词或半个词都可能是一块；同一段话在不同模型里切出的块数不一样。', 'A <b>token</b> is the small chunk a model reads and writes: one character, a word, or part of one; the same text can split into different counts on different models.'),
    t('<b>输入</b>包括：系统提示 + 之前的对话 + 你这次的问题 + 附带的资料。聊得越久，每次的输入越长。', '<b>Input</b> includes the system prompt + earlier turns + this question + any attached material. The longer a chat runs, the longer each input.'),
    t('<b>输出</b>是模型写出来的字；“思考”模式里，思考过程一般也算输出。', '<b>Output</b> is what the model writes; in “thinking” modes the thinking usually counts as output too.'),
    t('有的平台分时段定价（例如 DeepSeek 工作日高峰价、其他时间半价），以价格页为准。', 'Some platforms price by time of day (for example DeepSeek: peak price on weekday working hours, half price otherwise); the pricing page is the authority.'),
  ])}
${tryit(P, jump(P, 'labCost', 'Api', t('🧪 费用计算器', '🧪 Cost calculator'), true), jump(P, 'labTok', 'T3', t('看一句话切成多少词元', 'See a sentence cut into tokens')), jump(P, 'cfParamTok', 'T3', t('参数量 vs 上下文长度', 'Parameters vs context length')))}`);

  P.card('cfApiInOut', 1, ti(P, '输入价 vs 输出价', 'input price vs output price'),
    one(P, t('同一个模型，<b>输出通常比输入贵好几倍</b>（上表里大多是 3～5 倍）。因为输入可以一次并行算完，输出只能一个词元一个词元地生成。', 'for the same model, <b>output usually costs several times more than input</b> (3–5× for most rows above), because input is processed in one parallel pass while output is generated one token at a time.'))
    + tb([t('对比', 'Compare'), t('输入（prompt）', 'Input (prompt)'), t('输出（completion）', 'Output (completion)')], [
      [t('是什么', 'What'), t('你发过去的全部内容', 'everything you send'), t('模型写回来的内容', 'what the model writes back')],
      [t('怎么省', 'Save by'), t('删掉无关资料、别把整段历史一直带着', 'drop irrelevant material; do not drag the whole history along'), t('要求“简短回答”、限制最大长度', 'ask for short answers; cap the maximum length')],
      [t('例子（deepseek-flash 高峰）', 'Example (deepseek-flash peak)'), t('2 元 / 百万', '2 yuan / million'), t('8 元 / 百万', '8 yuan / million')],
    ])
    + mem(P, t('看价格先看两个数：输入价和输出价，不要只看一个。', 'Read two numbers on any price list: input and output, not just one.')), CF);

  P.card('cfApiCache', 1, ti(P, '缓存命中 vs 没命中', 'cache hit vs cache miss'),
    one(P, t('如果这次请求的<b>开头一段</b>和最近的请求一模一样（比如同一份很长的系统提示），平台可以直接复用算好的结果，这部分输入按<b>便宜很多的“命中价”</b>收费。', 'if <b>the start</b> of this request is identical to a recent one (say, the same long system prompt), the platform can reuse its earlier work and charge that part of the input at a <b>much cheaper “hit” price</b>.'))
    + tb([t('对比', 'Compare'), t('命中', 'Hit'), t('没命中', 'Miss')], [
      [t('条件', 'When'), t('开头和之前的请求完全相同', 'the start matches an earlier request exactly'), t('第一次发，或开头改了一个字', 'first time, or one character at the start changed')],
      [t('价格（deepseek-flash）', 'Price (deepseek-flash)'), t('0.04 元 / 百万', '0.04 yuan / million'), t('2 元 / 百万', '2 yuan / million')],
      [t('只影响', 'Affects only'), t('输入', 'input'), t('输入', 'input')],
    ])
    + ul([
      t('想多命中：<b>不变的放前面</b>（规则、资料），会变的放后面（这次的问题）。', 'To hit more: put <b>what stays the same first</b> (rules, material) and what changes last (this question).'),
      t('这和模型内部的 KV 缓存是同一个思路：算过的就别再算。', 'Same idea as the model’s internal KV cache: do not recompute what was already computed.'),
    ])
    + tryit(P, jump(P, 'attnVCard', 'T5', t('KV 缓存是什么', 'What the KV cache is')))
    + src(P, [['https://api-docs.deepseek.com/zh-cn/guides/kv_cache', t('DeepSeek 上下文硬盘缓存', 'DeepSeek context caching')]]), CF);

  P.labDivider();
  P.lab('labCost', t('费用计算器：一次多少钱、一个月多少钱', 'Cost calculator: per call and per month'), t(`单价来自官方价格页（${chk}）；结果是估算，实际以平台账单为准。`, `Prices from official pricing pages (${chk}); results are estimates, the platform’s bill is final.`),
    [t('把“百万词元”的单价换成你每天真正会花的钱。', 'Turn “per million tokens” prices into what you would really spend.'),
      t('看清输入、输出、缓存各占多少。', 'See how much comes from input, output and cache.')],
    `<div class="ctrls lc-g">
<label>${t('模型', 'Model')} <select id="ckModel"></select></label>
<label>${t('每次输入词元', 'Input tokens per call')} <input type="number" id="ckIn" min="0" step="100" value="2000" inputmode="numeric"></label>
<label>${t('每次输出词元', 'Output tokens per call')} <input type="number" id="ckOut" min="0" step="100" value="500" inputmode="numeric"></label>
<label>${t('每天调用次数', 'Calls per day')} <input type="number" id="ckN" min="0" step="10" value="100" inputmode="numeric"></label>
<label>${t('输入里缓存命中的比例', 'Share of input that hits the cache')} <input type="range" id="ckHit" min="0" max="100" step="10" value="0"><b id="ckHitV">0%</b></label>
</div>
<div class="u-out" id="ckOut2" aria-live="polite"></div>
<div class="u-bar" id="ckBar" role="img"></div>`,
    [t('把输出从 500 改成 2000，看总价涨多少', 'Raise output from 500 to 2000 and watch the total'),
      t('把缓存命中拉到 80%，看输入那段变多短', 'Drag the cache hit to 80% and watch the input share shrink')]);

  P.quiz();
  return {
    sub: t('密钥、接口格式、怎么算钱。', 'Keys, the request format, and what it costs.'),
    one: t('API 就是让你的程序代替你去问模型：带上密钥，发到平台地址，按输入、输出的词元数付钱。', 'An API lets your program ask the model for you: attach a key, send to the platform’s address, pay by input and output tokens.'),
    why: t('想把模型接进自己的网站、脚本或工具，就得走 API。', 'To put a model into your own site, script or tool, you go through an API.'),
    svg, legend: [lg.use as [string, string, string], lg.safe as [string, string, string], lg.llm as [string, string, string]],
  };
}
