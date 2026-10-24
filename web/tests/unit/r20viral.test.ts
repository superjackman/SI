/* R20 "worth passing on": challenge / lab-setup link formats and their tamper checks, text cleaning, control clamping,
   the progress + certificate rule, the lab setup round trip on real controls, the landing read + strip, the prompt
   limits and the named analytics events. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanText, encodeCh, decodeCh, CH_ORDER, encodeLab, decodeLab, clampVal, withParam, NICK_MAX, LAB_MAX } from '../../src/viral/codec';
import { progress, stopQuiz, doneDate, fmtDate, PASS } from '../../src/viral/prog';
import { labVals, applyLab, land, challenge, canNudge } from '../../src/viral/late';
import { challengeURL } from '../../src/viral/cards';
import { shareURL, withFrom } from '../../src/share/url';
import { eventFor } from '../../src/analyticsEvents';
import { TABORDER } from '../../src/legacy/kb';
import { QUIZ_KEY } from '../../src/station/quiz';

const loc = (search: string, hash: string) => ({ origin: 'https://superjackman.github.io', pathname: '/SI/', search, hash });
const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const allRight = () => { const a: Record<string, number> = {}; for (const [S, k] of Object.entries(QUIZ_KEY)) k.forEach((r, i) => { a[S + '.' + i] = r; }); return a; };

describe('cleanText', () => {
  it('drops markup / quote / control / bidi characters, collapses spaces, caps by characters', () => {
    expect(cleanText('<img src=x onerror=alert(1)>', 40)).toBe('img src=x onerror=alert(1)');
    expect(cleanText('a"b\'c`d&e\\f', 40)).toBe('abcdef');
    expect(cleanText(' 小\u202e明\u0000\n\t  同学\u2028 ', 40)).toBe('小明 同学');
    expect(cleanText('😀'.repeat(20), NICK_MAX)).toBe('😀'.repeat(12));
    expect(cleanText(42 as unknown, 5)).toBe('');
  });
});
describe('challenge link (?ch=)', () => {
  it('round-trips stop, score, questions and a nickname', () => {
    const n = QUIZ_KEY.T3!.length, raw = encodeCh({ S: 'T3', c: 4, n, nick: '小明' });
    expect(raw).toBe(`${CH_ORDER.indexOf('T3')}-4-${n}-${b64('小明')}`);
    expect(decodeCh(raw)).toEqual({ S: 'T3', c: 4, n, nick: '小明' });
    expect(decodeCh(encodeCh({ S: 'K5', c: 0, n: QUIZ_KEY.K5!.length, nick: '' }))).toEqual({ S: 'K5', c: 0, n: QUIZ_KEY.K5!.length, nick: '' });
  });
  it('stop numbers in links are frozen: pre-R25 links (22 stops) still open the same stop; new stops come after', () => {
    expect(CH_ORDER.slice(0, 22)).toEqual(['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5']);
    expect([...CH_ORDER].sort()).toEqual([...TABORDER].sort());
    const n = QUIZ_KEY.T3!.length;
    expect(decodeCh(`8-2-${n}`)?.S).toBe('T3');
    for (const S of ['Api', 'Loc']) if (QUIZ_KEY[S]) expect(decodeCh(encodeCh({ S, c: 1, n: QUIZ_KEY[S]!.length, nick: '' }))?.S).toBe(S);
  });
  it('rejects tampering: unknown stop, stop without a quiz, wrong question count, score > questions, junk, too long', () => {
    const n = QUIZ_KEY.T3!.length, i = CH_ORDER.indexOf('T3');
    for (const bad of [`99-1-${n}`, `${CH_ORDER.indexOf('T8')}-1-1`, `${i}-1-${n + 1}`, `${i}-${n + 1}-${n}`, `${i}-1`, `${i}-1-${n}-%%%`, `${i}-1-${n}-` + 'A'.repeat(70), `x${i}-1-${n}`, '', null, 5, `${i}-1-${n}-${'A'.repeat(80)}`])
      expect(decodeCh(bad), String(bad)).toBeNull();
    expect(decodeCh(`${i}-1-${n}-__4`)?.nick).toBe(''); /* bytes FF FE: not UTF-8 → no nickname */
  });
  it('a hostile nickname comes back cleaned and capped', () => {
    const n = QUIZ_KEY.T3!.length, i = CH_ORDER.indexOf('T3');
    const d = decodeCh(`${i}-2-${n}-${b64('<b>"x"</b>' + '长'.repeat(10))}`);
    expect(d?.nick).toBe('bx/b' + '长'.repeat(8));
    expect(d!.nick).not.toMatch(/[<>"]/);
  });
  it('the link: ?lang, ch=, from= in the query before the #stop route', () => {
    const u = challengeURL('T3', 3, QUIZ_KEY.T3!.length, '', 'zh', 'challenge', loc('?from=weibo&ch=1-1-1', '#T5'));
    expect(u).toBe(`https://superjackman.github.io/SI/?lang=zh&ch=${CH_ORDER.indexOf('T3')}-3-${QUIZ_KEY.T3!.length}&from=challenge#T3`);
  });
  it('re-sharing a page opened from a challenge / setup link drops ch= and lab=', () => {
    expect(shareURL(loc('?ch=8-1-5&lab=labGD.e30&from=lab&lang=en', '#T3'), 'zh')).toBe('https://superjackman.github.io/SI/?lang=zh#T3');
    expect(withParam('https://a.b/SI/?lang=zh&lab=x#T1', 'lab', 'y')).toBe('https://a.b/SI/?lang=zh&lab=y#T1');
    expect(withParam('https://a.b/SI/#T1', 'ch', '1')).toBe('https://a.b/SI/?ch=1#T1');
  });
});
describe('lab setup link (?lab=)', () => {
  it('round-trips', () => { const r = encodeLab('labGD', { gdE: '0.3', atMask: '1', tkIn: '你好' }); expect(decodeLab(r)).toEqual({ card: 'labGD', v: { gdE: '0.3', atMask: '1', tkIn: '你好' } }); });
  it('rejects bad ids, non-objects, nested values, > 24 values, too long, bad base64 / UTF-8 / JSON', () => {
    const j = (o: unknown) => 'labGD.' + b64(JSON.stringify(o));
    const many: Record<string, number> = {}; for (let i = 0; i < 25; i++) many['k' + i] = i;
    for (const bad of ['labGD', '.e30', '1lab.' + b64('{"a":1}'), 'la b.' + b64('{"a":1}'), j([1]), j(null), j('x'), j({ a: { b: 1 } }), j({ 'a b': 1 }), j({ __proto__x: [1] }), j(many), j({}), 'labGD.@@', 'labGD.' + 'A'.repeat(LAB_MAX), 'labGD.' + b64('{"a":1'), 'labGD.' + btoa('\xff\xfe')])
      expect(decodeLab(bad), bad).toBeNull();
    expect(decodeLab(j({ a: "x".repeat(500) }))?.v.a?.length).toBe(120);
  });
});
describe('clampVal: the receiving control decides', () => {
  it('range / number: numeric only, clamped, snapped to the step', () => {
    const r = { type: 'range', min: '0.05', max: '1.2', step: '0.05' };
    expect(clampVal(r, '0.3')).toBe('0.3'); expect(clampVal(r, '9')).toBe('1.2'); expect(clampVal(r, '-3')).toBe('0.05'); expect(clampVal(r, '0.33')).toBe('0.35');
    for (const b of ['1e999', 'NaN', '0x10', '1;alert(1)', '', 'Infinity']) expect(clampVal(r, b), b).toBeNull();
    expect(clampVal({ type: 'range', min: '19', max: '26', step: '0.1' }, '22.27')).toBe('22.3');
    expect(clampVal({ type: 'range', min: '-4', max: '4', step: '1' }, '-9')).toBe('-4');
    expect(clampVal({ type: 'range' }, '150')).toBe('100');
  });
  it('checkbox 0 / 1 only; select only its own options; text cleaned and capped; other types ignored', () => {
    expect(clampVal({ type: 'checkbox' }, '1')).toBe('1'); expect(clampVal({ type: 'checkbox' }, 'true')).toBeNull();
    expect(clampVal({ type: 'select', options: ['1', '2', '4'] }, '4')).toBe('4'); expect(clampVal({ type: 'select', options: ['1', '2', '4'] }, '8')).toBeNull();
    expect(clampVal({ type: 'text', maxLength: -1 }, '<script>' + 'x'.repeat(60))).toBe('script' + 'x'.repeat(34));
    expect(clampVal({ type: 'text', maxLength: 5 }, 'abcdefg')).toBe('abcde');
    expect(clampVal({ type: 'file' }, 'x')).toBeNull(); expect(clampVal({ type: 'color' }, '#fff')).toBeNull();
  });
});
describe('lab setup on real controls', () => {
  afterEach(() => { document.body.innerHTML = ''; });
  it('collects range / select / checkbox / text, then puts them back checked against each control (events fire)', () => {
    document.body.innerHTML = `<div class="card lab" id="labX"><input type="range" id="a" min="0" max="10" step="1" value="3"><select id="s"><option value="1">1</option><option value="2">2</option></select><input type="checkbox" id="c"><input type="text" id="t" value="hi"><input type="hidden" id="h" value="z"><input type="file" id="f"></div>`;
    const card = document.getElementById('labX')!;
    (card.querySelector('#s') as HTMLSelectElement).value = '2'; (card.querySelector('#c') as HTMLInputElement).checked = true;
    expect(labVals(card)).toEqual({ a: '3', s: '2', c: '1', t: 'hi' });
    let n = 0; card.addEventListener('input', () => n++);
    expect(applyLab(card, { a: '99', s: '7', c: '0', t: '<b>yo</b>', h: 'evil', f: 'x', zz: '1' })).toBe(3);
    expect((card.querySelector('#a') as HTMLInputElement).value).toBe('10');
    expect((card.querySelector('#s') as HTMLSelectElement).value).toBe('2');
    expect((card.querySelector('#c') as HTMLInputElement).checked).toBe(false);
    expect((card.querySelector('#t') as HTMLInputElement).value).toBe('byo/b');
    expect((card.querySelector('#h') as HTMLInputElement).value).toBe('z');
    expect(n).toBe(3);
  });
});
describe('progress rule (stated on the card)', () => {
  it('a stop is lit when opened and its quiz finished; a stop without a quiz when opened', () => {
    const p = progress(['T3', 'T8'], { 'T3.0': 0 });
    expect(p.total).toBe(24); expect(p.questions).toBe(97);
    expect(p.stops.find((s) => s.S === 'T8')?.lit).toBe(true);
    expect(p.stops.find((s) => s.S === 'T3')).toMatchObject({ opened: true, lit: false });
    const a = allRight();
    expect(progress(['T3'], a).lit).toBe(1);
    expect(progress([], a).lit).toBe(0); /* answers alone do not light a stop */
  });
  it('certificate: all 24 lit AND ≥ 60 % right overall', () => {
    const a = allRight(); expect(progress(TABORDER, a).cert).toBe(true);
    expect(progress(TABORDER.slice(1), a).cert).toBe(false);
    const need = Math.ceil(PASS * 97), wrong = { ...a }; let k = 97 - need;
    for (const key of Object.keys(wrong)) { if (k-- <= 0) break; wrong[key] = (wrong[key]! + 1) % 2 + 5; }
    expect(progress(TABORDER, wrong)).toMatchObject({ correct: need, cert: true });
    const key0 = Object.keys(a).find((x) => wrong[x] === a[x])!; wrong[key0] = 9;
    expect(progress(TABORDER, wrong)).toMatchObject({ correct: need - 1, cert: false });
  });
  it('stopQuiz; the certificate date is kept, and cleared when the certificate no longer holds', () => {
    expect(stopQuiz('T3', { 'T3.0': QUIZ_KEY.T3![0]!, 'T3.1': 9 })).toEqual([1, 2, QUIZ_KEY.T3!.length]);
    localStorage.clear();
    const p = progress(TABORDER, allRight());
    expect(doneDate(p, new Date(2026, 9, 24))).toBe('2026-10-24');
    expect(doneDate(p, new Date(2027, 0, 1))).toBe('2026-10-24');
    expect(doneDate(progress([], {}))).toBeNull(); expect(localStorage.getItem('si.done')).toBeNull();
    expect(fmtDate('2026-10-24', 'zh')).toBe('2026 年 10 月 24 日'); expect(fmtDate('2026-10-24', 'en')).toBe('24 October 2026');
  });
});
describe('landing + prompts + named events', () => {
  beforeEach(() => { sessionStorage.clear(); localStorage.clear(); });
  it('a valid ?ch= is kept for the session; ch= and lab= leave the address bar, from= stays', () => {
    const n = QUIZ_KEY.T3!.length, raw = encodeCh({ S: 'T3', c: 2, n, nick: 'Amy' });
    history.replaceState(null, '', `/SI/?lang=en&ch=${raw}&lab=junk&from=challenge#T3/quizT3`);
    const evs: string[] = []; const on = (e: Event) => evs.push(String((e as CustomEvent).detail)); addEventListener('si-ev', on);
    land();
    removeEventListener('si-ev', on);
    expect(challenge()).toEqual({ S: 'T3', c: 2, n, nick: 'Amy' });
    expect(location.search).toBe('?lang=en&from=challenge'); expect(location.hash).toBe('#T3/quizT3');
    expect(evs).toEqual(['challenge-open', 'lab-bad']);
    sessionStorage.setItem('si.ch', JSON.stringify({ raw: '99-9-9' })); expect(challenge()).toBeNull();
  });
  it('prompts: one per session, a dismissed kind stays off', () => {
    expect(canNudge('quiz')).toBe(true);
    sessionStorage.setItem('si.nudged', 'lab'); expect(canNudge('quiz')).toBe(false);
    sessionStorage.clear(); localStorage.setItem('si.nudge.off', '["quiz"]');
    expect(canNudge('quiz')).toBe(false); expect(canNudge('stop')).toBe(true);
    localStorage.setItem('si.nudge.off', '{bad'); expect(canNudge('quiz')).toBe(true);
  });
  it('si-ev custom events name themselves for analytics', () => {
    expect(eventFor(new CustomEvent('si-ev', { detail: 'challenge-open' }))).toBe('challenge-open');
    const b = document.createElement('button'); b.dataset.shareCh = 'lab-share'; document.body.append(b);
    const e = new MouseEvent('click', { bubbles: true }); Object.defineProperty(e, 'target', { value: b }); expect(eventFor(e)).toBe('share-lab-share');
    expect(withFrom('https://x.y/SI/?lang=zh&lab=a.b#T1/labGD', 'lab')).toBe('https://x.y/SI/?lang=zh&lab=a.b&from=lab#T1/labGD');
  });
});
