import { FillPattern, Texture, type Graphics } from 'pixi.js';
import { toward, type Swatch } from './palette';
import type { ShapeKind } from './shapes';

/**
 * Puddle Island's look (chosen 2026-11-26, docs/ART-STYLE.md): every filled shape is a piece of construction paper
 * with a torn, slightly wobbly edge, a warm drop shadow, a flat fill with a paper fibre texture, and a double
 * "crayon" outline in a darker shade of its own colour. Hairlines (veins, ripples, stems) are plain round strokes
 * with the same small shadow; text stays flat.
 *
 * Everything here draws into an ordinary `Graphics`, once, so a shape costs nothing per frame after it is built.
 * Sizes are in logical units. A phone shows about two logical units per CSS pixel (390 CSS pixels for the 768-unit
 * upright area), so the art test's pixel numbers are doubled through `U`.
 */
export const U = 2;

/** The warm oatmeal ground the paper pieces sit on. */
export const PAPER_BG = 0xece4d4;
/** The crayon outline heads toward this near-black, never all the way. */
const CRAYON_INK = 0x1d1a22;
const SHADOW = 0x2d1e14;

export type PaperColor = number | Swatch;

export interface PaperOptions {
  /** Keeps the wobble the same every time the shape is drawn. Defaults to a hash of the shape's points. */
  seed?: number | string;
  /** A small shape: a gentler wobble, thinner outline and a tighter shadow. Defaults to shapes under 40 units across. */
  small?: boolean;
  /** Wobble height in logical units (default 2.2 px, that is 4.4 units, less on smaller pieces). */
  amp?: number;
  /** No wobble, shadow, texture or outline: a plain flat fill (shading inside another piece). */
  flat?: boolean;
  /** Leave out the drop shadow (a piece lying flat inside another, like a cheek). */
  noShadow?: boolean;
  /** Leave out the crayon outline. */
  noOutline?: boolean;
  /** Fill alpha (a see-through bubble). The outline and texture follow it. */
  alpha?: number;
  /** Outline colour, when it should not be the fill's own darker shade (a pale shape on a pale ground). */
  line?: number;
}

/** Instructions already drawn as paper, which the paper pass (paperize.ts) must not redo. */
export const papered = new WeakSet<object>();

/** Marks every instruction `g` gained since it held `from` as paper already. */
function mark(g: Graphics, from: number): Graphics {
  const list = g.context.instructions;
  for (let i = from; i < list.length; i++) papered.add(list[i]);
  return g;
}

const fillOf = (c: PaperColor) => (typeof c === 'number' ? c : c.fill);

/** The crayon outline colour for a fill: 38% of the way to near-black, so each shape keeps its own hue. */
export function crayon(color: PaperColor, t = 0.38): number {
  return toward(fillOf(color), CRAYON_INK, t);
}

/** A colour a step darker (or lighter, toward white), for shading inside a piece. */
export function darken(color: PaperColor, t: number): number {
  return toward(fillOf(color), CRAYON_INK, t);
}
export function lighten(color: PaperColor, t: number): number {
  return toward(fillOf(color), 0xffffff, t);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

type Pt = [number, number];

/** Pushes each point in or out from the centre by two sine waves (9 and 17 per loop), so the edge looks torn. */
export function wobble(pts: Pt[], amp: number, seed: number): Pt[] {
  if (!amp) return pts;
  const n = pts.length;
  let cx = 0,
    cy = 0;
  for (const [x, y] of pts) {
    cx += x;
    cy += y;
  }
  cx /= n;
  cy /= n;
  // The waves run along the edge by distance, not by point, so a corner crowded with points does not crumple.
  const along = [0];
  for (let i = 1; i <= n; i++) {
    const [a, b] = [pts[i - 1], pts[i % n]];
    along.push(along[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = along[n] || 1;
  return pts.map(([x, y], i) => {
    const t = (along[i] / total) * Math.PI * 2;
    const d = Math.sin(t * 9 + seed * 40) * 0.6 + Math.sin(t * 17 + seed * 90) * 0.4;
    const nx = x - cx,
      ny = y - cy;
    const l = Math.hypot(nx, ny) || 1;
    return [x + (nx / l) * d * amp, y + (ny / l) * d * amp];
  });
}

/** Traces a closed soft outline through the points (quadratic curves through the midpoints). */
function trace(g: Graphics, pts: Pt[], dx = 0, dy = 0): Graphics {
  const n = pts.length;
  const mid = (a: Pt, b: Pt) => [(a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy] as const;
  const m = mid(pts[n - 1], pts[0]);
  g.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = mid(a, pts[(i + 1) % n]);
    g.quadraticCurveTo(a[0] + dx, a[1] + dy, b[0], b[1]);
  }
  return g.closePath();
}

let fibre: FillPattern | null | undefined;
let fibreTex: Texture | null | undefined;

/** Draws the fibre strokes onto a canvas context, `w` × `h` logical units. */
export function drawFibre(x: CanvasRenderingContext2D, w = 192, h = 192) {
  let s = 0.77 * 2147483646 + 1;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < Math.round((260 * w * h) / (192 * 192)); i++) {
    const px = r() * w,
      py = r() * h,
      a = r() * Math.PI * 2,
      l = 3 + r() * 9;
    x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.55)' : 'rgba(60,40,20,0.35)';
    x.lineWidth = 0.6 + r() * 0.6;
    x.beginPath();
    x.moveTo(px, py);
    x.quadraticCurveTo(
      px + Math.cos(a + 0.6) * l * 0.5,
      py + Math.sin(a + 0.6) * l * 0.5,
      px + Math.cos(a) * l,
      py + Math.sin(a) * l,
    );
    x.stroke();
  }
}

/** The paper fibre tile as a texture (192 art-test pixels square). Null where there is no canvas (unit tests). */
export function fibreTexture(): Texture | null {
  if (fibreTex !== undefined) return fibreTex;
  fibreTex = null;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 192 * U;
  const x = c.getContext('2d');
  // A test's stand-in canvas may not draw; the look then simply goes without fibre.
  if (!x || typeof x.quadraticCurveTo !== 'function' || typeof x.scale !== 'function') return null;
  x.scale(U, U);
  drawFibre(x);
  fibreTex = Texture.from(c);
  return fibreTex;
}

/** The paper fibre tile as a repeating fill, for clipping to a shape. */
export function fibrePattern(): FillPattern | null {
  if (fibre !== undefined) return fibre;
  const tex = fibreTexture();
  fibre = tex ? new FillPattern(tex, 'repeat') : null;
  return fibre;
}

/** The shorter side of the outline's box: a thin piece barely wobbles, so a bar's length still reads true. */
function thinness(pts: Pt[]): number {
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  return Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
}

function extent(pts: Pt[]): number {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return Math.max(x1 - x0, y1 - y0);
}

/** The shadow under a piece: two offset copies at low alpha read as a soft blur without a filter. */
export function paperShadow(g: Graphics, pts: Pt[], small: boolean, alpha = 1): Graphics {
  const [ox, oy] = small ? [0.5 * U, 1.2 * U] : [1 * U, 3 * U];
  trace(g, pts, ox * 0.6, oy * 0.6).fill({ color: SHADOW, alpha: 0.16 * alpha });
  return trace(g, pts, ox * 1.2, oy * 1.2).fill({ color: SHADOW, alpha: 0.12 * alpha });
}

/**
 * Draws one paper piece from an outline of points (clockwise or not). Points should be no more than about 28 units
 * apart, so the wobble has something to work with; the shape helpers below take care of that.
 */
export function paperPoints(g: Graphics, outline: Pt[], color: PaperColor, o: PaperOptions = {}): Graphics {
  const from = g.context.instructions.length;
  drawPaper(g, outline, color, o);
  return mark(g, from);
}

function drawPaper(g: Graphics, outline: Pt[], color: PaperColor, o: PaperOptions): Graphics {
  const fill = fillOf(color);
  const alpha = o.alpha ?? 1;
  if (o.flat) return trace(g, outline).fill({ color: fill, alpha });
  const small = o.small ?? extent(outline) < 40;
  const seed =
    typeof o.seed === 'number'
      ? o.seed
      : hash(
          o.seed ??
            `${outline.length}:${outline[0][0].toFixed(1)},${outline[0][1].toFixed(1)}:${outline[outline.length >> 1][0].toFixed(1)}`,
        );
  // The art test's 2.2 px edge, eased off on smaller pieces so a circle still reads as a circle.
  const amp =
    o.amp ??
    Math.min(2.2 * U, Math.max(0.4 * U, extent(outline) * 0.028)) * Math.min(1, thinness(outline) / 60);
  const pts = wobble(outline, amp, seed);
  if (!o.noShadow) paperShadow(g, pts, small, alpha);
  trace(g, pts).fill({ color: fill, alpha });
  const tex = fibrePattern();
  if (tex) trace(g, pts).fill({ fill: tex, alpha: 0.28 * alpha });
  if (o.noOutline) return g;
  const line = o.line ?? crayon(fill);
  trace(g, pts).stroke({
    width: (small ? 1.5 : 2.6) * U,
    color: line,
    alpha: 0.9 * alpha,
    join: 'round',
  });
  return trace(g, pts, 0.9 * U, -0.7 * U).stroke({
    width: 1.2 * U,
    color: line,
    alpha: 0.45 * alpha,
    join: 'round',
  });
}

/** Evenly spaced points around an ellipse, rotated by `rot`. */
export function ellipsePoints(cx: number, cy: number, rx: number, ry: number, rot = 0): Pt[] {
  const n = Math.max(14, Math.min(64, Math.round((rx + ry) / (2.5 * U))));
  const [c, s] = [Math.cos(rot), Math.sin(rot)];
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx,
      y = Math.sin(a) * ry;
    return [cx + x * c - y * s, cy + x * s + y * c];
  });
}

/** Adds points along every edge longer than `step`, so straight sides wobble too. */
export function densify(pts: Pt[], step = 14 * U): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    out.push(a);
    const k = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    for (let j = 1; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
  }
  return out;
}

export function roundRectPoints(x: number, y: number, w: number, h: number, r: number): Pt[] {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const pts: Pt[] = [];
  const corners: [number, number, number][] = [
    [x + w - r, y + r, -Math.PI / 2],
    [x + w - r, y + h - r, 0],
    [x + r, y + h - r, Math.PI / 2],
    [x + r, y + r, Math.PI],
  ];
  const seg = r > 0 ? 5 : 0;
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (seg ? (i / seg) * (Math.PI / 2) : 0);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  return densify(pts);
}

/** Turns a flat [x0, y0, x1, y1, …] list into points, densified. */
export function polyPoints(flat: number[]): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) pts.push([flat[i], flat[i + 1]]);
  return densify(pts);
}

export function paperCircle(
  g: Graphics,
  x: number,
  y: number,
  r: number,
  color: PaperColor,
  o?: PaperOptions,
) {
  return paperPoints(g, ellipsePoints(x, y, r, r), color, o);
}

export function paperEllipse(
  g: Graphics,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: PaperColor,
  o?: PaperOptions & { rot?: number },
) {
  return paperPoints(g, ellipsePoints(x, y, rx, ry, o?.rot), color, o);
}

export function paperRect(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  color: PaperColor,
  o?: PaperOptions,
) {
  return paperPoints(g, roundRectPoints(x, y, w, h, radius), color, o);
}

export function paperPoly(g: Graphics, flat: number[], color: PaperColor, o?: PaperOptions) {
  return paperPoints(g, polyPoints(flat), color, o);
}

/** A cubic Bézier sampled into points (the start point left out, so curves chain). */
function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] {
  return Array.from({ length: n }, (_, k) => {
    const t = (k + 1) / n,
      u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ];
  });
}

function regular(sides: number, r: number, turn = -Math.PI / 2): number[] {
  return Array.from({ length: sides * 2 }, (_, i) => {
    const a = turn + (Math.floor(i / 2) * 2 * Math.PI) / sides;
    return i % 2 === 0 ? Math.cos(a) * r : Math.sin(a) * r;
  });
}

function starFlat(outer: number, inner: number, points = 5): number[] {
  const out: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    out.push(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return out;
}

/** The outline of each named shape, matching `shapePath` in shapes.ts, centred on (0, 0) and about 2r across. */
export function shapePoints(kind: ShapeKind, r: number): Pt[] {
  switch (kind) {
    case 'circle':
      return ellipsePoints(0, 0, r, r);
    case 'square':
      return roundRectPoints(-r * 0.86, -r * 0.86, r * 1.72, r * 1.72, r * 0.18);
    case 'triangle':
      return polyPoints(regular(3, r * 1.12).map((v, i) => (i % 2 ? v + r * 0.2 : v)));
    case 'star':
      return polyPoints(starFlat(r * 1.12, r * 0.5));
    case 'hexagon':
      return polyPoints(regular(6, r, 0));
    case 'heart': {
      const n = Math.max(8, Math.round(r / 6));
      const start: Pt = [0, r * 0.95];
      const top: Pt = [0, -r * 0.42];
      return [
        start,
        ...cubic(start, [-r * 1.3, r * 0.05], [-r * 0.95, -r * 1.05], top, n),
        ...cubic(top, [r * 0.95, -r * 1.05], [r * 1.3, r * 0.05], start, n).slice(0, -1),
      ];
    }
    case 'oval':
      return ellipsePoints(0, 0, r * 1.12, r * 0.72);
    case 'rectangle':
      return roundRectPoints(-r * 1.08, -r * 0.64, r * 2.16, r * 1.28, r * 0.14);
    case 'diamond':
      return polyPoints([0, -r * 1.18, r * 1.18, 0, 0, r * 1.18, -r * 1.18, 0]);
    case 'pentagon':
      return polyPoints(regular(5, r * 1.06).map((v, i) => (i % 2 ? v + r * 0.08 : v)));
    case 'trapezoid':
      return polyPoints([-r * 0.62, -r * 0.7, r * 0.62, -r * 0.7, r * 1.12, r * 0.7, -r * 1.12, r * 0.7]);
  }
}

export function paperShape(g: Graphics, kind: ShapeKind, r: number, color: PaperColor, o?: PaperOptions) {
  return paperPoints(g, shapePoints(kind, r), color, o);
}

/**
 * A hairline (a vein, ripple, stem or seaweed): a soft round-capped stroke through the points with a small shadow.
 * Not outlined.
 */
export function paperLine(
  g: Graphics,
  pts: Pt[],
  color: number,
  width: number,
  o: { alpha?: number; noShadow?: boolean } = {},
): Graphics {
  const path = (dx: number, dy: number) => {
    g.moveTo(pts[0][0] + dx, pts[0][1] + dy);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2,
        my = (pts[i][1] + pts[i + 1][1]) / 2;
      g.quadraticCurveTo(pts[i][0] + dx, pts[i][1] + dy, mx + dx, my + dy);
    }
    const l = pts[pts.length - 1];
    return g.lineTo(l[0] + dx, l[1] + dy);
  };
  const alpha = o.alpha ?? 1;
  const from = g.context.instructions.length;
  if (!o.noShadow)
    path(0, 2 * U).stroke({ width, color: SHADOW, alpha: 0.18 * alpha, cap: 'round', join: 'round' });
  path(0, 0).stroke({ width, color, alpha, cap: 'round', join: 'round' });
  return mark(g, from);
}

/** Lays the oatmeal ground and its fibre over a rectangle (a scene backdrop). */
export function paperGround(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color = PAPER_BG,
): Graphics {
  const from = g.context.instructions.length;
  g.rect(x, y, w, h).fill(color);
  const tex = fibrePattern();
  if (tex) g.rect(x, y, w, h).fill({ fill: tex, alpha: 0.35 });
  return mark(g, from);
}
