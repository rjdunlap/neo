import type { Rng } from '../../engine/random';
import { hinted, missEvery, newTally } from '../../progress/coach';
import type { BandLevels } from '../../progress/difficulty';

export const LEVELS: BandLevels = { grownup: { min: 1, max: 4 } };
const DESCRIPTIONS = [
  'Two workshops: fill the order in the given number of mornings.',
  'Better at both: give each workshop work that helps the order leave as soon as possible.',
  'Three workshops: some may split their mornings between crates and boats.',
  'Lanterns too: three workshops share crates, boats and lanterns.',
];
export const describeLevel = (level: number) => DESCRIPTIONS[Math.min(Math.max(level, 1), 4) - 1];

export const GOODS = ['crate', 'boat', 'lantern'] as const;
export const WORKSHOPS = ['Oar', 'Anchor', 'Bell'] as const;
export const MAX_MORNINGS = 6;
/** An index into GOODS: crates, boats and, at level 4, lanterns. */
export type Good = number;
/** One number for each good on the board: a workshop's rates, mornings on each good, or amounts made. */
export type Counts = number[];
export type Row = (Good | null)[];
export type Plan = Row[];
export interface Order {
  rates: Counts[];
  wanted: Counts;
}
export interface Solution {
  mornings: number;
  plans: Counts[][];
}

/** Workshops and goods on a level's board. */
export const shape = (level: number) => ({ workshops: level >= 3 ? 3 : 2, goods: level >= 4 ? 3 : 2 });

export const emptyPlan = (rows: number, mornings: number): Plan =>
  Array.from({ length: rows }, () => Array<Good | null>(mornings).fill(null));

export function rowCounts(row: Row, goods = 2): Counts {
  const counts: Counts = Array<number>(goods).fill(0);
  for (const good of row) if (good !== null) counts[good]++;
  return counts;
}

export const planCounts = (order: Order, plan: Plan) =>
  plan.map((row) => rowCounts(row, order.wanted.length));

export function totals(order: Order, counts: Counts[]): Counts {
  const result: Counts = order.wanted.map(() => 0);
  counts.forEach((row, i) => row.forEach((n, good) => (result[good] += n * order.rates[i][good])));
  return result;
}

export const fills = (order: Order, made: Counts) => made.every((n, i) => n >= order.wanted[i]);

/** Every way to spend up to `mornings` mornings on `goods` goods, as counts. */
function rowChoices(goods: number, mornings: number): Counts[] {
  if (goods === 1) return Array.from({ length: mornings + 1 }, (_, n) => [n]);
  const result: Counts[] = [];
  for (let n = 0; n <= mornings; n++) {
    for (const rest of rowChoices(goods - 1, mornings - n)) result.push([n, ...rest]);
  }
  return result;
}

/** A shortest plan on a small board can be enumerated by counts per workshop. */
export function fewest(order: Order): Solution | null {
  const goods = order.wanted.length;
  const workshops = order.rates.length;
  for (let mornings = 1; mornings <= MAX_MORNINGS; mornings++) {
    const rows = rowChoices(goods, mornings);
    const plans: Counts[][] = [];
    const walk = (i: number, made: Counts, chosen: Counts[]) => {
      if (i === workshops) {
        if (made.every((n, good) => n >= order.wanted[good])) plans.push([...chosen]);
        return;
      }
      // What the remaining workshops can add at most, so a hopeless start stops early.
      for (const row of rows) {
        const next = made.map((n, good) => n + row[good] * order.rates[i][good]);
        if (!canStillFill(order, next, i + 1, mornings)) continue;
        chosen.push(row);
        walk(i + 1, next, chosen);
        chosen.pop();
      }
    };
    walk(
      0,
      order.wanted.map(() => 0),
      [],
    );
    if (plans.length) return { mornings, plans };
  }
  return null;
}

function canStillFill(order: Order, made: Counts, from: number, mornings: number): boolean {
  return made.every((n, good) => {
    let most = n;
    for (let i = from; i < order.rates.length; i++) most += order.rates[i][good] * mornings;
    return most >= order.wanted[good];
  });
}

/** Whether every workshop spending every morning on a good it makes most of can fill the order. */
export function mostOfFills(order: Order, mornings: number): boolean {
  const choices = order.rates.map((rates) => {
    const top = Math.max(...rates);
    return rates.flatMap((rate, good) => (rate === top ? [good] : []));
  });
  const walk = (i: number, made: Counts): boolean => {
    if (i === choices.length) return fills(order, made);
    return choices[i].some((good) =>
      walk(
        i + 1,
        made.map((n, g) => (g === good ? n + order.rates[i][good] * mornings : n)),
      ),
    );
  };
  return walk(
    0,
    order.wanted.map(() => 0),
  );
}

/** True when each good has one best maker and they are different workshops. */
export function eachGoodHasItsOwnBest(order: Order): boolean {
  const best = order.wanted.map((_, good) => {
    const column = order.rates.map((rates) => rates[good]);
    const top = Math.max(...column);
    const makers = column.flatMap((rate, i) => (rate === top ? [i] : []));
    return makers.length === 1 ? makers[0] : -1;
  });
  return !best.includes(-1) && new Set(best).size === best.length;
}

const LEVEL_RULES = [
  { topRate: 4, mornings: [2, 3], cut: 1, maxPlans: Infinity },
  { topRate: 5, mornings: [3, 4], cut: 2, maxPlans: 2 },
  { topRate: 5, mornings: [3, 4], cut: 2, maxPlans: 4 },
  { topRate: 5, mornings: [3, 4], cut: 2, maxPlans: 6 },
] as const;

/** Fewest-morning plans that use every morning of every workshop; the level's row caps these. */
export const fullPlans = (solution: Solution) =>
  solution.plans.filter((plan) => plan.every((row) => row.reduce((a, b) => a + b, 0) === solution.mornings));

/** The level's own rule about who is best at what. */
function bestMakerRule(level: number, order: Order): boolean {
  if (level > 2) return level === 3 || !eachGoodHasItsOwnBest(order);
  const [a, b] = order.rates;
  const product = (a[0] - b[0]) * (a[1] - b[1]);
  return level === 1 ? product < 0 : product > 0;
}

export function planCap(level: number, solution: Solution) {
  // Level 2 shipped counting every filling plan; levels 3 and 4 count full rows, as their definition does.
  const rules = LEVEL_RULES[level - 1];
  const count = level <= 2 ? solution.plans.length : fullPlans(solution).length;
  return count >= 1 && count <= rules.maxPlans;
}

const FALLBACKS: Order[] = [
  {
    rates: [
      [1, 4],
      [4, 1],
    ],
    wanted: [5, 5],
  },
  {
    rates: [
      [1, 3],
      [3, 5],
    ],
    wanted: [8, 7],
  },
  {
    rates: [
      [5, 3],
      [1, 3],
      [3, 5],
    ],
    wanted: [19, 16],
  },
  {
    rates: [
      [3, 1, 3],
      [5, 3, 2],
      [2, 3, 5],
    ],
    wanted: [11, 11, 7],
  },
];

export function generate(level: number, rng: Rng): { order: Order; solution: Solution; draws: number } {
  level = Math.min(Math.max(level, 1), 4);
  const { workshops, goods } = shape(level);
  const rules = LEVEL_RULES[level - 1];
  for (let draws = 1; draws <= 3000; draws++) {
    const rates = Array.from({ length: workshops }, () =>
      Array.from({ length: goods }, () => rng.int(1, rules.topRate)),
    );
    if (rates.some((r) => r.every((n) => n === r[0]))) continue;
    const keys = new Set(rates.map((r) => r.join('/')));
    if (keys.size < workshops) continue;
    const order: Order = { rates, wanted: Array<number>(goods).fill(0) };
    if (!bestMakerRule(level, order)) continue;
    const mornings = rng.int(rules.mornings[0], rules.mornings[1]);
    const drawn = rates.map(() => Array.from({ length: mornings }, () => rng.int(0, goods - 1)));
    const made = totals(order, planCounts(order, drawn));
    order.wanted = made.map((n) => n - rng.int(0, rules.cut));
    const low = Math.min(...order.wanted);
    if (low < 4 || Math.max(...order.wanted) > low * 3) continue;
    if (level > 1 && mostOfFills(order, mornings)) continue;
    const solution = fewest(order);
    if (solution?.mornings === mornings && planCap(level, solution)) return { order, solution, draws };
  }
  const order = structuredClone(FALLBACKS[level - 1]);
  return { order, solution: fewest(order)!, draws: 3000 };
}

/** The fallback boards, which tests hold to their level's rules. */
export const fallback = (level: number) => structuredClone(FALLBACKS[level - 1]);

export function planKey(plan: Plan, goods = 2): string {
  return [plan[0].length, ...plan.flatMap((row) => rowCounts(row, goods))].join('/');
}

export type Send =
  | { kind: 'short'; good: Good; missing: number }
  | { kind: 'ready' }
  | { kind: 'spare'; mornings: number; shortest: number; surplus: Counts };

export function send(order: Order, solution: Solution, plan: Plan): Send {
  const made = totals(order, planCounts(order, plan));
  const good = made.findIndex((n, i) => n < order.wanted[i]);
  if (good >= 0) return { kind: 'short', good, missing: order.wanted[good] - made[good] };
  const mornings = plan[0].length;
  if (mornings === solution.mornings) return { kind: 'ready' };
  return {
    kind: 'spare',
    mornings,
    shortest: solution.mornings,
    surplus: made.map((n, i) => n - order.wanted[i]),
  };
}

export type Hint = { kind: 'add' | 'remove' | 'send' } | { kind: 'row'; row: number; counts: Counts };

const agrees = (a: Counts, b: Counts) => a.every((n, i) => n === b[i]);
const sum = (counts: Counts) => counts.reduce((a, b) => a + b, 0);

export function nextHint(order: Order, solution: Solution, plan: Plan): Hint {
  const mornings = plan[0].length;
  if (mornings < solution.mornings) return { kind: 'add' };
  if (mornings > solution.mornings) return { kind: 'remove' };
  const rows = planCounts(order, plan);
  if (fills(order, totals(order, rows))) return { kind: 'send' };
  // Squares can change goods but cannot return to blank. Filling blanks never makes an order short.
  const playable = solution.plans.filter((plan) => plan.every((counts, i) => sum(counts) >= sum(rows[i])));
  let best = playable[0];
  let mostAgreements = -1;
  for (const candidate of playable) {
    const agreements = candidate.filter((counts, i) => agrees(counts, rows[i])).length;
    if (agreements > mostAgreements) {
      best = candidate;
      mostAgreements = agreements;
    }
  }
  const row = best.findIndex((counts, i) => !agrees(counts, rows[i]));
  return { kind: 'row', row, counts: best[row] };
}

/** A shortest filling row uses each of its squares, or leaves unused squares untouched. */
export function arrangement(counts: Counts, mornings: number): Row {
  const row: Row = [];
  counts.forEach((n, good) => {
    for (let i = 0; i < n; i++) row.push(good);
  });
  while (row.length < mornings) row.push(null);
  return row;
}

/** The next good when a square is tapped: a closed door opens on crates, then the goods take turns. */
export const stepGood = (good: Good | null, goods: number): Good => (good === null ? 0 : (good + 1) % goods);

export const goodsWords = (n: number, good: Good) => `${n} ${GOODS[good]}${n === 1 ? '' : 's'}`;
const morningsWords = (n: number) => `${n} morning${n === 1 ? '' : 's'}`;

/** "a, b and c" (or "a, b or c") */
export const listWords = (parts: string[], joiner = 'and') =>
  parts.length < 2 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} ${joiner} ${parts.at(-1)}`;

export function sendWorking(result: Send): string {
  if (result.kind === 'short') return `The order still needs ${goodsWords(result.missing, result.good)}.`;
  if (result.kind === 'ready') return 'The order is on its way.';
  const surplus = listWords(result.surplus.flatMap((n, good) => (n ? [goodsWords(n, good)] : [])));
  const extra = surplus ? ` It makes ${surplus} extra.` : '';
  return `This plan fills the order in ${morningsWords(result.mornings)}.${extra} ${morningsWords(result.shortest)} are enough.`;
}

export class RoundCredit {
  readonly score = newTally();
  private readonly sent = new Set<string>();
  private readonly shown = new Set<string>();

  constructor(private readonly goods = 2) {}

  miss(plan: Plan, result: Send): boolean {
    if (result.kind !== 'spare') return false;
    const key = planKey(plan, this.goods);
    if (this.sent.has(key)) return false;
    this.sent.add(key);
    return missEvery(this.score);
  }

  help(plan: Plan, hint: Hint): void {
    if (hint.kind === 'send') return;
    const key = planKey(plan, this.goods);
    if (this.shown.has(key)) return;
    this.shown.add(key);
    hinted(this.score);
  }
}
