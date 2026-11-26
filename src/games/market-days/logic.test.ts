import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  EMPTY,
  FAIR,
  LEVELS,
  PRESET_TRIANGLE,
  bannersUsed,
  clashes,
  deadEnd,
  describeLevel,
  hintFor,
  inConflict,
  isDone,
  makeRound,
  mirror,
  neighbourLists,
  neighbourPairs,
  planFor,
  solve,
  townToward,
  tooManyDays,
  triangles,
} from './logic';

const MAPS = [false, true].flatMap((fx) => [false, true].map((fy) => mirror(FAIR, fx, fy)));
const blank = (n = 8) => Array<number>(n).fill(EMPTY);

describe('Market Days map', () => {
  it('fair has exactly the thirteen neighbour pairs', () => {
    expect(neighbourPairs(FAIR)).toEqual([
      [0, 1],
      [0, 2],
      [0, 4],
      [1, 2],
      [1, 3],
      [1, 4],
      [3, 4],
      [3, 6],
      [4, 5],
      [4, 6],
      [5, 6],
      [5, 7],
      [6, 7],
    ]);
    expect(neighbourLists(FAIR).map((l) => l.length)).toEqual([3, 4, 2, 3, 5, 3, 4, 2]);
  });

  it('each mirror keeps the pair count and the degrees', () => {
    for (const m of MAPS) {
      expect(neighbourPairs(m)).toHaveLength(13);
      expect(neighbourLists(m).map((l) => l.length)).toEqual([3, 4, 2, 3, 5, 3, 4, 2]);
    }
  });

  it('has six triangles, so two days can never work', () => {
    expect(triangles(FAIR)).toEqual([
      [0, 1, 2],
      [0, 1, 4],
      [1, 3, 4],
      [3, 4, 6],
      [4, 5, 6],
      [5, 6, 7],
    ]);
  });

  it('counts the proper assignments exhaustively, on every mirror', () => {
    for (const m of MAPS) {
      expect(solve(m, 2, blank(), 5000)).toHaveLength(0);
      const three = solve(m, 3, blank(), 5000);
      expect(three).toHaveLength(6);
      const partitions = new Set(
        three.map((a) =>
          [0, 1, 2]
            .map((d) => a.flatMap((v, i) => (v === d ? [i] : [])).join(','))
            .sort()
            .join('|'),
        ),
      );
      expect([...partitions]).toEqual(['0,3,5|1,6|2,4,7'.split('|').sort().join('|')]);
      expect(solve(m, 4, blank(), 5000)).toHaveLength(768);
    }
  });
});

describe('solve and clashes', () => {
  it('is empty when the placed towns already clash', () => {
    const a = blank();
    a[0] = 1;
    a[1] = 1;
    expect(solve(FAIR, 3, a)).toEqual([]);
    expect([...inConflict(FAIR, a)].sort()).toEqual([0, 1]);
    expect(clashes(FAIR, a)).toEqual([[0, 1]]);
  });

  it("level 1's preset triangle leaves exactly one finish", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const r = makeRound(1, new Rng(seed));
      const tri = PRESET_TRIANGLE.map((t) => r.map.towns[t]);
      expect(tri).toHaveLength(3);
      expect(
        triangles(r.map).some((t) => t.join() === [...PRESET_TRIANGLE].sort((a, b) => a - b).join()),
      ).toBe(true);
      expect(new Set(PRESET_TRIANGLE.map((t) => r.start[t])).size).toBe(3);
      const finish = solve(r.map, 3, r.start, 50);
      expect(finish).toHaveLength(1);
      expect(isDone(r.map, r.plan, finish[0])).toBe(true);
    }
  });

  it('never returns anything but the unique answer from a legal partial of three banners', () => {
    const rng = new Rng(7);
    const answers = solve(FAIR, 3, blank(), 50);
    for (let k = 0; k < 120; k++) {
      const a = blank();
      const placed = rng.int(1, 6);
      for (let i = 0; i < placed; i++) {
        const t = rng.int(0, 7);
        if (a[t] === EMPTY) a[t] = rng.int(0, 2);
      }
      if (clashes(FAIR, a).length) continue;
      const ext = solve(FAIR, 3, a, 50);
      for (const e of ext) expect(answers.some((s) => s.join() === e.join())).toBe(true);
    }
  });
});

describe('rounds and levels', () => {
  it('lists the ladder: three for grown-ups, two for school', () => {
    expect(LEVELS.grownup).toEqual({ min: 1, max: 3 });
    expect(LEVELS.school).toEqual({ min: 1, max: 2 });
    for (let l = 1; l <= 3; l++) expect(describeLevel(l).length).toBeGreaterThan(10);
  });

  it('seeds the same round the same way and differs between seeds', () => {
    const a = makeRound(2, new Rng(5));
    const b = makeRound(2, new Rng(5));
    expect(a).toEqual(b);
    const looks = new Set(Array.from({ length: 30 }, (_, i) => makeRound(2, new Rng(i + 1)).looks.join()));
    expect(looks.size).toBeGreaterThan(5);
  });

  it('level 3 is done at three banners only; four banners is not done and not a miss', () => {
    const plan = planFor(3);
    const three = solve(FAIR, 3, blank(), 1)[0];
    expect(isDone(FAIR, plan, three)).toBe(true);
    const four = solve(FAIR, 4, blank(), 800).find((a) => bannersUsed(a) === 4)!;
    expect(isDone(FAIR, plan, four)).toBe(false);
    expect(tooManyDays(FAIR, plan, four)).toBe(true);
    expect(tooManyDays(FAIR, plan, three)).toBe(false);
  });

  it('isDone is exactly "all placed and none clashes" at levels 1 and 2', () => {
    const plan = planFor(2);
    const full = solve(FAIR, 3, blank(), 1)[0];
    expect(isDone(FAIR, plan, full)).toBe(true);
    const part = [...full];
    part[2] = EMPTY;
    expect(isDone(FAIR, plan, part)).toBe(false);
    const bad = [...full];
    bad[0] = bad[1];
    expect(isDone(FAIR, plan, bad)).toBe(false);
  });

  it('finds a dead end when a legal placement leaves a town no day', () => {
    const plan = planFor(2);
    const a = blank();
    // Town 4 has five neighbours; give three of them the three banners.
    a[0] = 0;
    a[1] = 1;
    a[5] = 2;
    expect(clashes(FAIR, a)).toEqual([]);
    expect(deadEnd(FAIR, plan, a)).toBe(4);
    expect(deadEnd(FAIR, plan, blank())).toBeNull();
  });
});

describe('the hint', () => {
  const plan2 = planFor(2);

  it('names a forced town, never a placed one, and a repeated hint finishes the round', () => {
    for (const level of [1, 2, 3]) {
      const r = makeRound(level, new Rng(level * 11));
      let a = [...r.start];
      for (let guard = 0; guard < 12 && a.some((v) => v === EMPTY); guard++) {
        const h = hintFor(r.map, r.plan, a)!;
        expect(h.kind === 'forced' || h.kind === 'triangle').toBe(true);
        if (h.kind !== 'forced' && h.kind !== 'triangle') return;
        expect(a[h.town]).toBe(EMPTY);
        a = a.map((v, i) => (i === h.town ? h.banner : v));
        expect(clashes(r.map, a)).toEqual([]);
      }
      expect(isDone(r.map, r.plan, a)).toBe(true);
    }
  });

  it('names a forced town whenever one exists, and its banner is the same in every finish', () => {
    const rng = new Rng(3);
    for (let k = 0; k < 80; k++) {
      const a = blank();
      for (let i = 0; i < rng.int(1, 5); i++) a[rng.int(0, 7)] = rng.int(0, 2);
      if (clashes(FAIR, a).length) continue;
      const ext = solve(FAIR, 3, a, 50);
      if (!ext.length || a.every((v) => v !== EMPTY)) continue;
      const forced = a.flatMap((v, t) => (v === EMPTY && ext.every((e) => e[t] === ext[0][t]) ? [t] : []));
      const h = hintFor(FAIR, plan2, a)!;
      if (forced.length) {
        expect(h.kind).toBe('forced');
        if (h.kind === 'forced') expect(ext.every((e) => e[h.town] === h.banner)).toBe(true);
      } else expect(h.kind).toBe('triangle');
    }
  });

  it('points at the towns holding a fourth banner on level 3, and at a dead end when stuck', () => {
    const plan3 = planFor(3);
    const a = blank();
    a[2] = 3;
    expect(hintFor(FAIR, plan3, a)).toEqual({ kind: 'fewer', towns: [2] });
    const stuck = blank();
    stuck[0] = 0;
    stuck[1] = 1;
    stuck[5] = 2;
    expect(hintFor(FAIR, plan2, stuck)).toEqual({ kind: 'stuck', town: 4 });
    expect(hintFor(FAIR, plan2, solve(FAIR, 3, blank(), 1)[0])).toBeNull();
  });
});

describe('townToward (the key ring)', () => {
  it('reaches every town of every mirrored map from the first, by arrows alone', () => {
    for (const [fx, fy] of [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ] as const) {
      const map = mirror(FAIR, fx, fy);
      const seen = new Set([0]);
      const queue = [0];
      while (queue.length) {
        const at = queue.pop()!;
        for (const dir of [0, 1, 2, 3]) {
          const next = townToward(map, at, dir);
          if (next !== null && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      expect(seen.size).toBe(map.towns.length);
    }
  });
  it('moves toward the key pressed and stops at an edge', () => {
    const map = FAIR;
    const left = map.towns.reduce((a, t, i) => (t.x < map.towns[a].x ? i : a), 0);
    expect(townToward(map, left, 2)).toBeNull();
    const right = townToward(map, left, 0);
    expect(right).not.toBeNull();
    expect(map.towns[right!].x).toBeGreaterThan(map.towns[left].x);
  });
});
