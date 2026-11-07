import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Clear the tray by swapping gems into matching lines.',
  steps: [
    'Tap a gem, then an occupied neighbour to swap them; tap the selected gem again to cancel.',
    'Make a horizontal or vertical line of three matching shapes. Gems above fall into the gaps; no new gems arrive.',
    'Tap Undo to revise a swap, or Restart to bring back the starting tray.',
    'Tap Hint to outline a swap that starts a clearing route.',
  ],
  finish: 'The round ends when every gem is cleared; there is no turn limit.',
  note: 'A swap that makes no line stays put and counts as a miss. Undo keeps your swap count; Restart counts as help. If no clearing route remains, revise with Undo or Restart.',
};
