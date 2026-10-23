/* R16 share: the URL to share and the one-tap channel links (pure; unit-tested).
   Channel URL formats, checked against the providers' docs / long-standing public references (Oct 2026):
   - 微博  service.weibo.com/share/share.php?url=&title=          (Weibo share component parameters; pic optional)
   - QQ    connect.qq.com/widget/shareqq/index.html?url=&title=&summary=   (QQ Connect "分享组件")
   - QQ空间 sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=&title=&summary=
   - X     x.com/intent/tweet?text=&url=                         (X Web Intent; twitter.com/intent/tweet redirects)
   - Facebook www.facebook.com/sharer/sharer.php?u=
   - Telegram t.me/share/url?url=&text=                          (core.telegram.org/widgets/share)
   - LinkedIn www.linkedin.com/sharing/share-offsite/?url=       (only url; title/description come from og: tags)
   - WhatsApp wa.me/?text=                                        (faq.whatsapp.com "click to chat", text pre-filled)
   - e-mail  mailto:?subject=&body=                               (RFC 6068)
   WeChat has no web share URL: inside WeChat the user shares from the top-right ··· menu; elsewhere a QR code is
   scanned with WeChat. The WeChat JS-SDK (custom share cards) needs server-side signing and is deliberately not used. */
export type Ch = 'weibo' | 'qq' | 'qzone' | 'x' | 'facebook' | 'telegram' | 'linkedin' | 'whatsapp' | 'email';
export const CHANNELS: Ch[] = ['weibo', 'qq', 'qzone', 'x', 'facebook', 'telegram', 'linkedin', 'whatsapp', 'email'];

type Loc = { origin: string; pathname: string; search: string; hash: string };
const OURS = /^(_r|v|lang)=/i;
/** the current page to share: same path and hash route (#station or #station/card-or-part), query without our cache
    tokens (_r, v), and ?lang=<current language> so the receiver sees the same language */
export function shareURL(loc: Loc, lang: string, route?: { station: string; node?: string | null }): string {
  const q = loc.search.replace(/^\?/, '').split('&').filter((p) => p && !OURS.test(p));
  q.push('lang=' + lang);
  let h = loc.hash;
  if (route) h = '#' + route.station + (route.node ? '/' + route.node : '');
  else h = h.replace(/([&?;])lang=[^&?;#]*/gi, '').replace(/^#lang=[^&?;#]*[&?;]?/i, '#');
  return loc.origin + loc.pathname + '?' + q.join('&') + (h === '#' ? '' : h);
}
const e = encodeURIComponent;
/** one-tap share link for a channel */
export function channelURL(ch: Ch, url: string, title: string, desc: string): string {
  switch (ch) {
    case 'weibo': return `https://service.weibo.com/share/share.php?url=${e(url)}&title=${e(title)}`;
    case 'qq': return `https://connect.qq.com/widget/shareqq/index.html?url=${e(url)}&title=${e(title)}&summary=${e(desc)}`;
    case 'qzone': return `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${e(url)}&title=${e(title)}&summary=${e(desc)}`;
    case 'x': return `https://x.com/intent/tweet?text=${e(title)}&url=${e(url)}`;
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`;
    case 'telegram': return `https://t.me/share/url?url=${e(url)}&text=${e(title)}`;
    case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`;
    case 'whatsapp': return `https://wa.me/?text=${e(title + ' ' + url)}`;
    case 'email': return `mailto:?subject=${e(title)}&body=${e(desc + '\n\n' + url)}`;
  }
}
/** WeChat's in-app browser (also its mini-program web-view); WeCom (wxwork) is WeChat-like too */
export const inWeChat = (ua: string) => /MicroMessenger/i.test(ua);
