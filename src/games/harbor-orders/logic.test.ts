import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  LEVELS,
  RoundCredit,
  arrangement,
  eachGoodHasItsOwnBest,
  emptyPlan,
  fallback,
  fewest,
  fullPlans,
  fills,
  generate,
  mostOfFills,
  nextHint,
  planCap,
  planCounts,
  planKey,
  rowCounts,
  send,
  sendWorking,
  shape,
  stepGood,
  totals,
  type Good,
  type Order,
  type Plan,
} from './logic';

const twoSpecialists: Order = {
  rates: [
    [1, 4],
    [4, 1],
  ],
  wanted: [5, 5],
};
const betterAtBoth: Order = {
  rates: [
    [1, 3],
    [3, 5],
  ],
  wanted: [8, 7],
};

/** Every arrangement of squares (not counts), up to `most` mornings, for any number of workshops and goods. */
function bruteForce(order: Order, most = 3) {
  const goods = order.wanted.length;
  const workshops = order.rates.length;
  const marks = [null, ...Array.from({ length: goods }, (_, good) => good)];
  for (let mornings = 1; mornings <= most; mornings++) {
    const accepted = new Set<string>();
    const squares = workshops * mornings;
    for (let serial = 0; serial < marks.length ** squares; serial++) {
      const amounts = Array<number>(goods).fill(0);
      const counts = Array<number>(workshops * goods).fill(0);
      for (let i = 0; i < squares; i++) {
        const good = marks[Math.floor(serial / marks.length ** i) % marks.length];
        if (good === null) continue;
        const workshop = Math.floor(i / mornings);
        counts[workshop * goods + good]++;
        amounts[good] += order.rates[workshop][good];
      }
      if (amounts.every((n, good) => n >= order.wanted[good])) accepted.add(counts.join('/'));
    }
    if (accepted.size) return { mornings, accepted };
  }
  return null;
}

describe('Harbor Orders rules', () => {
  it('keeps the four grown-up levels and counts surplus goods toward a filled order', () => {
    expect(LEVELS).toEqual({ grownup: { min: 1, max: 4 } });
    expect([1, 2, 3, 4].map(shape)).toEqual([
      { workshops: 2, goods: 2 },
      { workshops: 2, goods: 2 },
      { workshops: 3, goods: 2 },
      { workshops: 3, goods: 3 },
    ]);
    const counts = (
      [
        [1, null],
        [0, 1],
      ] satisfies Plan
    ).map((row) => rowCounts(row));
    expect(counts).toEqual([
      [0, 1],
      [1, 1],
    ]);
    expect(totals(twoSpecialists, counts)).toEqual([4, 5]);
    expect(fills(twoSpecialists, [4, 5])).toBe(false);
    expect(fills(twoSpecialists, [5, 4])).toBe(false);
    expect(fills(twoSpecialists, [5, 5])).toBe(true);
    expect(fills(twoSpecialists, [8, 6])).toBe(true);
  });

  it('finds every distinct shortest count-plan from the brute-force arrangements of small boards', () => {
    const rng = new Rng(119);
    for (let i = 0; i < 50; i++) {
      const order: Order = {
        rates: [
          [rng.int(1, 4), rng.int(1, 4)],
          [rng.int(1, 4), rng.int(1, 4)],
        ],
        wanted: [rng.int(1, 5), rng.int(1, 5)],
      };
      const brute = bruteForce(order);
      const solution = fewest(order);
      if (!brute) {
        expect(solution === null || solution.mornings > 3).toBe(true);
        continue;
      }
      if (!solution) throw new Error('The count solver missed a filling plan');
      expect(solution.mornings).toBe(brute.mornings);
      expect(new Set(solution.plans.map((plan) => plan.flat().join('/')))).toEqual(brute.accepted);
      expect(solution.plans).toHaveLength(brute.accepted.size);
    }
  });

  it.each([
    { workshops: 3, goods: 2, most: 3 },
    { workshops: 3, goods: 3, most: 2 },
  ])(
    'matches the brute-force arrangements with $workshops workshops and $goods goods',
    ({ workshops, goods, most }) => {
      const rng = new Rng(2207 + goods);
      let solved = 0;
      for (let i = 0; i < 30; i++) {
        const order: Order = {
          rates: Array.from({ length: workshops }, () => Array.from({ length: goods }, () => rng.int(1, 4))),
          wanted: Array.from({ length: goods }, () => rng.int(1, 9)),
        };
        const brute = bruteForce(order, most);
        const solution = fewest(order);
        if (!brute) {
          expect(solution === null || solution.mornings > most).toBe(true);
          continue;
        }
        solved++;
        if (!solution) throw new Error('The count solver missed a filling plan');
        expect(solution.mornings).toBe(brute.mornings);
        expect(new Set(solution.plans.map((plan) => plan.flat().join('/')))).toEqual(brute.accepted);
        expect(solution.plans).toHaveLength(brute.accepted.size);
      }
      expect(solved).toBeGreaterThan(10);
    },
  );

  it('steps a square from a closed door through each good on the board and back to crates', () => {
    expect([null, 0, 1].map((g) => stepGood(g, 2))).toEqual([0, 1, 0]);
    expect([null, 0, 1, 2].map((g) => stepGood(g, 3))).toEqual([0, 1, 2, 0]);
  });

  it('only lets most-of fail when no choice among a workshop’s tied top rates fills the order', () => {
    const order: Order = {
      rates: [
        [3, 1, 3],
        [1, 4, 2],
      ],
      wanted: [0, 4, 6],
    };
    // The first workshop ties crates and lanterns: choosing lanterns fills the order.
    expect(mostOfFills(order, 2)).toBe(true);
    expect(mostOfFills({ ...order, wanted: [6, 4, 6] }, 2)).toBe(false);
  });

  it.each([1, 2, 3, 4])('keeps the level %i fallback board to its level’s row', (level) => {
    const order = fallback(level);
    const solution = fewest(order)!;
    expect(order.rates).toHaveLength(shape(level).workshops);
    expect(order.wanted).toHaveLength(shape(level).goods);
    expect(solution.mornings).toBe(level === 1 ? 2 : 3);
    expect(planCap(level, solution)).toBe(true);
    if (level > 1) expect(mostOfFills(order, solution.mornings)).toBe(false);
    if (level === 4) expect(eachGoodHasItsOwnBest(order)).toBe(false);
  });

  it.each([1, 2])('draws valid, varied, repeatable level %i boards within the attempt budget', (level) => {
    const distinct = new Set<string>();
    for (let seed = 1; seed <= 160; seed++) {
      const board = generate(level, new Rng(seed * 493 + 23));
      const { order, solution, draws } = board;
      distinct.add(JSON.stringify(order));
      expect(draws).toBeLessThanOrEqual(3000);
      const top = level === 1 ? 4 : 5;
      const [a, b] = order.rates;
      expect(a[0]).not.toBe(a[1]);
      expect(b[0]).not.toBe(b[1]);
      expect(a).not.toEqual(b);
      expect(order.rates.flat().every((n) => Number.isInteger(n) && n >= 1 && n <= top)).toBe(true);
      const lower = Math.min(...order.wanted);
      expect(lower).toBeGreaterThanOrEqual(4);
      expect(Math.max(...order.wanted)).toBeLessThanOrEqual(3 * lower);
      const edge = (a[0] - b[0]) * (a[1] - b[1]);
      if (level === 1) {
        expect(edge).toBeLessThan(0);
        expect([2, 3]).toContain(solution.mornings);
      } else {
        expect(edge).toBeGreaterThan(0);
        expect([3, 4]).toContain(solution.mornings);
        expect(solution.plans.length).toBeGreaterThanOrEqual(1);
        expect(solution.plans.length).toBeLessThanOrEqual(2);
        expect(mostOfFills(order, solution.mornings)).toBe(false);
      }
      expect(fewest(order)).toEqual(solution);
      expect(generate(level, new Rng(seed * 493 + 23))).toEqual(board);
    }
    expect(distinct.size).toBeGreaterThan(120);
  });

  it.each([
    { level: 3, seeds: 120, distinct: 100 },
    { level: 4, seeds: 60, distinct: 50 },
  ])(
    'draws valid, varied, repeatable level $level boards within the attempt budget',
    ({ level, seeds, distinct }) => {
      const boards = new Set<string>();
      const { workshops, goods } = shape(level);
      let split = 0;
      for (let seed = 1; seed <= seeds; seed++) {
        const board = generate(level, new Rng(seed * 811 + 5));
        const { order, solution, draws } = board;
        boards.add(JSON.stringify(order));
        expect(draws).toBeLessThan(3000);
        expect(order.rates).toHaveLength(workshops);
        expect(order.rates.every((r) => r.length === goods && r.some((n) => n !== r[0]))).toBe(true);
        expect(new Set(order.rates.map((r) => r.join('/'))).size).toBe(workshops);
        expect(order.rates.flat().every((n) => Number.isInteger(n) && n >= 1 && n <= 5)).toBe(true);
        const lower = Math.min(...order.wanted);
        expect(lower).toBeGreaterThanOrEqual(4);
        expect(Math.max(...order.wanted)).toBeLessThanOrEqual(3 * lower);
        expect([3, 4]).toContain(solution.mornings);
        const full = fullPlans(solution).length;
        expect(full).toBeGreaterThanOrEqual(1);
        expect(full).toBeLessThanOrEqual(level === 3 ? 4 : 6);
        expect(mostOfFills(order, solution.mornings)).toBe(false);
        if (level === 4) expect(eachGoodHasItsOwnBest(order)).toBe(false);
        if (fullPlans(solution).every((plan) => plan.some((row) => row.filter(Boolean).length > 1))) split++;
        expect(generate(level, new Rng(seed * 811 + 5))).toEqual(board);
      }
      expect(boards.size).toBeGreaterThan(distinct);
      // Most boards cannot be solved without a workshop splitting its mornings.
      expect(split).toBeGreaterThan(seeds / 2);
    },
  );

  it('names every good with a surplus and the true fewest mornings with three goods', () => {
    const order = fallback(4);
    const solution = fewest(order)!;
    const plan: Plan = [
      [0, 0, 2, 2],
      [0, 1, 1, 1],
      [1, 1, 2, 2],
    ];
    const result = send(order, solution, plan);
    const made = totals(order, planCounts(order, plan));
    expect(result).toEqual({
      kind: 'spare',
      mornings: 4,
      shortest: 3,
      surplus: made.map((n, i) => n - order.wanted[i]),
    });
    const working = sendWorking(result);
    expect(working).toMatch(/lanterns? .*extra|lanterns? extra/);
    expect(working).toMatch(/3 mornings are enough/);
    expect(working).not.toMatch(/square|row|Oar|Anchor|Bell/i);
    expect(send(order, solution, emptyPlan(3, 3))).toEqual({ kind: 'short', good: 0, missing: 11 });
  });

  it('gives the first short amount or the actual surplus and fewest mornings', () => {
    const solution = fewest(betterAtBoth)!;
    expect(send(betterAtBoth, solution, emptyPlan(2, 1))).toEqual({ kind: 'short', good: 0, missing: 8 });
    const full: Plan = [
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ];
    const result = send(betterAtBoth, solution, full);
    expect(result).toEqual({ kind: 'spare', mornings: 4, shortest: 3, surplus: [4, 5] });
    const working = sendWorking(result);
    expect(working).toMatch(/(?:4|four) crates/i);
    expect(working).toMatch(/(?:5|five) boats/i);
    expect(working).toMatch(/(?:3|three) mornings/i);
    expect(working).not.toMatch(/square|row|Oar|Anchor/i);
    expect(
      send(
        betterAtBoth,
        solution,
        full.map((row) => row.slice(0, 3)),
      ),
    ).toEqual({ kind: 'ready' });
  });

  it('counts only distinct filling plans sent with spare mornings', () => {
    const solution = fewest(betterAtBoth)!;
    const credit = new RoundCredit();
    const sendPlan = (plan: Plan) => credit.miss(plan, send(betterAtBoth, solution, plan));
    const original: Plan = [
      [0, 1, 1, 1],
      [0, 0, 0, 0],
    ];
    const rearranged: Plan = [
      [1, 1, 0, 1],
      [0, 0, 0, 0],
    ];
    const changed: Plan = [
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ];
    expect(planKey(original)).toBe(planKey(rearranged));
    expect(planKey(original)).not.toBe(planKey(changed));
    expect(planKey(original.map((row) => [...row, null]))).not.toBe(planKey(original));

    expect(sendPlan(emptyPlan(2, 4))).toBe(false);
    expect(sendPlan(original)).toBe(false);
    expect(sendPlan(rearranged)).toBe(false);
    expect(credit.score.misses).toBe(1);
    expect(sendPlan(changed)).toBe(true);
    expect(sendPlan(original)).toBe(false);
    expect(credit.score).toEqual({ misses: 2, hints: 0 });
  });

  it('never counts a miss on the fixed-morning level, even with an underfilled send', () => {
    const solution = fewest(twoSpecialists)!;
    const credit = new RoundCredit();
    const blank = emptyPlan(2, solution.mornings);
    const valid = solution.plans[0].map((row) => arrangement(row, solution.mornings));
    for (const plan of [blank, valid]) {
      expect(credit.miss(plan, send(twoSpecialists, solution, plan))).toBe(false);
    }
    expect(credit.score.misses).toBe(0);
  });

  it('counts showing help once on an unchanged plan and keeps the final Send prompt free', () => {
    const solution = fewest(betterAtBoth)!;
    const credit = new RoundCredit();
    const blank = emptyPlan(2, 1);
    const hint = nextHint(betterAtBoth, solution, blank);
    expect(hint).toEqual({ kind: 'add' });
    credit.help(blank, hint);
    credit.help(blank, hint);
    expect(credit.score.hints).toBe(1);
    const longer = emptyPlan(2, 2);
    credit.help(longer, nextHint(betterAtBoth, solution, longer));
    expect(credit.score.hints).toBe(2);
    const complete: Plan = [
      [1, 1, 1],
      [0, 0, 0],
    ];
    const sendHint = nextHint(betterAtBoth, solution, complete);
    expect(sendHint).toEqual({ kind: 'send' });
    credit.help(complete, sendHint);
    expect(credit.score.hints).toBe(2);
  });

  it('keeps a matching row with a closed door when the other row can fill the order', () => {
    const order: Order = { rates: twoSpecialists.rates, wanted: [4, 5] };
    const solution = fewest(order)!;
    const plan: Plan = [
      [1, null],
      [0, null],
    ];
    expect(nextHint(order, solution, plan)).toEqual({ kind: 'row', row: 1, counts: [1, 1] });
    plan[1][1] = 1;
    expect(send(order, solution, plan)).toEqual({ kind: 'ready' });
  });

  it.each([1, 2, 3, 4])('walks level %i help from arbitrary marks without setting any squares', (level) => {
    const rng = new Rng(4472);
    const { workshops, goods } = shape(level);
    const marks = [null, ...Array.from({ length: goods }, (_, good) => good)];
    for (let seed = 1; seed <= (level === 4 ? 36 : 72); seed++) {
      const { order, solution } = generate(level, new Rng(seed * 1301));
      const initialMornings = level === 1 ? solution.mornings : 1 + ((seed - 1) % 6);
      const plan: Plan = Array.from({ length: workshops }, () =>
        Array.from({ length: initialMornings }, () => rng.pick<Good | null>(marks)),
      );
      const moveBudget = workshops + Math.abs(initialMornings - solution.mornings);
      const helpedRows = new Set<number>();
      let moves = 0;
      for (; moves < moveBudget; moves++) {
        const before = plan.map((row) => [...row]);
        const hint = nextHint(order, solution, plan);
        expect(plan).toEqual(before);
        if (hint.kind === 'send') break;
        if (hint.kind === 'row') {
          expect(helpedRows.has(hint.row)).toBe(false);
          helpedRows.add(hint.row);
          const row = plan[hint.row];
          const slots = row
            .map((_, i) => i)
            .sort((a, b) => Number(row[a] === null) - Number(row[b] === null));
          const desired = arrangement(hint.counts, solution.mornings);
          // Keep occupied slots first. Any crate or boat can change, and a closed door can open.
          slots.forEach((slot, i) => {
            if (desired[i] === null) expect(row[slot]).toBeNull();
            row[slot] = desired[i];
          });
          expect(rowCounts(row, goods)).toEqual(hint.counts);
        }
        if (hint.kind === 'add') plan.forEach((row) => row.push(null));
        if (hint.kind === 'remove') plan.forEach((row) => row.pop());
      }
      expect(send(order, solution, plan)).toEqual({ kind: 'ready' });
      expect(nextHint(order, solution, plan)).toEqual({ kind: 'send' });
    }
  });
});
