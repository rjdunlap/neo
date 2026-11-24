import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/*
 * Outcrop Detective: read a made-up cliff as a story. The island's rules: layers were laid flat,
 * lower first; nothing has been flipped; dark rock cuts the layers that were already there.
 * Definition: docs/definitions/outcrop-detective.md.
 */

export type Deposit = 'A' | 'B' | 'C';
export type Card = Deposit | 'X';
export const CARDS: readonly Card[] = ['A', 'B', 'C', 'X'];
export const DEPOSITS: readonly Deposit[] = ['A', 'B', 'C'];
export type Ribbon = readonly Card[];
export type Contact = 'cut' | 'covers';

/** The canonical story; ties in the hint walk prefer it. */
export const ABXC: Ribbon = ['A', 'B', 'X', 'C'];

export const key = (r: Ribbon): string => r.join('');
export const sameRibbon = (a: Ribbon, b: Ribbon): boolean => key(a) === key(b);

/** All 24 orderings, ABXC first, then lexicographic in CARDS order. */
export const RIBBONS: readonly Ribbon[] = (() => {
  const out: Card[][] = [];
  const walk = (left: Card[], acc: Card[]): void => {
    if (!left.length) out.push(acc);
    left.forEach((c, i) => walk([...left.slice(0, i), ...left.slice(i + 1)], [...acc, c]));
  };
  walk([...CARDS], []);
  return [ABXC, ...out.filter((r) => key(r) !== key(ABXC))];
})();

export interface Preview {
  /** Deposits bottom to top, in ribbon order. */
  stack: Deposit[];
  /** Each deposit's contact with the dark rock: cut (laid before X) or covers (laid after X). */
  contact: Record<Deposit, Contact>;
  /** How many layers the dark rock cuts (0 when it comes first). */
  cuts: number;
}

/** The preview rule: the cliff a story would make, card by card. */
export function predict(r: Ribbon): Preview {
  const xi = r.indexOf('X');
  const stack = r.filter((c): c is Deposit => c !== 'X');
  const contact = {} as Record<Deposit, Contact>;
  for (const d of DEPOSITS) contact[d] = r.indexOf(d) < xi ? 'cut' : 'covers';
  return { stack, contact, cuts: xi };
}

/** What the real cliff shows. The real stack is always A, B, C; a missing contact is hidden. */
export interface Obs {
  contacts: Partial<Record<Deposit, Contact>>;
}

export type Truth = Contact;
export type RecordState = 'seen' | 'sand' | 'sand-off';

export const LEVEL1_OBS: Obs = { contacts: { A: 'cut', B: 'cut', C: 'covers' } };
export const SAND_OBS: Obs = { contacts: { A: 'cut', C: 'covers' } };
export const sandOffObs = (truth: Truth): Obs => ({ contacts: { A: 'cut', B: truth, C: 'covers' } });

export type Reason =
  | { rule: 'stack'; lower: Deposit; upper: Deposit }
  | { rule: 'cut'; layer: Deposit; first: boolean; last: boolean }
  | { rule: 'cover'; layer: Deposit; last: boolean };

/**
 * The first broken rule, in the fixed order: the stack (A under B, then B under C), then each
 * visible cut, then each visible cover. Null when the ribbon fits.
 */
export function whyNot(r: Ribbon, obs: Obs): Reason | null {
  const at = (c: Card): number => r.indexOf(c);
  for (const [lower, upper] of [
    ['A', 'B'],
    ['B', 'C'],
  ] as const) {
    if (at(lower) > at(upper)) return { rule: 'stack', lower, upper };
  }
  const p = predict(r);
  for (const d of DEPOSITS) {
    if (obs.contacts[d] === 'cut' && p.contact[d] !== 'cut')
      return { rule: 'cut', layer: d, first: at('X') === 0, last: false };
  }
  for (const d of DEPOSITS) {
    if (obs.contacts[d] === 'covers' && p.contact[d] !== 'covers')
      return { rule: 'cover', layer: d, last: at('X') === 3 };
  }
  return null;
}

/** Every visible contact matches and the stack is A, B, C. Hidden contacts are never checked. */
export const fits = (r: Ribbon, obs: Obs): boolean => whyNot(r, obs) === null;
export const fitting = (obs: Obs): Ribbon[] => RIBBONS.filter((r) => fits(r, obs));

/* Looks (level 2) ---------------------------------------------------------------------------- */

export type LookId = 'look-sand' | 'look-low' | 'look-top';
export const LOOKS: readonly LookId[] = ['look-sand', 'look-low', 'look-top'];

/** The record after a look: only the sand look reveals anything new. */
export function afterLook(obs: Obs, look: LookId, truth: Truth): Obs {
  if (look !== 'look-sand') return obs;
  return { contacts: { ...obs.contacts, B: truth } };
}

/** True exactly when the look changes the set of fitting ribbons, for some possible truth. */
export function informative(obs: Obs, look: LookId): boolean {
  const before = fitting(obs).map(key).join();
  return (['cut', 'covers'] as const).some(
    (t) =>
      fitting(afterLook(obs, look, t))
        .map(key)
        .join() !== before,
  );
}

/* Hint walk ---------------------------------------------------------------------------------- */

const sharedRun = (a: Ribbon, b: Ribbon): number => {
  let n = 0;
  while (n < a.length && a[n] === b[n]) n++;
  return n;
};

/** The fitting ribbon sharing the longest opening run with hers (ties: ABXC first). */
export function hintTarget(r: Ribbon, obs: Obs): Ribbon | null {
  let best: Ribbon | null = null;
  let bestRun = -1;
  for (const f of fitting(obs)) {
    const run = sharedRun(r, f);
    if (run > bestRun) {
      best = f;
      bestRun = run;
    }
  }
  return best;
}

export interface HintStep {
  ribbon: Card[];
  /** The card moved into place and the slot it moved to. */
  card: Card;
  slot: number;
  target: Ribbon;
}

/** One hint: the first card that differs from the target swaps into place. Null when it fits. */
export function hintStep(r: Ribbon, obs: Obs): HintStep | null {
  if (fits(r, obs)) return null;
  const target = hintTarget(r, obs);
  if (!target) return null;
  const slot = sharedRun(r, target);
  const card = target[slot];
  const ribbon = [...r];
  const from = ribbon.indexOf(card);
  [ribbon[slot], ribbon[from]] = [ribbon[from], ribbon[slot]];
  return { ribbon, card, slot, target };
}

/** How many hints the walk needs from this ribbon to reach a fitting one. */
export function hintsToFit(r: Ribbon, obs: Obs): number {
  let cur: Ribbon = r;
  for (let n = 0; n < 8; n++) {
    const step = hintStep(cur, obs);
    if (!step) return n;
    cur = step.ribbon;
  }
  throw new Error(`hint walk does not close from ${key(r)}`);
}

/* Levels and the seeded round ----------------------------------------------------------------- */

export const LEVELS: BandLevels = { school: { min: 1, max: 2 }, grownup: { min: 1, max: 2 } };

export const PATTERNS = ['dotted', 'striped', 'pebbled', 'wavy', 'checked'] as const;
export type Pattern = (typeof PATTERNS)[number];

export interface Round {
  level: 1 | 2;
  /** Pattern per deposit, never two alike. */
  pattern: Record<Deposit, Pattern>;
  /** Index into the five-colour layer palette per deposit, never two alike. */
  colour: Record<Deposit, number>;
  side: 'left' | 'right';
  /** Small offsets (-1..1) for the cliff's outline. */
  outline: number[];
  opening: Card[];
  looks: LookId[];
  /** Level 2 only: what the sand hides. */
  truth: Truth;
}

export const openingObs = (level: 1 | 2): Obs => (level === 1 ? LEVEL1_OBS : SAND_OBS);

/** Ribbons that need exactly two hints from the opening record: the round never opens nearly solved. */
export const openingSet = (level: 1 | 2): Ribbon[] =>
  RIBBONS.filter((r) => hintsToFit(r, openingObs(level)) === 2);

export function makeRound(level: number, rng: Rng): Round {
  const lv: 1 | 2 = level >= 2 ? 2 : 1;
  const pats = rng.shuffle([...PATTERNS]);
  const cols = rng.shuffle([0, 1, 2, 3, 4]);
  return {
    level: lv,
    pattern: { A: pats[0], B: pats[1], C: pats[2] },
    colour: { A: cols[0], B: cols[1], C: cols[2] },
    side: rng.chance(0.5) ? 'left' : 'right',
    outline: [0, 1, 2, 3, 4].map(() => rng.range(-1, 1)),
    opening: [...rng.pick(openingSet(lv))],
    looks: rng.shuffle([...LOOKS]),
    truth: rng.chance(0.5) ? 'cut' : 'covers',
  };
}

/* The round's steps and accounting ---------------------------------------------------------------- */

export type Step = 'order' | 'sure' | 'look' | 'again' | 'done';
export type Answer = 'yes' | 'unsure';

export interface State {
  round: Round;
  step: Step;
  ribbon: Card[];
  record: RecordState;
  misses: number;
  hints: number;
  /** Wrong ribbons already counted, keyed `${record}:${ribbon}`. */
  counted: string[];
  stepMisses: number;
  /** The step's target has glowed (after two misses or a hint press). */
  glowed: boolean;
  /** Wrong looks already counted. */
  lookMissed: LookId[];
  sureMissed: boolean;
  /** Cards a hint moved, shown as helped. */
  helped: Card[];
}

export const obsOf = (s: State): Obs =>
  s.record === 'seen' ? LEVEL1_OBS : s.record === 'sand' ? SAND_OBS : sandOffObs(s.round.truth);

export function start(round: Round): State {
  return {
    round,
    step: 'order',
    ribbon: [...round.opening],
    record: round.level === 1 ? 'seen' : 'sand',
    misses: 0,
    hints: 0,
    counted: [],
    stepMisses: 0,
    glowed: false,
    lookMissed: [],
    sureMissed: false,
    helped: [],
  };
}

/** Start again: the same seeded round; misses and hints are kept. */
export const restart = (s: State): State => ({ ...start(s.round), misses: s.misses, hints: s.hints });

export type Event =
  | { kind: 'fit'; last: boolean }
  | { kind: 'wrong'; reason: Reason; counted: boolean }
  | { kind: 'sure-right' }
  | { kind: 'sure-wrong'; counted: boolean; other?: Ribbon }
  | { kind: 'look-wrong'; look: LookId; counted: boolean }
  | { kind: 'look-sand'; truth: Truth; stillFits: boolean }
  | { kind: 'hint'; step: HintStep | null; counted: boolean }
  | { kind: 'glow' }
  | { kind: 'ignored' };

export interface Result {
  state: State;
  events: Event[];
}

const miss = (s: State, events: Event[]): State => {
  const stepMisses = s.stepMisses + 1;
  let { hints, glowed } = s;
  if (stepMisses >= 2 && !glowed) {
    glowed = true;
    hints += 1;
    events.push({ kind: 'glow' });
  }
  return { ...s, misses: s.misses + 1, stepMisses, hints, glowed };
};

const nextStep = (s: State, step: Step): State => ({ ...s, step, stepMisses: 0, glowed: false });

/** Swap two slots. Never a miss. */
export function swap(s: State, i: number, j: number): State {
  if ((s.step !== 'order' && s.step !== 'again') || i === j) return s;
  const ribbon = [...s.ribbon];
  [ribbon[i], ribbon[j]] = [ribbon[j], ribbon[i]];
  return { ...s, ribbon };
}

export function check(s: State): Result {
  if (s.step !== 'order' && s.step !== 'again') return { state: s, events: [{ kind: 'ignored' }] };
  const reason = whyNot(s.ribbon, obsOf(s));
  if (!reason) {
    const last = s.step === 'again';
    return { state: nextStep(s, last ? 'done' : 'sure'), events: [{ kind: 'fit', last }] };
  }
  const k = `${s.record}:${key(s.ribbon)}`;
  if (s.counted.includes(k)) return { state: s, events: [{ kind: 'wrong', reason, counted: false }] };
  const events: Event[] = [{ kind: 'wrong', reason, counted: true }];
  const state = miss({ ...s, counted: [...s.counted, k] }, events);
  return { state, events };
}

export const rightAnswer = (s: State): Answer => (fitting(obsOf(s)).length === 1 ? 'yes' : 'unsure');

/** An order with the cliff's stack (A, B, C) that breaks a visible contact: the one the pet plays to show why only one fits. */
export const brokenNeighbour = (obs: Obs): Ribbon | undefined =>
  RIBBONS.find((r) => whyNot(r, obs)?.rule === 'cut' || whyNot(r, obs)?.rule === 'cover');

export function answer(s: State, a: Answer): Result {
  if (s.step !== 'sure') return { state: s, events: [{ kind: 'ignored' }] };
  if (a === rightAnswer(s)) {
    return { state: nextStep(s, s.round.level === 1 ? 'done' : 'look'), events: [{ kind: 'sure-right' }] };
  }
  // A wrong Yes (level 2) swaps to the other story that fits; a second wrong Yes swaps back, free. A wrong Not enough
  // to tell (level 1) shows one other order that keeps the stack but breaks a contact, and her ribbon stays.
  const other =
    a === 'yes' ? fitting(obsOf(s)).find((r) => !sameRibbon(r, s.ribbon)) : brokenNeighbour(obsOf(s));
  const ribbon = a === 'yes' && other ? [...other] : s.ribbon;
  if (s.sureMissed)
    return { state: { ...s, ribbon }, events: [{ kind: 'sure-wrong', counted: false, other }] };
  const events: Event[] = [{ kind: 'sure-wrong', counted: true, other }];
  return { state: miss({ ...s, ribbon, sureMissed: true }, events), events };
}

export function look(s: State, id: LookId): Result {
  if (s.step !== 'look') return { state: s, events: [{ kind: 'ignored' }] };
  if (id === 'look-sand') {
    const next = nextStep({ ...s, record: 'sand-off' }, 'again');
    return {
      state: next,
      events: [{ kind: 'look-sand', truth: s.round.truth, stillFits: fits(s.ribbon, obsOf(next)) }],
    };
  }
  if (s.lookMissed.includes(id))
    return { state: s, events: [{ kind: 'look-wrong', look: id, counted: false }] };
  const events: Event[] = [{ kind: 'look-wrong', look: id, counted: true }];
  return { state: miss({ ...s, lookMissed: [...s.lookMissed, id] }, events), events };
}

/** Show a hint: counts one hint per press that changes something. */
export function hint(s: State): Result {
  if (s.step === 'order' || s.step === 'again') {
    const step = hintStep(s.ribbon, obsOf(s));
    if (!step) return { state: s, events: [{ kind: 'hint', step: null, counted: false }] };
    const helped = s.helped.includes(step.card) ? s.helped : [...s.helped, step.card];
    return {
      state: { ...s, ribbon: step.ribbon, hints: s.hints + 1, helped },
      events: [{ kind: 'hint', step, counted: true }],
    };
  }
  if (s.step === 'sure' || s.step === 'look') {
    if (s.glowed) return { state: s, events: [{ kind: 'hint', step: null, counted: false }] };
    return {
      state: { ...s, glowed: true, hints: s.hints + 1 },
      events: [{ kind: 'hint', step: null, counted: true }],
    };
  }
  return { state: s, events: [{ kind: 'ignored' }] };
}

export const describeLevel = (level: number): string =>
  level >= 2
    ? 'Two stories fit: find the look that tells them apart'
    : 'Put four rock events in the order the cliff shows';
