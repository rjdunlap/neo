import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** Every food a monster eats. Levels 1–3, 9 and 10 keep cookies (and apples); the counting and sharing levels pick from all of them. */
export const FOODS = ['cookie', 'apple', 'carrot', 'berry', 'cracker'] as const;
export type Food = (typeof FOODS)[number];
/** How many of each food: an order, a monster's tummy, or what is on the tray. */
export type Order = Record<Food, number>;

/** No food at all; `{ ...noFood(), carrot: 2 }` is an order of two carrots. */
export const noFood = (): Order => ({ cookie: 0, apple: 0, carrot: 0, berry: 0, cracker: 0 });

/** Pairs too easy to mix up side by side at level 6: two round, baked browns; two round reds. */
const LOOK_ALIKE: [Food, Food][] = [
  ['cookie', 'cracker'],
  ['apple', 'berry'],
];
export const lookAlike = (a: Food, b: Food) =>
  LOOK_ALIKE.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

/** "1 berry", "3 berries", "2 cookies". */
export function foodWord(food: Food, n: number): string {
  if (n === 1) return food;
  return food === 'berry' ? 'berries' : `${food}s`;
}
export type MunchMode =
  | 'tap'
  | 'big'
  | 'count'
  | 'each'
  | 'eachkind'
  | 'exact'
  | 'two'
  | 'share'
  | 'leftover'
  | 'friends'
  | 'sharekind'
  | 'even';

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
  /** exact: a monster takes a food past its order; the bell hands the extras back (not a miss). */
  overfeed?: boolean;
  name: string;
}

export const MUNCH_PLANS: MunchPlan[] = [
  {
    mode: 'tap',
    rounds: 2,
    min: 4,
    max: 6,
    amounts: [4, 6],
    name: 'Tap cookies (or the monster) to feed it while it counts them',
  },
  {
    mode: 'count',
    rounds: 2,
    min: 3,
    max: 5,
    amounts: [3, 5],
    name: 'Feed three, then five cookies while the monster counts them',
  },
  { mode: 'each', rounds: 2, min: 1, max: 1, monsters: [2, 3], name: 'Give each monster one cookie' },
  {
    mode: 'exact',
    rounds: 3,
    min: 1,
    max: 4,
    dots: true,
    pool: true,
    name: 'Feed 1 to 4 of one food (number and dots), then ring the bell',
  },
  {
    mode: 'exact',
    rounds: 3,
    min: 3,
    max: 7,
    pool: true,
    overfeed: true,
    name: 'Feed 3 to 7 of one food (number only; extras come back at the bell), then ring the bell',
  },
  {
    mode: 'two',
    rounds: 3,
    min: 1,
    max: 3,
    pool: true,
    name: 'Feed two foods at once, like "2 carrots and 1 apple"',
  },
  {
    mode: 'share',
    rounds: 2,
    min: 2,
    max: 3,
    monsters: [2, 3],
    pool: true,
    name: 'Share one food fairly, then say how many each monster got',
  },
  {
    mode: 'leftover',
    rounds: 2,
    min: 2,
    max: 3,
    monsters: [2, 3],
    pool: true,
    name: 'Share fairly when it does not come out even: how many each, and how many left over?',
  },
  {
    mode: 'big',
    rounds: 2,
    min: 3,
    max: 3,
    amounts: [3, 3],
    name: 'Tap three big cookies (or the monster) and its belly grows',
  },
  {
    mode: 'eachkind',
    rounds: 2,
    min: 1,
    max: 1,
    monsters: [2, 3],
    name: 'Give each monster a cookie and an apple',
  },
  {
    mode: 'friends',
    rounds: 2,
    min: 2,
    max: 3,
    dots: true,
    name: 'Call friends for groups of 2 or 3 cookies, then count friends and leftovers (including zero)',
  },
  {
    mode: 'sharekind',
    rounds: 2,
    min: 1,
    max: 3,
    monsters: [2],
    name: 'Share cookies and apples fairly, then count how many of each per monster',
  },
  {
    mode: 'even',
    rounds: 2,
    min: 2,
    max: 3,
    monsters: [2, 3],
    pool: true,
    name: 'Move food from monster to monster until everyone has the same, then say how many each',
  },
];

/** Tapping levels: a tap feeds the next cookie, and nothing can go wrong. */
export const isTapMode = (mode: MunchMode) => mode === 'tap' || mode === 'big';

export const munchPlan = (level: number) =>
  MUNCH_PLANS[Math.max(0, Math.min(MUNCH_PLANS.length - 1, level - 1))];

export interface MunchRound {
  monsters: number;
  /** The foods on the tray; the first is the one counted or shared, the second (at two and eachkind) the other. */
  kinds: Food[];
  /** What one monster wants (exact and two); every monster's share (each and share). */
  want: Order;
  tray: Order;
  /** Leftover levels: foods that can't be shared fairly. */
  left?: number;
  /** Even it out: how many each monster already holds when the round opens (uneven; they add up to `monsters * want`). */
  start?: number[];
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
  const two = plan.mode === 'two' || plan.mode === 'eachkind' || plan.mode === 'sharekind';
  if (!plan.pool) return two ? ['cookie', 'apple'] : ['cookie'];
  const first = rng.pick(FOODS.filter((f) => f !== last));
  if (!two) return [first];
  return [first, rng.pick(FOODS.filter((f) => f !== first && !lookAlike(f, first)))];
}

/** Even it out: everyone starts with `each`, then a few moves of one or two make the tummies uneven (never all alike, never empty). */
export function unevenStart(monsters: number, each: number, rng: Rng): number[] {
  const counts = Array<number>(monsters).fill(each);
  for (let tries = 0; tries < 20; tries++) {
    for (let k = 0; k < 3; k++) {
      const from = rng.pick(counts.flatMap((c, i) => (c > 0 ? [i] : [])));
      const to = rng.pick(counts.flatMap((_, i) => (i === from ? [] : [i])));
      const n = Math.min(counts[from], rng.int(1, 2));
      counts[from] -= n;
      counts[to] += n;
    }
    // One monster holds clearly more than another, so there is something to move.
    // Nobody starts empty: every monster has something, and something to give or to get.
    if (Math.min(...counts) >= 1 && Math.max(...counts) - Math.min(...counts) >= 2) return counts;
  }
  const out = Array<number>(monsters).fill(each);
  out[0] += 1;
  out[1] -= 1;
  return out;
}

/** Even it out: the same food in every tummy. */
export const isEven = (counts: number[]) => counts.every((c) => c === counts[0]);

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
      case 'friends': {
        const each = r === 0 ? 2 : rng.int(2, 3);
        const friends = r === 0 ? 3 : rng.int(2, Math.min(4, Math.floor(TRAY_MAX / each)));
        const left = r === 0 ? 1 : rng.int(0, Math.min(each - 1, TRAY_MAX - friends * each));
        rounds.push({ monsters: friends, kinds, want: of(each), tray: of(each * friends + left), left });
        break;
      }
      case 'sharekind': {
        const a = r === 0 ? 2 : rng.int(1, 3);
        const b = r === 0 ? 1 : rng.int(1, Math.min(3, Math.floor(TRAY_MAX / monsters) - a));
        rounds.push({ monsters, kinds, want: of(a, b), tray: of(a * monsters, b * monsters) });
        break;
      }
      case 'even': {
        const each = rng.int(plan.min, Math.min(plan.max, Math.floor(TRAY_MAX / monsters)));
        const start = unevenStart(monsters, each, rng);
        rounds.push({ monsters, kinds, want: of(each), tray: of(each * monsters), start });
        break;
      }
      case 'share': {
        const each = rng.int(plan.min, Math.min(plan.max, Math.floor(9 / monsters)));
        rounds.push({ monsters, kinds, want: of(each), tray: of(each * monsters) });
        break;
      }
      case 'leftover': {
        // Fewer leftovers than monsters, and everything still fits on the tray.
        const each = rng.int(
          plan.min,
          Math.min(plan.max, Math.floor((TRAY_MAX - (monsters - 1)) / monsters)),
        );
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

/** The foods a monster holds past its order: the bell at an overfeeding level hands these back. */
export function overfed(want: Order, have: Order): Order {
  const o = noFood();
  for (const f of FOODS) o[f] = Math.max(0, have[f] - want[f]);
  return o;
}

/** After sharing, how many cookies each monster gives back so that everyone has `each`. */
export function extras(counts: number[], each: number): number[] {
  return counts.map((c) => Math.max(0, c - each));
}

/** Three different answers from 1 to 10, including `answer`. */
export function numberChoices(answer: number, rng: Rng): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter(
    (v) => v >= (answer === 0 ? 0 : 1) && v <= 10,
  );
  return rng.shuffle([answer, ...rng.shuffle(near).slice(0, 2)]);
}

/** "3 cookies", "1 apple", "2 berries and 1 carrot"; `more` gives "1 more cookie". Foods are said in `FOODS` order, as the sign shows them. */
export function orderWords(o: Order, more = false): string {
  const parts = FOODS.filter((f) => o[f] > 0).map(
    (f) => `${o[f]} ${more ? 'more ' : ''}${foodWord(f, o[f])}`,
  );
  return parts.join(' and ') || 'nothing';
}

/** One touch of the ghost finger: tap a waiting food, carry one to a monster, ring the bell, or tap a number (by its value). */
export type MunchTouch =
  { tap: number } | { take: number } | { give: number; to: number } | 'bell' | 'call' | { pad: number };

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
  asking: MunchQuestion;
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
    const answer = munchAnswer(t);
    return answer !== undefined && t.pads.includes(answer) ? { pad: answer } : null;
  }
  switch (plan.mode) {
    case 'tap':
    case 'big': {
      const i = waiting();
      return i < 0 ? null : { tap: i };
    }
    case 'sharekind': {
      for (const food of t.kinds) {
        const to = t.fed.reduce((best, f, i) => (f[food] < t.fed[best][food] ? i : best), 0);
        const i = t.fed[to][food] < t.want[food] ? waiting(food) : -1;
        if (i >= 0) return { give: i, to };
      }
      return null;
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
    case 'even': {
      const kind = t.kinds[0];
      const each = t.want[kind];
      // A cookie waiting on the tray goes to whoever has the fewest.
      const i = waiting(kind);
      if (i >= 0) {
        const to = t.fed.reduce((best, f, m) => (f[kind] < t.fed[best][kind] ? m : best), 0);
        return { give: i, to };
      }
      // Otherwise whoever holds more than the fair share hands one back to the tray.
      const from = t.fed.findIndex((f) => f[kind] > each);
      return from >= 0 ? { take: from } : 'bell';
    }
    case 'friends': {
      for (let to = 0; to < t.fed.length; to++) {
        if (t.fed[to][t.kinds[0]] < t.want[t.kinds[0]]) {
          const i = waiting();
          return i < 0 ? null : { give: i, to };
        }
      }
      return canCallFriend(t) ? 'call' : 'bell';
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
export type MunchHint = 'food' | 'bell' | 'monster' | 'pad' | 'call';

/** The thing that glows after two misses: the same next useful thing `munchTouch` would touch. Tapping levels have no misses. */
export function munchHint(plan: MunchPlan, t: MunchTable): MunchHint | null {
  if (isTapMode(plan.mode) || plan.mode === 'count') return null;
  if (t.pads.length) return 'pad';
  if (plan.mode === 'friends') {
    const move = munchTouch(plan, t);
    return move === 'call' ? 'call' : move === 'bell' ? 'bell' : 'monster';
  }
  if (plan.mode === 'even') return 'monster';
  if (plan.mode === 'exact' || plan.mode === 'two') {
    const need = missing(t.want, t.fed[0]);
    return total(need) === 0 ? 'bell' : 'food';
  }
  if (plan.mode === 'leftover' && t.fed.every((f) => f[t.kinds[0]] >= t.want[t.kinds[0]])) return 'bell';
  return 'monster';
}

/** Both food questions and quotitive sharing keep their answers tied to the visible table. */
export type MunchQuestion = 'each' | 'second' | 'friends' | 'left';
export function munchAnswer(t: MunchTable): number | undefined {
  if (t.asking === 'left') return t.left;
  if (t.asking === 'friends') return t.fed.length;
  return t.want[t.kinds[t.asking === 'second' ? 1 : 0]];
}

/** Reserve the food still owed to the friends already outside before admitting another. */
export function canCallFriend(t: MunchTable): boolean {
  const each = t.want[t.kinds[0]];
  const waiting = t.snacks.filter((s) => !s.eaten).length;
  const owed = t.fed.reduce((n, f) => n + Math.max(0, each - f[t.kinds[0]]), 0);
  return t.fed.length < 4 && waiting - owed >= each;
}

/** All called friends have exactly their group, and no further complete group remains. */
export function friendsReady(t: MunchTable): boolean {
  return (
    t.fed.every((f) => complete(t.want, f)) && t.snacks.filter((s) => !s.eaten).length < t.want[t.kinds[0]]
  );
}

/** Return only the overfull food of each kind; matching totals alone are not fair shares. */
export function shareReturns(want: Order, fed: Order[]): Order[] {
  return fed.map((have) => {
    const back = noFood();
    for (const f of FOODS) back[f] = Math.max(0, have[f] - want[f]);
    return back;
  });
}

export const LEVELS: BandLevels = {
  // Big bites (9) opens the lap band, One of each (10) sits between 3 and 4 at toddler.
  lap: { min: 1, max: 9, order: [9, 1, 2] },
  toddler: { min: 2, max: 10, order: [2, 3, 10, 4] },
  preschool: { min: 4, max: 6 },
  prek: { min: 5, max: 7 },
  school: { min: 6, max: 13, order: [6, 7, 12, 8, 11, 13] },
};
