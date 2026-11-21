import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Put one bunny in every row, every column and every patch of the meadow, with no two bunnies touching, even at a corner.',
  steps: [
    {
      to: 2,
      text: 'Tap a square to put a bunny there; tap the bunny to take it back. A bunny with a flag was there from the start and stays.',
    },
    {
      to: 2,
      text: 'The faded squares with a leaf are ones a bunny already covers: its row, column, patch and neighbours.',
    },
    {
      from: 3,
      text: 'Tap a square once for a paw mark ("not here"), twice for a bunny, a third time to clear it. The Lamp button shows what each bunny covers.',
    },
    'Hint glows the next square that has to be right, or a bunny to take back.',
  ],
  finish: 'The round ends by itself when every row, column and patch has exactly one bunny and none touch.',
  note: 'Bunnies that clash wobble and sit in a ring at once, free. Only a full board that is wrong counts once, with a spoken hint; marks and moves along the way are never wrong.',
};
