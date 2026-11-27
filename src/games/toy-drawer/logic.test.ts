import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  cellsAt,
  complete,
  copyState,
  describeLevel,
  emptyState,
  footprint,
  legal,
  LEVELS,
  makePuzzle,
  nearestAnchor,
  nextHint,
  PLANS,
  planFor,
  puzzleOf,
  solve,
  spareCells,
  TOY_SIZE,
  turn,
  turnToy,
  type Puzzle,
  type State,
  type ToyKind,
} from './logic';

const allCases = PLANS.flatMap((plan, i) => plan.cases.map((c) => ({ level: i + 1, c, plan })));

describe('Toy Drawer rules', () => {
  it.each(allCases.map((x) => [x.level, x.c.toys.join('+') + ` in ${x.c.cols}x${x.c.rows}`, x] as const))(
    'level %i %s has a complete legal packing',
    (_l, _name, { c, plan }) => {
      const p = puzzleOf(c, plan.canTurn);
      const s = solve(p, emptyState(p));
      expect(s).not.toBeNull();
      expect(complete(p, s!)).toBe(true);
      // Every toy is inside the drawer and no two overlap.
      const seen = new Set<string>();
      for (const t of p.toys) {
        for (const [r, k] of cellsAt(t.kind, s!.turns[t.id], s!.at[t.id]!)) {
          expect(r >= 0 && k >= 0 && r < p.rows && k < p.cols).toBe(true);
          expect(seen.has(`${r},${k}`)).toBe(false);
          seen.add(`${r},${k}`);
        }
      }
    },
  );

  it('keeps the spare cells the level promises', () => {
    for (const { level, c, plan } of allCases) {
      const spare = spareCells(puzzleOf(c, plan.canTurn));
      if (level === 1) expect(spare).toBeGreaterThanOrEqual(4);
      if (level === 2) expect(spare >= 1 && spare <= 3).toBe(true);
      if (level === 3) expect(spare).toBeGreaterThanOrEqual(0);
    }
  });

  it('level 1 and 2 cases need no turning; every level 3 case needs one', () => {
    for (const { level, c, plan } of allCases) {
      const p = puzzleOf(c, plan.canTurn);
      const unturned = solve(p, emptyState(p), false);
      if (level < 3) expect(unturned, `${c.toys}`).not.toBeNull();
      else {
        expect(unturned, `${c.toys}`).toBeNull();
        expect(solve(p, emptyState(p), true)).not.toBeNull();
      }
    }
  });

  it('accepts every legal single placement and refuses overlaps and off-board ones', () => {
    for (const { c, plan } of allCases) {
      const p = puzzleOf(c, plan.canTurn);
      const first = p.toys[0];
      for (let turns = 0; turns < 4; turns++)
        for (let r = -2; r < p.rows + 2; r++)
          for (let k = -2; k < p.cols + 2; k++) {
            const cells = cellsAt(first.kind, turns, [r, k]);
            const inside = cells.every(([a, b]) => a >= 0 && b >= 0 && a < p.rows && b < p.cols);
            expect(legal(p, emptyState(p), first.id, turns, [r, k])).toBe(inside);
          }
      // A second toy cannot sit on the first.
      const s = emptyState(p);
      s.at[first.id] = [0, 0];
      const second = p.toys[1];
      for (const [a, b] of cellsAt(first.kind, 0, [0, 0]))
        expect(legal(p, s, second.id, 0, [a, b])).toBe(false);
    }
  });

  it('turns preserve area and four turns come home', () => {
    for (const kind of Object.keys(TOY_SIZE) as ToyKind[]) {
      const base = footprint(kind, 0);
      let cells = base;
      for (let i = 0; i < 4; i++) {
        cells = turn(cells);
        expect(cells).toHaveLength(base.length);
      }
      expect(cells).toEqual(base);
      expect(footprint(kind, 4)).toEqual(base);
    }
    expect(footprint('ladder', 1)).toEqual(footprint('train', 0));
  });

  it('turning a placed toy keeps its corner, shifts by one if it must, and is refused when nothing fits', () => {
    const p = puzzleOf({ rows: 3, cols: 4, toys: ['ladder', 'ball'] }, true);
    const s = emptyState(p);
    s.at.ladder = [0, 2];
    const turned = turnToy(p, s, 'ladder')!;
    expect(turned.turns.ladder).toBe(1);
    // Lying down from the right edge needs a shift left to stay inside.
    expect(turned.at.ladder![1]).toBeLessThanOrEqual(1);
    // A full row blocks it: the ladder cannot lie down anywhere.
    const tight = puzzleOf({ rows: 3, cols: 1, toys: ['ladder'] }, true);
    const t = emptyState(tight);
    t.at.ladder = [0, 0];
    expect(turnToy(tight, t, 'ladder')).toBeNull();
    // In the tray a turn is free.
    expect(turnToy(p, emptyState(p), 'ladder')!.turns.ladder).toBe(1);
  });

  it('solve keeps as many placements as it can', () => {
    const p = puzzleOf({ rows: 3, cols: 4, toys: ['bear', 'car', 'ball'] }, false);
    const s = emptyState(p);
    s.at.bear = [0, 0];
    s.at.ball = [2, 3];
    const out = solve(p, s)!;
    expect(out.at.bear).toEqual([0, 0]);
    expect(out.at.ball).toEqual([2, 3]);
    expect(complete(p, out)).toBe(true);
  });

  it('nearestAnchor looks one cell around and no further', () => {
    const p = puzzleOf({ rows: 3, cols: 4, toys: ['bear'] }, false);
    expect(nearestAnchor(p, emptyState(p), 'bear', 0, { r: 0.4, c: 0.4 })).toEqual([0, 0]);
    expect(nearestAnchor(p, emptyState(p), 'bear', 0, { r: 4, c: 4 })).toBeNull();
  });

  /** Random legal arrangements, found by dropping toys in a seeded order at seeded places. */
  function arrangements(p: Puzzle, seed: number, n: number): State[] {
    const rng = new Rng(seed);
    const out: State[] = [];
    for (let i = 0; i < n; i++) {
      const s = emptyState(p);
      for (const t of rng.shuffle([...p.toys])) {
        if (p.canTurn && rng.chance(0.3)) s.turns[t.id] = 1;
        const turns = s.turns[t.id];
        const spots: [number, number][] = [];
        for (let r = 0; r < p.rows; r++)
          for (let k = 0; k < p.cols; k++) if (legal(p, s, t.id, turns, [r, k])) spots.push([r, k]);
        if (spots.length && rng.chance(0.85)) s.at[t.id] = rng.pick(spots);
      }
      out.push(s);
    }
    return out;
  }

  it('hints lead somewhere: from any legal arrangement, repeated hints reach a full packing', () => {
    for (const { c, plan } of allCases) {
      const p = puzzleOf(c, plan.canTurn);
      for (const start of arrangements(p, 7, 60)) {
        let s = copyState(start);
        let steps = 0;
        while (!complete(p, s)) {
          const h = nextHint(p, s);
          expect(h, `${c.toys} stuck`).not.toBeNull();
          if (h!.kind === 'place') {
            // A ghost is always on a legal place the finished packing uses.
            expect(legal(p, s, h!.toy, h!.turns, h!.anchor)).toBe(true);
            s.turns[h!.toy] = h!.turns;
            s.at[h!.toy] = h!.anchor;
          } else {
            expect(s.at[h!.toy]).toBeDefined();
            s.at[h!.toy] = undefined;
          }
          expect(++steps).toBeLessThan(p.toys.length * 3 + 3);
        }
      }
    }
  });

  it('a place hint never blocks completion; a blocked layout gets a take-out', () => {
    const p = puzzleOf({ rows: 3, cols: 4, toys: ['train', 'bear', 'car', 'book'] }, false);
    let sawTakeOut = false;
    for (const s of arrangements(p, 3, 200)) {
      const h = nextHint(p, s);
      if (!h) continue;
      if (h.kind === 'take-out') sawTakeOut = true;
      else {
        const after = copyState(s);
        after.at[h.toy] = h.anchor;
        after.turns[h.toy] = h.turns;
        expect(solve(p, after, false)).not.toBeNull();
      }
    }
    expect(sawTakeOut).toBe(true);
  });

  it('a round is seeded and the ladder is a real table', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const a = makePuzzle(level, new Rng(5));
      const b = makePuzzle(level, new Rng(5));
      expect(a).toEqual(b);
      expect(a.canTurn).toBe(planFor(level).canTurn);
      expect(describeLevel(level).length).toBeGreaterThan(10);
    }
    expect(LEVELS.preschool).toEqual({ min: 1, max: 2 });
    expect(LEVELS.prek).toEqual({ min: 1, max: 3 });
    expect(LEVELS.school).toEqual({ min: 2, max: 3 });
  });
});
