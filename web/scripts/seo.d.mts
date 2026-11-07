/** R52 SEO restore: static station pages, catalogues, sitemap, robots, 404. */
export const ORIGIN: string;
export function clip(s: string, max: number): string;
export function numsFromSource(web: string): Record<string, { zh: string; en: string; ap: [string, string] | null }>;
export function fillNums(s: string, l: 'zh' | 'en', nums: Record<string, { zh: string; en: string; ap?: [string, string] | null }>): string;
export function stepPhrase(s: string, l: 'zh' | 'en', names: Record<string, string>): string;
export function buildSeo(opts: { web: string; base: string; lastmod?: string | ((k: string) => string) }): Map<string, string>;
