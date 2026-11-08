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
      to: 4,
      text: 'The sign shows a sum, like 6 + 4. Tap two other fruit that add up to the same; they hop into the boxes.',
    },
    {
      from: 5,
      to: 5,
      text: 'Tap two fruit that add up to the number; they hop into the boxes. Tap a fruit in a box to put it back.',
    },
    {
      from: 6,
      text: 'Tap three fruit that add up to the number; they hop into the three boxes. Tap a fruit in a box to put it back.',
    },
    'Tap the green check to see what you made. Any way that makes the number counts.',
  ],
  finish: [
    { to: 3, text: 'The round ends after two different ways to make the number.' },
    { from: 4, to: 4, text: 'The round ends after two different pairs that make the same as the sign.' },
    {
      from: 5,
      to: 5,
      text: 'Each right pair drops into the basket, and the round ends when the tree is empty.',
    },
    { from: 6, text: 'The round ends after two different sets of three fruit that make the number.' },
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
      to: 4,
      text: 'A try that makes another number tells how much it made and how much the sign makes. The sign’s own two numbers are not a miss; they just ask for a different pair. After two misses a glow shows a fruit to start with, then its partner. Each way is written like 7 + 5 = 6 + 4.',
    },
    {
      from: 6,
      text: 'Finding two fruit that make ten first, then adding the third, is a good way in. A check with only two fruit asks for a third and is not a miss; the same three numbers in another order are the same way. After two misses a glow shows the fruit to use, a pair that makes ten first.',
    },
    {
      from: 5,
      to: 5,
      text: 'Every fruit on the tree has a partner, so any right pair keeps the tree clearable. Two fruit with the same numbers as a pair already in the basket are a new pair. A try that makes another number tells how much it made; after two misses a glow shows a fruit to start with, then its partner.',
    },
  ],
};
