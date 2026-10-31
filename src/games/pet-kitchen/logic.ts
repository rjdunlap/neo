import { CRITTERS, type CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
export const PLANS = [
  { mode: 'share', wholes: 1, friends: 2, cuts: [2], name: 'Cut one sandwich in halves and share with two friends' },
  { mode: 'share', wholes: 1, friends: 4, cuts: [2,4], name: 'Find equal quarters for four friends' },
  { mode: 'share', wholes: 2, friends: 2, cuts: [2], name: 'Two sandwiches: two halves for each friend' },
  { mode: 'share', wholes: 2, friends: 4, cuts: [2,4], name: 'Share two sandwiches fairly; halves or quarters both work' },
  { mode: 'recipe', wholes: 0, friends: 0, cuts: [], name: 'Double a picture recipe: one berry and one apple become two each' },
  { mode: 'recipe', wholes: 0, friends: 0, cuts: [], name: 'Double two berries and one apple for a bigger fruit salad' },
  { mode: 'fraction', wholes: 1, friends: 1, cuts: [2,4], name: 'Serve a named fraction of one sandwich' },
  { mode: 'half-recipe', wholes: 0, friends: 0, cuts: [], name: 'Halve a picture recipe for one friend' },
  { mode: 'share', wholes: 1, friends: 3, cuts: [3], name: 'Cut one pizza into thirds and share one slice with each of three friends' },
  { mode: 'deal', wholes: 1, friends: 2, cuts: [2,4], name: 'Tap a piece to deal it, one for you and one for me (halves or quarters, no wrong touch)' },
  { mode: 'share', wholes: 1, friends: 2, cuts: [2], lopsided: true, name: 'Same or not the same? Choose the cut that gives two friends equal pieces, not a big one and a little one' },
  { mode: 'share', wholes: 2, friends: 3, cuts: [2,3,4], lopsided: false, name: 'Two pizzas for three friends: only thirds share them out' },
  { mode: 'compare', wholes: 1, friends: 2, cuts: [2,4], name: 'Who has more? Serve two friends the amounts they ask for from one sandwich, then tap the friend with more' },
] as const;
/** Level 11 offers the middle cut beside a lopsided one; level 12 shares two pizzas among three. */
export const SAME_LEVEL = 11;
export const PIZZAS_LEVEL = 12;
/** Level 13 *Who has more?*: two asks from one sandwich, then a question about the two servings. */
export const COMPARE_LEVEL = 13;
/**
 * Level 14 *Different shape, same share*: two sandwiches, two friends and two cut pictures (down and across). Each
 * sandwich takes its own cut, so a plate can hold a tall half and a wide half.
 */
export const SHAPES_LEVEL = 14;
export const SHAPES_PLAN = { mode: 'share', wholes: 2, friends: 2, cuts: [2], shapes: true, name: 'Different shape, same share: cut one sandwich down and one across, then give each friend a tall half and a wide half' } as const;
/** The two ways a level-14 sandwich is cut in half and the shape of the piece each way makes. */
export const CUT_WAYS = ['down', 'across'] as const;
export type CutWay = typeof CUT_WAYS[number];
export type PieceShape = 'tall' | 'wide';
export const pieceShape = (way: CutWay): PieceShape => (way === 'down' ? 'tall' : 'wide');
/** The cut the ghost finger makes next at level 14: the way not used yet, so one sandwich goes each way. */
export const nextWay = (done: readonly CutWay[]): CutWay => CUT_WAYS.find((w) => !done.includes(w)) ?? CUT_WAYS[0];
/** Every whole has been cut; serving earlier leaves a sandwich whole on the counter (a miss at 14). */
export const allCut = (plan: { wholes: number }, done: readonly CutWay[]) => done.length >= plan.wholes;
/**
 * What the overlay says after a fair serve at 14: a tall half over a wide half when both shapes were served, or two
 * halves of the one shape when both sandwiches were cut the same way (accepted, and no miss).
 */
export function shapesLine(shapes: readonly PieceShape[]): { line: 'kitchen.same-share' | 'kitchen.same-shape'; shape: PieceShape } {
  const tall = shapes.includes('tall'), wide = shapes.includes('wide');
  return tall && wide ? { line: 'kitchen.same-share', shape: 'tall' } : { line: 'kitchen.same-shape', shape: tall ? 'tall' : 'wide' };
}
/** Two served pieces to lie one over the other: one of each shape when both were served, else any two. */
export function overlayPair<T extends { shape?: PieceShape }>(served: readonly T[]): [T, T] | null {
  const tall = served.find((p) => p.shape === 'tall'), wide = served.find((p) => p.shape === 'wide');
  if (tall && wide) return [tall, wide];
  return served.length >= 2 ? [served[0], served[1]] : null;
}
/** The two pieces of a lopsided cut, by share of the whole (one third, two thirds). */
export const LOPSIDED_AREAS = [1/3, 2/3] as const;
/** Areas of the pieces one cut makes in each whole: equal parts, or the lopsided pair when `lopsided`. */
export function pieceAreas(parts: number, wholes: number, lopsided = false, smallFirst = true): number[] {
  const one: number[] = lopsided ? (smallFirst ? [...LOPSIDED_AREAS] : [...LOPSIDED_AREAS].reverse()) : Array<number>(parts).fill(1 / parts);
  return Array.from({ length: wholes }, () => one).flat();
}
/** Plates hold the same amount of food (not just the same number of pieces). */
export function fairAreas(sums: readonly number[]): boolean {
  return sums.length > 0 && sums[0] > 0 && sums.every((a) => Math.abs(a - sums[0]) < 1e-9);
}
/** A cut shares the wholes out evenly by count: every friend gets the same number of pieces and none is left over. */
export const cutShares = (plan: { wholes: number; friends: number }, cut: number) => cut > 0 && (plan.wholes * cut) % plan.friends === 0;
/** The level whose pieces are already cut and dealt by tapping (the lap rung). */
export const DEAL_LEVEL = 10;
export const planFor = (l: number) => (l >= SHAPES_LEVEL ? SHAPES_PLAN : PLANS[Math.max(0,Math.min(PLANS.length-1,l-1))]);
export const fair = (plates: number[], pieces: number) => pieces > 0 && plates.length > 0 && plates.every(n => n > 0 && n === pieces / plates.length);
export function nextPlate(plates: number[]) { return plates.indexOf(Math.min(...plates)); }
export function recipe(level: number, rng: Rng): [number,number] {
  if (level >= 8) return rng.chance(0.5) ? [2,2] : [4,2];
  return level <= 5 ? [1,1] : rng.chance(0.5) ? [2,1] : [1,2];
}
export const doubled = (base: number[], made: number[]) => base.length === made.length && base.every((n,i) => made[i] === n*2);
export const ingredientHint = (base: number[], made: number[]) => made.findIndex((n,i) => n !== base[i]*2);
export const halved = (base: number[], made: number[]) => base.length === made.length && made.every((n,i) => n * 2 === base[i]);
export const halfIngredientHint = (base: number[], made: number[]) => made.findIndex((n,i) => n * 2 !== base[i]);

export const FRACTIONS = [
  { id: 'half', name: 'one half', numerator: 1, denominator: 2 },
  { id: 'quarter', name: 'one quarter', numerator: 1, denominator: 4 },
  { id: 'three-quarters', name: 'three quarters', numerator: 3, denominator: 4 },
] as const;
export type FractionRequest = typeof FRACTIONS[number];
export function fractionRequest(rng: Rng): FractionRequest { return rng.pick(FRACTIONS); }
/** A whole sandwich is cut into equal pieces; two quarters are a valid half. */
export function servesFraction(request: FractionRequest, cut: number, served: number): boolean {
  return cut > 0 && served >= 0 && served <= cut && served / cut === request.numerator / request.denominator;
}
/** The fewest equal pieces that can make the requested fraction. */
export function fractionCut(request: FractionRequest, cuts: readonly number[]): number | undefined {
  return [...cuts].sort((a, b) => a - b).find(cut => Number.isInteger(cut * request.numerator / request.denominator));
}

/** How near a plate's middle a piece must be let go to land on it. */
export const PLATE_REACH = 88;
/** The plate a piece let go at (x, y) lands on: the nearest one within reach, or -1 (it goes back to the tray). */
export function plateAt(plates: readonly { x: number; y: number }[], x: number, y: number): number {
  let nearest = -1, distance = PLATE_REACH;
  plates.forEach((p, i) => { const d = Math.hypot(x - p.x, y - p.y); if (d < distance) { distance = d; nearest = i; } });
  return nearest;
}
/**
 * The cut a capable child makes: of the cuts that share out evenly, the one with the fewest pieces (halves for two
 * sandwiches and four friends; quarters only when one sandwich has to reach four). A cut that leaves a friend short
 * is a miss when she serves it, so the ghost finger never makes one.
 */
export function fairCut(plan: { wholes: number; friends: number; cuts: readonly number[] }): number | undefined {
  return [...plan.cuts].sort((a, b) => a - b).find((c) => cutShares(plan, c));
}

/**
 * Why a share or fraction serve missed, so the first line says what is really wrong: nothing cut yet, too few pieces for
 * every friend to have one (the round arrow and a finer cut fix it, so this comes before an empty plate), nothing on
 * any plate, or plates that differ.
 */
export type ServeTrouble = 'uncut' | 'empty' | 'short' | 'leftover' | 'lopsided' | 'unequal';
export function serveTrouble(plates: readonly number[], pieces: number, areas?: readonly number[]): ServeTrouble {
  if (pieces === 0) return 'uncut';
  if (pieces < plates.length) return 'short';
  if (plates.every((n) => n === 0)) return 'empty';
  const equal = plates.every((n) => n > 0 && n === plates[0]);
  // The same number of pieces everywhere but a bigger piece on one plate: the pieces are shown side by side.
  if (equal && fair([...plates], pieces) && areas && !fairAreas(areas)) return 'lopsided';
  // Everyone has the same but pieces wait in the tray that nobody can have.
  if (equal && plates.reduce((a, b) => a + b, 0) < pieces) return 'leftover';
  return 'unequal';
}
const NUMBER_WORDS = ['one', 'two', 'three', 'four'];
const PIECE_WORDS: Record<number, [string, string]> = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'] };
/** The served pieces counted aloud: "one quarter, two quarters". */
export function countAloud(cut: number, served: number): string {
  const [one, many] = PIECE_WORDS[cut] ?? ['piece', 'pieces'];
  return Array.from({ length: served }, (_, i) => `${NUMBER_WORDS[i] ?? i + 1} ${i ? many : one}`).join(', ');
}

/** What a round cuts at the levels that share: a sandwich or a round pie (the pizza at 9 stays a pizza). */
export type Whole = 'sandwich' | 'pie';
export const WHOLES: readonly Whole[] = ['sandwich', 'pie'];
export const wholeFor = (level: number, rng: Rng): Whole => (level >= 1 && level <= 4 ? rng.pick(WHOLES) : level === PIZZAS_LEVEL ? 'pie' : 'sandwich');
/** Levels whose whole is a pizza (thirds at 9, two pizzas at 12). */
export const isPizzaLevel = (level: number) => level === 9 || level === PIZZAS_LEVEL;
/** Pieces on the counter after one cut of every whole: the same for a sandwich or a pie. */
export const pieceCount = (plan: { wholes: number }, cut: number) => plan.wholes * cut;

/** Fruit for a recipe: berry, apple and banana; a round picks two different ones. */
export const FRUITS = ['berry', 'apple', 'banana'] as const;
export type Fruit = typeof FRUITS[number];
export function fruitPair(rng: Rng): [number, number] {
  const a = rng.int(0, FRUITS.length - 1);
  const b = (a + 1 + rng.int(0, FRUITS.length - 2)) % FRUITS.length;
  return [a, b];
}

/** The friends at the plates: distinct creatures dealt from the seed. */
export function dealFriends(rng: Rng, n: number): CritterName[] {
  return rng.shuffle(Object.keys(CRITTERS) as CritterName[]).slice(0, n);
}

/** Level 10 deals two halves or four quarters to two friends. */
export function dealCut(rng: Rng): 2 | 4 { return rng.chance(0.5) ? 2 : 4; }
/**
 * A tap on a tray piece sends it to the plate with the fewest (the first of them on a tie), so every tap is right and
 * `pieces` taps leave the plates equal.
 */
export function dealTo(plates: readonly number[]): number { return nextPlate([...plates]); }

/**
 * Level 13's asks: two different fractions of one sandwich that fit in it together (one half and one quarter, or three
 * quarters and one quarter; one half and three quarters is more than the sandwich). Never two of the same, so one
 * friend always has more.
 */
export const COMPARE_PAIRS = FRACTIONS.flatMap((a, i) => FRACTIONS.slice(i + 1).map((b) => [a, b] as const))
  .filter(([a, b]) => a.numerator / a.denominator + b.numerator / b.denominator <= 1);
export type ComparePair = readonly [FractionRequest, FractionRequest];
/** A seeded pair, in a seeded plate order. */
export function comparePair(rng: Rng): ComparePair {
  const [a, b] = rng.pick(COMPARE_PAIRS);
  return rng.chance(0.5) ? [a, b] : [b, a];
}
/** How many pieces of a cut make each ask (fractional when the cut cannot make it). */
export const needs = (pair: ComparePair, cut: number) => pair.map((r) => (cut * r.numerator) / r.denominator);
/** The cut that serves both asks: the fewest pieces that make each a whole number of pieces (quarters). */
export const compareCut = (pair: ComparePair, cuts: readonly number[]) =>
  [...cuts].sort((a, b) => a - b).find((c) => pair.every((r) => fractionCut(r, [c]) === c));
/** The first plate whose serving is not its friend's ask, or -1 when both are right. */
export function firstUnmet(pair: ComparePair, cut: number, counts: readonly number[]): number {
  return pair.findIndex((r, i) => !servesFraction(r, cut, counts[i] ?? 0));
}
/** Both friends have exactly what they asked for. */
export const servesBoth = (pair: ComparePair, cut: number, counts: readonly number[]) => cut > 0 && firstUnmet(pair, cut, counts) < 0;
/** The plate with more: the larger ask (the two always differ). */
export const morePlate = (pair: ComparePair) => (pair[0].numerator / pair[0].denominator > pair[1].numerator / pair[1].denominator ? 0 : 1);

/**
 * The journal entries a finished round showed (decision 6): two halves of one whole served (`half`), two quarters on
 * one plate, which is one half (`quarter`), and every third of a pizza served (`third`). Only a fair or asked-for serve
 * counts; a lopsided cut is not two halves.
 */
export type KitchenDiscovery = 'half' | 'quarter' | 'third';
export const KITCHEN_DISCOVERIES: readonly KitchenDiscovery[] = ['half', 'quarter', 'third'];
export function kitchenDiscoveries(mode: string, cut: number, lopsided: boolean, counts: readonly number[], pieces: number): KitchenDiscovery[] {
  const found: KitchenDiscovery[] = [];
  const everyPiece = counts.reduce((a, b) => a + b, 0) === pieces && pieces > 0;
  const shares = mode === 'share' || mode === 'deal';
  if (shares && everyPiece && cut === 2 && !lopsided) found.push('half');
  if (cut === 4 && counts.some((n) => n === 2)) found.push('quarter');
  if (shares && everyPiece && cut === 3) found.push('third');
  return found;
}
/** Level 13's two friends are named aloud ("the cat asked for…"), so the island's own pip is never one of them. */
export function compareFriends(rng: Rng): CritterName[] {
  return rng.shuffle((Object.keys(CRITTERS) as CritterName[]).filter((n) => n !== 'pip')).slice(0, 2);
}
