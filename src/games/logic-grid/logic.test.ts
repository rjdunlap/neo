import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  answerOf, applyStep, brokenClue, contradicts, CROSSED, cycle, decides, EMPTY, emptyMarks, FILLED, fullWrong, holds, makeBoard, makeRound,
  nextStep, planFor, PLANS, shapeOf, shown, solutionMarks, solved, solutions, solveSteps, sq, wrongSquares, type Board, type Mark,
} from './logic';

const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7919 + 3);
const forBoards = (fn: (b: Board, seed: number) => void) => {
  for (const plan of PLANS) for (const seed of SEEDS) fn(makeBoard(plan, new Rng(seed)), seed);
};

describe('boards at every level', () => {
  for (const plan of PLANS) {
    it(`level ${plan.level}: one answer, true clues, rule-solvable, no spare clue`, () => {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        const s = shapeOf(b);
        expect(solutions(s, b.clues)).toEqual([b.solution]);
        expect(b.clues.every((c) => holds(c, b.solution))).toBe(true);
        expect(solveSteps(s, b.clues).done).toBe(true);
        b.clues.forEach((_, i) => expect(solveSteps(s, b.clues.filter((__, j) => j !== i)).done).toBe(false));
        expect(b.clues).toHaveLength(plan.clues);
        for (const c of b.clues) expect(plan.kinds).toContain(c.kind);
        for (const [k, n] of Object.entries(plan.each ?? {})) expect(b.clues.filter((c) => c.kind === k)).toHaveLength(n as number);
      }
    });
    it(`level ${plan.level}: cast, distinct friends and places, event names one friend`, () => {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        expect(b.friends).toHaveLength(plan.friends);
        expect(new Set(b.friends).size).toBe(plan.friends);
        for (const f of b.friends) expect(plan.cast).toContain(f);
        expect(new Set(b.solution).size).toBe(plan.friends);
        expect(b.solution).toContain(b.event);
        expect(b.solution.filter((p) => p === b.event)).toHaveLength(1);
        expect(answerOf(b)).toBeGreaterThanOrEqual(0);
        expect(b.solution[answerOf(b)]).toBe(b.event);
      }
    });
    it(`level ${plan.level}: makeRound gives the plan's boards, and the same seed the same round`, () => {
      for (const seed of SEEDS.slice(0, 40)) {
        const r = makeRound(plan, new Rng(seed));
        expect(r).toHaveLength(plan.boards);
        expect(makeRound(plan, new Rng(seed))).toEqual(r);
      }
    });
  }
  it('level 1 has only direct clues; level 2 has exactly one direct and one not', () => {
    expect(planFor(1).level).toBe(1);
    expect(planFor(2).level).toBe(2);
    for (const seed of SEEDS) {
      expect(makeBoard(planFor(1), new Rng(seed)).clues.every((c) => c.kind === 'direct')).toBe(true);
      const k = makeBoard(planFor(2), new Rng(seed)).clues.map((c) => c.kind).sort();
      expect(k).toEqual(['direct', 'not']);
    }
  });
});

describe('what a clue decides and contradicts', () => {
  it('decides: a direct clue is its yes plus its row and column; a not clue only its own no', () => {
    forBoards((b) => {
      const s = shapeOf(b);
      for (const c of b.clues) {
        const d = decides(s, c);
        const own = sq(s, c.friend, c.place);
        if (c.kind === 'not') {
          expect(d).toEqual([{ square: own, mark: CROSSED }]);
        } else {
          const want = new Map<number, Mark>();
          for (let i = 0; i < s.rows * s.cols; i++) {
            const r = Math.floor(i / s.cols), col = i % s.cols;
            if (i === own) want.set(i, FILLED);
            else if (r === c.friend || col === c.place) want.set(i, CROSSED);
          }
          expect(d).toHaveLength(want.size);
          for (const x of d) expect(want.get(x.square)).toBe(x.mark);
        }
      }
    });
  });

  it('contradicts: single-clue contradictions fire, never for EMPTY, never against the clue itself', () => {
    forBoards((b) => {
      const s = shapeOf(b);
      const n = s.rows * s.cols;
      for (let i = 0; i < n; i++) expect(contradicts(b, i, EMPTY)).toEqual([]);
      b.clues.forEach((c, ci) => {
        const own = sq(s, c.friend, c.place);
        if (c.kind === 'not') {
          expect(contradicts(b, own, FILLED)).toContain(ci);
          expect(contradicts(b, own, CROSSED)).not.toContain(ci);
        } else {
          expect(contradicts(b, own, CROSSED)).toContain(ci);
          expect(contradicts(b, own, FILLED)).not.toContain(ci);
          for (const d of decides(s, c)) {
            if (d.square === own) continue;
            expect(contradicts(b, d.square, FILLED)).toContain(ci);
            expect(contradicts(b, d.square, CROSSED)).not.toContain(ci);
          }
        }
      });
    });
  });

  it('contradicts never flags the right marks', () => {
    forBoards((b) => {
      solutionMarks(b).forEach((m, i) => expect(contradicts(b, i, m)).toEqual([]));
    });
  });

  it('level 2: some wrong marks are caught only by chained deduction, and contradicts stays silent on them', () => {
    let found = 0;
    for (const seed of SEEDS) {
      const b = makeBoard(planFor(2), new Rng(seed));
      const want = solutionMarks(b);
      const quiet = want.flatMap((m, i) => {
        const wrongMark: Mark = m === FILLED ? CROSSED : FILLED;
        return contradicts(b, i, wrongMark).length === 0 ? [i] : [];
      });
      expect(quiet.length).toBeGreaterThan(0);
      found += quiet.length;
      for (const i of quiet) expect(wrongSquares(b, Object.assign(emptyMarks(shapeOf(b)), { [i]: want[i] === FILLED ? CROSSED : FILLED }))).toEqual([i]);
    }
    expect(found).toBeGreaterThan(0);
  });

  it('level 2 double-tap: cycling onto the not square flags the yes, and the settled cross is silent', () => {
    for (const seed of SEEDS) {
      const b = makeBoard(planFor(2), new Rng(seed));
      const s = shapeOf(b);
      const ni = b.clues.findIndex((c) => c.kind === 'not');
      const own = sq(s, b.clues[ni].friend, b.clues[ni].place);
      const first = cycle(EMPTY);
      expect(first).toBe(FILLED);
      expect(contradicts(b, own, first)).toEqual([ni]);
      const second = cycle(first);
      expect(second).toBe(CROSSED);
      expect(contradicts(b, own, second)).toEqual([]);
    }
  });
});

describe('marks on the grid', () => {
  it('cycle goes empty, yes, no, empty', () => {
    expect(cycle(EMPTY)).toBe(FILLED);
    expect(cycle(FILLED)).toBe(CROSSED);
    expect(cycle(CROSSED)).toBe(EMPTY);
  });

  it('shown: auto crosses on a yes row and column, lift with it, never override her marks', () => {
    const s = { rows: 2, cols: 3 };
    for (let y = 0; y < 6; y++) {
      const marks = emptyMarks(s);
      marks[y] = FILLED;
      const v = shown(s, marks);
      v.forEach((x, i) => {
        if (i === y) return expect(x).toEqual({ mark: FILLED, auto: false });
        const share = Math.floor(i / 3) === Math.floor(y / 3) || i % 3 === y % 3;
        expect(x).toEqual(share ? { mark: CROSSED, auto: true } : { mark: EMPTY, auto: false });
      });
      marks[y] = EMPTY;
      expect(shown(s, marks).every((x) => x.mark === EMPTY && !x.auto)).toBe(true);
      // her own marks in the way stay hers
      const other = (y + 1) % 3 + Math.floor(y / 3) * 3;
      const m2 = emptyMarks(s);
      m2[y] = FILLED;
      m2[other] = FILLED;
      expect(shown(s, m2)[other]).toEqual({ mark: FILLED, auto: false });
      const m3 = emptyMarks(s);
      m3[y] = FILLED;
      m3[other] = CROSSED;
      expect(shown(s, m3)[other]).toEqual({ mark: CROSSED, auto: false });
    }
  });
});

describe('solved, wrong grids and broken clues', () => {
  it('solved only on exactly the answer yeses', () => {
    forBoards((b) => {
      const marks = solutionMarks(b);
      expect(solved(b, marks)).toBe(true);
      expect(fullWrong(b, marks)).toBe(false);
      expect(solved(b, emptyMarks(shapeOf(b)))).toBe(false);
    });
  });

  it('every full wrong grid is fullWrong; brokenClue names a false clue, or -1 only when friends share a place', () => {
    for (const plan of PLANS) {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        const s = shapeOf(b);
        const rng = new Rng(seed + 1);
        for (let t = 0; t < 10; t++) {
          const a = b.friends.map(() => rng.int(0, s.cols - 1));
          const marks = emptyMarks(s);
          a.forEach((p, f) => (marks[sq(s, f, p)] = FILLED));
          const isAnswer = a.every((p, f) => p === b.solution[f]);
          expect(solved(b, marks)).toBe(isAnswer);
          expect(fullWrong(b, marks)).toBe(!isAnswer);
          if (isAnswer) continue;
          const k = brokenClue(b, marks);
          if (k >= 0) expect(holds(b.clues[k], a)).toBe(false);
          else expect(new Set(a).size).toBeLessThan(a.length);
        }
      }
    }
  });

  it('a partial grid is not fullWrong', () => {
    forBoards((b) => {
      const s = shapeOf(b);
      const marks = emptyMarks(s);
      marks[sq(s, 0, (b.solution[0] + 1) % s.cols)] = FILLED;
      expect(fullWrong(b, marks)).toBe(false);
    });
  });
});

describe('help', () => {
  const scramble = (b: Board, rng: Rng): Mark[] => {
    const marks = emptyMarks(shapeOf(b));
    const want = solutionMarks(b);
    const fill = rng.next();
    return marks.map((_, i) => {
      if (rng.next() > fill) return EMPTY;
      return rng.next() < 0.5 ? want[i] : ([EMPTY, FILLED, CROSSED] as Mark[])[rng.int(0, 2)];
    });
  };

  it('from empty and from seeded mixes with wrong marks, repeated steps solve it, each step agreeing with the answer', () => {
    for (const plan of PLANS) {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        const s = shapeOf(b);
        const rng = new Rng(seed + 5);
        const want = solutionMarks(b);
        for (const start of [emptyMarks(s), scramble(b, rng), scramble(b, rng)]) {
          let marks: Mark[] = start;
          let n = 0;
          while (!solved(b, marks)) {
            const st = nextStep(b, marks);
            expect(st).not.toBeNull();
            if (!st) break;
            expect(st.mark).toBe(want[st.square]);
            if (st.why === 'clue') {
              expect(st.clues).toHaveLength(1);
              const d = decides(s, b.clues[st.clues[0]]);
              expect(d.some((x) => x.square === st.square && x.mark === st.mark)).toBe(true);
            }
            marks = applyStep(b, marks, st);
            expect(++n).toBeLessThanOrEqual(s.rows * s.cols);
          }
          expect(solved(b, marks)).toBe(true);
          expect(nextStep(b, marks)).toBeNull();
        }
      }
    }
  });

  it('applyStep clears wrong marks and keeps right ones', () => {
    for (const seed of SEEDS) {
      const b = makeBoard(planFor(2), new Rng(seed));
      const marks = scramble(b, new Rng(seed + 9));
      const st = nextStep(b, marks);
      if (!st) continue;
      const out = applyStep(b, marks, st);
      expect(wrongSquares(b, out)).toEqual([]);
      expect(out[st.square]).toBe(st.mark);
    }
  });
});
