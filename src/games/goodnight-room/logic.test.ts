import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { makeRequests, PLANS, THINGS } from './logic';

describe('Goodnight Room', () => {
  it('asks only for things in the room, never the same one twice, one or two at a time', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const rs = makeRequests(plan, new Rng(seed));
        expect(rs).toHaveLength(plan.requests);
        const asked = rs.flat();
        expect(new Set(asked).size).toBe(asked.length);
        for (const t of asked) expect(THINGS.slice(0, plan.things)).toContain(t);
        for (const r of rs) expect(r).toHaveLength(plan.mode === 'two' ? 2 : 1);
      }
    }
  });
});
