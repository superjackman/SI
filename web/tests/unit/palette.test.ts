/* No hex outside the palette file unless that exact color is defined there. */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const TOKEN = path.join(SRC, 'theme/tokens.css');
const hexes = (s: string) => s.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
const norm = (h: string) => {
  let x = h.slice(1).toLowerCase();
  if (x.length === 3 || x.length === 4) x = [...x.slice(0, 3)].map((c) => c + c).join('') + (x.length === 4 ? (x[3] ?? '') + (x[3] ?? '') : '');
  return '#' + x.slice(0, 6);
};

describe('palette', () => {
  it('every hex outside tokens.css is one of the palette colors', () => {
    const allow = new Set(hexes(fs.readFileSync(TOKEN, 'utf8')).map(norm));
    const bad: string[] = [];
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        if (fs.statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.(css|ts|tsx|json)$/.test(name) || p === TOKEN) continue;
        const text = fs.readFileSync(p, 'utf8').replace(/\{#[a-z0-9]+\}/gi, '');
        hexes(text).forEach((h) => { if (!allow.has(norm(h))) bad.push(`${path.relative(SRC, p)} ${h}`); });
      }
    };
    walk(SRC);
    expect(bad.slice(0, 40)).toEqual([]);
    expect(bad.length).toBe(0);
  });
});
