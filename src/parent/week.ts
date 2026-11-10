/**
 * Which games the grown-ups' page lists under This week (U8a R5): first the games she played this week and any game
 * kept on a level, most rounds first; then every game for her age and younger, in the lands' order, plus any game for
 * bigger kids she played this week. Pure: the page passes the games and their stats in.
 */

/** A game's saved stats, as far as this list needs them. */
export interface WeekStats {
  pinned: number | null;
  history: readonly { at: number; seconds: number }[];
}

export interface WeekRow<G> {
  game: G;
  /** Rounds this week (the saved history keeps the last ten per game). */
  rounds: number;
  /** Minutes this week, at least 1 once any round was played. */
  minutes: number;
  pinned: number | null;
  /** A game above her age, here because she played it this week. */
  older: boolean;
}

export function weekRows<G>(
  forAge: readonly G[],
  every: readonly G[],
  statsFor: (game: G) => WeekStats,
  since: number,
): { first: WeekRow<G>[]; all: WeekRow<G>[] } {
  const row = (game: G, older: boolean): WeekRow<G> => {
    const stats = statsFor(game);
    const recent = stats.history.filter((r) => r.at >= since);
    const seconds = recent.reduce((t, r) => t + r.seconds, 0);
    return {
      game,
      rounds: recent.length,
      minutes: recent.length ? Math.max(1, Math.round(seconds / 60)) : 0,
      pinned: stats.pinned,
      older,
    };
  };
  const all = forAge.map((g) => row(g, false));
  for (const g of every) {
    if (forAge.includes(g)) continue;
    const r = row(g, true);
    if (r.rounds) all.push(r);
  }
  // A stable sort keeps the lands' order among games with as many rounds.
  const first = all.filter((r) => r.rounds > 0 || r.pinned !== null).sort((a, b) => b.rounds - a.rounds);
  return { first, all };
}

/** Whether a game's name matches what was typed in the search: trimmed, any case, anywhere in the name. */
export function matchesSearch(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || name.toLowerCase().includes(q);
}
