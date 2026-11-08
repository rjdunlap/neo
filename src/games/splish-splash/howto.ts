import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Give the pet a bath.',
  steps: [
    { to: 2, text: 'Rub or pat a finger over the mud to scrub it off.' },
    {
      from: 9,
      to: 9,
      text: 'Pat anywhere on the screen: each pat washes a third of the nearest patch of mud away.',
    },
    {
      from: 3,
      to: 6,
      text: 'Rub a finger over the body part the pet names to wash it, then the next one it asks for.',
    },
    { from: 7, to: 7, text: 'Rub a finger over each of the two body parts the pet names.' },
    { from: 8, to: 8, text: 'Wash the two body parts in the order the pet says: first one, then the other.' },
  ],
  finish: [
    { to: 2, text: 'The round ends when the mud is all gone.' },
    { from: 3, to: 8, text: 'The round ends when everything asked for is clean.' },
    { from: 9, to: 9, text: 'The round ends when the mud is all gone.' },
  ],
  note: [
    {
      to: 2,
      text: 'The pet names each part at its first touch and again when it is clean. After a quiet spell a muddy spot sparkles and the pet wiggles; that is an invitation, not help.',
    },
    {
      from: 3,
      to: 8,
      text: 'Washing the wrong part just makes the pet giggle and repeats the request. Each part is named when it is clean.',
    },
    { from: 9, to: 9, text: 'The pet names each part at its first pat and again when it is clean.' },
  ],
};
