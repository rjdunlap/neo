import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  affordable,
  BANDS,
  BATCHES,
  batchCost,
  bestChoice,
  boatTalk,
  cheaperBoat,
  dayPerTwo,
  demand,
  EVENT_DELTA,
  EVENTS,
  fewerShellsWorks,
  forecastChoice,
  helps,
  insight,
  LEVELS,
  makeWeek,
  MIN_PURSE,
  moveFriend,
  moreLemonsWorks,
  PER_TWO,
  PLANS,
  planFor,
  perTwo,
  PRICE_DROP,
  priceChoice,
  rating,
  RATE_OFFERS,
  SAME_OFFERS,
  sellDay,
  settle,
  shortest,
  START_PURSE,
  tallerMove,
  tallest,
  towerMoves,
  towerRows,
  towersEven,
  typicalCrowd,
  WEATHERS,
  type Day,
  type Row,
  type StandPlan,
} from './logic';

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

/** Play a whole round with a chooser, the way the game does, and return its table. */
function play(
  plan: StandPlan,
  week: Day[],
  choose: (day: Day, i: number, purse: number, rows: Row[]) => { made: number; price: number },
) {
  const rows: Row[] = [];
  const purses = [START_PURSE];
  let purse = START_PURSE;
  week.forEach((day, i) => {
    const { made, price } = choose(day, i, purse, rows);
    expect(affordable(plan, purse, made, day), `day ${i} affordable`).toBe(true);
    const row = sellDay(plan, day, i, made, price);
    rows.push(row);
    if (plan.purse) {
      const s = settle(purse, row);
      purse = s.purse;
      purses.push(purse);
    }
  });
  return { rows, purses };
}

const randomChooser = (plan: StandPlan, rng: Rng) => (d: Day, _i: number, purse: number, _rows?: Row[]) => ({
  made: rng.pick(BATCHES.filter((b) => affordable(plan, purse, b, d))),
  price: rng.pick(plan.prices),
});

describe('Lemonade Stand plans', () => {
  it('climbs from the weather alone to a week with a purse, and clamps the level', () => {
    expect(PLANS.map((p) => p.days)).toEqual([3, 3, 4, 5, 4, 4, 5]);
    expect(PLANS.map((p) => p.events)).toEqual([false, true, true, true, true, true, false]);
    expect(PLANS.map((p) => priceChoice(p))).toEqual([false, false, true, true, true, true, false]);
    expect(PLANS.map((p) => p.purse)).toEqual([false, false, false, true, true, true, false]);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[6]);
    expect(LEVELS.school?.max).toBe(PLANS.length);
    expect(PLANS.map((p) => p.boats)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      'same',
      'rate',
      undefined,
    ]);
    for (const p of PLANS) expect(p.name.length).toBeGreaterThan(10);
  });
});

describe('Lemonade Stand forecasts', () => {
  it('rebuilds the same week from the same seed', () => {
    for (const plan of PLANS)
      for (const seed of SEEDS) expect(makeWeek(plan, new Rng(seed))).toEqual(makeWeek(plan, new Rng(seed)));
  });

  it('makes a week of the planned length with something to compare', () => {
    for (const plan of PLANS) {
      const seen = new Set<string>();
      for (const seed of SEEDS) {
        const week = makeWeek(plan, new Rng(seed));
        expect(week).toHaveLength(plan.days);
        expect(
          new Set(week.map((d) => d.weather)).size,
          `${plan.days} days, seed ${seed}`,
        ).toBeGreaterThanOrEqual(2);
        for (const d of week) {
          expect(d.noise).toBeGreaterThanOrEqual(0);
          // Only the typical-day level widens the sunny noise, so its sunny crowds differ enough to level.
          expect(d.noise).toBeLessThanOrEqual(d.weather === 'sunny' ? (plan.sunnyNoise ?? 2) : 2);
          expect(d.event === null || EVENTS.includes(d.event)).toBe(true);
          if (!plan.events) expect(d.event).toBeNull();
          // A rainy quiet day would leave almost nobody to sell to.
          expect(d.weather === 'rainy' && d.event === 'quiet').toBe(false);
          seen.add(d.weather);
        }
        if (plan.events) expect(week.filter((d) => d.event).length).toBeGreaterThanOrEqual(1);
      }
      expect([...seen].sort()).toEqual([...WEATHERS].sort());
    }
  });

  it('on the first plan has exactly two weathers, one of them twice', () => {
    for (const seed of SEEDS) {
      const week = makeWeek(PLANS[0], new Rng(seed));
      const counts = WEATHERS.map((w) => week.filter((d) => d.weather === w).length).sort();
      expect(counts).toEqual([0, 1, 2]);
    }
  });
});

describe('Lemonade Stand demand', () => {
  it('keeps the three weathers apart at one price, with no overlap, and the biggest batch covers a plain day', () => {
    expect(BANDS.rainy + 2).toBeLessThan(BANDS.cloudy);
    expect(BANDS.cloudy + 2).toBeLessThan(BANDS.sunny);
    expect(BANDS.sunny + 2).toBeLessThanOrEqual(BATCHES.at(-1)!);
    // Whatever the day's noise, the smallest batch that covers the crowd leaves at most two cups: a good choice always exists.
    for (const w of WEATHERS)
      for (let noise = 0; noise <= 2; noise++) {
        const wanted = BANDS[w] + noise;
        const batch = BATCHES.find((b) => b >= wanted)!;
        expect(batch - wanted, `${w} ${noise}`).toBeLessThanOrEqual(2);
        expect(
          rating(sellDay(PLANS[0], { weather: w, event: null, noise }, 0, batch, 1)),
          `${w} ${noise}`,
        ).toBe('good');
      }
  });

  it('never lets a hotter day lower the demand, nor a higher price raise it', () => {
    for (const event of [null, ...EVENTS])
      for (const noiseA of [0, 1, 2])
        for (const noiseB of [0, 1, 2])
          for (const price of plansPrices()) {
            WEATHERS.slice(1).forEach((w, i) => {
              const cooler = demand({ weather: WEATHERS[i], event, noise: noiseA }, price);
              const hotter = demand({ weather: w, event, noise: noiseB }, price);
              expect(hotter, `${w} ${event} ${price}`).toBeGreaterThanOrEqual(cooler);
            });
          }
    for (const w of WEATHERS)
      for (const event of [null, ...EVENTS])
        for (const noise of [0, 1, 2]) {
          const day: Day = { weather: w, event, noise };
          expect(demand(day, 2)).toBeLessThanOrEqual(demand(day, 1));
          expect(demand(day, 3)).toBeLessThanOrEqual(demand(day, 2));
          expect(demand(day, 3)).toBeGreaterThanOrEqual(1);
        }
  });

  it('lets a ferry bring friends and a quiet day take them away', () => {
    for (const w of WEATHERS)
      for (const noise of [0, 1, 2]) {
        const base = demand({ weather: w, event: null, noise }, 1);
        expect(demand({ weather: w, event: 'ferry', noise }, 1)).toBe(base + EVENT_DELTA.ferry);
        expect(demand({ weather: w, event: 'quiet', noise }, 1)).toBeLessThan(base);
      }
  });

  it('gives price a real tradeoff: a middle price earns most on a plain sunny day, the lowest in the rain', () => {
    const sunny = bestChoice(PLANS[2], { weather: 'sunny', event: null, noise: 0 }, 0);
    expect(sunny.price).toBe(2);
    const rainy = bestChoice(PLANS[2], { weather: 'rainy', event: null, noise: 1 }, 0);
    expect(rainy.price).toBe(1);
    // A very busy day still sells at the top price.
    const busy = bestChoice(PLANS[2], { weather: 'sunny', event: 'ferry', noise: 2 }, 0);
    expect(busy.price).toBe(3);
    // Every price level appears among the best choices somewhere, so none is a dead button.
    const best = new Set<number>();
    for (const w of WEATHERS)
      for (const event of [null, ...EVENTS])
        for (const noise of [0, 1, 2]) best.add(bestChoice(PLANS[2], { weather: w, event, noise }, 0).price);
    expect([...best].sort()).toEqual([1, 2, 3]);
    expect(Object.keys(PRICE_DROP).map(Number)).toEqual([1, 2, 3]);
  });
});

function plansPrices() {
  return [1, 2, 3];
}

describe('Lemonade Stand selling', () => {
  it('reconciles cups and shells exactly on every day of every round', () => {
    for (const plan of PLANS)
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        const week = makeWeek(plan, rng);
        const { rows } = play(plan, week, randomChooser(plan, rng));
        for (const r of rows) {
          expect(r.sold + r.left, 'made').toBe(r.made);
          expect(r.sold + r.unserved, 'wanted').toBe(r.wanted);
          expect(r.sold).toBe(Math.min(r.made, r.wanted));
          expect(r.shells).toBe(r.sold * r.price);
          expect(r.cost).toBe(plan.purse ? batchCost(r.made, dayPerTwo(week[r.day])) : 0);
          expect(r.profit).toBe(r.shells - r.cost);
          expect(r.left).toBeGreaterThanOrEqual(0);
          expect(r.unserved).toBeGreaterThanOrEqual(0);
          // Never more cups left than a batch could have been made of, and at most one of the two ever happens.
          expect(r.left > 0 && r.unserved > 0).toBe(false);
          expect(r.sold).toBeLessThanOrEqual(BATCHES.at(-1)!);
        }
      }
  });

  it('sells out a small batch on a busy day and leaves cups from a big batch on a quiet one', () => {
    const rainy: Day = { weather: 'rainy', event: null, noise: 0 };
    const sunny: Day = { weather: 'sunny', event: null, noise: 0 };
    expect(sellDay(PLANS[0], rainy, 0, 12, 1)).toMatchObject({ sold: 2, left: 10, unserved: 0 });
    expect(sellDay(PLANS[0], sunny, 0, 4, 1)).toMatchObject({ sold: 4, left: 0, unserved: 6 });
    expect(sellDay(PLANS[0], sunny, 0, 12, 1)).toMatchObject({ sold: 10, left: 2, unserved: 0 });
  });

  it('reads a day as ran out, loss, spare cups or just right', () => {
    const rainy: Day = { weather: 'rainy', event: null, noise: 1 };
    const sunny: Day = { weather: 'sunny', event: null, noise: 0 };
    expect(rating(sellDay(PLANS[0], sunny, 0, 4, 1))).toBe('out');
    expect(rating(sellDay(PLANS[0], rainy, 0, 12, 1))).toBe('left');
    expect(rating(sellDay(PLANS[0], rainy, 0, 4, 1))).toBe('good');
    expect(rating(sellDay(PLANS[0], sunny, 0, 12, 1))).toBe('good');
    // On the purse level the same spare cups cost real shells.
    expect(rating(sellDay(PLANS[3], rainy, 0, 12, 1))).toBe('loss');
    expect(rating(sellDay(PLANS[3], rainy, 0, 4, 1))).toBe('good');
  });
});

describe('Lemonade Stand purse', () => {
  it('never lets the purse go below zero or strand a day, whatever is chosen', () => {
    const plan = PLANS[3];
    const policies: [
      string,
      (rng: Rng) => (d: Day, i: number, purse: number, rows: Row[]) => { made: number; price: number },
    ][] = [
      ['random', (rng) => randomChooser(plan, rng)],
      [
        'always the biggest batch',
        () => (d, _i, purse) => ({
          made: BATCHES.filter((b) => affordable(plan, purse, b, d)).at(-1)!,
          price: 1,
        }),
      ],
      [
        'always the dearest',
        () => (d, _i, purse) => ({
          made: BATCHES.filter((b) => affordable(plan, purse, b, d)).at(-1)!,
          price: 3,
        }),
      ],
      ['always the smallest', () => () => ({ made: BATCHES[0], price: 1 })],
    ];
    for (const [name, policy] of policies) {
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        const week = makeWeek(plan, rng);
        const { purses } = play(plan, week, policy(rng));
        for (const p of purses) {
          expect(p, `${name} ${seed}`).toBeGreaterThanOrEqual(MIN_PURSE);
          expect(affordable(plan, p, BATCHES[0])).toBe(true);
        }
      }
    }
  });

  it('tops the purse up by exactly what is missing, and only then', () => {
    const rainy: Day = { weather: 'rainy', event: null, noise: 0 };
    const row = sellDay(PLANS[3], rainy, 0, 12, 1); // 2 sold for 2 shells, 6 spent on lemons
    expect(row.profit).toBe(-4);
    expect(settle(6, row)).toEqual({ purse: MIN_PURSE, restock: 0 });
    expect(settle(5, row)).toEqual({ purse: MIN_PURSE, restock: MIN_PURSE - 1 });
    expect(settle(20, row)).toEqual({ purse: 16, restock: 0 });
    // Just enough is not topped up.
    expect(settle(MIN_PURSE + 4, row)).toEqual({ purse: MIN_PURSE, restock: 0 });
  });

  it('only offers batches the purse can pay for on the purse level', () => {
    expect(batchCost(4)).toBe(2);
    expect(batchCost(12)).toBe(6);
    expect(affordable(PLANS[3], 5, 12)).toBe(false);
    expect(affordable(PLANS[3], 5, 8)).toBe(true);
    expect(affordable(PLANS[2], 0, 12)).toBe(true);
    expect(BATCHES.filter((b) => affordable(PLANS[3], START_PURSE, b))).toEqual([...BATCHES]);
  });

  it('keeps a profitable choice open every day, so the week can go well', () => {
    const plan = PLANS[3];
    for (const seed of SEEDS) {
      const week = makeWeek(plan, new Rng(seed));
      const { rows } = play(plan, week, (day, i, purse) => bestChoice(plan, day, i, purse));
      for (const r of rows) expect(r.profit, `seed ${seed} day ${r.day}`).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Lemonade Stand help', () => {
  /** Whether a help message is true of the model and the table. */
  function check(plan: StandPlan, today: Day, rows: Row[]) {
    const list = helps(plan, today, rows);
    expect(list.length).toBeGreaterThan(0);
    expect(list.at(-1)!.kind === 'price' || list.at(-1)!.kind === 'weather').toBe(true);
    for (const h of list) {
      for (const i of h.rows) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(rows.length);
      }
      if (h.kind === 'out' || h.kind === 'left' || h.kind === 'good') {
        const r = rows[h.rows[0]];
        expect(r.weather).toBe(today.weather);
        expect(r.event).toBe(today.event);
        expect(h.vars).toMatchObject({ made: r.made, sold: r.sold, left: r.left, weather: r.weather });
        if (h.kind === 'out') expect(r.wanted).toBeGreaterThan(r.made);
        if (h.kind === 'left') {
          // A whole smaller batch would have sold the same.
          expect(r.left).toBeGreaterThanOrEqual(BATCHES[0]);
          expect(BATCHES.filter((b) => b < r.made && b >= r.sold).length).toBeGreaterThan(0);
        }
        if (h.kind === 'good') expect(r.unserved === 0 && r.left < BATCHES[0]).toBe(true);
      } else if (h.kind === 'other') {
        // Only with one price: a hotter day brings more friends at the same event and price.
        expect(priceChoice(plan)).toBe(false);
        const r = rows[h.rows[0]];
        expect(r.weather).not.toBe(today.weather);
        expect(r.event).toBe(today.event);
        expect(h.vars.n).toBe(r.wanted);
        const hotter = WEATHERS.indexOf(today.weather) > WEATHERS.indexOf(r.weather);
        expect(h.vars.more).toBe(hotter ? 'more' : 'fewer');
        for (let noise = 0; noise <= 2; noise++)
          for (let n2 = 0; n2 <= 2; n2++) {
            const now = demand({ ...today, noise }, r.price);
            const then = demand({ weather: r.weather, event: r.event, noise: n2 }, r.price);
            if (hotter) expect(now).toBeGreaterThan(then);
            else expect(now).toBeLessThan(then);
          }
      } else if (h.kind === 'typical') {
        // The typical crowd: the mean of the friends who came on the sunny days before the last.
        expect(plan.typical).toBe(true);
        const sunny = h.rows.map((i) => rows[i]);
        expect(sunny.every((r) => r.weather === 'sunny')).toBe(true);
        expect(h.vars.n).toBe(sunny.reduce((n, r) => n + r.wanted, 0) / sunny.length);
      } else if (h.kind === 'event') {
        expect(today.event).toBe(h.vars.event);
        const plain = demand({ ...today, event: null }, 1);
        const now = demand(today, 1);
        if (today.event === 'ferry') expect(now).toBeGreaterThan(plain);
        else expect(now).toBeLessThan(plain);
      } else if (h.kind === 'price') {
        expect(priceChoice(plan)).toBe(true);
        expect(demand(today, 3)).toBeLessThanOrEqual(demand(today, 1));
      } else {
        expect(h.vars.weather).toBe(today.weather);
      }
    }
    return list;
  }

  it('says only true things, about rows already in the table, on every day of every round', () => {
    const kinds = new Set<string>();
    for (const plan of PLANS)
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        const week = makeWeek(plan, rng);
        const choose = randomChooser(plan, rng);
        const rows: Row[] = [];
        let purse = START_PURSE;
        week.forEach((day, i) => {
          const list = check(plan, day, rows);
          list.forEach((h) => kinds.add(h.kind));
          if (i === 0)
            expect(
              list.every((h) => h.rows.length === 0),
              'the first day has no row to point at',
            ).toBe(true);
          const { made, price } = choose(day, i, purse, rows);
          const row = sellDay(plan, day, i, made, price);
          rows.push(row);
          if (plan.purse) purse = settle(purse, row).purse;
        });
      }
    expect([...kinds].sort()).toEqual([
      'event',
      'good',
      'left',
      'other',
      'out',
      'price',
      'typical',
      'weather',
    ]);
  });

  it('leads with what happened the last time it was the same weather', () => {
    const plan = PLANS[0];
    const sunny: Day = { weather: 'sunny', event: null, noise: 1 };
    const rows = [sellDay(plan, sunny, 0, 4, 1)];
    const [first] = helps(plan, sunny, rows);
    expect(first.kind).toBe('out');
    expect(first.rows).toEqual([0]);
    // A rainy row beside it gives a second, different message, and asking again reaches the plain rule.
    const rainy: Day = { weather: 'rainy', event: null, noise: 0 };
    const both = [...rows, sellDay(plan, rainy, 1, 4, 1)];
    expect(helps(plan, sunny, both).map((h) => h.kind)).toEqual(['out', 'other', 'weather']);
    expect(helps(plan, { weather: 'cloudy', event: null, noise: 0 }, both).map((h) => h.kind)).toEqual([
      'other',
      'weather',
    ]);
  });
});

describe('Lemonade Stand end-of-round comparison', () => {
  it('names a true comparison the table can show, or the best day, and never nothing', () => {
    const kinds = new Set<string>();
    for (const plan of PLANS)
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        const week = makeWeek(plan, rng);
        const { rows } = play(plan, week, randomChooser(plan, rng));
        const found = insight(plan, rows);
        kinds.add(found.kind);
        for (const i of found.rows) expect(rows[i]).toBeDefined();
        if (found.kind === 'price') {
          const [a, b] = found.rows.map((i) => rows[i]);
          expect(priceChoice(plan)).toBe(true);
          expect(a.weather).toBe(b.weather);
          expect(a.event).toBe(b.event);
          expect(b.price).toBeGreaterThan(a.price);
          expect(b.wanted).toBeLessThan(a.wanted);
          expect(found.vars).toMatchObject({ low: a.price, high: b.price, lowN: a.wanted, highN: b.wanted });
        } else if (found.kind === 'weather') {
          const [cool, hot] = found.rows.map((i) => rows[i]);
          expect(WEATHERS.indexOf(hot.weather)).toBeGreaterThan(WEATHERS.indexOf(cool.weather));
          expect(hot.event).toBe(cool.event);
          expect(hot.price).toBe(cool.price);
          expect(hot.wanted).toBeGreaterThan(cool.wanted);
          expect(found.vars).toMatchObject({ hotN: hot.wanted, coolN: cool.wanted });
        } else if (found.kind === 'best') {
          // Only where shells are on the table, and it really is the day that kept the most.
          expect(plan.purse || priceChoice(plan)).toBe(true);
          const r = rows[found.rows[0]];
          expect(found.vars).toMatchObject({ day: r.day + 1, shells: r.profit });
          for (const o of rows) expect(r.profit).toBeGreaterThanOrEqual(o.profit);
        } else if (found.kind === 'right') {
          expect(plan.purse || priceChoice(plan)).toBe(false);
          const r = rows[found.rows[0]];
          expect(rating(r)).toBe('good');
          expect(found.vars).toMatchObject({ day: r.day + 1, made: r.made, sold: r.sold });
        }
      }
    // Every kind of comparison turns up somewhere across the plans and seeds.
    expect(kinds.has('price')).toBe(true);
    expect(kinds.has('weather')).toBe(true);
    expect(kinds.has('best')).toBe(true);
    expect(kinds.has('right')).toBe(true);
  });

  it('reads a fixed table', () => {
    const plan = PLANS[0];
    const rainy: Day = { weather: 'rainy', event: null, noise: 0 };
    const sunny: Day = { weather: 'sunny', event: null, noise: 2 };
    const rows = [
      sellDay(plan, rainy, 0, 4, 1),
      sellDay(plan, sunny, 1, 12, 1),
      sellDay(plan, rainy, 2, 4, 1),
    ];
    expect(insight(plan, rows)).toEqual({
      kind: 'weather',
      rows: [0, 1],
      vars: { hot: 'sunny', cool: 'rainy', hotN: 12, coolN: 2 },
    });
  });
});

describe('Lemonade Stand demonstration', () => {
  it('chooses from the sign alone, whatever the unseen extra friends turn out to be', () => {
    for (const plan of PLANS) {
      for (const weather of WEATHERS) {
        for (const event of [null, ...EVENTS] as const) {
          const seen = forecastChoice(plan, { weather, event });
          for (const noise of [0, 1, 2])
            expect(forecastChoice(plan, { weather, event, noise } as Day)).toEqual(seen);
        }
      }
    }
  });

  it('plays a sensible week on every plan: affordable every day, never a loss, and within two shells of the best choice', () => {
    for (const plan of PLANS) {
      for (const seed of SEEDS) {
        const week = makeWeek(plan, new Rng(seed));
        const { rows } = play(plan, week, (day, _i, purse) => forecastChoice(plan, day, purse));
        let purse = START_PURSE;
        rows.forEach((row, i) => {
          expect(row.profit, `seed ${seed} day ${i}`).toBeGreaterThanOrEqual(0);
          const best = bestChoice(plan, week[i], i, purse);
          expect(best.row.profit - row.profit, `seed ${seed} day ${i}`).toBeLessThanOrEqual(2);
          if (plan.purse) purse = settle(purse, row).purse;
        });
      }
    }
  });
});

describe('Lemonade Stand level 5: two lemon boats', () => {
  const plan = PLANS[4];
  const weeks = SEEDS.map((seed) => makeWeek(plan, new Rng(seed)));
  const days = weeks.flat();

  it('gives every day of a four-day week two boats, and the earlier levels none', () => {
    for (const w of weeks) {
      expect(w).toHaveLength(4);
      for (const d of w) {
        expect(d.boats).toHaveLength(2);
        expect(cheaperBoat(d.boats!)).toBeGreaterThanOrEqual(0);
      }
    }
    for (const p of PLANS.slice(0, 4))
      for (const seed of SEEDS) for (const d of makeWeek(p, new Rng(seed))) expect('boats' in d).toBe(false);
    // Both sides turn up as the cheaper boat.
    expect(new Set(days.map((d) => cheaperBoat(d.boats!)))).toEqual(new Set([0, 1]));
    // The weather and events are drawn before the boats, so they match the level 4 week of a plan with the same shape.
    const base = { ...PLANS[3], days: 4, purse: true };
    for (const seed of SEEDS) {
      const a = makeWeek(plan, new Rng(seed)).map(({ boats: _b, ...d }) => d);
      expect(a).toEqual(makeWeek(base, new Rng(seed)));
    }
  });

  it('keeps every offer pair fair: shared lemons or shells, one strictly cheaper, whole prices, never dearer than a shell a lemon', () => {
    for (const [a, b] of SAME_OFFERS) {
      expect(a.lemons === b.lemons || a.shells === b.shells).toBe(true);
      expect(perTwo(a)).not.toBe(perTwo(b));
      for (const o of [a, b]) {
        expect(Number.isInteger(perTwo(o))).toBe(true);
        for (const cups of BATCHES) expect(Number.isInteger(batchCost(cups, perTwo(o)))).toBe(true);
      }
      expect(Math.min(perTwo(a), perTwo(b))).toBeLessThanOrEqual(2);
      expect(cheaperBoat([a, b])).toBe(perTwo(a) < perTwo(b) ? 0 : 1);
      expect(cheaperBoat([b, a])).toBe(perTwo(b) < perTwo(a) ? 0 : 1);
    }
    expect(START_PURSE).toBeGreaterThanOrEqual(
      batchCost(12, Math.min(...SAME_OFFERS.map(([a, b]) => Math.min(perTwo(a), perTwo(b))))),
    );
    for (const d of days) expect(affordable(plan, START_PURSE, 12, d)).toBe(true);
    expect(dayPerTwo({})).toBe(PER_TWO);
  });

  it('never loses shells with the best or the sign-only choice, from any purse the host leaves', () => {
    for (const [i, day] of days.entries()) {
      for (let purse = MIN_PURSE; purse <= START_PURSE + 6; purse++) {
        const best = bestChoice(plan, day, 0, purse);
        expect(best.row.profit, `day ${i} purse ${purse}`).toBeGreaterThanOrEqual(0);
        const f = forecastChoice(plan, day, purse);
        expect(affordable(plan, purse, f.made, day)).toBe(true);
        expect(sellDay(plan, { ...day, noise: 1 }, 0, f.made, f.price).profit).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('says boat numbers that match the offers and points at the cheaper side', () => {
    for (const d of days) {
      const talk = boatTalk(d.boats!);
      const [l, r] = d.boats!;
      expect(talk.cheap).toBe(Math.min(perTwo(l), perTwo(r)));
      expect(talk.dear).toBe(Math.max(perTwo(l), perTwo(r)));
      expect(talk.cheap).toBeLessThan(talk.dear);
      expect(talk.side).toBe(cheaperBoat(d.boats!) === 0 ? 'left' : 'right');
      expect(dayPerTwo(d)).toBe(talk.cheap);
    }
  });

  it('offers only the boat comparison until the boat is chosen, then the usual help', () => {
    for (const d of days) {
      const before = helps(plan, d, [], false);
      expect(before).toHaveLength(1);
      expect(before[0]).toEqual({ kind: 'boat', rows: [], vars: boatTalk(d.boats!) });
      expect(helps(plan, d, [], true).some((h) => h.kind === 'boat')).toBe(false);
      expect(helps(plan, d, []).some((h) => h.kind === 'boat')).toBe(false);
    }
    // Days without boats never get the boat help, chosen or not.
    expect(
      helps(PLANS[3], { weather: 'sunny', event: null, noise: 0 }, [], false).some((h) => h.kind === 'boat'),
    ).toBe(false);
  });

  it('records the shells the cheaper boat saved, and nothing off the boat level', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const week = makeWeek(plan, rng);
      const { rows } = play(plan, week, randomChooser(plan, rng));
      for (const r of rows) {
        const talk = boatTalk(week[r.day].boats!);
        expect(r.saved).toBe(batchCost(r.made, talk.dear) - batchCost(r.made, talk.cheap));
        expect(r.saved).toBeGreaterThan(0);
        expect(r.cost).toBe(batchCost(r.made, talk.cheap));
      }
    }
    for (const p of PLANS.slice(0, 4))
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        const { rows } = play(p, makeWeek(p, rng), randomChooser(p, rng));
        for (const r of rows) expect(r.saved).toBe(0);
      }
  });

  it('ends the round on the boats, with the total saved, and no other level does', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const { rows } = play(plan, makeWeek(plan, rng), randomChooser(plan, rng));
      const found = insight(plan, rows);
      expect(found.kind).toBe('boats');
      expect(found.vars.n).toBe(rows.reduce((n, r) => n + r.saved, 0));
      expect(found.rows).toEqual(rows.map((r) => r.day));
    }
    for (const p of PLANS.slice(0, 4))
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        const { rows } = play(p, makeWeek(p, rng), randomChooser(p, rng));
        expect(insight(p, rows).kind).not.toBe('boats');
      }
  });
});

describe('Lemonade Stand level 6: best buy', () => {
  const plan = PLANS[5];
  const weeks = SEEDS.map((seed) => makeWeek(plan, new Rng(seed)));
  const days = weeks.flat();

  it('keeps every offer pair fair: lemons and shells both differ, one strictly cheaper, whole prices, never dearer than a shell a lemon', () => {
    for (const [a, b] of RATE_OFFERS) {
      expect(a.lemons).not.toBe(b.lemons);
      expect(a.shells).not.toBe(b.shells);
      expect(perTwo(a)).toBeLessThan(perTwo(b));
      for (const o of [a, b]) {
        expect(Number.isInteger(perTwo(o))).toBe(true);
        expect(o.lemons).toBeLessThanOrEqual(6);
        expect(o.shells).toBeLessThanOrEqual(6);
        for (const cups of BATCHES) expect(Number.isInteger(batchCost(cups, perTwo(o)))).toBe(true);
      }
      expect(perTwo(a)).toBeLessThanOrEqual(PER_TWO);
      expect(cheaperBoat([a, b])).toBe(0);
      expect(cheaperBoat([b, a])).toBe(1);
    }
    expect(new Set(RATE_OFFERS.map(([a, b]) => `${a.lemons}/${a.shells}-${b.lemons}/${b.shells}`)).size).toBe(
      RATE_OFFERS.length,
    );
    // The level-5 pool is the other kind: a shared number of lemons or shells.
    for (const pair of SAME_OFFERS) expect(RATE_OFFERS).not.toContainEqual(pair);
    for (const d of days) expect(affordable(plan, START_PURSE, 12, d)).toBe(true);
  });

  it('needs the unit rate: neither fewer shells nor more lemons picks the cheaper boat every time', () => {
    expect(RATE_OFFERS.some((p) => !fewerShellsWorks(p))).toBe(true);
    expect(RATE_OFFERS.some((p) => !moreLemonsWorks(p))).toBe(true);
    for (const w of weeks) {
      expect(w).toHaveLength(4);
      expect(w.some((d) => !fewerShellsWorks(d.boats!))).toBe(true);
      expect(w.some((d) => !moreLemonsWorks(d.boats!))).toBe(true);
      for (let i = 1; i < w.length; i++) {
        const key = (d: Day) =>
          d
            .boats!.map((o) => `${o.lemons}/${o.shells}`)
            .sort()
            .join();
        expect(key(w[i])).not.toBe(key(w[i - 1]));
      }
    }
    // Both sides turn up as the cheaper boat, and every pair turns up.
    expect(new Set(days.map((d) => cheaperBoat(d.boats!)))).toEqual(new Set([0, 1]));
    const seen = new Set(
      days.map((d) =>
        d
          .boats!.map((o) => `${o.lemons}/${o.shells}`)
          .sort()
          .join(),
      ),
    );
    expect(seen.size).toBe(RATE_OFFERS.length);
  });

  it('keeps level 5 weeks exactly as they were, and draws the weather before the boats', () => {
    const base = { ...PLANS[3], days: 4, purse: true };
    for (const seed of SEEDS) {
      const a = makeWeek(plan, new Rng(seed)).map(({ boats: _b, ...d }) => d);
      expect(a).toEqual(makeWeek(base, new Rng(seed)));
      for (const d of makeWeek(PLANS[4], new Rng(seed)))
        expect(SAME_OFFERS).toContainEqual(
          cheaperBoat(d.boats!) === 0 ? d.boats : [d.boats![1], d.boats![0]],
        );
    }
  });

  it('scales both offers to 2 lemons truthfully: the spoken shells times the twos of lemons are the sign', () => {
    for (const d of days) {
      const talk = boatTalk(d.boats!);
      const cheap = d.boats![cheaperBoat(d.boats!)];
      const dear = d.boats![1 - cheaperBoat(d.boats!)];
      expect(talk.cheap * (cheap.lemons / 2)).toBe(cheap.shells);
      expect(talk.dear * (dear.lemons / 2)).toBe(dear.shells);
      expect(talk.cheap).toBeLessThan(talk.dear);
      expect(dayPerTwo(d)).toBe(talk.cheap);
    }
  });

  it('never loses shells with the best or the sign-only choice, from any purse the host leaves', () => {
    for (const [i, day] of days.entries()) {
      for (let purse = MIN_PURSE; purse <= START_PURSE + 6; purse++) {
        const best = bestChoice(plan, day, 0, purse);
        expect(best.row.profit, `day ${i} purse ${purse}`).toBeGreaterThanOrEqual(0);
        const f = forecastChoice(plan, day, purse);
        expect(affordable(plan, purse, f.made, day)).toBe(true);
        expect(sellDay(plan, { ...day, noise: 1 }, 0, f.made, f.price).profit).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('records the savings and ends the round on the boats, as level 5 does', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const week = makeWeek(plan, rng);
      const { rows } = play(plan, week, randomChooser(plan, rng));
      for (const r of rows) {
        const talk = boatTalk(week[r.day].boats!);
        expect(r.saved).toBe(batchCost(r.made, talk.dear) - batchCost(r.made, talk.cheap));
        expect(r.saved).toBeGreaterThan(0);
      }
      const found = insight(plan, rows);
      expect(found.kind).toBe('boats');
      expect(found.vars.n).toBe(rows.reduce((n, r) => n + r.saved, 0));
      expect(helps(plan, week[0], [], false)).toEqual([
        { kind: 'boat', rows: [], vars: boatTalk(week[0].boats!) },
      ]);
    }
  });
});

describe('level 7, a typical sunny day', () => {
  const plan = planFor(7);
  const weeks = Array.from({ length: 300 }, (_, s) => makeWeek(plan, new Rng(7000 + s)));
  const runWeek = (week: Day[]) => week.map((d, i) => sellDay(plan, d, i, forecastChoice(plan, d).made, 1));

  it('is the last school level: five days at one price, no events, no purse, no boats', () => {
    expect(LEVELS.school?.max).toBe(7);
    expect(plan).toMatchObject({ days: 5, prices: [1], events: false, purse: false, typical: true });
    expect(plan.boats).toBeUndefined();
  });

  it('holds three sunny days and one other in days 1 to 4, and a sunny day 5', () => {
    for (const week of weeks) {
      expect(week).toHaveLength(5);
      expect(week.slice(0, 4).filter((d) => d.weather === 'sunny')).toHaveLength(3);
      expect(week[4].weather).toBe('sunny');
      for (const d of week) {
        expect(d.event).toBeNull();
        expect(d.boats).toBeUndefined();
        expect(d.noise).toBeGreaterThanOrEqual(0);
        expect(d.noise).toBeLessThanOrEqual(d.weather === 'sunny' ? 4 : 2);
      }
    }
  });

  it('gives unequal sunny towers with a whole typical crowd, at least two moves away, that a batch can serve', () => {
    for (const week of weeks) {
      const towers = towerRows(plan, runWeek(week)).map((r) => r.wanted);
      expect(towers).toHaveLength(3);
      expect(towersEven(towers)).toBe(false);
      expect(Number.isInteger(typicalCrowd(towers))).toBe(true);
      expect(towerMoves(towers)).toBeGreaterThanOrEqual(2);
      expect(typicalCrowd(towers)).toBeLessThanOrEqual(BATCHES.at(-1)!);
    }
  });

  it('builds the towers and the typical crowd from the friends who came, never the cups sold', () => {
    for (const week of weeks.slice(0, 60)) {
      // Small batches sell out, so sold understates the crowd while wanted does not.
      const rows = week.map((d, i) => sellDay(plan, d, i, 4, 1));
      const sunny = towerRows(plan, rows);
      expect(sunny.map((r) => r.day)).toEqual(
        week.flatMap((d, i) => (d.weather === 'sunny' && i < 4 ? [i] : [])),
      );
      const mean = sunny.reduce((n, r) => n + r.wanted, 0) / 3;
      const help = helps(plan, week[4], rows.slice(0, 4))[0];
      expect(help).toMatchObject({ kind: 'typical', vars: { n: mean } });
      const found = insight(plan, rows);
      expect(found.vars.n).toBe(mean);
      expect(found.vars.came).toBe(rows[4].wanted);
      expect(found.kind).toBe(rows[4].wanted === mean ? 'typical' : 'typical-near');
      expect(sunny.some((r) => r.sold !== r.wanted)).toBe(true);
    }
  });

  it('never calls a move from a taller tower to a shorter one a taller move, and levelling tallest to shortest finishes', () => {
    expect(tallerMove([13, 11, 9], 1, 2)).toBe(false);
    expect(tallerMove([13, 11, 9], 0, 1)).toBe(false);
    expect(tallerMove([13, 11, 9], 2, 1)).toBe(true);
    expect(tallerMove([12, 12, 9], 0, 1)).toBe(true);
    for (const week of weeks) {
      let towers = towerRows(plan, runWeek(week)).map((r) => r.wanted);
      const moves = towerMoves(towers);
      let n = 0;
      while (!towersEven(towers)) {
        const from = tallest(towers);
        const to = shortest(towers);
        expect(tallerMove(towers, from, to)).toBe(false);
        towers = moveFriend(towers, from, to);
        n++;
      }
      expect(n).toBe(moves);
      expect(towers[0]).toBe(typicalCrowd(towerRows(plan, runWeek(week)).map((r) => r.wanted)));
    }
  });

  it('leaves the weeks of levels 1 to 6 as they were', () => {
    // The level-7 week is its own branch; the others draw exactly what they did.
    for (let level = 1; level <= 6; level++) {
      const p = planFor(level);
      expect(p.typical).toBeUndefined();
      const week = makeWeek(p, new Rng(42));
      for (const d of week) expect(d.noise).toBeLessThanOrEqual(2);
    }
  });
});
