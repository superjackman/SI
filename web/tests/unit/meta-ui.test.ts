import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/** The interface must not explain its own teaching mechanics. */
const BANNED = ['地址不变', '选错会留在这一页', '点一行就进', '不另开窗', '没有弹窗', '还可以再选'];

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(ts|css)$/.test(name) && !p.includes('/tests/')) out.push(p);
  }
  return out;
}

describe('UI copy', () => {
  it('does not describe the lesson mechanics', () => {
    const hits: string[] = [];
    for (const file of files(join(process.cwd(), 'src'))) {
      const text = readFileSync(file, 'utf8');
      for (const phrase of BANNED) if (text.includes(phrase)) hits.push(`${file}: ${phrase}`);
    }
    expect(hits).toEqual([]);
  });
});
