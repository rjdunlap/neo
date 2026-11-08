import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make what the sign shows from two numbered fruit, and then find a different way to make it.',
  steps: [
    { to: 2, text: 'Tap two fruit; they hop into the boxes. Tap a fruit in a box to put it back.' },
    {
      from: 3,
      to: 3,
      text: 'Tap two fruit, then a leaf to choose plus or take away. The fruit you tap first is the one you start from.',
    },
    {
      from: 4,
      text: 'The sign shows a sum, like 6 + 4. Tap two other fruit that add up to the same; they hop into the boxes.',
    },
    'Tap the green check to see what you made. Any way that makes the number counts.',
  ],
  finish: [
    { to: 3, text: 'The round ends after two different ways to make the number.' },
    { from: 4, text: 'The round ends after two different pairs that make the same as the sign.' },
  ],
  note: [
    {
      to: 2,
      text: 'A try that makes another number tells how much it made, and you can swap a fruit and check again. After two misses a glow shows the next step: a fruit to start with, then its partner. Adding the same two fruit the other way round is the same way.',
    },
    {
      from: 3,
      to: 3,
      text: 'A try that makes another number tells how much it made, and you can swap a fruit and check again. After two misses a glow shows the next step: a fruit to start with, then its partner and the leaf. Taking away more than you have just says so, and is not a miss.',
    },
    {
      from: 4,
      text: 'A try that makes another number tells how much it made and how much the sign makes. The sign’s own two numbers are not a miss; they just ask for a different pair. After two misses a glow shows a fruit to start with, then its partner. Each way is written like 7 + 5 = 6 + 4.',
    },
  ],
};
