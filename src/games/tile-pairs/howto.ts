import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Clear the stack by removing matching pairs.',
  steps: [
    'Tap two tiles with the same picture. Each needs a clear top and an open left or right side. Bright tiles are free.',
    'Tap a selected tile again to cancel it. A different picture gives a gentle reminder; neither tile is removed.',
    'Undo restores the last pair or shuffle. Hint outlines a pair on a clearing route.',
    'Shuffle brings the remaining pictures into solvable open rows. Removed tiles stay removed; each shuffle counts as help.',
  ],
  finish: 'The round ends when all tiles are gone, with one sticker even when you use help.',
  note: 'There is no clock or loss screen. Undo and Shuffle are counted. A hint is help; a blocked tile is exploration and does not count as a mistake.',
};
