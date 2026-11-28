import {
  Assets,
  Circle,
  ColorMatrixFilter,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  type Texture,
} from 'pixi.js';
import type { Mood } from '../art/critter';
import { ink, petSage, swatch, type ColorName } from '../art/palette';
import { makeCreature } from '../art/creatures';
import type { Creature } from '../art/creatures/creature';
import {
  IllustratedCreature,
  loadArt,
  type ArtSet,
  type Mood as RigMood,
} from '../art/creatures/illustrated';
import { GLIDER_WEAR, IllustratedGlider } from '../art/creatures/glider-illustrated';
import { IllustratedRiver, RIVER_WEAR } from '../art/creatures/river-illustrated';
import { formFits, wearForm } from '../art/creatures/forms';
import { IllustratedSprout, SPROUT_WEAR } from '../art/creatures/sprout-illustrated';
import { PAPER_CREATURES, paperArt } from '../art/creatures/paper';
import { paperCircle, paperLine, paperPoly } from '../art/paper';
import { changeWorn, SLOT, type WearSlot } from '../art/creatures/wear-slots';
import {
  fileOf,
  fits,
  loadWearables,
  wearItem,
  WEARABLES,
  type ItemTextures,
  type WearableId,
  type WearTable,
  type WearTables,
} from '../art/creatures/wearables';
import { sfx } from '../audio/sfx';
import { MIXED_COLORS, type PetColor } from '../content/world';
import type { Individual } from '../progress/save';
import { store } from '../progress/store';
import type { FormId } from './forms';
import { ART_OF, creaturePoint, PARTS, type PartName } from './parts';
import { SPECIES, SPECIES_IDS, type SpeciesId } from './species';

/**
 * RW05 slice 1 (docs/rework/CREATURE-COLLECTION.md#the-companion-in-code-one-seam-two-slices): the friend who travels
 * with her, drawn by its species' illustrated rig (RW02b, `src/art/creatures/<species>-illustrated.ts`). The shell, the
 * guide and the island build it with `makeCompanion()`. Slice 2 gives it the surface the large-pet games need
 * (`CompanionRig`: named parts, `spin`, `wiggle`, a body bounds); a game builds one with `ctx.companion()`.
 *
 * The art is loaded once at boot (`loadCollectionArt()`), so building a companion never waits. Without it (a unit test,
 * or a load that failed) a species falls back to its Graphics rig, a portrait to a frozen rig and the egg to `drawEgg`.
 */

/** The prepared collection pictures (`./art/`, see its README), loaded with the species' expression sets. */
const files = import.meta.glob<string>('./art/*.png', { query: '?url', import: 'default', eager: true });
const fileUrl = (name: string) => files[`./art/${name}.png`];

const loaded: {
  sets: Partial<Record<SpeciesId, ArtSet>>;
  pictures: Map<string, Texture>;
  items: ItemTextures;
} = { sets: {}, pictures: new Map(), items: {} };

/** Where each wearable sits on each species (RW06), from the rigs' own tables. */
/**
 * Where the paper creatures (docs/ART-STYLE.md) need an item placed differently from the painted ones. The paper
 * Sprout's face sits low, so its scarf goes lower and its crown higher, leaving the mouth and eyes showing. The paper River has a thicker neck
 * further forward and a rounder, smaller head: its scarf wraps the front of the neck, its glasses are sized to the head,
 * and its boots sit low enough to hide the paws.
 */
const PAPER_FITS: Partial<Record<SpeciesId, Partial<WearTable>>> = {
  sprout: {
    scarf: { fits: [{ at: { x: 262, y: 344 }, width: 140 }] },
    crown: { fits: [{ at: { x: 245, y: 100 }, width: 150, ride: { x: 245, y: 150 } }] },
  },
  river: {
    scarf: { fits: [{ at: { x: 585, y: 140 }, width: 92, rotation: -0.25 }] },
    sunglasses: { fits: [{ at: { x: 640, y: 56 }, width: 78 }] },
    boots: {
      fits: [
        { at: { x: 215, y: 312 }, width: 50 },
        { at: { x: 330, y: 312 }, width: 50 },
        { at: { x: 555, y: 314 }, width: 50 },
        { at: { x: 610, y: 312 }, width: 50 },
      ],
    },
  },
};
const withPaper = (species: SpeciesId, table: WearTable): WearTable =>
  PAPER_CREATURES ? { ...table, ...PAPER_FITS[species] } : table;
export const WEAR: WearTables = {
  sprout: withPaper('sprout', SPROUT_WEAR),
  river: withPaper('river', RIVER_WEAR),
  glider: withPaper('glider', GLIDER_WEAR),
};

/** The items a species can wear, in the wardrobe's order: its misfits are never offered. */
export const wearableBy = (species: SpeciesId): WearableId[] =>
  WEARABLES.filter((w) => fits(WEAR[species][w]));

export const EGG_STAGES = ['whole', 'crack', 'open'] as const;
export type EggStage = (typeof EGG_STAGES)[number];
const EGG_FILE: Record<EggStage, string> = {
  whole: 'egg-sprout',
  crack: 'egg-sprout-crack',
  open: 'egg-sprout-open',
};

/** Loads every species' rig art, the portraits, the card paper, the sprout's egg and the wearables. Never throws: what fails falls back (an item that failed is not drawn). */
export async function loadCollectionArt(): Promise<void> {
  // The paper look draws the egg, the cards and their portraits in code (`paperEgg`, `makePortrait`'s frozen rig).
  const pictures = PAPER_CREATURES
    ? []
    : [...SPECIES_IDS.map((s) => `${s}-portrait`), 'card-paper', ...Object.values(EGG_FILE)];
  await Promise.all([
    loadWearables().then(
      (items) => void (loaded.items = items),
      (e) => console.warn('Could not load the wearables', e),
    ),
    ...SPECIES_IDS.map(async (s) => {
      try {
        loaded.sets[s] = paperArt(s) ?? (await loadArt(s));
      } catch (e) {
        console.warn(`Could not load the ${s} art`, e);
      }
    }),
    ...pictures.map(async (name) => {
      try {
        const url = fileUrl(name);
        if (!url) throw new Error('not prepared');
        const t = await Assets.load<Texture>(url);
        t.source.autoGenerateMipmaps = true;
        t.source.updateMipmaps();
        loaded.pictures.set(name, t);
      } catch (e) {
        console.warn(`Could not load ${name}`, e);
      }
    }),
  ]);
}

/** For tests: draws a species with the given art instead of what boot loaded. */
export function useArt(species: SpeciesId, art: ArtSet | undefined) {
  loaded.sets[species] = art;
}

/** An item's loaded sprite, for a wardrobe card; null if it failed to load. */
export const itemTexture = (id: WearableId): Texture | null => loaded.items[fileOf(id)] ?? null;

/** For tests: draws the wearables with these textures. */
export function useItems(items: ItemTextures) {
  loaded.items = items;
}

/**
 * Each species at a common size: the rigs are drawn at their natural sizes (the sprout ≈ 230 units tall, the river
 * ≈ 340 long, the glider ≈ 380 across), and a companion at scale 1 should take about the room the old pip did (≈ 250
 * tall, feet on (0, 0)), so every caller's scale, position and hit area keep working. `lift` raises a rig whose (0, 0)
 * is not its feet: the glider's is its body centre, and it floats.
 */
export const FIT: Record<SpeciesId, { scale: number; lift: number }> = {
  sprout: { scale: 1.15, lift: 0 },
  river: { scale: 0.82, lift: 0 },
  glider: { scale: 0.68, lift: 120 },
};

/** The guide in a round stands at (74, view.h − 18) at this scale, inside the pip's old bottom-left clearance. */
export const GUIDE_SCALE = 0.42;

/**
 * What the guide leaves off (RW06): the sprout's umbrella, held out beside it, reaches about 25 units past the corner's
 * clearance at guide size (the footprint test), so the guide drops the `held` slot rather than shrink every species. It
 * is still saved and still shows everywhere else.
 */
export const GUIDE_LEAVES_OFF: readonly WearSlot[] = ['held'];

/** The mood a scene asks for, as a rig shows it: the rigs have no singing face, so a song shows as happy. */
const RIG_MOOD: Record<Mood, RigMood> = {
  happy: 'happy',
  surprised: 'surprised',
  sing: 'happy',
  sleepy: 'sleepy',
  sad: 'sad',
  calm: 'calm',
};

/** A colour's hue, in degrees. */
export function hueOf(rgb: number): number {
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/**
 * How far her chosen colour turns the illustration's hue, in degrees: 0 for the species' own colour. A multiply tint
 * cannot make a teal picture pink, so a chosen colour turns the whole picture round the colour wheel (the sprout's
 * leaves and belly turn with it).
 */
export function hueTurn(species: SpeciesId, color: PetColor): number {
  if (color === SPECIES[species].color) return 0;
  const turn =
    hueOf(swatch[color as ColorName].fill) - hueOf(swatch[SPECIES[species].color as ColorName].fill);
  return (((turn % 360) + 540) % 360) - 180;
}

/** A colour's whiteness: its lowest channel, 0–255. */
const whiteness = (rgb: number) => Math.min((rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff);

/**
 * How far a mixed colour (the paint shelf's six, paint-mixer 4) lifts the picture toward white after the hue turn, 0–0.5:
 * a hue turn alone would make peach the orange friend's twin, and a mixed colour is the paler for its white. Measured
 * from the swatches: the share of the gap to white that the colour's whiteness adds over the species' own colour, scaled
 * by 0.65 and capped at a half, so the six keep their order of paleness and the ink lines stay lines. The eight first colours are never lifted, so they look as they always have.
 */
export function paleness(species: SpeciesId, color: PetColor): number {
  if (!(MIXED_COLORS as readonly string[]).includes(color)) return 0;
  const base = whiteness(swatch[SPECIES[species].color as ColorName].fill);
  const lift = (whiteness(swatch[color as ColorName].fill) - base) / (255 - base);
  return Math.min(0.5, Math.max(0, 0.65 * lift));
}

/** Pixi's hue turn (`ColorMatrixFilter.hue`) as a 5×4 matrix: a turn about the grey axis, so white stays white. */
export function hueMatrix(degrees: number): number[] {
  const r = (degrees / 180) * Math.PI;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const w = 1 / 3;
  const s = Math.sqrt(w);
  const d = cos + (1 - cos) * w;
  const p = w * (1 - cos) + s * sin;
  const m = w * (1 - cos) - s * sin;
  return [d, m, p, 0, 0, p, d, m, 0, 0, m, p, d, 0, 0, 0, 0, 0, 1, 0];
}

/**
 * The 5×4 colour matrix that turns the species' picture to her colour: the hue turn, then (a mixed colour only) a step
 * `paleness` of the way to white. A hue turn keeps white white, so the two commute. Null for the species' own colour.
 */
export function recolorMatrix(species: SpeciesId, color: PetColor): number[] | null {
  if (color === SPECIES[species].color) return null;
  const turn = hueTurn(species, color);
  const pale = paleness(species, color);
  if (turn === 0 && pale === 0) return null;
  const m = hueMatrix(turn);
  for (const row of [0, 5, 10]) {
    for (let i = 0; i < 5; i++) m[row + i] *= 1 - pale;
    m[row + 4] += pale;
  }
  return m;
}

/** Turns a picture to her chosen colour; nothing (and no filter) for the species' own. */
export function recolor(node: Container, species: SpeciesId, color: PetColor) {
  const m = recolorMatrix(species, color);
  if (!m) {
    node.filters = [];
    return;
  }
  // At the screen's own resolution: a filter's default of 1 would soften the art on a 2× iPad.
  const f = new ColorMatrixFilter({ resolution: 'inherit', antialias: 'inherit' });
  f.matrix = m as typeof f.matrix;
  node.filters = [f];
  node.once('destroyed', () => f.destroy());
}

/** Half way from white to a colour. */
const halfway = (rgb: number) =>
  [16, 8, 0].reduce((n, shift) => n | (Math.round((255 + ((rgb >> shift) & 0xff)) / 2) << shift), 0);

/** Plays a species' chirp: its two or three pentatonic steps, one after another. */
export function chirp(species: SpeciesId) {
  SPECIES[species].chirp.forEach((step, i) => {
    if (i === 0) sfx.chirp(step);
    else setTimeout(() => sfx.chirp(step), i * 110);
  });
}

/**
 * What a large-pet game asks of its star (RW05 slice 2, from docs/rework/art-requests/GAME-FIT.md): named parts to hang
 * things on or aim at, the moods, the motions and a body bounds. Units are the companion's own: feet on (0, 0), about
 * the old pip's size at scale 1, so a game's sizes still hold.
 */
export interface CompanionRig extends Container {
  readonly species: SpeciesId;
  readonly color: PetColor;
  readonly touch: { x: number; y: number; r: number };
  alive: boolean;
  /** Containers riding a part, one per point (two ears, two hands); empty where the species lacks it (`PARTS[species].misfits`). */
  part(name: PartName): readonly Container[];
  /** Where a part's points are at rest, in companion units; empty for a misfit. */
  partPoints(name: PartName): readonly { x: number; y: number }[];
  /** The pinned body (head and torso), at rest, in companion units: for games that use the whole body. */
  bodyBounds(): Rectangle;
  touchArea(grow?: number): Circle;
  attach(child: Container): void;
  /** The touch reaction; `quiet` is a squash and a surprised face in place, with no chirp. */
  poke(quiet?: boolean): void;
  hop(power?: number): void;
  cheer(): void;
  /** A turn on the spot, about a second. */
  spin(): void;
  /** A side-to-side wiggle, about half a second. */
  wiggle(): void;
  setMood(mood: Mood, seconds?: number): void;
  readonly currentMood: Mood;
  update(dt: number): void;
}

/**
 * The companion as a scene draws it: feet on (0, 0), about pip-sized at scale 1, with the surface the shell and the
 * games' guide use (`poke`, `hop`, `cheer`, `setMood`, `currentMood`). The hop and its squash ride on an outer body,
 * because each rig poses its own craft every frame.
 */
export class Companion extends Container implements CompanionRig {
  readonly species: SpeciesId;
  /** The individual drawn, or null for the stand-in sprout before her first friend. */
  readonly id: string | null;
  readonly rig: Creature;
  /** Her chosen colour for it. */
  readonly color: PetColor;
  /** Body-centred, in this container's units, for a hit area. */
  readonly touch: { x: number; y: number; r: number };
  alive = true;

  private readonly body = new Container();
  private mood: Mood = 'happy';
  private restingMood: Mood = 'happy';
  private moodLeft = 0;
  private hopY = 0;
  /**
   * The corner guide's talking look (U7 R5): while true it bobs gently on its feet, easing in and out, so a held line
   * shows it is holding. GameScene sets it while one of the game's lines plays.
   */
  talking = false;
  private talkAmt = 0;
  private talkT = 0;
  private hopV = 0;
  private squash = 0;
  private squashV = 0;

  private spinT = -1;
  private wiggleT = -1;
  private tiltT = -1;
  private readonly parts = new Map<PartName, Container[]>();

  private shown: WearableId[] = [];
  /** What is actually on the rig (a misfit, a leave-off slot, a failed texture or a blossom's head slot are listed but not drawn). */
  private readonly drawn = new Set<WearableId>();
  private shownForm: FormId | null = null;
  /** Slots this companion never draws, though they stay listed in `worn` (the guide's `held`). */
  private readonly leaveOff: readonly WearSlot[];

  constructor(
    who: {
      species: SpeciesId;
      look: { color: PetColor; worn?: readonly WearableId[]; form?: FormId | null };
      id?: string | null;
    },
    art: ArtSet | undefined = loaded.sets[who.species],
    leaveOff: readonly WearSlot[] = [],
  ) {
    super();
    this.leaveOff = leaveOff;
    this.species = who.species;
    this.id = who.id ?? null;
    this.color = who.look.color;
    this.rig = art ? illustrated(who.species, art) : makeCreature(who.species);
    const fit = FIT[who.species];
    this.rig.scale.set(fit.scale);
    this.rig.y = -fit.lift;
    if (this.rig instanceof IllustratedCreature) recolor(this.rig.skin, who.species, who.look.color);
    const t = this.rig.touch;
    this.touch = { x: t.x * fit.scale, y: t.y * fit.scale - fit.lift, r: t.r * fit.scale };
    this.body.addChild(this.rig);
    this.addChild(this.body);
    this.dress(who.look.worn ?? [], who.look.form ?? null);
  }

  /** What it has on, as saved (RW06), in the order put on. A misfit for its species is listed but not drawn. */
  get worn(): readonly WearableId[] {
    return this.shown;
  }

  /** The blossom it shows (RW11), as saved, or null for its original look. */
  get form(): FormId | null {
    return this.shownForm;
  }

  /**
   * Changes what it wears to `worn` and the blossom it shows to `form` (kept as it is when omitted): what is no longer
   * wanted comes off first, then what is new goes on. A blossom takes the head slot, so a hat in `worn` is kept but not
   * drawn while a blossom is. The Graphics fallback rig wears nothing (`wearItem` dresses illustrated rigs only), nor does
   * an item whose texture failed.
   */
  dress(worn: readonly WearableId[], form: FormId | null = this.shownForm) {
    const next = [...worn];
    if (this.rig instanceof IllustratedCreature) {
      const table = WEAR[this.species];
      const blossom = form !== null && formFits(this.species, form);
      const wanted = (w: WearableId) =>
        next.includes(w) &&
        !!loaded.items[fileOf(w)] &&
        !this.leaveOff.includes(SLOT[w]) &&
        !(blossom && SLOT[w] === 'head');
      for (const w of [...this.drawn]) {
        if (wanted(w)) continue;
        wearItem(this.rig, table, w, null);
        this.drawn.delete(w);
      }
      for (const w of next) {
        const t = loaded.items[fileOf(w)];
        if (t && wanted(w) && !this.drawn.has(w) && wearItem(this.rig, table, w, t)) this.drawn.add(w);
      }
      if (form !== this.shownForm) wearForm(this.rig, this.species, blossom ? form : null);
    }
    this.shown = next;
    this.shownForm = form;
  }

  /** Puts one item on (taking off whatever shares its slot, and the blossom for a hat) or takes it off. */
  wear(item: WearableId, on: boolean) {
    this.dress(changeWorn(this.shown, item, on), on && SLOT[item] === 'head' ? null : this.shownForm);
  }

  /** A body-centred hit circle, `grow` units larger than the body. */
  touchArea(grow = 0): Circle {
    return new Circle(this.touch.x, this.touch.y, this.touch.r + grow);
  }

  /** Adds something that rides along with the body (it hops and squashes with it). */
  attach(child: Container) {
    this.body.addChild(child);
  }

  /**
   * The species' touch reaction (the sprout's hop, the river's rear, the glider's flap) and its chirp. `quiet` is the old
   * pip's poke instead: a squash and a surprised face, staying where it is, for a game that pokes it often or has hung
   * things on its body (the bath's mud under a scrubbing finger, Pet Says' mittens).
   */
  poke(quiet = false) {
    if (quiet) {
      this.squashV += 4;
      this.setMood('surprised', 0.6);
      return;
    }
    this.rig.poke();
    this.squashV += 3;
    chirp(this.species);
  }

  partPoints(name: PartName): { x: number; y: number }[] {
    return restPoints(this.species, name);
  }

  /**
   * Each container rides its point: on an illustrated rig it is pinned to the mesh (`IllustratedCreature.pin`), so it
   * moves with a leaf, a tail or a hop; on the Graphics fallback it rides the body. Either way its units are the
   * companion's, so something drawn for the old pip keeps its size.
   */
  part(name: PartName): readonly Container[] {
    let list = this.parts.get(name);
    if (list) return list;
    const fit = FIT[this.species];
    const rig = this.rig;
    list = (PARTS[this.species].points[name] ?? []).map((p, i) => {
      const c = new Container();
      c.label = `${name}${i}`;
      if (rig instanceof IllustratedCreature) {
        c.scale.set(1 / fit.scale);
        rig.pin(c, p);
      } else {
        c.position.copyFrom(this.partPoints(name)[i]);
        this.body.addChild(c);
      }
      return c;
    });
    this.parts.set(name, list);
    return list;
  }

  bodyBounds(): Rectangle {
    const b = bodyBox(this.species);
    return new Rectangle(b.x, b.y, b.width, b.height);
  }

  spin() {
    this.spinT = 0;
  }

  wiggle() {
    this.wiggleT = 0;
  }

  /** One slow lean to the side and back: "hm?", for a wrong answer a reader cannot hear. */
  tilt() {
    this.tiltT = 0;
  }

  hop(power = 1) {
    if (this.hopY < 0) return;
    this.hopV = -520 * power;
    this.squashV -= 2;
  }

  cheer() {
    this.hop(1.1);
    this.setMood('happy', 1);
  }

  get currentMood(): Mood {
    return this.mood;
  }

  /** With `seconds`, the mood is temporary and it returns to its resting mood after. */
  setMood(mood: Mood, seconds = 0) {
    if (seconds > 0) this.moodLeft = seconds;
    else {
      this.restingMood = mood;
      this.moodLeft = 0;
    }
    this.mood = mood;
    if (this.rig instanceof IllustratedCreature) this.rig.mood = RIG_MOOD[mood];
  }

  update(dt: number) {
    if (!this.alive) return;
    if (this.moodLeft > 0) {
      this.moodLeft -= dt;
      if (this.moodLeft <= 0) this.setMood(this.restingMood);
    }
    this.squashV += (-180 * this.squash - 9 * this.squashV) * dt;
    this.squash += this.squashV * dt;
    if (this.hopY < 0 || this.hopV < 0) {
      this.hopV += 2400 * dt;
      this.hopY += this.hopV * dt;
      if (this.hopY >= 0) {
        this.hopY = 0;
        this.hopV = 0;
        this.squashV += 3;
      }
    }
    const s = Math.max(-0.25, Math.min(0.25, this.squash * 0.05));
    // The spin turns it round on the spot (a squeeze through side-on and back); the wiggle rocks it on its feet.
    let turn = 1;
    if (this.spinT >= 0) {
      this.spinT += dt;
      turn = this.spinT >= 0.9 ? 1 : Math.cos((this.spinT / 0.9) * Math.PI * 2);
      if (this.spinT >= 0.9) this.spinT = -1;
    }
    let rock = 0;
    if (this.wiggleT >= 0) {
      this.wiggleT += dt;
      rock = this.wiggleT >= 0.5 ? 0 : 0.14 * Math.sin((this.wiggleT / 0.5) * Math.PI * 4);
      if (this.wiggleT >= 0.5) this.wiggleT = -1;
    }
    if (this.tiltT >= 0) {
      this.tiltT += dt;
      if (this.tiltT >= 0.7) this.tiltT = -1;
      else rock += 0.2 * Math.sin((this.tiltT / 0.7) * Math.PI);
    }
    this.talkAmt += Math.max(-dt * 5, Math.min(dt * 5, (this.talking ? 1 : 0) - this.talkAmt));
    this.talkT = this.talkAmt > 0 ? this.talkT + dt : 0;
    const bob = -16 * this.talkAmt * Math.abs(Math.sin(this.talkT * Math.PI * 2.4));
    this.body.y = this.hopY + bob;
    this.body.rotation = rock;
    this.body.scale.set((1 + s) * turn, 1 - s);
    this.rig.update(dt);
  }
}

/** A part's points on a species at rest, in companion units (feet on (0, 0), about pip-sized); empty for a misfit. */
export function restPoints(species: SpeciesId, name: PartName): { x: number; y: number }[] {
  const fit = FIT[species];
  return (PARTS[species].points[name] ?? []).map((p) => {
    const c = creaturePoint(species, p);
    return { x: c.x * fit.scale, y: c.y * fit.scale - fit.lift };
  });
}

/** A species' pinned body (head and torso) at rest, in companion units. */
export function bodyBox(species: SpeciesId): { x: number; y: number; width: number; height: number } {
  const fit = FIT[species];
  const pts = ART_OF[species].body.map((p) => creaturePoint(species, p));
  const xs = pts.map((p) => p.x * fit.scale);
  const ys = pts.map((p) => p.y * fit.scale - fit.lift);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function illustrated(species: SpeciesId, art: ArtSet): IllustratedCreature {
  if (species === 'sprout') return new IllustratedSprout(art);
  if (species === 'river') return new IllustratedRiver(art);
  return new IllustratedGlider(art);
}

/** Who stands in before her first friend: a teal sprout, which is what the egg hatches. */
/** The friend who stands in before a hatch: the guide, the star and the first-visit screen's age places. */
export const STAND_IN = { species: 'sprout', look: { color: SPECIES.sprout.color, worn: [] } } as const;

/** The active profile's companion, or null before the first friend hatches. */
export const companion = (): Individual | null => store.companion;

/** Draws the companion (or the stand-in sprout before her first friend). */
export function makeCompanion(): Companion {
  return new Companion(companion() ?? STAND_IN);
}

/** The companion as the corner guide in a round: dressed, leaving off what would reach past the corner. */
export function makeGuide(): Companion {
  return new Companion(companion() ?? STAND_IN, undefined, GUIDE_LEAVES_OFF);
}

/**
 * A large-pet game's star (`ctx.companion()`): the companion, undressed, since the game puts its own things on (mud,
 * clothes, mittens) and a saved hat would cover a part it names.
 */
export function makeStar(): Companion {
  const who = companion() ?? STAND_IN;
  return new Companion({ ...who, look: { color: who.look.color, worn: [] } });
}

/** Draws one individual, for Friends and for another profile's card. */
export const makeIndividual = (who: Individual): Companion => new Companion(who);

/**
 * A collection card's picture: the species' portrait over the card paper, the paper washed with her colour. `size` is
 * the card's side in units. A still picture, so a card never keeps a live rig. Without the art, a frozen rig.
 */
export function makePortrait(
  who: Pick<Individual, 'species'> & { look: { color: PetColor } },
  size: number,
  silhouette = false,
): Container {
  const card = new Container();
  const paper = loaded.pictures.get('card-paper');
  const tone = swatch[who.look.color as ColorName];
  if (paper) {
    const p = new Sprite(paper);
    p.anchor.set(0.5);
    p.width = p.height = size;
    // Half way from white to her colour's light shade: a wash on the cream, not a grey.
    p.tint = halfway(tone.light);
    card.addChild(p);
  } else {
    card.addChild(
      new Graphics()
        .roundRect(-size / 2, -size / 2, size, size, size * 0.16)
        .fill(tone.light)
        .stroke({ width: 5, color: tone.line }),
    );
  }
  const face = loaded.pictures.get(`${who.species}-portrait`);
  if (face) {
    const f = new Sprite(face);
    f.anchor.set(0.5);
    const room = size * 0.8;
    f.scale.set(Math.min(room / face.width, room / face.height));
    if (silhouette) silhouetteOf(f);
    else recolor(f, who.species, who.look.color);
    card.addChild(f);
  } else {
    const c = new Companion(who, undefined);
    c.alive = false;
    c.rig.alive = false;
    c.scale.set((size * 0.75) / 300);
    c.y = size * 0.35;
    if (silhouette) silhouetteOf(c);
    card.addChild(c);
  }
  return card;
}

function silhouetteOf(node: Container) {
  const dark = new ColorMatrixFilter({ resolution: 'inherit', antialias: 'inherit' });
  const r = ((ink >> 16) & 255) / 255;
  const g = ((ink >> 8) & 255) / 255;
  const b = (ink & 255) / 255;
  dark.matrix = [0, 0, 0, 0, r, 0, 0, 0, 0, g, 0, 0, 0, 0, b, 0, 0, 0, 1, 0];
  node.filters = [dark];
  node.once('destroyed', () => dark.destroy());
}

/**
 * The sprout's egg at a stage (R08 whole, R18 crack and open), centred on (0, 0) at about the old drawn egg's size
 * (200 × 260). Each stage was cut on its own, so they are placed by the source origin each recorded (`./art/README.md`):
 * the open stage's lifted cap makes it taller, and its bottom edge is the same.
 */
export function makeEgg(stage: EggStage): Container {
  const t = loaded.pictures.get(EGG_FILE[stage]);
  if (!t) return paperEgg(stage);
  const egg = new Sprite(t);
  egg.anchor.set(0.5, 1);
  egg.scale.set(EGG.scale);
  egg.y = EGG.bottom;
  const c = new Container();
  c.addChild(egg);
  return c;
}

/**
 * The egg's sprites, cut at `--shrink 2` (2 source pixels a sprite pixel), drawn at half size. `origins` are the source
 * pixels under each sprite's top-left, as the preparation script reported them; a test checks that every stage's left
 * and bottom edges land on the same source pixel (within one), which is why one bottom anchor places all three.
 */
export const EGG = {
  scale: 0.5,
  bottom: 134,
  origins: { whole: [189, 107], crack: [189, 107], open: [189, 26] } as Record<EggStage, [number, number]>,
  files: EGG_FILE,
};

const EGG_SHELL = 0xfdf3dc;
const EGG_SPOT = petSage.fill;
const EGG_CRACK = petSage.line;

/** A point on the egg's edge, `a` from the top round clockwise: 100 wide at the waist, narrower on top, 130 tall. */
const eggAt = (a: number): [number, number] => [
  100 * Math.sin(a) * (1 - 0.1 * Math.cos(a)),
  -130 * Math.cos(a) + 4,
];

/** The crack across the shell at y = -20, a zigzag from x0 to x1. */
function zigzag(x0: number, x1: number): number[] {
  const out: number[] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) out.push(x0 + ((x1 - x0) * i) / n, -20 + (i % 2 ? 14 : -10));
  return out;
}

/**
 * The sprout's egg in paper (docs/ART-STYLE.md), for every stage, in the old drawn egg's box (200 × 260, bottom at
 * 134): a cream shell with teal spots, cracked across the middle, and opened with the cap lifted and tipped.
 */
export function paperEgg(stage: EggStage): Container {
  const c = new Container();
  const shell = (from: number, to: number, cut: boolean, spots: [number, number, number][]) => {
    const g = new Graphics();
    const pts: number[] = [];
    for (let k = 0; k <= 40; k++) pts.push(...eggAt(from + ((to - from) * k) / 40));
    // The edge runs round from one end of the crack to the other, so the zigzag closes it back to the start.
    if (cut) pts.push(...zigzag(pts[pts.length - 2], pts[0]));
    // A gentle wobble: the egg is big on the hatch screen, and a lumpy egg looks squashed.
    paperPoly(g, pts, EGG_SHELL, { amp: 1.4, seed: `egg${from}`, line: 0xb9a888 });
    spots.forEach(([x, y, r], i) =>
      paperCircle(g, x, y, r, EGG_SPOT, { noShadow: true, amp: 1.2, seed: `spot${i}` }),
    );
    return g;
  };
  if (stage !== 'open') {
    const g = shell(0, Math.PI * 2, false, [
      [-34, -72, 26],
      [44, -16, 32],
      [-46, 42, 30],
      [30, 86, 24],
    ]);
    if (stage === 'crack') {
      const z = zigzag(-94, 94);
      paperLine(
        g,
        z.flatMap((v, i) => (i % 2 ? [] : [[v, z[i + 1]] as [number, number]])),
        EGG_CRACK,
        7,
        { noShadow: true },
      );
    }
    c.addChild(g);
    return c;
  }
  const a0 = Math.acos(24 / 130);
  const bottom = shell(a0, Math.PI * 2 - a0, true, [
    [-46, 42, 30],
    [30, 86, 24],
    [52, 14, 18],
  ]);
  const cap = shell(-a0, a0, true, [[-30, -76, 24]]);
  cap.pivot.set(60, -20);
  cap.position.set(66, -58);
  cap.rotation = 0.36;
  c.addChild(bottom, cap);
  return c;
}

/** The drawn egg: the fallback when the art did not load. */
export function drawEgg(g: Graphics, cracks = 0): Graphics {
  g.clear().ellipse(0, 0, 100, 130).fill(swatch.white.fill).stroke({ width: 7, color: swatch.teal.line });
  for (const [x, y, r] of [
    [-35, -60, 18],
    [38, -20, 22],
    [-40, 55, 20],
    [30, 75, 14],
  ]) {
    g.circle(x, y, r).fill(swatch.teal.light);
  }
  if (cracks) {
    g.moveTo(-82, -30);
    for (let i = 0; i <= Math.min(8, cracks * 2); i++) g.lineTo(-80 + i * 20, i % 2 ? 8 : -25);
    g.stroke({ width: 6, color: swatch.teal.line, join: 'round', cap: 'round' });
  }
  return g;
}
