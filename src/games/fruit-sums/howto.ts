import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make the number on the sign from two numbered fruit, and then find a different way to make it.',
  steps: [
    { to: 2, text: 'Tap two fruit; they hop into the boxes. Tap a fruit in a box to put it back.' },
    { from: 3, text: 'Tap two fruit, then a leaf to choose plus or take away. The fruit you tap first is the one you start from.' },
    'Tap the green check to see what you made. Any way that makes the number counts.',
  ],
  finish: 'The round ends after two different ways to make the number.',
  note: [
    { to: 2, text: 'A try that makes another number tells how much it made, and you can swap a fruit and check again. After two misses a glow shows the next step: a fruit to start with, then its partner. Adding the same two fruit the other way round is the same way.' },
    { from: 3, text: 'A try that makes another number tells how much it made, and you can swap a fruit and check again. After two misses a glow shows the next step: a fruit to start with, then its partner and the leaf. Taking away more than you have just says so, and is not a miss.' },
  ],
};
