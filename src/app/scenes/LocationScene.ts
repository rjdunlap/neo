import { Companion } from '../../creatures/companion';
import { SPECIES, type SpeciesId } from '../../creatures/species';
import type { LandId, LandLayout } from '../../content/lands';
import type { Graphics } from 'pixi.js';
import type { View } from '../../engine/view';
import type { App } from '../App';
import { LandScene } from './LandScene';
import { drawMeadow } from './meadow';

/** A location's resident (an invented island creature, never her companion and never collected by being seen) and its scenery. */
interface Place {
  resident: SpeciesId;
  scenery: (g: Graphics, layout: LandLayout, view: View, ground: number) => void;
}

/** The locations built so far (RW13, docs/rework/ISLAND-REVAMP.md#build-slices-in-order); each slice adds one. */
export const LOCATIONS: Partial<Record<LandId, Place>> = {
  'rainbow-meadow': { resident: 'sprout', scenery: drawMeadow },
};

export const isLocation = (id: LandId) => id in LOCATIONS;

/**
 * RW13: a land as a location at the site root. It is the land's scene (its games and signpost from `landLayout`, the
 * same suggestions, the same `{ land }` origin, so Home from a game comes back here) with the location's ecosystem drawn
 * over the backdrop and its illustrated resident standing where the host stands. Tapping the resident pokes it, says
 * the location's line and suggests a game. Home goes to the root's entry scene (`go.hub()` at the root).
 */
export class LocationScene extends LandScene {
  readonly resident: Companion;

  constructor(app: App, id: LandId) {
    const place = LOCATIONS[id];
    if (!place) throw new Error(`${id} is not a location yet`);
    let resident: Companion | null = null;
    super(app, id, {
      host: () => {
        resident = new Companion({ species: place.resident, look: { color: SPECIES[place.resident].color }, id: null });
        return { node: resident, critter: resident, hitArea: resident.touchArea(10) };
      },
      scenery: place.scenery,
      hostSaysLine: true,
    });
    this.resident = resident!;
  }
}
