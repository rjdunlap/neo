import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor } from '../../progress/difficulty';
import { AUTHORED, LEVELS, canGrow, deepest, hintKnot, plantResult, roundFor } from './logic';

describe('Down We Go rules', () => {
  it('has the authored dives and their answers', () => {
    const [a, b, c] = AUTHORED[1];
    expect([a.light, b.light, c.light]).toEqual([
      [8, 4, 0],
      [8, 1, 0],
      [8, 4, 2, 0],
    ]);
    expect([deepest(a), deepest(b), deepest(c)]).toEqual([1, 0, 2]);
    expect(AUTHORED[2][0].light).toEqual([8, 8, 4, 1, 0]);
    expect(deepest(AUTHORED[2][0])).toBe(2);
  });

  it('keeps the bands as defined', () => {
    expect(rangeFor(LEVELS, 'prek')).toEqual({ min: 1, max: 2 });
    expect(rangeFor(LEVELS, 'school')).toEqual({ min: 2, max: 2 });
  });

  it.each([1, 2])('level %i: every seeded dive is fair', (level) => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const d of roundFor(level, new Rng(seed))) {
        expect(d.light[0]).toBe(8);
        d.light.forEach((n, k) => k && expect(n).toBeLessThanOrEqual(d.light[k - 1]));
        const deep = deepest(d);
        expect(d.light.some((_, k) => !canGrow(d, k))).toBe(true);
        expect(deep).toBeLessThan(d.light.length - 1);
        d.light.forEach((_, k) => expect(canGrow(d, k)).toBe(k <= deep));
      }
    }
  });

  it('level 1 rounds start authored, vary the answer and repeat for a seed', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const r = roundFor(1, new Rng(seed));
      expect(r[0].light).toEqual([8, 4, 0]);
      expect(r).toHaveLength(3);
      expect(new Set(r.map(deepest)).size).toBeGreaterThanOrEqual(2);
      expect(r.every((d) => d.need === 2 && d.light.length >= 3 && d.light.length <= 4)).toBe(true);
    }
    expect(roundFor(1, new Rng(5))).toEqual(roundFor(1, new Rng(5)));
    expect(roundFor(1, new Rng(5), true).map(deepest)).toEqual([1, 0, 2]);
  });

  it('level 2 rounds have five knots, two needs and an answer below the top somewhere', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const r = roundFor(2, new Rng(seed));
      expect(r[0].light).toEqual([8, 8, 4, 1, 0]);
      expect(r.every((d) => d.light.length === 5)).toBe(true);
      expect(new Set(r.map((d) => d.need)).size).toBeGreaterThanOrEqual(2);
      expect(r.some((d) => deepest(d) > 0)).toBe(true);
      expect(r.every((d) => deepest(d) < 4)).toBe(true);
    }
  });

  it('counts only a measured too-dark ledge', () => {
    const d = AUTHORED[1][0];
    expect(plantResult(d, 2, false)).toBe('unmeasured-dark');
    expect(plantResult(d, 2, true)).toBe('dark');
    expect(plantResult(d, 0, true)).toBe('shallower');
    expect(plantResult(d, 1, true)).toBe('deepest');
    expect(plantResult(d, 1, false)).toBe('unmeasured-grows');
  });

  it('sends the hint to the deepest knot', () => {
    for (const d of [...AUTHORED[1], ...AUTHORED[2]]) expect(hintKnot(d)).toBe(deepest(d));
  });
});
