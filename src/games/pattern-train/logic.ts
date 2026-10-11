import type { ColorName } from '../../art/palette';
import type { ShapeKind } from '../../art/shapes';
import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';

export interface PatternPlan {
  /** The repeating unit, as symbol slots (0, 1, 2). */
  pattern: number[];
  kind: 'shape' | 'animal' | 'bell' | 'pair' | 'number';
  /** The empty car is in the first repeat (a missing middle) rather than at the end. */
  missing?: boolean;
  /** Two empty cars at the end. */
  two?: boolean;
  /** The train rolls into a tunnel after two repeats; the car that comes out is the empty one. */
  tunnel?: boolean;
  /** The question is which car is wrong, not what comes next: one extra car crept in (`extra`), or one car was swapped (`swap`, then she picks the piece that belongs). */
  odd?: 'extra' | 'swap';
  /** The question is about the structure of the pattern, shown as a model above the answer: pick the row that repeats the same way (`row`), or build the same pattern in other pieces (`build`). */
  match?: 'row' | 'build';
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
  { pattern: [0, 1, 2], kind: 'shape', tunnel: true, name: 'Count the cars in the tunnel' },
  { pattern: [0, 1, 2, 3], kind: 'pair', name: 'Color and shape on their own cycles' },
  { pattern: [], kind: 'number', numberSteps: [2, 5, 10], name: 'Count numbered cars by 2, 5, or 10' },
  { pattern: [0, 1], kind: 'shape', odd: 'extra', name: 'Find the car that does not belong' },
  { pattern: [0, 1, 2], kind: 'shape', odd: 'swap', name: 'Find the wrong car and fix the train' },
  { pattern: [0, 0, 1], kind: 'shape', match: 'row', name: 'Find the row with the same pattern in new pieces' },
  { pattern: [0, 0, 1], kind: 'shape', match: 'build', name: 'Build the same pattern in new pieces' },
];

export const patternPlan = (level: number) => PATTERN_PLANS[Math.max(0, Math.min(PATTERN_PLANS.length - 1, level - 1))];

/** Choices under the train: one of each symbol, so every answer is on offer. */
export const CHOICES = 3;
/** What a round's three pieces are made of, so the same pattern comes in different things. Shape levels draw one of these. */
export const SHAPE_FAMILIES = ['shapes', 'fruit', 'flowers'] as const;
export type ShapeFamily = (typeof SHAPE_FAMILIES)[number];
/** Animal levels draw one of these trios; each trio is three different animals with their own voices. */
export const ANIMAL_TRIOS: readonly (readonly [CritterName, CritterName, CritterName])[] = [
  ['cat', 'cow', 'duck'],
  ['pig', 'dog', 'bunny'],
  ['bear', 'cat', 'pig'],
  ['duck', 'dog', 'cow'],
];

/** The tunnel hides this many cars, so the car that comes out is `hidden mod unit` places on from the first. */
export const TUNNEL_HIDDEN = { min: 4, max: 7 } as const;

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
 * A tunnel train: two full repeats, then the tunnel hides 4 to 7 more cars, then the empty car rolls out. The car is the
 * repeat's place `(6 + hidden) mod unit`, so she counts the hidden cars and jumps whole units; it is the car just before
 * the tunnel in only one round of four. The cars shown are the first six; the tunnel is not a car in `sequence`.
 */
function tunnelTrain(plan: PatternPlan, rng: Rng): { sequence: number[]; targets: number[]; choices: number[][]; hidden: number } {
  const tokens = rng.shuffle([0, 1, 2]);
  const unit = plan.pattern.length;
  const hidden = rng.int(TUNNEL_HIDDEN.min, TUNNEL_HIDDEN.max);
  const sequence = Array.from({ length: unit * 2 + 1 }, (_, i) => tokens[plan.pattern[(i < unit * 2 ? i : unit * 2 + hidden) % unit]]);
  return { sequence, targets: [sequence.length - 1], choices: [[0, 1, 2]], hidden };
}

/**
 * A train for one round: the symbols on each car, and which cars start empty. The pattern shows two full repeats, then
 * the train runs on part of the way into the next one (`phase` cars) before the empty car, so the car to fill can be any
 * place in the repeat rather than always a copy of the first car. Level 6's gap sits anywhere but the very start of a
 * repeat. The tunnel level (10) shows six cars, then the tunnel, then the empty car. Choices are the three pieces in a fixed order (the bells sound by their place), so every
 * piece on the train is on offer, the near misses included.
 */
export function buildTrain(plan: PatternPlan, rng: Rng): { sequence: number[]; targets: number[]; choices: number[][]; look?: PairLook; hidden?: number; family?: number; shown?: number[] } {
  if (plan.numberSteps) return numberTrain(plan.numberSteps, rng);
  if (plan.kind === 'pair') return pairTrain(rng);
  const train = plan.odd ? oddTrain(plan, rng) : plan.tunnel ? tunnelTrain(plan, rng) : plainTrain(plan, rng);
  // Drawn last, so the cars and gaps of a seed do not depend on what they are made of.
  const family = plan.kind === 'shape' ? rng.int(0, SHAPE_FAMILIES.length - 1) : plan.kind === 'animal' ? rng.int(0, ANIMAL_TRIOS.length - 1) : undefined;
  return { ...train, family };
}

/** A spot-the-mistake train's length: three repeats of an ABC unit fill nine cars. */
export const ODD_CARS = { extra: 7, swap: 9 } as const;

/**
 * A train with a mistake in it. `extra`: three repeats of AB with the third piece slipped in somewhere in the middle (seven
 * cars); it shows once, so it is the only car that does not belong, and taking it out leaves a perfect pattern. `swap`: nine
 * cars of ABC with one car showing a wrong piece (`shown`), while `sequence` keeps the car that belongs there; the other
 * eight cars show each place of the unit at least twice, so the fix is certain. `targets` is the car to find.
 */
function oddTrain(plan: PatternPlan, rng: Rng): { sequence: number[]; targets: number[]; choices: number[][]; shown?: number[] } {
  const tokens = rng.shuffle([0, 1, 2]);
  const unit = plan.pattern.length;
  if (plan.odd === 'extra') {
    const sequence = Array.from({ length: unit * 3 }, (_, i) => tokens[plan.pattern[i % unit]]);
    const at = rng.int(1, sequence.length - 1);
    sequence.splice(at, 0, tokens[2]);
    return { sequence, targets: [at], choices: [[0, 1, 2]] };
  }
  const sequence = Array.from({ length: ODD_CARS.swap }, (_, i) => tokens[plan.pattern[i % unit]]);
  const at = rng.int(0, sequence.length - 1);
  const shown = sequence.slice();
  shown[at] = rng.pick([0, 1, 2].filter((p) => p !== sequence[at]));
  return { sequence, targets: [at], choices: [[0, 1, 2]], shown };
}

function plainTrain(plan: PatternPlan, rng: Rng): { sequence: number[]; targets: number[]; choices: number[][] } {
  const tokens = rng.shuffle([0, 1, 2]);
  const unit = plan.pattern.length;
  // Two empty cars may start at slot 0 or 1 (nine cars at most); a missing-middle train shows no extra cars.
  const phase = plan.missing ? 0 : rng.int(0, plan.two ? 1 : unit - 1);
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

/** The model's cars and every row's cars in the same-pattern levels. */
export const MATCH_CARS = 6;
/** The units a model can repeat (each divides six cars); a row shares its model's unit only when it is the answer. */
export const MATCH_UNITS: readonly (readonly number[])[] = [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2]];

/** A train's structure with the pieces forgotten: each piece renamed by when it first shows (so cat, cat, cow and A, A, B agree). */
export function structure(cars: readonly number[]): string {
  const seen: number[] = [];
  return cars.map((c) => { if (!seen.includes(c)) seen.push(c); return seen.indexOf(c); }).join('');
}

/**
 * Which pieces may go in the next car of a build: one that is the same as an earlier car exactly where the model's cars are
 * the same, and different exactly where they differ. Any animals that keep the model's structure are right, not one fixed
 * assignment, and some piece always fits (at most three roles, three pieces).
 */
export function validPieces(model: readonly number[], placed: readonly number[]): number[] {
  const k = placed.length;
  return [0, 1, 2].filter((p) => placed.every((q, j) => (model[j] === model[k]) === (q === p)));
}

export interface MatchRound {
  /** The model's cars, as pieces 0–2 of the model's own kind (shapes). */
  model: number[];
  /** Level 15: three rows of animal pieces (0–2); `answer` is the row that repeats the model's way. */
  rows: number[][];
  answer: number;
  /** Which animal trio the rows and the tray use. */
  trio: number;
}

/** One train of a unit, its pieces renamed by a shuffle so no two rows or the model share their assignment. */
const cars = (unit: readonly number[], rng: Rng): number[] => {
  const names = rng.shuffle([0, 1, 2]);
  return Array.from({ length: MATCH_CARS }, (_, i) => names[unit[i % unit.length]]);
};

/**
 * The same-pattern levels: a model (shapes) and, for the row level, three rows of animals of which exactly one repeats the
 * model's way; the others repeat other units, so each is a near miss in structure.
 */
export function buildMatch(rng: Rng): MatchRound {
  const unit = rng.pick(MATCH_UNITS);
  const others = rng.shuffle(MATCH_UNITS.filter((u) => u !== unit)).slice(0, 2);
  const options = rng.shuffle([unit, ...others]);
  return { model: cars(unit, rng), rows: options.map((u) => cars(u, rng)), answer: options.indexOf(unit), trio: rng.int(0, ANIMAL_TRIOS.length - 1) };
}
