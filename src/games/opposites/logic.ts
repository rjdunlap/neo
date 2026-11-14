import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Opposites: pictures of concept words in pairs (big and small, open and closed). On the lap,
 * tap the picture and it flips to its opposite while the word is spoken. Then find the one named,
 * then find the opposite of a picture among others, then match the opposite pairs, then spot the one pair among five,
 * then find the one in between two ends (empty, half full, full).
 */
export type OppMode = 'switch' | 'find' | 'opposite' | 'pairs' | 'spot' | 'between';

export interface OppPlan {
  level: number;
  mode: OppMode;
  rounds: number;
  name: string;
  /** Level 6, lap's opening: one big card, and a touch anywhere flips it; each flipped picture joins a row. */
  big?: boolean;
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

export const LEVELS: BandLevels = {
  lap: { min: 1, max: BIG_LEVEL, order: [BIG_LEVEL, 1] },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  // Level 6 is lap's opening, so pre-K steps from 5 straight to 7.
  prek: { min: 3, max: BETWEEN_LEVEL, order: [3, 4, 5, BETWEEN_LEVEL] },
};

export const planFor = (level: number) =>
  level === BIG_LEVEL
    ? BIG_PLAN
    : level === BETWEEN_LEVEL
      ? BETWEEN_PLAN
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
} as const;

export type Concept = keyof typeof CONCEPTS;
export const CONCEPT_IDS = Object.keys(CONCEPTS) as Concept[];

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

export interface Card {
  concept: Concept;
  side: 0 | 1;
  who?: Subject;
  /** Level 7: the picture in between the two sides (half full, warm, evening, the middle); `side` is then 0 and unused. */
  mid?: true;
}

export const word = (c: Card): string =>
  c.mid ? MIDDLES[c.concept as Gradable] : CONCEPTS[c.concept].words[c.side];

/** A card's place on its word's line, counted from the end named first (`from`): 0, 1 for the middle, 2. */
export const degree = (c: Card, from: 0 | 1) => (c.mid ? 1 : c.side === from ? 0 : 2);

export interface OppRound {
  /** Cards on screen. */
  cards: Card[];
  /** The card asked for (find), the card shown whose opposite is wanted (opposite), or the end named first (between). */
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
  // The big card keeps lap's original eight pairs.
  const pool = plan.mode === 'between' ? GRADABLE : poolFor(plan.big ? 1 : plan.level);
  const order = rng.shuffle([...pool]);
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
    else if (plan.mode === 'find')
      out.push({ cards: rng.shuffle([card(concept, 0), card(concept, 1)]), ask: card(concept, side) });
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

export const opposites = (a: Card, b: Card) =>
  !a.mid && !b.mid && a.concept === b.concept && a.side !== b.side;

/**
 * Which card a capable child taps next, by its place in the round's cards, or null when the round is waiting. Switch: the
 * one card. Find: the card named. Opposite: the card that is the opposite of the one shown. Pairs: the first card not yet
 * matched and then its opposite (`picked` is the one already chosen). Between: the middle. Always a right one.
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
      return find((c) => word(c) === word(round.ask!));
    case 'opposite':
      return find((c) => opposites(c, round.ask!));
    case 'between':
      return find((c) => !!c.mid);
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
