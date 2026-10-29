// R42: renders the link-preview pictures and the per-card landing pages, committed under public/ (so every build ships them):
//   public/og.png         1200×630 site picture (OG; quantized to 256 colours with Pillow → ~160 KB)
//   public/og/<id>.jpg    1200×630 per-card picture (OG-K, JPEG ~75 KB: the gradients make PNGs ~900 KB) — layer, name, one line, 3 points, brand + QR to the card
//   public/c/<id>.html    static landing page: og meta for chat/link previews (no JS needed), then a redirect into the app
//                         at ../?lang=<?lang= or saved>#<layer>~<id>; a visible "打开这张卡" link if JS is off.
// The drawing is the app's own canvas code (src/l4/share/og.ts + card.ts), run in Chromium through Vite's dev server.
// Run after changing a card or the design:  node scripts/og-cards.mjs     (tests/unit/r42og.test.ts checks pages ↔ cards)
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://superjackman.github.io/SI/';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const server = await createServer({ root: web, configFile: join(web, 'vite.config.ts'), logLevel: 'error', server: { port: 5199, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0], base = server.config.base;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(url + '?lang=zh#home');
  const out = await page.evaluate(async ({ base, SITE }) => {
    const O = await import(base + 'src/l4/share/og.ts'), C = await import(base + 'src/l4/share/card.ts'), K = await import(base + 'src/l4/c/kc.ts');
    const ic = new Image(); ic.src = base + 'icon-512.png'; await ic.decode(); await document.fonts.ready;
    const all = async (l) => ({ ...(await K.cards(l, 'K01')), ...(await K.cards(l, 'KA01')), ...(await K.cards(l, 'KC01')) });
    const zh = await all('zh'), en = await all('en'), res = { og: O.site(ic).toDataURL('image/png'), cards: {} };
    for (const id of Object.keys(zh)) {
      const d = C.cardData('zh', id, zh[id], `${SITE}c/${id}.html`, '大白话拆解 AI'), de = C.cardData('en', id, en[id], '', '');
      res.cards[id] = { png: O.card(d, ic).toDataURL('image/jpeg', 0.86), n: C.lvOf(id).n, lv: d.lv, lvC: d.lvC, name: d.name, idea: d.idea, pts: d.pts, enName: de.name, enIdea: de.idea };
    }
    return res;
  }, { base, SITE });
  const png = (f, u) => writeFileSync(f, Buffer.from(u.split(',')[1], 'base64'));
  png(join(web, 'public/og.png'), out.og);
  execFileSync('python3', ['-c', "import sys;from PIL import Image;f=sys.argv[1];Image.open(f).convert('RGB').quantize(256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).save(f,optimize=True)", join(web, 'public/og.png')]);
  for (const d of ['og', 'c']) { rmSync(join(web, 'public', d), { recursive: true, force: true }); mkdirSync(join(web, 'public', d)); }
  const HOME = ['#L4', '#L1', '#L2', '#L3', '#L4', '#L5'];
  for (const [id, c] of Object.entries(out.cards)) {
    png(join(web, 'public/og', `${id}.jpg`), c.png);
    writeFileSync(join(web, 'public/c', `${id}.html`), page_(id, c, HOME[c.n] + '~' + id));
  }
  console.log(`✓ og.png + ${Object.keys(out.cards).length} og/<id>.jpg + c/<id>.html`);
} finally { await browser.close(); await server.close(); }

function page_(id, c, hash) {
  const t = `${c.name} · 大白话拆解 AI`, u = `${SITE}c/${id}.html`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(t)}</title>
<meta name="description" content="${esc(c.idea)}">
<meta name="theme-color" content="#0b1230">
<link rel="canonical" href="${u}">
<link rel="icon" href="../icon-192.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="大白话拆解 AI">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(c.idea)}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${SITE}og/${id}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="zh_CN">
<meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}og/${id}.jpg">
<script>
(function(){var m=/[?&]lang=([a-z]+)/i.exec(location.search),l=m?(/^en/i.test(m[1])?'en':'zh'):'';
if(!l){try{l=localStorage.getItem('aiexp.lang')||'';}catch(e){}}
var h='../'+(l==='en'||l==='zh'?'?lang='+l:'')+'${hash}';
var a=document.documentElement;a.setAttribute('data-to',h);if(l==='en')a.lang='en';
location.replace(h);})();
</script>
<style>
html,body{margin:0;background:#0b1230;color:#fff;font:16px/1.6 system-ui,-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif}
main{max-width:520px;margin:0 auto;padding:32px 20px}
.lv{display:inline-block;padding:2px 10px;border-radius:8px;font-size:13px;font-weight:800;background:${c.lvC}}
h1{font-size:28px;line-height:1.3;margin:14px 0 6px}
.en{color:#9fb3e6;font-size:14px;margin:0 0 14px}
p.i{color:#c8d6ff;margin:0 0 16px}
ul{list-style:none;padding:0;margin:0 0 24px}
li{background:rgba(255,255,255,.08);border-left:4px solid #ffd34d;border-radius:10px;padding:10px 14px;margin-bottom:10px}
a.go{display:block;text-align:center;padding:14px;border-radius:12px;background:#ffd34d;color:#1a1300;font-weight:800;text-decoration:none}
a.alt{display:block;text-align:center;margin-top:12px;color:#9fb3e6}
</style>
</head>
<body>
<main>
<span class="lv">${esc(c.lv)}</span>
<h1>${esc(c.name)}</h1>
<p class="en">${esc(c.enName)}</p>
<p class="i">${esc(c.idea)}</p>
<ul>${c.pts.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
<a class="go" href="../?lang=zh${hash}">打开这张卡 ›</a>
<a class="alt" href="../?lang=en${hash}" lang="en">Open this card in English ›</a>
</main>
</body>
</html>
`;
}
