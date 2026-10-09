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

/** The little song the ghost finger plays in free play: the scale climbing and coming back, so every note is the jelly next door. */
export const FREE_SONG = [0, 1, 2, 3, 4, 3, 2, 1];

/** The jelly for the `n`th note of free play (counting from 0), looping the song. */
export const freeNote = (n: number): number => FREE_SONG[((n % FREE_SONG.length) + FREE_SONG.length) % FREE_SONG.length];

/** Where a round is: free play is all `play`; a tune round listens (`play` before the first tune, then `listen`) and takes a `turn`. */
export type JellyPhase = 'play' | 'listen' | 'turn' | 'done';

/**
 * The jelly a capable child taps next, or null while she should wait. In free play she plays the song. In a tune round
 * she waits through the first pause and the tune itself (a tap then is only music, but it is not her answer) and then
 * taps the tune in order.
 */
export function jellyToTap(mode: JellyPlan['mode'], phase: JellyPhase, tune: readonly number[], at: number, notes: number): number | null {
  if (mode === 'free') return phase === 'play' ? freeNote(notes) : null;
  return phase === 'turn' ? (tune[at] ?? null) : null;
}
