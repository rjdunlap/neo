import { describe, expect, it } from 'vitest';
import { RAINBOW } from '../../art/palette';
import { Rng } from '../../engine/random';
import { bondNumbers, choosePalette, isRight, meant, PLANS, spawnTarget, TAP_REACH } from './logic';

describe('Bubble Pop', () => {
  it('keeps every bubble a big target, and number rounds within what fits on screen', () => {
    for (const plan of PLANS) {
      expect(plan.radius[0] * TAP_REACH * 2).toBeGreaterThanOrEqual(100);
      expect(plan.radius[0]).toBeLessThanOrEqual(plan.radius[1]);
      if (plan.mode === 'count') expect(plan.goal).toBeLessThanOrEqual(plan.most);
      if (plan.mode === 'color') expect(plan.colors).toBeGreaterThanOrEqual(2);
    }
  });

  it('picks distinct colors, and always sends the asked-for color when none is showing', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      for (const plan of PLANS.filter((p) => p.mode === 'color')) {
        const palette = choosePalette(rng, plan.colors);
        expect(new Set(palette).size).toBe(plan.colors);
        expect(palette.every((c) => RAINBOW.includes(c))).toBe(true);
      }
      // An errorless start, then a target whenever there is none to pop.
      expect(spawnTarget(0, true, rng)).toBe(true);
      expect(spawnTarget(1, true, rng)).toBe(true);
      for (let n = 2; n < 30; n++) expect(spawnTarget(n, false, rng)).toBe(true);
    }
    // Once one is showing, other colors arrive too.
    const rng = new Rng(7);
    const picks = Array.from({ length: 200 }, () => spawnTarget(5, true, rng));
    expect(picks.some((p) => !p)).toBe(true);
    expect(picks.some((p) => p)).toBe(true);
  });

  it('judges pops: anything in free play, the color asked for, then numbers in order', () => {
    expect(isRight('free', { color: 'red' }, null, 1)).toBe(true);
    expect(isRight('color', { color: 'red' }, 'red', 1)).toBe(true);
    expect(isRight('color', { color: 'blue' }, 'red', 1)).toBe(false);
    expect(isRight('count', { color: 'red', number: 2 }, null, 2)).toBe(true);
    expect(isRight('count', { color: 'red', number: 3 }, null, 2)).toBe(false);
  });

  it('gives an overlapping right bubble the tap instead of counting a miss', () => {
    const wrong = { color: 'blue' as const, x: 300, y: 300, r: 60 };
    const right = { color: 'red' as const, x: 360, y: 300, r: 60 };
    const far = { color: 'red' as const, x: 600, y: 300, r: 60 };
    const isRed = (b: { color: string }) => b.color === 'red';
    // A finger between the two lands on both: it meant the red one.
    expect(meant(wrong, [wrong, right, far], { x: 320, y: 300 }, isRed)).toBe(right);
    // Squarely on the blue one, nowhere near a red one: still a miss.
    expect(meant(wrong, [wrong, far], { x: 300, y: 300 }, isRed)).toBe(wrong);
    expect(meant(right, [wrong, right], { x: 330, y: 300 }, isRed)).toBe(right);
  });

  it('bonds levels give every bubble a partner that makes the total', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'bonds')) {
      for (let seed = 1; seed <= 200; seed++) {
        const nums = bondNumbers(plan.sum!, plan.goal, new Rng(seed));
        expect(nums).toHaveLength(plan.goal * 2);
        // Greedy pairing always succeeds, whichever bubble is popped first.
        const left = [...nums];
        while (left.length) {
          const a = left.shift()!;
          const i = left.indexOf(plan.sum! - a);
          expect(i, `${nums}`).toBeGreaterThanOrEqual(0);
          left.splice(i, 1);
        }
        for (const n of nums) expect(n).toBeGreaterThanOrEqual(1), expect(n).toBeLessThan(plan.sum!);
      }
    }
  });
});
