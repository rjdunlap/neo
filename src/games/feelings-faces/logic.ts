import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** The feelings a face can show. Each has its own critter mood, sound, and color. */
export const FEELINGS = ['happy', 'sad', 'sleepy', 'surprised'] as const;
export type Feeling = (typeof FEELINGS)[number];

/** Things the pet can need, and the one helper that answers each. */
export const NEEDS = ['sad', 'sleepy', 'hungry', 'cold'] as const;
export type Need = (typeof NEEDS)[number];
export type Helper = 'hug' | 'pillow' | 'apple' | 'scarf';
export const HELPERS: Record<Need, Helper> = { sad: 'hug', sleepy: 'pillow', hungry: 'apple', cold: 'scarf' };

/**
 * Little happenings, each with the feeling it causes. Two may cause the same feeling (rain and the balloon are both
 * sad); a round of four draws four different ones (`questions()` deals a pass before any repeat).
 */
export const EVENTS = {
  balloon: 'sad',
  present: 'happy',
  jack: 'surprised',
  moon: 'sleepy',
  rain: 'sad',
  butterfly: 'surprised',
  lullaby: 'sleepy',
  ball: 'happy',
} as const satisfies Record<string, Feeling>;
export type FeelingEvent = keyof typeof EVENTS;

/** Authored reactions describe these fictional friends, never a universal response to an event. */
export const REACTIONS = {
  jack: ['surprised', 'happy'],
  rain: ['sad', 'happy'],
  drum: ['happy', 'surprised'],
} as const satisfies Record<string, readonly [Feeling, Feeling]>;
export type ReactionEvent = keyof typeof REACTIONS;

/** A unique leftover distinguishes even the two sad happenings. */
export const CLUES = { balloon: 'string', present: 'wrapper', moon: 'moon', rain: 'puddle' } as const;
export type ClueEvent = keyof typeof CLUES;

/** Happenings only level 8 plays: each leaves a need rather than a feeling to name (snow leaves the pet cold). */
export const CARE_ONLY = ['icecream', 'snow', 'basket'] as const;
export type Happening = FeelingEvent | ReactionEvent | (typeof CARE_ONLY)[number];

/**
 * Happenings that leave a need, and the helper that answers it. Between them every helper is an answer, so a level-8
 * round of four different happenings asks for at least three different helpers.
 */
export const CARE_SCENARIOS = {
  balloon: { need: 'sad', helper: 'hug' },
  moon: { need: 'sleepy', helper: 'pillow' },
  icecream: { need: 'sad', helper: 'hug' },
  snow: { need: 'cold', helper: 'scarf' },
  basket: { need: 'hungry', helper: 'apple' },
} as const satisfies Partial<Record<Happening, { need: Need; helper: Helper }>>;
export type CareEvent = keyof typeof CARE_SCENARIOS;

export type FeelingMode = 'play' | 'poke' | 'mirror' | 'name' | 'help' | 'why' | 'friends' | 'care' | 'perspective' | 'clue';

export interface FeelingPlan {
  mode: FeelingMode;
  /** Cards to choose from (play: feeling bubbles). */
  choices: number;
  /** Feelings in use, for the face modes. */
  feelings: readonly Feeling[];
  /** Questions per round; free play has none. */
  rounds: number;
  needs?: readonly Need[];
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
  { mode: 'care', choices: 4, feelings: FEELINGS, rounds: 4, name: 'Watch what happens, then choose how to help the pet feel better' },
  // Level 9, lap's entry (`entryLevels`): the pet alone, no bubbles; each tap shows the next feeling (`pokeAfter`).
  { mode: 'poke', choices: 0, feelings: FEELINGS, rounds: 0, name: 'Tap the pet to see it show one feeling after another' },
  { mode: 'help', choices: 2, feelings: FEELINGS, needs: ['sad', 'sleepy', 'hungry'], rounds: 4, name: 'Hug or pillow: choose from two helpers for a sad, sleepy or hungry pet' },
  { mode: 'perspective', choices: 3, feelings: FEELINGS, rounds: 4, name: 'Two friends, one happening: match each friend’s own reaction' },
  // Level 13; ID 12 is reserved for the separately queued Ask first interaction.
  { mode: 'clue', choices: 3, feelings: FEELINGS, rounds: 4, name: 'What happened? Use the face and leftover clue to choose a happening' },
];

/** Level 9 Poke a feeling is lap's entry, placed first by `order` so levels 1–8 keep their IDs and pins. */
export const LEVELS: BandLevels = {
  lap: { min: 1, max: 9, order: [9, 1, 2] },
  toddler: { min: 2, max: 10, order: [2, 10, 3, 4] },
  preschool: { min: 3, max: 6 },
  prek: { min: 5, max: 11, order: [5, 6, 7, 8, 11] },
  school: { min: 11, max: 13, order: [11, 13] },
};

export const feelingPlan = (level: number) => FEELING_PLANS[level === 13 ? 11 : Math.max(0, Math.min(10, level - 1))];

export interface Question<P extends string, O extends string> {
  prompt: P;
  answer: O;
  options: O[];
  event?: ReactionEvent;
  friend?: 0 | 1;
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
    case 'poke':
      return [];
    case 'help':
      return questions(rng, plan.rounds, plan.needs ?? NEEDS, Object.values(HELPERS), (n) => HELPERS[n], plan.choices);
    case 'perspective': {
      const events = rng.shuffle(Object.keys(REACTIONS) as ReactionEvent[]).slice(0, 2);
      return events.flatMap((event) => ([0, 1] as const).map((friend) => ({
        ...questions(rng, 1, [`${event}:${friend}`], FEELINGS, () => REACTIONS[event][friend], plan.choices)[0], event, friend,
      })));
    }
    case 'clue':
      return questions(rng, plan.rounds, Object.keys(CLUES) as ClueEvent[], Object.keys(CLUES) as ClueEvent[], (e) => e, plan.choices);
    case 'why':
      return questions(rng, plan.rounds, Object.keys(EVENTS) as FeelingEvent[], FEELINGS, (e) => EVENTS[e], plan.choices);
    case 'care':
      return questions(rng, plan.rounds, Object.keys(CARE_SCENARIOS) as CareEvent[], Object.values(HELPERS), (e) => CARE_SCENARIOS[e].helper, plan.choices);
    default:
      // mirror, name and friends: the prompt is the feeling itself.
      return questions(rng, plan.rounds, plan.feelings, plan.feelings, (f) => f, plan.choices);
  }
}

/**
 * Free play ends once every feeling has been shown and she has tapped six times, or after twelve taps of any kind.
 * Either way the round ends with a sticker; nothing she taps is ever wrong.
 */
export const playDone = (tried: ReadonlySet<Feeling>, taps: number) => (tried.size === FEELINGS.length && taps >= 6) || taps >= 12;

/** What a poke shows at level 9: a feeling, or the hug that answers a sad pet before the cycle goes on. */
export type PokeStep = Feeling | 'hug';

/**
 * Level 9's fixed cycle: happy, surprised, sleepy, sad, then the hug (which leaves the pet happy), then round again from
 * surprised. `prev` is the last step shown, or null before the first tap.
 */
export const pokeAfter = (prev: PokeStep | null): PokeStep =>
  prev === null ? 'happy' : prev === 'happy' ? 'surprised' : prev === 'surprised' ? 'sleepy' : prev === 'sleepy' ? 'sad' : prev === 'sad' ? 'hug' : 'surprised';

/** Level 9 ends after six pokes, as free play does at the least: happy, surprised, sleepy, sad, the hug, surprised. */
export const POKE_TAPS = 6;
export const pokeDone = (taps: number) => taps >= POKE_TAPS;

/** The feeling bubble a capable child taps next in free play: one she has not seen the pet show yet, then each in turn. */
export const bubbleToTap = (tried: ReadonlySet<Feeling>, taps: number): Feeling => FEELINGS.find((f) => !tried.has(f)) ?? FEELINGS[taps % FEELINGS.length];

/**
 * The choice that answers a question, by its place among the options (faces, helpers or friends, left to right as they
 * are dealt). Options are distinct, so there is exactly one.
 */
export const choiceToTap = (q: Question<string, string>) => q.options.indexOf(q.answer);

/** The face parts a card or bubble frames (RW05 slice 2); every species has all five (`GAME_PARTS` in parts.test). */
export const FACE_PARTS = ['head', 'eyes', 'nose', 'cheeks', 'ears'] as const;

/** Room around the face's points, which are anchors on the picture rather than its outline. */
const FACE_PAD = 44;
/** The most a card grows a face: past this the picture blurs. */
export const FACE_MAX_GROW = 2.4;

/**
 * Where to put the companion on a card or bubble so its face fills `size` units centred on (0, 0): the scale, and the
 * companion's position. The points are the face parts at rest, in companion units. The river's and glider's faces are a
 * fifth of the sprout's across, so a whole-body card at the pip's 0.48 left their feelings too small to tell apart.
 */
export function faceFrame(points: readonly { x: number; y: number }[], size: number): { scale: number; x: number; y: number } {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - left, Math.max(...ys) - top) + FACE_PAD;
  const scale = Math.min(FACE_MAX_GROW, size / span);
  const cx = (left + Math.max(...xs)) / 2;
  const cy = (top + Math.max(...ys)) / 2;
  return { scale, x: -cx * scale, y: -cy * scale };
}
