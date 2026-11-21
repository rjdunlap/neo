/**
 * Which games the grown-ups' page lists under This week (U8a R5): first the games she played this week and any game
 * kept on a level, most rounds first; then every game for her age and younger, in the lands' order, plus any game for
 * bigger kids she played this week. Pure: the page passes the games and their stats in.
 */

import { CHALLENGE_KINDS, type ChallengeKind } from '../games/types';

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

/** The challenge kinds in plain words, each after "games" (U8a R6). */
export const KIND_WORDS: Record<ChallengeKind, string> = {
  numbers: 'with numbers',
  words: 'with words and letters',
  logic: 'with patterns and rules',
  space: 'with shapes and building',
  music: 'with music',
  noticing: 'with noticing and remembering',
  hands: 'with aiming and steering',
};

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const say = (n: number) => NUMBER_WORDS[n] ?? String(n);

/** What the page needs to know of a game for R6, beyond its row. */
export interface KindInfo {
  name: string;
  kind?: ChallengeKind;
  /** Its bands include hers, so it is offered to her as it is. */
  forBand: boolean;
  touch: boolean;
  /** Any round in the saved history, this week or before. */
  everPlayed: boolean;
}

/** Fewer rounds than this in a week and the page does not say what the games asked. */
export const TOO_LITTLE = 3;

/**
 * This week's two lines (U8a R6, TotoLogic P4): a sentence counting the games she played by challenge kind, absent in a
 * week with too little play; and one game of a kind she played nothing of, with the reason. `rows` is `weekRows(...).all`
 * (her age's games in the lands' order, then bigger-kids games she played); `week` turns the pick, so it holds all week.
 */
export function weekKinds<G>(
  rows: readonly WeekRow<G>[],
  info: (game: G) => KindInfo,
  week: number,
): { sentence: string | null; untried: { game: G; kind: ChallengeKind; line: string } | null } {
  const played = rows.filter((r) => r.rounds > 0);
  const rounds = played.reduce((t, r) => t + r.rounds, 0);
  const counts = new Map<ChallengeKind, number>();
  for (const r of played) {
    const kind = info(r.game).kind;
    if (kind) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  const order = [...counts].sort(
    ([a, x], [b, y]) => y - x || CHALLENGE_KINDS.indexOf(a) - CHALLENGE_KINDS.indexOf(b),
  );
  const parts = order.map(([kind, n], i) =>
    i === 0 ? `${say(n)} ${n === 1 ? 'game' : 'games'} ${KIND_WORDS[kind]}` : `${say(n)} ${KIND_WORDS[kind]}`,
  );
  const list =
    parts.length < 2
      ? parts.join('')
      : `${parts.slice(0, -1).join(', ')}${parts.length > 2 ? ',' : ''} and ${parts.at(-1)}`;
  const sentence = rounds >= TOO_LITTLE && parts.length ? `This week: ${list}.` : null;

  const turn = Math.max(0, Math.floor(week));
  let untried: { game: G; kind: ChallengeKind; line: string } | null = null;
  for (let k = 0; k < CHALLENGE_KINDS.length && !untried; k++) {
    const kind = CHALLENGE_KINDS[(turn + k) % CHALLENGE_KINDS.length];
    if (counts.has(kind)) continue;
    const pool = rows.filter((r) => {
      const i = info(r.game);
      return r.rounds === 0 && !r.older && i.kind === kind && i.forBand && i.touch;
    });
    if (!pool.length) continue;
    // Games never played come first; the week turns the pick among them.
    const fresh = pool.filter((r) => !info(r.game).everPlayed);
    const from = fresh.length ? fresh : pool;
    const game = from[turn % from.length].game;
    const i = info(game);
    const what = KIND_WORDS[kind].replace(/^with /, '');
    untried = {
      game,
      kind,
      line: `${i.everPlayed ? 'Not played this week' : 'Not played yet'}: ${i.name}. Nothing with ${what} this week.`,
    };
  }
  return { sentence, untried };
}
