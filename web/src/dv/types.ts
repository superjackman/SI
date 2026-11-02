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
}
export interface Dv { t: string; sub: string; how: string; st: Stage[] }
