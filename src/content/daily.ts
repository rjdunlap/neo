import { Rng } from '../engine/random';
import { playsByTouch } from '../games/registry';
import type { GameModule } from '../games/types';
import { bandRank, playBand, type Band } from '../progress/bands';
import { levelsInOrder } from '../progress/difficulty';
import type { RoundRecord } from '../progress/save';

/**
 * Today's six (a trial behind `?daily` at the root, the developer's call 2026-10-31): six games chosen for the day from her
 * band, the same six all day for everyone at that band, a new six tomorrow. Nothing is owed: there is no streak, no count
 * across days and nothing missed; every game stays in Explore as before.
 */
export const DAILY_COUNT = 6;
/** How many of a grown-up's six are games made for grown-ups (the rest are early-school games at their hardest). */
export const GROWNUP_FIRST = 2;

export interface DailyPick {
  mod: GameModule;
  /** The band the round plays at (`playBand`). */
  band: Band;
  /** A grown-up's level from the harder end of the ladder; undefined plays her saved level. */
  level?: number;
}

/** The local calendar day, `YYYY-MM-DD`: the six change at her midnight, not UTC's. */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** FNV-1a: a stable 32-bit seed from the day and band. */
export function daySeed(day: string, band: Band): number {
  let h = 0x811c9dc5;
  for (const ch of `${day}|${band}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The games a band's six come from, touch-playable only. A grown-up gets the games made for grown-ups and for early school
 * (played at their hardest levels); anyone else the games for her own band, topped up with younger ones only if there are
 * too few.
 */
export function dailyPool(band: Band, games: readonly GameModule[]): GameModule[] {
  const touch = games.filter((m) => playsByTouch(m));
  if (band === 'grownup') return touch.filter((m) => m.bands.includes('grownup') || m.bands.includes('school'));
  const own = touch.filter((m) => m.bands.includes(band));
  if (own.length >= DAILY_COUNT) return own;
  return [...own, ...touch.filter((m) => !m.bands.includes(band) && m.bands.some((b) => bandRank(b) < bandRank(band)))];
}

/** The harder end of a game's ladder at `band`: its top third in play order, entry levels left out. */
export function hardLevels(mod: GameModule, band: Band): number[] {
  const entries = mod.entryLevels ?? [];
  const order = levelsInOrder(mod.levels(band)).filter((l) => !entries.includes(l));
  if (!order.length) return [mod.levels(band).max];
  return order.slice(Math.floor((order.length * 2) / 3));
}

/**
 * The day's six: a seeded shuffle of the pool, taken so each subject (`region`) appears once before any appears twice.
 * Grown-ups get a seeded level from `hardLevels`.
 */
export function dailySix(day: string, band: Band, games: readonly GameModule[]): DailyPick[] {
  const rng = new Rng(daySeed(day, band));
  const pool = rng.shuffle([...dailyPool(band, games)]);
  const chosen: GameModule[] = [];
  const used = new Set<string>();
  const take = (from: readonly GameModule[], upTo: number) => {
    while (chosen.length < upTo && from.some((m) => !chosen.includes(m))) {
      const fresh = from.find((m) => !chosen.includes(m) && !used.has(m.region));
      const next = fresh ?? from.find((m) => !chosen.includes(m))!;
      // Every subject has had a turn: start the round of subjects again.
      if (!fresh) used.clear();
      chosen.push(next);
      used.add(next.region);
    }
  };
  // A grown-up's six lead with two of the games made for grown-ups, so the day is not all early-school play.
  if (band === 'grownup') take(pool.filter((m) => m.bands.includes('grownup')), GROWNUP_FIRST);
  take(pool, DAILY_COUNT);
  return chosen.map((mod) => {
    const at = playBand(mod.bands, band);
    return { mod, band: at, level: band === 'grownup' ? rng.pick(hardLevels(mod, at)) : undefined };
  });
}

/** She finished a round of this game on `day` (a round's record carries its time): the card shows a tick. */
export const playedOn = (history: readonly RoundRecord[] | undefined, day: string) => !!history?.some((r) => dayKey(new Date(r.at)) === day);
