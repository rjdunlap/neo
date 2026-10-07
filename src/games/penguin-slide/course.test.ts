import { describe, expect, it } from 'vitest';
import { COURSES, courseBoards, courseMinimum, parseBoard, type PondCourseId } from './course';
import { eaten, slide, solve, type Cell, type Dir, type SlidePuzzle } from './logic';

const key = (c: Cell) => `${c.x},${c.y}`;
const IDS: PondCourseId[] = ['practice', 'ponds'];

/** How many different shortest routes eat every fish. */
function shortestRoutes(p: SlidePuzzle): number {
  const all = (1 << p.fish.length) - 1;
  let frontier = new Map<string, { at: Cell; have: number; ways: number }>([[`${key(p.start)},0`, { at: p.start, have: 0, ways: 1 }]]);
  const seen = new Set(frontier.keys());
  for (let depth = 1; frontier.size && depth <= 20; depth++) {
    const next = new Map<string, { at: Cell; have: number; ways: number }>();
    let done = 0;
    for (const s of frontier.values()) {
      for (const dir of [0, 1, 2, 3] as Dir[]) {
        const { to, passed } = slide(p, s.at, dir);
        if (!passed.length) continue;
        const have = s.have | eaten(p, passed);
        if (have === all) { done += s.ways; continue; }
        const k = `${key(to)},${have}`;
        if (seen.has(k) && !next.has(k)) continue;
        const old = next.get(k);
        next.set(k, { at: to, have, ways: (old?.ways ?? 0) + s.ways });
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
  const seen = new Set<string>([`${key(p.start)},0`]);
  const queue = [{ at: p.start, have: 0 }];
  let dead = 0;
  for (let head = 0; head < queue.length; head++) {
    const s = queue[head];
    if (s.have !== all && solve(p, s.at, s.have).moves < 0) dead++;
    for (const dir of [0, 1, 2, 3] as Dir[]) {
      const { to, passed } = slide(p, s.at, dir);
      if (!passed.length) continue;
      const have = s.have | eaten(p, passed);
      const k = `${key(to)},${have}`;
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ at: to, have });
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
  });

  it('keeps every board tidy: one penguin, rectangular, nothing off the grid, fish that can all be reached', () => {
    for (const id of IDS) for (const rows of COURSES[id].boards) {
      expect(new Set(rows.map(r => r.length)).size, 'rectangular').toBe(1);
      expect(rows.join('')).toMatch(/^[.#~FP]+$/);
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
        let at = p.start, have = 0, used = 0;
        while (have !== (1 << p.fish.length) - 1) {
          const { first } = solve(p, at, have);
          expect(first).not.toBe(-1);
          const s = slide(p, at, first as Dir);
          have |= eaten(p, s.passed); at = s.to; used++;
        }
        expect(used).toBe(p.best);
        total += used;
      }
      expect(total).toBe(courseMinimum(id));
    }
  });
});
