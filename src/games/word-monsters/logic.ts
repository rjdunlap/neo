import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Word Monsters, after Endless Alphabet and Reader Rabbit: every letter is a little monster
 * that says its sound. The ladder goes from tapping to hear sounds, to finding a letter,
 * to matching first sounds, to building simple words sound by sound.
 */
export type MonsterMode = 'play' | 'find' | 'who' | 'first' | 'build' | 'spell' | 'family' | 'end' | 'last';

export interface MonsterPlan {
  mode: MonsterMode;
  /** Questions or words in a round. */
  rounds: number;
  /** Monsters to choose from. */
  choices: number;
  name: string;
  /** Level 9, lap's opening: one big monster at a time, and a touch anywhere makes it say its sound. */
  big?: boolean;
}

export const PLANS: MonsterPlan[] = [
  { mode: 'play', rounds: 10, choices: 4, name: 'Tap letter monsters to hear their sounds' },
  { mode: 'find', rounds: 4, choices: 2, name: 'Find a letter by name: "find B"' },
  { mode: 'who', rounds: 4, choices: 3, name: 'Find a letter by its sound: "who says mmm?"' },
  { mode: 'first', rounds: 4, choices: 3, name: 'First sounds: "apple starts with aah"' },
  { mode: 'build', rounds: 3, choices: 3, name: 'Build a three-letter word with letters shown in the slots' },
  {
    mode: 'spell',
    rounds: 3,
    choices: 4,
    name: 'Build a three-letter word from its sounds, with a spare letter',
  },
  {
    mode: 'family',
    rounds: 6,
    choices: 4,
    name: 'Word families: change the first sound to make hat, cat, bat (two families)',
  },
  {
    mode: 'end',
    rounds: 3,
    choices: 3,
    name: 'Change the end: keep the first two sounds and make cat, cap, can',
  },
];

/** Level 9, lap's opening before level 1: one big monster at a time; toddler still starts at 1. */
export const BIG_LEVEL = 9;
export const BIG_PLAN: MonsterPlan = {
  mode: 'play',
  big: true,
  rounds: 6,
  choices: 1,
  name: 'One big monster: a touch anywhere makes it say its sound, its picture stays, and the next monster wakes (6 monsters)',
};

/**
 * Level 10, the first of the school window's levels on top (the plan's "level 9", renumbered because lap took 9): a
 * pictured word is said and she taps the monster for its last sound. It is no harder than 7 and 8, but IDs are appended,
 * so it sits at the top of the order.
 */
export const LAST_LEVEL = 10;
export const LAST_PLAN: MonsterPlan = {
  mode: 'last',
  rounds: 4,
  choices: 3,
  name: 'Last sounds: "what does cat end with?" Tap the monster for the last sound',
};

export const LEVELS: BandLevels = {
  lap: { min: 1, max: BIG_LEVEL, order: [BIG_LEVEL, 1] },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 5 },
  prek: { min: 3, max: 6 },
  // 9 is lap's big monster, so the school order skips it.
  school: { min: 5, max: LAST_LEVEL, order: [5, 6, 7, 8, LAST_LEVEL] },
};

/**
 * Word families: the ending stays, the first sound changes. Each word's onset is a plain consonant sound, and every word
 * has a picture that names it (`pictures.ts`), so the picture settles a word the voice might blur. Words that no picture
 * names (sat, fun, big, jog, wet) are left out rather than shown with a misleading one.
 */
export const FAMILIES = {
  at: ['cat', 'hat', 'bat', 'mat', 'rat'],
  og: ['dog', 'log', 'fog', 'hog'],
  ig: ['pig', 'dig', 'wig', 'fig'],
  un: ['sun', 'run', 'bun'],
  op: ['top', 'mop', 'hop', 'pop'],
  en: ['hen', 'pen', 'ten', 'den'],
  et: ['net', 'pet', 'jet'],
  ug: ['bug', 'rug', 'mug', 'hug'],
} as const;
export type Rime = keyof typeof FAMILIES;
export const RIMES = Object.keys(FAMILIES) as Rime[];

export const planFor = (level: number) =>
  level === BIG_LEVEL
    ? BIG_PLAN
    : level === LAST_LEVEL
      ? LAST_PLAN
      : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/**
 * How each letter's sound is written for the device voice, which has no phonics.
 * These are stand-ins: recorded parent voices will replace them by line id (`sound.a`...).
 */
export const SOUNDS: Record<string, string> = {
  a: 'aah',
  b: 'buh',
  c: 'kuh',
  d: 'duh',
  e: 'eh',
  f: 'fff',
  g: 'guh',
  h: 'huh',
  i: 'ih',
  j: 'juh',
  k: 'kuh',
  l: 'lll',
  m: 'mmm',
  n: 'nnn',
  o: 'aw',
  p: 'puh',
  q: 'kwuh',
  r: 'rrr',
  s: 'sss',
  t: 'tuh',
  u: 'uh',
  v: 'vvv',
  w: 'wuh',
  x: 'ks',
  y: 'yuh',
  z: 'zzz',
};

export const ALPHABET = Object.keys(SOUNDS);

/** Lowercase letters that are easy to mix up; never offered side by side. */
const LOOKALIKES = ['bdpq', 'mnu', 'il'];
export const lookalike = (a: string, b: string) =>
  a !== b && LOOKALIKES.some((set) => set.includes(a) && set.includes(b));

/** Two different letters that make the same sound (c and k), never offered together: one would be right and be told off. */
export const soundTwin = (a: string, b: string) => a !== b && SOUNDS[a] === SOUNDS[b];

/** "Who says...?" asks for plain letter sounds, so q ("kwuh") and x ("ks") wait until they have one of their own. */
export const WHO_POOL = ALPHABET.filter((l) => l !== 'q' && l !== 'x');

/** Picture words whose first sound is the letter's plain sound (no ice cream, no xylophone). */
export const FIRST_WORDS: Record<string, string> = {
  a: 'apple',
  b: 'ball',
  c: 'cat',
  d: 'duck',
  e: 'egg',
  f: 'fish',
  g: 'grapes',
  h: 'house',
  j: 'jelly',
  k: 'kite',
  l: 'leaf',
  m: 'moon',
  n: 'nest',
  p: 'pig',
  r: 'rainbow',
  s: 'sun',
  t: 'tree',
  u: 'umbrella',
  w: 'whale',
  y: 'yo-yo',
  z: 'zebra',
};

/**
 * Three-letter words to build (levels 5-6), each sounded out letter by letter, with at least three for every short
 * vowel and many that start with a sound she can stretch (mmm-ap, nnn-et, rrr-ug). No word holds a mirror pair
 * (b d p q, or i with l: no bed, no lip), and each has a picture.
 */
export const WORDS = [
  ...['cat', 'hat', 'map', 'bag'],
  ...['hen', 'net', 'pen', 'web'],
  ...['pig', 'pin', 'wig'],
  ...['dog', 'box', 'mop', 'log'],
  ...['sun', 'cup', 'rug', 'bus'],
] as const;
export type Word = (typeof WORDS)[number];
export const END_WORDS = ['cat', 'cap', 'can'] as const;
/** Every word a building level can ask for; `pictures.ts` draws each one. */
export const PICTURE_WORDS = [
  ...new Set([...WORDS, ...END_WORDS, ...RIMES.flatMap((rime) => FAMILIES[rime])]),
] as const;
export type PictureWord = Word | (typeof END_WORDS)[number] | (typeof FAMILIES)[Rime][number];

/** Level 10's words: every pictured word except those ending in x, whose "ks" is two sounds. */
export const LAST_WORDS = PICTURE_WORDS.filter((w) => !w.endsWith('x'));

export interface Question {
  /** The letter asked for (find/who/first), or the word to build. */
  answer: string;
  /** Monsters on the ground: letters, in screen order. */
  monsters: string[];
  /** Letters already standing in fixed slots: a family ending (level 7) or beginning (level 8). */
  fixed?: string;
  /** Level 10: the pictured word whose last sound is the answer. */
  word?: PictureWord;
}

/** Pick `n` different letters including `must`, with no lookalikes among them. */
export function pickLetters(rng: Rng, n: number, must: string[], pool = ALPHABET): string[] {
  const out = [...must];
  for (const l of rng.shuffle([...pool])) {
    if (out.length >= n) break;
    if (out.includes(l) || out.some((o) => lookalike(o, l) || soundTwin(o, l))) continue;
    out.push(l);
  }
  return rng.shuffle(out);
}

export function makeQuestions(plan: MonsterPlan, rng: Rng): Question[] {
  const out: Question[] = [];
  const pool =
    plan.mode === 'first'
      ? Object.keys(FIRST_WORDS)
      : plan.mode === 'find'
        ? 'abcdefghkmrstw'.split('')
        : plan.mode === 'who'
          ? WHO_POOL
          : ALPHABET;
  const used = new Set<string>();
  if (plan.mode === 'family') {
    // Two families, three words each; the other first sounds come from the family when they can, so hearing matters.
    for (const rime of rng.shuffle([...RIMES]).slice(0, plan.rounds / 3)) {
      const onsets = FAMILIES[rime].map((w) => w[0]);
      for (const word of rng.shuffle([...FAMILIES[rime]]).slice(0, 3)) {
        out.push({
          answer: word,
          fixed: rime,
          monsters: pickLetters(
            rng,
            plan.choices,
            [word[0]],
            [...rng.shuffle(onsets), ...'cfhjlmnrstw'.split('')],
          ),
        });
      }
    }
    return out;
  }
  if (plan.mode === 'end') {
    for (const word of END_WORDS) {
      // The first two letters are already in the slots. Only the answer makes a real word;
      // the spare sounds cannot create another pictured word in this slot.
      out.push({
        answer: word,
        fixed: word.slice(0, 2),
        monsters: pickLetters(rng, plan.choices, [word[2]], ['x', 'z']),
      });
    }
    return rng.shuffle(out);
  }
  if (plan.mode === 'last') {
    // Each word in a round ends in a different letter, so the endings vary though most words end in t, g, n or p.
    const ends = new Set<string>();
    for (const word of rng.shuffle([...LAST_WORDS])) {
      if (out.length >= plan.rounds) break;
      const last = word[word.length - 1];
      if (ends.has(last)) continue;
      ends.add(last);
      // About half the time the word's own first sound is a decoy, so she must listen past the start.
      const first = word[0];
      const decoy = first !== last && !lookalike(first, last) && !soundTwin(first, last) && rng.chance(0.5);
      out.push({
        answer: last,
        word,
        monsters: pickLetters(rng, plan.choices, decoy ? [last, first] : [last], WHO_POOL),
      });
    }
    return out;
  }
  if (plan.mode === 'build' || plan.mode === 'spell') {
    for (const word of rng.shuffle([...WORDS]).slice(0, plan.rounds)) {
      out.push({ answer: word, monsters: pickLetters(rng, plan.choices, word.split('')) });
    }
    return out;
  }
  for (let i = 0; i < plan.rounds; i++) {
    let answer = rng.pick(pool);
    for (let tries = 0; used.has(answer) && tries < 20; tries++) answer = rng.pick(pool);
    used.add(answer);
    out.push({ answer, monsters: pickLetters(rng, plan.choices, [answer], pool) });
  }
  return out;
}

/** A big round's monsters, one per touch, all different, each with a first-word picture to keep. */
export function bigLetters(rng: Rng, n = BIG_PLAN.rounds): string[] {
  return rng.shuffle(Object.keys(FIRST_WORDS)).slice(0, n);
}

/** Building a word: may `letter` go into the next empty slot? Slots fill left to right. */
export const fits = (word: string, filled: number, letter: string) => word[filled] === letter;

/** "kuh, aah, tuh" for the voice. */
export const sounded = (word: string) =>
  word
    .split('')
    .map((l) => SOUNDS[l])
    .join(', ');

/**
 * What a capable child does next, for the ghost finger. Free play: each monster in turn, round and round, to hear them.
 * Finding (and level 10's last sound): the monster that is the answer. Building: the monster whose letter is the next empty slot's, never one that
 * is already in a slot (a word family's ending stands there from the start).
 */
export function nextMonster<M extends { letter: string; placed: boolean }>(
  plan: MonsterPlan,
  q: Question,
  monsters: readonly M[],
  filled: number,
  taps: number,
): M | undefined {
  if (plan.mode === 'play') return monsters.length ? monsters[taps % monsters.length] : undefined;
  if (plan.mode === 'build' || plan.mode === 'spell' || plan.mode === 'family' || plan.mode === 'end')
    return monsters.find((m) => !m.placed && fits(q.answer, filled, m.letter));
  return monsters.find((m) => m.letter === q.answer);
}
