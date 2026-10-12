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

export type MemoryMode = typeof PLANS[number]['mode'];
export function planFor(level: number) { return PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))]; }
export function pictureIdentity(mode: MemoryMode, pair: number) {
  return { color: mode === 'attributes' ? COLORS[pair % 2] : COLORS[pair],
    shape: mode === 'attributes' ? SHAPES[Math.floor(pair / 2)] : SHAPES[pair] };
}
export function cardLabel(mode: MemoryMode, card: MemoryCard, letters: readonly string[]): string {
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
