import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Scoop Shop, after Papa's Freezeria and Neopets' Ice Cream Machine: customers order a cone,
 * you tap flavor tubs to stack scoops, and a matching cone is served. A scoop that doesn't
 * belong bounces gently back into its tub, so a cone can never be wrong for long.
 */
export type ScoopMode = 'free' | 'one' | 'pair' | 'count' | 'stack' | 'memory';

export interface ScoopPlan {
  mode: ScoopMode;
  customers: number;
  /** Flavor tubs on the counter. */
  flavors: number;
  /** Scoops per order (count: the range). */
  min: number;
  max: number;
  name: string;
}

export const PLANS: ScoopPlan[] = [
  { mode: 'free', customers: 2, flavors: 4, min: 4, max: 4, name: 'Tap the tubs to pile scoops on a cone; any flavors' },
  { mode: 'one', customers: 3, flavors: 4, min: 1, max: 1, name: 'One scoop in the color the customer asks for' },
  { mode: 'pair', customers: 3, flavors: 4, min: 2, max: 2, name: 'Two scoops matching the picture, in any order' },
  { mode: 'count', customers: 3, flavors: 5, min: 2, max: 5, name: 'Count the scoops: "three green scoops, please"' },
  { mode: 'stack', customers: 3, flavors: 5, min: 3, max: 3, name: 'Three flavors stacked bottom to top, like the picture' },
  { mode: 'memory', customers: 3, flavors: 6, min: 3, max: 3, name: 'Remember the order after the picture hides' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Ice cream colors that read as flavors: strawberry, mint, blueberry, lemon, chocolate, grape. */
export const FLAVORS: ColorName[] = ['pink', 'green', 'blue', 'yellow', 'brown', 'purple'];

export interface Order {
  /** Scoops bottom to top. Empty for free play. */
  scoops: ColorName[];
  /** Whether the stacking order matters. */
  ordered: boolean;
}

export function makeOrders(plan: ScoopPlan, rng: Rng): { flavors: ColorName[]; orders: Order[] } {
  const flavors = rng.shuffle([...FLAVORS]).slice(0, plan.flavors);
  const orders: Order[] = [];
  let lastCount = 0;
  for (let i = 0; i < plan.customers; i++) {
    let scoops: ColorName[] = [];
    switch (plan.mode) {
      case 'free':
        break;
      case 'one':
        scoops = [flavors[i % flavors.length]];
        break;
      case 'pair':
        scoops = [rng.pick(flavors), rng.pick(flavors)];
        break;
      case 'count': {
        // A different number each customer, so counting matters.
        let n = rng.int(plan.min, plan.max);
        while (n === lastCount) n = rng.int(plan.min, plan.max);
        lastCount = n;
        scoops = Array(n).fill(rng.pick(flavors));
        break;
      }
      case 'stack':
      case 'memory':
        scoops = rng.shuffle([...flavors]).slice(0, plan.max);
        break;
    }
    orders.push({ scoops, ordered: plan.mode === 'stack' || plan.mode === 'memory' });
  }
  return { flavors, orders };
}

export type AddResult = 'add' | 'wrong' | 'too-many';

/** Should a scoop of `color` stay on a cone that already holds `cone`? */
export function tryScoop(plan: ScoopPlan, order: Order, cone: ColorName[], color: ColorName): AddResult {
  if (plan.mode === 'free') return cone.length < plan.max ? 'add' : 'too-many';
  if (cone.length >= order.scoops.length) return 'too-many';
  if (order.ordered) return order.scoops[cone.length] === color ? 'add' : 'wrong';
  const wanted = order.scoops.filter((c) => c === color).length;
  const have = cone.filter((c) => c === color).length;
  if (wanted === 0) return 'wrong';
  return have < wanted ? 'add' : 'too-many';
}

export function complete(plan: ScoopPlan, order: Order, cone: ColorName[]): boolean {
  if (plan.mode === 'free') return cone.length >= plan.max;
  if (cone.length !== order.scoops.length) return false;
  if (order.ordered) return cone.every((c, i) => c === order.scoops[i]);
  return [...cone].sort().join() === [...order.scoops].sort().join();
}

/** The scoop the order still needs next (for hints): in order, or any one still missing. */
export function nextNeeded(order: Order, cone: ColorName[]): ColorName | undefined {
  if (order.ordered) return order.scoops[cone.length];
  const left = [...order.scoops];
  for (const c of cone) left.splice(left.indexOf(c), 1);
  return left[0];
}

/**
 * The tub a capable child scoops from next, or null when the cone is done. An order says what it still needs
 * (`nextNeeded`), in the right order on the stacking levels and from memory on the last one; free play has no order, so
 * it takes a different flavor each time, round the counter.
 */
export function scoopToTake(plan: ScoopPlan, order: Order, cone: ColorName[], flavors: ColorName[]): ColorName | null {
  if (complete(plan, order, cone)) return null;
  if (plan.mode === 'free') return flavors[cone.length % flavors.length];
  return nextNeeded(order, cone) ?? null;
}
