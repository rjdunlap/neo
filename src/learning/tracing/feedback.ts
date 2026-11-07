import type { Point } from './strokes';
import type { Rng } from '../../engine/random';

/** Include the corridor boundary despite coordinate round-off after a scaled drag. */
export function offTrail(point: Point, checkpoint: Point, tolerance: number): boolean {
  return Math.hypot(point[0] - checkpoint[0], point[1] - checkpoint[1]) > tolerance * 2 + 1e-9;
}

/** The second wandering drag on one stroke is the hint: the ring lights and the firefly shows the way once. */
export const HINT_AFTER = 2;
export const hintDue = (wrong: number): boolean => wrong === HINT_AFTER;

/** How far the firefly flies by itself when it shows the way: the next stretch of trail, a few checkpoints long. */
export const SHOW_SPAN = 12;

/** The checkpoints the firefly flies through when it shows the way, from where she is to the next stretch's end. */
export function showTheWay(points: readonly Point[], progress: number, span = SHOW_SPAN): Point[] {
  return points.slice(progress, Math.min(points.length, progress + span + 1));
}

/** Where a stroke's start arrow sits and which way it points: at the first point, along the first stretch of trail. */
export function startArrow(points: readonly Point[]): { at: Point; angle: number } {
  const a = points[0];
  const b = points.find((p) => Math.hypot(p[0] - a[0], p[1] - a[1]) >= 0.05) ?? points[points.length - 1];
  return { at: a, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}

/** Which fifth of the stroke she has reached (0–4): the firefly's note climbs one pentatonic step for each. */
export function tuneStep(progress: number, length: number): number {
  return length <= 1 ? 4 : Math.min(4, Math.floor((progress / (length - 1)) * 5));
}

/** The ink a round draws with. A look is only paint: it never moves a checkpoint or widens the trail. */
export const LOOKS = ['teal', 'rainbow', 'glitter', 'sand'] as const;
export type Look = (typeof LOOKS)[number];
export const pickLook = (rng: Rng): Look => rng.pick([...LOOKS]);
