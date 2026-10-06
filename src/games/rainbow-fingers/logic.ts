import type { ColorName } from '../../art/palette';
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
