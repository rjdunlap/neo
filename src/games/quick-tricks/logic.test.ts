import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { CROSSERS, castFor, friendsFor, judgeLeaf, leafDrop, leafMiss, leavesFor, makeSocks, MONSTER_COLORS, RAIN_FRIENDS, SOCK_COLORS, partnerSock, plankLengths, plankToPlace, PLANS, reaches, sameSock, shelters, STRETCH_TO } from './logic';

describe('Quick Tricks', () => {
  it('a leaf held too low is a free try at level 1 and a miss from level 2; a partly covering leaf always counts', () => {
    expect(PLANS.map((p) => leafMiss(p, 'below'))).toEqual([false, true, true]);
    expect(PLANS.every((p) => leafMiss(p, 'partly'))).toBe(true);
    expect(PLANS.some((p) => leafMiss(p, 'dry') || leafMiss(p, 'away'))).toBe(false);
  });

  it('every seed gives a valid cast: distinct friends, one per spot in the rain, a known crosser, a monster no sock can match', () => {
    const seen = { friends: new Set<string>(), crossers: new Set<string>(), monsters: new Set<string>() };
    for (const plan of PLANS)
      for (let seed = 1; seed <= 200; seed++) {
        const cast = castFor(plan, new Rng(seed));
        expect(cast.friends).toHaveLength(friendsFor(plan).length);
        expect(new Set(cast.friends).size).toBe(cast.friends.length);
        expect(cast.friends.every((f) => (RAIN_FRIENDS as readonly string[]).includes(f))).toBe(true);
        expect(CROSSERS).toContain(cast.crosser);
        expect(SOCK_COLORS).not.toContain(cast.monster);
        cast.friends.forEach((f) => seen.friends.add(f));
        seen.crossers.add(cast.crosser);
        seen.monsters.add(cast.monster);
      }
    expect(seen.friends.size).toBe(RAIN_FRIENDS.length);
    expect(seen.crossers.size).toBe(CROSSERS.length);
    expect(seen.monsters.size).toBe(MONSTER_COLORS.length);
  });

  it('the judged geometry does not depend on the cast', () => {
    for (const plan of PLANS) {
      const before = JSON.stringify([leavesFor(plan), friendsFor(plan), leafDrop(plan, 400)]);
      for (let seed = 1; seed <= 20; seed++) castFor(plan, new Rng(seed));
      expect(JSON.stringify([leavesFor(plan), friendsFor(plan), leafDrop(plan, 400)])).toBe(before);
    }
  });

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

  it('demonstrates each trick right: the leaf that covers everyone, the partner sock, a long enough plank and a stretch past the far bank', () => {
    // Heights as the game computes them: friends' heads 125 above the ground, which is 110 above the bottom of a 768-or-taller view; the cloud's bottom at 200.
    for (const h of [768, 1024, 1366]) {
      const [top, sky] = [h - 110 - 125, 200];
      for (const plan of PLANS) {
        const drop = leafDrop(plan, top);
        expect(drop.leaf).toBeGreaterThanOrEqual(0);
        expect(judgeLeaf(leavesFor(plan)[drop.leaf], drop.x, drop.y, friendsFor(plan), top, sky)).toBe('dry');
      }
    }
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const { held, choices } = makeSocks(plan, new Rng(seed));
        expect(sameSock(choices[partnerSock(held, choices)], held)).toBe(true);
      }
    }
    for (let seed = 1; seed <= 50; seed++) {
      const lengths = plankLengths(new Rng(seed));
      expect(reaches(lengths[plankToPlace(lengths)])).toBe(true);
    }
    expect(reaches(STRETCH_TO)).toBe(true);
  });
});
