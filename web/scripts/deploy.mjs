#!/usr/bin/env node
// Local build → test → copy into the repo working copy. GitHub Pages (branch deploy, settings unchanged) serves what is pushed.
//
//   npm run deploy                      default target: root (base /SI/, output <repo>/) once the root index.html is a
//                                       React build (post-cutover); before that: next (base /SI/next/, output <repo>/next/)
//   npm run deploy:cutover              target root: base /SI/,      output <repo>/        (R5; old index.html -> legacy.html)
//   Post-cutover, --target next is refused: next/ is only the redirect page to /SI/.
//   flags: --pushed <commit> (the live commit, when local deploy commits are not pushed yet; default HEAD), --skip-e2e (only when no Chrome is available — prints a loud warning), --repo <path> (default: parent of web/)
//
// Steps: typecheck, unit tests, build (with the target's base), e2e smoke on the built files at 360/390/430, size budget,
// copy dist (minus .vite/) in, keep the previous deploy's files too (generations in <target>/.si-deploy.json, see
// deploy-gens.mjs — a cached old index.html must still find its hashed assets), delete files only older generations
// listed plus unlisted files in <target>/assets/, ensure an empty <repo>/.nojekyll. Never commits or pushes.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TARGETS } from '../base.config.mjs';
import { readGens, plan, entryOf, safeRel, KEEP, PUSHED } from './deploy-gens.mjs';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const repo = resolve(opt('--repo', join(web, '..')));
if (!existsSync(join(repo, '.git'))) die(`${repo} is not a git working copy (use --repo)`);
const REACT_MARK = 'name="si-build" content="react"';
const isReactRoot = (p) => existsSync(p) && readFileSync(p, 'utf8').includes(REACT_MARK);
const cutDone = isReactRoot(join(repo, 'index.html'));
const targetName = opt('--target', cutDone ? 'root' : 'next');
const target = TARGETS[targetName];
if (!target) die(`unknown --target ${targetName} (use next | root)`);
if (targetName === 'root' && !cutDone && !flag('--confirm-cutover')) die('--target root is the R5 cutover; add --confirm-cutover (npm run deploy:cutover)');
if (targetName === 'next' && cutDone) die('post-cutover: /SI/next/ is only a redirect to /SI/ — deploy the root (npm run deploy)');
const dest = resolve(repo, target.dir);
const env = { ...process.env, SI_TARGET: targetName, SI_BASE: target.base };
const MANIFEST = '.si-deploy.json';

function die(m) { console.error('deploy: ' + m); process.exit(1); }
function step(name, cmd, cmdArgs) {
  console.log(`\n▶ ${name}: ${cmd} ${cmdArgs.join(' ')}`);
  const r = spawnSync(cmd, cmdArgs, { cwd: web, env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) die(`${name} failed (exit ${r.status}) — nothing was copied`);
}
const sha = (p) => (existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : null);
function walk(dir, out = []) {
  for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); }
  return out;
}

console.log(`deploy target=${targetName} base=${target.base} → ${dest}`);
const rootIndex = join(repo, 'index.html');
const rootIndexBefore = sha(rootIndex);

step('typecheck', 'npx', ['tsc', '--noEmit', '-p', 'tsconfig.json']);
step('unit tests', 'npx', ['vitest', 'run']);
step('build', 'npx', ['vite', 'build']);
if (flag('--skip-e2e')) console.warn('\n⚠ e2e smoke SKIPPED (--skip-e2e) — do not push without running it somewhere');
else step('e2e smoke 360/390/430', 'npx', ['playwright', 'test']);
step('size budget', 'node', ['scripts/size.mjs']);

const dist = join(web, 'dist');
// 1) plan generations: the new build + the previous one stay; older generations' files go
mkdirSync(dest, { recursive: true });
const manPath = join(dest, MANIFEST);
const files = walk(dist).map((p) => relative(dist, p)).filter((r) => !r.split(sep).includes('.vite')).map((f) => f.split(sep).join('/'));
const buildId = entryOf(readFileSync(join(dist, 'index.html'), 'utf8'));
if (!buildId) die('dist/index.html has no /assets/ entry script');
let prev = [];
if (existsSync(manPath)) { try { prev = readGens(JSON.parse(readFileSync(manPath, 'utf8'))); } catch { die(`${MANIFEST} is not valid JSON — fix or delete it by hand`); } }
// the last committed manifest = what was pushed (or --pushed <commit>: the commit that is live, when local deploy
// commits are not pushed yet); its newest PUSHED generations are never deleted (see deploy-gens.mjs)
let pushed = [];
const pushedRev = opt('--pushed', 'HEAD');
{
  const relMan = (relative(repo, manPath) || MANIFEST).split(sep).join('/');
  const r = spawnSync('git', ['-C', repo, 'show', `${pushedRev}:${relMan}`], { encoding: 'utf8' });
  if (r.status === 0) { try { pushed = readGens(JSON.parse(r.stdout)); } catch { die(`${pushedRev}:${relMan} is not valid JSON`); } }
  else if (pushedRev !== 'HEAD') die(`--pushed ${pushedRev}: no ${relMan} in that commit`);
}
const P = plan(prev, files, buildId, new Date().toISOString(), KEEP, pushed, PUSHED);
console.log(`pinned (${pushedRev === 'HEAD' ? 'last committed manifest' : `manifest at ${pushedRev}`}, newest ${PUSHED}): ${pushed.slice(0, PUSHED).map((g) => g.id).join(', ') || 'none'}`);
const inside = (rel) => { const p = resolve(dest, rel); return safeRel(rel) && p.startsWith(dest + sep) ? p : null; };
let removed = 0;
for (const rel of P.remove) { const p = inside(rel); if (p && existsSync(p)) { rmSync(p, { force: true }); removed++; } }
const assetsDir = join(dest, 'assets');
if (existsSync(assetsDir)) for (const rel of P.orphans(walk(assetsDir).map((p) => relative(dest, p).split(sep).join('/')))) { const p = inside(rel); if (p) { rmSync(p, { force: true }); removed++; } }
console.log(`\n✓ removed ${removed} file(s) of older builds; keeping ${P.generations.length} generation(s): ${P.generations.map((g) => g.id).join(', ')}`);

// 2) cutover only: keep the old single-file page as legacy.html
if (targetName === 'root' && existsSync(rootIndex) && !isReactRoot(rootIndex)) {
  const legacy = join(repo, 'legacy.html');
  if (existsSync(legacy)) die('legacy.html already exists and index.html is not a React build — resolve by hand');
  renameSync(rootIndex, legacy);
  console.log('✓ old index.html → legacy.html');
}

// 3) copy the new build (without Vite's internal .vite/ manifest dir)
for (const rel of files) { mkdirSync(dirname(join(dest, rel)), { recursive: true }); cpSync(join(dist, rel), join(dest, rel)); }
writeFileSync(manPath, JSON.stringify({ target: targetName, base: target.base, version: 2, keep: P.generations.length - 1, generations: P.generations }, null, 2) + '\n');
console.log(`✓ copied ${files.length} file(s) → ${relative(repo, dest) || '.'}/`);

// 3b) cutover only: /SI/next/ (the migration preview) becomes a tiny redirect to /SI/ keeping query + hash; its builds go
if (targetName === 'root') {
  const nx = join(repo, 'next');
  if (existsSync(nx)) rmSync(nx, { recursive: true, force: true });
  mkdirSync(nx, { recursive: true });
  writeFileSync(join(nx, 'index.html'), readFileSync(join(web, 'redirect', 'next.html')));
  console.log('✓ next/ → redirect page to ../ (query + hash kept; old next/ builds removed)');
}

// 4) .nojekyll at repo root (Pages would otherwise drop files/dirs starting with "_")
const nj = join(repo, '.nojekyll');
if (!existsSync(nj)) { writeFileSync(nj, ''); console.log('✓ created .nojekyll'); }

if (targetName === 'next' && sha(rootIndex) !== rootIndexBefore) die('root index.html changed during a next deploy — this must not happen');
console.log(`\nDone. Review with: git -C "${repo}" status --short   (this script never commits or pushes)`);
