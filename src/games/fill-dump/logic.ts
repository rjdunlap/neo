import type { Rng } from '../../engine/random';

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

export const describeFill = (level: number): string => {
  const p = planFor(level);
  if (p.count) return `Put ${p.count[0]} to ${p.count[1]} in the basket, then check (${p.pieces} to pick from)`;
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
