import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { distance, FLOORS, HEIGHTS, judgeFair, makeQuestions, makeStars, onStar, PLANS, waysTo } from './logic';

describe('Ramp Race', () => {
  it('higher ramps and slipperier floors always go farther', () => {
    for (const f of FLOORS) for (let i = 1; i < HEIGHTS.length; i++) expect(distance(HEIGHTS[i], f)).toBeGreaterThan(distance(HEIGHTS[i - 1], f));
    for (const h of HEIGHTS) expect(distance(h, 'carpet')).toBeLessThan(distance(h, 'wood')), expect(distance(h, 'wood')).toBeLessThan(distance(h, 'ice'));
  });

  it('every star can be reached, and on the height level by exactly one height on wood', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'height' || p.mode === 'both')) {
      for (let seed = 1; seed <= 200; seed++) {
        const stars = makeStars(plan, new Rng(seed));
        expect(new Set(stars).size).toBe(plan.rounds);
        for (const s of stars) {
          const ways = waysTo(s, plan.mode === 'height' ? ['wood'] : FLOORS);
          expect(ways.length).toBeGreaterThanOrEqual(1);
          if (plan.mode === 'height') expect(ways).toHaveLength(1);
          for (const w of ways) expect(onStar(distance(w.height, w.floor), s)).toBe(true);
        }
      }
    }
  });

  it('a fair test changes only the thing being compared', () => {
    expect(judgeFair({ compare: 'floor' }, { height: 3, floor: 'ice' }, { height: 3, floor: 'carpet' })).toBe('fair');
    expect(judgeFair({ compare: 'floor' }, { height: 4, floor: 'ice' }, { height: 3, floor: 'carpet' })).toBe('unfair');
    expect(judgeFair({ compare: 'height' }, { height: 4, floor: 'wood' }, { height: 2, floor: 'wood' })).toBe('fair');
    expect(judgeFair({ compare: 'height' }, { height: 2, floor: 'wood' }, { height: 2, floor: 'wood' })).toBe('same');
    for (let seed = 1; seed <= 50; seed++) {
      const qs = makeQuestions(new Rng(seed), 3);
      expect(qs.map((q) => q.compare)).toContain('floor');
      expect(qs.map((q) => q.compare)).toContain('height');
    }
  });
});
