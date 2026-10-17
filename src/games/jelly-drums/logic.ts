import type { LineId } from '../../content/voice-script';
import type { Rng } from '../../engine/random';

/** Jellies on the stage, biggest (lowest) first. */
export const JELLIES = 5;

export interface JellyPlan {
  mode: 'free' | 'echo' | 'wake';
  /** Notes to play (free, wake) or tunes to copy (echo). */
  goal: number;
  /** Tune length (echo). */
  length: number;
}

export const PLANS: JellyPlan[] = [
  { mode: 'free', goal: 24, length: 0 },
  { mode: 'free', goal: 32, length: 0 },
  { mode: 'free', goal: 40, length: 0 },
  { mode: 'echo', goal: 4, length: 2 },
  { mode: 'echo', goal: 4, length: 3 },
  { mode: 'echo', goal: 5, length: 3 },
  { mode: 'echo', goal: 4, length: 4 },
  { mode: 'echo', goal: 5, length: 4 },
  { mode: 'echo', goal: 5, length: 5 },
  // Level 10, "One big jelly": the easiest entry, placed first for lap by the band's `order`.
  { mode: 'wake', goal: 24, length: 0 },
];

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

/** What a tune is: a shape (the same at every length) or a phrase of a real song. */
export type TuneKind = 'up' | 'down' | 'hop' | 'wiggle' | SongId;

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
  for (const song of SONGS) if (song.notes.length === length) out.push({ notes: [...song.notes], kind: song.id, title: song.title });
  return out;
}

const same = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((n, k) => n === b[k]);

/**
 * The next tune to copy. A kind is picked first, so a song comes round as often as a shape; never the kind just
 * played while another is left, and never a tune already in `played` (the round's earlier tunes).
 */
export function drawTune(rng: Rng, length: number, played: readonly Tune[] = []): Tune {
  const fresh = tunesOf(length).filter((t) => !played.some((p) => same(p.notes, t.notes)));
  const kinds = [...new Set(fresh.map((t) => t.kind))];
  const last = played.at(-1)?.kind;
  const choices = kinds.length > 1 ? kinds.filter((k) => k !== last) : kinds;
  const kind = rng.pick(choices);
  return rng.pick(fresh.filter((t) => t.kind === kind));
}

/** Seconds without a touch in free play before a jelly wiggles to invite her back. */
export const NUDGE_AFTER = 8;

/** Free play's idle clock: any touch resets it, and it nudges once every `NUDGE_AFTER` quiet seconds. It never counts anything. */
export class IdleNudge {
  private idle = 0;
  touched() {
    this.idle = 0;
  }
  /** True when a nudge is due this frame. */
  tick(dt: number): boolean {
    this.idle += dt;
    if (this.idle < NUDGE_AFTER) return false;
    this.idle = 0;
    return true;
  }
}

/** The little song the ghost finger plays in free play: the scale climbing and coming back, so every note is the jelly next door. */
export const FREE_SONG = [0, 1, 2, 3, 4, 3, 2, 1];

/** The jelly for the `n`th note of free play (counting from 0), looping the song. */
export const freeNote = (n: number): number => FREE_SONG[((n % FREE_SONG.length) + FREE_SONG.length) % FREE_SONG.length];

/** Where a round is: free play is all `play`; a tune round listens (`play` before the first tune, then `listen`) and takes a `turn`. */
export type JellyPhase = 'play' | 'listen' | 'turn' | 'done';

/**
 * The jelly a capable child taps next, or null while she should wait. In free play she plays the song. In a tune round
 * she waits through the first pause and the tune itself (a tap then is only music, but it is not her answer) and then
 * taps the tune in order.
 */
export function jellyToTap(mode: JellyPlan['mode'], phase: JellyPhase, tune: readonly number[], at: number, notes: number): number | null {
  if (mode === 'wake') {
    const awake = awakeJellies(notes);
    return phase === 'play' ? awake[notes % awake.length] : null;
  }
  if (mode === 'free') return phase === 'play' ? freeNote(notes) : null;
  return phase === 'turn' ? (tune[at] ?? null) : null;
}
