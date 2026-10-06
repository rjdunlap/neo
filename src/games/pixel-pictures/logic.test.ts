import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { clues, colorsOf, deduce, lineSolvable, makePictures, PICTURES, picturesFor, PLANS, runs, symmetric, toGrid, type Knowledge } from './logic';

describe('Pixel Pictures', () => {
  it('pictures are square, the right size, and drawn in known colors', () => {
    for (const size of [4, 5, 6] as const) {
      for (const p of PICTURES[size]) {
        expect(p.rows, p.name).toHaveLength(size);
        for (const r of p.rows) expect(r, p.name).toMatch(new RegExp(`^[.roygbpun]{${size}}$`));
      }
    }
  });

  it('every level has enough pictures that fit it', () => {
    for (const plan of PLANS) {
      const fit = picturesFor(plan);
      expect(fit.length, plan.name).toBeGreaterThanOrEqual(plan.pictures);
      for (const p of fit) {
        if (plan.mode === 'mirror') expect(symmetric(p)).toBe(true);
        if (plan.mode === 'copy' && plan.colors === 2) expect(colorsOf(p)).toHaveLength(2);
      }
      for (let seed = 1; seed <= 50; seed++) expect(new Set(makePictures(plan, new Rng(seed)).map((p) => p.name)).size).toBe(plan.pictures);
    }
  });

  it('reads runs along a line, and clue puzzles can be solved by logic alone, without guessing', () => {
    expect(runs([true, true, false, true])).toEqual([2, 1]);
    expect(runs([false, false])).toEqual([0]);
    const heart = PICTURES[6][1];
    expect(clues(heart).rows[0]).toEqual([2, 2]);
    for (const plan of PLANS.filter((p) => p.mode === 'clues')) for (const p of picturesFor(plan)) expect(lineSolvable(p), p.name).toBe(true);
  });

  it('a hint always finds a cell logic can decide, and it agrees with the picture', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'clues')) {
      for (const p of picturesFor(plan)) {
        const g = toGrid(p);
        const n = g.length;
        const known: Knowledge = Array.from({ length: n }, () => Array(n).fill(null));
        for (let step = 0; step < n * n; step++) {
          const found = deduce(p, known);
          if (!found.length) break;
          for (const f of found) {
            expect(f.fill, `${p.name} ${f.x},${f.y}`).toBe(g[f.y][f.x] !== null);
            known[f.y][f.x] = f.fill;
          }
        }
      }
    }
  });
});
