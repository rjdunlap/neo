import type { Rng } from '../../engine/random';

export type Food = 'cookie' | 'apple';
/** How many of each food: an order, a monster's tummy, or what is on the tray. */
export type Order = Record<Food, number>;
export type MunchMode = 'tap' | 'count' | 'each' | 'exact' | 'two' | 'share' | 'leftover';

export interface MunchPlan {
  mode: MunchMode;
  rounds: number;
  /** exact: cookies asked for; two: cookies (apples are 1 to 2); share: cookies per monster. */
  min: number;
  max: number;
  /** exact: dots under the number on the sign. */
  dots?: boolean;
  /** each and share: how many monsters in each round. */
  monsters?: number[];
  name: string;
}

export const MUNCH_PLANS: MunchPlan[] = [
  { mode: 'tap', rounds: 1, min: 6, max: 6, name: 'Tap cookies to feed the monster' },
  { mode: 'count', rounds: 1, min: 5, max: 5, name: 'Feed five cookies while the monster counts them' },
  { mode: 'each', rounds: 2, min: 1, max: 1, monsters: [2, 3], name: 'Give each monster one cookie' },
  { mode: 'exact', rounds: 3, min: 1, max: 4, dots: true, name: 'Feed 1 to 4 cookies (number and dots), then ring the bell' },
  { mode: 'exact', rounds: 3, min: 3, max: 7, name: 'Feed 3 to 7 cookies (number only), then ring the bell' },
  { mode: 'two', rounds: 3, min: 1, max: 3, name: 'Feed cookies and apples, like "2 cookies and 1 apple"' },
  { mode: 'share', rounds: 2, min: 2, max: 3, monsters: [2, 3], name: 'Share cookies fairly, then say how many each monster got' },
  { mode: 'leftover', rounds: 2, min: 2, max: 3, monsters: [2, 3], name: 'Share fairly when it does not come out even: how many each, and how many left over?' },
];

export const munchPlan = (level: number) => MUNCH_PLANS[Math.max(0, Math.min(MUNCH_PLANS.length - 1, level - 1))];

export interface MunchRound {
  monsters: number;
  /** What one monster wants (exact and two); every monster's share (each and share). */
  want: Order;
  tray: Order;
  /** Leftover levels: cookies that can't be shared fairly. */
  left?: number;
}

const order = (cookie: number, apple = 0): Order => ({ cookie, apple });

/** The tray holds at most this many foods, so everything stays big enough to grab. */
export const TRAY_MAX = 10;

export function munchRounds(plan: MunchPlan, rng: Rng): MunchRound[] {
  const rounds: MunchRound[] = [];
  let last = -1;
  for (let r = 0; r < plan.rounds; r++) {
    const monsters = plan.monsters?.[r % plan.monsters.length] ?? 1;
    switch (plan.mode) {
      case 'tap':
      case 'count':
        rounds.push({ monsters, want: order(plan.max), tray: order(plan.max) });
        break;
      case 'each':
        // One spare cookie, so giving out cookies is a choice.
        rounds.push({ monsters, want: order(1), tray: order(monsters + 1) });
        break;
      case 'exact': {
        let n = rng.int(plan.min, plan.max);
        if (n === last) n = n < plan.max ? n + 1 : plan.min;
        last = n;
        rounds.push({ monsters, want: order(n), tray: order(Math.min(TRAY_MAX, n + 3)) });
        break;
      }
      case 'two': {
        const cookies = rng.int(plan.min, plan.max);
        const apples = rng.int(1, 2);
        rounds.push({ monsters, want: order(cookies, apples), tray: order(cookies + 2, apples + 2) });
        break;
      }
      case 'share': {
        const each = rng.int(plan.min, Math.min(plan.max, Math.floor(9 / monsters)));
        rounds.push({ monsters, want: order(each), tray: order(each * monsters) });
        break;
      }
      case 'leftover': {
        // Fewer leftovers than monsters, and everything still fits on the tray.
        const each = rng.int(plan.min, Math.min(plan.max, Math.floor((TRAY_MAX - (monsters - 1)) / monsters)));
        const left = rng.int(1, monsters - 1);
        rounds.push({ monsters, want: order(each), tray: order(each * monsters + left), left });
        break;
      }
    }
  }
  return rounds;
}

/** What is still missing from an order. */
export function missing(want: Order, have: Order): Order {
  return { cookie: Math.max(0, want.cookie - have.cookie), apple: Math.max(0, want.apple - have.apple) };
}

export const complete = (want: Order, have: Order) => have.cookie === want.cookie && have.apple === want.apple;

/** A monster refuses a food once it has all of that food it asked for. */
export const wantsMore = (want: Order, have: Order, food: Food) => have[food] < want[food];

/** After sharing, how many cookies each monster gives back so that everyone has `each`. */
export function extras(counts: number[], each: number): number[] {
  return counts.map((c) => Math.max(0, c - each));
}

/** Three different answers from 1 to 10, including `answer`. */
export function numberChoices(answer: number, rng: Rng): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((v) => v >= 1 && v <= 10);
  return rng.shuffle([answer, ...rng.shuffle(near).slice(0, 2)]);
}

/** "3 cookies", "1 apple", "2 cookies and 1 apple"; `more` gives "1 more cookie". */
export function orderWords(o: Order, more = false): string {
  const part = (n: number, word: string) => `${n} ${more ? 'more ' : ''}${word}${n === 1 ? '' : 's'}`;
  const parts = [o.cookie ? part(o.cookie, 'cookie') : '', o.apple ? part(o.apple, 'apple') : ''].filter(Boolean);
  return parts.join(' and ') || 'nothing';
}
