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

export const PLANS: GardenPlan[] = [
  { mode: 'play', rounds: 12, name: 'Tap the garden friends to hear them sing' },
  { mode: 'highlow', rounds: 5, name: 'High or low? Bird or frog' },
  { mode: 'fastslow', rounds: 5, name: 'Fast or slow? Bunny or turtle' },
  { mode: 'updown', rounds: 5, name: 'Does the tune go up or down?' },
  { mode: 'echo', rounds: 4, name: 'Echo the woodpecker\'s rhythm on the drum' },
  { mode: 'mix', rounds: 6, name: 'Mixed listening: high or low, fast or slow, up or down' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const CHOICES: Record<Ask, [Answer, Answer]> = {
  highlow: ['high', 'low'],
  fastslow: ['fast', 'slow'],
  updown: ['up', 'down'],
};

export interface Question {
  ask: Ask;
  answer: Answer;
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
    out.push({ ask, answer });
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

/** Scale steps for an up or down tune. */
export const tune = (answer: 'up' | 'down') => (answer === 'up' ? [1, 3, 5, 7] : [7, 5, 3, 1]);

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
