import { Assets, Container, Mesh, PlaneGeometry, type Texture } from 'pixi.js';
import { Creature, type SpeciesId } from './creature';

/**
 * RW02b step 2 (docs/rework/GENERATED-CREATURE-PILOT.md): what the three illustrated rigs share.
 * A species is one prepared sprite set (`illustrated/<species>-<expression>.png`, all six the same
 * size, cut with one box by `scripts/creature-art/prepare-sprite.mjs --set`) on one deformable
 * mesh. The body and face stay pinned; the species' moving parts (leaves and arms, the back wave
 * and tail, the wing and ribbons) bend by per-vertex weights that grow from each part's root to
 * its tip, so a root never parts from the body. Expressions are whole textures swapped under the
 * mesh: a blink, a touch (surprised, then happy) and a set mood. The species class moves the
 * `craft` as a whole (a hop, a rear, a loop) and writes each vertex's offset in `displace()`.
 *
 * Not a universal rig framework: three species share a texture swap, a vertex loop and a loader.
 * RW05 takes these as the species' renderers: `src/creatures/companion.ts` loads every set at boot
 * and draws the companion with them, in the island and in the root's preview alike.
 */

export const EXPRESSIONS = ['base', 'blink', 'happy', 'surprised', 'sleepy', 'sad'] as const;
export type Expression = (typeof EXPRESSIONS)[number];
/** A mood a game or scene sets; a touch and a blink show over it. */
export type Mood = 'calm' | 'happy' | 'surprised' | 'sleepy' | 'sad';
export type ArtSet = Readonly<Record<Expression, Texture>>;

export interface Point {
  x: number;
  y: number;
}
export interface Eye extends Point {
  rx: number;
  ry: number;
}
/** A part that bends: displacement is zero at the root and grows toward the tip. */
export interface Part {
  root: Point;
  tip: Point;
}

/** What every `*_ART` table records, in sprite pixels; a species adds its own parts. */
export interface ArtBase {
  width: number;
  height: number;
  /** Creature units per sprite pixel (about 0.5: the sets were prepared at half size, 2 px a unit). */
  scale: number;
  /** The sprite pixel placed at the creature's (0, 0). */
  centre: Point;
  eyes: readonly Eye[];
  /** The pinned body, as a polygon the tests sample inside; everything in it stays put. */
  body: readonly Point[];
}

/** The sprite files, by species and expression, loaded once per species (at boot, by `loadCollectionArt()`). */
const files = import.meta.glob<string>('./illustrated/*-*.png', { query: '?url', import: 'default' });

const sets = new Map<SpeciesId, Promise<ArtSet>>();

/** Loads a species' six expression textures once, mipmapped for the collection card. */
export function loadArt(species: SpeciesId): Promise<ArtSet> {
  let p = sets.get(species);
  if (!p) {
    p = (async () => {
      const entries = await Promise.all(
        EXPRESSIONS.map(async (e) => {
          const load = files[`./illustrated/${species}-${e}.png`];
          if (!load) throw new Error(`no prepared sprite for ${species} ${e}`);
          const t = await Assets.load<Texture>(await load());
          t.source.autoGenerateMipmaps = true;
          t.source.updateMipmaps();
          return [e, t] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<Expression, Texture>;
    })();
    sets.set(species, p);
  }
  return p;
}

/** One texture for every expression (tests, and a still). */
export const sameArt = (t: Texture): ArtSet => Object.fromEntries(EXPRESSIONS.map((e) => [e, t])) as Record<Expression, Texture>;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** 0 at `a`, 1 at `b`, eased between; `a` may be the larger. */
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** How far along root → tip a point lies: 0 at the root (and anything behind it), 1 at the tip. */
export function reach(p: Part, x: number, y: number) {
  const lx = p.tip.x - p.root.x;
  const ly = p.tip.y - p.root.y;
  return clamp01(((x - p.root.x) * lx + (y - p.root.y) * ly) / (lx * lx + ly * ly));
}
/** Whether (x, y) is inside a polygon. */
export function inside(poly: readonly Point[], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}
/**
 * The offset of (x, y) after bending about `root` by `angle`, scaled by `w` (0 at the root, 1 at
 * the tip): a leaf, tail or ribbon sways as a whole without its root moving.
 */
export function bend(root: Point, x: number, y: number, angle: number, w: number, out: Point) {
  const ox = x - root.x;
  const oy = y - root.y;
  const a = angle * w;
  const c = Math.cos(a) - 1;
  const s = Math.sin(a);
  out.x += ox * c - oy * s;
  out.y += ox * s + oy * c;
}

/** How long a touch shows the surprised face before the happy one, in seconds. */
export const SURPRISE = 0.22;

export abstract class IllustratedCreature extends Creature {
  readonly mesh: Mesh<PlaneGeometry>;
  /** Vertex positions at rest, in sprite pixels. */
  readonly rest: Float32Array;
  /** Moved as a whole by the species' reaction; holds the scaled art and the slots. */
  protected readonly craft = new Container();
  /** The mesh at `scale`, so slots and the touch circle are in creature units. */
  protected readonly art = new Container();
  /** The mood a scene sets. A touch and a blink show over it. */
  mood: Mood = 'calm';
  /** The reaction's excitement, eased, so a re-tap mid-reaction cannot snap a part's size. */
  protected stir = 0;
  private shown: Expression = 'base';
  private readonly d: Point = { x: 0, y: 0 };

  constructor(
    protected readonly textures: ArtSet,
    protected readonly A: ArtBase,
    cols: number,
    rows: number,
  ) {
    super();
    const geometry = new PlaneGeometry({ width: A.width, height: A.height, verticesX: cols, verticesY: rows });
    this.mesh = new Mesh({ geometry, texture: textures.base });
    this.rest = geometry.positions.slice();
    this.mesh.position.set(-A.centre.x, -A.centre.y);
    this.art.scale.set(A.scale);
    this.art.addChild(this.mesh);
    this.craft.addChild(this.art);
    this.addChild(this.craft);
  }

  /** A slot at a sprite point, in creature units, moving with the craft; `width` is the accessory's width in units. */
  protected slot(p: Point): Container {
    const c = new Container();
    c.position.set(this.px(p).x, this.px(p).y);
    this.craft.addChild(c);
    return c;
  }
  /** A sprite pixel as a creature point. */
  px(p: Point): Point {
    return { x: (p.x - this.A.centre.x) * this.A.scale, y: (p.y - this.A.centre.y) * this.A.scale };
  }

  /** The texture that should show this frame. */
  expression(): Expression {
    if (this.sincePoke < this.reactionLength) return this.sincePoke < SURPRISE ? 'surprised' : 'happy';
    if (this.lid < 0.6 && (this.mood === 'calm' || this.mood === 'happy')) return 'blink';
    return this.mood === 'calm' ? 'base' : this.mood;
  }

  protected animate(dt = 0) {
    this.stir += (this.excite(this.reactionLength) - this.stir) * Math.min(1, dt * 10);
    this.pose(dt);
    const pos = this.mesh.geometry.positions;
    const d = this.d;
    for (let i = 0, k = 0; i < pos.length; i += 2, k++) {
      d.x = 0;
      d.y = 0;
      this.displace(k, this.rest[i], this.rest[i + 1], dt, d);
      pos[i] = this.rest[i] + d.x;
      pos[i + 1] = this.rest[i + 1] + d.y;
    }
    this.mesh.geometry.getBuffer('aPosition').update();
    const e = this.expression();
    if (e !== this.shown) {
      this.shown = e;
      this.mesh.texture = this.textures[e];
    }
  }

  /** Moves the craft as a whole and advances the species' phases; runs before the vertices. */
  protected abstract pose(dt: number): void;
  /** Adds vertex `k`'s offset from its rest position (x, y) to `out`, in sprite pixels. */
  protected abstract displace(k: number, x: number, y: number, dt: number, out: Point): void;

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    // The textures are shared and cached by Assets; only the geometry belongs to this creature.
    const geometry = this.mesh.geometry;
    super.destroy(options);
    geometry.destroy();
  }
}
