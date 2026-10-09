import type { Rng } from '../../engine/random';
import { fits, RULE_WORDS, type Rule, type SortCritter } from '../critter-sort/logic';

/**
 * Critter Crossing: a bridge gate lets some critters across by a rule. At first the rule is on the sign; then it is
 * a secret, and the child tries critters one at a time, watches who crosses and who waits, and works the rule out.
 * Nobody ever falls: a critter turned back just waits on the bank, which makes the evidence easy to see.
 */
export type Gate =
  | { kind: 'one'; rule: Rule }
  | { kind: 'not'; rule: Rule }
  | { kind: 'and'; rules: [Rule, Rule] };

export const ALL_RULES: Rule[] = ['hat', 'brown', 'white', 'floppy', 'pointy', 'whiskers'];

export function passes(c: SortCritter, gate: Gate): boolean {
  switch (gate.kind) {
    case 'one':
      return fits(c, gate.rule);
    case 'not':
      return !fits(c, gate.rule);
    case 'and':
      return fits(c, gate.rules[0]) && fits(c, gate.rules[1]);
  }
}

/** The rule in words, for speech: "wearing a hat", "not wearing a hat", "brown and with whiskers". */
export function gateWords(gate: Gate): string {
  switch (gate.kind) {
    case 'one':
      return RULE_WORDS[gate.rule];
    case 'not':
      return `not ${RULE_WORDS[gate.rule]}`;
    case 'and':
      return `${RULE_WORDS[gate.rules[0]]} and ${RULE_WORDS[gate.rules[1]]}`;
  }
}

/** A stable name for a gate; an "and" is the same either way round. */
export function gateKey(gate: Gate): string {
  return gate.kind === 'and' ? `and:${[...gate.rules].sort().join('+')}` : `${gate.kind}:${gate.rule}`;
}

export const sameGate = (a: Gate, b: Gate) => gateKey(a) === gateKey(b);

export type CrossMode = 'visible' | 'hidden';

export interface CrossPlan {
  name: string;
  mode: CrossMode;
  /** Which kinds of secret rule a round may draw. */
  gates: 'one' | 'and' | 'mixed';
  critters: number;
  /** Rules offered when it is time to guess, the true one among them. */
  options: number;
  /** Critters to try before the guess button wakes up. */
  minTests: number;
  rounds: number;
}

export const PLANS: CrossPlan[] = [
  { name: 'The gate shows its rule: send across the critters that fit', mode: 'visible', gates: 'one', critters: 5, options: 0, minTests: 0, rounds: 2 },
  { name: 'A secret rule: try critters, watch who crosses, then guess the rule from three pictures', mode: 'hidden', gates: 'one', critters: 4, options: 3, minTests: 2, rounds: 2 },
  { name: 'A secret rule with four pictures to choose from and five critters to try', mode: 'hidden', gates: 'one', critters: 5, options: 4, minTests: 2, rounds: 2 },
  { name: 'A secret rule with two parts: a critter must fit both to cross', mode: 'hidden', gates: 'and', critters: 6, options: 4, minTests: 3, rounds: 2 },
  { name: 'A secret rule that may be "not" something or two parts: use all the evidence', mode: 'hidden', gates: 'mixed', critters: 6, options: 4, minTests: 3, rounds: 2 },
];

export const planFor = (level: number): CrossPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface CrossRound {
  gate: Gate;
  critters: SortCritter[];
  /** The pictures to guess from (empty on a visible round); the true gate is one of them. */
  options: Gate[];
}

const KINDS = ['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'] as const;

function randomGate(plan: CrossPlan, rng: Rng): Gate {
  const kind = plan.gates === 'one' ? 'one' : plan.gates === 'and' ? 'and' : rng.pick(['one', 'not', 'and'] as const);
  if (kind === 'and') {
    const [a, b] = rng.shuffle([...ALL_RULES]);
    return { kind, rules: [a, b] };
  }
  return { kind, rule: rng.pick(ALL_RULES) };
}

/** Wrong pictures that look like the right one: they share a part of it, or are its opposite. */
function lookalikes(truth: Gate, plan: CrossPlan, rng: Rng): Gate[] {
  const out: Gate[] = [];
  const rules = (g: Gate): Rule[] => (g.kind === 'and' ? g.rules : [g.rule]);
  const mine = rules(truth);
  for (const r of rng.shuffle([...ALL_RULES])) {
    if (plan.gates === 'one') out.push({ kind: 'one', rule: r });
    else if (plan.gates === 'and') {
      for (const keep of mine) if (r !== keep) out.push({ kind: 'and', rules: rng.chance(0.5) ? [keep, r] : [r, keep] });
    } else {
      out.push({ kind: 'one', rule: r }, { kind: 'not', rule: r });
      for (const keep of mine) if (r !== keep) out.push({ kind: 'and', rules: [keep, r] });
    }
  }
  const seen = new Set([gateKey(truth)]);
  return out.filter((g) => !seen.has(gateKey(g)) && seen.add(gateKey(g)));
}

/** Gates the evidence so far does not rule out. */
export function consistent(options: Gate[], evidence: { c: SortCritter; passed: boolean }[]): Gate[] {
  return options.filter((g) => evidence.every((e) => passes(e.c, g) === e.passed));
}

/**
 * The untested critter whose answer would tell the most: it splits the pictures still in the running as evenly as
 * possible. Null when nobody is left to try, or when the pictures left all agree about everyone.
 */
export function bestTest(critters: SortCritter[], tried: SortCritter[], options: Gate[], evidence: { c: SortCritter; passed: boolean }[]): SortCritter | null {
  const left = consistent(options, evidence);
  let best: { c: SortCritter; score: number } | null = null;
  for (const c of critters) {
    if (tried.includes(c)) continue;
    const yes = left.filter((g) => passes(c, g)).length;
    const score = Math.min(yes, left.length - yes);
    if (score > 0 && (!best || score > best.score)) best = { c, score };
  }
  return best?.c ?? null;
}

/**
 * A round with a rule, critters to try and (when hidden) pictures to guess from. Some critters cross and some
 * wait, and every wrong picture disagrees with the true rule about at least one critter, so trying everyone always
 * leaves exactly one picture standing.
 */
export function makeRound(plan: CrossPlan, rng: Rng, avoid?: string): CrossRound {
  for (let attempt = 0; attempt < 400; attempt++) {
    const gate = randomGate(plan, rng);
    if (gateKey(gate) === avoid) continue;
    const critters: SortCritter[] = [];
    for (let i = 0; i < plan.critters; i++) critters.push({ kind: rng.pick(KINDS), hat: rng.chance(0.45) });
    if (new Set(critters.map((c) => `${c.kind}${c.hat}`)).size < critters.length) continue;
    const yes = critters.filter((c) => passes(c, gate)).length;
    if (yes === 0 || yes === critters.length) continue;
    if (plan.mode === 'visible') return { gate, critters, options: [] };
    const wrong = lookalikes(gate, plan, rng).filter((g) => critters.some((c) => passes(c, g) !== passes(c, gate)));
    if (wrong.length < plan.options - 1) continue;
    const options = rng.shuffle([gate, ...wrong.slice(0, plan.options - 1)]);
    // The rule must also be findable by trying critters one by one, not only by trying them all.
    if (consistent(options, critters.map((c) => ({ c, passed: passes(c, gate) }))).length !== 1) continue;
    return { gate, critters, options };
  }
  throw new Error(`could not make a ${plan.name} round`);
}

/** What a capable child does next on a round: send a critter to the gate, or guess the rule. */
export type CrossStep = { do: 'try'; critter: SortCritter } | { do: 'guess'; gate: Gate };

/**
 * The ghost finger's next move, given the critters already sent to the gate and what happened (`tried`).
 *
 * On a visible round the sign says the rule, so it sends each critter that fits, never one that does not, and is done when
 * they have all crossed (null). On a hidden round it sends the critter whose answer rules out the most pictures
 * (`bestTest`), and guesses only once the guess button is awake (`minTests` tried) and a single picture is left; that one is
 * the true rule, because every round is made so that trying everyone leaves exactly one picture standing. When the evidence
 * is already decisive but `minTests` has not been tried, any waiting critter is sent, since the button would only say "try more".
 */
export function nextStep(round: CrossRound, plan: CrossPlan, tried: { c: SortCritter; passed: boolean }[]): CrossStep | null {
  const waiting = round.critters.filter((c) => !tried.some((t) => t.c === c));
  if (plan.mode === 'visible') {
    const fit = waiting.find((c) => passes(c, round.gate));
    return fit ? { do: 'try', critter: fit } : null;
  }
  const left = consistent(round.options, tried);
  if (tried.length >= plan.minTests && left.length === 1) return { do: 'guess', gate: left[0] };
  const test = bestTest(round.critters, tried.map((t) => t.c), round.options, tried) ?? waiting[0];
  return test ? { do: 'try', critter: test } : null;
}
