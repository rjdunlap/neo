import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BETWEEN_LEVEL, BETWEEN_PLAN, BETWEEN_TRIPLES, betweenTriples, PLANET_PLAN, planetPairs, gravityFor, planetBotLanding, planetSide, airtimeFor, FRIEND_GAP, FRIEND_LEVEL, FRIEND_PLAN, FRIEND_RANGE, FRIEND_WINDOW, friendSpots, judge, judgeFriend, MAX_PULL, MIN_PULL, nextAsk, padAt, padHit, PADS, PLANS, planFor, pullFor, pullToTake, reach, revealsPullRule, targets } from './logic';

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
          spots.slice(i + 1).forEach(o => expect(Math.abs(s - o)).toBeGreaterThanOrEqual(FRIEND_GAP));
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
          for (const miss of [spot - 0.3, spot - 0.12, spot + 0.12, spot + 0.3].map(m => Math.min(1, Math.max(0, m)))) {
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
        spots.forEach((spot, shot) => expect(judgeFriend(reach(pullToTake(FRIEND_PLAN, shot, [], undefined, spots)), spot)).toBe('yes'));
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
        round.forEach((t, i) => { if (i > 0) expect(t.mid).not.toBe(round[i - 1].mid); });
        round.forEach(t => mids.add(t.mid));
        expect(betweenTriples(new Rng(seed), BETWEEN_PLAN.shots)).toEqual(round);
      }
      expect([...mids].sort()).toEqual([1, 2, 3]);
    });

    it('never judges a prediction, and the bot taps the middle cloud the shown pull reaches', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const tgs = betweenTriples(new Rng(seed), BETWEEN_PLAN.shots).map(t => t.mid);
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
      expect(new Set(pairs.map(p => p.planet)).size).toBe(2);
      expect(pairs.map(p => p.base).sort()).toEqual([0.2, 0.3, 0.4]);
      for (const pair of pairs) {
        const landing = reach(pullFor(pair.base), gravityFor(pair.planet));
        for (const f of [pair.base, landing]) {
          expect(f).toBeGreaterThanOrEqual(0.05);
          expect(f).toBeLessThanOrEqual(0.95);
        }
        expect(Math.abs(landing - pair.base)).toBeGreaterThanOrEqual(0.1 - 1e-10);
        expect(landing > pair.base).toBe(pair.planet === 'light');
        expect(planetSide(380 + 564 * planetBotLanding(pair), 380 + 564 * pair.base)).toBe(pair.planet === 'light' ? 'past' : 'before');
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
});
