import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { advanceTrace, traceWaypoints, type Point } from '../../learning/tracing/strokes';
import { offTrail } from '../../learning/tracing/feedback';
import {
  DIFFERS,
  EDGE,
  botRoute,
  LEVELS,
  MARK_HIT,
  PAPER_W,
  PLANS,
  RING_R,
  STRIP,
  boardsFor,
  chooseOrder,
  countsStrays,
  cutsFor,
  differsLine,
  fringeMarks,
  hintStretch,
  homeCorner,
  judgeOutline,
  layoutFor,
  markAt,
  markBox,
  pathOf,
  petCorner,
  planFor,
  startOf,
  tolerance,
  lengthTo,
  wrongReached,
  INNER_R,
  RING_GAP,
  SPACING,
  OUTLINES,
  PICTURE_SHAPES,
  THEMES,
  pieceColor,
  pieceLine,
  slotsFor,
  themeFor,
  type Cut,
  type PieceId,
  type Rect,
  OWN_BOX,
  OWN_SIZE,
  OWN_XS,
  OWN_Y,
  botSpots,
  choiceAt,
  ownChoicesFor,
  pictureCut,
  placeIn,
  MAKES,
  PAIR_PIECE,
  judgeLine,
  lineOfCut,
  makesLine,
  splitBoardsFor,
  splitSheet,
  twinOf,
  type Pair,
} from './logic';
import { swatch } from '../../art/palette';
import { SCRIPT as LINES } from '../../content/voice-script';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 3);
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function allCuts(level: number, seed: number): Cut[] {
  if (level === 8) return boardsFor(new Rng(seed)).flatMap((b) => b.cuts);
  if (level === 10) return splitBoardsFor(new Rng(seed)).flatMap((b) => b.cuts);
  if (level === 11) return ownChoicesFor(new Rng(seed)).flat().map(pictureCut);
  return cutsFor(level, new Rng(seed));
}

/** Feed the tracer a finger that walks the bot's corners in small steps. */
function walk(points: readonly Point[], tol: number, from = 0): number {
  const route = traceWaypoints(points.slice(from));
  let progress = from,
    prev = route[0];
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1],
      b = route[i],
      steps = Math.max(1, Math.ceil(dist(a, b) / 0.02));
    for (let k = 1; k <= steps; k++) {
      const to: Point = [a[0] + ((b[0] - a[0]) * k) / steps, a[1] + ((b[1] - a[1]) * k) / steps];
      progress = advanceTrace(points, progress, prev, to, tol);
      prev = to;
    }
  }
  return progress;
}

describe('Cut Along ladder', () => {
  it('has eleven levels and the defined bands', () => {
    expect(PLANS).toHaveLength(11);
    expect(LEVELS).toEqual({
      toddler: { min: 1, max: 2 },
      preschool: { min: 2, max: 5 },
      prek: { min: 4, max: 11, order: [4, 5, 6, 7, 11] },
      school: { min: 6, max: 11 },
    });
    expect(planFor(11).mode).toBe('own');
    expect(planFor(10).mode).toBe('two');
    expect(planFor(1).mode).toBe('snip');
    expect(planFor(8).mode).toBe('fits');
  });

  it('counts strays only from level 3', () => {
    expect(countsStrays(1)).toBe(false);
    expect(countsStrays(2)).toBe(false);
    expect(countsStrays(3)).toBe(true);
  });

  it('never widens the corridor as the level rises', () => {
    for (let l = 3; l <= PLANS.length; l++) expect(tolerance(l)).toBeLessThanOrEqual(tolerance(l - 1));
  });
});

describe('Cut Along layout', () => {
  for (const [name, v] of Object.entries(VIEWS))
    for (const level of [1, 11]) {
      it(`fits the paper, rings and picture in the ${name} view at level ${level}`, () => {
        const { paper, picture } = layoutFor(v, level);
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

      it(`keeps the corridor at least 30 units wide in the ${name} view at level ${level}`, () => {
        for (let l = 2; l <= PLANS.length; l++)
          expect(tolerance(l) * layoutFor(v, level === 11 ? l : level).paper.s).toBeGreaterThanOrEqual(30);
      });
    }
});

describe('Cut Along cuts', () => {
  it('starts every cut on its sheet edge, with the whole path on the paper', () => {
    for (let l = 2; l <= PLANS.length; l++) {
      for (const seed of SEEDS) {
        for (const cut of allCuts(l, seed)) {
          const s = startOf(cut),
            sh = cut.sheet,
            e = 1e-9;
          // Level 10's lines run edge to edge with a ring at each end, so one end may be on the sheet's top edge.
          const onEdge =
            Math.abs(s[0] - sh.x) < e ||
            Math.abs(s[0] - (sh.x + sh.w)) < e ||
            Math.abs(s[1] - (sh.y + sh.h)) < e ||
            (l === 10 && Math.abs(s[1] - sh.y) < e);
          expect(onEdge, `${cut.kind} at level ${l}`).toBe(true);
          for (const order of cut.orders)
            for (const p of order) {
              expect(p[0]).toBeGreaterThanOrEqual(-e);
              expect(p[0]).toBeLessThanOrEqual(PAPER_W + e);
              expect(p[1]).toBeGreaterThanOrEqual(-e);
              expect(p[1]).toBeLessThanOrEqual(1 + e);
            }
        }
      }
    }
  });

  it('gives a start ring at least 110 units across', () => {
    expect(2 * RING_R).toBeGreaterThanOrEqual(110);
  });

  it('lets the ghost finger’s thinned route cut every path, both ways', () => {
    for (let l = 2; l <= PLANS.length; l++) {
      for (const seed of SEEDS.slice(0, 10)) {
        for (const cut of allCuts(l, seed)) {
          for (const order of cut.orders) {
            const route = botRoute(cut, order, 0);
            expect(route.length).toBeLessThan(40);
            let progress = 0,
              prev = route[0];
            for (const to of route.slice(1)) {
              progress = advanceTrace(order, progress, prev, to, tolerance(l));
              prev = to;
            }
            expect(progress, `${cut.kind} at level ${l}`).toBe(order.length - 1);
          }
        }
      }
    }
  });

  it('can be cut to the end, both ways round a closed shape', () => {
    for (let l = 2; l <= PLANS.length; l++) {
      for (const seed of SEEDS.slice(0, 10)) {
        for (const cut of allCuts(l, seed)) {
          for (const order of cut.orders)
            expect(walk(order, tolerance(l)), `${cut.kind} at level ${l}`).toBe(order.length - 1);
        }
      }
    }
  });

  it('never lets a chord across a corner consume a checkpoint past it', () => {
    for (let l = 4; l <= PLANS.length; l++) {
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
              const i = c - back,
                j = c + ahead;
              const reached = advanceTrace(points, i, points[i], points[j], tol);
              expect(reached, `${cut.kind} corner ${c} at level ${l}`).toBeLessThanOrEqual(c);
            }
          }
        }
      }
    }
  });

  it('keeps separate stretches of one path apart, away from corners and the joint', () => {
    for (let l = 2; l <= PLANS.length; l++) {
      for (const seed of SEEDS.slice(0, 6)) {
        for (const cut of allCuts(l, seed)) {
          const tol = tolerance(l),
            points = cut.orders[0];
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
              expect(
                dist(points[i], points[j]),
                `${cut.kind} ${i}/${j} at level ${l}`,
              ).toBeGreaterThanOrEqual(2 * tol);
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

  it('does not pick a way round from a wobble coming up the lead-in', () => {
    for (const cut of [
      cutsFor(6, new Rng(1))[1],
      boardsFor(new Rng(4))[2].cuts[0],
      cutsFor(5, new Rng(1))[2],
    ]) {
      const tol = 0.072,
        pts = cut.orders[0];
      for (const wobble of [-0.004, 0.004]) {
        let state: { order: number | null; progress: number } = { order: null, progress: 0 },
          prev = pts[0];
        for (let k = 1; k <= cut.lead; k++) {
          const to: Point = [pts[k][0] + wobble, pts[k][1]];
          state = chooseOrder(cut, state.order, state.progress, prev, to, tol);
          prev = to;
        }
        expect(state.order, cut.kind).toBe(null);
        expect(state.progress).toBe(cut.lead);
      }
    }
  });

  it('gives the same paper for the same seed', () => {
    for (const l of [2, 3, 4, 5, 6, 7, 9]) expect(cutsFor(l, new Rng(42))).toEqual(cutsFor(l, new Rng(42)));
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
    const cut = cutsFor(3, new Rng(5))[0],
      tol = tolerance(3),
      pts = pathOf(cut, null);
    let progress = advanceTrace(pts, 0, pts[0], pts[10], tol);
    let misses = 0,
      missed = false,
      before = -1;
    let prev = pts[10];
    // The finger wanders straight away from the line, further each move.
    for (const k of [1, 2, 3, 4]) {
      const to: Point = [pts[10][0], pts[10][1] + k * 0.12];
      const next = advanceTrace(pts, progress, prev, to, tol);
      if (next === progress && offTrail(to, pts[progress], tol) && !missed && countsStrays(3)) {
        missed = true;
        misses++;
        before = progress;
      }
      progress = next;
      prev = to;
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
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j])).toBe(false);
      }
    }
  });

  it('finds the mark under a touch and skips snipped ones', () => {
    const marks = fringeMarks(new Rng(3)),
      s = 450;
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
        for (let i = 0; i < b.cuts.length; i++)
          for (let j = i + 1; j < b.cuts.length; j++) {
            let min = Infinity;
            for (const p of b.cuts[i].orders[0])
              for (const q of b.cuts[j].orders[0]) min = Math.min(min, dist(p, q));
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

describe('Cut Along themes and shapes', () => {
  const piecesOf = (l: number, seed: number): PieceId[] =>
    l === 1 ? ['grass', 'grass', 'grass'] : allCuts(l, seed).map((c) => c.piece);

  it('picks only the level’s themes, and shows each of them across seeds', () => {
    for (let l = 1; l <= PLANS.length; l++) {
      const seen = new Set(SEEDS.map((seed) => themeFor(l, new Rng(seed))));
      expect([...seen].sort()).toEqual([...THEMES[l - 1]].sort());
    }
    expect(THEMES.filter((t) => t.length >= 2).length).toBeGreaterThanOrEqual(6);
  });

  it('puts every piece of every theme inside the picture, and never two in one place', () => {
    for (let l = 1; l <= PLANS.length; l++)
      for (const theme of THEMES[l - 1])
        for (const seed of SEEDS.slice(0, 12)) {
          const slots = slotsFor(l, theme, piecesOf(l, seed));
          for (const sl of slots) {
            expect(sl.x, `${theme} ${sl.piece}`).toBeGreaterThanOrEqual(0);
            expect(sl.y).toBeGreaterThanOrEqual(0);
            expect(sl.x + sl.w, `${theme} ${sl.piece}`).toBeLessThanOrEqual(1);
            expect(sl.y + sl.h, `${theme} ${sl.piece}`).toBeLessThanOrEqual(1);
            expect(sl.w * sl.h).toBeGreaterThan(0);
          }
          const spots = new Set(slots.map((sl) => `${sl.x},${sl.y}`));
          expect(spots.size, `${theme} at level ${l}`).toBe(slots.length);
        }
  });

  it('gives every piece in every theme a spoken line and a colour', () => {
    for (let l = 1; l <= PLANS.length; l++)
      for (const theme of THEMES[l - 1])
        for (const seed of SEEDS.slice(0, 12)) {
          for (const sl of slotsFor(l, theme, piecesOf(l, seed))) {
            expect(
              LINES[pieceLine(theme, sl.piece) as keyof typeof LINES],
              pieceLine(theme, sl.piece),
            ).toBeDefined();
            expect(swatch[pieceColor(theme, sl.piece)], `${theme} ${sl.piece}`).toBeDefined();
          }
        }
  });

  it('offers three of four shapes at level 6 and three of seven at level 7, each at most once', () => {
    for (const [l, all] of [
      [6, ['window', 'sail', 'door', 'kite']],
      [7, [...PICTURE_SHAPES]],
    ] as const) {
      const seen = new Set<string>();
      for (const seed of SEEDS) {
        const pieces = cutsFor(l, new Rng(seed)).map((c) => c.piece);
        expect(pieces).toHaveLength(3);
        expect(new Set(pieces).size).toBe(3);
        pieces.forEach((p) => {
          expect(all).toContain(p);
          seen.add(p);
        });
      }
      expect([...seen].sort()).toEqual([...all].sort());
    }
  });

  it('keeps the star’s points fat: the notches at least 0.55 of the way out', () => {
    const radii = OUTLINES.star.loop.map(([x, y]) => Math.hypot(x, y));
    expect(Math.min(...radii) / Math.max(...radii)).toBeGreaterThanOrEqual(0.55);
  });

  it('cuts every new shape to the end both ways, by hand and by the ghost finger', () => {
    // The shared cut tests sample a few seeds; here every new shape is cut on purpose, wherever its level puts it.
    const wanted = new Set(['door', 'kite', 'star', 'moon']);
    for (const l of [6, 7]) {
      const tol = tolerance(l);
      const cuts = SEEDS.flatMap((seed) => cutsFor(l, new Rng(seed))).filter((c) => wanted.has(c.kind));
      const kinds = new Set(cuts.map((c) => c.kind));
      expect(kinds.size).toBe(2);
      for (const kind of kinds) {
        const cut = cuts.find((c) => c.kind === kind)!;
        for (const order of cut.orders) {
          expect(walk(order, tol), `${kind} walked`).toBe(order.length - 1);
          const route = botRoute(cut, order, 0);
          let progress = 0,
            prev = route[0];
          for (const to of route.slice(1)) {
            progress = advanceTrace(order, progress, prev, to, tol);
            prev = to;
          }
          expect(progress, `${kind} by the ghost finger`).toBe(order.length - 1);
        }
        for (const corner of cut.corners)
          expect(
            cut.orders[0].some((p) => dist(p, corner) < 1e-9),
            `${kind} corner on the path`,
          ).toBe(true);
      }
    }
  });
});

describe('Cut Along level 9 spirals', () => {
  const spirals = SEEDS.flatMap((seed) => cutsFor(9, new Rng(seed)));

  it('cuts a shell, a snake, then a cat’s tail or a mirrored snake, each seed', () => {
    const thirds = new Set<string>();
    for (const seed of SEEDS) {
      const pieces = cutsFor(9, new Rng(seed)).map((c) => c.piece);
      expect(pieces.slice(0, 2)).toEqual(['shell', 'snake']);
      expect(['cat-tail', 'coil']).toContain(pieces[2]);
      thirds.add(pieces[2]);
    }
    expect([...thirds].sort()).toEqual(['cat-tail', 'coil']);
    expect(planFor(9).count).toBe(3);
  });

  it('keeps each turn more than two corridors and a sample from the next, and the middle open', () => {
    const tol = tolerance(9);
    expect(RING_GAP).toBeGreaterThanOrEqual(0.16);
    expect(RING_GAP).toBeGreaterThan(2 * tol + SPACING);
    expect(INNER_R).toBeGreaterThanOrEqual(0.14);
    for (const cut of spirals) {
      const sp = cut.spiral!;
      const pts = cut.orders[0];
      const radii = pts.map((p) => dist(p, [sp.cx, sp.cy]));
      expect(Math.min(...radii)).toBeGreaterThanOrEqual(INNER_R - 1e-6);
      // Once the line turns, one straight swipe from anywhere on it never cuts more than 135° of the turn (the tight middle
      // is the most forgiving), so it can never cut across to the next turn in.
      const ang = (p: Point) => Math.atan2(p[1] - sp.cy, p[0] - sp.cx);
      const joint = radii.findIndex((r) => r <= sp.outer + 1e-6);
      expect(joint).toBeGreaterThan(0);
      for (let i = joint; i < pts.length - 1; i++) {
        for (let j = i + 1; j < Math.min(pts.length, i + 60); j++) {
          const reached = advanceTrace(pts, i, pts[i], pts[j], tol);
          let turned = 0;
          for (let q = i + 1; q <= reached; q++)
            turned += Math.abs(((ang(pts[q]) - ang(pts[q - 1]) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
          expect(turned, `${cut.piece} ${i}→${j}`).toBeLessThan(0.75 * Math.PI);
        }
      }
    }
  });

  it('starts on the paper’s bottom edge and keeps every turn a corridor inside the paper', () => {
    const tol = tolerance(9);
    for (const cut of spirals) {
      const pts = cut.orders[0];
      expect(pts[0][1]).toBeCloseTo(1, 9);
      for (const p of pts.slice(1)) {
        expect(p[1]).toBeGreaterThanOrEqual(tol);
        expect(p[0]).toBeGreaterThanOrEqual(tol);
        expect(p[0]).toBeLessThanOrEqual(PAPER_W - tol);
      }
      for (const p of cut.outline!) {
        expect(p[0]).toBeGreaterThanOrEqual(0);
        expect(p[0]).toBeLessThanOrEqual(PAPER_W);
        expect(p[1]).toBeGreaterThanOrEqual(0);
        expect(p[1]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is cut to the middle by hand and by the ghost finger, both the plain and the mirrored snake', () => {
    const tol = tolerance(9);
    const kinds = new Set(spirals.map((c) => c.piece));
    expect(kinds.size).toBe(4);
    for (const piece of kinds) {
      const cut = spirals.find((c) => c.piece === piece)!,
        order = cut.orders[0];
      expect(walk(order, tol), `${piece} walked`).toBe(order.length - 1);
      const route = botRoute(cut, order, 0);
      let progress = 0,
        prev = route[0];
      for (const to of route.slice(1)) {
        progress = advanceTrace(order, progress, prev, to, tol);
        prev = to;
      }
      expect(progress, `${piece} by the ghost finger`).toBe(order.length - 1);
    }
  });

  it('turns the mirrored snake the other way round', () => {
    const turn = (cut: Cut) => {
      const pts = cut.orders[0],
        sp = cut.spiral!;
      let sum = 0;
      for (let i = 1; i < pts.length; i++) {
        const a = Math.atan2(pts[i - 1][1] - sp.cy, pts[i - 1][0] - sp.cx),
          b = Math.atan2(pts[i][1] - sp.cy, pts[i][0] - sp.cx);
        sum += ((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
      }
      return Math.sign(sum);
    };
    const snake = spirals.find((c) => c.piece === 'snake')!,
      coil = spirals.find((c) => c.piece === 'coil')!;
    expect(turn(snake)).toBe(-turn(coil));
  });

  it('fits the paper in every standard view with the corridor at least 30 units wide', () => {
    for (const v of Object.values(VIEWS))
      expect(tolerance(9) * layoutFor(v).paper.s).toBeGreaterThanOrEqual(30);
  });
});

describe('Cut Along level 10 lines', () => {
  const area = (poly: readonly Point[]) =>
    Math.abs(
      poly.reduce((a, p, i) => {
        const q = poly[(i + 1) % poly.length];
        return a + p[0] * q[1] - q[0] * p[1];
      }, 0),
    ) / 2;
  /** What a piece is, from its corners alone: three is a triangle, four with equal sides a square, four longer than wide a strip. */
  const kindOf = (poly: readonly Point[]): Pair | 'other' => {
    if (poly.length === 3) return 'triangles';
    if (poly.length !== 4) return 'other';
    const xs = poly.map((p) => p[0]),
      ys = poly.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs),
      h = Math.max(...ys) - Math.min(...ys);
    if (Math.abs(area(poly) - w * h) > 1e-9) return 'other';
    return Math.abs(w - h) < 1e-9
      ? 'squares'
      : Math.max(w, h) >= 2 * Math.min(w, h) - 1e-9
        ? 'strips'
        : 'other';
  };

  it('has three boards: a square with two lines, the rectangle with two, then with three', () => {
    for (const seed of SEEDS) {
      const boards = splitBoardsFor(new Rng(seed));
      expect(boards.map((b) => b.lines.length)).toEqual([2, 2, 3]);
      expect(boards[0].sheet.w).toBeCloseTo(boards[0].sheet.h);
      expect(boards[1].sheet.w).toBeCloseTo(2 * boards[1].sheet.h);
      for (const b of boards) expect(b.cuts).toHaveLength(2 * b.lines.length);
    }
  });

  it('cuts the sheet into two equal pieces of exactly the kind each line claims', () => {
    for (const seed of SEEDS)
      for (const b of splitBoardsFor(new Rng(seed)))
        for (const ln of b.lines) {
          const [p, q] = splitSheet(b.sheet, ln);
          expect(kindOf(p), JSON.stringify(ln)).toBe(ln.makes);
          expect(kindOf(q)).toBe(ln.makes);
          expect(area(p)).toBeCloseTo((b.sheet.w * b.sheet.h) / 2);
          expect(area(q)).toBeCloseTo((b.sheet.w * b.sheet.h) / 2);
        }
  });

  it('has exactly one line that makes the pair the picture needs, and a spoken line for every other', () => {
    for (const seed of SEEDS)
      for (const b of splitBoardsFor(new Rng(seed))) {
        expect(b.lines.filter((ln) => ln.makes === b.need)).toHaveLength(1);
        expect(b.lines.filter((_, i) => judgeLine(b, i))).toHaveLength(1);
        expect(b.lines[b.fits].makes).toBe(b.need);
        b.lines.forEach((_, i) => {
          if (judgeLine(b, i)) return;
          const line = makesLine(b, i);
          expect(Object.values(MAKES)).toContain(line);
          expect(LINES[line], line).toBeDefined();
        });
        expect(LINES[`cut.instruct.two.${b.need}` as keyof typeof LINES]).toBeDefined();
      }
  });

  it('fills each pair of gaps in the picture once a round, and shows every order across seeds', () => {
    const orders = new Set<string>();
    const slots = slotsFor(10, 'twos', []);
    for (const seed of SEEDS) {
      const needs = splitBoardsFor(new Rng(seed)).map((b) => b.need);
      expect([...needs].sort()).toEqual(['squares', 'strips', 'triangles']);
      for (const need of needs) expect(slots.filter((sl) => sl.piece === PAIR_PIECE[need])).toHaveLength(2);
      orders.add(needs.join());
    }
    expect(orders.size).toBe(3);
    expect(slots).toHaveLength(6);
  });

  it('puts a ring at both ends of every line, each pair of ends from one line, the two cuts the same line reversed', () => {
    for (const seed of SEEDS.slice(0, 10))
      for (const b of splitBoardsFor(new Rng(seed))) {
        b.lines.forEach((ln, i) => {
          const a = b.cuts[2 * i].orders[0],
            r = b.cuts[2 * i + 1].orders[0];
          expect(lineOfCut(2 * i)).toBe(i);
          expect(lineOfCut(2 * i + 1)).toBe(i);
          expect(twinOf(2 * i)).toBe(2 * i + 1);
          expect(twinOf(2 * i + 1)).toBe(2 * i);
          expect(dist(a[0], ln.from)).toBeLessThan(1e-9);
          expect(dist(r[0], ln.to)).toBeLessThan(1e-9);
          expect(dist(a.at(-1)!, ln.to)).toBeLessThan(1e-9);
        });
      }
  });

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`keeps every ring at least two ring-radii from every other, and inside the touch area, in the ${name} view`, () => {
      const { paper } = layoutFor(v),
        sc = paper.s;
      for (const seed of SEEDS.slice(0, 10))
        for (const b of splitBoardsFor(new Rng(seed))) {
          const rings = b.cuts.map(startOf);
          for (let i = 0; i < rings.length; i++)
            for (let j = i + 1; j < rings.length; j++) {
              expect(dist(rings[i], rings[j]) * sc, `rings ${i} and ${j}`).toBeGreaterThanOrEqual(2 * RING_R);
            }
          for (const r of rings) {
            // The touch layer starts at the paper's top edge and reaches EDGE beyond its sides and bottom; a touch within the ring must land on it.
            expect(r[1] * sc).toBeGreaterThanOrEqual(RING_R);
            expect(r[0] * sc).toBeGreaterThanOrEqual(RING_R - EDGE);
            expect((PAPER_W - r[0]) * sc).toBeGreaterThanOrEqual(RING_R - EDGE);
            expect((1 - r[1]) * sc).toBeGreaterThanOrEqual(RING_R - EDGE);
          }
        }
    });
  }

  it('never lets a drag along one line advance another where they cross', () => {
    for (const seed of SEEDS.slice(0, 10))
      for (const b of splitBoardsFor(new Rng(seed))) {
        const tol = tolerance(10);
        b.cuts.forEach((cut, i) => {
          // Walk this cut all the way; every other cut, fed the same finger, stays at its ring.
          const path = cut.orders[0];
          expect(walk(path, tol)).toBe(path.length - 1);
          b.cuts.forEach((other, j) => {
            if (j === i) return;
            let progress = 0,
              prev = path[0];
            for (const to of path.slice(1)) {
              progress = advanceTrace(other.orders[0], progress, prev, to, tol);
              prev = to;
            }
            expect(progress, `cut ${j} moved with cut ${i}`).toBe(0);
          });
        });
      }
  });

  it('counts a wrong line from a fifth of its length, from its own ring, before it reaches the crossing', () => {
    for (const seed of SEEDS.slice(0, 10))
      for (const b of splitBoardsFor(new Rng(seed)))
        for (const cut of b.cuts) {
          const pts = cut.orders[0],
            at = Math.ceil((pts.length - 1) * 0.2);
          expect(wrongReached(at - 1, pts.length)).toBe(false);
          expect(wrongReached(at, pts.length)).toBe(true);
          // The lines cross at the sheet's middle; a fifth in is well short of it.
          const mid: Point = [b.sheet.x + b.sheet.w / 2, b.sheet.y + b.sheet.h / 2];
          expect(dist(pts[at], mid)).toBeGreaterThan(2 * tolerance(10));
        }
  });

  it('gives the same boards for the same seed', () => {
    expect(JSON.stringify(splitBoardsFor(new Rng(42)))).toBe(JSON.stringify(splitBoardsFor(new Rng(42))));
  });
});

describe('Cut Along level 11 my own picture', () => {
  it('offers three different picture shapes on each of three sheets, and shows all seven across seeds', () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const sheets = ownChoicesFor(new Rng(seed));
      expect(sheets).toHaveLength(3);
      for (const offer of sheets) {
        expect(new Set(offer).size).toBe(3);
        for (const k of offer) {
          expect(PICTURE_SHAPES).toContain(k);
          seen.add(k);
        }
      }
    }
    expect(seen.size).toBe(PICTURE_SHAPES.length);
    expect(ownChoicesFor(new Rng(5))).toEqual(ownChoicesFor(new Rng(5)));
  });

  it('cuts whichever shape she chooses at level 7’s size, so every offer is cuttable both ways', () => {
    for (const k of PICTURE_SHAPES) {
      const cut = pictureCut(k);
      expect(cut.closed).toBe(true);
      for (const order of cut.orders) expect(walk(order, tolerance(11)), k).toBe(order.length - 1);
    }
  });

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`gives each offered shape a touch box at least 110 units across that never overlaps another, on the paper, in the ${name} view`, () => {
      const s = layoutFor(v, 11).paper.s;
      expect(2 * OWN_BOX * s).toBeGreaterThanOrEqual(110);
      for (let i = 1; i < OWN_XS.length; i++) expect(OWN_XS[i] - OWN_XS[i - 1]).toBeGreaterThan(2 * OWN_BOX);
      expect(OWN_XS[0] - OWN_BOX).toBeGreaterThanOrEqual(0);
      expect(OWN_XS[2] + OWN_BOX).toBeLessThanOrEqual(PAPER_W);
      expect(OWN_Y - OWN_BOX).toBeGreaterThanOrEqual(0);
      expect(OWN_Y + OWN_BOX).toBeLessThanOrEqual(1);
    });
  }

  it('chooses the shape under a touch, and nothing (never a miss) between them', () => {
    OWN_XS.forEach((x, i) => {
      expect(choiceAt([x, OWN_Y])).toBe(i);
      expect(choiceAt([x + OWN_BOX * 0.9, OWN_Y - OWN_BOX * 0.9])).toBe(i);
    });
    expect(choiceAt([(OWN_XS[0] + OWN_XS[1]) / 2, OWN_Y])).toBe(null);
    expect(choiceAt([OWN_XS[1], 0.95])).toBe(null);
  });

  it('grows the picture to 280 upright and keeps it at least as big as the other levels’ in every view', () => {
    expect(layoutFor(VIEWS.portrait, 11).picture.w).toBeGreaterThanOrEqual(280);
    for (const v of Object.values(VIEWS))
      expect(layoutFor(v, 11).picture.w).toBeGreaterThanOrEqual(layoutFor(v, 1).picture.w);
  });

  it('lands every drop with the whole piece inside the picture, and a drop off it in the middle', () => {
    const lo = OWN_SIZE / 2;
    for (let x = -0.5; x <= 1.5; x += 0.05)
      for (let y = -0.5; y <= 1.5; y += 0.05) {
        const p = placeIn(x, y);
        expect(p.x - lo).toBeGreaterThanOrEqual(0);
        expect(p.x + lo).toBeLessThanOrEqual(1);
        expect(p.y - lo).toBeGreaterThanOrEqual(0);
        expect(p.y + lo).toBeLessThanOrEqual(1);
        if (x < 0 || x > 1 || y < 0 || y > 1) expect(p).toEqual({ x: 0.5, y: 0.5 });
      }
    // A drop well inside stays exactly where she let go.
    expect(placeIn(0.4, 0.6)).toEqual({ x: 0.4, y: 0.6 });
  });

  it('gives the ghost finger three spread-out drops inside the picture, the same for a seed', () => {
    for (const seed of SEEDS) {
      const spots = botSpots(new Rng(seed));
      expect(spots).toHaveLength(3);
      expect(new Set(spots.map((p) => p.x)).size).toBe(3);
      for (const p of spots) expect(placeIn(p.x, p.y)).toEqual(p);
    }
    expect(botSpots(new Rng(8))).toEqual(botSpots(new Rng(8)));
  });
});
