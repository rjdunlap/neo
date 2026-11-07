import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Feed the animals their favorite snacks.',
  steps: [
    { to: 1, text: 'Tap an animal to hear it munch its snack.' },
    { from: 2, to: 2, text: 'Tap a snack and it floats to the animal who loves it.' },
    { from: 3, to: 3, text: 'Tap the animal that eats the food asked for. Every second question plays an animal sound instead: tap the animal that makes it, or tap the speaker to hear it again.' },
    { from: 4, to: 4, text: 'Drag each snack to the animal who eats it.' },
    { from: 5, to: 5, text: 'Give the animal the number of snacks shown by the dots and numeral, then ring the bell.' },
  ],
  finish: [
    { to: 2, text: 'The round ends after six snacks are eaten.' },
    { from: 3, to: 3, text: 'The round ends after four food questions are answered.' },
    { from: 4, to: 4, text: 'The round ends when all three animals have their snack.' },
    { from: 5, to: 5, text: 'The round ends after three animals receive the requested count, confirmed with the bell.' },
  ],
  note: 'Each animal she sees eating its favorite food is added to her discovery journal in the treehouse.',
};
