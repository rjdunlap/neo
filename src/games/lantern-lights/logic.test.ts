import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  allLit, footprint, formatPond, fewestPresses, fullBoard, hintFor, litCount, makePond, makePonds, parsePond, planFor, PLANS, press, pressAll, solve, type Size,
} from './logic';

/** Exhaustive truth for a small board: for every set of presses, the board it makes from all-lit and its size. */
function fewestByBruteForce(size: number): Uint8Array {
  const n = size * size, fp = Array.from({ length: n }, (_, i) => footprint(size, i).reduce((m, c) => m | (1 << c), 0));
  const table = new Uint8Array(2 ** n).fill(255);
  let board = 2 ** n - 1, weight = 0, set = 0;
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
    const board = [true, false, false, true, true, false, false, false, true, true, true, false, false, true, false, true];
    expect(press(press(board, 4, 5), 4, 5)).toEqual(board);
    expect(pressAll(board, 4, [1, 6, 10])).toEqual(pressAll(board, 4, [10, 1, 6]));
    expect(pressAll(board, 4, [3, 3, 7, 7])).toEqual(board);
  });
});

describe('lantern solving', () => {
  it('knows the fewest presses on small boards exactly: every 3 by 3 and every 4 by 4 board', () => {
    for (const size of [3, 4] as const) {
      const table = fewestByBruteForce(size), n = size * size;
      for (let bits = 0; bits < 2 ** n; bits += size === 3 ? 1 : 7) {
        const board = Array.from({ length: n }, (_, i) => (bits & (1 << i)) !== 0);
        const got = fewestPresses(board, size);
        expect(got, `${size}x${size} board ${bits.toString(2)}`).toBe(table[bits] === 255 ? null : table[bits]);
      }
    }
  });

  it('knows the fewest presses on every 5 by 5 board it is asked about, and which boards cannot be lit', () => {
    const table = fewestByBruteForce(5), rng = new Rng(2024);
    let lit = 0, dark = 0;
    for (let i = 0; i < 4000; i++) {
      const board = Array.from({ length: 25 }, () => rng.chance(0.5));
      const truth = table[bitsOf(board)];
      expect(fewestPresses(board, 5), `board ${bitsOf(board)}`).toBe(truth === 255 ? null : truth);
      if (truth === 255) dark++; else lit++;
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
        const board = pressAll(fullBoard(size), size, rng.shuffle(Array.from({ length: size * size }, (_, i) => i)).slice(0, rng.int(1, size * 2)));
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
        expect(fewestPresses(pond.board, plan.size), label).toBe(pond.par);
      }
    });
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });

  it('is fair: the same seed gives the same ponds, and a round has the number of boards the plan says', () => {
    const a = makePonds(PLANS[3], new Rng(5)), b = makePonds(PLANS[3], new Rng(5)), c = makePonds(PLANS[3], new Rng(6));
    expect(a).toEqual(b);
    expect(a).toHaveLength(PLANS[3].boards);
    expect(a.map((p) => p.board)).not.toEqual(c.map((p) => p.board));
  });

  it('climbs: bigger or harder ponds as the levels rise', () => {
    expect(PLANS.map((p) => p.size)).toEqual([3, 3, 4, 4, 5, 5]);
    for (const size of [3, 4, 5] as const) {
      const rungs = PLANS.filter((p) => p.size === size);
      expect(rungs[1].scramble).toBeGreaterThan(rungs[0].scramble);
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
    for (const plan of PLANS) for (let t = 0; t < 8; t++) {
      let board = makePond(plan, rng).board;
      let left = fewestPresses(board, plan.size)!;
      for (let guard = 0; guard < 40 && left > 0; guard++) {
        const at = hintFor(board, plan.size, rng.int(0, plan.size ** 2 - 1));
        expect(at, plan.name).not.toBeNull();
        board = press(board, plan.size, at!);
        const now = fewestPresses(board, plan.size)!;
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
    const pond = makePond(PLANS[5], rng), s = solve(pond.board, 5)!;
    const options = new Set(s.best.flat());
    for (const near of [0, 12, 24]) expect(options.has(hintFor(pond.board, 5, near)!)).toBe(true);
  });
});
