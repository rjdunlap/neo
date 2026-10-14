import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export const LEVELS: BandLevels = { grownup: { min: 1, max: 3 } };
export const PLANS = [
  { side: 3, name: 'Find 1 to 9 on nine shuffled stones' },
  { side: 4, name: 'Find 1 to 16 on sixteen shuffled stones' },
  { side: 5, name: 'Find 1 to 25 on twenty-five shuffled stones' },
] as const;
export const planFor = (level: number) => PLANS[Math.min(3, Math.max(1, Math.floor(level))) - 1];
export const makeBoard = (level: number, rng: Rng): number[] =>
  rng.shuffle(Array.from({ length: planFor(level).side ** 2 }, (_, i) => i + 1));
export type Verdict = 'right' | 'wrong' | 'done';
export const judge = (value: number, next: number): Verdict => value < next ? 'done' : value === next ? 'right' : 'wrong';
export const hintIndex = (board: readonly number[], next: number) => board.indexOf(next);

/** A fixed-size board keeps every stone at least 100 units across, including in portrait. */
export function layoutFor(w: number, h: number, side: number) {
  const size = 100, gap = 12, width = side * (size + gap) - gap;
  const top = 182 + Math.max(0, h - 768) * 0.3;
  return {
    size, top,
    stones: Array.from({ length: side ** 2 }, (_, i) => ({
      x: w / 2 - width / 2 + size / 2 + i % side * (size + gap),
      y: top + size / 2 + Math.floor(i / side) * (size + gap),
    })),
    hint: { x: w - 108, y: h - 100 },
  };
}
