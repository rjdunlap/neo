import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
const PAIR =
  'Tap two tiles with the same picture. Each needs a clear top and an open left or right side. Bright tiles are free.';

const PEEK =
  'Tap Peek to see the pictures in each stack, bottom to top from left to right. Tap Peek or a tile to close. Looking is free.';

export const HOW_TO: GameHowTo = {
  goal: 'Clear the stack by removing matching pairs.',
  steps: [
    { text: PAIR, to: 7 },
    {
      text: 'Tap two tiles with the same picture, or any two flowers. Each needs a clear top and an open left or right side.',
      from: 8,
      to: 8,
    },
    // Level 9's wide stack has no flowers.
    { text: PAIR, from: 9 },
    'Tap a selected tile again to cancel it. A different picture gives a gentle reminder; neither tile is removed.',
    { text: PEEK, to: 6 },
    {
      text: 'Tap Peek to see the pictures in each stack, bottom to top from left to right; a four-tile stack reads in two rows. Tap Peek or a tile to close. Looking is free.',
      from: 7,
      to: 10,
    },
    // The lesson boards' stacks are at most three deep.
    { text: PEEK, from: 17 },
    {
      text: 'Undo restores a pair or shuffle. Hint outlines a clearing pair. Shuffle puts the remaining tiles in open rows.',
      to: 10,
    },
    {
      text: 'Each short board has one trap. If a pair leaves no way to finish, its lesson is spoken; Undo goes back to the choice. Hint outlines a clearing pair.',
      from: 17,
    },
  ],
  finish: 'The round ends when all tiles are gone, with one sticker even when you use help.',
  note: 'Undo and Shuffle are counted. Hint and Shuffle count as help. Exploring a blocked tile is free.',
};
