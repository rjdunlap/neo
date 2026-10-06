import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';

/**
 * Animal Snack: farm friends and their favorite foods. Lap levels are cause and effect: tap an
 * animal and it munches its snack, or tap a snack and it floats to the animal who loves it. Then
 * "who eats the carrot?", giving each animal its food by dragging, and finally a number of snacks.
 */
export type SnackMode = 'munch' | 'float' | 'who' | 'match' | 'count';

export interface SnackPlan {
  mode: SnackMode;
  animals: number;
  /** Taps ('munch', 'float'), questions ('who', 'count') or foods to hand out ('match'). */
  rounds: number;
  name: string;
}

export const PLANS: SnackPlan[] = [
  { mode: 'munch', animals: 3, rounds: 6, name: 'Tap an animal: it says hello and munches its snack' },
  { mode: 'float', animals: 3, rounds: 6, name: 'Tap a snack: it floats to the animal who loves it' },
  { mode: 'who', animals: 3, rounds: 4, name: 'Who eats the carrot? Tap the animal' },
  { mode: 'match', animals: 3, rounds: 3, name: 'Drag each snack to the animal who eats it' },
  { mode: 'count', animals: 3, rounds: 3, name: 'Give an animal 2 to 4 of its snack, then ring the bell' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type Food = 'hay' | 'carrot' | 'bone' | 'fish' | 'seeds' | 'apple' | 'honey';

/** Who eats what: one food each, so every question has one answer. */
export const FAVORITE: Partial<Record<CritterName, Food>> = { cow: 'hay', bunny: 'carrot', dog: 'bone', cat: 'fish', duck: 'seeds', pig: 'apple', bear: 'honey' };
export const ANIMALS = Object.keys(FAVORITE) as CritterName[];
export const eaterOf = (food: Food) => ANIMALS.find((a) => FAVORITE[a] === food)!;

export interface SnackRound {
  animals: CritterName[];
  /** The animal asked about ('who', 'count'), or none. */
  ask?: CritterName;
  /** 'count': how many snacks. */
  n?: number;
}

/** Animals for each round, never asking about the same animal twice running. */
export function makeRounds(plan: SnackPlan, rng: Rng): SnackRound[] {
  const out: SnackRound[] = [];
  const many = plan.mode === 'munch' || plan.mode === 'float' || plan.mode === 'match';
  // Free play and matching keep one set of animals; questions pick new animals each time.
  const fixed = rng.shuffle([...ANIMALS]).slice(0, plan.animals);
  for (let i = 0; i < (many ? 1 : plan.rounds); i++) {
    if (many) {
      out.push({ animals: fixed });
      continue;
    }
    let animals: CritterName[];
    let ask: CritterName;
    do {
      animals = rng.shuffle([...ANIMALS]).slice(0, plan.animals);
      ask = rng.pick(animals);
    } while (ask === out.at(-1)?.ask);
    out.push({ animals, ask, n: plan.mode === 'count' ? rng.int(2, 4) : undefined });
  }
  return out;
}
