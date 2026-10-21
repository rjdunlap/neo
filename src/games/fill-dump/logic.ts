import type { Rng } from '../../engine/random';

/** One material per round; speech and art share these nouns. Pitch offsets are pentatonic steps. */
export const FILL_SETS = [
  { id: 'fruit', things: 'fruit', container: 'basket', pitch: 0 },
  { id: 'balls', things: 'balls', container: 'bucket', pitch: 2 },
  { id: 'blocks', things: 'blocks', container: 'toy box', pitch: -2 },
  { id: 'ducks', things: 'ducks', container: 'tub', pitch: 4 },
] as const;
export type FillSet = (typeof FILL_SETS)[number];

/** At least four visibly different designs in each set; counting repeats exactly one design. */
export function contentFor(plan: FillPlan, rng: Rng) {
  const set = rng.pick(FILL_SETS);
  const count = set.id === 'fruit' ? 6 : 4;
  const designs = rng.shuffle(Array.from({ length: count }, (_, i) => i));
  const one = rng.int(0, count - 1);
  return { set, variants: Array.from({ length: plan.pieces }, (_, i) => plan.count ? one : designs[i % designs.length]) };
}

/**
 * Fill and Dump: tip a basket of fruit out, scoop it back in, and (from level 3) fill it with a stated number.
 * The rules live here as a small reducer so a test can prove what the screen has to guarantee: the lap levels cannot
 * go wrong and always finish by taps alone, and the counting levels have no dead end.
 */

export interface FillPlan {
  /** Fruit in the round: all in the basket at the start (tip-out levels), or on the ground (counting levels). */
  pieces: number;
  /** Tip-out levels: how many times the basket is tipped out and filled again. 0 for the counting levels. */
  dumps: number;
  /** Counting levels: the fewest and most she is asked to put in. Null for the tip-out levels. */
  count: [number, number] | null;
}

export const FILL_PLANS: readonly FillPlan[] = [
  { pieces: 3, dumps: 1, count: null },
  { pieces: 4, dumps: 2, count: null },
  { pieces: 5, dumps: 0, count: [1, 3] },
  { pieces: 7, dumps: 0, count: [3, 5] },
];

export const planFor = (level: number): FillPlan => FILL_PLANS[Math.min(FILL_PLANS.length, Math.max(1, level)) - 1];

/** The number she is asked to put in, drawn from the plan's range. Null in the tip-out levels. */
export const targetFor = (plan: FillPlan, rng: Rng): number | null => (plan.count ? rng.int(plan.count[0], plan.count[1]) : null);

/** What each level ID plays: the one basket (tip-out and counting), the jug, or a full and an empty basket to tell apart. */
export type FillKind = 'basket' | 'pour' | 'pair' | 'capacity';
export const FILL_LEVELS: Readonly<Record<number, FillKind>> = { 1: 'basket', 2: 'basket', 3: 'basket', 4: 'basket', 5: 'pour', 6: 'pair', 7: 'capacity' };
export const kindFor = (level: number): FillKind => FILL_LEVELS[level] ?? 'basket';

export const describeFill = (level: number): string => {
  const kind = kindFor(level);
  if (kind === 'capacity') return 'Guess which holds more, pour to test, then answer from the evidence: three pairs';
  if (kind === 'pour') return 'Tip the jug to fill three cups to their lines; catch and reuse spills';
  if (kind === 'pair') return `Full and empty: ${PAIR_REQUESTS} times, tip out the full basket or fill the empty one`;
  const p = planFor(level);
  if (p.count) return `Put ${p.count[0]} to ${p.count[1]} in the container, then check (${p.pieces} to pick from)`;
  return `Tip out ${p.pieces} and scoop them back${p.dumps > 1 ? `, ${p.dumps} times` : ''}`;
};

// ---- Where things sit -------------------------------------------------------------------------------------------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A piece's tap circle has this radius, so a piece is 120 units across on screen (the island's 100-unit minimum, with room). */
export const PIECE_HIT = 60;
/** The least distance between two landed pieces' centers: their circles never overlap. */
export const SPOT_GAP = 2 * PIECE_HIT + 8;

/** The most pieces any level uses. */
export const MAX_PIECES = Math.max(...FILL_PLANS.map((p) => p.pieces));

/**
 * `n` places for fruit to land inside `rect`, one in each of `n` different cells of a grid whose cells are at least
 * `SPOT_GAP` across, and nudged within its cell by no more than keeps neighbors `SPOT_GAP` apart. Null if the rect is too
 * small to hold `n` apart, which the game treats as a bug (a test runs every view the island supports).
 */
export function landingSpots(rng: Rng, n: number, rect: Rect): { x: number; y: number }[] | null {
  const cols = Math.floor(rect.w / SPOT_GAP);
  const rows = Math.floor(rect.h / SPOT_GAP);
  if (cols * rows < n || n <= 0) return n <= 0 ? [] : null;
  const cw = rect.w / cols;
  const ch = rect.h / rows;
  // Jitter that keeps two neighbors, each moved the full amount toward the other, still SPOT_GAP apart.
  const jx = (cw - SPOT_GAP) / 2;
  const jy = (ch - SPOT_GAP) / 2;
  const cells = rng.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
  return cells.map((c) => ({
    x: rect.x + (c % cols) * cw + cw / 2 + rng.range(-jx, jx),
    y: rect.y + Math.floor(c / cols) * ch + ch / 2 + rng.range(-jy, jy),
  }));
}

/** Where the i-th fruit sits in the basket, as an offset from the middle of its rim (up is negative): a low row of four and a staggered row of three above it, all peeking over the rim. */
export function basketSlot(i: number): { x: number; y: number } {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const inRow = row === 0 ? 4 : 3;
  return { x: (col - (inRow - 1) / 2) * 70, y: -14 - row * 44 };
}

// ---- The rules ----------------------------------------------------------------------------------------------------

export interface FillState {
  plan: FillPlan;
  /** The number to put in (counting levels), else null. */
  target: number | null;
  /** Per piece: in the basket? */
  inside: boolean[];
  /** The pieces in the basket, in the order they went in; the last one comes out first. */
  order: number[];
  /** Times the basket has been tipped out so far. */
  dumps: number;
  misses: number;
  hints: number;
  done: boolean;
}

export function startState(plan: FillPlan, target: number | null): FillState {
  const full = !plan.count;
  return {
    plan,
    target,
    inside: Array.from({ length: plan.pieces }, () => full),
    order: full ? Array.from({ length: plan.pieces }, (_, i) => i) : [],
    dumps: 0,
    misses: 0,
    hints: 0,
    done: false,
  };
}

export type FillTap = { on: 'basket'; pick?: number } | { on: 'piece'; i: number } | { on: 'tick' };

/** What a tap did, for the screen to show and say. */
export type FillEvent =
  | { kind: 'ignored' }
  /** The basket tipped everything out. */
  | { kind: 'dump' }
  /** Piece `i` went in; `n` are in now. `refilled`: that was the last one of a tip-out, so the basket is full again. */
  | { kind: 'in'; i: number; n: number; refilled: boolean }
  /** Piece `i` came back out of the basket (counting levels); `n` are in now. */
  | { kind: 'out'; i: number; n: number }
  /** The check, with nothing in the basket yet: say the job again, no miss. */
  | { kind: 'again' }
  /** The check, with the wrong number in. */
  | { kind: 'wrong'; have: number; hint: Hint | null }
  | { kind: 'done' };

/** What help leads somewhere: put more in, take one out, or tap the check. */
export type Hint = 'add' | 'remove' | 'check';

export const hintFor = (have: number, target: number): Hint => (have < target ? 'add' : have > target ? 'remove' : 'check');

export const insideCount = (s: FillState) => s.order.length;
export const outsideIndexes = (s: FillState) => s.inside.flatMap((v, i) => (v ? [] : [i]));

/** The count sign beside the basket in the counting levels: a card of `slots` dots (the number asked for), `filled` of them full, and `extras` dots hanging outside the card for every piece beyond the number. */
export interface CountSign {
  slots: number;
  filled: number;
  extras: number;
}

/** What the sign shows now: every piece in the basket fills a slot until the card is full, then hangs below it. Null in the tip-out levels, which ask for no number. */
export function countSign(s: FillState): CountSign | null {
  if (s.target === null) return null;
  const inside = insideCount(s);
  return { slots: s.target, filled: Math.min(inside, s.target), extras: Math.max(0, inside - s.target) };
}

/**
 * Apply one tap. The tip-out levels cannot go wrong: the basket tips when it is full and scoops one piece when it is not, a
 * piece goes in when tapped, and the round is done when everything is back in after the last tip. The counting levels have
 * one wrong move: tapping the check with the wrong number in. Two such misses (and every second one after) bring a hint.
 */
export function tap(s: FillState, t: FillTap): FillEvent {
  if (s.done) return { kind: 'ignored' };
  const total = s.plan.pieces;
  const put = (i: number): FillEvent => {
    s.inside[i] = true;
    s.order.push(i);
    if (s.target !== null) return { kind: 'in', i, n: s.order.length, refilled: false };
    const refilled = s.order.length === total;
    if (refilled && s.dumps >= s.plan.dumps) s.done = true;
    return { kind: 'in', i, n: s.order.length, refilled };
  };

  if (t.on === 'tick') {
    if (s.target === null) return { kind: 'ignored' };
    const have = s.order.length;
    if (have === 0) return { kind: 'again' };
    if (have === s.target) {
      s.done = true;
      return { kind: 'done' };
    }
    s.misses++;
    let hint: Hint | null = null;
    if (s.misses % 2 === 0) {
      s.hints++;
      hint = hintFor(have, s.target);
    }
    return { kind: 'wrong', have, hint };
  }

  if (t.on === 'piece') {
    if (t.i < 0 || t.i >= total || s.inside[t.i]) return { kind: 'ignored' };
    return put(t.i);
  }

  // The basket.
  if (s.target !== null) {
    const i = s.order.pop();
    if (i === undefined) return { kind: 'ignored' };
    s.inside[i] = false;
    return { kind: 'out', i, n: s.order.length };
  }
  if (s.order.length === total) {
    s.inside.fill(false);
    s.order = [];
    s.dumps++;
    return { kind: 'dump' };
  }
  const out = outsideIndexes(s);
  const i = t.pick !== undefined && out.includes(t.pick) ? t.pick : out[0];
  return put(i);
}

/** Ground is a free next-action target only in the tip-out levels. Pick the outside fruit nearest the touch. */
export function groundTap(s: FillState, spots: readonly { x: number; y: number }[], at: { x: number; y: number }): FillTap | null {
  if (s.target !== null || s.done) return null;
  const out = outsideIndexes(s);
  const pick = out.reduce<number | undefined>((best, i) =>
    best === undefined || Math.hypot(spots[i].x - at.x, spots[i].y - at.y) < Math.hypot(spots[best].x - at.x, spots[best].y - at.y) ? i : best, undefined);
  return { on: 'basket', pick };
}

/**
 * What a capable child touches next, for the ghost finger on the how-to card: tip a full basket, scoop up the pieces on
 * the ground, or in a counting level put in the number and then tap the check. Null once the round is done.
 */
export function nextTouch(s: FillState): FillTap | null {
  if (s.done) return null;
  if (s.target === null) {
    if (s.order.length === s.plan.pieces) return { on: 'basket' };
    return { on: 'piece', i: outsideIndexes(s)[0] };
  }
  if (s.order.length < s.target) return { on: 'piece', i: outsideIndexes(s)[0] };
  if (s.order.length > s.target) return { on: 'basket' };
  return { on: 'tick' };
}

// ---- Pouring: one cup unit, with all overflow retained in the tray -----------------------------------------------
export const POUR_DISTANCE = 240;
export const POUR_TOLERANCE = 0.06;
export const POUR_TARGETS = [0.5, 0.25, 0.75] as const;
export interface PourState {
  jug: number;
  cup: number;
  tray: number;
  targets: number[];
  round: number;
  misses: number;
  hints: number;
  roundMisses: number;
  helped: boolean;
  done: boolean;
}
export function startPour(rng: Rng): PourState {
  return { jug: 3, cup: 0, tray: 0, targets: [0.5, ...rng.shuffle([0.25, 0.75])], round: 0,
    misses: 0, hints: 0, roundMisses: 0, helped: false, done: false };
}
/** Amount follows the furthest rightward movement in a gesture, not time held or pointer-event frequency. */
export const pourAmount = (dx: number) => Math.max(0, Math.min(3, dx / POUR_DISTANCE));
export function pour(s: Pick<PourState, 'jug' | 'cup' | 'tray' | 'done'>, amount: number, capacity = 1) {
  if (s.done || !Number.isFinite(amount)) return;
  const moved = Math.min(s.jug, Math.max(0, amount));
  const intoCup = Math.min(capacity - s.cup, moved);
  s.jug -= moved;
  s.cup += intoCup;
  s.tray += moved - intoCup;
}
export function emptyCup(s: Pick<PourState, 'jug' | 'cup' | 'tray' | 'done'>) {
  if (s.done) return;
  s.tray += s.cup;
  s.cup = 0;
}
export function recoverTray(s: Pick<PourState, 'jug' | 'cup' | 'tray' | 'done'>) {
  if (s.done) return;
  s.jug += s.tray;
  s.tray = 0;
}
export const pourHint = (s: PourState): 'more' | 'empty' | 'check' =>
  Math.abs(s.cup - s.targets[s.round]) <= POUR_TOLERANCE + 1e-9 ? 'check' :
    s.cup > s.targets[s.round] ? 'empty' : 'more';
export function checkPour(s: PourState): 'again' | 'wrong' | 'next' | 'done' | 'ignored' {
  if (s.done) return 'ignored';
  if (pourHint(s) !== 'check') {
    if (s.cup === 0) return 'again';
    s.misses++;
    s.roundMisses++;
    if (s.roundMisses >= 2 && !s.helped) { s.helped = true; s.hints++; }
    return 'wrong';
  }
  s.round++;
  if (s.round === s.targets.length) { s.done = true; return 'done'; }
  // The filled cup is served, then its water is available again for the next experiment.
  s.jug += s.cup + s.tray;
  s.cup = s.tray = s.roundMisses = 0;
  s.helped = false;
  return 'next';
}

// ---- Full and empty (level 6): two baskets, one full and one empty; each request names which one to use --------------

/** Requests in a round, alternating between tipping the full basket and filling the empty one. */
export const PAIR_REQUESTS = 4;
/** Fruit in the full basket, and in the little pile on the grass that fills the empty one. */
export const PAIR_FRUIT = 3;

export type PairAsk = 'tip' | 'fill';
/** One request: what is asked, and which basket (0 left, 1 right) is the full one this time. */
export interface PairRequest {
  ask: PairAsk;
  full: 0 | 1;
}

export interface PairState {
  requests: PairRequest[];
  round: number;
  misses: number;
  hints: number;
  /** Misses on this request; the second one glows the right basket. */
  roundMisses: number;
  helped: boolean;
  done: boolean;
}

/** Four requests that alternate (the first one seeded), with the full basket on each side twice in a seeded order, so its place cannot be learned. */
export function startPair(rng: Rng): PairState {
  const first: PairAsk = rng.chance(0.5) ? 'tip' : 'fill';
  const sides = rng.shuffle<0 | 1>([0, 0, 1, 1]);
  const requests = sides.map((full, i): PairRequest => ({ ask: i % 2 === 0 ? first : first === 'tip' ? 'fill' : 'tip', full }));
  return { requests, round: 0, misses: 0, hints: 0, roundMisses: 0, helped: false, done: false };
}

/** The one basket that answers a request: the full one to tip out, the empty one to fill. */
export const rightBasket = (r: PairRequest): 0 | 1 => (r.ask === 'tip' ? r.full : r.full === 0 ? 1 : 0);

export type PairEvent =
  | { kind: 'ignored' }
  /** The wrong basket: one miss; `hint` the first time a request reaches two. */
  | { kind: 'wrong'; ask: PairAsk; hint: boolean }
  /** The right basket: tip it or fill it, then the next request (or the end). */
  | { kind: 'right'; ask: PairAsk; side: 0 | 1; done: boolean };

/** A tap on basket `side`. Nothing else in the scene is judged: the grass and the pile are free. */
export function pairTap(s: PairState, side: 0 | 1): PairEvent {
  if (s.done) return { kind: 'ignored' };
  const r = s.requests[s.round];
  if (side !== rightBasket(r)) {
    s.misses++;
    s.roundMisses++;
    let hint = false;
    if (s.roundMisses >= 2 && !s.helped) {
      s.helped = true;
      s.hints++;
      hint = true;
    }
    return { kind: 'wrong', ask: r.ask, hint };
  }
  s.round++;
  s.roundMisses = 0;
  s.helped = false;
  if (s.round === s.requests.length) s.done = true;
  return { kind: 'right', ask: r.ask, side, done: s.done };
}

/** The ghost finger's tap: the right basket. Null once the round is done. */
export const pairNext = (s: PairState): 0 | 1 | null => (s.done ? null : rightBasket(s.requests[s.round]));

/** The basket's touch box at full size, around its feet: half its width, how far it reaches above them, and below. */
export const BASKET_HIT = { halfW: 140, top: 180, bottom: 6 } as const;
/** Level 6's baskets stand at this size: a 238 by 158 touch box each. */
export const PAIR_SCALE = 0.85;
/** The pile's fruit are drawn at this scale, between the two baskets. */
export const PILE_SCALE = 0.9;

export interface PairLayout {
  feetY: number;
  /** The left and right baskets' middles. */
  xs: [number, number];
  /** Where the pile's fruit sit, between the baskets. */
  pile: { x: number; y: number }[];
  /** Where a tipped basket's fruit land on the grass in front of it. */
  landing: [{ x: number; y: number }[], { x: number; y: number }[]];
}

/** Two baskets standing apart on the grass, the pile between them, in a view of `w` by `h`. */
export function pairLayout(w: number, h: number): PairLayout {
  const feetY = h * 0.48 + 60;
  const dx = 210;
  const xs: [number, number] = [w / 2 - dx, w / 2 + dx];
  const pile = [
    { x: w / 2 - 55, y: feetY + 75 },
    { x: w / 2 + 55, y: feetY + 75 },
    { x: w / 2, y: feetY + 30 },
  ];
  // A tipped basket's fruit land in front of it, toward its outer side and clear of the pile.
  const land = (x: number, out: number) => [-110, -35, 40].map((ox) => ({ x: x + ox * out, y: feetY + 90 }));
  return { feetY, xs, pile, landing: [land(xs[0], 1), land(xs[1], -1)] };
}

// ---- Which holds more (level 7): prediction is free; only an answer after evidence is judged -----------------------
export const CAPACITY_VESSELS = {
  bowl: { capacity: 2, width: 240 },
  cup: { capacity: 1, width: 100 },
  bucket: { capacity: 1.8, width: 180 },
  mug: { capacity: 1, width: 100 },
} as const;
export type Vessel = keyof typeof CAPACITY_VESSELS;
export interface CapacityPair { left: Vessel; right: Vessel }
/** The first pair is always the obvious full bowl and empty cup; the other two vary in order. */
export function capacityPairs(rng: Rng): CapacityPair[] {
  return [{ left: 'bowl', right: 'cup' }, ...rng.shuffle<CapacityPair>([
    { left: 'cup', right: 'bucket' }, { left: 'bucket', right: 'mug' },
  ])];
}
export interface CapacityState {
  pairs: CapacityPair[];
  round: number;
  phase: 'guess' | 'pour' | 'answer';
  guess: 0 | 1 | null;
  jug: number; cup: number; tray: number;
  misses: number; hints: number; roundMisses: number; helped: boolean; done: boolean;
}
export const capacityPair = (s: CapacityState) => s.pairs[Math.min(s.round, s.pairs.length - 1)];
export const capacityMore = (p: CapacityPair): 0 | 1 => CAPACITY_VESSELS[p.left].capacity > CAPACITY_VESSELS[p.right].capacity ? 0 : 1;
export function startCapacity(rng: Rng): CapacityState {
  const pairs = capacityPairs(rng);
  return { pairs, round: 0, phase: 'guess', guess: null, jug: CAPACITY_VESSELS[pairs[0].left].capacity, cup: 0, tray: 0,
    misses: 0, hints: 0, roundMisses: 0, helped: false, done: false };
}
export function capacityPour(s: CapacityState, amount: number) {
  if (s.phase === 'pour') pour(s, amount, CAPACITY_VESSELS[capacityPair(s).right].capacity);
}
/** No scoring for a partial pour or checking before the source is empty. */
export function capacityEvidence(s: CapacityState): boolean {
  if (s.done || s.phase !== 'pour' || s.jug > 1e-9) return false;
  s.phase = 'answer'; return true;
}
/** Recover all the water for another experiment with this same pair, at any point after guessing. */
export function capacityRepour(s: CapacityState) {
  if (s.done || s.phase === 'guess') return;
  emptyCup(s); recoverTray(s); s.phase = 'pour';
}
export function capacityTap(s: CapacityState, side: 0 | 1): 'ignored' | 'guess' | 'wrong' | 'next' | 'done' {
  if (s.done || s.phase === 'pour') return 'ignored';
  if (s.phase === 'guess') { s.guess = side; s.phase = 'pour'; return 'guess'; }
  if (side !== capacityMore(capacityPair(s))) {
    s.misses++; s.roundMisses++;
    if (s.roundMisses >= 2 && !s.helped) { s.helped = true; s.hints++; }
    return 'wrong';
  }
  s.round++;
  if (s.round === s.pairs.length) { s.done = true; return 'done'; }
  s.phase = 'guess'; s.guess = null; s.roundMisses = 0; s.helped = false;
  // Return this pair's water, then set out the next full source. No water disappears within an experiment.
  s.jug = CAPACITY_VESSELS[capacityPair(s).left].capacity; s.cup = s.tray = 0;
  return 'next';
}
/** Straight-sided model: a unit occupies 12,000 square logical units; height = volume / width. */
export const capacityHeight = (v: Vessel, volume: number = CAPACITY_VESSELS[v].capacity) => volume * 12000 / CAPACITY_VESSELS[v].width;
export function capacityLayout(w: number, h: number) {
  return { left: { x: w * 0.30, y: h * 0.53 }, right: { x: w * 0.70, y: h * 0.53 },
    tray: { x: w * 0.70, y: h * 0.53 + 100 }, tick: { x: w * 0.30, y: h * 0.53 + 150 } };
}
