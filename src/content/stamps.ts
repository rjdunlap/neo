import type { Band } from '../progress/bands';
import { levelsInOrder, type LevelRange } from '../progress/difficulty';
import { earnsShells, MAX_BALANCE, type ShellsSave } from './shells';

/**
 * Stamps: the progression loop's named goals (chunk 32, docs/definitions/progression-loop.md, slice 3). Each grown-up game
 * has up to four, read from its grown-up ladder, each written out before it is earned, earned once by a round finished
 * from now on (old round history never counts), and paying a one-time shell bonus. Help counts for every stamp but
 * "clean", whose whole point is a round with no misses or hints.
 */
export const STAMP_KINDS = ['first', 'middle', 'top', 'clean'] as const;
export type StampKind = (typeof STAMP_KINDS)[number];

export const STAMP_BONUS: Record<StampKind, number> = { first: 10, middle: 20, top: 30, clean: 40 };

export interface Stamp {
  /** `<game id>:<kind>`. */
  id: string;
  at: number;
}

/** One goal of a game: what it asks, and the level it names (none for "first"). */
export interface StampGoal {
  kind: StampKind;
  level: number | null;
}

/** Room for every grown-up game's four stamps, with space for many more games. */
export const MAX_STAMPS = 600;
const GAME_ID = /^[a-z0-9-]{1,60}$/;

export const stampId = (game: string, kind: StampKind) => `${game}:${kind}`;

/**
 * A game's goals at a band's ladder (easiest first): finish any round; finish the middle level or a harder one; finish the
 * top level; finish the top level with no misses and no hints. A ladder of two has no middle; a ladder of one has only the
 * first round and the clean round.
 */
export function goalsFor(range: LevelRange): StampGoal[] {
  const ladder = levelsInOrder(range);
  const top = ladder[ladder.length - 1];
  const goals: StampGoal[] = [{ kind: 'first', level: null }];
  if (ladder.length >= 3) goals.push({ kind: 'middle', level: ladder[Math.floor((ladder.length - 1) / 2)] });
  if (ladder.length >= 2) goals.push({ kind: 'top', level: top });
  goals.push({ kind: 'clean', level: top });
  return goals;
}

/** Whether a finished round meets a goal on that ladder. */
function meets(goal: StampGoal, range: LevelRange, level: number, misses: number, hints: number): boolean {
  if (goal.kind === 'first') return true;
  const ladder = levelsInOrder(range);
  const at = ladder.indexOf(level);
  if (at < 0) return false;
  if (goal.kind === 'middle') return at >= ladder.indexOf(goal.level!);
  if (goal.kind === 'top') return level === goal.level;
  return level === goal.level && misses === 0 && hints === 0;
}

/** The stamps a finished round earns that are not yet held, in goal order. Only a band that earns shells earns stamps (for now). */
export function newStamps(
  held: readonly Stamp[],
  game: string,
  band: Band,
  range: LevelRange,
  round: { level: number; misses: number; hints: number },
): StampKind[] {
  if (!earnsShells(band) || !GAME_ID.test(game)) return [];
  return goalsFor(range)
    .filter((g) => meets(g, range, round.level, round.misses, round.hints))
    .map((g) => g.kind)
    .filter((k) => !held.some((s) => s.id === stampId(game, k)));
}

/** The stamps added and their bonus shells on the balance (never past the largest balance). */
export function awardStamps(
  held: readonly Stamp[],
  shells: ShellsSave,
  game: string,
  kinds: readonly StampKind[],
  at: number,
): { stamps: Stamp[]; shells: ShellsSave; bonus: number } {
  const fresh = kinds.filter((k) => !held.some((s) => s.id === stampId(game, k)));
  const stamps = [...held, ...fresh.map((k) => ({ id: stampId(game, k), at }))].slice(0, MAX_STAMPS);
  const added = stamps.length - held.length;
  const want = fresh.slice(0, added).reduce((n, k) => n + STAMP_BONUS[k], 0);
  const bonus = Math.min(want, MAX_BALANCE - shells.balance);
  return { stamps, shells: { ...shells, balance: shells.balance + bonus }, bonus };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A stored list, repaired: well-formed ids of known kinds, one each (the first kept), bounded. */
export function cleanStamps(raw: unknown): Stamp[] {
  if (!Array.isArray(raw)) return [];
  const out: Stamp[] = [];
  for (const r of raw) {
    if (out.length >= MAX_STAMPS) break;
    if (!isObj(r) || typeof r.id !== 'string') continue;
    const cut = r.id.lastIndexOf(':');
    const game = r.id.slice(0, cut);
    const kind = r.id.slice(cut + 1);
    if (cut < 1 || !GAME_ID.test(game) || !STAMP_KINDS.some((k) => k === kind)) continue;
    if (out.some((s) => s.id === r.id)) continue;
    out.push({ id: r.id, at: typeof r.at === 'number' && Number.isFinite(r.at) ? r.at : 0 });
  }
  return out;
}

/** The words for a goal, for the result and the stamps page: a level's number and what it plays like. */
export function stampLabel(goal: StampGoal, describe: (level: number) => string): string {
  if (goal.kind === 'first') return 'Finish a round';
  const what = describe(goal.level!);
  const named = what ? `level ${goal.level} (${what})` : `level ${goal.level}`;
  if (goal.kind === 'middle') return `Finish ${named} or harder`;
  if (goal.kind === 'top') return `Finish the top level, ${named}`;
  return `Finish the top level with no misses or hints`;
}

/** Short names for the result line. */
export const STAMP_SHORT: Record<StampKind, string> = {
  first: 'First round',
  middle: 'Halfway up',
  top: 'Top level',
  clean: 'Clean top level',
};
