import type { Rng } from '../../engine/random';

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
export const batchCost = (cups: number) => (cups / CUPS_PER_LEMON) * LEMON_COST;
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
  name: string;
}

export const PLANS: StandPlan[] = [
  { days: 3, events: false, prices: [1], purse: false, name: 'Three days: read the weather, choose how many cups to make' },
  { days: 3, events: true, prices: [1], purse: false, name: 'Three days with an event on the forecast: a ferry or a quiet day' },
  { days: 4, events: true, prices: [1, 2, 3], purse: false, name: 'Four days: choose a price in shells as well as the cups' },
  { days: 5, events: true, prices: [1, 2, 3], purse: true, name: 'A market week: cups cost shells to make, so read the profit' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Day {
  weather: Weather;
  event: StandEvent | null;
  /** Friends beyond the weather's lowest day (0 to 2): the same weather is never exactly the same crowd. */
  noise: number;
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
  for (;;) {
    const weathers = weatherPlan(plan, rng);
    const events: (StandEvent | null)[] = weathers.map(() => null);
    if (plan.events) {
      const count = rng.int(1, 2);
      const days = rng.shuffle(weathers.map((_, i) => i)).slice(0, count);
      for (const i of days) events[i] = rng.pick(EVENTS);
    }
    const week = weathers.map((weather, i) => ({ weather, event: events[i], noise: rng.int(0, 2) }));
    if (week.every(clean)) return week;
  }
}

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
}

/** Open the stand: what happens on a day for a chosen batch and price. */
export function sellDay(plan: StandPlan, day: Day, index: number, made: number, price: number): Row {
  const wanted = demand(day, price);
  const sold = Math.min(made, wanted);
  const shells = sold * price;
  const cost = plan.purse ? batchCost(made) : 0;
  return { day: index, weather: day.weather, event: day.event, price, made, wanted, sold, left: made - sold, unserved: wanted - sold, shells, cost, profit: shells - cost };
}

/** Can the purse pay for this batch? Always true away from the purse level. */
export const affordable = (plan: StandPlan, purse: number, cups: number) => !plan.purse || batchCost(cups) <= purse;

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
export function bestChoice(plan: StandPlan, day: Day, index: number, purse = START_PURSE): { made: number; price: number; row: Row } {
  let best: { made: number; price: number; row: Row } | null = null;
  for (const made of BATCHES) {
    if (!affordable(plan, purse, made)) continue;
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

export type HelpKind = 'out' | 'left' | 'good' | 'other' | 'event' | 'weather' | 'price';

export interface Help {
  kind: HelpKind;
  /** Rows of the table to circle. */
  rows: number[];
  vars: Record<string, string | number>;
}

/**
 * Everything true and useful the pet can say before the stand opens today, most useful first. Asking again steps
 * through the list. It only looks at rows already in the table, so the first day has no row to point at and says how
 * the forecast works instead.
 */
export function helps(plan: StandPlan, today: Day, rows: Row[]): Help[] {
  const out: Help[] = [];
  const same = rows.filter((r) => r.weather === today.weather && r.event === today.event);
  const last = same.at(-1);
  if (last) {
    const kind: HelpKind = last.unserved > 0 ? 'out' : last.left >= BATCHES[0] ? 'left' : 'good';
    out.push({ kind, rows: [last.day], vars: { weather: WEATHER_WORD[last.weather], made: last.made, sold: last.sold, left: last.left, price: last.price } });
  }
  if (!priceChoice(plan)) {
    // Only one price, so the rows differ in weather alone and "hotter, more friends" holds without a caveat.
    const other = rows.filter((r) => r.weather !== today.weather && r.event === today.event).at(-1);
    if (other) {
      out.push({
        kind: 'other',
        rows: [other.day],
        vars: { then: WEATHER_WORD[other.weather], n: other.wanted, weather: WEATHER_WORD[today.weather], more: heat(today.weather) > heat(other.weather) ? 'more' : 'fewer' },
      });
    }
  }
  if (today.event) out.push({ kind: 'event', rows: [], vars: { event: today.event } });
  out.push({ kind: 'weather', rows: [], vars: { weather: WEATHER_WORD[today.weather] } });
  if (priceChoice(plan)) out.push({ kind: 'price', rows: [], vars: {} });
  return out;
}

export type InsightKind = 'price' | 'weather' | 'best' | 'right' | 'plain';

export interface Insight {
  kind: InsightKind;
  rows: number[];
  vars: Record<string, string | number>;
}

/**
 * The one comparison the pet points out at the end of a round. Prefers a fair pair the table can show: the same
 * weather and event at two prices, then two weathers at the same event and price. Otherwise, when shells are on the
 * table, the day that kept the most; before that, a day whose batch was just right; otherwise just that the week is done.
 */
export function insight(plan: StandPlan, rows: Row[]): Insight {
  if (priceChoice(plan)) {
    for (const a of rows) {
      for (const b of rows) {
        if (a.weather === b.weather && a.event === b.event && b.price > a.price && b.wanted < a.wanted) {
          return { kind: 'price', rows: [a.day, b.day], vars: { weather: WEATHER_WORD[a.weather], low: a.price, high: b.price, lowN: a.wanted, highN: b.wanted } };
        }
      }
    }
  }
  for (const a of rows) {
    for (const b of rows) {
      if (heat(a.weather) > heat(b.weather) && sameKind(a, b) && a.wanted > b.wanted) {
        return { kind: 'weather', rows: [b.day, a.day], vars: { hot: WEATHER_WORD[a.weather], cool: WEATHER_WORD[b.weather], hotN: a.wanted, coolN: b.wanted } };
      }
    }
  }
  if (plan.purse || priceChoice(plan)) {
    // Shells are on the table, so "best" means the day that kept the most (earliest wins a tie).
    const top = rows.reduce((m, r) => (r.profit > m.profit ? r : m));
    return { kind: 'best', rows: [top.day], vars: { day: top.day + 1, weather: WEATHER_WORD[top.weather], shells: top.profit } };
  }
  const right = rows.filter((r) => rating(r) === 'good').reduce<Row | null>((m, r) => (!m || r.sold > m.sold ? r : m), null);
  if (right) return { kind: 'right', rows: [right.day], vars: { day: right.day + 1, weather: WEATHER_WORD[right.weather], made: right.made, sold: right.sold } };
  return { kind: 'plain', rows: [], vars: {} };
}

/** What the sign shows before the stand opens: the weather and the event, never the day's noise. */
export type Forecast = Pick<Day, 'weather' | 'event'>;

/**
 * The batch and price a sensible child picks from the sign alone (the demonstration's choice). It takes the middle of
 * the day's unseen 0 to 2 extra friends, so it cannot read the future, and then the best choice for that crowd, which
 * on the purse level never costs more than it earns.
 */
export function forecastChoice(plan: StandPlan, forecast: Forecast, purse = START_PURSE): { made: number; price: number } {
  const { made, price } = bestChoice(plan, { ...forecast, noise: 1 }, 0, purse);
  return { made, price };
}
