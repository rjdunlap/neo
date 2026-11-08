import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BIG_15, EASY_10, EASY_PASSES, HARD_10, HARD_15, SAILBOAT, TWO_COLOUR_10 } from './pictures';
import {
  allLines,
  brushFor,
  cellsOf,
  whyFor,
  clueOf,
  clueText,
  deductions,
  EMPTY,
  FILLED,
  fillCount,
  fromDrawn,
  hintFor,
  isSolved,
  knowledge,
  lineStatus,
  makePuzzles,
  ENTRY_LEVELS,
  ORDER,
  paint,
  parsePicture,
  passesNeeded,
  planFor,
  PLANS,
  poolFor,
  solvableByLines,
  statuses,
  CROSSED,
  type Mark,
  type PicturePuzzle,
  axisOf,
  clueDepths,
  headStart,
  HOME_H,
  HOME_W,
  MIN_TOUCH,
  strokeCells,
  toolForHint,
  touchFrame,
  type Rect,
  FILLED_2,
  isFill,
  colorDeductions,
  colorKnowledge,
  fillFor,
  inksOf,
  potFor,
  statusOf,
  type Hint,
  type Line,
} from './logic';

const ALL = [...EASY_10, ...HARD_10, ...BIG_15, ...HARD_15];
const empty = (p: PicturePuzzle): Mark[] => p.solution.map(() => EMPTY);

describe('the picture bank', () => {
  it('has square pictures of 10 or 15 squares, in palette letters, each with a name said when it is finished', () => {
    for (const d of ALL) {
      expect([10, 15], d.name).toContain(d.rows.length);
      for (const r of d.rows) expect(r, d.name).toMatch(new RegExp(`^[.roygbpun]{${d.rows.length}}$`));
      expect(d.name).toMatch(/^an? /);
    }
    expect(new Set(ALL.map((d) => d.name)).size).toBe(ALL.length);
    expect(EASY_10).toHaveLength(8);
    expect(HARD_10).toHaveLength(8);
    expect(BIG_15).toHaveLength(5);
    expect(HARD_15).toHaveLength(5);
    expect(new Set(ALL.map((d) => d.rows.join('/'))).size).toBe(ALL.length);
  });

  it('can every one be solved by line logic alone, and is it more than a scatter of squares', () => {
    for (const d of ALL) {
      const p = fromDrawn(d);
      expect(solvableByLines(p), d.name).toBe(true);
      expect(p.par, d.name).toBe(p.solution.filter(Boolean).length);
      expect(p.par / (p.size * p.size), d.name).toBeGreaterThan(0.2);
      expect(p.par / (p.size * p.size), d.name).toBeLessThan(0.8);
    }
  });

  it('reads the clues from the drawing', () => {
    const p = fromDrawn(SAILBOAT);
    expect(p.size).toBe(10);
    expect(p.rowClues[0]).toEqual([1]);
    expect(p.rowClues[4]).toEqual([8]);
    expect(p.rowClues[9]).toEqual([0]);
    expect(p.colClues[4]).toEqual([9]);
    expect(p.colClues[1]).toEqual([1, 1, 1]);
    expect(clueText([3, 1, 4])).toBe('3, 1, 4');
    expect(clueText([0])).toBe('nothing');
    expect(() => parsePicture('x', ['..', '...'])).toThrow();
  });

  it('asks for more care on the harder pictures, and the big ones are bigger', () => {
    const passes = (list: readonly { name: string; rows: readonly string[] }[]) =>
      list.map((d) => passesNeeded(fromDrawn(d)));
    const avg = (n: number[]) => n.reduce((a, b) => a + b, 0) / n.length;
    expect(avg(passes(HARD_10))).toBeGreaterThan(avg(passes(EASY_10)));
    // Not only on average: every easier picture needs fewer passes than every harder one.
    for (const d of EASY_10) expect(passesNeeded(fromDrawn(d)), d.name).toBeLessThanOrEqual(EASY_PASSES);
    for (const d of HARD_10) expect(passesNeeded(fromDrawn(d)), d.name).toBeGreaterThan(EASY_PASSES);
    for (const d of ALL) expect(passesNeeded(fromDrawn(d)), d.name).toBeGreaterThanOrEqual(1);
    // Level 7's 15 by 15 pictures need more care than every one of level 4's.
    const bigMost = Math.max(...passes(BIG_15));
    for (const d of HARD_15) {
      expect(d.rows.length, d.name).toBe(15);
      expect(passesNeeded(fromDrawn(d)), d.name).toBeGreaterThan(bigMost);
    }
  });
});

describe('lines', () => {
  it('names the squares of a row and a column', () => {
    expect(cellsOf(4, { kind: 'row', index: 1 })).toEqual([4, 5, 6, 7]);
    expect(cellsOf(4, { kind: 'column', index: 2 })).toEqual([2, 6, 10, 14]);
    expect(allLines(3)).toHaveLength(6);
  });

  it('stands done, over or open from the marks and the clue alone', () => {
    const [E, F, X] = [EMPTY, FILLED, CROSSED] as const;
    expect(lineStatus([E, E, E, E, E], [2, 1])).toBe('open');
    expect(lineStatus([F, F, E, F, E], [2, 1])).toBe('done');
    expect(lineStatus([E, F, F, E, F], [2, 1])).toBe('done');
    // Too many filled, a run too long, a run in the wrong order of lengths, and a cross where the clue has to fill.
    expect(lineStatus([F, F, F, E, F], [2, 1])).toBe('over');
    expect(lineStatus([F, F, F, F, E], [2, 1])).toBe('over');
    expect(lineStatus([F, E, F, F, E], [2, 1])).toBe('over');
    expect(lineStatus([X, X, X, F, F], [5])).toBe('over');
    // One square filled is only a start, and a run that still has room is open.
    expect(lineStatus([E, E, F, E, E], [2, 1])).toBe('open');
    expect(lineStatus([X, E, E, E, E], [2, 1])).toBe('open');
    expect(lineStatus([E, E, E, E, E], [0])).toBe('done');
    expect(lineStatus([F, E, E, E, E], [0])).toBe('over');
  });

  it('knows a picture is finished only when exactly its squares are filled, whatever is crossed', () => {
    const p = fromDrawn(SAILBOAT);
    const marks = p.solution.map((on): Mark => (on ? FILLED : EMPTY));
    expect(isSolved(marks, p)).toBe(true);
    expect(statuses(marks, p).every((s) => s === 'done')).toBe(true);
    const crossed = marks.map((m): Mark => (m === EMPTY ? CROSSED : m));
    expect(isSolved(crossed, p)).toBe(true);
    const missing = marks.slice();
    missing[marks.indexOf(FILLED)] = EMPTY;
    expect(isSolved(missing, p)).toBe(false);
    const extra = marks.slice();
    extra[marks.indexOf(EMPTY)] = FILLED;
    expect(isSolved(extra, p)).toBe(false);
    expect(fillCount(marks)).toBe(p.par);
  });
});

describe('painting', () => {
  it('lets the first square decide the brush, and only a fill ever counts', () => {
    expect(brushFor('fill', EMPTY)).toBe('fill');
    expect(brushFor('fill', CROSSED)).toBe('fill');
    expect(brushFor('fill', FILLED)).toBe('empty');
    expect(brushFor('cross', EMPTY)).toBe('cross');
    expect(brushFor('cross', FILLED)).toBe('cross');
    expect(brushFor('cross', CROSSED)).toBe('lift');
    expect(paint(EMPTY, 'fill')).toEqual({ mark: FILLED, changed: true, counted: true });
    expect(paint(CROSSED, 'fill')).toEqual({ mark: FILLED, changed: true, counted: true });
    expect(paint(FILLED, 'fill')).toEqual({ mark: FILLED, changed: false, counted: false });
    expect(paint(FILLED, 'empty')).toEqual({ mark: EMPTY, changed: true, counted: false });
    expect(paint(CROSSED, 'empty')).toEqual({ mark: CROSSED, changed: false, counted: false });
    expect(paint(EMPTY, 'cross')).toEqual({ mark: CROSSED, changed: true, counted: false });
    expect(paint(FILLED, 'cross')).toEqual({ mark: FILLED, changed: false, counted: false });
    expect(paint(CROSSED, 'lift')).toEqual({ mark: EMPTY, changed: true, counted: false });
    expect(paint(FILLED, 'lift')).toEqual({ mark: FILLED, changed: false, counted: false });
  });
});

describe('line logic and hints', () => {
  it('only decides squares that are right: every deduction matches the picture, from many partly-solved states', () => {
    const rng = new Rng(11);
    for (const d of ALL) {
      const p = fromDrawn(d);
      for (let t = 0; t < 6; t++) {
        const known: (boolean | null)[] = p.solution.map((on) => (rng.chance(0.25 * t) ? on : null));
        for (const f of deductions(known, p))
          expect(f.fill, `${d.name} square ${f.cell}`).toBe(p.solution[f.cell]);
      }
    }
  });

  it('leads a player who follows every hint from an empty grid to the finished picture, with exactly the fewest fills', () => {
    for (const d of ALL) {
      const p = fromDrawn(d);
      const marks = empty(p);
      let fills = 0;
      for (let guard = 0; guard < p.size * p.size * 2 && !isSolved(marks, p); guard++) {
        const hint = hintFor(marks, p, guard % (p.size * p.size));
        expect(hint, d.name).not.toBeNull();
        expect(hint!.kind, d.name).not.toBe('fix');
        expect(marks[hint!.cell], d.name).toBe(EMPTY);
        marks[hint!.cell] = hint!.kind === 'fill' ? FILLED : CROSSED;
        if (hint!.kind === 'fill') fills++;
        expect(p.solution[hint!.cell], d.name).toBe(hint!.kind === 'fill');
      }
      expect(isSolved(marks, p), d.name).toBe(true);
      expect(fills, d.name).toBe(p.par);
    }
  });

  it('says why a line decides its square, and the reason it names really holds on that line', () => {
    const rng = new Rng(23);
    const seen = new Set<string>();
    const check = (marks: Mark[], p: PicturePuzzle, near: number) => {
      const h = hintFor(marks, p, near);
      if (!h || h.kind === 'fix') return h;
      seen.add(h.why.kind);
      const cells = cellsOf(p.size, h.line),
        clue = clueOf(p, h.line),
        line = cells.map((c) => marks[c]);
      const sum = clue.reduce((a, b) => a + b, 0) + clue.length - 1;
      if (h.why.kind === 'done') {
        expect(h.kind, p.name).toBe('cross');
        expect(lineStatus(line, clue), p.name).toBe('done');
      }
      if (h.why.kind === 'full') expect(sum, p.name).toBe(p.size);
      if (h.why.kind === 'overlap') {
        expect(h.kind, p.name).toBe('fill');
        expect(
          line.every((m) => m === EMPTY),
          p.name,
        ).toBe(true);
        expect(clue, p.name).toContain(h.why.run);
        // More than half of the room it slides in, and the room is the run plus the line's spare squares.
        expect(h.why.run * 2, p.name).toBeGreaterThan(h.why.room);
        expect(h.why.room - h.why.run, p.name).toBe(p.size - sum);
      }
      return h;
    };
    for (const d of ALL) {
      const p = fromDrawn(d);
      // Partly-solved grids with only right marks.
      for (let t = 0; t < 8; t++) {
        const marks: Mark[] = p.solution.map((on): Mark =>
          rng.chance(0.1 * t) ? (on ? FILLED : CROSSED) : EMPTY,
        );
        if (!isSolved(marks, p)) check(marks, p, rng.int(0, p.size * p.size - 1));
      }
      // On an empty grid every fill a line decides is a full line or a long run's overlap: nothing else is known yet.
      const first = hintFor(empty(p), p, 0);
      expect(first && first.kind === 'fill' && ['full', 'overlap'].includes(first.why.kind), d.name).toBe(
        true,
      );
      // And every hint on the way from an empty grid to the picture.
      const marks = empty(p);
      for (let guard = 0; guard < p.size * p.size * 2 && !isSolved(marks, p); guard++) {
        const h = check(marks, p, (guard * 7) % (p.size * p.size));
        if (!h || h.kind === 'fix') break;
        marks[h.cell] = h.kind === 'fill' ? FILLED : CROSSED;
      }
      expect(isSolved(marks, p), d.name).toBe(true);
    }
    expect([...seen].sort()).toEqual(['done', 'fits', 'full', 'overlap']);
  });

  it('works out each reason from the line alone', () => {
    const blank = (n: number) => Array<boolean | null>(n).fill(null);
    expect(whyFor(blank(10), [7], 4, true)).toEqual({ kind: 'overlap', run: 7, room: 10 });
    expect(whyFor(blank(10), [7], 2, true)).toEqual({ kind: 'fits' });
    expect(whyFor(blank(10), [4, 5], 3, false)).toEqual({ kind: 'full' });
    expect(whyFor(blank(10), [4, 4], 7, true)).toEqual({ kind: 'overlap', run: 4, room: 5 });
    expect(whyFor(blank(10), [0], 3, false)).toEqual({ kind: 'done' });
    const line = blank(10);
    line[2] = line[3] = true;
    expect(whyFor(line, [2], 6, false)).toEqual({ kind: 'done' });
    expect(whyFor(line, [4], 4, true)).toEqual({ kind: 'fits' });
  });

  it('names the line and its clue, and prefers a fill to a cross, then the square nearest the cursor', () => {
    const p = fromDrawn(SAILBOAT);
    const h = hintFor(empty(p), p, 0)!;
    expect(h.kind).toBe('fill');
    if (h.kind !== 'fix') {
      expect(cellsOf(p.size, h.line)).toContain(h.cell);
      expect(h.clue).toEqual(clueOf(p, h.line));
    }
    const near = hintFor(empty(p), p, 44)!,
      far = hintFor(empty(p), p, 5)!;
    expect(near.kind).toBe('fill');
    expect(far.kind).toBe('fill');
    expect(Math.abs(Math.floor(near.cell / 10) - 4) + Math.abs((near.cell % 10) - 4)).toBeLessThanOrEqual(
      Math.abs(Math.floor(far.cell / 10) - 4) + Math.abs((far.cell % 10) - 4),
    );
  });

  it('points first at a mark that cannot be right: a filled square outside the picture, then a cross inside it', () => {
    const p = fromDrawn(SAILBOAT);
    const marks = empty(p);
    const outside = p.solution.indexOf(false),
      inside = p.solution.indexOf(true);
    marks[inside] = CROSSED;
    expect(hintFor(marks, p)).toEqual({ kind: 'fix', cell: inside, mark: CROSSED, want: FILLED });
    marks[outside] = FILLED;
    expect(hintFor(marks, p)).toEqual({ kind: 'fix', cell: outside, mark: FILLED, want: EMPTY });
    // A hint from a state with only right marks never doubts them.
    const right = empty(p);
    right[inside] = FILLED;
    right[outside] = CROSSED;
    expect(hintFor(right, p)!.kind).not.toBe('fix');
    expect(knowledge(right)[inside]).toBe(true);
    expect(knowledge(right)[outside]).toBe(false);
  });

  it('has nothing to say about a finished picture', () => {
    const p = fromDrawn(SAILBOAT);
    expect(
      hintFor(
        p.solution.map((on): Mark => (on ? FILLED : EMPTY)),
        p,
      ),
    ).toBeNull();
  });
});

describe('levels', () => {
  it('climbs from a 5 by 5 way in through a 6 by 6 warm-up to two 15 by 15 steps, every level with pictures to choose from', () => {
    expect(ORDER).toEqual([5, 1, 2, 3, 6, 4, 7]);
    expect(ENTRY_LEVELS).toEqual([5]);
    expect(ORDER.map((l) => planFor(l).size)).toEqual([5, 6, 10, 10, 10, 15, 15]);
    for (const level of ORDER) {
      const plan = planFor(level),
        pool = poolFor(level);
      expect(plan).toBe(PLANS[level]);
      expect(pool.length, plan.name).toBeGreaterThanOrEqual(3);
      for (const p of pool) {
        expect(p.size, plan.name).toBe(plan.size);
        expect(solvableByLines(p), `${plan.name}: ${p.name}`).toBe(true);
      }
    }
    // The two 15 by 15 levels draw from different banks, and so do the two 10 by 10 ones.
    expect(poolFor(7).map((p) => p.name)).toEqual(HARD_15.map((d) => d.name));
    expect(poolFor(4).map((p) => p.name)).toEqual(BIG_15.map((d) => d.name));
    expect(planFor(0)).toBe(PLANS[1]);
    expect(planFor(99)).toBe(PLANS[7]);
  });

  it('opens on a 5 by 5 picture a first pass can start: every one needs at most 3 passes and has a line decided from empty', () => {
    const pool = poolFor(5);
    expect(pool.length).toBeGreaterThanOrEqual(4);
    for (const p of pool) {
      expect(p.size, p.name).toBe(5);
      expect(passesNeeded(p), p.name).toBeLessThanOrEqual(3);
      expect(
        deductions(
          p.solution.map(() => null),
          p,
        ).length,
        p.name,
      ).toBeGreaterThan(0);
      // The first hint on an empty grid names its reason.
      const h = hintFor(empty(p), p);
      expect(h && h.kind !== 'fix' ? h.why : null, p.name).toBeTruthy();
    }
  });

  it('is fair: the same seed hides the same picture, and different seeds find different ones', () => {
    for (const level of ORDER) {
      expect(makePuzzles(level, new Rng(5))).toEqual(makePuzzles(level, new Rng(5)));
      const seen = new Set<string>();
      for (let s = 1; s <= 40; s++) for (const p of makePuzzles(level, new Rng(s))) seen.add(p.name);
      expect(seen.size, `level ${level}`).toBeGreaterThanOrEqual(3);
      expect(makePuzzles(level, new Rng(1))).toHaveLength(planFor(level).pictures);
    }
  });
});

describe('touch', () => {
  /** A tablet sideways, a wide screen, a tablet upright and a roomier upright one, in logical units. */
  const VIEWS = [
    [1024, 768],
    [1366, 768],
    [1024, 1365],
    [1024, 1100],
  ] as const;
  const inside = (r: Rect, w: number, h: number) =>
    r.x >= 0 && r.y >= 0 && r.x + r.w <= w + 0.5 && r.y + r.h <= h + 0.5;
  const apart = (a: Rect, b: Rect) =>
    a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;

  it('keeps every square and button at least 64 across, on screen, apart and clear of the home button, in every view', () => {
    for (const d of ALL) {
      const p = fromDrawn(d),
        { rowDepth, colDepth } = clueDepths(p);
      for (const [w, h] of VIEWS) {
        const f = touchFrame(w, h, p.size, rowDepth, colDepth),
          tag = `${d.name} ${w}x${h}`;
        expect(f.cell, tag).toBeGreaterThanOrEqual(MIN_TOUCH);
        expect(inside(f.paper, w, h), tag).toBe(true);
        expect(f.paper.x >= HOME_W || f.paper.y >= HOME_H, `${tag} clear of home`).toBe(true);
        // The pet sits in the bottom left corner (150 by 150): no button or tally goes there.
        for (const r of [...f.slots, f.info])
          expect(r.x >= HOME_W || r.y + r.h <= h - 150, `${tag} clear of the pet`).toBe(true);
        for (const s of f.slots) {
          expect(s.w, `${tag} ${s.kind}`).toBeGreaterThanOrEqual(MIN_TOUCH);
          expect(s.h, `${tag} ${s.kind}`).toBeGreaterThanOrEqual(MIN_TOUCH);
          expect(inside(s, w, h), `${tag} ${s.kind}`).toBe(true);
          expect(apart(s, f.paper), `${tag} ${s.kind} clear of the paper`).toBe(true);
        }
        f.slots.forEach((a, i) =>
          f.slots.slice(i + 1).forEach((b) => expect(apart(a, b), `${tag} ${a.kind}/${b.kind}`).toBe(true)),
        );
        expect(apart(f.info, f.paper), tag).toBe(true);
        f.slots.forEach((s) => expect(apart(f.info, s), `${tag} tally clear of ${s.kind}`).toBe(true));
      }
    }
  });

  it('shows a 6 by 6 picture whole in every view, and slides one that does not fit, offering Slide only then', () => {
    for (const p of poolFor(1)) {
      const { rowDepth, colDepth } = clueDepths(p);
      for (const [w, h] of VIEWS) {
        const f = touchFrame(w, h, 6, rowDepth, colDepth);
        expect([f.maxX, f.maxY], `${p.name} ${w}x${h}`).toEqual([0, 0]);
        expect(f.slots.map((s) => s.kind)).toEqual(['fill', 'cross', 'hint', 'again']);
      }
    }
    for (const d of [...EASY_10, ...BIG_15, ...HARD_15]) {
      const p = fromDrawn(d),
        { rowDepth, colDepth } = clueDepths(p);
      const f = touchFrame(1024, 768, p.size, rowDepth, colDepth);
      expect(f.maxX > 0 || f.maxY > 0, d.name).toBe(true);
      expect(
        f.slots.map((s) => s.kind),
        d.name,
      ).toContain('slide');
      // What slides can be brought wholly into view: the extents cover the picture.
      expect(f.maxX + f.grid.w, d.name).toBeGreaterThanOrEqual(p.size * f.cell);
      expect(f.maxY + f.grid.h, d.name).toBeGreaterThanOrEqual(p.size * f.cell);
    }
  });

  it('shows a 5 by 5 picture whole at the biggest squares in every view, never smaller than the 6 by 6 warm-up, with no Slide', () => {
    const six = poolFor(1).map(clueDepths);
    for (const p of poolFor(5)) {
      const { rowDepth, colDepth } = clueDepths(p);
      for (const [w, h] of VIEWS) {
        const f = touchFrame(w, h, 5, rowDepth, colDepth),
          tag = `${p.name} ${w}x${h}`;
        expect([f.maxX, f.maxY], tag).toEqual([0, 0]);
        expect(f.cell, tag).toBe(96);
        expect(
          f.slots.map((s) => s.kind),
          tag,
        ).toEqual(['fill', 'cross', 'hint', 'again']);
        for (const d of six)
          expect(f.cell, tag).toBeGreaterThanOrEqual(touchFrame(w, h, 6, d.rowDepth, d.colDepth).cell);
      }
      // Wide, where the 6 by 6 squares shrink to fit, the 5 by 5 ones are bigger.
      expect(touchFrame(1024, 768, 5, rowDepth, colDepth).cell, p.name).toBeGreaterThan(
        touchFrame(1024, 768, 6, 3, 3).cell,
      );
    }
  });

  it('puts the whole picture in view where there is room for it', () => {
    const p = fromDrawn(SAILBOAT),
      { rowDepth, colDepth } = clueDepths(p);
    const f = touchFrame(1024, 1365, 10, rowDepth, colDepth);
    expect([f.maxX, f.maxY]).toEqual([0, 0]);
    expect(f.cell).toBeGreaterThanOrEqual(MIN_TOUCH);
  });

  it('runs a stroke along the row or column of its first movement, and paints every square between, even when the finger jumps', () => {
    const n = 10,
      start = 3 * n + 2;
    expect(axisOf(n, start, start)).toBeNull();
    expect(strokeCells(n, start, null, start)).toEqual([start]);
    expect(axisOf(n, start, 3 * n + 6)).toBe('row');
    expect(axisOf(n, start, 6 * n + 3)).toBe('column');
    // A diagonal-ish move picks the longer way.
    expect(axisOf(n, start, 4 * n + 6)).toBe('row');
    expect(axisOf(n, start, 7 * n + 3)).toBe('column');
    // A jump of four squares paints the four, in order, and stays on the start's row.
    expect(strokeCells(n, start, 'row', 4 * n + 6)).toEqual([
      3 * n + 2,
      3 * n + 3,
      3 * n + 4,
      3 * n + 5,
      3 * n + 6,
    ]);
    expect(strokeCells(n, start, 'row', 3 * n + 0)).toEqual([3 * n + 2, 3 * n + 1, 3 * n + 0]);
    expect(strokeCells(n, start, 'column', 6 * n + 2)).toEqual([3 * n + 2, 4 * n + 2, 5 * n + 2, 6 * n + 2]);
    expect(strokeCells(n, start, 'column', 0 * n + 5)).toEqual([3 * n + 2, 2 * n + 2, 1 * n + 2, 0 * n + 2]);
  });

  it('counts a fill once however often a stroke passes over it', () => {
    const p = fromDrawn(SAILBOAT),
      marks = empty(p);
    let counted = 0;
    const brush = brushFor('fill', marks[0]);
    for (const at of [3, 5, 7, 9, 9, 6]) {
      for (const i of strokeCells(p.size, 0, 'row', at)) {
        const out = paint(marks[i], brush);
        if (out.changed) marks[i] = out.mark;
        if (out.counted) counted++;
      }
    }
    expect(counted).toBe(10);
    expect(fillCount(marks)).toBe(10);
  });

  it('switches to the tool a hint needs', () => {
    expect(
      toolForHint({
        kind: 'fill',
        cell: 0,
        line: { kind: 'row', index: 0 },
        clue: [1],
        why: { kind: 'fits' },
      }),
    ).toBe('fill');
    expect(
      toolForHint({
        kind: 'cross',
        cell: 0,
        line: { kind: 'row', index: 0 },
        clue: [1],
        why: { kind: 'fits' },
      }),
    ).toBe('cross');
    expect(toolForHint({ kind: 'fix', cell: 0, mark: FILLED, want: EMPTY })).toBe('fill');
    expect(toolForHint({ kind: 'fix', cell: 0, mark: CROSSED, want: FILLED })).toBe('cross');
  });

  it('leaves the last rows of the picture to fill for the demonstration, never solving it or filling a wrong square', () => {
    for (const d of ALL) {
      const p = fromDrawn(d),
        start = headStart(p);
      expect(isSolved(start, p), d.name).toBe(false);
      expect(
        start.every((m, i) => m === EMPTY || p.solution[i]),
        d.name,
      ).toBe(true);
      expect(p.par - fillCount(start), d.name).toBeGreaterThan(0);
    }
    for (const p of [...poolFor(1), ...poolFor(5)]) expect(isSolved(headStart(p), p), p.name).toBe(false);
  });
});

describe('two colours (level 6)', () => {
  const pool = poolFor(6);
  const VIEWS = [
    [1024, 768],
    [1366, 768],
    [1024, 1365],
    [1024, 1100],
  ] as const;
  const inside = (r: Rect, w: number, h: number) =>
    r.x >= 0 && r.y >= 0 && r.x + r.w <= w + 0.5 && r.y + r.h <= h + 0.5;
  const apart = (a: Rect, b: Rect) =>
    a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
  const NAMES = { [FILLED]: 'blue', [FILLED_2]: 'orange' } as const;

  it('has 10 by 10 pictures in exactly two palette letters, blue first, solvable by colour logic, named apart from every other picture', () => {
    expect(pool).toHaveLength(TWO_COLOUR_10.length);
    expect(planFor(6).colors).toBe(true);
    const others = new Set(ALL.map((d) => d.name));
    const names = new Set<string>();
    for (const p of pool) {
      expect(p.size, p.name).toBe(10);
      expect(p.colors, p.name).toHaveLength(2);
      expect(p.colors![0], p.name).toBe('b');
      expect(new Set(p.rows.join('').replace(/\./g, '')), p.name).toEqual(new Set(p.colors));
      expect(solvableByLines(p), p.name).toBe(true);
      expect(others.has(p.name), p.name).toBe(false);
      names.add(p.name);
      p.target.forEach((t, i) => {
        const ch = p.rows[Math.floor(i / 10)][i % 10];
        expect(t, `${p.name} ${i}`).toBe(ch === '.' ? EMPTY : ch === p.colors![0] ? FILLED : FILLED_2);
      });
      expect(p.par, p.name).toBe(p.target.filter(isFill).length);
    }
    expect(names.size).toBe(pool.length);
    for (const seed of [1, 2, 3, 4, 5]) expect(makePuzzles(6, new Rng(seed))).toHaveLength(1);
    expect(makePuzzles(6, new Rng(9))[0].name).toBe(makePuzzles(6, new Rng(9))[0].name);
  });

  it('decides only squares rightly, from many partly-solved states', () => {
    for (const p of pool) {
      const rng = new Rng(77);
      for (let trial = 0; trial < 40; trial++) {
        const keep = rng.next() * 0.9;
        const marks: Mark[] = p.target.map((t) => (rng.next() < keep ? (t === EMPTY ? CROSSED : t) : EMPTY));
        const found = colorDeductions(colorKnowledge(marks, p), p);
        for (const d of found) {
          expect(marks[d.cell], p.name).toBe(EMPTY);
          if (d.fill) expect(d.color, `${p.name} ${d.cell}`).toBe(p.target[d.cell]);
          else expect(p.target[d.cell], `${p.name} ${d.cell}`).toBe(EMPTY);
        }
      }
    }
  });

  it('follows its hints from an empty grid to the finished picture in exactly par fills, never without a hint', () => {
    for (const p of pool) {
      const marks = empty(p);
      let counted = 0,
        near = 0,
        steps = 0;
      while (!isSolved(marks, p)) {
        const h = hintFor(marks, p, near);
        expect(h, `${p.name} step ${steps}`).not.toBeNull();
        if (!h || h.kind === 'fix') throw new Error(`${p.name}: unexpected ${h?.kind ?? 'null'}`);
        expect(marks[h.cell], p.name).toBe(EMPTY);
        if (h.kind === 'fill') {
          expect(h.color, p.name).toBe(p.target[h.cell]);
          expect(h.inks, p.name).toEqual(inksOf(p, h.line));
          const out = paint(marks[h.cell], 'fill', h.color);
          marks[h.cell] = out.mark;
          if (out.counted) counted++;
        } else {
          expect(p.target[h.cell], p.name).toBe(EMPTY);
          marks[h.cell] = paint(marks[h.cell], 'cross').mark;
        }
        near = h.cell;
        expect(++steps, p.name).toBeLessThan(400);
      }
      expect(counted, p.name).toBe(p.par);
      expect(fillCount(marks), p.name).toBe(p.par);
      expect(hintFor(marks, p)).toBeNull();
    }
  });

  it('names the reason a hint gives: full lines add up, done only on a cross', () => {
    const whys = new Set<string>();
    for (const p of pool) {
      const marks = empty(p);
      for (let i = 0; i < 400 && !isSolved(marks, p); i++) {
        const h = hintFor(marks, p, i * 7);
        if (!h || h.kind === 'fix') break;
        whys.add(h.why.kind);
        if (h.why.kind === 'full') {
          const gaps = h.inks!.slice(1).filter((ink, k) => ink === h.inks![k]).length;
          expect(h.clue.reduce((a, b) => a + b, 0) + gaps, p.name).toBe(p.size);
        }
        if (h.why.kind === 'done') expect(h.kind, p.name).toBe('cross');
        marks[h.cell] = h.kind === 'fill' ? h.color! : CROSSED;
      }
    }
    expect(whys.has('full') || whys.has('fits')).toBe(true);
  });

  it('hints a wrong colour first, with the right pot, and painting it recolours the square and counts', () => {
    for (const p of pool) {
      for (const want of [FILLED, FILLED_2] as const) {
        const cell = p.target.indexOf(want);
        const marks = empty(p);
        marks[cell] = want === FILLED ? FILLED_2 : FILLED;
        const h = hintFor(marks, p) as Extract<Hint, { kind: 'fix' }>;
        expect(h, p.name).toEqual({ kind: 'fix', cell, mark: marks[cell], want });
        expect(toolForHint(h), p.name).toBe(want === FILLED ? 'fill' : 'fill2');
        expect(toolForHint(h)).toBe(potFor(want));
        expect(fillFor(toolForHint(h))).toBe(want);
        const out = paint(marks[cell], 'fill', want);
        expect(out).toEqual({ mark: want, changed: true, counted: true });
      }
      // A fill outside the picture is wanted empty, and taken out with its own pot.
      const outside = p.target.indexOf(EMPTY);
      for (const ink of [FILLED, FILLED_2] as const) {
        const marks = empty(p);
        marks[outside] = ink;
        const h = hintFor(marks, p)!;
        expect(h, p.name).toEqual({ kind: 'fix', cell: outside, mark: ink, want: EMPTY });
        expect(toolForHint(h)).toBe(ink === FILLED ? 'fill' : 'fill2');
      }
    }
  });

  it('paints over the other colour, empties its own, and is solved only when every colour matches', () => {
    expect(brushFor('fill', FILLED, FILLED_2)).toBe('fill');
    expect(brushFor('fill', FILLED_2, FILLED_2)).toBe('empty');
    expect(brushFor('fill', EMPTY, FILLED_2)).toBe('fill');
    expect(brushFor('fill', FILLED, FILLED)).toBe('empty');
    expect(paint(FILLED, 'fill', FILLED_2)).toEqual({ mark: FILLED_2, changed: true, counted: true });
    expect(paint(FILLED_2, 'empty', FILLED_2)).toEqual({ mark: EMPTY, changed: true, counted: false });
    for (const p of pool) {
      const full = p.target.map((t): Mark => (t === EMPTY ? CROSSED : t));
      expect(isSolved(full, p), p.name).toBe(true);
      expect(isSolved([...p.target], p), p.name).toBe(true);
      const swapped = [...p.target],
        at = p.target.findIndex(isFill);
      swapped[at] = swapped[at] === FILLED ? FILLED_2 : FILLED;
      expect(isSolved(swapped, p), p.name).toBe(false);
      const allFilled = p.target.map((t): Mark => (t === FILLED_2 ? FILLED : FILLED));
      expect(isSolved(allFilled, p), p.name).toBe(false);
      const allOne = p.target.map((): Mark => FILLED);
      expect(isSolved(allOne, p), p.name).toBe(false);
    }
  });

  it('reads a line done when its coloured runs match, over on a wrong colour, and lets different colours touch', () => {
    let touching = 0,
      over = 0;
    for (const p of pool) {
      const lines: Line[] = allLines(p.size);
      for (const line of lines) {
        const cells = cellsOf(p.size, line);
        const own = cells.map((c) => p.target[c]);
        const marks = empty(p);
        cells.forEach((c) => (marks[c] = p.target[c]));
        expect(statusOf(marks, p, line), `${p.name} ${line.kind}${line.index}`).toBe('done');
        const adjacentMixed = own.some(
          (m, i) => i > 0 && isFill(m) && isFill(own[i - 1]) && m !== own[i - 1],
        );
        if (adjacentMixed) touching++;
        for (const c of cells) {
          if (!isFill(p.target[c])) continue;
          const bad = [...marks];
          bad[c] = p.target[c] === FILLED ? FILLED_2 : FILLED;
          const st = statusOf(bad, p, line);
          expect(st, `${p.name} ${line.kind}${line.index}/${c}`).not.toBe('done');
          if (st === 'over') over++;
        }
      }
    }
    expect(touching).toBeGreaterThan(0);
    expect(over).toBeGreaterThan(0);
  });

  it('says each clue number with its colour', () => {
    expect(clueText([3, 2], [FILLED, FILLED_2], NAMES)).toBe('3 blue, 2 orange');
    expect(clueText([0], [FILLED], NAMES)).toBe('nothing');
    expect(clueText([3, 2])).toBe('3, 2');
    for (const p of pool)
      for (const line of allLines(p.size)) {
        const t = clueText(clueOf(p, line), inksOf(p, line), NAMES);
        expect(t === 'nothing' || /^\d+ (blue|orange)(, \d+ (blue|orange))*$/.test(t), `${p.name} ${t}`).toBe(
          true,
        );
      }
  });

  it('adds an orange pot beside the blue one, with every button and square big enough, apart and on screen', () => {
    for (const p of pool) {
      const { rowDepth, colDepth } = clueDepths(p);
      for (const [w, h] of VIEWS) {
        const f = touchFrame(w, h, p.size, rowDepth, colDepth, true),
          tag = `${p.name} ${w}x${h}`;
        expect(f.cell, tag).toBeGreaterThanOrEqual(MIN_TOUCH);
        expect(inside(f.paper, w, h), tag).toBe(true);
        expect(
          f.slots.filter((s) => s.kind === 'fill2'),
          tag,
        ).toHaveLength(1);
        expect(
          f.slots.filter((s) => s.kind === 'fill'),
          tag,
        ).toHaveLength(1);
        for (const r of [...f.slots, f.info])
          expect(r.x >= HOME_W || r.y + r.h <= h - 150, `${tag} clear of the pet`).toBe(true);
        for (const s of f.slots) {
          expect(s.w, `${tag} ${s.kind}`).toBeGreaterThanOrEqual(MIN_TOUCH);
          expect(s.h, `${tag} ${s.kind}`).toBeGreaterThanOrEqual(MIN_TOUCH);
          expect(inside(s, w, h), `${tag} ${s.kind}`).toBe(true);
          expect(apart(s, f.paper), `${tag} ${s.kind} clear of the paper`).toBe(true);
          expect(apart(s, f.info), `${tag} ${s.kind} clear of the tally`).toBe(true);
        }
        f.slots.forEach((a, i) =>
          f.slots.slice(i + 1).forEach((b) => expect(apart(a, b), `${tag} ${a.kind}/${b.kind}`).toBe(true)),
        );
        expect(
          touchFrame(w, h, p.size, rowDepth, colDepth).slots.some((s) => s.kind === 'fill2'),
          tag,
        ).toBe(false);
      }
    }
  });

  it('starts the demonstration with only right colour marks, never solved', () => {
    for (const p of pool) {
      const start = headStart(p);
      expect(isSolved(start, p), p.name).toBe(false);
      expect(
        start.every((m, i) => m === EMPTY || m === p.target[i]),
        p.name,
      ).toBe(true);
      expect(
        (start.some((m) => m === FILLED_2) && start.some((m) => m === FILLED)) || fillCount(start) > 0,
        p.name,
      ).toBe(true);
      expect(p.par - fillCount(start), p.name).toBeGreaterThan(0);
    }
  });
});
