/* Side-by-side screenshots: live single-file page vs the React build, per station and language (390×844, full page).
   node scripts/compare.mjs --live http://127.0.0.1:8091/SI/index.html --next http://localhost:4173/SI/next/ --out /workspace/si-r2-shots */
import { chromium } from '@playwright/test';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const LIVE = arg('live', 'http://127.0.0.1:8091/SI/index.html'), NEXT = arg('next', 'http://localhost:4173/SI/next/'), OUT = arg('out', '/workspace/si-r2-shots');
const ST = arg('stations', 'T1,T2,T3').split(','), W = +arg('width', '390');
const b = await chromium.launch({ channel: 'chrome' });
const settle = async (p) => {
  await p.evaluate(async () => { await document.fonts.ready; });
  await p.waitForTimeout(1200);
  /* both pages may still be finishing a smooth scroll: pin the top until it stays there */
  for (let i = 0; i < 10; i++) {
    const y = await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); return new Promise((r) => setTimeout(() => r(window.scrollY), 250)); });
    if (y === 0) break;
  }
  await p.waitForTimeout(300);
};
for (const S of ST) for (const lang of ['zh', 'en']) {
  for (const [k, url] of [['live', `${LIVE}?lang=${lang}#${S}`], ['next', `${NEXT}?lang=${lang}#${S}`]]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, locale: lang === 'en' ? 'en-US' : 'zh-CN' });
    const p = await ctx.newPage();
    await p.goto(url);
    if (k === 'live') await p.waitForFunction(() => window.__explainerReady); else await p.waitForSelector(`section#${S} .m-stage, section#${S} .pagehead`);
    await settle(p);
    console.log(k, S, lang, await p.evaluate(() => [scrollY, document.querySelector('#crumb').getBoundingClientRect().top, document.querySelector('#topbar').getBoundingClientRect().height, document.querySelector('.level.active .m-stage')?.getBoundingClientRect().top].join(' ')));
    await p.screenshot({ path: `${OUT}/${k}-${S}-${lang}-top.png` });
    /* full-page capture resizes the viewport; the live page grows its top bar by 1px per resize (setTbh measures itself) */
    await p.screenshot({ path: `${OUT}/${k}-${S}-${lang}.png`, fullPage: true });
    await ctx.close();
  }
  console.log('shot', S, lang);
}
await b.close();
