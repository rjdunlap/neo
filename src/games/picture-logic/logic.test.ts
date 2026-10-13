import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BIG_15, EASY_10, HARD_10, SAILBOAT } from './pictures';
import {
  allLines, brushFor, cellsOf, clueOf, clueText, deductions, EMPTY, FILLED, fillCount, fromDrawn, hintFor, isSolved, knowledge, lineStatus, makePuzzles,
  paint, parsePicture, passesNeeded, planFor, PLANS, poolFor, solvableByLines, statuses, CROSSED, type Mark, type PicturePuzzle,
  axisOf, clueDepths, headStart, HOME_H, HOME_W, MIN_TOUCH, strokeCells, toolForHint, touchFrame, type Rect,
} from './logic';

const ALL = [...EASY_10, ...HARD_10, ...BIG_15];
const empty = (p: PicturePuzzle): Mark[] => p.solution.map(() => EMPTY);

describe('the picture bank', () => {
  it('has square pictures of 10 or 15 squares, in palette letters, each with a name said when it is finished', () => {
    for (const d of ALL) {
      expect([10, 15], d.name).toContain(d.rows.length);
      for (const r of d.rows) expect(r, d.name).toMatch(new RegExp(`^[.roygbpun]{${d.rows.length}}$`));
      expect(d.name).toMatch(/^an? /);
    }
    expect(new Set(ALL.map((d) => d.name)).size).toBe(ALL.length);
    expect(EASY_10).toHaveLength(5);
    expect(HARD_10).toHaveLength(5);
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
    const passes = (list: readonly { name: string; rows: readonly string[] }[]) => list.map((d) => passesNeeded(fromDrawn(d)));
    const avg = (n: number[]) => n.reduce((a, b) => a + b, 0) / n.length;
    expect(avg(passes(HARD_10))).toBeGreaterThan(avg(passes(EASY_10)));
    for (const d of ALL) expect(passesNeeded(fromDrawn(d)), d.name).toBeGreaterThanOrEqual(1);
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
        for (const f of deductions(known, p)) expect(f.fill, `${d.name} square ${f.cell}`).toBe(p.solution[f.cell]);
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

  it('names the line and its clue, and prefers a fill to a cross, then the square nearest the cursor', () => {
    const p = fromDrawn(SAILBOAT);
    const h = hintFor(empty(p), p, 0)!;
    expect(h.kind).toBe('fill');
    if (h.kind !== 'fix') {
      expect(cellsOf(p.size, h.line)).toContain(h.cell);
      expect(h.clue).toEqual(clueOf(p, h.line));
    }
    const near = hintFor(empty(p), p, 44)!, far = hintFor(empty(p), p, 5)!;
    expect(near.kind).toBe('fill');
    expect(far.kind).toBe('fill');
    expect(Math.abs(Math.floor(near.cell / 10) - 4) + Math.abs((near.cell % 10) - 4)).toBeLessThanOrEqual(Math.abs(Math.floor(far.cell / 10) - 4) + Math.abs((far.cell % 10) - 4));
  });

  it('points first at a mark that cannot be right: a filled square outside the picture, then a cross inside it', () => {
    const p = fromDrawn(SAILBOAT);
    const marks = empty(p);
    const outside = p.solution.indexOf(false), inside = p.solution.indexOf(true);
    marks[inside] = CROSSED;
    expect(hintFor(marks, p)).toEqual({ kind: 'fix', cell: inside, mark: CROSSED });
    marks[outside] = FILLED;
    expect(hintFor(marks, p)).toEqual({ kind: 'fix', cell: outside, mark: FILLED });
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
    expect(hintFor(p.solution.map((on): Mark => (on ? FILLED : EMPTY)), p)).toBeNull();
  });
});

describe('levels', () => {
  it('climbs from a 6 by 6 warm-up to a 15 by 15 picture, every level with pictures to choose from', () => {
    expect(PLANS.map((p) => p.size)).toEqual([6, 10, 10, 15]);
    PLANS.forEach((plan, i) => {
      expect(planFor(i + 1)).toBe(plan);
      const pool = poolFor(i + 1);
      expect(pool.length, plan.name).toBeGreaterThanOrEqual(3);
      for (const p of pool) {
        expect(p.size, plan.name).toBe(plan.size);
        expect(solvableByLines(p), `${plan.name}: ${p.name}`).toBe(true);
      }
    });
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });

  it('is fair: the same seed hides the same picture, and different seeds find different ones', () => {
    for (const level of [1, 2, 3, 4]) {
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
  const VIEWS = [[1024, 768], [1366, 768], [1024, 1365], [1024, 1100]] as const;
  const inside = (r: Rect, w: number, h: number) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w + 0.5 && r.y + r.h <= h + 0.5;
  const apart = (a: Rect, b: Rect) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;

  it('keeps every square and button at least 64 across, on screen, apart and clear of the home button, in every view', () => {
    for (const d of ALL) {
      const p = fromDrawn(d), { rowDepth, colDepth } = clueDepths(p);
      for (const [w, h] of VIEWS) {
        const f = touchFrame(w, h, p.size, rowDepth, colDepth), tag = `${d.name} ${w}x${h}`;
        expect(f.cell, tag).toBeGreaterThanOrEqual(MIN_TOUCH);
        expect(inside(f.paper, w, h), tag).toBe(true);
        expect(f.paper.x >= HOME_W || f.paper.y >= HOME_H, `${tag} clear of home`).toBe(true);
        // The pet sits in the bottom left corner (150 by 150): no button or tally goes there.
        for (const r of [...f.slots, f.info]) expect(r.x >= HOME_W || r.y + r.h <= h - 150, `${tag} clear of the pet`).toBe(true);
        for (const s of f.slots) {
          expect(s.w, `${tag} ${s.kind}`).toBeGreaterThanOrEqual(MIN_TOUCH);
          expect(s.h, `${tag} ${s.kind}`).toBeGreaterThanOrEqual(MIN_TOUCH);
          expect(inside(s, w, h), `${tag} ${s.kind}`).toBe(true);
          expect(apart(s, f.paper), `${tag} ${s.kind} clear of the paper`).toBe(true);
        }
        f.slots.forEach((a, i) => f.slots.slice(i + 1).forEach((b) => expect(apart(a, b), `${tag} ${a.kind}/${b.kind}`).toBe(true)));
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
    for (const d of [...EASY_10, ...BIG_15]) {
      const p = fromDrawn(d), { rowDepth, colDepth } = clueDepths(p);
      const f = touchFrame(1024, 768, p.size, rowDepth, colDepth);
      expect(f.maxX > 0 || f.maxY > 0, d.name).toBe(true);
      expect(f.slots.map((s) => s.kind), d.name).toContain('slide');
      // What slides can be brought wholly into view: the extents cover the picture.
      expect(f.maxX + f.grid.w, d.name).toBeGreaterThanOrEqual(p.size * f.cell);
      expect(f.maxY + f.grid.h, d.name).toBeGreaterThanOrEqual(p.size * f.cell);
    }
  });

  it('puts the whole picture in view where there is room for it', () => {
    const p = fromDrawn(SAILBOAT), { rowDepth, colDepth } = clueDepths(p);
    const f = touchFrame(1024, 1365, 10, rowDepth, colDepth);
    expect([f.maxX, f.maxY]).toEqual([0, 0]);
    expect(f.cell).toBeGreaterThanOrEqual(MIN_TOUCH);
  });

  it('runs a stroke along the row or column of its first movement, and paints every square between, even when the finger jumps', () => {
    const n = 10, start = 3 * n + 2;
    expect(axisOf(n, start, start)).toBeNull();
    expect(strokeCells(n, start, null, start)).toEqual([start]);
    expect(axisOf(n, start, 3 * n + 6)).toBe('row');
    expect(axisOf(n, start, 6 * n + 3)).toBe('column');
    // A diagonal-ish move picks the longer way.
    expect(axisOf(n, start, 4 * n + 6)).toBe('row');
    expect(axisOf(n, start, 7 * n + 3)).toBe('column');
    // A jump of four squares paints the four, in order, and stays on the start's row.
    expect(strokeCells(n, start, 'row', 4 * n + 6)).toEqual([3 * n + 2, 3 * n + 3, 3 * n + 4, 3 * n + 5, 3 * n + 6]);
    expect(strokeCells(n, start, 'row', 3 * n + 0)).toEqual([3 * n + 2, 3 * n + 1, 3 * n + 0]);
    expect(strokeCells(n, start, 'column', 6 * n + 2)).toEqual([3 * n + 2, 4 * n + 2, 5 * n + 2, 6 * n + 2]);
    expect(strokeCells(n, start, 'column', 0 * n + 5)).toEqual([3 * n + 2, 2 * n + 2, 1 * n + 2, 0 * n + 2]);
  });

  it('counts a fill once however often a stroke passes over it', () => {
    const p = fromDrawn(SAILBOAT), marks = empty(p);
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
    expect(toolForHint({ kind: 'fill', cell: 0, line: { kind: 'row', index: 0 }, clue: [1] })).toBe('fill');
    expect(toolForHint({ kind: 'cross', cell: 0, line: { kind: 'row', index: 0 }, clue: [1] })).toBe('cross');
    expect(toolForHint({ kind: 'fix', cell: 0, mark: FILLED })).toBe('fill');
    expect(toolForHint({ kind: 'fix', cell: 0, mark: CROSSED })).toBe('cross');
  });

  it('leaves the last rows of the picture to fill for the demonstration, never solving it or filling a wrong square', () => {
    for (const d of ALL) {
      const p = fromDrawn(d), start = headStart(p);
      expect(isSolved(start, p), d.name).toBe(false);
      expect(start.every((m, i) => m === EMPTY || p.solution[i]), d.name).toBe(true);
      expect(p.par - fillCount(start), d.name).toBeGreaterThan(0);
    }
    for (const p of poolFor(1)) expect(isSolved(headStart(p), p), p.name).toBe(false);
  });
});
