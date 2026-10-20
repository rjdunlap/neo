import { Companion } from '../../creatures/companion';
import { SPECIES, type SpeciesId } from '../../creatures/species';
import type { LandId, LandLayout } from '../../content/lands';
import type { Graphics } from 'pixi.js';
import type { View } from '../../engine/view';
import type { App } from '../App';
import { LandScene } from './LandScene';
import { drawBeach } from './beach';
import { drawCove } from './cove';
import { drawMeadow } from './meadow';
import { drawPeaks } from './peaks';

/**
 * A location's resident (an invented island creature, never her companion and never collected by being seen) and its
 * scenery. A location whose resident is not prepared yet keeps the land's code-drawn host until it is.
 */
interface Place {
  resident?: SpeciesId;
  scenery: (g: Graphics, layout: LandLayout, view: View, ground: number) => void;
}

/** The locations built so far (RW13, docs/rework/ISLAND-REVAMP.md#build-slices-in-order); each slice adds one. */
export const LOCATIONS: Partial<Record<LandId, Place>> = {
  'rainbow-meadow': { resident: 'sprout', scenery: drawMeadow },
  'counting-cove': { resident: 'river', scenery: drawCove },
  'puzzle-peaks': { resident: 'glider', scenery: drawPeaks },
  // Tote, the beach's resident, waits on RW02b step 3; the land's duck greets her until then.
  'bubble-beach': { scenery: drawBeach },
};

export const isLocation = (id: LandId) => id in LOCATIONS;

/**
 * RW13: a land as a location at the site root. It is the land's scene (its games and signpost from `landLayout`, the
 * same suggestions, the same `{ land }` origin, so Home from a game comes back here) with the location's ecosystem drawn
 * over the backdrop and its illustrated resident standing where the host stands. Tapping the resident pokes it, says
 * the location's line and suggests a game. Home goes to the root's entry scene (`go.hub()` at the root).
 */
export class LocationScene extends LandScene {
  /** The illustrated resident, or null where the land's code-drawn host still stands in. */
  readonly resident: Companion | null;

  constructor(app: App, id: LandId) {
    const place = LOCATIONS[id];
    if (!place) throw new Error(`${id} is not a location yet`);
    let resident: Companion | null = null;
    const species = place.resident;
    super(app, id, {
      host: species
        ? () => {
            resident = new Companion({ species, look: { color: SPECIES[species].color }, id: null });
            return { node: resident, critter: resident, hitArea: resident.touchArea(10) };
          }
        : undefined,
      scenery: place.scenery,
      hostSaysLine: true,
    });
    this.resident = resident;
  }
}
