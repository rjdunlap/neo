import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { gameById } from '../registry';
import {
  cageGeometry,
  cageSets,
  partitionCages,
  singleSetCages,
  wrongSums,
  candidateMask,
  candidates,
  conflicts,
  digitsOf,
  fillMarks,
  fillMarksRow,
  offersFillMarks,
  countSolutions,
  deadEnds,
  formatGrid,
  geometry,
  gradeOf,
  hintFor,
  isSolved,
  makePuzzle,
  parseGrid,
  parsePuzzle,
  PLANS,
  placements,
  planFor,
  patchGeometry,
  patchTints,
  PATCH_LAYOUTS,
  randomBed,
  shapeOf,
  houseName,
  remaining,
  shortBed,
  solve,
  techniqueSolve,
  WING_BEDS,
  type Grid,
  type Hint,
  type Puzzle,
  type Size,
} from './logic';

/** A well-known 9 by 9 with one solution, for checks that should not depend on the generator. */
const NINE = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
];
const NINE_SOLVED = [
  '534678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
];

describe('sudoku geometry', () => {
  it('gives every square its row, column and box, with the right number of neighbours', () => {
    const six = geometry(6),
      nine = geometry(9);
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

  it('makes a 4 by 4 bed of 2 by 2 boxes: 12 houses of 4, 7 neighbours each', () => {
    const four = geometry(4);
    expect([four.br, four.bc]).toEqual([2, 2]);
    expect(four.houses).toHaveLength(12);
    for (const h of four.houses) expect(h.cells).toHaveLength(4);
    for (const h of four.houses.filter((x) => x.kind === 'box'))
      expect(new Set(h.cells.map((c) => four.boxOf[c])).size).toBe(1);
    // 3 in the row, 3 in the column, and 1 more in the box.
    for (const p of four.peers) expect(p).toHaveLength(7);
    expect(four.boxOf).toEqual([0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 3, 3]);
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
    for (const size of [6, 9] as Size[])
      for (let s = 1; s <= 8; s++)
        expect(isSolved(randomBed(size, new Rng(s)), size), `${size} seed ${s}`).toBe(true);
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
  const work = techniqueSolve(puzzle.start, shapeOf(puzzle));
  expect(work.solved, label).toBe(true);
  expect(work.grid, label).toEqual(puzzle.solution);
  for (const s of work.steps) {
    if (s.cell >= 0) expect(s.digit, `${label} ${s.tech}`).toBe(puzzle.solution[s.cell]);
    for (const r of s.removed ?? [])
      expect(puzzle.solution[r.cell], `${label} ${s.tech} rules out ${r.digit}`).not.toBe(r.digit);
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
    for (const plan of PLANS)
      for (let s = 1; s <= 6; s++) expectSound(makePuzzle(plan, new Rng(s * 4099)), `${plan.name} seed ${s}`);
  });

  it('uses pairs or pointing lines on the hardest beds, and not on easy ones', () => {
    const hardest = planFor(6);
    for (let s = 1; s <= 5; s++) {
      const p = makePuzzle(hardest, new Rng(s * 31));
      expect(p.grade).toBe(3);
      expect(techniqueSolve(p.start, 9, 2).solved).toBe(false);
      expect(
        techniqueSolve(p.start, 9, 3).steps.some((st) => st.tech === 'pair' || st.tech === 'locked'),
      ).toBe(true);
    }
    for (let s = 1; s <= 5; s++) {
      const p = makePuzzle(PLANS[0], new Rng(s * 31));
      expect(techniqueSolve(p.start, 6, 1).solved).toBe(true);
    }
  });

  it('places lone numbers and only places that are right', () => {
    const p = makePuzzle(PLANS[2], new Rng(11));
    const found = placements(p.start, shapeOf(p));
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
        expect(
          p.start.filter((d) => !d),
          label,
        ).toHaveLength(plan.blanks);
        expect(p.grade, label).toBe(plan.tier);
        expect(countSolutions(p.start, shapeOf(p)), label).toBe(1);
        expect(isSolved(p.solution, shapeOf(p)), label).toBe(true);
        p.start.forEach((d, c) => {
          if (d) expect(d, label).toBe(p.solution[c]);
        });
        expect(gradeOf(p.start, shapeOf(p)), label).toBe(plan.tier);
      }
    });
  });

  it('shows a short bed for the demonstration: a few blanks left, the same one answer', () => {
    for (const plan of PLANS) {
      const p = makePuzzle(plan, new Rng(31)),
        s = shortBed(p, 10);
      expect(
        s.start.filter((d) => !d),
        plan.name,
      ).toHaveLength(Math.min(10, plan.blanks));
      expect(s.blanks, plan.name).toBe(Math.min(10, plan.blanks));
      expect(s.solution, plan.name).toEqual(p.solution);
      p.start.forEach((d, c) => {
        if (d) expect(s.start[c], plan.name).toBe(d);
      });
      s.start.forEach((d, c) => {
        if (d) expect(d, plan.name).toBe(p.solution[c]);
      });
      expect(countSolutions(s.start, shapeOf(s)), plan.name).toBe(1);
    }
  });

  it('is fair: the same seed gives the same bed, a different seed another', () => {
    const a = makePuzzle(PLANS[1], new Rng(5)),
      b = makePuzzle(PLANS[1], new Rng(5)),
      c = makePuzzle(PLANS[1], new Rng(6));
    expect(a).toEqual(b);
    expect(a.start).not.toEqual(c.start);
  });

  it('climbs: more blanks as the levels rise within a size, and 9 by 9 after 6 by 6, with the 4 by 4 entry and the crossing-rows top appended', () => {
    expect(PLANS.map((p) => p.size)).toEqual([6, 6, 6, 9, 9, 9, 4, 9, 6, 6]);
    for (const size of [4, 6, 9] as Size[]) {
      const blanks = PLANS.filter((p) => p.size === size && !p.patchwork && !p.cages).map((p) => p.blanks);
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
    expect(() => parsePuzzle(['1....1', '......', '......', '......', '......', '......'])).toThrow(
      'solution',
    );
  });
});

describe('sudoku hints', () => {
  const given = (p: Puzzle): Grid => p.start;

  /** A player who always follows the hint, taking back a number it says is wrong. Returns the hints used. */
  function followHints(p: Puzzle, wrong: { cell: number; digit: number }[] = []): Hint[] {
    const grid = p.start.slice();
    for (const w of wrong) grid[w.cell] = w.digit;
    const used: Hint[] = [];
    for (let guard = 0; guard < 200 && !isSolved(grid, shapeOf(p)); guard++) {
      const h = hintFor(grid, given(p), p.solution, shapeOf(p));
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
    expect(isSolved(grid, shapeOf(p))).toBe(true);
    return used;
  }

  it('leads from an empty-handed start to the finished bed on every level', () => {
    PLANS.forEach((plan, i) => {
      const p = makePuzzle(plan, new Rng(i * 13 + 3));
      const used = followHints(p);
      expect(used.length, plan.name).toBe(plan.blanks);
      expect(
        used.every((h) => h.kind !== 'fix'),
        plan.name,
      ).toBe(true);
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
    const h = hintFor(
      p.start.map((d, i) => (i === cell ? bad : d)),
      given(p),
      p.solution,
      6,
    );
    expect(h).toEqual({ kind: 'fix', cell });
    // A wrong number that also clashes is named before one that merely isn't in the solution.
    const clashDigit = p.start.find((d, i) => d && geometry(6).peers[blanks[1]].includes(i))!;
    const grid = p.start.slice();
    grid[blanks[0]] =
      [1, 2, 3, 4, 5, 6].find(
        (d) => d !== p.solution[blanks[0]] && !geometry(6).peers[blanks[0]].some((q) => grid[q] === d),
      ) ?? bad;
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

describe('level 7, a 4 by 4 bed to start', () => {
  const plan = planFor(7);

  it('is a 4 by 4 bed that lone numbers finish', () => {
    expect(plan).toMatchObject({ size: 4, tier: 1, blanks: 10 });
  });

  it('over 300 seeds, every bed has one solution, exactly 10 blanks and grade 1', () => {
    for (let s = 1; s <= 300; s++) {
      const p = makePuzzle(plan, new Rng(s * 7919));
      expect(p.size).toBe(4);
      expect(p.blanks).toBe(10);
      expect(p.start.filter((d) => !d)).toHaveLength(10);
      expect(p.grade).toBe(1);
      expect(countSolutions(p.start, 4)).toBe(1);
      expect(isSolved(p.solution, 4)).toBe(true);
      p.start.forEach((d, i) => {
        if (d) expect(d).toBe(p.solution[i]);
      });
    }
  });

  it('following the hints finishes a bed, each one a lone number that is right', () => {
    for (let s = 1; s <= 20; s++) {
      const p = makePuzzle(plan, new Rng(s * 131));
      const grid = p.start.slice();
      for (let k = 0; k < 10; k++) {
        const h = hintFor(grid, p.start, p.solution, 4)!;
        expect(h.kind).toBe('lone');
        if (h.kind !== 'lone') break;
        expect(h.digit).toBe(p.solution[h.cell]);
        grid[h.cell] = h.digit;
      }
      expect(isSolved(grid, 4)).toBe(true);
    }
  });

  it('a wrong number is found by the first hint', () => {
    const p = makePuzzle(plan, new Rng(5));
    const cell = p.start.findIndex((d) => !d);
    const grid = p.start.slice();
    grid[cell] = (p.solution[cell] % 4) + 1;
    expect(hintFor(grid, p.start, p.solution, 4)).toEqual({ kind: 'fix', cell });
  });

  it('reads a 4 by 4 bed from its picture', () => {
    const p = parsePuzzle(['1...', '..1.', '.2..', '...4']);
    expect(p.size).toBe(4);
    expect(isSolved(p.solution, 4)).toBe(true);
  });
});

describe('Fill marks on big beds', () => {
  it('is offered on the 9 by 9 plans (levels 4 to 6 and 8) and on no 4 by 4 or 6 by 6 plan', () => {
    const levels = PLANS.map((p, i) => (offersFillMarks(p.size) ? i + 1 : 0)).filter(Boolean);
    expect(levels).toEqual([4, 5, 6, 8]);
    for (const p of PLANS) expect(offersFillMarks(p.size)).toBe(p.size === 9);
  });

  it('leaves every empty square holding exactly the numbers that still fit', () => {
    for (let s = 1; s <= 10; s++) {
      const p = makePuzzle(planFor(4 + (s % 3)), new Rng(s * 271));
      const notes = p.start.map(() => 0);
      const filled = fillMarks(p.start, 9, notes);
      expect(filled).toHaveLength(p.blanks);
      p.start.forEach((d, i) => {
        if (d) expect(notes[i]).toBe(0);
        else expect(digitsOf(notes[i])).toEqual(candidates(p.start, 9, i));
      });
    }
  });

  it('never rules out the answer while every placed number is right', () => {
    const p = parsePuzzle(NINE);
    const grid = p.start.slice();
    const notes = grid.map(() => 0);
    fillMarks(grid, 9, notes);
    grid.forEach((d, i) => {
      if (!d) expect(notes[i] & (1 << (p.solution[i] - 1))).not.toBe(0);
    });
  });

  it('keeps her own marks and skips squares with a number', () => {
    const grid = parseGrid(NINE);
    const notes = grid.map(() => 0);
    const mine = grid.findIndex((d) => !d);
    notes[mine] = 0b1;
    const filled = fillMarksRow(grid, 9, notes, Math.floor(mine / 9));
    expect(notes[mine]).toBe(0b1);
    expect(filled).not.toContain(mine);
    for (const c of filled) {
      expect(grid[c]).toBe(0);
      expect(notes[c]).toBe(candidateMask(grid, 9, c));
    }
  });

  it('a placement after Fill marks leaves the marks equal to what still fits in its peers', () => {
    const p = parsePuzzle(NINE);
    const grid = p.start.slice(),
      notes = grid.map(() => 0),
      geo = geometry(9);
    fillMarks(grid, 9, notes);
    const cell = grid.findIndex((d) => !d),
      digit = p.solution[cell];
    grid[cell] = digit;
    notes[cell] = 0;
    for (const q of geo.peers[cell]) notes[q] &= ~(1 << (digit - 1));
    grid.forEach((d, i) => {
      if (!d) expect(notes[i]).toBe(candidateMask(grid, 9, i));
    });
  });
});

describe('level 8, a crossing pair of rows', () => {
  const plan = planFor(8);

  it('is the top of the ladder: a 9 by 9 bed of tier 4', () => {
    expect(plan).toMatchObject({ size: 9, tier: 4, blanks: 55 });
    expect(PLANS.slice(0, 7).every((p) => p.tier <= 3)).toBe(true);
  });

  it('over 300 seeds, every bed has one solution, 55 blanks, grade 4 (tier 3 alone fails) and a sound X-Wing', () => {
    for (let s = 1; s <= 300; s++) {
      const p = makePuzzle(plan, new Rng(s * 6151)),
        label = `seed ${s}`;
      expect(p.blanks, label).toBe(55);
      expect(p.grade, label).toBe(4);
      expect(techniqueSolve(p.start, 9, 3).solved, label).toBe(false);
      expect(countSolutions(p.start, 9), label).toBe(1);
      expectSound(p, label);
      const wings = techniqueSolve(p.start, 9, 4).steps.filter((st) => st.tech === 'xwing');
      expect(wings.length, label).toBeGreaterThan(0);
      const g = geometry(9);
      for (const w of wings) {
        // Four corners, two on each of its two lines, in the same two crossing lines.
        expect(w.pattern, label).toHaveLength(4);
        expect(w.lines, label).toHaveLength(2);
        for (const line of w.lines!)
          expect(
            w.pattern!.filter((c) => line.cells.includes(c)),
            label,
          ).toHaveLength(2);
        const across = (c: number) => (w.lines![0].kind === 'row' ? g.colOf[c] : g.rowOf[c]);
        expect(new Set(w.pattern!.map(across)).size, label).toBe(2);
        for (const r of w.removed!) expect(w.pattern!.map(across), label).toContain(across(r.cell));
      }
    }
  });

  it('following the hints finishes every bed, and on at least two thirds of them one explains the crossing pair of rows', () => {
    const without: number[] = [];
    for (let s = 1; s <= 40; s++) {
      const p = makePuzzle(plan, new Rng(s * 53)),
        grid = p.start.slice();
      let wing = false;
      for (let k = 0; k < 55; k++) {
        const h = hintFor(grid, p.start, p.solution, 9);
        expect(h && h.kind !== 'fix' && h.kind !== 'few', `seed ${s}`).toBe(true);
        if (h!.kind === 'rules-out' && h!.via.tech === 'xwing') wing = true;
        expect((h as { digit: number }).digit, `seed ${s}`).toBe(p.solution[(h as { cell: number }).cell]);
        grid[(h as { cell: number }).cell] = (h as { digit: number }).digit;
      }
      expect(isSolved(grid, 9), `seed ${s}`).toBe(true);
      if (!wing) without.push(s);
    }
    // A bed where the crossing pair only frees a square through a later pair or pointing line names that last step instead.
    expect(without.length, without.join(' ')).toBeLessThanOrEqual(13);
  });

  it('grows from a list of beds the solver checks, each seen many ways', () => {
    for (const rows of WING_BEDS) {
      const p = parsePuzzle(rows);
      expect(p.blanks).toBe(55);
      expect(p.grade).toBe(4);
      expect(countSolutions(p.start, 9)).toBe(1);
    }
    const seen = new Set(
      Array.from({ length: 40 }, (_, s) => makePuzzle(plan, new Rng(s + 1)).start.join('')),
    );
    expect(seen.size).toBe(40);
    expect(makePuzzle(plan, new Rng(5))).toEqual(makePuzzle(plan, new Rng(5)));
  });
});

describe('level 9, patchwork beds', () => {
  const plan = planFor(9);

  it('is a 6 by 6 patchwork bed of the only-place-left grade', () => {
    expect(plan.size).toBe(6);
    expect(plan.patchwork).toBe(true);
    expect(plan.tier).toBe(2);
  });

  it('every layout has six connected patches of six, none a line, at most one a plain box, and admits a full bed', () => {
    expect(PATCH_LAYOUTS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(PATCH_LAYOUTS.map((l) => l.join(''))).size).toBe(PATCH_LAYOUTS.length);
    for (const layout of PATCH_LAYOUTS) {
      const g = patchGeometry(layout),
        label = layout.join('/');
      expect(g.houses, label).toHaveLength(18);
      const patches = g.houses.filter((h) => h.word === 'patch');
      expect(patches, label).toHaveLength(6);
      let plain = 0;
      for (const h of patches) {
        expect(h.kind, label).toBe('box');
        expect(h.cells, label).toHaveLength(6);
        // Connected: a walk across shared edges from one square reaches all six.
        const seen = new Set([h.cells[0]]),
          todo = [h.cells[0]];
        while (todo.length) {
          const c = todo.pop()!;
          for (const d of h.cells)
            if (!seen.has(d) && Math.abs(g.rowOf[c] - g.rowOf[d]) + Math.abs(g.colOf[c] - g.colOf[d]) === 1) {
              seen.add(d);
              todo.push(d);
            }
        }
        expect(seen.size, label).toBe(6);
        const rows = new Set(h.cells.map((c) => g.rowOf[c])).size,
          cols = new Set(h.cells.map((c) => g.colOf[c])).size;
        expect(rows > 1 && cols > 1, `${label}: a patch is a straight line`).toBe(true);
        if (rows * cols === 6) plain++;
      }
      expect(plain, label).toBeLessThanOrEqual(1);
      const full = randomBed(g, new Rng(7));
      expect(isSolved(full, g), label).toBe(true);
      // The soil tints: no two patches sharing an edge alike.
      const tint = patchTints(g);
      for (let i = 0; i < 36; i++)
        for (const j of [i + 6, g.colOf[i] < 5 ? i + 1 : -1])
          if (j >= 0 && j < 36 && g.boxOf[i] !== g.boxOf[j])
            expect(tint[g.boxOf[i]], label).not.toBe(tint[g.boxOf[j]]);
    }
  });

  it('peers come from the patch, not a 2 by 3 box, and the hints call it a patch', () => {
    const g = patchGeometry(PATCH_LAYOUTS[0]);
    // Square 3 shares the first patch with 6 and 7 below; square 10 is in another patch, though a 2 by 3 box would hold both.
    expect(g.peers[3]).toContain(7);
    expect(g.peers[3]).not.toContain(10);
    expect(geometry(6).peers[3]).toContain(10);
    const patch = g.housesOf[3][2];
    expect(houseName(patch)).toBe('patch');
    expect(houseName(geometry(6).housesOf[3][2])).toBe('box');
    // A number in a square's patch rules it out there, even across a 2 by 3 box line.
    const grid = Array<number>(36).fill(0);
    grid[6] = 4;
    expect(candidates(grid, g, 3)).not.toContain(4);
    expect(candidates(grid, 6, 3)).toContain(4);
  });

  it('over 300 seeds, every bed has one solution, its blanks, grade at most 2, and a layout from the list', () => {
    const keys = new Set(PATCH_LAYOUTS.map((l) => l.join(''))),
      used = new Set<string>();
    let two = 0;
    for (let s = 1; s <= 300; s++) {
      const p = makePuzzle(plan, new Rng(s * 131 + 9)),
        label = `seed ${s}`;
      expect(p.patchwork, label).toBeDefined();
      expect(keys.has(p.patchwork!.patches!), label).toBe(true);
      used.add(p.patchwork!.patches!);
      expect(p.blanks, label).toBe(plan.blanks);
      expect(countSolutions(p.start, shapeOf(p)), label).toBe(1);
      expect(isSolved(p.solution, shapeOf(p)), label).toBe(true);
      // The bed obeys its patches; read as a bed of regular boxes it would clash somewhere on most layouts.
      p.start.forEach((d, c) => {
        if (d) expect(d, label).toBe(p.solution[c]);
      });
      const grade = gradeOf(p.start, shapeOf(p));
      expect(grade, label).toBeGreaterThanOrEqual(1);
      expect(grade, label).toBeLessThanOrEqual(2);
      if (grade === 2) two++;
    }
    expect(used.size).toBe(PATCH_LAYOUTS.length);
    expect(two).toBe(300);
  });

  it('following the hints finishes a bed, and an only-place hint can name a patch', () => {
    let patchHint = false;
    for (let s = 1; s <= 30; s++) {
      const p = makePuzzle(plan, new Rng(s)),
        grid = p.start.slice();
      for (let guard = 0; guard < 60 && !isSolved(grid, shapeOf(p)); guard++) {
        const h = hintFor(grid, p.start, p.solution, shapeOf(p))!;
        if (h.kind !== 'lone' && h.kind !== 'place')
          throw new Error(`seed ${s}: a ${h.kind} hint on a grade-2 bed`);
        expect(h.digit, `seed ${s}`).toBe(p.solution[h.cell]);
        if (h.kind === 'place' && houseName(h.house) === 'patch') patchHint = true;
        grid[h.cell] = h.digit;
      }
      expect(isSolved(grid, shapeOf(p)), `seed ${s}`).toBe(true);
    }
    expect(patchHint).toBe(true);
  });

  it('the bot finds a right next number on a patchwork bed', () => {
    const p = makePuzzle(plan, new Rng(3)),
      found = placements(p.start, shapeOf(p));
    expect(found.length).toBeGreaterThan(0);
    for (const f of found) expect(f.digit).toBe(p.solution[f.cell]);
  });

  it('keeps the patches in the short demonstration bed', () => {
    const p = makePuzzle(plan, new Rng(4)),
      s = shortBed(p, 10);
    expect(s.patchwork).toBe(p.patchwork);
    expect(countSolutions(s.start, shapeOf(s))).toBe(1);
  });
});

describe('level 10, cage beds', () => {
  const plan = planFor(10);
  const SEEDS = Array.from({ length: 300 }, (_, i) => i * 97 + 5);
  const beds = SEEDS.map((s) => makePuzzle(plan, new Rng(s)));
  const edgeNear = (a: number, b: number) =>
    Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + Math.abs((a % 6) - (b % 6)) === 1;

  it('is a 6 by 6 cage bed of the only-place-left grade with 30 blanks', () => {
    expect([plan.size, plan.tier, plan.blanks, plan.cages]).toEqual([6, 2, 30, true]);
  });

  it('cageSets matches brute force for 2 to 4 squares at every reachable sum, and pins examples', () => {
    for (let k = 2; k <= 4; k++) {
      const expected = new Map<number, number[][]>();
      for (let mask = 0; mask < 64; mask++) {
        const ds = [1, 2, 3, 4, 5, 6].filter((d) => mask & (1 << (d - 1)));
        if (ds.length !== k) continue;
        const sum = ds.reduce((a, b) => a + b, 0);
        expected.set(sum, [...(expected.get(sum) ?? []), ds]);
      }
      expect(expected.size).toBeGreaterThan(0);
      for (let sum = 0; sum <= 30; sum++) {
        const got = cageSets(sum, k, 6),
          want = expected.get(sum) ?? [];
        for (const set of got) {
          expect(new Set(set).size).toBe(k);
          expect([...set].sort((a, b) => a - b)).toEqual(set);
          expect(set.reduce((a, b) => a + b, 0)).toBe(sum);
        }
        expect(got, `k ${k} sum ${sum}`).toHaveLength(want.length);
        expect(new Set(got.map((x) => x.join())), `k ${k} sum ${sum}`).toEqual(
          new Set(want.map((x) => x.join())),
        );
      }
    }
    expect(cageSets(3, 2, 6)).toEqual([[1, 2]]);
    expect(cageSets(11, 2, 6)).toEqual([[5, 6]]);
    expect(cageSets(6, 3, 6)).toEqual([[1, 2, 3]]);
    expect(cageSets(15, 3, 6)).toEqual([[4, 5, 6]]);
  });

  it('is deterministic per seed, and the same cages come back from partitionCages', () => {
    expect(makePuzzle(plan, new Rng(11))).toEqual(makePuzzle(plan, new Rng(11)));
    expect(new Set(beds.slice(0, 40).map((p) => p.start.join(''))).size).toBeGreaterThan(30);
    const sol = beds[0].solution;
    expect(partitionCages(sol, 6, new Rng(4))).toEqual(partitionCages(sol, 6, new Rng(4)));
  });

  it('over 300 seeds, cages tile the bed, are small, joined, repeat-free, add up, and one is a single set', () => {
    for (const [i, p] of beds.entries()) {
      const label = `seed ${SEEDS[i]}`,
        cages = p.cages!;
      expect(cages, label).toBeDefined();
      const all = cages.flatMap((c) => c.cells).sort((a, b) => a - b);
      expect(all, label).toEqual(Array.from({ length: 36 }, (_, k) => k));
      for (const c of cages) {
        expect(c.cells.length, label).toBeGreaterThanOrEqual(2);
        expect(c.cells.length, label).toBeLessThanOrEqual(4);
        const seen = new Set([c.cells[0]]);
        for (let again = 0; again < 4; again++)
          for (const a of c.cells) for (const b of c.cells) if (seen.has(a) && edgeNear(a, b)) seen.add(b);
        expect(seen.size, label).toBe(c.cells.length);
        expect(new Set(c.cells.map((x) => p.solution[x])).size, label).toBe(c.cells.length);
        expect(
          c.cells.reduce((t, x) => t + p.solution[x], 0),
          label,
        ).toBe(c.sum);
      }
      expect(singleSetCages(cages, 6).length, label).toBeGreaterThanOrEqual(1);
    }
  });

  it('over 300 seeds, each bed has 30 blanks, one answer with the cages, grade 2, and needs its sums', () => {
    for (const [i, p] of beds.entries()) {
      const label = `seed ${SEEDS[i]}`,
        shape = shapeOf(p);
      expect(
        p.start.filter((d) => !d),
        label,
      ).toHaveLength(30);
      expect(p.blanks, label).toBe(30);
      p.start.forEach((d, c) => {
        if (d) expect(d, label).toBe(p.solution[c]);
      });
      expect(isSolved(p.solution, shape), label).toBe(true);
      expect(countSolutions(p.start, shape), label).toBe(1);
      expect(techniqueSolve(p.start, shape, 2).solved, label).toBe(true);
      expect(techniqueSolve(p.start, shape, 4, false, false).solved, label).toBe(false);
      expect(gradeOf(p.start, shape), label).toBe(2);
      expect(p.grade, label).toBe(2);
    }
  });

  it('is sound: no cage-sets removal takes the true digit and every cage-last placement is right', () => {
    let sets = 0,
      last = 0;
    for (const [i, p] of beds.entries()) {
      const r = techniqueSolve(p.start, shapeOf(p), 2);
      for (const st of r.steps) {
        if (st.tech === 'cage-sets') {
          sets++;
          expect(st.cell).toBe(-1);
          expect(st.cage && st.sets && st.pattern).toBeTruthy();
          for (const x of st.removed!) expect(p.solution[x.cell], `seed ${SEEDS[i]}`).not.toBe(x.digit);
        } else if (st.tech === 'cage-last') {
          last++;
          expect(st.digit, `seed ${SEEDS[i]}`).toBe(p.solution[st.cell]);
        } else if (st.cell >= 0) expect(st.digit, `seed ${SEEDS[i]}`).toBe(p.solution[st.cell]);
      }
    }
    expect(sets).toBeGreaterThan(0);
    expect(last).toBeGreaterThan(0);
  });

  it('following the hints finishes each bed, with cage-last and cage-sets hints along the way', () => {
    let cageLast = 0,
      viaSets = 0;
    for (let s = 1; s <= 60; s++) {
      const p = makePuzzle(plan, new Rng(s)),
        shape = shapeOf(p),
        grid = p.start.slice();
      for (let guard = 0; guard < 60 && !isSolved(grid, shape); guard++) {
        const h = hintFor(grid, p.start, p.solution, shape)!;
        expect(h, `seed ${s}`).not.toBeNull();
        expect(h.kind, `seed ${s}`).not.toBe('fix');
        if (h.kind === 'cage-last') {
          cageLast++;
          expect(h.cage.cells).toContain(h.cell);
          expect(h.cage.cells.filter((c) => !grid[c])).toEqual([h.cell]);
          expect(h.have + h.digit).toBe(h.cage.sum);
        }
        if (h.kind === 'rules-out' && h.via.tech === 'cage-sets') viaSets++;
        if (h.kind === 'few') throw new Error(`seed ${s}: a few hint on a grade-2 bed`);
        expect((h as { digit: number }).digit, `seed ${s}`).toBe(p.solution[h.cell]);
        grid[h.cell] = (h as { digit: number }).digit;
      }
      expect(isSolved(grid, shape), `seed ${s}`).toBe(true);
    }
    expect(cageLast).toBeGreaterThan(0);
    expect(viaSets).toBeGreaterThan(0);
  });

  it('placements offer only right digits, and a hint walk meets a cage-last square', () => {
    // Every bed opens with something placeable at a look (makeCageBed throws away beds that need a cage's sets first).
    let cageSquare = false,
      bare = 0;
    for (let s = 1; s <= 40; s++) {
      const p = makePuzzle(plan, new Rng(s)),
        shape = shapeOf(p),
        grid = p.start.slice();
      for (let guard = 0; guard < 60 && !isSolved(grid, shape); guard++) {
        const found = placements(grid, shape);
        if (guard === 0 && !found.length) bare++;
        for (const f of found) {
          expect(f.digit, `seed ${s}`).toBe(p.solution[f.cell]);
          const cage = (shape as ReturnType<typeof cageGeometry>).cages[
            (shape as ReturnType<typeof cageGeometry>).cageOf[f.cell]
          ];
          if (cage.cells.filter((c) => !grid[c]).length === 1) cageSquare = true;
        }
        const h = hintFor(grid, p.start, p.solution, shape)! as { cell: number; digit: number };
        grid[h.cell] = h.digit;
      }
    }
    expect(cageSquare).toBe(true);
    expect(bare).toBe(0);
  });

  it('shortBed keeps the same cages and sums, and stays uniquely solvable', () => {
    for (let s = 1; s <= 20; s++) {
      const p = makePuzzle(plan, new Rng(s)),
        short = shortBed(p, 10);
      expect(short.cages).toBe(p.cages);
      for (const c of short.cages!) expect(c.cells.reduce((t, x) => t + short.solution[x], 0)).toBe(c.sum);
      expect(short.blanks).toBe(10);
      expect(countSolutions(short.start, shapeOf(short))).toBe(1);
    }
  });

  it('wrongSums reports a full cage off its sum and a partial one past it, and isSolved needs the sums', () => {
    const p = beds[0],
      shape = shapeOf(p),
      g = shape as ReturnType<typeof cageGeometry>;
    expect(wrongSums(p.solution, shape)).toEqual([]);
    expect(isSolved(p.solution, shape)).toBe(true);
    const cage = g.cages[0];
    // Full cage, wrong total: a swap with a different number elsewhere is not guaranteed legal, so just set one square.
    const bad = p.solution.slice();
    bad[cage.cells[0]] = bad[cage.cells[0]] === 6 ? 5 : bad[cage.cells[0]] + 1;
    expect(wrongSums(bad, shape).map((c) => c.cells.join())).toContain(cage.cells.join());
    expect(isSolved(bad, shape)).toBe(false);
    // Partial cage already past its sum.
    const part = Array<number>(36).fill(0);
    part[cage.cells[0]] = 6;
    part[cage.cells[1]] = 5;
    const small = cageGeometry(6, [
      { cells: cage.cells.slice(0, 2).concat(cage.cells.length > 2 ? [cage.cells[2]] : []), sum: 7 },
      ...g.cages.slice(1).map((c) => ({ cells: [...c.cells], sum: c.sum })),
    ]);
    expect(wrongSums(part, small).length).toBeGreaterThan(0);
    // Partial and under the sum: fine.
    expect(wrongSums(Array<number>(36).fill(0), shape)).toEqual([]);
    // A grid with no row, column or box repeat but wrong sums: the plain solution under different cages.
    const other = beds.find(
      (q) => q.solution.join() !== p.solution.join() && wrongSums(p.solution, shapeOf(q)).length > 0,
    )!;
    expect(conflicts(p.solution, 6)).toEqual([]);
    expect(isSolved(p.solution, shapeOf(other))).toBe(false);
  });

  it('conflicts flags a repeat inside a cage that no row, column or box shares, and candidates skip cage-mates', () => {
    let found = false;
    for (const p of beds.slice(0, 40))
      for (const c of (shapeOf(p) as ReturnType<typeof cageGeometry>).cages) {
        const g = shapeOf(p) as ReturnType<typeof cageGeometry>;
        for (const a of c.cells)
          for (const b of c.cells) {
            if (a >= b || geometry(6).peers[a].includes(b)) continue;
            const grid = Array<number>(36).fill(0);
            grid[a] = 3;
            grid[b] = 3;
            expect(conflicts(grid, g).sort()).toEqual([a, b].sort());
            expect(conflicts(grid, 6)).toEqual([]);
            const empty = Array<number>(36).fill(0);
            empty[a] = 3;
            expect(candidates(empty, g, b)).not.toContain(3);
            expect(candidates(empty, 6, b)).toContain(3);
            found = true;
          }
      }
    expect(found).toBe(true);
  });

  it('draws nothing extra for levels 1 to 9: each is deterministic and unaffected by cages', () => {
    for (let level = 1; level <= 9; level++) {
      expect(planFor(level).cages, `level ${level}`).toBeFalsy();
      for (const s of [3, 7, 21]) {
        const a = makePuzzle(planFor(level), new Rng(s)),
          b = makePuzzle(planFor(level), new Rng(s));
        expect(a, `level ${level} seed ${s}`).toEqual(b);
        expect(a.cages, `level ${level}`).toBeUndefined();
      }
    }
  });

  it('puts cage beds after patchwork beds in the grown-up order', () => {
    expect(gameById('sudoku-garden')!.levels('grownup')).toEqual({
      min: 1,
      max: 10,
      order: [7, 1, 2, 3, 9, 10, 4, 5, 6, 8],
    });
  });
});
