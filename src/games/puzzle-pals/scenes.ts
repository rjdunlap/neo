import type { CritterName } from '../../art/critter';
import { grass, swatch } from '../../art/palette';
import type { AnimalSound } from '../../audio/sfx';
import { Rng } from '../../engine/random';

/** What hangs in the sky of a picture. The side it takes is still chosen by the seed. */
export type SkyLight = 'sun' | 'moon' | 'none';

/** One picture to put together: a friend in a little place, with something to say. */
export interface SceneDef {
  /** Stable name. The first six keep the animal's name, so saved stickers keep their pictures. */
  id: string;
  animal: CritterName;
  sound: AnimalSound;
  /** Spoken after the picture is done: "You made {what}!" */
  what: string;
  sky: number;
  ground: number;
  /** The two hills behind the friend. */
  hills: number;
  cloud: number;
  light: SkyLight;
}

const BLUE_SKY = swatch.blue.light;
const GREEN_HILLS = swatch.green.light;

/**
 * The scenes. The first six are the original pictures and must stay first and in this order: a sticker stores only
 * its seed, and `stickerScene` picks from them, so a change here would repaint every sticker she already owns.
 */
export const SCENES: readonly SceneDef[] = [
  { id: 'cow', animal: 'cow', sound: 'moo', what: 'a cow on the farm', sky: BLUE_SKY, ground: grass, hills: GREEN_HILLS, cloud: swatch.white.fill, light: 'sun' },
  { id: 'duck', animal: 'duck', sound: 'quack', what: 'a duck in the pond', sky: BLUE_SKY, ground: swatch.green.light, hills: GREEN_HILLS, cloud: swatch.white.fill, light: 'sun' },
  { id: 'bunny', animal: 'bunny', sound: 'hop', what: 'a bunny in the garden', sky: BLUE_SKY, ground: grass, hills: GREEN_HILLS, cloud: swatch.white.fill, light: 'sun' },
  { id: 'cat', animal: 'cat', sound: 'meow', what: 'a cat at a party', sky: swatch.pink.light, ground: grass, hills: GREEN_HILLS, cloud: swatch.white.fill, light: 'sun' },
  { id: 'bear', animal: 'bear', sound: 'growl', what: 'a bear in the woods', sky: swatch.teal.light, ground: grass, hills: GREEN_HILLS, cloud: swatch.white.fill, light: 'sun' },
  { id: 'dog', animal: 'dog', sound: 'woof', what: 'a dog with a ball', sky: BLUE_SKY, ground: grass, hills: GREEN_HILLS, cloud: swatch.white.fill, light: 'sun' },
  { id: 'pig-mud', animal: 'pig', sound: 'oink', what: 'a pig in the mud', sky: BLUE_SKY, ground: 0xe6d0ae, hills: 0xcfe3b4, cloud: swatch.white.fill, light: 'sun' },
  { id: 'cow-snow', animal: 'cow', sound: 'moo', what: 'a cow in the snow', sky: 0xe3edf8, ground: 0xf7fafd, hills: 0xdce8f4, cloud: swatch.white.fill, light: 'sun' },
  { id: 'bunny-autumn', animal: 'bunny', sound: 'hop', what: 'a bunny in the autumn leaves', sky: swatch.orange.light, ground: 0xf3dcae, hills: 0xe9b97a, cloud: swatch.yellow.light, light: 'sun' },
  { id: 'cat-night', animal: 'cat', sound: 'meow', what: 'a cat at night', sky: 0x2d3a6e, ground: 0x45615f, hills: 0x37506b, cloud: 0x5a6a9a, light: 'moon' },
  { id: 'bear-picnic', animal: 'bear', sound: 'growl', what: 'a bear at a picnic', sky: BLUE_SKY, ground: swatch.green.light, hills: 0xbfe6a8, cloud: swatch.white.fill, light: 'sun' },
  { id: 'dog-rain', animal: 'dog', sound: 'woof', what: 'a dog in the rain', sky: 0xbdc8d8, ground: 0xcadfc2, hills: 0xa5c19c, cloud: 0x7f8aa0, light: 'none' },
];

export type Scene = (typeof SCENES)[number];

/** The pictures stickers and the map icon are drawn from. Never reorder or grow it. */
export const STICKER_SCENES: readonly SceneDef[] = SCENES.slice(0, 6);

/** The scene a saved sticker with this seed shows. */
export const stickerScene = (seed: number): SceneDef => new Rng(seed).pick(STICKER_SCENES);

/** A part of a picture and the box it fills, in picture units, so a test can see what each piece of a puzzle holds. */
export interface Feature {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** How much of a feature falls inside a box. */
export function overlapArea(f: Feature, box: { x: number; y: number; w: number; h: number }): number {
  const w = Math.min(f.x + f.w, box.x + box.w) - Math.max(f.x, box.x);
  const h = Math.min(f.y + f.h, box.y + box.h) - Math.max(f.y, box.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** A feature that fills less than this much of a piece is a sliver, not something to find the piece by (about 1% of a 4 by 3 piece). */
export const SLIVER = 600;

/**
 * What each piece of a grid holds, as the sorted names of the features that fill more than a sliver of it.
 * Two pieces with the same list could not be told apart by what is on them.
 */
export function cellFeatures(features: readonly Feature[], cols: number, rows: number, width: number, height: number): string[][] {
  const out: string[][] = [];
  const cw = width / cols;
  const ch = height / rows;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const box = { x: col * cw, y: row * ch, w: cw, h: ch };
      out.push(features.filter((f) => f.name !== 'friend' && overlapArea(f, box) > SLIVER).map((f) => f.name).sort());
    }
  }
  return out;
}
