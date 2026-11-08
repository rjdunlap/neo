import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  answerOf,
  applyStep,
  brokenClue,
  contradicts,
  CROSSED,
  cycle,
  decides,
  EMPTY,
  emptyMarks,
  FILLED,
  fullWrong,
  holds,
  makeBoard,
  makeRound,
  nextStep,
  HATS,
  hatted,
  ITEMS,
  SNACKS,
  onGrid,
  blockOf,
  rowOf,
  colOf,
  sizeOf,
  PLACES,
  planFor,
  PLANS,
  shapeOf,
  shown,
  solutionMarks,
  solved,
  solutions,
  solveSteps,
  sq,
  wrongSquares,
  type Board,
  type Mark,
  countSolutions,
  PLACES5,
  TIMES,
  type Clue,
} from './logic';

const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7919 + 3);
const OLD_PLANS = PLANS.filter((p) => !p.items);
/** Levels 1-4 (a single block); level 5 has its own block of tests below. */
const forBoards = (fn: (b: Board, seed: number) => void) => {
  for (const plan of OLD_PLANS) for (const seed of SEEDS) fn(makeBoard(plan, new Rng(seed)), seed);
};

describe('boards at every level', () => {
  for (const plan of PLANS) {
    it(`level ${plan.level}: one answer, true clues, rule-solvable, no spare clue`, () => {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        const s = shapeOf(b);
        expect(solutions(s, b.clues)).toEqual([[...b.solution, ...(b.having ?? [])]]);
        expect(b.clues.every((c) => holds(c, b.solution, b.having))).toBe(true);
        expect(solveSteps(s, b.clues).done).toBe(true);
        b.clues.forEach((_, i) =>
          expect(
            solveSteps(
              s,
              b.clues.filter((__, j) => j !== i),
            ).done,
          ).toBe(false),
        );
        expect(b.clues.length).toBeGreaterThanOrEqual(plan.clues);
        expect(b.clues.length).toBeLessThanOrEqual(plan.maxClues ?? plan.clues);
        for (const c of b.clues) expect(plan.kinds).toContain(c.kind);
        for (const [k, n] of Object.entries(plan.each ?? {}))
          expect(b.clues.filter((c) => c.kind === k)).toHaveLength(n as number);
      }
    });
    it(`level ${plan.level}: cast, distinct friends and places, event names one friend`, () => {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        expect(b.friends).toHaveLength(plan.friends);
        expect(new Set(b.friends).size).toBe(plan.friends);
        for (const f of b.friends) expect(plan.cast).toContain(f);
        expect(new Set(b.solution).size).toBe(plan.friends);
        const at = b.eventItem ? b.having! : b.solution;
        expect(at).toContain(b.event);
        expect(at.filter((p) => p === b.event)).toHaveLength(1);
        expect(answerOf(b)).toBeGreaterThanOrEqual(0);
        expect(at[answerOf(b)]).toBe(b.event);
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
      const k = makeBoard(planFor(2), new Rng(seed))
        .clues.map((c) => c.kind)
        .sort();
      expect(k).toEqual(['direct', 'not']);
    }
  });
});

describe('what a clue decides and contradicts', () => {
  it('decides: a direct clue is its yes plus its row and column; a not clue only its own no', () => {
    forBoards((b) => {
      const s = shapeOf(b);
      for (const c of b.clues) {
        if (!onGrid(c)) continue;
        const d = decides(s, c);
        const own = sq(s, c.friend, c.place);
        if (c.kind === 'not') {
          expect(d).toEqual([{ square: own, mark: CROSSED }]);
        } else {
          const want = new Map<number, Mark>();
          for (let i = 0; i < s.rows * s.cols; i++) {
            const r = Math.floor(i / s.cols),
              col = i % s.cols;
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
        if (!onGrid(c)) return;
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
      for (const i of quiet)
        expect(
          wrongSquares(
            b,
            Object.assign(emptyMarks(shapeOf(b)), { [i]: want[i] === FILLED ? CROSSED : FILLED }),
          ),
        ).toEqual([i]);
    }
    expect(found).toBeGreaterThan(0);
  });

  it('level 2 double-tap: cycling onto the not square flags the yes, and the settled cross is silent', () => {
    for (const seed of SEEDS) {
      const b = makeBoard(planFor(2), new Rng(seed));
      const s = shapeOf(b);
      const ni = b.clues.findIndex((c) => c.kind === 'not');
      const nc = b.clues[ni];
      if (!onGrid(nc)) throw new Error('not clue');
      const own = sq(s, nc.friend, nc.place);
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
      const other = ((y + 1) % 3) + Math.floor(y / 3) * 3;
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
    for (const plan of OLD_PLANS) {
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
    for (const plan of OLD_PLANS) {
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

describe('levels 3 and 4: three friends on three places', () => {
  const plans = [planFor(3), planFor(4)];
  it('the plans are what the definition says', () => {
    expect(plans.map((p) => p.level)).toEqual([3, 4]);
    for (const p of plans) {
      expect(p.friends).toBe(3);
      expect(p.places).toBe(3);
      expect(p.thing).toBe('ball');
    }
  });
  for (const plan of plans) {
    it(`level ${plan.level}: one answer, solver finishes, no spare clue, 3..4 clues, at most one direct, all true`, () => {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        const s = shapeOf(b);
        expect(s).toEqual({ rows: 3, cols: 3 });
        expect(solutions(s, b.clues)).toEqual([b.solution]);
        expect(solveSteps(s, b.clues).done).toBe(true);
        b.clues.forEach((_, i) =>
          expect(
            solveSteps(
              s,
              b.clues.filter((__, j) => j !== i),
            ).done,
          ).toBe(false),
        );
        expect(b.clues.length).toBeGreaterThanOrEqual(3);
        expect(b.clues.length).toBeLessThanOrEqual(4);
        expect(b.clues.filter((c) => c.kind === 'direct').length).toBeLessThanOrEqual(1);
        expect(b.clues.every((c) => holds(c, b.solution))).toBe(true);
        expect(b.thing).toBe('ball');
      }
    });
    it(`level ${plan.level}: three distinct places from PLACES, event names one friend and decides nothing alone`, () => {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        const s = shapeOf(b);
        expect(b.places).toHaveLength(3);
        expect(new Set(b.places).size).toBe(3);
        for (const p of b.places) expect(PLACES).toContain(p);
        expect([...b.solution].sort()).toEqual([0, 1, 2]);
        expect(b.solution.filter((p) => p === b.event)).toHaveLength(1);
        expect(b.solution[answerOf(b)]).toBe(b.event);
        // the event is only a place: knowing it alone leaves every assignment for the other friends open
        expect(
          solutions(s, [{ kind: 'direct', friend: answerOf(b), place: b.event }]).length,
        ).toBeGreaterThan(1);
      }
    });
    it(`level ${plan.level}: hats`, () => {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        if (plan.level === 3) {
          expect(b.hats).toBeUndefined();
          expect(b.clues.some((c) => onGrid(c) && c.hat)).toBe(false);
        } else {
          expect(b.clues.every((c) => onGrid(c) && c.hat === true)).toBe(true);
          expect(b.hats).toHaveLength(3);
          expect(new Set(b.hats).size).toBe(3);
          for (const h of b.hats!) expect(HATS[h]).toBeDefined();
        }
      }
    });
    it(`level ${plan.level}: Help agrees with the answer and finishes from any marks; a full wrong grid breaks a clue or shares a place`, () => {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        const s = shapeOf(b);
        const want = solutionMarks(b);
        const rng = new Rng(seed + 11);
        for (let t = 0; t < 4; t++) {
          let marks: Mark[] = emptyMarks(s).map(() =>
            rng.next() < 0.5 ? EMPTY : ([FILLED, CROSSED] as Mark[])[rng.int(0, 1)],
          );
          let n = 0;
          while (!solved(b, marks)) {
            const st = nextStep(b, marks);
            expect(st).not.toBeNull();
            if (!st) break;
            expect(st.mark).toBe(want[st.square]);
            marks = applyStep(b, marks, st);
            expect(++n).toBeLessThanOrEqual(s.rows * s.cols);
          }
          expect(solved(b, marks)).toBe(true);
        }
        for (let t = 0; t < 10; t++) {
          const a = b.friends.map(() => rng.int(0, 2));
          if (a.every((p, f) => p === b.solution[f])) continue;
          const marks = emptyMarks(s);
          a.forEach((p, f) => (marks[sq(s, f, p)] = FILLED));
          expect(fullWrong(b, marks)).toBe(true);
          const k = brokenClue(b, marks);
          if (k >= 0) expect(holds(b.clues[k], a)).toBe(false);
          else expect(new Set(a).size).toBeLessThan(3);
        }
      }
    });
  }
  it('HATS differ in both colour and pattern', () => {
    expect(new Set(HATS.map((h) => h.color)).size).toBe(HATS.length);
    expect(new Set(HATS.map((h) => h.pattern)).size).toBe(HATS.length);
  });
  it("the 'col' step appears only on square grids and agrees with the answer; levels 1-2 never use it", () => {
    for (const plan of PLANS) {
      for (const seed of SEEDS) {
        const b = makeBoard(plan, new Rng(seed));
        const s = shapeOf(b);
        const want = solutionMarks(b);
        for (const st of solveSteps(s, b.clues).steps) {
          if (st.why !== 'col') continue;
          expect(s.rows).toBe(s.cols);
          expect(st.mark).toBe(FILLED);
          expect(want[st.square]).toBe(FILLED);
        }
      }
    }
  });
  it("the 'col' step closes a column with one friend left, on a square grid only", () => {
    const clues = [
      { kind: 'not', friend: 0, place: 0 },
      { kind: 'not', friend: 1, place: 0 },
    ] as const;
    const sq3 = solveSteps({ rows: 3, cols: 3 }, clues).steps;
    const col = sq3.find((st) => st.why === 'col');
    expect(col).toMatchObject({ square: sq({ rows: 3, cols: 3 }, 2, 0), mark: FILLED, clues: [0, 1] });
    expect(solveSteps({ rows: 3, cols: 4 }, clues).steps.some((st) => st.why === 'col')).toBe(false);
    expect(
      solveSteps({ rows: 2, cols: 3 }, [{ kind: 'not', friend: 0, place: 0 }]).steps.some(
        (st) => st.why === 'col',
      ),
    ).toBe(false);
  });
  it('levels 1 and 2 are unchanged in shape', () => {
    for (const seed of SEEDS) {
      for (const lv of [1, 2]) {
        const b = makeBoard(planFor(lv), new Rng(seed));
        expect(shapeOf(b)).toEqual({ rows: 2, cols: 3 });
        expect(b.thing).toBe('pie');
        expect(b.hats).toBeUndefined();
        expect(b.clues).toHaveLength(2);
      }
    }
  });
});

describe('level 5: who, where and what', () => {
  const plan = planFor(5);
  const seeds5 = SEEDS.slice(0, 100);
  const each = (fn: (b: Board, seed: number) => void) =>
    seeds5.forEach((seed) => fn(makeBoard(plan, new Rng(seed)), seed));
  const blockOne = (s: ReturnType<typeof shapeOf>, i: number) => blockOf(s, i) === 1;

  it('the plan is what the definition says', () => {
    expect(plan.level).toBe(5);
    expect(plan.items).toEqual(ITEMS);
    expect(plan.hats).toBe('some');
    expect(plan.thing).toBe('kite');
    expect([plan.clues, plan.maxClues, plan.maxDirect, plan.atLeast]).toEqual([4, 5, 1, { apart: 1 }]);
    for (const p of PLANS.filter((x) => x.level < 5)) {
      expect(p.items).toBeUndefined();
      expect(p.atLeast).toBeUndefined();
      expect(p.kinds).not.toContain('apart');
    }
  });

  it('shape is two 3x3 blocks; levels 1-4 keep their single-block shape', () => {
    each((b) => expect(shapeOf(b)).toEqual({ rows: 3, cols: 3, blocks: 2 }));
    for (const lv of [1, 2, 3, 4]) {
      const s = shapeOf(makeBoard(planFor(lv), new Rng(5)));
      expect(s.blocks).toBeUndefined();
      expect(sizeOf(s)).toBe(s.rows * s.cols);
    }
    const s = { rows: 3, cols: 3, blocks: 2 };
    for (let i = 0; i < 18; i++) expect(sq(s, rowOf(s, i), colOf(s, i), blockOf(s, i))).toBe(i);
  });

  it('exactly one solution, equal to places then items; every clue true; solver finishes; no spare clue', () => {
    each((b) => {
      const s = shapeOf(b);
      expect(solutions(s, b.clues)).toEqual([[...b.solution, ...b.having!]]);
      expect(b.clues.every((c) => holds(c, b.solution, b.having))).toBe(true);
      expect(solveSteps(s, b.clues).done).toBe(true);
      b.clues.forEach((_, i) =>
        expect(
          solveSteps(
            s,
            b.clues.filter((__, j) => j !== i),
          ).done,
        ).toBe(false),
      );
    });
  });

  it('4-5 clues, at most one direct, at least one apart, at least one hat clue; items and hats are distinct', () => {
    each((b) => {
      expect(b.clues.length).toBeGreaterThanOrEqual(4);
      expect(b.clues.length).toBeLessThanOrEqual(5);
      expect(b.clues.filter((c) => c.kind === 'direct').length).toBeLessThanOrEqual(1);
      expect(b.clues.filter((c) => c.kind === 'apart').length).toBeGreaterThanOrEqual(1);
      expect(b.clues.some((c) => onGrid(c) && c.hat === true)).toBe(true);
      for (const c of b.clues) if (c.kind === 'apart') expect(c).not.toHaveProperty('hat');
      expect(b.items).toHaveLength(3);
      expect(new Set(b.items)).toEqual(new Set(ITEMS));
      expect([...b.having!].sort()).toEqual([0, 1, 2]);
      expect(b.hats).toHaveLength(3);
      expect(new Set(b.hats).size).toBe(3);
      for (const h of b.hats!) expect(HATS[h]).toBeDefined();
      expect(b.thing).toBe('kite');
      for (const c of b.clues) if (onGrid(c)) expect([undefined, 1]).toContain(c.block);
    });
  });

  it('the event names exactly one friend, in the right block', () => {
    let items = 0,
      places = 0;
    each((b) => {
      const at = b.eventItem ? b.having! : b.solution;
      if (b.eventItem) items++;
      else places++;
      expect(at.filter((x) => x === b.event)).toHaveLength(1);
      expect(at[answerOf(b)]).toBe(b.event);
      expect(answerOf(b)).toBeGreaterThanOrEqual(0);
    });
    expect(items).toBeGreaterThan(0);
    expect(places).toBeGreaterThan(0);
  });

  it('an apart clue decides nothing alone and never makes contradicts fire', () => {
    each((b) => {
      const s = shapeOf(b);
      b.clues.forEach((c, ci) => {
        if (c.kind !== 'apart') return;
        expect(decides(s, c)).toEqual([]);
        for (let i = 0; i < sizeOf(s); i++)
          for (const m of [FILLED, CROSSED] as Mark[]) expect(contradicts(b, i, m)).not.toContain(ci);
      });
      solutionMarks(b).forEach((m, i) => expect(contradicts(b, i, m)).toEqual([]));
    });
  });

  it('a block-1 direct or not clue decides and contradicts inside block 1 only', () => {
    let seen = 0;
    for (const seed of SEEDS) {
      const b = makeBoard(plan, new Rng(seed));
      const s = shapeOf(b);
      b.clues.forEach((c, ci) => {
        if (!onGrid(c)) return;
        const k = c.block ?? 0;
        const d = decides(s, c);
        expect(d.length).toBeGreaterThan(0);
        for (const x of d) expect(blockOf(s, x.square)).toBe(k);
        const own = sq(s, c.friend, c.place, k);
        expect(d.some((x) => x.square === own)).toBe(true);
        if (k === 1) seen++;
        if (c.kind === 'not') {
          expect(contradicts(b, own, FILLED)).toContain(ci);
        } else {
          expect(contradicts(b, own, CROSSED)).toContain(ci);
          // the same square in the other block is untouched by this clue
          expect(contradicts(b, sq(s, c.friend, c.place, 1 - k), CROSSED)).not.toContain(ci);
        }
      });
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('shown: a yes crosses only its own block', () => {
    const s = { rows: 3, cols: 3, blocks: 2 };
    for (let y = 0; y < 18; y++) {
      const marks = emptyMarks(s);
      marks[y] = FILLED;
      shown(s, marks).forEach((x, i) => {
        if (i === y) return expect(x).toEqual({ mark: FILLED, auto: false });
        const share =
          blockOf(s, i) === blockOf(s, y) && (rowOf(s, i) === rowOf(s, y) || colOf(s, i) === colOf(s, y));
        expect(x).toEqual(share ? { mark: CROSSED, auto: true } : { mark: EMPTY, auto: false });
      });
    }
  });

  it('Help from empty and from marks with wrong ones finishes, every step agreeing with the answer', () => {
    const scramble = (b: Board, rng: Rng): Mark[] => {
      const want = solutionMarks(b);
      const fill = rng.next();
      return want.map((_, i) =>
        rng.next() > fill
          ? EMPTY
          : rng.next() < 0.5
            ? want[i]
            : ([EMPTY, FILLED, CROSSED] as Mark[])[rng.int(0, 2)],
      );
    };
    for (const seed of seeds5) {
      const b = makeBoard(plan, new Rng(seed));
      const s = shapeOf(b);
      const want = solutionMarks(b);
      const rng = new Rng(seed + 5);
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
            expect(
              decides(s, b.clues[st.clues[0]]).some((x) => x.square === st.square && x.mark === st.mark),
            ).toBe(true);
          }
          if (st.why === 'apart') expect(st.mark).toBe(CROSSED);
          for (const ci of st.clues) expect(b.clues[ci]).toBeDefined();
          marks = applyStep(b, marks, st);
          expect(++n).toBeLessThanOrEqual(sizeOf(s));
        }
        expect(solved(b, marks)).toBe(true);
        expect(nextStep(b, marks)).toBeNull();
      }
    }
  });

  it('the apart step is used by some boards and crosses across the blocks', () => {
    let used = 0;
    each((b) => {
      const s = shapeOf(b);
      const want = solutionMarks(b);
      for (const st of solveSteps(s, b.clues).steps) {
        if (st.why !== 'apart') continue;
        used++;
        expect(st.mark).toBe(CROSSED);
        expect(want[st.square]).toBe(CROSSED);
      }
    });
    expect(used).toBeGreaterThan(0);
  });

  it('a full wrong grid is fullWrong; brokenClue names a false clue, or -1 only when two friends share a column in a block', () => {
    for (const seed of seeds5) {
      const b = makeBoard(plan, new Rng(seed));
      const s = shapeOf(b);
      const rng = new Rng(seed + 1);
      for (let t = 0; t < 10; t++) {
        const a = b.friends.map(() => rng.int(0, 2));
        const h = b.friends.map(() => rng.int(0, 2));
        const marks = emptyMarks(s);
        a.forEach((p, f) => (marks[sq(s, f, p, 0)] = FILLED));
        h.forEach((p, f) => (marks[sq(s, f, p, 1)] = FILLED));
        const isAnswer = a.every((p, f) => p === b.solution[f]) && h.every((p, f) => p === b.having![f]);
        expect(solved(b, marks)).toBe(isAnswer);
        expect(fullWrong(b, marks)).toBe(!isAnswer);
        if (isAnswer) continue;
        const k = brokenClue(b, marks);
        if (k >= 0) expect(holds(b.clues[k], a, h)).toBe(false);
        else expect(new Set(a).size < 3 || new Set(h).size < 3).toBe(true);
      }
      // a half-filled grid (only block 0) is not fullWrong
      const half = emptyMarks(s);
      b.solution.forEach((p, f) => (half[sq(s, f, (p + 1) % 3, 0)] = FILLED));
      expect(fullWrong(b, half)).toBe(false);
      expect(solved(b, half)).toBe(false);
    }
  });

  it('same seed, same round; levels 1-4 carry no level-5 fields', () => {
    for (const seed of seeds5.slice(0, 30)) {
      expect(makeRound(plan, new Rng(seed))).toEqual(makeRound(plan, new Rng(seed)));
      for (const lv of [1, 2, 3, 4]) {
        const p = planFor(lv);
        expect(p).not.toHaveProperty('items');
        expect(p).not.toHaveProperty('atLeast');
        const b = makeBoard(p, new Rng(seed));
        expect(b.items).toBeUndefined();
        expect(b.having).toBeUndefined();
        expect(b.eventItem).toBeUndefined();
        expect(
          b.clues.every((c) => c.kind !== 'apart' && (c as { block?: number }).block === undefined),
        ).toBe(true);
        expect(blockOne(shapeOf(b), 0)).toBe(false);
      }
    }
  });
});

describe('level 6: this one or that one', () => {
  const plan = planFor(6);
  const seeds6 = SEEDS.slice(0, 80);
  const each = (fn: (b: Board, seed: number) => void) =>
    seeds6.forEach((seed) => fn(makeBoard(plan, new Rng(seed)), seed));

  it('the plan is what the definition says; earlier plans stay free of the new kinds', () => {
    expect(plan.level).toBe(6);
    expect([
      plan.friends,
      plan.places,
      plan.clues,
      plan.maxClues,
      plan.maxDirect,
      plan.hats,
      plan.atLeast,
    ]).toEqual([4, 4, 4, 6, 0, 'some', { either: 1, neither: 1 }]);
    expect(plan.kinds).toEqual(['not', 'either', 'neither']);
    expect(plan.items).toBeUndefined();
    for (const p of PLANS.filter((x) => x.level < 6))
      expect(p.kinds.some((k) => k === 'either' || k === 'neither')).toBe(false);
  });

  it('HATS all differ in colour and pattern', () => {
    // Level 8 added a fifth (purple checks).
    expect(HATS).toHaveLength(5);
    expect(new Set(HATS.map((h) => h.color)).size).toBe(5);
    expect(new Set(HATS.map((h) => h.pattern)).size).toBe(5);
  });

  it('a single 4x4 block; exactly one solution, true clues, rule solver finishes, no spare clue', () => {
    each((b) => {
      const s = shapeOf(b);
      expect(s).toEqual({ rows: 4, cols: 4 });
      expect(solutions(s, b.clues)).toEqual([b.solution]);
      expect(new Set(b.solution).size).toBe(4);
      expect(b.clues.every((c) => holds(c, b.solution))).toBe(true);
      expect(solveSteps(s, b.clues).done).toBe(true);
      b.clues.forEach((_, i) =>
        expect(
          solveSteps(
            s,
            b.clues.filter((__, j) => j !== i),
          ).done,
        ).toBe(false),
      );
      expect(b.items).toBeUndefined();
    });
  });

  it('4-6 clues, no direct, an either, a neither, a hatted clue; four distinct hats', () => {
    each((b) => {
      expect(b.clues.length).toBeGreaterThanOrEqual(4);
      expect(b.clues.length).toBeLessThanOrEqual(6);
      for (const c of b.clues) expect(plan.kinds).toContain(c.kind);
      expect(b.clues.some((c) => c.kind === 'either')).toBe(true);
      expect(b.clues.some((c) => c.kind === 'neither')).toBe(true);
      expect(b.clues.some((c) => hatted(c))).toBe(true);
      for (const c of b.clues) if (c.kind === 'neither') expect(c).not.toHaveProperty('hat');
      expect(b.hats).toHaveLength(4);
      expect(new Set(b.hats).size).toBe(4);
      for (const h of b.hats!) expect(HATS[h]).toBeDefined();
      expect(b.friends).toHaveLength(4);
      expect(new Set(b.friends).size).toBe(4);
      expect(b.thing).toBe('kite');
    });
  });

  it("either names two distinct places including the friend's; neither names two distinct friends both away from the place", () => {
    each((b) => {
      for (const c of b.clues) {
        if (c.kind === 'either') {
          expect(c.place).not.toBe(c.or);
          expect([c.place, c.or]).toContain(b.solution[c.friend]);
        } else if (c.kind === 'neither') {
          expect(c.friend).not.toBe(c.nor);
          expect(b.solution[c.friend]).not.toBe(c.place);
          expect(b.solution[c.nor]).not.toBe(c.place);
        }
      }
    });
  });

  it('the event names exactly one friend', () => {
    each((b) => {
      expect(b.solution.filter((p) => p === b.event)).toHaveLength(1);
      expect(b.solution[answerOf(b)]).toBe(b.event);
    });
  });

  it("decides: either crosses the friend's other two places, neither its two squares; contradicts fires on a yes there, never on the solution", () => {
    let eithers = 0,
      neithers = 0;
    each((b) => {
      const s = shapeOf(b);
      const want = solutionMarks(b);
      b.clues.forEach((c, ci) => {
        if (c.kind === 'either') {
          eithers++;
          const d = decides(s, c);
          const others = [0, 1, 2, 3]
            .filter((p) => p !== c.place && p !== c.or)
            .map((p) => sq(s, c.friend, p));
          expect(d.map((x) => x.square).sort()).toEqual(others.sort());
          expect(d.every((x) => x.mark === CROSSED)).toBe(true);
          for (const x of d) expect(contradicts(b, x.square, FILLED)).toContain(ci);
          expect(contradicts(b, sq(s, c.friend, c.place), FILLED)).not.toContain(ci);
        } else if (c.kind === 'neither') {
          neithers++;
          const d = decides(s, c);
          expect(d.map((x) => x.square).sort()).toEqual(
            [sq(s, c.friend, c.place), sq(s, c.nor, c.place)].sort(),
          );
          expect(d.every((x) => x.mark === CROSSED)).toBe(true);
          for (const x of d) expect(contradicts(b, x.square, FILLED)).toContain(ci);
          for (const x of d) expect(contradicts(b, x.square, CROSSED)).not.toContain(ci);
        }
      });
      want.forEach((m, i) => expect(contradicts(b, i, m)).toEqual([]));
    });
    expect(eithers).toBeGreaterThan(0);
    expect(neithers).toBeGreaterThan(0);
  });

  it('Help from empty and from marks with wrong ones finishes, every step agreeing with the answer', () => {
    for (const seed of seeds6) {
      const b = makeBoard(plan, new Rng(seed));
      const s = shapeOf(b);
      const want = solutionMarks(b);
      const rng = new Rng(seed + 6);
      const scramble = (): Mark[] => {
        const fill = rng.next();
        return want.map((w) =>
          rng.next() > fill
            ? EMPTY
            : rng.next() < 0.5
              ? w
              : ([EMPTY, FILLED, CROSSED] as Mark[])[rng.int(0, 2)],
        );
      };
      for (const start of [emptyMarks(s), scramble(), scramble()]) {
        let marks: Mark[] = start;
        let n = 0;
        while (!solved(b, marks)) {
          const st = nextStep(b, marks);
          expect(st).not.toBeNull();
          if (!st) break;
          expect(st.mark).toBe(want[st.square]);
          for (const ci of st.clues) expect(b.clues[ci]).toBeDefined();
          marks = applyStep(b, marks, st);
          expect(++n).toBeLessThanOrEqual(sizeOf(s));
        }
        expect(solved(b, marks)).toBe(true);
        expect(nextStep(b, marks)).toBeNull();
      }
    }
  });

  it('a full wrong grid is fullWrong; brokenClue names a false clue, or -1 only when two friends share a column', () => {
    for (const seed of seeds6) {
      const b = makeBoard(plan, new Rng(seed));
      const s = shapeOf(b);
      const rng = new Rng(seed + 1);
      for (let t = 0; t < 10; t++) {
        const a = b.friends.map(() => rng.int(0, 3));
        const marks = emptyMarks(s);
        a.forEach((p, f) => (marks[sq(s, f, p)] = FILLED));
        const isAnswer = a.every((p, f) => p === b.solution[f]);
        expect(solved(b, marks)).toBe(isAnswer);
        expect(fullWrong(b, marks)).toBe(!isAnswer);
        if (isAnswer) continue;
        const k = brokenClue(b, marks);
        if (k >= 0) expect(holds(b.clues[k], a)).toBe(false);
        else expect(new Set(a).size).toBeLessThan(4);
      }
    }
  });

  it('same seed, same round; levels 1-5 boards carry no either or neither clue', () => {
    for (const seed of seeds6.slice(0, 30)) {
      expect(makeRound(plan, new Rng(seed))).toEqual(makeRound(plan, new Rng(seed)));
      for (const lv of [1, 2, 3, 4, 5]) {
        const b = makeBoard(planFor(lv), new Rng(seed));
        expect(b.clues.every((c) => c.kind !== 'either' && c.kind !== 'neither')).toBe(true);
        expect(b.friends.length).toBeLessThan(4);
        expect(b.hats?.every((h) => h < 3) ?? true).toBe(true);
      }
    }
  });
});

describe('level 7: case file', () => {
  const plan = planFor(7);
  const seeds7 = SEEDS.slice(0, 40);
  const each = (fn: (b: Board, seed: number) => void) =>
    seeds7.forEach((seed) => fn(makeBoard(plan, new Rng(seed)), seed));
  const wantOf = (b: Board) => solutionMarks(b);

  it('the plan is what the definition says; earlier plans have no case', () => {
    expect(plan.level).toBe(7);
    expect([plan.friends, plan.places, plan.clues, plan.maxClues, plan.hats, plan.case, plan.thing]).toEqual([
      4,
      4,
      5,
      8,
      'some',
      true,
      'basket',
    ]);
    expect(plan.items).toBe(SNACKS);
    expect([...plan.kinds].sort()).toEqual(['direct', 'either', 'neither', 'not']);
    for (const p of PLANS.filter((x) => x.level < 7)) expect(p.case).toBeUndefined();
    for (const seed of seeds7.slice(0, 15))
      for (let lv = 1; lv <= 6; lv++) expect(makeBoard(planFor(lv), new Rng(seed)).case).toBeUndefined();
  });

  it('three 4x4 blocks; one solution; every clue true; rule solver finishes; no spare clue; 5-8 clues', () => {
    each((b) => {
      const s = shapeOf(b);
      expect(s).toEqual({ rows: 4, cols: 4, blocks: 3 });
      expect(b.case).toBe(true);
      expect(b.thing).toBe('basket');
      expect(solutions(s, b.clues)).toEqual([[...b.solution, ...b.having!]]);
      expect(b.clues.every((c) => holds(c, b.solution, b.having))).toBe(true);
      expect(solveSteps(s, b.clues).done).toBe(true);
      b.clues.forEach((_, i) =>
        expect(
          solveSteps(
            s,
            b.clues.filter((__, j) => j !== i),
          ).done,
        ).toBe(false),
      );
      expect(b.clues.length).toBeGreaterThanOrEqual(5);
      expect(b.clues.length).toBeLessThanOrEqual(8);
      for (const c of b.clues) expect(plan.kinds).toContain(c.kind);
    });
  });

  it('hats: at least one hatted clue, none on block 2; four distinct friends, places, snacks and hats', () => {
    each((b) => {
      expect(b.clues.some((c) => hatted(c))).toBe(true);
      for (const c of b.clues)
        if ((c.kind === 'direct' || c.kind === 'not') && c.block === 2) expect(c).not.toHaveProperty('hat');
      expect(b.hats).toHaveLength(4);
      expect(new Set(b.hats).size).toBe(4);
      expect(new Set(b.friends).size).toBe(4);
      expect(new Set(b.solution).size).toBe(4);
      expect(new Set(b.places).size).toBe(4);
      expect(new Set(b.having).size).toBe(4);
      expect(b.items).toHaveLength(4);
      expect(new Set(b.items).size).toBe(4);
      for (const i of b.items!) expect(SNACKS).toContain(i);
    });
  });

  it('solutionMarks: block 2 puts each snack at the place of the friend who has it', () => {
    each((b) => {
      const s = shapeOf(b);
      const want = wantOf(b);
      expect(want).toHaveLength(48);
      for (let t = 0; t < 4; t++) {
        const f = b.having!.indexOf(t);
        for (let p = 0; p < 4; p++) {
          expect(want[sq(s, t, p, 2)]).toBe(p === b.solution[f] ? FILLED : CROSSED);
          expect(want[sq(s, f, p, 0)]).toBe(p === b.solution[f] ? FILLED : CROSSED);
          expect(want[sq(s, f, p, 1)]).toBe(p === t ? FILLED : CROSSED);
        }
      }
      expect(want.filter((m) => m === FILLED)).toHaveLength(12);
      expect(solved(b, want)).toBe(true);
    });
  });

  it('the event names exactly one friend, and alone decides nothing', () => {
    each((b) => {
      const at = b.eventItem ? b.having! : b.solution;
      expect(at.filter((p) => p === b.event)).toHaveLength(1);
      const f = answerOf(b);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(at[f]).toBe(b.event);
      const s = shapeOf(b);
      expect(solveSteps(s, []).done).toBe(false);
      expect(solutions(s, []).length).toBeGreaterThan(1);
    });
  });

  it('decides and contradicts for block 1 and 2 clues stay inside their block and never fire on the solution marks', () => {
    let seen1 = 0,
      seen2 = 0;
    each((b) => {
      const s = shapeOf(b);
      const want = wantOf(b);
      b.clues.forEach((c, ci) => {
        const k = c.kind === 'apart' || c.kind === 'order' || c.kind === 'pair' ? 0 : (c.block ?? 0);
        if (k === 1) seen1++;
        if (k === 2) seen2++;
        for (const d of decides(s, c)) {
          expect(blockOf(s, d.square)).toBe(k);
          expect(want[d.square]).toBe(d.mark);
          expect(contradicts(b, d.square, d.mark)).not.toContain(ci);
          const other = d.mark === FILLED ? CROSSED : FILLED;
          expect(contradicts(b, d.square, other)).toContain(ci);
        }
        if (c.kind === 'direct') {
          const d = decides(s, c);
          expect(d).toHaveLength(7);
          expect(d.filter((x) => x.mark === FILLED)).toHaveLength(1);
        }
      });
      want.forEach((m, i) => expect(contradicts(b, i, m)).toEqual([]));
    });
    expect(seen1).toBeGreaterThan(0);
    expect(seen2).toBeGreaterThan(0);
  });

  it('shown auto-crosses stay within a block', () => {
    each((b, seed) => {
      const s = shapeOf(b);
      const rng = new Rng(seed + 11);
      const marks = emptyMarks(s);
      const ys: number[] = [];
      for (let k = 0; k < 3; k++) {
        const i = sq(s, rng.int(0, 3), rng.int(0, 3), k);
        marks[i] = FILLED;
        ys.push(i);
      }
      shown(s, marks).forEach((x, i) => {
        if (!x.auto) return;
        expect(marks[i]).toBe(EMPTY);
        const near = ys.filter(
          (j) =>
            blockOf(s, j) === blockOf(s, i) && (rowOf(s, j) === rowOf(s, i) || colOf(s, j) === colOf(s, i)),
        );
        expect(near.length).toBeGreaterThan(0);
      });
      const only = emptyMarks(s);
      only[ys[2]] = FILLED;
      shown(s, only).forEach((x, i) => {
        if (blockOf(s, i) !== 2) expect(x.auto).toBe(false);
      });
    });
  });

  it('the link step appears on some boards, and every link step agrees with the answer', () => {
    let boardsWithLink = 0;
    each((b) => {
      const s = shapeOf(b);
      const want = wantOf(b);
      const { steps } = solveSteps(s, b.clues);
      const links = steps.filter((st) => st.why === 'link');
      if (links.length) boardsWithLink++;
      for (const st of links) expect(st.clues.length).toBeGreaterThan(0);
      for (const st of steps) expect(st.mark).toBe(want[st.square]);
    });
    expect(boardsWithLink).toBeGreaterThan(0);
  });

  it('Help from empty and from marks with wrong ones finishes, every step agreeing with the answer', () => {
    for (const seed of seeds7) {
      const b = makeBoard(plan, new Rng(seed));
      const s = shapeOf(b);
      const want = wantOf(b);
      const rng = new Rng(seed + 7);
      const scramble = (): Mark[] => {
        const fill = rng.next();
        return want.map((w) =>
          rng.next() > fill
            ? EMPTY
            : rng.next() < 0.5
              ? w
              : ([EMPTY, FILLED, CROSSED] as Mark[])[rng.int(0, 2)],
        );
      };
      for (const start of [emptyMarks(s), scramble(), scramble()]) {
        let marks: Mark[] = start;
        let n = 0;
        while (!solved(b, marks)) {
          const st = nextStep(b, marks);
          expect(st).not.toBeNull();
          if (!st) break;
          expect(st.mark).toBe(want[st.square]);
          marks = applyStep(b, marks, st);
          expect(++n).toBeLessThanOrEqual(sizeOf(s));
        }
        expect(solved(b, marks)).toBe(true);
        expect(nextStep(b, marks)).toBeNull();
      }
    }
  });

  it('every full wrong grid is fullWrong; brokenClue names a really broken clue, or -1 only when nothing can be named', () => {
    let named = 0,
      fallback = 0;
    const ident = [0, 1, 2, 3];
    for (const seed of seeds7) {
      const b = makeBoard(plan, new Rng(seed));
      const s = shapeOf(b);
      const rng = new Rng(seed + 3);
      for (let t = 0; t < 25; t++) {
        const perm = () => (rng.chance(0.8) ? rng.shuffle([0, 1, 2, 3]) : ident.map(() => rng.int(0, 3)));
        const cols = [perm(), perm(), perm()];
        if (t % 3 === 0) {
          cols[0] = [...b.solution];
          cols[1] = [...b.having!];
        }
        const marks = emptyMarks(s);
        cols.forEach((c, k) => c.forEach((p, f) => (marks[sq(s, f, p, k)] = FILLED)));
        const isAnswer =
          cols[0].every((p, f) => p === b.solution[f]) &&
          cols[1].every((p, f) => p === b.having![f]) &&
          cols[2].every((p, t2) => p === b.solution[b.having!.indexOf(t2)]);
        expect(solved(b, marks)).toBe(isAnswer);
        expect(fullWrong(b, marks)).toBe(!isAnswer);
        if (isAnswer) continue;
        const k = brokenClue(b, marks);
        const [a, h, z] = cols;
        const block2False = (c: (typeof b.clues)[number]) =>
          'block' in c && c.block === 2 && !holds(c, z, ident);
        if (k >= 0) {
          named++;
          const falseOf01 = !holds(b.clues[k], a, h);
          expect(falseOf01 || block2False(b.clues[k])).toBe(true);
          if (!falseOf01) {
            fallback++;
            expect(b.clues.every((x) => holds(x, a, h))).toBe(true);
          }
        } else {
          expect(b.clues.every((x) => holds(x, a, h))).toBe(true);
          expect(b.clues.some(block2False)).toBe(false);
          const dup = cols.some((c) => new Set(c).size < 4);
          const disagree = !z.every((p, t2) => p === a[h.indexOf(t2)]);
          expect(dup || disagree).toBe(true);
        }
      }
    }
    expect(named).toBeGreaterThan(0);
    expect(fallback).toBeGreaterThan(0);
  });

  it('same seed, same puzzle', () => {
    for (const seed of seeds7.slice(0, 20))
      expect(makeRound(plan, new Rng(seed))).toEqual(makeRound(plan, new Rng(seed)));
  });
});

describe('level 8: who came first?', () => {
  const plan = planFor(8);
  const seeds8 = SEEDS.slice(0, 30);
  const boards = seeds8.map((seed) => makeBoard(plan, new Rng(seed)));
  const each = (fn: (b: Board, seed: number) => void) => boards.forEach((b, i) => fn(b, seeds8[i]));
  /** The marks an assignment (friend → place, friend → time) puts on all three blocks. */
  const marksOf = (b: Board, a: readonly number[], h: readonly number[]) =>
    solutionMarks({ ...b, solution: [...a], having: [...h] });

  it('the plan is what the definition says (clues capped at 9 so the list fits at 64); earlier plans have no times', () => {
    expect(plan.level).toBe(8);
    expect([
      plan.friends,
      plan.places,
      plan.clues,
      plan.maxClues,
      plan.hats,
      plan.case,
      plan.times,
      plan.thing,
    ]).toEqual([5, 5, 7, 9, 'some', true, true, 'basket']);
    expect(plan.items).toBe(TIMES);
    expect(plan.placePool).toBe(PLACES5);
    expect([...plan.kinds].sort()).toEqual(['direct', 'either', 'neither', 'not', 'order', 'pair']);
    for (const p of PLANS.filter((x) => x.level < 8)) {
      expect(p.times).toBeUndefined();
      expect(p.kinds).not.toContain('order');
      expect(p.kinds).not.toContain('pair');
      expect(p.placePool).not.toContain('barn');
    }
  });

  it('three 5x5 blocks with the times in order; one solution; true clues; rule solver finishes; no spare clue; 7-9 clues', () => {
    each((b) => {
      const s = shapeOf(b);
      expect(s).toEqual({ rows: 5, cols: 5, blocks: 3 });
      expect(b.items).toEqual(TIMES);
      expect(b.times).toBe(true);
      expect(new Set(b.places)).toEqual(new Set(PLACES5));
      expect(countSolutions(s, b.clues, 3)).toBe(1);
      expect(b.clues.every((c) => holds(c, b.solution, b.having))).toBe(true);
      expect(solveSteps(s, b.clues).done).toBe(true);
      b.clues.forEach((_, i) =>
        expect(
          solveSteps(
            s,
            b.clues.filter((__, j) => j !== i),
          ).done,
        ).toBe(false),
      );
      expect(b.clues.length).toBeGreaterThanOrEqual(7);
      expect(b.clues.length).toBeLessThanOrEqual(9);
      expect(b.clues.some((c) => c.kind === 'order')).toBe(true);
      expect(b.clues.some((c) => c.kind === 'pair')).toBe(true);
      expect(b.clues.some(hatted)).toBe(true);
      expect(new Set(b.hats).size).toBe(5);
      expect(new Set(b.friends).size).toBe(5);
    });
    // The exact solver agrees with the fast count on a few boards.
    for (const b of boards.slice(0, 3))
      expect(solutions(shapeOf(b), b.clues)).toEqual([[...b.solution, ...b.having!]]);
  });

  it('an order clue is true of its friends; a pair names two different friends at its two times', () => {
    each((b) => {
      for (const c of b.clues) {
        if (c.kind === 'order') {
          const gap = b.having![c.later] - b.having![c.friend];
          expect(gap).toBeGreaterThan(0);
          if (c.by) expect(gap).toBe(c.by);
        }
        if (c.kind === 'pair') {
          const g = b.solution.indexOf(c.place);
          expect(g).not.toBe(c.friend);
          expect(c.time).toBeLessThan(c.or);
          expect(new Set([b.having![c.friend], b.having![g]])).toEqual(new Set([c.time, c.or]));
        }
      }
    });
  });

  it('decides is exactly what each clue forces alone on an empty grid', () => {
    const b = boards[0];
    const s = shapeOf(b);
    const kinds = new Set<string>();
    const clues: Clue[] = [
      ...b.clues,
      { kind: 'order', friend: 0, later: 1 },
      { kind: 'order', friend: 2, later: 3, by: 2 },
      { kind: 'pair', friend: 0, place: 1, time: 0, or: 3 },
    ];
    for (const c of clues) {
      kinds.add(c.kind);
      const all = solutions(s, [c]).map((x) => marksOf(b, x.slice(0, 5), x.slice(5)));
      const forced = all[0].flatMap((m, i) => (all.every((y) => y[i] === m) ? [{ square: i, mark: m }] : []));
      const key = (d: { square: number; mark: Mark }) => `${d.square}:${d.mark}`;
      expect(decides(s, c).map(key).sort()).toEqual(forced.map(key).sort());
    }
    expect(kinds.has('order') && kinds.has('pair')).toBe(true);
  });

  it('contradicts never fires on the solution marks; every rule-solver step agrees; order and pair steps appear', () => {
    let order = 0,
      pair = 0;
    each((b) => {
      const s = shapeOf(b);
      const want = solutionMarks(b);
      want.forEach((m, i) => expect(contradicts(b, i, m)).toEqual([]));
      const { steps } = solveSteps(s, b.clues);
      for (const st of steps) expect(st.mark).toBe(want[st.square]);
      if (steps.some((st) => st.why === 'order')) order++;
      if (steps.some((st) => st.why === 'pair')) pair++;
    });
    expect(order).toBeGreaterThan(0);
    expect(pair).toBeGreaterThan(0);
  });

  it('Help from empty and from marks with wrong ones finishes, every step agreeing with the answer', () => {
    each((b, seed) => {
      const s = shapeOf(b);
      const want = solutionMarks(b);
      const rng = new Rng(seed + 7);
      const scramble = (): Mark[] =>
        want.map((w) =>
          rng.next() < 0.5
            ? EMPTY
            : rng.next() < 0.6
              ? w
              : ([EMPTY, FILLED, CROSSED] as Mark[])[rng.int(0, 2)],
        );
      for (const start of [emptyMarks(s), scramble()]) {
        let marks: Mark[] = start;
        let n = 0;
        while (!solved(b, marks)) {
          const st = nextStep(b, marks);
          expect(st).not.toBeNull();
          if (!st) break;
          expect(st.mark).toBe(want[st.square]);
          marks = applyStep(b, marks, st);
          expect(++n).toBeLessThanOrEqual(sizeOf(s));
        }
        expect(nextStep(b, marks)).toBeNull();
      }
    });
  });

  it('a full wrong grid is fullWrong, and brokenClue names a clue that is really broken', () => {
    let named = 0;
    each((b, seed) => {
      const s = shapeOf(b);
      const rng = new Rng(seed + 3);
      for (let t = 0; t < 10; t++) {
        const cols = [0, 1, 2].map(() => rng.shuffle([0, 1, 2, 3, 4]));
        if (t % 2 === 0) {
          cols[0] = [...b.solution];
          cols[1] = [...b.having!];
        }
        const marks = emptyMarks(s);
        cols.forEach((c, k) => c.forEach((p, f) => (marks[sq(s, f, p, k)] = FILLED)));
        if (solved(b, marks)) continue;
        expect(fullWrong(b, marks)).toBe(true);
        const k = brokenClue(b, marks);
        if (k < 0) continue;
        named++;
        const [a, h, z] = cols;
        const c = b.clues[k];
        const in2 =
          c.kind === 'pair'
            ? z.indexOf(c.place) !== c.time && z.indexOf(c.place) !== c.or
            : 'block' in c && c.block === 2 && !holds(c, z, [0, 1, 2, 3, 4]);
        expect(!holds(c, a, h) || in2).toBe(true);
      }
    });
    expect(named).toBeGreaterThan(0);
  });

  it('same seed, same puzzle; a board takes well under a second', () => {
    for (const seed of seeds8.slice(0, 5))
      expect(makeRound(plan, new Rng(seed))).toEqual(makeRound(plan, new Rng(seed)));
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) makeBoard(plan, new Rng(1000 + i));
    expect((performance.now() - t0) / 10).toBeLessThan(500);
  });
});
