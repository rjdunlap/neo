import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Make a ribbon as long as the gift's tag asks, using halves and quarters of the whole.",
  steps: [
    'Tap a piece and it joins the ribbon.',
    'Tap a piece on the ribbon to take it back.',
    { from: 2, to: 3, text: 'Tap the scissors, then a half, to snip it into two quarters.' },
    'Tap the bow to check.',
  ],
  finish: 'Two gifts, one sticker.',
  note: 'Any way that makes the length counts: two quarters are as long as a half.',
};
