import type { Rng } from '../../engine/random';

/**
 * Beat Builder, after Chrome Music Lab's rhythm toys: a grid of beats. Each row is an instrument
 * (drum, clap, bell); each column is a step the playhead visits in a loop. Tap a square to turn
 * that sound on. First free play, then copying a beat you can see, then copying one by ear, then
 * making a pattern repeat (the second half matches the first), then a longer beat by ear.
 */
export type BeatMode = 'free' | 'see' | 'hear' | 'repeat';

export interface BeatPlan {
  mode: BeatMode;
  steps: 4 | 8;
  rows: 2 | 3;
  /** Beats to copy or finish; free play has one. */
  beats: number;
  name: string;
}

export const PLANS: BeatPlan[] = [
  { mode: 'free', steps: 4, rows: 2, beats: 1, name: 'Make any beat with drum and clap; it plays round and round' },
  { mode: 'see', steps: 4, rows: 2, beats: 3, name: 'Copy a beat you can see: fill the faint squares' },
  { mode: 'hear', steps: 4, rows: 2, beats: 3, name: 'Copy a beat by ear: listen, build it, then check' },
  { mode: 'repeat', steps: 8, rows: 2, beats: 2, name: 'Make the pattern repeat: the second half matches the first' },
  { mode: 'hear', steps: 8, rows: 3, beats: 2, name: 'A longer beat by ear, with drum, clap and bell' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** A beat: rows × steps of on/off. */
export type Beat = boolean[][];

export const empty = (rows: number, steps: number): Beat => Array.from({ length: rows }, () => Array<boolean>(steps).fill(false));

/**
 * A beat to copy: the drum always starts the bar, each row has one to three hits, and no step is
 * crowded with every instrument at once. On repeat levels the second half copies the first.
 */
export function makeBeat(plan: BeatPlan, rng: Rng): Beat {
  for (;;) {
    const half = plan.mode === 'repeat' ? plan.steps / 2 : plan.steps;
    const beat = empty(plan.rows, plan.steps);
    for (let r = 0; r < plan.rows; r++) {
      const hits = rng.int(1, Math.min(3, half - 1));
      for (const s of rng.shuffle(Array.from({ length: half }, (_, i) => i)).slice(0, hits)) beat[r][s] = true;
    }
    beat[0][0] = true;
    if (plan.mode === 'repeat') for (let r = 0; r < plan.rows; r++) for (let s = 0; s < half; s++) beat[r][s + half] = beat[r][s];
    const crowded = Array.from({ length: plan.steps }, (_, s) => beat.every((row) => row[s])).some(Boolean);
    if (!crowded || plan.rows < 3) return beat;
  }
}

/** On repeat levels, the first half is given; the child fills the second. */
export const givenStep = (plan: BeatPlan, step: number) => plan.mode === 'repeat' && step < plan.steps / 2;

export const same = (a: Beat, b: Beat) => a.every((row, r) => row.every((on, s) => on === b[r][s]));

/** Steps where the child's beat differs from the target: for the hint. */
export const differences = (target: Beat, have: Beat) =>
  Array.from({ length: target[0].length }, (_, s) => s).filter((s) => target.some((row, r) => row[s] !== have[r][s]));

/** How many squares are on: free play finishes once the beat has a few sounds. */
export const hits = (b: Beat) => b.flat().filter(Boolean).length;
