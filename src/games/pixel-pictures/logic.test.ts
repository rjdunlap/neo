import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  blank,
  canFinish,
  clues,
  colorClues,
  colorDeduce,
  colorLineSolvable,
  colorLogicCell,
  colorPlacements,
  colorRuns,
  colorsOf,
  deduce,
  FOURFOLD,
  FREE_COLORS,
  FREE_HEART,
  FREE_MIN,
  freeTap,
  freeTouch,
  given,
  helpCells,
  lineSolvable,
  MODELS,
  planFor,
  quarterOf,
  scaleDown,
  scaleUp,
  makePictures,
  PICTURES,
  picturesFor,
  PLANS,
  pixelsOf,
  pixelTouch,
  runs,
  symmetric,
  toGrid,
  type Filled,
  type Knowledge,
} from './logic';

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
    // Level 10 is a free design on an empty board; it has no pictures to copy.
    for (const plan of PLANS.filter((p) => p.mode !== 'free')) {
      const fit = picturesFor(plan);
      // Strictly more than a round shows, so one round can differ from the next.
      expect(fit.length, plan.name).toBeGreaterThan(plan.pictures);
      expect(new Set(fit.map((p) => p.name)).size, `${plan.name}: names are distinct`).toBe(fit.length);
      for (const p of fit) {
        if (plan.mode === 'mirror') expect(symmetric(p)).toBe(true);
        if (plan.mode === 'copy' && plan.colors === 2) expect(colorsOf(p)).toHaveLength(2);
        if (plan.mode === 'colorClues')
          (expect(colorsOf(p)).toHaveLength(2), expect(colorLineSolvable(p), p.name).toBe(true));
      }
      for (let seed = 1; seed <= 50; seed++)
        expect(new Set(makePictures(plan, new Rng(seed)).map((p) => p.name)).size).toBe(plan.pictures);
    }
  });

  it('reads runs along a line, and clue puzzles can be solved by logic alone, without guessing', () => {
    expect(runs([true, true, false, true])).toEqual([2, 1]);
    expect(runs([false, false])).toEqual([0]);
    const heart = PICTURES[6][1];
    expect(clues(heart).rows[0]).toEqual([2, 2]);
    for (const plan of PLANS.filter((p) => p.mode === 'clues'))
      for (const p of picturesFor(plan)) expect(lineSolvable(p), p.name).toBe(true);
  });

  it('keeps color clue runs separate across gaps and records every picture line accurately', () => {
    expect(colorRuns(['r', 'r', '.', 'b', 'r'])).toEqual([
      { count: 2, color: 'r' },
      { count: 1, color: 'b' },
      { count: 1, color: 'r' },
    ]);
    for (const picture of picturesFor(PLANS.find((p) => p.mode === 'colorClues')!)) {
      const actual = colorClues(picture);
      picture.rows.forEach((row, y) => expect(actual.rows[y]).toEqual(colorRuns(row.split(''))));
      picture.rows[0]
        .split('')
        .forEach((_, x) => expect(actual.cols[x]).toEqual(colorRuns(picture.rows.map((row) => row[x]))));
    }
  });

  it('places colored runs with a gap only between runs of the same color, and rejects a picture its colored numbers leave open', () => {
    expect(
      colorPlacements(3, [
        { count: 1, color: 'r' },
        { count: 1, color: 'b' },
      ]).map((l) => l.join('')),
    ).toEqual(['rb.', 'r.b', '.rb']);
    expect(
      colorPlacements(3, [
        { count: 1, color: 'r' },
        { count: 1, color: 'r' },
      ]).map((l) => l.join('')),
    ).toEqual(['r.r']);
    expect(colorPlacements(3, colorRuns(['.', '.', '.'])).map((l) => l.join(''))).toEqual(['...']);
    // Every placement reproduces its own clue.
    for (const row of ['rrb.bb', 'r.rbbr', '......', 'yooooy'])
      for (const pl of colorPlacements(6, colorRuns(row.split(''))))
        expect(colorRuns(pl)).toEqual(colorRuns(row.split('')));
    // Two diagonal squares read the same as the other diagonal: the numbers cannot tell them apart.
    expect(colorLineSolvable({ name: 'a diagonal', rows: ['r...', '.r..', '....', '....'] })).toBe(false);
    expect(colorLineSolvable({ name: 'a two-color diagonal', rows: ['rb..', 'br..', '....', '....'] })).toBe(
      true,
    );
  });

  it("a two-color hint is a square the colored numbers settle, in the picture's own color, from any point of a solve", () => {
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
          const empty = target.flatMap((row, y) =>
            row.flatMap((c, x) => (!c && filled[y][x] === null ? [{ x, y }] : [])),
          )[0];
          if (empty) filled[empty.y][empty.x] = 'x';
        }
      }
      expect(
        target.every((row, y) => row.every((c, x) => !c || filled[y][x] === c)),
        `${picture.name}: following hints finishes it`,
      ).toBe(true);
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
  it('the ghost finger copies, mirrors and solves every picture of every level touch by touch, never tapping a wrong or a settled square', () => {
    for (const plan of PLANS) {
      for (const picture of picturesFor(plan)) {
        const target = toGrid(picture);
        const n = plan.size;
        // The board as the game starts it: mirror levels have the left half (level 7: the top-left quarter) drawn.
        const filled: Filled = target.map((row, y) =>
          row.map((_, x) => (given(plan, x, y) ? target[y][x] : null)),
        );
        let color = colorsOf(picture)[0];
        let from: { x: number; y: number } | undefined;
        let paletteTaps = 0;
        let taps = 0;
        for (let step = 0; step < 200; step++) {
          const move = pixelTouch(plan, picture, filled, color, from);
          if (!move) break;
          if ('color' in move) {
            expect(
              (plan.mode === 'copy' && plan.colors === 2) || plan.mode === 'colorClues',
              `${picture.name}: only two-color levels have a palette`,
            ).toBe(true);
            expect(move.color, 'a different color than the one chosen').not.toBe(color);
            if (plan.mode === 'colorClues') {
              // It changes color only when the numbers settle nothing more in the color in hand.
              expect(
                colorLogicCell(picture, filled, color)?.c,
                `${picture.name}: nothing settled in ${color}`,
              ).toBe(move.color);
            } else
              expect(++paletteTaps, `${picture.name}: changes color once for each color`).toBeLessThanOrEqual(
                colorsOf(picture).length,
              );
            color = move.color;
            continue;
          }
          const { x, y } = move.cell;
          // The game's own rule: a square the picture leaves empty, or the wrong color, is a miss; so is one already filled (ignored) or given.
          expect(
            target[y][x],
            `${plan.mode} ${picture.name}: (${x}, ${y}) belongs to the picture`,
          ).not.toBeNull();
          expect(filled[y][x], `${picture.name}: (${x}, ${y}) is still empty`).toBeNull();
          if ((plan.mode === 'copy' && plan.colors === 2) || plan.mode === 'colorClues')
            expect(target[y][x], 'the color in hand').toBe(color);
          expect(given(plan, x, y), 'only the part still to do').toBe(false);
          if (plan.mode === 'big' && from) {
            // Block by block: it leaves a block only once that block is finished.
            const sameBlock = (a: { x: number; y: number }, b: { x: number; y: number }) =>
              a.x >> 1 === b.x >> 1 && a.y >> 1 === b.y >> 1;
            if (!sameBlock(from, { x, y }))
              for (let dy = 0; dy < 2; dy++)
                for (let dx = 0; dx < 2; dx++) {
                  const bx = (from.x & ~1) + dx;
                  const by = (from.y & ~1) + dy;
                  if (target[by][bx])
                    expect(
                      filled[by][bx],
                      `${picture.name}: the block at (${bx}, ${by}) is done first`,
                    ).not.toBeNull();
                }
          }
          filled[y][x] = plan.mode === 'clues' ? 'b' : target[y][x];
          from = { x, y };
          taps++;
        }
        const want = target.flat().filter((c, i) => !!c && !given(plan, i % n, Math.floor(i / n))).length;
        expect(taps, `${plan.mode} ${picture.name}: every square it needs, and no more`).toBe(want);
      }
    }
  });

  it('level 7 pictures are one color, mirror across both lines, and the drawn quarter decides every other square', () => {
    const plan = planFor(7);
    expect(plan.mode).toBe('mirror2');
    for (const p of FOURFOLD) {
      expect(p.rows, p.name).toHaveLength(6);
      for (const r of p.rows) expect(r, p.name).toMatch(/^[.roygbpun]{6}$/);
      expect(colorsOf(p), p.name).toHaveLength(1);
      expect(symmetric(p), `${p.name}: left and right match`).toBe(true);
      expect(p.rows, `${p.name}: top and bottom match`).toEqual([...p.rows].reverse());
      const g = toGrid(p);
      let open = 0;
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 6; x++) {
          const q = quarterOf(6, x, y);
          expect(given(plan, q.x, q.y), 'its mirror square is in the drawn quarter').toBe(true);
          expect(g[y][x], `${p.name} (${x}, ${y}) is its quarter square's mirror`).toBe(g[q.y][q.x]);
          if (!given(plan, x, y) && g[y][x]) open++;
        }
      // Every other quarter has something to copy.
      expect(open, p.name).toBeGreaterThanOrEqual(9);
    }
    expect(given(planFor(7), 2, 2)).toBe(true);
    expect(given(planFor(7), 3, 2)).toBe(false);
    expect(given(planFor(7), 2, 3)).toBe(false);
    expect(given(planFor(3), 2, 5)).toBe(true);
  });

  it('level 8 turns each square of a little 3 by 3 model into a whole aligned block of four', () => {
    const plan = planFor(8);
    expect(plan.mode).toBe('big');
    for (const m of MODELS) {
      expect(m.rows, m.name).toHaveLength(3);
      for (const r of m.rows) expect(r, m.name).toMatch(/^[.roygbpun]{3}$/);
      expect(colorsOf(m), m.name).toHaveLength(1);
      const big = scaleUp(m, 2);
      expect(big.rows).toHaveLength(6);
      const count = (p: { rows: string[] }) => p.rows.join('').replace(/\./g, '').length;
      expect(count(big), `${m.name}: four times as many squares`).toBe(4 * count(m));
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 6; x++)
          expect(big.rows[y][x], `${m.name} (${x}, ${y})`).toBe(m.rows[y >> 1][x >> 1]);
      expect(scaleDown(big, 2)).toEqual(m);
    }
    expect(picturesFor(plan).map((p) => p.name)).toEqual(MODELS.map((m) => m.name));
  });

  it('the level 7 and 8 glow is open picture squares near her last tap: a square whose mirror is drawn, or one whole block', () => {
    for (const level of [7, 8]) {
      const plan = planFor(level);
      for (const picture of picturesFor(plan)) {
        const target = toGrid(picture);
        const filled: Filled = target.map((row, y) =>
          row.map((_, x) => (given(plan, x, y) ? target[y][x] : null)),
        );
        // From any corner, part-way through: the glow is only squares still to fill, and filling them makes progress.
        for (const from of [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
          { x: 5, y: 0 },
          { x: 0, y: 5 },
        ]) {
          const cells = helpCells(plan, picture, filled, from);
          expect(cells.length, `${picture.name}: something glows`).toBeGreaterThan(0);
          for (const c of cells) {
            expect(target[c.y][c.x], `${picture.name}: the glow is a picture square`).not.toBeNull();
            expect(filled[c.y][c.x], 'still open').toBeNull();
            expect(given(plan, c.x, c.y)).toBe(false);
            if (level === 7) {
              const q = quarterOf(6, c.x, c.y);
              expect(filled[q.y][q.x], 'its mirror is drawn').not.toBeNull();
            }
          }
          if (level === 7) expect(cells).toHaveLength(1);
          if (level === 8) {
            // One block, and every open picture square of it.
            const bx = cells[0].x >> 1;
            const by = cells[0].y >> 1;
            expect(cells.every((c) => c.x >> 1 === bx && c.y >> 1 === by)).toBe(true);
            expect(cells).toHaveLength(4);
          }
        }
        // Following the glow alone finishes the picture.
        let from: { x: number; y: number } | undefined;
        for (let step = 0; step < 40; step++) {
          const cells = helpCells(plan, picture, filled, from);
          if (!cells.length) break;
          for (const c of cells) filled[c.y][c.x] = target[c.y][c.x];
          from = cells[0];
        }
        expect(
          target.every((row, y) => row.every((c, x) => !c || filled[y][x] === c)),
          `${picture.name}: the glow leads to the finished picture`,
        ).toBe(true);
      }
    }
  });

  it('level 9 copies two-color 4 by 4 pictures and sits between levels 1 and 2 for the younger bands', async () => {
    const { pixelPictures } = await import('./index');
    const { landing, levelsInOrder, stepLevel } = await import('../../progress/difficulty');
    const plan = planFor(9);
    expect(plan).toMatchObject({ mode: 'copy', size: 4, colors: 2 });
    for (const p of picturesFor(plan)) {
      expect(p.rows, p.name).toHaveLength(4);
      expect(colorsOf(p), p.name).toHaveLength(2);
    }
    expect(picturesFor(plan).map((p) => p.name)).toContain('a ladybird');
    // Level 1 stays one color on the same grid.
    for (const p of picturesFor(planFor(1))) expect(colorsOf(p), p.name).toHaveLength(1);
    const orders = { preschool: [1, 9, 2], prek: [1, 9, 2, 3, 10], school: [3, 4, 5, 6, 7, 8, 10] };
    for (const [band, order] of Object.entries(orders) as [keyof typeof orders, number[]][]) {
      const range = pixelPictures.levels(band);
      expect(levelsInOrder(range), band).toEqual(order);
      // Every ID once, min and max its ends, and level 1 still the first.
      expect(new Set(order).size).toBe(order.length);
      expect([range.min, range.max]).toEqual([Math.min(...order), Math.max(...order)]);
    }
    expect(stepLevel(1, 1, pixelPictures.levels('prek'))).toBe(9);
    expect(stepLevel(9, 1, pixelPictures.levels('prek'))).toBe(2);
    expect(stepLevel(2, -1, pixelPictures.levels('preschool'))).toBe(9);
    // Carried into school (a birthday or a pin), the easy level 9 starts school at its easiest level, not its hardest.
    expect(landing(9, pixelPictures.levels('school'), pixelPictures.entryLevels)).toBe(3);
  });

  it('level 10 is a free picture: nothing is wrong, a tap empties a colored square, and Done needs four squares', async () => {
    const { pixelPictures } = await import('./index');
    const { stepLevel } = await import('../../progress/difficulty');
    const plan = planFor(10);
    expect(plan).toMatchObject({ mode: 'free', size: 5 });
    expect(makePictures(plan, new Rng(3))).toEqual([blank(5)]);
    expect(FREE_COLORS).toHaveLength(4);
    let board: Filled = toGrid(blank(5));
    expect(canFinish(board)).toBe(false);
    // Three squares in three colors cannot finish; a fourth can.
    board = freeTap(freeTap(freeTap(board, 0, 0, 'r'), 1, 0, 'y'), 2, 0, 'b');
    expect(canFinish(board)).toBe(false);
    board = freeTap(board, 3, 3, 'g');
    expect(canFinish(board)).toBe(true);
    expect(FREE_MIN).toBe(4);
    // A tap on a colored square empties it, whatever the paint in hand, and Done hides again.
    board = freeTap(board, 1, 0, 'r');
    expect(board[0][1]).toBeNull();
    expect(canFinish(board)).toBe(false);
    // The kept creation is exactly the board.
    board = freeTap(board, 4, 4, 'r');
    expect(pixelsOf(board)).toEqual([
      { x: 0, y: 0, color: 'red' },
      { x: 2, y: 0, color: 'blue' },
      { x: 3, y: 3, color: 'green' },
      { x: 4, y: 4, color: 'red' },
    ]);
    // A free round is last in each order, so stepping up never passes it.
    expect(stepLevel(10, 1, pixelPictures.levels('school'))).toBe(10);
    expect(stepLevel(8, 1, pixelPictures.levels('school'))).toBe(10);
  });

  it('the ghost finger draws the heart on level 10, clearing stray squares, then presses Done', () => {
    // From an empty board and from one with stray squares in other colors.
    const starts: Filled[] = [toGrid(blank(5)), freeTap(freeTap(toGrid(blank(5)), 0, 0, 'b'), 1, 1, 'g')];
    for (const start of starts) {
      let board = start;
      let color: string = FREE_COLORS[2];
      let pressed = false;
      for (let step = 0; step < 100 && !pressed; step++) {
        const move = freeTouch(board, color);
        expect(move).not.toBeNull();
        if (move === 'done') pressed = true;
        else if (move && 'color' in move) {
          expect(FREE_COLORS).toContain(move.color);
          expect(move.color).not.toBe(color);
          color = move.color;
        } else if (move) board = freeTap(board, move.cell.x, move.cell.y, color);
      }
      expect(pressed).toBe(true);
      expect(board.map((r) => r.map((c) => c ?? '.').join(''))).toEqual(FREE_HEART);
      expect(canFinish(board)).toBe(true);
    }
  });
});
