import { Assets, type Texture } from 'pixi.js';
import type { AccessoryKind } from './creature';
import { type ArtBase, type ArtSet, bend, EXPRESSIONS, type Expression, IllustratedCreature, inside, type Part, type Point, reach, smooth } from './illustrated';

/**
 * RW02b step 3 (docs/rework/GENERATED-CREATURE-PILOT.md): the second-wave six as prepared
 * illustrations on the pilot's rig pattern. Each species is one smaller `*_ART` table (face, the
 * pinned body, one to four moving parts that bend about their roots, the touch circle, slots and
 * misfits) on the shared `IllustratedCreature` mesh, with the same texture swap; the reaction is
 * one of a few whole-craft moves. No save, species or route knows them yet: they stand only in
 * the dev preview (`/?cast`), and RW10's collection book is what ships them.
 *
 * Art: `cast/<species>-*.png`, cut by `scripts/creature-art/prepare-sprite.mjs --set <species>
 * --shrink 2 --out-dir src/art/creatures/cast`; `alt` (Tote, Bramble, Mossback, Lumen) is a
 * separate picture, shown as a still. See `illustrated/README.md`.
 */

export const CAST = ['tote', 'trill', 'dapple', 'bramble', 'mossback', 'lumen'] as const;
export type CastId = (typeof CAST)[number];

/** A part that bends about its root, inside an ellipse beyond the body; angles are in radians. */
export interface CastPart extends Part {
  region: { x: number; y: number; rx: number; ry: number };
  /** Idle swing, its speed (radians a second) and phase. */
  swing: number;
  speed: number;
  phase: number;
  /** Extra swing at the peak of a touch. */
  poke: number;
}

/** How the whole creature moves when touched. */
export type Reaction = 'scuttle' | 'hop' | 'creep' | 'curl' | 'plod' | 'flutter';

export interface CastArt extends ArtBase {
  nose: Point;
  mouth: Point;
  parts: readonly CastPart[];
  /** The touch circle's centre in sprite pixels, and its radius in creature units. */
  hit: Point & { r: number };
  reaction: Reaction;
  slots: { head: Point; neck?: Point };
  /** Slot widths, in creature units. */
  widths: { head: number; neck?: number };
  misfits: Partial<Record<AccessoryKind, string>>;
  /** Whether a separate `alt` picture was prepared. */
  alt: boolean;
}

/** Points were read off each prepared PNG on a 25 px grid (`test-results/grid.mjs`). Scales follow CAST.md's sizes. */
export const TOTE_ART: CastArt = {
  width: 623,
  height: 450,
  /** ≈225 units tall, as CAST.md's "about 220". */
  scale: 0.5,
  centre: { x: 330, y: 440 },
  eyes: [{ x: 378, y: 213, rx: 26, ry: 30 }, { x: 483, y: 198, rx: 10, ry: 18 }],
  nose: { x: 450, y: 218 },
  mouth: { x: 450, y: 240 },
  body: [
    { x: 20, y: 170 }, { x: 60, y: 60 }, { x: 170, y: 15 }, { x: 300, y: 30 }, { x: 360, y: 75 }, { x: 450, y: 110 },
    { x: 500, y: 150 }, { x: 512, y: 235 }, { x: 495, y: 270 }, { x: 440, y: 300 }, { x: 300, y: 310 }, { x: 150, y: 330 },
    { x: 40, y: 300 },
  ],
  /** The far claw waves about the wrist; the two back legs shuffle. */
  parts: [
    { root: { x: 505, y: 265 }, tip: { x: 585, y: 330 }, region: { x: 560, y: 310, rx: 80, ry: 90 }, swing: 0.06, speed: 2.2, phase: 0, poke: 0.35 },
    { root: { x: 150, y: 330 }, tip: { x: 135, y: 400 }, region: { x: 145, y: 370, rx: 55, ry: 60 }, swing: 0.05, speed: 3, phase: 1, poke: 0.2 },
    { root: { x: 220, y: 335 }, tip: { x: 215, y: 420 }, region: { x: 215, y: 380, rx: 45, ry: 60 }, swing: 0.05, speed: 3, phase: 2.5, poke: 0.2 },
  ],
  hit: { x: 300, y: 230, r: 150 },
  reaction: 'scuttle',
  slots: { head: { x: 430, y: 125 } },
  widths: { head: 80 },
  misfits: { scarf: 'no neck: its head sits in the shell’s mouth' },
  alt: true,
};

export const TRILL_ART: CastArt = {
  width: 644,
  height: 496,
  /** ≈228 units tall, as CAST.md's "about 230". */
  scale: 0.46,
  centre: { x: 470, y: 482 },
  eyes: [{ x: 500, y: 215, rx: 20, ry: 24 }, { x: 606, y: 200, rx: 7, ry: 16 }],
  nose: { x: 575, y: 228 },
  mouth: { x: 585, y: 240 },
  body: [
    { x: 290, y: 290 }, { x: 350, y: 190 }, { x: 420, y: 140 }, { x: 520, y: 125 }, { x: 600, y: 160 }, { x: 640, y: 240 },
    { x: 610, y: 300 }, { x: 600, y: 380 }, { x: 540, y: 430 }, { x: 400, y: 440 }, { x: 300, y: 400 }, { x: 265, y: 330 },
  ],
  /** The tail streamers sway from the rump; the crest fans from the crown. */
  parts: [
    { root: { x: 275, y: 320 }, tip: { x: 20, y: 250 }, region: { x: 135, y: 290, rx: 160, ry: 110 }, swing: 0.05, speed: 1.8, phase: 0, poke: 0.18 },
    { root: { x: 470, y: 135 }, tip: { x: 430, y: 25 }, region: { x: 430, y: 75, rx: 120, ry: 80 }, swing: 0.04, speed: 2.4, phase: 1.3, poke: 0.25 },
  ],
  hit: { x: 470, y: 290, r: 150 },
  reaction: 'hop',
  slots: { head: { x: 520, y: 132 }, neck: { x: 550, y: 330 } },
  widths: { head: 80, neck: 105 },
  misfits: {},
  alt: false,
};

export const DAPPLE_ART: CastArt = {
  width: 734,
  height: 426,
  /** ≈294 units long with the tail, ≈260 to its curl, as CAST.md's "about 260". */
  scale: 0.4,
  centre: { x: 470, y: 412 },
  eyes: [{ x: 548, y: 166, rx: 28, ry: 30 }, { x: 694, y: 152, rx: 9, ry: 20 }],
  nose: { x: 656, y: 172 },
  mouth: { x: 650, y: 200 },
  body: [
    { x: 225, y: 150 }, { x: 300, y: 110 }, { x: 420, y: 60 }, { x: 520, y: 15 }, { x: 620, y: 60 }, { x: 700, y: 110 },
    { x: 728, y: 190 }, { x: 680, y: 245 }, { x: 640, y: 290 }, { x: 670, y: 395 }, { x: 470, y: 412 }, { x: 330, y: 385 },
    { x: 200, y: 395 }, { x: 175, y: 330 }, { x: 235, y: 270 },
  ],
  /** The curled tail lifts and curls about its base. */
  parts: [
    { root: { x: 240, y: 235 }, tip: { x: 25, y: 210 }, region: { x: 110, y: 220, rx: 135, ry: 130 }, swing: 0.05, speed: 1.4, phase: 0, poke: 0.2 },
  ],
  hit: { x: 470, y: 230, r: 160 },
  reaction: 'creep',
  slots: { head: { x: 580, y: 72 }, neck: { x: 560, y: 290 } },
  widths: { head: 80, neck: 105 },
  misfits: {},
  alt: false,
};

export const BRAMBLE_ART: CastArt = {
  width: 498,
  height: 482,
  /** ≈193 units tall, as CAST.md's "about 190". */
  scale: 0.4,
  centre: { x: 300, y: 470 },
  eyes: [{ x: 345, y: 228, rx: 20, ry: 24 }, { x: 448, y: 212, rx: 8, ry: 16 }],
  nose: { x: 428, y: 235 },
  mouth: { x: 410, y: 258 },
  body: [
    { x: 205, y: 180 }, { x: 260, y: 140 }, { x: 330, y: 145 }, { x: 420, y: 135 }, { x: 470, y: 160 }, { x: 488, y: 230 },
    { x: 450, y: 330 }, { x: 420, y: 420 }, { x: 410, y: 470 }, { x: 190, y: 470 }, { x: 225, y: 400 }, { x: 230, y: 300 },
  ],
  /** The quills along its back bristle. */
  parts: [
    { root: { x: 280, y: 280 }, tip: { x: 60, y: 130 }, region: { x: 140, y: 250, rx: 170, ry: 230 }, swing: 0.025, speed: 1.6, phase: 0, poke: 0.12 },
  ],
  hit: { x: 280, y: 270, r: 170 },
  reaction: 'curl',
  slots: { head: { x: 340, y: 150 }, neck: { x: 375, y: 350 } },
  widths: { head: 110, neck: 120 },
  misfits: {},
  alt: true,
};

export const MOSSBACK_ART: CastArt = {
  width: 683,
  height: 413,
  /** ≈300 units long, as CAST.md's "about 300". */
  scale: 0.44,
  centre: { x: 360, y: 400 },
  eyes: [{ x: 545, y: 176, rx: 25, ry: 28 }, { x: 643, y: 142, rx: 7, ry: 16 }],
  nose: { x: 628, y: 170 },
  mouth: { x: 610, y: 200 },
  body: [
    { x: 40, y: 200 }, { x: 90, y: 100 }, { x: 200, y: 45 }, { x: 330, y: 45 }, { x: 420, y: 90 }, { x: 460, y: 130 },
    { x: 500, y: 90 }, { x: 600, y: 80 }, { x: 668, y: 130 }, { x: 672, y: 200 }, { x: 620, y: 250 }, { x: 540, y: 280 },
    { x: 470, y: 300 }, { x: 330, y: 300 }, { x: 250, y: 320 }, { x: 140, y: 310 }, { x: 50, y: 280 },
  ],
  /** Front and back legs plod in turn; the flower on the shell nods. */
  parts: [
    { root: { x: 390, y: 300 }, tip: { x: 400, y: 385 }, region: { x: 395, y: 350, rx: 70, ry: 60 }, swing: 0.06, speed: 2, phase: 0, poke: 0.18 },
    { root: { x: 95, y: 300 }, tip: { x: 75, y: 385 }, region: { x: 80, y: 345, rx: 70, ry: 60 }, swing: 0.06, speed: 2, phase: Math.PI, poke: 0.18 },
    { root: { x: 243, y: 62 }, tip: { x: 240, y: 12 }, region: { x: 243, y: 35, rx: 45, ry: 35 }, swing: 0.08, speed: 1.5, phase: 0.6, poke: 0.4 },
  ],
  hit: { x: 360, y: 220, r: 170 },
  reaction: 'plod',
  slots: { head: { x: 560, y: 95 }, neck: { x: 500, y: 285 } },
  widths: { head: 80, neck: 100 },
  misfits: {},
  alt: true,
};

export const LUMEN_ART: CastArt = {
  width: 623,
  height: 457,
  /** ≈280 units across, as CAST.md's "about 280". */
  scale: 0.45,
  centre: { x: 400, y: 330 },
  eyes: [{ x: 503, y: 276, rx: 16, ry: 20 }, { x: 567, y: 290, rx: 6, ry: 14 }],
  nose: { x: 545, y: 300 },
  mouth: { x: 545, y: 310 },
  body: [
    { x: 340, y: 240 }, { x: 420, y: 195 }, { x: 500, y: 215 }, { x: 555, y: 240 }, { x: 585, y: 290 }, { x: 570, y: 330 },
    { x: 500, y: 370 }, { x: 420, y: 420 }, { x: 330, y: 440 }, { x: 200, y: 410 }, { x: 165, y: 330 }, { x: 250, y: 305 },
  ],
  /** Both wings flutter from the shoulder; the two feathery antennae sway. */
  parts: [
    { root: { x: 330, y: 265 }, tip: { x: 30, y: 90 }, region: { x: 190, y: 170, rx: 220, ry: 170 }, swing: 0.07, speed: 4, phase: 0, poke: 0.18 },
    { root: { x: 365, y: 235 }, tip: { x: 330, y: 20 }, region: { x: 360, y: 120, rx: 110, ry: 125 }, swing: 0.06, speed: 4, phase: 0.5, poke: 0.15 },
    { root: { x: 520, y: 225 }, tip: { x: 505, y: 120 }, region: { x: 505, y: 170, rx: 50, ry: 60 }, swing: 0.08, speed: 2.1, phase: 0, poke: 0.25 },
    { root: { x: 565, y: 245 }, tip: { x: 585, y: 140 }, region: { x: 580, y: 190, rx: 40, ry: 60 }, swing: 0.08, speed: 2.1, phase: 1.2, poke: 0.25 },
  ],
  hit: { x: 380, y: 260, r: 170 },
  reaction: 'flutter',
  slots: { head: { x: 535, y: 228 } },
  widths: { head: 60 },
  misfits: { scarf: 'no neck: the fuzz runs straight from head to body' },
  alt: true,
};

export const CAST_ART: Record<CastId, CastArt> = {
  tote: TOTE_ART,
  trill: TRILL_ART,
  dapple: DAPPLE_ART,
  bramble: BRAMBLE_ART,
  mossback: MOSSBACK_ART,
  lumen: LUMEN_ART,
};

/** How strongly each part bends at a rest point (sprite pixels): 0 in the body, rising from each root toward its tip. */
export function castWeights(A: CastArt, x: number, y: number): number[] {
  if (inside(A.body, x, y)) return A.parts.map(() => 0);
  return A.parts.map((p) => {
    const d = Math.hypot((x - p.region.x) / p.region.rx, (y - p.region.y) / p.region.ry);
    return smooth(1, 0.55, d) * smooth(0.05, 0.9, reach(p, x, y));
  });
}

const COLS = 24;
const ROWS = 24;

export class IllustratedCast extends IllustratedCreature {
  readonly touch: { x: number; y: number; r: number };
  protected readonly reactionLength = 1;
  private readonly w: number[][] = [];
  private readonly C: CastArt;

  constructor(
    readonly species: CastId,
    textures: ArtSet,
  ) {
    const A = CAST_ART[species];
    super(textures, A, COLS, ROWS);
    this.C = A;
    const hit = this.px(A.hit);
    this.touch = { x: hit.x, y: hit.y, r: A.hit.r };
    Object.assign(this.misfit, A.misfits);
    this.slots.head = { node: this.slot(A.slots.head), width: A.widths.head };
    if (A.slots.neck) this.slots.neck = { node: this.slot(A.slots.neck), width: A.widths.neck ?? 100 };
    for (let i = 0; i < this.rest.length; i += 2) this.w.push(castWeights(A, this.rest[i], this.rest[i + 1]));
    this.animate();
  }

  protected pose() {
    const t = this.clock;
    const touched = this.sincePoke < this.reactionLength;
    const u = touched ? this.sincePoke / this.reactionLength : 1;
    const up = Math.sin(u * Math.PI);
    const c = this.craft;
    c.position.set(0, 0);
    c.rotation = 0;
    c.scale.set(1);
    switch (this.C.reaction) {
      case 'scuttle':
        c.x = 34 * Math.sin(u * Math.PI * 4) * (1 - u);
        c.y = -6 * Math.abs(Math.sin(u * Math.PI * 4));
        break;
      case 'hop':
        c.y = -60 * up;
        c.scale.set(1 + 0.05 * up, 1 - 0.04 * up);
        break;
      case 'creep':
        c.x = 30 * up;
        c.rotation = -0.05 * up;
        break;
      case 'curl':
        c.scale.set(1 + 0.1 * up, 1 - 0.24 * up);
        break;
      case 'plod':
        c.x = 26 * up;
        c.y = -12 * Math.abs(Math.sin(u * Math.PI * 3));
        break;
      case 'flutter':
        c.y = -50 * up + 8 * Math.sin(t * 1.5);
        c.rotation = 0.04 * Math.sin(t * 1.1);
        break;
    }
  }

  protected displace(k: number, x: number, y: number, _dt: number, out: Point) {
    const t = this.clock;
    const parts = this.C.parts;
    const w = this.w[k];
    for (let i = 0; i < parts.length; i++) {
      if (w[i] <= 0) continue;
      const p = parts[i];
      const angle = p.swing * Math.sin(t * p.speed + p.phase) + p.poke * this.stir * Math.sin(t * 7 + p.phase);
      bend(p.root, x, y, angle, w[i], out);
    }
  }
}

/** The sprite files, by species and picture; only the dev preview reaches this, so none ship yet. */
const files = import.meta.glob<string>('./cast/*-*.png', { query: '?url', import: 'default' });

export interface CastSet {
  textures: ArtSet;
  alt: Texture | null;
}

/** Loads a second-wave species' six expressions and its `alt` still, if it has one. */
export async function loadCast(species: CastId): Promise<CastSet> {
  const load = async (name: Expression | 'alt') => {
    const url = files[`./cast/${species}-${name}.png`];
    if (!url) throw new Error(`no prepared sprite for ${species} ${name}`);
    const t = await Assets.load<Texture>(await url());
    t.source.autoGenerateMipmaps = true;
    t.source.updateMipmaps();
    return t;
  };
  const entries = await Promise.all(EXPRESSIONS.map(async (e) => [e, await load(e)] as const));
  return { textures: Object.fromEntries(entries) as Record<Expression, Texture>, alt: CAST_ART[species].alt ? await load('alt') : null };
}
