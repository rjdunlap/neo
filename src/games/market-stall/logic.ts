import type { Rng } from '../../engine/random';

/**
 * Market Stall: buy fruit with shell coins worth 1, 2 and 5 by tapping them onto the counter,
 * then ring the bell. Later: add two prices, pay the same price a second, different way, and
 * finally keep the stall: a customer pays with a 10 and the child gives the change.
 */
export type ShopMode = 'count' | 'twos' | 'mix' | 'pair' | 'ways' | 'change';

export interface ShopPlan {
  mode: ShopMode;
  coins: number[];
  /** Price range for one item. */
  price: [number, number];
  orders: number;
  name: string;
}

export const PLANS: ShopPlan[] = [
  { mode: 'count', coins: [1], price: [1, 4], orders: 4, name: 'Count out 1 to 4 shell coins for the price' },
  { mode: 'twos', coins: [1, 2], price: [2, 6], orders: 4, name: 'Pay 2 to 6 with ones and twos' },
  { mode: 'mix', coins: [1, 2, 5], price: [3, 9], orders: 4, name: 'Pay 3 to 9 with ones, twos and fives' },
  { mode: 'pair', coins: [1, 2, 5], price: [1, 5], orders: 3, name: 'Two things to buy: add the prices, then pay' },
  { mode: 'ways', coins: [1, 2, 5], price: [4, 10], orders: 3, name: 'Pay the same price two different ways' },
  { mode: 'change', coins: [1, 2, 5], price: [2, 9], orders: 3, name: 'Keep the stall: a customer pays 10, give the change' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** What a customer hands over on change levels. */
export const PAID = 10;

export interface Order {
  /** One price per item. */
  prices: number[];
}

/** The amount to put on the counter: the price, both prices, or the change from 10. */
export function target(plan: ShopPlan, o: Order): number {
  const total = o.prices.reduce((a, b) => a + b, 0);
  return plan.mode === 'change' ? PAID - total : total;
}

export function makeOrders(plan: ShopPlan, rng: Rng): Order[] {
  const out: Order[] = [];
  while (out.length < plan.orders) {
    const one = () => rng.int(plan.price[0], plan.price[1]);
    const o: Order = { prices: plan.mode === 'pair' ? [one(), one()] : [one()] };
    const t = target(plan, o);
    if (t < 1 || t > 10) continue;
    // Pairs add up to something worth adding (at least 3), and amounts never repeat back to back.
    if (plan.mode === 'pair' && t < 3) continue;
    if (out.length && target(plan, out.at(-1)!) === t) continue;
    out.push(o);
  }
  return out;
}

export const sum = (coins: number[]) => coins.reduce((a, b) => a + b, 0);

/** The fewest coins that make an amount (greedy works for 1, 2 and 5): the hint's suggestion. */
export function fewest(amount: number, coins: number[]): number[] {
  const out: number[] = [];
  let left = amount;
  for (const c of [...coins].sort((a, b) => b - a)) while (left >= c) out.push(c), (left -= c);
  return out;
}

/** Two payments count as different ways if they use different coins, not just a different order. */
export const sameWay = (a: number[], b: number[]) => [...a].sort().join() === [...b].sort().join();

/** A second way to pay, for the hint on 'ways' levels: break one coin of the first way into smaller ones. */
export function anotherWay(amount: number, coins: number[], first: number[]): number[] {
  const options = [fewest(amount, coins), fewest(amount, coins.filter((c) => c < 5)), Array(amount).fill(1)];
  return options.find((o) => !sameWay(o, first)) ?? options[2];
}

/**
 * What a capable child puts on the counter for an order: the fewest coins that make the amount, and on a 'ways' level, once
 * the first way is paid, a different set of coins for the same price.
 */
export function paymentFor(plan: ShopPlan, order: Order, firstWay: number[] | null): number[] {
  const want = target(plan, order);
  return firstWay ? anotherWay(want, plan.coins, firstWay) : fewest(want, plan.coins);
}

/** The next touch: put down the next coin of the payment, and ring the bell when they are all on the counter. */
export function payTouch(payment: number[], onMat: number[]): { coin: number } | 'bell' {
  return onMat.length < payment.length ? { coin: payment[onMat.length] } : 'bell';
}
