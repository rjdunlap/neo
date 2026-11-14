import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Hop the frog along a number line.',
  steps: [
    { to: 1, text: 'Tap the lily pad with the number asked for to hop the frog there.' },
    { from: 2, to: 2, text: 'Hop one more or one less: tap the next lily pad up, or the one just before.' },
    {
      from: 3,
      to: 3,
      text: 'Start at the number shown and hop on the number of hops asked for: tap the lily pad where the frog lands.',
    },
    {
      from: 4,
      to: 4,
      text: 'Start at the number shown and hop back the number of hops asked for: tap the lily pad where the frog lands.',
    },
    { from: 5, to: 5, text: 'Count the hops from one number to the other, then tap a number card.' },
    {
      from: 6,
      to: 6,
      text: 'Hop on or back along the long line, and tap the lily pad where the frog lands.',
    },
    {
      from: 7,
      to: 7,
      text: 'The sign shows the whole sum. First tap the number card for the hops that reach 10. Listen to the split, then tap the lily pad where the rest of the hops land.',
    },
    {
      from: 8,
      to: 8,
      text: 'The sign shows a take-away across 10. First tap the number card for the hops back that reach 10. Listen to the split, then tap the lily pad where the rest of the hops back land.',
    },
    { from: 9, to: 9, text: 'Hop quarters and halves: tap where the frog lands.' },
    {
      from: 10,
      to: 10,
      text: 'Land on a lily, then choose how many hops of the other size reach it.',
    },
    {
      from: 11,
      text: 'The sign shows a take-away like 13 − 9. The frog stands on the number taken away and a flag marks the other: count the hops up to the flag, then tap that number card.',
    },
  ],
  finish: 'Answer five questions to bring the frog home.',
  note: 'Two misses show the hops and glow the answer. Help counts once per question; tapping a pad when a number card is wanted is free.',
};
