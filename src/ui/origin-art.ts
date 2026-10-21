import { Container } from 'pixi.js';
import { landmarkFor } from '../art/lands';
import { swatch } from '../art/palette';
import type { Origin } from '../app/App';
import type { ExploreEntry } from '../content/explore';
import { landFor } from '../content/lands';
import { arrowIcon, heartIcon, libraryIcon, meadowIcon, padIcon, tilesIcon } from './icons';

/** Explore's entries at the root (RW08): the name under each card, and its picture (about 60 units across). */
export const ENTRY_NAMES: Record<ExploreEntry, string> = { places: 'Places', favorites: 'Favorites', all: 'All games', family: 'Family play' };

export function entryArt(entry: ExploreEntry): Container {
  switch (entry) {
    case 'places': return meadowIcon();
    case 'favorites': return heartIcon(swatch.pink.fill, true);
    case 'all': return tilesIcon();
    case 'family': return padIcon();
  }
}

/** Fits `art` inside a `size`-unit square centred on (0, 0). */
export function fitArt(art: Container, size: number): Container {
  const b = art.getLocalBounds();
  const s = Math.min(size / Math.max(b.width, 1), size / Math.max(b.height, 1));
  art.scale.set(s);
  art.position.set(-(b.x + b.width / 2) * s, -(b.y + b.height / 2) * s);
  art.eventMode = 'none';
  return art;
}

/**
 * What a result's Back to [origin] shows and says at the root (RW08): the location's landmark, the Explore entry's or the
 * library's picture, and its name. Null for an origin the root does not name (the island's journal keeps Home).
 */
export function originArt(origin: Origin | undefined): { picture: Container; place: string } | null {
  if (origin && 'land' in origin) return { picture: landmarkFor(origin.land), place: landFor(origin.land).name };
  if (origin && 'explore' in origin) return { picture: entryArt(origin.explore), place: ENTRY_NAMES[origin.explore] };
  if (origin && 'library' in origin) return { picture: libraryIcon(), place: 'the library' };
  // At the root a home spot is All games' first page (`placeAtRoot`), where Little surprises' stops come back to.
  if (origin && 'place' in origin) return { picture: entryArt('all'), place: ENTRY_NAMES.all };
  return null;
}

/** The result's Back to [origin] picture (RW08): a white return arrow beside the place's picture, inside a 132-unit button. */
export function backToArt(picture: Container): Container {
  const art = new Container();
  const arrow = arrowIcon(-1, 0xffffff);
  arrow.scale.set(0.8);
  arrow.position.set(-30, 0);
  const pic = fitArt(picture, 64);
  pic.x += 20;
  art.addChild(arrow, pic);
  return art;
}
