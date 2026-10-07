import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { choices, gridFor, inside, makeRound, nearestGroup, PLANS, scatter } from './logic';

describe('Lasso Loops', () => {
  it('has enough fireflies for every jar, and a question whose answer is what was caught', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 300; seed++) {
      const r = makeRound(plan, new Rng(seed));
      const wanted = r.jars.reduce((s, n) => s + n, 0);
      expect(r.fireflies).toBeGreaterThanOrEqual(wanted);
      switch (plan.mode) {
        case 'exact':
          expect(r.jars.every((n) => n === 2 || n === 3)).toBe(true);
          expect(r.fireflies).toBeGreaterThan(wanted);
          break;
        case 'fives':
          expect(r.jars.every((n) => n === 5)).toBe(true);
          expect(r.answer).toBe(r.fireflies);
          expect(r.ones).toBe(r.fireflies - wanted);
          expect(r.ones >= 1 && r.ones <= 4).toBe(true);
          break;
        case 'tens':
          expect(r.jars.every((n) => n === 10)).toBe(true);
          expect(r.answer).toBe(10 * r.jars.length + r.ones);
          expect(r.ones >= 1 && r.ones <= 9).toBe(true);
          break;
        case 'groups':
          expect(r.answer).toBe(r.group!.count * r.group!.size);
          expect(r.jars).toEqual(Array(r.group!.count).fill(r.group!.size));
          // A few extras, so the last group still takes counting.
          expect(r.fireflies - wanted).toBeGreaterThanOrEqual(2);
          break;
      }
      if (r.answer !== null) {
        const c = choices(r, new Rng(seed));
        expect(c).toHaveLength(3);
        expect(c).toContain(r.answer);
        expect(new Set(c).size).toBe(3);
        for (const v of c) expect(v).toBeGreaterThan(0);
      }
    }
  });

  it('offers the swapped tens and ones as a choice when they differ', () => {
    let swapped = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const r = makeRound(PLANS[3], new Rng(seed));
      const c = choices(r, new Rng(seed + 1000));
      const tens = Math.floor(r.answer! / 10);
      if (c.includes(r.ones * 10 + tens)) swapped++;
    }
    expect(swapped).toBeGreaterThan(40);
  });

  it('spreads fireflies one to a cell, inside the area', () => {
    for (const n of [8, 9, 16, 24, 39]) for (let seed = 1; seed <= 50; seed++) {
      const { cols, rows } = gridFor(n);
      expect(cols * rows).toBeGreaterThanOrEqual(n);
      const pts = scatter(n, new Rng(seed), cols, rows);
      expect(pts).toHaveLength(n);
      for (const p of pts) expect(p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1).toBe(true);
      // Neighbors keep at least a little room between them for a loop to pass.
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) expect(Math.hypot((pts[i].x - pts[j].x) * cols, (pts[i].y - pts[j].y) * rows)).toBeGreaterThan(0.5);
    }
  });

  it('knows what a loop goes around, even a bent one', () => {
    const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    expect(inside(square, { x: 5, y: 5 })).toBe(true);
    expect(inside(square, { x: 15, y: 5 })).toBe(false);
    // A "C" shape: its open middle is outside.
    const c = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 7 }, { x: 10, y: 7 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    expect(inside(c, { x: 1, y: 5 })).toBe(true);
    expect(inside(c, { x: 7, y: 5 })).toBe(false);
  });

  it('picks a close group of free fireflies for the hint', () => {
    const pts = scatter(12, new Rng(3), 6, 3);
    const free = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const g = nearestGroup(pts, free, 4);
    expect(g).toHaveLength(4);
    expect(new Set(g).size).toBe(4);
    for (const i of g) expect(free).toContain(i);
    expect(nearestGroup(pts, [1, 2], 3)).toEqual([]);
  });
});
