import { CRITTERS, type CritterName } from '../../art/critter';
import { PENTATONIC } from '../../audio/notes';
import type { Rng } from '../../engine/random';

/**
 * Little Conductor's rules: one four-beat tune on the game's own score clock, and two paces she sets.
 * The model never touches Web Audio; `advance` returns the beats to voice and `index.ts` plays them.
 * Levels 1–2 are built (music M2); level 3's requests are M3 (docs/definitions/little-conductor.md).
 */

export type PaceId = 'turtle' | 'rabbit';
export const PACE_IDS: readonly PaceId[] = ['turtle', 'rabbit'];
/** Beats per minute: slow and steady, quick and light. A contrast of half, far wider than a preschooler needs to hear. */
export const PACES: Record<PaceId, number> = { turtle: 60, rabbit: 90 };
export const BEATS = 4;

export interface Motif {
  id: 'hop' | 'slide' | 'wave';
  /** One note a beat, as notes of the major pentatonic (semitones above C), all inside one octave. */
  melody: readonly number[];
  /** The beats (0-based) the pluck plays the root on. */
  bass: readonly number[];
  /** The beats the drum plays on. */
  drum: readonly number[];
}

export const MOTIFS: readonly Motif[] = [
  { id: 'hop', melody: [4, 7, 9, 7], bass: [0, 2], drum: [0, 1, 2, 3] },
  { id: 'slide', melody: [9, 7, 4, 2], bass: [0, 2], drum: [0, 1, 2, 3] },
  { id: 'wave', melody: [2, 7, 2, 9], bass: [0, 2], drum: [0, 1, 2, 3] },
];

/** A pentatonic note (semitones above C) as a scale step in the octave above middle C, for `sfx`. */
export const noteStep = (semitones: number): number => 5 + PENTATONIC.indexOf(semitones);

export interface Plan { level: number; name: string; mode: 'lead' | 'both' }
const PLANS: Plan[] = [
  { level: 1, name: 'Lead a little band: tap the turtle or the rabbit and the band plays slow or fast', mode: 'lead' },
  { level: 2, name: 'Two ways to play: hear the tune slow and fast, then finish with the one she likes', mode: 'both' },
];
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

export interface Round { motif: Motif; cast: CritterName[] }
/** The band's friends: anyone from the cast except the mountain's host bear and the pip (the companion's look). */
const BAND: CritterName[] = (Object.keys(CRITTERS) as CritterName[]).filter((n) => n !== 'bear' && n !== 'pip');
export function makeRound(rng: Rng): Round {
  return { motif: rng.pick(MOTIFS), cast: rng.shuffle([...BAND]).slice(0, 3) };
}

export interface Score {
  /** Null until her first tap: the band stands ready, silent. */
  pace: PaceId | null;
  /** A change waiting for the next beat. */
  pending: PaceId | null;
  /** The clock, in beats; beat k sounds when it reaches k. */
  beat: number;
  /** Whole beats sounded so far. */
  played: number;
  /** Where in the tune beat `played` falls: the tune starts again from its first note when this is reset. */
  phraseStart: number;
  /** Beats sounded at each pace since it was last chosen. */
  heard: Record<PaceId, number>;
  /** Whether each pace has ever been heard for a whole phrase. */
  heardEver: Record<PaceId, boolean>;
}

export interface BeatEvent {
  /** Which beat of the round this is (0, 1, 2…). */
  index: number;
  /** Which beat of the tune (0–3). */
  step: number;
  pace: PaceId;
  /** The scale step the marimba plays. */
  melody: number;
  bass: boolean;
  drum: boolean;
  /** The clock time, in seconds since the call began, that the beat landed at. */
  at: number;
}

export const newScore = (): Score => ({
  pace: null, pending: null, beat: 0, played: 0, phraseStart: 0,
  heard: { turtle: 0, rabbit: 0 }, heardEver: { turtle: false, rabbit: false },
});

/**
 * A pad tap. The first one starts the band at once (its first note sounds on the next `advance`, nothing pending);
 * a different pace waits for the next beat; tapping the playing pace again calls off a change still waiting.
 */
export function select(score: Score, pace: PaceId): Score {
  if (score.pace === null) return { ...score, pace, pending: null, heard: { ...score.heard, [pace]: 0 } };
  if (pace === score.pace) return { ...score, pending: null };
  return { ...score, pending: pace };
}

/** Listen again: the tune starts again from its first note on the next beat. What she has heard still counts. */
export const listenAgain = (score: Score): Score => (score.pace === null ? score : { ...score, phraseStart: score.played });

/**
 * Moves the clock on by `dt` seconds and returns every whole beat it crossed, each exactly once and in tune order.
 * A waiting change takes effect at the first beat it reaches; the time after it runs at the new pace.
 */
export function advance(score: Score, dt: number, motif: Motif): { score: Score; events: BeatEvent[] } {
  if (score.pace === null) return { score, events: [] };
  const s: Score = { ...score, heard: { ...score.heard }, heardEver: { ...score.heardEver } };
  const events: BeatEvent[] = [];
  let left = Math.max(0, dt);
  let at = 0;
  for (;;) {
    const perBeat = 60 / PACES[s.pace!];
    const toNext = (s.played - s.beat) * perBeat;
    if (toNext > left + 1e-9) {
      s.beat += left / perBeat;
      break;
    }
    left -= Math.max(0, toNext);
    at += Math.max(0, toNext);
    s.beat = s.played;
    if (s.pending) {
      s.pace = s.pending;
      s.pending = null;
      s.heard[s.pace] = 0;
    }
    const pace = s.pace!;
    const step = (((s.played - s.phraseStart) % BEATS) + BEATS) % BEATS;
    events.push({ index: s.played, step, pace, melody: noteStep(motif.melody[step]), bass: motif.bass.includes(step), drum: motif.drum.includes(step), at });
    s.heard[pace]++;
    if (s.heard[pace] >= BEATS) s.heardEver[pace] = true;
    s.played++;
  }
  return { score: s, events };
}

/** How many of a pad's four marks are lit: the beats heard at the playing pace since she chose it. */
export const marksLit = (score: Score, pace: PaceId): number => (score.pace === pace && !score.pending ? Math.min(BEATS, score.heard[pace]) : 0);

/**
 * The heard gate for Done. Level 1: a whole phrase at the pace she last chose. Level 2: both paces heard whole at some
 * point, and the one she finishes with heard whole since she chose it. A change still waiting closes the gate at once.
 */
export function canFinish(score: Score, level: number): boolean {
  if (score.pace === null || score.pending) return false;
  const whole = score.heard[score.pace] >= BEATS;
  if (planFor(level).mode === 'lead') return whole;
  return whole && score.heardEver.turtle && score.heardEver.rabbit;
}

/** What Done says while it is still dim: hear the whole tune, or hear the other way too. */
export function earlyDone(score: Score, level: number): 'hear-whole' | 'hear-other' {
  if (planFor(level).mode !== 'both' || !score.pace) return 'hear-whole';
  const other: PaceId = score.pace === 'turtle' ? 'rabbit' : 'turtle';
  return score.heardEver[score.pace] && !score.heardEver[other] ? 'hear-other' : 'hear-whole';
}

/** The ghost finger's next tap, at either level: the turtle, the rabbit once the turtle was heard whole, then Done when it lights. */
export function botMove(score: Score, level: number): PaceId | 'done' | null {
  if (score.pace === null) return 'turtle';
  if (score.pending) return null;
  if (score.pace === 'turtle' && score.heardEver.turtle && !score.heardEver.rabbit) return 'rabbit';
  return canFinish(score, level) ? 'done' : null;
}

export interface Rect { x: number; y: number; w: number; h: number }
export interface Disc { x: number; y: number; r: number }
export interface ConductorLayout {
  stand: Rect;
  /** Where each friend's feet stand. */
  friends: { x: number; y: number }[];
  pads: Record<PaceId, Rect>;
  listen: Disc;
  done: Disc;
}

export const PAD = 180;
const PAD_GAP = 60;
const BUTTON = 60;

/** Every rectangle on the screen, from the view: the pads stay 180 units and clear of the pet's corner in both orientations. */
export function conductorLayout(view: { w: number; h: number }, _level: number): ConductorLayout {
  const portrait = view.h > view.w;
  const cx = view.w / 2;
  const standW = Math.min(view.w - 200, portrait ? 760 : 820);
  const standH = portrait ? Math.min(380, view.h * 0.3) : Math.min(340, view.h * 0.44);
  const stand: Rect = { x: cx - standW / 2, y: portrait ? 110 : 70, w: standW, h: standH };
  const spacing = portrait ? 200 : 230;
  const feet = stand.y + stand.h - 40;
  const friends = [-1, 0, 1].map((i) => ({ x: cx + i * spacing, y: feet }));
  const padY = portrait ? Math.max(stand.y + stand.h + 90, view.h * 0.5 - PAD / 2) : stand.y + stand.h + 50;
  const padsCx = portrait ? cx : Math.min(cx, view.w - 2 * BUTTON - 60 - PAD - PAD_GAP / 2);
  const pads = {
    turtle: { x: padsCx - PAD_GAP / 2 - PAD, y: padY, w: PAD, h: PAD },
    rabbit: { x: padsCx + PAD_GAP / 2, y: padY, w: PAD, h: PAD },
  };
  const bx = view.w - BUTTON - 40;
  const listen: Disc = portrait ? { x: bx, y: view.h - 3 * BUTTON - 90, r: BUTTON } : { x: bx, y: padY + BUTTON - 10, r: BUTTON };
  const done: Disc = portrait ? { x: bx, y: view.h - BUTTON - 50, r: BUTTON } : { x: bx, y: padY + PAD + 30, r: BUTTON };
  return { stand, friends, pads, listen, done };
}
