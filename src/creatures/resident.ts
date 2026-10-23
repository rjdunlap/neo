import { Circle, Container } from 'pixi.js';
import { CAST_ART, castArt, type CastId, IllustratedCast } from '../art/creatures/cast';
import type { ArtSet } from '../art/creatures/illustrated';
import type { LandId } from '../content/lands';
import type { LineId } from '../content/voice-script';

/**
 * RW14 slice 2 (docs/rework/POLISH.md#slice-2-residents-in-six-locations-and-her-own-friend-at-home): a location's
 * resident from the second wave, standing where the land's host stands. Like a `Companion` it has its feet on (0, 0)
 * and takes about the room a 250-unit host does (`FIT`), so `LandScene` places, scales and hit-tests it the same way;
 * it is content, never saved, never collected by being seen, and never her companion.
 */

export interface ResidentSpec {
  /** Its home, where it stands. */
  land: LandId;
  /** The hello it says when poked, before the host's suggestion. */
  line: LineId;
  /** Its rig at this scale takes about a host's room; `lift` raises a species whose (0, 0) is not its feet (Lumen floats). */
  fit: { scale: number; lift: number };
}

export const RESIDENTS: Record<CastId, ResidentSpec> = {
  tote: { land: 'bubble-beach', line: 'resident.tote', fit: { scale: 0.95, lift: 0 } },
  trill: { land: 'music-mountain', line: 'resident.trill', fit: { scale: 0.9, lift: 0 } },
  dapple: { land: 'treehouse', line: 'resident.dapple', fit: { scale: 0.9, lift: 0 } },
  bramble: { land: 'cozy-village', line: 'resident.bramble', fit: { scale: 1.2, lift: 0 } },
  mossback: { land: 'tinker-lab', line: 'resident.mossback', fit: { scale: 0.88, lift: 0 } },
  lumen: { land: 'story-grove', line: 'resident.lumen', fit: { scale: 0.85, lift: 60 } },
};

/** The touch circle's largest radius in host units: at least 100 across at the smallest layout (`hostScale` ≈ 0.49), and inside the spot at the largest. */
export const TOUCH_RADIUS = 110;
/** How far below the feet the grown touch circle (`touchArea(10)`) may reach, in host units: inside the spot's 25 units at the largest layout. */
export const TOUCH_BELOW = 35;
/** How far to either side of the feet it may reach, in host units: inside the spot's half-width at the largest layout (Trill's body sits right of its picture's middle). */
export const TOUCH_SIDE = 150;

export class Resident extends Container {
  readonly rig: IllustratedCast;
  /** Body-centred, in this container's units, for a hit area. */
  readonly touch: { x: number; y: number; r: number };

  /** Without `art` (a unit test), the species' art from boot; a caller checks `castArt()` first and keeps the land's host without it. */
  constructor(
    readonly species: CastId,
    art: ArtSet | undefined = castArt(species),
  ) {
    super();
    if (!art) throw new Error(`the ${species} art is not loaded`);
    const fit = RESIDENTS[species].fit;
    const A = CAST_ART[species];
    this.rig = new IllustratedCast(species, art);
    this.rig.scale.set(fit.scale);
    // The picture's middle over the feet, whatever point the species is placed by (Trill's tail streams far to its left).
    const dx = (A.centre.x - A.width / 2) * A.scale * fit.scale;
    this.rig.position.set(dx, -fit.lift);
    const t = this.rig.touch;
    // The rigs' touch circles were sized for the preview's open stage; here the circle stays about the body and inside
    // the host's spot: capped at `TOUCH_RADIUS`, reaching at most `TOUCH_BELOW` units below the feet and `TOUCH_SIDE` to a side.
    const r = Math.min(t.r * fit.scale, TOUCH_RADIUS);
    const side = TOUCH_SIDE - r - 10;
    this.touch = { x: Math.max(-side, Math.min(side, t.x * fit.scale + dx)), y: Math.min(t.y * fit.scale - fit.lift, TOUCH_BELOW - r - 10), r };
    this.addChild(this.rig);
  }

  /** A body-centred hit circle, `grow` units larger than the body. */
  touchArea(grow = 0): Circle {
    return new Circle(this.touch.x, this.touch.y, this.touch.r + grow);
  }

  /** The species' whole-craft reaction (`CAST_ART[species].reaction`). */
  poke() {
    this.rig.poke();
  }

  update(dt: number) {
    this.rig.update(dt);
  }

  /** The art's size in this container's units, for a layout check. */
  static size(species: CastId): { w: number; h: number } {
    const A = CAST_ART[species];
    const s = A.scale * RESIDENTS[species].fit.scale;
    return { w: A.width * s, h: A.height * s };
  }
}
