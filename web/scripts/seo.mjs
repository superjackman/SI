// R52 SEO restore: static readable pages for the 23 derivation stations (s/<key>/, en/s/<key>/),
// catalogues (s/, en/s/), sitemap.xml, robots.txt, 404.html. Content comes from zh-st.json /
// en-st.json (same words as the app). Card landings stay in public/c/ (og-cards.mjs); the sitemap
// lists them. Wired from vite.config generateBundle so every build / e2e / deploy ships the files.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const ORIGIN = 'https://superjackman.github.io';
const SITE = { zh: '大白话拆解 AI', en: 'AI, explained plainly' };
const KEYS = ['0', 'P', '1', '2', '3', '4', '5', '6', '7', '8a', '8b', '9', 'E', '10', '11', '12', '13', '14', 'S', '15a', '15b', 'A', '16'];
const T = {
  zh: {
    open: '▶ 打开互动版（能点图、做实验、做小测）',
    prev: '← 上一站', next: '下一站 →', all: '🗺 全部站点', home: '首页', cat: '全部站点目录', other: 'English',
    catT: (n) => `推导之路 · 全部 ${n} 站`, catD: '从“用样本找函数”到 Agent 与应用：23 站自底向上推导大模型。',
    nf: '这个页面不存在', nfP: '可能是链接打错了，或者页面已经换了地方。', nfHome: '回到首页', nfCat: '看全部站点',
    course: '大白话拆解 AI：从样本到 Agent', courseD: '小学生也能跟的 AI 推导之路：概率、损失、梯度、Transformer、预训练、Agent、安全与应用。',
    layer: '推导之路',
  },
  en: {
    open: '▶ Open the interactive version (diagrams, labs, quizzes)',
    prev: '← Previous stop', next: 'Next stop →', all: '🗺 All stops', home: 'Home', cat: 'All stops', other: '中文',
    catT: (n) => `Derivation path · all ${n} stops`, catD: 'From “learn a function from examples” to agents and apps: 23 stops building an LLM from the ground up.',
    nf: 'Page not found', nfP: 'The link may be mistyped, or the page has moved.', nfHome: 'Go to the home page', nfCat: 'See all stops',
    course: 'AI, explained plainly: from examples to agents', courseD: 'A plain-language derivation of LLMs: probability, loss, gradients, the Transformer, pre-training, agents, safety and apps.',
    layer: 'Derivation path',
  },
};
const HL = { zh: 'zh-CN', en: 'en' };
const OGL = { zh: 'zh_CN', en: 'en_US' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** The same {#key} table the interactive pages fill from (src/dv/nums.ts). Values are not copied here. */
export function numsFromSource(web) {
  const src = readFileSync(join(web, 'src/dv/nums.ts'), 'utf8');
  const start = src.indexOf('export const NUM = {');
  const end = src.indexOf('} satisfies Record<string, Num>');
  if (start < 0 || end < start) throw new Error('seo: NUM table not found in nums.ts');
  const block = src.slice(start, end);
  const nums = {};
  const re = /\n  (\w+): \{\n    zh: '((?:\\'|[^'])*)',\s*en: '((?:\\'|[^'])*)',(?:\n    ap: \['((?:\\'|[^'])*)', '((?:\\'|[^'])*)'\],)?/g;
  for (const m of block.matchAll(re)) nums[m[1]] = { zh: m[2], en: m[3], ap: m[4] != null ? [m[4], m[5]] : null };
  if (Object.keys(nums).length < 30) throw new Error('seo: parsed too few numbers from nums.ts (' + Object.keys(nums).length + ')');
  return nums;
}
/** Same substitution as fillDvText: the table value, and an approximate label when the table has one. */
export function fillNums(s, L, nums) {
  return String(s ?? '').replace(/\{#(\w+)\}/g, (_, k) => {
    const n = nums[k];
    if (!n || (L !== 'zh' && L !== 'en') || !n[L]) throw new Error('seo: unknown number {#' + k + '}');
    return n.ap ? n[L] + ' {~' + n.ap[L === 'zh' ? 0 : 1] + '}' : n[L];
  });
}
const STEP_TOK = '15a|15b|8a|8b|\\d+|[PESA]';
/** Old “第 N 步 / step N” wording becomes the station’s own name. A gradient step (“第 1 步梯度”) stays. */
export function stepPhrase(s, L, names) {
  const nameFor = (p) => {
    if (names[p]) return names[p];
    if (p === '8' && names['8a'] && names['8b']) return L === 'zh' ? `${names['8a']}、${names['8b']}` : `${names['8a']}, ${names['8b']}`;
    if (p === '15' && names['15a'] && names['15b']) return L === 'zh' ? `${names['15a']}、${names['15b']}` : `${names['15a']}, ${names['15b']}`;
    return '';
  };
  const quote = (p) => { const n = nameFor(p); return n ? (L === 'zh' ? `「${n}」` : `“${n}”`) : ''; };
  if (L === 'zh') {
    return s.replace(new RegExp(`第\\s*((?:${STEP_TOK})(?:\\s*[、，,]\\s*(?:${STEP_TOK}))*)\\s*步(?!梯度)`, 'g'), (m, inner) => {
      const parts = inner.split(/\s*[、，,]\s*/).map(quote);
      return parts.every(Boolean) ? parts.join('、') : m;
    });
  }
  return s.replace(new RegExp(`\\bsteps?\\s+((?:${STEP_TOK})(?:\\s*(?:,|and)\\s*(?:${STEP_TOK}))*)\\b(?!\\s+gradient)`, 'gi'), (m, inner) => {
    const parts = inner.split(/\s*(?:,|and)\s*/i).map(quote);
    return parts.every(Boolean) ? parts.join(', ') : m;
  });
}
const tick = (s) => String(s).replace(/`/g, '');
/** One worked example whose result is the shared table, readable with no JavaScript. */
function worked(k, L, nums) {
  if (k === '6') {
    const a = tick(nums.dot[L]);
    return L === 'zh'
      ? ['q = [3, 1]，k = [2, 2.5]。点积是多少？', `逐位相乘再相加：${a}。`]
      : ['q = [3, 1], k = [2, 2.5]. What is the dot product?', `Multiply each pair, then add: ${a}.`];
  }
  if (k === '9') {
    const s = tick(nums.tS[L]), a = tick(nums.t1[L]), a05 = tick(nums.t05[L]), a2 = tick(nums.t2[L]);
    return L === 'zh'
      ? [`分数 ${s}，温度 T = 1 时三个概率是多少？`, `T = 1 → ${a}。T = 0.5 → ${a05}。T = 2 → ${a2}。`]
      : [`Scores ${s}. At temperature T = 1, what are the three probabilities?`, `T = 1 → ${a}. T = 0.5 → ${a05}. T = 2 → ${a2}.`];
  }
  if (k === '12') {
    const a = tick(nums.kv100[L]);
    return L === 'zh'
      ? ['生成 100 个词元，不用缓存一共要算多少次 K、V？', `${a}。有缓存只算 100 次。`]
      : ['Generate 100 tokens. Without a cache, how many times are K and V computed?', `${a}. With a cache, only 100 times.`];
  }
  return null;
}
/** strip the colour / keyword marks used in the layered copy so SEO pages stay plain text.
    {#key} is filled before this runs; a leftover placeholder must stay visible so the build test fails. */
const plain = (s) => String(s)
  .replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\{~([^}]+)\}/g, '$1')
  .replace(/[（(][^）)]{0,40}(?:KM|KA|KB|KC|K)\d{2}[^）)]{0,20}[）)]/g, '')
  .replace(/(?:KM|KA|KB|KC|K)\d{2}\s*卡同一例/g, '')
  .replace(/卡上同一个例子（同一组数）/g, '同一组数')
  .replace(/卡同一例|卡同一组/g, '')
  .replace(/\bK(?:M|[ABC])?\d{2}\b/g, '')
  .replace(/\s+/g, ' ')
  .trim();
export function clip(s, max) {
  const a = Array.from(s); if (a.length <= max) return s;
  let t = a.slice(0, max - 1).join('');
  const m = /^(.*[\s，。；、,.;:：！？!?）)])/su.exec(t); if (m && Array.from(m[1]).length > max * 0.6) t = m[1];
  return t.replace(/[\s，、,;；:：(（]+$/u, '') + '…';
}
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

function loadSt(web, L) {
  return JSON.parse(readFileSync(join(web, 'src/dv', L === 'en' ? 'en-st.json' : 'zh-st.json'), 'utf8'));
}
function cardIds(web) {
  const dir = join(web, 'public/c');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)).sort();
}

function loadHub(web, base, head, abs, appHref, T, SITE, lm) {
  const news = JSON.parse(readFileSync(join(web, 'src/hub/news.json'), 'utf8'));
  const tools = JSON.parse(readFileSync(join(web, 'src/hub/tools.json'), 'utf8'));
  const files = new Map(), pages = [];
  const weeks = [...(news.weeks || [])].sort((a, b) => (a.week < b.week ? 1 : -1));
  const items = weeks.flatMap((w) => w.items.map((it) => ({ ...it, week: w.week })));
  const one = (L, kind, id, title, desc, body, hash) => {
    const path = (L === 'en' ? 'en/' : '') + `s/${kind}/${id}/`;
    const alt = { zh: `s/${kind}/${id}/`, en: `en/s/${kind}/${id}/` };
    const trail = [[T[L].home, L === 'en' ? '?lang=en' : ''], [kind === 'news' ? (L === 'zh' ? '资讯' : 'News') : (L === 'zh' ? '工具' : 'Tools'), (L === 'en' ? 'en/' : '') + `s/${kind}/`], [title, path]];
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebSite', name: SITE[L], url: abs('') },
      { '@type': kind === 'news' ? 'NewsArticle' : 'WebPage', headline: title, name: title, description: desc, url: abs(path), inLanguage: L === 'zh' ? 'zh-CN' : 'en', dateModified: lm },
    ] };
    const img = `${ORIGIN}${base}og-hub/${L === 'en' ? 'en/' : ''}${kind}/${id}.png`;
    files.set(path + 'index.html', head({ L, title: `${title} · ${SITE[L]}`, desc, path, alt, ld, image: img })
      + `<nav class="bc" aria-label="breadcrumb"><ol>${trail.map(([n, p], j) => `<li>${j === trail.length - 1 ? `<b>${esc(n)}</b>` : `<a href="${base}${p}">${esc(n)}</a>`}</li>`).join('')}</ol></nav><main><h1>${esc(title)}</h1>${body}<p class="open"><a href="${appHref(hash, L)}">${T[L].open}</a></p></main><footer><p>${esc(SITE[L])} · <a href="${base}${L === 'en' ? 'en/' : ''}about/">${L === 'zh' ? '谁在维护' : 'Who maintains this'}</a></p></footer></body></html>\n`);
    pages.push({ path, alt, lastmod: lm });
  };
  for (const L of ['zh', 'en']) {
    const list = items.map((it) => `<li><a href="${base}${(L === 'en' ? 'en/' : '')}s/news/${it.id}/">${esc(it.date)} · ${esc(it.source)}</a> — ${esc(clip(L === 'zh' ? it.zh : it.en, L === 'zh' ? 80 : 120))}</li>`).join('');
    const path = (L === 'en' ? 'en/' : '') + 's/news/';
    const title = L === 'zh' ? '资讯' : 'News';
    const older = weeks.length > 1;
    const desc = L === 'zh'
      ? `每周资讯，带来源和日期，并链回对应的站。${older ? '往期保留。' : ''}`
      : `Weekly notes with a source and a date, each linked to a stop.${older ? ' Older weeks stay.' : ''}`;
    const alt = { zh: 's/news/', en: 'en/s/news/' };
    files.set(path + 'index.html', head({ L, title: `${title} · ${SITE[L]}`, desc, path, alt, type: 'website', image: L === 'en' ? ORIGIN + base + 'og-hub/en/news-index.png' : ORIGIN + base + 'og.png' })
      + `<main><h1>${title}</h1><p>${esc(desc)}</p><ul>${list}</ul><p class="open"><a href="${appHref('news', L)}">${T[L].open}</a></p></main></body></html>\n`);
    pages.push({ path, alt, lastmod: lm });
    for (const it of items) {
      const name = L === 'zh' ? it.zh : it.en;
      const more = ((L === 'zh' ? it.more?.zh : it.more?.en) || []).map((s) => `<p>${esc(s)}</p>`).join('');
      one(L, 'news', it.id, clip(name, 70), clip(name, L === 'zh' ? 110 : 150), `<p class="lv">${esc(it.date)} · ${esc(it.source)} · ${esc(it.week)}</p><p>${esc(name)}</p>${more}<p><a href="${esc(it.url)}">${L === 'zh' ? '来源' : 'Source'}</a></p>`, `news/${it.id}`);
    }
    const tlist = tools.items.map((t) => `<li><a href="${base}${(L === 'en' ? 'en/' : '')}s/tools/${t.id}/">${esc(t.name)}</a> — ${esc(L === 'zh' ? t.zh : t.en)}</li>`).join('');
    const tp = (L === 'en' ? 'en/' : '') + 's/tools/';
    const tt = L === 'zh' ? '工具' : 'Tools';
    const td = L === 'zh' ? '真实产品。按写作、查资料、编程、做图、本地跑筛选。每条写明来源日期和安全提示。' : 'Real products, filtered by writing, lookup, code, pictures and running locally. Each note has a date and a safety line.';
    files.set(tp + 'index.html', head({ L, title: `${tt} · ${SITE[L]}`, desc: td, path: tp, alt: { zh: 's/tools/', en: 'en/s/tools/' }, type: 'website', image: L === 'en' ? ORIGIN + base + 'og-hub/en/tools-index.png' : ORIGIN + base + 'og.png' })
      + `<main><h1>${tt}</h1><p>${esc(td)}</p><ul>${tlist}</ul><p class="open"><a href="${appHref('tools', L)}">${T[L].open}</a></p></main></body></html>\n`);
    pages.push({ path: tp, alt: { zh: 's/tools/', en: 'en/s/tools/' }, lastmod: lm });
    for (const t of tools.items) {
      const name = t.name;
      const blurb = L === 'zh' ? t.zh : t.en;
      const free = L === 'zh' ? t.free[0] : t.free[1];
      const cn = L === 'zh' ? t.cn[0] : t.cn[1];
      one(L, 'tools', t.id, name, clip(`${name}: ${blurb}`, L === 'zh' ? 110 : 150), `<p>${esc(blurb)}</p><p>${esc(free)}</p><p>${esc(cn)}</p><p><a href="${esc(t.url)}">${L === 'zh' ? '官网' : 'Site'}</a></p>`, `tools/${t.id}`);
    }
  }
  return { files, pages };
}

export function buildSeo({ web, base, lastmod } = {}) {
  const lm = lastmod ?? new Date().toISOString().slice(0, 10);
  const abs = (p) => ORIGIN + base + p;
  const pagePath = (k, L) => (L === 'en' ? 'en/' : '') + `s/${k}/`;
  const catPath = (L) => (L === 'en' ? 'en/' : '') + 's/';
  const appHref = (hash, L) => base + (L === 'en' ? '?lang=en' : '') + (hash ? '#' + hash : '');
  const CSS = 'body{margin:0;font:16px/1.65 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#1e293b;background:#f8fafc}'
    + 'header,main,footer,.bc{max-width:760px;margin:0 auto;padding:12px 16px}header{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}'
    + 'a{color:#4338ca}h1{font-size:1.6em;margin:.2em 0}h2{font-size:1.2em;margin-top:1.4em}.lv,.bc{color:#64748b;font-size:.9em}'
    + '.bc ol{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:4px}.bc li+li:before{content:"› ";color:#94a3b8}'
    + '.lead{font-size:1.15em;font-weight:600}.open a{display:inline-block;background:#4f46e5;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600}'
    + '.bd{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:8px 12px}.pn{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:1.5em 0}'
    + 'ul,ol{padding-left:1.3em}li{margin:.35em 0}footer{color:#64748b;font-size:.85em}'
    + 'details.ex{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;margin:12px 0}details.ex summary{cursor:pointer;font-weight:700;min-height:44px;display:flex;align-items:center}details.ex p{margin:.4em 0 0}';
  const head = ({ L, title, desc, path, alt, type = 'article', ld, noindex = false, image }) => `<!doctype html>
<html lang="${HL[L]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">\n' : `<link rel="canonical" href="${abs(path)}">\n`}${alt ? `<link rel="alternate" hreflang="zh-CN" href="${abs(alt.zh)}">
<link rel="alternate" hreflang="en" href="${abs(alt.en)}">
<link rel="alternate" hreflang="x-default" href="${abs(alt.zh)}">
` : ''}<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(SITE[L])}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${abs(path)}">
<meta property="og:image" content="${image || ORIGIN + base + 'og.png'}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
<meta property="og:locale" content="${OGL[L]}">
<meta property="og:locale:alternate" content="${OGL[L === 'zh' ? 'en' : 'zh']}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${image || ORIGIN + base + 'og.png'}">
<meta name="theme-color" content="#4f46e5">
<link rel="icon" href="${base}icon-192.png">
${ld ? jsonLd(ld) + '\n' : ''}<style>${CSS}</style>
</head>
<body>
<header><a href="${appHref('', L)}"><b>${esc(SITE[L])}</b></a>${alt ? `<a href="${base}${L === 'en' ? alt.zh : alt.en}" hreflang="${L === 'en' ? 'zh-CN' : 'en'}" lang="${L === 'en' ? 'zh-CN' : 'en'}">${T[L].other}</a>` : ''}</header>
`;
  const website = (L) => ({ '@type': 'WebSite', '@id': abs('#website'), name: SITE[L], alternateName: SITE[L === 'zh' ? 'en' : 'zh'], url: abs(''), inLanguage: HL[L] });
  const course = (L) => ({ '@type': 'Course', '@id': abs(catPath(L)) + '#course', name: T[L].course, description: T[L].courseD, url: abs(catPath(L)), inLanguage: HL[L],
    isAccessibleForFree: true, provider: { '@type': 'Organization', name: SITE[L], url: abs('') } });
  const crumbs = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(p) })) });

  const files = new Map(), pages = [], descs = new Map(), names = { zh: [], en: [] };
  const nums = numsFromSource(web);
  const nameOf = { zh: {}, en: {} };
  for (const L of ['zh', 'en']) {
    const st0 = loadSt(web, L).st;
    if (st0.length !== KEYS.length) throw new Error(`seo: ${L}-st has ${st0.length} stations, expected ${KEYS.length}`);
    KEYS.forEach((k, i) => { nameOf[L][k] = st0[i].n; });
  }
  for (const L of ['zh', 'en']) {
    const st = loadSt(web, L).st;
    names[L] = st.map((s) => s.n);
    const show = (s) => plain(stepPhrase(fillNums(s, L, nums), L, nameOf[L]));
    for (let i = 0; i < KEYS.length; i++) {
      const k = KEYS[i], s = st[i], nm = s.n;
      const ly = s.ly || {};
      const title = `${nm} · ${SITE[L]}`;
      let desc = clip(show([s.q, ly.hook].filter(Boolean).join(L === 'zh' ? '' : ' ')), L === 'zh' ? 110 : 160);
      if (!desc) desc = clip(`${nm}: ${show((ly.an && ly.an[0]) || s.i[0] || '')}`, L === 'zh' ? 110 : 160);
      if ([...descs.values()].includes(desc)) desc = clip(`${nm} · ${desc}`, L === 'zh' ? 110 : 160);
      descs.set(`${L}:${k}`, desc);
      const path = pagePath(k, L), alt = { zh: pagePath(k, 'zh'), en: pagePath(k, 'en') };
      const trail = [[T[L].home, L === 'en' ? '?lang=en' : ''], [T[L].cat, catPath(L)], [nm, path]];
      const ld = { '@context': 'https://schema.org', '@graph': [website(L),
        { '@type': 'LearningResource', '@id': abs(path) + '#lesson', name: nm, headline: title, description: desc, url: abs(path), inLanguage: HL[L], isAccessibleForFree: true, isPartOf: { '@type': 'Course', '@id': abs(catPath(L)) + '#course', name: T[L].course }, learningResourceType: 'Lesson' },
        crumbs(trail)] };
      const pv = i > 0 ? KEYS[i - 1] : null, nx = i < KEYS.length - 1 ? KEYS[i + 1] : null;
      const lis = (xs) => (xs && xs.length ? `<ul>${xs.map((x) => `<li>${esc(show(x))}</li>`).join('')}</ul>` : '');
      const sec = (body) => body ? `<section>${body}</section>\n` : '';
      const body = `<nav class="bc" aria-label="breadcrumb"><ol>${trail.map(([n, p], j) => `<li>${j === trail.length - 1 ? `<b>${esc(n)}</b>` : `<a href="${base}${p}">${esc(n)}</a>`}</li>`).join('')}</ol></nav>
<main>
<p class="lv">${T[L].layer} · ${i + 1} / ${KEYS.length}</p>
<h1>${esc(nm)}</h1>
<p class="lead">${esc(show(s.s))}</p>
<p class="open"><a href="${appHref('D/' + k, L)}">${T[L].open}</a></p>
${s.q ? `<p class="bd">${esc(show(s.q))}</p>` : ''}
${(() => { const ex = worked(k, L, nums); return ex ? `<details class="ex"><summary>${esc(ex[0])}</summary><p>${esc(ex[1])}</p></details>\n` : ''; })()}
${sec(ly.hook ? `<p>${esc(show(ly.hook))}</p>` : '')}
${sec(lis(ly.an))}
${sec(lis(s.i))}
${sec(lis(ly.pc))}
${sec(lis([...(ly.num || []), ...(s.x || [])]))}
${sec(lis([...(ly.fx || []), ...(s.f || [])]) + (ly.fe && ly.fe.length ? lis(ly.fe) : ''))}
${s.lo ? `<p><b>${L === 'zh' ? '留下的问题' : 'Left open'}</b> ${esc(show(s.lo))}</p>` : ''}
<nav class="pn">${pv ? `<a href="${base}${pagePath(pv, L)}" rel="prev">${T[L].prev}${L === 'zh' ? '：' : ': '}${esc(names[L][i - 1])}</a>` : '<span></span>'}${nx ? `<a href="${base}${pagePath(nx, L)}" rel="next">${T[L].next.replace(' →', '')}${L === 'zh' ? '：' : ': '}${esc(names[L][i + 1])} →</a>` : ''}</nav>
<section><h2>${T[L].all}</h2><ol>${KEYS.map((kk, j) => j === i ? `<li><b>${esc(names[L][j])}</b></li>` : `<li><a href="${base}${pagePath(kk, L)}">${esc(names[L][j])}</a></li>`).join('')}</ol></section>
</main>
`;
      files.set(path + 'index.html', head({ L, title, desc, path, alt, ld, image: `${ORIGIN}${base}og-st/${L === 'en' ? 'en/' : ''}${k}.png` }) + body + `<footer><p>${esc(SITE[L])} · ${T[L].layer} · <a href="${base}${L === 'en' ? 'en/' : ''}about/">${L === 'zh' ? '谁在维护' : 'Who maintains this'}</a></p></footer>\n</body>\n</html>\n`);
      pages.push({ path, alt, lastmod: lm });
    }
    const path = catPath(L), alt = { zh: catPath('zh'), en: catPath('en') }, title = `${T[L].catT(KEYS.length)} · ${SITE[L]}`;
    const ld = { '@context': 'https://schema.org', '@graph': [website(L), course(L),
      { '@type': 'ItemList', itemListElement: KEYS.map((k, j) => ({ '@type': 'ListItem', position: j + 1, name: names[L][j], url: abs(pagePath(k, L)) })) },
      crumbs([[T[L].home, L === 'en' ? '?lang=en' : ''], [T[L].cat, path]])] };
    files.set(path + 'index.html', head({ L, title, desc: T[L].catD, path, alt, type: 'website', ld, image: L === 'en' ? ORIGIN + base + 'og-st/en/catalog.png' : ORIGIN + base + 'og.png' })
      + `<main>\n<h1>${esc(T[L].catT(KEYS.length))}</h1>\n<p>${esc(T[L].catD)}</p>\n<p class="open"><a href="${appHref('D', L)}">${T[L].open}</a></p>\n<ol>${KEYS.map((k, j) => `<li><a href="${base}${pagePath(k, L)}"><b>${esc(names[L][j])}</b></a> — ${esc(descs.get(`${L}:${k}`))}</li>`).join('')}</ol>\n</main>\n`
      + `<footer><p>${esc(SITE[L])}</p></footer>\n</body>\n</html>\n`);
    pages.push({ path, alt, lastmod: lm });
  }
  const hub = loadHub(web, base, head, abs, appHref, T, SITE, lm);
  for (const [p, html] of hub.files) files.set(p, html);
  pages.push(...hub.pages);
  const toolsJ = JSON.parse(readFileSync(join(web, 'src/hub/tools.json'), 'utf8'));
  const newsJ = JSON.parse(readFileSync(join(web, 'src/hub/news.json'), 'utf8'));
  const day = toolsJ.checked === newsJ.checked ? toolsJ.checked : `${newsJ.checked} / ${toolsJ.checked}`;
  const ABOUT = {
    zh: {
      title: '谁在维护',
      whoT: '谁在维护', who: '这个站由 GitHub 仓库 superjackman/SI 的所有者维护。',
      checkT: '事实怎么核对', check: '站里的数字来自同一张数表，互动页和静态页用的是同一份。资讯和工具写出来源、日期和核对日。没有写进这张表或来源里的数，页面上就不出现。',
      fixT: '怎样更正', fix: '发现写错了，在仓库开一条 issue，写上页面地址和你认为不对的地方。',
      when: `资讯和工具最近一次核对是 ${day}。`, issue: '开一条 issue',
    },
    en: {
      title: 'Who maintains this',
      whoT: 'Who maintains this', who: 'This site is maintained by the owner of the GitHub repository superjackman/SI.',
      checkT: 'How facts are checked', check: 'Numbers come from one table, shared by the interactive pages and the static pages. News and tools name a source, a date and the day they were checked. A number that is not in that table or in a source is not shown.',
      fixT: 'How to report a correction', fix: 'If something is wrong, open an issue on the repository with the page address and what you think is off.',
      when: `News and tools were last checked on ${day}.`, issue: 'Open an issue',
    },
  };
  for (const L of ['zh', 'en']) {
    const A = ABOUT[L], path = (L === 'en' ? 'en/' : '') + 'about/', alt = { zh: 'about/', en: 'en/about/' };
    const desc = clip(A.who, L === 'zh' ? 110 : 160);
    const body = `<main><h1>${esc(A.title)}</h1><section><h2>${esc(A.whoT)}</h2><p>${esc(A.who)}</p><p><a href="https://github.com/superjackman/SI">superjackman/SI</a></p></section><section><h2>${esc(A.checkT)}</h2><p>${esc(A.check)}</p><p>${esc(A.when)}</p></section><section><h2>${esc(A.fixT)}</h2><p>${esc(A.fix)}</p><p><a href="https://github.com/superjackman/SI/issues">${esc(A.issue)}</a></p></section><p><a href="${base}${L === 'en' ? '?lang=en' : ''}">${T[L].home}</a></p></main>`;
    files.set(path + 'index.html', head({ L, title: `${A.title} · ${SITE[L]}`, desc, path, alt, type: 'website', image: L === 'en' ? ORIGIN + base + 'og-st/en/catalog.png' : ORIGIN + base + 'og.png' }) + body + `</body></html>\n`);
    pages.push({ path, alt, lastmod: lm });
  }
  const cards = cardIds(web);
  const newest = lm;
  const url = (p, alt, mod) => `<url><loc>${abs(p)}</loc><lastmod>${mod}</lastmod>${alt ? `<xhtml:link rel="alternate" hreflang="zh-CN" href="${abs(alt.zh)}"/><xhtml:link rel="alternate" hreflang="en" href="${abs(alt.en)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${abs(alt.zh)}"/>` : ''}</url>`;
  const cardUrls = cards.map((id) => `<url><loc>${abs('c/' + id + '.html')}</loc><lastmod>${newest}</lastmod></url>`).join('\n');
  files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`
    + [url('', null, newest), ...pages.map((p) => url(p.path, p.alt, p.lastmod)), cardUrls].filter(Boolean).join('\n') + '\n</urlset>\n');
  files.set('robots.txt', `# Crawlers read robots.txt only at a host's root (${ORIGIN}/robots.txt); this copy documents the intent\n# for ${ORIGIN}${base} and points to its sitemap.\nUser-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
  files.set('404.html', head({ L: 'zh', title: `404 · ${SITE.zh} · ${SITE.en}`, desc: T.zh.nfP, path: '404.html', noindex: true, type: 'website' })
    + `<main>\n<h1>${T.zh.nf} · <span lang="en">${T.en.nf}</span></h1>\n<p>${T.zh.nfP}</p>\n<p lang="en">${T.en.nfP}</p>\n<ul><li><a href="${base}">${T.zh.nfHome}</a> · <a href="${base}?lang=en" lang="en">${T.en.nfHome}</a></li><li><a href="${base}s/">${T.zh.nfCat}</a> · <a href="${base}en/s/" lang="en">${T.en.nfCat}</a></li></ul>\n</main>\n</body>\n</html>\n`);
  return files;
}
