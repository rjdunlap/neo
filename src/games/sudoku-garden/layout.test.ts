import { describe, expect, it } from 'vitest';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { MIN_TOUCH, PHONE_BUTTON, touchLayout } from './layout';

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

  it('gives a thumb the room on an upright phone: 84-unit squares at 9 by 9, big numbers and 88-unit buttons', () => {
    const v = UPRIGHT_VIEWS.phone;
    const nine = touchLayout(9, v.w, v.h, true);
    expect(nine).toMatchObject({ cell: 84, tile: 100, y: 220 });
    // Two rows of numbers, five then four, each row centred.
    const digits = nine.slots.filter((s) => s.kind === 'digit');
    expect(new Set(digits.map((s) => s.y)).size).toBe(2);
    expect(digits[0].x + digits[4].x + digits[4].w).toBeCloseTo(v.w);
    expect(digits[5].x + digits[8].x + digits[8].w).toBeCloseTo(v.w);
    expect(touchLayout(6, v.w, v.h, false)).toMatchObject({ cell: 96, tile: 100 });
    expect(touchLayout(4, v.w, v.h, false)).toMatchObject({ cell: 96, tile: 100, y: 128 });
    for (const [name, view] of Object.entries(UPRIGHT_VIEWS))
      for (const n of [4, 6, 9]) {
        const fit = touchLayout(n, view.w, view.h, n === 9);
        for (const s of fit.slots.filter((s) => s.kind !== 'digit'))
          expect(s.h, `${name} ${n} ${s.kind}`).toBe(PHONE_BUTTON);
        // A short view shrinks the bed, never the numbers under 72 or anything under the minimum.
        expect(fit.tile, `${name} ${n}`).toBeGreaterThanOrEqual(72);
        expect(fit.cell, `${name} ${n}`).toBeGreaterThanOrEqual(n === 9 ? 72 : 96);
        const last = fit.slots[fit.slots.length - 1];
        expect(last.y + last.h + 20, `${name} ${n}`).toBeLessThanOrEqual(view.h);
      }
  });
});
