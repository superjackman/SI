/* Regression (r9 hotfix): pre-rendered KaTeX HTML was escaped into a worked-example title on K2 and printed as raw markup.
   Every string in the generated data is parsed as HTML (as the shell will insert it); its visible text, and the text of any
   HTML carried in an attribute, must never contain KaTeX or tag markup. Plain-text fields must carry math as TeX only. */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mathText, strip } from '../../m2/lib';
import { m, M } from '../../m2/tex';

const GEN = join(__dirname, '../../src/legacy/gen');
const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(d, e.name)) : [join(d, e.name)]));
const BAD = /katex|<\/?(span|math|mrow|mi|annotation|semantics|b|i|p|div|sup|sub|code)\b|&lt;|&gt;|&amp;|&quot;|&#x?[0-9a-f]+;/i;

function scanHtml(html: string, where: string, out: string[], depth = 0) {
  const t = document.createElement('template'); t.innerHTML = html;
  const txt = t.content.textContent ?? '';
  const i = txt.search(BAD);
  if (i >= 0) out.push(`${where}: …${txt.slice(Math.max(0, i - 50), i + 50)}…`);
  t.content.querySelectorAll('*').forEach((el) => { for (const a of el.attributes) {
    if (/[<&]/.test(a.value) && depth < 3) scanHtml(a.value, `${where} @${a.name}`, out, depth + 1);
    else if (/katex/.test(a.value) && a.name !== 'class') out.push(`${where} @${a.name}: ${a.value.slice(0, 80)}`);
  } });
}
function walk(v: unknown, where: string, out: string[]) {
  if (typeof v === 'string') { if (/[<&]/.test(v)) scanHtml(v, where, out); else if (/katex/i.test(v)) out.push(`${where}: ${v.slice(0, 80)}`); }
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${where}.${k}`, out);
}

describe('KaTeX never shows as text', () => {
  const json = files(GEN).filter((f) => f.endsWith('.json'));
  it('finds the generated data', () => { expect(json.length).toBeGreaterThan(40); });
  it.each(json.map((f) => [f.slice(GEN.length + 1), f]))('%s: no escaped markup in visible text', (_n, f) => {
    const out: string[] = []; walk(JSON.parse(readFileSync(f, 'utf8')), '', out);
    expect(out).toEqual([]);
  });
  it('K2 worked example title renders its formula as math', () => {
    for (const L of ['zh', 'en']) {
      const t = document.createElement('template'); t.innerHTML = (JSON.parse(readFileSync(join(GEN, `st/K2.${L}.json`), 'utf8')) as { html: string }).html;
      const h = [...t.content.querySelectorAll('.kex-h')].find((e) => /一层线性网络|A linear layer/.test(e.textContent ?? ''));
      expect(h?.querySelector('.katex annotation')?.textContent).toBe('y=Wx');
    }
  });
  it('search.json and outline rows carry math as TeX, once', () => {
    const s = JSON.parse(readFileSync(join(GEN, 'search.json'), 'utf8')) as Record<string, { zh: string; en: string }>;
    expect(s.kChain?.en).toContain("(f\\circ g)'(x)=f'(g(x))\\,g'(x)");
    expect(s.kChain?.en).not.toMatch(/f′|&#/);
  });
  it('mathText / strip turn KaTeX into its TeX source (inline, display, line-broken twins)', () => {
    expect(mathText(`a ${m("x<y'")} b`)).toBe("a x&lt;y&#x27; b");
    expect(strip(`a ${m("x<y'")} b`)).toBe("a x<y' b");
    expect(strip(M('a=b+c=d'))).toContain('a=b+c=d');
    expect(strip(M('a=b+c=d'))).not.toMatch(/[\u200b]|katex|a=b\+c=da=b/);
    expect(strip('<b>x</b> &amp; y')).toBe('x & y');
  });
});
