import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor } from '../../progress/difficulty';
import { FLOORS } from './floors';
import {
  countsAsHint,
  DIRECTIONS,
  distances,
  floorsFor,
  footprint,
  goal,
  isCradle,
  hasBridge,
  liesOnSwitch,
  refusesMoss,
  standsOnMoss,
  type State,
  key,
  LEVELS,
  makePuzzle,
  mirror,
  PLANS,
  roll,
  solutionStep,
  solved,
  standsOnCradle,
  startsAt,
} from './logic';

const ALL = FLOORS.flatMap((pool, i) =>
  pool.flatMap((floor) => [floor, mirror(floor)].map((f) => ({ level: i + 1, floor: f }))),
);

/** An independent forward BFS oracle: no production hint cache, reverse search or state key. */
const stateId = (s: State) => JSON.stringify([s.x, s.y, s.pose, !!s.bridge]);
function reachable(start: State, floor: readonly string[]) {
  const queue = [start],
    seen = new Set([stateId(start)]);
  for (let head = 0; head < queue.length; head++)
    for (const d of DIRECTIONS) {
      const n = roll(queue[head], d, floor);
      if (n && !seen.has(stateId(n))) {
        seen.add(stateId(n));
        queue.push(n);
      }
    }
  return queue;
}
function forwardDistance(start: State, floor: readonly string[]): number | null {
  const queue = [{ state: start, distance: 0 }],
    seen = new Set([stateId(start)]);
  for (let head = 0; head < queue.length; head++) {
    const { state, distance } = queue[head];
    if (solved(state, floor)) return distance;
    for (const d of DIRECTIONS) {
      const n = roll(state, d, floor);
      if (n && !seen.has(stateId(n))) {
        seen.add(stateId(n));
        queue.push({ state: n, distance: distance + 1 });
      }
    }
  }
  return null;
}

describe('Log Roll', () => {
  it('provides seeded upright starts at each exact planned depth', () => {
    for (let level = 1; level <= PLANS.length; level++)
      for (let seed = 0; seed < 40; seed++) {
        const p = makePuzzle(level, new Rng(seed));
        expect(p).toEqual(makePuzzle(level, new Rng(seed)));
        expect(p.start.pose).toBe('up');
        let state = p.start;
        for (let left = p.plan.depth; left > 0; left--) {
          const hint = solutionStep(state, p.plan.floor)!;
          expect(hint.distance).toBe(left);
          state = roll(state, hint.next!, p.plan.floor)!;
        }
        expect(solved(state, p.plan.floor)).toBe(true);
      }
  });
  it('freezes four floors a level, the original first on levels 1–3, of the level’s size, each with one finish and two or more starts', () => {
    expect(FLOORS[0][0]).toEqual(['.....', '.....', '.....', '.....', '....G']);
    for (let level = 1; level <= PLANS.length; level++) {
      const pool = floorsFor(level),
        [w, h] = [pool[0][0].length, pool[0].length];
      expect(pool).toHaveLength(4);
      expect(new Set(pool.map((f) => f.join('/'))).size).toBe(4);
      for (const floor of pool) {
        expect(floor).toHaveLength(h);
        expect(floor.every((row) => row.length === w && /^[. GCMBS]+$/.test(row))).toBe(true);
        const [hollows, cradles] = ['G', 'C'].map((v) => floor.join('').split(v).length - 1);
        expect([hollows, cradles]).toEqual(level === 5 ? [0, 2] : [1, 0]);
        expect(startsAt(floor, PLANS[level - 1].depth).length).toBeGreaterThanOrEqual(2);
        expect(startsAt(mirror(floor), PLANS[level - 1].depth)).toHaveLength(
          startsAt(floor, PLANS[level - 1].depth).length,
        );
      }
    }
    // Level 3 had two possible starts; its floors now give at least eight.
    expect(floorsFor(3).reduce((n, f) => n + startsAt(f, PLANS[2].depth).length, 0)).toBeGreaterThanOrEqual(
      8,
    );
  });
  it('makes level 4 the long way round: 8×6 floors at depth 16 whose gaps add at least eight rolls', () => {
    expect(PLANS[3].depth).toBe(16);
    expect(rangeFor(LEVELS, 'grownup')).toEqual({ min: 1, max: 7 });
    for (const floor of floorsFor(4)) {
      expect([floor[0].length, floor.length]).toEqual([8, 6]);
      const open = distances(floor.map((row) => row.replace(/ /g, '.')));
      for (const start of startsAt(floor, 16)) expect(open.get(key(start))!.distance).toBeLessThanOrEqual(8);
    }
  });
  it('reaches every floor and both mirrors across seeds, and the mirror moves the hollow', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const seen = new Set<string>();
      for (let seed = 0; seed < 200; seed++) seen.add(makePuzzle(level, new Rng(seed)).plan.floor.join('/'));
      expect(seen.size).toBe(8);
    }
    const f = FLOORS[0][0];
    expect(goal(f)).toEqual({ x: 4, y: 4, pose: 'up' });
    expect(goal(mirror(f))).toEqual({ x: 0, y: 4, pose: 'up' });
  });
  it('keeps every explored move reversible and every hint one step closer, on every floor and mirror', () => {
    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' } as const;
    for (const { floor } of ALL.filter((v) => v.level <= 6))
      for (const v of distances(floor).values()) {
        for (const d of DIRECTIONS) {
          const n = roll(v.state, d, floor);
          if (!n) continue;
          expect(footprint(n).every(([x, y]) => '.GCM'.includes(floor[y]?.[x] ?? ' '))).toBe(true);
          expect(roll(n, opposite[d], floor)).toEqual(v.state);
          expect(solutionStep(n, floor)).not.toBeNull();
        }
        if (v.next) expect(solutionStep(roll(v.state, v.next, floor)!, floor)!.distance).toBe(v.distance - 1);
      }
  });
  it('uses the two-cell footprint, rejects edges and holes, and requires an upright finish', () => {
    const open = FLOORS[0][0],
      gaps = FLOORS[1][0];
    const s = { x: 0, y: 0, pose: 'up' } as const;
    expect(roll(s, 'right', open)).toEqual({ x: 1, y: 0, pose: 'across' });
    expect(roll(s, 'left', open)).toBeNull();
    expect(roll({ x: 2, y: 0, pose: 'up' }, 'down', gaps)).toBeNull();
    expect(key(s)).toBe('0,0,up');
    expect(solved({ x: 3, y: 4, pose: 'across' }, open)).toBe(false);
    expect(solved({ x: 4, y: 4, pose: 'up' }, open)).toBe(true);
  });
  it('makes level 5 a cradle: 6×5 floors at depth 10 that finish lying across both cradle stones, both ways', () => {
    expect(PLANS[4].depth).toBe(10);
    expect(isCradle(floorsFor(4)[0])).toBe(false);
    const poses = new Set<string>();
    for (const { level, floor } of ALL.filter((v) => v.level === 5)) {
      expect([floor[0].length, floor.length]).toEqual([6, 5]);
      expect(isCradle(floor)).toBe(true);
      const finish = goal(floor);
      poses.add(finish.pose);
      // The finish covers exactly the two cradle stones, one of them on the floor's edge.
      const cells = footprint(finish);
      expect(cells.map(([x, y]) => floor[y][x])).toEqual(['C', 'C']);
      expect(cells.some(([x, y]) => x === 0 || y === 0 || x === 5 || y === 4)).toBe(true);
      // Standing on either cradle stone is reachable here, never solved, and flagged for the status line.
      for (const [x, y] of cells) {
        const up = { x, y, pose: 'up' } as const;
        expect(solved(up, floor)).toBe(false);
        expect(standsOnCradle(up, floor)).toBe(true);
        expect(distances(floor).get(key(up))!.distance).toBeGreaterThan(0);
      }
      // The other lying pose touching a cradle stone is not the finish either.
      for (const v of distances(floor).values())
        if (solved(v.state, floor)) expect(key(v.state)).toBe(key(finish));
      expect(startsAt(floor, PLANS[level - 1].depth).length).toBeGreaterThanOrEqual(3);
    }
    expect([...poses].sort()).toEqual(['across', 'along']);
    // Hollow levels never report a cradle stand.
    expect(standsOnCradle({ x: 4, y: 4, pose: 'up' }, FLOORS[0][0])).toBe(false);
  });
  it('ends every level-5 route on a roll that lays the log down', () => {
    for (let seed = 0; seed < 40; seed++) {
      const p = makePuzzle(5, new Rng(seed));
      let state = p.start,
        before = state;
      while (!solved(state, p.plan.floor)) {
        before = state;
        state = roll(state, solutionStep(state, p.plan.floor)!.next!, p.plan.floor)!;
      }
      expect(state.pose).not.toBe('up');
      expect(before.pose === 'up' || before.pose === state.pose).toBe(true);
    }
  });
  it('preserves all twenty existing frozen floors and their depths', () => {
    expect(PLANS.slice(0, 5).map((p) => p.depth)).toEqual([4, 8, 12, 16, 10]);
    expect(FLOORS.slice(0, 5)).toEqual([
      [
        ['.....', '.....', '.....', '.....', '....G'],
        ['.....', '.....', '... .', '.....', 'G....'],
        ['.....', '....G', '. ...', '.....', '.....'],
        ['.....', 'G....', '.....', '... .', '.....'],
      ],
      [
        ['......', '.. ...', '......', '... ..', '.....G'],
        ['......', '.. ...', '.... .', '......', 'G.....'],
        ['......', '.. ...', '.... .', '......', '...G..'],
        ['......', '.. ...', '.....G', '... ..', '......'],
      ],
      [
        ['.......', '. .....', '.... ..', '.. ....', '......G'],
        ['.....G.', '... ...', '. ... .', '.......', '.......'],
        ['.G.....', '. . ...', '.......', '.... ..', '.......'],
        ['..G....', '.. .  .', '.......', '.......', '.......'],
      ],
      [
        ['........', '.  .....', '...... .', '... . ..', '... .. G', '........'],
        ['......G.', '... ....', '.. ..  .', '.... ...', '. .. ...', '........'],
        ['........', '.    ...', '...... .', '.. .....', '...... G', '........'],
        ['........', '.. .....', '... ....', 'G.   . .', '..... ..', '........'],
      ],
      [
        ['..CC..', '... ..', '......', '... ..', '......'],
        ['..C...', '..C...', '.. ...', '.. ...', '......'],
        ['......', '.. ...', '......', '.. ...', 'CC....'],
        ['......', '... ..', '......', '... .C', '.....C'],
      ],
    ]);
  });
  it('makes moss soft only for a standing log and includes it on every planned route', () => {
    expect(PLANS[5].depth).toBe(8);
    for (const { floor } of ALL.filter((v) => v.level === 6)) {
      expect([floor[0].length, floor.length]).toEqual([6, 5]);
      expect(floor.join('').split('M')).toHaveLength(4);
      let refused = 0,
        supported = 0;
      const plain = floor.map((row) => row.replace(/M/g, '.'));
      for (const { state } of distances(floor).values()) {
        expect(standsOnMoss(state, floor)).toBe(false);
        if (footprint(state).some(([x, y]) => floor[y][x] === 'M')) {
          expect(state.pose).not.toBe('up');
          supported++;
        }
        for (const d of DIRECTIONS) {
          const unsoftened = roll(state, d, plain);
          if (unsoftened && standsOnMoss(unsoftened, floor)) {
            expect(refusesMoss(state, d, floor)).toBe(true);
            expect(roll(state, d, floor)).toBeNull();
            refused++;
          }
        }
      }
      expect(refused).toBeGreaterThan(0);
      expect(supported).toBeGreaterThan(0);
      for (const start of startsAt(floor, PLANS[5].depth)) {
        let state = start,
          crossed = false;
        for (let guard = 0; guard < PLANS[5].depth; guard++) {
          state = roll(state, solutionStep(state, floor)!.next!, floor)!;
          crossed ||= footprint(state).some(([x, y]) => floor[y][x] === 'M');
        }
        expect(crossed).toBe(true);
        expect(solved(state, floor)).toBe(true);
      }
    }
  });
  it('raises the bridge only with a standing switch press and keeps the flag on later rolls', () => {
    const floor = ['......G', '.......', '...S...', '.......', '.......'];
    const standingPress = roll({ x: 1, y: 2, pose: 'across' }, 'right', floor)!;
    expect(standingPress).toEqual({ x: 3, y: 2, pose: 'up', bridge: true });
    expect(roll(standingPress, 'right', floor)?.bridge).toBe(true);
    const lyingPress = roll({ x: 1, y: 2, pose: 'up' }, 'right', floor)!;
    expect(liesOnSwitch(lyingPress, floor)).toBe(true);
    expect(lyingPress.bridge).toBeUndefined();
    expect(liesOnSwitch(standingPress, floor)).toBe(false);
    expect(key(standingPress)).not.toBe(key({ ...standingPress, bridge: false }));
    const crossing = ['......G', '..BB...', '.......'];
    expect(roll({ x: 1, y: 1, pose: 'up' }, 'right', crossing)).toBeNull();
    expect(roll({ x: 1, y: 1, pose: 'up', bridge: true }, 'right', crossing)).toEqual({
      x: 2,
      y: 1,
      pose: 'across',
      bridge: true,
    });
  });
  it('requires the switch from every bridge start and allows lying exploration without pressing it', () => {
    expect(PLANS[6].depth).toBe(12);
    for (const { floor } of ALL.filter((v) => v.level === 7)) {
      expect(hasBridge(floor)).toBe(true);
      expect(floor.join('').split('B')).toHaveLength(3);
      expect(floor.join('').split('S')).toHaveLength(2);
      const noSwitch = floor.map((row) => row.replace(/S/g, '.'));
      for (const start of startsAt(floor, PLANS[6].depth)) {
        expect(start.bridge).toBeUndefined();
        expect(floor[start.y][start.x]).toBe('.');
        expect(forwardDistance(start, noSwitch)).toBeNull();
        const states = reachable(start, floor);
        expect(states.some((s) => !s.bridge && liesOnSwitch(s, floor))).toBe(true);
        expect(states.some((s) => !!s.bridge)).toBe(true);
      }
    }
  });
  it('gives exact bridge hints after any revision and never strands a reachable state', () => {
    let worstHint = 0,
      totalStates = 0;
    for (const { floor } of ALL.filter((v) => v.level === 7)) {
      // Includes all directions from a start, so this covers wandering, repeated presses and both flags.
      const start = startsAt(floor, PLANS[6].depth)[0];
      for (const state of reachable(start, floor)) {
        totalStates++;
        const exact = forwardDistance(state, floor);
        expect(exact).not.toBeNull();
        const t0 = performance.now(),
          hint = solutionStep(state, floor);
        worstHint = Math.max(worstHint, performance.now() - t0);
        expect(hint?.distance).toBe(exact);
        if (!exact) expect(hint?.next).toBeNull();
        else {
          const next = roll(state, hint!.next!, floor)!;
          expect(next).not.toBeNull();
          expect(forwardDistance(next, floor)).toBe(exact! - 1);
          // Every shortest alternative is still a valid step; hints do not impose one saved route.
          const alternatives = DIRECTIONS.map((d) => roll(state, d, floor)).filter((n): n is State => !!n);
          expect(alternatives.some((n) => forwardDistance(n, floor) === exact! - 1)).toBe(true);
        }
      }
    }
    expect(totalStates).toBeGreaterThan(500);
    expect(worstHint).toBeLessThan(100);
  });
  it('counts a glowing hint once', () => {
    expect(countsAsHint(null, 'up')).toBe(true);
    expect(countsAsHint('up', 'up')).toBe(false);
    expect(countsAsHint('left', 'up')).toBe(true);
  });
});
