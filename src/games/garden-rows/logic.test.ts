import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  candidates,
  clash,
  clashing,
  copyBed,
  countSolutions,
  deadEnds,
  emptyBed,
  FLOWER_NAMES,
  hintFor,
  isFull,
  isSolved,
  makeBeds,
  makePuzzle,
  boxSpots,
  fullBed,
  mendTarget,
  nextMove,
  nextPlanting,
  PLANS,
  planFor,
  rowsOf,
  sameBox,
  solve,
  type Bed,
} from './logic';

const givenOf = (start: Bed) => start.map((row) => row.map((v) => v !== null));
/** The beds she fills from empty spots; Mend the bed (level 7) starts full and is tested on its own. */
const FILL = PLANS.filter((p) => !p.mend);
const MEND = PLANS[6];
const ONE_ROW = PLANS[9];

describe('Garden Rows', () => {
  it('climbs from small beds to bigger ones with fewer flowers to start', () => {
    // The climb holds within each rule, in ID order; a new rule (hedge boxes) starts again on a smaller bed. One row (10) is
    // the preschool entry, placed before level 1 by preschool's order, so it is left out of the climb.
    for (const rule of ['rows', 'both', 'boxes'] as const) {
      const ofRule = FILL.filter((p) => p.rule === rule && p !== ONE_ROW);
      expect(ofRule.length, rule).toBeGreaterThan(0);
      ofRule.slice(1).forEach((p, i) => {
        const before = ofRule[i];
        expect(p.size, p.name).toBeGreaterThanOrEqual(before.size);
        if (p.size === before.size) expect(p.blanks, p.name).toBeGreaterThanOrEqual(before.blanks);
      });
    }
    expect(PLANS.slice(7, 9).map((p) => [p.rule, p.size, p.blanks, p.beds])).toEqual([
      ['boxes', 4, 6, 2],
      ['boxes', 4, 10, 1],
    ]);
    for (const p of PLANS) {
      expect(p.size, p.name).toBeLessThanOrEqual(FLOWER_NAMES.length);
      expect(p.blanks, p.name).toBeLessThan(p.size * p.size);
      if (p.mend) expect(p.blanks, p.name).toBe(0);
      expect(p.beds, p.name).toBeGreaterThanOrEqual(1);
    }
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS.at(-1));
  });

  it('every bed has exactly the planned empty spots and exactly one way to finish it', () => {
    for (const plan of FILL) {
      for (let seed = 1; seed <= 60; seed++) {
        const { start, solution } = makePuzzle(plan, new Rng(seed));
        expect(
          start.flat().filter((v) => v === null),
          `${plan.name} #${seed}`,
        ).toHaveLength(plan.blanks);
        expect(countSolutions(start, plan.rule), `${plan.name} #${seed}`).toBe(1);
        expect(isSolved(solution, plan.rule), `${plan.name} #${seed}`).toBe(true);
        start.forEach((row, r) =>
          row.forEach((v, c) => {
            if (v !== null) expect(v).toBe(solution[r][c]);
          }),
        );
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
    for (const plan of FILL.filter((p) => p.rule === 'both')) {
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
    for (const plan of FILL) {
      for (let seed = 1; seed <= 15; seed++) {
        const { start, solution } = makePuzzle(plan, new Rng(seed));
        const given = givenOf(start);
        const bed = copyBed(start);
        // Plant one wrong flower that fits, if there is one.
        let wrong: { r: number; c: number } | null = null;
        for (let r = 0; r < bed.length && !wrong; r++)
          for (let c = 0; c < plan.size && !wrong; c++)
            if (bed[r][c] === null) {
              const f = candidates(bed, plan.rule, r, c).find((x) => x !== solution[r][c]);
              if (f !== undefined) {
                bed[r][c] = f;
                wrong = { r, c };
              }
            }
        if (wrong)
          expect(hintFor(bed, given, solution, plan.rule)).toEqual({ kind: 'fix', r: wrong.r, c: wrong.c });
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

  it('plants a bed with no clash and no dead end at any step, to the one finished bed, so the demonstration never bounces', () => {
    for (const plan of FILL) {
      for (let seed = 1; seed <= 25; seed++) {
        const { start, solution } = makePuzzle(plan, new Rng(seed));
        const bed = copyBed(start);
        let selected = 0;
        let swaps = 0;
        let steps = 0;
        for (
          let step = nextPlanting(bed, solution, plan.rule, selected);
          step;
          step = nextPlanting(bed, solution, plan.rule, selected)
        ) {
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
    const solution: Bed = [
      [0, 1, 2],
      [1, 2, 0],
      [2, 0, 1],
    ];
    // A rows-only bed: row 1 is missing one flower (one choice), row 0 two (two choices each).
    const bed: Bed = [
      [null, null, 2],
      [1, null, 0],
      [2, 0, 1],
    ];
    for (const selected of [0, 1, 2])
      expect(nextPlanting(bed, solution, 'rows', selected)).toEqual({ r: 1, c: 1, flower: 2 });
    expect(nextPlanting(solution, solution, 'rows', 0)).toBeNull();
    // Two equally tight spots: the one that takes the flower already in hand goes first, else the first in reading order.
    const tie: Bed = [
      [null, null, 2],
      [1, 2, 0],
      [2, 0, 1],
    ];
    expect(nextPlanting(tie, solution, 'rows', 1)).toEqual({ r: 0, c: 1, flower: 1 });
    expect(nextPlanting(tie, solution, 'rows', 0)).toEqual({ r: 0, c: 0, flower: 0 });
    expect(nextPlanting(tie, solution, 'rows', 2)).toEqual({ r: 0, c: 0, flower: 0 });
  });

  it('each bed draws its own seeded set of flowers, in palette order', () => {
    for (const plan of PLANS) {
      const seen = new Set<number>();
      for (let seed = 1; seed <= 50; seed++) {
        const { kinds, start, solution } = makePuzzle(plan, new Rng(seed));
        expect(kinds, `${plan.name} #${seed}`).toHaveLength(plan.size);
        expect(new Set(kinds).size).toBe(plan.size);
        expect([...kinds].sort((a, b) => a - b)).toEqual(kinds);
        for (const k of kinds) expect(k >= 0 && k < FLOWER_NAMES.length).toBe(true);
        kinds.forEach((k) => seen.add(k));
        // The bed itself holds flowers 0 to size - 1, which the kinds name.
        for (const v of [...start.flat(), ...solution.flat()])
          if (v !== null) expect(v >= 0 && v < plan.size).toBe(true);
      }
      // Across 50 seeds every one of the five flowers turns up, even on a 3 by 3 bed.
      expect(seen.size, plan.name).toBe(FLOWER_NAMES.length);
    }
    expect(makePuzzle(PLANS[0], new Rng(9))).toEqual(makePuzzle(PLANS[0], new Rng(9)));
    const sets = new Set(
      Array.from({ length: 20 }, (_, i) => makePuzzle(PLANS[2], new Rng(i + 1)).kinds.join()),
    );
    expect(sets.size).toBeGreaterThan(1);
  });

  describe('Mend the bed (level 7)', () => {
    it('starts full, two flowers in one row swapped: two column repeats, and swapping them back mends it', () => {
      expect(planFor(7)).toBe(MEND);
      expect(MEND).toMatchObject({ size: 4, rule: 'both', blanks: 0, mend: true });
      for (let seed = 1; seed <= 300; seed++) {
        const { start, solution } = makePuzzle(MEND, new Rng(seed));
        expect(isFull(start)).toBe(true);
        expect(isSolved(solution, 'both')).toBe(true);
        const diff: { r: number; c: number }[] = [];
        start.forEach((row, r) =>
          row.forEach((v, c) => {
            if (v !== solution[r][c]) diff.push({ r, c });
          }),
        );
        expect(diff, `#${seed}`).toHaveLength(2);
        expect(diff[0].r).toBe(diff[1].r);
        // Rows still hold one of each; each of the two columns holds one repeat.
        for (const row of start) expect(new Set(row).size).toBe(4);
        const cols = [0, 1, 2, 3].filter((c) => new Set(start.map((row) => row[c])).size < 4);
        expect(cols.sort()).toEqual([diff[0].c, diff[1].c].sort());
        expect(clashing(start, 'both')).toHaveLength(4);
        expect(isSolved(start, 'both')).toBe(false);
        const mended = copyBed(start);
        const [a, b] = diff;
        [mended[a.r][a.c], mended[b.r][b.c]] = [mended[b.r][b.c], mended[a.r][a.c]];
        expect(mended).toEqual(solution);
        expect(deadEnds(start, 'both')).toEqual([]);
      }
    });

    it('accepts any bed with no repeat, not only the one before the swap', () => {
      const other: Bed = [
        [1, 0, 3, 2],
        [0, 1, 2, 3],
        [3, 2, 1, 0],
        [2, 3, 0, 1],
      ];
      expect(isSolved(other, 'both')).toBe(true);
      // Its hint target keeps a valid bed as it is.
      expect(mendTarget(other, 'both', makePuzzle(MEND, new Rng(1)).solution)).toEqual(other);
    });

    it('replanting a swapped flower where it was is a repeat, and lifting both leaves exactly one way back', () => {
      for (let seed = 1; seed <= 100; seed++) {
        const { start, solution } = makePuzzle(MEND, new Rng(seed));
        const [a, b] = clashing(start, 'both').filter(({ r, c }) => start[r][c] !== solution[r][c]);
        const bed = copyBed(start);
        const flower = bed[a.r][a.c]!;
        bed[a.r][a.c] = null;
        expect(clash(bed, 'both', a.r, a.c, flower)?.by).toBe('column');
        bed[b.r][b.c] = null;
        expect(countSolutions(bed, 'both')).toBe(1);
        expect(solve(bed, 'both')).toEqual(solution);
      }
    });

    it('hints and the ghost finger lead from any mixed-up bed she can reach to a mended one', () => {
      const given = [0, 1, 2, 3].map(() => [false, false, false, false]);
      for (let seed = 1; seed <= 60; seed++) {
        const puzzle = makePuzzle(MEND, new Rng(seed));
        const rng = new Rng(seed * 7);
        // A few of her own moves first: lift random flowers and replant any that fit.
        const bed = copyBed(puzzle.start);
        for (let i = 0; i < 6; i++) {
          const r = rng.int(0, 3);
          const c = rng.int(0, 3);
          if (bed[r][c] !== null) bed[r][c] = null;
          else {
            const fits = candidates(bed, 'both', r, c);
            if (fits.length) bed[r][c] = rng.pick(fits);
          }
        }
        // Follow the hints: lift the flower it names, or plant the spot and packet it shows.
        const byHint = copyBed(bed);
        for (let step = 0; step < 40 && !isSolved(byHint, 'both'); step++) {
          const h = hintFor(byHint, given, mendTarget(byHint, 'both', puzzle.solution), 'both');
          expect(h, `hint #${seed}`).not.toBeNull();
          if (h!.kind === 'fix') {
            expect(byHint[h!.r][h!.c]).not.toBeNull();
            byHint[h!.r][h!.c] = null;
          } else {
            expect(clash(byHint, 'both', h!.r, h!.c, h!.flower), `hint plants a repeat #${seed}`).toBeNull();
            byHint[h!.r][h!.c] = h!.flower;
          }
        }
        expect(isSolved(byHint, 'both'), `hint #${seed}`).toBe(true);
        // The ghost finger from the starting bed: lift, then plant, never a repeat, and the bed blooms.
        const byBot = copyBed(puzzle.start);
        let selected = 0;
        let moves = 0;
        for (
          let m = nextMove(byBot, given, mendTarget(byBot, 'both', puzzle.solution), 'both', selected);
          m && moves < 40;
          moves++
        ) {
          if (m.lift) byBot[m.r][m.c] = null;
          else {
            expect(clash(byBot, 'both', m.r, m.c, m.flower)).toBeNull();
            byBot[m.r][m.c] = m.flower;
            selected = m.flower;
          }
          m = nextMove(byBot, given, mendTarget(byBot, 'both', puzzle.solution), 'both', selected);
        }
        // When both repeats share their other row too, swapping that row's pair mends it as well: either bed is right.
        expect(isSolved(byBot, 'both'), `bot #${seed}`).toBe(true);
        expect(moves).toBe(4);
      }
    });
  });

  describe('Hedge boxes (levels 8 and 9)', () => {
    const BOXES = [planFor(8), planFor(9)];
    const validBoxes = (bed: Bed) => {
      const all = [0, 1, 2, 3];
      for (let i = 0; i < 4; i++) {
        expect([...bed[i]].sort()).toEqual(all);
        expect(bed.map((row) => row[i]).sort()).toEqual(all);
      }
      for (const [r, c] of [
        [0, 0],
        [0, 2],
        [2, 0],
        [2, 2],
      ])
        expect(
          boxSpots(4, r, c)
            .map((s) => bed[s.r][s.c])
            .sort(),
        ).toEqual(all);
    };

    it('levels 8 and 9 are the boxes rule on a 4 by 4 bed', () => {
      expect(BOXES.map((p) => p.rule)).toEqual(['boxes', 'boxes']);
      expect(BOXES.map((p) => p.size)).toEqual([4, 4]);
    });

    it('every bed is a valid 4 by 4 sudoku with exactly the planned blanks and exactly one way to finish', () => {
      for (const plan of BOXES) {
        for (let seed = 1; seed <= 80; seed++) {
          const { start, solution } = makePuzzle(plan, new Rng(seed));
          validBoxes(solution);
          expect(isSolved(solution, 'boxes'), `${plan.name} #${seed}`).toBe(true);
          expect(
            start.flat().filter((v) => v === null),
            `${plan.name} #${seed}`,
          ).toHaveLength(plan.blanks);
          expect(countSolutions(start, 'boxes'), `${plan.name} #${seed}`).toBe(1);
          expect(solve(start, 'boxes')).toEqual(solution);
          expect(deadEnds(start, 'boxes')).toEqual([]);
        }
      }
    });

    it('generation never throws over 300 seeds', () => {
      for (const plan of BOXES)
        for (let seed = 1; seed <= 300; seed++)
          expect(() => makePuzzle(plan, new Rng(seed)), `${plan.name} #${seed}`).not.toThrow();
    });

    it('fullBed makes box-valid squares and varies with the seed', () => {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 200; seed++) {
        const bed = fullBed(4, 'boxes', new Rng(seed));
        validBoxes(bed);
        seen.add(JSON.stringify(bed));
      }
      expect(seen.size).toBeGreaterThan(20);
      expect(fullBed(4, 'boxes', new Rng(4))).toEqual(fullBed(4, 'boxes', new Rng(4)));
    });

    it('knows the hedge boxes', () => {
      expect(sameBox(4, 0, 0, 1, 1)).toBe(true);
      expect(sameBox(4, 1, 1, 2, 2)).toBe(false);
      expect(sameBox(4, 2, 3, 3, 2)).toBe(true);
      expect(sameBox(4, 1, 1, 1, 2)).toBe(false);
      expect(boxSpots(4, 3, 1)).toEqual([
        { r: 2, c: 0 },
        { r: 2, c: 1 },
        { r: 3, c: 0 },
        { r: 3, c: 1 },
      ]);
      expect(boxSpots(4, 0, 3)).toContainEqual({ r: 0, c: 3 });
    });

    it('candidates and clash respect boxes, and the rows-and-columns rule ignores them', () => {
      const bed: Bed = [
        [1, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ];
      // (1, 1) shares only the box with (0, 0).
      expect(candidates(bed, 'boxes', 1, 1)).toEqual([0, 2, 3]);
      expect(candidates(bed, 'both', 1, 1)).toEqual([0, 1, 2, 3]);
      expect(clash(bed, 'boxes', 1, 1, 1)).toEqual({ by: 'box', r: 0, c: 0 });
      expect(clash(bed, 'both', 1, 1, 1)).toBeNull();
      // A row repeat still reports the row, and a column repeat the column.
      expect(clash(bed, 'boxes', 0, 1, 1)).toEqual({ by: 'row', r: 0, c: 0 });
      expect(clash(bed, 'boxes', 1, 0, 1)).toEqual({ by: 'column', r: 0, c: 0 });
      // Outside the box nothing clashes.
      expect(clash(bed, 'boxes', 1, 2, 1)).toBeNull();
      expect(clash(bed, 'boxes', 1, 1, 0)).toBeNull();
    });

    it('a hint and the ghost finger reach the solved bed with no clash or dead end at any step', () => {
      for (const plan of BOXES) {
        for (let seed = 1; seed <= 40; seed++) {
          const { start, solution } = makePuzzle(plan, new Rng(seed));
          const given = givenOf(start);
          const byHint = copyBed(start);
          for (
            let h = hintFor(byHint, given, solution, 'boxes');
            h;
            h = hintFor(byHint, given, solution, 'boxes')
          ) {
            expect(h.kind, `${plan.name} #${seed}`).toBe('plant');
            if (h.kind !== 'plant') break;
            expect(clash(byHint, 'boxes', h.r, h.c, h.flower)).toBeNull();
            byHint[h.r][h.c] = h.flower;
            expect(deadEnds(byHint, 'boxes')).toEqual([]);
          }
          expect(byHint).toEqual(solution);
          const byBot = copyBed(start);
          let selected = 0;
          let steps = 0;
          for (
            let m = nextPlanting(byBot, solution, 'boxes', selected);
            m;
            m = nextPlanting(byBot, solution, 'boxes', selected)
          ) {
            expect(clash(byBot, 'boxes', m.r, m.c, m.flower), `${plan.name} #${seed}`).toBeNull();
            byBot[m.r][m.c] = m.flower;
            selected = m.flower;
            steps++;
            expect(deadEnds(byBot, 'boxes')).toEqual([]);
          }
          expect(steps).toBe(plan.blanks);
          expect(byBot).toEqual(solution);
        }
      }
    });
  });

  describe('One row (level 10, the preschool entry)', () => {
    it('is one row of three spots with one empty, three beds in a round', () => {
      expect([ONE_ROW.size, rowsOf(ONE_ROW), ONE_ROW.rule, ONE_ROW.blanks, ONE_ROW.beds]).toEqual([
        3,
        1,
        'rows',
        1,
        3,
      ]);
      for (let seed = 1; seed <= 60; seed++)
        for (const { start, solution } of makeBeds(ONE_ROW, new Rng(seed))) {
          expect(start).toHaveLength(1);
          expect(start[0]).toHaveLength(3);
          expect(start[0].filter((v) => v === null)).toHaveLength(1);
          expect([...solution[0]].sort()).toEqual([0, 1, 2]);
          const gap = start[0].indexOf(null);
          // Exactly one flower fits the empty spot, and it is the missing one.
          expect(candidates(start, 'rows', 0, gap)).toEqual([solution[0][gap]]);
          expect(countSolutions(start, 'rows')).toBe(1);
        }
    });

    it('moves the empty spot: each of the three beds has a different spot empty', () => {
      for (let seed = 1; seed <= 60; seed++) {
        const gaps = makeBeds(ONE_ROW, new Rng(seed)).map(({ start }) => start[0].indexOf(null));
        expect([...gaps].sort()).toEqual([0, 1, 2]);
      }
      expect(makeBeds(ONE_ROW, new Rng(4))).toEqual(makeBeds(ONE_ROW, new Rng(4)));
    });

    it('names a repeat anywhere in the row, the last spot included, and never a column', () => {
      const bed: Bed = [[0, null, 2]];
      expect(clash(bed, 'rows', 0, 1, 2)).toEqual({ by: 'row', r: 0, c: 2 });
      expect(clash(bed, 'rows', 0, 1, 0)).toEqual({ by: 'row', r: 0, c: 0 });
      expect(clash(bed, 'rows', 0, 1, 1)).toBeNull();
      expect(candidates([[null, 1, 2]], 'rows', 0, 0)).toEqual([0]);
      expect(candidates([[0, 1, null]], 'rows', 0, 2)).toEqual([2]);
      expect(isSolved([[2, 0, 1]], 'rows')).toBe(true);
      expect(isSolved([[2, 2, 1]], 'rows')).toBe(false);
    });

    it('the hint and the ghost finger lead to the missing flower in the empty spot', () => {
      for (let seed = 1; seed <= 30; seed++)
        for (const { start, solution } of makeBeds(ONE_ROW, new Rng(seed))) {
          const gap = start[0].indexOf(null);
          expect(hintFor(start, givenOf(start), solution, 'rows')).toEqual({
            kind: 'plant',
            r: 0,
            c: gap,
            flower: solution[0][gap],
          });
          expect(nextMove(start, givenOf(start), solution, 'rows', 0)).toEqual({
            lift: false,
            r: 0,
            c: gap,
            flower: solution[0][gap],
          });
        }
    });
  });
});
