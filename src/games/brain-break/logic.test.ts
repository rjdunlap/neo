import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { evaluate, hintIndex, judge, layoutFor, makeBoard, makeLabels, MINUS, planFor } from './logic';
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
  it('clamps the ladder to 1..6', () => {
    expect(planFor(0)).toBe(planFor(1));
    expect(planFor(7)).toBe(planFor(6));
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
