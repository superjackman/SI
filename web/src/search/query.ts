/* On-device search over the build-time index. Chinese: substring, then bigram overlap.
   A short Latin abbreviation matches a whole word or a prefix, not a 2-letter fragment.
   Reviewed aliases live in alias.json. No network after the index is in memory. */
import aliasFile from './alias.json';

export type Kind = 'st' | 'card' | 'news' | 'tool';
export interface Entry {
  kind: Kind;
  id: string;
  zh: string;
  en: string;
  z: string;
  e: string;
  hash: string;
}
export interface Hit extends Entry { score: number }

const ALIAS = aliasFile as Record<string, string[]>;
export const aliasOf = (e: { kind: string; id: string }): string[] => ALIAS[`${e.kind}:${e.id}`] ?? [];

const DROP = /[\s·,，.。:：;；!！?？"'“”‘’()（）[\]【】/\\|_-]+/g;
export const norm = (s: string) => s.toLowerCase().replace(DROP, '');
const latinWords = (s: string): string[] => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
/** RAG / LLM / BPE: whole word or (3+ letters) prefix. Two-letter fragments do not fuzzy-match. */
const abbrevQuery = (q: string, n: string) => n.length >= 2 && n.length <= 6 && /^[a-z0-9]+$/.test(n) && !/[\u3400-\u9fff]/.test(q);

export type WhyKind = 'id' | 'title' | 'alias' | 'prefix' | 'body';
export function whyOf(e: Entry, q: string): { k: WhyKind; alias?: string } {
  const n = norm(q);
  const alias = aliasOf(e).find((a) => norm(a) === n || latinWords(a).includes(n));
  if (abbrevQuery(q, n)) {
    if (norm(e.id) === n || latinWords(e.id).includes(n)) return { k: 'id' };
    if (latinWords(`${e.zh} ${e.en}`).includes(n)) return { k: 'title' };
    if (alias) return { k: 'alias', alias };
    if (n.length >= 3 && latinWords(`${e.zh} ${e.en} ${aliasOf(e).join(' ')}`).some((w) => w.startsWith(n) && w.length > n.length)) return { k: 'prefix' };
    return { k: 'body' };
  }
  if (norm(`${e.zh}\n${e.en}`).includes(n)) return { k: 'title' };
  const named = aliasOf(e).find((a) => norm(a) === n || norm(a).includes(n));
  if (named) return { k: 'alias', alias: named };
  return { k: 'body' };
}

function scoreAbbrev(e: Entry, n: string): number {
  const alias = aliasOf(e);
  const titleW = latinWords(`${e.zh} ${e.en}`);
  const bodyW = latinWords(`${e.z} ${e.e} ${e.id}`);
  const aliasW = latinWords(alias.join(' '));
  if (latinWords(e.id).includes(n) || norm(e.id) === n) return 200;
  if (titleW.includes(n)) return 80;
  if (aliasW.includes(n)) return 70;
  if (bodyW.includes(n)) return 40;
  if (n.length >= 3) {
    if (titleW.some((w) => w.startsWith(n) && w.length > n.length)) return 60;
    if (aliasW.some((w) => w.startsWith(n) && w.length > n.length)) return 55;
    if (bodyW.some((w) => w.startsWith(n) && w.length > n.length)) return 25;
  }
  return 0;
}
export function bigrams(s: string): string[] {
  const t = norm(s);
  if (t.length < 2) return [];
  const o: string[] = [];
  for (let i = 0; i < t.length - 1; i++) o.push(t.slice(i, i + 1 + 1));
  return o;
}

/** higher is better; 0 means leave it out */
export function scoreOf(e: Entry, q: string): number {
  const n = norm(q);
  if (!n) return 0;
  if (abbrevQuery(q, n)) return scoreAbbrev(e, n);
  const title = norm(`${e.zh}\n${e.en}`);
  const body = norm(`${e.z}\n${e.e}\n${e.id}`);
  let s = 0;
  if (norm(e.id) === n) s += 200;
  if (title.includes(n)) s += 80;
  else if (body.includes(n)) s += 40;
  const grams = bigrams(n);
  if (grams.length) {
    const hay = title + body;
    let hit = 0;
    for (const g of grams) if (hay.includes(g)) hit++;
    const r = hit / grams.length;
    if (r >= 0.5) s += Math.round(r * 30);
  }
  for (const a of aliasOf(e)) {
    const an = norm(a);
    if (!an) continue;
    if (an === n) s += 70;
    else if (n.length >= 2 && an.includes(n)) s += 40;
  }
  return s;
}

const RANK: Record<Kind, number> = { st: 0, card: 1, news: 2, tool: 3 };

export function search(rows: readonly Entry[], q: string, limit = 12): Hit[] {
  const n = norm(q);
  if (!n) return [];
  const hits: Hit[] = [];
  for (const e of rows) {
    const score = scoreOf(e, q);
    if (score > 0) hits.push({ ...e, score });
  }
  hits.sort((a, b) => b.score - a.score || RANK[a.kind] - RANK[b.kind] || a.zh.localeCompare(b.zh, 'zh'));
  return hits.slice(0, limit);
}

const GROUP: Kind[] = ['st', 'card', 'tool', 'news'];
/** First-page hits, kept in score order inside each group. */
export function grouped(hits: readonly Hit[]): { kind: Kind; hits: Hit[] }[] {
  return GROUP.map((kind) => ({ kind, hits: hits.filter((h) => h.kind === kind) })).filter((g) => g.hits.length);
}
