import { type Point, bend, clamp01, IllustratedCreature, inside, reach, smooth, type ArtSet } from './illustrated';
import type { WearTable } from './wearables';

/**
 * The cloud glider as a prepared illustration (RW02b step 2; docs/rework/GENERATED-CREATURE-PILOT.md):
 * the R01 set on one deformable mesh. The body and face stay pinned, the great wing bends with a
 * wave that grows toward its tip, the dorsal and ventral fins beat against it and the two ribbons
 * ripple behind the trailing edge. Same species ID, slots, misfit and on-screen size as `Glider`,
 * so the dev preview shows them side by side. RW05 keeps one and deletes the other.
 *
 * Art: `illustrated/glider-*.png`, cut by `scripts/creature-art/prepare-sprite.mjs --set glider
 * --shrink 2`; see `illustrated/README.md`.
 */

/** The prepared sprite, in its own pixels (half the generated size). Points were read off the PNG on a grid. */
export const GLIDER_ART = {
  width: 761,
  height: 338,
  /** Creature units per sprite pixel: 761 px spans the Graphics glider's ≈380 units. */
  scale: 0.5,
  /** The sprite pixel placed at the creature's (0, 0), the middle of the body. */
  centre: { x: 440, y: 180 },
  eyes: [{ x: 674, y: 164, rx: 17, ry: 17 }],
  nose: { x: 738, y: 152 },
  mouth: { x: 720, y: 180 },
  cheeks: [{ x: 652, y: 192 }],
  ears: [{ x: 685, y: 100 }],
  /** The head and body, pinned: the wing joins along its left side. */
  body: [
    { x: 560, y: 100 }, { x: 640, y: 108 }, { x: 670, y: 88 }, { x: 700, y: 90 }, { x: 705, y: 125 }, { x: 745, y: 140 },
    { x: 752, y: 175 }, { x: 735, y: 200 }, { x: 700, y: 235 }, { x: 640, y: 268 }, { x: 560, y: 270 }, { x: 505, y: 245 },
    { x: 500, y: 170 },
  ],
  /** The wing bends about its root along the root → tip line; `lowerTip` is the other end of the trailing edge. */
  wing: { root: { x: 545, y: 160 }, tip: { x: 140, y: 48 } },
  lowerTip: { x: 368, y: 332 },
  /** The dorsal fin on top and the ventral fin below beat against the wing. */
  fins: [
    { root: { x: 478, y: 60 }, tip: { x: 478, y: 10 } },
    { root: { x: 485, y: 280 }, tip: { x: 485, y: 305 } },
  ],
  /** The two ribbons leave the trailing edge and ripple behind it. */
  ribbons: [
    { root: { x: 365, y: 200 }, tip: { x: 28, y: 165 } },
    { root: { x: 375, y: 240 }, tip: { x: 20, y: 255 } },
  ],
  /** Slots, as sprite points; the crown sits on the head behind the ear, where the pilot found it covered the ear tip. */
  slots: {
    head: { x: 645, y: 112 },
    eyes: { x: 674, y: 164 },
    back: { x: 600, y: 110 },
    tail: { x: 370, y: 220 },
  },
  /** Slot widths, in creature units. */
  widths: { head: 40 },
  /** Parts the species lacks, with the reason (GAME-FIT.md's anchor list). */
  misfits: {
    neck: 'no neck: the head runs straight into the wing, so a band would hide the face or the wing root',
    hands: 'none: a ray with one wing holds nothing',
    feet: 'none: it never stands; its "toes" are the lower ribbon root',
    tummy: 'only the cream underside shows, under the wing',
  },
} as const;

/** RW06 prep: where the nine generated wearables sit, in sprite pixels (`wearables.ts`). Judged in the preview at rest and through a loop. */
export const GLIDER_WEAR: WearTable = {
  crown: { fits: [{ at: { x: 650, y: 112 }, width: 60 }] },
  scarf: { misfit: GLIDER_ART.misfits.neck },
  sunhat: { fits: [{ at: { x: 652, y: 108 }, width: 85 }] },
  sunglasses: { fits: [{ at: { x: 700, y: 160 }, width: 70 }] },
  raincoat: { misfit: 'a coat wants a body and arms; the glider is one wing, which a coat would hide' },
  umbrella: { misfit: GLIDER_ART.misfits.hands },
  beanie: { fits: [{ at: { x: 660, y: 120 }, width: 60 }] },
  boots: { misfit: GLIDER_ART.misfits.feet },
  mittens: { misfit: GLIDER_ART.misfits.hands },
};

const COLS = 40;
const ROWS = 18;

interface W {
  wing: number;
  fin: number[];
  ribbon: number[];
  ribbonReach: number;
}

/** How strongly each region of the picture moves, from its rest position in sprite pixels. */
export function weights(x: number, y: number): W {
  const A = GLIDER_ART;
  if (inside(A.body, x, y)) return { wing: 0, fin: [0, 0], ribbon: [0, 0], ribbonReach: 0 };
  // Which side of the trailing edge (wing tip → lower tip): positive is the wing, negative the ribbons.
  const t = A.wing.tip;
  const edge = x - t.x - (y - t.y) * ((A.lowerTip.x - t.x) / (A.lowerTip.y - t.y));
  const behind = smooth(0, -50, edge) * clamp01((400 - x) / 40) * smooth(100, 125, y);
  // The upper ribbon lies above the lower one; the gap between them runs from y ≈ 180 at the tips to ≈ 215 at the roots.
  const gap = 170 + x * 0.13;
  const upper = behind * smooth(gap + 12, gap - 12, y);
  const lower = behind - upper;
  const wing = (1 - behind) * smooth(0.2, 1, reach(A.wing, x, y));
  const fin = [
    smooth(440, 470, x) * smooth(520, 495, x) * smooth(80, 50, y) * smooth(0.1, 0.8, reach(A.fins[0], x, y)),
    smooth(455, 480, x) * smooth(525, 500, x) * smooth(278, 292, y) * smooth(0.1, 0.8, reach(A.fins[1], x, y)),
  ];
  return { wing: wing * (1 - fin[0] - fin[1]), fin, ribbon: [upper, lower], ribbonReach: clamp01((370 - x) / 340) };
}

export class IllustratedGlider extends IllustratedCreature {
  readonly species = 'glider' as const;
  readonly touch = { x: 20, y: 0, r: 150 };
  protected readonly reactionLength = 1.2;
  private readonly w: W[] = [];
  /** Wingbeat phase, accumulated so a change of beat rate never jumps the wing. */
  private phase = 0;

  constructor(textures: ArtSet) {
    super(textures, GLIDER_ART, COLS, ROWS);
    const A = GLIDER_ART;
    this.misfit.scarf = A.misfits.neck;
    for (let i = 0; i < this.rest.length; i += 2) this.w.push(weights(this.rest[i], this.rest[i + 1]));
    this.slots.head = { node: this.slot(A.slots.head), width: A.widths.head };
    this.animate();
  }

  protected pose(dt: number) {
    const t = this.clock;
    const p = this.sincePoke;
    const looping = p < this.reactionLength;
    const u = looping ? p / this.reactionLength : 1;
    // Ease the loop-the-loop out and back, as the Graphics glider does.
    const turn = looping ? (1 - Math.cos(u * Math.PI)) / 2 : 0;
    const a = turn * Math.PI * 2;
    // Keep the horizontal loop inside a sparse land’s leftmost host spot at every idle phase.
    this.craft.position.set(60 * Math.sin(a), -70 * (1 - Math.cos(a)) + 8 * Math.sin(t * 1.3));
    this.craft.rotation = -a + 0.05 * Math.sin(t * 1.1);
    // The beat quickens and slows with the reaction; its phase accumulates, so nothing snaps.
    this.phase += dt * (2.2 + 6.8 * this.stir);
  }

  protected displace(k: number, x: number, y: number, _dt: number, out: Point) {
    const A = GLIDER_ART;
    const { wing, fin, ribbon, ribbonReach } = this.w[k];
    const ex = this.stir;
    const beat = this.phase;
    const t = this.clock;
    // A wingbeat is a wave from root to tip: the tip lags, so the wing bends rather than hinges.
    const lift = 26 + 34 * ex;
    if (wing > 0) {
      out.y += lift * wing * Math.sin(beat - 1.1 * wing);
      // Drawn in towards the body as it rises, so the membrane keeps its length.
      out.x += 0.25 * lift * wing * wing * Math.cos(beat - 1.1 * wing);
    }
    if (fin[0] > 0) out.y -= 8 * (1 + ex) * fin[0] * Math.sin(beat - 0.4);
    if (fin[1] > 0) out.y += 6 * (1 + ex) * fin[1] * Math.sin(beat - 0.4);
    for (let i = 0; i < 2; i++) {
      const r = ribbon[i];
      if (r <= 0) continue;
      const reachR = ribbonReach;
      const ph = t * 2.6 - 7 * reachR + i * 1.1;
      out.y += r * reachR * ((11 + 16 * ex) * Math.sin(ph) + 28 * ex);
      out.x += r * reachR * 6 * Math.cos(ph);
      // And a gentle sway of the whole ribbon about its root when touched.
      bend(A.ribbons[i].root, x, y, ex * 0.12 * Math.sin(t * 3 + i), r * reachR, out);
    }
  }
}
