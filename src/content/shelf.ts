/**
 * The child's island: which games are still new to her, and the shelf of games she has hearted.
 * Neither gates anything. A game is always playable, a heart can be taken back, and nothing here
 * expires, rotates or asks for a visit.
 */

/** How many hearted games stand on one place's shelf. */
export const SHELF_SLOTS = 5;
/** How many hearts the save keeps. A new heart on a full list lets the oldest one go. */
export const FAVORITES_MAX = 12;
/** Longest game ID kept from a restored save. */
export const ID_MAX = 60;

/** A game is new until one round of it has been finished (with any help), in any place. */
export function isNew(games: Readonly<Record<string, { plays: number }>>, id: string): boolean {
  return !((games[id]?.plays ?? 0) > 0);
}

/** Whether any of these games is still new. */
export function anyNew(games: Readonly<Record<string, { plays: number }>>, ids: readonly string[]): boolean {
  return ids.some((id) => isNew(games, id));
}

/** Hearts a game, or takes the heart back. Hearting again moves nothing: it only adds at the end. */
export function toggleFavorite(favorites: readonly string[], id: string): string[] {
  if (favorites.includes(id)) return favorites.filter((f) => f !== id);
  return [...favorites, id].slice(-FAVORITES_MAX);
}

/** The hearts a restored or hand-edited save may keep: short unique strings, newest last, bounded. */
export function cleanFavorites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const v of raw) if (typeof v === 'string' && v.length > 0 && v.length <= ID_MAX) seen.add(v);
  return [...seen].slice(-FAVORITES_MAX);
}

/** The shelf for a place: its hearted games (in the order they were hearted), at most `slots`, newest kept. */
export function shelfFor(favorites: readonly string[], available: readonly string[], slots = SHELF_SLOTS): string[] {
  const here = new Set(available);
  return favorites.filter((f) => here.has(f)).slice(-slots);
}
