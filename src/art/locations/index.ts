import { Assets, Sprite, type Texture } from 'pixi.js';
import { LAND_IDS, type LandId } from '../../content/lands';

/**
 * Location pictures (RW14 slice 4, docs/rework/POLISH.md): `<land-id>.webp` is a location's illustrated backdrop and
 * `<land-id>-card.webp` its Places card, both prepared by `scripts/art/import-inbox.mjs` (see README.md here). A location
 * finds its picture by name, so a new backdrop needs only the import script. A location without one, or whose picture
 * failed to load, keeps its code-drawn scenery, and `classic/` never loads them.
 */

/** The picture's size, as R23 and R26 ask for it. */
export const PICTURE = { w: 1536, h: 1024 };
/** Where each picture's ground begins, in its own pixels; the batch prompt asks for about 38% of the height. */
const HORIZON: Partial<Record<LandId, number>> = { 'rainbow-meadow': 395 };
export const horizonOf = (id: LandId) => HORIZON[id] ?? Math.round(PICTURE.h * 0.38);

/** The land IDs a folder's file names give, split into backdrops and cards; a name that is not a land is returned as stray. */
export function locationFiles(paths: string[]): { pictures: Map<LandId, string>; cards: Map<LandId, string>; stray: string[] } {
  const pictures = new Map<LandId, string>();
  const cards = new Map<LandId, string>();
  const stray: string[] = [];
  for (const path of paths) {
    const m = /([a-z-]+?)(-card)?\.webp$/.exec(path.split('/').pop() ?? '');
    const id = m?.[1] as LandId | undefined;
    if (!m || !id || !(LAND_IDS as readonly string[]).includes(id)) stray.push(path);
    else (m[2] ? cards : pictures).set(id, path);
  }
  return { pictures, cards, stray };
}

const urls = import.meta.glob<string>('./*.webp', { query: '?url', import: 'default', eager: true });
export const FILES = locationFiles(Object.keys(urls));

const loaded = new Map<string, Texture>();

/** Loads every location picture and card, at the root's boot. Never throws: a file that fails leaves its location code-drawn. */
export async function loadLocationArt(): Promise<void> {
  await Promise.all(
    [...FILES.pictures.values(), ...FILES.cards.values()].map(async (path) => {
      try {
        loaded.set(path, await Assets.load<Texture>(urls[path]));
      } catch (e) {
        console.warn(`Could not load ${path}`, e);
      }
    }),
  );
}

/** A location's loaded picture, or null (none, not loaded yet, or `classic/`). */
export const locationPicture = (id: LandId): Texture | null => loaded.get(FILES.pictures.get(id) ?? '') ?? null;
/** A location's loaded Places card, or null. */
export const locationCard = (id: LandId): Texture | null => loaded.get(FILES.cards.get(id) ?? '') ?? null;

/**
 * Where the picture goes so that its painted horizon lies on the scene's `ground` line (where `landLayout` puts the spots)
 * and it still covers the whole view: centred across, cropping the sides or the sky in the spare dimension.
 */
export function pictureFit(view: { w: number; h: number }, ground: number, horizon: number): { x: number; y: number; scale: number } {
  const scale = Math.max(view.w / PICTURE.w, ground / horizon, (view.h - ground) / (PICTURE.h - horizon));
  return { x: view.w / 2, y: ground - horizon * scale, scale };
}

/** A location's picture as a sprite anchored at its top-centre (place it with `pictureFit`), or null without one. */
export function pictureSprite(id: LandId): Sprite | null {
  const tex = locationPicture(id);
  if (!tex) return null;
  const s = new Sprite(tex);
  s.anchor.set(0.5, 0);
  s.eventMode = 'none';
  return s;
}

/** Fits a picture sprite to the view with its horizon on `ground` (`pictureFit` is in the picture's 1536 × 1024 units). */
export function placePicture(s: Sprite, id: LandId, view: { w: number; h: number }, ground: number) {
  const fit = pictureFit(view, ground, horizonOf(id));
  s.position.set(fit.x, fit.y);
  s.scale.set(fit.scale * (PICTURE.h / s.texture.height));
}
