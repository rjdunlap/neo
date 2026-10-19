import { type Point, bend, IllustratedCreature, inside, smooth, type ArtSet } from './illustrated';

/**
 * The squat sprout as a prepared illustration (RW02b step 2): the R02 set on one deformable mesh.
 * Feet on (0, 0) like `Sprout`. The head, body and feet stay pinned; the two-leaf sprout sways
 * about its stem and spins when touched; the little arms wag. Touch: crouch, a hop and a landing
 * squash of the whole craft, the same reaction as the Graphics sprout.
 *
 * Art: `illustrated/sprout-*.png`, cut by `scripts/creature-art/prepare-sprite.mjs --set sprout
 * --shrink 2`; see `illustrated/README.md`.
 */

/** The prepared sprite, in its own pixels (half the generated size). Points were read off the PNG on a grid. */
export const SPROUT_ART = {
  width: 478,
  height: 465,
  /** Creature units per sprite pixel: 465 px is ≈230 units tall to the leaf tips, like the Graphics sprout. */
  scale: 0.5,
  /** The sprite pixel placed at the creature's (0, 0): the ground under the middle of the body. */
  centre: { x: 250, y: 458 },
  eyes: [
    { x: 240, y: 222, rx: 23, ry: 24 },
    { x: 360, y: 209, rx: 15, ry: 21 },
  ],
  nose: { x: 320, y: 229 },
  mouth: { x: 314, y: 251 },
  cheeks: [
    { x: 210, y: 252 },
    { x: 378, y: 240 },
  ],
  ears: [
    { x: 105, y: 185 },
    { x: 370, y: 160 },
  ],
  /** The head, torso and feet, pinned; the arms lie outside it on either side. */
  body: [
    { x: 95, y: 165 }, { x: 170, y: 140 }, { x: 240, y: 136 }, { x: 320, y: 140 }, { x: 385, y: 152 }, { x: 405, y: 215 },
    { x: 400, y: 282 }, { x: 410, y: 350 }, { x: 445, y: 375 }, { x: 455, y: 420 }, { x: 430, y: 450 }, { x: 150, y: 460 },
    { x: 70, y: 430 }, { x: 35, y: 395 }, { x: 60, y: 360 }, { x: 130, y: 345 }, { x: 130, y: 280 }, { x: 85, y: 250 },
  ],
  /** The sprout: both leaves bend about the stem's root on the head; the fork is where the stem splits. */
  leaves: { root: { x: 245, y: 140 }, fork: { x: 242, y: 100 }, tips: [{ x: 113, y: 22 }, { x: 394, y: 105 }] },
  /** The arms, each an ellipse (centre and radii) that wags about its root at the shoulder. */
  arms: [
    { root: { x: 120, y: 285 }, tip: { x: 90, y: 335 }, centre: { x: 85, y: 312 }, rx: 50, ry: 38 },
    { root: { x: 420, y: 290 }, tip: { x: 448, y: 338 }, centre: { x: 445, y: 318 }, rx: 30, ry: 35 },
  ],
  slots: {
    head: { x: 245, y: 142 },
    eyes: { x: 300, y: 216 },
    neck: { x: 262, y: 286 },
    hands: [{ x: 95, y: 320 }, { x: 445, y: 320 }],
    feet: [{ x: 165, y: 420 }, { x: 435, y: 405 }],
    back: { x: 70, y: 240 },
    tummy: { x: 262, y: 360 },
    ears: [{ x: 105, y: 185 }, { x: 370, y: 160 }],
  },
  /** Slot widths, in creature units. */
  widths: { head: 120, neck: 180 },
  misfits: {
    tail: 'none shows: it sits on it',
  },
} as const;

const COLS = 24;
const ROWS = 24;

interface W {
  leaf: number;
  arm: number[];
}

/** How strongly each region of the picture moves, from its rest position in sprite pixels. */
export function weights(x: number, y: number): W {
  const A = SPROUT_ART;
  if (inside(A.body, x, y)) return { leaf: 0, arm: [0, 0] };
  const r = A.leaves.root;
  // Everything above the head is sprout; the stem's base (a band round the root) is pinned.
  const above = Math.max(smooth(150, 135, y), Math.abs(x - r.x) < 35 ? smooth(152, 138, y) : 0);
  const leaf = above * smooth(0, 40, Math.hypot(x - r.x, y - r.y));
  const arm = A.arms.map((a) => smooth(1, 0.35, ((x - a.centre.x) / a.rx) ** 2 + ((y - a.centre.y) / a.ry) ** 2));
  return { leaf, arm };
}

export class IllustratedSprout extends IllustratedCreature {
  readonly species = 'sprout' as const;
  readonly touch = { x: 0, y: -78, r: 115 };
  protected readonly reactionLength = 0.9;
  private readonly w: W[] = [];
  /** The touch's spin, accumulated only while excited, so a re-tap never snaps the leaves. */
  private flap = 0;

  constructor(textures: ArtSet) {
    super(textures, SPROUT_ART, COLS, ROWS);
    const A = SPROUT_ART;
    for (let i = 0; i < this.rest.length; i += 2) this.w.push(weights(this.rest[i], this.rest[i + 1]));
    // The scarf under the chin draws over the body; the crown on the head rests around the stem.
    this.slots.neck = { node: this.slot(A.slots.neck), width: A.widths.neck };
    this.slots.head = { node: this.slot(A.slots.head), width: A.widths.head };
    this.animate();
  }

  protected pose(dt: number) {
    const t = this.clock;
    this.flap += dt * 11 * this.stir;
    const breathe = 0.025 * Math.sin(t * 2.2);
    // The touch, as a function of time since it: crouch, a 70-unit hop, a landing squash.
    const p = this.sincePoke;
    let squash = 0;
    let lift = 0;
    if (p < 0.15) squash = 0.12 * (p / 0.15);
    else if (p < 0.55) {
      const u = (p - 0.15) / 0.4;
      lift = 70 * 4 * u * (1 - u);
      squash = -0.08 * Math.sin(u * Math.PI);
    } else if (p < 0.8) squash = 0.1 * Math.sin(((p - 0.55) / 0.25) * Math.PI);
    this.craft.y = -lift;
    this.craft.scale.set(1 + squash - breathe * 0.5, 1 - squash + breathe);
  }

  protected displace(k: number, x: number, y: number, _dt: number, out: Point) {
    const A = SPROUT_ART;
    const { leaf, arm } = this.w[k];
    const t = this.clock;
    const ex = this.stir;
    // The leaves sway slowly and spin when touched, bending about the stem's root.
    if (leaf > 0) bend(A.leaves.root, x, y, 0.1 * Math.sin(t * 1.6) + ex * 0.25 * Math.sin(this.flap), leaf, out);
    for (let i = 0; i < 2; i++) {
      if (arm[i] <= 0) continue;
      const side = i ? -1 : 1;
      bend(A.arms[i].root, x, y, side * (0.06 * Math.sin(t * 2.2 + i) + ex * 0.15 * Math.sin(this.flap * 1.2)), arm[i], out);
    }
  }
}
