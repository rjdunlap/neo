import type { CastId } from '../cast';
import type { SpeciesId } from '../creature';
import type { ArtSet } from '../illustrated';

/**
 * The paper cut-out creatures (docs/ART-STYLE.md), drawn in code into the illustrated rigs' sprite boxes. Each species
 * is one file here named after it (`sprout.ts`, `tote.ts`…) whose default export draws its set; a species with no file
 * keeps its painted set. `?paintedpets` in the address brings the painted sets back, to compare.
 */
const files = import.meta.glob<() => ArtSet>(['./*.ts', '!./index.ts', '!./canvas.ts', '!./*.test.ts'], {
  import: 'default',
  eager: true,
});

export type PaperSpecies = SpeciesId | CastId;

export const PAPER_ART: Partial<Record<PaperSpecies, () => ArtSet>> = Object.fromEntries(
  Object.entries(files).map(([path, draw]) => [path.slice(2, -3), draw]),
);

export const PAPER_CREATURES =
  typeof location === 'undefined' || !new URLSearchParams(location.search).has('paintedpets');

/** A species' paper set, or null to load its painted one. */
export function paperArt(species: PaperSpecies): ArtSet | null {
  const draw = PAPER_CREATURES && typeof document !== 'undefined' ? PAPER_ART[species] : undefined;
  return draw ? draw() : null;
}
