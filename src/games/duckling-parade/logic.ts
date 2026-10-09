import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Duckling Parade, after Neopets' Meerca Chase: walk Mama Duck around the meadow and her
 * ducklings fall in behind her. Nothing is ever lost; the ladder changes which ducklings
 * may join and how many belong in the pond.
 */
export type ParadeMode = 'tap' | 'walk' | 'count' | 'color' | 'colorCount' | 'pattern';

export interface ParadePlan {
  mode: ParadeMode;
  /** Ducklings out on the meadow. */
  ducklings: number;
  /** How many duckling colors are mixed in. */
  colors: number;
  /** count/colorCount: the range of how many to bring home. */
  min?: number;
  max?: number;
  /** pattern: the repeating unit length (AB or ABC). */
  unit?: number;
  name: string;
}

export const PLANS: ParadePlan[] = [
  { mode: 'tap', ducklings: 3, colors: 1, name: 'Tap to walk Mama Duck; ducklings join her line' },
  { mode: 'walk', ducklings: 4, colors: 1, name: 'Lead Mama Duck with a finger and bring every duckling to the pond' },
  { mode: 'count', ducklings: 6, colors: 1, min: 2, max: 3, name: 'Bring 2 or 3 ducklings home' },
  { mode: 'color', ducklings: 6, colors: 2, name: 'Find the ducklings of one color' },
  { mode: 'count', ducklings: 7, colors: 1, min: 3, max: 5, name: 'Bring 3 to 5 ducklings home' },
  { mode: 'colorCount', ducklings: 8, colors: 3, min: 2, max: 3, name: 'Bring 2 or 3 ducklings of one color home' },
  { mode: 'pattern', ducklings: 6, colors: 2, unit: 2, name: 'Make a color pattern: yellow, blue, yellow, blue' },
  { mode: 'pattern', ducklings: 6, colors: 3, unit: 3, name: 'Make a three-color pattern: red, blue, yellow, red, blue, yellow' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Duckling colors that read clearly against grass and water (not orange: it's the bill). */
export const DUCK_COLORS: ColorName[] = ['yellow', 'blue', 'pink', 'purple', 'red'];

export interface Round {
  /** Every duckling's color, in meadow order. */
  ducklings: ColorName[];
  /** color/colorCount: the color asked for. */
  want?: ColorName;
  /** count/colorCount: how many belong in the pond. */
  target?: number;
  /** pattern: the order the line should make. */
  pattern?: ColorName[];
}

export function makeRound(plan: ParadePlan, rng: Rng): Round {
  const palette = plan.colors === 1 ? ['yellow' as ColorName] : rng.shuffle([...DUCK_COLORS]).slice(0, plan.colors);
  const target = plan.min !== undefined ? rng.int(plan.min, plan.max ?? plan.min) : undefined;
  if (plan.mode === 'pattern') {
    const unit = palette.slice(0, plan.unit ?? 2);
    const pattern = Array.from({ length: plan.ducklings }, (_, i) => unit[i % unit.length]);
    return { ducklings: rng.shuffle([...pattern]), pattern };
  }
  if (plan.mode === 'color' || plan.mode === 'colorCount') {
    const want = palette[0];
    // Enough of the wanted color (always at least one spare for colorCount), the rest mixed.
    const wanted = plan.mode === 'color' ? Math.ceil(plan.ducklings / 2) : target! + 1;
    const others = palette.slice(1);
    const ducklings = [...Array(wanted).fill(want), ...Array.from({ length: plan.ducklings - wanted }, (_, i) => others[i % others.length])];
    return { ducklings: rng.shuffle(ducklings), want, target };
  }
  return { ducklings: Array(plan.ducklings).fill('yellow'), target };
}

export type JoinResult = 'join' | 'wrong-color' | 'wrong-next';

/** May a duckling of `color` join a line that already holds `line`? */
export function canJoin(plan: ParadePlan, round: Round, line: ColorName[], color: ColorName): JoinResult {
  if ((plan.mode === 'color' || plan.mode === 'colorCount') && color !== round.want) return 'wrong-color';
  if (plan.mode === 'pattern' && round.pattern![line.length] !== color) return 'wrong-next';
  return 'join';
}

/** The color the pattern needs next, given how many have already joined. */
export const nextInPattern = (round: Round, joined: number) => round.pattern?.[joined];

/**
 * Arriving at the pond with `bringing` ducklings when `home` are already swimming.
 * Returns how many swim in and how many hop back out because there are too many.
 */
export function arrive(round: Round, home: number, bringing: number): { swimIn: number; extra: number } {
  if (round.target === undefined) return { swimIn: bringing, extra: 0 };
  const room = Math.max(0, round.target - home);
  return { swimIn: Math.min(room, bringing), extra: Math.max(0, bringing - room) };
}

/** How many ducklings must end up in the pond to finish. */
export function needed(plan: ParadePlan, round: Round): number {
  if (round.target !== undefined) return round.target;
  if (plan.mode === 'color') return round.ducklings.filter((c) => c === round.want).length;
  return round.ducklings.length;
}

/** Whether the pond takes ducklings now. A pattern only goes home once it's complete. */
export function readyForPond(plan: ParadePlan, round: Round, line: number): boolean {
  if (line === 0) return false;
  if (plan.mode === 'pattern') return line === round.pattern!.length;
  return true;
}

export interface DemoDuckling {
  color: ColorName;
  /** Still waiting on the meadow (not in the line or the pond). */
  loose: boolean;
  x: number;
  y: number;
}

/**
 * Where a capable player leads Mama next: a waiting duckling (by its place in the list) or the pond. `via` is a waypoint to
 * go to first when the straight way is blocked (the finger taps it, then the next call goes on from there); `drag` says
 * the way to `via` (or to the stop) is clear, so a dragged finger may lead her; otherwise the finger taps the spot instead.
 */
export type ParadeStop = ({ to: 'duckling'; index: number } | { to: 'pond' }) & { drag: boolean; via?: { x: number; y: number } };

/** How close a finger may pass a duckling that must not join before the game takes it as aimed at that duckling, and how close Mama may pass one that would join. */
export const AIM_REACH = 108;
export const JOIN_REACH = 90;

type Pt = { x: number; y: number };

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Where the how-to card's ghost finger leads Mama next: the nearest waiting duckling that may join the line (one with a
 * clear way first), and once the line is what the round asks for, the pond. A way is clear when it passes no duckling that
 * must not join (the game counts a finger resting near one as "not me") and, when the round asks for an exact number or the
 * line is full, no spare that would join as an extra; when the straight way is not clear, a waypoint on the meadow that
 * makes both halves clear is looked for. Null when the line is complete but the pond would not take it yet, or when no
 * waiting duckling may join.
 */
export function nextStop(
  plan: ParadePlan,
  round: Round,
  line: readonly ColorName[],
  homeCount: number,
  ducklings: readonly DemoDuckling[],
  mama: Pt,
  pond: Pt,
  field = { x0: 60, x1: 964, y0: 277, y1: 728 },
): ParadeStop | null {
  const done = plan.mode === 'pattern' ? line.length === round.pattern!.length : homeCount + line.length >= needed(plan, round);
  // When the round asks for a number, a spare duckling that joins on the way is one too many (it hops back out as a miss); in a
  // pattern, one that joins on the way changes which color comes next, so the one being led to may stop being the right one.
  const exact = round.target !== undefined || plan.mode === 'pattern';
  const clear = (from: Pt, to: Pt, except: number) =>
    ducklings.every((d, i) => {
      if (!d.loose || i === except) return true;
      const gap = distToSegment(d, from, to);
      const joins = canJoin(plan, round, [...line], d.color) === 'join';
      // A duckling that would not join must not be aimed at; one that would join must not be passed when the count is exact or the line is full.
      return joins ? !(done || exact) || gap > JOIN_REACH + 4 : gap > AIM_REACH + 4;
    });
  /** The way to `dest`: straight if clear, else by the cheapest waypoint that makes both halves clear, else straight anyway. */
  const wayTo = (dest: Pt, except: number): { drag: boolean; via?: Pt } => {
    if (clear(mama, dest, except)) return { drag: true };
    let best: Pt | undefined;
    let bestLen = Infinity;
    for (let x = field.x0; x <= field.x1; x += 60) {
      for (let y = field.y0; y <= field.y1; y += 50) {
        const w = { x, y };
        const len = Math.hypot(w.x - mama.x, w.y - mama.y) + Math.hypot(w.x - dest.x, w.y - dest.y);
        if (len < bestLen && clear(mama, w, except) && clear(w, dest, except)) [best, bestLen] = [w, len];
      }
    }
    return best ? { drag: false, via: best } : { drag: false };
  };
  if (done) return readyForPond(plan, round, line.length) ? { to: 'pond', ...wayTo(pond, -1) } : null;
  let best: ParadeStop | null = null;
  let bestKey = Infinity;
  ducklings.forEach((d, index) => {
    if (!d.loose || canJoin(plan, round, [...line], d.color) !== 'join') return;
    const way = wayTo(d, index);
    // A clear way beats a nearer one that is not; then the nearest.
    const key = Math.hypot(d.x - mama.x, d.y - mama.y) + (way.drag ? 0 : way.via ? 1000 : 100000);
    if (key < bestKey) [best, bestKey] = [{ to: 'duckling', index, ...way }, key];
  });
  return best;
}
