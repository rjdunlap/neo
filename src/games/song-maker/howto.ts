import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a song with jellies, or copy one.',
  steps: [
    'Tap jellies on the loop to place notes; the loop plays round and round.',
    { from: 3, to: 4, text: 'Copy the song by tapping jellies on its shadow notes.' },
    { from: 5, to: 5, text: 'Copy the song on the little card.' },
    {
      from: 6,
      to: 6,
      text: 'Continue the song pattern (the pet names its shape first: stairs, hops, zigzags, arches, valleys, leaps and more).',
    },
    { from: 7, text: 'Listen, then find each note of the tune by ear.' },
  ],
  finish: [
    { to: 2, text: 'The round ends after the song has played a few rounds.' },
    { from: 3, text: 'The round ends when the song matches.' },
  ],
  note: [
    {
      to: 2,
      text: "Any song is welcome. If at least two jellies are lit at the end, a little tree house button hangs the song in the pet's room, where the pet sings it.",
    },
    { from: 3, to: 5, text: 'The short tune includes a quiet beat: leave that beat empty.' },
    { from: 3, text: "A copied song is not hers, so it is not offered for the pet's room." },
  ],
};
