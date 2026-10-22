// First-load size of the built app: index.html + every JS/CSS it references directly (lazy chunks excluded).
// Reports raw and gzip -9 bytes; fails when gzip total exceeds the budget (SI_SIZE_BUDGET_KB, default 120 per plan §5).
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = process.argv[2] || join(root, 'dist');
const budgetKB = Number(process.env.SI_SIZE_BUDGET_KB || 120);
const htmlPath = join(dist, 'index.html');
if (!existsSync(htmlPath)) { console.error(`size: ${htmlPath} missing — run the build first`); process.exit(1); }
const html = readFileSync(htmlPath, 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]);
const rows = [['index.html', Buffer.from(html)]];
for (const r of refs) {
  const rel = r.replace(/^.*?\/assets\//, 'assets/');
  rows.push([rel, readFileSync(join(dist, rel))]);
}
let raw = 0, gz = 0;
console.log('first-load file                         raw B     gzip B');
for (const [name, buf] of rows) {
  const g = gzipSync(buf, { level: 9 }).length;
  raw += buf.length; gz += g;
  console.log(`${name.padEnd(36)} ${String(buf.length).padStart(8)} ${String(g).padStart(10)}`);
}
console.log(`${'TOTAL'.padEnd(36)} ${String(raw).padStart(8)} ${String(gz).padStart(10)}   (${(gz / 1024).toFixed(1)} KB gzip, budget ${budgetKB} KB)`);
if (gz > budgetKB * 1024) { console.error('size: first-load gzip over budget'); process.exit(1); }
