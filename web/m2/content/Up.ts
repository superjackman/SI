/* Station Up · Products (M3): real products for each way of using agents, from content/products.ts. */
import { comp, esc, LEG, note, Page, svgOpen, type StationOut } from '../lib';
import { GROUPS, PRODUCTS, VERIFIED, type Group } from './products';

export default function Up(P: Page): StationOut {
  const { t, L } = P;
  const SHORT: Record<Group, [string, string]> = {
    uChat: [t('对话 / 研究', 'Chat / research'), 'use'], uIde: [t('编辑器里', 'In the editor'), 'use'], uCli: [t('命令行', 'Command line'), 'use'],
    uCua: [t('操作电脑', 'Computer use'), 'use'], uBg: [t('后台 / 云端', 'Background'), 'use'], uRoutine: [t('例程', 'Routines'), 'use'],
    uMulti: [t('多 Agent', 'Multi-agent'), 'use'], uKit: [t('扩展与标准', 'Extensions'), 'use'], app: [t('自己搭', 'Build your own'), 'agent'],
  };
  const inG = (g: Group) => PRODUCTS.filter((p) => p.g.includes(g));
  const cnt = (n: number) => t(`${n} 款`, `${n} listed`);
  const sid = 'svgUp';
  let svg = svgOpen(sid, 232);
  GROUPS.forEach((g, i) => {
    const x = 3 + (i % 3) * 127, y = 6 + Math.floor(i / 3) * 66;
    svg += comp({ id: g, x, y, w: 120, h: 58, t: (SHORT[g] as [string, string])[0], s: [cnt(inG(g).length)], cat: (SHORT[g] as [string, string])[1], fs: 14 }, L, P.name(g));
  });
  svg += note(190, 224, t('点方块看这种用法的原理；产品清单在下面', 'Tap a box for how that way works; the product list is below'));
  svg += '</svg>';
  const lg = LEG(t);

  const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const item = (p: (typeof PRODUCTS)[number]) => `<li class="up-i" data-g="${p.g.join(' ')}" data-cn="${p.cn ? 1 : 0}" data-os="${p.os ? 1 : 0}" data-n="${esc(p.n)}">
<div class="up-r"><a class="up-a" href="${esc(p.u)}" target="_blank" rel="noopener noreferrer">${L === 'en' && p.ne ? `${esc(p.ne)} (<span lang="zh-CN">${esc(p.n)}</span>)` : esc(p.n)}</a><span class="up-v">${esc(p.v[L])}</span></div>
<div class="up-bs">${p.cn ? `<span class="up-b cn">${t('国内运营', 'Mainland-run')}</span>` : `<span class="up-b x" title="${t('境外站点：在中国大陆能否打开未核实', 'Overseas site: access from mainland China not checked')}">${t('境外站点', 'Overseas')}</span>`}${p.os ? `<span class="up-b os">${t('开源 / 开放标准', 'Open source / open standard')}</span>` : ''}${p.research ? `<span class="up-b rs">${t('研究 / 搜索', 'Research / search')}</span>` : ''}</div>
<p>${esc(p.d[L])}</p><span class="up-u">${esc(host(p.u))}</span></li>`;
  const list = GROUPS.map((g) => `<section class="up-g" data-g="${g}"><h4 class="up-h"><a data-open="${g}">${esc(P.name(g))}</a> <span>· ${cnt(inG(g).length)}</span></h4><ul class="up-l">${inG(g).map(item).join('')}</ul></section>`).join('');
  const uniq = PRODUCTS.length, nCn = PRODUCTS.filter((p) => p.cn).length;

  P.card('c_Up_0', 1, t('每种用法，市面上有哪些产品', 'Which products offer each way of using agents'), `
<p class="lead">${t(`前面几站讲的是“用法”；这一站把真实产品按用法归类，每个都附官方网站。共 ${uniq} 个，其中 ${nCn} 个是国内公司运营的站点。`, `The earlier stops covered the ways of using agents; this one sorts real products by way, each with its official site. ${uniq} in total, ${nCn} of them run by mainland Chinese companies.`)}</p>
<p class="up-upd"><b>${t(`最后核对：${VERIFIED}`, `Last checked: ${VERIFIED}`)}</b> · ${t('以官网为准', 'the official site is authoritative')}</p>
<ul class="pts">
<li>${t('<b>只写能核实的</b>：名称、链接、一句话介绍都对照过官网；不写价格、免费额度和版本号，这些变得太快。', '<b>Only what could be checked</b>: names, links and one-line descriptions were checked against the official sites; no prices, free tiers or version numbers, which change too fast.')}</li>
<li>${t('<b>一个产品可能出现在几种用法下</b>：比如同一个编程 Agent 既有命令行版，也有编辑器插件和云端版。', '<b>One product can appear under several ways</b>: the same coding agent may come as a command-line tool, an editor extension and a cloud service.')}</li>
<li>${t('<b>标记</b>：“国内运营”= 国内公司运营的站点；“境外站点”= 在中国大陆能否直接打开<b>没有核实</b>，以你所在网络为准。', '<b>Badges</b>: “Mainland-run” = a site run by a mainland Chinese company; “Overseas” = whether it opens from mainland China was <b>not checked</b>.')}</li>
<li>${t('<b>列在这里不等于推荐</b>：先按前几站的四个问题选用法，再挑产品。', '<b>Listed is not endorsed</b>: pick the way first with the four questions from the earlier stops, then a product.')}</li>
</ul>`, { h2: true });

  P.card('c_Up_list', 2, t('🗂️ 产品清单（可筛选）', '🗂️ Product list (filterable)'), `
<div class="up-f" id="upF" role="group" aria-label="${t('按用法筛选', 'Filter by way')}"><button type="button" class="up-c on" data-f="all" aria-pressed="true">${t('全部', 'All')}</button>${GROUPS.map((g) => `<button type="button" class="up-c" data-f="${g}" aria-pressed="false">${esc((SHORT[g] as [string, string])[0])}</button>`).join('')}</div>
<div class="u-checks up-x"><label><input type="checkbox" id="upCn"> ${t('只看国内运营', 'Mainland-run only')}</label><label><input type="checkbox" id="upOs"> ${t('只看开源 / 开放标准', 'Open source / open standards only')}</label></div>
<p class="up-n" id="upCount" aria-live="polite">${t(`显示 ${uniq} 个产品`, `Showing ${uniq} products`)}</p>
<div id="upList">${list}</div>
<p class="up-foot">${t('核对方式：逐个打开官网确认名称、出品方和链接（返回 200 或正常跳转）。chatgpt.com、openai.com、perplexity.ai 拦截自动请求，改用浏览器核对；trae.cn 拒绝境外访问，按国际版 trae.ai 和搜索结果核对。', 'How it was checked: each official site was opened to confirm the name, maker and link (200 or a normal redirect). chatgpt.com, openai.com and perplexity.ai block automated requests and were checked in a browser; trae.cn refuses overseas access and was checked via trae.ai and search results.')}</p>`);

  P.card('c_Up_cn', 2, t('🇨🇳 在中国大陆用，要知道的两件事', '🇨🇳 Two things to know when using them in mainland China'), `
<ul class="pts">
<li>${t('<b>境外服务可能用不了</b>：不少境外产品没有在中国大陆上线，或注册、支付受限。请以官网说明和当地法规为准。', '<b>Overseas services may not be available</b>: many overseas products are not offered in mainland China, or sign-up and payment are limited. Follow the official site and local rules.')}</li>
<li>${t('<b>拟人化互动有专门规定</b>：国家网信办官网发布的《人工智能拟人化互动服务管理暂行办法》自 2026-07-15 起施行，重点规范模拟人格、持续情感陪伴类的 AI 服务。据新京报、每日经济新闻报道，豆包、千问随之下线了用户自建智能体功能。问答、办公这类工具型用法不是这项规定的重点。', '<b>Human-like companion AI has its own rules</b>: China’s Interim Measures for the Administration of Anthropomorphic AI Interaction Services, published by the Cyberspace Administration of China, took effect on 2026-07-15. They target AI services that simulate a persona or offer ongoing emotional companionship. According to The Beijing News and National Business Daily, Doubao and Qianwen removed user-built agent features in response. Tool-type uses such as Q&A and office work are not the focus of these rules.')}</li>
</ul>`);

  P.quiz();
  return {
    sub: t('按用法找产品，附官方链接。', 'Products by way of use, with official links.'),
    one: t(`把真实的 Agent 产品按“用法”归类，每个附官网、出品方和一句话介绍，可按用法、国内运营、开源筛选。最后核对 ${VERIFIED}，以官网为准。`, `Real agent products sorted by way of use, each with its official site, maker and a one-line description; filter by way, mainland-run or open source. Last checked ${VERIFIED}; the official site is authoritative.`),
    why: t('先懂用法再挑产品：产品会换代，用法的分类不容易过时。', 'Understand the ways first, then pick a product: products change, the ways of using them last.'),
    svg, legend: [lg.use as [string, string, string], lg.agent as [string, string, string]],
  };
}
