import type { Rng } from '../../engine/random';

export interface MemoryCard { pair: number; side: 0 | 1 }
export function makeDeck(pairs: number, rng: Rng): MemoryCard[] {
  return rng.shuffle(Array.from({ length: pairs }, (_, pair) => [{ pair, side: 0 as const }, { pair, side: 1 as const }]).flat());
}

/** Only penalize a choice when the matching card was already known. */
export function knownMismatch(cards: MemoryCard[], first: number, second: number, seen: ReadonlySet<number>): boolean {
  return cards[first].pair !== cards[second].pair && cards.some((card, i) => i !== first && card.pair === cards[first].pair && seen.has(i));
}
