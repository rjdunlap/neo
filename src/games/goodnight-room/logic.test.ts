import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { makeNight, makeRequests, PLANS, THINGS, thingToTap, type Thing } from './logic';

describe('Goodnight Room', () => {
  it('draws a room of the right size from the six friends, in order, with no repeats', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const { room } = makeNight(plan, new Rng(seed));
        expect(room).toHaveLength(plan.things);
        expect(new Set(room).size).toBe(room.length);
        for (const t of room) expect(THINGS).toContain(t);
        expect(room).toEqual([...room].sort((a, b) => THINGS.indexOf(a) - THINGS.indexOf(b)));
      }
    }
  });

  it('changes the room from round to round on the small levels, and every friend turns up', () => {
    const seen = new Set<Thing>();
    const rooms = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const { room } = makeNight(PLANS[0], new Rng(seed));
      room.forEach((t) => seen.add(t));
      rooms.add(room.join());
    }
    expect([...seen].sort()).toEqual([...THINGS].sort());
    expect(rooms.size).toBeGreaterThan(5);
    expect(makeNight(PLANS[0], new Rng(7))).toEqual(makeNight(PLANS[0], new Rng(7)));
  });

  it('starts a friend asleep only where the plan allows it, inside the room, and always leaves two awake', () => {
    let some = 0;
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const { room, asleep } = makeNight(plan, new Rng(seed));
        expect(asleep.length).toBeLessThanOrEqual(plan.asleep);
        expect(room.length - asleep.length).toBeGreaterThanOrEqual(2);
        for (const t of asleep) expect(room).toContain(t);
        expect(new Set(asleep).size).toBe(asleep.length);
        if (asleep.length) some++;
      }
    }
    expect(some).toBeGreaterThan(0);
    for (const plan of PLANS.filter((p) => p.mode !== 'all')) expect(plan.asleep).toBe(0);
    expect(PLANS[0].asleep).toBe(0);
  });

  it('asks only for things in the room, never the same one twice, one or two at a time', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const { room } = makeNight(plan, rng);
        const rs = makeRequests(plan, rng, room);
        expect(rs).toHaveLength(plan.requests);
        const asked = rs.flat();
        expect(new Set(asked).size).toBe(asked.length);
        for (const t of asked) expect(room).toContain(t);
        for (const r of rs) expect(r).toHaveLength(plan.mode === 'two' ? 2 : 1);
      }
    }
  });

  it("gives the ghost finger's bot only right taps, until the room is asleep: everyone awake once, or each thing named in order", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const { room, asleep: start } = makeNight(plan, rng);
        const rs = makeRequests(plan, rng, room);
        const asleep = new Set<Thing>(start);
        if (plan.mode === 'all') {
          const taps: Thing[] = [];
          for (let t = thingToTap(plan, undefined, 0, asleep, room); t; t = thingToTap(plan, undefined, 0, asleep, room)) {
            expect(asleep.has(t)).toBe(false);
            asleep.add(t);
            taps.push(t);
          }
          expect(taps.length).toBe(room.length - start.length);
          expect([...asleep].sort()).toEqual([...room].sort());
          continue;
        }
        for (const r of rs) {
          const done: Thing[] = [];
          for (let step = 0; step < r.length; step++) done.push(thingToTap(plan, r, step, asleep, room)!);
          expect(done).toEqual(r);
          expect(thingToTap(plan, r, r.length, asleep, room)).toBeNull();
          for (const t of done) asleep.add(t);
        }
      }
    }
  });
});
