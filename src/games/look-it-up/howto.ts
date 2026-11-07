import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Use the picture guide to find out about each animal, then help it.',
  steps: [
    { from: 1, to: 1, text: 'Touch a word on the page to hear it.' },
    { from: 2, to: 2, text: "Tap the animal's face on a tab to turn to its page, then give it the food the page shows." },
    { from: 3, to: 3, text: "Tap the animal's tab, touch the food or place picture in its box, then help it." },
  ],
  finish: 'Every visitor has been helped.',
  note: [
    { from: 1, to: 3, text: 'The facts are real and come from zoos and wildlife groups.' },
    { from: 1, to: 1, text: 'Nothing can go wrong here.' },
    { from: 2, to: 3, text: 'Turning pages is always free; only a wrong food or place given to the animal is a miss, and after two misses the right tab or picture glows, which counts as a hint.' },
  ],
};
