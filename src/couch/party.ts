import { Rng } from '../engine/random';
import type { RoundResult } from '../games/types';
import { COUCH_INFO } from './catalog';
import { courseSpec, repairCourse, type CourseSave } from './course';
import { isCourseId, type CourseId } from './courses';
import { repairSettings, settingsDefaults, type CouchSettings } from './settings';

export const COUCH_IDS = ['penguin-slide', 'bouncy-launch', 'bounce-back', 'memory-match', 'rhythm-neighbors', 'light-lab', 'secret-code', 'peg-garden', 'bumper-garden', 'pattern-train', 'egg-catch', 'robot-path', 'frog-hop', 'sink-float', 'sudoku-garden', 'lantern-lights', 'picture-logic'] as const;
export type CouchId = typeof COUCH_IDS[number];
export const STOPS = 6;
/** Together: shared lanterns. Face-off: the same six stops, with a winner at each. */
export type TripMode = 'together' | 'faceoff';
/** Who won a face-off stop: player 0 or 1, a tie (both score), or both as a team. */
export type StopWinner = 0 | 1 | 'tie' | 'team';
export interface CouchRound extends RoundResult {
  id: CouchId;
  seed: number;
  level: number;
  /** Face-off stops on their own boards or one shared board: [player 1, player 2]. */
  scores?: [number, number];
  winner?: StopWinner;
}
/** A face-off stop on separate boards: the first player's finished turn, kept until the second has played. */
export interface Turn { score: number; misses: number; hints: number }
export interface Party {
  seed: number;
  rounds: CouchRound[];
  selected: CouchId | null;
  mode: TripMode;
  /** How many times the three choices were reshuffled, so a reload shows the same ones. */
  reroll: number;
  turn: Turn | null;
}
/** The one party keepsake, "Lantern Night", kept from the first finished trip. `at` is 0 when the date is unknown. */
export interface Keepsake { at: number }
export interface CouchSave {
  version: 3;
  party: Party | null;
  trips: number;
  /** One counter and latest sticker seed per game; ownership counts never fall as history rotates. */
  stickers: Partial<Record<CouchId, { count: number; seed: number }>>;
  /** Games whose full "how to play" has been shown; later plays only show a name card. */
  seen: CouchId[];
  /** Earned once, by the first finished trip of either mode; later trips never add another. */
  keepsake: Keepsake | null;
  /** Challenge courses: a run in progress, and each player's records. Created when a course is first started. */
  courses: Partial<Record<CourseId, CourseSave>>;
  /** What the two players like to be called; empty means "Player 1" and "Player 2". */
  names: [string, string];
  /** Where she plays, the couch volume and music, and the text size. Added without a version step: an older save simply gets the defaults. */
  settings: CouchSettings;
}
export const couchDefaults = (): CouchSave => ({ version: 3, party: null, trips: 0, stickers: {}, seen: [], keepsake: null, courses: {}, names: ['', ''], settings: settingsDefaults() });
export const NAME_MAX = 14;
/** A name as the page may show it: no control characters, single spaces, trimmed, at most `NAME_MAX` letters. */
export const cleanName = (v: unknown): string => typeof v === 'string' ? [...v.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()].slice(0, NAME_MAX).join('').trim() : '';
export const newParty = (mode: TripMode, seed: number): Party => ({ seed, rounds: [], selected: null, mode, reroll: 0, turn: null });

/**
 * Games opened by finishing trips: the first tier is there from the start, and each completed trip
 * (either mode) opens the next. Derived from the trip count, never stored, so a reload or a restored
 * backup can't award twice, and nothing locks again.
 */
export const UNLOCK_TIERS: readonly (readonly CouchId[])[] = [['penguin-slide', 'bouncy-launch', 'bounce-back'], ['memory-match', 'rhythm-neighbors'], ['light-lab', 'secret-code'], ['peg-garden', 'bumper-garden'], ['pattern-train', 'egg-catch'], ['frog-hop', 'sink-float'], ['robot-path'], ['sudoku-garden'], ['lantern-lights'], ['picture-logic']];
const completed = (trips: number) => Number.isFinite(trips) ? Math.max(0, Math.floor(trips)) : 0;
export const unlockedIds = (trips: number, tiers = UNLOCK_TIERS): CouchId[] => tiers.slice(0, completed(trips) + 1).flat();
export const tierOf = (id: CouchId, tiers = UNLOCK_TIERS) => tiers.findIndex(t => t.includes(id));
/** Games opened by trips (not the starting set) that nobody has had explained yet. */
export const isNew = (save: CouchSave, id: CouchId, tiers = UNLOCK_TIERS) => tierOf(id, tiers) > 0 && !save.seen.includes(id);
/** The next tier, if there is one: its size is shown beforehand, its games are a surprise. */
export const nextTier = (trips: number, tiers = UNLOCK_TIERS) => tiers[completed(trips) + 1];

const MAX_SEED = 0x7fffffff;
const isId = (v: unknown): v is CouchId => COUCH_IDS.includes(v as CouchId);
const number = (v: unknown, max = Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};
const isWinner = (v: unknown): v is StopWinner => v === 0 || v === 1 || v === 'tie' || v === 'team';

export function repairCouch(raw: unknown): CouchSave {
  const v = object(raw), out = couchDefaults();
  // Version 1 had no `seen` list or trip modes, and versions 1 and 2 had no keepsake; everything else carries over.
  if (v.version !== 1 && v.version !== 2 && v.version !== 3) return out;
  out.trips = number(v.trips);
  // A save that finished a trip before keepsakes existed gets it now, with an unknown date.
  const kept = object(v.keepsake);
  out.keepsake = v.keepsake && typeof v.keepsake === 'object' ? { at: number(kept.at) } : out.trips > 0 ? { at: 0 } : null;
  const names = Array.isArray(v.names) ? v.names : [];
  out.names = [cleanName(names[0]), cleanName(names[1])];
  out.settings = repairSettings(v.settings);
  const courses = object(v.courses);
  for (const id of Object.keys(courses)) if (isCourseId(id)) out.courses[id] = repairCourse(courses[id], courseSpec(id));
  if (Array.isArray(v.seen)) out.seen = COUCH_IDS.filter(id => (v.seen as unknown[]).includes(id));
  const stickers = object(v.stickers);
  for (const id of COUCH_IDS) {
    const s = object(stickers[id]);
    if (number(s.count)) out.stickers[id] = { count: number(s.count), seed: number(s.seed, MAX_SEED) };
  }
  if (v.party) {
    const p = object(v.party);
    const mode: TripMode = p.mode === 'faceoff' ? 'faceoff' : 'together';
    const rounds = Array.isArray(p.rounds) ? p.rounds.slice(0, STOPS).map(object).filter(r => isId(r.id)).map(r => {
      // Key order matches completeRound, so a restored backup is byte-identical to what play saved.
      const round: CouchRound = { id: r.id as CouchId, seed: number(r.seed, MAX_SEED), level: 0, misses: number(r.misses), hints: number(r.hints) };
      if (mode === 'faceoff') {
        if (Array.isArray(r.scores) && r.scores.length === 2) round.scores = [number(r.scores[0]), number(r.scores[1])];
        if (isWinner(r.winner)) round.winner = r.winner;
      }
      return round;
    }) : [];
    // Levels are reconstructed from the route, not arbitrary save input.
    rounds.forEach((r, i) => r.level = levelFor(r.id, i));
    // Only a game this save has really unlocked can be the one in progress.
    const selected = rounds.length < STOPS && isId(p.selected) && unlockedIds(out.trips).includes(p.selected) ? p.selected : null;
    const t = object(p.turn);
    const turn = mode === 'faceoff' && selected && COUCH_INFO[selected].faceoff === 'twin' && p.turn ? { score: number(t.score), misses: number(t.misses), hints: number(t.hints) } : null;
    out.party = { seed: number(p.seed, MAX_SEED), rounds, selected, mode, reroll: number(p.reroll, 99), turn };
  }
  return out;
}

/** Remember that a game's full "how to play" has been shown. */
export function markSeen(save: CouchSave, id: CouchId) {
  if (!save.seen.includes(id)) save.seen.push(id);
}
export const levelFor = (id: CouchId, stop: number) => COUCH_INFO[id].level(stop);
/** The board for this stop. Each face-off turn gets its own, so the second player has not seen the first's answer. */
export const seedFor = (party: Party, turn = 0) => new Rng(party.seed + party.rounds.length * 7919 + turn * 104729).int(1, MAX_SEED);
/** The player who chooses the stop, and so plays first: the two take turns in order. */
export const starterOf = (party: Party): 0 | 1 => party.rounds.length % 2 === 0 ? 0 : 1;
/** Whose board is up. Everyone shares the controller outside face-off stops, so this is only meaningful there. */
export const playerNow = (party: Party): 0 | 1 => party.turn ? (starterOf(party) === 0 ? 1 : 0) : starterOf(party);

/** Three choices from the unlocked games: stable across reload, preferring games not yet played this trip and not the last two. */
export function offers(party: Party, trips: number, tiers = UNLOCK_TIERS): CouchId[] {
  const pool = new Rng(seedFor(party) + party.reroll * 15485863).shuffle([...unlockedIds(trips, tiers)]);
  if (pool.length <= 3) return pool;
  const recent = party.rounds.slice(-2).map(r => r.id);
  const played = new Set(party.rounds.map(r => r.id));
  const staleness = (id: CouchId) => (played.has(id) ? 1 : 0) + (recent.includes(id) ? 2 : 0);
  return pool.sort((a, b) => staleness(a) - staleness(b)).slice(0, 3);
}
/** Ask for another three. Free, and never repeats within a reload. */
export function reshuffle(party: Party) { party.reroll = Math.min(99, party.reroll + 1); }

export const roundToken = (party: Party) => `${party.seed}:${party.rounds.length}:${party.selected}:${party.turn ? 1 : 0}`;

/** Who wins a stop, given both scores and which way is better. Equal scores tie. */
export function decide(id: CouchId, scores: readonly [number, number]): StopWinner {
  if (scores[0] === scores[1]) return 'tie';
  const lower = (COUCH_INFO[id].score?.better ?? 'lower') === 'lower';
  return (scores[0] < scores[1]) === lower ? 0 : 1;
}
/** Points a stop gave each player: the winner one, a tie or a team stop both. */
export const pointsFor = (winner: StopWinner | undefined): [number, number] => winner === 0 ? [1, 0] : winner === 1 ? [0, 1] : winner === undefined ? [0, 0] : [1, 1];
export const tally = (party: Party): [number, number] => party.rounds.reduce<[number, number]>((t, r) => { const [a, b] = pointsFor(r.winner); return [t[0] + a, t[1] + b]; }, [0, 0]);

/**
 * Idempotent settlement. Together trips and team or shared stops finish in one round. A face-off
 * stop on separate boards finishes in two: the first turn is kept (`'turn'`), the second settles the
 * stop (`'stop'`). Stale finishes can't award again, or settle a different selection.
 */
export function completeRound(save: CouchSave, token: string, result: RoundResult, now = Date.now()): 'turn' | 'stop' | false {
  const p = save.party;
  if (!p?.selected || p.rounds.length >= STOPS || roundToken(p) !== token) return false;
  const id = p.selected, info = COUCH_INFO[id], faceoff = p.mode === 'faceoff';
  const misses = number(result.misses), hints = number(result.hints);
  if (faceoff && info.faceoff === 'twin' && !p.turn) {
    p.turn = { score: number(result.score), misses, hints };
    return 'turn';
  }
  const round: CouchRound = { id, seed: seedFor(p), level: levelFor(id, p.rounds.length), misses: misses + (p.turn?.misses ?? 0), hints: hints + (p.turn?.hints ?? 0) };
  if (faceoff) {
    if (info.faceoff === 'team') round.winner = 'team';
    else {
      const first = starterOf(p), mine = number(result.score);
      const scores: [number, number] = info.faceoff === 'twin'
        ? (first === 0 ? [p.turn!.score, mine] : [mine, p.turn!.score])
        : [number(result.scores?.[0]), number(result.scores?.[1])];
      round.scores = scores;
      round.winner = decide(id, scores);
    }
  }
  p.rounds.push(round);
  p.turn = null;
  const old = save.stickers[id];
  save.stickers[id] = { count: (old?.count ?? 0) + 1, seed: round.seed };
  p.selected = null;
  if (p.rounds.length === STOPS) {
    save.trips++;
    save.keepsake ??= { at: now };
  }
  return 'stop';
}
