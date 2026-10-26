import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  CELLS, cellAt, cellOf, cellRect, cellsOfMask, centre, check, COLS, connected, connectedSets, drawnRows, FenceHeap, fenceCount,
  fenceEdges, FIELDS, fieldCells, flowersOf, GLOW_AFTER, groups, HOME_CORNER, holes, makeTasks, meadowLayout, neighbours,
  nextCell, PenTally, penOf, PET_CORNER, planFor, PLANS, ROWS, sharedEdges, targetFor, targets, xOf, yOf,
  type Cell, type Request, type Task,
} from './logic';

const SEEDS = 300;
const VIEWS = [
  computeView(1024, 768), computeView(768, 1024), computeView(844, 390),
  computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
];

/** A seeded paint/lift walk: every intermediate painted list (in paint order), up to 8 cells. */
function walk(seed: number, steps = 40): Cell[][] {
  const rng = new Rng(seed);
  const painted: Cell[] = [];
  const states: Cell[][] = [];
  for (let i = 0; i < steps; i++) {
    const c = rng.int(0, CELLS - 1);
    const at = painted.indexOf(c);
    if (at >= 0) painted.splice(at, 1);
    else if (painted.length < 8) painted.push(c);
    states.push([...painted]);
  }
  return states;
}
const mask = (cells: Iterable<Cell>) => [...cells].reduce((m, c) => m | (1 << c), 0);
const allSets = (n: number) => connectedSets(n).map((m) => new Set(cellsOfMask(m)));

describe('pen and flowers', () => {
  it('the pen is the largest side group, ties to the earliest-painted cell; corner cells are flowers', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      for (const painted of walk(seed)) {
        const pen = penOf(painted);
        if (!painted.length) { expect(pen.size).toBe(0); continue; }
        const gs = groups(painted);
        expect(gs.map((g) => g.length)).toContain(pen.size);
        expect(pen.size).toBe(Math.max(...gs.map((g) => g.length)));
        expect(connected([...pen])).toBe(true);
        const biggest = gs.filter((g) => g.length === pen.size);
        const first = (g: Cell[]) => Math.min(...g.map((c) => painted.indexOf(c)));
        const winner = biggest.reduce((a, b) => (first(b) < first(a) ? b : a));
        expect(new Set(winner)).toEqual(pen);
        const flowers = flowersOf(painted, pen);
        expect(flowers.length + pen.size).toBe(painted.length);
        for (const f of flowers) expect(pen.has(f)).toBe(false);
      }
    }
  });
  it('a diagonal touch is a flower; a side touch joins', () => {
    const a = cellOf(1, 1);
    expect(penOf([a, cellOf(2, 2), cellOf(2, 3)]).has(a)).toBe(false);
    expect(penOf([a, cellOf(2, 2), cellOf(2, 3)]).size).toBe(2);
    expect(penOf([a, cellOf(3, 3), cellOf(2, 1)])).toEqual(new Set([a, cellOf(2, 1)]));
    expect(penOf([a, cellOf(3, 3), cellOf(2, 1), cellOf(3, 3 - 1)]).size).toBe(2);
    expect(penOf([a, cellOf(3, 1), cellOf(2, 1)]).size).toBe(3);
  });
});

describe('fence count', () => {
  it('equals 4n - 2 x shared edges for every connected set of 1-8 cells, holes included', () => {
    for (let n = 1; n <= 8; n++) {
      for (const cells of allSets(n)) {
        expect(fenceCount(cells)).toBe(4 * n - 2 * sharedEdges(cells));
        expect(fenceEdges(cells)).toHaveLength(fenceCount(cells));
      }
    }
  });
  it('counts a holed ring and reports its pond', () => {
    const ring = new Set<Cell>();
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) if (x !== 1 || y !== 1) ring.add(cellOf(x, y));
    expect(ring.size).toBe(8);
    expect(holes(ring)).toEqual([cellOf(1, 1)]);
    expect(fenceCount(ring)).toBe(4 * 8 - 2 * sharedEdges(ring));
    expect(holes(new Set([cellOf(0, 0), cellOf(1, 0)]))).toEqual([]);
  });
});

describe('check', () => {
  it('level 1 accepts exactly the right size, flowers never matter', () => {
    for (let n = 3; n <= 8; n++) {
      for (let m = 1; m <= 8; m++) {
        for (const cells of allSets(m)) {
          if (cells.size > 8) continue;
          expect(check(cells, { squares: n }).kind).toBe(m === n ? 'ok' : 'squares');
        }
        if (m > 4) break;
      }
      for (let seed = 1; seed <= 40; seed++) {
        for (const painted of walk(seed)) {
          const pen = penOf(painted);
          if (!pen.size) { expect(check(pen, { squares: n }).kind).toBe('empty'); continue; }
          expect(check(pen, { squares: n }).kind).toBe(pen.size === n ? 'ok' : 'squares');
        }
      }
    }
  });
  it('level 1 accepts every connected set of the asked size (full enumeration)', () => {
    for (let n = 3; n <= 8; n++) for (const cells of allSets(n)) expect(check(cells, { squares: n }).kind).toBe('ok');
  });
  it('level 3: six-cell fence counts are exactly {10,12,14}; {6,10} only takes 2x3 and 3x2', () => {
    const six = allSets(6);
    expect(new Set(six.map(fenceCount))).toEqual(new Set([10, 12, 14]));
    const tens = six.filter((s) => check(s, { squares: 6, fence: 10 }).kind === 'ok');
    expect(tens.length).toBeGreaterThan(0);
    for (const s of tens) {
      const xs = [...s].map(xOf);
      const ys = [...s].map(yOf);
      const w = Math.max(...xs) - Math.min(...xs) + 1;
      const h = Math.max(...ys) - Math.min(...ys) + 1;
      expect(w * h).toBe(6);
      expect([2, 3]).toContain(w);
    }
    // every 2x3 and 3x2 window is accepted
    expect(tens).toHaveLength((COLS - 2) * (ROWS - 1) + (COLS - 1) * (ROWS - 2));
    for (const f of [12, 14]) expect(six.some((s) => check(s, { squares: 6, fence: f }).kind === 'ok')).toBe(true);
    const wrong = six.find((s) => fenceCount(s) === 12)!;
    expect(check(wrong, { squares: 6, fence: 10 })).toEqual({ kind: 'fence', have: 12, want: 10 });
    expect(check(new Set([0, 1, 2]), { squares: 6, fence: 10 })).toEqual({ kind: 'squares', have: 3, want: 6 });
  });
});

describe('level-2 card table', () => {
  it('has distinct cards, one right, one fence, one plausible slip', () => {
    expect(FIELDS[0]).toMatchObject({ rows: 2, cols: 3 });
    for (const f of FIELDS) {
      expect(new Set([f.right, f.fence, f.third]).size).toBe(3);
      expect(f.right).toBe(f.rows * f.cols);
      expect(f.fence).toBe(2 * (f.rows + f.cols));
      const slips = [f.rows + f.cols, (f.rows + 1) * f.cols, (f.rows - 1) * f.cols];
      expect(slips).toContain(f.third);
      expect(f.third).not.toBe(f.right);
      expect(f.rows === 4 && f.cols === 4).toBe(false);
      // fits the grid in both orientations (portrait transposes)
      expect(f.rows <= ROWS && f.cols <= COLS).toBe(true);
      const cells = new Set(fieldCells(f));
      expect(cells.size).toBe(f.right);
      expect(fenceCount(cells)).toBe(f.fence);
      expect(connected([...cells])).toBe(true);
    }
  });
  it('drawnRows are model rows in landscape and model columns when tall', () => {
    for (const f of FIELDS) {
      const wide = drawnRows(f, false);
      expect(wide).toHaveLength(f.rows);
      for (const r of wide) expect(r).toHaveLength(f.cols);
      const tall = drawnRows(f, true);
      expect(tall).toHaveLength(f.cols);
      for (const r of tall) expect(r).toHaveLength(f.rows);
      expect(new Set(tall.flat())).toEqual(new Set(fieldCells(f)));
    }
  });
});

describe('hints', () => {
  it('targetFor passes check, is connected, inside the grid and keeps maximal overlap (levels 1)', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const n = 3 + (seed % 6);
      for (const painted of walk(seed)) {
        const pen = penOf(painted);
        const req: Request = { squares: n };
        const t = targetFor(pen, req);
        expect(check(t, req).kind).toBe('ok');
        expect(connected([...t])).toBe(true);
        for (const c of t) expect(c >= 0 && c < CELLS).toBe(true);
        expect([...pen].filter((c) => t.has(c)).length).toBe(Math.min(pen.size, n));
      }
    }
  });
  it('targetFor at level 3 is a best-overlap passing set against the full enumeration', () => {
    for (const fence of [10, 12, 14]) {
      const req: Request = { squares: 6, fence };
      const pool = allSets(6).filter((s) => fenceCount(s) === fence);
      for (let seed = 1; seed <= 60; seed++) {
        for (const painted of walk(seed)) {
          const pen = penOf(painted);
          const t = targetFor(pen, req);
          expect(check(t, req).kind).toBe('ok');
          const best = Math.max(...pool.map((s) => [...pen].filter((c) => s.has(c)).length));
          expect([...pen].filter((c) => t.has(c)).length).toBe(best);
        }
      }
    }
  });
  it('applying nextCell repeatedly reaches exactly the target', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const reqs: Request[] = [{ squares: 3 + (seed % 6) }, { squares: 6, fence: [10, 12, 14][seed % 3] }];
      for (const req of reqs) {
        const states = walk(seed);
        const painted = [...states[seed % states.length]];
        const target = targetFor(penOf(painted), req);
        let guard = 0;
        for (let c = nextCell(painted, target); c !== null; c = nextCell(painted, target)) {
          const at = painted.indexOf(c);
          if (at >= 0) painted.splice(at, 1); else painted.push(c);
          expect(++guard).toBeLessThan(40);
        }
        expect(mask(painted)).toBe(mask(target));
        expect(check(penOf(painted), req).kind).toBe('ok');
      }
    }
  });
  it('nextCell prefers a missing cell touching the target part already painted', () => {
    const target = new Set([cellOf(0, 0), cellOf(1, 0), cellOf(2, 0)]);
    expect(nextCell([cellOf(2, 0)], target)).toBe(cellOf(1, 0));
    expect(nextCell([cellOf(0, 0), cellOf(1, 0), cellOf(2, 0)], target)).toBeNull();
  });
});

describe('PenTally', () => {
  it('counts only failed non-empty rings and wrong cards', () => {
    const t = new PenTally();
    expect(t.ring({ kind: 'empty' })).toBe('invite');
    expect(t.ring({ kind: 'ok' })).toBe('ok');
    expect(t.card(true)).toBe('ok');
    expect(t.misses).toBe(0);
    expect(t.hints).toBe(0);
    expect(t.ring({ kind: 'squares', have: 3, want: 4 })).toBe('miss');
    expect(t.misses).toBe(1);
    expect(t.card(false)).toBe('glow');
    expect(t).toMatchObject({ misses: 2, hints: 1, glowing: true });
  });
  it('two misses give one glow and one hint, further misses add no hint', () => {
    expect(GLOW_AFTER).toBe(2);
    const t = new PenTally();
    const bad = { kind: 'fence', have: 12, want: 10 } as const;
    const results = [t.ring(bad), t.ring(bad), t.ring(bad), t.ring(bad)];
    expect(results).toEqual(['miss', 'glow', 'miss', 'miss']);
    expect(t.hints).toBe(1);
    expect(t.glow()).toBe(false);
    expect(t.hints).toBe(1);
  });
  it('Show a hint counts once per pen and next() resets', () => {
    const t = new PenTally();
    expect(t.glow()).toBe(true);
    expect(t.glow()).toBe(false);
    expect(t.hints).toBe(1);
    t.next();
    expect(t).toMatchObject({ wrongs: 0, glowing: false });
    expect(t.glow()).toBe(true);
    expect(t.hints).toBe(2);
    expect(t.misses).toBe(0);
    t.next();
    t.ring({ kind: 'squares', have: 1, want: 4 });
    expect(t.wrongs).toBe(1);
    expect(t.glowing).toBe(false);
  });
});

describe('FenceHeap', () => {
  it('never leaves fewer than six pieces', () => {
    const heap = new FenceHeap();
    for (let used = 0; used <= 40; used++) {
      heap.use(used);
      expect(heap.left(used)).toBeGreaterThanOrEqual(6);
    }
    expect(new FenceHeap().use(10)).toBe(false);
    expect(new FenceHeap().use(15)).toBe(true);
    expect(new FenceHeap().left(25)).toBe(0);
  });
});

describe('orientation', () => {
  it('transposing keeps pen size, fence count and check result', () => {
    // Transposed set on a 4-column by 6-row grid: model (x, y) becomes (y, x).
    const T = 4;
    const tc = (c: Cell) => xOf(c) * T + yOf(c);
    const shared = (s: Set<number>) => {
      let n = 0;
      for (const c of s) {
        if ((c % T) + 1 < T && s.has(c + 1)) n++;
        if (Math.floor(c / T) + 1 < COLS && s.has(c + T)) n++;
      }
      return n;
    };
    for (let seed = 1; seed <= 100; seed++) {
      for (const painted of walk(seed)) {
        const pen = penOf(painted);
        const flipped = new Set([...pen].map(tc));
        expect(flipped.size).toBe(pen.size);
        if (!pen.size) continue;
        expect(4 * flipped.size - 2 * shared(flipped)).toBe(fenceCount(pen));
        expect(sharedEdges(pen)).toBe(shared(flipped));
      }
    }
  });
  it('cellAt inverts cellRect in both orientations', () => {
    for (const view of VIEWS) {
      const l = meadowLayout(view, 1)!;
      for (let c = 0; c < CELLS; c++) {
        const m = centre(cellRect(l, c));
        expect(cellAt(l, m.x, m.y)).toBe(c);
      }
      expect(cellAt(l, l.grid.x - 20, l.grid.y)).toBeNull();
    }
    const tall = meadowLayout(computeView(768, 1280), 1)!;
    expect(tall.tall).toBe(true);
    expect(meadowLayout(computeView(768, 1024), 1)!.tall).toBe(true);
    for (let c = 0; c < CELLS; c++) {
      const m = centre(cellRect(tall, c));
      expect(cellAt(tall, m.x, m.y)).toBe(c);
    }
  });
});

describe('rounds', () => {
  const pens = (ts: Task[]) => ts.map((t) => (t.kind === 'pen' ? t.request : null)!);
  it('level 1 starts at 4 squares and never repeats a size', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const sq = pens(makeTasks(planFor(1), new Rng(seed))).map((r) => r.squares);
      expect(sq).toHaveLength(planFor(1).count);
      expect(sq[0]).toBe(4);
      expect(new Set(sq).size).toBe(sq.length);
      for (const s of sq) expect(s >= 3 && s <= 8).toBe(true);
      expect(makeTasks(planFor(1), new Rng(seed), 2)).toHaveLength(2);
    }
  });
  it('level 2 starts with the 2x3 field, never repeats, five fields with three shuffled cards', () => {
    const sig = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const tasks = makeTasks(planFor(2), new Rng(seed));
      expect(tasks).toHaveLength(5);
      const fields = tasks.map((t) => (t.kind === 'field' ? t.field : null)!);
      expect(fields[0]).toBe(FIELDS[0]);
      expect(new Set(fields).size).toBe(5);
      for (const t of tasks) {
        if (t.kind !== 'field') throw new Error('field expected');
        expect([...t.cards].sort((a, b) => a - b)).toEqual([t.field.right, t.field.fence, t.field.third].sort((a, b) => a - b));
      }
      sig.add(fields.map((f) => f.right).join());
      expect(makeTasks(planFor(2), new Rng(seed), 3)).toHaveLength(3);
    }
    expect(sig.size).toBeGreaterThan(1);
  });
  it('level 3 holds fences 10 first, then 12 and 14 once each, all of six squares', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rs = pens(makeTasks(planFor(3), new Rng(seed)));
      expect(rs.map((r) => r.fence)[0]).toBe(10);
      expect(rs.map((r) => r.fence!).sort()).toEqual([10, 12, 14]);
      for (const r of rs) expect(r.squares).toBe(6);
      expect(makeTasks(planFor(3), new Rng(seed), 2)).toHaveLength(2);
    }
  });
  it('is the same for the same seed and planFor clamps', () => {
    for (const p of PLANS.filter((p) => p.level <= 3)) expect(makeTasks(p, new Rng(7))).toEqual(makeTasks(p, new Rng(7)));
    expect(planFor(0).level).toBe(1);
    expect(planFor(9).level).toBe(5);
  });
  it('every task is solvable on the grid', () => {
    for (const p of PLANS.filter((p) => p.level <= 3)) {
      for (const t of makeTasks(p, new Rng(3))) {
        if (t.kind === 'pen') expect(allSets(t.request.squares).some((s) => check(s, t.request).kind === 'ok')).toBe(true);
        else expect(t.cards).toContain(t.field.right);
      }
    }
  });
});

describe('layout', () => {
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const level of [1, 2, 3]) {
    VIEWS.forEach((view, i) => {
      it(`level ${level} fits view ${i} with full-size targets`, () => {
        const l = meadowLayout(view, level);
        expect(l).not.toBeNull();
        if (!l) return;
        expect(l.grid.cell).toBeGreaterThanOrEqual(100);
        expect(l.bubble.w).toBeGreaterThanOrEqual(220);
        expect(l.bubble.h).toBeGreaterThanOrEqual(120);
        expect(l.bell.w).toBeGreaterThanOrEqual(120);
        expect(l.bell.h).toBeGreaterThanOrEqual(120);
        if (level === 2) {
          expect(l.cards).toHaveLength(3);
          for (const c of l.cards!) { expect(c.w).toBeGreaterThanOrEqual(130); expect(c.h).toBeGreaterThanOrEqual(130); }
          expect(l.stack).toBeNull();
        } else {
          expect(l.cards).toBeNull();
          expect(l.stack).not.toBeNull();
        }
        const ts = targets(l);
        for (let a = 0; a < ts.length; a++) {
          const r = ts[a];
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(view.w);
          expect(r.y + r.h).toBeLessThanOrEqual(view.h);
          expect(overlaps(r, { x: 0, y: view.h - PET_CORNER.h, w: PET_CORNER.w, h: PET_CORNER.h })).toBe(false);
          expect(overlaps(r, { x: 0, y: 0, w: HOME_CORNER.w, h: HOME_CORNER.h })).toBe(false);
          for (let b = a + 1; b < ts.length; b++) {
            const s = ts[b];
            const gap = Math.max(s.x - (r.x + r.w), r.x - (s.x + s.w), s.y - (r.y + r.h), r.y - (s.y + s.h));
            expect(gap).toBeGreaterThanOrEqual(30);
          }
        }
      });
    });
  }
});

describe('neighbours', () => {
  it('stay inside the grid', () => {
    for (let c = 0; c < CELLS; c++) for (const n of neighbours(c)) expect(n >= 0 && n < CELLS).toBe(true);
    expect(neighbours(0)).toHaveLength(2);
    expect(neighbours(cellOf(2, 1))).toHaveLength(4);
  });
});

describe('meadow pens drawing', () => {
  it('draws a fence piece on the transposed side in portrait, so no rail sits between two pen squares', async () => {
    const { drawnSide, fenceEdges, cellRect, meadowLayout } = await import('./logic');
    const { computeView } = await import('../../engine/view');
    const l = meadowLayout(computeView(768, 1024), 3)!;
    const pen = new Set([0, 1, 2, 3, 4, 5]);
    for (const e of fenceEdges(pen)) {
      const r = cellRect(l, e.cell);
      const side = drawnSide(e.side, l.tall);
      const probe = { right: [r.x + r.w + 20, r.y + r.h / 2], left: [r.x - 20, r.y + r.h / 2], down: [r.x + r.w / 2, r.y + r.h + 20], up: [r.x + r.w / 2, r.y - 20] }[side];
      const { cellAt } = await import('./logic');
      const beyond = cellAt(l, probe[0], probe[1]);
      expect(beyond === null || !pen.has(beyond)).toBe(true);
    }
  });
});
