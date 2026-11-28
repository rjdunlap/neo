import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  LEVELS,
  PUZZLES,
  cloneBoard,
  countJourneys,
  describeLevel,
  emptyBoard,
  firstConflict,
  follow,
  hint,
  isComplete,
  jobById,
  makeRound,
  place,
  placedIds,
  puzzleFor,
  referencePlan,
  remove,
  rowOf,
  solve,
  type Board,
  type Puzzle,
} from './logic';

/** A board from `[bench, cart]` per step, ids or null. */
const boardOf = (p: Puzzle, steps: [string | null, string | null][]): Board => {
  const b = emptyBoard(p);
  steps.forEach(([bench, cart], t) => {
    b.bench[t] = bench;
    b.cart[t] = cart;
  });
  return b;
};

const histogram = (p: Puzzle) => {
  const h: Record<number, number> = {};
  for (const b of solve(p)) h[countJourneys(p, b)] = (h[countJourneys(p, b)] ?? 0) + 1;
  return h;
};

describe('Village Planner ladder', () => {
  it('lists school 1-2 and grownup 1-3, each with a description', () => {
    expect(LEVELS).toEqual({ school: { min: 1, max: 2 }, grownup: { min: 1, max: 3 } });
    for (let l = 1; l <= 3; l++) expect(describeLevel(l)).toContain(puzzleFor(l).name);
  });

  it.each(PUZZLES.map((p) => [p.level, p] as const))(
    'level %i is an acyclic graph over known jobs',
    (_, p) => {
      const ids = new Set(p.jobs.map((j) => j.id));
      expect(ids.size).toBe(p.jobs.length);
      for (const j of p.jobs) for (const r of j.requires) expect(ids.has(r)).toBe(true);
      // Acyclic: repeatedly peel jobs whose prerequisites are gone.
      const left = new Map(p.jobs.map((j) => [j.id, new Set(j.requires)]));
      while (left.size) {
        const free = [...left].filter(([, r]) => r.size === 0).map(([id]) => id);
        expect(free.length).toBeGreaterThan(0);
        free.forEach((id) => left.delete(id));
        left.forEach((r) => free.forEach((id) => r.delete(id)));
      }
    },
  );
});

describe('exhaustive plan counts match the definition', () => {
  it('level 1: 12 plans, all 2 trips, shortest 3 steps', () => {
    const p = puzzleFor(1);
    expect(solve(p)).toHaveLength(12);
    expect(histogram(p)).toEqual({ 2: 12 });
  });
  it('level 2: 50 plans, 36 at 2 trips and 14 at 3', () => {
    const p = puzzleFor(2);
    expect(solve(p)).toHaveLength(50);
    expect(histogram(p)).toEqual({ 2: 36, 3: 14 });
  });
  it('level 3: 32 plans, 3 at 2 trips, 15 at 3 and 14 at 4', () => {
    const p = puzzleFor(3);
    expect(solve(p)).toHaveLength(32);
    expect(histogram(p)).toEqual({ 2: 3, 3: 15, 4: 14 });
  });
  it.each(PUZZLES.map((p) => [p.level, p] as const))(
    'level %i: minTrips is the best plan and plans sort best first',
    (_, p) => {
      const plans = solve(p);
      expect(countJourneys(p, plans[0])).toBe(p.minTrips);
      const trips = plans.map((b) => countJourneys(p, b));
      expect(trips).toEqual([...trips].sort((a, b) => a - b));
      for (const b of plans) {
        expect(isComplete(p, b)).toBe(true);
        expect(firstConflict(p, b)).toBeNull();
      }
    },
  );
});

describe('Cart trips', () => {
  const p = puzzleFor(2);
  it('counts Yard to Mill to Mill as one trip, ignoring empty Cart steps', () => {
    const b = boardOf(p, [
      [null, 'grind'],
      ['mix', null],
      [null, null],
    ]);
    expect(countJourneys(p, b)).toBe(1);
    expect(countJourneys(p, emptyBoard(p))).toBe(0);
  });
  it('counts Hill, Mill, Hill as three trips', () => {
    const b = boardOf(p, [
      [null, 'cut'],
      ['wheel', 'grind'],
      ['mix', null],
      [null, 'loaf'],
    ]);
    expect(countJourneys(p, b)).toBe(3);
  });
  it('the verified reference plans hold', () => {
    const two = boardOf(p, [
      [null, 'grind'],
      ['mix', 'cut'],
      ['wheel', 'loaf'],
    ]);
    expect(firstConflict(p, two)).toBeNull();
    expect(countJourneys(p, two)).toBe(2);
    const l1 = puzzleFor(1);
    const one = boardOf(l1, [
      ['crates', 'mill'],
      ['dough', null],
      [null, 'bake'],
    ]);
    expect(firstConflict(l1, one)).toBeNull();
    expect(countJourneys(l1, one)).toBe(2);
    const l3 = puzzleFor(3);
    const three = boardOf(l3, [
      [null, 'grain'],
      ['flour', 'oil'],
      [null, 'wood'],
      ['frame', null],
      [null, 'oven'],
    ]);
    expect(firstConflict(l3, three)).toBeNull();
    expect(countJourneys(l3, three)).toBe(2);
  });
});

describe('placing and prerequisites', () => {
  const p = puzzleFor(1);
  it('only places a job in its own row and an empty slot', () => {
    const b = place(p, emptyBoard(p), 'dough', 1)!;
    expect(b.bench[1]).toBe('dough');
    expect(place(p, b, 'crates', 1)).toBeNull();
    expect(place(p, b, 'crates', 9)).toBeNull();
    expect(rowOf(jobById(p, 'bake'))).toBe('cart');
    expect(place(p, b, 'bake', 2)!.cart[2]).toBe('bake');
  });
  it('moving a job frees its old slot', () => {
    const a = place(p, emptyBoard(p), 'dough', 1)!;
    const b = place(p, a, 'dough', 2)!;
    expect(b.bench[1]).toBeNull();
    expect(b.bench[2]).toBe('dough');
    expect(placedIds(remove(b, 'dough'))).toEqual([]);
  });
  it('names the earliest step whose job ran before its prerequisite', () => {
    // dough in step 1 but its grain is only fetched in step 2 (the same step is too late too).
    const b = boardOf(p, [
      ['crates', null],
      ['dough', 'mill'],
      [null, 'bake'],
    ]);
    expect(firstConflict(p, b)).toEqual({ job: 'dough', needs: 'mill', step: 1 });
    const same = boardOf(p, [
      [null, 'mill'],
      ['dough', null],
      ['crates', 'bake'],
    ]);
    expect(firstConflict(p, same)).toBeNull();
    const early = boardOf(p, [
      ['dough', 'bake'],
      [null, 'mill'],
      ['crates', null],
    ]);
    expect(firstConflict(p, early)).toMatchObject({ step: 0 });
  });
});

describe('seeded variety', () => {
  it('shuffles the tray without changing the graph or plan counts', () => {
    const orders = new Set<string>();
    for (let s = 1; s <= 12; s++) {
      const r = makeRound(3, new Rng(s));
      expect([...r.tray].sort()).toEqual(r.puzzle.jobs.map((j) => j.id).sort());
      expect(solve(r.puzzle)).toHaveLength(32);
      orders.add(r.tray.join());
    }
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('hints lead to a working plan', () => {
  const sample = (p: Puzzle): Board[] => {
    const plans = solve(p);
    const boards: Board[] = [emptyBoard(p)];
    for (const plan of plans.filter((_, i) => i % 5 === 0)) {
      // The first two jobs where a working plan puts them.
      const some = cloneBoard(emptyBoard(p));
      for (const j of p.jobs.slice(0, 2)) {
        const t = plan.bench.indexOf(j.id) >= 0 ? plan.bench.indexOf(j.id) : plan.cart.indexOf(j.id);
        (rowOf(j) === 'bench' ? some.bench : some.cart)[t] = j.id;
      }
      boards.push(some);
    }
    // Every job at step 0 where its row allows, which is usually jammed.
    const jam = emptyBoard(p);
    for (const j of p.jobs) {
      for (let t = 0; t < p.maxSteps; t++) {
        const next = place(p, jam, j.id, t);
        if (next) {
          jam.bench = next.bench;
          jam.cart = next.cart;
          break;
        }
      }
    }
    boards.push(jam);
    return boards;
  };

  it.each(PUZZLES.map((p) => [p.level, p] as const))(
    'level %i: following hints from sampled boards reaches a plan that runs',
    (_, p) => {
      for (const start of sample(p)) {
        let b = start;
        let steps = 0;
        let h = hint(p, b);
        while (h.kind !== 'run') {
          const before = b;
          b = follow(p, b, h);
          expect(b).not.toBe(before);
          steps++;
          expect(steps).toBeLessThanOrEqual(2 * p.jobs.length + 1);
          h = hint(p, b);
        }
        expect(isComplete(p, b)).toBe(true);
        expect(firstConflict(p, b)).toBeNull();
      }
    },
  );

  it('never suggests an illegal slot', () => {
    for (const p of PUZZLES) {
      for (const start of sample(p)) {
        const h = hint(p, start);
        if (h.kind === 'put') expect(place(p, start, h.job, h.step)).not.toBeNull();
      }
    }
  });

  it('sends a blocking job back when the placed jobs have no completion', () => {
    const p = puzzleFor(1);
    // bake first in the last step is fine, but dough in step 0 can never follow its grain.
    const stuck = boardOf(p, [['dough', null]]);
    expect(solve(p, stuck)).toEqual([]);
    const h = hint(p, stuck);
    expect(h).toEqual({ kind: 'back', job: 'dough', needs: 'mill' });
  });

  it('says the plan works when a complete board is feasible', () => {
    const p = puzzleFor(1);
    expect(hint(p, referencePlan(p))).toEqual({ kind: 'run' });
  });
});
