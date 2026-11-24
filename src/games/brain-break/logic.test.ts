import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  evaluate,
  hintIndex,
  judge,
  layoutFor,
  LOOKS,
  makeBoard,
  makeLabels,
  makeTrail,
  makeValues,
  orderSign,
  speakNumber,
  writeNumber,
  MINUS,
  pickLook,
  planFor,
  ruleSign,
  showsSums,
  STEPS,
  trailOrder,
  trailValue,
} from './logic';
import { square, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';

describe('Brain Break number order', () => {
  it('gives every number exactly once and always has a next-number hint', () => {
    for (let level = 1; level <= 3; level++)
      for (let seed = 1; seed <= 100; seed++) {
        const board = makeBoard(level, new Rng(seed)),
          count = planFor(level).side ** 2;
        expect([...board].sort((a, b) => a - b)).toEqual(Array.from({ length: count }, (_, i) => i + 1));
        for (let next = 1; next <= count; next++) {
          expect(judge(board[hintIndex(board, next)], next)).toBe('right');
          for (const value of board)
            expect(judge(value, next)).toBe(value < next ? 'done' : value === next ? 'right' : 'wrong');
        }
        expect(hintIndex(board, count + 1)).toBe(-1);
      }
  });
  it('is seeded, and produces fresh arrangements', () => {
    expect(makeBoard(3, new Rng(4))).toEqual(makeBoard(3, new Rng(4)));
    expect(
      new Set(Array.from({ length: 20 }, (_, seed) => makeBoard(3, new Rng(seed + 1)).join(','))).size,
    ).toBe(20);
  });
  it('keeps full-size targets on screen, separated from help and the guide', () => {
    for (const [w, h] of [
      [1024, 768],
      [1365, 768],
      [1024, 1365],
      [1180, 820],
    ])
      for (const side of [3, 4, 5]) {
        const layout = layoutFor(w, h, side);
        expect(layout.size).toBeGreaterThanOrEqual(100);
        for (const p of layout.stones) {
          expect(p.x - 50).toBeGreaterThan(150);
          expect(p.x + 50).toBeLessThan(w);
          expect(p.y - 50).toBeGreaterThan(150);
          expect(p.y + 50).toBeLessThan(h - 30);
          expect(Math.abs(p.x - layout.hint.x) >= 116 || Math.abs(p.y - layout.hint.y) >= 100).toBe(true);
        }
      }
  });
});

describe('Brain Break sums in order (levels 4–6)', () => {
  const parts = (text: string) => /^(\d+)([+\u2212])(\d+)$/.exec(text)!;
  it('clamps the ladder to 1..10', () => {
    expect(planFor(0)).toBe(planFor(1));
    expect(planFor(11)).toBe(planFor(10));
    expect([4, 5, 6].map((l) => planFor(l).side)).toEqual([3, 4, 5]);
  });
  it('labels every stone with a short sum or take-away that makes its total, within the operand bounds', () => {
    for (let level = 4; level <= 6; level++)
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed),
          board = makeBoard(level, rng),
          labels = makeLabels(board, level, rng);
        const count = planFor(level).side ** 2;
        expect([...board].sort((a, b) => a - b)).toEqual(Array.from({ length: count }, (_, i) => i + 1));
        let sums = 0,
          takes = 0;
        labels.forEach((text, i) => {
          expect(evaluate(text)).toBe(board[i]);
          expect(text.length).toBeLessThanOrEqual(4);
          const [, a, op, b] = parts(text),
            x = Number(a),
            y = Number(b);
          if (op === '+') {
            sums++;
            if (board[i] === 1) expect(text).toBe('1+0');
            else {
              expect(Math.min(x, y)).toBeGreaterThanOrEqual(1);
              if (level === 4) expect(Math.max(x, y)).toBeLessThanOrEqual(8);
              else expect(Math.min(x, y)).toBeLessThanOrEqual(9);
            }
          } else {
            takes++;
            expect(op).toBe(MINUS);
            expect(y).toBeGreaterThanOrEqual(1);
            expect(y).toBeLessThanOrEqual(9);
            expect(x).toBeLessThanOrEqual(30);
          }
        });
        if (level < 6) expect(takes).toBe(0);
        else {
          expect(sums).toBeGreaterThanOrEqual(10);
          expect(takes).toBeGreaterThanOrEqual(10);
        }
        for (let next = 1; next <= count; next++) expect(evaluate(labels[hintIndex(board, next)])).toBe(next);
      }
  });
  it('varies the addends on a 4×4 board, rather than all +1', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed),
        board = makeBoard(5, rng),
        labels = makeLabels(board, 5, rng);
      const small = new Set(
        labels
          .filter((_, i) => board[i] > 1)
          .map((t) => {
            const [, a, , b] = parts(t);
            return Math.min(+a, +b);
          }),
      );
      expect(small.size).toBeGreaterThanOrEqual(3);
    }
  });
  it('keeps plain numbers at levels 1–3 and is seeded', () => {
    const board = makeBoard(2, new Rng(3));
    expect(makeLabels(board, 2, new Rng(3))).toEqual(board.map(String));
    const deal = (seed: number) => {
      const rng = new Rng(seed),
        b = makeBoard(6, rng);
      return makeLabels(b, 6, rng);
    };
    expect(deal(9)).toEqual(deal(9));
    expect(deal(9)).not.toEqual(deal(10));
  });
});

describe('Brain Break on a phone held upright (chunk 31)', () => {
  it('fits every board and the help stone in each upright view', () => {
    for (const [name, v] of Object.entries(UPRIGHT_VIEWS))
      for (const side of [3, 4, 5]) {
        const layout = layoutFor(v.w, v.h, side);
        const targets = [
          ...layout.stones.map((p, i) => square(`stone ${i}`, p, layout.size)),
          { what: 'help', ...layout.hint, w: 132, h: 100 },
        ];
        expect(uprightProblems(v, targets), `${name} side ${side}`).toEqual([]);
      }
  });
});

describe('Brain Break trail and pond looks', () => {
  it('walks the stones in rank order, touching every stone once', () => {
    for (let level = 1; level <= 6; level++)
      for (let seed = 1; seed <= 50; seed++) {
        const board = makeBoard(level, new Rng(seed)),
          order = trailOrder(board);
        expect(order.map((i) => board[i])).toEqual(board.map((_, i) => i + 1));
        expect(new Set(order).size).toBe(board.length);
        expect(order[0]).toBe(hintIndex(board, 1));
      }
  });
  it('has three looks, all of which come up, and a look is drawn after the board so boards do not change', () => {
    expect(Object.keys(LOOKS)).toHaveLength(3);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const rng = new Rng(seed),
        board = makeBoard(2, rng);
      makeLabels(board, 2, rng);
      seen.add(pickLook(rng));
      const again = new Rng(seed);
      expect(makeBoard(2, again)).toEqual(board);
      expect(pickLook(new Rng(seed))).toBe(pickLook(new Rng(seed)));
    }
    expect(seen.size).toBe(3);
  });
});

describe('Brain Break count by (levels 7–8)', () => {
  const rounds = (level: number) =>
    Array.from({ length: 80 }, (_, seed) => {
      const rng = new Rng(seed),
        board = makeBoard(level, rng);
      makeLabels(board, level, rng);
      pickLook(rng);
      return { board, trail: makeTrail(level, rng) };
    });

  it('keeps levels 1–6 giving the boards they gave before', () => {
    for (let level = 1; level <= 6; level++) {
      const a = new Rng(5),
        b = new Rng(5);
      expect(makeBoard(level, a)).toEqual(makeBoard(level, b));
      expect(showsSums(level)).toBe(level >= 4);
    }
  });

  it('level 7 counts up by k from k to 16k with a step from the pool', () => {
    for (const { trail } of rounds(7)) {
      expect(STEPS[7]).toContain(trail.step);
      expect(trail.back).toBe(false);
      const values = Array.from({ length: 16 }, (_, i) => trailValue(trail, i + 1));
      expect(values).toEqual(Array.from({ length: 16 }, (_, i) => trail.step * (i + 1)));
    }
  });

  it('level 8 fills k to 25k in three digits, counting back about half the time', () => {
    let back = 0;
    for (const { trail } of rounds(8)) {
      expect(STEPS[8]).toContain(trail.step);
      const values = Array.from({ length: 25 }, (_, i) => trailValue(trail, i + 1));
      expect(Math.max(...values)).toBe(25 * trail.step);
      expect(Math.min(...values)).toBe(trail.step);
      expect(Math.max(...values)).toBeLessThan(1000);
      if (trail.back) {
        back++;
        expect(values).toEqual([...values].sort((x, y) => y - x));
      } else expect(values).toEqual([...values].sort((x, y) => x - y));
    }
    expect(back).toBeGreaterThan(15);
    expect(back).toBeLessThan(65);
  });

  it('the sign names the rule and the last lit number, never the answer; the hint stone is the next rank', () => {
    const [{ board, trail }] = rounds(8);
    const t = { ...trail, back: false, step: 7 };
    expect(ruleSign(t, 1)).toBe('Count by 7 · start at 7');
    expect(ruleSign(t, 3)).toBe('Count by 7 · after 14');
    expect(ruleSign({ ...t, back: true }, 1)).toBe('Count back by 7 · start at 175');
    expect(ruleSign({ ...t, back: true }, 2)).toBe('Count back by 7 · after 175');
    for (let next = 1; next <= 25; next++) expect(board[hintIndex(board, next)]).toBe(next);
  });

  it('is seeded', () => {
    expect(rounds(8).map((r) => r.trail)).toEqual(rounds(8).map((r) => r.trail));
  });
});

describe('Brain Break smallest first (levels 9–10)', () => {
  const swapped = (values: number[]) =>
    values.some(
      (v) => v >= 10 && values.includes((v % 10) * 10 + Math.floor(v / 10)) && v % 10 !== Math.floor(v / 10),
    );
  it('level 9 holds sixteen different numbers from 1 to 99 with a swapped-digit pair, smallest first', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const values = makeValues(9, new Rng(seed));
      expect(values).toHaveLength(16);
      expect(new Set(values).size).toBe(16);
      expect(values.every((v) => v >= 1 && v <= 99)).toBe(true);
      expect(values).toEqual([...values].sort((a, b) => a - b));
      expect(swapped(values)).toBe(true);
    }
  });
  it('level 10 holds twenty-five different numbers from -20 to 20, eight each side of zero, with n and -n', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const values = makeValues(10, new Rng(seed));
      expect(values).toHaveLength(25);
      expect(new Set(values).size).toBe(25);
      expect(values.every((v) => v >= -20 && v <= 20)).toBe(true);
      expect(values.filter((v) => v < 0).length).toBeGreaterThanOrEqual(8);
      expect(values.filter((v) => v > 0).length).toBeGreaterThanOrEqual(8);
      expect(values.some((v) => v > 0 && values.includes(-v))).toBe(true);
    }
  });
  it('is seeded, and the board still tells the hint stone for the smallest unlit number', () => {
    expect(makeValues(10, new Rng(4))).toEqual(makeValues(10, new Rng(4)));
    const rng = new Rng(7),
      board = makeBoard(10, rng),
      values = makeValues(10, rng);
    for (let next = 1; next <= 25; next++) {
      const lit = board.map((rank) => (rank >= next ? values[rank - 1] : Infinity));
      expect(values[board[hintIndex(board, next)] - 1]).toBe(Math.min(...lit));
    }
  });
  it('writes a true minus sign, speaks it aloud, and the sign never names the answer', () => {
    expect(writeNumber(-12)).toBe('\u221212');
    expect(speakNumber(-12)).toBe('minus 12');
    expect(speakNumber(37)).toBe('37');
    expect(orderSign([-5, 3, 9], 1)).toBe('Smallest first');
    expect(orderSign([-5, 3, 9], 3)).toBe('After 3');
    expect(orderSign([-5, 3, 9], 2)).toBe('After \u22125');
  });
});
