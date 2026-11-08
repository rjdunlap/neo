import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Group fireflies by drawing loops around them.',
  steps: [
    'Draw a loop around fireflies with one finger and close it where it started; they fly into a jar.',
    { from: 2, to: 2, text: 'Loop exactly the number of fireflies the jar wants (2 or 3).' },
    { from: 3, to: 3, text: 'Loop fireflies five at a time, then count by fives and any ones left over.' },
    { from: 4, to: 4, text: 'Loop fireflies ten at a time, then say how many in all: tens and ones.' },
    { from: 5, to: 5, text: 'Make the groups asked for, like "3 groups of 4", then say how many in all.' },
    {
      from: 6,
      to: 6,
      text: 'Tap a number card to guess about how many fireflies there are. Any guess is fine.',
    },
    { from: 6, to: 6, text: 'Loop ten fireflies for the first jar, then keep your guess or tap a new one.' },
    {
      from: 6,
      to: 6,
      text: 'Loop the rest ten at a time and say how many in all; the pet compares it with your guess.',
    },
  ],
  finish: 'The round ends after grouping the fireflies and answering any total question.',
};
