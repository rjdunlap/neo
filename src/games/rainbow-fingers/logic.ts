import { RAINBOW, type ColorName } from '../../art/palette';
import { PAINTING_MAX_MARKS, type PaintingMark } from '../../content/creations';
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

/** free: rainbow painting. pots: pick a color. named: "paint the sun yellow". recall: "paint the sun" (what color is it?). mix: make the color from two pots. recall-mix: remember the color, then mix it. */
export type PaintMode = 'free' | 'pots' | 'named' | 'recall' | 'mix' | 'recall-mix';
/** Both mixing pages pour primaries into a bowl instead of selecting a pot directly. */
export function pours(mode: PaintMode): boolean {
  return mode === 'mix' || mode === 'recall-mix';
}

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
  { mode: 'recall-mix', count: 1 },
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
  if (plan.mode === 'recall-mix') return [THINGS.find((thing) => thing.id === 'pumpkin')!];
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
  /** A fold page, and whether it has been folded yet. */
  fold?: boolean;
  folded?: boolean;
}

export type PaintMove = { do: 'pot'; pot: ColorName } | { do: 'bowl' } | { do: 'stroke' } | { do: 'frame' } | { do: 'fold' };

/** On a fold page the ghost finger presses fold after this many strokes (or sooner, once the frame shows); with the fold that makes the five touches the frame needs. */
export const FOLD_AFTER = 4;

/**
 * What a capable child does next. Free painting: five strokes, then the frame. Pots: a different color for each of five strokes.
 * A picture: pick the pot of its color (or pour the two primaries that make it), then fill it; and when every picture is painted, the
 * frame. It never paints with a color that is not the picture's, which is the one wrong move.
 */
export function paintStep(s: PaintState): PaintMove | null {
  // A fold page is folded once before it is hung up, even when the frame came early (one touch and a long look).
  if (s.fold && !s.folded && (s.strokes >= FOLD_AFTER || (s.frame && s.strokes > 0))) return { do: 'fold' };
  if (s.frame) return { do: 'frame' };
  if (s.mode === 'free') return { do: 'stroke' };
  if (s.mode === 'pots') {
    const want = RAINBOW[s.strokes % RAINBOW.length];
    return s.brush === want ? { do: 'stroke' } : { do: 'pot', pot: want };
  }
  if (!s.picture) return null;
  if (s.brush === s.picture) return { do: 'stroke' };
  if (!pours(s.mode)) return { do: 'pot', pot: s.picture };
  const [a, b] = RECIPES[s.picture]!;
  // One primary is in the bowl: add the other. Anything else in a half-full bowl is emptied first (a third pour would also start over).
  if (s.poured.length === 1) return s.poured[0] === a ? { do: 'pot', pot: b } : s.poured[0] === b ? { do: 'pot', pot: a } : { do: 'bowl' };
  return { do: 'pot', pot: a };
}

export interface Pt {
  x: number;
  y: number;
}

/** What a lifted touch was: a quick pat (it splats a flower), a press held in place, or a drag that paints a line. */
export type Touch = 'pat' | 'hold' | 'drag';

export function touchKind(travelled: number, seconds: number): Touch {
  if (travelled < 14 && seconds < 0.5) return 'pat';
  return travelled > 40 ? 'drag' : 'hold';
}

/** Every kind of touch counts toward hanging the painting up, so a child who only pats, slaps or holds finishes too. */
export function strokesCounted(touches: readonly Touch[]): number {
  return touches.length;
}

/** The free levels show the hang-it-up button after five touches, or after one and a long look. */
export function frameShows(counted: number, seconds: number): boolean {
  return counted >= 5 || (counted >= 1 && seconds > 25);
}

/** A pat's splat: a flower on a round blot this far across from its centre, so it is at least 100 units wide. */
export const SPLAT_RADIUS = 50;

/** Pots are 104 across (hit circles of 52) and 104 apart; the mixing bowl takes 1.4 slots. */
export const POT_RADIUS = 52;
export const POT_SPACING = 104;
const BOWL_SLOTS = 1.4;
/** The bottom-left corner the pet stands in: nothing touchable sits left of this. */
export const PET_CLEAR = 150;
const ROW_GAP = 120;

/**
 * Centres for `n` pots (and the bowl after them, when mixing) along the bottom of a `w` × `h` view: one centred row clear of the pet,
 * wrapping to two rows (the top row first, the longer one) when one would not fit between the pet and the right edge.
 */
export function potLayout(n: number, w: number, h: number, bowl = false): { pots: Pt[]; bowl?: Pt } {
  const left = PET_CLEAR + POT_RADIUS;
  const right = w - MARGIN - 22 - POT_RADIUS;
  const slots = n + (bowl ? BOWL_SLOTS : 0);
  const fits = (k: number) => (k - 1) * POT_SPACING <= right - left;
  const rows = fits(slots) ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)];
  const pots: Pt[] = [];
  let bowlAt: Pt | undefined;
  rows.forEach((count, r) => {
    const span = count + (bowl && r === rows.length - 1 ? BOWL_SLOTS : 0);
    const width = (span - 1) * POT_SPACING;
    const centre = Math.min(right - width / 2, Math.max(left + width / 2, w / 2));
    const y = h - 58 - (rows.length - 1 - r) * ROW_GAP;
    const x0 = centre - width / 2;
    for (let i = 0; i < count; i++) pots.push({ x: x0 + i * POT_SPACING, y });
    if (bowl && r === rows.length - 1) bowlAt = { x: x0 + (span - 1) * POT_SPACING - 10, y };
  });
  return bowlAt ? { pots, bowl: bowlAt } : { pots };
}

/** A mark on each color pot, so the color is not the only way to tell the pots apart. */
export type PotMark = 'dot' | 'stripe' | 'star' | 'heart' | 'swirl' | 'ring';
export const POT_MARKS: Record<string, PotMark> = { red: 'dot', orange: 'stripe', yellow: 'star', green: 'heart', blue: 'swirl', purple: 'ring' };

/** The free levels nudge after this long without a touch: a sparkle on a blank spot and a wiggle from the pet. Never a hint. */
export const NUDGE_AFTER = 8;
export const nudges = (mode: PaintMode) => mode === 'free' || mode === 'pots';

/** Of the candidate spots, the one farthest from any paint already on the page. */
export function blankSpot(painted: readonly Pt[], candidates: readonly Pt[]): Pt {
  let best = candidates[0];
  let far = -1;
  for (const c of candidates) {
    const d = painted.length ? Math.min(...painted.map((p) => Math.hypot(p.x - c.x, p.y - c.y))) : Infinity;
    if (d > far) [best, far] = [c, d];
  }
  return best;
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

/** A level-2 page is plain or a fold page (paint, then press the paper closed to print a mirror copy); every other level is plain. */
export type PageKind = 'plain' | 'fold';
export function pageKind(level: number, rng: Rng): PageKind {
  // Only level 2 draws, so every other level's seeded pictures stay as they were.
  if (level !== 2) return 'plain';
  return rng.next() < 0.5 ? 'fold' : 'plain';
}

/** The fold line is the middle of the paper: a mirror sends x (a fraction of the paper's width) to 1 - x. */
export const mirrorX = (x: number) => Math.min(1, Math.max(0, 1 - x));

/**
 * The painting after a fold: everything already there, plus a mirror copy of each mark made since index `since` (the marks before it
 * are dry and already printed). A mark that already sits across the crease (nearer to it than its own radius, in paper units, where
 * `aspect` is the paper's width over its shorter side) is not copied. The result keeps to `max` marks by the same halving the
 * painting uses while it grows.
 */
export function foldMarks(marks: readonly PaintingMark[], since: number, aspect = 1, max = PAINTING_MAX_MARKS): PaintingMark[] {
  const copies = marks.slice(since).filter((m) => Math.abs(m.x - 0.5) * aspect >= m.r).map((m) => ({ ...m, x: mirrorX(m.x) }));
  return capMarks([...marks, ...copies], max).marks;
}

/** Halve a painting's marks (every second one) until it fits `max`; `halvings` says how many times, so sampling can coarsen to match. */
export function capMarks(marks: PaintingMark[], max = PAINTING_MAX_MARKS): { marks: PaintingMark[]; halvings: number } {
  let halvings = 0;
  while (marks.length > max) {
    marks = marks.filter((_, i) => i % 2 === 0);
    halvings++;
  }
  return { marks, halvings };
}

/** Where `since` lands after the marks are halved `halvings` times: the even-indexed marks before it survive. */
export function halvedIndex(since: number, halvings: number): number {
  for (let k = 0; k < halvings; k++) since = Math.ceil(since / 2);
  return since;
}

/** Fold button: radius 52 (104 across), on the crease just above the top row of pots. */
export const FOLD_RADIUS = 52;
export function foldButtonPlace(w: number, h: number): Pt {
  const top = Math.min(...potLayout(7, w, h).pots.map((p) => p.y));
  return { x: w / 2, y: top - 126 };
}

/** Where the ghost finger paints on a fold page: the left half only, clear of the crease and the fold button, so the print makes the right. */
export function foldScribbleArea(w: number, h: number) {
  const a = scribbleArea(w, h);
  const right = w / 2 - FOLD_RADIUS - BRUSH_RADIUS - 8;
  return { ...a, w: Math.max(120, right - a.x) };
}
