import type { CritterName } from '../../art/critter';
import { RAINBOW, type ColorName } from '../../art/palette';
import type { AnimalSound } from '../../audio/sfx';
import type { Rng } from '../../engine/random';

export type BubbleMode = 'free' | 'color' | 'count' | 'bonds';

/**
 * Modes where a particular bubble is needed (the next number, a partner) are laid out whole and drift in place,
 * so the one she needs never floats off the top. Free and color bubbles rise and leave; color mode sends the
 * asked-for color again whenever none is showing (`spawnTarget`), so none of its rounds is stranded.
 */
export const staysPut = (mode: BubbleMode) => mode === 'count' || mode === 'bonds';

/**
 * The friends that can ride in a bubble, in this order. The sticker draws from this list with `rng.pick`, so growing
 * or reordering it would change the picture on every sticker she already owns: a test pins it. New pictures in
 * bubbles belong in their own pool.
 */
export const FRIENDS = ['duck', 'pig', 'cat', 'bunny', 'cow', 'bear', 'dog'] as const satisfies readonly CritterName[];
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
  // Below level 1, for lap: a swat or a flat palm anywhere pops the nearest bubble. Big, slow and few, so what pops is plain.
  { mode: 'free', goal: 8, speed: 42, most: 4, colors: 0, radius: [96, 118], anywhere: true },
];

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
export const choosePalette = (rng: Rng, colors: number): ColorName[] => rng.shuffle([...RAINBOW]).slice(0, colors);

/**
 * Color mode: should the next bubble be the color to pop? The first two always are (an errorless start),
 * and so is any bubble that arrives while none of that color is showing, so there is always one to pop.
 */
export const spawnTarget = (spawned: number, targetShowing: boolean, rng: Rng) => spawned < 2 || !targetShowing || rng.chance(0.55);

export interface BubbleFace {
  color: ColorName | null;
  number?: number;
}

/** Whether popping this bubble counts: anything in free play, the asked-for color, or the next number. */
export function isRight(mode: BubbleMode, b: BubbleFace, target: ColorName | null, next: number): boolean {
  if (mode === 'free') return true;
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
export function meant<T extends Reachable>(tapped: T, all: readonly T[], at: { x: number; y: number }, right: (b: T) => boolean): T {
  if (right(tapped)) return tapped;
  return all.find((b) => b !== tapped && right(b) && Math.hypot(b.x - at.x, b.y - at.y) <= b.r * TAP_REACH) ?? tapped;
}

export interface DemoBubble extends Reachable {
  rainbow?: boolean;
}

/** Whether a bubble's middle is comfortably on the screen (half its radius in), so a finger can reach it. A bubble rising in from below counts as soon as it shows. */
export const inReach = (b: Reachable, w: number, h: number) => b.x >= b.r / 2 && b.x <= w - b.r / 2 && b.y >= b.r / 2 && b.y <= h - b.r / 2;

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
): T | null {
  const live = shown.filter((b) => !b.rainbow);
  const highest = (list: readonly T[]) => {
    const settled = list.filter((b) => b.y >= b.r + 30);
    return (settled.length ? settled : list).reduce<T | null>((best, b) => (!best || b.y < best.y ? b : best), null);
  };
  if (mode === 'free') return highest(live);
  if (mode === 'color') return highest(live.filter((b) => isRight(mode, b, target, next)));
  if (mode === 'count') return live.find((b) => b.number === next) ?? null;
  if (held) return live.find((b) => b !== held && held.number! + b.number! === sum) ?? null;
  return live.find((a) => live.some((b) => b !== a && a.number! + b.number! === sum)) ?? null;
}

/**
 * Pop anywhere: the bubble a touch at `at` pops, the nearest middle of those showing, however far; null when none is showing
 * (the touch then does nothing). Nothing here is a miss.
 */
export function nearestShown<T extends Reachable>(shown: readonly T[], at: { x: number; y: number }): T | null {
  return shown.reduce<T | null>((best, b) => (!best || Math.hypot(b.x - at.x, b.y - at.y) < Math.hypot(best.x - at.x, best.y - at.y) ? b : best), null);
}

/** Quantity support fades once the numerals or bonds to ten are being practised. */
export const showsDots = (level: number) => level === 7 || level === 8 || level === 10;

/** Radius-relative dots: familiar dice through six, then a full row of five and some more. */
export function numberDots(n: number): { x: number; y: number }[] {
  if (!Number.isInteger(n) || n < 1 || n > 10) return [];
  const dice = [
    [[0, 0.59]],
    [[-0.24, 0.44], [0.24, 0.74]],
    [[-0.24, 0.44], [0, 0.59], [0.24, 0.74]],
    [[-0.24, 0.44], [0.24, 0.44], [-0.24, 0.74], [0.24, 0.74]],
    [[-0.24, 0.44], [0.24, 0.44], [0, 0.59], [-0.24, 0.74], [0.24, 0.74]],
    [[-0.24, 0.44], [0.24, 0.44], [-0.24, 0.59], [0.24, 0.59], [-0.24, 0.74], [0.24, 0.74]],
  ];
  return n <= 6 ? dice[n - 1].map(([x, y]) => ({ x, y }))
    : Array.from({ length: n }, (_, i) => ({ x: (i % 5 - 2) * 0.2, y: i < 5 ? 0.49 : 0.72 }));
}
export const DOT_RADIUS = 0.06;
export const DOT_NUMERAL_Y = -0.30;

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
