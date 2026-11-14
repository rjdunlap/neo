import type { BandLevels } from '../../progress/difficulty';
import type { ColorName } from '../../art/palette';
import type { ShapeKind } from '../../art/shapes';
import type { Rng } from '../../engine/random';

export const BUG_PLANS = [
  { mode: 'guided', rows: 1, columns: 1, colors: 2, name: 'Decorate two spots with matching colors' },
  { mode: 'guided', rows: 2, columns: 1, colors: 3, name: 'Match four colored shape outlines' },
  { mode: 'copy', rows: 2, columns: 1, colors: 3, name: 'Copy four spots from a model bug' },
  { mode: 'copy', rows: 3, columns: 1, colors: 4, name: 'Copy six spots from a model bug' },
  { mode: 'mirror', rows: 2, columns: 1, colors: 3, name: 'Mirror two spots onto the other wing' },
  { mode: 'mirror', rows: 3, columns: 1, colors: 4, name: 'Mirror three spots onto the other wing' },
  { mode: 'mirror', rows: 3, columns: 2, colors: 6, name: 'Mirror six spots, matching both shape and color' },
  {
    mode: 'count',
    rows: 3,
    columns: 1,
    colors: 3,
    name: 'Count the spots: give a bare bug the number on the sign',
  },
] as const;
export type BugPlan = (typeof BUG_PLANS)[number];
export interface BugToken {
  shape: ShapeKind;
  color: ColorName;
}
export interface BugSpot {
  x: number;
  y: number;
  token: number;
}
export const BUG_TOKENS: BugToken[] = [
  { shape: 'circle', color: 'blue' },
  { shape: 'triangle', color: 'yellow' },
  { shape: 'square', color: 'pink' },
  { shape: 'heart', color: 'purple' },
  { shape: 'circle', color: 'pink' },
  { shape: 'square', color: 'blue' },
  { shape: 'star', color: 'red' },
  { shape: 'hexagon', color: 'green' },
  { shape: 'triangle', color: 'blue' },
  { shape: 'heart', color: 'pink' },
  { shape: 'circle', color: 'green' },
  { shape: 'square', color: 'yellow' },
];

/**
 * The tokens a plan puts in the tray, drawn from the pool by seed. They are always different tokens; a plan of four or
 * fewer also keeps every shape and every color apart, so "the red star" is never one of two look-alikes. A bigger plan
 * may repeat a shape or a color, because telling those apart is part of it.
 */
export function pickTokens(plan: BugPlan, rng: Rng): number[] {
  let picked: number[] = [];
  // A greedy pass can dead-end on a small plan; the pool has plenty of ways through, so draw again.
  for (let attempt = 0; attempt < 50 && picked.length < plan.colors; attempt++) {
    picked = [];
    for (const i of rng.shuffle(BUG_TOKENS.map((_, k) => k))) {
      if (picked.length === plan.colors) break;
      const t = BUG_TOKENS[i];
      if (
        plan.colors <= 4 &&
        picked.some((k) => BUG_TOKENS[k].shape === t.shape || BUG_TOKENS[k].color === t.color)
      )
        continue;
      picked.push(i);
    }
  }
  return picked;
}

export function bugPuzzle(
  plan: BugPlan,
  rng: Rng,
): { model: BugSpot[]; targets: BugSpot[]; tokens: number[] } {
  const palette = pickTokens(plan, rng);
  const spots: BugSpot[] = [];
  for (let row = 0; row < plan.rows; row++)
    for (let col = 0; col < plan.columns; col++) {
      const x = plan.columns === 1 ? 94 : 72 + col * 116;
      const y = (row - (plan.rows - 1) / 2) * 116;
      spots.push({ x: -x, y, token: palette[spots.length % palette.length] });
      if (plan.mode !== 'mirror') spots.push({ x, y, token: palette[spots.length % palette.length] });
    }
  return {
    model: spots,
    targets: spots.map((s) => ({ ...s, x: plan.mode === 'mirror' ? -s.x : s.x })),
    tokens: palette,
  };
}

/** How near to a spot's middle a stamp can be let go to land in it: a little more than the outline, and clear of the neighbouring spots (116 apart). */
export const SLOT_REACH = 57;

/** The empty spot a stamp let go at (x, y) lands in, in the board's own units, if any. */
export function slotAt<S extends BugSpot & { filled: boolean }>(
  spots: readonly S[],
  x: number,
  y: number,
): S | undefined {
  return spots.find((s) => !s.filled && Math.hypot(x - s.x, y - s.y) < SLOT_REACH);
}

/**
 * What a capable child does next: stamp the first empty spot with the token it needs (the faint ghost, the model bug
 * or the mirrored wing shows which). The ghost finger follows this, so a test can check that every stamp lands.
 */
export function nextStamp<S extends BugSpot & { filled: boolean }>(spots: readonly S[]): S | undefined {
  return spots.find((s) => !s.filled);
}

/**
 * Level 8, Count the spots: a bare bug with open places on both wings, a sign asking for a number of spots, and any stamp
 * in any place. The count is said as each stamp lands; she taps the check when she thinks the bug has enough.
 */
export interface CountState {
  want: number;
  /** The open places, in the board's own units. */
  places: { x: number; y: number }[];
  /** The token stamped in each place, or null while it is open. */
  placed: (number | null)[];
  /** Places in the order they were stamped, so "the extra one" is the latest. */
  order: number[];
  /** Stamps that took the bug past the sign's number (never a miss). */
  overs: number;
  /** Check taps with the wrong number on the bug (each a miss). */
  wrongChecks: number;
  /** The round's one hint has been given; from then on the glow shows the next useful move. */
  hinted: boolean;
  done: boolean;
}

/** A count board: the places of a bare bug, and a number from 2 up to one fewer than the places, so one too many always fits. */
export function countBoard(plan: BugPlan, rng: Rng): { state: CountState; tokens: number[] } {
  const { targets, tokens } = bugPuzzle(plan, rng);
  const places = targets.map(({ x, y }) => ({ x, y }));
  return {
    tokens,
    state: {
      want: rng.int(2, places.length - 1),
      places,
      placed: places.map(() => null),
      order: [],
      overs: 0,
      wrongChecks: 0,
      hinted: false,
      done: false,
    },
  };
}

export const countHave = (s: CountState) => s.order.length;

export type CountEvent =
  | { kind: 'ignored' }
  /** A stamp landed; `n` is the count now. Past the sign's number it is `over`, which is still not a miss. */
  | { kind: 'stamp'; n: number; over: boolean; hint: boolean }
  | { kind: 'lift'; n: number }
  | { kind: 'done' }
  /** The check with the wrong number: a miss, saying what the bug has against what the sign wants. */
  | { kind: 'wrong'; have: number; hint: boolean };

/** The round's one hint comes with the second over-count or the second wrong check, whichever is first. */
function hintDue(s: CountState): boolean {
  if (s.hinted || (s.overs < 2 && s.wrongChecks < 2)) return false;
  s.hinted = true;
  return true;
}

export function countStamp(s: CountState, place: number, token: number): CountEvent {
  if (s.done || place < 0 || place >= s.places.length || s.placed[place] !== null) return { kind: 'ignored' };
  s.placed[place] = token;
  s.order.push(place);
  const n = countHave(s);
  const over = n > s.want;
  if (over) s.overs++;
  return { kind: 'stamp', n, over, hint: over && hintDue(s) };
}

/** A tap on a stamped place takes that stamp off again. */
export function countLift(s: CountState, place: number): CountEvent {
  if (s.done || s.placed[place] === null || s.placed[place] === undefined) return { kind: 'ignored' };
  s.placed[place] = null;
  s.order = s.order.filter((p) => p !== place);
  return { kind: 'lift', n: countHave(s) };
}

/** The check: exactly the sign's number finishes, whatever the stamps and wherever they are. */
export function countCheck(s: CountState): CountEvent {
  if (s.done) return { kind: 'ignored' };
  const have = countHave(s);
  if (have === s.want) {
    s.done = true;
    return { kind: 'done' };
  }
  s.wrongChecks++;
  return { kind: 'wrong', have, hint: hintDue(s) };
}

export type CountMove = { stamp: number } | { lift: number } | { check: true };

/**
 * The next useful move: take off the latest extra stamp, fill the first open place, or tap the check. The ghost finger
 * follows it, and once the hint is given the glow shows the same move.
 */
export function countMove(s: CountState): CountMove | null {
  if (s.done) return null;
  const have = countHave(s);
  if (have > s.want) return { lift: s.order[s.order.length - 1] };
  if (have < s.want) return { stamp: s.placed.indexOf(null) };
  return { check: true };
}

/** The open place a stamp let go at (x, y) lands in, if any. */
export function countPlaceAt(s: CountState, x: number, y: number): number {
  return s.places.findIndex((p, i) => s.placed[i] === null && Math.hypot(x - p.x, y - p.y) < SLOT_REACH);
}

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  // Counting to five with a stop comes after copying; the mirror levels 6 and 7 stay out of preschool.
  preschool: { min: 2, max: 8, order: [2, 3, 4, 5, 8] },
  prek: { min: 4, max: 8, order: [4, 5, 8, 6, 7] },
  school: { min: 6, max: 7 },
};
