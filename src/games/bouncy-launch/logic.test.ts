import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { judge, nextAsk, padAt, padHit, PADS, PLANS, planFor, pullFor, reach, revealsPullRule, targets } from './logic';

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
  });
});
