export interface SearchEntry {
  kind: 'st' | 'card' | 'news' | 'tool' | 'work';
  id: string;
  zh: string;
  en: string;
  z: string;
  e: string;
  hash: string;
}
export function buildSearch(web: string): SearchEntry[];
