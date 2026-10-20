import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  allShortest, anchors, apply, cloneBed, decode, emptyBed, encode, FIRST_GARDEN, fits, fullLines, gardenLayout, goalMet, has,
  hintPlacement, makeGarden, mirrorShape, nearestAnchor, noRoom, passesFilter, place, placements, PLANS, planFor, popcount,
  RIDE, search, SEARCH_CAP, SHAPES, solve, startState, transformGarden, trayIndex, trayNow, type Garden, type State,
} from './logic';
import { GARDENS } from './puzzles';

const VIEWS = Object.entries({
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
});
const count = (rows: number[]) => rows.reduce((a, m) => a + popcount(m), 0);
const shortest = (g: Garden, s: State) => solve(g, s, 2_000_000)?.length ?? Infinity;

describe('shapes', () => {
  it('every shape has its mirror in the library, and the mirror of a mirror is itself', () => {
    for (const id of Object.keys(SHAPES)) expect(mirrorShape(mirrorShape(id))).toBe(id);
  });
});

describe('fits and place', () => {
  it('a placement is legal only inside the bed on empty squares', () => {
    const bed = emptyBed(5);
    bed.filled[2] = 0b00011;
    expect(fits(bed, 'domino-0', { r: 2, c: 2 })).toBe(true);
    expect(fits(bed, 'domino-0', { r: 2, c: 1 })).toBe(false);
    expect(fits(bed, 'domino-0', { r: 2, c: 4 })).toBe(false);
    expect(fits(bed, 'domino-1', { r: 4, c: 0 })).toBe(false);
  });

  it('full rows and columns empty together; a square in both is emptied once; buds there bloom', () => {
    const bed = emptyBed(5);
    bed.filled = [0b00001, 0b00001, 0b11110, 0b00001, 0b00001];
    bed.stones = bed.filled.slice();
    bed.buds = [0b00001, 0, 0b00010, 0, 0];
    const out = place(bed, 'mono-0', { r: 2, c: 0 });
    expect(out.rows).toEqual([2]);
    expect(out.cols).toEqual([0]);
    expect(out.bed.filled.every((m) => m === 0)).toBe(true);
    expect(out.bloomed.length).toBe(2);
    expect(goalMet(out.bed, 'buds')).toBe(true);
    expect(goalMet(out.bed, 'clear')).toBe(true);
  });

  it('conserves squares: planted minus emptied is the change in filled squares, and the old bed is untouched', () => {
    const rng = new Rng(3);
    for (let t = 0; t < 300; t++) {
      const bed = emptyBed(6);
      for (let r = 0; r < 6; r++) bed.filled[r] = rng.int(0, 62) & 0b111111;
      if (fullLines(bed)) continue;
      const before = cloneBed(bed);
      const id = rng.pick(Object.keys(SHAPES).filter((k) => SHAPES[k].w <= 6 && SHAPES[k].h <= 6));
      for (const a of anchors(bed, id)) {
        const out = place(bed, id, a);
        let emptied = 0;
        const planted = SHAPES[id].cells.length;
        for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if ((out.rows.includes(r) || out.cols.includes(c)) && (has(bed.filled, r, c) || SHAPES[id].cells.some(([pr, pc]) => pr + a.r === r && pc + a.c === c))) emptied++;
        expect(count(out.bed.filled) - count(bed.filled)).toBe(planted - emptied);
        expect(fullLines(out.bed)).toBe(0);
      }
      expect(bed).toEqual(before);
    }
  });
});

describe('goalMet', () => {
  it('holds exactly when no bud is left, or at level 8 when the bed is empty', () => {
    const bed = emptyBed(5);
    bed.filled[1] = 0b100;
    expect(goalMet(bed, 'buds')).toBe(true);
    expect(goalMet(bed, 'clear')).toBe(false);
    bed.buds[1] = 0b100;
    expect(goalMet(bed, 'buds')).toBe(false);
  });
});

describe('trays', () => {
  it('the next three arrive only when the tray in front is used up', () => {
    const g = { pieces: Array(9).fill('mono-0'), traySize: 3 };
    expect(trayNow(g, 0)).toEqual([0, 1, 2]);
    expect(trayNow(g, 0b011)).toEqual([2]);
    expect(trayNow(g, 0b111)).toEqual([3, 4, 5]);
    expect(trayIndex(g, 0b111111)).toBe(2);
    expect(trayIndex(g, 0b111111111)).toBe(3);
  });
});

describe('level 1, garden 1', () => {
  it('is the authored row: the domino at its end blooms the bud, and the square does too', () => {
    const g = decode(FIRST_GARDEN, planFor(1));
    expect(g.n).toBe(5);
    expect(passesFilter(planFor(1), g, 1)).toBe(true);
    const sol = solve(g, startState(g))!;
    expect(sol.length).toBe(1);
    expect(goalMet(apply(g, startState(g), { piece: 0, r: 2, c: 3 }).bed, 'buds')).toBe(true);
    expect(goalMet(apply(g, startState(g), { piece: 1, r: 1, c: 3 }).bed, 'buds')).toBe(true);
  });
});

describe.each(PLANS.filter((p) => p.id <= 4).map((p) => [p.id, p] as const))('generated gardens, level %i', (_, plan) => {
  it('over 500 seeds: well formed, solvable at par inside the range, passing the filter, never the fallback, the same for a seed', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const made = makeGarden(plan, new Rng(seed));
      expect(made.fallback).toBe(false);
      const g = made.garden;
      expect(g.n).toBe(plan.n);
      expect(g.pieces.length).toBe(plan.pieces);
      expect(goalMet(g.bed, g.goal)).toBe(false);
      expect(fullLines(g.bed)).toBe(0);
      const par = shortest(g, startState(g));
      expect(par).toBe(g.solution.length);
      expect(par).toBeGreaterThanOrEqual(plan.par[0]);
      expect(par).toBeLessThanOrEqual(plan.par[1]);
      expect(passesFilter(plan, g, par)).toBe(true);
      if (seed <= 20) expect(encode(makeGarden(plan, new Rng(seed)).garden)).toBe(encode(g));
    }
  });
});

describe.each([5, 6, 7, 8].map((id) => [id, planFor(id)] as const))('frozen gardens, level %i', (id, plan) => {
  const list = GARDENS[id];
  it('has at least 12 different gardens', () => {
    expect(list.length).toBeGreaterThanOrEqual(12);
    expect(new Set(list.map((t) => t.split(':')[0])).size).toBe(list.length);
  });

  it('each is well formed, its stored solution replays to the goal at par, and it passes the filter', () => {
    for (const text of list) {
      const g = decode(text, plan);
      expect(g.n).toBe(plan.n);
      expect(fullLines(g.bed)).toBe(0);
      if (plan.goal === 'clear') expect(count(g.bed.buds)).toBe(0);
      let s = startState(g);
      for (const p of g.solution) {
        expect(trayNow(g, s.used)).toContain(p.piece);
        expect(fits(s.bed, g.pieces[p.piece], p)).toBe(true);
        s = apply(g, s, p);
      }
      expect(goalMet(s.bed, g.goal)).toBe(true);
      expect(passesFilter(plan, g, g.solution.length)).toBe(true);
    }
  });

  it('par is the fewest placements, and every symmetry of the garden keeps it', () => {
    // Levels 7–8 were checked by the generator with a two-million-state search; two each are checked again here.
    for (const text of list.slice(0, id >= 7 ? 2 : list.length)) {
      const g = decode(text, plan);
      const par = g.solution.length;
      expect(shortest(g, startState(g))).toBe(par);
      for (const t of [1, 6]) {
        const m = transformGarden(g, t);
        let s = startState(m);
        for (const p of m.solution) s = apply(m, s, p);
        expect(goalMet(s.bed, m.goal)).toBe(true);
        if (id < 7) expect(shortest(m, startState(m))).toBe(par);
      }
    }
  }, 60_000);
});

/** States she might reach: random legal placements from the start of a garden. */
function wander(g: Garden, rng: Rng, steps: number): State[] {
  const out = [startState(g)];
  for (let i = 0; i < steps; i++) {
    const s = out[out.length - 1];
    const ps = placements(g, s);
    if (!ps.length || goalMet(s.bed, g.goal)) break;
    out.push(apply(g, s, rng.pick(ps)));
  }
  return out;
}

describe('hintPlacement', () => {
  it('from reachable states, the hint is legal and brings the shortest remaining solution one closer, or it is stuck at a dead end', () => {
    const rng = new Rng(11);
    for (const plan of PLANS.filter((p) => p.id <= 6)) {
      for (let k = 0; k < 12; k++) {
        const g = plan.id <= 4 ? makeGarden(plan, new Rng(1000 + k)).garden : decode(GARDENS[plan.id][k % GARDENS[plan.id].length], plan);
        const states = wander(g, rng, rng.int(0, 2));
        const s = states[states.length - 1];
        if (goalMet(s.bed, g.goal)) continue;
        const hint = hintPlacement(g, s, states.slice(0, -1));
        const left = shortest(g, s);
        if (left === Infinity) {
          expect(hint.kind).not.toBe('plan');
          continue;
        }
        expect(hint.kind).toBe('plan');
        if (hint.kind !== 'plan') continue;
        expect(trayNow(g, s.used)).toContain(hint.placement.piece);
        expect(fits(s.bed, g.pieces[hint.placement.piece], hint.placement)).toBe(true);
        expect(shortest(g, apply(g, s, hint.placement))).toBe(left - 1);
      }
    }
  });

  it('along the stored solution at levels 7 and 8, the hint reads the plan', () => {
    for (const id of [7, 8]) {
      const g = decode(GARDENS[id][0], planFor(id));
      const history: State[] = [];
      let s = startState(g);
      for (const p of g.solution) {
        const hint = hintPlacement(g, s, history);
        expect(hint).toEqual({ kind: 'plan', placement: p });
        history.push(s);
        s = apply(g, s, p);
      }
    }
  });

  it('off the plan at level 8, the bounded search answers within its cap (time recorded), and hitting the cap steps back, never nothing', () => {
    const plan = planFor(8);
    const times: number[] = [];
    for (const text of GARDENS[8]) {
      const g = decode(text, plan);
      const s0 = startState(g);
      const first = placements(g, s0).find((p) => p.piece !== g.solution[0].piece || p.r !== g.solution[0].r || p.c !== g.solution[0].c)!;
      const s1 = apply(g, s0, first);
      const t0 = performance.now();
      const r = search(g, s1, SEARCH_CAP);
      times.push(performance.now() - t0);
      expect(r === 'capped' || r === 'none' || Array.isArray(r)).toBe(true);
      const hint = hintPlacement(g, s1, [s0], 50);
      expect(['plan', 'stuck', 'back']).toContain(hint.kind);
    }
    // The worst case on Node; the target is under 150 ms on a device.
    console.info(`level 8 off-plan search: worst ${Math.round(Math.max(...times))} ms`);
    expect(Math.max(...times)).toBeLessThan(2000);
  }, 60_000);

  it('a dead end reports stuck, and undo leads back to a solvable state', () => {
    const g = decode('ooo../o.o.o/.o.o./o.o.o/.o.oo:square2-0,square2-0:', { goal: 'buds', traySize: 2 });
    g.bed.buds[0] = 1;
    const s = startState(g);
    expect(noRoom(g, s)).toBe(true);
    expect(hintPlacement(g, s, [])).toEqual({ kind: 'stuck' });
    const made = makeGarden(planFor(2), new Rng(5)).garden;
    const states = wander(made, new Rng(9), 2);
    if (search(made, states[states.length - 1]) === 'none') expect(Array.isArray(search(made, states[0]))).toBe(true);
  });
});

describe('allShortest', () => {
  it('finds every shortest solution of the first garden (the domino and the square both finish it)', () => {
    const g = decode(FIRST_GARDEN, planFor(1));
    const all = allShortest(g, startState(g), 1);
    expect(all.some((s) => s[0].piece === 0)).toBe(true);
    expect(all.some((s) => s[0].piece === 1)).toBe(true);
  });
});

describe('nearestAnchor', () => {
  it('returns a fitting anchor within 0.6 of a square, or none, never one where the piece does not fit', () => {
    const rng = new Rng(4);
    const lay = { x: 100, y: 50, cell: 100 };
    for (let t = 0; t < 400; t++) {
      const bed = emptyBed(6);
      for (let r = 0; r < 6; r++) bed.filled[r] = rng.int(0, 63) & 0b101101;
      const id = rng.pick(['domino-0', 'corner3-1', 'T4-0', 'square2-0']);
      const px = lay.x + rng.range(-80, 600), py = lay.y + rng.range(-80, 600);
      const a = nearestAnchor(bed, id, px, py, lay);
      if (!a) continue;
      expect(fits(bed, id, a)).toBe(true);
      expect(Math.hypot(a.r - (py - lay.y) / 100, a.c - (px - lay.x) / 100)).toBeLessThanOrEqual(0.6 + 1e-9);
    }
  });
});

describe('gardenLayout', () => {
  const overlap = (a: { x: number; y: number; w: number; h: number }, b: typeof a) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  it.each(VIEWS)('fits %s at every plan', (_, v) => {
    for (const plan of PLANS) {
      const lay = gardenLayout(plan, v);
      const bed = { x: lay.x, y: lay.y, w: plan.n * plan.cell, h: plan.n * plan.cell };
      expect(plan.cell).toBeGreaterThanOrEqual(plan.id >= 7 ? 72 : 100);
      // Inside the view, and the finger planting the bottom row stays 40 inside the bottom edge.
      expect(bed.x).toBeGreaterThanOrEqual(0);
      expect(bed.x + bed.w).toBeLessThanOrEqual(v.w);
      expect(bed.y).toBeGreaterThanOrEqual(0);
      expect(bed.y + bed.h + RIDE).toBeLessThanOrEqual(v.h - 40);
      // Clear of the shell's Home and ? (top-left, about 124 square) and the pet's corner (bottom-left 150 × 170).
      const shell = { x: 0, y: 0, w: 124, h: 124 }, pet = { x: 0, y: v.h - 170, w: 150, h: 170 };
      const undo = { x: lay.undo.x - 54, y: lay.undo.y - 54, w: 108, h: 108 };
      for (const r of [bed, ...lay.slots, undo]) {
        expect(overlap(r, shell)).toBe(false);
        expect(overlap(r, pet)).toBe(false);
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(v.w);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.y + r.h).toBeLessThanOrEqual(v.h);
      }
      const hits = [bed, ...lay.slots, undo];
      for (let i = 0; i < hits.length; i++) for (let j = i + 1; j < hits.length; j++) expect(overlap(hits[i], hits[j])).toBe(false);
      for (const s of lay.slots) expect(Math.min(s.w, s.h)).toBeGreaterThanOrEqual(120);
    }
  });
});
