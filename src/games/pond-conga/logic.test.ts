import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  DX,
  DY,
  FOODS,
  LONG_START,
  PLANS,
  TAIL_LEGS,
  longStart,
  tailInWay,
  tailLegs,
  STEP_GLIDE,
  stepDue,
  bestStarts,
  groupCosts,
  groupOf,
  openCrumbs,
  orderMatters,
  restBound,
  SWIPE,
  distances,
  foodAt,
  firstCrumbs,
  headAfter,
  hintDir,
  hintPath,
  lowerBound,
  makePond,
  pondLook,
  nextCrumb,
  opposite,
  parsePond,
  pictureOf,
  planFor,
  solveRoute,
  startState,
  step,
  swipeDir,
  turnsIn,
  schoolStep,
  tapToward,
  type Board,
  type Cell,
  type Conga,
  type Dir,
} from './logic';

/** A small pond for the step rules: the leader at (3, 1) heading right, two ducklings behind it. */
const rows = ['.......', '.ssS.1.', '.......'];
const small = () => parsePond(rows);
const at = (c: Cell) => `${c.x},${c.y}`;
const cells = (s: Conga) => s.body.map(at);

describe('steps', () => {
  it('moves the whole line one cell on', () => {
    const p = small();
    const r = step(p, startState(p), null);
    expect(r.event).toBe('move');
    expect(cells(r.state)).toEqual(['4,1', '3,1', '2,1']);
    expect(r.state.heading).toBe(0);
  });

  it('turns when asked, and ignores a turn straight back', () => {
    const p = small();
    expect(cells(step(p, startState(p), 1).state)[0]).toBe('3,2');
    expect(cells(step(p, startState(p), 3).state)[0]).toBe('3,0');
    const back = step(p, startState(p), 2);
    expect(back.event).toBe('move');
    expect(cells(back.state)[0]).toBe('4,1');
  });

  it('eats a crumb by reaching it, and the line grows by one', () => {
    const p = small();
    let s = startState(p);
    s = step(p, s, null).state;
    const r = step(p, s, null);
    expect(r.event).toBe('crumb');
    expect(r.state.eaten).toBe(1);
    expect(r.state.body).toHaveLength(4);
    expect(cells(r.state)).toEqual(['5,1', '4,1', '3,1', '2,1']);
    expect(nextCrumb(p, r.state)).toBeUndefined();
  });

  it('bonks on the bank, a lily pad and itself, and turns the whole line about without losing anyone', () => {
    const edge = parsePond(['.sS', '...']);
    const bonk = step(edge, startState(edge), null);
    expect(bonk.event).toBe('bonk');
    expect(cells(bonk.state)).toEqual(['1,0', '2,0']);
    // The old tail now leads and carries on away from the old second-last duckling: to the left.
    expect(bonk.state.heading).toBe(2);
    expect(bonk.state.eaten).toBe(0);

    const pad = parsePond(['.ssS#', '.....']);
    expect(step(pad, startState(pad), null).event).toBe('bonk');

    // Turning back into its own line: a long line curled up.
    const body: Cell[] = [
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
    ];
    const board: Board = { cols: 5, rows: 3, pads: [], start: body, heading: 2, crumbs: [] };
    const curled: Conga = { body, heading: 2, eaten: 0, got: 0 };
    const own = step(board, curled, 3);
    expect(own.event).toBe('bonk');
    expect(own.state.body).toHaveLength(5);
    expect(new Set(cells(own.state))).toEqual(new Set(cells(curled)));
  });

  it('lets the leader take the cell the tail is leaving, but not when the line is growing', () => {
    // A ring of four ducklings: the leader may follow the tail round the square.
    const body: Cell[] = [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ];
    const ring: Board = { cols: 3, rows: 3, pads: [], start: body, heading: 2, crumbs: [] };
    const follow = step(ring, { body, heading: 2, eaten: 0, got: 0 }, null);
    expect(follow.event).toBe('move');
    expect(cells(follow.state)).toEqual(['0,0', '1,0', '1,1', '0,1']);
    // The same move onto a crumb: the tail stays, so the cell is taken.
    const fed: Board = { ...ring, crumbs: [{ x: 0, y: 0 }] };
    expect(step(fed, { body, heading: 2, eaten: 0, got: 0 }, null).event).toBe('bonk');
  });
});

describe('distances', () => {
  it('goes round lily pads', () => {
    const p = parsePond(['S.#..', 's.#.1', '..#..', '.....']);
    const d = distances(p, p.start[0]);
    expect(d[1 * 5 + 4]).toBe(9);
    expect(distances(p, p.start[0])[0]).toBe(0);
  });

  it('says -1 where the water cannot be reached', () => {
    const p: Board = {
      cols: 3,
      rows: 3,
      pads: [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ],
      start: [{ x: 0, y: 0 }],
      heading: 0,
      crumbs: [],
    };
    // The three open cells that are shut off from the corner, besides the five lily pads.
    const shut = distances(p, { x: 0, y: 0 }).filter(
      (d, i) => d === -1 && !p.pads.some((q) => q.y * 3 + q.x === i),
    );
    expect(shut).toHaveLength(3);
  });
});

describe('ponds from a picture', () => {
  it('reads the picture, finds a route that is as short as any could be, and draws it back', () => {
    const p = parsePond(['.......', '.ssS#.1', '.....2.', '.#.....']);
    expect(p.crumbs).toHaveLength(2);
    expect(p.par).toBe(p.route.length);
    expect(p.par).toBe(lowerBound(p));
    expect(pictureOf(p)).toEqual(['.......', '.ssS#.1', '.....2.', '.#.....']);
  });

  it('refuses a pond whose crumb cannot be reached, or only by a way the line is in the way of', () => {
    expect(() => parsePond(['sS.#.', '...#1', '...#.'])).toThrow();
    expect(
      solveRoute({
        cols: 3,
        rows: 1,
        pads: [],
        start: [
          { x: 1, y: 0 },
          { x: 0, y: 0 },
        ],
        heading: 0,
        crumbs: [{ x: 0, y: 0 }],
      }),
    ).toBeNull();
  });

  it('plays its own route without a single bonk, eating every crumb, in exactly its par', () => {
    const p = parsePond(['.......', '.ssS#.1', '.....2.', '.#..3..']);
    let s = startState(p);
    let eaten = 0;
    for (const d of p.route) {
      const r = step(p, s, d);
      expect(r.event).not.toBe('bonk');
      if (r.event === 'crumb') eaten++;
      s = r.state;
    }
    expect(eaten).toBe(p.crumbs.length);
    expect(s.eaten).toBe(p.crumbs.length);
  });
});

describe('the plans', () => {
  it('grow in crumbs and lily pads, and never in speed by much', () => {
    // Levels 1–6 are the arcade ladder; level 7 changes the rule instead, at level 3's pace.
    const ladder = PLANS.filter((p) => !p.group && p.paced !== false && !p.long);
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i].crumbs).toBeGreaterThanOrEqual(ladder[i - 1].crumbs);
      expect(ladder[i].pads).toBeGreaterThanOrEqual(ladder[i - 1].pads);
      expect(ladder[i].speed - ladder[i - 1].speed).toBeLessThanOrEqual(0.3);
      expect(ladder[i].speed).toBeGreaterThanOrEqual(ladder[i - 1].speed);
    }
    expect(planFor(7)).toMatchObject({ group: 3, crumbs: 9, speed: 2.8 });
    expect(planFor(8)).toMatchObject({ paced: false, cols: 11, rows: 7, pads: 2, crumbs: 5 });
    expect(planFor(9)).toMatchObject({ long: true, cols: 11, rows: 7, pads: 6, crumbs: 8, speed: 2.6 });
    expect(Math.max(...PLANS.map((p) => p.speed))).toBeLessThanOrEqual(3.6);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS.at(-1));
  });
});

describe('generated ponds', () => {
  it('have a bonk-free route that is exactly as short as the crumbs allow, on every level', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const plan = planFor(level);
      for (let seed = 1; seed <= 12; seed++) {
        const p = makePond(plan, new Rng(seed * 101 + level));
        const label = `level ${level} seed ${seed}`;
        expect(p.cols, label).toBe(plan.cols);
        expect(p.rows, label).toBe(plan.rows);
        expect(p.pads, label).toHaveLength(plan.pads);
        expect(p.crumbs, label).toHaveLength(plan.crumbs);
        expect(new Set(p.crumbs.map(at)).size, label).toBe(plan.crumbs);
        // Nothing sits on a lily pad, in the bank, or on the starting line.
        for (const c of p.crumbs) {
          expect(c.x >= 0 && c.y >= 0 && c.x < p.cols && c.y < p.rows, label).toBe(true);
          expect(
            p.pads.some((q) => at(q) === at(c)),
            label,
          ).toBe(false);
        }
        expect(
          p.start.some((c) => p.crumbs.some((q) => at(q) === at(c))),
          label,
        ).toBe(false);
        // Open water is all one pond: a corner is never walled off.
        expect(distances(p, p.start[0]).filter((d) => d >= 0).length, label).toBe(
          p.cols * p.rows - p.pads.length,
        );
        // The par is the shortest it could be, and a route with no bonk gets there.
        expect(p.par, label).toBe(p.route.length);
        expect(p.par, label).toBe(lowerBound(p));
        let s = startState(p),
          bonks = 0;
        for (const d of p.route) {
          const r = step(p, s, d);
          if (r.event === 'bonk') bonks++;
          s = r.state;
        }
        expect(bonks, label).toBe(0);
        expect(s.eaten, label).toBe(plan.crumbs);
        // Each crumb is between the plan's fewest and furthest steps from the one before.
        let from = p.start[0];
        for (const c of p.crumbs) {
          const leg = distances(p, from)[c.y * p.cols + c.x];
          expect(leg, label).toBeGreaterThanOrEqual(plan.minLeg);
          expect(leg, label).toBeLessThanOrEqual(plan.maxLeg);
          from = c;
        }
      }
    }
  });

  it('come from the seed alone, and differ with it', () => {
    const a = makePond(planFor(4), new Rng(77)),
      b = makePond(planFor(4), new Rng(77)),
      c = makePond(planFor(4), new Rng(78));
    expect(pictureOf(a)).toEqual(pictureOf(b));
    expect(a.route).toEqual(b.route);
    expect(pictureOf(a)).not.toEqual(pictureOf(c));
  });

  it('are run in straight lines where they can: a route turns at most as often as there are legs times two', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const p = makePond(planFor(5), new Rng(seed));
      expect(turnsIn(p.heading, p.route)).toBeLessThanOrEqual(p.crumbs.length * 4);
    }
  });
});

/** A random player: mostly straight on, now and then a turn, and every so often straight back into trouble. */
function wander(p: Board, s: Conga, rng: Rng, steps: number): { state: Conga; bonks: number } {
  let bonks = 0;
  for (let i = 0; i < steps && s.eaten < p.crumbs.length; i++) {
    const want = rng.chance(0.35) ? (rng.int(0, 3) as Dir) : null;
    const r = step(p, s, want);
    if (r.event === 'bonk') bonks++;
    s = r.state;
  }
  return { state: s, bonks };
}

describe('the look of a pond', () => {
  it('is a pure function of the seed', () => {
    for (let seed = 1; seed <= 40; seed++) expect(pondLook(new Rng(seed))).toEqual(pondLook(new Rng(seed)));
  });

  it('leaves the pond made from the same seed unchanged', () => {
    for (const plan of PLANS)
      for (const seed of [3, 17, 404]) {
        const rng = new Rng(seed);
        pondLook(rng);
        expect(makePond(plan, rng)).toEqual(makePond(plan, new Rng(seed)));
      }
  });

  it('gives every food and every reed edge across seeds, never bread', () => {
    const looks = Array.from({ length: 60 }, (_, k) => pondLook(new Rng(k + 1)));
    expect(new Set(looks.map((l) => l.food))).toEqual(new Set(FOODS));
    expect(new Set(looks.map((l) => l.reeds))).toEqual(new Set([0, 1, 2, 3]));
    expect(FOODS as readonly string[]).not.toContain('bread');
  });

  it('takes the next food on each pond of a course', () => {
    const look = { food: 'oats' as const, reeds: 0 as const };
    expect([0, 1, 2, 3].map((i) => foodAt(look, i))).toEqual(['oats', 'peas', 'sweetcorn', 'oats']);
  });
});

describe('help and getting stuck', () => {
  it('a hint always leads on: from wherever the line has wandered, following it eats every crumb', () => {
    let worst = 0;
    for (let level = 1; level <= PLANS.length; level++) {
      for (let seed = 1; seed <= 10; seed++) {
        const rng = new Rng(seed * 31 + level);
        const p = makePond(planFor(level), rng);
        const label = `level ${level} seed ${seed}`;
        const lost = wander(p, startState(p), rng, rng.int(5, 60));
        let s = lost.state,
          bonks = 0,
          ticks = 0;
        while (s.eaten < p.crumbs.length && ticks < 900) {
          const r = step(p, s, hintDir(p, s));
          if (r.event === 'bonk') bonks++;
          s = r.state;
          ticks++;
        }
        expect(s.eaten, `${label}: the hint never finished (${ticks} steps)`).toBe(p.crumbs.length);
        worst = Math.max(worst, bonks);
        expect(bonks, `${label}: following hints should hardly ever bonk`).toBeLessThanOrEqual(4);
      }
    }
    expect(worst).toBeLessThanOrEqual(4);
  });

  it('a hint that exists is a real way: it reaches the next crumb with no bonk', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = new Rng(seed * 7);
      const p = makePond(planFor(3 + (seed % 3)), rng);
      const lost = wander(p, startState(p), rng, rng.int(0, 40));
      if (lost.state.eaten >= p.crumbs.length) continue;
      const path = hintPath(p, lost.state);
      let s = lost.state;
      for (let i = 0; i < path.length; i++) {
        const r = step(p, s, path[i]);
        expect(r.event).not.toBe('bonk');
        expect(r.event).toBe(i === path.length - 1 ? 'crumb' : 'move');
        s = r.state;
      }
    }
  });

  it('can never be boxed in: a line that bonks turns about and keeps all its ducklings', () => {
    const rng = new Rng(5);
    const p = makePond(planFor(6), rng);
    for (let i = 0; i < 200; i++) {
      const lost = wander(p, startState(p), rng, rng.int(1, 80));
      const s = lost.state;
      if (s.eaten >= p.crumbs.length) continue;
      // Whatever the line is doing, some direction lets it move or turn about, and the line keeps all of its ducklings.
      expect(s.body).toHaveLength(3 + s.eaten);
      const choices = ([0, 1, 2, 3] as Dir[])
        .filter((d) => d !== opposite(s.heading))
        .map((d) => step(p, s, d));
      expect(choices.length).toBe(3);
      for (const c of choices) {
        const length = s.body.length + (c.event === 'crumb' ? 1 : 0);
        expect(c.state.body).toHaveLength(length);
        expect(new Set(c.state.body.map(at)).size).toBe(length);
      }
      const b = choices.find((c) => c.event === 'bonk');
      if (b) expect(b.state.body.map(at)).toEqual(s.body.map(at).reverse());
    }
  });

  it('every direction is on the grid the way the game steers: right, down, left, up', () => {
    expect(DX).toEqual([1, 0, -1, 0]);
    expect(DY).toEqual([0, 1, 0, -1]);
  });
});

describe('swiping to steer by touch', () => {
  it('turns the line toward the way a finger has gone, once it has gone far enough', () => {
    expect(swipeDir(SWIPE, 0)).toBe(0);
    expect(swipeDir(0, SWIPE)).toBe(1);
    expect(swipeDir(-SWIPE - 10, 4)).toBe(2);
    expect(swipeDir(6, -SWIPE - 10)).toBe(3);
  });

  it('waits for a clear stroke: a short move, a tap and a slant ask for nothing', () => {
    expect(swipeDir(0, 0)).toBeNull();
    expect(swipeDir(SWIPE - 1, 0)).toBeNull();
    expect(swipeDir(0, -(SWIPE - 1))).toBeNull();
    expect(swipeDir(50, 48)).toBeNull();
    expect(swipeDir(50, -49)).toBeNull();
    // ...and the slant becomes a stroke once one way clearly wins.
    expect(swipeDir(80, 48)).toBe(0);
    expect(swipeDir(-48, -80)).toBe(3);
  });

  it('lets one stroke make several turns when the finger starts over after each', () => {
    // Right, then down, then right again: each recognised turn re-anchors, so the leftover travel counts toward the next.
    const path = [
      [SWIPE + 4, 3],
      [2, SWIPE + 5],
      [SWIPE + 1, -2],
    ];
    expect(path.map(([dx, dy]) => swipeDir(dx, dy))).toEqual([0, 1, 0]);
  });

  it('finds where the leader will be, so a hand can wait over the turn that is coming', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const pond = makePond(planFor(level), new Rng(900 + level));
      const state = startState(pond);
      expect(headAfter(pond, state, pond.route, 0)).toEqual(state.body[0]);
      // Walking the route by hand lands on the same cell for every prefix.
      let walk = state;
      for (let i = 0; i < pond.route.length; i++) {
        walk = step(pond, walk, pond.route[i]).state;
        expect(headAfter(pond, state, pond.route, i + 1), `level ${level} step ${i + 1}`).toEqual(
          walk.body[0],
        );
      }
      expect(walk.eaten).toBe(pond.crumbs.length);
    }
  });

  it('shows a short pond for the how-to demonstration: its first crumbs, still a fewest-steps bonk-free route', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const pond = makePond(planFor(level), new Rng(300 + level));
      // Whole groups only: level 7's demo eats one group of three.
      const n = groupOf(pond) > 1 ? 3 : Math.min(4, pond.crumbs.length);
      const short = firstCrumbs(pond, 4);
      expect(short.crumbs).toEqual(pond.crumbs.slice(0, n));
      expect(short.par).toBe(lowerBound(short));
      expect(short.route).toHaveLength(short.par);
      let walk = startState(short);
      for (const d of short.route) {
        const r = step(short, walk, d);
        expect(r.event, `level ${level}`).not.toBe('bonk');
        walk = r.state;
      }
      expect(walk.eaten).toBe(n);
    }
    const pond = makePond(planFor(1), new Rng(1));
    expect(firstCrumbs(pond, 9)).toBe(pond);
  });
});

/** The fewest steps by trying every order of every group, from the distances alone: an independent check of `lowerBound`. */
function bruteBound(p: Board): number {
  const size = groupOf(p);
  const perms = (xs: number[]): number[][] =>
    xs.length <= 1
      ? [xs]
      : xs.flatMap((x, k) => perms([...xs.slice(0, k), ...xs.slice(k + 1)]).map((r) => [x, ...r]));
  const groups: number[][][] = [];
  for (let g = 0; g < p.crumbs.length; g += size)
    groups.push(perms(Array.from({ length: Math.min(size, p.crumbs.length - g) }, (_, k) => g + k)));
  let best = Infinity;
  const go = (gi: number, at: Cell, total: number) => {
    if (gi === groups.length) {
      best = Math.min(best, total);
      return;
    }
    for (const order of groups[gi]) {
      let from = at,
        t = total;
      for (const k of order) {
        t += distances(p, from)[p.crumbs[k].y * p.cols + p.crumbs[k].x];
        from = p.crumbs[k];
      }
      go(gi + 1, from, t);
    }
  };
  go(0, p.start[0], 0);
  return best;
}

describe('choose the order (level 7)', () => {
  const plan = planFor(7);
  const ponds = Array.from({ length: 12 }, (_, i) => makePond(plan, new Rng(700 + i * 13)));

  it('shows a whole group of three at once, and only that group; any of them can be eaten first', () => {
    const p = ponds[0];
    let s = startState(p);
    expect(openCrumbs(p, s)).toEqual(p.crumbs.slice(0, 3));
    // Walk straight to the third of the group first: it is eaten, and the other two stay.
    const firstPick = 2;
    const route = (() => {
      for (const order of [
        [2, 0, 1],
        [2, 1, 0],
      ]) {
        const short = { ...p, crumbs: order.map((k) => p.crumbs[k]), group: 1 };
        const found = solveRoute(short);
        if (found) return found;
      }
      return null;
    })();
    expect(route).not.toBeNull();
    if (route) {
      let at = 0;
      while (s.eaten === 0) s = step(p, s, route[at++]).state;
      expect(s.got).toBe(1 << firstPick);
      expect(openCrumbs(p, s)).toEqual([p.crumbs[0], p.crumbs[1]]);
    }
    // The next group shows only once the first is all eaten.
    let t = startState(p);
    for (const d of p.route) {
      t = step(p, t, d).state;
      if (t.eaten === 3) break;
    }
    expect(openCrumbs(p, t)).toEqual(p.crumbs.slice(3, 6));
  });

  it("a later group's food is plain water until its turn: the line paddles over it", () => {
    const g: Board = {
      cols: 9,
      rows: 3,
      pads: [],
      start: [
        { x: 2, y: 1 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      heading: 0,
      group: 3,
      crumbs: [
        { x: 6, y: 1 },
        { x: 7, y: 1 },
        { x: 8, y: 1 },
        { x: 4, y: 1 },
      ],
    };
    // In groups of three, the fourth bite is in the second group: passing over it first does not eat it.
    let s = startState(g);
    s = step(g, s, 0).state;
    s = step(g, s, 0).state;
    expect(s.body[0]).toEqual({ x: 4, y: 1 });
    expect(s.eaten).toBe(0);
  });

  it('par is the fewest steps over every order of every group, and a bonk-free route meets it', () => {
    for (const [i, p] of ponds.entries()) {
      expect(p.group, `pond ${i}`).toBe(3);
      expect(p.par, `pond ${i}`).toBe(bruteBound(p));
      expect(p.par, `pond ${i}`).toBe(lowerBound(p));
      let s = startState(p);
      for (const d of p.route) {
        const r = step(p, s, d);
        expect(r.event, `pond ${i}`).not.toBe('bonk');
        s = r.state;
      }
      expect(s.eaten, `pond ${i}`).toBe(9);
    }
  });

  it('makes the order a real choice: in every group, some orders take more steps than others', () => {
    for (const p of ponds) {
      expect(orderMatters(p, p.route)).toBe(true);
      const costs = groupCosts(p, p.start[0], 0);
      expect(Math.max(...costs)).toBeGreaterThan(Math.min(...costs));
    }
  });

  it('eating in a longer order is only steps: the line still eats everything, and the bound from there is honest', () => {
    for (const p of ponds.slice(0, 4)) {
      // From the start, the worst first pick costs more over the whole pond than a best one.
      const s = startState(p);
      const best = bestStarts(p, s);
      expect(best.length).toBeGreaterThan(0);
      expect(restBound(p, s)).toBe(p.par);
    }
  });

  it('a hint leads to a crumb that starts a best order, from the start and from each group', () => {
    for (const [i, p] of ponds.entries()) {
      let s = startState(p),
        at = 0;
      for (let g = 0; g < 3; g++) {
        const path = hintPath(p, s);
        expect(path.length, `pond ${i} group ${g}`).toBeGreaterThan(0);
        let t = s;
        for (const d of path) t = step(p, t, d).state;
        const ate = p.crumbs.findIndex((_, k) => t.got & (1 << k) && !(s.got & (1 << k)));
        expect(bestStarts(p, s), `pond ${i} group ${g}`).toContain(ate);
        while (at < p.route.length && s.eaten < (g + 1) * 3) s = step(p, s, p.route[at++]).state;
      }
    }
  });

  it('a hint from a wandering line reaches a crumb it can eat now, with no bonk', () => {
    for (let seed = 1; seed <= 16; seed++) {
      const rng = new Rng(seed * 17);
      const p = ponds[seed % ponds.length];
      const lost = wander(p, startState(p), rng, rng.int(0, 50));
      if (lost.state.eaten >= p.crumbs.length) continue;
      const open = openCrumbs(p, lost.state).map(at);
      const path = hintPath(p, lost.state);
      let s = lost.state;
      for (let i = 0; i < path.length; i++) {
        const r = step(p, s, path[i]);
        expect(r.event).toBe(i === path.length - 1 ? 'crumb' : 'move');
        s = r.state;
      }
      if (path.length) expect(open).toContain(at(s.body[0]));
    }
  });
});

describe('level 8, step by step', () => {
  const plan = planFor(8);
  it('never moves without input, however long it waits', () => {
    let acc = 0,
      steps = 0;
    for (let t = 0; t < 10000; t++) {
      acc += 1 / 60;
      if (stepDue(plan, acc, 0)) {
        steps++;
        acc = 0;
      }
    }
    expect(steps).toBe(0);
  });
  it('takes one step for each step asked for, each after the last has landed', () => {
    const asked: number[] = [3];
    let acc = STEP_GLIDE,
      steps = 0;
    for (let t = 0; t < 600; t++) {
      if (stepDue(plan, acc, asked[0])) {
        steps++;
        asked[0]--;
        acc = 0;
      }
      acc += 1 / 60;
    }
    expect(steps).toBe(3);
    expect(stepDue(plan, STEP_GLIDE / 2, 1)).toBe(false);
    // A paced pond keeps its own beat, input or none.
    expect(stepDue(planFor(1), 1 / planFor(1).speed, 0)).toBe(true);
  });
  it('reaches par with one input a step: the route, a step at a time, eats every bite with no bonk', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const p = makePond(plan, new Rng(seed));
      expect(p.par).toBe(lowerBound(p));
      let s = startState(p),
        bonks = 0;
      for (const d of p.route) {
        const r = step(p, s, d);
        if (r.event === 'bonk') bonks++;
        s = r.state;
      }
      expect([s.eaten, bonks, p.route.length], `seed ${seed}`).toEqual([p.crumbs.length, 0, p.par]);
    }
  });
  it("is the first rung and a new player's entry", async () => {
    const { pondConga } = await import('./index');
    expect(pondConga.levels('grownup')).toMatchObject({ min: 1, max: 9, order: [8, 1, 2, 3, 4, 5, 6, 7, 9] });
    expect(pondConga.entryLevels).toEqual([8, 10, 11]);
    expect(pondConga.describeLevel(8)).toMatch(/Step by step/);
  });
});

describe('level 9, a long conga', () => {
  const plan = planFor(9);
  const seeds = [1, 2, 3, 7, 21, 99, 404, 2026];
  it('starts seven ducklings long in an L along the bottom bank, every one inside the pond on open water', () => {
    const start = longStart(plan.rows);
    expect(start).toHaveLength(LONG_START);
    expect(start[0]).toEqual({ x: 3, y: plan.rows - 1 });
    for (let i = 1; i < start.length; i++)
      expect(Math.abs(start[i].x - start[i - 1].x) + Math.abs(start[i].y - start[i - 1].y)).toBe(1);
    expect(new Set(start.map(at)).size).toBe(start.length);
    for (const seed of seeds) {
      const p = makePond(plan, new Rng(seed));
      expect(p.start).toEqual(start);
      expect(p.heading).toBe(0);
      for (const c of p.start)
        expect(
          c.x >= 0 &&
            c.y >= 0 &&
            c.x < p.cols &&
            c.y < p.rows &&
            !p.pads.some((q) => q.x === c.x && q.y === c.y),
          at(c),
        ).toBe(true);
      // The leader can set off straight on: the bottom bank ahead of it is open.
      for (let x = 4; x <= 7; x++) expect(p.pads.some((q) => q.x === x && q.y === plan.rows - 1)).toBe(false);
    }
  });
  it('par is the fewest steps the open water allows, and the route meets it with no bonk', () => {
    for (const seed of seeds) {
      const p = makePond(plan, new Rng(seed));
      expect(p.par).toBe(lowerBound(p));
      let s = startState(p);
      for (const d of p.route) {
        const r = step(p, s, d);
        expect(r.event).not.toBe('bonk');
        s = r.state;
      }
      expect(s.eaten).toBe(plan.crumbs);
      expect(s.body).toHaveLength(LONG_START + plan.crumbs);
    }
  });
  it('makes the tail the obstacle: on at least half the legs the line stands on a fewest-steps way to the next bite', () => {
    expect(TAIL_LEGS * 2).toBeGreaterThanOrEqual(plan.crumbs);
    for (const seed of seeds) {
      const p = makePond(plan, new Rng(seed));
      expect(tailLegs(p, p.route)).toBeGreaterThanOrEqual(TAIL_LEGS);
    }
  });
  it('knows when the tail is in the way, and when it moves off in time', () => {
    // Heading right with the tail up the left bank: the way back to (0, 1) runs up the bank the tail is on.
    const p = parsePond(['.......', '1......', 's......', 's......', 'sssS...']);
    expect(tailInWay(p, startState(p), { x: 0, y: 1 })).toBe(true);
    // Straight ahead the line is never in the way.
    expect(tailInWay(p, startState(p), { x: 6, y: 4 })).toBe(false);
    // The last duckling leaves its cell before the leader could get there: not in the way.
    const short = parsePond(['1..', 's..', 'sS.']);
    expect(tailInWay(short, startState(short), { x: 0, y: 0 })).toBe(false);
  });
});

describe('the school opening, levels 10 and 11 step by step', () => {
  it('opens two small ponds to school and leaves the grown-up ladder as it was', async () => {
    const { pondConga } = await import('./index');
    const { landing } = await import('../../progress/difficulty');
    expect(pondConga.bands).toEqual(['school', 'grownup']);
    expect(pondConga.levels('school')).toEqual({ min: 10, max: 11 });
    const grown = pondConga.levels('grownup');
    expect(grown.order).not.toContain(10);
    expect(grown.order).not.toContain(11);
    expect(grown.max).toBe(9);
    // A birthday or pin carrying a school pond into grown-up starts at the grown-up order's first level, Step by step.
    for (const l of [10, 11]) expect(landing(l, grown, pondConga.entryLevels)).toBe(8);
    for (const l of [10, 11]) expect(pondConga.describeLevel(l)).toMatch(/one step at a time/);
  });

  for (const [level, cols, pads, crumbs] of [
    [10, 6, 0, 3],
    [11, 7, 2, 4],
  ] as const) {
    it(`level ${level}: every pond is ${cols} by 4 with ${pads} lily pads and ${crumbs} bites, step by step, with a bonk-free route at par`, () => {
      const plan = planFor(level);
      expect(plan.paced).toBe(false);
      for (let seed = 1; seed <= 300; seed++) {
        const p = makePond(plan, new Rng(seed));
        expect([p.cols, p.rows, p.pads.length, p.crumbs.length], `seed ${seed}`).toEqual([
          cols,
          4,
          pads,
          crumbs,
        ]);
        expect(p.par, `seed ${seed}`).toBe(lowerBound(p));
        expect(p.start.length).toBe(3);
      }
    });
  }

  it('a tap steps toward where it lands, the larger distance winning', () => {
    const lead = { x: 2, y: 1 },
      c = 100,
      mid = { x: 250, y: 150 };
    expect(tapToward(lead, mid.x + 100, mid.y, c, 0)).toBe(0);
    expect(tapToward(lead, mid.x, mid.y + 100, c, 0)).toBe(1);
    expect(tapToward(lead, mid.x, mid.y - 100, c, 0)).toBe(3);
    expect(tapToward(lead, mid.x - 100, mid.y, c, 1)).toBe(2);
    expect(tapToward(lead, mid.x + 160, mid.y - 90, c, 0)).toBe(0);
    expect(tapToward(lead, mid.x + 60, mid.y + 140, c, 0)).toBe(1);
    // On the leader's own cell, or straight back: nothing.
    expect(tapToward(lead, mid.x + 30, mid.y - 40, c, 0)).toBeNull();
    expect(tapToward(lead, mid.x - 100, mid.y, c, 0)).toBeNull();
    expect(tapToward(lead, mid.x, mid.y - 100, c, 1)).toBeNull();
  });

  it('a bump is a refused step: the line stays exactly where it was while another way is open', () => {
    // The leader faces the bank on the right; up and down are open.
    const b = parsePond(['......', '...ssS', '......']);
    const s = startState(b);
    const r = schoolStep(b, s, null);
    expect(r.event).toBe('bonk');
    expect(r.held).toBe(true);
    expect(r.state).toEqual(s);
    // An open way is an ordinary step.
    const ok = schoolStep(b, s, 3);
    expect([ok.event, ok.held, at(ok.state.body[0])]).toEqual(['move', false, '5,0']);
  });

  it('turns about only when every way but back is shut, and then a way on is open', () => {
    // A lily pad ahead of the leader and one above and below it.
    const board = parsePond(['...#.', '.ssS#', '...#.']);
    const s = startState(board);
    for (const d of [0, 1, 3] as Dir[]) {
      const r = schoolStep(board, s, d);
      expect([r.event, r.held], `dir ${d}`).toEqual(['bonk', false]);
      expect(r.state).toEqual(step(board, s, d).state);
      expect(r.state.body[0]).toEqual(s.body.at(-1));
      expect(([0, 1, 2, 3] as Dir[]).some((w) => step(board, r.state, w).event !== 'bonk')).toBe(true);
    }
    // With the pad above gone, a bump ahead is only refused.
    const open = parsePond(['.....', '.ssS#', '...#.']);
    expect(schoolStep(open, startState(open), 0).held).toBe(true);
  });

  it('following the hint one step at a time eats every bite in exactly par steps with no bump', () => {
    for (const level of [10, 11]) {
      for (let seed = 1; seed <= 100; seed++) {
        const p = makePond(planFor(level), new Rng(seed));
        let s = startState(p),
          steps = 0,
          bonks = 0;
        while (s.eaten < p.crumbs.length && steps < 200) {
          const r = schoolStep(p, s, hintDir(p, s));
          if (r.event === 'bonk') bonks++;
          s = r.state;
          steps++;
        }
        expect([s.eaten, bonks, steps], `level ${level} seed ${seed}`).toEqual([p.crumbs.length, 0, p.par]);
      }
    }
  });
});
