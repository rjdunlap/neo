import { dailySix, newToday, type DailyPick } from '../content/daily';
import { GAMES } from '../games/registry';
import { store } from '../progress/store';

/**
 * Today's six for the active player (U5a): the one place the page (`DailyScene`) and a daily round's next-of-six tile
 * (`GameScene.showDailyNext`) build the six from the store, so the two never disagree. Reads her band, her pins and which
 * games are new to her today; reads `store.data.games` directly so the pick never creates an empty entry per game.
 */
export function todaysSix(day: string, upright: boolean): DailyPick[] {
  const games = store.data.games;
  return dailySix(
    day,
    store.data.profile.band,
    GAMES,
    (id) => games[id]?.pinned ?? null,
    upright,
    (id) => newToday(games[id], day),
  );
}
