import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  CUTOUTS,
  LEVELS,
  MARKS,
  accepted,
  apart,
  boardFor,
  boardKey,
  boardsPerRound,
  countsAsMiss,
  demoBoard,
  describeLevel,
  faceOnArrangements,
  firstWrong,
  follow,
  hintFor,
  inPool,
  joined,
  nearestMark,
  oneAnswer,
  openArrangements,
  part,
  partHeight,
  sameShadow,
  scaleAt,
  shadowHeight,
  slide,
  valuesAt,
  wholeSquares,
  type Arrangement,
  type Cutout,
  type Mark,
  type Shape,
} from './logic';

const cut = (shape: Shape, w: number, h: number) =>
  CUTOUTS.find((c) => c.shape === shape && c.w === w && c.h === h) as Cutout;
const at = (cutout: Cutout, mark: Mark, turned = false) => ({ cutout, mark, turned });

describe('Shadow Play light model', () => {
  it('scales a shadow by the screen’s distance over the cut-out’s: ×6, ×4, ×3 and ×2', () => {
    expect(MARKS.map(scaleAt)).toEqual([6, 4, 3, 2]);
    expect(part(at(cut('tent', 1, 2), 3))).toEqual({ shape: 'tent', w: 4, h: 8 });
    // Twice as far from the lamp, half the shadow.
    expect(part(at(cut('tent', 1, 2), 6))).toEqual({ shape: 'tent', w: 2, h: 4 });
    // Turned, the shadow is half as wide and just as tall.
    expect(part(at(cut('block', 2, 1), 4, true))).toEqual({ shape: 'block', w: 3, h: 3 });
  });

  it('gives each shape its part, centred on its rail’s spot', () => {
    const block = at(cut('block', 2, 2), 6);
    const tent = at(cut('tent', 2, 2), 6);
    const dome = at(cut('dome', 2, 2), 6);
    // Each is 4 wide and 4 tall on the middle rail: from 10 to 14.
    for (const p of [block, tent, dome]) {
      expect(partHeight(p, 1, 12)).toBe(4);
      expect(partHeight(p, 1, 9.9)).toBe(0);
      expect(partHeight(p, 1, 14)).toBe(0);
      expect(partHeight(p, 0, 6)).toBe(4);
    }
    expect(partHeight(block, 1, 13.9)).toBe(4);
    expect(partHeight(tent, 1, 13)).toBe(2);
    expect(partHeight(dome, 1, 13)).toBeCloseTo(4 * Math.sqrt(0.75), 10);
  });

  it('makes the whole shadow the tallest part at every point, and compares shadows by region', () => {
    const arr = [at(cut('block', 2, 1), 2), at(cut('tent', 2, 2), 2), at(cut('block', 1, 1), 6)];
    expect(shadowHeight(arr, 12)).toBe(12);
    expect(shadowHeight(arr, 7)).toBe(6);
    expect(shadowHeight(arr, 18)).toBe(2);
    expect(sameShadow(arr, arr)).toBe(true);
    expect(sameShadow(arr, slide(arr, 2, 4))).toBe(false);
    // A small tent wholly behind a big block casts nothing of its own.
    const hidden = [at(cut('block', 2, 2), 2), at(cut('tent', 1, 1), 6), at(cut('block', 2, 2), 2)];
    expect(sameShadow(hidden, slide(hidden, 1, 4))).toBe(true);
    expect(oneAnswer(hidden)).toBe(false);
  });
});

describe('Shadow Play pools', () => {
  it('has the definition’s pool counts, every pooled board passing both filters', () => {
    let near = 0;
    let joinedFaceOn = 0;
    let dark = 0;
    for (const arr of faceOnArrangements()) {
      expect(wholeSquares(arr)).toBe(true);
      if (apart(arr)) {
        near++;
        // Every apart face-on board has one answer, because no edge is hidden.
        if (!oneAnswer(arr) || !inPool(1, arr)) throw new Error('an apart board with two answers');
      }
      if (joined(arr)) {
        joinedFaceOn++;
        if (oneAnswer(arr)) dark++;
        if (inPool(2, arr) !== oneAnswer(arr)) throw new Error('level 2 pool disagrees with its filters');
      } else if (inPool(2, arr)) throw new Error('a level 2 board that is not joined');
    }
    expect({ near, joinedFaceOn, dark }).toEqual({ near: 44496, joinedFaceOn: 30672, dark: 30516 });
  }, 60_000);

  it('samples pooled boards whose start has every cut-out off its solution mark, never repeating the last', () => {
    const rng = new Rng(7);
    for (const level of [1, 2]) {
      let last: string | undefined;
      for (let i = 0; i < 300; i++) {
        const board = boardFor(level, rng, last);
        expect(inPool(level, board.solution)).toBe(true);
        expect(boardKey(board.solution)).not.toBe(last);
        board.start.forEach((p, rail) => {
          expect(p.cutout).toBe(board.solution[rail].cutout);
          expect(p.turned).toBe(false);
          expect(p.mark).not.toBe(board.solution[rail].mark);
        });
        last = boardKey(board.solution);
      }
    }
    expect(boardsPerRound(1)).toBe(2);
    expect(boardsPerRound(2)).toBe(1);
  });

  it('puts the how-to card’s boards in their pools', () => {
    for (const level of [1, 2]) expect(inPool(level, demoBoard(level).solution)).toBe(true);
    const tent = demoBoard(1);
    expect(part(tent.start[1]).h * 2).toBe(part(tent.solution[1]).h);
    expect(demoBoard(2).solution.map((p) => part(p).h)).toEqual([4, 6, 6]);
  });

  it('has a ladder and a description for each level', () => {
    expect(LEVELS.grownup).toEqual({ min: 1, max: 2 });
    expect(describeLevel(1)).not.toBe(describeLevel(2));
  });
});

describe('Shadow Play answers, misses and hints', () => {
  const rng = new Rng(11);
  const sampled = [1, 2].flatMap((level) => Array.from({ length: 40 }, () => boardFor(level, rng)));

  it('accepts only the solution among a sampled board’s arrangements, and a wrong one always names a rail', () => {
    for (const board of sampled) {
      const open = openArrangements(board.solution.map((p) => p.cutout));
      expect(open).toHaveLength(64);
      const right = open.filter((arr) => accepted(board, arr));
      expect(right).toHaveLength(1);
      expect(firstWrong(board, right[0])).toBeNull();
      for (const arr of open) {
        if (arr === right[0]) continue;
        const wrong = firstWrong(board, arr);
        expect(wrong).not.toBeNull();
        if (!wrong) continue;
        // The first rail from the left whose mark differs, too tall when it stands nearer the lamp than it should.
        const rail = arr.findIndex((p, i) => p.mark !== board.solution[i].mark);
        expect(wrong.rail).toBe(rail);
        expect(wrong.fault).toBe(arr[rail].mark < board.solution[rail].mark ? 'tall' : 'short');
      }
    }
  });

  it('walks hints from any arrangement to the solution in at most three steps, each setting one more value', () => {
    for (const board of sampled)
      for (const begin of openArrangements(board.solution.map((p) => p.cutout))) {
        let arr: Arrangement = begin;
        let steps = 0;
        for (let hint = hintFor(board, arr); hint; hint = hintFor(board, arr)) {
          const right = (a: Arrangement) => a.filter((p, i) => p.mark === board.solution[i].mark).length;
          const before = right(arr);
          arr = follow(arr, hint);
          expect(right(arr)).toBe(before + 1);
          steps++;
        }
        expect(steps).toBeLessThanOrEqual(valuesAt(board.level));
        expect(accepted(board, arr)).toBe(true);
      }
  });

  it('counts one miss per distinct wrong arrangement lit, on each board', () => {
    const board = sampled.at(-1)!;
    const seen = new Set<string>();
    expect(countsAsMiss(seen, 0, board.start)).toBe(true);
    expect(countsAsMiss(seen, 0, board.start)).toBe(false);
    const other = slide(board.start, 0, board.solution[0].mark as Mark);
    expect(countsAsMiss(seen, 0, other)).toBe(true);
    expect(countsAsMiss(seen, 0, board.start)).toBe(false);
    expect(countsAsMiss(seen, 1, board.start)).toBe(true);
  });

  it('never opens a level 1 board already finished, so nothing at level 1 is checked or missed', () => {
    for (const board of sampled.filter((b) => b.level === 1))
      expect(accepted(board, board.start)).toBe(false);
  });

  it('snaps a slide to the nearest mark', () => {
    expect([1, 2.4, 2.6, 3.4, 3.6, 4.9, 5.1, 9].map(nearestMark)).toEqual([2, 2, 3, 3, 4, 4, 6, 6]);
  });
});
