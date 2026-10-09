import { describe, expect, it } from 'vitest';
import type { ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import { collapse, demoMove, ensureMove, findLine, findSquare, makeGrid, PLANS, popped, step, type Grid } from './logic';

const R: ColorName = 'red';
const B: ColorName = 'blue';

describe('Dot Link', () => {
  it('extends through same-color neighbors, steps back, and closes squares', () => {
    const g: Grid = [[R, R, B], [R, R, B], [B, B, B]];
    expect(step(g, [{ r: 0, c: 0 }], { r: 0, c: 1 })).toBe('extend');
    expect(step(g, [{ r: 0, c: 0 }], { r: 0, c: 2 })).toBe('no'); // not adjacent
    expect(step(g, [{ r: 0, c: 1 }], { r: 0, c: 2 })).toBe('no'); // other color
    expect(step(g, [{ r: 0, c: 0 }, { r: 0, c: 1 }], { r: 0, c: 0 })).toBe('back');
    const around = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 0 }];
    expect(step(g, around, { r: 0, c: 0 })).toBe('loop');
    // A loop clears every dot of that color.
    expect(popped(g, around, true)).toHaveLength(4);
    expect(popped(g, [{ r: 2, c: 0 }, { r: 2, c: 1 }], true)).toHaveLength(5);
  });

  it('drops dots down into gaps and refills from the top', () => {
    const g: Grid = [[R, B], [B, R], [R, R]];
    const { grid, falls } = collapse(g, [{ r: 2, c: 0 }], new Rng(1), [R, B]);
    expect(grid[2][0]).toBe(B); // the blue above fell down
    expect(grid[1][0]).toBe(R);
    expect(grid[2][1]).toBe(R);
    expect(falls.filter((f) => f.c === 0)).toHaveLength(3);
    expect(grid.every((row) => row.every(Boolean))).toBe(true);
  });

  it('always leaves a move that counts for the level', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const palette: ColorName[] = ['red', 'blue', 'yellow', 'green'].slice(0, plan.colors) as ColorName[];
        const g = ensureMove(plan, makeGrid(plan, rng, palette), rng, plan.mode === 'color' ? 'red' : undefined);
        if (plan.mode === 'square') expect(findSquare(g)).not.toBeNull();
        else expect(findLine(g, plan.mode === 'chain' ? plan.length! : plan.mode === 'tap' ? 1 : 2, plan.mode === 'color' ? 'red' : undefined), plan.name).not.toBeNull();
      }
    }
  });

  it('chooses a clean demonstration move that satisfies each level rule', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const palette: ColorName[] = ['red', 'blue', 'yellow', 'green'].slice(0, plan.colors) as ColorName[];
      const target = plan.mode === 'color' ? R : undefined;
      const grid = ensureMove(plan, makeGrid(plan, rng, palette), rng, target);
      const move = demoMove(plan, grid, target)!;
      expect(move.length, plan.name).toBeGreaterThan(0);
      if (plan.mode === 'tap') expect(move).toHaveLength(1);
      else {
        const walked = plan.mode === 'square' ? move.slice(0, -1) : move;
        for (let i = 1; i < walked.length; i++) expect(step(grid, walked.slice(0, i), walked[i])).toBe('extend');
        if (plan.mode === 'square') expect(step(grid, walked, move.at(-1)!)).toBe('loop');
        if (plan.mode === 'chain') expect(walked.length).toBeGreaterThanOrEqual(plan.length!);
        if (plan.mode === 'color') expect(grid[walked[0].r][walked[0].c]).toBe(target);
      }
    }
  });
});
