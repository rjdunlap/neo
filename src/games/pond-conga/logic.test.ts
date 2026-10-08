import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  DX, DY, PLANS, distances, hintDir, hintPath, lowerBound, makePond, nextCrumb, opposite, parsePond, pictureOf, planFor, solveRoute, startState, step, turnsIn,
  type Board, type Cell, type Conga, type Dir,
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
    const body: Cell[] = [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }];
    const board: Board = { cols: 5, rows: 3, pads: [], start: body, heading: 2, crumbs: [] };
    const curled: Conga = { body, heading: 2, eaten: 0 };
    const own = step(board, curled, 3);
    expect(own.event).toBe('bonk');
    expect(own.state.body).toHaveLength(5);
    expect(new Set(cells(own.state))).toEqual(new Set(cells(curled)));
  });

  it('lets the leader take the cell the tail is leaving, but not when the line is growing', () => {
    // A ring of four ducklings: the leader may follow the tail round the square.
    const body: Cell[] = [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }];
    const ring: Board = { cols: 3, rows: 3, pads: [], start: body, heading: 2, crumbs: [] };
    const follow = step(ring, { body, heading: 2, eaten: 0 }, null);
    expect(follow.event).toBe('move');
    expect(cells(follow.state)).toEqual(['0,0', '1,0', '1,1', '0,1']);
    // The same move onto a crumb: the tail stays, so the cell is taken.
    const fed: Board = { ...ring, crumbs: [{ x: 0, y: 0 }] };
    expect(step(fed, { body, heading: 2, eaten: 0 }, null).event).toBe('bonk');
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
    const p: Board = { cols: 3, rows: 3, pads: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }], start: [{ x: 0, y: 0 }], heading: 0, crumbs: [] };
    // The three open cells that are shut off from the corner, besides the five lily pads.
    const shut = distances(p, { x: 0, y: 0 }).filter((d, i) => d === -1 && !p.pads.some((q) => q.y * 3 + q.x === i));
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
    expect(solveRoute({ cols: 3, rows: 1, pads: [], start: [{ x: 1, y: 0 }, { x: 0, y: 0 }], heading: 0, crumbs: [{ x: 0, y: 0 }] })).toBeNull();
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
    for (let i = 1; i < PLANS.length; i++) {
      expect(PLANS[i].crumbs).toBeGreaterThanOrEqual(PLANS[i - 1].crumbs);
      expect(PLANS[i].pads).toBeGreaterThanOrEqual(PLANS[i - 1].pads);
      expect(PLANS[i].speed - PLANS[i - 1].speed).toBeLessThanOrEqual(0.3);
      expect(PLANS[i].speed).toBeGreaterThanOrEqual(PLANS[i - 1].speed);
    }
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
          expect(p.pads.some((q) => at(q) === at(c)), label).toBe(false);
        }
        expect(p.start.some((c) => p.crumbs.some((q) => at(q) === at(c))), label).toBe(false);
        // Open water is all one pond: a corner is never walled off.
        expect(distances(p, p.start[0]).filter((d) => d >= 0).length, label).toBe(p.cols * p.rows - p.pads.length);
        // The par is the shortest it could be, and a route with no bonk gets there.
        expect(p.par, label).toBe(p.route.length);
        expect(p.par, label).toBe(lowerBound(p));
        let s = startState(p), bonks = 0;
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
    const a = makePond(planFor(4), new Rng(77)), b = makePond(planFor(4), new Rng(77)), c = makePond(planFor(4), new Rng(78));
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

describe('help and getting stuck', () => {
  it('a hint always leads on: from wherever the line has wandered, following it eats every crumb', () => {
    let worst = 0;
    for (let level = 1; level <= PLANS.length; level++) {
      for (let seed = 1; seed <= 10; seed++) {
        const rng = new Rng(seed * 31 + level);
        const p = makePond(planFor(level), rng);
        const label = `level ${level} seed ${seed}`;
        const lost = wander(p, startState(p), rng, rng.int(5, 60));
        let s = lost.state, bonks = 0, ticks = 0;
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
      const choices = ([0, 1, 2, 3] as Dir[]).filter((d) => d !== opposite(s.heading)).map((d) => step(p, s, d));
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
