import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { beside, eaten, makePuzzle, move, PLANS, slide, solve, tapDirection, type Cell, type Dir, type SlidePuzzle } from './logic';

const tiny: SlidePuzzle = { cols: 4, rows: 3, rocks: [{ x: 3, y: 1 }], soft: [{ x: 1, y: 2 }], start: { x: 0, y: 0 }, fish: [{ x: 2, y: 2 }], best: 0 };

describe('Penguin Slide', () => {
  it('slides until a rock, the edge or soft snow, eating fish on the way', () => {
    expect(slide(tiny, { x: 0, y: 0 }, 0).to).toEqual({ x: 3, y: 0 });
    expect(slide(tiny, { x: 0, y: 1 }, 0).to).toEqual({ x: 2, y: 1 }); // stops before the rock
    expect(slide(tiny, { x: 1, y: 0 }, 1).to).toEqual({ x: 1, y: 2 }); // into the soft snow
    expect(slide(tiny, { x: 0, y: 0 }, 2).passed).toHaveLength(0); // already at the edge
    expect(eaten(tiny, slide(tiny, { x: 1, y: 2 }, 0).passed)).toBe(1);
    // Down to the corner, right into the soft snow, then right again past the fish.
    expect(solve(tiny, tiny.start)).toEqual({ moves: 3, first: 1 });
    // The soft snow is in the way here: without it, down then right slides straight past the fish.
    expect(solve({ ...tiny, soft: [] }, tiny.start)).toEqual({ moves: 2, first: 1 });
  });

  it('every puzzle needs the planned number of slides, with nothing stacked on anything else', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 150; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        expect(p.best).toBeGreaterThanOrEqual(plan.moves[0]);
        expect(p.best).toBeLessThanOrEqual(plan.moves[1]);
        expect(solve(p, p.start).moves).toBe(p.best);
        const all = [p.start, ...p.rocks, ...p.soft, ...p.fish, ...(p.blocks ?? [])].map((c) => `${c.x},${c.y}`);
        expect(new Set(all).size).toBe(all.length);
        expect(p.fish).toHaveLength(plan.fish);
        expect(p.blocks?.length ?? 0).toBe(plan.blocks ?? 0);
      }
    }
  });

  it('following the hint arrow always eats every fish in the fewest slides', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        let at = p.start;
        let have = 0;
        let blocks = p.blocks ?? [];
        let used = 0;
        while (have !== (1 << p.fish.length) - 1) {
          const { first } = solve(p, at, have, blocks);
          expect(first).not.toBe(-1);
          const m = move(p, at, first as Dir, blocks)!;
          expect(m).not.toBeNull();
          have |= eaten(p, m.passed);
          at = m.to;
          blocks = m.blocks;
          used++;
        }
        expect(used).toBe(p.best);
      }
    }
  });

  it('has a tap the ghost finger can make for every move of a fewest route, which does that move and finishes in the fewest', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        let at = p.start;
        let have = 0;
        let blocks = p.blocks ?? [];
        let moves = 0;
        while (have !== (1 << p.fish.length) - 1 && moves < 40) {
          const { first } = solve(p, at, have, blocks);
          expect(first).toBeGreaterThanOrEqual(0);
          const tap = beside(at, first as Dir);
          expect(tap.x).toBeGreaterThanOrEqual(0);
          expect(tap.x).toBeLessThan(p.cols);
          expect(tap.y).toBeGreaterThanOrEqual(0);
          expect(tap.y).toBeLessThan(p.rows);
          // The tap lands beside the penguin and the game reads it as the same direction.
          expect(tapDirection(tap.x - at.x, tap.y - at.y)).toBe(first);
          const m = move(p, at, tapDirection(tap.x - at.x, tap.y - at.y), blocks);
          expect(m).not.toBeNull();
          have |= eaten(p, m!.passed);
          at = m!.to;
          blocks = m!.blocks;
          moves++;
        }
        expect(moves).toBe(p.best);
      }
    }
  });
});

describe('Penguin Slide ice blocks', () => {
  //  P . . . . #      P the penguin, # a rock, ~ soft snow, F a fish
  //  . . . ~ . .
  //  . F . . . .
  const pond = (blocks: Cell[]): SlidePuzzle => ({
    cols: 6, rows: 3, rocks: [{ x: 5, y: 0 }], soft: [{ x: 3, y: 1 }], blocks, start: { x: 0, y: 0 }, fish: [{ x: 1, y: 2 }], best: 0,
  });

  it('a block stops a slide like a rock, and pushing it skates it to its next stop while the penguin stays put', () => {
    const p = pond([{ x: 2, y: 0 }]);
    expect(slide(p, p.start, 0).to).toEqual({ x: 1, y: 0 });
    const push = move(p, { x: 1, y: 0 }, 0)!;
    expect(push.to).toEqual({ x: 1, y: 0 });
    expect(push.passed).toHaveLength(0);
    expect(push.pushed).toEqual({ index: 0, to: { x: 4, y: 0 } }); // stops before the rock
    expect(push.blocks).toEqual([{ x: 4, y: 0 }]);
    expect(p.blocks).toEqual([{ x: 2, y: 0 }]); // the puzzle itself is never changed
  });

  it('a block stops at the edge, in soft snow and before another block or a fish; one that cannot move is a rock', () => {
    expect(move(pond([{ x: 4, y: 2 }]), { x: 3, y: 2 }, 0)!.pushed!.to).toEqual({ x: 5, y: 2 }); // the edge
    expect(move(pond([{ x: 1, y: 1 }]), { x: 0, y: 1 }, 0)!.pushed!.to).toEqual({ x: 3, y: 1 }); // sinks into the snow
    expect(move(pond([{ x: 3, y: 2 }]), { x: 4, y: 2 }, 2)!.pushed!.to).toEqual({ x: 2, y: 2 }); // the fish is not covered
    expect(move(pond([{ x: 1, y: 1 }]), { x: 1, y: 0 }, 1)).toBeNull(); // the fish is right behind it
    expect(move(pond([{ x: 1, y: 1 }, { x: 2, y: 1 }]), { x: 0, y: 1 }, 0)).toBeNull(); // another block is right behind it
    expect(move(pond([{ x: 4, y: 0 }]), { x: 3, y: 0 }, 0)).toBeNull(); // a rock is right behind it
    expect(move(pond([]), { x: 0, y: 0 }, 2)).toBeNull(); // nothing at all: a bump
  });

  it('a block shut in front of the fish leaves no way, which the solver reports as stuck', () => {
    // P B F: the fish is right behind the block, so it will not move and the penguin cannot pass.
    const shut: SlidePuzzle = { cols: 3, rows: 1, rocks: [], soft: [], blocks: [{ x: 1, y: 0 }], start: { x: 0, y: 0 }, fish: [{ x: 2, y: 0 }], best: 0 };
    expect(solve(shut, shut.start).moves).toBe(-1);
  });

  it('every level-6 board needs a push: with the blocks frozen like rocks the fish is out of reach or farther', () => {
    const plan = PLANS[5];
    expect(plan.blocks).toBeGreaterThan(0);
    for (let seed = 1; seed <= 150; seed++) {
      const p = makePuzzle(plan, new Rng(seed));
      const frozen = solve({ ...p, rocks: [...p.rocks, ...p.blocks!], blocks: [] }, p.start).moves;
      expect(frozen === -1 || frozen > p.best).toBe(true);
    }
  });
});
