import type { ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Secret Code, after Mastermind and Neopets' Time Tunnel, made gentle: a door opens with a hidden
 * row of colored stones. Fill the slots and try the key. Each slot then shows a mark:
 * green (right stone, right place), yellow (that stone is in the code, but elsewhere; later
 * levels only) or gray (not in the code). Guesses are unlimited and stay visible above the door.
 *
 * A guess is an experiment, never a mistake in itself. What counts as a miss is ignoring a clue:
 * trying a stone again in a slot where an earlier guess already ruled it out.
 */
export interface CodePlan {
  detective?: boolean;
  /** On a detective door, how many shown tries it starts with: at least `min`, and never more than `max`. */
  clues?: { min: number; max: number };
  slots: number;
  colors: number;
  /** Yellow marks for right-color-wrong-place; without them, a slot is only green or gray. */
  yellow: boolean;
  /** Whether a color may appear twice in the code. */
  repeats: boolean;
  codes: number;
  /** *Be the door*: she makes the code and marks the pet's tries; the pet does the cracking. */
  maker?: boolean;
  /** *One slot*: a gray crosses that stone out in the tray, and trying a crossed-out stone is the only miss. */
  oneSlot?: boolean;
  /** *Swap seats*: two halves, one code each. She makes and marks (a grown-up or the pet breaks it), then she breaks a code. */
  swap?: boolean;
  name: string;
}

/** Plans by level ID. ID 10, *One slot*, is the preschool opening, easier than level 1. */
export const PLANS: Readonly<Record<number, CodePlan>> = {
  1: { slots: 2, colors: 3, yellow: false, repeats: false, codes: 3, name: 'Two slots, three colors; each slot says yes or no' },
  2: { slots: 3, colors: 4, yellow: false, repeats: false, codes: 3, name: 'Three slots, four colors; each slot says yes or no' },
  3: { slots: 3, colors: 4, yellow: true, repeats: false, codes: 2, name: 'Yellow marks: the color is in the code, but in another slot' },
  4: { slots: 3, colors: 5, yellow: true, repeats: false, codes: 2, name: 'Three slots and five colors, with yellow marks' },
  5: { slots: 4, colors: 5, yellow: true, repeats: false, codes: 2, name: 'Four slots and five colors' },
  6: { slots: 3, colors: 4, yellow: true, repeats: true, codes: 2, name: 'A color can be used twice in the code' },
  7: { slots: 3, colors: 4, yellow: true, repeats: false, codes: 2, detective: true, clues: { min: 2, max: 3 }, name: 'Detective door: work out the one code that fits the shown guesses' },
  8: { slots: 4, colors: 5, yellow: true, repeats: true, codes: 2, name: 'Four slots, five colors, and one color used twice' },
  9: { slots: 3, colors: 4, yellow: true, repeats: true, codes: 2, maker: true, name: 'Be the door: she makes a code and marks the pet’s tries green, yellow or gray' },
  10: { slots: 1, colors: 3, yellow: false, repeats: false, codes: 3, oneSlot: true, name: 'One slot, three stones: which stone is behind the door? A gray cross rules a stone out' },
  11: { slots: 4, colors: 5, yellow: true, repeats: false, codes: 2, detective: true, clues: { min: 3, max: 3 }, name: 'A bigger detective door: four slots, five colors, and three shown guesses' },
  12: { slots: 3, colors: 4, yellow: true, repeats: true, codes: 1, maker: true, swap: true, name: 'Swap seats: she makes a code and marks a grown-up’s tries, then cracks the code they make (or plays it with the pet)' },
};

export const LEVELS: BandLevels = {
  // Level 10, One slot, opens preschool before level 1's two slots.
  preschool: { min: 1, max: 10, order: [10, 1] },
  prek: { min: 1, max: 3 },
  // Level 9, Be the door, marks yellow before four slots; level 12, Swap seats, uses 9's plan, so it follows it.
  school: { min: 2, max: 12, order: [2, 3, 4, 9, 12, 5, 6, 7, 8, 11] },
};

/** The plan for a level; an out-of-range ID falls back to an end (below 1, to 1; above 12, to 11, the top of the school order, never the two-seat 12). */
export const planFor = (level: number): CodePlan => PLANS[level] ?? (level > 12 ? PLANS[11] : PLANS[1]);

export const STONES: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple'];

export type Mark = 'green' | 'yellow' | 'gray';

export function makeCode(plan: CodePlan, rng: Rng): number[] {
  if (plan.repeats) {
    // Make sure there really is a repeat, so the new rule matters.
    for (;;) {
      const code = Array.from({ length: plan.slots }, () => rng.int(0, plan.colors - 1));
      if (new Set(code).size < plan.slots) return code;
    }
  }
  return rng.shuffle(Array.from({ length: plan.colors }, (_, i) => i)).slice(0, plan.slots);
}

/**
 * Marks for each slot of a guess. Green first; then yellow only for stones still unmatched in the
 * code (so a color is never marked yellow more times than it is missing). Without yellow, every
 * non-green slot is gray.
 */
export function score(code: number[], guess: number[], yellow: boolean): Mark[] {
  const marks: Mark[] = guess.map((g, i) => (g === code[i] ? 'green' : 'gray'));
  if (!yellow) return marks;
  const left = new Map<number, number>();
  code.forEach((c, i) => {
    if (marks[i] !== 'green') left.set(c, (left.get(c) ?? 0) + 1);
  });
  guess.forEach((g, i) => {
    if (marks[i] === 'green') return;
    const n = left.get(g) ?? 0;
    if (n > 0) {
      marks[i] = 'yellow';
      left.set(g, n - 1);
    }
  });
  return marks;
}

export interface Guess {
  stones: number[];
  marks: Mark[];
}

/**
 * Stones that a slot can no longer be: a gray or yellow mark in that slot rules that stone out
 * there; without yellow marks a gray means "not here" only. With yellow marks and no repeats, a
 * gray also rules the color out everywhere, unless the same color got a green or yellow elsewhere
 * in that guess (then the gray only means "no second one").
 */
export function ruledOut(plan: CodePlan, history: Guess[], slot: number): Set<number> {
  const out = new Set<number>();
  for (const g of history) {
    g.stones.forEach((s, i) => {
      if (g.marks[i] === 'green') return;
      if (i === slot) out.add(s);
      else if (plan.yellow && !plan.repeats && g.marks[i] === 'gray' && !g.stones.some((t, j) => t === s && g.marks[j] !== 'gray')) out.add(s);
    });
  }
  // A slot already solved rules out everything else.
  for (const g of history) if (g.marks[slot] === 'green') for (let c = 0; c < plan.colors; c++) if (c !== g.stones[slot]) out.add(c);
  return out;
}

/** How many past tries fit in the list above the door (newest nearest it; older ones are hidden). */
export const rowsThatFit = (doorY: number) => Math.max(1, Math.floor((doorY - 150 - 120) / 62) + 1);

/** The tries she can still see: only these count when a stone ignores a clue, so a scrolled-away mark is never a miss. */
export const visibleRows = (history: Guess[], fit: number) => history.slice(Math.max(0, history.length - fit));

/**
 * Slots where the new guess ignores an earlier clue: each counts as one miss. Pass only the rows
 * on screen (`visibleRows`).
 */
export function ignoredClues(plan: CodePlan, history: Guess[], guess: number[]): number[] {
  return guess.map((s, i) => (ruledOut(plan, history, i).has(s) ? i : -1)).filter((i) => i >= 0);
}

/** *One slot*: the tray stones a gray has crossed out on this door (tapping one is the level's only miss). */
export const crossedOut = (plan: CodePlan, history: Guess[]): Set<number> => (plan.oneSlot ? ruledOut(plan, history, 0) : new Set());

/** Every code still possible after these guesses. */
export function candidates(plan: CodePlan, history: Guess[]): number[][] {
  const out: number[][] = [];
  const build = (prefix: number[]) => {
    if (prefix.length === plan.slots) {
      if (!plan.repeats && new Set(prefix).size < plan.slots) return;
      if (history.every((h) => score(prefix, h.stones, plan.yellow).join() === h.marks.join())) out.push(prefix);
      return;
    }
    for (let c = 0; c < plan.colors; c++) build([...prefix, c]);
  };
  build([]);
  return out;
}

/**
 * A helpful next guess: one that agrees with every clue so far. The game recomputes it after every
 * try on a hinted door, so the faint stones never show a stone a newer mark ruled out.
 */
export function suggestion(plan: CodePlan, history: Guess[], code: number[]): number[] {
  const all = candidates(plan, history);
  return all.find((c) => c.join() !== code.join()) && all.length > 1 ? all[0] : code;
}

/**
 * What a player who reasons from the clues does next (the couch bot and the how-to card's ghost finger): put the next
 * stone of the first code that fits every mark so far into the first empty slot, and turn the key once every slot is full.
 */
export function nextMove(plan: CodePlan, history: Guess[], code: number[], guess: readonly (number | null)[]): { stone: number } | { key: true } {
  const empty = guess.indexOf(null);
  if (empty < 0) return { key: true };
  return { stone: (candidates(plan, history)[0] ?? code)[empty] };
}

/** How many turns of the key the reasoning player (`nextMove`) takes to open this code: a couch course's par for the door. */
export function solverTries(plan: CodePlan, code: number[]): number {
  const history: Guess[] = [];
  for (;;) {
    const guess: (number | null)[] = Array(plan.slots).fill(null);
    for (let move = nextMove(plan, history, code, guess); 'stone' in move; move = nextMove(plan, history, code, guess)) guess[guess.indexOf(null)] = move.stone;
    const marks = score(code, guess as number[], plan.yellow);
    history.push({ stones: guess as number[], marks });
    if (marks.every((m) => m === 'green')) return history.length;
  }
}

/** Build a seeded detective door whose shown clues (the plan's `clues`, all visible together) leave exactly one code.
 * Pick the clue that leaves the fewest candidates for this code; ties use the seeded order. A code the greedy
 * clues cannot pin down within the cap is redrawn from the same generator, so the door stays seeded.
 */
export function detectiveDoor(plan: CodePlan, rng: Rng): { code: number[]; history: Guess[] } {
  const { min, max } = plan.clues ?? { min: 2, max: 3 };
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = makeCode(plan, rng);
    const guesses = rng.shuffle(candidates(plan, []).filter((g) => g.join() !== code.join()));
    const history: Guess[] = [];
    while (history.length < max && (history.length < min || candidates(plan, history).length > 1)) {
      let best: Guess | undefined;
      let remaining = Infinity;
      for (const stones of guesses) {
        if (history.some((h) => h.stones.join() === stones.join())) continue;
        const clue = { stones, marks: score(code, stones, plan.yellow) };
        const count = candidates(plan, [...history, clue]).length;
        if (count < remaining) { best = clue; remaining = count; }
      }
      if (!best) break;
      history.push(best);
    }
    if (history.length >= min && candidates(plan, history).length === 1) return { code, history };
  }
  throw new Error(`Detective door needs more than ${max} clues`);
}

/** Detective guesses must agree with the whole evidence, including color quantities. */
export function contradictsClues(plan: CodePlan, history: Guess[], guess: number[]): boolean {
  return !candidates(plan, history).some((c) => c.join() === guess.join());
}

/** What the code hides behind: same slots, key and marks, only the picture around them changes. */
export const DOORS = ['door', 'gate', 'chest'] as const;
export type DoorKind = (typeof DOORS)[number];

/**
 * The picture for each door of a round: a seeded first kind, then the next kind for each door, so a round's doors
 * differ. It reads a clone of the round's generator, so choosing it never changes a code or a mark.
 */
export function doorKinds(rng: Rng, count: number): DoorKind[] {
  const start = new Rng(rng.clone().int(1, 2 ** 31 - 1) ^ 0x5eed).int(0, DOORS.length - 1);
  return Array.from({ length: count }, (_, i) => DOORS[(start + i) % DOORS.length]);
}

/** *Be the door*: a code she might make (any stones, repeats allowed); the how-to card's ghost finger makes this one. */
export const madeCode = (plan: CodePlan, rng: Rng): number[] => Array.from({ length: plan.slots }, () => rng.int(0, plan.colors - 1));

/** The pet's next try on *Be the door*: a seeded pick among the codes that fit every mark she has given so far. */
export function petTry(plan: CodePlan, history: Guess[], rng: Rng): number[] {
  const all = candidates(plan, history);
  return all[rng.int(0, all.length - 1)];
}

/** Tapping a mark disc: blank, then gray, yellow, green and round again. */
export const nextMark = (mark: Mark | null): Mark => (mark === 'gray' ? 'yellow' : mark === 'yellow' ? 'green' : 'gray');

/** Slots where her mark is not the one the pet's stone earns (`score`); each Show with any is one miss. Her code is never wrong. */
export function wrongMarks(code: number[], stones: number[], marks: readonly (Mark | null)[]): number[] {
  const right = score(code, stones, true);
  return right.map((m, i) => (marks[i] === m ? -1 : i)).filter((i) => i >= 0);
}

/** How many tries the pet takes on this code with right marks, drawing its picks from `rng`. */
export function petTries(plan: CodePlan, code: number[], rng: Rng): number {
  const history: Guess[] = [];
  for (;;) {
    const stones = petTry(plan, history, rng);
    const marks = score(code, stones, true);
    history.push({ stones, marks });
    if (marks.every((m) => m === 'green')) return history.length;
  }
}

/**
 * The how-to card's ghost finger makes a code the pet cracks quickly, so the demonstration fits its time: of a few seeded
 * codes, the one the pet would crack in the fewest tries from the round's generator as it stands. It reads clones only.
 */
export function demoCode(plan: CodePlan, rng: Rng): number[] {
  const draw = rng.clone();
  let best: number[] = [];
  let fewest = Infinity;
  for (let k = 0; k < 12; k++) {
    const code = madeCode(plan, draw);
    const tries = petTries(plan, code, rng.clone());
    if (tries < fewest) { best = code; fewest = tries; }
  }
  return best;
}

/**
 * *Swap seats*: the round's result. Every miss and hint is hers (seat 2's tries never count), but a round played with a
 * second person is supported completion: never smooth, so a grown-up's easy code or play cannot step her up. A struggle
 * still reads her own misses. Playing with the pet (*Just me*) passes her result unchanged.
 */
export function swapResult(twoSeats: boolean, misses: number, hints: number): { misses: number; hints: number } {
  return { misses, hints: twoSeats ? Math.max(hints, 1) : hints };
}

/**
 * The how-to card's ghost finger on *Swap seats*: of a few seeded codes, the one the reasoning player (`nextMove`) cracks
 * in the fewest tries, so both halves fit the demonstration's time. It reads a salted clone, so it never changes the round.
 */
export function quickCode(plan: CodePlan, rng: Rng, salt: number): number[] {
  const draw = new Rng(rng.clone().int(1, 2 ** 31 - 1) ^ salt);
  let best: number[] = [];
  let fewest = Infinity;
  for (let k = 0; k < 12; k++) {
    const code = madeCode(plan, draw);
    const tries = solverTries(plan, code);
    if (tries < fewest) { best = code; fewest = tries; }
  }
  return best;
}
