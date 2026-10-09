import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { distance, EXPLORE_HEIGHTS, FLOORS, HEIGHTS, judgeFair, makeQuestions, makeStars, onStar, PLANS, rampTouch, waysTo, type Setup } from './logic';

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
  it("the ghost finger plays every level through without a wrong move, never taps the floor where it cannot change, and never presses go on a miss", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        const stars = plan.mode === 'height' || plan.mode === 'both' ? makeStars(plan, rng) : [];
        const questions = plan.mode === 'fair' ? makeQuestions(rng, plan.rounds) : [];
        const fresh = (): Setup[] => (plan.mode === 'fair' ? [{ height: 3, floor: 'wood' }, { height: 3, floor: 'wood' }] : [{ height: plan.mode === 'height' ? 2 : 3, floor: 'wood' }]);
        let lanes = fresh();
        let index = 0;
        let rolls = 0;
        let touches = 0;
        const heights: number[] = [];
        const total = plan.mode === 'explore' ? plan.rounds : plan.mode === 'fair' ? questions.length : stars.length;
        while ((plan.mode === 'explore' ? rolls : index) < total) {
          expect(++touches, `${plan.mode} seed ${seed}: finishes`).toBeLessThan(40);
          const move = rampTouch(plan, lanes, { star: stars[index], question: questions[index], rolls });
          expect(move, `${plan.mode} seed ${seed}: a touch to make`).not.toBeNull();
          if (move === 'go') {
            if (plan.mode === 'explore') { heights.push(lanes[0].height); rolls++; continue; }
            if (plan.mode === 'fair') {
              expect(judgeFair(questions[index], lanes[0], lanes[1]), 'a fair test').toBe('fair');
              lanes = fresh();
            } else {
              // The setup stays as the child left it for the next star; only a fair test starts over.
              expect(onStar(distance(lanes[0].height, lanes[0].floor), stars[index]), 'the roll reaches the star').toBe(true);
            }
            index++;
            continue;
          }
          const lane = lanes[move!.lane];
          if (move!.change === 'ramp') lane.height = HEIGHTS[(HEIGHTS.indexOf(lane.height as 2 | 3 | 4) + 1) % HEIGHTS.length];
          else {
            expect(['both', 'fair']).toContain(plan.mode);
            lane.floor = FLOORS[(FLOORS.indexOf(lane.floor) + 1) % FLOORS.length];
          }
        }
        // Explore: each roll beside the last is a different height, so higher goes farther is visible.
        if (plan.mode === 'explore') expect(heights).toEqual([...EXPLORE_HEIGHTS].slice(0, plan.rounds));
      }
    }
  });
});
