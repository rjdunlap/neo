import type { Rng } from '../../engine/random';

export interface MemoryCard { pair: number; side: 0 | 1 }
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
