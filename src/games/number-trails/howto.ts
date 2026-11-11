import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Draw a numeral by following the firefly, then meet that many things and count them.',
  steps: [
    {
      from: 5,
      text: 'Tap each thing to count it aloud, then tap the number card that tells how many. Zero is an empty basket.',
    },
    'Put your finger on the firefly and follow its path from the glowing dot, along the arrow. A numeral with two parts takes two touches.',
    {
      from: 4,
      to: 4,
      text: 'First numbers draws only 1, 2, 3 and 7: each is one touch from the top, with no lift.',
    },
    { to: 2, text: 'When the numeral is done, the things pop up one at a time. Count them aloud together.' },
    {
      from: 4,
      to: 4,
      text: 'When the numeral is done, the things pop up one at a time. Count them aloud together.',
    },
    {
      from: 3,
      to: 3,
      text: 'When the numeral is done, tap the sleeping things to wake exactly that many. Count as you tap.',
    },
  ],
  finish: [
    { to: 2, text: 'The round ends after the last thing has been counted.' },
    { from: 3, to: 3, text: 'The round ends when exactly the right number are awake.' },
    { from: 4, to: 4, text: 'The round ends after the last thing has been counted.' },
    { from: 5, text: 'The round ends when the numeral is written and the things come back beside it.' },
  ],
  note: [
    {
      to: 3,
      text: 'Zero has no things: the round ends with “zero” said aloud. Wandering off the trail is a gentle miss; counting things can never be wrong.',
    },
    {
      from: 4,
      to: 4,
      text: 'The trail is a little wider here. Wandering off it is a gentle miss; counting things can never be wrong.',
    },
    {
      from: 5,
      text: 'Counting taps are never wrong. A wrong card is a gentle miss and the group is counted again; a second one makes the right card glow.',
    },
  ],
};
