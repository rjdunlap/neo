import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { latinLetters } from '../../learning/words/name-letters';

/**
 * Word Monsters, after Endless Alphabet and Reader Rabbit: every letter is a little monster
 * that says its sound. The ladder goes from tapping to hear sounds, to finding a letter,
 * to matching first sounds, to building simple words sound by sound.
 */
export type MonsterMode =
  | 'play'
  | 'find'
  | 'who'
  | 'first'
  | 'build'
  | 'spell'
  | 'family'
  | 'end'
  | 'last'
  | 'slow'
  | 'repair'
  | 'team'
  | 'mine';

export interface MonsterPlan {
  mode: MonsterMode;
  /** Questions or words in a round. */
  rounds: number;
  /** Monsters to choose from. */
  choices: number;
  name: string;
  /** Word pool for a word-only spelling round. */
  words?: readonly string[];
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

/**
 * Level 11, Say it slowly: level 6's drag into three empty boxes, but only the word is said, never its sounds. She says it
 * slowly herself; tapping the boxes says the sounds for her (a hint), tapping the picture says the word again (free).
 */
export const SLOW_LEVEL = 11;
export const SLOW_PLAN: MonsterPlan = {
  mode: 'slow',
  rounds: 3,
  choices: 4,
  name: 'Say it slowly: build a pictured word from the word alone, with no sounds said and a spare letter',
};

export const REPAIR_LEVEL = 12;
export const REPAIR_PLAN: MonsterPlan = {
  mode: 'repair',
  rounds: 3,
  choices: 3,
  name: "Fix the pet's word: tap out the wrong letter and put the right one in",
};

/**
 * Level 13, Two letters, one sound: level 11's boxes and word-only ask, but one monster is a wide team wearing two
 * letters (sh, ch, th, ck) that fills a single box, because a box holds a sound, not a letter.
 */
export const TEAM_LEVEL = 13;
export const TEAM_PLAN: MonsterPlan = {
  mode: 'team',
  rounds: 3,
  choices: 4,
  name: 'Two letters, one sound: build fish, duck or bath, where one monster wears two letters (sh, ch, th, ck) and fills one box',
};

// Adjacent consonants here make separate sounds. Keep this pool separate from the three-box words.
export const FOUR_WORDS = [
  'nest',
  'frog',
  'drum',
  'flag',
  'crab',
  'lamp',
  'milk',
  'belt',
  'plum',
  'hand',
] as const;
export type FourWord = (typeof FOUR_WORDS)[number];
export const FOUR_LEVEL = 14;
export const FOUR_PLAN: MonsterPlan = {
  mode: 'slow',
  rounds: 3,
  choices: 5,
  words: FOUR_WORDS,
  name: 'Four sounds: say a pictured word slowly and build it in four boxes, with a spare letter',
};

/**
 * Level 15, My letter (toddler and preschool's entry): three monsters, one wearing the first letter of her name, asked for
 * by its letter name only ("Where is D?"), never by a sound, so it makes no phonics claim. Toddler meets it between the
 * free taps of 1 and the two-monster "find" of 2; preschool starts on it.
 */
export const MINE_LEVEL = 15;
export const MINE_PLAN: MonsterPlan = {
  mode: 'mine',
  rounds: 4,
  choices: 3,
  name: 'My letter: find the first letter of her name among three monsters, asked by its letter name',
};

export const LEVELS: BandLevels = {
  lap: { min: 1, max: BIG_LEVEL, order: [BIG_LEVEL, 1] },
  toddler: { min: 1, max: MINE_LEVEL, order: [1, MINE_LEVEL, 2] },
  preschool: { min: 2, max: MINE_LEVEL, order: [MINE_LEVEL, 2, 3, 4, 5] },
  prek: { min: 3, max: 6 },
  // 9 is lap's big monster, so the school order skips it.
  school: {
    min: 5,
    max: FOUR_LEVEL,
    order: [5, 6, 7, 8, LAST_LEVEL, SLOW_LEVEL, REPAIR_LEVEL, FOUR_LEVEL, TEAM_LEVEL],
  },
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
      : level === SLOW_LEVEL
        ? SLOW_PLAN
        : level === REPAIR_LEVEL
          ? REPAIR_PLAN
          : level === TEAM_LEVEL
            ? TEAM_PLAN
            : level === FOUR_LEVEL
              ? FOUR_PLAN
              : level === MINE_LEVEL
                ? MINE_PLAN
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

/**
 * Level 13's letter teams: two letters that say one sound. They are kept out of `SOUNDS` so no single-letter pool
 * (`ALPHABET`, `WHO_POOL`) ever offers one. ck says what c and k say, so a ck word never offers a lone c or k.
 */
export const TEAM_SOUNDS: Record<string, string> = { sh: 'shh', ch: 'chuh', th: 'thh', ck: 'kuh' };
export const TEAMS = Object.keys(TEAM_SOUNDS);
/** A monster's sound: one letter's, or a team's. */
/**
 * Levels 7 and 8 are told, then asked: a round's first question says the sounds as a worked example, and every later one
 * says only the word (a wrong drop still says the sound). Returns the spoken line for the question at `index`.
 */
export const toldLine = (mode: 'family' | 'end', index: number) =>
  index === 0 ? (`monster.${mode}` as const) : (`monster.${mode}.word` as const);

export const soundOf = (unit: string) => SOUNDS[unit] ?? TEAM_SOUNDS[unit];

/** Lowercase letters that are easy to mix up; never offered side by side. */
const LOOKALIKES = ['bdpq', 'mnu', 'il'];
export const lookalike = (a: string, b: string) =>
  a !== b && LOOKALIKES.some((set) => set.includes(a) && set.includes(b));

/** Two different letters that make the same sound (c and k), never offered together: one would be right and be told off. */
export const soundTwin = (a: string, b: string) => a !== b && soundOf(a) === soundOf(b);

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
export const END_WORDS = ['cat', 'cap', 'can', 'hat', 'dog', 'pig', 'cup'] as const;

/** Spare endings form no word with the two letters already on the board. */
const END_DECOYS = {
  ca: ['h', 's', 'z'],
  ha: ['b', 'f', 'v', 'z'],
  do: ['f', 'h', 'z'],
  pi: ['b', 'f', 'l', 'v'],
  cu: ['g', 'h', 'l', 'n'],
};
/** Every word a building level can ask for; `pictures.ts` draws each one. */
export const PICTURE_WORDS = [
  ...new Set([...WORDS, ...END_WORDS, ...RIMES.flatMap((rime) => FAMILIES[rime])]),
] as const;
export type PictureWord = Word | (typeof END_WORDS)[number] | (typeof FAMILIES)[Rime][number];

/** Level 10's words: every pictured word except those ending in x, whose "ks" is two sounds. */
export const LAST_WORDS = PICTURE_WORDS.filter((w) => !w.endsWith('x'));

/** Letters that are each other's mirror (b d p q, i l): a word holding two would ask her to tell them apart unheard. */
const MIRRORS = ['bdpq', 'il'];

/**
 * Level 11's words: every pictured word with one box per sound, so no x ("ks" is two sounds) and no letter twice (pop),
 * and no mirror pair inside a word.
 */
export const SLOW_WORDS = PICTURE_WORDS.filter(
  (w) =>
    !w.includes('x') &&
    new Set(w).size === w.length &&
    !MIRRORS.some((set) => w.split('').filter((l) => set.includes(l)).length > 1),
);

/**
 * Level 13's words, written as their sounds: each holds a team (chick holds two), and every team is used. The team
 * stands first (ship) or last (fish, duck, bath), so where it goes is a thing to hear. Pictured, with no mirror pair (b d p q,
 * i l) and no other two-letter sound (shell's ll is left out).
 */
export const TEAM_SPELLINGS = {
  fish: ['f', 'i', 'sh'],
  dish: ['d', 'i', 'sh'],
  ship: ['sh', 'i', 'p'],
  chick: ['ch', 'i', 'ck'],
  duck: ['d', 'u', 'ck'],
  sock: ['s', 'o', 'ck'],
  rock: ['r', 'o', 'ck'],
  bath: ['b', 'a', 'th'],
  moth: ['m', 'o', 'th'],
} as const satisfies Record<string, readonly string[]>;
export type TeamWord = keyof typeof TEAM_SPELLINGS;
export const TEAM_WORDS = Object.keys(TEAM_SPELLINGS) as TeamWord[];

// Each group changes a different slot. Both words have familiar pronunciations and existing pictures.
// Keep the groups disjoint so a word only appears once in a round, even when the pair is reversed.
const REPAIR_PAIRS: readonly (readonly (readonly [PictureWord, PictureWord])[])[] = [
  [
    ['hat', 'mat'],
    ['hen', 'ten'],
    ['net', 'pet'],
    ['pig', 'wig'],
  ],
  [
    ['map', 'mop'],
    ['bag', 'bug'],
    ['pen', 'pin'],
    ['dog', 'dig'],
  ],
  [
    ['cat', 'can'],
    ['rug', 'run'],
    ['bus', 'bun'],
    ['hog', 'hop'],
  ],
];

export interface Question {
  /** The letter asked for (find/who/first), or the word to build. */
  answer: string;
  /** Monsters on the ground: letters, in screen order. */
  monsters: string[];
  /** Letters already standing in fixed slots: a family ending (level 7) or beginning (level 8). */
  fixed?: string;
  /** Level 10: the pictured word whose last sound is the answer. */
  word?: PictureWord;
  /** Level 12: the pet's word and the slot that needs replacing. */
  repair?: { word: PictureWord; slot: number };
  /** Level 13: the word's sounds, one per box, where a two-letter team is one unit (fish: f, i, sh). */
  units?: string[];
}

/** The word's boxes, one unit each: a letter, or on level 13 a two-letter team. */
export const unitsOf = (q: Question): readonly string[] => q.units ?? q.answer.split('');

/**
 * Level 15's letter: the first letter of her name (accents dropped), or Pip's p when the name has no Latin letter or is
 * the couch's stand-in "friend". `own` says which, so the voice never tells her a borrowed letter starts her name.
 */
export function myLetter(childName: string): { letter: string; own: boolean; name: string } {
  const letters = childName.trim().toLowerCase() === 'friend' ? '' : latinLetters(childName).toLowerCase();
  return letters
    ? { letter: letters[0], own: true, name: letters }
    : { letter: 'p', own: false, name: 'pip' };
}

/** Capitals that look alike (the tummy shows both cases, Dd), kept apart from her letter on level 15. */
const CAPITAL_LOOKALIKES = ['mw', 'nz', 'ef', 'cgoq', 'pr', 'ij'];
export const capitalLookalike = (a: string, b: string) =>
  a !== b && CAPITAL_LOOKALIKES.some((set) => set.includes(a) && set.includes(b));

/**
 * Level 15's round: her letter in every question among two others that are not in her name and look like neither it
 * (small or capital) nor each other. The spares change each question when they can, and her letter never stands in the
 * same place twice running, so she looks rather than taps a spot. A name holding most of the alphabet borrows its
 * other letters back rather than run short.
 */
export function mineQuestions(plan: MonsterPlan, rng: Rng, childName: string): Question[] {
  const { letter, name } = myLetter(childName);
  const fair = WHO_POOL.filter(
    (l) => l !== letter && !lookalike(l, letter) && !capitalLookalike(l, letter) && !soundTwin(l, letter),
  );
  const outside = fair.filter((l) => !name.includes(l));
  const pool = outside.length >= plan.choices + 2 ? outside : fair;
  const out: Question[] = [];
  let last: string[] = [];
  for (let i = 0; i < plan.rounds; i++) {
    const fresh = pool.filter((l) => !last.includes(l));
    const spares: string[] = [];
    for (const l of rng.shuffle([...(fresh.length >= plan.choices - 1 ? fresh : pool)])) {
      if (spares.length >= plan.choices - 1) break;
      if (spares.some((o) => lookalike(o, l) || capitalLookalike(o, l) || soundTwin(o, l))) continue;
      spares.push(l);
    }
    let monsters = rng.shuffle([letter, ...spares]);
    const before = out.at(-1)?.monsters.indexOf(letter);
    if (monsters.indexOf(letter) === before) {
      const at = (before + 1 + rng.int(0, plan.choices - 2)) % plan.choices;
      monsters = monsters.filter((l) => l !== letter);
      monsters.splice(at, 0, letter);
    }
    out.push({ answer: letter, monsters });
    last = monsters;
  }
  return out;
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

/** A round's questions; level 15 reads her name (`ctx.childName`), every other level ignores it. */
export function makeQuestions(plan: MonsterPlan, rng: Rng, childName = ''): Question[] {
  if (plan.mode === 'mine') return mineQuestions(plan, rng, childName);
  const out: Question[] = [];
  if (plan.mode === 'repair') {
    return rng.shuffle(
      REPAIR_PAIRS.map((pairs, slot) => {
        const [answer, word] = rng.shuffle([...rng.pick(pairs)]);
        const pool = WHO_POOL.filter((letter) => letter !== word[slot] && !answer.includes(letter));
        return {
          answer,
          repair: { word, slot },
          monsters: pickLetters(rng, plan.choices, [answer[slot]], pool),
        };
      }),
    );
  }
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
    return rng
      .shuffle(Object.entries(END_DECOYS))
      .slice(0, plan.rounds)
      .map(([fixed, decoys]) => {
        const answer = rng.pick(END_WORDS.filter((word) => word.startsWith(fixed)));
        return { answer, fixed, monsters: pickLetters(rng, plan.choices, [answer[2]], decoys) };
      });
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
  if (plan.mode === 'slow') {
    // The spare comes from the plain-sound pool and never sounds like or looks like a needed letter.
    for (const word of rng.shuffle([...(plan.words ?? SLOW_WORDS)]).slice(0, plan.rounds)) {
      out.push({ answer: word, monsters: pickLetters(rng, plan.choices, word.split(''), WHO_POOL) });
    }
    return out;
  }
  if (plan.mode === 'team') {
    // Three words with different teams where it can, so the round asks for more than one.
    const teams = new Set<string>();
    const words: TeamWord[] = [];
    const shuffled = rng.shuffle([...TEAM_WORDS]);
    for (const word of shuffled) {
      const team = teamOf(TEAM_SPELLINGS[word]);
      if (words.length < plan.rounds && team && !teams.has(team)) {
        teams.add(team);
        words.push(word);
      }
    }
    for (const word of shuffled) if (words.length < plan.rounds && !words.includes(word)) words.push(word);
    for (const word of words) {
      const units = [...TEAM_SPELLINGS[word]];
      out.push({ answer: word, units, monsters: teamMonsters(rng, units, plan.choices) });
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

/** The two-letter team among a word's units, if any. */
export const teamOf = (units: readonly string[]) => units.find((u) => u.length > 1);

/**
 * Level 13's monsters: the word's units and spares. About half the time the spare is one letter of the word's team (s
 * beside sh), so she must hear that two letters make the sound; never both letters, and never a lone c or k beside ck,
 * which would say the same sound. Other spares come from the plain-sound pool and never sound or look like a unit.
 */
export function teamMonsters(rng: Rng, units: readonly string[], n: number): string[] {
  const near = (a: string, b: string) => a === b || lookalike(a, b) || soundTwin(a, b);
  const teams = units.filter((u) => u.length > 1);
  const singles = units.filter((u) => u.length === 1);
  // Never a letter that looks or sounds like a single-letter unit, or that says a team's sound (c or k beside ck).
  const unsafe = (l: string) => singles.some((u) => near(u, l)) || teams.some((t) => soundTwin(t, l));
  const halves = [...new Set(teams.flatMap((t) => [...t]))].filter((l) => !unsafe(l));
  const spares: string[] = [];
  if (halves.length && rng.chance(0.5)) spares.push(rng.pick(halves));
  for (const l of rng.shuffle([...WHO_POOL])) {
    if (units.length + spares.length >= n) break;
    // Plain spares share no letter with a team, so the half-team decoy stays the only one.
    if (unsafe(l) || teams.some((t) => t.includes(l)) || spares.some((s) => near(s, l))) continue;
    spares.push(l);
  }
  return rng.shuffle([...units, ...spares]);
}

/** A big round's monsters, one per touch, all different, each with a first-word picture to keep. */
export function bigLetters(rng: Rng, n = BIG_PLAN.rounds): string[] {
  return rng.shuffle(Object.keys(FIRST_WORDS)).slice(0, n);
}

/**
 * Building a word: may `letter` (a letter, or a two-letter team) go into the next empty slot? Slots fill left to right;
 * `word` is the word or its units.
 */
export const fits = (word: string | readonly string[], filled: number, letter: string) =>
  word[filled] === letter;

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
  if (
    plan.mode === 'build' ||
    plan.mode === 'spell' ||
    plan.mode === 'slow' ||
    plan.mode === 'family' ||
    plan.mode === 'end' ||
    plan.mode === 'repair' ||
    plan.mode === 'team'
  )
    return monsters.find((m) => !m.placed && fits(unitsOf(q), filled, m.letter));
  return monsters.find((m) => m.letter === q.answer);
}
