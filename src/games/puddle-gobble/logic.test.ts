import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  authoredBoard, beachLayout, deadEndReachable, detour, blocker, done, exactSolutions, fieldFor, fits, greedyClears, hintTarget, inPailBox, inPetCorner,
  LEVEL_COUNT, letGo, makeBoard, MAX_PUDDLE_D, passesFilter, placeOn, planFor, PUDDLE_D, puddleStart, soak, soakable, startState, THING_D, thingDiameter,
  thingOf, type Board, type State,
} from './logic';

const plans = Array.from({ length: LEVEL_COUNT }, (_, i) => planFor(i + 1));

/** Soak whatever the hint says (soaks and let-gos) until done; returns the steps taken, or -1 if a soak was refused. */
function followHints(board: Board, s: State, limit = 30) {
  for (let step = 0; step < limit; step++) {
    if (done(board, s)) return step;
    const h = hintTarget(board, s);
    if (!h) return -1;
    if ('letGo' in h) s = letGo(board, s, h.letGo);
    else {
      const r = soak(board, s, h.soak);
      if (!r.ok) return -1;
      s = r.state;
    }
  }
  return -1;
}

function randomWalk(board: Board, rng: Rng) {
  let s = startState(board);
  const n = rng.int(0, board.things.length);
  for (let i = 0; i < n; i++) {
    const can = soakable(board, s);
    if (!can.length) break;
    const r = soak(board, s, rng.pick(can));
    if (r.ok) s = r.state;
  }
  return s;
}

describe('the fit rule and growth', () => {
  it('fits exactly when the size is at most the puddle', () => {
    expect(fits(2, { id: 0, kind: 'shell', size: 2 })).toBe(true);
    expect(fits(2, { id: 0, kind: 'ball', size: 3 })).toBe(false);
  });

  it('draws a soakable thing strictly smaller than its puddle and the next tier strictly bigger', () => {
    for (let k = 1; k <= 4; k++) {
      expect(THING_D[k]).toBeLessThan(PUDDLE_D[k]);
      if (k < 4) expect(THING_D[k + 1]).toBeGreaterThan(PUDDLE_D[k]);
    }
  });

  it('grows every `grow` soaks, capped at tier 4', () => {
    const b = authoredBoard(planFor(4));
    let s = startState(b);
    const tiers: number[] = [];
    for (const id of [0, 2, 5, 1, 4, 6, 3]) {
      const r = soak(b, s, id);
      expect(r.ok).toBe(true);
      if (r.ok) s = r.state;
      tiers.push(s.puddle);
    }
    expect(tiers).toEqual([1, 1, 2, 2, 2, 3, 3]);
    const big: Board = { plan: planFor(2), start: 4, things: [0, 1, 2].map((id) => ({ id, kind: 'shell', size: 1 })) };
    let t = startState(big);
    for (const id of [0, 1, 2]) { const r = soak(big, t, id); if (r.ok) t = r.state; }
    expect(t.puddle).toBe(4);
  });

  it('adds one at level 6 and the number at 7–8', () => {
    const six = authoredBoard(planFor(6));
    const r6 = soak(six, startState(six), 0);
    expect(r6.ok && r6.state.puddle).toBe(4);
    const seven = authoredBoard(planFor(7));
    const r7 = soak(seven, startState(seven), 1);
    expect(r7.ok && r7.state.puddle).toBe(8);
  });
});

describe('refusals', () => {
  it('a too-big touch never changes the state', () => {
    const b = authoredBoard(planFor(2));
    const s = startState(b);
    expect(soak(b, s, 2)).toEqual({ ok: false, reason: 'too-big' });
    expect(s).toEqual(startState(b));
  });

  it('level 5 refuses by order exactly when a strictly smaller tier is left, same tiers in any order', () => {
    const b = authoredBoard(planFor(5));
    let s = startState(b);
    expect(soak(b, s, 4)).toEqual({ ok: false, reason: 'order' });
    const r = soak(b, s, 0);
    expect(r.ok).toBe(true);
    if (r.ok) s = r.state;
    expect(soak(b, s, 3).ok).toBe(true);
    expect(soak(b, s, 1).ok).toBe(true);
  });

  it('level 8 refuses too-much exactly when puddle + number passes the pail', () => {
    const b = authoredBoard(planFor(8));
    let s = startState(b);
    for (const id of [1, 2]) { const r = soak(b, s, id); if (r.ok) s = r.state; }
    expect(s.puddle).toBe(12);
    expect(soak(b, s, 5)).toEqual({ ok: false, reason: 'too-much' });
  });
});

describe('the authored first rounds', () => {
  it('level 1: everything fits; five soaks finish', () => {
    const b = authoredBoard(planFor(1));
    expect(passesFilter(b)).toBe(true);
    expect(followHints(b, startState(b))).toBe(5);
  });

  it('level 2: the boat fits after exactly two soaks', () => {
    const b = authoredBoard(planFor(2));
    let s = startState(b);
    expect(fits(s.puddle, thingOf(b, 2))).toBe(false);
    const r1 = soak(b, s, 0);
    if (r1.ok) s = r1.state;
    expect(fits(s.puddle, thingOf(b, 2))).toBe(false);
    const r2 = soak(b, s, 1);
    if (r2.ok) s = r2.state;
    expect(fits(s.puddle, thingOf(b, 2))).toBe(true);
  });

  it('every authored board passes its own filter', () => {
    for (const p of plans) expect(passesFilter(authoredBoard(p)), p.name).toBe(true);
  });

  it('level 8: one exact total, 3 then 5 dead-ends, and 9 at 12 is refused', () => {
    const b = authoredBoard(planFor(8));
    const sols = exactSolutions(b);
    expect(sols.map((ids) => ids.map((id) => thingOf(b, id).size))).toEqual([[2, 3, 6]]);
    let s = startState(b);
    for (const id of [1, 2]) { const r = soak(b, s, id); expect(r.ok).toBe(true); if (r.ok) s = r.state; }
    expect(exactSolutions(b, s)).toEqual([]);
    expect(soak(b, s, 5)).toEqual({ ok: false, reason: 'too-much' });
    expect(hintTarget(b, s)).toEqual({ letGo: 2 });
  });
});

describe('generation', () => {
  it('is well formed, passes its filter, repeats by seed and never needs the fallback', () => {
    for (const p of plans) {
      for (let seed = 1; seed <= 500; seed++) {
        const b = makeBoard(p, new Rng(seed));
        expect(b.fallback, `${p.name} seed ${seed}`).toBeUndefined();
        expect(passesFilter(b)).toBe(true);
        expect(new Set(b.things.map((t) => t.id)).size).toBe(b.things.length);
        expect(b.things.length).toBeLessThanOrEqual(8);
      }
      expect(makeBoard(p, new Rng(7))).toEqual(makeBoard(p, new Rng(7)));
    }
  });
});

describe('never a dead end at levels 1–7', () => {
  it('greedy clears from the start and from sampled reachable states', () => {
    for (const p of plans.filter((q) => q.mode !== 'pail')) {
      for (let seed = 1; seed <= 500; seed++) {
        const b = makeBoard(p, new Rng(seed));
        expect(greedyClears(b)).toBe(true);
        if (seed <= 40) {
          const rng = new Rng(seed * 31);
          for (let i = 0; i < 5; i++) expect(greedyClears(b, randomWalk(b, rng))).toBe(true);
        }
      }
    }
  });
});

describe('level 8', () => {
  it('has one to six exact totals and a reachable dead end', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const b = makeBoard(planFor(8), new Rng(seed));
      const n = exactSolutions(b).length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
      expect(deadEndReachable(b)).toBe(true);
    }
  });

  it('from every reachable strip state, the hint reaches the pail within 8 steps', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const b = makeBoard(planFor(8), new Rng(seed));
      // Every subset soaked in a fitting order is reachable; walk them all.
      const seen = new Set<string>();
      const visit = (s: State) => {
        const key = [...s.soaked].sort().join(',');
        if (seen.has(key)) return;
        seen.add(key);
        const steps = followHints(b, s, 8);
        expect(steps, `seed ${seed} at ${key}`).toBeGreaterThanOrEqual(0);
        for (const id of soakable(b, s)) { const r = soak(b, s, id); if (r.ok && !done(b, r.state)) visit(r.state); }
      };
      visit(startState(b));
    }
  });
});

describe('the bot', () => {
  it('finishes every plan over 200 seeds with zero refusals by following the hint', () => {
    for (const p of plans) {
      for (let seed = 1; seed <= 200; seed++) {
        const b = makeBoard(p, new Rng(seed));
        expect(followHints(b, startState(b)), `${p.name} seed ${seed}`).toBeGreaterThan(0);
      }
    }
  });

  it('level 5 hints the smallest thing left', () => {
    const b = authoredBoard(planFor(5));
    expect(hintTarget(b, startState(b))).toEqual({ soak: 0 });
  });

  it('a detour goes round a thing in the way, clear on both legs', () => {
    const f = { x0: 40, y0: 130, x1: 984, y1: 728 };
    const a = { x: 200, y: 400 }, b = { x: 800, y: 400 };
    const others = [{ x: 500, y: 410, r: 60 }];
    expect(blocker(a, b, 75, others)).not.toBeNull();
    const w = detour(a, b, 75, others, f)!;
    expect(w).not.toBeNull();
    expect(blocker(a, w, 75, others)).toBeNull();
    expect(blocker(w, b, 75, others)).toBeNull();
  });
});

describe('the beach layout', () => {
  const views = [{ w: 1024, h: 768 }, { w: 1024, h: 1365 }, { w: 1366, h: 768 }, { w: 1180, h: 768 }];

  it('keeps every thing inside the field, clear of the pet, the pail and each other, on every view', () => {
    for (const p of plans) {
      for (let seed = 1; seed <= 60; seed++) {
        const b = makeBoard(p, new Rng(seed));
        const placed = beachLayout(b, new Rng(seed + 1000));
        expect(placed.length).toBe(b.things.length);
        for (const v of views) {
          const f = fieldFor(p, v);
          const start = puddleStart(p, f);
          const pts = placed.map((q) => ({ ...placeOn(f, q), r: thingDiameter(p, thingOf(b, q.id)) / 2 }));
          for (const [i, q] of pts.entries()) {
            expect(q.x - q.r).toBeGreaterThanOrEqual(f.x0 - 0.01);
            expect(q.x + q.r).toBeLessThanOrEqual(f.x1 + 0.01);
            expect(q.y - q.r).toBeGreaterThanOrEqual(f.y0 - 0.01);
            expect(q.y + q.r).toBeLessThanOrEqual(f.y1 + 0.01);
            expect(q.x === 0 && q.y === 0).toBe(false);
            expect(inPetCorner(v, q.x, q.y, q.r)).toBe(false);
            expect(inPailBox(p, f, q.x, q.y, q.r)).toBe(false);
            expect(Math.hypot(q.x - start.x, q.y - start.y)).toBeGreaterThanOrEqual(MAX_PUDDLE_D / 2 + q.r - 0.01);
            for (const o of pts.slice(i + 1)) expect(Math.hypot(o.x - q.x, o.y - q.y)).toBeGreaterThanOrEqual(o.r + q.r + 30 - 0.01);
          }
        }
      }
    }
  });

  it('gives the same board on every view', () => {
    const b = makeBoard(planFor(4), new Rng(3));
    expect(beachLayout(b, new Rng(9))).toEqual(beachLayout(b, new Rng(9)));
  });
});
