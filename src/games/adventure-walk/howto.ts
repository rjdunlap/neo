import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Walk to the friend's picnic, choosing how to get past each place on the way.",
  steps: [
    { from: 1, to: 1, text: 'Tap a way past each place: both ways are fine.' },
    { from: 2, to: 2, text: 'Listen to the friend, then tap the way they ask for.' },
    { from: 3, to: 3, text: 'The friend asks for two ways at once; tap them in order.' },
    { from: 2, to: 3, text: "Tap the friend's picture to hear the way again." },
  ],
  finish: 'The friends sit down together on the picnic blanket.',
  note: [
    { from: 1, to: 1, text: 'Every choice is right, and the pet says the word for the way chosen. Nobody is asked to move: the pet does the walking.' },
    { from: 2, to: 3, text: "Taking the other way is a miss, with both ways named; after two misses at one place the asked-for way glows, which counts as a hint. Hearing the request again is never counted. Nobody is asked to move: the pet does the walking." },
  ],
};
