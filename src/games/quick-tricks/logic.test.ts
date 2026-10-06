import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { friendsFor, judgeLeaf, leavesFor, makeSocks, plankLengths, PLANS, reaches, sameSock, shelters } from './logic';

describe('Quick Tricks', () => {
  it('Umbrella Up: one leaf keeps one friend dry; with two friends only the big leaf covers both', () => {
    const [top, sky] = [400, 160];
    for (const plan of PLANS) {
      const friends = friendsFor(plan);
      const leaves = leavesFor(plan);
      const big = leaves.at(-1)!;
      const middle = friends.reduce((a, b) => a + b, 0) / friends.length;
      expect(judgeLeaf(big, middle, top - 60, friends, top, sky)).toBe('dry');
      // Held low, in front of the friends, the rain still gets them.
      expect(judgeLeaf(big, middle, top + 120, friends, top, sky)).toBe('below');
      // Nowhere near: just floats back.
      expect(judgeLeaf(big, middle + 700, top - 60, friends, top, sky)).toBe('away');
      if (plan.friends === 2) {
        const small = leaves[0];
        expect(friends.every((f) => shelters(middle, small, f))).toBe(false);
        expect(judgeLeaf(small, friends[0], top - 60, friends, top, sky)).toBe('partly');
        expect(friends.every((f) => shelters(middle, big, f))).toBe(true);
      }
    }
  });

  it('Sock Gobbler: exactly one partner, and when patterns matter both color and pattern decide', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const { held, choices } = makeSocks(plan, new Rng(seed));
        expect(choices).toHaveLength(plan.socks);
        expect(choices.filter((s) => sameSock(s, held))).toHaveLength(1);
        if (plan.patterns) {
          expect(choices.some((s) => s.color === held.color && s.pattern !== held.pattern)).toBe(true);
          expect(choices.some((s) => s.color !== held.color && s.pattern === held.pattern)).toBe(true);
        } else {
          // Colors alone tell them apart.
          expect(new Set(choices.map((s) => s.color)).size).toBe(plan.socks);
        }
      }
    }
  });

  it('Bridge Stretch: only one plank on offer is long enough', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const lengths = plankLengths(new Rng(seed));
      expect(lengths.filter(reaches)).toHaveLength(1);
      expect(new Set(lengths).size).toBe(3);
    }
  });
});
