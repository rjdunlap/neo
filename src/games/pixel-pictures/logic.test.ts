import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { clues, colorClues, colorDeduce, colorLineSolvable, colorLogicCell, colorPlacements, colorRuns, colorsOf, deduce, givenInMirror, lineSolvable, makePictures, PICTURES, picturesFor, PLANS, pixelTouch, runs, symmetric, toGrid, type Filled, type Knowledge } from './logic';

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
      // Strictly more than a round shows, so one round can differ from the next.
      expect(fit.length, plan.name).toBeGreaterThan(plan.pictures);
      expect(new Set(fit.map((p) => p.name)).size, `${plan.name}: names are distinct`).toBe(fit.length);
      for (const p of fit) {
        if (plan.mode === 'mirror') expect(symmetric(p)).toBe(true);
        if (plan.mode === 'copy' && plan.colors === 2) expect(colorsOf(p)).toHaveLength(2);
        if (plan.mode === 'colorClues') expect(colorsOf(p)).toHaveLength(2), expect(colorLineSolvable(p), p.name).toBe(true);
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

  it('places colored runs with a gap only between runs of the same color, and rejects a picture its colored numbers leave open', () => {
    expect(colorPlacements(3, [{ count: 1, color: 'r' }, { count: 1, color: 'b' }]).map((l) => l.join(''))).toEqual(['rb.', 'r.b', '.rb']);
    expect(colorPlacements(3, [{ count: 1, color: 'r' }, { count: 1, color: 'r' }]).map((l) => l.join(''))).toEqual(['r.r']);
    expect(colorPlacements(3, colorRuns(['.', '.', '.'])).map((l) => l.join(''))).toEqual(['...']);
    // Every placement reproduces its own clue.
    for (const row of ['rrb.bb', 'r.rbbr', '......', 'yooooy']) for (const pl of colorPlacements(6, colorRuns(row.split('')))) expect(colorRuns(pl)).toEqual(colorRuns(row.split('')));
    // Two diagonal squares read the same as the other diagonal: the numbers cannot tell them apart.
    expect(colorLineSolvable({ name: 'a diagonal', rows: ['r...', '.r..', '....', '....'] })).toBe(false);
    expect(colorLineSolvable({ name: 'a two-color diagonal', rows: ['rb..', 'br..', '....', '....'] })).toBe(true);
  });

  it('a two-color hint is a square the colored numbers settle, in the picture\'s own color, from any point of a solve', () => {
    const plan = PLANS.find((p) => p.mode === 'colorClues')!;
    for (const picture of picturesFor(plan)) {
      const target = toGrid(picture);
      const filled: Filled = target.map((row) => row.map(() => null));
      let color = colorsOf(picture)[0];
      for (let step = 0; step < 100; step++) {
        const hint = colorLogicCell(picture, filled, color);
        if (!hint) break;
        expect(target[hint.y][hint.x], `${picture.name} (${hint.x}, ${hint.y})`).toBe(hint.c);
        expect(filled[hint.y][hint.x]).toBeNull();
        // Settled: no placement consistent with the board's paint and crossed squares gives it a different value.
        const known = filled.map((row) => row.map((c) => (c === 'x' ? '.' : c)));
        for (let pass = 0; pass < 50; pass++) {
          const found = colorDeduce(picture, known);
          if (!found.length) break;
          for (const f of found) known[f.y][f.x] = f.cell;
        }
        expect(known[hint.y][hint.x], `${picture.name}: logic settles it`).toBe(hint.c);
        // Play on as a child might: paint it, and on alternate steps cross out a square that is really empty.
        filled[hint.y][hint.x] = hint.c;
        color = hint.c;
        if (step % 2) {
          const empty = target.flatMap((row, y) => row.flatMap((c, x) => (!c && filled[y][x] === null ? [{ x, y }] : [])))[0];
          if (empty) filled[empty.y][empty.x] = 'x';
        }
      }
      expect(target.every((row, y) => row.every((c, x) => !c || filled[y][x] === c)), `${picture.name}: following hints finishes it`).toBe(true);
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
            if (plan.mode === 'colorClues') {
              // It changes color only when the numbers settle nothing more in the color in hand.
              expect(colorLogicCell(picture, filled, color)?.c, `${picture.name}: nothing settled in ${color}`).toBe(move.color);
            } else expect(++paletteTaps, `${picture.name}: changes color once for each color`).toBeLessThanOrEqual(colorsOf(picture).length);
            color = move.color;
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
