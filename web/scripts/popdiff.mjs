/* Popup DOM diff: every part owned by the given stations, live vs React build (title, drill row, body). */
import { chromium } from '@playwright/test';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const LIVE = arg('live', 'http://127.0.0.1:8091/SI/index.html'), NEXT = arg('next', 'http://localhost:4173/SI/next/');
const ST = arg('stations', 'T1,T2,T3').split(',');
const b = await chromium.launch({ channel: 'chrome' });
const norm = () => {
  const box = document.getElementById('modalBox'); const out = [];
  const IGN = new Set(['data-bz', 'style', 'tabindex']);
  const walk = (n, d) => {
    if (n.nodeType === 3) { const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (t) out.push(d + '"' + t + '"'); return; }
    if (n.nodeType !== 1) return;
    const at = [...n.attributes].filter((a) => !IGN.has(a.name)).map((a) => a.name + '=' + a.value.replace(/^mt\d+/, 'mt')).sort().join(' ');
    out.push(d + n.tagName.toLowerCase() + '[' + at + ']'); [...n.childNodes].forEach((c) => walk(c, d + ' '));
  };
  walk(box, ''); return out.join('\n');
};
let bad = 0, n = 0;
for (const lang of ['zh', 'en']) for (const S of ST) {
  const pl = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pn = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await pl.goto(`${LIVE}?lang=${lang}#${S}`); await pl.waitForFunction(() => window.__explainerReady);
  await pn.goto(`${NEXT}?lang=${lang}#${S}`); await pn.waitForFunction(() => window.__si && document.querySelector('.level .m-stage'));
  const ids = await pl.evaluate((S) => Object.keys(window.__u.C).filter((k) => window.__u.C[k].t === S), S);
  for (const id of ids) {
    n++;
    await pl.evaluate((id) => window.__u.openInfo(id), id);
    const a = await pl.evaluate(norm);
    await pn.evaluate((id) => window.__si.openInfo(id), id);
    await pn.waitForFunction((id) => document.querySelector('#modal.open .m-body') && window.__si.state().popup?.id === id, id);
    await pn.waitForTimeout(30);
    const c = await pn.evaluate(norm);
    if (a !== c) {
      bad++; const A = a.split('\n'), B = c.split('\n'); let i = 0; while (A[i] === B[i]) i++;
      console.log(`✗ ${lang} ${S} ${id} @line ${i}\n   live: ${(A[i] || '').slice(0, 200)}\n   next: ${(B[i] || '').slice(0, 200)}`);
    }
  }
  await pl.close(); await pn.close();
}
console.log(`popups compared: ${n}, different: ${bad}`);
await b.close();
