import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  candidates, clash, copyBed, countSolutions, deadEnds, emptyBed, FLOWER_NAMES, hintFor, isFull, isSolved, makeBeds, makePuzzle,
  nextPlanting, PLANS, planFor, solve, type Bed,
} from './logic';

const givenOf = (start: Bed) => start.map((row) => row.map((v) => v !== null));

describe('Garden Rows', () => {
  it('climbs from small beds to bigger ones with fewer flowers to start', () => {
    PLANS.slice(1).forEach((p, i) => {
      const before = PLANS[i];
      expect(p.size, p.name).toBeGreaterThanOrEqual(before.size);
      if (p.size === before.size) expect(p.blanks, p.name).toBeGreaterThanOrEqual(before.blanks);
    });
    for (const p of PLANS) {
      expect(p.size, p.name).toBeLessThanOrEqual(FLOWER_NAMES.length);
      expect(p.blanks, p.name).toBeLessThan(p.size * p.size);
      expect(p.beds, p.name).toBeGreaterThanOrEqual(1);
    }
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS.at(-1));
  });

  it('every bed has exactly the planned empty spots and exactly one way to finish it', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const { start, solution } = makePuzzle(plan, new Rng(seed));
        expect(start.flat().filter((v) => v === null), `${plan.name} #${seed}`).toHaveLength(plan.blanks);
        expect(countSolutions(start, plan.rule), `${plan.name} #${seed}`).toBe(1);
        expect(isSolved(solution, plan.rule), `${plan.name} #${seed}`).toBe(true);
        start.forEach((row, r) => row.forEach((v, c) => { if (v !== null) expect(v).toBe(solution[r][c]); }));
        expect(solve(start, plan.rule)).toEqual(solution);
      }
    }
  });

  it('a rows-only bed leaves one empty spot in each row, and a full bed has every flower once in each row', () => {
    const plan = PLANS[0];
    for (let seed = 1; seed <= 30; seed++) {
      const { start, solution } = makePuzzle(plan, new Rng(seed));
      for (const row of start) expect(row.filter((v) => v === null)).toHaveLength(1);
      for (const row of solution) expect([...row].sort()).toEqual([0, 1, 2]);
    }
  });

  it('rows-and-columns beds are Latin squares: each flower once in every row and every column', () => {
    for (const plan of PLANS.filter((p) => p.rule === 'both')) {
      const { solution } = makePuzzle(plan, new Rng(7));
      const all = Array.from({ length: plan.size }, (_, i) => i);
      for (let i = 0; i < plan.size; i++) {
        expect([...solution[i]].sort(), plan.name).toEqual(all);
        expect(solution.map((row) => row[i]).sort(), plan.name).toEqual(all);
      }
    }
  });

  it('makes the same beds from the same seed and different beds from another', () => {
    const plan = PLANS[3];
    expect(makeBeds(plan, new Rng(5))).toEqual(makeBeds(plan, new Rng(5)));
    expect(makeBeds(plan, new Rng(5))).not.toEqual(makeBeds(plan, new Rng(6)));
    expect(makeBeds(plan, new Rng(5))).toHaveLength(plan.beds);
  });

  it('knows which flowers fit a spot and which one is in the way', () => {
    const bed: Bed = [
      [0, null, null],
      [null, null, 1],
      [null, null, null],
    ];
    expect(candidates(bed, 'rows', 0, 1)).toEqual([1, 2]);
    expect(candidates(bed, 'both', 1, 0)).toEqual([2]);
    expect(candidates(bed, 'both', 1, 1)).toEqual([0, 2]);
    expect(clash(bed, 'both', 0, 2, 0)).toEqual({ by: 'row', r: 0, c: 0 });
    expect(clash(bed, 'both', 2, 2, 1)).toEqual({ by: 'column', r: 1, c: 2 });
    // Rows only ignores the column.
    expect(clash(bed, 'rows', 2, 2, 1)).toBeNull();
    expect(clash(bed, 'both', 0, 1, 2)).toBeNull();
  });

  it('a flower that fits but does not belong leads to a bed with no way to finish, which shows as a dead end', () => {
    for (const plan of PLANS.filter((p) => p.rule === 'both')) {
      let sawDeadEnd = false;
      for (let seed = 1; seed <= 25; seed++) {
        const { start, solution } = makePuzzle(plan, new Rng(seed));
        for (let r = 0; r < plan.size; r++)
          for (let c = 0; c < plan.size; c++) {
            if (start[r][c] !== null) continue;
            for (const f of candidates(start, plan.rule, r, c)) {
              if (f === solution[r][c]) continue;
              const bed = copyBed(start);
              bed[r][c] = f;
              expect(countSolutions(bed, plan.rule), `${plan.name} #${seed}`).toBe(0);
              if (deadEnds(bed, plan.rule).length > 0) sawDeadEnd = true;
            }
          }
      }
      expect(sawDeadEnd, plan.name).toBe(true);
    }
  });

  it('a hint points at something useful: a wrong flower first, then a spot to plant the right one', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 15; seed++) {
        const { start, solution } = makePuzzle(plan, new Rng(seed));
        const given = givenOf(start);
        const bed = copyBed(start);
        // Plant one wrong flower that fits, if there is one.
        let wrong: { r: number; c: number } | null = null;
        for (let r = 0; r < plan.size && !wrong; r++)
          for (let c = 0; c < plan.size && !wrong; c++)
            if (bed[r][c] === null) {
              const f = candidates(bed, plan.rule, r, c).find((x) => x !== solution[r][c]);
              if (f !== undefined) { bed[r][c] = f; wrong = { r, c }; }
            }
        if (wrong) expect(hintFor(bed, given, solution, plan.rule)).toEqual({ kind: 'fix', r: wrong.r, c: wrong.c });
        // Following hints from a clean bed always finishes it.
        const play = copyBed(start);
        for (let step = 0; step < plan.size * plan.size && !isFull(play); step++) {
          const h = hintFor(play, given, solution, plan.rule);
          expect(h?.kind, `${plan.name} #${seed}`).toBe('plant');
          if (h?.kind === 'plant') {
            expect(play[h.r][h.c]).toBeNull();
            play[h.r][h.c] = h.flower;
          }
        }
        expect(isSolved(play, plan.rule)).toBe(true);
        expect(hintFor(play, given, solution, plan.rule)).toBeNull();
      }
    }
  });

  it('every empty spot of a new bed has a flower that fits, and an empty bed is not solved', () => {
    for (const plan of PLANS) {
      const { start } = makePuzzle(plan, new Rng(3));
      expect(deadEnds(start, plan.rule)).toEqual([]);
      expect(isSolved(start, plan.rule)).toBe(false);
    }
    expect(isSolved(emptyBed(3), 'rows')).toBe(false);
  });

  it("plants a bed with no clash and no dead end at any step, to the one finished bed, so the demonstration never bounces", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 25; seed++) {
        const { start, solution } = makePuzzle(plan, new Rng(seed));
        const bed = copyBed(start);
        let selected = 0;
        let swaps = 0;
        let steps = 0;
        for (let step = nextPlanting(bed, solution, plan.rule, selected); step; step = nextPlanting(bed, solution, plan.rule, selected)) {
          expect(bed[step.r][step.c]).toBeNull();
          expect(clash(bed, plan.rule, step.r, step.c, step.flower), `${plan.name} seed ${seed}`).toBeNull();
          if (step.flower !== selected) swaps++;
          selected = step.flower;
          bed[step.r][step.c] = step.flower;
          steps++;
          expect(deadEnds(bed, plan.rule)).toEqual([]);
        }
        expect(steps).toBe(plan.blanks);
        expect(swaps).toBeLessThanOrEqual(steps);
        expect(isSolved(bed, plan.rule)).toBe(true);
        expect(bed).toEqual(solution);
      }
    }
  });

  it('plants the spot with the fewest choices first, and keeps the packet in hand when two spots are as tight', () => {
    const solution: Bed = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
    // A rows-only bed: row 1 is missing one flower (one choice), row 0 two (two choices each).
    const bed: Bed = [[null, null, 2], [1, null, 0], [2, 0, 1]];
    for (const selected of [0, 1, 2]) expect(nextPlanting(bed, solution, 'rows', selected)).toEqual({ r: 1, c: 1, flower: 2 });
    expect(nextPlanting(solution, solution, 'rows', 0)).toBeNull();
    // Two equally tight spots: the one that takes the flower already in hand goes first, else the first in reading order.
    const tie: Bed = [[null, null, 2], [1, 2, 0], [2, 0, 1]];
    expect(nextPlanting(tie, solution, 'rows', 1)).toEqual({ r: 0, c: 1, flower: 1 });
    expect(nextPlanting(tie, solution, 'rows', 0)).toEqual({ r: 0, c: 0, flower: 0 });
    expect(nextPlanting(tie, solution, 'rows', 2)).toEqual({ r: 0, c: 0, flower: 0 });
  });
});
