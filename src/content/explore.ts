import type { GameModule } from '../games/types';
import { bandRank, type Band } from '../progress/bands';
import { forAgeOrYounger, olderIn, visibleIn, type Land } from './lands';

/**
 * Explore's lists at the root (RW08 slice 1, docs/rework/RW08-CUTOVER.md#slice-1-explores-four-entries): what All games
 * and Favorites hold and how they page. Built from the registry and the lands each time, never from a copied list.
 * Nothing here gates: an older or younger game is only named as such, and still plays at `playBand`.
 */

/** Explore's four entries, in the order they stand. */
export const EXPLORE_ENTRIES = ['places', 'favorites', 'all', 'family'] as const;
export type ExploreEntry = (typeof EXPLORE_ENTRIES)[number];
export const isExploreEntry = (v: unknown): v is ExploreEntry => EXPLORE_ENTRIES.includes(v as ExploreEntry);

/** Cards to a page of games (the Other ages signpost counts as one). */
export const PAGE_SIZE = 4;

/**
 * All games: every land's games for her age and younger, land by land in `LANDS` order and each land's own order.
 * With `others`, the rest: the games each land's signpost shows (for bigger kids). The two together hold every game once.
 */
export function allGames(band: Band, games: readonly GameModule[], lands: readonly Land[], others = false): GameModule[] {
  return lands.flatMap((land) => (others ? olderIn(land, band, games) : visibleIn(land, band, games)));
}

/** Whether All games has an Other ages signpost: only when there is something on the other side (never at grown-up). */
export const hasOthers = (band: Band, games: readonly GameModule[], lands: readonly Land[]) => allGames(band, games, lands, true).length > 0;

/** Her hearted games, newest first (hearts are kept newest last), skipping any ID the registry no longer has. */
export function favoriteGames(favorites: readonly string[], games: readonly GameModule[]): GameModule[] {
  return [...favorites].reverse().map((id) => games.find((g) => g.id === id)).filter((g): g is GameModule => !!g);
}

/** Who a game is for, seen from her band: hers (and younger ones she still sees), bigger kids', or only little ones'. */
export function ageOf(mod: Pick<GameModule, 'bands'>, band: Band): 'hers' | 'bigger' | 'little' {
  if (!forAgeOrYounger(mod, band)) return 'bigger';
  return mod.bands.some((b) => bandRank(b) >= bandRank(band)) ? 'hers' : 'little';
}

/** One card on a page: a game, or the signpost that turns All games between hers and the other ages. */
export type PageCard<T> = { game: T } | { signpost: true };

/** How many pages a list takes, with room for a signpost as its last card; at least one (an empty page says so). */
export const pageCount = (n: number, signpost = false) => Math.max(1, Math.ceil((n + (signpost ? 1 : 0)) / PAGE_SIZE));

/** A page held inside the list's pages (a heart taken back can shorten Favorites under a remembered page). */
export const clampPage = (page: number, n: number, signpost = false) => Math.min(Math.max(0, Math.floor(page) || 0), pageCount(n, signpost) - 1);

/** The cards on one page, the signpost last on the last page. */
export function pageOf<T>(items: readonly T[], page: number, signpost = false): PageCard<T>[] {
  const cards: PageCard<T>[] = items.map((game) => ({ game }));
  if (signpost) cards.push({ signpost: true });
  const p = clampPage(page, items.length, signpost);
  return cards.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
}

/**
 * Where she was in Explore this visit: the entry, each entry's page and whether All games shows the other ages. Kept
 * for the session so Back from a game lands on the same page, and forgotten when a different player is chosen.
 */
export interface ExploreMemory {
  pages: Partial<Record<ExploreEntry, number>>;
  others: boolean;
}

export const exploreMemory: ExploreMemory = { pages: {}, others: false };

export function forgetExplore() {
  exploreMemory.pages = {};
  exploreMemory.others = false;
}
