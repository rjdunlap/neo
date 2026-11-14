import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find opposite words and pictures.',
  steps: [
    {
      to: 1,
      text: 'Tap a picture to flip it to its opposite. Big and small friends step, fast and slow friends move, and the balloon rises or sinks.',
    },
    {
      from: 6,
      to: 6,
      text: 'One big picture. Touch anywhere: it flips to its opposite and the word is said, then it joins the row along the bottom and the next picture comes. Say each word together.',
    },
    { from: 2, to: 2, text: 'Tap the one that is named, like "the big one".' },
    { from: 3, to: 3, text: 'Look at the picture, then tap its opposite.' },
    { from: 4, to: 4, text: 'Tap a picture, then tap its opposite, to match all three pairs.' },
    { from: 5, to: 5, text: 'Five pictures, but only two are opposites. Tap one of them, then the other.' },
    {
      from: 7,
      to: 7,
      text: 'Three pictures of one word: two ends, like empty and full, and one in between. Tap the one in between. After two misses the two ends light up, then the middle one glows.',
    },
  ],
  finish: [
    { to: 1, text: 'Flip eight pictures to finish the round.' },
    { from: 6, to: 6, text: 'Eight pictures in the row finish the round.' },
    { from: 2, to: 2, text: 'Find five named pictures to finish the round.' },
    { from: 3, to: 3, text: 'Find four opposites to finish the round.' },
    { from: 4, to: 4, text: 'Match all three pairs on each of two boards to finish the round.' },
    { from: 5, to: 5, text: 'Find the opposite pair in each of three boards to finish the round.' },
    {
      from: 7,
      to: 7,
      text: 'Find the one in between on four boards (cup, mug, sky, balloon) to finish the round.',
    },
  ],
};
