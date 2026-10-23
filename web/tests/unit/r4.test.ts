import { afterEach, describe, expect, it } from 'vitest';
import { perm, quizScore, renderQuiz, QUIZ_KEY, type QZ } from '../../src/station/quiz';
import { applyZoomDom, setZoom } from '../../src/shell/zoom';
import { startTour, tourGo, tourStep, endTour, TOUR_LEN, clearHl } from '../../src/tour/api';
import { useApp } from '../../src/store/app';

/* verbatim from the live page (app.js) */
function v2rng(seed: number) { let s = (seed >>> 0) || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function livePerm(n: number, seed: number) { const a: number[] = []; let i; for (i = 0; i < n; i++) a.push(i); const r = v2rng(seed + 1); for (i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]!; a[i] = a[j]!; a[j] = t; } return a; }

afterEach(() => { localStorage.clear(); document.body.innerHTML = ''; document.body.className = ''; useApp.getState().set({ tour: null }); });

describe('native quiz (live parity)', () => {
  it('option order equals live perm() for every n/seed used', () => {
    for (let n = 2; n <= 6; n++) for (let seed = 0; seed < 200; seed++) expect(perm(n, seed)).toEqual(livePerm(n, seed));
  });
  it('quizScore counts correct / answered / total over the shared answer key', () => {
    const total = Object.values(QUIZ_KEY).reduce((a, k) => a + k.length, 0);
    expect(total).toBe(76); // 69 + M4 (T2, T3) + M5 (T7) + M6 (T7, T6, T1)
    expect(quizScore()).toEqual([0, 0, 76]);
    const [S, key] = Object.entries(QUIZ_KEY)[0]!;
    localStorage.setItem('aiexp.v2.quiz', JSON.stringify({ [S + '.0']: key[0], [S + '.1']: (key[1]! + 1) % 3 }));
    expect(quizScore()).toEqual([1, 2, 76]);
    localStorage.setItem('aiexp.v2.quiz', 'not json');
    expect(quizScore()).toEqual([0, 0, 76]);
  });
  it('renderQuiz marks the answered question right/wrong and keeps the zl tag first', () => {
    document.body.innerHTML = '<div id="quizT9"></div>';
    const QZ: QZ = { T9: [['q0', ['a', 'b', 'c'], 1, 'why0'], ['q1', ['x', 'y'], 0, 'why1']] };
    localStorage.setItem('aiexp.v2.quiz', JSON.stringify({ 'T9.0': 2 }));
    renderQuiz(document, 'T9', 'en', QZ);
    const el = document.getElementById('quizT9')!;
    expect(el.firstElementChild?.className).toBe('zl zq');
    expect(el.querySelectorAll('.qz').length).toBe(2);
    expect(el.querySelectorAll('.qz.done').length).toBe(1);
    expect(el.querySelector('.opt.right')?.textContent).toBe('✅ b');
    expect(el.querySelector('.opt.wrong')?.textContent).toBe('❌ c');
    expect(el.querySelector('.qsum')?.textContent).toContain('answered 1');
    expect([...el.querySelectorAll<HTMLElement>('.qz:first-of-type .opt')].map((b) => +b.dataset.o!)).toEqual(perm(3, 0 * 7 + 2 * 3));
    expect(el.querySelector('[data-qreset="T9"]')).not.toBeNull();
  });
});

describe('detail level', () => {
  it('folds cards above the level and writes the #zn note; hides it when nothing is folded', () => {
    document.body.innerHTML = '<section id="T5"><div id="znT5"></div><div class="card" data-z="1"></div><div class="card" data-z="2"></div><div class="card" data-z="3"></div></section>';
    const sec = document.getElementById('T5')!, zn = document.getElementById('znT5')!;
    applyZoomDom(sec, 'T5', 1, 'zh');
    expect(sec.querySelectorAll('.zhide').length).toBe(2);
    expect(zn.style.display).toBe('flex');
    expect(zn.querySelectorAll('[data-zset]').length).toBe(2);
    applyZoomDom(sec, 'T5', 2, 'en');
    expect(sec.querySelectorAll('.zhide').length).toBe(1);
    expect(zn.querySelectorAll('[data-zset]').length).toBe(1);
    applyZoomDom(sec, 'T5', 3, 'en');
    expect(zn.style.display).toBe('none');
  });
  it('setZoom stores aiexp.v2.zoom and updates the store', () => {
    setZoom(1); expect(useApp.getState().zoom).toBe(1); expect(localStorage.getItem('aiexp.v2.zoom')).toBe('1');
    setZoom(3); expect(useApp.getState().zoom).toBe(3);
  });
});

describe('tour state', () => {
  it('start raises the level to mid, steps, ignores <0, and finishing records tourDone', () => {
    setZoom(1);
    startTour();
    expect(useApp.getState().tour).toBe(0);
    expect(useApp.getState().zoom).toBe(2);
    expect(document.body.classList.contains('touring')).toBe(true);
    expect(tourStep(-1)).toBe(true); expect(useApp.getState().tour).toBe(0);
    tourGo(TOUR_LEN - 1); expect(tourStep(1)).toBe(true);
    expect(useApp.getState().tour).toBeNull();
    expect(localStorage.getItem('aiexp.v2.tourDone')).toBe('1');
    expect(document.body.classList.contains('touring')).toBe(false);
    expect(tourStep(1)).toBe(false);
  });
  it('exiting early does not record tourDone; clearHl only drops tour-lit parts', () => {
    document.body.innerHTML = '<div class="level"><g class="comp run" data-tourrun="1"></g><g class="comp run" id="own"></g></div><p class="tour-hl"></p>';
    startTour(); endTour(false);
    expect(localStorage.getItem('aiexp.v2.tourDone')).toBeNull();
    clearHl();
    expect(document.querySelectorAll('.tour-hl').length).toBe(0);
    expect(document.querySelectorAll('.run').length).toBe(1);
    expect(document.getElementById('own')?.classList.contains('run')).toBe(true);
  });
});
