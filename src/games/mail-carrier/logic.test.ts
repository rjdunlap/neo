import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { keyMatches, COMPARE_EDGES, comparisonRoute, compareCounts, clueMatches, clueNode, makeClues, sideColumns, sideLayout, parity, houseLooks, mailboxColor, MAILBOX_COLORS, NEAR, mapNode, mapX, NEIGHBORS, WOODS_NEIGHBORS, addressedHouse, checkStop, countedAloud, countsAloud, INVITE_AFTER, nearestHouse, planFor, shouldInvite, HELPER, HELPERS, TOOLS, helpFixed, helpWrong, letterShows, mailboxShows, teenSpoken, HOUSE_NODES, isMapMode, makeLetters, makeStreet, makeTrips, makeWoods, MAP_EDGES, MAP_NODES, PLANS, POST_OFFICE, route, routeChoices, routeLength, shorterRoutes, SHORTER_EDGES, SIGNS, walk, woodsTouch } from './logic';

describe('Mail Carrier', () => {
  it('counts the dots aloud at levels 3 and 5, up to the number delivered', () => {
    expect([1, 2, 3, 4, 5].filter((l) => countsAloud(planFor(l).mode))).toEqual([3, 5]);
    expect(countedAloud(4)).toBe('One, two, three, four.');
    expect(countedAloud(1)).toBe('One.');
    for (const level of [3, 5]) expect(countedAloud(planFor(level).top).split(', ')).toHaveLength(planFor(level).top);
  });

  it('invites only at level 1, after six quiet seconds while a letter waits', () => {
    expect(INVITE_AFTER).toBe(6);
    expect(shouldInvite('drop', 6, false, false)).toBe(true);
    expect(shouldInvite('drop', 5.9, false, false)).toBe(false);
    expect(shouldInvite('drop', 9, true, false)).toBe(false);
    expect(shouldInvite('drop', 9, false, true)).toBe(false);
    for (const mode of ['color', 'dots', 'numeral', 'count'] as const) expect(shouldInvite(mode, 60, false, false)).toBe(false);
  });

  it('waves the mailbox nearest a touch off the houses', () => {
    const xs = [160, 340, 520, 700];
    expect(nearestHouse(xs, 0)).toBe(0);
    expect(nearestHouse(xs, 600)).toBe(2);
    expect(nearestHouse(xs, 2000)).toBe(3);
  });

  it('builds a numbered street in order with different doors, and mails every house', () => {
    for (const plan of PLANS.filter((p) => !isMapMode(p.mode))) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const street = makeStreet(plan, rng);
        if (plan.mode === 'tool') expect([2, 3]).toContain(street.length);
        else expect(street).toHaveLength(plan.houses);
        const nums = street.map((h) => h.number);
        if (plan.mode !== 'sides') expect(nums).toEqual([...nums].sort((a, b) => a - b));
        expect(new Set(nums).size).toBe(nums.length);
        expect(Math.max(...nums)).toBeLessThanOrEqual(plan.top);
        expect(new Set(street.map((h) => h.door)).size).toBe(Math.min(6, street.length));
        const letters = makeLetters(plan, street, rng);
        expect(letters).toHaveLength(plan.letters);
        letters.slice(1).forEach((l, i) => expect(l).not.toBe(letters[i]));
        if (plan.letters >= street.length) expect(new Set(letters).size).toBe(street.length);
      }
    }
  });
});

describe('Mail Carrier in Wonder Woods', () => {
  const mapPlans = PLANS.filter((p) => isMapMode(p.mode));

  it('has a connected map where every walk follows the paths', () => {
    expect(mapPlans.map((p) => p.mode)).toEqual(['map', 'route', 'shorter', 'clue', 'compare', 'key']);
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
          expect(t).toHaveLength(plan.mode === 'compare' ? 3 : plan.mode === 'route' ? 2 : 1);
          expect(new Set(t).size).toBe(t.length);
          for (const h of t) expect(h >= 0 && h < HOUSE_NODES.length).toBe(true);
        }
        flat.slice(1).forEach((h, i) => expect(h).not.toBe(flat[i]));
        if (plan.mode === 'map') expect(new Set(flat).size).toBe(flat.length);
      }
    }
  });

  it('accepts all six three-stop orders, with real differences on the loop and a counted return', () => {
    const permutations = (t: number[]) => t.flatMap((a) => t.filter((b) => b !== a).map((b) => [a, b, t.find((c) => c !== a && c !== b)!]));
    for (let seed = 1; seed <= 300; seed++) {
      const trips = makeTrips(planFor(14), new Rng(seed));
      expect(trips).toHaveLength(2);
      for (const trip of trips) {
        const lengths: number[] = [];
        for (const order of permutations(trip)) {
          const planned: number[] = [];
          for (const h of order) {
            expect(checkStop(trip, planned, h, true)).toBe('ok');
            planned.push(h);
          }
          expect(checkStop(trip, planned, order[0], true)).toBe('planned');
          expect(checkStop(trip, [], [0, 1, 2, 3, 4].find((h) => !trip.includes(h))!, true)).toBe('nobody');
          expect(woodsTouch('compare', trip, planned)).toBe('go');
          const path = comparisonRoute(order);
          expect(path[0]).toBe(POST_OFFICE);
          expect(path.at(-1)).toBe(POST_OFFICE);
          expect(path.filter((n) => HOUSE_NODES.includes(n))).toEqual(order.map((h) => HOUSE_NODES[h]));
          path.slice(1).forEach((n, i) => expect(COMPARE_EDGES.some(([a, b]) => (a === path[i] && b === n) || (a === n && b === path[i]))).toBe(true));
          const count = routeLength(path, COMPARE_EDGES);
          expect(count).toBe(path.length - 1); // One drawn stone per edge, including repeated edges.
          lengths.push(count);
        }
        expect(new Set(lengths).size).toBeGreaterThan(1);
        // After undo/reordering, the bot chooses an unplanned recipient, never an already planned house.
        expect(woodsTouch('compare', trip, [trip[2]])).toEqual({ house: trip[0] });
      }
    }
    expect(compareCounts(14, 12)).toBe('shorter');
    expect(compareCounts(12, 14)).toBe('longer');
    expect(compareCounts(12, 12)).toBe('same');
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
            if (plan.mode === 'map' || plan.mode === 'clue' || plan.mode === 'key') {
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

describe('Mail Carrier street and map variety', () => {
  it('one pool of seven neighbours; the woods leaves out the dog, so no round seats the dog and the bear together', () => {
    expect(NEIGHBORS).toHaveLength(7);
    expect(NEIGHBORS).toContain('duck');
    expect(WOODS_NEIGHBORS).toHaveLength(6);
    for (let seed = 1; seed <= 300; seed++) {
      const residents = makeWoods(new Rng(seed)).map((h) => h.resident);
      expect(residents.includes('dog') && residents.includes('bear')).toBe(false);
      expect(new Set(residents).size).toBe(HOUSE_NODES.length);
    }
  });

  it('the mailbox colour is never a door colour in the round, nor white', () => {
    for (const plan of PLANS.filter((p) => !isMapMode(p.mode))) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const street = makeStreet(plan, rng);
        const color = mailboxColor(street, rng);
        expect(MAILBOX_COLORS).toContain(color);
        expect(color).not.toBe('white');
        expect(street.map((h) => h.door)).not.toContain(color);
        // When some colour is far from every door, the mailbox takes one of those.
        const anyFar = MAILBOX_COLORS.some((c) => !street.some((h) => h.door === c || NEAR[h.door]?.includes(c)));
        if (anyFar) expect(street.some((h) => NEAR[h.door]?.includes(color))).toBe(false);
      }
    }
  });

  it('level 2 mailboxes vary in colour across rounds', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      seen.add(mailboxColor(makeStreet(planFor(2), rng), rng));
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('house looks give both roofs, chimneys and window boxes', () => {
    const looks = houseLooks(200, new Rng(7));
    expect(new Set(looks.map((l) => l.roof)).size).toBe(2);
    expect(looks.some((l) => l.chimney) && looks.some((l) => !l.chimney)).toBe(true);
    expect(looks.some((l) => l.windowBox) && looks.some((l) => !l.windowBox)).toBe(true);
  });

  it('the mirrored map keeps every node on the paper and every path the same length', () => {
    MAP_NODES.forEach((_, n) => {
      const m = mapNode(n, true);
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x).toBeLessThanOrEqual(1);
      expect(m.y).toBe(MAP_NODES[n].y);
      expect(m.x).toBeCloseTo(mapX(MAP_NODES[n].x, true));
      expect(mapNode(n, false)).toEqual(MAP_NODES[n]);
    });
    const len = (a: number, b: number, mirrored: boolean) => Math.hypot(mapNode(a, mirrored).x - mapNode(b, mirrored).x, mapNode(a, mirrored).y - mapNode(b, mirrored).y);
    for (const [a, b] of SHORTER_EDGES) expect(len(a, b, true)).toBeCloseTo(len(a, b, false));
  });

  it('the mirror swaps left and right: the houses stand in reverse order across the map', () => {
    const order = (m: boolean) => [...HOUSE_NODES].sort((a, b) => mapNode(a, m).x - mapNode(b, m).x);
    expect(order(true)).toEqual(order(false).reverse());
    for (const [a, b] of MAP_EDGES) for (const m of [false, true]) expect(mapNode(a, m)).not.toEqual(mapNode(b, m));
  });
});

describe('Mail Carrier levels 9, 10 and 12', () => {
  it('finds each plan by its level, leaving the woods levels where they were', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((l) => planFor(l).level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
    expect(planFor(6).mode).toBe('map');
    expect(planFor(9).mode).toBe('help');
    expect(planFor(10).mode).toBe('tool');
    expect(planFor(12).mode).toBe('teen');
    expect(planFor(99).mode).toBe('shorter');
    expect(planFor(0).mode).toBe('drop');
  });

  it('shows pictures, not numbers, on the tool signs, and numbers on the teen street', () => {
    expect(mailboxShows('tool')).toEqual({ numeral: false, dots: false, tool: true });
    expect(mailboxShows('help')).toEqual({ numeral: false, dots: false, tool: true });
    expect(mailboxShows('teen')).toEqual({ numeral: true, dots: false, tool: false });
    expect(letterShows('tool')).toBe('tool');
    expect(letterShows('help')).toBe('problem');
    expect(letterShows('teen')).toBe('numeral');
  });

  it('level 10: two or three distinct tools, every letter has its tool on one sign, never the same sign twice in a row', () => {
    const sizes = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const plan = planFor(10);
      const street = makeStreet(plan, rng);
      sizes.add(street.length);
      expect([2, 3]).toContain(street.length);
      const tools = street.map((h) => h.tool);
      expect(tools.every(Boolean)).toBe(true);
      expect(new Set(tools).size).toBe(street.length);
      expect(new Set(street.map((h) => h.door)).size).toBe(street.length);
      const letters = makeLetters(plan, street, rng);
      expect(letters).toHaveLength(5);
      letters.forEach((l, i) => {
        expect(tools.filter((t) => t === street[l].tool)).toHaveLength(1);
        if (i) expect(street[l].tool).not.toBe(street[letters[i - 1]].tool);
      });
    }
    expect([...sizes].sort()).toEqual([2, 3]);
  });

  it('level 9: each problem has exactly one tool, five distinct helpers per round, each gets one different problem', () => {
    expect(new Set(HELPERS.map((h) => HELPER[h].tool)).size).toBe(HELPERS.length);
    expect(new Set(HELPERS.map((h) => HELPER[h].problem)).size).toBe(HELPERS.length);
    expect([...HELPERS.map((h) => HELPER[h].tool)].sort()).toEqual([...TOOLS].sort());
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const plan = planFor(9);
      const street = makeStreet(plan, rng);
      expect(street).toHaveLength(5);
      expect(new Set(street.map((h) => h.helper)).size).toBe(5);
      street.forEach((h) => expect(h.tool).toBe(HELPER[h.helper!].tool));
      const letters = makeLetters(plan, street, rng);
      expect(new Set(letters).size).toBe(5);
      expect(new Set(letters.map((l) => HELPER[street[l].helper!].problem)).size).toBe(5);
    }
  });

  it('level 9 speaks the wrong helper’s tool and the problem it does not fix, then the fix', () => {
    const wrong = helpWrong('baker', 'plumber');
    expect(wrong.tool).toBe('a whisk');
    expect(wrong.use).toContain('baking');
    expect(wrong.problem).toBe('the dripping tap');
    expect(helpFixed('plumber')).toEqual({ Tool: 'A wrench', problem: 'the dripping tap' });
  });

  it('level 12: houses are distinct, sorted numbers from 10 to 20, and every one is mailed', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const plan = planFor(12);
      const street = makeStreet(plan, rng);
      const nums = street.map((h) => h.number);
      expect(nums).toHaveLength(5);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
      expect(new Set(nums).size).toBe(5);
      expect(Math.min(...nums)).toBeGreaterThanOrEqual(10);
      expect(Math.max(...nums)).toBeLessThanOrEqual(20);
      expect(new Set(makeLetters(plan, street, rng)).size).toBe(5);
    }
  });

  it('says a teen number and its ten and ones, with no "ten and zero"', () => {
    expect(teenSpoken(13)).toEqual({ word: 'Thirteen', parts: 'Ten and three.' });
    expect(teenSpoken(11).parts).toBe('Ten and one.');
    expect(teenSpoken(10)).toEqual({ word: 'Ten', parts: 'One ten.' });
    expect(teenSpoken(20)).toEqual({ word: 'Twenty', parts: 'Two tens.' });
    for (let n = 10; n <= 20; n++) {
      const { word, parts } = teenSpoken(n);
      expect(word).toMatch(/^[A-Z][a-z]+$/);
      expect(parts).not.toMatch(/zero/);
    }
  });
});


describe('Mail Carrier spoken clues and two street sides', () => {
  it('300 seeds in both orientations: four different clue shapes, each naming exactly one drawn house', () => {
    for (let seed = 1; seed <= 300; seed++) for (const mirrored of [false, true]) {
      const rng = new Rng(seed), woods = makeWoods(rng), clues = makeClues(woods, mirrored, rng);
      expect(clues).toHaveLength(4);
      expect(new Set(clues.map((c) => c.kind)).size).toBe(4);
      const p = (i: number) => clueNode(HOUSE_NODES[i], mirrored);
      for (const clue of clues) {
        expect(clueMatches(clue, woods, mirrored)).toEqual([clue.house]);
        expect(woods[clue.house]).toBeDefined();
        for (const sign of [clue.a, clue.b].filter(Boolean)) expect(SIGNS).toContain(sign);
        // Independent geometry assertions, rather than trusting the generator's resolver.
        if (clue.kind === 'between') {
          const a = p(woods.findIndex((h) => h.sign === clue.a)), b = p(woods.findIndex((h) => h.sign === clue.b));
          expect(p(clue.house).x).toBeGreaterThan(Math.min(a.x, b.x));
          expect(p(clue.house).x).toBeLessThan(Math.max(a.x, b.x));
          expect(p(clue.house).y).toBeLessThan(0.25);
        } else if (clue.kind === 'left') {
          const a = p(woods.findIndex((h) => h.sign === clue.a));
          expect(p(clue.house).x).toBeLessThan(a.x);
          expect(woods.filter((_, i) => p(i).y < 0.25 && p(i).x > p(clue.house).x && p(i).x < a.x)).toHaveLength(0);
        } else {
          const office = clueNode(0, mirrored), d = (i: number) => Math.hypot(p(i).x - office.x, p(i).y - office.y);
          for (const i of woods.keys()) if (i !== clue.house) {
            const margin = clue.kind === 'nearest' ? d(i) - d(clue.house) : d(clue.house) - d(i);
            expect(margin).toBeGreaterThan(0.08);
          }
        }
        expect(woodsTouch('clue', [clue.house], [])).toEqual({ house: clue.house });
      }
    }
  });

  it('300 seeds: parity determines the side, each side rises, every letter has one house, both number runs occur', () => {
    const starts = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) for (const columns of [3, 4]) {
      const rng = new Rng(seed), plan = { ...planFor(11), houses: columns * 2, top: columns === 3 ? 12 : 16 };
      const street = makeStreet(plan, rng);
      starts.add(street[0].number);
      const nums = street.map((h) => h.number);
      expect(new Set(nums).size).toBe(columns * 2);
      for (let i = 0; i < street.length; i++) {
        expect(parity(nums[i])).toBe(i < columns ? 'odd' : 'even');
        if (i % columns) expect(nums[i] - nums[i - 1]).toBe(2);
      }
      expect(Math.max(...nums)).toBeLessThanOrEqual(plan.top);
      for (const h of makeLetters(plan, street, rng)) expect(nums.filter((n) => n === street[h].number)).toHaveLength(1);
    }
    expect(starts.has(1) && starts.has(9) && starts.has(7)).toBe(true);
  });

  it('keeps 176-unit targets apart in landscape and portrait; fallback uses three houses, never smaller targets', () => {
    for (const [w, h] of [[1024, 768], [1024, 1365], [1365, 768], [768, 1024]]) {
      const columns = sideColumns(w), points = sideLayout(w, h, columns * 2);
      expect(columns).toBe(w === 768 ? 3 : 4);
      for (const a of points) {
        expect(220 * a.scale).toBeGreaterThanOrEqual(100);
        expect(a.x - 110 * a.scale).toBeGreaterThanOrEqual(0);
        expect(a.x + 110 * a.scale).toBeLessThanOrEqual(w);
        for (const b of points) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(176);
      }
    }
  });
});

it('constructs exactly the sign-to-neighbour key before two distinct deliveries', () => {
  const plan = planFor(15);
  expect(plan.mode).toBe('key');
  for (let seed = 1; seed <= 300; seed++) {
    const rng = new Rng(seed), woods = makeWoods(rng);
    const filled = new Map();
    for (const sign of SIGNS) {
      const matches = woods.flatMap((_, i) => keyMatches(woods, sign, i) ? [i] : []);
      expect(matches).toHaveLength(1);
      const house = matches[0];
      filled.set(sign, woods[house].resident);
      expect(keyMatches(woods, sign, (house + 1) % 5)).toBe(false);
    }
    expect(filled.size).toBe(5);
    for (const h of woods) expect(filled.get(h.sign)).toBe(h.resident);
    const trips = makeTrips(plan, rng);
    expect(trips).toHaveLength(2);
    expect(trips[0]).not.toEqual(trips[1]);
    for (const trip of trips) {
      expect(woodsTouch('key', trip, [])).toEqual({ house: trip[0] });
      const h = woods[trip[0]];
      expect(filled.get(h.sign)).toBe(h.resident);
    }
  }
});
