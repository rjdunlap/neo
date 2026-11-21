import type { CritterName } from '../../art/critter';
import { RAINBOW, type ColorName } from '../../art/palette';
import type { AnimalSound } from '../../audio/sfx';
import type { Rng } from '../../engine/random';
import type { LineId } from '../../content/voice-script';
import type { BandLevels } from '../../progress/difficulty';

export type BubbleMode = 'free' | 'color' | 'count' | 'bonds' | 'size' | 'dots' | 'match';
export type BubbleSize = 'big' | 'little';

/**
 * Modes where a particular bubble is needed (the next number, a partner) are laid out whole and drift in place,
 * so the one she needs never floats off the top. Free and color bubbles rise and leave; color mode sends the
 * asked-for color again whenever none is showing (`spawnTarget`), so none of its rounds is stranded; size mode does
 * the same for the asked-for size. Dot bubbles drift in place, one of each count, so the count asked for is always there;
 * so do the match bubbles, a numeral and its dots for each count, so every bubble's partner is always there.
 */
export const staysPut = (mode: BubbleMode) =>
  mode === 'count' || mode === 'bonds' || mode === 'dots' || mode === 'match';

/**
 * The friends that can ride in a bubble, in this order. The sticker draws from this list with `rng.pick`, so growing
 * or reordering it would change the picture on every sticker she already owns: a test pins it. New pictures in
 * bubbles belong in their own pool.
 */
export const FRIENDS = [
  'duck',
  'pig',
  'cat',
  'bunny',
  'cow',
  'bear',
  'dog',
] as const satisfies readonly CritterName[];
export type Friend = (typeof FRIENDS)[number];

/** The voice each friend has when it is let out of its bubble. */
export const FRIEND_SOUND: Record<Friend, AnimalSound> = {
  duck: 'quack',
  pig: 'oink',
  cat: 'meow',
  bunny: 'hop',
  cow: 'moo',
  bear: 'growl',
  dog: 'woof',
};

/**
 * Pictures that can ride in a free-play bubble, two for each scene the round can float in. They are not friends: the
 * sticker never draws from this pool, so it can grow without changing a sticker she owns.
 */
export const PICTURES = {
  shore: ['flower', 'shell'],
  bath: ['rubber-duck', 'boat'],
  night: ['star', 'moon'],
  sea: ['fish', 'starfish'],
} as const;
export type PictureScene = keyof typeof PICTURES;
export type PictureName = (typeof PICTURES)[PictureScene][number];
export const pictureLine = (name: PictureName) => `bubble.picture.${name}` as const;

/** What rides inside a free-play bubble: a friend in about three of ten, one of the scene's pictures in about one of seven, else nothing. */
export function riderFor(rng: Rng, scene: PictureScene): { friend?: Friend; picture?: PictureName } {
  if (rng.chance(0.3)) return { friend: rng.pick(FRIENDS) };
  return rng.chance(0.2) ? { picture: rng.pick(PICTURES[scene]) } : {};
}

export interface BubblePlan {
  mode: BubbleMode;
  /** Pops (or numbers) needed before the rainbow bubble. */
  goal: number;
  /** Pixels per second. */
  speed: number;
  /** Most bubbles on screen at once. */
  most: number;
  /** Colors in play (color mode). */
  colors: number;
  radius: [number, number];
  /** Bonds mode: the total each pair makes. */
  sum?: number;
  /**
   * Count mode: where the run begins, as an inclusive range drawn each round. Left out it begins at 1. For a skip count
   * it is in steps (3 means the third multiple), so a run by tens can begin at 10, 20 or 30.
   */
  start?: [number, number];
  /** Count mode: the steps a round may count by (one drawn each round). Left out it counts up by 1; -1 counts back to 1. */
  steps?: number[];
  /** Free mode: a tap anywhere on the screen pops the nearest bubble that is showing (`nearestShown`); no bubble is aimed at. */
  anywhere?: boolean;
  /** Size mode: the radius ranges of the two sizes; the round asks for one of them. */
  sizes?: Record<BubbleSize, [number, number]>;
  /** Dots and match modes: the largest dot count a bubble carries (one bubble, or in match one pair, of each count from 1 is always showing). */
  dotsTo?: number;
}

/** One entry per level. Lap levels are pure popping; then colors; then numbers in order. */
export const PLANS: BubblePlan[] = [
  { mode: 'free', goal: 12, speed: 55, most: 5, colors: 0, radius: [72, 96] },
  { mode: 'free', goal: 15, speed: 65, most: 6, colors: 0, radius: [64, 90] },
  { mode: 'free', goal: 18, speed: 75, most: 7, colors: 0, radius: [58, 84] },
  { mode: 'color', goal: 8, speed: 55, most: 5, colors: 2, radius: [66, 86] },
  { mode: 'color', goal: 10, speed: 60, most: 6, colors: 3, radius: [62, 82] },
  { mode: 'color', goal: 12, speed: 70, most: 7, colors: 5, radius: [56, 76] },
  { mode: 'count', goal: 5, speed: 35, most: 5, colors: 0, radius: [62, 74] },
  { mode: 'count', goal: 7, speed: 42, most: 7, colors: 0, radius: [56, 68] },
  { mode: 'count', goal: 10, speed: 48, most: 10, colors: 0, radius: [50, 60] },
  // Pre-K and early school: pop two bubbles that make a number together.
  { mode: 'bonds', goal: 4, speed: 28, most: 8, colors: 0, radius: [58, 68], sum: 5 },
  { mode: 'bonds', goal: 5, speed: 32, most: 10, colors: 0, radius: [54, 62], sum: 10 },
  // Counting sequences, not sums: start at a number, count back to 1, count by tens or fives.
  { mode: 'count', goal: 6, speed: 38, most: 6, colors: 0, radius: [58, 70], start: [2, 7] },
  { mode: 'count', goal: 10, speed: 40, most: 10, colors: 0, radius: [52, 62], start: [5, 10], steps: [-1] },
  { mode: 'count', goal: 5, speed: 40, most: 5, colors: 0, radius: [58, 70], start: [1, 3], steps: [10, 5] },
  // Below level 1, for lap: a swat anywhere pops the nearest bubble (a flat palm of four or more contacts is palm
  // rejection and does nothing). Big, slow and few, so what pops is plain.
  { mode: 'free', goal: 8, speed: 42, most: 4, colors: 0, radius: [96, 118], anywhere: true },
  // Toddler, between levels 3 and 4: two sizes and the round asks for one. Slower and fewer than level 3, because
  // which bubble is now a choice; a little one is still drawn 100 units across (the dive's 42–48 counted the tap reach).
  {
    mode: 'size',
    goal: 8,
    speed: 50,
    most: 5,
    colors: 0,
    radius: [50, 104],
    sizes: { little: [50, 54], big: [92, 104] },
  },
  // Preschool, between levels 6 and 7: dot patterns with no numeral, one bubble each of 1 to 4, "pop the one with four".
  { mode: 'dots', goal: 6, speed: 30, most: 4, colors: 0, radius: [70, 82], dotsTo: 4 },
  // Preschool, between levels 7 and 8: a numeral and a dot bubble for each of 1 to 4, all drifting; tap one, then its
  // partner (the same number the other way). After level 7, where the numerals first appear with dots beneath them.
  { mode: 'match', goal: 6, speed: 28, most: 8, colors: 0, radius: [60, 68], dotsTo: 4 },
];

/** The two sizes must be told apart at a glance: the smallest big bubble is at least this many times the largest little one. */
export const SIZE_RATIO = 1.7;

export const LEVELS: BandLevels = {
  // Level 15 is the easiest, so lap plays it first and then 1, 2, 3 (see `order`).
  lap: { min: 1, max: 15, order: [15, 1, 2, 3] },
  // Level 16 (big and little) sits where color sits: after free popping, before two colors.
  toddler: { min: 1, max: 16, order: [1, 2, 3, 16, 4, 5, 6] },
  // Level 17 (which one has the dots) comes before the numerals at 7; level 18 (dots and numbers together) after 7,
  // the first level that shows her numerals, and before 8 counts further.
  preschool: { min: 4, max: 18, order: [4, 5, 6, 17, 7, 18, 8, 9] },
  prek: { min: 6, max: 12 },
  school: { min: 10, max: 14 },
};

/** Bonds mode: numbers for `pairs` pairs that each make `sum`, so every bubble has a partner. */
export function bondNumbers(sum: number, pairs: number, rng: Rng): number[] {
  const out: number[] = [];
  const firsts = rng.shuffle(Array.from({ length: Math.floor(sum / 2) }, (_, i) => i + 1));
  for (let i = 0; i < pairs; i++) {
    const a = firsts[i % firsts.length];
    out.push(a, sum - a);
  }
  return rng.shuffle(out);
}

/**
 * Count mode: the numbers in the order they are popped. Counting up runs `goal` numbers from the start; counting back
 * runs from the start down to 1 (so `goal` is the longest it can be); a skip count runs `goal` multiples of its step.
 */
export function countRun(plan: BubblePlan, rng: Rng): number[] {
  if (!plan.start) return Array.from({ length: plan.goal }, (_, i) => i + 1);
  const step = plan.steps ? rng.pick(plan.steps) : 1;
  const begin = rng.int(plan.start[0], plan.start[1]);
  if (step < 0) return Array.from({ length: begin }, (_, i) => begin - i);
  const first = step > 1 ? begin * step : begin;
  return Array.from({ length: plan.goal }, (_, i) => first + i * step);
}

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** A bubble answers taps a little outside its drawing. */
export const TAP_REACH = 1.2;

/** Color mode: the colors in play, the one to pop first. */
export const choosePalette = (rng: Rng, colors: number): ColorName[] =>
  rng.shuffle([...RAINBOW]).slice(0, colors);

/**
 * Color mode: should the next bubble be the color to pop? The first two always are (an errorless start),
 * and so is any bubble that arrives while none of that color is showing, so there is always one to pop.
 */
export const spawnTarget = (spawned: number, targetShowing: boolean, rng: Rng) =>
  spawned < 2 || !targetShowing || rng.chance(0.55);

/** Size mode: is the next bubble the size to pop? As `spawnTarget`: the first two are, and one always is while none is showing. */
export const spawnSize = (spawned: number, wantShowing: boolean, want: BubbleSize, rng: Rng): BubbleSize =>
  spawnTarget(spawned, wantShowing, rng) ? want : want === 'big' ? 'little' : 'big';

/**
 * Dots mode: the counts asked for, in order. Every count from 1 to the plan's most is asked once first (shuffled), then
 * more are drawn, never the same count twice running, so each ask is a fresh look and not a repeat of the last pop.
 */
export function dotAsks(plan: BubblePlan, rng: Rng): number[] {
  const to = plan.dotsTo ?? 4;
  const asks = rng.shuffle(Array.from({ length: to }, (_, i) => i + 1)).slice(0, plan.goal);
  while (asks.length < plan.goal) {
    const last = asks[asks.length - 1];
    asks.push(rng.pick(Array.from({ length: to }, (_, i) => i + 1).filter((n) => n !== last)));
  }
  return asks;
}

export interface BubbleFace {
  color: ColorName | null;
  /** The numeral on it, or in dots mode (and on a match-mode `pips` bubble) how many dots it carries. */
  number?: number;
  size?: BubbleSize;
  /** The number is drawn as dice pips with no numeral. */
  pips?: boolean;
}

/** Match mode: what one pair is, a numeral bubble and a dot bubble of the same count. */
export interface MatchFace {
  number: number;
  pips: boolean;
  color: ColorName;
}

/**
 * Match mode: the two bubbles of one count, a numeral and its dice pips. Their colors are drawn apart, so the pair is
 * found by the number and never by a color.
 */
export function matchPair(n: number, rng: Rng): [MatchFace, MatchFace] {
  const [a, b] = rng.shuffle([...RAINBOW]);
  return [
    { number: n, pips: false, color: a },
    { number: n, pips: true, color: b },
  ];
}

/** Match mode: the opening faces, one pair for each count from 1 to the plan's `dotsTo`, in a shuffled order. */
export const matchFaces = (plan: BubblePlan, rng: Rng): MatchFace[] =>
  rng.shuffle(Array.from({ length: plan.dotsTo ?? 4 }, (_, i) => matchPair(i + 1, rng)).flat());

/** Match mode: two bubbles are partners when they carry the same number, one as a numeral and one as dots. */
export const partners = (a: BubbleFace, b: BubbleFace) =>
  a !== b && a.number !== undefined && a.number === b.number && !!a.pips !== !!b.pips;

/**
 * Match mode, the second tap while one is held: `match` pops the pair, `switch` moves the hold to a bubble of the same
 * kind (both numerals or both dots, which is changing her mind and not a wrong answer), `release` lets the held one go,
 * and `miss` is the other kind with another number.
 */
export function matchTap(held: BubbleFace, tapped: BubbleFace): 'match' | 'switch' | 'release' | 'miss' {
  if (held === tapped) return 'release';
  if (partners(held, tapped)) return 'match';
  return !!held.pips === !!tapped.pips ? 'switch' : 'miss';
}

/** Whether popping this bubble counts: anything in free play, the asked-for color or size, the next number, or the dot count asked for. */
export function isRight(
  mode: BubbleMode,
  b: BubbleFace,
  target: ColorName | null,
  next: number,
  size: BubbleSize | null = null,
): boolean {
  if (mode === 'free') return true;
  if (mode === 'size') return b.size === size;
  return mode === 'color' ? b.color === target : b.number === next;
}

export interface Reachable extends BubbleFace {
  x: number;
  y: number;
  r: number;
}

/**
 * Bubbles overlap as they drift. When a finger lands on a wrong bubble that also covers a right one,
 * the right one is what she meant: pick it instead of counting a miss.
 */
export function meant<T extends Reachable>(
  tapped: T,
  all: readonly T[],
  at: { x: number; y: number },
  right: (b: T) => boolean,
): T {
  if (right(tapped)) return tapped;
  return (
    all.find((b) => b !== tapped && right(b) && Math.hypot(b.x - at.x, b.y - at.y) <= b.r * TAP_REACH) ??
    tapped
  );
}

export interface DemoBubble extends Reachable {
  rainbow?: boolean;
}

/**
 * Where a new bubble of radius `r` may start in a `w` × `h` view: a still one (count and bonds) anywhere right of Home, "?"
 * and the guide and below the sign, a rising one just below the bottom edge, right of the guide's column. Ranges of its middle.
 */
export function spawnBox(w: number, h: number, r: number, still: boolean, anywhere = false) {
  // Pop anywhere: a rising bubble starts already in reach (its middle half a radius up), so a touch never meets an empty screen.
  const rise = anywhere ? h - r / 2 : h + r + 10;
  return still
    ? { x: [150 + r, w - 50 - r], y: [130 + r, h - 60 - r] }
    : { x: [130 + r, w - 40 - r], y: [rise, rise] };
}

/**
 * Where a still bubble starts: a random spot in `box` clear of the bubbles already there, so two never begin stacked
 * (overlapping dots read as one bigger count). The spot farthest from the rest after a few tries when none is clear.
 */
export function clearSpot(
  box: { x: number[]; y: number[] },
  r: number,
  others: readonly { x: number; y: number; r: number }[],
  rng: Rng,
  tries = 24,
): { x: number; y: number } {
  let best = { x: box.x[0], y: box.y[0] };
  let bestGap = -Infinity;
  for (let i = 0; i < tries; i++) {
    const at = { x: rng.range(box.x[0], box.x[1]), y: rng.range(box.y[0], box.y[1]) };
    const gap = Math.min(Infinity, ...others.map((o) => Math.hypot(o.x - at.x, o.y - at.y) - o.r - r));
    if (gap > 8) return at;
    if (gap > bestGap) [best, bestGap] = [at, gap];
  }
  return best;
}

/**
 * Whether a bubble's middle is comfortably on the screen, at least half its radius in from every edge, so a finger can
 * reach it. A bubble rising in from below counts only once its middle is half a radius above the bottom edge, not as soon
 * as its top shows.
 */
export const inReach = (b: Reachable, w: number, h: number) =>
  b.x >= b.r / 2 && b.x <= w - b.r / 2 && b.y >= b.r / 2 && b.y <= h - b.r / 2;

/**
 * Pop anywhere: the one large bubble already standing when Play is pressed, so her first touch anywhere pops something.
 * Bigger than any rising bubble, in the middle of the space right of Home, "?" and the guide and below the top bar, and
 * shrunk only as far as needed to fit there.
 */
export function openingBubble(plan: BubblePlan, w: number, h: number) {
  const fit = Math.min((w - 200) / 2, (h - 190) / 2);
  const r = Math.max(plan.radius[1], Math.min(Math.round(plan.radius[1] * 1.3), fit));
  return { x: (150 + w - 50) / 2, y: (130 + h - 60) / 2, r };
}

/**
 * How many bubbles may be on the screen after `pops` pops. Pop anywhere starts with the opening bubble alone and lets one
 * more rise in for each pop, up to the plan's most, so more arrive because she touched and none on a timer into an empty
 * screen. Every other level fills to its most from the start.
 */
export const roomFor = (plan: BubblePlan, pops: number) =>
  plan.anywhere ? Math.min(plan.most, 1 + pops) : plan.most;

/**
 * The bubble a capable player taps next, for the how-to card's ghost finger: anything in free play, one of the
 * asked-for color, the next number, or in bonds the first of a pair and then its partner. In the free kinds it is the
 * highest bubble that is not about to float off, so the hand is seen on the screen and not at its edge. Null when nothing
 * right is showing yet. Never the finale's rainbow bubble.
 */
export function bubbleToPop<T extends DemoBubble>(
  mode: BubbleMode,
  shown: readonly T[],
  target: ColorName | null,
  next: number,
  sum: number | undefined,
  held: T | null,
  size: BubbleSize | null = null,
): T | null {
  const live = shown.filter((b) => !b.rainbow);
  const highest = (list: readonly T[]) => {
    const settled = list.filter((b) => b.y >= b.r + 30);
    return (settled.length ? settled : list).reduce<T | null>(
      (best, b) => (!best || b.y < best.y ? b : best),
      null,
    );
  };
  if (mode === 'free') return highest(live);
  if (mode === 'color' || mode === 'size')
    return highest(live.filter((b) => isRight(mode, b, target, next, size)));
  if (mode === 'count' || mode === 'dots') return live.find((b) => b.number === next) ?? null;
  if (mode === 'match') {
    // The dots first, then the numeral that says how many: counting, then naming the count.
    if (held) return live.find((b) => partners(held, b)) ?? null;
    return live.find((a) => a.pips && live.some((b) => partners(a, b))) ?? null;
  }
  if (held) return live.find((b) => b !== held && held.number! + b.number! === sum) ?? null;
  return live.find((a) => live.some((b) => b !== a && a.number! + b.number! === sum)) ?? null;
}

/**
 * Pop anywhere: the bubble a touch at `at` pops, the nearest middle of those showing, however far; null when none is showing
 * (the touch then does nothing). Nothing here is a miss.
 */
export function nearestShown<T extends Reachable>(
  shown: readonly T[],
  at: { x: number; y: number },
): T | null {
  return shown.reduce<T | null>(
    (best, b) =>
      !best || Math.hypot(b.x - at.x, b.y - at.y) < Math.hypot(best.x - at.x, best.y - at.y) ? b : best,
    null,
  );
}

/** Quantity support fades once the numerals or bonds to ten are being practised. */
export const showsDots = (level: number) => level === 7 || level === 8 || level === 10;

/** Radius-relative dots: familiar dice through six, then a full row of five and some more. */
export function numberDots(n: number): { x: number; y: number }[] {
  if (!Number.isInteger(n) || n < 1 || n > 10) return [];
  const dice = [
    [[0, 0.59]],
    [
      [-0.24, 0.44],
      [0.24, 0.74],
    ],
    [
      [-0.24, 0.44],
      [0, 0.59],
      [0.24, 0.74],
    ],
    [
      [-0.24, 0.44],
      [0.24, 0.44],
      [-0.24, 0.74],
      [0.24, 0.74],
    ],
    [
      [-0.24, 0.44],
      [0.24, 0.44],
      [0, 0.59],
      [-0.24, 0.74],
      [0.24, 0.74],
    ],
    [
      [-0.24, 0.44],
      [0.24, 0.44],
      [-0.24, 0.59],
      [0.24, 0.59],
      [-0.24, 0.74],
      [0.24, 0.74],
    ],
  ];
  return n <= 6
    ? dice[n - 1].map(([x, y]) => ({ x, y }))
    : Array.from({ length: n }, (_, i) => ({ x: ((i % 5) - 2) * 0.2, y: i < 5 ? 0.49 : 0.72 }));
}
export const DOT_RADIUS = 0.06;

/**
 * Dots mode: the pips on a bubble with no numeral, radius-relative and centered, in the dice layout for 1 to 6 (the same
 * shape every time, which is what makes a small quantity nameable at a glance). Empty for any other number.
 */
export function dicePips(n: number): { x: number; y: number }[] {
  const [a, m] = [0.3, 0];
  const faces: [number, number][][] = [
    [[m, m]],
    [
      [-a, -a],
      [a, a],
    ],
    [
      [-a, -a],
      [m, m],
      [a, a],
    ],
    [
      [-a, -a],
      [a, -a],
      [-a, a],
      [a, a],
    ],
    [
      [-a, -a],
      [a, -a],
      [m, m],
      [-a, a],
      [a, a],
    ],
    [
      [-a, -a],
      [a, -a],
      [-a, m],
      [a, m],
      [-a, a],
      [a, a],
    ],
  ];
  return Number.isInteger(n) && n >= 1 && n <= 6 ? faces[n - 1].map(([x, y]) => ({ x, y })) : [];
}
export const PIP_RADIUS = 0.12;
export const DOT_NUMERAL_Y = -0.3;

export type SignKind = 'bond' | 'start' | 'back' | 'by';

/** What the sign at the top says the round is about, so the number she needs is always in sight. */
export interface TargetSign {
  kind: SignKind;
  /** The total to make, the number to start or count back from, or the step to count by. */
  n: number;
  /** Dots beside the number, where the bubbles carry dots too. */
  dots: boolean;
}

/** The sign for a round: bonds show the total, a run that does not begin at 1 shows its start, a skip count its step. Null when 1, 2, 3 is the whole story. */
export function signFor(plan: BubblePlan, level: number, run: readonly number[]): TargetSign | null {
  if (plan.mode === 'bonds') return { kind: 'bond', n: plan.sum!, dots: showsDots(level) };
  if (plan.mode !== 'count' || !run.length) return null;
  const step = run.length > 1 ? run[1] - run[0] : 1;
  if (step < 0) return { kind: 'back', n: run[0], dots: false };
  if (step > 1) return { kind: 'by', n: step, dots: false };
  return run[0] > 1 ? { kind: 'start', n: run[0], dots: false } : null;
}

/** What a mode's little picture on the how-to card shows: fixed example numbers, never a round's draw. */
export type ModePicture =
  | { kind: 'palm' }
  | { kind: 'plain'; bubbles: number }
  | { kind: 'colors'; colors: number }
  /** Numbered bubbles in a row, then `… upTo` when the run goes on past them. */
  | { kind: 'count'; numbers: number[]; upTo?: number; dots?: boolean }
  /** The sign the round shows above its bubbles: a number to start at, or to count back from. */
  | { kind: 'sign'; sign: number; numbers: number[]; arrow: 1 | -1 }
  | { kind: 'bond'; numbers: [number, number]; sum: number }
  /** A big bubble and a little one, the asked-for size ringed. */
  | { kind: 'sizes' }
  /** Bubbles with dice pips and no numeral, the asked-for count ringed (the first). */
  | { kind: 'pips'; counts: number[] }
  /** A dot bubble and the numeral that matches it, joined, beside one that does not match. */
  | { kind: 'match'; n: number; other: number };

export interface BubbleModeCard {
  name: string;
  line: LineId;
  picture: ModePicture;
}

/** A short name, a spoken line and a picture for every level, for the grown-up's intro card. Names are distinct in every band. */
export const MODE_CARDS: Record<number, BubbleModeCard> = {
  15: { name: 'Pop anywhere', line: 'bubble.mode.15', picture: { kind: 'palm' } },
  1: { name: 'Pop the bubbles', line: 'bubble.mode.1', picture: { kind: 'plain', bubbles: 3 } },
  2: { name: 'More bubbles', line: 'bubble.mode.2', picture: { kind: 'plain', bubbles: 4 } },
  3: { name: 'Lots of bubbles', line: 'bubble.mode.3', picture: { kind: 'plain', bubbles: 5 } },
  4: { name: 'Two colors', line: 'bubble.mode.4', picture: { kind: 'colors', colors: 2 } },
  5: { name: 'Three colors', line: 'bubble.mode.5', picture: { kind: 'colors', colors: 3 } },
  6: { name: 'Five colors', line: 'bubble.mode.6', picture: { kind: 'colors', colors: 5 } },
  7: {
    name: 'Count to 5',
    line: 'bubble.mode.7',
    picture: { kind: 'count', numbers: [1, 2, 3], dots: true },
  },
  8: {
    name: 'Count to 7',
    line: 'bubble.mode.8',
    picture: { kind: 'count', numbers: [1, 2, 3], upTo: 7, dots: true },
  },
  9: { name: 'Count to 10', line: 'bubble.mode.9', picture: { kind: 'count', numbers: [1, 2, 3], upTo: 10 } },
  10: { name: 'Make 5', line: 'bubble.mode.10', picture: { kind: 'bond', numbers: [2, 3], sum: 5 } },
  11: { name: 'Make 10', line: 'bubble.mode.11', picture: { kind: 'bond', numbers: [4, 6], sum: 10 } },
  12: {
    name: 'Start at a number',
    line: 'bubble.mode.12',
    picture: { kind: 'sign', sign: 4, numbers: [4, 5, 6], arrow: 1 },
  },
  13: {
    name: 'Count back',
    line: 'bubble.mode.13',
    picture: { kind: 'sign', sign: 5, numbers: [5, 4, 3], arrow: -1 },
  },
  14: { name: 'Tens and fives', line: 'bubble.mode.14', picture: { kind: 'count', numbers: [10, 20, 30] } },
  16: { name: 'Big and little', line: 'bubble.mode.16', picture: { kind: 'sizes' } },
  17: { name: 'Which has the dots?', line: 'bubble.mode.17', picture: { kind: 'pips', counts: [4, 2, 3] } },
  18: { name: 'Dots and numbers', line: 'bubble.mode.18', picture: { kind: 'match', n: 3, other: 2 } },
};

/** The card for a level, clamped like `planFor`. */
export const modeCardFor = (level: number): BubbleModeCard =>
  MODE_CARDS[Math.min(PLANS.length, Math.max(1, level))];
