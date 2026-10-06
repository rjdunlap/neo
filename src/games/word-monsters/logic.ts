import type { Rng } from '../../engine/random';

/**
 * Word Monsters, after Endless Alphabet and Reader Rabbit: every letter is a little monster
 * that says its sound. The ladder goes from tapping to hear sounds, to finding a letter,
 * to matching first sounds, to building simple words sound by sound.
 */
export type MonsterMode = 'play' | 'find' | 'who' | 'first' | 'build' | 'spell' | 'family';

export interface MonsterPlan {
  mode: MonsterMode;
  /** Questions or words in a round. */
  rounds: number;
  /** Monsters to choose from. */
  choices: number;
  name: string;
}

export const PLANS: MonsterPlan[] = [
  { mode: 'play', rounds: 10, choices: 4, name: 'Tap letter monsters to hear their sounds' },
  { mode: 'find', rounds: 4, choices: 2, name: 'Find a letter by name: "find B"' },
  { mode: 'who', rounds: 4, choices: 3, name: 'Find a letter by its sound: "who says mmm?"' },
  { mode: 'first', rounds: 4, choices: 3, name: 'First sounds: "apple starts with aah"' },
  { mode: 'build', rounds: 3, choices: 3, name: 'Build a three-letter word with letters shown in the slots' },
  { mode: 'spell', rounds: 3, choices: 4, name: 'Build a three-letter word from its sounds, with a spare letter' },
  { mode: 'family', rounds: 6, choices: 4, name: 'Word families: change the first sound to make hat, cat, bat (two families)' },
];

/** Word families: the ending stays, the first sound changes. Each word's onset is a plain consonant sound. */
export const FAMILIES: Record<string, string[]> = {
  at: ['cat', 'hat', 'bat', 'mat', 'rat', 'sat'],
  og: ['dog', 'log', 'fog', 'hog', 'jog'],
  ig: ['pig', 'dig', 'wig', 'big', 'fig'],
  un: ['sun', 'run', 'fun', 'bun'],
  op: ['top', 'mop', 'hop', 'pop'],
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/**
 * How each letter's sound is written for the device voice, which has no phonics.
 * These are stand-ins: recorded parent voices will replace them by line id (`sound.a`...).
 */
export const SOUNDS: Record<string, string> = {
  a: 'aah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm',
  n: 'nnn', o: 'aw', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz',
};

export const ALPHABET = Object.keys(SOUNDS);

/** Lowercase letters that are easy to mix up; never offered side by side. */
const LOOKALIKES = ['bdpq', 'mnu', 'il'];
export const lookalike = (a: string, b: string) => a !== b && LOOKALIKES.some((set) => set.includes(a) && set.includes(b));

/** Picture words whose first sound is the letter's plain sound (no ice cream, no xylophone). */
export const FIRST_WORDS: Record<string, string> = {
  a: 'apple', b: 'ball', c: 'cat', d: 'duck', e: 'egg', f: 'fish', g: 'grapes', h: 'house', j: 'jelly', k: 'kite', l: 'leaf', m: 'moon',
  n: 'nest', p: 'pig', r: 'rainbow', s: 'sun', t: 'tree', u: 'umbrella', w: 'whale', y: 'yo-yo', z: 'zebra',
};

/** Three-letter words we can draw, each sounded out letter by letter. */
export const WORDS = ['cat', 'dog', 'pig', 'sun', 'cup', 'hat', 'box'] as const;
export type Word = (typeof WORDS)[number];

export interface Question {
  /** The letter asked for (find/who/first), or the word to build. */
  answer: string;
  /** Monsters on the ground: letters, in screen order. */
  monsters: string[];
  /** Word families: the ending already standing in the slots after the first. */
  fixed?: string;
}

/** Pick `n` different letters including `must`, with no lookalikes among them. */
export function pickLetters(rng: Rng, n: number, must: string[], pool = ALPHABET): string[] {
  const out = [...must];
  for (const l of rng.shuffle([...pool])) {
    if (out.length >= n) break;
    if (out.includes(l) || out.some((o) => lookalike(o, l))) continue;
    out.push(l);
  }
  return rng.shuffle(out);
}

export function makeQuestions(plan: MonsterPlan, rng: Rng): Question[] {
  const out: Question[] = [];
  const pool = plan.mode === 'first' ? Object.keys(FIRST_WORDS) : plan.mode === 'find' ? 'abcdefghkmrstw'.split('') : ALPHABET;
  const used = new Set<string>();
  if (plan.mode === 'family') {
    // Two families, three words each; the other first sounds come from the family when they can, so hearing matters.
    for (const rime of rng.shuffle(Object.keys(FAMILIES)).slice(0, plan.rounds / 3)) {
      const onsets = FAMILIES[rime].map((w) => w[0]);
      for (const word of rng.shuffle([...FAMILIES[rime]]).slice(0, 3)) {
        out.push({ answer: word, fixed: rime, monsters: pickLetters(rng, plan.choices, [word[0]], [...rng.shuffle(onsets), ...'cfhjlmnrstw'.split('')]) });
      }
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

/** Building a word: may `letter` go into the next empty slot? Slots fill left to right. */
export const fits = (word: string, filled: number, letter: string) => word[filled] === letter;

/** "kuh, aah, tuh" for the voice. */
export const sounded = (word: string) => word.split('').map((l) => SOUNDS[l]).join(', ');
