import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find opposite words and pictures.',
  steps: [
    {
      to: 1,
      text: 'Tap a picture to flip it to its opposite. Big and small friends step, fast and slow friends move, and the balloon rises or sinks.',
    },
    { from: 2, to: 2, text: 'Tap the one that is named, like "the big one".' },
    { from: 3, to: 3, text: 'Look at the picture, then tap its opposite.' },
    { from: 4, to: 4, text: 'Tap a picture, then tap its opposite, to match all three pairs.' },
    { from: 5, to: 5, text: 'Five pictures, but only two are opposites. Tap one of them, then the other.' },
  ],
  finish: [
    { to: 1, text: 'Flip eight pictures to finish the round.' },
    { from: 2, to: 2, text: 'Find five named pictures to finish the round.' },
    { from: 3, to: 3, text: 'Find four opposites to finish the round.' },
    { from: 4, to: 4, text: 'Match all three pairs on each of two boards to finish the round.' },
    { from: 5, to: 5, text: 'Find the opposite pair in each of three boards to finish the round.' },
  ],
};
