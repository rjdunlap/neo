import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Look at the Moon through the window and notice how its lit part changes.',
  steps: [
    { from: 1, to: 1, text: 'Press the big button to see how the Moon looks a few days on.' },
    { from: 1, to: 1, text: 'Tap a picture along the bottom to hear it again.' },
    { from: 2, to: 2, text: 'Tap the card that looks the same as the Moon in the window.' },
    { from: 3, to: 3, text: 'Tap the Moon that shows more light, or less, as asked.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'Three looks, then a sticker.' },
    { from: 2, to: 3, text: 'Every card answered.' },
  ],
  note: [
    { from: 1, to: 1, text: 'Each view is a few days after the one before; the game never reads today\'s date and never asks you to come back on another night. There is nothing here to get wrong: finishing shows she looked, not that she knows why the Moon changes.' },
    { from: 2, to: 2, text: 'Each view is a few days after the one before. A wrong card is one miss, and then the right card glows; Show a hint before trying counts as a hint.' },
    { from: 3, to: 3, text: 'More light means more of the Moon is lit, not a brighter Moon. A wrong card is one miss, and then the right card glows; Show a hint before trying counts as a hint.' },
  ],
};
