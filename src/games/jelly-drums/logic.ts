import type { Rng } from '../../engine/random';

/** Jellies on the stage, biggest (lowest) first. */
export const JELLIES = 5;

export interface JellyPlan {
  mode: 'free' | 'echo';
  /** Notes to play (free) or tunes to copy (echo). */
  goal: number;
  /** Tune length (echo). */
  length: number;
}

export const PLANS: JellyPlan[] = [
  { mode: 'free', goal: 24, length: 0 },
  { mode: 'free', goal: 32, length: 0 },
  { mode: 'free', goal: 40, length: 0 },
  { mode: 'echo', goal: 4, length: 2 },
  { mode: 'echo', goal: 4, length: 3 },
  { mode: 'echo', goal: 5, length: 3 },
  { mode: 'echo', goal: 4, length: 4 },
  { mode: 'echo', goal: 5, length: 4 },
  { mode: 'echo', goal: 5, length: 5 },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/**
 * A tune to copy, as jelly indexes. Short tunes never repeat a jelly back to back, so each note
 * is a new place to tap; and no tune is one jelly over and over, so there is always a tune to hear.
 */
export function makeTune(rng: Rng, length: number): number[] {
  for (;;) {
    const tune: number[] = [];
    while (tune.length < length) {
      const i = rng.int(0, JELLIES - 1);
      if (tune.length && i === tune[tune.length - 1] && length <= 3) continue;
      tune.push(i);
    }
    if (length < 2 || new Set(tune).size > 1) return tune;
  }
}
