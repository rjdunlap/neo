import { RAINBOW, type ColorName } from '../../art/palette';
import { FRUIT_FOR, type PropKind } from '../../art/props';
import type { Rng } from '../../engine/random';

export interface GardenPlan {
  colors: number;
  items: number;
  /** Fruit whose kind gives the color away (an apple is red); otherwise balloons and flowers. */
  fruit: boolean;
  /** Fruit, balloons and flowers all mix in one round, so the kind of thing never gives the color away. */
  mixed?: boolean;
  /** Both baskets are blue, one light and one dark: she sorts by shade, not by color. */
  shades?: boolean;
  /** Fruit and balloons in two colors: a sign says whether this round sorts by color or by what each thing is. */
  rule?: boolean;
}

export type Rule = 'color' | 'kind';
export const RULES: Rule[] = ['color', 'kind'];

export type Shade = 'light' | 'dark';
export const SHADES: Shade[] = ['light', 'dark'];

/** What an item or basket is sorted by: its color, or its shade of blue. */
export type SortKey = ColorName | `${Shade}-blue` | 'kind-fruit' | 'kind-balloon';

export const PLANS: GardenPlan[] = [
  { colors: 1, items: 4, fruit: true },
  { colors: 2, items: 6, fruit: true },
  { colors: 3, items: 6, fruit: true },
  { colors: 4, items: 8, fruit: true },
  { colors: 5, items: 10, fruit: true },
  { colors: 6, items: 12, fruit: false, mixed: true },
  { colors: 2, items: 8, fruit: false, shades: true },
  { colors: 2, items: 8, fruit: false, rule: true },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Basket width: narrower when five or six share the ground. */
export const basketWidth = (plan: GardenPlan) => (plan.colors > 4 ? 130 : 160);

/** How far past a basket's rim (sideways) and above its base a drop still lands in it. */
export const REACH_X = 30;
export const REACH_UP = 230;

/** What each item is: its own fruit, a balloon or a flower; a mixed round has all three kinds, so "red" is an apple, a balloon or a flower. */
function kindsFor(rng: Rng, plan: GardenPlan, items: SortKey[]): PropKind[] {
  if (plan.fruit) return items.map((c) => FRUIT_FOR[c as ColorName]!);
  if (!plan.mixed) return items.map((_, i) => (i % 2 ? 'balloon' : 'flower'));
  const slots: (0 | 1 | 2)[] = items.map((_, i) => (i < 3 ? (i as 0 | 1 | 2) : rng.pick([0, 1, 2] as const)));
  rng.shuffle(slots);
  return items.map((c, i) => [FRUIT_FOR[c as ColorName]!, 'balloon' as const, 'flower' as const][slots[i]]);
}

/** The baskets' colors, then one thing per color and the rest at random, shuffled. */
export function deal(rng: Rng, plan: GardenPlan): { colors: SortKey[]; items: SortKey[]; kinds: PropKind[]; looks?: ColorName[]; rule?: Rule } {
  if (plan.rule) return dealRule(rng, plan);
  if (plan.shades) {
    const keys: SortKey[] = rng.shuffle(SHADES.map((s): SortKey => `${s}-blue`));
    const items = [...keys];
    while (items.length < plan.items) items.push(rng.pick(keys));
    rng.shuffle(items);
    return { colors: keys, items, kinds: items.map((_, i) => (i % 2 ? 'balloon' : 'flower')) };
  }
  const colors = rng.shuffle([...RAINBOW]).slice(0, plan.colors);
  const items = [...colors];
  while (items.length < plan.items) items.push(rng.pick(colors));
  rng.shuffle(items);
  return { colors, items, kinds: kindsFor(rng, plan, items) };
}

/**
 * Two colors, each as a fruit and as a balloon (at least once), then the rest at random. The rule is color (a basket per color)
 * or kind (a fruit basket and a balloon basket); the same pile suits either, so only the sign tells her which.
 */
function dealRule(rng: Rng, plan: GardenPlan) {
  const hues = rng.shuffle([...RAINBOW]).slice(0, 2);
  const combos = hues.flatMap((c) => [true, false].map((fruit) => ({ c, fruit })));
  const pile = [...combos];
  while (pile.length < plan.items) pile.push(rng.pick(combos));
  rng.shuffle(pile);
  const rule = rng.pick(RULES);
  const baskets: SortKey[] = rng.shuffle(rule === 'color' ? [...hues] : (['kind-fruit', 'kind-balloon'] as SortKey[]));
  return {
    colors: baskets,
    items: pile.map((p): SortKey => (rule === 'color' ? p.c : p.fruit ? 'kind-fruit' : 'kind-balloon')),
    kinds: pile.map((p): PropKind => (p.fruit ? FRUIT_FOR[p.c]! : 'balloon')),
    looks: pile.map((p) => p.c),
    rule,
  };
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
export function nextToSort<I extends { key: SortKey }, B extends { key: SortKey }>(items: readonly I[], baskets: readonly B[]): { item: I; basket: B } | undefined {
  for (const item of items) {
    const basket = baskets.find((b) => b.key === item.key);
    if (basket) return { item, basket };
  }
  return undefined;
}
