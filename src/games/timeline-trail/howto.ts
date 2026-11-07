import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Hang pictures of one place on the clothesline, from long ago to now.',
  steps: [
    { from: 1, to: 1, text: 'Tap the picture from long ago, or drag it to the left post.' },
    { from: 2, to: 2, text: 'Drag the loose picture into the gap where it belongs.' },
    { from: 3, to: 3, text: 'Add the pictures one at a time; each fits against the ones already hung.' },
  ],
  finish: 'The pictures play like a flipbook and the place grows.',
  note: 'A picture put in the wrong place slides back with a reason; after two tries on one picture its gap glows, which counts as a hint. Looking and listening are never counted. The place is made up for the island; no real dates are taught.',
};
