import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Leave exactly one marble on the triangle.',
  steps: [
    'Tap a marble to select it. Tap it again to cancel, or another marble to change selection.',
    'Tap an empty hole two spaces away in a straight line, jumping over one marble. The marble arcs over its neighbour, which drops into the pocket along the bottom of the tray. Each marble keeps its colour all round.',
    'Undo takes back a jump; Start over restores this same puzzle.',
    'Hint outlines a clearing jump; tapping it again repeats the hint without counting another. If your route cannot finish, it first takes back jumps to the nearest board that can.',
  ],
  finish: 'The round ends as soon as one marble remains.',
  note: 'Trying a legal route is free exploration. Only an attempted illegal jump counts as a miss. Undo and Start over keep misses and hints.',
};
