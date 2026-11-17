import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Walk to the friend's picnic, choosing how to get past each place on the way.",
  steps: [
    { from: 1, to: 1, text: 'Tap a way past each place: both ways are fine.' },
    { from: 2, to: 2, text: 'Listen to the friend, then tap the way they ask for.' },
    { from: 3, to: 3, text: 'The friend asks for two ways at once; tap them in order.' },
    { from: 2, to: 3, text: "Tap the friend's picture to hear the way again." },
    {
      from: 5,
      to: 5,
      text: "Listen to the friend's three ways, tap a flag to look along its trail, and tap it again to walk it.",
    },
    { from: 5, to: 5, text: "Tap the friend's picture to hear the way again." },
    {
      from: 4,
      to: 4,
      text: 'Walk to the picnic any way she likes, then tap the places in the order the walk home comes to them.',
    },
  ],
  finish: [
    { from: 4, to: 5, text: 'The pet walks back to its door.' },
    { from: 1, to: 3, text: 'The friends sit down together on the picnic blanket.' },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'Every choice is right, and the pet says the word for the way chosen. Nobody is asked to move: the pet does the walking.',
    },
    {
      from: 2,
      to: 3,
      text: 'Taking the other way is a miss, with both ways named; after two misses at one place the asked-for way glows, which counts as a hint. Hearing the request again is never counted. Nobody is asked to move: the pet does the walking.',
    },
    {
      from: 4,
      to: 4,
      text: 'The walk out is free. On the map a place that is not next is a miss; after two on one leg the next place glows, which counts as a hint. Nobody is asked to move: the pet does the walking.',
    },
    {
      from: 5,
      to: 5,
      text: 'Looking along a trail is never counted. Walking a trail the friend did not describe is a miss, and it is marked where it went wrong; when one trail is left it glows, which counts as a hint. A round with both glows is the only kind that counts as a struggle. Nobody is asked to move: the pet does the walking.',
    },
  ],
};
