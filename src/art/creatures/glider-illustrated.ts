import { Assets, Container, Graphics, Mesh, PlaneGeometry, type Texture } from 'pixi.js';
import { Creature, stroke } from './creature';
import gliderUrl from './illustrated/glider.png';

/**
 * RW02b pilot (docs/rework/GENERATED-CREATURE-PILOT.md): the cloud glider as a prepared illustration
 * instead of Graphics shapes. One texture on a deformable mesh: the body and face stay pinned, the
 * great wing bends with a wave that grows toward its tip (so its root never parts from the body),
 * the far fin beats against it and the ribbons ripple. Same species ID, slots, misfit and on-screen
 * size as `Glider`, so the dev preview can show them side by side. RW05 keeps one and deletes the other.
 *
 * Art: `illustrated/glider.png`, cut from the generated concept sheet by
 * `scripts/creature-art/prepare-glider.mjs`; see `illustrated/README.md`.
 */

/** The prepared sprite, in its own pixels. Points were read off the PNG (see the manifest). */
export const GLIDER_ART = {
  width: 458,
  height: 206,
  /** Texture pixels per creature unit is 1 / SCALE: 458 px spans the Graphics glider's ≈380 units. */
  scale: 0.83,
  /** The texture point placed at the creature's (0, 0), the middle of the body. */
  centre: { x: 240, y: 105 },
  /** Where the wing joins the body: displacement is zero here and grows with distance. */
  wingRoot: { x: 350, y: 115 },
  /** Wing tip, for tests and the manifest. */
  wingTip: { x: 105, y: 45 },
  /** The trailing edge runs from the wing tip down to the lower tip; the ribbons are behind it. */
  lowerTip: { x: 230, y: 195 },
  eyes: [
    { x: 404, y: 100, rx: 11, ry: 11 },
    { x: 437, y: 97, rx: 4.5, ry: 8 },
  ],
  /** The crown sits on the head between the ear and the back. */
  head: { x: 410, y: 70 },
} as const;

const COLS = 30;
const ROWS = 14;
const LID = 0xe4cbe4;
const LASH = 0x2a1a2e;

let loaded: Texture | null = null;

/** Loads the glider's texture once. The dev preview awaits this before building the scene. */
export async function loadGliderArt(): Promise<Texture> {
  if (!loaded) {
    loaded = await Assets.load<Texture>(gliderUrl);
    // Collection cards draw it at about a quarter size; mipmaps keep the outline from breaking up.
    loaded.source.autoGenerateMipmaps = true;
    loaded.source.updateMipmaps();
  }
  return loaded;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** How strongly each region of the picture moves, from its rest position in texture pixels. */
export function weights(x: number, y: number) {
  const A = GLIDER_ART;
  // Which side of the trailing edge (wing tip → lower tip): positive is the wing, negative the ribbons.
  const edge = x - A.wingTip.x - (y - A.wingTip.y) * ((A.lowerTip.x - A.wingTip.x) / (A.lowerTip.y - A.wingTip.y));
  // The ribbons hang below the wing tip (y ≳ 80), so the tip itself always moves with the wing.
  const ribbon = smooth(0, -30, edge) * clamp01((250 - x) / 40) * smooth(55, 80, y);
  // How far along the root → tip line a point lies: 0 at the root (and anything forward of it, like
  // the head), 1 at the tip. Nothing near the root moves; the tip moves fully.
  const lx = A.wingTip.x - A.wingRoot.x;
  const ly = A.wingTip.y - A.wingRoot.y;
  const reach = ((x - A.wingRoot.x) * lx + (y - A.wingRoot.y) * ly) / (lx * lx + ly * ly);
  const wing = (1 - ribbon) * smooth(0.22, 1, reach);
  // The far fin pokes up above the wing's leading edge, between x ≈ 250 and 380.
  const fin = smooth(80, 30, y) * smooth(240, 290, x) * smooth(400, 360, x);
  return { wing: wing * (1 - fin), fin, ribbon, ribbonReach: clamp01((250 - x) / 230) };
}

export class IllustratedGlider extends Creature {
  readonly species = 'glider' as const;
  readonly touch = { x: 10, y: -10, r: 140 };
  protected readonly reactionLength = 1.2;

  readonly mesh: Mesh<PlaneGeometry>;
  private readonly craft = new Container();
  /** Vertex positions at rest, in texture pixels. */
  readonly rest: Float32Array;
  private readonly w: { wing: number; fin: number; ribbon: number; ribbonReach: number }[] = [];
  private readonly lids: Graphics[] = [];

  constructor(texture: Texture) {
    super();
    const A = GLIDER_ART;
    this.misfit.scarf = 'no neck: the head runs straight into the wing, so a band would hide the face or the wing root';

    const geometry = new PlaneGeometry({ width: A.width, height: A.height, verticesX: COLS, verticesY: ROWS });
    this.mesh = new Mesh({ geometry, texture });
    this.rest = geometry.positions.slice();
    for (let i = 0; i < this.rest.length; i += 2) this.w.push(weights(this.rest[i], this.rest[i + 1]));
    this.mesh.position.set(-A.centre.x, -A.centre.y);

    // Painted eyes cannot close, so a lid of wing colour with a lash line covers each for a blink.
    // `Creature` squashes the containers in `eyes`; these stand in for them and show only mid-blink.
    const face = new Container();
    face.position.set(-A.centre.x, -A.centre.y);
    for (const e of A.eyes) {
      const c = new Container();
      c.position.set(e.x, e.y);
      const lid = new Graphics();
      lid.ellipse(0, 0, e.rx + 1, e.ry + 1).fill(LID);
      lid.moveTo(-e.rx, 1).quadraticCurveTo(0, e.ry * 0.7, e.rx, 1).stroke(stroke(LASH, 2.2));
      lid.visible = false;
      c.addChild(lid);
      this.lids.push(lid);
      this.eyes.push(c);
      face.addChild(c);
    }

    const head = new Container();
    head.position.set(A.head.x - A.centre.x, A.head.y - A.centre.y);
    this.slots.head = { node: head, width: 36 / A.scale };

    const art = new Container();
    art.scale.set(A.scale);
    art.addChild(this.mesh, face, head);
    this.craft.addChild(art);
    this.addChild(this.craft);
    this.animate();
  }

  protected animate() {
    const t = this.clock;
    const p = this.sincePoke;
    const looping = p < this.reactionLength;
    const u = looping ? p / this.reactionLength : 1;
    // The same loop-the-loop as the Graphics glider, so the two compare fairly.
    const turn = looping ? (1 - Math.cos(u * Math.PI)) / 2 : 0;
    const a = turn * Math.PI * 2;
    this.craft.position.set(70 * Math.sin(a), -70 * (1 - Math.cos(a)) + 8 * Math.sin(t * 1.3));
    this.craft.rotation = -a + 0.05 * Math.sin(t * 1.1);

    // A wingbeat is a wave from root to tip: the tip lags, so the wing bends rather than hinges.
    const ex = this.excite(this.reactionLength);
    const beat = looping ? 9 : 2.2;
    const lift = 16 + 22 * ex;
    const pos = this.mesh.geometry.positions;
    for (let i = 0, k = 0; i < pos.length; i += 2, k++) {
      const { wing, fin, ribbon, ribbonReach } = this.w[k];
      const x = this.rest[i];
      const y = this.rest[i + 1];
      let dx = 0;
      let dy = 0;
      if (wing > 0) {
        dy += lift * wing * Math.sin(t * beat - 1.1 * wing);
        // Drawn in towards the body as it rises, so the membrane keeps its length.
        dx += 0.25 * lift * wing * wing * Math.cos(t * beat - 1.1 * wing);
      }
      if (fin > 0) dy -= 9 * (1 + ex) * fin * Math.sin(t * beat - 0.4);
      if (ribbon > 0) {
        const r = ribbonReach;
        dy += ribbon * r * ((7 + 10 * ex) * Math.sin(t * 2.6 - 7 * r) + (looping ? 18 * Math.sin(u * Math.PI) : 0));
        dx += ribbon * r * 4 * Math.cos(t * 2.6 - 7 * r);
      }
      pos[i] = x + dx;
      pos[i + 1] = y + dy;
    }
    this.mesh.geometry.getBuffer('aPosition').update();

    // `Creature.update` squashes each eye container for a blink; show the lid while it is squashed.
    for (const [i, lid] of this.lids.entries()) {
      const shut = this.eyes[i].scale.y < 0.6;
      lid.visible = shut;
      this.eyes[i].scale.y = 1;
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    // The texture is shared and cached by Assets; only the geometry belongs to this creature.
    const geometry = this.mesh.geometry;
    super.destroy(options);
    geometry.destroy();
  }
}
