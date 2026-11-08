import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pull the rope to lift the crate up to a friend, and hang the wheels so a heavy crate gets light.',
  steps: [
    { from: 1, to: 1, text: "Drag the rope's end down, again and again, until the crate reaches the ledge." },
    {
      from: 2,
      to: 2,
      text: 'Push the crate up, or hang the wheel on the branch and pull the rope down. Both take the same friends.',
    },
    {
      from: 3,
      to: 6,
      text: "Drag a wheel to the branch hook or the crate's hook. The rope shows where the pull ends and how many paws it needs.",
    },
    {
      from: 3,
      to: 6,
      text: 'A wheel on the crate, held by two ropes, needs half the paws, and twice as much rope comes past.',
    },
    { from: 4, to: 4, text: 'Guess how many knots will go by, then pull and count them.' },
    { from: 5, to: 6, text: 'Pick wheels that end the rope at the friends who will pull.' },
    {
      from: 6,
      to: 6,
      text: 'Say how many paws the rope will need and how many knots will pass, then pull to check.',
    },
  ],
  finish: 'Every parcel reaches its friend on the ledge.',
  note: [
    { text: 'Pulling is never counted against her, and a crate that is too heavy only wobbles.' },
    {
      from: 3,
      to: 6,
      text: 'After a parcel arrives, the round arrow button hauls it up again while the pet counts the knots aloud; watching is never a miss or a hint.',
    },
    { from: 4, to: 4, text: 'The knot guess is a prediction, never a miss.' },
    {
      from: 5,
      to: 6,
      text: 'Pulling with wheels that cannot lift it, or that end at the wrong friends, counts as a miss; after two the right hooks glow, which counts as a hint.',
    },
    { from: 6, to: 6, text: 'A wrong number card counts as a miss, and the right one then lights.' },
    {
      from: 1,
      to: 2,
      text: "Show a hint in the pause sheet puts the pet's paw on the rope to pull a stroke with her, which counts as a hint.",
    },
    {
      text: 'The rope follows the ideal rule: two ropes holding the crate halve the pull and double the rope, and nothing rubs or weighs anything. Real ropes and wheels lose a little to friction.',
    },
  ],
};
