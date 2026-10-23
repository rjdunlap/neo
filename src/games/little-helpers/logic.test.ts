import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { alternates, botTeam, BIG_POWER, CREW, keepWithin, nearestTeam, nextStrong, partsOf, partThing, SPLITS, strongMixes, teamCenters, teamedPlan, teamsResult, badgeRings, BASKET_HALF, BUNCHES, CARRY_NEEDS, CROWD, dressRound, fieldTouch, helperTouch, makeFruits, pileSpot, PLACE_THINGS, PLACES, planFor, PLANS, ringsSayWhen, skipCount, thingsFor, tryLift, usesWhistle, whistleFor, whistleMisses } from './logic';

describe('Little Helpers', () => {
  it('never needs more helpers than the crowd, and leaves something to send', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const fruits = makeFruits(plan, new Rng(seed));
        expect(fruits).toHaveLength(plan.fruits);
        for (const f of fruits) {
          expect(f.need).toBeGreaterThanOrEqual(plan.min);
          expect(f.need).toBeLessThanOrEqual(plan.mode === 'split' ? CROWD : plan.mode === 'strong' ? plan.max : Math.min(plan.max, CROWD - 1));
          if (plan.mode === 'more') {
            expect(f.already).toBeGreaterThanOrEqual(1);
            expect(f.already).toBeLessThan(f.need);
          } else expect(f.already).toBe(0);
        }
        if (plan.mode === 'groups') {
          for (const f of fruits) {
            expect(f.groups).toBeGreaterThanOrEqual(2);
            expect(f.need % f.groups).toBe(0);
            expect(f.need / f.groups).toBeGreaterThanOrEqual(2);
          }
          // Neighbouring bunches differ in shape, even when the totals match (3 twos, 2 threes).
          fruits.slice(1).forEach((f, i) => expect([f.groups, f.need]).not.toEqual([fruits[i].groups, fruits[i].need]));
        } else if (plan.mode === 'split') {
          for (const f of fruits) expect(f.groups).toBe(2);
        } else {
          for (const f of fruits) expect(f.groups).toBe(1);
          const needs = fruits.map((f) => f.need);
          // Never a plain swap (1, 2, 1, 2); with three or more values, never the same twice in a row either.
          if (plan.max > plan.min) expect(alternates(needs), `${plan.name} seed ${seed}: ${needs}`).toBe(false);
          if (plan.max - plan.min >= 2) fruits.slice(1).forEach((f, i) => expect(f.need).not.toBe(fruits[i].need));
          // Two values come equally often, so both sizes are met every round.
          if (plan.max - plan.min === 1) expect(needs.filter((n) => n === plan.min).length).toBe(plan.fruits / 2);
        }
      }
    }
  });

  it('shows every bunch shape within a round, and counts it by groups', () => {
    const plan = PLANS.find((p) => p.mode === 'groups')!;
    for (let seed = 1; seed <= 50; seed++) {
      const shapes = new Set(makeFruits(plan, new Rng(seed)).map((f) => `${f.groups}x${f.need / f.groups}`));
      expect(shapes.size).toBe(BUNCHES.length);
    }
    expect(skipCount({ need: 6, already: 0, groups: 3 })).toBe('2, 4, 6');
    expect(skipCount({ need: 6, already: 0, groups: 2 })).toBe('3, 6');
  });

  it("sends exactly enough helpers and then lifts (or whistles), so the demonstration's every fruit goes home with no bounce", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const f of makeFruits(plan, new Rng(seed))) {
          let carrying = f.already;
          let sent = 0;
          while (helperTouch(plan, f.need, carrying) === 'send') {
            carrying++;
            sent++;
            expect(carrying).toBeLessThanOrEqual(plan.mode === 'strong' ? CREW.small + CREW.big * BIG_POWER : CROWD);
          }
          expect(carrying, `${plan.name} seed ${seed}`).toBe(f.need);
          expect(tryLift(f.need, carrying)).toBe('lift');
          expect(helperTouch(plan, f.need, carrying)).toBe(usesWhistle(plan) ? 'whistle' : null);
          // Helpers already on the fruit are not sent again.
          expect(sent).toBe(f.need - f.already);
        }
      }
    }
  });

  it('keys plans by level ID: level 9 is its own plan, and unknown levels fall back as before', () => {
    for (const plan of PLANS) expect(planFor(plan.level)).toBe(plan);
    expect(planFor(9).mode).toBe('whistle');
    expect(planFor(7).mode).toBe('split');
    expect(planFor(8).mode).toBe('strong');
    expect(planFor(10).level).toBe(6);
    expect(planFor(0).level).toBe(1);
    expect(new Set(PLANS.map((p) => p.level)).size).toBe(PLANS.length);
  });

  it('level 9 needs 1 to 3, every round has at least two sizes, and the rings, not a count, decide', () => {
    const plan = planFor(9);
    expect(usesWhistle(plan)).toBe(true);
    expect(ringsSayWhen(plan)).toBe(true);
    for (const p of PLANS) if (p !== plan) expect(ringsSayWhen(p)).toBe(false);
    for (let seed = 1; seed <= 200; seed++) {
      const needs = makeFruits(plan, new Rng(seed)).map((f) => f.need);
      expect(Math.min(...needs)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...needs)).toBeLessThanOrEqual(3);
      expect(new Set(needs).size).toBeGreaterThanOrEqual(2);
    }
    // An early whistle is never a miss at 9; it still is at 3.
    expect(whistleMisses('short', plan)).toBe(false);
    expect(whistleMisses('short', planFor(3))).toBe(true);
  });

  it('fills the rings as helpers arrive: filled plus empty is the need, extras stand outside', () => {
    for (let need = 1; need < CROWD; need++) {
      for (let carrying = 0; carrying <= CROWD; carrying++) {
        const r = badgeRings(need, carrying);
        expect(r.filled + r.empty).toBe(need);
        expect(r.filled + r.extra).toBe(carrying);
        if (carrying <= need) expect(r.extra).toBe(0);
      }
    }
    // Level 5: the empty rings are how many more.
    expect(badgeRings(6, 4)).toEqual({ filled: 4, empty: 2, extra: 0 });
  });

  it('every place has something for every need, heavier needs draw the bigger things, and no thing comes twice running', () => {
    for (const place of PLACES) for (let need = 1; need < CROWD; need++) expect(thingsFor(place, need).length, `${place} ${need}`).toBeGreaterThan(0);
    for (const place of PLACES) expect(PLACE_THINGS[place].every((k) => k in CARRY_NEEDS)).toBe(true);
    // The pumpkin and watermelon never stand for a light need, the acorn never for a heavy one.
    expect(CARRY_NEEDS.pumpkin[0]).toBeGreaterThan(CARRY_NEEDS.acorn[1]);
    expect(CARRY_NEEDS.watermelon[0]).toBeGreaterThan(CARRY_NEEDS.pinecone[1]);
    const places = new Set<string>();
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const fruits = makeFruits(plan, new Rng(seed));
        const { place, things } = dressRound(fruits, new Rng(seed * 7));
        places.add(place);
        expect(things).toHaveLength(fruits.length);
        things.forEach((k, i) => {
          const each = Math.max(...partsOf(fruits[i]));
          expect(PLACE_THINGS[place]).toContain(k);
          expect(each).toBeGreaterThanOrEqual(CARRY_NEEDS[k][0]);
          expect(each).toBeLessThanOrEqual(CARRY_NEEDS[k][1]);
          if (i > 0 && thingsFor(place, each).filter((x) => x !== things[i - 1]).length) expect(k).not.toBe(things[i - 1]);
        });
      }
    }
    expect(places.size).toBe(PLACES.length);
  });

  it('level 7 splits a crowd of 4 to 7 two ways, and the same total comes back split another way', () => {
    const plan = planFor(7);
    for (let seed = 1; seed <= 200; seed++) {
      const fruits = makeFruits(plan, new Rng(seed));
      const splits = new Map<number, Set<string>>();
      fruits.forEach((f, i) => {
        const parts = partsOf(f);
        expect(parts).toHaveLength(2);
        expect(parts[0] + parts[1]).toBe(f.need);
        expect(f.need).toBeGreaterThanOrEqual(4);
        expect(f.need).toBeLessThanOrEqual(CROWD);
        for (const p of parts) expect(p).toBeGreaterThanOrEqual(1);
        expect(SPLITS[f.need].map((x) => [...x].sort().join())).toContain([...parts].sort().join());
        if (i > 0) expect(f.need).not.toBe(fruits[i - 1].need);
        splits.set(f.need, (splits.get(f.need) ?? new Set()).add([...parts].sort().join()));
      });
      // Each total is met twice, split a different way the second time.
      for (const set of splits.values()) expect(set.size).toBe(2);
    }
    for (const [total, pairs] of Object.entries(SPLITS)) {
      expect(pairs.length).toBeGreaterThanOrEqual(2);
      for (const [a, b] of pairs) expect(a + b).toBe(Number(total));
    }
  });

  it('level 7 things fit each part, the heavier part gets the thing and a lighter part one that fits it', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const fruits = makeFruits(planFor(7), new Rng(seed));
      const { place, things } = dressRound(fruits, new Rng(seed * 3));
      fruits.forEach((f, i) => {
        const parts = partsOf(f);
        expect(thingsFor(place, Math.max(...parts))).toContain(things[i]);
        for (const p of parts) {
          const k = partThing(place, p, things[i]);
          expect(thingsFor(place, p)).toContain(k);
        }
      });
    }
  });

  it('a team lifts only when every fruit has exactly its team; the bot sends to the emptiest and then whistles', () => {
    expect(teamsResult([2, 3], [2, 3]).lift).toBe(true);
    expect(teamsResult([2, 3], [3, 2])).toMatchObject({ lift: false, short: [1], over: [0] });
    expect(teamsResult([2, 3], [0, 0]).empty).toBe(true);
    expect(teamsResult([2, 2], [2, 1])).toMatchObject({ lift: false, short: [1], over: [] });
    for (const parts of [[2, 3], [1, 4], [2, 2, 2], [3, 3]]) {
      const counts = parts.map(() => 0);
      for (let guard = 0; guard < 20; guard++) {
        const g = botTeam(parts, counts);
        if (g === null) break;
        counts[g]++;
      }
      expect(teamsResult(parts, counts).lift).toBe(true);
    }
  });

  it('tap resolves to the nearest fruit and the teams never overlap', () => {
    for (const parts of [[2, 2], [1, 5], [2, 2, 2], [3, 4]]) {
      const c = teamCenters(parts);
      c.forEach((x, i) => {
        expect(nearestTeam(parts, x)).toBe(i);
        if (i) expect(x - c[i - 1]).toBeGreaterThan(((parts[i] + parts[i - 1]) / 2) * 50);
      });
    }
    expect(teamedPlan(planFor(6))).toBe(true);
    expect(teamedPlan(planFor(7))).toBe(true);
    expect(teamedPlan(planFor(8))).toBe(false);
  });

  it('level 8: every need 4 to 8 has at least two teams from the crew, and the bot builds an exact one', () => {
    const plan = planFor(8);
    expect(plan.min).toBe(4);
    expect(plan.max).toBe(8);
    for (let need = plan.min; need <= plan.max; need++) {
      const mixes = strongMixes(need);
      expect(mixes.length, `need ${need}`).toBeGreaterThanOrEqual(2);
      for (const m of mixes) {
        expect(m.small + m.big * BIG_POWER).toBe(need);
        expect(m.small).toBeLessThanOrEqual(CREW.small);
        expect(m.big).toBeLessThanOrEqual(CREW.big);
      }
      let s = 0;
      let b = 0;
      for (let guard = 0; guard < 20; guard++) {
        const next = nextStrong(need, s, b);
        if (!next) break;
        if (next === 'big') b++;
        else s++;
      }
      expect(s + b * BIG_POWER, `bot ${need}`).toBe(need);
    }
    // Any exact mix is right, whichever helpers she chose.
    expect(nextStrong(6, 2, 2)).toBeNull();
    expect(nextStrong(6, 4, 0)).toBe('big');
  });

  it('level 8 trims a too-strong team back to what fits, in the order sent', () => {
    expect(keepWithin([2, 2, 2, 2], 7)).toBe(3);
    expect(keepWithin([1, 2, 2, 1], 4)).toBe(2);
    expect(keepWithin([2, 2], 4)).toBe(2);
    expect(keepWithin([2], 1)).toBe(0);
  });

  it('level 8 needs of 7 and 8 still have something to carry', () => {
    for (const place of PLACES) for (const need of [7, 8]) expect(thingsFor(place, need).length, `${place} ${need}`).toBeGreaterThan(0);
  });

  it('lifts only with exactly enough helpers', () => {
    expect(tryLift(3, 3)).toBe('lift');
    expect(tryLift(3, 2)).toBe('short');
    expect(tryLift(3, 4)).toBe('extra');
  });

  it('answers every touch off the fruit without a miss: any touch sends at level 1, a wave later, a hop while busy', () => {
    expect(fieldTouch(PLANS[0], false)).toBe('send');
    for (const plan of PLANS.slice(1)) expect(fieldTouch(plan, false)).toBe('wave');
    for (const plan of PLANS) expect(fieldTouch(plan, true)).toBe('hop');
    expect(fieldTouch(PLANS[0], false)).toBe('send');
    expect(PLANS[0].mode).toBe('tap');
  });

  it('treats a whistle with no helpers as a nudge, never a miss', () => {
    for (let need = 1; need < CROWD; need++) {
      expect(whistleFor(need, 0)).toBe('nudge');
      expect(whistleMisses(whistleFor(need, 0))).toBe(false);
      expect(whistleFor(need, need)).toBe('lift');
      expect(whistleMisses(whistleFor(need, need))).toBe(false);
      for (let n = 1; n < CROWD + 1; n++) if (n !== need) expect(whistleMisses(whistleFor(need, n))).toBe(true);
    }
  });

  it('keeps every carried fruit inside the basket, a whole bunch included', () => {
    // The most a round can carry: four bunches of up to three fruits.
    const most = PLANS.reduce((m, p) => Math.max(m, p.mode === 'groups' ? p.fruits * Math.max(...BUNCHES.map(([g]) => g)) : p.fruits), 0);
    const seen = new Set<string>();
    for (let n = 0; n < most; n++) {
      const p = pileSpot(n);
      expect(Math.abs(p.x) + 20).toBeLessThanOrEqual(BASKET_HALF);
      expect(p.y).toBeLessThan(0);
      seen.add(`${p.x},${p.y}`);
    }
    expect(seen.size).toBe(most);
  });
});

