import type { Rng } from '../../engine/random';

/**
 * Opposites: pictures of concept words in pairs (big and small, open and closed). On the lap,
 * tap the picture and it flips to its opposite while the word is spoken. Then find the one named,
 * then find the opposite of a picture among others, then match the opposite pairs.
 */
export type OppMode = 'switch' | 'find' | 'opposite' | 'pairs';

export interface OppPlan {
  level: number;
  mode: OppMode;
  rounds: number;
  name: string;
}

export const PLANS: OppPlan[] = [
  { level: 1, mode: 'switch', rounds: 8, name: 'Tap the picture: it flips to its opposite (big, small; open, closed)' },
  { level: 2, mode: 'find', rounds: 5, name: 'Find the one named: "find the big one"' },
  { level: 3, mode: 'opposite', rounds: 4, name: 'This one is hot: find its opposite among three' },
  { level: 4, mode: 'pairs', rounds: 2, name: 'Match three pairs of opposites' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

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

/** Variation changes the subject, never the meaning of the pair. */
export const SUBJECTS = { size: ['bear', 'duck', 'bunny'], mood: ['cat', 'dog', 'pig'] } as const;
export type Subject = (typeof SUBJECTS)[keyof typeof SUBJECTS][number];

export interface Card {
  concept: Concept;
  side: 0 | 1;
  who?: Subject;
}

export const word = (c: Card) => CONCEPTS[c.concept].words[c.side];

export interface OppRound {
  /** Cards on screen. */
  cards: Card[];
  /** The card asked for (find), or the card shown whose opposite is wanted (opposite). */
  ask?: Card;
}

export const poolFor = (level: number): Concept[] => CONCEPT_IDS.filter((c) => CONCEPTS[c].from <= level);

/** Keep stickers independent of future playable-pool edits. */
export const STICKER_CONCEPTS = ['sky', 'temp', 'cup', 'lid', 'stature', 'lamp', 'wake', 'basket'] as const satisfies readonly Concept[];

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
  const pool = poolFor(plan.level);
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
    else if (plan.mode === 'find') out.push({ cards: rng.shuffle([card(concept, 0), card(concept, 1)]), ask: card(concept, side) });
    else if (plan.mode === 'opposite') {
      // The opposite, plus two pictures from other concepts.
      const others = differentFamilies(pool, rng, 2, concept).map((c) => card(c, rng.int(0, 1) as 0 | 1));
      out.push({ ask: card(concept, side), cards: rng.shuffle([card(concept, (1 - side) as 0 | 1), ...others]) });
    } else {
      const three = differentFamilies(pool, rng, 3);
      out.push({ cards: rng.shuffle(three.flatMap((c) => [card(c, 0), card(c, 1)])) });
    }
  }
  return out;
}

export const opposites = (a: Card, b: Card) => a.concept === b.concept && a.side !== b.side;

/**
 * Which card a capable child taps next, by its place in the round's cards, or null when the round is waiting. Switch: the
 * one card. Find: the card named. Opposite: the card that is the opposite of the one shown. Pairs: the first card not yet
 * matched and then its opposite (`picked` is the one already chosen). Always a right one.
 */
export function cardToTap(plan: OppPlan, round: OppRound, done: readonly boolean[], picked: number | null): number | null {
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
    case 'pairs':
      return picked === null ? find(() => true) : find((c, k) => k !== picked && opposites(c, round.cards[picked]));
  }
}
