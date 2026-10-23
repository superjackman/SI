import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventFor } from '../../src/analyticsEvents';
import { event, eventPath } from '../../src/analytics';

const html = `
<section id="T3">
  <div class="card lab has-meta" id="labTok"><h3>Tok</h3><p class="txt">text</p>
    <button id="b1">go</button><select id="s1"><option>a</option></select><input id="i1"><svg id="g1"><rect id="r1"/></svg>
    <div class="out" id="o1">out</div></div>
  <div class="card quiz has-meta" id="quizT3" data-sec="T3"><div class="qz"><p class="q">Q1</p>
    <div class="opts"><button class="opt" id="q1" data-q="T3.0" data-o="1"><b id="q1b">x</b></button></div></div>
    <div class="row"><button class="btn" id="redo" data-qreset="T3">redo</button></div></div>
  <div class="card" id="plain"><button id="b2">x</button></div>
  <div class="card lab" id="noid"></div>
</section>`;
const ev = (type: string, id: string) => { const e = new Event(type, { bubbles: true }); Object.defineProperty(e, 'target', { value: document.getElementById(id) }); return e; };

describe('lab / quiz event detection = legacy.html rules', () => {
  document.body.innerHTML = html;
  it('lab: click on a control (button/select/input/svg and its children) counts', () => {
    for (const id of ['b1', 's1', 'i1', 'g1', 'r1']) expect(eventFor(ev('click', id))).toBe('lab-labTok');
  });
  it('lab: click on text / output does not; any input event does', () => {
    expect(eventFor(ev('click', 'o1'))).toBeNull();
    expect(eventFor(ev('input', 'i1'))).toBe('lab-labTok');
    expect(eventFor(ev('input', 'o1'))).toBe('lab-labTok');
  });
  it('quiz: click on an option (or inside it) counts by data-sec; redo / input do not', () => {
    expect(eventFor(ev('click', 'q1'))).toBe('quiz-T3');
    expect(eventFor(ev('click', 'q1b'))).toBe('quiz-T3');
    expect(eventFor(ev('click', 'redo'))).toBeNull();
    expect(eventFor(ev('input', 'q1'))).toBeNull();
  });
  it('outside labs / quizzes: nothing', () => {
    expect(eventFor(ev('click', 'b2'))).toBeNull();
    expect(eventFor(ev('click', 'plain'))).toBeNull();
    expect(eventFor(new Event('click'))).toBeNull();
  });
});

describe('event pixel = legacy __gcEvent', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('naming: evt- prefix, runs of other characters → "-"', () => {
    expect(eventPath('lab-labTok')).toBe('evt-lab-labTok');
    expect(eventPath('quiz-T4a')).toBe('evt-quiz-T4a');
    expect(eventPath('lab-a b/c..d')).toBe('evt-lab-a-b-c-d');
  });
  it('one pixel per name per page load: p = t = evt-…, e=true, no referrer', () => {
    const srcs: string[] = [];
    vi.stubGlobal('Image', class { onload: unknown; onerror: unknown; set src(v: string) { srcs.push(v); } });
    event('lab-labTok'); event('lab-labTok'); event('quiz-T3'); event('lab-labTok');
    expect(srcs.length).toBe(2);
    const u = new URL(srcs[0]!);
    expect(u.origin + u.pathname).toBe('https://superjackman-si.goatcounter.com/count');
    expect([...u.searchParams.keys()]).toEqual(['p', 't', 'e', 's', 'rnd']);
    expect(u.searchParams.get('p')).toBe('evt-lab-labTok');
    expect(u.searchParams.get('t')).toBe('evt-lab-labTok');
    expect(u.searchParams.get('e')).toBe('true');
    expect(u.searchParams.get('rnd')).toMatch(/^[a-z0-9]{1,7}$/);
    expect(new URL(srcs[1]!).searchParams.get('p')).toBe('evt-quiz-T3');
  });
});
