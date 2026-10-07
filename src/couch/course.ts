import { courseInfo, type CourseId } from './courses';
import type { CouchId, CouchSave } from './party';

/**
 * Challenge courses on the couch: one run is one round (one sticker, with help or without), scored by
 * total slides. Records stay in the couch save, one set per player, and compare only within a course
 * version and a support category: a run that showed a hint is kept apart from one that did not.
 */
export type Badge = 'finish' | 'minimum';
export const BADGES: readonly Badge[] = ['finish', 'minimum'];

/** What the rules need to know about a course. Built from the game's course data, passed in so tests can vary it. */
export interface CourseSpec {
  id: CourseId;
  game: CouchId;
  version: number;
  boards: number;
  minimum: number;
}
export function courseSpec(id: CourseId): CourseSpec {
  const info = courseInfo(id);
  return { id, game: info.game, version: info.version, boards: info.best.length, minimum: info.minimum };
}

export interface Recent { slides: number; assisted: boolean; at: number }
export interface PlayerRecord {
  runs: number;
  /** Fewest slides in a run that showed no hint, and in one that did. */
  clean: number | null;
  assisted: number | null;
  /** Newest first, at most ten. */
  recent: Recent[];
  badges: Badge[];
}
export interface Run {
  player: 0 | 1;
  /** One value per run, so a stale finish can never settle a different one. */
  token: number;
  /** Tries taken on each finished part (slides on a pond, launches at a cloud), undone slides included. */
  slides: number[];
  /** Tries so far on the part in progress, kept so leaving cannot erase them. */
  attempts: number;
  /** A hint was shown at some point in the run. It stays set. */
  assisted: boolean;
}
export interface Retired { version: number; players: [PlayerRecord, PlayerRecord] }
export interface CourseSave {
  version: number;
  run: Run | null;
  players: [PlayerRecord, PlayerRecord];
  /** Records from earlier versions of this course, kept and never compared. */
  retired: Retired[];
}
export interface Outcome {
  player: 0 | 1;
  total: number;
  minimum: number;
  assisted: boolean;
  /** Slides on each pond. */
  boards: number[];
  /** The best in this run's category before it, if any. */
  previous: number | null;
  /** Beat a previous best (the first finish is not a "new best": it is the mark to beat). */
  improved: boolean;
  /** Badges this run earned for the first time. */
  earned: Badge[];
}

const RECENT_KEEP = 10;
const RETIRED_KEEP = 3;
const MAX_COUNT = 999;
const MAX_SEED = 0x7fffffff;
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};
const count = (v: unknown, max = MAX_COUNT) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
const mark = (v: unknown) => count(v) || null;
/** Slides per finished pond, up to `boards`. The first damaged entry ends the list, so no later pond is mistaken for an earlier one. */
function pondSlides(raw: unknown, boards: number): number[] {
  const out: number[] = [];
  for (const s of (Array.isArray(raw) ? raw : []).slice(0, boards)) {
    const n = count(s);
    if (!n) break;
    out.push(n);
  }
  return out;
}

export const emptyRecord = (): PlayerRecord => ({ runs: 0, clean: null, assisted: null, recent: [], badges: [] });
export const courseDefaults = (spec: CourseSpec): CourseSave => ({ version: spec.version, run: null, players: [emptyRecord(), emptyRecord()], retired: [] });

function repairRecord(raw: unknown): PlayerRecord {
  const v = object(raw);
  return {
    runs: count(v.runs, 9999),
    clean: mark(v.clean),
    assisted: mark(v.assisted),
    recent: (Array.isArray(v.recent) ? v.recent : []).map(object).filter(r => count(r.slides) > 0).slice(0, RECENT_KEEP)
      .map(r => ({ slides: count(r.slides), assisted: r.assisted === true, at: count(r.at, Number.MAX_SAFE_INTEGER) })),
    badges: BADGES.filter(b => Array.isArray(v.badges) && v.badges.includes(b)),
  };
}

const repairPair = (raw: unknown): [PlayerRecord, PlayerRecord] => {
  const v = Array.isArray(raw) ? raw : [];
  return [repairRecord(v[0]), repairRecord(v[1])];
};

function repairRun(raw: unknown, spec: CourseSpec): Run | null {
  const v = object(raw);
  if (!raw || (v.player !== 0 && v.player !== 1)) return null;
  return { player: v.player, token: count(v.token, MAX_SEED) || 1, slides: pondSlides(v.slides, spec.boards), attempts: count(v.attempts), assisted: v.assisted === true };
}

/**
 * Bring stored course data back to a valid shape. A record from another version of the course is
 * retired, not mixed in, and a run in progress on the old boards is dropped with it.
 */
export function repairCourse(raw: unknown, spec: CourseSpec): CourseSave {
  const v = object(raw);
  const out = courseDefaults(spec);
  out.retired = (Array.isArray(v.retired) ? v.retired : []).map(object).filter(r => count(r.version) > 0 && count(r.version) !== spec.version)
    .slice(0, RETIRED_KEEP).map(r => ({ version: count(r.version), players: repairPair(r.players) }));
  const stored = count(v.version);
  if (stored && stored !== spec.version) {
    const players = repairPair(v.players);
    if (players.some(p => p.runs > 0)) out.retired = [{ version: stored, players }, ...out.retired.filter(r => r.version !== stored)].slice(0, RETIRED_KEEP);
    return out;
  }
  out.players = repairPair(v.players);
  out.run = repairRun(v.run, spec);
  return out;
}

/** The course's save, created on first use. */
export function courseOf(save: CouchSave, spec: CourseSpec): CourseSave {
  return save.courses[spec.id] ??= courseDefaults(spec);
}

/** Begin a run for a player, dropping any run left unfinished. */
export function startRun(course: CourseSave, player: 0 | 1, token: number): Run {
  return course.run = { player, token: count(token, MAX_SEED) || 1, slides: [], attempts: 0, assisted: false };
}

/** Keep what the game reports as it changes. Help, once shown, stays on the run. */
export function noteProgress(course: CourseSave, spec: CourseSpec, token: number, p: { slides: readonly number[]; attempts: number; assisted: boolean }): boolean {
  const run = course.run;
  if (!run || run.token !== token) return false;
  run.slides = pondSlides(p.slides, spec.boards);
  run.attempts = count(p.attempts);
  run.assisted = run.assisted || p.assisted;
  return true;
}

/**
 * Settle a finished run once. A stale token, or a run with ponds still to play, settles nothing.
 * Updates the player's best in the right category, their last ten runs and their badges.
 */
export function finishRun(course: CourseSave, spec: CourseSpec, token: number, now = Date.now()): Outcome | null {
  const run = course.run;
  if (!run || run.token !== token || run.slides.length !== spec.boards) return null;
  const total = run.slides.reduce((n, s) => n + s, 0);
  const rec = course.players[run.player];
  const category = run.assisted ? 'assisted' : 'clean';
  const previous = rec[category];
  const improved = previous !== null && total < previous;
  if (previous === null || improved) rec[category] = total;
  rec.runs = Math.min(9999, rec.runs + 1);
  rec.recent = [{ slides: total, assisted: run.assisted, at: count(now, Number.MAX_SAFE_INTEGER) }, ...rec.recent].slice(0, RECENT_KEEP);
  const earned: Badge[] = [];
  if (!rec.badges.includes('finish')) earned.push('finish');
  if (!run.assisted && total <= spec.minimum && !rec.badges.includes('minimum')) earned.push('minimum');
  rec.badges = BADGES.filter(b => rec.badges.includes(b) || earned.includes(b));
  course.run = null;
  return { player: run.player, total, minimum: spec.minimum, assisted: run.assisted, boards: run.slides.slice(), previous, improved, earned };
}

/** Settle a run in the couch save: records, badges and the one sticker that a finished round gives. */
export function completeCourse(save: CouchSave, spec: CourseSpec, token: number, now = Date.now()): Outcome | null {
  const course = save.courses[spec.id];
  const outcome = course && finishRun(course, spec, token, now);
  if (!outcome) return null;
  const old = save.stickers[spec.game];
  save.stickers[spec.game] = { count: (old?.count ?? 0) + 1, seed: count(token, MAX_SEED) || 1 };
  return outcome;
}
