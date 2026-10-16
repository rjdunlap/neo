import { describe, expect, it } from 'vitest';
import { COURSES, courseBoards, courseMinimum, parseBoard, type PondCourseId } from './course';
import { eaten, move, solve, type Cell, type Dir, type SlidePuzzle } from './logic';

const key = (c: Cell) => `${c.x},${c.y}`;
const IDS: PondCourseId[] = ['practice', 'ponds', 'frozen'];
/** Where the penguin is, which fish are eaten, and where every ice block stands. */
const stateKey = (at: Cell, have: number, blocks: Cell[]) => `${key(at)},${have},${blocks.map(key).sort().join(';')}`;

/** How many different shortest routes eat every fish (a push is one move, like a slide). */
function shortestRoutes(p: SlidePuzzle): number {
  const all = (1 << p.fish.length) - 1;
  const start = p.blocks ?? [];
  let frontier = new Map<string, { at: Cell; have: number; blocks: Cell[]; ways: number }>([[stateKey(p.start, 0, start), { at: p.start, have: 0, blocks: start, ways: 1 }]]);
  const seen = new Set(frontier.keys());
  for (let depth = 1; frontier.size && depth <= 20; depth++) {
    const next = new Map<string, { at: Cell; have: number; blocks: Cell[]; ways: number }>();
    let done = 0;
    for (const s of frontier.values()) {
      for (const dir of [0, 1, 2, 3] as Dir[]) {
        const m = move(p, s.at, dir, s.blocks);
        if (!m) continue;
        const have = s.have | eaten(p, m.passed);
        if (have === all) { done += s.ways; continue; }
        const k = stateKey(m.to, have, m.blocks);
        if (seen.has(k) && !next.has(k)) continue;
        const old = next.get(k);
        next.set(k, { at: m.to, have, blocks: m.blocks, ways: (old?.ways ?? 0) + s.ways });
      }
    }
    if (done) return done;
    for (const k of next.keys()) seen.add(k);
    frontier = next;
  }
  return 0;
}

/** States the penguin can reach from which no slide sequence eats the remaining fish. */
function deadEnds(p: SlidePuzzle): number {
  const all = (1 << p.fish.length) - 1;
  const seen = new Set<string>([stateKey(p.start, 0, p.blocks ?? [])]);
  const queue = [{ at: p.start, have: 0, blocks: p.blocks ?? [] }];
  let dead = 0;
  for (let head = 0; head < queue.length; head++) {
    const s = queue[head];
    if (s.have !== all && solve(p, s.at, s.have, s.blocks).moves < 0) dead++;
    if (s.have === all) continue;
    for (const dir of [0, 1, 2, 3] as Dir[]) {
      const m = move(p, s.at, dir, s.blocks);
      if (!m) continue;
      const have = s.have | eaten(p, m.passed);
      const k = stateKey(m.to, have, m.blocks);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ at: m.to, have, blocks: m.blocks });
    }
  }
  return dead;
}

describe('challenge courses', () => {
  it('reads a board from its picture, with the solver supplying the fewest slides', () => {
    const p = parseBoard(['P.~F', '.#..']);
    expect(p).toMatchObject({ cols: 4, rows: 2, start: { x: 0, y: 0 }, rocks: [{ x: 1, y: 1 }], soft: [{ x: 2, y: 0 }], fish: [{ x: 3, y: 0 }] });
    expect(p.best).toBe(solve(p, p.start).moves);
    expect(() => parseBoard(['...', '.F.'])).toThrow(/penguin/);
    expect(p.blocks).toBeUndefined();
    expect(parseBoard(['P.B', '..F']).blocks).toEqual([{ x: 2, y: 0 }]);
  });

  it('keeps every board tidy: one penguin, rectangular, nothing off the grid, fish that can all be reached', () => {
    for (const id of IDS) for (const rows of COURSES[id].boards) {
      expect(new Set(rows.map(r => r.length)).size, 'rectangular').toBe(1);
      expect(rows.join('')).toMatch(id === 'frozen' ? /^[.#~FPB]+$/ : /^[.#~FP]+$/);
      expect([...rows.join('')].filter(c => c === 'P')).toHaveLength(1);
      const p = parseBoard(rows);
      expect(p.fish.length).toBeGreaterThanOrEqual(1);
      expect(p.best).toBeGreaterThan(0);
      expect(p.cols).toBeLessThanOrEqual(7);
      expect(p.rows).toBeLessThanOrEqual(6);
    }
  });

  it('freezes the courses: fixed boards, a rising shortest route, and a known minimum', () => {
    expect(COURSES.ponds.version).toBe(1);
    expect(COURSES.practice.version).toBe(1);
    // Changing a pond changes these numbers, and so has to change the course version.
    expect(courseBoards('ponds').map(b => b.best)).toEqual([3, 5, 6, 7, 9]);
    expect(courseMinimum('ponds')).toBe(30);
    expect(courseBoards('ponds').map(b => b.fish.length)).toEqual([1, 1, 2, 2, 3]);
    expect(courseBoards('practice').map(b => b.best)).toEqual([2, 3, 4, 4, 5]);
    expect(courseMinimum('practice')).toBe(18);
    expect(courseBoards('practice').map(b => b.fish.length)).toEqual([1, 1, 1, 2, 2]);
    expect(COURSES.frozen.version).toBe(1);
    expect(courseBoards('frozen').map(b => b.best)).toEqual([4, 5, 6, 7, 9]);
    expect(courseMinimum('frozen')).toBe(31);
    expect(courseBoards('frozen').map(b => b.fish.length)).toEqual([1, 1, 2, 2, 2]);
    expect(courseBoards('frozen').map(b => b.blocks?.length ?? 0)).toEqual([1, 1, 1, 1, 2]);
  });

  it('gives every pond exactly one shortest route, so the minimum is a real puzzle and not a lucky guess', () => {
    for (const id of IDS) for (const p of courseBoards(id)) expect(shortestRoutes(p)).toBe(1);
  });

  it('makes soft snow matter wherever it appears', () => {
    for (const id of IDS) for (const p of courseBoards(id)) {
      if (!p.soft.length) continue;
      expect(solve({ ...p, soft: [] }, p.start).moves).not.toBe(p.best);
    }
  });

  it('makes every ice block matter: frozen in place like a rock, the route is longer or gone', () => {
    for (const p of courseBoards('frozen')) {
      expect(p.blocks?.length).toBeGreaterThan(0);
      p.blocks!.forEach((b, i) => {
        const frozen = solve({ ...p, rocks: [...p.rocks, b], blocks: p.blocks!.filter((_, j) => j !== i) }, p.start).moves;
        expect(frozen === -1 || frozen > p.best).toBe(true);
      });
    }
  });

  it('only the Frozen Ponds have ice blocks, and they can trap a careless push (undo is the way back)', () => {
    for (const id of ['practice', 'ponds'] as const) for (const p of courseBoards(id)) expect(p.blocks).toBeUndefined();
    expect(courseBoards('frozen').reduce((n, p) => n + deadEnds(p), 0)).toBeGreaterThan(0);
  });

  it('keeps Pond Practice free of dead ends, so nobody is ever stuck there, while the Five Ponds do have traps', () => {
    for (const p of courseBoards('practice')) expect(deadEnds(p)).toBe(0);
    expect(courseBoards('ponds').reduce((n, p) => n + deadEnds(p), 0)).toBeGreaterThan(20);
  });

  it('is easier at every step than the Five Ponds, and shorter overall', () => {
    const easy = courseBoards('practice'), hard = courseBoards('ponds');
    easy.forEach((p, i) => expect(p.best).toBeLessThanOrEqual(hard[i].best));
    expect(courseMinimum('practice')).toBeLessThan(courseMinimum('ponds'));
  });

  it('follows the solver from the start to the best total with nothing stuck', () => {
    for (const id of IDS) {
      let total = 0;
      for (const p of courseBoards(id)) {
        let at = p.start, have = 0, used = 0, blocks = p.blocks ?? [];
        while (have !== (1 << p.fish.length) - 1 && used <= p.best) {
          const { first } = solve(p, at, have, blocks);
          expect(first).not.toBe(-1);
          const m = move(p, at, first as Dir, blocks)!;
          have |= eaten(p, m.passed); at = m.to; blocks = m.blocks; used++;
        }
        expect(used).toBe(p.best);
        total += used;
      }
      expect(total).toBe(courseMinimum(id));
    }
  });
});
