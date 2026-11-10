import { spread } from '../../engine/view';
import { MIDDLE_C, stepToMidi } from '../../audio/notes';
import type { AnimalSound } from '../../audio/sfx';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

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
  /**
   * The exception decided 2026-10-23: `steps` count semitones from middle C (0 = C4, 5 = F4, -1 = the B below), so a
   * known tune can sound fa and ti. Only a tune on `OWN_NOTES` may hold such a phrase (a test guards it).
   */
  semitones?: true;
}

/** The note a phrase sounds at `at`, as MIDI: a pentatonic step, or a semitone for the allow-listed tunes. */
export const phraseMidi = (p: Phrase, at: number): number =>
  p.semitones ? MIDDLE_C + p.steps[at] : stepToMidi(p.steps[at]);

/**
 * "Old MacDonald Had a Farm" is traditional. The tune is written by scale degree (do do do sol la la sol, mi mi re re do) in
 * C, which is C D E G A, so every note is already in the island's pentatonic set; no exception to that rule is needed.
 * One note for each sung syllable, so her taps line up with a grown-up singing. The song is the short form: the opening
 * ("Old MacDonald had a farm, E-I-E-I-O") once, then "And on that farm he had a ..., E-I-E-I-O" for each friend. The
 * moo-moo lines and the repeated first line of a full verse are left out, so a round stays short for a small child.
 */
export const HAD_A_FARM: Phrase = {
  syllables: ['Old', 'Mac', 'Don', 'ald', 'had', 'a', 'farm'],
  steps: [0, 0, 0, 3, 4, 4, 3],
};
export const E_I_E_I_O: Phrase = { syllables: ['E', 'I', 'E', 'I', 'O'], steps: [2, 2, 1, 1, 0] };
/** "And on that farm he had a ...": a pickup on the G below, then the first phrase's notes. The last syllable is the animal. */
export const HAD_A: Phrase = {
  syllables: ['And', 'on', 'that', 'farm', 'he', 'had', 'a', ''],
  steps: [-2, 0, 0, 0, 3, 4, 4, 3],
};

/**
 * "Hot Cross Buns" is a traditional English street cry. Its tune is three notes in C, E D C (mi re do), and the penny
 * lines repeat one note: C C C C, D D D D. That is C D E, inside the island's pentatonic set, so no exception is
 * needed. Written from the tune's standard form, which matches the notes two web sources give (a public-domain
 * piano arrangement in C major, a glockenspiel chart "in C pentatonic"); the printed score could not be read as
 * text, so a grown-up singing it is the final check (DEVICE-CHECKS). One note per sung syllable.
 */
export const HOT_CROSS_BUNS: Phrase = { syllables: ['Hot', 'cross', 'buns'], steps: [2, 1, 0] };
export const ONE_A_PENNY: Phrase = {
  syllables: ['One', 'a', 'pen', 'ny', 'two', 'a', 'pen', 'ny'],
  steps: [0, 0, 0, 0, 1, 1, 1, 1],
};

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
export const EVERYWHERE: Phrase = {
  syllables: ['ev', 'ry', 'where', 'a', '~', '~'],
  steps: [0, 0, 0, 3, 4, 3],
};

/**
 * "Mary Had a Little Lamb" is a traditional nursery song. Its tune is mi re do re mi mi mi, re re re, mi sol sol: E D C D E E E,
 * D D D, E G G in C, all inside the island's pentatonic set (C D E G A), so no exception is needed. Written from the tune's
 * standard form, not a printed score: a grown-up singing it is the final check (DEVICE-CHECKS). One note per sung syllable.
 */
export const MARY_HAD_A: Phrase = {
  syllables: ['Ma', 'ry', 'had', 'a', 'lit', 'tle', 'lamb'],
  steps: [2, 1, 0, 1, 2, 2, 2],
};
export const LITTLE_LAMB: Phrase = {
  syllables: ['lit', 'tle', 'lamb', 'lit', 'tle', 'lamb'],
  steps: [1, 1, 1, 2, 3, 3],
};
export const FLEECE: Phrase = {
  syllables: ['its', 'fleece', 'was', 'white', 'as', 'snow'],
  steps: [2, 1, 1, 2, 1, 0],
};

/**
 * "Au Clair de la Lune" is a traditional French song. Its tune is C C C D E D / C E D D C (do do do re mi re, do mi re re do),
 * all inside C D E, so no exception is needed. Written from the tune's standard form, not a printed score: a grown-up
 * singing it is the final check (DEVICE-CHECKS). One note per sung syllable.
 */
export const AU_CLAIR: Phrase = {
  syllables: ['Au', 'clair', 'de', 'la', 'lu', 'ne'],
  steps: [0, 0, 0, 1, 2, 1],
};
export const MON_AMI: Phrase = { syllables: ['mon', 'a', 'mi', 'Pier', 'rot'], steps: [0, 2, 1, 1, 0] };
export const PRETE_MOI: Phrase = {
  syllables: ['Prê', 'te', 'moi', 'ta', 'plu', 'me'],
  steps: [0, 0, 0, 1, 2, 1],
};
export const POUR_ECRIRE: Phrase = {
  syllables: ['pour', 'é', 'cri', 're', 'un', 'mot'],
  steps: [0, 2, 1, 1, 1, 0],
};

/**
 * "Rain, Rain, Go Away" is a traditional nursery rhyme sung on a falling third, G E (sol mi), inside the pentatonic set.
 * Written from the tune's standard form, not a printed score: a grown-up singing it is the final check (DEVICE-CHECKS).
 * One note per sung syllable.
 */
export const RAIN_AWAY: Phrase = { syllables: ['Rain', 'rain', 'go', 'a', 'way'], steps: [3, 2, 3, 3, 2] };
export const COME_AGAIN: Phrase = {
  syllables: ['come', 'a', 'gain', 'an', 'oth', 'er', 'day'],
  steps: [3, 3, 2, 3, 3, 3, 2],
};
export const WE_WANT_TO_PLAY: Phrase = { syllables: ['we', 'want', 'to', 'play'], steps: [3, 3, 3, 2] };

/**
 * "The Itsy Bitsy Spider" is a traditional nursery song. Its first line is sol do do do re mi mi, mi re do re mi do:
 * G C C C D E E, E D C D E C in C, all inside the pentatonic set. Written from the tune's standard form, not a printed
 * score: a grown-up singing it is the final check (DEVICE-CHECKS). One note per sung syllable; the second line
 * ("Down came the rain") is left out until its notes are checked.
 */
export const ITSY_BITSY: Phrase = {
  syllables: ['The', 'it', 'sy', 'bit', 'sy', 'spi', 'der'],
  steps: [3, 0, 0, 0, 1, 2, 2],
};
export const WATER_SPOUT: Phrase = {
  syllables: ['climbed', 'up', 'the', 'wa', 'ter', 'spout'],
  steps: [2, 1, 0, 1, 2, 0],
};

/**
 * "Bounce High, Bounce Low" is a traditional American ball-passing song, sung on three notes, mi sol la (E G A in C),
 * all inside the pentatonic set: "high" climbs to la and "low" drops to mi. Written from the tune's standard form
 * (sol la sol mi, sol sol la la sol mi); the sources found give only its three notes, not a printed score, so a
 * grown-up singing it is the final check (DEVICE-CHECKS). In the game the ball goes to "Shiloh" in the opening, then
 * to each friend by name ("bounce the ball to the cow"), the way the playground game sings a child's name.
 */
export const BOUNCE_HIGH: Phrase = { syllables: ['Bounce', 'high', 'bounce', 'low'], steps: [3, 4, 3, 2] };
export const TO_SHILOH: Phrase = {
  syllables: ['bounce', 'the', 'ball', 'to', 'Shi', 'loh'],
  steps: [3, 3, 4, 4, 3, 2],
};
/** The verse's line: the last syllable is the friend's name. */
export const TO_THE: Phrase = {
  syllables: ['bounce', 'the', 'ball', 'to', 'the', ''],
  steps: [3, 3, 4, 4, 3, 2],
};

/**
 * "Ring Around the Rosie" is a traditional ring game. Its tune uses do, mi, sol and la (C E G A in C), all inside the
 * pentatonic set: the rosie and posies lines are sol sol mi la sol mi, and "we all fall down" drops to do at the end.
 * The sources found give only that set of notes, not their order, so this is written from the tune's standard form and
 * a grown-up singing it is the final check (DEVICE-CHECKS). One note per sung syllable.
 */
export const RING_AROUND: Phrase = {
  syllables: ['Ring', 'a', 'round', 'the', 'ro', 'sie'],
  steps: [3, 3, 2, 4, 3, 2],
};
export const POCKET: Phrase = {
  syllables: ['a', 'pock', 'et', 'full', 'of', 'po', 'sies'],
  steps: [3, 3, 3, 2, 4, 3, 2],
};
export const ASHES: Phrase = { syllables: ['Ash', 'es', 'ash', 'es'], steps: [3, 2, 3, 2] };
export const FALL_DOWN: Phrase = { syllables: ['we', 'all', 'fall', 'down'], steps: [3, 3, 3, 0] };

/**
 * "Twinkle, Twinkle, Little Star" is traditional (the French "Ah! vous dirai-je, maman"). It needs fa, so it is one of
 * the two tunes with their own notes. In C: C C G G A A G, F F E E D D C for the opening, then G G F F E E D twice for
 * "Up above the world so high, like a diamond in the sky" (Hoffman Academy's lesson gives the same notes). Checked
 * against the score in Wikipedia's article (C major). Semitones from middle C, one note per sung syllable; a grown-up
 * singing it is the final check (DEVICE-CHECKS).
 */
export const TWINKLE_STAR: Phrase = {
  syllables: ['Twin', 'kle', 'twin', 'kle', 'lit', 'tle', 'star'],
  steps: [0, 0, 7, 7, 9, 9, 7],
  semitones: true,
};
export const HOW_I_WONDER: Phrase = {
  syllables: ['how', 'I', 'won', 'der', 'what', 'you', 'are'],
  steps: [5, 5, 4, 4, 2, 2, 0],
  semitones: true,
};
export const UP_ABOVE: Phrase = {
  syllables: ['Up', 'a', 'bove', 'the', 'world', 'so', 'high'],
  steps: [7, 7, 5, 5, 4, 4, 2],
  semitones: true,
};
export const LIKE_A_DIAMOND: Phrase = {
  syllables: ['like', 'a', 'dia', 'mond', 'in', 'the', 'sky'],
  steps: [7, 7, 5, 5, 4, 4, 2],
  semitones: true,
};

/**
 * "The Wheels on the Bus" is traditional (American, after "Here We Go Round the Mulberry Bush"). Transposed to C from
 * the score in Wikipedia's article (G major): sol, do do do do mi sol mi do for "The wheels on the bus go round and
 * round", and re sol, sol, do for "all through the town": G C D E G, all inside the pentatonic set, so this short form
 * needs no exception (the middle "round and round, round and round" line, re re re ti, la, sol,, would need ti, and
 * is left out). Like Old MacDonald's short form: the opening line and "all through the town" once, then "The cow on
 * the bus says moo, moo, moo, all through the town" for each friend, who sounds on each moo. `@` is the friend's
 * name, mid-line. The line is split after "bus" so a row holds at most eight beads.
 */
export const WHEELS_ON_THE_BUS: Phrase = {
  syllables: ['The', 'wheels', 'on', 'the', 'bus'],
  steps: [-2, 0, 0, 0, 0],
};
export const ROUND_AND_ROUND: Phrase = { syllables: ['go', 'round', 'and', 'round'], steps: [2, 3, 2, 0] };
export const ALL_THROUGH_THE_TOWN: Phrase = {
  syllables: ['all', 'through', 'the', 'town'],
  steps: [1, -2, -2, 0],
};
export const FRIEND_ON_THE_BUS: Phrase = {
  syllables: ['The', '@', 'on', 'the', 'bus'],
  steps: [-2, 0, 0, 0, 0],
};
export const SAYS_MOO: Phrase = { syllables: ['says', '~', '~', '~'], steps: [2, 3, 2, 0] };

export type TuneId =
  'macdonald' | 'buns' | 'mary' | 'clair' | 'rain' | 'itsy' | 'bounce' | 'ring' | 'twinkle' | 'wheels';

/** The only tunes that may sound a note outside the pentatonic set (decided 2026-10-23; a test guards it). */
export const OWN_NOTES: readonly TuneId[] = ['twinkle'];

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
/** "Rain, rain, go away, come again another day" opens it; each friend's verse is "Rain, rain, go away, we want to play", answering on "play". */
export const RAIN: Tune = {
  id: 'rain',
  opening: [RAIN_AWAY, COME_AGAIN],
  verse: [RAIN_AWAY, WE_WANT_TO_PLAY],
  answers: WE_WANT_TO_PLAY,
  namesAnimal: false,
};
/** "The itsy bitsy spider climbed up the water spout" opens it; each friend's verse is "climbed up the water spout", answering on "spout". */
export const ITSY: Tune = {
  id: 'itsy',
  opening: [ITSY_BITSY, WATER_SPOUT],
  verse: [WATER_SPOUT],
  answers: WATER_SPOUT,
  namesAnimal: false,
};
/** "Bounce high, bounce low, bounce the ball to Shiloh" opens it; each friend's verse sends the ball to that friend, who answers on its name. */
export const BOUNCE: Tune = {
  id: 'bounce',
  opening: [BOUNCE_HIGH, TO_SHILOH],
  verse: [BOUNCE_HIGH, TO_THE],
  answers: TO_THE,
  namesAnimal: true,
};
/** "Ring around the rosie, a pocket full of posies" opens it; each friend's verse is "Ashes, ashes, we all fall down", answering on "down". */
export const RING: Tune = {
  id: 'ring',
  opening: [RING_AROUND, POCKET],
  verse: [ASHES, FALL_DOWN],
  answers: FALL_DOWN,
  namesAnimal: false,
};
/** "Twinkle, twinkle, little star, how I wonder what you are" opens it; each friend's verse is "Up above the world so high, like a diamond in the sky", answering on "sky". */
export const TWINKLE: Tune = {
  id: 'twinkle',
  opening: [TWINKLE_STAR, HOW_I_WONDER],
  verse: [UP_ABOVE, LIKE_A_DIAMOND],
  answers: LIKE_A_DIAMOND,
  namesAnimal: false,
};
/** "The wheels on the bus go round and round, all through the town" opens it; each friend rides the bus and says its sound three times. */
export const WHEELS: Tune = {
  id: 'wheels',
  opening: [WHEELS_ON_THE_BUS, ROUND_AND_ROUND, ALL_THROUGH_THE_TOWN],
  verse: [FRIEND_ON_THE_BUS, SAYS_MOO, ALL_THROUGH_THE_TOWN],
  answers: SAYS_MOO,
  namesAnimal: false,
  sounds: [SAYS_MOO],
};
export const TUNES: readonly Tune[] = [
  OLD_MACDONALD,
  BUNS,
  MARY,
  CLAIR,
  RAIN,
  ITSY,
  BOUNCE,
  RING,
  TWINKLE,
  WHEELS,
];

export interface Note {
  step: number;
  /** The pitch it sounds: `step` on the pentatonic, or its semitone for a tune with its own notes. */
  midi: number;
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
  /**
   * At *Finish the line*: the song pauses before this note, a friend's verse's last word, and her touch sings it. At
   * *Which one finishes it?*: the first note of the rhyming word (in each verse, or once in the opening), where she picks its picture.
   */
  gap: boolean;
}

/**
 * The whole song as a flat list of notes: the opening, then a verse for each animal. With `gaps` true, each verse's last
 * note is a gap (*Finish the line*); with `'rhyme'`, the first note of the tune's rhyming word is (*Which one finishes it?*).
 */
export function makeSong(
  animals: readonly Animal[],
  tune: Tune = OLD_MACDONALD,
  gaps: boolean | 'rhyme' = false,
): Note[] {
  const notes: Note[] = [];
  const rhyme = gaps === 'rhyme' ? RHYMES[tune.id] : undefined;
  let phrase = 0;
  const add = (p: Phrase, animal: Animal | null, closes: boolean) => {
    p.steps.forEach((step, at) => {
      const last = at === p.steps.length - 1;
      const sound = animal !== null && p.syllables[at] === '~' && tune.sounds?.includes(p) === true;
      const name = animal !== null && p.syllables[at] === '@';
      const names = animal !== null && p === tune.answers && last;
      const answers = names || sound;
      notes.push({
        step,
        midi: phraseMidi(p, at),
        syllable: sound
          ? VOICES[animal!].sound
          : name || (names && tune.namesAnimal)
            ? VOICES[animal!].word
            : p.syllables[at],
        phrase,
        at,
        of: p.steps.length,
        animal,
        answers,
        verseEnd: closes && last,
        gap:
          gaps === true
            ? animal !== null && closes && last
            : rhyme !== undefined &&
              closes &&
              (rhyme.where === 'verse') === (animal !== null) &&
              at === p.steps.length - rhyme.syllables.length,
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

/**
 * What waits beside the barn door while the song pauses before the word: the song cards' bun and ball, a night sky, a
 * spout; at *Which one finishes it?* also a posy of flowers, and an apple and the moon that do not rhyme.
 */
export type Picture = 'bun' | 'ball' | 'sky' | 'spout' | 'posies' | 'apple' | 'moon';

/**
 * *Finish the line* (level 7): the word each friend's verse ends on, and its picture. The song pauses before it, as a
 * grown-up pauses before a familiar word (the PC TALK "fill in" strategy), and any touch sings it. Only tunes whose verse
 * ends on a word a picture can show: "buns", "play" (a ball), "sky" and "spout". Old MacDonald ends on "O", Mary on
 * "snow", Ring on "down", Wheels on "town" and Bounce on the friend's own name; Au Clair is French, so it is left out.
 */
export const GAPS: Partial<Record<TuneId, { word: string; picture: Picture }>> = {
  buns: { word: 'buns', picture: 'bun' },
  rain: { word: 'play', picture: 'ball' },
  itsy: { word: 'spout', picture: 'spout' },
  twinkle: { word: 'sky', picture: 'sky' },
};

/** The tunes *Finish the line* sings, in `TUNES` order. */
export const GAP_TUNES: readonly Tune[] = TUNES.filter((t) => GAPS[t.id]);

/** Which tune a *Finish the line* round sings: a seeded draw among the tunes with a picture for their last word. */
export const pickGapTune = (rng: Rng): Tune => rng.pick([...GAP_TUNES]);

/** At the pause, a touch this soon after it began only wobbles the picture (a fast tapper meets it before it is sung). */
export const GAP_HOLD = 0.8;

/**
 * *Which one finishes it?* (level 8): the song stops before a word that rhymes with one sung just before it ("go away,
 * we want to play"), and two pictures wait by the door. Touching one says its word; only the rhyming one finishes the line.
 * Rain and Twinkle rhyme inside each friend's verse; Ring rhymes once, in its opening ("rosie", "posies").
 */
export interface Rhyme {
  /** In each friend's verse, or once at the end of the opening. */
  where: 'verse' | 'opening';
  /** The word sung just before that it rhymes with, as its sung syllables (they end the section's first phrase). */
  earlier: { word: string; syllables: readonly string[] };
  /** The word that finishes the line: its sung syllables (the section's last notes), and its picture, which says this word when touched. */
  word: string;
  syllables: readonly string[];
  picture: Picture;
  /** The other picture and its word, which does not rhyme. */
  decoy: { word: string; picture: Picture };
}

export const RHYMES: Partial<Record<TuneId, Rhyme>> = {
  rain: {
    where: 'verse',
    earlier: { word: 'away', syllables: ['a', 'way'] },
    word: 'play',
    syllables: ['play'],
    picture: 'ball',
    decoy: { word: 'apple', picture: 'apple' },
  },
  twinkle: {
    where: 'verse',
    earlier: { word: 'high', syllables: ['high'] },
    word: 'sky',
    syllables: ['sky'],
    picture: 'sky',
    decoy: { word: 'moon', picture: 'moon' },
  },
  ring: {
    where: 'opening',
    earlier: { word: 'rosie', syllables: ['ro', 'sie'] },
    word: 'posies',
    syllables: ['po', 'sies'],
    picture: 'posies',
    decoy: { word: 'bun', picture: 'bun' },
  },
};

/**
 * How each word in `RHYMES` sounds from its stressed vowel to the end, in the CMU Pronouncing Dictionary's ARPAbet
 * (written by hand: "high" and "sky" share a sound but no spelling). Two words rhyme when these match.
 */
export const RIMES: Record<string, string> = {
  away: 'EY',
  play: 'EY',
  high: 'AY',
  sky: 'AY',
  rosie: 'OW Z IY',
  posies: 'OW Z IY Z',
  apple: 'AE P AH L',
  moon: 'UW N',
  bun: 'AH N',
};

/** Whether two words rhyme: the same sound from the stressed vowel on, letting one end in a plural "s" (rosie, posies). */
export function rhymes(a: string, b: string): boolean {
  const x = RIMES[a];
  const y = RIMES[b];
  if (x === undefined || y === undefined) return false;
  return x === y || x === `${y} Z` || y === `${x} Z`;
}

/** The tunes *Which one finishes it?* sings, in `TUNES` order. */
export const RHYME_TUNES: readonly Tune[] = TUNES.filter((t) => RHYMES[t.id]);

/** Which tune a *Which one finishes it?* round sings: a seeded draw among the tunes with a rhyme to finish. */
export const pickRhymeTune = (rng: Rng): Tune => rng.pick([...RHYME_TUNES]);

/** Which side the rhyming picture stands on at each of a round's gaps (0 left, 1 right): drawn from the seed after the tune and friends. */
export const rhymeSides = (rng: Rng, gaps: number): (0 | 1)[] =>
  Array.from({ length: gaps }, () => (rng.chance(0.5) ? 1 : 0));

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
  /** *Finish the line*: the song pauses before each verse's last word, its picture waits by the door, and a touch sings it. */
  gap: boolean;
  /** *Which one finishes it?*: the song pauses before the rhyming word, and she picks its picture from two. */
  rhyme: boolean;
}

export const PLANS: readonly SingPlan[] = [
  { verses: 1, invite: false, each: false, chooseTune: false, full: false, gap: false, rhyme: false },
  { verses: 2, invite: false, each: false, chooseTune: false, full: false, gap: false, rhyme: false },
  { verses: 2, invite: true, each: false, chooseTune: false, full: false, gap: false, rhyme: false },
  { verses: 3, invite: true, each: true, chooseTune: false, full: false, gap: false, rhyme: false },
  { verses: 3, invite: true, each: true, chooseTune: true, full: false, gap: false, rhyme: false },
  { verses: 2, invite: true, each: true, chooseTune: true, full: true, gap: false, rhyme: false },
  // Level 7 sits between 3 and 4 for toddler and preschool (by `order`): two seeded friends, a pause before each one's last word.
  { verses: 2, invite: false, each: false, chooseTune: false, full: false, gap: true, rhyme: false },
  // Level 8 follows 7 for preschool and tops pre-K's ladder (by `order`): two seeded friends, a rhyming picture to pick.
  { verses: 2, invite: false, each: false, chooseTune: false, full: false, gap: false, rhyme: true },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  // *Finish the line* (7) sits after choosing friends (3) for the younger bands; pre-K does not play it. *Which one
  // finishes it?* (8) follows it for preschool and tops pre-K's ladder: the only level with a wrong answer.
  toddler: { min: 1, max: 7, order: [1, 2, 3, 7] },
  preschool: { min: 2, max: 8, order: [2, 3, 7, 8] },
  prek: { min: 3, max: 8, order: [3, 4, 5, 6, 8] },
};

/** The songs she can choose from at this level: the whole Old MacDonald verse at the top. */
export const tunesFor = (plan: SingPlan): readonly Tune[] =>
  plan.full ? [OLD_MACDONALD_FULL, ...TUNES.slice(1)] : TUNES;

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

/**
 * The friends' row along the bottom of a view `w` wide: up to 190 apart from 150 to the right edge less 40. On the narrow
 * upright area (chunk 31) the row starts 20 further from the guide and runs to 20 from the edge, so five friends at the
 * choice size (110-unit bodies) stay apart and clear of the pet.
 */
export const rowXs = (n: number, w: number) =>
  w < 900 ? spread(n, 170, w - 20, 190) : spread(n, 150, w - 40, 190);

/** A song card's touch area at full size, centred on the card. */
export const CARD_HIT = { w: 220, h: 200 };

/**
 * Where the song cards sit, centred across a view `w` wide at 0.42 of its height. Four cards shrink to 0.72 (158 across,
 * 180 apart) and five to 0.6 (132 by 120, 150 apart) so a row still fits an upright 768-wide view with room for the pet;
 * more than five sit in two rows, so a card never shrinks below the five-card size (ten are two rows of five, 150 apart).
 */
export function cardSpots(n: number, w: number, h: number) {
  const cols = n > 5 ? Math.ceil(n / 2) : n;
  const scale = cols > 4 ? 0.6 : cols > 3 ? 0.72 : 1;
  // 250 apart at full size: 30 clear between two 220-wide cards.
  const spacing = 250 * scale;
  const rows = Math.ceil(n / cols);
  const at = Array.from({ length: n }, (_, k) => {
    const row = Math.floor(k / cols);
    const inRow = Math.min(cols, n - row * cols);
    return {
      x: w / 2 + ((k % cols) - (inRow - 1) / 2) * spacing,
      y: h * 0.42 + (row - (rows - 1) / 2) * spacing,
    };
  });
  return { scale, at };
}
