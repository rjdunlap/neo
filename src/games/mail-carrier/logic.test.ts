import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { makeLetters, makeStreet, PLANS } from './logic';

describe('Mail Carrier', () => {
  it('builds a numbered street in order with different doors, and mails every house', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const street = makeStreet(plan, rng);
        expect(street).toHaveLength(plan.houses);
        const nums = street.map((h) => h.number);
        expect(nums).toEqual([...nums].sort((a, b) => a - b));
        expect(new Set(nums).size).toBe(nums.length);
        expect(Math.max(...nums)).toBeLessThanOrEqual(plan.top);
        expect(new Set(street.map((h) => h.door)).size).toBe(street.length);
        const letters = makeLetters(plan, street, rng);
        expect(letters).toHaveLength(plan.letters);
        letters.slice(1).forEach((l, i) => expect(l).not.toBe(letters[i]));
        if (plan.letters >= plan.houses) expect(new Set(letters).size).toBe(plan.houses);
      }
    }
  });
});
