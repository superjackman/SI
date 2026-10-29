export interface TextIssue { k: 'small' | 'clip' | 'cover' | 'wrap' | 'hscroll' | 'cut'; cls: string; txt: string; px?: number; by?: string; why?: string }
/** every visible text on the page that is under `min` px, clipped, covered, scrolled sideways, cut, or badly wrapped */
export function textIssues(min: number): TextIssue[];
