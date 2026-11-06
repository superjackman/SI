/** one stage of the chain. Inline marks: **word** keyword · `f` formula · {~label} an approximate / empirical chip */
export interface Stage {
  n: string; // short name (chain, crumb)
  s: string; // what it brings, one line (chain)
  e: string; // what it leaves open, one line (the chain's connector to the next stage)
  q: string; // (a) the problem
  i: string[]; // (b) the core idea
  f: string[]; // (c) formula / mechanism, plain text
  x: string[]; // (d) a small number example
  lo: string; // (e) what is left → the next stage
  h: string; // try it yourself
  ly?: Ly; // R51/R52 layered teaching (every station)
}
/** R52 逐层展开 (layered teaching), one concept per screen: ① hook + analogy → ② picture → ③ numbers → ④ formula → ⑤ check.
    ③ also shows the stage's own `x` numbers and its demo, ④ its `f` / `i`, ⑤ its self-check. Colour marks ⟦q:…⟧ (Q / first part, yellow),
    ⟦k:…⟧ (K / second, green), ⟦v:…⟧ (V / the result, purple), ⟦c:…⟧ (cyan), ⟦r:…⟧ (coral) tie each formula part back to the analogy. */
export interface Ly {
  hook: string; // 为什么要关心: an everyday phenomenon or question
  an: string[]; // the everyday analogy
  jv: string; // the programmer's side analogy (behind 我是程序员)
  pic: 'sm' | 'bowl' | 'att' | 'blk' | 'flow' | 'xor' | 'dot'; // the picture / animation
  pc: string[]; // what the picture shows
  num: string[]; // extra numbers (before the stage's own `x`)
  fx: string[]; // the formula(s), colour-marked
  fe: string[]; // each part of the formula, same colours
}
export interface Dv { t: string; sub: string; how: string; st: Stage[] }
