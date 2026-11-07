import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pay for things with shell coins.',
  steps: [
    { to: 3, text: 'Tap coins onto the counter to add up the price, then ring the bell.' },
    { from: 4, to: 4, text: 'Add the two prices, tap coins onto the counter to pay for both, then ring the bell.' },
    { from: 5, to: 5, text: 'Pay the price and ring the bell, then buy another one at the same price and pay a different way with other coins, ringing the bell again.' },
    { from: 6, to: 6, text: 'The customer pays 10: tap coins onto the counter to give the change, then ring the bell.' },
    { from: 7, to: 7, text: 'Tap coins onto the counter to pay the price with as few shells as you can, then ring the bell; tap a coin on the mat to put it back and swap it.' },
  ],
  note: [
    { text: 'The stall sells fruit, flowers or balloons; the shell coins work the same at each stall.' },
    { to: 2, text: 'Each coin shows its worth as dots, like the dots on the price tag. Tap a coin on the mat to put it back. Two misses show a payment; help counts once per order.' },
    { from: 3, to: 3, text: 'Each coin shows its worth as dots, like the dots on the price tag. Tap a coin on the mat to put it back. Two misses bring a tip (biggest coin first) and show a payment; help counts once per order.' },
    { from: 4, to: 4, text: 'Tap a coin on the mat to put it back. Two misses show a payment; help counts once per order.' },
    { from: 5, to: 5, text: 'Tap a coin on the mat to put it back. Two misses bring a tip (biggest coin first, or swap coins for the second way) and show a payment; help counts once per order, including when you pay two different ways.' },
    { from: 6, to: 6, text: 'Tap a coin on the mat to put it back. Two misses show a payment; help counts once per order.' },
    { from: 7, to: 7, text: 'Tap a coin on the mat to put it back. Two misses bring a tip (biggest coin first) and show a payment; help counts once per order.' },
  ],
  finish: [
    { to: 5, text: 'The round ends when the right amount has been paid.' },
    { from: 6, to: 6, text: 'The round ends when the right change has been given.' },
    { from: 7, to: 7, text: 'The round ends when the price has been paid with the fewest shells.' },
  ],
};
