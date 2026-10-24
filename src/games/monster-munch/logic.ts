import type { Rng } from '../../engine/random';

/** Every food a monster eats. Levels 1–3, 9 and 10 keep cookies (and apples); the counting and sharing levels pick from all of them. */
export const FOODS = ['cookie', 'apple', 'carrot', 'berry', 'cracker'] as const;
export type Food = (typeof FOODS)[number];
/** How many of each food: an order, a monster's tummy, or what is on the tray. */
export type Order = Record<Food, number>;

/** No food at all; `{ ...noFood(), carrot: 2 }` is an order of two carrots. */
export const noFood = (): Order => ({ cookie: 0, apple: 0, carrot: 0, berry: 0, cracker: 0 });

/** Pairs too easy to mix up side by side at level 6: two round, baked browns; two round reds. */
const LOOK_ALIKE: [Food, Food][] = [['cookie', 'cracker'], ['apple', 'berry']];
export const lookAlike = (a: Food, b: Food) => LOOK_ALIKE.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

/** "1 berry", "3 berries", "2 cookies". */
export function foodWord(food: Food, n: number): string {
  if (n === 1) return food;
  return food === 'berry' ? 'berries' : `${food}s`;
}
export type MunchMode = 'tap' | 'big' | 'count' | 'each' | 'eachkind' | 'exact' | 'two' | 'share' | 'leftover';

export interface MunchPlan {
  mode: MunchMode;
  rounds: number;
  /** exact: how many asked for; two: how many of the first food (the second is 1 to 2); share: how many per monster. */
  min: number;
  max: number;
  /** exact: dots under the number on the sign. */
  dots?: boolean;
  /** each and share: how many monsters in each round. */
  monsters?: number[];
  /** tap and count: how many cookies in each round, a short round first. */
  amounts?: number[];
  /** Each round picks its food (two at `two`) from all of `FOODS`, rather than cookies (and apples). */
  pool?: boolean;
  name: string;
}

export const MUNCH_PLANS: MunchPlan[] = [
  { mode: 'tap', rounds: 2, min: 4, max: 6, amounts: [4, 6], name: 'Tap cookies (or the monster) to feed it while it counts them' },
  { mode: 'count', rounds: 2, min: 3, max: 5, amounts: [3, 5], name: 'Feed three, then five cookies while the monster counts them' },
  { mode: 'each', rounds: 2, min: 1, max: 1, monsters: [2, 3], name: 'Give each monster one cookie' },
  { mode: 'exact', rounds: 3, min: 1, max: 4, dots: true, pool: true, name: 'Feed 1 to 4 of one food (number and dots), then ring the bell' },
  { mode: 'exact', rounds: 3, min: 3, max: 7, pool: true, name: 'Feed 3 to 7 of one food (number only), then ring the bell' },
  { mode: 'two', rounds: 3, min: 1, max: 3, pool: true, name: 'Feed two foods at once, like "2 carrots and 1 apple"' },
  { mode: 'share', rounds: 2, min: 2, max: 3, monsters: [2, 3], pool: true, name: 'Share one food fairly, then say how many each monster got' },
  { mode: 'leftover', rounds: 2, min: 2, max: 3, monsters: [2, 3], pool: true, name: 'Share fairly when it does not come out even: how many each, and how many left over?' },
  { mode: 'big', rounds: 2, min: 3, max: 3, amounts: [3, 3], name: 'Tap three big cookies (or the monster) and its belly grows' },
  { mode: 'eachkind', rounds: 2, min: 1, max: 1, monsters: [2, 3], name: 'Give each monster a cookie and an apple' },
];

/** Tapping levels: a tap feeds the next cookie, and nothing can go wrong. */
export const isTapMode = (mode: MunchMode) => mode === 'tap' || mode === 'big';

export const munchPlan = (level: number) => MUNCH_PLANS[Math.max(0, Math.min(MUNCH_PLANS.length - 1, level - 1))];

export interface MunchRound {
  monsters: number;
  /** The foods on the tray; the first is the one counted or shared, the second (at two and eachkind) the other. */
  kinds: Food[];
  /** What one monster wants (exact and two); every monster's share (each and share). */
  want: Order;
  tray: Order;
  /** Leftover levels: foods that can't be shared fairly. */
  left?: number;
}

/** An order of `a` of the first kind and `b` of the second. */
const order = (kinds: Food[], a: number, b = 0): Order => {
  const o = noFood();
  o[kinds[0]] += a;
  if (kinds[1]) o[kinds[1]] += b;
  return o;
};

/** This round's foods: from the whole pool (a different first food from last round, two that don't look alike at two), else cookies and apples. */
function pickKinds(plan: MunchPlan, rng: Rng, last: Food | undefined): Food[] {
  const two = plan.mode === 'two' || plan.mode === 'eachkind';
  if (!plan.pool) return two ? ['cookie', 'apple'] : ['cookie'];
  const first = rng.pick(FOODS.filter((f) => f !== last));
  if (!two) return [first];
  return [first, rng.pick(FOODS.filter((f) => f !== first && !lookAlike(f, first)))];
}

/** The tray holds at most this many foods, so everything stays big enough to grab. */
export const TRAY_MAX = 10;

export function munchRounds(plan: MunchPlan, rng: Rng): MunchRound[] {
  const rounds: MunchRound[] = [];
  let last = -1;
  let lastFood: Food | undefined;
  for (let r = 0; r < plan.rounds; r++) {
    const monsters = plan.monsters?.[r % plan.monsters.length] ?? 1;
    const kinds = pickKinds(plan, rng, lastFood);
    lastFood = kinds[0];
    const of = (a: number, b = 0) => order(kinds, a, b);
    switch (plan.mode) {
      case 'tap':
      case 'big':
      case 'count': {
        const n = plan.amounts?.[r] ?? plan.max;
        rounds.push({ monsters, kinds, want: of(n), tray: of(n) });
        break;
      }
      case 'each':
        // One spare cookie, so giving out cookies is a choice.
        rounds.push({ monsters, kinds, want: of(1), tray: of(monsters + 1) });
        break;
      case 'eachkind':
        // One spare of each food, so giving out food is a choice.
        rounds.push({ monsters, kinds, want: of(1, 1), tray: of(monsters + 1, monsters + 1) });
        break;
      case 'exact': {
        let n = rng.int(plan.min, plan.max);
        if (n === last) n = n < plan.max ? n + 1 : plan.min;
        last = n;
        rounds.push({ monsters, kinds, want: of(n), tray: of(Math.min(TRAY_MAX, n + 3)) });
        break;
      }
      case 'two': {
        const first = rng.int(plan.min, plan.max);
        const second = rng.int(1, 2);
        rounds.push({ monsters, kinds, want: of(first, second), tray: of(first + 2, second + 2) });
        break;
      }
      case 'share': {
        const each = rng.int(plan.min, Math.min(plan.max, Math.floor(9 / monsters)));
        rounds.push({ monsters, kinds, want: of(each), tray: of(each * monsters) });
        break;
      }
      case 'leftover': {
        // Fewer leftovers than monsters, and everything still fits on the tray.
        const each = rng.int(plan.min, Math.min(plan.max, Math.floor((TRAY_MAX - (monsters - 1)) / monsters)));
        const left = rng.int(1, monsters - 1);
        rounds.push({ monsters, kinds, want: of(each), tray: of(each * monsters + left), left });
        break;
      }
    }
  }
  return rounds;
}

/** What is still missing from an order. */
export function missing(want: Order, have: Order): Order {
  const o = noFood();
  for (const f of FOODS) o[f] = Math.max(0, want[f] - have[f]);
  return o;
}

export const complete = (want: Order, have: Order) => FOODS.every((f) => have[f] === want[f]);

/** How many foods in all. */
export const total = (o: Order) => FOODS.reduce((n, f) => n + o[f], 0);

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

/** "3 cookies", "1 apple", "2 berries and 1 carrot"; `more` gives "1 more cookie". Foods are said in `FOODS` order, as the sign shows them. */
export function orderWords(o: Order, more = false): string {
  const parts = FOODS.filter((f) => o[f] > 0).map((f) => `${o[f]} ${more ? 'more ' : ''}${foodWord(f, o[f])}`);
  return parts.join(' and ') || 'nothing';
}

/** One touch of the ghost finger: tap a waiting food, carry one to a monster, ring the bell, or tap a number (by its value). */
export type MunchTouch = { tap: number } | { give: number; to: number } | 'bell' | { pad: number };

/** What the table looks like to the finger. */
export interface MunchTable {
  want: Order;
  /** The round's foods; the first is the one counted or shared. */
  kinds: Food[];
  /** Leftover levels: foods that cannot be shared fairly. */
  left?: number;
  snacks: { food: Food; eaten: boolean }[];
  /** What each monster has eaten so far. */
  fed: Order[];
  /** The numbers on the answer pads, when there are any. */
  pads: number[];
  /** Leftover levels: whether the pads ask how many each monster got, or how many are left. */
  asking: 'each' | 'left';
}

/**
 * What a capable child touches next. Tapping levels tap a waiting cookie; the others carry the next one to a monster: to
 * the only monster until it has what the sign asks for (cookies before apples), then ring the bell; or, with several
 * monsters, to whoever has the fewest so everyone gets the same. Sharing and leftover levels then tap the number that is
 * right (how many each, then how many are left). It never feeds a monster more than it asked for, so nothing is handed back.
 */
export function munchTouch(plan: MunchPlan, t: MunchTable): MunchTouch | null {
  const waiting = (food?: Food) => t.snacks.findIndex((s) => !s.eaten && (!food || s.food === food));
  if (t.pads.length) {
    const answer = plan.mode === 'leftover' && t.asking === 'left' ? t.left : t.want[t.kinds[0]];
    return answer !== undefined && t.pads.includes(answer) ? { pad: answer } : null;
  }
  switch (plan.mode) {
    case 'tap':
    case 'big': {
      const i = waiting();
      return i < 0 ? null : { tap: i };
    }
    case 'eachkind': {
      // A food a monster lacks, to the monster that lacks it.
      for (let to = 0; to < t.fed.length; to++) {
        for (const food of t.kinds) {
          const i = t.fed[to][food] < t.want[food] ? waiting(food) : -1;
          if (i >= 0) return { give: i, to };
        }
      }
      return null;
    }
    case 'count': {
      const i = waiting();
      return i < 0 ? null : { give: i, to: 0 };
    }
    case 'exact':
    case 'two': {
      const need = missing(t.want, t.fed[0]);
      if (total(need) === 0) return 'bell';
      for (const food of t.kinds) {
        const i = need[food] > 0 ? waiting(food) : -1;
        if (i >= 0) return { give: i, to: 0 };
      }
      return null;
    }
    default: {
      // each, share and leftover: the monster with the fewest of the food that still wants one.
      const kind = t.kinds[0];
      let to = -1;
      t.fed.forEach((f, m) => {
        if (f[kind] < t.want[kind] && (to < 0 || f[kind] < t.fed[to][kind])) to = m;
      });
      if (to < 0) return plan.mode === 'leftover' ? 'bell' : null;
      const i = waiting(kind);
      return i < 0 ? null : { give: i, to };
    }
  }
}

/** Where the glow after two misses points, so the hint line can name it. */
export type MunchHint = 'food' | 'bell' | 'monster' | 'pad';

/** The thing that glows after two misses: the same next useful thing `munchTouch` would touch. Tapping levels have no misses. */
export function munchHint(plan: MunchPlan, t: MunchTable): MunchHint | null {
  if (isTapMode(plan.mode) || plan.mode === 'count') return null;
  if (t.pads.length) return 'pad';
  if (plan.mode === 'exact' || plan.mode === 'two') {
    const need = missing(t.want, t.fed[0]);
    return total(need) === 0 ? 'bell' : 'food';
  }
  if (plan.mode === 'leftover' && t.fed.every((f) => f[t.kinds[0]] >= t.want[t.kinds[0]])) return 'bell';
  return 'monster';
}
