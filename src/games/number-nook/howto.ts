import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Slide the numbered tiles to match the small goal, with the empty space at the bottom right.',
  steps: [
    'Tap a tile in the row or column of the empty space: it and any tiles between slide toward the gap, one slide per tile.',
    {
      from: 1,
      to: 4,
      text: 'Compare the board with the small row-order goal. Green tiles are in place, but may still need to move.',
    },
    {
      from: 5,
      to: 5,
      text: 'Read down each column of the goal: 1, 2, 3; then 4, 5, 6. Green tiles match that goal, but can still move.',
    },
    {
      from: 6,
      to: 6,
      text: 'Try building the top row first. Once 1 through 4 are in place, use the two rows below to finish.',
    },
    'Undo takes back the last tap, a whole line at once. Hint outlines a tile on a shortest route. Start over restores the starting board.',
  ],
  finish:
    'The round ends when every numbered tile and the empty space match the goal. Then it shows your slides and the fewest possible.',
  note: 'Legal exploratory slides are free choices. A tap outside the gap’s row and column gets a gentle hint; two rejected taps outline a useful slide, counted once. Undo and Start over preserve the slide count, misses and hints.',
};
