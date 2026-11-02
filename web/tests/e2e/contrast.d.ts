export interface ContrastIssue { cls: string; txt: string; fg: string; bg: string; r: number }
/** every visible text under `root` whose WCAG contrast against its effective background is below `min` (3 for large text) */
export function contrastIssues(o?: { root?: string; min?: number; icon?: number }): ContrastIssue[];
