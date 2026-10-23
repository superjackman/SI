/* R15 plain-language layer: the shape of one station's plain texts and symbol contexts (see m2/plain/index.ts) */
import type { Bi } from '../lib';

/** one card: a kid-plain opening (HTML, zh + en). The card's existing text moves into a closed "Go deeper" section, unless
    keep (interactive cards that must stay usable) or the card is a lab (the plain line goes under the lab title). */
export type PCard = { zh: string; en: string; more?: Bi; keep?: true };
/** what a letter / Greek letter / symbol means here: a meaning, or '=key' to borrow a glossary entry (v:e → '=euler') */
/** a meaning may carry its own reading r when the glossary reading would mislead here */
export type Ctx = Record<string, (Bi & { r?: Bi }) | string>;
export type PStation = {
  /** in this station a bare d is the "tiny change" d (dx, d/dx), not a letter */
  d?: boolean;
  cards: Record<string, PCard>;
  /** '*' applies to the whole station, a card id to that card (and wins) */
  ctx?: Record<string, Ctx>;
};
export const B = (zh: string, en: string): Bi => ({ zh, en });
