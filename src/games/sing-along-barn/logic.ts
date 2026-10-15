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

/**
 * The rest of a full Old MacDonald verse: "With a moo-moo here and a moo-moo there, here a moo, there a moo, everywhere a
 * moo-moo", then the first line again. `~` is the friend's own sound ("moo", "oink", ...), sung where the verse says moo.
 * Every step is C D E G A. These were written from the standard shape of the tune (a held do, then sol-sol-do), not a
 * printed score: a grown-up singing it is the final check (DEVICE-CHECKS).
 */
export const WITH_A: Phrase = { syllables: ['With', 'a', '~', '~', 'here'], steps: [3, 3, 0, 0, 0] };
export const AND_A: Phrase = { syllables: ['and', 'a', '~', '~', 'there'], steps: [3, 3, 0, 0, 0] };
export const HERE_A: Phrase = { syllables: ['Here', 'a', '~'], steps: [3, 3, 0] };
export const THERE_A: Phrase = { syllables: ['there', 'a', '~'], steps: [3, 3, 0] };
export const EVERYWHERE: Phrase = { syllables: ['ev', 'ry', 'where', 'a', '~', '~'], steps: [0, 0, 0, 3, 4, 3] };

/**
 * "Mary Had a Little Lamb" is a traditional nursery song. Its tune is mi re do re mi mi mi, re re re, mi sol sol: E D C D E E E,
 * D D D, E G G in C, all inside the island's pentatonic set (C D E G A), so no exception is needed. Written from the tune's
 * standard form, not a printed score: a grown-up singing it is the final check (DEVICE-CHECKS). One note per sung syllable.
 */
export const MARY_HAD_A: Phrase = { syllables: ['Ma', 'ry', 'had', 'a', 'lit', 'tle', 'lamb'], steps: [2, 1, 0, 1, 2, 2, 2] };
export const LITTLE_LAMB: Phrase = { syllables: ['lit', 'tle', 'lamb', 'lit', 'tle', 'lamb'], steps: [1, 1, 1, 2, 3, 3] };
export const FLEECE: Phrase = { syllables: ['its', 'fleece', 'was', 'white', 'as', 'snow'], steps: [2, 1, 1, 2, 1, 0] };

/**
 * "Au Clair de la Lune" is a traditional French song. Its tune is C C C D E D / C E D D C (do do do re mi re, do mi re re do),
 * all inside C D E, so no exception is needed. Written from the tune's standard form, not a printed score: a grown-up
 * singing it is the final check (DEVICE-CHECKS). One note per sung syllable.
 */
export const AU_CLAIR: Phrase = { syllables: ['Au', 'clair', 'de', 'la', 'lu', 'ne'], steps: [0, 0, 0, 1, 2, 1] };
export const MON_AMI: Phrase = { syllables: ['mon', 'a', 'mi', 'Pier', 'rot'], steps: [0, 2, 1, 1, 0] };
export const PRETE_MOI: Phrase = { syllables: ['Prê', 'te', 'moi', 'ta', 'plu', 'me'], steps: [0, 0, 0, 1, 2, 1] };
export const POUR_ECRIRE: Phrase = { syllables: ['pour', 'é', 'cri', 're', 'un', 'mot'], steps: [0, 2, 1, 1, 1, 0] };

export type TuneId = 'macdonald' | 'buns' | 'mary' | 'clair';

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
  /** Phrases whose `~` syllables are the friend's own sound; the friend sounds on each one. */
  sounds?: readonly Phrase[];
}

export const OLD_MACDONALD: Tune = {
  id: 'macdonald',
  opening: [HAD_A_FARM, E_I_E_I_O],
  verse: [HAD_A, E_I_E_I_O],
  answers: HAD_A,
  namesAnimal: true,
};
/** The whole verse, moo-moo lines and the first line again: 47 notes for each friend. */
export const OLD_MACDONALD_FULL: Tune = {
  ...OLD_MACDONALD,
  verse: [HAD_A, E_I_E_I_O, WITH_A, AND_A, HERE_A, THERE_A, EVERYWHERE, HAD_A_FARM, E_I_E_I_O],
  sounds: [WITH_A, AND_A, HERE_A, THERE_A, EVERYWHERE],
};
/** "Hot cross buns, hot cross buns" opens it; each friend's verse is "One a penny, two a penny, hot cross buns". */
export const BUNS: Tune = {
  id: 'buns',
  opening: [HOT_CROSS_BUNS, HOT_CROSS_BUNS],
  verse: [ONE_A_PENNY, HOT_CROSS_BUNS],
  answers: HOT_CROSS_BUNS,
  namesAnimal: false,
};
/** "Mary had a little lamb, its fleece was white as snow" opens it; each friend's verse is "little lamb, little lamb, its fleece was white as snow", answering on "lamb". */
export const MARY: Tune = {
  id: 'mary',
  opening: [MARY_HAD_A, FLEECE],
  verse: [LITTLE_LAMB, FLEECE],
  answers: LITTLE_LAMB,
  namesAnimal: false,
};
/** "Au clair de la lune, mon ami Pierrot" opens it; each friend's verse is "Prête-moi ta plume, pour écrire un mot", answering on "mot". */
export const CLAIR: Tune = {
  id: 'clair',
  opening: [AU_CLAIR, MON_AMI],
  verse: [PRETE_MOI, POUR_ECRIRE],
  answers: POUR_ECRIRE,
  namesAnimal: false,
};
export const TUNES: readonly Tune[] = [OLD_MACDONALD, BUNS, MARY, CLAIR];

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
      const sound = animal !== null && p.syllables[at] === '~' && tune.sounds?.includes(p) === true;
      const names = animal !== null && p === tune.answers && last;
      const answers = names || sound;
      notes.push({
        step,
        syllable: sound ? VOICES[animal!].sound : names && tune.namesAnimal ? VOICES[animal!].word : p.syllables[at],
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
  /** She chooses the song too (a free choice, never a mistake); otherwise the seed draws it. */
  chooseTune: boolean;
  /** Old MacDonald is the whole verse, moo-moo lines included, instead of the short form. */
  full: boolean;
}

export const PLANS: readonly SingPlan[] = [
  { verses: 1, invite: false, each: false, chooseTune: false, full: false },
  { verses: 2, invite: false, each: false, chooseTune: false, full: false },
  { verses: 2, invite: true, each: false, chooseTune: false, full: false },
  { verses: 3, invite: true, each: true, chooseTune: false, full: false },
  { verses: 3, invite: true, each: true, chooseTune: true, full: false },
  { verses: 2, invite: true, each: true, chooseTune: true, full: true },
];

/** The songs she can choose from at this level: the whole Old MacDonald verse at the top. */
export const tunesFor = (plan: SingPlan): readonly Tune[] => (plan.full ? [OLD_MACDONALD_FULL, BUNS, MARY, CLAIR] : TUNES);

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
