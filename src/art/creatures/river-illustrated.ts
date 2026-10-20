import { Container, Mesh, PlaneGeometry } from 'pixi.js';
import { type Point, bend, IllustratedCreature, inside, reach, smooth, type ArtSet } from './illustrated';
import type { WearTable } from './wearables';

/**
 * The long river creature as a prepared illustration (RW02b step 2): the R03 set on one deformable
 * mesh. Facing right, feet on (0, 0) like `River`. The head, chest and paws stay pinned; a slow wave
 * runs down its back from the neck to the hips and the flat tail swishes about its root. Touch: it
 * rears up about its hips to look, then settles, as the Graphics river does.
 *
 * The head turns (the RW02b step 2 follow-up): the body mesh shows R24's `river-nohead` plate, and a
 * second mesh over it shows the expression's head box. That layer bends about the throat by a weight
 * that is 0 along the box's left and bottom edges (the cut, where the plate and the expressions
 * agree) and 1 over the head (rising slowly behind the ear, so the back of the neck never pulls off the plate's), so the cut never opens while the head looks about and tilts up on a
 * touch, and the plate's neck cap stays under the head. Items pinned in the box ride the head.
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
  /**
   * The head layer's box: the cut runs down its left edge (across the back behind the ear) and
   * along its bottom (across the throat). The plate's neck cap lies inside it.
   */
  head: { x: 452, y: 0, w: 297, h: 156 },
  /** The throat, on the cut, which the head turns about. */
  nape: { x: 560, y: 156 },
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

/** RW06 prep: where the nine generated wearables sit, in sprite pixels (`wearables.ts`). Judged in the preview at rest and through a touch. */
export const RIVER_WEAR: WearTable = {
  crown: { fits: [{ at: { x: 592, y: 2 }, width: 65 }] },
  scarf: { fits: [{ at: { x: 535, y: 128 }, width: 85 }] },
  sunhat: { fits: [{ at: { x: 595, y: 0 }, width: 110 }] },
  sunglasses: { fits: [{ at: { x: 632, y: 52 }, width: 95 }], note: 'the far lens sits on the brow above the hidden eye' },
  raincoat: { misfit: 'the coat is drawn upright from the front, and its body runs level from the neck to the tail, so it hangs off the back like a flag', redraw: true },
  umbrella: { misfit: 'it walks on all four paws, so none is free to hold a handle' },
  beanie: { fits: [{ at: { x: 600, y: 30 }, width: 85 }] },
  boots: {
    fits: [
      { at: { x: 215, y: 300 }, width: 50, behind: true },
      { at: { x: 330, y: 300 }, width: 50 },
      { at: { x: 555, y: 305 }, width: 50, behind: true },
      { at: { x: 610, y: 300 }, width: 50 },
    ],
  },
  mittens: { misfit: 'its front paws walk; the boots go on them, and mittens would be a second pair of shoes' },
};

const COLS = 40;
const ROWS = 18;

interface W {
  wave: number;
  tail: number;
}

/**
 * How much of the head's turn a point in the head box takes: 0 on the cut (the box's left and
 * bottom edges), 1 over the head from about the ear and the jaw. It rises slowly behind the ear, so the
 * back of the neck folds with the plate's instead of uncovering its outline when the head lifts.
 */
export function headWeight(x: number, y: number) {
  const H = RIVER_ART.head;
  return smooth(H.y + H.h, H.y + H.h - 66, y) * smooth(H.x, H.x + 88, x);
}

/** How far the head turns at a moment, in radians (negative lifts the nose): a slow look about, up on a touch. */
export const headTurn = (t: number, ex: number) => -0.07 * Math.sin(t * 1.3) + 0.03 * Math.sin(t * 0.53 + 1) - 0.1 * ex;

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
  /** The head layer, over the body; it shows the expression while the body shows the plate. */
  readonly head: Mesh<PlaneGeometry>;
  /** The head layer's vertices at rest, in sprite pixels. */
  readonly headRest: Float32Array;
  private readonly hw: number[] = [];
  private readonly hb: W[] = [];

  constructor(textures: ArtSet) {
    super(textures, RIVER_ART, COLS, ROWS);
    const A = RIVER_ART;
    for (let i = 0; i < this.rest.length; i += 2) this.w.push(weights(this.rest[i], this.rest[i + 1]));
    // Without a plate (a test's single texture), the body shows the base under the head.
    this.mesh.texture = textures.nohead ?? textures.base;
    const H = A.head;
    const geometry = new PlaneGeometry({ width: H.w, height: H.h, verticesX: 24, verticesY: 14 });
    const pos = geometry.positions;
    const uvs = geometry.uvs;
    for (let i = 0; i < pos.length; i += 2) {
      pos[i] += H.x;
      pos[i + 1] += H.y;
      uvs[i] = pos[i] / A.width;
      uvs[i + 1] = pos[i + 1] / A.height;
      this.hw.push(headWeight(pos[i], pos[i + 1]));
      this.hb.push(weights(pos[i], pos[i + 1]));
    }
    geometry.getBuffer('aUV').update();
    this.headRest = pos.slice();
    this.head = new Mesh({ geometry, texture: textures.base });
    this.head.position.copyFrom(this.mesh.position);
    this.art.addChild(this.head);
    // It rears about its hips: the craft pivots there.
    const hips = this.px(A.hips);
    this.craft.pivot.set(hips.x, hips.y);
    this.craft.position.set(hips.x, hips.y);
    this.slots.head = { node: this.riding(A.slots.head), width: A.widths.head };
    this.slots.neck = { node: this.riding(A.slots.neck), width: A.widths.neck };
    this.animate();
  }

  /** A slot pinned to the picture, so the crown turns with the head. */
  private riding(p: Point) {
    const c = new Container();
    this.pin(c, p);
    return c;
  }

  override get faceMesh() {
    return this.head;
  }

  protected override carrier(ride: Point) {
    const H = RIVER_ART.head;
    const on = ride.x >= H.x && ride.x <= H.x + H.w && ride.y >= H.y && ride.y <= H.y + H.h;
    return on ? { mesh: this.head, rest: this.headRest } : super.carrier(ride);
  }

  protected override layers() {
    const A = RIVER_ART;
    const turn = headTurn(this.clock, this.stir);
    const pos = this.head.geometry.positions;
    const rest = this.headRest;
    const d = { x: 0, y: 0 };
    for (let i = 0, k = 0; i < pos.length; i += 2, k++) {
      d.x = 0;
      d.y = 0;
      // The body's own motion under the cut (the wave reaches a little way up the back), then the turn.
      this.move(this.hb[k], rest[i], rest[i + 1], d);
      if (this.hw[k] > 0) bend(A.nape, rest[i], rest[i + 1], turn, this.hw[k], d);
      pos[i] = rest[i] + d.x;
      pos[i + 1] = rest[i + 1] + d.y;
    }
    this.head.geometry.getBuffer('aPosition').update();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    const geometry = this.head.geometry;
    super.destroy(options);
    geometry.destroy();
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
    this.move(this.w[k], x, y, out);
  }

  private move({ wave, tail }: W, x: number, y: number, out: Point) {
    const A = RIVER_ART;
    const t = this.clock;
    const ex = this.stir;
    // A travelling wave down the back, quicker and taller when touched.
    if (wave > 0) out.y += wave * (8 + 8 * ex) * Math.sin(t * 2.4 - (x - A.wave.root.x) * 0.012);
    // The tail swishes about its root, with a lag toward the tip so it bends.
    if (tail > 0) bend(A.tail.root, x, y, 0.15 * Math.sin(t * 1.9 - 0.8 * tail) + ex * 0.25 * Math.sin(this.swish), tail, out);
  }
}
