import { describe, expect, it } from 'vitest';
import type { ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import { firstLevel, landing, levelsInOrder } from '../../progress/difficulty';
import { dotLink } from '.';
import { GARDENS } from './gardens';
import {
  BIG,
  BIG_FILL,
  BIG_LEVEL,
  bigArrival,
  bigShown,
  BUDDY,
  BUDDY_LEVEL,
  buddyCounts,
  chainCounts,
  collapse,
  demoMove,
  DOT_COLORS,
  DOT_MARKS,
  ensureMove,
  findLine,
  findPattern,
  findSquare,
  GARDEN,
  gardenFall,
  gardenFalls,
  gardenLeft,
  gardenLines,
  greedyGarden,
  LEVELS,
  parseGarden,
  popcount,
  solveGarden,
  type Garden,
  makeGrid,
  nearestCell,
  pairs,
  PATTERN,
  patternColors,
  patternCounts,
  pickBuddy,
  planFor,
  PLANS,
  popped,
  step,
  TEN,
  tenCounts,
  tenFits,
  tenLeft,
  tenLine,
  TWO,
  twoAdd,
  twoNeed,
  type Grid,
} from './logic';

const R: ColorName = 'red';
const B: ColorName = 'blue';
const Y: ColorName = 'yellow';

describe('Dot Link', () => {
  it('gives every dot color its own mark, so no two colors differ by hue alone', () => {
    const marks = DOT_COLORS.map((k) => DOT_MARKS[k]);
    expect(marks.every(Boolean)).toBe(true);
    expect(new Set(marks).size).toBe(DOT_COLORS.length);
  });

  it('extends through same-color neighbors, steps back, and closes squares', () => {
    const g: Grid = [
      [R, R, B],
      [R, R, B],
      [B, B, B],
    ];
    expect(step(g, [{ r: 0, c: 0 }], { r: 0, c: 1 })).toBe('extend');
    expect(step(g, [{ r: 0, c: 0 }], { r: 0, c: 2 })).toBe('no'); // not adjacent
    expect(step(g, [{ r: 0, c: 1 }], { r: 0, c: 2 })).toBe('no'); // other color
    expect(
      step(
        g,
        [
          { r: 0, c: 0 },
          { r: 0, c: 1 },
        ],
        { r: 0, c: 0 },
      ),
    ).toBe('back');
    const around = [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 1 },
      { r: 1, c: 0 },
    ];
    expect(step(g, around, { r: 0, c: 0 })).toBe('loop');
    // A loop clears every dot of that color.
    expect(popped(g, around, true)).toHaveLength(4);
    expect(
      popped(
        g,
        [
          { r: 2, c: 0 },
          { r: 2, c: 1 },
        ],
        true,
      ),
    ).toHaveLength(5);
  });

  it('drops dots down into gaps and refills from the top', () => {
    const g: Grid = [
      [R, B],
      [B, R],
      [R, R],
    ];
    const { grid, falls } = collapse(g, [{ r: 2, c: 0 }], new Rng(1), [R, B]);
    expect(grid[2][0]).toBe(B); // the blue above fell down
    expect(grid[1][0]).toBe(R);
    expect(grid[2][1]).toBe(R);
    expect(falls.filter((f) => f.c === 0)).toHaveLength(3);
    expect(grid.every((row) => row.every(Boolean))).toBe(true);
  });

  it('always leaves a move that counts for the level', () => {
    for (const plan of [...PLANS, BUDDY]) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const palette: ColorName[] = ['red', 'blue', 'yellow', 'green'].slice(0, plan.colors) as ColorName[];
        const g = ensureMove(
          plan,
          makeGrid(plan, rng, palette),
          rng,
          plan.mode === 'color' ? 'red' : undefined,
        );
        if (plan.mode === 'square') expect(findSquare(g)).not.toBeNull();
        else
          expect(
            findLine(
              g,
              plan.mode === 'chain' ? plan.length! : plan.mode === 'tap' ? 1 : 2,
              plan.mode === 'color' ? 'red' : undefined,
            ),
            plan.name,
          ).not.toBeNull();
      }
    }
  });

  it('chooses a clean demonstration move that satisfies each level rule', () => {
    for (const plan of [...PLANS, BUDDY])
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const palette: ColorName[] = ['red', 'blue', 'yellow', 'green'].slice(0, plan.colors) as ColorName[];
        const target = plan.mode === 'color' ? R : undefined;
        const grid = ensureMove(plan, makeGrid(plan, rng, palette), rng, target);
        const move = demoMove(plan, grid, target)!;
        expect(move.length, plan.name).toBeGreaterThan(0);
        if (plan.mode === 'tap') expect(move).toHaveLength(1);
        else {
          const walked = plan.mode === 'square' ? move.slice(0, -1) : move;
          for (let i = 1; i < walked.length; i++)
            expect(step(grid, walked.slice(0, i), walked[i])).toBe('extend');
          if (plan.mode === 'square') expect(step(grid, walked, move.at(-1)!)).toBe('loop');
          if (plan.mode === 'chain') expect(walked.length).toBeGreaterThanOrEqual(plan.length!);
          if (plan.mode === 'color') expect(grid[walked[0].r][walked[0].c]).toBe(target);
        }
      }
  });

  it('makes the new level count exactly five dots and offers an exact five-dot demo', () => {
    const plan = PLANS[5];
    expect(plan).toMatchObject({ mode: 'chain', length: 5, exactLength: true, goal: 3 });
    expect(chainCounts(plan, 4, false)).toBe(false);
    expect(chainCounts(plan, 5, false)).toBe(true);
    expect(chainCounts(plan, 6, false)).toBe(false);
    expect(chainCounts(plan, 5, true)).toBe(false);
    const grid: Grid = [
      [R, R, R, R, R, B],
      [B, B, B, B, B, B],
      [R, B, R, B, R, B],
      [B, R, B, R, B, R],
      [R, B, R, B, R, B],
    ];
    const line = demoMove(plan, grid)!;
    expect(line).toHaveLength(5);
    for (let i = 1; i < line.length; i++) expect(step(grid, line.slice(0, i), line[i])).toBe('extend');
  });

  it('plays level 11 as Find my buddy: one lit pair of neighbors that is the only line that links', () => {
    expect(planFor(BUDDY_LEVEL)).toBe(BUDDY);
    expect(BUDDY).toMatchObject({ mode: 'buddy', rows: 3, cols: 3, colors: 2 });
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const grid = ensureMove(BUDDY, makeGrid(BUDDY, rng, [R, B]), rng);
      const buddy = pickBuddy(grid, rng)!;
      expect(buddy).toHaveLength(2);
      const [a, b] = buddy;
      expect(Math.abs(a.r - b.r) + Math.abs(a.c - b.c)).toBe(1);
      expect(grid[a.r][a.c]).toBe(grid[b.r][b.c]);
      // The demonstration traces exactly the lit pair, as a real line.
      const move = demoMove(BUDDY, grid, undefined, buddy)!;
      expect(move).toEqual(buddy);
      expect(step(grid, [move[0]], move[1])).toBe('extend');
      // Both directions count; every other same-color pair does not.
      expect(buddyCounts(buddy, buddy)).toBe(true);
      expect(buddyCounts(buddy, [b, a])).toBe(true);
      for (const other of pairs(grid)) {
        const isBuddy = other.every((o) => buddy.some((x) => x.r === o.r && x.c === o.c));
        expect(buddyCounts(buddy, other)).toBe(isBuddy);
      }
    }
  });

  it('plays level 7 as Two colors: pre-K only, two named numbers that add to the goal and fit the board', () => {
    expect(planFor(7)).toBe(TWO);
    expect(levelsInOrder(LEVELS.prek!)).toContain(7);
    expect(levelsInOrder(LEVELS.preschool!)).not.toContain(7);
    const [a, b] = TWO.goals!;
    expect(a + b).toBe(TWO.goal);
    expect(Math.max(a, b)).toBeLessThanOrEqual(TWO.rows * TWO.cols);
    expect(TWO.colors).toBeGreaterThan(2);
    expect(dotLink.describeLevel(7)).toMatch(/two colors/i);
  });

  it('counts a two-color line toward its own color only, and stops each count at its number', () => {
    expect(twoNeed(TWO, [0, 0])).toBe(0);
    expect(twoNeed(TWO, [6, 0])).toBe(1);
    expect(twoNeed(TWO, [2, 4])).toBe(0);
    expect(twoNeed(TWO, [6, 4])).toBe(-1);
    expect(twoAdd(TWO, [0, 0], 0, 3)).toBe(3);
    expect(twoAdd(TWO, [0, 0], 1, 3)).toBe(3);
    // A loop that overshoots is fine: the count stops at the number.
    expect(twoAdd(TWO, [4, 0], 0, 9)).toBe(2);
    expect(twoAdd(TWO, [0, 3], 1, 5)).toBe(1);
    // Another color, or a color already full, counts nothing.
    expect(twoAdd(TWO, [0, 0], -1, 4)).toBe(0);
    expect(twoAdd(TWO, [6, 0], 0, 2)).toBe(0);
  });

  it('always leaves a line of the color still needed, so every seeded two-color round finishes', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const palette = rng.shuffle([...DOT_COLORS]).slice(0, TWO.colors);
      const targets = palette.slice(0, 2);
      const have = [0, 0];
      let grid = ensureMove(TWO, makeGrid(TWO, rng, palette), rng, targets[0]);
      let lines = 0;
      for (let need = twoNeed(TWO, have); need >= 0; need = twoNeed(TWO, have)) {
        const move = demoMove(TWO, grid, targets[need]);
        expect(move, `seed ${seed}`).not.toBeNull();
        expect(move!.every((c) => grid[c.r][c.c] === targets[need])).toBe(true);
        have[need] += twoAdd(TWO, have, need, move!.length);
        const after = twoNeed(TWO, have);
        grid = ensureMove(
          TWO,
          collapse(grid, move!, rng, palette).grid,
          rng,
          after >= 0 ? targets[after] : undefined,
        );
        lines++;
      }
      expect(have).toEqual([...TWO.goals!]);
      expect(lines).toBeLessThanOrEqual(TWO.goal / 2);
    }
  });

  it('plays level 8 as Same, different: pre-K top and the school window, a red-blue-red-blue sign of two of its colors', () => {
    expect(planFor(8)).toBe(PATTERN);
    expect(levelsInOrder(LEVELS.prek!)).toContain(8);
    expect(levelsInOrder(LEVELS.school!)[0]).toBe(8);
    expect(dotLink.bands).toContain('school');
    // Every level any band can reach has its own plan, and nothing below 8 moved.
    for (const band of dotLink.bands)
      for (const level of levelsInOrder(LEVELS[band]!))
        expect(planFor(level).name).toBe(dotLink.describeLevel(level));
    expect(planFor(7)).toBe(TWO);
    const signs = patternColors(PATTERN, [Y, R, B]);
    expect(signs).toEqual([Y, R, Y, R]);
    expect(PATTERN.colors).toBeGreaterThan(2);
    expect(PATTERN.pattern!.length).toBeLessThanOrEqual(PATTERN.cols);
    expect(dotLink.describeLevel(8)).toMatch(/pattern/i);
  });

  it('counts a pattern line that starts on the first color and follows the sign at least once through', () => {
    const sign = [R, B, R, B];
    expect(patternCounts([R, B, R, B], sign)).toBe(true);
    // It may keep going round the pattern.
    expect(patternCounts([R, B, R, B, R], sign)).toBe(true);
    expect(patternCounts([R, B, R, B, R, B], sign)).toBe(true);
    // Too short, broken, one color, or started on the second color.
    expect(patternCounts([R, B, R], sign)).toBe(false);
    expect(patternCounts([R, B, B, R], sign)).toBe(false);
    expect(patternCounts([R, R, R, R], sign)).toBe(false);
    expect(patternCounts([B, R, B, R], sign)).toBe(false);
    expect(patternCounts([R, B, R, B, B], sign)).toBe(false);
    expect(patternCounts([R, B], [])).toBe(false);
  });

  it('lets a pattern line cross colors while drawing, step back, and never close a loop', () => {
    const grid: Grid = [
      [R, B, R],
      [B, R, B],
    ];
    expect(step(grid, [{ r: 0, c: 0 }], { r: 0, c: 1 })).toBe('no');
    expect(step(grid, [{ r: 0, c: 0 }], { r: 0, c: 1 }, true)).toBe('extend');
    // Any neighbor extends a pattern line, even one that breaks the pattern: it is judged on letting go.
    expect(
      step(
        grid,
        [
          { r: 0, c: 0 },
          { r: 0, c: 1 },
        ],
        { r: 1, c: 1 },
        true,
      ),
    ).toBe('extend');
    expect(
      step(
        grid,
        [
          { r: 0, c: 0 },
          { r: 0, c: 1 },
        ],
        { r: 0, c: 0 },
        true,
      ),
    ).toBe('back');
    expect(step(grid, [{ r: 0, c: 0 }], { r: 1, c: 1 }, true)).toBe('no');
    const round = [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 1 },
      { r: 1, c: 0 },
    ];
    expect(step(grid, round, { r: 0, c: 0 }, true)).toBe('no');
  });

  it('always leaves a pattern line to draw, so every seeded pattern round finishes in three lines', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const palette = rng.shuffle([...DOT_COLORS]).slice(0, PATTERN.colors);
      const sign = patternColors(PATTERN, palette);
      let grid = ensureMove(PATTERN, makeGrid(PATTERN, rng, palette), rng, undefined, sign);
      for (let line = 0; line < PATTERN.goal; line++) {
        const move = demoMove(PATTERN, grid, undefined, undefined, sign);
        expect(move, `seed ${seed}`).not.toBeNull();
        expect(findPattern(grid, sign)).toEqual(move);
        // A real line: neighbors, no dot twice, and it follows the sign from its first color.
        expect(
          move!.slice(1).every((c, i) => Math.abs(c.r - move![i].r) + Math.abs(c.c - move![i].c) === 1),
        ).toBe(true);
        expect(new Set(move!.map((c) => `${c.r},${c.c}`)).size).toBe(move!.length);
        expect(
          patternCounts(
            move!.map((c) => grid[c.r][c.c]),
            sign,
          ),
        ).toBe(true);
        grid = ensureMove(PATTERN, collapse(grid, move!, rng, palette).grid, rng, undefined, sign);
      }
    }
  });

  it('plays level 9 as Make ten: the school window and a stretch at the top of pre-K', () => {
    expect(planFor(9)).toBe(TEN);
    expect(TEN).toMatchObject({ mode: 'ten', goal: 10 });
    expect(levelsInOrder(LEVELS.school!)).toEqual([8, 9, 10]);
    expect(levelsInOrder(LEVELS.prek!).at(-1)).toBe(9);
    expect(levelsInOrder(LEVELS.preschool!)).not.toContain(9);
    expect(dotLink.describeLevel(9)).toMatch(/ten/i);
    expect(planFor(8)).toBe(PATTERN);
  });

  it('stops a make-ten line at what is left, and lets one dot count only when one is left', () => {
    expect(tenLeft(TEN, 0)).toBe(10);
    expect(tenLeft(TEN, 7)).toBe(3);
    expect(tenFits(3, 3)).toBe(true);
    expect(tenFits(3, 4)).toBe(false);
    expect(tenCounts(3, 2)).toBe(true);
    expect(tenCounts(3, 3)).toBe(true);
    expect(tenCounts(3, 4)).toBe(false);
    expect(tenCounts(3, 1)).toBe(false);
    expect(tenCounts(1, 1)).toBe(true);
    expect(tenCounts(1, 2)).toBe(false);
    // The sums the dive names all build ten.
    for (const parts of [
      [4, 3, 3],
      [5, 5],
      [2, 8],
    ]) {
      let have = 0;
      for (const n of parts) {
        expect(tenCounts(tenLeft(TEN, have), n)).toBe(true);
        have += n;
      }
      expect(tenLeft(TEN, have)).toBe(0);
    }
    expect(tenLine([[R]], 0)).toBeNull();
  });

  it('suggests an exact finishing line when the board has one, else the longest that fits', () => {
    const grid: Grid = [
      [R, R, R, B],
      [Y, Y, B, B],
      [R, Y, Y, R],
    ];
    expect(tenLine(grid, 3)).toHaveLength(3);
    expect(tenLine(grid, 10)!.length).toBe(4); // the yellow run is the longest line on the board
    expect(tenLine(grid, 2)).toHaveLength(2);
    expect(tenLine(grid, 1)).toHaveLength(1);
  });

  it('leaves a counting line for every remainder from 10 down, so every seeded make-ten round finishes on exactly ten', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const palette = rng.shuffle([...DOT_COLORS]).slice(0, TEN.colors);
      let grid = ensureMove(TEN, makeGrid(TEN, rng, palette), rng);
      // Every remainder from 10 to 2 has a counting line on this board, and 1 a single dot.
      for (let left = 10; left >= 1; left--) {
        const line = demoMove(TEN, grid, undefined, undefined, undefined, left);
        expect(line, `seed ${seed} left ${left}`).not.toBeNull();
        expect(tenCounts(left, line!.length)).toBe(true);
      }
      let have = 0;
      let lines = 0;
      while (tenLeft(TEN, have) > 0) {
        const left = tenLeft(TEN, have);
        const move = demoMove(TEN, grid, undefined, undefined, undefined, left)!;
        expect(tenCounts(left, move.length), `seed ${seed}`).toBe(true);
        for (let i = 1; i < move.length; i++) expect(step(grid, move.slice(0, i), move[i])).toBe('extend');
        have += move.length;
        grid = ensureMove(TEN, collapse(grid, move, rng, palette).grid, rng);
        lines++;
      }
      expect(have).toBe(10);
      expect(lines).toBeLessThanOrEqual(10);
    }
  });

  it('keeps the earlier levels where they were', () => {
    expect(planFor(1).mode).toBe('tap');
    expect(planFor(2).mode).toBe('pair');
    expect(planFor(6)).toBe(PLANS[5]);
  });

  it('opens lap with level 12, One big dot, and leaves every other band and saved level where it was', () => {
    expect(planFor(BIG_LEVEL)).toBe(BIG);
    expect(levelsInOrder(LEVELS.lap!)).toEqual([BIG_LEVEL, 1]);
    expect(firstLevel(LEVELS.lap!, dotLink.entryLevels)).toBe(BIG_LEVEL);
    expect(firstLevel(LEVELS.toddler!, dotLink.entryLevels)).toBe(1);
    expect(levelsInOrder(LEVELS.toddler!)).not.toContain(BIG_LEVEL);
    // A lap level carried into toddler (a birthday) starts toddler at its own easiest level, not above its top.
    expect(dotLink.entryLevels).toContain(BIG_LEVEL);
    expect(landing(BIG_LEVEL, LEVELS.toddler!, dotLink.entryLevels)).toBe(1);
  });

  it('starts the big board with one dot in the middle and brings one more per pop until all nine stand', () => {
    expect(BIG_FILL[0]).toEqual({ r: 1, c: 1 });
    // Every place on the 3×3 board, once each.
    expect(new Set(BIG_FILL.map((c) => `${c.r},${c.c}`)).size).toBe(BIG.rows * BIG.cols);
    expect(BIG_FILL.every((c) => c.r >= 0 && c.r < BIG.rows && c.c >= 0 && c.c < BIG.cols)).toBe(true);
    expect(bigShown(0)).toBe(1);
    for (let pops = 1; pops < BIG_FILL.length; pops++) {
      expect(bigShown(pops)).toBe(bigShown(pops - 1) + 1);
      // The place a pop brings is the one that makes the count, and was empty before.
      expect(bigArrival(pops)).toEqual(BIG_FILL[bigShown(pops) - 1]);
      expect(BIG_FILL.slice(0, bigShown(pops - 1))).not.toContainEqual(bigArrival(pops));
    }
    expect(bigShown(20)).toBe(9);
    expect(bigArrival(BIG_FILL.length)).toBeNull();
    // The round ends before the board is ever full of nothing: the goal is reached while dots still stand.
    expect(BIG.goal).toBeLessThanOrEqual(BIG_FILL.length);
  });

  it('pops the standing dot nearest a touch anywhere, however far from it', () => {
    const one = [{ r: 1, c: 1 }];
    for (const [x, y] of [
      [1, 1],
      [-5, -5],
      [9, 0],
      [1.4, 3],
    ])
      expect(nearestCell(one, x, y)).toEqual({ r: 1, c: 1 });
    const three = BIG_FILL.slice(0, 3);
    expect(nearestCell(three, -2, 1)).toEqual({ r: 1, c: 0 });
    expect(nearestCell(three, 4, 0.5)).toEqual({ r: 1, c: 2 });
    expect(nearestCell([], 1, 1)).toBeNull();
    // Big mode demonstrates on a real place.
    const rng = new Rng(3);
    expect(demoMove(BIG, ensureMove(BIG, makeGrid(BIG, rng, [R, B]), rng))).toEqual([BIG_FILL[0]]);
  });
});

describe('level 10, Clear the garden', () => {
  const apply = (g: Garden, lines: { mask: number }[]) => lines.reduce((b, l) => gardenFall(b, l.mask), g);

  it('is school play at the top of its window; pre-K stops at 9', () => {
    expect(planFor(10)).toBe(GARDEN);
    expect(levelsInOrder(LEVELS.school!).at(-1)).toBe(10);
    expect(levelsInOrder(LEVELS.prek!)).not.toContain(10);
    expect(dotLink.describeLevel(10)).toMatch(/garden/i);
  });

  it('pops with gravity and no refill: the dots above fall and the gaps stay at the top', () => {
    const g = parseGarden('abca/bcab/cabc/abca');
    const mask = (1 << (3 * 4 + 1)) | (1 << (2 * 4 + 1)); // the two lowest dots of column 1
    const after = gardenFall(g, mask);
    expect(gardenLeft(after)).toBe(14);
    expect(after.map((row) => row[1])).toEqual([null, null, 1, 2]); // b fell two rows, c fell two rows
    expect(gardenFalls(g, mask)).toEqual([
      { from: 1, to: 3, c: 1 },
      { from: 0, to: 2, c: 1 },
    ]);
  });

  it('offers a tap on any dot, every same-color line, and a loop wherever a line can close on itself', () => {
    // A ring of a around a 2×2 of b: the ring closes a loop of twelve, and the middle is a square.
    const ring = parseGarden('aaaa/abba/abba/aaaa');
    const lines = gardenLines(ring);
    expect(lines.filter((l) => popcount(l.mask) === 1)).toHaveLength(16);
    const loops = lines.filter((l) => l.loop);
    expect(loops.map((l) => popcount(l.mask)).sort((x, y) => x - y)).toEqual([4, 12]);
    for (const l of loops) {
      // A loop's path ends back on one of its own dots, at least four dots in, as `step` closes it.
      const back = l.path.at(-1)!;
      expect(l.path.slice(0, -2).some((c) => c.r === back.r && c.c === back.c)).toBe(true);
      expect(l.path.length - 1).toBeGreaterThanOrEqual(4);
    }
    expect(solveGarden(ring).lines).toBe(2);
    // Each line is a real drag: neighbors of one color, no dot twice before a loop closes.
    for (const l of lines) {
      const body = l.loop ? l.path.slice(0, -1) : l.path;
      body.forEach((c, i) => {
        expect(ring[c.r][c.c]).toBe(ring[body[0].r][body[0].c]);
        if (i) expect(Math.abs(c.r - body[i - 1].r) + Math.abs(c.c - body[i - 1].c)).toBe(1);
      });
      expect(new Set(body.map((c) => `${c.r},${c.c}`)).size).toBe(body.length);
    }
  });

  it('every frozen board: three colors on a full 4×4, the stored fewest lines, and a plan beats the longest line', () => {
    expect(GARDENS.length).toBeGreaterThanOrEqual(24);
    expect(new Set(GARDENS.map((b) => b.board)).size).toBe(GARDENS.length);
    for (const { board, lines } of GARDENS) {
      const g = parseGarden(board);
      expect(g).toHaveLength(4);
      expect(g.every((row) => row.length === 4 && row.every((k) => k !== null))).toBe(true);
      expect(new Set(g.flat()).size).toBe(3);
      const s = solveGarden(g);
      expect(s.lines).toBe(lines);
      expect(lines).toBeGreaterThanOrEqual(4);
      expect(lines).toBeLessThanOrEqual(5);
      // Bounded so a hint is quick on a phone.
      expect(s.positions).toBeLessThanOrEqual(6000);
      // A player who always draws the line that pops the most needs at least two more.
      expect(greedyGarden(g)).toBeGreaterThanOrEqual(lines + 2);
    }
  });

  it("the solver's route clears the board, each line legal where it is drawn, and every hint starts a fewest route", () => {
    for (const { board, lines } of GARDENS.slice(0, 8)) {
      let g = parseGarden(board);
      const { route } = solveGarden(g);
      expect(route).toHaveLength(lines);
      for (let left = lines; left > 0; left--) {
        // The hint is the first line of a fewest route from here; after it, one line fewer is still the fewest.
        const hint = solveGarden(g).route[0];
        expect(gardenLines(g).some((l) => l.mask === hint.mask)).toBe(true);
        g = gardenFall(g, hint.mask);
        expect(solveGarden(g).lines).toBe(left - 1);
      }
      expect(gardenLeft(g)).toBe(0);
      expect(gardenLeft(apply(parseGarden(board), route))).toBe(0);
    }
  });

  it('never a failure: from any position reached by any lines, the board still clears', () => {
    const rng = new Rng(10);
    for (const { board } of GARDENS) {
      let g = parseGarden(board);
      while (gardenLeft(g)) {
        expect(solveGarden(g).lines).toBeGreaterThan(0);
        g = gardenFall(g, rng.pick(gardenLines(g)).mask);
      }
    }
  });
});
