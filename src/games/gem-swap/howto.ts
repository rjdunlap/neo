import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Clear the tray by swapping gems into matching lines.',
  steps: [
    'Tap a gem, then an occupied neighbour to swap them; tap the selected gem again to cancel.',
    {
      text: 'Make a horizontal or vertical line of three matching shapes. Gems above fall into the gaps; no new gems arrive.',
      to: 5,
    },
    {
      text: 'Make lines of matching shapes; gems above fall and none arrive. Every shortest route needs one swap that makes four or five in a line, or two lines crossing.',
      from: 6,
      to: 6,
    },
    {
      text: 'Make lines of matching shapes; no new gems arrive. Grey stones never move or clear: the gems above a stone fall onto it, not past it.',
      from: 7,
      to: 7,
    },
    {
      text: 'Make lines of matching shapes; no new gems arrive. A frosty gem still makes lines and falls, but cannot be swapped until a line clears in a cell right beside it (not diagonally), which thaws it.',
      from: 8,
    },
    'Tap Undo to revise a swap, or Restart to bring back the starting tray.',
    'Tap Hint to outline a swap that starts a clearing route.',
  ],
  finish: 'The round ends when every gem is cleared (the stones stay); there is no turn limit.',
  note: 'A swap that makes no line stays put and counts as a miss; tapping a stone or a frosty gem is not a miss. Undo keeps your swap count; Restart counts as help. If no clearing route remains, revise with Undo or Restart.',
};
