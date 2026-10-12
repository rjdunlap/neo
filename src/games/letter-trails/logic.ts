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
