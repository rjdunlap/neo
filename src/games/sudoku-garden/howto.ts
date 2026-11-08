import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Fill the bed so every row, column and box (or patch) holds each number once.',
  steps: [
    'Tap a square, then tap a number to put it there. A clash lights up red.',
    'Tap Marks to pencil small notes; Erase takes a number or its notes out.',
    {
      from: 4,
      to: 6,
      text: 'Fill marks pencils every number that still fits into each empty square without notes of its own. It reads only the rules on the board, so it is free, not a hint.',
    },
    {
      from: 8,
      to: 8,
      text: 'Fill marks pencils every number that still fits (free, not a hint). A number with only two places in each of two rows, in the same two columns, takes opposite corners, so it leaves the rest of those columns.',
    },
    {
      from: 9,
      to: 9,
      text: 'The bed is cut into odd-shaped patches, outlined and tinted. Each patch, like each row and column, holds every number once.',
    },
    {
      from: 10,
      to: 10,
      text: 'The small number in each dashed cage is what its squares add up to, and no number repeats in a cage.',
    },
    'Tap Hint to see which square to try next; Start over begins the bed again.',
  ],
  finish: 'The bed is done when every square holds the right number.',
  note: 'A number that does not belong bumps, glows red and gets a spoken hint; it counts as a miss, and a hint counts as help. Taking a number out is free.',
};
