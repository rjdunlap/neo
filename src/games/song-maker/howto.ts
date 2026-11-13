import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a song with jellies, or copy one.',
  steps: [
    { to: 7, text: 'Tap jellies on the loop to place notes; the loop plays round and round.' },
    {
      from: 8,
      text: 'Touch anywhere: the nearest sleeping jelly lights and sings on the loop. One big jelly starts it, and more wake as she lights them, the low row first and the top row last. A touch on a lit jelly puts it out.',
    },
    { from: 3, to: 4, text: 'Copy the song by tapping jellies on its shadow notes.' },
    { from: 5, to: 5, text: 'Copy the song on the little card.' },
    {
      from: 6,
      to: 6,
      text: 'Continue the song pattern (the pet names its shape first: stairs, hops, zigzags, arches, valleys, leaps and more).',
    },
    { from: 7, to: 7, text: 'Listen, then find each note of the tune by ear.' },
  ],
  finish: [
    { to: 2, text: 'The round ends after the song has played a few rounds.' },
    { from: 3, to: 7, text: 'The round ends when the song matches.' },
    {
      from: 8,
      text: 'The round ends a loop after her twelfth light (with at least two jellies lit); putting a jelly out does not count.',
    },
  ],
  note: [
    {
      to: 2,
      text: "Any song is welcome. If at least two jellies are lit at the end, a little tree house button hangs the song in the pet's room, where the pet sings it.",
    },
    { from: 3, to: 5, text: 'The short tune includes a quiet beat: leave that beat empty.' },
    { from: 3, to: 7, text: "A copied song is not hers, so it is not offered for the pet's room." },
    {
      from: 8,
      text: "Any song is welcome and nothing is counted. Her lit jellies can hang in the pet's room from the little tree house button.",
    },
  ],
};
