import type { PropKind } from '../../art/props';
import type { Rng } from '../../engine/random';
import { spread } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Market Stall: buy fruit with shell coins worth 1, 2 and 5 by tapping them onto the counter,
 * then ring the bell. Later: add two prices, pay the same price a second, different way, and
 * keep the stall (a customer pays with a 10 and the child gives the change), pay with the fewest coins, count a purse of
 * mixed coins and tap the number card that says how much is in it, then pay prices from 11 to 20 with a ten-shell coin,
 * and at the top give the change from a 20, counting up from the price.
 */
export type ShopMode = 'count' | 'twos' | 'mix' | 'pair' | 'ways' | 'change' | 'fewest' | 'purse';

export interface ShopPlan {
  mode: ShopMode;
  coins: number[];
  /** Price range for one item (on 'purse' levels, the range of the purse's total). */
  price: [number, number];
  orders: number;
  pairRules?: { minTotal: number; distinctPrices: boolean };
  /** On 'change' levels: what the customer hands over (10, or 20 at level 11). */
  paid?: number;
  name: string;
}

export const PLANS: ShopPlan[] = [
  { mode: 'count', coins: [1], price: [1, 4], orders: 4, name: 'Count out 1 to 4 shell coins for the price' },
  { mode: 'twos', coins: [1, 2], price: [2, 6], orders: 4, name: 'Pay 2 to 6 with ones and twos' },
  { mode: 'mix', coins: [1, 2, 5], price: [3, 9], orders: 4, name: 'Pay 3 to 9 with ones, twos and fives' },
  {
    mode: 'pair',
    coins: [1, 2, 5],
    price: [1, 5],
    pairRules: { minTotal: 3, distinctPrices: false },
    orders: 3,
    name: 'Two things to buy: add the prices, then pay',
  },
  {
    mode: 'ways',
    coins: [1, 2, 5],
    price: [4, 10],
    orders: 3,
    name: 'Pay the same price two different ways',
  },
  {
    mode: 'change',
    coins: [1, 2, 5],
    price: [2, 9],
    paid: 10,
    orders: 3,
    name: 'Keep the stall: a customer pays 10, give the change',
  },
  {
    mode: 'fewest',
    coins: [1, 2, 5],
    price: [4, 10],
    orders: 3,
    name: 'Pay 4 to 10 with as few shell coins as possible',
  },
  {
    mode: 'purse',
    coins: [1, 2, 5],
    price: [3, 12],
    orders: 3,
    name: 'How much is in the purse? Count what each shell is worth, then tap the number',
  },
  {
    // Level 9, the ten-shell shell (dive slice 5): any exact payment buys; the tag is a ten bar and the ones.
    mode: 'mix',
    coins: [1, 2, 5, 10],
    price: [11, 20],
    orders: 4,
    name: 'Pay 11 to 20 with a ten-shell coin and smaller ones',
  },
  {
    mode: 'pair',
    coins: [1, 2, 5, 10],
    price: [4, 10],
    pairRules: { minTotal: 11, distinctPrices: true },
    orders: 3,
    name: 'Two baskets to twenty: add two prices past ten, then pay',
  },
  {
    // Level 11, change from twenty (dive slice 7): count up from the price to 20 on a strip of two tens.
    mode: 'change',
    coins: [1, 2, 5],
    price: [11, 19],
    paid: 20,
    orders: 3,
    name: 'Change from twenty: a customer pays 20 for a price of 11 to 19, count up to give the change',
  },
];

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 4 },
  school: { min: 3, max: PLANS.length },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** What a customer hands over on change levels unless the plan says otherwise. */
export const PAID = 10;

/** What the customer hands over on this change level: 10 at level 6, 20 at level 11. */
export const paidFor = (plan: ShopPlan) => plan.paid ?? PAID;

/** The most any order asks for: a ten-shell coin and up to ten more (levels 9 and 10). */
export const TARGET_MAX = 20;

export interface Order {
  /** One price per item (none on 'purse' levels, where nothing is bought). */
  prices: number[];
  /** On 'purse' levels: the coins lying on the counter, largest first. */
  purse?: number[];
}

/** The amount to put on the counter (the price, both prices, or the change from what was paid), or what the purse holds. */
export function target(plan: ShopPlan, o: Order): number {
  if (o.purse) return sum(o.purse);
  const total = o.prices.reduce((a, b) => a + b, 0);
  return plan.mode === 'change' ? paidFor(plan) - total : total;
}

export function makeOrders(plan: ShopPlan, rng: Rng): Order[] {
  const out: Order[] = [];
  if (plan.mode === 'purse') {
    while (out.length < plan.orders) {
      const o = { prices: [], purse: makePurse(plan, rng) };
      if (!out.length || target(plan, out.at(-1)!) !== target(plan, o)) out.push(o);
    }
    return out;
  }
  while (out.length < plan.orders) {
    const one = () => rng.int(plan.price[0], plan.price[1]);
    const o: Order = { prices: plan.mode === 'pair' ? [one(), one()] : [one()] };
    const t = target(plan, o);
    if (t < 1 || t > TARGET_MAX) continue;
    if (plan.pairRules) {
      const { minTotal, distinctPrices } = plan.pairRules;
      if (t < minTotal || (distinctPrices && o.prices[0] === o.prices[1])) continue;
    }
    if (out.length && target(plan, out.at(-1)!) === t) continue;
    out.push(o);
  }
  return out;
}

export const sum = (coins: number[]) => coins.reduce((a, b) => a + b, 0);

/** The most coins a purse holds: one row of the mat. */
export const PURSE_MAX = 6;

/**
 * A handful of three to six coins worth the plan's total range, largest first. At least one coin is worth more than 1, so
 * counting the coins never gives the total.
 */
export function makePurse(plan: ShopPlan, rng: Rng): number[] {
  for (;;) {
    const coins = Array.from({ length: rng.int(3, PURSE_MAX) }, () => rng.pick(plan.coins)).sort(
      (a, b) => b - a,
    );
    const total = sum(coins);
    if (coins[0] > 1 && total >= plan.price[0] && total <= plan.price[1]) return coins;
  }
}

/**
 * Three number cards for a purse, in a seeded order: the total, the number of coins (the classic slip of counting each coin
 * as one) and a neighbour of the total, one more or one less, that is neither of the others.
 */
export function purseCards(purse: number[], rng: Rng): number[] {
  const total = sum(purse);
  const count = purse.length;
  const sides = rng.chance(0.5) ? [total + 1, total - 1] : [total - 1, total + 1];
  const near = sides.find((n) => n >= 1 && n !== count)!;
  return rng.shuffle([total, count, near]);
}

/** Why a card is wrong: it is the number of coins, it is one off, or (never among the three cards) something else. */
export function purseMiss(purse: number[], card: number): 'coins' | 'near' | 'other' | null {
  const total = sum(purse);
  if (card === total) return null;
  if (card === purse.length) return 'coins';
  return Math.abs(card - total) === 1 ? 'near' : 'other';
}

/** The hint counts the purse largest first, saying each running total: 5, 2, 2, 1 is "5, 7, 9, 10". */
export function countOn(purse: number[]): number[] {
  const out: number[] = [];
  for (const c of [...purse].sort((a, b) => b - a)) out.push((out.at(-1) ?? 0) + c);
  return out;
}

/** The fewest coins that make an amount (greedy works for 1, 2, 5 and 10): the hint's suggestion. */
export function fewest(amount: number, coins: number[]): number[] {
  const out: number[] = [];
  let left = amount;
  for (const c of [...coins].sort((a, b) => b - a)) while (left >= c) (out.push(c), (left -= c));
  return out;
}

/** An exact payment is efficient when it uses no more coins than the best available payment. */
export const usesFewestCoins = (amount: number, coins: number[], payment: number[]) =>
  sum(payment) === amount && payment.length === fewest(amount, coins).length;

/** Two payments count as different ways if they use different coins, not just a different order. */
export const sameWay = (a: number[], b: number[]) => [...a].sort().join() === [...b].sort().join();

/** A second way to pay, for the hint on 'ways' levels: break one coin of the first way into smaller ones. */
export function anotherWay(amount: number, coins: number[], first: number[]): number[] {
  const options = [
    fewest(amount, coins),
    fewest(
      amount,
      coins.filter((c) => c < 5),
    ),
    Array(amount).fill(1),
  ];
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

/** Explain a wrong amount; specific misconceptions take precedence over its size. */
export type MissKind =
  'price' | 'one-price' | 'counted-coins' | 'one-more' | 'one-less' | 'big-coin' | 'short' | 'over';
export function missKind(plan: ShopPlan, order: Order, coins: number[]): MissKind | null {
  const want = target(plan, order);
  const got = sum(coins);
  if (got === want) return null;
  if (plan.mode === 'change' && got === sum(order.prices)) return 'price';
  if (plan.mode === 'pair' && order.prices.includes(got)) return 'one-price';
  if (coins.length === want && coins.some((c) => c > 1)) return 'counted-coins';
  if (got === want - 1) return 'one-more';
  if (got === want + 1) return 'one-less';
  if (coins.some((c) => c > want)) return 'big-coin';
  return got < want ? 'short' : 'over';
}

/** The picture may be refreshed for a second payment, but help is charged once per order. */
export const hintCharge = (wrongs: number, shown: boolean, charged: boolean): number =>
  wrongs >= 2 && !shown && !charged ? 1 : 0;

/** Original six-fruit sticker draw; adding stall goods must never reinterpret saved seeds. */
export const stickerGood = (rng: Rng) => rng.int(0, 5);

const COIN_WORDS: Record<number, string> = { 2: 'two', 5: 'five', 10: 'ten' };

/**
 * The word to name a coin the first time it is tapped, or null. Only a coin that is new at its level (the 2 at level 2, the
 * 5 at level 3, the 10 at level 9) is named, and only once per game start (`named` holds the values already named). Not a
 * miss, not a hint.
 */
export function coinToName(level: number, value: number, named: ReadonlySet<number>): string | null {
  if (level < 2 || level > PLANS.length || named.has(value)) return null;
  const before = planFor(level - 1).coins;
  return !before.includes(value) && planFor(level).coins.includes(value) ? (COIN_WORDS[value] ?? null) : null;
}

/** Levels whose coins carry pips (fresh 2): the ones where she is still learning what each coin is worth. */
export const PIP_LEVELS = 3;

/** On a coin with pips the numeral shrinks and lifts (in coin radii) so the pips have room below it. */
export const PIP_NUMERAL = { scale: 0.8, y: -0.2 };

/**
 * Pips for a coin of radius `r`: one dot per shell of value, five to a row, below the numeral, so a coin's pips match the
 * price tag's dots. A single row sits between the coin's lower rim dots.
 */
export function pips(value: number, r: number): { x: number; y: number; r: number }[] {
  const out: { x: number; y: number; r: number }[] = [];
  const step = r * 0.25;
  const rows = Math.ceil(value / 5);
  for (let i = 0; i < value; i++) {
    const row = Math.floor(i / 5);
    const inRow = Math.min(5, value - row * 5);
    out.push({
      x: ((i % 5) - (inRow - 1) / 2) * step,
      y: r * (rows > 1 ? 0.3 : 0.36) + row * r * 0.26,
      r: r * 0.11,
    });
  }
  return out;
}

/**
 * The strategy the pet says before the faint coins (fresh 7), or null where the hint stays the coins alone. On a 'ways'
 * level's second payment the biggest-first payment may be the first way again, so the line is to swap a coin for smaller ones.
 */
export function teachLine(plan: ShopPlan, firstWay: number[] | null): 'biggest' | 'swap' | null {
  if (plan.mode !== 'mix' && plan.mode !== 'ways' && plan.mode !== 'fewest') return null;
  return firstWay ? 'swap' : 'biggest';
}

/** Choose the stall once for the round, after making its prices. Sticker draws use their own table. */
export const STALL_IDS = ['fruit', 'flower', 'balloon'] as const;
export type StallId = (typeof STALL_IDS)[number];
export const stallFor = (rng: Rng): StallId => rng.pick(STALL_IDS);

/** The balloon's string stays above the payment mat; all price tags keep their original position. */
export function goodPlacement(kind: PropKind, count: number, index: number) {
  return {
    x: index * 150 - (count - 1) * 75,
    y: kind === 'balloon' ? -30 : -10,
    scale: kind === 'balloon' ? 1 : 1.2,
  };
}

/** Each coin's radius before scaling: bigger coins are worth more. */
export const COIN_R: Record<number, number> = { 1: 30, 2: 35, 3: 38, 5: 40, 10: 44 };

/** Coins on the mat stand this far apart, six to a row. */
export const MAT_STEP = 80;

/**
 * How large the coins are drawn on the mat: full size, unless the level's biggest coin would be wider than a mat column (the
 * 88-wide ten-shell coin), when every coin on the mat shrinks together so the biggest just fits and their sizes still rank.
 */
export const matCoinScale = (plan: ShopPlan) =>
  Math.min(1, MAT_STEP / (2 * Math.max(...plan.coins.map((c) => COIN_R[c]))));

/** Where the i-th coin sits on the mat, in the mat's own units. */
export const matSlot = (i: number) => ({ x: -200 + (i % 6) * MAT_STEP, y: -32 + Math.floor(i / 6) * 64 });

/** The price tag's box, centred on the tag (its string hole is at the top). */
export const TAG = { w: 112, h: 88, hole: { y: -36, r: 6 } };

/**
 * What a price tag shows: the numeral, and one counting dot per shell, five to a row. From 11 the first ten are one ten bar
 * (a frame of ten cells drawn in a row) and only the ones are dots, so a ten-shell coin matches the bar (decided
 * 2026-10-23). The numeral and dots are smaller there so the bar fits inside the same tag.
 */
export function tagMarks(price: number): {
  numeral: { y: number; size: number };
  bar: { x: number; y: number; cell: number; h: number } | null;
  dots: { x: number; y: number; r: number }[];
} {
  const dot = (i: number, top: number, step: number, r: number) => ({
    x: -40 + (i % 5) * 20,
    y: top + Math.floor(i / 5) * step,
    r,
  });
  if (price <= 10)
    return {
      numeral: { y: -8, size: 40 },
      bar: null,
      dots: Array.from({ length: price }, (_, i) => dot(i, 22, 14, 5)),
    };
  return {
    numeral: { y: -14, size: 32 },
    bar: { x: -45, y: 4, cell: 9, h: 12 },
    dots: Array.from({ length: price - 10 }, (_, i) => dot(i, 25, 10, 4)),
  };
}

/** Where the stall's awning starts, down from the top of the view, and how far its posts and scalloped edge reach from it. */
export const AWNING = { drop: 360, stripes: 56, scallop: 42.5 };
/** The coin tap box (hit circle radius 46 at scale 1.25), the bell's round button and the mat's box, in units. */
export const COIN_HIT = 115;
export const BELL_HIT = 112;
export const MAT_BOX = { w: 500, h: 160 };
/** A purse level's number card (drawn 104 by 110) and its tap box; the three cards stand where the purse's coins do. */
export const CARD_HIT = { w: 112, h: 116 };

/**
 * Shared round stock anchor for every stall; the existing payment area keeps its geometry. Sideways the counter is where it
 * always was (the awning at the top). Held upright (chunk 31, docs/definitions/phone-portrait.md) the whole stall moves
 * down the tall screen: its awning clear of Home and "?" (it starts at 220 or lower), the counter near 45% of the height,
 * and never so low that its front meets the purse of coins along the foot.
 */
export function stallLayout(view: { w: number; h: number; upright?: true }) {
  const cx = view.w / 2;
  const stockX = cx - 150;
  if (!view.upright) return { cx, cy: Math.min(view.h * 0.5, 420), stockX, awningTop: 60 };
  const cy = Math.min(Math.max(580, view.h * 0.45), view.h - 452);
  return { cx, cy, stockX, awningTop: cy - AWNING.drop };
}

/**
 * Where the coins of the purse rest along the foot of the view, clear of the guide in the bottom-left corner. Three coins
 * keep their old row; a purse of four (with the ten-shell coin) runs nearer the right edge so four whole tap boxes fit the
 * 768-wide upright view.
 */
export function purseFor(view: { w: number; h: number }, n: number): { x: number; y: number }[] {
  return spread(n, 220, view.w - (n > 3 ? 60 : 160), 170).map((x) => ({ x, y: view.h - 85 }));
}

/**
 * The running total is the game's to give (said, and drawn on the counter's slate) wherever the price is one number to
 * reach. Not in pair or purse mode, where adding up is the puzzle, nor in change mode, where the ten strip counts up instead.
 */
export const showsTotal = (plan: ShopPlan) =>
  plan.mode !== 'pair' && plan.mode !== 'change' && plan.mode !== 'purse';

/** The number on the counter's slate: the coins' sum, or null when the level keeps it back or the counter is empty. */
export const totalShown = (plan: ShopPlan, coins: number[]): number | null =>
  showsTotal(plan) && coins.length ? sum(coins) : null;

/** Where the slate sits, in the mat's own units: on the counter's edge above the mat's last column, clear of the hint coins. */
export const TOTAL_SLATE = { x: 208, y: -98, w: 76, h: 50 };

/** Change levels count up from the price (fresh 4): the shopkeeper's method of giving change. */
export const countsUp = (plan: ShopPlan) => plan.mode === 'change';

/**
 * The numbers said when a coin worth `value` lands and `before` is already on the counter toward the change from `price`:
 * the price first (only for the first coin), then each number up to the new count. A 2 after the price 7 says "7… 8, 9".
 */
export function countUpWords(price: number, before: number, value: number): number[] {
  const out = before === 0 ? [price] : [];
  for (let k = 1; k <= value; k++) out.push(price + before + k);
  return out;
}

/** How the words of one coin are spoken: a pause after the price, then the count. */
export const countUpText = (words: number[], price: number) =>
  words[0] === price && words.length > 1 ? `${price}… ${words.slice(1).join(', ')}` : words.join(', ');

export type StripCell = 'price' | 'change' | 'empty';

/**
 * The ten strip under the tag: the price's cells, then the change given so far, up to what the customer paid. A 20 makes
 * two strips of ten, drawn one above the other (`STRIP` rows).
 */
export function tenStrip(price: number, given: number, paid = PAID): { cells: StripCell[]; over: number } {
  const cells = Array.from({ length: paid }, (_, i): StripCell =>
    i < price ? 'price' : i < price + given ? 'change' : 'empty',
  );
  return { cells, over: Math.max(0, price + given - paid) };
}

/**
 * How the strip is drawn, in the goods' units, centred under the tag: one row of ten 20-unit cells for a 10, two rows of
 * shorter cells for a 20, with the frame's outer box. A gap splits each row after five cells.
 */
export function stripLayout(paid: number) {
  const rows = paid / 10;
  const w = 20;
  const h = rows > 1 ? 16 : 20;
  const gap = 2;
  const top = rows > 1 ? -h - gap / 2 : -h / 2;
  const cells = Array.from({ length: paid }, (_, i) => {
    const col = i % 10;
    return { x: -100 + col * w + (col >= 5 ? 4 : 0), y: top + Math.floor(i / 10) * (h + gap), w, h };
  });
  const height = rows * h + (rows - 1) * gap;
  return { y: rows > 1 ? -84 : -88, cells, frame: { x: -104, y: top - 4, w: 212, h: height + 8 } };
}

/** Where the customer's coins lie on the counter beside the goods: one 10, or two 10s for a 20 (there is no 20-coin). */
export const paidCoins = (paid: number) =>
  Array.from({ length: paid / 10 }, (_, i) => ({ value: 10, x: 150 + i * 14, y: -40 + i * 10 }));

/**
 * The count-up hint at level 11: the fewest coins of change, smallest first, so from a price below 15 the count passes 15 on
 * its way to 20 (13, then a 2 to 15, then a 5 to 20). Returns the coins and the stops said after the price.
 */
export function countUpHint(
  price: number,
  paid: number,
  coins: number[],
): { coins: number[]; stops: number[] } {
  const up = fewest(paid - price, coins).sort((a, b) => a - b);
  const stops: number[] = [];
  for (const c of up) stops.push((stops.at(-1) ?? price) + c);
  return { coins: up, stops };
}

/** Change levels where the hint counts up coin by coin instead of showing one way: the change from a 20. */
export const hintCountsUp = (plan: ShopPlan) => plan.mode === 'change' && paidFor(plan) > PAID;

/** What is said when change lands: the coin's own value first, then the count up ("2. 7… 8, 9"). */
export const countUpSaid = (price: number, before: number, value: number) =>
  `${value}. ${countUpText(countUpWords(price, before, value), price)}`;
