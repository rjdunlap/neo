import { describe, expect, it } from 'vitest';
import { Rng } from '../engine/random';
import { nextSpot, routeStep, type Spot } from './focus';

describe('moving a focus ring between spots', () => {
  const row: Spot[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }];

  it('steps to the nearest spot in the direction pushed, and stays put at the end', () => {
    expect(nextSpot(row, 0, 0)).toBe(1);
    expect(nextSpot(row, 1, 0)).toBe(2);
    expect(nextSpot(row, 2, 0)).toBe(2);
    expect(nextSpot(row, 2, 2)).toBe(1);
    expect(nextSpot(row, 1, 3)).toBe(1);
  });

  it('prefers a spot straight ahead to a nearer one off to the side', () => {
    const spots: Spot[] = [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 4, y: 0 }];
    expect(nextSpot(spots, 0, 0)).toBe(2);
    expect(nextSpot(spots, 0, 1)).toBe(1);
  });

  it('finds the way between any two spots of a mirror-sized board', () => {
    const rng = new Rng(11);
    for (let board = 0; board < 300; board++) {
      const cells: Spot[] = [];
      for (let x = 0; x < 7; x++) for (let y = 0; y < 5; y++) cells.push({ x, y });
      const spots = rng.shuffle(cells).slice(0, rng.int(2, 8));
      for (let from = 0; from < spots.length; from++) for (let to = 0; to < spots.length; to++) {
        let at = from, pushes = 0;
        while (at !== to && pushes++ < 20) {
          const dir = routeStep(spots, at, to);
          expect(dir, `board ${board}: ${from} to ${to}`).toBeGreaterThanOrEqual(0);
          at = nextSpot(spots, at, dir);
        }
        expect(at, `board ${board}: ${from} to ${to}`).toBe(to);
      }
    }
  });

  it('says there is no step when already there', () => {
    expect(routeStep(row, 1, 1)).toBe(-1);
  });
});
