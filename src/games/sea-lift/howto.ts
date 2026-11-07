import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Run the sea lift: take friends to their stops above and below the water.',
  steps: [
    { from: 1, to: 1, text: 'A friend asks to go some stops above or below the water; tap that stop.' },
    { from: 2, to: 2, text: 'A friend in the lift asks to go some stops up or down; the ride goes through the water, so tap where it ends.' },
    { from: 3, to: 3, text: 'Pick up the friends in order, deepest or highest first, as asked: tap the stop a friend waits on.' },
    { from: 4, to: 4, text: 'Two friends wait at two stops; tap the card that says how many stops apart they are. The ride counts it out.' },
    { from: 5, to: 5, text: "A friend in the lift has a twin just as far from the water on the other side; tap the twin's stop." },
    'Tap the friend card to hear the friend again.',
  ],
  finish: 'Every friend is where they wanted to be.',
  note: [
    { from: 1, to: 3, text: "The water line is zero; stops below it are numbers below zero, said as 'below the water'. A wrong stop is one miss: the lift goes there and the friend counts it out; after two misses the right stop glows, which counts as a hint, and a third wrong stop sends the lift there by itself. Hearing a friend again or watching a ride never counts." },
    { from: 4, to: 4, text: 'A wrong card is one miss: the lift rides it out, counting to the water and on, and the card dims; after two misses the right card glows, which counts as a hint. Hearing a friend again never counts.' },
    { from: 5, to: 5, text: "A friend at the water is their own twin. A wrong stop is one miss: the lift goes there and the friend says how far each is from the water; after two misses the twin's stop glows, which counts as a hint, and a third wrong stop sends the lift there by itself." },
  ],
};
