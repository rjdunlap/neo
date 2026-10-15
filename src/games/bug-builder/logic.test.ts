import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BUG_PLANS, BUG_TOKENS, bugPuzzle, nextStamp, slotAt, SLOT_REACH, type BugSpot } from './logic';

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
          expect(bugPuzzle(plan, new Rng(seed)).tokens).toContain(next.token);
          expect(slotAt(spots, next.x, next.y)).toBe(next);
          next.filled = true;
          stamps++;
        }
        expect(stamps).toBe(spots.length);
        expect(spots.every((s) => s.filled)).toBe(true);
      }
    }
  });

  it('has a pool big enough for every plan, with no two tokens alike', () => {
    expect(BUG_TOKENS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(BUG_TOKENS.map((t) => `${t.shape}/${t.color}`)).size).toBe(BUG_TOKENS.length);
    for (const plan of BUG_PLANS) expect(plan.colors).toBeLessThanOrEqual(BUG_TOKENS.length);
  });

  it('draws different tokens by seed, never repeating one, and keeps small plans easy to tell apart', () => {
    const seen = new Set<number>();
    for (const plan of BUG_PLANS) for (let seed = 1; seed <= 60; seed++) {
      const { tokens, targets } = bugPuzzle(plan, new Rng(seed));
      tokens.forEach((t) => seen.add(t));
      expect(tokens).toHaveLength(plan.colors);
      expect(new Set(tokens).size).toBe(plan.colors);
      expect(targets.every((s) => tokens.includes(s.token))).toBe(true); // a spare stamp in the tray is fine
      if (plan.colors <= 4) {
        expect(new Set(tokens.map((t) => BUG_TOKENS[t].shape)).size).toBe(plan.colors);
        expect(new Set(tokens.map((t) => BUG_TOKENS[t].color)).size).toBe(plan.colors);
      }
    }
    expect(seen.size).toBe(BUG_TOKENS.length);
  });

  it('a copy board is never symmetric by accident, and a mirror board is an exact reflection', () => {
    for (let seed = 1; seed <= 60; seed++) for (const plan of BUG_PLANS) {
      const { model, targets } = bugPuzzle(plan, new Rng(seed));
      const at = (spots: BugSpot[], x: number, y: number) => spots.find((s) => s.x === x && s.y === y)?.token;
      if (plan.mode === 'copy') {
        expect(targets).toEqual(model);
        expect(model.some((s) => at(model, -s.x, s.y) !== s.token)).toBe(true);
      }
      if (plan.mode === 'mirror') for (const s of model) expect(at(targets, -s.x, s.y)).toBe(s.token);
    }
  });
});
