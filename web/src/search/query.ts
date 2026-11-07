/* On-device search over the build-time index. Chinese: substring, then bigram overlap.
   No network after the index is in memory. */
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

const DROP = /[\s·,，.。:：;；!！?？"'“”‘’()（）[\]【】/\\|_-]+/g;
export const norm = (s: string) => s.toLowerCase().replace(DROP, '');
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
