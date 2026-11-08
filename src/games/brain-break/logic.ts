import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export const LEVELS: BandLevels = { grownup: { min: 1, max: 6 } };
export const PLANS = [
  { side: 3, name: 'Find 1 to 9 on nine shuffled stones' },
  { side: 4, name: 'Find 1 to 16 on sixteen shuffled stones' },
  { side: 5, name: 'Find 1 to 25 on twenty-five shuffled stones' },
  { side: 3, name: 'Find the sums that make 1 to 9, in order' },
  { side: 4, name: 'Find the sums that make 1 to 16, in order' },
  { side: 5, name: 'Find sums and take-aways that make 1 to 25, in order' },
] as const;
export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, Math.floor(level))) - 1];
/** Levels 4–6 show a sum (from 6, a sum or a take-away) on each stone instead of its number. */
export const showsSums = (level: number) => Math.floor(level) >= 4;
export const makeBoard = (level: number, rng: Rng): number[] =>
  rng.shuffle(Array.from({ length: planFor(level).side ** 2 }, (_, i) => i + 1));
export type Verdict = 'right' | 'wrong' | 'done';
export const judge = (value: number, next: number): Verdict =>
  value < next ? 'done' : value === next ? 'right' : 'wrong';
export const hintIndex = (board: readonly number[], next: number) => board.indexOf(next);

export const MINUS = '−';
/** Most a take-away may start from, and the most either side may add or take away. */
export const TAKE_FROM_MAX = 30,
  STEP_MAX = 9,
  KIND_MIN = 10;

function sumLabel(total: number, rng: Rng): string {
  if (total === 1) return '1+0';
  const b = rng.int(1, Math.min(STEP_MAX, total - 1)),
    a = total - b;
  return rng.chance(0.5) ? `${a}+${b}` : `${b}+${a}`;
}
const takeLabel = (total: number, rng: Rng) => {
  const b = rng.int(1, Math.min(STEP_MAX, TAKE_FROM_MAX - total));
  return `${total + b}${MINUS}${b}`;
};

/** Each stone's label, in board order: its number at levels 1–3, a sum or take-away that makes it from level 4. */
export function makeLabels(board: readonly number[], level: number, rng: Rng): string[] {
  if (!showsSums(level)) return board.map(String);
  const takes =
    Math.floor(level) >= 6
      ? rng.shuffle(board.map((_, i) => (i < KIND_MIN ? true : i < 2 * KIND_MIN ? false : rng.chance(0.5))))
      : board.map(() => false);
  return board.map((total, i) => (takes[i] ? takeLabel(total, rng) : sumLabel(total, rng)));
}

/** What a stone's label makes: its number, or its sum or take-away worked out. */
export function evaluate(text: string): number {
  const m = /^(\d+)([+−])(\d+)$/.exec(text);
  if (!m) return Number(text);
  return m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
}

/** A fixed-size board keeps every stone at least 100 units across, including in portrait. */
export function layoutFor(w: number, h: number, side: number) {
  const size = 100,
    gap = 12,
    width = side * (size + gap) - gap;
  const top = 182 + Math.max(0, h - 768) * 0.3;
  return {
    size,
    top,
    stones: Array.from({ length: side ** 2 }, (_, i) => ({
      x: w / 2 - width / 2 + size / 2 + (i % side) * (size + gap),
      y: top + size / 2 + Math.floor(i / side) * (size + gap),
    })),
    hint: { x: w - 108, y: h - 100 },
  };
}
