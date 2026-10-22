// Tiny static server used by the legacy extraction tools: serves ONE file at /SI/index.html on 127.0.0.1 (no network, analytics off on localhost).
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
export function serveFile(file) {
  const body = readFileSync(file);
  return new Promise((res) => {
    const srv = createServer((req, rsp) => {
      const p = (req.url || '/').split('?')[0];
      if (p === '/SI/index.html' || p === '/SI/') { rsp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rsp.end(body); }
      else { rsp.writeHead(404); rsp.end(); }
    }).listen(0, '127.0.0.1', () => res({ url: `http://127.0.0.1:${srv.address().port}/SI/index.html`, close: () => srv.close() }));
  });
}
