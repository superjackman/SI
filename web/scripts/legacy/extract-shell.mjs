#!/usr/bin/env node
// Migration tool (R4): snapshot the live page's SHELL content that is not part of a station <section>:
//   gen/tour.<lang>.json     the 15 resolved tour steps (+ the panel text the live tourGo renders for each step)
//   gen/train.<lang>.json    #trainPanel (training-mode panel shown on the Transformer stops) + its wide diagram original
//   gen/outline.<lang>.json  per station the card list the live learning map (#tree) is built from: [id, label, kind, z]
//   tests/fixtures/tour-hl.<lang>.json  what the live tour highlights / chips per step (used by the e2e diff)
//
//   node scripts/legacy/extract-shell.mjs [--page ../index.html]
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveFile } from './serve.mjs';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : d; };
const page = resolve(web, arg('--page', '../index.html'));
const out = join(web, 'src/legacy/gen');
mkdirSync(join(web, 'tests/fixtures'), { recursive: true });
const json = (p, o) => writeFileSync(p, JSON.stringify(o) + '\n');

const srv = await serveFile(page);
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
for (const lang of ['zh', 'en']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'zh-CN' });
  await ctx.addInitScript(() => {
    // @ts-ignore
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    for (const k of ['__refitAll', '__refitIn', '__fitBoxes', '__fitZoom', '__refitSvg'])
      Object.defineProperty(window, k, { configurable: false, get() { return function () {}; }, set() {} });
  });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${srv.url}?lang=${lang}`);
  await p.waitForFunction(() => window.__explainerReady === true);
  if (errors.length) throw new Error('page errors: ' + errors.join('; '));

  /* ---------- outline (learning map) — same filter/label as the live secLinks ---------- */
  const outline = await p.evaluate(() => {
    function headText(card) { const h = card.querySelector(':scope>h2,:scope>h3'); return h ? h.textContent.replace(/示例数据.*$|示例.*$|玩具.*$|简化模拟.*$|示意.*$|Q-learning.*$/, '').replace(/\s(Sample data|Sample|Example|Toy|Simplified simulation|Illustrative)\b.*$/, '').trim() : ''; }
    const o = {};
    document.querySelectorAll('.level').forEach((s) => {
      o[s.id] = [...s.querySelectorAll('.card')].filter((c) => headText(c)).map((c) => {
        const k = c.classList.contains('lab') ? 'lab' : c.classList.contains('quiz') ? 'quiz' : '';
        return [c.id, (k === 'lab' ? '🧪 ' : k === 'quiz' ? '❓ ' : '') + headText(c).replace(/^[^\u4e00-\u9fa5A-Za-z0-9“]+/, '').slice(0, 20), k, +(c.dataset.z || 0)];
      });
    });
    return o;
  });
  json(join(out, `outline.${lang}.json`), outline);

  /* ---------- training panel ---------- */
  const train = await p.evaluate(() => {
    const tp = document.getElementById('trainPanel').cloneNode(true);
    tp.querySelectorAll('.dd-b').forEach((b) => b.remove());
    tp.querySelectorAll('.has-dd').forEach((g) => g.classList.remove('has-dd'));
    tp.querySelectorAll('.m-vw').forEach((h) => { h.removeAttribute('style'); h.classList.remove('zoomed'); });
    tp.querySelectorAll('svg').forEach((g) => { g.style.transform = ''; g.style.transformOrigin = ''; if (!g.getAttribute('style')) g.removeAttribute('style'); });
    const o = window.__ORIG && window.__ORIG.trainSvg;
    return { cls: tp.className, html: tp.innerHTML, orig: o ? { trainSvg: { vb: o.vb, html: o.html } } : {} };
  });
  json(join(out, `train.${lang}.json`), train);

  /* ---------- tour ---------- */
  const tour = await p.evaluate(async () => {
    const T = window.__tour, $ = (id) => document.getElementById(id);
    const steps = [], hl = [];
    T.start();
    const tog = document.querySelector('#tour .tour-tog'); const why = tog.textContent; tog.click(); const collapse = tog.textContent; tog.click();
    for (let i = 0; i < T.len; i++) {
      if (i) T.next();
      await new Promise((r) => setTimeout(r, 30));
      const s = T.steps[i];
      steps.push({ p: s.p, ids: s.ids, lab: s.lab || null, n: $('tourN').textContent, t: $('tourT').textContent, d: $('tourD').textContent, w: $('tourW').innerHTML, f: $('tourF').innerHTML });
      const sec = document.getElementById(s.p);
      hl.push({
        p: s.p,
        hl: [...sec.querySelectorAll('.tour-hl,[data-tourrun]')].map((e) => (e.namespaceURI === 'http://www.w3.org/2000/svg' ? 'svg:' : 'html:') + e.dataset.id + '@' + (e.closest('.m-stage') ? 'stage' : (e.closest('.card') || {}).id || '-')),
        f: $('tourF').innerHTML, n: $('tourN').textContent, prev: $('tourPrev').disabled, next: $('tourNext').textContent,
        dots: [...document.querySelectorAll('#tourDots i')].map((d) => d.className).join(','),
      });
    }
    const last = { next: $('tourNext').textContent };
    const ui = { why, collapse, next: '', done: last.next, dots: [...document.querySelectorAll('#tourDots i')].map((d) => d.title), x: $('tourX').getAttribute('aria-label'), prev: $('tourPrev').getAttribute('aria-label'), aria: $('tour').getAttribute('aria-label') };
    T.steps.length && $('tourPrev').click(); ui.next = $('tourNext').textContent;
    $('tourX').click();
    return { steps, hl, ui };
  });
  json(join(out, `tour.${lang}.json`), { ui: tour.ui, steps: tour.steps });
  json(join(web, `tests/fixtures/tour-hl.${lang}.json`), tour.hl);
  console.log(`${lang}: ${tour.steps.length} tour steps, train panel ${train.html.length} chars, outline ${Object.keys(outline).length} stations`);
  await ctx.close();
}
await browser.close(); srv.close();
