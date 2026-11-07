import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Hop the frog along a number line.',
  steps: [
    { to: 1, text: 'Tap the lily pad with the number asked for to hop the frog there.' },
    { from: 2, to: 2, text: 'Hop one more or one less: tap the next lily pad up, or the one just before.' },
    { from: 3, to: 3, text: 'Start at the number shown and hop on the number of hops asked for: tap the lily pad where the frog lands.' },
    { from: 4, to: 4, text: 'Start at the number shown and hop back the number of hops asked for: tap the lily pad where the frog lands.' },
    { from: 5, to: 5, text: 'Count the hops from one number to the other, then tap a number card.' },
    { from: 6, to: 6, text: 'Hop on or back along the long line, and tap the lily pad where the frog lands.' },
    { from: 7, to: 7, text: 'The sign shows the whole sum. First tap the number card for the hops that reach 10. Listen to the split, then tap the lily pad where the rest of the hops land.' },
    { from: 8, text: 'The sign shows a take-away across 10. First tap the number card for the hops back that reach 10. Listen to the split, then tap the lily pad where the rest of the hops back land.' },
  ],
  finish: 'Answer five questions to bring the frog home.',
  note: 'Two misses show the hops and glow the answer. Help counts once per question; tapping a pad when a number card is wanted is free.',
};
