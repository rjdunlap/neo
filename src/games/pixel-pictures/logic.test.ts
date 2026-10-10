import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { clues, colorClues, colorRuns, colorsOf, deduce, givenInMirror, lineSolvable, makePictures, PICTURES, picturesFor, PLANS, pixelTouch, runs, symmetric, toGrid, type Filled, type Knowledge } from './logic';

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
        if (plan.mode === 'colorClues') expect(colorsOf(p)).toHaveLength(2);
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

  it('keeps color clue runs separate across gaps and records every picture line accurately', () => {
    expect(colorRuns(['r', 'r', '.', 'b', 'r'])).toEqual([{ count: 2, color: 'r' }, { count: 1, color: 'b' }, { count: 1, color: 'r' }]);
    for (const picture of picturesFor(PLANS.find((p) => p.mode === 'colorClues')!)) {
      const actual = colorClues(picture);
      picture.rows.forEach((row, y) => expect(actual.rows[y]).toEqual(colorRuns(row.split(''))));
      picture.rows[0].split('').forEach((_, x) => expect(actual.cols[x]).toEqual(colorRuns(picture.rows.map((row) => row[x]))));
    }
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
  it("the ghost finger copies, mirrors and solves every picture of every level touch by touch, never tapping a wrong or a settled square", () => {
    for (const plan of PLANS) {
      for (const picture of picturesFor(plan)) {
        const target = toGrid(picture);
        const n = plan.size;
        // The board as the game starts it: mirror levels have the left half drawn.
        const filled: Filled = target.map((row, y) => row.map((_, x) => (plan.mode === 'mirror' && givenInMirror(n, x) ? target[y][x] : null)));
        let color = colorsOf(picture)[0];
        let from: { x: number; y: number } | undefined;
        let paletteTaps = 0;
        let taps = 0;
        for (let step = 0; step < 200; step++) {
          const move = pixelTouch(plan, picture, filled, color, from);
          if (!move) break;
          if ('color' in move) {
            expect((plan.mode === 'copy' && plan.colors === 2) || plan.mode === 'colorClues', `${picture.name}: only two-color levels have a palette`).toBe(true);
            expect(move.color, 'a different color than the one chosen').not.toBe(color);
            color = move.color;
            expect(++paletteTaps, `${picture.name}: changes color once for each color`).toBeLessThanOrEqual(colorsOf(picture).length);
            continue;
          }
          const { x, y } = move.cell;
          // The game's own rule: a square the picture leaves empty, or the wrong color, is a miss; so is one already filled (ignored) or given.
          expect(target[y][x], `${plan.mode} ${picture.name}: (${x}, ${y}) belongs to the picture`).not.toBeNull();
          expect(filled[y][x], `${picture.name}: (${x}, ${y}) is still empty`).toBeNull();
          if ((plan.mode === 'copy' && plan.colors === 2) || plan.mode === 'colorClues') expect(target[y][x], 'the color in hand').toBe(color);
          if (plan.mode === 'mirror') expect(givenInMirror(n, x), 'only the half still to do').toBe(false);
          filled[y][x] = plan.mode === 'clues' ? 'b' : target[y][x];
          from = { x, y };
          taps++;
        }
        const want = target.flat().filter((c, i) => !!c && !(plan.mode === 'mirror' && givenInMirror(n, i % n))).length;
        expect(taps, `${plan.mode} ${picture.name}: every square it needs, and no more`).toBe(want);
      }
    }
  });
});
