import type { RoundRecord } from './save';

export interface LevelRange {
  min: number;
  max: number;
}

/** Few mistakes and no hints. */
export const isSmooth = (r: RoundRecord) => r.misses <= 1 && r.hints === 0;
/** Lots of mistakes or leaning on hints. */
export const isStruggle = (r: RoundRecord) => r.misses >= 4 || r.hints >= 2;

const clamp = (level: number, range: LevelRange) => Math.min(range.max, Math.max(range.min, level));

/**
 * Two smooth rounds in a row at the current level step up; two struggling rounds step down.
 * The child never sees a level number, and the range comes from her age band.
 */
export function nextLevel(level: number, history: RoundRecord[], range: LevelRange): number {
  const current = clamp(level, range);
  const lastTwo = history.slice(-2);
  if (lastTwo.length < 2 || !lastTwo.every((r) => r.level === current)) return current;
  if (lastTwo.every(isSmooth)) return clamp(current + 1, range);
  if (lastTwo.every(isStruggle)) return clamp(current - 1, range);
  return current;
}
