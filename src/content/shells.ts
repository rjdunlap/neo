import type { Band } from '../progress/bands';

/**
 * Shells: the progression loop's currency (chunk 32, docs/definitions/progression-loop.md, slice 2). A finished round on a
 * profile whose band earns them adds a few shells, up to a cap per game per local day, so the easiest game is not farmed.
 * Nothing is ever taken away: the cap counter starts again each day, the balance never shrinks except by spending (a later
 * slice), and help earns the same as no help. Lap to pre-K never earn or see shells; school age waits for its own slice.
 */
export interface ShellsSave {
  balance: number;
  /** The local day (`dayKey`) that `earned` counts, or '' before the first shell. */
  day: string;
  /** Shells each game has earned on `day`. */
  earned: Record<string, number>;
}

export const SHELLS_PER_ROUND = 5;
/** Three rounds' worth per game per day. */
export const SHELLS_PER_GAME_PER_DAY = 15;
export const MAX_BALANCE = 999_999;
/** More than a day's games could ever hold; a damaged save keeps its first entries. */
const MAX_EARNED = 60;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const GAME_ID = /^[a-z0-9-]{1,60}$/;

/** The bands that earn shells now: grown-ups only, until their pacing sets the prices for school age. */
export const earnsShells = (band: Band): boolean => band === 'school' || band === 'grownup';

export const emptyShells = (): ShellsSave => ({ balance: 0, day: '', earned: {} });

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const whole = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;

/** A stored record, repaired: a whole-number balance in range, a real day or '', and well-formed counts under the cap. */
export function cleanShells(raw: unknown): ShellsSave {
  if (!isObj(raw)) return emptyShells();
  const day = typeof raw.day === 'string' && DAY.test(raw.day) ? raw.day : '';
  const earned: Record<string, number> = {};
  if (day && isObj(raw.earned))
    for (const [id, n] of Object.entries(raw.earned)) {
      if (Object.keys(earned).length >= MAX_EARNED) break;
      if (!GAME_ID.test(id)) continue;
      const v = whole(n, SHELLS_PER_GAME_PER_DAY);
      if (v > 0) earned[id] = v;
    }
  return { balance: whole(raw.balance, MAX_BALANCE), day, earned };
}

/**
 * What one finished round earns: the new record and the shells it added (0 at the cap or for a band that does not earn,
 * and then `next` is `save` itself). A new day starts the counts again; it never changes the balance.
 */
export function earnShells(
  save: ShellsSave,
  gameId: string,
  band: Band,
  day: string,
): { next: ShellsSave; shells: number } {
  if (!earnsShells(band) || !GAME_ID.test(gameId) || !DAY.test(day)) return { next: save, shells: 0 };
  const earned = save.day === day ? save.earned : {};
  const soFar = earned[gameId] ?? 0;
  const shells = Math.max(
    0,
    Math.min(SHELLS_PER_ROUND, SHELLS_PER_GAME_PER_DAY - soFar, MAX_BALANCE - save.balance),
  );
  if (shells === 0) return { next: save, shells: 0 };
  return {
    next: { balance: save.balance + shells, day, earned: { ...earned, [gameId]: soFar + shells } },
    shells,
  };
}
