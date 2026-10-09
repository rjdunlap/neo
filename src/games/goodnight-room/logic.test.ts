import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { makeRequests, PLANS, THINGS, thingToTap, type Thing } from './logic';

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

  it("gives the ghost finger's bot only right taps, until the room is asleep: everyone once, or each thing named in order", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const rs = makeRequests(plan, new Rng(seed));
        const asleep = new Set<Thing>();
        if (plan.mode === 'all') {
          for (let t = thingToTap(plan, undefined, 0, asleep); t; t = thingToTap(plan, undefined, 0, asleep)) {
            expect(asleep.has(t)).toBe(false);
            asleep.add(t);
          }
          expect([...asleep].sort()).toEqual([...THINGS.slice(0, plan.things)].sort());
          continue;
        }
        for (const r of rs) {
          const done: Thing[] = [];
          for (let step = 0; step < r.length; step++) done.push(thingToTap(plan, r, step, asleep)!);
          expect(done).toEqual(r);
          expect(thingToTap(plan, r, r.length, asleep)).toBeNull();
          for (const t of done) asleep.add(t);
        }
      }
    }
  });
});
