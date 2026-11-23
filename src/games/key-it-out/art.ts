import { Graphics } from 'pixi.js';
import { ink, swatch, type Swatch } from '../../art/palette';
import type { Look } from './logic';

/**
 * A sketch as a pure recipe of shapes, so a unit test can check that every part's values draw apart without Pixi; `paint`
 * replays it into a Graphics. A creature faces left and fits a box of about 240 × 190 units around the origin.
 *
 * Pencil style: an ink outline over paper, with the coat's pattern as hatching. A stamped sketch colours in.
 */
export type Shape =
  | { k: 'circle'; x: number; y: number; r: number; f: Role }
  | { k: 'ellipse'; x: number; y: number; rx: number; ry: number; f: Role }
  | { k: 'poly'; pts: number[]; f: Role }
  | { k: 'line'; pts: number[]; w: number; f: Role }
  | { k: 'arc'; x: number; y: number; r: number; a0: number; a1: number; w: number; f: Role };

/** What a shape is: the creature's body, a darker mark, the scenery that hides a part, or the hidden-part tag. */
type Role = 'body' | 'mark' | 'water' | 'reed' | 'smudge' | 'tag' | 'paper';

const HEAD = { x: -66, y: -34, r: 30 };
const BODY = { x: 8, y: 6, rx: 70, ry: 42 };
const LEGS = [-30, 40];
const FOOT_Y = 76;

/** One part's value, as shapes. */
export function partShapes(part: number, v: number): Shape[] {
  const { x, y, r } = HEAD;
  switch (part) {
    case 0: // head
      if (v === 0)
        return [
          { k: 'poly', pts: [x - 22, y - 18, x - 30, y - 56, x - 8, y - 26], f: 'mark' },
          { k: 'poly', pts: [x - 10, y - 26, x - 4, y - 66, x + 8, y - 28], f: 'mark' },
          { k: 'poly', pts: [x + 6, y - 26, x + 22, y - 58, x + 20, y - 18], f: 'mark' },
        ];
      if (v === 1)
        // Two curved horns: thick at the head, sweeping out to a point.
        return [-1, 1].map((d) => ({
          k: 'poly' as const,
          pts: [
            x + d * 8,
            y - 24,
            x + d * 26,
            y - 20,
            x + d * 38,
            y - 44,
            x + d * 34,
            y - 66,
            x + d * 24,
            y - 46,
          ],
          f: 'mark' as const,
        }));
      return [
        { k: 'ellipse', x: x - 14, y: y - r - 26, rx: 9, ry: 30, f: 'body' },
        { k: 'ellipse', x: x + 14, y: y - r - 26, rx: 9, ry: 30, f: 'body' },
      ];
    case 1: {
      // coat: a plain body, or spots, or stripes over it
      const body: Shape = { k: 'ellipse', x: BODY.x, y: BODY.y, rx: BODY.rx, ry: BODY.ry, f: 'body' };
      if (v === 0) return [body];
      if (v === 1)
        return [
          body,
          ...[
            [-30, -10, 10],
            [6, -20, 8],
            [36, -4, 11],
            [-8, 16, 9],
            [24, 24, 7],
            [-44, 18, 6],
          ].map(([dx, dy, rr]) => ({
            k: 'circle' as const,
            x: BODY.x + dx,
            y: BODY.y + dy,
            r: rr,
            f: 'mark' as const,
          })),
        ];
      return [
        body,
        ...[-40, -16, 8, 32, 54].map((dx) => {
          const half = BODY.ry * Math.sqrt(Math.max(0, 1 - (dx / BODY.rx) ** 2)) - 4;
          return {
            k: 'line' as const,
            pts: [BODY.x + dx, BODY.y - half, BODY.x + dx + 6, BODY.y + half],
            w: 7,
            f: 'mark' as const,
          };
        }),
      ];
    }
    case 2: {
      // tail, from the back of the body
      const tx = BODY.x + BODY.rx - 6,
        ty = BODY.y - 8;
      if (v === 0)
        return [-0.9, -0.45, 0, 0.45].map((a) => ({
          k: 'poly' as const,
          pts: [
            tx,
            ty,
            tx + 62 * Math.cos(a - 0.15),
            ty + 62 * Math.sin(a - 0.15),
            tx + 62 * Math.cos(a + 0.15),
            ty + 62 * Math.sin(a + 0.15),
          ],
          f: 'body' as const,
        }));
      if (v === 1)
        return [
          { k: 'arc', x: tx + 26, y: ty - 8, r: 24, a0: Math.PI * 0.9, a1: Math.PI * 2.6, w: 9, f: 'body' },
          { k: 'arc', x: tx + 26, y: ty - 8, r: 10, a0: Math.PI * 0.6, a1: Math.PI * 2.2, w: 7, f: 'body' },
        ];
      return [
        { k: 'line', pts: [tx, ty, tx + 44, ty - 30], w: 8, f: 'body' },
        { k: 'circle', x: tx + 52, y: ty - 38, r: 17, f: 'mark' },
      ];
    }
    default: {
      // feet: two legs and what is at their ends
      const legs: Shape[] = LEGS.map((lx) => ({
        k: 'line' as const,
        pts: [BODY.x + lx, BODY.y + 30, BODY.x + lx, FOOT_Y],
        w: 10,
        f: 'body' as const,
      }));
      const ends = LEGS.flatMap((lx): Shape[] => {
        const fx = BODY.x + lx;
        if (v === 0)
          return [
            { k: 'poly', pts: [fx - 4, FOOT_Y - 6, fx - 30, FOOT_Y + 12, fx + 14, FOOT_Y + 12], f: 'mark' },
          ];
        if (v === 1)
          return [-1, 0, 1].map((d) => ({
            k: 'line' as const,
            pts: [fx, FOOT_Y, fx - 14 + d * 10, FOOT_Y + 16],
            w: 5,
            f: 'mark' as const,
          }));
        return [
          {
            k: 'poly',
            pts: [fx - 10, FOOT_Y - 4, fx + 10, FOOT_Y - 4, fx + 12, FOOT_Y + 14, fx - 12, FOOT_Y + 14],
            f: 'mark',
          },
        ];
      });
      return [...legs, ...ends];
    }
  }
}

/** The hidden-part tag's place: a small question mark by the part. */
export const TAG_AT = [
  { x: -24, y: -84 },
  { x: 8, y: 6 },
  { x: 120, y: -54 },
  { x: 92, y: 86 },
];

/** What hides a part: the smudge over the head, the body left as an outline, reeds before the tail, water over the feet. */
export function hiderShapes(part: number): Shape[] {
  switch (part) {
    case 0:
      return [
        { k: 'circle', x: HEAD.x - 4, y: HEAD.y - 30, r: 40, f: 'smudge' },
        { k: 'circle', x: HEAD.x + 20, y: HEAD.y - 14, r: 32, f: 'smudge' },
        { k: 'circle', x: HEAD.x - 20, y: HEAD.y - 4, r: 30, f: 'smudge' },
      ];
    case 1:
      return [];
    case 2:
      return [56, 74, 92, 110, 128].map((x, i) => ({
        k: 'line' as const,
        pts: [x, 34, x + (i % 2 ? 8 : -6), -88 + (i % 3) * 10],
        w: 9,
        f: 'reed' as const,
      }));
    default:
      return [
        {
          k: 'poly',
          pts: [-120, FOOT_Y - 20, 140, FOOT_Y - 20, 140, FOOT_Y + 30, -120, FOOT_Y + 30],
          f: 'water',
        },
      ];
  }
}

/**
 * The whole sketch: tail and legs behind the body, the body (a hidden coat is the outline only), the head and its top,
 * then what hides parts. A hidden part's value is not drawn at all, so nothing of it shows past the reeds or the smudge.
 */
export function sketchShapes(look: Look, hidden: readonly number[], reveal = false): Shape[] {
  const hide = reveal ? [] : hidden;
  const shown = (p: number) => !hide.includes(p);
  const out: Shape[] = [];
  if (shown(2)) out.push(...partShapes(2, look[2]));
  out.push(...(shown(3) ? partShapes(3, look[3]) : partShapes(3, 0).filter((s) => s.f === 'body')));
  out.push(
    ...(shown(1)
      ? partShapes(1, look[1])
      : [{ k: 'ellipse' as const, x: BODY.x, y: BODY.y, rx: BODY.rx, ry: BODY.ry, f: 'paper' as const }]),
  );
  out.push({ k: 'circle', x: HEAD.x, y: HEAD.y, r: HEAD.r, f: 'body' });
  out.push({ k: 'circle', x: HEAD.x - 12, y: HEAD.y - 4, r: 4.5, f: 'mark' });
  if (shown(0)) out.push(...partShapes(0, look[0]));
  for (const p of hide) out.push(...hiderShapes(p));
  return out;
}

export interface Ink {
  /** Pencil (false) or coloured in. */
  colour: boolean;
  /** The creature's colour when coloured in. */
  sw: Swatch;
}

const PAPER = 0xfdf8ec;
/** A pencil sketch's shaded body: a plain coat drawn, as against a coat left as an outline. */
const SHADE = 0xe3dccb;

/** Replay a recipe into `g`, at scale `k` about (x, y). */
export function paint(g: Graphics, shapes: readonly Shape[], x: number, y: number, k: number, how: Ink) {
  const line = how.colour ? how.sw.line : ink;
  const fillOf = (f: Role) =>
    f === 'body'
      ? how.colour
        ? how.sw.fill
        : SHADE
      : f === 'mark'
        ? how.colour
          ? how.sw.line
          : 0x6b6b78
        : f === 'water'
          ? swatch.blue.light
          : f === 'reed'
            ? swatch.green.line
            : f === 'smudge'
              ? 0xb8b4bf
              : f === 'tag'
                ? swatch.yellow.fill
                : PAPER;
  const stroke = { width: Math.max(1.5, 3.5 * k), color: line, alpha: how.colour ? 1 : 0.85 };
  for (const s of shapes) {
    const fill = fillOf(s.f);
    switch (s.k) {
      case 'circle':
        g.circle(x + s.x * k, y + s.y * k, s.r * k).fill(fill);
        if (s.f === 'body' || s.f === 'mark') g.stroke(stroke);
        break;
      case 'ellipse':
        g.ellipse(x + s.x * k, y + s.y * k, s.rx * k, s.ry * k)
          .fill(fill)
          .stroke(stroke);
        break;
      case 'poly':
        g.poly(s.pts.map((v, i) => (i % 2 ? y : x) + v * k)).fill({
          color: fill,
          alpha: s.f === 'water' ? 0.92 : 1,
        });
        if (s.f !== 'water') g.stroke(stroke);
        break;
      case 'line':
        g.moveTo(x + s.pts[0] * k, y + s.pts[1] * k)
          .lineTo(x + s.pts[2] * k, y + s.pts[3] * k)
          .stroke({ width: s.w * k, color: s.f === 'body' ? line : fill, cap: 'round' });
        break;
      case 'arc':
        g.moveTo(x + (s.x + s.r * Math.cos(s.a0)) * k, y + (s.y + s.r * Math.sin(s.a0)) * k)
          .arc(x + s.x * k, y + s.y * k, s.r * k, s.a0, s.a1, s.a1 < s.a0)
          .stroke({ width: s.w * k, color: s.f === 'body' ? line : fill, cap: 'round' });
        break;
    }
  }
}

/** The question-mark tag on a hidden part. */
export function tag(g: Graphics, part: number, x: number, y: number, k: number) {
  const t = TAG_AT[part];
  const cx = x + t.x * k,
    cy = y + t.y * k,
    r = 17 * k;
  g.circle(cx, cy, r)
    .fill(swatch.yellow.fill)
    .stroke({ width: Math.max(1.5, 3 * k), color: ink });
  // A drawn question mark: a hook and a dot.
  g.moveTo(cx - 6 * k, cy - 5 * k)
    .arc(cx, cy - 5 * k, 6 * k, Math.PI, Math.PI * 2.4)
    .lineTo(cx, cy + 4 * k)
    .stroke({ width: Math.max(1.5, 3.2 * k), color: ink, cap: 'round' });
  g.circle(cx, cy + 10 * k, 2.2 * k).fill(ink);
}

/** Each guide name's colour when its sketch is stamped. */
export const NAME_SWATCH: Swatch[] = [
  swatch.teal,
  swatch.orange,
  swatch.purple,
  swatch.green,
  swatch.pink,
  swatch.blue,
  swatch.coral,
  swatch.yellow,
  swatch.brown,
  swatch.lavender,
  swatch.red,
  swatch.peach,
];

/** Draw a sketch: pencil, or coloured in once stamped (with its hidden parts shown). */
export function drawSketch(
  g: Graphics,
  look: Look,
  hidden: readonly number[],
  name: number,
  x: number,
  y: number,
  k: number,
  coloured: boolean,
) {
  paint(g, sketchShapes(look, hidden, coloured), x, y, k, { colour: coloured, sw: NAME_SWATCH[name] });
  if (!coloured) for (const p of hidden) tag(g, p, x, y, k);
}
