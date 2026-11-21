import { dailySix, newToday, type DailyPick } from '../content/daily';

import { GAMES } from '../games/registry';
import { store } from '../progress/store';

/**
 * Today's six for the active player (U5a): the one place the page (`DailyScene`) and a daily round's next-of-six tile
 * (`GameScene.showDailyNext`) build the six from the store, so the two never disagree. Reads her band, her pins and which
 * games are new to her today; reads `store.data.games` directly so the pick never creates an empty entry per game.
 */
export function todaysSix(day: string, upright: boolean, phone: boolean): DailyPick[] {
  const games = store.data.games;
  return dailySix(
    day,
    store.data.profile.band,
    GAMES,
    (id) => games[id]?.pinned ?? null,
    upright,
    (id) => newToday(games[id], day),
    phone,
  );
}

/**
 * A guest's round (play-first slice 2): the first of the six whose game has a ghost finger, so the how-to card and the
 * finger carry it with the sound off. Null only if none has one, which the rule tests rule out for the guest's bands.
 */
export const firstDemoPick = (picks: readonly DailyPick[]): DailyPick | null =>
  picks.find((p) => p.mod.touchDemo) ?? null;
