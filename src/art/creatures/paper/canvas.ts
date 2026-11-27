import { CanvasSource, Texture } from 'pixi.js';
import { drawFibre } from '../../paper';
import { EXPRESSIONS, type ArtSet, type Expression, type Point } from '../illustrated';

/**
 * Paper cut-out creature sprites drawn in code (docs/ART-STYLE.md): the same recipe as the paper pass (torn edge, warm
 * shadow, flat fill, fibre, a double crayon outline in a darker shade of the piece's own colour), on a Canvas 2D at load
 * time. Each species draws its six expressions into the box of its prepared sprite (`<SPECIES>_ART`), with its eyes,
 * leaves, arms and slots on the very points the table records, so the rig's mesh, blinks, pins and wearables work
 * unchanged. Sizes here are in sprite pixels (half a creature unit).
 */

type Pt = [number, number];
export type Ctx = CanvasRenderingContext2D;

const INK: Pt3 = [29, 26, 34];
type Pt3 = [number, number, number];
const rgb = (hex: number): Pt3 => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const css = ([r, g, b]: Pt3, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
const mix = (a: Pt3, b: Pt3, t: number): Pt3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
export const shade = (hex: number, t: number) => css(mix(rgb(hex), INK, t));
export const tint = (hex: number, t: number) => css(mix(rgb(hex), [255, 255, 255], t));
export const hexCss = (hex: number, a = 1) => css(rgb(hex), a);

let fibre: CanvasPattern | null | undefined;
function fibreOn(x: Ctx): CanvasPattern | null {
  if (fibre !== undefined) return fibre;
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const t = c.getContext('2d');
  if (!t) return (fibre = null);
  drawFibre(t);
  fibre = x.createPattern(c, 'repeat');
  return fibre;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** A soft closed path through the points, its edge pushed in and out by two waves (by distance along the edge). */
export function softPath(pts: Pt[], amp: number, seed: string): Path2D {
  const n = pts.length;
  let cx = 0,
    cy = 0;
  for (const [x, y] of pts) {
    cx += x;
    cy += y;
  }
  cx /= n;
  cy /= n;
  const along = [0];
  for (let i = 1; i <= n; i++) {
    const [a, b] = [pts[i - 1], pts[i % n]];
    along.push(along[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const h = hash(seed);
  const w = pts.map(([x, y], i) => {
    const t = (along[i] / along[n]) * Math.PI * 2;
    const d = Math.sin(t * 9 + h * 40) * 0.6 + Math.sin(t * 17 + h * 90) * 0.4;
    const l = Math.hypot(x - cx, y - cy) || 1;
    return [x + ((x - cx) / l) * d * amp, y + ((y - cy) / l) * d * amp] as Pt;
  });
  const p = new Path2D();
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m = mid(w[n - 1], w[0]);
  p.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    const b = mid(w[i], w[(i + 1) % n]);
    p.quadraticCurveTo(w[i][0], w[i][1], b[0], b[1]);
  }
  p.closePath();
  return p;
}

/** Points round an ellipse, turned by `rot`. */
export function ellipsePts(cx: number, cy: number, rx: number, ry: number, rot = 0): Pt[] {
  const n = Math.max(16, Math.min(56, Math.round((rx + ry) / 5)));
  const [c, s] = [Math.cos(rot), Math.sin(rot)];
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx,
      y = Math.sin(a) * ry;
    return [cx + x * c - y * s, cy + x * s + y * c] as Pt;
  });
}

/** A leaf (or any almond) from `a` to `b`, `w` wide at its middle. */
export function almondPts(a: Pt, b: Pt, w: number, n = 24): Pt[] {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const side = t < 0.5 ? 1 : -1;
    const k = t < 0.5 ? t * 2 : (1 - t) * 2;
    const half = (w / 2) * Math.sin(k * Math.PI) ** 0.8;
    const along = k * len;
    out.push([a[0] + ux * along - uy * half * side, a[1] + uy * along + ux * half * side]);
  }
  return out;
}

/** Re-spaces a polygon so no two points are more than `step` apart. */
export function dense(pts: readonly Point[] | Pt[], step = 22): Pt[] {
  const p = (pts as (Point | Pt)[]).map((q) => (Array.isArray(q) ? q : [q.x, q.y]) as Pt);
  const out: Pt[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i],
      b = p[(i + 1) % p.length];
    out.push(a);
    const k = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    for (let j = 1; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
  }
  return out;
}

export interface PieceOptions {
  /** Wobble height in sprite pixels (default 5, or 2 on a small piece). */
  amp?: number;
  small?: boolean;
  noShadow?: boolean;
  noOutline?: boolean;
  /** An outline colour other than the piece's own darker shade. */
  line?: string;
  /** Reuse the path, so a later piece can sit exactly on this one. */
  path?: Path2D;
}

/** One paper piece: shadow, fill, fibre and the double crayon outline. Returns its path. */
export function piece(x: Ctx, pts: Pt[], color: number, seed: string, o: PieceOptions = {}): Path2D {
  const small = o.small ?? false;
  const path = o.path ?? softPath(pts, o.amp ?? (small ? 2 : 5), seed);
  if (!o.noShadow) {
    x.save();
    x.shadowColor = 'rgba(45,30,20,0.32)';
    x.shadowBlur = small ? 4 : 9;
    x.shadowOffsetX = small ? 1 : 2;
    x.shadowOffsetY = small ? 2.5 : 6;
    x.fillStyle = hexCss(color);
    x.fill(path);
    x.restore();
  }
  x.fillStyle = hexCss(color);
  x.fill(path);
  const tex = fibreOn(x);
  if (tex) {
    x.save();
    x.clip(path);
    x.globalAlpha = 0.28;
    x.fillStyle = tex;
    x.fillRect(0, 0, x.canvas.width, x.canvas.height);
    x.restore();
  }
  if (!o.noOutline) outline(x, path, o.line ?? shade(color, 0.38), small);
  return path;
}

/**
 * Overlapping pieces cut as one (a head on a body): the shadow and a doubled outline go under all of them, then the
 * fills and fibre on top, so only the outer edge shows a line.
 */
export function pieceUnion(x: Ctx, parts: Pt[][], color: number, seed: string, amp = 5): Path2D {
  const path = new Path2D();
  parts.forEach((pts, i) => path.addPath(softPath(pts, amp, `${seed}${i}`)));
  x.save();
  x.shadowColor = 'rgba(45,30,20,0.32)';
  x.shadowBlur = 9;
  x.shadowOffsetX = 2;
  x.shadowOffsetY = 6;
  x.lineJoin = 'round';
  x.strokeStyle = shade(color, 0.38);
  x.lineWidth = 11;
  x.globalAlpha = 0.9;
  x.stroke(path);
  x.restore();
  x.fillStyle = hexCss(color);
  x.fill(path);
  const tex = fibreOn(x);
  if (tex) {
    x.save();
    x.clip(path);
    x.globalAlpha = 0.28;
    x.fillStyle = tex;
    x.fillRect(0, 0, x.canvas.width, x.canvas.height);
    x.restore();
  }
  return path;
}

/** The double crayon line round a path. */
export function outline(x: Ctx, path: Path2D, color: string, small = false) {
  x.save();
  x.lineJoin = 'round';
  x.lineCap = 'round';
  x.strokeStyle = color;
  x.globalAlpha = 0.9;
  x.lineWidth = small ? 3 : 5.5;
  x.stroke(path);
  x.translate(1.8, -1.4);
  x.globalAlpha = 0.45;
  x.lineWidth = 2.4;
  x.stroke(path);
  x.restore();
}

/** A flat soft spot (cheeks, a belly patch's shading), no outline or shadow. */
export function spot(x: Ctx, cx: number, cy: number, rx: number, ry: number, color: string) {
  x.save();
  x.fillStyle = color;
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  x.fill();
  x.restore();
}

/** A round-capped hairline stroke through points (a mouth, a closed eye, a vein). */
export function line(x: Ctx, pts: Pt[], color: string, width: number) {
  x.save();
  x.strokeStyle = color;
  x.lineWidth = width;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  x.beginPath();
  x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const m: Pt = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    x.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  const l = pts[pts.length - 1];
  x.lineTo(l[0], l[1]);
  x.stroke();
  x.restore();
}

export const FACE_INK = 0x2e2a33;

/**
 * An eye for an expression, centred on the table's eye (`rx`, `ry` its painted size). Open eyes are dark paper ovals
 * with a white glint; a blink or a happy squint is a curved line; sleepy is a lowered lid; surprised is rounder.
 */
export function eye(
  x: Ctx,
  e: { x: number; y: number; rx: number; ry: number },
  ex: Expression,
  seed: string,
) {
  const ink = hexCss(FACE_INK);
  const w = Math.max(3.5, e.rx * 0.28);
  if (ex === 'blink' || ex === 'sleepy') {
    const dip = ex === 'sleepy' ? e.ry * 0.25 : e.ry * 0.35;
    line(
      x,
      [
        [e.x - e.rx, e.y + (ex === 'sleepy' ? e.ry * 0.2 : 0)],
        [e.x, e.y + dip + (ex === 'sleepy' ? e.ry * 0.2 : 0)],
        [e.x + e.rx, e.y + (ex === 'sleepy' ? e.ry * 0.2 : 0)],
      ],
      ink,
      w,
    );
    return;
  }
  if (ex === 'happy') {
    line(
      x,
      [
        [e.x - e.rx, e.y + e.ry * 0.25],
        [e.x, e.y - e.ry * 0.55],
        [e.x + e.rx, e.y + e.ry * 0.25],
      ],
      ink,
      w,
    );
    return;
  }
  const k = ex === 'surprised' ? 1.12 : 1;
  const path = softPath(ellipsePts(e.x, e.y, e.rx * k, e.ry * k), 0.6, seed);
  x.fillStyle = ink;
  x.fill(path);
  spot(x, e.x - e.rx * 0.3, e.y - e.ry * 0.35, e.rx * 0.3, e.ry * 0.26, 'rgba(255,255,255,0.95)');
  spot(x, e.x + e.rx * 0.3, e.y + e.ry * 0.35, e.rx * 0.13, e.ry * 0.11, 'rgba(255,255,255,0.8)');
  if (ex === 'sad') {
    // A worried brow over each eye, higher at the middle of the face.
    line(
      x,
      [
        [e.x - e.rx * 1.1, e.y - e.ry * 1.25],
        [e.x + e.rx * 1.0, e.y - e.ry * 1.65],
      ],
      ink,
      w * 0.8,
    );
  }
}

/** A mouth for an expression at `m`, `s` wide. */
export function mouth(x: Ctx, m: { x: number; y: number }, ex: Expression, s: number) {
  const ink = hexCss(FACE_INK);
  if (ex === 'happy' || ex === 'surprised') {
    const p = new Path2D();
    if (ex === 'happy') {
      p.moveTo(m.x - s, m.y - s * 0.2);
      p.quadraticCurveTo(m.x, m.y + s * 1.3, m.x + s, m.y - s * 0.2);
      p.closePath();
    } else p.ellipse(m.x, m.y + s * 0.2, s * 0.45, s * 0.55, 0, 0, Math.PI * 2);
    x.fillStyle = '#7a2e3e';
    x.fill(p);
    x.save();
    x.clip(p);
    spot(x, m.x, m.y + s * 0.75, s * 0.55, s * 0.4, '#ff8fa3');
    x.restore();
    x.strokeStyle = ink;
    x.lineWidth = 3;
    x.lineJoin = 'round';
    x.stroke(p);
    return;
  }
  const down = ex === 'sad' ? -1 : 1;
  const w = ex === 'sleepy' ? s * 0.5 : s * 0.7;
  line(
    x,
    [
      [m.x - w, m.y],
      [m.x, m.y + down * s * 0.45],
      [m.x + w, m.y],
    ],
    ink,
    4,
  );
}

/** Draws a species' six expressions into textures the size of its prepared sprite (drawn at twice the size). */
export function paperArtSet(
  width: number,
  height: number,
  draw: (x: Ctx, ex: Expression) => void,
  extra?: { nohead?: (x: Ctx) => void },
): ArtSet {
  const make = (fn: (x: Ctx) => void) => {
    const c = document.createElement('canvas');
    c.width = width * 2;
    c.height = height * 2;
    const x = c.getContext('2d')!;
    x.scale(2, 2);
    fn(x);
    const t: Texture = new Texture({ source: new CanvasSource({ resource: c, resolution: 2 }) });
    t.source.autoGenerateMipmaps = true;
    t.source.updateMipmaps();
    return t;
  };
  const set = Object.fromEntries(EXPRESSIONS.map((ex) => [ex, make((x) => draw(x, ex))])) as Record<
    Expression,
    Texture
  >;
  return extra?.nohead ? { ...set, nohead: make(extra.nohead) } : set;
}
