// R16: build id = content hash of everything that goes into the bundle (sources, page shell, lockfile, build config).
// Same inputs → same id, so a rebuild of unchanged content never makes open tabs reload. Written to dist/version.json
// and embedded in the bundle as __SI_BUILD__; the idle check (src/boot/version.ts) compares the two.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const walk = (d, out = []) => { for (const n of readdirSync(d).sort()) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
/** @param {string} web the web/ directory @param {string} base the Vite base (part of the id: /SI/ and /SI/next/ builds differ) */
export function buildId(web, base = '') {
  const h = createHash('sha256').update('base:' + base + '\n');
  const files = [...walk(join(web, 'src')), ...['index.html', 'package-lock.json', 'vite.config.ts', 'base.config.mjs', 'scripts/build-id.mjs'].map((f) => join(web, f)).filter(existsSync)];
  for (const f of files) h.update(relative(web, f).split(sep).join('/') + '\0').update(readFileSync(f)).update('\0');
  return h.digest('hex').slice(0, 12);
}
/** the file the site serves at its root */
export const versionJson = (id) => JSON.stringify({ id }) + '\n';
