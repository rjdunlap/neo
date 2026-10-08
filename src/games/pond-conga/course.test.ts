import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseMinimum, coursePonds, isCongaCourse } from './course';
import { distances, lowerBound, startState, step } from './logic';

describe('the Crumb Trail course', () => {
  const course = COURSES.conga;
  const ponds = coursePonds('conga');

  it('is four ponds that climb from a few crumbs to a dozen', () => {
    expect(course.version).toBe(1);
    expect(ponds).toHaveLength(4);
    expect(ponds.map((p) => p.crumbs.length)).toEqual([6, 8, 10, 12]);
    expect(ponds.map((p) => p.pads.length)).toEqual([3, 8, 13, 17]);
    expect(isCongaCourse('conga')).toBe(true);
    expect(isCongaCourse('ponds')).toBe(false);
  });

  it('has a worked-out fewest for every pond, equal to the shortest the crumbs allow, never a typed number', () => {
    expect(courseBest('conga')).toEqual(ponds.map((p) => lowerBound(p)));
    expect(courseBest('conga')).toEqual([34, 50, 77, 98]);
    expect(courseMinimum('conga')).toBe(259);
  });

  it('can be played with no bonk, in exactly its fewest steps, by the route the solver found', () => {
    for (const p of ponds) {
      let s = startState(p);
      for (const d of p.route) {
        const r = step(p, s, d);
        expect(r.event).not.toBe('bonk');
        s = r.state;
      }
      expect(s.eaten).toBe(p.crumbs.length);
      expect(p.route).toHaveLength(p.par);
    }
  });

  it('is all one pond in each case: no corner is walled off, nothing is on a lily pad', () => {
    for (const p of ponds) {
      expect(distances(p, p.start[0]).filter((d) => d >= 0).length).toBe(p.cols * p.rows - p.pads.length);
      for (const c of p.crumbs) expect(p.pads.some((q) => q.x === c.x && q.y === c.y)).toBe(false);
      expect(p.start).toHaveLength(3);
      expect(p.heading).toBe(0);
    }
  });

  it('moves at one easy-going speed, the same in every pond', () => {
    expect(course.speed).toBeGreaterThanOrEqual(2.5);
    expect(course.speed).toBeLessThanOrEqual(3.6);
  });
});
