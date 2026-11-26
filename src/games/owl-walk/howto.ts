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
      text: 'Flip a color card, then tap the next stone of that color for your owl, the purple one. Take turns with the pet, who plays the brown owl. The matching stones twinkle. A grown-up can tap the round seat button to play the pet’s owl: the pet then waits for their stone.',
    },
    {
      from: 3,
      to: 3,
      text: 'Flip a color card, tap the owl you choose, then tap the next stone of that color ahead of it. When no stone of that color is left, tap the nest. Take turns with the pet. A grown-up can tap the round seat button to play the pet’s owl: the pet then waits for their stone.',
    },
    {
      from: 4,
      to: 4,
      text: 'Flip a color card, tap the owl that hops the farthest with it (the rings show how far), then tap its stone, or the nest when no stone of that color is left. A grown-up can tap the round seat button to play the pet’s owl: the pet then waits for their stone.',
    },
    {
      from: 5,
      to: 5,
      text: 'Tap any stepping stone ahead of the owl, and it hops there, a note on every stone. Tap the nest to fly home. Nothing is wrong.',
    },
    {
      from: 6,
      text: 'Flip a card showing only a color or only a shape, then tap the next stone ahead of the owl that has it. When none is left, tap the nest.',
    },
  ],
  finish: 'The round ends when the owls are home.',
};
