import type { Rng } from '../../engine/random';

/**
 * Beat Builder, after Chrome Music Lab's rhythm toys: a grid of beats. Each row is an instrument
 * (drum, clap, bell); each column is a step the playhead visits in a loop. Tap a square to turn
 * that sound on. First free play, then copying a beat you can see, then copying one by ear, then
 * making a pattern repeat (the second half matches the first), then a longer beat by ear.
 */
export type BeatMode = 'free' | 'see' | 'hear' | 'repeat' | 'mend' | 'revise';

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
  { mode: 'mend', steps: 4, rows: 2, beats: 3, name: 'Mend the beat: one sound in your copy is missing or extra; fix it, then check' },
  { mode: 'revise', steps: 4, rows: 2, beats: 2, name: 'Keep the drum, change the claps: listen, then move the claps to match' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** A beat: rows × steps of on/off. */
export type Beat = boolean[][];

export const empty = (rows: number, steps: number): Beat => Array.from({ length: rows }, () => Array<boolean>(steps).fill(false));

/** Row identity is shared by pictures, playback and spoken support. */
export const INSTRUMENTS = [
  { id: 'drum', name: 'drum' },
  { id: 'clap', name: 'clap' },
  { id: 'bell', name: 'bell' },
] as const;

export interface BeatPhrase {
  readonly id: string;
  /** A short, speakable nickname, not a reading requirement. */
  readonly name: string;
  readonly score: readonly (readonly boolean[])[];
}

/** Authored on/off matrices: 1 sounds, 0 rests. */
const phrase = (id: string, name: string, rows: readonly string[]): BeatPhrase => ({
  id, name, score: rows.map((row) => [...row].map((cell) => cell === '1')),
});

export const SHORT_PHRASES: readonly BeatPhrase[] = [
  phrase('taking-turns', 'Taking turns', ['1010', '0101']),
  phrase('little-pause', 'Little pause', ['1001', '0010']),
  phrase('hello-clap', 'Hello clap', ['1000', '0100']),
  phrase('double-knock', 'Double knock', ['1100', '0001']),
  phrase('clap-answer', 'Clap answer', ['1000', '0011']),
  phrase('stepping-stones', 'Stepping stones', ['1010', '0001']),
  phrase('together-first', 'Together first', ['1001', '1100']),
  phrase('middle-meeting', 'Middle meeting', ['1010', '0110']),
  phrase('quiet-ending', 'Quiet ending', ['1100', '0010']),
  phrase('clap-sandwich', 'Clap sandwich', ['1000', '0110']),
  phrase('last-wave', 'Last wave', ['1001', '0101']),
  phrase('drum-walk', 'Drum walk', ['1110', '0001']),
];

export const LONG_PHRASES: readonly BeatPhrase[] = [
  phrase('bell-answer', 'Bell answer', ['10100010', '01000100', '00010001']),
  phrase('quiet-path', 'Quiet path', ['10001000', '00100010', '00000001']),
  phrase('two-hellos', 'Two hellos', ['11001000', '00010010', '00100001']),
  phrase('bell-in-between', 'Bell in between', ['10010010', '01000100', '00101000']),
  phrase('clap-gathering', 'Clap gathering', ['10001000', '01100001', '00010010']),
  phrase('drum-and-bell', 'Drum and bell', ['10100001', '00010100', '10001000']),
  phrase('soft-landing', 'Soft landing', ['10010000', '01001000', '00100010']),
  phrase('picnic-walk', 'Picnic walk', ['10001010', '00100100', '01000001']),
];

/** Each round draws distinct phrases once. Copies keep edits out of the library and other rounds.
 * This uses only the game's supplied target RNG; sticker art keeps its own seed/Rng.
 * Free play has no authored target and consumes no target randomness.
 */
export function roundPhrases(plan: BeatPlan, rng: Rng): { id: string; name: string; beat: Beat }[] {
  if (plan.mode === 'free') return [];
  const pool = plan.rows === 3 ? LONG_PHRASES : SHORT_PHRASES;
  return rng.shuffle([...pool]).slice(0, plan.beats).map((p) => ({
    id: p.id, name: p.name,
    beat: p.score.map((row) => plan.mode === 'repeat' ? [...row, ...row] : [...row]),
  }));
}

/**
 * The copy to mend: the model with exactly one square flipped. Rounds alternate a missing sound
 * (a hit turned off), an extra sound (a rest turned on) and a free pick, so both repairs come up.
 * Every model keeps at least one hit in the copy.
 */
export function mendCopy(model: Beat, round: number, rng: Rng): Beat {
  const cells = model.flatMap((row, r) => row.map((on, step) => ({ r, step, on })));
  const kind = round % 3 === 0 ? true : round % 3 === 1 ? false : undefined;
  const options = cells.filter((c) => (kind === undefined || c.on === kind) && (!c.on || hits(model) > 1));
  const pick = rng.pick(options);
  return model.map((row, r) => row.map((on, step) => (r === pick.r && step === pick.step ? !on : on)));
}

/** The first square where her beat differs from the model, for the spoken hint. */
export const firstMismatch = (target: Beat, have: Beat) => {
  for (let step = 0; step < target[0].length; step++)
    for (let row = 0; row < target.length; row++) if (target[row][step] !== have[row][step]) return { row, step };
  return null;
};

/**
 * Procedural source retained for future content; current copy rounds use roundPhrases.
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

/** A square she cannot change: the first half on repeat levels, the whole drum row when revising. */
export const givenCell = (plan: BeatPlan, row: number, step: number) => givenStep(plan, step) || (plan.mode === 'revise' && row === 0);

/**
 * The start of a revise round: the drum is as in the target; the claps are a different pattern that
 * needs at least one clap added and at least one taken away. Seeded.
 */
export function reviseStart(target: Beat, rng: Rng): Beat {
  const want = target[1];
  const options = Array.from({ length: 16 }, (_, n) => [0, 1, 2, 3].map((s) => ((n >> s) & 1) === 1)).filter((row) =>
    row.some((on, s) => on && !want[s]) && want.some((on, s) => on && !row[s]));
  const clap = rng.pick(options);
  return [[...target[0]], clap];
}

export const same = (a: Beat, b: Beat) => a.every((row, r) => row.every((on, s) => on === b[r][s]));

/** Steps where the child's beat differs from the target: for the hint. */
export const differences = (target: Beat, have: Beat) =>
  Array.from({ length: target[0].length }, (_, s) => s).filter((s) => target.some((row, r) => row[s] !== have[r][s]));

/** How many squares are on: free play finishes once the beat has a few sounds. */
export const hits = (b: Beat) => b.flat().filter(Boolean).length;

/** The beat the ghost finger makes in free play: boom, clap, boom, clap (four hits, so the check button comes). */
export function freeBeat(plan: BeatPlan): Beat {
  const beat = empty(plan.rows, plan.steps);
  for (let s = 0; s < plan.steps; s++) beat[s % 2][s] = true;
  return beat;
}

/** What a capable child does next: tap a square (`row`, `step`), press the green check, or null to wait. */
export type BeatMove = { row: number; step: number } | 'check';

/**
 * Her next move toward `goal` (the beat on show to copy, or the one she is making in free play): the first square that differs from the
 * goal and is hers to tap (never one of the squares given on repeat levels), always a right one.
 * When the beat is built, a level that asks her to check (by ear, or free play) presses the check once it is showing;
 * the levels that can see their beat finish by themselves.
 */
export function beatMove(plan: BeatPlan, goal: Beat, beat: Beat, checkShowing: boolean): BeatMove | null {
  for (let step = 0; step < plan.steps; step++)
    for (let row = 0; row < plan.rows; row++) if (goal[row][step] !== beat[row][step] && !givenCell(plan, row, step)) return { row, step };
  return (plan.mode === 'hear' || plan.mode === 'free' || plan.mode === 'mend' || plan.mode === 'revise') && checkShowing ? 'check' : null;
}

/** One finite replay tick. The final tick returns to the live beat after the last target step's full interval. */
export function replayTick(steps: number, remaining: number) {
  return { step: (steps * 2 + 1 - remaining) % steps, target: remaining > 1, remaining: remaining - 1 };
}

/** Specific editable repairs, recomputed after every edit so help never asks for an already fixed cell. */
export function repairs(plan: BeatPlan, target: Beat, have: Beat) {
  return target.flatMap((row, r) => row.flatMap((on, step) =>
    !givenCell(plan, r, step) && on !== have[r][step] ? [{ row: r, step, add: on }] : []));
}
