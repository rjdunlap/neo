import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { beside, eaten, makePuzzle, PLANS, slide, solve, tapDirection, type SlidePuzzle } from './logic';

const tiny: SlidePuzzle = { cols: 4, rows: 3, rocks: [{ x: 3, y: 1 }], soft: [{ x: 1, y: 2 }], start: { x: 0, y: 0 }, fish: [{ x: 2, y: 2 }], best: 0 };

describe('Penguin Slide', () => {
  it('slides until a rock, the edge or soft snow, eating fish on the way', () => {
    expect(slide(tiny, { x: 0, y: 0 }, 0).to).toEqual({ x: 3, y: 0 });
    expect(slide(tiny, { x: 0, y: 1 }, 0).to).toEqual({ x: 2, y: 1 }); // stops before the rock
    expect(slide(tiny, { x: 1, y: 0 }, 1).to).toEqual({ x: 1, y: 2 }); // into the soft snow
    expect(slide(tiny, { x: 0, y: 0 }, 2).passed).toHaveLength(0); // already at the edge
    expect(eaten(tiny, slide(tiny, { x: 1, y: 2 }, 0).passed)).toBe(1);
    // Down to the corner, right into the soft snow, then right again past the fish.
    expect(solve(tiny, tiny.start)).toEqual({ moves: 3, first: 1 });
    // The soft snow is in the way here: without it, down then right slides straight past the fish.
    expect(solve({ ...tiny, soft: [] }, tiny.start)).toEqual({ moves: 2, first: 1 });
  });

  it('every puzzle needs the planned number of slides, with nothing stacked on anything else', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 150; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        expect(p.best).toBeGreaterThanOrEqual(plan.moves[0]);
        expect(p.best).toBeLessThanOrEqual(plan.moves[1]);
        expect(solve(p, p.start).moves).toBe(p.best);
        const all = [p.start, ...p.rocks, ...p.soft, ...p.fish].map((c) => `${c.x},${c.y}`);
        expect(new Set(all).size).toBe(all.length);
        expect(p.fish).toHaveLength(plan.fish);
      }
    }
  });

  it('following the hint arrow always eats every fish in the fewest slides', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        let at = p.start;
        let have = 0;
        let used = 0;
        while (have !== (1 << p.fish.length) - 1) {
          const { first } = solve(p, at, have);
          expect(first).not.toBe(-1);
          const s = slide(p, at, first as 0);
          have |= eaten(p, s.passed);
          at = s.to;
          used++;
        }
        expect(used).toBe(p.best);
      }
    }
  });

  it('has a tap the ghost finger can make for every slide of a fewest route, which sends the penguin that way and finishes in the fewest', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        let at = p.start;
        let have = 0;
        let moves = 0;
        while (have !== (1 << p.fish.length) - 1 && moves < 40) {
          const { first } = solve(p, at, have);
          expect(first).toBeGreaterThanOrEqual(0);
          const tap = beside(at, first as 0 | 1 | 2 | 3);
          expect(tap.x).toBeGreaterThanOrEqual(0);
          expect(tap.x).toBeLessThan(p.cols);
          expect(tap.y).toBeGreaterThanOrEqual(0);
          expect(tap.y).toBeLessThan(p.rows);
          // The tap lands beside the penguin and the game reads it as the same direction.
          expect(tapDirection(tap.x - at.x, tap.y - at.y)).toBe(first);
          const { to, passed } = slide(p, at, tapDirection(tap.x - at.x, tap.y - at.y));
          expect(passed.length).toBeGreaterThan(0);
          have |= eaten(p, passed);
          at = to;
          moves++;
        }
        expect(moves).toBe(p.best);
      }
    }
  });
});
