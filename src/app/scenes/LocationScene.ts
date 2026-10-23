import { Companion, makeCompanion } from '../../creatures/companion';
import { RESIDENTS, Resident } from '../../creatures/resident';
import { SPECIES, type SpeciesId } from '../../creatures/species';
import { castArt, type CastId } from '../../art/creatures/cast';
import { store } from '../../progress/store';
import type { LineId } from '../../content/voice-script';
import type { LandId, LandLayout } from '../../content/lands';
import type { Graphics } from 'pixi.js';
import { arrowIcon } from '../../ui/icons';
import type { BackdropStyle } from '../../art/scenery';
import type { View } from '../../engine/view';
import type { App } from '../App';
import { LandScene, type LandHost } from './LandScene';
import { drawBeach } from './beach';
import { drawCanyon } from './canyon';
import { drawCove } from './cove';
import { drawFarm } from './farm';
import { drawGrove, GROVE_BACKDROP, GROVE_HEADING } from './grove';
import { drawLab, LAB_BACKDROP, LAB_HEADING } from './lab';
import { drawLake } from './lakeside';
import { drawMeadow } from './meadow';
import { drawMountain } from './mountain';
import { drawPeaks } from './peaks';
import { drawVillage } from './village';

/**
 * A location's resident (an invented island creature, never collected by being seen) and its scenery: one of the three
 * pilot species (RW13) or one of the second-wave six (RW14 slice 2, `RESIDENTS`). Her own friend stands in the
 * resident's place where it is the resident's species (a sprout child in Rainbow Meadow): it says it is home, and the
 * corner guide hides there, so no location shows her species twice.
 */
interface Place {
  resident?: SpeciesId | CastId;
  scenery: (g: Graphics, layout: LandLayout, view: View, ground: number) => void;
  /** A sky of its own in place of the land's (`classic/` keeps the land's), and the heading's colour over it. */
  backdrop?: BackdropStyle;
  headingColor?: number;
}

/** The locations built so far (RW13, docs/rework/ISLAND-REVAMP.md#build-slices-in-order; residents: RW14 slice 2). */
export const LOCATIONS: Partial<Record<LandId, Place>> = {
  'rainbow-meadow': { resident: 'sprout', scenery: drawMeadow },
  'counting-cove': { resident: 'river', scenery: drawCove },
  'puzzle-peaks': { resident: 'glider', scenery: drawPeaks },
  'bubble-beach': { resident: 'tote', scenery: drawBeach },
  'music-mountain': { resident: 'trill', scenery: drawMountain },
  treehouse: { resident: 'dapple', scenery: drawCanyon },
  'cozy-village': { resident: 'bramble', scenery: drawVillage },
  // Night falls here only: the grove's own sky replaces the land's day one, which the classic island keeps.
  'story-grove': { resident: 'lumen', scenery: drawGrove, backdrop: GROVE_BACKDROP, headingColor: GROVE_HEADING },
  // The lab is in a cave's mouth, so the cave's rock replaces the land's day sky here only.
  'tinker-lab': { resident: 'mossback', scenery: drawLab, backdrop: LAB_BACKDROP, headingColor: LAB_HEADING },
  // The farm and the lake have no resident species: the land's cow and cat greet her, and each keeps its own sky.
  barnyard: { scenery: drawFarm },
  'lantern-lake': { scenery: drawLake },
};

/** The land a resident is at home in: a pilot species' `land`, or a second-wave resident's. */
export const homeOf = (resident: SpeciesId | CastId): LandId => (resident in SPECIES ? SPECIES[resident as SpeciesId].land : RESIDENTS[resident as CastId].land);

export const isLocation = (id: LandId) => id in LOCATIONS;

/**
 * RW13: a land as a location at the site root. It is the land's scene (its games and signpost from `landLayout`, the
 * same suggestions, the same `{ land }` origin, so Home from a game comes back here) with the location's ecosystem drawn
 * over the backdrop and its illustrated resident standing where the host stands. Tapping the resident pokes it, says
 * its hello (a second-wave resident) or the location's line and suggests a game. Built with `back` (the root, RW08),
 * its corner button is a Back arrow to Explore's Places; without it, Home goes to `go.hub()`.
 */
export class LocationScene extends LandScene {
  /** The illustrated resident (her own friend where this is its home), or null where the land's code-drawn host still stands in. */
  readonly resident: Companion | Resident | null;
  /** Whether her own friend stands here as the resident, so the corner guide hides. */
  readonly atHome: boolean;

  /** `back`, at the root (RW08), turns the corner button into a Back arrow to Explore's Places. */
  constructor(app: App, id: LandId, back?: () => void) {
    const place = LOCATIONS[id];
    if (!place) throw new Error(`${id} is not a location yet`);
    let resident: Companion | Resident | null = null;
    const species = place.resident;
    const atHome = !!species && store.companion?.species === species;
    let host: (() => LandHost) | undefined;
    let hostLine: LineId | undefined;
    if (species && atHome) {
      host = () => {
        resident = makeCompanion();
        return { node: resident, critter: resident, hitArea: resident.touchArea(10) };
      };
      hostLine = 'location.home';
    } else if (species && species in SPECIES) {
      host = () => {
        resident = new Companion({ species: species as SpeciesId, look: { color: SPECIES[species as SpeciesId].color }, id: null });
        return { node: resident, critter: resident, hitArea: resident.touchArea(10) };
      };
    } else if (species && castArt(species as CastId)) {
      // Without its art (a failed load), the land's code-drawn host greets her instead.
      host = () => {
        resident = new Resident(species as CastId);
        return { node: resident, critter: resident, hitArea: resident.touchArea(10) };
      };
      hostLine = RESIDENTS[species as CastId].line;
    }
    super(app, id, {
      host,
      scenery: place.scenery,
      backdrop: place.backdrop,
      headingColor: place.headingColor,
      hostSaysLine: true,
      hostLine,
      ...(back ? { home: back, homeIcon: () => arrowIcon(-1) } : {}),
    });
    this.resident = resident;
    this.atHome = atHome;
  }

  init() {
    super.init();
    // Her friend is the resident here: one of her, not two.
    if (this.atHome) this.pip.visible = false;
  }
}
