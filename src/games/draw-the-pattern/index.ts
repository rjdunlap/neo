import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor } from '../../progress/difficulty';
import { offTrail, startArrow, tuneStep } from '../../learning/tracing/feedback';
import type { Point } from '../../learning/tracing/strokes';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  DOT_HIT, LEVELS, REVEAL, RING_R, SCRATCH_EVERY, STRIP_W, botRoute, chooseOrder, hintStretch, layoutFor, lengthTo, levelOf, markCount,
  nextDot, onPaper, pathOf, planFor, stickerKind, stickerPath, stones, stripsFor, tolerance, wrongReached,
  type Layout, type PieceId, type Rect, type Strip, type Stroke,
} from './logic';

/** One stroke's drawing state: which way round (or which candidate), and how far the crayon has come. */
interface Track { stroke: Stroke; order: number | null; progress: number; tried: boolean }

interface Drag { id: number; prev: Point; missed: boolean; stopped: boolean; travel: number; outside: boolean; mark: Point[] | null }

/** Where a strip's piece goes in the host's picture, in the picture's 0–1 units. */
type Slot = Rect;

const PAPERS: ColorName[] = ['yellow', 'blue', 'pink', 'green', 'orange', 'teal', 'purple'];
const CRAYONS: ColorName[] = ['purple', 'red', 'blue', 'orange', 'green', 'red', 'blue'];

/** Each level's picture: one slot per strip, in round order. */
function slotsFor(level: number, strips: readonly Strip[]): Slot[] {
  const l = levelOf(level);
  if (l === 1) return strips.map((_, i) => ({ x: 0.04, y: 0.56 + i * 0.13, w: 0.92, h: 0.12 }));
  const top = { x: 0.04, y: 0.3, w: 0.92, h: 0.34 }, low = { x: 0.04, y: 0.66, w: 0.92, h: 0.28 };
  // Level 2 puts a sky piece (washing, rain) above a ground one; level 3 a zigzag above a wave (the kite's tail flies
  // above both); level 4 a circle top-right or a wheel on the right, clear of the loops.
  const at: Partial<Record<PieceId, Slot>> = {
    ground: { x: 0.04, y: 0.74, w: 0.92, h: 0.1 }, washing: { x: 0.04, y: 0.1, w: 0.92, h: 0.1 }, road: { x: 0.04, y: 0.76, w: 0.92, h: 0.1 },
    fence: { x: 0.12, y: 0.44, w: 0.76, h: 0.3 }, rain: { x: 0.12, y: 0.46, w: 0.76, h: 0.26 }, candles: { x: 0.3, y: 0.44, w: 0.4, h: 0.16 },
    crown: { x: 0.2, y: 0.32, w: 0.6, h: 0.28 }, snake: { x: 0.04, y: 0.68, w: 0.92, h: 0.22 }, tail: { x: 0.3, y: 0.08, w: 0.62, h: 0.18 },
    sun: { x: 0.62, y: 0.06, w: 0.3, h: 0.3 }, balloon: { x: 0.64, y: 0.06, w: 0.24, h: 0.26 }, wheel: { x: 0.64, y: 0.32, w: 0.24, h: 0.24 },
    sheep: { x: 0.04, y: 0.58, w: 0.92, h: 0.3 }, clouds: { x: 0.04, y: 0.08, w: 0.54, h: 0.2 }, smoke: { x: 0.14, y: 0.08, w: 0.42, h: 0.24 },
    window: { x: 0.27, y: 0.6, w: 0.2, h: 0.2 }, house: { x: 0.14, y: 0.48, w: 0.46, h: 0.44 }, roof: { x: 0.08, y: 0.12, w: 0.58, h: 0.36 },
    ribbon: { x: 0.14, y: 0.44, w: 0.5, h: 0.44 }, present: { x: 0.14, y: 0.44, w: 0.5, h: 0.44 }, bow: { x: 0.29, y: 0.24, w: 0.2, h: 0.2 },
    mast: { x: 0.3, y: 0.12, w: 0.26, h: 0.5 }, cabin: { x: 0.14, y: 0.62, w: 0.56, h: 0.16 }, sail: { x: 0.45, y: 0.18, w: 0.2, h: 0.4 },
    bridge: { x: 0.04, y: 0.5, w: 0.92, h: 0.3 }, bunting: { x: 0.04, y: 0.08, w: 0.92, h: 0.2 },
    // Level 9: the kite flies top-right, clear of the rain cloud; the treasure mark lies on the grass below the rain.
    kite: { x: 0.7, y: 0.03, w: 0.2, h: 0.18 }, treasure: { x: 0.34, y: 0.76, w: 0.32, h: 0.14 },
  };
  // Level 5's two strips, whatever they are, stack one above the other, a sky piece on top when only the second is one.
  if (l === 5) return SKY.has(strips[1].piece) && !SKY.has(strips[0].piece) ? [low, top] : [top, low];
  // Level 10's zigzag stands above its line, whichever ground, road or washing line that is.
  if (l === 10) return strips.map((s) => at[s.piece] ?? top);
  return strips.map((s, i) => at[s.piece] ?? (i === 0 ? top : low));
}

const SKY: ReadonlySet<PieceId> = new Set<PieceId>(['clouds', 'tail', 'smoke']);

/** Pieces drawn under the others in the picture: the house under its window, the present under its ribbon, the boat under its mast. */
const BEHIND: ReadonlySet<PieceId> = new Set<PieceId>(['house', 'present', 'cabin', 'sail']);

/** Level 1's marks: each lifted touch sprouts flowers in the meadow, fish in the pond, or birds in the sky. */
function sprout(g: Graphics, piece: PieceId, x: number, y: number, color: ColorName, k = 1) {
  const c = swatch[color];
  if (piece === 'pond') {
    g.ellipse(x, y, 13 * k, 8 * k).fill(c.fill).stroke({ width: 2, color: c.line })
      .poly([x + 11 * k, y, x + 21 * k, y - 8 * k, x + 21 * k, y + 8 * k]).fill(c.fill).stroke({ width: 2, color: c.line, join: 'round' })
      .circle(x - 6 * k, y - 2 * k, 2 * k).fill(ink);
  } else if (piece === 'sky') {
    g.moveTo(x - 14 * k, y - 4 * k).quadraticCurveTo(x - 7 * k, y - 12 * k, x, y).quadraticCurveTo(x + 7 * k, y - 12 * k, x + 14 * k, y - 4 * k)
      .stroke({ width: 4 * k, color: c.line, cap: 'round', join: 'round' });
  } else {
    for (let i = 0; i < 5; i++) g.circle(x + Math.cos((i * 2 * Math.PI) / 5) * 11 * k, y - 14 * k + Math.sin((i * 2 * Math.PI) / 5) * 11 * k, 8 * k).fill(c.fill);
    g.circle(x, y - 14 * k, 6 * k).fill(swatch.yellow.fill).moveTo(x, y - 4 * k).lineTo(x, y + 10 * k).stroke({ width: 4 * k, color: swatch.green.line });
  }
}

/** Map strip points into a slot (the stroke's own bounds stretched to the slot). */
function fitter(all: readonly Point[], r: Rect): (p: Point) => [number, number] {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of all) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const w = Math.max(1e-6, x1 - x0), h = Math.max(1e-6, y1 - y0);
  return ([x, y]) => [r.x + ((x - x0) / w) * r.w, r.y + ((y - y0) / h) * r.h];
}

/** A strip's piece in the picture: her strokes turned into the thing they become (or a soft outline where it will go). */
function drawPiece(g: Graphics, strip: Strip, paths: readonly Point[][], r: Rect, ghost: boolean) {
  const all = paths.flat();
  if (!all.length) return;
  const f = fitter(all, r);
  const poly = (pts: readonly Point[]) => pts.flatMap((p) => f(p));
  const line = (pts: readonly Point[], width: number, color: number, alpha = 1) => {
    const [x, y] = f(pts[0]);
    g.moveTo(x, y);
    for (const p of pts.slice(1)) g.lineTo(...f(p));
    g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
  };
  if (ghost) {
    for (const p of paths) line(p, 4, 0xffffff, 0.7);
    return;
  }
  const below = (pts: readonly Point[], color: ColorName) => {
    g.poly([...poly(pts), r.x + r.w, r.y + r.h + 4, r.x, r.y + r.h + 4]).fill(swatch[color].fill);
    line(pts, 4, swatch[color].line);
  };
  const above = (pts: readonly Point[], color: ColorName) => {
    g.poly([...poly(pts), r.x + r.w, r.y - 4, r.x, r.y - 4]).fill(swatch[color].fill);
    line(pts, 4, swatch[color].line);
  };
  const at = (pts: readonly Point[], u: number) => f(pts[Math.floor((pts.length - 1) * u)]);
  const ends = (pts: readonly Point[]) => {
    let lo = pts[0], hi = pts[0];
    for (const p of pts) { if (p[0] < lo[0]) lo = p; if (p[0] > hi[0]) hi = p; }
    return [f(lo), f(hi)];
  };
  const MARKS = ['pink', 'yellow', 'red', 'purple'] as const;
  switch (strip.piece) {
    case 'meadow': case 'pond': case 'sky': {
      const band = strip.piece === 'meadow' ? swatch.green.fill : strip.piece === 'pond' ? swatch.blue.fill : swatch.blue.light;
      g.rect(r.x, r.y + r.h * 0.5, r.w, r.h * 0.5).fill(band);
      for (let i = 0; i < 6; i++) {
        const x = r.x + ((i + 0.5) / 6) * r.w, y = r.y + r.h * (strip.piece === 'meadow' ? 0.45 : 0.75);
        if (strip.piece === 'meadow') g.circle(x, y, 6).fill(swatch[MARKS[i % 4]].fill).circle(x, y, 2.5).fill(swatch.yellow.line);
        else sprout(g, strip.piece, x, y, strip.piece === 'pond' ? (['orange', 'yellow', 'red'] as const)[i % 3] : 'purple', 0.45);
      }
      break;
    }
    case 'ground': below(paths[0], 'green'); break;
    case 'road': {
      // A grey road under her line, with white dashes and a car on it.
      g.poly([...poly(paths[0]), r.x + r.w, r.y + r.h + 4, r.x, r.y + r.h + 4]).fill(swatch.white.line);
      line(paths[0], 4, ink);
      const [[x0, y], [x1]] = ends(paths[0]);
      for (let x = x0 + 8; x < x1 - 14; x += 26) g.moveTo(x, y + r.h * 0.7 + 4).lineTo(x + 12, y + r.h * 0.7 + 4);
      g.stroke({ width: 3, color: 0xffffff, cap: 'round' });
      const cx = x0 + (x1 - x0) * 0.12;
      g.roundRect(cx - 22, y - 22, 44, 16, 6).fill(swatch.red.fill).stroke({ width: 2, color: swatch.red.line })
        .roundRect(cx - 12, y - 32, 22, 12, 4).fill(swatch.blue.light).stroke({ width: 2, color: swatch.red.line })
        .circle(cx - 12, y - 5, 6).circle(cx + 12, y - 5, 6).fill(ink);
      break;
    }
    case 'washing': {
      const [[x0, y0], [x1, y1]] = ends(paths[0]);
      g.moveTo(x0, y0).lineTo(x0, y0 + 30).moveTo(x1, y1).lineTo(x1, y1 + 30).stroke({ width: 5, color: swatch.brown.line, cap: 'round' });
      line(paths[0], 3, swatch.brown.line);
      const socks = ['red', 'blue', 'yellow', 'pink', 'green'] as const;
      socks.forEach((c, i) => {
        const [x, y] = at(paths[0], (i + 0.6) / (socks.length + 0.2));
        g.poly([x - 5, y, x + 5, y, x + 5, y + 16, x + 12, y + 20, x + 12, y + 26, x - 5, y + 26]).fill(swatch[c].fill).stroke({ width: 2, color: swatch[c].line, join: 'round' });
      });
      break;
    }
    case 'mountains': below(paths[0], 'purple'); break;
    case 'teeth': {
      above(paths[0], 'green');
      g.poly([...poly(paths[0]), r.x + r.w, r.y + r.h, r.x, r.y + r.h]).fill(0xffffff);
      line(paths[0], 3, swatch.white.line);
      g.rect(r.x, r.y + r.h * 0.88, r.w, r.h * 0.12).fill(swatch.green.fill);
      const [ex, ey] = [r.x + r.w * 0.12, r.y - 4];
      g.circle(ex, ey, 9).fill(0xffffff).stroke({ width: 2, color: swatch.green.line }).circle(ex + 2, ey, 4).fill(ink);
      break;
    }
    case 'crown': {
      below(paths[0], 'yellow');
      (['red', 'blue', 'green'] as const).forEach((c, i) => g.circle(r.x + r.w * (0.25 + i * 0.25), r.y + r.h * 0.84, 5).fill(swatch[c].fill));
      break;
    }
    case 'sea': {
      below(paths[0], 'blue');
      const [bx, by] = f(paths[0][Math.floor(paths[0].length * 0.6)]);
      g.poly([bx - 16, by - 8, bx + 16, by - 8, bx + 10, by + 2, bx - 10, by + 2]).fill(swatch.red.fill).stroke({ width: 2, color: swatch.red.line });
      g.poly([bx, by - 9, bx, by - 30, bx + 13, by - 12]).fill(0xffffff).stroke({ width: 2, color: swatch.white.line });
      break;
    }
    case 'snake': {
      line(paths[0], 16, swatch.green.line);
      line(paths[0], 10, swatch.green.fill);
      const [hx, hy] = f(paths[0].at(-1)!);
      g.ellipse(hx + 4, hy, 13, 10).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line })
        .circle(hx + 7, hy - 3, 2.5).fill(ink)
        .moveTo(hx + 16, hy + 2).lineTo(hx + 24, hy + 2).lineTo(hx + 28, hy - 1).moveTo(hx + 24, hy + 2).lineTo(hx + 28, hy + 5).stroke({ width: 2, color: swatch.red.line });
      break;
    }
    case 'tail': {
      line(paths[0], 3, swatch.white.line);
      for (let i = 1; i <= 4; i++) {
        const [x, y] = at(paths[0], i / 5), c = swatch[MARKS[i % 4]];
        g.poly([x - 7, y - 5, x, y, x - 7, y + 5]).poly([x + 7, y - 5, x, y, x + 7, y + 5]).fill(c.fill);
      }
      const [kx, ky] = f(paths[0][0]);
      g.poly([kx - 6, ky - 26, kx + 10, ky - 6, kx - 2, ky + 2, kx - 18, ky - 16]).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line, join: 'round' });
      break;
    }
    case 'fence':
      for (const p of paths) line(p, 9, swatch.brown.line);
      line([paths[0][Math.floor(paths[0].length * 0.35)], [paths.at(-1)!.at(-1)![0], paths[0][Math.floor(paths[0].length * 0.35)][1]]], 6, swatch.brown.fill);
      break;
    case 'rain': {
      for (const p of paths) line(p, 5, swatch.blue.line);
      for (let i = 0; i < 4; i++) g.circle(r.x + r.w * (0.2 + i * 0.2), r.y - 8 - (i % 2) * 6, 22).fill(0xffffff);
      g.roundRect(r.x + r.w * 0.06, r.y - 14, r.w * 0.88, 20, 10).fill(0xffffff);
      break;
    }
    case 'candles': {
      g.roundRect(r.x - r.w * 0.05, r.y + r.h, r.w * 1.1, r.h, 8).fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line })
        .rect(r.x - r.w * 0.05, r.y + r.h * 1.45, r.w * 1.1, 5).fill(0xffffff);
      paths.forEach((p, i) => {
        line(p, 8, swatch[(['blue', 'yellow', 'green'] as const)[i % 3]].line);
        const [x, y] = f(p[0]);
        g.ellipse(x, y - 9, 5, 8).fill(swatch.orange.fill).ellipse(x, y - 7, 2.5, 4).fill(swatch.yellow.fill);
      });
      break;
    }
    case 'sun':
      g.poly(poly(paths[0])).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
      break;
    case 'balloon': {
      const [bx, by] = [r.x + r.w / 2, r.y + r.h];
      g.moveTo(bx, by).quadraticCurveTo(bx - 10, by + r.h * 0.3, bx + 4, by + r.h * 0.6).stroke({ width: 2, color: swatch.white.line });
      g.poly(poly(paths[0])).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
      g.poly([bx - 6, by + 6, bx + 6, by + 6, bx, by - 2]).fill(swatch.red.line);
      break;
    }
    case 'wheel': {
      const [cx, cy] = [r.x + r.w / 2, r.y + r.h / 2];
      g.roundRect(r.x - r.w * 0.5, r.y - r.h * 0.2, r.w * 1.6, r.h * 0.5, 6).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
      g.poly(poly(paths[0])).fill({ color: 0xffffff, alpha: 0.6 }).stroke({ width: 7, color: swatch.brown.line });
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 4;
        g.moveTo(cx - Math.cos(a) * r.w * 0.45, cy - Math.sin(a) * r.h * 0.45).lineTo(cx + Math.cos(a) * r.w * 0.45, cy + Math.sin(a) * r.h * 0.45);
      }
      g.stroke({ width: 3, color: swatch.brown.line }).circle(cx, cy, 5).fill(swatch.brown.line);
      break;
    }
    case 'sheep':
      line(paths[0], 14, swatch.white.line);
      line(paths[0], 9, 0xffffff);
      break;
    case 'clouds':
      line(paths[0], 20, swatch.white.line);
      line(paths[0], 15, 0xffffff);
      break;
    case 'smoke': {
      const [sx, sy] = f(paths[0][0]);
      g.rect(sx - 10, sy + 2, 20, 30).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
      line(paths[0], 12, swatch.white.line, 0.8);
      line(paths[0], 7, 0xffffff, 0.9);
      break;
    }
    case 'window':
      g.rect(r.x, r.y, r.w, r.h).fill(swatch.blue.light).stroke({ width: 4, color: swatch.brown.line });
      for (const p of paths) line(p, 4, swatch.brown.line);
      break;
    case 'house': g.poly(poly(paths[0])).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line }); break;
    case 'roof': g.poly(poly(paths[0])).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line }); break;
    case 'present': g.poly(poly(paths[0])).fill(swatch.purple.fill).stroke({ width: 4, color: swatch.purple.line }); break;
    case 'ribbon': for (const p of paths) { line(p, 12, swatch.yellow.line); line(p, 7, swatch.yellow.fill); } break;
    case 'bow': {
      g.poly(poly(paths[0])).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
      const [tx, ty] = f(paths[0][0]);
      g.circle(tx, ty, 7).fill(swatch.yellow.line);
      break;
    }
    case 'cabin': {
      g.rect(0, r.y + r.h * 0.7, r.x + r.w * 1.45, r.h * 0.9).fill(swatch.blue.fill);
      g.poly(poly(paths[0])).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
      break;
    }
    case 'mast': for (const p of paths) line(p, 7, swatch.brown.line); break;
    case 'sail': g.poly(poly(paths[0])).fill(0xffffff).stroke({ width: 4, color: swatch.white.line }); break;
    case 'bridge':
      line(paths.flat(), 10, swatch.brown.line);
      line(paths.flat(), 5, swatch.brown.fill);
      break;
    case 'bunting':
      line(paths.flat(), 6, swatch.pink.line);
      break;
    case 'kite': {
      // Paper stretched over her crossed sticks, corner to corner, and a tail of bows blowing sideways, clear of the rain cloud.
      const [a, b] = paths, corners = [a[0], b[0], a.at(-1)!, b.at(-1)!];
      g.poly(poly(corners)).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line, join: 'round' });
      for (const p of paths) line(p, 5, swatch.brown.line);
      const [tx, ty] = f(b.at(-1)!);
      g.moveTo(tx, ty).quadraticCurveTo(tx - 16, ty + 8, tx - 34, ty + 4).stroke({ width: 2, color: swatch.white.line });
      for (const [i, k] of [0.45, 0.85].entries()) {
        const [x, y] = [tx - 34 * k, ty + 6 * k], c = swatch[MARKS[i]];
        g.poly([x - 7, y - 5, x, y, x - 7, y + 5]).poly([x + 7, y - 5, x, y, x + 7, y + 5]).fill(c.fill);
      }
      break;
    }
    case 'treasure': {
      // A sandy patch on the grass, her X on it in red: the treasure is here.
      g.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w * 0.7, r.h * 0.9).fill(swatch.yellow.light).stroke({ width: 2, color: swatch.yellow.line });
      for (const p of paths) line(p, 7, swatch.red.line);
      break;
    }
  }
}

/** The host's crayon drawing behind the pieces: sky and grass, and a house wall when the window comes first. */
function drawScene(g: Graphics, w: number, h: number) {
  g.roundRect(0, 0, w, h, 18).fill(0xffffff).stroke({ width: 5, color: swatch.white.line });
  g.roundRect(4, 4, w - 8, h * 0.7, 14).fill(swatch.blue.light);
  g.rect(4, h * 0.7, w - 8, h * 0.3 - 4).fill(swatch.green.light);
}

/** The fat crayon: its tip at (0, 0), its body trailing back along −x, about 120 long. */
class Crayon extends Container {
  constructor(color: ColorName) {
    super();
    const c = swatch[color];
    const g = new Graphics()
      .poly([0, 0, -26, -14, -26, 14]).fill(c.fill).stroke({ width: 3, color: c.line, join: 'round' })
      .roundRect(-118, -15, 94, 30, 8).fill(c.fill).stroke({ width: 3, color: c.line })
      .rect(-96, -15, 46, 30).fill({ color: 0xffffff, alpha: 0.75 })
      .moveTo(-90, -6).lineTo(-56, -6).moveTo(-90, 6).lineTo(-56, 6).stroke({ width: 3, color: c.line });
    this.addChild(g);
    this.eventMode = 'none';
  }
}

class DrawThePattern implements Game {
  private readonly level: number;
  private readonly plan: ReturnType<typeof planFor>;
  private readonly tol: number;
  private layout: Layout;
  private readonly back = new Graphics();
  private readonly paper = new Container();
  private readonly sheetG = new Graphics();
  private readonly guideG = new Graphics();
  private readonly inkG = new Graphics();
  private readonly flowersG = new Graphics();
  private readonly cueG = new Graphics();
  private crayon: Crayon;
  private readonly spark = new Graphics();
  private readonly picture = new Container();
  private readonly sceneG = new Graphics();
  private readonly piecesG = new Graphics();
  private readonly layer = new Container();

  private strips: Strip[];
  private slots: Slot[];
  private index = 0;
  private tracks: Track[] = [];
  /** Her strokes, in the order she draws them (the pet's own strokes are drawn already). */
  private cur = 0;
  private placed = new Set<number>();
  /** What she drew on each finished strip, for its piece in the picture. */
  private drawn: Point[][][] = [];

  // Level 1
  private marks: Point[][] = [];
  private lifts = 0;

  // The pet's part, as it draws it: how far (0–1), and whether it is a faint demonstration of a whole shape.
  private show: { k: number; faint: boolean } | null = null;
  private memoryAlpha = 1;
  private reveal = -1;

  private drag: Drag | null = null;
  /** Level 10: the crayon is drawing itself to a tapped dot. */
  private tapping = false;
  private busy = true;
  private finished = false;
  private misses = 0;
  private hints = 0;
  private wrong = 0;
  private glow = false;
  private sparkShown = false;
  private clock = 0;
  private lastEvent = 0;
  private wiggle = 0;
  private scratchAt = 0;
  private note = -1;
  private paperColor: ColorName = 'yellow';
  private crayonColor: ColorName = 'purple';

  constructor(private readonly ctx: GameContext) {
    this.level = levelOf(ctx.level);
    this.plan = planFor(this.level);
    this.tol = tolerance(this.level);
    this.layout = layoutFor(ctx.view);
    this.strips = stripsFor(this.level, ctx.rng);
    // The how-to card's demonstration plays one strip.
    if (ctx.demo) this.strips = this.strips.slice(0, 1);
    this.slots = slotsFor(this.level, this.strips);
    this.crayon = new Crayon(this.crayonColor);

    this.paper.addChild(this.sheetG, this.guideG, this.flowersG, this.inkG, this.cueG, this.crayon, this.spark);
    this.picture.addChild(this.sceneG, this.piecesG);
    for (const g of [this.back, this.sheetG, this.guideG, this.inkG, this.flowersG, this.cueG, this.spark, this.sceneG, this.piecesG]) g.eventMode = 'none';
    this.paper.eventMode = 'none';
    this.layer.eventMode = 'static';
    this.layer.on('pointerdown', (e) => this.down(e));
    this.layer.on('globalpointermove', (e) => this.move(e));
    this.layer.on('pointerup', (e) => this.up(e));
    this.layer.on('pointerupoutside', (e) => this.up(e));
    // Pixi does not pass a cancelled touch on, so the window is watched for it.
    window.addEventListener('pointercancel', this.cancel, { capture: true });
    // A tap on the picture: the pet draws its part again and says what to do. Not a hint.
    onTap(this.picture, () => { if (!this.busy && !this.drag && !this.tapping && !this.finished) void this.petDraws(); }, { cooldown: 600 });
    ctx.stage.addChild(this.back, this.paper, this.picture, this.layer);
    this.nextStrip();
    this.resize(ctx.view);
  }

  private get strip(): Strip { return this.strips[this.index]; }
  private get s() { return this.layout.strip.s; }
  /** The stroke she is on, or null at level 1 and between strips. */
  private get track(): Track | null { return this.plan.mode === 'mark' ? null : this.tracks[this.cur] ?? null; }

  private instructLine(): LineId {
    if (this.plan.mode === 'mark') return 'draw.instruct.mark';
    if (this.plan.mode === 'choose') return 'draw.instruct.next';
    if (this.plan.mode === 'dots') return 'draw.instruct.dots';
    if (this.strip.memory) return 'draw.instruct.memory';
    if (this.level === 6) return 'draw.instruct.shape';
    if (this.strip.strokes[0].kind === 'post') return 'draw.instruct.down';
    if (this.strip.strokes[0].kind === 'slant') return 'draw.instruct.slant';
    if (this.strip.strokes[0].kind === 'x-back') return 'draw.instruct.shape';
    return 'draw.instruct.ring';
  }

  private nextStrip() {
    this.paperColor = PAPERS[(this.index * 3 + this.level) % PAPERS.length];
    const crayon = CRAYONS[(this.index * 3 + this.level) % CRAYONS.length];
    if (crayon !== this.crayonColor) {
      this.crayonColor = crayon;
      const next = new Crayon(crayon);
      this.paper.addChildAt(next, this.paper.getChildIndex(this.crayon));
      this.crayon.destroy({ children: true });
      this.crayon = next;
    }
    this.wrong = 0; this.glow = false; this.sparkShown = false; this.reveal = -1; this.memoryAlpha = 1;
    this.marks = []; this.lifts = 0;
    this.tracks = this.strip.strokes.filter((s) => s.lead < s.orders[0].length - 1).map((stroke) => ({ stroke, order: null, progress: stroke.lead, tried: false }));
    this.cur = 0;
    this.note = -1; this.scratchAt = 0;
    this.flowersG.clear();
    this.drawPaper();
  }

  /* ------------------------------------------------------------ drawing */

  private pts(p: Point): [number, number] { return [p[0] * this.s, p[1] * this.s]; }

  private drawPaper() {
    // A finished round can still be resized (the device turns while the picture shows).
    if (!this.strip) return;
    const s = this.s, g = this.sheetG.clear(), c = swatch[this.paperColor];
    g.roundRect(0, 0, STRIP_W * s, s, 14).fill(c.light).stroke({ width: 4, color: c.line });
    // A curl at each end: the strip is a paper banner.
    g.ellipse(0, s / 2, 10, s / 2).fill(c.fill).ellipse(STRIP_W * s, s / 2, 10, s / 2).fill(c.fill);
    this.drawGuide();
    this.drawInk();
  }

  /** The dashes she follows, faint candidates at levels 7–8, and level 5's stepping stones. */
  private drawGuide() {
    const g = this.guideG.clear();
    if (this.plan.mode === 'mark') return;
    const width = this.level <= 3 ? 9 : 7;
    this.tracks.forEach((t, i) => {
      if (i < this.cur) return;
      const st = t.stroke;
      if (st.right !== undefined) {
        st.orders.forEach((o, k) => {
          if (this.glow && i === this.cur && k === st.right) this.line(g, o, 22, swatch.yellow.fill, 0.55);
          if (t.order === null || t.order === k) this.dashes(g, o.slice(t.order === k ? t.progress : 0), 6, 0.38);
        });
        return;
      }
      const pts = pathOf(st, t.order);
      if (this.strip.memory && i === this.cur) {
        if (this.memoryAlpha > 0) this.dashes(g, pts.slice(t.progress), width, 0.7 * this.memoryAlpha);
        if (this.reveal > t.progress) this.dashes(g, pts.slice(t.progress, this.reveal + 1), width, 0.7);
        for (const p of stones(pts, st.lead)) {
          if (pts.indexOf(p) <= t.progress) continue;
          g.circle(...this.pts(p), 9).fill({ color: ink, alpha: 0.55 });
        }
        return;
      }
      this.dashes(g, pts.slice(t.progress), width, 0.7);
      // Level 10: the dots still to reach (the shining one is drawn by the cue).
      for (const d of st.dots ?? []) if (d > t.progress) g.circle(...this.pts(pts[d]), 16).fill(ink);
    });
  }

  /** The pet's part and hers, in the crayon's color. */
  private drawInk() {
    const g = this.inkG.clear(), color = swatch[this.crayonColor].fill;
    const show = this.show;
    for (const st of this.strip.strokes) {
      const t = this.tracks.find((x) => x.stroke === st);
      const pts = pathOf(st, t?.order ?? null);
      // The pet's part: drawn as it goes, or all of it once it has.
      let upto = st.lead;
      if (show && !show.faint) upto = Math.min(st.lead, Math.floor(show.k * this.petLength()) - this.petBefore(st));
      if (upto > 0) this.line(g, pts.slice(0, upto + 1), 11, color);
      if (t && t.progress > st.lead) this.line(g, pts.slice(st.lead, t.progress + 1), 11, color);
    }
    if (show?.faint) {
      const t = this.track;
      if (t) {
        const pts = t.stroke.orders[0], n = Math.floor(show.k * (pts.length - 1));
        if (n > 0) this.line(g, pts.slice(0, n + 1), 11, color, 0.45);
      }
    }
    for (const m of this.marks) {
      if (m.length === 1) g.circle(...this.pts(m[0]), 9).fill(color);
      else this.line(g, m, 14, color);
    }
    this.placeCrayon();
  }

  /** Checkpoints the pet draws on this strip, in all, and before a stroke. */
  private petLength() { return this.strip.strokes.reduce((n, st) => n + st.lead, 0); }
  private petBefore(stroke: Stroke) {
    let n = 0;
    for (const st of this.strip.strokes) { if (st === stroke) break; n += st.lead; }
    return n;
  }

  private line(g: Graphics, pts: readonly Point[], width: number, color: number, alpha = 1) {
    if (pts.length < 2) return;
    g.moveTo(...this.pts(pts[0]));
    for (const p of pts.slice(1)) g.lineTo(...this.pts(p));
    g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
  }

  /** A dashed line along the points, about 16 units on and 12 off. */
  private dashes(g: Graphics, pts: readonly Point[], width: number, alpha: number) {
    if (pts.length < 2) return;
    const s = this.s;
    let run = 0, on = true;
    g.moveTo(pts[0][0] * s, pts[0][1] * s);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      run += Math.hypot(b[0] - a[0], b[1] - a[1]) * s;
      if (on) g.lineTo(b[0] * s, b[1] * s); else g.moveTo(b[0] * s, b[1] * s);
      if (run >= (on ? 16 : 12)) { run = 0; on = !on; }
    }
    g.stroke({ width, color: ink, alpha, cap: 'round' });
  }

  private placeCrayon() {
    const c = this.crayon, show = this.show;
    if (show) {
      // While the pet draws, the crayon rides along its line.
      const at = this.petPoint(show);
      if (at) { c.visible = true; c.position.set(...this.pts(at.here)); c.rotation = Math.atan2(at.ahead[1] - at.here[1], at.ahead[0] - at.here[0]); }
      return;
    }
    if (this.plan.mode === 'mark') {
      c.visible = !this.busy && !this.finished;
      c.position.set(STRIP_W * this.s * 0.5, this.s * 0.5);
      c.rotation = -0.5;
      return;
    }
    const t = this.track;
    c.visible = !!t && !this.finished && !this.busy;
    if (!t) return;
    const pts = pathOf(t.stroke, t.order), here = pts[t.progress], ahead = pts[Math.min(pts.length - 1, t.progress + 3)];
    c.position.set(...this.pts(here));
    if (ahead !== here) c.rotation = Math.atan2(ahead[1] - here[1], ahead[0] - here[0]);
  }

  /** Where the crayon is along the pet's part. */
  private petPoint(show: { k: number; faint: boolean }): { here: Point; ahead: Point } | null {
    if (show.faint) {
      const t = this.track;
      if (!t) return null;
      const pts = t.stroke.orders[0], i = Math.floor(show.k * (pts.length - 1));
      return { here: pts[i], ahead: pts[Math.min(pts.length - 1, i + 3)] };
    }
    let n = Math.floor(show.k * this.petLength());
    for (const st of this.strip.strokes) {
      if (n <= st.lead && st.lead > 0) { const p = st.orders[0]; return { here: p[n], ahead: p[Math.min(p.length - 1, n + 3)] }; }
      n -= st.lead;
    }
    return null;
  }

  private drawPicture() {
    const { w, h } = this.layout.picture;
    this.sceneG.clear(); drawScene(this.sceneG, w, h);
    const g = this.piecesG.clear();
    const order = this.strips.map((_, i) => i).sort((a, b) => +BEHIND.has(this.strips[b].piece) - +BEHIND.has(this.strips[a].piece));
    for (const i of order) {
      const strip = this.strips[i];
      const r = this.slots[i], slot = { x: r.x * w, y: r.y * h, w: r.w * w, h: r.h * h };
      if (this.placed.has(i)) drawPiece(g, strip, this.drawn[i], slot, false);
      else if (this.plan.mode === 'mark') g.rect(slot.x, slot.y + slot.h * 0.5, slot.w, slot.h * 0.5).fill({ color: 0xffffff, alpha: 0.5 });
      else drawPiece(g, strip, this.ghostPaths(strip), slot, true);
    }
  }

  /** The soft outline of a strip's piece before it is drawn. */
  private ghostPaths(strip: Strip): Point[][] {
    return strip.strokes.map((st) => st.orders[st.right ?? 0]);
  }

  /* ------------------------------------------------------------ the pet's part */

  /** The pet draws its part of the strip (or shows a whole shape faintly), then holds the crayon out. */
  private async petDraws() {
    this.busy = true;
    const t = this.track;
    // A shape with no part of the pet's (the circle, the cross, square and triangle) is shown faintly first.
    const faint = !!t && t.progress === 0 && this.petLength() === 0;
    if (this.plan.mode === 'mark' || this.petLength() > 0 || faint) {
      const anim = { k: 0 };
      this.show = { k: 0, faint };
      let said = -1;
      const units = this.strip.strokes[0].units;
      const ticker = () => {
        if (!this.show) return;
        this.show.k = anim.k;
        const step = Math.min(4, Math.floor(anim.k * 5));
        if (step !== this.note) { this.note = step; sfx.bell(5 + step, 0.1); }
        // At levels 7–8 the pet says each unit as it draws it.
        if (this.plan.mode === 'choose' && units) {
          const u = Math.min(units.length - 1, Math.floor(anim.k * units.length));
          if (u !== said) { said = u; void this.ctx.say(`draw.unit.${units[u]}` as LineId); }
        }
        this.drawInk();
      };
      this.ticker = ticker;
      const seconds = this.plan.mode === 'choose' ? 0.8 * (units?.length ?? 4) : 1.6;
      await this.ctx.tw.to(anim, { k: 1 }, { duration: seconds, ease: ease.inOutSine });
      this.ticker = null;
      this.show = null;
      this.note = -1;
      this.drawInk();
    }
    if (this.strip.memory) {
      // Level 5: after the pet's part the dashes fade out over a second; the stepping stones stay.
      const fade = { a: 1 };
      this.ticker = () => { this.memoryAlpha = fade.a; this.drawGuide(); };
      await this.ctx.tw.to(fade, { a: 0 }, { duration: 1 });
      this.ticker = null;
      this.memoryAlpha = 0;
      this.drawGuide();
    }
    this.busy = false;
    this.placeCrayon();
    void this.ctx.instruct(this.instructLine());
  }
  private ticker: (() => void) | null = null;

  /* ------------------------------------------------------------ input */

  private local(e: FederatedPointerEvent): Point {
    const p = this.paper.toLocal(e.global);
    return [p.x / this.s, p.y / this.s];
  }

  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.drag || palmOnGlass()) return;
    const p = this.local(e);
    this.lastEvent = this.clock;
    if (this.plan.mode === 'mark') {
      if (!onPaper(p)) return;
      // A touch on the paper draws at once: a pat is a dot.
      this.drag = { id: e.pointerId, prev: p, missed: false, stopped: false, travel: 0, outside: false, mark: [p] };
      this.marks.push(this.drag.mark!);
      sfx.brush();
      this.drawInk();
      return;
    }
    // A touch on the crayon (or its ring) carries on; anywhere else the crayon wiggles to show where it is.
    const t = this.track;
    if (!t || this.tapping) return;
    const at = pathOf(t.stroke, t.order)[t.progress];
    // Level 10: a tap on the shining dot draws the crayon to it.
    const dot = nextDot(t.stroke, t.progress);
    if (dot !== null) {
      const d = pathOf(t.stroke, t.order)[dot];
      if (Math.hypot(p[0] - d[0], p[1] - d[1]) <= DOT_HIT / this.s) return void this.drawToDot(t, dot);
    }
    if (Math.hypot(p[0] - at[0], p[1] - at[1]) > (RING_R + 12) / this.s) { this.wiggle = 0.5; sfx.tick(); return; }
    this.drag = { id: e.pointerId, prev: at, missed: false, stopped: false, travel: 0, outside: false, mark: null };
    // The tip dents the paper.
    this.crayon.scale.set(0.92);
    this.inkG.circle(...this.pts(at), 7).fill(swatch[this.crayonColor].fill);
  }

  private move(e: FederatedPointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id || this.busy || this.finished) return;
    this.lastEvent = this.clock;
    const to = this.local(e);
    d.outside = to[0] < -0.3 || to[0] > STRIP_W + 0.3 || to[1] < -0.4 || to[1] > 1.4;
    if (d.mark) {
      if (!onPaper(to)) return;
      const last = d.mark.at(-1)!, step = Math.hypot(to[0] - last[0], to[1] - last[1]);
      if (step < 0.02) return;
      d.mark.push(to);
      this.scratch(step);
      this.drawInk();
      return;
    }
    const t = this.track;
    if (!t || d.stopped) return;
    const before = t.progress, pts = pathOf(t.stroke, t.order);
    const next = chooseOrder(t.stroke, t.order, t.progress, d.prev, to, this.tol);
    t.order = next.order; t.progress = next.progress;
    d.prev = to;
    if (t.progress === before) {
      if (!d.missed && offTrail(to, pts[t.progress], this.tol)) {
        d.missed = true;
        this.stray();
      }
      return;
    }
    this.advanced(t, before);
  }

  private scratch(step: number) {
    this.scratchAt += step * this.s;
    if (this.scratchAt >= SCRATCH_EVERY) { this.scratchAt = 0; sfx.brush(); }
  }

  private advanced(t: Track, before: number) {
    const pts = pathOf(t.stroke, t.order);
    this.scratch(lengthTo(pts, t.progress) - lengthTo(pts, before));
    const step = tuneStep(t.progress - t.stroke.lead, pts.length - t.stroke.lead);
    if (step !== this.note) { this.note = step; sfx.bell(5 + step, 0.12); }
    if (this.reveal >= 0 && t.progress >= this.reveal) { this.reveal = -1; }
    if (t.order !== null && wrongReached(t.stroke, t.order, t.progress, this.tol)) {
      void this.wrongStroke(t);
      return;
    }
    this.drawGuide();
    this.drawInk();
    if (t.progress === pts.length - 1) this.strokeDone();
  }

  private up(e: FederatedPointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.release();
  }

  private readonly cancel = (e: PointerEvent) => {
    if (this.drag && e.pointerId === this.drag.id) this.release();
  };

  private release() {
    const d = this.drag;
    this.drag = null;
    this.crayon.scale.set(1);
    if (d?.mark) return void this.markLifted(d.mark);
    // After the hint lights the next stretch, the crayon's tip sparkle flies it once she lifts.
    if (this.glow && !this.sparkShown && this.track && this.track.stroke.right === undefined) { this.sparkShown = true; void this.flySpark(this.track); }
  }

  /* ------------------------------------------------------------ rules */

  /** Level 1: each lifted touch sprouts flowers along what she drew; four finish the strip. */
  private markLifted(mark: Point[]) {
    if (this.busy || this.finished) return;
    this.lifts++;
    const g = this.flowersG, colors = ['pink', 'yellow', 'red', 'purple', 'orange'] as const, piece = this.strip.piece;
    const n = Math.min(4, Math.max(1, Math.ceil(lengthTo(mark, mark.length - 1) / 0.5)));
    for (let i = 0; i < n; i++) {
      const p = mark[Math.floor((i / Math.max(1, n - 1 || 1)) * (mark.length - 1))];
      const [x, y] = this.pts(p);
      sprout(g, piece, x, y, colors[(this.lifts + i) % colors.length]);
    }
    sfx.bell(5 + this.lifts, 0.14);
    if (this.lifts >= markCount(this.plan)) void this.stripDone();
  }

  /** A drag that wanders off: one miss, the crayon stays, and at level 5 the dashes come back for the next stretch. */
  private stray() {
    // Level 10 counts nothing as wrong: the crayon just waits.
    if (this.plan.mode === 'dots') return void sfx.tick();
    this.misses++; this.wrong++;
    sfx.boing();
    void this.ctx.say('draw.back-to-crayon');
    const t = this.track;
    if (this.strip.memory && t) this.reveal = Math.min(pathOf(t.stroke, t.order).length - 1, t.progress + REVEAL);
    if (this.wrong % 2 === 0) { this.hints++; this.glow = true; this.sparkShown = false; }
    this.drawGuide();
  }

  /** Levels 7–8: drawing the candidate that breaks the pattern. One miss per unit, the rule, and her stroke fades. */
  private async wrongStroke(t: Track) {
    if (this.drag) this.drag.stopped = true;
    this.busy = true;
    if (!t.tried) {
      t.tried = true; this.misses++; this.wrong++;
      if (this.wrong % 2 === 0) { this.hints++; this.glow = true; }
    }
    sfx.boing();
    this.drawInk();
    await this.ctx.say(`draw.rule.${t.stroke.kinds![t.stroke.right!]}` as LineId);
    t.progress = 0; t.order = null;
    this.busy = false;
    this.drawGuide(); this.drawInk();
  }

  /** Level 10: the crayon draws itself from where it waits to the tapped dot, then the next dot shines. */
  private async drawToDot(t: Track, dot: number) {
    this.tapping = true;
    const before = t.progress, anim = { k: 0 };
    sfx.pop(5);
    this.ticker = () => {
      t.progress = before + Math.floor(anim.k * (dot - before));
      this.drawGuide(); this.drawInk();
    };
    await this.ctx.tw.to(anim, { k: 1 }, { duration: 0.4, ease: ease.inOutSine });
    this.ticker = null;
    this.tapping = false;
    t.progress = dot;
    this.advanced(t, before);
  }

  /** A stroke is finished: on to the next one, carrying a drag on when it starts where this one ended. */
  private strokeDone() {
    const t = this.track!;
    const end = pathOf(t.stroke, t.order).at(-1)!;
    this.cur++; this.wrong = 0; this.glow = false; this.sparkShown = false; this.reveal = -1; this.note = -1;
    const next = this.track;
    if (!next) {
      if (this.drag) this.drag.stopped = true;
      void this.stripDone();
      return;
    }
    const start = next.stroke.orders[0][next.progress];
    if (this.drag && Math.hypot(start[0] - end[0], start[1] - end[1]) > 1e-6) this.drag.stopped = true;
    this.drawGuide(); this.drawInk();
  }

  /** The strip rolls up into the picture and becomes its piece. */
  private async stripDone() {
    this.busy = true;
    this.placeCrayon();
    sfx.sparkle();
    const i = this.index;
    this.drawn[i] = this.plan.mode === 'mark'
      ? [[[0, 0.5], [STRIP_W, 0.5]]]
      : this.strip.strokes.map((st) => {
        const t = this.tracks.find((x) => x.stroke === st);
        return pathOf(st, t?.order ?? null);
      });
    for (let k = 0; k < 4; k++) sfx.bell(6 + k * 2, 0.1);
    await this.ctx.tw.to(this.paper.scale, { y: 0.05 }, { duration: 0.35, ease: ease.inQuad });
    this.placed.add(i);
    this.drawPicture();
    sfx.pop(7);
    void this.ctx.tw.to(this.picture.scale, { x: 1.06, y: 1.06 }, { duration: 0.2, ease: ease.outBack }).then(() => this.ctx.tw.to(this.picture.scale, { x: 1, y: 1 }, { duration: 0.2 }));
    await this.ctx.say(`draw.picture.${this.strip.piece}` as LineId);
    this.index++;
    if (this.index >= this.strips.length) return void this.finish();
    this.nextStrip();
    await this.ctx.tw.to(this.paper.scale, { y: 1 }, { duration: 0.35, ease: ease.outQuad });
    await this.petDraws();
  }

  private async finish() {
    this.finished = true;
    this.paper.visible = false;
    sfx.tada();
    void this.ctx.tw.to(this.picture.scale, { x: 1.1, y: 1.1 }, { duration: 0.3, ease: ease.outBack }).then(() => this.ctx.tw.to(this.picture.scale, { x: 1, y: 1 }, { duration: 0.3 }));
    await this.ctx.say('draw.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** The crayon's tip sparkle flies the lit stretch and back: a drawing, not the ghost finger. */
  private async flySpark(t: Track) {
    const pts = hintStretch(pathOf(t.stroke, t.order), t.progress);
    const g = this.spark.clear();
    for (let k = 0; k < 4; k++) g.moveTo(0, 0).lineTo(Math.cos((k * Math.PI) / 2) * 16, Math.sin((k * Math.PI) / 2) * 16);
    g.stroke({ width: 5, color: swatch.yellow.line, cap: 'round' }).circle(0, 0, 7).fill(swatch.yellow.fill);
    g.visible = true;
    for (const p of [...pts, ...[...pts].reverse()]) {
      if (this.finished || this.drag) break;
      await this.ctx.tw.to(g, { x: p[0] * this.s, y: p[1] * this.s }, { duration: 0.07 });
    }
    g.visible = false;
  }

  /* ------------------------------------------------------------ shell */

  start() {
    void this.petDraws();
  }

  resize(v: View) {
    this.layout = layoutFor(v);
    const { strip, picture } = this.layout;
    this.back.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.paper.position.set(strip.x, strip.y + strip.h / 2);
    this.paper.pivot.set(0, strip.h / 2);
    this.picture.position.set(picture.x + picture.w / 2, picture.y + picture.h / 2);
    this.picture.pivot.set(picture.w / 2, picture.h / 2);
    this.picture.hitArea = new Rectangle(0, 0, picture.w, picture.h);
    this.layer.hitArea = new Rectangle(strip.x - 40, strip.y - RING_R, strip.w + 80, strip.h + 2 * RING_R);
    this.drawPaper();
    this.drawPicture();
  }

  update(dt: number) {
    this.clock += dt;
    this.ticker?.();
    // A finger that left the screen without a release: after half a second of silence outside the strip, it has lifted.
    if (this.drag?.outside && this.clock - this.lastEvent > 0.5) this.release();
    const c = this.crayon;
    if (this.wiggle > 0) {
      this.wiggle = Math.max(0, this.wiggle - dt);
      c.rotation += 0.12 * Math.sin(this.wiggle * 30);
      if (this.wiggle === 0) this.placeCrayon();
    }
    this.drawCue();
  }

  /** The green start ring with its arrow, and after two misses the next stretch lit in yellow dots. */
  private drawCue() {
    const g = this.cueG.clear(), s = this.s;
    const t = this.track;
    if (this.busy || this.finished || !t) return;
    const pulse = 1 + 0.05 * Math.sin(this.clock * 4);
    const dot = nextDot(t.stroke, t.progress);
    if (dot !== null) {
      // Level 10: the next dot shines, as big as a tap that reaches it.
      if (this.tapping) return;
      const [x, y] = this.pts(pathOf(t.stroke, t.order)[dot]);
      g.circle(x, y, (DOT_HIT - 6) * pulse).fill({ color: swatch.yellow.light, alpha: 0.7 }).stroke({ width: 6, color: swatch.yellow.fill })
        .circle(x, y, 20 * pulse).fill(swatch.yellow.line);
      return;
    }
    if (t.progress === t.stroke.lead && !this.drag) {
      const pts = t.stroke.orders[0].slice(t.stroke.lead);
      const [x, y] = this.pts(pts[0]);
      g.circle(x, y, RING_R * pulse).fill({ color: swatch.green.light, alpha: 0.4 }).stroke({ width: 7, color: swatch.green.fill });
      if (t.stroke.right === undefined) {
        const a = startArrow(pts), ax = x + Math.cos(a.angle) * (RING_R + 8), ay = y + Math.sin(a.angle) * (RING_R + 8);
        const ux = Math.cos(a.angle), uy = Math.sin(a.angle);
        g.poly([ax + ux * 20, ay + uy * 20, ax - uy * 13, ay + ux * 13, ax + uy * 13, ay - ux * 13]).fill(swatch.green.line);
      }
    }
    if (this.glow && t.stroke.right === undefined) {
      for (const p of hintStretch(pathOf(t.stroke, t.order), t.progress)) g.circle(p[0] * s, p[1] * s, 7).fill(swatch.yellow.fill);
    }
  }

  askForHint() {
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'mark' || this.plan.mode === 'dots') return void this.ctx.say(this.instructLine());
    if (!this.glow) { this.glow = true; this.hints++; this.sparkShown = false; this.drawGuide(); }
  }

  /** The ghost finger: a short wave at level 1, a tap on the shining dot at 10; otherwise the stroke from where the crayon waits (circles counterclockwise, the continuing candidate). */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.drag) return null;
    const spot = (p: Point) => ({ on: this.paper, x: p[0] * this.s, y: p[1] * this.s });
    if (this.plan.mode === 'mark') {
      const x0 = 0.4 + (this.lifts % 4) * 0.7;
      const wave = Array.from({ length: 7 }, (_, i) => [x0 + i * 0.08, 0.5 + 0.18 * Math.sin(i * 1.1)] as Point);
      return { trace: spot(wave[0]), via: wave.slice(1).map(spot), receiver: this.layer, pause: 0.35 };
    }
    const t = this.track;
    if (!t || this.tapping) return null;
    const dot = nextDot(t.stroke, t.progress);
    if (dot !== null) return { tap: spot(pathOf(t.stroke, t.order)[dot]), receiver: this.layer, pause: 0.5 };
    const o = t.stroke.right ?? t.order ?? 0;
    // A wrong start on a candidate is drawn again from the unit's start.
    const pts = t.stroke.orders[o];
    const route = botRoute(t.stroke, pts, t.order === o || t.order === null ? t.progress : 0).map(spot);
    if (route.length < 2) return null;
    return { trace: route[0], via: route.slice(1), receiver: this.layer, pause: 0.3 };
  }

  destroy() {
    this.drag = null;
    this.ticker = null;
    window.removeEventListener('pointercancel', this.cancel, { capture: true });
    this.layer.removeAllListeners();
  }
}

function icon(): Container {
  const c = new Container();
  const g = new Graphics().roundRect(-130, -190, 260, 130, 12).fill(swatch.yellow.light).stroke({ width: 5, color: swatch.yellow.line });
  g.moveTo(-110, -125);
  for (let i = 1; i <= 6; i++) g.lineTo(-110 + i * 36, i % 2 ? -160 : -95);
  g.stroke({ width: 10, color: swatch.purple.fill, cap: 'round', join: 'round' });
  const cr = new Crayon('red');
  cr.position.set(106, -95); cr.rotation = -2.3; cr.scale.set(0.9);
  c.addChild(g, cr);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  const kind = stickerKind(seed), color = swatch[CRAYONS[Math.floor(Math.abs(seed)) % CRAYONS.length]];
  const pts = stickerPath(kind);
  const g = new Graphics().roundRect(-115, -60, 230, 120, 14).fill(swatch.yellow.light).stroke({ width: 5, color: swatch.yellow.line });
  g.moveTo(-100 + pts[0][0] * 200, -50 + pts[0][1] * 100);
  for (const p of pts.slice(1)) g.lineTo(-100 + p[0] * 200, -50 + p[1] * 100);
  g.stroke({ width: 10, color: color.fill, cap: 'round', join: 'round' });
  c.addChild(tile(260, 260, 'white'), g);
  return c;
}

export const drawThePattern: GameModule = {
  id: 'draw-the-pattern', name: 'Draw the Pattern', titleLine: 'game.draw-the-pattern', region: 'treehouse', challenge: 'hands',
  skills: ['fine-motor', 'writing', 'patterns'], bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (b) => rangeFor(LEVELS, b), entryLevels: [10], describeLevel: (l) => planFor(l).name,
  music: STYLES.paint,
  coplayHint: 'Draw the first part of a line with your finger and let {name} carry it on, then swap.',
  offScreen: 'On a long strip of paper, draw big zigzags, waves and loops together with fat crayons, or with a finger in sand.',
  hubIcon: () => new WigglyIcon(icon()), sticker, create: (ctx) => new DrawThePattern(ctx),
  touchDemo: true,
};
