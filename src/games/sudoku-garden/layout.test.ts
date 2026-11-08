import { describe, expect, it } from 'vitest';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { MIN_TOUCH, touchLayout } from './layout';

const targets = (fit: ReturnType<typeof touchLayout>, n: number): Target[] => [
  {
    what: 'bed',
    x: fit.x + (n * fit.cell) / 2,
    y: fit.y + (n * fit.cell) / 2,
    w: n * fit.cell,
    h: n * fit.cell,
  },
  ...fit.slots.map((s) => ({
    what: `${s.kind}${s.d || ''}`,
    x: s.x + s.w / 2,
    y: s.y + s.h / 2,
    w: s.w,
    h: s.h,
  })),
];

describe('Sudoku Garden touch layout', () => {
  it('keeps the sideways and iPad layouts beside or under the bed, every target at least 64', () => {
    for (const [w, h] of [
      [1024, 768],
      [1366, 768],
      [1024, 1365],
    ])
      for (const n of [4, 6, 9]) {
        const fit = touchLayout(n, w, h, n === 9);
        expect(fit.cell, `${n} at ${w}x${h}`).toBeGreaterThanOrEqual(MIN_TOUCH);
        for (const s of fit.slots)
          expect(Math.min(s.w, s.h), `${s.kind} ${n} at ${w}x${h}`).toBeGreaterThanOrEqual(MIN_TOUCH);
      }
    expect(touchLayout(9, 1024, 768, true).beside).toBe(true);
    expect(touchLayout(9, 1024, 1365, true)).toMatchObject({ beside: false, y: 128 });
  });

  it('fits every bed, its numbers and its buttons on a phone held upright (chunk 31)', () => {
    for (const [name, v] of Object.entries(UPRIGHT_VIEWS))
      for (const n of [4, 6, 9]) {
        const fit = touchLayout(n, v.w, v.h, n === 9);
        expect(uprightProblems(v, targets(fit, n), MIN_TOUCH), `${name} ${n} by ${n}`).toEqual([]);
      }
  });
});
