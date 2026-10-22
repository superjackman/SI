// The quiz card in each station snapshot (st/<S>.<lang>.json) is rendered by the app (src/station/quiz.ts) from the
// shared quiz.<lang>.json chunk, so the pre-rendered copy the live snapshot carries is dropped: the card keeps its own
// tag and attributes, its children go. extract.mjs does the same on the DOM; this script applies it to existing files.
// Usage: node scripts/legacy/strip-quiz.mjs [dir]   (idempotent)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function stripQuiz(html) {
  const m = /<div class="card quiz[^"]*" id="quiz[A-Za-z0-9]+"[^>]*>/.exec(html);
  if (!m) return html;
  const start = m.index + m[0].length;
  const re = /<div\b|<\/div>/g; re.lastIndex = start;
  let depth = 1, x;
  while ((x = re.exec(html))) { depth += x[0] === '</div>' ? -1 : 1; if (!depth) return html.slice(0, start) + html.slice(x.index); }
  throw new Error('unbalanced quiz card');
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] ?? new URL('../../src/legacy/gen/st/', import.meta.url).pathname;
  for (const f of readdirSync(dir).filter((f) => /^[A-Za-z0-9]+\.(zh|en)\.json$/.test(f))) {
    const p = join(dir, f), o = JSON.parse(readFileSync(p, 'utf8')), before = o.html.length;
    o.html = stripQuiz(o.html);
    writeFileSync(p, JSON.stringify(o) + '\n');
    console.log(`${f}: ${before} → ${o.html.length} chars`);
  }
}
