import type { Point } from '../art/creatures/illustrated';
import { GLIDER_ART } from '../art/creatures/glider-illustrated';
import { RIVER_ART } from '../art/creatures/river-illustrated';
import { SPROUT_ART } from '../art/creatures/sprout-illustrated';
import type { SpeciesId } from './species';

/**
 * RW05 slice 2 (docs/rework/CREATURE-COLLECTION.md#the-companion-in-code-one-seam-two-slices): the body parts the
 * large-pet games name (docs/rework/art-requests/GAME-FIT.md), where each species has them, and why a species lacks one.
 * Points are sprite pixels of the species' prepared picture, read from its `*_ART` table; `Companion.part()` turns them
 * into containers that ride the picture. A pair (ears, cheeks, hands, feet) lists both; a side-on species shows one
 * cheek and one eye.
 */
export const PART_NAMES = ['tummy', 'head', 'cheeks', 'ears', 'nose', 'eyes', 'hands', 'feet', 'back', 'neck'] as const;
export type PartName = (typeof PART_NAMES)[number];

export interface PartTable {
  /** Sprite points for each part the species has. */
  points: Partial<Record<PartName, readonly Point[]>>;
  /** Each part it lacks, with the reason. A part is in exactly one of the two. */
  misfits: Partial<Record<PartName, string>>;
  /** Where a part is a stand-in rather than the anatomy the word names, why. */
  notes?: Partial<Record<PartName, string>>;
}

const face = (A: { nose: Point; cheeks: readonly Point[]; ears: readonly Point[]; slots: { head: Point; eyes: Point } }) => ({
  head: [A.slots.head],
  eyes: [A.slots.eyes],
  nose: [A.nose],
  cheeks: A.cheeks,
  ears: A.ears,
});

export const PARTS: Record<SpeciesId, PartTable> = {
  sprout: {
    points: {
      ...face(SPROUT_ART),
      neck: [SPROUT_ART.slots.neck],
      tummy: [SPROUT_ART.slots.tummy],
      back: [SPROUT_ART.slots.back],
      hands: SPROUT_ART.slots.hands,
      feet: SPROUT_ART.slots.feet,
    },
    misfits: {},
  },
  river: {
    points: {
      ...face(RIVER_ART),
      neck: [RIVER_ART.slots.neck],
      tummy: [RIVER_ART.slots.tummy],
      back: [RIVER_ART.slots.back],
      hands: RIVER_ART.slots.hands,
      feet: RIVER_ART.slots.feet,
    },
    misfits: {},
    notes: { hands: 'its front paws: it walks on all four' },
  },
  glider: {
    points: {
      ...face(GLIDER_ART),
      back: [GLIDER_ART.slots.back],
      tummy: [{ x: 600, y: 245 }],
    },
    misfits: { neck: GLIDER_ART.misfits.neck, hands: GLIDER_ART.misfits.hands, feet: GLIDER_ART.misfits.feet },
    notes: { tummy: GLIDER_ART.misfits.tummy, ears: 'one fin-ear shows, side on' },
  },
};

/** The sprite table each species' points are in, for turning them into creature units. */
export const ART_OF: Record<SpeciesId, { scale: number; centre: Point; body: readonly Point[] }> = { sprout: SPROUT_ART, river: RIVER_ART, glider: GLIDER_ART };

/** A sprite point in creature units (the rig's own, before the companion's fit). */
export const creaturePoint = (species: SpeciesId, p: Point): Point => {
  const A = ART_OF[species];
  return { x: (p.x - A.centre.x) * A.scale, y: (p.y - A.centre.y) * A.scale };
};
