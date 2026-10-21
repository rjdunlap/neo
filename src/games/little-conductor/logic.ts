import { CRITTERS, type CritterName } from '../../art/critter';
import { PENTATONIC } from '../../audio/notes';
import type { Rng } from '../../engine/random';

/**
 * Little Conductor's rules: one four-beat tune on the game's own score clock, and two paces she sets.
 * The model never touches Web Audio; `advance` returns the beats to voice and `index.ts` plays them.
 * Levels 1–2 are free play (music M2); level 3's two pictured requests are the only thing that can miss (M3,
 * docs/definitions/little-conductor.md).
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

export interface Plan { level: number; name: string; mode: 'lead' | 'both' | 'sign' }
const PLANS: Plan[] = [
  { level: 1, name: 'Lead a little band: tap the turtle or the rabbit and the band plays slow or fast', mode: 'lead' },
  { level: 2, name: 'Two ways to play: hear the tune slow and fast, then finish with the one she likes', mode: 'both' },
  { level: 3, name: "Two pictured requests: a listener's sign shows the turtle or the rabbit for each half of the tune; she picks that pad and taps Check", mode: 'sign' },
];
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

export interface Round {
  motif: Motif;
  cast: CritterName[];
  /** Level 3's listener, a fourth friend who holds the sign. */
  listener: CritterName;
  /** Level 3: the pace the sign asks for in each half of the tune, always one of each, so every round holds one change. */
  requests: [PaceId, PaceId];
}
/** The band's friends: anyone from the cast except the mountain's host bear and the pip (the companion's look). */
const BAND: CritterName[] = (Object.keys(CRITTERS) as CritterName[]).filter((n) => n !== 'bear' && n !== 'pip');
export function makeRound(rng: Rng): Round {
  const motif = rng.pick(MOTIFS);
  const friends = rng.shuffle([...BAND]);
  const requests: [PaceId, PaceId] = rng.chance(0.5) ? ['turtle', 'rabbit'] : ['rabbit', 'turtle'];
  return { motif, cast: friends.slice(0, 3), listener: friends[3], requests };
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

/** Level 3: which half of the tune the sign is on, the pad she has picked for it, and what the Checks have counted. */
export interface Requests {
  phrase: 0 | 1;
  choice: PaceId | null;
  /** Wrong Checks on this half. */
  missed: number;
  /** Whether this half's hint has been counted (at most one per half). */
  hinted: boolean;
  misses: number;
  hints: number;
  done: boolean;
}

export const newRequests = (): Requests => ({ phrase: 0, choice: null, missed: 0, hinted: false, misses: 0, hints: 0, done: false });

/** The truth table: a Check is right exactly when the picked pad is the pace the sign shows. No timing is judged. */
export const check = (round: Round, phrase: 0 | 1, choice: PaceId | null): boolean => choice !== null && choice === round.requests[phrase];

/** The pad the sign asks for, which is the pad that glows after two wrong Checks. */
export const glowTarget = (round: Round, r: Requests): PaceId => round.requests[r.phrase];

/** A pad tap at level 3: it becomes her pick (and auditions). Never counted. */
export const choose = (r: Requests, pace: PaceId): Requests => (r.done ? r : { ...r, choice: pace });

/**
 * A hint for this half: counted once, whether it came from two wrong Checks or the pause sheet's Show a hint.
 * Asking again repeats the help without counting.
 */
export function hint(r: Requests): { state: Requests; counted: boolean } {
  if (r.done || r.hinted) return { state: r, counted: false };
  return { state: { ...r, hinted: true, hints: r.hints + 1 }, counted: true };
}

export type CheckResult = 'pick-first' | 'wrong' | 'match' | 'finished';

/**
 * Check. No pad picked: nothing is counted. A wrong pick is a miss and stays picked so she can compare it with the sign;
 * the second wrong Check on a half lights the hint. A right pick moves the sign on to the second half, or finishes.
 */
export function submit(r: Requests, round: Round): { state: Requests; result: CheckResult; glow: boolean } {
  if (r.done) return { state: r, result: 'finished', glow: false };
  if (r.choice === null) return { state: r, result: 'pick-first', glow: false };
  if (!check(round, r.phrase, r.choice)) {
    let state: Requests = { ...r, missed: r.missed + 1, misses: r.misses + 1 };
    let glow = false;
    if (state.missed >= 2 && !state.hinted) ({ state, counted: glow } = hint(state));
    return { state, result: 'wrong', glow };
  }
  if (r.phrase === 1) return { state: { ...r, done: true }, result: 'finished', glow: false };
  return { state: { ...r, phrase: 1, choice: null, missed: 0, hinted: false }, result: 'match', glow: false };
}

/** The ghost finger at level 3: the pad the sign shows (read off the sign, nothing hidden), then Check. */
export const signBot = (round: Round, r: Requests): PaceId | 'check' | null =>
  r.done ? null : r.choice === round.requests[r.phrase] ? 'check' : round.requests[r.phrase];

export interface Rect { x: number; y: number; w: number; h: number }
export interface Disc { x: number; y: number; r: number }
export interface ConductorLayout {
  stand: Rect;
  /** Where each friend's feet stand. */
  friends: { x: number; y: number }[];
  pads: Record<PaceId, Rect>;
  listen: Disc;
  done: Disc;
  /** Level 3: the listener's sign, and where the listener stands under it. */
  sign?: Rect;
  listener?: { x: number; y: number };
}

export const PAD = 180;
const PAD_GAP = 60;
const BUTTON = 60;
export const SIGN = 200;
/** Level 3 keeps a column at the right of a landscape screen for the listener and the sign. */
const SIGN_COLUMN = 250;

/** Every rectangle on the screen, from the view: the pads stay 180 units and clear of the pet's corner in both orientations. */
export function conductorLayout(view: { w: number; h: number }, level: number): ConductorLayout {
  const portrait = view.h > view.w;
  const signed = planFor(level).mode === 'sign';
  const column = signed && !portrait ? SIGN_COLUMN : 0;
  const cx = (view.w - column) / 2;
  const standW = Math.min(view.w - column - (column ? 80 : 200), portrait ? 760 : 820);
  const standH = portrait ? Math.min(380, view.h * 0.3) : Math.min(340, view.h * 0.44);
  const stand: Rect = { x: cx - standW / 2, y: portrait ? 110 : 70, w: standW, h: standH };
  const spacing = portrait ? 200 : 230;
  const feet = stand.y + stand.h - 40;
  const friends = [-1, 0, 1].map((i) => ({ x: cx + i * spacing, y: feet }));
  const padY = portrait ? Math.max(stand.y + stand.h + 90, view.h * 0.5 - PAD / 2) : stand.y + stand.h + 50;
  const padsCx = portrait ? view.w / 2 : Math.min(view.w / 2, view.w - 2 * BUTTON - 60 - PAD - PAD_GAP / 2);
  const pads = {
    turtle: { x: padsCx - PAD_GAP / 2 - PAD, y: padY, w: PAD, h: PAD },
    rabbit: { x: padsCx + PAD_GAP / 2, y: padY, w: PAD, h: PAD },
  };
  const bx = view.w - BUTTON - 40;
  const listen: Disc = portrait ? { x: bx, y: view.h - 3 * BUTTON - 90, r: BUTTON } : { x: bx, y: padY + BUTTON - 10, r: BUTTON };
  const done: Disc = portrait ? { x: bx, y: view.h - BUTTON - 50, r: BUTTON } : { x: bx, y: padY + PAD + 30, r: BUTTON };
  if (!signed) return { stand, friends, pads, listen, done };
  // Landscape: the sign at the top of the right-hand column. Portrait: below the bandstand, right of the pads.
  const sign: Rect = portrait
    ? { x: view.w - SIGN - 50, y: stand.y + stand.h + 30, w: SIGN, h: SIGN }
    : { x: view.w - SIGN - 25, y: stand.y, w: SIGN, h: SIGN };
  return { stand, friends, pads, listen, done, sign, listener: { x: sign.x + SIGN / 2, y: sign.y + SIGN + 130 } };
}
