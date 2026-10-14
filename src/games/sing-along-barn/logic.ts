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

/**
 * "Hot Cross Buns" is a traditional English street cry. Its tune is three notes in C, E D C (mi re do), and the penny
 * lines repeat one note: C C C C, D D D D. That is C D E, inside the island's pentatonic set, so no exception is
 * needed. Written from the tune's standard form, which matches the notes two web sources give (a public-domain
 * piano arrangement in C major, a glockenspiel chart "in C pentatonic"); the printed score could not be read as
 * text, so a grown-up singing it is the final check (DEVICE-CHECKS). One note per sung syllable.
 */
export const HOT_CROSS_BUNS: Phrase = { syllables: ['Hot', 'cross', 'buns'], steps: [2, 1, 0] };
export const ONE_A_PENNY: Phrase = { syllables: ['One', 'a', 'pen', 'ny', 'two', 'a', 'pen', 'ny'], steps: [0, 0, 0, 0, 1, 1, 1, 1] };

export type TuneId = 'macdonald' | 'buns';

/**
 * A song the barn sings: an opening nobody answers, then a verse for each friend. A friend answers on the last note
 * of the verse's `answers` phrase; `namesAnimal` means that note is sung as the animal's name (Old MacDonald's
 * "... he had a cow"), otherwise the lyric stays as written (the friend only answers in its voice on "buns").
 */
export interface Tune {
  id: TuneId;
  opening: readonly Phrase[];
  verse: readonly Phrase[];
  answers: Phrase;
  namesAnimal: boolean;
}

export const OLD_MACDONALD: Tune = {
  id: 'macdonald',
  opening: [HAD_A_FARM, E_I_E_I_O],
  verse: [HAD_A, E_I_E_I_O],
  answers: HAD_A,
  namesAnimal: true,
};
/** "Hot cross buns, hot cross buns" opens it; each friend's verse is "One a penny, two a penny, hot cross buns". */
export const BUNS: Tune = {
  id: 'buns',
  opening: [HOT_CROSS_BUNS, HOT_CROSS_BUNS],
  verse: [ONE_A_PENNY, HOT_CROSS_BUNS],
  answers: HOT_CROSS_BUNS,
  namesAnimal: false,
};
export const TUNES: readonly Tune[] = [OLD_MACDONALD, BUNS];

export interface Note {
  step: number;
  /** What is sung on this note; the animal's name on a verse's last note of its line when the tune names it. */
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
export function makeSong(animals: readonly Animal[], tune: Tune = OLD_MACDONALD): Note[] {
  const notes: Note[] = [];
  let phrase = 0;
  const add = (p: Phrase, animal: Animal | null, closes: boolean) => {
    p.steps.forEach((step, at) => {
      const last = at === p.steps.length - 1;
      const answers = animal !== null && p === tune.answers && last;
      notes.push({
        step,
        syllable: answers && tune.namesAnimal ? VOICES[animal!].word : p.syllables[at],
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
  tune.opening.forEach((p, i) => add(p, null, i === tune.opening.length - 1));
  for (const animal of animals) tune.verse.forEach((p, i) => add(p, animal, i === tune.verse.length - 1));
  return notes;
}

/** Which tune a round sings: a seeded draw, so both turn up and a replay of the same seed sings the same one. */
export const pickTune = (rng: Rng): Tune => rng.pick([...TUNES]);

export interface SingPlan {
  /** How many animals come to the farm. */
  verses: number;
  /** She chooses who comes (a free choice, never a mistake); otherwise the farm picks. */
  invite: boolean;
  /** With `invite`: she chooses one friend at a time, at the end of each line, instead of all of them before the song. */
  each: boolean;
}

export const PLANS: readonly SingPlan[] = [
  { verses: 1, invite: false, each: false },
  { verses: 2, invite: false, each: false },
  { verses: 2, invite: true, each: false },
  { verses: 3, invite: true, each: true },
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
