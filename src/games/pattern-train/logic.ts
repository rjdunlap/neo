import type { ColorName } from '../../art/palette';
import type { ShapeKind } from '../../art/shapes';
import type { Rng } from '../../engine/random';

export interface PatternPlan {
  /** The repeating unit, as symbol slots (0, 1, 2). */
  pattern: number[];
  kind: 'shape' | 'animal' | 'bell' | 'pair' | 'number';
  /** The empty car is in the first repeat (a missing middle) rather than at the end. */
  missing?: boolean;
  /** Two empty cars at the end. */
  two?: boolean;
  /** The question is after two complete repeats, rather than simply the next car. */
  far?: boolean;
  /** A numbered train counts by one of these amounts. */
  numberSteps?: readonly number[];
  name: string;
}

export const PATTERN_PLANS: PatternPlan[] = [
  { pattern: [0, 1], kind: 'shape', name: 'AB: alternate two shapes' },
  { pattern: [0, 0, 1], kind: 'shape', name: 'AAB: two of one, then another' },
  { pattern: [0, 1, 1], kind: 'shape', name: 'ABB: one, then two of another' },
  { pattern: [0, 1, 2], kind: 'shape', name: 'ABC: repeat three shapes' },
  { pattern: [0, 1], kind: 'animal', name: 'Continue a pattern of animals' },
  { pattern: [0, 1, 2], kind: 'animal', missing: true, name: 'Find the missing car in the middle' },
  { pattern: [0, 1], kind: 'bell', name: 'Listen and continue two bell notes' },
  { pattern: [0, 1, 2], kind: 'bell', name: 'Listen and continue three bell notes' },
  { pattern: [0, 0, 1], kind: 'shape', two: true, name: 'Fill two cars in an AAB pattern' },
  { pattern: [0, 1, 2], kind: 'shape', far: true, name: 'Find the seventh car from two repeats' },
  { pattern: [0, 1, 2, 3], kind: 'pair', name: 'Color and shape on their own cycles' },
  { pattern: [], kind: 'number', numberSteps: [2, 5, 10], name: 'Count numbered cars by 2, 5, or 10' },
];

export const patternPlan = (level: number) => PATTERN_PLANS[Math.max(0, Math.min(PATTERN_PLANS.length - 1, level - 1))];

/** Choices under the train: one of each symbol, so every answer is on offer. */
export const CHOICES = 3;
/** A color-and-shape train offers all four pieces of its two colors and two shapes. */
export const PAIR_CHOICES = 4;
/** A color-and-shape train's cars: two full repeats of four and the car to fill. */
export const PAIR_CARS = 9;

const PAIR_COLORS: readonly ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple'];
const PAIR_SHAPES: readonly ShapeKind[] = ['circle', 'triangle', 'square'];

/** A color-and-shape piece is 0–3: the color is `piece % 2` (a cycle of two), the shape `floor(piece / 2)` (a cycle of two, held for two cars). */
export const pieceColor = (piece: number) => piece % 2;
export const pieceShape = (piece: number) => Math.floor(piece / 2);
/** What a color-and-shape train looks like this round. */
export interface PairLook { colors: [ColorName, ColorName]; shapes: [ShapeKind, ShapeKind] }

/** The highest number a numbered train shows, so every car reads as a number she counts with. */
export const NUMBER_TOP = 100;
/** A numbered train's length. */
export const NUMBER_CARS = 7;

/**
 * A numbered train: it starts at a multiple of the step that is not the step itself (12, 14, 16… by twos), the empty car
 * can sit anywhere after the first two, and the two wrong numbers are drawn from the near misses (one step back, one step
 * on, one off), so the answer is not always the smallest choice and is found by counting.
 */
function numberTrain(steps: readonly number[], rng: Rng): { sequence: number[]; targets: number[]; choices: number[][] } {
  const step = rng.pick(steps);
  const highest = Math.floor((NUMBER_TOP - step * (NUMBER_CARS - 1)) / step);
  const start = step * rng.int(2, highest);
  const sequence = Array.from({ length: NUMBER_CARS }, (_, i) => start + step * i);
  const target = rng.int(2, NUMBER_CARS - 1);
  const answer = sequence[target];
  const near = [answer - step, answer + step, answer - 1, answer + 1].filter((n) => n > 0 && n <= NUMBER_TOP);
  const wrong = rng.shuffle(near).slice(0, CHOICES - 1);
  return { sequence, targets: [target], choices: [rng.shuffle([answer, ...wrong])] };
}

/**
 * A color-and-shape train: the color alternates (a cycle of two) while the shape changes every second car (a cycle of two
 * held for two), so the pair repeats every four cars and neither attribute explains the other. Eight cars show and the ninth
 * place can be anywhere after the first, so a car four places away always shows the answer. The four choices are every
 * combination of the two colors and two shapes: the answer, the right color in the wrong shape, the right shape in the wrong
 * color, and neither, in a shuffled order.
 */
function pairTrain(rng: Rng): { sequence: number[]; targets: number[]; choices: number[][]; look: PairLook } {
  const start = rng.int(0, 3);
  const sequence = Array.from({ length: PAIR_CARS }, (_, i) => (start + i) % 4);
  const look: PairLook = { colors: rng.shuffle([...PAIR_COLORS]).slice(0, 2) as [ColorName, ColorName], shapes: rng.shuffle([...PAIR_SHAPES]).slice(0, 2) as [ShapeKind, ShapeKind] };
  return { sequence, targets: [rng.int(1, PAIR_CARS - 1)], choices: [rng.shuffle([0, 1, 2, 3])], look };
}

/**
 * A train for one round: the symbols on each car, and which cars start empty. The pattern shows two full repeats, then
 * the train runs on part of the way into the next one (`phase` cars) before the empty car, so the car to fill can be any
 * place in the repeat rather than always a copy of the first car. Level 6's gap sits anywhere but the very start of a
 * repeat. The far level (10) keeps a seven-car train with the seventh car empty until it is rebuilt; its
 * line names the seventh car. Choices are the three pieces in a fixed order (the bells sound by their place), so every
 * piece on the train is on offer, the near misses included.
 */
export function buildTrain(plan: PatternPlan, rng: Rng): { sequence: number[]; targets: number[]; choices: number[][]; look?: PairLook } {
  if (plan.numberSteps) return numberTrain(plan.numberSteps, rng);
  if (plan.kind === 'pair') return pairTrain(rng);
  const tokens = rng.shuffle([0, 1, 2]);
  const unit = plan.pattern.length;
  // Two empty cars may start at slot 0 or 1 (nine cars at most); a far or missing-middle train shows no extra cars.
  const phase = plan.far || plan.missing ? 0 : rng.int(0, plan.two ? 1 : unit - 1);
  const length = unit * 2 + phase + (plan.two ? 2 : 1);
  const sequence = Array.from({ length }, (_, i) => tokens[plan.pattern[i % unit]]);
  let targets: number[];
  if (plan.two) targets = [length - 2, length - 1];
  else if (plan.missing) targets = [rng.int(0, 1) * unit + rng.int(1, unit - 1)];
  else targets = [length - 1];
  return { sequence, targets, choices: targets.map(() => [0, 1, 2]) };
}

/**
 * The choice that fills the car being asked for (the couch bot and the how-to card's ghost finger): the symbol the pattern
 * puts there. Always one of the `CHOICES` on offer.
 */
export const wantedChoice = (sequence: readonly number[], targets: readonly number[], choices: readonly (readonly number[])[], target: number): number => choices[target].indexOf(sequence[targets[target]]);
