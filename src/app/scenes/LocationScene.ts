import { Companion } from '../../creatures/companion';
import { SPECIES, type SpeciesId } from '../../creatures/species';
import type { LandId, LandLayout } from '../../content/lands';
import type { Graphics } from 'pixi.js';
import type { BackdropStyle } from '../../art/scenery';
import type { View } from '../../engine/view';
import type { App } from '../App';
import { LandScene } from './LandScene';
import { drawBeach } from './beach';
import { drawCanyon } from './canyon';
import { drawCove } from './cove';
import { drawGrove, GROVE_BACKDROP, GROVE_HEADING } from './grove';
import { drawMeadow } from './meadow';
import { drawMountain } from './mountain';
import { drawPeaks } from './peaks';
import { drawVillage } from './village';

/**
 * A location's resident (an invented island creature, never her companion and never collected by being seen) and its
 * scenery. A location whose resident is not prepared yet keeps the land's code-drawn host until it is.
 */
interface Place {
  resident?: SpeciesId;
  scenery: (g: Graphics, layout: LandLayout, view: View, ground: number) => void;
  /** A sky of its own in place of the land's (`classic/` keeps the land's), and the heading's colour over it. */
  backdrop?: BackdropStyle;
  headingColor?: number;
}

/** The locations built so far (RW13, docs/rework/ISLAND-REVAMP.md#build-slices-in-order); each slice adds one. */
export const LOCATIONS: Partial<Record<LandId, Place>> = {
  'rainbow-meadow': { resident: 'sprout', scenery: drawMeadow },
  'counting-cove': { resident: 'river', scenery: drawCove },
  'puzzle-peaks': { resident: 'glider', scenery: drawPeaks },
  // Tote, the beach's resident, waits on RW02b step 3; the land's duck greets her until then.
  'bubble-beach': { scenery: drawBeach },
  // Trill, the cloud forest's resident, waits on RW02b step 3 likewise; the land's bear greets her until then.
  'music-mountain': { scenery: drawMountain },
  // Dapple, the canyon's resident, waits on RW02b step 3 likewise; the land's cat greets her until then.
  treehouse: { scenery: drawCanyon },
  // Bramble, the village's resident, waits on RW02b step 3 likewise; the land's squirrel greets her until then.
  'cozy-village': { scenery: drawVillage },
  // Lumen, the grove's resident, waits on RW02b step 3 likewise; the land's bunny greets her until then. Night falls
  // here only: the grove's own sky replaces the land's day one, which the classic island keeps.
  'story-grove': { scenery: drawGrove, backdrop: GROVE_BACKDROP, headingColor: GROVE_HEADING },
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
      backdrop: place.backdrop,
      headingColor: place.headingColor,
      hostSaysLine: true,
    });
    this.resident = resident;
  }
}
