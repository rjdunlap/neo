import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Opposites: pictures of concept words in pairs (big and small, open and closed). On the lap,
 * tap the picture and it flips to its opposite while the word is spoken. Then find the one named,
 * then find the opposite of a picture among others, then match the opposite pairs, then spot the one pair among five,
 * then find the one in between two ends (empty, half full, full), then line the three up from one end to the other,
 * then find the opposite of a word heard with its picture hidden, then find the un- word (zipped, unzipped), then find
 * the two pictures that are both the opposite of a word with two meanings (light: heavy and dark).
 */
export type OppMode = 'switch' | 'find' | 'opposite' | 'pairs' | 'spot' | 'between' | 'order' | 'un' | 'two';

export interface OppPlan {
  level: number;
  mode: OppMode;
  rounds: number;
  name: string;
  /** Level 6, lap's opening: one big card, and a touch anywhere flips it; each flipped picture joins a row. */
  big?: boolean;
  /** Level 9: the asked word is only heard; its picture hides behind a speaker until the first miss reveals it. */
  hidden?: boolean;
  /** Level 12: one pair only (big and small, or hot and cold), the same animal, the side alternating flip after flip. */
  one?: boolean;
}

export const PLANS: OppPlan[] = [
  {
    level: 1,
    mode: 'switch',
    rounds: 8,
    name: 'Tap the picture: it flips to its opposite (big, small; open, closed)',
  },
  { level: 2, mode: 'find', rounds: 5, name: 'Find the one named: "find the big one"' },
  { level: 3, mode: 'opposite', rounds: 4, name: 'This one is hot: find its opposite among three' },
  { level: 4, mode: 'pairs', rounds: 2, name: 'Match three pairs of opposites' },
  { level: 5, mode: 'spot', rounds: 3, name: 'Which two are opposites? One pair hides among five pictures' },
];

/** Level 6, lap's opening before level 1 (after the ladder, so no saved level moves); toddler still starts at 1. */
export const BIG_LEVEL = 6;
export const BIG_PLAN: OppPlan = {
  level: BIG_LEVEL,
  mode: 'switch',
  big: true,
  rounds: 8,
  name: 'One big card: a touch anywhere flips it to its opposite, and each flipped picture joins a row (8 cards)',
};

/** Level 7, pre-K's top: three pictures of one gradable word, and she taps the one in between the two ends. */
export const BETWEEN_LEVEL = 7;
export const BETWEEN_PLAN: OppPlan = {
  level: BETWEEN_LEVEL,
  mode: 'between',
  rounds: 4,
  name: 'In between: three pictures (empty, half full, full); tap the one between the two ends',
};

/** Level 8, pre-K's new top: the same three shuffled; she taps them in order from the end named first to the other. */
export const ORDER_LEVEL = 8;
export const ORDER_PLAN: OppPlan = {
  level: ORDER_LEVEL,
  mode: 'order',
  rounds: 4,
  name: 'Line them up: the same three shuffled; tap them in order from empty to full, then the other way',
};

/** Level 9, the school window's own level: the opposite of a word heard, its picture hidden behind a speaker button. */
export const WORD_LEVEL = 9;
export const WORD_PLAN: OppPlan = {
  level: WORD_LEVEL,
  mode: 'opposite',
  hidden: true,
  rounds: 4,
  name: 'Only the word: the pet says a word (its picture hidden behind a speaker); find its opposite among three',
};

/**
 * Level 10, school's new top: a picture pair of one word and its un- word (zipped, unzipped), and she taps the un- one. The
 * word is heard, and shown in print with its "un" in a bubble of its own (reading-lite: the voice and pictures answer it).
 */
export const UN_LEVEL = 10;
export const UN_PLAN: OppPlan = {
  level: UN_LEVEL,
  mode: 'un',
  rounds: 4,
  name: 'Un- words: two pictures, like zipped and unzipped; hear (and see) the un- word and tap it',
};

/**
 * Level 11, school's new top: a word with two meanings has two opposites (light: heavy and dark), and she taps both. The four
 * cards are the two opposites, one more picture of the asked word itself (a feather, a lamp), and one unrelated picture.
 */
export const TWO_LEVEL = 11;
export const TWO_PLAN: OppPlan = {
  level: TWO_LEVEL,
  mode: 'two',
  rounds: 3,
  name: 'Two answers: some words have two opposites (light: heavy and dark); find both',
};

/**
 * Level 12, lap's gentlest opening (after the ladder, so no saved level moves): four flips of one pair, the same animal each
 * time, so a one-year-old hears "big… small… big… small". Nothing can be wrong.
 */
export const ONE_PAIR_LEVEL = 12;
export const ONE_PAIR_PLAN: OppPlan = {
  level: ONE_PAIR_LEVEL,
  mode: 'switch',
  one: true,
  rounds: 4,
  name: 'One pair, again and again: four flips of big and small (or hot and cold), the same friend each time',
};

export const LEVELS: BandLevels = {
  lap: { min: 1, max: ONE_PAIR_LEVEL, order: [ONE_PAIR_LEVEL, BIG_LEVEL, 1] },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  // Level 6 is lap's opening, so pre-K steps from 5 straight to 7, then 8.
  prek: { min: 3, max: ORDER_LEVEL, order: [3, 4, 5, BETWEEN_LEVEL, ORDER_LEVEL] },
  // School opens at Line them up, shared with pre-K's top, then hears the word alone, then un- words, then two answers.
  school: { min: ORDER_LEVEL, max: TWO_LEVEL },
};

export const planFor = (level: number) =>
  level === ONE_PAIR_LEVEL
    ? ONE_PAIR_PLAN
    : level === BIG_LEVEL
      ? BIG_PLAN
      : level === BETWEEN_LEVEL
        ? BETWEEN_PLAN
        : level === ORDER_LEVEL
          ? ORDER_PLAN
          : level === WORD_LEVEL
            ? WORD_PLAN
            : level === UN_LEVEL
              ? UN_PLAN
              : level === TWO_LEVEL
                ? TWO_PLAN
                : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Each concept has two sides; side 0 and side 1 are opposites. */
export const CONCEPTS = {
  size: { words: ['big', 'small'], family: 'size', from: 1 },
  mood: { words: ['happy', 'sad'], family: 'face', from: 1 },
  height: { words: ['up', 'down'], family: 'position', from: 1 },
  lid: { words: ['open', 'closed'], family: 'container', from: 1 },
  cup: { words: ['full', 'empty'], family: 'container', from: 1 },
  temp: { words: ['hot', 'cold'], family: 'temperature', from: 1 },
  sky: { words: ['day', 'night'], family: 'sky', from: 1 },
  speed: { words: ['fast', 'slow'], family: 'speed', from: 1 },
  stature: { words: ['tall', 'short'], family: 'size', from: 2 },
  lamp: { words: ['on', 'off'], family: 'lamp', from: 2 },
  wake: { words: ['awake', 'asleep'], family: 'face', from: 2 },
  basket: { words: ['in', 'out'], family: 'position', from: 2 },
  sponge: { words: ['wet', 'dry'], family: 'wet', from: 3 },
  plate: { words: ['clean', 'dirty'], family: 'clean', from: 3 },
  book: { words: ['thick', 'thin'], family: 'size', from: 3 },
  ball: { words: ['near', 'far'], family: 'position', from: 3 },
  // Level 10's un- words: each side 1 is "un" + side 0, and only words a picture can show being undone. Their own family
  // and level, so no earlier level's pool changes. Happy/unhappy is left out: "happy" already belongs to the mood pair.
  zip: { words: ['zipped', 'unzipped'], family: 'un', from: UN_LEVEL },
  tie: { words: ['tied', 'untied'], family: 'un', from: UN_LEVEL },
  lock: { words: ['locked', 'unlocked'], family: 'un', from: UN_LEVEL },
  wrap: { words: ['wrapped', 'unwrapped'], family: 'un', from: UN_LEVEL },
  button: { words: ['buttoned', 'unbuttoned'], family: 'un', from: UN_LEVEL },
  fold: { words: ['folded', 'unfolded'], family: 'un', from: UN_LEVEL },
} as const;

export type Concept = keyof typeof CONCEPTS;
export const CONCEPT_IDS = Object.keys(CONCEPTS) as Concept[];
/** Level 10's pairs: a word and its un- word. */
export const UN_CONCEPTS = CONCEPT_IDS.filter((c) => CONCEPTS[c].family === 'un');
/** The printed un- word split at its prefix ("un", "zipped"), for the separate "un" bubble. */
export const unParts = (c: Concept): [string, string] => {
  const un = CONCEPTS[c].words[1];
  return [un.slice(0, 2), un.slice(2)];
};

/**
 * The gradable words and the word for their middle: only these have an in between. Never open/closed, on/off or
 * awake/asleep (no middle), and never size (Size Parade owns ordering by size).
 */
export const MIDDLES = { cup: 'half full', temp: 'warm', sky: 'evening', height: 'middle' } as const;
export type Gradable = keyof typeof MIDDLES;
export const GRADABLE = Object.keys(MIDDLES) as Gradable[];

/** Variation changes the subject, never the meaning of the pair. */
export const SUBJECTS = { size: ['bear', 'duck', 'bunny'], mood: ['cat', 'dog', 'pig'] } as const;
export type Subject = (typeof SUBJECTS)[keyof typeof SUBJECTS][number];

/**
 * Level 11's authored words, each with two opposites (`right`) and two pictures that are the asked word itself (`same`: a
 * feather and a lamp are light too, so tapping one is never a miss). The same words are never in an earlier pool.
 */
export const TWO = {
  light: { right: ['heavy', 'dark'], same: ['feather', 'lamp'] },
  short: { right: ['tall', 'long'], same: ['pencil', 'flower'] },
  old: { right: ['new', 'young'], same: ['boot', 'tree'] },
} as const;
export type TwoWord = keyof typeof TWO;
export const TWO_WORDS = Object.keys(TWO) as TwoWord[];
/** Pictures for level 11's one unrelated card: other families than any of the three words, so it fits neither sense. */
export const TWO_DECOYS = ['temp', 'sponge', 'plate', 'speed'] as const satisfies readonly Concept[];

/** Level 12's two pairs, picked one per round set: both are shown by a picture that acts or changes plainly. */
export const ONE_PAIR_CONCEPTS = ['size', 'temp'] as const satisfies readonly Concept[];

export interface Card {
  /** Level 11's cards name their own meaning in `two`; `concept` is then only a placeholder. */
  two?: { w: TwoWord; kind: 'ask' | 'right' | 'same'; i: 0 | 1 };
  concept: Concept;
  side: 0 | 1;
  who?: Subject;
  /** Level 7: the picture in between the two sides (half full, warm, evening, the middle); `side` is then 0 and unused. */
  mid?: true;
}

export const word = (c: Card): string =>
  c.two
    ? c.two.kind === 'ask'
      ? c.two.w
      : TWO[c.two.w][c.two.kind === 'right' ? 'right' : 'same'][c.two.i]
    : c.mid
      ? MIDDLES[c.concept as Gradable]
      : CONCEPTS[c.concept].words[c.side];

/** A card's place on its word's line, counted from the end named first (`from`): 0, 1 for the middle, 2. */
export const degree = (c: Card, from: 0 | 1) => (c.mid ? 1 : c.side === from ? 0 : 2);

export interface OppRound {
  /** Cards on screen. */
  cards: Card[];
  /** The card asked for (find), the card shown whose opposite is wanted (opposite), or the end named first (between, order). */
  ask?: Card;
}

export const poolFor = (level: number): Concept[] => CONCEPT_IDS.filter((c) => CONCEPTS[c].from <= level);

/** Keep stickers independent of future playable-pool edits. */
export const STICKER_CONCEPTS = [
  'sky',
  'temp',
  'cup',
  'lid',
  'stature',
  'lamp',
  'wake',
  'basket',
] as const satisfies readonly Concept[];

/** Choose different families so incidental size, mood or container clues cannot supply a second reasonable answer. */
function differentFamilies(pool: readonly Concept[], rng: Rng, count: number, exclude?: Concept): Concept[] {
  const selected: Concept[] = [];
  const families = new Set(exclude ? [CONCEPTS[exclude].family] : []);
  for (const c of rng.shuffle([...pool])) {
    if (families.has(CONCEPTS[c].family)) continue;
    selected.push(c);
    families.add(CONCEPTS[c].family);
    if (selected.length === count) return selected;
  }
  throw new Error('Opposites pool needs more distinct families');
}

export function makeRounds(plan: OppPlan, rng: Rng): OppRound[] {
  const out: OppRound[] = [];
  if (plan.one) {
    // One pair for the whole level, the same animal throughout; the shown side alternates, so the words alternate too.
    const concept = rng.pick([...ONE_PAIR_CONCEPTS]);
    const who = concept === 'size' ? rng.pick([...SUBJECTS.size]) : undefined;
    const start = rng.int(0, 1);
    for (let i = 0; i < plan.rounds; i++)
      out.push({ cards: [{ concept, side: ((start + i) % 2) as 0 | 1, ...(who ? { who } : {}) }] });
    return out;
  }
  if (plan.mode === 'two') {
    // Each authored word once, in a seeded order; the picture of the word itself and the unrelated one are seeded too.
    for (const w of rng.shuffle([...TWO_WORDS]).slice(0, plan.rounds)) {
      const two = (kind: 'ask' | 'right' | 'same', i: 0 | 1): Card => ({
        concept: 'size',
        side: 0,
        two: { w, kind, i },
      });
      out.push({
        ask: two('ask', 0),
        cards: rng.shuffle([
          two('right', 0),
          two('right', 1),
          two('same', rng.int(0, 1) as 0 | 1),
          { concept: rng.pick([...TWO_DECOYS]), side: rng.int(0, 1) as 0 | 1 },
        ]),
      });
    }
    return out;
  }
  // The big card keeps lap's original eight pairs.
  const graded = plan.mode === 'between' || plan.mode === 'order';
  const pool = graded ? GRADABLE : plan.mode === 'un' ? UN_CONCEPTS : poolFor(plan.big ? 1 : plan.level);
  const order = rng.shuffle([...pool]);
  // Level 8: the end named first alternates round by round, so both directions come up equally (2 and 2 in four rounds).
  const parity = plan.mode === 'order' ? rng.int(0, 1) : 0;
  for (let i = 0; i < plan.rounds; i++) {
    const concept = order[i % order.length];
    const side = rng.int(0, 1) as 0 | 1;
    // Choose once per concept so find, opposite and matching cards keep the same animal.
    const subjects = new Map<Concept, Subject>();
    const card = (c: Concept, side: 0 | 1): Card => {
      if (c !== 'size' && c !== 'mood') return { concept: c, side };
      if (!subjects.has(c)) subjects.set(c, rng.pick([...SUBJECTS[c]]));
      return { concept: c, side, who: subjects.get(c)! };
    };
    if (plan.mode === 'switch') out.push({ cards: [card(concept, side)] });
    else if (plan.mode === 'between')
      // Both ends and the middle in their true order, the end named first on the left (level 8 shuffles them).
      out.push({
        ask: card(concept, side),
        cards: [card(concept, side), { concept, side: 0, mid: true }, card(concept, (1 - side) as 0 | 1)],
      });
    else if (plan.mode === 'order') {
      // The same three as level 7, shuffled so they never already stand in the asked order.
      const from = ((i + parity) % 2) as 0 | 1;
      const line = [
        card(concept, from),
        { concept, side: 0 as const, mid: true as const },
        card(concept, (1 - from) as 0 | 1),
      ];
      let cards = rng.shuffle([...line]);
      while (cards.every((c, k) => c === line[k])) cards = rng.shuffle([...line]);
      out.push({ ask: card(concept, from), cards });
    } else if (plan.mode === 'find')
      out.push({ cards: rng.shuffle([card(concept, 0), card(concept, 1)]), ask: card(concept, side) });
    else if (plan.mode === 'un')
      // Level 10: the word and its un- word side by side; the un- one is always asked.
      out.push({ cards: rng.shuffle([card(concept, 0), card(concept, 1)]), ask: card(concept, 1) });
    else if (plan.mode === 'opposite') {
      // The opposite, plus two pictures from other concepts.
      const others = differentFamilies(pool, rng, 2, concept).map((c) => card(c, rng.int(0, 1) as 0 | 1));
      out.push({
        ask: card(concept, side),
        cards: rng.shuffle([card(concept, (1 - side) as 0 | 1), ...others]),
      });
    } else if (plan.mode === 'spot') {
      // One opposite pair, plus three single pictures from other families, so no decoy pair or arguable answer exists.
      const decoys = differentFamilies(pool, rng, 3, concept).map((c) => card(c, rng.int(0, 1) as 0 | 1));
      out.push({ cards: rng.shuffle([card(concept, 0), card(concept, 1), ...decoys]) });
    } else {
      const three = differentFamilies(pool, rng, 3);
      out.push({ cards: rng.shuffle(three.flatMap((c) => [card(c, 0), card(c, 1)])) });
    }
  }
  return out;
}

/** Level 8: a tap is in turn when the card is the next one along the line from the end named first. */
export const inTurn = (round: OppRound, card: Card, placed: number) =>
  degree(card, round.ask!.side) === placed;

export const opposites = (a: Card, b: Card) =>
  !a.two && !b.two && !a.mid && !b.mid && a.concept === b.concept && a.side !== b.side;

/**
 * Which card a capable child taps next, by its place in the round's cards, or null when the round is waiting. Switch: the
 * one card. Find and un: the card named. Opposite: the card that is the opposite of the one shown. Pairs: the first card not yet
 * matched and then its opposite (`picked` is the one already chosen). Between: the middle. Order: the next one along the
 * line from the end named first (`done` marks the ones already lined up). Always a right one.
 */
export function cardToTap(
  plan: OppPlan,
  round: OppRound,
  done: readonly boolean[],
  picked: number | null,
): number | null {
  const find = (ok: (c: Card, i: number) => boolean) => {
    const i = round.cards.findIndex((c, k) => !done[k] && ok(c, k));
    return i < 0 ? null : i;
  };
  switch (plan.mode) {
    case 'switch':
      return 0;
    case 'find':
    case 'un':
      return find((c) => word(c) === word(round.ask!));
    case 'opposite':
      return find((c) => opposites(c, round.ask!));
    case 'two':
      return find((c) => c.two?.kind === 'right');
    case 'between':
      return find((c) => !!c.mid);
    case 'order': {
      const placed = done.filter(Boolean).length;
      return find((c) => inTurn(round, c, placed));
    }
    case 'spot':
      return picked === null
        ? find((c, k) => round.cards.some((o, j) => j !== k && opposites(o, c)))
        : find((c, k) => k !== picked && opposites(c, round.cards[picked]));
    case 'pairs':
      return picked === null
        ? find(() => true)
        : find((c, k) => k !== picked && opposites(c, round.cards[picked]));
  }
}
