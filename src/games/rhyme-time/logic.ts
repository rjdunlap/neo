import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Rhyme Time: pictures that say their names. Find the one that rhymes with a word, then the two
 * that rhyme with each other, then the odd one out of a rhyming group. Rhymes are grouped by
 * sound family, so a distractor is never accidentally a rhyme.
 */
export type RhymeMode = 'match' | 'pair' | 'odd' | 'riddle' | 'riddle2' | 'make' | 'scene' | 'baskets';

export interface RhymePlan {
  mode: RhymeMode;
  /** Pictures to choose from. */
  choices: number;
  questions: number;
  name: string;
}

export const PLANS: RhymePlan[] = [
  { mode: 'match', choices: 3, questions: 4, name: 'Which one rhymes with "cat"? Three pictures to choose from' },
  { mode: 'match', choices: 4, questions: 4, name: 'Which one rhymes? Four pictures to choose from' },
  { mode: 'pair', choices: 4, questions: 4, name: 'Find the two pictures that rhyme with each other' },
  { mode: 'odd', choices: 4, questions: 4, name: 'Odd one out: three rhyme, one does not' },
  { mode: 'riddle', choices: 3, questions: 4, name: 'Riddle: sound clue, then meaning clue' },
  { mode: 'riddle2', choices: 4, questions: 4, name: 'Riddle: meaning clue first, a fourth decoy' },
  { mode: 'make', choices: 3, questions: 3, name: 'Your turn: make the riddle' },
  { mode: 'scene', choices: 3, questions: 4, name: 'Silly pairs: who rides in the truck? The rider that rhymes hops in' },
  { mode: 'scene', choices: 2, questions: 3, name: 'Silly pairs, two to choose: three scenes, the rider or one other picture' },
];

/**
 * Pre-K plays the first riddle (5) after pairs; odd one out (4) and the meaning-first and make-it riddles (6–7) stay school.
 * Silly pairs (8) is a single rhyme judgment with a place to say it in, so it sits second on both ladders. Rhyme baskets (10)
 * holds three families at once, so it tops the school ladder only. Level 9 is level 8 with two pictures and three scenes, the
 * place's word said twice: recognising a rhyme between two pictures is the preschool opening, an entry level the older ladders skip.
 */
export const LEVELS: BandLevels = {
  preschool: { min: 8, max: 9, order: [9, 8] },
  prek: { min: 1, max: 8, order: [1, 8, 2, 3, 5] },
  school: { min: 2, max: 10, order: [2, 8, 3, 4, 5, 6, 7, 10] },
};

/** Level 10 sits on its own ID, after level 9 (the preschool opening). */
export const BASKETS: RhymePlan = { mode: 'baskets', choices: 6, questions: 2, name: 'Rhyme baskets: drag six pictures into three baskets by rhyme, two trays' };

export const planFor = (level: number) => (level >= 10 ? BASKETS : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1]);

/** Rhyme families of words we can draw. */
export const FAMILIES: Record<string, string[]> = {
  at: ['cat', 'hat', 'bat'],
  og: ['dog', 'log', 'frog'],
  ee: ['bee', 'tree', 'key'],
  ar: ['star', 'car', 'jar'],
  oon: ['moon', 'spoon'],
  ish: ['fish', 'dish'],
  ake: ['cake', 'snake'],
  ear: ['bear', 'pear', 'chair'],
  uck: ['duck', 'truck'],
  oat: ['boat', 'coat'],
  ell: ['bell', 'shell'],
  ing: ['ring', 'king'],
  ug: ['bug', 'mug', 'rug'],
  ock: ['sock', 'clock', 'rock'],
  ail: ['snail', 'pail', 'whale'],
};

export const familyOf = (word: string) => Object.keys(FAMILIES).find((f) => FAMILIES[f].includes(word))!;
export const rhymes = (a: string, b: string) => a !== b && familyOf(a) === familyOf(b);

export interface RhymeQuestion {
  /** 'match': the word to rhyme with. */
  prompt?: string;
  /** The pictures shown, in order. */
  words: string[];
  /** The right picture(s): one for match and odd, two for pair. */
  answer: string[];
}

export function makeQuestions(plan: RhymePlan, rng: Rng): RhymeQuestion[] {
  if (plan.mode === 'scene') return makeScenes(plan, rng);
  const out: RhymeQuestion[] = [];
  const families = rng.shuffle(Object.keys(FAMILIES));
  const big = families.filter((f) => FAMILIES[f].length >= 3);
  for (let i = 0; i < plan.questions; i++) {
    // Distractors come from other families, one word each, so none rhyme with anything else shown.
    const pick = (exclude: string[], n: number) => rng.shuffle(families.filter((f) => !exclude.includes(f))).slice(0, n).map((f) => rng.pick(FAMILIES[f]));
    if (plan.mode === 'match') {
      const fam = families[i % families.length];
      const [prompt, answer] = rng.shuffle([...FAMILIES[fam]]);
      out.push({ prompt, words: rng.shuffle([answer, ...pick([fam], plan.choices - 1)]), answer: [answer] });
    } else if (plan.mode === 'pair') {
      const fam = families[i % families.length];
      const pair = rng.shuffle([...FAMILIES[fam]]).slice(0, 2);
      out.push({ words: rng.shuffle([...pair, ...pick([fam], plan.choices - 2)]), answer: pair });
    } else {
      const fam = big[i % big.length];
      const odd = pick([fam], 1)[0];
      out.push({ words: rng.shuffle([...FAMILIES[fam], odd]), answer: [odd] });
    }
  }
  return out;
}

/**
 * The picture a capable child taps next: the one that rhymes (match), the odd one out (odd), or, to find a rhyming pair, the
 * first of the pair and then the other one. `picked` is the first card of a pair already chosen. Always a right one.
 */
export function wordToTap(plan: RhymePlan, q: RhymeQuestion, picked: string | null): string {
  if (plan.mode === 'pair' && picked) return q.answer.find((w) => w !== picked)!;
  return q.answer[0];
}

// Silly pairs (levels 8 and 9) --------------------------------------------------------------

/**
 * A place and the rider that rhymes with it: "a duck in a truck". `anchor` is where the rider sits, in the place picture's
 * own units (before the scene's scale); `behind` riders sit inside, drawn behind the place so only their top shows (the jar's star sits in front, so the jam does not hide it).
 * Boat and goat would make a scene, but there is no goat to draw.
 */
export interface Scene {
  place: string;
  rider: string;
  prep: 'in' | 'on';
  anchor: { x: number; y: number };
  behind?: boolean;
}

export const SCENES: readonly Scene[] = [
  { place: 'truck', rider: 'duck', prep: 'in', anchor: { x: -24, y: -62 }, behind: true },
  { place: 'log', rider: 'frog', prep: 'on', anchor: { x: -6, y: -48 } },
  { place: 'chair', rider: 'bear', prep: 'on', anchor: { x: 0, y: -26 } },
  { place: 'hat', rider: 'cat', prep: 'in', anchor: { x: 0, y: -68 }, behind: true },
  { place: 'dish', rider: 'fish', prep: 'in', anchor: { x: 0, y: -16 }, behind: true },
  { place: 'jar', rider: 'star', prep: 'in', anchor: { x: 0, y: 2 } },
  { place: 'tree', rider: 'bee', prep: 'in', anchor: { x: 14, y: -20 } },
  { place: 'spoon', rider: 'moon', prep: 'on', anchor: { x: 0, y: -40 } },
  { place: 'cake', rider: 'snake', prep: 'on', anchor: { x: 0, y: -26 } },
  { place: 'rug', rider: 'bug', prep: 'on', anchor: { x: 0, y: 0 } },
  { place: 'pail', rider: 'snail', prep: 'in', anchor: { x: 0, y: -62 }, behind: true },
  { place: 'rock', rider: 'sock', prep: 'on', anchor: { x: 0, y: -62 } },
];

export const sceneFor = (place: string) => SCENES.find((s) => s.place === place)!;

/** A round of scenes, each a different place; the rider and one picture from each of two other families, none rhyming with the place or each other. */
function makeScenes(plan: RhymePlan, rng: Rng): RhymeQuestion[] {
  return rng.shuffle([...SCENES]).slice(0, plan.questions).map((s) => {
    const fam = familyOf(s.place);
    const others = rng.shuffle(Object.keys(FAMILIES).filter((f) => f !== fam)).slice(0, plan.choices - 1).map((f) => rng.pick(FAMILIES[f]));
    return { prompt: s.place, words: rng.shuffle([s.rider, ...others]), answer: [s.rider] };
  });
}

// Rhyme baskets (level 10) -------------------------------------------------------------

/** One tray: three baskets, each with its key picture on the front, and the six pictures to sort, two rhyming with each key. */
export interface Tray {
  keys: string[];
  words: string[];
}

/**
 * A round of trays. Each takes three different three-word families (the big ones, so every key has two mates), one word as
 * the key and the other two in the tray; across the round's two trays no family repeats, so the second tray is fresh.
 */
export function makeTrays(plan: RhymePlan, rng: Rng): Tray[] {
  const big = rng.shuffle(Object.keys(FAMILIES).filter((f) => FAMILIES[f].length >= 3));
  const out: Tray[] = [];
  for (let i = 0; i < plan.questions; i++) {
    const fams = big.slice(i * 3, i * 3 + 3);
    const keys: string[] = [];
    const words: string[] = [];
    for (const f of fams) {
      const [key, ...rest] = rng.shuffle([...FAMILIES[f]]);
      keys.push(key);
      words.push(...rest);
    }
    out.push({ keys, words: rng.shuffle(words) });
  }
  return out;
}

/** The basket a picture belongs in: the index of the key it rhymes with (-1 if none). */
export const basketFor = (word: string, keys: readonly string[]) => keys.findIndex((k) => rhymes(k, word));

/** A basket's family as the baskets sing it at the end of a tray: the key first, then the two pictures that went in. */
export const familySong = (key: string) => [key, ...FAMILIES[familyOf(key)].filter((w) => w !== key)];

/** Says a list with "and": "cat, star and bug". */
export const andList = (words: readonly string[]) => `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

// Rhyme Riddles (levels 5–7) -----------------------------------------------------------

/**
 * Meaning tags: each is one spoken clue, and the fact said when a picture fails it. Tags are generous (a picture that
 * arguably fits gets the tag), which only keeps it out of the roles where it must not fit. Reviewed in the definition
 * (docs/definitions/rhyme-riddles.md), with the build's generous additions (a bat is furry and seen in the sky, people eat
 * fish, dogs swim, ducks and snakes are kept as pets, cars, trucks and boats carry things), and the fresh families' tags reviewed in docs/deep-dives/rhyme-time.md (a clock
 * and a snail hold none, so they only ever serve as a mate or a neutral); nothing is generated.
 */
export const TAGS = {
  wear: { clue: 'You wear it.', fact: 'you do not wear it', words: ['hat', 'coat', 'ring', 'sock'] },
  eat: { clue: 'You can eat it.', fact: 'you do not eat it', words: ['pear', 'cake', 'fish'] },
  eatwith: { clue: 'You eat with it.', fact: 'you do not eat with it', words: ['spoon', 'dish'] },
  sit: { clue: 'You can sit on it.', fact: 'you do not sit on it', words: ['chair', 'log', 'rug', 'rock'] },
  ride: { clue: 'You can ride in it.', fact: 'you do not ride in it', words: ['car', 'truck', 'boat'] },
  fly: { clue: 'It can fly.', fact: 'it does not fly', words: ['bee', 'bat', 'duck', 'bug'] },
  swim: { clue: 'It can swim.', fact: 'it does not swim', words: ['fish', 'duck', 'frog', 'dog', 'whale'] },
  pet: { clue: 'It can be a pet.', fact: 'it is not a pet', words: ['cat', 'dog', 'fish', 'frog', 'duck', 'snake'] },
  fur: { clue: 'It is furry.', fact: 'it is not furry', words: ['cat', 'dog', 'bear', 'king', 'bat'] },
  sky: { clue: 'You can see it in the sky.', fact: 'you do not see it in the sky', words: ['star', 'moon', 'bat', 'bee', 'duck'] },
  grows: { clue: 'It grows outside.', fact: 'it does not grow outside', words: ['tree', 'pear'] },
  holds: { clue: 'You can put things in it.', fact: 'you do not put things in it', words: ['jar', 'dish', 'car', 'truck', 'boat', 'mug', 'pail'] },
  opens: { clue: 'It opens a door.', fact: 'it does not open a door', words: ['key'] },
} as const satisfies Record<string, { clue: string; fact: string; words: readonly string[] }>;
export type Tag = keyof typeof TAGS;
export const TAG_IDS = Object.keys(TAGS) as Tag[];
export const holds = (word: string, tag: Tag) => (TAGS[tag].words as readonly string[]).includes(word);
/**
 * Pictures that arguably fit a clue without being worth a riddle of their own (a ladybird is seen in the sky, a snail can
 * be a pet, you might eat soup with a mug): never the answer, and never the mate or neutral that must fail that clue.
 */
export const ARGUABLE: Partial<Record<Tag, readonly string[]>> = { sky: ['bug'], pet: ['snail'], eatwith: ['mug'] };
/** The word plainly fails the clue: it neither holds the tag nor arguably fits it. */
export const fails = (word: string, tag: Tag) => !holds(word, tag) && !(ARGUABLE[tag] ?? []).includes(word);

/**
 * One riddle: "it rhymes with {clueWord}" keeps `answer` and `mate`; the meaning clue (`tag`) keeps `answer` and `trap`;
 * together they keep only `answer`. `clueWord` is spoken, never on the shelf. Level 6 adds `neutral`, which fails both;
 * level 7 adds `decoyWord` (a rhyme for the trap, not on the shelf) and `mateTag` (a tag only the mate holds).
 */
export interface Riddle {
  clueWord: string;
  answer: string;
  mate: string;
  trap: string;
  tag: Tag;
  neutral?: string;
  decoyWord?: string;
  mateTag?: Tag;
  /** The pictures on the shelf, in order. */
  words: string[];
}

/** Every riddle the tables allow (before the level's extras): a big family's two pictures, its third word spoken, and a trap from another family. */
export function allRiddles(): Omit<Riddle, 'words'>[] {
  const out: Omit<Riddle, 'words'>[] = [];
  for (const fam of Object.keys(FAMILIES).filter((f) => FAMILIES[f].length >= 3)) {
    for (const clueWord of FAMILIES[fam]) {
      for (const answer of FAMILIES[fam].filter((w) => w !== clueWord)) {
        const mate = FAMILIES[fam].find((w) => w !== clueWord && w !== answer)!;
        for (const tag of TAG_IDS.filter((t) => holds(answer, t) && fails(mate, t))) {
          for (const trap of TAGS[tag].words.filter((w) => familyOf(w) !== fam)) out.push({ clueWord, answer, mate, trap, tag });
        }
      }
    }
  }
  return out;
}

/** The tags a mate holds that neither the answer nor the trap does: the level-7 meaning chip that keeps only the mate. */
export const mateTags = (r: Pick<Riddle, 'answer' | 'mate' | 'trap'>) => TAG_IDS.filter((t) => holds(r.mate, t) && !holds(r.answer, t) && !holds(r.trap, t));

/** Level 6's fourth picture: from a third family, holding no tag the clue uses. */
const neutrals = (r: Pick<Riddle, 'answer' | 'trap' | 'tag'>) =>
  Object.keys(FAMILIES)
    .filter((f) => f !== familyOf(r.answer) && f !== familyOf(r.trap))
    .flatMap((f) => FAMILIES[f])
    .filter((w) => fails(w, r.tag));

/** A round of riddles, each with a different answer. Which riddle, its extras and the shelf order come from the seed. */
export function makeRiddles(plan: RhymePlan, rng: Rng): Riddle[] {
  const pool = rng.shuffle(allRiddles().filter((r) => plan.mode !== 'make' || mateTags(r).length > 0));
  const out: Riddle[] = [];
  for (const r of pool) {
    if (out.length >= plan.questions) break;
    if (out.some((o) => o.answer === r.answer)) continue;
    const riddle: Riddle = { ...r, words: [] };
    if (plan.mode === 'riddle2') riddle.neutral = rng.pick(neutrals(r));
    if (plan.mode === 'make') {
      riddle.decoyWord = rng.pick(FAMILIES[familyOf(r.trap)].filter((w) => w !== r.trap));
      riddle.mateTag = rng.pick(mateTags(r));
    }
    riddle.words = rng.shuffle([r.answer, r.mate, r.trap, ...(riddle.neutral ? [riddle.neutral] : [])]);
    out.push(riddle);
  }
  return out;
}

/** The pictures on the shelf that fit both clues: rhyming with `sound` and holding `tag`. */
export const fitsBoth = (words: readonly string[], sound: string, tag: Tag) => words.filter((w) => rhymes(w, sound) && holds(w, tag));

/** Level 7: the chips on offer, the sound pair and the meaning pair, each with the working one first. */
export const chipsFor = (r: Riddle) => ({ sound: [r.clueWord, r.decoyWord!], meaning: [r.tag, r.mateTag!] as Tag[] });

/** Level 7: what the pet finds from her two chips (the one picture both keep, or nothing). */
export const guessFor = (r: Riddle, sound: string, tag: Tag): string | null => fitsBoth(r.words, sound, tag)[0] ?? null;

/** Level 7: the next chip or button a capable child taps: the working sound chip, the working meaning chip, then Guess. */
export function makeTap(r: Riddle, sound: string | null, tag: Tag | null): { sound: string } | { tag: Tag } | 'guess' {
  if (sound !== r.clueWord) return { sound: r.clueWord };
  if (tag !== r.tag) return { tag: r.tag };
  return 'guess';
}

/** Says a shelf as a question: "the chair, the pear or the log". */
export const spokenList = (words: readonly string[]) => {
  const the = words.map((w) => `the ${w}`);
  return `${the.slice(0, -1).join(', ')} or ${the[the.length - 1]}`;
};
