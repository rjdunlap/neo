import type { GameModule } from '../games/types';
import { bandRank, type Band } from '../progress/bands';
import { forAgeOrYounger, olderIn, visibleIn, type Land } from './lands';

/**
 * Explore's lists at the root (RW08 slice 1, docs/rework/RW08-CUTOVER.md#slice-1-explores-four-entries): what Favorites
 * holds and how it pages, and her own games for Little surprises and the Arcade. Built from the registry and the lands
 * each time, never from a copied list. Nothing here gates: an older or younger game is only named as such, and still
 * plays at `playBand`.
 */

/**
 * Explore's four entries, in the order they stand (U6b, docs/definitions/one-way-to-browse.md#r1-the-arcade-is-the-one-place-to-browse-games):
 * the Arcade (its own scene) is the one place to browse every game, and Family play goes straight to couch play. At lap
 * and toddler Little surprises' picnic blanket stands first, as a card of its own rather than an entry.
 */
export const EXPLORE_ENTRIES = ['places', 'favorites', 'arcade', 'family'] as const;
export type ExploreEntry = (typeof EXPLORE_ENTRIES)[number];
export const isExploreEntry = (v: unknown): v is ExploreEntry => EXPLORE_ENTRIES.includes(v as ExploreEntry);

/** Cards to a page of games. */
export const PAGE_SIZE = 4;

/**
 * Her games: every land's games for her age and younger, land by land in `LANDS` order and each land's own order (what
 * Little surprises draws from, and the Arcade's order). With `others`, the rest: the games each land's signpost shows
 * (for bigger kids). The two together hold every game once.
 */
export function allGames(
  band: Band,
  games: readonly GameModule[],
  lands: readonly Land[],
  others = false,
): GameModule[] {
  return lands.flatMap((land) => (others ? olderIn(land, band, games) : visibleIn(land, band, games)));
}

/** Her hearted games, newest first (hearts are kept newest last), skipping any ID the registry no longer has. */
export function favoriteGames(favorites: readonly string[], games: readonly GameModule[]): GameModule[] {
  return [...favorites]
    .reverse()
    .map((id) => games.find((g) => g.id === id))
    .filter((g): g is GameModule => !!g);
}

/** Who a game is for, seen from her band: hers (and younger ones she still sees), bigger kids', or only little ones'. */
export function ageOf(mod: Pick<GameModule, 'bands'>, band: Band): 'hers' | 'bigger' | 'little' {
  if (!forAgeOrYounger(mod, band)) return 'bigger';
  return mod.bands.some((b) => bandRank(b) >= bandRank(band)) ? 'hers' : 'little';
}

/** How many pages a list takes; at least one (an empty page says so). */
export const pageCount = (n: number) => Math.max(1, Math.ceil(n / PAGE_SIZE));

/** A page held inside the list's pages (a heart taken back can shorten Favorites under a remembered page). */
export const clampPage = (page: number, n: number) =>
  Math.min(Math.max(0, Math.floor(page) || 0), pageCount(n) - 1);

/** The games on one page. */
export function pageOf<T>(items: readonly T[], page: number): T[] {
  const p = clampPage(page, items.length);
  return items.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
}

/**
 * Where she was in Explore this visit: each entry's page. Kept for the session so Back from a game lands on the same
 * page, and forgotten when a different player is chosen.
 */
export interface ExploreMemory {
  pages: Partial<Record<ExploreEntry, number>>;
}

export const exploreMemory: ExploreMemory = { pages: {} };

export function forgetExplore() {
  exploreMemory.pages = {};
}
