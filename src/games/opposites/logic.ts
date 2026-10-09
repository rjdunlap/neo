import type { Rng } from '../../engine/random';

/**
 * Opposites: pictures of concept words in pairs (big and small, open and closed). On the lap,
 * tap the picture and it flips to its opposite while the word is spoken. Then find the one named,
 * then find the opposite of a picture among others, then match the opposite pairs.
 */
export type OppMode = 'switch' | 'find' | 'opposite' | 'pairs';

export interface OppPlan {
  mode: OppMode;
  rounds: number;
  name: string;
}

export const PLANS: OppPlan[] = [
  { mode: 'switch', rounds: 8, name: 'Tap the picture: it flips to its opposite (big, small; open, closed)' },
  { mode: 'find', rounds: 5, name: 'Find the one named: "find the big one"' },
  { mode: 'opposite', rounds: 4, name: 'This one is hot: find its opposite among three' },
  { mode: 'pairs', rounds: 2, name: 'Match three pairs of opposites' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Each concept has two sides; side 0 and side 1 are opposites. */
export const CONCEPTS = {
  size: ['big', 'small'],
  mood: ['happy', 'sad'],
  height: ['up', 'down'],
  lid: ['open', 'closed'],
  cup: ['full', 'empty'],
  temp: ['hot', 'cold'],
  sky: ['day', 'night'],
  speed: ['fast', 'slow'],
} as const;

export type Concept = keyof typeof CONCEPTS;
export const CONCEPT_IDS = Object.keys(CONCEPTS) as Concept[];

export interface Card {
  concept: Concept;
  side: 0 | 1;
}

export const word = (c: Card) => CONCEPTS[c.concept][c.side];

export interface OppRound {
  /** Cards on screen. */
  cards: Card[];
  /** The card asked for (find), or the card shown whose opposite is wanted (opposite). */
  ask?: Card;
}

export function makeRounds(plan: OppPlan, rng: Rng): OppRound[] {
  const out: OppRound[] = [];
  const order = rng.shuffle([...CONCEPT_IDS]);
  for (let i = 0; i < plan.rounds; i++) {
    const concept = order[i % order.length];
    const side = rng.int(0, 1) as 0 | 1;
    if (plan.mode === 'switch') out.push({ cards: [{ concept, side }] });
    else if (plan.mode === 'find') out.push({ cards: rng.shuffle([{ concept, side: 0 }, { concept, side: 1 }]), ask: { concept, side } });
    else if (plan.mode === 'opposite') {
      // The opposite, plus two pictures from other concepts.
      const others = rng.shuffle(CONCEPT_IDS.filter((c) => c !== concept)).slice(0, 2).map((c) => ({ concept: c, side: rng.int(0, 1) as 0 | 1 }));
      out.push({ ask: { concept, side }, cards: rng.shuffle([{ concept, side: (1 - side) as 0 | 1 }, ...others]) });
    } else {
      const three = rng.shuffle([...CONCEPT_IDS]).slice(0, 3);
      out.push({ cards: rng.shuffle(three.flatMap((c) => [{ concept: c, side: 0 as const }, { concept: c, side: 1 as const }])) });
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
