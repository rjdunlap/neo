import type { Rng } from '../../engine/random';

/**
 * Sound Garden, after Electroplankton: a garden of creatures that sing when touched. The
 * ladder turns play into listening: high or low, fast or slow, going up or down, and
 * echoing a woodpecker's rhythm on a drum.
 */
export type GardenMode = 'play' | 'highlow' | 'fastslow' | 'updown' | 'echo' | 'mix';
export type Ask = 'highlow' | 'fastslow' | 'updown';
export type Answer = 'high' | 'low' | 'fast' | 'slow' | 'up' | 'down';

export interface GardenPlan {
  mode: GardenMode;
  rounds: number;
  name: string;
}

/** Plans keyed by stable level ID, so a new level can be placed anywhere in a band's order without renumbering. */
export const PLANS: Record<number, GardenPlan> = {
  1: { mode: 'play', rounds: 12, name: 'Tap the garden friends to hear them sing' },
  2: { mode: 'highlow', rounds: 5, name: 'High or low? Bird or frog' },
  3: { mode: 'fastslow', rounds: 5, name: 'Fast or slow? Bunny or turtle' },
  4: { mode: 'updown', rounds: 5, name: 'Does the tune go up or down?' },
  5: { mode: 'echo', rounds: 4, name: 'Echo the woodpecker\'s rhythm on the drum' },
  6: { mode: 'mix', rounds: 6, name: 'Mixed listening: high or low, fast or slow, up or down' },
};

export const LEVEL_IDS = Object.keys(PLANS).map(Number);

export const planFor = (level: number) => PLANS[level] ?? PLANS[Math.min(Math.max(...LEVEL_IDS), Math.max(1, Math.round(level)))];

export const CHOICES: Record<Ask, [Answer, Answer]> = {
  highlow: ['high', 'low'],
  fastslow: ['fast', 'slow'],
  updown: ['up', 'down'],
};

/** An instrument the bush can sing with; the drum has no pitch, so its step is only kept for the record. */
export type Voice = 'marimba' | 'bell' | 'pluck' | 'drum';

/** One note of a sound: seconds from the start, a pentatonic scale step (`src/audio/notes.ts`) and the instrument. */
export interface Note {
  at: number;
  step: number;
  voice: Voice;
}

/** A sound and the seconds it lasts, measured to where the next note would fall (so fast and slow fill the same span). */
export interface Sound {
  notes: Note[];
  span: number;
}

export interface Question {
  ask: Ask;
  answer: Answer;
  /**
   * The sound for each of the two choices, built together so they differ only in what is asked: the same instrument and span, and for
   * fast or slow the same step. The bush plays `sounds[answer]`; a replay plays the same notes again.
   */
  sounds: Record<Answer, Sound>;
}

/** The pitched voices a question can use; fast or slow may also use the drum, the bunny's own patter. */
export const PITCHED: Voice[] = ['marimba', 'bell', 'pluck'];
/** Lowest and highest steps a low or high note can take, and the least distance between a question's two notes. */
export const LOW_STEPS = [-4, 2] as const;
export const HIGH_STEPS = [6, 12] as const;
export const MIN_APART = 5;
/** High or low: three repeats of the note. */
export const HIGHLOW_GAP = 0.38;
/** Fast or slow: both fill the same two seconds, fast with twice the beats. */
export const TEMPO_SPAN = 2;
export const FAST_BEATS = 8;
export const SLOW_BEATS = 4;
/** Up or down: 3 to 5 notes, each one or two scale steps from the last, within these steps. */
export const TUNE_STEPS = [-2, 12] as const;
export const TUNE_GAP = 0.34;

const repeat = (step: number, voice: Voice, count: number, gap: number): Sound => ({
  notes: Array.from({ length: count }, (_, i) => ({ at: i * gap, step, voice })),
  span: count * gap,
});

/** The pair of sounds for a question, from the seeded RNG. */
export function makeSounds(ask: Ask, rng: Rng): Record<Answer, Sound> {
  const out = {} as Record<Answer, Sound>;
  if (ask === 'highlow') {
    const voice = rng.pick(PITCHED);
    const low = rng.int(LOW_STEPS[0], LOW_STEPS[1]);
    const high = rng.int(Math.max(HIGH_STEPS[0], low + MIN_APART), HIGH_STEPS[1]);
    out.high = repeat(high, voice, 3, HIGHLOW_GAP);
    out.low = repeat(low, voice, 3, HIGHLOW_GAP);
  } else if (ask === 'fastslow') {
    const voice = rng.pick([...PITCHED, 'drum'] as Voice[]);
    const step = rng.int(0, 7);
    out.fast = repeat(step, voice, FAST_BEATS, TEMPO_SPAN / FAST_BEATS);
    out.slow = repeat(step, voice, SLOW_BEATS, TEMPO_SPAN / SLOW_BEATS);
  } else {
    const voice = rng.pick(PITCHED);
    const length = rng.int(3, 5);
    const rises = Array.from({ length: length - 1 }, () => rng.int(1, 2));
    const climb = rises.reduce((a, b) => a + b, 0);
    let step = rng.int(TUNE_STEPS[0], TUNE_STEPS[1] - climb);
    const steps = [step, ...rises.map((r) => (step += r))];
    const at = (i: number) => i * TUNE_GAP;
    out.up = { notes: steps.map((s, i) => ({ at: at(i), step: s, voice })), span: length * TUNE_GAP };
    out.down = { notes: [...steps].reverse().map((s, i) => ({ at: at(i), step: s, voice })), span: length * TUNE_GAP };
  }
  return out;
}

/** Listening questions: balanced answers, never the same answer three times running. */
export function makeQuestions(plan: GardenPlan, rng: Rng): Question[] {
  if (plan.mode === 'play' || plan.mode === 'echo') return [];
  const asks: Ask[] = plan.mode === 'mix' ? rng.shuffle(['highlow', 'fastslow', 'updown', 'highlow', 'fastslow', 'updown'] as Ask[]).slice(0, plan.rounds) : Array(plan.rounds).fill(plan.mode);
  const out: Question[] = [];
  for (const ask of asks) {
    const [a, b] = CHOICES[ask];
    const lastTwo = out.slice(-2).map((q) => q.answer);
    let answer = rng.pick([a, b]);
    if (lastTwo.length === 2 && lastTwo.every((x) => x === answer)) answer = answer === a ? b : a;
    out.push({ ask, answer, sounds: makeSounds(ask, rng) });
  }
  return out;
}

/** A rhythm is the gaps between taps: short or long. */
export type Gap = 'S' | 'L';
export const GAP_SECONDS: Record<Gap, number> = { S: 0.32, L: 0.72 };

/** Rhythms to echo, from two taps up to four. */
export const RHYTHMS: Gap[][] = [['S'], ['L'], ['S', 'S'], ['L', 'S'], ['S', 'L'], ['S', 'S', 'S'], ['L', 'S', 'S'], ['S', 'S', 'L']];

export function makeRhythms(rounds: number, rng: Rng): Gap[][] {
  // Start easy (two or three taps), then a longer one.
  const easy = rng.shuffle(RHYTHMS.filter((r) => r.length <= 2));
  const hard = rng.shuffle(RHYTHMS.filter((r) => r.length === 3));
  return [...easy.slice(0, Math.max(1, rounds - 1)), ...hard].slice(0, rounds);
}

/**
 * Did the taps echo the rhythm? The tap count must match. Little hands aren't metronomes, so
 * gaps are only compared with each other: a long gap must be clearly longer than a short one,
 * and gaps that should match must be roughly alike.
 */
export function judgeEcho(pattern: Gap[], taps: number[]): boolean {
  if (taps.length !== pattern.length + 1) return false;
  const gaps = taps.slice(1).map((t, i) => t - taps[i]);
  if (gaps.some((g) => g > 2.5)) return false;
  for (let i = 0; i < gaps.length; i++) {
    for (let j = 0; j < gaps.length; j++) {
      if (pattern[i] === 'L' && pattern[j] === 'S' && gaps[i] < gaps[j] * 1.35) return false;
      if (pattern[i] === pattern[j] && gaps[i] > gaps[j] * 1.8) return false;
    }
  }
  return true;
}

/** The singers in free play, in the order they stand. */
export const SINGERS = ['bird', 'frog', 'bunny', 'bell', 'woodpecker'] as const;

/** The singer the demonstration touches for the next tap: each in turn, so the garden is heard whole. */
export const singerToTap = (played: number) => SINGERS[played % SINGERS.length];

/** Which of the two answer tiles shows the answer (the tiles show the two choices in order). */
export const tileFor = (q: Question): 0 | 1 => (CHOICES[q.ask][0] === q.answer ? 0 : 1);

/**
 * The seconds the demonstration's hand rests after a drum tap so that the next tap makes a short or a long gap. The hand needs at least
 * `minGap` seconds to lift, come back and press (`MIN_TAP_GAP`), slower than the game's own short gap, so the whole echo is slowed together:
 * `judgeEcho` only compares long gaps with short ones, so a long gap 1.7 times a short one is a clear long and a short is a short, and
 * every gap is the same as the others of its kind.
 */
export function echoRest(gap: Gap, minGap: number): number {
  const short = minGap + 0.05;
  return gap === 'S' ? 0.05 : short * 1.7 - minGap;
}
