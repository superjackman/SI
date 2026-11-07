/* In-app share for one news item or one tool. The picture is the static og card
   (public/og-hub/…); the link is that item's static page, which advertises the same image. */
import { tx, type L } from '../l4/txt';
import { tx as cx } from '../i18n/L';
import type { Data } from '../l4/share/draw';
import { findNews, findTool } from './view';

export const hubRoot = () => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
export function hubPage(kind: 'news' | 'tools', id: string, l: L) {
  return `${hubRoot()}${l === 'en' ? 'en/' : ''}s/${kind}/${id}/`;
}
export function hubImage(kind: 'news' | 'tools', id: string) {
  return `${hubRoot()}og-hub/${kind}/${id}.png`;
}
function pack(site: string, l: L, url: string, lv: string, name: string, idea: string): Data {
  return {
    site, url, lv, lvC: 'var(--highlight)', path: '', icon: '↗', name, idea, parts: [], co: '', why: '',
    head: '', badge: '', scan: l === 'zh' ? '扫码打开这一条' : 'Scan to open this one', how: '', whyT: '',
    pts: [idea], sub: tx(['一层层看懂 AI', 'AI, layer by layer'], l),
  };
}
export async function openItem(host: HTMLElement, l: L, kind: string, id: string) {
  const D = await import('../l4/share/draw');
  const { mountImage } = await import('../l4/share/modal');
  const site = tx(D.SITE_N, l);
  if (kind === 'news') {
    const it = findNews(id); if (!it) return;
    const name = l === 'en' ? it.en : it.zh, url = hubPage('news', id, l);
    await mountImage(host, { l, title: cx('share.item', l), file: `si-news-${id}`, url, image: hubImage('news', id), alt: name, text: `${it.source} ${name}`, kind: 'news', data: pack(site, l, url, it.source, name, `${it.date} · ${it.source}`) });
    return;
  }
  if (kind === 'tools') {
    const t = findTool(id); if (!t) return;
    const blurb = l === 'en' ? t.en : t.zh, url = hubPage('tools', id, l);
    await mountImage(host, { l, title: cx('share.item', l), file: `si-tool-${id}`, url, image: hubImage('tools', id), alt: t.name, text: `${t.name} ${blurb}`, kind: 'tool', data: pack(site, l, url, l === 'zh' ? '工具' : 'Tool', t.name, blurb) });
  }
}
