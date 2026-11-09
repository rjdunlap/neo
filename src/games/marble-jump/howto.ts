import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Leave exactly one marble on the triangle.',
  steps: [
    'Tap a marble to select it. Tap it again to cancel, or another marble to change selection.',
    'Tap an empty hole two spaces away in a straight line, jumping over one marble. The jumped marble drops into the pocket below the tray.',
    'Undo takes back a jump; Start over restores this same puzzle.',
    'Hint outlines a clearing jump; tapping it again repeats the hint without counting another. If your route cannot finish, it first takes back jumps to the nearest board that can.',
  ],
  finish: [
    {
      from: 8,
      to: 8,
      text: 'The gold marble may jump but is never jumped (trying counts a miss), so it is left last. The end shows your moves and the fewest possible.',
    },
    {
      from: 7,
      text: 'The last marble must stop on the star; one elsewhere is not a finish, so Undo or Hint. The end shows your moves and the fewest possible.',
    },
    {
      text: 'The round ends as soon as one marble remains, and shows your moves and the fewest possible (a chain by one marble is one move).',
    },
  ],
  note: 'Trying a legal route is free exploration. Only an attempted illegal jump counts as a miss. Undo and Start over keep misses and hints.',
};
