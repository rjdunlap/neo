/**
 * The short round result (D4a, `docs/definitions/brief-result.md`): an option a grown-up turns on, for a toy or puzzle
 * she plays many times in a row. It changes only how a settled round is presented; the round, its sticker and its
 * accounting are the same as in the full celebration. A first round, new evidence and routed rounds always get the full one.
 */

/** The pilot: the most repeated toy and a rule-based puzzle, neither with a creation to keep. Adding a game is one line. */
export const BRIEF_RESULT_GAMES: readonly string[] = ['bubble-pop', 'jar-sort'];

export interface BriefResultCase {
  /** `settings.briefResults` for the playing profile. */
  on: boolean;
  guest: boolean;
  id: string;
  /** Rounds of this game finished before this one. */
  earlierRounds: number;
  /** She made something to keep, found a journal entry, or grew a blossom: evidence always gets the full result. */
  made: boolean;
  discovered: boolean;
  grewForm: boolean;
  /** A story, a mix stop, a Today's six round or a collection-book round keeps the full result. */
  story: boolean;
  mix: boolean;
  daily: boolean;
  book: boolean;
}

export function briefResult(c: BriefResultCase): boolean {
  return (
    c.on &&
    !c.guest &&
    BRIEF_RESULT_GAMES.includes(c.id) &&
    c.earlierRounds > 0 &&
    !c.made &&
    !c.discovered &&
    !c.grewForm &&
    !c.story &&
    !c.mix &&
    !c.daily &&
    !c.book
  );
}
