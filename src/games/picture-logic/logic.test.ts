import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BIG_15, EASY_10, HARD_10, SAILBOAT } from './pictures';
import {
  allLines, brushFor, cellsOf, clueOf, clueText, deductions, EMPTY, FILLED, fillCount, fromDrawn, hintFor, isSolved, knowledge, lineStatus, makePuzzles,
  paint, parsePicture, passesNeeded, planFor, PLANS, poolFor, solvableByLines, statuses, CROSSED, type Mark, type PicturePuzzle,
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
