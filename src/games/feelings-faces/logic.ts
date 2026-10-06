import type { Rng } from '../../engine/random';

/** The feelings a face can show. Each has its own critter mood, sound, and color. */
export const FEELINGS = ['happy', 'sad', 'sleepy', 'surprised'] as const;
export type Feeling = (typeof FEELINGS)[number];

/** Things the pet can need, and the one helper that answers each. */
export const NEEDS = ['sad', 'sleepy', 'hungry', 'cold'] as const;
export type Need = (typeof NEEDS)[number];
export type Helper = 'hug' | 'pillow' | 'apple' | 'scarf';
export const HELPERS: Record<Need, Helper> = { sad: 'hug', sleepy: 'pillow', hungry: 'apple', cold: 'scarf' };

/** Little happenings, each with the feeling it causes. */
export const EVENTS = { balloon: 'sad', present: 'happy', jack: 'surprised', moon: 'sleepy' } as const satisfies Record<string, Feeling>;
export type FeelingEvent = keyof typeof EVENTS;

export type FeelingMode = 'play' | 'mirror' | 'name' | 'help' | 'why' | 'friends';

export interface FeelingPlan {
  mode: FeelingMode;
  /** Cards to choose from (play: feeling bubbles). */
  choices: number;
  /** Feelings in use, for the face modes. */
  feelings: readonly Feeling[];
  /** Questions per round; free play has none. */
  rounds: number;
  name: string;
}

export const FEELING_PLANS: FeelingPlan[] = [
  { mode: 'play', choices: 4, feelings: FEELINGS, rounds: 0, name: 'Tap feeling bubbles to see the pet show each feeling' },
  { mode: 'mirror', choices: 2, feelings: ['happy', 'sad'], rounds: 4, name: "Match the pet's face, happy or sad" },
  { mode: 'name', choices: 2, feelings: ['happy', 'sad', 'sleepy'], rounds: 4, name: 'Find the happy, sad or sleepy face out of two' },
  { mode: 'name', choices: 3, feelings: FEELINGS, rounds: 4, name: 'Find a named feeling out of three faces' },
  { mode: 'help', choices: 3, feelings: FEELINGS, rounds: 4, name: 'Choose what helps: a hug, a pillow, an apple or a scarf' },
  { mode: 'why', choices: 3, feelings: FEELINGS, rounds: 4, name: 'Watch what happens, then choose how the pet feels' },
  { mode: 'friends', choices: 4, feelings: FEELINGS, rounds: 4, name: 'Find the friend who feels a named feeling' },
];

export const feelingPlan = (level: number) => FEELING_PLANS[Math.max(0, Math.min(FEELING_PLANS.length - 1, level - 1))];

export interface Question<P extends string, O extends string> {
  prompt: P;
  answer: O;
  options: O[];
}

/**
 * `rounds` questions. Prompts come in shuffled passes so each appears before any repeats,
 * never twice in a row; options hold the answer once plus distinct distractors from `pool`.
 */
export function questions<P extends string, O extends string>(
  rng: Rng,
  rounds: number,
  prompts: readonly P[],
  pool: readonly O[],
  answerOf: (prompt: P) => O,
  choices: number,
): Question<P, O>[] {
  const out: Question<P, O>[] = [];
  let pass: P[] = [];
  for (let i = 0; i < rounds; i++) {
    if (!pass.length) {
      pass = rng.shuffle([...prompts]);
      if (pass.length > 1 && pass[0] === out.at(-1)?.prompt) pass.push(pass.shift()!);
    }
    const prompt = pass.shift()!;
    const answer = answerOf(prompt);
    const others = rng.shuffle(pool.filter((o) => o !== answer)).slice(0, choices - 1);
    out.push({ prompt, answer, options: rng.shuffle([answer, ...others]) });
  }
  return out;
}

/** The questions for one round of a plan; free play has none. */
export function feelingRound(plan: FeelingPlan, rng: Rng): Question<string, string>[] {
  switch (plan.mode) {
    case 'play':
      return [];
    case 'help':
      return questions(rng, plan.rounds, NEEDS, Object.values(HELPERS), (n) => HELPERS[n], plan.choices);
    case 'why':
      return questions(rng, plan.rounds, Object.keys(EVENTS) as FeelingEvent[], FEELINGS, (e) => EVENTS[e], plan.choices);
    default:
      // mirror, name and friends: the prompt is the feeling itself.
      return questions(rng, plan.rounds, plan.feelings, plan.feelings, (f) => f, plan.choices);
  }
}
