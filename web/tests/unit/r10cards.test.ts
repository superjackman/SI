/* R10 gap audit D8–D13: six vendor-free cards on Ub / Uc / Ud, both languages, with verified sources and drill-downs */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { QUIZ_KEY } from '../../src/station/quiz';

const gen = (p: string) => JSON.parse(readFileSync(new URL('../../src/legacy/gen/' + p, import.meta.url), 'utf8')) as { html: string };
const card = (html: string, id: string) => {
  const i = html.indexOf(`id="${id}"`); expect(i, id).toBeGreaterThan(0);
  const j = html.indexOf('<div class="card', i + 10);
  return html.slice(i, j < 0 ? undefined : j);
};
const CARDS: [string, string, string[], string[]][] = [
  // station, card id, drill-down targets, source hosts
  ['Uc', 'c_Uc_4', ['T2'], ['modelcontextprotocol.io/specification/2025-11-25']],
  ['Uc', 'c_Uc_5', ['T5'], ['ollama.com/', 'docs.ollama.com/api/openai-compatibility', 'github.com/ggml-org/llama.cpp']],
  ['Ub', 'c_Ub_5', ['T2'], ['arxiv.org/abs/2503.13657', 'anthropic.com/research/multi-agent-research-system']],
  ['Ub', 'c_Ub_6', [], ['anthropic.com/research/multi-agent-research-system']],
  ['Ub', 'c_Ub_7', [], ['anthropic.com/research/building-effective-agents']],
  ['Ud', 'c_Ud_5', [], ['anthropic.com/research/multi-agent-research-system']],
];

describe('R10 D8–D13 cards', () => {
  for (const L of ['zh', 'en'] as const) for (const [S, id, dds, hosts] of CARDS) {
    it(`${S}.${L} ${id}: present, sourced, drill-downs at the top`, () => {
      const c = card(gen(`st/${S}.${L}.json`).html, id);
      expect(c).toContain('class="k-src"');
      for (const h of hosts) expect(c).toContain(`href="https://${h.startsWith('github') || h.startsWith('arxiv') || h.startsWith('modelcontext') || h.startsWith('docs.') || h.startsWith('ollama') ? '' : 'www.'}${h}`);
      const ddAt = c.indexOf('m-ddrow');
      if (dds.length) {
        expect(ddAt).toBeGreaterThan(0);
        expect(ddAt).toBeLessThan(c.indexOf('<p')); // the drill-down row comes before the first paragraph
        for (const s of dds) expect(c).toContain(`data-ddgo="${s}"`);
      } else expect(ddAt).toBe(-1);
      expect(c.replace(/<[^>]+>/g, ' ')).not.toMatch(/\b(Anthropic|OpenAI|Ollama|llama\.cpp|ChatDev)\b/);
    });
  }
  it('D13 opens the T5 parts it relies on, D8 the T2 safety parts', () => {
    for (const L of ['zh', 'en'] as const) {
      const u5 = card(gen(`st/Uc.${L}.json`).html, 'c_Uc_5'), u4 = card(gen(`st/Uc.${L}.json`).html, 'c_Uc_4');
      for (const p of ['quant', 'kvcache']) expect(u5).toContain(`data-open="${p}"`);
      for (const p of ['mcphost', 'mcpserver', 'perm', 'inject']) expect(u4).toContain(`data-open="${p}"`);
      expect(u4.match(/<li>/g)!.length).toBe(6);
    }
  });
  it('D10 is a five-step flow with one loop step; D11 shows the same task both ways', () => {
    for (const L of ['zh', 'en'] as const) {
      const html = gen(`st/Ub.${L}.json`).html, f = card(html, 'c_Ub_6');
      expect(f.match(/<ol class="u-flow">/g)!.length).toBe(1);
      expect((f.split('<ol class="u-flow">')[1]!.split('</ol>')[0]!.match(/<li/g) ?? []).length).toBe(5);
      expect(f.match(/uf-loop/g)!.length).toBe(1);
      expect(card(html, 'c_Ub_7').match(/<div><b>/g)!.length).toBe(2);
      expect(card(html, 'c_Ub_7')).toContain('class="tag demo tag-s"'); // the example task carries the 示意 badge
    }
  });
  it('quiz: Ub 7, Uc 6, Ud 5 questions', () => {
    expect([QUIZ_KEY.Ub!.length, QUIZ_KEY.Uc!.length, QUIZ_KEY.Ud!.length]).toEqual([7, 6, 5]);
  });
});
