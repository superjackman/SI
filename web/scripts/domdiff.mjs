/* Structural DOM diff of a station: live page vs React build, same viewport, after both settle (labs near the top run in both).
   node scripts/domdiff.mjs [--stations T1,T2,T3] */
import { chromium } from '@playwright/test';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const LIVE = arg('live', 'http://127.0.0.1:8091/SI/index.html'), NEXT = arg('next', 'http://localhost:4173/SI/next/');
const b = await chromium.launch({ channel: 'chrome' });
const dump = async (url, S) => {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await p.goto(url); await p.waitForSelector(`section#${S} .m-stage`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
  const r = await p.evaluate((S) => {
    const out = [];
    const IGN = new Set(['data-bz', 'style', 'data-nh', 'data-cc', 'data-mr', 'data-dd', 'data-ic']);
    const walk = (n, path) => {
      if (n.nodeType === 3) { const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (t) out.push(path + ' "' + t.slice(0, 60) + '"'); return; }
      if (n.nodeType !== 1) return;
      const at = [...n.attributes].filter((a) => !IGN.has(a.name) && !(a.name === 'class' && !a.value)).map((a) => a.name + '=' + (a.name === 'id' || a.name === 'aria-controls' || a.name === 'aria-labelledby' ? a.value.replace(/^mt\d+/, 'mt') : a.value.slice(0, 50))).sort().join(' ');
      const me = path + '>' + n.tagName.toLowerCase() + (at ? '[' + at + ']' : '');
      out.push(me);
      [...n.childNodes].forEach((c) => walk(c, n.tagName.toLowerCase()));
    };
    walk(document.getElementById(S), '');
    return out;
  }, S);
  await p.close(); return r;
};
for (const S of arg('stations', 'T1,T2,T3').split(',')) for (const lang of ['zh', 'en']) {
  const a = await dump(`${LIVE}?lang=${lang}#${S}`, S), c = await dump(`${NEXT}?lang=${lang}#${S}`, S);
  /* LCS-free quick diff: report lines only in one side */
  const ca = new Map(), cc = new Map();
  a.forEach((x) => ca.set(x, (ca.get(x) || 0) + 1)); c.forEach((x) => cc.set(x, (cc.get(x) || 0) + 1));
  const onlyL = [], onlyN = [];
  for (const [k, v] of ca) { const d = v - (cc.get(k) || 0); if (d > 0) onlyL.push(d + '× ' + k); }
  for (const [k, v] of cc) { const d = v - (ca.get(k) || 0); if (d > 0) onlyN.push(d + '× ' + k); }
  console.log(`== ${S} ${lang}: ${a.length} live nodes, ${c.length} next nodes; ${onlyL.length} only-live, ${onlyN.length} only-next`);
  onlyL.slice(0, 12).forEach((x) => console.log('  - live: ' + x.slice(0, 220)));
  onlyN.slice(0, 12).forEach((x) => console.log('  + next: ' + x.slice(0, 220)));
}
await b.close();
