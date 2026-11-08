import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Listen to the clue and find the friend it is about.',
  steps: [
    'Tap the sign any time to hear the clue again.',
    { from: 1, to: 1, text: 'Tap the friend the clue fits.' },
    {
      from: 2,
      to: 3,
      text: 'Tap each friend the clue rules out to turn it over; the next clue comes when they are all down.',
    },
    { from: 2, to: 3, text: 'Tap a turned-over friend to peek at it.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'The friend who fits jumps out and says its name.' },
    { from: 2, to: 3, text: 'The last friend left jumps out and says its name.' },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'Hearing a clue again is never counted against her. Tapping a friend the clue does not fit counts as a miss, with the reason spoken; after two the right friend glows, which counts as a hint.',
    },
    {
      from: 2,
      to: 3,
      text: 'Hearing a clue again and peeking at a hidden friend are never counted against her. Turning over a friend the clue keeps counts as a miss, with the reason spoken; after two on one clue the friends it rules out shimmer, which counts as a hint.',
    },
  ],
};
