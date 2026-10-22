// GitHub-Pages-like static server for tests: serves a directory (default: the repo root) under /SI/ on 127.0.0.1.
// Like Pages: directory → index.html, /SI/next → 301 /SI/next/, HTML with Cache-Control max-age=600, 404 otherwise.
// Usage: node scripts/pages-serve.mjs [--root ..] [--port 4173] [--prefix /SI/]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const root = resolve(arg('root', new URL('../..', import.meta.url).pathname)), port = +arg('port', '4173'), prefix = arg('prefix', '/SI/');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
createServer((req, res) => {
  const u = new URL(req.url || '/', 'http://x');
  let p = decodeURIComponent(u.pathname);
  if (p + '/' === prefix) { res.writeHead(301, { Location: prefix + u.search }); return res.end(); }
  if (!p.startsWith(prefix)) { res.writeHead(404); return res.end('not found'); }
  const rel = normalize(p.slice(prefix.length));
  if (rel.split(sep).some((s) => s === '..' || (s.startsWith('.') && s !== '.'))) { res.writeHead(404); return res.end('not found'); }
  let f = join(root, rel);
  if (existsSync(f) && statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + u.search }); return res.end(); }
    f = join(f, 'index.html');
  }
  if (!existsSync(f) || !statSync(f).isFile() || f.split(sep).includes('web')) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' });
  res.end(readFileSync(f));
}).listen(port, '127.0.0.1', () => console.log(`pages-serve ${root} at http://127.0.0.1:${port}${prefix}`));
