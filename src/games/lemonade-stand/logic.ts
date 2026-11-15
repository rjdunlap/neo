import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Lemonade Stand: a short market week. Each day shows a forecast, the child chooses how many cups to make (and,
 * later, a price), the stand opens, friends buy, and a row is added to a picture table. Nothing here is a right or
 * wrong answer: a weak batch is an experiment that produces honest evidence for the next day.
 *
 * Demand is a plain function of the day's weather, its event and the price chosen (plus a fixed per-day noise
 * made with the round's seed), so a week can be rebuilt from its seed and every sentence the pet says about it can
 * be checked against the model.
 */
export const WEATHERS = ['rainy', 'cloudy', 'sunny'] as const;
export type Weather = (typeof WEATHERS)[number];
export const EVENTS = ['ferry', 'quiet'] as const;
export type StandEvent = (typeof EVENTS)[number];

/** The batches she can make. */
export const BATCHES = [4, 8, 12] as const;
/** On the purse level, a lemon makes two cups and costs one shell: a batch of 4 costs 2 shells, 8 costs 4, 12 costs 6. */
export const CUPS_PER_LEMON = 2;
export const LEMON_COST = 1;
/** Shells for two lemons (one small batch of 4 cups) at the stand's usual lemon price. */
export const PER_TWO = 2 * LEMON_COST;
/**
 * What a batch costs, from the shells two lemons cost. Two lemons make the smallest batch (4 cups), so the price is
 * kept per two lemons and every batch costs whole shells, at the usual price and at either boat's.
 */
export const batchCost = (cups: number, perTwo = PER_TWO) => (cups / (2 * CUPS_PER_LEMON)) * perTwo;
/** The purse a market week starts with: enough for any batch on the first day. */
export const START_PURSE = batchCost(BATCHES.at(-1)!);
/** The smallest batch's cost. A purse never starts a day below this: the host tops it up. */
export const MIN_PURSE = batchCost(BATCHES[0]);

/** How many friends come on the first (lowest) day of each weather, before the day's noise (0 to 2 more). */
export const BANDS: Record<Weather, number> = { rainy: 2, cloudy: 6, sunny: 10 };
/** Extra friends the event brings (or takes away). */
export const EVENT_DELTA: Record<StandEvent, number> = { ferry: 4, quiet: -4 };
/** Friends lost to the price, by shells per cup. A higher price always loses friends. */
export const PRICE_DROP: Record<number, number> = { 1: 0, 2: 2, 3: 6 };

export interface StandPlan {
  days: number;
  /** The forecast may carry an event as well as the weather. */
  events: boolean;
  /** The prices (shells per cup) she may choose from. One price means the price is not part of the play. */
  prices: readonly number[];
  /** Cups cost shells to make, and the purse carries from day to day. */
  purse: boolean;
  /**
   * Each morning two lemon boats offer lemons and she taps the cheaper one before choosing a batch. `same`: the two
   * offers share the number of lemons or the number of shells. `rate`: they share neither, so she compares the shells
   * for every 2 lemons (a unit rate).
   */
  boats?: 'same' | 'rate';
  /**
   * A typical sunny day: days 1 to 4 hold three sunny days, and before the last day (sunny too) the friends who came on
   * those three stand as towers she levels to find the typical crowd. The table gains a column of friends who came.
   */
  typical?: boolean;
  /** The most extra friends a sunny day can bring (2 unless a plan says otherwise), so the sunny crowds differ. */
  sunnyNoise?: number;
  name: string;
}

export const PLANS: StandPlan[] = [
  {
    days: 3,
    events: false,
    prices: [1],
    purse: false,
    name: 'Three days: read the weather, choose how many cups to make',
  },
  {
    days: 3,
    events: true,
    prices: [1],
    purse: false,
    name: 'Three days with an event on the forecast: a ferry or a quiet day',
  },
  {
    days: 4,
    events: true,
    prices: [1, 2, 3],
    purse: false,
    name: 'Four days: choose a price in shells as well as the cups',
  },
  {
    days: 5,
    events: true,
    prices: [1, 2, 3],
    purse: true,
    name: 'A market week: cups cost shells to make, so read the profit',
  },
  {
    days: 4,
    events: true,
    prices: [1, 2, 3],
    purse: true,
    boats: 'same',
    name: 'Two lemon boats: tap the boat that sells lemons cheaper, then run the stand',
  },
  {
    days: 4,
    events: true,
    prices: [1, 2, 3],
    purse: true,
    boats: 'rate',
    name: 'Best buy: the boats differ in lemons and shells, so find the shells for every 2 lemons',
  },
  {
    days: 5,
    events: false,
    prices: [1],
    purse: false,
    typical: true,
    sunnyNoise: 4,
    name: 'A typical sunny day: level the three sunny crowds into even towers, then make cups for one more sunny day',
  },
];

export const LEVELS: BandLevels = {
  school: { min: 1, max: 7 },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** A boat's offer: this many lemons for this many shells. */
export interface Offer {
  lemons: number;
  shells: number;
}

/** Shells for two lemons at an offer, the number the pet compares (always whole for the offers in the pools). */
export const perTwo = (o: Offer) => (o.shells * 2) / o.lemons;

/**
 * The level-5 offer pairs: the same lemons or the same shells, one boat strictly cheaper, and the cheaper boat never
 * dearer than a shell a lemon, so the opening purse still pays for any batch and a day that keeps shells is always open.
 */
export const SAME_OFFERS: readonly (readonly [Offer, Offer])[] = [
  [
    { lemons: 2, shells: 1 },
    { lemons: 2, shells: 2 },
  ],
  [
    { lemons: 2, shells: 1 },
    { lemons: 2, shells: 3 },
  ],
  [
    { lemons: 2, shells: 2 },
    { lemons: 2, shells: 4 },
  ],
  [
    { lemons: 4, shells: 2 },
    { lemons: 4, shells: 4 },
  ],
  [
    { lemons: 4, shells: 2 },
    { lemons: 2, shells: 2 },
  ],
  [
    { lemons: 4, shells: 4 },
    { lemons: 2, shells: 4 },
  ],
];

export interface Day {
  weather: Weather;
  event: StandEvent | null;
  /** Friends beyond the weather's lowest day (0 to 2): the same weather is never exactly the same crowd. */
  noise: number;
  /** The morning's two boats, left then right (boat levels only). */
  boats?: readonly [Offer, Offer];
}

/**
 * The level-6 offer pairs (cheaper boat first): the lemons and the shells both differ, one boat strictly cheaper for
 * every 2 lemons, whole shells for every 2 lemons, the cheaper boat never dearer than a shell a lemon, and at most six
 * of each on a sign. Neither shortcut works across the pool: in some pairs the boat asking fewer shells is the dearer
 * one, and in others the boat with more lemons is.
 */
export const RATE_OFFERS: readonly (readonly [Offer, Offer])[] = [
  [
    { lemons: 2, shells: 1 },
    { lemons: 6, shells: 6 },
  ],
  [
    { lemons: 6, shells: 3 },
    { lemons: 2, shells: 2 },
  ],
  [
    { lemons: 4, shells: 2 },
    { lemons: 6, shells: 6 },
  ],
  [
    { lemons: 6, shells: 3 },
    { lemons: 4, shells: 4 },
  ],
  [
    { lemons: 6, shells: 6 },
    { lemons: 2, shells: 3 },
  ],
  [
    { lemons: 4, shells: 4 },
    { lemons: 2, shells: 3 },
  ],
  [
    { lemons: 2, shells: 1 },
    { lemons: 4, shells: 4 },
  ],
  [
    { lemons: 2, shells: 2 },
    { lemons: 4, shells: 6 },
  ],
];

/** The shortcut "the boat asking fewer shells is cheaper" picks this pair's cheaper boat. */
export const fewerShellsWorks = ([a, b]: readonly [Offer, Offer]) =>
  (a.shells < b.shells ? 0 : 1) === cheaperBoat([a, b]);
/** The shortcut "the boat with more lemons is cheaper" picks this pair's cheaper boat. */
export const moreLemonsWorks = ([a, b]: readonly [Offer, Offer]) =>
  (a.lemons > b.lemons ? 0 : 1) === cheaperBoat([a, b]);

/** Which of the day's boats (0 left, 1 right) sells lemons cheaper. */
export const cheaperBoat = (boats: readonly [Offer, Offer]) => (perTwo(boats[0]) < perTwo(boats[1]) ? 0 : 1);

/** Shells for two lemons today: the cheaper boat's offer (a wrong boat is never bought from), or the usual price. */
export const dayPerTwo = (day: Pick<Day, 'boats'>) =>
  day.boats ? perTwo(day.boats[cheaperBoat(day.boats)]) : PER_TWO;

/** What the pet says to compare the two boats: shells for two lemons at each, and which side is cheaper. */
export function boatTalk(boats: readonly [Offer, Offer]): {
  cheap: number;
  dear: number;
  side: 'left' | 'right';
} {
  const i = cheaperBoat(boats);
  return { cheap: perTwo(boats[i]), dear: perTwo(boats[1 - i]), side: i === 0 ? 'left' : 'right' };
}

export const priceChoice = (plan: StandPlan) => plan.prices.length > 1;

const clean = (day: Day) => !(day.weather === 'rainy' && day.event === 'quiet');

function weatherPlan(plan: StandPlan, rng: Rng): Weather[] {
  if (plan.days === 3 && !plan.events) {
    // Two weathers, one of them twice, so there is always a day to compare with and a day that differs.
    const a = rng.pick(WEATHERS);
    const b = rng.pick(WEATHERS.filter((w) => w !== a));
    return rng.shuffle([a, a, b]);
  }
  for (;;) {
    const out = Array.from({ length: plan.days }, () => rng.pick(WEATHERS));
    if (new Set(out).size >= 2) return out;
  }
}

/** The forecast for a whole round, rebuilt exactly from the seed. */
export function makeWeek(plan: StandPlan, rng: Rng): Day[] {
  if (plan.typical) return typicalWeek(plan, rng);
  for (;;) {
    const weathers = weatherPlan(plan, rng);
    const events: (StandEvent | null)[] = weathers.map(() => null);
    if (plan.events) {
      const count = rng.int(1, 2);
      const days = rng.shuffle(weathers.map((_, i) => i)).slice(0, count);
      for (const i of days) events[i] = rng.pick(EVENTS);
    }
    const week: Day[] = weathers.map((weather, i) => ({ weather, event: events[i], noise: rng.int(0, 2) }));
    if (!week.every(clean)) continue;
    // Drawn after everything else, so the weeks of the levels without boats stay exactly as they were.
    if (plan.boats === 'same') {
      for (const day of week) {
        const pair = rng.pick(SAME_OFFERS);
        day.boats = rng.chance(0.5) ? [pair[0], pair[1]] : [pair[1], pair[0]];
      }
    } else if (plan.boats === 'rate') {
      // Each week has a morning where fewer shells is the dearer boat and one where more lemons is, so only the
      // shells for every 2 lemons answers every morning; never the same pair two mornings running.
      for (;;) {
        let last: (typeof RATE_OFFERS)[number] | null = null;
        const pairs = week.map(() => (last = rng.pick(RATE_OFFERS.filter((p) => p !== last))));
        if (pairs.some((p) => !fewerShellsWorks(p)) && pairs.some((p) => !moreLemonsWorks(p))) {
          week.forEach((day, i) => {
            const pair = pairs[i];
            day.boats = rng.chance(0.5) ? [pair[0], pair[1]] : [pair[1], pair[0]];
          });
          break;
        }
      }
    }
    return week;
  }
}

/**
 * The typical-day week: days 1 to 4 are three sunny days and one rainy or cloudy day, the last day is sunny, no events.
 * The three sunny crowds are redrawn until they can be levelled to a whole typical crowd that a batch can serve, and
 * levelling them takes at least two moves.
 */
function typicalWeek(plan: StandPlan, rng: Rng): Day[] {
  for (;;) {
    const other = rng.pick(['rainy', 'cloudy'] as const);
    const at = rng.int(0, plan.days - 2);
    const week: Day[] = Array.from({ length: plan.days }, (_, i) => {
      const weather: Weather = i === at ? other : 'sunny';
      return { weather, event: null, noise: rng.int(0, weather === 'sunny' ? (plan.sunnyNoise ?? 2) : 2) };
    });
    const towers = week
      .slice(0, -1)
      .filter((d) => d.weather === 'sunny')
      .map((d) => demand(d, plan.prices[0]));
    if (towersFair(towers)) return week;
  }
}

/** The typical crowd: the friends in the towers shared out evenly (the mean). */
export const typicalCrowd = (towers: readonly number[]) => towers.reduce((n, h) => n + h, 0) / towers.length;

/** The fewest moves that level the towers: every friend above the typical height has to move once. */
export const towerMoves = (towers: readonly number[]) => {
  const mean = typicalCrowd(towers);
  return towers.reduce((n, h) => n + Math.max(0, h - mean), 0);
};

/** Towers worth levelling: a whole typical crowd, at least two moves away, and no more than the biggest batch serves. */
export const towersFair = (towers: readonly number[]) =>
  Number.isInteger(typicalCrowd(towers)) && towerMoves(towers) >= 2 && typicalCrowd(towers) <= BATCHES.at(-1)!;

export const towersEven = (towers: readonly number[]) => towers.every((h) => h === towers[0]);

/**
 * A move that makes the towers less even, as she can see it without knowing the typical height: a friend joins a tower
 * that was already at least as tall as the one it left. A move from a taller tower to a shorter one is never this.
 */
export const tallerMove = (towers: readonly number[], from: number, to: number) => towers[to] >= towers[from];

/** Move one friend from a tower to another. */
export const moveFriend = (towers: readonly number[], from: number, to: number) =>
  towers.map((h, i) => (i === from ? h - 1 : i === to ? h + 1 : h));

/** The tallest and shortest towers (the first of a tie): the move the glow and the demonstration point at. */
export const tallest = (towers: readonly number[]) => towers.indexOf(Math.max(...towers));
export const shortest = (towers: readonly number[]) => towers.indexOf(Math.min(...towers));

/** The rows that stand as towers: the sunny days before the last one, by the friends who came (never the cups sold). */
export const towerRows = (plan: StandPlan, rows: readonly Row[]) =>
  rows.filter((r) => r.weather === 'sunny' && r.day < plan.days - 1);

/** The friends who would come on a day at a price, if there were cups for all of them. Always at least one. */
export function demand(day: Day, price: number): number {
  const raw = BANDS[day.weather] + day.noise + (day.event ? EVENT_DELTA[day.event] : 0) - PRICE_DROP[price];
  return Math.max(1, raw);
}

export interface Row {
  /** 0-based. */
  day: number;
  weather: Weather;
  event: StandEvent | null;
  price: number;
  made: number;
  /** Friends who came wanting a cup. */
  wanted: number;
  sold: number;
  left: number;
  /** Friends who came after the cups ran out. */
  unserved: number;
  /** Shells earned: sold cups at the price. */
  shells: number;
  /** Shells spent on the lemons for the cups (purse level only). */
  cost: number;
  profit: number;
  /** Shells the cheaper boat saved against the dearer one on this batch (boat levels only). */
  saved: number;
}

/** Open the stand: what happens on a day for a chosen batch and price. */
export function sellDay(plan: StandPlan, day: Day, index: number, made: number, price: number): Row {
  const wanted = demand(day, price);
  const sold = Math.min(made, wanted);
  const shells = sold * price;
  const cost = plan.purse ? batchCost(made, dayPerTwo(day)) : 0;
  const saved = plan.purse && day.boats ? batchCost(made, boatTalk(day.boats).dear) - cost : 0;
  return {
    day: index,
    weather: day.weather,
    event: day.event,
    price,
    made,
    wanted,
    sold,
    left: made - sold,
    unserved: wanted - sold,
    shells,
    cost,
    profit: shells - cost,
    saved,
  };
}

/** Can the purse pay for this batch (at the day's lemon price)? Always true away from the purse level. */
export const affordable = (plan: StandPlan, purse: number, cups: number, day: Pick<Day, 'boats'> = {}) =>
  !plan.purse || batchCost(cups, dayPerTwo(day)) <= purse;

/**
 * Carry the purse to the next morning. A purse that cannot pay for the smallest batch is topped up by the host
 * to exactly that much, so a day can always open: there is no debt and no failed week.
 */
export function settle(purse: number, row: Row): { purse: number; restock: number } {
  const next = purse + row.profit;
  if (next >= MIN_PURSE) return { purse: next, restock: 0 };
  return { purse: MIN_PURSE, restock: MIN_PURSE - next };
}

export type Rating = 'out' | 'loss' | 'left' | 'good';

/**
 * How a day went, in the words the pet uses. None of them is a miss. `out`: friends were still waiting when the cups ran
 * out. `loss` (purse level): the cups spent more shells than they earned. `left`: a whole smaller batch would have
 * sold the same. `good`: everything sold or nearly.
 */
export function rating(row: Row): Rating {
  if (row.unserved > 0) return 'out';
  if (row.profit < 0) return 'loss';
  if (row.left >= BATCHES[0]) return 'left';
  return 'good';
}

/** The best batch and price for a day by shells (profit on the purse level), and what it earns. Ties go to the smaller batch, then the lower price. */
export function bestChoice(
  plan: StandPlan,
  day: Day,
  index: number,
  purse = START_PURSE,
): { made: number; price: number; row: Row } {
  let best: { made: number; price: number; row: Row } | null = null;
  for (const made of BATCHES) {
    if (!affordable(plan, purse, made, day)) continue;
    for (const price of plan.prices) {
      const row = sellDay(plan, day, index, made, price);
      if (!best || row.profit > best.row.profit) best = { made, price, row };
    }
  }
  return best!;
}

export const WEATHER_WORD: Record<Weather, string> = { rainy: 'rainy', cloudy: 'cloudy', sunny: 'sunny' };
const heat = (w: Weather) => WEATHERS.indexOf(w);

/** Rows she can fairly set side by side: the same event (or none), and the same price. */
const sameKind = (a: Row, b: Row) => a.event === b.event && a.price === b.price;

export type HelpKind = 'typical' | 'boat' | 'out' | 'left' | 'good' | 'other' | 'event' | 'weather' | 'price';

export interface Help {
  kind: HelpKind;
  /** Rows of the table to circle. */
  rows: number[];
  vars: Record<string, string | number>;
}

/**
 * Everything true and useful the pet can say before the stand opens today, most useful first. Asking again steps
 * through the list. It only looks at rows already in the table, so the first day has no row to point at and says how
 * the forecast works instead. Before the morning's boat is chosen, the only help is how to compare the two boats.
 */
export function helps(plan: StandPlan, today: Day, rows: Row[], boatChosen = true): Help[] {
  if (today.boats && !boatChosen) return [{ kind: 'boat', rows: [], vars: boatTalk(today.boats) }];
  const out: Help[] = [];
  const sunny = plan.typical ? towerRows(plan, rows) : [];
  if (plan.typical && today.weather === 'sunny' && sunny.length === 3)
    out.push({
      kind: 'typical',
      rows: sunny.map((r) => r.day),
      vars: { n: typicalCrowd(sunny.map((r) => r.wanted)) },
    });
  const same = rows.filter((r) => r.weather === today.weather && r.event === today.event);
  const last = same.at(-1);
  if (last) {
    const kind: HelpKind = last.unserved > 0 ? 'out' : last.left >= BATCHES[0] ? 'left' : 'good';
    out.push({
      kind,
      rows: [last.day],
      vars: {
        weather: WEATHER_WORD[last.weather],
        made: last.made,
        sold: last.sold,
        left: last.left,
        price: last.price,
      },
    });
  }
  if (!priceChoice(plan)) {
    // Only one price, so the rows differ in weather alone and "hotter, more friends" holds without a caveat.
    const other = rows.filter((r) => r.weather !== today.weather && r.event === today.event).at(-1);
    if (other) {
      out.push({
        kind: 'other',
        rows: [other.day],
        vars: {
          then: WEATHER_WORD[other.weather],
          n: other.wanted,
          weather: WEATHER_WORD[today.weather],
          more: heat(today.weather) > heat(other.weather) ? 'more' : 'fewer',
        },
      });
    }
  }
  if (today.event) out.push({ kind: 'event', rows: [], vars: { event: today.event } });
  out.push({ kind: 'weather', rows: [], vars: { weather: WEATHER_WORD[today.weather] } });
  if (priceChoice(plan)) out.push({ kind: 'price', rows: [], vars: {} });
  return out;
}

export type InsightKind = 'typical' | 'typical-near' | 'boats' | 'price' | 'weather' | 'best' | 'right' | 'plain';

export interface Insight {
  kind: InsightKind;
  rows: number[];
  vars: Record<string, string | number>;
}

/**
 * The one comparison the pet points out at the end of a round. Prefers a fair pair the table can show: the same
 * weather and event at two prices, then two weathers at the same event and price. Otherwise, when shells are on the
 * table, the day that kept the most; before that, a day whose batch was just right; otherwise just that the week is done.
 * On the boat levels the comparison is the boats': the shells the cheaper boats saved over the week's batches.
 */
export function insight(plan: StandPlan, rows: Row[]): Insight {
  const sunny = plan.typical ? towerRows(plan, rows) : [];
  const last = rows.at(-1);
  if (plan.typical && sunny.length === 3 && last && last.day === plan.days - 1) {
    // The typical-day level compares the last sunny day with the typical crowd it was planned from.
    const n = typicalCrowd(sunny.map((r) => r.wanted));
    return {
      kind: last.wanted === n ? 'typical' : 'typical-near',
      rows: [...sunny.map((r) => r.day), last.day],
      vars: { n, came: last.wanted },
    };
  }
  const saved = rows.reduce((n, r) => n + r.saved, 0);
  if (plan.boats && saved > 0) return { kind: 'boats', rows: rows.map((r) => r.day), vars: { n: saved } };
  if (priceChoice(plan)) {
    for (const a of rows) {
      for (const b of rows) {
        if (a.weather === b.weather && a.event === b.event && b.price > a.price && b.wanted < a.wanted) {
          return {
            kind: 'price',
            rows: [a.day, b.day],
            vars: {
              weather: WEATHER_WORD[a.weather],
              low: a.price,
              high: b.price,
              lowN: a.wanted,
              highN: b.wanted,
            },
          };
        }
      }
    }
  }
  for (const a of rows) {
    for (const b of rows) {
      if (heat(a.weather) > heat(b.weather) && sameKind(a, b) && a.wanted > b.wanted) {
        return {
          kind: 'weather',
          rows: [b.day, a.day],
          vars: {
            hot: WEATHER_WORD[a.weather],
            cool: WEATHER_WORD[b.weather],
            hotN: a.wanted,
            coolN: b.wanted,
          },
        };
      }
    }
  }
  if (plan.purse || priceChoice(plan)) {
    // Shells are on the table, so "best" means the day that kept the most (earliest wins a tie).
    const top = rows.reduce((m, r) => (r.profit > m.profit ? r : m));
    return {
      kind: 'best',
      rows: [top.day],
      vars: { day: top.day + 1, weather: WEATHER_WORD[top.weather], shells: top.profit },
    };
  }
  const right = rows
    .filter((r) => rating(r) === 'good')
    .reduce<Row | null>((m, r) => (!m || r.sold > m.sold ? r : m), null);
  if (right)
    return {
      kind: 'right',
      rows: [right.day],
      vars: { day: right.day + 1, weather: WEATHER_WORD[right.weather], made: right.made, sold: right.sold },
    };
  return { kind: 'plain', rows: [], vars: {} };
}

/** What the sign shows before the stand opens: the weather and the event (and the morning's boats), never the day's noise. */
export type Forecast = Pick<Day, 'weather' | 'event' | 'boats'>;

/**
 * The batch and price a sensible child picks from the sign alone (the demonstration's choice). It takes the middle of
 * the day's unseen 0 to 2 extra friends, so it cannot read the future, and then the best choice for that crowd, which
 * on the purse level never costs more than it earns.
 */
export function forecastChoice(
  plan: StandPlan,
  forecast: Forecast,
  purse = START_PURSE,
): { made: number; price: number } {
  const { made, price } = bestChoice(plan, { ...forecast, noise: 1 }, 0, purse);
  return { made, price };
}
