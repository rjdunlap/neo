import { stepFromUnit } from '../../audio/notes';
import type { Rng } from '../../engine/random';

export const PITCH_FROM = 2;
export const PITCH_COUNT = 6;
/** Height increases upward; the same snapped step drives both position and sound. */
export const pitchAt = (y: number, top: number, bottom: number) => stepFromUnit(1 - (y - top) / (bottom - top), PITCH_FROM, PITCH_COUNT);
export const pitchY = (step: number, top: number, bottom: number) => bottom - (step - PITCH_FROM + 0.5) / PITCH_COUNT * (bottom - top);
export const directions = (notes: readonly number[]) => notes.slice(1).map((n, i) => Math.sign(n - notes[i]));
export const matchesShape = (target: readonly number[], notes: readonly number[]) => notes.length === target.length && directions(target).every((d, i) => d === directions(notes)[i]);
/** Always start with two-note up/down, then introduce three-note contours. */
export function makeShapes(rng: Rng): number[][] {
  return [[2, 5], [6, 3], ...rng.shuffle([[2, 4, 6], [7, 5, 2], [2, 6, 3], [7, 3, 5]])];
}
/** A useful next step from any starting note, including a boundary that requires restarting. */
export function shapeHint(target: readonly number[], notes: readonly number[]): number[] {
  const steps = Array.from({ length: PITCH_COUNT }, (_, i) => i + PITCH_FROM);
  const dirs = directions(target);
  const canFinish = (last: number, at: number): boolean => at >= dirs.length || steps.some((next) => Math.sign(next - last) === dirs[at] && canFinish(next, at + 1));
  return steps.filter((step) => (!notes.length || Math.sign(step - notes[notes.length - 1]) === dirs[notes.length - 1]) && canFinish(step, notes.length));
}
