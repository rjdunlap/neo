import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Slide the numbered tiles into row order, with the empty space at the bottom right.',
  steps: [
    'Tap a tile in the row or column of the empty space: it and any tiles between slide toward the gap, one slide per tile.',
    'Compare the board with the small goal beside it. Green tiles are in their goal position, but may still need to move.',
    'Undo takes back the last tap, a whole line at once. Hint outlines a tile on a shortest route. Start over restores the starting board.',
  ],
  finish:
    'The round ends when every numbered tile and the empty space match the goal. Then it shows your slides and the fewest possible.',
  note: 'Legal exploratory slides are free choices. A tap outside the gap’s row and column gets a gentle hint; two rejected taps outline a useful slide, counted once. Undo and Start over preserve the slide count, misses and hints.',
};
