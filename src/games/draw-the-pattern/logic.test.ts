import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { advanceTrace, traceWaypoints, type Point } from '../../learning/tracing/strokes';
import { offTrail } from '../../learning/tracing/feedback';
import {
  LEVELS, PAIRS, PLANS, POOLS, SHAPE_SETS, RING_R, STRIP_W, botRoute, chooseOrder, core, divergence, hintStretch, homeCorner, layoutFor, lengthTo,
  markCount, nextDot, nextUnit, DOT_COUNT, DOT_HIT, onPaper, pathOf, petCorner, planFor, stones, stripsFor, tolerance, wrongReached, type Rect, type Stroke,
} from './logic';
import { SCRIPT as LINES } from '../../content/voice-script';
import { rangeFor, stepLevel } from '../../progress/difficulty';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 3);
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const strokes = (level: number, seed: number): Stroke[] => stripsFor(level, new Rng(seed)).flatMap((s) => s.strokes);
/** The strokes she draws: everything with checkpoints after the pet's part. */
const hers = (level: number, seed: number) => strokes(level, seed).filter((s) => s.lead < s.orders[0].length - 1);

/** Feed the tracer a finger that walks the waypoints in small steps from `from`. */
function walk(points: readonly Point[], tol: number, from = 0): number {
  const route = traceWaypoints(points.slice(from));
  let progress = from, prev = route[0];
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i], steps = Math.max(1, Math.ceil(dist(a, b) / 0.02));
    for (let k = 1; k <= steps; k++) {
      const to: Point = [a[0] + ((b[0] - a[0]) * k) / steps, a[1] + ((b[1] - a[1]) * k) / steps];
      progress = advanceTrace(points, progress, prev, to, tol);
      prev = to;
    }
  }
  return progress;
}

describe('Draw the Pattern ladder', () => {
  it('has ten levels and the defined bands', () => {
    expect(PLANS).toHaveLength(10);
    expect(LEVELS).toEqual({ lap: { min: 1, max: 10, order: [1, 10] }, toddler: { min: 1, max: 10, order: [1, 10, 2, 3] }, preschool: { min: 3, max: 5 }, prek: { min: 5, max: 9, order: [5, 9, 6, 7, 8] } });
    expect(markCount(planFor(1))).toBe(4);
    expect(planFor(1).mode).toBe('mark');
    expect(planFor(7).mode).toBe('choose');
  });

  it('never widens the corridor as the level rises', () => {
    for (let l = 2; l <= 9; l++) expect(tolerance(l)).toBeLessThanOrEqual(tolerance(l - 1));
    // Level 10 is an easy tap entry, as wide as level 2.
    expect(tolerance(10)).toBe(tolerance(2));
  });

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`fits the strip, rings and picture in the ${name} view`, () => {
      const { strip, picture } = layoutFor(v);
      expect(strip.w).toBeGreaterThanOrEqual(680);
      expect(strip.h).toBeGreaterThanOrEqual(200);
      expect(picture.w).toBeGreaterThanOrEqual(200);
      const inView = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;
      expect(inView(strip)).toBe(true);
      expect(inView(picture)).toBe(true);
      for (const keep of [homeCorner(), petCorner(v), picture]) expect(overlaps(strip, keep)).toBe(false);
      for (let l = 2; l <= PLANS.length; l++) {
        for (const seed of SEEDS.slice(0, 5)) {
          for (const strip0 of stripsFor(l, new Rng(seed))) {
            const rings: Rect[] = [];
            for (const s of strip0.strokes) {
              if (s.lead >= s.orders[0].length - 1) continue;
              const at = s.orders[0][s.lead];
              const ring = { x: strip.x + at[0] * strip.s - RING_R, y: strip.y + at[1] * strip.s - RING_R, w: 2 * RING_R, h: 2 * RING_R };
              expect(inView(ring), `ring at level ${l}`).toBe(true);
              for (const keep of [homeCorner(), petCorner(v), picture]) expect(overlaps(ring, keep), `ring at level ${l}`).toBe(false);
              // Rings shown together never overlap (level 2's posts, level 6's cross, level 9's rain and X).
              if (s.lead === 0 && (s.kind === 'post' || s.kind.startsWith('cross') || s.kind === 'slant' || s.kind.startsWith('x-'))) {
                for (const r of rings) expect(overlaps(ring, r), `rings at level ${l}`).toBe(false);
                rings.push(ring);
              }
            }
          }
        }
      }
    });

    it(`keeps the corridor at least 30 units wide in the ${name} view`, () => {
      const { strip } = layoutFor(v);
      for (let l = 2; l <= PLANS.length; l++) expect(tolerance(l) * strip.s).toBeGreaterThanOrEqual(30);
    });
  }

  it('lays every stroke on the strip, and leaves her at least three units of a pattern', () => {
    for (let l = 1; l <= PLANS.length; l++) {
      for (const seed of SEEDS.slice(0, 10)) {
        for (const s of strokes(l, seed)) {
          for (const o of s.orders) for (const p of o) {
            expect(p[0]).toBeGreaterThanOrEqual(0.1 - 1e-9);
            expect(p[0]).toBeLessThanOrEqual(STRIP_W - 0.1 + 1e-9);
            expect(p[1]).toBeGreaterThanOrEqual(0.1 - 1e-9);
            expect(p[1]).toBeLessThanOrEqual(0.9 + 1e-9);
          }
          if (s.units && s.lead > 0 && (l === 3 || l === 5)) expect(s.units.length - (s.kind === 'loop' ? 1 : 2)).toBeGreaterThanOrEqual(3);
          if (s.units && l === 4) expect(s.units.length - 1).toBe(3);
        }
        if (planFor(l).mode === 'choose') expect(stripsFor(l, new Rng(seed)).every((st) => st.strokes.filter((s) => s.right !== undefined).length === 3)).toBe(true);
      }
    }
  });

  it('can be drawn to the end from where the pet stops, both ways round the circle and on the continuing candidate', () => {
    for (let l = 2; l <= PLANS.length; l++) {
      for (const seed of SEEDS.slice(0, 10)) {
        for (const s of hers(l, seed)) {
          const ways = s.right !== undefined ? [s.right] : s.orders.map((_, i) => i);
          for (const o of ways) expect(walk(s.orders[o], tolerance(l), s.lead), `${s.kind} at level ${l}`).toBe(s.orders[o].length - 1);
        }
      }
    }
  });

  it('lets the ghost finger’s thinned route draw every stroke', () => {
    for (let l = 2; l <= PLANS.length; l++) {
      for (const seed of SEEDS.slice(0, 10)) {
        for (const s of hers(l, seed)) {
          const o = s.right ?? 0, pts = s.orders[o];
          const route = botRoute(s, pts, s.lead);
          expect(route.length).toBeLessThan(90);
          let order: number | null = s.orders.length > 1 ? null : 0, progress = s.lead, prev = route[0];
          for (const to of route.slice(1)) {
            const next = chooseOrder(s, order, progress, prev, to, tolerance(l));
            order = next.order; progress = next.progress; prev = to;
          }
          expect(order, `${s.kind} at level ${l}`).toBe(o);
          expect(progress, `${s.kind} at level ${l}`).toBe(pts.length - 1);
        }
      }
    }
  });

  it('never lets a chord across a corner consume a checkpoint past it', () => {
    for (let l = 2; l <= PLANS.length; l++) {
      for (const seed of SEEDS.slice(0, 10)) {
        for (const s of hers(l, seed)) {
          const tol = tolerance(l);
          s.orders.forEach((points) => {
            for (const corner of s.corners) {
              const c = points.findIndex((p) => dist(p, corner) < 1e-9);
              if (c <= s.lead || c === points.length - 1) continue;
              // A checkpoint about three corridor widths back, the finger cutting straight across to the far leg.
              const back = Math.min(c - s.lead, Math.ceil((3 * tol) / 0.025));
              const ahead = Math.min(points.length - 1 - c, Math.ceil((3 * tol) / 0.025));
              const i = c - back, j = c + ahead;
              expect(advanceTrace(points, i, points[i], points[j], tol), `${s.kind} corner ${c} at level ${l}`).toBeLessThanOrEqual(c);
            }
          });
        }
      }
    }
  });

  it('keeps separate stretches of one path apart, away from corners, the circle’s start and a loop’s crossing', () => {
    for (let l = 2; l <= PLANS.length; l++) {
      for (const seed of SEEDS.slice(0, 6)) {
        for (const s of hers(l, seed)) {
          const tol = tolerance(l);
          for (const points of s.orders) {
            const arc = points.map((_, i) => lengthTo(points, i));
            const cornerArc = s.corners.map((q) => points.findIndex((p) => dist(p, q) < 1e-9)).filter((i) => i >= 0).map((i) => arc[i]);
            const ends = ['circle', 'square', 'triangle'].includes(s.kind) ? [0, arc.at(-1)!] : [];
            const crossings = s.kind === 'loop' ? selfCrossings(points) : [];
            const near = (i: number, at: number) => Math.abs(arc[i] - at) <= 4 * tol;
            for (let i = s.lead; i < points.length; i++) {
              for (let j = i + 1; j < points.length; j++) {
                if (arc[j] - arc[i] < 4 * tol) continue;
                if (cornerArc.some((c) => near(i, c) && near(j, c))) continue;
                if (ends.some((c) => near(i, c)) && ends.some((c) => near(j, c))) continue;
                // A loop's one self-crossing: its two passes meet there by design.
                if (crossings.some(([a, b]) => near(i, arc[a]) && near(j, arc[b]))) continue;
                expect(dist(points[i], points[j]), `${s.kind} ${i}/${j} at level ${l}`).toBeGreaterThanOrEqual(2 * tol);
              }
            }
          }
        }
      }
    }
  });

  it('never consumes the far side of a loop early: following its waypoints finishes in order', () => {
    for (const seed of SEEDS.slice(0, 6)) {
      for (const s of hers(4, seed).filter((x) => x.kind === 'loop')) {
        const pts = s.orders[0];
        // Every step advances at most a few checkpoints at a time, so the second pass is never taken on the first.
        const route = traceWaypoints(pts.slice(s.lead));
        let progress = s.lead, prev = route[0], jump = 0;
        for (const to of route.slice(1)) {
          const next = advanceTrace(pts, progress, prev, to, tolerance(4));
          jump = Math.max(jump, next - progress);
          progress = next; prev = to;
        }
        expect(progress).toBe(pts.length - 1);
        expect(jump).toBeLessThan(15);
      }
    }
  });

  it('picks the way round the circle that the first move follows', () => {
    const circle = strokes(4, 1).find((s) => s.kind === 'circle')!, tol = tolerance(4);
    for (const o of [0, 1]) {
      const pts = circle.orders[o];
      let order: number | null = null, progress = 0, prev = pts[0];
      for (let i = 1; i < 30; i++) {
        const next = chooseOrder(circle, order, progress, prev, pts[i], tol);
        order = next.order; progress = next.progress; prev = pts[i];
      }
      expect(order).toBe(o);
      expect(progress).toBeGreaterThan(20);
    }
  });

  it('keeps two candidates together up to the divergence, then at least two corridors apart for four checkpoints', () => {
    for (const l of [7, 8]) {
      for (const seed of SEEDS) {
        for (const s of hers(l, seed).filter((x) => x.right !== undefined)) {
          const tol = tolerance(l);
          expect(dist(s.orders[0][0], s.orders[1][0])).toBeLessThan(1e-9);
          for (const o of [0, 1]) {
            const d = divergence(s, o, tol), pts = s.orders[o];
            expect(d, `${s.kinds} at level ${l}`).toBeLessThan(pts.length - 1 - 4);
            for (let k = d; k < d + 4; k++) {
              const other = s.orders[1 - o];
              const near = Math.min(...other.map((q) => dist(q, pts[k])));
              expect(near, `${s.kinds} ${o} at ${k}`).toBeGreaterThanOrEqual(2 * tol - 0.02);
            }
          }
        }
      }
    }
  });

  it('waits, while undecided, where both ways still are: a carried-on drag never leaves the crayon off either path', () => {
    for (const l of [4, 7, 8]) {
      for (const seed of SEEDS.slice(0, 20)) {
        for (const s of hers(l, seed).filter((x) => x.orders.length === 2)) {
          const tol = tolerance(l), start = s.orders[0][0];
          // A finger resting where the last unit ended, then nudged along either way by less than the fork.
          for (const o of [0, 1]) {
            let order: number | null = null, progress = 0, prev = start;
            for (const to of s.orders[o].slice(1, 12)) {
              const next = chooseOrder(s, order, progress, prev, to, tol);
              order = next.order; progress = next.progress; prev = to;
              if (order === null) expect(dist(s.orders[0][progress], s.orders[1][progress])).toBeLessThanOrEqual(tol);
            }
          }
        }
      }
    }
  });

  it('counts a wrong candidate only four checkpoints past its divergence', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      for (const s of hers(7, seed).filter((x) => x.right !== undefined)) {
        const tol = tolerance(7), w = 1 - s.right!, d = divergence(s, w, tol);
        expect(wrongReached(s, w, d + 3, tol)).toBe(false);
        expect(wrongReached(s, w, d + 4, tol)).toBe(true);
        expect(wrongReached(s, s.right!, s.orders[s.right!].length - 1, tol)).toBe(false);
      }
    }
  });

  it('decides the candidate the finger follows, starting hesitant on either', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      for (const s of hers(8, seed).filter((x) => x.right !== undefined)) {
        const tol = tolerance(8);
        for (const o of [0, 1]) {
          const pts = s.orders[o];
          let order: number | null = null, progress = 0, prev = pts[0];
          for (let i = 1; i < pts.length; i++) {
            const next = chooseOrder(s, order, progress, prev, pts[i], tol);
            order = next.order; progress = next.progress; prev = pts[i];
          }
          expect(order).toBe(o);
          expect(progress).toBe(pts.length - 1);
        }
      }
    }
  });

  it('continues every AB, AAB and ABB pattern, and has a rule line for the kind that comes next', () => {
    for (const [a, b] of PAIRS) {
      for (const shape of ['AB', 'AAB', 'ABB'] as const) {
        const p = core(shape, a, b);
        for (let shown = 0; shown < 9; shown++) {
          const expected = shape === 'AB' ? [a, b][shown % 2] : shape === 'AAB' ? [a, a, b][shown % 3] : [a, b, b][shown % 3];
          expect(nextUnit(p, shown)).toBe(expected);
        }
        for (const k of [a, b]) {
          expect(LINES[`draw.rule.${k}` as keyof typeof LINES]).toBeTruthy();
          expect(LINES[`draw.unit.${k}` as keyof typeof LINES]).toBeTruthy();
        }
      }
    }
    for (const l of [7, 8]) {
      for (const seed of SEEDS.slice(0, 10)) {
        for (const strip of stripsFor(l, new Rng(seed))) {
          const shown = l === 7 ? 4 : 6;
          strip.strokes.slice(1).forEach((s, i) => expect(s.kinds![s.right!]).toBe(nextUnit(strip.pattern!, shown + i)));
        }
      }
    }
  });

  it('counts a drag that leaves the corridor, and keeps the progress', () => {
    const s = hers(3, 1)[0], tol = tolerance(3), pts = s.orders[0];
    const before = advanceTrace(pts, s.lead, pts[s.lead], pts[s.lead + 6], tol);
    const off: Point = [pts[before][0], pts[before][1] + 0.6];
    expect(offTrail(off, pts[before], tol)).toBe(true);
    expect(advanceTrace(pts, before, pts[before], off, tol)).toBe(before);
  });

  it('lets level 1 take any mark on the paper', () => {
    for (const p of [[0, 0], [1.7, 0.5], [STRIP_W, 1]] as Point[]) expect(onPaper(p)).toBe(true);
    expect(onPaper([-0.1, 0.5])).toBe(false);
  });

  it('lights a hint stretch from where the crayon waits, forward', () => {
    const s = hers(3, 5)[0], pts = pathOf(s, 0);
    const lit = hintStretch(pts, s.lead + 3);
    expect(lit[0]).toBe(pts[s.lead + 3]);
    expect(lit).toHaveLength(13);
  });

  it('puts stepping stones at the turns of the level-5 patterns', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      for (const strip of stripsFor(5, new Rng(seed))) {
        expect(strip.memory).toBe(true);
        const s = strip.strokes[0], st = stones(s.orders[0], s.lead);
        // At least one turn per unit she draws, and the end.
        expect(st.length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('gives the same strips for the same seed', () => {
    for (let l = 1; l <= PLANS.length; l++) expect(stripsFor(l, new Rng(42))).toEqual(stripsFor(l, new Rng(42)));
  });

  it('gives every stroke a pool of three pictures, each with its own spoken line', () => {
    const pieces = [...Object.values(POOLS).flat(), ...SHAPE_SETS.flat()];
    for (const pool of [...Object.values(POOLS), ...SHAPE_SETS]) expect(new Set(pool).size).toBe(3);
    expect(new Set(pieces).size).toBe(pieces.length);
    for (const p of [...pieces, 'bridge', 'bunting']) expect(LINES[`draw.picture.${p}` as keyof typeof LINES]).toBeTruthy();
  });

  it('reaches every picture in a seed sweep, and the pictures never change the strokes', () => {
    const seen = new Set<string>();
    const strokes = new Map<number, string>();
    for (let seed = 1; seed <= 200; seed++) {
      for (let l = 1; l <= 6; l++) {
        const strips = stripsFor(l, new Rng(seed));
        for (const s of strips) seen.add(s.piece);
        if (l === 6) expect(SHAPE_SETS.some((set) => set.every((p, i) => strips[i].piece === p))).toBe(true);
        // Levels 2, 3, 4 and 6 draw the same strokes every round, whatever they become.
        if (l === 1 || l === 5) continue;
        const key = JSON.stringify(strips.map((s) => s.strokes));
        if (!strokes.has(l)) strokes.set(l, key);
        expect(key).toBe(strokes.get(l));
      }
    }
    for (const p of [...Object.values(POOLS).flat(), ...SHAPE_SETS.flat()]) expect(seen, p).toContain(p);
  });

  it('puts each stroke’s pictures only on that stroke', () => {
    const pool = (kind: string): readonly string[] =>
      kind === 'free' ? POOLS.mark : kind === 'line' ? POOLS.line : kind === 'post' ? POOLS.down : kind === 'circle' ? POOLS.circle
        : kind === 'zig' || kind === 'wave' || kind === 'loop' ? POOLS[kind] : [];
    for (let seed = 1; seed <= 60; seed++) {
      for (let l = 1; l <= 5; l++) {
        const strips = stripsFor(l, new Rng(seed));
        for (const s of strips) expect(pool(s.strokes[0].kind)).toContain(s.piece);
        if (l === 1) expect(new Set(strips.map((s) => s.piece)).size).toBe(1);
      }
    }
  });
});

describe('Draw the Pattern level 9, slanting lines', () => {
  /** Where two paths cross: pairs of segment indices whose segments intersect. */
  const crossings = (a: readonly Point[], b: readonly Point[]): number => {
    const side = (o: Point, p: Point, q: Point) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
    let n = 0;
    for (let i = 1; i < a.length; i++) for (let j = 1; j < b.length; j++) {
      const p = a[i - 1], q = a[i], r = b[j - 1], t = b[j];
      if (side(p, q, r) * side(p, q, t) < 0 && side(r, t, p) * side(r, t, q) < 0) n++;
    }
    return n;
  };

  it('sits between 5 and 6 in pre-K’s order, without renumbering', () => {
    const prek = rangeFor(LEVELS, 'prek');
    expect(stepLevel(5, 1, prek)).toBe(9);
    expect(stepLevel(9, 1, prek)).toBe(6);
    expect(stepLevel(6, -1, prek)).toBe(9);
    expect(planFor(6).name).toMatch(/^Cross, square, triangle/);
    expect(tolerance(9)).toBeLessThanOrEqual(tolerance(6));
  });

  it('draws real diagonals: rain the pet starts, then an X she draws from two rings', () => {
    for (const seed of SEEDS) {
      const [rain, x] = stripsFor(9, new Rng(seed));
      expect(rain.piece).toBe('rain');
      expect(['kite', 'treasure']).toContain(x.piece);
      expect(rain.strokes.map((s) => s.kind)).toEqual(['slant', 'slant', 'slant']);
      expect(rain.strokes.map((s) => s.lead > 0)).toEqual([true, false, false]);
      expect(x.strokes.map((s) => s.kind)).toEqual(['x-back', 'x-fwd']);
      expect(x.strokes.every((s) => s.lead === 0)).toBe(true);
      for (const s of [...rain.strokes, ...x.strokes]) {
        const [a, b] = [s.orders[0][0], s.orders[0].at(-1)!];
        expect(Math.abs(b[0] - a[0])).toBeGreaterThanOrEqual(0.4);
        expect(Math.abs(b[1] - a[1])).toBeGreaterThanOrEqual(0.4);
        // Every slanting line starts at its top.
        expect(a[1]).toBeLessThan(b[1]);
      }
      // The X: back-slash first, then forward-slash, crossing once.
      const [back, fwd] = x.strokes.map((s) => s.orders[0]);
      expect(back[0][0]).toBeLessThan(back.at(-1)![0]);
      expect(fwd[0][0]).toBeGreaterThan(fwd.at(-1)![0]);
      expect(crossings(back, fwd)).toBe(1);
    }
  });

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`keeps the X’s two rings two ring radii apart in the ${name} view`, () => {
      const { strip } = layoutFor(v);
      const [back, fwd] = stripsFor(9, new Rng(1))[1].strokes.map((s) => s.orders[0][0]);
      expect(dist(back, fwd) * strip.s).toBeGreaterThanOrEqual(2 * RING_R);
    });
  }

  it('reaches both X pictures, each with its own spoken line', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) seen.add(stripsFor(9, new Rng(seed))[1].piece);
    expect([...seen].sort()).toEqual(['kite', 'treasure']);
    for (const p of ['rain', 'kite', 'treasure']) expect(LINES[`draw.picture.${p}` as keyof typeof LINES]).toBeTruthy();
    expect(LINES['draw.instruct.slant']).toBeTruthy();
  });
});

/** Where a path crosses itself: pairs of segment indices (a < b) whose segments intersect, away from neighbours. */
function selfCrossings(points: readonly Point[]): [number, number][] {
  const out: [number, number][] = [];
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  for (let a = 1; a < points.length; a++) {
    for (let b = a + 2; b < points.length; b++) {
      const p = points[a - 1], q = points[a], r = points[b - 1], t = points[b];
      if (cross(p, q, r) * cross(p, q, t) < 0 && cross(r, t, p) * cross(r, t, q) < 0) out.push([a, b]);
    }
  }
  return out;
}

describe('Draw the Pattern level 10, dot to dot', () => {
  it('is the dots mode, with a line then a zigzag from their own pools', () => {
    expect(planFor(10).mode).toBe('dots');
    const seen = { line: new Set<string>(), zig: new Set<string>() };
    for (let seed = 1; seed <= 200; seed++) {
      const [line, zig] = stripsFor(10, new Rng(seed));
      expect(line.strokes).toHaveLength(1);
      expect(zig.strokes).toHaveLength(1);
      expect(line.strokes[0].kind).toBe('line');
      expect(zig.strokes[0].kind).toBe('zig');
      expect(POOLS.line).toContain(line.piece);
      expect(POOLS.zig).toContain(zig.piece);
      seen.line.add(line.piece); seen.zig.add(zig.piece);
    }
    expect([...seen.line].sort()).toEqual([...POOLS.line].sort());
    expect([...seen.zig].sort()).toEqual([...POOLS.zig].sort());
  });

  it('gives each stroke six ordered dots from the first checkpoint to the last, the pet drawing 1 to 2', () => {
    for (const seed of SEEDS) {
      for (const strip of stripsFor(10, new Rng(seed))) {
        const s = strip.strokes[0], pts = s.orders[0], dots = s.dots!;
        expect(dots).toHaveLength(DOT_COUNT);
        expect(dots[0]).toBe(0);
        expect(dots.at(-1)).toBe(pts.length - 1);
        expect(s.lead).toBe(dots[1]);
        for (let i = 1; i < dots.length; i++) {
          expect(dots[i]).toBeGreaterThan(dots[i - 1]);
          expect(pts[dots[i]][0]).toBeGreaterThan(pts[dots[i - 1]][0]);
        }
      }
    }
  });

  it('alternates the zigzag’s dots low and high, and keeps the line’s dots level', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const [line, zig] = stripsFor(10, new Rng(seed));
      const ys = (s: Stroke) => s.dots!.map((i) => s.orders[0][i][1]);
      const ly = ys(line.strokes[0]), zy = ys(zig.strokes[0]);
      for (const y of ly) expect(y).toBeCloseTo(ly[0], 9);
      for (let i = 1; i < zy.length; i++) {
        expect(Math.abs(zy[i] - zy[i - 1])).toBeGreaterThanOrEqual(0.4);
      }
      // Peaks and troughs: every inner dot is a turning point.
      for (let i = 1; i < zy.length - 1; i++) expect((zy[i] - zy[i - 1]) * (zy[i + 1] - zy[i])).toBeLessThan(0);
    }
  });

  it('walks the dots with nextDot: dot 3 first, then on to the end, then null', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      for (const strip of stripsFor(10, new Rng(seed))) {
        const s = strip.strokes[0], dots = s.dots!;
        let progress = s.lead, taps = 0, next = nextDot(s, progress);
        expect(next).toBe(dots[2]);
        while (next !== null) {
          expect(next).toBeGreaterThan(progress);
          progress = next; taps++;
          next = nextDot(s, progress);
        }
        expect(taps).toBe(DOT_COUNT - 2);
        expect(progress).toBe(s.orders[0].length - 1);
        expect(nextDot(s, progress)).toBeNull();
        // From anywhere between dots it names the one ahead.
        expect(nextDot(s, dots[1] + 1)).toBe(dots[2]);
      }
    }
  });

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`keeps dots 120 units apart, tap circles clear of each other and in the clear in the ${name} view`, () => {
      const { strip, picture } = layoutFor(v);
      const inView = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;
      for (const seed of SEEDS.slice(0, 10)) {
        for (const st of stripsFor(10, new Rng(seed))) {
          const s = st.strokes[0], at = s.dots!.map((i) => s.orders[0][i]);
          for (let i = 1; i < at.length; i++) {
            const gap = dist(at[i - 1], at[i]) * strip.s;
            expect(gap).toBeGreaterThanOrEqual(120);
            expect(gap).toBeGreaterThanOrEqual(2 * DOT_HIT);
          }
          for (const d of at) {
            const hit = { x: strip.x + d[0] * strip.s - DOT_HIT, y: strip.y + d[1] * strip.s - DOT_HIT, w: 2 * DOT_HIT, h: 2 * DOT_HIT };
            expect(inView(hit)).toBe(true);
            for (const keep of [homeCorner(), petCorner(v), picture]) expect(overlaps(hit, keep)).toBe(false);
          }
        }
      }
    });
  }

  it('has the spoken lines: the instruction and a name for every piece', () => {
    expect(LINES['draw.instruct.dots']).toBeTruthy();
    for (const p of [...POOLS.line, ...POOLS.zig]) expect(LINES[`draw.picture.${p}` as keyof typeof LINES], p).toBeTruthy();
  });

  it('steps between 10 and the rest of each band’s order', () => {
    const toddler = rangeFor(LEVELS, 'toddler'), lap = rangeFor(LEVELS, 'lap');
    expect(stepLevel(10, 1, toddler)).toBe(2);
    expect(stepLevel(10, -1, toddler)).toBe(1);
    expect(stepLevel(1, 1, lap)).toBe(10);
    expect(stepLevel(10, 1, lap)).toBe(10);
    expect(stepLevel(10, -1, lap)).toBe(1);
  });

  it('draws the same dots for the same seed', () => {
    expect(stripsFor(10, new Rng(7))).toEqual(stripsFor(10, new Rng(7)));
  });
});
