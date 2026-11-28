import type { Band } from '../progress/bands';
import type { RoundRecord } from '../progress/save';
import { earnsShells, MAX_BALANCE, type ShellsSave } from './shells';

/**
 * Today's six extras (the progression loop, chunk 32, docs/definitions/progression-loop.md, slice 5): the days a grown-up
 * finished all six, a small shell bonus the first time on each such day, a month calendar with a lantern on those days, and
 * a copyable share line of the day's results. An empty day stays empty: nothing counts a run of days or shows one missed.
 */
export interface SixesSave {
  /** Local days (`dayKey`) on which all six were done, oldest first. */
  days: string[];
}

export const ALL_SIX_BONUS = 25;
/** More than six years of days; the oldest go first. */
export const MAX_SIX_DAYS = 2400;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const emptySixes = (): SixesSave => ({ days: [] });

/** A stored record, repaired: real day strings, each once, in order, bounded (the newest kept). */
export function cleanSixes(raw: unknown): SixesSave {
  const list =
    typeof raw === 'object' && raw !== null && Array.isArray((raw as { days?: unknown }).days)
      ? (raw as { days: unknown[] }).days
      : [];
  const days = [...new Set(list.filter((d): d is string => typeof d === 'string' && DAY.test(d)))].sort();
  return { days: days.slice(-MAX_SIX_DAYS) };
}

/**
 * Records a day on which all six were done. The first time for that day, a band that earns shells gets the bonus (never past
 * the largest balance); again the same day changes nothing. A band that does not earn records nothing.
 */
export function recordAllSix(
  sixes: SixesSave,
  shells: ShellsSave,
  day: string,
  band: Band,
): { sixes: SixesSave; shells: ShellsSave; bonus: number } {
  if (!earnsShells(band) || !DAY.test(day) || sixes.days.includes(day)) return { sixes, shells, bonus: 0 };
  const bonus = Math.min(ALL_SIX_BONUS, MAX_BALANCE - shells.balance);
  return {
    sixes: cleanSixes({ days: [...sixes.days, day] }),
    shells: { ...shells, balance: shells.balance + bonus },
    bonus,
  };
}

/** How a card went today: a round with no misses or hints, a round with some, or no round yet. */
export type SixResult = 'clean' | 'help' | 'none';

export function resultOn(history: readonly RoundRecord[] | undefined, day: string): SixResult {
  const today = (history ?? []).filter((r) => {
    const d = new Date(r.at);
    return keyOf(d.getFullYear(), d.getMonth(), d.getDate()) === day;
  });
  if (!today.length) return 'none';
  return today.some((r) => r.misses === 0 && r.hints === 0) ? 'clean' : 'help';
}

const SQUARE: Record<SixResult, string> = { clean: '🟩', help: '🟨', none: '⬜' };

/**
 * The share line, Wordle-style: the day, then one square per card in card order (green, a round with no misses or hints;
 * yellow, a round with some; white, not played), then how many are done. No game names, so it gives nothing away.
 */
export function shareLine(dateWords: string, results: readonly SixResult[]): string {
  const done = results.filter((r) => r !== 'none').length;
  return `Puddle Island · Today's six · ${dateWords}\n${results.map((r) => SQUARE[r]).join('')} ${done}/${results.length}`;
}

/**
 * A month's calendar, weeks starting on Monday: each row seven cells, a day of the month or null for the padding. `month` is
 * 0 to 11.
 */
export function monthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1).getDay(); // 0 is Sunday
  const lead = (first + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array<null>(lead).fill(null)];
  for (let d = 1; d <= count; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** `YYYY-MM-DD` for a day of a month (0 to 11), as `dayKey` writes it. */
export const keyOf = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
