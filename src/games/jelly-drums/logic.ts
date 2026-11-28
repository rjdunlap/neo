import type { ColorName } from '../../art/palette';
import { PITCH_COLORS } from '../../audio/notes';
import type { LineId } from '../../content/voice-script';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** Jellies on the stage, biggest (lowest) first. */
export const JELLIES = 5;

export interface JellyPlan {
  mode: 'free' | 'echo' | 'wake' | 'compare' | 'order' | 'which' | 'follow' | 'finish' | 'answer';
  /** Notes to play (free, wake), tunes to copy (echo), pairs of tunes (compare), line-ups (order) mystery notes (which), songs to follow (follow) songs to finish (finish) or touches an answered jelly sings for (answer). */
  goal: number;
  /** Tune length (echo, compare), jellies per line-up (order), 1 for a single note (which) or the most notes of a song she finishes (finish). */
  length: number;
  /** Free play's twist: at level 2 the fans answer, at level 3 a scale sparkles. Neither is a goal. */
  twist?: 'fans' | 'scale';
  /** Level 11, "Backwards": she plays the tune in reverse, the last note first. */
  reverse?: boolean;
  /** Backwards: the last tune of the round is this long (the earlier ones are `length`). */
  lastLength?: number;
  /** Level 18, "Lowest to highest, with sizes": the line-up's jellies are drawn at their own size, so the biggest is the lowest. */
  sized?: boolean;
}

export const PLANS: JellyPlan[] = [
  { mode: 'free', goal: 24, length: 0 },
  { mode: 'free', goal: 32, length: 0, twist: 'fans' },
  { mode: 'free', goal: 40, length: 0, twist: 'scale' },
  { mode: 'echo', goal: 4, length: 2 },
  { mode: 'echo', goal: 4, length: 3 },
  { mode: 'echo', goal: 5, length: 3 },
  { mode: 'echo', goal: 4, length: 4 },
  { mode: 'echo', goal: 5, length: 4 },
  { mode: 'echo', goal: 5, length: 5 },
  // Level 10, "One big jelly": the easiest entry, placed first for lap by the band's `order`.
  { mode: 'wake', goal: 24, length: 0 },
  // Level 11, "Backwards": four tunes of three notes, then one of four, each played back last note first.
  { mode: 'echo', goal: 5, length: 3, reverse: true, lastLength: 4 },
  // Level 12, "Same or different?": five pairs of three-note tunes; she says whether the two are the same song.
  { mode: 'compare', goal: 5, length: 3 },
  // Level 13, "Lowest to highest": three line-ups of four equal-sized jellies in shuffled colors; drag them in pitch order.
  { mode: 'order', goal: 3, length: 4 },
  // Level 14, "Which jelly sang?": listen to one note by ear; two jellies awake (biggest & littlest), then three, then five.
  { mode: 'which', goal: 6, length: 1 },
  // Level 15, "Follow the glow": the lit jelly is the answer; four three-note songs, Hot Cross Buns first. Nothing is a miss.
  { mode: 'follow', goal: 4, length: 3 },
  // Level 16, "Finish the song": three known songs play through, play again without their last one or two notes, and she taps the ending.
  { mode: 'finish', goal: 3, length: 2 },
  // Level 17, "Echo jellies": lap's first level; a jelly sings when touched and answers itself with the same note and a ripple. Eight touches.
  { mode: 'answer', goal: 8, length: 0 },
  // Level 18, "Lowest to highest, with sizes": level 13's line-ups with the size cue on, so the biggest jelly is the lowest of those left.
  { mode: 'order', goal: 3, length: 4, sized: true },
  // Levels 19–22, "Long tune": grown-ups' tunes of six, eight, twelve and sixteen notes (`grownup` only, and the couch's Long tune
  // face-off). No child's range reaches them: six notes and more are the memory load the audit keeps out of her levels.
  { mode: 'echo', goal: 3, length: 6 },
  { mode: 'echo', goal: 3, length: 8 },
  { mode: 'echo', goal: 2, length: 12 },
  { mode: 'echo', goal: 1, length: 16 },
];

export const LEVELS: BandLevels = {
  // Level 17 (Echo jellies) is the easiest, so lap plays it first, then level 10 (one big jelly), then 1, 2, 3 (see `order`).
  lap: { min: 1, max: 17, order: [17, 10, 1, 2, 3] },
  // Levels 15 (Follow the glow) and 14 (Which jelly sang?) sit between 3 and 4: the top of toddler, 14 first in preschool.
  toddler: { min: 1, max: 15, order: [1, 2, 3, 15, 14] },
  // Level 16 (Finish the song) sits between 6 and 7 for preschool; level 18 (Lowest to highest, with sizes) follows 7.
  preschool: { min: 4, max: 18, order: [14, 4, 5, 6, 16, 7, 18] },
  // Levels 10 (one big jelly) and 17 (Echo jellies) are lap's, 14 (Which jelly sang?) is toddler/preschool's, 15 (Follow the glow) is toddler's and 16 (Finish the song) is preschool's: older bands skip them. Level 18 is preschool's only.
  prek: { min: 5, max: 13, order: [5, 6, 7, 8, 9, 11, 12, 13] },
  school: { min: 8, max: 13, order: [8, 9, 11, 12, 13] },
  // Grown-ups: school's top levels, then the long tunes (19–22), which only this band plays.
  grownup: { min: 9, max: 22, order: [9, 11, 12, 13, 19, 20, 21, 22] },
};

/** The order the jellies wake in on the wake level: the big low one, the little high one, then the rest one by one. */
export const WAKE_ORDER = [0, 4, 2, 1, 3];
/** The touch count at which each jelly in `WAKE_ORDER` joins. */
export const WAKE_AT = [0, 6, 10, 14, 18];

/** The jellies awake after `notes` touches, in the order they woke. */
export const awakeJellies = (notes: number): number[] => WAKE_ORDER.filter((_, k) => notes >= WAKE_AT[k]);

/** The awake jelly closest across the stage to a touch at `x`; a touch anywhere sings. `xs` are the jellies' stage positions. */
export function nearestAwake(xs: readonly number[], awake: readonly number[], x: number): number {
  return awake.reduce((best, i) => (Math.abs(xs[i] - x) < Math.abs(xs[best] - x) ? i : best), awake[0]);
}

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** The notes she taps for a tune: the tune itself, or on a backwards level the same notes last first. */
export const answerOf = (plan: Pick<JellyPlan, 'reverse'>, tune: readonly number[]): number[] =>
  plan.reverse ? [...tune].reverse() : [...tune];

/** How many notes the `n`th tune (from 0) of a round has. */
export const tuneLength = (plan: JellyPlan, n: number): number =>
  plan.lastLength !== undefined && n === plan.goal - 1 ? plan.lastLength : plan.length;

/** What a tune is: a shape (the same at every length) or a phrase of a real song. */
export type TuneKind = 'up' | 'down' | 'hop' | 'wiggle' | 'twist' | SongId;

export interface Tune {
  notes: number[];
  kind: TuneKind;
  /** A song's spoken title, said before it first plays. */
  title?: LineId;
}

export type SongId = 'hot-cross-buns' | 'mary' | 'jingle-bells';

/**
 * Song phrases on the five jellies (C D E G A = 0 1 2 3 4), traditional tunes in C major, checked 2026-10-17 against
 * letter-note charts: Hot Cross Buns opens E D C; Mary Had a Little Lamb opens E D C D E (E E); Jingle Bells' chorus
 * "jingle all the way" is E G C D E. Oh! Susanna's phrases are left out until a score confirms them.
 */
export const SONGS: readonly { id: SongId; notes: number[]; title: LineId }[] = [
  { id: 'hot-cross-buns', notes: [2, 1, 0], title: 'jelly.song.hot-cross-buns' },
  { id: 'mary', notes: [2, 1, 0, 1, 2], title: 'jelly.song.mary' },
  { id: 'jingle-bells', notes: [2, 3, 0, 1, 2], title: 'jelly.song.jingle-bells' },
];

const alternate = (a: number, b: number, length: number) => Array.from({ length }, (_, k) => (k % 2 ? b : a));

/**
 * Every tune of a length: staircases up and down, hops (two jellies with at least one between, back and forth), wiggles
 * (two neighbors back and forth, from three notes, since two would be a staircase) and the songs of that length.
 */
export function tunesOf(length: number): Tune[] {
  const out: Tune[] = [];
  for (let s = 0; s + length <= JELLIES; s++) {
    const up = Array.from({ length }, (_, k) => s + k);
    out.push({ notes: up, kind: 'up' }, { notes: [...up].reverse(), kind: 'down' });
  }
  for (let a = 0; a < JELLIES; a++) {
    for (let b = 0; b < JELLIES; b++) {
      const gap = Math.abs(a - b);
      if (gap >= 2) out.push({ notes: alternate(a, b, length), kind: 'hop' });
      if (gap === 1 && length >= 3) out.push({ notes: alternate(a, b, length), kind: 'wiggle' });
    }
  }
  for (const song of SONGS)
    if (song.notes.length === length) out.push({ notes: [...song.notes], kind: song.id, title: song.title });
  return out;
}

/** Backwards levels only: every tune of this length with no jelly twice in a row that is not a staircase, hop or wiggle. */
export function twistsOf(length: number): Tune[] {
  const out: Tune[] = [];
  const grow = (notes: number[]) => {
    if (notes.length === length) {
      if (!tunesOf(length).some((t) => same(t.notes, notes))) out.push({ notes, kind: 'twist' });
      return;
    }
    for (let i = 0; i < JELLIES; i++) if (i !== notes.at(-1)) grow([...notes, i]);
  };
  grow([]);
  return out;
}

const same = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((n, k) => n === b[k]);

/**
 * The next tune to copy. A kind is picked first, so a song comes round as often as a shape; never the kind just
 * played while another is left, and never a tune already in `played` (the round's earlier tunes).
 */
export function drawTune(rng: Rng, length: number, played: readonly Tune[] = [], reverse = false): Tune {
  // Backwards: a tune that reads the same both ways would have nothing to reverse, so it is never drawn.
  const fresh = (reverse ? [...tunesOf(length), ...twistsOf(length)] : tunesOf(length)).filter(
    (t) => !played.some((p) => same(p.notes, t.notes)) && !(reverse && same(t.notes, [...t.notes].reverse())),
  );
  const kinds = [...new Set(fresh.map((t) => t.kind))];
  const last = played.at(-1)?.kind;
  const choices = kinds.length > 1 ? kinds.filter((k) => k !== last) : kinds;
  const kind = rng.pick(choices);
  return rng.pick(fresh.filter((t) => t.kind === kind));
}

/** A tune longer than the five jellies: the grown-ups' long tunes (levels 19–22). */
export const LONG_FROM = JELLIES + 1;

/**
 * A long tune: a walk across the jellies, mostly to a neighbour, sometimes a leap of two or more, never the same jelly twice in
 * a row, and never a tune already in `played`. It visits at least four jellies, so it is not a hop or a wiggle drawn out.
 */
export function longTune(rng: Rng, length: number, played: readonly Tune[] = []): Tune {
  for (;;) {
    const notes = [rng.int(0, JELLIES - 1)];
    while (notes.length < length) {
      const at = notes[notes.length - 1];
      const near = [at - 1, at + 1].filter((j) => j >= 0 && j < JELLIES);
      const far = Array.from({ length: JELLIES }, (_, j) => j).filter((j) => Math.abs(j - at) >= 2);
      notes.push(rng.chance(0.7) ? rng.pick(near) : rng.pick(far));
    }
    if (new Set(notes).size >= 4 && !played.some((p) => same(p.notes, notes)))
      return { notes, kind: 'twist' };
  }
}

/**
 * Every tune of an echo round, drawn before the first one plays, so the round's tunes depend on the seed alone: two
 * grown-ups in a couch face-off hear the same tunes however many slips each makes.
 */
export function drawEchoRound(rng: Rng, plan: JellyPlan): Tune[] {
  const played: Tune[] = [];
  for (let n = 0; n < plan.goal; n++) {
    const length = tuneLength(plan, n);
    played.push(
      length >= LONG_FROM ? longTune(rng, length, played) : drawTune(rng, length, played, plan.reverse),
    );
  }
  return played;
}

/** Level 12's answer: the two songs are the same, or one jelly differs. */
export type Verdict = 'same' | 'different';

/** One round of "Same or different?": the two tunes in the order they play, and where they differ (-1 when they do not). */
export interface TunePair {
  first: number[];
  second: number[];
  same: boolean;
  /** The position in each tune where the notes differ, or -1 for a same pair. */
  changed: number;
  /** The tune the pair was made from, for the round's no-repeat list. */
  base: Tune;
}

export const verdictOf = (pair: Pick<TunePair, 'same'>): Verdict => (pair.same ? 'same' : 'different');

/** Which of the round's `goal` pairs are the same: half of them (3 of 5 or 2 of 5, either at random), in a shuffled order. */
export function sameFlags(rng: Rng, goal: number): boolean[] {
  const nSame = Math.floor(goal / 2) + (rng.chance(0.5) ? 1 : 0);
  return rng.shuffle([
    ...Array.from({ length: nSame }, () => true),
    ...Array.from({ length: goal - nSame }, () => false),
  ]);
}

/** How many steps along the jellies a different pair must change by: wide in the first two pairs, one step later on. */
export const minStepAt = (n: number): number => (n < 2 ? 2 : 1);

/**
 * The `n`th pair of a round. A same pair plays one tune twice. A different pair changes exactly one note of a tune to
 * another jelly at least `minStepAt(n)` steps away, and it may play the changed tune first or second. The base tune is
 * never one of `played`, so no pair comes round twice.
 */
export function drawPair(
  rng: Rng,
  length: number,
  same: boolean,
  n: number,
  played: readonly Tune[],
): TunePair {
  const base = drawTune(rng, length, played);
  if (same) return { first: [...base.notes], second: [...base.notes], same, changed: -1, base };
  const changed = rng.int(0, length - 1);
  const was = base.notes[changed];
  const to = rng.pick(
    Array.from({ length: JELLIES }, (_, j) => j).filter((j) => Math.abs(j - was) >= minStepAt(n)),
  );
  const other = base.notes.map((note, k) => (k === changed ? to : note));
  return rng.chance(0.5)
    ? { first: [...base.notes], second: other, same, changed, base }
    : { first: other, second: [...base.notes], same, changed, base };
}

/** Tunes of this many notes or more keep her place after a miss; shorter ones restart, since a restart there is short. */
export const RESUME_FROM_LENGTH = 4;

/**
 * Where she carries on after a wrong jelly (dive slice 4, decision 4): the notes she already had right stay right on a four-
 * or five-note tune, so the tune replays in full and she continues from her place `at`; a shorter tune starts again.
 */
export const placeAfterMiss = (length: number, at: number): number => (length >= RESUME_FROM_LENGTH ? at : 0);

/** Seconds without a touch in free play before a jelly wiggles to invite her back. */
export const NUDGE_AFTER = 8;

/** Level 17 (Echo jellies): a quiet jelly wiggles after this many seconds, sooner than free play's, for the smallest players. */
export const ECHO_NUDGE_AFTER = 6;

/** Level 17: how long after a touch the jelly answers with the same note; always within 0.6 seconds, so the answer feels like the touch's. */
export const ECHO_DELAY = 0.45;

/** Level 17: the jelly that answers a touch on jelly `i` (the same one, as an echo comes from where the sound was made) and when. */
export const echoOf = (i: number): { jelly: number; after: number } => ({ jelly: i, after: ECHO_DELAY });

/** Free play's idle clock: any touch resets it, and it nudges once every `after` quiet seconds. It never counts anything. */
export class IdleNudge {
  private idle = 0;
  constructor(private readonly after = NUDGE_AFTER) {}
  touched() {
    this.idle = 0;
  }
  /** True when a nudge is due this frame. */
  tick(dt: number): boolean {
    this.idle += dt;
    if (this.idle < this.after) return false;
    this.idle = 0;
    return true;
  }
}

/** Level 2: a fan answers every this many notes. */
export const FAN_EVERY = 4;

/** Level 2: the fan (in turn, 0 to `fans` - 1) who answers after the `notes`th note, or null on the notes between. */
export const fanAnswering = (notes: number, fans: number): number | null =>
  notes > 0 && notes % FAN_EVERY === 0 ? (notes / FAN_EVERY - 1) % fans : null;

/** Three notes on neighbouring jellies in order, up or down: 0 1 2, 3 2 1 and so on. */
export const isScale = (a: number, b: number, c: number): boolean =>
  (b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1);

/** Level 3's scale watch: true on the note that finishes a run of three neighbours; a run is used once, so 0 1 2 3 sparkles once. */
export class ScaleWatch {
  private run: number[] = [];
  tap(i: number): boolean {
    this.run = [...this.run, i].slice(-3);
    if (this.run.length < 3 || !isScale(this.run[0], this.run[1], this.run[2])) return false;
    this.run = [];
    return true;
  }
}

/** Free play names a jelly at most once in this many taps. */
export const NAME_EVERY = 8;

/**
 * Free play's names: now and then the voice says the jelly's color and size. At most one line in `NAME_EVERY` taps, never
 * the same jelly twice in a row, and once a round, after she has played both the biggest and the littlest, the low-and-high line.
 */
export class JellyNamer {
  private since = 0;
  private lastNamed = -1;
  private lowHighSaid = false;
  private readonly tapped = new Set<number>();
  /** The line to say for this tap, or null. A `quiet` tap (something else is sounding) counts but never speaks. */
  tap(i: number, quiet = false): LineId | null {
    this.since++;
    this.tapped.add(i);
    if (quiet || this.since < NAME_EVERY) return null;
    if (!this.lowHighSaid && this.tapped.has(0) && this.tapped.has(JELLIES - 1)) {
      this.lowHighSaid = true;
      this.since = 0;
      return 'jelly.lowhigh';
    }
    if (i === this.lastNamed) return null;
    this.lastNamed = i;
    this.since = 0;
    return JELLY_NAMES[i];
  }
}

/** The journal key (`jelly-drums:low-high`). Never rename it. */
export const LOW_HIGH = 'low-high';
/** The journal key (`jelly-drums:scale`). Never rename it. */
export const SCALE = 'scale';

/**
 * What a round has shown for the journal. "Big jellies sing low, little jellies sing high" is filed once she has
 * tapped both the biggest and the littlest jelly in the round. "A scale" is filed when level 3's three-neighbours
 * sparkle has played (`sparkled`). A round that showed neither files nothing.
 */
export class JournalWatch {
  private readonly tapped = new Set<number>();
  private scale = false;
  tap(i: number) {
    this.tapped.add(i);
  }
  /** Level 3's scale sparkle played: she climbed or came down three neighbouring jellies. */
  sparkled() {
    this.scale = true;
  }
  /** The journal keys this round showed. */
  keys(): string[] {
    const keys: string[] = [];
    if (this.tapped.has(0) && this.tapped.has(JELLIES - 1)) keys.push(LOW_HIGH);
    if (this.scale) keys.push(SCALE);
    return keys;
  }
}

/** Each jelly's color and size, biggest and lowest first. */
export const JELLY_NAMES: readonly LineId[] = [
  'jelly.name.red',
  'jelly.name.orange',
  'jelly.name.yellow',
  'jelly.name.green',
  'jelly.name.blue',
];

/** The little song the ghost finger plays in free play: the scale climbing and coming back, so every note is the jelly next door. */
export const FREE_SONG = [0, 1, 2, 3, 4, 3, 2, 1];

/** The jelly for the `n`th note of free play (counting from 0), looping the song. */
export const freeNote = (n: number): number =>
  FREE_SONG[((n % FREE_SONG.length) + FREE_SONG.length) % FREE_SONG.length];

/** Where a round is: free play is all `play`; a tune round listens (`play` before the first tune, then `listen`) and takes a `turn`. */
export type JellyPhase = 'play' | 'listen' | 'turn' | 'done';

/**
 * The jelly a capable child taps next, or null while she should wait. In free play she plays the song. In a tune round
 * she waits through the first pause and the tune itself (a tap then is only music, but it is not her answer) and then
 * taps the tune in order.
 */
export function jellyToTap(
  mode: JellyPlan['mode'],
  phase: JellyPhase,
  tune: readonly number[],
  at: number,
  notes: number,
  whichTarget: number | null = null,
): number | null {
  if (mode === 'wake') {
    const awake = awakeJellies(notes);
    return phase === 'play' ? awake[notes % awake.length] : null;
  }
  if (mode === 'which') return phase === 'turn' ? whichTarget : null;
  // Finish the song: `tune` is the ending she taps.
  // A pair round answers with a button, not a jelly: see `verdictToTap`.
  if (mode === 'compare') return null;
  // An order round drags jellies onto slots: see `orderToDrag`.
  if (mode === 'order') return null;
  if (mode === 'free' || mode === 'answer') return phase === 'play' ? freeNote(notes) : null;
  return phase === 'turn' ? (tune[at] ?? null) : null;
}

/**
 * Level 14 ("Which jelly sang?"): jellies awake at step `step` (0-based). Starts with the biggest and littlest
 * (two jellies, four steps apart), then adds the middle jelly (every pair at least two steps apart), then all five.
 */
export const whichAwake = (step: number): number[] =>
  step < 2 ? [0, 4] : step < 4 ? [0, 2, 4] : [0, 1, 2, 3, 4];

/**
 * Level 15 ("Follow the glow"): the round's `n`th song. The first is always Hot Cross Buns (spoken title and all); the
 * rest are shapes of the same length, never a tune already played and never the shape just played.
 */
export function drawFollow(rng: Rng, plan: Pick<JellyPlan, 'length'>, played: readonly Tune[]): Tune {
  if (played.length === 0) {
    const song = SONGS.find((s) => s.notes.length === plan.length);
    if (song) return { notes: [...song.notes], kind: song.id, title: song.title };
  }
  const shapes = tunesOf(plan.length).filter((t) => !t.title);
  const fresh = shapes.filter((t) => !played.some((p) => same(p.notes, t.notes)));
  const last = played.at(-1)?.kind;
  const kinds = [...new Set(fresh.map((t) => t.kind))];
  const kind = rng.pick(kinds.length > 1 ? kinds.filter((k) => k !== last) : kinds);
  return rng.pick(fresh.filter((t) => t.kind === kind));
}

/** A song she finishes: the whole phrase, and how many of its last notes are hidden the second time (one or two). */
export interface FinishSong {
  id: SongId;
  title: LineId;
  notes: number[];
  tail: number;
}

/**
 * Level 16's songs on the five jellies (C D E G A = 0 1 2 3 4), traditional phrases in C major: Hot Cross Buns
 * "hot cross buns, hot cross buns" is E D C E D C; Mary Had a Little Lamb is E D C D E E E; Jingle Bells' chorus
 * "jingle all the way" is E G C D E. At least three notes always play, and the hidden ending is one or two notes.
 */
export const FINISH_SONGS: readonly FinishSong[] = [
  { id: 'hot-cross-buns', title: 'jelly.song.hot-cross-buns', notes: [2, 1, 0, 2, 1, 0], tail: 1 },
  { id: 'mary', title: 'jelly.song.mary', notes: [2, 1, 0, 1, 2, 2, 2], tail: 2 },
  { id: 'jingle-bells', title: 'jelly.song.jingle-bells', notes: [2, 3, 0, 1, 2], tail: 2 },
];

/** The notes that play the second time, and the ending she taps. */
export const givenOf = (s: Pick<FinishSong, 'notes' | 'tail'>): number[] =>
  s.notes.slice(0, s.notes.length - s.tail);
export const endingOf = (s: Pick<FinishSong, 'notes' | 'tail'>): number[] =>
  s.notes.slice(s.notes.length - s.tail);

/** The round's `n`th song: Hot Cross Buns (one hidden note) first, then a song not yet played, in a seeded order. */
export function drawFinish(rng: Rng, played: readonly FinishSong[]): FinishSong {
  if (played.length === 0) return FINISH_SONGS[0];
  return rng.pick(FINISH_SONGS.filter((s) => !played.some((p) => p.id === s.id)));
}

/** Pick one awake jelly to sing by ear, avoiding the same jelly twice in a row while more than one is awake. */
export function drawWhich(rng: Rng, awake: readonly number[], last: number | null = null): number {
  const choices = awake.length > 1 && last !== null ? awake.filter((j) => j !== last) : awake;
  return rng.pick(choices);
}

/** The button a capable child taps once both songs have played, or null while she should wait. */
export const verdictToTap = (phase: JellyPhase, pair: Pick<TunePair, 'same'> | null): Verdict | null =>
  phase === 'turn' && pair ? verdictOf(pair) : null;

/** One jelly in a Lowest-to-highest line-up: its pitch is distinct and its color is shuffled independently. */
export interface OrderJelly {
  pitch: number;
  color: ColorName;
}

/** One line-up of equal-sized jellies: four active jellies in standing order, one sleeping color, and their pitch order. */
export interface OrderLineup {
  jellies: OrderJelly[];
  sleeper: ColorName;
  /** Indexes into `jellies`, sorted from lowest pitch to highest pitch. */
  byPitch: number[];
}

/** Once three of four jellies are placed, only one remains, so a line-up finishes in three choices. */
export const orderChoicesNeeded = (length: number): number => Math.max(0, length - 1);

/**
 * One shuffled line-up of `length` distinct pitches (from the five jellies), each wearing an independently shuffled color
 * so neither position nor color predicts pitch. Never starts already sorted lowest-to-highest.
 */
export function drawLineup(rng: Rng, length = 4): OrderLineup {
  let pitches = rng.shuffle([0, 1, 2, 3, 4]).slice(0, length);
  while (pitches.every((p, k) => k === 0 || p > pitches[k - 1])) {
    pitches = rng.shuffle(pitches);
  }
  let colors = rng.shuffle([...PITCH_COLORS]);
  while (pitches.every((p, k) => colors[k] === PITCH_COLORS[p])) {
    colors = rng.shuffle(colors);
  }
  const jellies = pitches.map((pitch, k) => ({ pitch, color: colors[k] }));
  const byPitch = jellies.map((_, k) => k).sort((a, b) => jellies[a].pitch - jellies[b].pitch);
  return { jellies, sleeper: colors[length], byPitch };
}

/** A round's `goal` distinct line-ups, each shuffled cleanly. */
export function drawLineups(rng: Rng, goal: number, length = 4): OrderLineup[] {
  const out: OrderLineup[] = [];
  const seen = new Set<string>();
  while (out.length < goal) {
    const l = drawLineup(rng, length);
    const key = l.jellies.map((j) => `${j.pitch}:${j.color}`).join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}

/** Spoken direction after dropping `pickedPitch` when `targetPitch` was needed, or null when they match. */
export const orderDirection = (pickedPitch: number, targetPitch: number): 'lower' | 'higher' | null =>
  pickedPitch === targetPitch ? null : targetPitch < pickedPitch ? 'lower' : 'higher';

/** The jelly index (in `lineup.jellies`) a capable child drags to the lit slot next, or null when waiting or done. */
export function orderToDrag(
  phase: JellyPhase,
  lineup: OrderLineup | null,
  placedCount: number,
  length = 4,
): number | null {
  if (phase !== 'turn' || !lineup || placedCount >= orderChoicesNeeded(length)) return null;
  return lineup.byPitch[placedCount] ?? null;
}

/**
 * The instrument a round plays on (dive slice 3, decision 8): the marimba on Music Mountain by day, bells on the moon
 * stage at night, and a soft held hum on the beach bandstand. Every set plays the same five pentatonic steps, so a tune
 * is the same tune on any of them and a colour always means the same pitch.
 */
export const SOUND_SETS = ['marimba', 'bells', 'hum'] as const;
export type SoundSet = (typeof SOUND_SETS)[number];

/** Where each set plays. */
export type StageName = 'mountain' | 'moon' | 'beach';
export const STAGE_OF: Record<SoundSet, StageName> = { marimba: 'mountain', bells: 'moon', hum: 'beach' };

/** The pentatonic step each jelly sings on each set, biggest (lowest) first: C D E G A on all three. */
export const SET_STEPS: Record<SoundSet, readonly number[]> = {
  marimba: [0, 1, 2, 3, 4],
  bells: [0, 1, 2, 3, 4],
  hum: [0, 1, 2, 3, 4],
};

/** A round's set, from its seed: any of the three, so the same toy sounds and looks new from one round to the next. */
export const soundSetFor = (rng: Rng): SoundSet => rng.pick(SOUND_SETS);
