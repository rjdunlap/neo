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
      to: 6,
      text: 'Flip a card showing only a color or only a shape, then tap the next stone ahead of the owl that has it. When none is left, tap the nest.',
    },
    {
      from: 7,
      to: 7,
      text: 'Two cards turn at once. Tap a card, then tap the owl that should take it, and the same for the other card, so that together the two owls hop the most stones. The rings show each hop and the total shows the sum. Tap the green go. A better way gets a gentle hint.',
    },
    {
      from: 8,
      text: 'Flip a color card. The pet says which owl it wants to hop with it. Check the move against the rings: tap the green check if that owl hops the farthest, or tap an owl that hops farther. Then tap its stone, or the nest. The pet is learning too, and half the time it picks a shorter hop.',
    },
  ],
  finish: 'The round ends when the owls are home.',
};
