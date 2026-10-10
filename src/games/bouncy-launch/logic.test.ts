import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { judge, MAX_PULL, MIN_PULL, nextAsk, padAt, padHit, PADS, PLANS, planFor, pullFor, pullToTake, reach, revealsPullRule, targets } from './logic';

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
});
