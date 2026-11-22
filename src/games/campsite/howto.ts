import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pitch one tent beside each tree so every row and column has the number of tents on its sign, with no two tents touching, even at a corner.',
  steps: [
    {
      to: 1,
      text: 'Tap grass to pitch a tent; tap a tent to pack it away. Tap a tree to light up the squares beside it.',
    },
    {
      to: 1,
      text: 'Two tents meeting at a corner still touch: they wobble in a red ring. The signs fill in as tents go up; a zero sign means none in that line.',
    },
    'Check camp judges the camp. Show a hint glows the next tent to pitch, or one to pack up, and says why.',
  ],
  finish: 'Check camp with three tents in the right places and the campers come out.',
  note: 'Tents can move freely. Checking with fewer than three tents, or a camp already checked, is free; each new full wrong camp counts once, and the second brings the hint by itself.',
};
