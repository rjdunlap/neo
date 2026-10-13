import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { acceptsTap, makeNight, makeRequests, PLANS, COLORS, THINGS, ROOMS, SLOTS, isAnimal, isLight, thingToTap, type Thing } from './logic';

describe('Goodnight Room', () => {
  it('draws a room of the right size from the six friends, in order, with no repeats', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const { room, setting } = makeNight(plan, new Rng(seed));
        expect(room).toHaveLength(plan.things);
        expect(new Set(room).size).toBe(room.length);
        for (const t of room) expect(THINGS).toContain(t);
        const order: readonly Thing[] = setting.friends;
        expect(room).toEqual([...room].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
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
        const { room, color } = makeNight(plan, rng);
        const rs = makeRequests(plan, rng, room, color);
        expect(rs).toHaveLength(plan.requests);
        const asked = rs.flat();
        expect(new Set(asked).size).toBe(asked.length);
        for (const t of asked) expect(room).toContain(t);
        for (const r of rs) expect(r).toHaveLength(plan.mode === 'two' ? 2 : plan.mode === 'animals' ? 3 : plan.mode === 'lightLast' ? 6 : plan.mode === 'color' ? 2 : plan.mode === 'except' ? 5 : 1);
      }
    }
  });

  it('keeps every room distinct and reachable in spacious slots, with one light', () => {
    expect(SLOTS).toHaveLength(6);
    for (const setting of ROOMS) {
      expect(new Set(setting.friends).size).toBe(6);
      expect(setting.friends.filter(t => t === 'lamp' || t === 'lantern')).toHaveLength(1);
      for (const [x, y] of SLOTS) {
        expect(x).toBeGreaterThan(0.15);
        expect(x).toBeLessThan(0.85);
        expect(y).toBeGreaterThan(0.15);
        expect(y).toBeLessThan(0.95);
      }
    }
  });

  it('asks for living animals with no ambiguous teddy and accepts every order', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const night = makeNight(PLANS[4], rng);
      const [request] = makeRequests(PLANS[4], rng, night.room);
      expect(night.room).not.toContain('teddy');
      expect(request).toHaveLength(3);
      expect(night.room.filter(t => !isAnimal(t))).toHaveLength(2);
      expect(request.every(isAnimal)).toBe(true);
      for (const order of [request, [...request].reverse(), [request[1], request[2], request[0]]]) {
        const asleep = new Set<Thing>();
        for (const tap of order) {
          expect(acceptsTap(PLANS[4], request, asleep.size, asleep, tap)).toBe(true);
          expect(asleep.has(tap)).toBe(false);
          expect(acceptsTap(PLANS[4], request, asleep.size, asleep, 'lamp')).toBe(false);
          expect(acceptsTap(PLANS[4], request, asleep.size, asleep, 'clock')).toBe(false);
          asleep.add(tap);
          const hint = thingToTap(PLANS[4], request, asleep.size, asleep, night.room);
          if (hint) expect(asleep.has(hint)).toBe(false);
        }
        expect(thingToTap(PLANS[4], request, 3, asleep, night.room)).toBeNull();
      }
    }
  });

  it('keeps exactly one light awake until every other friend sleeps, accepting every order and offering a useful hint', () => {
    const plan = PLANS[5];
    const rooms = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const night = makeNight(plan, rng);
      rooms.add(night.setting.id);
      const [request] = makeRequests(plan, rng, night.room);
      const light = night.room.find(isLight)!;
      expect(night.room.filter(isLight)).toHaveLength(1);
      expect(night.asleep).toEqual([]);
      const others = night.room.filter(t => !isLight(t));
      for (const order of [others, [...others].reverse(), rng.shuffle([...others])]) {
        const asleep = new Set<Thing>();
        for (const friend of order) {
          expect(acceptsTap(plan, request, asleep.size, asleep, light)).toBe(false);
          const hint = thingToTap(plan, request, asleep.size, asleep, night.room)!;
          expect(isLight(hint)).toBe(false);
          expect(acceptsTap(plan, request, asleep.size, asleep, hint)).toBe(true);
          expect(acceptsTap(plan, request, asleep.size, asleep, friend)).toBe(true);
          asleep.add(friend);
          expect(acceptsTap(plan, request, asleep.size, asleep, friend)).toBe(false);
        }
        expect(thingToTap(plan, request, asleep.size, asleep, night.room)).toBe(light);
        expect(acceptsTap(plan, request, asleep.size, asleep, light)).toBe(true);
        asleep.add(light);
        expect(thingToTap(plan, request, asleep.size, asleep, night.room)).toBeNull();
      }
    }
    expect([...rooms].sort()).toEqual(['barn', 'bedroom']);
  });

  it('counts 2–4 free choices in either room, with no repeated sleeper and no extra bot tap', () => {
    const plan = PLANS[6];
    expect(plan.mode).toBe('count');
    const targets = new Set<number>();
    const rooms = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const night = makeNight(plan, rng);
      expect(night).toEqual(makeNight(plan, new Rng(seed)));
      targets.add(night.targetCount);
      rooms.add(night.setting.id);
      expect(night.asleep).toEqual([]);
      expect(night.targetCount).toBeLessThan(night.room.length);
      expect(makeRequests(plan, rng, night.room)).toEqual([]);
      // Every choice of awake friend works, including choosing the light first.
      for (const order of [night.room, [...night.room].reverse(), rng.shuffle([...night.room])]) {
        const asleep = new Set<Thing>();
        for (const friend of order.slice(0, night.targetCount)) {
          for (const other of night.room) {
            expect(acceptsTap(plan, [], asleep.size, asleep, other, night.targetCount)).toBe(!asleep.has(other));
          }
          const bot = thingToTap(plan, undefined, 0, asleep, night.room, night.targetCount)!;
          expect(acceptsTap(plan, [], asleep.size, asleep, bot, night.targetCount)).toBe(true);
          asleep.add(friend);
          expect(acceptsTap(plan, [], asleep.size, asleep, friend, night.targetCount)).toBe(false);
        }
        expect(thingToTap(plan, undefined, 0, asleep, night.room, night.targetCount)).toBeNull();
        for (const friend of night.room) expect(acceptsTap(plan, [], asleep.size, asleep, friend, night.targetCount)).toBe(false);
        expect(night.room.filter(t => !asleep.has(t))).toHaveLength(night.room.length - night.targetCount);
      }
    }
    expect([...targets].sort()).toEqual([2, 3, 4]);
    expect([...rooms].sort()).toEqual(['barn', 'bedroom']);
  });

  it('offers two clear color matches, two fair decoys and useful hints in every answer order', () => {
    const plan = PLANS[7];
    const colors = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const night = makeNight(plan, rng);
      expect(night).toEqual(makeNight(plan, new Rng(seed)));
      colors.add(night.color!);
      const [request] = makeRequests(plan, rng, night.room, night.color);
      expect(request).toHaveLength(2);
      const decoys = night.room.filter(t => !request.includes(t));
      expect(decoys).toHaveLength(2);
      for (const t of request) expect(COLORS[t].main).toBe(night.color);
      for (const t of decoys) expect(COLORS[t].visible).not.toContain(night.color);
      for (const order of [request, [...request].reverse()]) {
        const asleep = new Set<Thing>();
        for (const t of order) {
          const hint = thingToTap(plan, request, asleep.size, asleep, night.room)!;
          expect(acceptsTap(plan, request, asleep.size, asleep, hint)).toBe(true);
          for (const decoy of decoys) expect(acceptsTap(plan, request, asleep.size, asleep, decoy)).toBe(false);
          expect(acceptsTap(plan, request, asleep.size, asleep, t)).toBe(true);
          asleep.add(t);
          expect(acceptsTap(plan, request, asleep.size, asleep, t)).toBe(false);
        }
        expect(thingToTap(plan, request, 2, asleep, night.room)).toBeNull();
      }
    }
    expect([...colors].sort()).toEqual(['brown', 'orange']);
  });

  it('leaves exactly the night-light awake in both rooms, in any answer order, with useful hints', () => {
    const plan = PLANS[8];
    expect(plan.mode).toBe('except');
    const rooms = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const night = makeNight(plan, rng);
      expect(night).toEqual(makeNight(plan, new Rng(seed)));
      rooms.add(night.setting.id);
      const [request] = makeRequests(plan, rng, night.room);
      const light = night.room.find(isLight)!;
      expect(night.room.filter(isLight)).toEqual([light]);
      expect(night.asleep).toEqual([]);
      expect(request).toEqual(night.room.filter(t => t !== light));
      expect(request.length).toBeGreaterThanOrEqual(3);
      for (const order of [request, [...request].reverse(), rng.shuffle([...request])]) {
        const asleep = new Set<Thing>();
        for (const friend of order) {
          expect(acceptsTap(plan, request, asleep.size, asleep, light)).toBe(false);
          const hint = thingToTap(plan, request, asleep.size, asleep, night.room)!;
          expect(acceptsTap(plan, request, asleep.size, asleep, hint)).toBe(true);
          expect(acceptsTap(plan, request, asleep.size, asleep, friend)).toBe(true);
          asleep.add(friend);
          expect(acceptsTap(plan, request, asleep.size, asleep, friend)).toBe(false);
        }
        expect(thingToTap(plan, request, asleep.size, asleep, night.room)).toBeNull();
        expect(night.room.filter(t => !asleep.has(t))).toEqual([light]);
        expect(acceptsTap(plan, request, asleep.size, asleep, light)).toBe(false);
      }
    }
    expect([...rooms].sort()).toEqual(['barn', 'bedroom']);
  });

  it("gives the ghost finger's bot only right taps, until the room is asleep: everyone awake once, or each thing named in order", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const { room, color, asleep: start } = makeNight(plan, rng);
        const rs = makeRequests(plan, rng, room, color);
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
          for (let step = 0; step < r.length; step++) {
            const tap = thingToTap(plan, r, step, asleep, room)!;
            done.push(tap);
            asleep.add(tap);
          }
          expect(done).toEqual(r);
          expect(thingToTap(plan, r, r.length, asleep, room)).toBeNull();
          for (const t of done) asleep.add(t);
        }
      }
    }
  });
});
