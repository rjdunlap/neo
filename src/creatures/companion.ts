import { Assets, Circle, Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { CRITTERS, type CritterSpec, type Mood } from '../art/critter';
import { swatch, type ColorName } from '../art/palette';
import { makeCreature } from '../art/creatures';
import type { Creature } from '../art/creatures/creature';
import { IllustratedCreature, loadArt, type ArtSet, type Mood as RigMood } from '../art/creatures/illustrated';
import { IllustratedGlider } from '../art/creatures/glider-illustrated';
import { IllustratedRiver } from '../art/creatures/river-illustrated';
import { IllustratedSprout } from '../art/creatures/sprout-illustrated';
import { sfx } from '../audio/sfx';
import type { PetColor } from '../content/world';
import type { Individual } from '../progress/save';
import { store } from '../progress/store';
import { SPECIES, SPECIES_IDS, type SpeciesId } from './species';

/**
 * RW05 slice 1 (docs/rework/CREATURE-COLLECTION.md#the-companion-in-code-one-seam-two-slices): the friend who travels
 * with her, drawn by its species' illustrated rig (RW02b, `src/art/creatures/<species>-illustrated.ts`). The shell, the
 * guide and the island build it with `makeCompanion()`; the ten large-pet games still build a `Critter` from
 * `companionSpec()` until slice 2.
 *
 * The art is loaded once at boot (`loadCollectionArt()`), so building a companion never waits. Without it (a unit test,
 * or a load that failed) a species falls back to its Graphics rig, a portrait to a frozen rig and the egg to `drawEgg`.
 */

/** The prepared collection pictures (`./art/`, see its README), loaded with the species' expression sets. */
const files = import.meta.glob<string>('./art/*.png', { query: '?url', import: 'default', eager: true });
const fileUrl = (name: string) => files[`./art/${name}.png`];

const loaded: { sets: Partial<Record<SpeciesId, ArtSet>>; pictures: Map<string, Texture> } = { sets: {}, pictures: new Map() };

export const EGG_STAGES = ['whole', 'crack', 'open'] as const;
export type EggStage = (typeof EGG_STAGES)[number];
const EGG_FILE: Record<EggStage, string> = { whole: 'egg-sprout', crack: 'egg-sprout-crack', open: 'egg-sprout-open' };

/** Loads every species' rig art, the portraits, the card paper and the sprout's egg. Never throws: what fails falls back. */
export async function loadCollectionArt(): Promise<void> {
  const pictures = [...SPECIES_IDS.map((s) => `${s}-portrait`), 'card-paper', ...Object.values(EGG_FILE)];
  await Promise.all([
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

/** The mood a scene asks for, as a rig shows it: the rigs have no singing face, so a song shows as happy. */
const RIG_MOOD: Record<Mood, RigMood> = { happy: 'happy', surprised: 'surprised', sing: 'happy', sleepy: 'sleepy', sad: 'sad', calm: 'calm' };

/** A pale wash of her chosen colour over the illustration, none when it is the species' own colour. */
export function tintFor(species: SpeciesId, color: PetColor): number {
  if (color === SPECIES[species].color) return 0xffffff;
  const c = swatch[color as ColorName].fill;
  const mix = (shift: number) => Math.round(255 + (((c >> shift) & 0xff) - 255) * 0.4);
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}

/** Plays a species' chirp: its two or three pentatonic steps, one after another. */
export function chirp(species: SpeciesId) {
  SPECIES[species].chirp.forEach((step, i) => {
    if (i === 0) sfx.chirp(step);
    else setTimeout(() => sfx.chirp(step), i * 110);
  });
}

/**
 * The companion as a scene draws it: feet on (0, 0), about pip-sized at scale 1, with the surface the shell and the
 * games' guide use (`poke`, `hop`, `cheer`, `setMood`, `currentMood`). The hop and its squash ride on an outer body,
 * because each rig poses its own craft every frame.
 */
export class Companion extends Container {
  readonly species: SpeciesId;
  /** The individual drawn, or null for the stand-in sprout before her first friend. */
  readonly id: string | null;
  readonly rig: Creature;
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

  constructor(who: Pick<Individual, 'species' | 'look'> & { id?: string | null }, art: ArtSet | undefined = loaded.sets[who.species]) {
    super();
    this.species = who.species;
    this.id = who.id ?? null;
    this.rig = art ? illustrated(who.species, art) : makeCreature(who.species);
    const fit = FIT[who.species];
    this.rig.scale.set(fit.scale);
    this.rig.y = -fit.lift;
    if (this.rig instanceof IllustratedCreature) this.rig.mesh.tint = tintFor(who.species, who.look.color);
    const t = this.rig.touch;
    this.touch = { x: t.x * fit.scale, y: t.y * fit.scale - fit.lift, r: t.r * fit.scale };
    this.body.addChild(this.rig);
    this.addChild(this.body);
  }

  /** A body-centred hit circle, `grow` units larger than the body. */
  touchArea(grow = 0): Circle {
    return new Circle(this.touch.x, this.touch.y, this.touch.r + grow);
  }

  /** Adds something that rides along with the body (it hops and squashes with it). */
  attach(child: Container) {
    this.body.addChild(child);
  }

  /** The species' touch reaction, a surprised face and its chirp. */
  poke() {
    this.rig.poke();
    this.squashV += 3;
    chirp(this.species);
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
    this.body.y = this.hopY;
    this.body.scale.set(1 + s, 1 - s);
    this.rig.update(dt);
  }
}

function illustrated(species: SpeciesId, art: ArtSet): IllustratedCreature {
  if (species === 'sprout') return new IllustratedSprout(art);
  if (species === 'river') return new IllustratedRiver(art);
  return new IllustratedGlider(art);
}

/** Who stands in before her first friend: a teal sprout, which is what the egg hatches. */
const STAND_IN = { species: 'sprout', look: { color: SPECIES.sprout.color } } as const;

/** The active profile's companion, or null before the first friend hatches. */
export const companion = (): Individual | null => store.companion;

/** Draws the companion (or the stand-in sprout before her first friend). */
export function makeCompanion(): Companion {
  return new Companion(companion() ?? STAND_IN);
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
export function makePortrait(who: Pick<Individual, 'species' | 'look'>, size: number): Container {
  const card = new Container();
  const paper = loaded.pictures.get('card-paper');
  const tone = swatch[who.look.color as ColorName];
  if (paper) {
    const p = new Sprite(paper);
    p.anchor.set(0.5);
    p.width = p.height = size;
    p.tint = tone.light;
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
    f.tint = tintFor(who.species, who.look.color);
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
