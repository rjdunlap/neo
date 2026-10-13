import type { Band } from './bands';
import type { RoundRecord } from './save';

export interface LevelRange {
  min: number;
  max: number;
  /**
   * The band's levels from easiest to hardest, when that is not simply min..max. It may leave IDs out (another band's
   * levels); min and max are then its lowest and highest ID. Saved levels, pins and stats keep their IDs; only
   * stepping up or down follows this order, and a saved level left out lands on the nearest listed ID.
   */
  order?: number[];
}

/** Every level ID in the range, easiest first. */
export const levelsInOrder = (range: LevelRange): number[] => {
  if (range.order) return range.order;
  const all: number[] = [];
  for (let l = range.min; l <= range.max; l++) all.push(l);
  return all;
};

/** Level ranges for the age bands a game supports; a game lists only those bands. */
export type BandLevels = Partial<Record<Band, LevelRange>>;

/** A supported band's range. The shell only asks for bands a game lists, so the fallback is never played. */
export const rangeFor = (table: BandLevels, band: Band): LevelRange => table[band] ?? { min: 1, max: 1 };

/** Few mistakes and no hints. */
export const isSmooth = (r: RoundRecord) => r.misses <= 1 && r.hints === 0;
/** Lots of mistakes or leaning on hints. */
export const isStruggle = (r: RoundRecord) => r.misses >= 4 || r.hints >= 2;

/** A level inside the range; one outside it lands on the nearest end of the order. */
const clamp = (level: number, range: LevelRange) => {
  if (!range.order) return Math.min(range.max, Math.max(range.min, level));
  if (level < range.min) return range.order[0];
  if (level > range.max) return range.order[range.order.length - 1];
  if (range.order.includes(level)) return level;
  return range.order.reduce((best, id) => {
    const d = Math.abs(id - level) - Math.abs(best - level);
    return d < 0 || (d === 0 && id < best) ? id : best;
  });
};

/** Move `delta` places along the range's order from an already-clamped level, stopping at either end. */
const move = (level: number, delta: number, range: LevelRange) => {
  const order = levelsInOrder(range);
  const at = order.indexOf(level);
  return order[Math.min(order.length - 1, Math.max(0, at + delta))];
};

/** One level up or down from `level`, held inside the range: what the how-to card's arrows do. */
export const stepLevel = (level: number, delta: number, range: LevelRange): number => move(clamp(level, range), delta, range);

/** The level the celebration's "next level" button plays: one above the level just played, or null at the top of the range. */
export const nextLevelOffer = (played: number, range: LevelRange): number | null => {
  const next = move(clamp(played, range), 1, range);
  return next === clamp(played, range) ? null : next;
};

/**
 * Two smooth rounds in a row at the current level step up; two struggling rounds step down.
 * The child never sees a level number, and the range comes from her age band.
 */
export function nextLevel(level: number, history: RoundRecord[], range: LevelRange): number {
  const current = clamp(level, range);
  const lastTwo = history.slice(-2);
  if (lastTwo.length < 2 || !lastTwo.every((r) => r.level === current)) return current;
  if (lastTwo.every(isSmooth)) return move(current, 1, range);
  if (lastTwo.every(isStruggle)) return move(current, -1, range);
  return current;
}
