import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  candidates, conflicts, countSolutions, deadEnds, formatGrid, geometry, gradeOf, hintFor, isSolved, makePuzzle, parseGrid, parsePuzzle, PLANS,
  placements, planFor, randomBed, remaining, solve, techniqueSolve, type Grid, type Hint, type Puzzle, type Size,
} from './logic';

/** A well-known 9 by 9 with one solution, for checks that should not depend on the generator. */
const NINE = ['53..7....', '6..195...', '.98....6.', '8...6...3', '4..8.3..1', '7...2...6', '.6....28.', '...419..5', '....8..79'];
const NINE_SOLVED = ['534678912', '672195348', '198342567', '859761423', '426853791', '713924856', '961537284', '287419635', '345286179'];

describe('sudoku geometry', () => {
  it('gives every square its row, column and box, with the right number of neighbours', () => {
    const six = geometry(6), nine = geometry(9);
    expect(six.houses).toHaveLength(18);
    expect(nine.houses).toHaveLength(27);
    for (const h of [...six.houses, ...nine.houses]) expect(new Set(h.cells).size).toBe(h.cells.length);
    for (const h of six.houses) expect(h.cells).toHaveLength(6);
    for (const h of nine.houses) expect(h.cells).toHaveLength(9);
    // 6 by 6 boxes are two rows by three columns: 5 in the row, 5 in the column, and 2 more in the box.
    for (const p of six.peers) expect(p).toHaveLength(12);
    for (const p of nine.peers) expect(p).toHaveLength(20);
    expect(six.boxOf.slice(0, 6)).toEqual([0, 0, 0, 1, 1, 1]);
    expect(six.boxOf.slice(6, 12)).toEqual([0, 0, 0, 1, 1, 1]);
    expect(six.boxOf.slice(12, 18)).toEqual([2, 2, 2, 3, 3, 3]);
  });
});

describe('sudoku rules', () => {
  it('knows what fits, what clashes and what is finished', () => {
    const g = parseGrid(NINE);
    expect(candidates(g, 9, 2)).toEqual([1, 2, 4]);
    expect(conflicts(g, 9)).toEqual([]);
    const bad = g.slice();
    bad[2] = 5; // another 5 in the top row
    expect(conflicts(bad, 9)).toEqual([0, 2]);
    expect(isSolved(parseGrid(NINE_SOLVED), 9)).toBe(true);
    expect(isSolved(g, 9)).toBe(false);
    const swapped = parseGrid(NINE_SOLVED);
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    expect(isSolved(swapped, 9)).toBe(false);
  });

  it('finds squares that have nothing left to hold', () => {
    expect(deadEnds(parseGrid(NINE), 9)).toEqual([]);
    // The top row holds 1 to 5, and a 6 sits below the last square: nothing fits at (0, 5), though no rule is broken.
    const stuck = Array<number>(36).fill(0);
    [1, 2, 3, 4, 5].forEach((d, c) => (stuck[c] = d));
    stuck[11] = 6;
    expect(conflicts(stuck, 6)).toEqual([]);
    expect(deadEnds(stuck, 6)).toEqual([5]);
    expect(countSolutions(stuck, 6)).toBe(0);
  });

  it('counts solutions: one for a real puzzle, many for an empty bed, none for a broken one', () => {
    expect(countSolutions(parseGrid(NINE), 9)).toBe(1);
    expect(solve(parseGrid(NINE), 9)).toEqual(parseGrid(NINE_SOLVED));
    expect(countSolutions(Array(36).fill(0), 6, 5)).toBe(5);
    const broken = parseGrid(NINE);
    broken[2] = 5;
    expect(countSolutions(broken, 9)).toBe(0);
    expect(solve(broken, 9)).toBeNull();
  });

  it('grows random full beds that obey the rules', () => {
    for (const size of [6, 9] as Size[]) for (let s = 1; s <= 8; s++) expect(isSolved(randomBed(size, new Rng(s)), size), `${size} seed ${s}`).toBe(true);
    expect(randomBed(9, new Rng(1))).not.toEqual(randomBed(9, new Rng(2)));
    expect(randomBed(9, new Rng(7))).toEqual(randomBed(9, new Rng(7)));
  });

  it('tells how much of each number is still to place', () => {
    const left = remaining(parseGrid(NINE), 9);
    expect(left).toHaveLength(9);
    expect(left[4]).toBe(9 - parseGrid(NINE).filter((d) => d === 5).length);
  });
});

/** Every step the technique solver takes is sound: placements match the solution, and nothing ruled out is in it. */
function expectSound(puzzle: Puzzle, label: string) {
  const work = techniqueSolve(puzzle.start, puzzle.size);
  expect(work.solved, label).toBe(true);
  expect(work.grid, label).toEqual(puzzle.solution);
  for (const s of work.steps) {
    if (s.cell >= 0) expect(s.digit, `${label} ${s.tech}`).toBe(puzzle.solution[s.cell]);
    for (const r of s.removed ?? []) expect(puzzle.solution[r.cell], `${label} ${s.tech} rules out ${r.digit}`).not.toBe(r.digit);
  }
}

describe('solving the way a person does', () => {
  it('solves the classic puzzle with lone numbers and only places', () => {
    const work = techniqueSolve(parseGrid(NINE), 9);
    expect(work.solved).toBe(true);
    expect(formatGrid(work.grid, 9)).toEqual(NINE_SOLVED);
    expect(work.tier).toBeLessThanOrEqual(2);
    expect(gradeOf(parseGrid(NINE), 9)).toBeGreaterThanOrEqual(1);
  });

  it('does not work on a grid that already breaks the rules', () => {
    const broken = parseGrid(NINE);
    broken[2] = 5;
    expect(techniqueSolve(broken, 9).solved).toBe(false);
  });

  it('stops at the first number placed when asked', () => {
    const work = techniqueSolve(parseGrid(NINE), 9, 3, true);
    expect(work.steps.filter((s) => s.cell >= 0)).toHaveLength(1);
    expect(work.grid.filter(Boolean).length).toBe(parseGrid(NINE).filter(Boolean).length + 1);
  });

  it('only places numbers that are in the solution, and only rules out numbers that are not', () => {
    for (const plan of PLANS) for (let s = 1; s <= 6; s++) expectSound(makePuzzle(plan, new Rng(s * 4099)), `${plan.name} seed ${s}`);
  });

  it('uses pairs or pointing lines on the hardest beds, and not on easy ones', () => {
    const hardest = PLANS[PLANS.length - 1];
    for (let s = 1; s <= 5; s++) {
      const p = makePuzzle(hardest, new Rng(s * 31));
      expect(p.grade).toBe(3);
      expect(techniqueSolve(p.start, 9, 2).solved).toBe(false);
      expect(techniqueSolve(p.start, 9, 3).steps.some((st) => st.tech === 'pair' || st.tech === 'locked')).toBe(true);
    }
    for (let s = 1; s <= 5; s++) {
      const p = makePuzzle(PLANS[0], new Rng(s * 31));
      expect(techniqueSolve(p.start, 6, 1).solved).toBe(true);
    }
  });

  it('places lone numbers and only places that are right', () => {
    const p = makePuzzle(PLANS[2], new Rng(11));
    const found = placements(p.start, p.size);
    expect(found.length).toBeGreaterThan(0);
    for (const f of found) expect(f.digit).toBe(p.solution[f.cell]);
  });
});

describe('sudoku beds', () => {
  it('makes every level of the ladder with exactly its blanks, one solution and the right grade', () => {
    PLANS.forEach((plan, i) => {
      expect(planFor(i + 1)).toBe(plan);
      for (let s = 1; s <= 8; s++) {
        const p = makePuzzle(plan, new Rng(s * 977 + i));
        const label = `${plan.name} seed ${s}`;
        expect(p.size, label).toBe(plan.size);
        expect(p.blanks, label).toBe(plan.blanks);
        expect(p.start.filter((d) => !d), label).toHaveLength(plan.blanks);
        expect(p.grade, label).toBe(plan.tier);
        expect(countSolutions(p.start, p.size), label).toBe(1);
        expect(isSolved(p.solution, p.size), label).toBe(true);
        p.start.forEach((d, c) => { if (d) expect(d, label).toBe(p.solution[c]); });
        expect(gradeOf(p.start, p.size), label).toBe(plan.tier);
      }
    });
  });

  it('is fair: the same seed gives the same bed, a different seed another', () => {
    const a = makePuzzle(PLANS[1], new Rng(5)), b = makePuzzle(PLANS[1], new Rng(5)), c = makePuzzle(PLANS[1], new Rng(6));
    expect(a).toEqual(b);
    expect(a.start).not.toEqual(c.start);
  });

  it('climbs: more blanks as the levels rise within a size, and 9 by 9 after 6 by 6', () => {
    expect(PLANS.map((p) => p.size)).toEqual([6, 6, 6, 9, 9, 9]);
    for (const size of [6, 9] as Size[]) {
      const blanks = PLANS.filter((p) => p.size === size).map((p) => p.blanks);
      expect([...blanks].sort((a, b) => a - b)).toEqual(blanks);
    }
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });

  it('reads a bed from its picture', () => {
    const p = parsePuzzle(NINE);
    expect(p.size).toBe(9);
    expect(p.blanks).toBe(51);
    expect(formatGrid(p.solution, 9)).toEqual(NINE_SOLVED);
    expect(() => parsePuzzle(['123', '231', '312'])).toThrow();
    // Two 1s in the first row: no way to finish it.
    expect(() => parsePuzzle(['1....1', '......', '......', '......', '......', '......'])).toThrow('solution');
  });
});

describe('sudoku hints', () => {
  const given = (p: Puzzle): Grid => p.start;

  /** A player who always follows the hint, taking back a number it says is wrong. Returns the hints used. */
  function followHints(p: Puzzle, wrong: { cell: number; digit: number }[] = []): Hint[] {
    const grid = p.start.slice();
    for (const w of wrong) grid[w.cell] = w.digit;
    const used: Hint[] = [];
    for (let guard = 0; guard < 200 && !isSolved(grid, p.size); guard++) {
      const h = hintFor(grid, given(p), p.solution, p.size);
      expect(h, 'a hint while the bed is unfinished').not.toBeNull();
      used.push(h!);
      if (h!.kind === 'fix') {
        expect(grid[h!.cell]).not.toBe(0);
        expect(given(p)[h!.cell]).toBe(0);
        expect(grid[h!.cell]).not.toBe(p.solution[h!.cell]);
        grid[h!.cell] = 0;
      } else {
        expect(grid[h!.cell]).toBe(0);
        expect(h!.digit).toBe(p.solution[h!.cell]);
        grid[h!.cell] = h!.digit;
      }
    }
    expect(isSolved(grid, p.size)).toBe(true);
    return used;
  }

  it('leads from an empty-handed start to the finished bed on every level', () => {
    PLANS.forEach((plan, i) => {
      const p = makePuzzle(plan, new Rng(i * 13 + 3));
      const used = followHints(p);
      expect(used.length, plan.name).toBe(plan.blanks);
      expect(used.every((h) => h.kind !== 'fix'), plan.name).toBe(true);
    });
  });

  it('names a reason for each number it points at', () => {
    const p = makePuzzle(PLANS[5], new Rng(9));
    const kinds = new Set(followHints(p).map((h) => h.kind));
    expect(kinds.has('lone') || kinds.has('place')).toBe(true);
    for (const k of kinds) expect(['lone', 'place', 'rules-out', 'few']).toContain(k);
  });

  it('points first at a number she placed that cannot be right, and prefers one that clashes', () => {
    const p = makePuzzle(PLANS[1], new Rng(21));
    const blanks = p.start.map((d, i) => (d ? -1 : i)).filter((i) => i >= 0);
    const cell = blanks[0];
    const bad = [1, 2, 3, 4, 5, 6].find((d) => d !== p.solution[cell])!;
    const h = hintFor(p.start.map((d, i) => (i === cell ? bad : d)), given(p), p.solution, 6);
    expect(h).toEqual({ kind: 'fix', cell });
    // A wrong number that also clashes is named before one that merely isn't in the solution.
    const clashDigit = p.start.find((d, i) => d && geometry(6).peers[blanks[1]].includes(i))!;
    const grid = p.start.slice();
    grid[blanks[0]] = [1, 2, 3, 4, 5, 6].find((d) => d !== p.solution[blanks[0]] && !geometry(6).peers[blanks[0]].some((q) => grid[q] === d)) ?? bad;
    grid[blanks[1]] = clashDigit;
    const both = hintFor(grid, given(p), p.solution, 6);
    expect(both?.kind).toBe('fix');
    expect(conflicts(grid, 6)).toContain((both as { cell: number }).cell);
  });

  it('recovers when a wrong number is in the bed, and ends with the bed solved', () => {
    const p = makePuzzle(PLANS[2], new Rng(4));
    const cell = p.start.findIndex((d) => !d);
    const digit = [1, 2, 3, 4, 5, 6].find((d) => d !== p.solution[cell])!;
    const used = followHints(p, [{ cell, digit }]);
    expect(used[0]).toEqual({ kind: 'fix', cell });
  });

  it('has nothing to say about a finished bed', () => {
    const p = makePuzzle(PLANS[0], new Rng(2));
    expect(hintFor(p.solution, given(p), p.solution, 6)).toBeNull();
  });
});
