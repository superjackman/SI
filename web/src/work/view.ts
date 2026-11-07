/* Three starter projects a person can finish in the browser. Fixed samples, no model call, no key. */
import './work.css';
import works from './works.json';
import { tx, type L } from '../l4/txt';
import { tx as cx } from '../i18n/L';
import { DV_NM, dvI } from '../dv/links';
import type { PxApi } from '../px/view';
import { ASK0, askStep, fareTests, kbAnswer, KB_Q, NOTES, type AskState, type FareRule } from './run';
import type { Data } from '../l4/share/draw';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
type Item = (typeof works.items)[number];
const find = (id: string) => works.items.find((w) => w.id === id) ?? null;
const bi = (p: readonly [string, string], l: L) => tx(p as [string, string], l);
const stN = (k: string, l: L) => tx(DV_NM[dvI(k)] ?? [k, k], l);

export function workCard(it: Item, l: L, lines: readonly string[], url: string, site: string): Data {
  return {
    site, url, lv: l === 'zh' ? '作品' : 'Project', lvC: 'var(--highlight)', path: '', icon: '✦',
    name: bi([it.zh, it.en], l), idea: bi(it.lead as [string, string], l),
    parts: [], co: '', why: '', head: lines[0] ?? '', badge: '',
    scan: l === 'zh' ? '扫码打开这个作品' : 'Scan to open this project', how: '', whyT: '',
    pts: lines.slice(0, 3), sub: tx(['固定样本，不是联网模型', 'A fixed sample, not a live model'], l),
  };
}

function tabs(i: number, l: L) {
  const names = l === 'zh' ? ['给你的样本', '做完看到', '会失败的一种'] : ['The sample', 'When it works', 'One way it fails'];
  return `<div class="wk-tabs" role="tablist">${names.map((n, k) => `<button type="button" role="tab" data-wk-tab="${k}" aria-selected="${k === i}" class="${k === i ? 'on' : ''}">${esc(n)}</button>`).join('')}</div>`;
}
function stations(it: Item, l: L) {
  const links = it.st.map((k) => `<a href="#D/${esc(k)}">${esc(stN(k, l))}</a>`).join(l === 'zh' ? '、' : ', ');
  return `<p class="wk-st">${l === 'zh' ? '接着可以看' : 'Continue with'} ${links}</p>`;
}
function shell(it: Item, l: L, i: number, body: string) {
  const steps = it.steps.map((s) => `<li>${esc(bi(s as [string, string], l))}</li>`).join('');
  return `<div class="px wk" data-work="${esc(it.id)}" lang="${l === 'en' ? 'en' : 'zh-CN'}">
<p class="wk-note">${esc(bi(it.lead as [string, string], l))}</p>
${tabs(i, l)}
${body}
<section class="wk-steps"><h3>${l === 'zh' ? '步骤' : 'Steps'}</h3><ol>${steps}</ol></section>
${stations(it, l)}
<details class="wk-code"><summary>${l === 'zh' ? '给程序员的代码' : 'Code, if you write programs'}</summary><p>${esc(bi(it.code as [string, string], l))}</p><pre>${esc(codeOf(it.id))}</pre></details>
</div>`;
}
function codeOf(id: string) {
  if (id === 'kb') return 'function match(id) {\n  const q = questions.find((x) => x.id === id);\n  return q && q.note ? notes.find((n) => n.id === q.note) : null;\n}';
  if (id === 'ask') return 'function decide(state, choice) {\n  if (choice === "ask") return { asked: true, sent: false };\n  if (choice === "yes" && state.asked) return { asked: true, sent: true };\n  if (choice === "skip") return { asked: false, sent: true };\n  return state;\n}';
  return 'function fare(km, rule) {\n  if (rule === "bug") return km * 2;\n  if (rule === "wrong") return km * 3;\n  return km <= 1 ? 3 : 3 + (km - 1) * 2;\n}';
}

function kbBody(l: L, qid: string) {
  const { q, note } = kbAnswer(qid);
  const notes = NOTES.map((n) => `<li class="${note?.id === n.id ? 'hit' : ''}"><b>${esc(n.id)}</b> ${esc(l === 'en' ? n.en : n.zh)}</li>`).join('');
  const qs = KB_Q.map((item) => `<button type="button" data-wk-q="${esc(item.id)}" class="${item.id === qid ? 'on' : ''}">${esc(l === 'en' ? item.en : item.zh)}</button>`).join('');
  const ans = q
    ? `<p class="wk-out" data-wk-out="1"><b>${esc(l === 'en' ? q.enA : q.zhA)}</b>${note ? `<span>${l === 'zh' ? '依据纸条' : 'From note'} ${esc(note.id)}：${esc(l === 'en' ? note.en : note.zh)}</span>` : ''}</p>`
    : '';
  return `<section class="wk-sample"><h3>${l === 'zh' ? '纸条' : 'Notes'}</h3><ol class="wk-notes">${notes}</ol></section>
<section><h3>${l === 'zh' ? '选一个问题' : 'Pick a question'}</h3><div class="wk-qs">${qs}</div>${ans}</section>`;
}
function askBody(l: L, s: AskState) {
  const z = (a: string, b: string) => tx([a, b], l);
  const status = s.failed
    ? `<p class="wk-bad" data-wk-out="fail">${esc(z('这一步没有问你，就把样本标成已发出。', 'This path marked the sample sent without asking you.'))}</p>`
    : s.sent
      ? `<p class="wk-ok" data-wk-out="sent">${esc(z('已发出（样本）。', 'Sent (sample).'))}</p>`
      : s.asked
        ? `<p class="wk-ask" data-wk-out="ask">${esc(z('要发给项目组吗？现在还没有发出。', 'Send it to the project group? Nothing has been sent yet.'))}</p>`
        : `<p data-wk-out="wait">${esc(z('还没有问你，也没有发出。', 'It has not asked, and it has not sent anything.'))}</p>`;
  const yes = s.asked && !s.sent ? `<button type="button" data-wk-ask="yes">${esc(z('发给项目组', 'Send it'))}</button><button type="button" data-wk-ask="no">${esc(z('先不发', 'Do not send'))}</button>` : '';
  return `<section class="wk-sample"><h3>${l === 'zh' ? '这件事' : 'The job'}</h3><p>${esc(z('把草稿《周会纪要》发给项目组。', 'Send the draft “Weekly notes” to the project group.'))}</p><p>${esc(z('准备做的动作：发一封邮件，收件人是项目组，标题是周会纪要。', 'Action it would take: send a mail to the project group, titled Weekly notes.'))}</p></section>
<section><div class="wk-qs"><button type="button" data-wk-ask="ask">${esc(z('先问我', 'Ask me first'))}</button><button type="button" data-wk-ask="skip">${esc(z('不问就发', 'Send without asking'))}</button>${yes}</div>${status}</section>`;
}
function fixBody(l: L, rule: FareRule) {
  const z = (a: string, b: string) => tx([a, b], l);
  const rows = fareTests(rule).map((r) => `<li class="${r.ok ? 'ok' : 'bad'}" data-km="${r.km}">${esc(z(`${r.km} 公里`, `${r.km} km`))} → ${r.got} ${r.ok ? '✓' : '✗'} <span>${esc(z(`期望 ${r.want}`, `expected ${r.want}`))}</span></li>`).join('');
  const n = fareTests(rule).filter((r) => r.ok).length;
  return `<section class="wk-sample"><h3>${l === 'zh' ? '规则' : 'Rule'}</h3><p>${esc(z('起步 1 公里 3 元，之后每公里 2 元。', '3 yuan for the first kilometre, then 2 yuan for each kilometre after that.'))}</p></section>
<section><div class="wk-qs"><button type="button" data-wk-fare="bug" class="${rule === 'bug' ? 'on' : ''}">${esc(z('现在的算法', 'As it is'))}</button><button type="button" data-wk-fare="ok" class="${rule === 'ok' ? 'on' : ''}">${esc(z('按规则改', 'Match the rule'))}</button><button type="button" data-wk-fare="wrong" class="${rule === 'wrong' ? 'on' : ''}">${esc(z('每一公里都按 3 元', '3 yuan for every kilometre'))}</button></div>
<ul class="wk-tests" data-pass="${n}">${rows}</ul><p data-wk-out="1">${esc(z(`${n}/2 道对上了。`, `${n}/2 matched.`))}</p></section>`;
}

let tab = 0;
export async function work(id: string, A: PxApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  const wid = id === 'W' ? '' : id.slice(2);
  if (!wid) return list(A);
  const it = find(wid);
  if (!it) { A.host.innerHTML = `<div class="px"><p>${esc(z('没有这个作品。', 'That project is not here.'))}</p></div>`; A.step(null); return; }
  tab = 0;
  A.top(`<b class="l4-tt">${esc(bi([it.zh, it.en], l))}</b>`);
  A.crumb([[z('首页', 'Home'), '#home'], [z('作品', 'Projects'), '#W'], [bi([it.zh, it.en], l), null]]);
  let qid = 'bus', ask: AskState = { ...ASK0 }, rule: FareRule = 'bug';
  const lines = () => {
    if (it.id === 'kb') {
      const { q, note } = kbAnswer(qid);
      const name = q ? (l === 'en' ? q.en : q.zh) : '';
      const ans = q ? (l === 'en' ? q.enA : q.zhA) : '';
      return [name, ans, note ? (l === 'en' ? `Note ${note.id}` : `纸条 ${note.id}`) : (l === 'zh' ? '没有对上的纸条' : 'No note matched')];
    }
    if (it.id === 'ask') return [ask.failed ? z('没有问就标成发出', 'Marked sent without asking') : ask.sent ? z('问过之后发出', 'Sent after asking') : z('还停在问你', 'Still waiting for you'), z('样本，不是真的邮件', 'A sample, not a real mail'), ''];
    const rows = fareTests(rule), n = rows.filter((r) => r.ok).length;
    return [z(`${n}/2 道对上了`, `${n}/2 matched`), rows.map((r) => `${r.km}→${r.got}`).join(' '), rule];
  };
  const paint = () => {
    const body = it.id === 'kb' ? kbBody(l, qid) : it.id === 'ask' ? askBody(l, ask) : fixBody(l, rule);
    const share = `<button type="button" class="l4-b gold" data-wk-share="1">${esc(cx('work.save', l))}</button>`;
    A.host.innerHTML = shell(it, l, tab, body + share);
    A.step({
      n: 3, i: tab, keys: ['1', '2', '3'], txt: z(`作品 ${tab + 1} / 3`, `Project ${tab + 1} / 3`),
      pv: z('上一页', 'Back'), nx: z('下一页', 'Next'),
      prev: tab > 0 ? () => { tab -= 1; paint(); } : '#W',
      next: tab < 2 ? () => { tab += 1; paint(); } : null,
      dot: (k) => { tab = k; paint(); },
    });
    if (A.still()) A.root.dataset.px = `W/${it.id}.${l}`;
  };
  A.host.onclick = (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-wk-tab],[data-wk-q],[data-wk-ask],[data-wk-fare],[data-wk-share]');
    if (!b) return;
    e.stopPropagation();
    if (b.dataset.wkTab) { tab = Number(b.dataset.wkTab); paint(); return; }
    if (b.dataset.wkQ) { qid = b.dataset.wkQ; paint(); return; }
    if (b.dataset.wkAsk) { ask = askStep(ask, b.dataset.wkAsk as 'ask' | 'skip' | 'yes' | 'no'); paint(); return; }
    if (b.dataset.wkFare) { rule = b.dataset.wkFare as FareRule; paint(); return; }
    if (b.dataset.wkShare) {
      const url = `${location.origin}${location.pathname}?lang=${l}#W/${it.id}`;
      void import('../l4/share/modal').then(async (modal) => {
        const D = await import('../l4/share/draw');
        const data = workCard(it, l, lines().filter(Boolean), url, tx(D.SITE_N, l));
        await modal.mountShare(A.root, { l, title: cx('work.save', l), file: `si-work-${it.id}`, data, kind: 'work' });
      });
    }
  };
  paint();
}

function list(A: PxApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  A.top(`<b class="l4-tt">${esc(z('三个作品', 'Three projects'))}</b>`);
  A.crumb([[z('首页', 'Home'), '#home'], [z('作品', 'Projects'), null]]);
  const cards = works.items.map((it) => `<a class="wk-card" href="#W/${esc(it.id)}"><b>${esc(bi([it.zh, it.en], l))}</b><span>${esc(bi(it.expect as [string, string], l))}</span></a>`).join('');
  A.host.innerHTML = `<div class="px wk" data-work="list"><p class="wk-note">${esc(z('三个都能在这页做完。用的是写好的样本，不是联网模型，也不要密钥。', 'All three finish on this page. They use a fixed sample, not a live model, and they ask for no key.'))}</p>${cards}</div>`;
  A.step(null);
  if (A.still()) A.root.dataset.px = `W.${l}`;
}
