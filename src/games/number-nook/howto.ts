import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Slide the numbered tiles into row order, with the empty space at the bottom right.',
  steps: [
    'Tap a tile directly above, below, left or right of the empty space to slide it into the gap.',
    'Compare the board with the small goal beside it. Green tiles are in their goal position, but may still need to move.',
    'Undo takes back a slide. Hint outlines a tile on a shortest route from the current board. Start over restores the starting board.',
  ],
  finish:
    'The round ends when every numbered tile and the empty space match the goal. Then it shows your slides and the fewest possible.',
  note: 'Legal exploratory slides are free choices. A tile away from the gap gets a gentle hint; two rejected taps outline a useful slide, counted once while it shows. Undo and Start over preserve the slide count, misses and hints.',
};
