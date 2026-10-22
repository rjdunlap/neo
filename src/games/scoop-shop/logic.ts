import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Scoop Shop, after Papa's Freezeria and Neopets' Ice Cream Machine: customers order a cone,
 * you tap flavor tubs to stack scoops, and a matching cone is served. A scoop that doesn't
 * belong bounces gently back into its tub, so a cone can never be wrong for long.
 */
export type ScoopMode = 'free' | 'one' | 'pair' | 'count' | 'stack' | 'memory' | 'customer' | 'mixed';

export interface ScoopPlan {
  mode: ScoopMode;
  customers: number;
  /** Flavor tubs on the counter. */
  flavors: number;
  /** Scoops per order (count: the range). */
  min: number;
  max: number;
  name: string;
  /** Prefilled count-on cones start with 1–3 scoops. */
  start?: boolean;
}

export const PLANS: ScoopPlan[] = [
  { mode: 'free', customers: 2, flavors: 4, min: 4, max: 4, name: 'Tap the tubs to pile scoops on a cone; any flavors' },
  { mode: 'one', customers: 3, flavors: 4, min: 1, max: 1, name: 'One scoop in the color the customer asks for' },
  { mode: 'pair', customers: 3, flavors: 4, min: 2, max: 2, name: 'Two scoops matching the picture, in any order' },
  { mode: 'count', customers: 3, flavors: 5, min: 2, max: 5, name: 'Count the scoops: "three green scoops, please"' },
  { mode: 'stack', customers: 3, flavors: 5, min: 3, max: 3, name: 'Three flavors stacked bottom to top, like the picture' },
  { mode: 'memory', customers: 3, flavors: 6, min: 3, max: 3, name: 'Remember the order after the picture hides' },
];

const ANY_SCOOP: ScoopPlan = { mode: 'free', customers: 3, flavors: 4, min: 1, max: 1, name: 'Any scoop: one tap, one scoop, one munch' };
const MATCH_CUSTOMER: ScoopPlan = { mode: 'customer', customers: 3, flavors: 4, min: 1, max: 1, name: 'Who wanted pink? Match the prepared scoop to one of two customer pictures' };
const FILL_UP: ScoopPlan = { mode: 'count', start: true, customers: 3, flavors: 5, min: 3, max: 5, name: 'Fill it up: count on from the scoops already there to make three to five' };
const MIXED: ScoopPlan = { mode: 'mixed', customers: 3, flavors: 5, min: 4, max: 5, name: 'Three pink and two blue: match two color counts, in any order' };
export const planFor = (level: number) => level === 12 ? FILL_UP : level === 13 ? MIXED : level === 10 ? ANY_SCOOP : level === 11 ? MATCH_CUSTOMER : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface CustomerChoice {
  pictures: [ColorName, ColorName];
  scoop: ColorName;
  match: number;
}

/** Keep the unserved customer's order; replace only the served customer. Matching sides alternate. */
export function makeCustomerChoices(flavors: ColorName[], rng: Rng): CustomerChoice[] {
  const pictures = rng.shuffle([...flavors]).slice(0, 2) as [ColorName, ColorName];
  const first = rng.int(0, 1);
  return Array.from({ length: 3 }, (_, i) => {
    const match = (first + i) % 2;
    const choice = { pictures: [...pictures] as [ColorName, ColorName], scoop: pictures[match], match };
    pictures[match] = rng.pick(flavors.filter(c => c !== pictures[1 - match] && c !== pictures[match]));
    return choice;
  });
}

export const customerToServe = (choice: CustomerChoice, side: number) => choice.pictures[side] === choice.scoop;

/** Ice cream colors that read as flavors: strawberry, mint, blueberry, lemon, chocolate, grape. */
export const FLAVORS: ColorName[] = ['pink', 'green', 'blue', 'yellow', 'brown', 'purple'];

export interface Order {
  /** Scoops bottom to top. Empty for free play. */
  scoops: ColorName[];
  /** Whether the stacking order matters. */
  ordered: boolean;
  /** Scoops already on the cone, all in its requested colour. */
  start?: number;
}

export function makeOrders(plan: ScoopPlan, rng: Rng): { flavors: ColorName[]; orders: Order[] } {
  const flavors = rng.shuffle([...FLAVORS]).slice(0, plan.flavors);
  const orders: Order[] = [];
  let lastCount = 0;
  let lastNeeded = 0;
  let lastColor: ColorName | undefined;
  for (let i = 0; i < plan.customers; i++) {
    let scoops: ColorName[] = [];
    let start: number | undefined;
    switch (plan.mode) {
      case 'free':
        break;
      case 'customer':
        scoops = [rng.pick(flavors)];
        break;
      case 'one': {
        // Never the tub at the customer's own place on the counter, and never the last customer's colour, so tapping
        // along the counter is not an answer and the colour word does the work.
        const color = rng.pick(flavors.filter((c, k) => k !== i % flavors.length && c !== lastColor));
        lastColor = color;
        scoops = [color];
        break;
      }
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
      case 'mixed': {
        const [a, b] = rng.shuffle([...flavors]);
        // First two orders always have unequal counts; the third can also show two and two.
        const n = i < 2 ? 5 : rng.int(4, 5);
        const first = rng.int(1, n - 1);
        scoops = [...Array<ColorName>(first).fill(a), ...Array<ColorName>(n - first).fill(b)];
        break;
      }
      case 'stack':
      case 'memory':
        scoops = rng.shuffle([...flavors]).slice(0, plan.max);
        break;
    }
    if (plan.start) {
      const starts = Array.from({ length: Math.min(3, scoops.length - 1) }, (_, k) => k + 1);
      start = rng.pick(starts.filter(k => scoops.length - k !== lastNeeded));
      lastNeeded = scoops.length - start;
    }
    orders.push({ ...(start === undefined ? {} : { start }), scoops, ordered: plan.mode === 'stack' || plan.mode === 'memory' });
  }
  return { flavors, orders };
}

/** What each customer's ice cream comes in: a waffle cone, a paper cup or a waffle bowl. None changes a rule. */
export type ConeKind = 'cone' | 'cup' | 'bowl';
export const CONE_KINDS: ConeKind[] = ['cone', 'cup', 'bowl'];

/** The view through the shop window, one per round. */
export type WindowScene = 'beach' | 'street' | 'lanterns';
export const WINDOW_SCENES: WindowScene[] = ['beach', 'street', 'lanterns'];

/**
 * A round's dressing, drawn after the orders so it never changes them: a window scene, and a cone kind for each
 * customer, dealt from shuffled sets of all three so no two customers in a row get the same kind.
 */
export function dressShop(customers: number, rng: Rng): { scene: WindowScene; cones: ConeKind[] } {
  const scene = rng.pick(WINDOW_SCENES);
  const cones: ConeKind[] = [];
  while (cones.length < customers) {
    let deal = rng.shuffle([...CONE_KINDS]);
    if (deal[0] === cones[cones.length - 1]) deal = [...deal.slice(1), deal[0]];
    cones.push(...deal);
  }
  return { scene, cones: cones.slice(0, customers) };
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

/** Count rows shared by the picture and speech; order in a row never constrains scooping. */
export function scoopCounts(order: Order): { color: ColorName; count: number }[] {
  return [...new Set(order.scoops)].map(color => ({ color, count: order.scoops.filter(c => c === color).length }));
}

/** The count-on picture marks only the scoops still missing as outlined slots. */
export function countSlots(order: Order, have: number): boolean[] {
  return order.scoops.map((_, i) => i < have);
}
