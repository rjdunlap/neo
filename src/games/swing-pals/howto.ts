import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Push your friends on the swing, then find the rope that swings along.',
  steps: [
    {
      from: 1,
      to: 1,
      text: 'Tap to push. Every push swings a little more, up to the bell, the chimes, the apple or the nest.',
    },
    {
      from: 2,
      to: 3,
      text: 'Tap and the push waits for your friend to come back. One push each swing goes up fastest.',
    },
    {
      from: 3,
      to: 3,
      text: 'Push each swing up to its bell, chimes, apple or nest. The short rope comes back quicker.',
    },
    { from: 4, to: 6, text: 'Tap a hook to hang her rope there. Both swings let go together.' },
    { from: 4, to: 8, text: 'A long rope swings slower, a short rope faster.' },
    { from: 5, to: 6, text: 'A heavy friend swings at the same beat as a light one.' },
    { from: 6, to: 6, text: 'A big swing and a small swing on the same rope come back together.' },
    {
      from: 7,
      to: 7,
      text: 'Two friends on different ropes are pulled back. Tap the friend you think will come back first, then watch them both let go.',
    },
    {
      from: 8,
      to: 8,
      text: "The dots under the pet's swing show what to make: yours back twice for each of the pet's, once for every two, or together. Tap a hook; a clap means both are back at once.",
    },
  ],
  finish: [
    { from: 1, to: 3, text: 'Every friend reaches the bell, chimes, apple or nest.' },
    { from: 4, to: 6, text: 'Every pair swings together.' },
    { from: 7, to: 7, text: 'Three races are watched, whoever she picks.' },
    { from: 8, to: 8, text: 'Every pair swings the way the dots ask.' },
  ],
  note: [
    { from: 1, to: 6, text: 'A push never takes height away, and her timing is never counted against her.' },
    {
      from: 1,
      to: 3,
      text: 'Show a hint in the pause sheet gives two pushes with her, which counts as a hint.',
    },
    {
      from: 4,
      to: 6,
      text: 'Her rope starts on a wrong hook; watching it there first is free. Another hook that swings apart counts as a miss. Once two hooks have swung apart, the right hook glows, which counts as a hint: with three hooks it only confirms the last one left.',
    },
    {
      from: 8,
      to: 8,
      text: 'Her starting hook is a free look; another hook that misses the asked-for beat counts as a miss, and the right hook glows once two hooks have missed, which counts as a hint.',
    },
    {
      from: 7,
      to: 7,
      text: 'A guess is never a miss: the friend who came back first is named. Show a hint in the pause sheet lights the shorter rope before she taps, which counts as a hint.',
    },
    {
      from: 1,
      to: 8,
      text: "The swing follows the small-swing rule: only the rope's length changes how fast it swings back and forth. That is close to real swings, not exact.",
    },
  ],
};
