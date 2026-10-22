#!/usr/bin/env node
// Migration tool (R2+): snapshot the CONTENT of the live single-file page into data the React app renders.
// Content is taken from the production file itself (repo root index.html, read-only) so it matches 1:1 in both languages.
//
//   node scripts/legacy/extract.mjs [--page ../index.html] [--stations T1,T2,T3]
//
// Runs the page in headless Chrome at 390 px (phone layout) per language with
//  - IntersectionObserver stubbed  -> labs stay un-started, so their cards are captured in their initial markup
//  - the English label fitter disabled -> SVG text is captured unfitted; the app re-fits with the reader's real fonts
// and writes src/legacy/gen/:
//   legacy.css                 all <style> the page has after start-up (incl. runtime-generated category colours)
//   kb.json                    light knowledge base: per part {n:{zh,en}, cat, train, t, up, zoom, links}, station names/paths, footer
//   search.json                per part one-line role {zh,en} (loaded when search opens)
//   st/<S>.<lang>.json         station <section> markup (diagram drill badges stripped; the app draws them)
//   st/<S>.<lang>.wide.json    the original wide diagrams (full screen in landscape)
//   nodes/<S>.<lang>.json      popup body + title + colour for every part owned by station S (all stations)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveFile } from './serve.mjs';

/* DOM built by script can hold nesting the HTML parser would rewrite (a <ul> inside a <p> …). Such elements are
   stored under a placeholder tag <si-x data-si-tag="p"> and turned back into the real element at hydrate time
   (src/legacy/restore.ts), so the live DOM is reproduced exactly. Every snapshot is round-trip checked. */
const SAFE_FN = `window.__siSafe = function (root) {
  var BLOCK = /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DETAILS|DIALOG|DIV|DL|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HGROUP|HR|MAIN|MENU|NAV|OL|P|PRE|SECTION|TABLE|UL)$/;
  var n = 0, all = [].slice.call(root.querySelectorAll('p')).reverse();
  all.forEach(function (p) {
    if (![].some.call(p.children, function (c) { return BLOCK.test(c.tagName); })) return;
    var d = document.createElement('si-x'); d.setAttribute('data-si-tag', 'p');
    [].forEach.call(p.attributes, function (a) { d.setAttribute(a.name, a.value); });
    while (p.firstChild) d.appendChild(p.firstChild);
    p.parentNode.replaceChild(d, p); n++;
  });
  return n;
};
window.__siRoundTrip = function (html) {
  var t = document.createElement('template'); t.innerHTML = html; var h2 = t.innerHTML;
  if (h2 === html) return null;
  var i = 0; while (i < html.length && html[i] === h2[i]) i++;
  return { at: i, was: html.slice(Math.max(0, i - 120), i + 80), now: h2.slice(Math.max(0, i - 120), i + 80) };
};`;


const web = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : d; };
const page = resolve(web, arg('--page', '../index.html'));
const STATIONS = arg('--stations', 'T1,T2,T3').split(',');
const out = join(web, 'src/legacy/gen');
mkdirSync(join(out, 'st'), { recursive: true });
mkdirSync(join(out, 'nodes'), { recursive: true });

const srv = await serveFile(page);
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
const KB = { C: {}, TABN: {}, PATH: null, TABORDER: null, footer: {} };
const ROLE = {};
const json = (p, o) => writeFileSync(join(out, p), JSON.stringify(o) + '\n');

for (const lang of ['zh', 'en']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'zh-CN' });
  await ctx.addInitScript(() => {
    // @ts-ignore
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    for (const k of ['__refitAll', '__refitIn', '__fitBoxes', '__fitZoom', '__refitSvg'])
      Object.defineProperty(window, k, { configurable: false, get() { return function () {}; }, set() {} });
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${srv.url}?lang=${lang}`);
  await p.waitForFunction(() => window.__explainerReady === true);
  if (errors.length) throw new Error('page errors: ' + errors.join('; '));

  // ---------- kb ----------
  const kb = await p.evaluate(() => {
    const C = window.__u.C, out = {};
    for (const [id, c] of Object.entries(C)) out[id] = { n: c.n, cat: c.cat, train: c.train, t: c.t, up: c.up || null, zoom: c.zoom || null, links: c.links || null, role: c.role };
    const TABN = {};
    document.querySelectorAll('.level').forEach((s) => { const h = s.querySelector('.pagehead .pg-t'); if (h) TABN[s.id] = h.textContent.replace(/^\d+/, '').trim(); });
    return { C: out, TABN, PATH: window.__u.PATH, TABORDER: [...document.querySelectorAll('.level')].map((s) => s.id), footer: document.querySelector('footer').innerHTML };
  });
  KB.PATH = kb.PATH; KB.TABORDER = kb.TABORDER; KB.footer[lang] = kb.footer;
  for (const [k, v] of Object.entries(kb.TABN)) (KB.TABN[k] ||= {})[lang] = v;
  for (const [id, c] of Object.entries(kb.C)) {
    const e = (KB.C[id] ||= { n: {}, cat: c.cat, train: c.train, t: c.t, up: c.up, zoom: c.zoom, links: c.links ? c.links.map((l) => [l[0], {}]) : null });
    e.n[lang] = c.n; (ROLE[id] ||= {})[lang] = c.role;
    if (c.links) c.links.forEach((l, i) => { e.links[i][1][lang] = l[1]; });
  }

  // ---------- css (once) ----------
  if (lang === 'zh') {
    const css = await p.evaluate(() => [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n'));
    writeFileSync(join(out, 'legacy.css'), '/* generated from the live page by scripts/legacy/extract.mjs — do not edit */\n' + css + '\n');
  }

  // ---------- stations ----------
  await p.evaluate(SAFE_FN);
  for (const S of STATIONS) {
    const st = await p.evaluate((S) => {
      window.__u.go(S);
      const sec = document.getElementById(S).cloneNode(true);
      sec.querySelectorAll('.dd-b').forEach((b) => b.remove());
      sec.querySelectorAll('.card.quiz[id^="quiz"]').forEach((q) => { q.innerHTML = ''; }); // the app renders it (strip-quiz.mjs)
      sec.querySelectorAll('.has-dd').forEach((g) => g.classList.remove('has-dd'));
      sec.querySelectorAll('.m-vw').forEach((h) => { h.removeAttribute('style'); h.classList.remove('zoomed'); });
      sec.querySelectorAll('svg').forEach((g) => { g.style.transform = ''; g.style.transformOrigin = ''; if (!g.getAttribute('style')) g.removeAttribute('style'); });
      const orig = {};
      sec.querySelectorAll('svg[id]').forEach((g) => { const o = window.__ORIG && window.__ORIG[g.id]; if (o) orig[g.id] = { vb: o.vb, html: o.html }; });
      const fixed = window.__siSafe(sec);
      const rt = window.__siRoundTrip(sec.innerHTML);
      return { cls: sec.className.replace(/\b(active|anim)\b/g, '').trim(), html: sec.innerHTML, orig, fixed, rt };
    }, S);
    if (st.rt) throw new Error(`${lang} ${S}: snapshot does not survive HTML parsing at ${st.rt.at}\n was: ${st.rt.was}\n now: ${st.rt.now}`);
    json(`st/${S}.${lang}.json`, { cls: st.cls, html: st.html });
    json(`st/${S}.${lang}.wide.json`, st.orig);
    console.log(`${lang} ${S}: ${st.html.length} chars, ${Object.keys(st.orig).length} wide originals, ${st.fixed} parser-unsafe <p> kept as <si-x>, round-trip ✓`);
  }

  // ---------- popups (all parts, grouped by owning station) ----------
  const ids = Object.keys(kb.C);
  const nodes = {};
  for (const id of ids) {
    const r = await p.evaluate((id) => {
      const c = window.__u.C[id];
      if (window.__u.cur() !== c.t) window.__u.go(c.t);
      window.__u.openInfo(id);
      const box = document.getElementById('modalBox');
      const h3 = box.querySelector('.m-head h3') || box.querySelector('h3');
      const t = h3.cloneNode(true); t.querySelectorAll('.m-back').forEach((x) => x.remove());
      const body = box.querySelector('.m-body')?.cloneNode(true);
      if (body) window.__siSafe(body);
      const raw = body ? body.innerHTML : '';
      const rt = window.__siRoundTrip(raw);
      if (rt) throw new Error('popup ' + id + ' does not survive HTML parsing: ' + JSON.stringify(rt));
      const html = raw.replace(/mt\d+([tp])(\d+)/g, (m, k, i) => 'mt@' + k + i);
      box.querySelector('.close')?.click();
      return { title: t.innerHTML, mc: box.style.getPropertyValue('--mc').trim(), body: html };
    }, id);
    (nodes[kb.C[id].t] ||= {})[id] = r;
  }
  for (const [S, m] of Object.entries(nodes)) json(`nodes/${S}.${lang}.json`, m);
  console.log(`${lang}: ${ids.length} popups in ${Object.keys(nodes).length} station files`);
  await ctx.close();
}
for (const c of Object.values(KB.C)) { if (!c.links) delete c.links; if (!c.zoom) delete c.zoom; if (!c.up) delete c.up; }
json('kb.json', KB);
json('search.json', ROLE);
await browser.close();
srv.close();
console.log('wrote', out);
