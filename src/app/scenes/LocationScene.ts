import { Companion, makeCompanion } from '../../creatures/companion';
import { RESIDENTS, Resident } from '../../creatures/resident';
import { Wanderer, wanderKeepOut, wanderRoute } from '../../creatures/wander';
import { Rng } from '../../engine/random';
import { sfx } from '../../audio/sfx';
import { meadowKeepOut } from './meadow';
import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { SPECIES, type SpeciesId } from '../../creatures/species';
import { castArt, type CastId } from '../../art/creatures/cast';
import { pictureSprite } from '../../art/locations';
import { store } from '../../progress/store';
import type { LineId } from '../../content/voice-script';
import type { LandId, LandLayout } from '../../content/lands';
import { ENTRY_NAMES, entryArt, fittedBack } from '../../ui/origin-art';
import { ink, swatch, wood } from '../../art/palette';
import { voice } from '../../audio/voice';
import type { BackdropStyle } from '../../art/scenery';
import type { View } from '../../engine/view';
import type { App } from '../App';
import { hostScale, LandScene, type LandHost } from './LandScene';
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
  'story-grove': {
    resident: 'lumen',
    scenery: drawGrove,
    backdrop: GROVE_BACKDROP,
    headingColor: GROVE_HEADING,
  },
  // The lab is in a cave's mouth, so the cave's rock replaces the land's day sky here only.
  'tinker-lab': { resident: 'mossback', scenery: drawLab, backdrop: LAB_BACKDROP, headingColor: LAB_HEADING },
  // The farm and the lake have no resident species: the land's cow and cat greet her, and each keeps its own sky.
  barnyard: { scenery: drawFarm },
  'lantern-lake': { scenery: drawLake },
};

/** The land a resident is at home in: a pilot species' `land`, or a second-wave resident's. */
export const homeOf = (resident: SpeciesId | CastId): LandId =>
  resident in SPECIES ? SPECIES[resident as SpeciesId].land : RESIDENTS[resident as CastId].land;

export const isLocation = (id: LandId) => id in LOCATIONS;

/**
 * RW13: a land as a location at the site root. It is the land's scene (its games and signpost from `landLayout`, the
 * same suggestions, the same `{ land }` origin, so Home from a game comes back here) with the location's ecosystem drawn
 * over the backdrop and its illustrated resident standing where the host stands. Tapping the resident pokes it, says
 * its hello (a second-wave resident) or the location's line and suggests a game. Built with `back` (the root, RW08),
 * its corner button is a Back arrow with Places' picture, and a house beside it goes Home (RW14 slice 3); without it,
 * Home goes to `go.hub()`.
 */
export class LocationScene extends LandScene {
  /** The illustrated resident (her own friend where this is its home), or null where the land's code-drawn host still stands in. */
  readonly resident: Companion | Resident | null;
  /** Whether her own friend stands here as the resident, so the corner guide hides. */
  readonly atHome: boolean;
  /** P5: a resident that carries on walks its route on its own (null for the rest). */
  readonly wanderer: Wanderer | null = null;
  private chime: Graphics | null = null;
  private chimeSway = 0;
  private notes = 0;
  private readonly pad = new Container();
  /** Opened at the root (with a Back to Places), where a visit is remembered for Explore's postcard. */
  private readonly opensAtRoot: boolean;
  /** Laid out for a phone held upright as well (chunk 31, shell slice 3); the island's own lands at `classic/` stay sideways. */
  upright = true;
  uprightArea = true;

  /** `back`, at the root (RW08), turns the corner button into a Back arrow to Explore's Places; `page` opens a full land at that page (a game's origin). */
  constructor(app: App, id: LandId, back?: () => void, page?: number) {
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
        resident = new Companion({
          species: species as SpeciesId,
          look: { color: SPECIES[species as SpeciesId].color },
          id: null,
        });
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
    // Its illustrated picture where one is prepared and loaded (RW14 slice 4), else its code-drawn scenery.
    const picture = pictureSprite(id);
    super(app, id, {
      host,
      scenery: place.scenery,
      ...(picture ? { backdropImage: picture } : {}),
      backdrop: place.backdrop,
      headingColor: place.headingColor,
      hostSaysLine: true,
      hostLine,
      page,
      // At the root Back carries Places' picture and a house beside it goes Home (RW14 slice 3).
      ...(back
        ? {
            home: back,
            homeIcon: () => fittedBack(entryArt('places'), 50, ink),
            root: { homeSays: () => voice.say('result.back', { place: ENTRY_NAMES.places }) },
          }
        : {}),
    });
    this.resident = resident;
    const placed = resident as Companion | Resident | null;
    if (placed instanceof Resident && RESIDENTS[placed.species].carriesOn) {
      this.wanderer = new Wanderer(new Rng(), () => this.useChime());
    }
    this.atHome = atHome;
    this.opensAtRoot = !!back;
  }

  init() {
    super.init();
    if (this.wanderer) {
      // Any touch on the screen turns the resident toward it: a pad under everything catches the ones that miss.
      this.pad.eventMode = 'static';
      this.content.addChildAt(this.pad, 0);
      this.root.eventMode = 'static';
      this.root.on('pointerdown', (e: FederatedPointerEvent) =>
        this.wanderer?.look(this.field.toLocal(e.global).x),
      );
      this.chime = new Graphics();
      this.content.addChildAt(this.chime, this.content.getChildIndex(this.field));
    }
    // Explore opens with this place's postcard next time (RW14 slice 8).
    if (this.opensAtRoot) store.visitPlace(this.id);
    // Her friend is the resident here: one of her, not two.
    if (this.atHome) this.pip.visible = false;
  }

  resize(v: View) {
    super.resize(v);
    const walker = this.wanderer;
    const res = this.resident;
    const layout = this.layout;
    this.pad.hitArea = new Rectangle(0, 0, v.w, v.h);
    if (!walker || !(res instanceof Resident) || !layout) return;
    // Home, and where free ground allows a stop or two; a full land screen leaves it standing at home.
    const s = hostScale(layout.box);
    const route = wanderRoute(
      layout,
      v,
      wanderKeepOut(layout, meadowKeepOut(layout, v)),
      Resident.footprint(res.species),
      s,
    );
    walker.setRoute(route);
    this.drawChime(route[1] ?? null, s);
    this.placeResident();
  }

  update(dt: number) {
    super.update(dt);
    const walker = this.wanderer;
    if (!walker) return;
    walker.update(dt);
    this.placeResident();
    if (this.chime) {
      this.chimeSway = Math.max(0, this.chimeSway - dt);
      this.chime.rotation = Math.sin(this.chimeSway * 14) * 0.07 * Math.min(1, this.chimeSway);
    }
    if (this.notes > 0 && (this.notesIn -= dt) <= 0) {
      this.notesIn = 0.2;
      // Three bells up the land's pentatonic range, each softer than a game's own sound.
      sfx.bell(this.land.music.range[0] + (3 - this.notes) * 2, 0.16);
      this.notes--;
    }
  }

  private notesIn = 0;

  /** Where the walker is, as the host's place, facing and touch circle. */
  private placeResident() {
    const walker = this.wanderer;
    const res = this.resident;
    if (!walker || !(res instanceof Resident)) return;
    this.host.position.set(walker.x, walker.y);
    res.face(walker.facing, this.hostHit);
  }

  /** It reached the chime: it flutters, the chime sways and rings three notes. */
  private useChime() {
    this.resident?.poke();
    this.chimeSway = 1.6;
    this.notes = 3;
    this.notesIn = 0.15;
  }

  /** The wind chime at the first stop, drawn in host units behind where the resident stands (none where there is no stop). */
  private drawChime(stop: { x: number; y: number } | null, s: number) {
    const g = this.chime;
    if (!g) return;
    g.clear();
    g.visible = !!stop;
    if (!stop) return;
    g.position.set(stop.x, stop.y);
    g.scale.set(s);
    // Pivots at the bar so the whole chime sways from it.
    const top = -250;
    g.pivot.set(0, top);
    g.position.set(stop.x, stop.y + top * s);
    g.roundRect(-70, top - 8, 140, 16, 8)
      .fill(wood.fill)
      .stroke({ width: 3, color: wood.line });
    const tubes = [
      [-50, 70, swatch.teal],
      [-17, 100, swatch.blue],
      [17, 82, swatch.purple],
      [50, 62, swatch.pink],
    ] as const;
    for (const [x, len, c] of tubes) {
      g.moveTo(x, top + 8)
        .lineTo(x, top + 34)
        .stroke({ width: 3, color: wood.line });
      g.roundRect(x - 9, top + 34, 18, len, 6)
        .fill(c.fill)
        .stroke({ width: 3, color: c.line });
    }
  }
}
