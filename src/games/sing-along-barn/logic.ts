import type { AnimalSound } from '../../audio/sfx';
import type { Rng } from '../../engine/random';

/** The farm animals that have a synthesized voice. */
export type Animal = 'cow' | 'pig' | 'duck' | 'cat' | 'dog';
export const ANIMALS: readonly Animal[] = ['cow', 'pig', 'duck', 'cat', 'dog'];

export const VOICES: Record<Animal, { sound: AnimalSound; word: string }> = {
  cow: { sound: 'moo', word: 'cow' },
  pig: { sound: 'oink', word: 'pig' },
  duck: { sound: 'quack', word: 'duck' },
  cat: { sound: 'meow', word: 'cat' },
  dog: { sound: 'woof', word: 'dog' },
};

/** One phrase of the song: a syllable for each note, and the pentatonic step it sounds (0 = middle C, -2 = the G below). */
export interface Phrase {
  syllables: readonly string[];
  steps: readonly number[];
}

/**
 * "Old MacDonald Had a Farm" is traditional. The tune is written by scale degree (do do do sol la la sol, mi mi re re do) in
 * C, which is C D E G A, so every note is already in the island's pentatonic set; no exception to that rule is needed.
 * One note for each sung syllable, so her taps line up with a grown-up singing. The song is the short form: the opening
 * ("Old MacDonald had a farm, E-I-E-I-O") once, then "And on that farm he had a ..., E-I-E-I-O" for each friend. The
 * moo-moo lines and the repeated first line of a full verse are left out, so a round stays short for a small child.
 */
export const HAD_A_FARM: Phrase = { syllables: ['Old', 'Mac', 'Don', 'ald', 'had', 'a', 'farm'], steps: [0, 0, 0, 3, 4, 4, 3] };
export const E_I_E_I_O: Phrase = { syllables: ['E', 'I', 'E', 'I', 'O'], steps: [2, 2, 1, 1, 0] };
/** "And on that farm he had a ...": a pickup on the G below, then the first phrase's notes. The last syllable is the animal. */
export const HAD_A: Phrase = { syllables: ['And', 'on', 'that', 'farm', 'he', 'had', 'a', ''], steps: [-2, 0, 0, 0, 3, 4, 4, 3] };

export interface Note {
  step: number;
  /** What is sung on this note; the animal's name on a verse's last note of its line. */
  syllable: string;
  /** Which phrase of the song this note is in (0-based), and its place in that phrase. */
  phrase: number;
  at: number;
  /** The phrase's length, for the row of beads. */
  of: number;
  /** The animal this verse is about; null in the opening lines. */
  animal: Animal | null;
  /** True on the note where the animal answers. */
  answers: boolean;
  /** True on the last note of a verse (and of the opening), where the next animal may come in. */
  verseEnd: boolean;
}

/** The whole song as a flat list of notes: the opening, then a verse for each animal. */
export function makeSong(animals: readonly Animal[]): Note[] {
  const notes: Note[] = [];
  let phrase = 0;
  const add = (p: Phrase, animal: Animal | null, closes: boolean) => {
    p.steps.forEach((step, at) => {
      const last = at === p.steps.length - 1;
      const answers = animal !== null && p === HAD_A && last;
      notes.push({
        step,
        syllable: answers ? VOICES[animal!].word : p.syllables[at],
        phrase,
        at,
        of: p.steps.length,
        animal,
        answers,
        verseEnd: closes && last,
      });
    });
    phrase++;
  };
  add(HAD_A_FARM, null, false);
  add(E_I_E_I_O, null, true);
  for (const animal of animals) {
    add(HAD_A, animal, false);
    add(E_I_E_I_O, animal, true);
  }
  return notes;
}

export interface SingPlan {
  /** How many animals come to the farm. */
  verses: number;
  /** She chooses who comes (a free choice, never a mistake); otherwise the farm picks. */
  invite: boolean;
}

export const PLANS: readonly SingPlan[] = [
  { verses: 1, invite: false },
  { verses: 2, invite: false },
  { verses: 2, invite: true },
];

export const planFor = (level: number): SingPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** The animals a farm sings about when she does not choose: a seeded draw, no repeats. */
export function farmAnimals(plan: SingPlan, rng: Rng): Animal[] {
  return rng.shuffle([...ANIMALS]).slice(0, plan.verses);
}

/** The animal a capable child invites next: the first friend not yet in the barn. Null once the plan is full. */
export function nextInvite(invited: readonly Animal[], plan: SingPlan): Animal | null {
  if (invited.length >= plan.verses) return null;
  return ANIMALS.find((a) => !invited.includes(a)) ?? null;
}
