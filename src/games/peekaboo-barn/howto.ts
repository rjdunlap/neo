import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find the animals hiding in the barnyard or garden.',
  steps: [
    { from: 16, to: 16, text: 'Touch anywhere on the screen: the big house opens and an animal says hello. If she waits, it opens by itself.' },
    { from: 1, to: 2, text: 'Tap a hiding place to see who is behind it. Sometimes the animal is sleepy, surprised or singing, and the voice says so.' },
    { from: 3, to: 5, text: 'Listen for the animal asked about, then tap where it is peeking.' },
    { from: 6, to: 8, text: 'Watch who hides where, then tap the hiding place of the animal asked about.' },
  ],
  finish: [
    { from: 16, to: 16, text: 'The round ends after six touched reveals; the house opening by itself does not count.' },
    { to: 1, text: 'The round ends after eight reveals.' },
    { from: 2, to: 2, text: 'The round ends after twelve reveals.' },
    { from: 3, to: 8, text: 'The round ends when every animal asked about has been found.' },
  ],
};
