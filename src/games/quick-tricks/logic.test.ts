import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { levelsInOrder, stepLevel } from '../../progress/difficulty';
import { quickTricks } from './index';
import {
  bumpLine,
  CROSSERS,
  castFor,
  friendsFor,
  GAP,
  GAPS,
  idleLeaves,
  judgeLeaf,
  leafDrop,
  leafMiss,
  leafPlan,
  leavesFor,
  makeSocks,
  makeTwoSocks,
  MONSTER_COLORS,
  nextLeaf,
  nextPlank,
  partnerOf,
  RAIN_FRIENDS,
  SOCK_COLORS,
  partnerSock,
  planFor,
  plankLengths,
  plankPlan,
  plankToPlace,
  PLANS,
  reaches,
  reachesGap,
  leafLands,
  sameSock,
  shelters,
  stillWet,
  stretchReaches,
  STRETCH_TO,
  tricksFor,
  TRICKS,
  twoPlankLengths,
  type LeafUp,
  type OnGaps,
} from './logic';

/** The first show's single-step levels, 1 to 3; Two at once (level 7) and A tiny show (level 8) are tested on their own. */
const ONE = PLANS.filter((p) => !p.two && !p.tiny);
const TWO = planFor(7);
const TINY = planFor(8);

describe('Quick Tricks', () => {
  it('a leaf held too low is a free try at level 1 and a miss from level 2; a partly covering leaf always counts', () => {
    expect(ONE.map((p) => leafMiss(p, 'below'))).toEqual([false, true, true]);
    expect(ONE.every((p) => leafMiss(p, 'partly'))).toBe(true);
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
    for (const plan of ONE) {
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
    for (const plan of ONE) {
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
      for (const plan of ONE) {
        const drop = leafDrop(plan, top);
        expect(drop.leaf).toBeGreaterThanOrEqual(0);
        expect(judgeLeaf(leavesFor(plan)[drop.leaf], drop.x, drop.y, friendsFor(plan), top, sky)).toBe('dry');
      }
    }
    for (const plan of ONE) {
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

  describe('Two at once (level 7)', () => {
    it('is level 7 only, a first-show plan with every trick in two steps', () => {
      expect(TWO.two).toBe(true);
      expect(planFor(3).two).toBeFalsy();
      expect(planFor(1)).toBe(PLANS[0]);
      expect(TWO.friends).toBe(3);
      expect(TWO.bridge).toBe('two');
    });

    it('a leaf over only some friends stays up (no miss); a leaf held low is still a miss', () => {
      expect(leafMiss(TWO, 'partly')).toBe(false);
      expect(leafMiss(TWO, 'below')).toBe(true);
      const [top, sky] = [400, 160];
      const friends = friendsFor(TWO);
      const [small, wide] = leavesFor(TWO);
      expect(judgeLeaf(wide, (friends[0] + friends[1]) / 2, top - 60, friends, top, sky)).toBe('partly');
      expect(judgeLeaf(small, friends[2], top - 60, friends, top, sky)).toBe('partly');
    });

    it('exactly one way keeps all three dry: the wider leaf over the pair, the small leaf over the one', () => {
      const friends = friendsFor(TWO);
      const leaves = leavesFor(TWO);
      // No leaf covers all three, the small leaf never covers two, and the wider leaf covers two only as the pair.
      const xs = Array.from({ length: 1201 }, (_, i) => i - 600);
      const sets = (l: number) =>
        new Set(
          xs.map((x) =>
            friends
              .filter((f) => shelters(x, leaves[l], f))
              .map((f) => friends.indexOf(f))
              .join(','),
          ),
        );
      expect([...sets(0)].every((k) => k.split(',').filter(Boolean).length <= 1)).toBe(true);
      expect([...sets(1)].filter((k) => k.split(',').length === 2)).toEqual(['0,1']);
      const plan = leafPlan(TWO);
      const up: LeafUp[] = [null, null];
      for (const s of plan) up[s.leaf] = s.x;
      expect(stillWet(TWO, up)).toEqual([]);
      expect(stillWet(TWO, [null, null])).toEqual([0, 1, 2]);
    });

    it('from any two leaves held up anywhere, following the next-leaf moves keeps everyone dry', () => {
      const spots: LeafUp[] = [null, ...friendsFor(TWO), ...leafPlan(TWO).map((s) => s.x), -300, 300];
      for (const a of spots)
        for (const b of spots) {
          const up: LeafUp[] = [a, b];
          for (let step = 0; step < 4 && stillWet(TWO, up).length; step++) {
            const move = nextLeaf(TWO, up)!;
            expect(move).not.toBeNull();
            // Where a drag really lands: a hair off the carried spot.
            up[move.leaf] = move.x + 1e-9;
          }
          expect(stillWet(TWO, up)).toEqual([]);
          expect(nextLeaf(TWO, up)).toBeNull();
        }
      // One leaf in place (a hair off), the other not yet up: the next move is the other leaf, never the placed one again.
      const [first, second] = leafPlan(TWO);
      const up: LeafUp[] = [null, null];
      up[first.leaf] = first.x - 1e-9;
      expect(nextLeaf(TWO, up)).toEqual(second);
    });

    it('a leaf left keeping nobody dry floats home, so the small leaf never hides under the wide one', () => {
      const [a, b, c] = friendsFor(TWO);
      const pair = (a + b) / 2;
      // Small over a pair friend, then wide over the pair: the small one is idle.
      expect(idleLeaves(TWO, [a, pair], 1)).toEqual([0]);
      expect(idleLeaves(TWO, [b, pair], 1)).toEqual([0]);
      // Small over the friend on their own still keeps them dry; the leaf just placed never floats away.
      expect(idleLeaves(TWO, [c, pair], 1)).toEqual([]);
      // Small dropped over a friend the wide leaf already covers: it adds nothing, so it goes home itself.
      expect(idleLeaves(TWO, [a, pair], 0)).toEqual([0]);
      expect(idleLeaves(TWO, [b, pair], 0)).toEqual([0]);
      expect(idleLeaves(TWO, [c, pair], 0)).toEqual([]);
      expect(idleLeaves(TWO, [a, null], 0)).toEqual([]);
    });

    it('two held socks, five to choose from, exactly one partner for each', () => {
      for (let seed = 1; seed <= 300; seed++) {
        const { held, choices } = makeTwoSocks(new Rng(seed));
        expect(choices).toHaveLength(5);
        expect(held[0].color).not.toBe(held[1].color);
        for (const h of held) expect(choices.filter((s) => sameSock(s, h))).toHaveLength(1);
        // Every decoy shares a colour or a pattern with a held sock, so both have to be checked.
        const decoys = choices.filter((s) => !held.some((h) => sameSock(s, h)));
        expect(decoys).toHaveLength(3);
        expect(decoys.some((d) => d.color === held[0].color)).toBe(true);
        expect(decoys.some((d) => d.color === held[1].color)).toBe(true);
        // Once a pair is made its partner is not matched again, and a decoy never partners anything.
        const first = choices.find((s) => sameSock(s, held[0]))!;
        expect(partnerOf(held, [false, false], first)).toBe(0);
        expect(partnerOf(held, [true, false], first)).toBe(-1);
        for (const d of decoys) expect(partnerOf(held, [false, false], d)).toBe(-1);
      }
    });

    it('one way across both gaps: the middle plank on the narrow gap, the long one on the wide', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const lengths = twoPlankLengths(new Rng(seed));
        const sorted = [...lengths].sort((a, b) => a - b);
        const [short, middle, long] = sorted.map((l) => lengths.indexOf(l));
        expect(GAPS.every((g) => !reachesGap(lengths[short], g))).toBe(true);
        expect([reachesGap(lengths[middle], GAPS[0]), reachesGap(lengths[middle], GAPS[1])]).toEqual([
          true,
          false,
        ]);
        expect(GAPS.every((g) => reachesGap(lengths[long], g))).toBe(true);
        expect(plankPlan(lengths)).toEqual([middle, long]);
        // The long plank on the narrow gap: the middle one bumps short of the wide gap, and the pet says the long one could move.
        expect(bumpLine(lengths, middle, 1, [long, null])).toBe('move');
        expect(bumpLine(lengths, short, 1, [long, null])).toBe('short');
        expect(bumpLine(lengths, short, 0, [null, long])).toBe('short');
      }
    });

    it('no order of accepted planks leaves the bridge unfinishable, and the next-plank moves always finish it', () => {
      const lengths = twoPlankLengths(new Rng(3));
      // Every state the child can reach: each gap empty or holding a different plank that reaches it.
      const states: OnGaps[] = [];
      for (const a of [null, 0, 1, 2])
        for (const b of [null, 0, 1, 2]) if (a === null || b === null || a !== b) states.push([a, b]);
      const valid = states.filter((s) => s.every((p, g) => p === null || reachesGap(lengths[p], GAPS[g])));
      expect(valid.length).toBeGreaterThan(3);
      for (const start of valid) {
        const on = [...start];
        for (let step = 0; step < 4 && nextPlank(lengths, on); step++) {
          const { plank, gap } = nextPlank(lengths, on)!;
          // The target gap is empty, and the plank reaches it; lifting it frees wherever it lay.
          expect(on[gap]).toBeNull();
          expect(reachesGap(lengths[plank], GAPS[gap])).toBe(true);
          const was = on.indexOf(plank);
          if (was >= 0) on[was] = null;
          on[gap] = plank;
        }
        expect(on).toEqual(plankPlan(lengths));
      }
    });

    it('every seed gives three different friends in the rain', () => {
      for (let seed = 1; seed <= 200; seed++) {
        const cast = castFor(TWO, new Rng(seed));
        expect(new Set(cast.friends).size).toBe(3);
      }
    });
  });

  describe('A tiny show (level 8)', () => {
    const [top, sky] = [768 - 110 - 125, 200];

    it('is level 8 only: two tricks, the leaf and the bridge, one friend in the rain', () => {
      expect(PLANS.filter((p) => p.tiny)).toEqual([TINY]);
      expect(tricksFor(TINY)).toEqual(['umbrella', 'bridge']);
      expect(TINY.friends).toBe(1);
      expect(TINY.bridge).toBe('stretch');
      for (const plan of PLANS.filter((p) => !p.tiny)) expect(tricksFor(plan)).toEqual(TRICKS);
    });

    it('nothing she does with the leaf counts: above or in front of the friend keeps them dry, anywhere else floats home', () => {
      const leaf = leavesFor(TINY)[0];
      const friends = friendsFor(TINY);
      let dry = 0;
      for (let x = -400; x <= 400; x += 10)
        for (let y = 0; y <= 900; y += 10) {
          const drop = leafLands(TINY, judgeLeaf(leaf, x, y, friends, top, sky));
          expect(leafMiss(TINY, drop)).toBe(false);
          expect(['dry', 'away']).toContain(drop);
          if (drop === 'dry') dry++;
        }
      expect(dry).toBeGreaterThan(0);
      // In front of the friend (below their heads, in their column) is dry here, where level 1 says "up high".
      expect(leafLands(TINY, judgeLeaf(leaf, 0, top + 100, friends, top, sky))).toBe('dry');
      expect(leafLands(planFor(1), judgeLeaf(leaf, 0, top + 100, friends, top, sky))).toBe('below');
    });

    it('a stretch past halfway snaps across, a shorter one springs back free, and the full stretch of the other levels still needs the far bank', () => {
      expect(TINY.countShort).toBe(false);
      expect(stretchReaches(TINY, GAP / 2 + 1)).toBe(true);
      expect(stretchReaches(TINY, GAP / 2 - 1)).toBe(false);
      expect(stretchReaches(planFor(1), GAP / 2 + 1)).toBe(false);
      expect(stretchReaches(TINY, STRETCH_TO)).toBe(true);
    });

    it("the demonstration's moves finish both tricks", () => {
      const drop = leafDrop(TINY, top);
      expect(
        leafLands(TINY, judgeLeaf(leavesFor(TINY)[drop.leaf], drop.x, drop.y, friendsFor(TINY), top, sky)),
      ).toBe('dry');
      expect(stretchReaches(TINY, STRETCH_TO)).toBe(true);
    });

    it('comes first for toddler and preschool (8 then 1), is an entry level, and is out of the older ladders', () => {
      expect(quickTricks.entryLevels).toEqual([8]);
      expect(levelsInOrder(quickTricks.levels('toddler'))).toEqual([8, 1, 9]);
      expect(levelsInOrder(quickTricks.levels('preschool'))).toEqual([8, 1, 2, 3, 4, 9]);
      expect(stepLevel(8, 1, quickTricks.levels('toddler'))).toBe(1);
      expect(levelsInOrder(quickTricks.levels('prek'))).not.toContain(8);
      expect(levelsInOrder(quickTricks.levels('school'))).not.toContain(8);
      expect(quickTricks.describeLevel(8)).toMatch(/tiny show/i);
    });
  });
});
