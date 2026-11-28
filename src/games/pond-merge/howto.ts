import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Drop friends so two the same pop into a bigger one.',
  steps: [
    { from: 1, to: 1, text: 'Slide a friend along the top, then let go.' },
    { from: 1, to: 3, text: 'Two the same make the next size up.' },
    { from: 1, to: 3, text: 'Take back is always free.' },
  ],
  finish: 'Make the goal friend to finish.',
  note: 'A full pond never ends the round: the smallest friends just float away. Nothing counts as a miss; the Hint button shows a ghost where a friend would pop, which counts as a hint.',
};
