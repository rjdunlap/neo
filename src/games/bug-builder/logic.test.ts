import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BUG_PLANS, bugPuzzle, nextStamp, slotAt, SLOT_REACH, type BugSpot } from './logic';

type Spot = BugSpot & { filled: boolean };
const board = (plan: (typeof BUG_PLANS)[number], seed: number): Spot[] => bugPuzzle(plan, new Rng(seed)).targets.map((s) => ({ ...s, filled: false }));

describe('Bug Builder', () => {
  it('keeps every spot clear of its neighbours, so a stamp let go on one cannot land in another', () => {
    for (const plan of BUG_PLANS) {
      const spots = board(plan, 3);
      for (const a of spots) for (const b of spots) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(2 * SLOT_REACH - 1);
    }
  });

  it('finds the empty spot a stamp is let go on, and ignores a filled spot or open ground', () => {
    const spots = board(BUG_PLANS[0], 1);
    expect(slotAt(spots, spots[0].x + 10, spots[0].y - 10)).toBe(spots[0]);
    expect(slotAt(spots, 0, 400)).toBeUndefined();
    spots[0].filled = true;
    expect(slotAt(spots, spots[0].x, spots[0].y)).toBeUndefined();
  });

  it('the ghost finger fills every spot of every level with the right color and never a wrong one', () => {
    for (const plan of BUG_PLANS) {
      for (let seed = 1; seed <= 50; seed++) {
        const spots = board(plan, seed);
        let stamps = 0;
        for (let next = nextStamp(spots); next; next = nextStamp(spots)) {
          // The tray has a stamp for this color, and letting it go on the spot's middle lands on that spot and no other.
          expect(next.token).toBeLessThan(plan.colors);
          expect(slotAt(spots, next.x, next.y)).toBe(next);
          next.filled = true;
          stamps++;
        }
        expect(stamps).toBe(spots.length);
        expect(spots.every((s) => s.filled)).toBe(true);
      }
    }
  });
});
