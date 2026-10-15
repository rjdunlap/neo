import type { Rng } from '../../engine/random';

/** Cosmetic draws must never consume the question generator's stream. */
export function gardenTreatment(rng: Rng) {
  return rng.clone().int(0, 2);
}

/** Return beneath the seven records, clear of their full-size replay targets. */
export function wrapPath(w: number) {
  const left = w / 2 - 354, right = w / 2 + 354;
  return [
    { x: right, y: 340 }, { x: right, y: 371 },
    { x: left, y: 371 }, { x: left, y: 340 },
  ];
}
