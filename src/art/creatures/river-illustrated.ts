import { type Point, bend, IllustratedCreature, inside, reach, smooth, type ArtSet } from './illustrated';

/**
 * The long river creature as a prepared illustration (RW02b step 2): the R03 set on one deformable
 * mesh. Facing right, feet on (0, 0) like `River`. The head, chest and paws stay pinned; a slow wave
 * runs down its back from the neck to the hips and the flat tail swishes about its root. Touch: it
 * rears up about its hips to look, then settles, as the Graphics river does.
 *
 * Art: `illustrated/river-*.png`, cut by `scripts/creature-art/prepare-sprite.mjs --set river
 * --shrink 2`; see `illustrated/README.md`.
 */

/** The prepared sprite, in its own pixels (half the generated size). Points were read off the PNG on a grid. */
export const RIVER_ART = {
  width: 749,
  height: 324,
  /** Creature units per sprite pixel: 749 px is ≈335 units long, like the Graphics river. */
  scale: 0.45,
  /** The sprite pixel placed at the creature's (0, 0): the ground under the middle of the body. */
  centre: { x: 400, y: 316 },
  eyes: [{ x: 597, y: 59, rx: 21, ry: 15 }],
  nose: { x: 682, y: 46 },
  mouth: { x: 661, y: 83 },
  cheeks: [{ x: 586, y: 85 }],
  ears: [
    { x: 575, y: 22 },
    { x: 605, y: 10 },
  ],
  /** The head, chest and front paws, pinned; the wave starts behind the neck. */
  body: [
    { x: 500, y: 100 }, { x: 515, y: 60 }, { x: 560, y: 15 }, { x: 610, y: 8 }, { x: 690, y: 30 }, { x: 725, y: 60 },
    { x: 700, y: 100 }, { x: 690, y: 150 }, { x: 660, y: 250 }, { x: 650, y: 300 }, { x: 600, y: 320 }, { x: 500, y: 320 },
    { x: 480, y: 250 }, { x: 485, y: 150 },
  ],
  /** The wave runs from the neck (0) to the hips (1) along the back. */
  wave: { root: { x: 500, y: 110 }, tip: { x: 250, y: 160 } },
  /** The hips, which the craft rears about. */
  hips: { x: 235, y: 255 },
  /** The flat tail bends about its root, the narrow place behind the hips. */
  tail: { root: { x: 178, y: 166 }, tip: { x: 12, y: 185 } },
  slots: {
    head: { x: 595, y: 14 },
    eyes: { x: 597, y: 59 },
    neck: { x: 520, y: 140 },
    hands: [{ x: 555, y: 300 }, { x: 610, y: 292 }],
    feet: [{ x: 215, y: 288 }, { x: 330, y: 290 }],
    back: { x: 360, y: 105 },
    tummy: { x: 420, y: 230 },
    tail: { x: 178, y: 166 },
    ears: [{ x: 575, y: 22 }, { x: 605, y: 10 }],
  },
  /** Slot widths, in creature units. */
  widths: { head: 80, neck: 80 },
  misfits: {},
} as const;

const COLS = 40;
const ROWS = 18;

interface W {
  wave: number;
  tail: number;
}

/** How strongly each region of the picture moves, from its rest position in sprite pixels. */
export function weights(x: number, y: number): W {
  const A = RIVER_ART;
  if (inside(A.body, x, y)) return { wave: 0, tail: 0 };
  // The tail: left of the hips and above the hind leg, growing from its root toward the tip.
  const tail = smooth(195, 175, x) * smooth(0, 0.25, reach(A.tail, x, y));
  // The back wave: nothing at the neck, full from the hips back; the belly follows less and the paws not at all.
  const wave = (1 - tail) * smooth(0, 0.8, reach(A.wave, x, y)) * smooth(275, 200, y);
  return { wave, tail };
}

export class IllustratedRiver extends IllustratedCreature {
  readonly species = 'river' as const;
  readonly touch = { x: 0, y: -55, r: 150 };
  protected readonly reactionLength = 1.3;
  private readonly w: W[] = [];
  /** The touch's swish, accumulated only while excited, so a re-tap never snaps the tail. */
  private swish = 0;

  constructor(textures: ArtSet) {
    super(textures, RIVER_ART, COLS, ROWS);
    const A = RIVER_ART;
    for (let i = 0; i < this.rest.length; i += 2) this.w.push(weights(this.rest[i], this.rest[i + 1]));
    // It rears about its hips: the craft pivots there.
    const hips = this.px(A.hips);
    this.craft.pivot.set(hips.x, hips.y);
    this.craft.position.set(hips.x, hips.y);
    this.slots.head = { node: this.slot(A.slots.head), width: A.widths.head };
    this.slots.neck = { node: this.slot(A.slots.neck), width: A.widths.neck };
    this.animate();
  }

  protected pose(dt: number) {
    const t = this.clock;
    const ex = this.stir;
    this.swish += dt * 10 * ex;
    const hips = this.px(RIVER_ART.hips);
    // Rears up to look, then settles; a slight idle bob.
    this.craft.rotation = -0.3 * ex;
    this.craft.position.set(hips.x, hips.y - 2 * ex + 1.5 * Math.sin(t * 2.4));
  }

  protected displace(k: number, x: number, y: number, _dt: number, out: Point) {
    const A = RIVER_ART;
    const { wave, tail } = this.w[k];
    const t = this.clock;
    const ex = this.stir;
    // A travelling wave down the back, quicker and taller when touched.
    if (wave > 0) out.y += wave * (8 + 8 * ex) * Math.sin(t * 2.4 - (x - A.wave.root.x) * 0.012);
    // The tail swishes about its root, with a lag toward the tip so it bends.
    if (tail > 0) bend(A.tail.root, x, y, 0.15 * Math.sin(t * 1.9 - 0.8 * tail) + ex * 0.25 * Math.sin(this.swish), tail, out);
  }
}
