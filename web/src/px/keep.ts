/* 我的: this week's real record, and a progress code that can move to another browser.
   Import validates first. A bad code does not write. A good code waits for a confirm before it overwrites. */
import './keep.css';
import { tx as cx } from '../i18n/L';
import type { L } from '../l4/txt';
import { tx } from '../l4/txt';
import { apply, decode, encode } from './code';
import { stName, weekModel } from './week';
import type { Data } from '../l4/share/draw';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const glue = (s: string) => esc(s).replace(/([^<]{4})$/, '<span class="nw">$1</span>');

export function keepHtml(l: L): string {
  const m = weekModel(), z = (n: number, u: 'week.unitStop' | 'week.unitTry' | 'week.unitDay') => `${n} ${cx(u, l)}`;
  const names = m.mastered.map((k) => stName(k, l)).join(l === 'en' ? ', ' : '、');
  const next = `${cx('week.next', l)} · ${stName(m.next, l)}`;
  const body = m.empty
    ? `<p>${glue(cx('week.empty', l))}</p><button type="button" class="l4-b gold" data-go="#D/${esc(m.next)}">${esc(next)}</button>`
    : `<ul class="px-wk-l"><li><b>${esc(cx('week.master', l))}</b> ${esc(m.mastered.length ? `${z(m.mastered.length, 'week.unitStop')} · ${names}` : cx('week.noneMaster', l))}</li><li><b>${esc(cx('week.practice', l))}</b> ${esc(z(m.practice, 'week.unitTry'))}</li><li><b>${esc(cx('week.streak', l))}</b> ${esc(z(m.streak, 'week.unitDay'))}</li><li><button type="button" class="l4-b" data-go="#D/${esc(m.next)}">${esc(next)}</button></li></ul>`;
  return `<section class="px-keep px-wk" data-week="${m.empty ? 'empty' : 'on'}"><h3>${esc(cx('week.title', l))}</h3>${body}<button type="button" class="l4-b" data-wk="share">${esc(cx('week.share', l))}</button></section>
<section class="px-keep px-bak"><h3>${esc(cx('code.title', l))}</h3><p>${glue(cx('code.lead', l))}</p>
<div class="px-row"><button type="button" class="l4-b" data-code="copy">${esc(cx('code.copy', l))}</button><button type="button" class="l4-b" data-code="file">${esc(cx('code.file', l))}</button></div>
<label class="px-lab">${glue(cx('code.paste', l))}<textarea class="px-code-in" data-code="in" rows="3" spellcheck="false" autocomplete="off"></textarea></label>
<div class="px-row"><button type="button" class="l4-b gold" data-code="imp">${esc(cx('code.import', l))}</button><button type="button" class="l4-b" data-code="filepick">${esc(cx('code.pick', l))}</button></div>
<input type="file" data-code="pick" accept="text/plain,.txt,.json" hidden>
<div class="px-ask" data-code="ask" hidden><b>${esc(cx('code.ask', l))}</b><p>${glue(cx('code.askP', l))}</p><div class="px-row"><button type="button" class="l4-b" data-code="no">${esc(cx('ui.cancel', l))}</button><button type="button" class="l4-b gold" data-code="yes">${esc(cx('code.yes', l))}</button></div></div>
<p class="px-msg" data-code="msg" role="status"></p><textarea class="px-code-out" data-code="out" rows="3" readonly hidden></textarea></section>`;
}

function shareData(l: L, url: string, site: string): Data {
  const m = weekModel(), names = m.mastered.map((k) => stName(k, l));
  const line = m.empty
    ? cx('week.empty', l)
    : `${cx('week.master', l)} ${m.mastered.length} · ${cx('week.practice', l)} ${m.practice} · ${cx('week.streak', l)} ${m.streak}`;
  const pts = m.empty
    ? [cx('week.empty', l), `${cx('week.next', l)} · ${stName(m.next, l)}`]
    : [names.length ? names.join(l === 'en' ? ', ' : '、') : cx('week.noneMaster', l), `${cx('week.practice', l)} ${m.practice}`, `${cx('week.next', l)} · ${stName(m.next, l)}`];
  return {
    site, url, lv: cx('week.title', l), lvC: '#c99a2e', path: '', icon: '✦', name: cx('week.title', l), idea: line,
    parts: [], co: '', why: '', head: line, badge: '', scan: l === 'zh' ? '扫码打开我的' : 'Scan to open Me', how: '', whyT: '',
    pts: pts.slice(0, 3), sub: tx(['一层层看懂 AI', 'AI, layer by layer'], l),
  };
}

let lang: L = 'zh', rootEl: HTMLElement | null = null;
const wired = new WeakSet<HTMLElement>();
export function wireKeep(host: HTMLElement, l: L, root: HTMLElement) {
  lang = l; rootEl = root;
  if (wired.has(host)) return;
  wired.add(host);
  let pending: Record<string, string> | null = null;
  const say = (s: string) => { const msg = host.querySelector<HTMLElement>('[data-code="msg"]'); if (msg) msg.textContent = s; };
  const showAsk = (on: boolean) => { const ask = host.querySelector<HTMLElement>('[data-code="ask"]'); if (ask) ask.hidden = !on; if (!on) pending = null; };
  const consider = (text: string) => {
    const r = decode(text);
    if (!r.ok) { showAsk(false); say(cx('code.bad', lang)); return; }
    pending = r.data; showAsk(true); say('');
  };
  host.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-wk],[data-code]'); if (!b || !rootEl) return;
    const l0 = lang;
    if (b.dataset.wk === 'share') {
      e.stopPropagation();
      const url = `${location.origin}${location.pathname}?lang=${l0}#R`;
      void import('../l4/share/modal').then(async (modal) => {
        const D = await import('../l4/share/draw');
        await modal.mountShare(rootEl!, { l: l0, title: cx('week.share', l0), file: 'si-week', data: shareData(l0, url, tx(D.SITE_N, l0)), kind: 'week' });
      });
      return;
    }
    const c = b.dataset.code; if (!c || c === 'pick') return;
    e.stopPropagation();
    if (c === 'filepick') { host.querySelector<HTMLInputElement>('[data-code="pick"]')?.click(); return; }
    if (c === 'copy' || c === 'file') {
      const code = encode(), out = host.querySelector<HTMLTextAreaElement>('[data-code="out"]');
      if (out) { out.hidden = false; out.value = code; }
      if (c === 'copy') {
        const clip = navigator.clipboard?.writeText(code);
        if (clip) void clip.then(() => say(cx('code.copied', l0)), () => say(cx('code.copied', l0)));
        else say(cx('code.copied', l0));
      } else {
        const blob = new Blob([code], { type: 'text/plain' }), url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'si-progress.txt'; document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url); say(cx('code.copied', l0));
      }
      return;
    }
    if (c === 'imp') { consider(host.querySelector<HTMLTextAreaElement>('[data-code="in"]')?.value ?? ''); return; }
    if (c === 'no') { showAsk(false); say(''); return; }
    if (c === 'yes') {
      const data = pending;
      if (!data || !apply(data)) { showAsk(false); say(cx('code.bad', l0)); return; }
      say(cx('code.done', l0));
      location.reload();
    }
  });
  host.addEventListener('change', (e) => {
    const inp = e.target as HTMLInputElement;
    if (inp.dataset?.code !== 'pick') return;
    const f = inp.files?.[0]; if (!f) return;
    void f.text().then((text) => { const box = host.querySelector<HTMLTextAreaElement>('[data-code="in"]'); if (box) box.value = text; consider(text); });
  });
}
