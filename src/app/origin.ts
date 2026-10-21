import type { Origin, Routes } from './App';

/** Back to where a game was opened from (a land, a home spot, the journal, the root's library or an Explore page), or to `fallback` when it has no origin. */
export function goToOrigin(go: Routes, origin: Origin | undefined, fallback: () => void) {
  if (origin && 'land' in origin) go.land(origin.land);
  else if (origin && 'place' in origin) go.place(origin.place);
  else if (origin && 'journal' in origin) go.journal();
  else if (origin && 'library' in origin) go.library();
  else if (origin && 'explore' in origin) go.explore(origin.explore, origin.page, origin.others);
  else fallback();
}

/**
 * The root has no age places (RW08 slice 2): there `go.place` and a `{ place }` origin, which Little surprises and a
 * game with no origin use, open All games' first page with her own games, where the mix's picnic blanket stands.
 */
export const placeAtRoot = (go: Routes) => go.explore('all', 0, false);
