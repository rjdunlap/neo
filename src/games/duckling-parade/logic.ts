import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Duckling Parade, after Neopets' Meerca Chase: walk Mama Duck around the meadow and her
 * ducklings fall in behind her. Nothing is ever lost; the ladder changes which ducklings
 * may join and how many belong in the pond.
 */
export type ParadeMode = 'tap' | 'walk' | 'count' | 'color' | 'colorCount' | 'pattern';

export interface ParadePlan {
  mode: ParadeMode;
  /** Ducklings out on the meadow. */
  ducklings: number;
  /** How many duckling colors are mixed in. */
  colors: number;
  /** count/colorCount: the range of how many to bring home. */
  min?: number;
  max?: number;
  /** pattern: the repeating unit length (AB or ABC). */
  unit?: number;
  name: string;
}

export const PLANS: ParadePlan[] = [
  { mode: 'tap', ducklings: 3, colors: 1, name: 'Tap to walk Mama Duck; ducklings join her line' },
  { mode: 'walk', ducklings: 4, colors: 1, name: 'Lead Mama Duck with a finger and bring every duckling to the pond' },
  { mode: 'count', ducklings: 6, colors: 1, min: 2, max: 3, name: 'Bring 2 or 3 ducklings home' },
  { mode: 'color', ducklings: 6, colors: 2, name: 'Find the ducklings of one color' },
  { mode: 'count', ducklings: 7, colors: 1, min: 3, max: 5, name: 'Bring 3 to 5 ducklings home' },
  { mode: 'colorCount', ducklings: 8, colors: 3, min: 2, max: 3, name: 'Bring 2 or 3 ducklings of one color home' },
  { mode: 'pattern', ducklings: 6, colors: 2, unit: 2, name: 'Make a color pattern: yellow, blue, yellow, blue' },
  { mode: 'pattern', ducklings: 6, colors: 3, unit: 3, name: 'Make a three-color pattern: red, blue, yellow, red, blue, yellow' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Duckling colors that read clearly against grass and water (not orange: it's the bill). */
export const DUCK_COLORS: ColorName[] = ['yellow', 'blue', 'pink', 'purple', 'red'];

export interface Round {
  /** Every duckling's color, in meadow order. */
  ducklings: ColorName[];
  /** color/colorCount: the color asked for. */
  want?: ColorName;
  /** count/colorCount: how many belong in the pond. */
  target?: number;
  /** pattern: the order the line should make. */
  pattern?: ColorName[];
}

export function makeRound(plan: ParadePlan, rng: Rng): Round {
  const palette = plan.colors === 1 ? ['yellow' as ColorName] : rng.shuffle([...DUCK_COLORS]).slice(0, plan.colors);
  const target = plan.min !== undefined ? rng.int(plan.min, plan.max ?? plan.min) : undefined;
  if (plan.mode === 'pattern') {
    const unit = palette.slice(0, plan.unit ?? 2);
    const pattern = Array.from({ length: plan.ducklings }, (_, i) => unit[i % unit.length]);
    return { ducklings: rng.shuffle([...pattern]), pattern };
  }
  if (plan.mode === 'color' || plan.mode === 'colorCount') {
    const want = palette[0];
    // Enough of the wanted color (always at least one spare for colorCount), the rest mixed.
    const wanted = plan.mode === 'color' ? Math.ceil(plan.ducklings / 2) : target! + 1;
    const others = palette.slice(1);
    const ducklings = [...Array(wanted).fill(want), ...Array.from({ length: plan.ducklings - wanted }, (_, i) => others[i % others.length])];
    return { ducklings: rng.shuffle(ducklings), want, target };
  }
  return { ducklings: Array(plan.ducklings).fill('yellow'), target };
}

export type JoinResult = 'join' | 'wrong-color' | 'wrong-next';

/** May a duckling of `color` join a line that already holds `line`? */
export function canJoin(plan: ParadePlan, round: Round, line: ColorName[], color: ColorName): JoinResult {
  if ((plan.mode === 'color' || plan.mode === 'colorCount') && color !== round.want) return 'wrong-color';
  if (plan.mode === 'pattern' && round.pattern![line.length] !== color) return 'wrong-next';
  return 'join';
}

/** The color the pattern needs next, given how many have already joined. */
export const nextInPattern = (round: Round, joined: number) => round.pattern?.[joined];

/**
 * Arriving at the pond with `bringing` ducklings when `home` are already swimming.
 * Returns how many swim in and how many hop back out because there are too many.
 */
export function arrive(round: Round, home: number, bringing: number): { swimIn: number; extra: number } {
  if (round.target === undefined) return { swimIn: bringing, extra: 0 };
  const room = Math.max(0, round.target - home);
  return { swimIn: Math.min(room, bringing), extra: Math.max(0, bringing - room) };
}

/** How many ducklings must end up in the pond to finish. */
export function needed(plan: ParadePlan, round: Round): number {
  if (round.target !== undefined) return round.target;
  if (plan.mode === 'color') return round.ducklings.filter((c) => c === round.want).length;
  return round.ducklings.length;
}

/** Whether the pond takes ducklings now. A pattern only goes home once it's complete. */
export function readyForPond(plan: ParadePlan, round: Round, line: number): boolean {
  if (line === 0) return false;
  if (plan.mode === 'pattern') return line === round.pattern!.length;
  return true;
}

export interface DemoDuckling {
  color: ColorName;
  /** Still waiting on the meadow (not in the line or the pond). */
  loose: boolean;
  x: number;
  y: number;
}

/** Where a capable player leads Mama next: a waiting duckling (by its place in the list) or the pond. */
export type ParadeStop = { to: 'duckling'; index: number } | { to: 'pond' };

/**
 * Where the how-to card's ghost finger leads Mama next: the nearest waiting duckling that may join the line, and once
 * the line is what the round asks for, the pond. Null when the line is complete but the pond would not take it yet, or when
 * no waiting duckling may join (they are still hopping back out).
 */
export function nextStop(
  plan: ParadePlan,
  round: Round,
  line: readonly ColorName[],
  homeCount: number,
  ducklings: readonly DemoDuckling[],
  mama: { x: number; y: number },
): ParadeStop | null {
  const done = plan.mode === 'pattern' ? line.length === round.pattern!.length : homeCount + line.length >= needed(plan, round);
  if (done) return readyForPond(plan, round, line.length) ? { to: 'pond' } : null;
  let best: ParadeStop | null = null;
  let bestD = Infinity;
  ducklings.forEach((d, index) => {
    if (!d.loose || canJoin(plan, round, [...line], d.color) !== 'join') return;
    const dist = Math.hypot(d.x - mama.x, d.y - mama.y);
    if (dist < bestD) [best, bestD] = [{ to: 'duckling', index }, dist];
  });
  return best;
}
