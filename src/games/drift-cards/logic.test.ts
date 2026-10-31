import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  AUTHORED_1, AUTHORED_2, COAST, MAX_PATH, MIN_CELL, PLANS, Turn, beachesFor, boatsFor, cellAt, cellCentre, cornerButtons, drift, driftFrom, driftLayout,
  nextStep, overlaps, petCorner, predict, predictRound, predictSea, randomSea, sendRound, sideways, tally, targetsOf, traceAhead, validSea,
  type Beach, type Box, type Cell, type Sea,
} from './logic';

const seeds = Array.from({ length: 300 }, (_, i) => i + 1);
const views = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390), computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })];
const [P1, P2] = PLANS;
const cellsOf = (sea: Sea): Cell[] => sea.cells.flatMap((row, r) => row.map((_, c) => ({ r, c })));
const pathStr = (p: Cell[]) => p.map((x) => `(${x.r},${x.c})`).join(' ');
const facing = (sea: Sea) => sea.cells.some((row) => row.some((d, c) => d === 'e' && row[c + 1] === 'w'));
const sameSea = (a: Sea, b: Sea) => JSON.stringify(a) === JSON.stringify(b);

function expectSound(sea: Sea) {
  expect(validSea(sea)).toBe(true);
  expect(facing(sea)).toBe(false);
  for (const cell of cellsOf(sea)) expect(driftFrom(sea, cell).path.length).toBeLessThanOrEqual(MAX_PATH);
}

function expectNoCrossing(sea: Sea, boats: readonly number[]) {
  const ranks = boats.map((b) => COAST[drift(sea, b).beach]);
  for (let i = 1; i < ranks.length; i++) expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
}

describe('finite drifts', () => {
  it('authored seas are valid', () => {
    expectSound(AUTHORED_1);
    expectSound(AUTHORED_2);
  });
  it('generated seas are valid over 300 seeds', () => {
    for (const seed of seeds) {
      expectSound(predictSea(new Rng(seed)));
      for (const q of sendRound(new Rng(seed), false)) expectSound(q.sea);
    }
  });
});

describe('authored seas', () => {
  it('level 1 paths and beaches', () => {
    const want: [number, string, Beach][] = [
      [0, '(0,0) (1,0) (1,1) (2,1) (3,1) (3,0)', 'W'],
      [2, '(0,2) (1,2) (2,2) (2,3) (2,4) (3,4)', 'S'],
      [4, '(0,4) (0,3) (1,3) (1,4)', 'E'],
    ];
    for (const [col, path, beach] of want) {
      const d = drift(AUTHORED_1, col);
      expect(pathStr(d.path)).toBe(path);
      expect(d.beach).toBe(beach);
    }
  });
  it('level 2 paths and beaches', () => {
    const want: [number, string, Beach][] = [
      [1, '(0,1) (1,1) (2,1) (2,2) (3,2) (3,1)', 'SW'],
      [3, '(0,3) (0,2) (0,1) (1,1) (2,1) (2,2) (3,2) (3,1)', 'SW'],
      [5, '(0,5) (1,5) (2,5)', 'E'],
    ];
    for (const [col, path, beach] of want) {
      const d = drift(AUTHORED_2, col);
      expect(pathStr(d.path)).toBe(path);
      expect(d.beach).toBe(beach);
    }
    expect(boatsFor(AUTHORED_2, [1, 3, 5], 'SW')).toEqual([1, 3]);
  });
});

describe('no crossing', () => {
  it('generated seas land boats left to right in coast order', () => {
    for (const seed of seeds) {
      expectNoCrossing(predictSea(new Rng(seed)), P1.boats);
      for (const q of sendRound(new Rng(seed), false)) expectNoCrossing(q.sea, P2.boats);
    }
    expectNoCrossing(AUTHORED_1, P1.boats);
    expectNoCrossing(AUTHORED_2, P2.boats);
  });
  it('holds for every valid random sea, filtered or not', () => {
    let checked = 0;
    for (const seed of seeds) {
      for (const plan of PLANS) {
        for (let k = 0; k < 20; k++) {
          const sea = randomSea(new Rng(seed * 100 + k), plan.cols, plan.rows, plan.split);
          if (!validSea(sea)) continue;
          expectNoCrossing(sea, plan.boats);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });
});

describe('level 1 rounds', () => {
  it('the first round is the authored sea', () => {
    expect(predictRound(new Rng(1), true)).toBe(AUTHORED_1);
  });
  it('seeded seas meet the round conditions', () => {
    for (const seed of seeds) {
      const sea = predictSea(new Rng(seed));
      expect(sea.cols).toBe(5);
      expect(sea.rows).toBe(4);
      const ds = P1.boats.map((b) => drift(sea, b));
      expect(new Set(ds.map((d) => d.beach)).size).toBeGreaterThanOrEqual(2);
      for (const d of ds) expect(d.path.length).toBeGreaterThanOrEqual(3);
      expect(ds.some((d) => sideways(sea, d) >= 2)).toBe(true);
      expect(sameSea(sea, predictSea(new Rng(seed)))).toBe(true);
      expect(sameSea(predictRound(new Rng(seed), false), sea)).toBe(true);
    }
  });
  it('predict accepts only the real beach', () => {
    for (const col of P1.boats) {
      const real = drift(AUTHORED_1, col).beach;
      for (const b of beachesFor(false)) expect(predict(AUTHORED_1, col, b)).toBe(b === real);
    }
  });
});

describe('level 2 requests', () => {
  it('every request has a right and a wrong boat; the first is authored', () => {
    for (const seed of seeds) {
      const round = sendRound(new Rng(seed), true);
      expect(round).toHaveLength(3);
      expect(round[0].sea).toBe(AUTHORED_2);
      expect(round[0].ask).toBe('SW');
      for (const q of [...round, ...sendRound(new Rng(seed), false)]) {
        const right = boatsFor(q.sea, P2.boats, q.ask);
        expect(right.length).toBeGreaterThanOrEqual(1);
        expect(right.length).toBeLessThan(P2.boats.length);
        for (const b of right) expect(drift(q.sea, b).beach).toBe(q.ask);
      }
    }
  });
  it('every round has a request with two right boats', () => {
    for (const seed of seeds) {
      for (const authored of [true, false]) {
        const round = sendRound(new Rng(seed), authored);
        expect(round.some((q) => boatsFor(q.sea, P2.boats, q.ask).length >= 2)).toBe(true);
      }
    }
  });
  it('the same seed gives the same round', () => {
    for (const seed of seeds) {
      for (const authored of [true, false]) {
        expect(JSON.stringify(sendRound(new Rng(seed), authored))).toBe(JSON.stringify(sendRound(new Rng(seed), authored)));
      }
    }
  });
});

describe('accounting', () => {
  it('a free choice never counts', () => {
    const t = new Turn();
    for (let i = 0; i < 5; i++) expect(t.choose(false, true).counted).toBe(false);
    expect(tally([t])).toEqual({ misses: 0, hints: 0 });
    expect(t.glow).toBe(false);
  });
  it('counted wrongs count one each; two misses give one hint; a third adds none', () => {
    const t = new Turn();
    expect(t.choose(false)).toEqual({ counted: true, glow: false });
    expect(tally([t])).toEqual({ misses: 1, hints: 0 });
    expect(t.choose(false)).toEqual({ counted: true, glow: true });
    expect(tally([t])).toEqual({ misses: 2, hints: 1 });
    t.choose(false);
    expect(tally([t])).toEqual({ misses: 3, hints: 1 });
  });
  it('asking after the glow, or before it, is still one hint', () => {
    const a = new Turn();
    a.choose(false);
    a.choose(false);
    a.ask();
    expect(tally([a]).hints).toBe(1);
    const b = new Turn();
    b.ask();
    b.choose(false);
    b.choose(false);
    expect(tally([b])).toEqual({ misses: 2, hints: 1 });
  });
  it('misses never block the right answer; later choices count nothing', () => {
    const t = new Turn();
    t.choose(false);
    t.choose(false);
    t.choose(false);
    expect(t.choose(true).counted).toBe(false);
    expect(t.done).toBe(true);
    expect(t.choose(false).counted).toBe(false);
    t.ask();
    expect(tally([t])).toEqual({ misses: 3, hints: 1 });
  });
  it('tally sums across turns', () => {
    const a = new Turn();
    const b = new Turn();
    a.choose(false);
    b.ask();
    expect(tally([a, b, new Turn()])).toEqual({ misses: 1, hints: 1 });
  });
});

describe('hints lead somewhere', () => {
  it('a drift ends where nextStep leaves the sea, on the predicted beach', () => {
    const seas: [Sea, readonly number[]][] = [[AUTHORED_1, P1.boats], [AUTHORED_2, P2.boats]];
    for (const seed of seeds) {
      seas.push([predictSea(new Rng(seed)), P1.boats]);
      for (const q of sendRound(new Rng(seed), false)) seas.push([q.sea, P2.boats]);
    }
    for (const [sea, boats] of seas) {
      for (const col of boats) {
        const d = drift(sea, col);
        const last = d.path[d.path.length - 1];
        expect(nextStep(sea, last).next).toBeNull();
        expect(predict(sea, col, d.beach)).toBe(true);
        for (let i = 0; i + 1 < d.path.length; i++) expect(nextStep(sea, d.path[i]).next).toEqual(d.path[i + 1]);
      }
    }
  });
  it('traceAhead follows nextStep for at most three cells', () => {
    for (const seed of seeds) {
      const sea = predictSea(new Rng(seed));
      for (const cell of cellsOf(sea)) {
        for (const ahead of [2, 3]) {
          const t = traceAhead(sea, cell, ahead);
          expect(t.length).toBeLessThanOrEqual(ahead + 1);
          expect(t[0]).toEqual(cell);
          for (let i = 0; i + 1 < t.length; i++) expect(nextStep(sea, t[i]).next).toEqual(t[i + 1]);
        }
        expect(traceAhead(sea, cell).length).toBeLessThanOrEqual(3);
      }
    }
  });
  it('the first of boatsFor is a right boat for each level 2 request', () => {
    for (const seed of seeds) {
      for (const q of sendRound(new Rng(seed), true)) {
        const first = boatsFor(q.sea, P2.boats, q.ask)[0];
        expect(first).toBeDefined();
        expect(drift(q.sea, first).beach).toBe(q.ask);
      }
    }
  });
});

describe('layout', () => {
  const nonOverlap = (L: ReturnType<typeof driftLayout>, view: ReturnType<typeof computeView>) => {
    const all = targetsOf(L!);
    const keep: Box[] = [...cornerButtons(view), petCorner(view)];
    for (let i = 0; i < all.length; i++) {
      const b = all[i];
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(view.w);
      expect(b.y + b.h).toBeLessThanOrEqual(view.h);
      for (const k of keep) expect(overlaps(b, k)).toBe(false);
      for (let j = i + 1; j < all.length; j++) expect(overlaps(b, all[j])).toBe(false);
    }
  };
  for (const level of [1, 2]) {
    it(`level ${level} fits all four views with big targets`, () => {
      for (const view of views) {
        const L = driftLayout(view, level);
        expect(L).not.toBeNull();
        expect(L!.cell).toBeGreaterThanOrEqual(MIN_CELL);
        for (const b of L!.boats) {
          expect(b.w).toBeGreaterThanOrEqual(110);
          expect(b.h).toBeGreaterThanOrEqual(110);
        }
        for (const b of Object.values(L!.beaches)) {
          expect(b.w).toBeGreaterThanOrEqual(110);
          expect(b.h).toBeGreaterThanOrEqual(110);
        }
        expect(L!.boats).toHaveLength(3);
        expect(Object.keys(L!.beaches).sort()).toEqual([...beachesFor(level === 2)].sort());
        nonOverlap(L, view);
      }
    });
    it(`level ${level} cellAt round-trips cellCentre`, () => {
      const plan = PLANS[level - 1];
      for (const view of views) {
        const L = driftLayout(view, level)!;
        for (let r = 0; r < plan.rows; r++) {
          for (let c = 0; c < plan.cols; c++) {
            const p = cellCentre(L, { r, c });
            expect(cellAt(L, plan, p.x, p.y)).toEqual({ r, c });
          }
        }
      }
    });
  }
});
