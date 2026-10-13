import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Owl Walk Home, after Peaceable Kingdom's Hoot Owl Hoot! and HABA's First Orchard: flip a color card, then tap the
 * next stone of that color ahead of the owl, and it hops there; a stone with an owl on it is skipped, and with no
 * stone of that color left ahead the owl flies straight home (she taps the nest). Everyone wins together when every
 * owl is home. There is no clock: the sunrise only arrives when the owls do. The goal is choosing the move that helps
 * all of us: level 2 gives each owl its own player (the pet plays the other), level 3 shares the owls and asks which
 * one to hop, and the top level asks which owl a card would carry the farthest, so everyone gets home sooner.
 */
export type OwlMode = 'one' | 'turns' | 'choose' | 'farthest';

export interface OwlPlan {
  mode: OwlMode;
  owls: number;
  colors: number;
  stones: number;
  name: string;
  /** Matching stones twinkle when a card turns: a support that fades once she is scanning the path herself. */
  twinkle: boolean;
  /** A card always has a stone ahead for the owl whose turn it is, so flying home is not a surprise on the first levels. */
  safeCards: boolean;
}

export const PLANS: OwlPlan[] = [
  { mode: 'one', owls: 1, colors: 3, stones: 10, twinkle: true, safeCards: true, name: 'Flip a color card, then tap the next stone of that color for the owl to hop to' },
  { mode: 'turns', owls: 2, colors: 4, stones: 12, twinkle: true, safeCards: true, name: 'Two owls, one each: take turns with the pet and tap the next stone of the card’s color' },
  { mode: 'choose', owls: 3, colors: 4, stones: 14, twinkle: false, safeCards: false, name: 'Three owls, taking turns: choose an owl, then tap its stone (or the nest when none is left)' },
  { mode: 'farthest', owls: 3, colors: 4, stones: 16, twinkle: false, safeCards: false, name: 'Which owl hops the farthest with this card? Plan to get everyone home sooner' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const STONE_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green'];

/** Where an owl is: -1 in the woods before the first stone, 0…n-1 on a stone, n home in the nest. */
export type Spot = number;

/** Stones in rounds of every color, shuffled, with no color twice in a row. */
export function makePath(plan: OwlPlan, rng: Rng): ColorName[] {
  const colors = STONE_COLORS.slice(0, plan.colors);
  const path: ColorName[] = [];
  while (path.length < plan.stones) {
    const round = rng.shuffle([...colors]);
    if (round[0] === path[path.length - 1]) round.push(round.shift()!);
    path.push(...round);
  }
  return path.slice(0, plan.stones);
}

/** Where owl `i` lands with a `color` card: the next free stone of that color ahead of it, or home. */
export function hop(path: readonly ColorName[], spots: readonly Spot[], i: number, color: ColorName): Spot {
  const home = path.length;
  for (let s = spots[i] + 1; s < home; s++) {
    if (path[s] === color && !spots.some((o, j) => j !== i && o === s)) return s;
  }
  return home;
}

/** How many stones forward each owl would go with this card (0 for owls already home). */
export function hops(path: readonly ColorName[], spots: readonly Spot[], color: ColorName): number[] {
  return spots.map((s, i) => (s >= path.length ? 0 : hop(path, spots, i, color) - s));
}

/** The owls a card carries the farthest: any of them is a good choice. */
export function farthest(path: readonly ColorName[], spots: readonly Spot[], color: ColorName): number[] {
  const h = hops(path, spots, color);
  const best = Math.max(...h);
  return h.map((n, i) => (n === best && n > 0 ? i : -1)).filter((i) => i >= 0);
}

export const allHome = (path: readonly ColorName[], spots: readonly Spot[]) => spots.every((s) => s >= path.length);

/** A card from the pile. The deck is open-ended; it only ever offers colors that are on the path. */
export const drawCard = (plan: OwlPlan, rng: Rng): ColorName => rng.pick(STONE_COLORS.slice(0, plan.colors));

/**
 * The card for a turn. On the first levels it is a color with a free stone ahead of one of the owls that may move
 * (`movers`), so the hop is always to a stone she can find; with none left (an owl on the last stone) any color flies home.
 */
export function drawCardFor(plan: OwlPlan, rng: Rng, path: readonly ColorName[], spots: readonly Spot[], movers: readonly number[]): ColorName {
  if (!plan.safeCards) return drawCard(plan, rng);
  const options = STONE_COLORS.slice(0, plan.colors).filter((c) => movers.some((i) => hop(path, spots, i, c) < path.length));
  return options.length ? rng.pick(options) : drawCard(plan, rng);
}

/** The owl a player moves in the one-each level: their own, or the one still walking once their own is home. */
export function owlOf(path: readonly ColorName[], spots: readonly Spot[], player: 0 | 1): number {
  if (spots[player] < path.length) return player;
  return spots.findIndex((s) => s < path.length);
}

/** What a tap on a stone (or the nest) means for the owl that is moving with this card. */
export type StoneVerdict = 'next' | 'far' | 'behind' | 'occupied' | 'wrong-color' | 'nest' | 'early-nest';

/**
 * Judges a tap on stone `tapped` (or the nest): the next free stone of the card's color ahead is right, the nest is right
 * only when no such stone is left, and every other tap says why it is not (another color, a later stone of the right
 * color, a stone behind the owl, or one with an owl on it).
 */
export function judgeStone(path: readonly ColorName[], spots: readonly Spot[], i: number, color: ColorName, tapped: number | 'nest'): StoneVerdict {
  const to = hop(path, spots, i, color);
  if (tapped === 'nest') return to >= path.length ? 'nest' : 'early-nest';
  if (path[tapped] !== color) return 'wrong-color';
  if (tapped <= spots[i]) return 'behind';
  if (spots.some((o, j) => j !== i && o === tapped)) return 'occupied';
  return tapped === to ? 'next' : 'far';
}

/**
 * The owl a capable child hops with this card: one that goes the farthest (the first of them), which is also what the pet
 * does on its turn. Null when every owl is home.
 */
export const owlToHop = (path: readonly ColorName[], spots: readonly Spot[], color: ColorName): number | null => farthest(path, spots, color)[0] ?? null;
