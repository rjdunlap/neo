import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { floats, rightBasket, SINK_PLANS, THINGS, thingsFor } from './logic';

describe('Sink or Float', () => {
  it('always mixes floaters and sinkers, with surprises only where the level asks for them', () => {
    for (const plan of SINK_PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const things = thingsFor(plan, new Rng(seed));
        expect(things, plan.name).toHaveLength(plan.count);
        expect(new Set(things).size).toBe(things.length);
        expect(things.some(floats)).toBe(true);
        expect(things.some((t) => !floats(t))).toBe(true);
        if (!plan.surprises) for (const t of things) expect(THINGS[t].obvious).toBe(true);
        else expect(things.some((t) => !THINGS[t].obvious)).toBe(true);
      }
    }
  });

  it('names the right basket for every thing, and every round has both baskets to show (so a demonstration sorts both ways)', () => {
    for (const plan of SINK_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const things = thingsFor(plan, new Rng(seed));
        const baskets = new Set(things.map(rightBasket));
        expect(baskets.size, plan.name).toBe(2);
        for (const t of things) expect(rightBasket(t) === 'float').toBe(THINGS[t].floats);
      }
    }
  });
});
