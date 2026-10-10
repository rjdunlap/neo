import { RAINBOW, type ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

export type Primary = 'red' | 'yellow' | 'blue';
export type ThingId = 'sun' | 'apple' | 'leaf' | 'pumpkin' | 'grapes' | 'blueberry';
export type Circle = [x: number, y: number, r: number];

/** A coloring-page picture: its true color and the circles whose union is the part to paint. */
export interface Thing {
  id: ThingId;
  color: ColorName;
  circles: Circle[];
}

export const THINGS: Thing[] = [
  { id: 'sun', color: 'yellow', circles: [[0, 0, 84]] },
  { id: 'apple', color: 'red', circles: [[-38, 8, 62], [38, 8, 62], [0, 22, 66]] },
  { id: 'leaf', color: 'green', circles: [[-92, 46, 20], [-62, 31, 36], [-22, 11, 50], [20, -10, 50], [58, -29, 36], [86, -43, 20]] },
  { id: 'pumpkin', color: 'orange', circles: [[-52, 12, 56], [52, 12, 56], [0, 6, 68]] },
  { id: 'grapes', color: 'purple', circles: [[-62, -36, 36], [0, -36, 36], [62, -36, 36], [-31, 20, 36], [31, 20, 36], [0, 74, 36]] },
  { id: 'blueberry', color: 'blue', circles: [[0, 0, 82]] },
];

/** free: rainbow painting. pots: pick a color. named: "paint the sun yellow". recall: "paint the sun" (what color is it?). mix: make the color from two pots. */
export type PaintMode = 'free' | 'pots' | 'named' | 'recall' | 'mix';
export interface PaintPlan {
  mode: PaintMode;
  /** Pictures on the page. */
  count: number;
}

export const PLANS: PaintPlan[] = [
  { mode: 'free', count: 0 },
  { mode: 'pots', count: 0 },
  { mode: 'named', count: 2 },
  { mode: 'named', count: 3 },
  { mode: 'recall', count: 3 },
  { mode: 'mix', count: 2 },
];

export function planFor(level: number): PaintPlan {
  return PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];
}

export const RECIPES: Partial<Record<ColorName, [Primary, Primary]>> = {
  orange: ['red', 'yellow'],
  green: ['yellow', 'blue'],
  purple: ['red', 'blue'],
};

/** What two primaries make in the mixing bowl. The same one twice stays itself. */
export function mix(a: Primary, b: Primary): ColorName {
  if (a === b) return a;
  for (const [color, pair] of Object.entries(RECIPES)) if (pair!.includes(a) && pair!.includes(b)) return color as ColorName;
  return a;
}

/** The pictures for one page. Mixing pages only use colors that need mixing. */
export function pickThings(plan: PaintPlan, rng: Rng): Thing[] {
  const pool = plan.mode === 'mix' ? THINGS.filter((t) => RECIPES[t.color]) : THINGS;
  return rng.shuffle([...pool]).slice(0, plan.count);
}

export function inside(circles: Circle[], x: number, y: number): boolean {
  return circles.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) <= r);
}

/** Tracks how much of a picture has been painted by sampling a grid of points inside it. */
export class Coverage {
  private readonly points: { x: number; y: number }[] = [];
  readonly total: number;

  constructor(circles: Circle[], step = 14) {
    const x0 = Math.min(...circles.map(([x, , r]) => x - r));
    const x1 = Math.max(...circles.map(([x, , r]) => x + r));
    const y0 = Math.min(...circles.map(([, y, r]) => y - r));
    const y1 = Math.max(...circles.map(([, y, r]) => y + r));
    for (let y = y0 + step / 2; y < y1; y += step) for (let x = x0 + step / 2; x < x1; x += step) if (inside(circles, x, y)) this.points.push({ x, y });
    this.total = this.points.length;
  }

  /** Paint a dab of radius r. Returns how much of the picture is now covered (0..1). */
  paint(x: number, y: number, r: number): number {
    for (let i = this.points.length - 1; i >= 0; i--) {
      const p = this.points[i];
      if (Math.hypot(p.x - x, p.y - y) <= r) this.points.splice(i, 1);
    }
    return this.covered;
  }

  get covered(): number {
    return 1 - this.points.length / this.total;
  }
}

/** The paper's margin, and the brush: stamps are `BRUSH_RADIUS` wide, `SPACING` apart along a stroke, and every second one dabs a picture. */
export const MARGIN = 18;
export const BRUSH_RADIUS = 24;
export const SPACING = 5;
/** A picture counts as painted when this much of it is covered; then it fills in neatly. */
export const PAINTED = 0.7;

export interface PaintState {
  mode: PaintMode;
  /** Strokes finished so far: the free levels show the hang-it-up button after five. */
  strokes: number;
  /** The picked color (null: rainbow, or none yet), and what has been poured into the bowl. */
  brush: ColorName | null;
  poured: Primary[];
  /** The color of the picture being asked for, or null when there is none (the free levels, or every picture done). */
  picture: ColorName | null;
  /** The hang-it-up button is showing. */
  frame: boolean;
}

export type PaintMove = { do: 'pot'; pot: ColorName } | { do: 'bowl' } | { do: 'stroke' } | { do: 'frame' };

/**
 * What a capable child does next. Free painting: five strokes, then the frame. Pots: a different color for each of five strokes.
 * A picture: pick the pot of its color (or pour the two primaries that make it), then fill it; and when every picture is painted, the
 * frame. It never paints with a color that is not the picture's, which is the one wrong move.
 */
export function paintStep(s: PaintState): PaintMove | null {
  if (s.frame) return { do: 'frame' };
  if (s.mode === 'free') return { do: 'stroke' };
  if (s.mode === 'pots') {
    const want = RAINBOW[s.strokes % RAINBOW.length];
    return s.brush === want ? { do: 'stroke' } : { do: 'pot', pot: want };
  }
  if (!s.picture) return null;
  if (s.brush === s.picture) return { do: 'stroke' };
  if (s.mode !== 'mix') return { do: 'pot', pot: s.picture };
  const [a, b] = RECIPES[s.picture]!;
  // One primary is in the bowl: add the other. Anything else in a half-full bowl is emptied first (a third pour would also start over).
  if (s.poured.length === 1) return s.poured[0] === a ? { do: 'pot', pot: b } : s.poured[0] === b ? { do: 'pot', pot: a } : { do: 'bowl' };
  return { do: 'pot', pot: a };
}

export interface Pt {
  x: number;
  y: number;
}

/** The part of the paper free strokes stay in: clear of the home button, the pet, the pots below and the frame button above right. */
export const scribbleArea = (w: number, h: number) => ({ x: 150, y: 140, w: Math.max(200, w - 150 - 130), h: Math.max(120, h - 140 - 180) });

/** A wavy band across the paper for the i-th free stroke, long enough to count as a stroke (over 40 units), the bands one above the other. */
export function scribble(i: number, area: { x: number; y: number; w: number; h: number }): Pt[] {
  const row = i % 5;
  const y = area.y + ((row + 0.5) * area.h) / 5;
  const amp = Math.min(30, area.h / 12);
  const forward = row % 2 === 0;
  return Array.from({ length: 7 }, (_, k) => {
    const t = forward ? k / 6 : 1 - k / 6;
    return { x: area.x + area.w * (0.1 + 0.8 * t), y: y + (k % 2 ? amp : -amp) };
  });
}

/**
 * A zig-zag, in a picture's own units, that paints at least `PAINTED` of it: horizontal rows across the union of its circles, a
 * little over one brush reach apart (the brush reaches `BRUSH_RADIUS + 6` paper units, `1 / scale` times that in picture units),
 * each pulled in a few units from the edge so every dab lands on the picture.
 */
export function fillPath(circles: Circle[], scale: number): Pt[] {
  const reach = (BRUSH_RADIUS + 6) / scale;
  const y0 = Math.min(...circles.map(([, y, r]) => y - r));
  const y1 = Math.max(...circles.map(([, y, r]) => y + r));
  const rows = Math.max(2, Math.ceil((y1 - y0) / (reach * 1.1)));
  const path: Pt[] = [];
  for (let k = 0; k < rows; k++) {
    const y = y0 + ((k + 0.5) * (y1 - y0)) / rows;
    const spans = circles.filter(([, cy, r]) => Math.abs(y - cy) < r - 4).map(([cx, cy, r]) => [cx - Math.sqrt(r * r - (y - cy) ** 2), cx + Math.sqrt(r * r - (y - cy) ** 2)]);
    if (!spans.length) continue;
    const x0 = Math.min(...spans.map((q) => q[0])) + 4;
    const x1 = Math.max(...spans.map((q) => q[1])) - 4;
    path.push(...(k % 2 ? [{ x: x1, y }, { x: x0, y }] : [{ x: x0, y }, { x: x1, y }]));
  }
  return path;
}
