/**
 * Spinner Fair rules: six-wedge spinners whose spins are honest seeded draws, and questions the spinner's picture answers.
 * A spin is never a miss; only a question decides one: which bar is tallest after the spins (level 2) and which of two
 * spinners has more of the pet's favourite (level 3), whether the favourite is sure, maybe or no way on a spinner (level 4), and
 * whether a two-critter race is fair and the wheel is even at Check (level 5), and about how many of sixty more spins will
 * be the favourite, read from its share of the wheel (level 6), and which two-dice sum is most likely and which of two sums
 * comes up more, read from the grid of every way two dice can land (level 7), and how far apart six spins of a number
 * wheel are and what a typical spin is, read from the towers they stand as (level 8), and whether an eight-wedge wheel
 * she made gives the pet's favourite the share it asked for, judged at Check from the wedges and then borne out by
 * eighty spins that judge nothing (level 9). A roll, like a spin, is never a miss, and neither is any block or wedge
 * she moves.
 * Definitions: docs/definitions/spinner-fair.md (levels 1–5), docs/definitions/spinner-fair-6-8.md (levels 6–8),
 * docs/definitions/spinner-fair-9-10.md (levels 9–11).
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Kind = 'duck' | 'pig' | 'bunny' | 'cat' | 'cow' | 'dog';
export const KINDS: readonly Kind[] = ['duck', 'pig', 'bunny', 'cat', 'cow', 'dog'];
/** Each critter's body colour (the same as `CRITTERS`; a test compares them). Two critters of one colour never share a wheel. */
export const COLOR_OF: Record<Kind, string> = {
  duck: 'yellow',
  pig: 'pink',
  bunny: 'white',
  cat: 'orange',
  cow: 'white',
  dog: 'brown',
};
export const NAME_OF: Record<Kind, string> = {
  duck: 'Duck',
  pig: 'Pig',
  bunny: 'Bunny',
  cat: 'Cat',
  cow: 'Cow',
  dog: 'Dog',
};

/** A spinner has six wedges of 60° (level 9's has eight, `RIG_WEDGES`), each owner's wedges one contiguous section from wedge 0. */
export const WEDGES = 6;
export const WEDGE_DEG = 360 / WEDGES;
/** A stop lands at least this far inside its 60° wedge (9° inside a 45° one, in proportion), so the pointer never rests on a line. */
export const EDGE_DEG = 12;
/** Level 9's wheel: eight wedges of 45°. */
export const RIG_WEDGES = 8;
export type Wheel = readonly Kind[];

export type Ask = 'see' | 'most' | 'pick' | 'sure' | 'fair' | 'settle' | 'dice' | 'typical' | 'rig' | 'due';
export interface Plan {
  level: number;
  ask: Ask;
  name: string;
  /** Sets (levels 1–2, 4, 6–10), picks (level 3) or races (level 5) in a round. */
  sets: number;
  /** Spins in a set (level 4: one showing spin per spinner; level 5: the race; level 6: the three runs together; level 7: rolls of the two dice; level 8: the six spins that stand as towers; level 9: the proof run; level 10: the cap on the run that waits for a streak); the spinner or tray stops taking them after this many. */
  spins: number;
}

const PLANS: readonly Plan[] = [
  { level: 1, ask: 'see', name: 'Spin and see', sets: 1, spins: 6 },
  { level: 2, ask: 'most', name: 'Which came up most?', sets: 2, spins: 8 },
  { level: 3, ask: 'pick', name: 'Pick the spinner', sets: 2, spins: 10 },
  { level: 4, ask: 'sure', name: 'Sure, maybe, no way', sets: 2, spins: 1 },
  { level: 5, ask: 'fair', name: 'Fair or unfair?', sets: 2, spins: 6 },
  { level: 6, ask: 'settle', name: 'Watch it settle', sets: 2, spins: 240 },
  { level: 7, ask: 'dice', name: 'Two dice', sets: 1, spins: 12 },
  { level: 8, ask: 'typical', name: 'The typical spin', sets: 2, spins: 6 },
  { level: 9, ask: 'rig', name: 'Rig it', sets: 2, spins: 80 },
  { level: 10, ask: 'due', name: 'Is it due?', sets: 2, spins: 240 },
];

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 10 },
};

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.level === level) ?? PLANS[0];
}

/** Level 3's favourite wedge counts on the two spinners: a gap of at least two wedges, possible on both, certain on neither. */
export const PICK_PAIRS: readonly (readonly [number, number])[] = [
  [1, 3],
  [1, 4],
  [1, 5],
  [2, 4],
  [2, 5],
  [3, 5],
];

export interface SetSpec {
  /** One spinner (levels 1–2, 5), two side by side (level 3) or three in a row (level 4). */
  wheels: Wheel[];
  /** Levels 3–4 and 6: the pet's favourite; level 3: the spinner (0 or 1) with more of it. */
  favourite?: Kind;
  better?: number;
  /** Level 4: the three cards in the tray, left to right. */
  cards?: Card[];
  /** Level 5: the two racers; the wheel holds the first's wedges, then the second's. */
  racers?: [Kind, Kind];
  /** Levels 6 and 9–10: the other critter on the wheel; level 6: how many of the six wedges the favourite has. */
  friend?: Kind;
  k?: number;
  /** Level 9: the share the pet asks for, `k` of the eight wedges, spoken as `n` out of every `of`. */
  target?: RigTarget;
}

// ---- wheels ----

/** `n` critters, no two of one kind or one colour, none in `avoid`. */
export function pickCritters(rng: Rng, n: number, avoid: readonly Kind[] = []): Kind[] {
  const out: Kind[] = [];
  const pool = rng.shuffle(KINDS.filter((k) => !avoid.includes(k)));
  for (const k of pool) {
    if (out.length === n) break;
    if (out.some((o) => COLOR_OF[o] === COLOR_OF[k])) continue;
    if (avoid.some((o) => COLOR_OF[o] === COLOR_OF[k])) continue;
    out.push(k);
  }
  return out;
}

/** Three critters, two wedges each. */
export function evenWheel(rng: Rng): Wheel {
  const [a, b, c] = pickCritters(rng, 3);
  return [a, a, b, b, c, c];
}

/** A wheel with `count` wedges of `fav` and the rest shared by one or two other critters. */
export function wheelWith(rng: Rng, fav: Kind, count: number): Wheel {
  const rest = WEDGES - count;
  const split = rest >= 2 && rng.chance(0.5);
  const others = pickCritters(rng, split ? 2 : 1, [fav]);
  const k = split ? rng.int(1, rest - 1) : rest;
  return [
    ...Array(count).fill(fav),
    ...Array(k).fill(others[0]),
    ...(split ? Array(rest - k).fill(others[1]) : []),
  ];
}

/** Level 4: six of the favourite, some (2–4), and none (one or two other critters), in a seeded order. */
export function sureSet(rng: Rng, fav: Kind): SetSpec {
  const none = (): Wheel => {
    const others = pickCritters(rng, rng.chance(0.5) ? 2 : 1, [fav]);
    if (others.length === 1) return Array(WEDGES).fill(others[0]);
    const k = rng.int(2, 4);
    return [...Array(k).fill(others[0]), ...Array(WEDGES - k).fill(others[1])];
  };
  const wheels = rng.shuffle([Array(WEDGES).fill(fav) as Wheel, wheelWith(rng, fav, rng.int(2, 4)), none()]);
  return { wheels, favourite: fav, cards: rng.shuffle([...CARDS]) };
}

/** Level 5: two racers sharing one wheel. Race 1 starts uneven (4–2 or 5–1); race 2 is fair or uneven, seeded. */
export function raceSet(rng: Rng, first: boolean): SetSpec {
  const racers = pickCritters(rng, 2) as [Kind, Kind];
  const big = first || rng.chance(0.5) ? rng.pick([4, 5]) : 3;
  const a = rng.chance(0.5) ? big : WEDGES - big;
  return { wheels: [raceWheel(racers, a)], racers };
}

export function makeRound(level: number, rng: Rng): SetSpec[] {
  const plan = planFor(level);
  const out: SetSpec[] = [];
  if (plan.ask === 'settle') {
    const fav = pickCritters(rng, 1)[0];
    for (let i = 0; i < plan.sets; i++) out.push(settleSet(rng, fav, out));
    return out;
  }
  if (plan.ask === 'rig') {
    const fav = pickCritters(rng, 1)[0];
    for (let i = 0; i < plan.sets; i++) out.push(rigSet(rng, fav, i === 0, out[i - 1]?.friend));
    return out;
  }
  if (plan.ask === 'due') {
    // One even wheel and one uneven one, in seeded order.
    const fav = pickCritters(rng, 1)[0];
    const evenFirst = rng.chance(0.5);
    for (let i = 0; i < plan.sets; i++)
      out.push(dueSet(rng, fav, (i === 0) === evenFirst, out[i - 1]?.friend));
    return out;
  }
  for (let i = 0; i < plan.sets; i++) {
    if (plan.ask === 'sure') {
      const fav =
        pickCritters(
          rng,
          1,
          out.map((s) => s.favourite!),
        )[0] ?? pickCritters(rng, 1)[0];
      out.push(sureSet(rng, fav));
      continue;
    }
    if (plan.ask === 'fair') {
      out.push(raceSet(rng, i === 0));
      continue;
    }
    if (plan.ask !== 'pick') {
      out.push({ wheels: [evenWheel(rng)] });
      continue;
    }
    const [a, b] = rng.pick(PICK_PAIRS);
    const flip = rng.chance(0.5);
    const counts = flip ? [b, a] : [a, b];
    const favourite =
      pickCritters(
        rng,
        1,
        out.map((s) => s.favourite!),
      )[0] ?? pickCritters(rng, 1)[0];
    out.push({ wheels: counts.map((c) => wheelWith(rng, favourite, c)), favourite, better: flip ? 0 : 1 });
  }
  return out;
}

export const countOf = (wheel: Wheel, kind: Kind) => wheel.filter((k) => k === kind).length;

/** The wheel's sections in order: each critter's first wedge and how many wedges it has. */
export function sections(wheel: Wheel): { kind: Kind; start: number; count: number }[] {
  const out: { kind: Kind; start: number; count: number }[] = [];
  wheel.forEach((k, i) => {
    const last = out[out.length - 1];
    if (last && last.kind === k) last.count++;
    else out.push({ kind: k, start: i, count: 1 });
  });
  return out;
}

/** The critters of a wheel in section order: one bar each. */
export const kindsOf = (wheel: Wheel): Kind[] => sections(wheel).map((s) => s.kind);

/** Each owner's wedges form one section (no critter appears in two sections). */
export function contiguous(wheel: Wheel): boolean {
  const kinds = kindsOf(wheel);
  return new Set(kinds).size === kinds.length;
}

/** The spinner with more of the favourite (level 3's right answer, judged by the picture). */
export function betterOf(set: SetSpec): number {
  const [a, b] = set.wheels.map((w) => countOf(w, set.favourite!));
  return a > b ? 0 : 1;
}

// ---- level 4: sure, maybe, no way ----

export type Card = 'sure' | 'maybe' | 'none';
export const CARDS: readonly Card[] = ['sure', 'maybe', 'none'];

/** The card a spinner fits for a critter: all six wedges is sure, none is no way, anything between is maybe. */
export function cardFor(wheel: Wheel, kind: Kind): Card {
  const n = countOf(wheel, kind);
  return n === WEDGES ? 'sure' : n === 0 ? 'none' : 'maybe';
}

export const fits = (card: Card, wheel: Wheel, kind: Kind) => cardFor(wheel, kind) === card;

/** The spinner (index) each card fits on a level-4 set. */
export const homeOf = (set: SetSpec, card: Card) =>
  set.wheels.findIndex((w) => fits(card, w, set.favourite!));

// ---- level 5: fair or unfair? ----

/** The racers' wheel of `wedges` wedges: `a` of the first racer, then the rest of the second, so each owner is one section. */
export const raceWheel = (racers: readonly [Kind, Kind], a: number, wedges = WEDGES): Wheel => [
  ...Array(a).fill(racers[0]),
  ...Array(wedges - a).fill(racers[1]),
];

/** Fair means both racers have the same share: three wedges each. */
export const isFair = (wheel: Wheel, racers: readonly [Kind, Kind]) =>
  countOf(wheel, racers[0]) === countOf(wheel, racers[1]);

/**
 * Hand one wedge to `to` from the other racer, on a wheel of any size; the wheel re-sorts so each owner stays one section. A racer always keeps at
 * least one wedge (so both stay on the wheel); a give that would take the last one returns null and changes nothing.
 */
export function give(wheel: Wheel, racers: readonly [Kind, Kind], to: Kind): Wheel | null {
  const from = to === racers[0] ? racers[1] : racers[0];
  if (countOf(wheel, from) <= 1) return null;
  return raceWheel(racers, countOf(wheel, racers[0]) + (to === racers[0] ? 1 : -1), wheel.length);
}

/** The racer the next wedge should go to (the hint and the ghost): the one with fewer, or null once the wheel is fair. */
export function nextGive(wheel: Wheel, racers: readonly [Kind, Kind]): Kind | null {
  const [a, b] = racers.map((k) => countOf(wheel, k));
  return a === b ? null : a < b ? racers[0] : racers[1];
}

/** The track: a racer moves one step for each spin it wins. */
export const TRACK = 6;
export function racePositions(racers: readonly [Kind, Kind], results: readonly Kind[]): [number, number] {
  const [a, b] = tally(racers, results);
  return [Math.min(TRACK, a), Math.min(TRACK, b)];
}

// ---- level 6: watch it settle ----

/** The favourite's wedges on a level-6 wheel: one, three or five sixths, so "about" is ten, thirty or fifty of sixty. */
export const SETTLE_K: readonly number[] = [1, 3, 5];
/** The spins standing after each of the three runs; the last is the plan's `spins`. */
export const SETTLE_RUNS: readonly number[] = [12, 60, 240];
/** The check run after the question: sixty more spins, never judged. */
export const CHECK_SPINS = 60;
/** The three answer cards, left to right: about this many of the next sixty. */
export const ABOUT_CARDS: readonly number[] = [10, 30, 50];

/**
 * A level-6 set: the favourite with `k` of six wedges and one friend with the rest. `used` holds the round's earlier sets:
 * this set's `k` differs from theirs, and its friend from the last one.
 */
export function settleSet(rng: Rng, fav: Kind, used: readonly SetSpec[] = []): SetSpec {
  const free = SETTLE_K.filter((k) => !used.some((s) => s.k === k));
  const k = rng.pick(free.length ? free : SETTLE_K);
  const last = used[used.length - 1]?.friend;
  const friend = pickCritters(rng, 1, last ? [fav, last] : [fav])[0] ?? pickCritters(rng, 1, [fav])[0];
  return { wheels: [raceWheel([fav, friend], k)], favourite: fav, friend, k };
}

/** About how many of sixty spins a share of `k` sixths gives: ten for each wedge. */
export const expected60 = (k: number) => 10 * k;
/** The card is right when it names the share's count; the answer comes from the wedges, never from a run. */
export const aboutRight = (card: number, k: number) => card === expected60(k);
/**
 * A check run "about" the share: within ten of ten a wedge. Outside is unusual, never a miss and never spun again. The
 * same band serves level 9's eighty spins on eight wedges, where a wedge is ten of eighty.
 */
export const inBand = (count: number, k: number) => Math.abs(count - expected60(k)) <= 10;

// ---- level 9: rig it ----

/** The share the pet asks for: `k` of the eight wedges, spoken in lowest terms as `n` out of every `of` spins. */
export interface RigTarget {
  k: number;
  n: number;
  of: number;
}
/** Set one asks for eighths, set two for quarters; a half (level 5's fair wheel) is never asked. */
export const RIG_EIGHTHS: readonly number[] = [1, 3, 5, 7];
export const RIG_QUARTERS: readonly number[] = [2, 6];
/** The proof run after a right Check: ten spins a wedge, never judged and never spun again. */
export const PROOF_SPINS = 80;

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** `k` eighths in lowest terms. */
export function rigTarget(k: number): RigTarget {
  const d = gcd(k, RIG_WEDGES);
  return { k, n: k / d, of: RIG_WEDGES / d };
}

/**
 * A level-9 set: the favourite and one friend on an eight-wedge wheel that starts even (4–4), and the share to make:
 * eighths on the round's first set, quarters on its second. The friend is never `lastFriend`.
 */
export function rigSet(rng: Rng, fav: Kind, first: boolean, lastFriend?: Kind): SetSpec {
  const friend =
    pickCritters(rng, 1, lastFriend ? [fav, lastFriend] : [fav])[0] ?? pickCritters(rng, 1, [fav])[0];
  const target = rigTarget(rng.pick(first ? RIG_EIGHTHS : RIG_QUARTERS));
  const racers: [Kind, Kind] = [fav, friend];
  return {
    wheels: [raceWheel(racers, RIG_WEDGES / 2, RIG_WEDGES)],
    favourite: fav,
    friend,
    racers,
    k: target.k,
    target,
  };
}

/** Check is right when the favourite has exactly `k` wedges: judged from the wheel, never from a spin. */
export const rigRight = (wheel: Wheel, fav: Kind, k: number) => countOf(wheel, fav) === k;

/** The critter the next wedge goes to (the hint and the ghost): the favourite while it has too few, the friend while it has too many, null once right. */
export function nextRig(wheel: Wheel, racers: readonly [Kind, Kind], k: number): Kind | null {
  const have = countOf(wheel, racers[0]);
  return have === k ? null : have < k ? racers[0] : racers[1];
}

// ---- level 10: is it due? ----

/** The run stops at the first spin where one critter has come up this many times running. */
export const STREAK = 5;
/** ... or at this many spins (about 2 runs in 10 000 on an even wheel), when the longest streak so far is shown instead. */
export const STREAK_CAP = 240;

/**
 * A level-10 set: the favourite and one friend on a six-wedge wheel, even (3–3) or uneven (the favourite 4 or 2 of the
 * six, seeded). The friend is never `lastFriend`.
 */
export function dueSet(rng: Rng, fav: Kind, even: boolean, lastFriend?: Kind): SetSpec {
  const friend =
    pickCritters(rng, 1, lastFriend ? [fav, lastFriend] : [fav])[0] ?? pickCritters(rng, 1, [fav])[0];
  const racers: [Kind, Kind] = [fav, friend];
  const a = even ? WEDGES / 2 : rng.pick([4, 2]);
  return { wheels: [raceWheel(racers, a)], favourite: fav, friend, racers };
}

/** The run at the end of `results`: who came up last and how many times running (length 0 before any spin). */
export function runAt(results: readonly Kind[]): { kind: Kind | null; length: number } {
  const kind = results[results.length - 1] ?? null;
  let length = 0;
  while (length < results.length && results[results.length - 1 - length] === kind) length++;
  return { kind, length };
}

/**
 * Honest spins of `wheel` until the last `STREAK` agree, or `cap` spins: every one is `spin(rng)`, in order, none
 * skipped, filtered or drawn again. The rule only says when to stop looking; it never touches a spin.
 */
export function streakRun(rng: Rng, wheel: Wheel, cap = STREAK_CAP): Spin[] {
  const out: Spin[] = [];
  let last: Kind | null = null,
    run = 0;
  while (out.length < cap && run < STREAK) {
    const s = spin(rng);
    out.push(s);
    const kind = wheel[s.wedge];
    run = kind === last ? run + 1 : 1;
    last = kind;
  }
  return out;
}

/** The longest run of one critter in `results`, the latest when several are as long; `end` is its last spin's index. */
export function longestStreak(results: readonly Kind[]): { kind: Kind | null; length: number; end: number } {
  let best = { kind: null as Kind | null, length: 0, end: -1 };
  let run = 0;
  results.forEach((kind, i) => {
    run = i > 0 && results[i - 1] === kind ? run + 1 : 1;
    if (run >= best.length) best = { kind, length: run, end: i };
  });
  return best;
}

/** A level-10 answer: one of the two critters, or the same. */
export type DueCard = Kind | 'same';
/** The three cards, left to right: the favourite, the friend, the same. */
export const dueCards = (racers: readonly [Kind, Kind]): DueCard[] => [racers[0], racers[1], 'same'];

/**
 * Who is more likely on the next spin: the same on an even wheel, otherwise the critter with more wedges. It reads the
 * wheel and nothing else: no result, run or streak can enter it.
 */
export function dueRight(wheel: Wheel, racers: readonly [Kind, Kind]): DueCard {
  const [a, b] = racers.map((k) => countOf(wheel, k));
  return a === b ? 'same' : a > b ? racers[0] : racers[1];
}

// ---- level 7: two dice ----

/** One roll of the two dice: the first die, then the second. */
export type Roll = readonly [number, number];
/** The eleven sums two dice can make, 2 to 12: one bar each. */
export const SUMS: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const sumOf = (r: Roll) => r[0] + r[1];

/** One honest roll: each die a uniform face, 1 to 6. Nothing filters or retries it, and a roll is never judged. */
export function roll(rng: Rng): Roll {
  return [rng.int(1, 6), rng.int(1, 6)];
}

/** How many of the 36 squares make `sum`: one for 2, up to six for 7, back down to one for 12. */
export const ways = (sum: number) => (sum >= 2 && sum <= 12 ? 6 - Math.abs(sum - 7) : 0);

/** The grid of every way two dice can land: row `a` (the first die, 1–6) holds the sums with the second die 1–6. */
export function gridRows(): number[][] {
  return [1, 2, 3, 4, 5, 6].map((a) => [1, 2, 3, 4, 5, 6].map((b) => a + b));
}

/** The eleven bars after the grid's first `squares` squares (row by row): how many of them make each sum. */
export function waysTally(squares = 36): number[] {
  const shown = gridRows().flat().slice(0, squares);
  return SUMS.map((s) => shown.filter((x) => x === s).length);
}

/** The eleven roll bars: how many of `rolls` made each sum. */
export function rollTally(rolls: readonly Roll[]): number[] {
  return SUMS.map((s) => rolls.filter((r) => sumOf(r) === s).length);
}

/** The rolls did not show seven alone on top (twelve rolls often do not), so the pet says the squares show every way. */
export function rollsMislead(rolls: readonly Roll[]): boolean {
  const t = rollTally(rolls);
  return tallest(t).length !== 1 || tallest(t)[0] !== SUMS.indexOf(7);
}

/** Question one's three cards, in a seeded order: 7, and two other sums whose square counts differ (both fewer than six). */
export function mostCards(rng: Rng): number[] {
  const [a, ...rest] = rng.shuffle(SUMS.filter((s) => s !== 7));
  const b = rest.find((s) => ways(s) !== ways(a))!;
  return rng.shuffle([7, a, b]);
}

/** Question two's two cards, in a seeded order: two sums, neither 7, whose square counts differ, so one comes up more. */
export function pairCards(rng: Rng): [number, number] {
  const [a, ...rest] = rng.shuffle(SUMS.filter((s) => s !== 7));
  return [a, rest.find((s) => ways(s) !== ways(a))!];
}

/** The card with the most squares: the right answer to either question, read from the grid and never from the rolls. */
export const moreWays = (cards: readonly number[]) =>
  cards.reduce((best, s) => (ways(s) > ways(best) ? s : best));

// ---- level 8: the typical spin ----

/** A number wheel: the numbers 1–6 once each, one to a wedge, so `spin(rng)` gives each number exactly a sixth. */
export type NumWheel = readonly number[];
/** A column holds this many blocks and no more (seven 45-unit blocks in a 330-unit column). */
export const MAX_TOWER = 7;

/** The numbers 1–6 in a seeded order, so the wheel does not always read clockwise. */
export const numWheel = (rng: Rng): NumWheel => rng.shuffle([1, 2, 3, 4, 5, 6]);

/** Spin `i` stands as tower `i`, as many blocks as its number. */
export const towersOf = (spins: readonly number[]): number[] => spins.slice();

/** How far apart the biggest and smallest are. */
export const range = (towers: readonly number[]) => Math.max(...towers) - Math.min(...towers);

/** The leftmost tallest tower and the leftmost shortest: the two the pet points at for the range. */
export const extremes = (towers: readonly number[]) => ({
  tall: towers.indexOf(Math.max(...towers)),
  short: towers.indexOf(Math.min(...towers)),
});

/** The range question's three cards, in a seeded order: the range and two other numbers from 0–5. */
export function rangeCards(rng: Rng, r: number): number[] {
  const others = rng.shuffle([0, 1, 2, 3, 4, 5].filter((n) => n !== r));
  return rng.shuffle([r, others[0], others[1]]);
}

/**
 * One block from the top of `from` onto `to`: the total never changes. Refused (null) from an empty tower, onto itself
 * or onto a tower that already fills its column.
 */
export function moveBlock(towers: readonly number[], from: number, to: number): number[] | null {
  if (from === to || !(towers[from] > 0) || !(towers[to] < MAX_TOWER)) return null;
  return towers.map((h, i) => (i === from ? h - 1 : i === to ? h + 1 : h));
}

/** A move onto a tower at least as tall as the one it left: allowed and said gently, never a miss. */
export const tallerMove = (towers: readonly number[], from: number, to: number) => towers[to] >= towers[from];

/** As level as honest spins allow: the tallest and shortest differ by at most one block. */
export const nearlyLevel = (towers: readonly number[]) => range(towers) <= 1;

/** The right answers to "what would every spin be?": the heights nearly level towers show (one when the mean is whole, the two around it otherwise). */
export function typicalAccepted(towers: readonly number[]): number[] {
  const mean = towers.reduce((a, b) => a + b, 0) / towers.length;
  const lo = Math.floor(mean),
    hi = Math.ceil(mean);
  return lo === hi ? [lo] : [lo, hi];
}

/** The typical question's three cards, in a seeded order: three numbers from 1–6 holding every accepted height. */
export function typicalCards(rng: Rng, towers: readonly number[]): number[] {
  const right = typicalAccepted(towers);
  const others = rng.shuffle([1, 2, 3, 4, 5, 6].filter((n) => !right.includes(n)));
  return rng.shuffle([...right, ...others.slice(0, 3 - right.length)]);
}

/** The sure levelling move (the hint and the ghost finger): a block from the tallest tower to the shortest; null once nearly level. */
export function nextMove(towers: readonly number[]): { from: number; to: number } | null {
  if (nearlyLevel(towers)) return null;
  const { tall, short } = extremes(towers);
  return { from: tall, to: short };
}

// ---- spins ----

export interface Spin {
  /** The wedge under the pointer, from 0, uniform over wedges. */
  wedge: number;
  /** Where it stops, in degrees clockwise from the wheel's wedge-0 edge, inside the wedge and clear of its lines. */
  angle: number;
}

/**
 * One honest spin of a wheel of `wedges` wedges: a uniform wedge and a stopping angle a fifth of a wedge inside it
 * (`EDGE_DEG` on six). Nothing filters or retries it. With the default it draws from `rng` exactly as it always has.
 */
export function spin(rng: Rng, wedges = WEDGES): Spin {
  const deg = 360 / wedges,
    edge = (EDGE_DEG * deg) / WEDGE_DEG;
  const wedge = rng.int(0, wedges - 1);
  const angle = wedge * deg + edge + rng.next() * (deg - 2 * edge);
  return { wedge, angle };
}

/** `n` honest spins in a row (level 6's runs, level 9's proof run): each one `spin(rng, wedges)`, none filtered, shortened or drawn again. */
export function spinRun(rng: Rng, n: number, wedges = WEDGES): Spin[] {
  return Array.from({ length: n }, () => spin(rng, wedges));
}

/** The wheel's rotation (radians, clockwise) that brings wheel angle `angle` under the top pointer after `turns` more whole turns from `from`. */
export function stopRotation(from: number, angle: number, turns: number): number {
  const target = (-angle * Math.PI) / 180;
  const full = Math.PI * 2;
  let r = target + Math.ceil((from - target) / full) * full;
  if (r <= from) r += full;
  return r + turns * full;
}

/** The wedge under the top pointer for a wheel of `wedges` wedges turned by `rotation` radians. */
export function wedgeAt(rotation: number, wedges = WEDGES): number {
  const deg = ((((-rotation * 180) / Math.PI) % 360) + 360) % 360;
  return Math.floor(deg / (360 / wedges)) % wedges;
}

/** Blocks per bar: how many times each of `kinds` came up in `results`. */
export function tally(kinds: readonly Kind[], results: readonly Kind[]): number[] {
  return kinds.map((k) => results.filter((r) => r === k).length);
}

/** Every bar with the most blocks (a tie keeps both). */
export function tallest(counts: readonly number[]): number[] {
  const max = Math.max(...counts);
  return counts.flatMap((c, i) => (c === max ? [i] : []));
}

// ---- layout (logical units; the pet keeps the bottom-left corner, the shell the top corners) ----

export interface Pt {
  x: number;
  y: number;
}
export interface Circle extends Pt {
  r: number;
}
export interface Box extends Pt {
  w: number;
  h: number;
}
export const BIG = 210,
  SMALL = 150,
  COL_W = 120,
  COL_GAP = 20,
  FACE = 70,
  BAR_H = 320,
  STAND = 50;

export interface Layout {
  portrait: boolean;
  /** The one spinner of levels 1–2, and level 3's after the pick. */
  spinner: Circle;
  /** Level 3's two spinners before the pick. */
  pair: [Circle, Circle];
  /** The pet's favourite, between the two spinners. */
  favourite: Box;
  /** The bars' baseline (under the blocks, above the faces). */
  base: number;
  /** One tap column per bar: from the face to the top of the tallest bar the set can make. */
  columns: Box[];
}

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export function layout(view: { w: number; h: number }, bars: number): Layout {
  const { w, h } = view;
  const portrait = h > w;
  const span = bars * COL_W + (bars - 1) * COL_GAP;
  const cols = (left: number, base: number) =>
    Array.from({ length: bars }, (_, i) =>
      box(left + COL_W / 2 + i * (COL_W + COL_GAP), base - BAR_H / 2 + FACE / 2, COL_W, BAR_H + FACE),
    );
  if (!portrait) {
    const cy = Math.max(140 + BIG, Math.min(h / 2 - 20, 350));
    const spinner = { x: 140 + BIG, y: cy, r: BIG };
    const base = cy + BIG + STAND - FACE;
    const left = Math.min(w - 40 - span, spinner.x + BIG + 70);
    const pcy = h / 2 - 10;
    return {
      portrait,
      spinner,
      pair: [
        { x: w / 2 - SMALL - 50, y: pcy, r: SMALL },
        { x: w / 2 + SMALL + 50, y: pcy, r: SMALL },
      ],
      favourite: box(w / 2, pcy - SMALL - 20, 120, 120),
      base,
      columns: cols(left, base),
    };
  }
  const cx = w / 2;
  const spinner = { x: cx, y: 120 + BIG + 10, r: BIG };
  const base = h - 40 - FACE;
  return {
    portrait,
    spinner,
    pair: [
      { x: cx - 40, y: 130 + SMALL, r: SMALL },
      { x: cx - 40, y: 130 + SMALL * 3 + 110, r: SMALL },
    ],
    favourite: box(Math.min(w - 90, cx + SMALL + 110), 130 + SMALL * 2 + 55, 120, 120),
    base,
    columns: cols(cx - span / 2 + 40, base),
  };
}

/** Level 4: three 240-unit spinners (each a drop zone), a slot under or beside each for its card, and the tray of three cards. */
export const MID = 120,
  CARD_W = 130,
  CARD_H = 150;
export interface SureLayout {
  portrait: boolean;
  spinners: Circle[];
  /** Where a card that fits sits, one per spinner. */
  slots: Box[];
  tray: Box[];
  /** The pet's favourite, in a bubble out of the way. */
  favourite: Box;
}

export function sureLayout(view: { w: number; h: number }): SureLayout {
  const { w, h } = view;
  const rim = MID + 8;
  if (h <= w) {
    // A row of spinners, each card's slot under its spinner, and the tray along the bottom.
    const cy = Math.min(320, h - 450);
    const mid = Math.min(w / 2 + 40, w - 140 - 2 * (rim + 12));
    const xs = [mid - 280, mid, mid + 280];
    const trayY = h - 20 - CARD_H / 2;
    return {
      portrait: false,
      spinners: xs.map((x) => ({ x, y: cy, r: MID })),
      slots: xs.map((x) => box(x, cy + rim + 2 + CARD_H / 2, CARD_W, CARD_H)),
      tray: [-170, 0, 170].map((dx) => box(mid + dx, trayY, CARD_W, CARD_H)),
      favourite: box(w - 30 - 55, trayY, 110, 110),
    };
  }
  // Upright: a column of spinners clear of the pet, each card's slot beside it, and the tray as a column on the right.
  const cx = Math.min(300, w - 428);
  const top = 160,
    bottom = h - 170 - rim;
  const ys = [top, (top + bottom) / 2, bottom];
  const trayX = w - 20 - CARD_W / 2;
  const trayTop = 130 + CARD_H / 2 + 10;
  return {
    portrait: true,
    spinners: ys.map((y) => ({ x: cx, y, r: MID })),
    slots: ys.map((y) => box(cx + rim + 10 + CARD_W / 2, y, CARD_W, CARD_H)),
    tray: [0, 1, 2].map((i) => box(trayX, trayTop + i * ((bottom - trayTop) / 2), CARD_W, CARD_H)),
    favourite: box(w - 30 - 55, h - 30 - 55, 110, 110),
  };
}

/** Level 5: one 420-unit spinner with its wedges, two racers on six-step tracks, and the fair, unfair and Check buttons. */
export const RACER = 140,
  BTN_W = 140,
  BTN_H = 110,
  CHECK_W = 130;
export interface RaceLayout {
  portrait: boolean;
  spinner: Circle;
  /** Each racer's box at step `s` of its track (0 = the start). */
  racerAt(i: number, s: number): Box;
  /** Each track's whole length, start to finish. */
  tracks: Box[];
  fair: Box;
  unfair: Box;
  check: Box;
}

export function raceLayout(view: { w: number; h: number }): RaceLayout {
  const { w, h } = view;
  const rim = BIG + 8;
  if (h <= w) {
    const cy = Math.min(350, h - 140 - rim);
    const spinner = { x: 140 + BIG, y: cy, r: BIG };
    const by = h - 20 - BTN_H / 2;
    const right = w - 30 - RACER / 2;
    const xs = [right - RACER - 30, right];
    const top = 140,
      bottom = h - 20;
    const step = (bottom - top - RACER) / TRACK;
    return {
      portrait: false,
      spinner,
      racerAt: (i, s) => box(xs[i], bottom - RACER / 2 - s * step, RACER, RACER),
      tracks: xs.map((x) => box(x, (top + bottom) / 2, RACER, bottom - top)),
      fair: box(220 + BTN_W / 2, by, BTN_W, BTN_H),
      unfair: box(220 + BTN_W * 1.5 + 20, by, BTN_W, BTN_H),
      check: box(220 + 2 * BTN_W + 40 + CHECK_W / 2, by, CHECK_W, BTN_H),
    };
  }
  const spinner = { x: w / 2, y: 120 + BIG, r: BIG };
  const ys = [spinner.y + rim + 10 + RACER / 2, spinner.y + rim + 20 + RACER * 1.5];
  const left = 30,
    right = w - 30;
  const step = (right - left - RACER) / TRACK;
  const by = h - 20 - BTN_H / 2;
  return {
    portrait: true,
    spinner,
    racerAt: (i, s) => box(left + RACER / 2 + s * step, ys[i], RACER, RACER),
    tracks: ys.map((y) => box((left + right) / 2, y, right - left, RACER)),
    fair: box(190 + BTN_W / 2, by, BTN_W, BTN_H),
    unfair: box(190 + BTN_W * 1.5 + 20, by, BTN_W, BTN_H),
    check: box(190 + 2 * BTN_W + 40 + CHECK_W / 2, by, CHECK_W, BTN_H),
  };
}

/**
 * Level 6: one spinner, the share strip with its two counts above it, the fast-forward button and the three answer cards.
 * The strip and counts are display only; the spinner, the button and the cards are the targets.
 */
export const SETTLE_R = 170,
  STRIP_W = 560,
  STRIP_H = 80,
  FF_W = 130,
  FF_H = 110,
  ABOUT_W = 160,
  ABOUT_H = 130;
export interface SettleLayout {
  portrait: boolean;
  spinner: Circle;
  /** The two counts (a face and a numeral each), above the strip. */
  counts: Box;
  /** The strip; its ruler and the share marker hang up to `RULER` under it. */
  strip: Box;
  fast: Box;
  cards: Box[];
}
/** The ruler's ticks and the marker's arrow reach this far under the strip. */
export const RULER = 34;

export function settleLayout(view: { w: number; h: number }): SettleLayout {
  const { w, h } = view;
  const row = (left: number, right: number, y: number) => {
    const gap = Math.min(40, (right - left - 3 * ABOUT_W) / 2);
    const x0 = (left + right) / 2 - ABOUT_W - gap;
    return [0, 1, 2].map((i) => box(x0 + i * (ABOUT_W + gap), y, ABOUT_W, ABOUT_H));
  };
  if (h <= w) {
    // The spinner on the left, clear of the pet; the counts, strip, button and cards stacked on its right.
    const spinner = { x: 250, y: 330, r: SETTLE_R };
    const left = 460,
      right = w - 30;
    const sw = Math.min(STRIP_W, right - left);
    const cx = (left + right) / 2;
    return {
      portrait: false,
      spinner,
      counts: box(cx, 170, Math.min(sw, 400), 80),
      strip: box(cx, 270, sw, STRIP_H),
      fast: box(cx, 425, FF_W, FF_H),
      cards: row(cx - sw / 2, cx + sw / 2, h - 20 - ABOUT_H / 2),
    };
  }
  const spinner = { x: w / 2, y: 130 + SETTLE_R + 10, r: SETTLE_R };
  const sw = Math.min(STRIP_W, w - 60);
  const fast = box(w - 30 - FF_W / 2, 640, FF_W, FF_H);
  return {
    portrait: true,
    spinner,
    counts: box((30 + fast.x - FF_W / 2 - 20) / 2, 640, 400, 80),
    strip: box(w / 2, 770, sw, STRIP_H),
    fast,
    cards: row(180, w - 20, h - 20 - ABOUT_H / 2),
  };
}

/**
 * Level 7: the dice tray (the tap target of the twelve rolls), the roll bars, and at the grid step the 6×6 grid in the
 * tray's place with the ways bars beside it (under the roll bars when upright) and the sum cards. The grid and both bar
 * sets are display only; the tray and the cards are the targets.
 */
export const TRAY_W = 300,
  TRAY_H = 170,
  SUM_CARD = 130,
  BAR_LABEL = 34;
/** A row of eleven display bars: the first bar's left edge, the baseline, the step between bars, a bar's width and the tallest a bar can stand. */
export interface Bars {
  x: number;
  base: number;
  pitch: number;
  w: number;
  h: number;
}
export interface DiceLayout {
  portrait: boolean;
  tray: Box;
  /** The grid's top-left corner, the header strip's size (the dice along the top and down the left) and a square's size. */
  grid: { x: number; y: number; head: number; cell: number };
  rolls: Bars;
  ways: Bars;
  /** Question one's three cards and question two's two. */
  most: Box[];
  pair: Box[];
}
/** The grid's whole side: the header strip and six squares. */
export const gridSide = (g: DiceLayout['grid']) => g.head + 6 * g.cell;
/** A bar row's box, labels included (they hang `BAR_LABEL` under the baseline). */
export const barsBox = (b: Bars): Box => {
  const w = 10 * b.pitch + b.w;
  return box(b.x + w / 2, b.base + (BAR_LABEL - b.h) / 2, w, b.h + BAR_LABEL);
};

export function diceLayout(view: { w: number; h: number }): DiceLayout {
  const { w, h } = view;
  if (h <= w) {
    // The grid on the left with the ways bars beside it, the cards in a column on the right, the roll bars along the bottom.
    const ox = (w - 1024) / 2;
    const grid = { x: ox + 180, y: 124, head: 44, cell: 60 };
    const bottom = grid.y + gridSide(grid);
    const base = h - 20 - BAR_LABEL;
    const cx = ox + 929;
    const col = (n: number) => {
      const top = grid.y + (bottom - grid.y - n * SUM_CARD - (n - 1) * 7) / 2;
      return Array.from({ length: n }, (_, i) =>
        box(cx, top + SUM_CARD / 2 + i * (SUM_CARD + 7), SUM_CARD, SUM_CARD),
      );
    };
    return {
      portrait: false,
      tray: box(ox + 518, (grid.y + bottom) / 2, TRAY_W, TRAY_H),
      grid,
      rolls: { x: ox + 190, base, pitch: 60, w: 56, h: Math.min(190, base - bottom - 14) },
      ways: { x: ox + 600, base: bottom - BAR_LABEL, pitch: 22.6, w: 20, h: 264 },
      most: col(3),
      pair: col(2),
    };
  }
  // Upright: the grid on top, the roll bars under it and the ways bars under those (bar over bar), the cards along the bottom.
  const grid = { x: 0, y: 130, head: 50, cell: h >= 1150 ? 80 : 68 };
  grid.x = (w - gridSide(grid)) / 2;
  const bottom = grid.y + gridSide(grid);
  const barH = Math.min(190, (h - 180 - bottom - 14 - 12) / 2 - BAR_LABEL);
  const bx = (w - 656) / 2;
  const row = (n: number) => {
    const span = n * SUM_CARD + (n - 1) * 20;
    const x0 = (190 + w - 20) / 2 - span / 2;
    return Array.from({ length: n }, (_, i) =>
      box(x0 + SUM_CARD / 2 + i * (SUM_CARD + 20), h - 20 - SUM_CARD / 2, SUM_CARD, SUM_CARD),
    );
  };
  const rollsBase = bottom + 14 + barH;
  return {
    portrait: true,
    tray: box(w / 2, (grid.y + bottom) / 2, TRAY_W, TRAY_H),
    grid,
    rolls: { x: bx, base: rollsBase, pitch: 60, w: 56, h: barH },
    ways: { x: bx, base: rollsBase + BAR_LABEL + 12 + barH, pitch: 60, w: 56, h: barH },
    most: row(3),
    pair: row(2),
  };
}

/**
 * Level 8: the number spinner, the six towers its spins stand as (a count under each) and the three number cards of the
 * question in play. A tower's whole column is its grab and drop area; the spinner and the cards are the other targets.
 */
export const TOWER_W = 110,
  TOWER_H = 330,
  BLOCK_H = 45,
  TOWER_LABEL = 34,
  NUM_CARD = 130;
export interface TypicalLayout {
  portrait: boolean;
  spinner: Circle;
  /** Each tower's column, left to right; the count hangs `TOWER_LABEL` under its base. */
  towers: Box[];
  /** The line the towers stand on. */
  base: number;
  cards: Box[];
}

export function typicalLayout(view: { w: number; h: number }): TypicalLayout {
  const { w, h } = view;
  const columns = (x0: number, gap: number, base: number) =>
    Array.from({ length: 6 }, (_, i) =>
      box(x0 + TOWER_W / 2 + i * (TOWER_W + gap), base - TOWER_H / 2, TOWER_W, TOWER_H),
    );
  const row = (cx: number, y: number) =>
    [-1, 0, 1].map((i) => box(cx + i * (NUM_CARD + 20), y, NUM_CARD, NUM_CARD));
  if (h <= w) {
    // The spinner on the left above the pet, the towers on its right with the cards in a row above them. Below 1100
    // wide the spinner shrinks and the towers stand closer, so no column is ever narrower.
    const gap = w < 1100 ? 14 : 20;
    const span = 6 * TOWER_W + 5 * gap;
    const r = Math.min(SETTLE_R, Math.floor((w - span - 64) / 2));
    const x0 = (w - (2 * r + 48 + span)) / 2;
    const base = h - 20 - TOWER_LABEL;
    const left = x0 + 2 * r + 48;
    return {
      portrait: false,
      // Low enough to clear the help button under the home button, and above the pet.
      spinner: { x: x0 + 8 + r, y: Math.min(h - 182 - r, 400), r },
      towers: columns(left, gap, base),
      base,
      cards: row(left + span / 2, 16 + NUM_CARD / 2),
    };
  }
  // Upright: the spinner on top, the towers across the middle, the cards along the bottom beside the pet.
  const gap = Math.min(20, (w - 16 - 6 * TOWER_W) / 5);
  const span = 6 * TOWER_W + 5 * gap;
  const base = h - 20 - NUM_CARD - 20 - TOWER_LABEL;
  return {
    portrait: true,
    spinner: { x: w / 2, y: 130 + SETTLE_R + 10, r: SETTLE_R },
    towers: columns((w - span) / 2, gap, base),
    base,
    cards: row((190 + w - 20) / 2, h - 20 - NUM_CARD / 2),
  };
}

/**
 * Level 9: one eight-wedge spinner whose wedges she moves, the two critters' boxes (the drop and tap targets, a count
 * hanging under each), the strip of the proof run with its ruler, and the Check button. The strip and the counts are
 * display only.
 */
export const RIG_BOX = 140,
  RIG_COUNT = 56,
  RIG_TALLY = 44;
export interface RigLayout {
  portrait: boolean;
  spinner: Circle;
  /** The favourite's box, then the friend's; each count hangs `RIG_COUNT` under its box. */
  boxes: Box[];
  /** The strip; the proof run's two counts sit `RIG_TALLY` above it, and its ruler and the share marker hang up to `RULER` under it. */
  strip: Box;
  check: Box;
}

export function rigLayout(view: { w: number; h: number }): RigLayout {
  const { w, h } = view;
  if (h <= w) {
    // The spinner on the left above the pet; the boxes, the strip and Check stacked on its right.
    const left = 460,
      right = w - 30;
    const cx = (left + right) / 2;
    return {
      portrait: false,
      spinner: { x: 250, y: 330, r: SETTLE_R },
      boxes: [-1, 1].map((d) => box(cx + d * (RIG_BOX / 2 + 30), 126 + RIG_BOX / 2, RIG_BOX, RIG_BOX)),
      strip: box(cx, 410, Math.min(STRIP_W, right - left), STRIP_H),
      check: box(cx, h - 20 - BTN_H / 2, CHECK_W, BTN_H),
    };
  }
  // Upright: the spinner, the boxes, the strip and Check in a stack, Check beside the pet.
  const spinner = { x: w / 2, y: 130 + SETTLE_R + 10, r: SETTLE_R };
  const top = spinner.y + SETTLE_R + 8 + 8;
  return {
    portrait: true,
    spinner,
    boxes: [-1, 1].map((d) => box(w / 2 + d * (RIG_BOX / 2 + 40), top + RIG_BOX / 2, RIG_BOX, RIG_BOX)),
    strip: box(
      w / 2,
      top + RIG_BOX + RIG_COUNT + RIG_TALLY + STRIP_H / 2,
      Math.min(STRIP_W, w - 60),
      STRIP_H,
    ),
    check: box((190 + w - 20) / 2, h - 20 - BTN_H / 2, CHECK_W, BTN_H),
  };
}

/**
 * Level 10: one six-wedge spinner, the ribbon of the latest twelve results (the run's length rides above it), the
 * fast-forward button and the three answer cards. The ribbon is display only, so its faces shrink to fit beside the
 * spinner; the spinner, the button and the cards are the targets.
 */
export const RIBBON = 12,
  RIBBON_CELL = 56,
  RIBBON_TOP = 40;
export interface DueLayout {
  portrait: boolean;
  spinner: Circle;
  /** The ribbon: `RIBBON` cells of `cell` in a row; the run's length sits up to `RIBBON_TOP` above it. */
  ribbon: Box;
  cell: number;
  fast: Box;
  cards: Box[];
}

export function dueLayout(view: { w: number; h: number }): DueLayout {
  const { w, h } = view;
  const row = (left: number, right: number, y: number) => {
    const gap = Math.min(40, (right - left - 3 * ABOUT_W) / 2);
    const x0 = (left + right) / 2 - ABOUT_W - gap;
    return [0, 1, 2].map((i) => box(x0 + i * (ABOUT_W + gap), y, ABOUT_W, ABOUT_H));
  };
  const ribbon = (cx: number, y: number, room: number) => {
    const cell = Math.min(RIBBON_CELL, Math.floor(room / RIBBON));
    return { cell, ribbon: box(cx, y, cell * RIBBON, cell) };
  };
  if (h <= w) {
    // The spinner on the left, clear of the pet; the ribbon, the button and the cards stacked on its right.
    const left = 460,
      right = w - 30;
    const cx = (left + right) / 2;
    return {
      portrait: false,
      spinner: { x: 250, y: 330, r: SETTLE_R },
      ...ribbon(cx, 250, right - left),
      fast: box(cx, 425, FF_W, FF_H),
      cards: row(left, right, h - 20 - ABOUT_H / 2),
    };
  }
  // Upright: the spinner, the ribbon under it, the button, and the cards beside the pet.
  return {
    portrait: true,
    spinner: { x: w / 2, y: 130 + SETTLE_R + 10, r: SETTLE_R },
    ...ribbon(w / 2, 590, w - 60),
    fast: box(w / 2, 720, FF_W, FF_H),
    cards: row(180, w - 20, h - 20 - ABOUT_H / 2),
  };
}

/** A sticker's spinner and its bar of spins, from the seed. */
export function stickerSet(seed: number): { wheel: Wheel; counts: number[] } {
  const n = Math.abs(Math.floor(seed));
  const kinds: Kind[][] = [
    ['duck', 'pig', 'bunny'],
    ['cat', 'duck', 'cow'],
    ['pig', 'dog', 'duck'],
    ['bunny', 'cat', 'pig'],
  ];
  const [a, b, c] = kinds[n % kinds.length];
  const counts = [
    [3, 2, 1],
    [2, 3, 1],
    [1, 2, 3],
    [2, 1, 3],
  ][(n >> 2) % 4];
  return { wheel: [a, a, b, b, c, c], counts };
}
