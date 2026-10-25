// R25 SEO: static, readable pages for search engines and link previews — one per stop per language
// (<base>s/<S>/ and <base>en/s/<S>/), two catalogue pages (<base>s/, <base>en/s/), sitemap.xml, robots.txt, 404.html.
// Every page shows the same words a reader sees in the app (taken from the generated stop HTML), plain links, and a
// visible "open the interactive version" link to <base>#<S> — no cloaking, nothing hidden. Called from vite.config
// (generateBundle) so every build — preview, e2e, deploy — carries the same files.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

export const ORIGIN = 'https://superjackman.github.io';
const SITE = { zh: '大白话拆解 AI', en: 'AI, explained plainly' };
const T = {
  zh: {
    lv: (n, t) => `第 ${n} 站 / 共 ${t} 站`, open: '▶ 打开互动版（能点图、做实验、做小测）', plain: '🧒 先用大白话说', inside: '📑 这一站讲了什么',
    lab: '动手实验', prev: '← 上一站', next: '下一站 →', all: '🗺 全部站点', home: '首页', cat: '全部站点目录', other: 'English', colon: '：',
    catT: (n) => `全部 ${n} 站目录`, catD: '大白话拆解 AI 的全部站点：从怎么用 AI、调用 API、本地跑模型，到 Agent、大模型、Transformer 内部和训练算力。每站都有图、实验和小测。',
    nf: '这个页面不存在', nfP: '可能是链接打错了，或者页面已经换了地方。', nfHome: '回到首页', nfCat: '看全部站点',
    course: '大白话拆解 AI：从用 AI 到看懂大模型', courseD: '小学生也能看懂的 AI 入门：一站一站拆解 AI 应用、Agent、大模型、Transformer 和训练算力，配可交互的图和实验。',
  },
  en: {
    lv: (n, t) => `Stop ${n} of ${t}`, open: '▶ Open the interactive version (tap the diagram, try labs, take the quiz)', plain: '🧒 In plain words', inside: '📑 What this stop covers',
    lab: 'hands-on lab', prev: '← Previous stop', next: 'Next stop →', all: '🗺 All stops', home: 'Home', cat: 'All stops', other: '中文', colon: ': ',
    catT: (n) => `All ${n} stops`, catD: 'Every stop of AI, explained plainly: using AI, calling an API, running AI offline, agents, LLMs, the Transformer, training. Diagrams, labs, quizzes.',
    nf: 'Page not found', nfP: 'The link may be mistyped, or the page has moved.', nfHome: 'Go to the home page', nfCat: 'See all stops',
    course: 'AI, explained plainly: from using AI to understanding LLMs', courseD: 'A plain-language AI primer: stop by stop through AI apps, agents, LLMs, the Transformer and training, with interactive diagrams and labs.',
  },
};
const LANGS = ['zh', 'en'];
const HL = { zh: 'zh-CN', en: 'en' };
const OGL = { zh: 'zh_CN', en: 'en_US' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const txt = (e) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
/** cut at a word / clause boundary, ≤ max characters, with … when cut */
export function clip(s, max) {
  const a = Array.from(s); if (a.length <= max) return s;
  let t = a.slice(0, max - 1).join('');
  const m = /^(.*[\s，。；、,.;:：！？!?）)])/su.exec(t); if (m && Array.from(m[1]).length > max * 0.6) t = m[1];
  return t.replace(/[\s，、,;；:：(（]+$/u, '') + '…';
}
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

function lastmodOf(web, files) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], { cwd: web, encoding: 'utf8' }).trim();
    if (out) return out.slice(0, 10);
  } catch { /* not a git checkout */ }
  return new Date().toISOString().slice(0, 10);
}

/** the readable parts of one stop, from its generated HTML */
function readStop(web, S, L) {
  const j = JSON.parse(readFileSync(join(web, 'src/legacy/gen/st', `${S}.${L}.json`), 'utf8'));
  const d = new JSDOM(`<section>${j.html}</section>`).window.document;
  d.querySelectorAll('svg,script,style,button.vz,.m-vbar,.zl,.cc-meta').forEach((e) => e.remove());
  const sub = txt(d.querySelector('.pg-s')), one = txt(d.querySelector('.ph-one')), why = txt(d.querySelector('.ph-why'));
  const plain = [...d.querySelectorAll('.pl-top .plain p:not(.pl-tag)')].map(txt).filter(Boolean);
  const bd = [...d.querySelectorAll('.pl-bd')].map((b) => [...b.querySelectorAll('p,li')].map(txt).filter(Boolean)).flat();
  const cards = [...d.querySelectorAll('.card')].map((c) => {
    const h = txt(c.querySelector('h2,h3')); if (!h) return null;
    const p = [...c.querySelectorAll('.cc-body p, .cc-body li')].filter((x) => !x.closest('summary') && !x.classList.contains('pl-tag')).map(txt).find((s) => Array.from(s).length >= 12) ?? '';
    return { h, p, lab: /\blab\b/.test(c.className) };
  }).filter(Boolean);
  return { sub, one, why, plain, bd, cards };
}

export function buildSeo({ web, base, lastmod } = {}) {
  const kb = JSON.parse(readFileSync(join(web, 'src/legacy/gen/kb.json'), 'utf8'));
  const ORDER = kb.TABORDER, N = ORDER.length, name = (S, L) => kb.TABN[S][L];
  const lm = lastmod ?? ((S) => lastmodOf(web, [`src/legacy/gen/st/${S}.zh.json`, `src/legacy/gen/st/${S}.en.json`]));
  const abs = (p) => ORIGIN + base + p;
  const pagePath = (S, L) => (L === 'en' ? 'en/' : '') + `s/${S}/`;
  const catPath = (L) => (L === 'en' ? 'en/' : '') + 's/';
  const appHref = (S, L) => base + (L === 'en' ? '?lang=en' : '') + (S === 'H' ? '' : '#' + S); /* R27: the app's home page is the bare URL */
  const CSS = 'body{margin:0;font:16px/1.65 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#1e293b;background:#f8fafc}'
    + 'header,main,footer,.bc{max-width:760px;margin:0 auto;padding:12px 16px}header{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}'
    + 'a{color:#4338ca}h1{font-size:1.6em;margin:.2em 0}h2{font-size:1.2em;margin-top:1.4em}.lv,.bc{color:#64748b;font-size:.9em}'
    + '.bc ol{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:4px}.bc li+li:before{content:"› ";color:#94a3b8}'
    + '.lead{font-size:1.15em;font-weight:600}.open a{display:inline-block;background:#4f46e5;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600}'
    + '.bd{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:8px 12px}.pn{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:1.5em 0}'
    + 'ul,ol{padding-left:1.3em}li{margin:.35em 0}footer{color:#64748b;font-size:.85em}';
  const head = ({ L, title, desc, path, alt, type = 'article', ld, noindex = false }) => `<!doctype html>
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
<meta property="og:image" content="${ORIGIN}${base}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(SITE[L])}">
<meta property="og:locale" content="${OGL[L]}">
<meta property="og:locale:alternate" content="${OGL[L === 'zh' ? 'en' : 'zh']}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}${base}og.png">
<meta name="theme-color" content="#4f46e5">
<link rel="icon" href="${base}icon-192.png">
${ld ? jsonLd(ld) + '\n' : ''}<style>${CSS}</style>
</head>
<body>
<header><a href="${base}${L === 'en' ? '?lang=en' : ''}"><b>${esc(SITE[L])}</b></a>${alt ? `<a href="${base}${L === 'en' ? alt.zh : alt.en}" hreflang="${L === 'en' ? 'zh-CN' : 'en'}" lang="${L === 'en' ? 'zh-CN' : 'en'}">${T[L].other}</a>` : ''}</header>
`;
  const website = (L) => ({ '@type': 'WebSite', '@id': abs('#website'), name: SITE[L], alternateName: SITE[L === 'zh' ? 'en' : 'zh'], url: abs(''), inLanguage: HL[L] });
  const course = (L) => ({ '@type': 'Course', '@id': abs(catPath(L)) + '#course', name: T[L].course, description: T[L].courseD, url: abs(catPath(L)), inLanguage: HL[L],
    isAccessibleForFree: true, provider: { '@type': 'Organization', name: SITE[L], url: abs('') } });
  const crumbs = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(p) })) });
  const allList = (L, cur) => `<section><h2>${T[L].all}</h2><ol>${ORDER.map((S) => S === cur ? `<li><b>${esc(name(S, L))}</b></li>` : `<li><a href="${base}${pagePath(S, L)}">${esc(name(S, L))}</a></li>`).join('')}</ol></section>\n`;
  const foot = (L) => `<footer><p>${esc(txt(new JSDOM(`<p>${kb.footer[L]}</p>`).window.document.body))}</p></footer>\n</body>\n</html>\n`;

  const files = new Map(), pages = [], descs = new Map();
  for (const L of LANGS) {
    for (const [i, S] of ORDER.entries()) {
      const r = readStop(web, S, L), nm = name(S, L);
      const title = `${nm} · ${SITE[L]}`;
      let desc = clip([r.sub, r.one && r.one !== r.sub ? r.one : ''].filter(Boolean).join(L === 'zh' ? '' : ' '), L === 'zh' ? 110 : 160);
      if (!desc || [...descs.values()].includes(desc)) desc = clip(`${nm}: ${desc || r.plain[0] || ''}`, L === 'zh' ? 110 : 160);
      descs.set(`${L}:${S}`, desc);
      const path = pagePath(S, L), alt = { zh: pagePath(S, 'zh'), en: pagePath(S, 'en') };
      const trail = [[T[L].home, L === 'en' ? '?lang=en' : ''], [T[L].cat, catPath(L)], ...kb.PATH[S].filter((x) => x !== S && x !== 'H').map((x) => [name(x, L), pagePath(x, L)]), [nm, path]];
      const ld = { '@context': 'https://schema.org', '@graph': [website(L),
        { '@type': 'LearningResource', '@id': abs(path) + '#lesson', name: nm, headline: title, description: desc, url: abs(path), inLanguage: HL[L],
          learningResourceType: L === 'zh' ? '图解课程' : 'illustrated lesson', educationalLevel: L === 'zh' ? '入门' : 'beginner', isAccessibleForFree: true,
          image: ORIGIN + base + 'og.png', dateModified: lm(S), position: i + 1, isPartOf: course(L) },
        crumbs(trail)] };
      const pv = ORDER[i - 1], nx = ORDER[i + 1];
      const body = `<nav class="bc" aria-label="breadcrumb"><ol>${trail.map(([n, p], k) => k === trail.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${base}${p}">${esc(n)}</a></li>`).join('')}</ol></nav>
<main>
<p class="lv">${T[L].lv(i + 1, N)}</p>
<h1>${esc(nm)}</h1>
${r.sub ? `<p class="lead">${esc(r.sub)}</p>\n` : ''}${r.one && r.one !== r.sub ? `<p>${esc(r.one)}</p>\n` : ''}${r.why ? `<p>${esc(r.why)}</p>\n` : ''}<p class="open"><a href="${appHref(S, L)}">${T[L].open}</a></p>
${r.plain.length ? `<section><h2>${T[L].plain}</h2>${r.plain.map((p) => `<p>${esc(p)}</p>`).join('')}</section>\n` : ''}${r.bd.length ? `<section class="bd">${r.bd.map((p) => `<p>${esc(p)}</p>`).join('')}</section>\n` : ''}${r.cards.length ? `<section><h2>${T[L].inside}</h2><ul>${r.cards.map((c) => `<li><b>${esc(c.h)}</b>${c.lab ? ` <small>(${T[L].lab})</small>` : ''}${c.p ? `<br>${esc(clip(c.p, L === 'zh' ? 90 : 180))}` : ''}</li>`).join('')}</ul></section>\n` : ''}<nav class="pn">${pv ? `<a href="${base}${pagePath(pv, L)}" rel="prev">${T[L].prev}${T[L].colon}${esc(name(pv, L))}</a>` : '<span></span>'}${nx ? `<a href="${base}${pagePath(nx, L)}" rel="next">${T[L].next.replace(' →', '')}${T[L].colon}${esc(name(nx, L))} →</a>` : ''}</nav>
${allList(L, S)}</main>
`;
      files.set(path + 'index.html', head({ L, title, desc, path, alt, ld }) + body + foot(L));
      pages.push({ path, alt, lastmod: lm(S) });
    }
    /* catalogue */
    const path = catPath(L), alt = { zh: catPath('zh'), en: catPath('en') }, title = `${T[L].catT(N)} · ${SITE[L]}`;
    const ld = { '@context': 'https://schema.org', '@graph': [website(L), course(L),
      { '@type': 'ItemList', itemListElement: ORDER.map((S, k) => ({ '@type': 'ListItem', position: k + 1, name: name(S, L), url: abs(pagePath(S, L)) })) },
      crumbs([[T[L].home, L === 'en' ? '?lang=en' : ''], [T[L].cat, path]])] };
    files.set(path + 'index.html', head({ L, title, desc: T[L].catD, path, alt, type: 'website', ld })
      + `<main>\n<h1>${esc(T[L].catT(N))}</h1>\n<p>${esc(T[L].catD)}</p>\n<p class="open"><a href="${appHref('H', L)}">${T[L].open}</a></p>\n<ol>${ORDER.map((S) => `<li><a href="${base}${pagePath(S, L)}"><b>${esc(name(S, L))}</b></a> — ${esc(descs.get(`${L}:${S}`))}</li>`).join('')}</ol>\n</main>\n` + foot(L));
    pages.push({ path, alt, lastmod: ORDER.map((S) => lm(S)).sort().at(-1) });
  }
  const newest = pages.map((p) => p.lastmod).sort().at(-1);
  /* sitemap: home + catalogues + every stop page, each with its language alternates */
  const url = (p, alt, mod) => `<url><loc>${abs(p)}</loc><lastmod>${mod}</lastmod>${alt ? `<xhtml:link rel="alternate" hreflang="zh-CN" href="${abs(alt.zh)}"/><xhtml:link rel="alternate" hreflang="en" href="${abs(alt.en)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${abs(alt.zh)}"/>` : ''}</url>`;
  files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`
    + [url('', null, newest), ...pages.map((p) => url(p.path, p.alt, p.lastmod))].join('\n') + '\n</urlset>\n');
  files.set('robots.txt', `# Crawlers read robots.txt only at a host's root (${ORIGIN}/robots.txt); this copy documents the intent\n# for ${ORIGIN}${base} and points to its sitemap.\nUser-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
  /* 404: GitHub Pages serves <repo root>/404.html for any missing path under the site */
  files.set('404.html', head({ L: 'zh', title: `404 · ${SITE.zh} · ${SITE.en}`, desc: T.zh.nfP, path: '404.html', noindex: true, type: 'website' })
    + `<main>\n<h1>${T.zh.nf} · <span lang="en">${T.en.nf}</span></h1>\n<p>${T.zh.nfP}</p>\n<p lang="en">${T.en.nfP}</p>\n<ul><li><a href="${base}">${T.zh.nfHome}</a> · <a href="${base}?lang=en" lang="en">${T.en.nfHome}</a></li><li><a href="${base}s/">${T.zh.nfCat}</a> · <a href="${base}en/s/" lang="en">${T.en.nfCat}</a></li></ul>\n</main>\n</body>\n</html>\n`);
  return files;
}
