import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Ramp Race: a toy car rolls down a ramp and across the floor. A higher ramp sends it farther;
 * a slippery floor lets it glide farther than a rough one. First explore, then pick the height
 * that stops the car on a star, then height and floor together, then fair tests: compare two
 * lanes while changing only one thing, and last read two cards and say what they can tell: one difference,
 * or both (so we can't tell), which she then makes fair.
 *
 * The model is deliberately simple and explainable: distance = height × floor glide, in floor
 * marks. Nothing here pretends to be more than that.
 */
export type RampMode = 'explore' | 'height' | 'both' | 'fair' | 'shelf' | 'change' | 'tell';

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
  {
    mode: 'shelf',
    rounds: 2,
    name: 'Trial Shelf: roll two ramps, keep both cards, tap the one that went farther',
  },
  {
    mode: 'change',
    rounds: 2,
    name: 'One Change: fix the orange lane so only one thing differs, then read the cards',
  },
  {
    mode: 'tell',
    rounds: 2,
    name: 'What can we tell? Read two cards: did one thing change, or both? Then make it fair',
  },
];

export const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 1, max: 7 },
};

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

/** The blue lane stays fixed throughout One Change. */
export const CONTROL: Readonly<Setup> = { height: 3, floor: 'wood' };

/** One floor and one height question, with distinct confounded orange starts. */
export function makeChange(rng: Rng): { question: FairQuestion; start: Setup }[] {
  const starts = rng.shuffle<Setup>(
    [2, 4].flatMap((height) => (['carpet', 'ice'] as const).map((floor) => ({ height, floor }))),
  );
  return rng
    .shuffle<FairQuestion['compare']>(['floor', 'height'])
    .map((compare, i) => ({ question: { compare }, start: starts[i] }));
}

/** Stars: on the 'height' level the floor is wood; on 'both' any combination may reach it. */
export function makeStars(plan: RampPlan, rng: Rng): number[] {
  const out: number[] = [];
  const options =
    plan.mode === 'height'
      ? HEIGHTS.map((h) => distance(h, 'wood'))
      : [...new Set(HEIGHTS.flatMap((h) => FLOORS.map((f) => distance(h, f))))];
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
  HEIGHTS.flatMap((height) => floors.map((floor) => ({ height, floor }))).filter((s) =>
    onStar(distance(s.height, s.floor), star),
  );

/** A fair-test question: which thing to compare. */
export interface FairQuestion {
  compare: 'floor' | 'height';
}

export function makeQuestions(rng: Rng, n: number): FairQuestion[] {
  const order = rng.shuffle<FairQuestion['compare']>([
    'floor',
    'height',
    rng.pick(['floor', 'height'] as const),
  ]);
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
const control = (compare: FairQuestion['compare']): 'ramp' | 'floor' =>
  compare === 'floor' ? 'floor' : 'ramp';
const other = (compare: FairQuestion['compare']): FairQuestion['compare'] =>
  compare === 'floor' ? 'height' : 'floor';
const same = (what: FairQuestion['compare'], a: Setup, b: Setup) =>
  what === 'floor' ? a.floor === b.floor : a.height === b.height;

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

export const recordOf = (s: Setup, guess?: TrialRecord['guess']): TrialRecord => ({
  setup: { ...s },
  stop: distance(s.height, s.floor),
  ...(guess ? { guess } : {}),
});

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

/**
 * What a pair, question or step can count: an unfair Check, a wrong card, and on What can we tell? a wrong claim or a
 * repair Check that still differs in both. Guesses, ramp changes, tile choices, replays, nudges and locked-lane taps
 * are all 'free'.
 */
export type RampEvent = 'unfair-check' | 'wrong-card' | 'wrong-claim' | 'tell-unfair' | 'free';

const COUNTED: RampEvent[] = ['unfair-check', 'wrong-card', 'wrong-claim', 'tell-unfair'];

/** Misses and hints for one pair (or one tell step) from its events: each counted event is a miss, and the second of a kind turns help on once. */
export function tally(events: RampEvent[]): { misses: number; hints: number } {
  const n = (k: RampEvent) => events.filter((e) => e === k).length;
  const help = (k: number) => Math.min(1, Math.max(0, k - 1));
  return {
    misses: COUNTED.reduce((m, k) => m + n(k), 0),
    hints: COUNTED.reduce((h, k) => h + help(n(k)), 0),
  };
}

/** What differs between two setups. A shown pair is never 'none'. */
export type Changed = 'none' | 'floor' | 'height' | 'both';
export type Claim = Exclude<Changed, 'none'>;

export function changed(a: Setup, b: Setup): Changed {
  const h = a.height !== b.height;
  const f = a.floor !== b.floor;
  return h && f ? 'both' : h ? 'height' : f ? 'floor' : 'none';
}

export const claimRight = (claim: Claim, a: Setup, b: Setup) => claim === changed(a, b);

/** The why-line after a wrong claim: always a part where the claim and the cards disagree, never which tile is right. Null when right. */
export type ClaimWhy = 'floorsame' | 'rampsame' | 'rampsdiffer' | 'floorsdiffer';

export function claimWhy(claim: Claim, actual: Claim): ClaimWhy | null {
  if (claim === actual) return null;
  if (claim === 'floor') return actual === 'height' ? 'floorsame' : 'rampsdiffer';
  if (claim === 'height') return actual === 'floor' ? 'rampsame' : 'floorsdiffer';
  return actual === 'floor' ? 'rampsame' : 'floorsame';
}

/** One case: card A (blue, top) and card B (orange, bottom). */
export interface TellCase {
  a: Setup;
  b: Setup;
}

const ALL_SETUPS: Setup[] = HEIGHTS.flatMap((height) => FLOORS.map((floor) => ({ height, floor })));
const stopOf = (s: Setup) => distance(s.height, s.floor);
const unorderedPairs = (keep: (a: Setup, b: Setup) => boolean): TellCase[] =>
  ALL_SETUPS.flatMap((a, i) =>
    ALL_SETUPS.slice(i + 1)
      .filter((b) => keep(a, b))
      .map((b) => ({ a, b })),
  );

/** Height and floor both differ, with different stops: 18 such pairs less the one tie ({3, carpet} and {2, wood}). */
export const CONFOUNDED: TellCase[] = unorderedPairs(
  (a, b) => changed(a, b) === 'both' && stopOf(a) !== stopOf(b),
);
/** Exactly one thing differs: 9 height-only and 9 floor-only pairs. */
export const CONTROLLED: TellCase[] = unorderedPairs(
  (a, b) => changed(a, b) === 'floor' || changed(a, b) === 'height',
);

/**
 * The conclusion a controlled pair supports, under the toy model: the farther card's floor, or whether the farther card's
 * ramp was the taller or the shorter. Null for a pair that does not isolate one thing.
 */
export function tellConclusion(
  a: Setup,
  b: Setup,
): { line: 'floor'; floor: Floor } | { line: 'height'; what: 'taller' | 'shorter' } | null {
  const c = changed(a, b);
  const win = stopOf(b) > stopOf(a) ? b : a;
  if (c === 'floor') return { line: 'floor', floor: win.floor };
  if (c === 'height')
    return { line: 'height', what: win.height === Math.max(a.height, b.height) ? 'taller' : 'shorter' };
  return null;
}

/** A round: one confounded and one controlled case, in seeded order, each with a seeded card order. */
export function makeTell(rng: Rng): [TellCase, TellCase] {
  const flip = (c: TellCase): TellCase =>
    rng.next() < 0.5 ? { a: { ...c.a }, b: { ...c.b } } : { a: { ...c.b }, b: { ...c.a } };
  const pair = [flip(rng.pick(CONFOUNDED)), flip(rng.pick(CONTROLLED))];
  return (rng.next() < 0.5 ? pair : pair.reverse()) as [TellCase, TellCase];
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
export function shelfLayout(
  view: { w: number; h: number },
  flag: number,
): { cards: [Box, Box]; badge: Box; guess: { before: Box; past: Box } } {
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
    guess: {
      before: { x: left, y: top, w: split - left, h },
      past: { x: split, y: top, w: view.w - 150 - split, h },
    },
  };
}

/** One touch of the ghost finger: change a lane's ramp or its floor (each tap moves to the next), press go, guess a side of the flag, tap a card, or pick a claim tile. */
export type RampTouch =
  | { lane: number; change: 'ramp' | 'floor' }
  | 'go'
  | { guess: 'before' | 'past' }
  | { card: 0 | 1 }
  | { claim: Claim };

/** How many taps turn a value that cycles through `list` into `to`. */
const turns = <T>(list: readonly T[], from: T, to: T) =>
  (list.indexOf(to) - list.indexOf(from) + list.length) % list.length;

/**
 * The next lane-B control toward exactly one difference from A (lane A is locked), or null when already so. When both
 * differ, match whichever takes fewer forward taps (a tie matches the floor, making a height test); identical lanes
 * change the ramp. Matching takes at most two taps.
 */
export function tellRepair(a: Setup, b: Setup): 'ramp' | 'floor' | null {
  const c = changed(a, b);
  if (c === 'none') return 'ramp';
  if (c !== 'both') return null;
  const ramp = turns(HEIGHTS, b.height as (typeof HEIGHTS)[number], a.height as (typeof HEIGHTS)[number]);
  const floor = turns(FLOORS, b.floor, a.floor);
  return ramp < floor ? 'ramp' : 'floor';
}

/**
 * What can we tell?'s pieces: the shelf's two cards (as on the Trial Shelf) and three claim tiles, 200 by 150 with a
 * 30-unit gap, centered, their tops at 300. Pure, so a rule test checks the arithmetic.
 */
export const TILE_W = 200;
export const TILE_H = 150;
export const CLAIMS: Claim[] = ['floor', 'height', 'both'];

export function tellLayout(view: { w: number; h: number }): { cards: [Box, Box]; tiles: [Box, Box, Box] } {
  const left = view.w / 2 - (3 * TILE_W + 2 * 30) / 2;
  const tile = (k: number): Box => ({ x: left + k * (TILE_W + 30), y: 300, w: TILE_W, h: TILE_H });
  return { cards: shelfLayout(view, 0).cards, tiles: [tile(0), tile(1), tile(2)] };
}

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
  goal: {
    star?: number;
    question?: FairQuestion;
    rolls: number;
    records?: TrialRecord[];
    guess?: 'before' | 'past';
    step?: 'claim' | 'repair';
    claim?: Claim | null;
  },
): RampTouch | null {
  const [a, b] = lanes;
  if (plan.mode === 'tell') {
    // Claim: pick the tile the cards support, then go. Repair: fix the orange lane to one difference, then go.
    if (goal.step === 'repair') {
      if (!b) return null;
      const fix = tellRepair(a, b);
      return fix ? { lane: 1, change: fix } : 'go';
    }
    const [ra, rb] = goal.records ?? [];
    if (!ra || !rb) return null;
    const right = changed(ra.setup, rb.setup) as Claim;
    return goal.claim === right ? 'go' : { claim: right };
  }
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
    return a.height === EXPLORE_HEIGHTS[Math.min(goal.rolls, EXPLORE_HEIGHTS.length - 1)]
      ? 'go'
      : { lane: 0, change: 'ramp' };
  }
  if (plan.mode === 'fair' || plan.mode === 'change') {
    if (plan.mode === 'change' && (goal.records?.length ?? 0) >= 2)
      return { card: farther(goal.records![0], goal.records![1]) };
    if (!goal.question || !b) return null;
    const fix = fairRepair(goal.question, a, b);
    return fix ? { lane: 1, change: fix } : 'go';
  }
  if (goal.star === undefined) return null;
  const ways = waysTo(goal.star, plan.mode === 'height' ? ['wood'] : FLOORS);
  const cost = (s: Setup) =>
    turns(HEIGHTS, a.height as (typeof HEIGHTS)[number], s.height as (typeof HEIGHTS)[number]) +
    turns(FLOORS, a.floor, s.floor);
  const way = [...ways].sort((x, y) => cost(x) - cost(y))[0];
  if (!way) return null;
  if (a.height !== way.height) return { lane: 0, change: 'ramp' };
  return a.floor !== way.floor ? { lane: 0, change: 'floor' } : 'go';
}
