import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { CHANNELS, channelURL, inWeChat, shareURL } from '../../src/share/url';
import { qrMatrix, qrRGBA } from '../../src/share/qr';
import { eventFor, isLocalHost } from '../../src/analyticsEvents';
import { CODES } from '../../src/i18n/codes';

const loc = (search: string, hash: string) => ({ origin: 'https://superjackman.github.io', pathname: '/SI/', search, hash });

describe('R16 share URL', () => {
  it('keeps the hash route (station / card), sets ?lang to the current language, drops our cache tokens', () => {
    expect(shareURL(loc('?v=abc&_r=1', '#T3'), 'en', { station: 'T3' })).toBe('https://superjackman.github.io/SI/?lang=en#T3');
    expect(shareURL(loc('?lang=en&utm=x', '#T5&lang=en'), 'zh', { station: 'T5', node: 'labGradCheck' })).toBe('https://superjackman.github.io/SI/?utm=x&lang=zh#T5/labGradCheck');
    expect(shareURL(loc('', '#K3/c_K3_2'), 'zh')).toBe('https://superjackman.github.io/SI/?lang=zh#K3/c_K3_2');
    expect(shareURL(loc('', '#T2&lang=en'), 'en')).toBe('https://superjackman.github.io/SI/?lang=en#T2');
    expect(shareURL(loc('', ''), 'zh')).toBe('https://superjackman.github.io/SI/?lang=zh');
  });
  it('channel links use the documented formats and encode url + title', () => {
    const u = 'https://superjackman.github.io/SI/?lang=zh#T3', t = '大模型 · 大白话拆解 AI', d = 'desc & more';
    const e = encodeURIComponent;
    const want: Record<string, string> = {
      weibo: `https://service.weibo.com/share/share.php?url=${e(u)}&title=${e(t)}`,
      qq: `https://connect.qq.com/widget/shareqq/index.html?url=${e(u)}&title=${e(t)}&summary=${e(d)}`,
      qzone: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${e(u)}&title=${e(t)}&summary=${e(d)}`,
      x: `https://x.com/intent/tweet?text=${e(t)}&url=${e(u)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(u)}`,
      telegram: `https://t.me/share/url?url=${e(u)}&text=${e(t)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${e(u)}`,
      whatsapp: `https://wa.me/?text=${e(t + ' ' + u)}`,
      email: `mailto:?subject=${e(t)}&body=${e(d + '\n\n' + u)}`,
    };
    expect(CHANNELS).toEqual(Object.keys(want));
    for (const ch of CHANNELS) {
      const s = channelURL(ch, u, t, d);
      expect(s).toBe(want[ch]);
      expect(s).not.toMatch(/[ #]/); // the hash route is encoded, never cut off
    }
    expect(new URL(channelURL('facebook', u, t, d)).searchParams.get('u')).toBe(u);
  });
  it('WeChat in-app browser detection', () => {
    expect(inWeChat('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.47(0x18002f2f) NetType/WIFI Language/zh_CN')).toBe(true);
    expect(inWeChat('Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537.36')).toBe(false);
  });
  it('the locally generated QR code decodes back to the exact share URL', () => {
    for (const u of ['https://superjackman.github.io/SI/?lang=zh#T5/labGradCheck', 'https://superjackman.github.io/SI/?utm=x&lang=en#K3/c_K3_2']) {
      const m = qrMatrix(u), q = qrRGBA(m, 4);
      expect(m.length).toBeGreaterThan(20);
      expect(jsQR(q.data, q.w, q.w)?.data).toBe(u);
    }
  });
  it('analytics: share clicks map to share-<channel>; local / LAN hosts are excluded', () => {
    document.body.innerHTML = '<div id="sharePanel"><a id="a" data-share-ch="weibo"><i id="ai">微</i></a><button id="c" data-share-ch="copy">c</button></div>';
    const ev = (id: string) => { const e = new Event('click', { bubbles: true }); Object.defineProperty(e, 'target', { value: document.getElementById(id) }); return e; };
    expect(eventFor(ev('ai'))).toBe('share-weibo');
    expect(eventFor(ev('c'))).toBe('share-copy');
    for (const h of ['localhost', '127.0.0.1', '[::1]', '192.168.1.20', '10.0.0.5', '172.20.3.4', '169.254.1.1', 'my-mac.local', '0.0.0.0']) expect(isLocalHost(h)).toBe(true);
    for (const h of ['superjackman.github.io', 'si.test', '172.32.0.1', '11.0.0.1']) expect(isLocalHost(h)).toBe(false);
  });
  it('shared strings are bilingual', () => {
    for (const k of ['share.title', 'share.copied', 'share.copyManual', 'upd.banner'] as const) { expect(CODES[k].zh).toBeTruthy(); expect(CODES[k].en).toBeTruthy(); }
  });
});
