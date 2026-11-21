import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Lower the lantern to see how much daylight reaches each knot, and plant the seaweed as deep as it can still grow.',
  steps: [
    {
      text: 'Drag the lantern down the rope, or tap a knot; the sun dial opens a petal for each bit of daylight there.',
      from: 1,
      to: 3,
    },
    {
      text: 'Tap the deepest ledge whose dial shows at least as many petals as the seaweed needs.',
      from: 1,
      to: 3,
    },
    {
      text: 'Say whether the seaweed will live deeper or not as deep in the second cove, then find out.',
      from: 3,
      to: 3,
    },
    { text: 'Tap the dial that fits the covered knot: each knot leaves half the light.', from: 4, to: 4 },
  ],
  finish: [
    { text: 'The round ends when the third seaweed is growing.', from: 1, to: 2 },
    { text: 'The round ends when the seaweed is growing in both coves.', from: 3, to: 3 },
    { text: 'The round ends when the third dial is uncovered.', from: 4, to: 4 },
  ],
  note: [
    {
      text: 'The guess about the second cove is free, and so is moving the lantern. A lit ledge that is not the deepest is not a miss. Petals are pretend numbers: in the real sea, seaweed lives in the lit water near the top.',
      from: 3,
      to: 3,
    },
    {
      text: 'About 8 and up. The first question never counts. Petals are pretend numbers on a pretend rope.',
      from: 4,
      to: 4,
    },
    {
      text: 'Moving the lantern is free, and so is planting where she has not measured. A lit ledge that is not the deepest is not a miss. Petals are pretend numbers: in the real sea, seaweed lives in the lit water near the top.',
    },
  ],
};
