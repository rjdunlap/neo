import type { Rng } from '../../engine/random';
import { HINT_AFTER } from '../../progress/coach';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Animal Charades, level 1 (docs/definitions/animal-charades.md). Six animals, each with one signature motion that no
 * other animal shares. A round deals three animals and one target; she watches the motion and points. Everything here is
 * integers over fixed tables, so a test can walk every round.
 */
export const LEVELS: BandLevels = { preschool: { min: 1, max: 1 }, prek: { min: 1, max: 1 } };
export const describeLevel = (_level: number) =>
  'Who is moving?: watch how it moves and name the animal. The pet or a friend acts; then, once, she acts for the pet';

export const ANIMALS = ['frog', 'duck', 'fish', 'bird', 'snail', 'bear'] as const;
export type AnimalId = (typeof ANIMALS)[number];
export const MOTIONS = ['hop', 'waddle', 'swish', 'flap', 'slide', 'stomp'] as const;
export type MotionId = (typeof MOTIONS)[number];

/** Each animal's one motion, by index: animal `i` moves with motion `i`. */
export const MOTION_OF: Record<AnimalId, MotionId> = {
  frog: 'hop',
  duck: 'waddle',
  fish: 'swish',
  bird: 'flap',
  snail: 'slide',
  bear: 'stomp',
};
/** The motion word the voice says: "A frog hops!" */
export const DOES: Record<AnimalId, string> = {
  frog: 'hops',
  duck: 'waddles',
  fish: 'swishes',
  bird: 'flaps',
  snail: 'slides',
  bear: 'stomps',
};

/** The pentatonic phrase played with each motion: [seconds into the motion, step from `notes.ts`]. Never says a name. */
export const PHRASE: Record<MotionId, [number, number][]> = {
  hop: [
    [0.4, 5],
    [1.6, 7],
  ],
  waddle: [
    [0.5, 1],
    [1.3, 2],
    [2.1, 1],
  ],
  swish: [
    [0.3, 4],
    [1.1, 6],
    [1.9, 4],
  ],
  flap: [
    [0.6, 8],
    [1.0, 9],
  ],
  slide: [[0.4, 1]],
  stomp: [
    [0.5, 0],
    [1.5, 0],
  ],
};

export interface Deal {
  /** Three distinct animals, left to right. */
  animals: [AnimalId, AnimalId, AnimalId];
  /** Which of the three (0–2) the pet acts. */
  target: number;
}

/** Every deal there is: 20 triples of animals, each with any of its 3 members as the target = 60 rounds. */
export function allDeals(): { triple: [number, number, number]; target: number }[] {
  const out: { triple: [number, number, number]; target: number }[] = [];
  for (let a = 0; a < 6; a++)
    for (let b = a + 1; b < 6; b++)
      for (let c = b + 1; c < 6; c++) for (let t = 0; t < 3; t++) out.push({ triple: [a, b, c], target: t });
  return out;
}
const DEALS = allDeals();

/** One seeded round: a triple, a target and a left-to-right shuffle of the three cards. */
export function dealRound(rng: Rng): Deal {
  const base = rng.pick(DEALS);
  const order = rng.shuffle([0, 1, 2]);
  const animals = order.map((i) => ANIMALS[base.triple[i]]) as Deal['animals'];
  return { animals, target: order.indexOf(base.target) };
}

export type Phase = 'guess' | 'reveal';
export interface State {
  phase: Phase;
  deal: Deal;
  /** Cards already tried, in order. */
  tried: number[];
  misses: number;
  /** Whether the reveal came from Show me, not from her own guess. */
  shown: boolean;
}
export const startState = (deal: Deal): State => ({
  phase: 'guess',
  deal,
  tried: [],
  misses: 0,
  shown: false,
});

/** She taps a card: the right one reaches the reveal; a wrong one is a miss and she tries another. Total over every card. */
export function guess(s: State, card: number): State {
  if (s.phase !== 'guess' || card < 0 || card > 2) return s;
  if (card === s.deal.target) return { ...s, phase: 'reveal', tried: [...s.tried, card] };
  if (s.tried.includes(card)) return s;
  return { ...s, tried: [...s.tried, card], misses: s.misses + 1 };
}
/** Show me: the reveal without a guess (a hint, supported). */
export const showMe = (s: State): State => (s.phase === 'guess' ? { ...s, phase: 'reveal', shown: true } : s);

/** After two misses the target card glows. Before the reveal it never names the animal. */
export function hintAction(s: State): { kind: 'card'; index: number } | { kind: 'look' } | null {
  if (s.phase !== 'guess') return null;
  return s.misses >= HINT_AFTER ? { kind: 'card', index: s.deal.target } : { kind: 'look' };
}

/** The pet's fixed, seeded order of guesses when she acts: the three dealt animals, every one once. */
export function petOrder(seed: number): [number, number, number] {
  const orders: [number, number, number][] = [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
    [0, 2, 1],
    [1, 0, 2],
    [2, 1, 0],
  ];
  return orders[Math.abs(Math.trunc(seed)) % orders.length];
}
/** The animal she acts for the pet (a dealt animal that is not the one the pet acted, so the two turns differ). */
export const actedCard = (deal: Deal): number => (deal.target + 1) % 3;
