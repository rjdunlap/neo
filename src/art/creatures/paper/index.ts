import type { SpeciesId } from '../creature';
import type { ArtSet } from '../illustrated';
import { sproutPaperArt } from './sprout';

/**
 * The paper cut-out creatures (docs/ART-STYLE.md), drawn in code into the illustrated rigs' sprite boxes. A species
 * listed here wears its paper set; one not yet drawn keeps its painted set. `?paintedpets` in the address brings the
 * painted sets back, to compare.
 */
export const PAPER_ART: Partial<Record<SpeciesId, () => ArtSet>> = {
  sprout: sproutPaperArt,
};

export const PAPER_CREATURES =
  typeof location === 'undefined' || !new URLSearchParams(location.search).has('paintedpets');

/** A species' paper set, or null to load its painted one. */
export function paperArt(species: SpeciesId): ArtSet | null {
  const draw = PAPER_CREATURES && typeof document !== 'undefined' ? PAPER_ART[species] : undefined;
  return draw ? draw() : null;
}
