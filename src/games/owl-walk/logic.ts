import type { ColorName } from '../../art/palette';
import type { ShapeKind } from '../../art/shapes';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Owl Walk Home, after Peaceable Kingdom's Hoot Owl Hoot! and HABA's First Orchard: flip a color card, then tap the
 * next stone of that color ahead of the owl, and it hops there; a stone with an owl on it is skipped, and with no
 * stone of that color left ahead the owl flies straight home (she taps the nest). Everyone wins together when every
 * owl is home. There is no clock: the sunrise only arrives when the owls do. The goal is choosing the move that helps
 * all of us: level 2 gives each owl its own player (the pet plays the other), level 3 shares the owls and asks which
 * one to hop, and level 4 asks which owl a card would carry the farthest, so everyone gets home sooner. Level 5 is a
 * free lap toy with no cards, and level 6 (Color or shape) gives every stone a color and a shape apart from it, and
 * each card shows only one of the two.
 */
export type OwlMode = 'one' | 'turns' | 'choose' | 'farthest' | 'free' | 'either';

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
  {
    mode: 'one',
    owls: 1,
    colors: 3,
    stones: 10,
    twinkle: true,
    safeCards: true,
    name: 'Flip a color card, then tap the next stone of that color for the owl to hop to',
  },
  {
    mode: 'turns',
    owls: 2,
    colors: 4,
    stones: 12,
    twinkle: true,
    safeCards: true,
    name: 'Two owls, one each: take turns with the pet and tap the next stone of the card’s color',
  },
  {
    mode: 'choose',
    owls: 3,
    colors: 4,
    stones: 14,
    twinkle: false,
    safeCards: false,
    name: 'Three owls, taking turns: choose an owl, then tap its stone (or the nest when none is left)',
  },
  {
    mode: 'farthest',
    owls: 3,
    colors: 4,
    stones: 16,
    twinkle: false,
    safeCards: false,
    name: 'Which owl hops the farthest with this card? Plan to get everyone home sooner',
  },
  {
    mode: 'free',
    owls: 1,
    colors: 3,
    stones: 5,
    twinkle: false,
    safeCards: true,
    name: 'Stepping stones: no cards; tap any stone ahead and the owl hops there, singing, then home to the nest',
  },
  {
    mode: 'either',
    owls: 1,
    colors: 3,
    stones: 12,
    twinkle: false,
    safeCards: true,
    name: 'Color or shape: each stone has both, and a card shows only one; tap the next stone that has it',
  },
];

/** Level 5, the free lap toy: appended above the ladder and played first by the youngest (an easy entry). */
export const STEPPING_LEVEL = 5;
export const ENTRY_LEVELS = [STEPPING_LEVEL] as const;
/** Level 6, Color or shape: placed after the two first card levels for preschool and pre-K. */
export const EITHER_LEVEL = 6;

export const LEVELS: BandLevels = {
  lap: { min: STEPPING_LEVEL, max: STEPPING_LEVEL },
  toddler: { min: 1, max: STEPPING_LEVEL, order: [STEPPING_LEVEL, 1, 2] },
  preschool: { min: 1, max: EITHER_LEVEL, order: [1, 2, EITHER_LEVEL, 3] },
  prek: { min: 2, max: EITHER_LEVEL, order: [2, 3, EITHER_LEVEL, 4] },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const STONE_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green'];

/** Levels 1–5 give each stone color its own shape, so the match never rests on hue alone. */
export const MARK: Partial<Record<ColorName, ShapeKind>> = {
  red: 'heart',
  blue: 'circle',
  yellow: 'star',
  green: 'triangle',
};

/** Color or shape's three shapes, worn by its three colors in every combination (nine kinds of stone). */
export const EITHER_SHAPES: ShapeKind[] = ['heart', 'circle', 'star'];

/** A stone: its color, and the shape marked on it. */
export interface Stone {
  color: ColorName;
  shape: ShapeKind;
}

/** What a card shows: a color, or (on Color or shape) only a shape. The two sets of names never overlap. */
export type Card = ColorName | ShapeKind;

export const isShapeCard = (card: Card): card is ShapeKind => (EITHER_SHAPES as string[]).includes(card);

/** A stone has what the card shows: its color, or its shape. */
export const fits = (stone: Stone, card: Card) => stone.color === card || stone.shape === card;

/** "red heart": the color and the shape a stone carries, so a spoken miss can name what was touched. */
export const stoneName = (stone: Stone) => `${stone.color} ${stone.shape}`;

/** Where an owl is: -1 in the woods before the first stone, 0…n-1 on a stone, n home in the nest. */
export type Spot = number;

/** Stones in rounds of every color, shuffled, with no color twice in a row; Color or shape has its own (`eitherPath`). */
export function makePath(plan: OwlPlan, rng: Rng): Stone[] {
  if (plan.mode === 'either') return eitherPath(plan, rng);
  const colors = STONE_COLORS.slice(0, plan.colors);
  const path: ColorName[] = [];
  while (path.length < plan.stones) {
    const round = rng.shuffle([...colors]);
    if (round[0] === path[path.length - 1]) round.push(round.shift()!);
    path.push(...round);
  }
  return path.slice(0, plan.stones).map((color) => ({ color, shape: MARK[color]! }));
}

/** Two stones side by side share neither color nor shape on Color or shape, so both keep changing along the path. */
const unlike = (a: Stone, b: Stone) => a.color !== b.color && a.shape !== b.shape;

/**
 * Color or shape's path: all nine kinds once in a shuffled order (so every color is seen with every shape), then more
 * stones to the plan's length, no two neighbors sharing a color or a shape. A greedy shuffle almost always finds an
 * order; after many tries it takes a fixed one that keeps the rules.
 */
function eitherPath(plan: OwlPlan, rng: Rng): Stone[] {
  const colors = rng.shuffle(STONE_COLORS.slice(0, plan.colors));
  const shapes = rng.shuffle(EITHER_SHAPES.slice(0, plan.colors));
  const kinds = colors.flatMap((color) => shapes.map((shape) => ({ color, shape })));
  let path: Stone[] = [];
  for (let attempt = 0; attempt < 50 && path.length < kinds.length; attempt++) {
    const pool = rng.shuffle([...kinds]);
    path = [];
    for (let k = 0; k >= 0;) {
      path.push(pool.splice(k, 1)[0]);
      k = pool.findIndex((s) => unlike(s, path[path.length - 1]));
    }
  }
  if (path.length < kinds.length)
    path = kinds.map((_, k) => ({ color: colors[k % 3], shape: shapes[(k + Math.floor(k / 3)) % 3] }));
  while (path.length < plan.stones)
    path.push(rng.pick(kinds.filter((s) => unlike(s, path[path.length - 1]))));
  return path.slice(0, plan.stones);
}

/** Where owl `i` lands with a card: the next free stone ahead of it that has what the card shows, or home. */
export function hop(path: readonly Stone[], spots: readonly Spot[], i: number, card: Card): Spot {
  const home = path.length;
  for (let s = spots[i] + 1; s < home; s++) {
    if (fits(path[s], card) && !spots.some((o, j) => j !== i && o === s)) return s;
  }
  return home;
}

/** How many stones forward each owl would go with this card (0 for owls already home). */
export function hops(path: readonly Stone[], spots: readonly Spot[], card: Card): number[] {
  return spots.map((s, i) => (s >= path.length ? 0 : hop(path, spots, i, card) - s));
}

/** The owls a card carries the farthest: any of them is a good choice. */
export function farthest(path: readonly Stone[], spots: readonly Spot[], card: Card): number[] {
  const h = hops(path, spots, card);
  const best = Math.max(...h);
  return h.map((n, i) => (n === best && n > 0 ? i : -1)).filter((i) => i >= 0);
}

export const allHome = (path: readonly Stone[], spots: readonly Spot[]) =>
  spots.every((s) => s >= path.length);

/** Every card the plan's deck holds: its colors, and on Color or shape its shapes too. */
export const cardsFor = (plan: OwlPlan): Card[] => {
  const colors = STONE_COLORS.slice(0, plan.colors);
  return plan.mode === 'either' ? [...colors, ...EITHER_SHAPES.slice(0, plan.colors)] : colors;
};

/** A card from the pile. The deck is open-ended; it only ever offers colors (and shapes) that are on the path. */
export const drawCard = (plan: OwlPlan, rng: Rng): Card => rng.pick(cardsFor(plan));

/**
 * The card for a turn. On the first levels it is one with a free stone ahead of one of the owls that may move
 * (`movers`), so the hop is always to a stone she can find; with none left (an owl on the last stone) any card flies home.
 * On Color or shape the kind of card is a coin toss, except that after two of one kind (`recent`, newest last) the other
 * comes, so a color card never becomes the only kind she reads.
 */
export function drawCardFor(
  plan: OwlPlan,
  rng: Rng,
  path: readonly Stone[],
  spots: readonly Spot[],
  movers: readonly number[],
  recent: readonly Card[] = [],
): Card {
  if (!plan.safeCards) return drawCard(plan, rng);
  const options = cardsFor(plan).filter((c) => movers.some((i) => hop(path, spots, i, c) < path.length));
  if (!options.length) return drawCard(plan, rng);
  if (plan.mode !== 'either') return rng.pick(options);
  const shapes = options.filter(isShapeCard);
  const colors = options.filter((c) => !isShapeCard(c));
  if (!shapes.length || !colors.length) return rng.pick(options);
  const [a, b] = recent.slice(-2);
  const twice = b !== undefined && isShapeCard(a) === isShapeCard(b);
  const shape = twice ? !isShapeCard(b) : rng.chance(0.5);
  return rng.pick(shape ? shapes : colors);
}

/** The owl a player moves in the one-each level: their own, or the one still walking once their own is home. */
export function owlOf(path: readonly Stone[], spots: readonly Spot[], player: 0 | 1): number {
  if (spots[player] < path.length) return player;
  return spots.findIndex((s) => s < path.length);
}

/** What a tap on a stone (or the nest) means for the owl that is moving with this card. */
export type StoneVerdict = 'next' | 'far' | 'behind' | 'occupied' | 'mismatch' | 'nest' | 'early-nest';

/**
 * Judges a tap on stone `tapped` (or the nest): the next free stone ahead with what the card shows is right, the nest is
 * right only when no such stone is left, and every other tap says why it is not (a stone without the card's color or
 * shape, a later stone that has it, a stone behind the owl, or one with an owl on it).
 */
export function judgeStone(
  path: readonly Stone[],
  spots: readonly Spot[],
  i: number,
  card: Card,
  tapped: number | 'nest',
): StoneVerdict {
  const to = hop(path, spots, i, card);
  if (tapped === 'nest') return to >= path.length ? 'nest' : 'early-nest';
  if (!fits(path[tapped], card)) return 'mismatch';
  if (tapped <= spots[i]) return 'behind';
  if (spots.some((o, j) => j !== i && o === tapped)) return 'occupied';
  return tapped === to ? 'next' : 'far';
}

/**
 * What a grown-up's tap does on the pet's turn, when they hold the pet's seat (levels 2 to 4): the right stone or the nest
 * takes the hop; a wrong one is a spoken reason, a glow on the second and the hop made together on the third. Never counted:
 * `wrongs` is the grown-up's own tally, kept apart from hers, so her round and her level stay her own (the seat contract).
 */
export type SeatStep = 'hop' | 'say' | 'hint' | 'together';
export function seatStep(verdict: StoneVerdict, wrongs: number): SeatStep {
  if (verdict === 'next' || verdict === 'nest') return 'hop';
  return wrongs <= 1 ? 'say' : wrongs === 2 ? 'hint' : 'together';
}

/**
 * The card's words in a spoken line ("a {need}!"): "red heart" on the color levels, where every color has its shape;
 * on Color or shape only what the card shows, "heart" or "red stone".
 */
export function cardName(plan: OwlPlan, card: Card): string {
  if (plan.mode === 'either') return isShapeCard(card) ? card : `${card} stone`;
  return MARK[card as ColorName] ? `${card} ${MARK[card as ColorName]}` : card;
}

/**
 * What a stone without the card's color or shape is told: on Color or shape, the one attribute the card asked about,
 * what the stone has and what we need ("that is a star; we need a heart"), never the other; elsewhere the whole stone.
 */
export function mismatchWords(
  plan: OwlPlan,
  stone: Stone,
  card: Card,
): { line: 'owl.not-shape' | 'owl.not-color' | 'owl.wrong-color'; have: string; need: string } {
  if (plan.mode !== 'either')
    return { line: 'owl.wrong-color', have: `a ${stoneName(stone)}`, need: cardName(plan, card) };
  return isShapeCard(card)
    ? { line: 'owl.not-shape', have: stone.shape, need: card }
    : { line: 'owl.not-color', have: stone.color, need: card };
}

/**
 * The owl a capable child hops with this card: one that goes the farthest (the first of them), which is also what the pet
 * does on its turn. Null when every owl is home.
 */
export const owlToHop = (path: readonly Stone[], spots: readonly Spot[], card: Card): number | null =>
  farthest(path, spots, card)[0] ?? null;

/** What a tap means on the stepping-stones level: a hop to a stone ahead, the flight home, or a soft tick (never a miss). */
export type StepVerdict = 'hop' | 'home' | 'stay';

/** Level 5 has no wrong taps: a stone ahead (or the nest) is where the owl goes; its own stone or one behind it only ticks. */
export function stepTo(stones: number, spot: Spot, tapped: number | 'nest'): StepVerdict {
  if (spot >= stones) return 'stay';
  if (tapped === 'nest') return 'home';
  return tapped > spot ? 'hop' : 'stay';
}

/** How far a touch still means a stone, from its middle: the stepping stones are drawn bigger than the card levels' ones. */
export const stoneReach = (plan: OwlPlan) => (plan.mode === 'free' ? 90 : 56);
/** The stepping stones' art scale: five fat stones for a lap player. */
export const stoneScale = (plan: OwlPlan) => (plan.mode === 'free' ? 1.6 : 1);

/** Two rows: right to left along the bottom, a turn, then left to right up to the nest, for `n` stones in a `w` by `h` view. */
export function stoneLayout(n: number, w: number, h: number): { x: number; y: number }[] {
  const perRow = Math.ceil(n / 2);
  const left = 250;
  const right = w - 230;
  const step = (right - left) / (perRow - 1);
  const bottom = h - 110;
  const top = h - 330;
  return Array.from({ length: n }, (_, i) =>
    i < perRow ? { x: right - i * step, y: bottom } : { x: left + (i - perRow) * step, y: top },
  );
}

/** The middle of the nest basket in a `w` by `h` view (what a tap there means). */
export const nestPointIn = (w: number, h: number) => ({ x: w - 120, y: h - 440 });
export const NEST_REACH = 95;
