import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor } from '../../progress/difficulty';
import {
  LEVELS,
  SPECS,
  attempt,
  countSolutions,
  countsMiss,
  fallbackBoard,
  fillKey,
  hintFor,
  humanSolve,
  isCrate,
  isSolved,
  lineStatus,
  makeBoard,
  runsOf,
  wrongLines,
  type Board,
} from './logic';

const SEEDS = [1, 2, 3, 7, 42, 99, 123, 2024];
const LEVEL_LIST = [1, 2, 3];

const solutions = (b: Board) => countSolutions(b.rows, b.cols, (at) => isCrate(b, at), b.lines, b.maxFruit);

describe('Sum Crates ladder', () => {
  it('gives school levels 1 to 2 and the grown-up band level 3', () => {
    expect(rangeFor(LEVELS, 'school')).toEqual({ min: 1, max: 2 });
    expect(rangeFor(LEVELS, 'grownup')).toEqual({ min: 3, max: 3 });
  });
});

describe.each(LEVEL_LIST)('Sum Crates level %i boards', (level) => {
  const spec = SPECS[level];
  const boards = SEEDS.map((s) => makeBoard(level, new Rng(s + level * 1000)));

  it('has exactly one solution, with fruit 1 to the level maximum', () => {
    for (const b of boards) {
      expect(solutions(b)).toBe(1);
      for (const v of b.solution) expect(v).toBeLessThanOrEqual(spec.fruit);
    }
  });

  it('repeats no fruit in any line of the answer and reads every sign off it', () => {
    for (const b of boards)
      for (const l of b.lines) {
        const vals = l.cells.map((c) => b.solution[c]);
        expect(new Set(vals).size).toBe(vals.length);
        expect(vals.reduce((s, v) => s + v, 0)).toBe(l.sum);
      }
  });

  it('has lines of two or more crates, every crate in a line and at least two crossing', () => {
    for (const b of boards) {
      const runs = runsOf(b.rows, b.cols, (at) => isCrate(b, at));
      expect(runs.length).toBe(b.lines.length);
      const count = new Map<number, number>();
      for (const l of b.lines) {
        expect(l.cells.length).toBeGreaterThanOrEqual(2);
        expect(l.cells.length).toBeLessThanOrEqual(spec.maxLine);
        for (const c of l.cells) count.set(c, (count.get(c) ?? 0) + 1);
      }
      const crates = b.solution.filter((v) => v > 0).length;
      expect(crates).toBeGreaterThanOrEqual(spec.crates[0]);
      expect(crates).toBeLessThanOrEqual(spec.crates[1]);
      expect(count.size).toBe(crates);
      expect([...count.values()].filter((v) => v >= 2).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('is finished by the rule-only solver within its cap, and the answer it reaches is the answer', () => {
    for (const b of boards) {
      const h = humanSolve(b);
      expect(h.done).toBe(true);
      expect(h.eliminations).toBeLessThanOrEqual(spec.cap);
      for (const s of h.steps) expect(b.solution[s.cell]).toBe(s.value);
    }
  });

  it('varies with the seed', () => {
    expect(new Set(boards.map((b) => b.solution.join(','))).size).toBeGreaterThan(1);
  });

  it('has an audited fallback that is unique and solvable by rule', () => {
    const f = fallbackBoard(level);
    expect(solutions(f)).toBe(1);
    const h = humanSolve(f);
    expect(h.done).toBe(true);
    expect(h.eliminations).toBeLessThanOrEqual(spec.cap);
  });

  it('shows measured solver effort well inside the cap (a seeded sweep)', () => {
    let worst = 0;
    const rng = new Rng(level * 31);
    let got = 0;
    for (let i = 0; i < 4000 && got < 12; i++) {
      const b = attempt(level, rng, false);
      if (!b) continue;
      got++;
      const h = humanSolve(b);
      if (h.done) worst = Math.max(worst, h.eliminations);
    }
    expect(got).toBeGreaterThan(0);
    expect(worst).toBeLessThanOrEqual(spec.cap);
  });
});

describe('Sum Crates definition examples', () => {
  it('level 1: rows 5 1 / 2 3 give signs row 6, row 5, column 7, column 4', () => {
    const b = fallbackBoard(1);
    expect(b.lines.map((l) => `${l.dir}${l.sum}`)).toEqual(['across6', 'across5', 'down7', 'down4']);
  });
  it('level 2 and 3 audited stacks read the signs the definition names', () => {
    expect(
      fallbackBoard(2)
        .lines.map((l) => l.sum)
        .sort((a, b) => a - b),
    ).toEqual([3, 5, 9, 11, 12]);
    expect(
      fallbackBoard(3)
        .lines.map((l) => l.sum)
        .sort((a, b) => a - b),
    ).toEqual([3, 5, 5, 7, 7, 8, 8, 12]);
  });
});

describe('Sum Crates judging and hints', () => {
  const b = fallbackBoard(1);
  const empty = new Array<number>(b.rows * b.cols).fill(0);

  it('reads back what a full line made, and rings a repeat even in a part-full line', () => {
    const fill = [...empty];
    fill[0] = 5;
    fill[1] = 2;
    const top = lineStatus(b.lines[0], fill);
    expect(top.full && top.made === 7 && !top.right && top.wrong).toBe(true);
    const rep = [...empty];
    rep[0] = 3;
    rep[1] = 3;
    expect(lineStatus(b.lines[0], rep).repeat.has(3)).toBe(true);
    expect(lineStatus(b.lines[0], rep).wrong).toBe(true);
    expect(lineStatus(b.lines[0], [5, 1, 0, 0]).right).toBe(true);
  });

  it('counts one miss for a full wrong board and none for the same board again', () => {
    const wrong = [1, 1, 1, 1];
    expect(countsMiss(b, wrong, null)).toBe(true);
    expect(countsMiss(b, wrong, fillKey(wrong))).toBe(false);
    expect(countsMiss(b, [2, 1, 1, 1], fillKey(wrong))).toBe(true);
    expect(countsMiss(b, [5, 1, 2, 3], null)).toBe(false);
    expect(wrongLines(b, wrong).length).toBeGreaterThan(0);
    expect(isSolved(b, [5, 1, 2, 3])).toBe(true);
    expect(countsMiss(b, [5, 1, 2, 0], null)).toBe(false);
  });

  it.each(LEVEL_LIST)(
    'level %i: every hint crate is right in the solution and the hints lead to the answer',
    (level) => {
      for (const seed of SEEDS) {
        const board = makeBoard(level, new Rng(seed * 5 + level));
        const fill = new Array<number>(board.rows * board.cols).fill(0);
        for (let guard = 0; guard < 40; guard++) {
          const h = hintFor(board, fill);
          if (!h) break;
          expect(h.kind).toBe('place');
          expect(board.solution[h.cell]).toBeGreaterThan(0);
          expect(fill[h.cell]).toBe(0);
          fill[h.cell] = board.solution[h.cell];
        }
        expect(isSolved(board, fill)).toBe(true);
      }
    },
  );

  it('points at a fruit that cannot be in any answer before anything else', () => {
    const fill = [...empty];
    fill[0] = 1;
    fill[3] = 3;
    expect(hintFor(b, fill)).toEqual({ kind: 'remove', cell: 0 });
  });
});
