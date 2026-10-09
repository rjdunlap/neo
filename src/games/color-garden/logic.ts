import { RAINBOW, type ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

export interface GardenPlan {
  colors: number;
  items: number;
  /** Fruit whose kind gives the color away (an apple is red); otherwise balloons and flowers. */
  fruit: boolean;
}

export const PLANS: GardenPlan[] = [
  { colors: 1, items: 4, fruit: true },
  { colors: 2, items: 6, fruit: true },
  { colors: 3, items: 6, fruit: true },
  { colors: 4, items: 8, fruit: true },
  { colors: 5, items: 10, fruit: true },
  { colors: 6, items: 12, fruit: false },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Basket width: narrower when five or six share the ground. */
export const basketWidth = (plan: GardenPlan) => (plan.colors > 4 ? 130 : 160);

/** How far past a basket's rim (sideways) and above its base a drop still lands in it. */
export const REACH_X = 30;
export const REACH_UP = 230;

/** The baskets' colors, then one thing per color and the rest at random, shuffled. */
export function deal(rng: Rng, plan: GardenPlan): { colors: ColorName[]; items: ColorName[] } {
  const colors = rng.shuffle([...RAINBOW]).slice(0, plan.colors);
  const items = [...colors];
  while (items.length < plan.items) items.push(rng.pick(colors));
  rng.shuffle(items);
  return { colors, items };
}

/**
 * The basket a drop lands in: the nearest one sideways, if the drop is over it or just above it.
 * Neighbouring baskets' reach overlaps when six share the ground, so the nearest wins.
 */
export function basketAt<B extends { x: number; y: number; w: number }>(baskets: readonly B[], x: number, y: number): B | undefined {
  let best: B | undefined;
  for (const b of baskets) {
    const dx = Math.abs(b.x - x);
    if (dx >= b.w / 2 + REACH_X || y <= b.y - REACH_UP) continue;
    if (!best || dx < Math.abs(best.x - x)) best = b;
  }
  return best;
}

/** The ghost finger lets an item go this far above a basket's base, over the middle of its mouth (inside `REACH_UP`, and clear of its neighbours). */
export const DROP_ABOVE = 60;

/**
 * What a capable child does next: take the first piece of fruit still on the tree to the basket of its own color.
 * The ghost finger follows this, so a test can check that it sorts everything and never picks the wrong basket.
 */
export function nextToSort<I extends { color: ColorName }, B extends { color: ColorName }>(items: readonly I[], baskets: readonly B[]): { item: I; basket: B } | undefined {
  for (const item of items) {
    const basket = baskets.find((b) => b.color === item.color);
    if (basket) return { item, basket };
  }
  return undefined;
}
