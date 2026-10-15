import type { CritterName } from '../../art/critter';
import type { PropKind } from '../../art/props';
import type { ColorName } from '../../art/palette';
import type { ShapeKind } from '../../art/shapes';
import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';

export const PLANS = [
  { pairs: 2, mode: 'pictures', name: 'Four cards: two picture pairs' },
  { pairs: 3, mode: 'pictures', name: 'Six cards: three picture pairs' },
  { pairs: 4, mode: 'pictures', name: 'Eight cards: four picture pairs' },
  { pairs: 6, mode: 'pictures', name: 'Twelve cards: six picture pairs' },
  { pairs: 8, mode: 'pictures', name: 'Sixteen cards: eight picture pairs' },
  { pairs: 4, mode: 'numbers', name: 'Match numbers 1–4 to dots' },
  { pairs: 8, mode: 'numbers', name: 'Match numbers 1–8 to dots' },
  { pairs: 8, mode: 'attributes', name: 'Match both shape and color' },
  { pairs: 8, mode: 'letters', name: 'Match uppercase and lowercase letters' },
  { pairs: 10, mode: 'number-words', name: 'Match number words one–ten to numerals' },
  { pairs: 3, mode: 'fractions', name: 'Match fraction pictures to names' },
] as const;
export const LEVELS: BandLevels = { preschool: { min: 1, max: 5 }, prek: { min: 3, max: 9 }, school: { min: 8, max: 11 } };
const COLORS: ColorName[] = ['red', 'blue', 'yellow', 'purple', 'green', 'pink', 'orange', 'teal'];
const SHAPES: ShapeKind[] = ['circle', 'star', 'square', 'heart', 'triangle', 'hexagon', 'circle', 'star'];

export type MemoryPicture =
  | { kind: 'shape'; id: string; name: string; color: ColorName; shape: ShapeKind }
  | { kind: 'friend'; id: string; name: string; animal: CritterName }
  | { kind: 'prop'; id: string; name: string; prop: PropKind; color: ColorName }
  | { kind: 'vehicle'; id: string; name: string; vehicle: VehicleKind; color: ColorName };

/** Eight vehicles that look different even in outline; drawn in `art.ts`. */
export const VEHICLES = [['car', 'red'], ['bus', 'yellow'], ['truck', 'blue'], ['train', 'green'],
  ['boat', 'teal'], ['plane', 'purple'], ['rocket', 'orange'], ['tractor', 'pink']] as const;
export type VehicleKind = typeof VEHICLES[number][0];

/** Each family has eight visually distinct identities; never mix families on one board. */
export const PICTURE_POOLS: readonly (readonly MemoryPicture[])[] = [
  COLORS.map((color, i) => ({ kind: 'shape' as const, id: `shape-${color}-${SHAPES[i]}`, name: `${color} ${SHAPES[i]}`, color, shape: SHAPES[i] })),
  (['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny', 'pip'] as const).map(animal =>
    ({ kind: 'friend' as const, id: `friend-${animal}`, name: animal === 'pip' ? 'Pip' : animal, animal })),
  ([['apple', 'red'], ['orange', 'orange'], ['lemon', 'yellow'], ['pear', 'green'],
    ['blueberries', 'blue'], ['grapes', 'purple'], ['balloon', 'pink'], ['flower', 'teal']] as const).map(([prop, color]) =>
    ({ kind: 'prop' as const, id: `prop-${prop}`, name: prop, prop, color })),
  VEHICLES.map(([vehicle, color]) => ({ kind: 'vehicle' as const, id: `vehicle-${vehicle}`, name: vehicle, vehicle, color })),
];

/** Pair IDs index this seeded content selection, rather than a fixed renderer index. */
export function selectPictures(pairs: number, rng: Rng): MemoryPicture[] {
  return rng.shuffle([...rng.pick(PICTURE_POOLS)]).slice(0, pairs);
}

export type MemoryMode = typeof PLANS[number]['mode'];
export function planFor(level: number) { return PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))]; }
export function pictureIdentity(mode: MemoryMode, pair: number) {
  return { color: mode === 'attributes' ? COLORS[pair % 2] : COLORS[pair],
    shape: mode === 'attributes' ? SHAPES[Math.floor(pair / 2)] : SHAPES[pair] };
}
export function cardLabel(mode: MemoryMode, card: MemoryCard, letters: readonly string[], pictures?: readonly MemoryPicture[]): string {
  if (mode === 'pictures' && pictures) return pictures[card.pair].name;
  if (mode === 'fractions') return fraction(card.pair).name;
  if (mode === 'letters') return letters[card.pair];
  if (mode === 'numbers' || mode === 'number-words') return numberWord(card.pair);
  const { color, shape } = pictureIdentity(mode, card.pair);
  return `${color} ${shape}`;
}

/** Help only points to a partner this player has actually revealed. */
export function hintPartner(cards: readonly MemoryCard[], first: number, seen: ReadonlySet<number>, wrong: number): number | null {
  if (wrong < 2) return null;
  const partner = cards.findIndex((card, i) => i !== first && card.pair === cards[first].pair);
  return partner >= 0 && seen.has(partner) ? partner : null;
}

export interface DotSpot { x: number; y: number }
/** Dot radius on a card face; layouts keep every centre this far apart (twice the radius plus a gap) and inside DOT_REACH. */
export const DOT_RADIUS = 9;
export const DOT_GAP = 22;
export const DOT_REACH = { x: 54, y: 50 };
const grid = (rows: number[], dx: number, dy: number): DotSpot[] => rows.flatMap((count, r) =>
  Array.from({ length: count }, (_, c) => ({ x: (c - (count - 1) / 2) * dx, y: (r - (rows.length - 1) / 2) * dy })));
const SCATTER: Record<number, DotSpot[]> = {
  2: [{ x: -26, y: -22 }, { x: 26, y: 24 }],
  3: [{ x: -30, y: -24 }, { x: 30, y: -14 }, { x: 0, y: 30 }],
  4: [{ x: -28, y: -28 }, { x: 28, y: -28 }, { x: -28, y: 28 }, { x: 28, y: 28 }],
  5: [{ x: -28, y: -28 }, { x: 28, y: -28 }, { x: 0, y: 0 }, { x: -28, y: 28 }, { x: 28, y: 28 }],
  6: [{ x: -26, y: -32 }, { x: 26, y: -32 }, { x: -26, y: 0 }, { x: 26, y: 0 }, { x: -26, y: 32 }, { x: 26, y: 32 }],
  7: [{ x: -40, y: -30 }, { x: 0, y: -38 }, { x: 38, y: -26 }, { x: -22, y: 0 }, { x: 24, y: 6 }, { x: -38, y: 32 }, { x: 8, y: 38 }],
  8: [{ x: -40, y: -30 }, { x: 0, y: -38 }, { x: 38, y: -26 }, { x: -22, y: 0 }, { x: 24, y: 6 }, { x: -38, y: 32 }, { x: 8, y: 38 }, { x: 42, y: 36 }],
};
/**
 * Curated ways to show n dots on a card (n 1–8): two columns (the original), a dice-like scatter, rows and a
 * five-frame (a row of five, then the rest). Different cards can show the same number differently, so the match is the
 * quantity, never one picture of it. Duplicates (one row is also the frame at 1–4) are dropped.
 */
export function dotLayouts(n: number): DotSpot[][] {
  const frame = grid(n <= 5 ? [n] : [5, n - 5], 24, 30);
  const rows = n <= 4 ? grid([n], 30, 0) : grid([Math.ceil(n / 2), Math.floor(n / 2)], 30, 32);
  const columns = Array.from({ length: n }, (_, i) => ({ x: (i % 2) * 34 - (n === 1 ? 0 : 17), y: Math.floor(i / 2) * 25 - (Math.ceil(n / 2) - 1) * 12.5 }));
  const all = [columns, SCATTER[n] ?? grid([1], 0, 0), rows, frame];
  const seen = new Set<string>();
  return all.filter(layout => {
    const key = layout.map(d => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).sort().join('|');
    return seen.has(key) ? false : (seen.add(key), true);
  });
}
/** One layout per pair, drawn with the seeded RNG; both faces of a pair share its quantity, not its arrangement. */
export function selectDotLayouts(pairs: number, rng: Rng): DotSpot[][] {
  return Array.from({ length: pairs }, (_, pair) => rng.pick(dotLayouts(pair + 1)));
}

export interface MemoryCard { pair: number; side: 0 | 1 }
/** The reading pairs for level 10. Index zero is the numeral one. */
export const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const;
export function numberWord(pair: number): string { return NUMBER_WORDS[pair] ?? ''; }
export const FRACTIONS = [
  { name: 'a half', numerator: 1, denominator: 2 },
  { name: 'a quarter', numerator: 1, denominator: 4 },
  { name: 'three quarters', numerator: 3, denominator: 4 },
] as const;
export function fraction(pair: number) { return FRACTIONS[pair]; }
export function makeDeck(pairs: number, rng: Rng): MemoryCard[] {
  return rng.shuffle(Array.from({ length: pairs }, (_, pair) => [{ pair, side: 0 as const }, { pair, side: 1 as const }]).flat());
}

/** Only penalize a choice when the matching card was already known. */
export function knownMismatch(cards: MemoryCard[], first: number, second: number, seen: ReadonlySet<number>): boolean {
  return cards[first].pair !== cards[second].pair && cards.some((card, i) => i !== first && card.pair === cards[first].pair && seen.has(i));
}

/**
 * The card a player who remembers what has been turned over picks next (the couch bot and the how-to card's ghost finger):
 * as a second card, the first card's partner if it has been seen, else one nobody has seen; as a first card, one whose
 * partner is already known, else one nobody has seen. -1 when nothing is left to pick.
 */
export function nextCard(cards: readonly MemoryCard[], seen: ReadonlySet<number>, matched: (i: number) => boolean, first: number | null): number {
  const open = (k: number) => !matched(k) && k !== first;
  const partner = (k: number) => cards.findIndex((c, j) => j !== k && c.pair === cards[k].pair);
  if (first !== null) {
    const friend = partner(first);
    return seen.has(friend) ? friend : cards.findIndex((_, k) => open(k) && !seen.has(k));
  }
  const known = cards.findIndex((_, k) => open(k) && seen.has(partner(k)));
  return known >= 0 ? known : cards.findIndex((_, k) => open(k) && !seen.has(k));
}
