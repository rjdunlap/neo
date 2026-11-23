import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Follow a field guide's key to name every sketched creature on the page.",
  steps: [
    {
      from: 1,
      to: 1,
      text: 'Choose a sketch, then on the Key page answer question 1 from what it shows: Yes or No leads to the next question, and a name at the end names the sketch.',
    },
    {
      from: 2,
      to: 2,
      text: 'A part behind reeds, a smudge or water can answer neither way, so the key leaves two names open: the name already on another sketch settles it.',
    },
    { text: 'Tap a name plate to lift its name off; a name given again moves from the sketch it was on.' },
  ],
  finish:
    'Three right names at once are stamped together; the round ends when every sketch is stamped; one sticker.',
  note: 'Choosing, following the key and moving names are free. A full page that does not hold is a miss (once per page): the note says which shown part rules a name out. The second brings a worked hint, and Help gives one at any time.',
};
