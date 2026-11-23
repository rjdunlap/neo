import type { Rng } from '../../engine/random';
import { hinted, missEvery, newTally } from '../../progress/coach';
import type { BandLevels } from '../../progress/difficulty';

export const LEVELS: BandLevels = { grownup: { min: 1, max: 2 } };
export const describeLevel = (level: number) =>
  level === 1
    ? 'Two workshops: fill the order in the given number of mornings.'
    : 'Better at both: give each workshop work that helps the order leave as soon as possible.';

export const GOODS = ['crate', 'boat'] as const;
export const WORKSHOPS = ['Oar', 'Anchor'] as const;
export const MAX_MORNINGS = 6;
export type Good = 0 | 1;
export type Counts = [crates: number, boats: number];
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

export const emptyPlan = (rows: number, mornings: number): Plan =>
  Array.from({ length: rows }, () => Array<Good | null>(mornings).fill(null));

export function rowCounts(row: Row): Counts {
  const counts: Counts = [0, 0];
  for (const good of row) if (good !== null) counts[good]++;
  return counts;
}

export function totals(order: Order, counts: Counts[]): Counts {
  const result: Counts = [0, 0];
  counts.forEach(([crates, boats], i) => {
    result[0] += crates * order.rates[i][0];
    result[1] += boats * order.rates[i][1];
  });
  return result;
}

export const fills = (order: Order, made: Counts) => made.every((n, i) => n >= order.wanted[i]);

/** A shortest plan on a small board can be enumerated by counts per workshop. */
export function fewest(order: Order): Solution | null {
  for (let mornings = 1; mornings <= MAX_MORNINGS; mornings++) {
    const rows: Counts[] = [];
    for (let crates = 0; crates <= mornings; crates++) {
      for (let boats = 0; boats + crates <= mornings; boats++) rows.push([crates, boats]);
    }
    const plans: Counts[][] = [];
    for (const first of rows) {
      for (const second of rows) {
        const plan = [first, second];
        if (fills(order, totals(order, plan))) plans.push(plan);
      }
    }
    if (plans.length) return { mornings, plans };
  }
  return null;
}

export function mostOfFills(order: Order, mornings: number): boolean {
  // The generator excludes ties in the rates of each workshop.
  const counts = order.rates.map<Counts>(([crates, boats]) =>
    crates > boats ? [mornings, 0] : [0, mornings],
  );
  return fills(order, totals(order, counts));
}

export function generate(level: number, rng: Rng): { order: Order; solution: Solution; draws: number } {
  const first = level === 1;
  const topRate = first ? 4 : 5;
  for (let draws = 1; draws <= 3000; draws++) {
    const a: Counts = [rng.int(1, topRate), rng.int(1, topRate)];
    const b: Counts = [rng.int(1, topRate), rng.int(1, topRate)];
    if (a[0] === a[1] || b[0] === b[1]) continue;
    const crateLead = a[0] - b[0];
    const boatLead = a[1] - b[1];
    if (first ? crateLead * boatLead >= 0 : crateLead * boatLead <= 0) continue;
    const mornings = rng.int(first ? 2 : 3, first ? 3 : 4);
    const order: Order = { rates: [a, b], wanted: [0, 0] };
    const draw = () => Array.from({ length: mornings }, () => (rng.int(0, 1) === 0 ? 0 : 1));
    const [crates, boats] = totals(order, [rowCounts(draw()), rowCounts(draw())]);
    order.wanted = [crates - rng.int(0, first ? 1 : 2), boats - rng.int(0, first ? 1 : 2)];
    const low = Math.min(...order.wanted);
    if (low < 4 || Math.max(...order.wanted) > low * 3) continue;
    if (!first && mostOfFills(order, mornings)) continue;
    const solution = fewest(order);
    if (solution?.mornings === mornings && (first || solution.plans.length <= 2))
      return { order, solution, draws };
  }
  const order: Order = first
    ? {
        rates: [
          [1, 4],
          [4, 1],
        ],
        wanted: [5, 5],
      }
    : {
        rates: [
          [1, 3],
          [3, 5],
        ],
        wanted: [8, 7],
      };
  return { order, solution: fewest(order)!, draws: 3000 };
}

export function planKey(plan: Plan): string {
  return [plan[0].length, ...plan.flatMap(rowCounts)].join('/');
}

export type Send =
  | { kind: 'short'; good: Good; missing: number }
  | { kind: 'ready' }
  | { kind: 'spare'; mornings: number; shortest: number; surplus: Counts };

export function send(order: Order, solution: Solution, plan: Plan): Send {
  const made = totals(order, plan.map(rowCounts));
  for (const good of [0, 1] as const) {
    if (made[good] < order.wanted[good])
      return { kind: 'short', good, missing: order.wanted[good] - made[good] };
  }
  const mornings = plan[0].length;
  if (mornings === solution.mornings) return { kind: 'ready' };
  return {
    kind: 'spare',
    mornings,
    shortest: solution.mornings,
    surplus: [made[0] - order.wanted[0], made[1] - order.wanted[1]],
  };
}

export type Hint = { kind: 'add' | 'remove' | 'send' } | { kind: 'row'; row: number; counts: Counts };

const agrees = (a: Counts, b: Counts) => a[0] === b[0] && a[1] === b[1];

export function nextHint(order: Order, solution: Solution, plan: Plan): Hint {
  const mornings = plan[0].length;
  if (mornings < solution.mornings) return { kind: 'add' };
  if (mornings > solution.mornings) return { kind: 'remove' };
  const rows = plan.map(rowCounts);
  if (fills(order, totals(order, rows))) return { kind: 'send' };
  // Squares can change goods but cannot return to blank. Filling blanks never makes an order short.
  const playable = solution.plans.filter((plan) =>
    plan.every(([crates, boats], i) => crates + boats >= rows[i][0] + rows[i][1]),
  );
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
export const arrangement = ([crates, boats]: Counts, mornings: number): Row =>
  Array.from({ length: mornings }, (_, i) => (i < crates ? 0 : i < crates + boats ? 1 : null));

export const goodsWords = (n: number, good: Good) => `${n} ${GOODS[good]}${n === 1 ? '' : 's'}`;
const morningsWords = (n: number) => `${n} morning${n === 1 ? '' : 's'}`;

export function sendWorking(result: Send): string {
  if (result.kind === 'short') return `The order still needs ${goodsWords(result.missing, result.good)}.`;
  if (result.kind === 'ready') return 'The order is on its way.';
  const [crates, boats] = result.surplus;
  const surplus = [crates && goodsWords(crates, 0), boats && goodsWords(boats, 1)]
    .filter(Boolean)
    .join(' and ');
  const extra = surplus ? ` It makes ${surplus} extra.` : '';
  return `This plan fills the order in ${morningsWords(result.mornings)}.${extra} ${morningsWords(result.shortest)} are enough.`;
}

export class RoundCredit {
  readonly score = newTally();
  private readonly sent = new Set<string>();
  private readonly shown = new Set<string>();

  miss(plan: Plan, result: Send): boolean {
    if (result.kind !== 'spare') return false;
    const key = planKey(plan);
    if (this.sent.has(key)) return false;
    this.sent.add(key);
    return missEvery(this.score);
  }

  help(plan: Plan, hint: Hint): void {
    if (hint.kind === 'send') return;
    const key = planKey(plan);
    if (this.shown.has(key)) return;
    this.shown.add(key);
    hinted(this.score);
  }
}
