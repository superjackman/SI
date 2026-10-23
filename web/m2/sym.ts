/* R15 (plain language): which symbols a TeX formula uses, as glossary keys (m2/content/symbols.ts).
   Shared by the generator (symbol-note lists under every formula) and the guard tests.
   Keys: glossary keys such as 'sum', 'frac', 'sup', 'theta'; a Latin letter is 'v:<letter>' and a \text / \mathrm word
   is 'w:<word>' — those two kinds have no fixed meaning, so the station / card context map must say what they stand for. */

/** \cmd → glossary key (commands not listed are layout-only and ignored; an unknown command fails the build) */
const CMD: Record<string, string> = {
  sum: 'sum', prod: 'prod', partial: 'partial', frac: 'frac', dfrac: 'frac', tfrac: 'frac', sqrt: 'sqrt', lim: 'lim', to: 'to', rightarrow: 'to',
  infty: 'infty', cdot: 'cdot', times: 'times', nabla: 'nabla', int: 'int', ln: 'ln', log: 'log', exp: 'exp', cos: 'cos', sin: 'sin',
  tanh: 'tanh', max: 'max', min: 'min', det: 'det', circ: 'circ', forall: 'forall', exists: 'exists', in: 'in', neq: 'neq', ne: 'neq',
  le: 'le', leq: 'le', ge: 'ge', geq: 'ge', approx: 'approx', Longrightarrow: 'implies', implies: 'implies', Rightarrow: 'implies',
  dots: 'dots', cdots: 'dots', ldots: 'dots', pm: 'pm', top: 'T', ell: 'ell', mid: 'mid', equiv: 'equiv', propto: 'propto',
  alpha: 'alpha', beta: 'beta', gamma: 'gamma', delta: 'delta', Delta: 'Delta', epsilon: 'epsilon', varepsilon: 'epsilon', eta: 'eta',
  theta: 'theta', lambda: 'lambda', mu: 'mu', pi: 'pi', sigma: 'sigma', Sigma: 'Sigma', phi: 'phi', varphi: 'phi', tau: 'tau', omega: 'omega',
  cap: 'cap', leftarrow: 'gets', gets: 'gets', iff: 'iff', Leftrightarrow: 'iff', odot: 'odot', underbrace: 'brace', sim: 'sim', rho: 'rho', Lambda: 'Lambda',
  hat: 'hat', bar: 'bar', vec: 'vec', tilde: 'tilde', mathbb: '', mathrm: '', text: '', operatorname: '', mathsf: '', mathbf: '', boldsymbol: '', mathit: '',
};
/** layout / spacing commands */
const SKIP = new Set(['left', 'right', 'big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 'Bigr', 'quad', 'qquad', 'displaystyle', 'textstyle',
  'limits', 'nolimits', 'begin', 'end', ',', ';', ':', '!', ' ', '\\', '{', '}', 'lvert', 'rvert', 'lbrace', 'rbrace', 'mkern', 'kern', 'phantom', '%']);
/** big operators whose own sub/superscripts are part of the operator ("from i = 1 to n"), not separate subscripts */
const BIG = new Set(['sum', 'prod', 'lim', 'int', 'max', 'min', 'brace']);
const GREEK = new Set(['alpha', 'beta', 'gamma', 'delta', 'Delta', 'epsilon', 'eta', 'theta', 'lambda', 'mu', 'sigma', 'Sigma', 'phi', 'tau', 'omega', 'ell', 'rho', 'Lambda']);
/** keys whose meaning depends on the formula: they need a context meaning (the guard test checks) */
export const needsCtx = (k: string) => k.startsWith('v:') || k.startsWith('w:') || (GREEK.has(k) && k !== 'pi');
export const isGreek = (k: string) => GREEK.has(k);

/** what came just before a letter that makes "two things written side by side" mean multiply (2x, ab, (a+b)(c+d)) */
const MUL = /^(v|vs|\)|[0-9])$/;
export const unesc = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const tok = (tex: string) => tex.match(/\\[a-zA-Z]+|\\[^a-zA-Z]|[\s\S]/g) ?? [];

/** the symbols one TeX formula uses, in order of first appearance */
export function symKeys(tex: string, o: { d?: boolean } = {}): string[] {
  const t = tok(tex), out: string[] = [], add = (k: string) => { if (k && !out.includes(k)) out.push(k); };
  /** read a {group} (or one token) starting at i; returns [text, next index] */
  const group = (i: number): [string, number] => {
    while (t[i] === ' ') i++;
    if (t[i] !== '{') return [t[i] ?? '', i + 1];
    let d = 0, s = ''; for (let j = i; j < t.length; j++) { if (t[j] === '{') d++; else if (t[j] === '}') d--; if (d === 0) return [s, j + 1]; if (j > i) s += t[j]; }
    return [s, t.length];
  };
  let prev = '', big = 0; // big: right after a big operator, whose own limits are not listed as sub/superscripts
  const scripts: number[] = [], own: [number, string, string][] = []; let depth = 0, single = false, singleAfter = ')', normOpen = false;
  /** one token at i; returns the index of the last token consumed */
  /* a ‖ after a value is a separator (KL(p ‖ q)) when the bracket closes before any other ‖; otherwise it opens a length (‖a‖ ‖b‖) */
  const sepAhead = (i: number): boolean => {
    for (let k = i + 1; k < t.length; k++) { const y = t[k]!; if (y === ')') return true; if (y === t[i] || /^\\?(r?Vert|\|)$/.test(y)) return false; }
    return false;
  };
  const one = (i: number): number => {
    const x = t[i]!;
    if (x === '{') { if (t[i - 1] === '}') prev = '{'; depth++; return i; } // \frac{a}{b}: a and b are not multiplied
    if (x === '}') {
      depth--;
      if (scripts.length && scripts[scripts.length - 1] === depth) { scripts.pop(); if (!scripts.length) big = 1; prev = 'op'; }
      if (own.length && own[own.length - 1]![0] === depth) { const o = own.pop()!; prev = o[2]; }
      return i;
    }
    const inBigScript = scripts.length > 0;
    /** inside a subscript, letters side by side are labels (A_{ij}: row i, column j), not "times" */
    const mulOk = (p: string) => MUL.test(p) && !(own.length && own[own.length - 1]![1] === '_');
    if (x === '^' || x === '_') {
      let j = i + 1; while (t[j] === ' ') j++;
      const look = t.slice(j, j + 8).join('').replace(/\s/g, '');
      // transpose: ^{\mathsf T} / ^\mathsf{T} / ^\top / ^T
      if (x === '^' && /^(\{\\mathsf\{?T\}?\}|\\mathsf\{?T\}?|\{?\\top\}?|\{T\}|T)/.test(look)) {
        add('T'); prev = ')'; return (t[j] === '{' ? group(j)[1] : t[j] === '\\mathsf' ? group(j + 1)[1] : j + 1) - 1;
      }
      if (big) {
        if (t[j] === '{') { scripts.push(depth); depth++; return j; }
        // one-token limit (\int_a^x, \sum_k): read it here so the operator's next limit is still its own
        const y = t[j] ?? ''; if (/^[a-zA-Z]$/.test(y)) add('v:' + y); else if (y[0] === '\\') { const k = CMD[y.slice(1)]; if (k === undefined) throw new Error(`sym: unknown TeX command ${y} in ${tex}`); add(k); }
        prev = 'op'; return j;
      }
      add(x === '^' ? 'sup' : 'sub');
      /* a letter with a label, then brackets (D_{KL}(p, q)), is a function of what is in the brackets, not "times" */
      /* ∇_z L, 𝔼_y[…]: after an operator's label comes what it acts on, not a product */
      const after = x === '_' && (prev === 'v' || prev === 'vs') ? 'vs' : x === '_' && (prev === 'nabla' || prev === 'E') ? 'op' : ')';
      prev = x; // the first thing inside a script is never "times" what came before
      if (t[j] === '{') { own.push([depth, x, after]); depth++; return j; }
      single = true; singleAfter = after; return j - 1;
    }
    if (!inBigScript) big = 0;
    if (x[0] === '\\') {
      const c = x.slice(1);
      if (c === 'begin' || c === 'end') { const [env, n] = group(i + 1); if (c === 'begin' && /matrix/.test(env)) add('matrix'); return n - 1; }
      if (c === 'lVert') { if (mulOk(prev)) add('mul'); add('norm'); normOpen = true; prev = '('; return i; }
      if (c === 'rVert') { normOpen = false; prev = ')'; return i; }
      if (c === '|' || c === 'Vert') {
        // ‖a‖ is a length; a single ‖ between two values (KL(p ‖ q)) only separates them
        if (normOpen) { normOpen = false; prev = ')'; return i; }
        if (MUL.test(prev) && sepAhead(i)) { add('parallel'); prev = '|'; return i; }
        if (mulOk(prev)) add('mul'); add('norm'); normOpen = true; prev = '('; return i;
      }
      if (SKIP.has(c)) { if (c === '\\') prev = '&'; /* next matrix row */ else if (prev === 'v' && /^[,;: !]$|quad/.test(c)) prev = ')'; return i; }
      if (!(c in CMD)) throw new Error(`sym: unknown TeX command \\${c} in ${tex}`);
      const k = CMD[c]!;
      if (c === 'mathbb') { const [g, n] = group(i + 1); add(g === 'E' ? 'E' : g === 'R' ? 'R' : 'v:' + g); prev = 'v'; return n - 1; }
      if (c === 'mathsf' || c === 'mathbf' || c === 'boldsymbol' || c === 'mathit') return i; // the letters inside are read normally
      if (c === 'mathrm' || c === 'text' || c === 'operatorname') {
        const [g, n] = group(i + 1); const w = g.trim();
        if (w === 'd') add('dd'); else if (w === 'ReLU') add('relu'); else if (w === 'softmax') add('softmax'); else if (w === 'T') add('T');
        else if (/[A-Za-z\u4e00-\u9fff]/.test(w)) add('w:' + w.replace(/\s+/g, ' '));
        prev = 'v'; return n - 1;
      }
      if ((GREEK.has(k) || k === 'nabla' || k === 'sqrt' || k === 'frac') && mulOk(prev)) add('mul');
      add(k); prev = GREEK.has(k) ? 'v' : k; if (BIG.has(k)) big = 1; return i;
    }
    if (/[a-zA-Z]/.test(x)) {
      // with o.d (calculus), d is the "tiny change" d of dx, dt, d/dx — never a number
      if (o.d && x === 'd') { add('dd'); prev = 'd'; return i; }
      if (mulOk(prev)) add('mul');
      add('v:' + x); prev = 'v'; return i;
    }
    if (x === "'") { add('prime'); prev = 'v'; return i; }
    if (x === '(') { if (prev === 'v' || prev === 'vs') add('fx'); else if (prev === ')' || /^[0-9]$/.test(prev)) add('mul'); prev = '('; return i; }
    const K: Record<string, string> = { '|': 'abs', '<': 'lt', '>': 'gt', '/': 'slash', '!': 'fact', ':': 'colon' };
    if (K[x]) add(K[x]!);
    if (x === '.' && /^[0-9]$/.test(prev)) return i; // 0.5
    prev = x; // digits, + - = , . & ; ( ) [ ] are everyday signs: not listed
    return i;
  };
  for (let i = 0; i < t.length; i++) {
    if (/^\s$/.test(t[i]!)) continue;
    const was = single, wasAfter = singleAfter; single = false; singleAfter = ')';
    i = one(i);
    if (was) prev = wasAfter;
  }
  return out;
}
