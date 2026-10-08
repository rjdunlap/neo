import { courseSpec } from './course';
import { COURSE_IDS, countOf, courseInfo, type CourseId, type CourseInfo } from './courses';
import type { CouchSave } from './party';

/**
 * The puzzle shelf, for one grown-up playing alone: every puzzle at once, nothing to unlock, each with
 * her best and how far it is above par. Today the shelf is the challenge courses, which are fixed boards
 * with a worked-out fewest; new puzzles join it as they are built. Pure, so the standings are tested
 * without a browser.
 */
export interface ShelfEntry {
  id: CourseId;
  /** Her fewest tries in a run that showed no hint, else in one that did, else null. */
  best: number | null;
  /** The best is from a run that showed a hint (there is none without one). */
  helped: boolean;
  /** Par: the fewest tries the whole course can take. */
  minimum: number;
  /** Tries above par, 0 for a perfect run. Null until she has finished. */
  over: number | null;
  runs: number;
  inProgress: boolean;
}

/** Where one player stands on one course. Player 1 is the one who plays alone. */
export function shelfEntry(save: CouchSave, id: CourseId, player: 0 | 1 = 0): ShelfEntry {
  const spec = courseSpec(id), saved = save.courses[id], rec = saved?.players[player];
  const clean = rec?.clean ?? null, assisted = rec?.assisted ?? null;
  const best = clean ?? assisted;
  return { id, best, helped: clean === null && assisted !== null, minimum: spec.minimum, over: best === null ? null : Math.max(0, best - spec.minimum), runs: rec?.runs ?? 0, inProgress: !!saved?.run };
}

/** Every puzzle, gentle ones first, as the shelf shows them. */
export const shelf = (save: CouchSave, player: 0 | 1 = 0): ShelfEntry[] => COURSE_IDS.map(id => shelfEntry(save, id, player));

/** "14 slides · 3 above par (11)", the line under a puzzle on the shelf. */
export function standing(entry: ShelfEntry, info: CourseInfo = courseInfo(entry.id)): string {
  if (entry.best === null || entry.over === null) return `Not finished yet · par ${entry.minimum}`;
  const gap = entry.over === 0 ? 'par: the fewest possible' : `${entry.over} above par (${entry.minimum})`;
  return `${countOf(info, entry.best)} · ${gap}${entry.helped ? ' · with help' : ''}`;
}

/**
 * Whether "Watch the best route" is offered. It shows the answer, so it is never offered in the middle of
 * a run (that would be a hint she did not ask for), only after a run has just finished, or once someone has
 * finished the course and nothing is half-played.
 */
export function canWatchRoute(save: CouchSave, id: CourseId, justFinished = false): boolean {
  if (!courseInfo(id).routes) return false;
  const saved = save.courses[id];
  if (saved?.run) return false;
  return justFinished || !!saved?.players.some(p => p.runs > 0);
}
