import type { WelcomeBand, WelcomeStep } from '../content/welcome';

/**
 * What each step of Welcome a New Friend asks of her, per band (RW09, docs/rework/LEARNING-RECAP.md#the-learning-table-srclearning).
 * A small table for the pilot project only, not a mapping for every game. A test pins each row's game and level to
 * `WELCOME_PLAN`, so the two cannot drift apart.
 */
export type LearningSubject = 'art' | 'number' | 'music';
/** `checked` has a right answer; `free` has none, so it never counts as right or wrong. */
export type StepKind = 'checked' | 'free';

export interface StepIntention {
  game: string;
  level: number;
  subject: LearningSubject;
  kind: StepKind;
  /** Grown-up wording: what the step asks. */
  intention: string;
  /** What finishing it means, for the recap's lines: "{name} made four equal plates". */
  did: string;
}

export const WELCOME_INTENTIONS: Record<WelcomeStep, Record<WelcomeBand, StepIntention>> = {
  pretty: {
    preschool: {
      game: 'stamp-studio',
      level: 3,
      subject: 'art',
      kind: 'free',
      intention: 'Makes and arranges a picture by choice.',
      did: 'made a picture',
    },
    prek: {
      game: 'stamp-studio',
      level: 4,
      subject: 'art',
      kind: 'free',
      intention: 'Makes and arranges a picture by choice.',
      did: 'made a picture',
    },
  },
  yummy: {
    preschool: {
      game: 'pet-kitchen',
      level: 2,
      subject: 'number',
      kind: 'checked',
      intention: 'Shares one whole into four equal parts.',
      did: 'made four equal plates',
    },
    prek: {
      game: 'pet-kitchen',
      level: 5,
      subject: 'number',
      kind: 'checked',
      intention: 'Doubles each part of a pictured recipe.',
      did: 'made the recipe twice over',
    },
  },
  song: {
    preschool: {
      game: 'song-maker',
      level: 2,
      subject: 'music',
      kind: 'free',
      intention: 'Explores high and low notes in a repeating loop.',
      did: 'played a tune',
    },
    prek: {
      game: 'song-maker',
      level: 2,
      subject: 'music',
      kind: 'free',
      intention: 'Explores high and low notes in a repeating loop.',
      did: 'played a tune',
    },
  },
};
