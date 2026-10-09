import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Owl Walk Home, after Peaceable Kingdom's Hoot Owl Hoot! and HABA's First Orchard: flip a color card and hop an
 * owl to the next stone of that color; a stone with an owl on it is skipped, and with no stone of that color
 * left ahead the owl flies straight home to the nest. Everyone wins together when every owl is home. There is
 * no clock: the sunrise only arrives when the owls do. The pet takes turns with the child from level 2, and
 * the top level asks which owl a card would carry the farthest, so everyone gets home sooner.
 */
export type OwlMode = 'one' | 'turns' | 'choose' | 'farthest';

export interface OwlPlan {
  mode: OwlMode;
  owls: number;
  colors: number;
  stones: number;
  name: string;
}

export const PLANS: OwlPlan[] = [
  { mode: 'one', owls: 1, colors: 3, stones: 10, name: 'Flip a color card, then hop the owl to the next stone of that color' },
  { mode: 'turns', owls: 2, colors: 4, stones: 12, name: 'Two owls: take turns with the pet to bring them home together' },
  { mode: 'choose', owls: 3, colors: 4, stones: 14, name: 'Three owls, taking turns: choose which owl to hop' },
  { mode: 'farthest', owls: 3, colors: 4, stones: 16, name: 'Which owl hops the farthest with this card? Plan to get everyone home sooner' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const STONE_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green'];

/** Where an owl is: -1 in the woods before the first stone, 0…n-1 on a stone, n home in the nest. */
export type Spot = number;

/** Stones in rounds of every color, shuffled, with no color twice in a row. */
export function makePath(plan: OwlPlan, rng: Rng): ColorName[] {
  const colors = STONE_COLORS.slice(0, plan.colors);
  const path: ColorName[] = [];
  while (path.length < plan.stones) {
    const round = rng.shuffle([...colors]);
    if (round[0] === path[path.length - 1]) round.push(round.shift()!);
    path.push(...round);
  }
  return path.slice(0, plan.stones);
}

/** Where owl `i` lands with a `color` card: the next free stone of that color ahead of it, or home. */
export function hop(path: readonly ColorName[], spots: readonly Spot[], i: number, color: ColorName): Spot {
  const home = path.length;
  for (let s = spots[i] + 1; s < home; s++) {
    if (path[s] === color && !spots.some((o, j) => j !== i && o === s)) return s;
  }
  return home;
}

/** How many stones forward each owl would go with this card (0 for owls already home). */
export function hops(path: readonly ColorName[], spots: readonly Spot[], color: ColorName): number[] {
  return spots.map((s, i) => (s >= path.length ? 0 : hop(path, spots, i, color) - s));
}

/** The owls a card carries the farthest: any of them is a good choice. */
export function farthest(path: readonly ColorName[], spots: readonly Spot[], color: ColorName): number[] {
  const h = hops(path, spots, color);
  const best = Math.max(...h);
  return h.map((n, i) => (n === best && n > 0 ? i : -1)).filter((i) => i >= 0);
}

export const allHome = (path: readonly ColorName[], spots: readonly Spot[]) => spots.every((s) => s >= path.length);

/** A card from the pile. The deck is open-ended; it only ever offers colors that are on the path. */
export const drawCard = (plan: OwlPlan, rng: Rng): ColorName => rng.pick(STONE_COLORS.slice(0, plan.colors));

/**
 * The owl a capable child hops with this card: one that goes the farthest (the first of them), which is also what the pet
 * does on its turn. Null when every owl is home.
 */
export const owlToHop = (path: readonly ColorName[], spots: readonly Spot[], color: ColorName): number | null => farthest(path, spots, color)[0] ?? null;
