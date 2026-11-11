import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Clear the stack by removing matching pairs.',
  steps: [
    'Tap two tiles with the same picture. Each needs a clear top and an open left or right side. Bright tiles are free.',
    'Tap a selected tile again to cancel it. A different picture gives a gentle reminder; neither tile is removed.',
    'Tap Peek to see the pictures in each stack, bottom to top from left to right. Tap Peek or a tile to close. Looking is free.',
    'Undo restores a pair or shuffle. Hint outlines a clearing pair. Shuffle puts the remaining tiles in open rows.',
  ],
  finish: 'The round ends when all tiles are gone, with one sticker even when you use help.',
  note: 'Undo and Shuffle are counted. Hint and Shuffle count as help. Exploring a blocked tile is free.',
};
