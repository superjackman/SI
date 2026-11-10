/* One clip per station, per language. Missing languages fall back to Chinese.
   Files live at videos/<lang>/<key>.mp4 next to the site, with a matching .vtt and .jpg. */
import have from './clips.json';

export type ClipLang = 'zh' | 'en';

const HAVE: Record<string, readonly string[]> = have;

export function clipFor(key: string, lang: ClipLang, base: string) {
  const list = (l: string) => HAVE[l]?.includes(key);
  const use: ClipLang | '' = list(lang) ? lang : list('zh') ? 'zh' : '';
  if (!use) return null;
  const root = `${base}videos/${use}/${key}`;
  return {
    src: `${root}.mp4`,
    vtt: `${root}.vtt`,
    poster: `${root}.jpg`,
    srclang: use,
    label: use === 'en' ? 'English' : '中文',
  };
}

export function clipHtml(key: string, lang: ClipLang, base: string): string {
  const c = clipFor(key, lang, base);
  if (!c) return '';
  const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
  const name = lang === 'en' ? 'What this stop is saying' : '这一站在说什么';
  return `<figure class="ly-clip"><video controls preload="none" poster="${esc(c.poster)}" aria-label="${esc(name)}"><source src="${esc(c.src)}" type="video/mp4"><track kind="subtitles" src="${esc(c.vtt)}" srclang="${c.srclang}" label="${esc(c.label)}" default></video></figure>`;
}
