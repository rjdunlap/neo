import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  CLUES,
  JAR,
  Misses,
  NUMBERS,
  PEBBLE_R,
  PLANS,
  allowedBy,
  clueById,
  drawBoard,
  fault,
  fillShare,
  follow,
  fresh,
  hint,
  holds,
  lastStanding,
  makeBoard,
  pile,
  pileTop,
  planFor,
  rowOf,
  runs,
  sweepRun,
  toggled,
  valid,
  wrongNumbers,
  type Board,
  type Marks,
} from './logic';

const boards = (level: number, n = 150, from = 1000) =>
  Array.from({ length: n }, (_, s) => makeBoard(level, new Rng(from + s)));
const truthOf = (id: string) => NUMBERS.filter((n) => clueById(id).test(n));
/** The board marked right after `shown` clues. */
const right = (b: Board, shown: number): Marks => {
  const ok = new Set(allowedBy(b.clues.slice(0, shown)));
  return NUMBERS.map((n) => !ok.has(n));
};

describe('Jar Clues clues', () => {
  it('has the closed list for levels 1–2: 22 range, 2 parity, 2 counting by, 10 ends in, 10 digit sums, 2 digit orders', () => {
    const by = (k: string) => CLUES.filter((c) => c.kind === k).length;
    expect([by('range'), by('parity'), by('by'), by('ends'), by('sum'), by('order')]).toEqual([
      22, 2, 2, 10, 10, 2,
    ]);
    expect(new Set(CLUES.map((c) => c.id)).size).toBe(CLUES.length);
  });

  it('tells the truth about every number from 1 to 60', () => {
    expect(truthOf('fewer-40')).toEqual(NUMBERS.filter((n) => n <= 39));
    expect(truthOf('more-55')).toEqual([56, 57, 58, 59, 60]);
    expect(truthOf('odd').length).toBe(30);
    expect(truthOf('by-5')).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);
    expect(truthOf('by-10')).toEqual([10, 20, 30, 40, 50, 60]);
    expect(truthOf('ends-2')).toEqual([2, 12, 22, 32, 42, 52]);
    expect(truthOf('ends-0')).toEqual([10, 20, 30, 40, 50, 60]);
  });

  it('reads a one-digit number as tens digit 0', () => {
    expect(truthOf('sum-7')).toEqual([7, 16, 25, 34, 43, 52]);
    expect(truthOf('sum-3')).toEqual([3, 12, 21, 30]);
    // 1 to 9 have the bigger ones digit; 10, 20 … have the bigger tens digit; 11, 22 … neither.
    for (let n = 1; n <= 9; n++) expect(clueById('ones-bigger').test(n)).toBe(true);
    expect(truthOf('tens-bigger').slice(0, 4)).toEqual([10, 20, 21, 30]);
    for (const n of [11, 22, 33, 44, 55]) {
      expect(clueById('ones-bigger').test(n)).toBe(false);
      expect(clueById('tens-bigger').test(n)).toBe(false);
    }
    expect(clueById('tens-bigger').fails(7)).toContain('digits are 0 and 7');
  });

  it('gives every clue a reason true of each number: fits when it fits, fails when it does not', () => {
    for (const c of CLUES)
      for (const n of NUMBERS) {
        const said = c.test(n) ? c.fits(n) : c.fails(n);
        expect(said.length).toBeGreaterThan(4);
        if (c.kind === 'sum' && !c.test(n)) expect(said).toContain(`add to ${(n % 10) + Math.floor(n / 10)}`);
      }
  });
});

describe('Jar Clues generator', () => {
  it.each([1, 2])('finds a valid board within 200 draws at level %i, meeting its row', (level) => {
    const plan = planFor(level);
    for (const b of boards(level)) {
      expect(b.draws).toBeLessThanOrEqual(200);
      expect(valid(b)).toBe(true);
      expect(b.clues.length).toBe(plan.clues);
      expect(b.clues.every((c) => plan.kinds.includes(c.kind))).toBe(true);
      if (plan.needs.length) expect(b.clues.some((c) => plan.needs.includes(c.kind))).toBe(true);
      expect(b.clues.filter((c) => c.side === 'more').length).toBeLessThanOrEqual(1);
      expect(b.clues.filter((c) => c.side === 'fewer').length).toBeLessThanOrEqual(1);
    }
  });

  it.each([1, 2])(
    'keeps the count among the last two or three numbers, the level gap apart, at level %i',
    (level) => {
      const { gap, cut } = planFor(level);
      for (const b of boards(level)) {
        const last = lastStanding(b);
        expect(last).toContain(b.count);
        expect(last.length).toBeGreaterThanOrEqual(2);
        expect(last.length).toBeLessThanOrEqual(3);
        for (let i = 1; i < last.length; i++) expect(last[i] - last[i - 1]).toBeGreaterThanOrEqual(gap);
        // Every clue cuts at least the level's smallest cut, and more than three stand until the last.
        for (let k = 1; k <= b.clues.length; k++) {
          const before = allowedBy(b.clues.slice(0, k - 1)).length;
          const after = allowedBy(b.clues.slice(0, k)).length;
          expect(before - after).toBeGreaterThanOrEqual(cut);
          if (k < b.clues.length) expect(after).toBeGreaterThan(3);
        }
      }
    },
  );

  it('covers most counts and many different boards', () => {
    for (const level of [1, 2]) {
      const bs = boards(level, 400, 5000);
      expect(new Set(bs.map((b) => b.count)).size).toBeGreaterThan(40);
      expect(new Set(bs.map((b) => b.clues.map((c) => c.id).join())).size).toBeGreaterThan(200);
    }
  });

  it('is seeded: the same seed draws the same board', () => {
    const a = makeBoard(2, new Rng(42)),
      b = makeBoard(2, new Rng(42));
    expect(a.count).toBe(b.count);
    expect(a.clues.map((c) => c.id)).toEqual(b.clues.map((c) => c.id));
  });

  it('rejects boards that break a rule', () => {
    const c = (ids: string[], count: number, level = 1): Board => ({
      level,
      count,
      clues: ids.map(clueById),
    });
    // The definition's example is valid: fewer than 35, more than 5, ends in 2 leaves 12, 22 and 32.
    expect(valid(c(['fewer-35', 'more-5', 'ends-2'], 22))).toBe(true);
    expect(lastStanding(c(['fewer-35', 'more-5', 'ends-2'], 22))).toEqual([12, 22, 32]);
    // A clue false of the count, two "fewer than"s, and a level-2 board without a digit clue.
    expect(valid(c(['fewer-35', 'more-5', 'ends-2'], 32 + 1))).toBe(false);
    expect(valid(c(['fewer-35', 'fewer-30', 'ends-2'], 22))).toBe(false);
    expect(valid(c(['fewer-40', 'more-5', 'even', 'ends-2'], 22, 2))).toBe(false);
    // The definition's level-2 example: fewer than 40, more than 5, even, digits add to 3 leaves 12 and 30.
    expect(lastStanding(c(['fewer-40', 'more-5', 'even', 'sum-3'], 12, 2))).toEqual([12, 30]);
    expect(valid(c(['fewer-40', 'more-5', 'even', 'sum-3'], 12, 2))).toBe(true);
  });

  it('a draw that cannot finish returns null rather than a bad board', () => {
    let nulls = 0;
    for (let s = 0; s < 300; s++) if (!drawBoard(1, new Rng(s))) nulls++;
    expect(nulls).toBeGreaterThan(0);
  });
});

describe('Jar Clues check, misses and explanations', () => {
  const sample = [...boards(1, 40, 7000), ...boards(2, 40, 8000)];

  it('a board holds exactly when the standing numbers are the ones every shown clue allows', () => {
    for (const b of sample)
      for (let k = 1; k <= b.clues.length; k++) {
        const m = right(b, k);
        expect(holds(b, k, m)).toBe(true);
        for (const n of [1, 17, 30, b.count, 60]) expect(holds(b, k, toggled(m, n))).toBe(false);
      }
  });

  it('counts one miss per distinct wrong board at a clue; the same board again is free', () => {
    const b = sample[0];
    const misses = new Misses();
    const m = fresh();
    expect(misses.count(1, m)).toBe(true);
    expect(misses.count(1, m)).toBe(false);
    expect(misses.count(1, toggled(m, 60))).toBe(true);
    // The same marks at a later clue are a different check.
    expect(misses.count(2, m)).toBe(true);
    expect(holds(b, 1, m)).toBe(false);
  });

  it('names the lowest wrong number and a true reason', () => {
    const rng = new Rng(31);
    for (const b of sample)
      for (let k = 1; k <= b.clues.length; k++)
        for (let t = 0; t < 6; t++) {
          let m = right(b, k);
          for (let j = 0; j < 1 + (t % 3); j++) m = toggled(m, rng.int(1, 60));
          const f = fault(b, k, m);
          const wrong = wrongNumbers(b, k, m);
          if (!wrong.length) {
            expect(f).toBeNull();
            continue;
          }
          expect(f!.n).toBe(wrong[0]);
          expect(f!.words.startsWith(`${f!.n} is `)).toBe(true);
          if (f!.kind === 'standing') {
            expect(m[f!.n - 1]).toBe(false);
            expect(f!.clue!.test(f!.n)).toBe(false);
            expect(b.clues.slice(0, k)).toContain(f!.clue);
            expect(f!.words).toContain(f!.clue!.fails(f!.n));
          } else {
            expect(m[f!.n - 1]).toBe(true);
            expect(b.clues.slice(0, k).every((c) => c.test(f!.n))).toBe(true);
            expect(f!.words).toContain('fits every clue so far');
          }
        }
  });

  it('explains a crossed-off count exactly as any other crossed-off number that fits', () => {
    for (const b of sample) {
      const k = b.clues.length;
      const fits = allowedBy(b.clues.slice(0, k));
      const other = fits.find((n) => n !== b.count)!;
      const said = (board: Board) => fault(board, k, toggled(right(b, k), b.count))!.words;
      // The same crossed number on the same clues reads the same whether or not it is the count.
      expect(said(b)).toBe(said({ ...b, count: other }));
      expect(said(b)).not.toMatch(/\bcount\b|jar|answer/i);
    }
  });

  it('says the one-digit convention when a digit clue rules out a one-digit number', () => {
    const b: Board = { level: 2, count: 34, clues: ['fewer-40', 'sum-7'].map(clueById) };
    const f = fault(b, 2, toggled(right(b, 2), 5, false));
    expect(f!.words).toBe(
      "5 is still standing. The clue says the digits add to 7, and 5's digits are 0 and 5, which add to 5.",
    );
  });
});

describe('Jar Clues hints', () => {
  it('lights every wrong number in the lowest row that has one, and says the working', () => {
    const b: Board = { level: 1, count: 22, clues: ['fewer-35', 'more-5', 'ends-2'].map(clueById) };
    const h = hint(b, 1, fresh())!;
    expect(h.row).toBe(3);
    expect(h.lit).toEqual([35, 36, 37, 38, 39, 40]);
    expect(h.kind).toBe('cross');
    expect(h.words).toBe(
      'The clue says fewer than 35. In this row 35 to 40 are not fewer than 35. Cross them off.',
    );
    const back = hint(b, 1, toggled(right(b, 1), 34))!;
    expect(back.kind).toBe('bring');
    expect(back.words).toBe('34 fits every clue so far. Bring it back.');
    expect(hint(b, 1, right(b, 1))).toBeNull();
  });

  it('following hints makes one more row right each time and reaches the board that holds in at most six', () => {
    const rng = new Rng(77);
    for (const level of [1, 2])
      for (const b of boards(level, 60, 9000 + level * 100))
        for (let k = 1; k <= b.clues.length; k++) {
          // A wrong board: the right one with some numbers flipped, or the untouched board.
          let m = rng.chance(0.3) ? fresh() : right(b, k);
          for (let j = 0; j < rng.int(0, 12); j++) m = toggled(m, rng.int(1, 60));
          let steps = 0;
          for (let h = hint(b, k, m); h; h = hint(b, k, m)) {
            const wrongRowsBefore = new Set(wrongNumbers(b, k, m).map(rowOf));
            const next = follow(b, k, m, h);
            const wrongRowsAfter = new Set(wrongNumbers(b, k, next).map(rowOf));
            expect(wrongRowsAfter.has(h.row)).toBe(false);
            expect(wrongRowsAfter.size).toBe(wrongRowsBefore.size - 1);
            // Other rows are left as they were.
            NUMBERS.filter((n) => rowOf(n) !== h.row).forEach((n) => expect(next[n - 1]).toBe(m[n - 1]));
            m = next;
            steps++;
          }
          expect(steps).toBeLessThanOrEqual(6);
          expect(holds(b, k, m)).toBe(true);
        }
  });

  it('runs read as ranges', () => {
    expect(runs([1, 2, 3, 4, 5])).toBe('1 to 5');
    expect(runs([21, 23, 25])).toBe('21, 23 and 25');
    expect(runs([1, 2, 3, 8, 9])).toBe('1 to 3, 8 and 9');
  });
});

describe('Jar Clues guess and last choice', () => {
  it('the guess and the last choice are not part of the check, so they can never be a miss or a hint', () => {
    // The check and the hint read only the board, the clue count and the marks: their signatures have no guess or choice.
    expect(fault.length).toBe(3);
    expect(hint.length).toBe(3);
    expect(holds.length).toBe(3);
  });
});

describe('Jar Clues jar', () => {
  it('fills the jar to the count’s share: 30 half fills it', () => {
    expect(fillShare(30)).toBe(0.5);
    expect(fillShare(60)).toBe(1);
  });

  it('stands the pile within one pebble of the count’s share, and rises with the count', () => {
    let prev = 0;
    for (let count = 6; count <= 60; count++) {
      const top = pileTop(pile(count, new Rng(count * 13)));
      expect(Math.abs(top - fillShare(count) * JAR.h)).toBeLessThanOrEqual(2 * PEBBLE_R);
      if (count % 9 === 0) {
        expect(top).toBeGreaterThan(prev);
        prev = top;
      }
    }
  });

  it('separates the last numbers by several pebbles’ height', () => {
    for (const level of [1, 2])
      for (const b of boards(level, 60, 4000)) {
        const last = lastStanding(b);
        for (let i = 1; i < last.length; i++)
          expect((fillShare(last[i]) - fillShare(last[i - 1])) * JAR.h).toBeGreaterThanOrEqual(2 * PEBBLE_R);
      }
  });
});

describe('Jar Clues ghost finger', () => {
  it('sweeps only numbers its stroke makes right, and reaches the board that holds at every clue', () => {
    for (const level of PLANS.map((p) => p.level))
      for (const b of boards(level, 40, 12000)) {
        let m = fresh();
        for (let k = 1; k <= b.clues.length; k++) {
          let strokes = 0;
          for (let run = sweepRun(b, k, m); run; run = sweepRun(b, k, m)) {
            const crossed = !m[run[0] - 1];
            const ok = new Set(allowedBy(b.clues.slice(0, k)));
            for (const n of run) expect(!ok.has(n)).toBe(crossed);
            for (const n of run) m = toggled(m, n, crossed);
            expect(++strokes).toBeLessThan(40);
          }
          expect(holds(b, k, m)).toBe(true);
        }
      }
  });
});
