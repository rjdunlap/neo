import type { Rng } from '../../engine/random';

/**
 * Ramp Race: a toy car rolls down a ramp and across the floor. A higher ramp sends it farther;
 * a slippery floor lets it glide farther than a rough one. First explore, then pick the height
 * that stops the car on a star, then height and floor together, then fair tests: compare two
 * lanes while changing only one thing.
 *
 * The model is deliberately simple and explainable: distance = height × floor glide, in floor
 * marks. Nothing here pretends to be more than that.
 */
export type RampMode = 'explore' | 'height' | 'both' | 'fair' | 'shelf';

export interface RampPlan {
  mode: RampMode;
  /** Rolls to explore, or stars / questions to answer. */
  rounds: number;
  name: string;
}

export const PLANS: RampPlan[] = [
  { mode: 'explore', rounds: 4, name: 'Change the ramp and roll the car: higher goes farther' },
  { mode: 'height', rounds: 3, name: 'Pick the ramp height that stops the car on the star' },
  { mode: 'both', rounds: 3, name: 'Ramp height and floor (carpet, wood, ice) together reach the star' },
  { mode: 'fair', rounds: 3, name: 'Fair tests: compare two lanes, changing only one thing' },
  { mode: 'shelf', rounds: 2, name: 'Trial Shelf: roll two ramps, keep both cards, tap the one that went farther' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const HEIGHTS = [2, 3, 4] as const;
export type Floor = 'carpet' | 'wood' | 'ice';
export const FLOORS: Floor[] = ['carpet', 'wood', 'ice'];
export const GLIDE: Record<Floor, number> = { carpet: 1, wood: 1.5, ice: 2.5 };

/** Floor marks the car travels from the bottom of the ramp. */
export const distance = (height: number, floor: Floor) => height * GLIDE[floor];

/** The longest roll, for scaling the floor to the screen. */
export const MAX_DISTANCE = distance(4, 'ice');

export interface Setup {
  height: number;
  floor: Floor;
}

/** Stars: on the 'height' level the floor is wood; on 'both' any combination may reach it. */
export function makeStars(plan: RampPlan, rng: Rng): number[] {
  const out: number[] = [];
  const options = plan.mode === 'height' ? HEIGHTS.map((h) => distance(h, 'wood')) : [...new Set(HEIGHTS.flatMap((h) => FLOORS.map((f) => distance(h, f))))];
  while (out.length < plan.rounds) {
    const d = rng.pick(options);
    if (!out.includes(d)) out.push(d);
  }
  return out;
}

/** Whether a roll stops on the star (the star is a little wider than a mark). */
export const onStar = (d: number, star: number) => Math.abs(d - star) < 0.3;

/** Every setup that reaches a star, so a hint can suggest one. */
export const waysTo = (star: number, floors: Floor[] = FLOORS): Setup[] =>
  HEIGHTS.flatMap((height) => floors.map((floor) => ({ height, floor }))).filter((s) => onStar(distance(s.height, s.floor), star));

/** A fair-test question: which thing to compare. */
export interface FairQuestion {
  compare: 'floor' | 'height';
}

export function makeQuestions(rng: Rng, n: number): FairQuestion[] {
  const order = rng.shuffle<FairQuestion['compare']>(['floor', 'height', rng.pick(['floor', 'height'] as const)]);
  return order.slice(0, n).map((compare) => ({ compare }));
}

/**
 * Is the test fair? Fair means exactly the thing being compared differs and everything else is the
 * same. Returns 'fair', 'same' (nothing differs, so there is nothing to compare) or 'unfair'.
 */
export function judgeFair(q: FairQuestion, a: Setup, b: Setup): 'fair' | 'same' | 'unfair' {
  const heightDiffers = a.height !== b.height;
  const floorDiffers = a.floor !== b.floor;
  if (!heightDiffers && !floorDiffers) return 'same';
  if (q.compare === 'floor') return floorDiffers && !heightDiffers ? 'fair' : 'unfair';
  return heightDiffers && !floorDiffers ? 'fair' : 'unfair';
}

/** Which kind of pair this is for the question; `judgeFair` is the collapsed form ('wrong-only' and 'both-changed' → 'unfair'). */
export type FairKind = 'fair' | 'same' | 'wrong-only' | 'both-changed';

export function classifyFair(q: FairQuestion, a: Setup, b: Setup): FairKind {
  const verdict = judgeFair(q, a, b);
  if (verdict !== 'unfair') return verdict;
  const namedDiffers = q.compare === 'floor' ? a.floor !== b.floor : a.height !== b.height;
  return namedDiffers ? 'both-changed' : 'wrong-only';
}

/** The control that changes the thing a question names, and the one that changes the other thing. */
const control = (compare: FairQuestion['compare']): 'ramp' | 'floor' => (compare === 'floor' ? 'floor' : 'ramp');
const other = (compare: FairQuestion['compare']): FairQuestion['compare'] => (compare === 'floor' ? 'height' : 'floor');
const same = (what: FairQuestion['compare'], a: Setup, b: Setup) => (what === 'floor' ? a.floor === b.floor : a.height === b.height);

/**
 * The next touch on the orange lane B that makes the pair fair, holding blue lane A: first make B's other control
 * match A's (the thing the question does not name), then, if the lanes are now identical, change B's named control
 * once. Null when the pair is already fair. Each tap moves one step through a three-long cycle, so matching takes at
 * most two taps and an identical pair one more: never more than three.
 */
export function fairRepair(q: FairQuestion, a: Setup, b: Setup): 'ramp' | 'floor' | null {
  if (!same(other(q.compare), a, b)) return control(other(q.compare));
  return same(q.compare, a, b) ? control(q.compare) : null;
}

/** The line the pet says for a pair that is not fair: what actually changed, or that nothing did. Null for a fair pair. */
export type FairLine = `ramp.${'same' | 'wrong' | 'unfair'}.${FairQuestion['compare']}`;

export function fairLine(q: FairQuestion, kind: FairKind): FairLine | null {
  if (kind === 'fair') return null;
  const key = kind === 'same' ? 'same' : kind === 'wrong-only' ? 'wrong' : 'unfair';
  return `ramp.${key}.${q.compare}`;
}

/** The explore level's ramp heights, one per roll, low to high, so each roll beside the last shows that higher goes farther. */
export const EXPLORE_HEIGHTS = [2, 3, 4, 2] as const;

/** Trial Shelf: one roll kept as a record card. `guess` is the side of the first card's flag she guessed, if she did. */
export interface TrialRecord {
  setup: Setup;
  stop: number;
  guess?: 'before' | 'past';
}

export const recordOf = (s: Setup, guess?: TrialRecord['guess']): TrialRecord => ({ setup: { ...s }, stop: distance(s.height, s.floor), ...(guess ? { guess } : {}) });

/** Which side of a flag a stop (or a paw) lands on; stops never tie on the shelf, so the flag itself counts as past. */
export const sideOf = (stop: number, flag: number): 'before' | 'past' => (stop < flag ? 'before' : 'past');

/** The index of the card whose car went farther. */
export const farther = (a: TrialRecord, b: TrialRecord): 0 | 1 => (b.stop > a.stop ? 1 : 0);

/**
 * The two pairs' first heights, 2 and 4 in seeded order. The second roll of a pair must differ, so a pair started at 2
 * always ends with the second card farther and one started at 4 with the first: the right card is the top one in one
 * pair and the bottom one in the other, and tapping the same position twice never finishes a round.
 */
export function makeShelf(rng: Rng): [number, number] {
  return rng.next() < 0.5 ? [2, 4] : [4, 2];
}

/** What a pair or question can count. Guesses, ramp changes, same-height nudges and locked-lane taps are all 'free'. */
export type RampEvent = 'unfair-check' | 'wrong-card' | 'free';

/** Misses and hints for one pair from its events: each counted event is a miss, and the second of a kind turns help on once. */
export function tally(events: RampEvent[]): { misses: number; hints: number } {
  const n = (k: RampEvent) => events.filter((e) => e === k).length;
  const help = (k: number) => Math.min(1, Math.max(0, k - 1));
  const unfair = n('unfair-check');
  const wrong = n('wrong-card');
  return { misses: unfair + wrong, hints: help(unfair) + help(wrong) };
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The ramp's left edge and width, and how tall one height step stands, shared with the drawing in index.ts. */
export const RAMP_X0 = 150;
export const RAMP_W = 170;
export const HEIGHT_PX = 46;
export const CARD_W = 460;
export const CARD_H = 104;

/** One lane's floor: where it starts, how many units a mark is, and its height on screen (the single-lane levels). */
export function laneOf(view: { w: number; h: number }): { rampEnd: number; unit: number; floorY: number } {
  const rampEnd = RAMP_X0 + RAMP_W;
  return { rampEnd, unit: (view.w - 150 - rampEnd) / (MAX_DISTANCE + 0.6), floorY: view.h * 0.66 };
}

/**
 * The Trial Shelf's pieces: two stacked record cards right-aligned at the top, the decorative ask badge left of them,
 * and the guess zone on the floor split at the first card's flag (`flag` in marks). Pure, so a rule test checks it.
 */
export function shelfLayout(view: { w: number; h: number }, flag: number): { cards: [Box, Box]; badge: Box; guess: { before: Box; past: Box } } {
  const x = view.w - 40 - CARD_W;
  const cards: [Box, Box] = [
    { x, y: 36, w: CARD_W, h: CARD_H },
    { x, y: 36 + CARD_H + 12, w: CARD_W, h: CARD_H },
  ];
  const lane = laneOf(view);
  const split = lane.rampEnd + flag * lane.unit;
  const top = lane.floorY - 110;
  const h = 170;
  // Start just past the ramp's touch pad (it reaches 10 units beyond the ramp's foot), so a guess never cycles the ramp.
  const left = lane.rampEnd + 12;
  return {
    cards,
    badge: { x: view.w - 630, y: 96, w: 100, h: 100 },
    guess: { before: { x: left, y: top, w: split - left, h }, past: { x: split, y: top, w: view.w - 150 - split, h } },
  };
}

/** One touch of the ghost finger: change a lane's ramp or its floor (each tap moves to the next), press go, guess a side of the flag, or tap a card. */
export type RampTouch = { lane: number; change: 'ramp' | 'floor' } | 'go' | { guess: 'before' | 'past' } | { card: 0 | 1 };

/** How many taps turn a value that cycles through `list` into `to`. */
const turns = <T>(list: readonly T[], from: T, to: T) => (list.indexOf(to) - list.indexOf(from) + list.length) % list.length;

/**
 * What a capable child touches next: on the explore level a new ramp height before every roll; on the star levels the
 * way to the star that takes the fewest taps (only the ramp on the wood-floor level, where the floor is not changeable);
 * on the fair-test level the orange lane repaired until only the thing the question names differs (`fairRepair`, so it
 * recovers from any pair a person leaves behind). It never presses go on a setup that would miss the star or an unfair
 * test, so a demonstration makes no wrong move.
 */
export function rampTouch(
  plan: RampPlan,
  lanes: Setup[],
  goal: { star?: number; question?: FairQuestion; rolls: number; records?: TrialRecord[]; guess?: 'before' | 'past' },
): RampTouch | null {
  const [a, b] = lanes;
  if (plan.mode === 'shelf') {
    // Roll, change the ramp, guess by the stated rule (taller goes past the flag), roll again, then read the cards.
    const records = goal.records ?? [];
    if (records.length === 0) return 'go';
    if (records.length >= 2) return { card: farther(records[0], records[1]) };
    const first = records[0].setup.height;
    if (a.height === first) return { lane: 0, change: 'ramp' };
    return goal.guess ? 'go' : { guess: a.height > first ? 'past' : 'before' };
  }
  if (plan.mode === 'explore') {
    return a.height === EXPLORE_HEIGHTS[Math.min(goal.rolls, EXPLORE_HEIGHTS.length - 1)] ? 'go' : { lane: 0, change: 'ramp' };
  }
  if (plan.mode === 'fair') {
    if (!goal.question || !b) return null;
    const fix = fairRepair(goal.question, a, b);
    return fix ? { lane: 1, change: fix } : 'go';
  }
  if (goal.star === undefined) return null;
  const ways = waysTo(goal.star, plan.mode === 'height' ? ['wood'] : FLOORS);
  const cost = (s: Setup) => turns(HEIGHTS, a.height as (typeof HEIGHTS)[number], s.height as (typeof HEIGHTS)[number]) + turns(FLOORS, a.floor, s.floor);
  const way = [...ways].sort((x, y) => cost(x) - cost(y))[0];
  if (!way) return null;
  if (a.height !== way.height) return { lane: 0, change: 'ramp' };
  return a.floor !== way.floor ? { lane: 0, change: 'floor' } : 'go';
}
