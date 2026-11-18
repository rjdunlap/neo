import type { BandLevels } from '../../progress/difficulty';
import type { ColorName } from '../../art/palette';
import type { ShapeKind } from '../../art/shapes';
import type { Rng } from '../../engine/random';
import { spread } from '../../engine/view';

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
  {
    mode: 'fold',
    rows: 3,
    columns: 2,
    colors: 3,
    name: 'Fold a friend: predict which finished bug the folded wing will make',
  },
  {
    mode: 'mend',
    rows: 3,
    columns: 2,
    colors: 3,
    name: 'Mend the wing: find the spot that differs from its twin and fix it',
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

/**
 * Level 10, Fold a friend: the left wing has three spots and the right wing is folded under. Three finished bugs are the
 * choices: the true fold (each spot across the line, just as far from the middle), the same wing slid across (so the
 * inner and outer spots change places), and the true fold with two spots' stamps swapped. The prediction is unscored:
 * whatever she taps, the wing folds over and shows the answer.
 */
export type FoldKind = 'mirror' | 'slide' | 'swap';
export interface FoldChoice {
  kind: FoldKind;
  /** The spots on both wings of this finished bug, in the board's own units. */
  spots: BugSpot[];
}
export interface FoldBoard {
  /** The left wing's spots, which the fold carries across. */
  left: BugSpot[];
  /** The three finished bugs, in the order they are shown; exactly one is `mirror`. */
  choices: FoldChoice[];
  /** Where the true fold is among the choices. */
  answer: number;
}

const sameSpot = (a: BugSpot, b: BugSpot) => a.x === b.x && a.y === b.y && a.token === b.token;
/** Two bugs look the same when every spot of one is a spot of the other. */
export function sameBug(a: readonly BugSpot[], b: readonly BugSpot[]): boolean {
  return a.length === b.length && a.every((s) => b.some((t) => sameSpot(s, t)));
}
/** The right wing a fold across the middle line makes: each spot just as far from the middle on the other side. */
export const foldAcross = (left: readonly BugSpot[]): BugSpot[] => left.map((s) => ({ ...s, x: -s.x }));

export function foldBoard(plan: BugPlan, rng: Rng): FoldBoard {
  const tokens = pickTokens(plan, rng);
  // Three of the left wing's six places (two columns, three rows), each with a different stamp.
  const places = bugPlaces(plan).filter((p) => p.x < 0);
  const left = rng
    .shuffle(places)
    .slice(0, 3)
    .map((p, i) => ({ ...p, token: tokens[i] }));
  const xs = [...new Set(places.map((p) => p.x))];
  const [lo, hi] = [Math.min(...xs), Math.max(...xs)];
  // Slid across without turning over: the wing moves right as a whole, so its outer column lands inner and its inner outer.
  const slide = left.map((s) => ({ ...s, x: s.x === lo ? -hi : -lo }));
  const mirror = foldAcross(left);
  const [a, b] = rng.shuffle([0, 1, 2]);
  const swap = mirror.map((s, i) =>
    i === a ? { ...s, token: mirror[b].token } : i === b ? { ...s, token: mirror[a].token } : s,
  );
  const choices = rng.shuffle<FoldChoice>([
    { kind: 'mirror', spots: [...left, ...mirror] },
    { kind: 'slide', spots: [...left, ...slide] },
    { kind: 'swap', spots: [...left, ...swap] },
  ]);
  return { left, choices, answer: choices.findIndex((c) => c.kind === 'mirror') };
}

/**
 * Level 11, Mend the wing: a finished bug whose right wing should be the fold of the left, with one place wrong (a stamp
 * of the wrong color, of the wrong shape, or a spot missing). She taps the place that differs from its twin, then drags
 * the twin's stamp onto it from the tray. A tap on a place that matches its twin is a miss; the round's one hint comes
 * with the second miss and glows the next useful move from then on.
 */
export type MendFlaw = 'color' | 'shape' | 'missing';
export interface MendState {
  /** The left wing's three spots, which the right wing should mirror. */
  left: BugSpot[];
  /** The right wing's six places, in the board's own units (each a tap target, stamped or not). */
  places: { x: number; y: number }[];
  /** The stamp on each right-wing place now, or null where there is none. */
  right: (number | null)[];
  /** The one place that differs from its twin. */
  wrong: number;
  /** The stamp that place should have: its twin's. */
  want: number;
  flaw: MendFlaw;
  /** The tray: the left wing's three stamps and one more (the wrong stamp itself, or a look-alike when one is missing). */
  tokens: number[];
  found: boolean;
  misses: number;
  hinted: boolean;
  done: boolean;
}

/** The stamps that differ from `token` in exactly one way: the same shape in another color, or the same color in another shape. */
export function lookAlikes(token: number, flaw: 'color' | 'shape'): number[] {
  const t = BUG_TOKENS[token];
  return BUG_TOKENS.flatMap((u, i) =>
    flaw === 'color'
      ? u.shape === t.shape && u.color !== t.color
        ? [i]
        : []
      : u.color === t.color && u.shape !== t.shape
        ? [i]
        : [],
  );
}

export function mendBoard(plan: BugPlan, rng: Rng): MendState {
  const flaw = rng.pick<MendFlaw>(['color', 'shape', 'missing']);
  const leftPlaces = bugPlaces(plan).filter((p) => p.x < 0);
  // A star or a hexagon has no other color in the pool, and purple or red no other shape: draw until a spot can carry the flaw.
  let tokens = pickTokens(plan, rng);
  for (let i = 0; i < 50 && flaw !== 'missing' && tokens.every((t) => !lookAlikes(t, flaw).length); i++)
    tokens = pickTokens(plan, rng);
  const left = rng
    .shuffle([...leftPlaces])
    .slice(0, 3)
    .map((p, i) => ({ ...p, token: tokens[i] }));
  const places = leftPlaces.map((p) => ({ x: -p.x, y: p.y }));
  const twin = (p: { x: number; y: number }) => left.find((s) => s.x === -p.x && s.y === p.y);
  const right = places.map((p) => twin(p)?.token ?? null);
  const candidates = places
    .map((_, i) => i)
    .filter((i) => right[i] !== null && (flaw === 'missing' || lookAlikes(right[i]!, flaw).length > 0));
  const wrong = rng.pick(candidates);
  const want = right[wrong]!;
  let extra: number;
  if (flaw === 'missing') {
    // Something that looks a little like the missing stamp, so the tray still asks her to look closely.
    const near = [...lookAlikes(want, 'color'), ...lookAlikes(want, 'shape')].filter(
      (t) => !tokens.includes(t),
    );
    extra = near.length
      ? rng.pick(near)
      : rng.pick(BUG_TOKENS.map((_, i) => i).filter((i) => !tokens.includes(i)));
    right[wrong] = null;
  } else {
    extra = rng.pick(lookAlikes(want, flaw));
    right[wrong] = extra;
  }
  return {
    left,
    places,
    right,
    wrong,
    want,
    flaw,
    tokens: rng.shuffle([...left.map((s) => s.token), extra]),
    found: false,
    misses: 0,
    hinted: false,
    done: false,
  };
}

/** The right wing as spots, for comparing with the fold of the left. */
export function mendRight(s: Pick<MendState, 'places' | 'right'>): BugSpot[] {
  return s.places.flatMap((p, i) => (s.right[i] === null ? [] : [{ ...p, token: s.right[i]! }]));
}

/** The right-wing places that differ from their twins across the line. */
export function mendDiffers(s: Pick<MendState, 'places' | 'right' | 'left'>): number[] {
  return s.places
    .map((_, i) => i)
    .filter((i) => {
      const p = s.places[i],
        t = s.left.find((l) => l.x === -p.x && l.y === p.y);
      return (t?.token ?? null) !== s.right[i];
    });
}

export type MendEvent =
  | { kind: 'ignored' }
  /** She tapped the place that differs: its wrong stamp comes off, ready for the right one. */
  | { kind: 'found' }
  /** A tap on a place that matches its twin: a miss, and a look across the line. */
  | { kind: 'twin'; place: number; hint: boolean }
  /** A stamp that is not the twin's, let go on the place that differs: a miss; it goes back to the tray. */
  | { kind: 'wrongStamp'; token: number; hint: boolean }
  | { kind: 'mended' };

function mendHintDue(s: MendState): boolean {
  if (s.hinted || s.misses < 2) return false;
  s.hinted = true;
  return true;
}

export function mendTap(s: MendState, place: number): MendEvent {
  if (s.done || place < 0 || place >= s.places.length) return { kind: 'ignored' };
  if (place === s.wrong) {
    if (s.found) return { kind: 'ignored' };
    s.found = true;
    s.right[place] = null;
    return { kind: 'found' };
  }
  s.misses++;
  return { kind: 'twin', place, hint: mendHintDue(s) };
}

/**
 * A stamp let go on a right-wing place. Only the place that differs takes a stamp; the twin's stamp mends it, even
 * before she has tapped it (she has seen it all the same). Let go anywhere else, the stamp just goes back to the tray.
 */
export function mendDrop(s: MendState, place: number, token: number): MendEvent {
  if (s.done || place !== s.wrong) return { kind: 'ignored' };
  if (token !== s.want) {
    s.misses++;
    return { kind: 'wrongStamp', token, hint: mendHintDue(s) };
  }
  s.found = true;
  s.right[place] = token;
  s.done = true;
  return { kind: 'mended' };
}

export type MendMove = { tap: number } | { stamp: number; place: number };

/** The next useful move, for the ghost finger and the hint's glow: tap the place that differs, then give it the twin's stamp. */
export function mendMove(s: MendState): MendMove | null {
  if (s.done) return null;
  return s.found ? { stamp: s.want, place: s.wrong } : { tap: s.wrong };
}

/** The right-wing place a stamp let go at (x, y) lands on, stamped or not, or -1. */
export function mendPlaceAt(s: Pick<MendState, 'places'>, x: number, y: number): number {
  return s.places.findIndex((p) => Math.hypot(x - p.x, y - p.y) < SLOT_REACH);
}

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  // Counting to five with a stop comes after copying; the mirror levels 6 and 7 stay out of preschool.
  preschool: { min: 2, max: 8, order: [2, 3, 4, 5, 8] },
  // Count a kind follows Count the spots in pre-K, before the bigger mirrors; Fold a friend comes after the mirrors.
  // Mend the wing follows Fold a friend in pre-K and school.
  prek: { min: 4, max: 11, order: [4, 5, 8, 9, 6, 7, 10, 11] },
  school: { min: 6, max: 11, order: [6, 7, 10, 11] },
};

/** A point or a box in the view's logical units (a box by its top-left corner). */
export interface Point {
  x: number;
  y: number;
}
export interface Box extends Point {
  w: number;
  h: number;
}

/** Touch sizes: a tray stamp's circle, a tapped place's circle, and the check button (drawn 58, touched 14 wider). */
export const STAMP_HIT = 55,
  PLACE_TAP = 56,
  CHECK_RADIUS = 58,
  CHECK_HIT = CHECK_RADIUS + 14;
/** How far apart two rows of tray stamps sit when an upright view cannot hold them in one. */
const TRAY_ROW = 125;

/** A view taller than any tablet: a phone held upright (the same rule for every level, Fold a friend's since it was built). */
export const isTall = (v: { w: number; h: number }) => v.h > v.w * 1.3;

/** How far a drawn bug reaches from its middle, in its own units: antennae to wing tips, and out to its feet. */
export function bugSpan(plan: Pick<BugPlan, 'rows' | 'columns'>): {
  top: number;
  bottom: number;
  halfW: number;
} {
  const ry = plan.rows === 1 ? 105 : plan.rows === 2 ? 156 : 207;
  return { top: ry + 78, bottom: ry + 4, halfW: plan.columns === 1 ? 220 : 308 };
}

/** The count sign's card for a number: the numeral over rows of up to three marks (half its width and height). */
export function signSize(want: number): { halfW: number; halfH: number } {
  const cols = Math.min(3, want),
    rows = Math.ceil(want / 3);
  return { halfW: Math.max(70, (cols * 44) / 2 + 18), halfH: (88 + rows * 44 + 18) / 2 };
}

export interface BugLayout {
  /** The bug she works on: its middle, and how large it is drawn (1 sideways; larger where an upright view has the room). */
  board: Point & { scale: number };
  /** Copy levels: the little model bug, the card behind it, and the arrow from it to the bug (pointing right, or down). */
  model: Point & { scale: number };
  card: Box | null;
  arrow: (Point & { down: boolean }) | null;
  /** Count levels: the sign and the check button. */
  sign: Point | null;
  check: Point | null;
  /** The tray panel and each stamp's home on it, in tray order. */
  trayBox: Box;
  tray: Point[];
}

/**
 * Where everything on levels 1 to 9 and 11 sits: the scenes place from this and the upright test reads it. Sideways it is
 * the layout the game has always had. On a phone held upright the bug sits in the middle of the room above the tray and is
 * drawn as large as the width and that room allow (up to 1.3), a copy level's model goes above the bug instead of beside
 * it, and six stamps take two rows of three. The count levels keep their sign beside the bug at every shape.
 */
export function bugLayout(
  v: { w: number; h: number },
  plan: Pick<BugPlan, 'mode' | 'rows' | 'columns'>,
  stamps: number,
  signHalfW = 70,
): BugLayout {
  const tall = isTall(v);
  const row = spread(stamps, 175, v.w - 45, 130);
  // Stamps closer than their touch circles (six across 768 units) go in two rows; only an upright view is that narrow.
  const upper = tall && stamps > 1 && row[1] - row[0] < STAMP_HIT * 2 + 4 ? Math.ceil(stamps / 2) : 0;
  const lift = upper ? TRAY_ROW : 0;
  const tray = upper
    ? [
        ...spread(upper, 175, v.w - 45, 130).map((x) => ({ x, y: v.h - 87 - TRAY_ROW })),
        ...spread(stamps - upper, 175, v.w - 45, 130).map((x) => ({ x, y: v.h - 87 })),
      ]
    : row.map((x) => ({ x, y: v.h - 87 }));
  const trayBox = { x: 165, y: v.h - 155 - lift, w: v.w - 200, h: 135 + lift };
  const cy = Math.max(365, (v.h - 160) / 2);
  const counting = plan.mode === 'count' || plan.mode === 'kind';
  const copy = plan.mode === 'copy';
  let sign: Point | null = null,
    check: Point | null = null;
  if (counting) {
    const x = Math.max(signHalfW + 30, v.w * 0.2);
    sign = { x, y: cy - 70 };
    check = { x, y: Math.min(cy + 150, v.h - 230) };
  }
  if (!tall || counting) {
    const model = { x: v.w * 0.24, y: cy, scale: 0.62 };
    return {
      board: { x: copy ? v.w * 0.68 : counting ? v.w * 0.6 : v.w / 2, y: cy, scale: 1 },
      model,
      card: copy ? { x: model.x - 155, y: cy - 200, w: 310, h: 395 } : null,
      arrow: copy ? { x: v.w * 0.43, y: cy, down: false } : null,
      sign,
      check,
      trayBox,
      tray,
    };
  }
  // Upright: a copy level's model card across the top (right of Home and "?"), the arrow under it, then the bug.
  const model = { x: v.w / 2, y: 216, scale: 0.62 };
  const span = bugSpan(plan);
  const top = copy ? 455 : 20,
    bottom = trayBox.y - 20;
  const scale = Math.min(1.3, (v.w - 40) / (span.halfW * 2), (bottom - top) / (span.top + span.bottom));
  return {
    board: { x: v.w / 2, y: (top + bottom + (span.top - span.bottom) * scale) / 2, scale },
    model,
    card: copy ? { x: model.x - 155, y: model.y - 200, w: 310, h: 395 } : null,
    arrow: copy ? { x: v.w / 2, y: 433, down: true } : null,
    sign,
    check,
    trayBox,
    tray,
  };
}

/** A choice card on Fold a friend: wide and tall enough for a whole small bug, far past the 100-unit touch target. */
export const FOLD_CARD = { w: 250, h: 240 };
/** The fold level's bug, from the antennae (-285) to the wing tips (+207), in its own units. */
export const FOLD_BUG = { top: 285, bottom: 207 };

export interface FoldLayout {
  board: Point & { scale: number };
  /** The three cards' middles, and their scale: 1 in a row along the bottom, larger when a tall view stacks them. */
  cards: Point[];
  cardScale: number;
}

/** Where Fold a friend's bug and three choice cards sit: the scene places from this and the upright test reads it. */
export function foldLayout(v: { w: number; h: number }): FoldLayout {
  const gap = 24,
    bugH = FOLD_BUG.top + FOLD_BUG.bottom;
  let bugScale: number, k: number, cards: Point[];
  if (isTall(v)) {
    // A tall view (a phone held upright): the bug across the top, the cards stacked larger in the middle below it, each
    // clear of the pet's corner at the bottom left.
    bugScale = Math.min(1, (v.w - 80) / 640);
    const top = 20 + bugH * bugScale + 40,
      room = v.h - 30 - top;
    k = Math.min(1.6, (room - 2 * gap) / (3 * FOLD_CARD.h), (v.w - 2 * 175) / FOLD_CARD.w);
    const step = FOLD_CARD.h * k + gap,
      y0 = top + room / 2 - step;
    cards = [0, 1, 2].map((i) => ({ x: v.w / 2, y: y0 + i * step }));
  } else {
    // The cards sit in a row along the bottom, right of the pet's corner; the bug fills the space above them.
    k = Math.min(1, (v.w - 220 - 2 * gap) / (3 * FOLD_CARD.w));
    const cardY = v.h - (FOLD_CARD.h * k) / 2 - 28;
    cards = spread(3, 175, v.w - 45, FOLD_CARD.w * k + gap).map((x) => ({ x, y: cardY }));
    const room = cardY - (FOLD_CARD.h * k) / 2 - 40;
    bugScale = Math.min(0.85, room / bugH, (v.w - 120) / 640);
  }
  return { board: { x: v.w / 2, y: 20 + FOLD_BUG.top * bugScale, scale: bugScale }, cards, cardScale: k };
}
