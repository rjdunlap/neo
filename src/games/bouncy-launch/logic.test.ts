import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { bouncyLaunch } from './index';
import { firstLevel, landing, levelsInOrder, stepLevel } from '../../progress/difficulty';
import {
  LEVELS,
  MEADOW_LEVEL,
  MEADOW_PLAN,
  MEADOW_RANGE,
  meadowLandings,
  cloudAt,
  cloudCount,
  NEAR_FAR,
  NEAR_FAR_LEVEL,
  NEAR_FAR_PLAN,
  NEAR_FAR_WINDOW,
  BETWEEN_LEVEL,
  BETWEEN_PLAN,
  BETWEEN_TRIPLES,
  betweenTriples,
  PLANET_PLAN,
  planetPairs,
  gravityFor,
  planetBotLanding,
  planetSide,
  airtimeFor,
  FRIEND_GAP,
  FRIEND_LEVEL,
  FRIEND_PLAN,
  FRIEND_RANGE,
  FRIEND_WINDOW,
  friendSpots,
  judge,
  judgeFriend,
  MAX_PULL,
  MIN_PULL,
  nextAsk,
  padAt,
  padHit,
  PADS,
  PLANS,
  planFor,
  pullFor,
  pullToTake,
  reach,
  revealsPullRule,
  targets,
} from './logic';
import { CLOUDS } from './course';

describe('Bouncy Launch', () => {
  it('turns a bigger pull into a farther flight, and every pad has a pull that lands on it', () => {
    for (let p = 40; p < 170; p += 10) expect(reach(p + 10)).toBeGreaterThan(reach(p));
    for (let i = 0; i < PADS; i++) {
      expect(padHit(reach(pullFor(padAt(i))))).toBe(i);
      // A pad is forgiving: a little off still counts.
      expect(padHit(padAt(i) + 0.06)).toBe(i);
    }
    expect(padHit(0.2)).toBe(-1);
    expect(revealsPullRule([])).toBe(false);
    expect(revealsPullRule([0.2, 0.3])).toBe(false);
    expect(revealsPullRule([0.9, 0.2])).toBe(true);
  });

  it('never files the pull observation for couch or course rounds', () => {
    expect(revealsPullRule([0.1, 0.9], 0.15, true)).toBe(false);
    expect(revealsPullRule([0.1, 0.9], 0.15, false, true)).toBe(false);
    expect(revealsPullRule([0.1, 0.9])).toBe(true);
  });

  it('uses one deterministic pull-to-cloud mapping for shown-pull predictions', () => {
    for (let i = 0; i < PADS; i++) {
      const shownPull = pullFor(padAt(i));
      expect(reach(shownPull)).toBe(padAt(i));
      expect(padHit(reach(shownPull))).toBe(i);
    }
  });

  it('never asks for the same cloud twice in a row', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const t = targets(plan, new Rng(seed));
        expect(t).toHaveLength(plan.shots);
        t.slice(1).forEach((x, i) => expect(x).not.toBe(t[i]));
      }
    }
  });

  it('says short or long for a missed cloud, and compares with the last landing', () => {
    const number = planFor(4);
    expect(judge(number, padAt(2), 2)).toBe('yes');
    expect(judge(number, padAt(0), 2)).toBe('short');
    expect(judge(number, padAt(4), 2)).toBe('long');
    const compare = planFor(5);
    expect(judge(compare, 0.3, 0)).toBe('yes');
    expect(judge(compare, 0.5, 0, 'farther', 0.3)).toBe('yes');
    expect(judge(compare, 0.31, 0, 'farther', 0.3)).toBe('short');
    expect(judge(compare, 0.2, 0, 'nearer', 0.7)).toBe('yes');
    expect(nextAsk(0.8)).toBe('nearer');
    expect(nextAsk(0.2)).toBe('farther');
    // A prediction shows what happened; it never judges the picked cloud as a miss.
    expect(judge(planFor(6), padAt(0), 4)).toBe('yes');
  });

  it("gives the ghost finger's bot only right pulls: every launch lands where it was asked, within the leash, and the round is finished in its own number of shots", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const tgs = targets(plan, new Rng(seed));
        const goal = plan.mode === 'compare' ? plan.shots + 1 : plan.shots;
        let last: number | undefined;
        const pulls: number[] = [];
        for (let shot = 0; shot < goal; shot++) {
          const pull = pullToTake(plan, shot, tgs, last);
          if (plan.mode === 'tap') {
            expect(pull).toBe(0);
            continue;
          }
          if (plan.mode === 'predict') {
            // The bot taps the cloud that the fixed shown pull reaches; no child pull is needed at this level.
            expect(padHit(reach(pullFor(padAt(tgs[shot]))))).toBe(tgs[shot]);
            continue;
          }
          expect(pull).toBeGreaterThanOrEqual(MIN_PULL);
          expect(pull).toBeLessThanOrEqual(MAX_PULL);
          pulls.push(pull);
          const f = reach(pull);
          const ask = plan.mode === 'compare' && last !== undefined ? nextAsk(last) : undefined;
          expect(judge(plan, f, tgs[shot] ?? 0, ask, last)).toBe('yes');
          last = f;
        }
        // Free play shows pulls of different sizes; a compare level alternates by a clear step.
        if (plan.mode === 'free') expect(new Set(pulls.map(Math.round)).size).toBeGreaterThan(2);
      }
    }
  });

  describe('level 7, Feed the friend', () => {
    it('is reached from level 7 only, and the other levels are untouched', () => {
      expect(planFor(FRIEND_LEVEL)).toBe(FRIEND_PLAN);
      expect(planFor(6).mode).toBe('predict');
      expect(planFor(1).mode).toBe('tap');
    });

    it('stands the friend anywhere on the grass, each shot well away from every other, the same for one seed', () => {
      for (let seed = 1; seed <= 300; seed++) {
        const spots = friendSpots(FRIEND_PLAN, new Rng(seed));
        expect(spots).toHaveLength(FRIEND_PLAN.shots);
        spots.forEach((s, i) => {
          expect(s).toBeGreaterThanOrEqual(FRIEND_RANGE.min);
          expect(s).toBeLessThanOrEqual(FRIEND_RANGE.max);
          spots.slice(i + 1).forEach((o) => expect(Math.abs(s - o)).toBeGreaterThanOrEqual(FRIEND_GAP));
        });
        expect(friendSpots(FRIEND_PLAN, new Rng(seed))).toEqual(spots);
      }
    });

    it('can be reached by some pull inside the leash, and the window is as wide as a cloud', () => {
      expect(FRIEND_WINDOW).toBeGreaterThanOrEqual(0.085);
      for (let seed = 1; seed <= 100; seed++) {
        for (const spot of friendSpots(FRIEND_PLAN, new Rng(seed))) {
          const pull = pullFor(spot);
          expect(pull).toBeGreaterThanOrEqual(MIN_PULL);
          expect(pull).toBeLessThanOrEqual(MAX_PULL);
          expect(judgeFriend(reach(pull), spot)).toBe('yes');
        }
      }
    });

    it('says which way a miss went, and one correction from the last miss lands on the friend', () => {
      for (let seed = 1; seed <= 100; seed++) {
        for (const spot of friendSpots(FRIEND_PLAN, new Rng(seed))) {
          for (const miss of [spot - 0.3, spot - 0.12, spot + 0.12, spot + 0.3].map((m) =>
            Math.min(1, Math.max(0, m)),
          )) {
            const verdict = judgeFriend(miss, spot);
            if (verdict === 'yes') continue;
            expect(verdict).toBe(miss < spot ? 'short' : 'long');
            // The linear map: the missed distance, added to (or taken from) the last pull, is the right pull.
            const next = reach(pullFor(miss) + (spot - miss) * (MAX_PULL - MIN_PULL));
            expect(judgeFriend(next, spot)).toBe('yes');
          }
        }
      }
    });

    it("gives the ghost finger's bot a pull that feeds every friend", () => {
      for (let seed = 1; seed <= 100; seed++) {
        const spots = friendSpots(FRIEND_PLAN, new Rng(seed));
        spots.forEach((spot, shot) =>
          expect(judgeFriend(reach(pullToTake(FRIEND_PLAN, shot, [], undefined, spots)), spot)).toBe('yes'),
        );
      }
    });
  });
});

describe('Planet Hop, level 12', () => {
  it('keeps IDs 1–7, puts Between two flights at 9 and reserves 8, 10 and 11', () => {
    for (let i = 1; i <= 6; i++) expect(planFor(i)).toBe(PLANS[i - 1]);
    expect(planFor(7)).toBe(FRIEND_PLAN);
    expect(BETWEEN_LEVEL).toBe(9);
    expect(planFor(9)).toBe(BETWEEN_PLAN);
    expect(planFor(12)).toBe(PLANET_PLAN);
  });

  describe('Between two flights (level 9)', () => {
    it('puts the middle cloud strictly between two flags at least two clouds apart, at the midpoint of their pulls', () => {
      for (const t of BETWEEN_TRIPLES) {
        expect(t.low).toBeGreaterThanOrEqual(0);
        expect(t.high).toBeLessThan(PADS);
        expect(t.high - t.low).toBeGreaterThanOrEqual(2);
        expect(t.low).toBeLessThan(t.mid);
        expect(t.mid).toBeLessThan(t.high);
        // The spoken reason is literally true: the middle pull is halfway between the two shown pulls, and lands on its cloud.
        const midPull = pullFor(padAt(t.mid));
        expect(midPull).toBeCloseTo((pullFor(padAt(t.low)) + pullFor(padAt(t.high))) / 2, 9);
        expect(midPull).toBeGreaterThan(pullFor(padAt(t.low)));
        expect(midPull).toBeLessThan(pullFor(padAt(t.high)));
      }
    });

    it('lands every shown pull on its own cloud, inside the leash', () => {
      for (const t of BETWEEN_TRIPLES) {
        for (const pad of [t.low, t.mid, t.high]) {
          const pull = pullFor(padAt(pad));
          expect(pull).toBeGreaterThanOrEqual(MIN_PULL);
          expect(pull).toBeLessThanOrEqual(MAX_PULL);
          expect(padHit(reach(pull))).toBe(pad);
        }
      }
    });

    it('deals three different sets per round, never the same middle cloud twice running, the same for one seed', () => {
      const mids = new Set<number>();
      for (let seed = 1; seed <= 300; seed++) {
        const round = betweenTriples(new Rng(seed), BETWEEN_PLAN.shots);
        expect(round).toHaveLength(3);
        expect(new Set(round).size).toBe(3);
        round.forEach((t, i) => {
          if (i > 0) expect(t.mid).not.toBe(round[i - 1].mid);
        });
        round.forEach((t) => mids.add(t.mid));
        expect(betweenTriples(new Rng(seed), BETWEEN_PLAN.shots)).toEqual(round);
      }
      expect([...mids].sort()).toEqual([1, 2, 3]);
    });

    it('never judges a prediction, and the bot taps the middle cloud the shown pull reaches', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const tgs = betweenTriples(new Rng(seed), BETWEEN_PLAN.shots).map((t) => t.mid);
        tgs.forEach((mid, shot) => {
          expect(pullToTake(BETWEEN_PLAN, shot, tgs)).toBe(pullFor(padAt(mid)));
          for (let f = 0; f <= 1; f += 0.1) expect(judge(BETWEEN_PLAN, f, mid)).toBe('yes');
        });
      }
    });
  });

  it('shows distinct safe home flights, both planets, and clear past/before evidence for every seed', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const pairs = planetPairs(new Rng(seed));
      expect(planetPairs(new Rng(seed))).toEqual(pairs);
      expect(pairs).toHaveLength(3);
      expect(new Set(pairs.map((p) => p.planet)).size).toBe(2);
      expect(pairs.map((p) => p.base).sort()).toEqual([0.2, 0.3, 0.4]);
      for (const pair of pairs) {
        const landing = reach(pullFor(pair.base), gravityFor(pair.planet));
        for (const f of [pair.base, landing]) {
          expect(f).toBeGreaterThanOrEqual(0.05);
          expect(f).toBeLessThanOrEqual(0.95);
        }
        expect(Math.abs(landing - pair.base)).toBeGreaterThanOrEqual(0.1 - 1e-10);
        expect(landing > pair.base).toBe(pair.planet === 'light');
        expect(planetSide(380 + 564 * planetBotLanding(pair), 380 + 564 * pair.base)).toBe(
          pair.planet === 'light' ? 'past' : 'before',
        );
        expect(judge(PLANET_PLAN, landing, 0)).toBe('yes');
      }
    }
    expect(airtimeFor('light')).toBe(1.5);
    expect(airtimeFor('heavy')).toBe(0.8);
    expect(planetSide(0, 492.8)).toBe('before');
    expect(planetSide(1024, 492.8)).toBe('past');
  });

  it('preserves the default island mapping for every pull, including clamped pulls', () => {
    for (let p = -10; p <= 200; p++) expect(reach(p)).toBe(reach(p, 1));
  });

  describe('level 8, Near or far', () => {
    const plan = planFor(NEAR_FAR_LEVEL);

    it('is its own plan with two big clouds and five shots', () => {
      expect(plan).toBe(NEAR_FAR_PLAN);
      expect(plan.mode).toBe('nearfar');
      expect(plan.shots).toBe(5);
      expect(cloudCount(plan)).toBe(2);
      expect(cloudAt(plan, 0)).toBeLessThan(cloudAt(plan, 1));
    });

    it('reaches both clouds inside the leash: the shortest pull lands near and a full pull lands far', () => {
      expect(judge(plan, reach(MIN_PULL), 0)).toBe('yes');
      expect(judge(plan, reach(MAX_PULL), 1)).toBe('yes');
      for (const i of [0, 1]) {
        const pull = pullFor(NEAR_FAR[i]);
        expect(pull).toBeGreaterThanOrEqual(MIN_PULL);
        expect(pull).toBeLessThanOrEqual(MAX_PULL);
        expect(judge(plan, reach(pull), i)).toBe('yes');
      }
    });

    it('keeps the windows apart with a clear stretch of grass, and wide (about 28 pull units each way)', () => {
      const nearTop = NEAR_FAR[0] + NEAR_FAR_WINDOW,
        farBottom = NEAR_FAR[1] - NEAR_FAR_WINDOW;
      expect(farBottom - nearTop).toBeGreaterThan(0);
      // The grass between is at least as wide as a whole finger's worth of pull, never a sliver.
      expect((farBottom - nearTop) * (MAX_PULL - MIN_PULL)).toBeGreaterThanOrEqual(28 - 1e-9);
      expect(NEAR_FAR_WINDOW * (MAX_PULL - MIN_PULL)).toBeCloseTo(28);
      // The same landing is never right for both clouds.
      for (let f = 0; f <= 1.0001; f += 0.01)
        expect(judge(plan, f, 0) === 'yes' && judge(plan, f, 1) === 'yes').toBe(false);
    });

    it('says which way to go on a miss', () => {
      expect(judge(plan, 0.9, 0)).toBe('long');
      expect(judge(plan, 0.45, 0)).toBe('long');
      expect(judge(plan, 0.2, 1)).toBe('short');
      expect(judge(plan, 0.55, 1)).toBe('short');
    });

    it('takes turns between the clouds from a seeded start, never the same twice running', () => {
      const firsts = new Set<number>();
      for (let seed = 1; seed <= 60; seed++) {
        const t = targets(plan, new Rng(seed));
        expect(t).toHaveLength(5);
        t.forEach((c, i) => {
          expect([0, 1]).toContain(c);
          if (i > 0) expect(c).not.toBe(t[i - 1]);
        });
        firsts.add(t[0]);
        expect(targets(plan, new Rng(seed))).toEqual(t);
      }
      expect(firsts).toEqual(new Set([0, 1]));
    });

    it('gives the ghost finger a pull that lands on every asked cloud', () => {
      for (let seed = 1; seed <= 20; seed++) {
        const t = targets(plan, new Rng(seed));
        for (let shot = 0; shot < t.length; shot++)
          expect(judge(plan, reach(pullToTake(plan, shot, t)), t[shot])).toBe('yes');
      }
    });

    it('leaves Cloud Hopper and the five numbered clouds as they were', () => {
      expect(PADS).toBe(5);
      expect([0, 1, 2, 3, 4].map(padAt)).toEqual([0.1, 0.3, 0.5, 0.7, 0.9]);
      for (let i = 0; i < PADS; i++) expect(cloudAt(planFor(3), i)).toBe(padAt(i));
      expect(planFor(3).mode).toBe('star');
      expect(CLOUDS.version).toBe(1);
      expect(CLOUDS.padWidth).toBe(0.5);
      expect(CLOUDS.targets).toEqual([2, 4, 0, 3, 1, 4, 2, 0, 3, 1, 4, 2]);
      for (let i = 0; i < PADS; i++)
        expect(judge(planFor(3), padAt(i), i, undefined, undefined, CLOUDS.padWidth)).toBe('yes');
    });
  });
});

describe('level 13, the flower meadow (lap)', () => {
  it('opens lap before level 1; no other band reaches it; the other levels keep their plans', () => {
    expect(planFor(MEADOW_LEVEL)).toBe(MEADOW_PLAN);
    expect(levelsInOrder(LEVELS.lap!)).toEqual([MEADOW_LEVEL, 1]);
    expect(firstLevel(LEVELS.lap!)).toBe(MEADOW_LEVEL);
    expect(stepLevel(MEADOW_LEVEL, 1, LEVELS.lap!)).toBe(1);
    expect(stepLevel(MEADOW_LEVEL, -1, LEVELS.lap!)).toBe(MEADOW_LEVEL);
    // An entry level: carried into an older band (a birthday) it starts that band's first level, not its hardest.
    expect(bouncyLaunch.entryLevels).toContain(MEADOW_LEVEL);
    for (const band of ['toddler', 'preschool'] as const)
      expect(landing(MEADOW_LEVEL, LEVELS[band]!, bouncyLaunch.entryLevels)).toBe(
        levelsInOrder(LEVELS[band]!)[0],
      );
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(MEADOW_LEVEL);
    for (let level = 1; level <= 6; level++) expect(planFor(level).mode).not.toBe('meadow');
    expect(SCRIPT['launch.anywhere']).toBeDefined();
  });

  it('every landing is right and asks for no pull', () => {
    for (const f of [0, 0.3, 0.97]) expect(judge(MEADOW_PLAN, f, 0)).toBe('yes');
    expect(pullToTake(MEADOW_PLAN, 0, [])).toBe(0);
  });

  it('five landings on the grass, one in each fifth, so the flowers stand apart', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const spots = meadowLandings(new Rng(seed), MEADOW_PLAN.shots);
      expect(spots).toHaveLength(MEADOW_PLAN.shots);
      for (const f of spots) {
        expect(f).toBeGreaterThanOrEqual(MEADOW_RANGE.min);
        expect(f).toBeLessThanOrEqual(MEADOW_RANGE.max);
      }
      const sorted = spots.slice().sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(0.1);
    }
    // Seeded: the same seed plants the same meadow, and the order differs between seeds.
    expect(meadowLandings(new Rng(7))).toEqual(meadowLandings(new Rng(7)));
    const orders = new Set(
      Array.from({ length: 20 }, (_, s) =>
        meadowLandings(new Rng(s + 1))
          .map((f) => Math.floor(f * 5))
          .join(),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});
