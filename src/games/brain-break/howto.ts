import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Light every numbered stone by finding the numbers in order.',
  steps: [
    { to: 3, text: 'Tap the stone with the number shown above the pond.' },
    { to: 3, text: 'Find the next number on the same shuffled board. Checked stones stay where they are.' },
    { from: 4, text: 'Each stone shows a sum. Find the one that makes the number on the sign; a lit stone shows its answer.' },
    { from: 6, text: 'Some stones take away, such as 12 − 3.' },
    'Hint outlines the next stone; there is no time limit.',
  ],
  finish: 'Finding the final number finishes the round, including with help.',
  note: 'A different unfinished number counts a miss. Two consecutive misses reveal a hint. Checked stones can be touched freely. This is number-search practice, without claims about general brain training.',
};
