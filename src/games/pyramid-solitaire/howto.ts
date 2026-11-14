import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Clear the pyramid by lifting exposed pairs that add to thirteen, or a king alone.',
  steps: [
    { text: 'Tap two exposed cards that add to 13. A = 1, J = 11, Q = 12; tap a K = 13 by itself.', to: 4 },
    {
      text: 'Tap two exposed cards that add to 13 (A = 1, J = 11, Q = 12; K alone), or an exposed card then the card only it still lies on.',
      from: 5,
      to: 5,
    },
    {
      text: 'Tap two exposed cards that add to 13 (A = 1, J = 11, Q = 12; K alone). The five shelf cards are always exposed and are cleared too.',
      from: 6,
      to: 6,
    },
    {
      text: 'Tap two exposed cards that add to 13. A = 1, J = 11, Q = 12; tap a K = 13 by itself. Seven rows: plan which copy to spend.',
      from: 7,
      to: 7,
    },
    {
      text: 'Tap two exposed cards that add to 13 (A = 1, J = 11, Q = 12; K alone). In each spare column only the front card is exposed; clear the columns too.',
      from: 8,
      to: 8,
    },
    {
      text: 'Tap two exposed cards that add to 13 (A = 1, J = 11, Q = 12; K alone). One choice of copy keeps the deal clearable; a losing pair outlines the card left without a partner.',
      from: 9,
    },
    'A card is exposed when both cards directly below it have gone. Each corner repeats the rank; the status line counts pairs open.',
    'Tap the selected card again to cancel. Undo restores a removal; Start over restores this same deal.',
    'Hint outlines a clearing move. On a blocked route it restores the nearest solvable position first.',
  ],
  finish: 'Clearing every card finishes the round, including with help.',
  note: [
    {
      text: 'A mismatched exposed pair counts one miss; two give a hint. Covered-card taps and legal experiments are free. Undo and Start over preserve misses and hints. Every deal comes from a real pack and clears; there is no stock.',
      to: 4,
    },
    {
      text: 'A wrong sum counts one miss; two give a hint. Covered-card taps are free. Every deal clears.',
      from: 5,
    },
  ],
};
