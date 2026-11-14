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
  {
    mode: 'kind',
    rows: 3,
    columns: 1,
    colors: 4,
    name: 'Count a kind: give the bug the number of spots of one color or one shape',
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
  /** Level 9: the kind the sign asks for (one color or one shape); null on level 8, where any stamp counts. */
  kind: KindWant | null;
  /** Stamps of the wrong kind let go on the bug (each a miss; the stamp goes back to the tray). */
  wrongKinds: number;
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
      kind: null,
      wrongKinds: 0,
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
  /** Level 9: a stamp of the wrong kind, which goes back to the tray (a miss that names what was put). */
  | { kind: 'wrongKind'; token: number; hint: boolean }
  | { kind: 'done' }
  /** The check with the wrong number: a miss, saying what the bug has against what the sign wants. */
  | { kind: 'wrong'; have: number; hint: boolean };

/** The round's one hint comes with the second over-count, wrong check or wrong kind, whichever is first. */
function hintDue(s: CountState): boolean {
  if (s.hinted || (s.overs < 2 && s.wrongChecks < 2 && s.wrongKinds < 2)) return false;
  s.hinted = true;
  return true;
}

export function countStamp(s: CountState, place: number, token: number): CountEvent {
  if (s.done || place < 0 || place >= s.places.length || s.placed[place] !== null) return { kind: 'ignored' };
  if (!fitsKind(s, token)) {
    s.wrongKinds++;
    return { kind: 'wrongKind', token, hint: hintDue(s) };
  }
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

/**
 * Level 9, Count a kind: the sign asks for a number of one color ("three blue spots") or one shape ("two hearts"). Only
 * that kind counts; a stamp of another kind goes back to the tray. One attribute per sign, so two parts never contradict.
 */
export type KindWant = { attr: 'color'; value: ColorName } | { attr: 'shape'; value: ShapeKind };

/** Whether a stamp counts on this board: any stamp on level 8, only the sign's kind on level 9. */
export function fitsKind(s: Pick<CountState, 'kind'>, token: number): boolean {
  const k = s.kind;
  if (!k) return true;
  const t = BUG_TOKENS[token];
  return k.attr === 'color' ? t.color === k.value : t.shape === k.value;
}

/** The places of a bare bug, row by row with the left wing first: the same places the matching levels use. */
export function bugPlaces(plan: BugPlan): { x: number; y: number }[] {
  const places: { x: number; y: number }[] = [];
  for (let row = 0; row < plan.rows; row++)
    for (let col = 0; col < plan.columns; col++) {
      const x = plan.columns === 1 ? 94 : 72 + col * 116;
      const y = (row - (plan.rows - 1) / 2) * 116;
      places.push({ x: -x, y }, { x, y });
    }
  return places;
}

/**
 * A kind board: six open places, a sign for 2 to 4 of one color or one shape, and a tray of four stamps where two are
 * that kind (so "any blue one" is a real choice) and two are not.
 */
export function kindBoard(plan: BugPlan, rng: Rng): { state: CountState; tokens: number[] } {
  const attr = rng.pick(['color', 'shape'] as const);
  // Only a kind with two stamps in the pool can fill a tray with two of it.
  const values = [...new Set(BUG_TOKENS.map((t) => t[attr]))].filter(
    (v) => BUG_TOKENS.filter((t) => t[attr] === v).length >= 2,
  );
  const value = rng.pick(values);
  const all = BUG_TOKENS.map((_, i) => i);
  const fits = rng.shuffle(all.filter((i) => BUG_TOKENS[i][attr] === value)).slice(0, 2);
  const others = rng.shuffle(all.filter((i) => BUG_TOKENS[i][attr] !== value)).slice(0, plan.colors - 2);
  const places = bugPlaces(plan);
  return {
    tokens: rng.shuffle([...fits, ...others]),
    state: {
      want: rng.int(2, 4),
      places,
      placed: places.map(() => null),
      order: [],
      overs: 0,
      wrongChecks: 0,
      kind: attr === 'color' ? { attr, value: value as ColorName } : { attr, value: value as ShapeKind },
      wrongKinds: 0,
      hinted: false,
      done: false,
    },
  };
}

const SHAPE_PLURAL: Partial<Record<ShapeKind, string>> = {
  circle: 'circles',
  triangle: 'triangles',
  square: 'squares',
  heart: 'hearts',
  star: 'stars',
  hexagon: 'hexagons',
};

/** The kind in words: `many` for the sign ("blue spots", "hearts"), `one` for a single stamp ("blue", "a heart"). */
export function kindWords(k: KindWant): { many: string; one: string } {
  if (k.attr === 'color') return { many: `${k.value} spots`, one: k.value };
  return { many: SHAPE_PLURAL[k.value] ?? `${k.value}s`, one: `a ${k.value}` };
}

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  // Counting to five with a stop comes after copying; the mirror levels 6 and 7 stay out of preschool.
  preschool: { min: 2, max: 8, order: [2, 3, 4, 5, 8] },
  // Count a kind follows Count the spots in pre-K, before the bigger mirrors.
  prek: { min: 4, max: 9, order: [4, 5, 8, 9, 6, 7] },
  school: { min: 6, max: 7 },
};
