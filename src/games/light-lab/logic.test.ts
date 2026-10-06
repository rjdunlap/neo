import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { flowerCount, hintMirror, makePuzzle, PLANS, reflect, solved, tiltFor, trace, type Dir, type Tilt } from './logic';

describe('Light Lab', () => {
  it('mirrors turn the beam a quarter, and the right tilt is found for every turn', () => {
    expect(reflect(0, 0)).toBe(3); // right into "/" goes up
    expect(reflect(0, 1)).toBe(1); // right into "\" goes down
    expect(reflect(1, 0)).toBe(2);
    expect(reflect(3, 1)).toBe(2);
    for (const from of [0, 1, 2, 3] as Dir[]) for (const to of [(from + 1) % 4, (from + 3) % 4] as Dir[]) expect(reflect(from, tiltFor(from, to))).toBe(to);
  });

  it('every puzzle has a known answer and starts unsolved, with the planned pieces', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        expect(solved(p, p.solution), `${plan.name} ${seed}`).toBe(true);
        expect(solved(p, p.start)).toBe(false);
        expect(flowerCount(p)).toBe(plan.flowers);
        expect(p.pathMirrors).toHaveLength(plan.turns);
        expect(p.things.filter((t) => t.kind === 'mirror')).toHaveLength(plan.turns + plan.decoys);
        expect(p.things.filter((t) => t.kind === 'rock')).toHaveLength(plan.rocks);
        // Nothing overlaps, nothing sits on the sun's column, everything is on the board.
        expect(new Set(p.things.map((t) => `${t.x},${t.y}`)).size).toBe(p.things.length);
        for (const t of p.things) {
          expect(t.x).toBeGreaterThanOrEqual(1);
          expect(t.x).toBeLessThan(p.cols);
          expect(t.y).toBeGreaterThanOrEqual(0);
          expect(t.y).toBeLessThan(p.rows);
        }
      }
    }
  });

  it('colored glass matters: without passing through it, the pink flower stays asleep', () => {
    const plan = PLANS.find((p) => p.glass)!;
    for (let seed = 1; seed <= 100; seed++) {
      const p = makePuzzle(plan, new Rng(seed));
      const pink = p.things.findIndex((t) => t.kind === 'flower' && t.wants === 'pink');
      const glass = p.things.find((t) => t.kind === 'glass' && t.tint === 'pink')!;
      const path = trace(p, p.solution).cells;
      const g = path.findIndex((c) => c.x === glass.x && c.y === glass.y);
      const f = path.findIndex((c) => c.x === p.things[pink].x && c.y === p.things[pink].y);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThan(f);
    }
  });

  it('following the hints always reaches the answer', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        const tilts = [...p.start] as Tilt[];
        for (let step = 0; step < 10 && !solved(p, tilts); step++) {
          const m = hintMirror(p, tilts);
          expect(m).toBeGreaterThanOrEqual(0);
          tilts[m] = (1 - tilts[m]) as Tilt;
        }
        expect(solved(p, tilts)).toBe(true);
      }
    }
  });
});
