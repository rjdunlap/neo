import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Bring the owls home across the stepping stones.',
  steps: [
    {
      to: 1,
      text: 'Flip a color card, then tap the next stone of that color ahead of the owl. The owl hops there. The matching stones twinkle.',
    },
    {
      from: 2,
      to: 2,
      text: 'Flip a color card, then tap the next stone of that color for your owl, the purple one. Take turns with the pet, who plays the brown owl. The matching stones twinkle.',
    },
    {
      from: 3,
      to: 3,
      text: 'Flip a color card, tap the owl you choose, then tap the next stone of that color ahead of it. When no stone of that color is left, tap the nest. Take turns with the pet.',
    },
    {
      from: 4,
      text: 'Flip a color card, tap the owl that hops the farthest with it (the rings show how far), then tap its stone, or the nest when no stone of that color is left.',
    },
  ],
  finish: 'The round ends when the owls are home.',
};
