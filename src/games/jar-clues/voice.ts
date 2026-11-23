/**
 * Jar Clues' spoken lines (docs/definitions/jar-clues.md). The clues are closed, so every line is a whole line with no
 * slots and renders as a clip; the numbers of a fault, a hint or the reveal are on the note, which is fuller than the
 * speech. `voice.test.ts` checks a line exists for every clue, fault and hint a board can produce.
 */
import { CLUES, clueLine } from './logic.ts';

const fixed = {
  'game.jar-clues': ['Jar Clues'],
  'jarclues.start': ['Guess, then cross off what each clue rules out.'],
  'jarclues.guess': ['About how many? Tap your first guess.'],
  'jarclues.fault.standing': ['A number the clue rules out is still standing.'],
  'jarclues.fault.crossed': ['A number you crossed off fits every clue so far.'],
  'jarclues.hint.cross': ['Cross off the lit numbers in this row.'],
  'jarclues.hint.bring': ['Bring the lit number back.'],
  'jarclues.hint.bring-many': ['Bring the lit numbers back.'],
  'jarclues.hint.mixed': ['Cross off the lit numbers that are standing, and bring back the crossed ones.'],
  'jarclues.hint.holds': ['This board fits the clue. Ask for the next one.'],
  'jarclues.last': ['Which one does the jar hold?'],
  'jarclues.holds': ['The jar holds this many.'],
  'jarclues.close': ['Close from the start.'],
};

const clues: Record<string, string[]> = {};
for (const c of CLUES) clues[clueLine(c)] = [`${c.words}.`];

export const VOICE = { ...fixed, ...clues };
