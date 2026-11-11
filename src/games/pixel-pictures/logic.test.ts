import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import {
  BIT_COUNT,
  bitRowsOf,
  bitCheck,
  bitsLayout,
  bitTouch,
  decodePicture,
  decodeRow,
  encodePicture,
  encodeRow,
  firstDiffer,
  LEVELS,
  makeBitRows,
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
    // Level 10 is a free design on an empty board; it has no pictures to copy. Level 11 draws rows, not pictures.
    for (const plan of PLANS.filter((p) => p.mode !== 'free' && !p.mode.startsWith('bits'))) {
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
    const orders = { preschool: [1, 9, 2], prek: [1, 9, 2, 3, 10], school: [3, 4, 5, 6, 7, 8, 11, 12, 10] };
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
    expect(stepLevel(8, 1, pixelPictures.levels('school'))).toBe(11);
    expect(stepLevel(11, 1, pixelPictures.levels('school'))).toBe(12);
    expect(stepLevel(12, 1, pixelPictures.levels('school'))).toBe(10);
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

describe('Pixel Pictures level 11, ones and zeros', () => {
  const ALL = Array.from({ length: 16 }, (_, k) => [8, 4, 2, 1].map((m) => (k & m) !== 0));
  const digits = (bits: boolean[]) => bits.map((b) => (b ? '1' : '0')).join('');
  const one = PICTURES[4].filter((p) => colorsOf(p).length === 1);

  it('a row and its cards round-trip, the empty and the full row included', () => {
    expect(new Set(ALL.map(digits)).size).toBe(16);
    for (const b of ALL) {
      expect(encodeRow(decodeRow(b, 'r'))).toEqual(b);
      expect(decodeRow(b, 'r')).toHaveLength(BIT_COUNT);
    }
    expect(decodeRow([false, false, false, false], 'r')).toBe('....');
    expect(decodeRow([true, true, true, true], 'g')).toBe('gggg');
    expect(one).toHaveLength(5);
    for (const p of one) expect(decodePicture(encodePicture(p), colorsOf(p)[0], p.name)).toEqual(p);
  });

  it('the key reads left to right and top to bottom, digit for digit', () => {
    const table: Record<string, string[]> = {
      'a heart': ['1010', '1111', '1111', '0110'],
      'a little tree': ['0110', '1111', '0110', '0110'],
      'a smile': ['1001', '0000', '1001', '0110'],
      'a boat': ['0100', '0110', '1111', '0110'],
      'a plus': ['0100', '1110', '0100', '0000'],
    };
    for (const p of one) expect(encodePicture(p).map(digits), p.name).toEqual(table[p.name]);
    // Card i is column i, and row j the jth group of four: reversing either changes an asymmetric picture.
    const boat = one.find((p) => p.name === 'a boat')!;
    const bits = encodePicture(boat);
    expect(
      decodePicture(
        bits.map((r) => [...r].reverse()),
        'b',
        boat.name,
      ),
    ).not.toEqual(boat);
    expect(decodePicture([...bits].reverse(), 'b', boat.name)).not.toEqual(boat);
    expect(encodeRow('.b..')).toEqual([false, true, false, false]);
  });

  it('the check passes only when all four cards agree, and a failed check is one miss whatever differs', () => {
    for (const bits of ALL)
      for (const target of ALL) {
        const r = bitCheck(bits, target, 0, null);
        expect(r.ok).toBe(digits(bits) === digits(target));
        if (!r.ok) {
          // The card named is the leftmost that differs, with what its square wants; a first failure is no hint.
          expect(bits.slice(0, r.card)).toEqual(target.slice(0, r.card));
          expect(bits[r.card]).not.toBe(target[r.card]);
          expect(r.wants).toBe(target[r.card]);
          expect(r.hint).toBeNull();
        }
      }
    // 0000 against an empty row passes with no flip.
    expect(bitCheck([false, false, false, false], encodeRow('....'), 0, null)).toEqual({ ok: true });
  });

  it('every second failed check is a hint: the first differing card glows, and a glow left alone is flipped', () => {
    const bits = [false, false, false, false];
    const target = [false, true, false, true];
    expect(bitCheck(bits, target, 0, null)).toMatchObject({ ok: false, card: 1, hint: null });
    expect(bitCheck(bits, target, 1, null)).toMatchObject({ ok: false, card: 1, hint: 'glow' });
    expect(bitCheck(bits, target, 2, 1)).toMatchObject({ ok: false, card: 1, hint: null });
    expect(bitCheck(bits, target, 3, 1)).toMatchObject({ ok: false, card: 1, wants: true, hint: 'set' });
    // She flipped the glowing card: the next hint glows the next card that differs.
    expect(bitCheck([false, true, false, false], target, 3, null)).toMatchObject({ card: 3, hint: 'glow' });
  });

  it('help leads somewhere: following the first differing card reaches any row in at most four flips', () => {
    for (const start of ALL)
      for (const target of ALL) {
        const bits = [...start];
        let flips = 0;
        for (let card = firstDiffer(bits, target); card !== null; card = firstDiffer(bits, target)) {
          // It never touches a card that already agrees.
          expect(bits[card]).not.toBe(target[card]);
          bits[card] = !bits[card];
          expect(++flips).toBeLessThanOrEqual(BIT_COUNT);
        }
        expect(bits).toEqual(target);
      }
  });

  it('the ghost finger flips only the cards the row needs, left to right, then the arrow, then the check', () => {
    for (const target of ALL) {
      const bits = [false, false, false, false];
      let shown = false;
      const moves: string[] = [];
      for (let step = 0; step < 10; step++) {
        const move = bitTouch(bits, target, shown);
        if (move === 'check') {
          // It never makes a failing check.
          expect(bitCheck(bits, target, 0, null).ok).toBe(true);
          moves.push('check');
          break;
        }
        if (move === 'arrow') {
          shown = true;
          moves.push('arrow');
        } else {
          bits[move.card] = !bits[move.card];
          shown = false;
          moves.push(String(move.card));
        }
      }
      const needed = target.flatMap((t, i) => (t ? [String(i)] : []));
      expect(moves, digits(target)).toEqual([...needed, 'arrow', 'check']);
    }
  });

  it('a round is three different seeded rows, never 0000, each in a one-color paint', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rows = makeBitRows(new Rng(seed));
      expect(rows).toEqual(makeBitRows(new Rng(seed)));
      expect(rows).toHaveLength(3);
      expect(new Set(rows.map((r) => digits(r.bits))).size).toBe(3);
      for (const r of rows) {
        expect(r.bits).toHaveLength(BIT_COUNT);
        expect(r.bits.some(Boolean)).toBe(true);
        expect(Object.keys(LETTERS_USED)).toContain(r.color);
      }
    }
    // Every one of the 15 rows can come up.
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++)
      for (const r of makeBitRows(new Rng(seed))) seen.add(digits(r.bits));
    expect(seen.size).toBe(15);
  });

  it('levels 11 and 12 join school after 8 and before the free level; the other levels and bands are as they were', async () => {
    const { pixelPictures } = await import('./index');
    const { landing, levelsInOrder } = await import('../../progress/difficulty');
    expect(levelsInOrder(pixelPictures.levels('school'))).toEqual([3, 4, 5, 6, 7, 8, 11, 12, 10]);
    expect(LEVELS.preschool).toEqual({ min: 1, max: 9, order: [1, 9, 2] });
    expect(LEVELS.prek).toEqual({ min: 1, max: 10, order: [1, 9, 2, 3, 10] });
    expect(planFor(11)).toMatchObject({ mode: 'bitsRow', size: 4, colors: 1, pictures: 3 });
    expect(planFor(12)).toMatchObject({ mode: 'bitsPicture', size: 4, colors: 1, pictures: 2 });
    expect(pixelPictures.describeLevel!(11)).toMatch(/^Ones and zeros/);
    expect(pixelPictures.describeLevel!(12)).toMatch(/^Ones and zeros, a whole picture/);
    // Levels 1–10 keep their plans.
    expect(PLANS.slice(0, 10).map((p) => [p.mode, p.size, p.colors, p.pictures])).toEqual([
      ['copy', 4, 1, 3],
      ['copy', 5, 2, 3],
      ['mirror', 6, 1, 2],
      ['clues', 5, 1, 2],
      ['clues', 6, 1, 2],
      ['colorClues', 6, 2, 2],
      ['mirror2', 6, 1, 2],
      ['big', 6, 1, 2],
      ['copy', 4, 2, 3],
      ['free', 5, 1, 1],
    ]);
    expect(PLANS[9].name).toMatch(/^My own picture/);
    expect(pixelPictures.entryLevels).toEqual([9]);
    expect(landing(9, pixelPictures.levels('school'), pixelPictures.entryLevels)).toBe(3);
  });

  it('the cards and buttons keep their size and clear the corners at every view, upright views included', () => {
    const views = {
      landscape: computeView(1024, 768),
      portrait: computeView(768, 1024),
      phone: computeView(844, 390),
      notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
      ...UPRIGHT_VIEWS,
    };
    for (const [name, v] of Object.entries(views)) {
      const l = bitsLayout(11, v);
      expect(l, name).not.toBeNull();
      if (!l) continue;
      const targets = [
        ...l.cards.map((c, i) => ({ what: `card ${i + 1}`, ...c })),
        { what: 'the arrow', ...l.arrow },
        { what: 'the check', ...l.check },
      ];
      expect(uprightProblems(v, targets), name).toEqual([]);
      for (const c of l.cards) expect([c.w, c.h]).toEqual([120, 140]);
      // Left to right, and each square straight above its card.
      l.cards.forEach((c, i) => {
        if (i) expect(c.x - l.cards[i - 1].x).toBe(l.pitch);
      });
      expect(l.cell).toBeGreaterThanOrEqual(100);
      // The drawn parts stay inside the view and off the targets, the corner buttons and the pet.
      const drawn = [
        { what: 'the row to make', ...l.ref },
        { what: 'her row', ...l.own },
        { what: 'the key card', ...l.key },
        { what: 'the shelf', ...l.shelf },
      ];
      expect(uprightProblems(v, [...drawn, ...targets], 0), name).toEqual([]);
    }
    // Too small a view gets no layout rather than smaller cards.
    expect(bitsLayout(11, { w: 600, h: 500 })).toBeNull();
    expect(bitsLayout(11, { w: 600, h: 1000 })).toBeNull();
  });

  it('level 12 draws two different one-color 4 by 4 pictures of the five, the same for the same seed', () => {
    const plan = planFor(12);
    expect(picturesFor(plan).map((p) => p.name)).toEqual([
      'a heart',
      'a little tree',
      'a smile',
      'a boat',
      'a plus',
    ]);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const pictures = makePictures(plan, new Rng(seed));
      expect(pictures).toEqual(makePictures(plan, new Rng(seed)));
      expect(pictures).toHaveLength(2);
      expect(pictures[0].name).not.toBe(pictures[1].name);
      for (const p of pictures) {
        expect(p.rows.map((r) => r.length)).toEqual([4, 4, 4, 4]);
        expect(colorsOf(p)).toHaveLength(1);
        seen.add(p.name);
      }
    }
    expect(seen.size).toBe(5);
  });

  it('a picture is written as its rows, top to bottom, in its one color, and the rows give the picture back', () => {
    for (const p of picturesFor(planFor(12))) {
      const rows = bitRowsOf(p);
      expect(rows.map((r) => r.bits)).toEqual(encodePicture(p));
      expect(new Set(rows.map((r) => r.color))).toEqual(new Set(colorsOf(p)));
      expect(
        decodePicture(
          rows.map((r) => r.bits),
          rows[0].color,
          p.name,
        ),
      ).toEqual(p);
    }
    // An empty picture row is a real case: the cards already say it, and the ghost finger only looks and checks.
    const smile = bitRowsOf(PICTURES[4].find((p) => p.name === 'a smile')!);
    expect(digits(smile[1].bits)).toBe('0000');
    expect(bitCheck([false, false, false, false], smile[1].bits, 0, null)).toEqual({ ok: true });
    expect(bitTouch([false, false, false, false], smile[1].bits, false)).toBe('arrow');
    expect(bitTouch([false, false, false, false], smile[1].bits, true)).toBe('check');
    const plus = bitRowsOf(PICTURES[4].find((p) => p.name === 'a plus')!);
    expect(digits(plus[3].bits)).toBe('0000');
  });

  it('level 12 keeps the cards and buttons their size, and its preview board readable, at every view', () => {
    const views = {
      landscape: computeView(1024, 768),
      portrait: computeView(768, 1024),
      phone: computeView(844, 390),
      notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
      ...UPRIGHT_VIEWS,
    };
    for (const [name, v] of Object.entries(views)) {
      const l = bitsLayout(12, v);
      expect(l, name).not.toBeNull();
      if (!l) continue;
      const targets = [
        ...l.cards.map((c, i) => ({ what: `card ${i + 1}`, ...c })),
        { what: 'the arrow', ...l.arrow },
        { what: 'the check', ...l.check },
      ];
      expect(uprightProblems(v, targets), name).toEqual([]);
      for (const c of l.cards) expect([c.w, c.h]).toEqual([120, 140]);
      l.cards.forEach((c, i) => {
        if (i) expect(c.x - l.cards[i - 1].x).toBe(l.pitch);
      });
      // The board is a preview, never touched: its squares may be under 100 units, but not under 64.
      expect(l.boardCell, name).toBeGreaterThanOrEqual(64);
      expect(l.boardCell, name).toBeLessThanOrEqual(100);
      expect([l.board!.w, l.board!.h]).toEqual([4 * l.boardCell!, 4 * l.boardCell!]);
      const drawn = [
        { what: 'the board', ...l.board! },
        { what: 'the digits', ...l.digits! },
        { what: 'the key card', ...l.key },
        { what: 'the picture to write', ...l.shelf },
      ];
      expect(uprightProblems(v, [...drawn, ...targets], 0), name).toEqual([]);
    }
    expect(bitsLayout(12, { w: 600, h: 500 })).toBeNull();
    expect(bitsLayout(12, { w: 600, h: 1000 })).toBeNull();
    expect(bitsLayout(11, computeView(1024, 768))!.board).toBeUndefined();
    expect(bitsLayout(13, computeView(1024, 768))).toBeNull();
  });
});

const LETTERS_USED = { r: 1, g: 1, y: 1, b: 1, u: 1 };
