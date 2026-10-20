import type { LandId } from '../content/lands';
import type { PetColor } from '../content/world';

/**
 * RW05 (docs/rework/CREATURE-COLLECTION.md): a species is content, never saved and never owned. A child owns
 * individuals (`SaveData.creatures.owned`), each of one species. Pixi-free, so the save can repair against it.
 */
export const SPECIES_IDS = ['sprout', 'river', 'glider'] as const;
export type SpeciesId = (typeof SPECIES_IDS)[number];

export interface Species {
  id: SpeciesId;
  /** For grown-ups; the child hears `species.<id>`. */
  name: string;
  /** Where it is met, informative only until RW07's adventures. */
  land: LandId;
  /** The colour a new individual starts in, and what an unknown saved colour becomes. */
  color: PetColor;
  /** Three names to offer; the first is the fallback for a damaged save. */
  names: readonly [string, string, string];
  /** The pentatonic steps (0 = middle C) of its chirp on a poke. */
  chirp: readonly number[];
}

export const SPECIES: Record<SpeciesId, Species> = {
  sprout: { id: 'sprout', name: 'Sprout', land: 'rainbow-meadow', color: 'teal', names: ['Pip', 'Mochi', 'Clover'], chirp: [9, 11] },
  river: { id: 'river', name: 'River', land: 'counting-cove', color: 'orange', names: ['Pebble', 'Ripple', 'Bubbles'], chirp: [7, 9, 12] },
  glider: { id: 'glider', name: 'Cloud glider', land: 'puzzle-peaks', color: 'purple', names: ['Breeze', 'Wisp', 'Sky'], chirp: [12, 14, 11] },
};

export const isSpecies = (v: unknown): v is SpeciesId => SPECIES_IDS.some((s) => s === v);
