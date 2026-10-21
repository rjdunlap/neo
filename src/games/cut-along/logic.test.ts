import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { advanceTrace, traceWaypoints, type Point } from '../letter-trails/strokes';
import { offTrail } from '../letter-trails/logic';
import {
  DIFFERS, EDGE, LEVELS, MARK_HIT, PAPER_W, PLANS, RING_R, STRIP, boardsFor, chooseOrder, countsStrays, cutsFor, differsLine,
  fringeMarks, hintStretch, homeCorner, judgeOutline, layoutFor, markAt, markBox, pathOf, petCorner, planFor, startOf, tolerance,
  lengthTo, wrongReached, type Cut, type Rect,
} from './logic';
import { SCRIPT as LINES } from '../../content/voice-script';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 3);
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function allCuts(level: number, seed: number): Cut[] {
  if (level === 8) return boardsFor(new Rng(seed)).flatMap((b) => b.cuts);
  return cutsFor(level, new Rng(seed));
}

/** Feed the tracer a finger that walks the bot's corners in small steps. */
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

describe('Cut Along ladder', () => {
  it('has eight levels and the defined bands', () => {
    expect(PLANS).toHaveLength(8);
    expect(LEVELS).toEqual({ toddler: { min: 1, max: 2 }, preschool: { min: 2, max: 5 }, prek: { min: 4, max: 7 }, school: { min: 6, max: 8 } });
    expect(planFor(1).mode).toBe('snip');
    expect(planFor(8).mode).toBe('fits');
  });

  it('counts strays only from level 3', () => {
    expect(countsStrays(1)).toBe(false);
    expect(countsStrays(2)).toBe(false);
    expect(countsStrays(3)).toBe(true);
  });

  it('never widens the corridor as the level rises', () => {
    for (let l = 3; l <= 8; l++) expect(tolerance(l)).toBeLessThanOrEqual(tolerance(l - 1));
  });
});

describe('Cut Along layout', () => {
  for (const [name, v] of Object.entries(VIEWS)) {
    it(`fits the paper, rings and picture in the ${name} view`, () => {
      const { paper, picture } = layoutFor(v);
      expect(paper.s).toBeGreaterThanOrEqual(420);
      expect(paper.w).toBeGreaterThanOrEqual(560);
      expect(picture.w).toBeGreaterThanOrEqual(200);
      const room = { x: paper.x - EDGE, y: paper.y, w: paper.w + 2 * EDGE, h: paper.h + EDGE };
      expect(room.x).toBeGreaterThanOrEqual(0);
      expect(room.x + room.w).toBeLessThanOrEqual(v.w);
      expect(room.y).toBeGreaterThanOrEqual(0);
      expect(room.y + room.h).toBeLessThanOrEqual(v.h);
      expect(overlaps(room, homeCorner())).toBe(false);
      expect(overlaps(room, petCorner(v))).toBe(false);
      expect(overlaps(room, picture)).toBe(false);
      expect(picture.x + picture.w).toBeLessThanOrEqual(v.w);
      expect(overlaps(picture, homeCorner())).toBe(false);
    });

    it(`keeps the corridor at least 30 units wide in the ${name} view`, () => {
      const { paper } = layoutFor(v);
      for (let l = 2; l <= 8; l++) expect(tolerance(l) * paper.s).toBeGreaterThanOrEqual(30);
    });
  }
});

describe('Cut Along cuts', () => {
  it('starts every cut on its sheet edge, with the whole path on the paper', () => {
    for (let l = 2; l <= 8; l++) {
      for (const seed of SEEDS) {
        for (const cut of allCuts(l, seed)) {
          const s = startOf(cut), sh = cut.sheet, e = 1e-9;
          const onEdge = Math.abs(s[0] - sh.x) < e || Math.abs(s[0] - (sh.x + sh.w)) < e || Math.abs(s[1] - (sh.y + sh.h)) < e;
          expect(onEdge, `${cut.kind} at level ${l}`).toBe(true);
          for (const order of cut.orders) for (const p of order) {
            expect(p[0]).toBeGreaterThanOrEqual(-e); expect(p[0]).toBeLessThanOrEqual(PAPER_W + e);
            expect(p[1]).toBeGreaterThanOrEqual(-e); expect(p[1]).toBeLessThanOrEqual(1 + e);
          }
        }
      }
    }
  });

  it('gives a start ring at least 110 units across', () => {
    expect(2 * RING_R).toBeGreaterThanOrEqual(110);
  });

  it('can be cut to the end, both ways round a closed shape', () => {
    for (let l = 2; l <= 8; l++) {
      for (const seed of SEEDS.slice(0, 10)) {
        for (const cut of allCuts(l, seed)) {
          for (const order of cut.orders) expect(walk(order, tolerance(l)), `${cut.kind} at level ${l}`).toBe(order.length - 1);
        }
      }
    }
  });

  it('never lets a chord across a corner consume a checkpoint past it', () => {
    for (let l = 4; l <= 8; l++) {
      for (const seed of SEEDS.slice(0, 10)) {
        for (const cut of allCuts(l, seed)) {
          const tol = tolerance(l);
          for (const points of cut.orders) {
            for (const corner of cut.corners) {
              const c = points.findIndex((p) => dist(p, corner) < 1e-9);
              if (c <= cut.lead || c === points.length - 1) continue;
              // A checkpoint about three corridor widths back, the finger cutting straight across to the far leg.
              const back = Math.min(c - cut.lead, Math.ceil((3 * tol) / 0.025));
              const ahead = Math.min(points.length - 1 - c, Math.ceil((3 * tol) / 0.025));
              const i = c - back, j = c + ahead;
              const reached = advanceTrace(points, i, points[i], points[j], tol);
              expect(reached, `${cut.kind} corner ${c} at level ${l}`).toBeLessThanOrEqual(c);
            }
          }
        }
      }
    }
  });

  it('keeps separate stretches of one path apart, away from corners and the joint', () => {
    for (let l = 2; l <= 8; l++) {
      for (const seed of SEEDS.slice(0, 6)) {
        for (const cut of allCuts(l, seed)) {
          const tol = tolerance(l), points = cut.orders[0];
          const arc = points.map((_, i) => lengthTo(points, i));
          const cornerArc = [...cut.corners.map((q) => arc[points.findIndex((p) => dist(p, q) < 1e-9)])];
          const jointArc = cut.closed ? [arc[cut.lead], arc[arc.length - 1]] : [];
          const near = (i: number, at: number) => Math.abs(arc[i] - at) <= 4 * tol;
          for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
              // Two stretches far apart along the path but close on the paper would share one corridor.
              if (arc[j] - arc[i] < 4 * tol) continue;
              if (cornerArc.some((c) => near(i, c) && near(j, c))) continue;
              if (jointArc.some((c) => near(i, c)) && jointArc.some((c) => near(j, c))) continue;
              expect(dist(points[i], points[j]), `${cut.kind} ${i}/${j} at level ${l}`).toBeGreaterThanOrEqual(2 * tol);
            }
          }
        }
      }
    }
  });

  it('picks the way round that the first move past the joint follows', () => {
    const cut = cutsFor(5, new Rng(1))[2];
    expect(cut.closed).toBe(true);
    const tol = tolerance(5);
    for (const want of [0, 1]) {
      const pts = cut.orders[want];
      let state: { order: number | null; progress: number } = { order: null, progress: 0 };
      let prev = pts[0];
      for (let k = 1; k <= cut.lead + 6; k++) {
        state = chooseOrder(cut, state.order, state.progress, prev, pts[k], tol);
        prev = pts[k];
      }
      expect(state.order).toBe(want);
      expect(state.progress).toBeGreaterThan(cut.lead);
    }
  });

  it('gives the same paper for the same seed', () => {
    for (let l = 2; l <= 7; l++) expect(cutsFor(l, new Rng(42))).toEqual(cutsFor(l, new Rng(42)));
    expect(boardsFor(new Rng(9))).toEqual(boardsFor(new Rng(9)));
  });

  it('lights a hint stretch from where the scissors wait, forward', () => {
    const pts = pathOf(cutsFor(3, new Rng(2))[0], null);
    const h = hintStretch(pts, 5);
    expect(h[0]).toEqual(pts[5]);
    expect(h).toHaveLength(13);
  });
});

describe('Cut Along strays', () => {
  it('counts a drag that leaves the corridor once, and keeps the progress', () => {
    const cut = cutsFor(3, new Rng(5))[0], tol = tolerance(3), pts = pathOf(cut, null);
    let progress = advanceTrace(pts, 0, pts[0], pts[10], tol);
    let misses = 0, missed = false, before = -1;
    let prev = pts[10];
    // The finger wanders straight away from the line, further each move.
    for (const k of [1, 2, 3, 4]) {
      const to: Point = [pts[10][0], pts[10][1] + k * 0.12];
      const next = advanceTrace(pts, progress, prev, to, tol);
      if (next === progress && offTrail(to, pts[progress], tol) && !missed && countsStrays(3)) { missed = true; misses++; before = progress; }
      progress = next; prev = to;
    }
    expect(misses).toBe(1);
    expect(progress).toBe(before);
  });
});

describe('Cut Along level 1 marks', () => {
  it('has five marks with boxes at least 110 × 140 that never overlap', () => {
    for (const v of Object.values(VIEWS)) {
      const s = layoutFor(v).paper.s;
      for (const seed of SEEDS) {
        const marks = fringeMarks(new Rng(seed));
        expect(marks).toHaveLength(5);
        const boxes = marks.map((m) => markBox(m, s));
        for (const b of boxes) {
          expect(b.w * s).toBeGreaterThanOrEqual(MARK_HIT.w - 1e-6);
          expect(b.h * s).toBeGreaterThanOrEqual(MARK_HIT.h - 1e-6);
          expect(b.y).toBeGreaterThanOrEqual(STRIP.y);
        }
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j])).toBe(false);
      }
    }
  });

  it('finds the mark under a touch and skips snipped ones', () => {
    const marks = fringeMarks(new Rng(3)), s = 450;
    expect(markAt(marks, new Set(), [marks[2].x, 0.95], s)).toBe(2);
    expect(markAt(marks, new Set([2]), [marks[2].x, 0.95], s)).toBe(null);
    expect(markAt(marks, new Set(), [marks[2].x, 0.3], s)).toBe(null);
  });
});

describe('Cut Along level 8 boards', () => {
  it('has exactly one outline that fits, and a spoken difference for every other', () => {
    for (const seed of SEEDS) {
      const boards = boardsFor(new Rng(seed));
      expect(boards).toHaveLength(3);
      expect(boards[0].cuts).toHaveLength(2);
      expect(boards[1].cuts).toHaveLength(3);
      for (const b of boards) {
        expect(b.cuts.filter((_, i) => judgeOutline(b, i))).toHaveLength(1);
        b.cuts.forEach((_, i) => {
          if (judgeOutline(b, i)) return;
          const line = differsLine(b, i);
          expect(Object.values(DIFFERS)).toContain(line);
          expect(LINES[line], line).toBeDefined();
        });
      }
    }
  });

  it('keeps every outline, lead-in and ring apart, so one drag can advance only one', () => {
    for (const seed of SEEDS) {
      for (const b of boardsFor(new Rng(seed))) {
        const tol = tolerance(8);
        for (let i = 0; i < b.cuts.length; i++) for (let j = i + 1; j < b.cuts.length; j++) {
          let min = Infinity;
          for (const p of b.cuts[i].orders[0]) for (const q of b.cuts[j].orders[0]) min = Math.min(min, dist(p, q));
          expect(min).toBeGreaterThan(2 * tol);
          const ringGap = Math.abs(startOf(b.cuts[i])[0] - startOf(b.cuts[j])[0]);
          expect(ringGap * 420).toBeGreaterThan(2 * RING_R);
        }
      }
    }
  });

  it('counts a wrong outline from a fifth of its own length', () => {
    expect(wrongReached(0, 101)).toBe(false);
    expect(wrongReached(19, 101)).toBe(false);
    expect(wrongReached(20, 101)).toBe(true);
  });
});
