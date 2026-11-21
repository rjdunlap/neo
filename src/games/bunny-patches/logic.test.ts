import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  LEVELS,
  answerCells,
  boardKey,
  clashes,
  countSolutions,
  countsMiss,
  fallbackBoard,
  firstClash,
  hintFor,
  humanSolve,
  isSolved,
  makeBoard,
  reachOf,
  sizeOf,
  type Board,
} from './logic';

const SEEDS = [1, 2, 3, 7, 42, 99, 123, 2024];

function connected(b: Board, id: number) {
  const cells = b.patch.map((p, i) => (p === id ? i : -1)).filter((i) => i >= 0);
  const seen = new Set([cells[0]]);
  const todo = [cells[0]];
  while (todo.length) {
    const s = todo.pop()!;
    const r = Math.floor(s / b.n);
    const c = s % b.n;
    for (const t of [
      r > 0 ? s - b.n : -1,
      r < b.n - 1 ? s + b.n : -1,
      c > 0 ? s - 1 : -1,
      c < b.n - 1 ? s + 1 : -1,
    ])
      if (t >= 0 && b.patch[t] === id && !seen.has(t)) {
        seen.add(t);
        todo.push(t);
      }
  }
  return seen.size === cells.length;
}

describe('Bunny Patches rules', () => {
  it('lists the ladder by band', () => {
    expect(LEVELS.prek).toEqual({ min: 1, max: 1 });
    expect(LEVELS.school).toEqual({ min: 2, max: 3 });
    expect(LEVELS.grownup).toEqual({ min: 3, max: 3 });
  });

  describe.each([1, 2, 3])('level %i', (level) => {
    const boards = SEEDS.map((s) => makeBoard(level, new Rng(s)));
    it('has exactly one answer, and at level 1 the given bunny decides', () => {
      for (const b of boards) {
        expect(b.n).toBe(sizeOf(level));
        expect(countSolutions(b.n, b.patch, b.given)).toBe(1);
        if (level === 1) {
          expect(b.given).toBeDefined();
          expect(countSolutions(b.n, b.patch)).toBeGreaterThan(1);
          expect(answerCells(b)).toContain(b.given);
        } else expect(b.given).toBeUndefined();
      }
    });
    it('is finished by the rule-only solver, with every step on the answer', () => {
      for (const b of boards) {
        const r = humanSolve(b.n, b.patch, b.given === undefined ? [] : [b.given], level >= 2);
        expect(r.done).toBe(true);
        const answer = answerCells(b);
        for (const st of r.steps) expect(answer).toContain(st.cell);
      }
    });
    it('has connected patches, none a lone square, one answer square each', () => {
      for (const b of boards) {
        for (let id = 0; id < b.n; id++) {
          expect(connected(b, id)).toBe(true);
          expect(b.patch.filter((p) => p === id).length).toBeGreaterThanOrEqual(2);
        }
        expect(new Set(answerCells(b).map((s) => b.patch[s])).size).toBe(b.n);
      }
    });
    it('differs between seeds', () => {
      expect(new Set(boards.map((b) => b.patch.join(''))).size).toBeGreaterThan(1);
    });
    it('the audited fallback is unique and rule-solvable', () => {
      const b = fallbackBoard(level);
      expect(countSolutions(b.n, b.patch, b.given)).toBe(1);
      expect(humanSolve(b.n, b.patch, b.given === undefined ? [] : [b.given], level >= 2).done).toBe(true);
      expect(isSolved(b, answerCells(b))).toBe(true);
      if (level === 1) expect(countSolutions(b.n, b.patch)).toBe(2);
    });
    it('every hint square is on the answer, and a wrong bunny is taken back first', () => {
      for (const b of boards) {
        const answer = answerCells(b);
        const h = hintFor(b, b.given === undefined ? [] : [b.given]);
        expect(h?.kind).toBe('place');
        if (h?.kind === 'place') expect(answer).toContain(h.cell);
        const wrong = answer.includes(0) ? 1 : 0;
        const bad = hintFor(
          b,
          [wrong].filter((w) => !answer.includes(w) && w !== b.given),
        );
        if (!answer.includes(wrong) && wrong !== b.given)
          expect(bad).toEqual({ kind: 'remove', cell: wrong });
      }
    });
  });

  it('reports a touching pair, a shared row, column and patch', () => {
    const b = fallbackBoard(2);
    expect(clashes(5, b.patch, [0, 1])[0].kind).toBe('row');
    expect(clashes(5, b.patch, [0, 15])[0].kind).toBe('column');
    expect(clashes(5, b.patch, [1, 2])[0].kind).toBe('row');
    expect(clashes(5, b.patch, [7, 13])).toEqual([{ kind: 'touch', a: 7, b: 13 }]);
    expect(clashes(5, b.patch, [4, 12])).toEqual([]);
    expect(firstClash(b, [0, 1])?.kind).toBe('row');
    expect(firstClash(b, answerCells(b))).toBeNull();
  });

  it('shades row, column, patch and touching squares of a bunny', () => {
    const b = fallbackBoard(2);
    const r = reachOf(5, b.patch, [12]);
    for (const s of [10, 11, 13, 14, 2, 7, 17, 22, 6, 8, 16, 18]) expect(r.has(s)).toBe(true);
    expect(r.has(12)).toBe(false);
  });

  it('counts one miss for a full wrong board, and none again until it changes', () => {
    const b = fallbackBoard(2);
    const wrong = [0, 1, 2, 3, 4];
    expect(countsMiss(b, [0, 1], null)).toBe(false);
    expect(countsMiss(b, wrong, null)).toBe(true);
    expect(countsMiss(b, wrong, boardKey(wrong))).toBe(false);
    expect(countsMiss(b, [...wrong.slice(0, 4), 9], boardKey(wrong))).toBe(true);
    expect(countsMiss(b, answerCells(b), null)).toBe(false);
  });
});
