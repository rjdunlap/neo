import type { Point } from './strokes';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export const PLANS = [
  { letters: 'ILT', name: 'Follow straight strokes: I, L, T' },
  { letters: 'EFH', name: 'More straight strokes: E, F, H' },
  { letters: 'AKMNVWXYZ', name: 'Follow diagonal strokes' },
  { letters: 'CGOQSU', name: 'Follow rounded strokes' },
  { letters: 'BDJPR', name: 'Combine straight and rounded strokes' },
  { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', name: 'Explore all 26 capitals' },
  { letters: '', name: 'Trace a short word: CAT, DOG, or SUN' },
  { letters: '', name: 'Trace the child’s name in capitals' },
];
export const LEVELS: BandLevels = { preschool: { min: 1, max: 6 }, prek: { min: 3, max: 8 }, school: { min: 7, max: 8 } };


export const SHORT_WORDS = ['CAT', 'DOG', 'SUN'] as const;
export const STICKER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function trailLevel(level: number): number {
  return Math.max(1, Math.min(PLANS.length, Math.floor(level)));
}

export function nameLetters(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 40) || 'PIP';
}

export function trailWord(level: number, name: string, rng: Rng): string {
  const l = trailLevel(level);
  return l === 8 ? nameLetters(name) : l === 7 ? rng.pick(SHORT_WORDS) : rng.pick(PLANS[l - 1].letters.split(''));
}

export function trailTolerance(level: number): number {
  return trailLevel(level) <= 2 ? 0.095 : 0.075;
}

export function stickerLetter(seed: number): string {
  return STICKER_LETTERS[Math.floor(Math.abs(seed)) % STICKER_LETTERS.length];
}

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
