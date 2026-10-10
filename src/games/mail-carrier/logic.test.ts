import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { addressedHouse, checkStop, HOUSE_NODES, isMapMode, makeLetters, makeStreet, makeTrips, makeWoods, MAP_EDGES, MAP_NODES, PLANS, POST_OFFICE, route, routeChoices, routeLength, shorterRoutes, SHORTER_EDGES, SIGNS, walk, woodsTouch } from './logic';

describe('Mail Carrier', () => {
  it('builds a numbered street in order with different doors, and mails every house', () => {
    for (const plan of PLANS.filter((p) => !isMapMode(p.mode))) {
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

describe('Mail Carrier in Wonder Woods', () => {
  const mapPlans = PLANS.filter((p) => isMapMode(p.mode));

  it('has a connected map where every walk follows the paths', () => {
    expect(mapPlans.map((p) => p.mode)).toEqual(['map', 'route', 'shorter']);
    const edge = (a: number, b: number) => MAP_EDGES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    for (const h of HOUSE_NODES) {
      const w = walk(POST_OFFICE, h);
      expect(w[0]).toBe(POST_OFFICE);
      expect(w.at(-1)).toBe(h);
      w.slice(1).forEach((n, i) => expect(edge(w[i], n)).toBe(true));
      // A walk never passes through another house on the way.
      expect(w.slice(1, -1).some((n) => HOUSE_NODES.includes(n))).toBe(false);
    }
    // Houses stand far enough apart on the map for big taps.
    for (const a of HOUSE_NODES) for (const b of HOUSE_NODES) if (a < b) expect(Math.hypot(MAP_NODES[a].x - MAP_NODES[b].x, MAP_NODES[a].y - MAP_NODES[b].y)).toBeGreaterThan(0.25);
  });

  it('routes visit both stops in the planned order', () => {
    for (const a of HOUSE_NODES.keys()) for (const b of HOUSE_NODES.keys()) {
      if (a === b) continue;
      const r = route([a, b]);
      expect(r[0]).toBe(POST_OFFICE);
      expect(r.at(-1)).toBe(HOUSE_NODES[b]);
      expect(r.indexOf(HOUSE_NODES[a])).toBeGreaterThan(0);
      expect(r.indexOf(HOUSE_NODES[a])).toBeLessThan(r.length - 1);
    }
  });

  it('gives every house a different neighbor and sign, and sensible trips', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const woods = makeWoods(rng);
      expect(woods).toHaveLength(HOUSE_NODES.length);
      expect(new Set(woods.map((h) => h.resident)).size).toBe(woods.length);
      expect(new Set(woods.map((h) => h.sign)).size).toBe(woods.length);
      for (const h of woods) expect(SIGNS).toContain(h.sign);
      for (const plan of mapPlans) {
        const trips = makeTrips(plan, rng);
        const flat = trips.flat();
        expect(flat).toHaveLength(plan.letters);
        for (const t of trips) {
          expect(t).toHaveLength(plan.mode === 'route' ? 2 : 1);
          expect(new Set(t).size).toBe(t.length);
          for (const h of t) expect(h >= 0 && h < HOUSE_NODES.length).toBe(true);
        }
        flat.slice(1).forEach((h, i) => expect(h).not.toBe(flat[i]));
        if (plan.mode === 'map') expect(new Set(flat).size).toBe(flat.length);
      }
    }
  });

  it('checks a planned stop: next, later, already planned, or no letter there', () => {
    expect(checkStop([3, 1], [], 3)).toBe('ok');
    expect(checkStop([3, 1], [], 1)).toBe('later');
    expect(checkStop([3, 1], [3], 1)).toBe('ok');
    expect(checkStop([3, 1], [3], 3)).toBe('planned');
    expect(checkStop([3, 1], [], 4)).toBe('nobody');
  });

  it('gives level 8 four reachable houses with a short and long loop route, at least two stones apart', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const trips = makeTrips(PLANS[7], new Rng(seed));
      expect(trips).toHaveLength(4);
      for (const [house] of trips) {
        expect([0, 2, 3, 4]).toContain(house);
        const paths = routeChoices(house);
        expect(paths.length).toBeGreaterThanOrEqual(2);
        const [short, long] = shorterRoutes(house);
        expect(short[0]).toBe(POST_OFFICE);
        expect(short.at(-1)).toBe(HOUSE_NODES[house]);
        expect(long[0]).toBe(POST_OFFICE);
        expect(long.at(-1)).toBe(HOUSE_NODES[house]);
        expect(routeLength(long) - routeLength(short)).toBeGreaterThanOrEqual(2);
        for (const path of [short, long]) {
          expect(new Set(path).size).toBe(path.length);
          for (let i = 1; i < path.length; i++) expect(SHORTER_EDGES.some(([a, b]) => (a === path[i - 1] && b === path[i]) || (b === path[i - 1] && a === path[i]))).toBe(true);
        }
      }
    }
  });
});

describe('Mail Carrier demonstration', () => {
  it('posts every street letter to the house it is addressed to', () => {
    for (const plan of PLANS.filter((p) => !isMapMode(p.mode))) {
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const street = makeStreet(plan, rng);
        const letters = makeLetters(plan, street, rng);
        const posted: number[] = [];
        for (let i = 0; addressedHouse(letters, i) !== null; i++) posted.push(addressedHouse(letters, i)!);
        expect(posted).toEqual(letters);
        expect(posted.every((h) => h >= 0 && h < street.length)).toBe(true);
        expect(addressedHouse(letters, letters.length)).toBeNull();
      }
    }
  });

  it('taps the neighbor on the map, and plans each route stop in letter order before the walk button', () => {
    for (const plan of PLANS.filter((p) => isMapMode(p.mode))) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const trip of makeTrips(plan, new Rng(seed))) {
          if (plan.mode === 'shorter') {
            expect(woodsTouch(plan.mode, trip, [])).toEqual({ house: trip[0] });
            continue;
          }
          const planned: number[] = [];
          for (let step = 0; step < trip.length + 1; step++) {
            const touch = woodsTouch(plan.mode, trip, planned);
            if (plan.mode === 'map') {
              expect(touch).toEqual({ house: trip[0] });
              break;
            }
            if (touch === 'go') {
              expect(planned).toEqual(trip);
              break;
            }
            expect(touch).not.toBeNull();
            expect(checkStop(trip, planned, (touch as { house: number }).house)).toBe('ok');
            planned.push((touch as { house: number }).house);
          }
          if (plan.mode === 'route') expect(woodsTouch(plan.mode, trip, planned)).toBe('go');
        }
      }
    }
    expect(woodsTouch('map', [], [])).toBeNull();
  });
});
