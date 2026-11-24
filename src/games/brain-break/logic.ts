import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export const LEVELS: BandLevels = { grownup: { min: 1, max: 12 } };
export const PLANS = [
  { side: 3, name: 'Find 1 to 9 on nine shuffled stones' },
  { side: 4, name: 'Find 1 to 16 on sixteen shuffled stones' },
  { side: 5, name: 'Find 1 to 25 on twenty-five shuffled stones' },
  { side: 3, name: 'Find the sums that make 1 to 9, in order' },
  { side: 4, name: 'Find the sums that make 1 to 16, in order' },
  { side: 5, name: 'Find sums and take-aways that make 1 to 25, in order' },
  { side: 4, name: 'Count by twos, threes, fives or tens' },
  { side: 5, name: 'Count by harder steps, up or back' },
  { side: 4, name: 'Any sixteen numbers, smallest first' },
  { side: 5, name: 'Numbers below zero, smallest first' },
  { side: 4, name: 'Two trails: 1, A, 2, B' },
  { side: 5, name: 'Two trails: 1, L, 2, K' },
] as const;
export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, Math.floor(level))) - 1];
/** Levels 4–6 show a sum (from 6, a sum or a take-away) on each stone instead of its number. */
export const showsSums = (level: number) => Math.floor(level) >= 4 && Math.floor(level) <= 6;
/** At levels 7–8 the sign names a counting rule and the stones show the numbers it makes. */
export const countsBy = (level: number) => level >= 7 && level < 9;
/** The steps a count-by round may use: level 7 the easy ones, level 8 the harder ones. */
export const STEPS: Record<number, readonly number[]> = { 7: [2, 3, 5, 10], 8: [4, 6, 7, 8, 9] };
/** A count-by round's rule: its step, its direction, and how many stones it fills. */
export interface Trail {
  step: number;
  back: boolean;
  n: number;
}
/** Drawn after the board, labels and look, so levels 1–6 give the same boards as before. */
export function makeTrail(level: number, rng: Rng): Trail {
  const l = Math.floor(level),
    n = planFor(l).side ** 2;
  return { step: rng.pick(STEPS[l] ?? STEPS[7]), back: l >= 8 && rng.chance(0.5), n };
}
/** The number rank `r` stands for: k, 2k … nk counting up, or nk … k counting back. */
export const trailValue = (t: Trail, rank: number) => t.step * (t.back ? t.n + 1 - rank : rank);
/** The rule sign: it names the rule and where to count from, never the answer. */
export const ruleSign = (t: Trail, next: number) => {
  const by = `Count ${t.back ? 'back ' : ''}by ${t.step}`;
  return next <= 1 ? `${by} · start at ${trailValue(t, 1)}` : `${by} · after ${trailValue(t, next - 1)}`;
};
/** At levels 9–10 the stones hold any different numbers and the order is smallest first (level 10 reaches below zero). */
export const sortsValues = (level: number) => level >= 9 && level < 11;
const MINUS_SIGN = '\u2212';
/** A number as written on a stone, with a true minus sign. */
export const writeNumber = (v: number) => (v < 0 ? `${MINUS_SIGN}${-v}` : String(v));
/** A number as spoken: "minus twelve" reads the sign aloud. */
export const speakNumber = (v: number) => (v < 0 ? `minus ${-v}` : String(v));
/**
 * The numbers a smallest-first round holds, smallest first: `values[r - 1]` is what rank `r` stands for.
 * Level 9: sixteen different numbers from 1 to 99 with one swapped-digit pair (37 and 73). Level 10: twenty-five different
 * whole numbers from -20 to 20, at least eight below zero and eight above, with one pair n and -n. Drawn after the board.
 */
export function makeValues(level: number, rng: Rng): number[] {
  const l = Math.floor(level),
    n = planFor(l).side ** 2;
  for (;;) {
    const pair: number[] = [];
    let pool: number[];
    if (l >= 10) {
      const k = rng.int(1, 20);
      pair.push(k, -k);
      pool = Array.from({ length: 41 }, (_, i) => i - 20);
    } else {
      const a = rng.int(1, 9),
        b = ((a + rng.int(0, 7)) % 9) + 1;
      pair.push(10 * a + b, 10 * b + a);
      pool = Array.from({ length: 99 }, (_, i) => i + 1);
    }
    const values = [...pair, ...rng.shuffle(pool.filter((v) => !pair.includes(v))).slice(0, n - 2)];
    if (l >= 10 && (values.filter((v) => v < 0).length < 8 || values.filter((v) => v > 0).length < 8))
      continue;
    if (new Set(values).size !== n) continue;
    return values.sort((x, y) => x - y);
  }
}
/** The sign for a smallest-first round: it names the rule and the last lit number, never the answer. */
export const orderSign = (values: readonly number[], next: number) =>
  next <= 1 ? 'Smallest first' : `After ${writeNumber(values[next - 2])}`;
export const twoTrails = (level: number) => level >= 11 && level < 13;
export const lettersBack = (level: number) => Math.floor(level) === 12;

/** What each rank stands for, alternating rising numbers with letters going up or back. */
export function alternatingLabels(level: number): string[] {
  const letters = lettersBack(level) ? 'LKJIHGFEDCBA' : 'ABCDEFGH';
  return Array.from({ length: planFor(level).side ** 2 }, (_, i) => {
    const pair = Math.floor(i / 2);
    return i % 2 === 0 ? String(pair + 1) : letters[pair];
  });
}

/** The sign keeps the last two stones in view and names the next trail. */
export function alternatingSign(labels: readonly string[], next: number): string {
  if (next === 1) return labels[1] === 'L' ? 'Numbers up · Letters back' : 'Numbers up · Letters up';
  const recent = labels.slice(Math.max(0, next - 3), next - 1).join(' · ');
  return `${recent} · ?   ${next % 2 === 0 ? 'Letters' : 'Numbers'}`;
}

export const makeBoard = (level: number, rng: Rng): number[] =>
  rng.shuffle(Array.from({ length: planFor(level).side ** 2 }, (_, i) => i + 1));
/** Board indexes in the order they are found: `trailOrder(board)[r - 1]` is the stone that holds rank `r`. */
export const trailOrder = (board: readonly number[]): number[] =>
  board.map((_, i) => i).sort((a, b) => board[a] - board[b]);
/** Three pond looks (sky, pond and stone colours from the palette), drawn once per round after the board so a look never changes a board. */
export const LOOKS = {
  day: { sky: 'blue', pond: 'teal', stone: 'teal' },
  dusk: { sky: 'purple', pond: 'blue', stone: 'yellow' },
  moss: { sky: 'green', pond: 'teal', stone: 'green' },
} as const;
export type Look = keyof typeof LOOKS;
export const pickLook = (rng: Rng): Look => rng.pick(Object.keys(LOOKS) as Look[]);
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

export function makeRound(level: number, rng: Rng) {
  const board = makeBoard(level, rng);
  let labels = makeLabels(board, level, rng);
  const look = pickLook(rng);
  const countBy = countsBy(level);
  const smallestFirst = sortsValues(level);
  // Levels 9–10 originally rolled a count-by rule before dealing their smallest-first values.
  const trail = countBy || smallestFirst ? makeTrail(level, rng) : null;
  const rule = countBy ? trail : null;
  const values = smallestFirst ? makeValues(level, rng) : null;
  const alternating = twoTrails(level) ? alternatingLabels(level) : null;
  if (rule) labels = board.map((rank) => String(trailValue(rule, rank)));
  else if (values) labels = board.map((rank) => writeNumber(values[rank - 1]));
  else if (alternating) labels = board.map((rank) => alternating[rank - 1]);
  return { board, labels, look, rule, values, alternating };
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
