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
  { pattern: [0, 1, 2], kind: 'pair', far: true, name: 'Follow color and shape together' },
  { pattern: [], kind: 'number', numberSteps: [2, 5, 10], name: 'Count numbered cars by 2, 5, or 10' },
];

export const patternPlan = (level: number) => PATTERN_PLANS[Math.max(0, Math.min(PATTERN_PLANS.length - 1, level - 1))];

/** Choices under the train: one of each symbol, so every answer is on offer. */
export const CHOICES = 3;

/**
 * A train for one round: the symbols on each car (the pattern repeated twice, plus the cars to fill),
 * and which cars start empty.
 */
export function buildTrain(plan: PatternPlan, rng: Rng): { sequence: number[]; targets: number[]; choices: number[][] } {
  if (plan.numberSteps) {
    const step = rng.pick(plan.numberSteps);
    const sequence = Array.from({ length: 7 }, (_, i) => step * (i + 1));
    const targets = [sequence.length - 1];
    return { sequence, targets, choices: [rng.shuffle([sequence[6], sequence[6] + step, sequence[6] + step * 2])] };
  }
  const tokens = rng.shuffle([0, 1, 2]);
  const length = plan.pattern.length * 2 + (plan.two ? 2 : 1);
  const sequence = Array.from({ length }, (_, i) => tokens[plan.pattern[i % plan.pattern.length]]);
  const targets = plan.two ? [length - 2, length - 1] : [plan.missing ? 2 : length - 1];
  return { sequence, targets, choices: targets.map(() => [0, 1, 2]) };
}

/**
 * The choice that fills the car being asked for (the couch bot and the how-to card's ghost finger): the symbol the pattern
 * puts there. Always one of the `CHOICES` on offer.
 */
export const wantedChoice = (sequence: readonly number[], targets: readonly number[], choices: readonly (readonly number[])[], target: number): number => choices[target].indexOf(sequence[targets[target]]);
