/**
 * The shared count of misses and hints, from which a game's `ctx.finish({ misses, hints })` and so its difficulty
 * steps are made. The rule from AGENTS.md: a wrong answer gets a boing and a spoken hint, and a glow after two
 * misses. Games keep their own visuals and speech; these helpers only count and say when a hint is due.
 *
 * The counts are plain fields on the game's own state (`misses`, `hints`, and for per-request counting `roundMisses`
 * and `helped`), so a game's rule tests keep reading them as before. Two cadences exist:
 * - `missEvery`: the hint is due on every second miss of the round (2, 4, 6…);
 * - `missOnRequest`: the hint is due once per request, when that request reaches two misses.
 * A due hint is counted only when the game shows it (`hinted`), as is a hint from a Help press or an idle glow.
 */

/** Misses that bring a hint. */
export const HINT_AFTER = 2;

/** What `ctx.finish` takes. */
export interface Tally {
  misses: number;
  hints: number;
}

/** A tally that also counts the current request, for games that hint once per request. */
export interface RequestTally extends Tally {
  /** Misses on this request. */
  roundMisses: number;
  /** Whether this request's hint has come. */
  helped: boolean;
}

export const newTally = (): Tally => ({ misses: 0, hints: 0 });
export const newRequestTally = (): RequestTally => ({ misses: 0, hints: 0, roundMisses: 0, helped: false });

/** One wrong answer. True when a hint is due: on every `after`th miss of the round. */
export function missEvery(t: Tally, after = HINT_AFTER): boolean {
  t.misses++;
  return t.misses % after === 0;
}

/** One wrong answer on the current request. True once per request, when it reaches `after` misses. */
export function missOnRequest(t: RequestTally, after = HINT_AFTER): boolean {
  t.misses++;
  t.roundMisses++;
  if (t.helped || t.roundMisses < after) return false;
  t.helped = true;
  return true;
}

/** A hint was shown: one hint, whatever brought it (a due miss, a Help press, an idle glow). */
export function hinted(t: Tally): void {
  t.hints++;
}

/** The next request: its misses start over and its hint may come again. The round's totals stay. */
export function nextRequest(t: RequestTally): void {
  t.roundMisses = 0;
  t.helped = false;
}

/** The round's totals, as `ctx.finish` takes them. */
export const tally = (t: Tally): Tally => ({ misses: t.misses, hints: t.hints });
