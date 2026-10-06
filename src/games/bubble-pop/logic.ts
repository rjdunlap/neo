import { RAINBOW, type ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

export type BubbleMode = 'free' | 'color' | 'count';

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
];

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
