import type { Rng } from '../../engine/random';

/** Cosmetic draws must never consume the question generator's stream. */
export function gardenTreatment(rng: Rng) {
  return rng.clone().int(0, 2);
}
