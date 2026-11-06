/** drop internal card ids and “同一张卡” notes from prose a reader sees */
export function stripIds(s: string): string {
  return s
    .replace(/[（(][^）)]{0,40}(?:KM|KA|KB|KC|K)\d{2}[^）)]{0,20}[）)]/g, '')
    .replace(/(?:KM|KA|KB|KC|K)\d{2}\s*卡同一例/g, '')
    .replace(/(?:KM|KA|KB|KC|K)\d{2}\s*卡/g, '')
    .replace(/卡上同一个例子（同一组数）/g, '同一组数')
    .replace(/卡同一例/g, '')
    .replace(/卡同一组/g, '同一组')
    .replace(/\bK(?:M|[ABC])?\d{2}\b/g, '')
    .replace(/same as card/gi, '')
    .replace(/[（(]\s*[）)]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([，。；：])/g, '$1')
    .trim();
}
