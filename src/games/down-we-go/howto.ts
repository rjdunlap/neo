import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Lower the lantern to see how much daylight reaches each knot, and plant the seaweed as deep as it can still grow.',
  steps: [
    'Drag the lantern down the rope, or tap a knot; the sun dial opens a petal for the daylight there.',
    'Tap the deepest ledge whose dial shows at least as many petals as the seaweed needs.',
  ],
  finish: 'The round ends when the third seaweed is growing.',
  note: 'Moving the lantern is free, and so is planting where she has not measured. A lit ledge that is not the deepest is not a miss. Petals are pretend numbers: in the real sea, seaweed lives in the lit water near the top.',
};
