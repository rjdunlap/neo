import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Make the ribbon the gift's tag asks for: the right length from halves and quarters, or at Whole Switch the right name for the spool you choose.",
  steps: [
    { from: 1, to: 3, text: 'Tap a piece and it joins the ribbon.' },
    { from: 1, to: 3, text: 'Tap a piece on the ribbon to take it back.' },
    { from: 2, to: 3, text: 'Tap the scissors, then a half, to snip it into two quarters.' },
    { from: 6, to: 6, text: 'Tap a spool to make it the whole.' },
    { from: 6, to: 6, text: 'Tap a name card: a quarter, a half or three quarters.' },
    'Tap the bow to check.',
    { from: 6, to: 6, text: 'Then give the same ribbon its other name by changing the spool.' },
  ],
  finish: [
    { from: 6, to: 6, text: 'Two names, one sticker.' },
    { from: 1, to: 3, text: 'Two gifts, one sticker.' },
  ],
  note: [
    {
      from: 6,
      to: 6,
      text: 'Both names are right. A half of the short spool and a quarter of the long spool are the same ribbon.',
    },
    { from: 1, to: 3, text: 'Any way that makes the length counts: two quarters are as long as a half.' },
  ],
};
