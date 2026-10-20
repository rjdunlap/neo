import { Assets, Circle, ColorMatrixFilter, Container, Graphics, Rectangle, Sprite, type Texture } from 'pixi.js';
import { CRITTERS, type CritterSpec, type Mood } from '../art/critter';
import { swatch, type ColorName } from '../art/palette';
import { makeCreature } from '../art/creatures';
import type { Creature } from '../art/creatures/creature';
import { IllustratedCreature, loadArt, type ArtSet, type Mood as RigMood } from '../art/creatures/illustrated';
import { GLIDER_WEAR, IllustratedGlider } from '../art/creatures/glider-illustrated';
import { IllustratedRiver, RIVER_WEAR } from '../art/creatures/river-illustrated';
import { IllustratedSprout, SPROUT_WEAR } from '../art/creatures/sprout-illustrated';
import { changeWorn, SLOT, type WearSlot } from '../art/creatures/wear-slots';
import { fileOf, fits, loadWearables, wearItem, WEARABLES, type ItemTextures, type WearableId, type WearTables } from '../art/creatures/wearables';
import { sfx } from '../audio/sfx';
import type { PetColor } from '../content/world';
import type { Individual } from '../progress/save';
import { store } from '../progress/store';
import { ART_OF, creaturePoint, PARTS, type PartName } from './parts';
import { SPECIES, SPECIES_IDS, type SpeciesId } from './species';

/**
 * RW05 slice 1 (docs/rework/CREATURE-COLLECTION.md#the-companion-in-code-one-seam-two-slices): the friend who travels
 * with her, drawn by its species' illustrated rig (RW02b, `src/art/creatures/<species>-illustrated.ts`). The shell, the
 * guide and the island build it with `makeCompanion()`. Slice 2 gives it the surface the large-pet games need
 * (`CompanionRig`: named parts, `spin`, `wiggle`, a body bounds); a game builds one with `ctx.companion()`, and the games
 * not yet moved still build a `Critter` from `companionSpec()`.
 *
 * The art is loaded once at boot (`loadCollectionArt()`), so building a companion never waits. Without it (a unit test,
 * or a load that failed) a species falls back to its Graphics rig, a portrait to a frozen rig and the egg to `drawEgg`.
 */

/** The prepared collection pictures (`./art/`, see its README), loaded with the species' expression sets. */
const files = import.meta.glob<string>('./art/*.png', { query: '?url', import: 'default', eager: true });
const fileUrl = (name: string) => files[`./art/${name}.png`];

const loaded: { sets: Partial<Record<SpeciesId, ArtSet>>; pictures: Map<string, Texture>; items: ItemTextures } = { sets: {}, pictures: new Map(), items: {} };

/** Where each wearable sits on each species (RW06), from the rigs' own tables. */
export const WEAR: WearTables = { sprout: SPROUT_WEAR, river: RIVER_WEAR, glider: GLIDER_WEAR };

/** The items a species can wear, in the wardrobe's order: its misfits are never offered. */
export const wearableBy = (species: SpeciesId): WearableId[] => WEARABLES.filter((w) => fits(WEAR[species][w]));

export const EGG_STAGES = ['whole', 'crack', 'open'] as const;
export type EggStage = (typeof EGG_STAGES)[number];
const EGG_FILE: Record<EggStage, string> = { whole: 'egg-sprout', crack: 'egg-sprout-crack', open: 'egg-sprout-open' };

/** Loads every species' rig art, the portraits, the card paper, the sprout's egg and the wearables. Never throws: what fails falls back (an item that failed is not drawn). */
export async function loadCollectionArt(): Promise<void> {
  const pictures = [...SPECIES_IDS.map((s) => `${s}-portrait`), 'card-paper', ...Object.values(EGG_FILE)];
  await Promise.all([
    loadWearables().then(
      (items) => void (loaded.items = items),
      (e) => console.warn('Could not load the wearables', e),
    ),
    ...SPECIES_IDS.map(async (s) => {
      try {
        loaded.sets[s] = await loadArt(s);
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
const RIG_MOOD: Record<Mood, RigMood> = { happy: 'happy', surprised: 'surprised', sing: 'happy', sleepy: 'sleepy', sad: 'sad', calm: 'calm' };

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
  const turn = hueOf(swatch[color as ColorName].fill) - hueOf(swatch[SPECIES[species].color as ColorName].fill);
  return ((turn % 360) + 540) % 360 - 180;
}

/** Turns a picture to her chosen colour; nothing (and no filter) for the species' own. */
export function recolor(node: Container, species: SpeciesId, color: PetColor) {
  const turn = hueTurn(species, color);
  if (turn === 0) {
    node.filters = [];
    return;
  }
  // At the screen's own resolution: a filter's default of 1 would soften the art on a 2× iPad.
  const f = new ColorMatrixFilter({ resolution: 'inherit', antialias: 'inherit' });
  f.hue(turn, false);
  node.filters = [f];
  node.once('destroyed', () => f.destroy());
}

/** Half way from white to a colour. */
const halfway = (rgb: number) => [16, 8, 0].reduce((n, shift) => n | (Math.round((255 + ((rgb >> shift) & 0xff)) / 2) << shift), 0);

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
  bounds(): Rectangle;
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
  private hopV = 0;
  private squash = 0;
  private squashV = 0;

  private spinT = -1;
  private wiggleT = -1;
  private readonly parts = new Map<PartName, Container[]>();

  private shown: WearableId[] = [];
  /** Slots this companion never draws, though they stay listed in `worn` (the guide's `held`). */
  private readonly leaveOff: readonly WearSlot[];

  constructor(
    who: { species: SpeciesId; look: { color: PetColor; worn?: readonly WearableId[] }; id?: string | null },
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
    if (this.rig instanceof IllustratedCreature) recolor(this.rig.mesh, who.species, who.look.color);
    const t = this.rig.touch;
    this.touch = { x: t.x * fit.scale, y: t.y * fit.scale - fit.lift, r: t.r * fit.scale };
    this.body.addChild(this.rig);
    this.addChild(this.body);
    this.dress(who.look.worn ?? []);
  }

  /** What it has on, as saved (RW06), in the order put on. A misfit for its species is listed but not drawn. */
  get worn(): readonly WearableId[] {
    return this.shown;
  }

  /**
   * Changes what it wears to `worn`: what is no longer listed comes off first, then what is new goes on. The Graphics
   * fallback rig wears nothing (`wearItem` dresses illustrated rigs only), nor does an item whose texture failed.
   */
  dress(worn: readonly WearableId[]) {
    const next = [...worn];
    if (this.rig instanceof IllustratedCreature) {
      const table = WEAR[this.species];
      for (const w of this.shown) if (!next.includes(w)) wearItem(this.rig, table, w, null);
      for (const w of next) {
        const t = loaded.items[fileOf(w)];
        if (!this.shown.includes(w) && t && !this.leaveOff.includes(SLOT[w])) wearItem(this.rig, table, w, t);
      }
    }
    this.shown = next;
  }

  /** Puts one item on (taking off whatever shares its slot) or takes it off. */
  wear(item: WearableId, on: boolean) {
    this.dress(changeWorn(this.shown, item, on));
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

  bounds(): Rectangle {
    const b = bodyBox(this.species);
    return new Rectangle(b.x, b.y, b.width, b.height);
  }

  spin() {
    this.spinT = 0;
  }

  wiggle() {
    this.wiggleT = 0;
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
    this.body.y = this.hopY;
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
const STAND_IN = { species: 'sprout', look: { color: SPECIES.sprout.color, worn: [] } } as const;

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
 * The ten large-pet games' stand-in until slice 2: today's pip, in the companion's colour. A glider's child sees a
 * lavender pip in Splish Splash; the verification entry names it.
 */
export function companionSpec(): CritterSpec {
  return { ...CRITTERS.pip, color: companion()?.look.color ?? 'teal' };
}

/**
 * A collection card's picture: the species' portrait over the card paper, the paper washed with her colour. `size` is
 * the card's side in units. A still picture, so a card never keeps a live rig. Without the art, a frozen rig.
 */
export function makePortrait(who: Pick<Individual, 'species'> & { look: { color: PetColor } }, size: number): Container {
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
    card.addChild(new Graphics().roundRect(-size / 2, -size / 2, size, size, size * 0.16).fill(tone.light).stroke({ width: 5, color: tone.line }));
  }
  const face = loaded.pictures.get(`${who.species}-portrait`);
  if (face) {
    const f = new Sprite(face);
    f.anchor.set(0.5);
    const room = size * 0.8;
    f.scale.set(Math.min(room / face.width, room / face.height));
    recolor(f, who.species, who.look.color);
    card.addChild(f);
  } else {
    const c = new Companion(who, undefined);
    c.alive = false;
    c.rig.alive = false;
    c.scale.set((size * 0.75) / 300);
    c.y = size * 0.35;
    card.addChild(c);
  }
  return card;
}

/**
 * The sprout's egg at a stage (R08 whole, R18 crack and open), centred on (0, 0) at about the old drawn egg's size
 * (200 × 260). Each stage was cut on its own, so they are placed by the source origin each recorded (`./art/README.md`):
 * the open stage's lifted cap makes it taller, and its bottom edge is the same.
 */
export function makeEgg(stage: EggStage): Container {
  const t = loaded.pictures.get(EGG_FILE[stage]);
  if (!t) return drawEgg(new Graphics(), stage === 'whole' ? 0 : 4);
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
export const EGG = { scale: 0.5, bottom: 134, origins: { whole: [189, 107], crack: [189, 107], open: [189, 26] } as Record<EggStage, [number, number]>, files: EGG_FILE };

/** The drawn egg: the fallback when the art did not load. */
export function drawEgg(g: Graphics, cracks = 0): Graphics {
  g.clear().ellipse(0, 0, 100, 130).fill(swatch.white.fill).stroke({ width: 7, color: swatch.teal.line });
  for (const [x, y, r] of [[-35, -60, 18], [38, -20, 22], [-40, 55, 20], [30, 75, 14]]) {
    g.circle(x, y, r).fill(swatch.teal.light);
  }
  if (cracks) {
    g.moveTo(-82, -30);
    for (let i = 0; i <= Math.min(8, cracks * 2); i++) g.lineTo(-80 + i * 20, i % 2 ? 8 : -25);
    g.stroke({ width: 6, color: swatch.teal.line, join: 'round', cap: 'round' });
  }
  return g;
}
