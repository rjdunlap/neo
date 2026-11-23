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
    {
      from: 7,
      to: 7,
      text: 'Loop ten fireflies for the first jar. The shelf has room for three more jars.',
    },
    {
      from: 7,
      to: 7,
      text: 'Tap away the numbers that cannot be right: too few or too many. One sensible number stays.',
    },
    { from: 7, to: 7, text: 'Loop the rest ten at a time and say how many in all.' },
    {
      from: 8,
      to: 8,
      text: 'Catch the number on the sign. A loop of ten fills a jar; a smaller loop rests on the leaf, and ten on the leaf fly into a jar.',
    },
    {
      from: 8,
      to: 8,
      text: 'Tap a jar or the leaf to let its fireflies go. Tap the tick when the jars and the leaf make the number.',
    },
    {
      from: 9,
      to: 9,
      text: 'The jars and the leaf already hold a number. Make it ten more: loop ten fireflies into a jar. Make it ten less: tap a full jar to let its ten go.',
    },
    {
      from: 9,
      to: 9,
      text: 'Leave the leaf as it is and tap the tick. Each round asks for ten more and ten less, once each.',
    },
  ],
  finish:
    'The round ends after grouping the fireflies and answering any total question, or after making the number (at level 9, both numbers).',
};
