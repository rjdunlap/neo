import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { stepLevel } from '../../progress/difficulty';
import { thingArt } from './art';
import {
  authoredBoard, beachLayout, deadEndReachable, dotSpots, LEVELS, letGoWays, MAX_HELD, stripSpan, detour, blocker, done, exactSolutions, fieldFor, fits, greedyClears, hintTarget, inPailBox, inPetCorner,
  KINDS_BY_TIER, LEVEL_COUNT, letGo, makeBoard, MAX_PUDDLE_D, moodFor, MOODS, NAMES, NUMBER_KINDS, numeric, passesFilter, placeOn, planFor, PUDDLE_D, puddleStart, soak, soakable, startState, THING_D, thingDiameter,
  refusal, thingOf, type Board, type State,
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

describe('level 9, smallest number first', () => {
  it('numbers on alike things, the puddle at 20 that never grows, the authored six', () => {
    const p = planFor(9);
    expect(p.mode).toBe('order');
    expect(numeric(p)).toBe(true);
    const b = authoredBoard(p);
    expect(b.start).toBe(20);
    expect(b.things.map((t) => t.size).sort((x, y) => x - y)).toEqual([3, 8, 11, 14, 17, 19]);
    expect(b.things.every((t) => NUMBER_KINDS.includes(t.kind))).toBe(true);
    const r = soak(b, startState(b), 1);
    expect(r.ok && r.state.puddle).toBe(20);
  });

  it('over 500 seeds: every value fits from the start, values distinct, the only refusal is the order, the hint is the smallest left', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const b = makeBoard(planFor(9), new Rng(seed));
      expect(b.things.every((t) => fits(b.start, t))).toBe(true);
      expect(new Set(b.things.map((t) => t.size)).size).toBe(b.things.length);
      const s = randomWalk(b, new Rng(seed));
      if (done(b, s)) continue;
      const smallest = Math.min(...s.left.map((id) => thingOf(b, id).size));
      for (const id of s.left) {
        const why = refusal(b, s, id);
        expect(why).toBe(thingOf(b, id).size === smallest ? null : 'order');
      }
      const h = hintTarget(b, s);
      expect(h && 'soak' in h && thingOf(b, h.soak).size).toBe(smallest);
    }
  });
});

describe('level 10, count the dots', () => {
  it('pebbles 1, 2, 3, 4 and 6 for a puddle of 2 that gains one per soak, dots on the plan', () => {
    const p = planFor(10);
    expect(p.mode).toBe('plus');
    expect(p.dots).toBe(true);
    expect(numeric(p)).toBe(true);
    const b = authoredBoard(p);
    expect(b.start).toBe(2);
    expect(b.things.map((t) => t.size).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 6]);
    expect(passesFilter(b)).toBe(true);
  });

  it('draws n distinct dots for every number from 1 to 9, so the dots shown equal the value and the puddle (up to 7)', () => {
    for (let n = 1; n <= 9; n++) {
      const spots = dotSpots(n);
      expect(spots.length).toBe(n);
      expect(new Set(spots.map(([x, y]) => `${x},${y}`)).size).toBe(n);
      for (const [x, y] of spots) expect(Math.abs(x) <= 1 && Math.abs(y) <= 1).toBe(true);
    }
    // The puddle's dots follow its number to the end of the round: 2 at the start, 7 after five soaks.
    const b = authoredBoard(planFor(10));
    let s = startState(b);
    const seen = [s.puddle];
    for (let i = 0; i < 5; i++) {
      const h = hintTarget(b, s)!;
      const r = soak(b, s, (h as { soak: number }).soak);
      expect(r.ok).toBe(true);
      if (r.ok) s = r.state;
      seen.push(s.puddle);
    }
    expect(seen).toEqual([2, 3, 4, 5, 6, 7]);
    expect(dotSpots(s.puddle).length).toBe(7);
  });

  it('over 500 seeds: five distinct values in 1–6, at least two too big at the start, greedy clears, never the fallback', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const b = makeBoard(planFor(10), new Rng(seed));
      expect(b.fallback).toBeUndefined();
      const sizes = b.things.map((t) => t.size);
      expect(sizes.length).toBe(5);
      expect(new Set(sizes).size).toBe(5);
      expect(sizes.every((v) => v >= 1 && v <= 6)).toBe(true);
      expect(b.things.filter((t) => !fits(b.start, t)).length).toBeGreaterThanOrEqual(2);
      expect(greedyClears(b)).toBe(true);
    }
  });

  it('sits between 5 and 6 for pre-K and school, so stepping goes 5, 10, 6 and back', () => {
    for (const band of ['prek', 'school'] as const) {
      const r = LEVELS[band]!;
      expect(r.order).toContain(10);
      expect(r.max).toBeGreaterThanOrEqual(10);
      expect(stepLevel(5, 1, r)).toBe(10);
      expect(stepLevel(10, 1, r)).toBe(6);
      expect(stepLevel(6, -1, r)).toBe(10);
      expect(stepLevel(10, -1, r)).toBe(5);
    }
    expect(LEVELS.prek!.order).toEqual([3, 4, 5, 10, 6]);
  });
});

describe('level 11, too full', () => {
  /** Every in-puddle set she can reach from the start (let go anything; soak back what the pail allows), by sorted ids. */
  function reachable(b: Board) {
    const out = new Map<string, State>();
    const queue = [startState(b)];
    while (queue.length) {
      const s = queue.shift()!;
      const key = [...s.soaked].sort((x, y) => x - y).join(',');
      if (out.has(key)) continue;
      out.set(key, s);
      if (done(b, s)) continue;
      for (const id of s.soaked) queue.push(letGo(b, s, id));
      for (const id of s.left) { const r = soak(b, s, id); if (r.ok) queue.push(r.state); }
    }
    return [...out.values()];
  }

  it('starts with 4, 9, 3 and 6 in a puddle of 2 (24) for a pail of 14; only letting go 4 and 6 together makes it', () => {
    const b = authoredBoard(planFor(11));
    const s = startState(b);
    expect(s.puddle).toBe(24);
    expect(s.left).toEqual([]);
    expect(s.soaked.map((id) => thingOf(b, id).size)).toEqual([4, 9, 3, 6]);
    expect(b.pail).toBe(14);
    expect(letGoWays(b).map((ids) => ids.map((id) => thingOf(b, id).size))).toEqual([[4, 6]]);
    for (const id of s.soaked) expect(done(b, letGo(b, s, id))).toBe(false);
    expect(passesFilter(b)).toBe(true);
  });

  it('a soak back is never too big; it is refused only when it would go past the pail', () => {
    const b = authoredBoard(planFor(11));
    let s = startState(b);
    for (const id of [1, 0, 3]) s = letGo(b, s, id);
    // Left in: the 3 (puddle 5). The 9 is bigger than the puddle but goes back in, to 14.
    expect(s.puddle).toBe(5);
    expect(refusal(b, s, 1)).toBeNull();
    const r = soak(b, s, 1);
    expect(r.ok && r.state.puddle).toBe(14);
    expect(r.ok && done(b, r.state)).toBe(true);
    // With the 9 and the 6 let go (4 and 3 in, so 9), either one back would pass the pail.
    let t = letGo(b, letGo(b, startState(b), 1), 3);
    expect(t.puddle).toBe(9);
    expect(refusal(b, t, 1)).toBe('too-much');
    expect(refusal(b, t, 3)).toBe('too-much');
    // Let the 4 go too (5): the 6 goes back (11), and then the 4 would make 15.
    t = letGo(b, t, 0);
    const u = soak(b, t, 3);
    expect(u.ok).toBe(true);
    expect(u.ok && refusal(b, u.state, 0)).toBe('too-much');
  });

  it('over 500 seeds: all held, start total at most 40, one to three ways of two or more let-gos, never the fallback', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const b = makeBoard(planFor(11), new Rng(seed));
      expect(b.fallback, `seed ${seed}`).toBeUndefined();
      const s = startState(b);
      expect(b.held!.length).toBe(b.things.length);
      expect(b.things.length).toBeLessThanOrEqual(MAX_HELD);
      expect(s.left).toEqual([]);
      expect(s.puddle).toBeLessThanOrEqual(40);
      expect(s.puddle).toBeGreaterThan(b.pail!);
      const ways = letGoWays(b);
      expect(ways.length).toBeGreaterThanOrEqual(1);
      expect(ways.length).toBeLessThanOrEqual(3);
      for (const w of ways) expect(w.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('from every reachable state, the hint reaches the pail within six steps (authored and 200 seeds)', () => {
    const boards = [authoredBoard(planFor(11)), ...Array.from({ length: 200 }, (_, i) => makeBoard(planFor(11), new Rng(i + 1)))];
    for (const [i, b] of boards.entries()) {
      for (const s of reachable(b)) {
        const steps = followHints(b, s, 6);
        expect(steps, `board ${i} at ${s.soaked.join(',')}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('the strip of up to five 100-unit tokens fits inside every view at levels 8 and 11', () => {
    const views = [{ w: 1024, h: 768 }, { w: 1024, h: 1365 }, { w: 1366, h: 768 }, { w: 1180, h: 768 }];
    for (const id of [8, 11]) {
      for (const v of views) {
        const span = stripSpan(planFor(id), MAX_HELD, v.w);
        expect(span.x0).toBeGreaterThanOrEqual(150);
        expect(span.x1).toBeLessThanOrEqual(v.w - 40);
      }
    }
    // Level 8 never holds more than five: its smallest six distinct numbers already pass any pail.
    expect(1 + 2 + 3 + 4 + 5 + 6 + 3).toBeGreaterThan(20);
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

describe('kinds and beach moods', () => {
  const allKinds = [...new Set([...Object.values(KINDS_BY_TIER).flat(), ...NUMBER_KINDS])];

  it('every tier has at least four kinds, and no kind is in two tiers', () => {
    for (const kinds of Object.values(KINDS_BY_TIER)) expect(kinds.length).toBeGreaterThanOrEqual(4);
    const tiered = Object.values(KINDS_BY_TIER).flat();
    expect(new Set(tiered).size).toBe(tiered.length);
  });

  it('numbered levels draw from five alike kinds, sea glass and the button among them', () => {
    expect(NUMBER_KINDS).toEqual(expect.arrayContaining(['seaglass', 'button']));
    expect(NUMBER_KINDS.length).toBe(5);
  });

  it('every kind has a name and draws at every tier size', () => {
    for (const k of allKinds) {
      expect(NAMES[k]).toMatch(/^[a-z ]+$/);
      for (const d of THING_D.slice(1)) {
        const g = thingArt(k, d);
        const b = g.getLocalBounds();
        expect(b.width, `${k} at ${d}`).toBeGreaterThan(d * 0.4);
        expect(b.width, `${k} at ${d}`).toBeLessThanOrEqual(d * 1.15);
        g.destroy();
      }
    }
  });

  it('level 5 boards show at least three different tier-4 kinds over 500 seeds, and numbered boards use every number kind', () => {
    const tier4 = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) for (const t of makeBoard(planFor(5), new Rng(seed)).things) if (t.size === 4) tier4.add(t.kind);
    expect(tier4.size).toBeGreaterThanOrEqual(3);
    for (const id of [6, 7, 8]) {
      const used = new Set<string>();
      for (let seed = 1; seed <= 200; seed++) for (const t of makeBoard(planFor(id), new Rng(seed)).things) used.add(t.kind);
      expect([...used].sort()).toEqual([...NUMBER_KINDS].sort());
    }
  });

  it('the mood is seeded, every mood turns up, and drawing it after the board leaves the board unchanged', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const a = new Rng(seed), b = new Rng(seed);
      const board = makeBoard(planFor(4), a);
      const layoutSeed = a.int(1, 1e9);
      const mood = moodFor(new Rng(a.int(1, 1e9)));
      expect(moodFor(new Rng(seed))).toBe(moodFor(new Rng(seed)));
      expect(makeBoard(planFor(4), b)).toEqual(board);
      expect(b.int(1, 1e9)).toBe(layoutSeed);
      expect(MOODS).toContain(mood);
      seen.add(mood);
    }
    expect(seen.size).toBe(MOODS.length);
  });
});
