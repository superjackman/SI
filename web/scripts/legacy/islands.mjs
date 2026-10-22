#!/usr/bin/env node
// Migration tool (R2+): lift the interactive pieces (labs, demos, quizzes) of chosen stations out of the live page's
// app script into self-contained ES modules that the React app mounts as "islands" (adapter until R4 rewrites them).
//
//   node scripts/legacy/islands.mjs --src <unminified bilingual build .html> [--stations T1,T2,T3]
//
// The source must be the readable form of the production page (i18n/apply.py output before minify.py); it is checked
// against ../index.html by re-minifying it with the same tool when /workspace/build is present (--no-verify to skip).
// For every station: each lazy lab block (__lz(ids,hooks,fn)) whose elements live on that station, plus listed eager
// statements, plus — by real scope analysis (eslint-scope) — every helper declaration they need, in source order.
// Page-shell functions (go, openInfo, toast …) and the knowledge base C are NOT copied; the adapter provides them.
import * as acorn from 'acorn';
import * as es from 'eslint-scope';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : d; };
const srcFile = arg('--src');
if (!srcFile) { console.error('--src <unminified build html> is required'); process.exit(1); }
const STATIONS = arg('--stations', 'T1,T2,T3').split(',');
const html = readFileSync(srcFile, 'utf8');
const prod = readFileSync(join(web, '../index.html'), 'utf8');

// ---- provenance: the readable source must minify to exactly the production page ----
const MINPY = '/workspace/build/mobile/perf';
if (!process.argv.includes('--no-verify') && existsSync(MINPY + '/minify.py')) {
  const m = execFileSync('python3', ['-c', `import sys;sys.path.insert(0,${JSON.stringify(MINPY)});import minify;sys.stdout.write(minify.minify(open(${JSON.stringify(resolve(srcFile))},encoding='utf-8').read()))`], { maxBuffer: 1 << 26 }).toString('utf8');
  if (m !== prod) { console.error('source does not minify to ../index.html — refusing (use the matching build)'); process.exit(1); }
  console.log('✓ source re-minifies byte-identical to ../index.html');
}
const sha = createHash('sha256').update(prod).digest('hex').slice(0, 16);

// ---- the app script and the i18n map ----
const a = html.lastIndexOf('<script>') + 8, b = html.lastIndexOf('</script>');
const src = html.slice(a, b);
const mI = /var I18N=(\{[\s\S]*?\});\nvar __LANG/.exec(html);
if (!mI) throw new Error('I18N map not found');
const I18N = JSON.parse(mI[1]);

// element id -> station (from the static markup)
const bodyHtml = html.slice(html.indexOf('<body'), html.lastIndexOf('<script>'));
const SEC = [...bodyHtml.matchAll(/<section class="level[^"]*" id="([^"]+)"/g)].map((m) => [m.index, bodyHtml.indexOf('</section>', m.index), m[1]]);
const IDS = {};
for (const m of bodyHtml.matchAll(/\sid="([^"]+)"/g)) for (const [x, y, k] of SEC) if (x <= m.index && m.index < y) IDS[m[1]] = k;

const ast = acorn.parse(src, { ecmaVersion: 2022, ranges: true });
const sm = es.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
const APPFN = ast.body[0].expression.right;
const allRefs = [];
for (const s of sm.scopes) for (const r of s.references) allRefs.push(r);

// names the adapter provides (page shell + runtime globals); never copied
const SHIM = new Set(['C', 'go', 'openInfo', 'openAnywhere', 'jumpTo', 'closeInfo', 'toast', 'mtoast', 'updProg', 'renderCrumb', 'buildTree', '__lz',
  '_t', '_t2', '__LANG', '__join', '__enWords', '__enStem', '__EN_STOP', '__alt', 'I18N']);
// eager (non-lazy) interactive statements per station, matched by the element ids / call they reference
const EAGER = {
  T3: { ids: ['relayStep', 'relayReset'], calls: ['relayReset'] },
  T2: { ids: ['injRun'], calls: [] },
  T4a: { ids: ['attnToks', 'heat', 'maskToggle'], calls: ['attnRender'] },
  T4b: { ids: ['ffnWords', 'actToggle', 'logitInputs', 'temp', 'tSample', 'hx', 'hy', 'dotTarget', 'dotStep', 'dotReset'], calls: ['ffnRender', 'tRender', 'dReset'] },
};
const QUIZ_CLICK = (n) => src.slice(n.start, n.end).includes(".opt[data-q]");

const inside = (n, o) => n.range[0] >= o.range[0] && n.range[1] <= o.range[1];
function stmtOfDef(def) {
  if (def.type === 'FunctionName') return def.node;
  if (def.type === 'Variable') return def.parent;
  throw new Error('unsupported def ' + def.type + ' ' + def.name.name);
}
function litIds(node) { const s = new Set(); (function w(n) { if (!n || typeof n !== 'object') return; if (n.type === 'Literal' && typeof n.value === 'string' && IDS[n.value]) s.add(n.value); for (const k in n) if (k !== 'range' && n[k] && typeof n[k] === 'object') w(n[k]); })(node); return s; }

// statements at depth 0..2 (app body and IIFE bodies inside it)
function* stmts(body, depth = 0) {
  for (const st of body) {
    yield st;
    const e = st.type === 'ExpressionStatement' && st.expression;
    const fn = e && e.type === 'CallExpression' && !e.arguments.length && e.callee.type === 'FunctionExpression' ? e.callee : null;
    if (fn && depth < 2) yield* stmts(fn.body.body, depth + 1);
  }
}
const ALL = [...stmts(APPFN.body.body)];

function closure(roots) {
  const need = new Map(); // stmt -> true
  const names = new Map(); // name -> stmt (collision check)
  const warn = new Set();
  const globals = new Set();
  const q = [...roots];
  const seen = new Set();
  while (q.length) {
    const n = q.pop(); if (seen.has(n)) continue; seen.add(n);
    for (const r of allRefs) {
      if (!inside(r.identifier, n)) continue;
      const v = r.resolved, nm = r.identifier.name;
      if (SHIM.has(nm)) continue;
      if (!v) { globals.add(nm); continue; }
      const defs = v.defs;
      if (!defs.length || defs.every((d) => inside(d.name, n))) continue; // local to this node
      if (v.scope.block === ast.body[0] || v.scope.type === 'global') { globals.add(nm); continue; }
      for (const d of defs) {
        if (inside(d.name, n)) continue;
        if (d.type === 'Parameter') throw new Error(`${nm}: parameter of an enclosing function — cannot lift`);
        const st = stmtOfDef(d);
        const prev = names.get(nm);
        if (prev && prev !== st) throw new Error(`name collision: ${nm} declared twice (${prev.start}, ${st.start})`);
        names.set(nm, st);
        if (!need.has(st)) { need.set(st, true); q.push(st); }
      }
      // writes to this variable outside what we copy: the copy will not see them
      for (const ref of v.references) if (ref.isWrite()) warn.add([nm, ref.identifier]);
    }
  }
  const copied = [...need.keys(), ...roots];
  const w = new Set([...warn].filter(([, id]) => !copied.some((st) => inside(id, st))).map(([nm]) => nm));
  return { need: [...need.keys()].sort((x, y) => x.start - y.start), warn: [...w], globals: [...globals].sort() };
}

const lazy = [];
(function find(n) { if (!n || typeof n !== 'object') return; if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === '__lz') { lazy.push(n); return; } for (const k in n) if (k !== 'range' && n[k] && typeof n[k] === 'object') find(n[k]); })(APPFN.body);

const outDir = join(web, 'src/legacy/gen/islands');
mkdirSync(outDir, { recursive: true });
const report = {};
const labKeys = new Set();
if (!quizSrc()) throw new Error('quiz code not found');
function quizSrc() {
  const qd = ALL.find((st) => st.type === 'VariableDeclaration' && st.declarations.some((d) => d.id.name === 'QZ'));
  const quizClick = ALL.find((st) => st.type === 'ExpressionStatement' && QUIZ_CLICK(st) && src.slice(st.start, st.start + 40).startsWith('document.addEventListener'));
  const renderQuizDecl = ALL.find((st) => st.type === 'FunctionDeclaration' && st.id.name === 'renderQuiz');
  return qd && quizClick && renderQuizDecl ? { qd, quizClick, renderQuizDecl } : null;
}
for (const S of STATIONS) {
  const labs = lazy.filter((n) => { const ids = n.arguments[0].elements.map((e) => e.value); const st = new Set(ids.map((i) => IDS[i]).filter(Boolean)); return st.size === 1 && st.has(S); });
  const eager = [];
  const E = EAGER[S];
  const bareCall = (st, f) => st.type === 'ExpressionStatement' && st.expression.type === 'CallExpression' && st.expression.callee.type === 'Identifier' && st.expression.callee.name === f;
  if (E) for (const st of ALL) { if (st === APPFN || /^\(function\(\)\{/.test(src.slice(st.start, st.start + 12)) && st.end - st.start > 20000) continue; const L = litIds(st); if ((E.ids.some((i) => L.has(i)) || E.calls.some((f) => bareCall(st, f))) && !lazy.some((z) => inside(z, st) || inside(st, z))) eager.push(st); }
  const quizClick = ALL.find((st) => st.type === 'ExpressionStatement' && QUIZ_CLICK(st) && src.slice(st.start, st.start + 40).startsWith('document.addEventListener'));
  const renderQuizDecl = ALL.find((st) => st.type === 'FunctionDeclaration' && st.id.name === 'renderQuiz');
  /* R4: the quiz is native (src/station/quiz.ts) and its data is shared (gen/quiz.<lang>.json) — not copied per station */
  const roots = [...labs.map((n) => n.arguments[2]), ...eager];
  const { need, warn, globals } = closure(roots);
  const deps = need.filter((st) => !roots.includes(st) && !eager.some((e) => inside(st, e)));
  const keys = new Set();
  const text = (n) => src.slice(n.start, n.end);
  const scan = (s) => { for (const m of s.matchAll(/\b_t\('([^']+)'\)/g)) keys.add(m[1]); };
  let code = '';
  code += `// GENERATED by scripts/legacy/islands.mjs from the live page (index.html sha256 ${sha}…). Do not edit — regenerate.\n`;
  code += `// Station ${S}: ${labs.length} lazy lab block(s), ${eager.length} eager statement(s), quiz; ${deps.length} lifted helper declaration(s).\n`;
  code += `// @ts-nocheck\n/* eslint-disable */\n`;
  code += `export const LABS = ${JSON.stringify(labs.map((n) => ({ ids: n.arguments[0].elements.map((e) => e.value), hooks: n.arguments[1].elements.map((e) => e.value) })))};\n`;
  code += `export function mount(env) {\n'use strict';\nvar window = env.window, document = env.document, setTimeout = env.setTimeout, clearTimeout = env.clearTimeout, setInterval = env.setInterval, clearInterval = env.clearInterval, requestAnimationFrame = env.requestAnimationFrame, cancelAnimationFrame = env.cancelAnimationFrame, IntersectionObserver = env.IntersectionObserver;\n`;
  code += `var C = env.C, go = env.go, openInfo = env.openInfo, openAnywhere = env.openAnywhere, jumpTo = env.jumpTo, closeInfo = env.closeInfo, toast = env.toast, mtoast = env.toast, updProg = env.updProg, renderCrumb = env.noop, buildTree = env.noop;\n`;
  code += `var __LANG = env.lang, _t = env.rt._t, _t2 = env.rt._t2, __join = env.rt.__join, __enWords = env.rt.__enWords, __enStem = env.rt.__enStem, __EN_STOP = env.rt.__EN_STOP, __alt = env.rt.__alt;\n`;
  code += `/* ---- lifted helpers (source order) ---- */\n`;
  for (const d of deps) { const t = text(d); scan(t); code += t + '\n'; }
  code += `/* ---- labs ---- */\nvar labs = [\n`;
  for (const n of labs) { const t = text(n.arguments[2]); scan(t); code += t + ',\n'; }
  /* declarations of the eager demos live at mount scope (lifted helpers may call them); their statements run in eager() */
  const isDecl = (st) => st.type === 'FunctionDeclaration' || st.type === 'VariableDeclaration';
  code += `];\n/* ---- eager demos: declarations ---- */\n`;
  for (const st of eager.filter(isDecl)) { const t = text(st); scan(t); code += t + '\n'; }
  code += `/* ---- eager demos + quiz (run at mount, like the live page does at start-up) ---- */\nfunction eager() {\n`;
  for (const st of eager.filter((x) => !isDecl(x))) { const t = text(st); scan(t); code += t + '\n'; }
  code += `}\n`;
  code += `return { labs: labs, eager: eager };\n}\n`;
  for (const k of keys) { if (!I18N[k]) throw new Error('missing I18N key ' + k); labKeys.add(k); }
  writeFileSync(join(outDir, `${S}.js`), code);
  report[S] = { labs: labs.map((n) => n.arguments[0].elements[0].value), eager: eager.length, deps: deps.map((d) => d.type === 'FunctionDeclaration' ? d.id.name : d.declarations ? d.declarations.map((x) => x.id.name).join(',') : '?'), i18n: keys.size, warn, globals, bytes: code.length };
}

// ---- shared data, once for all stations ----
const gen = join(web, 'src/legacy/gen');
const { qd, quizClick, renderQuizDecl } = quizSrc();
/* the native quiz port must match this code; its hash is recorded so a change upstream is noticed */
const quizHash = createHash('sha256').update(src.slice(quizClick.start, quizClick.end) + '\n' + src.slice(renderQuizDecl.start, renderQuizDecl.end)).digest('hex').slice(0, 16);
const qkey = {};
for (const lang of ['zh', 'en']) {
  const _t = (k) => { const e = I18N[k]; if (!e) throw new Error('missing I18N key ' + k); return e[lang]; };
  const _t2 = (zh, en) => (lang === 'en' ? en : zh);
  const QZ = new Function('_t', '_t2', src.slice(qd.start, qd.end) + '\nreturn QZ;')(_t, _t2);
  writeFileSync(join(gen, `quiz.${lang}.json`), JSON.stringify(QZ));
  for (const [k, qs] of Object.entries(QZ)) { const a = qs.map((q) => q[2]); if (qkey[k] && JSON.stringify(qkey[k]) !== JSON.stringify(a)) throw new Error('quiz key differs between languages: ' + k); qkey[k] = a; }
}
writeFileSync(join(gen, 'qkey.json'), JSON.stringify({ src: quizHash, key: qkey }));
/* the labs' _t() keys, all stations in one shared chunk (was a copy per station) */
const lab = {}; for (const k of [...labKeys].sort()) lab[k] = I18N[k];
writeFileSync(join(gen, 'lab-i18n.json'), JSON.stringify(lab));
report._shared = { quizHash, quiz: Object.fromEntries(Object.entries(qkey).map(([k, v]) => [k, v.length])), labKeys: labKeys.size };
console.log(JSON.stringify(report, null, 1));
