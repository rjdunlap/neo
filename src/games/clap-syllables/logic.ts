import type { Rng } from '../../engine/random';

/**
 * Clap the Syllables: words are made of beats. The pet claps a word one beat at a time and she claps along, then claps
 * a word by herself, sorts pictures by how many claps are in their names, and finally hears some claps and finds the
 * picture with that many. Every word has a picture and a known number of beats, so a count is never ambiguous.
 */
export interface Word {
  word: string;
  /** The beats, written out. They are the word, in order: the parts put together spell it. */
  parts: string[];
}

export const syllables = (w: Word) => w.parts.length;
const w = (...parts: string[]): Word => ({ word: parts.join(''), parts });

/** Words with a picture (see `art.ts`): the one-beat words are Rhyme Time's drawings, the others props and new pictures. */
export const WORDS: readonly Word[] = [
  // One clap
  w('cat'), w('dog'), w('duck'), w('frog'), w('bee'), w('tree'), w('star'), w('moon'), w('fish'), w('cake'), w('boat'), w('hat'), w('bell'), w('car'), w('bear'), w('key'),
  // Two claps
  w('ap', 'ple'), w('or', 'ange'), w('lem', 'on'), w('bal', 'loon'), w('flow', 'er'), w('bun', 'ny'),
  // Three claps
  w('ba', 'na', 'na'), w('but', 'ter', 'fly'), w('um', 'brel', 'la'), w('la', 'dy', 'bug'), w('blue', 'ber', 'ries'),
];

export const byCount = (n: number) => WORDS.filter((x) => syllables(x) === n);

export type ClapMode = 'along' | 'solo' | 'sort' | 'match';

export interface ClapPlan {
  mode: ClapMode;
  /** Words per round ('along', 'solo'), pictures to sort ('sort') or questions ('match'). */
  count: number;
  /** The most beats a word in this level has. */
  max: 2 | 3;
  name: string;
}

export const PLANS: ClapPlan[] = [
  { mode: 'along', count: 3, max: 2, name: 'Clap along with the pet: one clap for each beat in a word' },
  { mode: 'solo', count: 3, max: 3, name: 'Clap a word by yourself: count its beats' },
  { mode: 'sort', count: 5, max: 3, name: 'Sort pictures by how many claps are in their names' },
  { mode: 'match', count: 4, max: 3, name: 'Hear the claps, then find the picture with that many beats' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Question {
  /** One word to clap ('along', 'solo'), the pictures to sort ('sort'), or the pictures to choose from ('match'). */
  words: Word[];
  /** 'match': how many claps are played; exactly one picture has that many. */
  target?: number;
}

/** The word in a 'match' question that has the claps that were played. */
export const answerOf = (q: Question) => q.words.find((x) => syllables(x) === q.target)!;

/** The questions for one round. Words never repeat within a round. */
export function makeQuestions(plan: ClapPlan, rng: Rng): Question[] {
  const counts = plan.max === 2 ? [1, 2] : [1, 2, 3];
  const pool = (n: number) => rng.shuffle(byCount(n));
  const pools = new Map(counts.map((n) => [n, pool(n)]));
  const take = (n: number) => pools.get(n)!.pop()!;

  if (plan.mode === 'along' || plan.mode === 'solo') {
    // Every beat count shows up at least once, so she is not just clapping the same thing.
    const picked = [...counts.slice(0, plan.count)];
    while (picked.length < plan.count) picked.push(rng.pick(counts));
    return rng.shuffle(picked).map((n) => ({ words: [take(n)] }));
  }
  if (plan.mode === 'sort') {
    const picked = [...counts];
    while (picked.length < plan.count) picked.push(rng.pick(counts));
    return [{ words: rng.shuffle(picked.map(take)) }];
  }
  // match: each question shows one picture of each size and plays one of those sizes.
  const targets = rng.shuffle([...counts]);
  while (targets.length < plan.count) targets.push(rng.pick(counts));
  return targets.slice(0, plan.count).map((target) => ({ target, words: rng.shuffle(counts.map(take)) }));
}

/** "one clap", "two claps": the spoken count. */
export const clapsWord = (n: number) => `${['zero', 'one', 'two', 'three', 'four'][n] ?? n} ${n === 1 ? 'clap' : 'claps'}`;

/** Seconds of quiet after the last clap before a word she clapped by herself is counted. */
export const PAUSE = 1.5;

/**
 * What a capable child does next, for the ghost finger. Clapping a word: a clap for each beat still to go (none once the
 * beats are in, when the game counts them by itself). Sorting: carry the first picture still in the tray to the hoop for its beats.
 * Matching: the picture with as many beats as were played.
 */
export const clapsToGo = (word: Word, claps: number) => Math.max(0, syllables(word) - claps);

export function nextToSort<C extends { word: Word; sorted: boolean }, B extends { count: number }>(cards: readonly C[], bins: readonly B[]): { card: C; bin: B } | undefined {
  for (const card of cards) {
    const bin = bins.find((b) => b.count === syllables(card.word));
    if (!card.sorted && bin) return { card, bin };
  }
  return undefined;
}

export const pictureToTap = <C extends { word: Word }>(q: Question, cards: readonly C[]): C | undefined => cards.find((c) => c.word === answerOf(q));
