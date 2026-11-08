import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  allLit,
  footprint,
  formatPond,
  fewestPresses,
  fullBoard,
  hintFor,
  isLantern,
  lanternCount,
  litCount,
  makePond,
  makePonds,
  namedHint,
  shapeMask,
  SHAPES,
  shortWay,
  parsePond,
  planFor,
  PLANS,
  press,
  pressAll,
  solve,
  stuckAt,
  type Size,
} from './logic';

/** Exhaustive truth for a small board: for every set of presses, the board it makes from all-lit and its size. */
function fewestByBruteForce(size: number): Uint8Array {
  const n = size * size,
    fp = Array.from({ length: n }, (_, i) => footprint(size, i).reduce((m, c) => m | (1 << c), 0));
  const table = new Uint8Array(2 ** n).fill(255);
  let board = 2 ** n - 1,
    weight = 0,
    set = 0;
  table[board] = 0;
  // A Gray code visits every set of presses, flipping one lantern's press at each step.
  for (let i = 1; i < 2 ** n; i++) {
    const k = 31 - Math.clz32(i & -i);
    board ^= fp[k];
    set ^= 1 << k;
    weight += set & (1 << k) ? 1 : -1;
    if (weight < table[board]) table[board] = weight;
  }
  return table;
}
const bitsOf = (board: readonly boolean[]) => board.reduce((m, on, i) => (on ? m | (1 << i) : m), 0);

describe('lantern pressing', () => {
  it('flips a lantern and the ones beside it, never more', () => {
    expect(footprint(5, 12)).toEqual([7, 11, 12, 13, 17]);
    expect(footprint(5, 0)).toEqual([0, 1, 5]);
    expect(footprint(5, 24)).toEqual([19, 23, 24]);
    expect(footprint(3, 4)).toEqual([1, 3, 4, 5, 7]);
    const lit = fullBoard(3);
    expect(press(lit, 3, 4)).toEqual([true, false, true, false, false, false, true, false, true]);
    expect(lit.every(Boolean)).toBe(true);
  });

  it('is its own undo, and the order of presses never matters', () => {
    const board = [
      true,
      false,
      false,
      true,
      true,
      false,
      false,
      false,
      true,
      true,
      true,
      false,
      false,
      true,
      false,
      true,
    ];
    expect(press(press(board, 4, 5), 4, 5)).toEqual(board);
    expect(pressAll(board, 4, [1, 6, 10])).toEqual(pressAll(board, 4, [10, 1, 6]));
    expect(pressAll(board, 4, [3, 3, 7, 7])).toEqual(board);
  });
});

describe('lantern solving', () => {
  it('knows the fewest presses on small boards exactly: every 3 by 3 and every 4 by 4 board', () => {
    for (const size of [3, 4] as const) {
      const table = fewestByBruteForce(size),
        n = size * size;
      for (let bits = 0; bits < 2 ** n; bits += size === 3 ? 1 : 7) {
        const board = Array.from({ length: n }, (_, i) => (bits & (1 << i)) !== 0);
        const got = fewestPresses(board, size);
        expect(got, `${size}x${size} board ${bits.toString(2)}`).toBe(
          table[bits] === 255 ? null : table[bits],
        );
      }
    }
  });

  it('knows the fewest presses on every 5 by 5 board it is asked about, and which boards cannot be lit', () => {
    const table = fewestByBruteForce(5),
      rng = new Rng(2024);
    let lit = 0,
      dark = 0;
    for (let i = 0; i < 4000; i++) {
      const board = Array.from({ length: 25 }, () => rng.chance(0.5));
      const truth = table[bitsOf(board)];
      expect(fewestPresses(board, 5), `board ${bitsOf(board)}`).toBe(truth === 255 ? null : truth);
      if (truth === 255) dark++;
      else lit++;
    }
    // About a quarter of all boards can be lit; both kinds were met.
    expect(lit).toBeGreaterThan(300);
    expect(dark).toBeGreaterThan(300);
  });

  it('finds every way: each one lights the board, and there are two to the number of free choices', () => {
    const rng = new Rng(7);
    for (const size of [3, 4, 5, 6] as Size[]) {
      const ways = { 3: 1, 4: 16, 5: 4, 6: 1 }[size];
      for (let t = 0; t < 12; t++) {
        const board = pressAll(
          fullBoard(size),
          size,
          rng.shuffle(Array.from({ length: size * size }, (_, i) => i)).slice(0, rng.int(1, size * 2)),
        );
        const s = solve(board, size)!;
        expect(s, `${size}x${size}`).not.toBeNull();
        expect(s.ways).toBe(ways);
        expect(s.best.length).toBeGreaterThanOrEqual(1);
        for (const cells of s.best) {
          expect(cells).toHaveLength(s.weight);
          expect(allLit(pressAll(board, size, cells))).toBe(true);
        }
      }
    }
  });

  it('says so when no presses can light a board', () => {
    // On 4 by 4, a single dark lantern in a corner cannot be put right.
    const board = fullBoard(4);
    board[0] = false;
    expect(solve(board, 4)).toBeNull();
    expect(fewestPresses(board, 4)).toBeNull();
    expect(hintFor(board, 4)).toBeNull();
  });
});

describe('lantern ponds', () => {
  it('makes every level of the ladder: its size, a board that can be lit, and a par inside the plan', () => {
    PLANS.forEach((plan, i) => {
      expect(planFor(i + 1)).toBe(plan);
      for (let s = 1; s <= 30; s++) {
        const pond = makePond(plan, new Rng(s * 977 + i));
        const label = `${plan.name} seed ${s}`;
        expect(pond.size, label).toBe(plan.size);
        expect(pond.board, label).toHaveLength(plan.size ** 2);
        expect(allLit(pond.board), label).toBe(false);
        expect(pond.par, label).toBeGreaterThanOrEqual(plan.atLeast);
        expect(pond.par, label).toBeLessThanOrEqual(plan.scramble);
        expect(fewestPresses(pond.board, plan.size, pond.mask), label).toBe(pond.par);
        expect(pond.mask !== undefined, label).toBe(plan.shapes !== undefined);
      }
    });
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });

  it('is fair: the same seed gives the same ponds, and a round has the number of boards the plan says', () => {
    const a = makePonds(PLANS[3], new Rng(5)),
      b = makePonds(PLANS[3], new Rng(5)),
      c = makePonds(PLANS[3], new Rng(6));
    expect(a).toEqual(b);
    expect(a).toHaveLength(PLANS[3].boards);
    expect(a.map((p) => p.board)).not.toEqual(c.map((p) => p.board));
  });

  it('climbs: bigger or harder ponds as the levels rise', () => {
    expect(PLANS.map((p) => p.size)).toEqual([3, 3, 4, 4, 5, 5, 6, 6, 5]);
    for (const size of [3, 4, 5, 6] as const) {
      const rungs = PLANS.filter((p) => p.size === size && !p.shapes);
      expect(rungs[1].scramble).toBeGreaterThan(rungs[0].scramble);
    }
  });

  it('has one winning set on a 6 by 6 pond, so levels 7 and 8 need exactly their scramble, and generation never runs out', () => {
    for (const [level, presses] of [
      [7, 7],
      [8, 12],
    ] as const) {
      const plan = planFor(level);
      expect(plan.size, plan.name).toBe(6);
      for (let s = 1; s <= 200; s++) {
        const pond = makePond(plan, new Rng(s * 31 + level));
        const sol = solve(pond.board, 6)!;
        expect(sol.ways, `${plan.name} seed ${s}`).toBe(1);
        expect(pond.par, `${plan.name} seed ${s}`).toBe(presses);
        expect(allLit(pressAll(pond.board, 6, sol.best[0])), `${plan.name} seed ${s}`).toBe(true);
      }
    }
  });

  it('reads a pond from its picture and writes it back', () => {
    const rows = ['*.***', '*..**', '.**.*', '**..*', '..**.'];
    const pond = parsePond(rows);
    expect(pond.size).toBe(5);
    expect(formatPond(pond.board, 5)).toEqual(rows);
    expect(litCount(pond.board)).toBe(rows.join('').split('*').length - 1);
    expect(pond.par).toBe(fewestPresses(pond.board, 5));
    expect(() => parsePond(['**', '**'])).toThrow();
    expect(() => parsePond(['***', '***'])).toThrow();
    expect(() => parsePond(['***.', '****', '****', '****'])).toThrow('cannot be lit');
  });
});

describe('lantern hints', () => {
  it('always lead somewhere: pressing the hinted lantern brings the fewest down by exactly one', () => {
    const rng = new Rng(99);
    for (const plan of PLANS)
      for (let t = 0; t < 8; t++) {
        const pond = makePond(plan, rng, plan.shapes?.[t % plan.shapes.length]),
          m = pond.mask;
        let board = pond.board;
        let left = fewestPresses(board, plan.size, m)!;
        for (let guard = 0; guard < 40 && left > 0; guard++) {
          const at = hintFor(board, plan.size, rng.int(0, plan.size ** 2 - 1), m);
          expect(at, plan.name).not.toBeNull();
          expect(isLantern(at!, m), plan.name).toBe(true);
          board = press(board, plan.size, at!, m);
          const now = fewestPresses(board, plan.size, m)!;
          expect(now, plan.name).toBe(left - 1);
          left = now;
        }
        expect(allLit(board), plan.name).toBe(true);
      }
  });

  it('has nothing to say about a board that is already lit', () => {
    expect(hintFor(fullBoard(5), 5)).toBeNull();
  });

  it('prefers the lantern nearest where she is looking, among the best ways', () => {
    const rng = new Rng(3);
    const pond = makePond(PLANS[5], rng),
      s = solve(pond.board, 5)!;
    const options = new Set(s.best.flat());
    for (const near of [0, 12, 24]) expect(options.has(hintFor(pond.board, 5, near)!)).toBe(true);
  });
});

describe('named hints', () => {
  it('names one way when the pond has exactly one fewest set, and several when it has more, pointing at the same lantern as before', () => {
    const rng = new Rng(41);
    const seen = new Set<string>();
    for (const plan of PLANS)
      for (let t = 0; t < 12; t++) {
        const { board, mask } = makePond(plan, rng, plan.shapes?.[t % plan.shapes.length]);
        const s = solve(board, plan.size, mask)!,
          near = rng.int(0, plan.size ** 2 - 1),
          h = namedHint(board, plan.size, near, mask)!;
        expect(h.kind, plan.name).toBe(s.best.length === 1 ? 'one' : 'many');
        expect(h.cell).toBe(hintFor(board, plan.size, near, mask));
        expect(
          s.best.some((way) => way.includes(h.cell)),
          plan.name,
        ).toBe(true);
        // 3 by 3 and 6 by 6 have one winning set at all, so only ever one short way.
        if ((plan.size === 3 || plan.size === 6) && !plan.shapes) expect(h.kind, plan.name).toBe('one');
        seen.add(h.kind);
      }
    expect([...seen].sort()).toEqual(['many', 'one']);
  });

  it('has no hint for a lit pond', () => {
    expect(namedHint(fullBoard(4), 4)).toBeNull();
  });
});

describe('show me a short way', () => {
  it('replays a fewest way from the start: all lit in exactly par presses, the same way every time', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const rng = new Rng(500 + level),
        plan = planFor(level);
      for (const pond of makePonds(plan, rng)) {
        const way = shortWay(pond.board, pond.size, pond.mask)!;
        expect(way.length, plan.name).toBe(pond.par);
        expect(new Set(way).size).toBe(way.length);
        let board: boolean[] = pond.board.slice();
        way.forEach((c, k) => {
          board = press(board, pond.size, c, pond.mask);
          expect(allLit(board), `${plan.name} after ${k + 1}`).toBe(k === way.length - 1);
        });
        expect(shortWay(pond.board, pond.size, pond.mask)).toEqual(way);
      }
    }
  });

  it('has nothing to replay on a lit pond', () => {
    expect(shortWay(fullBoard(3), 3)).toBeNull();
  });
});

describe('the school opening', () => {
  it('makes every level 1 and 2 pond a 3 by 3 with one winning set, the fewest exactly the scramble', () => {
    for (const [level, fewest] of [
      [1, 2],
      [2, 4],
    ] as const) {
      for (let seed = 1; seed <= 300; seed++) {
        for (const pond of makePonds(planFor(level), new Rng(seed))) {
          expect(pond.size).toBe(3);
          expect(pond.par, `level ${level} seed ${seed}`).toBe(fewest);
          expect(solve(pond.board, 3)!.ways).toBe(1);
        }
      }
    }
  });

  it('lights every school pond by following the hint from the start in exactly the fewest presses', () => {
    for (const level of [1, 2]) {
      for (let seed = 1; seed <= 300; seed++) {
        for (const pond of makePonds(planFor(level), new Rng(seed))) {
          let board: boolean[] = pond.board.slice(),
            presses = 0;
          while (!allLit(board)) {
            board = press(board, 3, hintFor(board, 3)!);
            presses++;
          }
          expect(presses).toBe(pond.par);
        }
      }
    }
  });

  it('nudges toward Hint at the fewest plus six at school only', () => {
    expect(stuckAt('school', 2)).toBe(8);
    expect(stuckAt('school', 4)).toBe(10);
    for (const band of ['lap', 'toddler', 'preschool', 'prek', 'grownup'] as const)
      expect(stuckAt(band, 2)).toBeNull();
  });
});

/** Exhaustive truth on a lily-pad shape: the fewest presses from all-lit to every reachable board, over lanterns only. */
function fewestOnShape(mask: boolean[]): Map<number, number> {
  const cells = mask.map((on, i) => (on ? i : -1)).filter((i) => i >= 0),
    k = cells.length;
  // Boards are written over the lanterns alone (bit j for the j-th lantern), so 24 lanterns fit in a number.
  const local = new Map(cells.map((c, j) => [c, j]));
  const fp = cells.map((c) => footprint(5, c, mask).reduce((m, x) => m | (1 << local.get(x)!), 0));
  const table = new Map<number, number>();
  let board = 0,
    weight = 0,
    set = 0;
  table.set(0, 0);
  for (let i = 1; i < 2 ** k; i++) {
    const b = 31 - Math.clz32(i & -i);
    board ^= fp[b];
    set ^= 1 << b;
    weight += set & (1 << b) ? 1 : -1;
    if (weight < (table.get(board) ?? 99)) table.set(board, weight);
  }
  return table;
}

describe('lily-pad ponds', () => {
  it('clips a footprint at the pads, and a pad flips nothing and is never flipped', () => {
    const mask = shapeMask(SHAPES.ring);
    expect(isLantern(12, mask)).toBe(false);
    expect(footprint(5, 7, mask)).toEqual([2, 6, 7, 8]);
    expect(footprint(5, 12, mask)).toEqual([]);
    const lit = fullBoard(5);
    expect(press(lit, 5, 12, mask)).toEqual(lit);
    for (let c = 0; c < 25; c++) expect(press(lit, 5, c, mask)[12]).toBe(true);
    expect(litCount(press(lit, 5, 7, mask), mask)).toBe(20);
    expect(lanternCount(5, mask)).toBe(24);
    expect(lanternCount(5)).toBe(25);
  });

  it('weighs the fewest exactly on every shape, against every set of presses, and keeps each shape to at most four free choices', () => {
    for (const [name, shape] of Object.entries(SHAPES)) {
      const mask = shapeMask(shape),
        cells = mask.map((on, i) => (on ? i : -1)).filter((i) => i >= 0);
      expect(cells.length, name).toBeLessThanOrEqual(24);
      const free = Math.log2(solve(fullBoard(5), 5, mask)!.ways);
      expect(free, name).toBeLessThanOrEqual(4);
      const truth = fewestOnShape(mask),
        rng = new Rng(name.length * 13);
      // Every reachable board's fewest from the solver, sampled widely, matches the brute force; and an unreachable
      // board says so.
      const reachable = [...truth.keys()];
      expect(reachable.length, name).toBe(2 ** (cells.length - free));
      for (let t = 0; t < 400; t++) {
        const key = reachable[rng.int(0, reachable.length - 1)];
        const board = fullBoard(5);
        cells.forEach((c, j) => {
          if (key & (1 << j)) board[c] = false;
        });
        expect(fewestPresses(board, 5, mask), `${name} ${key}`).toBe(truth.get(key));
      }
      if (free > 0) {
        let key = 0;
        while (truth.has(key)) key++;
        const board = fullBoard(5);
        cells.forEach((c, j) => {
          if (key & (1 << j)) board[c] = false;
        });
        expect(solve(board, 5, mask), name).toBeNull();
      }
    }
  });

  it('makes a round of two different shapes, each pond at least five presses from lit, within its attempt budget over 200 seeds', () => {
    const plan = planFor(9);
    expect(plan.shapes).toHaveLength(4);
    for (let s = 1; s <= 200; s++) {
      const ponds = makePonds(plan, new Rng(s * 17));
      expect(ponds).toHaveLength(2);
      expect(ponds[0].mask).not.toEqual(ponds[1].mask);
      for (const pond of ponds) {
        expect(pond.par).toBeGreaterThanOrEqual(5);
        expect(pond.par).toBeLessThanOrEqual(6);
        pond.mask!.forEach((on, i) => {
          if (!on) expect(pond.board[i]).toBe(true);
        });
        let board: boolean[] = pond.board.slice(),
          presses = 0;
        while (!allLit(board)) {
          const at = hintFor(board, 5, 0, pond.mask)!;
          expect(pond.mask![at]).toBe(true);
          board = press(board, 5, at, pond.mask);
          presses++;
        }
        expect(presses).toBe(pond.par);
      }
    }
  });

  it('reads a pad from a space in the picture and writes it back; a picture without one has no mask', () => {
    const rows = ['*.***', '*..**', '.* .*', '**..*', '..**.'];
    const pond = parsePond(rows);
    expect(pond.mask?.filter((on) => !on)).toHaveLength(1);
    expect(pond.board[12]).toBe(true);
    expect(formatPond(pond.board, 5, pond.mask)).toEqual(rows);
    expect(pond.par).toBe(fewestPresses(pond.board, 5, pond.mask));
    expect(parsePond(['*.***', '*..**', '.**.*', '**..*', '..**.']).mask).toBeUndefined();
  });
});
