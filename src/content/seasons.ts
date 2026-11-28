import type { Band } from '../progress/bands';
import { earnsShells, MAX_BALANCE, type ShellsSave } from './shells';

/**
 * Seasons (the progression loop, chunk 32, docs/definitions/progression-loop.md, slice 6): four-week windows, each with the
 * same four goals written out beforehand, each paying shells once when met, and a dated keepsake when all four are met in
 * one season. A season that ends unfinished simply ends: its counts start again at nothing and nothing is lost or shown
 * missed. Only a band that earns shells takes part.
 */
export const SEASON_DAYS = 28;
/** Season 0 starts on Monday 5 January 2026, so every season starts on a Monday. */
const EPOCH = Date.UTC(2026, 0, 5);
const DAY_MS = 86_400_000;

export const SEASON_GOALS = ['sixes', 'games', 'rounds', 'stamps'] as const;
export type SeasonGoal = (typeof SEASON_GOALS)[number];

export const GOAL_TARGET: Record<SeasonGoal, number> = { sixes: 10, games: 12, rounds: 50, stamps: 6 };
export const GOAL_BONUS: Record<SeasonGoal, number> = { sixes: 60, games: 40, rounds: 40, stamps: 40 };

/** Short names for the result line. */
export const SEASON_SHORT: Record<SeasonGoal, string> = {
  sixes: `all six on ${GOAL_TARGET.sixes} days`,
  games: `${GOAL_TARGET.games} games`,
  rounds: `${GOAL_TARGET.rounds} rounds`,
  stamps: `${GOAL_TARGET.stamps} stamps`,
};

export function goalWords(goal: SeasonGoal): string {
  const n = GOAL_TARGET[goal];
  if (goal === 'sixes') return `Finish all six on ${n} days`;
  if (goal === 'games') return `Play ${n} different games`;
  if (goal === 'rounds') return `Finish ${n} rounds`;
  return `Earn ${n} new stamps`;
}

export interface Keepsake {
  season: number;
  at: number;
}

export interface SeasonsSave {
  /** The season the counts below belong to, or -1 before the first round. */
  season: number;
  rounds: number;
  /** Games with a finished round this season. */
  games: string[];
  /** Goals already paid this season. */
  paid: SeasonGoal[];
  /** One per season whose four goals were all met, oldest first. */
  keepsakes: Keepsake[];
}

export const emptySeasons = (): SeasonsSave => ({
  season: -1,
  rounds: 0,
  games: [],
  paid: [],
  keepsakes: [],
});

/** The day index (local calendar day) of a `YYYY-MM-DD` key, counted from the epoch. */
function dayIndex(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY_MS);
}

export const seasonOf = (day: string): number => Math.floor(dayIndex(day) / SEASON_DAYS);

/** A season's first and last days, as `YYYY-MM-DD`. */
export function seasonDays(season: number): { first: string; last: string } {
  const key = (i: number) => new Date(EPOCH + i * DAY_MS).toISOString().slice(0, 10);
  return { first: key(season * SEASON_DAYS), last: key(season * SEASON_DAYS + SEASON_DAYS - 1) };
}

const inSeason = (day: string, season: number) => /^\d{4}-\d{2}-\d{2}$/.test(day) && seasonOf(day) === season;

/** The counts toward each goal now: the season's own rounds and games, all-six days and stamps dated inside it. */
export function progress(
  s: SeasonsSave,
  season: number,
  sixDays: readonly string[],
  stampDays: readonly string[],
): Record<SeasonGoal, number> {
  const same = s.season === season;
  return {
    sixes: sixDays.filter((d) => inSeason(d, season)).length,
    games: same ? s.games.length : 0,
    rounds: same ? s.rounds : 0,
    stamps: stampDays.filter((d) => inSeason(d, season)).length,
  };
}

/** The save moved to `season`: a new season starts its counts and payments again; keepsakes stay. */
function into(s: SeasonsSave, season: number): SeasonsSave {
  return s.season === season ? s : { ...s, season, rounds: 0, games: [], paid: [] };
}

/**
 * Pays every goal now met and not yet paid this season, and adds the season's keepsake once all four are paid. Returns
 * the goals newly paid, their shells (never past the largest balance) and whether a keepsake was added.
 */
export function settle(
  s: SeasonsSave,
  shells: ShellsSave,
  season: number,
  sixDays: readonly string[],
  stampDays: readonly string[],
  at: number,
): { seasons: SeasonsSave; shells: ShellsSave; goals: SeasonGoal[]; bonus: number; keepsake: boolean } {
  const cur = into(s, season);
  const counts = progress(cur, season, sixDays, stampDays);
  const goals = SEASON_GOALS.filter((g) => !cur.paid.includes(g) && counts[g] >= GOAL_TARGET[g]);
  const want = goals.reduce((n, g) => n + GOAL_BONUS[g], 0);
  const bonus = Math.min(want, MAX_BALANCE - shells.balance);
  const paid = [...cur.paid, ...goals];
  const keepsake =
    paid.length === SEASON_GOALS.length &&
    !cur.keepsakes.some((k) => k.season === season) &&
    goals.length > 0;
  return {
    seasons: {
      ...cur,
      paid,
      keepsakes: keepsake ? [...cur.keepsakes, { season, at }].slice(-MAX_KEEPSAKES) : cur.keepsakes,
    },
    shells: { ...shells, balance: shells.balance + bonus },
    goals,
    bonus,
    keepsake,
  };
}

/** A finished round on `day`: counted toward its season (an earning band only), then the season settled. */
export function countRound(
  s: SeasonsSave,
  shells: ShellsSave,
  game: string,
  band: Band,
  day: string,
  sixDays: readonly string[],
  stampDays: readonly string[],
  at: number,
): { seasons: SeasonsSave; shells: ShellsSave; goals: SeasonGoal[]; bonus: number; keepsake: boolean } {
  if (!earnsShells(band) || !/^\d{4}-\d{2}-\d{2}$/.test(day))
    return { seasons: s, shells, goals: [], bonus: 0, keepsake: false };
  const season = seasonOf(day);
  const cur = into(s, season);
  const counted: SeasonsSave = {
    ...cur,
    rounds: Math.min(cur.rounds + 1, MAX_ROUNDS),
    games:
      cur.games.includes(game) || !GAME_ID.test(game) ? cur.games : [...cur.games, game].slice(0, MAX_GAMES),
  };
  return settle(counted, shells, season, sixDays, stampDays, at);
}

const MAX_ROUNDS = 100_000;
const MAX_GAMES = 400;
const MAX_KEEPSAKES = 500;
const GAME_ID = /^[a-z0-9-]{1,60}$/;

const whole = (v: unknown, lo: number, hi: number, otherwise: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : otherwise;

/** A stored record, repaired: a whole season number, bounded counts, known goals once each, dated keepsakes once each. */
export function cleanSeasons(raw: unknown): SeasonsSave {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return emptySeasons();
  const r = raw as Record<string, unknown>;
  const season = whole(r.season, -1, 100_000, -1);
  const games = Array.isArray(r.games)
    ? [...new Set(r.games.filter((g): g is string => typeof g === 'string' && GAME_ID.test(g)))].slice(
        0,
        MAX_GAMES,
      )
    : [];
  const paid = Array.isArray(r.paid) ? SEASON_GOALS.filter((g) => (r.paid as unknown[]).includes(g)) : [];
  const keepsakes: Keepsake[] = [];
  for (const k of Array.isArray(r.keepsakes) ? r.keepsakes : []) {
    if (typeof k !== 'object' || k === null) continue;
    const ks = whole((k as Keepsake).season, 0, 100_000, -1);
    if (ks < 0 || keepsakes.some((x) => x.season === ks)) continue;
    const at = (k as Keepsake).at;
    keepsakes.push({ season: ks, at: typeof at === 'number' && Number.isFinite(at) ? at : 0 });
  }
  keepsakes.sort((a, b) => a.season - b.season);
  return {
    season,
    rounds: season < 0 ? 0 : whole(r.rounds, 0, MAX_ROUNDS, 0),
    games: season < 0 ? [] : games,
    paid: season < 0 ? [] : paid,
    keepsakes: keepsakes.slice(-MAX_KEEPSAKES),
  };
}
