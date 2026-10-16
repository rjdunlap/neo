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
  w('ap', 'ple'), w('or', 'ange'), w('lem', 'on'), w('bal', 'loon'), w('flow', 'er'), w('bun', 'ny'), w('piz', 'za'), w('rain', 'bow'), w('pen', 'cil'), w('win', 'dow'), w('spi', 'der'),
  // Three claps
  w('ba', 'na', 'na'), w('but', 'ter', 'fly'), w('um', 'brel', 'la'), w('la', 'dy', 'bug'), w('blue', 'ber', 'ries'), w('to', 'ma', 'to'), w('straw', 'ber', 'ry'), w('pine', 'ap', 'ple'),
  // Four claps
  w('wa', 'ter', 'mel', 'on'), w('hel', 'i', 'cop', 'ter'), w('cat', 'er', 'pil', 'lar'),
];

export const byCount = (n: number) => WORDS.filter((x) => syllables(x) === n);

export type ClapMode = 'along' | 'solo' | 'sort' | 'match' | 'train' | 'compare';

export interface ClapPlan {
  mode: ClapMode;
  /** Words per round ('along', 'solo'), pictures to sort ('sort'), questions ('match', 'compare') or trains to line up ('train', three pictures each). */
  count: number;
  /** The most beats a word in this level has. */
  max: 2 | 3 | 4;
  name: string;
}

export const PLANS: ClapPlan[] = [
  { mode: 'along', count: 3, max: 2, name: 'Clap along with the pet: one clap for each beat in a word' },
  { mode: 'solo', count: 3, max: 3, name: 'Clap a word by yourself: count its beats' },
  { mode: 'sort', count: 5, max: 3, name: 'Sort pictures by how many claps are in their names' },
  { mode: 'match', count: 4, max: 3, name: 'Hear the claps, then find the picture with that many beats' },
  { mode: 'sort', count: 8, max: 4, name: 'Sort longer words by one, two, three or four claps' },
  { mode: 'train', count: 3, max: 4, name: 'Beat train: line up three pictures from fewest claps to most' },
];

/** Cars in a beat train: the pictures in one 'train' question. */
export const CARS = 3;

export const COMPARE_LEVEL = 8;
export const COMPARE_PLAN: ClapPlan = { mode: 'compare', count: 4, max: 4, name: 'Longer or shorter? Choose the word with more or fewer claps' };

export const planFor = (level: number) => level === COMPARE_LEVEL ? COMPARE_PLAN : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Question {
  /** One word to clap ('along', 'solo'), the pictures to sort ('sort'), the pictures to choose from ('match', 'compare'), or the jumble to line up ('train'). */
  words: Word[];
  /** Answer's clap count: the played count in match, the requested larger/smaller count in compare. */
  target?: number;
  /** Comparison direction; every pair has unequal counts. */
  comparison?: 'more' | 'fewer';
}

/** The exact answer to a matching or comparison question, shared by judging, support and the finger. */
export const answerOf = (q: Question) => q.words.find((x) => syllables(x) === q.target)!;

/** The questions for one round. Words never repeat within a round. */
export function makeQuestions(plan: ClapPlan, rng: Rng): Question[] {
  const counts = Array.from({ length: plan.max }, (_, i) => i + 1);
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
    while (picked.length < plan.count) {
      const available = counts.filter((n) => pools.get(n)!.length > picked.filter((selected) => selected === n).length);
      picked.push(rng.pick(available));
    }
    return [{ words: rng.shuffle(picked.map(take)) }];
  }
  if (plan.mode === 'train') {
    // Each train has at least two different clap counts, so there is an order to find; a third picture may tie with one of them.
    const left = (n: number) => pools.get(n)!.length;
    return Array.from({ length: plan.count }, () => {
      const first = rng.pick(counts.filter((n) => left(n) > 0));
      const second = rng.pick(counts.filter((n) => n !== first && left(n) > 0));
      const picked = [first, second];
      picked.push(rng.pick(counts.filter((n) => left(n) > picked.filter((p) => p === n).length)));
      return { words: rng.shuffle(picked.map(take)) };
    });
  }
  if (plan.mode === 'compare') {
    const first = rng.pick(['more', 'fewer'] as const);
    return Array.from({ length: plan.count }, (_, i) => {
      const a = rng.pick(counts.filter((n) => pools.get(n)!.length > 0));
      const b = rng.pick(counts.filter((n) => n !== a && pools.get(n)!.length > 0));
      const comparison = i % 2 === 0 ? first : first === 'more' ? 'fewer' : 'more';
      return { comparison, target: comparison === 'more' ? Math.max(a, b) : Math.min(a, b), words: rng.shuffle([take(a), take(b)]) };
    });
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

/** How full the wait ring is (0 to 1): it fills across the `PAUSE` after her last clap, so she can see the word is about to be counted. 0 before her first clap. */
export const waitFill = (clock: number, lastClap: number, claps: number, pause = PAUSE) => (claps > 0 ? Math.min(1, Math.max(0, (clock - lastClap) / pause)) : 0);

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

/** The beat train, fewest claps to most: the clap count each car holds, left to right. Equal counts may go either way round. */
export const trainCounts = (words: readonly Word[]) => words.map(syllables).sort((a, b) => a - b);

/** Whether a picture belongs in an empty car: the car's place in the fewest-to-most line has as many claps as the picture. */
export const fitsCar = (words: readonly Word[], cars: readonly (Word | undefined)[], word: Word, car: number) =>
  car >= 0 && car < words.length && !cars[car] && trainCounts(words)[car] === syllables(word);

/**
 * What goes next in a beat train, for the hint and the ghost finger: the first empty car, and a picture still waiting
 * whose claps fit it.
 */
export function nextForTrain<C extends { word: Word; loaded: boolean }>(words: readonly Word[], cars: readonly (Word | undefined)[], cards: readonly C[]): { card: C; car: number } | undefined {
  const car = words.findIndex((_, i) => !cars[i]);
  if (car < 0) return undefined;
  const card = cards.find((c) => !c.loaded && fitsCar(words, cars, c.word, car));
  return card ? { card, car } : undefined;
}
